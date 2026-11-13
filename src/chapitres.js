// ═══════════════════════════════════════════════════════════════════════════
//  CHAPITRES PAR NIVEAU : source unique du menu, du « chapitre en cours » d'une classe et des devoirs.
//
//  Un chapitre = un groupe du menu (2GT, 1G, TSTL, BTS) avec :
//   • (facultatif) une « rubrique » : intitulé qui regroupe plusieurs chapitres dans le menu (ex. TSTL : « Systèmes et procédés », « Ondes ») ;
//   • ses simulations (identifiants de src/App.jsx) ;
//   • les thèmes de la banque d'exercices « Je m'entraîne » qui s'y rattachent (champ « domaine » des exercices).
//  Hypothèses (discutables, modifiables ici) : la banque d'exercices n'a pas de niveau ; on rattache chaque thème au chapitre
//  du menu le plus proche. « Chimie » (dosages, Beer-Lambert, cinétique) sert à la fois la 1re spé et l'analyse en BTS.
//  Chaque thème avec des exercices doit figurer dans au moins un chapitre (vérifié par le test de src/chapitres.test.mjs).
//
//  Les identifiants (« tstl-fluides »…) sont enregistrés tels quels dans classes.chapitres (supabase/07) : ne pas les renommer.
// ═══════════════════════════════════════════════════════════════════════════
export const NIVEAUX_CHAPITRES = [
  { key: '2GT', label: '2GT' }, { key: '1G', label: '1G spé PC' }, { key: 'TSTL', label: 'TSTL' }, { key: 'BTS', label: 'BTS' },
];

export const CHAPITRES = [
  { id: '2gt-microscopique', niveau: '2GT', label: '⚛️ Modéliser la matière à l’échelle microscopique', sims: [57, 58], domaines: ['Matière à l’échelle microscopique'] },
  { id: '2gt-solutions', niveau: '2GT', label: '🧂 Solutions, dilution et mélanges', sims: [61, 62, 63], domaines: ['Solutions et concentration'] },
  { id: '2gt-lumiere', niveau: '2GT', label: '🔦 Lumière : réfraction, lentilles et spectres', sims: [64, 65, 66], domaines: ['Lumière'] },
  { id: '2gt-circuits', niveau: '2GT', label: '🔌 Circuits électriques, loi d’Ohm et capteurs', sims: [68, 69], domaines: ['Circuits électriques'] },
  { id: '2gt-forces', niveau: '2GT', label: '➡️ Modéliser une action par une force', sims: [59, 60, 67], domaines: ['Forces et principe d’inertie'] },
  { id: '2gt-mouvement', niveau: '2GT', label: '🚃 Décrire un mouvement', sims: [56], domaines: ['Mouvement et vitesse'] },

  { id: '1g-evolution', niveau: '1G', label: '⚗️ Suivi de l’évolution d’un système, siège d’une transformation', sims: [1, 2, 25, 10], domaines: ['Chimie'] },
  { id: '1g-champ', niveau: '1G', label: '🌍 Interactions fondamentales et notion de champ', sims: [51, 48, 49, 50], domaines: ['Interactions et champs'] },
  { id: '1g-cohesion', niveau: '1G', label: '🧪 Cohésion, solubilité et miscibilité', sims: [53], domaines: ['Cohésion et solubilité'] },
  { id: '1g-organique', niveau: '1G', label: '🧬 La chimie organique', sims: [102], domaines: ['Chimie organique'] },
  { id: '1g-electricite', niveau: '1G', label: '⚡ Aspects énergétiques des phénomènes électriques', sims: [70, 71, 72], domaines: ['Énergie électrique'] },
  { id: '1g-mouvement', niveau: '1G', label: '🚀 Mouvement d’un système', sims: [52], domaines: ['Mécanique'] },

  { id: 'tstl-signaux', niveau: 'TSTL', rubrique: 'Systèmes et procédés', label: '📡 Transmission de signaux numériques', sims: [8, 15, 33], domaines: ['Transmission de signaux numériques'] },
  { id: 'tstl-fluides', niveau: 'TSTL', rubrique: 'Systèmes et procédés', label: '💧 Transport des fluides', sims: [26, 27, 28, 17], domaines: ['Transport des fluides'] },
  { id: 'tstl-regulation', niveau: 'TSTL', rubrique: 'Systèmes et procédés', label: '⚙️ Régulation', sims: [5, 6], domaines: ['Régulation'] },
  { id: 'tstl-cristallisation', niveau: 'TSTL', rubrique: 'Systèmes et procédés', label: '❄️ Évaporation et cristallisation', sims: [7], domaines: ['Évaporation et cristallisation'] },
  { id: 'tstl-distillation', niveau: 'TSTL', rubrique: 'Systèmes et procédés', label: '🧪 Distillation', sims: [42, 41, 43], domaines: ['Distillation'] },
  { id: 'tstl-thermique', niveau: 'TSTL', rubrique: 'Systèmes et procédés', label: '🔥 Transferts thermiques', sims: [31, 32, 30, 89], domaines: ['Transferts thermiques', 'Machines thermiques'] },
  { id: 'tstl-mesure', niveau: 'TSTL', rubrique: 'Systèmes et procédés', label: '📏 Mesure et incertitudes', sims: [78], domaines: ['Mesure et incertitudes'] },
  { id: 'tstl-controle', niveau: 'TSTL', rubrique: 'Systèmes et procédés', label: '🧲 Contrôle des systèmes', sims: [46, 44, 45], domaines: ['Contrôle des systèmes'] },
  { id: 'tstl-ondes', niveau: 'TSTL', rubrique: 'Ondes', label: '🌊 Ondes', sims: [83, 84, 87, 88, 91], domaines: ['Ondes'] },
  { id: 'tstl-acides-bases', niveau: 'TSTL', rubrique: 'Chimie et développement durable', label: '🧪 Acides et bases', sims: [85], domaines: ['Acides et bases'] },
  { id: 'tstl-synthese-organique', niveau: 'TSTL', rubrique: 'Chimie et développement durable', label: '⚗️ Synthèse organique', sims: [86, 92], domaines: ['Synthèse organique', 'Mécanismes réactionnels'] },
  { id: 'tstl-synthese-optimiser', niveau: 'TSTL', rubrique: 'Chimie et développement durable', label: '📈 Optimiser une synthèse', sims: [90], domaines: ['Optimiser une synthèse'] },

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
