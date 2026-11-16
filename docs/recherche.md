# La recherche à horizon glissant (J6, 10/11/2026)

J5 ([`reglage.md`](reglage.md)) a réglé les règles simples. J6 leur oppose une recherche : à la fin de chaque
trimestre, un plan des achats publics sur les six ans à venir, cherché sur des futurs tirés de ce qu'on sait de la
crise, dont on joue le premier trimestre avant de recommencer (`modele.md`, § 9). Elle est mesurée contre la meilleure
règle, par paires, sur les crises de J4, avec le seuil d'adoption du § 8 (Q-S3). Les chiffres viennent de
[`mesures/recherche/`](mesures/recherche/), que `node scripts/search-report.js` rassemble.

**En bref** :
- la recherche ne joue que les achats publics : laissée au taux, elle exploitait un défaut d'ÉCO (§ 2) ;
- elle passe le seuil d'adoption face aux matières premières, meilleure que la barre sur les trois objectifs ;
- ailleurs, elle choisit un autre point de la frontière : moins de chômage pour plus de dette, ou l'inverse, au-delà
  des marges du seuil. Sous ses propres poids, elle bat la barre partout (§ 4 et 5) ;
- en récession, elle relance tôt : le pic de chômage passe de 9,6 % à 8,0 % ;
- son gain survit au modèle décalé ; quatre fois plus de budget n'ajoute presque rien ; le faisceau fait presque
  aussi bien que l'escalade (§ 6).

## 1. Ce qui est cherché

| | L'escalade (`src/search/planner.js`) | Le faisceau (`src/search/beam.js`) |
|---|---|---|
| Le levier | les achats publics seuls : la banque centrale suit le Taylor du manuel (§ 2) | le même |
| Le plan | 23 mouvements dans [−1, 1] point de PIB, un par trimestre | cinq mouvements par trimestre : −1, −0,5, 0, +0,5, +1 point |
| La recherche | `createClimb` de la lib, 300 plans notés par décision, le plan d'avant décalé d'un trimestre pour repartir | `createBeam` de la lib, 60 états gardés par profondeur : le coût de l'escalade |
| La valeur d'un plan | la perte de J5 sur 24 trimestres, en moyenne sur 16 futurs | la même, et pour un état à mi-chemin, ce qui reste jusqu'à l'horizon si son dernier trimestre continuait |

**Ce que les deux partagent** :
- **les bornes de J4** (Q-S6) : un point de PIB par trimestre au plus, cinq autour du départ, votés un trimestre et
  dépensés le suivant, comme pour les règles ;
- **les futurs** (`src/crises/families.js`, `beliefOf`, Q-S5) : le planificateur sait la famille de la crise, et son
  début et son ampleur une fois qu'ils ont eu lieu ; ni sa durée restante ni le bruit à venir, tirés de la loi de la
  famille conditionnée à ce qu'il a vu. Les 16 futurs sont communs à tous les plans d'une décision ;
- **le modèle exact** : il planifie sur ÉCO, sauf dans le témoin du modèle décalé (§ 6) ;
- **l'à-coup** (H) : 0,05 par mouvement au carré, en points de PIB, dans la recherche seulement, jamais dans la mesure ;
- **la perte** : celle de J5, linéaire, chaque objectif en unités de son plus petit gain (0,2 point de chômage, 0,2
  point d'écart d'inflation, 2 points de dette), avec les trois jeux de poids de Q-S11.

**Le coût** (`npm run bench`) : 18 s par partie de 40 trimestres, 0,45 s par décision, 3,9 µs par trimestre joué.
Le chemin chaud n'alloue pas (1,6 Mo de tas de plus après neuf parties). Une série de 50 graines prend un quart
d'heure dans la file, sur un fil.

## 2. Ce que les premiers essais ont changé

