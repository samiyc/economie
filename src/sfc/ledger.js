import { compile } from "./parse.js";

/**
 * The two matrices of a stock-flow consistent model (Godley and Lavoie, 2007, ch. 2): the transactions-flow matrix,
 * a row a flow and a column a sector, and the balance-sheet matrix, a row an asset. Each cell reads the model's state
 * with a sign: + a source of funds (or an asset), − a use (or a liability). A cell reads one variable (its index), or
 * an expression over the period (`s`) and the period before (`l`), compiled from sfcr's notation (system.js).
 *
 * A ledger checks what the model must keep: every row and every column of the transactions sums to zero, and every
 * row of the balance sheet. One row is the hidden equation (in SIM, the money issued equals the money held): the
 * model never writes it, the ledger finds it true. A row of real assets (fixed capital, gold) is nobody's debt: its
 * sum is its `total`, and the net worth row's total takes it back. The cells are compiled once; a check allocates
 * nothing.
 *
 * @typedef {import("../types.js").LedgerSpec} LedgerSpec
 * @typedef {import("../types.js").LedgerRow} LedgerRow
 * @typedef {import("../types.js").Ledger} Ledger
 */

/** How far from zero a sum may be, relative to the largest cell it adds (Godley and Lavoie check to the rounding). */
export const TOLERANCE = 1e-9;

/** The source that reads a cell: a variable's index, or an expression's source. */
const read = (variable) => (typeof variable === "number" ? `s[${variable}]` : `(${variable})`);

/** A function `(s, l, out, totals)` that writes the cells of `rows` into `out` (`width` a row) and their totals. */
function writer(rows, sectors, width) {
  const lines = ["out.fill(0);"];
  rows.forEach((row, r) => {
    for (const [sector, sign, variable] of row.cells) {
      const column = sectors.indexOf(sector);
      if (column < 0) throw new Error(`ledger: unknown sector ${sector} in row ${row.key}`);
      lines.push(`out[${r * width + column}] += ${sign} * ${read(variable)};`);
    }
    lines.push(`totals[${r}] = ${row.total === undefined ? 0 : read(row.total)};`);
  });
  return compile(["s", "l", "out", "totals"], lines.join("\n"));
}

/**
 * A ledger for `spec`: `fill(state, previous)` writes the matrices' cells into `flows` and `stocks` (row-major, a row
 * a flow or an asset, a column a sector), `residual()` gives the largest relative gap of a sum to zero.
 *
 * @param {LedgerSpec} spec
 * @returns {Ledger}
 */
export function createLedger(spec) {
  const width = spec.sectors.length;
  const writeFlows = writer(spec.flows, spec.sectors, width);
  const writeStocks = writer(spec.stocks, spec.sectors, width);
  const flows = new Float64Array(spec.flows.length * width);
  const stocks = new Float64Array(spec.stocks.length * width);
  const flowTotals = new Float64Array(spec.flows.length);
  const totals = new Float64Array(spec.stocks.length);
  const fill = (state, previous = state) => {
    writeFlows(state, previous, flows, flowTotals);
    writeStocks(state, previous, stocks, totals);
  };
  const residual = () => Math.max(gap(flows, null, width, true), gap(stocks, totals, width, false));
  return { spec, width, flows, stocks, totals, fill, residual };
}

/** The largest relative gap over the rows of `matrix` (each less its total), and over its columns if `columns`. */
function gap(matrix, totals, width, columns) {
  const height = matrix.length / width;
  let worst = 0;
  for (let r = 0; r < height; r += 1) worst = Math.max(worst, lineGap(matrix.subarray(r * width, (r + 1) * width), 1, totals ? totals[r] : 0));
  if (!columns) return worst;
  for (let c = 0; c < width; c += 1) worst = Math.max(worst, lineGap(matrix.subarray(c), width, 0));
  return worst;
}

/** The relative gap to `total` of the sum of every `stride`-th cell of `line`. */
function lineGap(line, stride, total) {
  let sum = -total;
  let scale = Math.max(1, Math.abs(total));
  for (let at = 0; at < line.length; at += stride) {
    sum += line[at];
    scale = Math.max(scale, Math.abs(line[at]));
  }
  return Math.abs(sum) / scale;
}

/**
 * Throws if `ledger`, filled from `state` (and the period before, `previous`), does not sum to zero: a flow left a
 * sector without entering another.
 *
 * @param {Ledger} ledger
 * @param {Float64Array} state
 * @param {number} period
 * @param {Float64Array} [previous]
 */
export function assertConsistent(ledger, state, period, previous = state) {
  ledger.fill(state, previous);
  const residual = ledger.residual();
  if (Number.isNaN(residual) || residual > TOLERANCE) {
    throw new Error(`ledger: the matrices of ${ledger.spec.name} do not sum to zero at period ${period} (gap ${residual})`);
  }
}
