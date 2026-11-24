// Test du classement des exercices REA par type, niveau et chapitre (node src/simulations/realiserParcours.test.mjs)
import assert from 'node:assert/strict';
import { TYPES_REA, typeDe, titreCourt, construireItems, niveauxDuType, chapitresDuNiveauType, filtrer, itemsDuType } from './realiserParcours.js';
import { CHAPITRES } from '../chapitres.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// titres courts
assert.deepEqual(titreCourt('Titrage direct du diiode : équivalence, concentration, masse (1re spé)'), { court: 'Titrage direct du diiode', detail: 'équivalence, concentration, masse' }); n++;
assert.deepEqual(titreCourt('Somme de deux vecteurs (forces)'), { court: 'Somme de deux vecteurs (forces)', detail: '' }); n++;
assert.deepEqual(titreCourt('Effet Doppler : du décalage à la vitesse (TSTL)').court, 'Effet Doppler'); n++;

// types : les exercices transversaux, « vitesses » (qui a un chapitre) reste une conversion, le reste est un calcul de chapitre
const dom1g = 'Interactions et champs', dom2gt = 'Mouvement et vitesse';
const fam = [
  { id: 'simple', groupe: 'Unités', titre: 'Changement d’unité simple' },
  { id: 'vitesses', groupe: 'Unités', titre: 'Vitesses : km·h⁻¹ et m·s⁻¹ (seconde)', domaine: dom2gt },
  { id: 'cs', groupe: 'Résultat numérique', titre: 'Chiffres significatifs et arrondi' },
  { id: 'x1', groupe: 'Formules', titre: 'Un calcul : a, b (1re spé)', domaine: dom1g },
  { id: 'isoler', groupe: 'Formules', titre: 'Isoler une grandeur' },
];
const items = construireItems(fam);
assert.equal(typeDe(fam[1]), 'unites'); n++;
assert.equal(typeDe(fam[3]), 'calcul'); n++;
ok(items.find(i => i.id === 'vitesses').niveaux.includes('2GT'), 'vitesses garde son niveau');
ok(items.find(i => i.id === 'simple').niveaux.length === 0, 'unité simple : sans niveau');
// niveaux, chapitres, filtres
assert.deepEqual(niveauxDuType(items, 'calcul').map(x => x.key), ['1G']); n++;
const ch = chapitresDuNiveauType(items, 'calcul', '1G'); ok(ch.length >= 1 && ch.every(x => x.n > 0 && x.chap.niveau === '1G'), 'chapitres du niveau');
assert.equal(filtrer(items, { type: 'calcul', niv: '1G', ch: ch[0].chap.id }).length, 1); n++;
assert.equal(filtrer(items, { type: 'calcul', niv: '2GT', ch: '' }).length, 0); n++;
assert.equal(itemsDuType(items, 'unites').length, 2); n++;
assert.equal(filtrer(items, { type: 'calcul', niv: '1G', ch: 'chapitre-inexistant' }).length, 0); n++;
ok(TYPES_REA.every(t => t.id && t.nom && t.but), 'chaque type a un nom et un but');
ok(new Set(TYPES_REA.map(t => t.id)).size === TYPES_REA.length, 'identifiants de type uniques');
console.log(`${n} vérifications, 0 échec(s).`);
