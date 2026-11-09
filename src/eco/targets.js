/**
 * What ÉCO's starting quarter must look like: France's proportions in 2024 (docs/recherche/chiffres.md), each a share
 * of the year's GDP, and the hypotheses (H) that fill the rest, each pointing to its question in
 * docs/recherche/questions.md. src/eco/calibrate.js derives from them the starting state and the parameters.
 */

/** The ratios of 2024, shares of GDP unless said; the source of each is in chiffres.md, § 3 and § 7. */
export const TARGETS = Object.freeze({
  exports: 0.338, // OCDE, statistiques de base 2025 (E)
  imports: 0.343, // idem; Insee : 999,1 Md€ pour un PIB de 2 919,9 (E)
  energy: 0.02, // facture énergétique, SDES : 57,8 Md€ (E), dans les importations
  purchases: 0.28, // consommation et investissement publics (H, Q-P1 : à sourcer)
  investment: 0.13, // investissement des entreprises (H : à sourcer)
  productTaxes: 0.1, // TVA et impôts sur les produits (H : à sourcer)
  wages: 0.52, // rémunération des salariés (H : à sourcer)
  unemployment: 0.074, // Insee, moyenne 2024 (E)
  labourForce: 31.1, // millions : 2,3 millions de chômeurs pour 7,4 % (C)
  retirees: 17, // millions (H : à sourcer, DREES)
  debt: 1.13, // Insee, 113,2 % puis 112,6 % après révision (E)
  deficit: 0.058, // Insee (E)
  spending: 0.572, // Insee (E)
  levies: 0.428, // prélèvements obligatoires, Insee (E)
  pensions: 0.14, // COR, 14,1 % en 2025 (E)
  unemploymentBenefits: 0.013, // (H : à sourcer, Unédic)
  subsidies: 0.025, // subventions aux entreprises (H : à sourcer)
  interest: 0.02, // charge d'intérêts, Insee (E)
  corporateTax: 0.022, // impôt sur les sociétés (H : à sourcer)
  capitalTax: 0.015, // impôts sur les revenus du capital (H)
  currentAccount: 0.004, // solde courant, OFCE : un excédent en 2024 (E, le chiffre à relire)
  foreignControl: 0.13, // emploi marchand sous contrôle étranger, Insee 2022 (E) : la part des dividendes qui sort
  loans: 0.466, // crédits aux sociétés non financières, Banque de France : 1 360 Md€ (E)
  billsShare: 0.1, // part des titres courts dans la dette (H : à sourcer, Agence France Trésor)
  reserves: 0.08, // réserves de change et or de la banque centrale (H : à sourcer)
  capital: 2.25, // capital fixe des entreprises, en années de PIB (H)
  inflation: 0.02, // la cible de la BCE, prise comme l'inflation de départ
});

/** The behaviour's hypotheses: each with its question, the value the model keeps until an answer. */
export const ASSUMED = Object.freeze({
  gpr: 0.0025, // croissance de la productivité, 1 % l'an (H)
  un: 0.07, // chômage structurel (H, Q-P7)
  rcb: 0.03, // taux directeur annuel (H : ÉCO a sa banque centrale, Q-S1)
  sl: 0.015, // marge des prêts sur le taux directeur, annuelle (H)
  sm: 0.015, // écart du taux des dépôts sous le taux directeur, annuel (H)
  tp: 0, // prime de terme des obligations (H)
  mat: 34, // maturité moyenne de la dette, en trimestres : 8,5 ans (H : à sourcer, Agence France Trésor)
  rho: 0.15, // réserves des banques à la banque centrale, part des dépôts (H)
  alpha2: 0.01, // propension à consommer la richesse réelle, par trimestre (H)
  eps: 0.5, // poids du revenu courant dans le revenu attendu (H)
  etan: 0.1, // part de l'écart d'emploi comblée en un trimestre (H, réglée sur Okun)
  phil: 0.006, // pente de la courbe de Phillips (H, Q-P2)
  chi: 0.5, // ancrage des anticipations d'inflation sur la cible (H, Q-P2)
  epsx: 0.5, // élasticité des exportations au prix relatif (H, Q-P1)
  mug: 0.1, // contenu en importations des achats publics, surtout des salaires (H, Q-P1)
  mut: 0.5, // hausse des importations quand le travail manque : la demande que les salariés ne servent pas (H, Q-P6)
  gammau: 0.02, // réponse de l'investissement à l'utilisation des capacités (H, Q-P3)
  gammar: 0.05, // réponse de l'investissement au taux réel (H, Q-P3)
  gammac: 0.05, // réponse de l'investissement à la confiance (H, Q-P9)
  lb1: 5, // sensibilité de la part des obligations à l'écart de taux (H)
  idx: 1, // indexation des retraites sur les prix
});
