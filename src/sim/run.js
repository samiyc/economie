import { SIM } from "../models.js";
import { runModel, schedule as scheduleOf } from "../sfc/run.js";
import { assertParams } from "./model.js";

/**
 * SIM's runs, as J1 wrote them: the runner of every model (src/sfc/run.js) given SIM.
 *
 * @typedef {import("../types.js").ModelRun} ModelRun
 * @typedef {import("../types.js").RunOptions} RunOptions
 * @typedef {import("../types.js").SimParams} SimParams
 */

/**
 * SIM's parameters for each period, 0 to `periods`, from `base` and its `changes`.
 *
 * @param {SimParams} base
 * @param {Array<{ at: number } & Partial<SimParams>>} changes
 * @param {number} periods
 */
export const schedule = (base, changes, periods) => scheduleOf(assertParams, base, changes, periods);

/**
 * @param {RunOptions} [options]
 * @returns {ModelRun}
 */
export const runSim = (options) => runModel(SIM, options);
