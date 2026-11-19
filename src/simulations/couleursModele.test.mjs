import assert from 'node:assert/strict';
import * as M from './couleursModele.js';

const N = (c) => M.nomCouleur(c);
// synthèse additive : couleurs primaires et secondaires
assert.equal(N(M.additif(M.COULEURS.rouge, M.COULEURS.vert)), 'jaune');
assert.equal(N(M.additif(M.COULEURS.vert, M.COULEURS.bleu)), 'cyan');
assert.equal(N(M.additif(M.COULEURS.rouge, M.COULEURS.bleu)), 'magenta');
assert.equal(N(M.additif(M.COULEURS.rouge, M.COULEURS.vert, M.COULEURS.bleu)), 'blanc');
assert.equal(N(M.additif()), 'noir');
// complémentaires : leur somme est du blanc
for (const [a, b] of [['rouge', 'cyan'], ['vert', 'magenta'], ['bleu', 'jaune']]) {
  assert.deepEqual(M.complementaire(M.COULEURS[a]), M.COULEURS[b]);
  assert.equal(N(M.additif(M.COULEURS[a], M.COULEURS[b])), 'blanc');
}
// synthèse soustractive : filtres sur lumière blanche
const B = M.COULEURS.blanc, J = M.COULEURS.jaune, C = M.COULEURS.cyan, Mg = M.COULEURS.magenta;
assert.equal(N(M.traverse(B, J)), 'jaune');
assert.equal(N(M.traverse(M.traverse(B, J), C)), 'vert');
assert.equal(N(M.traverse(M.traverse(B, C), Mg)), 'bleu');
assert.equal(N(M.traverse(M.traverse(B, J), Mg)), 'rouge');
assert.equal(N(M.traverse(M.traverse(M.traverse(B, J), C), Mg)), 'noir');
// objets : couleur perçue
const tom = M.objet('tomate').v, cit = M.objet('citron').v;
assert.equal(M.couleurPercue(B, tom), 'rouge');
assert.equal(M.couleurPercue(M.COULEURS.vert, tom), 'noir');
assert.equal(M.couleurPercue(M.COULEURS.rouge, cit), 'rouge');
assert.equal(M.couleurPercue(M.COULEURS.bleu, cit), 'noir');
assert.equal(M.couleurPercue(C, cit), 'vert');
assert.equal(M.couleurPercue(M.COULEURS.jaune, cit), 'jaune');
assert.equal(M.couleurPercue(B, M.objet('ardoise').v), 'noir');
assert.equal(M.couleurPercue(Mg, M.objet('papier').v), 'magenta');
// un objet absorbe la couleur complémentaire de sa couleur perçue (en lumière blanche)
for (const o of M.OBJETS.filter(o => !['papier', 'ardoise'].includes(o.id))) {
  assert.deepEqual(M.absorbe(B, o.v), M.complementaire(o.v), o.id);
}
// aucune lumière ne rend la feuille blanche noire ; l'ardoise est toujours noire
assert.equal(M.lumieresNoires(M.objet('papier')).length, 0);
assert.equal(M.lumieresNoires(M.objet('ardoise')).length, M.LUMIERES.length);
assert.deepEqual(M.lumieresNoires(cit).map(l => l.id), ['bleue']);
assert.deepEqual(M.lumieresNoires(tom).map(l => l.id), ['verte', 'bleue', 'cyan']);
// noms de couleurs intermédiaires
assert.equal(N([1, 0.5, 0]), 'orange');
assert.equal(N([1, 0.5, 0.5]), 'rose');
assert.equal(N([0.5, 0.5, 0.5]), 'gris');
assert.equal(N([0.5, 0, 1]), 'magenta');
// bilan et phrases
const b = M.bilan(B, cit);
assert.equal(M.listeBandes(b.absorbee), 'bleu');
assert.equal(M.listeBandes(b.renvoyee), 'rouge et vert');
assert.equal(M.listeBandes([0, 0, 0]), 'aucune');
assert.match(M.phrase(M.COULEURS.bleu, cit, false), /Couleur perçue : noir/);
// dosage
assert.ok(M.dosageJuste([100, 60, 0], [100, 50, 0]));
assert.ok(!M.dosageJuste([100, 70, 0], [100, 50, 0]));
console.log('couleursModele : OK');
