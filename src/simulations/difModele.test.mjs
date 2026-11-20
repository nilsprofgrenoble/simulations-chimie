// Contrôle du modèle de la simulation 181 : node src/simulations/difModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './difModele.js';
const proche = (x, y, t = 1e-9) => Math.abs(x - y) <= t * Math.max(1, Math.abs(y));
// angle caractéristique
assert.ok(proche(M.thetaPetit(1, 4), 0.25)); assert.ok(proche(M.thetaPetit(532e-9, 100e-6), 5.32e-3));
assert.ok(proche(M.thetaExact(1, 4), Math.asin(0.25))); assert.equal(M.thetaExact(2, 1), null); assert.equal(M.thetaExact(1, 1), null);
assert.ok(M.ecartPetitAngle(1, 4) < 0.011, 'λ/a = 0,25 : écart du petit angle ≈ 1 %'); assert.ok(M.ecartPetitAngle(532e-9, 100e-6) < 1e-4);
// largeur de la tache : L = 2 λ D / a ; θ = L/(2D) ; aller-retour
const a = 100e-6, lam = 532e-9, D = 2, L = M.largeurTache(a, lam, D);
assert.ok(proche(L, 21.28e-3, 1e-4)); assert.ok(proche(M.thetaDepuisL(L, D), lam / a)); assert.ok(proche(M.aDepuisTheta(lam, M.thetaDepuisL(L, D)), a));
assert.ok(proche(M.aDepuisL(lam, D, L), a)); assert.ok(proche(M.lambdaDepuisL(a, D, L), lam));
// la première extinction du modèle d'intensité est bien en x = L/2 (petits angles) et le centre vaut 1
assert.ok(proche(M.intensite(a, lam, D, 0), 1)); assert.ok(M.intensite(a, lam, D, L / 2) < 1e-6, 'extinction en L/2');
assert.ok(M.intensite(a, lam, D, L / 4) > 0.3 && M.intensite(a, lam, D, 0.75 * L) < 0.06, 'pic central puis lobe secondaire faible');
// son : λ = v/f
assert.ok(proche(M.lambdaSon(340), 1.0)); assert.ok(proche(M.lambdaSon(170), 2.0));
// tableau des situations : classement des rapports λ/a (voix > cuve > laser > lumière du jour) et valeurs
const r = Object.fromEntries(M.SITUATIONS.map(s => [s.id, M.rapport(s.lam, s.a)]));
assert.ok(r.voix > r.cuve && r.cuve > r.laser && r.laser > r.jour, JSON.stringify(r));
assert.ok(proche(r.cuve, 0.5) && proche(r.voix, 1.25) && proche(r.laser, 5.32e-3, 1e-6) && proche(r.jour, 6.25e-7, 1e-6));
// défis : 20 000 tirages, tache centrale dans le cadrage, résolution de pointage suffisante (2 pixels sur chaque repère) devant la tolérance
let pire = 0, nb = 0; const vus = new Set();
for (let i = 0; i < 20000; i++) {
  for (const t of ['a', 'lambda']) {
    const d = M.tirageDefi(t), z = M.zoomPour(d.L), W = M.ZOOMS[z];
    assert.ok(d.L / 2 <= 0.8 * W + 1e-9, `L ${d.L} hors cadrage ${W}`);
    const err = 2 * 2 * M.mmParPixel(W) / 2 / d.L;     // deux repères, chacun à 2 pixels près
    pire = Math.max(pire, err); nb++; vus.add(`${d.a}-${d.lam}-${d.D}`);
  }
}
assert.ok(pire < M.TOL_DEFI / 2, `pire écart de pointage ${pire}`);
console.log(`difModele : OK (${nb} tirages de défi, ${vus.size} combinaisons, pire erreur relative de pointage ${(100 * pire).toFixed(2)} % pour une tolérance de ${100 * M.TOL_DEFI} %)`);
