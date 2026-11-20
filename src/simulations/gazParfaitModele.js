// ====================================================
//  Modèle « Gaz parfait : équation d'état et limites du modèle » (sim 215, TG spé PC, « L'énergie : conversions et transferts »,
//  « Décrire un système thermodynamique : exemple du modèle du gaz parfait »). Modèle pur (sans React), test : gazParfaitModele.test.mjs.
//  Modèle du gaz parfait : molécules assimilées à des points matériels, sans interaction entre elles (hors chocs élastiques), de volume propre négligé.
//  Équation d'état : P V = n R T, avec P en Pa, V en m³, n en mol, T en K (T = θ + 273,15), R = 8,314 J·K⁻¹·mol⁻¹ (constante fournie).
//  Masse volumique : ρ = m / V = n M / V = P M / (R T), M en kg·mol⁻¹.
//  « Gaz réel » (limites du modèle) : « mesures » d'un gaz réel fournies à l'élève, ici le dioxyde de carbone. Elles sont CALCULÉES par un modèle de gaz
//  plus complet que le gaz parfait (volume propre des molécules et interactions attractives, hors programme : non nommé à l'élève) avec la règle des aires
//  de Maxwell pour la liquéfaction. Ordre de grandeur réaliste pour le CO₂ (Tc ≈ 304 K, Pc ≈ 74 bar), pas des mesures expérimentales.
// ====================================================
export const R = 8.314;                    // J·K⁻¹·mol⁻¹
export const ZERO_K = 273.15;              // K : T = θ + 273,15
export const P_ATM_BAR = 1.013;            // bar : pression atmosphérique normale ≈ 1,013 × 10⁵ Pa
export const GAZ = [
  { id: 'air', nom: 'Air', M: 29.0 },
  { id: 'N2', nom: 'Diazote', M: 28.0 },
  { id: 'O2', nom: 'Dioxygène', M: 32.0 },
  { id: 'He', nom: 'Hélium', M: 4.0 },
  { id: 'CO2', nom: 'Dioxyde de carbone', M: 44.0 },
];                                          // M en g·mol⁻¹ (valeurs usuelles arrondies)
export const gazDe = id => GAZ.find(g => g.id === id);

// ---------- conversions ----------
export const kelvin = thetaC => thetaC + ZERO_K;
export const celsius = T => T - ZERO_K;
export const bar_Pa = b => b * 1e5;
export const Pa_bar = p => p / 1e5;
export const L_m3 = v => v / 1000;
export const m3_L = v => v * 1000;
export const mL_m3 = v => v * 1e-6;

// ---------- équation d'état (SI) ----------
export const pression = (n, T, V) => n * R * T / V;          // Pa
export const volume = (n, T, P) => n * R * T / P;            // m³
export const quantite = (P, V, T) => P * V / (R * T);        // mol
export const temperature = (P, V, n) => P * V / (n * R);     // K
/** Deux états d'une même quantité de gaz : P1 V1 / T1 = P2 V2 / T2. Renvoie P2 (même unité que P1, V1 et V2 dans la même unité). */
export const pressionEtat2 = (P1, V1, T1, V2, T2) => P1 * V1 * T2 / (T1 * V2);
export const volumeEtat2 = (P1, V1, T1, P2, T2) => P1 * V1 * T2 / (T1 * P2);
export const temperatureEtat2 = (P1, V1, T1, P2, V2) => T1 * P2 * V2 / (P1 * V1);
/** Masse volumique d'un gaz parfait (kg·m⁻³) : P en Pa, M en kg·mol⁻¹, T en K. */
export const masseVolumique = (P, M, T) => P * M / (R * T);
/** Vitesse quadratique moyenne √(3RT/M) (m·s⁻¹), M en kg·mol⁻¹ : ordre de grandeur, relation non exigible (exploration seulement). */
export const vitesseQuadratique = (T, M) => Math.sqrt(3 * R * T / M);

// ---------- animation qualitative ----------
/** Nombre de molécules dessinées pour n mol : modèle qualitatif, pas à l'échelle (un vrai gaz en contient ≈ 10²² par litre). */
export const nbMolecules = n => Math.max(8, Math.min(32, Math.round(8 + 12 * n)));
/** Vitesse d'agitation dessinée, relative à celle du diazote à 300 K (1 = référence) : ∝ √(T / M). */
export const vitesseRelative = (T, Mg = 28) => Math.sqrt((T / Mg) / (300 / 28));

