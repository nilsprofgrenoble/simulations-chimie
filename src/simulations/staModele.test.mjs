import * as M from './staModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
// géométrie
ok(Math.abs(M.angleHCH(0) - 120) < 1e-9, 'plan 120°'); const a1 = M.angleHCH(1); ok(a1 > 105 && a1 < 110, 'pyramide ≈ 107° : ' + a1);
ok(M.angleHCH(0.12) > 117 && M.angleHCH(0.12) < 120, 'radical quasi plan');
// électrons : 3 liaisons (6 e) + doublet (2) ou électron (1)
for (const t of Object.values(M.TYPES)) ok(t.electrons === 6 + 2 * t.doublet + (t.id === 'radical' ? 1 : 0), 'électrons ' + t.id);
// stabilité : ordre des classes
const S = (...x) => x;
ok(M.indice('cation', S('Me', 'Me', 'Me')) > M.indice('cation', S('Me', 'Me', 'H')) && M.indice('cation', S('Me', 'Me', 'H')) > M.indice('cation', S('Me', 'H', 'H')) && M.indice('cation', S('Me', 'H', 'H')) > M.indice('cation', S('H', 'H', 'H')), 'cation III>II>I>méthyle');
ok(M.indice('anion', S('H', 'H', 'H')) > M.indice('anion', S('Me', 'H', 'H')) && M.indice('anion', S('Me', 'H', 'H')) > M.indice('anion', S('Me', 'Me', 'Me')), 'anion : ordre inverse');
ok(M.indice('anion', S('Cl', 'H', 'H')) > M.indice('anion', S('H', 'H', 'H')), 'attracteur stabilise anion'); ok(M.indice('cation', S('Cl', 'H', 'H')) < M.indice('cation', S('H', 'H', 'H')), 'attracteur déstabilise cation');
ok(M.indice('radical', S('Me', 'Me', 'Me')) > M.indice('radical', S('H', 'H', 'H')), 'radical : alkyles stabilisent');
ok(M.classe(S('Me', 'H', 'Cl')) === 1, 'classe');
// défis (3 000 tirages)
for (let i = 0; i < 3000; i++) {
  const d = M.tirageClasser(); ok(d.cands.length === 3 && new Set(d.cands.map(s => s.slice().sort().join())).size === 3, 'candidats distincts');
  const v = d.cands.map(s => M.indice(d.type, s)); ok(v.filter(x => x === Math.max(...v)).length === 1 && v.indexOf(Math.max(...v)) === d.bonne, 'une seule bonne');
  for (let c = 0; c < 3; c++) { const r = M.diagClasser(d, c); ok(r.ok === (c === d.bonne), 'diag'); if (!r.ok) ok(r.msg.length > 30, 'message'); }
  const p = M.tirageProduit(); ok(p.voies.length === 2 && p.voies[0].classe !== p.voies[1].classe && p.options.length === 2 && p.options.includes(p.produitMaj), 'produit');
  ok(p.voies.find(v => v.produit === p.produitMaj).classe === Math.max(p.voies[0].classe, p.voies[1].classe), 'majoritaire = classe max');
  ok(M.diagProduit(p, p.classeMaj, p.produitMaj).ok && !M.diagProduit(p, p.classeMaj, p.options.find(o => o !== p.produitMaj)).ok, 'diag produit');
}
console.log(`staModele OK (${n} vérifications)`);
