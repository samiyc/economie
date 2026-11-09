import { VARS as PC_VARS, assertParams, settle, steadyState as pcSteadyState } from "./model.js";

/**
 * PCEX (Godley and Lavoie, 2007, § 4.6 and 4.7): PC whose households do not know their income in advance. They spend
 * and choose their bills on the income they expect, YDe; the money takes up the surprise, Hh = V − Bh, and differs from
 * the money they wanted, Hd = Ve − Bd. The expectation here is the book's adaptive one (its PCEX1): this period's
 * income as the last one, YDe = YD₋₁. (The book's PCEX itself adds a random error to it, which only R's generator would
 * replay; a seeded one can come with the crises.)
 *
 * A period, solved in order: the consumption from what is known, C = α1 · YDe + α2 · V₋₁; the income Y = C + G; the
 * tax, the disposable income and the wealth as in PC; the wealth expected, Ve = V₋₁ + YDe − C, and the bills wanted,
 * Bd = Ve (λ0 + λ1 · r) − λ2 · YDe, which the households get (Bh = Bd). Its state is PC's, then three more variables:
 * PC's matrices read it unchanged.
 *
 * @typedef {import("../types.js").PcParams} PcParams
 */

/** PC's variables, then the expected income, the expected wealth and the money the households wanted. */
export const VARS = Object.freeze([...PC_VARS, "YDe", "Ve", "Hd"]);

/** The index of each variable of VARS. */
export const V = Object.freeze(Object.fromEntries(VARS.map((name, i) => [name, i])));

/** A state at zero. */
export const emptyState = () => new Float64Array(VARS.length);

/**
 * PC's stationary state, where every expectation comes true.
 *
 * @param {PcParams} params
 */
export function steadyState(params) {
  const state = emptyState();
  state.set(pcSteadyState(params), 0);
  state[V.YDe] = state[V.YD];
  state[V.Ve] = state[V.V];
  state[V.Hd] = state[V.Hh];
  return state;
}

/**
 * One period of PCEX, in place.
 *
 * @param {PcParams} params
 * @param {Float64Array} state
 */
export function step({ G, alpha1, alpha2, theta, lambda0, lambda1, lambda2, r }, state) {
  const expected = state[V.YD];
  const wealthBefore = state[V.V];
  const interest = state[V.r] * state[V.Bh];
  const consumption = alpha1 * expected + alpha2 * wealthBefore;
  const income = consumption + G;
  const tax = theta * (income + interest);
  const disposable = income - tax + interest;
  const wealth = wealthBefore + disposable - consumption;
  const expectedWealth = wealthBefore + expected - consumption;
  const bills = expectedWealth * (lambda0 + lambda1 * r) - lambda2 * expected;
  settle(G, state, { tax, wealth, bills });
  state[V.G] = G;
  state[V.T] = tax;
  state[V.YD] = disposable;
  state[V.C] = consumption;
  state[V.Y] = income;
  state[V.r] = r;
  state[V.YDe] = expected;
  state[V.Ve] = expectedWealth;
  state[V.Hd] = expectedWealth - bills;
}

export { assertParams };
