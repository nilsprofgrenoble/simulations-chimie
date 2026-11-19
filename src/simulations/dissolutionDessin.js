// Constantes et petits calculs partagés par les scènes et les schémas de la simulation 157 (fichier sans React).
export const COL = { cat: '#2563eb', an: '#15803d', ox: '#dc2626', hy: '#e2e8f0', gris: '#64748b', encre: '#0f172a', eau: '#dbeafe', orange: '#b45309', rouge: '#b91c1c' };
export const signeIon = (q, plus) => `${q > 1 ? q : ''}${plus ? '+' : '−'}`;
// rayons schématiques (le cation est plus petit que l’anion, comme pour Na⁺ et Cl⁻ ; plus la charge est grande, plus le cation est petit)
export const rayons = s => ({ rc: s.cat.q >= 3 ? 11 : s.cat.q === 2 ? 12 : 13, ra: s.an.poly ? 17 : 16 });
// Réseau 2D simplifié : les ions minoritaires sont répartis en diagonale ; le rapport des nombres d'ions est celui de la formule (1:1, 1:y ou x:1).
export function nbIonsReseau(s, nC, nL) {
  const p = s.cat.nu === 1 ? 1 + s.an.nu : s.an.nu === 1 ? 1 + s.cat.nu : 2, cationMin = s.cat.nu <= s.an.nu;
  let c = 0, a = 0;
  for (let l = 0; l < nL; l++) for (let k = 0; k < nC; k++) { const m = (k + l) % p === 0; if (m === cationMin) c++; else a++; }
  return { c, a, p, cationMin };
}
