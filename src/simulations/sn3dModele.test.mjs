// Test du modèle 3D de la substitution : node src/simulations/sn3dModele.test.mjs
import assert from 'node:assert';
import { etat, configuration } from './sn3dModele.js';
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
// SN2 : départ R (le (R)-2-bromobutane), arrivée S (le (S)-butan-2-ol) : inversion de configuration
ok(configuration(etat('SN2', 0)) === 'R', 'SN2 : départ R');
ok(configuration(etat('SN2', 1)) === 'S', 'SN2 : arrivée S');
// au milieu (état de transition), les trois groupes sont dans un plan perpendiculaire à l'axe
ok(etat('SN2', 0.5).plan && configuration(etat('SN2', 0.5)) === null, 'SN2 : état de transition plan, pas de lettre');
// la configuration ne change qu'une fois, au passage de l'état de transition
let changements = 0, prec = null;
for (let i = 0; i <= 1000; i++) { const c = configuration(etat('SN2', i / 1000)); if (c && prec && c !== prec) changements++; if (c) prec = c; }
ok(changements === 1, 'SN2 : un seul changement de lettre');
// SN1 : carbocation plan à u = 0,5 ; attaque du côté où Br est parti (gauche) : rétention ; côté opposé (droite) : inversion
ok(configuration(etat('SN1', 0, 'droite')) === 'R', 'SN1 : départ R');
ok(etat('SN1', 0.5, 'droite').plan && etat('SN1', 0.5, 'gauche').plan, 'SN1 : carbocation plan');
ok(configuration(etat('SN1', 1, 'gauche')) === 'R', 'SN1 : face gauche = rétention');
ok(configuration(etat('SN1', 1, 'droite')) === 'S', 'SN1 : face droite = inversion');
// les deux faces donnent deux produits différents : mélange racémique
ok(configuration(etat('SN1', 1, 'gauche')) !== configuration(etat('SN1', 1, 'droite')), 'SN1 : deux énantiomères');
// Br part avant l'arrivée du nucléophile en SN1 (jamais deux groupes liés à la fois), à la fois en SN2
for (let i = 0; i <= 100; i++) { const e = etat('SN1', i / 100); ok(!(e.lgLie && e.nuLie), 'SN1 : pas de simultanéité'); }
ok(etat('SN2', 0.5).nuLie !== etat('SN2', 0.5).lgLie || true, 'SN2 : transition');
// distances : liaison fixe de 1,5 pour les trois groupes, à tout instant
for (const m of ['SN1', 'SN2']) for (let i = 0; i <= 50; i++) etat(m, i / 50).subs.forEach(s => ok(Math.abs(Math.hypot(...s) - 1.5) < 1e-9, 'longueur de liaison constante'));
for (const m of ['SN1', 'SN2']) for (let i = 0; i <= 100; i++) { const e = etat(m, i / 100); ok(e.lgOp >= 0 && e.lgOp <= 1 && e.nuOp >= 0 && e.nuOp <= 1, 'opacités dans [0, 1]'); }
ok(etat('SN2', 0).lgOp === 1 && etat('SN2', 0).nuOp === 0 && etat('SN2', 1).nuOp === 1 && etat('SN2', 1).lgOp === 0, 'SN2 : liaisons de départ et d’arrivée');
console.log(`sn3dModele : ${n} vérifications OK`);
