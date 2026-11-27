import { BIOT_ANA, BIOT_VAL, BIOT_SAPP } from './biotExos.js';
let n = 0;
const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
for (const e of BIOT_ANA) {
  ok(e.options.filter(o => o[1]).length === 1, e.id + ' une seule bonne option');
  ok(new Set(e.options.map(o => o[0])).size === e.options.length, e.id + ' options distinctes');
  const longest = Math.max(...e.options.map(o => o[0].length));
  ok(e.options.find(o => o[1])[0].length < longest, e.id + ' la bonne option n’est pas la plus longue');
}
console.log('positions des bonnes réponses ANA :', BIOT_ANA.map(e => e.options.findIndex(o => o[1])).join(','));
for (const e of BIOT_VAL) { ok(e.options.filter(o => o[1]).length === 1, e.id + ' VAL une bonne'); ok(e.verdict[0][1] === false, e.id + ' non plausible'); }
for (const e of BIOT_SAPP) {
  for (let i = 0; i < 300; i++) {
    const p = e.gen();
    for (const q of [0, 1]) {
      const b = e.build(p, q);
      ok(b.solution.val > 0 && Number.isFinite(b.solution.val), e.id + ' valeur > 0');
      for (const k of b.utiles) ok(b.tokens[k], e.id + ' jeton utile présent ' + k);
      ok(b.texte.filter(t => t && t.t).every(t => b.tokens[t.t]), e.id + ' tous les jetons du texte définis');
    }
  }
}
// cohérence numérique : S'APP alpha
for (let i = 0; i < 300; i++) { const p = BIOT_SAPP[0].gen(); const a = BIOT_SAPP[0].build(p, 0).solution.val, c = BIOT_SAPP[0].build(p, 1).solution.val; ok(Math.abs(c - p.C) < 0.002, 'C retrouvée ' + c + ' vs ' + p.C); ok(Math.abs(a - p.A * p.Lc / 10 * p.C) < 1e-9, 'alpha'); }
for (let i = 0; i < 300; i++) { const p = BIOT_SAPP[1].gen(); const e0 = BIOT_SAPP[1].build(p, 0).solution.val, e1 = BIOT_SAPP[1].build(p, 1).solution.val; ok(Math.abs(e0 - e1) < 1e-6, 'les deux questions donnent le même e.e. ' + e0 + ' ' + e1); }
console.log(`biotExos OK (${n} vérifications)`);
