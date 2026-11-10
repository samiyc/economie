# Les règles simples face aux crises (J4, 9/11/2026)

Les cinq règles du [§ 6 de `modele.md`](modele.md) jouées sur ÉCO, contre trois familles de crises, 1 000 graines
chacune : `node scripts/rules.js --seeds 1000 --out docs/mesures/regles.json` (une minute, un fil). Chaque graine
donne une crise, et les cinq règles la jouent toutes : même début, même ampleur, même bruit de demande. Les chiffres
viennent de [`mesures/regles.json`](mesures/regles.json).

## 1. Ce qui est mesuré

**Les crises** (`src/crises/families.js`, toutes **H**, Q-P9). Chacune commence entre le 4e et le 8e trimestre,
monte en deux trimestres, tient, puis reflue :

| Famille | Le choc | L'épisode d'ancrage |
|---|---|---|
| **Le calme** | rien que le bruit : une AR(1) sur la confiance des ménages, persistance 0,7, écart-type 0,2 % par trimestre | — |
| **Le chômage fort** | la confiance perd 2 à 5 %, la demande étrangère 5 à 15 %, pendant 4 à 8 trimestres ; puis 30 % de l'écart revient chaque trimestre | 2008-2009 |
| **Les matières premières** | l'énergie 1,5 à 3 fois plus chère pendant 4 à 12 trimestres, les autres importations d'un dixième de cette hausse ; puis la moitié de l'écart se referme en un an | 2022 |

Le bruit de demande est le même dans les trois familles, pour une même graine : c'est ce qui permet de soustraire le
calme d'une crise, graine par graine (§ 3).

**Les règles** (`src/policy/rules.js`), sur les deux premiers leviers. La banque centrale fixe le taux du trimestre
suivant, à 0,5 point au plus par trimestre, jamais sous 0 (Q-S8). L'État vote ses achats un trimestre et les dépense
au suivant, à 1 point de PIB au plus par trimestre et à 5 points au plus de leur départ (Q-S6, Q-P5).

