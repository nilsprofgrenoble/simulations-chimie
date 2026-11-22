# Audit SIM64 : Réfraction de la lumière : lois de Snell-Descartes (2GT)

Fichiers lus : `src/simulations/Refraction.jsx` (L1-352, en entier), `src/simulations/optiqueModele.js` (L1-84, en entier ; la partie lentille est auditée avec SIM65), `src/simulations/RefractionFiches.jsx` (L1-209, en entier), `src/commun.jsx` (affichage des cartes `retenir`, `proche`, tolérances : L87, L325-333, L373-374, L412).
Date : 22/11/2026 · Moyens : code + scripts de recalcul (`audit/scripts/recalc-SIM64.mjs`) + rendu réel à 390 px (`audit/scripts/rendu-SIM64.cjs`). Cet audit refait le rapport perdu de SIM64 (ancien décompte de Mistral : 2 bloquants / 1 important / 1 mineur, non décrits).

Bilan : **1 Bloquant · 6 Importants · 10 Mineurs.**

## 1. Inventaire et couverture

| n° | type | identifiant / ligne | grilles | recalcul fait |
|---|---|---|---|---|
| 1 | étape | `pecheur` (qcm) L190 | A B E J | oui (qualitatif, cohérent avec le tracé du pêcheur) |
| 2 | étape | `vocab` (qcm) | A B | oui |
| 3 | étape | `rapproche` (qcm) + carte FicheVocabRef | A B H | oui : air→eau 50° → 35,17° |
| 4 | étape | `ecarte` (qcm) | A B | oui : plexi→air 25° → 39,65° (« ≈ 40° ») |
| 5 | étape | `zero` (qcm) + carte FicheIndice | A B H | oui |
| 6 | étape | `sinus` (action : ≥ 5 mesures) L203 | B D E | oui : 30°→19,34° lu 19,5° ; 60°→35,00° |
| 7 | étape | `indice` (num, vrai 1,51, tol 2 %) L206 | A B C E | oui : sin 60°/sin 35° = 1,5099 |
| 8 | étape | `snell` (num, vrai 19,47, tol 2 %) L218 + carte FicheLoi | A B E H | oui : asin(0,5/1,5) = 19,471° ; pièges 20 / 0,33 / 48,59 recalculés |
| 9 | étape | `liquides` (action : ≥ 3 mesures par liquide) L228 + carte FicheCalcAngle | B D H | oui : fiche air→diamant 50° → sin i₂ = 0,3165, i₂ = 18,45° |
| 10 | étape | `compare` (qcm) | A B | oui : 313 600 couples de triplets d'angles, la pente de l'eau sucrée est toujours la plus grande |
| 11 | étape | `tir` (qcm) | A B | oui : angle limite plexi→air 41,47° |
| 12 | étape | `pecheur2` (qcm) + carte FicheTotale | A H | oui : limites 41,5° / 48,8° / 24,4° |
| 13 | étape | `fin` (bilan) + carte FicheBilanRef | H | oui |
| 14 | défi | « Calculer i₂ » (`calcul`) L97, L114 | A B C D | oui : 61 tirages possibles (9 exclus pour réflexion totale), arrondis 2 et 3 chiffres significatifs, arrondi au degré |
| 15 | défi | « Déterminer un indice » (`indice`) L98, L115 | A B C D | oui : 5 indices × 9 248 jeux de 3 à 5 angles, mesure unique, moyenne des rapports |
| 16 | défi | « Prévoir la déviation » (`prevoir`) L99, L116 | A B D | oui : 5 paires × angles, exclusion proche de l'angle limite |
| 17 | schéma | `Interface` (rayon et surface, mesure) L31-65 | G K | rendu à 390 px |
| 18 | schéma | `Graphe` (sin i₁ en fonction de sin i₂) L68-79 | G K | rendu à 390 px |
| 19 | schéma | `Pecheur` L82-103 + modèle `pecheur()` | A G | 9 177 réglages de curseurs calculés, résidu de Snell < 1e-6 |
| 20 | cartes | 6 fiches `retenir` (Vocab, Indice, Loi, CalcAngle, Totale, Bilan) | G H | oui (valeurs et rendu) |
| 21 | curseurs | i₁ (0-89 et 0-85), profondeur, distance, hauteur de l'œil | I K | oui (bornes) |

