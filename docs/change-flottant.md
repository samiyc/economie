# J7, le change flottant (17/11/2026)

Sami a choisi cette piste le 17/11 (Q-S13) : ÉCO doit faire payer un taux bas. Au J6, la recherche collait le taux à 0
quand on le lui laissait, et la dette fondait par les intérêts sans inflation qui compte ([`recherche.md`](recherche.md),
§ 2). La nuit du 16/11 a montré aussi que, la banque centrale indépendante, c'est encore sur elle que la recherche
s'appuie le plus avec la dette d'abord (§ 6) : une hypothèse sur ce que rapporte un taux bas. Le canal qui manque est
celui que les manuels donnent pour une économie ouverte : un taux bas fait baisser la monnaie, renchérit les
importations et relance l'inflation, que la banque centrale doit alors combattre.

**En bref** :
- **le banc est fait** : OPEN FLEX, le modèle à change flottant de Godley et Lavoie (ch. 12), retrouve les trajectoires
  de `sfcr` à 8,6e-11 près (§ 1) ;
- **viennent ensuite** la greffe sur ÉCO (§ 2), puis la mesure : les règles et la recherche sur le change flottant, et
  le taux rendu à la recherche (§ 3).

## 1. Le banc : OPEN FLEX (fait le 17/11)

Deux pays, chacun ses ménages, ses entreprises, son État et sa banque centrale, qui commercent à des prix qui suivent
le change, et dont les ménages détiennent les bons de l'autre (`src/book/openflex.js`, 110 équations, celles de la
vignette de `sfcr`). La banque centrale du Royaume-Uni ne bouge plus ses réserves : le change est le prix qui fait
correspondre les bons américains que veulent ses ménages et ceux qui leur restent (12.89FL, 12.90G).

- **Gauss-Seidel ne le résout pas**, même le change fixé : les boucles entre prix, revenus et commerce divergent. La
  vignette le dit pour OPEN FIX, et `sfcr` résout par Broyden. Notre système a donc reçu la **méthode de Newton**,
  bloc par bloc, sur demande d'un modèle (`src/sfc/newton.js`, `solver: "newton"`) : ÉCO et les autres modèles gardent
  Gauss-Seidel, et leurs empreintes n'ont pas bougé. Une période d'OPEN FLEX prend de 0,04 à 0,16 ms, selon que Newton
  part près de la solution ou non (contre 6 µs pour un trimestre d'ÉCO).
- **L'état de départ de la vignette ne boucle pas** : arrondi à cinq chiffres, il laisse 0,007 de bons britanniques que
  personne ne détient, un écart que les intérêts propagent. Comme pour GROWTH, ses totaux sont recalculés depuis leurs
  parties, dans `sfcr` comme chez nous (`src/book/openflex-values.js`).
- **Une coquille de la vignette** : la valeur nette de la banque centrale britannique (`nwcb_uk`) convertit deux fois
  ses bons américains en livres (6e-6). L'équation reste telle quelle, pour la comparaison ; la matrice compte juste.
- **Le témoin** : 100 périodes depuis le départ, puis le troisième scénario de la vignette, un goût plus fort pour les
  bons américains (λ20 à 0,30, λ40 à 0,75). L'écart le plus grand à `sfcr` est de 8,6e-11 (`tests/book.test.js`).

## 2. La greffe sur ÉCO (à faire)

ÉCO a aujourd'hui un change fixe, et personne dehors ne détient sa dette (`modele.md`, § 3). Le change flottant
devient un régime de plus, le fixe restant celui des mesures de J4 à J6, qui se rejouent à l'identique. Ce qu'il ajoute,
bloc par bloc d'OPEN FLEX :
- **des non-résidents qui détiennent une part de la dette de l'État** : 53,2 % de la dette négociable fin 2023
  (Agence France Trésor, bulletin mensuel de juillet 2024 ; 72 % hors Banque de France). Leur demande suit l'écart entre
  notre taux et celui du reste du monde (12.68F), aux élasticités du livre (H, Q-P20) ;
- **le change qui équilibre cette demande** (12.89FL) ; la banque centrale ne tient plus de réserves de change ;
- **le prix des importations, et de l'énergie, qui suit le change** : 0,7 dans le livre (12.21). La transmission est
  « incomplète mais substantielle » dans la zone euro, plus forte après un grand mouvement (BCE, Occasional Paper 241,
  2020) ; 0,7 reste une hypothèse (H, Q-P19) ;
- **les exportations qui suivent le prix relatif**, comme aujourd'hui ;
- **un changement de change attendu nul**, comme dans la vignette (H) : des anticipations du change viendront en
  variante.

Ce que le régime doit retrouver, avant toute mesure : un taux plus bas fait baisser la monnaie, monter le prix des
importations, puis l'inflation, en quelques trimestres ; la balance courante est financée par les non-résidents ; les
deux matrices bouclent à chaque trimestre, et le départ reste celui de la France de 2024 (`modele.md`, § 4).

**Le risque** : si le bloc du change ne se résout pas par Gauss-Seidel dans ÉCO, Newton coûtera de l'ordre de vingt
fois plus cher par trimestre, et la recherche (300 plans par décision) autant. On cherchera d'abord un ordre des
équations qui converge, ou un Newton sur le seul change, avant de payer le Newton entier.

## 3. La mesure (à faire)

1. Les règles de J4 et R3, et la recherche de J6, sur le change flottant, la banque centrale toujours indépendante :
   ce qui change quand un taux bas coûte.
2. **Le taux rendu à la recherche** (la question de Q-S13) : le colle-t-elle encore à 0 ? Le taux neutre de Taylor
   réglé comme au J6 (R1n, R2sn), et la recherche sur les achats et le taux.
3. Les témoins : le modèle décalé, avec la transmission du change et l'élasticité de la demande étrangère parmi les
   hypothèses qui bougent ; la nuit du 16/11 refaite sur le change flottant.

La guerre commerciale entre deux États, l'ancien J7, devient J8 : elle partira des deux pays d'OPEN FLEX.
