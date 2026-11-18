import * as M from './predominanceModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-6) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
// à pH = pKA : 50 % / 50 %, rapport 1
ok(proche(M.fracBase(4.76, 4.76), 0.5) && proche(M.rapport(4.76, 4.76), 1), 'pH = pKA');
// pKA ± 1 : rapport 10 et 0,1 ; 90,9 % et 9,1 %
ok(proche(M.rapport(5.76, 4.76), 10) && proche(M.pct(M.fracBase(5.76, 4.76)), 100 * 10 / 11) && proche(M.pct(M.fracBase(3.76, 4.76)), 100 / 11), 'pKA ± 1');
ok(proche(M.fracBase(7.0, 9.2) + M.fracAcide(7.0, 9.2), 1), 'somme des fractions');
ok(M.predominante(2, 4.76) === 'AH' && M.predominante(7, 4.76) === 'A' && M.predominante(4.76, 4.76) === 'egal', 'prédominance');
ok(proche(M.pHPourFraction(0.8, 4.76), 4.76 + Math.log10(4)), 'pH pour 80 %');
ok(proche(M.concBase(0.010, 5.76, 4.76), 0.010 * 10 / 11), 'concentration base');
// indicateurs : zones pKA ± 1, couleurs de départ et d'arrivée
const bbt = M.indicParId('bbt'); ok(bbt.zone[0] === 5.8 && bbt.zone[1] === 7.8, 'zone BBT');
ok(M.teinte(bbt, 4) === 'acide' && M.teinte(bbt, 9) === 'base' && M.teinte(bbt, 6.8) === 'melange', 'teintes');
ok(M.couleurIndic(bbt, 2) === 'rgb(250,204,21)' || M.couleurIndic(bbt, 2).startsWith('rgb('), 'couleur');
// tirages des défis sur 20 000 tirages
for (let i = 0; i < 20000; i++) {
  const d = M.tirageDefiPred(); ok(d.pH >= 0 && d.pH <= 14 && d.prod !== 'egal' && Math.abs(d.pH - d.pKa) >= 0.44, 'défi 1');
  // un élève qui arrondit le rapport à 2 chiffres significatifs doit rester dans ± 1,5 point
  const r = Number(M.rapport(d.pH, d.pKa).toPrecision(2)), approx = 100 * r / (1 + r); ok(Math.abs(approx - d.pctBase) <= 1.5, 'tolérance défi 1 ' + d.pH + ' ' + d.pKa);
  const e = M.tirageDefiIndic(); ok(e.ind.filter(x => M.convient(x, e.pHeq)).length === 1 && M.convient(e.ind[e.vrai], e.pHeq), 'défi 2');
}
console.log('predominanceModele : tous les tests passent (' + n + ' + 40 000 tirages)');
