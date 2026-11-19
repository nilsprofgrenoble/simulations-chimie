// Modèle de la loi de Beer-Lambert et de l'étalonnage : fonctions pures, sans React.
// Hypothèses : solution diluée, une seule espèce absorbante, lumière monochromatique, cuve L = 1 cm ; au-delà de A ≈ 1 l'appareil s'écarte de la droite.
export const L_CUVE = 1;                 // cm
export const M_CUSO4 = 249.68;           // g/mol (CuSO₄, 5 H₂O)
export const LAMBDA_MIN = 380, LAMBDA_MAX = 900;

// Espèces colorées : ε(λ) en L·mol⁻¹·cm⁻¹, somme de bandes gaussiennes [centre, largeur, εmax]
export const ESPECES = {
  cuivre: { nom: 'Ions cuivre(II) Cu²⁺ (sulfate de cuivre)', couleur: [37, 99, 235], bandes: [[810, 135, 12], [380, 40, 0.3]],
    unite: 'mol/L', facteur: 1, gamme: [0.020, 0.040, 0.080, 0.120, 0.160], cMax: 0.2, pas: 0.005 },
  permanganate: { nom: 'Ions permanganate MnO₄⁻', couleur: [190, 24, 150], bandes: [[525, 22, 2200], [547, 14, 1500], [507, 14, 1300], [311, 30, 1700]],
    unite: 'mmol/L', facteur: 1e-3, gamme: [0.05, 0.10, 0.20, 0.30, 0.40], cMax: 0.5, pas: 0.01 },
  e133: { nom: 'Bleu brillant E133 (colorant alimentaire)', couleur: [14, 116, 220], bandes: [[630, 38, 100000], [410, 30, 9000]],
    unite: 'µmol/L', facteur: 1e-6, gamme: [2, 4, 6, 8, 10], cMax: 14, pas: 0.2 },
  dichromate: { nom: 'Ions dichromate Cr₂O₇²⁻', couleur: [234, 120, 0], bandes: [[350, 45, 3100], [440, 40, 370]],
    unite: 'mmol/L', facteur: 1e-3, gamme: [0.5, 1.0, 1.5, 2.0, 2.5], cMax: 3, pas: 0.05 },
};
export const epsilon = (esp, l) => ESPECES[esp].bandes.reduce((s, [c, w, e]) => s + e * Math.exp(-(((l - c) / w) ** 2)), 0);
// Ligne de base avant calibration : la cuve et l'eau absorbent un peu (réflexions, eau), un peu plus aux grandes longueurs d'onde
const ligneDeBase = l => 0.045 + 0.025 * (l - LAMBDA_MIN) / (LAMBDA_MAX - LAMBDA_MIN) + 0.03 * Math.exp(-(((l - 970) / 60) ** 2));
// Ce qu'affiche l'appareil : légère saturation aux fortes absorbances
const affiche = A => (A <= 1 ? A : A / (1 + 0.04 * (A - 1) ** 2));
// Petit bruit reproductible pour chaque cuve
const bruit = (graine, k) => { const x = Math.sin(graine * 12.9898 + k * 78.233) * 43758.5453; return (x - Math.floor(x) - 0.5) * 0.006; };
export function absorbance(esp, cMolL, l, blanc, graine = 1, k = 0) {
  const A = epsilon(esp, l) * L_CUVE * cMolL;
  return affiche(A) + (blanc ? 0 : ligneDeBase(l)) + bruit(graine, k);
}
// Couleur de la solution vue à l'œil : du blanc vers la couleur de l'espèce, selon l'absorbance au maximum
export function couleurCuve(esp, cMolL) {
  if (!esp || cMolL <= 0) return 'rgb(248, 250, 252)';
  const lmax = ESPECES[esp].bandes[0][0], A = epsilon(esp, Math.min(LAMBDA_MAX, lmax)) * cMolL;
  const t = 1 - Math.pow(10, -0.85 * A), c = ESPECES[esp].couleur;
  return `rgb(${Math.round(248 + (c[0] - 248) * t)}, ${Math.round(250 + (c[1] - 250) * t)}, ${Math.round(252 + (c[2] - 252) * t)})`;
}
// Régression linéaire (passant par l'origine, ou affine), avec R²
export function regression(xs, ys, origine) {
  const n = xs.length; if (n < 2) return null;
  const my = ys.reduce((a, b) => a + b, 0) / n, mx = xs.reduce((a, b) => a + b, 0) / n;
  let a, b;
  if (origine) { a = xs.reduce((s, x, i) => s + x * ys[i], 0) / xs.reduce((s, x) => s + x * x, 0); b = 0; }
  else { const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0); a = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / sxx; b = my - a * mx; }
  const ssr = ys.reduce((s, y, i) => s + (y - (a * xs[i] + b)) ** 2, 0), sst = ys.reduce((s, y) => s + (y - my) ** 2, 0);
  return { a, b, R2: sst > 0 ? 1 - ssr / sst : 1 };
}
// Pas de graduation « rond » (1, 2, 2,5 ou 5 × 10ⁿ) pour environ 5 intervalles
