import assert from 'node:assert/strict';
import { vide, inserer, insererTexte, fraction, puissance, racine, supprimer, deplacer, serialiser, depuisTexte } from './editeurMaths.js';
import { calculer } from './calculatrice.js';
const tape = (s, txt) => [...txt].reduce(inserer, s);
const ser = s => serialiser(s.t);
const val = s => calculer(ser(s));
// texte simple
let s = tape(vide(), '1+2*3'); assert.equal(ser(s), '1+2×3'); assert.equal(val(s), 7);
// fraction avec capture du numérateur : 1/3
s = tape(vide(), '1/3'); assert.deepEqual(s.t, ['FO', '1', 'FS', '3', 'FC']); assert.equal(s.c, 4); assert.ok(Math.abs(val(s) - 1 / 3) < 1e-12);
// 1+2/3 : seul « 2 » est capturé
s = tape(vide(), '1+2/3'); assert.ok(Math.abs(val(s) - (1 + 2 / 3)) < 1e-12);
// (1+2)/3 : parenthèse capturée
s = tape(vide(), '(1+2)/3'); assert.equal(val(s), 1); assert.deepEqual(s.t.slice(0, 2), ['FO', '(']);
// sin(30)/2 : nom de fonction capturé avec ses parenthèses
s = tape(vide(), 'sin(30)/2'); assert.ok(Math.abs(val(s) - 0.25) < 1e-12);
// fraction vide : curseur dans le numérateur, flèche bas = dénominateur
s = fraction(vide()); assert.equal(s.c, 1); s = inserer(s, '5'); s = deplacer(s, 'b'); s = inserer(s, '4'); assert.equal(val(s), 1.25); s = deplacer(s, 'h'); assert.equal(s.c, 1);
// exposant : 2^3 = 8, sortie avec la flèche droite puis suite du calcul
s = tape(vide(), '2^3'); assert.deepEqual(s.t, ['2', 'PO', '3', 'PC']); assert.equal(val(s), 8); s = deplacer(s, 'd'); s = tape(s, '+1'); assert.equal(val(s), 9);
// 6,02×10^23 / 12 : la fraction prend « 10^23 » ou seulement 12 selon l'endroit où l'on tape ; ici : ×10^(23) puis sortie puis ÷
s = tape(vide(), '6,02×10^23'); s = deplacer(s, 'd'); s = tape(s, '÷12'); assert.ok(Math.abs(val(s) - 6.02e23 / 12) / (6.02e23 / 12) < 1e-12);
// 10^(−3)
s = tape(vide(), '10^-3'); assert.ok(Math.abs(val(s) - 1e-3) < 1e-15);
// fraction avec exposant dans le numérateur : (2^3)/4 en tapant 2^3 puis flèche droite puis / (capture de la puissance entière)
s = tape(vide(), '2^3'); s = deplacer(s, 'd'); s = tape(s, '/4'); assert.equal(val(s), 2); assert.deepEqual(s.t.slice(0, 5), ['FO', '2', 'PO', '3', 'PC']);
// racine
s = racine(vide()); s = tape(s, '16'); assert.equal(val(s), 4);
// touche x² : exposant 2 et curseur sorti
s = tape(vide(), '5'); s = puissance(s, ['2'], true); s = tape(s, '+1'); assert.equal(val(s), 26);
// retour arrière
s = tape(vide(), '12'); s = supprimer(s); assert.equal(ser(s), '1');
s = fraction(vide()); s = supprimer(s); assert.deepEqual(s.t, [], 'fraction vide supprimée');
s = puissance(tape(vide(), '2')); s = supprimer(s); assert.deepEqual(s.t, ['2'], 'exposant vide supprimé');
s = tape(vide(), '1/3'); s = supprimer(s); assert.deepEqual(s.t, ['FO', '1', 'FS', 'FC']); assert.equal(s.c, 3); s = supprimer(s); assert.equal(s.c, 2, 'au début du dénominateur : on revient au bout du numérateur'); s = supprimer(s); assert.deepEqual(s.t, ['FO', 'FS', 'FC']); s = supprimer(s); assert.deepEqual(s.t, [], 'fraction entièrement vide supprimée');
s = tape(vide(), '1/3'); s = deplacer(s, 'd'); s = supprimer(s); assert.equal(s.c, 4, 'on entre dans la fraction');
// déplacements gauche / droite : bornes
s = tape(vide(), '12'); s = deplacer(s, 'd'); assert.equal(s.c, 2); s = deplacer(deplacer(deplacer(s, 'g'), 'g'), 'g'); assert.equal(s.c, 0);
// haut/bas hors fraction : rien
s = tape(vide(), '12'); assert.equal(deplacer(s, 'h'), s);
// exposant dans un dénominateur : bas/haut ne se trompent pas
s = tape(vide(), '1/2^3'); assert.ok(s.t.includes('PO')); s = deplacer(s, 'h'); assert.equal(s.c, 1, 'haut depuis l\'exposant du dénominateur → début du numérateur');
// depuisTexte / serialiser aller-retour
for (const x of ['6,02×10^(23)', '1,6×10^(-19)', '2×(3+4)^(2)+1']) assert.equal(serialiser(depuisTexte(x)).replace('−', '-'), x.replace('−', '-'));
assert.deepEqual(depuisTexte('1,2×10^(-3)').filter(x => x === 'PO' || x === 'PC').length, 2);
// parenthèses non fermées dans une fraction
s = tape(vide(), '(1+2'); s = tape(s, '/4'); assert.equal(val(s), 1.5);   // « 2 » seul est le numérateur
console.log('éditeur mathématique : tous les tests passent');
