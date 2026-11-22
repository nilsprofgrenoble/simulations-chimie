# Rapport d'audit SIM67 — L'ISS en chute libre

Ré-audit du 22/11/2026 (le rapport d'origine avait été perdu). **Audit ciblé** : défis (code + recalculs par script), tâches numériques du parcours, rendu à 390 px (textes, débordements, captures), parcours rejoué automatiquement sans problème. Non relu ligne à ligne : les textes d'énoncé des étapes qcm.

Bilan : 0 Bloquant · 3 Important · 1 Mineur

## Important
- **SIM67-01 — Contradiction à l'écran.** `ISS.jsx` L107 affiche toujours « la cabine est en mouvement » en vue depuis le sol, y compris pour la cabine posée / « cabine immobile (câble tenu) » (étape 3 « Une cabine immobile ») : deux phrases opposées sur le même schéma. Correction : dépendre de `tombe`. Effort XS.
- **SIM67-02 — Défi « Régler l'orbite » presque injouable au doigt.** Vitesses acceptées : fenêtre de 0,07 à 0,09 km/s (circulaire si écart apogée–périgée ≤ 150 km), curseur de 0 à ≈ 8,5 km/s au pas de 0,01 : la zone gagnante fait ≈ 3 px sur téléphone. Correction : écart toléré 300 km (fenêtre 0,14–0,17 km/s, vérifiée par script) et/ou boutons ± 0,05 km/s. Effort XS.
- **SIM67-03 — Textes trop petits** : schéma d'ouverture 700×390 à 260 px, légendes « rouge : gravité · bleu : vitesse », « Terre à l'échelle… » à 7,4 px.

## Mineur
- **SIM67-04 — Retours de défis génériques** pour « poids » (pas de distinction poids au sol 686 N / g seul / division) alors que l'étape correspondante a ses pièges.

## Vérifié sans défaut
Poids m × g à ±2 % : l'erreur de lecture de g à 0,1 près ne dépasse pas 0,7 % (script) ; réponse 608 N (70 kg, 400 km) ; « voir la solution » présent. Fausses alertes du contrôle de rendu (graduations 0 m…110 m vues comme superposées) : vérifié sur capture, pas de chevauchement.

## Suite : corrections faites (22/11/2026)
SIM67-01 corrigé (« la cabine tombe » / « la cabine ne bouge pas »). SIM67-02 corrigé (écart apogée–périgée toléré 300 km : fenêtre ≈ 0,15 km/s au lieu de 0,08). SIM67-03 corrigé (légendes à ≈ 8,9 px rendus au lieu de 7,4). SIM67-04 corrigé (défi poids : poids au sol, g recopié, division, trop grand/petit).
