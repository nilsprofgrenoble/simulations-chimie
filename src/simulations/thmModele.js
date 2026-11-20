// ====================================================
//  Modèle « Loi de Newton et thermostat : température d'un système au cours du temps » (sim 212, TG spé PC, « L'énergie : conversions et transferts »).
//  Système : un liquide (assimilé à de l'eau) dans un récipient, incompressible, de température T supposée UNIFORME, de capacité thermique C (J/K).
//  Thermostat : l'air de la pièce, de température T_ext CONSTANTE. Transfert thermique modélisé par la loi de Newton (fournie) :
//     φ = h S (T_ext − T)      (φ : flux thermique REÇU par le système, en W ; h S en W/K, supposé constant)
//  Bilan d'énergie (système incompressible, pas d'autre transfert) :  C dT/dt = φ = h S (T_ext − T).
//  Équation différentielle :  dT/dt + T/τ = T_ext/τ,  τ = C / (h S).  Solution : T(t) = T_ext + (T_0 − T_ext) exp(−t/τ).
//  Unités du modèle : C en J/K, h S en W/K, τ en MIN (affichage), t en min, T et T_ext en °C (seuls des ÉCARTS de température interviennent, donc °C ou K équivalents).
// ====================================================
export const C_EAU = 4180;                                                    // capacité thermique massique usuelle de l'eau, J/(kg·K) ; café assimilé à de l'eau
export const MASSES = [0.10, 0.20, 0.30, 0.40];                               // kg de liquide
export const ISOLATIONS = [
  { id: 'nue', nom: 'Tasse nue', hS: 0.45 },
  { id: 'couvercle', nom: 'Tasse avec couvercle', hS: 0.30 },
  { id: 'isotherme', nom: 'Mug isotherme', hS: 0.06 },
];                                                                            // hS en W/K : ordres de grandeur annoncés (valeurs fournies, non mesurées)
export const T_EXT_MENU = [5, 10, 15, 20, 25];                                // °C
export const T0_MENU = [4, 10, 20, 40, 60, 80, 90];                           // °C

/** Capacité thermique C = m c (J/K) d'un liquide de masse m (kg). */
export const capacite = (m, c = C_EAU) => m * c;
/** Temps caractéristique τ = C / (h S), en s (C en J/K, hS en W/K) puis en min. */
export const tauS = (C, hS) => C / hS;
export const tauMin = (C, hS) => C / hS / 60;
/** Flux thermique REÇU par le système (W) : positif si T < T_ext (il reçoit), négatif si T > T_ext (il cède). */
export const flux = (T, Text, hS) => hS * (Text - T);
/** Variation de température (K) pendant Δt (s), flux supposé constant : C ΔT = φ Δt. */
export const deltaT = (phi, dtS, C) => phi * dtS / C;
/** Température (°C) à l'instant t (min). */
export const temperature = (t, T0, Text, tau) => Text + (T0 - Text) * Math.exp(-t / tau);
/** dT/dt (K/min) à l'instant t (min). */
export const derivee = (t, T0, Text, tau) => -(T0 - Text) / tau * Math.exp(-t / tau);
/** Pente à l'origine (K/min) : la tangente à l'origine coupe l'asymptote T = T_ext à t = τ. */
export const penteOrigine = (T0, Text, tau) => (Text - T0) / tau;
/** Date (min) à laquelle T atteint Tc ; NaN si Tc n'est pas strictement entre T_0 et T_ext. */
export const tempsPour = (Tc, T0, Text, tau) => { const r = (Tc - Text) / (T0 - Text); return r > 0 && r < 1 ? -tau * Math.log(r) : NaN; };
/** Fraction de l'écart initial restante à t = k τ. */
export const resteEcart = k => Math.exp(-k);
/** Vérifie l'équation différentielle par différence finie : C dT/dt − hS (T_ext − T), en W (t en min, dT/dt converti en K/s). */
export function residuEquation(t, T0, Text, C, hS, h = 1e-5) {
  const tau = tauMin(C, hS), d = (temperature(t + h, T0, Text, tau) - temperature(t - h, T0, Text, tau)) / (2 * h) / 60;
  return C * d - hS * (Text - temperature(t, T0, Text, tau));
}
/** Logarithme de y = (T − T_ext) / (T_0 − T_ext) (sans dimension) : droite de pente −1/τ en fonction de t. */
export const lnEcart = (T, T0, Text) => Math.log((T - Text) / (T0 - Text));
/** Rend un nombre propre pour un affichage de température (arrondi à 0,1 °C) */
export const arr1 = x => Math.round(x * 10) / 10;

