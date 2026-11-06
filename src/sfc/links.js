/**
 * The transactions of a filled ledger as links between sectors, for the page's Sankey: in each row, the sectors
 * whose cell is negative pay (a use of funds) and those whose cell is positive receive (a source). A row with one
 * payer and one receiver is one link; a row with several shares each payment among the receivers in proportion. A
 * negative flow (households who draw on their money) turns its link around: the sector that receives pays.
 *
 * @typedef {import("../types.js").Ledger} Ledger
 * @typedef {{ flow: string, from: string, to: string, value: number }} Link
 */

/** The payers and receivers of row `r`, each `[column, amount]` with amount > 0. */
function sidesOf(ledger, r) {
  const payers = [];
  const receivers = [];
  for (let c = 0; c < ledger.width; c += 1) {
    const cell = ledger.flows[r * ledger.width + c];
    if (cell < 0) payers.push([c, -cell]);
    if (cell > 0) receivers.push([c, cell]);
  }
  return { payers, receivers };
}

/**
 * @param {Ledger} ledger filled
 * @param {number} [floor] links below it are left out (a flow at the rounding of zero)
 * @returns {Link[]}
 */
export function linksOf(ledger, floor = 1e-9) {
  const { sectors, flows } = ledger.spec;
  const links = [];
  flows.forEach((row, r) => {
    const { payers, receivers } = sidesOf(ledger, r);
    const received = receivers.reduce((sum, [, amount]) => sum + amount, 0);
    for (const [from, paid] of payers) {
      for (const [to, amount] of receivers) {
        const value = (paid * amount) / received;
        if (value > floor) links.push({ flow: row.key, from: sectors[from], to: sectors[to], value });
      }
    }
  });
  return links;
}

/** What each sector pays in all, from `links`: the height of its node in the Sankey (as much as it receives). */
export function paidBy(links) {
  const totals = new Map();
  for (const { from, value } of links) totals.set(from, (totals.get(from) ?? 0) + value);
  return totals;
}
