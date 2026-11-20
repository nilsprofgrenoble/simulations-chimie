// Contrôle de la famille REA « str-calcul » : node src/simulations/strExos.test.mjs
// On relit le TEXTE AFFICHÉ, on refait le calcul avec les seuls nombres écrits, on compare à la réponse attendue et à la correction ; pire cas d'arrondi à 2 chiffres significatifs ;
// pièges hors tolérance (> 8 %) ; QCM : la bonne réponse n'est jamais la plus longue ni toujours la plus courte (parcours, ANA, VAL, S'APP de la sim 210).
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { tirageCalcul } from './strExos.js';
import { QCM_PARCOURS } from './strQcm.js';

const tire = t => t[Math.floor(Math.random() * t.length)];
const num = s => Number(String(s).replace(/\s/g, '').replace(',', '.').replace('−', '-'));
const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
const sig = (x, k) => Number(Number(x).toPrecision(k));
const nombres = t => [...t.matchAll(/(\d+(?:,\d+)?)\s*(?:%|(?:mol|kg|g)\b)/g)].map(m => num(m[1]));
const pire = [0, 0, 0, 0];
for (let i = 0; i < 6000; i++) {
  const ex = tirageCalcul(tire), [q1, q2, q3, q4] = ex.questions;
  for (const q of ex.questions) { assert.ok(q.tolRel >= 0.05); assert.ok(q.pieges.length >= 1, q.id + ' : aucun piège'); for (const [v] of q.pieges) assert.ok(rel(v, q.vrai) > 0.08, `${q.id} : piège ${v} trop proche de ${q.vrai}`); assert.ok(!/[_÷^]|\s\/\s/.test(q.q + q.expl + q.aide), 'caractère interdit'); }
  let n = nombres(q1.q); assert.ok(rel(n[0] * n[1] / 100, q1.vrai) < 1e-9, 'q1'); for (const k of [2, 3]) pire[0] = Math.max(pire[0], rel(sig(sig(n[0] / 100, k) * sig(n[1] / 100, k) * 100, 2), q1.vrai));
  n = nombres(q2.q); assert.ok(rel(n[0] * n[1] * n[2] / 10000, q2.vrai) < 1e-9, 'q2'); pire[1] = Math.max(pire[1], rel(sig(sig(n[0] * n[1] / 100, 2) * n[2] / 100, 2), q2.vrai));
  n = nombres(q3.q); assert.ok(rel(n[0] * n[1] * n[2] / 10000, q3.vrai) < 1e-9, 'q3'); pire[2] = Math.max(pire[2], rel(sig(sig(n[0] * n[1] / 100, 2) * n[2] / 100, 2), q3.vrai));
  n = nombres(q4.q); assert.ok(rel((n[0] + n[1]) * n[3], q4.vrai) < 1e-9, 'q4 ' + q4.q); pire[3] = Math.max(pire[3], rel(sig((n[0] + n[1]), 2) * n[3], q4.vrai));
  // la correction écrit le bon résultat
  const fin = (t, u) => { const m = [...t.matchAll(new RegExp(`(\\d+(?:,\\d+)?)${' '}?${u}`, 'g'))]; return num(m[m.length - 1][1]); };
  assert.ok(rel(fin(q1.expl, '%'), q1.vrai) < 0.006 && rel(fin(q2.expl, '%'), q2.vrai) < 0.006 && rel(fin(q3.expl, 'mol'), q3.vrai) < 0.006 && rel(fin(q4.expl, 'g'), q4.vrai) < 0.006, 'correction : ' + q1.expl + q2.expl + q3.expl + q4.expl);
}
pire.forEach((p, k) => assert.ok(p < (k === 2 ? 0.06 : 0.05), `question ${k + 1} : pire écart d’arrondi ${p}`));
console.log('REA str-calcul : 6000 tirages OK, pire arrondi', pire.map(p => (100 * p).toFixed(1) + ' %').join(' / '));

// QCM
const longueurs = (opts, bonne) => { const L = opts.map(o => o.length); return { bon: L[bonne], plusLong: Math.max(...L), plusCourt: Math.min(...L) }; };
const stats = [];
const verifQcm = (nom, opts, bonne) => { const { bon, plusLong, plusCourt } = longueurs(opts, bonne); assert.ok(bon < plusLong, `${nom} : la bonne réponse est la plus longue (ou à égalité)`); stats.push({ nom, plusCourt: bon <= plusCourt }); };
for (const [k, q] of Object.entries(QCM_PARCOURS)) verifQcm('parcours.' + k, q.options, q.bonne);
const serveur = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', root: new URL('../..', import.meta.url).pathname });
try {
  const texte = n => renderToStaticMarkup(n).replace(/<[^>]*>/g, '');
  const ana = await serveur.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const val = await serveur.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const don = await serveur.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js');
  const rea = await serveur.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const A = ana.PREVOIR.filter(e => /^str-/.test(e.id)); assert.ok(A.length >= 2, 'ANA str- absents');
  for (const e of A) { verifQcm(e.id, e.options.map(o => texte(o[0])), e.options.findIndex(o => o[1])); assert.ok(!/[_÷^]/.test(e.enonce + e.q), e.id); }
  const Vs = val.PLAUSIBLES.filter(e => /^str-/.test(e.id)); assert.ok(Vs.length >= 2, 'VAL str- absents');
  for (const e of Vs) { verifQcm(e.id, e.options.map(o => texte(o[0])), e.options.findIndex(o => o[1])); assert.ok(!/[_÷^]/.test(e.enonce + e.q2), e.id); }
  const S = don.ENONCES.filter(e => /^str-/.test(e.id)); assert.equal(S.length, 2, 'S’APP str-');
  for (const e of S) for (let i = 0; i < 400; i++) { const p = e.gen(); for (const q of [0, 1]) { const b = e.build(p, q); verifQcm(e.id + '.cherche', [b.cherche.bonne, ...b.cherche.faux], 0); assert.ok(isFinite(b.solution.val) && b.solution.val > 0); } }
  const fam = rea.FAMILLES.find(f => f.id === 'str-calcul'); assert.ok(fam, 'famille str-calcul absente');
  for (let i = 0; i < 300; i++) { const ex = fam.gen(); assert.equal(ex.questions.length, 4); for (const q of ex.questions) assert.ok(texte(q.expl).length > 10); }
  assert.ok(stats.some(s => !s.plusCourt), 'la bonne réponse est toujours la plus courte');
  console.log(`QCM : ${stats.length} contrôles, bonne réponse jamais la plus longue ; pas systématiquement la plus courte (${stats.filter(s => !s.plusCourt).length} cas). OK`);
} finally { await serveur.close(); }
