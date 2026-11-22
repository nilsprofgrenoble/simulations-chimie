# Rapport d'audit SIM69 — Loi d'Ohm, caractéristique et capteur résistif

Ré-audit du 22/11/2026 (le rapport d'origine avait été perdu). **Audit ciblé** : défis (code + recalculs par script), tâches numériques du parcours, rendu à 390 px (textes, débordements, captures), parcours rejoué automatiquement sans problème. Non relu ligne à ligne : les textes d'énoncé des étapes qcm.

Bilan : 0 Bloquant · 2 Important · 1 Mineur

## Important
- **SIM69-01 — Textes trop petits** : montage 5,8–6,5 px ; graphes (graduations) 6,8–7,9 px ; étape 11 (fiche d'étalonnage) : ① « R lu » recouvre ② « courbe ».
- **SIM69-02 — Défi « Point de fonctionnement » : lecture à ±2 px.** Axe horizontal 0–600 mA alors que I vaut 57 à 233 mA (E = 6 V, R = 100 Ω : I = 56,6 mA, tolérance 8 % = ±4,5 mA, soit ±1,6 px sur téléphone à 215 px pour 600 mA). Correction : adapter l'axe au tirage (xmax ≈ E/Rp) ou tolérance max(8 %, 10 mA). Effort S.

## Mineur
- **SIM69-03 — Retours génériques** pour « Calculer R / I » : un oubli de conversion mA ↔ A (réponse ×1 000 ou ÷ 1 000) n'est pas repéré ; facile à diagnostiquer.

## Vérifié sans défaut
Recalcul par script : arrondi de I affiché sur R (≤ 0,27 % pour une tolérance de 3 %) ; capteur : θ retrouvé à ≤ 0,28 °C pour ±3 °C ; points de fonctionnement lampe (E, Rp) vérifiés (56,6 à 232,8 mA) ; « voir la solution » présent sur les 4 défis.

## Suite : corrections faites (22/11/2026)
SIM69-01 corrigé pour le montage et les graphes (≥ 8,3 px au lieu de 5,8–7,9) ; le recouvrement ① ⟷ ② de la fiche d'étalonnage (étape 11) n'a pas été traité. SIM69-02 corrigé (tolérance max(8 %, 10 mA)). SIM69-03 corrigé (défis R et I : conversion mA/A, ×1 000, tension ou intensité recopiée).
