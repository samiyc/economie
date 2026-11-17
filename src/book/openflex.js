import { createSystem } from "../sfc/system.js";
import { EQUATIONS } from "./openflex-equations.js";
import { EXTERNAL, INITIAL } from "./openflex-values.js";

/**
 * OPEN FLEX (Godley and Lavoie, 2007, ch. 12), as sfcr's vignette writes it (Macalós, MIT): two countries, the UK and
 * the US, each with households, firms, a government and a central bank, who trade at prices that follow the exchange
 * rate and hold each other's bills. The rate floats: the UK's central bank holds its US bills and gold still, so the
 * rate `xr_uk` (dollars a pound) is what makes the US bills the UK's households want, in pounds, match the US bills
 * left for them, in dollars (12.89FL, 12.90G). The block of ÉCO's floating rate (docs/modele.md, J7).
 *
 * The matrices are in pounds: a US cell is its dollars times `xr_us`. The households' capital gains on the other
 * country's bills are in their income (12.1) but in no flow: a column of the transactions balances their cash, and
 * the change of their bills' value in pounds is that cash plus the gain. The UK central bank's net worth is counted
 * here from its balance sheet: the vignette's nwcb_uk, kept as written, converts its US bills to pounds twice
 * (b_cb_ukus_d is already in pounds), 6e-6 off.
 */

/** A US cell, in pounds. */
const us = (text) => `(${text}) * xr_us`;

export const OPENFLEX = createSystem({
  name: "OPENFLEX",
  equations: EQUATIONS,
  external: EXTERNAL,
  initial: INITIAL,
  solver: "newton",
  matrices: {
    sectors: ["ukHouseholds", "ukFirms", "ukGovernment", "ukCentralBank", "usHouseholds", "usFirms", "usGovernment", "usCentralBank"],
    flows: [
      { key: "ukConsumption", cells: { ukHouseholds: "-cons_uk", ukFirms: "+cons_uk" } },
      { key: "usConsumption", cells: { usHouseholds: `-${us("cons_us")}`, usFirms: `+${us("cons_us")}` } },
      { key: "ukPurchases", cells: { ukFirms: "+g_uk", ukGovernment: "-g_uk" } },
      { key: "usPurchases", cells: { usFirms: `+${us("g_us")}`, usGovernment: `-${us("g_us")}` } },
      { key: "ukExports", cells: { ukFirms: "+x_uk", usFirms: `-${us("im_us")}` } },
      { key: "usExports", cells: { ukFirms: "-im_uk", usFirms: `+${us("x_us")}` } },
      { key: "ukIncome", cells: { ukHouseholds: "+y_uk", ukFirms: "-y_uk" } },
      { key: "usIncome", cells: { usHouseholds: `+${us("y_us")}`, usFirms: `-${us("y_us")}` } },
      { key: "ukTaxes", cells: { ukHouseholds: "-t_uk", ukGovernment: "+t_uk" } },
      { key: "usTaxes", cells: { usHouseholds: `-${us("t_us")}`, usGovernment: `+${us("t_us")}` } },
      { key: "ukBillInterest", cells: { ukHouseholds: "+r_uk[-1] * b_ukuk_d[-1]", usHouseholds: "+r_uk[-1] * b_usuk_s[-1]", ukGovernment: "-r_uk[-1] * b_uk_s[-1]", ukCentralBank: "+r_uk[-1] * b_cb_ukuk_d[-1]" } },
      { key: "usBillInterest", cells: { ukHouseholds: `+${us("r_us[-1] * b_ukus_s[-1]")}`, ukCentralBank: `+${us("r_us[-1] * b_cb_ukus_s[-1]")}`, usHouseholds: `+${us("r_us[-1] * b_usus_d[-1]")}`, usGovernment: `-${us("r_us[-1] * b_us_s[-1]")}`, usCentralBank: `+${us("r_us[-1] * b_cb_usus_d[-1]")}` } },
      { key: "ukCentralBankProfits", cells: { ukGovernment: "+f_cb_uk", ukCentralBank: "-f_cb_uk" } },
      { key: "usCentralBankProfits", cells: { usGovernment: `+${us("f_cb_us")}`, usCentralBank: `-${us("f_cb_us")}` } },
      { key: "ukMoney", cells: { ukHouseholds: "-d(h_uk_d)", ukCentralBank: "+d(h_uk_s)" } },
      { key: "usMoney", cells: { usHouseholds: `-${us("d(h_us_d)")}`, usCentralBank: `+${us("d(h_us_s)")}` } },
      { key: "ukBills", cells: { ukHouseholds: "-d(b_ukuk_d)", usHouseholds: "-d(b_usuk_s)", ukGovernment: "+d(b_uk_s)", ukCentralBank: "-d(b_cb_ukuk_d)" } },
      { key: "usBills", cells: { ukHouseholds: `-${us("d(b_ukus_s)")}`, ukCentralBank: `-${us("d(b_cb_ukus_s)")}`, usHouseholds: `-${us("d(b_usus_d)")}`, usGovernment: `+${us("d(b_us_s)")}`, usCentralBank: `-${us("d(b_cb_usus_d)")}` } },
      { key: "gold", cells: { ukCentralBank: "-d(or_uk) * pg_uk", usCentralBank: `-${us("d(or_us) * pg_us")}` } },
    ],
    stocks: [
      { key: "ukMoney", cells: { ukHouseholds: "+h_uk_d", ukCentralBank: "-h_uk_s" } },
      { key: "usMoney", cells: { usHouseholds: `+${us("h_us_d")}`, usCentralBank: `-${us("h_us_s")}` } },
      { key: "ukBills", cells: { ukHouseholds: "+b_ukuk_d", usHouseholds: "+b_usuk_s", ukGovernment: "-b_uk_s", ukCentralBank: "+b_cb_ukuk_d" } },
      { key: "usBills", cells: { ukHouseholds: `+${us("b_ukus_s")}`, ukCentralBank: `+${us("b_cb_ukus_s")}`, usHouseholds: `+${us("b_usus_d")}`, usGovernment: `-${us("b_us_s")}`, usCentralBank: `+${us("b_cb_usus_d")}` } },
      { key: "gold", cells: { ukCentralBank: "+or_uk * pg_uk", usCentralBank: `+${us("or_us * pg_us")}` }, total: `or_uk * pg_uk + ${us("or_us * pg_us")}` },
      {
        key: "netWorth",
        cells: { ukHouseholds: "-v_uk", usHouseholds: `-${us("v_us")}`, ukGovernment: "+b_uk_s", usGovernment: `+${us("b_us_s")}`, ukCentralBank: "-(-h_uk_s + b_cb_ukuk_d + b_cb_ukus_d + or_uk * pg_uk)", usCentralBank: `-${us("-h_us_d + b_cb_usus_d + or_us * pg_us")}` },
        total: `-(or_uk * pg_uk + ${us("or_us * pg_us")})`,
      },
    ],
  },
});
