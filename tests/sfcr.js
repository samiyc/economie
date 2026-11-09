import { readFileSync } from "node:fs";

/**
 * The fixtures of tests/fixtures/sfcr/, written by scripts/reference/sfcr.R: sfcr's period 1 is the start, so our
 * period t is its period t + 1. Our names are sfcr's, but for those OURS renames where the model has not sfcr's.
 */

const OURS = { TX: "T", YDE: "YDe" };

/** The fixture `name`: its columns, and its rows as numbers (the stamp line skipped). */
function fixture(name) {
  const lines = readFileSync(new URL(`fixtures/sfcr/${name}.csv`, import.meta.url), "utf8").trim().split(/\r?\n/);
  const [header, ...rows] = lines.filter((line) => !line.startsWith("#"));
  return { columns: header.split(","), rows: rows.map((row) => row.split(",").map(Number)) };
}

/**
 * The largest gap between the run `ours` and the fixture `name`, relative to the value when it exceeds 1, and where.
 *
 * @param {import("../src/types.js").ModelRun} ours
 * @param {string} name
 */
export function worstGap(ours, name) {
  const { columns, rows } = fixture(name);
  let worst = { gap: 0, at: "" };
  for (const row of rows) {
    const t = row[0] - 1;
    for (let c = 1; c < columns.length; c += 1) {
      const variable = columns[c] in ours.model.V ? columns[c] : OURS[columns[c]];
      const mine = ours.state(t)[ours.model.V[variable]];
      const gap = Math.abs(mine - row[c]) / Math.max(1, Math.abs(row[c]));
      if (Number.isNaN(gap) || gap > worst.gap) worst = { gap, at: `${variable} at period ${t}: ${mine} against ${row[c]}` };
    }
  }
  return worst;
}
