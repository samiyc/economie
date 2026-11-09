import { V } from "./model.js";

/**
 * PC's two matrices (Godley and Lavoie, 2007, Tables 4.1 and 4.2), the central bank's current and capital accounts in
 * one column (each sums to zero on its own: it hands its interest back, and buys bills with the money it issues).
 *
 * The transactions: the interest on bills, paid by the government, received by the households and the central bank;
 * the central bank's profits, the same interest, back to the government; the change in money, acquired by the
 * households, issued by the central bank: that row is the hidden equation; the change in bills, issued by the
 * government, bought by the households and the central bank. The balance sheet: money, bills, and the net worth (the
 * households' wealth is the government's debt).
 */
export const PC_SPEC = /** @type {import("../types.js").LedgerSpec} */ ({
  name: "PC",
  sectors: ["households", "firms", "government", "centralBank"],
  flows: [
    { key: "consumption", cells: [["households", -1, V.C], ["firms", 1, V.C]] },
    { key: "purchases", cells: [["firms", 1, V.G], ["government", -1, V.G]] },
    { key: "income", cells: [["households", 1, V.Y], ["firms", -1, V.Y]] },
    { key: "interest", cells: [["households", 1, V.iBh], ["government", -1, V.iBs], ["centralBank", 1, V.iBcb]] },
    { key: "profits", cells: [["government", 1, V.iBcb], ["centralBank", -1, V.iBcb]] },
    { key: "taxes", cells: [["households", -1, V.T], ["government", 1, V.T]] },
    { key: "money", cells: [["households", -1, V.dHh], ["centralBank", 1, V.dHs]] },
    { key: "bills", cells: [["households", -1, V.dBh], ["government", 1, V.dBs], ["centralBank", -1, V.dBcb]] },
  ],
  stocks: [
    { key: "money", cells: [["households", 1, V.Hh], ["centralBank", -1, V.Hs]] },
    { key: "bills", cells: [["households", 1, V.Bh], ["government", -1, V.Bs], ["centralBank", 1, V.Bcb]] },
    { key: "netWorth", cells: [["households", -1, V.V], ["government", 1, V.Bs]] },
  ],
});
