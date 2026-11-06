import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { DEFAULTS } from "../src/sim/model.js";
import { runSim } from "../src/sim/run.js";

/**
 * What the models do, held in a hash (as in the other clients of mcts-commun): a refactor must leave it unchanged. A
 * change meant to alter a model updates it here, and its commit says so, with the measures before and after.
 */
const EXPECTED = {
  // 6/11/2026, J1: SIM from the empty economy, 100 periods; then from its stationary state, G 30 then θ 0.25.
  simEmpty: "2b8fa8a68e9dd0e5",
  simShocks: "62aca86fd7f78a17",
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
});
