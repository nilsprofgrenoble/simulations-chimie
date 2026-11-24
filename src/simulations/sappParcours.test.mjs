// Test du classement des exercices S'APP par type, niveau et chapitre (node src/simulations/sappParcours.test.mjs)
import assert from 'node:assert/strict';
import { TYPES_SAPP, construireItemsSapp } from './sappParcours.js';
import { filtrer, itemsDuType, sanitiser } from '../parcoursCommun.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// Banque réelle si node sait la lire (certains fichiers importés sont des .jsx) ; sinon petite banque de contrôle
let src = null;
try {
  const [{ ENONCES }, { SITUATIONS }, { SCENARIOS }] = await Promise.all([import('./AtelierDonneesBanque.js'), import('./AtelierSituationsBanque.js'), import('./AtelierGraphiqueBanque.js')]);
  src = { enonces: ENONCES, situations: SITUATIONS, scenarios: SCENARIOS };
} catch { /* .jsx non lisible sans transformation */ }
if (!src) src = {
  enonces: [{ id: 'reservoir', titre: 'Un réservoir', domaine: 'Transport des fluides', noms: ['Volume', 'Durée'] }, { id: 'cuve', titre: 'Une cuve', domaine: 'Transport des fluides', noms: ['Hauteur'] }],
  situations: [{ id: 'regul', titre: 'Un régulateur', domaine: 'Régulation' }],
  scenarios: [{ id: 'manometre', titre: () => 'Un manomètre (eau)', domaine: 'Transport des fluides' }, { id: 'sondeur', titre: () => 'Un sondeur', domaine: 'Ondes' }],
};
const items = construireItemsSapp(src);
const nb = (t) => items.filter(i => i.type === t).length;
ok(nb('donnees') === src.enonces.reduce((t, e) => t + e.noms.length, 0), 'un exercice par question d’énoncé');
ok(nb('situation') === src.situations.length && nb('graphique') === src.scenarios.length, 'situations et graphiques');
ok(new Set(items.map(i => i.id)).size === items.length, 'identifiants uniques (aucune collision entre types)');
ok(items.every(i => i.chapitres.length > 0 && i.niveaux.length > 0), 'tout exercice a un chapitre');
for (const t of TYPES_SAPP) ok(itemsDuType(items, t.id).length > 0, `type ${t.id} non vide`);

// clés de progression = clés du suivi des ateliers 34 et 35 ; identifiants = adresses ?ex=… utilisées par « Je m'entraîne ! » et les devoirs
const e0 = src.enonces[0];
ok(items.some(i => i.id === `${e0.id}.0` && i.cle === `34:${e0.id}.0` && i.atelier === 34), 'énoncé : id « énoncé.0 », atelier 34');
ok(items.find(i => i.type === 'situation').cle.startsWith('34:'), 'situation : atelier 34');
ok(items.find(i => i.type === 'graphique').cle.startsWith('35:') && items.find(i => i.type === 'graphique').atelier === 35, 'graphique : atelier 35');

// arrivée directe sur un exercice : fil d'Ariane reconstitué
const d = items.find(i => i.type === 'donnees');
const s = sanitiser({ type: '', niv: '', ens: '', ch: '', dif: '', ex: d.id }, items, TYPES_SAPP);
ok(s.type === 'donnees' && s.niv && s.ch && filtrer(items, { type: s.type, niv: s.niv, ch: s.ch }).some(i => i.id === d.id), 'énoncé : fil d’Ariane reconstitué');
const g = items.find(i => i.type === 'graphique');
const s2 = sanitiser({ type: '', niv: '', ens: '', ch: '', dif: '', ex: g.id }, items, TYPES_SAPP);
ok(s2.type === 'graphique' && s2.niv === '' && s2.ex === g.id, 'graphique : liste directe, sans niveau');
console.log(`${n} vérifications, 0 échec(s).`);
