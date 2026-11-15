import assert from 'node:assert/strict';
import * as M from './oeilLoupeModele.js';
const proche = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);

// œil au repos : objet à l'infini, f′ = L, image sur la rétine
proche(M.focaleOeil(Infinity), 17);
assert.ok(M.netteRetine(Infinity, 17));
// accommodation : objet à 25 cm = 250 mm
const f25 = M.focaleOeil(250);
proche(f25, 15.917, 1e-3);
assert.ok(f25 < 17);
proche(M.positionImageOeil(250, f25), 17);
assert.ok(M.netteRetine(250, f25));
assert.ok(!M.netteRetine(250, 17));                       // œil au repos : l'image est derrière la rétine
assert.ok(M.positionImageOeil(250, 17) > 17);
assert.ok(M.tacheRetine(250, 17) > 0.1 && M.tacheRetine(250, f25) < 1e-9);
// plus l'objet est loin, plus f′ est grande
assert.ok(M.focaleOeil(500) > M.focaleOeil(250));
// image rétinienne : renversée, gamma = −L/D
proche(M.grandissementOeil(250, f25), -17 / 250);
proche(M.hauteurRetine(250, f25, 20), -1.36);
// diamètre apparent
proche(M.diametreApproche(20, 500), 0.04);
assert.ok(Math.abs(M.diametreApparent(20, 500) - 0.04) < 1e-4);
assert.ok(M.separes(0.10 / 250) && !M.separes(0.10 / 500));
proche(0.10 / 250, 4e-4);
// loupe
proche(M.grossissement(2.5), 10);
proche(M.grossissement(5), 5);
proche(M.thetaPrime(0.5, 5) / M.thetaNu(0.5), 5, 0.01);   // G = θ′/θ ≈ dm/f′
proche(M.grossissementPosition(5), M.grossissement(5));
assert.ok(M.imageALInfini(5, 5) && !M.imageALInfini(3, 5));
const im = M.imageLoupe(4.5, 5);
proche(im.OAp, -45);
assert.equal(im.nature, 'virtuelle');
proche(M.accommodationPourImage(4.5, 5), 1 / (1 / 17 + 1 / 450));
assert.equal(M.accommodationPourImage(3, 5), null);        // image à 7,5 cm : plus près que dm, vue floue
proche(M.accommodationPourImage(5, 5), 17);                // image à l'infini : œil au repos
assert.equal(M.accommodationPourImage(8, 5), null);        // objet au-delà de F : image réelle
// rayons de la loupe : R1 et R2 se coupent (prolongements) en B′
const R = M.rayonsLoupe(3, 5, 0.5);
const B1 = R.r1.dir, B2 = R.r2.dir;
const yR1 = x => 0.5 + (B1[1] / B1[0]) * x, yR2 = x => (B2[1] / B2[0]) * x;
const xp = M.imageLoupe(3, 5).OAp;
proche(yR1(xp), yR2(xp));
proche(yR2(xp), M.imageLoupe(3, 5).gamma * 0.5);
console.log('oeilLoupeModele : tous les tests passent');
