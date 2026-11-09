import { createSystem } from "../sfc/system.js";

/**
 * LP, "liquidity preference" (Godley and Lavoie, 2007, ch. 5), as sfcr's vignette writes it (Macalós, MIT): PC with
 * long-term bonds. The government also issues perpetuities, each paying 1 a period, at a price pbl the central bank
 * sets; the households split their expected wealth between money, bills and bonds after the rates and the expected
 * capital gain, and spend out of the income they expect (the period before's). A bond's price falls when the long rate
 * rises: the capital loss enters the wealth. The block of ÉCO's debt: the maturity of what the state issues.
 */
export const LP = createSystem({
  name: "LP",
  equations: `
    Y ~ C + G
    YDr ~ Y - TX + rb[-1] * Bh[-1] + BLh[-1]
    TX ~ theta * (Y + rb[-1] * Bh[-1] + BLh[-1])
    V ~ V[-1] + (YDr - C) + CG
    CG ~ (pbl - pbl[-1]) * BLh[-1]
    C ~ alpha1 * YDEr + alpha2 * V[-1]
    VE ~ V[-1] + (YDEr - C) + CG
    Hh ~ V - Bh - pbl * BLh
    Hd ~ VE - Bd - pbl * BLd
    Bd ~ (VE * lambda20) + VE * (lambda22 * rb + lambda23 * ERrbl) + lambda24 * (YDEr)
    BLd ~ VE * (lambda30 + lambda32 * rb + lambda33 * ERrbl + lambda34 * (YDEr/VE))/pbl
    Bh ~ Bd
    BLh ~ BLd
    Bs ~ Bs[-1] + (G + rb[-1] * Bs[-1] + BLs[-1]) - (TX + rb[-1] * Bcb[-1]) - (d(BLs) * pbl)
    Hs ~ Hs[-1] + d(Bcb)
    Bcb ~ Bs - Bh
    BLs ~ BLh
    ERrbl ~ rbl + chi * ((pebl - pbl)/pbl)
    rbl ~ 1/pbl
    pebl ~ pbl
    CGE ~ chi * (pebl - pbl) * BLh
    YDEr ~ YDr[-1]
  `,
  external: {
    G: 20, rb: 0.03, pbl: 20, theta: 0.1938, alpha1: 0.8, alpha2: 0.2,
    lambda20: 0.44196, lambda22: 1.1, lambda23: -1, lambda24: -0.03,
    lambda30: 0.3997, lambda32: -1, lambda33: 1.1, lambda34: -0.03, chi: 0.1,
  },
  matrices: {
    sectors: ["households", "firms", "government", "centralBank"],
    flows: [
      { key: "consumption", cells: { households: "-C", firms: "+C" } },
      { key: "purchases", cells: { firms: "+G", government: "-G" } },
      { key: "income", cells: { households: "+Y", firms: "-Y" } },
      { key: "interest", cells: { households: "+rb[-1] * Bh[-1]", government: "-rb[-1] * Bs[-1]", centralBank: "+rb[-1] * Bcb[-1]" } },
      { key: "coupons", cells: { households: "+BLh[-1]", government: "-BLs[-1]" } },
      { key: "profits", cells: { government: "+rb[-1] * Bcb[-1]", centralBank: "-rb[-1] * Bcb[-1]" } },
      { key: "taxes", cells: { households: "-TX", government: "+TX" } },
      { key: "money", cells: { households: "-d(Hh)", centralBank: "+d(Hs)" } },
      { key: "bills", cells: { households: "-d(Bh)", government: "+d(Bs)", centralBank: "-d(Bcb)" } },
      { key: "bonds", cells: { households: "-d(BLh) * pbl", government: "+d(BLs) * pbl" } },
    ],
    stocks: [
      { key: "money", cells: { households: "+Hh", centralBank: "-Hs" } },
      { key: "bills", cells: { households: "+Bh", government: "-Bs", centralBank: "+Bcb" } },
      { key: "bonds", cells: { households: "+BLh * pbl", government: "-BLs * pbl" } },
      { key: "netWorth", cells: { households: "-V", government: "+V" } },
    ],
  },
});
