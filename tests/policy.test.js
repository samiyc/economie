import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { crisisOf, NOISE } from "../src/crises/families.js";
import { R3_START } from "../src/policy/countercyclical.js";
import { createRule, inflationOf, LIMITS, taylor, TEXTBOOK, yearOf } from "../src/policy/rules.js";
import { objectivesOf, simulate } from "../src/policy/simulate.js";
import { learningLoss, lossOf, TUNINGS, tune, WEIGHTS } from "../src/policy/tuning.js";

/** A history whose every variable is `values[name]`, whatever the quarter. */
const flat = (values) => ({ at: (name) => values[name] ?? 0 });

describe("the crises", () => {
  it("replay from their seed, and share the noise across families", () => {
    assert.deepEqual(crisisOf("materials", 5, 40), crisisOf("materials", 5, 40));
    const conf = (family) => crisisOf(family, 5, 40).map((s) => s.conf);
    assert.deepEqual(conf("calm"), conf("materials"));
    assert.notDeepEqual(conf("calm"), conf("unemployment"));
  });

  it("start between the 4th and the 8th quarter, and come back", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const energy = crisisOf("materials", seed, 40).map((s) => s.eshock);
      const start = energy.findIndex((e) => e > 1);
      assert.ok(start >= 4 && start <= 8, `seed ${seed} starts at ${start}`);
      assert.ok(Math.max(...energy) <= 3 && energy[40] < energy[start + 3]);
      const slump = crisisOf("unemployment", seed, 40).map((s) => s.xshock);
      assert.ok(Math.min(...slump) >= 0.85 && slump[40] > 0.99);
    }
  });

  it("are calm but for a small AR(1) noise, and refuse an unknown family", () => {
    const calm = crisisOf("calm", 3, 400);
    assert.ok(calm.every((s) => s.eshock === 1 && s.xshock === 1));
    const spread = Math.sqrt(calm.reduce((sum, s) => sum + s.conf ** 2, 0) / calm.length);
    const expected = NOISE.spread / Math.sqrt(1 - NOISE.persistence ** 2);
    assert.ok(Math.abs(spread - expected) < expected * 0.3, `spread ${spread}`);
    assert.throws(() => crisisOf(/** @type {any} */ ("war"), 1, 4), /no family war/);
  });
});

describe("the rules", () => {
  it("read the year's inflation, deficit and gap", () => {
    assert.ok(Math.abs(inflationOf(flat({ pic: 0.01, pi1: 0.01, pi2: 0.01, pi3: 0.01 }), 8) - (1.01 ** 4 - 1)) < 1e-12);
    const year = yearOf(flat({ DEF: 5, GDP: 100, gap: -0.02 }), 8);
    assert.ok(Math.abs(year.deficit - 0.05) < 1e-12 && Math.abs(year.gap + 0.02) < 1e-12);
  });

  it("set Taylor's rate, half a point a quarter at most, never below zero", () => {
    const at = (inflation, gap) => flat({ pic: (1 + inflation) ** 0.25 - 1, pi1: (1 + inflation) ** 0.25 - 1, pi2: (1 + inflation) ** 0.25 - 1, pi3: (1 + inflation) ** 0.25 - 1, gap });
    const textbook = { neutral: 0.01, ...TEXTBOOK };
    assert.ok(Math.abs(taylor(at(0.02, 0), 4, 0.03, textbook) - 0.03) < 1e-12);
    assert.ok(Math.abs(taylor(at(0.04, 0.01), 4, 0.03, textbook) - (0.03 + LIMITS.rateStep)) < 1e-12);
    assert.equal(taylor(at(-0.02, -0.05), 4, 0.003, textbook), 0);
    const gentle = { neutral: 0.01, inflation: 0, gap: 0 };
    assert.ok(Math.abs(taylor(at(0.022, 0.01), 4, 0.03, gentle) - 0.032) < 1e-9, "the rate follows inflation one for one");
  });

  it("vote the purchases one quarter, spend them the next, a point of GDP a quarter at most", () => {
    const start = { rcb: 0.03, gshare: 0.3, piT: 0.02, point: 0.01, structural: 0.055 };
    const rule = createRule("R2n", start);
    const h = flat({ DEF: 6, GDP: 100, p: 1, yfe: 100, gap: 0, pic: 0.005, pi1: 0.005, pi2: 0.005, pi3: 0.005 });
    rule.decide(h, 4);
    assert.equal(rule.levers().gshare, 0.3);
    rule.decide(h, 5);
    assert.ok(Math.abs(rule.levers().gshare - 0.29) < 1e-12);
    for (let t = 6; t < 30; t += 1) rule.decide(h, t);
    assert.ok(Math.abs(rule.levers().gshare - 0.25) < 1e-12, "held within 5 points of GDP of the start");
    assert.throws(() => createRule(/** @type {any} */ ("R9"), start), /no rule R9/);
  });

  it("leave the levers alone under R0", () => {
    const rule = createRule("R0", { rcb: 0.03, gshare: 0.3, piT: 0.02, point: 0.01, structural: 0.055 });
    rule.decide(flat({ DEF: 10, GDP: 100, gap: -0.1 }), 4);
    assert.deepEqual(rule.levers(), { rcb: 0.03, gshare: 0.3 });
  });
});

