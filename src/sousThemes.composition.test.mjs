// Structure des sous-thèmes du chapitre tg-composition : node src/sousThemes.composition.test.mjs
// (le classement de chaque exercice du chapitre est vérifié, banques à l'appui, par le contrôle fait lors de l'intégration)
import assert from 'node:assert/strict';
import ST from './sousThemes.composition.js';
import { CHAPITRES } from './chapitres.js';

const sts = ST['tg-composition'];
assert.ok(CHAPITRES.some(c => c.id === 'tg-composition'));
assert.ok(sts.length >= 5 && sts.length <= 8, 'entre 5 et 8 sous-thèmes');
const refs = sts.flatMap(s => { assert.ok(s.id && s.nom && s.capacite && s.refs.length, `sous-thème incomplet ${s.id}`); return s.refs; });
assert.equal(new Set(refs).size, refs.length, 'référence en double');
assert.equal(new Set(sts.map(s => s.id)).size, sts.length, 'identifiant en double');
console.log(`sousThemes.composition : ${sts.length} sous-thèmes, ${refs.length} références OK`);
