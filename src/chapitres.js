// ═══════════════════════════════════════════════════════════════════════════
//  CHAPITRES PAR NIVEAU : source unique du menu, du « chapitre en cours » d'une classe et des devoirs.
//
//  Un chapitre = un groupe du menu (2GT, 1G, TG, TSTL, BTS) avec :
//   • (facultatif) une « rubrique » : intitulé qui regroupe plusieurs chapitres dans le menu (ex. TSTL : « SPCL · Systèmes et procédés », « SPCL · Ondes », « PCM ») ;
//   • ses simulations (identifiants de src/App.jsx) ;
//   • les thèmes de la banque d'exercices « Je m'entraîne » qui s'y rattachent (champ « domaine » des exercices).
//  Hypothèses (discutables, modifiables ici) : la banque d'exercices n'a pas de niveau ; on rattache chaque thème au chapitre
//  du menu le plus proche. « Chimie » (dosages, Beer-Lambert, cinétique) sert à la fois la 1re spé et l'analyse en BTS.
//  Chaque thème avec des exercices doit figurer dans au moins un chapitre (vérifié par le test de src/chapitres.test.mjs).
//
//  Les identifiants (« tstl-fluides »…) sont enregistrés tels quels dans classes.chapitres (supabase/07) : ne pas les renommer.
//  Un identifiant retiré (chapitres fusionnés) est simplement ignoré : le professeur rechoisit le chapitre de sa classe.
//  Un chapitre peut aussi porter une « sousRubrique » (intertitre léger sous la rubrique, ex. les trois entrées de « Systèmes et procédés »).
//  Dans le menu, chaque rubrique se replie ; seule celle qui contient la simulation affichée est dépliée à l'ouverture.
//  Règle : un chapitre = une partie du programme du niveau, pas une simulation ; une nouvelle simulation rejoint le chapitre existant du programme.
// ═══════════════════════════════════════════════════════════════════════════
export const NIVEAUX_CHAPITRES = [
  { key: '2GT', label: '2GT' }, { key: '1G', label: '1G spé PC' }, { key: 'TG', label: 'TG spé PC' }, { key: 'TSTL', label: 'TSTL' }, { key: 'BTS', label: 'Post-bac (BTS MDC / IUT)' },
];

// Simulations temporairement masquées du menu et de l'accueil (accessibles par ?sim=N) ; vide = tout est visible
export const SIMS_HORS_MENU = new Set([]);

