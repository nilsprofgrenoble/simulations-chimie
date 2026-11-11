// src/simulations/epaisseursAssociatifsModele.js
// Modèle pur — simulation « Épaississants associatifs : ASE, HASE, HEUR » (BTS MDC, formulation).
// Aucune dépendance : utilisable côté React et dans les tests node (.test.mjs).
// Unités : viscosités en mPa·s, gradients de vitesse γ̇ en s⁻¹, temps en s, pH sans unité.
//
// Cadre physique (affiché dans « Hypothèses de travail » de la simulation) :
// - le milieu (eau + polymère hors réseau) est traité newtonien, de viscosité η_inf ;
// - la viscosité supplémentaire vient d'un réseau transitoire de liaisons entre
//   modifications hydrophobes (liaisons « auto-associantes », lâches) pour un HASE ;
// - pour un HEUR, les liaisons gant-particule (associatives, fortes) résistent au
//   cisaillement : viscosité quasi constante (léger amollissement aux très hauts γ̇) ;
// - la cinétique du réseau est dλ/dt = (1-λ)/τ_récup - k·γ̇·λ : les liaisons cassent
//   vite sous cisaillement et se reforment lentement. La rhéofluidification ET la
//   thixotropie (hystérésis, régénération partielle au test 3ITT) émergent de cette
//   seule équation : rien n'est plaqué.
//
// Calibration (ordres de grandeur, sources : TDS Coatex Thixol 53 L) :
// - Brookfield d'une laque bois contenant du Thixol 53 L : ~9 000 mPa·s à 10 rpm,
//   ~1 500 mPa·s à 100 rpm -> on retient η(1 s⁻¹) ≈ 11 000 et η(100 s⁻¹) ≈ 1 500 mPa·s.
//   ATTENTION : la conversion tr/min -> s⁻¹ dépend du mobile et de la géométrie, ce n'est
//   pas une équivalence : on reprend l'ordre de grandeur et le rapport (≈ 6 à 7), pas un ajustement ;
// - le HASE est modélisé NEUTRALISÉ (pH 8-9, état d'emploi) : sa dépendance au pH
//   (livré à pH 3 dans la TDS) n'est pas modélisée, seule celle de l'ASE l'est ;
// - « relatively low speed viscosity recovering » (TDS Thixol) -> τ_récup = 60 s ;
// - Coapur 3025 : « pure Newtonian rheology » -> variation < 8 % sur tout le domaine.

export const PARAMS = {
  // HASE (type Thixol 53 L) : réseau auto-associé dominant à bas gradient.
  hase: {
    etaInf: 400,     // viscosité du milieu sans réseau (mPa·s) — ordre de grandeur d'une laque non épaissie
    delta: 11600,    // apport du réseau auto-associé quand λ = 1 (mPa·s)
    tauRec: 60,      // reformation des liaisons auto-associantes (s), lente -> thixotropie visible
    k: 0.00158,      // efficacité de la cassure par gradient : k·τ = 0,0948 s -> γ̇ de demi-réseau ≈ 10,5 s⁻¹
  },
  // Notre HEUR (type Coapur 3025) : liaisons gant-particule maintenues -> quasi newtonien.
  // C'est une propriété de CE produit (ses greffons adsorbent fort et s'associent peu
  // entre eux), pas de l'architecture HEUR : un autre HEUR peut être thixotrope.
  heur: {
    etaBase: 3200,   // viscosité quasi constante à dose normale (mPa·s)
    epsilon: 0.08,   // amollissement maximal aux très hauts gradients (liaisons auto-associantes rares)
    gammaDemi: 4000, // gradient de demi-effet de cet amollissement (s⁻¹)
    // Dose forte uniquement (« pour aller plus loin » du TP) : un réseau auto-associé
    // apparaît entre molécules d'épaississant et apporte de la thixotropie.
    deltaAuto: 2600, // apport du réseau auto-associé à λ = 1 (mPa·s)
    tauRecAuto: 30,  // reformation (s) : plus rapide que le HASE mais non nulle
    kAuto: 0.001,    // kAuto·tauAuto = 0,03 s -> demi-réseau vers 33 s⁻¹
  },
  // ASE : pas de modification hydrophobe -> aucun réseau associatif. La viscosité
  // vient du gonflement de la chaîne par neutralisation des acides méthacryliques.
  ase: {
    etaInf: 400,     // viscosité du milieu (mPa·s)
    deltaMax: 9000,  // apport maximal de la chaîne gonflée (mPa·s)
    pKa: 4.6,        // acide méthacrylique ; TDS Thixol : livré à pH 3, épaissit à pH 8-9
    gammaEtoile: 80, // enchevêtrements : léger cisaillement au-delà de 80 s⁻¹ (s⁻¹)
  },
};

