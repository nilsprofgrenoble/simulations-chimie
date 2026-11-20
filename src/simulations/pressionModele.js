// ====================================================
//  Modèle de la simulation « Fluide au repos : pression, force pressante et loi de Mariotte » (1G spé PC, sim 162).
//  Modèle pur (sans React), testé par pressionModele.test.mjs.
//  Hypothèses (affichées à l'élève) :
//   • le gaz est enfermé : sa quantité de matière ne change pas (pas de fuite) ;
//   • loi de Mariotte : P·V = constante à température constante, pour une quantité de gaz constante (comportement d'un gaz modèle,
//     valable à pression modérée : quelques bar au plus) ;
//   • F = P·S : surface plane, pression uniforme, force pressante perpendiculaire à la surface, dirigée vers la paroi ;
//   • le volume du tuyau et du capteur est nul, sauf si on le règle (exploration) ; les frottements du piston sont négligés ;
//   • la dépendance en température (exploration seulement) suit un modèle de gaz : P augmente avec la température absolue ; elle sort des
//     capacités exigibles (la température reste qualitative dans le parcours guidé).
//  Unités : pression en hPa (1 hPa = 100 Pa ; 1 bar = 10⁵ Pa = 1000 hPa), volumes en mL (1 mL = 1 cm³), surfaces en cm² (1 cm² = 10⁻⁴ m²).
// ====================================================

export const P_ATM = 1013;                                    // hPa : pression atmosphérique usuelle (≈ 1,013 × 10⁵ Pa)
export const REF = { V: 60, thetaC: 20, P: P_ATM };           // état initial de la seringue : 60 mL d'air à 20 °C et 1013 hPa
export const V_MAX = 60;                                      // mL : capacité de la seringue
export const V_MIN = 10;

// ---------- conversions ----------
export const hPa_Pa = h => h * 100;
export const Pa_hPa = p => p / 100;
export const bar_Pa = b => b * 1e5;
export const Pa_bar = p => p / 1e5;
export const bar_hPa = b => b * 1000;
export const hPa_bar = h => h / 1000;
export const cm2_m2 = s => s * 1e-4;
export const m2_cm2 = s => s * 1e4;
export const mm2_m2 = s => s * 1e-6;
export const mL_L = v => v / 1000;
export const kelvin = thetaC => thetaC + 273.15;

// ---------- force pressante : F = P·S (P en Pa, S en m², F en N) ----------
export const forcePressante = (P_Pa, S_m2) => P_Pa * S_m2;
export const pressionDepuisForce = (F_N, S_m2) => F_N / S_m2;
export const surfaceDepuisForce = (F_N, P_Pa) => F_N / P_Pa;

// ---------- loi de Mariotte : P1·V1 = P2·V2 (T et quantité de gaz constantes) ----------
export const pressionFinale = (P1, V1, V2) => P1 * V1 / V2;
export const volumeFinal = (P1, V1, P2) => P1 * V1 / P2;
export const produitPV = (P, V) => P * V;

// ---------- seringue fermée : pression « vraie » du gaz ----------
// Vt : volume du tuyau et du capteur (mL), n : quantité de gaz relative à l'état initial (1 = inchangée), thetaC : température (°C).
// À 60 mL, 20 °C, n = 1 : 1013 hPa quel que soit Vt (c'est l'état de départ). P·(V + Vt) est constant si T et n le sont.
export function pression({ V, thetaC = REF.thetaC, n = 1, Vt = 0 }) {
  return REF.P * n * (kelvin(thetaC) / kelvin(REF.thetaC)) * (REF.V + Vt) / (V + Vt);
}
// Mesure affichée par le capteur : valeur arrondie à 1 hPa, avec un écart aléatoire reproductible (± 0,5 % au plus) lié à la lecture du volume et au capteur.
export const ecartMesure = V => 0.005 * Math.sin(V * 7.31 + 1.7) * Math.cos(V * 1.93);
export const pressionMesuree = (etat) => Math.round(pression(etat) * (1 + ecartMesure(etat.V)));

