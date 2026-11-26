// Modèle de la simulation 271 « Chute avec frottement visqueux (2) : équation différentielle et méthode d'Euler » (TSTL, PCM).
// Objet de masse m lâché sans vitesse dans un fluide ; forces : poids m g, poussée d'Archimède Π = m_f g (m_f = masse de fluide déplacé, m_f < m), frottement f = k v. Axe vertical vers le bas.
// Équation différentielle : m dv/dt = m g − m_f g − k v, soit dv/dt = A − v/τ avec A = g (1 − m_f/m) et τ = m/k. v_lim = (m − m_f) g / k = A τ.
// Solution exacte : v(t) = v_lim (1 − e^(−t/τ)). Méthode d'Euler : v_(i+1) = v_i + a_i Δt, avec a_i = A − v_i/τ.
export const G = 9.8;
export const A = (m, mf) => G * (1 - mf / m);
export const tau = (m, k) => m / k;
export const vlim = (m, mf, k) => (m - mf) * G / k;
export const exact = (m, mf, k, t) => vlim(m, mf, k) * (1 - Math.exp(-t / tau(m, k)));
export const acc = (m, mf, k, v) => A(m, mf) - v / tau(m, k);
// Suite d'Euler de t = 0 à tFin (sans vitesse initiale) : renvoie [{ t, v, a }] (a = accélération calculée à partir de v)
export function euler(m, mf, k, dt, tFin) {
  const n = Math.round(tFin / dt + 1e-9), lignes = []; let v = 0;
  for (let i = 0; i <= n; i++) { const a = acc(m, mf, k, v); lignes.push({ t: i * dt, v, a }); v += a * dt; }
  return lignes;
}
export const MASSE = 2.0, K = 4.0, MF_CHOIX = [0, 0.4, 0.8];
export const DT_MIN = 0.05, DT_MAX = 1.5, DT_PAS = 0.05, T_FIN = 3;
export const PARCOURS = { m: 2.0, mf: 0.4, k: 4.0, dt: 0.2, a0: A(2, 0.4), vlim: vlim(2, 0.4, 4), tau: tau(2, 4), v1: 0.2 * A(2, 0.4), v2: 1.6 + 0.2 * (A(2, 0.4) - 1.6 / 0.5) };
// Défi 1 : accélération au départ et vitesse limite
export function tirageDefiLimite(rnd = Math.random) {
  const t = c => c[Math.floor(rnd() * c.length)];
  let m, mf; do { m = t([1.0, 2.0, 2.5, 4.0, 5.0]); mf = t([0.2, 0.4, 0.5, 0.8, 1.0]); } while (mf > 0.45 * m);
  const k = t([2.0, 2.5, 4.0, 5.0, 8.0]);
  return { m, mf, k, a0: A(m, mf), vlim: vlim(m, mf, k), tau: tau(m, k) };
}
// Défi 2 : deux pas d'Euler depuis le repos
export function tirageDefiEuler(rnd = Math.random) {
  const t = c => c[Math.floor(rnd() * c.length)];
  let m, mf; do { m = t([1.0, 2.0, 2.5, 4.0]); mf = t([0.2, 0.4, 0.5]); } while (mf > 0.45 * m);
  let k, dt; do { k = t([2.0, 2.5, 4.0, 5.0]); dt = t([0.1, 0.2, 0.25, 0.5]); } while (dt > 0.6 * m / k);
  const L = euler(m, mf, k, dt, 2 * dt);
  return { m, mf, k, dt, a0: L[0].a, v1: L[1].v, a1: L[1].a, v2: L[2].v, tau: tau(m, k) };
}
