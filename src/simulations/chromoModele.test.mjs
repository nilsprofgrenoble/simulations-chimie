// node src/simulations/chromoModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './chromoModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
// λmax des polyènes : croissant, passe par les ancres, borné
for (let k = 1; k < 11; k += 0.5) ok(M.lamPolyene(k + 0.5) > M.lamPolyene(k), 'croissance ' + k);
for (const [k, l] of M.ANCRES) ok(M.lamPolyene(k) === l, 'ancre ' + k);
ok(M.lamPolyene(20) === 450 && M.lamPolyene(0) === 170, 'bornes');
ok(Math.abs(M.decalageMoyen(2, 6) - 36.75) < 1e-9, 'décalage moyen 2 → 6');
ok(M.epsPolyene(2) === 22000 && M.epsPolyene(11) === 130000, 'ε polyène');
// couleurs : un polyène court est incolore, le β-carotène est jaune-orangé, un absorbant bleu est jaune
const rgb = l => M.rvbSolution(l);
for (const n2 of [1, 2, 3, 4]) ok(M.estIncolore(M.lamPolyene(n2)), 'incolore n=' + n2);
ok(!M.estIncolore(M.lamPolyene(11)), 'β-carotène coloré');
for (const n2 of [1, 2, 3]) { const c = rgb(M.lamPolyene(n2)); ok(Math.min(...c) >= 250, 'quasi blanc ' + n2 + ' ' + c); }
{ const [r, g, b] = rgb(455); ok(r > 200 && g > 150 && b < 120, 'bleu absorbé → jaune ' + [r, g, b]); }
{ const [r, g, b] = rgb(530); ok(r > g + 60 && b > g + 60, 'vert absorbé → pourpre ' + [r, g, b]); }
{ const [r, g, b] = rgb(595); ok(b > r + 40, 'jaune absorbé → bleu ' + [r, g, b]); }
{ const [r, g, b] = rgb(650); ok(r < g && r < b, 'rouge absorbé → bleu-vert ' + [r, g, b]); }
{ const [r, g, b] = rgb(400); ok(r > 200 && g > 200 && b < Math.min(r, g) - 60, '4-nitrophénolate jaune ' + [r, g, b]); }
{ const [r, g, b] = rgb(M.MOLS.nitrophenol.lam); ok(Math.min(r, g, b) > 200, '4-nitrophénol très pâle ' + [r, g, b]); }
// complémentaires : table sans trou entre 380 et 780
for (let l = 380; l < 780; l += 1) ok(M.zone(l) !== null, 'zone ' + l);
ok(M.zone(380).abs === 'violet' && M.zone(450).vue === 'jaune' && M.zone(530).vue === 'pourpre' && M.couleurPercue(300) === 'incolore', 'table');
// effets
for (const [a, b, el, ee] of [['benzene', 'phenol', 'bathochrome', 'hyperchrome'], ['phenol', 'phenolate', 'bathochrome', 'hyperchrome'], ['aniline', 'anilinium', 'hypsochrome', 'hypochrome'], ['nitrophenol', 'nitrophenolate', 'bathochrome', 'hyperchrome'], ['transstil', 'cisstil', 'hypsochrome', 'hypochrome'], ['phenolate', 'phenol', 'hypsochrome', 'hypochrome']]) {
  ok(M.effetLambda(M.MOLS[a].lam, M.MOLS[b].lam) === el, a + '→' + b + ' λ'); ok(M.effetEps(M.MOLS[a].eps, M.MOLS[b].eps) === ee, a + '→' + b + ' ε');
}
// tirages : réponses non ambiguës
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 2000; i++) {
  const d = M.tirageDefiCouleur(rnd); ok(M.COULEURS_VUES.includes(d.vue), 'couleur vue ' + d.vue);
  const e = M.tirageDefiEffet(rnd); ok(e.dl !== 'aucun' && e.de !== 'aucun', 'effet net'); ok(Math.abs(e.a.lam - e.b.lam) > 12 && Math.max(e.a.eps / e.b.eps, e.b.eps / e.a.eps) > 1.5, 'écart net');
}
// A = ε l c
ok(Math.abs(M.absorbance(18000, 1, 5e-5) - 0.9) < 1e-12, 'Beer-Lambert');
// spectre : maximum à λmax
{ const s = M.spectreEps(400, 18000, 1); const mx = s.reduce((a, b) => (b[1] > a[1] ? b : a)); ok(mx[0] === 400 && Math.abs(mx[1] - 18000) < 1e-6, 'max du spectre'); }
console.log(`Modèle sim 303 : ${n} vérifications réussies.`);
