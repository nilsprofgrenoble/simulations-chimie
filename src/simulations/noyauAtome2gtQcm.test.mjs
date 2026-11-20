// Contrôle des QCM du parcours : 4 options distinctes, bonne réponse jamais strictement la plus longue, pas trop souvent la plus courte, indice et explication présents.
// node src/simulations/noyauAtome2gtQcm.test.mjs
import { QCM, ZAX_CHOIX } from './noyauAtome2gtQcm.js';
let n = 0, courtes = 0;
const echec = m => { console.error(m); process.exit(1); };
for (const [k, q] of Object.entries(QCM)) {
  const L = q.options.map(o => o.length), bonne = L[q.bonne], autres = L.filter((_, i) => i !== q.bonne);
  if (new Set(q.options).size !== q.options.length || q.options.length !== 4) echec(`options : ${k}`);
  if (bonne > Math.max(...autres)) echec(`la bonne réponse est la plus longue : ${k} ${L}`);
  if (bonne < Math.min(...autres)) courtes++;
  if (!q.expl || !q.indice) echec(`explication ou indice manquant : ${k}`);
  if (/ ( ?[°%]| (m|kg|C|km|cm)\b)/.test(q.options.join('|') + q.expl + q.indice + q.q) && /\d [°%]|\d (m|kg|C|km|cm)\b/.test(q.options.join('|') + q.expl + q.indice + q.q)) echec(`espace ordinaire avant une unité : ${k}`);
  n++;
}
if (courtes > n / 2) echec(`la bonne réponse est la plus courte trop souvent : ${courtes}/${n}`);
if (ZAX_CHOIX.length !== 4 || new Set(ZAX_CHOIX.map(c => c.slice(0, 3).join())).size !== 4) echec('ZAX_CHOIX');
if (ZAX_CHOIX.filter(([A, Z, s]) => A === 14 && Z === 7 && s === 'N').length !== 1) echec('ZAX_CHOIX : une seule bonne réponse');
console.log(`noyauAtome2gtQcm : ${n} QCM contrôlés (bonne réponse strictement la plus courte : ${courtes})`);
