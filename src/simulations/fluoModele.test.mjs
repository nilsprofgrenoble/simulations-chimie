// node src/simulations/fluoModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './fluoModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const pr = (a, b, t = 1e-9) => ok(Math.abs(a - b) <= t * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);
pr(M.decalageStokes(350, 450), 1243 / 350 - 1243 / 450, 1e-2);       // 0,79 eV avec les constantes du cours
ok(Math.abs(M.decalageStokes(350, 450) - 0.789) < 0.01, 'stokes 350→450');
ok(Math.abs(M.partPerdue(350, 450) - 0.2222) < 1e-3, 'part perdue');
ok(M.decalageStokes(300, 400) > 0 && M.decalageStokes(400, 300) < 0);
// décroissances
ok(M.intensiteFluo(M.MOLS.A, 0) === 1 && M.intensiteFluo(M.MOLS.A, 1e-6) < 1e-6);
ok(M.intensitePhos(M.MOLS.A, 0) === 0, 'A ne phosphoresce pas');
ok(M.intensitePhos(M.MOLS.B, 1e-6) > 0.59 && M.intensitePhos(M.MOLS.B, 30) < 1e-12);
ok(M.classeEmission(M.MOLS.B, 1e-9) === 'les deux' && M.classeEmission(M.MOLS.B, 1e-6) === 'phosphorescence seule' && M.classeEmission(M.MOLS.B, 30) === 'aucune');
ok(M.classeEmission(M.MOLS.A, 1e-9) === 'fluorescence seule' && M.classeEmission(M.MOLS.A, 1e-6) === 'aucune');
for (const m of Object.values(M.MOLS)) { ok(m.lamFluo > m.lamAbs, 'Stokes ' + m.id); if (m.lamPhos) ok(m.lamPhos > m.lamFluo, 'phos > fluo'); }
// ordre des durées du cours
const d = M.DUREES; ok(d.absorption < d.rv && d.rv <= d.ci && d.fluo < d.cis && d.cis < d.phos);
// tirages : pas d'ambiguïté près des seuils
let r = 0; const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
for (let i = 0; i < 4000; i++) {
  const s = M.tirageDefiStokes(rnd); ok(s.lamAbs >= 300 && s.lamAbs <= 400 && s.dE > 0.2 && s.dE < 2.5, 'stokes ' + s.dE);
  const u = M.tirageDefiDuree(rnd); const f = M.intensiteFluo(M.MOLS.B, u.t); ok(Math.abs(Math.log10(f) - Math.log10(M.SEUIL)) > 0.3, 'fluo ambigu ' + u.txt);
  ok(['les deux', 'phosphorescence seule', 'aucune'].includes(u.rep), u.rep);
}
console.log('Modèle sim 301 :', n, 'vérifications réussies.');
