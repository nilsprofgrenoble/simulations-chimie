import { strict as assert } from 'node:assert';
import * as M from './poidsTrajetModele.js';
let n = 0; const ok = (c, msg) => { n++; assert.ok(c, msg); }; const pres = (a, b, e = 1e-9) => ok(Math.abs(a - b) < e, `${a} ≠ ${b}`);
// altitudes aux points remarquables
for (const p of M.PTS) pres(M.zDe(p.x), p.z);
// signe du travail du poids : descente moteur, montée résistant, même altitude nul
ok(M.nature(M.travailPoids(2, 1.2, 0)) === 'moteur', 'descente'); ok(M.nature(M.travailPoids(2, 0, 0.8)) === 'résistant', 'montée'); ok(M.nature(M.travailPoids(2, 1.2, 1.2)) === 'nul', 'même altitude');
pres(M.PARCOURS.WAB, 2 * 9.8 * 1.2); pres(M.PARCOURS.WBC, -2 * 9.8 * 0.8); pres(M.PARCOURS.WAC, 2 * 9.8 * 0.4);
// additivité et indépendance du trajet : W(A→C) = W(A→B) + W(B→C)
for (const m of [1, 2, 3.5]) for (const a of M.PTS) for (const b of M.PTS) for (const c of M.PTS)
  pres(M.travailPoids(m, a.z, c.z), M.travailPoids(m, a.z, b.z) + M.travailPoids(m, b.z, c.z));
// aller-retour : le travail du poids est nul, celui du frottement ne l'est pas
for (const a of M.PTS) for (const b of M.PTS) if (a.id !== b.id) {
  const al = M.bilan({ m: 2, dep: a.id, arr: b.id, frott: true }), re = M.bilan({ m: 2, dep: b.id, arr: a.id, frott: true });
  pres(al.Wp + re.Wp, 0); ok(al.Wr < 0 && re.Wr < 0, 'frottement résistant à l’aller et au retour'); pres(al.Wr, re.Wr, 1e-6);
  ok(M.nature(al.Wp) !== 'nul' ? M.nature(al.Wp) !== M.nature(re.Wp) : M.nature(re.Wp) === 'nul', 'le poids change de nature au retour');
  ok(al.L >= Math.abs(al.dz) - 1e-9, 'longueur de rail ≥ dénivelé'); pres(al.L, re.L, 1e-6);
  ok(M.bilan({ m: 2, dep: a.id, arr: b.id }).Wr === 0, 'sans frottement, travail de la réaction nul');
}
// longueur de rail : A→E plus longue que la distance horizontale
ok(M.longueur('A', 'E') > 4.5, 'longueur A→E');
// tirages
for (let i = 0; i < 3000; i++) {
  const A = M.tirageDefiA(); ok(A.trajets.length === 3, 'trois trajets');
  const nats = A.trajets.map(t => M.bilan({ m: 1, ...t }).natureP).sort(); ok(nats.join() === ['moteur', 'nul', 'résistant'].sort().join(), 'trois natures différentes');
  const B = M.tirageDefiB(); ok(B.dep !== B.arr && Math.abs(B.W) > 1 && B.L > Math.abs(B.W) / (B.m * M.G) - 1e-9, 'défi B');
}
console.log(`${n} vérifications, 0 échec`);
