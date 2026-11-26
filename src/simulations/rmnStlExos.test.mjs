// Contrôle des exercices de la simulation 306 (RMN du proton, STL) : node src/simulations/rmnStlExos.test.mjs
// REA « rmn-int » et S'APP « rmns-sapp-integration » : on refait le calcul avec les seuls nombres du modèle, on contrôle les pièges, les réponses distinctes et les QCM (ANA, VAL).
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { MOL } from './rmnStlModele.js';
import { RMNS_ANA, RMNS_VAL, RMNS_SAPP } from './rmnStlExos.js';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { FAMILLES } = await vite.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
const fam = FAMILLES.find(f => f.id === 'rmn-int');
assert.ok(fam, 'famille rmn-int introuvable');
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); };
for (let i = 0; i < 4000; i++) {
  const ex = fam.gen(), qs = ex.questions;
  ok(qs.length === 4, 'quatre questions');
  const ids = new Set(qs.map(q => q.id)); ok(ids.size === 4, 'identifiants distincts');
  for (const q of qs) { ok(q.tolRel > 0 && q.vrai > 0, `${q.id} : vrai ou tolérance`); ok(q.pieges.length >= 1, `${q.id} : aucun piège`); for (const [v] of q.pieges) ok(Math.abs(v - q.vrai) > 0.02 * q.vrai, `${q.id} : piège dans la tolérance`); }
  const [h, a, b, c] = qs; ok(Number.isInteger(a.vrai) && Number.isInteger(b.vrai) && Number.isInteger(c.vrai), 'réponses entières');
  ok(a.vrai !== b.vrai, 'deux signaux de même nombre de H');
  // la hauteur totale annoncée est la somme des paliers écrits dans l'intro : nombres « x mm »
  const paliers = [...ex.intro.matchAll(/(\d+,\d) mm/g)].map(m => Number(m[1].replace(',', '.')));
  ok(Math.abs(paliers.reduce((s, v) => s + v, 0) - h.vrai) < 0.11, 'H = somme des paliers écrits');
  const N = Number(ex.intro.match(/\((\d+) H au total\)/)[1]);
  // les nombres de H recalculés avec les paliers écrits redonnent la réponse entière
  const dd = [...ex.intro.matchAll(/δ = (\d+,\d+) ppm/g)].map(m => Number(m[1].replace(',', '.')));
  const mol = Object.values(MOL).find(m => m.N === N && m.liste.length === paliers.length && m.liste.every((x, j) => Math.abs(x.d - dd[j]) < 0.006));
  ok(mol, 'molécule retrouvée');
  for (let j = 0; j < paliers.length; j++) ok(Math.abs(N * paliers[j] / h.vrai - mol.liste[j].n) < 0.3, `intégration non cohérente (signal ${j})`);
}
// S'APP : tokens utiles présents, réponse entière, hauteurs cohérentes
const sapp = RMNS_SAPP[0];
for (let i = 0; i < 4000; i++) {
  const p = sapp.gen();
  for (const q of [0, 1]) {
    const b = sapp.build(p, q);
    ok(b.utiles.every(k => b.tokens[k]), 'token utile manquant');
    ok(Object.keys(b.tokens).every(k => b.utiles.includes(k) || b.raisons[k]), 'token sans raison');
    ok(b.solution.val > 0, 'solution');
  }
  const m = MOL[p.id], H = p.h.reduce((s, v) => s + v, 0);
  ok(Math.abs(m.N * p.h[p.i] / H - m.liste[p.i].n) < 0.3, 'palier cohérent');
}
// ANA et VAL : une seule bonne réponse, la bonne n'est pas la plus longue, identifiants uniques
const tous = [...RMNS_ANA, ...RMNS_VAL];
ok(new Set(tous.map(e => e.id)).size === tous.length, 'identifiants uniques');
for (const e of RMNS_ANA) { ok(e.options.filter(o => o[1]).length === 1, `${e.id} : une seule bonne réponse`); const L = e.options.map(o => o[0].length), bonne = e.options.find(o => o[1])[0].length; ok(bonne < Math.max(...L), `${e.id} : la bonne réponse est la plus longue`); }
for (const e of RMNS_VAL) { ok(e.options.filter(o => o[1]).length === 1, `${e.id} : une seule bonne réponse`); const L = e.options.map(o => o[0].length), bonne = e.options.find(o => o[1])[0].length; ok(bonne < Math.max(...L), `${e.id} : la bonne réponse est la plus longue`); }
// les groupes de la défi « attribuer » ont des descriptions distinctes
for (const m of Object.values(MOL)) ok(new Set(m.liste.map(x => x.desc)).size === m.liste.length, `${m.id} : descriptions de groupes en double`);
console.log(`rmnStlExos : ${n} vérifications — OK`);
await vite.close();
