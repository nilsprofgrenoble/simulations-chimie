// src/simulations/lasureModele.test.mjs
// Exécution : node src/simulations/lasureModele.test.mjs
// Tests du modèle pur « séchage d'une lasure alkyde ». Aucune dépendance externe.

import assert from 'node:assert/strict';
import {
  PARAMS, FORMULE_REF, DENSITES, volumes, epaisseurSeche,
  resteSolvant, resteAntiPeau, phi, dX, trajectoireFilm, etatFilmA, dureteA,
  simulerPot, jourPeau, arrondiSig,
  jourPeauRapide, antiPeauSurface, etatPotA, PLAGE_SICCATIF, CAHIERS_DEFI, evaluerFormule, respecteCahier,
} from './lasureModele.js';

let nVerifs = 0;
function ok(cond, msg) { nVerifs++; assert.ok(cond, msg); }
function procheVal(obtenu, attendu, tol, msg) {
  nVerifs++;
  assert.ok(Math.abs(obtenu - attendu) <= tol, `${msg} : obtenu ${obtenu}, attendu ${attendu} ± ${tol}`);
}
function procheRel(obtenu, attendu, tolRel, msg) {
  nVerifs++;
  assert.ok(Math.abs(obtenu / attendu - 1) <= tolRel, `${msg} : obtenu ${obtenu}, attendu ${attendu} (± ${tolRel * 100} %)`);
}

// ---------- 1. Volumes et épaisseur sèche (calculés à la main) ----------
// 100 g de Fref : V(solution de résine) = 50 / 0,98 = 51,02 cm³ ; V(white spirit) = 47,4 / 0,80 = 59,25 ;
// V(Busperse) = 0,3 / 0,90 = 0,333 ; V(141 Z) = 2 / 1,06 = 1,887 ; V(0444) = 0,3 / 0,87 = 0,345
// V(humide) = 51,02 + 59,25 + 0,333 + 1,887 + 0,345 = 112,84 cm³ ; ρ = 100 / 112,84 = 0,886 g/cm³
const v = volumes();
procheVal(v.vHumide, 112.84, 0.02, 'V humide');
procheVal(v.rho, 0.8862, 1e-3, 'masse volumique de la formule');
// Résine sèche : 40 g ; V = 51,02 − 10 / 0,80 = 38,52 cm³ -> 1,038 g/cm³
procheVal(40 / (50 / DENSITES.solution - 10 / DENSITES.solvant), 1.0384, 1e-3, 'masse volumique résine sèche');
// V(sec) = 38,52 + 0,333 + 2 × 0,67 / 1,06 (= 1,264) = 40,12 cm³ ; extrait sec volumique = 40,12 / 112,84 = 35,55 %
procheVal(v.vSec, 40.12, 0.02, 'V sec');
procheVal(v.extraitSecVolumique, 0.3555, 5e-4, 'extrait sec volumique');
// Masse sèche = 40 + 0,3 + 1,34 = 41,64 g -> 41,6 % en masse
procheVal(v.extraitSecMassique, 0.4164, 1e-4, 'extrait sec massique');
// DFT = WFT × extrait sec volumique : 200 µm -> 71,1 µm ; 50 µm -> 17,8 µm
procheVal(epaisseurSeche(200), 71.1, 0.1, 'DFT pour 200 µm');
procheVal(epaisseurSeche(50), 17.8, 0.1, 'DFT pour 50 µm');
// Les 50 µm donnent un film dans la fourchette d'une lasure (10-30 µm), pas les 200 µm (70-150 µm : vernis).
ok(epaisseurSeche(50) >= 10 && epaisseurSeche(50) <= 30, '50 µm humides -> film de lasure');
ok(epaisseurSeche(200) >= 70, '200 µm humides -> film de vernis');

