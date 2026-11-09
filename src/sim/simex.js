import { VARS as SIM_VARS, assertParams, steadyState as simSteadyState } from "./model.js";

/**
 * SIMEX (Godley and Lavoie, 2007, § 3.7): SIM whose households spend on the income they expect, YDe = YD₋₁, as they
 * cannot know this one's before they earn it. The money takes up the surprise: what they hold, Hh = Hh₋₁ + YD − C,
 * differs from what they meant to hold, Hd = Hh₋₁ + YDe − C, by YD − YDe. Its state is SIM's, then those two: SIM's
 * matrices read it unchanged.
 *
 * A period, in order: C = α1 · YDe + α2 · Hh₋₁, known at once; Y = C + G; then the tax, the income and the money, as
 * in SIM.
 *
 * @typedef {import("../types.js").SimParams} SimParams
 */

/** SIM's variables, then the expected income and the money the households wanted. */
export const VARS = Object.freeze([...SIM_VARS, "YDe", "Hd"]);

/** The index of each variable of VARS. */
export const V = Object.freeze(Object.fromEntries(VARS.map((name, i) => [name, i])));

/** A state at zero. */
export const emptyState = () => new Float64Array(VARS.length);

/**
 * SIM's stationary state, where the expectation comes true.
 *
 * @param {SimParams} params
 */
export function steadyState(params) {
  const state = emptyState();
  state.set(simSteadyState(params), 0);
  state[V.YDe] = state[V.YD];
  state[V.Hd] = state[V.Hh];
  return state;
}

/**
 * One period of SIMEX, in place.
 *
 * @param {SimParams} params
 * @param {Float64Array} state
 */
export function step({ G, W, alpha1, alpha2, theta }, state) {
  const expected = state[V.YD];
  const heldBefore = state[V.Hh];
  const consumption = alpha1 * expected + alpha2 * heldBefore;
  const income = consumption + G;
  const tax = theta * income;
  const disposable = income - tax;
  state[V.G] = G;
  state[V.N] = income / W;
  state[V.WN] = income;
  state[V.T] = tax;
  state[V.YD] = disposable;
  state[V.C] = consumption;
  state[V.Y] = income;
  state[V.YDe] = expected;
  state[V.Hd] = heldBefore + expected - consumption;
  state[V.dHs] = G - tax;
  state[V.dHh] = disposable - consumption;
  state[V.Hs] += state[V.dHs];
  state[V.Hh] += state[V.dHh];
}

export { assertParams };
