// Modèle de la simulation 221 « Sens de l'émulsion : H/E ou E/H, et comment l'épaissir ».
// Deux parties : (1) reconnaître la phase continue (dilution, colorants, conductimétrie) ; (2) viscosité en fonction de la fraction de phase DISPERSÉE.
// Tout est qualitatif ou en ordres de grandeur annoncés dans le panneau d'hypothèses de la simulation.

export const TYPES = ['H/E', 'E/H'];
export const phaseContinue = t => (t === 'H/E' ? 'eau' : 'huile');
export const phaseDispersee = t => (t === 'H/E' ? 'huile' : 'eau');
export const nomType = t => (t === 'H/E' ? 'H/E (huile dans eau)' : 'E/H (eau dans huile)');

// ---------- 1. Test de dilution ----------
// Une goutte d'émulsion déposée dans un liquide se disperse si ce liquide est miscible avec la phase CONTINUE ; sinon elle reste en bloc.
export const sedisperse = (type, milieu) => phaseContinue(type) === milieu;

// ---------- 2. Colorants ----------
// Rouge Soudan (RS) : liposoluble, colore l'huile. Bleu de méthylène (BM) : hydrosoluble, colore l'eau. Chaque colorant se teste dans son propre échantillon (on ne les mélange jamais).
export const COLORANTS = ['aucun', 'RS', 'BM'];
export const couleurDe = (colorant, phase) => {
  if (phase === 'huile') return colorant === 'RS' ? 'rouge' : null;
  return colorant === 'BM' ? 'bleu' : null;
};
// Ce qu'on voit au microscope : la couleur du fond (phase continue) et celle des gouttes (phase dispersée) ; null = phase non colorée.
export function coloration(type, colorant) {
  return { fond: couleurDe(colorant, phaseContinue(type)), gouttes: couleurDe(colorant, phaseDispersee(type)) };
}
// Lecture du microscope : le fond coloré est la phase continue ; si le fond n'est pas coloré, la couleur des gouttes donne la phase dispersée.
export function lireColoration(fond, gouttes) {
  const phase = c => (c === 'rouge' ? 'huile' : c === 'bleu' ? 'eau' : null);
  const continue_ = phase(fond) ?? (phase(gouttes) ? (phase(gouttes) === 'eau' ? 'huile' : 'eau') : null);
  return continue_ === 'eau' ? 'H/E' : continue_ === 'huile' ? 'E/H' : null;
}

// ---------- 3. Conductimétrie ----------
// σ de la phase aqueuse : eau déminéralisée avec un peu de tensioactif et des traces d'ions ≈ 6 µS/cm, + 126 µS/cm par mmol/L de NaCl (Λ ≈ 126 S·cm²/mol).
export const sigmaAqueuse = cmmol => 6 + 126 * cmmol;
// Émulsion H/E : sphères isolantes (huile) dans un milieu conducteur : σ = σ_eau · 2(1 − φ) / (2 + φ) (Maxwell). Émulsion E/H : l'huile, isolante, est continue : σ < 1 µS/cm.
export const SIGMA_EH = 0.3;
export function conductivite(type, phi, cmmol) {
  if (type === 'E/H') return SIGMA_EH;
  return sigmaAqueuse(cmmol) * 2 * (1 - phi) / (2 + phi);
}
// Une conductivité « forte » (> 100 µS/cm) est le signe d'une phase aqueuse continue ; en dessous de 10 µS/cm on ne peut pas conclure (eau pure, sans sel).
export const verdictConductivite = s => (s >= 100 ? 'H/E' : s < 1 ? 'E/H' : null);

// Affichage d'une conductivité (µS/cm) : « < 1 µS/cm », « 760 µS/cm » ou « 1,27 mS/cm »
export const lectureConduct = s => (s < 1 ? '< 1 µS/cm' : s < 1000 ? `${Math.round(s)} µS/cm` : `${(s / 1000).toFixed(2).replace('.', ',')} mS/cm`);

