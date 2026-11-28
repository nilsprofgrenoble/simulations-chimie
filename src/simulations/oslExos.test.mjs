import { OSL_ANA, OSL_VAL, OSL_SAPP } from './oslExos.js';
let n = 0;
const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
for (const e of OSL_ANA) {
  ok(e.options.filter(o => o[1]).length === 1, e.id + ' une seule bonne option'); ok(new Set(e.options.map(o => o[0])).size === e.options.length, e.id + ' options distinctes');
  ok(e.options.find(o => o[1])[0].length < Math.max(...e.options.map(o => o[0].length)), e.id + ' la bonne option n’est pas la plus longue');
}
console.log('positions des bonnes réponses ANA :', OSL_ANA.map(e => e.options.findIndex(o => o[1])).join(','));
for (const e of OSL_VAL) { ok(e.options.filter(o => o[1]).length === 1, e.id + ' VAL une bonne'); ok(e.verdict[0][1] === false, e.id + ' non plausible'); ok(e.options.find(o => o[1])[0].length < Math.max(...e.options.map(o => o[0].length)), e.id + ' bonne VAL pas la plus longue'); }
console.log('positions VAL :', OSL_VAL.map(e => e.options.findIndex(o => o[1])).join(','));
for (const e of OSL_SAPP) for (let i = 0; i < 300; i++) { const p = e.gen(); for (const q of [0, 1]) { const b = e.build(p, q); ok(b.solution.val > 0 && Number.isFinite(b.solution.val), e.id + ' valeur > 0'); for (const k of b.utiles) ok(b.tokens[k], e.id + ' jeton utile ' + k); ok(b.texte.filter(t => t && t.t).every(t => b.tokens[t.t]), e.id + ' jetons définis'); } }
console.log(`oslExos OK (${n} vérifications)`);