// Bandes de gradient (mêmes valeurs que la simulation « Étude comparative de la
// rhéologie de deux peintures », pour homogénéiser le chapitre).
export const ZONES = [
  { min: 0.01, max: 0.1, nom: 'Sédimentation (en pot)' },
  { min: 0.1, max: 3, nom: 'Affaissement et nivellement (mur frais)' },
  { min: 10, max: 100, nom: 'Mélange (manufacture)' },
  { min: 500, max: 10000, nom: 'Application (pinceau, rouleau, projection)' },
];

export function zoneDeGradient(gamma) {
  const z = ZONES.find((zone) => gamma >= zone.min && gamma <= zone.max);
  return z ? z.nom : 'Entre deux zones';
}

// --- Réseau transitoire (paramètre de structure λ, 0 <= λ <= 1) ---

// Régime permanent : dλ/dt = 0 -> λ = 1/(1 + k·τ·γ̇).
export function lambdaStatio(gamma, { k, tauRec }) {
  return 1 / (1 + k * tauRec * gamma);
}

// Intégration EXACTE de dλ/dt = (1-λ)/τ - k·γ̇·λ sur un pas dt à γ̇ constant
// (équation linéaire : solution exponentielle, stable quel que soit dt).
export function pasLambda(lambda, gamma, dt, { k, tauRec }) {
  const a = 1 / tauRec;
  const b = a + k * gamma;
  const lss = a / b;
  return lss + (lambda - lss) * Math.exp(-b * dt);
}

// --- Viscosités instantanées (η en mPa·s) ---

// HASE : η = η_inf + Δ·λ. Le cisaillement n'agit que par la structure λ.
export function etaInstantaneHASE(lambda, p = PARAMS.hase) {
  return p.etaInf + p.delta * lambda;
}

// HEUR : liaisons gant-particule maintenues ; léger amollissement aux très hauts γ̇.
export function etaHEUR(gamma, p = PARAMS.heur) {
  return p.etaBase * (1 - p.epsilon * (gamma / (gamma + p.gammaDemi)));
}

// HEUR à dose forte : réseau auto-associé supplémentaire, piloté par λ.
export function etaInstantaneHEURForte(gamma, lambda, p = PARAMS.heur) {
  return etaHEUR(gamma, p) + p.deltaAuto * lambda;
}

// ASE : fraction ionisée (Henderson-Hasselbalch) puis léger cisaillement d'enchevêtrements.
export function fractionIonisee(pH, pKa = PARAMS.ase.pKa) {
  return 1 / (1 + Math.pow(10, pKa - pH));
}
export function etaASE(gamma, pH, p = PARAMS.ase) {
  const sigma = fractionIonisee(pH, p.pKa);
  return p.etaInf + p.deltaMax * sigma / (1 + gamma / p.gammaEtoile);
}

// --- Viscosités en régime permanent (pour les courbes η(γ̇)) ---

export function etaStatioHASE(gamma, p = PARAMS.hase) {
  return etaInstantaneHASE(lambdaStatio(gamma, p), p);
}

export function etaStatioHEURForte(gamma, p = PARAMS.heur) {
  return etaInstantaneHEURForte(gamma, lambdaStatio(gamma, { k: p.kAuto, tauRec: p.tauRecAuto }), p);
}

export function etaStatio(famille, gamma, { pH = 8.5, doseForte = false } = {}) {
  if (famille === 'hase') return etaStatioHASE(gamma);
  if (famille === 'heur') return doseForte ? etaStatioHEURForte(gamma) : etaHEUR(gamma);
  if (famille === 'ase') return etaASE(gamma, pH);
  throw new Error('Famille inconnue : ' + famille);
}

// Viscosité instantanée, toutes familles (λ ignoré quand il n'y a pas de réseau).
export function etaInstantane(famille, gamma, lambda, { pH = 8.5, doseForte = false } = {}) {
  if (famille === 'hase') return etaInstantaneHASE(lambda);
  if (famille === 'heur') return doseForte ? etaInstantaneHEURForte(gamma, lambda) : etaHEUR(gamma);
  if (famille === 'ase') return etaASE(gamma, pH);
  throw new Error('Famille inconnue : ' + famille);
}

