import { MODELS } from "../src/models.js";
import { amount, rate } from "./labels.js";

/**
 * What the page shows of each model: its controls, its curves, the example its button brings back, the line under the
 * controls and the notes under each drawing. Everything else (the Sankey, the matrices) reads the model's ledger.
 *
 * @typedef {{ key: string, name: string, colour: string }} Curve
 * @typedef {{
 *   model: import("../src/types.js").Model,
 *   fields: string[],
 *   example: Record<string, number>,
 *   curves: Curve[],
 *   target: string,
 *   summary: (s: Float64Array, V: Readonly<Record<string, number>>, goal: number) => string,
 *   notes: { flows: string, curves: string, matrices: string },
 * }} Page
 */

/** The curves' colours: violet, magenta, green, checked on the Khaki panel (#e8e8cd), each named at its end. */
const COLOURS = ["#6250d6", "#e87ba4", "#008300"];
const curves = (pairs) => pairs.map(([key, name], i) => ({ key, name, colour: COLOURS[i] }));

const SIM_NOTES = {
  flows: "Chaque secteur paraît deux fois : à gauche ce qu'il paie, à droite ce qu'il reçoit, et les deux barres sont aussi hautes l'une que l'autre, parce que rien ne se perd. Un ruban a la couleur de celui qui paie. La « variation de la monnaie » est l'épargne des ménages : l'État la leur verse en monnaie neuve quand il dépense plus qu'il ne lève.",
  curves: "Le revenu va vers G / θ, quoi que pensent les ménages : les propensions à consommer ne règlent que la vitesse du chemin. Aux valeurs du livre, la consommation et la monnaie des ménages finissent au même niveau (α1 + α2 = 1) : leurs courbes se recouvrent, l'infobulle les distingue. Un clic sur les courbes va à sa période.",
  matrices: "« + » une ressource, « − » un emploi, comme dans le livre. Chaque ligne et chaque colonne des transactions somment à zéro ; la dernière ligne des transactions, la variation de la monnaie, est l'équation cachée : la monnaie émise par l'État égale celle que reçoivent les ménages. Le code la vérifie à chaque période, à 10^−9 près.",
};

const PC_NOTES = {
  flows: "La banque centrale arrive. L'État paie ses intérêts aux ménages et à la banque centrale, qui les lui rend en profits. Les ménages achètent des bons (« variation des bons ») ; la banque centrale prend ceux qu'ils laissent, et paie avec la monnaie qu'elle émet. Un flux négatif (des bons vendus) est dessiné à l'envers, du receveur au payeur.",
  curves: "Le revenu va vers Y*, l'état stationnaire de la politique en cours. Monter le taux relève Y* : les ménages tiennent plus de bons, l'État leur verse plus d'intérêts, et ils les dépensent. Le revenu ne bouge qu'à la période d'après, l'intérêt se payant au taux d'avant. Un clic sur les courbes va à sa période.",
  matrices: "« + » une ressource, « − » un emploi, comme dans le livre (tableaux 4.1 et 4.2) ; la banque centrale en une colonne, ses comptes courant et de capital sommant chacun à zéro. La ligne « variation de la monnaie » est l'équation cachée : la monnaie émise par la banque centrale égale celle que gardent les ménages. Le code la vérifie à chaque période, à 10^−9 près.",
};

const simSummary = (s, V, goal) =>
  `revenu ${amount(s[V.Y])} (il va vers G / θ = ${amount(goal)}), impôt ${amount(s[V.T])}, déficit ${amount(s[V.G] - s[V.T])}, `
  + `consommation ${amount(s[V.C])}, monnaie des ménages ${amount(s[V.Hh])}.`;

const pcSummary = (s, V, goal) =>
  `revenu ${amount(s[V.Y])} (il va vers Y* = ${Number.isFinite(goal) ? amount(goal) : "aucun : la dette s'emballe"}), taux ${rate(s[V.r])}, `
  + `impôt ${amount(s[V.T])}, intérêts versés par l'État ${amount(s[V.iBs])} ; dette de l'État ${amount(s[V.Bs])}, `
  + `dont ${amount(s[V.Bh])} aux ménages et ${amount(s[V.Bcb])} à la banque centrale ; monnaie ${amount(s[V.Hh])}.`;

/** @type {(model: any) => Page} */
const sim = (model) => ({
  model,
  fields: ["G", "theta", "alpha1", "alpha2"],
  example: { G: 30 },
  curves: curves([["Y", "Revenu Y"], ["C", "Consommation C"], ["Hh", "Monnaie des ménages H"]]),
  target: "Cible G / θ",
  summary: simSummary,
  notes: SIM_NOTES,
});

/** @type {(model: any) => Page} */
const pc = (model) => ({
  model,
  fields: ["G", "theta", "r", "alpha1", "alpha2"],
  example: { r: 0.035 },
  curves: curves([["Y", "Revenu Y"], ["Bh", "Bons des ménages"], ["Hh", "Monnaie des ménages"]]),
  target: "Cible Y*",
  summary: pcSummary,
  notes: PC_NOTES,
});

/** The pages by model name; the variants with expectations show as their model. */
export const PAGES = Object.freeze({ SIM: sim(MODELS.SIM), SIMEX: sim(MODELS.SIMEX), PC: pc(MODELS.PC), PCEX: pc(MODELS.PCEX) });

/** The income the model goes to under `params`: its stationary state's, NaN when it has none. */
export function goalOf(model, params) {
  try {
    return model.steadyState(params)[model.V.Y];
  } catch {
    return Number.NaN;
  }
}
