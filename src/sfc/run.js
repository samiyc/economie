import { assertConsistent, createLedger } from "./ledger.js";

/**
 * A run of a model (SIM, PC and their variants): from a start (`zero`, the book's empty economy, or `steady`, the
 * stationary state of the first parameters), `periods` steps, with the parameters changed at the periods `changes`
 * give (`{ at: 5, G: 25 }`: G is 25 from period 5 on). Every period, the ledger checks both matrices and the hidden
 * equation; a gap throws.
 *
 * The run keeps every state, period 0 the start, in one Float64Array: `state(t)` is a view, `series(name)` a copy.
 *
 * @typedef {import("../types.js").Model} Model
 * @typedef {import("../types.js").ModelRun} ModelRun
 * @typedef {import("../types.js").RunOptions} RunOptions
 */

/**
 * The parameters of each period, 0 to `periods`, from `base` and its `changes`, each checked by `assertParams`.
 *
 * @param {(params: object) => void} assertParams
 * @param {object} base
 * @param {Array<{ at: number }>} changes
 * @param {number} periods
 */
export function schedule(assertParams, base, changes, periods) {
  const sorted = [...changes].sort((a, b) => a.at - b.at);
  const out = [base];
  let current = base;
  let next = 0;
  for (let t = 1; t <= periods; t += 1) {
    while (next < sorted.length && sorted[next].at <= t) {
      const change = Object.fromEntries(Object.entries(sorted[next]).filter(([key]) => key !== "at"));
      current = { ...current, ...change };
      assertParams(current);
      next += 1;
    }
    out.push(current);
  }
  return out;
}

/**
 * Runs `model` as `options` say.
 *
 * @param {Model} model
 * @param {RunOptions} [options]
 * @returns {ModelRun}
 */
export function runModel(model, { params = model.DEFAULTS, periods = 60, start = "steady", changes = [] } = {}) {
  model.assertParams(params);
  const plan = schedule(model.assertParams, params, changes, periods);
  const width = model.VARS.length;
  const states = new Float64Array((periods + 1) * width);
  const state = start === "zero" ? model.emptyState() : model.steadyState(params);
  const ledger = createLedger(model.SPEC);
  states.set(state, 0);
  for (let t = 1; t <= periods; t += 1) {
    model.step(plan[t], state);
    assertConsistent(ledger, state, t, states.subarray((t - 1) * width, t * width));
    states.set(state, t * width);
  }
  return {
    model,
    periods,
    plan,
    states,
    state: (t) => states.subarray(t * width, (t + 1) * width),
    series: (name) => Float64Array.from({ length: periods + 1 }, (_, t) => states[t * width + model.V[name]]),
  };
}