**Un taux bas ne coûte presque rien dans ÉCO.** Laissée au taux et aux achats, la recherche collait le taux à 0 dès
le 8e trimestre : la dette baissait de 20 points en dix ans par les intérêts, l'inflation restait à peine au-dessus de
2 %. Taylor réglé avec son taux neutre faisait pareil : le taux neutre allait à la borne (3 points sous celui du
modèle), les deux coefficients à 0, et la perte de l'équilibre passait de 110,4 à 100,1 pour R1, de 116,1 à 99,9
pour R2s ([`mesures/reglage-neutre/`](mesures/reglage-neutre/), gardés pour mémoire). La cause est dans ÉCO : le
change y est fixe, la courbe de Phillips plate, les anticipations à moitié ancrées. Rien ne fait payer un taux trop
bas, ni la monnaie qui baisse, ni l'inflation qui s'emballe.

**Sami a choisi la banque centrale indépendante** (10/11) : le taux suit partout le Taylor du manuel, dans le monde
comme dans les futurs, et la recherche ne joue que les achats publics. Corriger ÉCO viendra avec l'économiste
(Q-S10, Q-S13).

**Elle ne sait pas que la mesure s'arrête.** En sachant que la partie finissait au 40e trimestre, elle dépensait à la
fin : la dette de la fin compte, mais pas le chômage d'après. Son horizon glisse donc toujours de 24 trimestres.

**Six ans d'horizon, pas trois.** Sur 12 trimestres, une coupe ne comptait que les trimestres de chômage qu'elle
crée dans l'horizon, et toute la dette qu'elle épargne : elle coupait trop, et perdait contre Taylor seul. Sur 24,
la coupe paie son chômage. Sur 40, elle joue comme sur 24, deux fois plus lentement.

**La valeur du faisceau.** Noté sur la dette seule à mi-chemin, un état qui dépensait semblait meilleur (le PIB monte
avant la dette) : le faisceau ne gardait que des dépensiers, et finissait à 161 à 164 points de dette. Il compte
maintenant ce qui reste jusqu'à l'horizon.

## 3. La barre

