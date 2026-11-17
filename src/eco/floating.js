import { EQUATIONS } from "./equations.js";
import { MATRICES } from "./matrices.js";

/**
 * ÉCO's floating regime (docs/change-flottant.md, § 2): its fixed-rate equations and matrices, rewritten where OPEN
 * FLEX's blocks (src/book/openflex.js) differ. The foreigners hold part of the state's bonds (BLw), the households the
 * rest (BLh); the foreigners' bonds are those the current account leaves them, the central bank's reserves standing
 * still; and the rate `xr` (euros a unit of foreign currency) is what makes them want those bonds (12.89FL), their
 * demand following the gap between our long rate and the world's (12.68F), the expected change of the rate zero (H).
 * The import prices follow the rate in part (`ptm`, 12.21, H, Q-P19); the energy, priced in dollars, in full. The
 * imports lose volume as they grow dearer (`epsm`, 12.19, H, Q-P1): without it, the volumes of trade answering the
 * prices too little (the Marshall-Lerner condition), a fall of the rate would widen the deficit it came from, and the
 * rate would fall on.
 */

/** The fixed regime's equations replaced, by name: each by its lines in the floating one. */
const REPLACED = {
  im: ["im ~ (mup * (c + i + x) + mug * g) * (pm / p)^(-epsm)"],
  pm: ["pm ~ pmshock * (xr * pwb)^ptm * p^(1 - ptm)"],
  x: ["x ~ xw * yw * xshock * (xr * pwb / p)^epsx"],
  YD: ["YD ~ WB - TW + UB + PEN + TO - ORV + FDh + Fb + rm[-1] * M[-1] + rbar[-1] * BLh[-1] - TK"],
  BL: ["BLh ~ V * (lb0 + lb1 * (rbl - rm))", "BL ~ BLh + BLw"],
  M: ["M ~ V - BLh"],
  TK: ["TK ~ tauk * (FDh + Fb + rm[-1] * M[-1] + rbar[-1] * BLh[-1])"],
  CA: ["CA ~ X - IM - E - FDw + FDin - rbar[-1] * BLw[-1]"],
  or: ["or ~ or[-1]"],
};

/** The rest of the world when the rate floats, after the central bank. */
const ADDED = `
  # The rest of the world: its wealth; the bonds the current account leaves it (its coupons and our deficit of the
  # rest: the bonds less CA, written from the flows, CA, a small difference of large ones, leaving the cycle that
  # Gauss-Seidel solves); the rate that makes it want them (12.89FL), its demand following the gap of the rates and
  # the rise of our currency it expects (12.68F), a share thx of the real rate's gap to its start: xr · BLwd = BLw,
  # BLwd linear in xr, is the quadratic kb xr² + ka xr = BLw, solved here (iterated, its loop would diverge)
  Ww ~ Ww[-1] * (1 + gww)
  BLw ~ BLw[-1] * (1 + rbar[-1]) + IM + E + FDw - FDin - X
  ka ~ Ww * (lw0 + lw1 * (rbl - rwl / 4 - thx))
  kb ~ Ww * lw1 * thx * pwb / p
  xr ~ 2 * BLw / (ka + sqrt(ka^2 + 4 * kb * BLw))
  dxre ~ thx * (xr * pwb / p - 1)
  BLwd ~ Ww * (lw0 + lw1 * (rbl - rwl / 4 + dxre))
`;

/** `equations` with the lines of REPLACED swapped in, and ADDED at the end; throws if one is not found. */
function rewrite(equations) {
  const left = new Set(Object.keys(REPLACED));
  const lines = equations.split("\n").flatMap((line) => {
    const name = /^\s*(\w+)\s*~/.exec(line)?.[1];
    if (name === undefined || !(name in REPLACED)) return [line];
    left.delete(name);
    return REPLACED[name].map((text) => `  ${text}`);
  });
  if (left.size > 0) throw new Error(`floating: no equation ${[...left]} to replace`);
  return `${lines.join("\n")}${ADDED}`;
}

export const FLOATING_EQUATIONS = rewrite(EQUATIONS);

/** The cells that change, by row: the bonds and their coupons split between households and the world, the net worths. */
const CELLS = {
  flows: {
    coupons: { households: "+rbar[-1] * BLh[-1]", world: "+rbar[-1] * BLw[-1]", government: "-rbar[-1] * BL[-1]" },
    bonds: { households: "-d(BLh)", world: "-d(BLw)", government: "+d(BL)" },
  },
  stocks: {
    bonds: { households: "+BLh", world: "+BLw", government: "-BL" },
    // The central bank's reserves, still in foreign currency, are worth more when the rate falls: its net worth moves.
    netWorth: { centralBank: "-(Bcb + xr * or - Hs)", world: "+xr * or - BLw" },
  },
};

/** @param {{ key: string, cells: Record<string, string> }} row @param {Record<string, Record<string, string>>} changes */
const changed = (row, changes) => (changes[row.key] ? { ...row, cells: { ...row.cells, ...changes[row.key] } } : row);

export const FLOATING_MATRICES = {
  ...MATRICES,
  flows: MATRICES.flows.map((row) => changed(row, CELLS.flows)),
  stocks: MATRICES.stocks.map((row) => changed(row, CELLS.stocks)),
};
