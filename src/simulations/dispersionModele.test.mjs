import * as M from './dispersionModele.js';
import { QCM } from './dispersionQcm.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.log('ÉCHEC :', m); process.exitCode = 1; } };
const pr = (() => { let s = 11; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
const brut = { m: 1, E: 0, x: 0, g: 0 };
for (const so of M.SOLIDES) {
  const q = M.distribution(so, brut);
  ok(Math.abs(q.reduce((a, b) => a + b, 0) - 100) < 1e-6, 'somme 100');
  ok(M.diametre(q, 10) < M.diametre(q, 50) && M.diametre(q, 50) < M.diametre(q, 90), 'D10<D50<D90');
  // la dispersion réduit les agglomérats, jamais d'augmentation
  let prev = 2;
  for (const E of [0, 0.25, 0.5, 0.75, 1]) { const f = M.fractionAgglo(so, { m: 1, E, x: 0 }); ok(f <= prev + 1e-12, 'fa décroît avec E'); prev = f; }
  prev = 2; for (const m of [0, 0.25, 0.5, 0.75, 1]) { const f = M.fractionAgglo(so, { m, E: 0.9, x: 0.2 }); ok(f <= prev + 1e-12, 'fa décroît avec le mouillage'); prev = f; }
  prev = 2; for (const x of [0, 0.01, 0.05, 0.1, 0.2, 0.3]) { const f = M.fractionAgglo(so, { m: 1, E: 0.9, x }); ok(f <= prev + 1e-12, 'fa décroît avec le dispersant'); prev = f; }
  // sans mouillage, l'énergie est peu efficace
  ok(M.fractionAgglo(so, { m: 0, E: 1, x: 0.2 }) > M.fractionAgglo(so, { m: 1, E: 1, x: 0.2 }) + (so.m0 < 0.5 ? 0.02 : 0), 'sans mouillant moins efficace (nettement pour un solide hydrophobe)');
  ok(so.m0 < 0.5 || M.fractionAgglo(so, { m: 0, E: 1, x: 0.2 }) - M.fractionAgglo(so, { m: 1, E: 1, x: 0.2 }) < 0.03, 'solide hydrophile : l’agent mouillant change peu de chose');
  // le broyage réduit D50 des primaires mais ne casse pas les agglomérats à lui seul
  ok(M.d50Primaires(so, { g: 1 }) < M.d50Primaires(so, { g: 0 }), 'broyage');
  ok(Math.abs(M.fractionAgglo(so, { m: 1, E: 0, x: 0 }) - so.fa0) < 1e-12, 'sans énergie : fa0');
  const dispersee = M.distribution(so, { m: 1, E: 1, x: 0.2, g: 0 });
  ok(M.diametre(dispersee, 90) < M.diametre(q, 90), 'D90 diminue avec la dispersion');
  ok(Math.abs(M.diametre(dispersee, 50) - M.diametre(q, 50)) < 0.5 * M.diametre(q, 50), 'dispersion seule ne change presque pas D50');
  const bro = M.distribution(so, { m: 1, E: 1, x: 0.2, g: 1 });
  ok(M.diametre(bro, 50) < 0.7 * M.diametre(dispersee, 50), 'broyage réduit D50');
}
// valeurs de calage (ordres de grandeur : TiO₂ mal dispersé, D50 ≈ 1,8, D90 ≈ 13 µm)
const qb = M.distribution(M.solide('tio2'), brut);
ok(M.diametre(qb, 50) > 1.4 && M.diametre(qb, 50) < 2.6, `D50 tio2 ${M.diametre(qb, 50)}`);
ok(M.diametre(qb, 90) > 9 && M.diametre(qb, 90) < 17, `D90 tio2 ${M.diametre(qb, 90)}`);
ok(M.fractionAuDessus(qb) > 0.15 && M.fractionAuDessus(qb) < 0.35, `>5µm ${M.fractionAuDessus(qb)}`);
// classes : somme 100
ok(Math.abs(M.parClasses(qb).reduce((a, b) => a + b, 0) - 100) < 1e-6, 'classes');
// viscosité
ok(M.viscosite(0) === 12, 'v(0)');
const xo = M.dosageOptimal(); ok(xo > 0.15 && xo < 0.35, `optimum ${xo}`);
ok(M.viscosite(xo) < M.viscosite(0.05) && M.viscosite(xo) < M.viscosite(0.6), 'optimum réel');
ok(M.viscosite(0.03) < M.viscosite(0.01), 'décroissante au début');
// dosage
ok(Math.abs(M.masseSolution(300, 0.2, 40) - 1.5) < 1e-9, 'exemple 300 g, 0,20 %, 40 % : 1,5 g');
ok(Math.abs(M.masseActive(300, 0.2) - 0.6) < 1e-9, 'actif 0,6 g');
// défis
const comp = { mouillage: 0, energie: 0, dispersant: 0, broyage: 0, aucune: 0 };
for (let k = 0; k < 3000; k++) {
  const t = M.tirageDosage(pr); ok(t && t.vrai > t.active, 'dosage cohérent');
  const d = M.tirageDiagnostic(pr); comp[d.cas]++;
  if (d.cas === 'aucune') ok(d.agglo <= M.AGGLO_MAX && d.d50 <= M.D50_SPEC, `aucune : agglo ${d.agglo} d50 ${d.d50} ${d.solide.id}`);
  if (d.cas === 'mouillage' || d.cas === 'energie' || d.cas === 'dispersant') ok(d.agglo > M.AGGLO_MAX + 0.02, `${d.cas} : agglo ${d.agglo}`);
  if (d.cas === 'broyage') ok(d.agglo <= M.AGGLO_MAX && d.d50 > M.D50_SPEC, `broyage : agglo ${d.agglo} d50 ${d.d50} ${d.solide.id}`);
}
ok(Object.values(comp).every(v => v > 400), 'équilibre des cas');
// QCM
let pos = [];
for (const [k, q] of Object.entries(QCM)) { const L = q.options.map(o => o.length), b = q.bonne; ok(q.options.length === 4 && L[b] < Math.max(...L), `QCM ${k} : bonne réponse la plus longue`); pos.push(b); }
ok(pos.every((p, i) => i === 0 || p !== pos[i - 1]), 'places consécutives distinctes ' + pos);
ok([0, 1, 2, 3].every(p => pos.includes(p)), 'places utilisées ' + pos);
console.log(`dispersionModele : ${n} vérifications, ${process.exitCode ? 'ÉCHEC' : 'OK'}`);