// Paramètres cinétiques du réseau (si la famille en a un), sinon null.
export function cinetiqueReseau(famille, doseForte = false) {
  if (famille === 'hase') return { k: PARAMS.hase.k, tauRec: PARAMS.hase.tauRec };
  if (famille === 'heur' && doseForte) return { k: PARAMS.heur.kAuto, tauRec: PARAMS.heur.tauRecAuto };
  return null;
}

// --- Rampe de gradient aller-retour (hystérésis = thixotropie) ---

// Chaque point de la rampe dure `palier` secondes ; λ évolue pendant ce palier
// (il « traîne » derrière son régime permanent : c'est la thixotropie).
export function simulerRappe({
  famille = 'hase',
  gammaMin = 0.1,
  gammaMax = 300,
  nPoints = 20,
  palier = 0.8,   // s passées à chaque gradient (hypothèse affichée côté vue)
  dt = 0.05,      // s
  pH = 8.5,
  doseForte = false,
} = {}) {
  const cin = cinetiqueReseau(famille, doseForte);
  const gammas = [];
  for (let i = 0; i < nPoints; i++) {
    gammas.push(gammaMin * Math.pow(gammaMax / gammaMin, i / (nPoints - 1)));
  }
  let lambda = cin ? lambdaStatio(gammaMin, cin) : 1;
  const montee = [];
  const descente = [];
  for (const g of gammas) {
    if (cin) {
      const n = Math.max(1, Math.round(palier / dt));
      for (let j = 0; j < n; j++) lambda = pasLambda(lambda, g, palier / n, cin);
    }
    montee.push({ gamma: g, lambda, eta: etaInstantane(famille, g, lambda, { pH, doseForte }), sens: 1 });
  }
  for (const g of [...gammas].reverse()) {
    if (cin) {
      const n = Math.max(1, Math.round(palier / dt));
      for (let j = 0; j < n; j++) lambda = pasLambda(lambda, g, palier / n, cin);
    }
    descente.push({ gamma: g, lambda, eta: etaInstantane(famille, g, lambda, { pH, doseForte }), sens: -1 });
  }
  return { montee, descente };
}

// Amplitude de l'hystérésis : moyenne des (η_montée - η_descente) aux γ̇ communs > 0.
export function hysteresisMoyenne(rappe) {
  let somme = 0;
  let n = 0;
  for (const p of rappe.montee) {
    const q = rappe.descente.find((d) => procheGamma(d.gamma, p.gamma));
    if (q) { somme += p.eta - q.eta; n++; }
  }
  return n ? somme / n : 0;
}
function procheGamma(a, b) { return Math.abs(a - b) / Math.max(a, b) < 1e-9; }

// --- Test 3ITT (trois intervalles de gradient : repos, cisaillement, repos) ---

export function simuler3ITT({
  famille = 'hase',
  phases = [{ gamma: 1, duree: 20 }, { gamma: 256, duree: 20 }, { gamma: 1, duree: 80 }],
  dt = 0.25,
  pH = 8.5,
  doseForte = false,
} = {}) {
  const cin = cinetiqueReseau(famille, doseForte);
  const g0 = phases[0].gamma;
  let lambda = cin ? lambdaStatio(g0, cin) : 1;
  const etaRef = etaInstantane(famille, g0, lambda, { pH, doseForte });
  const points = [];
  let t = 0;
  let lambdaCourant = lambda;
  for (const phase of phases) {
    const n = Math.max(1, Math.round(phase.duree / dt));
    for (let j = 0; j < n; j++) {
      if (cin) lambdaCourant = pasLambda(lambdaCourant, phase.gamma, phase.duree / n, cin);
      t += phase.duree / n;
      points.push({
        t,
        gamma: phase.gamma,
        lambda: lambdaCourant,
        eta: etaInstantane(famille, phase.gamma, lambdaCourant, { pH, doseForte }),
      });
    }
  }
  const etaFinal = points[points.length - 1].eta;
  return {
    points,
    etaRef,
    etaFinal,
    // Méthode M1 (même définition que le TP peintures) : régénération à la fin du 3e palier.
    regeneration: (etaFinal / etaRef) * 100,
  };
}

