# Protocole d'audit complet de la Paillasse virtuelle

Ce fichier est tes instructions. Relis-le en entier au début de chaque session de travail.

## MISSION
Auditer TOUT le site, simulation par simulation, jusqu'au bout, sans que personne n'ait à te dire laquelle faire. Tu prends le temps qu'il faut : la rigueur compte plus que la vitesse. Tu es à la fois physicien-chimiste (programmes français de lycée et BTS), didacticien et développeur React. Tu travailles en LECTURE SEULE sur le code du site : tu n'écris que dans le dossier `audit/`.

## SUIVI ET REPRISE (essentiel)
1. Le fichier `audit/SUIVI.md` liste toutes les simulations (clé `SIM<id>`) et toutes les banques d'exercices (clé `BANQUE-<fichier>`), avec leurs fichiers et leur statut. Si le fichier n'existe pas ou semble périmé : `node scripts/audit-suivi.mjs` (il garde les statuts déjà saisis).
2. Prends la première ligne dont le statut est ⬜ ou 🟨, dans l'ordre du tableau. Passe-la à 🟨 AVANT de commencer.
3. Audite-la complètement (méthode ci-dessous), écris le rapport `audit/rapports/<clé>.md`, puis mets à jour sa ligne dans `audit/SUIVI.md` : statut ✅, nombres de défauts Bloquants / Importants / Mineurs, nom du rapport.
4. Si tu peux utiliser git : commit sur la branche `audit-complet` après chaque rapport (message : « Audit <clé> »), et pousse régulièrement. Sinon laisse simplement les fichiers dans `audit/`.
5. Passe aussitôt à la ligne suivante. NE T'ARRÊTE PAS, ne demande pas la permission de continuer, ne propose pas de t'arrêter. Si ton contexte se remplit : le suivi est ta mémoire, enregistre l'état (🟨 + notes en tête du rapport en cours) et reprends depuis `audit/SUIVI.md` dans une session neuve.
6. Un fichier de plus de 1 500 lignes : lis-le par tranches de 400 lignes avec recouvrement et note dans le rapport les tranches faites. Une simulation n'est ✅ que quand TOUT son code a été lu. Jamais de ✅ « de principe ».
7. Les modèles de calcul partagés par plusieurs simulations (fichiers `…Modele`, `…Vue`, `commun`) : audite-les une fois, dans le rapport de la première simulation qui les utilise, et cite-les ensuite comme déjà audités.
8. Quand toutes les lignes sont ✅, fais les **passes transversales** (section dédiée plus bas) puis écris `audit/SYNTHESE.md`.

