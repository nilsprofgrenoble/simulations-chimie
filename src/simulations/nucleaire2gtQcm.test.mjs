// Contrôle des QCM du parcours de la simulation 203 : 4 options distinctes, la bonne réponse n'est jamais la plus longue ni systématiquement la plus courte,
// explication et indice présents, espaces insécables avant les unités. node src/simulations/nucleaire2gtQcm.test.mjs
import { QCM } from './nucleaire2gtQcm.js';
let n = 0, plusCourtes = 0;
for (const [k, q] of Object.entries(QCM)) {
  const L = q.options.map(o => o.length), bonne = L[q.bonne];
  if (new Set(q.options).size !== q.options.length) { console.error('options identiques :', k); process.exit(1); }
  if (q.options.length !== 4) { console.error('il faut 4 options :', k); process.exit(1); }
  if (bonne >= Math.max(...L) && new Set(L).size > 1) { console.error('la bonne réponse est la plus longue :', k, L); process.exit(1); }
  if (bonne <= Math.min(...L) && new Set(L).size > 1) plusCourtes++;
  if (!q.expl || !q.indice) { console.error('explication ou indice manquant :', k); process.exit(1); }
  if (/\d [°%]|\d (kg|nm|cm|mm)\b/.test(JSON.stringify(q))) { console.error('espace ordinaire avant une unité :', k); process.exit(1); }
  if (/ \/ |\^|_/.test(q.q + q.options.join(''))) { console.error('notation brute :', k); process.exit(1); }
  n++;
}
if (plusCourtes > n / 2) { console.error(`la bonne réponse est la plus courte trop souvent : ${plusCourtes}/${n}`); process.exit(1); }
console.log(`nucleaire2gtQcm : ${n} QCM contrôlés (bonne réponse la plus courte : ${plusCourtes})`);
