# Suivi des simulations auditées et révisées

Fichier tenu à jour par Claude à chaque correctif issu de l'audit. Détail de l'audit (rapports, tableau complet) : `audit/SUIVI.md`.
Statuts : ✅ audité et corrigé · 🟨 audité, corrections en attente · ⬜ audit à refaire (rapport perdu) · — non audité.

## Simulations

| Sim | Titre | Audit | Corrections | Publié |
|---|---|---|---|---|
| 178 | Quantité de matière (2GT) | ✅ | Bouton « voir la solution » (défis balance et échantillon) ; marges annoncées corrigées ; puce « atome de sodium » → ion Na⁺ ; vocabulaire « tas » | 22/11/2026 (PR 776) |
| 179 | Équation de réaction (2GT) | ✅ | Bouton « voir la solution » (défis ajuster et quantité) | 22/11/2026 (PR 776) |
| 180 | Réactif limitant (2GT) | ✅ | Aucun défaut relevé (modèle du bouton « voir la solution ») | — |
| 190 | Signal sonore (2GT) | ✅ | Bouton « voir la solution » (défis lire et régler) ; marges annoncées corrigées | 22/11/2026 (PR 776) |
| 56 à 63 | 2GT mécanique et solutions | 🟨 | Rapports sur l'ordinateur de Nils, à intégrer ; voir famille F-01 | — |
| 64 à 69, 140 | 2GT optique, électricité, chute libre | ⬜ | Rapports perdus (SIM64 : 2 bloquants), à refaire | — |
| Autres | — | — | Non audités | — |

## Corrections transversales (familles de défauts)

| Famille | Description | État |
|---|---|---|
| F-08 | Défi sans « voir la solution » | ✅ 178, 179, 190 (22/11/2026) ; à rechercher dans les autres simulations |
| F-02 | Bonne réponse lisible dans le code de la page (`data-ok`, `data-vrai`) | ✅ Attributs n'apparaissant plus qu'en mode test (22/11/2026) |
| F-01 | Verdict recalculé sans nouveau clic | 🟨 SIM56, 58, 60, 62, 63 |
| F-03 à F-07 | Imports inutiles, plus de 6 cartes, textes SVG < 12 px, cibles tactiles, égalités non reproductibles | ⬜ à traiter selon les rapports |

## Journal
- 22/11/2026 : PR 776 (F-08 sur 178, 179, 190 + textes). Correctif F-02 sur tout le site (aide `attrTest` dans `src/commun.jsx`, lecture seule par `scripts/controle-parcours.cjs` en mode test).
