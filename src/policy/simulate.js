import { ECO } from "../eco/model.js";
import { crisisOf } from "../crises/families.js";
import { assertConsistent, createLedger } from "../sfc/ledger.js";
import { createRule, inflationOf, yearOf } from "./rules.js";

/**
 * A rule against a crisis, on ÉCO: from its starting quarter, `periods` quarters (40, ten years: Sami, 6/11, Q-S2),
 * the crisis's shocks each quarter, the rule's levers, decided at the end of the quarter before. The loop is closed:
 * the rule sees what the model did. Every quarter the ledger checks the matrices, unless `check` is false.
 *
 * @typedef {{ family: "calm" | "unemployment" | "materials", seed: number, rule: "R0" | "R1" | "R2" | "R2s" | "R2n",
 *   periods?: number, check?: boolean }} Trial
 */

/** The levers and the starting figures a rule needs from ÉCO's first quarter. */
function startOf(model, state) {
  const at = (name) => state[model.V[name]];
  const history = { at: (name) => at(name) };
  const { deficit, gap } = yearOf(history, 0);
  return {
    rcb: model.DEFAULTS.rcb, gshare: model.DEFAULTS.gshare, piT: model.DEFAULTS.piT,
    point: at("GDP") / 100 / (at("p") * at("yfe")), structural: deficit + 0.63 * gap,
  };
}

/**
 * Plays `trial`: its states, period 0 the start, and the levers of each quarter.
 *
 * @param {Trial} trial
 */
export function simulate({ family, seed, rule: name, periods = 40, check = true }, model = /** @type {import("../types.js").Model} */ (ECO)) {
  const width = model.VARS.length;
  const states = new Float64Array((periods + 1) * width);
  const state = model.emptyState();
  states.set(state, 0);
  const history = { at: (name, t) => states[t * width + model.V[name]] };
  const rule = createRule(name, startOf(model, state));
  const shocks = crisisOf(family, seed, periods);
  const ledger = check ? createLedger(model.SPEC) : null;
  const params = { ...model.DEFAULTS };
  const levers = { rcb: new Float64Array(periods + 1).fill(params.rcb), gshare: new Float64Array(periods + 1).fill(params.gshare) };
  for (let t = 1; t <= periods; t += 1) {
    Object.assign(params, shocks[t], rule.levers());
    model.step(params, state);
    states.set(state, t * width);
    if (ledger) assertConsistent(ledger, state, t, states.subarray((t - 1) * width, t * width));
    levers.rcb[t] = params.rcb;
    levers.gshare[t] = params.gshare;
    rule.decide(history, t);
  }
  return { model, periods, states, levers, at: history.at, state: (t) => states.subarray(t * width, (t + 1) * width) };
}

/**
 * The objectives of a played trial (docs/modele.md, § 8), each measured on quarters 1 to `periods`, in points:
 * unemployment (its mean and its peak), inflation over four quarters (its mean distance to 2 % and its peak), the
 * debt (a share of the last year's GDP at the end, and its rise); beside them, the mean output gap, the quarters at the
 * rate's floor and how much the levers moved.
 *
 * @param {ReturnType<typeof simulate>} played
 */
export function objectivesOf({ at, periods, levers }) {
  const sums = { u: 0, uPeak: 0, gap: 0, inflation: 0, inflationPeak: -Infinity, floor: 0, moves: 0 };
  for (let t = 1; t <= periods; t += 1) {
    const inflation = inflationOf({ at }, t);
    sums.u += at("u", t);
    sums.uPeak = Math.max(sums.uPeak, at("u", t));
    sums.gap += at("gap", t);
    sums.inflation += Math.abs(inflation - 0.02);
    sums.inflationPeak = Math.max(sums.inflationPeak, inflation);
    if (levers.rcb[t] <= 0) sums.floor += 1;
    sums.moves += Math.abs(levers.rcb[t] - levers.rcb[t - 1]) + Math.abs(levers.gshare[t] - levers.gshare[t - 1]);
  }
  const debt = (t) => at("DEBT", t) / (at("GDP", t) + at("GDP", t - 1) + at("GDP", t - 2) + at("GDP", t - 3));
  const startDebt = at("DEBT", 0) / (4 * at("GDP", 0));
  return {
    unemployment: (100 * sums.u) / periods, unemploymentPeak: 100 * sums.uPeak,
    inflationGap: (100 * sums.inflation) / periods, inflationPeak: 100 * sums.inflationPeak,
    debt: 100 * debt(periods), debtRise: 100 * (debt(periods) - startDebt),
    outputGap: (100 * sums.gap) / periods, floorQuarters: sums.floor, leverMoves: sums.moves,
  };
}
