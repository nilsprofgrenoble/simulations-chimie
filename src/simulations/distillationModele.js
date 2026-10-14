// ════════════════════════════════════════════════════════════════════════════
//  MODÈLE DE LA DISTILLATION D'UN MÉLANGE BINAIRE (pression constante 1,013 bar)
//  Fonctions pures, partagées par les simulations du chapitre « Distillation ».
//  Convention du cours : en abscisse, la fraction molaire x du composé le plus volatil (A) ; B est le moins volatil.
// ════════════════════════════════════════════════════════════════════════════
import { TABLES, GRILLE } from './distillationDonnees';

export const MELANGES = {
  ew: { id: 'ew', nom: 'eau – éthanol', A: 'éthanol', B: 'eau', fA: 'EtOH', fB: 'H₂O', MA: 46, MB: 18, coulA: '#dc2626', coulB: '#2563eb',
    x0: 0.04, type: 'min', note: 'Azéotrope à minimum de température : c’est le cas du vin (distillation de l’éthanol).' },
  bt: { id: 'bt', nom: 'benzène – toluène', A: 'benzène', B: 'toluène', fA: 'benzène', fB: 'toluène', MA: 78, MB: 92, coulA: '#dc2626', coulB: '#2563eb',
    x0: 0.5, type: 'ideal', note: 'Mélange quasi idéal, sans azéotrope : c’est le cas de la vidéo.' },
  ca: { id: 'ca', nom: 'chloroforme – acétone', A: 'acétone', B: 'chloroforme', fA: 'acétone', fB: 'CHCl₃', MA: 58, MB: 119.5, coulA: '#dc2626', coulB: '#2563eb',
    x0: 0.2, type: 'max', note: 'Azéotrope à maximum de température : l’azéotrope reste dans le bouilleur.' },
};
for (const k of Object.keys(MELANGES)) { const m = MELANGES[k]; m.T = TABLES[k].T; m.y = TABLES[k].y; m.az = TABLES[k].az; }

const interp = (tab, u) => {
  const p = Math.min(Math.max(u, 0), 1) * GRILLE, i = Math.min(Math.floor(p), GRILLE - 1), f = p - i;
  return tab[i] + (tab[i + 1] - tab[i]) * f;
};
// Température d'ébullition commençante d'un liquide de composition x (courbe d'ébullition)
export const Teb = (m, x) => interp(m.T, x);
// Composition de la vapeur en équilibre avec un liquide de composition x
export const yEq = (m, x) => interp(m.y, x);
// Composition du liquide en équilibre avec une vapeur de composition y (inverse de yEq : y(x) est croissante)
export function xEq(m, y) {
  if (y <= 0) return 0; if (y >= 1) return 1;
  let a = 0, b = GRILLE;
  while (b - a > 1) { const c = (a + b) >> 1; if (m.y[c] <= y) a = c; else b = c; }
  const d = m.y[b] - m.y[a]; return (a + (d > 0 ? (y - m.y[a]) / d : 0)) / GRILLE;
}
// Température de rosée d'une vapeur de composition y (courbe de rosée)
export const Tros = (m, y) => Teb(m, xEq(m, y));

// Escalier du cours : n plateaux au-dessus du bouilleur (n = 0 : distillation simple).
// étage k : liquide x_k à T_k = Teb(x_k) ; vapeur y_{k+1} = yEq(x_k) ; elle se condense : x_{k+1} = y_{k+1}.
export function escalier(m, xB, n) {
  const et = []; let x = xB;
  const nmax = n === Infinity ? 400 : n + 1;
  for (let k = 0; k < nmax; k++) {
    const y = yEq(m, x);
    et.push({ x, T: Teb(m, x), y });
    if (n === Infinity && Math.abs(y - x) < 1e-5) break;
    x = y;
  }
  return et;
}
// Composition de la vapeur en tête de colonne et température en tête
export function tete(m, xB, n) {
  const et = escalier(m, xB, n), dern = et[et.length - 1];
  return { y: dern.y, T: dern.T, et };
}

