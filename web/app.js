import { linksOf, paidBy } from "../src/sfc/links.js";
import { createLedger } from "../src/sfc/ledger.js";
import { runModel } from "../src/sfc/run.js";
import { drawCurves } from "./curves.js";
import { gapText } from "./labels.js";
import { drawMatrices } from "./matrices.js";
import { PAGES } from "./pages.js";
import { createPlayer } from "./player.js";
import { drawSankey, scaleFor } from "./sankey.js";

/**
 * The page of the models: a model's start, then the policy the controls give, from the period they say. It draws,
 * period by period, the Sankey of the flows, the two matrices and the curves; everything it shows comes from src/.
 * The controls are the page's (web/pages.js): they change with the model.
 */

const byId = (id) => /** @type {any} */ (document.getElementById(id));

const page = () => PAGES[byId("model").value];

/** The controls as a run's options: the start, the new values from their period on (shifted by what the page skips). */
function options() {
  const { fields, periods, skip } = page();
  const change = { at: Number(byId("at").value) + skip };
  for (const { key } of fields) change[key] = Number(byId(`field-${key}`).value);
  return { periods: periods + skip, start: byId("start").value, changes: [change] };
}

/** A run seen from the period the page starts at: its states, series and plan shifted. */
function shifted(run, skip) {
  return {
    model: run.model,
    periods: run.periods - skip,
    plan: run.plan.slice(skip),
    state: (t) => run.state(t + skip),
    before: (t) => run.state(Math.max(0, t + skip - 1)),
    series: (name) => run.series(name).subarray(skip),
  };
}

/** A run and what every period draws from it: its links, their scale, its curves, the income it goes to. */
function prepare() {
  const { model, curves, periods, skip, goal } = page();
  const run = shifted(runModel(model, options()), skip);
  const ledger = createLedger(model.SPEC);
  const links = Array.from({ length: periods + 1 }, (_, t) => {
    ledger.fill(run.state(t), run.before(t));
    return linksOf(ledger);
  });
  const totals = links.map((l) => [...paidBy(l).values()].reduce((a, b) => a + b, 0));
  const series = Object.fromEntries(curves.map(({ key, of }) => [key, of ? of(run) : run.series(key)]));
  return { run, ledger, links, perUnit: scaleFor(totals, model.SPEC.sectors.length), series, goal: Float64Array.from(run.plan, (p) => goal(model, p)) };
}

let view = null;

/** Draws period `t` of the current run. */
function show(t) {
  const { model, curves, target, summary, periods, unit } = page();
  view.ledger.fill(view.run.state(t), view.run.before(t));
  drawSankey(byId("sankey"), view.links[t], model.SPEC.sectors, view.perUnit);
  drawMatrices(view.ledger, byId("transactions"), byId("balance"));
  drawCurves(byId("curves"), byId("tooltip"), { ...view, curves, target, periods, t, unit, onSeek: (to) => player.seek(to) });
  byId("frame").textContent = `${unit} ${t} : ${summary(view.run.state(t), model.V, view.goal[t])} `
    + `Écart des matrices à zéro : ${gapText(view.ledger.residual())}.`;
}

const player = createPlayer({
  show,
  end: () => page().periods,
  play: byId("play"),
  position: byId("position"),
  speed: byId("speed-label"),
  slower: byId("slower"),
  faster: byId("faster"),
  hint: byId("hint"),
});

/** A new run from the controls, at the period the player is at. */
function rerun() {
  view = prepare();
  player.seek(player.t());
}

/** A slider of `field`, its value written beside it, a new run when it is let go. */
function slider({ key, label, min, max, step, format }) {
  const element = document.createElement("label");
  const value = document.createElement("span");
  const input = Object.assign(document.createElement("input"), { id: `field-${key}`, type: "range", min, max, step });
  const echo = () => {
    value.textContent = format(Number(input.value));
  };
  input.addEventListener("input", echo);
  input.addEventListener("change", rerun);
  element.append(`${label} `, value, input);
  return { element, echo };
}

/** The model's example back: its controls, its starts, its book values, the change its button names, from 5. */
function example() {
  const { model, fields, starts, periods, example: change, notes } = page();
  const sliders = fields.map(slider);
  byId("fields").replaceChildren(...sliders.map((s) => s.element));
  byId("start").replaceChildren(...starts.map(([value, text]) => Object.assign(document.createElement("option"), { value, textContent: text })));
  for (const { key } of fields) byId(`field-${key}`).value = String(change[key] ?? model.DEFAULTS[key]);
  for (const s of sliders) s.echo();
  Object.assign(byId("at"), { value: "5", max: String(periods) });
  for (const [name, text] of Object.entries(notes)) byId(`${name}-note`).textContent = text;
  view = prepare();
  player.seek(0);
}

for (const id of ["start", "at"]) byId(id).addEventListener("change", rerun);
byId("model").addEventListener("change", example);
byId("reset").onclick = example;
example();
