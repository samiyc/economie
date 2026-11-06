import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRng } from "mcts-commun/random.js";
import { DEFAULTS, V, assertParams, steadyState } from "../src/sim/model.js";
import { runSim, schedule } from "../src/sim/run.js";

/** Whether `actual` is `expected` to `digits` decimals. */
const near = (actual, expected, digits) => Math.abs(actual - expected) < 0.5 * 10 ** -digits;

describe("SIM from the empty economy (Godley and Lavoie, ch. 3)", () => {
  // By hand: Y1 = G / (1 − α1 (1 − θ)) = 20 / 0.52, then T = 0.2 Y, YD = 0.8 Y, C = 0.6 YD, H = YD − C.
  it("gives the first period by hand", () => {
    const first = runSim({ start: "zero", periods: 1 }).state(1);
    assert.ok(near(first[V.Y], 20 / 0.52, 12));
    assert.ok(near(first[V.T], 0.2 * (20 / 0.52), 12));
    assert.ok(near(first[V.YD], 0.8 * (20 / 0.52), 12));
    assert.ok(near(first[V.C], 0.6 * 0.8 * (20 / 0.52), 12));
    assert.ok(near(first[V.Hh], 0.4 * 0.8 * (20 / 0.52), 12));
    assert.ok(near(first[V.Y], 38.4615, 4));
  });

  it("goes to Y* = G / θ = 100, with H* = 80 and a balanced budget", () => {
    const last = runSim({ start: "zero", periods: 200 }).state(200);
    assert.ok(near(last[V.Y], 100, 9));
    assert.ok(near(last[V.Hh], 80, 9));
    assert.ok(near(last[V.dHs], 0, 9));
  });

  // The gap of the money to its stationary value shrinks by ρ = 1 − α2 + α2 (1 − α1)(1 − θ) / (1 − α1 (1 − θ)) a period.
  it("closes its gap by the same ratio every period", () => {
    const money = runSim({ start: "zero", periods: 30 }).series("Hh");
    const rho = 1 - 0.4 + (0.4 * 0.4 * 0.8) / 0.52;
    for (let t = 1; t < 30; t += 1) assert.ok(near((80 - money[t + 1]) / (80 - money[t]), rho, 9));
  });

  it("ends at the same income whatever the propensities, which set only the pace", () => {
    const at = (alpha1, alpha2, periods) =>
      runSim({ params: { ...DEFAULTS, alpha1, alpha2 }, start: "zero", periods }).state(periods)[V.Y];
    assert.ok(near(at(0.6, 0.4, 400), 100, 6));
    assert.ok(near(at(0.8, 0.1, 400), 100, 6));
    assert.ok(at(0.8, 0.1, 10) < at(0.6, 0.4, 10), "households who spend less of their wealth reach it later");
  });
});

describe("SIM after a rise of the government's purchases", () => {
  // From the stationary state at G = 20 (Y 100, H 80), G = 30 from period 1: Y1 = (30 + 0.4 × 80) / 0.52. sfcr's README
  // prints this run rounded: 100, 119, 124, 128, 131, 134, 137.
  it("gives 119.2308, then 123.9645, as sfcr's README rounds them", () => {
    const income = runSim({ periods: 6, changes: [{ at: 1, G: 30 }] }).series("Y");
    assert.ok(near(income[0], 100, 12));
    assert.ok(near(income[1], 119.2308, 4));
    assert.ok(near(income[2], 123.9645, 4));
    assert.deepEqual([...income].map(Math.round), [100, 119, 124, 128, 131, 134, 137]);
  });

  it("settles at 150, the deficit closed by the tax on a higher income", () => {
    const last = runSim({ periods: 300, changes: [{ at: 1, G: 30 }] }).state(300);
    assert.ok(near(last[V.Y], 150, 8));
    assert.ok(near(last[V.T], 30, 8));
  });

  it("goes to 125 at G = 25, the book's experiment", () => {
    assert.ok(near(runSim({ periods: 300, changes: [{ at: 5, G: 25 }] }).state(300)[V.Y], 125, 8));
  });
});

describe("SIM's stationary state", () => {
  it("is still: a step from it changes nothing", () => {
    const run = runSim({ periods: 5 });
    for (let t = 1; t <= 5; t += 1) {
      for (const i of Object.values(V)) assert.ok(near(run.state(t)[i], run.state(0)[i], 9));
    }
  });

  it("has no saving: consumption is the whole disposable income", () => {
    const state = steadyState({ ...DEFAULTS, G: 35, theta: 0.25 });
    assert.ok(near(state[V.Y], 140, 12));
    assert.ok(near(state[V.C], state[V.YD], 12));
  });
});

describe("SIM's parameters", () => {
  it("are refused out of range", () => {
    for (const bad of [{ theta: 0 }, { theta: 1.2 }, { alpha1: 1 }, { alpha2: 0 }, { W: 0 }, { G: -1 }]) {
      assert.throws(() => assertParams({ ...DEFAULTS, ...bad }), /out of range/);
    }
  });

  it("change from their period on, in order of period", () => {
    const plan = schedule(DEFAULTS, [{ at: 3, theta: 0.25 }, { at: 2, G: 25 }], 4);
    assert.deepEqual(plan.map((p) => [p.G, p.theta]), [[20, 0.2], [20, 0.2], [25, 0.2], [25, 0.25], [25, 0.25]]);
  });

  it("keep the matrices consistent whatever they are, drawn by seed", () => {
    const rng = createRng(2026);
    const draw = (low, high) => low + (high - low) * rng.next();
    for (let n = 0; n < 50; n += 1) {
      const params = { G: draw(0, 50), W: draw(0.5, 2), alpha1: draw(0, 0.95), alpha2: draw(0.05, 0.9), theta: draw(0.05, 1) };
      const changes = [{ at: 10, G: draw(0, 50) }, { at: 20, theta: draw(0.05, 1) }];
      assert.doesNotThrow(() => runSim({ params, periods: 40, start: n % 2 ? "zero" : "steady", changes }));
    }
  });
});
