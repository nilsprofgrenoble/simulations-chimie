# Rapport d'audit SIM68 — Circuits électriques

Ré-audit du 22/11/2026 (le rapport d'origine avait été perdu). **Audit ciblé** : défis (code + recalculs par script), tâches numériques du parcours, rendu à 390 px (textes, débordements, captures), parcours rejoué automatiquement sans problème. Non relu ligne à ligne : les textes d'énoncé des étapes qcm.

Bilan : 0 Bloquant · 1 Important · 2 Mineur

## Important
- **SIM68-01 — Textes illisibles sur téléphone.** Schémas de circuit 560×320 à 262 px : « Pile », « R₁ = 100 Ω », « + », « − » à 5,6–6,5 px. Correction : polices ×1,6 ou viewBox réduit. Effort moyen.

## Mineur
- **SIM68-02 — Recouvrement visible à l'étape 6** : « maille 1 » se superpose à « ↑ sens du courant », et la zone grisée passe sous « nœud » (capture à 390 px).
- **SIM68-03 — Défis « tensions » et « intensités » : retour générique** (« Revois la loi des mailles… ») ; ne repère ni l'addition (E + U₁), ni la recopie de U₁ / I₁, alors que ces pièges sont traités dans le parcours.

## Vérifié sans défaut
Cohérence des données affichées et de la réponse (U₂ = E − U₁, I₂ = I − I₁ avec I et I₁ arrondis au mA : tolérance ±1 mA suffisante), tâches 5,5 V et 75 mA, « voir la solution » présent.

## Suite : corrections faites (22/11/2026)
SIM68-01 corrigé (étiquettes agrandies, 8,3–9 px au lieu de 5,6–6,5 ; schéma élargi à 600 pour loger les cadres). SIM68-02 corrigé (étiquette « maille » déplacée, « nœud » déplacé). SIM68-03 corrigé (défis tensions et intensités : E ou U₁ recopiés, addition, ampères au lieu de mA, trop grand/petit).