// ---------- 4. Viscosité et ajout d'une phase ----------
// Modèle de Krieger–Dougherty : η = η_continue · (1 − φ/φm)^(−2,5·φm), φ = fraction volumique de phase DISPERSÉE, φm = 0,74 (empilement compact de sphères identiques).
export const PHI_M = 0.74;
export const PHI_MODELE = 0.70;          // au-delà, le modèle n'est plus valable (gouttes déformées en polyèdres)
export const ETA_EAU = 0.005;            // Pa·s : phase aqueuse d'une sauce (eau, vinaigre, jaune d'œuf)
export const ETA_HUILE = 0.060;          // Pa·s : huile végétale
export const etaContinue = type => (type === 'H/E' ? ETA_EAU : ETA_HUILE);
export const viscositeRelative = phi => Math.pow(1 - Math.min(phi, PHI_MODELE) / PHI_M, -2.5 * PHI_M);
export const viscosite = (type, phi) => etaContinue(type) * viscositeRelative(phi);
export const horsModele = phi => phi > PHI_MODELE;

export const phi = e => e.Vd / e.V;
// État d'une émulsion : type, volume total V (mL), volume de phase dispersée Vd (mL).
export const etatInitial = (type, V, Vd) => ({ type, V, Vd });
// On ajoute v (mL) de la phase « eau » ou « huile » (sans changer le nombre de gouttes : elles grossissent ou s'écartent).
export function ajouter(e, phase, v) {
  return { ...e, V: e.V + v, Vd: phase === phaseDispersee(e.type) ? e.Vd + v : e.Vd };
}
// Volume x de phase dispersée à ajouter pour atteindre la fraction phiCible : (Vd + x) / (V + x) = phiCible
export const volumeAAjouter = (e, phiCible) => (phiCible * e.V - e.Vd) / (1 - phiCible);

export function regimeGouttes(p) {
  if (p < 0.30) return 'gouttes isolées, très écartées : émulsion fluide';
  if (p < 0.50) return 'gouttes séparées par la phase continue : crème ou lotion';
  if (p < 0.64) return 'gouttes de plus en plus serrées : la phase continue passe entre elles avec difficulté';
  if (p < PHI_M) return 'gouttes serrées, presque au contact : émulsion épaisse';
  if (p < 0.80) return 'gouttes déformées en polyèdres : émulsion très épaisse (mayonnaise ferme), fragile';
  return 'au-delà de 80 % : émulsion très instable, risque de coalescence ou d’inversion de phase';
}

// ---------- 5. Tirages des défis ----------
const choix = (L, r) => L[Math.floor(r() * L.length) % L.length];
const arrondi = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;

// Défi « sens » : résultats de tests donnés, dont certains ne permettent pas de conclure ; le test de dilution est toujours présent et décisif.
export const SCENARIOS = ['complet', 'conduction-faible', 'sans-dilution'];
export function tirageSens(r = Math.random, forcer = {}) {
  const type = forcer.type ?? choix(TYPES, r);
  const scenario = forcer.scenario ?? choix(SCENARIOS, r);
  const cmmol = type === 'H/E' ? (scenario === 'conduction-faible' ? 0 : choix([5, 10, 20, 30], r)) : 0;
  const sigma = conductivite(type, choix([0.3, 0.35, 0.4, 0.45], r), cmmol);
  const tests = { dilution: scenario !== 'sans-dilution', conduction: true, colorants: scenario === 'complet' || scenario === 'sans-dilution' ? 'micro' : 'oeil' };
  return { type, scenario, cmmol, sigma, tests };
}
// Quel test permet de conclure ?
export function testsDecisifs(d) {
  const L = [];
  if (d.tests.dilution) L.push('dilution');
  if (d.tests.colorants === 'micro') L.push('colorants (au microscope)');
  const v = verdictConductivite(d.sigma);
  if (v) L.push('conductimétrie');
  return L;
}

// Défi « épaissir » : quelle phase ajouter et quel volume pour atteindre la fraction de phase dispersée visée.
export function tirageEpaissir(r = Math.random, forcer = {}) {
  const type = forcer.type ?? choix(TYPES, r);
  const V = choix([100, 150, 200, 250, 300], r);
  const phi0 = type === 'H/E' ? choix([0.45, 0.50, 0.55], r) : choix([0.25, 0.30, 0.35, 0.40], r);
  const phiCible = arrondi(phi0 + choix([0.10, 0.15], r), 2);
  const e = etatInitial(type, V, arrondi(phi0 * V, 0));
  const x = volumeAAjouter(e, phiCible);
  return { e, phi0: phi(e), phiCible, phase: phaseDispersee(type), x };
}
