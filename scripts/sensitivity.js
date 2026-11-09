import { mkdirSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { progress } from "mcts-commun/trace.js";
import { createEco } from "../src/eco/model.js";
import { ASSUMED, TARGETS } from "../src/eco/targets.js";
import { measureRules } from "./lib/rules-measure.js";

/**
 * The rules' measure on ÉCO with one hypothesis moved (docs/modele.md, § 8, the shifted model): `--param` times
 * `--factor`, ÉCO calibrated anew on the same targets, then the same seeds as scripts/rules.js. Its results go to
 * docs/mesures/sensibilite/<param>-<factor>.json; scripts/sensitivity-report.js gathers them. One variant a job:
 *
 *   node scripts/sensitivity.js --param phil --factor 1.2 --seeds 1000
 */

const { values } = parseArgs({ options: {
  param: { type: "string" }, factor: { type: "string", default: "1.2" }, seeds: { type: "string", default: "1000" },
} });
const { param } = values;
if (!(param in ASSUMED)) throw new Error(`sensitivity: no hypothesis ${param} (src/eco/targets.js, ASSUMED)`);
const factor = Number(values.factor);
const seeds = Number(values.seeds);

const assumed = { ...ASSUMED, [param]: ASSUMED[param] * factor };
let done = 0;
const results = measureRules(createEco(TARGETS, assumed), seeds, (family) => {
  done += 1;
  progress("sensitivity", done, 3 * seeds, { param, factor, family });
});
const folder = new URL("../docs/mesures/sensibilite/", import.meta.url);
mkdirSync(folder, { recursive: true });
writeFileSync(new URL(`${param}-${factor}.json`, folder), `${JSON.stringify({ param, factor, value: assumed[param], ...results }, null, 2)}\n`);
console.log(`${param} × ${factor} (${assumed[param]}): ${seeds} graines par famille, écrit`);
