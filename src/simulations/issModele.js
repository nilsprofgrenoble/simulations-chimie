// ====================================================
//  Modèle de la sim 67 (ISS en chute libre) — 2GT, « Mouvement et interactions ».
//  Hypothèses : Terre sphérique et homogène, seule la Terre attire, pas d'atmosphère, trajectoire dans un plan, lancement horizontal.
//  Unités du calcul d'orbite : km et s (μ = G·M). Unités de la cabine : m et s.
// ====================================================
export { fr } from './forcesModele.js';
import { G, astre, gravite } from './forcesModele.js';

const T = astre('terre');
export const R_KM = T.R / 1000;                       // 6 378 km
export const MU = G * T.M / 1e9;                      // km³/s²
export const gAlt = hKm => gravite(T, hKm * 1000);    // N/kg à l'altitude h (km)
export const G0 = gAlt(0);
export const vOrb = hKm => Math.sqrt(MU / (R_KM + hKm));                       // km/s, orbite circulaire
export const periode = hKm => 2 * Math.PI * Math.sqrt((R_KM + hKm) ** 3 / MU);  // s

// type de trajectoire pour un lancement horizontal à l'altitude h (km) avec la vitesse v (km/s)
export function typeOrbite(hKm, v) {
  const r0 = R_KM + hKm, eps = v * v / 2 - MU / r0, vo = vOrb(hKm);
  if (Math.abs(v - vo) <= 0.1) return { type: 'circulaire', apogee: r0, perigee: r0 };
  if (eps >= 0) return { type: 'libération', apogee: Infinity, perigee: r0 };
  const a = -MU / (2 * eps), h = r0 * v, e = Math.sqrt(Math.max(0, 1 + 2 * eps * h * h / (MU * MU)));
  const rp = a * (1 - e), ra = a * (1 + e);
  return { type: rp < R_KM ? 'impact' : 'ellipse', apogee: ra, perigee: rp };
}
// intégration (Verlet) : état {x, y, vx, vy} en km et km/s ; départ au sommet (0, R+h), vitesse horizontale vers la droite
export const depart = (hKm, v) => ({ x: 0, y: R_KM + hKm, vx: v, vy: 0, t: 0, fini: false });
export function pas(s, dt) {
  if (s.fini) return s;
  const acc = (x, y) => { const r = Math.hypot(x, y), k = -MU / (r * r * r); return [k * x, k * y]; };
  const [ax, ay] = acc(s.x, s.y);
  const vx1 = s.vx + 0.5 * dt * ax, vy1 = s.vy + 0.5 * dt * ay;
  const x = s.x + dt * vx1, y = s.y + dt * vy1, [bx, by] = acc(x, y);
  const n = { x, y, vx: vx1 + 0.5 * dt * bx, vy: vy1 + 0.5 * dt * by, t: s.t + dt, fini: false };
  if (Math.hypot(x, y) <= R_KM) { n.fini = true; const r = Math.hypot(x, y); n.x = x * R_KM / r; n.y = y * R_KM / r; }
  return n;
}
export function trajectoire(hKm, v, duree, dt = 10) {
  let s = depart(hKm, v); const pts = [[s.x, s.y]];
  while (s.t < duree && !s.fini) { s = pas(s, dt); pts.push([s.x, s.y]); }
  return { pts, fin: s };
}
// ---------- cabine (m, s) ----------
// accélération extérieure g_ext et accélération de la cabine a_cab (m/s², vers le bas) : celle de la balle dans la cabine = g_ext − a_cab
export const CONTEXTES = {
  sol: { nom: 'Cabine posée au sol', aCab: g => 0 * g },
  chute: { nom: 'Cabine en chute libre (tour de chute)', aCab: g => g },
  iss: { nom: 'Station en orbite', aCab: g => g },
};
export const accRelative = (ctx, g) => g - CONTEXTES[ctx].aCab(g);          // m/s² vers le bas, dans le référentiel de la cabine
export const balance = (ctx, m, g) => m * accRelative(ctx, g);               // N, force que l'astronaute exerce sur la balance