Avec le Taylor du manuel imposé, les règles réglées de J5 (R1\*, R2s\*) ne sont plus jouables : elles réglaient aussi
le taux. La barre est donc la meilleure des deux règles qui laissent le taux à Taylor, pour chaque jeu de poids, à la
perte moyenne (Q-S4) :
- **R1**, Taylor seul, les stabilisateurs automatiques jouant ;
- **R2s\*b**, R2s dont seule la vitesse de correction du déficit est réglée, sur les graines d'apprentissage de J5
  ([`mesures/reglage/R2sb-*.json`](mesures/reglage/)) : 0 pour l'équilibre et le chômage d'abord (c'est R1),
  **0,26** pour la dette d'abord.

La barre est R1 pour l'équilibre et le chômage d'abord, R2s\*b pour la dette d'abord. Q-S12 (Taylor sans borne)
devient sans objet pour J6 : le taux n'est plus réglé.

## 4. La mesure, graines 1 à 200

`node scripts/search.js --family <famille> --weights <poids> --from <n> --seeds 50` : 36 jobs d'un fil dans la file,
quatre lots de 50 graines par famille et jeu de poids. Les moyennes, en points :

| Famille | Politique | Chômage | Pic | Écart d'inflation | Dette | Trimestres au plancher |
|---|---|---|---|---|---|---|
| Le calme | R1 | 7,16 | 7,41 | 0,05 | 134,3 | 0,0 |
| Le calme | R2s\*b dette d'abord | 8,01 | 8,56 | 0,20 | 129,3 | 0,0 |
| Le calme | recherche, équilibre | 7,07 | 7,41 | 0,04 | 134,7 | 0,0 |
| Le calme | recherche, chômage d'abord | 6,95 | 7,41 | 0,07 | 137,1 | 0,0 |
| Le calme | recherche, dette d'abord | 9,83 | 10,60 | 0,49 | 118,6 | 9,3 |
| Le chômage fort | R1 | 7,93 | 9,61 | 0,22 | 140,8 | 0,8 |
| Le chômage fort | R2s\*b dette d'abord | 8,79 | 10,11 | 0,35 | 136,2 | 1,6 |
| Le chômage fort | recherche, équilibre | 7,20 | 7,96 | 0,12 | 143,1 | 0,0 |
| Le chômage fort | recherche, chômage d'abord | 6,86 | 7,52 | 0,22 | 148,9 | 0,0 |
| Le chômage fort | recherche, dette d'abord | 9,83 | 10,76 | 0,45 | 128,5 | 9,2 |
| Les matières premières | R1 | 7,37 | 8,42 | 1,93 | 141,4 | 1,0 |
| Les matières premières | R2s\*b dette d'abord | 8,61 | 9,67 | 2,17 | 136,2 | 5,9 |
| Les matières premières | recherche, équilibre | 7,08 | 7,62 | 1,85 | 139,5 | 1,0 |
| Les matières premières | recherche, chômage d'abord | 6,27 | 7,41 | 1,54 | 161,3 | 0,0 |
| Les matières premières | recherche, dette d'abord | 8,43 | 9,97 | 2,05 | 131,5 | 5,7 |

Les paires, recherche − barre, l'écart moyen et son intervalle à 95 % (négatif : la recherche fait mieux), le
verdict du seuil du § 8, et l'écart de la perte que la recherche optimise :

| Famille | Poids | Barre | Chômage | Écart d'inflation | Dette | Seuil | Perte |
|---|---|---|---|---|---|---|---|
| Le calme | équilibre | R1 | −0,09 [−0,09 ; −0,08] | −0,01 [−0,01 ; −0,01] | +0,46 [0,44 ; 0,48] | — | −0,27 [−0,29 ; −0,25] |
| Le calme | chômage d'abord | R1 | −0,21 [−0,21 ; −0,21] | +0,01 [0,01 ; 0,02] | +2,84 [2,77 ; 2,91] | — | −1,68 [−1,75 ; −1,61] |
| Le calme | dette d'abord | R2s\*b | +1,82 [1,82 ; 1,82] | +0,29 [0,29 ; 0,29] | −10,69 [−10,71 ; −10,67] | — | −5,50 [−5,52 ; −5,47] |
| Le chômage fort | équilibre | R1 | −0,73 [−0,75 ; −0,71] | −0,11 [−0,11 ; −0,10] | +2,32 [2,22 ; 2,42] | — | −3,02 [−3,13 ; −2,92] |
| Le chômage fort | chômage d'abord | R1 | −1,07 [−1,10 ; −1,05] | −0,00 [−0,01 ; 0,01] | +8,12 [7,86 ; 8,38] | — | −12,05 [−12,41 ; −11,69] |
| Le chômage fort | dette d'abord | R2s\*b | +1,04 [1,01 ; 1,07] | +0,11 [0,10 ; 0,11] | −7,68 [−7,77 ; −7,60] | — | −5,80 [−5,88 ; −5,72] |
| Les matières premières | équilibre | R1 | **−0,29 [−0,30 ; −0,27]** | −0,08 [−0,08 ; −0,07] | −1,90 [−2,03 ; −1,77] | **gagne** | −2,77 [−2,86 ; −2,68] |
| Les matières premières | chômage d'abord | R1 | −1,10 [−1,11 ; −1,09] | −0,38 [−0,39 ; −0,37] | +19,91 [19,72 ; 20,09] | — | −8,46 [−8,70 ; −8,23] |
| Les matières premières | dette d'abord | R2s\*b | −0,19 [−0,24 ; −0,13] | −0,12 [−0,14 ; −0,11] | **−4,69 [−4,95 ; −4,43]** | **gagne** | −8,59 [−8,87 ; −8,32] |

## 5. Ce qu'on en lit

- **Sous ses propres poids, la recherche bat la barre partout**, avec des intervalles loin de 0 : de 0,27 unité de
  perte au calme à 12 en récession avec le chômage d'abord. Elle fait ce qu'on lui demande.
- **Le seuil d'adoption ne la promeut que face aux matières premières**, avec l'équilibre et la dette d'abord. Là,
  elle fait mieux sur les trois objectifs à la fois : la barre est dominée.
- **Partout ailleurs, elle choisit un autre point de la frontière** (§ 8). Elle achète du chômage avec de la dette
  (équilibre et chômage d'abord), ou de la dette avec du chômage (dette d'abord), au-delà de la marge de
  non-infériorité (1 point de dette, 0,1 point de chômage). Le seuil le refuse, comme il est écrit pour le faire : ce
  n'est pas un gain, c'est un autre choix.
- **Ses échanges sont meilleurs que ceux des règles.** En récession, R2s\*b efface 4,6 points de dette de plus que R1
  pour 0,86 point de chômage, soit 5,3 points de dette par point de chômage ; la recherche, dette d'abord, en efface
  12,2 pour 1,9 point, soit 6,4. Avec l'équilibre, elle rend 0,73 point de chômage pour 2,3 points de dette, quand
  la perte en vaut 10 par point.
- **En récession, elle relance tôt.** Avec l'équilibre, le pic de chômage passe de 9,6 % à 8,0 %, et le taux ne
  touche plus le plancher (0,8 trimestre avec R1). C'est la politique des manuels face à un choc de demande, que ni
  les stabilisateurs ni Taylor ne font assez vite.
- **Avec la dette d'abord, elle mène une rigueur franche, même au calme** : 2,7 points de chômage de plus que R1,
  l'écart de production à −3,8 %, le taux au plancher neuf trimestres sur quarante, pour 15,7 points de dette en
  moins. Ce que coûte la rigueur dans ÉCO dépend du multiplicateur (Q-P6) et du taux bas qui ne coûte rien (§ 2) :
  c'est le résultat le plus fragile, à regarder avec l'économiste (Q-P18).
- **Elle bouge les leviers deux à trois fois plus que les règles** (la somme des mouvements du taux et des achats sur
  la partie : 0,20 à 0,29 en crise, contre 0,07 à 0,14). L'à-coup le freine sans l'arrêter.

## 6. Les témoins

- **A/A exact** : une partie de l'escalade ou du faisceau se rejoue à l'identique depuis sa graine
  (`tests/search.test.js`) ; la recherche tire dans son propre flux, et les crises tirées n'ont pas bougé (vérifié sur
  900 crises). Un plan joué sur les vrais chocs coûte ce que coûte la partie, à 1e-9 près.
