import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ECO } from "../src/eco/model.js";
import { ratiosOf } from "../src/eco/ratios.js";
import { TARGETS } from "../src/eco/targets.js";
import { runModel } from "../src/sfc/run.js";

/**
 * ÉCO against docs/modele.md, § 4: its starting quarter has France's proportions of 2024, and it behaves as the
 * studies say an economy does. Every run checks its matrices each quarter (src/sfc/run.js). The shocks are
 * hypotheses (H), here to measure the model, not yet the crisis families of J4.
 */

const V = ECO.V;
const AT = 4;
const run = (changes = [], periods = 40) => runModel(ECO, { start: "zero", periods, changes });
const value = (r, name, t) => r.state(t)[V[name]];
const total = (r, name, from, to) => {
  let sum = 0;
  for (let t = from; t <= to; t += 1) sum += value(r, name, t);
  return sum;
};
const base = run();

/** The extra GDP over the year that the purchases are 1 point of GDP higher, per point spent. */
function multiplier(before, from) {
  const share = before[before.length - 1]?.gshare ?? ECO.DEFAULTS.gshare;
  const plus = share + 1 / value(base, "yfe", 0);
  const without = run(before, from + 8);
  const fiscal = run([...before, { at: from, gshare: plus }, { at: from + 4, gshare: share }], from + 8);
  return (total(fiscal, "GDP", from, from + 3) - total(without, "GDP", from, from + 3))
    / (total(fiscal, "G", from, from + 3) - total(without, "G", from, from + 3));
}

describe("ÉCO's starting quarter", () => {
  it("has France's proportions of 2024", () => {
    const ratios = ratiosOf(base.state(0), V);
    for (const key of ["debt", "deficit", "spending", "levies", "unemployment", "pensions", "interest", "exports", "imports", "energy", "currentAccount", "foreignControl", "inflation"]) {
      assert.ok(Math.abs(ratios[key] - TARGETS[key]) < 1e-9, `${key}: ${ratios[key]} against ${TARGETS[key]}`);
    }
  });

  it("saves a little more than France's households do, having no housing to buy", () => {
    const { saving } = ratiosOf(base.state(0), V);
    assert.ok(saving > 0.08 && saving < 0.12, `saving ${saving}`);
  });

  it("goes on from there without a jump: a quarter later, the ratios have barely moved", () => {
    const [start, next] = [ratiosOf(base.state(0), V), ratiosOf(base.state(1), V)];
    for (const key of ["deficit", "spending", "levies", "unemployment", "exports", "imports"]) {
      assert.ok(Math.abs(next[key] - start[key]) < 0.002, `${key}: ${start[key]} then ${next[key]}`);
    }
    assert.ok(Math.abs(next.inflation - start.inflation) < 0.002);
  });

  it("drifts as France does: the deficit makes the debt grow faster than the GDP", () => {
    const later = ratiosOf(base.state(40), V);
    assert.ok(later.debt > 1.25 && later.debt < 1.45, `debt after ten years ${later.debt}`);
    assert.ok(Math.abs(later.inflation - 0.02) < 0.005);
  });
});

describe("ÉCO's behaviour (docs/modele.md, § 4)", () => {
  // A fall of confidence: households spend 2 % less, firms invest less.
  const slump = run([{ at: AT, conf: 0.02 }]);
  const year = AT + 3;

  it("loses about 0.63 point of budget balance a point of output gap (Mourre and Poissonnier 2019)", () => {
    const balance = (r) => -value(r, "DEF", year) / value(r, "GDP", year);
    const elasticity = (balance(slump) - balance(base)) / (value(slump, "gap", year) - value(base, "gap", year));
    assert.ok(elasticity > 0.5 && elasticity < 0.75, `semi-elasticity ${elasticity}`);
  });

  it("follows Okun: unemployment up 0.12 to 0.40 point a point of growth lost (Tavéra, Perman and Stephan 2016)", () => {
    const growth = (r) => value(r, "y", year) / value(r, "y", AT - 1);
    const okun = ((value(slump, "u", year) - value(base, "u", year)) * 100) / ((growth(slump) - growth(base)) * 100);
    assert.ok(okun > -0.4 && okun < -0.12, `Okun ${okun}`);
  });

  it("multiplies public purchases by more than 1 within a year when unemployment is high (Blanchard and Leigh 2013)", () => {
    const high = multiplier([], AT);
    assert.ok(high > 1 && high < 2, `multiplier ${high}`);
  });

  it("multiplies them by less at full employment, the demand the workers cannot serve going abroad", () => {
    const boom = [{ at: 1, gshare: ECO.DEFAULTS.gshare + 6 / value(base, "yfe", 0) }];
    assert.ok(value(run(boom), "u", 30) < 0.065);
    assert.ok(multiplier(boom, 30) < multiplier([], AT) - 0.2);
  });

  it("peaks at 7 to 10 % of inflation after the energy shock of 2022, with no policy but the stabilisers", () => {
    // Energy twice as dear for two years, the other imports 10 % dearer (France's bill doubled: 116 Md€ in 2022).
    const shock = run([{ at: AT, eshock: 2, pmshock: 1.1 }, { at: AT + 8, eshock: 1.3, pmshock: 1.1 }]);
    let peak = 0;
    for (let t = AT; t <= 40; t += 1) peak = Math.max(peak, value(shock, "pc", t) / value(shock, "pc", t - 4) - 1);
    assert.ok(peak > 0.07 && peak < 0.1, `peak inflation ${peak}`);
  });

  it("loses 6 to 10 % of a year's GDP in a pandemic like 2020's (Insee: −7.9 %)", () => {
    // The consumption and the exports that cannot happen, quarter by quarter, after the shape of 2020 (H).
    const pandemic = run([
      { at: AT, lock: 0.06, xshock: 0.94 }, { at: AT + 1, lock: 0.12, xshock: 0.75 },
      { at: AT + 2, lock: 0.03, xshock: 0.9 }, { at: AT + 3, lock: 0.05, xshock: 0.95 }, { at: AT + 4, lock: 0, xshock: 1 },
    ]);
    const fall = total(pandemic, "y", AT, AT + 3) / total(base, "y", AT, AT + 3) - 1;
    assert.ok(fall < -0.06 && fall > -0.1, `GDP ${fall}`);
  });
});
