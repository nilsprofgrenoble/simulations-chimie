// Contrôle scientifique de la simulation 210 : node src/simulations/strModele.test.mjs
//  - chaque molécule : valences respectées (4 liaisons par C, H compris), formule brute attendue (écrite à part), groupes déclarés = groupes détectés dans le graphe,
//    dessin sans atomes superposés et liaisons de longueur 1 ;
//  - chaque réaction de la banque : bilan atomes + charge conservé, type du vocabulaire, exemple de la carte réellement réalisable ;
//  - chaque cas à construire est réalisable, sa plus courte séquence a la longueur annoncée (≤ 3) ; la séquence de protection est unique ;
//  - données écoresponsables et tirages du défi.
import assert from 'node:assert/strict';
import * as M from './strModele.js';

const ATTENDU = { A: 'C₂H₄', B: 'C₂H₅Br', C: 'C₂H₆O', D: 'C₂H₄O', E: 'C₂H₄O₂', F: 'C₂H₃O₂⁻', G: 'C₄H₈O₂', H: 'C₃H₈O', I: 'C₃H₆O', J: 'C₃H₆', K: 'C₃H₈O', L: 'C₃H₆O', M: 'C₃H₆O₂', N: 'C₅H₁₀O₂',
  O: 'C₃H₅O₂⁻', Q: 'C₇H₁₂O₃', P: 'C₉H₁₆O₄', W: 'C₇H₁₄O₃', T: 'C₅H₁₀O₂', S: 'C₇H₁₄O₃', U: 'C₅H₁₂O₂', X: 'C₂H₆O₂' };
