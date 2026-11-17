import { parseEquations } from "../sfc/parse.js";
import { createSystem } from "../sfc/system.js";
import { calibrate } from "./calibrate.js";
import { EQUATIONS } from "./equations.js";
import { FLOATING_EQUATIONS, FLOATING_MATRICES } from "./floating.js";
import { MATRICES } from "./matrices.js";
import { ASSUMED, TARGETS } from "./targets.js";

/**
 * ÉCO, the economy of a state, by the quarter (docs/modele.md, § 3, M2): the book's blocks put together (src/book/),
 * calibrated on France's proportions of 2024 (src/eco/targets.js). Its empty economy is not empty: it is the starting
 * quarter that calibrate.js derives, and a run from it drifts as France's debt does.
 */

/**
 * ÉCO calibrated on `targets` with the behaviour `assumed`: the measures of sensitivity build it with a hypothesis
 * moved (scripts/sensitivity.js).
 *
 * @param {Record<string, number>} [targets]
 * @param {Record<string, number>} [assumed]
 * @param {"fixed" | "floating"} [regime] the exchange rate: fixed (J3 to J6), or floating (J7, src/eco/floating.js)
 */
export function createEco(targets = TARGETS, assumed = ASSUMED, regime = "fixed") {
  const { external, values } = calibrate(targets, assumed, regime);
  const floating = regime === "floating";
  const equations = floating ? FLOATING_EQUATIONS : EQUATIONS;
  return createSystem({
    name: floating ? "ECOFLEX" : "ECO",
    equations,
    external,
    initial: Object.fromEntries(parseEquations(equations).map(({ name }) => [name, values[name]])),
    matrices: floating ? FLOATING_MATRICES : MATRICES,
  });
}

export const ECO = createEco();
/** ÉCO with a floating rate (J7). */
export const ECOFLEX = createEco(TARGETS, ASSUMED, "floating");
