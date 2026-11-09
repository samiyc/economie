import { createSystem } from "../sfc/system.js";

/**
 * DISINF, "disequilibrium and inflation" (Godley and Lavoie, 2007, ch. 9), as sfcr's vignette writes it (Macalós,
 * MIT): firms that produce for the sales they expect and keep inventories, financed by loans; prices a mark-up φ on the
 * unit cost; wages that chase a real wage the workers aim at, the higher the employment; a loan rate that keeps its
 * real value (rl follows the inflation of costs); households who spend out of their real income, inflation's loss on
 * their money counted. The block of ÉCO's prices and wages: the conflict of the two claims.
 *
 * One change to the vignette, so that the matrices close: the firms pay, and the households receive, the interest at
 * the rate of the period before (the vignette takes this period's), as the banks book it and as DIS does. Both
 * solvers run the corrected equations (scripts/reference/sfcr.R).
 */
export const DISINF = createSystem({
  name: "DISINF",
  equations: `
    y ~ s_E + inv_E - inv[-1]
    inv_T ~ sigma_T * s_E
    inv_E ~ inv[-1] + gamma * (inv_T - inv[-1])
    inv ~ inv[-1] + (y - s)
    s_E ~ beta * s[-1] + (1 - beta) * s_E[-1]
    s ~ c
    N ~ y / pr
    WB ~ N * W
    UC ~ WB / y
    INV ~ inv * UC
    S ~ p * s
    p ~ (1 + phi) * (1 + rrc * sigma_T) * UC
    EF ~ S - WB + (INV - INV[-1]) - rl[-1] * INV[-1]
    Ld ~ INV
    Ls ~ Ld
    Ms ~ Ls
    rm ~ rl - add
    EFb ~ rl[-1] * Ls[-1] - rm[-1] * Mh[-1]
    pic ~ (UC / UC[-1]) - 1
    rl ~ (1 + rrc) * (1 + pic) - 1
    YD ~ WB + EF + EFb + rm[-1] * Mh[-1]
    Mh ~ Mh[-1] + YD - C
    ydhs ~ c + (mh - mh[-1])
    yd ~ YD / p
    C ~ c * p
    mh ~ Mh / p
    c ~ alpha0 + alpha1 * ydhs_E + alpha2 * mh[-1]
    ydhs_E ~ epsilon * ydhs[-1] + (1 - epsilon) * ydhs_E[-1]
    omega_T ~ Omega0 + Omega1 * pr + Omega2 * (N / Nfe)
    W ~ W[-1] * (1 + Omega3 * (omega_T[-1] - (W[-1]/p[-1])))
    yfe ~ (1 + sigma_T) * s - inv[-1]
    Nfe ~ s / pr
  `,
  external: {
    rrc: 0.025, pr: 1, add: 0.02, alpha0: 15, alpha1: 0.8, alpha2: 0.1, beta: 0.9, epsilon: 0.8, gamma: 0.25,
    phi: 0.24, sigma_T: 0.2, Omega0: -1.4, Omega1: 1, Omega2: 1.2, Omega3: 0.3,
  },
  initial: { p: 1, W: 1, UC: 1 },
  matrices: {
    sectors: ["households", "firms", "firmsCapital", "banks", "banksCapital"],
    flows: [
      { key: "consumption", cells: { households: "-C", firms: "+C" } },
      { key: "inventories", cells: { firms: "+d(INV)", firmsCapital: "-d(INV)" } },
      { key: "wages", cells: { households: "+WB", firms: "-WB" } },
      { key: "loanInterest", cells: { firms: "-rl[-1] * Ld[-1]", banks: "+rl[-1] * Ls[-1]" } },
      { key: "firmsProfits", cells: { households: "+EF", firms: "-EF" } },
      { key: "banksProfits", cells: { households: "+EFb", banks: "-EFb" } },
      { key: "depositInterest", cells: { households: "+rm[-1] * Mh[-1]", banks: "-rm[-1] * Mh[-1]" } },
      { key: "loans", cells: { firmsCapital: "+d(Ld)", banksCapital: "-d(Ls)" } },
      { key: "deposits", cells: { households: "-d(Mh)", banksCapital: "+d(Ms)" } },
    ],
    stocks: [
      { key: "deposits", cells: { households: "+Mh", banks: "-Ms" } },
      { key: "loans", cells: { firms: "-Ld", banks: "+Ls" } },
      { key: "inventories", cells: { firms: "+INV" }, total: "+INV" },
      { key: "netWorth", cells: { households: "-Mh" }, total: "-Mh" },
    ],
  },
});
