/**
 * The page's words and colours. A sector keeps its colour on every drawing (the Sankey, the matrices): blue, orange,
 * aqua, the first three slots of the dataviz palette, checked on the Khaki panel (#e8e8cd): their contrast is under
 * 3:1, so every ribbon carries its label and the matrices give every value as text.
 */
export const SECTORS = {
  households: { name: "Ménages", colour: "#2a78d6" },
  firms: { name: "Entreprises", colour: "#eb6834" },
  government: { name: "État", colour: "#1baf7a" },
};

export const FLOWS = {
  consumption: "Consommation",
  purchases: "Achats de l'État",
  wages: "Salaires",
  taxes: "Impôts",
  money: "Variation de la monnaie",
};

export const STOCKS = {
  money: "Monnaie",
  netWorth: "Patrimoine net",
};

const DECIMAL = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** A value to one decimal, the French way; « 0,0 » for what rounds to zero, never « −0,0 ». */
export const amount = (value) => DECIMAL.format(Math.abs(value) < 0.05 ? 0 : value);

/** A share as a percentage, to the unit. */
export const percent = (share) => `${Math.round(share * 100)} %`;

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
