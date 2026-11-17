# Les questions

Pour Sami, puis pour un professionnel du métier. Chacune porte une recommandation : sans réponse, c'est ce que le
modèle fera. Une réponse quitte cette liste et va, avec sa date, dans [`chiffres.md`](chiffres.md) ou dans le modèle.

## Pour Sami (posées le 6/11/2026)

| # | La question | La recommandation | Pourquoi |
|---|---|---|---|
| **Q-S3** | **Quel plus petit gain vaut qu'on l'adopte ?** | **0,2 point de chômage moyen, 0,2 point d'écart d'inflation, 2 points de dette**, sur au moins un objectif, sans perdre plus de 0,1, 0,1 et 1 point sur les autres (`modele.md`, § 8). | 0,2 point de chômage, ce sont 60 000 chômeurs de moins en moyenne sur dix ans (2,3 millions pour 7,4 % : une population active de 31 millions) ; moins, la série coûte des fils pour un écart que personne ne verrait. Les marges des autres objectifs empêchent d'acheter le chômage avec la dette. |
| **Q-S4** | **Quelle barre pour la recherche ?** | **La meilleure règle réglée, crise par crise** (R1\* ou R2s\*, réglées sur des graines d'apprentissage), et pas R0. | C'est la méthode des feux et de la cuisine : battre l'homme de paille ne dit rien. La règle réglée est aussi un résultat en soi : une politique qu'on peut écrire. Au J6, le taux suivant le Taylor du manuel, la barre est R1 ou R2s\*b ([`recherche.md`](../recherche.md), § 3). |
| **Q-S5** | **Que sait la recherche ?** | **Le modèle exact, l'état du trimestre, et qu'une crise est en cours** ; pas sa durée ni son ampleur à venir, tirées dans des futurs communs. Ensuite, un modèle aux paramètres décalés de ±20 %. | Avec la graine, elle tricherait. Avec le modèle exact seul, elle peut exploiter un défaut du modèle : le décalage est le garde-fou. Les données en retard d'un trimestre viendront comme un scénario. |
| **Q-S6** | **Les bornes et la vitesse des leviers** (`modele.md`, § 5) : le taux à ±0,5 point par trimestre, `G` à ±1 point de PIB, l'impôt à ±1 point… | **Ces bornes**, et un délai d'un trimestre sur les mesures budgétaires. | Sans bornes, la recherche fait des politiques qu'aucun Parlement ne voterait (les dépenses doublées pour un trimestre). La banque centrale bouge vite, l'État lentement : c'est une partie de ce qu'il faut comprendre. |
| **Q-S8** | **Le taux peut-il passer sous zéro ?** | **Un plancher à 0 au départ** ; un plancher négatif (la BCE est descendue sous zéro, à sourcer) en variante. | Le plancher est ce qui rend la politique budgétaire nécessaire en récession profonde : sans lui, la règle de Taylor suffirait toujours. C'est un mécanisme à faire voir. |
| **Q-S10** | **Qui interroger ?** Connais-tu un économiste qui modélise : à la Banque de France, au Trésor, à l'OFCE, à l'Insee, ou un enseignant de macroéconomie ? | **Un macroéconomiste qui a construit un modèle**, 45 minutes, en commençant par Q-P15, Q-P2 et Q-P6. Pas avant J3 : on lui montrera la page. | Il pourra regarder une crise sur la page et dire « ça ne se passe pas comme ça ». Un modélisateur stock-flux serait idéal ; un modélisateur DSGE dira ce que notre école oublie, ce qui vaut autant. |
| **Q-S12** (10/11) | **Jusqu'où une règle de Taylor peut-elle répondre ?** Réglée, elle bute sur la borne de 3 que j'ai posée : plus elle répond fort, mieux elle fait, le taux bougeant alors du demi-point maximal presque chaque trimestre ([`reglage.md`](../reglage.md), § 2). | **Garder la borne de 3** pour R1\* et R2s\*, des règles qu'une banque centrale pourrait annoncer. Sans objet pour J6, où le taux suit le Taylor du manuel ([`recherche.md`](../recherche.md), § 3) ; elle reviendra avec Q-S13. | Au-delà de 3, la perte baisse encore un peu (109,2 → 108,1 sur l'apprentissage, le manuel à 110,5). C'est la borne de vitesse du taux (Q-S6) qui fait alors la règle, plus ses coefficients. |
| **Q-S11** | **Les poids de la recherche.** Elle a besoin d'un nombre pour comparer deux plans. | **Trois jeux de poids** (le chômage d'abord, l'équilibre, la dette d'abord), qui tracent une frontière ; aucun n'est « le bon ». | Choisir les poids, c'est choisir une politique : c'est à toi, ou au lecteur de la page, pas à la recherche. La mesure, elle, garde les trois objectifs séparés. |

