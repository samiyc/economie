import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRng } from "mcts-commun/random.js";
import { PC, PCEX, run } from "../src/models.js";
import { DEFAULTS, V, assertParams, steadyState } from "../src/pc/model.js";

/** Whether `actual` is `expected` to `digits` decimals. */
const near = (actual, expected, digits) => Math.abs(actual - expected) < 0.5 * 10 ** -digits;

// By hand, at the book's values: k = (0.635 + 5 × 0.025)(1 − 0.6) / 0.4 − 0.01 = 0.75, then
// YD* = (1 − 0.2) × 20 / (0.2 − 0.8 × 0.025 × 0.75) = 16 / 0.185, Y* = YD* + 20, Bh* = 0.75 YD*, V* = YD*.
const YD_STAR = 16 / 0.185;

describe("PC's stationary state (Godley and Lavoie, ch. 4)", () => {
  it("is the one computed by hand", () => {
    const state = steadyState(DEFAULTS);
    assert.ok(near(state[V.YD], YD_STAR, 10));
    assert.ok(near(state[V.Y], YD_STAR + 20, 10));
    assert.ok(near(state[V.Y], 106.4865, 4));
    assert.ok(near(state[V.Bh], 0.75 * YD_STAR, 10));
    assert.ok(near(state[V.Hh], 0.25 * YD_STAR, 10));
    assert.ok(near(state[V.Bcb], state[V.Hs], 12));
  });

  it("is where the empty economy goes", () => {
    const last = run("PC", { start: "zero", periods: 400 }).state(400);
    for (const name of ["Y", "V", "Bh", "Hh", "Bs"]) assert.ok(near(last[V[name]], steadyState(DEFAULTS)[V[name]], 8), name);
  });

  it("is still: a step from it changes nothing", () => {
    const states = run("PC", { periods: 5 });
    for (let t = 1; t <= 5; t += 1) {
      for (const i of Object.values(V)) assert.ok(near(states.state(t)[i], states.state(0)[i], 9));
    }
  });

  it("does not exist when the interest outgrows the tax", () => {
    assert.throws(() => steadyState({ ...DEFAULTS, r: 0.3, theta: 0.05 }), /no stationary state/);
  });
});

describe("PC after a rise of the rate, from 2.5 % to 3.5 %", () => {
  // k = (0.635 + 0.175) − 0.01 = 0.8; YD* = 16 / (0.2 − 0.8 × 0.035 × 0.8) = 16 / 0.1776.
  it("ends at a higher income, the interest the government pays the households", () => {
    const last = run("PC", { periods: 400, changes: [{ at: 1, r: 0.035 }] }).state(400);
    assert.ok(near(last[V.Y], 16 / 0.1776 + 20, 8));
    assert.ok(near(last[V.Y], 110.0901, 4));
  });

  // The interest of a period is paid at the rate before, on the bills held before (r₋₁ · Bh₋₁).
  it("raises the income from the next period on: the households move to bills, and their interest is spent", () => {
    const income = run("PC", { periods: 3, changes: [{ at: 1, r: 0.035 }] }).series("Y");
    assert.ok(near(income[1], income[0], 12));
    assert.ok(income[2] > income[1] && income[3] > income[2]);
    const shares = run("PC", { periods: 1, changes: [{ at: 1, r: 0.035 }] });
    const share = (t) => shares.state(t)[V.Bh] / shares.state(t)[V.V];
    assert.ok(share(1) > share(0), "a higher rate, more of the wealth in bills");
  });

  it("makes the central bank buy fewer bills, and issue less money", () => {
    const states = run("PC", { periods: 1, changes: [{ at: 1, r: 0.035 }] });
    assert.ok(states.state(1)[V.Hs] < states.state(0)[V.Hs]);
    assert.ok(near(states.state(1)[V.Hs], states.state(1)[V.Hh], 9));
  });
});

describe("PCEX, the households who expect their income", () => {
  it("expects the last period's income, and lets the money take up the surprise", () => {
    const states = run("PCEX", { start: "zero", periods: 10 });
    for (let t = 1; t <= 10; t += 1) {
      const now = states.state(t);
      assert.ok(near(now[PCEX.V.YDe], states.state(t - 1)[PCEX.V.YD], 12));
      assert.ok(near(now[PCEX.V.Hh] - now[PCEX.V.Hd], now[PCEX.V.YD] - now[PCEX.V.YDe], 9));
    }
  });

  it("goes to PC's stationary state", () => {
    assert.ok(near(run("PCEX", { start: "zero", periods: 400 }).state(400)[V.Y], YD_STAR + 20, 8));
  });
});

describe("PC's parameters", () => {
  it("are refused out of range", () => {
    for (const bad of [{ r: -0.01 }, { r: 1 }, { lambda1: -1 }, { alpha1: 1 }, { theta: 0 }, { G: -1 }]) {
      assert.throws(() => assertParams({ ...DEFAULTS, ...bad }), /out of range/);
    }
  });

  it("keep the matrices consistent whatever they are, drawn by seed", () => {
    const rng = createRng(2611);
    const draw = (low, high) => low + (high - low) * rng.next();
    for (let n = 0; n < 50; n += 1) {
      const params = { ...DEFAULTS, G: draw(0, 50), alpha1: draw(0, 0.9), alpha2: draw(0.05, 0.6), theta: draw(0.1, 0.5), r: draw(0, 0.08) };
      const changes = [{ at: 10, r: draw(0, 0.08) }, { at: 20, G: draw(0, 50) }];
      for (const model of [PC, PCEX]) {
        assert.doesNotThrow(() => run(model.name, { params, periods: 40, start: n % 2 ? "zero" : "steady", changes }));
      }
    }
  });

  it("are a model's name the runner knows", () => {
    assert.throws(() => run("LP"), /no model LP/);
  });
});
