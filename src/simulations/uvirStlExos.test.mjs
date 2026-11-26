// Contrôle des exercices UV-visible / IR (TSTL) : node src/simulations/uvirStlExos.test.mjs
// REA « uv-energie » et « uv-etalonnage », S'APP « uvs-sapp-* », ANA et VAL : on refait les calculs avec les seuls nombres écrits dans les énoncés.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { UVS_ANA, UVS_VAL, UVS_SAPP } from './uvirStlExos.js';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { FAMILLES } = await vite.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); };
const num = s => Number(s.replace(/\s/g, '').replace(',', '.'));
const H = 6.63e-34, C = 3.00e8, EV = 1.60e-19;
const garde = (qs, nb) => {
  ok(qs.length === nb, `${nb} questions`);
  ok(new Set(qs.map(q => q.id)).size === nb, 'identifiants distincts');
  ok(new Set(qs.map(q => Number(q.vrai.toPrecision(2)))).size === nb, 'deux questions de même réponse');
  for (const q of qs) { ok(q.vrai > 0 && isFinite(q.vrai) && q.tolRel > 0, `${q.id} : vrai ou tolérance`); ok(q.pieges.length >= 1, `${q.id} : aucun piège`); for (const [v] of q.pieges) ok(Math.abs(v - q.vrai) > 0.05 * q.vrai, `${q.id} : piège dans la tolérance`); }
};
// ---- REA énergie
const fe = FAMILLES.find(f => f.id === 'uv-energie'); ok(fe, 'famille uv-energie');
const vus = new Set();
for (let i = 0; i < 3000; i++) {
  const ex = fe.gen(), qs = ex.questions; garde(qs, 4);
  const lam = num(ex.intro.match(/λ = (\d+)/)[1]); vus.add(lam);
  const nu = C / (lam * 1e-9), EJ = H * nu;
  ok(Math.abs(qs[0].vrai - nu / 1e14) < 1e-9 && Math.abs(qs[1].vrai - EJ / 1e-19) < 1e-9 && Math.abs(qs[2].vrai - EJ / EV) < 1e-9 && Math.abs(qs[3].vrai - EJ / EV / 2) < 1e-9, 'valeurs recalculées');
  ok(qs[2].vrai > 1 && qs[2].vrai < 6, 'énergie du photon UV-visible entre 1 et 6 eV');
  ok(qs.every(q => q.csMin === 3 && q.unite), 'chiffres significatifs et unité');
}
ok(vus.size === 10, 'toutes les longueurs d’onde tirées');
// ---- REA étalonnage
const fk = FAMILLES.find(f => f.id === 'uv-etalonnage'); ok(fk, 'famille uv-etalonnage');
for (let i = 0; i < 4000; i++) {
  const ex = fk.gen(), qs = ex.questions; garde(qs, 4);
  const pts = [...ex.intro.matchAll(/(\d+,\d)\smg\/L → A = (\d+,\d{3})/g)].map(m => [num(m[1]), num(m[2])]);
  ok(pts.length === 5, 'cinq étalons');
  for (let j = 1; j < 5; j++) ok(pts[j][1] > pts[j - 1][1] && pts[j][0] > pts[j - 1][0], 'étalons croissants');
  ok(pts[4][1] < 1.0 && pts[4][1] > 0.2, `absorbance maximale dans la zone de validité (${pts[4][1]})`);
  const k = (pts[4][1] - pts[0][1]) / (pts[4][0] - pts[0][0]);
  const F = num(ex.intro.match(/diluée (\d+) fois/)[1]), Ax = num(ex.intro.match(/A = (\d+,\d{3})\. La solution mère/)[1]), V = num(ex.intro.match(/volume de (\d+)/)[1]);
  ok(Ax > pts[1][1] - 1e-9 && Ax < pts[4][1], 'A de la solution diluée dans la gamme d’étalonnage');
  ok(Math.abs(qs[0].vrai - k) < 1e-12 && Math.abs(qs[1].vrai - Ax / k) < 1e-9 && Math.abs(qs[2].vrai - F * Ax / k) < 1e-9 && Math.abs(qs[3].vrai - F * Ax / k * V / 1000) < 1e-9, 'valeurs recalculées');
  // un élève qui utilise sa pente arrondie à 2 chiffres significatifs reste dans la tolérance
  const k2 = Number(k.toPrecision(2)), cd2 = Ax / k2;
  ok(Math.abs(cd2 - qs[1].vrai) <= qs[1].tolRel * qs[1].vrai + 1e-9, `pente arrondie hors tolérance (${k} → ${k2})`);
  ok(Math.abs(F * cd2 - qs[2].vrai) <= qs[2].tolRel * qs[2].vrai + 1e-9, 'concentration mère avec pente arrondie hors tolérance');
  ok(Math.abs(F * cd2 * V / 1000 - qs[3].vrai) <= qs[3].tolRel * qs[3].vrai + 1e-9, 'masse avec pente arrondie hors tolérance');
}
// ---- S'APP
for (const s of UVS_SAPP) for (let i = 0; i < 2000; i++) {
  const p = s.gen();
  for (const q of [0, 1]) {
    const b = s.build(p, q);
    ok(b.utiles.every(k => b.tokens[k]), `${s.id} : token utile manquant`);
    ok(Object.keys(b.tokens).every(k => b.utiles.includes(k) || b.raisons[k]), `${s.id} : token sans raison`);
    ok(b.solution.val > 0 && isFinite(b.solution.val), `${s.id} : solution`);
    ok(new Set([b.cherche.bonne, ...b.cherche.faux]).size === 4, `${s.id} : propositions en double`);
  }
}
{ const s = UVS_SAPP[0], p = { lam: 500, A: 0.45 }; ok(Math.abs(s.build(p, 1).solution.val - 2.48625) < 1e-3, 'E(500 nm) = 2,49 eV'); ok(Math.abs(s.build(p, 0).solution.val - 5e-7) < 1e-12, 'λ en m'); }
{ const s = UVS_SAPP[1], p = { k: 2000, A: 0.6, f: 10, V: 10 }; ok(Math.abs(s.build(p, 0).solution.val - 3e-4) < 1e-12 && Math.abs(s.build(p, 1).solution.val - 3e-3) < 1e-12, 'étalonnage'); }
// ---- ANA et VAL
const tous = [...UVS_ANA, ...UVS_VAL];
ok(new Set(tous.map(e => e.id)).size === tous.length, 'identifiants uniques');
for (const e of tous) { ok(e.options.filter(o => o[1]).length === 1, `${e.id} : une seule bonne réponse`); const L = e.options.map(o => o[0].length), bonne = e.options.find(o => o[1])[0].length; ok(bonne < Math.max(...L), `${e.id} : la bonne réponse est la plus longue`); ok(new Set(e.options.map(o => o[0])).size === e.options.length, `${e.id} : options en double`); }
// calculs des VAL
ok(Math.abs(H * C / 5.00e-7 - 3.978e-19) < 1e-21, 'E(500 nm)'); ok(Math.abs(2.4 / 2.0 - 1.2) < 1e-12, 'c = A/k de l’élève');
console.log(`uvirStlExos : ${n} vérifications — OK`);
await vite.close();