**Tranché par Sami** (le 6/11/2026, puis Q-S13 le 17/11), chaque fois selon la recommandation :

| # | La question | La décision | Pourquoi |
|---|---|---|---|
| **Q-S1** | **Quel État ?** La France telle quelle, dans la zone euro (pas de taux à elle, pas de change), ou un État fictif ? | **Un État fictif aux proportions de la France** (dette 113 %, dépense 57 %, chômage 7,4 %…), **avec sa propre banque centrale** et un **change fixe** au départ. La zone euro (un taux décidé ailleurs) devient un scénario, plus tard. | Tous les leviers que tu cites (taux, obligations) n'existent que pour un État qui a sa banque centrale. Fictif, on ne prétend pas prévoir la France ; aux proportions françaises, ce qu'on voit parle. Le change flottant ajoute une dynamique de plus : après J3. |
| **Q-S2** | **Le pas, les horizons, le départ.** | **Le trimestre ; 40 trimestres par crise, 160 pour le papy-boom.** Le départ, la France de 2024, **qui dérive** (5,8 % de déficit) ; un départ stationnaire pour les tests. | Le trimestre est le pas des comptes nationaux et des décisions de la banque centrale. Dix ans laissent voir la crise et ce qu'elle laisse ; le vieillissement se joue sur une génération. La dérive est la vraie question budgétaire de la France ; un départ stationnaire isole le choc. |
| **Q-S7** | **R ou Python sur la machine, une fois**, pour tirer les trajectoires de référence de `sfcr` (R) ou de MacroStat (Python), toutes deux sous MIT ? | **R et `sfcr`**, à J2 : on tire les CSV une fois, on les garde dans `tests/fixtures/` avec la version du paquet ; R ne sert plus ensuite. **Fait le 9/11** : R 4.6.2 et `sfcr` 0.2.3, pour le seul compte de Sami (`scripts/reference/sfcr.R`). | `sfcr` refait neuf chapitres du livre, MacroStat moins. Sans eux, on ne vérifie que SIM, à la main. Les tests restent en Node : R ne fait que produire les références. |
| **Q-S13** (10/11, tranchée le 17/11) | **Comment ÉCO doit-il faire payer un taux bas ?** | **Le change flottant** (J7, [`change-flottant.md`](../change-flottant.md)) : un taux bas fait baisser la monnaie, renchérit les importations et relance l'inflation. Le taux sera rendu à la recherche une fois le régime mesuré. | C'est le canal qui manque, et celui que les manuels donnent pour une économie ouverte. |
| **Q-S9** | **Quelles crises d'abord ?** | **Le chômage fort et le conflit sur les matières premières**, puis la pandémie, les entreprises parties, la spirale d'inflation, et le papy-boom en dernier. | Les deux premières couvrent les deux objectifs et le dilemme classique : un choc de demande, où chômage et inflation baissent ensemble, puis un choc d'offre, où ils s'opposent. Le papy-boom a son propre horizon et ses propres leviers (les retraites). |

**Ce que j'ai décidé sans te le demander :**
- SIM, puis PC, rejoués à l'identique avant d'écrire notre modèle ; chaque bloc d'ÉCO rejoué d'abord dans son modèle
  d'origine ;
- les deux matrices et l'équation cachée vérifiées à chaque trimestre, à 1e-9 près, dans le code et pas seulement dans
  les tests ;
