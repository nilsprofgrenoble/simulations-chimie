// ====================================================
//  Modèle de la simulation 312 (terminale STL, SPCL, Chimie et développement durable) : solubilité et température, recristallisation.
//  La solubilité s est la masse maximale de soluté dissoute dans 100 g d'eau à la température T (g pour 100 g d'eau).
//  Valeurs : tables usuelles de solubilité dans l'eau (CRC Handbook, tableau « Solubility table » de Wikipédia), arrondies et données tous les 20 °C ; interpolation linéaire entre deux valeurs (écart inférieur à 1 %).
//  Solides : chlorure d'ammonium NH4Cl (solubilité croissante, dissolution endothermique) et carbonate de lithium Li2CO3 (solubilité décroissante, dissolution exothermique).
// ====================================================
export const SOLIDES = {
  nh4cl: { id: 'nh4cl', nom: 'chlorure d’ammonium', formule: 'NH₄Cl', T: [0, 20, 40, 60, 80, 100], s: [29.4, 37.2, 45.8, 55.2, 65.6, 77.3], col: '#0369a1', colS: '#bae6fd', ymax: 80, pasY: 10, sens: 'croissante', dH: 'endothermique' },
  li2co3: { id: 'li2co3', nom: 'carbonate de lithium', formule: 'Li₂CO₃', T: [0, 20, 40, 60, 80, 100], s: [1.54, 1.33, 1.17, 1.01, 0.85, 0.72], col: '#7c3aed', colS: '#ddd6fe', ymax: 2, pasY: 0.5, sens: 'décroissante', dH: 'exothermique' },
};
export const ORDRE = ['nh4cl', 'li2co3'];
export const T_MIN = 0, T_MAX = 100;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// solubilité (g pour 100 g d'eau) à la température T (°C)
export function sol(so, T) {
  const t = clamp(T, T_MIN, T_MAX);
  for (let i = 0; i < so.T.length - 1; i++) if (t <= so.T[i + 1]) { const u = (t - so.T[i]) / (so.T[i + 1] - so.T[i]); return so.s[i] + u * (so.s[i + 1] - so.s[i]); }
  return so.s[so.s.length - 1];
}
// masse maximale dissoute dans mEau grammes d'eau à T
export const limite = (so, T, mEau) => sol(so, T) * mEau / 100;
// état d'un mélange de m g de solide dans mEau g d'eau à T
export function etat(so, T, m, mEau) {
  const lim = limite(so, T, mEau), dissous = Math.min(m, lim), cristaux = Math.max(0, m - lim);
  const statut = m < lim * 0.995 ? 'sous' : m > lim * 1.005 ? 'depot' : 'limite';
  return { lim, dissous, cristaux, statut };
}
// solution saturée à T1 (mEau g d'eau), amenée à T2 : masse de solide qui cristallise (0 si tout reste dissous)
export const cristallise = (so, mEau, T1, T2) => Math.max(0, (sol(so, T1) - sol(so, T2)) * mEau / 100);
// masse d'eau minimale (g) pour dissoudre m g à T
export const eauMin = (so, m, T) => 100 * m / sol(so, T);
// rendement théorique de la recristallisation par variation de température (solution saturée à T1, amenée à T2)
export const rendement = (so, T1, T2) => Math.max(0, (sol(so, T1) - sol(so, T2)) / sol(so, T1));
// température à laquelle w g de solide pour 100 g d'eau saturent la solution (null si hors de 0–100 °C)
export function tSat(so, w) {
  let a = T_MIN, b = T_MAX, fa = sol(so, a) - w, fb = sol(so, b) - w;
  if (fa * fb > 0) return null;
  for (let i = 0; i < 50; i++) { const c = (a + b) / 2, fc = sol(so, c) - w; if (fa * fc <= 0) { b = c; fb = fc; } else { a = c; fa = fc; } }
  return (a + b) / 2;
}
// mise en forme
export const nbf = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');
export const gTxt = v => (Math.abs(v) < 10 ? nbf(v, 2) : nbf(v, 1));
export const NB = ' ';