// --- Scène moléculaire (zoom animé côté vue, géométrie précalculée) ---

// Générateur pseudo-aléatoire déterministe (tests reproductibles).
export function mulberry32(graine) {
  let a = graine >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Types de groupes hydrophobes :
// - 'gant' : interagit avec les particules (liaison associative, forte) ET avec un
//   autre gant (liaison auto-associante, lâche) ;
// - 'crochet' : s'associe uniquement avec un autre crochet (jamais les particules).
export const TYPES_GROUPE = {
  gant: { avecParticule: true, avecMemeType: true, force: 'forte (difficile à défaire)' },
  crochet: { avecParticule: false, avecMemeType: true, force: 'lâche (facile à défaire)' },
};

export function construireScene({
  famille = 'hase',
  L = 900,
  H = 430,
  gonflement = 1,   // ASE : 0 = chaîne repliée (pH acide), 1 = chaîne gonflée (pH 8-9)
} = {}) {
  // Layout volontairement DÉTERMINISTE (aucun tirage aléatoire) : trois chaînes
  // horizontales bien séparées, une par rangée, et les particules regroupées à
  // droite. Objectif : une scène lisible même en petit format (téléphone).
  const chaines = [];
  // Amplitude d'ondulation : fixe pour HASE/HEUR ; pour l'ASE, la chaîne se
  // déploie quand la neutralisation la gonfle (fraction ionisée croissante).
  const ampl = famille === 'ase' ? 4 + 18 * Math.min(1, Math.max(0, gonflement)) : 16;
  const yRanges = [80, 200, 320];
  const phases = [0.7, 2.1, 3.6];
  for (let c = 0; c < 3; c++) {
    const points = [];
    for (let i = 0; i <= 14; i++) {
      points.push({
        x: 30 + i * 30,
        y: yRanges[c] + ampl * Math.sin(i * 1.05 + phases[c]),
      });
    }
    const groupes = [];
    if (famille === 'hase' || famille === 'heur') {
      // Convention du TP (TPF4) : le Thixol 53 L (HASE) est dessiné avec des crochets
      // (liaisons auto-associantes seulement) ; le Coapur 3025 (HEUR) avec des gants
      // (liaisons associatives avec les particules, et auto-associantes entre gants).
      const type = famille === 'hase' ? 'crochet' : 'gant';
      for (const i of [4, 8, 12]) {
        groupes.push({ i, x: points[i].x, y: points[i].y, type });
      }
    }
    chaines.push({ points, groupes });
  }
  const particules = [
    { x: 600, y: 110, r: 26, nom: 'TiO₂' },
    { x: 610, y: 310, r: 24, nom: 'CaCO₃' },
    { x: 640, y: 240, r: 23, nom: 'Talc' },
    { x: 530, y: 215, r: 22, nom: 'TiO₂' },
  ];
  // Paires candidates, précalculées une fois (stables quand on bouge le curseur).
  const pairesAuto = [];
  const pairesAssoc = [];
  if (famille === 'hase' || famille === 'heur') {
    const groupes = chaines.flatMap((ch) => ch.groupes.map((g) => ({ ...g, chaine: ch })));
    for (let i = 0; i < groupes.length; i++) {
      for (let j = i + 1; j < groupes.length; j++) {
        const a = groupes[i];
        const b = groupes[j];
        if (a.chaine === b.chaine) continue;
        if (a.type === 'crochet' || b.type === 'crochet') continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 200) pairesAuto.push({ a, b, d });
      }
      if (groupes[i].type === 'gant') {
        for (const part of particules) {
          const d = Math.hypot(groupes[i].x - part.x, groupes[i].y - part.y);
          if (d < 260) pairesAssoc.push({ g: groupes[i], part, d });
        }
      }
    }
  }
  // Crochets : uniquement entre crochets (jamais les particules, jamais les gants).
  const crochets = chaines.flatMap((ch) => ch.groupes.filter((g) => g.type === 'crochet'));
  const pairesCrochet = [];
  for (let i = 0; i < crochets.length; i++) {
    for (let j = i + 1; j < crochets.length; j++) {
      if (chaines.some((ch) => ch.groupes.includes(crochets[i]) && ch.groupes.includes(crochets[j]))) continue; // jamais sur la même chaîne
      const d = Math.hypot(crochets[i].x - crochets[j].x, crochets[i].y - crochets[j].y);
      if (d < 200) pairesCrochet.push({ a: crochets[i], b: crochets[j], d });
    }
  }
  // Les liaisons de plus courte portée résistent le plus longtemps : on trie par distance.
  for (const liste of [pairesAuto, pairesAssoc, pairesCrochet]) liste.sort((u, v) => u.d - v.d);
  return { famille, chaines, particules, pairesAuto, pairesAssoc, pairesCrochet, L, H };
}

