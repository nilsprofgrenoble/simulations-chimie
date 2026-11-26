// Solide des couleurs d'un écran (gamut sRGB) dans l'espace CIELAB, pour la vue 3D de la simulation 247.
// Modèle pur : maillages (sommets, couleurs, triangles) prêts pour Plotly. Le solide n'est PAS une sphère : c'est l'image du cube RGB.
import { srgb, xyzDeLab, lab, ellipseCMC } from './couleurModele.js';

const lin = u => { const v = u / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
/** Couleur sRGB (0 à 255) → CIELAB (blanc D65). */
export function rgbVersLab(r, g, b) {
  const R = lin(r), G = lin(g), B = lin(b);
  return lab({ X: 100 * (0.4124564 * R + 0.3575761 * G + 0.1804375 * B), Y: 100 * (0.2126729 * R + 0.7151522 * G + 0.0721750 * B), Z: 100 * (0.0193339 * R + 0.1191920 * G + 0.9503041 * B) });
}
const css = (r, g, b) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
const dedans = (L, a, b) => !srgb(xyzDeLab({ L, a, b })).hors;
/** Saturation maximale (distance au centre dans le plan a*b*) affichable à la luminosité L et dans la direction thetaDeg. */
export function rhoMax(L, thetaDeg) {
  const c = Math.cos(thetaDeg * Math.PI / 180), s = Math.sin(thetaDeg * Math.PI / 180);
  if (!dedans(L, 0, 0)) return 0;
  let lo = 0, hi = 170;
  for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (dedans(L, m * c, m * s)) lo = m; else hi = m; }
  return lo;
}
function triGrille(nu, nv, base) { // triangles d'une grille (nu+1) x (nv+1) de sommets numérotés à partir de base
  const I = [], J = [], K = [];
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const p = base + i * (nv + 1) + j, q = p + 1, r = p + nv + 1, s = r + 1;
    I.push(p, q); J.push(r, r); K.push(q, s);
  }
  return { I, J, K };
}

