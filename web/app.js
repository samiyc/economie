import { linksOf, paidBy } from "../src/sfc/links.js";
import { createSimLedger } from "../src/sim/ledger.js";
import { DEFAULTS, V } from "../src/sim/model.js";
import { runSim } from "../src/sim/run.js";
import { drawCurves } from "./curves.js";
import { amount, gapText, percent } from "./labels.js";
import { drawMatrices } from "./matrices.js";
import { createPlayer } from "./player.js";
import { drawSankey, scaleFor } from "./sankey.js";

/**
 * The page of SIM: the book's economy, then the policy the controls give, from the period they say. It draws, period
 * by period, the Sankey of the flows, the two matrices and the curves; everything it shows comes from src/.
 */

const PERIODS = 60;
const byId = (id) => /** @type {any} */ (document.getElementById(id));
const ORDER = ["households", "firms", "government"];
/** @type {Array<[string, (v: number) => string]>} */
const FIELDS = [
  ["G", (v) => amount(v)],
  ["theta", (v) => percent(v)],
  ["alpha1", (v) => v.toFixed(2).replace(".", ",")],
  ["alpha2", (v) => v.toFixed(2).replace(".", ",")],
];

/** The controls as a run's options: the book's start, the new values from their period on. */
function options() {
  const change = { at: Number(byId("at").value) };
  for (const [key] of FIELDS) change[key] = Number(byId(key).value);
  return { params: DEFAULTS, periods: PERIODS, start: byId("start").value, changes: [change] };
}

/** A run and what every period draws from it: its links, their scale, the income it goes to. */
function prepare() {
  const run = runSim(options());
  const ledger = createSimLedger();
  const links = Array.from({ length: PERIODS + 1 }, (_, t) => {
    ledger.fill(run.state(t));
    return linksOf(ledger);
  });
  const totals = links.map((l) => [...paidBy(l).values()].reduce((a, b) => a + b, 0));
  const series = { Y: run.series("Y"), C: run.series("C"), Hh: run.series("Hh") };
  const goal = Float64Array.from(run.plan, (p) => p.G / p.theta);
  return { run, ledger, links, perUnit: scaleFor(totals, ORDER.length), series, goal };
}

/** The line under the controls: the period's numbers, and how far the matrices are from zero. */
function summary({ run, ledger, goal }, t) {
  const s = run.state(t);
  const deficit = s[V.G] - s[V.T];
  return `Période ${t} : revenu ${amount(s[V.Y])} (il va vers G / θ = ${amount(goal[t])}), impôt ${amount(s[V.T])}, `
    + `déficit ${amount(deficit)}, consommation ${amount(s[V.C])}, monnaie des ménages ${amount(s[V.Hh])}. `
    + `Écart des matrices à zéro : ${gapText(ledger.residual())}.`;
}

let view = prepare();

/** Draws period `t` of the current run. */
function show(t) {
  view.ledger.fill(view.run.state(t));
  drawSankey(byId("sankey"), view.links[t], ORDER, view.perUnit);
  drawMatrices(view.ledger, byId("transactions"), byId("balance"));
  drawCurves(byId("curves"), byId("tooltip"), { ...view, periods: PERIODS, t, onSeek: (to) => player.seek(to) });
  byId("frame").textContent = summary(view, t);
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
  for (const [key, format] of FIELDS) byId(`${key}-value`).textContent = format(Number(byId(key).value));
};

/** A new run when a control changes; the example back on its button: G at 30 from period 5. */
function listen() {
  for (const [key] of FIELDS) byId(key).addEventListener("input", echo);
  for (const id of ["start", "at", ...FIELDS.map(([key]) => key)]) {
    byId(id).addEventListener("change", () => {
      view = prepare();
      player.seek(player.t());
    });
  }
  byId("reset").onclick = () => {
    for (const [key] of FIELDS) byId(key).value = String(key === "G" ? 30 : DEFAULTS[key]);
    byId("at").value = "5";
    echo();
    view = prepare();
    player.seek(0);
  };
}

echo();
listen();
player.seek(0);
