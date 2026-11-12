// src/simulations/lasureModele.js
// Modèle pur — simulation « Lasure alkyde : un séchage en deux temps » (BTS MDC, formulation).
// Aucune dépendance : utilisable côté React et dans les tests node (lasureModele.test.mjs).
// Unités : temps en heures (h) dans le film, en jours (j) dans le pot ; épaisseurs en µm ou mm ;
// teneurs en % massiques de la formule (comme dans le TP) ; duretés Persoz en secondes (s).
//
// Cadre physique (repris dans « Hypothèses de travail » de la simulation) :
// 1. Séchage physique : le white spirit D60 et l'anti-peau (DEHA) s'évaporent du film. On les traite
//    en décroissance exponentielle, de constante de temps proportionnelle à l'épaisseur humide
//    (même flux surfacique, plus de matière à évacuer). L'anti-peau est le plus volatil (document 8,
//    pression de vapeur de la DEHA ≈ 5 hPa à 20 °C contre 1 à 5 hPa à 25 °C pour le white spirit).
// 2. Séchage chimique : la siccativation est une oxydation radicalaire AUTOCATALYTIQUE (document 7) :
//    lente au début (induction), puis rapide, puis freinée quand le film se rigidifie.
//    On écrit dX/dt = k·Si·φ·(ε + X)·(1 − X)^m où X ∈ [0, 1] est l'avancement de la réticulation,
//    Si la teneur en siccatif, φ la fraction de siccatif ACTIF.
// 3. Rôle de l'anti-peau : il inhibe le siccatif tant qu'il est présent. On modélise une compétition
//    simple : φ = 1 / (1 + R / r½), avec R = (teneur en anti-peau) / (teneur en siccatif).
//    Donc ce qui compte est le RAPPORT anti-peau / siccatif, pas la teneur en anti-peau seule.
// 4. Dureté : P = P_phys·(1 − s) + (P_max − P_phys)·X, où s est la fraction de solvant restante.
//
// Dans le pot fermé, l'anti-peau diffuse dans le liquide (loi de Fick) et disparaît à la surface
// (évaporation vers le ciel du pot et réaction avec l'oxygène qui s'y trouve). Le dioxygène ne pénètre que
// sur quelques dixièmes de millimètre : c'est là que la peau se forme. Voir simulerPot().
//
// Calibration : les paramètres du film sont ajustés sur les 8 duretés Persoz du TP (4 formules, 12 h et 14 j) ;
// ceux du pot sur les 4 observations de peau à 3 mois. C'est un calage, pas une validation : le modèle
// reproduit le TP par construction, et les prévisions hors TP (autres teneurs, autres épaisseurs) sont
// des extrapolations à discuter avec les élèves. Voir scripts de calage dans lasureModele.test.mjs.

export const FORMULE_REF = {
  liant: 50,        // BALKYD 720 FA – 80 D60 : solution à 80 % de résine alkyde (g pour 100 g de formule)
  solvant: 47.4,    // White spirit D60
  dispersant: 0.3,  // Busperse 47
  siccatif: 2,      // 141 Z
  antipeau: 0.3,    // 0444
};

// Masses volumiques (g/cm³) — documents 2 à 6 du TP ; la résine sèche se déduit de la solution à 80 % :
// 50 g de solution = 40 g de résine sèche + 10 g de white spirit ; V(solution) = 50 / 0,98 = 51,02 cm³ ;
// V(résine sèche) = 51,02 − 10 / 0,80 = 38,52 cm³ -> ρ(résine sèche) = 40 / 38,52 = 1,038 g/cm³.
export const DENSITES = {
  solution: 0.98, solvant: 0.80, dispersant: 0.90, siccatif: 1.06, antipeau: 0.87,
};
export const EXTRAIT_SEC_SICCATIF = 0.67;  // 141 Z : 60-74 % de non-volatil (document 4) -> 67 %

