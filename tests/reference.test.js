import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { run } from "../src/models.js";

/**
 * Our models against sfcr's trajectories (Macalós, MIT), solved once by scripts/reference/sfcr.R and kept in
 * tests/fixtures/sfcr/: the book's equations in sfcr's notation, its own iteration on each period's simultaneity. Its
 * period 1 is the start, so our period t is its t + 1; its shocks start at its period 5, our period 4. The tolerance is
 * 1e-9, relative to the value when it exceeds 1: tighter than the 1e-6 docs/modele.md (§ 8) asked, as the gaps measured
 * on 9/11/2026 were 1e-12 at most (sfcr iterates to 1e-15).
 */

const TOLERANCE = 1e-9;
const OURS = { TX: "T", YDE: "YDe" };

/** The fixture `name`: its columns, and its rows as numbers (the stamp line skipped). */
function fixture(name) {
  const lines = readFileSync(new URL(`fixtures/sfcr/${name}.csv`, import.meta.url), "utf8").trim().split(/\r?\n/);
  const [header, ...rows] = lines.filter((line) => !line.startsWith("#"));
  return { columns: header.split(","), rows: rows.map((row) => row.split(",").map(Number)) };
}

/** The largest relative gap between `ours` and the fixture `name`, and where it is. */
function worstGap(ours, name) {
  const { columns, rows } = fixture(name);
  let worst = { gap: 0, at: "" };
  for (const row of rows) {
    const t = row[0] - 1;
    for (let c = 1; c < columns.length; c += 1) {
      const variable = OURS[columns[c]] ?? columns[c];
      const mine = ours.state(t)[ours.model.V[variable]];
      const gap = Math.abs(mine - row[c]) / Math.max(1, Math.abs(row[c]));
      if (gap > worst.gap) worst = { gap, at: `${variable} at period ${t}: ${mine} against ${row[c]}` };
    }
  }
  return worst;
}

const CASES = [
  ["SIM from the empty economy", "sim-zero", "SIM", { start: "zero" }],
  ["SIM, G from 20 to 25", "sim-g25", "SIM", { changes: [{ at: 4, G: 25 }] }],
  ["SIMEX from the empty economy", "simex-zero", "SIMEX", { start: "zero" }],
  ["SIMEX, the propensity to consume from 0.6 to 0.7", "simex-alpha1", "SIMEX", { changes: [{ at: 4, alpha1: 0.7 }] }],
  ["PC from the empty economy", "pc-zero", "PC", { start: "zero" }],
  ["PC, the rate from 2.5 % to 3.5 %", "pc-r35", "PC", { changes: [{ at: 4, r: 0.035 }] }],
  ["PCEX from the empty economy", "pcex-zero", "PCEX", { start: "zero" }],
  ["PCEX, the rate from 2.5 % to 3.5 %", "pcex-r35", "PCEX", { changes: [{ at: 4, r: 0.035 }] }],
];

describe("the models against sfcr's trajectories", () => {
  for (const [title, name, model, options] of CASES) {
    it(`retraces ${title}`, () => {
      const worst = worstGap(run(model, { periods: 59, ...options }), name);
      assert.ok(worst.gap < TOLERANCE, `${name}: ${worst.at}`);
    });
  }
});
