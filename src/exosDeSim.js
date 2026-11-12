// ════════════════════════════════════════════════════════════════════════════
//  QUELS EXERCICES DE REMÉDIATION VONT AVEC QUELLE SIMULATION (maillage fin)
//  Une simulation → des motifs qui reconnaissent l'identifiant de l'exercice (le code « ex » de la banque, ex. « prevoir.for-hansen-red »).
//  Pour rattacher un nouvel exercice à une simulation : ajouter un motif (ou le nom de l'exercice) à la ligne de la simulation.
//  Une simulation absente de cette table (ou sans exercice) renvoie vers la page de son chapitre, sans filtre.
// ════════════════════════════════════════════════════════════════════════════
export const EXOS_DE_SIM = {
  4: [/for-hansen-/],                                                                                          // Hansen
  14: [/for-(extrait-sec|cpv|cpvc|aspect-cpv|tmff|coalescent|sechage-latex|prise-huile)/, /for-val-extrait-sec/],   // Peinture à l'eau
  100: [/^rheo-/],                                                                                             // Épaississants associatifs
  101: [],                                                                                                     // Lasure alkyde (pas encore d'exercice dédié)
};
export const aDesExosPropres = simId => (EXOS_DE_SIM[simId] || []).length > 0;
export const exosDeSim = (exos, simId) => { const m = EXOS_DE_SIM[simId] || []; return m.length ? exos.filter(e => e.comp !== 'REA' && m.some(r => r.test(e.ex))) : []; };