| Règle | Le taux | Les achats publics, décidés une fois l'an sur les quatre derniers trimestres |
|---|---|---|
| **R0** | 3 %, fixe | fixes : les stabilisateurs seuls |
| **R1** | Taylor : `r* + π + 0,5 (π − 2 %) + 0,5 y`, `r*` = 1 %, le taux réel de départ d'ÉCO (H, Q-P8) | fixes |
| **R2** | Taylor | le règlement 2024/1263 lu comme une trajectoire : le déficit structurel baisse de 0,5 point par an jusqu'à 1,5 % (H, Q-P14) |
| **R2s** | Taylor | un déficit structurel de 3 % (le déficit moins 0,63 fois l'écart de production), l'écart fermé chaque année |
| **R2n** | Taylor | un déficit nominal de 3 %, l'écart fermé chaque année : l'homme de paille |

Une règle budgétaire est naïve, comme les vraies : pour un point de déficit à effacer, elle dépense un point de PIB de
moins.

**Les objectifs**, sur les 40 trimestres, en points :
- le chômage moyen, et son pic entre parenthèses ;
- l'écart absolu moyen de l'inflation sur un an à 2 %, et son pic ;
- la dette à la fin, en part du PIB de la dernière année.

## 2. Les moyennes, par famille

ÉCO part de la France de 2024 : 5,8 % de déficit et 113 % de dette. Sous R0, la dette finit autour de 135 % au calme.
Toute règle budgétaire commence donc par corriger cette dérive, crise ou pas.

| Calme | Chômage | Inflation, écart (pic) | Dette | Écart de production | Trimestres au plancher |
|---|---|---|---|---|---|
| R0 | 7,20 (7,43) | 0,07 (2,03) | 135,50 | −0,13 | 0 |
| R1 | 7,16 (7,41) | 0,05 (2,01) | 134,30 | −0,09 | 0 |
| R2 | 8,40 (9,46) | 0,25 (2,00) | 126,66 | −2,01 | 0 |
| R2s | 8,36 (8,75) | 0,29 (2,11) | 127,55 | −1,76 | 0 |
| R2n | 9,24 (10,07) | 0,40 (2,12) | 121,81 | −3,04 | 0,02 |

| Chômage fort | Chômage | Inflation, écart (pic) | Dette | Écart de production | Trimestres au plancher |
|---|---|---|---|---|---|
| R0 | 8,17 (10,26) | 0,27 (2,11) | 146,90 | −1,14 | 0 |
| R1 | 7,91 (9,59) | 0,22 (1,98) | 140,67 | −0,91 | 0,79 |
| R2 | 9,20 (10,15) | 0,38 (1,99) | 133,19 | −2,91 | 1,58 |
| R2s | 9,24 (10,97) | 0,41 (2,00) | 134,52 | −2,76 | 2,88 |
| R2n | 10,55 (12,21) | 0,53 (2,00) | 128,28 | −4,58 | 20,10 |

| Matières premières | Chômage | Inflation, écart (pic) | Dette | Écart de production | Trimestres au plancher |
|---|---|---|---|---|---|
| R0 | 7,42 (7,89) | 1,98 (11,18) | 143,27 | −0,35 | 0 |
| R1 | 7,37 (8,42) | 1,93 (11,16) | 141,36 | −0,28 | 0,90 |
| R2 | 9,31 (10,76) | 2,27 (11,25) | 134,53 | −2,99 | 10,09 |
| R2s | 9,32 (11,29) | 2,31 (11,37) | 135,43 | −2,80 | 7,48 |
| R2n | 10,25 (11,96) | 2,39 (11,41) | 133,54 | −4,23 | 17,72 |

## 3. Les paires

Chaque case est l'écart moyen A − B sur les 1 000 graines, avec son intervalle à 95 % ; un écart négatif est en
faveur de A. Les intervalles sont étroits : deux règles voient la même crise, et le bruit propre à chaque crise
s'annule dans la paire.

**Au calme** :

| Paire | Chômage | Inflation | Dette |
|---|---|---|---|
| R1 − R0 | −0,04 [−0,05 ; −0,04] | −0,01 [−0,01 ; −0,01] | −1,20 [−1,23 ; −1,18] |
| R2 − R0 | 1,20 [1,20 ; 1,20] | 0,18 [0,18 ; 0,18] | −8,84 [−8,86 ; −8,81] |
| R2s − R0 | 1,16 [1,16 ; 1,16] | 0,23 [0,22 ; 0,23] | −7,95 [−7,97 ; −7,93] |
| R2n − R0 | 2,04 [2,04 ; 2,04] | 0,34 [0,34 ; 0,34] | −13,69 [−13,73 ; −13,65] |
| R2s − R2n | −0,88 [−0,89 ; −0,88] | −0,11 [−0,11 ; −0,11] | 5,74 [5,72 ; 5,75] |
| R2s − R2 | −0,04 [−0,04 ; −0,04] | 0,04 [0,04 ; 0,04] | 0,89 [0,89 ; 0,89] |

**Ce que la crise ajoute.** Une paire mesurée en crise mêle deux choses : la dérive de départ que les règles
corrigent, et la crise. On isole la crise en retranchant, graine par graine, la même paire au calme (même graine,
même bruit) :

| Chômage fort, la crise seule | Chômage | Inflation | Dette |
|---|---|---|---|
| R1 − R0 | −0,21 [−0,21 ; −0,20] | −0,04 [−0,04 ; −0,04] | −5,03 [−5,09 ; −4,96] |
| R2 − R0 | −0,17 [−0,17 ; −0,16] | −0,07 [−0,07 ; −0,07] | −4,87 [−4,93 ; −4,81] |
| R2s − R0 | −0,08 [−0,09 ; −0,08] | −0,08 [−0,09 ; −0,08] | −4,43 [−4,49 ; −4,38] |
| R2n − R0 | 0,35 [0,34 ; 0,35] | −0,07 [−0,08 ; −0,07] | −4,93 [−4,98 ; −4,88] |
| **R2s − R2n** | **−0,43 [−0,44 ; −0,42]** | **−0,01 [−0,01 ; −0,01]** | **0,49 [0,47 ; 0,52]** |
| R2s − R2 | 0,08 [0,08 ; 0,09] | −0,01 [−0,01 ; −0,01] | 0,44 [0,43 ; 0,45] |

| Matières premières, la crise seule | Chômage | Inflation | Dette |
|---|---|---|---|
| R1 − R0 | −0,01 [−0,01 ; −0,00] | −0,04 [−0,04 ; −0,03] | −0,71 [−0,78 ; −0,64] |
| R2 − R0 | 0,69 [0,68 ; 0,70] | 0,10 [0,10 ; 0,11] | 0,09 [0,04 ; 0,14] |
| R2s − R0 | 0,74 [0,73 ; 0,76] | 0,10 [0,10 ; 0,10] | 0,11 [0,04 ; 0,18] |
| R2n − R0 | 0,79 [0,79 ; 0,80] | 0,07 [0,07 ; 0,07] | 3,96 [3,90 ; 4,03] |
| **R2s − R2n** | **−0,05 [−0,06 ; −0,04]** | **0,03 [0,03 ; 0,03]** | **−3,85 [−3,91 ; −3,79]** |
| R2s − R2 | 0,05 [0,05 ; 0,06] | −0,00 [−0,00 ; −0,00] | 0,02 [−0,03 ; 0,07] |

## 4. Ce qu'on en lit

- **Taylor bat les stabilisateurs seuls**, sur les trois objectifs, dans chaque famille, et surtout en récession :
  0,25 point de chômage et 6,2 points de dette de moins. C'est la tendance que la littérature attend (§ 8 de
  `modele.md`). Face aux matières premières, il ne peut presque rien en dix ans : un point de taux ne baisse les prix
  que de 0,1 % en deux ans dans ÉCO.
