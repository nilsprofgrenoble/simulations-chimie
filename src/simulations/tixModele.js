// ====================================================
// SIM 298 — TITRAGE INDIRECT : EAU DE JAVEL, IODURE PUIS THIOSULFATE (modèle pur).
// Étape 1 (en milieu acide, iodure en excès) :  ClO⁻ + 2 I⁻ + 2 H⁺ → I₂ + Cl⁻ + H₂O      (n(I₂ formé) = n(ClO⁻))
// Étape 2 (titrage du diiode formé)          :  I₂ + 2 S₂O₃²⁻ → 2 I⁻ + S₄O₆²⁻          (n(S₂O₃²⁻) = 2 n(I₂) à l’équivalence)
// Donc à l’équivalence : n(ClO⁻) = n(I₂) = n(S₂O₃²⁻) / 2.
// Hypothèses : réactions totales et rapides ; I₂ (en réalité surtout sous forme I₃⁻) seule espèce colorée ; empois d’amidon : bleu-noir dès 2×10⁻⁶ mol/L ;
//   teinte jaune visible dès 1×10⁻⁴ mol/L sans amidon ; volumes additifs ; pas de perte de diiode par volatilité.
// Unités : concentrations en mol/L, volumes en mL, quantités de matière en mmol (mol/L × mL = mmol).
// ====================================================

export const V_BURETTE = 25;          // mL
export const V_GOUTTE = 0.05;         // mL
export const V_KI = 10.0;             // mL de solution d’iodure de potassium ajoutés
export const C_KI = 0.50;             // mol/L
export const V_KI_PEU = 1.0;          // mL (cas « iodure insuffisant » de l’exploration)
export const V_ACIDE = 5.0;           // mL d’acide ajoutés
export const M_CLO = 51.5;            // g/mol, ion hypochlorite ClO⁻
export const SEUIL_JAUNE = 1.0e-4;    // mol/L : teinte jaune visible sans amidon
export const SEUIL_AMIDON = 2.0e-6;   // mol/L : coloration bleu-noir visible avec l’empois d’amidon
export const COEF_S = 2;              // 2 S₂O₃²⁻ pour 1 I₂

/** Situation du parcours guidé : eau de Javel du commerce c₀ = 0,400 mol/L diluée 10 fois, prise de 20,0 mL, thiosulfate à 0,100 mol/L (V_E = 16,0 mL). */
export const SIT_GUIDE = { c0: 0.400, dil: 10, VA: 20.0, cB: 0.100, acide: true, peuKI: false };

export function situation({ c0, dil = 10, VA = 20, cB = 0.1, acide = true, peuKI = false }) {
  const cA = c0 / dil, nA = cA * VA;                           // nA : n(ClO⁻) prélevé, en mmol
  const VKI = peuKI ? V_KI_PEU : V_KI, nI = C_KI * VKI;        // n(I⁻) introduit, en mmol
  const nI2 = acide ? Math.min(nA, nI / 2) : 0;                 // n(I₂) formé : limité par ClO⁻ (iodure en excès) ou par I⁻ (si trop peu)
  return { c0, dil, VA, cB, acide, peuKI, cA, nA, VKI, nI, nI2, Veq: COEF_S * nI2 / cB, VeqTheo: COEF_S * nA / cB };
}

/** État de l’erlenmeyer après versement d’un volume V (mL) de thiosulfate ; amidon : empois d’amidon ajouté ou non. */
export function etat(s, V, amidon = false) {
  const nS = s.cB * V;                                          // mmol de S₂O₃²⁻ versées
  const nI2 = Math.max(0, s.nI2 - nS / COEF_S);                 // mmol de I₂ restant
  const nSexces = Math.max(0, nS - COEF_S * s.nI2);
  const Vtot = s.VA + s.VKI + V_ACIDE + V;
  const cI2 = nI2 / Vtot;
  const regime = V < s.Veq - 1e-9 ? 'avant' : V > s.Veq + 1e-9 ? 'apres' : 'equivalence';
  return { V, nS, nI2, nSexces, Vtot, cI2, regime, jaune: cI2 >= SEUIL_JAUNE, bleu: amidon && cI2 >= SEUIL_AMIDON };
}

