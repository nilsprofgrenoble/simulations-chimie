import assert from 'node:assert/strict';
import * as M from './eulerChuteModele.js';
let n = 0; const pres = (a, b, e = 1e-9) => { assert.ok(Math.abs(a - b) <= e, `${a} ≠ ${b}`); n++; };
// cas de référence : m = 2,0 kg, m_f = 0,4 kg, k = 4,0 kg/s
pres(M.A(2, 0.4), 7.84); pres(M.vlim(2, 0.4, 4), 3.92); pres(M.tau(2, 4), 0.5); pres(M.vlim(2, 0.4, 4), M.A(2, 0.4) * M.tau(2, 4));
pres(M.PARCOURS.v1, 1.568); pres(M.PARCOURS.v2, 1.6 + 0.2 * (7.84 - 3.2), 1e-12);
// sans Archimède on retrouve la sim précédente : v_lim = m g / k
pres(M.vlim(2, 0, 4), 4.9); pres(M.A(2, 0), 9.8);
for (const m of [1, 2, 2.5, 4, 5]) for (const mf of [0, 0.2, 0.4, 0.8]) for (const k of [2, 2.5, 4, 5, 8, 10]) {
  if (mf >= m) continue;
  // la solution exacte vérifie dv/dt = A − v/τ (dérivée numérique) et v(0) = 0
  pres(M.exact(m, mf, k, 0), 0);
  for (const t of [0.1, 0.5, 1, 2]) { const h = 1e-6, dv = (M.exact(m, mf, k, t + h) - M.exact(m, mf, k, t - h)) / (2 * h); pres(dv, M.acc(m, mf, k, M.exact(m, mf, k, t)), 1e-5); }
  // la pente à l'origine vaut a0 = v_lim ÷ τ
  pres(M.A(m, mf), M.vlim(m, mf, k) / M.tau(m, k), 1e-9);
  // Euler : la suite est croissante et inférieure à v_lim pour dt < τ ; l'erreur diminue avec dt
  const ta = M.tau(m, k);
  let prev = Infinity;
  for (const dt of [0.4, 0.2, 0.1, 0.05]) {
    const L = M.euler(m, mf, k, dt, 2); const err = Math.abs(L[L.length - 1].v - M.exact(m, mf, k, 2));
    if (dt < ta) { for (let i = 1; i < L.length; i++) { assert.ok(L[i].v >= L[i - 1].v - 1e-12 && L[i].v <= M.vlim(m, mf, k) + 1e-9); n++; } }
    if (dt <= ta / 2) { assert.ok(err <= prev + 1e-12); n++; prev = err; }
  }
  // Euler surestime v (la courbe est concave : la tangente est au-dessus) pour dt < τ
  { const dt = Math.min(0.1, ta / 2), L = M.euler(m, mf, k, dt, 1); for (const l of L.slice(1)) { assert.ok(l.v >= M.exact(m, mf, k, l.t) - 1e-9); n++; } }
  // dt = τ : v_1 = v_lim d'un seul coup ; dt = 2 τ : oscillation entre 0 et 2 v_lim
  { const L = M.euler(m, mf, k, ta, 3 * ta); pres(L[1].v, M.vlim(m, mf, k), 1e-9); pres(L[2].v, M.vlim(m, mf, k), 1e-9); }
  { const L = M.euler(m, mf, k, 2 * ta, 4 * ta); pres(L[1].v, 2 * M.vlim(m, mf, k), 1e-9); pres(L[2].v, 0, 1e-9); }
}
const sr = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
for (let i = 0; i < 3000; i++) {
  const a = M.tirageDefiLimite(sr); assert.ok(a.a0 > 3 && a.vlim > 0.5 && a.vlim < 25 && a.mf < a.m); const b = M.tirageDefiEuler(sr); assert.ok(b.dt < 2 * b.tau && b.v2 > b.v1 && b.v1 > 0 && b.mf < b.m); n += 6;
}
console.log(`eulerChuteModele : ${n} vérifications OK`);
