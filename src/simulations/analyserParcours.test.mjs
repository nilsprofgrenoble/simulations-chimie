// Test du classement des exercices ANA par type, niveau et chapitre (node src/simulations/analyserParcours.test.mjs)
import assert from 'node:assert/strict';
import { TYPES_ANA, typeDeFamille, construireItemsAna } from './analyserParcours.js';
import { filtrer, itemsDuType, sanitiser } from '../parcoursCommun.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

assert.equal(typeDeFamille('champ'), 'schema'); n++;
assert.equal(typeDeFamille('mouvement'), 'schema'); n++;
assert.equal(typeDeFamille('prevoir'), 'prevoir'); n++;

// La banque réelle importe des fichiers .jsx (figures) que node seul ne lit pas : ces vérifications sont faites quand l'import réussit
// (la vérification complète sur la banque réelle est aussi faite en regroupant le code avec esbuild, voir le suivi du projet).
let FAMILLES = null;
try { ({ FAMILLES } = await import('./AtelierAnalyserBanque.js')); } catch { /* .jsx non lisible sans transformation */ }
if (!FAMILLES) FAMILLES = [
  { id: 'probleme', liste: [{ id: 'p1', titre: 'P1', domaine: 'Transport des fluides' }] },
  { id: 'prevoir', liste: [{ id: 'v1', titre: 'V1', domaine: 'Transport des fluides' }, { id: 'v2', titre: 'V2', domaine: 'Ondes' }] },
  { id: 'champ', liste: [{ id: 'c1', titre: 'C1', domaine: 'Interactions et champs' }] },
  { id: 'mouvement', liste: [{ id: 'm1', titre: 'M1', domaine: 'Mouvement et vitesse' }] },
  { id: 'algorithme', liste: [{ id: 'a1', titre: 'A1', domaine: 'Régulation' }] },
  { id: 'relation', liste: [{ id: 'r1', titre: 'R1', domaine: 'Transport des fluides' }] },
  { id: 'hypothese', liste: [{ id: 'h1', titre: 'H1', domaine: 'Transport des fluides' }] },
];
const items = construireItemsAna(FAMILLES);
ok(new Set(items.map(i => i.id)).size === items.length, 'identifiants uniques (famille.exercice)');
ok(items.length === FAMILLES.reduce((t, f) => t + f.liste.length, 0), 'aucun exercice perdu');
ok(items.every(i => TYPES_ANA.some(t => t.id === i.type)), 'tout exercice a un type');
ok(items.every(i => i.chapitres.length > 0 && i.niveaux.length > 0), 'tout exercice a un chapitre');
for (const t of TYPES_ANA) ok(itemsDuType(items, t.id).length > 0, `type ${t.id} non vide`);
ok(itemsDuType(items, 'schema').length === FAMILLES.find(f => f.id === 'champ').liste.length + FAMILLES.find(f => f.id === 'mouvement').liste.length, 'schema = champ + mouvement');
ok(items.find(i => i.id.startsWith('champ.')).cle.startsWith('37:champ:'), 'clé de suivi conservée');

// les anciennes adresses ?ex=famille.exercice restent valables
const ch = items.find(i => i.fam === 'champ');
const s = sanitiser({ type: '', niv: '', ens: '', ch: '', dif: '', ex: ch.id }, items, TYPES_ANA);
ok(s.type === 'schema' && s.ex === ch.id, 'ancien lien vers un champ → type schéma');
const pr = items.find(i => i.type === 'prevoir');
const s2 = sanitiser({ type: '', niv: '', ens: '', ch: '', dif: '', ex: pr.id }, items, TYPES_ANA);
ok(s2.type === 'prevoir' && s2.niv && s2.ch, 'prévoir : fil d’Ariane reconstitué');
ok(filtrer(items, { type: 'prevoir', niv: s2.niv, ch: s2.ch }).some(i => i.id === pr.id), 'l’exercice est dans sa liste');
ok(itemsDuType(items, 'prevoir').every(i => i.detail === ''), 'gros types : pas de détail (déjà rangés par chapitre)');
ok(itemsDuType(items, 'algorithme').every(i => i.detail), 'petits types : thème affiché');
console.log(`${n} vérifications, 0 échec(s).`);
