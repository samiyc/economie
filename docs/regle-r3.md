# R3, la règle qui imite la recherche, et CMA-ES (16/11/2026)

La recherche de J6 ([`recherche.md`](recherche.md)) relance tôt en récession et consolide après. R3 l'écrit en règle,
réglée sur les graines d'apprentissage de J5 par deux recherches de la lib, l'escalade (`createClimb`) et CMA-ES
(`createCmaes`, dans la lib depuis le 13/11), au même budget. Deux questions de Sami (16/11) : CMA-ES apporte-t-il
quelque chose par rapport à l'escalade ? Une règle qu'on peut écrire fait-elle aussi bien que la recherche ? Les
chiffres viennent de [`mesures/r3/`](mesures/r3/), que `node scripts/r3-report.js` lit.

**En bref** :
- **CMA-ES n'apporte rien ici** : les deux recherches trouvent la même règle, à 0,1 % de perte près ; l'escalade y
  arrive deux à quatre fois plus vite ;
- **R3 prend de 39 à 119 % du gain de la recherche** sur la barre, selon la famille et les poids : l'essentiel quand
  il faut relancer, moins quand il faut consolider ;
- **avec la dette d'abord, R3 bat la règle de déficit réglée sur les trois objectifs**, en récession et face aux
  matières premières : ce que la recherche ne faisait pas en récession. Sur le modèle décalé, cela tient face aux
  matières premières, pas toujours en récession (§ 5) ;
- **sur le modèle décalé, R3 garde sa part** du gain de la recherche (§ 5) ; **aux bornes élargies** (R3w, § 6), elle
  en prend plus avec le chômage d'abord, mais n'est plus meilleure sur les trois objectifs avec la dette d'abord.

## 1. La règle

R3 (`src/policy/countercyclical.js`) décide chaque trimestre, comme la recherche ; les achats publics restent votés un
trimestre avant d'être dépensés, dans les bornes de J4 (Q-S6). Le taux suit le Taylor du manuel (Sami, 10/11). Les
achats qu'elle vise, en points de PIB :

| Coefficient | Ce qu'il fait | Bornes (H) |
|---|---|---|
| `jobs` | dépenser autant de points par point de chômage au-dessus de sa référence | 0 à 3 |
| `rise` | dépenser autant de points par point de hausse du chômage sur un an : la réponse précoce | 0 à 5 |
| `prices` | dépenser autant de points de moins par point d'inflation au-dessus de 2 % | 0 à 3 |
| `consolidation` | la part de l'écart du déficit structurel à 3 % comblée chaque année, sur une base qui s'ajoute aux réponses | 0 à 1 |
| `patience` | à combien de points de chômage au-dessus de sa référence la consolidation s'arrête tout à fait | 0,1 à 3 |
| `reference` | le chômage de référence, en points autour de celui du départ (7,4 %) | −1 à +1 |
| `smooth` | la part du chemin vers la cible faite chaque trimestre | 0,1 à 1 |

Tous ses coefficients à 0, R3 est R1 : les achats ne bougent pas (`tests/policy.test.js`).

## 2. Le réglage : l'escalade contre CMA-ES

`node scripts/tune.js --rule R3 --optimizer climb|cmaes --budget 1600 --restarts 5` : six jobs d'un fil dans la file,
25 minutes chacun. Chaque plan est noté sur 200 graines d'apprentissage par famille, à partir de 1 000 001 ; les deux
recherches partent du même point (R1) et voient les mêmes plans notés. CMA-ES voit chaque coefficient ramené à
[0, 1], σ = 0,3 (le réglage de la lib), 9 plans par génération ; un plan hors des bornes est ramené dedans, et
pénalisé de 100 par carré de l'écart. Il s'arrête à la dernière génération entière, 1 593 plans.

La meilleure perte d'apprentissage trouvée, moyenne des cinq relances (la meilleure des cinq entre parenthèses) :

| Poids | Recherche | 50 plans | 100 | 200 | 400 | 800 | 1 600 | Écart des relances |
|---|---|---|---|---|---|---|---|---|
| équilibre (R1 : 110,40) | escalade | 109,14 (109,00) | 109,10 | 109,04 | 109,01 | 109,01 | 109,00 (108,96) | 0,13 |
| | CMA-ES | 109,41 (109,25) | 109,36 | 109,15 | 109,05 | 109,00 | **108,97** (108,96) | **0,02** |
| chômage d'abord (R1 : 185,17) | escalade | **179,68** (179,35) | **179,41** | **179,36** | 179,36 | 179,36 | 179,36 (179,35) | 0,01 |
| | CMA-ES | 180,88 (179,66) | 179,75 | 179,66 | 179,43 | 179,37 | 179,37 (179,35) | 0,04 |
| dette d'abord (R1 : 249,13) | escalade | **245,08** (244,66) | **244,71** | **244,43** | **244,37** | **244,27** | **244,26** (244,18) | 0,41 |
| | CMA-ES | 245,95 (245,78) | 245,27 | 244,87 | 244,51 | 244,45 | 244,44 (244,29) | 0,44 |