export const PARAMS = {
  // Évaporation (constantes de temps pour un film de 200 µm humide)
  tauSolvant200: 2,     // h : white spirit D60 (choisi, non calé : il ne pèse que sur 7 s de dureté)
  tauAntiPeau200: 3,    // h : durée EFFECTIVE de présence de l'inhibition (calée, voir ci-dessous)
  // Siccativation
  k: 0.07,              // h⁻¹ par % de siccatif (calé)
  epsilon: 0.134,       // amorçage : proportion initiale de « germes » radicalaires (calé)
  m: 3,                 // frein de rigidification (exposant sur 1 − X) (calé)
  rDemi: 0.045,         // rapport anti-peau/siccatif qui inhibe la moitié du siccatif (calé)
  // Dureté Persoz
  pPhys: 7.3,           // s : film physiquement sec mais non réticulé (calé)
  pMax: 143,            // s : film entièrement réticulé (calé)
  // Pot fermé
  alphaO2: 0.05,        // disponibilité de O₂ dans le pot fermé, relative à un film à l'air libre (calé)
  longueurO2: 0.3,      // mm : profondeur de pénétration de O₂ dans le liquide (choisi)
  D: 1e-11,             // m²/s : diffusion de l'anti-peau dans la lasure (Stokes-Einstein, η ≈ 40 mPa·s)
  kSurface: 5e-10,      // m/s : perte d'anti-peau à la surface (évaporation + réaction avec O₂) (calé)
  xPeau: 0.3,           // avancement au-delà duquel la couche est une peau
  hauteurPot: 30,       // mm de liquide simulés sous la surface
};

// ---------- Volume et épaisseur sèche (question 3.2 du TP) ----------

// Pour 100 g de formule : volume humide et volume sec (cm³), extrait sec volumique, rapport DFT / WFT.
export function volumes(f = FORMULE_REF) {
  const resineSeche = f.liant * 0.8;
  const solvantDuLiant = f.liant * 0.2;
  const vResineSeche = f.liant / DENSITES.solution - solvantDuLiant / DENSITES.solvant;
  const vHumide = f.liant / DENSITES.solution + f.solvant / DENSITES.solvant + f.dispersant / DENSITES.dispersant
    + f.siccatif / DENSITES.siccatif + f.antipeau / DENSITES.antipeau;
  const vSec = vResineSeche + f.dispersant / DENSITES.dispersant + (f.siccatif * EXTRAIT_SEC_SICCATIF) / DENSITES.siccatif;
  const masseHumide = f.liant + f.solvant + f.dispersant + f.siccatif + f.antipeau;
  const masseSeche = resineSeche + f.dispersant + f.siccatif * EXTRAIT_SEC_SICCATIF;
  return {
    vHumide, vSec, masseHumide, masseSeche,
    extraitSecMassique: masseSeche / masseHumide,
    extraitSecVolumique: vSec / vHumide,
    rapportDFT: vSec / vHumide,           // DFT = WFT × VS (même surface recouverte)
    rho: masseHumide / vHumide,
  };
}

export function epaisseurSeche(wft, f = FORMULE_REF) {
  return wft * volumes(f).rapportDFT;
}

// ---------- Film : évaporation, inhibition, siccativation, dureté ----------

export function resteSolvant(t, wft = 200, p = PARAMS) { return Math.exp(-t / (p.tauSolvant200 * wft / 200)); }
export function resteAntiPeau(t, ap, wft = 200, p = PARAMS) { return ap * Math.exp(-t / (p.tauAntiPeau200 * wft / 200)); }
// Fraction de siccatif actif : compétition avec l'anti-peau.
export function phi(rapport, p = PARAMS) { return 1 / (1 + Math.max(0, rapport) / p.rDemi); }

// Dérivée de l'avancement X pour un siccatif de teneur si, une fraction active ph, un facteur d'oxygène o2.
export function dX(X, si, ph, o2 = 1, p = PARAMS) {
  return o2 * p.k * si * ph * (p.epsilon + X) * Math.pow(Math.max(0, 1 - X), p.m);
}

