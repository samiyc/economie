/**
 * The page's words and colours. A sector keeps its colour on every drawing (the Sankey, the matrices): blue, orange,
 * aqua, yellow, the first four slots of the dataviz palette in its order, checked on the Khaki panel (#e8e8cd) by
 * neighbours (the yellow of the central bank sits below the aqua of the government, and far from the orange): their
 * contrast is under 3:1, so every node carries its name, every wide ribbon its label, and the matrices every value.
 */
export const SECTORS = {
  households: { name: "Ménages", colour: "#2a78d6" },
  firms: { name: "Entreprises", colour: "#eb6834" },
  government: { name: "État", colour: "#1baf7a" },
  centralBank: { name: "Banque centrale", colour: "#eda100" },
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
};

export const STOCKS = {
  money: "Monnaie",
  bills: "Bons",
  netWorth: "Patrimoine net",
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
