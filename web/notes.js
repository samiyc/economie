/**
 * The notes under each drawing of the page, by model: what to look at, and why it is so.
 */

export const SIM_NOTES = {
  flows: "Chaque secteur paraît deux fois : à gauche ce qu'il paie, à droite ce qu'il reçoit, et les deux barres sont aussi hautes l'une que l'autre, parce que rien ne se perd. Un ruban a la couleur de celui qui paie. La « variation de la monnaie » est l'épargne des ménages : l'État la leur verse en monnaie neuve quand il dépense plus qu'il ne lève.",
  curves: "Le revenu va vers G / θ, quoi que pensent les ménages : les propensions à consommer ne règlent que la vitesse du chemin. Aux valeurs du livre, la consommation et la monnaie des ménages finissent au même niveau (α1 + α2 = 1) : leurs courbes se recouvrent, l'infobulle les distingue. Un clic sur les courbes va à sa période.",
  matrices: "« + » une ressource, « − » un emploi, comme dans le livre. Chaque ligne et chaque colonne des transactions somment à zéro ; la dernière ligne des transactions, la variation de la monnaie, est l'équation cachée : la monnaie émise par l'État égale celle que reçoivent les ménages. Le code la vérifie à chaque période, à 10^−9 près.",
};
export const PC_NOTES = {
  flows: "La banque centrale arrive. L'État paie ses intérêts aux ménages et à la banque centrale, qui les lui rend en profits. Les ménages achètent des bons (« variation des bons ») ; la banque centrale prend ceux qu'ils laissent, et paie avec la monnaie qu'elle émet. Un flux négatif (des bons vendus) est dessiné à l'envers, du receveur au payeur.",
  curves: "Le revenu va vers Y*, l'état stationnaire de la politique en cours. Monter le taux relève Y* : les ménages tiennent plus de bons, l'État leur verse plus d'intérêts, et ils les dépensent. Le revenu ne bouge qu'à la période d'après, l'intérêt se payant au taux d'avant. Un clic sur les courbes va à sa période.",
  matrices: "« + » une ressource, « − » un emploi, comme dans le livre (tableaux 4.1 et 4.2) ; la banque centrale en une colonne, ses comptes courant et de capital sommant chacun à zéro. La ligne « variation de la monnaie » est l'équation cachée : la monnaie émise par la banque centrale égale celle que gardent les ménages. Le code la vérifie à chaque période, à 10^−9 près.",
};

export const ECO_NOTES = {
  flows: "Six secteurs. Les entreprises vendent aux ménages, à l'État et au reste du monde, et lui achètent leurs importations et leur énergie ; elles paient les salaires, l'impôt et les dividendes, dont une part sort, et empruntent aux banques ce qu'elles investissent au-delà de leurs profits. Les ménages placent leur épargne en dépôts et en obligations ; les banques prêtent, la banque centrale prend les bons qui restent, et ses réserves de change paient le déficit extérieur. L'investissement, que les entreprises s'achètent à elles-mêmes, ne paraît pas : seuls les prêts qui le financent passent.",
  curves: "Le chômage, l'inflation sur un an et le déficit public, en pourcentages. L'exemple double le prix de l'énergie importée dès le trimestre 5 : l'inflation monte, les salaires suivent à moitié, le revenu réel des ménages baisse et le chômage monte ; le déficit se creuse par les stabilisateurs. Le bouclier en paie une part, au prix de la dette. Un clic sur les courbes va au trimestre.",
  matrices: "« + » une ressource, « − » un emploi. Chaque ligne et chaque colonne des transactions somment à zéro. La ligne « variation de la monnaie centrale » est l'équation cachée : les réserves que la banque centrale émet sont celles que tiennent les banques. Aux bilans, le capital des entreprises est le seul actif réel : sa ligne somme à sa valeur, que la ligne du patrimoine net reprend. Le code vérifie tout, à chaque trimestre, à 10^−9 près.",
};