- **Corriger la dérive coûte du chômage.** Au calme, R2s achète 8 points de dette en dix ans pour 1,2 point de chômage
  moyen ; R2n, 13,7 points pour 2 points. Aucune de ces règles ne domine les autres : ce sont des points de la
  frontière (§ 8), et choisir entre eux est un choix de politique, pas un résultat.
- **R2n perd contre R2s en récession** (le critère de J4). Ce que la récession ajoute, R2s le paie de 0,43 point de
  chômage en moins [0,42 ; 0,44] et 0,49 point de dette en plus [0,47 ; 0,52], l'inflation égale. Au seuil du § 8
  (Q-S3), c'est un gain : plus de 0,2 point de chômage, et une dette dans la marge de 1 point. La rigueur de R2n en
  pleine récession ajoute 0,35 point de chômage et n'efface pas plus de dette que Taylor seul (−4,9 contre −5,0) :
  c'est la leçon de Blanchard et Leigh (2013), ce que le modèle devait montrer.
- **Face aux matières premières, R2n creuse la dette** : 3,9 points de plus que R2s, au même chômage. L'inflation
  gonfle les recettes et le PIB nominal, le déficit nominal baisse, et R2n dépense ce qu'il croit gagné. R2s, qui
  regarde le déficit corrigé de la conjoncture, ne s'y trompe pas.