- un ménage représentatif et une seule branche de production au départ ;
- une itération de Gauss-Seidel en ordre fixe pour les simultanéités d'ÉCO ;
- la cible d'inflation de 2 %, celle de la BCE ; le taux neutre de la règle de Taylor, celui du modèle ;
- R2n, la règle nominale des 3 %, gardée exprès comme homme de paille procyclique ;
- un flux de tirage par usage (la crise, le bruit, la recherche) ;
- (J3, 9/11) ÉCO sans actions, sans logement, sans dette des ménages, sans capitaux étrangers ; les obligations à
  leur valeur faciale, le coupon moyen suivant le taux long à mesure que la dette se renouvelle ; les hypothèses de
  calibration dans `src/eco/targets.js`, chacune avec sa question (les importations des achats publics et le
  plein emploi : Q-P1 et Q-P6) ;
- (J5, 10/11) la perte du réglage, linéaire, chaque objectif en unités de son plus petit gain (Q-S3) ; trois jeux de
  poids (Q-S11) ; les bornes des coefficients, 0 à 3 pour Taylor, 0 à 1 pour la vitesse de la règle de déficit (Q-S12) ;
- (J6, 10/11) la recherche sur les achats publics seuls, la banque centrale suivant le Taylor du manuel (ta décision
  du 10/11) ; six ans d'horizon, 16 futurs communs, 300 plans par décision, un à-coup de 0,05 par mouvement au
  carré ; un planificateur qui ignore la fin de la mesure ; la barre R1 ou R2s\*b, la vitesse de la règle de déficit
  seule réglée ([`recherche.md`](../recherche.md)) ;
- (J4, 9/11) le taux réel attendu dans les comportements, et une propension à consommer qui baisse quand il monte
  (le PCEX2 du livre) : sans eux, la règle de Taylor faisait pire que rien en récession (les ménages perdaient des
  intérêts) ; les fourchettes des crises (Q-P9) ; les règles budgétaires naïves, décidées une fois l'an ; R2 lu comme
  une baisse du déficit structurel de 0,5 point par an jusqu'à 1,5 % (Q-P14) ;
