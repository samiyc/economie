import { createSystem } from "../sfc/system.js";

/**
 * BMW, "bank-money world" (Godley and Lavoie, 2007, ch. 7), as sfcr's vignette writes it (Macalós, MIT): no state,
 * households who hold deposits, firms who borrow to invest, banks who lend what the firms ask and pay on deposits the
 * rate they charge on loans. The firms aim at a stock of capital proportional to the output before, κ · Y₋₁, and close
 * a share γ of the gap each period, besides replacing what wears out (δ). The block of ÉCO's banks and investment.
 *
 * The firms' and banks' current and capital accounts are columns of their own, as in the book's Table 7.1: the
 * investment and the depreciation go from one to the other.
 */
export const BMW = createSystem({
  name: "BMW",
  equations: `
    Cs ~ Cd
    Is ~ Id
    Ns ~ Nd
    Ls ~ Ls[-1] + Ld - Ld[-1]
    Y ~ Cs + Is
    WBd ~ Y - rl[-1] * Ld[-1] - AF
    AF ~ delta * K[-1]
    Ld ~ Ld[-1] + Id - AF
    YD ~ WBs + rm[-1] * Mh[-1]
    Mh ~ Mh[-1] + YD - Cd
    Ms ~ Ms[-1] + Ls - Ls[-1]
    rm ~ rl
    WBs ~ W * Ns
    Nd ~ Y / pr
    W ~ WBd / Nd
    Cd ~ alpha0 + alpha1 * YD + alpha2 * Mh[-1]
    K ~ K[-1] + Id - DA
    DA ~ delta * K[-1]
    KT ~ kappa * Y[-1]
    Id ~ gamma * (KT - K[-1]) + DA
  `,
  external: { rl: 0.025, alpha0: 20, alpha1: 0.75, alpha2: 0.1, delta: 0.1, gamma: 0.15, kappa: 1, pr: 1 },
  matrices: {
    sectors: ["households", "firms", "firmsCapital", "banks", "banksCapital"],
    flows: [
      { key: "consumption", cells: { households: "-Cs", firms: "+Cd" } },
      { key: "investment", cells: { firms: "+Is", firmsCapital: "-Id" } },
      { key: "wages", cells: { households: "+WBs", firms: "-WBd" } },
      { key: "depreciation", cells: { firms: "-AF", firmsCapital: "+AF" } },
      { key: "loanInterest", cells: { firms: "-rl[-1] * Ld[-1]", banks: "+rl[-1] * Ls[-1]" } },
      { key: "depositInterest", cells: { households: "+rm[-1] * Mh[-1]", banks: "-rm[-1] * Ms[-1]" } },
      { key: "loans", cells: { firmsCapital: "+d(Ld)", banksCapital: "-d(Ls)" } },
      { key: "deposits", cells: { households: "-d(Mh)", banksCapital: "+d(Ms)" } },
    ],
    stocks: [
      { key: "deposits", cells: { households: "+Mh", banks: "-Ms" } },
      { key: "loans", cells: { firms: "-Ld", banks: "+Ls" } },
      { key: "capital", cells: { firms: "+K" }, total: "+K" },
      { key: "netWorth", cells: { households: "-Mh" }, total: "-Mh" },
    ],
  },
});
