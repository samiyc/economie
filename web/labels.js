/**
 * The page's words and colours. A sector keeps its colour on every drawing (the Sankey, the matrices): blue, orange,
 * aqua, yellow, magenta, green, the first six slots of the dataviz palette, checked on the Khaki panel (#e8e8cd) by
 * neighbours in the models' order (households, firms, government, central bank, banks, world: the magenta of the banks
 * kept away from the orange of the firms, 9.1 at worst for colour-blind eyes): their contrast is under 3:1, so every
 * node carries its name, every wide ribbon its label, and the matrices every value.
 */
export const SECTORS = {
  households: { name: "Ménages", colour: "#2a78d6" },
  firms: { name: "Entreprises", colour: "#eb6834" },
  government: { name: "État", colour: "#1baf7a" },
  centralBank: { name: "Banque centrale", colour: "#eda100" },
  banks: { name: "Banques", colour: "#e87ba4" },
  world: { name: "Reste du monde", colour: "#008300" },
};

export const FLOWS = {
  consumption: "Consommation",
  purchases: "Achats de l'État",
  wages: "Salaires",
  income: "Revenus",
  interest: "Intérêts",
  profits: "Profits de la banque centrale",
  taxes: "Impôts",
  money: "Variation de la monnaie",
  bills: "Variation des bons",
  exports: "Exportations",
  imports: "Importations",
  energy: "Énergie importée",
  subsidies: "Subventions",
  loanInterest: "Intérêts des prêts",
  dividends: "Dividendes",
  corporateTax: "Impôt sur les sociétés",
  bankProfits: "Profits des banques",
  depositInterest: "Intérêts des dépôts",
  billInterest: "Intérêts des bons",
  coupons: "Coupons des obligations",
  benefits: "Prestations",
  deposits: "Variation des dépôts",
  loans: "Variation des prêts",
  bonds: "Variation des obligations",
  foreignReserves: "Variation des réserves de change",
};

export const STOCKS = {
  money: "Monnaie",
  bills: "Bons",
  netWorth: "Patrimoine net",
  deposits: "Dépôts",
  loans: "Prêts",
  bonds: "Obligations",
  foreignReserves: "Réserves de change",
  capital: "Capital",
};

const DECIMAL = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** A value to one decimal, the French way; « 0,0 » for what rounds to zero, never « −0,0 ». */
export const amount = (value) => DECIMAL.format(Math.abs(value) < 0.05 ? 0 : value);

/** A share as a percentage, to the unit. */
export const percent = (share) => `${Math.round(share * 100)} %`;

/** A rate as a percentage, to a tenth of a point. */
export const rate = (share) => `${DECIMAL.format(share * 100)} %`;

/** A gap of a matrix to zero, written as a power of ten. */
export const gapText = (gap) => (gap === 0 ? "0" : gap.toExponential(0).replace("e", " × 10^"));

const SVG = "http://www.w3.org/2000/svg";

/** An SVG element `tag`, with `attributes`, and its text if given (by textContent). */
export function svg(tag, attributes = {}, text = null) {
  const element = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  if (text !== null) element.textContent = text;
  return element;
}