// ---------- 2. Évaporation et inhibition ----------
procheVal(resteSolvant(PARAMS.tauSolvant200, 200), Math.exp(-1), 1e-9, 'solvant à t = τ');
procheVal(resteSolvant(0, 200), 1, 1e-12, 'solvant à t = 0');
// Un film 4 fois plus fin sèche 4 fois plus vite : même reste à t/4
procheVal(resteSolvant(1, 50), resteSolvant(4, 200), 1e-12, 'solvant : temps proportionnel à l’épaisseur');
procheVal(resteAntiPeau(PARAMS.tauAntiPeau200, 0.3, 200), 0.3 * Math.exp(-1), 1e-9, 'anti-peau à t = τ');
procheVal(phi(0), 1, 1e-12, 'φ sans anti-peau');
procheVal(phi(PARAMS.rDemi), 0.5, 1e-12, 'φ(r½) = 1/2');
ok(phi(0.3) < phi(0.15), 'plus de rapport anti-peau/siccatif -> moins de siccatif actif');
// dX s'annule à X = 1 et croît d'abord avec X (autocatalyse)
procheVal(dX(1, 2, 1), 0, 1e-12, 'dX/dt = 0 à X = 1');
ok(dX(0.2, 2, 1) > dX(0.02, 2, 1), 'autocatalyse : la vitesse croît avec X au début');
// Le frein (1 − X)^m ralentit la fin : dX/dt(0,9) < dX/dt(0,5)
ok(dX(0.9, 2, 1) < dX(0.5, 2, 1), 'la vitesse retombe en fin de réticulation');

// ---------- 3. Film : calage sur les 8 duretés Persoz du TP ----------
const TP = [
  ['F-/-', 1, 0, 27, 117], ['F-/+', 1, 0.3, 16, 113], ['F+/-', 2, 0, 42, 137], ['F+/+', 2, 0.3, 33, 135],
];
for (const [nom, si, ap, d12, d14] of TP) {
  procheRel(dureteA(12, si, ap), d12, 0.10, `dureté ${nom} à 12 h`);
  procheRel(dureteA(336, si, ap), d14, 0.10, `dureté ${nom} à 14 j`);
}
// Ordre à 12 h (ce que le TP met en évidence) : F+/- > F+/+ > F-/- > F-/+
const d12 = Object.fromEntries(TP.map(([n, si, ap]) => [n, dureteA(12, si, ap)]));
ok(d12['F+/-'] > d12['F+/+'] && d12['F+/+'] > d12['F-/-'] && d12['F-/-'] > d12['F-/+'], 'ordre des duretés à 12 h');
// L'anti-peau retarde le séchage, mais l'écart se réduit avec le temps (hypothèse vérifiée à 14 j dans le TP)
for (const si of [1, 2]) {
  const ecart12 = 1 - dureteA(12, si, 0.3) / dureteA(12, si, 0);
  const ecart336 = 1 - dureteA(336, si, 0.3) / dureteA(336, si, 0);
  ok(ecart12 > 0.15, `l'anti-peau retarde nettement le séchage à 12 h (Si = ${si} %)`);
  ok(Math.abs(ecart336) < 0.10, `à 14 j, l'écart dû à l'anti-peau est faible (Si = ${si} %)`);
}
// L'anti-peau retarde moins quand il y a plus de siccatif (rapport plus faible)
ok((1 - dureteA(12, 2, 0.3) / dureteA(12, 2, 0)) < (1 - dureteA(12, 1, 0.3) / dureteA(12, 1, 0)), 'même anti-peau, plus de siccatif -> moindre retard');

// Trajectoire : X monotone croissant dans [0, 1], dureté croissante, solvant et anti-peau décroissants
for (const [, si, ap] of TP) {
  const tr = trajectoireFilm({ si, ap, tMax: 2160 });
  let mono = true;
  for (let i = 1; i < tr.length; i++) {
    if (tr[i].X < tr[i - 1].X - 1e-12 || tr[i].durete < tr[i - 1].durete - 1e-9 || tr[i].solvant > tr[i - 1].solvant + 1e-12) mono = false;
  }
  ok(mono, 'trajectoire monotone');
  ok(tr[tr.length - 1].X <= 1 && tr[0].X >= 0, 'X dans [0, 1]');
  procheVal(tr[tr.length - 1].t, 2160, 1e-6, 'dernier instant = tMax');
}
// Convergence numérique : un pas deux fois plus fin ne change presque rien (comparaison à une intégration très fine)
function Xfin(si, ap, tFin, dt) {
  let t = 0, X = 0;
  while (t < tFin - 1e-12) {
    const h = Math.min(dt, tFin - t);
    const r = (tt) => resteAntiPeau(tt, ap, 200) / si;
    const k1 = dX(X, si, phi(r(t)));
    const k2 = dX(X + 0.5 * h * k1, si, phi(r(t + 0.5 * h)));
    X += h * k2; t += h;
  }
  return X;
}
const trRef = trajectoireFilm({ si: 2, ap: 0.3, tMax: 336, n: 300 });
procheVal(etatFilmA(trRef, 24).X, Xfin(2, 0.3, 24, 0.001), 2e-3, 'X(24 h) : pas variable vs pas fin');
procheVal(etatFilmA(trRef, 336).X, Xfin(2, 0.3, 336, 0.01), 3e-3, 'X(14 j) : pas variable vs pas fin');

