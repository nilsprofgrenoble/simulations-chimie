// Modèle colorimétrique partagé par les simulations « Aspect et couleur » du BTS MDC (CIELAB, diagramme xyY, métamérisme).
// Observateur standard CIE 1931 (2°), illuminants CIE D65, A, F2 (voir couleurDonnees.js).
import { LAMBDA, XBAR, YBAR, ZBAR, ILLUMINANTS, LOCUS_LAMBDA, LOCUS_XY } from './couleurDonnees.js';

export const NB = LAMBDA.length;
export const ILLUM = { D65: { nom: 'D65', desc: 'lumière du jour' }, A: { nom: 'A', desc: 'lampe à incandescence' }, F2: { nom: 'F2', desc: 'tube fluorescent' } };
const K = id => { const S = ILLUMINANTS[id]; let y = 0; for (let i = 0; i < NB; i++) y += S[i] * YBAR[i]; return 100 / y; };

/** Blanc de référence d'un illuminant : XYZ du diffuseur parfait (réflectance 1), Y = 100. */
export const blancDe = id => xyz(new Array(NB).fill(1), id);

/** XYZ (Y du blanc = 100) d'un objet de réflectance spectrale refl (tableau de NB valeurs entre 0 et 1) éclairé par l'illuminant id. */
export function xyz(refl, id) {
  const S = ILLUMINANTS[id], k = K(id);
  let X = 0, Y = 0, Z = 0;
  for (let i = 0; i < NB; i++) { const e = S[i] * refl[i]; X += e * XBAR[i]; Y += e * YBAR[i]; Z += e * ZBAR[i]; }
  return { X: k * X, Y: k * Y, Z: k * Z };
}
export const BLANC_D65 = blancDe('D65');

/** Coordonnées de chromaticité x, y et luminance Y. */
export function xyY({ X, Y, Z }) { const s = X + Y + Z; return s > 0 ? { x: X / s, y: Y / s, Y } : { x: 0, y: 0, Y: 0 }; }
export function xyzDeXyY(x, y, Y) { return y > 0 ? { X: x * Y / y, Y, Z: (1 - x - y) * Y / y } : { X: 0, Y: 0, Z: 0 }; }

const f = t => t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
const finv = t => t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27);
/** CIELAB à partir de XYZ et du blanc de référence. */
export function lab({ X, Y, Z }, blanc = BLANC_D65) {
  const fx = f(X / blanc.X), fy = f(Y / blanc.Y), fz = f(Z / blanc.Z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}
export function xyzDeLab({ L, a, b }, blanc = BLANC_D65) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  return { X: blanc.X * finv(fx), Y: blanc.Y * finv(fy), Z: blanc.Z * finv(fz) };
}
export const rond = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

/** Coordonnées cylindriques : C* = chroma (saturation), h = angle de teinte en degrés (0 à 360). */
export function lch({ L, a, b }) {
  const C = Math.hypot(a, b); let h = Math.atan2(b, a) * 180 / Math.PI; if (h < 0) h += 360;
  return { L, C, h };
}
export const labDeLch = ({ L, C, h }) => ({ L, a: C * Math.cos(h * Math.PI / 180), b: C * Math.sin(h * Math.PI / 180) });

/** Écart échantillon − référence. */
export const ecart = (ech, ref) => ({ dL: ech.L - ref.L, da: ech.a - ref.a, db: ech.b - ref.b });
export function deltaE76(c1, c2) { const d = ecart(c1, c2); return Math.hypot(d.dL, d.da, d.db); }
/** Écarts cylindriques : ΔL*, ΔC*, ΔH* (ΔH* = écart de teinte, en unités de longueur, signé par le sens de rotation h). */
export function ecartCylindrique(ech, ref) {
  const A = lch(ref), B = lch(ech), d = ecart(ech, ref);
  const dC = B.C - A.C, dE2 = d.da ** 2 + d.db ** 2, dH2 = Math.max(0, dE2 - dC * dC);
  let dh = B.h - A.h; if (dh > 180) dh -= 360; if (dh < -180) dh += 360;
  return { dL: d.dL, dC, dH: Math.sign(dh) * Math.sqrt(dH2), dh };
}

