// ====================================================
//  Modèle commun aux sims 61 (dissolution), 62 (dilution) et 63 (mélanges, densité) — 2GT, « Constitution et transformations de la matière ».
//  Hypothèses : solutions idéales (le volume de la solution est celui de la fiole ou celui des liquides additionnés, sans contraction),
//  température 20 °C, dissolution complète et instantanée jusqu'à la solubilité, couleur proportionnelle à la concentration.
// ====================================================
export { fr } from './forcesModele.js';

export const SOLUTES = [
  { id: 'KMnO4', nom: 'permanganate de potassium', court: 'KMnO₄', couleur: '#7b2d8e', sol: 64, dak: true },
  { id: 'CuSO4', nom: 'sulfate de cuivre (II)', court: 'CuSO₄', couleur: '#0072b2', sol: 200 },
  { id: 'NaCl', nom: 'chlorure de sodium (sel)', court: 'NaCl', couleur: null, sol: 360 },
];
export const soluteDe = id => SOLUTES.find(s => s.id === id);

// t = m / V (m en g, V en mL, t en g/L)
export const concentration = (m, V) => (V > 0 ? m / (V / 1000) : 0);
export const massePeser = (t, V) => t * V / 1000;
// part dissoute / part restée solide (g), solubilité en g/L
export function dissolution(m, V, solub) {
  const max = solub * V / 1000, dissous = Math.min(m, max);
  return { max, dissous, solide: Math.max(0, m - max), sature: m > max + 1e-9, t: concentration(dissous, V) };
}
// intensité de la teinte (opacité de 0 à 0,92) en fonction de la concentration t (g/L) : saturation douce
export const teinte = t => 0.92 * (1 - Math.exp(-Math.max(0, t) / 0.06));

// ---------- dilution ----------
export const TM = 0.40;                                 // g/L, solution mère de permanganate
export const facteurDilution = (tm, tf) => tm / tf;
export const volumeMere = (tm, tf, Vf) => Vf * tf / tm;  // mL
export const concFille = (tm, Vm, Vf) => (Vf > 0 ? tm * Vm / Vf : 0);
export const ECHELLE = [['Sf1', 0.08], ['Sf2', 0.04], ['Sf3', 0.02], ['Sf4', 0.01], ['Sf5', 0.004]];
export const PIPETTES = [1, 2, 5, 10, 20, 25];            // mL, pipettes jaugées usuelles
export const FIOLES = [50, 100, 200, 250];                 // mL
// solution de Dakin : le fabricant indique 1,0 mg de KMnO4 dans 100,0 mL
export const T_DAKIN = 1.0e-3 / 0.100;                     // g/L = 0,010 g/L

// ---------- mélanges, densité ----------
export const D_EAU = 1.0, D_HUILE = 0.9, D_ALCOOL = 0.8;
export const dMelange = (Ve, Va, de = D_EAU, da = D_ALCOOL) => (Ve + Va > 0 ? (Ve * de + Va * da) / (Ve + Va) : de);
// position de la goutte d'huile : 'flotte' (d_mélange > d_huile), 'coule', 'suspendue' (à 0,01 près)
export function goutte(Ve, Va, dh = D_HUILE) {
  const dm = dMelange(Ve, Va), ecart = dm - dh;
  const etat = Math.abs(ecart) <= 0.01 ? 'suspendue' : ecart > 0 ? 'flotte' : 'coule';
  const frac = etat === 'suspendue' ? 0.5 : Math.max(0.1, Math.min(0.9, 0.5 - ecart * 12)); // 0 = surface, 1 = fond
  return { dm, etat, frac };
}
// volume d'alcool qui suspend une goutte d'huile dans Ve d'eau : (Ve·de + Va·da)/(Ve+Va) = dh
export const VaSuspend = (Ve, dh = D_HUILE) => Ve * (D_EAU - dh) / (dh - D_ALCOOL);

// miscibilité (liquide, liquide) ; hypothèse : huile végétale peu miscible à l'éthanol à 20 °C
export const LIQUIDES = { eau: { nom: 'eau', d: 1.0 }, huile: { nom: 'huile', d: 0.9 }, alcool: { nom: 'alcool (éthanol)', d: 0.8 } };
export const miscible = (a, b) => a === b || (a === 'eau' && b === 'alcool') || (a === 'alcool' && b === 'eau');
// solubilité d'un colorant dans un solvant
export const COLORANTS = { bleu: { nom: 'bleu de méthylène', soluble: { eau: true, huile: false, alcool: true } },
  rouge: { nom: 'rouge Soudan', soluble: { eau: false, huile: true, alcool: true } } };

// solution hydro-alcoolique OMS (pour 100,0 mL) : volume, densité
export const SHA = [
  { id: 'ethanol', nom: 'éthanol à 96 %', pct: 85, d: 0.81, couleur: '#0072b2' },
  { id: 'h2o2', nom: 'eau oxygénée 10 vol.', pct: 4, d: 1.01, couleur: '#cc79a7' },
  { id: 'glycerol', nom: 'glycérol', pct: 1.5, d: 1.26, couleur: '#e69f00' },
];
export const shaEau = () => 100 - SHA.reduce((s, x) => s + x.pct, 0);   // 9,5 mL
export const masseVol = (d) => d * 1000;                                // g/L
