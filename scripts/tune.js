import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { progress } from "mcts-commun/trace.js";
import { TUNINGS, tune, WEIGHTS } from "../src/policy/tuning.js";

/**
 * Tunes a rule under a set of weights (src/policy/tuning.js, J5; `--rule` a tuning's name: R1, R2s, R1n, R2sn, R2sb,
 * R3): `--restarts` searches from different seeds, each of `--budget` plans scored on `--seeds` learning seeds a family;
 * keeps the best in docs/mesures/reglage/<rule>-<weights>.json (or `--out`), with every restart and its best loss at the
 * budget's marks, so that one can see whether they agree. `--optimizer cmaes` tunes by CMA-ES instead of the climb.
 * A job a pair, in the queue.
 *
 *   node scripts/tune.js --rule R2s --weights balance --seeds 200 --budget 400 --restarts 3
 *   node scripts/tune.js --rule R3 --optimizer cmaes --budget 1600 --restarts 5 --out docs/mesures/r3/R3-cmaes-balance.json
 */

const { values } = parseArgs({
  options: {
    rule: { type: "string" }, weights: { type: "string", default: "balance" },
    seeds: { type: "string", default: "200" }, budget: { type: "string", default: "400" }, restarts: { type: "string", default: "3" },
    optimizer: { type: "string", default: "climb" }, out: { type: "string" },
  },
});
const name = /** @type {keyof typeof TUNINGS} */ (values.rule);
const optimizer = /** @type {"climb" | "cmaes"} */ (values.optimizer);
if (!["climb", "cmaes"].includes(optimizer)) throw new Error("tune: --optimizer climb or cmaes");
if (!TUNINGS[name] || !WEIGHTS[values.weights]) throw new Error(`tune: --rule ${Object.keys(TUNINGS)} and --weights ${Object.keys(WEIGHTS)}`);
const { rule } = TUNINGS[name];
const [seeds, budget, restarts] = [values.seeds, values.budget, values.restarts].map(Number);
const weights = WEIGHTS[values.weights];

const runs = [];
for (let k = 1; k <= restarts; k += 1) {
  runs.push({ seed: k, ...tune({ name, weights, seeds, budget, seed: k, optimizer }) });
  progress("tune", k, restarts, { rule, optimizer, weights: values.weights });
}
const best = runs.reduce((a, b) => (b.loss < a.loss ? b : a), runs[0]);
const round = (x) => Math.round(x * 1e4) / 1e4;
const rounded = (coefficients) => Object.fromEntries(Object.entries(coefficients).map(([k, v]) => [k, round(v)]));
const result = {
  date: new Date().toISOString().slice(0, 10), tuning: name, rule, optimizer, weights: values.weights, seeds, budget,
  textbook: round(best.textbook), loss: round(best.loss), coefficients: rounded(best.coefficients),
  restarts: runs.map((r) => ({ seed: r.seed, loss: round(r.loss), coefficients: rounded(r.coefficients), curve: r.curve.map((c) => ({ ...c, loss: round(c.loss) })) })),
};
const root = fileURLToPath(new URL("../", import.meta.url));
const out = resolve(root, values.out ?? `docs/mesures/reglage/${name}-${values.weights}.json`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
