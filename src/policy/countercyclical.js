import { inflationOf, LIMITS, SEMI_ELASTICITY, taylor, TEXTBOOK, yearOf } from "./rules.js";

/**
 * **R3**, a fiscal rule written after the search of J6 (docs/recherche.md, § 7): spend early when unemployment rises,
 * consolidate once it is back. The central bank follows the textbooks' Taylor, as in J6 (Sami, 10/11). Unlike the
 * rules of J4, it decides every quarter, as the search does; the purchases are still voted a quarter before they are
 * spent, within the bounds of § 5 (Q-S6).
 *
 * The purchases it aims at are a base, plus a response, in points of GDP:
 * - `jobs` points for each point of unemployment above its reference (the start's, moved by `reference` points);
 * - `rise` points for each point unemployment rose over the last year: the early response;
 * - `prices` points less for each point of inflation above 2 %;
 * - the base consolidates once a year, closing `consolidation` of the structural deficit's gap to 3 %, and less so
 *   while unemployment is above its reference: not at all `patience` points above it;
 * - the purchases voted move `smooth` of the way to the aim each quarter.
 *
 * With every response at 0 it is R1: the purchases stay where they started. Its seven numbers are tuned
 * (src/policy/tuning.js), by the climb and by CMA-ES, on the same budget (docs/regle-r3.md).
 */

export const R3_START = Object.freeze({ jobs: 0, rise: 0, prices: 0, consolidation: 0, patience: 1, reference: 0, smooth: 1 });

/** The share of the year's consolidation done with unemployment `above` points over its reference. */
const roomOf = (above, patience) => Math.min(1, Math.max(0, 1 - Math.max(0, above) / patience));

/**
 * R3's play of the levers over a run, as `createRule`'s: `levers()` for the next quarter, `decide(h, t)` at the end
 * of quarter `t`.
 *
 * @param {{ rcb: number, gshare: number, piT: number, point: number }} start
 * @param {Partial<typeof R3_START>} [coefficients]  R3_START's for those missing
 */
export function createCountercyclical(start, coefficients = R3_START) {
  const c = { ...R3_START, ...coefficients };
  const bank = { neutral: start.rcb - start.piT, inflation: TEXTBOOK.inflation, gap: TEXTBOOK.gap };
  const band = [start.gshare - LIMITS.spendingBand * 100 * start.point, start.gshare + LIMITS.spendingBand * 100 * start.point];
  const within = (g) => Math.min(band[1], Math.max(band[0], g));
  const now = { rcb: start.rcb, gshare: start.gshare, voted: start.gshare, base: start.gshare };
  /** @param {{ at: (name: string, t: number) => number }} h @param {number} t */
  const decide = (h, t) => {
    now.rcb = taylor(h, t, now.rcb, bank);
    now.gshare = now.voted;
    const point = h.at("GDP", t) / 100 / (h.at("p", t) * h.at("yfe", t));
    const above = 100 * (h.at("u", t) - h.at("u", 0)) - c.reference;
    if (t % 4 === 0) {
      const { deficit, gap } = yearOf(h, t);
      const structural = deficit + SEMI_ELASTICITY * gap;
      now.base = within(now.base - c.consolidation * roomOf(above, c.patience) * (structural - 0.03) * 100 * point);
    }
    const rise = 100 * (h.at("u", t) - h.at("u", Math.max(0, t - 4)));
    const inflation = 100 * (inflationOf(h, t) - 0.02);
    const aim = now.base + point * (c.jobs * above + c.rise * rise - c.prices * inflation);
    const wanted = now.voted + c.smooth * (aim - now.voted);
    const step = LIMITS.spendingStep * 100 * point;
    now.voted = within(Math.min(now.voted + step, Math.max(now.voted - step, wanted)));
  };
  return { name: "R3", levers: () => ({ rcb: now.rcb, gshare: now.gshare }), decide };
}
