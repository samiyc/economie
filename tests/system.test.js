import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { blocksOf } from "../src/sfc/blocks.js";
import { createLedger } from "../src/sfc/ledger.js";
import { compile, parseEquations, tokenize, translate } from "../src/sfc/parse.js";
import { runModel } from "../src/sfc/run.js";
import { createSystem } from "../src/sfc/system.js";
import { run } from "../src/models.js";

/** A variable's source as a name, to read what translate writes. */
const names = (name, lagged) => (lagged ? `${name}_1` : name);

const SIM_MATRICES = {
  sectors: ["households", "firms", "government"],
  flows: [
    { key: "consumption", cells: { households: "-C", firms: "+C" } },
    { key: "purchases", cells: { firms: "+G", government: "-G" } },
    { key: "wages", cells: { households: "+W * N", firms: "-W * N" } },
    { key: "taxes", cells: { households: "-TX", government: "+TX" } },
    { key: "money", cells: { households: "-d(Hh)", government: "+d(Hs)" } },
  ],
  stocks: [{ key: "money", cells: { households: "+Hh", government: "-Hs" } }],
};

/** SIM in sfcr's notation, as the vignette writes it. */
const SIM = createSystem({
  name: "SIM",
  equations: `
    TX ~ theta * W * N   # the tax on wages
    YD ~ W * N - TX
    C ~ alpha1 * YD + alpha2 * Hh[-1]
    Hs ~ Hs[-1] + G - TX
    Hh ~ Hh[-1] + YD - C
    Y ~ C + G
    N ~ Y / W
  `,
  external: { G: 20, W: 1, alpha1: 0.6, alpha2: 0.4, theta: 0.2 },
  matrices: SIM_MATRICES,
});

describe("sfcr's notation", () => {
  it("reads lags, changes, powers, functions and switches", () => {
    assert.equal(translate("rb[-1] * Bh[-1] + d(BLs)", names), "((rb_1 * Bh_1) + (BLs - BLs_1))");
    assert.equal(translate("-2^2 + 2^-1", names), "((-Math.pow(2, 2)) + Math.pow(2, (-1)))");
    assert.equal(translate("exp(a + log(b)) * max(c, 1.5e-3)", names), "(Math.exp((a + Math.log(b))) * Math.max(c, 1.5e-3))");
    assert.equal(translate("if (ER > 1 && x != 0) {1} else {0}", names), "((((ER > 1) && (x !== 0))) ? (1) : (0))");
  });

  it("computes as R does", () => {
    const value = (text) => compile([], `return ${translate(text, names)};`)();
    assert.equal(value("-2^2"), -4);
    assert.equal(value("2^3^2"), 512);
    assert.equal(value("10 - 4 - 3"), 3);
    assert.equal(value("if (3 <= 2) {1} else {7}"), 7);
  });

  it("refuses what it cannot read", () => {
    assert.throws(() => translate("a +", names), /ends too soon/);
    assert.throws(() => translate("a b", names), /left over/);
    assert.throws(() => translate("foo(1)", names), /unknown function foo/);
    assert.throws(() => translate("a $ b", names), /cannot read/);
    assert.throws(() => translate("(a]", names), /cannot read/);
    assert.throws(() => translate("if (a) {1} or {2}", names), /"else" expected/);
    assert.throws(() => translate("* a", names), /unexpected "\*"/);
    assert.throws(() => parseEquations("Y + C"), /is not "name ~ expression"/);
  });

  it("reads one equation a line, comments and commas aside", () => {
    assert.deepEqual(parseEquations("  Y ~ C + G,  # output\n\n  x = y[-1]\n"), [
      { name: "Y", expression: "C + G" },
      { name: "x", expression: "y[-1]" },
    ]);
    assert.deepEqual(tokenize(" .5 x1[-1]>=").map((t) => t.text), [".5", "x1", "[-1]", ">="]);
  });
});

describe("the blocks of a period", () => {
  it("orders what is read before what reads it, and finds the cycles", () => {
    // 0 reads 1, 1 reads 2 and 0 (a cycle), 2 reads nothing, 3 reads itself.
    assert.deepEqual(blocksOf([[1], [2, 0], [], [3]]), [
      { members: [2], cyclic: false },
      { members: [0, 1], cyclic: true },
      { members: [3], cyclic: true },
    ]);
  });
});

