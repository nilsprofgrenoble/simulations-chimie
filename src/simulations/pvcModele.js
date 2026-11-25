// ====================================================
//  Modèle « Cellule photovoltaïque : du photon au rendement » (sim 242, TG spé PC, « Décrire la lumière par un flux de photons » :
//  absorption et émission de photons, enjeux énergétiques, rendement d'une cellule photovoltaïque). Modèle pur (sans React), test : pvcModele.test.mjs.
//  Énergie d'un photon : E = h c / λ. Un photon n'est absorbé (et ne libère un électron) que si E ≥ Eseuil, énergie seuil Eseuil du semi-conducteur (le « gap » des physiciens).
//  Puissance reçue : P_reçue = E_éclairement × S ; puissance électrique : P_él = U × I ; rendement η = P_él / P_reçue ; pertes = P_reçue − P_él.
// ====================================================
export const H = 6.63e-34;      // J·s
export const C = 3.00e8;        // m·s⁻¹
export const EV = 1.60e-19;     // J par eV
export const CELLULES = [
  { id: 'si-mono', nom: 'Silicium monocristallin', court: 'Si monocristallin', gap: 1.12, eta: 0.21 },
  { id: 'si-poly', nom: 'Silicium polycristallin', court: 'Si polycristallin', gap: 1.12, eta: 0.17 },
  { id: 'cdte', nom: 'Tellurure de cadmium (couche mince)', court: 'CdTe couche mince', gap: 1.5, eta: 0.18 },
];                                // valeurs arrondies de modules commerciaux (références publiques : NREL, fabricants) ; η supposé constant
export const cellule = id => CELLULES.find(c => c.id === id);

export const energieJ = lambdaNm => H * C / (lambdaNm * 1e-9);              // J
export const energieEv = lambdaNm => energieJ(lambdaNm) / EV;                // eV
export const lambdaMaxNm = gapEv => H * C / (gapEv * EV) * 1e9;              // nm
export const absorbe = (lambdaNm, gapEv) => energieEv(lambdaNm) >= gapEv;
export const recue = (E, S) => E * S;                                        // W
export const electrique = (U, I) => U * I;                                   // W
export const rendement = (Pel, Prec) => Pel / Prec;
export const pertes = (Prec, Pel) => Prec - Pel;
/** Couleur approchée d'une longueur d'onde (nm) pour les schémas ; au-delà de 780 nm : infrarouge, en dessous de 380 : ultraviolet. */
export const domaine = l => (l < 380 ? 'ultraviolet' : l > 780 ? 'infrarouge' : 'visible');

export function rngGraine(graine) {
  let a = (graine >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const r2 = x => Number(x.toPrecision(2));
export const ecartArrondi = x => Math.abs(r2(x) - x) / Math.abs(x);
const tire = (t, rng) => t[Math.floor(rng() * t.length)];

/** Défi « rendement » : E (W·m⁻²), S (m²), U (V), I (A) affichés (2 CS) ; Q1 P_reçue ; Q2 P_él ; Q3 rendement en %. */
export function tirageRendement(rng = Math.random) {
  for (;;) {
    const E = tire([600, 700, 800, 900, 1000], rng), S = tire([0.010, 0.012, 0.015, 0.020, 0.025, 0.030, 0.040], rng);
    const U = tire([0.48, 0.50, 0.52, 0.54, 0.56, 0.58], rng), eta = 0.12 + 0.10 * rng();
    const I = r2(eta * E * S / U);
    const Prec = recue(E, S), Pel = electrique(U, I), et = 100 * rendement(Pel, Prec);
    if (et < 11 || et > 24 || Pel < 0.4) continue;
    if (ecartArrondi(Prec) > 0.03 || ecartArrondi(Pel) > 0.03 || ecartArrondi(et) > 0.03) continue;
    if (Math.abs(100 * r2(Pel) / r2(Prec) - et) > 0.07 * et) continue;      // chaîne arrondie (2 CS) acceptée par la tolérance de Q3
    return { type: 'rendement', E, S, U, I, rep1: Prec, rep2: Pel, rep3: et };
  }
}
/** Défi « seuil » : gap (eV) affiché ; Q1 énergie de gap en J ; Q2 longueur d'onde maximale (nm) ; Q3 énergie en eV d'un photon de longueur d'onde L0 (nm). */
export function tirageSeuil(rng = Math.random) {
  for (;;) {
    const gap = tire([1.10, 1.20, 1.40, 1.50, 1.70, 2.00], rng), L0 = tire([450, 520, 600, 700, 800, 900, 1000, 1200, 1400], rng);
    const E1 = gap * EV, lm = lambdaMaxNm(gap), E3 = energieEv(L0);
    if (Math.abs(L0 - lm) / lm < 0.12) continue;
    if (ecartArrondi(E1) > 0.03 || ecartArrondi(lm) > 0.03 || ecartArrondi(E3) > 0.03) continue;
    return { type: 'seuil', gap, L0, rep1: E1, rep2: lm, rep3: E3, absorbe: E3 >= gap };
  }
}
