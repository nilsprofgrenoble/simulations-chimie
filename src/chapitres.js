// ═══════════════════════════════════════════════════════════════════════════
//  CHAPITRES PAR NIVEAU : source unique du menu, du « chapitre en cours » d'une classe et des devoirs.
//
//  Un chapitre = un groupe du menu (2GT, 1G, TSTL, BTS) avec :
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
  { id: '2gt-microscopique', niveau: '2GT', label: '⚛️ Modéliser la matière à l’échelle microscopique', sims: [57, 58], domaines: [] },
  { id: '2gt-solutions', niveau: '2GT', label: '🧂 Solutions, dilution et mélanges', sims: [61, 62, 63], domaines: [] },
  { id: '2gt-lumiere', niveau: '2GT', label: '🔦 Lumière : réfraction, lentilles et spectres', sims: [64, 65, 66], domaines: [] },
  { id: '2gt-circuits', niveau: '2GT', label: '🔌 Circuits électriques, loi d’Ohm et capteurs', sims: [68, 69], domaines: [] },
  { id: '2gt-forces', niveau: '2GT', label: '➡️ Modéliser une action par une force', sims: [59, 60, 67], domaines: [] },
  { id: '2gt-mouvement', niveau: '2GT', label: '🚃 Décrire un mouvement', sims: [56], domaines: ['Mouvement et vitesse'] },

  { id: '1g-evolution', niveau: '1G', label: '⚗️ Suivi de l’évolution d’un système, siège d’une transformation', sims: [1, 2, 25, 10], domaines: ['Chimie'] },
  { id: '1g-champ', niveau: '1G', label: '🌍 Interactions fondamentales et notion de champ', sims: [51, 48, 49, 50], domaines: ['Interactions et champs'] },
  { id: '1g-cohesion', niveau: '1G', label: '🧪 Cohésion, solubilité et miscibilité', sims: [53], domaines: [] },
  { id: '1g-electricite', niveau: '1G', label: '⚡ Aspects énergétiques des phénomènes électriques', sims: [70, 71, 72], domaines: [] },
  { id: '1g-mouvement', niveau: '1G', label: '🚀 Mouvement d’un système', sims: [52], domaines: ['Mécanique'] },

  { id: 'tstl-signaux', niveau: 'TSTL', label: '📡 Transmission de signaux numériques', sims: [8, 15, 33], domaines: ['Transmission de signaux numériques'] },
  { id: 'tstl-fluides', niveau: 'TSTL', label: '💧 Transport des fluides', sims: [26, 27, 28, 17], domaines: ['Transport des fluides'] },
  { id: 'tstl-regulation', niveau: 'TSTL', label: '⚙️ Régulation', sims: [5, 6], domaines: ['Régulation'] },
  { id: 'tstl-cristallisation', niveau: 'TSTL', label: '❄️ Évaporation et cristallisation', sims: [7], domaines: [] },
  { id: 'tstl-distillation', niveau: 'TSTL', label: '🧪 Distillation', sims: [42, 41, 43], domaines: [] },
  { id: 'tstl-thermique', niveau: 'TSTL', label: '🔥 Transferts thermiques', sims: [31, 32, 30], domaines: ['Transferts thermiques'] },
  { id: 'tstl-controle', niveau: 'TSTL', label: '🧲 Contrôle des systèmes', sims: [46, 44, 45], domaines: [] },

  // Analyse : électrochimie, chromatographie, étalonnage et quantification, fiabilité des mesures
  { id: 'bts-analyse', niveau: 'BTS', label: '🔬 Analyse', sims: [3, 29, 12, 54, 55, 11, 13, 9, 16], domaines: ['Chimie', 'Métrologie'] },
  { id: 'bts-rmn', niveau: 'BTS', label: '🧲 Spectroscopie RMN', sims: [75, 76], domaines: [] },
  { id: 'bts-cristallo', niveau: 'BTS', label: '🔷 Analyse cristallographique', sims: [74, 73], domaines: [] },
  { id: 'bts-formulation', niveau: 'BTS', label: '🧪 Formulation', sims: [4, 14], domaines: [] },
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
