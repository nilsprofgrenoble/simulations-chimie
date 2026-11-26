// Modèle de la simulation 270 « Chute verticale avec frottement visqueux (1) » (TSTL, PCM, lois de Newton).
// Objet de masse m (kg) lâché sans vitesse initiale ; forces : poids P = m g (vers le bas) et frottement fluide f = k v (vers le haut, k en kg/s) ; poussée d'Archimède négligée.
// Axe vertical vers le bas : m dv/dt = m g − k v. Solution : v(t) = v_lim (1 − e^(−t/τ)), v_lim = m g / k, τ = m / k. Distance parcourue : y(t) = v_lim (t − τ (1 − e^(−t/τ))).
export const G = 9.8;
export const vlim = (m, k) => m * G / k;
export const tau = (m, k) => m / k;
export const vit = (m, k, t) => vlim(m, k) * (1 - Math.exp(-t / tau(m, k)));
export const acc = (m, k, t) => G * Math.exp(-t / tau(m, k));
export const frott = (m, k, t) => k * vit(m, k, t);
export const dist = (m, k, t) => vlim(m, k) * (t - tau(m, k) * (1 - Math.exp(-t / tau(m, k))));
export const tAtteint = (m, k, frac) => -tau(m, k) * Math.log(1 - frac);   // durée pour atteindre la fraction frac de v_lim
export const MASSES = [1, 2, 4];
export const K_MIN = 2, K_MAX = 10, K_PAS = 0.5;
export const T_FIN = 6, V_MAX = 22;
export const PARCOURS = { m: 2.0, k: 4.0, vlim: vlim(2, 4), tau: tau(2, 4), v63: vit(2, 4, tau(2, 4)), t5: 5 * tau(2, 4), vTau2: vit(2, 4, 2 * tau(2, 4)) };
// Défi 1 : v_lim (m/s) et τ (s) d'après m et k
export function tirageDefiCalcul(rnd = Math.random) {
  const t = c => c[Math.floor(rnd() * c.length)];
  const m = t([1.0, 2.0, 2.5, 4.0, 5.0]), k = t([2.0, 2.5, 4.0, 5.0, 8.0]);
  return { m, k, vlim: vlim(m, k), tau: tau(m, k) };
}
// Défi 2 : lecture de v_lim (m/s) et de τ (s) sur la courbe v(t) graduée, sans valeur écrite ; la masse est donnée. Ici τ = v_lim ÷ g : on tire v_lim et la masse, k s'en déduit.
export function tirageDefiLecture(rnd = Math.random) {
  const t = c => c[Math.floor(rnd() * c.length)];
  const m = t([1.0, 2.0, 4.0]), vl = t([8, 10, 12, 15]), k = m * G / vl;
  return { m, k, vlim: vl, tau: tau(m, k) };
}
