// Contrôle des QCM du parcours : la bonne réponse n'est jamais la plus longue ; 4 options distinctes ; node src/simulations/syntheseReflux2gtQcm.test.mjs
import { QCM } from './syntheseReflux2gtQcm.js';
let n = 0, bonnesPlusCourtes = 0;
for (const [k, q] of Object.entries(QCM)) {
  const L = q.options.map(o => o.length), bonne = L[q.bonne];
  if (new Set(q.options).size !== q.options.length) { console.error('options identiques :', k); process.exit(1); }
  if (q.options.length !== 4) { console.error('il faut 4 options :', k); process.exit(1); }
  if (bonne >= Math.max(...L) && new Set(L).size > 1) { console.error('la bonne réponse est la plus longue :', k, L); process.exit(1); }
  if (bonne <= Math.min(...L) && new Set(L).size > 1) bonnesPlusCourtes++;
  if (!q.expl || !q.indice) { console.error('explication ou indice manquant :', k); process.exit(1); }
  n++;
}
if (bonnesPlusCourtes > n / 2) { console.error(`la bonne réponse est la plus courte trop souvent : ${bonnesPlusCourtes}/${n}`); process.exit(1); }
console.log(`syntheseReflux2gtQcm : ${n} QCM contrôlés (bonne réponse la plus courte : ${bonnesPlusCourtes})`);
// Espaces insécables : aucun nombre suivi d'une espace ordinaire puis d'une unité
const UNITES = /(\d) (°C|°|nm|%|mm|cm|kg|mol|g|mL|L|min|h|s)(?![\wéèêàùîôç])/;
for (const [k, q] of Object.entries(QCM)) for (const t of [q.q, q.expl, q.indice, ...q.options]) if (UNITES.test(t)) { console.error('espace ordinaire avant une unité :', k, t); process.exit(1); }
console.log('syntheseReflux2gtQcm : espaces insécables avant les unités : ok');
