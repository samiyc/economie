import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRng } from "mcts-commun/random.js";
import { beliefOf, crisisOf, FAMILIES, NOISE } from "../src/crises/families.js";
import { ECO } from "../src/eco/model.js";
import { LIMITS, TEXTBOOK } from "../src/policy/rules.js";
import { simulate } from "../src/policy/simulate.js";
import { WEIGHTS } from "../src/policy/tuning.js";
import { createBeamPlanner } from "../src/search/beam.js";
import { createPlanner } from "../src/search/planner.js";
import { createRollout } from "../src/search/rollout.js";

const fields = (size) => ({ conf: new Float64Array(size), xshock: new Float64Array(size), eshock: new Float64Array(size), pmshock: new Float64Array(size) });

/** The futures of a belief at the end of quarter `t`. */
function futuresAt(belief, t, count = 20, horizon = 8) {
  const out = fields(count * horizon);
  belief.futures({ t, count, horizon, rng: createRng(9), out });
  return { out, count, horizon, of: (key, k) => Array.from(out[key].subarray(k * horizon, (k + 1) * horizon)) };
}

describe("what a planner knows of a crisis", () => {
  it("knows neither when it starts nor how long it lasts, before it starts", () => {
    const seed = 3;
    const start = crisisOf("materials", seed, 40).findIndex((s) => s.eshock > 1);
    const f = futuresAt(beliefOf("materials", seed, 40), 1);
    const starts = new Set(Array.from({ length: f.count }, (_, k) => f.of("eshock", k).findIndex((e) => e > 1) + 2));
    assert.ok(starts.size > 1 && starts.has(start), `starts ${[...starts]} (the true one ${start})`);
  });

  it("knows the start and the strength once seen, not yet the length; the whole crisis once it decays", () => {
    const seed = 5;
    const truth = crisisOf("materials", seed, 60).map((s) => s.eshock);
    const start = truth.findIndex((e) => e > 1);
    const held = futuresAt(beliefOf("materials", seed, 60), start + 1);
    for (let k = 0; k < held.count; k += 1) assert.equal(held.of("eshock", k)[0], truth[start + 2], "the next quarter, still held");
    const lengths = new Set(Array.from({ length: held.count }, (_, k) => held.of("eshock", k).findIndex((e, q) => e < truth[start + 2] && q > 0)));
    assert.ok(lengths.size > 1, "the length is drawn");
    const end = truth.findIndex((e, t) => t > start && e < truth[t - 1]);
    const decaying = futuresAt(beliefOf("materials", seed, 60), end);
    for (let k = 0; k < decaying.count; k += 1) assert.deepEqual(decaying.of("eshock", k), truth.slice(end + 1, end + 9));
  });

  it("carries the noise on from its last value, and draws no crisis in the calm", () => {
    const shocks = crisisOf("calm", 2, 40);
    const f = futuresAt(beliefOf("calm", 2, 40), 10, 400, 1);
    const mean = f.out.conf.reduce((a, b) => a + b, 0) / 400;
    assert.ok(Math.abs(mean - NOISE.persistence * shocks[10].conf) < 3 * NOISE.spread / Math.sqrt(400) + 1e-4, `mean ${mean}`);
    assert.ok(f.out.eshock.every((e) => e === 1) && f.out.xshock.every((x) => x === 1));
    assert.throws(() => beliefOf(/** @type {any} */ ("war"), 1, 4), /no family war/);
    assert.equal(FAMILIES.calm.draw(), null);
  });
});

