import * as B from './biotModele.js';
let n = 0;
const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const pr = (a, b, t = 1e-9) => Math.abs(a - b) <= t;

// Biot : camphre, L = 2,0 dm, C = 0,10 g/mL → α = 44 × 2 × 0,10 = 8,8°
ok(pr(B.alphaPur(B.SUBS.camphre, 2, 0.1), 8.8), 'camphre pur');
ok(pr(B.alphaMel(B.SUBS.camphre, 2, 0.1, 0.5), 0), 'racémique inactif');
ok(pr(B.alphaMel(B.SUBS.camphre, 2, 0.1, 1), 8.8) && pr(B.alphaMel(B.SUBS.camphre, 2, 0.1, 0), -8.8), 'purs opposés');
ok(pr(B.alphaMel(B.SUBS.menthol, 1, 0.2, 0.8), 0.6 * 10), 'menthol 80 % (+) : ee 60 %');
ok(pr(B.eeDe(0.8), 60) && pr(B.eeDe(0.2), 60) && pr(B.eeDe(0.5), 0) && pr(B.eeDe(1), 100), 'ee');
ok(B.majoritaire(0.7) === '+' && B.majoritaire(0.3) === '−' && B.majoritaire(0.5) === null, 'majoritaire');
ok(pr(B.cDepuisAlpha(5, 50, 2), 0.05), 'C depuis α');
ok(pr(B.eeDepuisAlpha(-6, -10), 60), 'ee depuis α');
ok(pr(B.pDepuisEE(40, 1), 0.7) && pr(B.pDepuisEE(40, -1), 0.3), 'p depuis ee');
ok(B.sensDe(3) === 'dextrogyre' && B.sensDe(-3) === 'lévogyre' && B.sensDe(0) === 'inactif', 'sens');
ok(B.arrondiL(0.74) === 0.5 && B.arrondiL(9) === 5 && B.arrondiC(0.123) === 0.12 && B.arrondiP(0.73) === 0.75, 'arrondis');
ok(B.fmtDeg(8.8) === `+8,8` && B.fmtDeg(-8.8).includes('8,8') && B.fmtDeg(0) === '0,0', 'format ' + B.fmtDeg(0));

// défis : 3000 tirages, cohérence et tolérance face à un arrondi de l'élève
for (let i = 0; i < 3000; i++) {
  const d = B.tirageDefiC();
  ok(d && d.alpha !== 0 && Math.abs(d.alpha) >= 1.5, 'tirage C');
  ok(B.diagC(d, d.vrai).ok, 'C exact accepté');
  ok(B.diagC(d, Number(d.vrai.toPrecision(2))).ok, 'C arrondi à 2 CS accepté ' + d.vrai);
  ok(!B.diagC(d, d.vrai * 1.2).ok && !B.diagC(d, d.vrai * 0.8).ok, 'C faux refusé');
  ok(B.diagC(d, d.vrai / 10).msg.includes('centim'), 'piège cm');
  ok(!B.diagC(d, NaN).ok && !B.diagC(d, -d.vrai).ok, 'C nan / négatif');
  const e = B.tirageDefiEE();
  ok(e && e.vrai > 0 && e.vrai <= 100, 'tirage EE');
  ok(Math.abs(e.vrai - e.ee) <= 0.06 * e.ee + 1, 'vrai ≈ ee du modèle ' + e.vrai + ' ' + e.ee);
  ok(B.diagEE(e, e.vrai).ok && B.diagEE(e, Math.round(e.vrai)).ok, 'ee accepté');
  ok(!B.diagEE(e, e.vrai * 1.2).ok && !B.diagEE(e, 100 - e.vrai).ok || Math.abs(100 - e.vrai - e.vrai) < 5, 'ee faux refusé');
  ok(B.diagEE(e, e.vrai / 100).msg.includes('fraction') || e.vrai / 100 < 1e-9, 'piège fraction');
  ok(B.diagEE(e, 120).msg.includes('100'), 'ee > 100');
}
console.log(`biotModele OK (${n} vérifications)`);
