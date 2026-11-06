# Économie

L'économie d'un État en simulation : les ménages, les entreprises, les banques, l'État, la banque centrale et le reste
du monde, les flux d'argent entre eux, et les leviers (impôts, dépense, taux, obligations) face aux crises : chômage
fort, conflit sur des matières premières, rachat d'entreprises, inflation, pandémie, papy-boom.

Client de [`mcts-commun`](../mcts-commun/README.md). La recherche sera choisie par la mesure, contre les stabilisateurs automatiques et une règle de Taylor.

**État** (6/11/2026) : le cadrage est écrit, sans code de modèle ni de recherche : [`docs/modele.md`](docs/modele.md) (SIM, PC puis ÉCO, les crises, les règles à battre, les mesures) et [`docs/recherche/`](docs/recherche/README.md) (les chiffres et leurs sources, le glossaire, les questions, le prompt de recherche).

## Les commandes

| Commande | Ce qu'elle fait |
|---|---|
| `npm install` | installe les outils, relie `mcts-commun` et active le hook de commit |
| `npm run check` | le lint, les types, puis les tests ; c'est ce que lance le hook |
| `npm run lint` (`lint:fix`) | eslint, avec le budget de complexité de lopin |
| `npm run types` | tsc vérifie le JavaScript d'après ses commentaires JSDoc, sans rien compiler |
| `npm test` (`test:coverage`) | les tests de `node --test`, dont la longueur des `.md` |

Les règles du dépôt sont dans [`CLAUDE.md`](CLAUDE.md).
