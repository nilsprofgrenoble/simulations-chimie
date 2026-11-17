import assert from 'node:assert/strict';
import { modele, predit, SCEN, additif, interaction, verdict, ROUGE, ecartRouge, moyenneRouge, tirage, r1 } from './interactionsModele.js';
import { JEUX } from './planFactorielModele.js';

assert.equal(additif(SCEN.vedettes), 3.6); assert.equal(interaction(SCEN.vedettes), -2);
assert.equal(additif(SCEN.moyens), 1.3); assert.equal(interaction(SCEN.moyens), 1.1);
assert.equal(additif(SCEN.vinaigrette), 10.3); assert.equal(interaction(SCEN.vinaigrette), -3.2);
assert.equal(moyenneRouge(ROUGE), 3.5); assert.equal(ecartRouge(ROUGE), 4.5);
assert.equal(verdict(-2), 'antagonisme'); assert.equal(verdict(1.1), 'synergie'); assert.equal(verdict(0), 'aucune');
// La vinaigrette vient bien du plan 2⁴ réel : moyenne de la note sur les 4 essais de chaque case (U = facteur 2, N = facteur 3)
const J = JEUX.vin4, y = J.reponses[0].y;
const cell = (u, n) => { const v = J.X.map((r, i) => (r[2] === u && r[3] === n ? y[i] : null)).filter(x => x != null); return v.reduce((s, t) => s + t, 0) / v.length; };
const s = SCEN.vinaigrette;
assert.equal(r1(cell(-1, -1)), s.base); assert.equal(r1(cell(1, -1)), s.A); assert.equal(r1(cell(-1, 1)), s.B); assert.equal(r1(cell(1, 1)), s.AB);
// Le prévu additif dépasse l'échelle de notation (10) : l'additivité est impossible ici
assert.ok(additif(s) > 10);
// Le rouge à lèvres vient du plan de mélange réel (notes 5, 2 et 8)
import('./planMelangeModele.js').then(m => { assert.equal(m.NOTE[0], ROUGE.A); assert.equal(m.NOTE[1], ROUGE.B); assert.equal(m.NOTE[3], ROUGE.AB); });
// Tirages : toujours dans l'échelle 0–10, et les trois verdicts existent
const vus = new Set();
for (let i = 0; i < 2000; i++) { const t = tirage(); assert.ok(t.AB >= 0 && t.AB <= 10); vus.add(verdict(interaction(t))); }
assert.equal(vus.size, 3);
// Modèle codé : il retrouve exactement les 4 mesures, et aAB = interaction / 4
for (const s of [SCEN.vedettes, SCEN.moyens, SCEN.vinaigrette, tirage()]) {
  const c = modele(s);
  assert.ok(Math.abs(predit(c, -1, -1) - s.base) < 1e-9 && Math.abs(predit(c, 1, -1) - s.A) < 1e-9 && Math.abs(predit(c, -1, 1) - s.B) < 1e-9 && Math.abs(predit(c, 1, 1) - s.AB) < 1e-9);
  assert.ok(Math.abs(c.aAB - (s.AB - (s.A + s.B - s.base)) / 4) < 1e-9);
}
console.log('interactionsModele : tous les tests passent');
