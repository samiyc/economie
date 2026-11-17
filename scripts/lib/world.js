import { createEco, ECO, ECOFLEX } from "../../src/eco/model.js";
import { ASSUMED, TARGETS } from "../../src/eco/targets.js";

/**
 * The world a measure plays, from its name (`--world` of scripts/search.js and scripts/rules.js), words apart:
 * "flottant" for ÉCO at a floating rate (J7), "param:factor" for a hypothesis moved (the shifted model, J6). No name
 * is ÉCO. `model` is ÉCO in the world's regime, its hypotheses unmoved: the one a planner plans on, wrong only on
 * the hypotheses moved.
 *
 * @param {string} [name]
 */
export function worldOf(name = "") {
  let regime = /** @type {"fixed" | "floating"} */ ("fixed");
  const assumed = { ...ASSUMED };
  for (const word of name.split(" ").filter(Boolean)) {
    if (word === "flottant") {
      regime = "floating";
      continue;
    }
    const [param, factor] = word.split(":");
    if (!(param in ASSUMED) || !Number.isFinite(Number(factor))) throw new Error(`world: ${word} is neither "flottant" nor a hypothesis:factor`);
    assumed[param] = ASSUMED[param] * Number(factor);
  }
  const model = regime === "floating" ? ECOFLEX : ECO;
  return { regime, model, world: name.includes(":") ? createEco(TARGETS, assumed, regime) : model };
}

/** A world's name in a file name: its words joined by dashes. */
export const fileNameOf = (name) => name.replace(/[: ]/g, "-");
