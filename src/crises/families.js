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

/** The calm: nothing but the noise. */
const calm = () => () => ({});

/**
 * Unemployment (2008-2009): the confidence falls by 2 to 5 % for 4 to 8 quarters, the foreign demand by 5 to 15 %,
 * then both come back, by 30 % a quarter.
 */
function unemployment(rng) {
  const at = profile(4 + rng.int(5), 4 + rng.int(5), 0.7);
  const [depth, exports] = [uniform(rng, 0.02, 0.05), uniform(rng, 0.05, 0.15)];
  return (t) => ({ conf: depth * at(t), xshock: 1 - exports * at(t) });
}

/**
 * Raw materials (2022): energy 1.5 to 3 times dearer for 4 to 12 quarters, the other imports a tenth of that rise,
 * then the prices come back by 16 % of the gap a quarter (half in four quarters).
 */
function materials(rng) {
  const at = profile(4 + rng.int(5), 4 + rng.int(9), 0.84);
  const rise = uniform(rng, 0.5, 2);
  return (t) => ({ eshock: 1 + rise * at(t), pmshock: 1 + 0.1 * rise * at(t) });
}

export const FAMILIES = Object.freeze({ calm, unemployment, materials });

/**
 * The shocks of each quarter of the crisis `seed` of `family`, 0 to `periods`.
 *
 * @param {keyof typeof FAMILIES} family
 * @param {number} seed
 * @param {number} periods
 * @returns {Shocks[]}
 */
export function crisisOf(family, seed, periods) {
  const draw = FAMILIES[family];
  if (!draw) throw new Error(`crises: no family ${family}`);
  const shock = draw(streamOf(seed, 0));
  const noise = streamOf(seed, 1);
  let conf = 0;
  return Array.from({ length: periods + 1 }, (_, t) => {
    if (t > 0) conf = NOISE.persistence * conf + NOISE.spread * noise.normal();
    const crisis = shock(t);
    return { xshock: 1, eshock: 1, pmshock: 1, ...crisis, conf: conf + (crisis.conf ?? 0) };
  });
}
