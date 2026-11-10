import { createBeam } from "mcts-commun/beam.js";
import { streamOf } from "mcts-commun/random.js";
import { LIMITS, taylor, TEXTBOOK } from "../policy/rules.js";
import { UNITS } from "../policy/tuning.js";

/**
 * The beam planner (docs/modele.md, § 9, 3, J6): the climb's question asked to mcts-commun's other search. At the end
 * of each quarter, a beam over the purchases of the `horizon` quarters to come, each quarter one of five moves (−1,
 * −0.5, 0, +0.5, +1 point of GDP: the discrete levers of § 9), on the same `count` futures as the climb draws
 * (src/crises/families.js, `beliefOf`), all played in each node. The central bank follows the textbooks' Taylor in
 * every future. A node's reward is the quarters' loss (src/search/rollout.js's); its value, what is left to the
 * horizon if its last quarter went on: its unemployment and inflation each quarter, its deficit added to its debt.
 * At the horizon, the debt it ends with, as the climb counts it. Valued on its debt alone, a node that spent looked
 * better halfway (the GDP rises before the debt does), and the beam kept only spenders (docs/recherche.md).
 *
 * A node is a Float64Array: the purchases spent and voted, then for each future its rate, its last four GDP and the
 * model's state. Nothing is allocated once created.
 *
 * @typedef {{ model: import("../types.js").Model, weights: { unemployment: number, inflationGap: number, debt: number }, width: number, count?: number, horizon?: number, jerk?: number }} BeamShape
 */

const MOVES = [-1, -0.5, 0, 0.5, 1];
const HEAD = 2;
const EXTRA = 5;

/** The shared pieces of a beam planner: the model's buffer, its parameters, the futures, the loss's scales. */
function contextOf({ model, weights, count, horizon }, periods) {
  const width = model.VARS.length;
  const size = count * horizon;
  /** @type {any} */
  const c = {
    model, V: model.V, width, count, horizon, stride: width + EXTRA,
    buffer: new Float64Array(width), params: { ...model.DEFAULTS },
    futures: { conf: new Float64Array(size), xshock: new Float64Array(size), eshock: new Float64Array(size), pmshock: new Float64Array(size) },
    scale: {
      u: (100 * weights.unemployment) / UNITS.unemployment / periods,
      pi: (100 * weights.inflationGap) / UNITS.inflationGap / periods,
      debt: (100 * weights.debt) / UNITS.debt,
    },
    step: 0, band: [0, 0], point: 1, jerk: 0, bank: null,
  };
  c.seen = { at: (name) => c.buffer[c.V[name]] };
  return c;
}

/** Future `k` of `node` a quarter on (quarter `q` of the plan), its purchases `g`: the quarter's loss. */
function advance(c, node, k, { q, g }) {
  const { buffer, params, futures, V, width } = c;
  const o = HEAD + k * c.stride;
  for (let i = 0; i < width; i += 1) buffer[i] = node[o + EXTRA + i];
  const at = k * c.horizon + q;
  params.conf = futures.conf[at];
  params.xshock = futures.xshock[at];
  params.eshock = futures.eshock[at];
  params.pmshock = futures.pmshock[at];
  params.rcb = node[o];
  params.gshare = g;
  c.model.step(params, buffer);
  node[o] = taylor(c.seen, 0, node[o], c.bank);
  node.copyWithin(o + 1, o + 2, o + 5);
  node[o + 4] = buffer[V.GDP];
  for (let i = 0; i < width; i += 1) node[o + EXTRA + i] = buffer[i];
  const inflation = (1 + buffer[V.pic]) * (1 + buffer[V.pi1]) * (1 + buffer[V.pi2]) * (1 + buffer[V.pi3]) - 1;
  return c.scale.u * buffer[V.u] + c.scale.pi * Math.abs(inflation - 0.02);
}

