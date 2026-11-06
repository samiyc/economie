# Le modèle de l'économie : le cadrage (6/11/2026)

L'économie d'un État en simulation : six secteurs (les ménages, les entreprises, les banques, l'État, la banque
centrale, le reste du monde), l'argent qui passe de l'un à l'autre chaque trimestre, et les leviers qui le règlent
(impôts, dépense, taux, obligations), face à des crises tirées par graine. On mesure trois choses, séparément : le
chômage, l'inflation, la dette. Ce document fixe ce qu'on va construire et comment on saura que ça marche. **Il n'y a
encore ni modèle ni recherche dans `src/`.**

**Un modèle pour comprendre, pas pour prévoir.** Il ne dira jamais ce que fera l'économie française l'an prochain. Il
doit montrer des mécanismes qu'on reconnaît (pourquoi l'austérité en pleine récession creuse la dette, pourquoi un
choc sur l'énergie oppose le chômage à l'inflation) et laisser une recherche essayer des politiques que les règles
simples ne trouvent pas.

Les chiffres viennent de [`recherche/chiffres.md`](recherche/chiffres.md), avec leurs sources et jusqu'où chacune a
été lue. Une valeur marquée **H** est une hypothèse, avec sa question dans
[`recherche/questions.md`](recherche/questions.md) : `Q-Sn` pour Sami, `Q-Pn` pour un professionnel. Les mots du
métier sont dans [`recherche/glossaire.md`](recherche/glossaire.md).

## 1. Ce que la recherche a déjà changé

Six constats, qui orientent la suite :

1. **Le banc existe, en code libre.** Les modèles de Godley et Lavoie (*Monetary Economics*, 2007) sont refaits,
   chapitre par chapitre, par deux paquets sous licence MIT : `sfcr` en R (Macalós, 2020 : SIM, PC, LP, REG et OPEN,
   BMW, DIS et DISINF, INSOUT, GROWTH, l'OPEN avancé du ch. 12) et MacroStat en Python (Naumann-Woleske : SIM, SIMEX,
   PC, PCEX, LP, INSOUT…). On peut donc rejouer leurs trajectoires à la décimale près, comme les moteurs CodinGame
   rejouaient le site (§ 8).
2. **SIM se vérifie à la main.** Avec G = 20, θ = 0,2, α1 = 0,6, α2 = 0,4, le revenu stationnaire vaut `G / θ = 100`,
   et passe à 125 quand G passe à 25. Le README de `sfcr` imprime la montée quand G passe à 30 : 100, 119, 124, 128,
   131, 134, 137. Ce sont nos premiers tests.
3. **Les stabilisateurs automatiques ont un chiffre.** Le solde public de la France perd **0,63 point de PIB** par
   point d'écart de production (Mourre et Poissonnier 2019 ; 0,5 en moyenne dans l'UE). C'est une cible de calibration
   (§ 4) : notre État, sans rien décider, doit réagir à peu près ainsi.
4. **Le multiplicateur budgétaire n'est pas petit en crise.** Blanchard et Leigh (FMI, 2013) : « for every additional
   percentage point of GDP of fiscal consolidation, GDP was about 1 percent lower than forecast » en 2010-2011, quand
   les prévisionnistes supposaient environ 0,5. Une règle de déficit stricte en récession doit donc coûter cher dans le
   modèle, ou le modèle est faux.
5. **La règle de Taylor fixe la barre monétaire**, en une ligne : `i = π + 0,5 (π − 2) + 0,5 y + 2` (Taylor 1993).
   La BCE vise **2 %**, de façon symétrique, depuis juillet 2021.
6. **Les règles budgétaires européennes sont devenues des règles de trajectoire** (règlement 2024/1263) : une baisse
   de la dette d'environ 1 point de PIB par an au-delà de 90 %, 0,5 point entre 60 et 90 %, et une marge de 1,5 point
   sous les 3 % de déficit. C'est une règle de déficit toute faite, à mesurer contre les autres.

## 2. Ce qui se passe

