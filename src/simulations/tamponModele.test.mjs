import * as M from './tamponModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-3) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
const q = M.quantites(0.20, 0.5), P = { pKa: 4.76, ...q };
ok(proche(q.nAH, 10) && proche(q.nA, 10), 'quantités');
// mélange équimolaire : pH = pKA ; eau pure : 7
ok(proche(M.pHTampon(P), 4.76) && proche(M.pHEau({}), 7), 'pH initiaux');
// ajout de 10 mL d'acide / de soude à 0,10 mol/L : 1,0 mmol
ok(proche(M.pHEau({ va: 10 }), -Math.log10(1 / 110), 2e-3) && proche(M.pHEau({ vb: 10 }), 14 + Math.log10(1 / 110), 2e-3), 'eau ± 10 mL');
ok(proche(M.pHTampon({ ...P, va: 10 }), 4.76 + Math.log10(9 / 11), 2e-3) && proche(M.pHTampon({ ...P, vb: 10 }), 4.76 + Math.log10(11 / 9), 2e-3), 'tampon ± 10 mL');
// dilution : ×10 laisse le pH presque inchangé (écart < 0,01), ×1000 non (> 0,1)
ok(M.variation(M.pHTampon(P), M.pHTampon({ ...P, ve: 900 })) < 0.01 && M.variation(M.pHTampon(P), M.pHTampon({ ...P, ve: 99900 })) > 0.1, 'dilution');
// capacité limitée : après 100 mL d'acide (toute la base consommée) le pH s'effondre
ok(M.pHTampon({ ...P, va: 100 }) < 3.2 && M.pHTampon({ ...P, va: 50 }) > 4.2, 'limite');
// composition : après 10 mL d'acide, 11,0 mmol de AH et 9,0 mmol de A⁻
const c = M.composition({ ...P, va: 10 }); ok(proche(c.nAH, 11, 2e-3) && proche(c.nA, 9, 2e-3) && proche(c.nAH + c.nA, 20), 'composition');
// la courbe est monotone croissante (abscisse signée : acide < 0 < soude)
const cb = M.courbeAjout(P); ok(cb.every((p, i) => i === 0 || (p.tampon >= cb[i - 1].tampon - 1e-9 && p.eau >= cb[i - 1].eau - 1e-9)), 'courbe monotone');
// défi 1 : un seul tampon, variations du tampon < 0,25 pour les deux ajouts ; chaque autre bécher > 0,5 pour au moins un ajout
for (let i = 0; i < 20000; i++) {
  const d = M.tirageDefiTampon(), t = d.bechers[d.vrai];
  ok(d.bechers.filter(b => b.id === 'tampon').length === 1 && d.bechers.length === 3, 'un seul tampon');
  ok(Math.abs(t.phA - t.ph0) < 0.25 && Math.abs(t.phB - t.ph0) < 0.25, 'tampon résiste ' + JSON.stringify(t));
  d.bechers.forEach(b => { if (b.id !== 'tampon') ok(Math.max(Math.abs(b.phA - b.ph0), Math.abs(b.phB - b.ph0)) > 0.5, 'non tampon ' + b.id + ' ' + JSON.stringify(b)); });
  ok(Math.abs(d.varAcide - Math.abs(t.phA - t.ph0)) < 1e-9, 'variation acide cohérente');
  const e = M.tirageDefiCouple(), dist = e.cand.map(x => Math.abs(x.pKa - e.pHvise)), best = dist[e.vrai];
  ok(dist.every((x, k) => k === e.vrai || x - best >= 0.79) && best <= 0.75 && e.pHvise >= 3 && e.pHvise <= 10, 'défi 2');
  const rr = Number(e.ratio.toPrecision(2)); ok(Math.abs(rr - e.ratio) / e.ratio <= 0.06 && Math.abs(M.pHTampon({ pKa: e.cand[e.vrai].pKa, nAH: 10, nA: 10 * e.ratio }) - e.pHvise) < 0.03, 'rapport du défi 2');
}
console.log('tamponModele : tous les tests passent (' + n + ' + 40 000 tirages)');
