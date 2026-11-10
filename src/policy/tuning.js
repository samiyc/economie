import { createClimb } from "mcts-commun/climb.js";
import { createRng } from "mcts-commun/random.js";
import { TEXTBOOK } from "./rules.js";
import { objectivesOf, simulate } from "./simulate.js";

/**
 * The rules tuned, not pulled from a hat (docs/modele.md, § 6, J5): their coefficients climbed by mcts-commun's
 * `createClimb` on **learning seeds**, from 1 000 001 on, never the measure's (1 to 4 000). The three families at once,
 * so that a tuned rule holds in the calm as in a crisis (§ 9, 4).
 *
 * A plan is scored by a loss: each objective of § 8 counted in units of its smallest gain worth having (Q-S3: 0.2 point
 * of unemployment, 0.2 point of inflation gap, 2 points of debt), weighted (H, Q-S11: three sets of weights, none the
 * right one). Linear, as the measure's means are: a tuned rule is judged as it will be measured.
 */

export const LEARNING = 1_000_001;
const FAMILIES = /** @type {Array<"calm" | "unemployment" | "materials">} */ (["calm", "unemployment", "materials"]);
export const UNITS = Object.freeze({ unemployment: 0.2, inflationGap: 0.2, debt: 2 });

/** Q-S11's three sets: balance, unemployment first, debt first. */
export const WEIGHTS = Object.freeze({
  balance: { unemployment: 1, inflationGap: 1, debt: 1 },
  jobs: { unemployment: 3, inflationGap: 1, debt: 1 },
  debt: { unemployment: 1, inflationGap: 1, debt: 3 },
});

/** What each rule tunes, and within what: Taylor's two responses; R2s, also the share of its deficit's gap closed a year. */
export const GENES = Object.freeze({
  R1: [["inflation", 0, 3], ["gap", 0, 3]],
  R2s: [["inflation", 0, 3], ["gap", 0, 3], ["speed", 0, 1]],
});

/** @typedef {{ unemployment: number, inflationGap: number, debt: number }} Weights */

/** @param {Weights} objectives @param {Weights} weights */
export const lossOf = (objectives, weights) =>
  Object.keys(UNITS).reduce((sum, key) => sum + (weights[key] * objectives[key]) / UNITS[key], 0);

/** The coefficients a plan stands for: the textbooks', the tuned ones replaced. */
function coefficientsOf(genes, plan) {
  const coefficients = { ...TEXTBOOK };
  genes.forEach(([key], i) => {
    coefficients[key] = plan[i];
  });
  return coefficients;
}

/**
 * A rule's mean loss on the first `seeds` learning seeds of each family.
 *
 * @param {{ rule: "R1" | "R2s", weights: Weights, seeds: number, coefficients?: typeof TEXTBOOK }} options
 */
export function learningLoss({ rule, weights, seeds, coefficients = TEXTBOOK }) {
  let sum = 0;
  for (const family of FAMILIES) {
    for (let i = 0; i < seeds; i += 1) sum += lossOf(objectivesOf(simulate({ family, seed: LEARNING + i, rule, check: false, coefficients })), weights);
  }
  return sum / (FAMILIES.length * seeds);
}

/** The climb's problem: from the textbooks' coefficients, a gene or more moved, a fresh plan now and then. */
function problemOf(rule, weights, seeds) {
  const genes = GENES[rule];
  const clamp = (i, x) => Math.min(genes[i][2], Math.max(genes[i][1], x));
  return {
    start: (plan) => genes.forEach(([key], i) => {
      plan[i] = TEXTBOOK[key];
    }),
    score: (plan) => -learningLoss({ rule, weights, seeds, coefficients: coefficientsOf(genes, plan) }),
    mutate: (child, best, amplitude, rng) => {
      const moved = rng.int(genes.length);
      for (let i = 0; i < genes.length; i += 1) {
        const spread = amplitude * 0.25 * (genes[i][2] - genes[i][1]);
        child[i] = i === moved || rng.next() < 0.3 ? clamp(i, best[i] + spread * rng.normal()) : best[i];
      }
    },
    fresh: (plan, rng) => genes.forEach(([, low, high], i) => {
      plan[i] = low + rng.next() * (high - low);
    }),
  };
}

/**
 * Tunes `rule` under `weights`: `budget` plans scored, each on `seeds` learning seeds a family; `seed` the climb's own.
 * Returns the best coefficients, their loss, and the textbooks' loss on the same seeds.
 *
 * @param {{ rule: "R1" | "R2s", weights: Weights, seeds: number, budget: number, seed: number }} options
 */
export function tune({ rule, weights, seeds, budget, seed }) {
  const genes = GENES[rule];
  if (!genes) throw new Error(`tuning: no genes for ${rule}`);
  const result = createClimb({ genes: genes.length }).run(problemOf(rule, weights, seeds), { budget, rng: createRng(seed) });
  return {
    coefficients: coefficientsOf(genes, result.plan),
    loss: -result.score,
    textbook: learningLoss({ rule, weights, seeds }),
    evaluations: result.evaluations,
  };
}
