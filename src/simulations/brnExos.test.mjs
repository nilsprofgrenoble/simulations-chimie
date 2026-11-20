// Test de l'exercice « calcul » (sim 188) : node src/simulations/brnExos.test.mjs
// Relit le texte AFFICHÉ de chaque question, refait le calcul avec les seuls nombres écrits (indépendamment du modèle), le compare à la réponse attendue
// sur des milliers de tirages ; les pièges restent différents de la bonne réponse et il en reste au moins 2 par question.
import assert from 'node:assert/strict';
import { tirageCalcul } from './brnExos.js';
import { TOUTES_ESPECES, lireFormule } from './brnModele.js';
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const r = mulberry(188), tire = t => t[Math.floor(r() * t.length)];
const VAL = { H: 1, C: 4, N: 5, O: 6 };
const nTtexte = f => { const { atomes, charge } = lireFormule(f); return Object.entries(atomes).reduce((t, [el, k]) => t + k * VAL[el], 0) - charge; };
const trouve = t => TOUTES_ESPECES.filter(e => t.includes(e.formule)).sort((a, b) => b.formule.length - a.formule.length)[0];
const vus = new Set(); let minPieges = 9;
for (let k = 0; k < 20000; k++) {
  const ex = tirageCalcul(tire), [q1, q2, q3, q4] = ex.questions;
  for (const q of ex.questions) {
    assert.ok(q.pieges.length >= 2, `${q.id} : moins de 2 pièges`); minPieges = Math.min(minPieges, q.pieges.length);
    for (const [v, m] of q.pieges) { assert.ok(Number.isFinite(v) && v !== q.vrai, `${q.id} : piège égal à la bonne réponse ou infini`); assert.ok(typeof m === 'string' && m.length > 10, 'piège sans message'); }
    const tout = q.q + q.expl + q.aide + q.pieges.map(p => p[1]).join('');
    assert.ok(!/\b(de|d’) ?(eau|ion|acide|ammoniac|éthyl|méthyl)/i.test(tout) && !/Lewis de (eau|ion|acide|ammoniac|méthylamine)/.test(tout), `${q.id} : élision ou article absent : ${q.q}`);
    assert.ok(!/÷|\^/.test(tout) && !/frac\([^)]*_/.test(tout) && !/_/.test(q.q), `${q.id} : caractère interdit : ${q.q}`);
    assert.ok(/\S/.test(q.expl) && /\S/.test(q.aide), 'explication ou aide vide');
  }
  // q1 : n_T de l'espèce nommée dans l'énoncé
  let e = trouve(q1.q.split(' ? ')[0].replace('Combien d’électrons de valence faut-il répartir au total dans le schéma de Lewis de ', '')); assert.ok(e, 'q1 espèce'); assert.equal(nTtexte(e.formule), q1.vrai, `q1 ${e.formule}`);
  assert.ok(new RegExp(`= ${q1.vrai} électrons\\.$`).test(q1.expl), `q1 expl ${q1.expl}`); vus.add('1' + e.id);
  // q2 : n_D
  e = trouve(q2.q.replace('Combien de doublets d’électrons faut-il répartir dans le schéma de Lewis de ', '').split(' ? ')[0]); assert.ok(e, 'q2 espèce'); assert.equal(nTtexte(e.formule) / 2, q2.vrai, `q2 ${e.formule}`);
  assert.ok(Number.isInteger(q2.vrai) && q2.expl.endsWith(`${q2.vrai} doublets.`), 'q2 expl'); vus.add('2' + e.id);
  // q3 : doublets non liants = n_D − liants (le nombre de liants est écrit dans l'énoncé)
  e = trouve(q3.q.split(' comporte ')[0]); const b = Number(/comporte (\d+) doublets liants/.exec(q3.q)[1]); assert.equal(nTtexte(e.formule) / 2 - b, q3.vrai, `q3 ${e.formule}`); assert.ok(q3.vrai >= 1, 'q3 positif');
  assert.ok(q3.expl.endsWith(`= ${q3.vrai}.`), 'q3 expl'); vus.add('3' + e.id);
  // q4 : charge conservée dans l'équation écrite
  const m = /acide-base (.+), la charge/.exec(q4.q)[1], [gauche, droite] = m.split(' → '), somme = s => s.split(' + ').reduce((t, x) => { const c = /^(\d+) /.exec(x), n = c ? +c[1] : 1, f = x.replace(/^\d+ /, ''); return t + (f.includes('(?)') ? 0 : n * lireFormule(f).charge); }, 0);
  const inconnu = droite.split(' + ').find(x => x.includes('(?)')); assert.ok(inconnu && !/[⁺⁻]/.test(inconnu), 'q4 inconnue sans charge');
  assert.equal(somme(gauche) - somme(droite), q4.vrai, `q4 ${m}`);
  const forme = inconnu.replace('(?)', ''), candidats = TOUTES_ESPECES.filter(x => x.formule.replace(/[²³]?[⁺⁻]$/, '') === forme && x.charge === q4.vrai); assert.ok(candidats.length >= 1, `q4 : aucune espèce ${forme} de charge ${q4.vrai}`);
  assert.ok([-2, -1, 0, 1].includes(q4.vrai), 'q4 charge hors plage');
}
assert.ok(vus.size > 30, `peu de variété : ${vus.size}`);
console.log(`brnExos : 20 000 tirages OK (pièges restants au minimum : ${minPieges} par question ; espèces vues : ${vus.size})`);
