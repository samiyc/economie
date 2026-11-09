import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { DEFAULTS } from "../src/sim/model.js";
import { run } from "../src/models.js";
import { runSim } from "../src/sim/run.js";

/**
 * What the models do, held in a hash (as in the other clients of mcts-commun): a refactor must leave it unchanged. A
 * change meant to alter a model updates it here, and its commit says so, with the measures before and after.
 */
const EXPECTED = {
  // 6/11/2026, J1: SIM from the empty economy, 100 periods; then from its stationary state, G 30 then θ 0.25.
  simEmpty: "2b8fa8a68e9dd0e5",
  simShocks: "62aca86fd7f78a17",
  // 9/11/2026, J2: each from the empty economy, 100 periods. SIMEX, α1 0.7 at 50; PC, r 3.5 % at 50 then G 25 at 70;
  // PCEX, r 3.5 % at 50 then θ 0.25 at 70.
  simex: "41231ec0513e61f2",
  pc: "48be577ffbb80ad5",
  pcex: "9c243d4abac31ad3",
  // 9/11/2026, J3: the book's blocks, solved by src/sfc/system.js, each from its start, 100 periods, its vignette's
  // shock at 50.
  lp: "90d09cff4400e9f6",
  open: "02c5bb039201feb3",
  bmw: "143abd2e121091e3",
  disinf: "38250af50d22089b",
  growth: "e894737445bc0e74",
};

const digest = (states) => createHash("sha256").update(Buffer.from(states.buffer, states.byteOffset, states.byteLength)).digest("hex").slice(0, 16);

describe("the fingerprints of the models", () => {
  it("leaves SIM from the empty economy as it was", () => {
    assert.equal(digest(runSim({ start: "zero", periods: 100 }).states), EXPECTED.simEmpty);
  });

  it("leaves SIM after its shocks as it was", () => {
    const changes = [{ at: 4, G: 30 }, { at: 40, theta: 0.25 }];
    assert.equal(digest(runSim({ params: { ...DEFAULTS, alpha1: 0.7, alpha2: 0.3 }, periods: 80, changes }).states), EXPECTED.simShocks);
  });

  it("leaves SIMEX, PC and PCEX as they were", () => {
    const from = (name, changes) => digest(run(name, { start: "zero", periods: 100, changes }).states);
    assert.equal(from("SIMEX", [{ at: 50, alpha1: 0.7 }]), EXPECTED.simex);
    assert.equal(from("PC", [{ at: 50, r: 0.035 }, { at: 70, G: 25 }]), EXPECTED.pc);
    assert.equal(from("PCEX", [{ at: 50, r: 0.035 }, { at: 70, theta: 0.25 }]), EXPECTED.pcex);
  });

  it("leaves the book's blocks as they were", () => {
    const from = (name, changes) => digest(run(name, { start: "zero", periods: 100, changes }).states);
    assert.equal(from("LP", [{ at: 50, rb: 0.04, pbl: 15 }]), EXPECTED.lp);
    assert.equal(from("OPEN", [{ at: 50, mu_S: 0.25 }]), EXPECTED.open);
    assert.equal(from("BMW", [{ at: 50, alpha0: 30 }]), EXPECTED.bmw);
    assert.equal(from("DISINF", [{ at: 50, phi: 0.3 }]), EXPECTED.disinf);
    assert.equal(from("GROWTH", [{ at: 50, omega0: -0.1 }]), EXPECTED.growth);
  });
});
