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
- **la greffe sur ÉCO est faite** : 53,2 % de la dette aux étrangers, un change qui les équilibre, des anticipations
  régressives ; une baisse d'un point fait perdre 6 % à la monnaie et ajoute 1,5 point d'inflation en un an, quand
  le change fixe n'en ajoute presque pas. Gauss-Seidel le résout, 6 µs le trimestre (§ 2) ;
- **vient ensuite** la mesure : les règles et la recherche sur le change flottant, et le taux rendu à la recherche (§ 3).

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

## 2. La greffe sur ÉCO (faite le 17/11)

ÉCO a désormais deux régimes (`src/eco/floating.js`, le modèle `ECOFLEX`). Le change fixe reste celui des mesures de J4
à J6 : ses équations n'ont pas changé, son empreinte non plus. Le flottant réécrit neuf équations du fixe et ajoute le
reste du monde, bloc par bloc d'OPEN FLEX :
- **les non-résidents détiennent 53,2 % de la dette** (Agence France Trésor, fin 2023, Sami le 17/11), en obligations ;
  les ménages gardent le reste. Leurs coupons sortent par la balance courante : le départ la garde à son niveau de 2024
  (0,4 % du PIB) par les revenus que les entreprises tirent de l'étranger, recalibrés ; le départ a les mêmes
  proportions qu'au change fixe ;
- **les non-résidents prennent les obligations que leur laisse la balance courante**, la banque centrale ne touchant
  plus à ses réserves, et **le change est le prix qui les leur fait vouloir** (12.89FL). Leur demande suit l'écart entre
  notre taux long et celui du monde, et la remontée de notre monnaie qu'ils attendent (12.68F) ;
- **des anticipations régressives**, qui n'étaient pas au programme : les étrangers attendent que le change réel revienne
  vers son départ, l'écart refermé en huit ans (H, Q-P20). Avec le changement attendu nul du livre, rien ne ramenait le
  change : chaque déficit courant laissait des obligations de plus aux étrangers, et la crise des matières premières
  faisait perdre jusqu'à 24 % à la monnaie sous R1 (l'euro a perdu 15 % contre le dollar en 2022). Le change résout
  alors une équation du second degré, écrite telle quelle : itérée, sa boucle divergeait ;
- **la sensibilité de cette demande** est réglée sur le seul chiffre trouvé : 5 % de hausse de l'euro pour 70 points de
  base dans NiGEM (Banque de France, 2017). Une baisse d'un point fait ici perdre 6 % à la monnaie d'un coup (H, Q-P20) ;
- **le prix des importations suit le change à 0,3**, la transmission en un an dans la zone euro depuis 2008 (BCE,
  Bulletin économique 3/2020 ; 0,7 dans le livre) ; l'énergie, payée en dollars, le suit en entier (Q-P19). Les prix à
  la consommation suivent de 0,15 à 0,2 ;
- **les échanges répondent aux prix** : les exportations au change réel, comme dans le livre (12.20), et non plus au prix
  des importations ; les importations perdent en volume 0,7 fois leur renchérissement relatif (12.19, H, Q-P1). Sans
  cela, une baisse du change creusait le déficit d'où elle venait (la condition de Marshall-Lerner), et le change
  baissait sans fin.

Ce que le régime donne, la politique figée sauf mention (`tests/ecoflex.test.js`) :

| | Change fixe | Change flottant |
|---|---|---|
| La monnaie, un an puis dix ans après le départ | stable | à 0,1 % près, puis −1 % (le déficit érode la balance courante) |
| Un point de taux en moins : la monnaie, d'un coup | stable | −6 % |
| … l'inflation un an après | +0,04 point | +1,5 point |
| … le PIB au plus haut | +1,0 % | +2,4 %, les exportations s'ajoutant |
| Un trimestre (`scripts/search-bench.js` à refaire) | 2,4 µs | 6 µs |

- **Gauss-Seidel le résout**, sans Newton. Il a fallu sortir la balance courante du cycle : petite différence de grands
  flux, son bruit d'arrondi frôlait la tolérance (1e-14), et le trimestre ne se résolvait plus quand la crise durait.
  Les obligations des étrangers s'écrivent depuis les flux eux-mêmes. Newton, essayé, coûtait 0,36 ms le trimestre.
- **R0 n'a plus d'ancre** : la banque centrale figée, rien ne tient les prix quand le change baisse, et la monnaie glisse
  tant que dure un choc permanent (le choc de 2022 du test d'ÉCO : −23 % en neuf ans, l'inflation au plus fort à 13,6 % contre 9,5 % au fixe).
  Taylor (R1) tient : sur la famille des matières premières, l'écart d'inflation à la cible est de 2,4 points au
  flottant contre 2,3 au fixe, la monnaie perdant 18 % au plus (moyenne de 30 graines).

## 3. La mesure (à faire)

1. Les règles de J4 et R3, et la recherche de J6, sur le change flottant, la banque centrale toujours indépendante :
   ce qui change quand un taux bas coûte.
2. **Le taux rendu à la recherche** (la question de Q-S13) : le colle-t-elle encore à 0 ? Le taux neutre de Taylor
   réglé comme au J6 (R1n, R2sn), et la recherche sur les achats et le taux.
3. Les témoins : le modèle décalé, avec la transmission du change et l'élasticité de la demande étrangère parmi les
   hypothèses qui bougent ; la nuit du 16/11 refaite sur le change flottant.

La guerre commerciale entre deux États, l'ancien J7, devient J8 : elle partira des deux pays d'OPEN FLEX.