// Liaisons actives à l'instant donné. Les liaisons cassées le sont toujours dans le
// même ordre (celles de plus courte portée résistent le plus longtemps) : le
// mouvement du curseur est lisible, sans saut aléatoire d'une image à l'autre.
export function majLiaisons(scene, { gamma = 0.1, lambda = 1, doseForte = false } = {}) {
  const fam = scene.famille;
  if (fam === 'ase') return { auto: [], assoc: [], crochet: [], nAuto: 0, nAssoc: 0, nCrochet: 0 };
  const auto = [];
  const assoc = [];
  const crochet = [];
  if (fam === 'hase') {
    // HASE du TP (crochets) : réseau auto-associé seul, piloté par λ (casse sous cisaillement).
    const nC = Math.round(scene.pairesCrochet.length * Math.min(1, Math.max(0, lambda)));
    for (let i = 0; i < nC; i++) crochet.push(scene.pairesCrochet[i]);
  } else if (fam === 'heur') {
    // Liaisons gant-particule maintenues : seules une petite fraction lâche aux
    // très hauts gradients (modèle η_HEUR : fraction tenue = 1 - ε·γ/(γ+γ_d)).
    const p = PARAMS.heur;
    const tenue = 1 - p.epsilon * (gamma / (gamma + p.gammaDemi));
    const nAssoc = Math.round(scene.pairesAssoc.length * tenue);
    for (let i = 0; i < nAssoc; i++) assoc.push(scene.pairesAssoc[i]);
    // Liaisons auto-associantes : absentes à dose normale, réseau λ à dose forte.
    const nAuto = doseForte
      ? Math.round(scene.pairesAuto.length * Math.min(1, Math.max(0, lambda)))
      : 0;
    for (let i = 0; i < nAuto; i++) auto.push(scene.pairesAuto[i]);
  }
  return {
    auto,
    assoc,
    crochet,
    nAuto: auto.length,
    nAssoc: assoc.length,
    nCrochet: crochet.length,
    nAutoTotal: scene.pairesAuto.length,
    nAssocTotal: scene.pairesAssoc.length,
    nCrochetTotal: scene.pairesCrochet.length,
  };
}

// --- Tirages aléatoires pour le défi et la banque ---

export const FAMILLES_DEFI = ['ase', 'hase', 'heur'];

const NOMS_FICTIFS = ['Thickal 210', 'Rheomur 45', 'Viscolan 8', 'Polyrheo 33', 'Addiguard 120', 'Novavisc 77'];

const PHRASES = {
  ase: [
    'Émulsion acrylique alcali-gonflable : la viscosité se développe après neutralisation, à pH 8-9.',
    'Épaississant acrylique sans modification hydrophobe, fourni à pH acide.',
  ],
  hase: [
    'Épaississant acrylique associatif fournissant un profil rhéologique fortement pseudoplastique.',
    'Empêche la sédimentation et l’affaissement sans nuire au nivellement ; effet thixotrope réel.',
    'Développe son efficacité par des interactions hydrophobes qui agissent aux très bas gradients.',
  ],
  heur: [
    'Modificateur de rhéologie polyuréthane non ionique fournissant une rhéologie purement newtonienne.',
    'Ajuste la viscosité aux hauts gradients : excellent pouvoir garnissant et résistance aux éclaboussures.',
    'Améliore le nivellement, réactif vis-à-vis de la plupart des latex.',
  ],
};

// --- Tirages aléatoires du défi et des exercices ---

// Arrondi à n chiffres significatifs : les données AFFICHÉES à l'élève sont celles du corrigé.
export function arrondiSig(x, n = 3) {
  if (!Number.isFinite(x) || x === 0) return x;
  const e = Math.floor(Math.log10(Math.abs(x)));
  const f = Math.pow(10, n - 1 - e);
  return Math.round(x * f) / f;
}

