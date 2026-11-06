# Les chiffres et leurs sources

Recherche du 6/11/2026. Tout chiffre de [`../modele.md`](../modele.md) vient d'ici, ou y est écrit comme une
hypothèse. Une réponse d'un professionnel entre ici avec sa date, et sa question quitte [`questions.md`](questions.md).

**Le statut dit jusqu'où la source a été lue :**

| Statut | Ce qu'il veut dire |
|---|---|
| **L** | lu dans le texte de la source |
| **R** | lu par l'outil de lecture, qui en a rendu des citations et un résumé : à relire avant de décider |
| **E** | extrait d'un résultat de recherche seulement ; la page n'a pas été ouverte, ou a refusé la lecture |
| **C** | calculé ici à partir des chiffres ci-dessus |
| **H** | hypothèse, sans source : elle renvoie à une question de [`questions.md`](questions.md) |

**Ce qui a échoué le 6/11** : le texte de Taylor (1993) est un scan sans texte (le PDF de Stanford), le document de
travail de l'OCDE (Price, Dang et Botev 2015) a refusé la lecture (403), et la machine n'a ni R, ni Python, ni de quoi
lire un PDF en image. Le livre de Godley et Lavoie lui-même n'a pas été lu : ses modèles le sont, par deux paquets qui
les refont.

## 1. Les modèles de Godley et Lavoie

