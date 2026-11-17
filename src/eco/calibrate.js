import { ASSUMED, TARGETS } from "./targets.js";

/**
 * ÉCO's starting quarter and parameters, from France's proportions (targets.js). The quarter's GDP is 100, its prices
 * 1; the year it ends grew at the target's inflation and the productivity's growth, so that the quarter before is
 * this one deflated (`back`). Each step fills the starting state, then each behaviour's free parameter is the one that
 * makes its equation hold at the start: the consumption's α1, the mark-up, the share paid in dividends… The start is
 * then a snapshot, not a stationary state: its deficit makes the debt grow faster than the GDP, as France's does
 * (Sami, 6/11, Q-S2).
 *
 * Every step reads `z`, what the steps before found, and gives what it adds.
 */

const Q = 100;

/** The growth of a year, as a quarter's: prices, volumes, nominal values. */
function growth(t, a) {
  const prices = (1 + t.inflation) ** 0.25 - 1;
  return { prices, nominal: (1 + prices) * (1 + a.gpr) - 1 };
}

/** The demand, the imports, the product taxes; the starting prices are 1, so a real quantity is its value. */
function demand(t, a) {
  const [G, I, X, E] = [t.purchases * Q, t.investment * Q, t.exports * Q, t.energy * Q];
  const IM = t.imports * Q - E;
  const TC = t.productTaxes * Q;
  const C = Q - G - I - X + IM + E;
  const s = C - TC + G + I + X;
  const mup = (IM - a.mug * G) / (C - TC + I + X);
  const tight = 1 + a.mut * Math.max(a.un / t.unemployment - 1, 0);
  return { G, g: G, I, i: I, X, x: X, E, IM, im: IM, TC, C, c: C - TC, s, S: s, tauc: TC / (C - TC), mup, mu: mup / tight,
    muavg: IM / s, me: E / s, Y: s - IM - E };
}

/** The workers, their wage and productivity; the potential output at the structural unemployment. */
function labour(t, a, z) {
  const N = t.labourForce * (1 - t.unemployment);
  const WB = t.wages * Q;
  const W = WB / N;
  const pr = z.Y / N;
  const yfe = pr * t.labourForce * (1 - a.un);
  const uc = ((1 - z.muavg - z.me) * W) / pr + z.muavg + z.me;
  return { N, Nt: N, u: t.unemployment, WB, W, pr, y: z.Y, yfe, gap: z.Y / yfe - 1, uc, phi: 1 / uc - 1, gshare: z.g / yfe };
}

/**
 * The money: the loans, the debt and its two halves, the reserves, and the deposits they add up to; the bonds the
 * foreigners hold (`foreign`, a share of the debt: none at a fixed rate) and those left to the households.
 */
function money(t, a, foreign) {
  const DEBT = t.debt * 4 * Q;
  const Bs = t.billsShare * DEBT;
  const L = t.loans * 4 * Q;
  const or = t.reserves * 4 * Q;
  const M = L + Bs + or;
  const Hb = a.rho * M;
  const Bb = M - L - Hb;
  const rates = { rb: a.rcb / 4, rl: (a.rcb + a.sl) / 4, rm: Math.max(a.rcb - a.sm, 0) / 4, rbl: (a.rcb + a.tp) / 4 };
  const BLw = foreign * DEBT;
  return { ...rates, DEBT, Bs, BL: DEBT - Bs, BLw, BLh: DEBT - Bs - BLw, L, or, M, Hb, Hs: Hb, Bb, Bcb: Bs - Bb, V: M + DEBT - Bs - BLw };
}

/** The state's accounts: its interest fixes the average coupon; its spending and levies, the transfers and fees. */
function state(t, a, z, back) {
  const INT = t.interest * Q;
  const Fcb = z.rb * back(z.Bcb);
  const rbar = (INT - z.rb * back(z.Bs) + Fcb) / back(z.BL);
  const [PEN, UB, SUB] = [t.pensions * Q, t.unemploymentBenefits * Q, t.subsidies * Q];
  const TO = t.spending * Q - z.G - PEN - UB - SUB - INT;
  const T = t.levies * Q;
  const ORV = t.spending * Q - t.deficit * Q - T;
  const [TF, TK] = [t.corporateTax * Q, t.capitalTax * Q];
  const TW = T - z.TC - TF - TK;
  const nominal = z.yfe;
  return { INT, Fcb, rbar, PEN, UB, SUB, SUBE: 0, TO, T, ORV, TF, TK, TW, SPEND: t.spending * Q, DEF: t.deficit * Q,
    tauw: TW / z.WB, tos: TO / nominal, subs: SUB / nominal, orv: ORV / z.Y, pen: PEN / t.retirees,
    rr: UB / ((1 - TW / z.WB) * z.W * (t.labourForce - z.N)) };
}

/**
 * The firms' accounts: the profits, the earnings from abroad that close the current account (net of the coupons the
 * foreigners get), the dividends.
 */
function firms(t, z, back) {
  const FU = z.I - (z.L - back(z.L));
  const before = z.S - z.IM - z.E + z.SUB - z.WB - z.rl * back(z.L);
  // F = before + FDin, FDw = share × (F − TF − FU), and CA = X − IM − E − FDw + FDin − coupons: FDin solves the three.
  const share = t.foreignControl;
  const abroad = z.rbar * back(z.BLw);
  const FDin = (t.currentAccount * Q - z.X + z.IM + z.E + abroad + share * (before - z.TF - FU)) / (1 - share);
  const F = before + FDin;
  const FD = F - z.TF - FU;
  return { FU, FDin, F, FD, FDw: share * FD, FDh: (1 - share) * FD, CA: t.currentAccount * Q, fshare: share,
    fin: FDin / z.yfe, tauf: z.TF / F, psid: FD / back(F - z.TF) };
}

