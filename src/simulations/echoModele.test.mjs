// Test du modèle de l'échographe : node src/simulations/echoModele.test.mjs
import assert from 'node:assert';
import * as M from './echoModele.js';
const proche = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol * Math.abs(b), `${msg} : ${a} ≠ ${b}`);

// 1. Célérité dans les gaz (gaz parfait)
proche(M.celeriteGaz(20), 343, 0.003, 'air à 20 °C');
proche(M.celeriteGaz(0), 331.3, 0.003, 'air à 0 °C');
proche(M.celeriteGaz(20, M.GAZ.he), 1007, 0.01, 'hélium à 20 °C');
proche(M.celeriteGaz(20, M.GAZ.co2), 267, 0.01, 'CO₂ à 20 °C');
assert(M.celeriteGaz(30) > M.celeriteGaz(10), 'v croît avec T');
assert(M.celeriteGaz(20, M.GAZ.he) > M.celeriteGaz(20) && M.celeriteGaz(20, M.GAZ.co2) < M.celeriteGaz(20), 'ordre He > air > CO₂');
// retard et distance
const v20 = M.celeriteGaz(20);
proche(M.retardAllerRetour(1.2, v20) * 1e3, 6.997, 0.002, 'Δt pour 1,20 m à 20 °C');
proche(M.distanceDepuisRetard(M.retardAllerRetour(1.2, v20), v20), 1.2, 1e-12, 'aller-retour');
// capteur réglé sur 340 m/s utilisé à 0 °C : distance affichée trop grande
const dt0 = M.retardAllerRetour(1.2, M.celeriteGaz(0));
proche(M.distanceAffichee(dt0), 1.2314, 0.001, 'distance affichée à 0 °C');
proche(M.celeriteDepuisEtalonnage(1.2, dt0), M.celeriteGaz(0), 1e-12, 'étalonnage');
// ordres de grandeur : solide > liquide > gaz
const moy = t => M.ORDRES.filter(o => o.type === t).reduce((s, o) => s + o.v, 0) / M.ORDRES.filter(o => o.type === t).length;
assert(moy('solide') > moy('liquide') && moy('liquide') > moy('gaz'), 'solide > liquide > gaz');

// 2. Échographe : retards et niveaux (valeurs calculées à la main)
const e5 = M.echos({ fMHz: 5, avecDetails: false });
const face = e5.find(e => e.id === 'muscle/organe');
proche(face.t * 1e6, 45.80, 0.002, 'retard de la face de l’organe');
proche(face.prof, 3.5, 1e-9, 'profondeur vraie de la face de l’organe');
proche(M.profondeurApparente(face.t), 3.527, 0.002, 'profondeur apparente (1540 m/s)');
const fond = e5.find(e => e.id === 'fond');
// absorption aller-retour jusqu’au fond à 5 MHz : 2 × 5 × (0,1×0 + 0,2×1,5 + 1,2×0,6 + 2×1,1 + 3,6×0,7) = 2×5×5,74 = 57,4 dB
const absFond = 2 * 5 * (0.2 * 1.5 + 1.2 * 0.6 + 2.0 * 1.1 + 3.6 * 0.7);
proche(absFond, 57.4, 1e-9, 'absorption jusqu’au fond');
const T2 = ((1 - 0.02) * (1 - 0.03) * (1 - 0.01) * (1 - 0.02)) ** 2;
proche(fond.niveau, 10 * Math.log10(0.03 * T2) - absFond, 1e-9, 'niveau de l’écho du fond');
assert(fond.detecte === (fond.niveau >= M.SEUIL_DB), 'détection du fond');
// sans gel : tout est affaibli d’environ 40 dB
const sansGel = M.echos({ fMHz: 3.5, gel: false, avecDetails: false }), avecGel = M.echos({ fMHz: 3.5, gel: true, avecDetails: false });
const dg = avecGel.find(e => e.id === 'fond').niveau - sansGel.find(e => e.id === 'fond').niveau;
assert(dg > 38 && dg < 42, `le gel gagne ≈ 40 dB (${dg})`);
assert(avecGel.find(e => e.id === 'fond').detecte && !sansGel.find(e => e.id === 'fond').detecte, 'sans gel, le fond est perdu');
// gel/peau : un seul écho, retard = aller-retour dans 1 mm de gel
const g = avecGel.filter(e => e.id === 'gel/peau');
assert(g.length === 1, 'un seul écho gel/peau'); proche(g[0].t * 1e6, 2 * 0.001 / 1500 * 1e6, 1e-9, 'retard gel/peau');
// les échos sont triés par retard et leurs retards augmentent avec la profondeur
const tous = M.echos({ fMHz: 4, sDetail: 1 });
for (let i = 1; i < tous.length; i++) assert(tous[i].t >= tous[i - 1].t, 'tri par retard');
// plus la fréquence est grande, plus le fond est faible
assert(M.echos({ fMHz: 8 }).find(e => e.id === 'fond').niveau < M.echos({ fMHz: 2 }).find(e => e.id === 'fond').niveau, 'absorption croissante');
// fréquence maximale pour détecter le fond
const fm = M.fMaxFond();
assert(M.echos({ fMHz: fm * 0.99, avecDetails: false }).find(e => e.id === 'fond').detecte, 'fond détecté sous fMax');
assert(!M.echos({ fMHz: fm * 1.01, avecDetails: false }).find(e => e.id === 'fond').detecte, 'fond perdu au-dessus de fMax');
assert(fm > 4 && fm < 8, `fMax réaliste (${fm})`);
// épaisseurs variables (défi)
const alt = M.echos({ ep: { ...M.EP_DEFAUT, graisse: 1.8, muscle: 1.5 }, fMHz: 3 }).find(e => e.id === 'muscle/organe');
proche(alt.prof, 0.1 + 0.2 + 1.8 + 1.5, 1e-9, 'profondeur de l’organe avec épaisseurs modifiées');

// 3. Résolution
proche(M.longueurOnde(1590, 5), 0.318, 1e-9, 'λ = v/f (mm)');
assert(M.separables(0.8, 0.7) && !M.separables(0.8, 1.59), 'critère s ≥ λ');
proche(M.frequenceMin(0.8, 1590), 1.9875, 1e-9, 'fréquence minimale');
// le creux de l’enveloppe apparaît exactement quand s dépasse λ
const v = 1590;
for (const s of [0.4, 0.8, 1.2]) {
  const f0 = M.frequenceMin(s, v), dt = M.ecartTemps(s, v);
  assert(!M.aUnCreux(dt, f0 * 0.95), `pas de creux sous fmin (s=${s})`);
  assert(M.aUnCreux(dt, f0 * 1.05), `creux au-dessus de fmin (s=${s})`);
}
// le défi 4 est toujours réalisable : fmin(s) ≤ fMax pour s ≥ 0,4 mm
assert(M.frequenceMin(0.4, 1590) < M.fMaxFond(), 'défi réalisable');
console.log('echoModele : tous les tests passent');
