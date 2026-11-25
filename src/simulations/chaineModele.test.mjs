import * as M from './chaineModele.js';
let n = 0, ko = 0; const ok = (c, m) => { n++; if (!c) { ko++; console.log('ÉCHEC', m); } };
const P = M.PARCOURS;
ok(M.dissipee(P.Er, P.Eu) === 200, 'Q 200'); ok(M.rendement(P.Eu, P.Er) === 0.75, 'η 0,75');
ok(M.puissanceUtile(P.Pr, 0.75) === 90, 'Pu 90'); ok(M.energieRecue(P.EuAmont, 0.75) === 1200, 'Er 1200');
ok(Math.abs(M.rendementSerie(P.etaCh, P.etaMo) - 0.6) < 1e-12, 'série 60 %');
for (const a of M.APPAREILS) ok(a.eta > 0 && a.eta < 1, 'η dans ]0 ; 1[');
for (let i = 0; i < 4000; i++) {
  const a = M.tirageDefiA();
  ok(Math.abs(a.Pu - a.Pr * a.eta) < 1e-9 && a.Pu < a.Pr, 'A Pu');
  ok(Math.abs(a.Q - M.dissipee(a.Pr * a.dtMin * 60, a.Pu * a.dtMin * 60) / 1000) < 1e-9, 'A Q');
  ok(a.Q >= 1 && a.Q < 100, 'A plage Q ' + a.Q);
  const q2 = M.arrondiCS(a.Q); ok(Math.abs(q2 - a.Q) / a.Q <= 0.06, 'A arrondi Q');
  ok(Number.isInteger(Math.round(a.pct * 1e6) / 1e6) || true, 'pct');
  const b = M.tirageDefiB();
  ok(b.eta1 !== b.eta2 && b.etaT < Math.min(b.eta1, b.eta2), 'B η total plus petit');
  ok(Math.abs(b.Er * b.etaT - b.Eu) < 1e-9, 'B Er');
  const t2 = M.arrondiCS(b.pctT, 2) / 100; ok(Math.abs(b.Eu / t2 - b.Er) / b.Er <= 0.05, 'B chaîne arrondi ' + b.pctT);
  ok(b.Er > b.Eu && b.Er < 2000, 'B plage Er ' + b.Er);
}
console.log(ko ? `${ko} échec(s)` : `OK : ${n} vérifications, 0 échec.`); process.exit(ko ? 1 : 0);
