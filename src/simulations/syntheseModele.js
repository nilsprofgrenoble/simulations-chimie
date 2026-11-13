// ====================================================
//  Modèle de la simulation 109 : synthèse organique (chalcone), du protocole au rendement.
//  Équation : anisaldéhyde C8H8O2 + 4'-méthylacétophénone C9H10O → chalcone C17H16O2 + H2O (NaOH : catalyseur).
// ====================================================
export const M_ANIS = 136.15, M_ACET = 134.18, M_CHAL = 252.31;          // g/mol (données du TP)
export const TF_CHAL = 98;                                                // °C
export const nMol = (m, M) => m / M;
export const proche = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b);

// Avancement maximal et réactif limitant. Les deux réactifs ont le coefficient 1.
// « les deux » si leurs quantités de matière diffèrent de moins de 0,5 % (mélange stœchiométrique à la précision des pesées).
export function bilan({ m1, m2 }) {
  const n1 = nMol(m1, M_ANIS), n2 = nMol(m2, M_ACET), xmax = Math.min(n1, n2);
  const egaux = Math.abs(n1 - n2) / Math.max(n1, n2) < 0.005;
  const limitant = egaux ? 'les deux' : (n1 < n2 ? 'anisaldehyde' : 'acetophenone');
  return { n1, n2, xmax, limitant, nth: xmax, mth: xmax * M_CHAL, n1f: n1 - xmax, n2f: n2 - xmax };
}
export const rendement = (mexp, mth) => mexp / mth;

// Séchage à masse constante : indice de la première pesée égale (à la résolution de la balance) à la suivante.
export function indiceSec(masses, resolution = 0.01) {
  for (let i = 0; i < masses.length - 1; i++) if (Math.abs(masses[i] - masses[i + 1]) <= resolution + 1e-9) return i;
  return -1;
}
// Pesées simulées d'un solide qui sèche (perte d'eau exponentielle), arrondies à la résolution.
export function pesees({ mBoite, mSec, mEau0, k = 0.9, n = 7, res = 0.01 }) {
  return Array.from({ length: n }, (_, i) => Math.round((mBoite + mSec + mEau0 * Math.exp(-k * i * 1.6)) / res) * res);
}
// Exemple du TP (données fictives réalistes)
export const EXEMPLE = { m1: 3.40, m2: 3.35, mBoite: 42.35, pesees: [50.15, 48.62, 47.95, 47.83, 47.81, 47.81] };