- **Les deux recherches trouvent la même règle.** À 1 600 plans, la meilleure des relances est la même à 0,01 près
  pour l'équilibre et le chômage d'abord ; l'escalade fait 0,11 de mieux avec la dette d'abord.
- **L'escalade y arrive deux à quatre fois plus vite.** Le niveau que CMA-ES atteint à 400 plans, l'escalade l'a à
  100 ou 200.
  CMA-ES apprend sa covariance sur ses premières générations, de 9 plans chacune : à 7 gènes, il lui en faut une
  quarantaine avant de bien viser.
- **Son seul avantage** : avec l'équilibre, ses cinq relances finissent à 0,02 l'une de l'autre, contre 0,13 pour
  l'escalade. Il est plus régulier, sans être meilleur.
- **Pourquoi** : l'optimum est sur les bornes (§ 3). Avec la dette d'abord, cinq coefficients sur sept y sont. Ramener
  un gène dans sa borne, c'est ce que l'escalade fait à chaque mouvement ; CMA-ES, lui, apprend une forme du terrain
  que la pénalité déforme près des bords. C'est le troisième contre-exemple après Mars Lander et la ligne de course
  de `circuit` (le tableau, 13 et 14/11) : un terrain aux bords, ou en marches, plutôt qu'une vallée en biais.
- **Sur les graines de la mesure**, les deux R3\* jouent presque pareil : l'écart de perte va de −0,44 à +0,75 unité,
  en dessous de tout seuil.

## 3. Les règles trouvées

| Poids | jobs | rise | prices | consolidation | patience | reference | smooth |
|---|---|---|---|---|---|---|---|
| équilibre | 2,3 à 2,5 | 0 à 0,08 | 0 | 0,10 à 0,16 | **0,1** (borne) | −0,5 | **1** (borne) |
| chômage d'abord | **3** (borne) | 0 | 0 | 0 | 0,1 à 0,5 | **−1** (borne) | **1** (borne) |
| dette d'abord | **3** (borne) | **4,7 à 5** (borne) | 0,6 | 0,7 à **1** | 0,1 à 1 | **+1** (borne) | 0,33 à 0,35 |

- **Avec l'équilibre**, R3 dépense 2,4 points de PIB par point de chômage au-dessus de 6,9 %, et ne consolide qu'une
  fois le chômage revenu à ce niveau, d'un dixième de l'écart par an. La relance par le niveau du chômage suffit : la
  hausse ne compte pas.
- **Avec le chômage d'abord**, elle relance au maximum permis et ne consolide jamais.
- **Avec la dette d'abord**, elle consolide vite, mais dépense fort dès que le chômage monte (5 points de PIB par
  point de hausse sur un an), et ne compte le chômage comme trop haut qu'un point au-dessus du départ.
- **Les bornes tiennent la règle** pour le chômage d'abord et la dette d'abord : plus larges, elles feraient
  peut-être mieux. C'est à mesurer (§ 5) ; les bornes de vitesse des leviers (Q-S6) limitent de toute façon ce
  qu'une réponse plus forte peut faire.

## 4. La mesure, graines 1 à 200

R3\* est le meilleur des deux réglages sur l'apprentissage ; la barre, celle de J6 (R1, ou R2s\*b avec la dette
d'abord) ; la recherche, celle de J6, sur les mêmes graines. Les paires (négatif : R3\* fait mieux), le verdict du
seuil du § 8 de `modele.md`, et la perte des poids :

