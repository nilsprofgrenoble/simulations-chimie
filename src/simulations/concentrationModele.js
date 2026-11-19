// ====================================================
//  Modèle de la simulation « Concentration en quantité de matière : dissolution et dilution » (1G spé PC, sim 153).
//  Modèle pur (sans React), testé par concentrationModele.test.mjs.
//  Hypothèses : solution idéale (volume de la solution = volume de la fiole jaugée, jauge à 20 °C) ; soluté pur, totalement dissous
//  (concentration en masse inférieure à la solubilité) ; la quantité de matière de soluté se conserve dans une dilution ;
//  masses molaires atomiques arrondies au dixième (modèle de la simulation 152). Les incertitudes ne sont pas traitées ici.
// ====================================================
import { espece, masseMolaire, formuleTexte } from './quantiteMatiereModele.js';

// Solutés proposés : formule, masse molaire (g/mol), équation de dissolution, solubilité approchée dans l'eau à 20 °C (g/L), ions libérés
// [symbole, coefficient]. Les solubilités sont arrondies (ordres de grandeur utilisés pour borner les tirages).
export const SOLUTES = [
  { id: 'nacl', esp: 'nacl', nom: 'chlorure de sodium', eq: 'NaCl(s) → Na⁺(aq) + Cl⁻(aq)', solub: 360, ions: [['Na⁺', 1], ['Cl⁻', 1]] },
  { id: 'glucose', esp: 'glucose', nom: 'glucose', eq: 'C₆H₁₂O₆(s) → C₆H₁₂O₆(aq)', solub: 900, ions: [] },
  { id: 'saccharose', esp: 'saccharose', nom: 'saccharose (sucre de table)', eq: 'C₁₂H₂₂O₁₁(s) → C₁₂H₂₂O₁₁(aq)', solub: 2000, ions: [] },
  { id: 'cacl2', esp: 'cacl2', nom: 'chlorure de calcium', eq: 'CaCl₂(s) → Ca²⁺(aq) + 2 Cl⁻(aq)', solub: 745, ions: [['Ca²⁺', 1], ['Cl⁻', 2]] },
  { id: 'nahco3', esp: 'nahco3', nom: 'hydrogénocarbonate de sodium', eq: 'NaHCO₃(s) → Na⁺(aq) + HCO₃⁻(aq)', solub: 96, ions: [['Na⁺', 1], ['HCO₃⁻', 1]] },
  { id: 'vitc', esp: 'vitc', nom: 'acide ascorbique (vitamine C)', eq: 'C₆H₈O₆(s) → C₆H₈O₆(aq)', solub: 330, ions: [] },
];
export const soluteDe = id => SOLUTES.find(s => s.id === id);
export const masseMolaireSoluteDe = s => masseMolaire(espece(s.esp));
export const formuleSolute = s => formuleTexte(espece(s.esp));

// ---------- relations (unités : mol, L, mL, g) ----------
export const mL_L = V_mL => V_mL / 1000;                       // conversion mL → L
export const concentration = (n, V_L) => n / V_L;              // c = n / V  (mol/L)
export const quantite = (c, V_L) => c * V_L;                   // n = c × V
export const concMasse = (c, M) => c * M;                      // Cm = c × M  (g/L)
export const concDepuisMasse = (Cm, M) => Cm / M;              // c = Cm / M
export const masseAPeser = (c, V_L, M) => c * V_L * M;         // m = c × V × M  (g)
export const facteurDilution = (c0, c1) => c0 / c1;            // F = c_mère / c_fille
export const volumePreleve = (c0, c1, V1) => c1 * V1 / c0;     // c_mère·V_mère = c_fille·V_fille  (V1 et résultat dans la même unité)
export const concFille = (c0, V0, V1) => c0 * V0 / V1;         // c_fille = c_mère·V_mère / V_fille

// ---------- verrerie (précision à titre qualitatif seulement : les incertitudes relèvent de la partie « Mesure ») ----------
export const FIOLES = [50, 100, 200, 250, 500, 1000];          // mL, fioles jaugées usuelles
export const PIPETTES = [1, 2, 5, 10, 20, 25];                 // mL, pipettes jaugées usuelles (à un trait)
export const VERRES = {
  fiole: { nom: 'fiole jaugée', usage: 'contenir un volume précis, avec son trait de jauge', precision: 'très bonne', rang: 3 },
  pipette: { nom: 'pipette jaugée', usage: 'prélever un volume précis, avec une propipette', precision: 'très bonne', rang: 3 },
  eprouvette: { nom: 'éprouvette graduée', usage: 'mesurer un volume approximatif', precision: 'moyenne', rang: 2 },
  becher: { nom: 'bécher', usage: 'contenir, transvaser ou mélanger (graduations indicatives)', precision: 'faible', rang: 1 },
};

// ---------- valeurs rondes pour les réglages et les tirages ----------
export const CONC_SOLIDE = [0.050, 0.100, 0.200, 0.250, 0.500, 1.00];   // mol/L
export const CONC_MERE = [0.100, 0.200, 0.250, 0.400, 0.500, 1.00, 2.00];
export const FACTEURS = [2, 4, 5, 10, 20, 25, 40, 50];
const troisCS = x => Math.abs(Number(x.toPrecision(3)) - x) <= 1e-12 * Math.abs(x);

// Combinaisons de dilution réalisables avec le matériel usuel : V_mère (pipette jaugée) = V_fille / F doit être une pipette standard
export function dilutionsPossibles(c0 = null) {
  const L = [];
  for (const c of (c0 == null ? CONC_MERE : [c0])) for (const F of FACTEURS) for (const V1 of FIOLES) {
    const V0 = V1 / F, c1 = c / F;
    if (PIPETTES.includes(V0) && troisCS(c1) && V0 < V1) L.push({ c0: c, F, V1, V0, c1 });
  }
  return L;
}
export const fiolesPossibles = (c0, F) => dilutionsPossibles(c0).filter(d => d.F === F).map(d => d.V1);
export const facteursPossibles = c0 => [...new Set(dilutionsPossibles(c0).map(d => d.F))].sort((a, b) => a - b);

// ---------- défis (tirage aléatoire borné) ----------
const tire = (t, rng) => t[Math.floor(rng() * t.length)];
// Dissolution : la solution reste loin de la saturation (masse par litre ≤ 30 % de la solubilité) et la masse à peser est mesurable (≥ 0,5 g)
export function tirerDefiSolide(rng = Math.random) {
  for (let i = 0; i < 1000; i++) {
    const s = tire(SOLUTES, rng), M = masseMolaireSoluteDe(s), c = tire(CONC_SOLIDE, rng), V = tire([100, 250, 500, 1000], rng);
    const m = masseAPeser(c, V / 1000, M);
    if (c * M <= 0.3 * s.solub && m >= 0.5) return { type: 'solide', s, M, c, V, vrai: m };
  }
  throw new Error('tirage impossible');
}
export function tirerDefiDilution(rng = Math.random) {
  for (let i = 0; i < 1000; i++) {
    const s = tire(SOLUTES, rng), M = masseMolaireSoluteDe(s), ok = dilutionsPossibles().filter(d => d.c0 * M <= 0.3 * s.solub);
    if (!ok.length) continue;
    const d = tire(ok, rng);
    return { type: 'dilution', s, M, ...d, vrai: volumePreleve(d.c0, d.c1, d.V1) };
  }
  throw new Error('tirage impossible');
}
// arrondi à cs chiffres significatifs
export const arrondiCS = (x, cs) => Number(Number(x).toPrecision(cs));
