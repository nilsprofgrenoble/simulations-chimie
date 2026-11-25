import { chapitresDeSim, domainesDe } from './chapitres.js';
// ════════════════════════════════════════════════════════════════════════════
//  QUELS EXERCICES DE REMÉDIATION VONT AVEC QUELLE SIMULATION (maillage fin)
//  Une simulation → des motifs qui reconnaissent l'identifiant de l'exercice (le code « ex » de la banque, ex. « prevoir.for-hansen-red »).
//  Pour rattacher un nouvel exercice à une simulation : ajouter un motif (ou le nom de l'exercice) à la ligne de la simulation.
//  Une simulation absente de cette table (ou sans exercice) renvoie vers la page de son chapitre, sans filtre.
// ════════════════════════════════════════════════════════════════════════════
export const EXOS_DE_SIM = {
  // ── BTS · Formulation ──
  4: [/for-hansen-/],                                                                                                 // Hansen
  14: [/for-(extrait-sec|cpv|cpvc|aspect-cpv|tmff|coalescent|sechage-latex|prise-huile)/, /for-val-extrait-sec/],         // Peinture à l'eau
  126: [/pmel-/],
  127: [/pfac-/],
  128: [/pfac-parallele/, /pmel-ecart-milieu-sens/],     // introduction : seuls les exercices sur l’interaction
  218: [/(^|\.)itt-/, /plausible\.itt-/],   // Thixotropie : le test 3ITT (BTS)
  217: [/(^|\.)rhc-/, /plausible\.rhc-/],   // Courbes d’écoulement et de viscosité : lire un rhéogramme (BTS)
  100: [/^rheo-/],                                                                                                      // Épaississants associatifs
  146: [/(^|\.)tens-/, /plausible\.tens-/],                                                                           // Tensioactifs : de la structure à la CMC
  220: [/(^|\.)chtens-/, /plausible\.chtens-/],   // Charge d’un tensioactif selon le pH (BTS)
  221: [/(^|\.)semul-/, /plausible\.semul-/],   // Sens de l’émulsion et épaississement (BTS)
  222: [/(^|\.)inst-/, /plausible\.inst-/],   // Instabilités des émulsions (BTS)
  223: [/(^|\.)hlb-/, /plausible\.hlb-/],   // HLB requis et mélange d’émulsifiants (BTS)
  224: [/(^|\.)susp-/, /plausible\.susp-/],   // Stabilité d’une suspension (BTS)
  225: [/(^|\.)disp-/, /plausible\.disp-/],   // Mouiller, disperser, stabiliser une suspension (BTS)
  226: [/(^|\.)mou-/, /plausible\.mou-/],   // Mousses : former, stabiliser, détruire (BTS)
  101: [/for-lasure-/],                                                                                                 // Lasure alkyde
  // ── BTS · Synthèse organique (un thème d'exercices par simulation) ──
  93: [/^regio-/], 94: [/^cinet-/], 95: [/^sn-/], 96: [/^br-/], 97: [/^tr-/], 98: [/^se-/], 99: [/^ch-/],
  // ── BTS · RMN et cristallographie ──
  75: [/rmn-(singulet|triplet|integration|deplacement|nombre|tms|champ|solvant|val|ethanal)/],
  76: [/rmn-(13c|cosy|hsqc)/],
  74: [/cri-(motifs|compacite|contact|masse-volumique|sites|taille|val-)/],
  73: [/cri-(bragg|distance-plans|extinctions)/],
  // ── BTS · Analyse ──
  13: [/met-ei-/],
  9: [/met-fid-/],
  16: [/met-apt-/],
  12: [/chr-(clhp|resolution)/],
  54: [/chr-(cpg|resolution)/],
  55: [/chr-sm/],
  11: [/relation\.dilution|beer|etalonnage|absorbance|etalon-nacl/],
  3: [/elc-/],
  29: [/iE-/],
  // ── 2GT ──
  57: [/^noyau/, /mic-(electrons|ion-|octet|masse-noyau|taille|masse-carbone)/],
  58: [/mic-(famille|gaz-nobles|octet)/],
  178: [/(^|\.)mol2gt-/, /plausible\.mol2gt-/],                                                                // Quantité de matière (2GT) : compter les entités et la mole
  190: [/(^|\.)son2gt-per-/, /plausible\.son2gt-per-/],                                                          // Signal sonore (2GT) : période, fréquence, hauteur et timbre
  179: [/(^|\.)eq2gt-/, /plausible\.eq2gt-/],                                                                      // Équation de réaction (2GT) : ajuster, états, charge, spectatrices, proportions
  61: [/^(rho|conc)2/, /sol-(masse-double|volume-double|masse-conservee|saturation)/, /sol-masse-volumique-unite/],
  180: [/rl2gt-/],
  197: [/(^|\.)ccm2gt-/, /plausible\.ccm2gt-/],                                                                    // Chromatographie sur couche mince (2GT) : lire, comparer, rapport frontal, limites
  202: [/(^|\.)noy2gt-/, /plausible\.noy2gt-/],                                                                    // Le noyau de l’atome : taille, masse et écriture ZAX (2GT)
  204: [/(^|\.)syn2gt-/, /plausible\.syn2gt-/],                                                                    // Synthèse et reflux (2GT) : montage à reflux, CCM de comparaison
  201: [/(^|\.)prisme2gt-/, /plausible\.prisme2gt-/],                                                                // Dispersion de la lumière par un prisme (2GT)
  196: [/(^|\.)pur2gt-/, /plausible\.pur2gt-/],                                                                    // Corps pur ou mélange : température de changement d’état (2GT)
  200: [/(^|\.)oeil2gt-/, /plausible\.oeil2gt-/],                                                                    // L’œil réduit (2GT) : image réelle, Thalès, netteté, accommodation
  203: [/(^|\.)nuc2gt-/, /plausible\.nuc2gt-/],                                                                // Transformation nucléaire (2GT) : isotopes, nature d’une transformation, fusion et fission
  195: [/(^|\.)etat2gt-/, /plausible\.etat2gt-/],                                                                // Changement d’état (2GT) : équation, sens du transfert, E = m × L
  199: [/(^|\.)img2gt-/, /plausible\.img2gt-/],                                                                    // Image réelle et grandissement avec une lentille convergente (2GT) : trois rayons, image, grandissement par les tailles et par Thalès
  198: [/(^|\.)test2gt-/, /plausible\.test2gt-/],                                                              // Tests chimiques (2GT) : eau, H₂, O₂, CO₂, identifier un gaz inconnu
  191: [/(^|\.)son2gt-emis-/, /plausible\.son2gt-emis-/],                                                    // Le son (2GT) : émission et propagation, vitesse du son
  62: [/^conc2/, /sol-(dilution|dilutions|echelle)/],
  63: [/^rho2/, /sol-(huile-eau|saturation|masse-volumique)/],
  64: [/^(indice|snell)2/, /lum-(reflexion|air-eau|incidence|verre-air|indice-inverse|angle-refracte)/],
  65: [/lum-(lentille|image-infini|vergence)/],
  66: [/lum-(spectre|etoile|longueur-onde)/],
  193: [/(^|\.)mes2gt-var-/, /plausible\.mes2gt-var-/],                                                           // Mesure : variabilité, histogramme, moyenne et écart-type (2GT)
  192: [/(^|\.)son2gt-niv-/, /plausible\.son2gt-niv-/],                                                           // Niveau sonore et dangers de l'exposition (2GT)
  194: [/(^|\.)mes2gt-inc-/, /plausible\.mes2gt-inc-/],                                                           // Mesure : incertitude-type et résultat (2GT)
  68: [/cir-(serie|derivation|voltmetre|tension-serie|resistance-derivation|puissance)/],
  69: [/^ohm2/, /cir-ohm/],
  59: [/^poids2/, /frc-(masse-poids|poids-prop|actions|echelle|direction-poids|poids-pomme|poids-rover|vecteur|hyp-vecteur|reciproques|distance-contact|liste-forces)/],
  60: [/frc-(objet-immobile|vitesse-constante|cycliste|glissement|parachutiste|reaction-sol|actions|support|inventaire|liste-forces)/],
  67: [/^poids2/, /frc-(chute-sans-air|iss-flotte)/],
  140: [/^chute2/, /frc-(dv-|sommet|chrono-uniforme|chute-sans-air|parachutiste|vitesse-constante)/],
  // ── 1re spé ──
  102: [/(^|\.)org-/],                                                                                         // Nomenclature et groupes caractéristiques
  1: [/avancement-max/, /^cinetique$/],
  2: [/relation\.dilution/, /^titrage$/, /aspirine/, /vinaigre/, /relation\.diacide/, /hypothese\.titrage/, /deux-methodes/],
  25: [/^titrage$/, /aspirine/, /hypothese\.titrage/, /avancement-max/],
  10: [/beer|absorbance|etalonnage|etalon-nacl/],
  51: [/electro\.0/, /ch-(signes|q-double)/, /coulomb/],
  48: [/poids-planete|g-pendule|gravi\.1/, /champ\./, /ch-(champ|force|altitude|masse-poids)/, /relation\.ch-(champ-g|force-champ)/, /poids-lune/],
  49: [/gravi\.0/, /electro\.0/, /ch-(d-double|m-double|q-double|reaction)/, /relation\.ch-(grav|coulomb)/, /hyp-newton/, /coulomb-cm|gravitation-eleves/],
  50: [/force-champ/, /electro\.1/, /champ\.(champ-uniforme|champ-force)/, /deux-gouttelettes/],
  71: [/^ener2/, /ene-(puissance|duree|joule|rendement|haute|kwh)/, /plausible\.ene-(batterie|kwh|rendement|joule)/],
  72: [/ene-(loi-mailles|pente|pile-reelle)/],
  114: [/(^|\.)dop-/, /plausible\.dop-/],
  116: [/(^|\.)dopg-/, /plausible\.dopg-/],
  119: [/(^|\.)titph-/, /plausible\.titph-/],
  121: [/(^|\.)phc-/, /plausible\.phc-/],
  122: [/(^|\.)cinv-/, /plausible\.cinv-/],
  123: [/(^|\.)rad-/, /plausible\.rad-/],
  184: [/(^|\.)rda-/, /plausible\.rda-/],                                                                           // Radioactivité : diagramme (N, Z) et équations de désintégration (TG)
  152: [/(^|\.)mol1g-qte-/, /plausible\.mol1g-qte-/],
  153: [/(^|\.)mol1g-conc-/, /plausible\.mol1g-conc-/],
  154: [/(^|\.)lewis1g-/, /plausible\.lewis1g-/],                                                              // Schéma de Lewis : établir celui d’une molécule ou d’un ion
  156: [/(^|\.)redox1g-/, /plausible\.redox1g-/],                                                                    // Oxydo-réduction : couples, demi-équations et équation de réaction
  155: [/(^|\.)geo1g-/, /plausible\.geo1g-/],
  160: [/(^|\.)coul1g-/, /plausible\.coul1g-/],                                                                        // Couleurs : synthèses additive et soustractive, couleur des objets
  158: [/(^|\.)savon1g-/, /plausible\.savon1g-/],                                                              // Savons et amphiphilie : pourquoi un savon lave
  157: [/(^|\.)diss1g-/, /plausible\.diss1g-/],                                                              // Dissolution d’un solide ionique : équation et concentration des ions
  163: [/(^|\.)fl1g-statique-/, /plausible\.fl1g-statique-/],                                                                // Statique des fluides : pression et profondeur
  161: [/(^|\.)mes1g-/, /plausible\.mes1g-/],                                                                  // Mesure et incertitudes : variabilité, types A et B
  164: [/(^|\.)phot1g-/, /plausible\.phot1g-/],                                                                  // Lumière : domaines spectraux et énergie d’un photon
  165: [/(^|\.)niv1g-/, /plausible\.niv1g-/],                                                                  // Niveaux d’énergie : absorption, émission et spectres de raies
  162: [/(^|\.)fl1g-pression-/, /plausible\.fl1g-pression-/],                                                  // Fluide au repos : pression, force pressante et loi de Mariotte
  159: [/(^|\.)comb1g-/, /plausible\.comb1g-/],                                                              // Combustions : équation, énergies de liaison, énergie de réaction, pouvoir calorifique
  125: [/(^|\.)equ-/, /plausible\.equ-/],
  129: [/(^|\.)fab-/, /plausible\.fab-/],
  130: [/(^|\.)pdi-/, /plausible\.pdi-/],
  131: [/(^|\.)tmp-/, /plausible\.tmp-/],
  134: [/(^|\.)aam-/, /plausible\.aam-/],
  135: [/(^|\.)cdt-/, /plausible\.cdt-/],
  136: [/(^|\.)etl-/, /plausible\.etl-/],
  170: [/(^|\.)irt-/, /plausible\.irt-/],
  173: [/(^|\.)pol-/, /plausible\.pol-/],
  167: [/(^|\.)fre-/, /plausible\.fre-/],
  171: [/(^|\.)lun-/, /plausible\.lun-/],                                                                           // Lunette afocale : schéma, faisceau, grossissement (TG)
  172: [/(^|\.)top-/, /plausible\.top-/],                                                                        // Formules topologiques et isomérie de constitution (TG)
  174: [/(^|\.)rc-/, /plausible\.rc-/],                                                                              // Circuit RC : charge et décharge d’un condensateur (TG)
  215: [/(^|\.)gpf-/, /plausible\.gpf-/],                                                                           // Gaz parfait : équation d’état et limites du modèle (TG)
  216: [/(^|\.)pp1-/, /plausible\.pp1-/],                                                                           // Premier principe : énergie interne, transferts et bilan d’énergie (TG)
  235: [/(^|\.)tht-/, /plausible\.tht-/],                                                                           // Transferts thermiques : modes, flux et résistance thermique (TG)
  236: [/(^|\.)ter-/, /plausible\.ter-/],                                                                           // Bilan thermique de la Terre : albédo, effet de serre (TG)
  212: [/(^|\.)thm-/, /plausible\.thm-/],                                                                           // Loi de Newton et thermostat : température d’un système au cours du temps (TG)
  214: [/(^|\.)ber-/, /plausible\.ber-/],                                                                           // Écoulement d’un fluide : débit, relation de Bernoulli et effet Venturi (TG)
  213: [/(^|\.)arc-/, /plausible\.arc-/],                                                                           // Poussée d’Archimède : origine, expression et flottaison (TG)
  168: [/(^|\.)nwt-/, /plausible\.nwt-/],
  175: [/(^|\.)pes-/, /plausible\.pes-/],                                                                           // Mouvement dans un champ de pesanteur uniforme (TG)
  185: [/(^|\.)icc-/, /plausible\.icc-/],                                                                           // Incertitudes-types composées et comparaison à une valeur de référence (TG)
  186: [/(^|\.)mrx-/, /plausible\.mrx-/],  // Mécanismes réactionnels et flèches courbes (TG)
  211: [/(^|\.)isn-/, /plausible\.isn-/],                                                                              // Intensité sonore, niveau d’intensité et atténuation (TG)
  189: [/(^|\.)opt-/, /plausible\.opt-/],                                                                           // Optimiser une étape de synthèse : vitesse et rendement (TG)
  210: [/(^|\.)str-/, /plausible\.str-/],                                                                           // Stratégie de synthèse multi-étapes, protection, synthèse écoresponsable (TG)
  188: [/(^|\.)brn-/, /plausible\.brn-/],   // Transferts de H⁺ : acides carboxyliques, amines (TG)
  186: [/(^|\.)mrx-/, /plausible\.mrx-/],   // Mécanismes réactionnels et flèches courbes (TG)
  187: [/(^|\.)cin-/, /plausible\.cin-/],    // Facteurs cinétiques, catalyse et choix d’un capteur (TG)
  183: [/(^|\.)itf-/, /plausible\.itf-/],                                                                           // Interférences de deux ondes (TG)
  176: [/(^|\.)cpl-/, /plausible\.cpl-/],                                                                           // Particule chargée dans un condensateur plan (TG)
  177: [/(^|\.)kep-/, /plausible\.kep-/],    // Satellites et lois de Kepler (TG)
  181: [/(^|\.)dif-/, /plausible\.dif-/],                                                                           // Diffraction d’une onde : angle caractéristique (TG)                                                                              // Satellites et lois de Kepler (TG)
  182: [/(^|\.)you-/, /plausible\.you-/],                                                                           // Trous d’Young et interfrange (TG)
  166: [/(^|\.)vac-/, /plausible\.vac-/],
  169: [/(^|\.)uvv-/, /plausible\.uvv-/],
  132: [/(^|\.)pil-/, /plausible\.pil-/],
  133: [/(^|\.)ely-/, /plausible\.ely-/],
  112: [/(^|\.)ext-/, /plausible\.ext-/],
  111: [/(^|\.)ir-/, /plausible\.ir-/],
  109: [/(^|\.)syn-/, /plausible\.syn-/, /(^|\.)ccm-/, /plausible\.ccm-/],
  108: [/mec-pointage/, /plausible\.mec-pointage/],
  117: [/oeil-/, /plausible\.oeil-/],                                                                                // L'œil et la loupe (TSTL)
  118: [/microsc-/, /plausible\.microsc-/],                                                                              // Le microscope (TSTL)
  137: [/(^|\.)chir-(asym|pas-asym|val-pentane|val-ethanol|ana-|miroir-distance|cram-liaisons|reperer|cram-bilan)/, /plausible\.chir-(val-pentane|val-ethanol)/],   // Chiralité et carbone asymétrique (TSTL, PCM)
  145: [/(^|\.)chir-(priorit|voisins|h-devant|miroir-R|halogenes|heteroatomes|configuration)/, /plausible\.chir-(val-h-devant|val-serine)/],   // Configuration absolue R/S (TSTL, PCM)
  138: [/(^|\.)dissoc-/, /plausible\.dissoc-/],                                                                      // Acide faible : α, Ka, pKa (TSTL, PCM)
  139: [/(^|\.)predo-/, /plausible\.predo-/],                                                                      // pH, pKa et prédominance (TSTL, PCM)
  143: [/(^|\.)extrac-/, /plausible\.extrac-/],
  227: [/(^|\.)pvc-/, /plausible\.pvc-/],
  228: [/(^|\.)pvr-/, /plausible\.pvr-/],
  229: [/(^|\.)pve-/, /plausible\.pve-/],
  230: [/(^|\.)las-/, /plausible\.las-/],
  231: [/(^|\.)bat-/, /plausible\.bat-/],
  232: [/(^|\.)jou-/, /plausible\.jou-/],
  144: [/(^|\.)stereo-/, /plausible\.stereo-/],
  142: [/(^|\.)co2dis-/, /plausible\.co2dis-/],
  // ── TSTL · Acides et bases (ancienne simulation 85 découpée en quatre, 19/11/2026)
  147: [/ab-(rel-ph-acide-faible|hyp-ph-acide-faible|dilution-acide-faible|acide-fort-faible-meme-c|ph-formule-base)/, /ab-acf-/],
  148: [/ab-(predominance-ph-pka|citrique-ph4)/, /relation\.diacide/, /ab-pred-/],
  149: [/ab-(rel-henderson|hyp-henderson|tampon-meme-ajout)/, /^abTampon/, /ab-tamp-/],
  85: [/ab-(choix-indicateur-acide-faible|demi-equivalence|pka-demi-equivalence|ph-equivalence-ok)/, /^titrage/, /hypothese\.titrage/, /^titrage-direct/, /ab-titr-/],
  141: [/(^|\.)tampstl-/, /plausible\.tampstl-/],                                                                  // Solution tampon : choix du couple et préparation (TSTL, PCM)
  120: [/lunet-/, /plausible\.lunet-/],                                                                              // La lunette astronomique (TSTL)
  151: [/ond1g-periode/, /plausible\.ond1g-periode/],                                                                // Ondes mécaniques : période, longueur d'onde (1G)
  115: [/lum1-/, /plausible\.lum1-/],                                                                                  // Lentille mince (1G)
  150: [/ond1g-celerite/, /plausible\.ond1g-celerite/],                                                          // Ondes mécaniques : célérité et retard (1G)
  107: [/mec-(em|epp|chute)/, /plausible\.mec-(epp|em)/],
  106: [/mec-(theoreme|travail|barriere|ec-)/, /plausible\.mec-/],
  // ── Terminale STL ──
  8: [/photoresistance|ctn|pont|eclairement|ur-|up-|ug-|r-augmente|echange-positions|n-(eclairement|plausible|hors)|sig-(gain|etalonnage)|modele-|arduino|algo|conforme-/],
  15: [/can|quantum|^(prevoir\.)?(bits|plage|fichier)/, /nb-valeurs|debit|n-hors|n-plausible|tension-can|sig-(moyenne|enregistreur)|repliement|echant|moyennage/],
  33: [/reponse-/, /^capteur$/, /sig-prev-rampe-retard/, /conforme-fumee/, /premord|premier-ordre|temps-reponse|tps-reponse|tr-modele|capteur-assez-rapide|prevoir\.reponse/],
  26: [/reservoir|flu-statique|manometre|statique|hauteur|vases|pression-cuve|tube-u|niveau|rho-eau/],
  27: [/flu-debit|flu-conv-debit|debit-2methodes|^conduite\.1|probleme\.cuve|flu-section\.2/],
  28: [/^conduite\.0|flu-section|retrecissement|conservation|diametre|probleme\.tuyau|vitesse-eau|cinetique|flu-venturi/],
  17: [/flu-pompe|^pompe$|relation\.pompe|p-hydraulique|pertes|bernoulli|torricelli|flu-jet/],
  5: [/regulP|commande-P|regulation-P|reg-pi|gain|soutirage|hysteresis|bande|equilibre|niveauTOR|erreur-statique|reg-/],
  6: [/regulP|equilibre|commande-P|regulation-P|ecart-acceptable|gain|erreur-statique|reg-ecart/],
  42: [/enrichissement|regle-leviers|plateaux|azeotrope|dist-simple-titre|bilan-residu|teb-melange/],
  41: [/teb-ethanol|distil|alambic|rendement-dist|dist-bilan|plateaux|reflux|pierre-ponce|tete-colonne|dist-volume|dist-simple|hydro|dist-pression/],
  43: [/refracto/, /distil-pur/],
  31: [/paroi|epaisseur|^prevoir\.surface|vitrage|therm-lambda|therm-prev-serie/],
  32: [/probleme\.chauffeeau|relation\.vaporiser|^prevoir\.masse|bouilloire|paroi\.0|therm-pertes|chauffer-eau|chauffage|resistance|therm-cuve|energie-chauffage|c-eau/],
  30: [/therm-prev-glace|therm-fusion-glace|echangeur|therm-cocourant|^plausible\.melange/],
  89: [/pac-|frigo|thermo-limite|chambrefroide/],
  46: [/champB|boussole|dipole|champ-aimant|distance-double|champ-terre|deviation|deux-mesures-champ/],
  44: [/moteurPas|vitesse-moteur|frequence-pas|pas-complet|delai-double|charge-pas-perdus|vitesse-limite|angle-pas|rotation-16|ctl-driver|bobine-chaude/],
  45: [/ctl-hyp-led|ctl-prev|ctrl-pwm|clignotement|delai-double|ctl-bobine-champ/],
  83: [/ondDiffraction|ond-.*diffraction|ond-diff|ond-fil|ond-cuve/],
  84: [/ondYoung|ondReseau|young|reseau|interferences|ond-spectro/],
  87: [/son-/],
  88: [/ech-/],
  91: [/e2d-/],
  86: [/^estRendement|est-/],
  92: [/^meca-/],
  // ── TSTL · Évaporation et cristallisation ──
  7: [/^cristal\.|crist-evaporateur|^solubilite$|cristaux-masse|plausible\.cristaux|relation\.solubilite-masse|rendement-crist|crist-evap-isotherme|crist-rendement-max|crist-bilan|crist-hyp-interpolation|crist-eau|crist-froid|crist-nacl-refroidir|crist-sursaturation-ok/],
};
export const aDesExosPropres = simId => (EXOS_DE_SIM[simId] || []).length > 0;
// Thèmes d'un autre chapitre qui concernent aussi la simulation (ex. temps de réponse d'un capteur : exercices de « Régulation »)
const DOMAINES_SUPPL = { 33: ['Régulation'] };
// Les exercices ne sont cherchés que parmi les thèmes du chapitre de la simulation (évite les homonymes d'un autre chapitre)
export const exosDeSim = (exos, simId) => {
  const m = EXOS_DE_SIM[simId] || [];
  if (!m.length) return [];
  const doms = [...domainesDe(chapitresDeSim(Number(simId))), ...(DOMAINES_SUPPL[simId] || [])];
  return exos.filter(e => e.comp !== 'REA' && doms.includes(e.domaine) && m.some(r => r.test(e.ex)));
};
