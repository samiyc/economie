/**
 * ÉCO's quarter as the ratios France publishes: shares of GDP, the debt a share of the year's (four quarters at this
 * one's level), the inflation over a year at this quarter's pace, the households' saving a share of their income.
 *
 * @param {Float64Array} state
 * @param {Readonly<Record<string, number>>} V
 */
export function ratiosOf(state, V) {
  const at = (name) => state[V[name]];
  const share = (name) => at(name) / at("GDP");
  return {
    debt: at("DEBT") / (4 * at("GDP")),
    deficit: share("DEF"),
    spending: share("SPEND"),
    levies: share("T"),
    unemployment: at("u"),
    saving: (at("YD") - at("C")) / at("YD"),
    pensions: share("PEN"),
    interest: share("INT"),
    exports: share("X"),
    imports: (at("IM") + at("E")) / at("GDP"),
    energy: share("E"),
    currentAccount: share("CA"),
    foreignControl: at("FDw") / at("FD"),
    inflation: (1 + at("pic")) ** 4 - 1,
  };
}
