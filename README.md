# Économie

L'économie d'un État en simulation : les ménages, les entreprises, les banques, l'État, la banque centrale et le reste
du monde, les flux d'argent entre eux, et les leviers (impôts, dépense, taux, obligations) face aux crises : chômage
fort, conflit sur des matières premières, rachat d'entreprises, inflation, pandémie, papy-boom.

Client de [`mcts-commun`](../mcts-commun/README.md). La recherche sera choisie par la mesure, contre les stabilisateurs automatiques et une règle de Taylor.

**État** (9/11/2026) : J3 est fait. SIM et PC, les deux premiers modèles de Godley et Lavoie, et leurs variantes au revenu anticipé (SIMEX, PCEX), retrouvent les trajectoires du paquet `sfcr` à 1e-12 près ; LP, OPEN, BMW, DISINF et GROWTH, les blocs d'ÉCO, à 1e-11. ÉCO, notre modèle (six secteurs, le trimestre pour pas), part des proportions de la France en 2024 et retrouve les comportements du § 4 de `docs/modele.md`. Les matrices et l'équation cachée de chaque modèle sont vérifiées à chaque période. La page (`npm run page`, puis http://127.0.0.1:4807/web/) montre, au choix du modèle, ses flux en diagramme de Sankey, ses matrices et ses courbes. Le cadrage : [`docs/modele.md`](docs/modele.md) (SIM, PC puis ÉCO, les crises, les règles à battre, les mesures) et [`docs/recherche/`](docs/recherche/README.md) (les chiffres et leurs sources, le glossaire, les questions, le prompt de recherche).

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
