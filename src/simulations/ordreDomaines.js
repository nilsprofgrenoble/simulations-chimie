// Hiérarchie commune des thèmes (programme de TSTL) : sert à classer les listes d'énoncés et de graphiques des ateliers « compétences ».
export const ORDRE_DOMAINES = [
  'Transmission de signaux numériques', 'Transport des fluides', 'Régulation', 'Transferts thermiques',
  'Évaporation et cristallisation', 'Distillation',
  'Mesure et incertitudes', 'Contrôle des systèmes', 'Chimie', 'Mécanique', 'Interactions et champs', 'Mouvement et vitesse', 'Métrologie',
];
// Regroupe une liste d'éléments {domaine, ...} par thème, dans l'ordre de la hiérarchie : [[domaine, [éléments]], ...]
export function parDomaine(liste) {
  const rang = d => { const i = ORDRE_DOMAINES.indexOf(d); return i < 0 ? 99 : i; };
  const m = new Map();
  [...liste].sort((a, b) => rang(a.domaine) - rang(b.domaine)).forEach(e => { if (!m.has(e.domaine)) m.set(e.domaine, []); m.get(e.domaine).push(e); });
  return [...m.entries()];
}