// Intégration en pas variables (pas fin au début, plus large ensuite). Renvoie des échantillons réguliers en log(t).
export function trajectoireFilm({ si, ap, wft = 200, tMax = 2160, n = 240, p = PARAMS }) {
  const tMin = 0.05;
  const instants = Array.from({ length: n }, (_, i) => tMin * Math.pow(tMax / tMin, i / (n - 1)));
  const sortie = [];
  let t = 0, X = 0, iSortie = 0;
  while (iSortie < n) {
    const cible = instants[iSortie];
    while (t < cible - 1e-12) {
      const dt = Math.min(cible - t, Math.max(0.005, t / 400));
      // Point milieu (RK2) : suffisant pour un frein (1 − X)^m aussi doux.
      const rap = (tt) => resteAntiPeau(tt, ap, wft, p) / si;
      const k1 = dX(X, si, phi(rap(t), p), 1, p);
      const k2 = dX(Math.min(1, X + 0.5 * dt * k1), si, phi(rap(t + 0.5 * dt), p), 1, p);
      X = Math.min(1, X + dt * k2);
      t += dt;
    }
    sortie.push(etatFilm(cible, X, si, ap, wft, p));
    iSortie++;
  }
  return sortie;
}

export function etatFilm(t, X, si, ap, wft, p = PARAMS) {
  const s = resteSolvant(t, wft, p);
  const a = resteAntiPeau(t, ap, wft, p);
  const durete = p.pPhys * (1 - s) + (p.pMax - p.pPhys) * X;
  return {
    t, X, solvant: s, antiPeau: a, phi: phi(a / si, p), durete,
    epaisseur: wft * (1 - (1 - epaisseurSeche(1)) * (1 - s)), // WFT -> DFT quand le solvant part
  };
}

// Valeur de l'état du film à un instant donné (interpolation dans la trajectoire échantillonnée).
export function etatFilmA(traj, t) {
  if (t <= traj[0].t) return traj[0];
  if (t >= traj[traj.length - 1].t) return traj[traj.length - 1];
  let lo = 0, hi = traj.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (traj[mid].t <= t) lo = mid; else hi = mid; }
  const a = traj[lo], b = traj[hi];
  const u = (t - a.t) / (b.t - a.t);
  const mix = (x, y) => x + (y - x) * u;
  return { t, X: mix(a.X, b.X), solvant: mix(a.solvant, b.solvant), antiPeau: mix(a.antiPeau, b.antiPeau),
    phi: mix(a.phi, b.phi), durete: mix(a.durete, b.durete), epaisseur: mix(a.epaisseur, b.epaisseur) };
}

export function dureteA(t, si, ap, wft = 200, p = PARAMS) {
  const traj = trajectoireFilm({ si, ap, wft, tMax: Math.max(t, 1), n: 400, p });
  return etatFilmA(traj, t).durete;
}

// ---------- Pot fermé : diffusion de l'anti-peau, peau en surface ----------

