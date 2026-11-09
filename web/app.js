import { linksOf, paidBy } from "../src/sfc/links.js";
import { createLedger } from "../src/sfc/ledger.js";
import { runModel } from "../src/sfc/run.js";
import { drawCurves } from "./curves.js";
import { amount, gapText, percent, rate } from "./labels.js";
import { drawMatrices } from "./matrices.js";
import { PAGES, goalOf } from "./pages.js";
import { createPlayer } from "./player.js";
import { drawSankey, scaleFor } from "./sankey.js";

/**
 * The page of the models: the book's economy, then the policy the controls give, from the period they say. It draws,
 * period by period, the Sankey of the flows, the two matrices and the curves; everything it shows comes from src/.
 */

const PERIODS = 60;
const byId = (id) => /** @type {any} */ (document.getElementById(id));
const decimals = (v) => v.toFixed(2).replace(".", ",");
/** Every control a model may use, and how its value is written beside it. */
const FORMATS = { G: amount, theta: percent, r: rate, alpha1: decimals, alpha2: decimals };

const page = () => PAGES[byId("model").value];

/** The controls as a run's options: the book's start, the new values from their period on. */
function options() {
  const change = { at: Number(byId("at").value) };
  for (const key of page().fields) change[key] = Number(byId(key).value);
  return { periods: PERIODS, start: byId("start").value, changes: [change] };
}

/** A run and what every period draws from it: its links, their scale, the income it goes to. */
function prepare() {
  const { model, curves } = page();
  const run = runModel(model, options());
  const ledger = createLedger(model.SPEC);
  const links = Array.from({ length: PERIODS + 1 }, (_, t) => {
    ledger.fill(run.state(t));
    return linksOf(ledger);
  });
  const totals = links.map((l) => [...paidBy(l).values()].reduce((a, b) => a + b, 0));
  const series = Object.fromEntries(curves.map(({ key }) => [key, run.series(key)]));
  const goal = Float64Array.from(run.plan, (params) => goalOf(model, params));
  return { run, ledger, links, perUnit: scaleFor(totals, model.SPEC.sectors.length), series, goal };
}

let view = prepare();

/** Draws period `t` of the current run. */
function show(t) {
  const { model, curves, target, summary } = page();
  view.ledger.fill(view.run.state(t));
  drawSankey(byId("sankey"), view.links[t], model.SPEC.sectors, view.perUnit);
  drawMatrices(view.ledger, byId("transactions"), byId("balance"));
  drawCurves(byId("curves"), byId("tooltip"), { ...view, curves, target, periods: PERIODS, t, onSeek: (to) => player.seek(to) });
  byId("frame").textContent = `Période ${t} : ${summary(view.run.state(t), model.V, view.goal[t])} `
    + `Écart des matrices à zéro : ${gapText(view.ledger.residual())}.`;
}

const player = createPlayer({
  show,
  end: () => PERIODS,
  play: byId("play"),
  position: byId("position"),
  speed: byId("speed-label"),
  slower: byId("slower"),
  faster: byId("faster"),
  hint: byId("hint"),
});

/** Each slider's value, written beside it. */
const echo = () => {
  for (const [key, format] of Object.entries(FORMATS)) byId(`${key}-value`).textContent = format(Number(byId(key).value));
};

/** The model's example back: its book values, the change its button names, from period 5; its notes. */
function example() {
  const { model, fields, example: change, notes } = page();
  for (const key of fields) byId(key).value = String(change[key] ?? model.DEFAULTS[key]);
  byId("at").value = "5";
  byId("r-field").hidden = !fields.includes("r");
  for (const [name, text] of Object.entries(notes)) byId(`${name}-note`).textContent = text;
  echo();
  view = prepare();
  player.seek(0);
}

/** A new run when a control changes; the example back on its button, or with a new model. */
function listen() {
  for (const key of Object.keys(FORMATS)) byId(key).addEventListener("input", echo);
  for (const id of ["start", "at", ...Object.keys(FORMATS)]) {
    byId(id).addEventListener("change", () => {
      view = prepare();
      player.seek(player.t());
    });
  }
  byId("model").addEventListener("change", example);
  byId("reset").onclick = example;
}

listen();
example();
