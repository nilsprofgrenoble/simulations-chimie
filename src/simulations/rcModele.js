// ====================================================
//  Modèle du circuit RC série (sim 174, TG spé PC, « Étudier la dynamique d'un système électrique »).
//  Source idéale de tension E, résistor R, condensateur C idéal, fils de résistance nulle.
//  Unités du modèle : R en kΩ, C en µF, E en V, t et τ en ms, i en mA, q en µC (kΩ × µF = ms ; V / kΩ = mA ; µF × V = µC).
//  Convention récepteur pour R et C : i est orienté vers l'armature A (celle de la charge q), u_C = V_A − V_B, u_R = R i.
//  Charge (condensateur déchargé à t = 0) : RC du_C/dt + u_C = E  →  u_C = E (1 − e^(−t/τ)),  i = (E/R) e^(−t/τ).
//  Décharge (u_C(0) = E, source retirée)   : RC du_C/dt + u_C = 0  →  u_C = E e^(−t/τ),        i = −(E/R) e^(−t/τ) (< 0).
// ====================================================
export const R_MENU = [1, 2.2, 4.7, 10, 22, 47, 100];                       // kΩ
export const C_MENU = [0.1, 0.22, 0.47, 1, 2.2, 4.7, 10, 22, 47, 100];      // µF
export const E_MENU = [3, 5, 6, 9, 12];                                      // V

/** Temps caractéristique τ = R C, en ms quand R est en kΩ et C en µF. */
export const tau = (R, C) => R * C;
/** Tension aux bornes du condensateur (V) à l'instant t (ms) : 'charge' (u(0) = 0) ou 'decharge' (u(0) = E). */
export const uC = (type, t, E, tauMs) => (type === 'charge' ? E * (1 - Math.exp(-t / tauMs)) : E * Math.exp(-t / tauMs));
/** Intensité (mA) en convention récepteur : positive en charge, négative en décharge. */
export const intensite = (type, t, E, R, tauMs) => (type === 'charge' ? 1 : -1) * (E / R) * Math.exp(-t / tauMs);
/** Charge de l'armature A (µC) : q = C u. */
export const charge = (C, u) => C * u;
/** Pente à l'origine de u_C (V par ms) : E / τ en charge, −E / τ en décharge ; la tangente coupe l'asymptote à t = τ. */
export const penteOrigine = (type, E, tauMs) => (type === 'charge' ? E : -E) / tauMs;
/** Fraction de E atteinte à t = k τ. */
export const fraction = (type, k) => (type === 'charge' ? 1 - Math.exp(-k) : Math.exp(-k));
/** Vérifie l'équation différentielle par différence finie : RC du/dt + u − E (charge) ou RC du/dt + u (décharge). */
export function residuEquation(type, t, E, R, C, h = 1e-6) {
  const T = tau(R, C), d = (uC(type, t + h, E, T) - uC(type, t - h, E, T)) / (2 * h);
  return T * d + uC(type, t, E, T) - (type === 'charge' ? E : 0);
}

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
export const N_ECH = 200, SIGMA = 0.008, TOL_TAU = 0.15;      // échantillons de l'acquisition, bruit (fraction de E), tolérance sur τ

/** Défi 1 : acquisition bruitée (charge ou décharge) d'un RC dont R et C sont cachés ; E est affichée. */
export function tirageAcquisition() {
  for (;;) {
    const R = tire(R_MENU), C = tire(C_MENU), T = tau(R, C);
    if (T < 0.5 || T > 600) continue;                              // τ de 0,5 ms à 600 ms : plages d'un oscilloscope ou d'une carte d'acquisition
    const E = tire([3, 5, 6, 9, 12]), type = tire(['charge', 'decharge']);
    const k = 4.5 + Math.random() * 3.5, tmax = k * T;              // durée affichée : 4,5 à 8 fois τ (ne permet pas de deviner τ à 15 % près)
    const pts = Array.from({ length: N_ECH }, (_, j) => { const t = (j / (N_ECH - 1)) * tmax; return { t, u: uC(type, t, E, T) + SIGMA * E * gauss() }; });
    return { R, C, tau: T, E, type, tmax, pts };
  }
}
/** Proxy « élève qui cherche le passage à 63 % (charge) ou 37 % (décharge) » : premier échantillon qui franchit le niveau. */
export function lecturePremierPassage(d) {
  const niv = (d.type === 'charge' ? 1 - Math.exp(-1) : Math.exp(-1)) * d.E;
  const p = d.pts.find(x => (d.type === 'charge' ? x.u >= niv : x.u <= niv));
  return p ? p.t : NaN;
}
/** Défi 2 : retrouver C (ou R) à partir de τ mesuré et de l'autre grandeur ; τ affiché arrondi à 2 chiffres significatifs, AVANT de calculer la réponse. */
export function tirageRC() {
  for (;;) {
    const R = tire(R_MENU), C = tire(C_MENU), T = Number((R * C).toPrecision(2));
    if (T < 0.5 || T > 900) continue;
    const cherche = tire(['C', 'R']);
    const vrai = cherche === 'C' ? T / R : T / C;                    // µF ou kΩ
    const E = tire(E_MENU);
    const Cq = cherche === 'C' ? Number(vrai.toPrecision(2)) : C;     // C arrondie à 2 chiffres significatifs AVANT de calculer la charge
    return { R, C, tauAff: T, cherche, vrai, unite: cherche === 'C' ? 'µF' : 'kΩ', E, Cq, qVrai: Cq * E };
  }
}

/** Acquisition FIXE (parcours guidé) : charge de R = 4,7 kΩ, C = 1,0 µF (τ = 4,7 ms) sous E = 5,0 V, bruit reproductible (graine fixe). */
export function acquisitionGuide() {
  let s = 20261119;
  const alea = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const g = () => Math.sqrt(-2 * Math.log(1 - alea())) * Math.cos(2 * Math.PI * alea());
  const R = 4.7, C = 1.0, T = tau(R, C), E = 5.0, tmax = 30;
  const pts = Array.from({ length: N_ECH }, (_, j) => { const t = (j / (N_ECH - 1)) * tmax; return { t, u: uC('charge', t, E, T) + SIGMA * E * g() }; });
  return { R, C, tau: T, E, type: 'charge', tmax, pts };
}
