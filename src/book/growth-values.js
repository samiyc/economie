/**
 * GROWTH's values (Godley and Lavoie, 2007, ch. 11), as sfcr's vignette sets them (Macalós, MIT): its parameters and
 * exogenous variables, and its initial values, the book's stationary growth path (src/book/growth.js).
 *
 * One correction: the households' wealth V, and their investible wealth Vfma, as their parts add up. The vignette's
 * are rounded 0.0377 short; the households' money, a residual, would then leak that much at the first period, and the
 * banks' bills (the hidden equation) carry it, growing with the economy.
 */

export const EXTERNAL = Object.freeze({
  alpha1: 0.75, alpha2: 0.064, beta: 0.5, betab: 0.4, gamma: 0.15, gamma0: 0.00122, gammar: 0.1, gammau: 0.05,
  delta: 0.10667, deltarep: 0.1, eps: 0.5, eps2: 0.8, epsb: 0.25, epsrb: 0.9, eta0: 0.07416, etan: 0.6, etar: 0.4,
  theta: 0.22844, lambda20: 0.25, lambda21: 2.2, lambda22: 6.6, lambda23: 2.2, lambda24: 2.2, lambda25: 0.1,
  lambda30: -0.04341, lambda31: 2.2, lambda32: 2.2, lambda33: 6.6, lambda34: 2.2, lambda35: 0.1, lambda40: 0.67132,
  lambda41: 2.2, lambda42: 2.2, lambda43: 2.2, lambda44: 6.6, lambda45: 0.1, lambdab: 0.0153, lambdac: 0.05,
  xim1: 0.0008, xim2: 0.0007, ro: 0.05, sigman: 0.1666, sigmat: 0.2, psid: 0.15255, psiu: 0.92, omega0: -0.20594,
  omega1: 1, omega2: 2, omega3: 0.45621, ADDbl: 0.02, BANDt: 0.01, BANDb: 0.01, bot: 0.05, GRg: 0.03, GRpr: 0.03,
  Nfe: 87.181, NCAR: 0.1, NPLk: 0.02, Rbbar: 0.035, Rln: 0.07, RA: 0, top: 0.12,
});

const ROUNDED = {
  sigmase: 0.16667, eta: 0.04918, phi: 0.26417, phit: 0.26417, ADDbl: 0.02, BANDt: 0.01, BANDb: 0.01, bot: 0.05,
  GRg: 0.03, GRpr: 0.03, Nfe: 87.181, NCAR: 0.1, NPLk: 0.02, Rbbar: 0.035, Rln: 0.07, RA: 0, top: 0.12,
  ADDl: 0.04592, BLR: 0.1091, BUR: 0.06324, Ck: 7334240, CAR: 0.09245, CONS: 52603100, ER: 1, Fb: 1744130,
  Fbt: 1744140, Ff: 18081100, Fft: 18013600, FDb: 1325090, FDf: 2670970, FUb: 419039, FUf: 15153800, FUft: 15066200,
  G: 16755600, Gk: 2336160, GL: 2775900, GRk: 0.03001, INV: 16911600, Ik: 2357910, N: 87.181, Nt: 87.181,
  NHUC: 5.6735, NL: 683593, NLk: 95311, NPL: 309158, NPLke: 0.02, NUC: 5.6106, omegat: 112852, P: 7.1723,
  Pbl: 18.182, Pe: 17937, PE: 5.07185, PI: 0.0026, PR: 138659, PSBR: 1894780, Q: 0.77443, Rb: 0.035, Rbl: 0.055,
  Rk: 0.03008, Rl: 0.06522, Rm: 0.0193, REP: 2092310, RRl: 0.06246, S: 86270300, Sk: 12028300, Ske: 12028300,
  TX: 17024100, U: 0.70073, UC: 5.6106, W: 777968, WB: 67824000, Y: 86607700, Yk: 12088400, YDr: 56446400,
  YDkr: 7813270, YDkre: 7813290, YP: 73158700, z1a: 0, z1b: 0, z2a: 0, z2b: 0, Bbd: 4389790, Bbs: 4389790,
  Bcbd: 4655690, Bcbs: 4655690, Bhd: 33439320, Bhs: 33439320, Bs: 42484800, BLd: 840742, BLs: 840742, GD: 57728700,
  Ekd: 5112.6001, Eks: 5112.6001, Hbd: 2025540, Hbs: 2025540, Hhd: 2630150, Hhs: 2630150, Hs: 4655690, IN: 11585400,
  INk: 2064890, INke: 2405660, INkt: 2064890, K: 127486471, Kk: 17774838, Lfd: 15962900, Lfs: 15962900,
  Lhd: 21606600, Lhs: 21606600, Ls: 37569500, Mh: 40510800, Ms: 40510800, OFb: 3474030, OFbe: 3474030, OFbt: 3638100,
  V: 165438779, Vfma: 159334599, Vk: 23066350, Vf: 31361792,
};

const wealth = ROUNDED.Hhd + ROUNDED.Mh + ROUNDED.Bhd + ROUNDED.BLd * ROUNDED.Pbl + ROUNDED.Ekd * ROUNDED.Pe + ROUNDED.OFb - ROUNDED.Lhd;

export const INITIAL = Object.freeze({ ...ROUNDED, V: wealth, Vfma: wealth - ROUNDED.Hhd - ROUNDED.OFb });
