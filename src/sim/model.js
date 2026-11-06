/**
 * SIM, the simplest model of Godley and Lavoie (*Monetary Economics*, 2007, ch. 3), in sfcr's notation: households,
 * firms and a government, one money, issued by the government when it spends more than it levies. The supplies follow
 * the demands (Cs = Cd, Gs = Gd, Ts = Td, Ns = Nd), so each pair is one variable here.
 *
 * A period: the income solved at once from the money held before, Y = (G + α2 · Hh₋₁) / (1 − α1 (1 − θ)), then the
 * employment, the wages, the tax, the disposable income, the consumption, and the two stocks of money: the one the
 * government issued and the one the households hold. That they stay equal is the hidden equation: written nowhere,
 * checked by the ledger (src/sfc/ledger.js) every period.
 *
 * The state is a Float64Array, a variable at each index of VARS; a step writes it in place and allocates nothing.
 *
 * @typedef {import("../types.js").SimParams} SimParams
 */

/** The variables of SIM's state, in their order in the array. */
export const VARS = Object.freeze(["Y", "T", "YD", "C", "G", "N", "WN", "Hh", "Hs", "dHh", "dHs"]);

/** The index of each variable of VARS. */
export const V = Object.freeze(Object.fromEntries(VARS.map((name, i) => [name, i])));

/** The book's values (ch. 3; sfcr's sim and MacroStat's SIM give the same). */
export const DEFAULTS = Object.freeze({ G: 20, W: 1, alpha1: 0.6, alpha2: 0.4, theta: 0.2 });

/**
 * Throws unless `params` make a model that settles: 0 < θ ≤ 1, 0 < α2, 0 ≤ α1 < 1, W > 0, G ≥ 0.
 *
 * @param {SimParams} params
 */
export function assertParams({ G, W, alpha1, alpha2, theta }) {
  const fine = G >= 0 && W > 0 && alpha1 >= 0 && alpha1 < 1 && alpha2 > 0 && theta > 0 && theta <= 1;
  if (!fine) throw new Error(`sim: parameters out of range (G ${G}, W ${W}, α1 ${alpha1}, α2 ${alpha2}, θ ${theta})`);
}

/** A state at zero: no money yet, the book's starting point (Table 3.4). */
export const emptyState = () => new Float64Array(VARS.length);

/**
 * The stationary state of `params`: Y* = G / θ, whatever the households' propensities; then no saving, YD* = C*, and
 * the money that makes it so, H* = (1 − α1) · YD* / α2.
 *
 * @param {SimParams} params
 */
export function steadyState(params) {
  assertParams(params);
  const { G, W, alpha1, alpha2, theta } = params;
  const state = emptyState();
  const output = G / theta;
  const disposable = output * (1 - theta);
  const money = ((1 - alpha1) * disposable) / alpha2;
  state[V.Y] = output;
  state[V.T] = G;
  state[V.YD] = disposable;
  state[V.C] = disposable;
  state[V.G] = G;
  state[V.N] = output / W;
  state[V.WN] = output;
  state[V.Hh] = money;
  state[V.Hs] = money;
  return state;
}

/**
 * One period of SIM, in place: `state` holds the period before (its money is Hh₋₁ and Hs₋₁) and then this one.
 *
 * @param {SimParams} params
 * @param {Float64Array} state
 */
export function step({ G, W, alpha1, alpha2, theta }, state) {
  const heldBefore = state[V.Hh];
  const income = (G + alpha2 * heldBefore) / (1 - alpha1 * (1 - theta));
  const employment = income / W;
  const wages = W * employment;
  const tax = theta * wages;
  const disposable = wages - tax;
  const consumption = alpha1 * disposable + alpha2 * heldBefore;
  state[V.G] = G;
  state[V.N] = employment;
  state[V.WN] = wages;
  state[V.T] = tax;
  state[V.YD] = disposable;
  state[V.C] = consumption;
  // Output is what is sold; the firms' column of the transactions checks it against the wages paid.
  state[V.Y] = consumption + G;
  state[V.dHs] = G - tax;
  state[V.dHh] = disposable - consumption;
  state[V.Hs] += state[V.dHs];
  state[V.Hh] += state[V.dHh];
}
