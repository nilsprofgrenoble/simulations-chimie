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
  100: [/^rheo-/],                                                                                                      // Épaississants associatifs
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
  61: [/^(rho|conc)2/, /sol-(masse-double|volume-double|masse-conservee|saturation)/, /sol-masse-volumique-unite/],
  62: [/^conc2/, /sol-(dilution|dilutions|echelle)/],
  63: [/^rho2/, /sol-(huile-eau|saturation|masse-volumique)/],
  64: [/^(indice|snell)2/, /lum-(reflexion|air-eau|incidence|verre-air|indice-inverse|angle-refracte)/],
  65: [/lum-(lentille|image-infini|vergence)/],
  66: [/lum-(spectre|etoile|longueur-onde)/],
  68: [/cir-(serie|derivation|voltmetre|tension-serie|resistance-derivation|puissance)/],
  69: [/^ohm2/, /cir-ohm/],
  59: [/^poids2/, /frc-(masse-poids|poids-prop|actions|echelle|direction-poids|poids-pomme|poids-rover)/],
  60: [/frc-(objet-immobile|vitesse-constante|cycliste|glissement|parachutiste|reaction-sol|actions)/],
  67: [/^poids2/, /frc-(chute-sans-air|iss-flotte)/],
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
  110: [/(^|\.)ccm-/, /plausible\.ccm-/],
  109: [/(^|\.)syn-/, /plausible\.syn-/],
  108: [/mec-pointage/, /plausible\.mec-pointage/],
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
