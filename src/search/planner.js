import { createClimb } from "mcts-commun/climb.js";
import { streamOf } from "mcts-commun/random.js";
import { LIMITS, taylor, TEXTBOOK } from "../policy/rules.js";
import { createRollout } from "./rollout.js";

/**
 * The rolling-horizon planner (docs/modele.md, § 9, J6): at the end of each quarter, a plan of the state's purchases
 * over the `horizon` quarters to come, climbed (mcts-commun's `createClimb`, `budget` plans scored) on `count` futures
 * drawn from what it knows of the crisis (src/crises/families.js, `beliefOf`), common to every plan of the decision.
 * It plays the plan's first quarter, and starts again a quarter later from that plan, shifted. Its horizon is six years
 * (H): on three, a cut's unemployment counted twelve quarters and the debt it saved in full, and the planner cut too
 * much, losing to Taylor alone; on ten, it plays as on six, twice as slowly (docs/recherche.md).
 *
 * The central bank is independent (Sami, 10/11): its rate follows the textbooks' Taylor, in the world as in the
 * futures, where the planner knows the rule. ÉCO makes a low rate cost next to nothing (docs/recherche.md), and a
 * planner holding the rate kept it at 0.
 *
 * A plan is `horizon` − 1 genes in [−1, 1], the purchases' moves: a point of GDP at most a quarter, within 5 points
 * of their start. As for a rule, the purchases of the next quarter were voted the quarter before: the plan's first
 * move is spent in two quarters. A plan pays `jerk` for each move squared, in points of GDP (H, § 5): never in the
 * measure.
 *
 * @typedef {{ unemployment: number, inflationGap: number, debt: number }} Weights
 * @typedef {{ model: import("../types.js").Model, weights: Weights, budget: number, count?: number, horizon?: number, jerk?: number }} PlannerShape
 */

/** The climb's problem over a plan of `genes` numbers in [−1, 1]: hold the purchases first, a few genes moved, shifted. */
function problemOf(genes, score) {
  const clamp = (x) => Math.max(-1, Math.min(1, x));
  return {
    start: (plan) => plan.fill(0),
    score,
    mutate: (child, best, amplitude, rng) => {
      child.set(best);
      const moves = 1 + rng.int(3);
      for (let m = 0; m < moves; m += 1) {
        const i = rng.int(genes);
        child[i] = clamp(best[i] + 0.5 * amplitude * rng.normal());
      }
    },
    fresh: (plan, rng) => {
      for (let i = 0; i < genes; i += 1) plan[i] = 2 * rng.next() - 1;
    },
    shift: (next, last) => {
      for (let i = 0; i < genes; i += 1) next[i] = i === genes - 1 ? last[i] : last[i + 1];
    },
  };
}

/** The purchases a plan stands for, from those voted: quarters t + 1 on. */
function decode(plan, voted, { horizon, step, band, gshares }) {
  let g = voted;
  gshares[0] = g;
  for (let q = 1; q < horizon; q += 1) {
    g = Math.min(band[1], Math.max(band[0], g + step * plan[q - 1]));
    gshares[q] = g;
  }
}

/** What a plan's moves cost in jerk: each move of the purchases squared, in points of GDP. */
function jerkOf(spent, { horizon, point, gshares }) {
  let total = 0;
  let g = spent;
  for (let q = 0; q < horizon; q += 1) {
    total += ((gshares[q] - g) / point) ** 2;
    g = gshares[q];
  }
  return total;
}

/**
 * A planner for a run, as a rule is (src/policy/rules.js): `levers()` for the next quarter, `decide(h, t, state)` at
 * the end of quarter `t`. `start` is the run's first quarter; `belief` what it knows of the crisis; `seed` its own draws.
 *
 * @param {PlannerShape} shape
 * @param {{ start: { rcb: number, gshare: number, piT: number, point: number }, belief: ReturnType<typeof import("../crises/families.js").beliefOf>, seed: number, periods: number }} run
 */
export function createPlanner({ model, weights, budget, count = 16, horizon = 24, jerk = 0.05 }, { start, belief, seed, periods }) {
  const bank = { neutral: start.rcb - start.piT, inflation: TEXTBOOK.inflation, gap: TEXTBOOK.gap };
  const rollout = createRollout(model, { horizon, count, periods, weights, taylor: bank });
  const climb = createClimb({ genes: horizon - 1 });
  const rng = streamOf(seed, 2);
  const band = [start.gshare - LIMITS.spendingBand * 100 * start.point, start.gshare + LIMITS.spendingBand * 100 * start.point];
  const now = { rcb: start.rcb, gshare: start.gshare, voted: start.gshare };
  const shape = { horizon, step: 0, band, point: start.point, gshares: new Float64Array(horizon) };
  const before = new Float64Array(3);
  const at = { state: /** @type {Float64Array<ArrayBufferLike>} */ (new Float64Array(0)) };
  const score = (plan) => {
    decode(plan, now.voted, shape);
    const loss = rollout.loss({ state: at.state, rate: now.rcb, gshares: shape.gshares, before });
    return -(loss + jerk * jerkOf(now.gshare, shape));
  };
  const problem = problemOf(horizon - 1, score);
  return {
    levers: () => ({ rcb: now.rcb, gshare: now.gshare }),
    /** @param {{ at: (name: string, t: number) => number }} h @param {number} t @param {Float64Array} state */
    decide(h, t, state) {
      now.rcb = taylor(h, t, now.rcb, bank);
      at.state = state;
      for (let i = 0; i < 3; i += 1) before[i] = h.at("GDP", Math.max(0, t - 2 + i));
      shape.point = h.at("GDP", t) / 100 / (h.at("p", t) * h.at("yfe", t));
      shape.step = LIMITS.spendingStep * 100 * shape.point;
      belief.futures({ t, count, horizon, rng, out: rollout.futures });
      const { plan } = climb.run(problem, { budget, rng });
      decode(plan, now.voted, shape);
      [now.gshare, now.voted] = [now.voted, shape.gshares[1]];
    },
  };
}
