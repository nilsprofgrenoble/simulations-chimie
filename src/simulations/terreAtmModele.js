// ====================================================
//  Modèle « Bilan thermique du système Terre-atmosphère » (sim 236, TG spé PC, « L'énergie : conversions et transferts »,
//  « Effectuer des bilans d'énergie sur un système »). Modèle pur (sans React), test : terreAtmModele.test.mjs.
//  Puissance solaire reçue par m² face au Soleil : S0 (W·m⁻²). La Terre (sphère) intercepte sur un disque (π R²) et émet par toute sa surface (4 π R²) :
//  puissance absorbée par m² de surface = (1 − A) × S0 / 4 (A = albédo). Loi de Stefan-Boltzmann (DONNÉE) : puissance émise par m² = σ T⁴.
//  Équilibre : σ T⁴ = (1 − A) S0 / 4. Modèle simplifié « effet de serre » (exploration seulement, hors capacités quantitatives du programme) :
//  une part g de l'infrarouge émis par la surface lui est renvoyée par l'atmosphère : σ Ts⁴ (1 − g) = (1 − A) S0 / 4.
// ====================================================
export const SIGMA = 5.67e-8;                    // W·m⁻²·K⁻⁴ (donnée)
export const PLANETES = [
  { id: 'terre', nom: 'la Terre', court: 'Terre', S0: 1361, A: 0.30, Tobs: 288 },
  { id: 'mars', nom: 'Mars', court: 'Mars', S0: 586, A: 0.25, Tobs: 210 },
  { id: 'venus', nom: 'Vénus', court: 'Vénus', S0: 2601, A: 0.77, Tobs: 737 },
];                                               // valeurs arrondies de références publiques ; Tobs = température moyenne de surface
export const planeteDe = id => PLANETES.find(p => p.id === id);

export const absorbee = (S0, A) => (1 - A) * S0 / 4;         // W·m⁻²
export const emise = T => SIGMA * T ** 4;                     // W·m⁻²
export const tempEq = P => (P / SIGMA) ** 0.25;               // K
export const teqDe = (S0, A) => tempEq(absorbee(S0, A));     // K
export const albedoPour = (S0, T) => 1 - 4 * emise(T) / S0;
export const tempSerre = (S0, A, g) => tempEq(absorbee(S0, A) / (1 - g));   // K (modèle simplifié, exploration)
export const gPour = (S0, A, T) => 1 - absorbee(S0, A) / emise(T);          // part renvoyée qui reproduit une température T
export const celsius = K => K - 273;

export function rngGraine(graine) {
  let a = (graine >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const r2 = x => Number(x.toPrecision(2));
export const ecartArrondi = x => Math.abs(r2(x) - x) / Math.abs(x);
const tire = (t, rng) => t[Math.floor(rng() * t.length)];

/** Défi « planète » : (S0, A) d'une planète sans atmosphère (modèle). Q1 : puissance absorbée par m² ; Q2 : température d'équilibre (K) ; Q3 : température d'équilibre (K) pour un autre albédo A′. */
export function tiragePlanete(rng = Math.random) {
  for (;;) {
    const reelle = rng() < 0.4, base = reelle ? tire(PLANETES, rng) : null;
    const S0 = base ? base.S0 : tire([700, 900, 1100, 1361, 1700, 2000], rng), A = base ? base.A : tire([0.10, 0.20, 0.30, 0.40, 0.50, 0.60], rng);
    const A2 = tire([0.10, 0.20, 0.30, 0.40, 0.50, 0.60], rng), nom = base ? base.nom : 'une planète fictive';
    const P = absorbee(S0, A), T = tempEq(P), T2 = teqDe(S0, A2);
    if (A2 === A || P < 60 || P > 600 || Math.abs(T2 - T) < 8 || ecartArrondi(P) > 0.03) continue;
    return { type: 'planete', nom, reelle, S0, A, A2, rep1: P, rep2: T, rep3: T2 };
  }
}
/** Défi « albédo » : S0 et température visée Tc. Q1 : σ Tc⁴ ; Q2 : S0 / 4 ; Q3 : albédo A = 1 − Q1 / Q2 (à 0,03 près). */
export function tirageAlbedo(rng = Math.random) {
  for (;;) {
    const S0 = tire([1000, 1361, 1700, 2000], rng), Tc = tire([240, 250, 255, 260, 270, 280, 290], rng);
    const em = emise(Tc), q = S0 / 4, A = 1 - em / q;
    if (A < 0.12 || A > 0.65) continue;
    return { type: 'albedo', S0, Tc, rep1: em, rep2: q, rep3: A };
  }
}
