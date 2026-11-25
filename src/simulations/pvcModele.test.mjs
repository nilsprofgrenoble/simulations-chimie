// Test du modèle « cellule photovoltaïque » (sim 242). Usage : node src/simulations/pvcModele.test.mjs
import * as M from './pvcModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.abs(b);
// photon de 500 nm : 3,978e-19 J = 2,486 eV
ok(proche(M.energieJ(500), 6.63e-34 * 3e8 / 500e-9), 'E(500 nm) J'); ok(Math.abs(M.energieEv(500) - 2.486) < 0.002, 'E(500 nm) eV');
// silicium : gap 1,12 eV → 1 110 nm ; réciprocité
ok(Math.abs(M.lambdaMaxNm(1.12) - 1109.9) < 0.5, 'lambda max Si'); ok(proche(M.energieEv(M.lambdaMaxNm(1.3)), 1.3), 'réciprocité');
ok(M.absorbe(600, 1.12) && !M.absorbe(1400, 1.12) && M.absorbe(1100, 1.12) && !M.absorbe(1120, 1.12), 'seuil Si'); ok(!M.absorbe(900, 1.5) && M.absorbe(800, 1.5), 'seuil CdTe');
ok(M.domaine(300) === 'ultraviolet' && M.domaine(550) === 'visible' && M.domaine(900) === 'infrarouge', 'domaines');
// bilan : 800 W/m² × 0,015 m² = 12,0 W ; U × I = 0,50 × 5,0 = 2,5 W ; η = 20,8 % ; pertes 9,5 W
ok(proche(M.recue(800, 0.015), 12), 'P reçue'); ok(proche(M.electrique(0.5, 5), 2.5), 'P él'); ok(Math.abs(M.rendement(2.5, 12) - 0.2083) < 1e-3, 'rendement'); ok(proche(M.pertes(12, 2.5), 9.5), 'pertes');
// conservation de l'énergie : P_reçue = P_él + pertes ; tous les photons du visible > 1,6 eV ; tous les gap de la liste sont absorbés par le bleu
ok(M.CELLULES.every(c => c.eta > 0 && c.eta < 0.35 && c.gap > 1 && c.gap < 2), 'cellules plausibles');
ok(M.CELLULES.every(c => M.absorbe(450, c.gap) && !M.absorbe(1500, c.gap)), 'bleu absorbé, infrarouge lointain non');
// tirages
const rng = M.rngGraine(12345);
for (let k = 0; k < 4000; k++) {
  const a = M.tirageRendement(rng); ok(a.rep3 > 11 && a.rep3 < 24 && Math.abs(M.recue(a.E, a.S) - a.rep1) < 1e-12 && Math.abs(a.U * a.I - a.rep2) < 1e-12, 'tirage rendement');
  ok(M.ecartArrondi(a.rep1) <= 0.03 && M.ecartArrondi(a.rep2) <= 0.03 && M.ecartArrondi(a.rep3) <= 0.03, 'arrondis rendement');
  const b = M.tirageSeuil(rng); ok(Math.abs(M.lambdaMaxNm(b.gap) - b.rep2) < 1e-9 && (M.energieEv(b.L0) >= b.gap) === b.absorbe, 'tirage seuil');
  ok(M.ecartArrondi(b.rep1) <= 0.03 && M.ecartArrondi(b.rep2) <= 0.03 && M.ecartArrondi(b.rep3) <= 0.03, 'arrondis seuil');
}
console.log(`${n} contrôles OK`);
