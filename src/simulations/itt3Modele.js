// Modèle pur — simulation « Thixotropie : le test 3ITT » (BTS MDC, formulation).
// Aucune dépendance au navigateur : testé par itt3Modele.test.mjs.
//
// Test 3ITT (three interval thixotropy) : gradient imposé en trois intervalles,
//   1 : γ̇ faible (repos) · 2 : γ̇ fort (déstructuration) · 3 : γ̇ faible (régénération de la structure).
// On enregistre la viscosité η(t). Évaluation de la régénération dans l'intervalle 3 :
//   M1 : % de régénération à un instant donné  = η(t) / η_ref × 100   (η_ref : fin de l'intervalle 1)
//   M2 : temps nécessaire pour atteindre 25 % ou 50 % de η_ref
//   M3 : pente de la courbe η(t) sur une durée donnée (mPa·s par s)
//
// Modèle (pour l'exploration et le défi) : un paramètre de structure λ (1 = structure intacte, 0 = détruite) :
//   dλ/dt = kr·(1 − λ) − kd·γ̇·λ      reconstruction au repos, destruction par le cisaillement
//   τ = K·γ̇ⁿ + λ·τs                   la structure ajoute une contrainte τs (effet « seuil » aux bas gradients)
//   η = τ / γ̇                          (Pa·s ; ×1000 pour des mPa·s)
// Hypothèses (affichées dans la simulation) : un seul paramètre de structure, température constante, échantillon
// homogène sans glissement, valeurs des paramètres choisies pour reproduire l'allure des mesures — pas une identification.

import { DONNEES_3ITT } from './itt3Donnees.js';

export { DONNEES_3ITT };

export const D1 = 20, D2 = 20, D3 = 80; // durées des trois intervalles (s)
export const G_BAS = 1, G_HAUT = 256; // gradients (s⁻¹)

// Peintures A et B : paramètres du modèle choisis pour retrouver l'allure et les ordres de grandeur des mesures.
export const PARAMS_3ITT = {
  A: { K: 1.6, n: 0.9, tauS: 16, kr: 0.035, kd: 0.007 },
  B: { K: 0.9, n: 1.0, tauS: 26, kr: 0.045, kd: 0.009 },
};

// ---------------------------------------------------------------------------
// Simulation : λ intégré exactement sur chaque intervalle (γ̇ constant), η évalué à chaque instant demandé.
// ---------------------------------------------------------------------------
export function simule3ITT(p, { pas = 1, g1 = G_BAS, g2 = G_HAUT, d1 = D1, d2 = D2, d3 = D3 } = {}) {
  const fin = d1 + d2 + d3;
  const bornes = [0, d1, d1 + d2, fin];
  const grad = [g1, g2, g1];
  let lam = 1;
  const pts = [];
  for (let k = 0; k < 3; k++) {
    const g = grad[k];
    const taux = p.kr + p.kd * g, inf = p.kr / taux;
    const n = Math.round((bornes[k + 1] - bornes[k]) / pas);
    for (let i = 1; i <= n; i++) {
      const dt = pas;
      lam = inf + (lam - inf) * Math.exp(-taux * dt);
      const t = bornes[k] + i * pas;
      const tau = p.K * Math.pow(g, p.n) + lam * p.tauS;
      pts.push({ t, g, lam, eta: (tau / g) * 1000 });
    }
  }
  return pts;
}

// ---------------------------------------------------------------------------
// Évaluation de la régénération sur une série [[t, η], …] (mesures ou modèle).
// ---------------------------------------------------------------------------
export const fin2 = (d1 = D1, d2 = D2) => d1 + d2;

// Viscosité de référence : dernier point de l'intervalle 1.
export function etaRef(serie, d1 = D1) {
  const p = serie.filter((q) => q[0] <= d1 + 1e-9);
  return p[p.length - 1][1];
}

// Viscosité interpolée à un instant t (s) dans l'intervalle 3 ; null hors des points.
export function etaA(serie, t, debut3 = D1 + D2) {
  const s = serie.filter((q) => q[0] > debut3 - 1e-9);
  if (!s.length || t < s[0][0] - 1e-9 || t > s[s.length - 1][0] + 1e-9) return null;
  for (let i = 1; i < s.length; i++) {
    if (t <= s[i][0] + 1e-9) { const [t0, e0] = s[i - 1], [t1, e1] = s[i]; return e0 + ((e1 - e0) * (t - t0)) / (t1 - t0); }
  }
  return s[s.length - 1][1];
}

// M1 : régénération (en %) au temps `tRel` écoulé depuis le début de l'intervalle 3.
export function regenPct(serie, tRel, d1 = D1, d2 = D2) {
  const e = etaA(serie, d1 + d2 + tRel, d1 + d2);
  return e == null ? null : (100 * e) / etaRef(serie, d1);
}

