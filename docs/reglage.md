# Les règles réglées (J5, 10/11/2026)

Les règles de J4 ([`regles.md`](regles.md)) gardaient les coefficients des manuels : les deux 0,5 de Taylor, et un
déficit ramené à sa cible en un an. J5 les règle, sur des graines qui ne servent jamais à la mesure, puis mesure les
règles réglées (R1\*, R2s\*) contre celles des manuels, par paires, sur les crises de J4. Les chiffres viennent de
[`mesures/reglage/`](mesures/reglage/) (les réglages) et de [`mesures/reglees.json`](mesures/reglees.json) (la mesure).

## 1. Ce qui est réglé

| | R1\* | R2s\* |
|---|---|---|
| Ce qui bouge | la réponse du taux à l'inflation au-dessus de 2 % (0,5 dans le manuel), et à l'écart de production (0,5) | les deux mêmes, et la part de l'écart du déficit structurel à 3 % comblée chaque année (1 dans le manuel) |
| Les bornes (H) | 0 à 3 chacune | 0 à 3, et 0 à 1 pour la vitesse |

Les bornes de vitesse des leviers ne changent pas (Q-S6) : le taux bouge d'un demi-point par trimestre au plus,
jamais sous 0 ; les achats publics d'un point de PIB au plus, votés un trimestre et dépensés le suivant.

**La perte** (`src/policy/tuning.js`, H, Q-S11) :
- chaque objectif du § 8 de `modele.md` compte en unités de son plus petit gain qui vaille (Q-S3) : 0,2 point de
  chômage moyen, 0,2 point d'écart d'inflation, 2 points de dette en fin d'horizon ;
- elle est linéaire, comme les moyennes de la mesure : une règle est réglée comme elle sera jugée ;
- trois jeux de poids, comme le recommande Q-S11 : l'**équilibre** (1, 1, 1), le **chômage d'abord** (3, 1, 1) et la
  **dette d'abord** (1, 1, 3).

**Le réglage** (`scripts/tune.js`, un job par règle et jeu de poids) :
- l'escalade de la lib (`createClimb`) part des coefficients du manuel ;
- un plan est noté sur 200 graines d'apprentissage par famille (calme, chômage fort, matières premières), à partir
  de la graine 1 000 001 ; la mesure prend les graines 1 à 4 000 ;
- 400 plans notés par escalade, trois escalades par réglage, de graines différentes ; on garde la meilleure ;
- un plan noté coûte 0,18 s ; un réglage, quatre minutes environ.

## 2. Les coefficients trouvés

| Réglage | Inflation | Écart de production | Vitesse | Perte du manuel → réglée (apprentissage) |
|---|---|---|---|---|
| R1\*, les trois jeux de poids | **3** (borne) | **2,96 à 2,99** | — | équilibre 110,40 → 109,06 |
| R2s\*, équilibre | 0 | **3** (borne) | **0,19** | 116,07 → 106,94 |
| R2s\*, dette d'abord | 0 | **3** (borne) | **0,40** | 248,53 → 232,33 |
| R2s\*, chômage d'abord | 3 | 2,99 | **0** | 205,77 → 183,19 : c'est R1\* |

**Les trois escalades s'accordent** à 0,01 près sur la perte, sauf pour R2s\* équilibre : 106,94 avec une réponse
nulle à l'inflation, 107,60 avec une réponse de 3. La réponse à l'inflation compte peu ici (§ 4).

**Les coefficients de Taylor butent sur la borne.** Au-delà, la perte continue de baisser, lentement : sur 100
graines d'apprentissage, 110,47 pour les coefficients du manuel, 109,20 pour 3 et 3, 108,55 pour 10 et 10, 108,14 pour
30 et 30. Avec 3 et 3, le taux bouge déjà du demi-point maximal à 77 % des trimestres, contre 22 % pour la règle
du manuel. **R1\*, c'est Taylor aussi vite que la borne de vitesse le permet** : c'est elle, plus que les
coefficients, qui fait la règle. La question est posée à Sami (Q-S12).

## 3. La mesure, graines 1 à 1 000

`node scripts/rules.js --seeds 1000 --tuned docs/mesures/reglage --out docs/mesures/reglees.json` (quatre minutes,
un fil). Les moyennes, en points :

