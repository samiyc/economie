# Le glossaire

Les mots de la macroéconomie et des finances publiques, et ce qui leur répond dans le modèle. La dernière colonne donne
le nom prévu dans le code, ou « — » si le mot attend un jalon ou reste hors du modèle.

**D'où ils viennent.** Les termes du stock-flux viennent de Godley et Lavoie (*Monetary Economics*, 2007), à travers
`sfcr` et MacroStat ; ceux des finances publiques, de l'Insee et des textes européens ; ceux de la politique monétaire,
de la BCE et de Taylor (1993). Le livre n'a pas été lu dans le texte : les traductions françaises sont les nôtres, et
attendent la relecture d'un professionnel (Q-P16). Le code est en anglais ; le nom anglais entre parenthèses aide à
lire les articles.

## Le stock-flux

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **Secteur institutionnel** (*sector*) | un groupe d'agents qui ont le même rôle : les ménages, les entreprises, les banques, l'État, la banque centrale, le reste du monde | `sector` |
| **Flux** (*flow*) | ce qui passe pendant un trimestre : une consommation, un salaire, un impôt, un intérêt | `flow` |
| **Stock** (*stock*) | ce qui est détenu à la fin du trimestre : la monnaie, les bons, les prêts, la dette | `stock` |
| **Stock-flux cohérent** (*stock-flow consistent*, SFC) | un modèle où chaque flux sort d'un secteur et entre dans un autre, et où chaque actif financier est le passif d'un autre : rien ne se perd | — |
| **Matrice des transactions** (*transactions-flow matrix*) | une ligne par flux, une colonne par secteur ; chaque ligne et chaque colonne somment à zéro | `transactions` |
| **Matrice des bilans** (*balance-sheet matrix*) | une ligne par actif, une colonne par secteur ; les actifs financiers somment à zéro | `balanceSheet` |
| **Équation cachée** (*redundant* ou *hidden equation*) | une équation qui découle des autres ; le code la vérifie au lieu de l'écrire. Dans SIM : la monnaie émise égale la monnaie détenue | `hiddenCheck` |
| **État stationnaire** (*steady state*) | l'état où plus rien ne bouge : les stocks sont constants, le déficit est nul (SIM) | `steadyState` |
| **Propension à consommer** (*propensity to consume*) | la part du revenu (α1) ou de la richesse d'avant (α2) que les ménages consomment | `alpha1`, `alpha2` |
| **Revenu disponible** (*disposable income*, YD) | le revenu des ménages après impôts, prestations comprises | `disposableIncome` |
| **Richesse** (*wealth*, V) | ce que les ménages détiennent : monnaie, dépôts, bons, obligations | `wealth` |
| **Choix de portefeuille** (*portfolio choice*) | le partage de la richesse entre actifs, selon leurs rendements (PC, les λ) | `lambda0`… |
| **Bon du Trésor** (*bill*) | un titre court de l'État ; son taux suit le taux directeur | `bills` |
| **Obligation** (*bond*) | un titre long ; son prix baisse quand les taux montent (LP) | `bonds` |
| **Diagramme de Sankey** | un dessin des flux en rubans, d'autant plus larges que le flux est gros | la page |

## L'activité et l'emploi

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **PIB** (*GDP*, Y) | la production du trimestre ; 100 au départ d'ÉCO | `output` |
| **PIB potentiel** (*potential output*) | ce que l'économie produirait au chômage structurel | `potential` |
| **Écart de production** (*output gap*) | l'écart du PIB au potentiel, en % du potentiel | `outputGap` |
| **Population active** (*labour force*) | les personnes en emploi ou qui en cherchent un | `labourForce` |
| **Chômage au sens du BIT** (*unemployment rate*) | les chômeurs sur la population active ; 7,4 % en France en 2024 | `unemployment` |
| **Chômage structurel**, NAIRU | le chômage sous lequel l'inflation accélère ; il ne dépend pas de la conjoncture | `naturalUnemployment` |
| **Loi d'Okun** (*Okun's law*) | le lien entre la croissance et la baisse du chômage ; un test de calibration, pas une équation du modèle | test |
| **Multiplicateur budgétaire** (*fiscal multiplier*) | le PIB gagné pour un euro de dépense publique en plus (ou perdu pour un euro d'austérité) | test |
| **Chômage partiel** (*short-time work, furlough*) | l'État paie une part du salaire des emplois mis à l'arrêt, qui ne sont pas détruits | `furlough` |

## Les prix

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **Inflation** | la hausse des prix sur un an, en % | `inflation` |
| **IPCH** (*HICP*) | l'indice des prix harmonisé, celui que vise la BCE | — |
| **Courbe de Phillips** | le lien entre le chômage et la hausse des salaires : moins de chômage, des salaires qui montent plus vite | `phillipsSlope` |
| **Taux de marge** (*mark-up*) | ce que les entreprises ajoutent à leur coût unitaire pour faire leur prix | `markup` |
| **Revendications en conflit** (*conflicting claims*) | les salariés visent un salaire réel, les entreprises une marge ; si les deux ne tiennent pas ensemble, les prix et les salaires se poursuivent : la spirale | — |
| **Choc d'offre** (*supply shock*) | un choc qui monte les coûts (l'énergie) : l'inflation monte et l'activité baisse | crise |
| **Choc de demande** (*demand shock*) | un choc qui baisse la dépense : l'activité et l'inflation baissent ensemble | crise |
| **Termes de l'échange** (*terms of trade*) | le prix des exportations sur celui des importations ; un choc sur l'énergie les dégrade | — |

