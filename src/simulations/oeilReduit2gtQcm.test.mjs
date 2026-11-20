// Contrôle des QCM du parcours : la bonne réponse n'est jamais la plus longue ; 4 options distinctes ; node src/simulations/oeilReduit2gtQcm.test.mjs
import { QCM } from './oeilReduit2gtQcm.js';
let n = 0, plusCourtes = 0;
for (const [k, q] of Object.entries(QCM)) {
  const L = q.options.map(o => o.length), bonne = L[q.bonne];
  if (new Set(q.options).size !== q.options.length) { console.error('options identiques :', k); process.exit(1); }
  if (q.options.length !== 4) { console.error('il faut 4 options :', k); process.exit(1); }
  if (bonne >= Math.max(...L) && new Set(L).size > 1) { console.error('la bonne réponse est la plus longue :', k, L); process.exit(1); }
  if (bonne <= Math.min(...L) && new Set(L).size > 1) plusCourtes++;
  if (!q.expl || !q.indice) { console.error('explication ou indice manquant :', k); process.exit(1); }
  n++;
}
if (plusCourtes > n / 2) { console.error(`la bonne réponse est la plus courte trop souvent : ${plusCourtes}/${n}`); process.exit(1); }
console.log(`oeilReduit2gtQcm : ${n} QCM contrôlés (bonne réponse la plus courte : ${plusCourtes})`);