// Niveau du cadran (0 à 1) pour la jauge sans graduation numérique
export const niveauCadran = (P, Pmax) => Math.max(0.03, Math.min(1, P / Pmax));

// Rythme des chocs (sans unité, relatif) pour l'animation : proportionnel à N·v / L (L : longueur du gaz) ; v ∝ √T absolue
export const vitesseRelative = thetaC => Math.sqrt(kelvin(thetaC) / kelvin(REF.thetaC));

// ---------- forces sur le piston de la seringue (exploration) ----------
// S en cm², P en hPa → N. Force du gaz sur sa face intérieure, de l'air extérieur sur sa face extérieure, force à exercer à la main (positive : on pousse).
export function forcesPiston(P_hPa, S_cm2) {
  const S = cm2_m2(S_cm2), Fgaz = forcePressante(hPa_Pa(P_hPa), S), Fair = forcePressante(hPa_Pa(P_ATM), S);
  return { Fgaz, Fair, Fmain: Fgaz - Fair };
}

// ---------- tirages bornés (parcours : jamais d'aléa ; défis : graine) ----------
export function rngGraine(graine) {
  let a = (graine >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const tire = (t, rng) => t[Math.floor(rng() * t.length)];
const troisCS = x => isFinite(x) && x > 0 && Math.abs(Number(x.toPrecision(3)) - x) <= 1e-9 * Math.abs(x);

// Défi 1 : force pressante. Pression donnée en bar ou en hPa, surface en cm² ; réponse en N (3 chiffres significatifs exacts).
export const PRESSIONS_BAR = [1.2, 1.5, 1.8, 2.0, 2.2, 2.5, 3.0, 4.0];
export const PRESSIONS_HPA = [1200, 1500, 1800, 2000, 2400, 2500, 3000, 3500];
export const SURFACES_CM2 = [2.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0];
export function tirerDefiForce(rng = Math.random) {
  for (let i = 0; i < 1000; i++) {
    const enBar = rng() < 0.5, P = tire(enBar ? PRESSIONS_BAR : PRESSIONS_HPA, rng), S = tire(SURFACES_CM2, rng);
    const P_Pa = enBar ? bar_Pa(P) : hPa_Pa(P), F = forcePressante(P_Pa, cm2_m2(S));
    const variante = rng() < 0.65 ? 'force' : 'pression';
    if (variante === 'force' && troisCS(F) && F >= 10 && F <= 5000) return { type: 'force', variante, P, uP: enBar ? 'bar' : 'hPa', S, F, vrai: F, unite: 'N' };
    // variante inverse : on donne F et S, on cherche P en hPa
    const Ph = Pa_hPa(pressionDepuisForce(F, cm2_m2(S)));
    if (variante === 'pression' && troisCS(F) && F >= 10 && F <= 5000 && troisCS(Ph)) return { type: 'force', variante, F, S, vrai: Ph, unite: 'hPa' };
  }
  throw new Error('tirage impossible');
}
// Défi 2 : loi de Mariotte. Un gaz enfermé est comprimé ou détendu à température constante ; on cherche P2 ou V2.
export const VOLUMES_ML = [20, 25, 30, 40, 50, 60, 75, 80, 100];
export const PRESSIONS_DEFI = [1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0];   // bar
export function tirerDefiMariotte(rng = Math.random) {
  for (let i = 0; i < 2000; i++) {
    const P1 = tire(PRESSIONS_DEFI, rng), V1 = tire(VOLUMES_ML, rng), V2 = tire(VOLUMES_ML, rng);
    if (V1 === V2) continue;
    const P2 = pressionFinale(P1, V1, V2);
    if (!troisCS(P2) || P2 > 5 || P2 < 0.2) continue;
    const variante = rng() < 0.6 ? 'P2' : 'V2';
    if (variante === 'P2') return { type: 'mariotte', variante, P1, V1, V2, P2, vrai: P2, unite: 'bar' };
    return { type: 'mariotte', variante, P1, V1, P2, V2, vrai: V2, unite: 'mL' };
  }
  throw new Error('tirage impossible');
}
// arrondi à cs chiffres significatifs
export const arrondiCS = (x, cs) => Number(Number(x).toPrecision(cs));
