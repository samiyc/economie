/**
 * The simple rules to beat (docs/modele.md, § 6), on ÉCO's two first levers: the policy rate `rcb`, which the central
 * bank sets for the next quarter, and the state's purchases `gshare`, voted one quarter and spent the next (§ 5,
 * Q-S6, Q-P5). The rate moves 0.5 point a quarter at most, never below 0 (Q-S8); the purchases 1 point of GDP a
 * quarter at most, within 5 points of their start.
 *
 * - **R0**: the levers stay where they start; the automatic stabilisers alone.
 * - **R1**: Taylor (1993), i = r* + π + 0.5 (π − 2 %) + 0.5 y, π over four quarters, y the output gap in points,
 *   r* the model's neutral real rate (its starting rate less its inflation, H, Q-P8).
 * - **R2**: R1, and the European rule (regulation 2024/1263) read as a path: the structural deficit falls by 0.5
 *   point a year down to 1.5 %, 3 % less the margin of resilience (H, Q-P14).
 * - **R2s**: R1, and a structural deficit of 3 %, the gap closed each year: the deficit less 0.63 times the output gap
 *   (the semi-elasticity of Mourre and Poissonnier, 2019).
 * - **R2n**: R1, and a nominal deficit of 3 %, the gap closed each year: the straw man, procyclical.
 *
 * A fiscal rule decides once a year (every fourth quarter), on the last four quarters, how much to spend; a naive
 * rule, as the real ones are: a point of deficit to cut is a point of GDP less spent.
 *
 * Their coefficients are the textbooks' (`TEXTBOOK`): Taylor's two 0.5, the model's neutral rate (`shift` 0), and the
 * deficit's gap closed in a year. J5 tunes them (src/policy/tuning.js): R1* and R2s* are R1 and R2s with other coefficients.
 *
 * @typedef {{ at: (name: string, t: number) => number }} History
 */

export const LIMITS = Object.freeze({ rateStep: 0.005, rateFloor: 0, spendingStep: 0.01, spendingBand: 0.05 });
export const SEMI_ELASTICITY = 0.63;
const TARGET = 0.02;

/**
 * Taylor's response to inflation above its target and to the output gap; the neutral real rate moved by `shift`; the
 * share of the deficit's gap closed a year.
 */
export const TEXTBOOK = Object.freeze({ inflation: 0.5, gap: 0.5, shift: 0, speed: 1 });

/** The inflation of the four quarters to `t`, from the model's last four quarterly rates. */
export const inflationOf = (h, t) => (1 + h.at("pic", t)) * (1 + h.at("pi1", t)) * (1 + h.at("pi2", t)) * (1 + h.at("pi3", t)) - 1;

/** The sum of `name` over the four quarters to `t` (fewer at the start). */
const lastYear = (h, name, t) => {
  let sum = 0;
  for (let k = Math.max(0, t - 3); k <= t; k += 1) sum += h.at(name, k);
  return sum;
};

/** The deficit of the four quarters to `t`, a share of their GDP, and the output gap's mean over them. */
export function yearOf(h, t) {
  const quarters = Math.min(4, t + 1);
  return { deficit: lastYear(h, "DEF", t) / lastYear(h, "GDP", t), gap: lastYear(h, "gap", t) / quarters };
}

/**
 * Taylor's rate for the quarter after `t`, within a step of `rate` and above the floor.
 *
 * @param {History} h
 * @param {number} t
 * @param {number} rate
 * @param {{ neutral: number, inflation: number, gap: number }} rule  the neutral real rate and the two responses
 */
export function taylor(h, t, rate, rule) {
  const inflation = inflationOf(h, t);
  const wanted = rule.neutral + inflation + rule.inflation * (inflation - TARGET) + rule.gap * h.at("gap", t);
  const stepped = Math.min(rate + LIMITS.rateStep, Math.max(rate - LIMITS.rateStep, wanted));
  return Math.max(LIMITS.rateFloor, stepped);
}

/** The deficit each fiscal rule aims at, for the year after `t`: nominal, structural, or the European path. */
const AIMS = {
  nominal: (h, t) => ({ deficit: yearOf(h, t).deficit, aim: 0.03 }),
  structural: (h, t) => {
    const { deficit, gap } = yearOf(h, t);
    return { deficit: deficit + SEMI_ELASTICITY * gap, aim: 0.03 };
  },
  european: (h, t, start) => {
    const { deficit, gap } = yearOf(h, t);
    return { deficit: deficit + SEMI_ELASTICITY * gap, aim: Math.max(0.015, start - 0.005 * (t / 4 + 1)) };
  },
};

export const RULES = Object.freeze({
  R0: { monetary: false, fiscal: null },
  R1: { monetary: true, fiscal: null },
  R2: { monetary: true, fiscal: "european" },
  R2s: { monetary: true, fiscal: "structural" },
  R2n: { monetary: true, fiscal: "nominal" },
});

/**
 * A rule's play of the levers over a run: `levers(t)` the values for quarter `t`, `decide(h, t)` what it decides at
 * the end of quarter `t`. `start` is the run's first quarter: its levers, its real purchases per point of GDP.
 *
 * @param {keyof typeof RULES} name
 * @param {{ rcb: number, gshare: number, piT: number, point: number, structural: number }} start
 * @param {{ inflation: number, gap: number, shift?: number, speed: number }} [coefficients]  the textbooks' by default
 */
export function createRule(name, start, coefficients = TEXTBOOK) {
  const rule = RULES[name];
  if (!rule) throw new Error(`rules: no rule ${name}`);
  const taylorOf = { neutral: start.rcb - start.piT + (coefficients.shift ?? 0), inflation: coefficients.inflation, gap: coefficients.gap };
  const band = [start.gshare - LIMITS.spendingBand * 100 * start.point, start.gshare + LIMITS.spendingBand * 100 * start.point];
  const now = { rcb: start.rcb, gshare: start.gshare, voted: start.gshare, aim: start.gshare };
  const decide = (h, t) => {
    if (rule.monetary) now.rcb = taylor(h, t, now.rcb, taylorOf);
    if (!rule.fiscal) return;
    now.gshare = now.voted;
    const point = h.at("GDP", t) / 100 / (h.at("p", t) * h.at("yfe", t));
    if (t % 4 === 0) {
      const { deficit, aim } = AIMS[rule.fiscal](h, t, start.structural);
      now.aim = now.voted - coefficients.speed * (deficit - aim) * 100 * point;
    }
    const step = LIMITS.spendingStep * 100 * point;
    now.voted = Math.min(band[1], Math.max(band[0], Math.min(now.voted + step, Math.max(now.voted - step, now.aim))));
  };
  return { name, levers: () => ({ rcb: now.rcb, gshare: now.gshare }), decide };
}
