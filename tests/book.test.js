import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BMW } from "../src/book/bmw.js";
import { DISINF } from "../src/book/disinf.js";
import { GROWTH } from "../src/book/growth.js";
import { LP } from "../src/book/lp.js";
import { OPEN } from "../src/book/open.js";
import { OPENFLEX } from "../src/book/openflex.js";
import { runModel } from "../src/sfc/run.js";
import { worstGap } from "./sfcr.js";

/**
 * The book's blocks of ÉCO (src/book/), solved by our system (src/sfc/system.js) against sfcr's trajectories
 * (scripts/reference/sfcr.R): each from its vignette's start for its vignette's periods, then 60 periods of a shock
 * from that last period, its period 5 on. The tolerance is 1e-9, relative to the value when it exceeds 1: tighter than
 * the 1e-6 docs/modele.md (§ 8) asked, as the gaps measured on 9/11/2026 were 1.2e-11 at most (BMW and OPEN, where
 * sfcr's iteration stops first); OPEN FLEX's, solved by Newton here and by Broyden in sfcr, 8.6e-11 (17/11).
 */

const TOLERANCE = 1e-9;

const CASES = [
  ["LP, the short and long rates up (rb 4 %, pbl 15)", LP, "lp", 100, { rb: 0.04, pbl: 15 }],
  ["BMW, autonomous consumption from 20 to 30", BMW, "bmw", 100, { alpha0: 30 }],
  ["DISINF, the mark-up from 0.24 to 0.3", DISINF, "disinf", 200, { phi: 0.3 }],
  ["OPEN, the South's propensity to import from 0.15 to 0.25", OPEN, "open", 100, { mu_S: 0.25 }],
  ["OPEN FLEX, a stronger desire for US bills (λ20 0.30, λ40 0.75)", OPENFLEX, "openflex", 100, { lambda20: 0.3, lambda40: 0.75 }],
  ["GROWTH, the target real wage up (ω0 from −0.20594 to −0.1)", GROWTH, "growth", 100, { omega0: -0.1 }],
];

describe("the book's blocks against sfcr's trajectories", () => {
  for (const [title, model, name, periods, change] of CASES) {
    it(`retraces ${model.name} from its start`, () => {
      const worst = worstGap(runModel(model, { start: "zero", periods: periods - 1 }), `${name}-zero`);
      assert.ok(worst.gap < TOLERANCE, `${name}-zero: ${worst.gap} at ${worst.at}`);
    });
    it(`retraces ${title}`, () => {
      const run = runModel(model, { start: "zero", periods: periods + 58, changes: [{ at: periods + 3, ...change }] });
      const worst = worstGap(run, `${name}-shock`);
      assert.ok(worst.gap < TOLERANCE, `${name}-shock: ${worst.gap} at ${worst.at}`);
    });
  }
});
