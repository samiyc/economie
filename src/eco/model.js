import { parseEquations } from "../sfc/parse.js";
import { createSystem } from "../sfc/system.js";
import { calibrate } from "./calibrate.js";
import { EQUATIONS } from "./equations.js";
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
 */
export function createEco(targets = TARGETS, assumed = ASSUMED) {
  const { external, values } = calibrate(targets, assumed);
  return createSystem({
    name: "ECO",
    equations: EQUATIONS,
    external,
    initial: Object.fromEntries(parseEquations(EQUATIONS).map(({ name }) => [name, values[name]])),
    matrices: MATRICES,
  });
}

export const ECO = createEco();
