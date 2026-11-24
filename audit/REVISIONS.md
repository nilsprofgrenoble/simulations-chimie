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
| 191 | Émission et propagation du son (2GT) | ✅ | Bouton « voir la solution » (défis mesurer et prévoir) ; message de succès du défi mesure : distance affichée en mètres | 22/11/2026 |
| 192 | Niveau sonore (2GT) | ✅ | Bouton « voir la solution » (défis classer et exposition) ; fiche « 0 : on entend à peine » | 22/11/2026 |
| 193 | Mesure : variabilité et écart-type (2GT) | ✅ | Bouton « voir la solution » (défi estimer ; défi comparer inchangé) ; marge des hypothèses corrigée | 22/11/2026 |
| 194 | Mesure : incertitude (2GT) | ✅ | Bouton « voir la solution » (défi écrire ; défi compatible inchangé) | 22/11/2026 |
| 195 | Changement d’état (2GT) | ✅ | Bouton « voir la solution » (deux défis) ; équation du défi situation révélée avec la solution | 22/11/2026 |
| 56 à 63 | 2GT mécanique et solutions | 🟨 | Rapports sur l'ordinateur de Nils, à intégrer ; voir famille F-01 | — |
| 64 | Réfraction : lois de Snell-Descartes (2GT) | ✅ | Ré-audit 22/11/2026 (1 bloquant, 6 importants, 10 mineurs) puis corrections faites le même jour : tolérance et précision des réponses, messages d’erreur du défi, exemples distincts des questions, schémas lisibles à 390 px, légende du pêcheur. Non corrigé volontairement : indice du plexiglas (1,51), pas de « verre » | — |
| 65 à 69, 140 | 2GT optique, électricité, chute libre | ✅ | Ré-audit 22/11/2026 : 0 bloquant, 9 importants, 8 mineurs (SIM140 : rien, un défaut annoncé était faux). Tout corrigé le même jour sauf : valeurs d'étoiles du cours (SIM66-04, à décider), recouvrement ①/② de la fiche d'étalonnage (SIM69), textes encore à 8,2–9 px sur quelques légendes | — |
| Autres | — | — | Non audités | — |

## Corrections transversales (familles de défauts)

