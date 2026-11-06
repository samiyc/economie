import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertConsistent, createLedger } from "../src/sfc/ledger.js";
import { SIM_SPEC, createSimLedger } from "../src/sim/ledger.js";
import { V, step, steadyState, DEFAULTS } from "../src/sim/model.js";

describe("the ledger of SIM", () => {
  it("lays out the book's transactions: each row and each column sums to zero", () => {
    const state = steadyState(DEFAULTS);
    step({ ...DEFAULTS, G: 30 }, state);
    const ledger = createSimLedger();
    ledger.fill(state);
    const at = (flow, sector) => ledger.flows[SIM_SPEC.flows.findIndex((f) => f.key === flow) * 3 + SIM_SPEC.sectors.indexOf(sector)];
    assert.equal(at("consumption", "households"), -state[V.C]);
    assert.equal(at("consumption", "firms"), state[V.C]);
    assert.equal(at("purchases", "government"), -30);
    assert.equal(at("money", "households"), -state[V.dHh]);
    assert.equal(at("money", "government"), state[V.dHs]);
    assert.ok(ledger.residual() < 1e-12);
  });

  it("finds the hidden equation broken when the money held is not the money issued", () => {
    const state = steadyState(DEFAULTS);
    step(DEFAULTS, state);
    state[V.Hh] += 1e-6;
    assert.throws(() => assertConsistent(createSimLedger(), state, 7), /SIM do not sum to zero at period 7/);
  });

  it("finds a flow that leaves a sector without entering another", () => {
    const state = steadyState(DEFAULTS);
    state[V.WN] += 0.5;
    assert.throws(() => assertConsistent(createSimLedger(), state, 1), /do not sum to zero/);
  });

  it("measures a gap relative to the largest cell it adds", () => {
    // A balance sheet's rows only: a lone flow row would leave its columns unbalanced.
    const spec = { name: "two", sectors: ["a", "b"], flows: [], stocks: [{ key: "s", cells: [["a", 1, 0], ["b", -1, 1]] }] };
    const ledger = createLedger(/** @type {any} */ (spec));
    ledger.fill(Float64Array.of(1e6, 1e6 - 1));
    assert.ok(Math.abs(ledger.residual() - 1e-6) < 1e-12);
    ledger.fill(Float64Array.of(0.5, 0.25));
    assert.equal(ledger.residual(), 0.25);
  });

  it("refuses a sector it does not know", () => {
    const spec = { name: "bad", sectors: ["a"], flows: [{ key: "f", cells: [["z", 1, 0]] }], stocks: [] };
    assert.throws(() => createLedger(/** @type {any} */ (spec)), /unknown sector z in row f/);
  });
});
