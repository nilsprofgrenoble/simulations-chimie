// Contrôle de la famille REA « chc-calcul » : node src/simulations/chcExos.test.mjs
// On relit le TEXTE AFFICHÉ, on refait le calcul avec les seuls nombres écrits, on compare à la réponse attendue et à la correction ; pire cas d'arrondi à 2 chiffres significatifs ;
// pièges hors tolérance (> 8 %) ; QCM : la bonne réponse n'est jamais la plus longue ni toujours la plus courte (parcours, ANA, VAL, S'APP de la sim 241).
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { tirageCalcul } from './chcExos.js';
import { QCM_PARCOURS } from './chcQcm.js';

const tire = t => t[Math.floor(Math.random() * t.length)];
const num = s => Number(String(s).replace(/\s/g, '').replace(',', '.').replace('−', '-'));
const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
const sig = (x, k) => Number(Number(x).toPrecision(k));
const nombres = t => [...t.matchAll(/(\d+(?:,\d+)?)\s*(?:%|(?:mol|kg|g)\b)/g)].map(m => num(m[1]));
const pire = [0, 0, 0, 0];
const fin = (t, u) => { const m = [...t.matchAll(new RegExp(`(\\d+(?:,\\d+)?)\u00a0?${u}`, 'g'))]; return num(m[m.length - 1][1]); };
for (let i = 0; i < 6000; i++) {
  const ex = tirageCalcul(tire), [q1, q2, q3, q4] = ex.questions;
  for (const q of ex.questions) { assert.ok(q.tolRel >= 0.05); assert.ok(q.pieges.length >= 1, q.id + ' : aucun piège'); for (const [v] of q.pieges) assert.ok(rel(v, q.vrai) > 0.08, `${q.id} : piège ${v} trop proche de ${q.vrai}`); assert.ok(!/[_^÷]/.test(q.q), q.id + ' symbole interdit'); }
  let n = [...q1.q.matchAll(/(\d+)\u00a0atomes/g)].map(m => Number(m[1])); assert.equal(n[0] + n[1], q1.vrai, 'q1');
  n = nombres(q2.q); assert.ok(rel(n[0] * n[1] * n[2] / 10000, q2.vrai) < 1e-9, 'q2'); pire[1] = Math.max(pire[1], rel(sig(sig(n[0] * n[1] / 100, 2) * n[2] / 100, 2), q2.vrai));
  const m3 = [...q3.q.matchAll(/(\d+(?:,\d+)?)\u00a0(%|mol)/g)].map(m => num(m[1])); assert.ok(rel(m3[0] * m3[1] * m3[2] / 10000 * 74.1, q3.vrai) < 1e-9, 'q3'); pire[2] = Math.max(pire[2], rel(sig(sig(m3[0] * m3[1] / 100, 2) * m3[2] / 100, 2) * 74.1, q3.vrai));
  const m4 = [...q4.q.matchAll(/(\d+(?:,\d+)?)\u00a0(%|g)\b/g)].map(m => num(m[1])); // masse visée, rendements
  const mass = m4.find(x => x < 20 && x !== 74.1), rr = [...q4.q.matchAll(/(\d+)\u00a0%/g)].map(m => Number(m[1]));
  assert.ok(rel(mass / 74.1 / (rr[0] * rr[1] / 10000) * 109, q4.vrai) < 1e-9, 'q4 ' + q4.q); pire[3] = Math.max(pire[3], rel(sig(sig(mass / 74.1, 2) / sig(rr[0] * rr[1] / 10000, 2), 2) * 109, q4.vrai));
  assert.ok(rel(fin(q2.expl, '%'), q2.vrai) < 0.006 && rel(fin(q3.expl, 'g'), q3.vrai) < 0.006 && rel(fin(q4.expl, 'g'), q4.vrai) < 0.006, 'correction');
}
pire.forEach((p, k) => assert.ok(p < (k >= 2 ? 0.06 : 0.05), `question ${k + 1} : pire écart d’arrondi ${p}`));
console.log('REA chc-calcul : 6000 tirages OK, pire arrondi', pire.map(p => (100 * p).toFixed(1) + ' %').join(' / '));

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
  const A = ana.PREVOIR.filter(e => /^chc-/.test(e.id)); assert.ok(A.length >= 2, 'ANA chc- absents');
  for (const e of A) { verifQcm(e.id, e.options.map(o => texte(o[0])), e.options.findIndex(o => o[1])); assert.ok(!/[_÷^]/.test(e.enonce + e.q), e.id); }
  const Vs = val.PLAUSIBLES.filter(e => /^chc-/.test(e.id)); assert.ok(Vs.length >= 2, 'VAL chc- absents');
  for (const e of Vs) { verifQcm(e.id, e.options.map(o => texte(o[0])), e.options.findIndex(o => o[1])); assert.ok(!/[_÷^]/.test(e.enonce + e.q2), e.id); }
  const S = don.ENONCES.filter(e => /^chc-/.test(e.id)); assert.equal(S.length, 2, 'S’APP chc-');
  for (const e of S) for (let i = 0; i < 400; i++) { const p = e.gen(); for (const q of [0, 1]) { const b = e.build(p, q); verifQcm(e.id + '.cherche', [b.cherche.bonne, ...b.cherche.faux], 0); assert.ok(isFinite(b.solution.val) && b.solution.val > 0); } }
  const fam = rea.FAMILLES.find(f => f.id === 'chc-calcul'); assert.ok(fam, 'famille chc-calcul absente');
  for (let i = 0; i < 300; i++) { const ex = fam.gen(); assert.equal(ex.questions.length, 4); for (const q of ex.questions) assert.ok(texte(q.expl).length > 10); }
  assert.ok(stats.some(s => !s.plusCourt), 'la bonne réponse est toujours la plus courte');
  console.log(`QCM : ${stats.length} contrôles, bonne réponse jamais la plus longue ; pas systématiquement la plus courte (${stats.filter(s => !s.plusCourt).length} cas). OK`);
} finally { await serveur.close(); }
