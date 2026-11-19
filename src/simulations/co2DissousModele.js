// ====================================================
//  MODÈLE « CO₂ DISSOUS : COUPLES, RÉPARTITION DES ESPÈCES ET SOLUBILITÉ » (sim 142, TSTL, enseignement PCM, partie « Réactions acido-basiques »).
//  Un gaz contenant du CO₂ (pression partielle P) est en équilibre avec une solution aqueuse : le CO₂ dissous suit la loi de Henry, [CO₂] = a(T) · P.
//  Le CO₂ dissous est un acide faible (couple CO₂,H₂O / HCO₃⁻, pKa1) ; HCO₃⁻ est aussi l'acide du couple HCO₃⁻ / CO₃²⁻ (pKa2) : c'est un ampholyte.
//  Hypothèses de travail (rappelées dans un panneau de la simulation) :
//   - 25 °C pour tous les pKa et Ke ; la température ne modifie ici que le coefficient de Henry a(T), donné dans un tableau (valeurs arrondies) ;
//   - activités ≈ concentrations / c° (c° = 1 mol/L) ; le gaz est un réservoir : sa pression partielle ne change pas quand le CO₂ se dissout ;
//   - eau pure : la charge est conservée avec H₃O⁺, HCO₃⁻, CO₃²⁻ et HO⁻ (valeur « exacte ») ; la formule du cours pH = ½ (pKa1 − log [CO₂]) en est une approximation
//     (on néglige CO₃²⁻ et HO⁻ devant HCO₃⁻ et H₃O⁺) ;
//   - milieu de pH imposé : le pH est maintenu constant par un tampon sans carbone, les espèces du carbone ne le modifient pas ;
//     [CO₂] reste fixée par la loi de Henry, les autres espèces se déduisent de [CO₂] et du pH ;
//   - carbone inorganique dissous : C_T = [CO₂] + [HCO₃⁻] + [CO₃²⁻] ; « solubilité apparente » : rapport C_T / [CO₂].
//  Unités : pression en kPa, concentrations en mmol/L (1 mmol/L = 10⁻³ mol/L).
// ====================================================
import { fractions } from './acidesBasesModele.js';

export const PKA1 = 6.35, PKA2 = 10.3;        // CO₂,H₂O / HCO₃⁻ et HCO₃⁻ / CO₃²⁻ à 25 °C
export const KA1 = 10 ** -PKA1, KA2 = 10 ** -PKA2, KE = 1e-14;
// Coefficient de solubilité a(T) (mmol·L⁻¹·kPa⁻¹), valeurs arrondies : la solubilité d'un gaz diminue quand la température augmente
export const A_T = { 5: 0.59, 15: 0.44, 25: 0.33, 35: 0.25 };
export const TEMPS = [5, 15, 25, 35];
export const PRESSIONS = [0.04, 0.4, 4, 20, 100, 300];     // kPa : air, puis gaz de plus en plus riches en CO₂ (300 kPa : bouteille fermée)
export const PH_MILIEU = [4, 6, 8, 10, 12];                // pH imposés proposés en exploration

export const arrondiCS = (x, cs = 2) => Number(Number(x).toPrecision(cs));

// ---------- loi de Henry ----------
export const concCO2 = (P, T = 25) => A_T[T] * P;                    // mmol/L

// ---------- répartition des espèces à un pH donné (CO₂,H₂O ; HCO₃⁻ ; CO₃²⁻) ----------
export const repartition = pH => fractions(10 ** -pH, [PKA1, PKA2]);  // [α0, α1, α2], somme = 1
export const rapportHCO3 = pH => 10 ** (pH - PKA1);                   // [HCO₃⁻] / [CO₂]
export const rapportCO3 = pH => 10 ** (2 * pH - PKA1 - PKA2);          // [CO₃²⁻] / [CO₂]
export const especePredominante = pH => pH < PKA1 ? 'CO2' : pH < PKA2 ? 'HCO3' : 'CO3';

// ---------- milieu de pH imposé : concentrations des trois espèces (mmol/L) à P, T, pH donnés ----------
export function milieu(P, T, pH) {
  const c = concCO2(P, T), hco3 = c * rapportHCO3(pH), co3 = c * rapportCO3(pH), ct = c + hco3 + co3;
  return { c, hco3, co3, ct, solub: ct / c, pH };
}