describe("a model in sfcr's notation", () => {
  it("solves SIM as src/sim does, period by period", () => {
    const ours = run("SIM", { start: "zero", periods: 80, changes: [{ at: 40, G: 25 }] });
    const theirs = runModel(SIM, { start: "zero", periods: 80, changes: [{ at: 40, G: 25 }] });
    for (let t = 0; t <= 80; t += 1) {
      for (const name of ["Y", "C", "YD", "Hh"]) {
        assert.ok(Math.abs(ours.state(t)[ours.model.V[name]] - theirs.state(t)[SIM.V[name]]) < 1e-11, `${name} at ${t}`);
      }
    }
  });

  it("finds the stationary state by running to it", () => {
    const state = SIM.steadyState({ ...SIM.DEFAULTS, G: 25 });
    assert.ok(Math.abs(state[SIM.V.Y] - 125) < 1e-9);
  });

  it("starts from sfcr's empty economy, and from its initial values", () => {
    assert.equal(SIM.emptyState()[SIM.V.Hh], 1e-15);
    const seeded = createSystem({ name: "x", equations: "x ~ x[-1] * a", external: { a: 1 }, initial: { x: 3 }, matrices: { sectors: [], flows: [], stocks: [] } });
    assert.equal(seeded.emptyState()[seeded.V.x], 3);
  });

  it("checks its external values: all of them, finite, and no other", () => {
    assert.throws(() => SIM.assertParams({ ...SIM.DEFAULTS, G: Number.NaN }), /G is NaN/);
    assert.throws(() => SIM.assertParams({ ...SIM.DEFAULTS, Z: 1 }), /Z is 1, not an external value/);
    const missing = { ...SIM.DEFAULTS };
    delete missing.theta;
    assert.throws(() => SIM.assertParams(missing), /theta is undefined/);
  });

  it("refuses a model it cannot solve", () => {
    const empty = { sectors: [], flows: [], stocks: [] };
    assert.throws(() => createSystem({ name: "x", equations: "Y ~ Z", external: {}, matrices: empty }), /x: unknown variable Z/);
    assert.throws(() => createSystem({ name: "x", equations: "Y ~ 1\nY ~ 2", external: {}, matrices: empty }), /Y is defined twice/);
    const explosive = createSystem({ name: "x", equations: "Y ~ 2 * Y + 1", external: {}, matrices: empty });
    assert.throws(() => explosive.step({}, explosive.emptyState()), /block 0 \(Y\) did not settle/);
    const drifting = createSystem({ name: "x", equations: "Y ~ Y[-1] + 1", external: {}, matrices: empty });
    assert.throws(() => drifting.steadyState({}), /no stationary state/);
  });
});

describe("the ledger of a model in sfcr's notation", () => {
  it("reads the period before for the interest and the changes, and nets a real asset against its total", () => {
    const model = createSystem({
      name: "capital",
      equations: "K ~ K[-1] + I\nL ~ K\nM ~ K",
      external: { I: 2 },
      matrices: {
        sectors: ["firms", "banks", "households", "firmsCapital"],
        flows: [
          { key: "investment", cells: { firms: "+d(K)", firmsCapital: "-d(K)" } },
          { key: "wages", cells: { households: "+d(K)", firms: "-d(K)" } },
          { key: "loans", cells: { firmsCapital: "+d(L)", banks: "-d(L)" } },
          { key: "deposits", cells: { banks: "+d(M)", households: "-d(M)" } },
        ],
        stocks: [
          { key: "loans", cells: { firms: "-L", banks: "+L" } },
          { key: "capital", cells: { firms: "+K" }, total: "+K" },
          { key: "netWorth", cells: { households: "-M" }, total: "-K" },
        ],
      },
    });
    const ledger = createLedger(model.SPEC);
    const before = model.emptyState();
    const state = Float64Array.from(before);
    model.step(model.DEFAULTS, state);
    ledger.fill(state, before);
    assert.ok(Math.abs(ledger.flows[0] - 2) < 1e-12);
    assert.ok(ledger.residual() < 1e-12);
    assert.ok(Math.abs(ledger.totals[1] - state[model.V.K]) < 1e-12);
    ledger.fill(state);
    assert.equal(ledger.flows[0], 0);
  });
});
