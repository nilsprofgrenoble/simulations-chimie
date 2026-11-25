import * as M from './jouleModele.js';
let n = 0, ko = 0;
const ok = (c, m) => { n++; if (!c) { ko++; console.log('ÉCHEC', m); } };
const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
ok(M.intensite(12, 24) === 0.5, 'Ohm'); ok(M.puissanceUI(12, 0.5) === 6, 'UI'); ok(M.puissanceJoule(24, 0.5) === 6, 'RI2'); ok(M.puissanceUR(12, 24) === 6, 'U2/R');
ok(M.energieJ(6, 600) === 3600, 'W'); ok(M.puissanceJoule(10, 1.5) === 22.5, 'R2 I2');
ok(M.pertesCable(0.5, 8) === 32, 'câble'); ok(proche(M.puissanceJoule(5, 2), 4 * M.puissanceJoule(5, 1)), 'I double P x4');
ok(proche(M.puissanceUR(24, 10), 4 * M.puissanceUR(12, 10)), 'U double P x4');
for (let k = 0; k < 4000; k++) {
  const a = M.tirageDefiA();
  ok(proche(M.puissanceUI(a.U, a.I), a.P) && proche(M.puissanceJoule(a.R, a.I), a.P), 'A cohérent');
  ok(a.P >= 1 && a.P <= 100 && a.I >= 0.1 && a.I <= 3, 'A plage ' + a.R + ' ' + a.U);
  // Élève qui arrondit I à 2 chiffres significatifs puis calcule P = U × I : écart ≤ 6 %
  const i2 = M.arrondiCS(a.I, 2); ok(Math.abs(a.U * i2 - a.P) / a.P <= 0.06, 'A arrondi I ' + a.R + ' ' + a.U);
  ok(Math.abs(M.energieJ(M.arrondiCS(a.P, 2), a.dtMin * 60) - a.W) / a.W <= 0.06, 'A arrondi W');
  { const i3 = M.arrondiCS(a.I, 2), p3 = M.arrondiCS(a.U * i3, 2); ok(Math.abs(p3 * a.dtMin * 60 - a.W) / a.W <= 0.1, 'A chaîne W'); ok(Math.abs(p3 - a.P) / a.P <= 0.06, 'A chaîne P'); }
  const b = M.tirageDefiB();
  ok(proche(b.pertes, M.pertesCable(b.r, M.intensiteAppareil(b.P, b.U))), 'B cohérent');
  ok(b.part > 0.05 && b.part < 40, 'B plage ' + b.part + ' ' + b.r + ' ' + b.U + ' ' + b.P);
  ok(Math.abs(M.pertesCable(b.r, M.arrondiCS(b.I, 2)) - b.pertes) / b.pertes <= 0.1, 'B arrondi');
}
console.log(ko ? `${ko} échecs sur ${n}` : `OK : ${n} vérifications, 0 échec.`);
process.exit(ko ? 1 : 0);
