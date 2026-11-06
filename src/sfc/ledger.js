/**
 * The two matrices of a stock-flow consistent model (Godley and Lavoie, 2007, ch. 2): the transactions-flow matrix,
 * a row a flow and a column a sector, and the balance-sheet matrix, a row an asset. Each cell reads one variable of
 * the model's state with a sign: + a source of funds (or an asset), − a use (or a liability).
 *
 * A ledger checks what the model must keep: every row and every column of the transactions sums to zero, and every
 * row of the balance sheet. One row is the hidden equation (in SIM, the money issued equals the money held): the
 * model never writes it, the ledger finds it true. The cells are laid out once, in typed arrays; a check allocates
 * nothing.
 *
 * @typedef {import("../types.js").LedgerSpec} LedgerSpec
 * @typedef {import("../types.js").Ledger} Ledger
 */

/** How far from zero a sum may be, relative to the largest cell it adds (Godley and Lavoie check to the rounding). */
export const TOLERANCE = 1e-9;

/** The cells of `rows`, flattened: for each, its row, its column, its sign and the variable it reads. */
function layOut(rows, sectors) {
  const cells = rows.flatMap((row, r) => row.cells.map(([sector, sign, variable]) => {
    const column = sectors.indexOf(sector);
    if (column < 0) throw new Error(`ledger: unknown sector ${sector} in row ${row.key}`);
    return [r, column, sign, variable];
  }));
  return {
    row: Int32Array.from(cells, (c) => c[0]),
    column: Int32Array.from(cells, (c) => c[1]),
    sign: Float64Array.from(cells, (c) => c[2]),
    variable: Int32Array.from(cells, (c) => c[3]),
  };
}

/**
 * A ledger for `spec`: `fill(state)` writes the matrices' cells into `flows` and `stocks` (row-major, a row a flow or
 * an asset, a column a sector), `residual()` gives the largest relative gap of a sum to zero.
 *
 * @param {LedgerSpec} spec
 * @returns {Ledger}
 */
export function createLedger(spec) {
  const width = spec.sectors.length;
  const flowCells = layOut(spec.flows, spec.sectors);
  const stockCells = layOut(spec.stocks, spec.sectors);
  const flows = new Float64Array(spec.flows.length * width);
  const stocks = new Float64Array(spec.stocks.length * width);
  const fill = (state) => {
    write(flows, flowCells, width, state);
    write(stocks, stockCells, width, state);
  };
  const residual = () => Math.max(gap(flows, spec.flows.length, width, true), gap(stocks, spec.stocks.length, width, false));
  return { spec, width, flows, stocks, fill, residual };
}

/** The cells of `cells` read from `state`, into `out`. */
function write(out, cells, width, state) {
  out.fill(0);
  for (let i = 0; i < cells.row.length; i += 1) {
    out[cells.row[i] * width + cells.column[i]] += cells.sign[i] * state[cells.variable[i]];
  }
}

/** The largest |sum| / max(1, largest |cell|) over the rows of `matrix`, and over its columns if `columns`. */
function gap(matrix, height, width, columns) {
  let worst = 0;
  for (let r = 0; r < height; r += 1) worst = Math.max(worst, lineGap(matrix, r * width, 1, width));
  if (!columns) return worst;
  for (let c = 0; c < width; c += 1) worst = Math.max(worst, lineGap(matrix, c, width, height));
  return worst;
}

/** The relative gap to zero of the `count` cells of `matrix` from `start`, `stride` apart. */
function lineGap(matrix, start, stride, count) {
  let sum = 0;
  let scale = 1;
  for (let i = 0, at = start; i < count; i += 1, at += stride) {
    sum += matrix[at];
    scale = Math.max(scale, Math.abs(matrix[at]));
  }
  return Math.abs(sum) / scale;
}

/**
 * Throws if `ledger`, filled from `state`, does not sum to zero: a flow left a sector without entering another.
 *
 * @param {Ledger} ledger
 * @param {Float64Array} state
 * @param {number} period
 */
export function assertConsistent(ledger, state, period) {
  ledger.fill(state);
  const residual = ledger.residual();
  if (Number.isNaN(residual) || residual > TOLERANCE) {
    throw new Error(`ledger: the matrices of ${ledger.spec.name} do not sum to zero at period ${period} (gap ${residual})`);
  }
}