| Famille | Poids | R3\* − barre : chômage | Écart d'inflation | Dette | Seuil | Perte | Recherche − barre : perte | Part du gain de la recherche |
|---|---|---|---|---|---|---|---|---|
| Le calme | équilibre | −0,09 | −0,01 | +0,39 | — | −0,32 | −0,27 | **119 %** |
| Le chômage fort | équilibre | −0,60 [−0,62 ; −0,58] | −0,08 | +1,91 | — | −2,43 | −3,02 | 80 % |
| Les matières premières | équilibre | −0,22 [−0,22 ; −0,21] | −0,04 | −0,60 | **gagne** | −1,56 | −2,77 | 56 % |
| Le calme | chômage d'abord | −0,35 | +0,08 | +6,61 | — | −1,64 | −1,68 | 98 % |
| Le chômage fort | chômage d'abord | −0,92 | +0,03 | +7,21 | — | −10,06 | −12,05 | 83 % |
| Les matières premières | chômage d'abord | −0,54 | −0,13 | +5,67 | — | −5,93 | −8,46 | 70 % |
| Le calme | dette d'abord | +0,41 | +0,09 | −3,23 | — | −2,35 | −5,50 | 43 % |
| Le chômage fort | dette d'abord | −0,24 [−0,27 ; −0,22] | −0,01 | −0,64 | **gagne** | −2,25 | −5,80 | 39 % |
| Les matières premières | dette d'abord | −0,22 [−0,25 ; −0,20] | −0,07 | −2,49 [−2,70 ; −2,28] | **gagne** | −5,22 | −8,59 | 61 % |

- **Une règle de sept nombres fait l'essentiel du travail de la recherche** quand on relance : 80 % de son gain en
  récession avec l'équilibre, 83 % avec le chômage d'abord ; au calme, autant ou plus. Le pic de chômage en récession
  passe de 9,6 % (R1) à 8,6 %, contre 8,0 % pour la recherche.
