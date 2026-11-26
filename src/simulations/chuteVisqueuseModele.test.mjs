import assert from 'node:assert/strict';
import * as M from './chuteVisqueuseModele.js';
let n = 0; const pres = (a, b, e = 1e-9) => { assert.ok(Math.abs(a - b) <= e, `${a} ≠ ${b}`); n++; };
// cas de référence : m = 2,0 kg, k = 4,0 kg/s
pres(M.vlim(2, 4), 4.9); pres(M.tau(2, 4), 0.5); pres(M.vit(2, 4, 0.5), 4.9 * (1 - Math.exp(-1)), 1e-12); pres(M.vit(2, 4, 0.5) / 4.9, 0.6321205588, 1e-9);
for (const m of M.MASSES) for (let k = M.K_MIN; k <= M.K_MAX; k += M.K_PAS) {
  pres(M.vit(m, k, 0), 0); pres(M.acc(m, k, 0), M.G); pres(M.frott(m, k, 0), 0);                         // départ : v = 0, a = g, f = 0
  pres(M.vit(m, k, 100 * M.tau(m, k)), M.vlim(m, k), 1e-9); pres(M.acc(m, k, 100 * M.tau(m, k)), 0, 1e-9); // régime permanent : a = 0, f = P
  pres(M.frott(m, k, 100 * M.tau(m, k)), m * M.G, 1e-6);
  // la tangente à l'origine (pente g) coupe l'asymptote en t = τ
  pres(M.G * M.tau(m, k), M.vlim(m, k), 1e-9);
  // dérivée numérique : m dv/dt = m g − k v
  for (const f of [0.1, 0.5, 1, 2, 4]) { const t = f * M.tau(m, k), h = 1e-6, dv = (M.vit(m, k, t + h) - M.vit(m, k, t - h)) / (2 * h); pres(m * dv, m * M.G - k * M.vit(m, k, t), 1e-5); pres(dv, M.acc(m, k, t), 1e-5); }
  // dist = intégrale de v (trapèzes)
  { const T = 2 * M.tau(m, k), N = 4000; let s = 0; for (let i = 0; i < N; i++) s += (M.vit(m, k, i * T / N) + M.vit(m, k, (i + 1) * T / N)) / 2 * T / N; pres(s, M.dist(m, k, T), 1e-6); }
  // fractions : 63 % en τ, 95 % en 3τ, 99 % en 5τ
  pres(M.tAtteint(m, k, 1 - Math.exp(-1)), M.tau(m, k), 1e-9); n++;
  assert.ok(M.vlim(m, k) < M.V_MAX && M.tau(m, k) < M.T_FIN / 2); n++;
}
pres(M.vit(2, 4, 3 * 0.5) / 4.9, 1 - Math.exp(-3), 1e-9); pres(M.vit(2, 4, 5 * 0.5) / 4.9, 1 - Math.exp(-5), 1e-9);
// effets : m doublée → v_lim et τ doublés ; k doublé → v_lim et τ divisés par 2
pres(M.vlim(4, 4) / M.vlim(2, 4), 2); pres(M.tau(4, 4) / M.tau(2, 4), 2); pres(M.vlim(2, 8) / M.vlim(2, 4), 0.5); pres(M.tau(2, 8) / M.tau(2, 4), 0.5);
const sr = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
for (let i = 0; i < 2000; i++) { const a = M.tirageDefiCalcul(sr); assert.ok(a.vlim > 1 && a.vlim < 25 && a.tau >= 0.125 && a.tau <= 2.5); const b = M.tirageDefiLecture(sr); assert.ok(b.tau >= 0.8 && b.tau <= 1.6); pres(b.vlim, M.vlim(b.m, b.k), 1e-9); n += 3; }
pres(M.PARCOURS.vlim, 4.9); pres(M.PARCOURS.tau, 0.5); pres(M.PARCOURS.v63, 3.0974, 1e-3); pres(M.PARCOURS.t5, 2.5);
console.log(`chuteVisqueuseModele : ${n} vérifications OK`);
