import { WEIGHTS } from "../src/policy/tuning.js";
import { lossPair, mean, meanLoss, number, searchRuns, verdict } from "./lib/verdict.js";

/**
 * Gathers scripts/search.js's runs (docs/mesures/recherche/): by world, tag, budget, family and weights, the seeds put
 * together; the planner against the best rule for these weights (R1 or R2s*b, the lower mean loss: Q-S4) and
 * against R1, by pairs, with the verdict of the adoption threshold (docs/modele.md, § 8, Q-S3); the loss of the
 * weights it optimises, by pairs; and each variant (the beam, four times the budget) against the climb of the
 * measure, on the seeds they share. Prints markdown.
 *
 *   node scripts/search-report.js
 */

const all = searchRuns();

console.log("| Monde | Variante | Budget | Famille | Poids | Graines | Barre | Recherche − barre : chômage | inflation | dette | Seuil | Recherche − R1 | Seuil |");
console.log("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const { key, weights, rows } of all) {
  const w = WEIGHTS[weights];
  const bar = meanLoss(rows.R1, w) <= meanLoss(rows["R2s*b"], w) ? "R1" : "R2s*b";
  const against = verdict(rows.search, rows[bar]);
  const fast = verdict(rows.search, rows.R1);
  console.log(`| ${key} | ${rows.search.length} | ${bar} | ${against.cells.join(" | ")} | ${against.word} | ${fast.cells[0]} ; ${fast.cells[1]} ; ${fast.cells[2]} | ${fast.word} |`);
}
console.log("\nLa perte des poids de la mesure, par paires (recherche − barre ; recherche − R1) :\n");
for (const { key, weights, rows } of all) {
  const cell = (label) => `${label} ${lossPair(rows.search, rows[label], WEIGHTS[weights])}`;
  console.log(`- ${key} : ${cell("R2s*b")} ; ${cell("R1")}`);
}
console.log("\nLes moyennes (chômage, écart d'inflation, dette, trimestres au plancher) :\n");
for (const { key, rows } of all) {
  const cells = Object.entries(rows).map(([label, list]) => `${label} ${["unemployment", "inflationGap", "debt", "floorQuarters"].map((k) => number(mean(list, k))).join(" / ")}`);
  console.log(`- ${key} : ${cells.join(" ; ")}`);
}

console.log("\nLes variantes contre l'escalade de la mesure, sur les mêmes graines (variante − escalade à 300 plans) :\n");
for (const group of all.filter((g) => !g.key.includes("| — |"))) {
  const [world, , , family, weights] = group.key.split(" | ");
  const climb = all.find((g) => g.key === [world, "—", 300, family, weights].join(" | "));
  if (!climb) continue;
  const n = Math.min(group.rows.search.length, climb.rows.search.length);
  const [a, b] = [group.rows.search.slice(0, n), climb.rows.search.slice(0, n)];
  const { cells, word } = verdict(a, b);
  console.log(`- ${group.key} (${n} graines) : ${cells.join(" ; ")} → ${word} ; perte ${lossPair(a, b, WEIGHTS[weights])}`);
}