describe("a plan played on the futures", () => {
  it("costs what the run would: the futures set to the true shocks, the purchases held, Taylor's rate", () => {
    const run = simulate({ family: "unemployment", seed: 4, rule: "R1" });
    const [t, horizon, periods] = [10, 6, 40];
    const taylor = { neutral: ECO.DEFAULTS.rcb - ECO.DEFAULTS.piT, inflation: TEXTBOOK.inflation, gap: TEXTBOOK.gap };
    const rollout = createRollout(ECO, { horizon, count: 1, periods, weights: WEIGHTS.balance, taylor });
    const shocks = crisisOf("unemployment", 4, 40);
    for (let q = 0; q < horizon; q += 1) for (const key of ["conf", "xshock", "eshock", "pmshock"]) rollout.futures[key][q] = shocks[t + 1 + q][key];
    const held = (key) => new Float64Array(horizon).fill(ECO.DEFAULTS[key]);
    const before = Float64Array.from([8, 9, 10].map((k) => run.at("GDP", k)));
    const loss = rollout.loss({ state: run.state(t), rate: run.levers.rcb[t + 1], gshares: held("gshare"), before });
    let expected = 0;
    for (let k = t + 1; k <= t + horizon; k += 1) {
      const inflation = (1 + run.at("pic", k)) * (1 + run.at("pi1", k)) * (1 + run.at("pi2", k)) * (1 + run.at("pi3", k)) - 1;
      expected += (100 * run.at("u", k)) / 0.2 / periods + (100 * Math.abs(inflation - 0.02)) / 0.2 / periods;
    }
    const end = t + horizon;
    expected += (100 * run.at("DEBT", end)) / 2 / (run.at("GDP", end) + run.at("GDP", end - 1) + run.at("GDP", end - 2) + run.at("GDP", end - 3));
    assert.ok(Math.abs(loss - expected) < 1e-9, `${loss} against ${expected}`);
  });
});

describe("the rolling-horizon planner", () => {
  const plan = (seed, budget = 12) => simulate({
    family: "unemployment", seed, rule: "R0",
    policy: (run) => createPlanner({ model: ECO, weights: WEIGHTS.balance, budget, count: 2, horizon: 4 }, run),
  });

  it("replays from its seed, keeps the purchases within their bounds and speed, and leaves the rate to Taylor", () => {
    const a = plan(6);
    assert.deepEqual(a.states, plan(6).states);
    const point = a.at("GDP", 0) / 100 / (a.at("p", 0) * a.at("yfe", 0));
    for (let t = 1; t <= 40; t += 1) {
      assert.ok(Math.abs(a.levers.gshare[t] - a.levers.gshare[0]) <= LIMITS.spendingBand * 100 * point + 1e-12);
      assert.ok(Math.abs(a.levers.gshare[t] - a.levers.gshare[t - 1]) <= LIMITS.spendingStep * 100 * 1.2 * point);
    }
    const r1 = simulate({ family: "unemployment", seed: 6, rule: "R1" });
    assert.equal(a.levers.rcb[2], r1.levers.rcb[2], "the same rate while the purchases have not moved yet");
    assert.equal(a.levers.gshare[1], a.levers.gshare[0], "the first quarter's purchases were voted before it");
  });

  it("moves the purchases when it pays", () => {
    const a = plan(7, 40);
    assert.ok(a.levers.gshare.some((g) => g !== a.levers.gshare[0]));
  });
});

describe("the beam planner", () => {
  const beamed = (seed, width = 10) => simulate({
    family: "unemployment", seed, rule: "R0",
    policy: (run) => createBeamPlanner({ model: ECO, weights: WEIGHTS.jobs, width, count: 2, horizon: 8 }, run),
  });

  it("replays from its seed, and moves the purchases by half points of GDP, within their band", () => {
    const a = beamed(3);
    assert.deepEqual(a.states, beamed(3).states);
    const point = a.at("GDP", 0) / 100 / (a.at("p", 0) * a.at("yfe", 0));
    for (let t = 1; t <= 40; t += 1) {
      assert.ok(Math.abs(a.levers.gshare[t] - a.levers.gshare[0]) <= LIMITS.spendingBand * 100 * point + 1e-12);
      const move = Math.abs(a.levers.gshare[t] - a.levers.gshare[t - 1]);
      assert.ok(move <= LIMITS.spendingStep * 100 * 1.2 * point, `quarter ${t}`);
    }
    assert.ok(a.levers.gshare.some((g) => g !== a.levers.gshare[0]), "it moves");
  });

  it("holds the purchases when no child lives", () => {
    const run = { start: { rcb: 0.03, gshare: 0.3, piT: 0.02, point: 0.01 }, belief: beliefOf("calm", 1, 40), seed: 1, periods: 40 };
    const planner = createBeamPlanner({ model: ECO, weights: WEIGHTS.balance, width: 2, count: 1, horizon: 0 }, run);
    const played = simulate({ family: "calm", seed: 1, rule: "R1" });
    planner.decide(played, 1, played.state(1));
    assert.equal(planner.levers().gshare, 0.3);
  });
});
