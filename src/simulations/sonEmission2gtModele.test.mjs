// Tests du modèle « le son : émission et propagation » 2GT : node src/simulations/sonEmission2gtModele.test.mjs
import * as M from './sonEmission2gtModele.js';
let ko = 0;
const proche = (nom, x, ref, tolRel) => { const ok = Math.abs(x - ref) <= Math.abs(ref) * tolRel; if (!ok) { ko++; console.log(`✗ ${nom} : ${x} au lieu de ${ref}`); } else console.log(`✓ ${nom}`); };
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };
// calculs faits à part, à la main
proche('exemple : 17 m en 0,050 s → 340 m/s', M.vitesse(17, 0.050), 340, 1e-12);
proche('étape : 34 m en 0,11 s → 309 m/s', M.vitesse(34, 0.11), 309.09, 1e-4);
proche('Δt à 0,10 s → 340 ; à 0,12 s → 283', M.vitesse(34, 0.12), 283.33, 1e-4);
proche('orage : 7,0 s → 2 380 m', M.distance(340, 7.0), 2380, 1e-12);
proche('retard : 1,7 km dans l’air → 5,0 s', M.retard(1700, 340), 5.0, 1e-12);
proche('10 m/s = 36 km/h', M.kmhDepuisMs(10), 36, 1e-12);
proche('340 m/s = 1 224 km/h', M.kmhDepuisMs(340), 1224, 1e-12);
proche('90 km/h = 25 m/s', M.msDepuisKmh(90), 25, 1e-12);
proche('900 km/h = 250 m/s', M.msDepuisKmh(900), 250, 1e-12);
proche('vitesse à 30 °C : 346 m/s', M.vAirTemperature(30), 346, 1e-12);
vrai('à 20 °C : 340 m/s', M.vAirTemperature(20) === 340);
// cohérence du tableau des vitesses courantes (m/s ↔ km/h, à l'arrondi près)
for (const v of M.VITESSES) { if (v.id === 'son') continue; proche(`${v.nom} : m/s et km/h cohérents`, M.kmhDepuisMs(v.ms), v.kmh, 0.07); }
proche('son : 340 m/s ≈ 1 200 km/h', M.kmhDepuisMs(340), 1200, 0.03);
proche('lumière : 3,0e8 m/s ≈ 1,1e9 km/h', M.kmhDepuisMs(3e8), 1.1e9, 0.02);
// écriture
vrai('nb 340 → « 340 »', M.nb(340) === '340');
vrai('nb 2380 (2 CS) → « 2 400 » insécable', M.nb(2380) === '2\u00a0400');
vrai('nb 1224 (2 CS) → « 1 200 »', M.nb(1224) === '1\u00a0200');
vrai('nb 340 → « 340 »', M.nb(340) === '340');
vrai('nb 0,15 → « 0,15 »', M.nb(0.15) === '0,15');
vrai('entier 1224 → « 1 224 » insécable', M.entier(1224) === '1 224');
vrai('duree 0,002 → « 2,0 ms »', M.duree(0.002) === '2,0 ms');
vrai('duree 0,15 → « 0,15 s »', M.duree(0.15) === '0,15 s');
vrai('longueur 1700 → « 1,7 km »', M.longueur(1700) === '1,7 km');
// défis : 3 000 tirages
let okMesure = true, okPrev = true;
for (let i = 0; i < 3000; i++) {
  const d = M.tirerDefiMesure(null);
  if (!(isFinite(d.vrai) && d.vrai > 0 && d.dt > 0 && Math.abs(d.vrai - M.milieu(d.mid).v) / M.milieu(d.mid).v < 0.15)) okMesure = false;
  // un élève qui arrondit d / Δt à 2 chiffres significatifs doit être accepté ; la valeur connue (340, 1 500, 5 000) ne doit pas l'être
  if (Math.abs(M.arrondiSig(d.vrai, 2) - d.vrai) / d.vrai > d.tol) okMesure = false;
  if (Math.abs(d.nominal - d.vrai) / d.vrai <= d.tol) okMesure = false;
  const p = M.tirerDefiPrevoir(null);
  if (!(isFinite(p.vrai) && p.vrai > 0 && Math.abs(M.arrondiSig(p.vrai, 2) - p.vrai) / p.vrai < 0.06)) okPrev = false;
  if (p.cas === 'orage' && Math.abs(p.vrai - 0.34 * p.dt) > 1e-9) okPrev = false;
}
vrai('défi mesure : 3 000 tirages cohérents (v proche du milieu, arrondi 2 CS dans 6 %)', okMesure);
vrai('défi prévoir : 3 000 tirages cohérents', okPrev);
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTout est bon.');
process.exit(ko ? 1 : 0);
