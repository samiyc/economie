import { createClimb } from "mcts-commun/climb.js";
import { createCmaes } from "mcts-commun/cmaes.js";
import { createRng } from "mcts-commun/random.js";
import { R3_START } from "./countercyclical.js";
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
 *
 * Two searches can tune (docs/regle-r3.md): the climb, and CMA-ES (mcts-commun's `createCmaes`), each gene brought to
 * [0, 1] for it, a plan outside the bounds clamped and fined. Both note the best loss found at the same budgets.
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

/**
 * The tunings, each a rule and what it tunes, within what (H, Q-S12):
 * - **R1**, **R2s** (J5): Taylor's two responses; for R2s, also the share of its deficit's gap closed a year;
 * - **R1n**, **R2sn** (J6): the same, and Taylor's neutral real rate, moved by −3 to +3 points from the model's (1 %).
 *   They found that ÉCO makes a low rate cost next to nothing (docs/recherche.md), so the central bank stays apart;
 * - **R2sb** (J6, Sami, 10/11): the central bank independent, Taylor the textbooks'; the deficit rule's speed alone;
 * - **R3** (16/11): the countercyclical rule's seven numbers (src/policy/countercyclical.js), Taylor the textbooks'.
 */
export const TUNINGS = Object.freeze({
  R1: { rule: "R1", genes: [["inflation", 0, 3], ["gap", 0, 3]] },
  R2s: { rule: "R2s", genes: [["inflation", 0, 3], ["gap", 0, 3], ["speed", 0, 1]] },
  R1n: { rule: "R1", genes: [["inflation", 0, 3], ["gap", 0, 3], ["shift", -0.03, 0.03]] },
  R2sn: { rule: "R2s", genes: [["inflation", 0, 3], ["gap", 0, 3], ["shift", -0.03, 0.03], ["speed", 0, 1]] },
  R2sb: { rule: "R2s", genes: [["speed", 0, 1]] },
  R3: {
    rule: "R3",
    genes: [["jobs", 0, 3], ["rise", 0, 5], ["prices", 0, 3], ["consolidation", 0, 1], ["patience", 0.1, 3], ["reference", -1, 1], ["smooth", 0.1, 1]],
  },
});

/** Every rule's coefficients where a tuning starts: the textbooks', and R3 responding to nothing (it is then R1). */
const BASE = Object.freeze({ ...TEXTBOOK, ...R3_START });
/** The budgets at which a tuning notes the best loss found so far. */
const MARKS = [50, 100, 200, 400, 800, 1600];
/** CMA-ES's fine for a plan outside the bounds, per squared share of a gene's range. */
const FINE = 100;

/** @typedef {{ unemployment: number, inflationGap: number, debt: number }} Weights */

/** @param {Weights} objectives @param {Weights} weights */
export const lossOf = (objectives, weights) =>
  Object.keys(UNITS).reduce((sum, key) => sum + (weights[key] * objectives[key]) / UNITS[key], 0);

/** A rule's untuned coefficients: R3's start, or the textbooks'. */
const baseOf = (rule) => (rule === "R3" ? R3_START : TEXTBOOK);

/** The coefficients a plan stands for: the rule's untuned ones, the tuned ones replaced. */
function coefficientsOf({ rule, genes }, plan) {
  const coefficients = { ...baseOf(rule) };
  genes.forEach(([key], i) => {
    coefficients[key] = plan[i];
  });
  return coefficients;
}

/**
 * A rule's mean loss on the first `seeds` learning seeds of each family.
 *
 * @param {{ rule: "R1" | "R2s" | "R3", weights: Weights, seeds: number, coefficients?: Record<string, number> }} options
 */
export function learningLoss({ rule, weights, seeds, coefficients = baseOf(rule) }) {
  let sum = 0;
  for (const family of FAMILIES) {
    for (let i = 0; i < seeds; i += 1) sum += lossOf(objectivesOf(simulate({ family, seed: LEARNING + i, rule, check: false, coefficients })), weights);
  }
  return sum / (FAMILIES.length * seeds);
}

/** The climb's problem: from the textbooks' coefficients, a gene or more moved, a fresh plan now and then. */
function problemOf(genes, loss) {
  const clamp = (i, x) => Math.min(genes[i][2], Math.max(genes[i][1], x));
  return {
    start: (plan) => genes.forEach(([key], i) => {
      plan[i] = BASE[key];
    }),
    score: (plan) => -loss(plan),
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

/** CMA-ES over the genes brought to [0, 1], from where the climb starts; a plan outside clamped, and fined. */
function cmaesOf(genes, loss, { budget, seed }) {
  const values = new Float64Array(genes.length);
  const fined = (plan) => {
    let fine = 0;
    genes.forEach(([, low, high], i) => {
      const x = Math.min(1, Math.max(0, plan[i]));
      fine += (plan[i] - x) ** 2;
      values[i] = low + x * (high - low);
    });
    return -loss(values) - FINE * fine;
  };
  const mean = genes.map(([key, low, high]) => (BASE[key] - low) / (high - low));
  createCmaes({ genes: genes.length, mean, sigma: 0.3, seed }).run(fined, { budget });
}

/** The best loss and plan seen, noted at each of `MARKS` under `budget`, and at the end. */
function trackerOf(budget) {
  const marks = [...MARKS.filter((m) => m < budget), budget];
  const t = { evaluations: 0, loss: Infinity, plan: /** @type {number[]} */ ([]), curve: /** @type {Array<{ evaluations: number, loss: number }>} */ ([]) };
  const note = () => t.curve.push({ evaluations: t.evaluations, loss: t.loss });
  return Object.assign(t, {
    /** @param {ArrayLike<number>} plan @param {number} loss */
    see(plan, loss) {
      t.evaluations += 1;
      if (loss < t.loss) [t.loss, t.plan] = [loss, Array.from(plan)];
      if (t.evaluations === marks[t.curve.length]) note();
      return loss;
    },
    close: () => (t.curve.at(-1)?.evaluations === t.evaluations ? undefined : note()),
  });
}

/**
 * Tunes `name` (`TUNINGS`) under `weights`: `budget` plans scored, each on `seeds` learning seeds a family, by
 * `optimizer` (the climb or CMA-ES); `seed` its own draws. Returns the rule, the best coefficients, their loss, the
 * textbooks' loss on the same seeds, and the best loss at each mark of the budget.
 *
 * @param {{ name: keyof typeof TUNINGS, weights: Weights, seeds: number, budget: number, seed: number, optimizer?: "climb" | "cmaes" }} options
 */
export function tune({ name, weights, seeds, budget, seed, optimizer = "climb" }) {
  const tuning = TUNINGS[name];
  if (!tuning) throw new Error(`tuning: no tuning ${name}`);
  const { rule, genes } = /** @type {{ rule: "R1" | "R2s" | "R3", genes: Array<[string, number, number]> }} */ (tuning);
  const tracker = trackerOf(budget);
  const loss = (plan) => tracker.see(plan, learningLoss({ rule, weights, seeds, coefficients: coefficientsOf({ rule, genes }, plan) }));
  if (optimizer === "cmaes") cmaesOf(genes, loss, { budget, seed });
  else createClimb({ genes: genes.length }).run(problemOf(genes, loss), { budget, rng: createRng(seed) });
  tracker.close();
  return {
    rule,
    optimizer,
    coefficients: coefficientsOf({ rule, genes }, tracker.plan),
    loss: tracker.loss,
    textbook: learningLoss({ rule, weights, seeds }),
    evaluations: tracker.evaluations,
    curve: tracker.curve,
  };
}