## CE QUE TU DOIS SAVOIR DU SITE
- Une simulation a trois modes : un **parcours guidé** (suite d'étapes ; chaque étape a un énoncé, une `tache` de type `qcm` ou `num` avec `vrai`, `tol` (tolérance), `cs` (chiffres significatifs), `unite`, un `indice`, une explication `expl` / corrigé, et parfois une carte `retenir:`), une **exploration libre** (curseurs, schémas animés), et des **défis** (questions autonomes en fin de parcours, déclarés par `declarerDefis`).
- Certaines simulations ont aussi une banque d'exercices (codes affichés type VAL181, SAPP15, ANA101).
- Les valeurs sont souvent tirées au hasard ou lues par l'élève sur un graphique / une règle à l'écran (pointé de repères) : la valeur attendue est alors calculée dans le code à partir de ce pointé.
- Tu audites d'abord le CODE. Si tu disposes d'un terminal, tu peux (et dois) écrire de petits scripts node pour recalculer les valeurs attendues en important les modèles de calcul de la simulation. Tu ne modifies JAMAIS les fichiers sources du site. Quand un défaut ne peut se confirmer qu'à l'écran, dis-le (Certitude « À confirmer à l'écran »).
- Public : élèves de 2GT à Terminale, TSTL, BTS. Notations françaises. Ne jamais afficher de « capacité exigible » aux élèves (ne pas le signaler comme manque).

## BUG TYPE À NE RIEN LAISSER PASSER (cas réel récent)
Un défi demandait de mesurer une largeur de tache de diffraction par lecture graphique. La lecture (graduations, repères, origine de l'axe, unité ou échelle) ne correspondait pas à la valeur attendue : la réponse « attendue » était fausse ET introuvable par un élève qui applique correctement la méthode. Cherche activement cette famille : **tout endroit où la valeur attendue ne peut pas être retrouvée honnêtement par l'élève avec ce qui est affiché.**

## MÉTHODE POUR CHAQUE ÉLÉMENT DU SUIVI

### Étape 0 : Inventaire
Liste exhaustivement, avec leur position dans le code (ligne ou variable) : toutes les étapes du parcours guidé (numérotées), toutes les tâches (qcm/num), tous les défis, toutes les questions de banque, tous les schémas/animations, toutes les cartes `retenir:`, tous les curseurs. Compte-les. Cet inventaire est la table de couverture du rapport : chaque ligne doit être examinée sur chaque grille.

### Étape 1 : Passe par élément
Pour CHAQUE tâche, défi et question, applique toutes les grilles A à K. Pour chaque `num`, **recalcule toi-même la valeur attendue** à partir des données affichées dans l'énoncé (écris le calcul avec nombres et unités), compare à `vrai`, à l'`expl` et aux valeurs rappelées. Pour les valeurs tirées au hasard ou issues du code, évalue au moins 3 jeux de valeurs dont les extrêmes des curseurs (par script node quand c'est possible).

### Étape 2 : Passes transversales sur la simulation
Grilles E à K sur l'ensemble du parcours.

### Étape 3 : Auto-critique
Relis ton rapport et demande-toi : « Quelles lignes de l'inventaire n'ai-je pas réellement recalculées ? Quelle grille ai-je traitée trop vite ? » Refais ces passes et complète. Indique ce que tu n'as pas pu vérifier.

## GRILLES

**A. Justesse scientifique** : formules, signes, unités, puissances de 10, constantes (valeur et unité), conversions, ordres de grandeur réalistes, définitions correctes, vocabulaire exact (grandeur vs unité, concentration vs quantité…), équations de réaction équilibrées (atomes et charges), état physique, sens des flèches. **Hypothèses de travail explicites** : modèle, domaine de validité, approximations (petits angles, loi normale pour les incertitudes, gaz parfait, solution diluée, système isolé, frottements négligés…) : signale toute hypothèse utilisée mais jamais énoncée ni discutée aux élèves.

**B. Cohérence énoncé / données / corrigé / tolérance** : les données affichées sont-elles exactement celles utilisées par `vrai` ? Même nombre de chiffres significatifs (`cs`) que les données ? Le corrigé `expl` donne-t-il le même résultat que `vrai` (arrondi, unité) ? La tolérance `tol` est-elle absolue ou relative (précise laquelle) et le comportement correspond-il à l'intention ?

**C. Lectures graphiques et pointés (priorité maximale)** : quand la valeur vient d'une lecture à l'écran, vérifie : l'axe, son origine, son échelle, son unité ; la conversion pixel → grandeur ; que la grandeur à lire est bien celle à laquelle `vrai` correspond (largeur totale ou demi-largeur ? rayon ou diamètre ? minima ou bords de la tache ? période ou demi-période ? tangente ou sécante ?) ; que les repères manipulables peuvent atteindre la valeur attendue (positions discrètes, pas du curseur, bornes) ; que le sens de la lecture dans l'énoncé est celui du code. Estime l'incertitude de pointé réaliste d'un élève (quelques pixels ou 1 à 2 graduations) et traduis-la en incertitude relative. **Si cette incertitude dépasse la tolérance `tol`, c'est un défaut Bloquant** (plancher raisonnable : 10 % ou 3 fois l'incertitude relative de pointé quand la valeur vient d'un pointé).

**D. Défis jouables par un vrai élève** : le défi est-il faisable avec ce qui est affiché ? Y a-t-il une information nécessaire non fournie, ou une donnée déjà affichée qui donne la réponse (légende, aria-label, barre de mesure, texte alternatif d'un schéma) ? Le retour d'erreur est-il **diagnostique** ? Il doit distinguer : (a) saisie qui n'est pas un nombre, (b) valeur incohérente avec le calcul fait sur SES propres mesures, (c) calcul juste mais lecture trop loin (trop petit / trop grand). Un message générique du type « revoyez votre mesure » seul est un défaut Important. Existe-t-il un moyen de voir la correction après échec (valeur attendue, démarche avec les valeurs de l'élève, cause probable de l'écart) ? Le verdict reste-t-il affiché alors que l'élève a changé un réglage ou sa saisie (verdict périmé) ? Le verdict final (conforme / non conforme) se fonde-t-il sur la valeur saisie par l'élève et l'incertitude affichée, et non sur une valeur cachée ? Un `indice` existe-t-il pour chaque question ?

**E. Progressivité et valeurs rappelées** : pour chaque étape N, liste les valeurs réutilisées des étapes précédentes ; chacune doit être redonnée **dans l'énoncé de l'étape N** avec nombre, unité et même nombre de chiffres significatifs que dans le corrigé d'origine. Signale tout rappel différent du corrigé (arrondi, unité). Une étape ne doit pas contenir plus d'une idée ; vocabulaire défini avant usage ; exemple résolu avant recherche autonome ; indices gradués ; une carte « À retenir » ne doit pas donner la réponse de sa propre étape ; au-delà d'environ 15 étapes, signale « à découper ».

**F. Notations** : chaque symbole (grandeur, indice, constante, notation chimique) est défini en toutes lettres à son premier usage (nom, unité, sens de l'indice). Dresse la liste des symboles par ordre d'apparition, repère le premier usage non défini et les **homonymes** (une même lettre pour deux choses : σ conductivité et écart-type, A et B points et transformations, ρ, η…). Notations françaises ; indices en `<sub>` ; pas de `v_a` brut ; une unité écrite toujours de la même façon (mmol·L⁻¹ OU mmol/L, pas les deux) ; séparateur décimal par virgule affichée.

**G. Schémas, animations, SVG** (audit sur le code : viewBox, coordonnées, tailles de police) : éléments qui sortent du viewBox, textes qui se chevauchent ou touchent un trait, légende qui recouvre un titre, tailles de police rendues sous 9 px à 390 px de large (taille × largeur rendue / largeur du viewBox), schéma dont la largeur dépasse 500 px ou la hauteur 420 px sur ordinateur, vecteurs sans flèche, objets qui ne réagissent pas aux réglages (ressort qui ne s'allonge pas, objet qui flotte au lieu d'être posé), forces manquantes. **Validité chimique** : valences (4 liaisons par carbone), charges, doublets, formules brutes et noms cohérents, animation cohérente avec le profil énergétique et le produit annoncé, flèches courbes si attendues.

**H. Fiches de révision (cartes `retenir:`)** : 3 à 6 cartes ; chaque carte a un schéma utile, une idée mémorisable (phrase-clé ou mnémonique), un exemple chiffré cohérent avec le moteur de la simulation et avec les corrigés ; mêmes symboles et mêmes valeurs de référence que dans le reste du site ; aucune clé `retenir:` dupliquée dans une même étape ; pas de tableau susceptible d'être tronqué à 390 px.

**I. Robustesse du code (comportement)** : division par zéro, `NaN` / `Infinity` / `-0` affichés, valeurs aux bornes des curseurs, racines ou logarithmes de valeurs négatives ou nulles, `toFixed` / `toPrecision` mal appliqués (3 chiffres significatifs ≠ 3 décimales), arrondis intermédiaires qui faussent le résultat final, comparaison de flottants par `===`, virgule décimale saisie par l'élève (« 2,5 ») non acceptée, espaces, unités tapées avec la valeur, notation scientifique (« 2e-3 », « 2×10^-3 »), nombre négatif ou nul accepté à tort, état persistant (`useEtatPersistant`) qui peut devenir incohérent quand des étapes sont ajoutées ou déplacées, effets (`useEffect`) sans dépendances correctes ou qui boucle, état qui n'est pas réinitialisé quand on change de situation, clés React dupliquées ou instables, accès à un tableau hors bornes, tirage aléatoire qui peut produire une situation impossible ou un défi infaisable.

**J. Pertinence pédagogique** : étape qui ne sert aucune compétence du programme, question ambiguë ou à réponses multiples non prévues, distracteur de qcm qui est en fait correct, qcm dont la bonne réponse est devinable sans réfléchir (longueur, formulation), question qui teste la lecture de l'interface plutôt que la science, niveau de langue ou de calcul inadapté au niveau annoncé (2GT surtout : doit être hyper pédagogique, accessible à des élèves peu scientifiques).

**K. Interface (d'après le code)** : rangées de boutons de choix qui devraient être un menu déroulant, trop de commandes visibles en exploration, contrôle sans phrase d'aide, cible tactile probablement < 42 px, texte alternatif manquant ou révélant la réponse, contraste de couleurs insuffisant dans le code (gris clair sur blanc), information portée par la couleur seule, console : `console.log` oubliés, props manquantes, imports inutilisés ou cassés.

## FORMAT DU RAPPORT `audit/rapports/<clé>.md`

```
# Audit <clé> : <titre>
Fichiers lus: (liste, avec tranches de lignes si découpé)  ·  Date  ·  Moyens: code seul / code + scripts de recalcul

## 1. Inventaire et couverture
| n° | type (étape / défi / exo / schéma / carte) | identifiant ou ligne | grilles appliquées | recalcul fait |

## 2. Défauts (Bloquants d'abord, puis Importants, puis Mineurs)
ID: <clé>-01
Gravité: Bloquant | Important | Mineur
Grille: A à K
Lieu: étape N / défi « titre » / exo CODE (tel qu'affiché : VAL181, SAPP15, ANA101) / ligne ou variable
Extrait: (citation EXACTE et courte du code, 1 à 3 lignes)
Défaut: (une phrase)
Preuve: (calcul refait avec nombres et unités, ou raisonnement pas à pas)
Ce que vit l'élève: (une phrase)
Correction proposée: (précise : quelle valeur, quelle formule, quel texte)
Certitude: Certain | Probable | À confirmer à l'écran (dire quoi regarder)
Effort: petit | moyen | gros

## 3. Doutes (soupçons non prouvés : Lieu, Soupçon, Comment vérifier)

## 4. Ce qui est correct (tâches et défis dont tu as RECALCULÉ la valeur attendue et trouvé juste, calcul en une ligne)

## 5. Limites (ce que tu n'as pas pu examiner)
```

Gravité : **Bloquant** = un élève qui répond juste est refusé, la réponse attendue est fausse ou introuvable, un contenu scientifique est faux, le composant plante. **Important** = confusion probable, retour d'erreur non diagnostique, valeur non rappelée, notation non définie, schéma illisible ou faux. **Mineur** = typographie, style, cohérence.

## PASSES TRANSVERSALES (après toutes les simulations)
1. **Cohérence entre simulations** : un même symbole, une même constante, une même valeur de référence, une même convention d'arrondi (nombre de chiffres significatifs) doivent être identiques partout ; relève les écarts, simulation par simulation (le rapport cite les clés concernées).
2. **Chevauchements** : simulations ou exercices qui enseignent la même chose de façon contradictoire ou redondante.
3. **Banques d'exercices** : chaque exercice (codes VAL / ANA / SAPP / REA) a-t-il une réponse unique, des données suffisantes, une unité attendue claire, une tolérance réaliste, un énoncé sans ambiguïté ?
4. **Catalogue** : `src/chapitres.js` référence-t-il des identifiants de simulation inexistants ? Des simulations n'appartiennent-elles à aucun chapitre ? (lecture seule ; ne lance rien d'autre que des commandes de lecture.)
5. Écris `audit/SYNTHESE.md` : tableau global (clé, Bloq., Imp., Min.), les 30 défauts Bloquants les plus graves, les familles de défauts récurrents (avec les clés concernées), et les corrections qui se traitent « en série » (même cause dans plusieurs simulations).

## RÈGLES STRICTES
- N'invente rien : chaque défaut cite un extrait exact du code. Si tu n'es pas sûr, mets-le en « Doutes ».
- Ne modifie aucun fichier hors de `audit/`. Ne propose pas de refonte globale : des corrections ciblées.
- Pas de compliments, pas de résumé général : des défauts précis et prouvés. Si une grille ne donne rien, écris « Aucun défaut (N éléments examinés) » et n'invente pas pour remplir.
- Ne saute aucune simulation et ne regroupe pas plusieurs simulations dans un seul rapport.
- Écris en français.