export const CHAPITRES = [
  { id: '2gt-microscopique', niveau: '2GT', rubrique: 'Constitution et transformations de la matière', label: '⚛️ Modéliser la matière à l’échelle microscopique', sims: [57, 58, 178], domaines: ['Matière à l’échelle microscopique', 'Quantité de matière (2GT)'] },
  { id: '2gt-solutions', niveau: '2GT', rubrique: 'Constitution et transformations de la matière', label: '🧂 Solutions, dilution et mélanges', sims: [61, 62, 63, 196, 197, 198], domaines: ['Solutions et concentration', 'Corps purs et mélanges (2GT)', 'Chromatographie sur couche mince (2GT)', 'Tests chimiques (2GT)'] },
  { id: '2gt-transformation-chimique', niveau: '2GT', rubrique: 'Constitution et transformations de la matière', label: '🔥 Modéliser une transformation chimique par une réaction', sims: [179, 180], domaines: ['Équation de réaction (2GT)', 'Réactif limitant (2GT)'] },
  { id: '2gt-forces', niveau: '2GT', rubrique: 'Mouvement et interactions', label: '➡️ Modéliser une action par une force', sims: [59, 60, 140, 67], domaines: ['Forces et principe d’inertie'] },
  { id: '2gt-mouvement', niveau: '2GT', rubrique: 'Mouvement et interactions', label: '🚃 Décrire un mouvement', sims: [56], domaines: ['Mouvement et vitesse'] },
  { id: '2gt-lumiere', niveau: '2GT', rubrique: 'Ondes et signaux', label: '🔦 Lumière : réfraction, lentilles et spectres', sims: [64, 65, 66, 199, 200, 201], domaines: ['Lumière', 'Image par une lentille (2GT)', 'L’œil réduit (2GT)', 'Dispersion de la lumière (2GT)'] },
  { id: '2gt-mesure', niveau: '2GT', rubrique: 'Mesure et incertitudes', label: '📏 Mesurer et exprimer un résultat', sims: [193, 194], domaines: ['Variabilité de la mesure (2GT)', 'Incertitude-type et résultat (2GT)'] },
  { id: '2gt-transformation-physique', niveau: '2GT', rubrique: 'Constitution et transformations de la matière', label: '🧊 Modéliser une transformation physique', sims: [195], domaines: ['Changement d’état (2GT)'] },
  { id: '2gt-son', niveau: '2GT', rubrique: 'Ondes et signaux', label: '🔊 Émettre et percevoir un son', sims: [190, 191, 192], domaines: ['Signal sonore : période et fréquence (2GT)', 'Niveau sonore (2GT)', 'Son : émission et propagation (2GT)'] },
  { id: '2gt-circuits', niveau: '2GT', rubrique: 'Ondes et signaux', label: '🔌 Circuits électriques, loi d’Ohm et capteurs', sims: [68, 69], domaines: ['Circuits électriques'] },

  { id: '1g-evolution', niveau: '1G', rubrique: 'Constitution et transformations de la matière', label: '⚗️ Suivi de l’évolution d’un système, siège d’une transformation', sims: [152, 153, 156, 1, 2, 25, 10], domaines: ['Chimie', 'Titrage direct', 'Oxydo-réduction : couples, demi-équations et équation de réaction', 'Quantité de matière : masse molaire et volume molaire', 'Concentration en quantité de matière : dissolution et dilution'] },
  { id: '1g-champ', niveau: '1G', rubrique: 'Mouvement et interactions', label: '🌍 Interactions fondamentales et notion de champ', sims: [51, 48, 49, 50], domaines: ['Interactions et champs'] },
  { id: '1g-fluide', niveau: '1G', rubrique: 'Mouvement et interactions', label: '💧 Fluide au repos', sims: [162, 163], domaines: ['Fluide au repos : pression et loi de Mariotte', 'Statique des fluides : pression et profondeur'] },
  { id: 'structure-entites', niveau: '1G', rubrique: 'Constitution et transformations de la matière', label: '🧩 De la structure à la polarité d’une entité', sims: [154, 155], domaines: ['Schéma de Lewis des molécules et des ions', 'Géométrie et polarité des entités'] },
  { id: '1g-cohesion', niveau: '1G', rubrique: 'Constitution et transformations de la matière', label: '🧪 Cohésion, solubilité et miscibilité', sims: [53, 158, 157], domaines: ['Cohésion et solubilité', 'Savons et amphiphilie', 'Dissolution d’un solide ionique : équation et concentration des ions'] },
  { id: '1g-combustions', niveau: '1G', rubrique: 'Constitution et transformations de la matière', label: '🔥 Combustions : énergie de réaction et énergies de liaison', sims: [159], domaines: ['Combustions : énergie de réaction et énergies de liaison'] },
  { id: '1g-organique', niveau: '1G', rubrique: 'Constitution et transformations de la matière', label: '🧬 La chimie organique', sims: [102, 111], domaines: ['Chimie organique'] },
  { id: '1g-synthese', niveau: '1G', rubrique: 'Constitution et transformations de la matière', label: '🧫 Synthèse organique : protocole, rendement et contrôle', sims: [109, 112], domaines: ['Synthèse et rendement'] },
  { id: '1g-electricite', niveau: '1G', rubrique: 'L’énergie : conversions et transferts', label: '⚡ Aspects énergétiques des phénomènes électriques', sims: [70, 71, 72], domaines: ['Énergie électrique'] },
  { id: '1g-energie-meca', niveau: '1G', rubrique: 'L’énergie : conversions et transferts', label: '🎢 Aspects énergétiques des phénomènes mécaniques', sims: [106, 107, 108], domaines: ['Mécanique'] },
  { id: '1g-mouvement', niveau: '1G', rubrique: 'Mouvement et interactions', label: '🚀 Mouvement d’un système', sims: [52], domaines: ['Mécanique'] },
  { id: 'ondes-meca', niveau: '1G', rubrique: 'Ondes et signaux', label: '🌊 Ondes mécaniques', sims: [150, 151], domaines: ['Ondes mécaniques : célérité et retard', 'Ondes mécaniques périodiques'] },
  { id: '1g-couleurs', niveau: '1G', rubrique: 'Ondes et signaux', label: '🎨 Couleurs : lumières, filtres et couleur des objets', sims: [160], domaines: ['Couleurs : synthèses additive et soustractive, couleur des objets'] },
  { id: '1g-lentille', niveau: '1G', rubrique: 'Ondes et signaux', label: '🔍 Image donnée par une lentille mince', sims: [115], domaines: ['Lentille mince'] },
  { id: '1g-mesure', niveau: '1G', rubrique: 'Mesure et incertitudes', label: '📏 Mesure et incertitudes', sims: [161], domaines: ['Mesure et incertitudes (1G)'] },
  { id: '1g-lumiere', niveau: '1G', rubrique: 'Ondes et signaux', label: '🌈 Modèles de la lumière', sims: [164, 165], domaines: ['Domaines spectraux et énergie d’un photon', 'Niveaux d’énergie : absorption, émission et spectres de raies'] },

  // TG : un chapitre = une partie numérotée du programme de terminale (la rubrique est le thème du programme) ; plusieurs simulations par chapitre.
  { id: 'tg-composition', niveau: 'TG', rubrique: 'Constitution et transformations de la matière', label: '🧪 Déterminer la composition d’un système par des méthodes physiques et chimiques', sims: [121, 119, 135, 136, 169, 170, 188], domaines: ['Transferts de H⁺ : acides carboxyliques, amines et leurs formes conjuguées', 'pH et concentration en ions oxonium', 'Titrage pH-métrique', 'Conductimétrie : conductivité et titrage', 'Conductimétrie : étalonnage et conductance', 'Spectroscopie UV-visible et loi de Beer-Lambert', 'Spectroscopie infrarouge : données tabulées'] },
  { id: 'tg-evolution-temporelle', niveau: 'TG', rubrique: 'Constitution et transformations de la matière', label: '⏱️ Modéliser l’évolution temporelle d’un système, siège d’une transformation', sims: [122, 123, 184, 186, 187], domaines: ['Cinétique : vitesse volumique et ordre 1', 'Radioactivité : décroissance et demi-vie', 'Radioactivité : diagramme (N, Z) et équations de désintégration', 'Mécanismes réactionnels et flèches courbes', 'Facteurs cinétiques, catalyse et choix d’un capteur'] },
  { id: 'tg-etat-final', niveau: 'TG', rubrique: 'Constitution et transformations de la matière', label: '⚖️ Prévoir l’état final d’un système, siège d’une transformation chimique', sims: [125, 129, 130, 131, 132, 133, 134], domaines: ['Équilibre chimique : Qr, K et taux d’avancement', 'Force des acides et des bases : Ka et tampon', 'Acides α-aminés : forme selon le pH', 'Piles : fonctionnement et capacité', 'Électrolyse : forcer le sens d’évolution'] },
  { id: 'tg-synthese', niveau: 'TG', rubrique: 'Constitution et transformations de la matière', label: '🧫 Élaborer des stratégies en synthèse organique', sims: [172, 173, 189, 210], domaines: ['Formules topologiques et isomérie de constitution', 'Familles fonctionnelles et polymères', 'Optimisation d’une étape de synthèse : vitesse et rendement', 'Stratégie de synthèse multi-étapes et synthèses écoresponsables'] },
  { id: 'tg-decrire-mouvement', niveau: 'TG', rubrique: 'Mouvement et interactions', label: '🎡 Décrire un mouvement', sims: [166, 167], domaines: ['Vecteurs vitesse et accélération', 'Mouvement circulaire et repère de Frenet'] },
  { id: 'tg-newton', niveau: 'TG', rubrique: 'Mouvement et interactions', label: '🛗 Relier les actions appliquées à un système à son mouvement', sims: [168, 175, 176, 177], domaines: ['Deuxième loi de Newton', 'Mouvement dans un champ de pesanteur uniforme', 'Particule chargée dans un condensateur plan', 'Satellites et lois de Kepler'] },
  { id: 'tg-ondes', niveau: 'TG', rubrique: 'Ondes et signaux', label: '🌊 Caractériser les phénomènes ondulatoires', sims: [116, 181, 182, 183, 211], domaines: ['Ondes', 'Diffraction d’une onde : angle caractéristique', 'Trous d’Young et interfrange', 'Interférences de deux ondes : conditions constructives et destructives', 'Intensité sonore, niveau d’intensité et atténuation'] },
  { id: 'tg-images-photons', niveau: 'TG', rubrique: 'Ondes et signaux', label: '🔭 Former des images et décrire la lumière par un flux de photons', sims: [171], domaines: ['Lunette afocale : schéma, faisceau et grossissement'] },
  { id: 'tg-circuit-rc', niveau: 'TG', rubrique: 'Ondes et signaux', label: '🔌 Étudier la dynamique d’un système électrique', sims: [174], domaines: ['Circuit RC : charge et décharge d’un condensateur'] },
  { id: 'tg-gaz-parfait', niveau: 'TG', rubrique: 'L’énergie : conversions et transferts', label: '🎈 Décrire un système thermodynamique : le gaz parfait', sims: [215], domaines: ['Gaz parfait : équation d’état et limites du modèle'] },
  { id: 'tg-bilans-energie', niveau: 'TG', rubrique: 'L’énergie : conversions et transferts', label: '🔥 Effectuer des bilans d’énergie sur un système', sims: [212], domaines: ['Loi de Newton et thermostat : température d’un système au cours du temps'] },
  { id: 'tg-mesure', niveau: 'TG', rubrique: 'Mesure et incertitudes', label: '📏 Mesure et incertitudes', sims: [185], domaines: ['Incertitudes-types composées et comparaison à une valeur de référence'] },
  { id: 'tstl-pcm-structure-spatiale', niveau: 'TSTL', rubrique: 'PCM', label: '🫲 Structure spatiale des espèces chimiques', sims: [137, 145, 144], domaines: ['Chiralité et carbone asymétrique', 'Configuration absolue R/S', 'Stéréoisomères : énantiomères, diastéréoisomères, Z et E'] },
  { id: 'tstl-pcm-reactions-acido-basiques', niveau: 'TSTL', rubrique: 'PCM', label: '🧫 Réactions acido-basiques en solution aqueuse', sims: [138, 139, 141, 142, 143], domaines: ['Acide faible, coefficient de dissociation et Ka', 'pH, pKa et diagramme de prédominance', 'Solution tampon : choix du couple et préparation', 'CO₂ dissous : couples et solubilité', 'Extraction acide-base : choix du pH'] },
  { id: 'tstl-signaux', niveau: 'TSTL', rubrique: 'SPCL · Systèmes et procédés', sousRubrique: 'Flux d’information : analyse et contrôle', label: '📡 Transmission de signaux numériques', sims: [8, 15, 33], domaines: ['Transmission de signaux numériques'] },
  { id: 'tstl-mesure', niveau: 'TSTL', rubrique: 'SPCL · Systèmes et procédés', sousRubrique: 'Flux d’information : analyse et contrôle', label: '📏 Mesure et incertitudes', sims: [78], domaines: ['Mesure et incertitudes'] },
  { id: 'tstl-regulation', niveau: 'TSTL', rubrique: 'SPCL · Systèmes et procédés', sousRubrique: 'Flux d’information : analyse et contrôle', label: '⚙️ Régulation', sims: [5, 6], domaines: ['Régulation'] },
  { id: 'tstl-controle', niveau: 'TSTL', rubrique: 'SPCL · Systèmes et procédés', sousRubrique: 'Flux d’information : analyse et contrôle', label: '🧲 Contrôle des systèmes', sims: [46, 44, 45], domaines: ['Contrôle des systèmes'] },
  { id: 'tstl-thermique', niveau: 'TSTL', rubrique: 'SPCL · Systèmes et procédés', sousRubrique: 'Flux d’énergie : conversions et transferts', label: '🔥 Transferts thermiques', sims: [31, 32, 30, 89], domaines: ['Transferts thermiques', 'Machines thermiques'] },
  { id: 'tstl-fluides', niveau: 'TSTL', rubrique: 'SPCL · Systèmes et procédés', sousRubrique: 'Flux de matière : transport et transformation', label: '💧 Transport des fluides', sims: [26, 27, 28, 17], domaines: ['Transport des fluides'] },
  { id: 'tstl-cristallisation', niveau: 'TSTL', rubrique: 'SPCL · Systèmes et procédés', sousRubrique: 'Flux de matière : transport et transformation', label: '❄️ Évaporation et cristallisation', sims: [7], domaines: ['Évaporation et cristallisation'] },
  { id: 'tstl-distillation', niveau: 'TSTL', rubrique: 'SPCL · Systèmes et procédés', sousRubrique: 'Flux de matière : transport et transformation', label: '🧪 Distillation', sims: [42, 41, 43], domaines: ['Distillation'] },
  { id: 'tstl-ondes', niveau: 'TSTL', rubrique: 'SPCL · Ondes', label: '🌊 Ondes', sims: [83, 84, 87, 88, 91, 114], domaines: ['Ondes'] },
  { id: 'tstl-ondes-observer', niveau: 'TSTL', rubrique: 'SPCL · Ondes', label: '👁️ Des ondes pour observer : l’œil, la loupe, le microscope et la lunette', sims: [117, 118, 120], domaines: ['Œil et loupe', 'Microscope', 'Lunette astronomique'] },
  { id: 'tstl-acides-bases', niveau: 'TSTL', rubrique: 'SPCL · Chimie et développement durable', label: '🧪 Acides et bases', sims: [147, 148, 149, 85], domaines: ['Acides et bases'] },
  { id: 'tstl-synthese-organique', niveau: 'TSTL', rubrique: 'SPCL · Chimie et développement durable', label: '⚗️ Synthèse organique : mécanismes et optimisation', sims: [86, 92, 90], domaines: ['Synthèse organique', 'Mécanismes réactionnels', 'Optimiser une synthèse'] },

  // BTS : trois rubriques (Analyse, Synthèse, Formulation), chacune découpée en chapitres. Les anciens identifiants
  // « bts-analyse », « bts-organique », « bts-rmn », « bts-cristallo » et « bts-formulation » ont été retirés (ils restent
  // enregistrés en base : un chapitre inconnu est simplement ignoré, le professeur le rechoisit).
  // Analyse (référentiel S5)
  { id: 'bts-mesures', niveau: 'BTS', rubrique: 'Analyse', label: '📏 Mesures et fiabilité', sims: [9, 16], domaines: ['Métrologie'] },
  { id: 'bts-titrages', niveau: 'BTS', rubrique: 'Analyse', label: '⚡ Titrages et électrochimie', sims: [3, 29], domaines: ['Chimie'] },
  { id: 'bts-chromatographie', niveau: 'BTS', rubrique: 'Analyse', label: '💉 Chromatographie et spectrométrie de masse', sims: [12, 54, 55], domaines: ['Chimie'] },
  { id: 'bts-etalonnage', niveau: 'BTS', rubrique: 'Analyse', label: '📐 Dosages par étalonnage', sims: [11, 13], domaines: ['Chimie', 'Métrologie'] },
  { id: 'bts-rmn', niveau: 'BTS', rubrique: 'Analyse', label: '🧲 Spectroscopie RMN', sims: [75, 76], domaines: ['Spectroscopie RMN'] },
  { id: 'bts-cristallo', niveau: 'BTS', rubrique: 'Analyse', label: '🔷 Cristallographie', sims: [73, 74], domaines: ['Analyse cristallographique'] },
  // Synthèse (référentiel S6)
  { id: 'bts-selectivites', niveau: 'BTS', rubrique: 'Synthèse', label: '🎯 Régiosélectivité et sélectivités', sims: [93, 98, 99], domaines: ['Régiosélectivité (BTS)', 'Syn, anti et sélectivités (BTS)', 'Chimiosélectivité (BTS)'] },
  { id: 'bts-mecanismes', niveau: 'BTS', rubrique: 'Synthèse', label: '⚗️ Mécanismes et réactivité', sims: [95, 96, 97], domaines: ['Substitution ou élimination (BTS)', 'Addition du dibrome (BTS)', 'Types de réaction et transposition (BTS)'] },
  { id: 'bts-cinetique', niveau: 'BTS', rubrique: 'Synthèse', label: '📈 Cinétique et thermodynamique', sims: [94], domaines: ['Contrôle cinétique et thermodynamique (BTS)'] },
  // Formulation (référentiel S7)
  { id: 'bts-solubilite', niveau: 'BTS', rubrique: 'Formulation', label: '🔵 Solubilité et solvants', sims: [4], domaines: ['Formulation'] },
  { id: 'bts-films', niveau: 'BTS', rubrique: 'Formulation', label: '🎨 Films et séchage', sims: [14, 101], domaines: ['Formulation', 'Séchage'] },
  { id: 'bts-rheologie', niveau: 'BTS', rubrique: 'Formulation', label: '🧴 Rhéologie', sims: [100], domaines: ['Formulation', 'Rhéologie'] },
  { id: 'bts-tensioactifs', niveau: 'BTS', rubrique: 'Formulation', label: '🫧 Tensioactifs et émulsions', sims: [146], domaines: ['Tensioactifs : de la structure à la CMC'] },
  { id: 'bts-plans', niveau: 'BTS', rubrique: 'Formulation', label: '🔺 Plans d’expériences : plans de mélange et plans factoriels', sims: [128, 127, 126], domaines: ['Formulation', 'Plans'] },
];

