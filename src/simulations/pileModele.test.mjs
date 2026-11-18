import * as M from './pileModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-3) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
const zn = { id: 'zn', c: 0.10, V: 100, m: 2.0 }, cu = { id: 'cu', c: 0.10, V: 100, m: 2.0 };
// pile Daniell : 1,10 V à concentrations égales, Cu pôle +, Zn pôle −
const e = M.etat(zn, cu, 0);
ok(proche(e.U, 1.10, 1e-6) && e.plus === 'cu' && e.moins === 'zn', 'Daniell 1,10 V');
ok(proche(M.lecture(zn, cu, 0, 'd'), 1.10) && proche(M.lecture(zn, cu, 0, 'g'), -1.10), 'lecture signée');
// équation, K
ok(M.equationTexte('zn', 'cu') === 'Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)', 'équation Daniell ' + M.equationTexte('zn', 'cu'));
ok(M.equationTexte('cu', 'ag') === 'Cu(s) + 2 Ag⁺(aq) → Cu²⁺(aq) + 2 Ag(s)', 'équation Cu/Ag ' + M.equationTexte('cu', 'ag'));
ok(proche(M.logK('zn', 'cu'), 2 * 1.10 / 0.059), 'log K');
// capacité : Cu²⁺ limitant (1,0e-2 mol) ; Zn 2,0 g = 3,06e-2 mol ; x_max = 1,0e-2 ; Q = 2 x_max F = 1930 C
ok(e.limitant === 'ion' && proche(e.Qmax, 1930, 1e-6) && proche(M.xmax(zn, cu), 0.010), 'capacité Daniell');
// usure : tension qui décroît, chute à 0 à l'épuisement ; Qr monte jusqu'à K
let prec = 9; for (const f of [0, 0.3, 0.6, 0.9, 0.99, 0.9999]) { const u = M.etat(zn, cu, e.neMax * f).U; ok(u <= prec + 1e-12 && u > 0.8, 'décroissance ' + f + ' ' + u); prec = u; }
const fin = M.etat(zn, cu, e.neMax); ok(fin.U === 0 && fin.use && proche(fin.logQr, fin.logK), 'pile usée');
ok(proche(M.etat(zn, cu, e.neMax / 2).Q, 965), 'charge débitée');
// bilan de matière à mi-parcours : Cu²⁺ 5 mmol, Zn²⁺ 15 mmol, masse de zinc 2,0 − 0,005 × 65,4
const h = M.etat(zn, cu, 0.010); ok(proche(h.nIonPlus, 0.005) && proche(h.nIonMoins, 0.015) && proche(h.mMoins, 2 - 0.005 * 65.4), 'bilan mi-parcours');
// zinc limitant (lame de 0,10 g)
const zp = { ...zn, m: 0.10 }, el = M.etat(zp, cu, 0); ok(el.limitant === 'metal' && proche(el.Qmax, 2 * 0.10 / 65.4 * 96500), 'zinc limitant');
// argent : z = 1
const ag = { id: 'ag', c: 0.10, V: 100, m: 2 }, ea = M.etat(cu, ag, 0); ok(ea.plus === 'ag' && proche(ea.U, 0.4305, 1e-6) && proche(ea.Qmax, 0.010 * 96500), 'Cu/Ag');
// toutes les paires : tension positive, pôles cohérents
for (const [a, b] of M.PAIRES) { const t = M.etat({ id: a, c: 0.1, V: 100, m: 2 }, { id: b, c: 0.1, V: 100, m: 2 }); ok(t.U > 0.2 && M.METAUX[t.plus].E0 > M.METAUX[t.moins].E0, 'paire ' + a + b); }
// défis
for (let i = 0; i < 20000; i++) {
  const d = M.tirageDefiPolarite(); ok(Math.abs(d.lu) > 0.2 && (d.lu > 0) === ((d.borneV === 'g' ? d.g.id : d.d.id) === d.plus), 'défi 1 cohérent');
  const c = M.tirageDefiCapacite(); ok(proche(c.Q, c.e.Qmax, 1e-9) && c.Q > 50 && c.duree > 0.05 && c.duree < 200, 'défi 2 ' + JSON.stringify(c));
  ok(Math.max(c.neIon, c.neMet) / c.ne >= 1.3, 'limitant net');
}
console.log('pileModele : tous les tests passent (' + n + ' contrôles)');
