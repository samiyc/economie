import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { progress } from "mcts-commun/trace.js";
import { createEco, ECO } from "../src/eco/model.js";
import { ASSUMED, TARGETS } from "../src/eco/targets.js";
import { objectivesOf, simulate } from "../src/policy/simulate.js";
import { WEIGHTS } from "../src/policy/tuning.js";
import { createPlanner } from "../src/search/planner.js";

/**
 * The rolling-horizon planner (src/search/planner.js, J6) against the rules on the same crises: seeds `--from` to
 * `--from` + `--seeds` − 1 of `--family`, under `--weights`. Beside it, on the same seeds, the central bank following the
 * textbooks' Taylor in all of them (Sami, 10/11): R0, R1, R2s, and R2s*b, R2s's speed tuned for these weights
 * (docs/mesures/reglage/R2sb-<weights>.json). With
 * `--world param:factor`, the world is ÉCO with that hypothesis moved, the planner still planning on ÉCO: the shifted
 * model (docs/modele.md, § 8). Each seed's objectives go to docs/mesures/recherche/; scripts/search-report.js reads them.
 *
 *   node scripts/search.js --family unemployment --weights balance --from 1 --seeds 50 --budget 300
 */

const { values } = parseArgs({ options: {
  family: { type: "string" }, weights: { type: "string", default: "balance" }, from: { type: "string", default: "1" },
  seeds: { type: "string", default: "100" }, budget: { type: "string", default: "300" }, count: { type: "string", default: "16" },
  horizon: { type: "string", default: "24" }, world: { type: "string" }, tag: { type: "string", default: "" },
} });
const family = /** @type {"calm" | "unemployment" | "materials"} */ (values.family);
const [from, seeds, budget, count, horizon] = [values.from, values.seeds, values.budget, values.count, values.horizon].map(Number);
const weights = WEIGHTS[values.weights];
if (!weights) throw new Error(`search: --weights ${Object.keys(WEIGHTS)}`);

/** The world the policies play: ÉCO, or ÉCO with a hypothesis moved. */
function worldOf(spec) {
  if (!spec) return ECO;
  const [param, factor] = spec.split(":");
  if (!(param in ASSUMED)) throw new Error(`search: no hypothesis ${param}`);
  return createEco(TARGETS, { ...ASSUMED, [param]: ASSUMED[param] * Number(factor) });
}

const r2sb = JSON.parse(readFileSync(new URL(`../docs/mesures/reglage/R2sb-${values.weights}.json`, import.meta.url), "utf8")).coefficients;
const RULES = [
  { label: "R0", rule: "R0" }, { label: "R1", rule: "R1" }, { label: "R2s", rule: "R2s" },
  { label: "R2s*b", rule: "R2s", coefficients: r2sb },
];
const KEPT = ["unemployment", "unemploymentPeak", "inflationGap", "inflationPeak", "debt", "outputGap", "floorQuarters", "leverMoves"];
const keep = (o) => Object.fromEntries(KEPT.map((k) => [k, Math.round(o[k] * 1e6) / 1e6]));

const world = worldOf(values.world);
const shape = { model: ECO, weights, budget, count, horizon };
const rows = Object.fromEntries(["search", ...RULES.map((r) => r.label)].map((label) => [label, []]));
for (let seed = from; seed < from + seeds; seed += 1) {
  const policy = (run) => createPlanner(shape, run);
  rows.search.push(keep(objectivesOf(simulate({ family, seed, rule: "R0", policy, check: seed === from }, world))));
  for (const { label, rule, coefficients } of RULES) rows[label].push(keep(objectivesOf(simulate({ family, seed, rule: /** @type {any} */ (rule), coefficients, check: false }, world))));
  progress("search", seed - from + 1, seeds, { family, weights: values.weights });
}
const folder = new URL("../docs/mesures/recherche/", import.meta.url);
mkdirSync(folder, { recursive: true });
const name = [family, values.weights, values.world?.replace(":", "-"), values.tag, from].filter(Boolean).join("-");
const result = { date: new Date().toISOString().slice(0, 10), family, weights: values.weights, from, seeds, budget, count, horizon, world: values.world ?? null, tag: values.tag, coefficients: { r2sb }, rows };
writeFileSync(new URL(`${name}.json`, folder), `${JSON.stringify(result)}\n`);
console.log(`${name}: ${seeds} graines, écrit`);