Un trimestre, c'est :
1. les leviers du trimestre sont fixés : par les règles automatiques, par une règle simple, ou par la recherche ;
2. chaque secteur décide de ses flux d'après ce qu'il sait (son revenu, sa richesse du trimestre d'avant, les prix) ;
3. le modèle résout ensemble les équations du trimestre : la production égale la demande, et chaque flux qui sort d'un
   secteur entre dans un autre ;
4. les stocks bougent : la monnaie, les bons, les obligations, les prêts, la dette, les réserves ;
5. on lit le chômage, l'inflation et la dette, et la page dessine les flux.

**Stock-flux cohérent** : chaque flux a un payeur et un receveur, chaque actif est la dette de quelqu'un. Deux matrices
le disent, et le code les vérifie à chaque trimestre :
- **la matrice des transactions** : une ligne par flux, une colonne par secteur. Chaque ligne et chaque colonne
  somment à zéro ;
- **la matrice des bilans** : une ligne par actif, une colonne par secteur. Chaque actif financier a sa contrepartie
  au passif d'un autre.

**L'équation cachée.** Une équation du système est redondante : elle découle des autres. Dans SIM, c'est « la
monnaie émise par l'État égale celle que détiennent les ménages ». Le code ne l'écrit pas, il la vérifie : si elle
tient à 1e-9 près, rien ne s'est perdu. C'est le test de Godley et Lavoie, et c'est le nôtre.

**Le temps.** Un pas d'un **trimestre** (H, Q-S2). Une crise se joue sur **40 trimestres** (10 ans) après un état
stationnaire de départ ; le vieillissement, sur **160** (40 ans). SIM et PC gardent la période abstraite du livre, avec
ses paramètres, le temps de les rejouer.

## 3. Les modèles, en trois marches

On ne construit pas l'économie d'un coup. Chaque marche est un modèle publié, rejoué à l'identique, puis le nôtre.

### M0 — SIM (Godley et Lavoie, ch. 3)

Trois secteurs : les ménages, les entreprises, l'État. Une seule monnaie, émise par l'État quand il dépense plus qu'il
ne lève. Onze équations (la notation de `sfcr`, un indice −1 pour le trimestre d'avant) :

| Équation | Ce qu'elle dit |
|---|---|
| `Cs = Cd`, `Gs = Gd`, `Ts = Td`, `Ns = Nd` | l'offre suit la demande : biens, impôts, travail |
| `YD = W · Ns − Ts` | le revenu disponible : les salaires moins les impôts |
| `Td = θ · W · Ns` | l'impôt, proportionnel aux salaires |
| `Cd = α1 · YD + α2 · Hh₋₁` | la consommation : une part du revenu, une part de la richesse d'avant |
| `Hs = Hs₋₁ + Gd − Td` | la monnaie émise : le déficit de l'État |
| `Hh = Hh₋₁ + YD − Cd` | la monnaie détenue : l'épargne des ménages |
| `Y = Cs + Gs`, `Nd = Y / W` | la production, et l'emploi qu'elle demande |

Les valeurs du livre : `G = 20`, `W = 1`, `α1 = 0,6`, `α2 = 0,4`, `θ = 0,2`. Le revenu du trimestre se résout d'un coup :
`Y = (G + α2 · Hh₋₁) / (1 − α1 (1 − θ))`.

**Ce qu'il montre** : un État qui dépense 20 et taxe 20 % finit avec un revenu de 100, quoi que pensent les ménages ;
les propensions à consommer ne règlent que la vitesse du chemin. Le déficit se referme seul, par l'impôt sur un revenu
qui monte. C'est le premier mécanisme que la page doit faire voir.

### M1 — PC (ch. 4) : la banque centrale, les bons et le taux

Quatre secteurs : la banque centrale arrive. L'État émet des bons ; les ménages partagent leur richesse entre monnaie
et bons, d'autant plus vers les bons que le taux est haut ; la banque centrale achète les bons que les ménages ne
veulent pas, et émet la monnaie en face. **Le taux des bons est le premier levier monétaire.**

| Équation | Ce qu'elle dit |
|---|---|
| `YD = Y − T + r₋₁ · Bh₋₁`, `T = θ (Y + r₋₁ · Bh₋₁)` | les intérêts entrent dans le revenu, et sont taxés |
| `V = V₋₁ + YD − C`, `C = α1 · YD + α2 · V₋₁` | la richesse, la consommation |
| `Bh / V = λ0 + λ1 · r − λ2 · YD / V`, `Hh = V − Bh` | le choix de portefeuille |
| `Bs = Bs₋₁ + G + r₋₁ · Bs₋₁ − T − r₋₁ · Bcb₋₁` | la dette de l'État ; les intérêts versés à la banque centrale lui reviennent |
| `Bcb = Bs − Bh`, `Hs = Hs₋₁ + Bcb − Bcb₋₁` | la banque centrale prend le reste |

Les valeurs : celles de SIM, plus `λ0 = 0,635`, `λ1 = 5`, `λ2 = 0,01` (MacroStat), et `r = 0,025` (lu dans un extrait seulement,
à vérifier contre `sfcr` au J2). L'équation cachée : `Hh = Hs`.

**Ce qu'il montre** : monter le taux freine d'abord, puis peut relever le revenu à long terme, parce que l'État verse
plus d'intérêts aux ménages. Le livre le discute ; on le retrouve par le calcul de l'état stationnaire (un test), avant
de le voir à la page.

### M2 — ÉCO : l'économie d'un État, au trimestre

Le nôtre. Il assemble des blocs des chapitres suivants, chacun rejoué d'abord dans son modèle d'origine (§ 8), puis
calibré sur les ordres de grandeur de la France (§ 4).

| Bloc | Ce qu'il ajoute | D'où |
|---|---|---|
| **Le travail** | une population active `L` ; l'emploi `N = Y / productivité` ; le chômage `u = 1 − N / L` ; le PIB potentiel et l'écart de production | H ; la loi d'Okun comme test (§ 4) |
| **Les prix et les salaires** | les salaires suivent l'inflation attendue et le chômage (une courbe de Phillips) ; les prix sont un taux de marge sur le coût unitaire (salaires et intrants importés) ; deux revendications en conflit, celle des salariés et celle des entreprises | DIS et DISINF (ch. 9), GROWTH (ch. 11) ; la pente est H (Q-P2) |
| **Les entreprises** | l'investissement, selon l'utilisation des capacités et le taux réel ; les profits, versés en dividendes aux ménages et au reste du monde | GROWTH (ch. 11) ; la part étrangère d'après l'emploi sous contrôle étranger, 13 % |
| **Les banques** | les prêts aux entreprises, les dépôts des ménages ; le taux des prêts suit le taux directeur, plus une marge | BMW (ch. 7), INSOUT (ch. 10) |
| **L'État** | les achats `G` ; les prestations chômage (une part du salaire, par chômeur) ; les retraites (un montant, par retraité) ; les impôts sur les revenus et la consommation ; les intérêts de sa dette ; des bons et des obligations | PC, LP (ch. 5) ; les ratios de la France (§ 4) |
| **La banque centrale** | le taux directeur ; l'achat des bons restants ; les réserves de change | PC, OPEN (ch. 6) |
| **Le reste du monde** | les exportations, selon sa demande et nos prix ; les importations, dont l'énergie et les matières premières à un prix qu'il fixe ; un change fixe au départ (H, Q-S1) | OPEN (ch. 6, ch. 12) |

**Les stabilisateurs automatiques sont dans la structure** : l'impôt proportionnel et les prestations chômage. Ils
jouent sans que personne décide, et c'est la règle R0 (§ 6).

**Ce qui reste hors du modèle au départ** : les marchés financiers et le prix des actifs (sauf les obligations, LP), le
logement, les inégalités entre ménages (un seul ménage représentatif), les secteurs de production (une seule branche),
la dette des ménages. Chacun peut revenir comme un bloc, si un professionnel dit qu'il change le classement des règles.

## 4. La calibration : ce qu'ÉCO doit retrouver

ÉCO n'est pas la France : c'est un État fictif aux proportions françaises (Q-S1). Son PIB du trimestre de départ vaut
100, si bien que tout flux se lit en points de PIB trimestriel. On règle les paramètres pour que l'état de départ
retrouve ces ratios (2024), et on le vérifie par des tests :

| Ratio de départ | Valeur | D'où |
|---|---|---|
| Dette publique | 113 % du PIB annuel | Insee, comptes 2024 (113,2 % après révision) |
| Déficit public | 5,8 % du PIB | Insee |
| Dépense publique | 57 % du PIB | Insee (57,2 %) |
| Prélèvements obligatoires | 43 % du PIB | Insee (42,8 %) |
| Chômage | 7,4 % de la population active | Insee, moyenne 2024 |
| Taux d'épargne des ménages | 18 % du revenu disponible | Banque de France 17,7 %, Insee 18,5 % au T4 |
| Retraites | 14 % du PIB | COR (14,1 % en 2025) |
| Emploi marchand sous contrôle étranger | 13 % | Insee, 2022 |
| Importations | un tiers du PIB, dont l'énergie : à trouver | **H** (Q-P1) |
| Inflation de départ | 2 % l'an | la cible de la BCE |

**L'état de départ n'est pas stationnaire** : un déficit de 5,8 % avec une dette de 113 % fait monter la dette. C'est
voulu, c'est la France ; mais une mesure doit alors comparer deux politiques à la même dérive. La variante
stationnaire (le déficit qui stabilise la dette) sert aux tests (Q-S2).

**Les comportements à retrouver**, en tests de calibration, chacun avec sa tolérance (H) :

| Test | La cible | Tolérance |
|---|---|---|
| Semi-élasticité du solde public à l'écart de production | 0,63 (France, Mourre et Poissonnier 2019) | 0,5 à 0,75 |
| Coefficient d'Okun (chômage contre croissance) | entre −0,40 et −0,12 (méta-analyse de Tavéra, Perman et Stephan 2016, 522 estimations) | dans l'intervalle |
| Multiplicateur d'une hausse de G, à un an, chômage haut | au-dessus de 1 (Blanchard et Leigh 2013) | 1 à 2 |
| Multiplicateur à un an, plein emploi | sous celui du chômage haut | le sens de l'écart |
| Le choc de 2022 sous R0 (§ 7) | un pic d'inflation de l'ordre de 7 à 10 % l'an (France 7,3 %, zone euro 10,6 %) | l'ordre de grandeur |
| La pandémie de 2020 sous R0 et le chômage partiel | une chute du PIB annuel de l'ordre de 8 % (Insee : −7,9 %) | 6 à 10 % |

Ce sont des ajustements, pas des preuves : un modèle à une branche retrouve un chiffre agrégé par plusieurs chemins. On
le dit chaque fois. Si deux cibles se contredisent, on garde les deux et on dit laquelle le modèle manque.

## 5. Les leviers

| Levier | Qui | Bornes | Vitesse par trimestre (H, Q-S6) | Délai d'effet (H, Q-P4, Q-P5) |
|---|---|---|---|---|
| Taux directeur | banque centrale | plancher à 0 (Q-S8) | ±0,5 point | immédiat sur les bons ; 2 à 6 trimestres sur l'activité, par le modèle |
| Achats publics `G` | État | ±5 points de PIB autour du départ | ±1 point de PIB | voté un trimestre, effectif le suivant |
| Taux d'impôt sur les revenus | État | ±10 points | ±1 point | un trimestre |
| Taux de remplacement des prestations chômage | État | 40 à 80 % | ±5 points | immédiat |
| Indexation des retraites | État | 0 à 100 % de l'inflation | une fois par an | l'année suivante |
| Le bouclier : une subvention sur le prix de l'énergie importée | État | 0 à 50 % | ±10 points | immédiat |
| Le chômage partiel : la part des salaires payée par l'État pour les emplois à l'arrêt | État | 0 à 84 % du salaire net (H, Q-P10) | libre | immédiat |
| La maturité de la dette : la part des obligations dans les émissions | État | 0 à 100 % | ±10 points | à l'émission (LP) |

Un levier qui change coûte : une règle ou une recherche nerveuse paie l'à-coup (H : une petite pénalité au carré de
la variation, dans le score de la recherche seulement, jamais dans la mesure).

## 6. Les règles simples à battre

On mesure d'abord des règles simples, sur les mêmes crises ; la recherche doit battre **la meilleure**, pas la plus
faible.

| Règle | Ce qu'elle fait | D'où |
|---|---|---|
| **R0 — les stabilisateurs seuls** | les leviers restent à leur valeur de départ ; seuls l'impôt proportionnel et les prestations chômage jouent | la structure du modèle |
| **R1 — Taylor** | R0, et le taux suit `i = r* + π + 0,5 (π − 2 %) + 0,5 y`, `y` l'écart de production, au plancher près | Taylor 1993 ; `r*` est le taux neutre du modèle, pas les 2 % américains (H, Q-P8) |
| **R2 — Taylor et la règle européenne** | R1, et `G` suit la trajectoire du règlement 2024/1263 : la dette baisse de 1 point par an au-delà de 90 % ; un déficit visé sous 3 % moins 1,5 point de marge | le règlement ; Q-P14 pour sa lecture |
| **R2s — Taylor et un solde structurel** | R1, et `G` vise un déficit structurel : le déficit corrigé de l'écart de production par la semi-élasticité (0,63) | la méthode de la Commission et de l'OCDE |
| **R2n — Taylor et un solde nominal** | R1, et `G` ferme chaque année l'écart du déficit nominal à 3 % | la règle des 3 % lue au pied de la lettre |

**R2n est l'homme de paille voulu.** Elle est procyclique : en récession, l'impôt baisse, le déficit monte, et elle
coupe la dépense au pire moment. Le modèle doit le montrer (c'est le constat 4) : si R2n bat R2s en récession, le
modèle ou la mesure a un défaut.

**Les règles sont réglées, pas tirées du chapeau** (J5) : leurs coefficients (les 0,5 de Taylor, la vitesse de la règle
de déficit) passent par l'escalade de la lib (`createClimb`), sur des **graines d'apprentissage**, jamais sur celles
de la mesure. On rapporte les deux : la règle des manuels, et la même règle réglée (R1\*, R2s\*). La recherche du § 9
doit battre la meilleure réglée.

## 7. Les crises

Chaque crise est une famille de scénarios. La graine tire son début (entre le 4e et le 8e trimestre), son ampleur et
sa durée, dans des fourchettes ancrées sur un épisode connu (H, Q-P9). Chaque mesure se fait par famille, comme les
niveaux de demande des feux.

| Crise | Ce qu'elle change dans le modèle | L'épisode d'ancrage | Le dilemme |
|---|---|---|---|
| **Le calme** | rien ; un bruit de demande AR(1) tiré par graine | — | une règle ne doit pas nuire quand il ne se passe rien |
| **Le chômage fort** | la confiance tombe : la propension à consommer et l'investissement baissent, les exportations aussi | 2008-2009 (Q-P9) | relancer, au prix de la dette |
| **Le conflit sur les matières premières** | le prix de l'énergie et des matières importées est multiplié par 1,5 à 3, de 4 à 12 trimestres | 2022 : 10,6 % d'inflation en zone euro en octobre, 7,3 % en France en février 2023 | le choc d'offre : monter les taux contre l'inflation creuse le chômage ; le bouclier coûte en dette |
| **Les entreprises rachetées ou parties** | rachetées : une plus grande part des profits part en dividendes au reste du monde ; parties : une part des capacités, des emplois et des exportations s'en va en quelques trimestres | l'emploi sous contrôle étranger, 13 % ; −11 % en 2009 (Insee) | retenir ou remplacer, et à quel prix |
| **L'inflation** | les salariés visent un salaire réel plus haut, ou les entreprises une marge plus haute : la spirale prix-salaires | 2022-2023 (Q-P2) | casser la spirale sans casser l'emploi |
| **La pandémie** | pendant 1 à 3 trimestres, une part de la production est impossible et la consommation est forcée vers le bas ; puis le rebond | 2020 : −7,9 % de PIB (Insee) | soutenir les revenus (chômage partiel) sans emballer la dette ni l'inflation du rebond |
| **Le papy-boom** | le rapport actifs sur retraités passe de 2,5 à 1,6 en 40 ans ; la population active baisse, les retraites montent | COR 2026 : 2,5 en 2025, 1,62 en 2070 | qui paie : les actifs, les retraités ou la dette ; sur 160 trimestres |

**Les tirages** : un flux par usage, `streamOf(graine, k)` de la lib : un pour la crise, un pour le bruit de demande, un
pour la recherche. Deux règles comparées sur une graine voient la même crise, au même trimestre, avec le même bruit.

**Deux crises à la fois**, plus tard : un conflit sur l'énergie pendant une récession, une pandémie sur une dette déjà
haute. C'est là que les règles simples, faites pour un choc à la fois, devraient le plus céder.

## 8. Les mesures

**Ce qu'on mesure, sur une graine** (une crise, 40 trimestres) :

| Objectif | La mesure | Pourquoi |
|---|---|---|
| **Le chômage** | sa moyenne sur l'horizon, et son pic | la moyenne dit le coût total, le pic la douleur |
| **L'inflation** | l'écart absolu moyen à 2 % l'an, et le pic | la cible est symétrique : trop bas compte comme trop haut |
| **La dette** | la dette publique sur PIB à la fin de l'horizon, et sa hausse | ce que la crise laisse aux suivants |
| À côté | le PIB perdu, la part des trimestres sous le plancher du taux, les variations des leviers | qu'aucune règle ne gagne par un détour |

**Jamais un score unique pour décider.** La recherche a besoin d'un nombre pour comparer deux plans (§ 9) ; la mesure,
elle, rapporte les trois objectifs séparément, chacun par paires.

**La paire.** Une graine donne une crise. Deux politiques la jouent. `paired(chômageA, chômageB)` rend l'écart moyen,
son intervalle à 95 %, et les graines gagnées, nulles, perdues ; de même pour l'inflation et la dette.

**Le seuil d'adoption** (H, Q-S3). Une politique B remplace A si :
- sur **au moins un** objectif, l'intervalle de l'écart est entièrement du bon côté, au-delà du plus petit gain qui
  vaille : **0,2 point de chômage moyen**, **0,2 point d'écart d'inflation**, **2 points de dette** ;
- sur **chacun des autres**, la borne défavorable de l'intervalle reste dans une marge de non-infériorité : 0,1 point
  de chômage, 0,1 point d'inflation, 1 point de dette.

Un gain sur le chômage acheté par 5 points de dette n'est pas un gain : c'est un autre choix sur la frontière, et la
page le montre comme tel.

**La frontière.** La recherche joue avec plusieurs jeux de poids (§ 9). Chacun donne un point (chômage, inflation,
dette) par famille de crises. Les règles simples sont des points aussi. On rapporte quels points des règles sont
dominés, c'est-à-dire battus sur les trois objectifs à la fois, avec les intervalles.

**Combien de graines.** On ne le sait pas avant d'avoir mesuré l'écart-type d'une paire : le premier témoin A/A le
donne, puis `n ≈ (1,96 · σ / δ)²` par objectif. `sprt` arrête une série tranchée, objectif par objectif ; elle se
rapporte toujours avec `paired`. Un écrémage rapide rejette, il ne promeut jamais.

**Les témoins** :
- **A/A exact** : la même politique deux fois sur la même graine donne la même trajectoire, à l'octet ;
- **la cohérence** : à chaque trimestre, les matrices somment à zéro et l'équation cachée tient, à 1e-9 près
  (relatif) ;
- **A/A statistique** : une règle contre elle-même, bruit de demande décalé : l'intervalle contient 0 ;
- **plus de budget** : une recherche à 4 fois son budget doit battre sa version courante ;
- **le modèle juste** : la recherche planifie d'abord sur le modèle exact qu'elle pilote ; puis sur un modèle aux
  paramètres décalés (H : ±20 % sur les propensions et la pente de Phillips). Un gain qui ne survit pas au décalage
  exploite le modèle, pas l'économie.

**Sans horloge.** Une mesure fixe un budget de plans notés, jamais une échéance. Le temps se mesure au banc.

### Se rejouer contre le banc public

| Test | La référence | Tolérance (H) |
|---|---|---|
| SIM, état stationnaire | `Y* = G / θ = 100`, puis 125 à `G = 25` (MacroStat, figure SIM.3) | 1e-9 |
| SIM, la montée à `G = 30` | 119,23, 123,96… : `(30 + 0,4 · 80) / 0,52`, puis la suite ; le README de `sfcr` imprime 119, 124, 128, 131, 134, 137 | 1e-9 sur nos calculs, l'arrondi sur l'imprimé |
| SIM, la consommation accrue (SIMEX) | la trajectoire de `sfcr` | 1e-6 |
| PC, l'état stationnaire, et la hausse du taux | le calcul de l'état stationnaire ; la trajectoire de `sfcr` | 1e-6 |
| LP, OPEN, BMW, DISINF, GROWTH | chaque bloc d'ÉCO, rejoué d'abord dans son modèle d'origine | 1e-6 |

**Les trajectoires de référence** viennent de `sfcr` (ou de MacroStat), tirées une fois et gardées en CSV dans
`tests/fixtures/`, avec la version du paquet. Cela demande R ou Python une fois sur la machine (Q-S7) ; d'ici là, les
valeurs calculées à la main et celles qu'imprime le README.

**Se comparer à la littérature, sur les politiques.** Il n'y a pas de banc public de « politiques contre crises » comme
RESCO pour les feux. On compare donc des tendances, pas des chiffres : la règle de Taylor stabilise mieux que rien face
à un choc de demande ; une règle nominale de déficit est procyclique ; un multiplicateur plus fort en crise. Un résultat
de la recherche n'est montré qu'une fois ces tendances retrouvées.

## 9. La recherche, plus tard

**Rien n'est écrit, rien n'est choisi.** Ce qui suit dit l'ordre des essais, une fois les règles mesurées.

**Le pilotage à horizon glissant** (la commande prédictive) :
- **le plan** : les leviers sur les 8 à 12 trimestres à venir (H), soit 3 leviers × 12 trimestres = 36 nombres ;
- **l'escalade** (`createClimb`) le cherche ; `shift` reprend le plan du trimestre d'avant, décalé d'un trimestre ;
- **on joue le premier trimestre du plan**, on avance, on recommence ;
- **le score d'un plan** : la perte moyenne sur K futurs tirés (H : K = 16), une perte pondérée, au carré, du chômage
  au-dessus de son niveau structurel, de l'écart d'inflation et de la hausse de la dette, plus l'à-coup des leviers ;
- **les futurs** : ce que le planificateur ne sait pas, la suite de la crise (sa durée, son ampleur restante) et le
  bruit, tirés de leur loi, comme les mondes de l'ISMCTS. Ils sont **communs** à tous les plans d'une décision : deux
  plans se comparent sur les mêmes futurs ;
- **ce qu'il sait** (H, Q-S5) : le modèle exact, l'état du trimestre, et qu'une crise est en cours. Pas la graine.

**L'ordre des essais** :
1. **le témoin** : la meilleure règle réglée (J5) ;
2. **l'escalade** sur le plan, à plusieurs jeux de poids : la frontière (§ 8) ;
3. **le faisceau** (`createBeam`), sur des leviers discrets (le taux par pas de 0,25 point, `G` par pas de 0,5 point) :
   la même question, l'autre recherche de la lib, mesurée contre l'escalade ;
4. **le réglage des règles sur un jeu de crises** : la recherche hors ligne de la meilleure règle simple, qui tient sur
   toutes les familles à la fois. C'est peut-être là le résultat le plus utile : une règle qu'on peut écrire.

**MCTS ne revient qu'à deux États** (J7) : une guerre commerciale entre deux pays du modèle OPEN (ch. 6, deux pays,
chacun ses leviers et ses droits de douane), où chacun répond à l'autre. C'est un jeu, et l'ISMCTS de la lib est fait
pour cela.

**Les écueils** :
- **la recherche exploite le modèle** : d'où le témoin du modèle décalé (§ 8) ;
- **elle optimise ce qu'on lui donne** : avec des poids, elle trouve un compromis, pas « la » politique. D'où la
  frontière, et les objectifs rapportés séparément ;
- **le coût** : un trimestre d'ÉCO résout une cinquantaine d'équations (H : quelques microsecondes). Un plan noté, c'est
  K × 12 = 192 trimestres ; 2 000 plans par décision, 40 décisions par graine : de l'ordre de la minute par graine
  (C, à mesurer au banc). Les séries passent par la file, en jobs d'un fil, avec `progress`.

## 10. Ce qu'on prend de la lib, et ce qu'on ajoute

| Module | Pour quoi |
|---|---|
| `random` (`createRng`, `streamOf`) | un flux pour la crise, un pour le bruit, un pour la recherche (§ 7) |
| `climb` (`createClimb`) | le plan des leviers à horizon glissant (§ 9) ; le réglage des coefficients des règles (§ 6) |
| `beam` (`createBeam`) | le plan sur des leviers discrets, contre l'escalade (§ 9) |
| `measure` (`paired`, `sprt`, `wilson`) | les paires par objectif, l'arrêt des séries, la part des graines au-delà d'un seuil (le chômage au-dessus de 10 %, par exemple) |
| `trace` (`progress`) | l'avancement des jobs |
| `replay-keys`, `web/theme.css` | le lecteur de la page (un pas d'un trimestre, un grand pas d'un an), l'allure commune |
| `mcts` (`search`) | seulement à J7, la guerre commerciale |

**Ce qu'on ajoute** : le moteur des modèles (les équations d'un trimestre, leur résolution, les deux matrices et leur
vérification), SIM, PC puis ÉCO, les crises, les règles, la mesure d'une graine, la page et son diagramme de Sankey.

