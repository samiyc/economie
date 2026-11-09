import { createSystem } from "../sfc/system.js";
import { EQUATIONS } from "./growth-equations.js";
import { EXTERNAL, INITIAL } from "./growth-values.js";

/**
 * GROWTH (Godley and Lavoie, 2007, ch. 11), as sfcr's vignette writes it (Macalós, MIT): a growing economy with
 * households, firms, banks, a government and a central bank. The firms grow their capital the faster the more they use
 * it and the cheaper real credit is (11.7), price at a mark-up on the normal historic unit cost, and finance their
 * investment by retained earnings, equities and loans; the workers aim at a real wage that rises with employment; the
 * banks set their rates to keep their liquidity and their own funds. The block of ÉCO's firms.
 */
export const GROWTH = createSystem({
  name: "GROWTH",
  equations: EQUATIONS,
  external: EXTERNAL,
  initial: INITIAL,
  matrices: {
    sectors: ["households", "firms", "firmsCapital", "government", "centralBank", "centralBankCapital", "banks", "banksCapital"],
    flows: [
      { key: "consumption", cells: { households: "-CONS", firms: "+CONS" } },
      { key: "purchases", cells: { firms: "+G", government: "-G" } },
      { key: "investment", cells: { firms: "+INV", firmsCapital: "-INV" } },
      { key: "inventories", cells: { firms: "+(IN - IN[-1])", firmsCapital: "-(IN - IN[-1])" } },
      { key: "taxes", cells: { households: "-TX", government: "+TX" } },
      { key: "wages", cells: { households: "+WB", firms: "-WB" } },
      { key: "inventoryInterest", cells: { firms: "-Rl[-1] * IN[-1]", banks: "+Rl[-1] * IN[-1]" } },
      { key: "firmsProfits", cells: { households: "+FDf", firms: "-Ff", firmsCapital: "+FUf", banks: "+Rl[-1] * (Lfs[-1] - IN[-1] - NPL)" } },
      { key: "banksProfits", cells: { households: "+FDb", banks: "-Fb", banksCapital: "+FUb" } },
      { key: "householdInterest", cells: { households: "-Rl[-1] * Lhd[-1]", banks: "+Rl[-1] * Lhs[-1]" } },
      { key: "depositInterest", cells: { households: "+Rm[-1] * Mh[-1]", banks: "-Rm[-1] * Ms[-1]" } },
      { key: "billInterest", cells: { households: "+Rb[-1] * Bhd[-1]", government: "-Rb[-1] * Bs[-1]", centralBank: "+Rb[-1] * Bcbd[-1]", banks: "+Rb[-1] * Bbd[-1]" } },
      { key: "centralBankProfits", cells: { government: "+Fcb", centralBank: "-Fcb" } },
      { key: "coupons", cells: { households: "+BLd[-1]", government: "-BLd[-1]" } },
      { key: "loans", cells: { households: "+(Lhd - Lhd[-1])", firmsCapital: "+(Lfd - Lfd[-1])", banksCapital: "-(Ls - Ls[-1])" } },
      { key: "cash", cells: { households: "-(Hhd - Hhd[-1])", centralBankCapital: "+(Hs - Hs[-1])", banksCapital: "-(Hbd - Hbd[-1])" } },
      { key: "deposits", cells: { households: "-(Mh - Mh[-1])", banksCapital: "+(Ms - Ms[-1])" } },
      { key: "bills", cells: { households: "-(Bhd - Bhd[-1])", government: "+(Bs - Bs[-1])", centralBankCapital: "-(Bcbd - Bcbd[-1])", banksCapital: "-(Bbd - Bbd[-1])" } },
      { key: "bonds", cells: { households: "-(BLd - BLd[-1]) * Pbl", government: "+(BLs - BLs[-1]) * Pbl" } },
      { key: "equities", cells: { households: "-(Ekd - Ekd[-1]) * Pe", firmsCapital: "+(Eks - Eks[-1]) * Pe" } },
      { key: "defaults", cells: { firmsCapital: "+NPL", banksCapital: "-NPL" } },
    ],
    stocks: [
      { key: "inventories", cells: { firms: "+IN" }, total: "+IN" },
      { key: "capital", cells: { firms: "+K" }, total: "+K" },
      { key: "cash", cells: { households: "+Hhd", centralBank: "-Hs", banks: "+Hbd" } },
      { key: "deposits", cells: { households: "+Mh", banks: "-Ms" } },
      { key: "bills", cells: { households: "+Bhd", government: "-Bs", centralBank: "+Bcbd", banks: "+Bbd" } },
      { key: "bonds", cells: { households: "+BLd * Pbl", government: "-BLs * Pbl" } },
      { key: "loans", cells: { households: "-Lhd", firms: "-Lfd", banks: "+Ls" } },
      { key: "equities", cells: { households: "+Ekd * Pe", firms: "-Eks * Pe" } },
      { key: "bankCapital", cells: { households: "+OFb", banks: "-OFb" } },
      { key: "netWorth", cells: { households: "-V", firms: "-Vf", government: "+GD" }, total: "-(IN + K)" },
    ],
  },
});