## 2. Défauts

### Bloquant

ID: SIM64-01
Gravité: Bloquant
Grille: B / C (tolérance et précision demandée)
Lieu: étape 8 « Calculer un angle de réfraction » (`snell`), `Refraction.jsx` L218
Extrait: `tache: { type: 'num', q: 'Quel est l’angle de réfraction i₂ (en degrés) ?', unite: '°', vrai: 19.47, tol: 0.02, …`
Défaut: l'énoncé ne dit pas à quelle précision répondre, et la tolérance (2 % relatif, soit ± 0,39°) refuse la réponse arrondie au degré, la plus naturelle en Seconde.
Preuve: i₂ = sin⁻¹(1,00 × sin 30° / 1,50) = sin⁻¹(0,3333) = 19,471°. Marge acceptée : 19,471 ± 0,389 = [19,08 ; 19,86]. Réponse « 19 » : écart 0,47 > 0,39 → refusée. Réponse « 20 » : refusée, et reconnue comme piège (L218 `[20, 'Ne divise pas directement les angles (30 / 1,5)…']`). Vérifié par `recalc-SIM64.mjs`, partie F.
Ce que vit l'élève: il calcule juste (19°), voit ❌, et lit le message de piège ou la consigne générique ; pour avancer il doit réussir ou afficher la correction. Il pense avoir fait une erreur de méthode alors que son résultat est correct au degré.
Correction proposée: écrire dans l'énoncé « Donnez i₂ à 0,1° près (3 chiffres significatifs) » (le `cs` de la tâche) et garder la tolérance ; ou élargir à `tol: 0.03` pour accepter 19° (19,47 × 0,03 = 0,58) et préciser « arrondi au degré ou au dixième ». Rendre le message du piège « 20 » plus prudent (« 20 est ce qu'on obtient en divisant les angles ; ici l'arrondi au degré donne 19 »).
Certitude: Certain (comportement), la nature « juste » de 19° tient au fait que l'énoncé ne fixe aucune précision.
Effort: petit

### Importants

ID: SIM64-02
Gravité: Important
Grille: B / D
Lieu: défi « Calculer i₂ », `Refraction.jsx` L114
Extrait: `ok = isFinite(x) && proche(x, d.i2, 0.02)` ; énoncé : « Calculez l’angle de réfraction i₂. »
Défaut: même problème que SIM64-01 dans le défi : aucune précision demandée, tolérance 2 % relatif, réponse arrondie au degré refusée pour certains tirages.
Preuve: sur les 61 tirages possibles, 5 refusent l'arrondi au degré : air→eau 25° (18,53° ; « 19 » refusé, marge ± 0,37), air→diamant 40° (15,40° ; « 15 », ± 0,31), air→diamant 50° (18,45° ; « 18 », ± 0,37), eau→plexi 20° (17,53° ; « 18 », ± 0,35), eau→diamant 25° (13,43° ; « 13 », ± 0,27). Arrondi au dixième : 0 refus sur 61. Arrondis intermédiaires à 2 chiffres significatifs (sin i₁ puis rapport) : 3 tirages refusés (air→diamant 25° et 40°, plexi→eau 60° : 79,5° contre 81,9° obtenu avec 0,87 et 0,99, soit 3,0 %) ; à 3 chiffres : 0.
Ce que vit l'élève: 8 % des tirages refusent une réponse arrondie au degré, sans explication ; le défi paraît « arbitraire ».
Correction proposée: afficher « à 0,1° près » dans l'énoncé du défi et accepter ± 0,3° ou 2 %, le plus grand des deux.
Certitude: Certain
Effort: petit