/** Écart CMC(l:c) (tolérance CMC) ; ref = couleur cible. l = 2, c = 1 pour l'acceptabilité. */
export function deltaCMC(ech, ref, l = 2, c = 1) {
  const A = lch(ref), d = ecartCylindrique(ech, ref);
  const SL = A.L < 16 ? 0.511 : 0.040975 * A.L / (1 + 0.01765 * A.L);
  const SC = 0.0638 * A.C / (1 + 0.0131 * A.C) + 0.638;
  const F = Math.sqrt(A.C ** 4 / (A.C ** 4 + 1900));
  const h = A.h, T = (h >= 164 && h <= 345) ? 0.56 + Math.abs(0.2 * Math.cos((h + 168) * Math.PI / 180)) : 0.36 + Math.abs(0.4 * Math.cos((h + 35) * Math.PI / 180));
  const SH = SC * (F * T + 1 - F);
  return Math.sqrt((d.dL / (l * SL)) ** 2 + (d.dC / (c * SC)) ** 2 + (d.dH / SH) ** 2);
}
/** Demi-axes (dans le plan a*b*, en unités de a*b*) de l'ellipse de tolérance CMC de valeur tol autour de la référence : suivant la saturation (C*) et suivant la teinte (H*). */
export function ellipseCMC(ref, tol, c = 1) {
  const A = lch(ref), SC = 0.0638 * A.C / (1 + 0.0131 * A.C) + 0.638;
  const F = Math.sqrt(A.C ** 4 / (A.C ** 4 + 1900)), h = A.h;
  const T = (h >= 164 && h <= 345) ? 0.56 + Math.abs(0.2 * Math.cos((h + 168) * Math.PI / 180)) : 0.36 + Math.abs(0.4 * Math.cos((h + 35) * Math.PI / 180));
  const SH = SC * (F * T + 1 - F);
  return { rC: tol * c * SC, rH: tol * SH, angle: A.h };
}

// ---------- affichage sRGB (primaires et blanc D65) ----------
const M = [[3.2404542, -1.5371385, -0.4985314], [-0.969266, 1.8760108, 0.041556], [0.0556434, -0.2040259, 1.0572252]];
const gam = u => u <= 0.0031308 ? 12.92 * u : 1.055 * u ** (1 / 2.4) - 0.055;
/** XYZ (blanc D65 = 100) → sRGB 0–255, avec indication de sortie du gamut sRGB. */
export function srgb({ X, Y, Z }) {
  const x = X / 100, y = Y / 100, z = Z / 100;
  const lin = M.map(r => r[0] * x + r[1] * y + r[2] * z);
  const hors = lin.some(v => v < -0.002 || v > 1.002);
  const c = lin.map(v => Math.round(255 * gam(Math.min(1, Math.max(0, v)))));
  return { r: c[0], g: c[1], b: c[2], hors, css: `rgb(${c[0]}, ${c[1]}, ${c[2]})` };
}
export const cssDeLab = l => srgb(xyzDeLab(l)).css;
/** Couleur d'un objet de réflectance refl sous l'illuminant id, affichée SANS adaptation chromatique (le blanc de l'écran reste D65). */
export const cssObjet = (refl, id) => srgb(xyz(refl, id)).css;

