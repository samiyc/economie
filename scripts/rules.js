import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { progress } from "mcts-commun/trace.js";
import { OBJECTIVES, REPORTED, measureRules } from "./lib/rules-measure.js";
import { worldOf } from "./lib/world.js";

/**
 * The simple rules measured by pairs on ÉCO (scripts/lib/rules-measure.js): prints the tables, keeps them in `--out`.
 * docs/regles.md reads them. With `--tuned`, the rules tuned by scripts/tune.js (J5) join them: R1*<weights> against
 * R1 and R0, R2s*<weights> against R2s, R2n and R1* of the same weights. `--world` names another world than ÉCO
 * (scripts/lib/world.js): `flottant` for the floating rate (J7).
 *
 *   node scripts/rules.js --seeds 1000 --out docs/mesures/regles.json
 *   node scripts/rules.js --seeds 1000 --tuned docs/mesures/reglage --out docs/mesures/reglees.json
 *   node scripts/rules.js --seeds 1000 --tuned docs/mesures/reglage --world flottant --out docs/mesures/flottant/reglees.json
 */

const { values } = parseArgs({ options: { seeds: { type: "string", default: "200" }, out: { type: "string" }, tuned: { type: "string" }, world: { type: "string" } } });
const seeds = Number(values.seeds);

/** The tuned rules in `folder`, and the pairs they are measured in. */
function tunedIn(folder) {
  if (!folder) return undefined;
  const files = readdirSync(folder).filter((f) => f.endsWith(".json")).sort();
  const entries = files.map((f) => JSON.parse(readFileSync(`${folder}/${f}`, "utf8"))).map((t) => ({ label: `${t.tuning ?? t.rule}*${t.weights}`, rule: t.rule, weights: t.weights, coefficients: t.coefficients }));
  const against = (e) => (e.rule === "R1" ? ["R1", "R0"] : ["R2s", "R2n", `R1*${e.weights}`]);
  return { entries, pairs: entries.flatMap((e) => against(e).map((b) => [e.label, b])) };
}

/** A pair's cell: its mean gap and its interval. */
const cell = ({ mean, low, high }) => `${mean.toFixed(2)} [${low.toFixed(2)} ; ${high.toFixed(2)}]`;
const row = (p) => `| ${p.a} − ${p.b} | ${OBJECTIVES.map((k) => cell(p[k])).join(" | ")} |`;

let done = 0;
const results = measureRules(worldOf(values.world).world, seeds, (family) => {
  done += 1;
  progress("rules", done, 3 * seeds, { family });
}, tunedIn(values.tuned));

const aaCells = OBJECTIVES.map((k) => [k, cell(results.aa[k])].join(" ")).join(", ");
console.log(`A/A (R1 au calme, graines 1 à ${seeds} contre les ${seeds} suivantes) : ${aaCells}`);
const otherCells = OBJECTIVES.map((k) => [k, cell(results.aaOther[k])].join(" ")).join(", ");
console.log(`A/A sur deux autres lots (graines ${2 * seeds + 1} à ${3 * seeds} contre ${3 * seeds + 1} à ${4 * seeds}) : ${otherCells}`);
for (const [family, { means, pairs, crisis }] of Object.entries(results.families)) {
  console.log(`\n## ${family} (${seeds} graines)\n`);
  console.log(`| règle | ${REPORTED.join(" | ")} |`);
  for (const [rule, m] of Object.entries(means)) console.log(`| ${rule} | ${REPORTED.map((k) => m[k].toFixed(2)).join(" | ")} |`);
  console.log(`\n| paire | ${OBJECTIVES.join(" | ")} |`);
  for (const p of pairs) console.log(row(p));
  if (!crisis) continue;
  console.log(`\nCe que la crise ajoute (la paire en crise, moins la même au calme) :\n\n| paire | ${OBJECTIVES.join(" | ")} |`);
  for (const p of crisis) console.log(row(p));
}
if (values.out) writeFileSync(values.out, `${JSON.stringify(results, null, 2)}\n`);