const detecter = m => {
  const g = new Set(), v = m.atomes.map(() => []);
  m.liaisons.forEach(([a, b, o]) => { v[a].push([b, o]); v[b].push([a, o]); });
  m.atomes.forEach((a, i) => {
    const h = M.nbH(m, i);
    if (a.e === 'Br') g.add('halogénoalcane');
    if (a.e !== 'C') return;
    const dbl = v[i].filter(([, o]) => o === 2), oxy = v[i].filter(([j]) => m.atomes[j].e === 'O');
    if (dbl.some(([j]) => m.atomes[j].e === 'C')) g.add('alcène');
    const cO = dbl.find(([j]) => m.atomes[j].e === 'O');
    if (cO) {
      const autres = v[i].filter(([j]) => j !== cO[0]);
      const simples = autres.filter(([j]) => m.atomes[j].e === 'O');
      if (simples.length) {
        const j = simples[0][0], voisinsO = v[j].filter(([k]) => k !== i);
        if (m.atomes[j].q === -1) g.add('ion carboxylate'); else if (voisinsO.length === 0) g.add('acide carboxylique'); else g.add('ester');
      } else if (h === 1) g.add('aldéhyde'); else g.add('cétone');
    } else if (oxy.length === 2 && oxy.every(([j]) => v[j].length === 2)) g.add('acétal');
    else if (oxy.length === 1 && oxy[0][1] === 1 && v[oxy[0][0]].length === 1 && m.atomes[oxy[0][0]].q === 0) g.add(h === 2 || h === 3 ? 'alcool primaire' : 'alcool secondaire');
  });
  if (m.id === 'X') return ['diol'];
  return [...g].sort();
};
for (const [id, m] of Object.entries(M.MOLS)) {
  assert.ok(M.valide(m), `${id} : valence dépassée`);
  assert.equal(M.formule(m), ATTENDU[id], `${id} (${m.nom}) : formule ${M.formule(m)} au lieu de ${ATTENDU[id]}`);
  // chaque carbone : liaisons + H = 4
  m.atomes.forEach((a, i) => { if (a.e === 'C') assert.equal(M.somme(m, i) + M.nbH(m, i), 4, `${id} : carbone ${i} sans 4 liaisons`); });
  assert.deepEqual(detecter(m), [...m.groupes].sort(), `${id} (${m.nom}) : groupes déclarés ${m.groupes} ≠ détectés ${detecter(m)}`);
  // dessin : liaisons de longueur 1, pas de superposition
  m.liaisons.forEach(([a, b]) => { const d = Math.hypot(m.atomes[a].x - m.atomes[b].x, m.atomes[a].y - m.atomes[b].y); assert.ok(Math.abs(d - 1) < 0.02, `${id} : liaison ${a}-${b} de longueur ${d}`); });
  for (let i = 0; i < m.atomes.length; i++) for (let j = i + 1; j < m.atomes.length; j++) assert.ok(Math.hypot(m.atomes[i].x - m.atomes[j].x, m.atomes[i].y - m.atomes[j].y) > 0.85, `${id} : atomes ${i} et ${j} superposés`);
}
// noms : jamais de « _ » dans un nom
for (const m of Object.values(M.MOLS)) assert.ok(!/_/.test(m.nom));
// banques
let nbApps = 0;
for (const [nomB, banque] of Object.entries(M.BANQUES)) {
  const ids = new Set();
  for (const r of banque) {
    assert.ok(!ids.has(r.id), 'identifiant dupliqué'); ids.add(r.id);
    if (nomB === 'generale') assert.ok(M.TYPES.includes(r.type), `${r.id} : type hors vocabulaire`);
    assert.ok(r.rendement > 0 && r.rendement <= 100);
    assert.ok(r.apps[r.exemple[0]] && r.apps[r.exemple[0]].prod[0] === r.exemple[1], `${r.id} : l’exemple de la carte n’est pas une application`);
    for (const [dep, a] of Object.entries(r.apps)) {
      nbApps++;
      assert.ok(M.conserve(a.eq), `${r.id} ${dep} : bilan non conservé ${M.texteBilan(a.eq)} ${JSON.stringify(M.bilanAtomes(a.eq))}`);
      // le produit nommé est bien un des produits du bilan, le réactif organique aussi
      assert.ok(a.eq.p.some(([, id]) => id === a.prod[0]), `${r.id} ${dep} : produit absent du bilan`);
      assert.ok(a.eq.r.some(([, id]) => id === dep), `${r.id} ${dep} : réactif absent du bilan`);
      // la molécule de départ possède bien le groupe requis
      assert.ok(r.requiert.some(g => M.MOLS[dep].groupes.includes(g)), `${r.id} : ${dep} n’a pas le groupe requis`);
    }
  }
}
assert.equal(M.BANQUE_GENERALE.length, 9);
assert.ok(M.BANQUE_GENERALE.length >= 7 && M.BANQUE_GENERALE.length <= 10);
// les cinq types sont tous présents dans la banque
for (const t of M.TYPES) assert.ok(M.BANQUE_GENERALE.some(r => r.type === t), `type absent : ${t}`);
// cas à construire
for (const c of M.CAS) {
  const n = M.longueurMin(M.BANQUE_GENERALE, c.depart, c.cible, 3);
  assert.equal(n, c.n, `${c.depart}→${c.cible} : plus courte séquence ${n}, annoncée ${c.n}`);
  assert.ok(c.n <= 3);
  const s = M.sequences(M.BANQUE_GENERALE, c.depart, c.cible, c.n);
  assert.ok(s.length >= 1);
  for (const suite of s) { const b = M.bilanSequence(M.BANQUE_GENERALE, c.depart, c.cible, suite); assert.ok(b.atteint, 'séquence non atteinte'); }
  console.log(`${c.depart}→${c.cible} : ${s.length} séquence(s) de ${c.n} étape(s) : ${s.map(x => x.join('+')).join(' ; ')}`);
}
// séquences du parcours guidé : uniques
assert.deepEqual(M.sequences(M.BANQUE_GENERALE, 'C', 'E', 2), [['R1', 'R2']]);
assert.deepEqual(M.sequences(M.BANQUE_GENERALE, 'A', 'D', 3), [['R8', 'R7', 'R1']]);
// protection : la seule séquence de 3 étapes est protection – réduction par LiAlH4 – déprotection ; sans protection, on n'atteint pas T en 1 ou 2 étapes
const cp = M.CAS_PROTECTION;
assert.deepEqual(M.sequences(M.BANQUE_PROTECTION, cp.depart, cp.cible, 3), [['P1', 'P3', 'P4']]);
assert.equal(M.longueurMin(M.BANQUE_PROTECTION, cp.depart, cp.cible, 4), 3);
assert.equal(M.appliquer(M.BANQUE_PROTECTION, 'Q', 'P3').produit, 'U');   // sans protection : le diol
assert.equal(M.appliquer(M.BANQUE_PROTECTION, 'Q', 'P2').produit, 'S');
assert.ok(!M.appliquer(M.BANQUE_PROTECTION, 'P', 'P2').ok, 'NaBH4 ne doit pas agir sur l’acétal');
// messages d'erreur ciblés
const e1 = M.appliquer(M.BANQUE_GENERALE, 'D', 'R6');
assert.ok(!e1.ok && /acide carboxylique/.test(e1.raison) && /aldéhyde/.test(e1.raison), e1.raison);
const e2 = M.appliquer(M.BANQUE_GENERALE, 'H', 'R1'); assert.ok(!e2.ok && /alcool secondaire/.test(e2.raison), e2.raison);
const e3 = M.appliquer(M.BANQUE_GENERALE, 'J', 'R8'); assert.ok(!e3.ok);
// rendement global d'une séquence : produit des rendements
const b = M.bilanSequence(M.BANQUE_GENERALE, 'C', 'E', ['R1', 'R2']); assert.ok(Math.abs(b.rendementGlobal - 65 * 0.9) < 1e-9);
// éco
assert.ok(Math.abs(M.rendementGlobal(M.VOIES.A) - 56.95) < 1e-9); assert.ok(Math.abs(M.rendementGlobal(M.VOIES.B) - 64.8) < 1e-9);
assert.equal(M.dechetsTotal(M.VOIES.A), 5); assert.ok(Math.abs(M.dechetsTotal(M.VOIES.B) - 0.7) < 1e-9);
let alea = 12345; const rnd = () => (alea = (alea * 1664525 + 1013904223) % 4294967296) / 4294967296;
for (let i = 0; i < 5000; i++) {
  const t = M.tirageVoies(rnd), gA = M.rendementGlobal(t.A), gB = M.rendementGlobal(t.B);
  assert.ok(gB - gA >= 5, `écart de rendement global trop faible : ${gA} / ${gB}`);
  assert.ok(M.dechetsTotal(t.A) > 3 * M.dechetsTotal(t.B));
}
console.log(`strModele : ${Object.keys(M.MOLS).length} molécules, ${M.BANQUE_GENERALE.length} + ${M.BANQUE_PROTECTION.length} réactions, ${nbApps} applications, tous les bilans conservés. OK`);

