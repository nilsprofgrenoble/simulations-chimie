// node src/simulations/rdaModele.test.mjs
// Contrôle du modèle de la simulation 184 (radioactivité : diagramme (N, Z) et équations de désintégration).
import assert from 'node:assert/strict';
import * as M from './rdaModele.js';
import { VALLEE } from './rdaVallee.js';

// 1. aucun doublon, éléments connus, bornes de chaque région
const vus = new Set();
for (const n of M.TOUS) { const k = n.slice(0, 2).join(','); assert.ok(!vus.has(k), `doublon ${k}`); vus.add(k); assert.ok(M.ELEMENTS[n[0]], `élément Z = ${n[0]} inconnu`); assert.ok(['s', 'a', 'b-', 'b+'].includes(n[2])); }
for (const R of Object.values(M.REGIONS)) for (const [Z, N] of R.noyaux) assert.ok(Z >= R.Zmin && Z <= R.Zmax && N >= R.Nmin && N <= R.Nmax, `hors cadre ${Z},${N} (${R.id})`);
// 2. noyaux stables légers : 38 noyaux pour Z de 1 à 18 (liste complète de l'AIEA) ; chaque élément a au moins un isotope stable
assert.equal(M.LEGERS.filter(n => n[2] === 's').length, 38);
for (let Z = 1; Z <= 18; Z++) assert.ok(M.isotopesDe(M.LEGERS, Z).some(n => n[2] === 's'), `Z = ${Z} sans noyau stable`);
// 3. fermeture : le fils de chaque noyau radioactif est connu, et la conservation de A et de Z est vérifiée (avec la particule émise)
for (const n of M.radioactifs()) {
  const fn = M.filsDe(n); assert.ok(M.ELEMENTS[fn[0]], `élément du fils de ${M.sym(n[0])}-${M.A(n)} inconnu (Z = ${fn[0]})`);
  const fa = { A: fn[0] + fn[1], Z: fn[0], s: M.sym(fn[0]) };
  const b = M.bilan(M.noyauAZ(n), fa, n[2]); assert.ok(M.conserve(b), `non conservé pour ${M.sym(n[0])}-${M.A(n)}`);
  assert.equal(M.typeDe(M.AZ(n), fa), n[2], 'type retrouvé');
  // pour les noyaux du diagramme, le fils est aussi dans la même région
  for (const R of Object.values(M.REGIONS)) if (R.noyaux.some(m => m[0] === n[0] && m[1] === n[1])) assert.ok(R.noyaux.some(m => m[0] === fn[0] && m[1] === fn[1]), `fils hors région ${n}`);
}
// 4. équations connues
const eq = (Z, N) => { const n = M.trouve(Z, N), f = M.filsDe(n); return M.equationTexte(M.noyauAZ(n), { A: f[0] + f[1], Z: f[0], s: M.sym(f[0]) }, n[2]); };
assert.equal(eq(6, 8), '¹⁴₆C → ¹⁴₇N + ⁰₋₁e + ⁰₀ν̄');
assert.equal(eq(9, 9), '¹⁸₉F → ¹⁸₈O + ⁰₊₁e + ⁰₀ν');
assert.equal(eq(88, 138), '²²⁶₈₈Ra → ²²²₈₆Rn + ⁴₂He');
assert.equal(eq(84, 126), '²¹⁰₈₄Po → ²⁰⁶₈₂Pb + ⁴₂He');
assert.equal(eq(11, 11), '²²₁₁Na → ²²₁₀Ne + ⁰₊₁e + ⁰₀ν');
assert.equal(eq(11, 13), '²⁴₁₁Na → ²⁴₁₂Mg + ⁰₋₁e + ⁰₀ν̄');
// 5. chaîne de l'uranium 238 : 15 noyaux, 8 α, 6 β⁻, finit au plomb 206 stable
const ch = M.chaine(M.trouve(92, 146));
assert.equal(ch.length, 15); assert.equal(M.compte(ch, 'a'), 8); assert.equal(M.compte(ch, 'b-'), 6);
assert.deepEqual(ch.at(-1), [82, 124, 's']); assert.equal(M.A(ch[0]), 238); assert.equal(M.A(ch.at(-1)), 206);
assert.deepEqual(M.comptesChaine({ A: 238, Z: 92 }, { A: 206, Z: 82 }), { nA: 8, nB: 6 });
assert.deepEqual(M.apresChaine(238, 92, 8, 6), { A: 206, Z: 82 });
// 6. déplacements dans le diagramme : α (−2, −2), β⁻ (N−1, Z+1), β⁺ (N+1, Z−1)
assert.deepEqual(M.DEPLACEMENT.a, { dN: -2, dZ: -2 }); assert.deepEqual(M.DEPLACEMENT['b-'], { dN: -1, dZ: 1 }); assert.deepEqual(M.DEPLACEMENT['b+'], { dN: 1, dZ: -1 });
// 7. position : tous les noyaux β⁻ des légers ont N ≥ N du plus lourd isotope stable de leur élément s'il existe (excès de neutrons) ; β⁺ : N ≤ N du plus léger stable (excès de protons)
for (const n of M.LEGERS.filter(n => n[2] === 'b-')) { const st = M.isotopesDe(M.LEGERS, n[0]).filter(m => m[2] === 's'); if (st.length) assert.ok(n[1] > Math.min(...st.map(m => m[1])), `β⁻ sans excès de neutrons ${n}`); }
for (const n of M.LEGERS.filter(n => n[2] === 'b+')) { const st = M.isotopesDe(M.LEGERS, n[0]).filter(m => m[2] === 's'); if (st.length) assert.ok(n[1] < Math.max(...st.map(m => m[1])), `β⁺ sans excès de protons ${n}`); }
// 8. vallée : 261 noyaux, tous avec N ≥ 0 et Z de 1 à 83 ; contient les stables légers
assert.equal(VALLEE.length, 261);
for (const [N, Z, m] of M.LEGERS.filter(n => n[2] === 's').map(([Z, N, m]) => [N, Z, m])) assert.ok(VALLEE.some(v => v[0] === N && v[1] === Z), `vallée : ${N},${Z} (${m}) absent`);
// 9. réserve des défis : 3 types présents ; 5 000 tirages, tous cohérents
for (const t of M.TYPES) assert.ok(M.RESERVE.some(r => r.mode === t), `type ${t} absent`);
for (let i = 0; i < 5000; i++) { const d = M.tirageDefi(); assert.ok(M.conserve(M.bilan(d.pere, d.fils, d.mode))); assert.equal(M.typeDe(d.pere, d.fils), d.mode); }
console.log(`rdaModele : OK (${M.TOUS.length} noyaux, dont ${M.radioactifs().length} radioactifs ; réserve de défis : ${M.RESERVE.length} désintégrations)`);
