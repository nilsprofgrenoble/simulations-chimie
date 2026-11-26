// Modèle de la simulation 266 « Gravitation et poids » (TSTL, PCM, partie « Interactions »).
// Interaction gravitationnelle F = G m1 m2 / d² ; g = G M / (R + h)² ; poids P = m g. Données astronomiques arrondies (hypothèses de la simulation).
export const G = 6.67e-11;
export const CORPS = {
  terre: { nom: 'la Terre', nomS: 'Terre', M: 5.97e24, R: 6.37e6 },
  lune: { nom: 'la Lune', nomS: 'Lune', M: 7.35e22, R: 1.74e6 },
  mars: { nom: 'Mars', nomS: 'Mars', M: 6.42e23, R: 3.39e6 },
  jupiter: { nom: 'Jupiter', nomS: 'Jupiter', M: 1.90e27, R: 7.15e7 },
};
export const ORDRE = ['terre', 'lune', 'mars', 'jupiter'];
export const force = (m1, m2, d) => G * m1 * m2 / (d * d);
export const gAlt = (M, R, h = 0) => G * M / ((R + h) * (R + h));
export const poids = (m, g) => m * g;
export const PARCOURS = { m1: 1000, m2: 1000, d: 2.0, F: force(1000, 1000, 2.0), gT: gAlt(CORPS.terre.M, CORPS.terre.R), mA: 70, PL: poids(70, gAlt(CORPS.lune.M, CORPS.lune.R)), h: 4.0e5, gH: gAlt(CORPS.terre.M, CORPS.terre.R, 4.0e5) };
// Défi 1 : force entre deux masses (réponse en µN)
export function tirageDefiForce(rnd = Math.random) {
  const t = a => a[Math.floor(rnd() * a.length)];
  const m1 = t([500, 800, 1000, 1500, 2000]), m2 = t([500, 800, 1000, 1500, 2000]), d = t([1.0, 1.5, 2.0, 2.5, 3.0]);
  return { m1, m2, d, F: force(m1, m2, d) * 1e6 };
}
// Défi 2 : une planète inventée de masse M (en 10^23 kg) et de rayon R (en 10^6 m) ; intensité de pesanteur au sol puis poids d'un objet
export function tirageDefiPoids(rnd = Math.random) {
  const t = a => a[Math.floor(rnd() * a.length)];
  let M, R, g;
  do { M = t([2, 3, 4, 5, 8, 10]); R = t([2, 3, 4, 5]); g = gAlt(M * 1e23, R * 1e6); } while (g < 1.5);
  const m = t([40, 50, 60, 80]);
  return { M, R, m, g, P: m * g };
}