describe("a rule against a crisis", () => {
  it("replays to the byte from its seed (the exact A/A)", () => {
    const a = simulate({ family: "unemployment", seed: 11, rule: "R2s" });
    const b = simulate({ family: "unemployment", seed: 11, rule: "R2s", check: false });
    assert.deepEqual(a.states, b.states);
  });

  it("lets Taylor beat the stabilisers alone in a recession, on the three objectives", () => {
    const [r0, r1] = ["R0", "R1"].map((rule) => objectivesOf(simulate({ family: "unemployment", seed: 3, rule })));
    assert.ok(r1.unemployment < r0.unemployment && r1.inflationGap < r0.inflationGap && r1.debt < r0.debt);
  });

  it("follows the European path: the structural deficit half a point lower each year, the debt below R0's", () => {
    const [r0, r2] = ["R0", "R2"].map((rule) => simulate({ family: "calm", seed: 2, rule }));
    const first = r2.levers.gshare.findIndex((g) => g < r2.levers.gshare[0]);
    assert.equal(first, 6, "decided at the end of the first year (quarter 4), voted in the 5th, spent from the 6th");
    assert.ok(r2.state(40)[r2.model.V.DEBT] < r0.state(40)[r0.model.V.DEBT]);
  });

  it("measures its objectives in points", () => {
    const o = objectivesOf(simulate({ family: "calm", seed: 1, rule: "R0" }));
    assert.ok(o.unemployment > 6 && o.unemployment < 8.5);
    assert.ok(o.inflationGap < 0.3 && Math.abs(o.inflationPeak - 2) < 0.5);
    assert.ok(o.debt > 125 && o.debt < 140 && Math.abs(o.debt - 113 - o.debtRise) < 1e-9);
    assert.equal(o.floorQuarters, 0);
  });
});

describe("the tuning of a rule (J5)", () => {
  it("counts each objective in units of its smallest gain worth having", () => {
    const loss = lossOf({ unemployment: 7, inflationGap: 0.4, debt: 120 }, WEIGHTS.jobs);
    assert.ok(Math.abs(loss - (3 * 35 + 2 + 60)) < 1e-9);
  });

  it("plays the textbooks' coefficients unless told otherwise", () => {
    const a = simulate({ family: "calm", seed: 4, rule: "R2s" });
    const b = simulate({ family: "calm", seed: 4, rule: "R2s", coefficients: { ...TEXTBOOK } });
    assert.deepEqual(a.states, b.states);
    const lazy = simulate({ family: "calm", seed: 4, rule: "R2s", coefficients: { ...TEXTBOOK, speed: 0 } });
    assert.ok(lazy.levers.gshare.every((g) => g === lazy.levers.gshare[0]), "a fiscal rule that closes nothing spends as it started");
  });

  it("climbs on the learning seeds, within bounds, never worse than the textbooks there, and replays", () => {
    const options = { name: /** @type {const} */ ("R2s"), weights: WEIGHTS.balance, seeds: 2, budget: 25, seed: 7 };
    const tuned = tune(options);
    assert.equal(tuned.evaluations, 25);
    assert.ok(tuned.loss <= tuned.textbook);
    assert.ok(tuned.coefficients.speed >= 0 && tuned.coefficients.speed <= 1 && tuned.coefficients.inflation <= 3);
    assert.equal(tuned.rule, "R2s");
    assert.ok(Math.abs(learningLoss({ ...options, rule: "R2s", coefficients: tuned.coefficients }) - tuned.loss) < 1e-12);
    assert.deepEqual(tune(options), tuned);
    assert.throws(() => tune({ ...options, name: /** @type {any} */ ("R0") }), /no tuning R0/);
    const budget = tune({ ...options, name: "R2sb", budget: 6 });
    assert.ok(budget.coefficients.inflation === 0.5 && budget.coefficients.gap === 0.5, "the central bank's Taylor kept");
  });
});

describe("R3, the countercyclical rule, and CMA-ES", () => {
  it("is R1 when it responds to nothing, and spends early in a recession when it does", () => {
    const r1 = simulate({ family: "unemployment", seed: 3, rule: "R1" });
    assert.deepEqual(simulate({ family: "unemployment", seed: 3, rule: "R3", coefficients: { ...R3_START } }).states, r1.states);
    const r3 = simulate({ family: "unemployment", seed: 3, rule: "R3", coefficients: { ...R3_START, jobs: 2, rise: 2 } });
    const g = r3.levers.gshare;
    const point = r1.at("GDP", 0) / 100 / (r1.at("p", 0) * r1.at("yfe", 0));
    assert.ok(Math.max(...g) > g[0] + point, "a point of GDP more at least");
    for (let t = 1; t < g.length; t += 1) assert.ok(Math.abs(g[t] - g[t - 1]) <= 0.0101 * 100 * point * 1.2, `a point a quarter at most, ${t}`);
    assert.ok(g.every((x) => Math.abs(x - g[0]) <= 0.0501 * 100 * point * 1.2), "within five points of the start");
  });

  it("is tuned by CMA-ES as by the climb: within bounds, whole generations, a curve that only falls, and replays", () => {
    const options = { name: /** @type {const} */ ("R3"), weights: WEIGHTS.balance, seeds: 2, budget: 40, seed: 3, optimizer: /** @type {const} */ ("cmaes") };
    const tuned = tune(options);
    assert.equal(tuned.optimizer, "cmaes");
    assert.ok(tuned.evaluations <= 40 && tuned.evaluations % 9 === 0, `${tuned.evaluations} plans, generations of 9`);
    assert.ok(tuned.loss <= tuned.textbook);
    for (const [key, low, high] of TUNINGS.R3.genes) assert.ok(tuned.coefficients[key] >= low && tuned.coefficients[key] <= high, key);
    assert.ok(tuned.curve.every((c, i) => i === 0 || c.loss <= tuned.curve[i - 1].loss));
    assert.equal(tuned.curve.at(-1).loss, tuned.loss);
    assert.ok(Math.abs(learningLoss({ ...options, rule: "R3", coefficients: tuned.coefficients }) - tuned.loss) < 1e-12);
    assert.deepEqual(tune(options), tuned);
    assert.equal(tune({ ...options, optimizer: "climb" }).evaluations, 40);
  });
});