// M2 : temps (s) écoulé depuis le début de l'intervalle 3 pour atteindre q % de η_ref (interpolation linéaire).
export function tempsRegen(serie, q, d1 = D1, d2 = D2) {
  const ref = etaRef(serie, d1), cible = (q / 100) * ref, debut = d1 + d2;
  const s = serie.filter((p) => p[0] > debut - 1e-9);
  for (let i = 1; i < s.length; i++) {
    if (s[i][1] >= cible && s[i - 1][1] < cible) {
      const [t0, e0] = s[i - 1], [t1, e1] = s[i];
      return t0 + ((cible - e0) * (t1 - t0)) / (e1 - e0) - debut;
    }
  }
  return null;
}

// M3 : pente moyenne (mPa·s par s) entre deux instants (s, depuis le début de l'intervalle 3).
export function pente(serie, tRel1, tRel2, d1 = D1, d2 = D2) {
  const a = etaA(serie, d1 + d2 + tRel1, d1 + d2), b = etaA(serie, d1 + d2 + tRel2, d1 + d2);
  return a == null || b == null ? null : (b - a) / (tRel2 - tRel1);
}

// Série du modèle au format [[t, η], …].
export const serieModele = (p, opts) => simule3ITT(p, opts).map((q) => [q.t, q.eta]);

// ---------------------------------------------------------------------------
// Verdict nivellement / affaissement (ordres de grandeur annoncés dans la simulation, pas des normes) :
//   t50 ≤ 5 s : régénération trop rapide (traces de pinceau) · 5 à 30 s : équilibrée · > 30 s : trop lente (affaissement).
// ---------------------------------------------------------------------------
export const SEUIL_RAPIDE = 5, SEUIL_LENT = 30;
export function verdictRegeneration(t50) {
  if (t50 == null) return 'lente';
  return t50 <= SEUIL_RAPIDE ? 'rapide' : t50 <= SEUIL_LENT ? 'equilibree' : 'lente';
}
export const NOMS_VERDICT = {
  rapide: 'Régénération trop rapide : nivellement insuffisant (traces de pinceau)',
  equilibree: 'Régénération équilibrée : bon nivellement, pas d’affaissement',
  lente: 'Régénération trop lente : risque d’affaissement',
};

// ---------------------------------------------------------------------------
// Défi : « peinture mystère » tirée au hasard (types équilibrés).
// ---------------------------------------------------------------------------
export const INSTANTS_DEFI = [0, 5, 10, 20, 30, 40, 60, 80]; // s depuis le début de l'intervalle 3
const arrondi10 = (x) => Math.round(x / 10) * 10;
export function t50Modele(p) {
  const s = serieModele(p, { pas: 0.1 });
  return tempsRegen(s, 50);
}
export function tirerPeintureMystere(rng = Math.random) {
  const type = ['rapide', 'equilibree', 'lente'][Math.floor(rng() * 3)];
  const [a, b] = type === 'rapide' ? [1.5, 4.2] : type === 'equilibree' ? [8, 24] : [38, 58];
  const cible = a + rng() * (b - a);
  const tauS = Math.round((8 + rng() * 30) * 2) / 2;
  const K = Math.round((0.6 + rng() * 1.4) * 10) / 10;
  // kr par dichotomie (t50 décroît quand kr augmente), kd = kr / 5
  let lo = 0.003, hi = 3;
  for (let i = 0; i < 60; i++) {
    const kr = Math.sqrt(lo * hi);
    const t = t50Modele({ K, n: 0.95, tauS, kr, kd: kr / 5 });
    if (t == null || t > cible) lo = kr; else hi = kr;
  }
  const p = { K, n: 0.95, tauS, kr: Math.sqrt(lo * hi), kd: Math.sqrt(lo * hi) / 5 };
  const s = serieModele(p, { pas: 0.5 });
  const ref = arrondi10(etaRef(s));
  // Valeurs affichées à l'élève : arrondies à 10 mPa·s ; les corrigés sont calculés sur ces valeurs arrondies.
  const table = INSTANTS_DEFI.map((tr) => [tr, arrondi10(etaA(s, D1 + D2 + tr) ?? s.find((q) => q[0] >= D1 + D2)[1])]);
  const serieAff = [[0, 0], [D1, ref], ...table.map(([tr, e]) => [D1 + D2 + tr, e])];
  const m1 = (100 * table.find((x) => x[0] === 40)[1]) / ref;
  // t50 par interpolation linéaire sur la table affichée
  const cibleE = ref / 2;
  let t50 = null;
  for (let i = 1; i < table.length; i++) {
    if (table[i][1] >= cibleE && table[i - 1][1] < cibleE) { t50 = table[i - 1][0] + ((cibleE - table[i - 1][1]) * (table[i][0] - table[i - 1][0])) / (table[i][1] - table[i - 1][1]); break; }
  }
  return { type, p, ref, table, serie: serieAff, m1, t50, verdict: verdictRegeneration(t50) };
}

// Mélange déterministe des options (même principe que la simulation 217).
export function ordreOptions(ids, bon, graine) {
  const o = ids.slice();
  const k = ((graine % o.length) + o.length) % o.length;
  const r = o.slice(k).concat(o.slice(0, k));
  return { options: r, bonne: r.indexOf(bon) };
}

export const COULEURS = { A: '#2563eb', B: '#ea580c', modele: '#16a34a', fort: '#dc2626' };
