import * as M from './batterieModele.js';
let n = 0, ko = 0;
const ok = (c, m) => { n++; if (!c) { ko++; console.log('ÉCHEC', m); } };
const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
ok(proche(M.chargeC(0.5, 20), 10), 'Q = I dt');
ok(M.ahEnC(7) === 25200, '7 Ah');
ok(M.energieWh(12, 7) === 84 && M.energieJ(12, 7) === 302400, 'E 12 V 7 Ah');
ok(proche(M.intensite(10, 12), 0.8333333333), 'I = P/U');
ok(proche(M.dureeH(7, 0.5), 14), 'durée 14 h');
ok(proche(M.dureeH(7, M.intensite(10, 12)), 8.4), 'durée lampe');
ok(proche(M.dureeEnergieH(84, 10), 8.4), 'E/P');
ok(M.chargeRestanteAh(7, 0.5, 20) === 0, 'restante nulle');
ok(proche(M.chargeRestanteAh(7, 0.5, 4), 5), 'restante');
ok(M.energieWh(3.7, 10) === 37 && M.energieWh(12, 7) > M.energieWh(3.7, 10), 'compare');
for (let k = 0; k < 4000; k++) {
  const a = M.tirageDefiA();
  ok(proche(M.dureeH(a.Qs, a.I), a.dt) && proche(M.dureeEnergieH(M.energieWh(a.U, a.Qs), a.P), a.dt), 'A cohérent');
  ok(a.dt > 0.3 && a.dt < 20, 'A plage ' + a.dt);
  // Un élève qui arrondit I à 2 chiffres significatifs doit rester dans la tolérance (6 %)
  const t = M.dureeH(a.Qs, M.arrondiCS(a.I, 2)); ok(Math.abs(t - a.dt) / a.dt <= 0.06, 'A arrondi ' + a.U + ' ' + a.P);
  const b = M.tirageDefiB();
  ok(proche(M.capaciteMinAh(b.P, b.t, b.U), b.Qs), 'B cohérent'); ok(b.Qs >= 2 && b.Qs <= 50, 'B plage ' + b.Qs);
}
console.log(ko ? `${ko} échecs sur ${n}` : `OK : ${n} vérifications, 0 échec.`);
process.exit(ko ? 1 : 0);
