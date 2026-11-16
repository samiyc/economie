import { readdirSync, readFileSync } from "node:fs";
import { paired } from "mcts-commun/measure.js";
import { lossOf } from "../../src/policy/tuning.js";

/**
 * The pairs of the reports (scripts/search-report.js, scripts/r3-report.js): A − B on each objective with its 95 %
 * interval, the verdict of the adoption threshold (docs/modele.md, § 8, Q-S3), and the loss of a set of weights.
 */

export const OBJECTIVES = ["unemployment", "inflationGap", "debt"];
const GAIN = { unemployment: 0.2, inflationGap: 0.2, debt: 2 };
const MARGIN = { unemployment: 0.1, inflationGap: 0.1, debt: 1 };

/** A number as the docs write it: two decimals, a comma, a true minus. */
export const number = (x) => x.toFixed(2).replace(".", ",").replace("-", "−");
export const mean = (list, key) => list.reduce((sum, o) => sum + o[key], 0) / list.length;
export const meanLoss = (list, weights) => list.reduce((sum, o) => sum + lossOf(o, weights), 0) / list.length;

/** The pair A − B on each objective, and the threshold's verdict: "gagne", "perd" or "—". */
export function verdict(a, b) {
  const pairs = Object.fromEntries(OBJECTIVES.map((k) => [k, paired(a.map((o) => o[k]), b.map((o) => o[k]))]));
  // A beats B: an objective's whole interval past the gain, every other's worst bound within the margin.
  const beats = (worst) => OBJECTIVES.some((k) => worst(k) <= -GAIN[k]) && OBJECTIVES.every((k) => worst(k) <= MARGIN[k]);
  let word = "—";
  if (beats((k) => pairs[k].high)) word = "gagne";
  else if (beats((k) => -pairs[k].low)) word = "perd";
  return { cells: OBJECTIVES.map((k) => `${number(pairs[k].mean)} [${number(pairs[k].low)} ; ${number(pairs[k].high)}]`), word };
}

/** The loss of weights `w`, A − B by pairs, with its interval. */
export function lossPair(a, b, w) {
  const p = paired(a.map((o) => lossOf(o, w)), b.map((o) => lossOf(o, w)));
  return `${number(p.mean)} [${number(p.low)} ; ${number(p.high)}]`;
}

/** scripts/search.js's runs, by world, tag, budget, family and weights, their seeds put together in order. */
export function searchRuns() {
  const folder = new URL("../../docs/mesures/recherche/", import.meta.url);
  const runs = readdirSync(folder).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(new URL(f, folder), "utf8")));
  const groups = new Map();
  for (const run of runs.sort((a, b) => a.from - b.from)) {
    const key = [run.world ?? "ÉCO", run.tag || "—", run.budget, run.family, run.weights].join(" | ");
    const group = groups.get(key) ?? { key, weights: run.weights, rows: {} };
    for (const [label, list] of Object.entries(run.rows)) group.rows[label] = [...(group.rows[label] ?? []), ...list];
    groups.set(key, group);
  }
  return [...groups.values()];
}
