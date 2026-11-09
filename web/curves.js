import { amount, svg } from "./labels.js";

/**
 * The run's curves on one axis, all in units of money, the page's choice of them (web/pages.js), and the income the
 * model goes to, dashed: its stationary state under the policy of each period. Violet, magenta, green: checked on the
 * Khaki panel; magenta falls under 3:1, so each curve is named at its end, and the tooltip gives every value at a
 * period. A vertical line marks the period the page shows; a click goes to the period under the pointer.
 *
 * @typedef {{ key: string, name: string, colour: string }} Curve
 */

const TARGET = { colour: "#4d4d00", dashed: true };

const VIEW = { width: 760, height: 260, left: 46, right: 150, top: 12, bottom: 28 };

/** A round top for the axis, at least `max`: 1, 2 or 5 times a power of ten, times a whole number. */
export function niceTop(max) {
  const power = 10 ** Math.floor(Math.log10(Math.max(max, 1e-9)));
  const step = [1, 2, 5, 10].map((k) => k * power).find((s) => max / s <= 6) ?? 10 * power;
  return Math.ceil(max / step) * step;
}

/** The scales from periods and money to pixels. */
function scales(periods, top) {
  const x = (t) => VIEW.left + (t / periods) * (VIEW.width - VIEW.left - VIEW.right);
  const y = (v) => VIEW.top + (1 - v / top) * (VIEW.height - VIEW.top - VIEW.bottom);
  return { x, y };
}

/** The grid: five recessive lines with their values, and the periods under the axis. */
function grid(group, { x, y }, periods, top) {
  for (let k = 0; k <= 5; k += 1) {
    const value = (top * k) / 5;
    group.append(svg("line", { x1: VIEW.left, x2: VIEW.width - VIEW.right, y1: y(value), y2: y(value), class: "grid" }));
    group.append(svg("text", { x: VIEW.left - 6, y: y(value), class: "tick y" }, amount(value).replace(",0", "")));
  }
  const every = periods > 40 ? 10 : 5;
  for (let t = 0; t <= periods; t += every) group.append(svg("text", { x: x(t), y: VIEW.height - 8, class: "tick x" }, String(t)));
}

/** A curve through `values`, named at its end; dashed for the target. */
function curve(group, { x, y }, values, { name, colour, dashed = false }) {
  const points = Array.from(values, (v, t) => `${x(t).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  group.append(svg("polyline", { points, fill: "none", stroke: colour, class: dashed ? "curve target" : "curve" }));
  const end = values.length - 1;
  return { label: svg("text", { x: x(end) + 6, y: y(values[end]), class: "curve-label" }, name), y: y(values[end]) };
}

/** The end labels, moved apart when two would overlap (14 px at least, top down). */
function placeLabels(group, labels) {
  labels.sort((a, b) => a.y - b.y);
  let floor = -Infinity;
  for (const { label, y } of labels) {
    const at = Math.max(y, floor + 14);
    label.setAttribute("y", String(at));
    floor = at;
    group.append(label);
  }
}

/** The values of every curve at period `t`, for the tooltip, the target's if it has one. */
function readout({ curves, series, target, goal }, t) {
  const rows = curves.map((c) => [c, series[c.key][t]]);
  return Number.isFinite(goal[t]) ? [...rows, [{ ...TARGET, name: target }, goal[t]]] : rows;
}

/** The tooltip at period `t`: the period, then each value, a short stroke of its colour before it. */
function fillTooltip(tooltip, data, t) {
  const rows = readout(data, t).map(([{ name, colour }, value]) => {
    const row = document.createElement("div");
    const key = document.createElement("span");
    key.className = "key";
    key.style.background = colour;
    const strong = document.createElement("strong");
    strong.textContent = amount(value);
    row.append(key, strong, ` ${name}`);
    return row;
  });
  const title = document.createElement("div");
  title.textContent = `Période ${t}`;
  tooltip.replaceChildren(title, ...rows);
}

/** The crosshair, the tooltip and the click that seeks, over the plot. */
function hover(target, tooltip, { x }, data) {
  const { periods, onSeek } = data;
  const hair = svg("line", { y1: VIEW.top, y2: VIEW.height - VIEW.bottom, class: "hair", visibility: "hidden" });
  target.append(hair);
  const periodAt = (event) => {
    const box = target.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * VIEW.width;
    return Math.max(0, Math.min(periods, Math.round(((px - VIEW.left) / (VIEW.width - VIEW.left - VIEW.right)) * periods)));
  };
  target.onpointermove = (event) => {
    const t = periodAt(event);
    hair.setAttribute("x1", String(x(t)));
    hair.setAttribute("x2", String(x(t)));
    hair.setAttribute("visibility", "visible");
    fillTooltip(tooltip, data, t);
    tooltip.hidden = false;
    tooltip.style.left = `${(x(t) / VIEW.width) * 100}%`;
  };
  target.onpointerleave = () => {
    hair.setAttribute("visibility", "hidden");
    tooltip.hidden = true;
  };
  target.onclick = (event) => onSeek(periodAt(event));
}

/**
 * Draws the run's curves into `target`, the period `t` marked.
 *
 * @param {SVGSVGElement} target
 * @param {HTMLElement} tooltip
 * @param {{ curves: Curve[], series: Record<string, Float64Array>, target: string, goal: Float64Array, periods: number,
 *   t: number, onSeek: (t: number) => void }} data
 */
export function drawCurves(target, tooltip, data) {
  const { curves, series, goal, periods, t } = data;
  target.replaceChildren();
  target.setAttribute("viewBox", `0 0 ${VIEW.width} ${VIEW.height}`);
  const reached = goal.every(Number.isFinite);
  const top = niceTop(Math.max(...curves.map((c) => Math.max(...series[c.key])), ...(reached ? goal : [])));
  const scale = scales(periods, top);
  grid(target, scale, periods, top);
  const labels = curves.map((c) => curve(target, scale, series[c.key], c));
  if (reached) labels.push(curve(target, scale, goal, { ...TARGET, name: data.target }));
  placeLabels(target, labels);
  target.append(svg("line", { x1: scale.x(t), x2: scale.x(t), y1: VIEW.top, y2: VIEW.height - VIEW.bottom, class: "now" }));
  hover(target, tooltip, scale, data);
}
