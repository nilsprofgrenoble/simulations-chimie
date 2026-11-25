// Modèle de la simulation 245 : travail ou transfert thermique, classer les phénomènes de transfert d'énergie (TSTL, PCM, Énergie).
// Modes : travail mécanique (force qui change la valeur de la vitesse), travail électrique (courant entre générateur et récepteur),
// transfert thermique par conduction (de proche en proche, tout état), par convection (mouvement macroscopique, liquides et gaz), par rayonnement (ondes électromagnétiques, sans matière).
// Situations génériques inventées (aucune situation du Moodle). Théorème de l'énergie cinétique : ΔEc = somme des travaux (programme de première).
export const MODES = [
  { id: 'meca', nom: 'Travail mécanique', type: 'W', court: 'travail mécanique' },
  { id: 'elec', nom: 'Travail électrique', type: 'W', court: 'travail électrique' },
  { id: 'cond', nom: 'Transfert thermique par conduction', type: 'Q', court: 'conduction' },
  { id: 'conv', nom: 'Transfert thermique par convection', type: 'Q', court: 'convection' },
  { id: 'ray', nom: 'Transfert thermique par rayonnement', type: 'Q', court: 'rayonnement' },
];
export const mode = id => MODES.find(m => m.id === id);
// Pourquoi tel mode (réponse attendue, une phrase) — sert aux corrections et à l'exploration
export const RAISON = {
  meca: 'une force s’exerce et fait varier la valeur de la vitesse : c’est un transfert par travail mécanique',
  elec: 'un courant électrique transfère l’énergie d’un générateur à un récepteur : c’est un travail électrique',
  cond: 'la chaleur se propage de proche en proche dans la matière, sans déplacement de matière : c’est la conduction',
  conv: 'de la matière (liquide ou gaz) se déplace et transporte la chaleur : c’est la convection',
  ray: 'l’énergie est transportée par des ondes électromagnétiques, sans besoin de matière : c’est le rayonnement',
};
// scene : clé du schéma ; de / vers : systèmes qui donnent / reçoivent l'énergie
export const SITUATIONS = [
  { id: 'poussee', scene: 'chariot', mode: 'meca', texte: 'Une main pousse un chariot, qui accélère.', de: 'la main', vers: 'le chariot' },
  { id: 'freins', scene: 'frein', mode: 'meca', texte: 'Des freins exercent une force sur une roue, qui ralentit.', de: 'la roue', vers: 'les freins' },
  { id: 'ressort', scene: 'ressort', mode: 'meca', texte: 'Un ressort comprimé se détend et lance une bille : la bille accélère.', de: 'le ressort', vers: 'la bille' },
  { id: 'moteur', scene: 'pile', mode: 'elec', texte: 'Une batterie fait tourner un petit moteur : un courant circule dans le circuit.', de: 'la batterie', vers: 'le moteur' },
  { id: 'resistance', scene: 'pile', mode: 'elec', texte: 'Un générateur alimente un résistor par un courant dans des fils.', de: 'le générateur', vers: 'le résistor' },
  { id: 'lampe', scene: 'pile', mode: 'elec', texte: 'Une pile alimente une lampe : un courant circule dans le circuit.', de: 'la pile', vers: 'la lampe' },
  { id: 'cuillere', scene: 'barre', mode: 'cond', texte: 'Une extrémité d’une barre de métal est plongée dans un liquide chaud ; l’autre extrémité chauffe peu à peu.', de: 'le liquide chaud', vers: 'la barre' },
  { id: 'contact', scene: 'melange', mode: 'cond', texte: 'Une plaque de métal posée sur une plaque plus chaude s’échauffe au contact.', de: 'la plaque chaude', vers: 'la plaque posée' },
  { id: 'cuve', scene: 'casserole', mode: 'conv', texte: 'Dans une cuve chauffée en dessous, l’eau chaude monte et l’eau froide descend.', de: 'le fond de la cuve', vers: 'l’eau de la cuve' },
  { id: 'souffle', scene: 'casserole', mode: 'conv', texte: 'Un appareil souffle de l’air chaud sur un objet, qui s’échauffe.', de: 'l’appareil', vers: 'l’objet' },
  { id: 'soleil', scene: 'soleil', mode: 'ray', texte: 'Une sonde dans l’espace est réchauffée par le Soleil, à travers le vide.', de: 'le Soleil', vers: 'la sonde' },
  { id: 'filament', scene: 'soleil', mode: 'ray', texte: 'Dans une enceinte où l’on a fait le vide, un filament chaud réchauffe la paroi.', de: 'le filament', vers: 'la paroi' },
  { id: 'glisse', scene: 'glisse', mode: 'meca', texte: 'Un chariot glisse sur le sol et ralentit à cause des frottements.', de: 'le chariot', vers: 'le sol' },
];
export const situation = id => SITUATIONS.find(s => s.id === id);
export const ec = (m, v) => 0.5 * m * v * v;
export const puissance = (E, dt) => Math.abs(E) / dt;

// Valeurs du parcours guidé : chariot freiné
export const PARCOURS = { m: 2.0, v0: 4.0, v1: 2.0, dt: 3.0 };
PARCOURS.W = ec(PARCOURS.m, PARCOURS.v1) - ec(PARCOURS.m, PARCOURS.v0);   // −12 J
PARCOURS.P = Math.abs(PARCOURS.W) / PARCOURS.dt;                           // 4,0 W

const tire = t => t[Math.floor(Math.random() * t.length)];
const melange = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export function tirageDefiA() {   // cinq situations à classer, au moins 4 modes différents
  let ids;
  do { ids = melange(SITUATIONS).slice(0, 5).map(s => s.id); } while (new Set(ids.map(i => situation(i).mode)).size < 4);
  return { type: 'classer', ids };
}
export function tirageDefiB() {   // chariot freiné ou poussé : travail algébrique et puissance
  let m, v0, v1;
  do { m = tire([1, 2, 4]); v0 = tire([2, 3, 4, 5, 6]); v1 = tire([1, 2, 3, 4, 5, 6]); } while (v1 === v0);
  const dt = tire([2, 4, 5]), W = ec(m, v1) - ec(m, v0);
  return { type: 'travail', m, v0, v1, dt, W, P: Math.abs(W) / dt };
}
