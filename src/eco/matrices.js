/**
 * ÉCO's two matrices, in sfcr's notation: six sectors, the firms' current and capital accounts in one column (their
 * investment, bought from themselves, nets out there; the loans show how they finance it). The bonds are held at
 * their face value: the coupon of each is fixed when issued, and the average one, rbar, follows the long rate as the
 * debt rolls over (LP's perpetuities would revalue the whole debt at each move of the rate).
 *
 * The hidden equation is the reserves' row: the money the central bank issued (src/eco/equations.js, Hs) is the money
 * the banks hold (Hb). The foreign reserves are a claim on the rest of the world; the firms' capital, valued at the
 * period's price, is the one real asset.
 */
export const MATRICES = {
  sectors: ["households", "firms", "government", "centralBank", "banks", "world"],
  flows: [
    { key: "consumption", cells: { households: "-C", firms: "+p * c", government: "+TC" } },
    { key: "purchases", cells: { firms: "+G", government: "-G" } },
    { key: "exports", cells: { firms: "+X", world: "-X" } },
    { key: "imports", cells: { firms: "-IM", world: "+IM" } },
    { key: "energy", cells: { firms: "-E", world: "+E" } },
    { key: "wages", cells: { households: "+WB", firms: "-WB" } },
    { key: "subsidies", cells: { firms: "+SUB + SUBE", government: "-SUB - SUBE" } },
    { key: "loanInterest", cells: { firms: "-rl[-1] * L[-1]", banks: "+rl[-1] * L[-1]" } },
    { key: "dividends", cells: { households: "+FDh", firms: "-FD + FDin", world: "+FDw - FDin" } },
    { key: "corporateTax", cells: { firms: "-TF", government: "+TF" } },
    { key: "bankProfits", cells: { households: "+Fb", banks: "-Fb" } },
    { key: "depositInterest", cells: { households: "+rm[-1] * M[-1]", banks: "-rm[-1] * M[-1]" } },
    { key: "billInterest", cells: { banks: "+rb[-1] * Bb[-1]", government: "-rb[-1] * Bs[-1]", centralBank: "+rb[-1] * Bcb[-1]" } },
    { key: "coupons", cells: { households: "+rbar[-1] * BL[-1]", government: "-rbar[-1] * BL[-1]" } },
    { key: "profits", cells: { government: "+Fcb", centralBank: "-Fcb" } },
    { key: "taxes", cells: { households: "-TW - TK - ORV", government: "+TW + TK + ORV" } },
    { key: "benefits", cells: { households: "+UB + PEN + TO", government: "-UB - PEN - TO" } },
    { key: "deposits", cells: { households: "-d(M)", banks: "+d(M)" } },
    { key: "loans", cells: { firms: "+d(L)", banks: "-d(L)" } },
    { key: "bills", cells: { banks: "-d(Bb)", government: "+d(Bs)", centralBank: "-d(Bcb)" } },
    { key: "bonds", cells: { households: "-d(BL)", government: "+d(BL)" } },
    { key: "money", cells: { banks: "-d(Hb)", centralBank: "+d(Hs)" } },
    { key: "foreignReserves", cells: { centralBank: "-xr * d(or)", world: "+xr * d(or)" } },
  ],
  stocks: [
    { key: "deposits", cells: { households: "+M", banks: "-M" } },
    { key: "loans", cells: { firms: "-L", banks: "+L" } },
    { key: "bills", cells: { banks: "+Bb", government: "-Bs", centralBank: "+Bcb" } },
    { key: "bonds", cells: { households: "+BL", government: "-BL" } },
    { key: "money", cells: { banks: "+Hb", centralBank: "-Hs" } },
    { key: "foreignReserves", cells: { centralBank: "+xr * or", world: "-xr * or" } },
    { key: "capital", cells: { firms: "+p * k" }, total: "+p * k" },
    { key: "netWorth", cells: { households: "-V", firms: "-(p * k - L)", government: "+DEBT", world: "+xr * or" }, total: "-p * k" },
  ],
};
