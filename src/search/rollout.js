import { taylor } from "../policy/rules.js";
import { UNITS } from "../policy/tuning.js";

/**
 * A plan's worth on the futures a planner drew (docs/modele.md, § 9): from the state at the end of quarter `t`, each
 * future played on the planner's `model` with the plan's purchases, quarter by quarter, the central bank setting its
 * rate by the textbooks' Taylor (`taylor`, the public rule it is known to follow), `horizon` quarters: past the
 * end of the run too, as a state goes on (a planner that knew the end would spend in its last quarters). The loss
 * is J5's (src/policy/tuning.js), quarter by quarter: the unemployment and the distance of the year's inflation to
 * 2 %, each a fortieth of the run's mean, in units of their smallest gain; the debt at the plan's last quarter, a
 * share of its year's GDP, for the debt at the end. Nothing is allocated once created.
 */

/** A quarter of future `k`: its shocks and the plan's levers into the parameters, then the model's step. */
function play(c, k, q, { gshares }) {
  const at = k * c.horizon + q;
  c.params.conf = c.futures.conf[at];
  c.params.xshock = c.futures.xshock[at];
  c.params.eshock = c.futures.eshock[at];
  c.params.pmshock = c.futures.pmshock[at];
  c.params.rcb = c.rate;
  c.params.gshare = gshares[q];
  c.model.step(c.params, c.buffer);
  c.rate = taylor(c.seen, 0, c.rate, c.taylor);
}

/** What a played quarter costs: the unemployment and the year's inflation away from 2 %. */
function quarterLoss({ buffer: b, V, scale }) {
  const inflation = (1 + b[V.pic]) * (1 + b[V.pi1]) * (1 + b[V.pi2]) * (1 + b[V.pi3]) - 1;
  return scale.u * b[V.u] + scale.pi * Math.abs(inflation - 0.02);
}

/** Future `k` played from the run's state; `before` the GDP of quarters t − 2 to t. */
function one(c, k, run) {
  const { buffer, gdp, V } = c;
  buffer.set(run.state);
  gdp.set(run.before, 1);
  c.rate = run.rate;
  let total = 0;
  for (let q = 0; q < run.quarters; q += 1) {
    play(c, k, q, run);
    total += quarterLoss(c);
    gdp.copyWithin(0, 1);
    gdp[3] = buffer[V.GDP];
  }
  return total + (c.scale.debt * buffer[V.DEBT]) / (gdp[0] + gdp[1] + gdp[2] + gdp[3]);
}

/**
 * @param {import("../types.js").Model} model
 * @param {{ horizon: number, count: number, periods: number, weights: { unemployment: number, inflationGap: number, debt: number }, taylor: { neutral: number, inflation: number, gap: number } }} shape
 */
export function createRollout(model, { horizon, count, periods, weights, taylor: rule }) {
  const size = count * horizon;
  /** @type {any} */
  const c = {
    model, horizon, V: model.V,
    buffer: new Float64Array(model.VARS.length),
    params: { ...model.DEFAULTS },
    futures: { conf: new Float64Array(size), xshock: new Float64Array(size), eshock: new Float64Array(size), pmshock: new Float64Array(size) },
    gdp: new Float64Array(4),
    rate: 0,
    taylor: rule,
    seen: { at: (name) => c.buffer[c.V[name]] },
    scale: {
      u: (100 * weights.unemployment) / UNITS.unemployment / periods,
      pi: (100 * weights.inflationGap) / UNITS.inflationGap / periods,
      debt: (100 * weights.debt) / UNITS.debt,
    },
  };
  const run = { state: new Float64Array(0), quarters: horizon, rate: 0, gshares: new Float64Array(0), before: new Float64Array(0) };
  return {
    futures: c.futures,
    /**
     * The mean loss of the plan's purchases (`gshares`: quarters t + 1 on) over the futures, `rate` the one decided
     * for quarter t + 1.
     *
     * @param {{ state: Float64Array, rate: number, gshares: Float64Array, before: Float64Array }} plan
     */
    loss({ state, rate, gshares, before }) {
      Object.assign(run, { state, rate, gshares, before });
      let total = 0;
      for (let k = 0; k < count; k += 1) total += one(c, k, run);
      return total / count;
    },
  };
}
