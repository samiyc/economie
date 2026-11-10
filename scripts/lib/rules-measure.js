import { paired } from "mcts-commun/measure.js";
import { objectivesOf, simulate } from "../../src/policy/simulate.js";
import { RULES } from "../../src/policy/rules.js";

/**
 * The simple rules measured by pairs (docs/modele.md, § 8), on a model of ÉCO: every rule on the same crises, seeds 1
 * to `seeds` of each family; for each objective, the means, each rule against R0 and R2s against R2n and R2, the
 * mean gap with its 95 % interval and the seeds won, tied and lost; for a crisis, what it adds to each pair against
 * the calm of the same seeds; and the statistical A/A, R1 against itself on the next seeds, then on two lots further
 * (`aaOther`, J5). scripts/rules.js and scripts/sensitivity.js print and keep it. Tuned rules (J5) join with their
 * own label and the pairs they are measured in.
 *
 * @typedef {{ label: string, rule: keyof typeof RULES, coefficients?: { inflation: number, gap: number, speed: number } }} Entry
 */

export const OBJECTIVES = ["unemployment", "inflationGap", "debt"];
export const REPORTED = ["unemployment", "unemploymentPeak", "inflationGap", "inflationPeak", "debt", "debtRise", "outputGap", "floorQuarters"];
const FAMILIES = /** @type {Array<"calm" | "unemployment" | "materials">} */ (["calm", "unemployment", "materials"]);
const NAMES = /** @type {Array<keyof typeof RULES>} */ (Object.keys(RULES));
const BASE = NAMES.map((rule) => ({ label: rule, rule }));
const PAIRS = [...NAMES.filter((r) => r !== "R0").map((r) => [r, "R0"]), ["R2s", "R2n"], ["R2s", "R2"]];

const round = (x) => Math.round(x * 1000) / 1000;
const meanOf = (list, key) => round(list.reduce((sum, o) => sum + o[key], 0) / list.length);

/** A pair's summary from mcts-commun's `paired`. */
const summary = (p) => ({ mean: round(p.mean), low: round(p.low), high: round(p.high), wins: p.wins, ties: p.ties, losses: p.losses });

/** Every entry's objectives on every seed of `family`, on `model`. */
function play(model, family, { seeds, tick, entries }) {
  const scores = Object.fromEntries(entries.map((e) => [e.label, []]));
  for (let seed = 1; seed <= seeds; seed += 1) {
    for (const { label, rule, coefficients } of entries) scores[label].push(objectivesOf(simulate({ family, seed, rule, coefficients, check: seed <= 20 }, model)));
    tick(family);
  }
  return scores;
}

/** R1 in the calm on `seeds` seeds from `from`. */
const calmR1 = (model, from, seeds) =>
  Array.from({ length: seeds }, (_, i) => objectivesOf(simulate({ family: "calm", seed: from + i, rule: "R1", check: false }, model)));

/** The A/A of two lots of R1 in the calm, objective by objective. */
const aaOf = (a, b) => Object.fromEntries(OBJECTIVES.map((key) => [key, pairOn({ A: a, B: b }, ["A", "B"], key)]));

/** The mean of each reported objective, rule by rule. */
const meansOf = (scores) => Object.fromEntries(Object.entries(scores).map(([rule, list]) =>
  [rule, Object.fromEntries(REPORTED.map((key) => [key, meanOf(list, key)]))]));

/** The pair A − B on `key`, seed by seed; with `calm`, what the crisis adds to it. */
function pairOn(scores, [a, b], key, calm = null) {
  const column = (rule) => scores[rule].map((o, i) => o[key] - (calm ? calm[rule][i][key] : 0));
  return summary(paired(column(a), column(b)));
}

/** The pairs A − B, objective by objective (what the crisis adds, with `calm`). */
const pairsOf = (scores, pairs, calm = null) =>
  pairs.map(([a, b]) => ({ a, b, ...Object.fromEntries(OBJECTIVES.map((key) => [key, pairOn(scores, [a, b], key, calm)])) }));

/**
 * The whole measure on `model`.
 *
 * @param {import("../../src/types.js").Model} model
 * @param {number} seeds
 * @param {(family: string) => void} [tick]
 * @param {{ entries: Entry[], pairs: string[][] }} [tuned]  the tuned rules, and the pairs they are measured in
 */
export function measureRules(model, seeds, tick = () => {}, tuned = { entries: [], pairs: [] }) {
  const entries = [...BASE, ...tuned.entries];
  const pairs = [...PAIRS, ...tuned.pairs];
  const played = Object.fromEntries(FAMILIES.map((family) => [family, play(model, family, { seeds, tick, entries })]));
  const families = Object.fromEntries(FAMILIES.map((family) => [family, {
    means: meansOf(played[family]),
    pairs: pairsOf(played[family], pairs),
    ...(family === "calm" ? {} : { crisis: pairsOf(played[family], pairs, played.calm) }),
  }]));
  const aa = aaOf(played.calm.R1, calmR1(model, seeds + 1, seeds));
  const aaOther = aaOf(calmR1(model, 2 * seeds + 1, seeds), calmR1(model, 3 * seeds + 1, seeds));
  return { date: new Date().toISOString().slice(0, 10), seeds, families, aa, aaOther };
}
