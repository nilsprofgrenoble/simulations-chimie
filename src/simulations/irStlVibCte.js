// Constantes des animations de vibration de la simulation 308 (infrarouge, TSTL).
// Hypothèses : modèle « deux atomes reliés par un ressort » qualitatif ; nombres d'onde = valeurs tabulées typiques ; animation ralentie.
export const MASSE_ATOME = { H: 1, C: 12, O: 16 };
export const LIAISONS_VIB = [
  { id: 'CH', nom: 'C–H (carbone saturé)', a: 'C', b: 'H', sigma: 2950, larg: 45, prof: 0.7 },
  { id: 'OH', nom: 'O–H (alcool)', a: 'O', b: 'H', sigma: 3350, larg: 200, prof: 0.8 },
  { id: 'CO', nom: 'C=O (cétone)', a: 'C', b: 'O', sigma: 1715, larg: 22, prof: 0.9 },
  { id: 'CC', nom: 'C=C (alcène)', a: 'C', b: 'C', sigma: 1650, larg: 28, prof: 0.6 },
];
export const liaisonVib = id => LIAISONS_VIB.find(l => l.id === id) ?? LIAISONS_VIB[0];
export const QCM_VIB = { options: ['plus énergétiques : leur σ est plus grand, donc leur E aussi', 'moins énergétiques : leur σ est plus grand, donc leur E plus faible', 'aussi énergétiques : toutes les liaisons absorbent la même énergie', 'plus énergétiques : leur longueur d’onde λ est plus grande'], bonne: 0 };
// Molécules proposées dans le volet d'exploration : vibrations seulement (la rotation reste hors programme de STL).
export const MOLS_VIB = ['H2O', 'CO2', 'HCl', 'N2'];
