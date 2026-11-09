import { BMW } from "./book/bmw.js";
import { DISINF } from "./book/disinf.js";
import { GROWTH } from "./book/growth.js";
import { LP } from "./book/lp.js";
import { OPEN } from "./book/open.js";
import { ECO } from "./eco/model.js";
import { PC_SPEC } from "./pc/ledger.js";
import * as pc from "./pc/model.js";
import * as pcex from "./pc/pcex.js";
import { runModel } from "./sfc/run.js";
import { SIM_SPEC } from "./sim/ledger.js";
import * as sim from "./sim/model.js";
import * as simex from "./sim/simex.js";

/**
 * The models the runner takes (src/sfc/run.js), each with its matrices: SIM and SIMEX (ch. 3), PC and PCEX (ch. 4),
 * written by hand; the book's blocks of ÉCO, LP, OPEN, BMW, DISINF and GROWTH (ch. 5 to 11), written in sfcr's notation
 * (src/sfc/system.js); and ÉCO, ours (src/eco/). A variant with expectations keeps its model's matrices: its state starts with the same
 * variables.
 *
 * @typedef {import("./types.js").Model} Model
 * @typedef {import("./types.js").ModelRun} ModelRun
 * @typedef {import("./types.js").RunOptions} RunOptions
 */

/** @type {(name: string, parts: any, SPEC: import("./types.js").LedgerSpec, DEFAULTS: any) => Model} */
const model = (name, { VARS, V, assertParams, emptyState, steadyState, step }, SPEC, DEFAULTS) =>
  Object.freeze({ name, VARS, V, DEFAULTS, SPEC, assertParams, emptyState, steadyState, step });

export const SIM = model("SIM", sim, SIM_SPEC, sim.DEFAULTS);
export const SIMEX = model("SIMEX", simex, SIM_SPEC, sim.DEFAULTS);
export const PC = model("PC", pc, PC_SPEC, pc.DEFAULTS);
export const PCEX = model("PCEX", pcex, PC_SPEC, pc.DEFAULTS);

/** The models by name. */
export const MODELS = Object.freeze({ SIM, SIMEX, PC, PCEX, LP, OPEN, BMW, DISINF, GROWTH, ECO });

/**
 * A run of the model `name`.
 *
 * @param {string} name
 * @param {RunOptions} [options]
 * @returns {ModelRun}
 */
export function run(name, options) {
  const chosen = MODELS[name];
  if (!chosen) throw new Error(`models: no model ${name}`);
  return runModel(chosen, options);
}