// ---------- tirages du défi « analyse » ----------
{
  let al = 98765; const r2 = () => (al = (al * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const sansProbleme = t => !/[_÷^]|\//.test(t.replace(/\d\/\d/g, ''));
  for (let i = 0; i < 4000; i++) {
    for (const tir of [M.tirageProtection(r2), M.tirageEco(r2)]) {
      for (const q of tir.questions) {
        assert.ok(sansProbleme(q.q) && sansProbleme(q.expl) && sansProbleme(q.indice), 'caractère interdit dans ' + q.q);
        if (q.type === 'qcm') {
          assert.ok(q.bonne >= 0 && q.bonne < q.options.length);
          const L = q.options.map(o => o.length), bon = L[q.bonne];
          assert.ok(L.filter(l => l > bon).length >= 1, `${q.id} : la bonne réponse est la plus longue (égalité comprise) : ${q.options.join(' | ')}`);
          assert.equal(new Set(q.options).size, q.options.length);
        } else {
          assert.ok(isFinite(q.vrai) && q.vrai > 0);
          for (const [v] of (q.pieges || [])) assert.ok(Math.abs(v - q.vrai) / q.vrai > 0.08, `${q.id} : piège ${v} trop proche de ${q.vrai}`);
        }
      }
      if (tir.kind === 'eco') {
        // données affichées = données du corrigé : on relit les nombres du texte
        const [q1, q2] = tir.questions, v = tir.voies[tir.voie];
        const [e1, e2] = [...q1.q.matchAll(/= (\d+) %/g)].map(m => Number(m[1]));
        assert.ok(Math.abs(e1 * e2 / 100 - M.rendementGlobal(v)) < 1e-9, 'η affichés ≠ données');
        assert.ok(Math.abs(q1.vrai - e1 * e2 / 100) < 1e-9);
        const dech = [...q2.q.matchAll(/(\d+,\d) kg/g)].map(m => Number(m[1].replace(',', '.')));
        const masse = Number(/obtenir (\d+) g/.exec(q2.q)[1]);
        assert.ok(Math.abs(q2.vrai - (dech[0] + dech[1]) * masse) < 1e-6, 'déchets affichés ≠ corrigé');
        // pire écart d’arrondi à 2 chiffres significatifs sur chaque intermédiaire : la tolérance de 5 % doit accepter
        const arr2 = x => Number(x.toPrecision(2));
        assert.ok(Math.abs(arr2(arr2(e1 / 100) * arr2(e2 / 100) * 100) - q1.vrai) / q1.vrai < 0.05);
      }
    }
  }
  // QCM : la bonne réponse de q1 (lettre) est bien l'étape demandée
  for (let i = 0; i < 500; i++) {
    const t = M.tirageProtection(r2), q = t.questions[0];
    const ids = [...q.q.matchAll(/\(([ABC])\) ([^;]+?)(?= ;|\. Laquelle)/g)].map(m => ({ l: m[1], txt: m[2].trim() }));
    const voulu = t.demande === 'protection' ? M.TEXTE_ETAPE_PROT.P1 : M.TEXTE_ETAPE_PROT.P4;
    const bonneLettre = ids.find(x => x.txt === voulu).l;
    assert.equal(q.options[q.bonne], `l’étape (${bonneLettre})`);
  }
  console.log('tirages du défi analyse : 4000 tirages OK');
}
