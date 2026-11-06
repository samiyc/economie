# Le prompt de recherche métier

À coller dans une session de recherche, Claude ou autre, quand Sami veut compléter [`chiffres.md`](chiffres.md). La
recherche du 6/11/2026 a déjà trouvé les paramètres de SIM et de PC (par `sfcr` et MacroStat), la règle de Taylor (par
des sources secondaires), la cible de la BCE, les sauvegardes du règlement 2024/1263, les comptes publics 2024 de
l'Insee, la semi-élasticité de Mourre et Poissonnier, la méta-analyse d'Okun, Blanchard et Leigh, et les ordres de
grandeur de 2020, de 2022 et du vieillissement. Ce prompt vise ce qu'elle n'a pas trouvé ou pas lu dans le texte, dans
l'ordre où cela pèse sur le modèle.

```text
Je construis une simulation d'économie nationale, stock-flux cohérente (Godley et Lavoie, Monetary Economics, 2007) :
six secteurs (ménages, entreprises, banques, État, banque centrale, reste du monde), un pas trimestriel, un État fictif
aux proportions de la France de 2024 (dette 113 % du PIB, dépense publique 57 %, chômage 7,4 %), avec sa banque
centrale et un change fixe. Des crises tirées au hasard (récession, choc sur l'énergie, pandémie, départ d'entreprises,
spirale d'inflation, vieillissement), et des politiques comparées : stabilisateurs automatiques, règle de Taylor,
règles de déficit, puis une recherche à horizon glissant. On mesure le chômage, l'inflation et la dette séparément.

J'ai déjà : les paramètres des modèles SIM et PC (paquets sfcr et MacroStat), la règle de Taylor (1993) par Bernanke
(2015), la cible symétrique de 2 % de la BCE (2021), les sauvegardes du règlement (UE) 2024/1263 par la page du
Conseil, les comptes publics 2024 de l'Insee, la semi-élasticité du solde de la France (0,63, Mourre et Poissonnier,
Intereconomics 2019), la méta-analyse d'Okun de Tavéra, Perman et Stephan (2016), Blanchard et Leigh (FMI WP/13/1).
Ne refais pas ce travail.

Cherche des sources publiées, en priorité des statistiques officielles (Insee, Banque de France, Eurostat, BCE),
des rapports d'institutions (Trésor, Cour des comptes, HCFP, COR, OFCE, Commission européenne, OCDE, FMI) et des
articles de recherche, en français et en anglais.

Par ordre de priorité :

1. Les importations de la France en part du PIB (2023-2024), la part de l'énergie et des matières premières dans les
   importations, et l'élasticité-prix des importations d'énergie à court terme.
2. La courbe de Phillips en France ou en zone euro : la pente estimée récemment (Banque de France, BCE), le degré
   d'indexation des salaires sur l'inflation passée et son délai.
3. Le chômage structurel (NAIRU) de la France selon la Commission, l'OCDE, le Trésor ou la Banque de France, et le taux
   neutre réel de la zone euro (estimations de la BCE, Holston-Laubach-Williams).
4. Les délais de transmission de la politique monétaire dans la zone euro : en combien de trimestres une hausse du taux
   pèse sur le PIB, puis sur l'inflation (les modèles de l'Eurosystème).
5. Les multiplicateurs budgétaires selon l'état de l'économie (chômage haut ou bas, taux au plancher) : Auerbach et
   Gorodnichenko, Ramey, et les estimations pour la France (le modèle Mésange du Trésor et de l'Insee).
6. Le chômage partiel de 2020 en France : la part du salaire indemnisée, le nombre de salariés au plus fort, le coût ;
   le bouclier tarifaire de 2022-2023 : son coût et l'inflation évitée (Insee, Cour des comptes).
7. La récession de 2008-2009 en France : la chute du PIB, la hausse du chômage, le déficit et la dette, trimestre par
   trimestre, pour ancrer la crise du chômage fort.
8. Le texte du règlement (UE) 2024/1263 sur EUR-Lex : l'article 8 (la marge de résilience de 1,5 %), l'article 7 (la
   sauvegarde de la dette), et comment la trajectoire de dépense nette se calcule.
9. Le tableau des semi-élasticités du solde budgétaire par pays : Price, Dang et Botev (OCDE, WP 1275, 2015, tableau 10)
   et Mourre, Poissonnier et Lausegger (European Economy DP 098, 2019).
10. Les paramètres du modèle PC dans le livre de Godley et Lavoie (ch. 4) : la valeur de λ1 (5 ou 0,05, selon que le
    taux est en fraction ou en pourcentage), le taux de départ, la dépense G ; et le résultat de la hausse du taux
    (de 2,5 à 3,5 %) sur le revenu à long terme.
11. Les modèles stock-flux appliqués à la France ou à l'Europe (l'AFD, l'OFCE, des universités), pour comparer nos
    ordres de grandeur.

Les règles :
- Chaque chiffre a sa source : auteurs ou organisme, année, titre, lien. Dis si tu as lu le texte, ou seulement un
  résumé ou un extrait.
- Pour une statistique, donne le millésime (les comptes nationaux sont révisés) et l'unité.
- Pour un texte réglementaire, donne l'article et la date de la version lue.
- Un blog ou un site d'actualité peut donner une piste, pas un chiffre de référence.
- Si deux sources se contredisent, garde les deux et explique l'écart.
- Si tu ne trouves rien, dis-le : n'invente pas et n'extrapole pas sans le dire. Un chiffre introuvable ira à un
  professionnel, c'est utile de le savoir.

Le format : pour chaque sujet, un tableau chiffre, valeur, millésime, source, ce qui a été lu. Puis ce qui reste
introuvable.
```

**Après la recherche.** Chaque chiffre va dans [`chiffres.md`](chiffres.md) avec son statut. Une réponse sourcée retire
sa question de [`questions.md`](questions.md). Si elle change une valeur du modèle après J1, c'est un changement de
modèle : une empreinte mise à jour, avec les mesures avant et après dans le commit.
