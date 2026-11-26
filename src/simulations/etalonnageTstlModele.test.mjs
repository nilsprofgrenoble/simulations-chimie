// Test du modèle de la sim 258 : node src/simulations/etalonnageTstlModele.test.mjs
import * as M from './etalonnageTstlModele.js';
let n = 0;
const ok = (c, msg) => { n++; if (!c) { console.error('ÉCHEC :', msg); process.exit(1); } };
const proche = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.abs(b), `${msg} : ${a} ≠ ${b}`);

// dilution : conservation de la quantité de matière
proche(M.concEtalon(4, 100, 100), 4, 1e-12, 'étalon 4 mL / 100 mL');
proche(M.concEtalon(5, 250, 100), 2, 1e-12, 'dilution 5/250');
ok(M.facteur(5, 250) === 50, 'F = Vf/Vp');
proche(M.cInitiale(M.cDilue(236, 50), 50), 236, 1e-12, 'F × (c/F)');
// situations
ok(M.situation(4.72, 2, 10) === 'dans' && M.situation(23.6, 2, 10) === 'hors-domaine' && M.situation(0.472, 2, 10) === 'en-dessous', 'situations');
ok(M.situation(10, 2, 10) === 'dans' && M.situation(12, 2, 10) === 'hors-domaine' && M.situation(5, 6, 10) === 'en-dessous' && M.situation(9, 2, 8) === 'au-dessus', 'bornes');
// parcours guidé
ok(M.K === 80, 'k de la cellule A'); ok(M.ETALONS.join() === '2,4,6,8,10', 'étalons');
proche(M.A_GUIDE, M.penteTheorique(M.SOL, M.K), 0.02, 'pente tracée ≈ Σλ/k à 2 % près (interactions)');
proche(M.C_DIL, 4.72, 1e-9, 'c(S′)');
ok(M.situation(M.C_DIL, 2, 10) === 'dans', 'S′ dans la gamme');
proche(M.C_S_LUE, M.C_S, 0.03, 'dosage retrouvé à 3 %');
ok(M.situation(M.C_S, 2, 10) === 'hors-domaine', 'S non diluée hors domaine');
ok(Math.abs(M.C_SANS_DILUTION_LUE / M.C_S - 1) > 0.3, 'sans dilution : erreur de plus de 30 %');
ok(M.C_DIL_LUE_CHAUD > 1.08 * M.C_DIL, 'à 30 °C : concentration lue trop grande de plus de 8 %');
proche(M.facteurT(30), 1.1, 1e-12, 'facteur de température'); ok(M.facteurT(25) === 1, 'facteurT(25)');
for (const o of M.OPTIONS_DILUTION) ok(Math.abs(o.vf / o.vp - o.F) < 1e-9, 'options cohérentes');
ok(M.OPTIONS_DILUTION.filter(o => M.situation(M.C_S / o.F, 2, 10) === 'dans').length === 1, 'une seule option adaptée');
// droite : passe par l'origine, croissante, sauf points hors domaine
for (const id of M.ORDRE_SOLUTES) for (const cel of M.ORDRE_CELLULES) {
  const k = M.kDe(M.CELLULES[cel]), pts = M.pointsGamme(id, k, [1, 2, 4, 6, 8, 10, 20, 50]), a = M.droiteDe(pts);
  proche(a, M.penteTheorique(id, k), 0.025, `pente ${id} ${cel}`);
  for (let i = 1; i < pts.length; i++) ok(pts[i].G > pts[i - 1].G, 'G croissante');
}
// tirages
for (let i = 0; i < 5000; i++) {
  const d = M.tirageDefiDilution(); ok(d.bons.length >= 1, `défi dilution sans bon facteur : ${d.cS}`);
  for (const F of d.bons) ok(M.situation(d.cS * 1000 / F, 2, 10) === 'dans', 'bons facteurs');
  const e = M.tirageDefiDosage();
  ok(e.concs.every(c => c >= 2 && c <= 10), `étalons hors 2–10 : ${e.concs}`);
  ok(Math.abs(e.cdLue / e.cd - 1) < 0.04, `lecture à plus de 4 % : ${e.cdLue} / ${e.cd}`);
  ok(Math.abs(e.cdLue * e.F / 1000 / e.cS - 1) < 0.04, 'cS retrouvée');
  ok(M.situation(e.cd, 2, 10) === 'dans', 'S′ du défi dans la gamme');
}
console.log(`OK : ${n} vérifications`);