// ---------- défis ----------
const tire = (a, rng = Math.random) => a[Math.floor(rng() * a.length)];
// Défi 1 : masse de NH4Cl qui cristallise quand une solution saturée à T1 est refroidie à T2 (lecture de la courbe)
export function tirageDefiCristal(rng = Math.random) {
  const so = SOLIDES.nh4cl, [T1, T2] = tire([[80, 20], [80, 0], [100, 0]], rng), mEau = tire([200, 250, 400, 500, 800], rng);
  const s1 = sol(so, T1), s2 = sol(so, T2);
  return { so, T1, T2, mEau, s1, s2, vrai: (s1 - s2) * mEau / 100 };
}
const TOL_LECTURE = 0.12;
export function diagCristal(d, x) {
  if (!Number.isFinite(x) || x <= 0) return { ok: false, msg: 'Écrivez une masse en grammes (nombre positif), par exemple 85.' };
  const rel = Math.abs(x - d.vrai) / d.vrai;
  if (rel <= TOL_LECTURE) return { ok: true, msg: '' };
  const proche = v => Math.abs(x - v) / v < 0.15;
  if (proche(d.s1 * d.mEau / 100)) return { ok: false, msg: `Vous avez calculé la masse dissoute à ${d.T1}${NB}°C (s(${d.T1}) × m(eau) ÷ 100). Il faut la différence entre les masses dissoutes à ${d.T1}${NB}°C et à ${d.T2}${NB}°C.` };
  if (proche(d.s2 * d.mEau / 100)) return { ok: false, msg: `Vous avez calculé la masse qui reste dissoute à ${d.T2}${NB}°C. Les cristaux, ce sont les ${d.T1}${NB}°C moins ceux-là.` };
  if (proche(d.s1 - d.s2)) return { ok: false, msg: `Vous avez calculé la masse pour 100 g d’eau. Il y a ici ${d.mEau}${NB}g d’eau : multipliez par ${d.mEau} ÷ 100.` };
  return { ok: false, msg: `Votre masse est ${x > d.vrai ? 'trop grande' : 'trop petite'}. Relisez s(${d.T1}${NB}°C) et s(${d.T2}${NB}°C) sur la courbe, calculez la différence pour 100 g d’eau, puis multipliez par ${d.mEau} ÷ 100.` };
}
// Défi 2 : masse d'eau minimale pour dissoudre une masse de NH4Cl à T (lecture de la courbe)
export function tirageDefiEau(rng = Math.random) {
  const so = SOLIDES.nh4cl, T = tire([20, 40, 60, 80], rng), m = tire([50, 80, 100, 120, 150, 200], rng), s = sol(so, T);
  return { so, T, m, s, vrai: 100 * m / s };
}
export function diagEau(d, x) {
  if (!Number.isFinite(x) || x <= 0) return { ok: false, msg: 'Écrivez une masse d’eau en grammes (nombre positif), par exemple 250.' };
  if (Math.abs(x - d.vrai) / d.vrai <= TOL_LECTURE) return { ok: true, msg: '' };
  const proche = v => Math.abs(x - v) / v < 0.15;
  if (proche(d.m * d.s / 100)) return { ok: false, msg: 'Vous avez multiplié la masse de solide par s au lieu de la diviser : plus s est grande, moins il faut d’eau.' };
  if (proche(d.m / d.s)) return { ok: false, msg: 'Vous avez oublié le facteur 100 : s est donnée pour 100 g d’eau. m(eau) = 100 × m(solide) ÷ s.' };
  if (proche(d.m)) return { ok: false, msg: 'Vous avez donné la masse de solide : il faut la masse d’eau qui dissout cette masse à la température indiquée.' };
  return { ok: false, msg: `Votre masse d’eau est ${x > d.vrai ? 'trop grande' : 'trop petite'}. Lisez s(${d.T}${NB}°C) sur la courbe puis calculez 100 × ${d.m} ÷ s.` };
}
