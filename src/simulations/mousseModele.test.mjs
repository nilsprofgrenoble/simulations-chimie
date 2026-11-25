import * as M from './mousseModele.js';
import { QCM } from './mousseQcm.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.log('ÉCHEC :', m); process.exitCode = 1; } };
const pr = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
const base = { t: 'sds', c: 5, r: 0, v: 0, ca: 0, g: 'air', d: 0 };
// calibration (ordres de grandeur)
ok(M.H0(base) > 14 && M.H0(base) < 20, 'H0 SDS à 5 CMC ' + M.H0(base));
ok(M.demiVie(base) > 3 && M.demiVie(base) < 8, 't½ SDS à 5 CMC ' + M.demiVie(base));
ok(M.demiVie({ ...base, t: 'sles' }) > M.demiVie(base) * 1.8, 'laureth sulfate plus stable');
ok(Math.abs(M.hauteurRM(base, 0) - M.H0(base)) < 1e-9, 'H(0) = H0');
for (const T of M.TENSIOACTIFS) for (const c of [0.1, 0.5, 1, 2, 5, 10]) {
  const e = { ...base, t: T.id, c };
  let prev = 1e9; for (let t = 0; t <= 20; t += 0.5) { const h = M.hauteurRM(e, t); ok(h <= prev + 1e-12 && h >= 0, 'RM décroissante'); prev = h; }
  const th = M.demiVie(e), td = M.delaiRM(e); ok(Math.abs(M.hauteurRM(e, td + th) - M.H0(e) / 2) < 1e-9, 'demi-vie');
  let pb = -1; for (let t = 0; t <= 60; t += 1) { const h = M.hauteurB(e, t); ok(h >= pb - 1e-12, 'Bikerman croissante'); pb = h; }
  ok(Math.abs(M.hauteurB(e, 1e4) - M.plateauB(e)) < 1e-6, 'plateau atteint');
  ok(M.hauteurB(e, 30, 10) < M.hauteurB(e, 10), 'après arrêt du gaz, décroissance');
}
// monotonies
let p = -1; for (const c of [0.1, 0.3, 1, 3, 5, 10]) { const h = M.H0({ ...base, c }), t = M.demiVie({ ...base, c }); ok(h > p, 'H0 croît avec c'); p = h; }
ok(M.H0({ ...base, c: 5 }) > 0.9 * M.H0({ ...base, c: 10 }) * 0.9, 'saturation vers 5 à 10 CMC');
ok(M.demiVie({ ...base, r: 0.1 }) > 1.9 * M.demiVie(base), 'dodécanol 10 % : demi-vie doublée');
ok(M.demiVie({ ...base, v: 1 }) > 1.9 * M.demiVie(base), 'viscosité');
ok(M.demiVie({ ...base, g: 'n2' }) > M.demiVie(base) && M.demiVie({ ...base, g: 'co2' }) < M.demiVie(base), 'gaz');
ok(M.demiVie({ ...base, ca: 3 }) < 0.5 * M.demiVie(base) && M.H0({ ...base, ca: 3 }) < M.H0(base), 'eau dure');
ok(M.demiVie({ ...base, t: 'sles', ca: 3 }) / M.demiVie({ ...base, t: 'sles' }) > M.demiVie({ ...base, ca: 3 }) / M.demiVie(base), 'laureth moins sensible à l’eau dure');
ok(M.plateauB({ ...base, d: 0.1 }) <= M.H_PLATEAU_MAX && M.plateauB(base) > 10, 'antimousse 0,1 % supprime la mousse');
ok(M.plateauB({ ...base, d: 0.02 }) > M.H_PLATEAU_MAX && M.plateauB({ ...base, d: 0.02 }) < M.plateauB(base), 'antimousse 0,02 % : insuffisant');
// dosage
ok(Math.abs(M.masseTensio(5, 8.2, 288.4, 250) - 2.9561) < 1e-3, 'masse SDS 5 CMC, 250 mL');
// défis
const comp = Object.fromEntries(M.CAS.map(k => [k, 0]));
for (let k = 0; k < 3000; k++) {
  const t = M.tirageMasse(pr); ok(t.vrai > 0, 'masse > 0');
  const d = M.tirageDiagnostic(pr); comp[d.cas]++;
  const conf = d.h0 >= M.H_SPEC && d.th >= M.TH_SPEC;
  if (d.cas === 'aucune') ok(conf, `aucune : H0 ${d.h0} th ${d.th}`);
  else ok(!conf, `${d.cas} : H0 ${d.h0} th ${d.th} doit être non conforme`);
  if (d.cas === 'cohesion') ok(d.h0 >= M.H_SPEC && d.th < M.TH_SPEC, 'cohésion : formation correcte, stabilité insuffisante');
  if (d.cas === 'concentration') ok(d.h0 < M.H_SPEC, 'concentration : moussabilité insuffisante ' + d.h0);
}
ok(Object.values(comp).every(v => v > 500), 'équilibre des cas');
// QCM
let pos = [];
for (const [k, q] of Object.entries(QCM)) { const L = q.options.map(o => o.length), b = q.bonne; ok(q.options.length === 4 && L[b] < Math.max(...L), `QCM ${k} : bonne réponse la plus longue`); pos.push(b); }
ok(pos.every((x, i) => i === 0 || x !== pos[i - 1]), 'places consécutives distinctes ' + pos);
ok([0, 1, 2, 3].every(x => pos.includes(x)), 'places utilisées ' + pos);
console.log(`mousseModele : ${n} vérifications, ${process.exitCode ? 'ÉCHEC' : 'OK'}`);
