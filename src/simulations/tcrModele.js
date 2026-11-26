// ====================================================
// SIM 295 — TITRAGE REDOX DIRECT AVEC CHANGEMENT DE COULEUR (modèle pur).
// Situation : eau oxygénée (désinfectant) titrée par une solution de permanganate de potassium, en milieu acide.
//   2 MnO₄⁻ + 5 H₂O₂ + 6 H⁺ → 2 Mn²⁺ + 5 O₂ + 8 H₂O        (n(H₂O₂) = 5/2 n(MnO₄⁻) à l’équivalence)
// Hypothèses : réaction totale et rapide, H⁺ en large excès (acide sulfurique), volumes additifs, MnO₄⁻ violet (seul coloré),
//   Mn²⁺ et H₂O₂ incolores, œil sensible à partir de c(MnO₄⁻) ≈ 1,0×10⁻⁵ mol/L.
// Unités : concentrations en mol/L, volumes en mL, quantités de matière en mmol (mol/L × mL = mmol).
// ====================================================

export const V_BURETTE = 25;          // mL
export const V_GOUTTE = 0.05;         // mL
export const V_ACIDE = 5.0;           // mL d’acide sulfurique (≈ 1 mol/L) ajoutés dans l’erlenmeyer
export const M_H2O2 = 34.0;           // g/mol
export const SEUIL_VISIBLE = 1.0e-5;  // mol/L : concentration en MnO₄⁻ à partir de laquelle la teinte rose se voit
export const COEF_A = 5, COEF_B = 2;  // 5 H₂O₂ pour 2 MnO₄⁻

/** Situation du parcours guidé : eau oxygénée commerciale (≈ 3 %), diluée 10 fois, prélèvement de 10,0 mL. */
export const SIT_GUIDE = { c0: 0.870, dil: 10, VA: 10.0, cB: 0.0200, acide: true };

export function situation({ c0, dil = 10, VA = 10, cB = 0.02, acide = true }) {
  const cA = c0 / dil, nA = cA * VA;                  // nA en mmol
  return { c0, dil, VA, cB, acide, cA, nA, Veq: (COEF_B / COEF_A) * nA / cB };
}

/** État de l’erlenmeyer après versement d’un volume V (mL) de permanganate. */
export function etat(s, V) {
  const nB = s.cB * V;                                  // mmol de MnO₄⁻ versées
  const nBreagi = Math.min(nB, (COEF_B / COEF_A) * s.nA);
  const nH2O2 = Math.max(0, s.nA - (COEF_A / COEF_B) * nB);
  const nExces = Math.max(0, nB - (COEF_B / COEF_A) * s.nA);
  const Vtot = s.VA + V_ACIDE + V;
  const cMnO4 = nExces / Vtot, cMn2 = nBreagi / Vtot;
  const regime = V < s.Veq - 1e-9 ? 'avant' : V > s.Veq + 1e-9 ? 'apres' : 'equivalence';
  return { V, nB, nH2O2, nExces, Vtot, cMnO4, cMn2, regime, visible: cMnO4 >= SEUIL_VISIBLE };
}

/** Couleur d’une solution de permanganate de concentration c (mol/L) : incolore → rose pâle → rose → violet → violet foncé. */
const PAL = [[-5, [250, 232, 246]], [-4.5, [241, 205, 232]], [-4, [224, 156, 208]], [-3, [166, 56, 156]], [-2, [102, 14, 112]], [-1.7, [78, 8, 92]]];
export function couleurMnO4(c) {
  const rgb = a => `rgb(${a[0]}, ${a[1]}, ${a[2]})`;
  if (!(c >= SEUIL_VISIBLE)) return 'rgb(248, 250, 252)';
  const x = Math.log10(c);
  if (x >= PAL[PAL.length - 1][0]) return rgb(PAL[PAL.length - 1][1]);
  for (let k = 0; k < PAL.length - 1; k++) {
    const [x0, a] = PAL[k], [x1, b] = PAL[k + 1];
    if (x <= x1) { const t = Math.max(0, (x - x0) / (x1 - x0)); return rgb(a.map((v, i) => Math.round(v + (b[i] - v) * t))); }
  }
  return rgb(PAL[0][1]);
}
export const COUL_BURETTE = couleurMnO4(0.02);

/** Mot qui décrit la teinte (légende du schéma). */
export function motTeinte(c) {
  if (!(c >= SEUIL_VISIBLE)) return 'incolore';
  if (c < 1e-4) return 'rose pâle';
  if (c < 1e-3) return 'rose';
  return 'violet';
}

/** Défi « dosage » : l’élève cherche V_E puis la concentration c₀ de l’eau oxygénée commerciale (valeur cachée). */
export function tirageDefiDosage(rnd = Math.random) {
  const c0 = Math.round((0.55 + rnd() * 0.33) * 100) / 100;      // 0,55 à 0,88 mol/L
  const cB = [0.0150, 0.0200, 0.0250][Math.floor(rnd() * 3)];
  const s = situation({ c0, dil: 10, VA: 10, cB });
  return { c0, cB, s };
}

/** Défi « calcul » : V_E donné, calcul de c₀ puis du titre massique (g/L). La donnée est arrondie AVANT le calcul. */
export function tirageDefiCalcul(rnd = Math.random) {
  for (let essai = 0; essai < 200; essai++) {
    const cB = [0.0100, 0.0150, 0.0200, 0.0250, 0.0400][Math.floor(rnd() * 5)];
    const VA = [10, 20, 25][Math.floor(rnd() * 3)];                 // mL (pipette jaugée)
    const dil = [10, 20, 50][Math.floor(rnd() * 3)];
    const Ve = Math.round((8 + rnd() * 14) * 10) / 10;              // 8,0 à 22,0 mL
    const c0 = (COEF_A / COEF_B) * cB * Ve * dil / VA;
    if (c0 < 0.4 || c0 > 1.4) continue;
    return { cB, VA, dil, Ve, c0, tm: c0 * M_H2O2, nB: cB * Ve, nA: (COEF_A / COEF_B) * cB * Ve, cA: (COEF_A / COEF_B) * cB * Ve / VA };
  }
  return { cB: 0.02, VA: 10, dil: 10, Ve: 17.4, c0: 0.87, tm: 0.87 * M_H2O2, nB: 0.348, nA: 0.87, cA: 0.087 };
}

/** Concentration de l’eau oxygénée commerciale à partir d’un volume équivalent. */
export const c0Depuis = (Ve, cB, VA, dil) => (COEF_A / COEF_B) * cB * Ve * dil / VA;
