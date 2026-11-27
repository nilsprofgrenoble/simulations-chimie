# Protocole d'audit des exercices (S'APP, ANA, VAL, REA)

Établi le 27/11/2026 avec Nils, à partir de sa relecture de cinq exercices (SAPP506, ANA354, VAL381, VAL618, REA53). Son exigence : un « standing » d'exercice élevé, pas seulement un exercice juste.

## Consigne de lancement (une seule phrase suffit)
« Lis audit/PROTOCOLE_EXOS.md puis suis audit/SUIVI_EXOS.md jusqu'à la dernière ligne. »

## Règles de l'auditeur
- **Lecture seule** : on ne modifie aucun exercice pendant l'audit. Aucun git, aucune PR.
- Un exercice par ligne du suivi (307 lignes : un par niveau × chapitre × compétence). Désigner chaque exercice par son code affiché (VAL381, SAPP15, ANA101), jamais par son identifiant interne.
- Voir l'exercice **comme un élève**, sur un écran de 390 px de large : `npx vite build`, `npx vite preview --port 4173`, puis Playwright sur `http://localhost:4173/` + la fin du lien de `public/catalogue.csv` (colonne `lien`, par exemple `?sim=77&ex=plausible.kep-val-vitesse`). Regarder l'énoncé ET ce qui s'affiche après « Corriger » (bonne et mauvaise réponse). Lire le code seulement pour compléter (tolérances, tirages).
- Un rapport par chapitre dans `audit/rapports-exos/<niveau>-<chapitre>.md` : pour chaque exercice, ce qui est correct, les défauts classés **Bloquant** (réponse juste refusée, erreur scientifique, réponse devinable), **Important** (ne tient pas le standing ci-dessous), **Mineur**, avec la correction proposée. Les doutes sont notés comme tels, jamais présentés comme des certitudes.
- Mettre à jour la colonne « Statut » de `audit/SUIVI_EXOS.md` (à faire / audité). Nils ne veut ni agents en parallèle ni opérations coûteuses non demandées : travailler en séquence.
- Ne jamais corriger sur la seule foi d'un audit : un défaut Bloquant ou Important se vérifie (code relu, calcul refait, rejeu à 390 px) avant correction.

## Grille de qualité

### A. Présentation (retours de Nils)
1. **Pas d'austérité** : un mini-schéma illustratif, même s'il ne sert pas à résoudre, pour rendre l'exercice agréable. Cas S'APP : le schéma ne porte AUCUNE grandeur ni valeur (sinon il fait l'appropriation à la place de l'élève) ; un schéma qui reprend les données est un indice à la demande (bouton). Cas ANA, VAL, REA : le schéma peut porter les données de l'énoncé ; il peut aussi être masqué et révélé comme un indice.
2. **Hiérarchie visuelle** : la question ressort nettement ; « Formule à utiliser » porte une icône.
3. **Formules typographiées**, jamais en texte brut : vraies fractions (barre de fraction), vraie racine, vrais exposants. Interdit : « 100 divisé par (1 + D × r) », « [(1 − A) × S₀ divisé par (4σ)] à la puissance 1/4 », « (…) puissance 2 ». Le site sait écrire en MathML.
4. **Typographie française** : espace insécable entre le nombre et l'unité, autour de « = » dans les valeurs (« r = 0,5 » ne doit pas se couper en fin de ligne), virgule décimale, indices et exposants en vrais caractères.
5. **Pas de redite** : une donnée donnée dans l'énoncé n'est pas répétée dans les repères (ex. VAL618 : « Dilution : facteur 100 » apparaît deux fois).

### B. Didactique par compétence
- **S'APP** : l'élève doit réellement trier les données (inutiles, pièges, unités) ; le contrat est « s'approprier ». Une dernière étape de calcul qui n'apporte rien à la compétence est facultative : la signaler (à supprimer ou à rendre optionnelle), ne pas rallonger pour remplir.
- **ANA** : choisir la relation, formuler une hypothèse, prévoir sans calculer. Le titre et l'énoncé ne donnent pas la relation.
- **VAL** : deux temps. 1) « Est-ce plausible ? ». 2) Si ce n'est pas plausible : **« Quelle erreur l'élève a-t-il faite ? »** avec des propositions diagnostiques, AVANT de donner l'explication. Une explication servie tout de suite est un défaut Important. Les repères ne doivent pas révéler l'erreur (VAL381 : « r = R_T + h » est la réponse à l'étape 2).
- **REA** : un contexte (qui mesure quoi, pourquoi), une donnée utile par ligne, un schéma. Un REA sec « calculez » sans situation est Important.

### C. Qualité des réponses et du retour
1. **Biais de position** : la bonne réponse est-elle toujours la première (ou la plus longue, ou la seule détaillée) ? Calculer sur l'ensemble des exercices de la case, pas seulement sur l'exercice tiré. Résultat attendu : positions réparties.
2. Chaque distracteur correspond à **une erreur classique identifiable** ; le retour après une mauvaise réponse nomme cette erreur (pas de « Faux » seul).
3. La correction explique la démarche avec les valeurs de l'exercice, pas une formule générale.
4. Données plausibles (ordres de grandeur, unités cohérentes), chiffres significatifs et tolérances réalistes (jamais plus stricts que l'arrondi des données ; au moins 5 % pour un résultat à 2 chiffres significatifs).
5. Exercice adossé à une capacité exigible du programme du niveau ; BTS : questions qualitatives sauf si le référentiel chiffre.
6. L'exercice teste la science, pas l'interface (format de saisie, unités à deviner sans consigne).

### D. Rendu
Texte rendu ≥ 11 px à 390 px ; aucun bouton flottant ne masque la question ; schéma lisible ; console sans erreur.

## Rendu de l'audit
Un tableau de synthèse par chapitre puis global : nombre de défauts par gravité et par famille (présentation, didactique, réponses, rendu). Les familles de défauts communes à plusieurs exercices (ex. formules en texte brut, absence de schéma, VAL sans étape « erreur ») sont signalées à part : elles se corrigent par lot (composant partagé) plutôt qu'exercice par exercice. Proposer ensuite un ordre : 1. défauts Bloquants, 2. familles communes (formules, typographie, étape « erreur » des VAL), 3. schémas, 4. cas particuliers. Nils choisit ce qu'on répare ; aucun lot sans son accord.
