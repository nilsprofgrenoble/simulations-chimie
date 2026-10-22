// ====================================================
//  MISSION KEPLER : logique de l'escape game (sans React, testable seule).
//  Une épreuve = le défi « principal » d'une simulation existante (clé « <id>:defi.principal »). La mission lit la date de
//  réussite de chaque défi (suivi.js, CLE_HORODATAGE) : seules comptent les réussites obtenues APRÈS le début de la partie.
//  Quatre modules à réparer en parallèle donnent chacun un chiffre ; les quatre chiffres forment le code du verrou d'amarrage,
//  qui ouvre la salle de contrôle (épreuve finale).
// ====================================================
export const DUREE_MIN = 55;            // durée du mode « classe »
export const MALUS_INDICE_S = 180;      // un indice coûte 3 minutes en mode classe
export const MALUS_CODE_S = 60;         // un code refusé coûte 1 minute en mode classe

export const cleDefi = sim => `${sim}:defi.principal`;

export const MODULES = [
  { id: 'orientation', sim: 45, nom: 'Orientation de l’antenne', court: 'Antenne', base: 7,
    panne: 'L’antenne principale ne suit plus la Terre : le moteur pas à pas de son axe perd des pas dès qu’on le pousse.',
    mission: 'Reprogrammez le moteur : il doit tourner le plus vite possible sans jamais perdre un pas.',
    indices: ['Le rotor a besoin d’un peu de temps pour rejoindre chaque position : si le délai entre deux pas est trop court, il se laisse dépasser par le champ.',
      'Cherche le plus petit délai qui fonctionne : réduis-le par petits pas jusqu’à voir apparaître des pas perdus, puis remonte d’un cran.'] },
  { id: 'thermique', sim: 30, nom: 'Contrôle thermique', court: 'Thermique', base: 3,
    panne: 'Le circuit de refroidissement des batteries dérive : l’échangeur ne suffit plus à évacuer la chaleur.',
    mission: 'Faites les calculs de l’échangeur (températures, débit, surface) pour retrouver le bon fonctionnement.',
    indices: ['Ce que le fluide chaud perd, le fluide froid le gagne (aux pertes près) : écris le bilan de puissance du côté où tu connais toutes les données.',
      'La puissance échangée se calcule avec P = U·S·ΔT_m : trouve d’abord ΔT_m à partir des températures d’entrée et de sortie, puis isole la grandeur demandée.'] },
  { id: 'eau', sim: 41, nom: 'Recyclage de l’eau', court: 'Eau', base: 9,
    panne: 'Le recycleur d’eau doit séparer un mélange à bord, mais ses colonnes ne sont plus réglées.',
    mission: 'Prévoyez les températures et les compositions de la distillation pour relancer le recycleur.',
    indices: ['La vapeur est plus riche que le liquide en constituant le plus volatil, celui qui bout le plus bas.',
      'Observe dans la simulation comment la composition de la vapeur et la température évoluent quand tu chauffes, avant de répondre aux questions.'] },
  { id: 'reservoir', sim: 5, nom: 'Réservoir principal', court: 'Réservoir', base: 4,
    panne: 'Le niveau du réservoir principal dérive : la consommation de l’équipage change et le régulateur n’arrive plus à suivre.',
    mission: 'Reprenez la régulation du niveau pour qu’il reste près de la consigne.',
    indices: ['Un régulateur proportionnel laisse toujours un écart statique : un gain plus grand le réduit, mais risque de provoquer des oscillations.',
      'Pour annuler l’écart, ajoute l’action intégrale, puis ajuste son temps pour éviter les dépassements.'] },
];

export const CONTROLE = { id: 'controle', sim: 78, nom: 'Salle de contrôle', court: 'Contrôle',
  panne: 'Toutes les chaînes sont réparées. Il reste à valider la dernière mesure de télémétrie avant l’envoi à la Terre.',
  mission: 'Écrivez le résultat de la mesure avec son incertitude-type, selon les règles d’écriture.',
  indices: ['L’incertitude-type de la moyenne vaut u = s/√n.',
    'Arrondis u à 2 chiffres significatifs si le premier chiffre est 1, 2, 3 ou 4, à 1 seul s’il est 5 à 9, puis écris le résultat avec le même nombre de décimales que u.'] };

// Chiffre donné par le module i (0 à 3) : dépend du numéro de groupe (0 = pas de groupe) pour que deux groupes n'aient pas le même code
export const chiffre = (i, groupe = 0) => (MODULES[i].base + groupe * (2 * i + 3)) % 10;
export const codeAttendu = (groupe = 0) => MODULES.map((_, i) => chiffre(i, groupe)).join('');

export const nouvellePartie = (mode, groupe, maintenant = Date.now()) => ({ debut: maintenant, mode, groupe, indices: {}, codeEssais: 0, codeOkAt: null, fin: null });

// Un module est réparé si son défi a été réussi après le début de la partie
export const reparee = (partie, horodatages, sim) => !!partie && (horodatages?.[cleDefi(sim)] ?? 0) >= partie.debut;
export const nbReparees = (partie, horodatages) => MODULES.filter(m => reparee(partie, horodatages, m.sim)).length;
export const controleReussi = (partie, horodatages) => !!partie?.codeOkAt && (horodatages?.[cleDefi(CONTROLE.sim)] ?? 0) >= partie.codeOkAt;

// Malus (en secondes) : indices demandés et codes refusés ; sans effet en mode libre
export const malus = partie => !partie || partie.mode !== 'classe' ? 0
  : MALUS_INDICE_S * Object.values(partie.indices || {}).reduce((s, n) => s + n, 0) + MALUS_CODE_S * (partie.codeEssais || 0);
export const nbIndices = partie => Object.values(partie?.indices || {}).reduce((s, n) => s + n, 0);
export const ecoule = (partie, maintenant) => Math.max(0, Math.floor(((partie.fin ?? maintenant) - partie.debut) / 1000));
export const restant = (partie, maintenant) => DUREE_MIN * 60 - ecoule(partie, maintenant) - malus(partie);
export const mmss = s => { const a = Math.abs(Math.round(s)); return `${s < 0 ? '−' : ''}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`; };
