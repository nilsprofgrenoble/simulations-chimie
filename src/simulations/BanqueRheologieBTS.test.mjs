// Vérifie la banque « Rhéologie » (BTS) : node src/simulations/BanqueRheologieBTS.test.mjs
import assert from 'node:assert/strict';
import { EXERCICES } from './BanqueRheologieBTS.js';
import { mulberry32 } from './epaisseursAssociatifsModele.js';
const ids = new Set(), titres = new Set();
let n = 0;
for (const ex of EXERCICES) {
  assert.ok(!ids.has(ex.id), 'id en double ' + ex.id); ids.add(ex.id);
  assert.ok(!titres.has(ex.titre), 'titre en double ' + ex.titre); titres.add(ex.titre);
  assert.equal(ex.domaine, 'Rhéologie');
  assert.equal(typeof ex.construire, 'function');
  for (let k = 0; k < 150; k++) {
    const c = ex.construire(mulberry32(5000 + k * 17));
    n++;
    assert.ok(typeof c.enonce === 'string' && c.enonce.length > 10 && c.etapes.length >= 2, ex.id);
    assert.ok(Array.isArray(c.retenir) && c.retenir.length >= 1 && c.retenir.every(r => typeof r === 'string' && r.length > 10), `${ex.id} : retenir doit être un tableau de textes`);
    assert.ok(!/NaN|undefined|\[object|Infinity/.test(JSON.stringify(c)), `${ex.id} : NaN/undefined`);
    if (c.tableau) assert.ok(c.tableau.entetes.length && c.tableau.lignes.every(l => l.length === c.tableau.entetes.length), `${ex.id} : tableau`);
    const sid = new Set();
    for (const e of c.etapes) {
      assert.ok(!sid.has(e.id), `${ex.id} : étape en double ${e.id}`); sid.add(e.id);
      assert.ok(e.q && e.aide && e.titre, `${ex.id}.${e.id} : q/aide/titre`);
      assert.ok(!/capacit|référentiel|programme/i.test(e.q), `${ex.id}.${e.id} : pas de mention du programme`);
      if (e.type === 'saisie') {
        assert.ok(e.champs.length && e.champs.every(f => Number.isFinite(f.vrai) && f.tol > 0 && f.tol <= 0.2), `${ex.id}.${e.id} : saisie (tolérance relative, entre 0 et 20 %)`);
        assert.ok(e.champs.every(f => f.tol >= 0.05), `${ex.id}.${e.id} : tolérance au moins égale à l'arrondi à 2 chiffres significatifs (5 %)`);
        assert.ok(e.champs.every(f => f.u !== ''), `${ex.id}.${e.id} : unité non vide (sinon champOk ajoute 1 de tolérance absolue)`);
        assert.ok(typeof e.expl === 'string' && e.expl.length > 3, `${ex.id}.${e.id} : expl`);
      } else {
        assert.equal(e.o.filter(o => o[1] === true).length, 1, `${ex.id}.${e.id} : une seule bonne réponse`);
        assert.ok(e.o.length >= 3 && e.o.every(o => typeof o[0] === 'string' && typeof o[2] === 'string' && o[0] && o[2].length > 5), `${ex.id}.${e.id} : options/explications`);
        assert.equal(new Set(e.o.map(o => o[0])).size, e.o.length, `${ex.id}.${e.id} : options en double`);
      }
    }
  }
}
console.log(`BanqueRheologieBTS : OK (${EXERCICES.length} exercices, 150 tirages chacun, ${n} constructions)`);