const mixRGB = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = a => `rgb(${a[0]}, ${a[1]}, ${a[2]})`;
const interp = (pal, x) => { if (x <= pal[0][0]) return pal[0][1]; if (x >= pal[pal.length - 1][0]) return pal[pal.length - 1][1];
  for (let k = 0; k < pal.length - 1; k++) { const [x0, a] = pal[k], [x1, b] = pal[k + 1]; if (x <= x1) return mixRGB(a, b, (x - x0) / (x1 - x0)); } return pal[0][1]; };
const PAL_IODE = [[-4, [254, 250, 222]], [-3.5, [251, 232, 150]], [-3, [243, 200, 90]], [-2.3, [205, 125, 45]], [-1.7, [120, 60, 22]]];
const PAL_AMIDON = [[-5.7, [214, 224, 248]], [-5, [140, 160, 226]], [-4, [60, 72, 160]], [-3, [26, 28, 84]], [-2, [14, 12, 40]]];
export const COUL_JAVEL = 'rgb(252, 251, 236)';        // eau de Javel diluée : jaune très pâle
export const COUL_BURETTE = '#bfdbfe';                 // thiosulfate : incolore, dessiné en bleu très pâle pour voir le niveau

/** Couleur de la solution du diiode de concentration c (mol/L), avec ou sans empois d’amidon. */
export function couleurIode(c, amidon = false) {
  if (amidon && c >= SEUIL_AMIDON) return rgb(interp(PAL_AMIDON, Math.log10(c)));
  if (!(c >= SEUIL_JAUNE)) return 'rgb(250, 251, 252)';
  return rgb(interp(PAL_IODE, Math.log10(c)));
}
/** Mot qui décrit la teinte. */
export function motTeinte(c, amidon = false) {
  if (amidon && c >= SEUIL_AMIDON) return c < 1e-4 ? 'bleu' : 'bleu-noir';
  if (!(c >= SEUIL_JAUNE)) return 'incolore';
  if (c < 5e-4) return 'jaune très pâle';
  if (c < 3e-3) return 'jaune orangé';
  return 'brun';
}

/** Défi « dosage » : l’élève dose la Javel diluée (c₀ cachée) puis calcule c₀. */
export function tirageDefiDosage(rnd = Math.random) {
  for (let k = 0; k < 500; k++) {
    const c0 = Math.round((0.25 + rnd() * 0.5) * 100) / 100, cB = [0.05, 0.08, 0.1][Math.floor(rnd() * 3)], VA = [10, 20][Math.floor(rnd() * 2)];
    const s = situation({ c0, dil: 10, VA, cB });
    if (s.Veq >= 7 && s.Veq <= 22) return { c0, cB, VA, s };
  }
  return { c0: 0.4, cB: 0.1, VA: 20, s: situation(SIT_GUIDE) };
}

/** Défi « calcul » : V_E donné, calcul de c₀ puis du titre massique en ClO⁻ (g/L). Les données sont arrondies AVANT le calcul. */
export function tirageDefiCalcul(rnd = Math.random) {
  for (let k = 0; k < 500; k++) {
    const cB = [0.05, 0.1, 0.2][Math.floor(rnd() * 3)], VA = [10, 20, 25][Math.floor(rnd() * 3)], dil = [10, 20][Math.floor(rnd() * 2)];
    const Ve = Math.round((8 + rnd() * 14) * 10) / 10;
    const nS = cB * Ve, nI2 = nS / COEF_S, nA = nI2, cA = nA / VA, c0 = cA * dil;
    if (c0 < 0.2 || c0 > 0.9) continue;
    return { cB, VA, dil, Ve, nS, nI2, nA, cA, c0, tm: c0 * M_CLO };
  }
  return { cB: 0.1, VA: 20, dil: 10, Ve: 16, nS: 1.6, nI2: 0.8, nA: 0.8, cA: 0.04, c0: 0.4, tm: 0.4 * M_CLO };
}

/** Concentration de la Javel du commerce à partir d’un volume équivalent. */
export const c0Depuis = (Ve, cB, VA, dil) => cB * Ve / COEF_S * dil / VA;