Les trois témoins ci-dessous jouent les poids de l'équilibre. Les paires sont faites sur les graines communes avec
l'escalade de la mesure (300 plans), et rapportent l'écart de la perte de l'équilibre.

**Plus de budget** : 1 200 plans par décision au lieu de 300, sur les graines 1 à 30 de chaque famille.

| Famille | Chômage | Écart d'inflation | Dette | Perte |
|---|---|---|---|---|
| Le calme | −0,01 [−0,01 ; −0,00] | −0,00 [−0,00 ; −0,00] | −0,02 [−0,07 ; 0,02] | −0,05 [−0,07 ; −0,03] |
| Le chômage fort | −0,00 [−0,01 ; 0,01] | −0,00 [−0,01 ; 0,00] | −0,08 [−0,19 ; 0,02] | −0,06 [−0,11 ; −0,02] |
| Les matières premières | +0,01 [−0,01 ; 0,03] | −0,01 [−0,01 ; −0,00] | −0,03 [−0,33 ; 0,26] | −0,02 [−0,14 ; 0,10] |

Quatre fois le budget gagne de 0,02 à 0,06 unité de perte, contre 0,3 à 3 gagnées sur R1, et rien qui passe le seuil
sur les objectifs. **L'escalade est
presque à son plafond à 300 plans** : ce que la recherche gagne de plus viendra de ce qu'elle sait (l'horizon, les
futurs, le modèle), pas du budget. Le témoin passe sur la perte au calme et en récession, pas face aux matières
premières, où l'intervalle contient 0.

**Le modèle décalé** (§ 8 de `modele.md`) : le monde est ÉCO avec une hypothèse décalée de 20 %, la recherche planifie
toujours sur ÉCO, 100 graines par famille. Chaque décalage va dans le sens qui dessert la relance :
- `phil` × 1,2 : une courbe de Phillips plus pentue (Q-P2) ;
- `gammar` × 0,8 : un investissement moins sensible au taux (Q-P3) ;
- `etan` × 0,8 : un emploi plus lent à suivre la production ;
- `mug` × 1,2 : des achats publics plus importés, un multiplicateur plus faible (Q-P1).