// ---------- gaz réel : dioxyde de carbone (données fournies, modèle plus complet hors programme) ----------
export const REEL = { nom: 'dioxyde de carbone', M: 44.0, a: 0.364, b: 4.27e-5 };           // a en Pa·m⁶·mol⁻², b en m³·mol⁻¹
export const Tc = 8 * REEL.a / (27 * R * REEL.b);                                          // ≈ 304 K
export const Pc = REEL.a / (27 * REEL.b * REEL.b);                                          // ≈ 7,4 × 10⁶ Pa
export const Vc = 3 * REEL.b;                                                               // m³·mol⁻¹
const pi = (v, t) => 8 * t / (3 * v - 1) - 3 / (v * v);                                     // pression réduite
const aire = (vl, vg, t, ps) => (8 * t / 3) * Math.log((3 * vg - 1) / (3 * vl - 1)) + 3 / vg - 3 / vl - ps * (vg - vl);
function bisect(f, a, b, it = 80) { let fa = f(a); for (let k = 0; k < it; k++) { const m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; }
const cachePsat = new Map();
/** Pour t = T/Tc < 1 : { ps, vl, vg } (pression réduite de saturation, volumes réduits du liquide et du gaz), règle des aires. */
function saturation(t) {
  if (cachePsat.has(t)) return cachePsat.get(t);
  // extrema de π(v) : 4 t v³ = (3v − 1)²
  const g = v => 4 * t * v ** 3 - (3 * v - 1) ** 2;
  const vs = []; let prev = g(0.34), vp = 0.34;
  for (let v = 0.34; v < 6; v += 0.002) { const gv = g(v); if ((gv > 0) !== (prev > 0)) vs.push(bisect(g, vp, v)); prev = gv; vp = v; }
  const v1 = vs[0], v2 = vs[vs.length - 1];
  const lo = Math.max(1e-6, pi(v1, t)), hi = pi(v2, t);
  const racines = ps => {
    const vl = bisect(v => pi(v, t) - ps, 0.3334, v1), vg = bisect(v => pi(v, t) - ps, v2, 400);
    return [vl, vg];
  };
  const ps = bisect(p => { const [vl, vg] = racines(p); return aire(vl, vg, t, p); }, lo, hi, 70);
  const [vl, vg] = racines(ps), res = { ps, vl, vg };
  cachePsat.set(t, res); return res;
}
/** Pression de vapeur saturante du gaz réel (Pa) à la température T (K), T < Tc. */
export const pressionSaturation = T => saturation(T / Tc).ps * Pc;
/** Pression (Pa) du gaz réel : n mol de CO₂ à T (K) dans V (m³) ; palier de liquéfaction quand T < Tc et que le volume molaire est entre ceux du liquide et du gaz. */
export function pressionReelle(n, T, V) {
  const t = T / Tc, v = (V / n) / Vc;
  if (t < 1) { const s = saturation(t); if (v >= s.vl && v <= s.vg) return s.ps * Pc; }
  return pi(Math.max(v, 0.3334), t) * Pc;
}
/** Volumes molaires (m³·mol⁻¹) du liquide et du gaz saturés à T (K) ; null si T ≥ Tc. */
export function volumesSaturation(T) { const t = T / Tc; if (t >= 1) return null; const s = saturation(t); return { liquide: s.vl * Vc, gaz: s.vg * Vc }; }
/** Écart relatif (P_gaz parfait − P_réel) / P_réel. */
export const ecartRelatif = (n, T, V) => (pression(n, T, V) - pressionReelle(n, T, V)) / pressionReelle(n, T, V);

// ---------- tirages bornés des défis ----------
export function rngGraine(graine) {
  let a = (graine >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const tire = (t, rng) => t[Math.floor(rng() * t.length)];
/** Défi « état d'un gaz » : n, θ1 (°C), V (L, constant). Q1 : P1 (bar) ; Q2 : P2 (bar) après chauffage à V constant jusqu'à θ2 ; Q3 : T3 (K) pour atteindre la pression limite P3 (bar). */
export function tirageEtat(rng = Math.random) {
  for (;;) {
    const n = tire([0.50, 1.00, 1.50, 2.00, 2.50], rng), V = tire([10, 15, 20, 25, 30, 40], rng), th1 = tire([7, 17, 27, 37], rng), th2 = tire([67, 87, 117, 147, 197], rng), P3 = tire([3.0, 4.0, 5.0, 6.0, 8.0], rng);
    const P1 = Pa_bar(pression(n, kelvin(th1), L_m3(V))), P2 = Pa_bar(pression(n, kelvin(th2), L_m3(V))), T3 = temperature(bar_Pa(P3), L_m3(V), n);
    if (P1 < 0.8 || P2 > 15 || P1 > 9 || P3 <= P1 * 1.15 || T3 < 330 || T3 > 800 || Math.abs(T3 - kelvin(th2)) / T3 < 0.1) continue;
    return { type: 'etat', n, V, th1, th2, P3, rep1: P1, rep2: P2, rep3: T3 };
  }
}
/** Défi « bouteille » : gaz, V (L), P (bar), θ (°C). Q1 : n (mol) ; Q2 : m (g) ; Q3 : volume (L) qu'occuperait ce gaz à 1,013 bar, à même θ. */
export function tirageBouteille(rng = Math.random) {
  for (;;) {
    const g = tire(GAZ.filter(x => x.id !== 'air'), rng), V = tire([5, 10, 12, 15, 20], rng), P = tire([2.0, 3.0, 4.0, 5.0, 6.0, 8.0], rng), th = tire([12, 17, 20, 22, 27], rng);
    const n = quantite(bar_Pa(P), L_m3(V), kelvin(th)), m = n * g.M, V0 = P * V / P_ATM_BAR;
    if (n < 0.5 || n > 8 || m < 5 || m > 300) continue;
    return { type: 'bouteille', gaz: g, V, P, th, rep1: n, rep2: m, rep3: V0 };
  }
}