// Gradients (s⁻¹) du tableau de mesures d'une fiche : comme une TDS qui donne deux lectures.
export const GAMMAS_MESURES = [1, 100];

// Fiche type TDS pour une question de défi : famille tirée, phrases cohérentes, produit
// tiré dans des plages réalistes ; la TDS affiche deux viscosités mesurées (tableau) et
// la réponse (rapport η(1)/η(100)) se calcule à partir de ces valeurs arrondies.
export function tirerFicheTDS(rng = Math.random) {
  const famille = FAMILLES_DEFI[Math.floor(rng() * FAMILLES_DEFI.length)];
  const nom = NOMS_FICTIFS[Math.floor(rng() * NOMS_FICTIFS.length)];
  const phrases = PHRASES[famille].slice();
  // Deux phrases distinctes, ordre tiré.
  const extraits = [];
  while (extraits.length < 2) {
    const p = phrases[Math.floor(rng() * phrases.length)];
    if (!extraits.includes(p)) extraits.push(p);
  }
  // Paramètres du produit (plages réalistes, cf. PARAMS), arrondis comme sur une fiche :
  // - HASE : η_inf 300-600, Δ 8 000-15 000 mPa·s, γ̇ de demi-réseau 5-20 s⁻¹ ;
  // - HEUR : η quasi constante 2 500-4 000 mPa·s ;
  // - ASE : η_inf 300-600, Δ_max 6 000-12 000 mPa·s, pH d'usage 8,0-9,0 (au dixième).
  const fiche = { famille, nom, extraits, pH: Math.round((8 + rng()) * 10) / 10 };
  if (famille === 'hase') {
    fiche.params = {
      etaInf: Math.round(30 + rng() * 30) * 10,
      delta: Math.round(80 + rng() * 70) * 100,
      gammaEtoile: Math.round(5 * Math.pow(4, rng()) * 10) / 10,
    };
    fiche.params.tauRec = PARAMS.hase.tauRec;
    fiche.params.k = 1 / (fiche.params.gammaEtoile * fiche.params.tauRec);
  } else if (famille === 'heur') {
    fiche.params = { etaBase: Math.round(250 + rng() * 150) * 10 };
  } else {
    fiche.params = {
      etaInf: Math.round(30 + rng() * 30) * 10,
      deltaMax: Math.round(60 + rng() * 60) * 100,
      pKa: PARAMS.ase.pKa,
      gammaEtoile: PARAMS.ase.gammaEtoile,
    };
  }
  fiche.mesures = GAMMAS_MESURES.map((g) => ({ gamma: g, eta: arrondiSig(etaStatioFiche(fiche, g), 3) }));
  // Réponse : calculée à partir des valeurs AFFICHÉES (donnée arrondie avant le calcul).
  fiche.rapportReponse = fiche.mesures[0].eta / fiche.mesures[1].eta;
  // Permutation aléatoire des options (la bonne réponse n'est pas toujours en tête).
  fiche.permut = Math.floor(rng() * 12);
  return fiche;
}

// Viscosité de régime permanent du produit décrit par la fiche (mPa·s). Le dispatch se
// fait sur la forme des paramètres du PRODUIT (réseau tenace, réseau cassable,
// gonflement au pH), jamais sur l'architecture : c'est elle qui fixe le
// comportement, pas le sigle ASE/HASE/HEUR.
export function etaStatioFiche(fiche, gamma) {
  const p = fiche.params;
  if (p.etaBase !== undefined) return p.etaBase;                                  // liaisons tenues : η constant
  if (p.deltaMax !== undefined) return p.etaInf + p.deltaMax / (1 + Math.pow(10, p.pKa - fiche.pH)) / (1 + gamma / p.gammaEtoile);
  return p.etaInf + p.delta / (1 + gamma / p.gammaEtoile);                        // réseau auto-associé cassable
}

// Profil du PRODUIT, calculé sur SA propre courbe η(γ̇). L'architecture (ASE, HASE,
// HEUR) désigne la nature du squelette et du greffon, jamais le comportement :
// selon les fonctions chimiques portées par les chaînes, un HASE peut être quasi
// newtonien et un HEUR thixotrope. Ici, notre HASE (Thixol 53 L) est
// rhéofluidifiant et notre HEUR (Coapur 3025) quasi newtonien ; la fiche décrit
// un produit, pas une famille.
export function profilFiche(fiche) {
  const bas = etaStatioFiche(fiche, 0.01);
  const haut = etaStatioFiche(fiche, 1000);
  return haut < 0.85 * bas ? 'Rhéofluidifiant (pseudoplastique)' : 'Newtonien';
}

