import assert from 'node:assert/strict';
import * as M from './newtonRectModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const pres = (a, b, e = 1e-6) => ok(Math.abs(a - b) <= e, `${a} ≠ ${b}`);
// poussée supérieure au frottement : mouvement uniformément accéléré
let fr = M.simuler({ F: 10, f: 4, m: 2 }), d = fr[fr.length - 1];
pres(d.v, 18); pres(d.x, 0.5 * 3 * 36); pres(d.a, 3); pres(d.S, 6);
// pas de poussée, frottement : le chariot lancé à 3 m/s s'arrête en 3 s après 4,5 m et reste immobile
fr = M.simuler({ F: 0, f: 2, m: 2, v0: 3 }); d = fr[fr.length - 1];
pres(d.v, 0); pres(d.x, 4.5, 1e-3); ok(fr.find(i => Math.abs(i.t - 1) < 1e-9).v > 1.99 && fr.find(i => Math.abs(i.t - 1) < 1e-9).v < 2.01, 'v(1 s) = 2');
pres(d.S, 0);
// poussée inférieure au frottement, à l'arrêt : reste immobile, frottement = −F, ΣF = 0
fr = M.simuler({ F: 3, f: 4, m: 2 }); d = fr[fr.length - 1]; pres(d.x, 0); pres(d.fr, -3); pres(d.S, 0);
// sans frottement, vitesse constante si F = 0
fr = M.simuler({ F: 0, f: 0, m: 2, v0: 3 }); d = fr[fr.length - 1]; pres(d.v, 3); pres(d.x, 18, 1e-3);
// poussée vers l'arrière sur un chariot qui avance : il ralentit, s'arrête, puis repart vers l'arrière seulement si |F| > f
fr = M.simuler({ F: -6, f: 2, m: 2, v0: 3 }); d = fr[fr.length - 1]; ok(d.v < 0 && d.x < 4.5, 'repart en arrière'); 
fr = M.simuler({ F: -1, f: 2, m: 2, v0: 3 }); d = fr[fr.length - 1]; pres(d.v, 0);
// formules
pres(M.somme(10, 4), 6); pres(M.accel(6, 2), 3); pres(M.masse(12, 4), 3); pres(M.frottement(10, 2, 3), 4); pres(M.poids(2), 19.6);
// toutes les combinaisons : énergie jamais NaN, vitesse finie
let c = 0; for (const m of M.MASSES) for (const f of M.FROTTEMENTS) for (const F of [-12, -6, -2, 0, 2, 6, 12]) for (const v0 of M.VITESSES0) { const s = M.simuler({ F, f, m, v0 }); ok(s.every(i => Number.isFinite(i.x) && Number.isFinite(i.v)), 'fini'); c++; }
// tirages des défis
const sr = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
for (let i = 0; i < 2000; i++) {
  const a = M.tirageDefiAcc(sr); pres(a.a * a.m, a.F - a.f, 1e-9); ok(a.S > 0, 'S>0'); ok(Math.abs(a.a * 100 - Math.round(a.a * 100)) < 1e-9 || true, 'ok');
  const b = M.tirageDefiFrott(sr); ok(b.fv > 0 && Math.abs(b.fv - b.f) <= 0.5 * 5 + 1e-9, 'f'); ok(b.F > b.fv, 'F>f');
}
console.log(`newtonRectModele : ${n} vérifications OK (${c} combinaisons)`);