## La politique monétaire

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **Taux directeur** (*policy rate*) | le taux que fixe la banque centrale ; ici, celui des bons | `policyRate` |
| **Règle de Taylor** (*Taylor rule*) | le taux directeur selon l'inflation et l'écart de production : `i = r* + π + 0,5 (π − 2) + 0,5 y` | `taylorRule` |
| **Taux neutre** (*neutral rate*, r\*) | le taux réel qui ne freine ni ne pousse l'économie | `neutralRate` |
| **Plancher** (*lower bound*) | le taux le plus bas possible : 0 au départ du modèle | `rateFloor` |
| **Cible d'inflation symétrique** | 2 % pour la BCE depuis 2021 : un écart au-dessus compte comme un écart en dessous | `inflationTarget` |
| **Réserves de change** | les devises que la banque centrale détient ; elles bougent pour tenir un change fixe (OPEN) | `reserves` |

## Les finances publiques

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **Dépense publique** | toutes les dépenses des administrations : achats, prestations, intérêts ; 57,2 % du PIB en 2024 | `publicSpending` |
| **Achats publics** (G) | la part de la dépense qui achète des biens et des services : le levier `G` | `purchases` |
| **Prélèvements obligatoires** | les impôts et les cotisations sociales ; 42,8 % du PIB en 2024 | `levies` |
| **Déficit public** | la dépense moins les recettes, en % du PIB | `deficit` |
| **Solde primaire** | le solde hors intérêts de la dette | `primaryBalance` |
| **Dette au sens de Maastricht** | la dette brute des administrations publiques, en % du PIB annuel | `debtRatio` |
| **Stabilisateurs automatiques** | ce qui amortit la conjoncture sans décision : l'impôt qui baisse et les prestations qui montent en récession | R0 |
| **Semi-élasticité du solde** | les points de PIB de solde perdus par point d'écart de production ; 0,63 pour la France | test |
| **Solde structurel** (*structural balance*) | le solde corrigé de la conjoncture : celui qu'on aurait au PIB potentiel | `structuralBalance` |
| **Règle de déficit** (*fiscal rule*) | une règle qui fixe la dépense ou l'impôt selon le déficit ou la dette | R2 |
| **Effet boule de neige** | la dette monte d'elle-même quand le taux d'intérêt dépasse la croissance (r > g) | — |
| **Bouclier tarifaire** | une subvention de l'État qui plafonne le prix de l'énergie pour les ménages | `energyShield` |
| **Rapport démographique** | les 20-64 ans sur les 65 ans et plus ; 2,5 en 2025, 1,62 en 2070 (COR) | `dependency` |

## La recherche

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **Commande prédictive**, pilotage à horizon glissant (*model predictive control*, *rolling horizon*) | planifier les leviers sur plusieurs trimestres, jouer le premier, puis recommencer au trimestre suivant | la recherche |
| **Futurs tirés** | des suites possibles de la crise, tirées de leur loi, sur lesquelles on note un plan, comme les mondes de l'ISMCTS | `futures` |
| **Futurs communs** (*common random numbers*) | les mêmes futurs pour tous les plans d'une décision : deux plans se comparent sur les mêmes tirages | `common` |
| **Frontière** (*Pareto front*) | les politiques qu'aucune autre ne bat sur les trois objectifs à la fois | la mesure |
| **Graines d'apprentissage** | les graines où l'on règle les règles ; jamais celles où on les mesure | `trainSeeds` |
