# Rapport d'audit SIM66 — Spectres d'émission

Ré-audit du 22/11/2026 (le rapport d'origine avait été perdu). **Audit ciblé** : défis (code + recalculs par script), tâches numériques du parcours, rendu à 390 px (textes, débordements, captures), parcours rejoué automatiquement sans problème. Non relu ligne à ligne : les textes d'énoncé des étapes qcm.

Bilan : 0 Bloquant · 2 Important · 3 Mineur

## Important
- **SIM66-01 — Réponse en kelvins acceptée.** Étape « Lire la température d'une étoile » (485 nm → 5 700 °C, tolérance 8 %) : 5 975 (en K) est accepté (écart 4,8 %), alors que l'indice dit « des °C, pas des kelvins ». Même chose au défi « température » (±500 °C accepte T + 273). Correction : refuser un nombre plus proche de T + 273 que de T, avec le message « c'est en kelvins : retire 273 ». Effort XS.
- **SIM66-02 — Textes illisibles sur téléphone.** Bandeaux de spectre 700×56 : « 400 nm → 800 nm » et légendes à 4,1–4,5 px ; spectrogramme 700×250 : graduations 4,3 px, « ultraviolet/infrarouge » 4,7 px ; courbe de l'étape 6 : 6,9 px. Effort moyen.

## Mineur
- **SIM66-03 — Étiquettes de raies superposées** (étape 9) : zinc 467,8 / 472,4 / 480,7 et cadmium 480,0 / 508,0 ; « 1000 » dépasse de 1 px à droite du spectrogramme.
- **SIM66-04 — Valeurs d'étoiles du « cours »** : Sirius 8 000 °C et Rigel 10 000 °C, alors que les valeurs usuelles sont ≈ 9 700 °C et ≈ 11 800 °C ; décalage atmosphérique de 1 500 °C présenté comme « modèle simplifié » sans référence. À trancher par Nils (aligner ou dire dans les Hypothèses que ce sont des valeurs de cours).
- **SIM66-05 — Retour du défi « température » générique** (ne distingue ni K/°C ni λ relevée au lieu de T).

## Vérifié sans défaut
Valeurs recalculées : 485 nm → 5 702 °C ; sodium 589,3 nm (tolérance 1 %) ; défi « comparer » (écart ≥ 1 000 °C) ; « voir la solution » présent.
