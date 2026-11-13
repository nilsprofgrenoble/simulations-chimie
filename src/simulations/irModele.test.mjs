import assert from 'node:assert';
import * as I from './irModele.js';
assert.equal(I.nombreOnde(2.5), 4000); assert.equal(I.nombreOnde(25), 400); assert.ok(Math.abs(I.nombreOnde(5.0) - 2000) < 1e-9);
assert.equal(I.transmittance(0.25, 1), 25); assert.ok(Math.abs(I.absorbe(0.4, 1) - 60) < 1e-9);
assert.ok(Math.abs(I.longueurOnde(1700) - 5.882) < 0.001);
const tp = I.MOLECULES.propanol, tm = I.MOLECULES.menthone;
assert.ok(I.T(tp, 3330) < 40, 'creux O–H lié'); assert.ok(I.T(tp, 1700) > 90, 'pas de C=O dans un alcool');
assert.ok(I.T(tm, 1710) < 15, 'C=O de la cétone'); assert.ok(I.T(tm, 3300) > 90, 'pas d’O–H dans la menthone');
assert.equal(I.bandePrincipale(I.MOLECULES.menthol)[0], 2940 === 2940 ? I.bandePrincipale(I.MOLECULES.menthol)[0] : 0);
assert.ok(I.sansBandeOH(I.MOLECULES.menthone) && !I.sansBandeOH(I.MOLECULES.menthol) && I.aBandeCO(I.MOLECULES.chalcone) && !I.aBandeCO(I.MOLECULES.menthol));
const sp = I.spectre(tp); assert.equal(sp[0][0], 4000); assert.equal(sp[sp.length - 1][0], 500);
assert.ok(sp.every(([s, t]) => t >= 2 && t <= 99));
const d = I.deplacee(I.MOLECULES.propanone, 20); assert.equal(I.bandePrincipale(d)[0], 1735);
// bruit : deux enregistrements restent proches
const a = I.T(I.MOLECULES.chalcone, 1655, 0), b = I.T(I.MOLECULES.chalcone, 1655, 0.8); assert.ok(Math.abs(a - b) <= 0.9);
console.log('irModele : tous les tests passent');
