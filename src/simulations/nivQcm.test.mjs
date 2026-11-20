// Contrôle des QCM de la simulation 165 : node src/simulations/photonQcm.test.mjs
// (longueur des options : la bonne réponse n'est ni toujours la plus longue ni toujours la plus courte ; position après mélange répartie)
import assert from 'node:assert/strict';
import { QCM, ETAPE_QCM } from './nivQcm.js';
function ordreOptions(n, graine) {   // copie de commun.jsx
  let x = (graine + 1) * 2654435761 % 4294967296;
  const alea = () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; };
  const ordre = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(alea() * (i + 1)); [ordre[i], ordre[j]] = [ordre[j], ordre[i]]; }
  return ordre;
}
const pos = [0, 0, 0, 0]; let plusLongue = 0, plusCourte = 0, n = 0;
for (const [k, q] of Object.entries(QCM)) {
  assert.equal(q.options.length, 4, k); assert.ok(q.indice && q.expl && q.q, k);
  assert.equal(new Set(q.options).size, 4, `${k} : options en double`);
  const L = q.options.map(o => o.length), bonne = L[q.bonne];
  if (bonne === Math.max(...L)) plusLongue++; if (bonne === Math.min(...L)) plusCourte++; n++;
  assert.ok(Math.max(...L) <= 1.35 * Math.min(...L), `${k} : longueurs trop différentes ${L}`);
  const ordre = ordreOptions(4, ETAPE_QCM[k]); pos[ordre.indexOf(q.bonne)]++;
}
console.log('positions de la bonne réponse (1 à 4) :', pos.join(' '), '| plus longue :', plusLongue, '/', n, '| plus courte :', plusCourte, '/', n);
assert.ok(Math.max(...pos) <= 2 && Math.min(...pos) >= 1, 'positions mal réparties');
assert.ok(plusLongue <= 2 && plusCourte <= 2, 'la bonne réponse est trop souvent la plus longue ou la plus courte');
console.log('nivQcm : OK');
