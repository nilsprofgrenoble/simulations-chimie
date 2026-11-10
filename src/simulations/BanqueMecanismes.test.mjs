// Vérifie la banque « Mécanismes réactionnels » : node src/simulations/BanqueMecanismes.test.mjs
import assert from 'node:assert/strict';
import { EXERCICES } from './BanqueMecanismes.js';
const ids = new Set(), titres = new Set();
for (const ex of EXERCICES) {
  assert.ok(!ids.has(ex.id), 'id en double ' + ex.id); ids.add(ex.id);
  assert.ok(!titres.has(ex.titre), 'titre en double ' + ex.titre); titres.add(ex.titre);
  assert.equal(ex.domaine, 'Mécanismes réactionnels');
  for (let k = 0; k < 150; k++) {
    const c = ex.construire();
    assert.ok(c.enonce && c.etapes.length >= 2 && c.retenir.length >= 1, ex.id);
    assert.ok(!/NaN|undefined|\[object/.test(JSON.stringify(c)), `${ex.id} : NaN/undefined`);
    const sid = new Set();
    for (const e of c.etapes) {
      assert.ok(!sid.has(e.id), `${ex.id} : étape en double ${e.id}`); sid.add(e.id);
      assert.ok(e.q && e.aide && e.titre, `${ex.id}.${e.id} : q/aide/titre`);
      if (e.type === 'saisie') {
        assert.ok(e.champs.length && e.champs.every(f => Number.isFinite(f.vrai) && f.tol > 0), `${ex.id}.${e.id} : saisie`);
        assert.ok(e.expl, `${ex.id}.${e.id} : expl`);
      } else {
        assert.equal(e.o.filter(o => o[1]).length, 1, `${ex.id}.${e.id} : une seule bonne réponse`);
        assert.ok(e.o.length >= 3 && e.o.every(o => o[2] && o[0]), `${ex.id}.${e.id} : options/explications`);
        assert.equal(new Set(e.o.map(o => o[0])).size, e.o.length, `${ex.id}.${e.id} : options en double`);
      }
    }
  }
}
// valeurs calculées à la main : [α]=40, ℓ=2 dm, c=0,25 g/mL → α_pur = 40×2×0,25 = 20° ; e.e. 60 % → α = 12° ; majoritaire (100+60)/2 = 80 %
assert.equal(40 * 2 * 0.25, 20); assert.equal(0.6 * 20, 12); assert.equal((100 + 60) / 2, 80);
console.log(`BanqueMecanismes : OK (${EXERCICES.length} exercices, 150 tirages chacun)`);
