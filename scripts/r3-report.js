import { existsSync, readFileSync } from "node:fs";
import { createEco } from "../src/eco/model.js";
import { ASSUMED, TARGETS } from "../src/eco/targets.js";
import { objectivesOf, simulate } from "../src/policy/simulate.js";
import { WEIGHTS } from "../src/policy/tuning.js";
import { lossPair, mean, meanLoss, number, searchRuns, verdict } from "./lib/verdict.js";

/**
 * R3 tuned by the climb and by CMA-ES, and by the climb within wider bounds (R3w, "large") when it is there
 * (scripts/tune.js, docs/mesures/r3/): first the tunings, the best learning loss at each mark of the budget, the mean
 * and the best of the restarts; then the measure, seeds 1 to 200 of each family, the R3* against each other, against
 * the bar of J6 (R1 or R2s*b) and against the search of J6 on the same seeds (docs/mesures/recherche/), by pairs, with
 * the verdict of the threshold (Q-S3) and the loss; last, the shifted model: R3* tuned on ÉCO, played in each world of
 * J6 where a hypothesis is moved, against R1 and the search there. Prints markdown; docs/regle-r3.md reads it.
 *
 *   node scripts/r3-report.js
 */

const SEEDS = 200;
const FAMILIES = /** @type {const} */ (["calm", "unemployment", "materials"]);
const OPTIMIZERS = ["climb", "cmaes"];
const VARIANTS = [...OPTIMIZERS, "large"];
const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const tuned = (o, w) => (existsSync(new URL(`../docs/mesures/r3/R3-${o}-${w}.json`, import.meta.url)) ? read(`../docs/mesures/r3/R3-${o}-${w}.json`) : null);
const weightsDone = Object.keys(WEIGHTS).filter((w) => OPTIMIZERS.every((o) => tuned(o, w)));
const variantsOf = (w) => VARIANTS.filter((o) => tuned(o, w));
/** The best tuning on the learning seeds, among `variants`. */
const bestOf = (w, variants) => variants.reduce((a, b) => (tuned(b, w).loss < tuned(a, w).loss ? b : a));

/** The curve of a tuning: at each mark, the mean and the best of its restarts' best losses. */
function curveRow(t) {
  const marks = t.restarts[0].curve.map((c, i) => t.restarts.map((r) => r.curve[i]?.loss ?? r.loss));
  return marks.map((losses) => `${number(losses.reduce((a, b) => a + b, 0) / losses.length)} (${number(Math.min(...losses))})`);
}

function printTunings() {
  console.log("## Les réglages : la meilleure perte d'apprentissage, moyenne des relances (la meilleure)\n");
  for (const w of weightsDone) {
    const marks = tuned("climb", w).restarts[0].curve.map((c) => c.evaluations);
    console.log(`\n### ${w} (R1 : ${number(tuned("climb", w).textbook)})\n\n| Recherche | ${marks.join(" | ")} | Écart des relances |\n|---|${marks.map(() => "---|").join("")}---|`);
    for (const o of variantsOf(w)) {
      const finals = tuned(o, w).restarts.map((r) => r.loss);
      console.log(`| ${o} | ${curveRow(tuned(o, w)).join(" | ")} | ${number(Math.max(...finals) - Math.min(...finals))} |`);
    }
    for (const o of variantsOf(w)) console.log(`\n- ${o} : ${JSON.stringify(tuned(o, w).coefficients)}`);
  }
}

/** Seeds 1 to `seeds` of `family` played by each rule of `policies` ({ label: [rule, coefficients] }) in `model`. */
function play(policies, family, seeds, model) {
  const rows = {};
  for (const [label, [rule, coefficients]] of Object.entries(policies)) {
    rows[label] = Array.from({ length: seeds }, (_, i) => objectivesOf(simulate({ family, seed: i + 1, rule: /** @type {any} */ (rule), coefficients, check: i === 0 }, model)));
  }
  return rows;
}

