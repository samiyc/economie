import { readdirSync, readFileSync } from "node:fs";
import { paired } from "mcts-commun/measure.js";
import { lossOf, WEIGHTS } from "../src/policy/tuning.js";

/**
 * Gathers scripts/search.js's runs (docs/mesures/recherche/): by world, tag, budget, family and weights, the seeds put
 * together; the planner against the best rule for these weights (R1 or R2s*b, the lower mean loss: Q-S4) and
 * against R1, by pairs, with the verdict of the adoption threshold (docs/modele.md, § 8, Q-S3); the loss of the
 * weights it optimises, by pairs; and each variant (the beam, four times the budget) against the climb of the
 * measure, on the seeds they share. Prints markdown.
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

/** The loss of weights `w`, A − B by pairs, with its interval. */
function lossPair(a, b, w) {
  const p = paired(a.map((o) => lossOf(o, w)), b.map((o) => lossOf(o, w)));
  return `${number(p.mean)} [${number(p.low)} ; ${number(p.high)}]`;
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
console.log("\nLa perte des poids de la mesure, par paires (recherche − barre ; recherche − R1) :\n");
for (const { key, weights, rows } of grouped()) {
  const cell = (label) => `${label} ${lossPair(rows.search, rows[label], WEIGHTS[weights])}`;
  console.log(`- ${key} : ${cell("R2s*b")} ; ${cell("R1")}`);
}
console.log("\nLes moyennes (chômage, écart d'inflation, dette, trimestres au plancher) :\n");
for (const { key, rows } of grouped()) {
  const cells = Object.entries(rows).map(([label, list]) => `${label} ${["unemployment", "inflationGap", "debt", "floorQuarters"].map((k) => number(mean(list, k))).join(" / ")}`);
  console.log(`- ${key} : ${cells.join(" ; ")}`);
}

console.log("\nLes variantes contre l'escalade de la mesure, sur les mêmes graines (variante − escalade à 300 plans) :\n");
const all = grouped();
for (const group of all.filter((g) => !g.key.includes("| — |"))) {
  const [world, , , family, weights] = group.key.split(" | ");
  const climb = all.find((g) => g.key === [world, "—", 300, family, weights].join(" | "));
  if (!climb) continue;
  const n = Math.min(group.rows.search.length, climb.rows.search.length);
  const [a, b] = [group.rows.search.slice(0, n), climb.rows.search.slice(0, n)];
  const { cells, word } = verdict(a, b);
  console.log(`- ${group.key} (${n} graines) : ${cells.join(" ; ")} → ${word} ; perte ${lossPair(a, b, WEIGHTS[weights])}`);
}
