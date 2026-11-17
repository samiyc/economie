# Économie

L'économie d'un État en simulation : les ménages, les entreprises, les banques, l'État, la banque centrale et le reste
du monde, les flux d'argent entre eux, et les leviers (impôts, dépense, taux, obligations) face aux crises : chômage
fort, conflit sur des matières premières, rachat d'entreprises, inflation, pandémie, papy-boom.

Client de [`mcts-commun`](../mcts-commun/README.md). La recherche sera choisie par la mesure, contre les stabilisateurs automatiques et une règle de Taylor.

**État** (17/11/2026) : J7, le change flottant, commence : OPEN FLEX, le modèle à change flottant du livre (ch. 12), retrouve `sfcr` à 1e-10 près, résolu par Newton ([`docs/change-flottant.md`](docs/change-flottant.md)) ; la greffe sur ÉCO vient ensuite. Avant lui, R3, une règle de sept nombres écrite d'après la recherche, en prend l'essentiel quand il faut relancer ; CMA-ES la règle aussi bien que l'escalade, plus lentement ([`docs/regle-r3.md`](docs/regle-r3.md)). J6 est fait : une recherche à horizon glissant pilote les achats publics, mesurée contre la meilleure règle et sur un modèle décalé ([`docs/recherche.md`](docs/recherche.md)). Avant elle, J5 : les règles réglées sur des graines d'apprentissage ([`docs/reglage.md`](docs/reglage.md)) ; J4 : les règles simples mesurées par paires contre trois familles de crises ([`docs/regles.md`](docs/regles.md)) ; et J3 : SIM et PC, les deux premiers modèles de Godley et Lavoie, et leurs variantes au revenu anticipé (SIMEX, PCEX), retrouvent les trajectoires du paquet `sfcr` à 1e-12 près ; LP, OPEN, BMW, DISINF et GROWTH, les blocs d'ÉCO, à 1e-11. ÉCO, notre modèle (six secteurs, le trimestre pour pas), part des proportions de la France en 2024 et retrouve les comportements du § 4 de `docs/modele.md`. Les matrices et l'équation cachée de chaque modèle sont vérifiées à chaque période. La page (`npm run page`, puis http://127.0.0.1:4807/web/) montre, au choix du modèle, ses flux en diagramme de Sankey, ses matrices et ses courbes. Le cadrage : [`docs/modele.md`](docs/modele.md) (SIM, PC puis ÉCO, les crises, les règles à battre, les mesures) et [`docs/recherche/`](docs/recherche/README.md) (les chiffres et leurs sources, le glossaire, les questions, le prompt de recherche).

## Les commandes

| Commande | Ce qu'elle fait |
|---|---|
| `npm install` | installe les outils, relie `mcts-commun` et active le hook de commit |
| `npm run check` | le lint, les types, puis les tests ; c'est ce que lance le hook |
| `npm run lint` (`lint:fix`) | eslint, avec le budget de complexité de lopin |
| `npm run types` | tsc vérifie le JavaScript d'après ses commentaires JSDoc, sans rien compiler |
| `npm test` (`test:coverage`) | les tests de `node --test`, dont la longueur des `.md` |
| `npm run page` | la page, sur http://127.0.0.1:4807/web/ |
| `Rscript scripts/reference/sfcr.R` | réécrit les trajectoires de référence de `tests/fixtures/sfcr/` (R et `sfcr` installés) |

Les règles du dépôt sont dans [`CLAUDE.md`](CLAUDE.md).
