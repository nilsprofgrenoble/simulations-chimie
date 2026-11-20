// Test du modèle de la simulation 211 : formules, cas limites, tirages des défis (faisabilité, pièges hors tolérance, pire cas d'arrondi).
import * as M from './isnModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const pres = (a, b, e = 1e-9) => Math.abs(a - b) <= e * Math.max(1, Math.abs(b));
ok(pres(M.niveau(M.I0), 0), 'L(I0) = 0 dB');
ok(pres(M.niveau(1e-6), 60), 'L(1e-6) = 60 dB'); ok(pres(M.niveau(1), 120), 'L(1) = 120 dB');
for (let L = -10; L <= 140; L += 2.5) ok(pres(M.niveau(M.intensiteDepuisNiveau(L)), L, 1e-12), `réciproque à ${L} dB`);
ok(pres(M.intensiteSurface(2e-5, 0.5), 4e-5), 'I = P / S'); ok(pres(M.niveau(4e-5), 76.0206, 1e-6), 'L(4,0e-5) = 76,02 dB');
ok(pres(M.intensiteDepuisNiveau(85), 3.16228e-4, 1e-5), 'I(85 dB) = 3,16e-4');
ok(pres(M.variationNiveau(2), 3.0103, 1e-4), '×2'); ok(pres(M.variationNiveau(10), 10), '×10'); ok(pres(M.niveauNSources(70, 2), 73.0103, 1e-5), '2 sources');
ok(Math.abs(M.niveauNSources(70, 2) - 140) > 60, 'deux sources : pas 140 dB');
for (const P of [1e-8, 1e-5, 1e-3, 0.1, 1]) for (const d of [1, 2, 3, 4, 8, 15]) {
  ok(pres(M.intensiteSphere(P, 2 * d), M.intensiteSphere(P, d) / 4), 'I / 4'); ok(pres(M.niveauSource(P, 2 * d), M.niveauSource(P, d) - 6.0206, 1e-5), '−6 dB');
  ok(pres(M.niveauSource(P, d), M.niveauSource(P, 1) - 20 * Math.log10(d), 1e-9), 'L(d) = L(1 m) − 20 log d');
}
ok([1, 2, 4, 8].every((d, k) => Math.abs(M.niveauSource(1e-4, d) - (69 - 6 * k)) < 0.1), 'exemple 69 / 63 / 57 / 51');
ok(Math.abs(M.niveauAvecParoi(1e-4, 4, 2, 35) - 22.0) < 0.1, 'derrière la cloison à 4 m : 22,0 dB'); ok(Math.abs(M.niveauAvecParoi(1e-4, 2, 2, 35) - 63.0) < 0.1, 'avant la paroi : pas d’absorption');
ok(Math.abs(M.intensiteSphere(1e-4, 2) - 1.989e-6) < 1e-9, 'I à 2 m'); ok(Math.abs(M.distanceSeuil(1, 85) - 15.86) < 0.02, 'distance de seuil : 15,9 m');
ok(Math.abs(M.niveauSource(1, 1) - 109.0) < 0.05, 'enceinte de concert à 1 m : 109 dB');
for (const P of [1e-5, 1e-3, 1]) for (const Ls of [60, 85]) ok(pres(M.niveauSource(P, M.distanceSeuil(P, Ls)), Ls, 1e-9), 'distanceSeuil réciproque');
ok(pres(M.niveauSource(1e-4, M.distanceSeuil(1e-4, 40, 10)), 50, 1e-9), 'distanceSeuil avec absorption : L + A à la distance');
const rep = { chuchote: 30, conv: 60, cri: 80, trompette: 100, enceinte: 110 };
for (const s of M.SOURCES) ok(Math.abs(M.niveauSource(s.P, 1) - rep[s.id]) < 3, `source ${s.id} : ${M.niveauSource(s.P, 1).toFixed(1)} dB à 1 m`);
ok(Math.abs(Math.log10((2e-5) ** 2 / (1.2 * 343)) - Math.log10(M.I0)) < 0.03, 'seuil 20 µPa ↔ 1e-12 W/m²');
ok(M.sci(1.989e-6) === '2,0×10⁻⁶', M.sci(1.989e-6)); ok(M.sci(3.1623e-4) === '3,2×10⁻⁴', 'sci 3,2'); ok(M.sci(9.99e-5) === '1,0×10⁻⁴', 'sci report de retenue'); ok(M.sci(1, 1) === '1,0', 'sci 1 (sans puissance de 10)');
const I0f = L => M.I0 * Math.pow(10, L / 10);
let pire = 0;
for (let t = 0; t < 20000; t++) {
  const a = M.tirageNiveau(), p = M.piegesNiveau(a);
  ok(a.L1 >= 45 && a.L1 <= 75 && a.L2 >= 10 && a.L2 <= 70 && a.dp < a.d, 'défi 1 : bornes');
  ok(Math.abs(M.niveauAvecParoi(a.P, a.d, a.dp, a.A) - a.L2) < 1e-9, 'défi 1 : niveau derrière la paroi');
  for (const x of p.q1) ok(Math.abs(x - a.L1) / a.L1 > 0.08, `défi 1 q1 : piège ${x} trop proche de ${a.L1}`);
  for (const x of p.q2) ok(Math.abs(x - a.L2) / a.L2 > 0.08, `défi 1 q2 : piège ${x} trop proche de ${a.L2} (A = ${a.A})`);
  const b = M.tirageDistance();
  ok(b.d >= 2 && b.d <= 150 && Math.abs(M.niveauSource(b.P, b.d) - b.Ls) < 1e-9, 'défi 2 : distance');
  const dL = Math.sqrt(b.P / (4 * Math.PI * M.arrondiCS(b.I, 2)));
  const L1r = Math.round(b.L1), dArr = Math.pow(10, (L1r - b.Ls) / 20);
  pire = Math.max(pire, Math.abs(dL - b.d) / b.d, Math.abs(dArr - b.d) / b.d);
  ok(Math.abs(dL - b.d) / b.d <= 0.08 && Math.abs(dArr - b.d) / b.d <= 0.08, 'défi 2 : arrondis (I à 2 CS ou L à l’entier près) dans la tolérance de 8 %');
  for (const x of [Math.pow(10, (b.L1 - b.Ls) / 10), b.P / (4 * Math.PI * b.I)]) ok(Math.abs(x - b.d) / b.d > 0.12, 'défi 2 q1 : piège');
  for (const x of [I0f(b.Ls / 2), b.I * 10, b.I / 10]) ok(Math.abs(x - b.I) / b.I > 0.08, 'défi 2 q2 : piège');
}
console.log(`OK isnModele : ${n} contrôles ; pire écart de distance à l’arrondi : ${(pire * 100).toFixed(2)} %`);
