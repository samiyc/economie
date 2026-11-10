import { mkdirSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { progress } from "mcts-commun/trace.js";
import { TUNINGS, tune, WEIGHTS } from "../src/policy/tuning.js";

/**
 * Tunes a rule under a set of weights (src/policy/tuning.js, J5; `--rule` a tuning's name: R1, R2s, R1n, R2sn, R2sb): `--restarts` climbs from different seeds, each of
 * `--budget` plans scored on `--seeds` learning seeds a family; keeps the best in docs/mesures/reglage/<rule>-<weights>.json,
 * with every restart, so that one can see whether they agree. A job a pair, in the queue.
 *
 *   node scripts/tune.js --rule R2s --weights balance --seeds 200 --budget 400 --restarts 3
 */

const { values } = parseArgs({
  options: {
    rule: { type: "string" }, weights: { type: "string", default: "balance" },
    seeds: { type: "string", default: "200" }, budget: { type: "string", default: "400" }, restarts: { type: "string", default: "3" },
  },
});
const name = /** @type {keyof typeof TUNINGS} */ (values.rule);
if (!TUNINGS[name] || !WEIGHTS[values.weights]) throw new Error(`tune: --rule ${Object.keys(TUNINGS)} and --weights ${Object.keys(WEIGHTS)}`);
const { rule } = TUNINGS[name];
const [seeds, budget, restarts] = [values.seeds, values.budget, values.restarts].map(Number);
const weights = WEIGHTS[values.weights];

const runs = [];
for (let k = 1; k <= restarts; k += 1) {
  runs.push({ seed: k, ...tune({ name, weights, seeds, budget, seed: k }) });
  progress("tune", k, restarts, { rule, weights: values.weights });
}
const best = runs.reduce((a, b) => (b.loss < a.loss ? b : a), runs[0]);
const round = (x) => Math.round(x * 1e4) / 1e4;
const result = {
  date: new Date().toISOString().slice(0, 10), tuning: name, rule, weights: values.weights, seeds, budget,
  textbook: round(best.textbook), loss: round(best.loss),
  coefficients: Object.fromEntries(Object.entries(best.coefficients).map(([k, v]) => [k, round(v)])),
  restarts: runs.map((r) => ({ seed: r.seed, loss: round(r.loss), coefficients: Object.fromEntries(Object.entries(r.coefficients).map(([k, v]) => [k, round(v)])) })),
};
const folder = new URL("../docs/mesures/reglage/", import.meta.url);
mkdirSync(folder, { recursive: true });
writeFileSync(new URL(`${name}-${values.weights}.json`, folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
