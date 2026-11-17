import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ECO, ECOFLEX } from "../src/eco/model.js";
import { ratiosOf } from "../src/eco/ratios.js";
import { TARGETS } from "../src/eco/targets.js";
import { FAMILIES } from "../src/crises/families.js";
import { simulate } from "../src/policy/simulate.js";
import { runModel } from "../src/sfc/run.js";

/**
 * ÉCO at a floating rate (src/eco/floating.js) against docs/change-flottant.md, § 2: the same start as at a fixed
 * rate, the foreigners holding France's share of the debt; a rate that holds still when nothing happens, and falls
 * when the central bank cuts, the import prices and the inflation following. Every run checks its matrices.
 */

const V = ECOFLEX.V;
const run = (model, changes = [], periods = 40) => runModel(model, { start: "zero", periods, changes });
const value = (r, name, t) => r.state(t)[V[name]];
const base = run(ECOFLEX);

describe("ÉCO at a floating rate: its start", () => {
  it("has France's proportions of 2024, as at a fixed rate", () => {
    const ratios = ratiosOf(base.state(0), V);
    for (const key of ["debt", "deficit", "spending", "levies", "unemployment", "pensions", "interest", "exports", "imports", "energy", "currentAccount", "foreignControl", "inflation"]) {
      assert.ok(Math.abs(ratios[key] - TARGETS[key]) < 1e-9, `${key}: ${ratios[key]} against ${TARGETS[key]}`);
    }
  });

  it("leaves 53.2 % of the debt to the foreigners, at a rate of 1", () => {
    assert.ok(Math.abs(value(base, "BLw", 0) / value(base, "DEBT", 0) - TARGETS.foreignHolders) < 1e-12);
    assert.equal(value(base, "xr", 0), 1);
  });

  it("holds its rate within 0.1 % for a year, and drifts by less than 3 % in ten as the current account erodes", () => {
    for (let t = 1; t <= 4; t += 1) assert.ok(Math.abs(value(base, "xr", t) - 1) < 0.001, `rate ${value(base, "xr", t)} at ${t}`);
    assert.ok(Math.abs(value(base, "xr", 40) - 1) < 0.03, `rate ${value(base, "xr", 40)} after ten years`);
  });
});

describe("ÉCO at a floating rate: the cost of a low rate (Q-S13)", () => {
  const rcb = ECOFLEX.DEFAULTS.rcb;
  const cut = run(ECOFLEX, [{ at: 1, rcb: rcb - 0.01 }], 12);
  const fixedBase = run(ECO, [], 12);
  const fixedCut = run(ECO, [{ at: 1, rcb: rcb - 0.01 }], 12);
  const rise = (r, b, name, t) => r.state(t)[V[name]] / b.state(t)[V[name]] - 1;
  const inflation = (r, t, model = ECOFLEX) => r.state(t)[model.V.pc] / r.state(t - 4)[model.V.pc] - 1;

  it("loses 4 to 8 % of its currency's value at once for a point cut (NiGEM: 5 % for 70 basis points)", () => {
    const fall = 1 - 1 / (1 + rise(cut, base, "xr", 1));
    assert.ok(fall > 0.04 && fall < 0.08, `currency ${fall}`);
  });

  it("passes it to the import prices, partly (ptm), then to the inflation, which a fixed rate does not", () => {
    assert.ok(rise(cut, base, "pm", 1) > 0.01, `import prices ${rise(cut, base, "pm", 1)}`);
    const floating = inflation(cut, 4) - inflation(base, 4);
    const fixed = inflation(fixedCut, 4, ECO) - inflation(fixedBase, 4, ECO);
    assert.ok(floating > fixed + 0.005, `inflation after a year: ${floating} floating, ${fixed} fixed`);
  });

  it("gains its currency's value when the central bank raises its rate", () => {
    const hike = run(ECOFLEX, [{ at: 1, rcb: rcb + 0.01 }], 4);
    assert.ok(rise(hike, base, "xr", 1) < -0.04);
  });
});

describe("ÉCO at a floating rate: the rules", () => {
  it("plays the rules on each family of crises, the matrices checked each quarter, the rate within bounds", () => {
    for (const family of Object.keys(FAMILIES)) {
      for (const rule of ["R0", "R1", "R2s"]) {
        for (let seed = 1; seed <= 5; seed += 1) {
          const { states } = simulate({ family, seed, rule, periods: 40 }, ECOFLEX);
          const rate = states[40 * ECOFLEX.VARS.length + V.xr];
          assert.ok(rate > 0.7 && rate < 1.5, `${family}, ${rule}, seed ${seed}: rate ${rate}`);
        }
      }
    }
  });
});