/** What future `o` of `node` leaves to the horizon, `left` quarters on, if its last quarter went on. */
function leftOf({ V, scale }, node, o, left) {
  const s = o + EXTRA;
  const inflation = (1 + node[s + V.pic]) * (1 + node[s + V.pi1]) * (1 + node[s + V.pi2]) * (1 + node[s + V.pi3]) - 1;
  const quarter = scale.u * node[s + V.u] + scale.pi * Math.abs(inflation - 0.02);
  const year = node[o + 1] + node[o + 2] + node[o + 3] + node[o + 4];
  return left * quarter + (scale.debt * (node[s + V.DEBT] + left * node[s + V.DEF])) / year;
}

/** The beam's problem: a quarter played on every future of a node, the next quarter's purchases voted. */
function problemOf(c) {
  return {
    play: (parent, child, action, depth) => {
      const g = child[1];
      const voted = Math.min(c.band[1], Math.max(c.band[0], g + c.step * MOVES[action]));
      const jerk = c.jerk * ((g - child[0]) / c.point) ** 2;
      [child[0], child[1]] = [g, voted];
      let loss = 0;
      for (let k = 0; k < c.count; k += 1) loss += advance(c, child, k, { q: depth - 1, g });
      return -(loss / c.count + jerk);
    },
    value: (node, depth) => {
      let total = 0;
      for (let k = 0; k < c.count; k += 1) total += leftOf(c, node, HEAD + k * c.stride, c.horizon - depth);
      return -total / c.count;
    },
  };
}

/** The root: the purchases spent and voted, each future from the run's state, its rate and its last GDP. */
function rootOf(c, root, { now, state, h, t }) {
  [root[0], root[1]] = [now.gshare, now.voted];
  for (let k = 0; k < c.count; k += 1) {
    const o = HEAD + k * c.stride;
    root[o] = now.rcb;
    for (let i = 0; i < 4; i += 1) root[o + 1 + i] = h.at("GDP", Math.max(0, t - 3 + i));
    root.set(state, o + EXTRA);
  }
}

/**
 * A beam planner for a run, as a rule is: `levers()` for the next quarter, `decide(h, t, state)` at the end of `t`.
 *
 * @param {BeamShape} shape
 * @param {{ start: { rcb: number, gshare: number, piT: number, point: number }, belief: ReturnType<typeof import("../crises/families.js").beliefOf>, seed: number, periods: number }} run
 */
export function createBeamPlanner({ model, weights, width, count = 16, horizon = 24, jerk = 0.05 }, { start, belief, seed, periods }) {
  const c = contextOf({ model, weights, count, horizon }, periods);
  c.bank = { neutral: start.rcb - start.piT, inflation: TEXTBOOK.inflation, gap: TEXTBOOK.gap };
  c.band = [start.gshare - LIMITS.spendingBand * 100 * start.point, start.gshare + LIMITS.spendingBand * 100 * start.point];
  c.jerk = jerk;
  const size = HEAD + count * c.stride;
  const beam = createBeam({ size, width, actions: MOVES.length, Type: Float64Array });
  const root = new Float64Array(size);
  const problem = problemOf(c);
  const rng = streamOf(seed, 2);
  const now = { rcb: start.rcb, gshare: start.gshare, voted: start.gshare };
  return {
    levers: () => ({ rcb: now.rcb, gshare: now.gshare }),
    /** @param {{ at: (name: string, t: number) => number }} h @param {number} t @param {Float64Array} state */
    decide(h, t, state) {
      now.rcb = taylor(h, t, now.rcb, c.bank);
      c.point = h.at("GDP", t) / 100 / (h.at("p", t) * h.at("yfe", t));
      c.step = LIMITS.spendingStep * 100 * c.point;
      belief.futures({ t, count, horizon, rng, out: c.futures });
      rootOf(c, root, { now, state, h, t });
      const { first } = beam.run(root, problem, { depth: horizon });
      const voted = Math.min(c.band[1], Math.max(c.band[0], now.voted + c.step * MOVES[first < 0 ? 2 : first]));
      [now.gshare, now.voted] = [now.voted, voted];
    },
  };
}
