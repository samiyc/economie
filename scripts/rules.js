import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { progress } from "mcts-commun/trace.js";
import { ECO } from "../src/eco/model.js";
import { OBJECTIVES, REPORTED, measureRules } from "./lib/rules-measure.js";

/**
 * The simple rules measured by pairs on ÉCO (scripts/lib/rules-measure.js): prints the tables, keeps them in `--out`.
 * docs/regles.md reads them.
 *
 *   node scripts/rules.js --seeds 1000 --out docs/mesures/regles.json
 */

const { values } = parseArgs({ options: { seeds: { type: "string", default: "200" }, out: { type: "string" } } });
const seeds = Number(values.seeds);

/** A pair's cell: its mean gap and its interval. */
const cell = ({ mean, low, high }) => `${mean.toFixed(2)} [${low.toFixed(2)} ; ${high.toFixed(2)}]`;
const row = (p) => `| ${p.a} − ${p.b} | ${OBJECTIVES.map((k) => cell(p[k])).join(" | ")} |`;

let done = 0;
const results = measureRules(ECO, seeds, (family) => {
  done += 1;
  progress("rules", done, 3 * seeds, { family });
});

const aaCells = OBJECTIVES.map((k) => [k, cell(results.aa[k])].join(" ")).join(", ");
console.log(`A/A (R1 au calme, graines 1 à ${seeds} contre les ${seeds} suivantes) : ${aaCells}`);
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