| Monde | Famille | Recherche − R1 : chômage | Écart d'inflation | Dette | Seuil | Perte |
|---|---|---|---|---|---|---|
| ÉCO (la mesure, 200 graines) | Le chômage fort | −0,73 | −0,11 | +2,32 | — | −3,02 |
| `phil` × 1,2 | Le chômage fort | −0,69 [−0,72 ; −0,66] | −0,13 | +1,80 [1,67 ; 1,93] | — | −3,22 |
| `gammar` × 0,8 | Le chômage fort | −0,77 [−0,80 ; −0,74] | −0,11 | +1,86 [1,74 ; 1,99] | — | −3,47 |
| `etan` × 0,8 | Le chômage fort | −0,71 [−0,74 ; −0,69] | −0,11 | +2,48 [2,34 ; 2,62] | — | −2,87 |
| `mug` × 1,2 | Le chômage fort | −0,71 [−0,73 ; −0,68] | −0,11 | +2,43 [2,29 ; 2,57] | — | −2,89 |
| ÉCO (la mesure, 200 graines) | Les matières premières | −0,29 | −0,08 | −1,90 | gagne | −2,77 |
| `phil` × 1,2 | Les matières premières | −0,29 [−0,30 ; −0,27] | −0,09 | −2,29 [−2,49 ; −2,10] | gagne | −3,02 |
| `gammar` × 0,8 | Les matières premières | −0,28 [−0,30 ; −0,26] | −0,08 | −1,57 [−1,77 ; −1,37] | gagne | −2,59 |
| `etan` × 0,8 | Les matières premières | −0,28 [−0,30 ; −0,26] | −0,08 | −1,87 [−2,06 ; −1,67] | gagne | −2,76 |
| `mug` × 1,2 | Les matières premières | −0,29 [−0,31 ; −0,27] | −0,08 | −1,90 [−2,09 ; −1,71] | gagne | −2,78 |

**Le gain survit aux quatre décalages**, à 15 % près sur la perte : la recherche planifiant sur un modèle faux fait
aussi bien que sur le vrai. Elle n'exploite pas ces quatre hypothèses. Elle n'est pas garantie pour autant : le défaut
qu'elle exploitait vraiment, le taux bas gratuit (§ 2), est dans tous ces mondes, et c'est la décision du 10/11 qui
l'en tient à l'écart.

**Le faisceau contre l'escalade**, 200 graines par famille, au même coût :

| Famille | Chômage | Écart d'inflation | Dette | Perte | Faisceau − R1 : seuil |
|---|---|---|---|---|---|
| Le calme | +0,02 [0,02 ; 0,02] | +0,02 [0,02 ; 0,02] | −0,16 [−0,21 ; −0,11] | +0,13 [0,11 ; 0,16] | — |
| Le chômage fort | +0,07 [0,06 ; 0,08] | +0,04 [0,03 ; 0,04] | −0,63 [−0,73 ; −0,54] | +0,20 [0,16 ; 0,24] | — |
| Les matières premières | +0,05 [0,03 ; 0,06] | −0,02 [−0,02 ; −0,01] | +0,65 [0,43 ; 0,86] | +0,47 [0,41 ; 0,54] | gagne |

Le faisceau fait presque aussi bien que l'escalade, et passe le seuil contre R1 face aux matières premières comme
elle. Il perd un peu sur la perte partout (de 0,13 à 0,47), avec ses leviers discrets et une valeur approchée à
mi-chemin. Aucune des deux recherches ne change le résultat : **l'escalade reste la recherche de J6**.

## 7. Ce qui reste

- **ÉCO doit faire payer un taux bas** (Q-S13) avant qu'on rende le taux à la recherche.
- **Q-P18** se pose maintenant : la relance précoce en récession se reconnaît ; la rigueur de la dette d'abord est à
  faire juger.
- **La quatrième piste du § 9 de `modele.md`**, le réglage d'une règle sur toutes les familles à la fois, est faite
  pour le déficit (R2s\*b). La règle qui imite la recherche (relancer tôt, consolider après) est R3, écrite et réglée
  le 16/11 ([`regle-r3.md`](regle-r3.md)) : elle prend de 39 à 119 % du gain de la recherche sur la barre.
