import { parseArgs } from "node:util";
import { ECO } from "../src/eco/model.js";
import { simulate } from "../src/policy/simulate.js";
import { WEIGHTS } from "../src/policy/tuning.js";
import { createPlanner } from "../src/search/planner.js";

/**
 * The planner's bench (J6, `npm run bench`): a run of the rolling-horizon planner on a few crises, the time a decision
 * and a quarter played, and the heap it leaves, so that a hot path that starts allocating shows. Without a clock in
 * the measure: a measure fixes a budget of plans (docs/modele.md, § 8).
 *
 *   npm run bench -- --seeds 3 --budget 300
 */

const { values } = parseArgs({ options: {
  seeds: { type: "string", default: "3" }, budget: { type: "string", default: "300" },
  count: { type: "string", default: "16" }, horizon: { type: "string", default: "24" },
} });
const [seeds, budget, count, horizon] = [values.seeds, values.budget, values.count, values.horizon].map(Number);
const shape = { model: ECO, weights: WEIGHTS.balance, budget, count, horizon };

const play = (family, seed) => simulate({ family, seed, rule: "R0", check: false, policy: (run) => createPlanner(shape, run) });
play("calm", 1);
const heap = process.memoryUsage().heapUsed;
const start = performance.now();
for (let seed = 1; seed <= seeds; seed += 1) for (const family of /** @type {const} */ (["calm", "unemployment", "materials"])) play(family, seed);
const ms = performance.now() - start;
const runs = 3 * seeds;
const decisions = runs * 40;
const quarters = decisions * (budget + 1) * count * horizon;
console.log(`${runs} parties de 40 trimestres, budget ${budget}, ${count} futurs, horizon ${horizon} :`);
console.log(`  ${(ms / runs / 1000).toFixed(2)} s par partie, ${(ms / decisions).toFixed(0)} ms par décision, ${((ms * 1e3) / quarters).toFixed(2)} µs par trimestre joué`);
console.log(`  tas : ${((process.memoryUsage().heapUsed - heap) / 1e6).toFixed(1)} Mo de plus après les parties`);