/** Every policy's objectives on seeds 1 to SEEDS of `family`, under weights `w`; the search's from J6. */
function playedOn(family, w) {
  const policies = { R1: ["R1"], "R2s*b": ["R2s", read(`../docs/mesures/reglage/R2sb-${w}.json`).coefficients] };
  for (const o of variantsOf(w)) policies[`R3*${o}`] = ["R3", tuned(o, w).coefficients];
  const rows = play(policies, family, SEEDS, undefined);
  rows.search = searchRuns().find((g) => g.key === ["ÉCO", "—", 300, family, w].join(" | ")).rows.search.slice(0, SEEDS);
  return rows;
}

const line = (label, a, b, w) => {
  const { cells, word } = verdict(a, b);
  return `| ${label} | ${cells.join(" | ")} | ${word} | ${lossPair(a, b, w)} |`;
};
const HEADER = "\n| Paire | Chômage | Écart d'inflation | Dette | Seuil | Perte |\n|---|---|---|---|---|---|";
const share = (rows, label, bar, weights) => number((100 * (meanLoss(rows[label], weights) - meanLoss(rows[bar], weights))) / (meanLoss(rows.search, weights) - meanLoss(rows[bar], weights)));

function printFamily(family, w) {
  const rows = playedOn(family, w);
  const weights = WEIGHTS[w];
  const bar = meanLoss(rows.R1, weights) <= meanLoss(rows["R2s*b"], weights) ? "R1" : "R2s*b";
  const best = `R3*${bestOf(w, variantsOf(w))}`;
  console.log(`\n### ${family}, ${w} (barre ${bar}, meilleur réglage ${best}, part du gain de la recherche ${share(rows, best, bar, weights)} %)\n`);
  for (const [label, list] of Object.entries(rows)) console.log(`- ${label} : ${["unemployment", "unemploymentPeak", "inflationGap", "debt", "floorQuarters"].map((k) => number(mean(list, k))).join(" / ")}`);
  console.log(HEADER);
  console.log(line("R3*cmaes − R3*climb", rows["R3*cmaes"], rows["R3*climb"], weights));
  if (rows["R3*large"]) console.log(line("R3*large − R3*climb", rows["R3*large"], rows["R3*climb"], weights));
  console.log(line(`${best} − ${bar}`, rows[best], rows[bar], weights));
  console.log(line(`${best} − recherche`, rows[best], rows.search, weights));
}

function printMeasure() {
  console.log("\n## La mesure, graines 1 à 200\n");
  for (const w of weightsDone) for (const family of FAMILIES) printFamily(family, w);
}

/** ÉCO with a hypothesis moved by a factor, as scripts/search.js builds it. */
function worldOf(spec) {
  const [param, factor] = spec.split(":");
  return createEco(TARGETS, { ...ASSUMED, [param]: ASSUMED[param] * Number(factor) });
}

/** R3* tuned on ÉCO under balance (the climb or CMA-ES), in each shifted world of J6, against R1 and the search there. */
function printShifted() {
  const w = "balance";
  const best = bestOf(w, OPTIMIZERS);
  console.log(`\n## Le modèle décalé : R3*${best}, réglée sur ÉCO, dans les mondes de J6 (${w})\n`);
  for (const group of searchRuns().filter((g) => !g.key.startsWith("ÉCO"))) {
    const [world, , , family] = group.key.split(" | ");
    const seeds = group.rows.search.length;
    const rows = /** @type {Record<string, any[]>} */ ({ ...play({ R3: ["R3", tuned(best, w).coefficients] }, /** @type {any} */ (family), seeds, worldOf(world)), R1: group.rows.R1, search: group.rows.search });
    console.log(`\n### ${world}, ${family}, ${seeds} graines (part du gain de la recherche ${share(rows, "R3", "R1", WEIGHTS[w])} %)\n${HEADER}`);
    console.log(line("R3* − R1", rows.R3, rows.R1, WEIGHTS[w]));
    console.log(line("recherche − R1", rows.search, rows.R1, WEIGHTS[w]));
    console.log(line("R3* − recherche", rows.R3, rows.search, WEIGHTS[w]));
  }
}

printTunings();
printMeasure();
printShifted();