Wynne Godley et Marc Lavoie, *Monetary Economics: An Integrated Approach to Credit, Money, Income, Production and
Wealth*, Palgrave Macmillan, 2007 (MacroStat cite l'édition de 2006). Le livre n'a pas été lu ; ses modèles l'ont été,
dans deux paquets qui les refont.

### SIM (ch. 3)

Les onze équations, telles que les écrit le README de `sfcr` [[sfcr]] (statut **R**) :
`TXs = TXd`, `YD = W · Ns − TXs`, `Cd = α1 · YD + α2 · Hh₋₁`, `Hh = YD − Cd + Hh₋₁`, `Ns = Nd`, `Nd = Y / W`,
`Cs = Cd`, `Gs = Gd`, `Y = Cs + Gs`, `TXd = θ · W · Ns`, `Hs = Gd − TXd + Hs₋₁`.

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| G, W, α1, α2, θ | 20, 1, 0,6, 0,4, 0,2 | le README de `sfcr` ; les paramètres de MacroStat [[ms-sim]] | **R** |
| Revenu stationnaire | `Y* = G / θ` = 100 ; « total national income is 100 » | MacroStat, page SIM | **R** |
| G de 20 à 25 | « the steady state … would shift to Y* = 125 » (figure SIM.3) | MacroStat | **R** |
| G de 20 à 30, à la période 5 | Y imprimé : 100 (périodes 1 à 4), 119, 124, 128, 131, 134, 137 (périodes 5 à 10) | le README de `sfcr`, 60 périodes | **R** |
| La montée à G = 30, au détail | 119,2308 puis 123,9645 : `Y = (G + α2 · Hh₋₁) / (1 − α1 (1 − θ))`, avec `Hh = 80` à l'état stationnaire de départ | ici | **C** |

`Hh = 80` au départ : à l'état stationnaire, `C = YD = 0,8 × 100 = 80`, et `80 = 0,6 × 80 + 0,4 · Hh` (C).

### PC (ch. 4)

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| α1, α2, θ | 0,6, 0,4, 0,2 | MacroStat, paramètres de PC [[ms-pc]] | **R** |
| λ0, λ1, λ2 | 0,635, 5,0, 0,01 | MacroStat [[ms-pc]] | **R** |
| λ1 | 0,05 | une vignette du paquet `godley` (gamrot), vue dans un extrait ; la page a rendu 404 | **E** |
| r | 0,025 | la même vignette, extrait | **E** |
| G | 20 | **H** : celui de SIM | **H**, à vérifier contre `sfcr` au J2 |

**Les deux λ1 se contredisent** : 5 avec un taux écrit en fraction (0,025), 0,05 avec un taux en pourcentage (2,5) donnent
le même produit, 0,125. Laquelle est la convention du livre se tranche au J2, contre la trajectoire de `sfcr`.

L'équation du choix de portefeuille, `Bh = V · (λ0 + λ1 · r − λ2 · YD / V)`, vient de la même vignette (**E**). MacroStat
ne donne ni r ni G parmi les paramètres de PC : ce sont des entrées de scénario. Sa page des scénarios de PC est vide
(son titre dit « Scenarios SIM », une copie).

**L'effet d'une hausse du taux sur le revenu à long terme** : MacroStat ne l'a pas. Le cadrage le retrouve par le calcul
de l'état stationnaire (J2, **C** à venir).

### Les autres modèles, et le banc

| Paquet | Ce qu'il refait | Licence | Source | Statut |
|---|---|---|---|---|
| **`sfcr`** (R, CRAN), João Macalós | ch. 3 SIM, ch. 4 PC, ch. 5 LP, ch. 6 REG et OPEN, ch. 7 BMW, ch. 9 DIS et DISINF, ch. 10 INSOUT, ch. 11 GROWTH, ch. 12 OPEN avancé ; pas le ch. 8 | MIT, « Copyright (c) 2020 Joao Pedro Scalco Macalos » | [[sfcr-art]], [[sfcr-gh]] | **R** |
| **MacroStat** (Python), Karl Naumann-Woleske | GL06SIM, SIMEX, PC, PCEX, PCEX2, LP, LP2, LP3, INSOUT (les noms des dossiers) | MIT (la page du dépôt) | [[ms-gh]] | **R** |

`sfcr` dit s'appuyer sur les macros de Gennaro Zezza, qui refaisait les modèles du livre en EViews (**E**).

LP chez MacroStat (**R**) : « extends model PCEX by introducing long-term bonds, capital gains, and liquidity
preference » ; deux scénarios, une hausse des taux (le taux des bons de 3 à 4 %, le prix des obligations de 20 à 15) et
une baisse d'α1 de 0,1.

## 2. Les règles

### La règle de Taylor

John B. Taylor, « Discretion versus policy rules in practice », *Carnegie-Rochester Conference Series on Public
Policy* 39, 1993, p. 195-214, DOI 10.1016/0167-2231(93)90009-L. **Le texte n'a pas été lu** : le PDF de Stanford est
un scan sans couche de texte.

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| La règle | `r = p + 0,5 y + 0,5 (p − 2) + 2` : r le taux des fonds fédéraux, p l'inflation sur quatre trimestres, y l'écart du PIB réel à sa cible, en % | Bernanke 2015 (Brookings) [[bernanke]], la page de la Fed d'Atlanta [[atlanta]] | **E** |
| La cible d'inflation | 2 % ; l'inflation mesurée par le déflateur du PIB | les mêmes | **E** |
| Le taux réel neutre | 2 %, « about its historical average » | Bernanke 2015 | **E** |
| La variante | un coefficient de 1,0 sur l'écart de production (Taylor 1999) | Bernanke 2015 | **E** |

### La cible de la BCE

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| La cible | 2 % à moyen terme, symétrique : un écart au-dessus est aussi indésirable qu'un écart en dessous ; avant, « proche de, mais inférieure à 2 % » | communiqué de la BCE du 8/7/2021 [[bce]] ; Banque de France, bloc-notes 240 | **E** |
| L'indice | l'IPCH de la zone euro | idem | **E** |

### Les règles budgétaires européennes

Le règlement (UE) 2024/1263, en vigueur depuis avril 2024 (le Trésor), suit une trajectoire de dépense primaire
nette.

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| La sauvegarde de la dette | une baisse moyenne d'environ 1 point de PIB par an si la dette dépasse 90 %, 0,5 point entre 60 et 90 % | la page du Conseil [[conseil]] | **E** |
| La sauvegarde du déficit | une « marge de résilience structurelle commune de 1,5 % du PIB » sous les 3 % | l'article 8, sur un site juridique tiers (en allemand) | **E** : à relire sur EUR-Lex |
| La valeur de référence | 3 % de déficit, 60 % de dette (le traité) | idem | **E** |

## 3. La France, les ratios de départ (2024)

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| Dette au sens de Maastricht | 113,2 % du PIB (113,0 % en mars 2025, révisé en mai), après 109,8 % en 2023 | Insee Première 2054, mai 2025 [[insee-apu]] | **E** |
| Déficit public | 5,8 % du PIB (168,6 Md€) | idem | **E** |
| Dépense publique | 57,2 % du PIB | idem | **E** |
| Prélèvements obligatoires | 42,8 % du PIB | idem | **E** |
| Chômage au sens du BIT | 7,4 % en moyenne annuelle (7,4 % en 2023, 7,3 % en 2022), 2,3 millions de chômeurs ; 7,3 % au T4 2024 | Insee [[insee-chom]] | **E** |
| Taux d'épargne des ménages | 17,7 % en 2024 (Banque de France) ; 18,5 % au T4 2024 (Insee) ; autour de 14 % avant la pandémie | [[bdf-epargne]] ; Insee | **E** ; l'écart des deux n'est pas expliqué |
| Importations, en part du PIB | non trouvé | — | **H** (Q-P1) |

## 4. Les comportements à retrouver

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| Semi-élasticité du solde public à l'écart de production | **0,63 pour la France**, de 0,29 (Bulgarie) à 0,63, environ 0,5 en moyenne de l'UE | Mourre et Poissonnier, *Intereconomics* 54(4), 2019 [[mourre]] | **E** |
| Idem, la mise à jour des 28 pays | « fairly small » révisions ; le tableau par pays n'a pas été lu | Mourre, Poissonnier et Lausegger, European Economy DP 098, 2019 | **R** (le résumé) |
| Idem, OCDE | le tableau 10 de Price, Dang et Botev (2015, WP 1275) : non lu, 403 | [[ocde]] | — |
| Coefficient d'Okun | un intervalle à 95 % de −0,40 à −0,12 pour le « vrai » coefficient, sur 522 estimations | Tavéra, Perman et Stephan 2016, une méta-régression [[okun]] | **E** |
| Multiplicateur supposé avant la crise | « average multipliers around 0.5 » ; une note du FMI de 2009 : 0,3 à 0,5 pour les recettes, 0,3 à 1,8 pour la dépense | Blanchard et Leigh, FMI WP/13/1 [[bl]] | **R** (une conversion du PDF, pas le texte original) |
| L'erreur des prévisions | β = −1,095 (t = −4,29, R² = 0,50) en 2010-2011 : « for every additional percentage point of GDP of fiscal consolidation, GDP was about 1 percent lower than forecast » ; 26 pays européens ; β plus faible ensuite (−0,47, −0,36) | idem | **R** |
| Le multiplicateur réel | « substantially above 1 in the early years of the crisis » | idem | **R** |

La fourchette « 0,9 à 1,7 », souvent citée, n'a pas été trouvée dans le texte lu : on ne la reprend pas.

## 5. Les crises

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| PIB de la France en 2020 | −7,9 % en euros constants, « la plus importante [baisse] dans l'histoire des comptes nationaux » (1949) ; −8,3 % en première estimation (janvier 2021), environ −9 % en prévision (décembre 2020) | Insee Première 1860, mai 2021 [[insee-2020]] | **E** ; des millésimes plus récents peuvent différer |
| Inflation de la zone euro, pic | 10,6 % en octobre 2022 (10,7 % en estimation rapide) | Eurostat [[eurostat]] | **E** |
| IPCH de la France | 7,1 % en octobre 2022, 7,3 % en février 2023, 6,7 % en mars 2023 | Eurostat | **E** |
| L'énergie dans la zone euro | 13,7 % en février 2023 | Eurostat | **E** |
| Entreprises sous contrôle étranger | 18 800 entreprises, 2,3 millions d'emplois, 13 % de l'emploi marchand (2022), non-salariés et intérim compris | Insee Focus, novembre 2024 [[insee-etr]] | **E** |
| Leur emploi en crise | −11 % en 2009 | Insee | **E** |
| Rapport des 20-64 ans aux 65 ans et plus | 3,6 en 2009, 2,5 en 2025, 1,62 en 2070 (1,76 dans les projections d'avant) | COR, rapport de juin 2026, d'après un site tiers et la présentation du COR [[cor]] | **E** |
| Les hypothèses démographiques | Insee 2026 : fécondité 1,45 dès 2028, solde migratoire +150 000 par an ; Insee 2021 : 1,8 et +70 000 | idem | **E** |
| Dépenses de retraite | 14,1 % du PIB en 2025 et 15,3 % en 2070 (un site tiers) ; 13,9 à 14,5 % en 2070 (le COR de juin 2025) | idem | **E** ; les deux éditions se contredisent, à relire |

## 6. Les calculs de cadrage

| Calcul | Valeur | Statut |
|---|---|---|
| Un plan noté par la recherche | K × horizon = 16 × 12 = 192 trimestres | **C** |
| Le temps d'un trimestre d'ÉCO | quelques microsecondes, une cinquantaine d'équations | **H**, à mesurer au banc |
| Une graine pilotée par la recherche | 2 000 plans × 192 trimestres × 40 décisions ≈ 15 millions de trimestres : de l'ordre de la minute | **C** sur **H** |

## Les liens

- [[sfcr]] : https://cran.r-project.org/web/packages/sfcr/readme/README.html
- [[sfcr-art]] : https://joaomacalos.github.io/sfcr/articles/
- [[sfcr-gh]] : https://github.com/joaomacalos/sfcr
- [[ms-sim]] : https://macrostat.readthedocs.io/en/stable/models/GL06/GL06SIM.html
- [[ms-pc]] : https://macrostat.readthedocs.io/en/stable/models/GL06/GL06PC/parameters.html
- [[ms-gh]] : https://github.com/KarlNaumann/MacroStat
- [[bernanke]] : https://www.brookings.edu/articles/the-taylor-rule-a-benchmark-for-monetary-policy/
- [[atlanta]] : https://www.atlantafed.org/cqer/research/taylor-rule
- [[bce]] : https://www.ecb.europa.eu/press/pr/date/2021/html/ecb.pr210708~dc78cc4b0d.fr.html
- [[conseil]] : https://www.consilium.europa.eu/fr/policies/economic-governance-framework/
- [[insee-apu]] : https://www.insee.fr/fr/statistiques/8574492
- [[insee-chom]] : https://www.insee.fr/fr/statistiques/8376836
- [[bdf-epargne]] : https://www.banque-france.fr/fr/statistiques/epargne/epargne-des-menages-2024-q4
- [[mourre]] : https://www.intereconomics.eu/contents/year/2019/number/4/article/what-drives-the-responsiveness-of-the-budget-balance-to-the-business-cycle-in-eu-countries.html
- [[ocde]] : https://one.oecd.org/document/ECO/WKP(2015)93/en/pdf
- [[okun]] : https://strathprints.strath.ac.uk/56619/
- [[bl]] : https://www.imf.org/external/pubs/ft/wp/2013/wp1301.pdf
- [[insee-2020]] : https://www.insee.fr/fr/statistiques/5387891
- [[eurostat]] : https://ec.europa.eu/eurostat/documents/2995521/16324747/2-31032023-AP-FR.pdf/7d97c349-eb47-81a1-9f2d-a0a0aedeeb30
- [[insee-etr]] : https://www.insee.fr/fr/statistiques/8285656
- [[cor]] : https://www.cor-retraites.fr/sites/default/files/2026-06/Pr%C3%A9sentation_Pl%C3%A9ni%C3%A8re.pdf