/** The households: the banks' profits they get, their income, the α1 that makes their consumption, their bonds. */
function households(a, z, back, rise) {
  const Fb = z.rl * back(z.L) + z.rb * back(z.Bb) - z.rm * back(z.M);
  const capitalIncome = z.FDh + Fb + z.rm * back(z.M) + z.rbar * back(z.BLh);
  const YD = z.WB - z.TW + z.UB + z.PEN + z.TO - z.ORV + capitalIncome - z.TK;
  const pc = 1 + z.tauc;
  const vBefore = back(z.V) / (pc / (1 + rise.prices));
  const ydr = (YD - (pc - pc / (1 + rise.prices)) * vBefore) / pc;
  return { Fb, tauk: z.TK / capitalIncome, YD, pc, v: z.V / pc, ydr, yde: ydr, alpha1: (z.c - a.alpha2 * vBefore) / ydr,
    lb0: z.BLh / z.V - a.lb1 * (z.rbl - z.rm) };
}

/** The capital, its wear, the utilization that is normal, and the growth the investment aims at. */
function capital(t, a, z, rise) {
  const k = t.capital * 4 * Q;
  const before = k / (1 + a.gpr);
  const rrl = (1 + z.rl) / (1 + rise.prices) - 1;
  return { k, kappa: before / z.y, delta: (z.i - (k - before)) / before, ucap: 1, rrl, rrl0: rrl, gk: a.gpr, gk0: a.gpr };
}

/** The prices at 1, growing at the target; the wage that grows with them and the productivity. */
function prices(t, a, z, rise) {
  const q = rise.prices;
  return { p: 1, pm: 1, pew: 1, pe: 1, pwb: 1, yw: 1, xw: z.x, piw: q, pic: q, pi1: q, pi2: q, pi3: q, pia: q, pie: q,
    gw: q + a.gpr, piT: t.inflation };
}

/** The parameters and exogenous variables of ÉCO's equations, with the shocks at rest. */
const EXTERNAL_KEYS = ["gpr", "un", "piT", "chi", "phil", "piw", "mu", "mut", "mug", "me", "phi", "tauc", "gshare", "xw", "epsx", "kappa",
  "gk0", "rrl0", "iota", "gammau", "gammar", "gammac", "delta", "eps", "alpha1", "alpha2", "lb0", "lb1", "fin", "tauf", "psid",
  "fshare", "rcb", "sl", "sm", "rho", "rr", "tauw", "idx", "tos", "subs", "orv", "tauk", "tp", "mat", "etan"];
const AT_REST = { Lf: 0, Ret: 0, xr: 1, wpush: 0, pmshock: 1, eshock: 1, shield: 0, mpush: 0, xshock: 1, conf: 0, lock: 0 };

/**
 * The floating regime's start (src/eco/floating.js): the rate at 1, the foreigners wanting the bonds they hold at
 * equal rates (`lw0` of their wealth, the world's long rate ours), their wealth's trend the one that keeps the rate
 * still as the current account changes their bonds; the rate is no longer external.
 */
function floatingStart(a, z) {
  const { xr } = AT_REST;
  const Ww = z.BLw / (xr * a.lw0);
  return {
    values: { xr, Ww, BLwd: Ww * a.lw0, dxre: 0, ka: Ww * (a.lw0 - a.lw1 * a.thx), kb: Ww * a.lw1 * a.thx },
    external: { ptm: a.ptm, epsm: a.epsm, thx: a.thx, lw0: a.lw0, lw1: a.lw1, rwl: a.rcb + a.tp, gww: -z.CA / z.BLw },
  };
}

/**
 * ÉCO's start: the parameters (`external`) and the starting quarter (`values`, every variable), from `targets` and
 * `assumed`.
 *
 * @param {Record<string, number>} [targets]
 * @param {Record<string, number>} [assumed]
 * @param {"fixed" | "floating"} [regime]
 */
export function calibrate(targets = TARGETS, assumed = ASSUMED, regime = "fixed") {
  const rise = growth(targets, assumed);
  const back = (value) => value / (1 + rise.nominal);
  const z = { ...assumed };
  Object.assign(z, demand(targets, assumed));
  Object.assign(z, labour(targets, assumed, z));
  Object.assign(z, money(targets, assumed, regime === "floating" ? targets.foreignHolders : 0));
  Object.assign(z, state(targets, assumed, z, back));
  Object.assign(z, firms(targets, z, back));
  Object.assign(z, households(assumed, z, back, rise));
  Object.assign(z, capital(targets, assumed, z, rise));
  Object.assign(z, prices(targets, assumed, z, rise));
  Object.assign(z, { GDP: Q, Y: z.Y, Lf: targets.labourForce, Ret: targets.retirees });
  const external = { ...AT_REST, ...Object.fromEntries(EXTERNAL_KEYS.map((key) => [key, z[key]])), Lf: targets.labourForce, Ret: targets.retirees };
  if (regime === "fixed") return { external, values: z };
  const floating = floatingStart(assumed, z);
  delete external.xr;
  return { external: { ...external, ...floating.external }, values: { ...z, ...floating.values } };
}
