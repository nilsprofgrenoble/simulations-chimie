// Vérifie les exercices ajoutés au lot 2 BTS (exosBtsB.js) : node src/simulations/exosBtsB.test.mjs
import assert from 'node:assert/strict';
import { BTSB_ANA, BTSB_VAL, BTSB_SIT, raHansen } from './exosBtsB.js';

const len = (o) => o[0].length;
const ids = new Set();
const echecs = [];
const verifierQcm = (id, opts) => { try { verifierQcm0(id, opts); } catch (e) { echecs.push(e.message); } };
const verifierQcm0 = (id, opts) => {
  assert.equal(opts.filter(o => o[1] === true).length, 1, `${id} : une seule bonne réponse`);
  assert.ok(opts.length >= 3 && opts.every(o => typeof o[0] === 'string' && o[0] && typeof o[2] === 'string' && o[2].length > 15), `${id} : options et explications`);
  assert.equal(new Set(opts.map(o => o[0])).size, opts.length, `${id} : options en double`);
  const vrai = opts.find(o => o[1]);
  assert.ok(opts.some(o => o !== vrai && len(o) >= len(vrai)), `${id} : la bonne réponse ne doit pas être la plus longue`);
  assert.ok(opts.every(o => len(o) <= 1.8 * len(vrai) + 10 && len(vrai) <= 1.8 * len(o) + 10), `${id} : options de longueurs trop différentes`);
};
const pasDeNaN = (id, x) => assert.ok(!/NaN|undefined|\[object|Infinity/.test(JSON.stringify(x)), `${id} : NaN ou undefined`);

for (const it of BTSB_ANA) {
  assert.ok(!ids.has(it.id), `id en double ${it.id}`); ids.add(it.id);
  assert.ok(it.enonce && it.q && it.titre && it.domaine, it.id);
  assert.ok(it.enonce.length < 420, `${it.id} : énoncé trop long (${it.enonce.length})`);
  verifierQcm(it.id, it.options);
  pasDeNaN(it.id, it);
}
for (const it of BTSB_VAL) {
  assert.ok(!ids.has(it.id), `id en double ${it.id}`); ids.add(it.id);
  assert.ok(it.enonce && it.q2 && it.ver && it.reperes?.length >= 2 && [1, 2, 3].includes(it.niveau), it.id);
  assert.equal(it.verdict.filter(v => v[1]).length, 1, `${it.id} : un seul verdict juste`);
  verifierQcm(it.id, it.options);
  pasDeNaN(it.id, it);
}

// S'APP : 300 tirages ; calculs refaits à part
const re = { ra: (s, p) => Math.sqrt(4 * (s[0] - p[0]) ** 2 + (s[1] - p[1]) ** 2 + (s[2] - p[2]) ** 2) };
const SOLV = { 'Acétone': [15.5, 10.4, 7.0], 'Éthanol': [15.8, 8.8, 19.4], 'Toluène': [18.0, 1.4, 2.0], 'Acétate d’éthyle': [15.8, 5.3, 7.2] };
const vusSolv = new Set();
for (const ex of BTSB_SIT) {
  assert.ok(!ids.has(ex.id), `id en double ${ex.id}`); ids.add(ex.id);
  for (let k = 0; k < 300; k++) {
    const c = ex.construire();
    pasDeNaN(ex.id, c);
    assert.ok(c.enonce.length > 30 && c.etapes.length >= 2 && c.retenir.length >= 1, ex.id);
    if (c.tableau) assert.ok(c.tableau.lignes.every(l => l.length === c.tableau.entetes.length), `${ex.id} : tableau`);
    for (const e of c.etapes) {
      assert.ok(e.q && e.aide && e.titre, `${ex.id}.${e.id}`);
      if (e.type === 'saisie') {
        assert.ok(e.champs.every(f => Number.isFinite(f.vrai) && f.tol >= 0.05 && f.tol <= 0.2 && typeof f.u === 'string'), `${ex.id}.${e.id} : saisie`);
        assert.ok(typeof e.expl === 'string' && e.expl.length > 3);
      } else verifierQcm(`${ex.id}.${e.id}`, e.o);
    }
    if (ex.id === 'for-hansen-sapp-donnees') {
      const lib = c.tableau.lignes[1][0], nbf = (t) => Number(t.replace(',', '.'));
      const sol = SOLV[lib], pol = c.tableau.lignes[0].slice(1, 4).map(nbf);
      assert.ok(sol, lib); vusSolv.add(lib);
      assert.deepEqual(c.tableau.lignes[1].slice(1, 4).map(nbf), sol);
      const attendu = re.ra(sol, pol);
      assert.ok(Math.abs(c.etapes[2].champs[0].vrai - attendu) < 1e-9, 'Ra');
      assert.ok(Math.abs(raHansen({ dD: sol[0], dP: sol[1], dH: sol[2] }) - attendu) < 1e-9);
      const red = attendu / 6.0, bonne = c.etapes[3].o.find(o => o[1])[0];
      assert.equal(bonne.includes('dans la sphère'), red < 1, `RED ${red}`);
    }
    if (ex.id === 'for-cov-sapp-formule') {
      const somme = c.tableau.lignes.reduce((s, l) => s + Number(l[1]), 0);
      assert.equal(somme, 100, 'la composition doit totaliser 100 g');
      const volatils = { 'White spirit': 1, 'Éther de glycol (coalescent)': 1, 'Xylène': 1, 'Acétate de butyle': 1 };
      const cov = c.tableau.lignes.filter(l => volatils[l[0]]).reduce((s, l) => s + Number(l[1]), 0);
      assert.equal(c.etapes[1].champs[0].vrai, cov, 'COV');
    }
    if (ex.id === 'sec-sapp-durcisseur') {
      const m = c.enonce.match(/prépare (\d+) g de résine.*PEE = (\d+) g·éq⁻¹.*PEH = (\d+) g·éq⁻¹/);
      assert.ok(m, 'énoncé durcisseur');
      assert.ok(Math.abs(c.etapes[2].champs[0].vrai - Number(m[1]) * Number(m[3]) / Number(m[2])) < 1e-9, 'masse de durcisseur');
      assert.ok(c.etapes[2].champs[0].vrai < Number(m[1]), 'le durcisseur pèse moins que la résine');
    }
  }
}
assert.equal(vusSolv.size, 4, 'les quatre solvants doivent être tirés');
// Chiffres des énoncés fixes, refaits à part
assert.ok(Math.abs(Math.sqrt(4 * 0.25 + 1.96 + 1) - 1.99) < 0.005);
assert.ok(Math.abs(100 * 60 / 190 - 31.6) < 0.05 && Math.round(100 * 190 / 60) === 317);
assert.ok(Math.abs(88.5 + 1.6 * 13.5 - 110.1) < 0.05);
assert.equal(45 + 30 + 21 + 3 + 1, 100);
assert.equal(echecs.length, 0, [...new Set(echecs)].join('\n'));
console.log(`exosBtsB : OK (${BTSB_ANA.length} ANA, ${BTSB_VAL.length} VAL, ${BTSB_SIT.length} S'APP, 300 tirages chacun)`);
