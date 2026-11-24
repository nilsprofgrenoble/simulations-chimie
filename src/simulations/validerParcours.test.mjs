// Test du classement des exercices VAL par type, niveau, chapitre et difficulté (node src/simulations/validerParcours.test.mjs)
import assert from 'node:assert/strict';
import { TYPES_VAL, construireItemsVal } from './validerParcours.js';
import { filtrer, itemsDuType, niveauxDuType, chapitresDuNiveauType, difficultesDuType, sanitiser, ENSEIGNEMENTS, enseignementDe, enseignementsDuNiveauType, nomChapitre } from '../parcoursCommun.js';
import { CHAPITRES } from '../chapitres.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// Petite banque : deux exercices plausibles (1G et TSTL), un compatible, une décision
// domaines réservés à un seul niveau (certains, comme « Chimie », sont partagés entre 1G et BTS)
const exclusif = niv => CHAPITRES.filter(c => c.niveau === niv).flatMap(c => c.domaines).find(d => CHAPITRES.filter(c => c.domaines.includes(d)).every(c => c.niveau === niv));
const dom1g = exclusif('1G'), domT = exclusif('TSTL');
const fams = [
  { id: 'plausible', liste: [{ id: 'a', titre: 'A', domaine: dom1g, niveau: 1 }, { id: 'b', titre: 'B', domaine: domT, niveau: 2 }, { id: 'c', titre: 'C', domaine: domT, niveau: 2 }] },
  { id: 'compat', liste: [{ id: 'd', titre: 'D', domaine: dom1g, niveau: 3 }] },
  { id: 'decision', liste: [{ id: 'e', titre: 'E', domaine: domT, niveau: 1 }] },
];
const items = construireItemsVal(fams);
assert.deepEqual(items.map(i => i.id), ['plausible.a', 'plausible.b', 'plausible.c', 'compat.d', 'decision.e']); n++;   // même forme que l'adresse ?ex=
ok(items[0].cle === '77:plausible:a', 'clé de progression = clé du suivi de l’atelier');
ok(items.every(i => i.chapitres.length > 0 && i.niveaux.length > 0), 'chaque exercice est rattaché à un chapitre');

// types, niveaux, chapitres
ok(itemsDuType(items, 'plausible').length === 3, 'trois plausibles');
assert.deepEqual(niveauxDuType(items, 'plausible').map(x => x.key).sort(), ['1G', 'TSTL']); n++;
ok(filtrer(items, { type: 'plausible', niv: 'TSTL' }).length === 2, 'niveau TSTL');
const chT = chapitresDuNiveauType(items, 'plausible', 'TSTL');
ok(chT.length > 0 && chT.every(x => x.chap.niveau === 'TSTL' && x.n > 0), 'chapitres du niveau');
ok(filtrer(items, { type: 'plausible', niv: 'TSTL', ch: chT[0].chap.id }).length > 0, 'filtre par chapitre');

// difficulté
ok(filtrer(items, { type: 'plausible', dif: '2' }).length === 2, 'difficulté 2');
ok(filtrer(items, { type: 'plausible', niv: '1G', dif: '2' }).length === 0, 'difficulté et niveau se cumulent');
assert.deepEqual(difficultesDuType(items, { type: 'plausible', niv: '', ch: '' }, TYPES_VAL[0]).map(d => [d.dif, d.n]), [['1', 1], ['2', 2], ['3', 0]]); n++;

// sélection : anciennes adresses ?ex=famille.exercice, valeurs invalides ignorées
const s1 = sanitiser({ type: '', niv: '', ch: '', dif: '', ex: 'plausible.b' }, items, TYPES_VAL);
ok(s1.type === 'plausible' && s1.niv === 'TSTL' && s1.ex === 'plausible.b' && s1.ch, 'arrivée directe : fil d’Ariane reconstitué');
const s2 = sanitiser({ type: 'decision', niv: 'TSTL', ch: 'nimporte', dif: '2', ex: '' }, items, TYPES_VAL);
ok(s2.type === 'decision' && s2.niv === '' && s2.ch === '' && s2.dif === '', 'type sans filtre : niveau, chapitre, difficulté ignorés');
const s3 = sanitiser({ type: 'plausible', niv: '1G', ch: '', dif: '9', ex: '' }, items, TYPES_VAL);
ok(s3.niv === '1G' && s3.dif === '', 'difficulté inconnue ignorée');
ok(sanitiser({ type: 'zzz', niv: '', ch: '', dif: '', ex: 'zzz.q' }, items, TYPES_VAL).type === '', 'type inconnu');

// enseignements de TSTL (PCM, SPCL : systèmes et procédés, ondes, chimie et développement durable)
assert.deepEqual(ENSEIGNEMENTS.TSTL.map(e => e.key), ['pcm', 'sp', 'ondes', 'cdd']); n++;
ok(CHAPITRES.filter(c => c.niveau === 'TSTL').every(c => enseignementDe(c)), 'tout chapitre TSTL a un enseignement');
ok(CHAPITRES.filter(c => c.niveau !== 'TSTL').every(c => enseignementDe(c) === ''), 'les autres niveaux n’en ont pas');
const chSp = CHAPITRES.find(c => c.niveau === 'TSTL' && enseignementDe(c) === 'sp');
const itSp = { id: 'plausible.z', cle: 'z', type: 'plausible', dif: 1, niveaux: ['TSTL'], chapitres: [chSp.id] };
ok(filtrer([itSp], { type: 'plausible', niv: 'TSTL', ens: 'sp' }).length === 1 && filtrer([itSp], { type: 'plausible', niv: 'TSTL', ens: 'pcm' }).length === 0, 'filtre par enseignement');
ok(enseignementsDuNiveauType([itSp], 'plausible', 'TSTL').map(e => e.key).join() === 'sp', 'enseignements non vides');
const s4 = sanitiser({ type: 'plausible', niv: 'TSTL', ens: 'pcm', ch: chSp.id, dif: '', ex: '' }, [itSp], TYPES_VAL);
ok(s4.ens === 'pcm' && s4.ch === '', 'chapitre d’un autre enseignement refusé');
ok(sanitiser({ type: '', niv: '', ens: '', ch: '', dif: '', ex: 'plausible.z' }, [itSp], TYPES_VAL).ens === 'sp', 'arrivée directe : enseignement reconstitué');
ok(!/^[^\p{L}\p{N}]/u.test(nomChapitre(chSp)), 'nom de chapitre sans émoji de tête');

// banque réelle : chaque exercice est classé, aucun doublon
const { FAMILLES } = await import('./AtelierValiderBanque.js');
const reels = construireItemsVal(FAMILLES);
ok(new Set(reels.map(i => i.id)).size === reels.length, 'identifiants uniques');
ok(reels.every(i => TYPES_VAL.some(t => t.id === i.type)), 'tout exercice a un type');
ok(reels.every(i => i.chapitres.length > 0), 'tout exercice a un chapitre');
for (const t of TYPES_VAL) ok(itemsDuType(reels, t.id).length > 0, `type ${t.id} non vide`);
console.log(`${n} vérifications, 0 échec(s).`);
