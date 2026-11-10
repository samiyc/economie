import { readdirSync, readFileSync } from "node:fs";
import { paired } from "mcts-commun/measure.js";
import { lossOf, WEIGHTS } from "../src/policy/tuning.js";

/**
 * Gathers scripts/search.js's runs (docs/mesures/recherche/): by world, tag, budget, family and weights, the seeds put
 * together; the planner against the best rule for these weights (R1 or R2s*b, the lower mean loss: Q-S4) and
 * against R1, by pairs, with the verdict of the adoption threshold (docs/modele.md, § 8, Q-S3). Prints markdown.
 *
 *   node scripts/search-report.js
 */

const OBJECTIVES = ["unemployment", "inflationGap", "debt"];
const GAIN = { unemployment: 0.2, inflationGap: 0.2, debt: 2 };
const MARGIN = { unemployment: 0.1, inflationGap: 0.1, debt: 1 };

const folder = new URL("../docs/mesures/recherche/", import.meta.url);
const runs = readdirSync(folder).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(new URL(f, folder), "utf8")));

/** The runs of the same measure, their seeds put together in order. */
function grouped() {
  const groups = new Map();
  for (const run of runs.sort((a, b) => a.from - b.from)) {
    const key = [run.world ?? "ÉCO", run.tag || "—", run.budget, run.family, run.weights].join(" | ");
    const group = groups.get(key) ?? { key, weights: run.weights, rows: {} };
    for (const [label, list] of Object.entries(run.rows)) group.rows[label] = [...(group.rows[label] ?? []), ...list];
    groups.set(key, group);
  }
  return [...groups.values()];
}

const number = (x) => x.toFixed(2).replace(".", ",").replace("-", "−");
const mean = (list, key) => list.reduce((sum, o) => sum + o[key], 0) / list.length;
const meanLoss = (list, weights) => list.reduce((sum, o) => sum + lossOf(o, weights), 0) / list.length;

/** The pair A − B on each objective, and the threshold's verdict: "gagne", "perd" or "—". */
function verdict(a, b) {
  const pairs = Object.fromEntries(OBJECTIVES.map((k) => [k, paired(a.map((o) => o[k]), b.map((o) => o[k]))]));
  // A beats B: an objective's whole interval past the gain, every other's worst bound within the margin.
  const beats = (worst) => OBJECTIVES.some((k) => worst(k) <= -GAIN[k]) && OBJECTIVES.every((k) => worst(k) <= MARGIN[k]);
  let word = "—";
  if (beats((k) => pairs[k].high)) word = "gagne";
  else if (beats((k) => -pairs[k].low)) word = "perd";
  return { cells: OBJECTIVES.map((k) => `${number(pairs[k].mean)} [${number(pairs[k].low)} ; ${number(pairs[k].high)}]`), word };
}

console.log("| Monde | Variante | Budget | Famille | Poids | Graines | Barre | Recherche − barre : chômage | inflation | dette | Seuil | Recherche − R1 | Seuil |");
console.log("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const { key, weights, rows } of grouped()) {
  const w = WEIGHTS[weights];
  const bar = meanLoss(rows.R1, w) <= meanLoss(rows["R2s*b"], w) ? "R1" : "R2s*b";
  const against = verdict(rows.search, rows[bar]);
  const fast = verdict(rows.search, rows.R1);
  console.log(`| ${key} | ${rows.search.length} | ${bar} | ${against.cells.join(" | ")} | ${against.word} | ${fast.cells[0]} ; ${fast.cells[1]} ; ${fast.cells[2]} | ${fast.word} |`);
}
console.log("\nLes moyennes (chômage, écart d'inflation, dette, trimestres au plancher) :\n");
for (const { key, rows } of grouped()) {
  const cells = Object.entries(rows).map(([label, list]) => `${label} ${["unemployment", "inflationGap", "debt", "floorQuarters"].map((k) => number(mean(list, k))).join(" / ")}`);
  console.log(`- ${key} : ${cells.join(" ; ")}`);
}