ID: SIM64-03
Gravité: Important
Grille: D2 (retour diagnostique)
Lieu: les trois défis, `Refraction.jsx` L113-116 (fonction `evaluer`)
Extrait: `'Revois : n₁ × sin i₁ = n₂ × sin i₂, donc sin i₂ = n₁ × sin i₁ / n₂ (puis arcsin, touche sin⁻¹).'` · `'Revois : air → liquide, n = sin i₁ / sin i₂ ; ou la pente de la droite sin i₁ = f(sin i₂).'` · `'Rappel : n₂ > n₁ → se rapproche…'`
Défaut: un seul message par défi, quel que soit l'échec. Rejoué à 390 px : la réponse « 0,5 » et la saisie « abc » affichent exactement le même texte. Les pièges déjà codés dans le parcours (division des angles, inversion des indices, radians, sin i₂ rendu à la place de i₂) ne sont pas repris dans le défi.
Preuve: capture du rendu : « ❌ Revois : n₁ × sin i₁ = n₂ × sin i₂, donc sin i₂ = … » pour « 0,5 » et pour « abc ».
Ce que vit l'élève: il ne sait pas s'il a mal tapé, mal calculé, ou si sa calculatrice est en radians. Le bouton « voir la solution » donne le corrigé mais pas la cause de son erreur.
Correction proposée: pour « calcul », distinguer (a) saisie non numérique : « Entre un nombre » ; (b) réponse proche de sin i₂ (écart < 2 % avec n₁ sin i₁ / n₂) : « Tu as donné sin i₂ ; applique sin⁻¹ » ; (c) réponse proche du calcul avec les indices inversés ou avec l'angle en radians : message ciblé ; (d) sinon, dire si la réponse est trop grande ou trop petite et rappeler la méthode. Même découpage pour « indice » (n inversé, n = rapport des angles, valeur d'une mesure à petit angle).
Certitude: Certain (rendu vérifié)
Effort: moyen

ID: SIM64-04
Gravité: Important
Grille: B (réponse visible ailleurs) / H
Lieu: étape 8 `snell` (carte FicheLoi), `RefractionFiches.jsx` L110
Extrait: `<li>Exemple : i₁ = 30° et i₂ = 19,5° donnent n = sin 30° / sin 19,5° ≈ 1,50. <strong>Piège</strong> : …`
Défaut: la carte « À retenir » est affichée sur la même carte que la question de l'étape 8 (`commun.jsx` L412) et son exemple est exactement la réponse attendue : air → verre n = 1,50, i₁ = 30°, i₂ = 19,5°.
Preuve: rendu à 390 px, étape 8 : le texte de la carte contient « 19,5 » (test `/19,5/` vrai) alors que la question est « Quel est l'angle de réfraction i₂ ? » avec i₁ = 30°, n₂ = 1,50. L'étape 6 (L202) affiche déjà le même couple (30° → 19,5°).
Ce que vit l'élève: la réponse est lisible sans calcul, dans un cadre mis en valeur.
Correction proposée: remplacer l'exemple de FicheLoi par un autre couple (par exemple i₁ = 50° et i₂ = 30,5° pour le plexiglas : n = sin 50° / sin 30,5° = 1,51 ; vérifier au calcul) ; supprimer aussi 30° → 19,5° de l'exemple de l'étape 6 ou le remplacer par une autre valeur.
Certitude: Certain
Effort: petit

ID: SIM64-05
Gravité: Important
Grille: E / J (exemple résolu = question posée)
Lieu: étape 6 `sinus` (L202) et étape 7 `indice` (L206)
Extrait: `Mesures du TP : i₁ = 30° donne i₂ = 19,5° ; i₁ = 60° donne i₂ = 35,0°. … sin 60° / sin 35,0° = 0,866 / 0,574 = 1,51` puis `q: 'Une mesure donne i₁ = 60° et i₂ = 35,0°. Quel est l’indice n du plexiglas ?'`
Défaut: l'étape 7 repose sur les valeurs 60° et 35,0° déjà résolues, avec le résultat 1,51, dans l'exemple de l'étape 6.
Preuve: le calcul `0,866 / 0,574 = 1,51` de l'étape 6 est la réponse de l'étape 7 (vrai 1,51).
Ce que vit l'élève: il n'a qu'à recopier 1,51 d'une étape à l'autre.
Correction proposée: changer l'exemple de l'étape 6 (par exemple i₁ = 20° donne i₂ = 13,0° ; i₁ = 50° donne i₂ = 30,5° : à recalculer) ou changer les valeurs de la question de l'étape 7 (i₁ = 50°, i₂ = 30,5° : n = 0,766 / 0,508 = 1,51) en gardant tol et pièges cohérents.
Certitude: Certain
Effort: petit

