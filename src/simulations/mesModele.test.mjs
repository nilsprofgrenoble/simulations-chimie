import * as M from './mesModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const att = { ethanoate: 2, nitrate: 3, carbonate: 3, allyle: 2, amide: 2, enolate: 2 };
for (const id of M.LISTE) {
  const e = M.ESPECES[id], F = M.formes(e), dep = M.formeInit(e);
  ok(M.validite(e, dep).ok, id + ' départ valide'); ok(F.length === att[id], `${id} : ${F.length} formes (attendu ${att[id]})`);
  ok(M.nbElectrons(e) === M.electronsTotal(e, dep), id + ' électrons');
  for (const f of F) { ok(M.validite(e, f).ok, id + ' forme valide'); ok(Object.values(M.charges(e, f)).reduce((s, q) => s + q, 0) === e.charge, id + ' somme des charges'); ok(f.b.length === e.liaisons.length, id + ' squelette'); }
  ok(M.equivalentes(e) === M.EQUIV.includes(id), id + ' équivalence');
  ok(M.probables(e).length === (M.equivalentes(e) ? F.length : 1), id + ' formes probables');
  for (let t = 0; t < 400; t++) {
    const d = M.tirageFormes(id); ok(d.cands.filter(c => c.juste).length === F.length - 1, id + ' formes justes'); ok(d.cands.length >= 3 && d.cands.length <= 5, id + ' nb candidats ' + d.cands.length);
    for (const c of d.cands) { const v = M.validite(e, c.f); ok(v.ok === c.juste, id + ' candidat'); if (!c.juste) { ok(c.v.raison === 'electrons' || c.v.raison === 'octet', id + ' raison'); ok(M.motifFausse(e, c.v).length > 10, 'motif'); } if (c.juste) ok(M.cle(c.f) !== M.cle(d.dep), id + ' différente de la donnée'); }
    ok(new Set(d.cands.map(c => M.cle(c.f))).size === d.cands.length, id + ' candidats distincts');
    const sel = d.cands.map((c, i) => c.juste ? i : -1).filter(i => i >= 0); ok(M.diagFormes(d, sel).ok, 'bon choix'); ok(!M.diagFormes(d, []).ok, 'rien choisi');
  }
}
const h = n => M.hybride(M.ESPECES[n]);
ok(Math.abs(h('nitrate').b[0] - 4 / 3) < 1e-9 && Math.abs(h('nitrate').q.o1 + 2 / 3) < 1e-9 && Math.abs(h('nitrate').q.n - 1) < 1e-9, 'hybride nitrate');
ok(Math.abs(h('ethanoate').b[1] - 1.5) < 1e-9 && Math.abs(h('ethanoate').q.o1 + 0.5) < 1e-9, 'hybride éthanoate');
ok(Math.abs(h('carbonate').q.o2 + 2 / 3) < 1e-9, 'hybride carbonate'); ok(Math.abs(h('allyle').q.c1 - 0.5) < 1e-9 && Math.abs(h('allyle').q.c2) < 1e-9, 'hybride allyle');
ok(h('amide') === null && h('enolate') === null, 'pas d’hybride pour formes inégales');
for (let t = 0; t < 100; t++) { const p = M.tirageProbable(); ok(p.bonne >= 0 && p.formes.length === 2, 'probable'); }
// la forme la plus probable de l'amide est neutre ; de l'énolate : charge sur O
const am = M.ESPECES.amide; ok(Object.values(M.charges(am, M.probables(am)[0])).every(q => q === 0), 'amide neutre');
const en = M.ESPECES.enolate; ok(M.charges(en, M.probables(en)[0]).o === -1, 'énolate : charge sur O');
console.log(`mesModele OK (${n} vérifications)`);
// défi hybride
{
  let m = 0;
  for (let t = 0; t < 2000; t++) {
    const d = M.tirageHybride(); const moy = d.detail.reduce((s, x) => s + x, 0) / d.detail.length; ok(Math.abs(moy - d.vrai) < 1e-9, 'moyenne'); ok(M.diagHybride(d, d.vrai).ok && M.diagHybride(d, Number(d.vrai.toFixed(2))).ok && M.diagHybride(d, Number(d.vrai.toFixed(1))).ok, 'arrondis acceptés ' + d.vrai);
    ok(!M.diagHybride(d, NaN).ok && !M.diagHybride(d, d.vrai + 0.2).ok && !M.diagHybride(d, d.vrai - 0.2).ok, 'fausses refusées');
    ok(d.genre === 'ordre' ? d.vrai > 1.2 && d.vrai < 2 : Math.abs(d.vrai) > 0.4, 'valeur non triviale'); m++;
  }
  console.log('hybride défis', m);
}
