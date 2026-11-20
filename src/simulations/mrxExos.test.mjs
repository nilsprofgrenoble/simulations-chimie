// Test de l'exercice « calcul » (sim 186) : node src/simulations/mrxExos.test.mjs
// Relit le texte AFFICHÉ de chaque question, refait le calcul et le compare à la réponse attendue, sur des milliers de tirages.
import assert from 'node:assert/strict';
import { tirageCalcul } from './mrxExos.js';

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const r = mulberry(186), tire = t => t[Math.floor(r() * t.length)];
const num = s => Number(s.replace(',', '.').replace('−', '-'));
const vus = new Set();
for (let k = 0; k < 20000; k++) {
  const ex = tirageCalcul(tire), [q1, q2, q3, q4] = ex.questions;
  for (const q of ex.questions) {
    assert.ok(typeof q.q === 'string' && !/[_^]|\bundefined\b|NaN/.test(q.q + q.expl + q.aide), 'texte : ' + q.q);
    assert.ok(q.tolRel >= 0.05 || q.id === 'mx0', `${q.id} : tolérance`);
    assert.ok(!/÷/.test(q.q + q.expl + q.aide + q.pieges.map(x => x[1]).join(' ')), 'pas de ÷');
    const seuil = Math.max(1.5 * q.tolRel, 0.02);
    for (const [v, m] of q.pieges) { assert.ok(Math.abs(v - q.vrai) > seuil * Math.abs(q.vrai), `${q.id} : piège dans la tolérance (${v} pour ${q.vrai})`); assert.ok(m.length > 20); }
    assert.ok(q.pieges.length >= 2, `${q.id} : pas assez de pièges`);
  }
  // 1. atomes d'un élément dans les réactifs : relus dans l'équation AFFICHÉE avec un lecteur de formules indépendant du modèle
  let m = q1.q.match(/l’acte élémentaire (.*)\. Combien d’atomes (d’hydrogène|d’oxygène|de carbone) y a-t-il/); assert.ok(m, q1.q);
  const el = { 'd’hydrogène': 'H', 'd’oxygène': 'O', 'de carbone': 'C' }[m[2]], gauche = m[1].split(' → ')[0];
  const SUB = { '₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9 };
  const compte = terme => { const coef = (terme.match(/^(\d+)\u00a0/) || [0, 1])[1]; const f = terme.replace(/^\d+\u00a0/, '').replace(/[⁺⁻]$/, ''); let n = 0; for (const x of f.matchAll(/([A-Z][a-z]?)([₀-₉]*)/g)) if (x[1] === el) n += x[2] ? [...x[2]].reduce((t, c) => t * 10 + SUB[c], 0) : 1; return Number(coef) * n; };
  assert.equal(gauche.split(' + ').reduce((t, x) => t + compte(x), 0), q1.vrai, q1.q); vus.add(q1.q.split('.')[0]);
  assert.ok(q1.vrai >= 2 && q1.vrai <= 9);
  const droite = m[1].split(' → ')[1]; assert.equal(droite.split(' + ').reduce((t, x) => t + compte(x), 0), q1.vrai, 'atomes conservés dans l’acte affiché : ' + m[1]);
  // 2. chocs efficaces par seconde
  m = q2.q.match(/(\d+,\d)\s*chocs par seconde.*; (\d+)\s*% de ces chocs/); assert.ok(m, q2.q);
  assert.ok(Math.abs(num(m[1]) * Number(m[2]) / 100 - q2.vrai) < 1e-9, q2.q);
  assert.ok(Math.abs(Number(q2.vrai.toFixed(2)) - q2.vrai) < 1e-9, 'valeur exacte à 2 décimales');
  assert.ok(q2.expl.includes(String(q2.vrai.toFixed(2)).replace('.', ',')), 'corrigé : ' + q2.expl);
  // 3. part efficace
  m = q3.q.match(/Pendant (\d+)\s*s, on compte (\d+)\s*chocs entre A et B, dont (\d+)\s*chocs efficaces/); assert.ok(m, q3.q);
  assert.ok(Number.isInteger(Number(m[3])) && Math.abs(100 * Number(m[3]) / Number(m[2]) - q3.vrai) < 1e-9, q3.q);
  // 4. dioxygène
  m = q4.q.match(/entièrement (\d+,\d\d)\s*mol de H₂O₂/); assert.ok(m, q4.q);
  assert.ok(Math.abs(num(m[1]) / 2 - q4.vrai) < 1e-9, q4.q);
  assert.ok(q4.expl.includes(String(q4.vrai.toFixed(2)).replace('.', ',')), q4.expl);
}
assert.ok(vus.size >= 8, 'actes variés tirés : ' + vus.size);
// pire cas d'arrondi à 2 chiffres significatifs (valeurs numériques 2 à 4) : tolérance 5 % ≥ écart relatif maximal
const pire = (v) => { const e = Math.floor(Math.log10(Math.abs(v))) - 1, pas = 10 ** e; return (pas / 2) / Math.abs(v); };
for (const v of [0.10, 0.15, 0.24, 0.25, 0.36, 0.5, 0.3, 0.96, 1.5, 2.5, 5, 12, 25, 20, 10, 8, 0.2, 0.8]) assert.ok(pire(v) <= 0.05 + 1e-12, `arrondi 2 CS de ${v}`);
console.log('mrxExos : OK (20 000 tirages relus : atomes d’un acte, chocs efficaces, part efficace, dioxygène ; tolérances et pièges)');
