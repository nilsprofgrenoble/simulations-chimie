// node src/simulations/iccModele.test.mjs : contrôle des données scientifiques et du modèle de la simulation 185
import assert from 'node:assert/strict';
import * as M from './iccModele.js';
const pr = (a, b, tol = 1e-9, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} ≠ ${b}`);
const rho = M.SITUATIONS.rho, res = M.SITUATIONS.res;

// 1. formule de composition : somme, produit/quotient
pr(M.uSomme([0.03, 0.03]), 0.03 * Math.SQRT2, 1e-12);
pr(M.uSomme([3, 4]), 5, 1e-12, 'Pythagore');
pr(M.uRelProduit([{ val: 1, u: 0.03, exp: 1 }, { val: 1, u: 0.04, exp: -1 }]), 0.05, 1e-12);
pr(M.PARCOURS.m2 - M.PARCOURS.m1, rho.grandeurs[0].val, 1e-12, 'm = m2 - m1');
pr(M.uSomme([M.PARCOURS.uPesee, M.PARCOURS.uPesee]), 0.042426, 1e-5);
assert.equal(M.uSomme([M.PARCOURS.uPesee, M.PARCOURS.uPesee]).toFixed(3), '0.042');
// pieds / règle : type B u = a/√3
pr(0.05 / Math.sqrt(3), 0.0289, 1e-3, 'balance 0,1 g'); assert.equal(Math.ceil(0.05 / Math.sqrt(3) * 100) / 100, 0.03);
pr(0.025 / Math.sqrt(3) / 10, 0.00144, 1e-2, 'pied à coulisse'); assert.equal(M.PARCOURS.pied.u, 0.0014);

// 2. valeurs du parcours guidé (cas A : règle graduée ; cas B : pied à coulisse)
const A = M.parcoursCas(false), B = M.parcoursCas(true);
pr(A.G, 2.745423, 1e-6); pr(M.uRelFormule(A.sit, A.vals), 0.030240, 1e-4); pr(A.u, 0.083020, 1e-4);
assert.equal((100 * M.uRelFormule(A.sit, A.vals)).toFixed(1), '3.0');
assert.equal(A.ecrit.texte.replace(/ /g, ' '), '2,75 ± 0,09 g/cm³'); pr(A.z, 0.5471, 1e-3); assert.ok(M.compatible(A.z));
pr(B.u, 0.011114, 1e-3); assert.equal(B.ecrit.texte.replace(/ /g, ' '), '2,745 ± 0,012 g/cm³'); pr(B.z, 4.10, 1e-2); assert.ok(!M.compatible(B.z));
// l'élève qui compare avec les valeurs ÉCRITES trouve 0,56 puis 3,75 : dans la tolérance de 10 % de la valeur non arrondie
assert.ok(Math.abs(0.05 / 0.09 - A.z) / A.z < 0.10, 'z cas A, valeurs écrites'); assert.ok(Math.abs(0.045 / 0.012 - B.z) / B.z < 0.10, 'z cas B, valeurs écrites');
// une grandeur domine : d (cas A), puis h (cas B)
const cA = M.contributions(A.sit, A.vals), cB = M.contributions(B.sit, B.vals);
assert.equal(cA.sort((a, b) => b.part - a.part)[0].id, 'd'); assert.ok(cA[0].part > 0.95);
assert.equal(cB.sort((a, b) => b.part - a.part)[0].id, 'h'); assert.ok(cB[0].part > 0.8);
// amélioration : on ne change que d (le pied à coulisse) ; u(ρ)/ρ passe de 3,0 % à 0,4 %
assert.ok(M.uRelFormule(B.sit, B.vals) < 0.0045);
// résistance : valeurs de la situation
pr(M.G0(res), 101.552, 1e-4); assert.equal(M.resultat(M.G0(res), M.uFormule(res), 'Ω').texte.replace(/ /g, ' '), '101,6 ± 1,6 Ω');

// 3. Monte-Carlo : cohérence avec la formule
const N = 400000;
{ const v = M.tirages(rho, M.valsDe(rho), 'normale', N, 5), s = M.ecartType(v); assert.ok(Math.abs(s - A.u) / A.u < 0.01, `MC normale ${s} vs ${A.u}`); pr(M.moyenne(v), A.G * (1 + 3 * 0.015 ** 2), 2e-4, 'moyenne MC (biais de non-linéarité 3 (u(d)/d)² ≈ 0,07 %)'); }
{ const v = M.tirages(rho, M.valsDe(rho), 'rect', N, 6), s = M.ecartType(v); assert.ok(Math.abs(s - A.u) / A.u < 0.01, `MC rect ${s} vs ${A.u}`); }
{ const vals = M.valsDe(res), v = M.tirages(res, vals, 'normale', N, 7); assert.ok(Math.abs(M.ecartType(v) - M.uFormule(res)) / M.uFormule(res) < 0.01, 'MC résistance'); }
// somme exacte : G = x − y
{ const sit = { grandeurs: [{ id: 'x' }, { id: 'y' }], f: x => x.x - x.y }, v = M.tirages(sit, { x: { val: 81.4, u: 0.03 }, y: { val: 12.4, u: 0.03 } }, 'normale', N, 8); assert.ok(Math.abs(M.ecartType(v) - 0.042426) / 0.042426 < 0.01, 'MC différence'); }
// effet de N : l'écart-type fluctue beaucoup pour N = 10, peu pour N = 100 000 (écart de la dispersion des estimations par rapport à la formule)
const dispersion = n => { const e = []; for (let g = 1; g <= 60; g++) e.push(M.ecartType(M.tirages(rho, M.valsDe(rho), 'normale', n, g))); const m = M.moyenne(e); return Math.sqrt(e.reduce((s, x) => s + (x - A.u) ** 2, 0) / e.length) / A.u; };
const d10 = dispersion(10), d1e5 = dispersion(100000); assert.ok(d10 > 0.1 && d1e5 < 0.01, `dispersion N : ${d10} ${d1e5}`);
// linéarisation : écart visible quand l'incertitude relative sur un diviseur est grande
{ const vals = { U: { val: 4.58, u: 0.03 }, I: { val: 45.1, u: 0.15 * 45.1 } }, v = M.tirages(res, vals, 'normale', N, 9), uf = M.uFormule(res, vals), e = (M.ecartType(v) - uf) / uf; assert.ok(e > 0.06 && e < 0.15, `écart linéarisation ${e}`); console.log(`  linéarisation R = U/I, u(I)/I = 15 % : écart MC / formule = +${(100 * e).toFixed(0)} %, moyenne MC ${M.moyenne(v).toFixed(1)} Ω pour ${M.G0(res, vals).toFixed(1)} Ω`); }
{ const vals = M.valsDe(rho); vals.d = { val: 2.0, u: 0.24 }; const v = M.tirages(rho, vals, 'normale', N, 10), uf = M.uFormule(rho, vals), e = (M.ecartType(v) - uf) / uf; assert.ok(e > 0.04 && e < 0.15, `écart linéarisation ρ ${e}`); console.log(`  linéarisation ρ, u(d)/d = 12 % : écart MC / formule = +${(100 * e).toFixed(0)} %`); }
// histogramme : tous les tirages sont comptés
{ const v = M.tirages(rho, M.valsDe(rho), 'normale', 5000, 3), h = M.histogramme(v, A.G, A.u); assert.equal(h.n.reduce((a, b) => a + b, 0) + h.hors, 5000); assert.ok(h.hors < 60); }

// 4. défi : faisabilité sur 6 000 tirages
let nCompat = 0, pire = 0, nRes = 0;
let graine = 1; const alea = () => { graine = (graine * 1664525 + 1013904223) % 4294967296; return graine / 4294967296; };
for (let i = 0; i < 6000; i++) {
  const d = M.tirageDefi(alea);
  assert.ok(d.z < 1.4 || d.z > 3.0, `z ${d.z} près du seuil`); assert.equal(d.compat, d.z < 2);
  assert.ok(d.u / d.G > 0.005 && d.u / d.G < 0.06, `u rel ${d.u / d.G}`);
  // un élève qui arrondit u à 3 chiffres significatifs trouve la même écriture (pas de bascule d'arrondi)
  assert.equal(M.arrondiU(d.u), M.arrondiU(Number(d.u.toPrecision(3))), `arrondi ambigu ${d.u}`);
  assert.equal(M.arrondiU(d.u), M.arrondiU(d.u * 1.0049), `arrondi ambigu+ ${d.u}`); assert.equal(M.arrondiU(d.u), M.arrondiU(d.u * 0.9951), `arrondi ambigu- ${d.u}`);
  pire = Math.max(pire, M.pireEcartZ(d)); if (d.compat) nCompat++; if (d.type === 'res') nRes++;
  // tolérance 6 % sur u(G) : un élève qui garde 3 chiffres significatifs dans ses incertitudes relatives (pire cas ≤ 0,5 % de chacune) reste dans la tolérance
  const g = d.sit.grandeurs.map(q => ({ val: d.vals[q.id].val, u: Number((d.vals[q.id].u / d.vals[q.id].val).toPrecision(3)) * d.vals[q.id].val, exp: q.exp }));
  const uEl = Number(d.G.toPrecision(4)) * Number(M.uRelProduit(g).toPrecision(3)); assert.ok(Math.abs(uEl - d.u) / d.u < 0.01, 'u élève');
}
assert.ok(pire < 1, `pire écart z / tolérance : ${pire}`); assert.ok(nCompat > 2400 && nCompat < 3600 && nRes > 2400 && nRes < 3600, 'équilibre des tirages');
console.log(`iccModele : OK (pire écart z / tolérance ${pire.toFixed(2)} ; ${nCompat} cas compatibles sur 6000 ; ${nRes} résistances)`);

// 5. programme Python affiché : exécuté avec python3, il donne la même moyenne et le même écart-type (à 1 % près) que le modèle, pour les 2 situations et les 2 lois
import { execFileSync } from 'node:child_process';
let nPy = 0;
for (const sit of [rho, res]) for (const loi of ['normale', 'rect']) {
  const vals = M.valsDe(sit), code = M.codePython(sit, vals, loi, 200000);
  let sortie; try { sortie = execFileSync('python3', ['-I', '-c', code], { encoding: 'utf8' }); } catch (e) { if (e.code === 'ENOENT') { console.log('  python3 absent : programme Python non exécuté'); continue; } throw new Error(`programme Python en erreur (${sit.id}, ${loi}) :\n${code}\n${e.stderr || e.message}`); }
  const [mp, sp] = sortie.trim().split(/\s+/).map(Number), v = M.tirages(sit, vals, loi, 200000, 11);
  assert.ok(Math.abs(sp - M.ecartType(v)) / M.ecartType(v) < 0.01, `Python ${sit.id} ${loi} : écart-type ${sp} vs ${M.ecartType(v)}`);
  assert.ok(Math.abs(sp - M.uFormule(sit, vals)) / M.uFormule(sit, vals) < 0.012, `Python ${sit.id} ${loi} : écart-type vs formule`);
  assert.ok(Math.abs(mp - M.moyenne(v)) / M.moyenne(v) < 0.003, `Python ${sit.id} ${loi} : moyenne`); nPy++;
}
console.log(`programme Python : ${nPy} variantes exécutées et cohérentes avec le modèle`);
console.log(M.codePython(rho, M.valsDe(rho), 'normale', 1000));
