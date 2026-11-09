/**
 * The shapes the modules hand each other, in JSDoc (`npm run types`). A module points here with
 * `@typedef {import("./types.js").Name} Name`.
 */

/**
 * A row of a matrix: its cells, each a sector, a sign (+1 a source of funds or an asset, −1 a use or a liability)
 * and what it reads: the index of a variable of the state, or the compiled source of an expression over the period
 * (`s`) and the period before (`l`). A row of real assets has a `total`, read the same way: its sum.
 *
 * @typedef {{ key: string, cells: Array<[string, number, number | string]>, total?: number | string }} LedgerRow
 */

/**
 * A model's two matrices: the transactions-flow matrix (`flows`, a row a flow) and the balance sheet (`stocks`, a row
 * an asset), over its `sectors`.
 *
 * @typedef {{ name: string, sectors: string[], flows: LedgerRow[], stocks: LedgerRow[] }} LedgerSpec
 */

/**
 * A ledger: the matrices' cells after `fill(state, previous)`, row-major (`width` a row), the balance sheet's totals,
 * and the largest relative gap of a sum to zero.
 *
 * @typedef {{
 *   spec: LedgerSpec,
 *   width: number,
 *   flows: Float64Array,
 *   stocks: Float64Array,
 *   totals: Float64Array,
 *   fill: (state: Float64Array, previous?: Float64Array) => void,
 *   residual: () => number,
 * }} Ledger
 */

/**
 * SIM's parameters (Godley and Lavoie, ch. 3): the government's purchases, the wage, the propensities to consume out
 * of income and out of wealth, the tax rate.
 *
 * @typedef {{ G: number, W: number, alpha1: number, alpha2: number, theta: number }} SimParams
 */

/**
 * PC's parameters (Godley and Lavoie, ch. 4): SIM's without the wage, the three coefficients of the households'
 * portfolio choice, and the rate on bills the central bank sets.
 *
 * @typedef {{ G: number, alpha1: number, alpha2: number, theta: number, lambda0: number, lambda1: number,
 *   lambda2: number, r: number }} PcParams
 */

/**
 * A model the runner takes (src/sfc/run.js): its variables and their indices, its book values, its matrices, and its
 * functions: the check of the parameters, the empty state, the stationary state, a step in place.
 *
 * @typedef {{
 *   name: string,
 *   VARS: readonly string[],
 *   V: Readonly<Record<string, number>>,
 *   DEFAULTS: Readonly<Record<string, number>>,
 *   SPEC: LedgerSpec,
 *   assertParams: (params: any) => void,
 *   emptyState: () => Float64Array,
 *   steadyState: (params: any) => Float64Array,
 *   step: (params: any, state: Float64Array) => void,
 * }} Model
 */

/**
 * @typedef {{
 *   params?: Record<string, number>,
 *   periods?: number,
 *   start?: "zero" | "steady",
 *   changes?: Array<{ at: number } & Record<string, number>>,
 * }} RunOptions
 */

/**
 * A run of a model: every state, period 0 the start, and the parameters of each period (`plan[0]` the start's).
 *
 * @typedef {{
 *   model: Model,
 *   periods: number,
 *   plan: Array<Record<string, number>>,
 *   states: Float64Array,
 *   state: (t: number) => Float64Array,
 *   series: (name: string) => Float64Array,
 * }} ModelRun
 */

export {};
