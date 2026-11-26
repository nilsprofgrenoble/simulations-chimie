// Mouvement du véhicule qui freine (exploration animée de la simulation 260).
// Force de freinage constante F opposée au mouvement ; pente p = sin α (positive en montée) ; obstacle éventuel à la distance D.
// Le mouvement est uniformément décéléré : a = (F + m g p) / m ; si a ≤ 0 (descente trop forte), le véhicule ne s'arrête pas et finit par heurter l'obstacle.
export const G = 9.8, FPS = 120;
export const kmhEnMs = v => v / 3.6;
// Énergie potentielle comptée depuis le point le plus bas de la route parcourue (jamais négative).
export function trajet({ m, vkmh, F, p, D }) {
  const v0 = kmhEnMs(vkmh), a = (F + m * G * p) / m, Ec0 = 0.5 * m * v0 * v0;
  const dArret = a > 1e-9 ? v0 * v0 / (2 * a) : Infinity;
  const choc = dArret > D, xFin = choc ? D : dArret;
  const tFin = choc ? (a > 1e-9 ? (v0 - Math.sqrt(Math.max(v0 * v0 - 2 * a * D, 0))) / a : (Math.sqrt(v0 * v0 - 2 * a * D) - v0) / (-a)) : v0 / a;
  const zmin = Math.min(0, p * xFin), Epp0 = m * G * (0 - zmin), Em0 = Ec0 + Epp0;
  const frames = [], n = Math.max(Math.ceil(tFin * FPS), 1);
  for (let i = 0; i <= n; i++) {
    const t = Math.min(i / FPS, tFin), x = v0 * t - a * t * t / 2, v = Math.max(v0 - a * t, 0), z = p * x;
    const Ec = 0.5 * m * v * v, Epp = m * G * (z - zmin);
    frames.push({ t, x, v, z, Ec, Epp, Em: Ec + Epp, WF: -F * x, WP: -m * G * p * x, diss: Em0 - Ec - Epp, ph: 'M' });
  }
  const f = frames[frames.length - 1];
  return { v0, a, Ec0, Em0, dArret, choc, vChoc: choc ? f.v : 0, xFin, tFin: f.t, frames };
}
