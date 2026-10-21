// ====================================================
//  Modèle commun aux sims 64 (réfraction) et 65 (lentille convergente) — 2GT, « Ondes et signaux : propagation de la lumière ».
//  Optique géométrique : rayons rectilignes dans un milieu homogène, loi de Snell-Descartes à chaque interface,
//  indices à 589 nm (dispersion ignorée), interfaces parfaites, lentille de verre de géométrie simple (plan-convexe ou biconvexe).
// ====================================================
export { fr } from './forcesModele.js';

const RAD = Math.PI / 180;
export const MILIEUX = [
  { id: 'air', nom: 'air', n: 1.00 },
  { id: 'eau', nom: 'eau', n: 1.33 },
  { id: 'eausucree', nom: 'eau sucrée (20 %)', n: 1.36 },
  { id: 'glycerol', nom: 'glycérol', n: 1.47 },
  { id: 'plexi', nom: 'plexiglas', n: 1.51 },
  { id: 'diamant', nom: 'diamant', n: 2.42 },
];
export const milieu = id => MILIEUX.find(m => m.id === id);

// angle de réfraction (°) ; null en cas de réflexion totale
export const refraction = (n1, n2, i1) => { const s = n1 * Math.sin(i1 * RAD) / n2; return s > 1 + 1e-12 ? null : Math.asin(Math.min(1, s)) / RAD; };
export const angleLimite = (n1, n2) => (n1 > n2 ? Math.asin(n2 / n1) / RAD : null);
export const indiceDepuis = (i1, i2) => Math.sin(i1 * RAD) / Math.sin(i2 * RAD);          // air (n1 = 1) → milieu
// mesure au rapporteur : lecture au demi-degré
export const lire = x => Math.round(x * 2) / 2;
export const mesurerI2 = (n, i1) => lire(refraction(1, n, i1));
// pente d'une droite passant par l'origine, y = k x (moindres carrés)
export const pente = pts => { const sxy = pts.reduce((s, [x, y]) => s + x * y, 0), sxx = pts.reduce((s, [x]) => s + x * x, 0); return sxx > 0 ? sxy / sxx : NaN; };

// ---------- le pêcheur et le poisson (plan vertical, surface de l'eau en y = 0) ----------
// poisson en (xf, -d) ; œil en (xe, h) avec xe < xf ; cherche le point P de la surface par où passe la lumière
export function pecheur({ xf, d, xe, h, n = 1.33 }) {
  const g = xp => { const tw = Math.atan((xf - xp) / d), s = Math.min(1, n * Math.sin(tw)), ta = Math.asin(s); return (xp - xe) - h * Math.tan(ta); };
  let a = xe, b = xf;
  for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (g(m) < 0) a = m; else b = m; }
  const xp = (a + b) / 2, aimX = xp + (xp - xe) * (d / h);      // la ligne œil → P prolongée en ligne droite, au niveau du poisson
  return { xp, aimX, rate: aimX - xf, tw: Math.atan((xf - xp) / d) / RAD, ta: Math.atan((xp - xe) / h) / RAD };
}

// ---------- lentille : lancer de rayons (unités : px ; 40 px = 1 cm) ----------
export const PX_CM = 40;
const norm = v => { const l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l]; };
function snell(d, nrm, n1, n2) {
  let c = -(nrm[0] * d[0] + nrm[1] * d[1]);
  if (c < 0) { nrm = [-nrm[0], -nrm[1]]; c = -c; }
  const r = n1 / n2, k = 1 - r * r * (1 - c * c);
  if (k < 0) return null;
  const f = r * c - Math.sqrt(k);
  return norm([r * d[0] + f * nrm[0], r * d[1] + f * nrm[1]]);
}
const flecheSphere = (R, H) => R - Math.sqrt(R * R - H * H);
// lentille : { type: 'plano' | 'bi', R, H, n, x0 (sommet de la face d'entrée), next (indice extérieur) }
export function geometrie(L) {
  const sag = flecheSphere(L.R, L.H), ep = L.type === 'plano' ? sag : 2 * sag;
  return { ep, xO: L.x0 + ep / 2, x1: L.x0 + ep, c1: [L.x0 + L.R, 0], c2: L.type === 'bi' ? [L.x0 + ep - L.R, 0] : null };
}
// trace le rayon parallèle à l'axe de hauteur h (px, > 0 vers le haut) ; renvoie les points, la direction finale et les angles
export function tracer(L, h, xDepart = 20) {
  const G = geometrie(L), ne = L.next ?? 1, n = L.n;
  const p0 = [xDepart, h], d0 = [1, 0];
  // face d'entrée (sphère de centre c1), première intersection
  const dx = p0[0] - G.c1[0], dy = p0[1] - G.c1[1], b = d0[0] * dx + d0[1] * dy, disc = b * b - (dx * dx + dy * dy - L.R * L.R);
  if (disc < 0) return null;
  const t1 = -b - Math.sqrt(disc), q1 = [p0[0] + t1 * d0[0], p0[1] + t1 * d0[1]];
  const nrm1 = norm([q1[0] - G.c1[0], q1[1] - G.c1[1]]), d1 = snell(d0, nrm1, ne, n);
  if (!d1) return { pts: [p0, q1], fin: null };
  const i1 = Math.acos(Math.abs(nrm1[0] * d0[0] + nrm1[1] * d0[1])) / RAD, r1 = Math.acos(Math.abs(nrm1[0] * d1[0] + nrm1[1] * d1[1])) / RAD;
  let q2, nrm2;
  if (L.type === 'plano') { const t = (G.x1 - q1[0]) / d1[0]; q2 = [G.x1, q1[1] + t * d1[1]]; nrm2 = [1, 0]; }
  else {
    const ex = q1[0] - G.c2[0], ey = q1[1] - G.c2[1], bb = d1[0] * ex + d1[1] * ey, dd = bb * bb - (ex * ex + ey * ey - L.R * L.R);
    if (dd < 0) return { pts: [p0, q1], fin: null };
    const t = -bb + Math.sqrt(dd); q2 = [q1[0] + t * d1[0], q1[1] + t * d1[1]]; nrm2 = norm([q2[0] - G.c2[0], q2[1] - G.c2[1]]);
  }
  const d2 = snell(d1, nrm2, n, ne);
  if (!d2) return { pts: [p0, q1, q2], fin: null, tir: true };
  const cx = d2[1] !== 0 && q2[1] * d2[1] < 0 ? q2[0] - q2[1] / d2[1] * d2[0] : null;      // abscisse du croisement de l'axe
  return { pts: [p0, q1, q2], fin: d2, nrm1, nrm2, q1, q2, i1, r1, xAxe: cx };
}
// foyer image (rayon quasi axial) et distance focale en cm, mesurée depuis le centre optique O
export function foyer(L) {
  const r = tracer(L, 0.02 * L.H), G = geometrie(L);
  if (!r || r.xAxe == null) return null;
  return { xF: r.xAxe, f: (r.xAxe - G.xO) / PX_CM };
}
