import assert from 'node:assert/strict';
import { ALCENES, REACTIFS, RES, resultat } from './seleModele.js';
for (const a of Object.keys(ALCENES)) for (const r of Object.keys(REACTIFS)) assert.ok(resultat(a, r), `${a}|${r}`);
// Br2 (anti) et OsO4 (syn) donnent des résultats opposés sur un même alcène acyclique
for (const a of ['Z', 'E']) assert.notEqual(resultat(a, 'Br2').resultat, resultat(a, 'OsO4').resultat);
assert.equal(resultat('Z', 'Br2').resultat, resultat('E', 'OsO4').resultat);
assert.equal(resultat('E', 'Br2').resultat, resultat('Z', 'OsO4').resultat);
assert.equal(REACTIFS.Br2.mode, 'anti'); assert.equal(REACTIFS.OsO4.mode, 'syn'); assert.equal(REACTIFS.H2.mode, 'syn');
// cyclique : syn → cis, anti → trans
assert.match(resultat('cyc', 'H2').resultat, /^cis/); assert.match(resultat('cyc', 'OsO4').resultat, /^cis/); assert.match(resultat('cyc', 'Br2').resultat, /^trans/);
for (const k of Object.keys(RES)) assert.equal(RES[k].desc.length === 0 ? 0 : RES[k].n >= 1, RES[k].desc.length === 0 ? 0 : true);
console.log('seleModele : OK');