| Famille | Règle | Chômage | Pic | Écart d'inflation | Dette | Trimestres au plancher |
|---|---|---|---|---|---|---|
| Le calme | R0 | 7,20 | 7,43 | 0,07 | 135,5 | 0,0 |
| Le calme | R1 | 7,16 | 7,41 | 0,05 | 134,3 | 0,0 |
| Le calme | R1\* | 7,11 | 7,41 | 0,04 | 133,0 | 0,0 |
| Le calme | R2s | 8,36 | 8,75 | 0,29 | 127,5 | 0,0 |
| Le calme | R2s\* équilibre | 7,49 | 7,71 | 0,10 | 122,6 | 1,4 |
| Le calme | R2s\* dette d'abord | 7,65 | 7,82 | 0,14 | 119,9 | 4,8 |
| Le calme | R2n | 9,24 | 10,07 | 0,40 | 121,8 | 0,0 |
| Le chômage fort | R0 | 8,17 | 10,26 | 0,27 | 146,9 | 0,0 |
| Le chômage fort | R1 | 7,91 | 9,59 | 0,22 | 140,7 | 0,8 |
| Le chômage fort | R1\* | 7,80 | 9,54 | 0,20 | 137,9 | 3,5 |
| Le chômage fort | R2s | 9,24 | 10,97 | 0,41 | 134,5 | 2,9 |
| Le chômage fort | R2s\* équilibre | 8,32 | 9,91 | 0,27 | 130,6 | 6,4 |
| Le chômage fort | R2s\* dette d'abord | 8,58 | 10,28 | 0,32 | 128,4 | 13,8 |
| Le chômage fort | R2n | 10,55 | 12,21 | 0,53 | 128,3 | 20,1 |
| Les matières premières | R0 | 7,42 | 7,89 | 1,98 | 143,3 | 0,0 |
| Les matières premières | R1 | 7,37 | 8,42 | 1,93 | 141,4 | 0,9 |
| Les matières premières | R1\* | 7,32 | 8,40 | 1,90 | 139,5 | 1,7 |
| Les matières premières | R2s | 9,32 | 11,29 | 2,31 | 135,4 | 7,5 |
| Les matières premières | R2s\* équilibre | 7,86 | 8,34 | 2,06 | 127,6 | 15,4 |
| Les matières premières | R2s\* dette d'abord | 8,24 | 8,81 | 2,15 | 126,3 | 19,4 |
| Les matières premières | R2n | 10,25 | 11,96 | 2,39 | 133,5 | 17,7 |

Les paires, l'écart moyen et son intervalle à 95 % (négatif : la première règle fait mieux) :

| Famille | Paire | Chômage | Écart d'inflation | Dette |
|---|---|---|---|---|
| Le calme | R1\* − R1 | −0,04 [−0,05 ; −0,04] | −0,01 [−0,01 ; −0,01] | −1,25 [−1,28 ; −1,21] |
| Le calme | R2s\* équilibre − R2s | −0,87 [−0,87 ; −0,87] | −0,19 [−0,19 ; −0,19] | −4,99 [−5,01 ; −4,96] |
| Le calme | R2s\* dette d'abord − R2s | −0,71 [−0,72 ; −0,71] | −0,15 [−0,15 ; −0,15] | −7,64 [−7,67 ; −7,61] |
| Le calme | R2s\* équilibre − R1\* | 0,37 [0,37 ; 0,38] | 0,06 [0,06 ; 0,06] | −10,48 [−10,51 ; −10,46] |
| Le calme | R2s\* dette d'abord − R1\* | 0,53 [0,53 ; 0,53] | 0,10 [0,10 ; 0,10] | −13,14 [−13,17 ; −13,11] |
| Le chômage fort | R1\* − R1 | −0,11 [−0,12 ; −0,11] | −0,03 [−0,03 ; −0,03] | −2,80 [−2,86 ; −2,73] |
| Le chômage fort | R2s\* équilibre − R2s | −0,92 [−0,92 ; −0,91] | −0,14 [−0,14 ; −0,14] | −3,95 [−4,00 ; −3,90] |
| Le chômage fort | R2s\* dette d'abord − R2s | −0,66 [−0,66 ; −0,65] | −0,10 [−0,10 ; −0,10] | −6,16 [−6,21 ; −6,11] |
| Le chômage fort | R2s\* équilibre − R1\* | 0,52 [0,52 ; 0,53] | 0,08 [0,08 ; 0,08] | −7,30 [−7,35 ; −7,26] |
| Le chômage fort | R2s\* dette d'abord − R1\* | 0,78 [0,78 ; 0,79] | 0,12 [0,12 ; 0,12] | −9,51 [−9,57 ; −9,46] |
| Les matières premières | R1\* − R1 | −0,05 [−0,05 ; −0,04] | −0,02 [−0,03 ; −0,02] | −1,87 [−1,98 ; −1,76] |
| Les matières premières | R2s\* équilibre − R2s | −1,46 [−1,47 ; −1,45] | −0,24 [−0,24 ; −0,24] | −7,88 [−7,97 ; −7,79] |
| Les matières premières | R2s\* dette d'abord − R2s | −1,08 [−1,08 ; −1,07] | −0,15 [−0,15 ; −0,15] | −9,11 [−9,20 ; −9,03] |
| Les matières premières | R2s\* équilibre − R1\* | 0,54 [0,53 ; 0,55] | 0,16 [0,15 ; 0,16] | −11,94 [−12,07 ; −11,80] |
| Les matières premières | R2s\* dette d'abord − R1\* | 0,92 [0,91 ; 0,93] | 0,25 [0,24 ; 0,25] | −13,16 [−13,30 ; −13,01] |

