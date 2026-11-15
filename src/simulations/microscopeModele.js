// ====================================================
//  Modèle du microscope optique (TSTL, Ondes : « Des ondes pour observer »).
//  Objectif = lentille mince convergente L1 (f1′), oculaire = lentille mince convergente L2 (f2′, utilisée comme une loupe).
//  L'objectif donne de l'objet A0B0 une image intermédiaire A1B1 réelle, renversée, agrandie ; c'est un objet pour l'oculaire.
//  Intervalle optique Δ = F1′F2 (distance entre le foyer image de l'objectif et le foyer objet de l'oculaire) : fixé à 160 mm.
//  Le microscope est « mis au point » quand l'image définitive A2B2 est à l'infini, c'est-à-dire quand A1B1 est dans le plan focal objet de l'oculaire (A1 = F2).
//  Grandeurs algébriques, axe orienté dans le sens de la lumière : 1/OA′ − 1/OA = 1/f′, γ = OA′/OA.
//  Mise au point faite : γ1 = −Δ/f1′ ; grossissement commercial G = θ2/θ0 = |γ1| × (dm / f2′) = Δ·dm/(f1′·f2′), dm = 250 mm.
//  Hypothèses : lentilles minces, approximation de Gauss, lumière monochromatique, objet plan perpendiculaire à l'axe ; la diffraction
//  (qui limite la résolution) n'est pas modélisée ici. Le faisceau sortant est jugé quasi parallèle si sa vergence est inférieure à 1 δ.
// ====================================================
export const DELTA = 160;            // intervalle optique (mm)
export const DM = 250;               // distance minimale de vision distincte (mm)
export const EPS = 3e-4;             // pouvoir séparateur de l'œil (rad), ordre de grandeur
export const OBJECTIFS = [20, 10, 8];       // distances focales possibles de l'objectif (mm)
export const OCULAIRES = [50, 25, 20];      // distances focales possibles de l'oculaire (mm)
export const AB_MIN = 5, AB_MAX = 100;      // taille de l'objet (µm)
export const VERGENCE_MAX = 1;       // vergence (δ) maximale du faisceau sortant pour parler d'image « à l'infini »

// Distance objet–objectif (mm, > 0) pour que A1 soit dans le plan focal objet de l'oculaire : O1A1 = f1′ + Δ
export const pMiseAuPoint = f1 => f1 * (f1 + DELTA) / DELTA;
// Position O1A1 (mm) de l'image intermédiaire pour un objet à la distance p devant l'objectif (p > f1′)
export const posA1 = (p, f1) => p * f1 / (p - f1);
// Grandissement algébrique de l'objectif (négatif : image renversée)
export const gamma1 = (p, f1) => -posA1(p, f1) / p;
export const gamma1MAP = f1 => -DELTA / f1;
// Écart s (mm) de A1 par rapport au foyer objet F2 de l'oculaire : s > 0 si A1 est entre F2 et L2 ; s = 0 : mise au point
export const ecartF2 = (p, f1) => posA1(p, f1) - (f1 + DELTA);
// Vergence (δ) du faisceau qui sort de l'oculaire : V = s / f2′² (s, f2′ en mm → ×1000)
export const vergenceSortie = (s, f2) => (s / (f2 * f2)) * 1000;
export const miseAuPoint = (p, f1, f2) => Math.abs(vergenceSortie(ecartF2(p, f1), f2)) <= VERGENCE_MAX;
// Position O2A2 (mm) de l'image définitive : −Infinity… +Infinity ; Infinity si s = 0
export function posA2(p, f1, f2) {
  const s = ecartF2(p, f1);
  if (Math.abs(s) < 1e-12) return Infinity;
  return f2 * (s - f2) / s;           // 1/O2A2 = 1/f2′ + 1/O2A1 avec O2A1 = s − f2′
}
export const natureA2 = (p, f1, f2) => { const s = ecartF2(p, f1); return Math.abs(s) < 1e-9 ? 'infini' : s > 0 ? 'virtuelle' : 'reelle'; };
// Tailles et angles (mm, rad)
export const tailleA1B1 = (AB, p, f1) => Math.abs(gamma1(p, f1)) * AB;           // AB en mm
export const theta2 = (A1B1, f2) => A1B1 / f2;                                   // image définitive à l'infini : θ2 ≈ A1B1 / f2′
export const theta0 = AB => AB / DM;                                             // œil nu à dm
export const grossissementObjectif = f1 => DELTA / f1;                           // |γ1| quand la mise au point est faite
export const grossissementOculaire = f2 => DM / f2;
export const grossissement = (f1, f2) => (DELTA / f1) * (DM / f2);                // G = |γ1| × Goc = Δ·dm / (f1′·f2′)
export const longueurTube = (f1, f2) => f1 + DELTA + f2;                         // distance O1O2 quand A1 = F2
export const visibleOeilNu = AB => theta0(AB) >= EPS;                            // AB en mm
export const visibleMicroscope = (AB, f1, f2) => theta2(tailleA1B1(AB, pMiseAuPoint(f1), f1), f2) >= EPS;