// Décale la liste d'options de r rangs : la bonne réponse (indice b) change de place.
function tourner(base, b, r) {
  const n = base.length;
  const k0 = ((r % n) + n) % n;
  return { options: base.map((_, k) => base[(k - k0 + n) % n]), bonne: (b + k0) % n };
}

// Quatre questions du défi, toutes calculées à partir de la fiche tirée.
export function questionsDefi(fiche) {
  const familles = ['Un ASE', 'Un HASE', 'Un HEUR'];
  const bonneFamille = familles.indexOf(fiche.famille === 'ase' ? 'Un ASE' : fiche.famille === 'hase' ? 'Un HASE' : 'Un HEUR');
  const profils = ['Newtonien', 'Rhéofluidifiant (pseudoplastique)', 'Rhéoépaississant (dilatant)'];
  const bonProfil = profils.indexOf(profilFiche(fiche));
  const liaisons = {
    bonne: fiche.famille === 'ase'
      ? 'Aucune : pas de modification hydrophobe sur ce polymère'
      : 'Liaisons associatives avec les particules (fortes) et auto-associantes entre groupes (lâches)',
    faux1: fiche.famille === 'ase'
      ? 'Liaisons associatives avec les particules (fortes)'
      : 'Aucune : pas de modification hydrophobe sur ce polymère',
    faux2: 'Liaisons auto-associantes uniquement, jamais avec les particules',
    faux3: 'Aucune interaction : le polymère est purement hydrosoluble et inerte',
  };
  const q1 = tourner(familles, bonneFamille, fiche.permut);
  const q2 = tourner(profils, bonProfil, fiche.permut + 1);
  const q4 = tourner([liaisons.bonne, liaisons.faux1, liaisons.faux2, liaisons.faux3], 0, fiche.permut);
  return {
    fiche,
    q1: { q: `À quelle famille appartient « ${fiche.nom} » ?`, options: q1.options, bonne: q1.bonne },
    q2: { q: 'Quel profil de viscosité η(γ̇) attendre en régime permanent ?', options: q2.options, bonne: q2.bonne },
    q3: { q: 'Calculer le rapport η(1 s⁻¹) / η(100 s⁻¹) à partir du tableau de mesures.', vrai: fiche.rapportReponse },
    q4: { q: 'Quelles liaisons ce polymère peut-il former dans une peinture chargée en TiO₂ ?', options: q4.options, bonne: q4.bonne },
  };
}

// Fractions de liaisons en place (0 à 1), pour le dessin de la scène.
//  - crochet : liaisons crochet-crochet du HASE, pilotées par λ ;
//  - assoc   : liaisons gant-particule du HEUR, quasi maintenues (comme η_HEUR) ;
//  - auto    : liaisons gant-gant du HEUR, seulement à dose forte, pilotées par λ.
export function fractionsLiaisons(famille, { gamma = 0.1, lambda = 1, doseForte = false } = {}) {
  const l = Math.min(1, Math.max(0, lambda));
  if (famille === 'hase') return { crochet: l, assoc: 0, auto: 0 };
  if (famille === 'heur') {
    const p = PARAMS.heur;
    return { crochet: 0, assoc: 1 - p.epsilon * (gamma / (gamma + p.gammaDemi)), auto: doseForte ? l : 0 };
  }
  return { crochet: 0, assoc: 0, auto: 0 };
}

// ============================================================================
// Atelier du formulateur : une peinture épaissie par le Thixol 53 L (HASE) et le Coapur 3025 (HEUR).
// HYPOTHÈSES (à afficher à l'élève) :
//  1. Les contributions des deux épaississants s'ADDITIONNENT (les fiches disent qu'ils se combinent bien :
//     ce n'est pas une loi, c'est une simplification).
//  2. Chaque contribution est PROPORTIONNELLE à la dose (en réalité, l'effet croît plus vite que la dose).
//  3. Les courbes de référence sont celles du modèle, à la dose de référence : 0,4 % de Thixol sec
//     (ordre de grandeur de l'exemple de la fiche : 1,3 % de produit à 30 % d'extrait sec) et 1,5 % de Coapur sec
//     (fiche : 0,5 à 1,5 % en association, 1 à 3 % seul). Le niveau de viscosité du Coapur est un choix du modèle.
//  4. Le milieu (eau, liant, charges) apporte une viscosité newtonienne de base : PARAMS.hase.etaInf.
//  5. Les critères sont un cahier des charges PÉDAGOGIQUE en ordres de grandeur (pas des normes).
// ============================================================================

