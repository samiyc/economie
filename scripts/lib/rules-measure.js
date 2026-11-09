import { paired } from "mcts-commun/measure.js";
import { objectivesOf, simulate } from "../../src/policy/simulate.js";
import { RULES } from "../../src/policy/rules.js";

/**
 * The simple rules measured by pairs (docs/modele.md, § 8), on a model of ÉCO: every rule on the same crises, seeds 1
 * to `seeds` of each family; for each objective, the means, each rule against R0 and R2s against R2n and R2, the
 * mean gap with its 95 % interval and the seeds won, tied and lost; for a crisis, what it adds to each pair against
 * the calm of the same seeds; and the statistical A/A, R1 against itself on the next seeds. scripts/rules.js and
 * scripts/sensitivity.js print and keep it.
 */

export const OBJECTIVES = ["unemployment", "inflationGap", "debt"];
export const REPORTED = ["unemployment", "unemploymentPeak", "inflationGap", "inflationPeak", "debt", "debtRise", "outputGap", "floorQuarters"];
const FAMILIES = /** @type {Array<"calm" | "unemployment" | "materials">} */ (["calm", "unemployment", "materials"]);
const NAMES = /** @type {Array<keyof typeof RULES>} */ (Object.keys(RULES));
const PAIRS = [...NAMES.filter((r) => r !== "R0").map((r) => [r, "R0"]), ["R2s", "R2n"], ["R2s", "R2"]];

const round = (x) => Math.round(x * 1000) / 1000;
const meanOf = (list, key) => round(list.reduce((sum, o) => sum + o[key], 0) / list.length);

/** A pair's summary from mcts-commun's `paired`. */
const summary = (p) => ({ mean: round(p.mean), low: round(p.low), high: round(p.high), wins: p.wins, ties: p.ties, losses: p.losses });

/** Every rule's objectives on every seed of `family`, on `model`. */
function play(model, family, seeds, tick) {
  const scores = Object.fromEntries(NAMES.map((rule) => [rule, []]));
  for (let seed = 1; seed <= seeds; seed += 1) {
    for (const rule of NAMES) scores[rule].push(objectivesOf(simulate({ family, seed, rule, check: seed <= 20 }, model)));
    tick(family);
  }
  return scores;
}

/** The mean of each reported objective, rule by rule. */
const meansOf = (scores) => Object.fromEntries(Object.entries(scores).map(([rule, list]) =>
  [rule, Object.fromEntries(REPORTED.map((key) => [key, meanOf(list, key)]))]));

/** The pair A − B on `key`, seed by seed; with `calm`, what the crisis adds to it. */
function pairOn(scores, [a, b], key, calm = null) {
  const column = (rule) => scores[rule].map((o, i) => o[key] - (calm ? calm[rule][i][key] : 0));
  return summary(paired(column(a), column(b)));
}

/** The pairs A − B, objective by objective (what the crisis adds, with `calm`). */
const pairsOf = (scores, calm = null) =>
  PAIRS.map(([a, b]) => ({ a, b, ...Object.fromEntries(OBJECTIVES.map((key) => [key, pairOn(scores, [a, b], key, calm)])) }));

/**
 * The whole measure on `model`.
 *
 * @param {import("../../src/types.js").Model} model
 * @param {number} seeds
 * @param {(family: string) => void} [tick]
 */
export function measureRules(model, seeds, tick = () => {}) {
  const played = Object.fromEntries(FAMILIES.map((family) => [family, play(model, family, seeds, tick)]));
  const families = Object.fromEntries(FAMILIES.map((family) => [family, {
    means: meansOf(played[family]),
    pairs: pairsOf(played[family]),
    ...(family === "calm" ? {} : { crisis: pairsOf(played[family], played.calm) }),
  }]));
  const shifted = Array.from({ length: seeds }, (_, i) => objectivesOf(simulate({ family: "calm", seed: seeds + i + 1, rule: "R1", check: false }, model)));
  const aa = Object.fromEntries(OBJECTIVES.map((key) => [key, pairOn({ A: played.calm.R1, B: shifted }, ["A", "B"], key)]));
  return { date: new Date().toISOString().slice(0, 10), seeds, families, aa };
}
