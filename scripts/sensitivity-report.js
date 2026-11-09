import { readFileSync, readdirSync } from "node:fs";

/**
 * Gathers the variants of scripts/sensitivity.js (docs/mesures/sensibilite/) against the reference measure
 * (docs/mesures/regles.json): for each hypothesis moved, whether J4's conclusions hold. Prints a markdown table.
 *
 *   node scripts/sensitivity-report.js
 */

const folder = new URL("../docs/mesures/sensibilite/", import.meta.url);
const read = (url) => JSON.parse(readFileSync(url, "utf8"));
const reference = { param: "—", factor: 1, ...read(new URL("../docs/mesures/regles.json", import.meta.url)) };
const variants = readdirSync(folder).filter((f) => f.endsWith(".json")).sort().map((f) => read(new URL(f, folder)));

const number = (x) => x.toFixed(2).replace(".", ",").replace("-", "−");
const find = (list, a, b) => list.find((p) => p.a === a && p.b === b);

/** The conclusions a measure draws: Taylor in recession, R2s against R2n in each crisis, the A/A. */
function conclusions({ families, aa }) {
  const taylor = find(families.unemployment.pairs, "R1", "R0");
  const recession = find(families.unemployment.crisis, "R2s", "R2n");
  const materials = find(families.materials.crisis, "R2s", "R2n");
  const aaHolds = Object.values(aa).every((p) => p.low <= 0 && p.high >= 0);
  return {
    cells: [number(taylor.unemployment.mean), number(taylor.debt.mean), number(recession.unemployment.mean),
      number(recession.debt.mean), number(materials.debt.mean), aaHolds ? "oui" : "non"],
    holds: taylor.unemployment.high < 0 && recession.unemployment.high < -0.2 && recession.debt.high < 1,
  };
}

console.log("| Hypothèse | Facteur | R1 − R0, chômage | R1 − R0, dette | R2s − R2n, chômage (récession) | R2s − R2n, dette (récession) | R2s − R2n, dette (matières) | A/A | Conclusions |");
console.log("|---|---|---|---|---|---|---|---|---|");
for (const measure of [reference, ...variants]) {
  const { cells, holds } = conclusions(measure);
  console.log(`| ${measure.param} | ${number(measure.factor)} | ${cells.join(" | ")} | ${holds ? "tiennent" : "**changent**"} |`);
}
