// Modèle de la simulation 224 « Stabilité d'une suspension : charge de surface, pH et sel » (BTS MDC, Formulation).
// Capacités visées (jamais affichées à l'élève) : « Identifier les causes d'instabilité » ; « Expliquer le choix d'un agent dispersant selon son mode d'action
// et les matières premières utilisées » (mode électrostatique). Source de notions : manuel de formulation, chap. 3.1 (charges de surface, pH, point isoélectrique, salinité).
// Modèle QUALITATIF : le potentiel zêta suit une courbe en tanh autour du point isoélectrique, écrantée par le sel ; seuil indicatif de stabilité |ζ| ≥ 30 mV.
// Les valeurs de PIE sont des valeurs usuelles de la littérature (± 1 unité selon l'échantillon et la méthode).

export const SOLIDES = [
  { id: 'silice', nom: 'silice SiO₂', court: 'silice', pie: 2.5, surf: 'Si–OH' },
  { id: 'tio2', nom: 'dioxyde de titane TiO₂', court: 'TiO₂', pie: 5.5, surf: 'Ti–OH' },
  { id: 'tio2alu', nom: 'TiO₂ enrobé d’alumine', court: 'TiO₂ enrobé', pie: 8.0, surf: 'Al–OH' },
  { id: 'alumine', nom: 'alumine Al₂O₃', court: 'alumine', pie: 8.5, surf: 'Al–OH' },
];
export const solide = id => SOLIDES.find(s => s.id === id);

export const ZMAX = 60;          // plateau du potentiel zêta (mV), valeur illustrative
export const LISS = 1.5;         // largeur de transition autour du PIE (unités de pH)
export const SEUIL_STABLE = 30;  // |ζ| ≥ 30 mV : suspension considérée stable (repère usuel)
export const SEUIL_FLOC = 15;    // |ζ| < 15 mV : floculation
export const I0 = 0.08;          // force ionique (mol/L) à laquelle le sel divise ζ par 2 (ordre de grandeur)
export const PKA_DISP = 4.5;     // polyacrylate de sodium : pKa ≈ 4,5
export const ZDISP = -45;        // contribution (mV) du dispersant polyanionique entièrement ionisé

// Potentiel zêta (mV) sans sel : positif sous le PIE, négatif au-dessus
export const zeta0 = (pie, pH) => ZMAX * Math.tanh((pie - pH) / LISS);
// Force ionique (mol/L) d'un sel de concentration c : NaCl (1:1) → c ; CaCl₂ → 3c
export const forceIonique = (c, sel = 'NaCl') => (sel === 'CaCl2' ? 3 * c : c);
// Facteur d'écrantage par le sel (1 sans sel, 0,5 à I = I0)
export const ecrantage = I => 1 / (1 + I / I0);
// Longueur de Debye (nm) à 25 °C pour un électrolyte 1:1 : 0,304 / √I ; eau purifiée ≈ 10⁻⁵ mol/L
export const longueurDebye = I => 0.304 / Math.sqrt(Math.max(I, 1e-5));
// Fraction ionisée du polyacrylate selon le pH
export const alphaDisp = pH => 1 / (1 + Math.pow(10, PKA_DISP - pH));
// Potentiel zêta effectif (mV) : s = { solide, pH, c (mol/L), sel, disp (bool) }
export function zeta(s) {
  const so = solide(s.solide);
  let z = zeta0(so.pie, s.pH);
  if (s.disp) z += ZDISP * alphaDisp(s.pH);
  z = Math.max(-70, Math.min(70, z));
  return z * ecrantage(forceIonique(s.c || 0, s.sel));
}
export const stabilite = z => Math.max(0, Math.min(1, (Math.abs(z) - SEUIL_FLOC) / (SEUIL_STABLE - SEUIL_FLOC)));   // 0 = floculée, 1 = stable
export const verdict = z => (Math.abs(z) >= SEUIL_STABLE ? 'stable' : Math.abs(z) >= SEUIL_FLOC ? 'limite' : 'floculee');
export const signe = z => (z > 2 ? '+' : z < -2 ? '−' : '0');
// Interpolation linéaire du PIE entre deux mesures de ζ de signes opposés (pHa < pHb)
export const pieInterpole = (pHa, za, pHb, zb) => pHa + (za / (za - zb)) * (pHb - pHa);

export const REMEDES = {
  ph: 'éloigner le pH du point isoélectrique (ou ajouter un dispersant)',
  sel: 'réduire la salinité (eau déminéralisée, moins de sel)',
  aucune: 'aucune correction : la suspension est stable',
};
export const CAUSES = { ph: 'pH trop proche du point isoélectrique', sel: 'salinité trop élevée', aucune: 'pas de cause d’instabilité' };

// ---------- Défis ----------
const choix = (L, r) => L[Math.floor(r() * L.length) % L.length];
const arr1 = x => Math.round(x * 10) / 10;
// Défi « PIE » : deux mesures de ζ encadrant le PIE ; vrai = interpolation faite avec les valeurs AFFICHÉES (arrondies au mV)
export function tiragePIE(r = Math.random) {
  const so = choix(SOLIDES, r), pHa = arr1(so.pie - (0.3 + 0.4 * r())), pHb = arr1(pHa + 1);
  const za = Math.round(zeta0(so.pie, pHa)), zb = Math.round(zeta0(so.pie, pHb));
  return { solide: so, pHa, pHb, za, zb, vrai: pieInterpole(pHa, za, pHb, zb) };
}
// Défi « diagnostic » : suspension stable, floculée par le pH, ou floculée par le sel
export function tirageDiagnostic(r = Math.random) {
  const cas = choix(['ph', 'sel', 'aucune'], r), so = choix(SOLIDES, r);
  let pH, c = 0.001, sel = 'NaCl';
  if (cas === 'ph') pH = arr1(so.pie + (r() < 0.5 ? -1 : 1) * (0.05 + 0.25 * r()));
  else { const dir = so.pie > 6 ? -1 : 1; pH = arr1(so.pie + dir * (2.5 + 1.5 * r())); if (cas === 'sel') { c = choix([0.3, 0.4, 0.5], r); sel = choix(['NaCl', 'NaCl', 'CaCl2'], r); if (sel === 'CaCl2') c = choix([0.1, 0.15], r); } }
  pH = Math.max(1, Math.min(13, pH));
  const z = zeta({ solide: so.id, pH, c, sel, disp: false });
  return { cas, solide: so, pH, c, sel, z, verdict: verdict(z) };
}
