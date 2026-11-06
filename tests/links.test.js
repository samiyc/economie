import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createLedger } from "../src/sfc/ledger.js";
import { linksOf, paidBy } from "../src/sfc/links.js";
import { createSimLedger } from "../src/sim/ledger.js";
import { DEFAULTS, V, step, steadyState } from "../src/sim/model.js";

const filled = (state) => {
  const ledger = createSimLedger();
  ledger.fill(state);
  return ledger;
};

describe("the links of the Sankey", () => {
  it("follow SIM's flows from payer to receiver", () => {
    const state = steadyState(DEFAULTS);
    step({ ...DEFAULTS, G: 30 }, state);
    const links = linksOf(filled(state));
    const of = (flow) => links.find((link) => link.flow === flow);
    assert.deepEqual(of("consumption"), { flow: "consumption", from: "households", to: "firms", value: state[V.C] });
    assert.deepEqual(of("purchases"), { flow: "purchases", from: "government", to: "firms", value: 30 });
    assert.deepEqual(of("wages"), { flow: "wages", from: "firms", to: "households", value: state[V.WN] });
    assert.deepEqual(of("money"), { flow: "money", from: "households", to: "government", value: state[V.dHh] });
  });

  it("turn a negative flow around: households who spend their money", () => {
    const state = steadyState(DEFAULTS);
    step({ ...DEFAULTS, G: 10 }, state);
    assert.ok(state[V.dHh] < 0);
    const money = linksOf(filled(state)).find((link) => link.flow === "money");
    assert.equal(money.from, "government");
    assert.equal(money.to, "households");
  });

  it("leave out a flow at zero, as the change in money at the stationary state", () => {
    assert.equal(linksOf(filled(steadyState(DEFAULTS))).some((link) => link.flow === "money"), false);
  });

  it("give each sector a node as high on both sides: what it pays is what it receives", () => {
    const state = steadyState(DEFAULTS);
    step({ ...DEFAULTS, G: 30 }, state);
    const links = linksOf(filled(state));
    const received = new Map();
    for (const { to, value } of links) received.set(to, (received.get(to) ?? 0) + value);
    for (const [sector, paid] of paidBy(links)) assert.ok(Math.abs(paid - received.get(sector)) < 1e-9, sector);
  });

  it("share a payment among several receivers in proportion", () => {
    const spec = { name: "three", sectors: ["a", "b", "c"], flows: [{ key: "f", cells: [["a", -1, 0], ["b", 1, 1], ["c", 1, 2]] }], stocks: [] };
    const ledger = createLedger(/** @type {any} */ (spec));
    ledger.fill(Float64Array.of(4, 1, 3));
    assert.deepEqual(linksOf(ledger).map((link) => [link.to, link.value]), [["b", 1], ["c", 3]]);
  });
});
