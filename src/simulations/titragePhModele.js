// ====================================================
//  MODÈLE « TITRAGE pH-MÉTRIQUE » (sim 119, niveau TG) — titrage d'un acide par la soude, à 25 °C
//  Hypothèses de travail (rappelées dans la simulation) :
//   - activités assimilées aux concentrations (solutions diluées, C ≤ 0,1 mol/L) ; Ke = 1,0·10⁻¹⁴ à 25 °C ;
//   - volumes additifs ; titrage supposé rapide ; réaction de titrage supposée TOTALE pour la composition en quantités de matière ;
//   - le pH est calculé « exactement » (acidesBasesModele : conservation de la charge) : il tient compte de l'équilibre
//     (il n'est donc pas donné par le modèle « totale », qui sert seulement aux quantités de matière) ;
//   - pas de CO₂ dissous, pH-mètre et burette idéaux, indicateur coloré en quantité négligeable (il ne modifie ni le pH ni V_E).
//  Notations : V_E = volume versé à l'ÉQUIVALENCE ; « éq » = ÉQUILIBRE (ne pas confondre).
// ====================================================
import * as A from './acidesBasesModele.js';

export { KE, INDICATEURS, couleurIndicateur, fractionBasiqueIndicateur } from './acidesBasesModele.js';

// Acides titrés (pKas = [] : acide fort) — valeurs de la simulation 85
export const ACIDES = {
  hcl:  { nom: 'acide chlorhydrique', formule: 'HCl', base: 'Cl⁻', pKas: [], fort: true },
  benz: { nom: 'acide benzoïque', formule: 'C₆H₅COOH', base: 'C₆H₅COO⁻', pKas: [4.2] },
  etha: { nom: 'acide éthanoïque', formule: 'CH₃COOH', base: 'CH₃COO⁻', pKas: [4.8] },
  form: { nom: 'acide méthanoïque', formule: 'HCOOH', base: 'HCOO⁻', pKas: [3.75] },
};
export const V_BURETTE_ML = 25;

// Paramètres du titrage (volumes en mL, concentrations en mol/L) → unités SI du modèle de pH
const si = p => ({ C0: p.C0, V0: p.V0 * 1e-3, pKas: ACIDES[p.acide].pKas, Cb: p.Cb });

// pH après ajout de Vb (mL) de soude
export const pHa = (p, Vb) => A.pHTitrage({ ...si(p), Vb: Vb * 1e-3 });
// Volume équivalent (mL) : C_A V_A = C_b V_E
export const volumeEq = p => p.C0 * p.V0 / p.Cb;
// pH à l'équivalence
export const pHEq = p => pHa(p, volumeEq(p));
// Constante de la réaction de titrage AH + HO⁻ → A⁻ + H₂O : K = Ka / Ke (acide faible) ; pour un acide fort la réaction H₃O⁺ + HO⁻ → 2 H₂O a K = 1/Ke = 10¹⁴
export const logKTitrage = p => (ACIDES[p.acide].fort ? 14 : 14 - ACIDES[p.acide].pKas[0]);

// ---------- composition en quantités de matière (transformation totale), en mmol ----------
// n0 = C_A V_A (mmol) ; nB = C_b V_b versée (mmol). Pour un acide fort, « AH » désigne H₃O⁺ (acide apporté par HCl).
export function composition(p, Vb) {
  const n0 = p.C0 * p.V0, nB = p.Cb * Vb;
  return { n0, nB, nAH: Math.max(0, n0 - nB), nA: Math.min(nB, n0), nOH: Math.max(0, nB - n0), nNa: nB, nCl: ACIDES[p.acide].fort ? n0 : 0 };
}
// Position par rapport à l'équivalence (tolérance de 1/10 mL pour le curseur)
export function etatTitrage(p, Vb) {
  const VE = volumeEq(p);
  return Math.abs(Vb - VE) < 0.05 ? 'equivalence' : Vb < VE ? 'avant' : 'apres';
}
// Points des courbes n = f(V) pour le graphique des quantités de matière
export function courbeQuantites(p, Vmax = V_BURETTE_ML, n = 250) {
  const pts = [];
  for (let k = 0; k <= n; k++) { const V = Vmax * k / n, c = composition(p, V); pts.push({ V, nAH: c.nAH, nA: c.nA, nOH: c.nOH }); }
  return pts;
}

// ---------- courbe pH = f(V) et équivalence ----------
export function courbe(p, Vmax = V_BURETTE_ML, n = 500) {
  const pts = A.courbeTitrage(si(p), Vmax * 1e-3, n).map(q => ({ V: q.V * 1e3, pH: q.pH, d: q.d * 1e-3 }));   // d en unités de pH par mL
  return pts;
}
// Équivalence repérée par le maximum de la dérivée dpH/dV (mL)
export const volumeEqDerivee = pts => A.equivalenceDerivee(pts);
// Volume de soude (mL) pour lequel le pH vaut ph (pH croissant avec V) ; null si hors de la plage [pH(0) ; pH(Vmax)]
export function volumePourPH(p, ph, Vmax = V_BURETTE_ML) {
  if (ph < pHa(p, 0) || ph > pHa(p, Vmax)) return null;
  let a = 0, b = Vmax;
  for (let it = 0; it < 80; it++) { const m = (a + b) / 2; if (pHa(p, m) < ph) a = m; else b = m; }
  return (a + b) / 2;
}
// Saut de pH autour de l'équivalence : pH à 0,99 V_E et à 1,01 V_E
export function saut(p) { const VE = volumeEq(p); return [pHa(p, 0.99 * VE), pHa(p, 1.01 * VE)]; }

// ---------- indicateurs colorés ----------
// Règle du programme : un indicateur convient si sa zone de virage contient le pH à l'équivalence
export const convient = (ind, p) => A.convient(ind, pHEq(p));
// Zone de virage entièrement comprise dans le saut (±1 % autour de V_E)
export function zoneDansSaut(ind, p) { const [a, b] = saut(p); return ind.zone[0] >= a && ind.zone[1] <= b; }
// Virage de l'indicateur au cours du titrage : volumes (mL) au début et à la fin de la zone de virage, et au milieu (pH = pKa de l'indicateur)
export function virage(ind, p) {
  const VE = volumeEq(p);
  const v1 = volumePourPH(p, ind.zone[0]), v2 = volumePourPH(p, ind.zone[1]), vm = volumePourPH(p, ind.pKa);
  return { v1, v2, vm, ecartDebut: v1 == null ? null : (v1 - VE) / VE, ecartFin: v2 == null ? null : (v2 - VE) / VE, ecartMil: vm == null ? null : (vm - VE) / VE };
}
// Classement pour le défi : « convient » (règle du programme ET zone dans le saut) ou « mauvais » (ne contient pas pH_E ET zone non comprise dans le saut)
export function classeIndicateur(ind, p) {
  const c = convient(ind, p), s = zoneDansSaut(ind, p);
  if (c && s) return 'bon';
  if (!c && !s) return 'mauvais';
  return 'ambigu';
}

// Concentration de l'acide à partir du volume équivalent : C_A = C_b V_E / V_A