// Différences finies explicites en 1D (z = 0 à la surface). Rend, pour chaque instant échantillonné
// (en jours, échelle log), la concentration en anti-peau près de la surface, l'avancement de la réticulation
// en surface et l'épaisseur de peau.
export function simulerPot({ si, ap, jours = 180, n = 200, p = PARAMS }) {
  const H = p.hauteurPot * 1e-3, N = 200, dz = H / (N - 1);
  const K = 24;                                    // couches proches de la surface où la réticulation est suivie
  const dtMax = 0.4 * dz * dz / p.D;              // stabilité explicite : D·dt/dz² ≤ 0,5
  const dt = Math.min(dtMax, 1800);                // s
  const c = new Float64Array(N).fill(ap);          // % massique d'anti-peau
  const X = new Float64Array(N).fill(0);
  const o2 = new Float64Array(N);
  for (let i = 0; i < N; i++) o2[i] = p.alphaO2 * Math.exp(-(i * dz * 1e3) / p.longueurO2);
  const tMinJ = 0.02;
  const instants = Array.from({ length: n }, (_, i) => tMinJ * Math.pow(jours / tMinJ, i / (n - 1)));
  const sortie = [];
  let tS = 0;
  const secParHeure = 3600;
  for (const cibleJ of instants) {
    const cibleS = cibleJ * 86400;
    while (tS < cibleS - 1e-9) {
      const pas = Math.min(dt, cibleS - tS);
      // Diffusion
      const cn = new Float64Array(N);
      for (let i = 1; i < N - 1; i++) cn[i] = c[i] + p.D * pas / (dz * dz) * (c[i + 1] - 2 * c[i] + c[i - 1]);
      // Fond du pot : flux nul ; surface : flux sortant kSurface·c0
      cn[N - 1] = c[N - 1] + 2 * p.D * pas / (dz * dz) * (c[N - 2] - c[N - 1]);
      cn[0] = c[0] + 2 * p.D * pas / (dz * dz) * (c[1] - c[0]) - 2 * p.kSurface * pas / dz * c[0];
      for (let i = 0; i < N; i++) c[i] = Math.max(0, cn[i]);
      // Siccativation locale (unités : taux en h⁻¹ -> pas en heures).
      // La couche de surface est pilotée par la solution analytique de l'anti-peau (valeur au milieu du pas), exacte
      // pour le milieu semi-infini : le délai de peau est alors identique à celui de jourPeauRapide (pas de discordance de 4 %
      // due à la grille). Les couches sous la surface utilisent la concentration calculée par différences finies.
      const pasH = pas / secParHeure;
      const cMilieu0 = antiPeauSurface((tS + pas / 2) / secParHeure, ap, p);
      for (let i = 0; i < K; i++) {                  // seules les couches proches de la surface voient O₂
        const ci = i === 0 ? cMilieu0 : c[i];
        X[i] = Math.min(1, X[i] + pasH * dX(X[i], si, phi(ci / si, p), o2[i], p));
      }
      tS += pas;
    }
    // Épaisseur de peau : couches (profondeur) dont l'avancement dépasse xPeau
    let nPeau = 0;
    for (let i = 0; i < K; i++) { if (X[i] >= p.xPeau) nPeau = i + 1; else break; }   // peau = couches continues depuis la surface
    sortie.push({ jour: cibleJ, cSurface: antiPeauSurface(tS / secParHeure, ap, p), cSurfaceNum: c[0], xSurface: X[0], peauMm: nPeau * dz * 1e3,
      profil: Array.from(c), dzMm: dz * 1e3 });
  }
  return sortie;
}