// ---------- diagramme de chromaticité ----------
export const LIEU = LOCUS_LAMBDA.map((lam, i) => ({ lam, x: LOCUS_XY[i][0], y: LOCUS_XY[i][1] }));
export const BLANC_XY = (() => { const w = xyY(BLANC_D65); return { x: w.x, y: w.y }; })();
export const PRIMAIRES_SRGB = { R: { x: 0.64, y: 0.33 }, G: { x: 0.30, y: 0.60 }, B: { x: 0.15, y: 0.06 } };
/** Point du lieu spectral pour une longueur d'onde (interpolation linéaire entre points à 5 nm). */
export function pointLieu(lam) {
  const t = Math.min(700, Math.max(380, lam)), i = Math.min(LIEU.length - 2, Math.floor((t - 380) / 5)), u = (t - LIEU[i].lam) / 5;
  return { x: LIEU[i].x + u * (LIEU[i + 1].x - LIEU[i].x), y: LIEU[i].y + u * (LIEU[i + 1].y - LIEU[i].y) };
}
const segs = (() => { const s = []; for (let i = 0; i < LIEU.length - 1; i++) s.push({ a: LIEU[i], b: LIEU[i + 1], pourpre: false }); s.push({ a: LIEU[LIEU.length - 1], b: LIEU[0], pourpre: true }); return s; })();
/** Intersection du rayon issu de w (direction d) avec la frontière du diagramme (lieu spectral + droite des pourpres). */
function frontiere(w, d) {
  let best = null;
  for (const s of segs) {
    const ex = s.b.x - s.a.x, ey = s.b.y - s.a.y, den = d.x * ey - d.y * ex;
    if (Math.abs(den) < 1e-12) continue;
    const t = ((s.a.x - w.x) * ey - (s.a.y - w.y) * ex) / den, u = ((s.a.x - w.x) * d.y - (s.a.y - w.y) * d.x) / den;
    if (t > 1e-9 && u >= -1e-9 && u <= 1 + 1e-9 && (!best || t < best.t)) best = { t, x: w.x + t * d.x, y: w.y + t * d.y, pourpre: s.pourpre, lam: s.pourpre ? null : s.a.lam + Math.min(1, Math.max(0, u)) * 5 };
  }
  return best;
}
/** Lecture d'un point (x, y) : longueur d'onde dominante (ou complémentaire pour un pourpre), pureté d'excitation, complémentaire. */
export function lireChromaticite(x, y, w = BLANC_XY) {
  const dx = x - w.x, dy = y - w.y, n = Math.hypot(dx, dy);
  if (n < 1e-6) return { blanc: true, pourpre: false, dominante: null, complementaire: null, purete: 0 };
  const d = { x: dx / n, y: dy / n }, av = frontiere(w, d), ar = frontiere(w, { x: -d.x, y: -d.y });
  const purete = n / av.t;
  if (av.pourpre) return { blanc: false, pourpre: true, dominante: null, complementaire: ar && !ar.pourpre ? ar.lam : null, purete, frontiere: av, oppose: ar };
  return { blanc: false, pourpre: false, dominante: av.lam, complementaire: ar ? (ar.pourpre ? null : ar.lam) : null, purete, frontiere: av, oppose: ar };
}
/** Point de chromaticité de longueur d'onde dominante lam et de pureté p (0 : blanc, 1 : lumière monochromatique). */
export function pointDeDominante(lam, p, w = BLANC_XY) { const L = pointLieu(lam); return { x: w.x + p * (L.x - w.x), y: w.y + p * (L.y - w.y) }; }
export function dansTriangle(P, T) {
  const s = (a, b, c) => (a.x - c.x) * (b.y - c.y) - (b.x - c.x) * (a.y - c.y);
  const d1 = s(P, T.R, T.G), d2 = s(P, T.G, T.B), d3 = s(P, T.B, T.R);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
/** Teinte approximative (nom) d'une longueur d'onde dominante. */
export function nomTeinte(lam) {
  if (lam == null) return 'pourpre';
  if (lam < 450) return 'violet'; if (lam < 480) return 'bleu'; if (lam < 500) return 'cyan'; if (lam < 560) return 'vert';
  if (lam < 575) return 'jaune-vert'; if (lam < 590) return 'jaune'; if (lam < 620) return 'orange'; return 'rouge';
}
/** Couleur d'affichage d'un point xy à la luminance Y (sRGB, normalisée pour rester dans le gamut si possible). */
export function cssXY(x, y, Y = 100) { return srgb(xyzDeXyY(x, y, Y)).css; }
/** Couleur affichable : on fixe la luminance au maximum compatible avec le gamut sRGB (pour colorier le diagramme). */
export function cssXYNormalise(x, y) {
  const c = xyzDeXyY(x, y, 1), lin = M.map(r => r[0] * c.X + r[1] * c.Y + r[2] * c.Z);
  let neg = Math.min(...lin); let v = lin;
  if (neg < 0) v = lin.map(u => u - neg);                 // désaturation minimale vers le blanc pour rester affichable
  const m = Math.max(...v) || 1, e = v.map(u => Math.round(255 * gam(Math.max(0, u / m))));
  return `rgb(${e[0]}, ${e[1]}, ${e[2]})`;
}

/** Point pourpre de longueur d'onde complémentaire lamC (entre 493 et 566 nm environ) et de pureté p (0 : blanc, 1 : sur la droite des pourpres). */
export function pointPourpre(lamC, p, w = BLANC_XY) {
  const L = pointLieu(lamC), n = Math.hypot(w.x - L.x, w.y - L.y), d = { x: (w.x - L.x) / n, y: (w.y - L.y) / n }, f = frontiere(w, d);
  return { x: w.x + p * (f.x - w.x), y: w.y + p * (f.y - w.y) };
}
/** Mélange additif de deux lumières de chromaticités P1 et P2 : le point du mélange est sur le segment P1P2.
 *  w = part de la lumière 2 dans le mélange, exprimée en X + Y + Z (0 : lumière 1 seule, 1 : lumière 2 seule). */
export function melange(P1, P2, w) { return { x: (1 - w) * P1.x + w * P2.x, y: (1 - w) * P1.y + w * P2.y }; }
/** Le point (x, y) est-il à l'intérieur du diagramme (couleur physiquement possible) ? */
export function dansDiagramme(x, y) {
  const poly = LIEU; let dedans = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) dedans = !dedans;
  }
  return dedans;
}
