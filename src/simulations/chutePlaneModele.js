// Modèle de la simulation 269 « Chute libre plane » (TSTL, PCM, partie « Interactions » / lois de Newton).
// Un projectile lancé du sol avec la vitesse initiale v0 (m/s) faisant l'angle α (degrés) avec l'horizontale ; seule force : le poids (chute libre, pas de frottement).
// Deuxième loi : a = g vers le bas, soit (a_x ; a_y) = (0 ; −g). Lois horaires : v_x = v0 cos α ; v_y = v0 sin α − g t ; x = v0 cos α · t ; y = v0 sin α · t − g t² / 2.
export const G = 9.8;
const RAD = Math.PI / 180;
export const v0x = (v0, a) => v0 * Math.cos(a * RAD);
export const v0y = (v0, a) => v0 * Math.sin(a * RAD);
export const vy = (v0, a, t) => v0y(v0, a) - G * t;
export const pos = (v0, a, t) => ({ x: v0x(v0, a) * t, y: v0y(v0, a) * t - 0.5 * G * t * t });
export const tSommet = (v0, a) => v0y(v0, a) / G;
export const hMax = (v0, a) => v0y(v0, a) ** 2 / (2 * G);
export const tVol = (v0, a) => 2 * tSommet(v0, a);
export const portee = (v0, a) => v0x(v0, a) * tVol(v0, a);
export const vitesse = (v0, a, t) => Math.hypot(v0x(v0, a), vy(v0, a, t));
export const ANGLES = [20, 30, 40, 45, 50, 60, 70];
export const V0S = [10, 15, 20, 25];
export const PARCOURS = { v0: 20, a: 40, v0x: v0x(20, 40), v0y: v0y(20, 40), t1: 0.5, vy1: vy(20, 40, 0.5), tS: tSommet(20, 40), H: hMax(20, 40), tV: tVol(20, 40), D: portee(20, 40) };
// Défi 1 : temps du sommet (s) et hauteur maximale (m)
export function tirageDefiSommet(rnd = Math.random) {
  const t = c => c[Math.floor(rnd() * c.length)];
  const v0 = t([10, 12, 15, 18, 20, 25]), a = t([30, 40, 50, 60]);
  return { v0, a, tS: tSommet(v0, a), H: hMax(v0, a) };
}
// Défi 2 : portée (m)
export function tirageDefiPortee(rnd = Math.random) {
  const t = c => c[Math.floor(rnd() * c.length)];
  const v0 = t([10, 12, 15, 18, 20, 25]), a = t([20, 30, 40, 50, 60, 70]);
  return { v0, a, D: portee(v0, a), tVol: tVol(v0, a) };
}
