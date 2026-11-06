import { FLOWS, SECTORS, STOCKS, amount } from "./labels.js";

/**
 * The two matrices of a period as tables, every value as text (the table view of the Sankey): the transactions, a
 * row a flow, a column a sector, and their sums, which must be zero; the balance sheet, a row an asset.
 *
 * @typedef {import("../src/types.js").Ledger} Ledger
 */

/** A value with its sign, as the book writes the matrices: + a source, − a use. */
function signed(value) {
  if (Math.abs(value) < 0.05) return "0,0";
  return `${value > 0 ? "+" : "−"}${amount(Math.abs(value))}`;
}

/** A cell `tag` with `text`, and its `className` if given. */
function cell(tag, text, className = "") {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

/** The head of a matrix: its corner, a column a sector, and the sum. */
function head(sectors) {
  const row = document.createElement("tr");
  row.append(cell("th", ""));
  for (const sector of sectors) row.append(cell("th", SECTORS[sector]?.name ?? sector));
  row.append(cell("th", "Σ", "sum"));
  const thead = document.createElement("thead");
  thead.append(row);
  return thead;
}

/** A row of `values` (one a column, `width` of them), named `name`, blank where `present` has no cell, and its sum. */
function bodyRow(name, values, present, width) {
  const row = document.createElement("tr");
  row.append(cell("th", name));
  let sum = 0;
  for (let c = 0; c < width; c += 1) {
    sum += values[c];
    row.append(cell("td", present.has(c) ? signed(values[c]) : ""));
  }
  row.append(cell("td", signed(sum), "sum"));
  return row;
}

/** The rows of `matrix` (row-major, a row a sector of `sectors` wide), one a row of `rows`, named from `names`. */
function body(rows, matrix, names, sectors) {
  const width = sectors.length;
  const tbody = document.createElement("tbody");
  rows.forEach((row, r) => {
    const present = new Set(row.cells.map(([sector]) => sectors.indexOf(sector)));
    tbody.append(bodyRow(names[row.key] ?? row.key, matrix.subarray(r * width, (r + 1) * width), present, width));
  });
  return tbody;
}

/** The last row of the transactions: each column's sum, which must be zero. */
function sumsRow(matrix, width) {
  const sums = new Float64Array(width);
  for (let i = 0; i < matrix.length; i += 1) sums[i % width] += matrix[i];
  const last = bodyRow("Σ", sums, new Set(sums.keys()), width);
  last.className = "sum";
  return last;
}

/**
 * Fills the tables `transactions` and `balance` from `ledger`, filled for the period.
 *
 * @param {Ledger} ledger
 * @param {HTMLTableElement} transactions
 * @param {HTMLTableElement} balance
 */
export function drawMatrices(ledger, transactions, balance) {
  const { sectors, flows, stocks } = ledger.spec;
  const flowRows = body(flows, ledger.flows, FLOWS, sectors);
  flowRows.append(sumsRow(ledger.flows, sectors.length));
  transactions.replaceChildren(head(sectors), flowRows);
  balance.replaceChildren(head(sectors), body(stocks, ledger.stocks, STOCKS, sectors));
}
