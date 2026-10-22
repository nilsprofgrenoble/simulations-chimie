// Vérifie la logique de la mission Kepler : node src/simulations/escapeKeplerModele.test.mjs
import assert from 'node:assert/strict';
import { MODULES, CONTROLE, chiffre, codeAttendu, nouvellePartie, reparee, nbReparees, controleReussi, malus, restant, mmss, cleDefi } from './escapeKeplerModele.js';

for (let g = 0; g <= 9; g++) { const c = codeAttendu(g); assert.match(c, /^[0-9]{4}$/, `code groupe ${g}`); }
const codes = new Set(Array.from({ length: 10 }, (_, g) => codeAttendu(g)));
assert.ok(codes.size >= 8, `trop peu de codes différents entre groupes : ${codes.size}`);
assert.equal(codeAttendu(0), '7394');
MODULES.forEach((m, i) => assert.equal(chiffre(i, 0), m.base));

const T0 = 1_000_000;
const p = nouvellePartie('classe', 3, T0);
const h = { [cleDefi(45)]: T0 - 5000, [cleDefi(30)]: T0 + 1000 };
assert.equal(reparee(p, h, 45), false, 'une réussite antérieure à la partie ne compte pas');
assert.equal(reparee(p, h, 30), true);
assert.equal(nbReparees(p, h), 1);
assert.equal(controleReussi(p, { [cleDefi(CONTROLE.sim)]: T0 + 9 }), false, 'pas de réussite finale sans code');
const p2 = { ...p, codeOkAt: T0 + 100 };
assert.equal(controleReussi(p2, { [cleDefi(CONTROLE.sim)]: T0 + 50 }), false, 'réussite avant le code : ne compte pas');
assert.equal(controleReussi(p2, { [cleDefi(CONTROLE.sim)]: T0 + 200 }), true);
const p3 = { ...p, indices: { eau: 2, thermique: 1 }, codeEssais: 2 };
assert.equal(malus(p3), 3 * 180 + 120);
assert.equal(malus({ ...p3, mode: 'libre' }), 0);
assert.equal(restant(p, T0 + 5 * 60 * 1000), 50 * 60);
assert.equal(mmss(125), '02:05'); assert.equal(mmss(-61), '−01:01');
MODULES.forEach(m => assert.ok(m.indices.length === 2 && m.panne && m.mission && m.nom, m.id));
console.log('OK : mission Kepler');
