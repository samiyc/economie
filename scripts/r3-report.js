import { existsSync, readFileSync } from "node:fs";
import { objectivesOf, simulate } from "../src/policy/simulate.js";
import { WEIGHTS } from "../src/policy/tuning.js";
import { lossPair, mean, meanLoss, number, searchRuns, verdict } from "./lib/verdict.js";

/**
 * R3 tuned by the climb and by CMA-ES (scripts/tune.js, docs/mesures/r3/): first the tunings, the best learning loss
 * at each mark of the budget, the mean and the best of the restarts; then the measure, seeds 1 to `--seeds` (200) of
 * each family, the two R3* against each other, against the bar of J6 (R1 or R2s*b) and against the search of J6 on
 * the same seeds (docs/mesures/recherche/), by pairs, with the verdict of the threshold (Q-S3) and the loss. Prints
 * markdown; docs/regle-r3.md reads it.
 *
 *   node scripts/r3-report.js
 */

const SEEDS = 200;
const FAMILIES = /** @type {const} */ (["calm", "unemployment", "materials"]);
const OPTIMIZERS = ["climb", "cmaes"];
const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const tuned = (o, w) => (existsSync(new URL(`../docs/mesures/r3/R3-${o}-${w}.json`, import.meta.url)) ? read(`../docs/mesures/r3/R3-${o}-${w}.json`) : null);
const weightsDone = Object.keys(WEIGHTS).filter((w) => OPTIMIZERS.every((o) => tuned(o, w)));

/** The curve of a tuning: at each mark, the mean and the best of its restarts' best losses. */
function curveRow(t) {
  const marks = t.restarts[0].curve.map((c, i) => t.restarts.map((r) => r.curve[i]?.loss ?? r.loss));
  return marks.map((losses) => `${number(losses.reduce((a, b) => a + b, 0) / losses.length)} (${number(Math.min(...losses))})`);
}

console.log("## Les réglages : la meilleure perte d'apprentissage, moyenne des relances (la meilleure)\n");
for (const w of weightsDone) {
  const marks = tuned("climb", w).restarts[0].curve.map((c) => c.evaluations);
  console.log(`\n### ${w} (R1 : ${number(tuned("climb", w).textbook)})\n\n| Recherche | ${marks.join(" | ")} | Écart des relances |\n|---|${marks.map(() => "---|").join("")}---|`);
  for (const o of OPTIMIZERS) {
    const t = tuned(o, w);
    const finals = t.restarts.map((r) => r.loss);
    console.log(`| ${o} | ${curveRow(t).join(" | ")} | ${number(Math.max(...finals) - Math.min(...finals))} |`);
  }
  for (const o of OPTIMIZERS) console.log(`\n- ${o} : ${JSON.stringify(tuned(o, w).coefficients)}`);
}

/** Every policy's objectives on seeds 1 to SEEDS of `family`, under weights `w`; the search's from J6. */
function playedOn(family, w) {
  const r2sb = read(`../docs/mesures/reglage/R2sb-${w}.json`).coefficients;
  const policies = { R1: ["R1"], "R2s*b": ["R2s", r2sb], "R3*climb": ["R3", tuned("climb", w).coefficients], "R3*cmaes": ["R3", tuned("cmaes", w).coefficients] };
  const rows = {};
  for (const [label, [rule, coefficients]] of Object.entries(policies)) {
    rows[label] = Array.from({ length: SEEDS }, (_, i) => objectivesOf(simulate({ family, seed: i + 1, rule: /** @type {any} */ (rule), coefficients, check: i === 0 })));
  }
  const search = searchRuns().find((g) => g.key === ["ÉCO", "—", 300, family, w].join(" | "));
  rows.search = search.rows.search.slice(0, SEEDS);
  return rows;
}

const line = (label, a, b, w) => {
  const { cells, word } = verdict(a, b);
  return `| ${label} | ${cells.join(" | ")} | ${word} | ${lossPair(a, b, w)} |`;
};

console.log("\n## La mesure, graines 1 à 200\n");
for (const w of weightsDone) {
  for (const family of FAMILIES) {
    const rows = playedOn(family, w);
    const weights = WEIGHTS[w];
    const bar = meanLoss(rows.R1, weights) <= meanLoss(rows["R2s*b"], weights) ? "R1" : "R2s*b";
    const best = tuned("climb", w).loss <= tuned("cmaes", w).loss ? "R3*climb" : "R3*cmaes";
    console.log(`\n### ${family}, ${w} (barre ${bar}, meilleur réglage ${best})\n`);
    for (const [label, list] of Object.entries(rows)) console.log(`- ${label} : ${["unemployment", "unemploymentPeak", "inflationGap", "debt", "floorQuarters"].map((k) => number(mean(list, k))).join(" / ")}`);
    console.log("\n| Paire | Chômage | Écart d'inflation | Dette | Seuil | Perte |\n|---|---|---|---|---|---|");
    console.log(line("R3*cmaes − R3*climb", rows["R3*cmaes"], rows["R3*climb"], weights));
    console.log(line(`${best} − ${bar}`, rows[best], rows[bar], weights));
    console.log(line(`${best} − recherche`, rows[best], rows.search, weights));
  }
}