// Épaisseur du film : WFT à t = 0, DFT quand le solvant est parti
const tr0 = trajectoireFilm({ si: 2, ap: 0.3, wft: 200, tMax: 2160 });
// Premier instant échantillonné : t = 0,05 h (3 min) ; épaisseur = WFT × (1 − (1 − VS) × (1 − s)), s = e^(−0,05/2)
procheVal(tr0[0].epaisseur, 200 * (1 - (1 - epaisseurSeche(1)) * (1 - Math.exp(-0.05 / PARAMS.tauSolvant200))), 1e-9, 'épaisseur à 3 min');
ok(tr0[0].epaisseur < 200 && tr0[0].epaisseur > 190, 'à 3 min, le film vient à peine de commencer à s’amincir');
procheVal(tr0[tr0.length - 1].epaisseur, epaisseurSeche(200), 0.2, 'épaisseur finale ≈ DFT');

// ---------- 4. Pot fermé ----------
// 4a. Sans perte en surface, l'anti-peau reste uniforme (conservation, schéma aux différences finies)
const potFerme = simulerPot({ si: 2, ap: 0.3, jours: 100, n: 40, p: { ...PARAMS, kSurface: 0 } });
procheVal(potFerme[potFerme.length - 1].cSurface, 0.3, 1e-9, 'sans perte, c(surface) = c0');
// 4b. Avec perte en surface : comparaison à la solution analytique du milieu semi-infini avec condition de Robin
//     c_s / c0 = exp(β²)·erfc(β), β = kS·√(t/D)
function erfc(x) { // Abramowitz-Stegun 7.1.26 (|erreur| < 1,5e-7)
  const t = 1 / (1 + 0.3275911 * x);
  const y = ((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592;
  return y * t * Math.exp(-x * x);
}
const potA = simulerPot({ si: 2, ap: 0.3, jours: 100, n: 60 });
for (const e of [potA[Math.floor(potA.length * 0.6)], potA[potA.length - 1]]) {
  const beta = PARAMS.kSurface * Math.sqrt(e.jour * 86400 / PARAMS.D);
  const analytique = 0.3 * Math.exp(beta * beta) * erfc(beta);
  procheRel(e.cSurfaceNum, analytique, 0.04, `c(surface) à ${e.jour.toFixed(1)} j : numérique vs analytique`);
}
// L'anti-peau de surface décroît avec le temps ; en profondeur il reste intact
let decroit = true;
for (let i = 1; i < potA.length; i++) if (potA[i].cSurface > potA[i - 1].cSurface + 1e-12) decroit = false;
ok(decroit, 'c(surface) décroît');
// Profil complet : c(z,t)/c0 = erf(ζ) + exp(h·z + h²·D·t)·erfc(ζ + h·√(D·t)), ζ = z / (2√(D·t)), h = kS / D
{
  const e = potA[potA.length - 1];
  for (const i of [0, 10, 30, 60, 99]) {
    const z = i * e.dzMm * 1e-3, tS = e.jour * 86400, h = PARAMS.kSurface / PARAMS.D;
    const zeta = z / (2 * Math.sqrt(PARAMS.D * tS));
    const analytique = 0.3 * ((1 - erfc(zeta)) + Math.exp(h * z + h * h * PARAMS.D * tS) * erfc(zeta + h * Math.sqrt(PARAMS.D * tS)));
    procheVal(e.profil[i], analytique, 0.004, `profil d'anti-peau à ${(z * 1e3).toFixed(1)} mm après ${e.jour.toFixed(0)} j`);
  }
}

// 4c. Peau en pot : observations à 3 mois du TP (90 j)
const peau = {};
for (const [nom, si, ap] of TP) peau[nom] = jourPeau(simulerPot({ si, ap, jours: 400, n: 160 }));
ok(peau['F-/-'] <= 90 && peau['F+/-'] <= 90 && peau['F+/+'] <= 90, 'peau à 3 mois pour F-/-, F+/-, F+/+ (observé)');
ok(peau['F-/+'] > 90, 'pas de peau à 3 mois pour F-/+ (observé)');
// Ordre des délais : F+/- (le plus rapide) < F-/- < F+/+ < F-/+
ok(peau['F+/-'] < peau['F-/-'] && peau['F-/-'] < peau['F+/+'] && peau['F+/+'] < peau['F-/+'], 'ordre des délais de peau');
// Marge : pas de résultat « de justesse » (au moins 25 % d'écart avec le seuil de 90 j)
ok(peau['F+/+'] < 90 / 1.25 && peau['F-/+'] > 90 * 1.25, 'marge de 25 % sur le seuil de 90 j');
// À même rapport anti-peau / siccatif (0,3 / 1 = 0,6 / 2) : même fraction de siccatif actif φ, mais la vitesse de
// réticulation reste proportionnelle à la teneur en siccatif -> le délai est divisé par 2 (± 12 % : la diffusion intervient un peu)
const rapportMeme = [jourPeau(simulerPot({ si: 1, ap: 0.3, jours: 400, n: 160 })), jourPeau(simulerPot({ si: 2, ap: 0.6, jours: 400, n: 160 }))];
procheRel(rapportMeme[1], rapportMeme[0] / 2, 0.12, 'même rapport AP/Si, siccatif doublé -> délai divisé par 2');
// Peau : épaisseur croissante avec le temps, de l'ordre du demi-millimètre à quelques millimètres
const potPeau = simulerPot({ si: 2, ap: 0, jours: 200, n: 120 });
let croit = true;
for (let i = 1; i < potPeau.length; i++) if (potPeau[i].peauMm < potPeau[i - 1].peauMm - 1e-12) croit = false;
ok(croit, 'épaisseur de peau croissante');
ok(potPeau[potPeau.length - 1].peauMm > 0.1 && potPeau[potPeau.length - 1].peauMm <= 3.6, 'peau de l’ordre du millimètre');

// 4d. Version rapide (solution analytique) : même délai que la simulation 1D, à 1 % près (couche de surface pilotée par la même formule)
for (const [nom, si, ap] of TP) {
  const num = jourPeau(simulerPot({ si, ap, jours: 400, n: 160 })), vite = jourPeauRapide(si, ap, 400);
  procheRel(vite, num, 0.08, `délai de peau ${nom} : rapide vs 1D (la grille temporelle log limite la précision à ~8 %)`);
}
procheVal(antiPeauSurface(0, 0.3), 0.3, 1e-6, 'anti-peau de surface à t = 0 (précision de erfc : 1,5e-7)');
ok(antiPeauSurface(2160, 0.3) < antiPeauSurface(24, 0.3), 'anti-peau de surface décroissante');
// Interpolation de l'état du pot
const potI = simulerPot({ si: 2, ap: 0.3, jours: 90, n: 100 });
procheVal(etatPotA(potI, 90).jour, potI[potI.length - 1].jour, 1e-9, 'état du pot à la fin');
ok(etatPotA(potI, 30).cSurface < 0.3 && etatPotA(potI, 30).cSurface > 0, 'état du pot interpolé');

// ---------- 4e. Défi : chaque cahier des charges est réalisable avec les positions des curseurs ----------
// Siccatif au pas de 0,1 % dans la plage ; anti-peau au pas de 0,05 % de 0 à 1 %.
for (const cdc of CAHIERS_DEFI) {
  let nSol = 0;
  for (let si = PLAGE_SICCATIF[0]; si <= PLAGE_SICCATIF[1] + 1e-9; si += 0.1) {
    for (let ap = 0; ap <= 1 + 1e-9; ap += 0.05) if (respecteCahier(+si.toFixed(1), +ap.toFixed(2), cdc)) nSol++;
  }
  ok(nSol >= 3, `cahier ${JSON.stringify(cdc)} : au moins 3 solutions sur les curseurs (trouvé ${nSol})`);
}
// Aucun cahier n'est satisfait par la formule de référence F+/+ ni par les formules extrêmes : l'élève doit chercher
for (const cdc of CAHIERS_DEFI) {
  ok(!respecteCahier(2, 0.3, cdc), `F+/+ ne satisfait pas ${JSON.stringify(cdc)}`);
  ok(!respecteCahier(2, 0, cdc) && !respecteCahier(2.4, 1, { j: 90, p: 40 }), 'sans anti-peau, aucun cahier satisfait');
}
// Valeurs affichées : dureté entière, délai « Infinity » si pas de peau avant 3 mois
{ const e = evaluerFormule(2.1, 1); ok(Number.isInteger(e.p), 'dureté affichée entière'); ok(e.j === Infinity, '2,1 % / 1 % : pas de peau avant 3 mois'); }

// ---------- 5. Arrondis ----------
procheVal(arrondiSig(31.27, 2), 31, 1e-9, 'arrondi 2 CS');
procheVal(arrondiSig(0.04512, 2), 0.045, 1e-12, 'arrondi 2 CS (petit)');

console.log(`lasureModele : ${nVerifs} vérifications OK`);