/** Surface du solide : les 6 faces du cube RGB, vues en CIELAB. n = nombre de mailles par côté. Les sommets portent leur vraie couleur. */
export function surfaceSolide(n = 28) {
  const x = [], y = [], z = [], col = [], I = [], J = [], K = [];
  for (const [fixe, val] of [[0, 0], [0, 255], [1, 0], [1, 255], [2, 0], [2, 255]]) {
    const base = x.length;
    for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
      const rgb = [0, 0, 0], libres = [0, 1, 2].filter(k => k !== fixe);
      rgb[fixe] = val; rgb[libres[0]] = 255 * i / n; rgb[libres[1]] = 255 * j / n;
      const l = rgbVersLab(...rgb); x.push(l.a); y.push(l.b); z.push(l.L); col.push(css(...rgb));
    }
    const t = triGrille(n, n, base); I.push(...t.I); J.push(...t.J); K.push(...t.K);
  }
  return { x, y, z, col, I, J, K };
}
/** Retire du maillage les triangles du « quart ouvert » (celui qui fait face à l'observateur) : a* > 0, b* < 0 et au-dessus de la luminosité L0. */
export function ouvrirQuart(m, L0) {
  const I = [], J = [], K = [];
  for (let t = 0; t < m.I.length; t++) {
    const p = [m.I[t], m.J[t], m.K[t]], cx = (m.x[p[0]] + m.x[p[1]] + m.x[p[2]]) / 3, cy = (m.y[p[0]] + m.y[p[1]] + m.y[p[2]]) / 3, cz = (m.z[p[0]] + m.z[p[1]] + m.z[p[2]]) / 3;
    if (cx > 0 && cy < 0 && cz > L0) continue;
    I.push(p[0]); J.push(p[1]); K.push(p[2]);
  }
  return { ...m, I, J, K };
}
const couleurLab = (L, a, b) => { const c = srgb(xyzDeLab({ L, a, b })); return css(c.r, c.g, c.b); };
/** Retire du maillage les triangles de la moitié avant (b* < 0) située au-dessus de la luminosité L0 : on voit alors le disque de coupe et, derrière, la coupe verticale b* = 0. */
export function ouvrirDemi(m, L0) {
  const I = [], J = [], K = [];
  for (let t = 0; t < m.I.length; t++) {
    const p = [m.I[t], m.J[t], m.K[t]], cy = (m.y[p[0]] + m.y[p[1]] + m.y[p[2]]) / 3, cz = (m.z[p[0]] + m.z[p[1]] + m.z[p[2]]) / 3;
    if (cy < 0 && cz > L0) continue;
    I.push(p[0]); J.push(p[1]); K.push(p[2]);
  }
  return { ...m, I, J, K };
}
/** Face de coupe verticale : demi-plan d'azimut thetaDeg, de la luminosité L0 à 100. */
export function faceCoupe(thetaDeg, L0, nL = 20, nr = 16) {
  const x = [], y = [], z = [], col = [], c = Math.cos(thetaDeg * Math.PI / 180), s = Math.sin(thetaDeg * Math.PI / 180);
  for (let i = 0; i <= nL; i++) {
    const L = L0 + (100 - L0) * i / nL, rm = rhoMax(L, thetaDeg);
    for (let j = 0; j <= nr; j++) { const r = rm * j / nr; x.push(r * c); y.push(r * s); z.push(L); col.push(couleurLab(L, r * c, r * s)); }
  }
  return { x, y, z, col, ...triGrille(nL, nr, 0) };
}
/** Disque de coupe horizontal à la luminosité L0 (limité par le solide). */
export function disqueCoupe(L0, nth = 72, nr = 14) {
  const x = [], y = [], z = [], col = [], I = [], J = [], K = [];
  x.push(0); y.push(0); z.push(L0); col.push(couleurLab(L0, 0, 0));
  for (let k = 0; k < nth; k++) { const th = 360 * k / nth, rm = rhoMax(L0, th); for (let r = 1; r <= nr; r++) { const rho = rm * r / nr, a = rho * Math.cos(th * Math.PI / 180), b = rho * Math.sin(th * Math.PI / 180); x.push(a); y.push(b); z.push(L0); col.push(couleurLab(L0, a, b)); } }
  const id = (r, k) => 1 + (k % nth) * nr + (r - 1);
  for (let k = 0; k < nth; k++) {
    I.push(0); J.push(id(1, k)); K.push(id(1, k + 1));
    for (let r = 1; r < nr; r++) { I.push(id(r, k), id(r, k + 1)); J.push(id(r + 1, k), id(r + 1, k)); K.push(id(r, k + 1), id(r + 1, k + 1)); }
  }
  return { x, y, z, col, I, J, K };
}
/** Positions (a*, b*) des ellipses CMC dessinées sur le disque de coupe : le centre, puis des anneaux de saturation C* = 15, 30, 45, 60 (si la couleur existe à la luminosité L0). */
export function positionsEllipses(L0) {
  const p = [{ a: 0, b: 0 }];
  for (const [c, n] of [[15, 6], [30, 12], [45, 18], [60, 24]]) for (let k = 0; k < n; k++) { const h = 360 * k / n + (c === 30 || c === 60 ? 360 / n / 2 : 0), a = c * Math.cos(h * Math.PI / 180), b = c * Math.sin(h * Math.PI / 180); if (dedans(L0, a, b)) p.push({ a: Math.round(a * 10) / 10, b: Math.round(b * 10) / 10 }); }
  return p;
}
/** Contours (avec trous « null » entre deux ellipses) des ellipses CMC de valeur tol, agrandies k fois, posées à la hauteur zc. */
export function contoursEllipses(positions, L0, tol, k, zc, np = 36) {
  const x = [], y = [], z = [];
  for (const p of positions) {
    const e = ellipseCMC({ L: L0, a: p.a, b: p.b }, tol), h = e.angle * Math.PI / 180;
    for (let i = 0; i <= np; i++) { const t = 2 * Math.PI * i / np, u = k * e.rC * Math.cos(t), v = k * e.rH * Math.sin(t); x.push(p.a + u * Math.cos(h) - v * Math.sin(h)); y.push(p.b + u * Math.sin(h) + v * Math.cos(h)); z.push(zc); }
    x.push(null); y.push(null); z.push(null);
  }
  return { x, y, z };
}
