// ====================================================
//  MODÈLE « ÉQUILIBRE CHIMIQUE : QUOTIENT DE RÉACTION Qr, CONSTANTE K, SENS D'ÉVOLUTION, TAUX D'AVANCEMENT FINAL » (sim 124, niveau TG)
//  Réaction modèle  A + B ⇌ C + D  (ou A + B ⇌ C + solvant) en solution aqueuse, 1,00 L, T constante.
//  Hypothèses de travail (rappelées dans la simulation) :
//   - espèces dissoutes uniquement (le solvant, l'eau, n'est pas écrit dans Qr) ; activités ≈ concentrations / c° (c° = 1 mol/L), donc Qr sans dimension ;
//   - volume constant (1,00 L) : avancement x en mol = en mol/L ; température constante, K(T) donnée à 25 °C (valeurs arrondies) ;
//   - état final = état d'équilibre : Qr = K ; critère d'évolution spontanée : Qr < K sens direct, Qr > K sens inverse, Qr = K équilibre ;
//   - taux d'avancement final τ = x_f / x_max, x_max = avancement si le réactif limitant disparaissait (système initial sans produit).
//  Unités : concentrations en mol/L.
// ====================================================
import { logK } from './acidesBasesModele.js';

// pKa à 25 °C (valeurs usuelles arrondies) ; K = 10^(pKa de la base − pKa de l'acide) (formule de acidesBasesModele.js)
export const PKA = { ethanoique: 4.76, methanoique: 3.75, eau: 14.0 };

// système 'ac' : CH₃COOH + HCOO⁻ ⇌ CH₃COO⁻ + HCOOH (non totale) ; système 'oh' : CH₃COOH + HO⁻ ⇌ CH₃COO⁻ + H₂O (totale)
export const SYSTEMES = {
  ac: { id: 'ac', K: 0.10, noms: { A: 'CH₃COOH', B: 'HCOO⁻', C: 'CH₃COO⁻', D: 'HCOOH' }, solvant: false,
    logK: logK(PKA.ethanoique, PKA.methanoique) },
  oh: { id: 'oh', K: 1.7e9, noms: { A: 'CH₃COOH', B: 'HO⁻', C: 'CH₃COO⁻', D: null }, solvant: true,
    logK: logK(PKA.ethanoique, PKA.eau) },
};
export const K_AC = SYSTEMES.ac.K, K_OH = SYSTEMES.oh.K;

// quotient de réaction pour la composition { a, b, c, d } (mol/L) ; produit d inexistant pour le système 'oh'
export function qr(sys, { a, b, c, d = 0 }) {
  const num = sys.solvant ? c : c * d, den = a * b;
  if (den === 0) return num === 0 ? NaN : Infinity;
  return num / den;
}
// sens d'évolution spontanée : 'direct' (Qr < K), 'inverse' (Qr > K), 'equilibre' (Qr = K à 1 % près)
export function sens(sys, comp) {
  const Q = qr(sys, comp);
  if (!isFinite(Q)) return Q === Infinity ? 'inverse' : 'equilibre';
  if (Math.abs(Q - sys.K) <= 0.01 * sys.K) return 'equilibre';
  return Q < sys.K ? 'direct' : 'inverse';
}
// composition après un avancement x (mol, pour 1,00 L) : x > 0 sens direct, x < 0 sens inverse
export const apresAvancement = (sys, { a, b, c, d = 0 }, x) => ({ a: a - x, b: b - x, c: c + x, d: sys.solvant ? 0 : d + x });
// bornes de l'avancement : xmax (réactif limitant) et xmin (produit limitant, sens inverse)
export const xmax = ({ a, b }) => Math.min(a, b);
export const xmin = (sys, { c, d = 0 }) => -(sys.solvant ? c : Math.min(c, d));
// avancement final xf : racine de (c+x)(d+x) = K (a−x)(b−x), trouvée par dichotomie (fonction croissante sur [xmin, xmax])
export function avancementFinal(sys, comp) {
  const { a, b, c, d = 0 } = comp, K = sys.K;
  const g = x => (sys.solvant ? (c + x) : (c + x) * (d + x)) - K * (a - x) * (b - x);
  let lo = xmin(sys, comp), hi = xmax(comp);
  if (hi <= lo) return 0;
  for (let i = 0; i < 400; i++) { const m = (lo + hi) / 2; if (g(m) > 0) hi = m; else lo = m; }
  return (lo + hi) / 2;
}
export const etatFinal = (sys, comp) => apresAvancement(sys, comp, avancementFinal(sys, comp));
// taux d'avancement final (système initial sans produit) : τ = xf / xmax
export const tauFinal = (sys, comp) => avancementFinal(sys, comp) / xmax(comp);
// la transformation est dite totale si τ ≥ 0,999 (réactif limitant disparu à la précision des mesures de la simulation)
export const estTotale = tau => tau >= 0.999;
// position de Qr sur la règle logarithmique, bornée pour l'affichage
export const log10Q = Q => (Q > 0 && isFinite(Q) ? Math.log10(Q) : Q === 0 ? -Infinity : Infinity);