// Distillation discontinue (Rayleigh), colonne à reflux total sans rétention : le distillat soutiré a la composition
// de la vapeur de tête. Renvoie une trajectoire en fonction de la fraction f de la quantité de matière initiale distillée.
export function trajectoire(m, x0, n, fmax = 0.97) {
  const pts = []; let nB = 1, xB = x0, nD = 0, nAD = 0;
  for (let k = 0; k < 6000; k++) {
    const t = tete(m, xB, n);
    pts.push({ f: nD, xB, nB, yD: t.y, TB: Teb(m, xB), Tt: t.T, xDcum: nD > 0 ? nAD / nD : t.y, rend: nAD / x0 });
    if (nD >= fmax - 1e-9 || xB < 0.002 * x0) break;
    // pas adaptatif : jamais plus de 3 % de ce qui reste du composé A dans le bouilleur, ni 0,5 % de la quantité initiale
    const dn = Math.max(1e-6, Math.min(0.005, 0.03 * nB * xB / Math.max(t.y, 1e-9), fmax - nD));
    const nBn = nB - dn, nAn = nB * xB - t.y * dn;
    if (nBn <= 1e-6 || nAn < 0) break;
    nD += dn; nAD += t.y * dn; nB = nBn; xB = nAn / nBn;
  }
  return pts;
}
// Point de la trajectoire le plus proche d'une fraction distillée f
export function pointA(traj, f) {
  let a = 0, b = traj.length - 1;
  while (b - a > 1) { const c = (a + b) >> 1; if (traj[c].f <= f) a = c; else b = c; }
  return f - traj[a].f <= traj[b].f - f ? traj[a] : traj[b];
}

// Fractions molaire ↔ massique
export const wDe = (m, x) => x * m.MA / (x * m.MA + (1 - x) * m.MB);
export const xDe = (m, w) => (w / m.MA) / (w / m.MA + (1 - w) / m.MB);

// Degré alcoolique (% en volume à 20 °C) d'un mélange eau-éthanol de fraction massique w : masses volumiques tabulées
const RHO_W = [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const RHO = [0.9982, 0.9893, 0.9819, 0.9686, 0.9538, 0.9352, 0.9138, 0.8911, 0.8677, 0.8434, 0.8180, 0.7893];
export function rhoMelange(w) {
  let k = 0; while (k < RHO_W.length - 2 && w > RHO_W[k + 1]) k++;
  return RHO[k] + (RHO[k + 1] - RHO[k]) * (w - RHO_W[k]) / (RHO_W[k + 1] - RHO_W[k]);
}
export const degre = w => 100 * w * rhoMelange(w) / 0.7893;

// Ce que donne une colonne infinie : où va le distillat, que reste-t-il dans le bouilleur
export function bilanColonneInfinie(m, x0) {
  const t = tete(m, x0, Infinity);
  const bornes = [0, 1]; if (m.az) bornes.splice(1, 0, m.az[0]);
  bornes.sort((a, b) => a - b);
  let lo = 0, hi = 1;
  for (let i = 0; i < bornes.length - 1; i++) if (x0 >= bornes[i] && x0 <= bornes[i + 1]) { lo = bornes[i]; hi = bornes[i + 1]; }
  const proche = (a, b) => Math.abs(a - b) < 0.02;
  const nom = v => (m.az && proche(v, m.az[0]) ? 'az' : proche(v, 0) ? 'B' : 'A');
  const distillat = nom(t.y);
  const residu = proche(t.y, lo) ? nom(hi) : nom(lo);
  return { distillat, residu, yD: t.y };
}

// Équilibre à la température T d'un mélange de composition globale z (mol de A pour 1 mol de mélange) :
// domaine (liquide L, vapeur V, ou deux phases LV), composition du liquide xL et de la vapeur yV, proportion de vapeur.
export function equilibreA(m, z, T) {
  const Tb = Teb(m, z), Td = Tros(m, z);
  if (Td - Tb < 0.02) return { phase: T < Tb - 1e-9 ? 'L' : T > Tb + 1e-9 ? 'V' : 'LV', xL: z, yV: z, phi: T > Tb ? 1 : 0, Tb, Td, constant: true };
  if (T <= Tb) return { phase: 'L', xL: z, yV: null, phi: 0, Tb, Td };
  if (T >= Td) return { phase: 'V', xL: null, yV: z, phi: 1, Tb, Td };
  let lo = 0, hi = 1;
  if (m.az) { if (z < m.az[0]) hi = m.az[0]; else lo = m.az[0]; }
  const decroit = Teb(m, lo) > Teb(m, hi);
  let a = lo, b = hi;
  for (let i = 0; i < 50; i++) { const c = (a + b) / 2; if ((Teb(m, c) > T) === decroit) a = c; else b = c; }
  const xL = (a + b) / 2, yV = yEq(m, xL);
  const phi = Math.min(1, Math.max(0, Math.abs(yV - xL) < 1e-6 ? 0.5 : (z - xL) / (yV - xL)));
  return { phase: 'LV', xL, yV, phi, Tb, Td };
}
