// ====================================================
//  Modèle « Transferts thermiques : modes, flux et résistance thermique » (sim 235, TG spé PC, « L'énergie : conversions et transferts »,
//  « Effectuer des bilans d'énergie sur un système »). Modèle pur (sans React), test : transfertsThermModele.test.mjs.
//  Flux thermique φ (W) = énergie transférée par seconde : φ = Q / Δt. Résistance thermique Rth (K·W⁻¹) d'une paroi (DONNÉE) : φ = ΔT / Rth.
//  Régime permanent, paroi traversée dans un seul sens (du côté chaud vers le côté froid). Aucune formule de Rth (conductivité, épaisseur) : hors du niveau TG visé ici.
// ====================================================
export const ELEMENTS = [
  { id: 'fen1', nom: 'Fenêtre à simple vitrage (1,5 m²)', court: 'Fenêtre simple vitrage', R: 0.11 },
  { id: 'fen2', nom: 'Fenêtre à double vitrage (1,5 m²)', court: 'Fenêtre double vitrage', R: 0.24 },
  { id: 'mur0', nom: 'Mur en parpaing non isolé (10 m²)', court: 'Mur non isolé', R: 0.050 },
  { id: 'mur1', nom: 'Mur isolé (10 m²)', court: 'Mur isolé', R: 0.30 },
];                                          // Rth en K·W⁻¹, valeurs fictives mais réalistes, données à l'élève
export const elDe = id => ELEMENTS.find(x => x.id === id);

export const flux = (dT, R) => dT / R;                         // W
export const resistance = (dT, phi) => dT / phi;               // K·W⁻¹
export const ecart = (phi, R) => phi * R;                      // K
export const fluxDepuisEnergie = (Q, dt) => Q / dt;            // W (Q en J, Δt en s)
export const energie = (phi, dt) => phi * dt;                  // J
export const kWh = J => J / 3.6e6;

export function rngGraine(graine) {
  let a = (graine >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const r2 = x => Number(x.toPrecision(2));
/** Écart relatif dû à l'arrondi à 2 chiffres significatifs (l'élève qui arrondit φ avant de continuer ne doit pas sortir de la tolérance de 8 %). */
export const ecartArrondi = x => Math.abs(r2(x) - x) / Math.abs(x);
const tire = (t, rng) => t[Math.floor(rng() * t.length)];
/** Défi « paroi » : élément (Rth donnée), θint, θext, durée (h). Q1 : φ (W) ; Q2 : énergie perdue (kWh) ; Q3 : Rth minimale (K·W⁻¹) pour que la perte soit au plus φ′ (W), même ΔT. */
export function tirageParoi(rng = Math.random) {
  for (;;) {
    const el = tire(ELEMENTS, rng), Ti = tire([18, 19, 20, 21, 22], rng), Te = tire([-5, -2, 0, 3, 5, 8], rng), h = tire([2.0, 3.0, 5.0, 8.0, 10.0], rng), pc = tire([0.40, 0.50, 0.60, 0.75], rng);
    const dT = Ti - Te, phi = flux(dT, el.R), E = kWh(energie(phi, h * 3600)), phiC = r2(phi * pc), Rm = resistance(dT, phiC);
    if (ecartArrondi(phi) > 0.03 || ecartArrondi(E) > 0.04 || phi < 80 || phi > 1000 || Math.abs(phiC - phi * pc) > 1e-9) continue;
    return { type: 'paroi', el, Ti, Te, h, dT, phiC, rep1: phi, rep2: E, rep3: Rm };
  }
}
/** Défi « mesure » : énergie Q (kJ) traversant une paroi en Δt (min) avec ΔT (K) connu. Q1 : φ (W) ; Q2 : Rth (K·W⁻¹) ; Q3 : φ′ (W) pour un nouvel écart ΔT′. */
export function tirageMesure(rng = Math.random) {
  for (;;) {
    const dT = tire([10, 12, 15, 18, 20, 25], rng), Qk = tire([60, 90, 120, 180, 240, 360], rng), tmin = tire([5, 10, 15, 20, 30], rng), dT2 = tire([8, 10, 16, 22, 30], rng);
    const phi = fluxDepuisEnergie(Qk * 1000, tmin * 60), R = resistance(dT, phi), phi2 = flux(dT2, R);
    if (dT2 === dT || phi < 50 || phi > 800 || ecartArrondi(phi) > 0.03 || R < 0.02 || R > 0.5) continue;
    return { type: 'mesure', dT, Qk, tmin, dT2, rep1: phi, rep2: R, rep3: phi2 };
  }
}
