// ====================================================
//  Modèle « Écoulement d'un fluide : débit, relation de Bernoulli, effet Venturi » (sim 214, TG spé PC,
//  « Mouvement et interactions », 3. Modéliser l'écoulement d'un fluide).
//  Hypothèses : fluide INCOMPRESSIBLE (eau, ρ = 1000 kg·m⁻³), écoulement PERMANENT, NON VISQUEUX (pas de pertes de charge : c'est une
//  hypothèse, pas une loi générale), sans échange d'énergie (ni pompe ni turbine), le long d'une ligne de courant ; vitesse uniforme
//  sur chaque section (vitesse moyenne) ; g = 9,81 N·kg⁻¹ ; pression atmosphérique P_atm = 1,01 × 10⁵ Pa (valeur usuelle).
//  Débit volumique : Q = S × v (m³·s⁻¹) ; conservation : S₁ v₁ = S₂ v₂.
//  Relation de Bernoulli (FOURNIE) : P + ½ ρ v² + ρ g z = constante le long d'une ligne de courant (z : altitude, axe vertical vers le haut).
//  Tube de Venturi : entrée A (section S_A, altitude 0), col B (section S_B, altitude z_B = dz), sortie C (section S_A, altitude 0).
//  Les pressions « relatives » P − P_atm (en Pa) sont celles que lisent des tubes manométriques ouverts à l'air libre : h = (P − P_atm) / (ρ g).
//  Unités : SI partout dans le modèle (m, m·s⁻¹, m³·s⁻¹, Pa) ; les menus de la simulation utilisent mm, L·min⁻¹, kPa et sont convertis ici.
// ====================================================
export const RHO = 1000;            // kg·m⁻³ (eau)
export const G = 9.81;              // N·kg⁻¹
export const PATM = 101000;         // Pa (1,01 × 10⁵ Pa, valeur usuelle)
export const V_MAX = 6;             // m·s⁻¹ : au-delà, le domaine de la simulation (conduite d'eau ordinaire) est quitté
export const P_REL_MIN = 1000;      // Pa : pression relative minimale au col (colonne manométrique visible, pression absolue bien positive)

/** Section (m²) d'un tuyau de diamètre intérieur d (mm). */
export const aire = dMm => Math.PI * (dMm / 1000) ** 2 / 4;
/** Débit volumique (m³·s⁻¹) à partir de la vitesse moyenne v (m·s⁻¹) et du diamètre d (mm) : Q = S × v. */
export const debit = (v, dMm) => aire(dMm) * v;
/** Vitesse moyenne (m·s⁻¹) pour un débit Q (m³·s⁻¹) dans un tuyau de diamètre d (mm). */
export const vitesse = (q, dMm) => q / aire(dMm);
export const lmin = q => q * 1000 * 60;               // m³·s⁻¹ → L·min⁻¹
export const siDeLmin = x => x / 1000 / 60;           // L·min⁻¹ → m³·s⁻¹
/** Termes de la relation de Bernoulli (Pa). */
export const pCin = v => 0.5 * RHO * v * v;
export const pPes = z => RHO * G * z;
/** Hauteur (m) de la colonne d'un tube manométrique ouvert, au-dessus de l'axe du tuyau, pour une pression relative Pr (Pa). */
export const hColonne = Pr => Pr / (RHO * G);
/** Différence de pression P_1 − P_2 (Pa) entre deux points d'une même ligne de courant : ½ρ(v₂² − v₁²) + ρ g (z₂ − z₁). */
export const deltaP = (v1, v2, z1 = 0, z2 = 0) => pCin(v2) - pCin(v1) + pPes(z2 - z1);

/**
 * Tube de Venturi : p = { dA, dB (mm), vA (m·s⁻¹ à l'entrée), dz (m, altitude du col), PrA (Pa, pression relative à l'entrée) }.
 * Renvoie les trois points A, B, C avec section, vitesse, altitude, pression relative et absolue, hauteur de colonne, termes de Bernoulli.
 */
export function pointsVenturi(p) {
  const q = debit(p.vA, p.dA);
  const def = [['A', p.dA, 0], ['B', p.dB, p.dz || 0], ['C', p.dA, 0]];
  const pts = def.map(([nom, d, z]) => {
    const v = vitesse(q, d), Pr = p.PrA + pPes(0 - z) + pCin(p.vA) - pCin(v);
    return { nom, d, S: aire(d), v, z, Pr, P: PATM + Pr, h: hColonne(Pr), cin: pCin(v), pes: pPes(z), somme: Pr + pCin(v) + pPes(z) };
  });
  return { q, pts, constante: p.PrA + pCin(p.vA) };   // constante de Bernoulli (en pression relative) : P_r + ½ρv² + ρgz
}
/** Le réglage est-il dans le domaine du modèle ? (pressions relatives ≥ P_REL_MIN aux trois points, vitesses ≤ V_MAX) */
export function valide(p) {
  const { pts } = pointsVenturi(p);
  return pts.every(x => x.Pr >= P_REL_MIN && x.v <= V_MAX);
}
export const MENUS = {
  dA: [20, 25, 32, 40],                     // mm
  dB: [10, 12, 16, 20, 25, 32, 40],         // mm
  vA: [0.5, 1.0, 1.5, 2.0],                 // m·s⁻¹
  dz: [0, 0.10, 0.20, 0.30],                // m
  PrA: [4000, 6000, 10000, 15000],          // Pa (4, 6, 10, 15 kPa : colonnes de 0,41 m à 1,53 m)
};
export const REGLAGE_DEPART = { dA: 20, dB: 12, vA: 1.0, dz: 0, PrA: 6000 };

