// ====================================================
//  Modèle de la simulation 111 : spectroscopie d'absorption infrarouge (1G, chapitre 5).
//  Les spectres sont CONSTRUITS à partir de bandes (position, demi-largeur, profondeur) : ils sont illustratifs, pas mesurés.
// ====================================================
// bande = [σ (cm⁻¹), demi-largeur à mi-hauteur (cm⁻¹), profondeur (0-1), étiquette éventuelle]
export const MOLECULES = {
  propanol: { nom: 'propan-1-ol', fsd: 'CH3–CH2–CH2–OH', bandes: [[3330, 170, 0.80, 'O–H alcool lié'], [2960, 40, 0.55], [2880, 30, 0.40], [1460, 30, 0.30], [1060, 25, 0.70], [980, 30, 0.25], [760, 25, 0.20]] },
  ethanolDilue: { nom: 'éthanol dilué dans un solvant (molécules libres)', fsd: 'CH3–CH2–OH', bandes: [[3630, 14, 0.50, 'O–H alcool libre'], [2975, 35, 0.35], [1380, 25, 0.30], [1050, 22, 0.60]] },
  propanone: { nom: 'propanone', fsd: 'CH3–CO–CH3', bandes: [[2970, 40, 0.25], [1715, 17, 0.92, 'C=O'], [1365, 22, 0.55], [1220, 22, 0.60], [530, 25, 0.40]] },
  propanal: { nom: 'propanal', fsd: 'CH3–CH2–CHO', bandes: [[2980, 35, 0.30], [2820, 20, 0.30], [2720, 18, 0.30], [1730, 17, 0.92, 'C=O'], [1460, 25, 0.30], [1100, 20, 0.25]] },
  acideEthanoique: { nom: 'acide éthanoïque', fsd: 'CH3–COOH', bandes: [[2950, 330, 0.50, 'O–H acide carboxylique'], [1710, 18, 0.92, 'C=O'], [1410, 25, 0.50], [1290, 25, 0.65], [930, 60, 0.40]] },
  menthol: { nom: 'menthol', fsd: 'C9H18CHOH', bandes: [[3300, 160, 0.80, 'O–H alcool lié'], [2940, 50, 0.85], [1455, 30, 0.50], [1370, 20, 0.30], [1045, 22, 0.50], [1000, 22, 0.40]] },
  menthone: { nom: 'menthone', fsd: 'C9H18CO', bandes: [[2950, 50, 0.85], [1710, 17, 0.90, 'C=O'], [1455, 30, 0.50], [1370, 20, 0.45], [1230, 25, 0.20], [1090, 20, 0.15]] },
  chalcone: { nom: 'chalcone', fsd: 'C17H16O2', bandes: [[3030, 25, 0.15], [2960, 35, 0.15], [1655, 16, 0.85, 'C=O'], [1600, 15, 0.75], [1510, 14, 0.60], [1250, 18, 0.80], [1175, 14, 0.60], [1030, 15, 0.55], [980, 12, 0.50], [830, 14, 0.70]] },
};
export const SIGMA_MIN = 500, SIGMA_MAX = 4000;
// Valeurs de référence au programme de 1G : [liaison, famille, σ, largeur, intensité]
export const TABLE_1G = [['O–H', 'alcool libre', 3600, 'étroite', 'moyenne'], ['O–H', 'alcool lié', 3300, 'large', 'forte'], ['O–H', 'acide carboxylique', 2900, 'large', 'moyenne à faible'], ['C=O', 'aldéhyde, cétone, acide carboxylique…', 1700, 'étroite', 'forte']];

export const nombreOnde = (lambdaMicron) => 1e4 / lambdaMicron;           // cm⁻¹ pour λ en µm
export const longueurOnde = (sigma) => 1e4 / sigma;                       // µm pour σ en cm⁻¹
export const transmittance = (I, I0) => 100 * I / I0;                     // %
export const absorbe = (I, I0) => 100 * (1 - I / I0);                     // %

const lorentz = (s, s0, w) => 1 / (1 + ((s - s0) / w) ** 2);
// Transmittance (%) à un nombre d'onde donné ; bruit déterministe très faible pour que deux enregistrements d'un même composé diffèrent à peine.
export function T(mol, sigma, bruit = 0) {
  let a = 0; for (const [s0, w, d] of mol.bandes) a += d * lorentz(sigma, s0, w);
  const b = bruit ? bruit * Math.sin(sigma * 0.37 + 1.3) * Math.cos(sigma * 0.11) : 0;
  return Math.max(2, Math.min(99, 98 - 96 * Math.min(0.99, a) + b));
}
export function spectre(mol, pas = 5, bruit = 0) {
  const pts = []; for (let s = SIGMA_MAX; s >= SIGMA_MIN; s -= pas) pts.push([s, T(mol, s, bruit)]);
  return pts;
}
// Bande la plus profonde au-dessus de 1500 cm⁻¹ (région des groupes caractéristiques)
export function bandePrincipale(mol) {
  return mol.bandes.filter(b => b[0] > 1500).reduce((m, b) => (b[2] > m[2] ? b : m));
}
export const bandesCaracteristiques = (mol) => mol.bandes.filter(b => b[3]);
export const sansBandeOH = (mol) => !mol.bandes.some(b => b[3] && b[3].startsWith('O–H'));
export const aBandeCO = (mol) => mol.bandes.some(b => b[3] === 'C=O');
// Variante : déplace la bande principale (défi)
export function deplacee(mol, dec) { const p = bandePrincipale(mol); return { ...mol, bandes: mol.bandes.map(b => (b === p ? [b[0] + dec, b[1], b[2], b[3]] : b)) }; }
