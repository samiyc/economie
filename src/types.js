/**
 * The shapes the modules hand each other, in JSDoc (`npm run types`). A module points here with
 * `@typedef {import("./types.js").Name} Name`.
 */

/**
 * A row of a matrix: its cells, each a sector, a sign (+1 a source of funds or an asset, −1 a use or a liability)
 * and the index of the state's variable it reads.
 *
 * @typedef {{ key: string, cells: Array<[string, number, number]> }} LedgerRow
 */

/**
 * A model's two matrices: the transactions-flow matrix (`flows`, a row a flow) and the balance sheet (`stocks`, a row
 * an asset), over its `sectors`.
 *
 * @typedef {{ name: string, sectors: string[], flows: LedgerRow[], stocks: LedgerRow[] }} LedgerSpec
 */

/**
 * A ledger: the matrices' cells after `fill(state)`, row-major (`width` a row), and the largest relative gap of a sum
 * to zero.
 *
 * @typedef {{
 *   spec: LedgerSpec,
 *   width: number,
 *   flows: Float64Array,
 *   stocks: Float64Array,
 *   fill: (state: Float64Array) => void,
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
 * @typedef {{
 *   params?: SimParams,
 *   periods?: number,
 *   start?: "zero" | "steady",
 *   changes?: Array<{ at: number } & Partial<SimParams>>,
 * }} SimRunOptions
 */

/**
 * A run of SIM: every state, period 0 the start, and the parameters of each period (`plan[0]` the start's).
 *
 * @typedef {{
 *   periods: number,
 *   plan: SimParams[],
 *   states: Float64Array,
 *   state: (t: number) => Float64Array,
 *   series: (name: string) => Float64Array,
 * }} SimRun
 */

export {};
