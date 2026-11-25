// Contrôle du modèle de la simulation 241 : node src/simulations/chcModele.test.mjs
// Graphes valides, formules, bilans de la banque conservés, effets sur le squelette, séquences (plus court chemin), scènes d'animation cohérentes avec le graphe.
import assert from 'node:assert/strict';
import { MOLS, BANQUE, ESPECES, brute, formule, valide, squelette, effetSquelette, conserve, especeDe, appliquer, derouler, sequences, longueurMin, CAS, tirageAnalyse, texteBilan, reactionDe, nbH, masseMolaire } from './chcModele.js';
import { SCENES, grapheDe, resumeGraphe, sommeBrutes, etatAu } from './chcScenes.js';

const egal = (a, b) => { const k = new Set([...Object.keys(a), ...Object.keys(b)]); return [...k].every(e => (a[e] || 0) === (b[e] || 0)); };
// 1. graphes
for (const m of Object.values(MOLS)) { assert.ok(valide(m), m.id + ' : valence dépassée'); m.atomes.forEach((a, i) => assert.ok(nbH(m, i) >= 0)); }
const F = id => formule(MOLS[id]);
const attendu = { BrEt: 'C₂H₅Br', PrCN: 'C₃H₅N', PrNH2: 'C₃H₉N', EtMgBr: 'C₂H₅BrMg', Ald: 'C₂H₄O', Pone: 'C₃H₆O', Bu2ol: 'C₄H₁₀O', MBu2ol: 'C₅H₁₂O', Bu2one: 'C₄H₈O', But2ene: 'C₄H₈', AcEt: 'C₂H₄O₂' };
for (const [id, f] of Object.entries(attendu)) assert.equal(F(id), f, id);
// distances de liaison du dessin (≈ 1) et pas de superposition d'atomes
for (const m of Object.values(MOLS)) {
  m.liaisons.forEach(([a, b]) => { const d = Math.hypot(m.atomes[a].x - m.atomes[b].x, m.atomes[a].y - m.atomes[b].y); assert.ok(Math.abs(d - 1) < 0.02, `${m.id} : liaison ${a}-${b} de longueur ${d.toFixed(3)}`); });
  m.atomes.forEach((p, i) => m.atomes.forEach((q, j) => { if (i < j) assert.ok(Math.hypot(p.x - q.x, p.y - q.y) > 0.95, `${m.id} : atomes ${i} et ${j} superposés`); }));
}
// 2. squelettes
const sq = id => squelette(MOLS[id]);
assert.deepEqual([sq('BrEt').nC, sq('PrCN').nC, sq('PrNH2').nC, sq('EtMgBr').nC, sq('Bu2ol').nC, sq('MBu2ol').nC, sq('Bu2one').nC, sq('But2ene').nC, sq('AcEt').nC], [2, 3, 3, 2, 4, 5, 4, 4, 2]);
assert.equal(sq('MBu2ol').ramifie, true); assert.equal(sq('Bu2ol').ramifie, false); assert.equal(sq('MBu2ol').longueur, 4); assert.equal(sq('Bu2ol').longueur, 4);
assert.equal(sq('PrCN').nCC, 2); assert.equal(sq('Bu2ol').nCC, 3); assert.equal(sq('MBu2ol').nCC, 4);
// 3. banque : bilans conservés, produits cohérents, effets attendus
const EFFET = { G1: 'allonge', G2: 'inchange', G3: 'inchange', G4: 'allonge', G5: 'allongeRamifie', G6: 'inchange', G7: 'raccourci' };
for (const r of BANQUE) {
  for (const [dep, a] of Object.entries(r.apps)) {
    assert.ok(conserve(a.eq), `${r.id} : bilan non conservé ${texteBilan(a.eq)}`);
    // la molécule de départ figure dans les réactifs, le produit dans les produits (avec le bon coefficient)
    assert.ok(a.eq.r.some(([, id]) => id === dep) && a.eq.p.some(([c, id]) => id === a.prod[0] && c === (a.nbProduits || 1)), `${r.id} : réactif ou produit absent du bilan`);
    assert.ok(r.requiert.some(g => MOLS[dep].groupes.includes(g)), `${r.id} : groupe requis absent du départ`);
    assert.equal(effetSquelette(dep, a.prod[0]), EFFET[r.id], `${r.id} : effet sur le squelette`);
  }
  assert.equal(r.apps[r.exemple[0]].prod[0], r.exemple[1], r.id + ' : exemple');
  if (r.partenaire) assert.ok(r.apps[r.exemple[0]].eq.r.some(([, id]) => id === r.partenaire), r.id + ' : partenaire absent du bilan');
}
assert.deepEqual(Object.fromEntries(BANQUE.map(r => [r.id, r.type])), { G1: 'substitution', G2: 'oxydo-réduction', G3: 'oxydo-réduction', G4: 'addition', G5: 'addition', G6: 'oxydo-réduction', G7: 'oxydo-réduction' });
// l'alcool tertiaire ne s'oxyde pas ; un groupe absent est signalé
assert.equal(appliquer('MBu2ol', 'G6').ok, false); assert.match(appliquer('MBu2ol', 'G6').raison, /tertiaire/);
assert.equal(appliquer('BrEt', 'G2').ok, false); assert.match(appliquer('BrEt', 'G2').raison, /absent/);
// 4. séquences : n = longueur minimale annoncée, au moins une séquence de cette longueur, et aucune plus courte
for (const c of CAS) { assert.equal(longueurMin(c.depart, c.cible), c.n, `${c.depart} → ${c.cible}`); assert.ok(sequences(c.depart, c.cible, c.n).length >= 1); }
assert.deepEqual(sequences('BrEt', 'Bu2ol', 2), [['G3', 'G4']]); assert.deepEqual(sequences('BrEt', 'Bu2one', 3), [['G3', 'G4', 'G6']]);
assert.equal(derouler('BrEt', ['G3', 'G5', 'G6']).echec.k, 2);
// 5. scènes : l'image 0 est celle des réactifs, l'image 1 celle des produits
for (const [id, sc] of Object.entries(SCENES)) {
  const r = reactionDe(id), dep = r.exemple[0];
  const g0 = resumeGraphe(grapheDe(sc, false)), g1 = resumeGraphe(grapheDe(sc, true));
  const react = r.apps[dep].eq.r.filter(([, i]) => MOLS[i]).map(([n, i]) => [i, n]);
  assert.ok(egal(g0.brute, sommeBrutes(react)), `${id} : image 0 ${JSON.stringify(g0.brute)} ≠ réactifs ${JSON.stringify(sommeBrutes(react))}`);
  assert.deepEqual(sc.reactifs, react.map(([i]) => i), id + ' : liste des réactifs');
  assert.ok(egal(g1.brute, sommeBrutes(sc.produits)), `${id} : image 1 ${JSON.stringify(g1.brute)} ≠ produits ${JSON.stringify(sommeBrutes(sc.produits))}`);
  assert.deepEqual(sc.produits, [[r.exemple[1], r.apps[dep].nbProduits || 1]], id + ' : produits');
  // nombre de C et de liaisons C–C : produits de la banque
  const nCprod = sc.produits.reduce((s, [i, n]) => s + n * sq(i).nC, 0), nCCprod = sc.produits.reduce((s, [i, n]) => s + n * sq(i).nCC, 0);
  assert.equal(g1.nC, nCprod, id + ' : nombre de C'); assert.equal(g1.nCC, nCCprod, id + ' : liaisons C–C');
  // la liaison « nouvelle » est bien une liaison C–C quand la carte parle de C–C
  if (/C–C/.test(sc.cle.txt)) { const nv = sc.liaisons.filter(b => b.hi === 'nouvelle'); assert.equal(nv.length, 1); assert.ok(nv.every(b => sc.atomes.find(a => a.k === b.a).e === 'C' && sc.atomes.find(a => a.k === b.b).e === 'C')); assert.equal(g1.nCC - g0.nCC, 1, id + ' : une seule liaison C–C de plus'); }
  // pas deux atomes superposés à l'écran à aucun instant (distance minimale entre atomes visibles)
  let dmin = 9;
  for (let t = 0; t <= 1.0001; t += 0.01) {
    const e = etatAu(sc, t), vis = e.atomes.filter(a => a.op > 0.3 && a.e !== 'chip');
    for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) { const d = Math.hypot(vis[i].x - vis[j].x, vis[i].y - vis[j].y); if (d < dmin) dmin = d; assert.ok(d > 0.72, `${id} : atomes ${vis[i].k} et ${vis[j].k} trop proches (${d.toFixed(2)}) à t=${t.toFixed(2)}`); }
  }
  // positions initiale et finale : les liaisons conservées ont une longueur de 1
  const e0 = etatAu(sc, 0), e1 = etatAu(sc, 1);
  e0.liaisons.filter(b => b.lignes.some(l => l.op > 0.99)).forEach(b => assert.ok(Math.abs(Math.hypot(b.a.x - b.b.x, b.a.y - b.b.y) - 1) < 0.02, `${id} : liaison ${b.a.k}-${b.b.k} de longueur ${Math.hypot(b.a.x - b.b.x, b.a.y - b.b.y).toFixed(2)} à t = 0`));
  e1.liaisons.filter(b => b.lignes.some(l => l.op > 0.99)).forEach(b => assert.ok(Math.abs(Math.hypot(b.a.x - b.b.x, b.a.y - b.b.y) - 1) < 0.02, `${id} : liaison ${b.a.k}-${b.b.k} de longueur ${Math.hypot(b.a.x - b.b.x, b.a.y - b.b.y).toFixed(2)} à t = 1`));
  assert.ok(sc.phases.length === 3 && sc.phasesNeutres.length === 3, id);
  assert.ok(!/[0-9]/.test(sc.phasesNeutres.join(' ').replace(/CN⁻|G\d|₂|-\d-/g, '')), id + ' : chiffre dans la légende neutre');
}
// 6. tirages du défi d'analyse
const num = x => x;
for (let i = 0; i < 3000; i++) {
  const { questions } = tirageAnalyse(Math.random), [q1, q2, q3] = questions;
  assert.equal(q1.type, 'num'); assert.ok(Number.isInteger(q1.vrai) && q1.vrai >= 2 && q1.vrai <= 5); for (const [v] of q1.pieges) assert.notEqual(v, q1.vrai);
  for (const q of [q2, q3]) { assert.equal(new Set(q.options).size, q.options.length, 'options en double'); assert.ok(q.bonne >= 0 && q.bonne < q.options.length); const L = q.options.map(o => o.length); assert.ok(L[q.bonne] < Math.max(...L), `QCM ${q.id} : bonne réponse la plus longue : ${JSON.stringify(q.options)}`); assert.ok(!/[_^÷]/.test(q.q + q.expl + q.options.join(''))); }
  assert.ok(num(q1.q).length > 20);
}
assert.equal(masseMolaire(brute(MOLS.MBu2ol).atomes), 88); assert.equal(masseMolaire(brute(MOLS.Bu2ol).atomes), 74); assert.equal(masseMolaire(brute(MOLS.PrCN).atomes), 55); assert.equal(masseMolaire(brute(MOLS.Bu2one).atomes), 72);
console.log('chcModele : graphes, bilans (', BANQUE.length, 'réactions ), séquences, 7 scènes d’animation et 3000 tirages OK');
void ESPECES; void especeDe;