// ---------- eau pure en équilibre avec le gaz ----------
// Conservation de la charge : h = Ke/h + [HCO₃⁻] + 2 [CO₃²⁻], avec [CO₂] = a·P imposée (concentrations en mol/L) ; résolution par dichotomie sur log10 h
export function pHEau(P, T = 25) {
  const c = concCO2(P, T) * 1e-3;
  const f = lh => { const h = 10 ** lh; return h - KE / h - KA1 * c / h - 2 * KA1 * KA2 * c / (h * h); };
  let a = -14, b = 0;
  for (let it = 0; it < 200; it++) { const m = (a + b) / 2; if (f(m) > 0) b = m; else a = m; }
  return -(a + b) / 2;
}
// Formule du cours : [H₃O⁺] = [HCO₃⁻] et Ka1 = [H₃O⁺]² / [CO₂]  →  pH = ½ (pKa1 − log [CO₂]) ([CO₂] en mol/L)
export const pHFormule = cMmol => 0.5 * (PKA1 - Math.log10(cMmol * 1e-3));
export const concHFormule = cMmol => Math.sqrt(KA1 * cMmol * 1e-3);            // mol/L
export function eauPure(P, T = 25) {
  const c = concCO2(P, T), pH = pHEau(P, T), h = 10 ** -pH, hco3 = KA1 * (c * 1e-3) / h * 1e3, co3 = KA2 * hco3 * 1e-3 / h * 1e3;
  return { c, pH, pHFormule: pHFormule(c), hco3, co3, ct: c + hco3 + co3 };
}

// ---------- courbes ----------
export function courbeRepartition(pas = 0.1) {
  const pts = [];
  for (let k = 0; k <= 140 + 1e-9; k += pas * 10) { const pH = k / 10, [a0, a1, a2] = repartition(pH); pts.push({ pH, a0, a1, a2 }); }
  return pts;
}

// ---------- situations du parcours guidé (toutes calculées par le modèle) ----------
export const PARCOURS = {
  T: 25, P1: 20,            // étape 1 : [CO₂] = a · P
  P3: 60,                   // étape 2 : pression triplée
  Tchaud: 35,               // étape 3 : on chauffe
  pHdiag: 8.0,              // étape 6 : espèce prédominante
  pHrapport: 7.0,           // étape 7 : rapport [HCO₃⁻] / [CO₂]
  Pair: 0.04, Pbouteille: 300,
  pHmilieu: 8.0, Pmilieu: 0.4,   // étapes 11-12 : milieu de pH imposé, gaz à 0,40 kPa
  milieux: [3, 6, 8, 10],   // étape 13 : quel milieu dissout le plus de CO₂ ?
};

// ---------- défis à valeurs aléatoires ----------
const tire = (t, alea) => t[Math.floor(alea() * t.length)];
export const P_DEFI = [0.1, 0.5, 2, 5, 10, 30, 50, 100];          // eau pure : du gaz pauvre en CO₂ au gaz très riche
export const P_MILIEU = [0.04, 0.1, 0.2, 0.4, 1];                  // milieu de pH imposé : concentrations restant raisonnables
export const PH_DEFI = [7.0, 7.5, 8.0, 8.5];
// Défi 1 : eau pure en équilibre avec un gaz → [CO₂] et pH (formule du cours, arrondie à 2 décimales)
export function tirageEau(alea = Math.random) {
  const P = tire(P_DEFI, alea), T = tire(TEMPS, alea), c = concCO2(P, T);
  return { type: 'eau', P, T, a: A_T[T], c, pH: pHFormule(c) };
}
// Défi 2 : milieu de pH imposé → [HCO₃⁻] et rapport C_T / [CO₂]
export function tirageMilieu(alea = Math.random) {
  const P = tire(P_MILIEU, alea), T = tire(TEMPS, alea), pH = tire(PH_DEFI, alea), m = milieu(P, T, pH);
  return { type: 'milieu', P, T, a: A_T[T], pH, ...m };
}