// Complémentaire d'erreur (Abramowitz-Stegun 7.1.26, |erreur| < 1,5·10⁻⁷), utile pour la solution analytique du milieu semi-infini.
export function erfc(x) {
  const t = 1 / (1 + 0.3275911 * x);
  const y = ((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592;
  return y * t * Math.exp(-x * x);
}

// Anti-peau à la surface du pot au bout de t heures, en milieu semi-infini avec perte kSurface :
// c_s = c0·exp(β²)·erfc(β), β = kS·√(t/D)  (même résultat que simulerPot, à 4 % près, sans le calcul 1D).
export function antiPeauSurface(tHeures, ap, p = PARAMS) {
  const beta = p.kSurface * Math.sqrt(tHeures * 3600 / p.D);
  return ap * Math.exp(beta * beta) * erfc(beta);
}

// Délai (en jours) avant l'apparition d'une peau, calculé sur la seule couche de surface avec la solution analytique ci-dessus.
// Infinity si aucune peau avant joursMax. Beaucoup plus rapide que simulerPot : sert aux cartes et au défi.
export function jourPeauRapide(si, ap, joursMax = 90, p = PARAMS) {
  const tMaxH = joursMax * 24;
  let t = 0, X = 0;
  while (t < tMaxH) {
    const dt = Math.min(tMaxH - t, Math.max(0.05, t / 300));
    const r = (tt) => antiPeauSurface(tt, ap, p) / si;
    const k1 = dX(X, si, phi(r(t), p), p.alphaO2, p);
    const k2 = dX(Math.min(1, X + 0.5 * dt * k1), si, phi(r(t + 0.5 * dt), p), p.alphaO2, p);
    X = Math.min(1, X + dt * k2);
    t += dt;
    if (X >= p.xPeau) return t / 24;
  }
  return Infinity;
}

// État du pot à un instant donné (en jours) : interpolation dans la trajectoire de simulerPot (instants en échelle log).
export function etatPotA(trajPot, jours) {
  if (jours <= trajPot[0].jour) return trajPot[0];
  const dern = trajPot[trajPot.length - 1];
  if (jours >= dern.jour) return dern;
  let lo = 0, hi = trajPot.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (trajPot[mid].jour <= jours) lo = mid; else hi = mid; }
  const a = trajPot[lo], b = trajPot[hi];
  const u = (jours - a.jour) / (b.jour - a.jour);
  const mix = (x, y) => x + (y - x) * u;
  // La peau et le profil suivent le plus proche des deux instants (pas d'interpolation d'un tableau)
  const proche = u < 0.5 ? a : b;
  return { jour: jours, cSurface: mix(a.cSurface, b.cSurface), xSurface: mix(a.xSurface, b.xSurface),
    peauMm: mix(a.peauMm, b.peauMm), profil: proche.profil, dzMm: proche.dzMm };
}

// Instant (en jours) où une peau d'au moins 0,1 mm est présente ; Infinity si jamais sur la durée simulée.
export function jourPeau(trajPot, seuilMm = 0.1) {
  for (const e of trajPot) if (e.peauMm >= seuilMm) return e.jour;
  return Infinity;
}

// Arrondi à n chiffres significatifs (même convention que le reste du site)
export function arrondiSig(x, n) {
  if (!isFinite(x) || x === 0) return x;
  const e = Math.floor(Math.log10(Math.abs(x)));
  const f = Math.pow(10, n - 1 - e);
  return Math.round(x * f) / f;
}

// ---------- Défi : cahier des charges d'une lasure ----------

// Plage de siccatif recommandée par le fournisseur (document 4 : 4 à 6 g de 141 Z pour 100 g de résine sèche à huile longue ;
// la formule contient 40 g de résine sèche pour 100 g -> 1,6 à 2,4 g pour 100 g de formule).
export const PLAGE_SICCATIF = [1.6, 2.4];
// Chaque cahier des charges : pas de peau avant j jours ET dureté Persoz à 12 h d'au moins p secondes, avec un siccatif dans la plage.
// Les seuils sont choisis à 3 s environ sous la frontière réalisable (voir lasureModele.test.mjs) : plusieurs solutions existent.
export const CAHIERS_DEFI = [{ j: 30, p: 35 }, { j: 45, p: 30 }, { j: 60, p: 26 }, { j: 90, p: 21 }];

// Valeurs AFFICHÉES à l'élève (dureté entière en s ; délai de peau, Infinity = pas de peau avant 3 mois) : le critère se juge dessus.
export function evaluerFormule(si, ap) {
  return { p: Math.round(dureteA(12, si, ap)), j: jourPeauRapide(si, ap, 90) };
}
export function respecteCahier(si, ap, cdc) {
  const { p, j } = evaluerFormule(si, ap);
  const jours = j === Infinity ? Infinity : Math.round(j);
  return p >= cdc.p && jours >= cdc.j && si >= PLAGE_SICCATIF[0] - 1e-9 && si <= PLAGE_SICCATIF[1] + 1e-9;
}
