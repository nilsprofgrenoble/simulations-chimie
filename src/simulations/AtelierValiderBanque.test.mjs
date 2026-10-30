// Vérifie la cohérence de la banque VALIDER : node src/simulations/AtelierValiderBanque.test.mjs
import assert from 'node:assert/strict';
import { PLAUSIBLES, COMPATIBLES, DECISIONS } from './AtelierValiderBanque.js';
import { CHAPITRES } from '../chapitres.js';

const domaines = new Set(CHAPITRES.flatMap(c => c.domaines));
const ids = new Set();
for (const it of [...PLAUSIBLES, ...COMPATIBLES]) {
  assert.ok(!ids.has(it.id), `id en double : ${it.id}`); ids.add(it.id);
  assert.ok(domaines.has(it.domaine), `${it.id} : domaine « ${it.domaine} » absent de chapitres.js`);
  assert.ok([1, 2, 3].includes(it.niveau), `${it.id} : niveau`);
  assert.equal(it.options.filter(o => o[1]).length, 1, `${it.id} : une seule bonne réponse attendue`);
  assert.ok(it.options.length >= 3, `${it.id} : au moins 3 propositions`);
}
for (const it of PLAUSIBLES) assert.equal(it.verdict.filter(o => o[1]).length, 1, it.id);
for (const it of COMPATIBLES) {
  const seuil = 2 * (it.uc ?? 0);
  if (it.uc != null) assert.ok(Math.abs(seuil - it.seuil) < 0.01, `${it.id} : seuil composé`);
  assert.equal(it.compatible, it.ecart <= it.seuil + 1e-9, `${it.id} : verdict incohérent avec écart/seuil`);
  assert.ok(it.q4 && it.expl && it.reperes.length >= 3, it.id);
}
// incertitudes composées recalculées
const uc = (a, b) => Math.sqrt(a * a + b * b);
assert.ok(Math.abs(uc(0.3, 0.2) - 0.36) < 0.005);
assert.ok(Math.abs(uc(8, 12) - 14.4) < 0.05);
for (const it of DECISIONS) {
  assert.ok(!ids.has(it.id), `id en double : ${it.id}`); ids.add(it.id);
  assert.ok(domaines.has(it.domaine), `${it.id} : domaine absent de chapitres.js`);
  assert.ok([1, 2, 3].includes(it.niveau) && it.enonce && it.reperes.length >= 2, it.id);
  for (const e of it.etapes) {
    if (e.type === 'num') { assert.ok(Number.isFinite(e.attendu) && e.q && e.expl, `${it.id}.${e.id}`); continue; }
    assert.equal(e.o.filter(o => o[1]).length, 1, `${it.id}.${e.id} : une seule bonne réponse attendue`);
    assert.ok(e.o.length >= 2 && e.o.every(o => o[2]), `${it.id}.${e.id} : explication de chaque proposition`);
  }
}
// modèles de la figure : cohérence avec les équations affichées
const cn = DECISIONS.find(d => d.id === 'modele-ctn').figure.modeles, ph = DECISIONS.find(d => d.id === 'modele-photoresistance').figure.modeles;
assert.ok(cn[1].f(100) < -16 && cn[0].f(100) > 0.5 && cn[0].f(100) < 0.7, 'CTN : valeurs à 100 °C');
assert.ok(Math.abs(23.9 / 0.410 - 58.3) < 0.2, 'CTN : annulation de B vers 58 °C');
assert.ok(ph[1].f(10000) < -0.3 && ph[1].f(10000) > -0.5 && ph[0].f(10000) > 0.3 && ph[0].f(10000) < 0.4, 'photorésistance : valeurs à 10 000 lx');
assert.ok(Math.abs(Math.exp(6.66 / 0.765) - 6038) < 10, 'photorésistance : annulation de B vers 6 000 lx');
console.log(`OK : ${PLAUSIBLES.length} plausibles, ${COMPATIBLES.length} compatibles, ${DECISIONS.length} décisions`);
