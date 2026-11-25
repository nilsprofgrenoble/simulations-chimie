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
  prev = 2; for (const m of [0, 0.25, 0.5, 0.75, 1]) { const f = M.fractionAgglo(so, { m, E: 0.9, x: 2 }); ok(f <= prev + 1e-12, 'fa décroît avec le mouillage'); prev = f; }
  prev = 2; for (const x of [0, 0.1, 0.5, 1, 2, 3]) { const f = M.fractionAgglo(so, { m: 1, E: 0.9, x }); ok(f <= prev + 1e-12, 'fa décroît avec le dispersant'); prev = f; }
  // sans mouillage, l'énergie est peu efficace
  ok(M.fractionAgglo(so, { m: 0, E: 1, x: 2 }) > M.fractionAgglo(so, { m: 1, E: 1, x: 2 }) + 0.02, 'sans mouillant moins efficace');
  // le broyage réduit D50 des primaires mais ne casse pas les agglomérats à lui seul
  ok(M.d50Primaires(so, { g: 1 }) < M.d50Primaires(so, { g: 0 }), 'broyage');
  ok(Math.abs(M.fractionAgglo(so, { m: 1, E: 0, x: 0 }) - so.fa0) < 1e-12, 'sans énergie : fa0');
  const dispersee = M.distribution(so, { m: 1, E: 1, x: 2, g: 0 });
  ok(M.diametre(dispersee, 90) < M.diametre(q, 90), 'D90 diminue avec la dispersion');
  ok(Math.abs(M.diametre(dispersee, 50) - M.diametre(q, 50)) < 0.5 * M.diametre(q, 50), 'dispersion seule ne change presque pas D50');
  const bro = M.distribution(so, { m: 1, E: 1, x: 2, g: 1 });
  ok(M.diametre(bro, 50) < 0.7 * M.diametre(dispersee, 50), 'broyage réduit D50');
}
// valeurs de calage (ordres de grandeur d'un ciment blanc réel : D50 ≈ 19, D90 ≈ 130 µm avant dispersion)
const qb = M.distribution(M.solide('blanc'), brut);
ok(M.diametre(qb, 50) > 14 && M.diametre(qb, 50) < 26, `D50 blanc ${M.diametre(qb, 50)}`);
ok(M.diametre(qb, 90) > 90 && M.diametre(qb, 90) < 170, `D90 blanc ${M.diametre(qb, 90)}`);
ok(M.fractionAuDessus(qb) > 0.15 && M.fractionAuDessus(qb) < 0.35, `>50µm ${M.fractionAuDessus(qb)}`);
// classes : somme 100
ok(Math.abs(M.parClasses(qb).reduce((a, b) => a + b, 0) - 100) < 1e-6, 'classes');
// étalement
ok(M.etalement(0) === 6, 'E(0)');
const xo = M.dosageOptimal(); ok(xo > 2 && xo < 4, `optimum ${xo}`);
ok(M.etalement(xo) > M.etalement(1) && M.etalement(xo) > M.etalement(5), 'optimum réel');
ok(M.etalement(0.3) > M.etalement(0.1), 'croissante au début');
// dosage
ok(Math.abs(M.eauAPeser(150, 2, 30, 0.33) - 42.5) < 1e-9, 'exemple 2 % ES 30 % : 42,5 g');
ok(Math.abs(M.masseHumide(150, 2, 30) - 10) < 1e-9, 'humide 10 g');
// défis
const comp = { mouillage: 0, energie: 0, dispersant: 0, broyage: 0, aucune: 0 };
for (let k = 0; k < 3000; k++) {
  const t = M.tirageDosage(pr); ok(t && t.vrai > 0 && Math.abs(t.apportee + t.vrai - t.total) < 1e-9, 'dosage cohérent');
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
