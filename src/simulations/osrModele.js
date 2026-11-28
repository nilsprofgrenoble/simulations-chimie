// Modèle pur de la simulation 323 « Oscillations forcées et résonance » (TSTL, SPCL, Ondes).
// Oscillateur linéaire amorti, excité par un moteur à la fréquence fe : x'' + 2ζω0 x' + ω0² x = ω0² a cos(ωt), ζ = 1/(2Q).
// a = amplitude de l'excitation (cm). Régime permanent : x = A cos(ωt − φ), A = a / √((1 − r²)² + (2ζr)²), r = fe/f0.
export const REGLAGES = { f0: 2, a: 1, fMax: 4, tFin: 10 };
export const QS = [2.5, 4, 6, 10];
export const zeta = Q => 1 / (2 * Q);
const w = f => 2 * Math.PI * f;

export function amp(fe, f0, Q, a = REGLAGES.a) {
  const r = fe / f0, z = zeta(Q);
  return a / Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2);
}
export function phase(fe, f0, Q) { const r = fe / f0, z = zeta(Q); return Math.atan2(2 * z * r, 1 - r * r); }
// Fréquence de résonance en amplitude (existe si ζ < 1/√2) et amplitude maximale.
export function fRes(f0, Q) { const z = zeta(Q); return f0 * Math.sqrt(Math.max(0, 1 - 2 * z * z)); }
export function ampMax(f0, Q, a = REGLAGES.a) { const z = zeta(Q); return a / (2 * z * Math.sqrt(1 - z * z)); }
// Bande passante : fréquences f1 < fres < f2 où l'amplitude vaut Amax/√2 (bissection, exacte).
export function bande(f0, Q, a = REGLAGES.a) {
  const fr = fRes(f0, Q), cible = ampMax(f0, Q, a) / Math.SQRT2, g = f => amp(f, f0, Q, a) - cible;
  const bis = (lo, hi) => { let l = lo, h = hi; for (let i = 0; i < 80; i++) { const m = (l + h) / 2; if (g(l) * g(m) <= 0) h = m; else l = m; } return (l + h) / 2; };
  const f1 = bis(1e-6, fr), f2 = bis(fr, 3 * f0);
  return { f1, f2, df: f2 - f1 };
}
export const Qmesure = (f0, Q) => fRes(f0, Q) / bande(f0, Q).df;

// Solution complète à partir du repos (régime transitoire + régime permanent), en cm.
export function pos(t, fe, f0, Q, a = REGLAGES.a) {
  const z = zeta(Q), w0 = w(f0), om = w(fe), A = amp(fe, f0, Q, a), ph = phase(fe, f0, Q);
  const xp = A * Math.cos(om * t - ph), s = z * w0, wd = w0 * Math.sqrt(1 - z * z);
  const xp0 = A * Math.cos(ph), vp0 = A * om * Math.sin(ph);
  const C1 = -xp0, C2 = (s * C1 - vp0) / wd;
  return xp + Math.exp(-s * t) * (C1 * Math.cos(wd * t) + C2 * Math.sin(wd * t));
}
export const support = (t, fe, a = REGLAGES.a) => a * Math.cos(w(fe) * t);

// Défi 1 : régler l'excitateur sur la résonance (réussi si l'amplitude atteint 90 % du maximum).
export const SEUIL_RES = 0.9;
export function tirageReglage() {
  const f0 = 12 + Math.floor(Math.random() * 19), Q = [4, 6, 10][Math.floor(Math.random() * 3)];
  return { f0: f0 / 10, Q, cle: Math.random() };
}
export function diagReglage(d, fe) {
  const A = amp(fe, d.f0, d.Q), Am = ampMax(d.f0, d.Q), ok = A >= SEUIL_RES * Am - 1e-9;
  if (ok) return { ok: true, msg: '' };
  const fr = fRes(d.f0, d.Q);
  return { ok: false, msg: fe < fr ? 'L’amplitude n’est pas maximale : la fréquence d’excitation est trop basse. Augmentez-la peu à peu et surveillez l’amplitude.' : 'L’amplitude n’est pas maximale : la fréquence d’excitation est trop haute. Diminuez-la peu à peu et surveillez l’amplitude.' };
}
// Défi 2 : calculer Q = f_res / Δf à partir de f_res, f1 et f2 affichées (arrondies au centième de hertz).
export const TOL_Q = 0.06;
export function tirageQ() {
  const f0 = (12 + Math.floor(Math.random() * 19)) / 10, Q = [4, 5, 6, 8, 10][Math.floor(Math.random() * 5)];
  const b = bande(f0, Q), r2 = x => Math.round(x * 100) / 100, fr = r2(fRes(f0, Q)), f1 = r2(b.f1), f2 = r2(b.f2);
  return { f0, Qmodele: Q, fr, f1, f2, Q: fr / (f2 - f1) };
}
export function diagQ(d, saisie) {
  const v = Number(String(saisie).replace(',', '.').trim());
  if (!String(saisie).trim() || !Number.isFinite(v)) return { ok: false, msg: 'Saisissez un nombre : le facteur de qualité Q (sans unité).' };
  if (v <= 0) return { ok: false, msg: 'Q est un nombre positif.' };
  const rel = Math.abs(v - d.Q) / d.Q;
  if (rel <= TOL_Q) return { ok: true, msg: '' };
  const df = d.f2 - d.f1;
  if (Math.abs(v - df / d.fr) / (df / d.fr) <= TOL_Q) return { ok: false, msg: 'Vous avez inversé le rapport : Q = f_res divisée par Δf, avec Δf = f2 − f1.' };
  if (Math.abs(v - d.fr / d.f2) / (d.fr / d.f2) <= TOL_Q || Math.abs(v - d.fr / d.f1) / (d.fr / d.f1) <= TOL_Q) return { ok: false, msg: 'Vous avez divisé par f1 ou f2 : il faut diviser f_res par la largeur de la bande, Δf = f2 − f1.' };
  return { ok: false, msg: v < d.Q ? 'Valeur trop petite : refaites le calcul avec f_res et Δf = f2 − f1 ; Q doit être supérieur à 1 pour une résonance marquée.' : 'Valeur trop grande : vérifiez Δf = f2 − f1 (en hertz) puis Q = f_res divisée par Δf.' };
}
