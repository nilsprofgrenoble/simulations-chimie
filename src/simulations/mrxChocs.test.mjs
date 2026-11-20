// node src/simulations/mrxChocs.test.mjs — tendances qualitatives de la scène des chocs (moyennes sur plusieurs graines)
import assert from 'node:assert/strict';
import * as C from './mrxChocs.js';
const moy = (nB, kT, N = 10, T = 30) => { let ch = 0, ef = 0; for (let s = 1; s <= N; s++) { const r = C.simuler({ nB, kT }, T, s); ch += r.chocs; ef += r.efficaces; } return { chocs: ch / N / T, eff: ef / N / T, frac: ef / ch }; };
const res = {};
for (const c of C.NIV_CONC) for (const t of C.NIV_TEMP) res[c.id + t.id] = moy(c.nB, t.kT);
// la fréquence des chocs augmente avec la concentration de B (à température fixée)
for (const t of C.NIV_TEMP) { const a = C.NIV_CONC.map(c => res[c.id + t.id].chocs); assert.ok(a[0] < a[1] && a[1] < a[2], `chocs/s vs concentration à T ${t.id} : ${a}`); assert.ok(a[1] > 1.6 * a[0] && a[2] > 1.4 * a[1], 'effet net'); }
// elle augmente aussi avec la température (vitesses plus grandes)
for (const c of C.NIV_CONC) { const a = C.NIV_TEMP.map(t => res[c.id + t.id].chocs); assert.ok(a[0] < a[1] && a[1] < a[2], `chocs/s vs T à ${c.id} : ${a}`); }
// la fraction de chocs efficaces augmente nettement avec la température et ne dépend pas de la concentration
for (const c of C.NIV_CONC) { const f = C.NIV_TEMP.map(t => res[c.id + t.id].frac); assert.ok(f[0] < f[1] - 0.04 && f[1] < f[2] - 0.04, `fraction vs T à ${c.id} : ${f}`); }
for (const t of C.NIV_TEMP) { const f = C.NIV_CONC.map(c => res[c.id + t.id].frac); assert.ok(Math.max(...f) - Math.min(...f) < 0.06, `fraction vs concentration à ${t.id} : ${f}`); }
// chocs efficaces par seconde : augmentent avec la concentration et avec la température
for (const t of C.NIV_TEMP) { const a = C.NIV_CONC.map(c => res[c.id + t.id].eff); assert.ok(a[0] < a[1] && a[1] < a[2]); }
for (const c of C.NIV_CONC) { const a = C.NIV_TEMP.map(t => res[c.id + t.id].eff); assert.ok(a[0] < a[1] && a[1] < a[2]); }
// reproductibilité et conservation : mêmes graines → mêmes résultats ; les disques restent dans la boîte
assert.deepEqual(C.simuler({ nB: 10, kT: 1.5 }, 5, 7), C.simuler({ nB: 10, kT: 1.5 }, 5, 7));
{ const b = C.creerBoite({ nB: 20, kT: 2.2, graine: 3 }); for (let i = 0; i < 2000; i++) C.pas(b, 0.01); assert.ok(b.P.every(p => p.x >= C.BOITE.R - 1e-9 && p.x <= C.BOITE.L - C.BOITE.R + 1e-9 && p.y >= C.BOITE.R - 1e-9 && p.y <= C.BOITE.H - C.BOITE.R + 1e-9)); assert.equal(b.P.length, C.NB_A + 20); }
console.log('mrxChocs : OK', Object.fromEntries(Object.entries(res).map(([k, v]) => [k, `${v.chocs.toFixed(1)} chocs/s, ${(100 * v.frac).toFixed(0)} % efficaces`])));
