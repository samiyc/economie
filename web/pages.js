import { MODELS } from "../src/models.js";
import { ratiosOf } from "../src/eco/ratios.js";
import { amount, percent, rate } from "./labels.js";
import { ECO_NOTES, PC_NOTES, SIM_NOTES } from "./notes.js";

/**
 * What the page shows of each model: its controls, its starts, its curves, the example its button brings back, the line
 * under the controls and the notes under each drawing. Everything else (the Sankey, the matrices) reads the model's
 * ledger. ÉCO's page skips its starting quarter, a snapshot whose stocks did not change from a quarter before
 * (`skip`): its quarter 0 is the first the model computes.
 *
 * @typedef {{ key: string, label: string, min: number, max: number, step: number, format: (v: number) => string }} Field
 * @typedef {{ key: string, name: string, colour: string, of?: (run: any) => Float64Array }} Curve
 * @typedef {{
 *   model: import("../src/types.js").Model,
 *   fields: Field[],
 *   starts: Array<[string, string]>,
 *   periods: number,
 *   skip: number,
 *   unit: string,
 *   example: Record<string, number>,
 *   curves: Curve[],
 *   target: string,
 *   goal: (model: any, params: Record<string, number>) => number,
 *   summary: (s: Float64Array, V: Readonly<Record<string, number>>, goal: number) => string,
 *   notes: { flows: string, curves: string, matrices: string },
 * }} Page
 */

/** The curves' colours: violet, magenta, green, checked on the Khaki panel (#e8e8cd), each named at its end. */
const COLOURS = ["#6250d6", "#e87ba4", "#008300"];
const curves = (list) => list.map(([key, name, of], i) => ({ key, name, colour: COLOURS[i], of }));
const field = (key, label, [min, max, step], format) => ({ key, label, min, max, step, format });
const decimals = (v) => v.toFixed(2).replace(".", ",");
const times = (v) => `× ${v.toFixed(1).replace(".", ",")}`;

const SIM_FIELDS = [
  field("G", "Achats de l'État G", [0, 50, 1], amount),
  field("theta", "Taux d'impôt θ", [0.05, 0.6, 0.01], percent),
  field("alpha1", "Propension à consommer le revenu α1", [0, 0.95, 0.05], decimals),
  field("alpha2", "Propension à consommer la richesse α2", [0.05, 0.9, 0.05], decimals),
];
const BOOK_STARTS = /** @type {Array<[string, string]>} */ ([["steady", "L'état stationnaire du livre"], ["zero", "L'économie vide, sans monnaie"]]);

/** The income the model goes to under `params`: its stationary state's, NaN when it has none. */
export function goalOf(model, params) {
  try {
    return model.steadyState(params)[model.V.Y];
  } catch {
    return Number.NaN;
  }
}

const simSummary = (s, V, goal) =>
  `revenu ${amount(s[V.Y])} (il va vers G / θ = ${amount(goal)}), impôt ${amount(s[V.T])}, déficit ${amount(s[V.G] - s[V.T])}, `
  + `consommation ${amount(s[V.C])}, monnaie des ménages ${amount(s[V.Hh])}.`;

const pcSummary = (s, V, goal) =>
  `revenu ${amount(s[V.Y])} (il va vers Y* = ${Number.isFinite(goal) ? amount(goal) : "aucun : la dette s'emballe"}), taux ${rate(s[V.r])}, `
  + `impôt ${amount(s[V.T])}, intérêts versés par l'État ${amount(s[V.iBs])} ; dette de l'État ${amount(s[V.Bs])}, `
  + `dont ${amount(s[V.Bh])} aux ménages et ${amount(s[V.Bcb])} à la banque centrale ; monnaie ${amount(s[V.Hh])}.`;

const ecoSummary = (s, V) => {
  const r = ratiosOf(s, V);
  return `PIB ${amount(s[V.GDP])}, chômage ${rate(r.unemployment)}, inflation ${rate(r.inflation)} au rythme du trimestre, `
    + `déficit ${rate(r.deficit)} du PIB, dette ${percent(r.debt)} du PIB, taux directeur ${rate(s[V.rcb])}, `
    + `solde courant ${rate(r.currentAccount)} du PIB.`;
};

/** A series of ÉCO's quarterly ratios, in percent. */
const ratioSeries = (key) => (run) => Float64Array.from({ length: run.periods + 1 }, (_, t) => 100 * ratiosOf(run.state(t), run.model.V)[key]);

/** The consumer prices' rise over the four quarters to each, in percent (the pace of its quarter before the fourth). */
const yearly = (run) => {
  const pc = run.series("pc");
  return Float64Array.from(pc, (price, t) => 100 * (t >= 4 ? price / pc[t - 4] - 1 : (price / run.before(t)[run.model.V.pc]) ** 4 - 1));
};

/** @type {(model: any) => Page} */
const sim = (model) => ({
  model, fields: SIM_FIELDS, starts: BOOK_STARTS, periods: 60, skip: 0, unit: "Période", example: { G: 30 },
  curves: curves([["Y", "Revenu Y"], ["C", "Consommation C"], ["Hh", "Monnaie des ménages H"]]),
  target: "Cible G / θ", goal: goalOf, summary: simSummary, notes: SIM_NOTES,
});

/** @type {(model: any) => Page} */
const pc = (model) => ({
  ...sim(model),
  fields: [...SIM_FIELDS.slice(0, 2), field("r", "Taux des bons r", [0, 0.08, 0.0025], rate), ...SIM_FIELDS.slice(2)],
  example: { r: 0.035 },
  curves: curves([["Y", "Revenu Y"], ["Bh", "Bons des ménages"], ["Hh", "Monnaie des ménages"]]),
  target: "Cible Y*", summary: pcSummary, notes: PC_NOTES,
});

/** @type {Page} */
const eco = {
  model: MODELS.ECO,
  fields: [
    field("rcb", "Taux directeur", [0, 0.08, 0.0025], rate),
    field("gshare", "Achats publics, part du PIB potentiel", [0.2, 0.4, 0.005], rate),
    field("tauw", "Impôts et cotisations sur les salaires", [0.4, 0.7, 0.01], percent),
    field("rr", "Allocation chômage, part du salaire net", [0.3, 0.9, 0.05], percent),
    field("shield", "Bouclier : part de l'énergie payée par l'État", [0, 0.5, 0.05], percent),
    field("eshock", "Prix de l'énergie importée", [0.5, 3, 0.1], times),
    field("conf", "Perte de confiance des ménages", [0, 0.05, 0.005], rate),
  ],
  starts: [["zero", "La France de 2024 (son trimestre de départ)"]],
  periods: 40, skip: 1, unit: "Trimestre", example: { eshock: 2 },
  curves: curves([["u", "Chômage", ratioSeries("unemployment")], ["inflation", "Inflation sur un an", yearly],
    ["deficit", "Déficit public", ratioSeries("deficit")]]),
  target: "", goal: () => Number.NaN, summary: ecoSummary, notes: ECO_NOTES,
};

/** The pages by model name; the variants with expectations show as their model. */
export const PAGES = Object.freeze({ SIM: sim(MODELS.SIM), SIMEX: sim(MODELS.SIMEX), PC: pc(MODELS.PC), PCEX: pc(MODELS.PCEX), ECO: eco });
