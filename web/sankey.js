import { FLOWS, SECTORS, amount, svg } from "./labels.js";
import { paidBy } from "../src/sfc/links.js";

/**
 * The Sankey of a period: each sector twice, on the left what it pays, on the right what it receives; a ribbon a
 * flow, as wide as it is large. A sector's two nodes are as high as each other: its column of the transactions sums
 * to zero. The scale is the run's (`perUnit`, pixels a unit of money), so that a ribbon that widens has grown.
 *
 * @typedef {import("../src/sfc/links.js").Link} Link
 */

const VIEW = { width: 760, height: 380, top: 34, bottom: 34, gap: 22, node: 14 };
const LEFT = 170;
const RIGHT = VIEW.width - 170 - VIEW.node;

/** The pixels a unit of money, so that the largest period of `totals` (the sums paid, a period each) fits. */
export function scaleFor(totals, sectorCount) {
  const room = VIEW.height - VIEW.top - VIEW.bottom - VIEW.gap * (sectorCount - 1);
  return room / Math.max(1e-9, ...totals);
}

/** Where each sector's node starts, top down, how high it is, and the total it stands for. */
function nodes(order, totals, perUnit) {
  const out = new Map();
  let y = VIEW.top;
  for (const sector of order) {
    const total = totals.get(sector) ?? 0;
    const height = total * perUnit;
    out.set(sector, { y, height, total });
    y += height + VIEW.gap;
  }
  return out;
}

/** The ribbons: each link's top on the payer's side and on the receiver's, links stacked in the sectors' order. */
function ribbons(links, order, at, perUnit) {
  const rank = (sector) => order.indexOf(sector);
  const outFill = new Map(order.map((s) => [s, at.get(s).y]));
  const inFill = new Map(order.map((s) => [s, at.get(s).y]));
  const byPayer = [...links].sort((a, b) => rank(a.from) - rank(b.from) || rank(a.to) - rank(b.to));
  const placed = [];
  for (const link of byPayer) {
    const ribbon = { link, width: link.value * perUnit, y0: outFill.get(link.from), y1: 0 };
    outFill.set(link.from, ribbon.y0 + ribbon.width);
    placed.push(ribbon);
  }
  const byReceiver = [...placed].sort((a, b) => rank(a.link.to) - rank(b.link.to) || rank(a.link.from) - rank(b.link.from));
  for (const ribbon of byReceiver) {
    ribbon.y1 = inFill.get(ribbon.link.to);
    inFill.set(ribbon.link.to, ribbon.y1 + ribbon.width);
  }
  return placed;
}

/** A ribbon's outline, a cubic curve from the payer's node to the receiver's and back. */
function ribbonPath({ y0, y1, width }) {
  const x0 = LEFT + VIEW.node;
  const x1 = RIGHT;
  const mid = (x0 + x1) / 2;
  return `M${x0},${y0}C${mid},${y0} ${mid},${y1} ${x1},${y1}V${y1 + width}C${mid},${y1 + width} ${mid},${y0 + width} ${x0},${y0 + width}Z`;
}

/** A ribbon, its tooltip, and its label at its start when it is wide enough to hold one. */
function drawRibbon(group, ribbon) {
  const { link, width, y0 } = ribbon;
  const name = `${FLOWS[link.flow] ?? link.flow} : ${amount(link.value)}`;
  const path = svg("path", { d: ribbonPath(ribbon), fill: SECTORS[link.from].colour, class: "ribbon", tabindex: 0 });
  path.append(svg("title", {}, `${name} (${SECTORS[link.from].name} → ${SECTORS[link.to].name})`));
  group.append(path);
  if (width >= 11) group.append(svg("text", { x: LEFT + VIEW.node + 8, y: y0 + width / 2, class: "ribbon-label" }, name));
}

/** A sector's node on one side, its name and its total beside it. */
function drawNode(group, sector, { y, height, total }, side) {
  const x = side === "left" ? LEFT : RIGHT;
  group.append(svg("rect", { x, y, width: VIEW.node, height: Math.max(1, height), rx: 3, fill: SECTORS[sector].colour }));
  const labelX = side === "left" ? x - 8 : x + VIEW.node + 8;
  const text = svg("text", { x: labelX, y: y + Math.max(height, 14) / 2, class: `node-label ${side}` }, SECTORS[sector].name);
  text.append(svg("tspan", { x: labelX, dy: "1.2em", class: "node-total" }, amount(total)));
  group.append(text);
}

/**
 * Draws `links` into the SVG `target`, at `perUnit` pixels a unit of money.
 *
 * @param {SVGSVGElement} target
 * @param {Link[]} links
 * @param {string[]} order the sectors, top down
 * @param {number} perUnit
 */
export function drawSankey(target, links, order, perUnit) {
  target.replaceChildren();
  target.setAttribute("viewBox", `0 0 ${VIEW.width} ${VIEW.height}`);
  const group = svg("g");
  const at = nodes(order, paidBy(links), perUnit);
  group.append(svg("text", { x: LEFT + VIEW.node / 2, y: 18, class: "column-label" }, "paie"));
  group.append(svg("text", { x: RIGHT + VIEW.node / 2, y: 18, class: "column-label" }, "reçoit"));
  for (const ribbon of ribbons(links, order, at, perUnit)) drawRibbon(group, ribbon);
  for (const sector of order) {
    drawNode(group, sector, at.get(sector), "left");
    drawNode(group, sector, at.get(sector), "right");
  }
  target.append(group);
}