ID: SIM64-06
Gravité: Important
Grille: G / K (lisibilité à 390 px)
Lieu: schémas `Interface` (L31-65) et `Pecheur` (L82-103)
Extrait: `<svg viewBox={`0 0 ${w} 340`} width="100%" …` avec `w = 560` et textes `fontSize="13"`, `14`, `15`, `12.5` ; `Pecheur` : `viewBox="0 0 560 330"`
Défaut: les schémas sont dessinés dans 560 unités de large et affichés à 262 px sur téléphone : facteur 0,47. Tous les textes sont sous 9 px.
Preuve (rendu 390 px, `rendu-SIM64.cjs`) : Interface : « normale » 6,1 px, « Milieu 1 : air (n₁ = 1,00) » 6,5 px, i₁ et i₂ 7,0 px, minimum 5,6 px ; Pêcheur : « œil », « poisson réel », « où pointe la visée » 5,8 px, « point d'incidence » 5,4 px.
Ce que vit l'élève: sur téléphone, les noms des milieux, les angles et les légendes sont illisibles ; la figure est l'objet principal de la simulation.
Correction proposée: viewBox plus étroit (par exemple 360 de large avec les textes agrandis à 15-17), ou texte de 22 à 26 dans le viewBox actuel ; limiter les légendes aux éléments utiles. Tester à 390 px (cible : ≥ 11 px rendus).
Certitude: Certain
Effort: moyen

