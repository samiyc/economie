import { parseEquations } from "../sfc/parse.js";
import { createSystem } from "../sfc/system.js";
import { calibrate } from "./calibrate.js";
import { EQUATIONS } from "./equations.js";
import { MATRICES } from "./matrices.js";

/**
 * ÉCO, the economy of a state, by the quarter (docs/modele.md, § 3, M2): the book's blocks put together (src/book/),
 * calibrated on France's proportions of 2024 (src/eco/targets.js). Its empty economy is not empty: it is the starting
 * quarter that calibrate.js derives, and a run from it drifts as France's debt does.
 */

const { external, values } = calibrate();

export const ECO = createSystem({
  name: "ECO",
  equations: EQUATIONS,
  external,
  initial: Object.fromEntries(parseEquations(EQUATIONS).map(({ name }) => [name, values[name]])),
  matrices: MATRICES,
});