- (J3) deux corrections aux vignettes de `sfcr`, faute de quoi leurs matrices ne se ferment pas : DISINF (les
  intérêts au taux d'avant) et GROWTH (la ligne des profits de la banque centrale, la richesse initiale des ménages).

## Pour un professionnel

**Qui :** **M**, un macroéconomiste qui construit ou utilise un modèle (Banque de France, Trésor, OFCE, Insee, une
université) ; **F**, un spécialiste des finances publiques (Cour des comptes, Haut Conseil des finances publiques,
Fipeco) ; **B**, un économiste de banque centrale. Pas de donnée nominative. Modèle fictif : il ne prévoit rien.

**La recommandation** de chaque ligne est la valeur que garde le modèle sans réponse. « Pèse sur » dit ce qui change.

### Le modèle (à poser d'abord)

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P15** | Un modèle stock-flux cohérent, à anticipations adaptatives, est-il un bon outil pour comprendre ces crises ? Qu'est-ce qu'un modèle DSGE dirait autrement ? Que vérifieriez-vous en premier ? | M | **Le stock-flux**, parce qu'il se dessine et ne perd rien ; le parti pris est dit sur la page. | La confiance dans tout le reste. Si on ne pose qu'une question, celle-là. |
| **Q-P2** | Quelle pente de la courbe de Phillips en France aujourd'hui ? Les salaires sont-ils indexés sur l'inflation passée, et à quel délai ? | M, B | **Une pente faible** (à chiffrer), une indexation partielle sur l'inflation des quatre derniers trimestres. | L'inflation de tous les chocs, et le dilemme du choc d'offre. |
| **Q-P6** | Quel multiplicateur budgétaire viser, à un an, quand le chômage est haut et quand il est bas ? Et selon que le taux est au plancher ? | M | **1 à 2 au chômage haut ou au plancher, sous 1 au plein emploi** (Blanchard et Leigh 2013). | Ce que coûte l'austérité, ce que rapporte la relance. |
| **Q-P7** | Quel taux de chômage structurel (le NAIRU) pour la France ? | M | **7 %** (H, à sourcer) : un peu sous les 7,4 % de 2024. | Le chômage « normal », donc la cible implicite des règles. |
| **Q-P8** | Quel taux neutre réel pour la zone euro ? | B | **0,5 %** (H, à sourcer), pas les 2 % de Taylor (1993). | La règle de Taylor, et le temps passé au plancher. |

### La calibration

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P1** | Quelle part du PIB sont les importations, et quelle part de celles-ci sont l'énergie et les matières premières ? Avec quelle élasticité au prix ? | M | **Un tiers du PIB, dont un dixième d'énergie** (H), peu sensibles au prix à court terme. | Le choc des matières premières. |
| **Q-P3** | Combien l'investissement des entreprises répond-il au taux réel ? | M, B | **Faiblement à court terme, davantage à deux ans** (H). | La force de la politique monétaire. |
| **Q-P4** | En combien de trimestres une hausse du taux directeur pèse-t-elle sur l'activité, puis sur l'inflation ? | B | **2 à 6 trimestres** sur l'activité, plus sur l'inflation (H). | Ce que la règle de Taylor peut faire dans une crise courte. |
| **Q-P5** | Entre la décision d'une mesure budgétaire et son effet : combien de trimestres ? | F | **Un trimestre** pour les prestations, **deux** pour les achats publics et les impôts (H). | L'avantage de la banque centrale sur l'État. |
| **Q-P19** (17/11) | De combien le prix des importations, puis les prix à la consommation, suivent-ils un mouvement du change en France ? | B, M | **0,7 pour les importations**, celui du livre (H) ; la BCE la dit incomplète mais substantielle (Occasional Paper 241, 2020). | Ce que coûte un taux bas au change flottant (J7). |
| **Q-P20** (17/11) | Comment les non-résidents qui détiennent la dette de l'État (53,2 % fin 2023) réagissent-ils à l'écart de taux ? | B | **Les élasticités du livre** (ch. 12, H). | Combien le change bouge pour un point de taux (J7). |

### Les crises

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P9** | Pour chaque crise du modèle (`modele.md`, § 7), quel épisode prendre pour ancre, quelle ampleur et quelle durée ? 2008-2009 pour le chômage fort ? | M | **Les fourchettes du § 7**, à chiffrer : la chute de 2009, le choc de 2022, la pandémie de 2020. | Toutes les familles de crises. |
| **Q-P10** | Le chômage partiel de 2020 : quelle part du salaire, pour combien de salariés, à quel coût ? | F | **84 % du net** (H, à sourcer), au plus fort un tiers des salariés du privé (H). | Le levier de la pandémie. |
| **Q-P11** | Le bouclier tarifaire de 2022-2023 : combien a-t-il coûté, combien d'inflation a-t-il évité ? | F, M | **De l'ordre de 2 points d'inflation évités** (H, à sourcer). | Le levier du choc des matières premières. |
| **Q-P12** | Quand une entreprise étrangère part, que perd l'économie : les emplois, les exportations, les impôts, les fournisseurs ? En combien de temps ? | M | **Les emplois et les exportations en 4 trimestres**, les fournisseurs ensuite (H). | La crise des entreprises parties. |

### Les règles

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P13** | Quelles règles simples les banques centrales et les ministères simulent-ils vraiment ? La règle de Taylor est-elle encore la référence ? | B, F | **Taylor et le solde structurel**, avec leurs variantes. | Les règles à battre. |
| **Q-P14** | Le règlement 2024/1263 se lit-il comme une règle qu'on peut simuler trimestre par trimestre ? Comment la France le suit-elle ? | F | **La trajectoire de dette et la marge de 1,5 point**, appliquées une fois par an. | R2. |
| **Q-P16** | Relire le [glossaire](glossaire.md) : les mots sont-ils ceux du métier ? | M, F | **Les mots du glossaire**, faute de mieux. | Les docs et la page. |

### À regarder ensemble (à partir de J3)

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P17** | En regardant une crise sur la page : qu'est-ce qui ne ressemble pas à une vraie économie ? | M | Une séance de 45 minutes, la page au ralenti. | Tout le modèle, et mieux qu'un chiffre. |
| **Q-P18** | Après J6 : les politiques de la recherche se reconnaissent-elles (une relance précoce, un resserrement progressif), ou exploitent-elles un défaut du modèle ? | M, B | Après J6. | La confiance dans la mesure de la recherche. |