// ---------- acquisitions (suivi expérimental) ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
export const N_ECH = 41, N_DEFI = 200, SIGMA = 0.15, TOL_TAU = 0.15;                  // points (parcours, défi), bruit (K), tolérance sur τ lu
function prng(graine) { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function serie(T0, Text, tau, tmax, alea, N = N_ECH) {
  const g = () => Math.sqrt(-2 * Math.log(1 - alea())) * Math.cos(2 * Math.PI * alea());
  return Array.from({ length: N }, (_, j) => { const t = (j / (N - 1)) * tmax; return { t, T: arr1(temperature(t, T0, Text, tau) + SIGMA * g()) }; });
}
/** Acquisition FIXE du parcours : bécher de 0,10 kg d'eau (C = 418 J/K) à 20 °C placé dans un bain thermostaté à 60 °C, hS = 0,87 W/K, donc τ = 8,0 min ; bruit reproductible. */
export function acquisitionGuide() {
  const C = 418, hS = 0.87, T0 = 20, Text = 60, tau = tauMin(C, hS), tmax = 40;
  return { C, hS, T0, Text, tau, tmax, pts: serie(T0, Text, tau, tmax, prng(20261120)) };
}
/** Points de la droite d'ajustement de ln y en fonction de t (moindres carrés, points dont l'écart à T_ext dépasse 4 K) : { a, b } avec ln y = a + b t (b en min⁻¹). */
export function ajustementLn(acq, seuil = 4) {
  const q = acq.pts.filter(p => Math.abs(p.T - acq.Text) >= seuil && (p.T - acq.Text) / (acq.T0 - acq.Text) > 0).map(p => ({ t: p.t, y: lnEcart(p.T, acq.T0, acq.Text) })), n = q.length;
  const mt = q.reduce((s, p) => s + p.t, 0) / n, my = q.reduce((s, p) => s + p.y, 0) / n;
  const b = q.reduce((s, p) => s + (p.t - mt) * (p.y - my), 0) / q.reduce((s, p) => s + (p.t - mt) ** 2, 0);
  return { a: my - b * mt, b, n, tmax: Math.max(...q.map(p => p.t)) };
}
/** Défi 1 : acquisition bruitée (refroidissement ou chauffage) d'un système dont C et hS sont cachés ; T_0 et T_ext sont affichées. */
export function tirageAcquisition() {
  for (;;) {
    const C = tire([418, 836, 1254, 1672]), hS = tire([0.12, 0.20, 0.30, 0.45, 0.60, 0.87]), tau = tauMin(C, hS);
    if (tau < 6 || tau > 150) continue;
    const chauffage = Math.random() < 0.4, Text = chauffage ? tire([20, 25, 60]) : tire([15, 20, 25]), T0 = chauffage ? tire([4, 5]) : tire([60, 80, 90]);
    const tmax = (3 + Math.random() * 6) * tau;                      // durée de suivi aléatoire (3 à 9 τ) : elle ne renseigne pas sur τ
    return { C, hS, T0, Text, tau, tmax, type: chauffage ? 'chauffage' : 'refroidissement', pts: serie(T0, Text, tau, tmax, Math.random, N_DEFI) };
  }
}
/** Proxy « élève qui cherche la date où T a parcouru 63 % de l'écart » : premier point qui franchit T_ext + 0,368 (T_0 − T_ext). */
export function lecturePremierPassage(d) {
  const niv = d.Text + Math.exp(-1) * (d.T0 - d.Text), p = d.pts.find(x => (d.T0 > d.Text ? x.T <= niv : x.T >= niv));
  return p ? p.t : NaN;
}
/** Défi 2 : prévoir. Données affichées : C (J/K), hS (W/K), T_0, T_ext, t (min), T_cible (°C), toutes arrondies AVANT de calculer les réponses. */
export function tirageCalcul() {
  for (;;) {
    const C = tire([418, 836, 1254, 1672]), hS = tire([0.12, 0.20, 0.30, 0.45, 0.60]), tau = tauMin(C, hS);
    if (tau < 10 || tau > 150) continue;
    const chauffage = Math.random() < 0.35, Text = chauffage ? tire([20, 22, 25]) : tire([15, 18, 20, 22]), T0 = chauffage ? tire([4, 5, 8]) : tire([60, 70, 80, 90]);
    const t = Math.max(5, Math.round(tire([0.5, 0.75, 1, 1.25, 1.5]) * tau / 5) * 5);
    const f = tire([0.5, 0.4, 0.3, 0.25]), Tc = Math.round(Text + f * (T0 - Text));
    if (Math.abs(Tc - Text) < 4 || Math.abs(Tc - T0) < 4) continue;
    return { C, hS, T0, Text, t, Tc, tau, chauffage, qTau: tau, qT: temperature(t, T0, Text, tau), qT_t: tempsPour(Tc, T0, Text, tau) };
  }
}