export const MAX_CHAPITRES = 3;
export const ID_CHAPITRE = /^[a-z0-9]+(-[a-z0-9]+)*$/;      // identique à la règle du serveur (supabase/07)

export const chapitreDe = id => CHAPITRES.find(c => c.id === id) || null;
// Identifiants enregistrés → chapitres connus (un identifiant inconnu, par exemple retiré du site, est ignoré)
export const chapitresDe = ids => (ids || []).map(chapitreDe).filter(Boolean);
export const chapitresDuNiveau = niveau => CHAPITRES.filter(c => c.niveau === niveau);
export const domainesDe = chapitres => [...new Set(chapitres.flatMap(c => c.domaines))];
export const simsDe = chapitres => [...new Set(chapitres.flatMap(c => c.sims))];
// Chapitres qui contiennent une simulation / traitent un thème d'exercices (pour « situer » un élément)
export const chapitresDeSim = id => CHAPITRES.filter(c => c.sims.includes(id));
export const chapitresDuDomaine = d => CHAPITRES.filter(c => c.domaines.includes(d));

// Page d'accueil d'un chapitre (simulation 82, cachée du menu) : l'identifiant du chapitre voyage dans l'adresse (?chap=…)
export const ID_PAGE_CHAPITRE = 82;
export function allerChapitre(naviguer, id, depuis) {
  try { const u = new URL(window.location.href); u.searchParams.set('chap', id); if (depuis) u.searchParams.set('depuis', depuis); else u.searchParams.delete('depuis'); window.history.replaceState(null, '', u.toString()); } catch { /* adresse non modifiable */ }
  naviguer(ID_PAGE_CHAPITRE);
}

// La fonction de navigation de l'application, confiée ici pour que les boutons communs (onglet « Exercices ») puissent s'en servir
let naviguerApp = null;
export const confierNavigation = f => { naviguerApp = f; };
export const ouvrirExercicesDeSim = simId => { const c = chapitresDeSim(Number(simId))[0]; if (c && naviguerApp) { allerChapitre(naviguerApp, c.id, Number(simId)); window.scrollTo({ top: 0 }); } };
// Page « Mes fiches » (cartes « À retenir » collectionnées), cachée du menu : ouverte depuis Mon compte et depuis les cartes elles-mêmes
export const ID_PAGE_FICHES = 103;
export const ouvrirFiches = () => { if (naviguerApp) { naviguerApp(ID_PAGE_FICHES); window.scrollTo({ top: 0 }); } };