export const DOSES_REF = { thixol: 0.4, coapur: 1.5 }; // % d'épaississant sec sur la formule

export function etaPeinture(gamma, { thixol = 0, coapur = 0 } = {}) {
  const base = PARAMS.hase.etaInf;
  const aT = thixol / DOSES_REF.thixol;
  const aC = coapur / DOSES_REF.coapur;
  return base + aT * (etaStatio('hase', gamma, {}) - base) + aC * (etaStatio('heur', gamma, {}) - base);
}

export function regenerationPeinture({ thixol = 0, coapur = 0 } = {}) {
  const base = PARAMS.hase.etaInf;
  const aT = thixol / DOSES_REF.thixol;
  const aC = coapur / DOSES_REF.coapur;
  const h = simuler3ITT({ famille: 'hase' });
  const c = simuler3ITT({ famille: 'heur' });
  const comb = (eH, eC) => base + aT * (eH - base) + aC * (eC - base);
  const etaRef = comb(h.etaRef, c.etaRef);
  const etaFinal = comb(h.etaFinal, c.etaFinal);
  return { etaRef, etaFinal, regeneration: etaFinal / etaRef * 100 };
}

// Mesures réelles de deux peintures du commerce (viscosimètre LAMY RM100+, mobile MS-R3, 22–23 °C, rampe 1 → 300 → 1 s⁻¹, 2 s par palier).
// Viscosité en mPa·s : « aller » = gradient croissant, « retour » = gradient décroissant (l'écart des deux branches est l'hystérésis).
export const GAMMAS_PEINTURES = [1, 2, 4, 10, 20, 40, 80, 150, 220, 300];
export const PEINTURES_MESUREES = {
  A: {
    nom: 'Peinture A',
    aller: [18290, 12548, 8602, 5314, 3876, 2713, 1884, 1326, 1049, 874],
    retour: [15111, 10550, 7214, 4717, 3404, 2469, 1748, 1233, 994, 858],
  },
  B: {
    nom: 'Peinture B',
    aller: [28049, 17608, 10744, 5997, 3868, 2477, 1624, 1135, 935, 816],
    retour: [20308, 13031, 8715, 5069, 3483, 2327, 1588, 1120, 923, 812],
  },
};

// Cahier des charges d'une peinture mate haut de gamme (ordres de grandeur pédagogiques).
// Mur frais : encadre les deux peintures mesurées (18 et 28 Pa·s à 1 s⁻¹). Application : plus visqueuse à haut gradient que ces deux peintures (0,8 à 0,9 Pa·s à 300 s⁻¹).
export const CRITERES_PEINTURE = [
  { id: 'sedim', court: 'Tenue en pot', texte: 'Pas de sédimentation en pot : η(0,1 s⁻¹) d’au moins 8 000 mPa·s', gamma: 0.1, min: 8000, max: 60000, unite: 'mPa·s' },
  { id: 'affais', court: 'Mur frais', texte: 'Pas d’affaissement sur le mur frais : η(1 s⁻¹) entre 15 000 et 30 000 mPa·s', gamma: 1, min: 15000, max: 30000, unite: 'mPa·s' },
  { id: 'appli', court: 'Application', texte: 'Peu d’éclaboussures et film bien garni (haut de gamme) : η(300 s⁻¹) entre 1 500 et 3 000 mPa·s', gamma: 300, min: 1500, max: 3000, unite: 'mPa·s' },
  { id: 'thixo', court: 'Nivellement', texte: 'Retour progressif de la structure : régénération au test 3ITT entre 60 et 95 %', min: 60, max: 95, unite: '%' },
];

export function evaluerPeinture(doses) {
  return CRITERES_PEINTURE.map((c) => {
    const valeur = c.id === 'thixo' ? regenerationPeinture(doses).regeneration : etaPeinture(c.gamma, doses);
    return { ...c, valeur, ok: valeur >= c.min && valeur <= c.max };
  });
}
