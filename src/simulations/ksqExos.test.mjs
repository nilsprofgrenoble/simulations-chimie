import assert from 'node:assert/strict';
import { KSQ_ANA, KSQ_VAL, KSQ_SAPP } from './ksqExos.js';
// QCM équilibrés : la bonne réponse n'est jamais la plus longue (ANA et VAL), un seul vrai par question
for (const e of [...KSQ_ANA, ...KSQ_VAL]) {
  const o = e.options, vrais = o.filter(x => x[1]);
  assert.equal(vrais.length, 1, e.id);
  const long = Math.max(...o.map(x => x[0].length));
  assert.ok(vrais[0][0].length < long, `${e.id} : la bonne réponse est la plus longue`);
  assert.equal(new Set(o.map(x => x[0])).size, o.length, e.id);
}
const pos = KSQ_ANA.map(e => e.options.findIndex(x => x[1])); console.log('positions des bonnes réponses ANA', pos.join(','));
// SAPP : 400 tirages, valeurs finies et positives, pas de doublon de réponse entre les deux questions
for (let i = 0; i < 400; i++) for (const e of KSQ_SAPP) {
  const p = e.gen(), b0 = e.build(p, 0), b1 = e.build(p, 1);
  for (const b of [b0, b1]) { assert.ok(isFinite(b.solution.val) && b.solution.val > 0, e.id); assert.ok(b.utiles.every(u => b.tokens[u]), e.id + ' jeton utile manquant'); }
  assert.notEqual(b0.solution.val, b1.solution.val, e.id + ' : deux questions de même réponse');
}
console.log('ksqExos : OK');
