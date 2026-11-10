import { streamOf } from "mcts-commun/random.js";

/**
 * The crises (docs/modele.md, § 7): a family a kind of shock, a seed one crisis of it. The seed draws, on a stream of
 * its own (streamOf(seed, 0)), when the crisis starts (between the 4th and the 8th quarter), how deep and how long it
 * is; and, on another (streamOf(seed, 1)), the demand's noise every family shares, an AR(1) on the households'
 * confidence. Two rules compared on a seed see the same crisis, the same quarter, with the same noise.
 *
 * A crisis is the shocks of each quarter, 0 to `periods`: `conf` (the confidence lost, which cuts consumption and
 * investment), `xshock` (the foreign demand, 1 at rest), `eshock` (the price of energy, 1 at rest), `pmshock` (the
 * other import prices). The ranges are hypotheses anchored on an episode (H, Q-P9).
 *
 * @typedef {{ conf: number, xshock: number, eshock: number, pmshock: number }} Shocks
 */

/** The demand's noise: the persistence of the AR(1) on confidence, and its quarterly spread (H). */
export const NOISE = Object.freeze({ persistence: 0.7, spread: 0.002 });

/** The quarter a crisis starts, and how its strength `at` a quarter goes: up in two quarters, held, then decaying. */
function profile(start, length, decay) {
  return (t) => {
    if (t < start) return 0;
    if (t < start + length) return Math.min(1, (t - start + 1) / 2);
    return decay ** (t - start - length + 1);
  };
}

const uniform = (rng, low, high) => low + (high - low) * rng.next();

/**
 * Each family's law: `draw` its parameters (the start, the length, the strength), `shock` the crisis they make, quarter
 * by quarter; `starts` and `lengths` their ranges; `strength` the parameters seen from the crisis's first quarter on.
 *
 * - **calm**: nothing but the noise.
 * - **unemployment** (2008-2009): the confidence falls by 2 to 5 % for 4 to 8 quarters, the foreign demand by 5 to
 *   15 %, then both come back, by 30 % a quarter.
 * - **materials** (2022): energy 1.5 to 3 times dearer for 4 to 12 quarters, the other imports a tenth of that rise,
 *   then the prices come back by 16 % of the gap a quarter (half in four quarters).
 */
export const FAMILIES = Object.freeze({
  calm: { draw: () => null, shock: () => () => ({}), starts: [4, 8], lengths: [4, 8], strength: [] },
  unemployment: {
    draw: (rng) => ({ start: 4 + rng.int(5), length: 4 + rng.int(5), depth: uniform(rng, 0.02, 0.05), exports: uniform(rng, 0.05, 0.15) }),
    shock: (p) => {
      const at = profile(p.start, p.length, 0.7);
      return (t) => ({ conf: p.depth * at(t), xshock: 1 - p.exports * at(t) });
    },
    starts: [4, 8], lengths: [4, 8], strength: ["depth", "exports"],
  },
  materials: {
    draw: (rng) => ({ start: 4 + rng.int(5), length: 4 + rng.int(9), rise: uniform(rng, 0.5, 2) }),
    shock: (p) => {
      const at = profile(p.start, p.length, 0.84);
      return (t) => ({ eshock: 1 + p.rise * at(t), pmshock: 1 + 0.1 * p.rise * at(t) });
    },
    starts: [4, 8], lengths: [4, 12], strength: ["rise"],
  },
});

/** The law of `family`, or a throw. */
function lawOf(family) {
  const law = FAMILIES[family];
  if (!law) throw new Error(`crises: no family ${family}`);
  return law;
}

/** A quarter's shocks: the crisis's, the noise added to the confidence. */
const shocksAt = (crisis, t, noise) => {
  const c = crisis(t);
  return { xshock: 1, eshock: 1, pmshock: 1, ...c, conf: noise + (c.conf ?? 0) };
};

/**
 * The shocks of each quarter of the crisis `seed` of `family`, 0 to `periods`.
 *
 * @param {keyof typeof FAMILIES} family
 * @param {number} seed
 * @param {number} periods
 * @returns {Shocks[]}
 */
export function crisisOf(family, seed, periods) {
  const law = lawOf(family);
  const crisis = law.shock(law.draw(streamOf(seed, 0)));
  const noise = streamOf(seed, 1);
  let conf = 0;
  return Array.from({ length: periods + 1 }, (_, t) => {
    if (t > 0) conf = NOISE.persistence * conf + NOISE.spread * noise.normal();
    return shocksAt(crisis, t, conf);
  });
}

/** An integer drawn evenly in [low, high]. */
const between = (rng, low, high) => low + rng.int(high - low + 1);

/**
 * Parameters of `law` drawn from what is seen of the true ones `p` at the end of quarter `t` (the prior, conditioned):
 * before the start, only that it has not started; from it on, the start and the strength; while the crisis holds, that
 * it lasts at least so long; once it decays, its length.
 */
function conditioned(law, p, t, rng) {
  const guess = law.draw(rng);
  if (t < p.start) return { ...guess, start: between(rng, Math.max(law.starts[0], t + 1), law.starts[1]) };
  for (const key of law.strength) guess[key] = p[key];
  const held = t < p.start + p.length;
  return { ...guess, start: p.start, length: held ? between(rng, Math.max(law.lengths[0], t - p.start + 1), law.lengths[1]) : p.length };
}

/**
 * What a planner knows of the crisis `seed` of `family` (docs/modele.md, § 9, H, Q-S5): its family, what has been
 * seen of it, and the noise's last value; not its seed, nor how long it will last, nor the noise to come. `futures`
 * writes `count` futures of the quarters t + 1 to t + `horizon` into `out` (a field, then a future, then a quarter:
 * out.conf[k * horizon + q]), each drawn from the law conditioned on the crisis seen at the end of quarter `t`.
 *
 * @param {keyof typeof FAMILIES} family
 * @param {number} seed
 * @param {number} periods
 */
export function beliefOf(family, seed, periods) {
  const law = lawOf(family);
  const truth = law.draw(streamOf(seed, 0));
  const shocks = crisisOf(family, seed, periods);
  const seen = truth ? law.shock(truth) : () => ({});
  const noiseAt = (t) => shocks[t].conf - (seen(t).conf ?? 0);
  return {
    /** @param {{ t: number, count: number, horizon: number, rng: any, out: Record<keyof Shocks, Float64Array> }} request */
    futures({ t, count, horizon, rng, out }) {
      for (let k = 0; k < count; k += 1) {
        const crisis = truth ? law.shock(conditioned(law, truth, t, rng)) : seen;
        let noise = noiseAt(t);
        for (let q = 0; q < horizon; q += 1) {
          noise = NOISE.persistence * noise + NOISE.spread * rng.normal();
          const s = shocksAt(crisis, t + 1 + q, noise);
          for (const key of /** @type {Array<keyof Shocks>} */ (["conf", "xshock", "eshock", "pmshock"])) out[key][k * horizon + q] = s[key];
        }
      }
    },
  };
}