Toutes les paires, et ce que chaque crise y ajoute par rapport au calme, sont dans le JSON et dans la sortie du script.

## 4. Ce qu'on en lit

- **R1\* fait mieux que R1 sur les trois objectifs, dans les trois familles.** Le gain passe le seuil d'adoption du
  § 8 en récession seulement : 2,8 points de dette en moins [2,73 ; 2,86], pour 0,11 point de chômage en moins. Au
  calme et face aux matières premières, le gain reste sous le seuil, sans jamais rien coûter.
- **Les trois jeux de poids donnent le même R1\*.** Dans ÉCO, une banque centrale plus vive n'arbitre pas entre les
  objectifs : elle les améliore tous. Les chocs y sont surtout de demande, et la dette suit l'activité. Elle passe
  plus de temps au plancher (3,5 trimestres en récession, contre 0,8).
- **R2s\* bat nettement R2s, partout et sur les trois objectifs.** En récession, 0,9 point de chômage en moins et 4
  points de dette en moins ; face aux matières premières, 1,5 point de chômage et 7,9 points de dette en moins. La
  règle du manuel corrige trop vite : ramener le déficit à 3 % en un an creuse l'activité, et les recettes avec.
  Corriger un cinquième de l'écart par an (0,19) efface plus de dette en dix ans que tout corriger d'un coup.
- **Entre R1\* et R2s\*, c'est un choix.** R2s\* équilibre efface de 7 à 12 points de dette de plus que R1\* en dix ans,
  pour 0,37 à 0,54 point de chômage en plus. Aucune ne domine l'autre : les poids décident, et c'est la frontière du
  § 8. Avec les poids du chômage d'abord, R2s\* ne corrige rien et redevient R1\*.
- **R2s\* met le taux au plancher pendant le choc d'offre** : 15 à 19 trimestres face aux matières premières. La
  rigueur creuse l'écart de production, et la règle réglée y répond fort (3), sans rien ajouter pour l'inflation
  (0). L'inflation finit un peu plus loin de 2 % qu'avec R1\* (0,16 point de plus pour R2s\* équilibre).

**La barre de J6.** La recherche devra battre, famille par famille, R1\* ou R2s\* selon le jeu de poids : R1\* pour le
chômage d'abord, R2s\* équilibre et R2s\* dette d'abord pour les deux autres (Q-S4). Comme R1\* dépend de la borne des
coefficients (§ 2), Q-S12 propose un témoin de plus.

## 5. Les témoins

- **Les graines** : le réglage et la mesure ne partagent aucune graine (1 000 001 et suivantes, contre 1 à 4 000).
  Les gains mesurés tiennent hors de l'apprentissage : par exemple R2s\* équilibre bat R2s de 0,87 à 1,46 point de
  chômage sur les graines de la mesure.
- **Les escalades** : trois par réglage, de graines différentes, qui retrouvent la même perte à 0,01 près (§ 2).
- **Le manuel inchangé** : sans coefficients, une règle joue ceux du manuel, à l'octet (`tests/policy.test.js`) ;
  les empreintes d'ÉCO n'ont pas bougé, et les règles de J4 redonnent leurs chiffres de J4.
- **L'A/A sur deux autres lots**, comme promis au J4 : R1 au calme, graines 2 001 à 3 000 contre 3 001 à 4 000.
  L'intervalle contient 0 pour les trois objectifs, la dette comprise : 0,01 [−0,03 ; 0,06]. L'écart du J4
  (−0,05 [−0,09 ; −0,003]) tenait à ces deux lots-là.
- **Pas encore fait** : la sensibilité des règles réglées aux hypothèses d'ÉCO, comme au § 6 de `regles.md`. Une règle
  réglée sur un modèle peut l'exploiter ; ce sera le témoin du modèle décalé de J6.
