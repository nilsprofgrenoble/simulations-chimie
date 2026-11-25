// Contrôle des exercices de seconde « Ondes et signaux » (lumière, son, circuits) : node src/simulations/ondesSignaux2gtExos.test.mjs
// Pour chaque QCM des domaines concernés : une seule bonne réponse, aucune option en double, explication de chaque option,
// et la bonne réponse n'est jamais la plus longue (ni la seule à dépasser largement les autres).
import assert from 'node:assert/strict';
import { createServer } from 'vite';
const vite = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
const { OSG2GT_ANA, OSG2GT_VAL } = await vite.ssrLoadModule('/src/simulations/ondesSignaux2gtExos.js');
const { PREVOIR } = await vite.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
const { PLAUSIBLES } = await vite.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
const { CHAPITRES } = await vite.ssrLoadModule('/src/chapitres.js');

const DOMAINES = new Set(CHAPITRES.filter(c => ['2gt-lumiere', '2gt-son', '2gt-circuits'].includes(c.id)).flatMap(c => c.domaines));
const SCHEMAS_NEUTRES = new Set(['spectres', 'caracteristique', 'circuit', 'optique']);

const verifier = (it, options) => {
  assert.equal(options.filter(o => o[1]).length, 1, `${it.id} : une seule bonne réponse attendue`);
  assert.ok(options.length >= 3, `${it.id} : au moins 3 propositions`);
  assert.equal(new Set(options.map(o => o[0])).size, options.length, `${it.id} : option en double`);
  assert.ok(options.every(o => typeof o[2] === 'string' && o[2].length > 15), `${it.id} : explication de chaque option`);
  const L = options.map(o => o[0].length), bonne = options.find(o => o[1])[0].length;
  assert.ok(!(bonne === Math.max(...L) && L.filter(l => l === bonne).length === 1), `${it.id} : la bonne réponse est la plus longue (${L})`);
  assert.ok(Math.max(...L) <= 4 * Math.min(...L) || Math.max(...L) <= 12, `${it.id} : longueurs trop inégales (${L})`);
};

let n = 0;
for (const it of PREVOIR.filter(x => DOMAINES.has(x.domaine))) { verifier(it, it.options); n++; }
for (const it of PLAUSIBLES.filter(x => DOMAINES.has(x.domaine))) { verifier(it, it.options); n++; }

const ids = new Set();
for (const it of [...OSG2GT_ANA, ...OSG2GT_VAL]) {
  assert.ok(!ids.has(it.id), `id en double ${it.id}`); ids.add(it.id);
  assert.ok(DOMAINES.has(it.domaine), `${it.id} : domaine`);
  assert.ok(it.enonce.length < 420, `${it.id} : énoncé trop long (${it.enonce.length})`);
  if (it.schema) assert.ok(SCHEMAS_NEUTRES.has(it.schema.type), `${it.id} : type de schéma`);
}
assert.ok(PREVOIR.some(x => x.id === 'lum2gt-ana-raies') && PLAUSIBLES.some(x => x.id === 'cir2gt-val-ctn'), 'banques non branchées');
// Faits vérifiés à part
assert.ok(Math.abs(150e6 / 3e5 / 60 - 8.3) < 0.1, 'Soleil : 8 min');
assert.ok(Math.abs(3.84e8 / 3.0e8 - 1.28) < 0.01 && Math.abs(500 / 400 - 1.25) < 0.01, 'Terre–Lune : 1,3 s');
assert.ok(Math.abs(1.5e11 / 3e5 - 5e5) < 1, 'c en m/s erroné : 5×10⁵ s');
assert.ok([[2, 0.1], [4, 0.16], [6, 0.2]].map(([u, i]) => u / i).join() === '20,25,30', 'lampe : U/I');
assert.ok([[2, 0.01], [4, 0.02], [6, 0.03]].every(([u, i]) => Math.abs(u / i - 200) < 1e-9), 'résistor : U/I');
assert.ok(Math.abs(0.5 + 0.3 + 0.4 - 1.2) < 1e-9 && Math.abs(0.45 + 0.25 + 0.2 - 0.9) < 1e-9 && Math.abs(0.6 - 0.4 - 0.2) < 1e-9, 'loi des nœuds');
assert.ok(90 - 40 === 50, 'réflexion : 50°');
console.log(`OK : ${n} QCM contrôlés, ${OSG2GT_ANA.length} ANA et ${OSG2GT_VAL.length} VAL ajoutés`);
await vite.close();