ID: SIM64-07
Gravité: Important
Grille: G
Lieu: `Pecheur`, `Refraction.jsx` L100
Extrait: `<text x="14" y="322" fontSize="12.5" fill="#0f172a">Lumière : poisson → surface → œil (bleu) · visée : prolongement de la droite œil → surface (orange pointillé)</text>`
Défaut: la ligne de légende est plus longue que le cadre : elle occupe x = 14 → 634 dans un viewBox de 560 de large, donc la fin est coupée (« … visée : prolongement de la droite œil → surface (oran »). Pour une profondeur de 150 cm, le poisson (y = 320) passe sur cette ligne.
Preuve: mesure `getBBox` à 390 px : texte hors cadre [x 14→634 / 560] ; capture avec profondeur 150 cm : légende coupée et traversée par le poisson.
Ce que vit l'élève: la légende qui explique le code couleur bleu / orange est inachevée.
Correction proposée: couper la légende en deux lignes courtes (ou la sortir du SVG, en texte HTML sous la figure) et remonter le texte de profondeur.
Certitude: Certain
Effort: petit

### Mineurs

ID: SIM64-08
Gravité: Mineur · Grille: G · Lieu: `Pecheur`, `optiqueModele.js` L35 (`aimX`)
Extrait: `aimX = xp + (xp - xe) * (d / h)`
Défaut: dans 637 des 9 177 réglages des curseurs (7 %), la position visée sort du cadre (aimX jusqu'à 732 pour un cadre de 560) ; le poisson fantôme orange et l'étiquette sont alors coupés.
Preuve: `recalc-SIM64.mjs`, partie E ; exemple xf = 420, d = 150, h = 60 : visée à 312 cm du poisson réel, hors du dessin.
Ce que vit l'élève: avec un poisson loin et un œil bas, l'écart n'est plus visible. Texte « La visée passe à 312 cm du poisson réel » reste juste.
Correction proposée: agrandir le viewBox en largeur ou réduire la plage de `xf` (220-420) ; sinon limiter l'affichage du fantôme à `Math.min(aimX, 540)`.
Certitude: Certain · Effort: petit

ID: SIM64-09
Gravité: Mineur · Grille: G · Lieu: `Interface`, L62
Extrait: `{!leg && <text x={xr - 4} y={yr - 6} fontSize="12" … textAnchor="end">rayon réfléchi</text>}`
Défaut: avec i₁ de 20° à 30° environ, l'étiquette « rayon réfléchi » recouvre l'étiquette « normale » (étape 4 ; défaut de mesure à 30°).
Preuve: `rendu-SIM64.cjs` relève un chevauchement « normale ⟷ rayon réfléchi » à l'étape 4 (plexi→air, i₁ = 25°) et dans l'atelier de mesure (i₁ = 30°) ; à i₁ = 40° et 50° (étapes 10 et 11) les boîtes ne se touchent plus.
Ce que vit l'élève: deux étiquettes superposées en haut du schéma.
Correction proposée: placer « rayon réfléchi » sous le rayon, ou décaler « normale » en bas du trait.
Certitude: Certain · Effort: petit

ID: SIM64-10
Gravité: Mineur · Grille: G · Lieu: `Graphe`, L74-76
Extrait: `fontSize="10"` (graduations) et `<text x="170" y="218" … fontSize="11.5" …>sin i₂</text>`
Défaut: graduations à 8,7 px rendus (viewBox 300 affiché à 262 px) ; l'étiquette de l'axe sin i₂ (y = 218 pour une hauteur de 220) dépasse le cadre par le bas (indice coupé) et touche les graduations.
Preuve: rendu : « 0,0 … » 8,7 px ; `sin i₂ [x 156→184]` hors cadre ; chevauchement « 0,6 ⟷ sin i₂ ».
Ce que vit l'élève: lecture difficile des graduations.
Correction proposée: viewBox 300×230, graduations à 12, étiquette à y = 224.
Certitude: Certain · Effort: petit

ID: SIM64-11
Gravité: Mineur · Grille: D / J · Lieu: étapes 6 et 9, L203 et L228
Extrait: `ok: enGuide && atelier === 'mesure' && pts.length >= 5, consigne: 'Notez au moins 5 mesures avec des angles d’incidence différents.'`
Défaut: la condition compte seulement les mesures : 5 clics sur « Noter cette mesure » avec le même angle passent (de même 3 mesures par liquide à l'étape 9).
Preuve: lecture du code : aucun test sur `new Set(pts.map(p => p.i1)).size`.
Ce que vit l'élève: il peut valider sans voir l'alignement des points.
Correction proposée: exiger `new Set(pts.map(p => p.i1)).size >= 4` (et par liquide à l'étape 9).
Certitude: Certain · Effort: petit

ID: SIM64-12
Gravité: Mineur · Grille: A · Lieu: `optiqueModele.js` L14, hypothèses L260
Extrait: `{ id: 'plexi', nom: 'plexiglas', n: 1.51 }` et « Indices à 589 nm … plexiglas 1,51 ».
Défaut: la valeur tabulée du PMMA (plexiglas) à 589 nm est d'environ 1,49 ; 1,51 est plutôt celle d'un verre crown. Le texte annonce pourtant des « valeurs tabulées ».
Preuve: valeur de référence usuelle (PMMA, 589 nm) ≈ 1,49 ; écart 0,02, soit 1,3 %.
Ce que vit l'élève: écart d'environ 1 % avec un tableau de manuel ; sans conséquence pour les calculs de la simulation.
Correction proposée: soit passer à 1,49 (toutes les valeurs liées se recalculent : 41,5° → 42,2° ; exemples des étapes 4, 6, 7 et de la fiche Totale), soit dire « plexiglas ≈ 1,50 (valeur arrondie) » dans les hypothèses. À trancher avec un manuel de référence.
Certitude: Probable · Effort: moyen

ID: SIM64-13
Gravité: Mineur · Grille: I / D · Lieu: `nouveauDefi`, L25 et L97-99
Extrait: `const alea = l => l[Math.floor(Math.random() * l.length)];`
Défaut: « Nouveau tirage » peut redonner exactement la même situation (aucune exclusion du tirage précédent, contrairement aux autres simulations).
Preuve: probabilité d'un tirage identique : 1/61 pour « calcul », 1/5 pour « indice » (5 indices).
Ce que vit l'élève: « Nouveau tirage » sans changement apparent.
Correction proposée: passer le tirage précédent à `nouveauDefi` et le tirer de nouveau s'il est identique.
Certitude: Certain · Effort: petit

ID: SIM64-14
Gravité: Mineur · Grille: J / K · Lieu: étape 8, L217
Extrait: `À vous : air → verre d’indice 1,50, avec i₁ = 30°.`
Défaut: le milieu « verre » n'existe pas dans le simulateur (`MILIEUX` : air, eau, eau sucrée, glycérol, plexiglas, diamant) : l'élève ne peut pas vérifier son résultat à l'écran, alors que l'exemple précédent propose « Vérifier sur le schéma ».
Preuve: `MILIEUX` (`optiqueModele.js` L11-17).
Ce que vit l'élève: pas de contrôle visuel pour l'exercice autonome.
Correction proposée: ajouter « verre » (n = 1,50) dans `MILIEUX` (attention aux défis qui utilisent `PAIRES`) ou prendre un milieu existant (diamant : n = 2,42).
Certitude: Certain · Effort: petit

ID: SIM64-15
Gravité: Mineur · Grille: A / J · Lieu: `Pecheur` (L82-103), étapes 1 et 12 et fiche Bilan
Extrait: `<text … >où pointe la visée</text>` ; qcm : « Plus bas : le poisson est plus profond qu’il ne paraît »
Défaut: la figure montre la visée prolongée jusqu'à la profondeur du poisson (écart horizontal), alors que la conclusion enseignée porte sur la profondeur apparente ; l'image apparente (plus haute) n'est jamais dessinée.
Preuve: lecture du modèle : `aimX = xp + (xp - xe)(d/h)` donne le point de la droite de visée à la profondeur réelle d, pas la position apparente.
Ce que vit l'élève: la conclusion « plus profond qu'il ne paraît » n'est pas lisible sur le dessin.
Correction proposée: ajouter un second repère (position apparente à la profondeur d·tan(i_air)/tan(i_eau)… à calculer dans le modèle) ou reformuler la légende.
Certitude: À confirmer à l'écran (jugement pédagogique) · Effort: moyen

ID: SIM64-16
Gravité: Mineur · Grille: A · Lieu: fiche FicheIndice, `RefractionFiches.jsx` L80
Extrait: `<li>Plus l’indice du milieu 2 est grand, plus la déviation est importante.</li>`
Défaut: énoncé vrai seulement à n₁ et i₁ fixés ; la déviation dépend du rapport n₂ / n₁.
Preuve: n₁ sin i₁ = n₂ sin i₂ : à n₁ et i₁ fixés, i₂ diminue quand n₂ augmente ; si n₁ augmente aussi, ce n'est plus vrai.
Ce que vit l'élève: formulation trop générale à retenir.
Correction proposée: « À n₁ et i₁ fixés, plus n₂ est grand, plus le rayon se rapproche de la normale. »
Certitude: Certain · Effort: petit

ID: SIM64-17
Gravité: Mineur · Grille: G (F-05, famille déjà connue) · Lieu: les six fiches, `RefractionFiches.jsx`
Extrait: en-tête : `textes ≥ 12,5 (≥ 9 px sur téléphone)` ; textes `fontSize="12.5"` partout.
Défaut: textes de fiche à 9,6 px rendus (minimum mesuré), alors que les fiches corrigées aujourd'hui pour SIM193, 196, 199 et 202 sont passées à 13-14.
Preuve: `rendu-SIM64.cjs` : min 9,6 px sur toutes les fiches ; aucun débordement ni chevauchement mesuré.
Ce que vit l'élève: lisible mais petit.
Correction proposée: passer à 13,5 et vérifier la largeur de chaque libellé (`controle-fiches.cjs 64`).
Certitude: Certain · Effort: petit

## 3. Doutes

- Défi « Déterminer un indice » : le tableau affiche la pente (« pente (liquide inconnu) = 1,47 ») à 2 décimales, qui est exactement la réponse attendue. Le défi se réduit à noter 3 mesures et recopier la pente. Soupçon : intention pédagogique à confirmer (le calcul n = sin i₁ / sin i₂ n'est plus exigé). Vérifier avec Nils si c'est voulu.
- Défi « indice », conseil de l'indice : « Fais plusieurs mesures, calcule n à chaque fois, puis fais la moyenne ». Avec la moyenne des rapports, 16 jeux sur 9 248 sont refusés pour n = 1,52 (pire écart 0,04 pour une tolérance de 0,03) ; avec la pente, 0 refus. Une mesure unique à 5° est refusée pour tous les liquides sauf n = 1,40 (écart de 0,04 à 0,09). Risque faible mais réel pour un élève qui mesure à petit angle.
- Étapes 3, 4 et 5 : le texte de l'étape donne déjà la règle que le qcm demande (« se rapproche de la normale », « sans être dévié »). Acceptable pour un cours dialogué ; à vérifier si l'intention est de faire trouver.
- Étape 3 : l'indice du qcm cite la loi n₁ sin i₁ = n₂ sin i₂ avant son introduction formelle (étape 7) ; progressivité à confirmer.

## 4. Ce qui est correct (RECALCULÉ)

- Étape `rapproche` : air → eau, 50° : sin i₂ = 0,766/1,33 = 0,576 → 35,17° (« seulement 35° ») ✓.
- Étape `ecarte` : plexi → air, 25° : 1,51 × sin 25° = 0,638 → 39,65° (« ≈ 40° ») ✓ ; angle limite plexi→air = sin⁻¹(1/1,51) = 41,47° ✓ (« 41,5° »).
- Étape `sinus` : 30° → 19,34° lu 19,5° ; 60° → 35,00° lu 35,0° ; sin 30°/sin 19,5° = 1,498 (« 1,50 ») ; sin 60°/sin 35,0° = 1,510 ✓.
- Étape `indice` : sin 60°/sin 35° = 0,8660/0,5736 = 1,5099 → vrai 1,51 (marge ± 0,03) ✓ ; pièges 1,71 (60/35 = 1,714), 0,66 (0,5736/0,8660 = 0,662) ✓ ; avec deux chiffres sur les sinus (0,87/0,57 = 1,526) : accepté.
- Étape `snell` : vrai 19,47 ✓ ; pièges 20 (30/1,5), 0,33, 48,59 (sin⁻¹(0,75)) ✓.
- Exemple de l'étape 8 : air → eau 40° : 0,643/1,33 = 0,483 → 28,9° ✓.
- Étape `compare` : pour tout couple de triplets d'angles (313 600), la pente affichée de l'eau sucrée est supérieure à celle de l'eau ✓.
- Étape `tir` : option « Non : l'indice augmente » correcte ✓.
- Défi « prévoir » : 5 × (angles) vérifiés, jamais d'angle proche de l'angle limite (exclusion `i1 >= lim - 3`), réponses `rapproche` / `ecarte` / `zero` cohérentes avec n₂ ≷ n₁ ✓.
- Défi « calcul » : 61 tirages, solution affichée : `sin i₂ = n₁ sin i₁ / n₂` recalculée ✓ ; aucun refus avec trois chiffres significatifs ✓.
- Défi « indice » : pente (3 à 5 points) toujours dans ± 0,02 de n pour les 5 liquides (9 248 jeux chacun) ✓ ; la valeur attendue est introuvable sans calcul ni pente : non, elle est trouvable.
- Fiches : FicheCalcAngle air → diamant 50° : sin i₂ = 0,3165 → 18,45° (« 18,5° ») ✓ ; FicheTotale : 20° → 31,1°, limites 41,5° / 48,8° / 24,4° ✓ ; aucun texte hors cadre ni chevauchement (`rendu-SIM64.cjs`).
- Pêcheur : 9 177 réglages, aucun NaN, loi de Snell vérifiée (résidu < 1e-6), angle maximal dans l'eau 47,5° < angle limite 48,8° ✓.
- Console : aucune erreur (parcours, ateliers, défis).

## 5. Limites

- Aucune lecture d'écran réelle sur ordinateur à 1280 px (rendu mesuré à 390 px uniquement ; la taille des schémas sur ordinateur n'a pas été vérifiée).
- La partie « lentille » de `optiqueModele.js` (L40-84) est utilisée par SIM65 : à auditer dans le rapport de cette simulation.
- Le choix pédagogique de l'ordre des étapes (une idée par étape) est jugé sur le texte, sans test auprès d'élèves.
- La valeur de référence du plexiglas (SIM64-12) n'a pas été confrontée à un manuel : à valider avec Nils.

## Suite : corrections faites (22/11/2026)
Bloquant et importants corrigés : réponse de l’étape 8 acceptée à ±2,6 % (19° accepté, 20° refusé avec message adapté) ; défi calcul accepté à max(2 %, 0,5°) près avec consigne de précision ; messages d’erreur distincts (sin i₂ donné, indices inversés, angles divisés, radians, trop grand/petit) pour calcul, indice et prévision ; fiche loi et étape 6 avec des exemples différents de la question ; schémas et textes agrandis (≥ 9,4 px rendus à 390 px) ; légende du pêcheur sortie du dessin. Mineurs : tirage jamais identique deux fois de suite, mesures à angles différents exigées, légende de la fiche indice. Non corrigés volontairement : SIM64-12 (indice du plexiglas) et SIM64-14 (pas de « verre »). Remarque : `recalc-SIM64.mjs` décrit l’ancien modèle de tolérance.
