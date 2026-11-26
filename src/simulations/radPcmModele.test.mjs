import * as M from './radPcmModele.js';
import assert from 'node:assert/strict';
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); };
// noyaux : conservation et éléments connus
for (const x of M.NUCLEIDES) { const b = M.bilan(x); ok(b.A.gauche === b.A.droite && b.Z.gauche === b.Z.droite, 'conservation ' + x.s + x.A); ok(x.fils.s && x.fils.A > 0, 'fils ' + x.s + x.A); ok(['a', 'b-', 'b+'].includes(x.mode)); }
for (const m of ['a', 'b-', 'b+']) ok(M.parMode(m).length >= 2, 'au moins deux noyaux ' + m);
// aucun des noyaux des documents du cours
const INTERDITS = ['U238', 'Th234', 'Pa234', 'F18', 'I131', 'K40', 'Cs137', 'Ba137', 'Po210', 'Ra226', 'Rn222', 'Bi210', 'Pb206', 'C14', 'Tc99', 'Br80', 'P30', 'Si30', 'U235'];
for (const x of M.NUCLEIDES) { ok(!INTERDITS.includes(x.s + x.A), 'situation interdite ' + x.s + x.A); ok(!INTERDITS.includes(x.fils.s + x.fils.A), 'fils interdit ' + x.fils.s + x.fils.A); }
// loi
ok(Math.abs(M.Nt(1000, M.LN2 / 6, 6) - 500) < 1e-9); ok(Math.abs(M.PG.lamS * 8 - M.LN2) < 1e-12);
ok(Math.abs(M.PG.A_S - 4.8e4) / 4.8e4 < 0.01, 'A_S ' + M.PG.A_S); ok(Math.abs(M.PG.tRest - 13.9) < 0.05, 'tRest ' + M.PG.tRest);
ok(Math.abs(M.PG.A_S24 - 6000) < 1);
ok(Math.abs(M.PG.dNEuler - 48000) < 1e-6); ok(Math.abs(M.PG.lamT - 0.0497) < 0.0002, 'lamT ' + M.PG.lamT); ok(Math.abs(M.PG.thT - 13.9) < 0.1);
// Euler converge vers l'exponentielle quand Δt diminue
const T = 12, N0 = 1e6, l = 0.12; let prev = Infinity;
for (const dt of [4, 2, 1, 0.5, 0.25]) { const e = M.escalier(N0, l, dt, T), fin = e[e.length - 1], err = Math.abs(fin.N - M.Nt(N0, l, fin.t)) / M.Nt(N0, l, fin.t); ok(err < prev, 'Euler converge ' + dt); prev = err; ok(e[1].dN === -l * N0 * dt); }
// défis : mille tirages
for (let i = 0; i < 1000; i++) {
  const d = M.tirageDefiComptage(); ok(d.pts.length === 7 && d.pts[0].A > 0);
  // méthode des deux points extrêmes d'un élève (bruit pire cas ±3 %) : λ = ln(A0/Ak)/tk avec k = 3 à 6
  for (let k = 3; k <= 6; k++) { const lest = Math.log(d.pts[0].A / d.pts[k].A) / d.pts[k].t, th = M.LN2 / lest; ok(Math.abs(th - d.th) / d.th < M.tolDefi.th || d.pts[k].t < d.th * 1.1, `th ${th} vs ${d.th} k${k}`); }
  const e = M.tirageDefiEquation(); ok(e.A > 0 && e.Z > 0);
}
console.log(`radPcmModele : ${n} vérifications réussies`);
