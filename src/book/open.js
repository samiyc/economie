import { createSystem } from "../sfc/system.js";

/**
 * OPEN (Godley and Lavoie, 2007, ch. 6), as sfcr's vignette writes it (Macalós, MIT): two countries, North and South,
 * each PC, who trade. Each imports a share μ of its income; the exchange rate is fixed, and what a country's trade
 * deficit costs its central bank in gold is what the other's gains. That the two changes match is the hidden equation,
 * the last row of the transactions. The block of ÉCO's rest of the world: imports, exports, and the reserves that
 * hold the fixed rate.
 *
 * The two countries differ by their propensities to consume, as in the vignette, or they would be twins.
 */

const COUNTRY = `
  Y_# ~ C_# + G_# + X_# - IM_#
  IM_# ~ mu_# * Y_#
  YD_# ~ Y_# - TX_# + r_#[-1] * Bh_#[-1]
  TX_# ~ theta_# * ( Y_# + r_#[-1] * Bh_#[-1] )
  V_# ~ V_#[-1] + ( YD_# - C_# )
  C_# ~ alpha1_# * YD_# + alpha2_# * V_#[-1]
  Hh_# ~ V_# - Bh_#
  Bh_# ~ V_# * ( lambda0_# + lambda1_# * r_# - lambda2_# * ( YD_#/V_# ) )
  Bs_# ~ Bs_#[-1] + ( G_# + r_#[-1] * Bs_#[-1] ) - ( TX_# + r_#[-1] * Bcb_#[-1] )
  Bcb_# ~ Bs_# - Bh_#
  or_# ~ or_#[-1] + (( Hs_# - Hs_#[-1] - ( Bcb_# - Bcb_#[-1] ) )/pg_#)
  Hs_# ~ Hh_#
`;

/** The flows of one country, `side` (north or south): its columns prefixed, its suffix for `#`, its key prefixed. */
const country = (rows, side) => rows.map(({ key, cells }) => ({
  key: `${side}${key[0].toUpperCase()}${key.slice(1)}`,
  cells: Object.fromEntries(Object.entries(cells).map(([sector, text]) => [`${side}${sector}`, text.replaceAll("#", side === "north" ? "N" : "S")])),
}));

export const OPEN = createSystem({
  name: "OPEN",
  equations: `${COUNTRY.replaceAll("#", "N")}${COUNTRY.replaceAll("#", "S")}
    X_N ~ IM_S / xr
    X_S ~ IM_N * xr
    pg_S ~ pg_N * xr
    deltaor_S ~ or_S - or_S[-1]
    deltaor_N ~ - (or_N - or_N[-1])
  `,
  external: {
    xr: 1, pg_N: 1, r_N: 0.025, r_S: 0.025, G_S: 20, G_N: 20, mu_N: 0.15, mu_S: 0.15, alpha1_N: 0.7, alpha1_S: 0.8,
    alpha2_N: 0.3, alpha2_S: 0.2, lambda0_N: 0.67, lambda0_S: 0.67, lambda1_N: 0.05, lambda1_S: 0.05, lambda2_N: 0.01,
    lambda2_S: 0.01, theta_N: 0.2, theta_S: 0.2,
  },
  matrices: {
    sectors: ["northHouseholds", "northFirms", "northGovernment", "northCentralBank",
      "southHouseholds", "southFirms", "southGovernment", "southCentralBank"],
    flows: [
      ...["north", "south"].flatMap((side) => country([
        { key: "consumption", cells: { Households: "-C_#", Firms: "+C_#" } },
        { key: "purchases", cells: { Firms: "+G_#", Government: "-G_#" } },
        { key: "income", cells: { Households: "+Y_#", Firms: "-Y_#" } },
        { key: "interest", cells: { Households: "+r_#[-1] * Bh_#[-1]", Government: "-r_#[-1] * Bs_#[-1]", CentralBank: "+r_#[-1] * Bcb_#[-1]" } },
        { key: "profits", cells: { Government: "+r_#[-1] * Bcb_#[-1]", CentralBank: "-r_#[-1] * Bcb_#[-1]" } },
        { key: "taxes", cells: { Households: "-TX_#", Government: "+TX_#" } },
        { key: "money", cells: { Households: "-d(Hh_#)", CentralBank: "+d(Hs_#)" } },
        { key: "bills", cells: { Households: "-d(Bh_#)", Government: "+d(Bs_#)", CentralBank: "-d(Bcb_#)" } },
      ], side)),
      { key: "northExports", cells: { northFirms: "+X_N * xr", southFirms: "-IM_S" } },
      { key: "southExports", cells: { northFirms: "-IM_N * xr", southFirms: "+X_S" } },
      { key: "gold", cells: { northCentralBank: "-d(or_N) * pg_N * xr", southCentralBank: "-d(or_S) * pg_S" } },
    ],
    stocks: [
      { key: "money", cells: { northHouseholds: "+Hh_N", northCentralBank: "-Hs_N", southHouseholds: "+Hh_S", southCentralBank: "-Hs_S" } },
      { key: "bills", cells: { northHouseholds: "+Bh_N", northGovernment: "-Bs_N", northCentralBank: "+Bcb_N", southHouseholds: "+Bh_S", southGovernment: "-Bs_S", southCentralBank: "+Bcb_S" } },
      { key: "gold", cells: { northCentralBank: "+or_N * pg_N * xr", southCentralBank: "+or_S * pg_S" }, total: "or_N * pg_N * xr + or_S * pg_S" },
      { key: "netWorth", cells: { northHouseholds: "-V_N", northGovernment: "+Bs_N", southHouseholds: "-V_S", southGovernment: "+Bs_S" }, total: "-(or_N * pg_N * xr + or_S * pg_S)" },
    ],
  },
});