- **R2 et R2s font presque pareil** (moins de 0,1 point de chômage d'écart, 0,4 à 1,3 point de dette) : la
  trajectoire européenne, à 0,5 point par an, rejoint vite une cible de 3 % structurels, ÉCO partant de 5,6 %.
- **Aucune règle n'arrête le choc d'offre** : l'inflation monte à 11 % quoi qu'on fasse. Le bouclier (`shield`) est le
  seul levier qui l'attaque ; il n'est encore dans aucune règle.

## 5. Les témoins

- **A/A exact** : une règle rejouée sur sa graine redonne la même trajectoire à l'octet (`tests/policy.test.js`).
- **La cohérence** : les matrices sont vérifiées à chaque trimestre sur les 20 premières graines de chaque famille ;
  au-delà, la vérification est coupée pour la vitesse, les équations étant les mêmes.
- **A/A statistique** : R1 au calme, graines 1 à 1 000 contre 1 001 à 2 000. L'intervalle contient 0 pour le chômage
  (−0,002 [−0,005 ; 0,001]) et l'inflation (0,000 [−0,001 ; 0,001]). Pour la dette, il le frôle sans le contenir :
  −0,05 [−0,09 ; −0,003], quarante fois sous le plus petit gain qui vaille (2 points). Avec trois objectifs à 95 %, un
  intervalle sur sept manque 0 par hasard ; on le surveillera dans les séries suivantes.
- **Les hypothèses** (le modèle décalé du § 8) : les conclusions tiennent-elles si les comportements d'ÉCO changent
  de ±20 % ? Oui, sur les 26 variantes (§ 6).

## 6. La sensibilité aux hypothèses

Mesurée la nuit du 9 au 10/11 : la mesure entière (1 000 crises par famille) rejouée 26 fois, une hypothèse d'ÉCO
décalée à la fois, de −20 % (0,80) ou de +20 % (1,20) (`scripts/sensitivity.js`, un job par variante ; les sorties
dans `docs/mesures/sensibilite/`, la table par `scripts/sensitivity-report.js`). Les hypothèses décalées sont les
treize comportements marqués H dans `src/eco/targets.js` :
- `alpha2` : la propension à consommer la richesse ;
- `eps` : le poids du revenu courant dans le revenu attendu ;
- `etan` : la vitesse de l'emploi ;
- `phil` : la pente de Phillips ;
- `chi` : l'ancrage des anticipations ;
- `epsx` : l'élasticité des exportations ;
- `mug` : les importations des achats publics ;
- `mut` : les importations quand le travail manque ;
- `gammau`, `gammar`, `gammac` : la réponse de l'investissement à l'utilisation, au taux réel, à la confiance ;
- `iota` : la consommation au taux réel ;
- `lb1` : le partage dépôts-obligations.

Les conclusions « tiennent » quand trois choses restent vraies : Taylor bat R0 en récession sur le chômage (le haut de
l'intervalle sous 0) ; ce que la récession ajoute à R2s − R2n est un gain de chômage d'au moins 0,2 point (le haut de
l'intervalle sous −0,2) ; et la dette n'y perd pas plus d'un point (le haut sous 1), selon les seuils du § 8 de
`modele.md`.

| Hypothèse | Facteur | R1 − R0, chômage | R1 − R0, dette | R2s − R2n, chômage (récession) | R2s − R2n, dette (récession) | R2s − R2n, dette (matières) | A/A manque 0 | Conclusions |
|---|---|---|---|---|---|---|---|---|
| — | 1,00 | −0,25 | −6,23 | −0,43 | 0,49 | −3,85 | dette −0,05 | tiennent |
| alpha2 | 0,80 | −0,26 | −6,45 | −0,45 | 0,17 | −4,27 | dette −0,05 | tiennent |
| alpha2 | 1,20 | −0,24 | −6,04 | −0,42 | 0,69 | −3,51 | dette −0,04 | tiennent |
| chi | 0,80 | −0,26 | −6,47 | −0,44 | 0,38 | −3,91 | dette −0,05 | tiennent |
| chi | 1,20 | −0,25 | −6,03 | −0,42 | 0,58 | −3,81 | dette −0,04 | tiennent |
| eps | 0,80 | −0,25 | −6,24 | −0,43 | 0,51 | −3,84 | dette −0,05 | tiennent |
| eps | 1,20 | −0,25 | −6,23 | −0,43 | 0,48 | −3,87 | dette −0,05 | tiennent |
| epsx | 0,80 | −0,26 | −6,38 | −0,45 | 0,38 | −4,05 | dette −0,05 | tiennent |
| epsx | 1,20 | −0,24 | −6,11 | −0,41 | 0,56 | −3,69 | dette −0,04 | tiennent |
| etan | 0,80 | −0,25 | −6,05 | −0,44 | 0,92 | −3,51 | dette −0,05 | tiennent |
| etan | 1,20 | −0,26 | −6,31 | −0,40 | 0,16 | −4,07 | dette −0,04 | tiennent |
| gammac | 0,80 | −0,25 | −6,11 | −0,42 | 0,53 | −3,85 | dette −0,04 | tiennent |
| gammac | 1,20 | −0,26 | −6,35 | −0,44 | 0,46 | −3,85 | dette −0,05 | tiennent |
| gammar | 0,80 | −0,18 | −5,56 | −0,49 | −0,66 | −4,56 | dette −0,05 | tiennent |
| gammar | 1,20 | −0,32 | −6,86 | −0,37 | 0,89 | −3,31 | dette −0,04 | tiennent |
| gammau | 0,80 | −0,27 | −6,45 | −0,40 | 0,81 | −3,48 | dette −0,05 | tiennent |
| gammau | 1,20 | −0,24 | −6,04 | −0,46 | 0,06 | −4,26 | dette −0,05 | tiennent |
| iota | 0,80 | −0,23 | −6,02 | −0,44 | 0,19 | −4,11 | dette −0,05 | tiennent |
| iota | 1,20 | −0,27 | −6,45 | −0,42 | 0,71 | −3,62 | dette −0,04 | tiennent |
| lb1 | 0,80 | −0,25 | −6,23 | −0,43 | 0,48 | −3,87 | dette −0,05 | tiennent |
| lb1 | 1,20 | −0,25 | −6,23 | −0,43 | 0,51 | −3,84 | dette −0,05 | tiennent |
| mug | 0,80 | −0,25 | −6,18 | −0,45 | 0,14 | −4,33 | dette −0,05 | tiennent |
| mug | 1,20 | −0,26 | −6,28 | −0,41 | 0,73 | −3,45 | dette −0,05 | tiennent |
| mut | 0,80 | −0,25 | −6,19 | −0,43 | 0,49 | −3,85 | dette −0,05 | tiennent |
| mut | 1,20 | −0,25 | −6,26 | −0,43 | 0,49 | −3,85 | dette −0,04 | tiennent |
| phil | 0,80 | −0,24 | −5,68 | −0,39 | 0,83 | −3,62 | dette −0,04 | tiennent |
| phil | 1,20 | −0,26 | −6,78 | −0,48 | −0,05 | −4,17 | dette −0,05 | tiennent |

**Les trois conclusions tiennent sur les 26 variantes.**
- **Taylor bat les stabilisateurs seuls en récession** : de 0,18 à 0,32 point de chômage en moins, et de 5,6 à 6,9
  points de dette en moins.
- **R2s bat R2n sur ce que la récession ajoute** : de 0,37 à 0,49 point de chômage en moins. Le coût en dette va de
  −0,66 à +0,92 point ; le pire haut d'intervalle est 0,94, pour un emploi plus lent (`etan` 0,80), sous le point
  qui ferait perdre la non-infériorité.
- **Face aux matières premières, R2n finit plus endetté** : de 3,3 à 4,6 points de plus que R2s.

**Ce qui fait bouger les chiffres** :
- **Le canal du taux sur l'investissement (`gammar`)** pèse le plus. À −20 %, Taylor ne gagne plus que 0,18 point
  de chômage en récession ; à +20 %, il en gagne 0,32. La force de la règle de Taylor tient donc à une hypothèse que
  personne n'a encore réglée (Q-P3) : c'est la première à montrer à un économiste (Q-S10).
- **Le coût en dette de R2s en récession** dépend de `gammar`, `phil`, `etan`, `gammau`, `mug`, `iota` et
  `alpha2`. Il monte à 0,8 ou 0,9 point avec un emploi plus lent (`etan` 0,80), un investissement qui suit moins
  l'utilisation (`gammau` 0,80), une pente de Phillips plus plate (`phil` 0,80) ou un canal du taux plus fort
  (`gammar` 1,20). Il tombe vers 0, ou sous 0, avec les décalages inverses : R2s coûte alors moins de dette que R2n.
  Le mécanisme reste à démêler.
- **Quatre hypothèses ne changent presque rien** : `eps` et `lb1` (au plus 0,03 sur chaque colonne), `mut` et
  `gammac` (au plus 0,12).

**Les limites** :
- Une hypothèse est décalée à la fois, de ±20 % seulement ; deux hypothèses décalées ensemble pourraient s'ajouter. Le
  pire cas pour la dette (`etan` 0,80, ou `gammar` 1,20) reste à croiser avant J5.
- **L'A/A de la dette manque 0 dans les 26 variantes**, toujours de −0,04 à −0,05. Ce n'est pas 26 preuves : ce sont
  les mêmes graines (1 à 1 000 contre 1 001 à 2 000), et l'écart tient à ces deux lots de crises, pas au modèle. Il
  reste quarante fois sous le plus petit gain qui compte. Pour le lever, l'A/A de J5 tirera d'autres lots.
