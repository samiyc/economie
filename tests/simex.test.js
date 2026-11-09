import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { run } from "../src/models.js";
import { V } from "../src/sim/simex.js";

/** Whether `actual` is `expected` to `digits` decimals. */
const near = (actual, expected, digits) => Math.abs(actual - expected) < 0.5 * 10 ** -digits;

describe("SIMEX, SIM whose households expect their income (Godley and Lavoie, § 3.7)", () => {
  it("spends nothing in its first period but the government's purchases, expecting nothing", () => {
    const first = run("SIMEX", { start: "zero", periods: 1 }).state(1);
    assert.ok(near(first[V.C], 0, 12));
    assert.ok(near(first[V.Y], 20, 12));
    assert.ok(near(first[V.Hh], 16, 12));
  });

  it("holds the money it wanted, give or take the surprise on its income", () => {
    const states = run("SIMEX", { start: "zero", periods: 20 });
    for (let t = 1; t <= 20; t += 1) {
      const now = states.state(t);
      assert.ok(near(now[V.Hh] - now[V.Hd], now[V.YD] - now[V.YDe], 9));
    }
  });

  it("goes back to G / θ after a rise of the propensity to consume, which only lends a boom", () => {
    const income = run("SIMEX", { periods: 300, changes: [{ at: 1, alpha1: 0.7 }] }).series("Y");
    assert.ok(Math.max(...income) > 105);
    assert.ok(near(income[300], 100, 8));
  });
});
