// Contrôle des QCM de la sim 155 : bonne réponse ni la plus longue ni la plus courte (sauf options de même longueur), index valide, textes présents.
import assert from 'node:assert/strict';
import { QCM } from './geometrieQcm.js';
for (const [id, q] of Object.entries(QCM)) {
  assert.ok(q.q && q.expl && q.indice, `${id} : champs manquants`);
  assert.ok(q.options.length >= 3 && q.options.length <= 4, `${id} : nombre d'options`);
  assert.equal(q.bonne, 0);
  const L = q.options.map(o => o.length), bonne = L[q.bonne], min = Math.min(...L), max = Math.max(...L);
  if (max - min > 1) assert.ok(bonne > min && bonne < max, `${id} : la bonne réponse (${bonne}) est la plus ${bonne === max ? 'longue' : 'courte'} (${L})`);
  assert.equal(new Set(q.options).size, q.options.length, `${id} : options en double`);
}
console.log('geometrieQcm : OK');
