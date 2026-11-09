import { blocksOf } from "./blocks.js";
import { compile, parseEquations, translate } from "./parse.js";

/**
 * A model written as sfcr writes it: its equations, its external values (the parameters and the exogenous variables,
 * which a run may change), its initial values, and its matrices, each cell an expression. It becomes a model the
 * runner takes (src/sfc/run.js), as SIM and PC are.
 *
 * The state holds every variable, the endogenous ones in the order of the equations, then the external ones. A step
 * keeps the period before, writes the period's external values, and solves the equations block by block (blocks.js):
 * a cycle iterates, Gauss-Seidel in written order from the period before's values, until no variable moves by more
 * than TOLERANCE relative to 1 + its size; past ITERATIONS it throws. The equations are compiled once into one
 * function; a step allocates nothing.
 *
 * The empty economy is sfcr's: every variable at 1e-15 (an equation may divide by it), then the initial values. The
 * stationary state is where the steps stop moving, found by running them.
 *
 * @typedef {import("../types.js").Model} Model
 * @typedef {import("../types.js").LedgerSpec} LedgerSpec
 * @typedef {{ sectors: string[], flows: SystemRow[], stocks: SystemRow[] }} SystemMatrices
 * @typedef {{ key: string, cells: Record<string, string>, total?: string }} SystemRow
 */

export const TOLERANCE = 1e-14;
export const ITERATIONS = 500;
/** How long a run may take to reach its stationary state, and how still it must then be. */
const SETTLING = { periods: 20000, change: 1e-12 };
const EMPTY = 1e-15;

/** A variable's source in the compiled code, `s` the period, `l` the period before; its reads go into `reads`. */
function referee(name, V, endogenous, reads) {
  return (variable, lagged) => {
    const i = V[variable];
    if (i === undefined) throw new Error(`${name}: unknown variable ${variable}`);
    if (!lagged && i < endogenous && reads) reads.add(i);
    return lagged ? `l[${i}]` : `s[${i}]`;
  };
}

/** The body of the solving function: each block in order, a cycle in a loop that returns its number if it fails. */
function solverBody(sources, blocks) {
  return blocks.map(({ members, cyclic }, b) => {
    if (!cyclic) return `s[${members[0]}] = ${sources[members[0]]};`;
    const lines = members.map((i) => `v = ${sources[i]}; w = Math.max(w, Math.abs(v - s[${i}]) / (1 + Math.abs(v))); s[${i}] = v;`);
    return `for (let k = 0; ; k += 1) {\n  if (k === ${ITERATIONS}) return ${b + 1};\n  w = 0;\n  ${lines.join("\n  ")}\n  if (w <= ${TOLERANCE}) break;\n}`;
  }).join("\n");
}

/** The model's matrices as the ledger reads them, each cell compiled to a source over `s` and `l`. */
function specOf(name, matrices, ref) {
  const row = ({ key, cells, total }) => ({
    key,
    cells: Object.entries(cells).map(([sector, text]) => /** @type {[string, number, string]} */ ([sector, 1, translate(text, ref)])),
    ...(total === undefined ? {} : { total: translate(total, ref) }),
  });
  return /** @type {LedgerSpec} */ ({ name, sectors: matrices.sectors, flows: matrices.flows.map(row), stocks: matrices.stocks.map(row) });
}

/** The names of `equations` and `external`, checked: no variable defined twice. */
function variablesOf(name, equations, external) {
  const VARS = [...equations.map((e) => e.name), ...Object.keys(external)];
  const seen = new Set();
  for (const variable of VARS) {
    if (seen.has(variable)) throw new Error(`${name}: ${variable} is defined twice`);
    seen.add(variable);
  }
  return VARS;
}

/**
 * The model `name` from its equations (sfcr's notation, one a line), its external values, its initial values and its
 * matrices.
 *
 * @param {{ name: string, equations: string, external: Record<string, number>, initial?: Record<string, number>,
 *   matrices: SystemMatrices }} definition
 * @returns {Model & { equations: Array<{ name: string, expression: string }> }}
 */
export function createSystem({ name, equations, external, initial = {}, matrices }) {
  const list = parseEquations(equations);
  const VARS = variablesOf(name, list, external);
  const V = Object.freeze(Object.fromEntries(VARS.map((variable, i) => [variable, i])));
  const reads = list.map(() => new Set());
  const sources = list.map((e, i) => translate(e.expression, referee(name, V, list.length, reads[i])));
  const blocks = blocksOf(reads.map((set) => [...set]));
  const solve = compile(["s", "l"], `let v = 0, w = 0;\n${solverBody(sources, blocks)}\nreturn 0;`);
  const outside = Object.keys(external).map((key) => [key, V[key]]);
  const lag = new Float64Array(VARS.length);
  const assertParams = (params) => {
    for (const key of new Set([...Object.keys(params), ...Object.keys(external)])) {
      if (!Number.isFinite(params[key]) || !(key in external)) throw new Error(`${name}: ${key} is ${params[key]}, not an external value`);
    }
  };
  const step = (params, state) => {
    lag.set(state);
    for (const [key, i] of outside) state[i] = params[key];
    const failed = solve(state, lag);
    if (failed) throw new Error(`${name}: block ${failed - 1} (${blocks[failed - 1].members.map((i) => VARS[i])}) did not settle`);
  };
  for (const variable of Object.keys(initial)) if (!(variable in V)) throw new Error(`${name}: no variable ${variable} to start`);
  const emptyState = () => {
    const state = new Float64Array(VARS.length).fill(EMPTY);
    for (const [variable, value] of Object.entries(initial)) state[V[variable]] = value;
    return state;
  };
  const steadyState = (params) => settle(name, { step, emptyState, VARS }, params);
  const SPEC = specOf(name, matrices, referee(name, V, list.length, null));
  return Object.freeze({ name, VARS, V, DEFAULTS: Object.freeze({ ...external }), SPEC, assertParams, emptyState, steadyState, step, equations: list });
}

/** The stationary state of `params`: the empty economy, run until a period moves no variable; throws if none comes. */
function settle(name, { step, emptyState, VARS }, params) {
  const state = emptyState();
  const before = new Float64Array(VARS.length);
  for (let t = 1; t <= SETTLING.periods; t += 1) {
    before.set(state);
    step(params, state);
    let moved = 0;
    for (let i = 0; i < state.length; i += 1) moved = Math.max(moved, Math.abs(state[i] - before[i]) / (1 + Math.abs(state[i])));
    if (moved <= SETTLING.change) return state;
  }
  throw new Error(`${name}: no stationary state within ${SETTLING.periods} periods`);
}