**La résolution.** SIM et PC se résolvent dans un ordre explicite (le revenu d'abord, puis le reste). ÉCO a des
simultanéités (les prix et les salaires, le revenu et l'impôt) : une itération de Gauss-Seidel en ordre fixe, jusqu'à
1e-12, avec un plafond d'itérations compté dans la trace. Le même ordre donne le même résultat à l'octet, ce que
l'empreinte vérifie.

**Le chemin chaud n'alloue rien** : l'état d'un trimestre dans un `Float64Array` réservé une fois, les variables à des
indices fixes, les futurs de la recherche copiés dans des tampons (`pool` si le besoin se montre).

## 11. La page

`npm run page`, port 4807, `theme.css` en premier, le sépia Khaki que Sami préfère.
- **Le diagramme de Sankey** du trimestre : les six secteurs, chaque flux de la matrice des transactions en ruban, sa
  largeur en points de PIB. Le lecteur l'anime trimestre par trimestre.
- **Les deux matrices**, transactions et bilans, avec leurs sommes à zéro.
- **Les courbes** : chômage, inflation, dette, PIB, et les leviers.
- **Les choix** : le modèle (SIM, PC, ÉCO), la crise, la graine, la politique ; deux politiques côte à côte sur la même
  graine.
- **SIM d'abord** : un curseur sur G et θ, et l'on voit le revenu aller vers `G / θ`. C'est la première leçon.

## 12. Les jalons

| Jalon | Ce qu'il livre | Il est fini quand |
|---|---|---|
| **J1** | SIM : les équations, la résolution, les deux matrices, la page et son Sankey | les tests de SIM passent (§ 8) ; la première empreinte ; le changelog |
| **J2** | PC : les bons, la banque centrale, le taux ; SIMEX et PCEX en tests | l'état stationnaire calculé et les trajectoires de `sfcr` retrouvés |
| **J3** | ÉCO au trimestre : le travail, les prix, les entreprises, les banques, le reste du monde ; chaque bloc rejoué dans son modèle d'origine | les ratios de départ et les tests de calibration du § 4 |
| **J4** | les règles R0 à R2n ; les crises, d'abord le chômage fort et les matières premières (Q-S9) | les paires des règles par famille, avec leurs intervalles ; R2n perd contre R2s en récession |
| **J5** | le réglage des règles sur les graines d'apprentissage | R1\* et R2s\* mesurées contre les règles des manuels |
| **J6** | la recherche à horizon glissant : l'escalade, puis le faisceau ; le banc (`npm run bench`) | elle bat la meilleure règle réglée selon le seuil du § 8, ou on sait pourquoi pas ; le témoin du modèle décalé |
| **J7** | deux États, la guerre commerciale, l'ISMCTS | à cadrer à son tour |

Les empreintes, le changelog et le banc arrivent avec leur jalon, comme le dit `CLAUDE.md`.

## 13. Les risques

- **Un modèle qui dit ce qu'on y a mis.** Un modèle à une branche et un ménage peut retrouver chaque ratio et se tromper
  sur les mécanismes. Les tests de comportement du § 4 (la semi-élasticité, Okun, le multiplicateur) valent plus que
  les ratios, et un professionnel doit les relire (Q-P15).
- **La recherche contre son propre modèle.** Elle connaît le modèle exact : elle peut exploiter un défaut. Le témoin du
  modèle décalé est le garde-fou.
- **Un homme de paille.** Battre R0 ne dit rien ; d'où R2s, les règles réglées, et la barre de la meilleure.
- **Une moyenne qui cache le pire** : d'où les pics, rapportés chaque fois.
- **Un parti pris d'école.** Les modèles stock-flux viennent de la tradition post-keynésienne ; les banques centrales
  travaillent surtout avec des modèles DSGE, où les anticipations sont rationnelles. Nos conclusions sont celles d'un
  modèle à anticipations adaptatives, et la page le dit (Q-P15).
