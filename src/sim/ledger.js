import { createLedger } from "../sfc/ledger.js";
import { V } from "./model.js";

/**
 * SIM's two matrices (Godley and Lavoie, 2007, Tables 3.1 and 3.2). The transactions: each flow is paid by one sector
 * (−) and received by another (+); the change in money is a use for the households, who acquire it, and a source for
 * the government, which issues it. Its row reads two variables, dHh and dHs: that it sums to zero is the hidden
 * equation. The balance sheet: the money is the households' asset and the government's liability.
 */
export const SIM_SPEC = /** @type {import("../types.js").LedgerSpec} */ ({
  name: "SIM",
  sectors: ["households", "firms", "government"],
  flows: [
    { key: "consumption", cells: [["households", -1, V.C], ["firms", 1, V.C]] },
    { key: "purchases", cells: [["firms", 1, V.G], ["government", -1, V.G]] },
    { key: "wages", cells: [["households", 1, V.WN], ["firms", -1, V.WN]] },
    { key: "taxes", cells: [["households", -1, V.T], ["government", 1, V.T]] },
    { key: "money", cells: [["households", -1, V.dHh], ["government", 1, V.dHs]] },
  ],
  stocks: [
    { key: "money", cells: [["households", 1, V.Hh], ["government", -1, V.Hs]] },
    { key: "netWorth", cells: [["households", -1, V.Hh], ["government", 1, V.Hs]] },
  ],
});

/** A ledger for SIM: its own typed arrays, one a run. */
export const createSimLedger = () => createLedger(SIM_SPEC);