// ---------- réservoir qui se vide (formule de Torricelli) ----------
/** v_B = √(2 g h) : Bernoulli entre la surface libre A (P_atm, vitesse négligée) et l'orifice B (P_atm), h = z_A − z_B. */
export const torricelli = h => Math.sqrt(2 * G * h);
/** Vitesse de descente de la surface libre : v_A = v_B (d_orifice / D_réservoir)² (conservation du débit). */
export const vSurface = (h, dOr, D) => torricelli(h) * (dOr / D) ** 2;
export const HAUTEURS_RESERVOIR = [0.5, 1.0, 1.5, 2.0];     // m
export const ORIFICES = [5, 10, 20];                       // mm
export const D_RESERVOIR = 400;                            // mm (réservoir cylindrique, diamètre intérieur)

// ---------- Venturi utilisé comme débitmètre ----------
/** Vitesse à l'entrée à partir de l'écart Δp = P_A − P_B (Pa) : Δp = ½ρ v_A² [(d_A/d_B)⁴ − 1]. */
export const vADepuisDeltaP = (dp, dA, dB) => Math.sqrt(2 * dp / (RHO * ((dA / dB) ** 4 - 1)));

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
/** Défi « prévoir » : Q (L·min⁻¹, au dixième), d_A, d_B (mm), dénivelé dz (m), P_A relative (kPa entier). Réponses : v_B, ΔP = P_A − P_B, P_B relative (kPa). */
export function tiragePrevoir() {
  for (let k = 0; k < 500; k++) {
    const dA = tire([20, 25, 32]), dB = tire([10, 12, 16]);
    if (dB >= dA * 0.8) continue;
    const q = Number(tire([8, 10, 12, 15, 18, 20, 25]).toFixed(1)), Qsi = siDeLmin(q), dz = tire([0, 0, 0.10, 0.20, 0.30]), PrA = tire([8, 10, 12, 15, 20]);
    const vA = vitesse(Qsi, dA), vB = vitesse(Qsi, dB);
    if (vA < 0.4 || vB > 6) continue;
    const dp = deltaP(vA, vB, 0, dz) , PrB = PrA * 1000 - dp;
    if (PrB < 0.4 * PrA * 1000 || PrB < 2500 || dp < 1500) continue;
    return { dA, dB, q, dz, PrA, vA, vB, qVB: vB, qDP: dp / 1000, qPB: PrB / 1000 };
  }
  return { dA: 25, dB: 12, q: 15, dz: 0, PrA: 12, vA: vitesse(siDeLmin(15), 25), vB: vitesse(siDeLmin(15), 12), qVB: vitesse(siDeLmin(15), 12), qDP: deltaP(vitesse(siDeLmin(15), 25), vitesse(siDeLmin(15), 12)) / 1000, qPB: 12 - deltaP(vitesse(siDeLmin(15), 25), vitesse(siDeLmin(15), 12)) / 1000 };
}
/** Défi « colonnes » : colonnes lues en A et B (cm entiers → m), diamètres. Réponses : Δp (kPa), v_A (m·s⁻¹), Q (L·min⁻¹), calculées à partir des hauteurs AFFICHÉES. */
export function tirageColonnes() {
  for (let k = 0; k < 500; k++) {
    const [dA, dB] = tire([[40, 25], [40, 20], [40, 16], [32, 20], [32, 16], [25, 16], [25, 10]]);
    const vA = tire([0.3, 0.4, 0.5, 0.6, 0.8]), r4 = (dA / dB) ** 4;
    const dh = vA * vA * (r4 - 1) / (2 * G);
    if (dh < 0.12 || dh > 0.5) continue;
    const hB = tire([0.10, 0.15, 0.20, 0.25, 0.30, 0.40]), hAcm = Math.round((hB + dh) * 100), hBcm = Math.round(hB * 100), dhm = (hAcm - hBcm) / 100;
    const dp = RHO * G * dhm, vAr = vADepuisDeltaP(dp, dA, dB), q = lmin(debit(vAr, dA));
    return { dA, dB, hA: hAcm / 100, hB: hBcm / 100, dh: dhm, qDP: dp / 1000, qVA: vAr, qQ: q };
  }
  return { dA: 32, dB: 16, hA: 0.40, hB: 0.15, dh: 0.25, qDP: RHO * G * 0.25 / 1000, qVA: vADepuisDeltaP(RHO * G * 0.25, 32, 16), qQ: lmin(debit(vADepuisDeltaP(RHO * G * 0.25, 32, 16), 32)) };
}