| Famille | Description | État |
|---|---|---|
| F-05 / F-03 (lot du 24/11) | Textes de schémas < 9 px : SIM102 (indice), 108, 109, 111, 115 ; exports et variables inutiles (109, 108, 111, 112, 150, 152, 153, 154, 155) | ✅ 24/11/2026 (mesure réelle à 390 px : le schéma s'affiche à 230–260 px, pas 390) |
| F-08 | Défi sans « voir la solution » | ✅ 102, 178, 179, 190 à 195 (23/11/2026) ; à rechercher dans les autres simulations |
| F-02 | Bonne réponse lisible dans le code de la page (`data-ok`, `data-vrai`) | ✅ Attributs n'apparaissant plus qu'en mode test (22/11/2026) |
| F-01 | Verdict recalculé sans nouveau clic | 🟨 SIM56, 58, 60, 62, 63 |
| F-05 | Textes de fiches trop petits sur téléphone (12,5 → 13 à 14) : 193, 196, 199, 202 | ✅ 22/11/2026 |
| F-07 (193) | Axe fixe yMax: 10 qui écrêtait les barres de l'histogramme | ✅ axe calculé sur les séries (22/11/2026) |
| F-03 à F-07 | Imports inutiles, plus de 6 cartes, textes SVG < 12 px, cibles tactiles, égalités non reproductibles | ⬜ à traiter selon les rapports |

## Journal
- 24/11/2026 : lot du PDF du 23/11 (soir), blocs 1 à 12. Bloc 1 : le test `laboJournee.test.mjs` échouait pour deux raisons, pas une (import sans extension, puis fichier de simulation que Node ne sait pas lire) ; le calcul de la peinture est sorti dans `peintureModele.js` (Peinture.jsx le réexporte, rien ne change à l'écran) ; le test passe. Bloc 2 : indice de masse SIM102 12 → 14. Bloc 3 : SIM108 graphe des énergies refait (texte 21, mesuré 9,1 px), tolérance de la vitesse 3 % → 0,5 % (le piège « deux positions voisines » est maintenant refusé et reconnu), variables mortes retirées. Bloc 4 : SIM109 graphe de séchage refait (texte 24, mesuré 9,2 px), import T de Ccm.jsx retiré, onglet ① « produit brut (avant recristallisation) » au lieu de « recristallisé », fusion() plafonnée à 20 % d'impuretés (plus de températures négatives, curseur Kofler dans le cadre ; le panneau d'hypothèses le dit). Bloc 5 : SIM111 spectre refait (texte 21, hauteur 336, « empreinte / digitale » sur deux lignes, mesuré 9,1 px, rien ne sort du cadre), assertion du menthol réparée (valeur 2940 vérifiée). Blocs 6, 8, 9, 10, 11, 12 : exports morts retirés (extraction, ondes célérité, quantité de matière, concentration ×2, Lewis, atomes, géométrie ×3), homonymes vivants laissés. Bloc 7 : SIM115 textes de lecture doublés sur téléphone (règle, O, F/F′, A/B, objet, écran : mesuré 9,4 px), graduations tous les 10 cm sur téléphone, aria du défi « focale » : « distance focale inconnue ».
- 24/11/2026 : liste des défis (`defisDeclares.js`) : le générateur repartait de l'ancienne liste et ne supprimait jamais rien. Corrigé (`scripts/defis.mjs` repart d'une liste vide) ; sont partis les défis orphelins 110 (rf), 114 (focale, focvar, position), et aussi 85 (tampon), 124 (k, sens), 137 (cram, rs), 140 (ajout, prep), tous doublons de défis qui vivent sous un autre numéro (aucun code ne s'en servait).
- 24/11/2026 : constat de méthode : les consignes calculent la taille rendue avec 390 px de large ; les schémas s'affichent en réalité à 230–260 px (cartes avec marges). Mesure faite avec `audit/scripts/rendu-sim.cjs` : c'est elle qui fait foi. Restent sous 9 px, non touchés car jugés « sains » par l'audit : SIM108 film du pendule (7,8 et 8,2 px) et SIM109 fiches du TP (8,3 px).
- 22/11/2026 : PR 776 (F-08 sur 178, 179, 190 + textes). Correctif F-02 sur tout le site (aide `attrTest` dans `src/commun.jsx`, lecture seule par `scripts/controle-parcours.cjs` en mode test).
- 22/11/2026 : F-08 sur 191 et 192, correctifs C3 (unités du message de succès, 191) et C4 (fiche échelle, 192).
- 22/11/2026 : F-08 sur 193, 194, 195 ; C5 (marges des panneaux Hypothèses : 178, 190, 193).
- 23/11/2026 : F-05 sur les anciennes simulations 1G (textes des schémas ≥ 9 px sur téléphone) : sims 2, 10, 48, 49 (PR 791), puis 50, 51, 52, 53. Incident : le nettoyage F-03 avait retiré par erreur l'import des styles de l'accueil (corrigé PR 792) ; vérifier l'accueil après tout changement de masse.
- 23/11/2026 : F-03 sur tout le site (imports inutilisés retirés dans 53 fichiers, exports morts Barre et D_NACL) ; F-08 sur 102 (nomenclature : « voir la solution » pour les défis nom et formule brute).
- 23/11/2026 : suite F-05 : Avancement (SIM1) textes agrandis (schémas et fiches), fiche SIM69 (①/②/③ espacés), hypothèse des températures d'étoiles précisée (SIM66, Sirius/Rigel : valeurs du cours).
- 23/11/2026 : F-05 suite : SIM70 (débit de charges), SIM71 (puissance et effet Joule), SIM72 (pile réelle) : textes des schémas ≥ 9 px sur téléphone, mises en page refaites sans chevauchement (parcours rejoués, défis vérifiés, page d'accueil contrôlée). SIM102 mesurée propre, SIM106 saine : rien à faire.
- 23/11/2026 : consignes du PDF du 23/11 (midi) : SIM106 (défi « frott » : tirages sans descente écartés, 88 sur 120 conservés), SIM72 (F-04 : la question « r » donne maintenant 6,0 Ω, plus la valeur de la fiche), SIM70 (tolérance « électrons » 5 %), SIM107 (textes ≥ 9 px, import T masqué retiré), SIM48 (indice du défi « signes » aligné sur l'écran), re-export `epsilon` mort retiré (SIM10). Non retenu : AtelierChampBanque n'est PAS mort (importé par AtelierAnalyserBanque.js). Test des adresses réparé : descriptions des sims 9, 126, 127 et titres trop longs (troncature tenant compte du préfixe de niveau). Test `laboJournee.test.mjs` en échec avant ces corrections (sans lien), non traité.
- 22/11/2026 : passe « mineurs » : F-05 (193, 196, 199, 202), F-07 (193), test de typographie du prisme (201) réparé, import inutile (201), attribut et commentaire en trop (202). Non traité : scène `entreeDeux` définie mais jamais affichée (201), à trancher avec Nils.
- 22/11/2026 : ré-audit de la SIM64 (code + recalculs + rendu 390 px) : rapport `audit/rapports/SIM64.md`, scripts `audit/scripts/recalc-SIM64.mjs` et `rendu-SIM64.cjs`.
- 22/11/2026 : corrections SIM64 publiées (Refraction.jsx, RefractionFiches.jsx) ; défis rejoués à 390 px avec de mauvaises réponses : messages précis, aucune erreur console.
- 22/11/2026 : ré-audit ciblé de SIM65–69 et SIM140 (défis, recalculs par script, rendu 390 px) ; scènes `entreeDeux` (SIM201) et question `fusionFission` (SIM203) jugées non nécessaires : laissées telles quelles.
- 22/11/2026 : corrections SIM65–69 publiées (tailles de textes des schémas, kelvins refusés en SIM66, cabine SIM67, orbite plus jouable, messages de défis SIM67/68/69, tolérance du point de fonctionnement SIM69).
- 22/11/2026 : le déploiement des corrections SIM65-69 avait échoué deux fois (incident GitHub, pas le code) ; relancé par ce petit commit.
