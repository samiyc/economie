/**
 * PC, "portfolio choice" (Godley and Lavoie, *Monetary Economics*, 2007, ch. 4), in sfcr's notation: SIM's households,
 * firms and government, and a central bank. The government issues bills; the households split their wealth between
 * money and bills, the more to bills the higher the rate; the central bank buys the bills the households do not want
 * and issues the money against them. The rate on bills is the central bank's: the first monetary lever.
 *
 * A period, solved in order: the income at once from the stocks held before,
 * Y = (G + α2 · V₋₁ + α1 (1 − θ) · r₋₁ · Bh₋₁) / (1 − α1 (1 − θ)); then the tax on income and interest, the disposable
 * income, the consumption and the wealth; the bills the households want, Bh = V (λ0 + λ1 · r) − λ2 · YD, the money
 * as the rest, Hh = V − Bh; the government's debt, the central bank's bills, and the money it issued. That the money
 * held equals the money issued is the hidden equation, checked by the ledger every period.
 *
 * The flows the matrices read (the interest each sector pays or gets, each stock's change) are variables of the state
 * too, so that the ledger reads them as SIM's. A step writes in place and allocates nothing.
 *
 * @typedef {import("../types.js").PcParams} PcParams
 */

/** The variables of PC's state, in their order in the array. */
export const VARS = Object.freeze([
  "Y", "T", "YD", "C", "G", "V", "Hh", "Bh", "Bs", "Bcb", "Hs", "r",
  "iBh", "iBs", "iBcb", "dHh", "dHs", "dBh", "dBs", "dBcb",
]);

/** The index of each variable of VARS. */
export const V = Object.freeze(Object.fromEntries(VARS.map((name, i) => [name, i])));

/** The book's values (ch. 4), as sfcr's and MacroStat's PC give them. */
export const DEFAULTS = Object.freeze({ G: 20, alpha1: 0.6, alpha2: 0.4, theta: 0.2, lambda0: 0.635, lambda1: 5, lambda2: 0.01, r: 0.025 });

/**
 * Throws unless `params` make a model that can settle: SIM's bounds, λ0, λ1, λ2 ≥ 0, and a rate 0 ≤ r < 1 (below
 * zero waits for Sami's answer, Q-S8).
 *
 * @param {PcParams} params
 */
export function assertParams({ G, alpha1, alpha2, theta, lambda0, lambda1, lambda2, r }) {
  const within = (value, low, high) => value >= low && value < high;
  const spending = G >= 0 && within(alpha1, 0, 1) && alpha2 > 0 && theta > 0 && theta <= 1;
  const portfolio = Math.min(lambda0, lambda1, lambda2) >= 0 && within(r, 0, 1);
  if (!(spending && portfolio)) {
    throw new Error(`pc: parameters out of range (G ${G}, α1 ${alpha1}, α2 ${alpha2}, θ ${theta}, λ ${lambda0}/${lambda1}/${lambda2}, r ${r})`);
  }
}

/** A state at zero: no wealth, no debt, the book's starting point. */
export const emptyState = () => new Float64Array(VARS.length);

/**
 * The stationary state of `params`. Nothing is saved, YD* = C*, so V* = (1 − α1) · YD* / α2 and Bh* = k · YD*, with
 * k = (λ0 + λ1 · r) (1 − α1) / α2 − λ2; the budget balances once the interest is counted,
 * G + r · Bh* = θ (Y* + r · Bh*), with Y* = YD* + G: hence YD* = (1 − θ) · G / (θ − (1 − θ) · r · k). The central bank
 * holds as many bills as there is money (its net worth is zero). Throws when the interest grows faster than the tax
 * can follow (no stationary state).
 *
 * @param {PcParams} params
 */
export function steadyState(params) {
  assertParams(params);
  const { G, alpha1, alpha2, theta, lambda0, lambda1, lambda2, r } = params;
  const k = ((lambda0 + lambda1 * r) * (1 - alpha1)) / alpha2 - lambda2;
  const room = theta - (1 - theta) * r * k;
  if (Number.isNaN(room) || room <= 0) throw new Error(`pc: no stationary state, the interest outgrows the tax (r ${r}, θ ${theta})`);
  const disposable = ((1 - theta) * G) / room;
  const state = emptyState();
  const values = { YD: disposable, C: disposable, G, Y: disposable + G, V: ((1 - alpha1) * disposable) / alpha2, r };
  values.Bh = k * disposable;
  values.Hh = values.V - values.Bh;
  Object.assign(values, { Hs: values.Hh, Bcb: values.Hh, Bs: values.Bh + values.Hh, T: theta * (values.Y + r * values.Bh) });
  Object.assign(values, { iBh: r * values.Bh, iBs: r * values.Bs, iBcb: r * values.Bcb });
  for (const [name, value] of Object.entries(values)) state[V[name]] = value;
  return state;
}

/**
 * The government, the central bank and their stocks, once the households have chosen: the debt grows by the deficit
 * net of the interest the central bank hands back, the central bank takes the bills the households left, and issues
 * the money that pays for them. `state` still holds the stocks before; the households' are written after.
 *
 * @param {number} G
 * @param {Float64Array} state
 * @param {{ tax: number, wealth: number, bills: number }} households
 */
export function settle(G, state, { tax, wealth, bills }) {
  const rate = state[V.r];
  const debt = state[V.Bs] + G + rate * state[V.Bs] - tax - rate * state[V.Bcb];
  const held = debt - bills;
  state[V.iBh] = rate * state[V.Bh];
  state[V.iBs] = rate * state[V.Bs];
  state[V.iBcb] = rate * state[V.Bcb];
  state[V.dBs] = debt - state[V.Bs];
  state[V.dBh] = bills - state[V.Bh];
  state[V.dBcb] = held - state[V.Bcb];
  state[V.dHs] = state[V.dBcb];
  state[V.dHh] = wealth - bills - state[V.Hh];
  state[V.Bs] = debt;
  state[V.Bh] = bills;
  state[V.Bcb] = held;
  state[V.Hs] += state[V.dHs];
  state[V.Hh] = wealth - bills;
  state[V.V] = wealth;
}

/**
 * One period of PC, in place: `state` holds the period before (r₋₁, Bh₋₁, V₋₁…), then this one.
 *
 * @param {PcParams} params
 * @param {Float64Array} state
 */
export function step({ G, alpha1, alpha2, theta, lambda0, lambda1, lambda2, r }, state) {
  const interest = state[V.r] * state[V.Bh];
  const wealthBefore = state[V.V];
  const income = (G + alpha2 * wealthBefore + alpha1 * (1 - theta) * interest) / (1 - alpha1 * (1 - theta));
  const tax = theta * (income + interest);
  const disposable = income - tax + interest;
  const consumption = alpha1 * disposable + alpha2 * wealthBefore;
  const wealth = wealthBefore + disposable - consumption;
  const bills = wealth * (lambda0 + lambda1 * r) - lambda2 * disposable;
  settle(G, state, { tax, wealth, bills });
  state[V.G] = G;
  state[V.T] = tax;
  state[V.YD] = disposable;
  state[V.C] = consumption;
  // Output is what is sold; the firms' column checks it against the income they pay out.
  state[V.Y] = consumption + G;
  state[V.r] = r;
}
