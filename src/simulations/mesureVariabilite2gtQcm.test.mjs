// Contrôle des QCM du parcours : la bonne réponse n'est jamais la plus longue ; options distinctes ; node src/simulations/mesureVariabilite2gtQcm.test.mjs
import { QCM } from './mesureVariabilite2gtQcm.js';
let n = 0; const rangs = [];
for (const [k, q] of Object.entries(QCM)) {
  const L = q.options.map(o => o.length), bonne = L[q.bonne];
  if (new Set(q.options).size !== q.options.length) { console.error('options identiques :', k); process.exit(1); }
  if (bonne >= Math.max(...L)) { console.error('la bonne réponse est la plus longue :', k, L); process.exit(1); }
  if (!q.expl || !q.indice) { console.error('explication ou indice manquant :', k); process.exit(1); }
  rangs.push([...L].sort((a, b) => a - b).indexOf(bonne));
  n++;
}
if (rangs.every(r => r === 0)) { console.error('la bonne réponse est toujours la plus courte'); process.exit(1); }
console.log(`mesureVariabilite2gtQcm : ${n} QCM contrôlés (rangs de longueur de la bonne réponse : ${rangs.join(' ')})`);