- **Elle en fait moins quand il faut consolider** (39 à 61 % avec la dette d'abord) ou face au choc d'offre (56 à
  70 %) : là, la recherche voit venir ce que la crise va faire, et la règle ne voit que le chômage d'aujourd'hui.
- **Avec la dette d'abord, R3\* passe le seuil contre R2s\*b en récession et face aux matières premières** : moins de
  chômage, moins d'inflation et moins de dette à la fois. La recherche, elle, ne le passait pas en récession : elle
  échangeait du chômage contre de la dette. Consolider en freinant quand le chômage monte vaut mieux que consolider
  au même pas en toute saison.
- **Ce qui reste à la recherche** : la différence de perte va de 0,6 (récession, équilibre) à 3,6 unités (récession,
  dette d'abord). Au calme avec l'équilibre, R3\* fait même un peu mieux qu'elle (0,05 unité).

## 5. Les témoins

- **Les graines** : le réglage et la mesure ne partagent aucune graine (1 000 001 et suivantes, contre 1 à 200).
- **R3 à zéro est R1**, à l'octet ; les réglages de J5 et de J6 voient les mêmes plans qu'avant (les empreintes et les
  tests n'ont pas bougé).
- **Le modèle décalé** : R3\* (équilibre), réglée sur ÉCO, jouée dans les quatre mondes de J6 où une hypothèse bouge
  (`recherche.md`, § 6), graines 1 à 100, contre R1 et la recherche dans le même monde :

| Monde | Famille | R3\* − R1 : chômage | Écart d'inflation | Dette | Seuil | Perte | Part du gain de la recherche |
|---|---|---|---|---|---|---|---|
| ÉCO (§ 4, 200 graines) | Le chômage fort | −0,60 | −0,08 | +1,91 | — | −2,43 | 80 % |
| `phil` × 1,2 | Le chômage fort | −0,55 [−0,58 ; −0,53] | −0,09 | +1,34 | — | −2,58 | 80 % |
| `gammar` × 0,8 | Le chômage fort | −0,63 [−0,66 ; −0,60] | −0,08 | +1,45 | — | −2,83 | 82 % |
| `etan` × 0,8 | Le chômage fort | −0,61 [−0,64 ; −0,59] | −0,10 | +2,18 | — | −2,47 | 86 % |
| `mug` × 1,2 | Le chômage fort | −0,58 [−0,61 ; −0,55] | −0,08 | +1,90 | — | −2,35 | 81 % |
| ÉCO (§ 4, 200 graines) | Les matières premières | −0,22 | −0,04 | −0,60 | gagne | −1,56 | 56 % |
| `phil` × 1,2 | Les matières premières | −0,21 [−0,22 ; −0,20] | −0,04 | −0,86 | — | −1,67 | 55 % |
| `gammar` × 0,8 | Les matières premières | −0,21 [−0,23 ; −0,20] | −0,04 | −0,53 | gagne | −1,53 | 59 % |
| `etan` × 0,8 | Les matières premières | −0,22 [−0,23 ; −0,20] | −0,04 | −0,35 | gagne | −1,45 | 53 % |
| `mug` × 1,2 | Les matières premières | −0,21 [−0,23 ; −0,20] | −0,03 | −0,56 | gagne | −1,52 | 55 % |

  R3\* tient comme la recherche : sa part du gain ne bouge presque pas (80 à 86 % en récession, 53 à 59 % face aux
  matières premières). Avec `phil` × 1,2, elle manque le seuil d'un cheveu : la borne de l'intervalle du chômage
  touche le gain de 0,2 sans le passer. La règle ne prévoit rien avec le modèle ; le risque était que ses
  coefficients, réglés sur ÉCO, ne vaillent plus ailleurs. Ils valent encore.

  Avec les deux autres poids (nuit du 16/11, `recherche.md` § 6 pour la recherche) :
  - **chômage d'abord** : rien ne bouge, R3\* prend 83 à 86 % du gain en récession (83 % sur ÉCO), 68 à 71 % face
    aux matières premières (70 %) ;
  - **dette d'abord, en récession** : R3\* fait encore mieux que R2s\*b sur les trois objectifs dans les quatre mondes,
    mais elle ne passe le seuil que dans `gammar` × 0,8. Ailleurs, son gain de chômage (0,14 à 0,22 point) n'est plus
    assez sûr. Dans `gammar`, la recherche perd ce qu'elle tirait du taux : R3\* fait alors aussi bien qu'elle (perte
    +0,25 [−0,06 ; 0,56]) ;
  - **dette d'abord, face aux matières premières** : R3\* passe le seuil dans `etan` et `mug`, comme sur ÉCO. Dans
    `gammar` et `phil`, R2s\*b n'est plus la barre ; contre R1, R3\* échange un point de chômage contre 7 points de
    dette, comme la recherche.

  Le résultat « R3 bat la règle de déficit sur les trois objectifs » (§ 4) tient donc face aux matières premières,
  mais il est fragile en récession.

## 6. Les bornes élargies (R3w)

R3w est R3 aux bornes élargies là où son optimum butait (`src/policy/tuning.js`) : `jobs` jusqu'à 6, `rise` jusqu'à
10, `patience` dès 0,01, `reference` de −2 à +2 ; `consolidation` et `smooth` gardent les leurs, une part au-delà de
1 ne voulant rien dire. Elle est réglée par l'escalade, au même budget (1 600 plans, cinq relances).

| Poids | Perte d'apprentissage, R3 → R3w | La règle R3w trouvée |
|---|---|---|
| équilibre | 108,96 → 108,96 | la même : `jobs` 2,5, `patience` 0,09, `reference` −0,46 |
| chômage d'abord | 179,35 → **178,44** | `jobs` 5,7, `reference` **−2** (borne), `smooth` **0,1** (borne), `consolidation` 1, `prices` 0,6 |
| dette d'abord | 244,18 → **243,58** | `jobs` 5,9, `rise` 0, `patience` **3** (borne), `reference` 1,9, `smooth` **0,1** (borne) |

- **Avec l'équilibre, rien ne change** : son optimum n'était pas tenu par les bornes.
- **Avec les deux autres poids, la règle change de forme** : elle vise une réponse deux fois plus forte, mais n'en
  fait qu'un dixième du chemin chaque trimestre. C'est une relance plus lente à venir et plus lente à partir.
  Elle bute de nouveau sur des bornes, cette fois `smooth` et `reference`. Ce sont probablement les bornes
  de vitesse des leviers (Q-S6) qui la tiennent : élargir encore déplacerait la borne, pas la leçon.
- **Sur la mesure, avec le chômage d'abord, R3w prend plus du gain de la recherche** : 96 % en récession (83 % pour
  R3), 87 % face aux matières premières (70 %), 84 % au calme (98 %). En récession, son pic de chômage (7,53 %)
  est celui de la recherche (7,52 %), pour 6,6 points de dette de plus.
- **Avec la dette d'abord, R3w perd ce que R3 avait gagné** : elle ne passe plus le seuil contre R2s\*b, car elle
  échange du chômage (+0,2 à +0,6 point) contre de la dette (−3 à −6 points), comme la recherche. Sa perte est
  pourtant meilleure, avec 91 % du gain de la recherche face aux matières premières (61 % pour R3). La perte des
  poids et le seuil ne disent pas la même chose : avec la dette d'abord, une règle qui bat la barre sur les trois
  objectifs reste R3 dans les bornes du § 1.
