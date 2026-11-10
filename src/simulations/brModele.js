// Addition de Br₂ sur un alcène : ion bromonium, addition anti, stéréospécificité.
// Résultats stéréochimiques classiques de cours (sans calcul d'énergie).
export const ALCENES = {
  cyclo: { cle: 'cyclo', nom: 'cyclohexène', R: 'cycle', produit: '1,2-dibromocyclohexane', config: 'trans', resultat: 'racémique', descripteurs: ['(1R,2R)', '(1S,2S)'], nbStereo: 2 },
  Z: { cle: 'Z', nom: '(Z)-but-2-ène', R: 'CH₃', produit: '2,3-dibromobutane', config: 'racémique de (2R,3R) et (2S,3S)', resultat: 'racémique', descripteurs: ['(2R,3R)', '(2S,3S)'], nbStereo: 2 },
  E: { cle: 'E', nom: '(E)-but-2-ène', R: 'CH₃', produit: '2,3-dibromobutane', config: 'méso', resultat: 'méso', descripteurs: ['(2R,3S)'], nbStereo: 1 },
};
export const activiteOptique = a => a.resultat === 'racémique' ? 'nulle (mélange racémique)' : 'nulle (composé méso, plan de symétrie)';
// Position des faces : le dibrome attaque par l'une ou l'autre face avec la même probabilité.
export const probaFace = 0.5;
