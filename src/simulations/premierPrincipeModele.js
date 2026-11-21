// ====================================================
//  Modèle « Premier principe de la thermodynamique » (sim 216, TG spé PC, « L'énergie : conversions et transferts »,
//  « Effectuer des bilans d'énergie sur un système : le premier principe »). Modèle pur (sans React), test : premierPrincipeModele.test.mjs.
//  Système au repos, macroscopiquement immobile : ΔU = W + Q (W et Q comptés positivement quand le système les REÇOIT).
//  Système incompressible (solide ou liquide, sans changement d'état) : ΔU = C × ΔT, avec C = m × c (c : capacité thermique massique, donnée).
// ====================================================
export const MATERIAUX = [
  { id: 'eau', nom: 'Eau', c: 4180 },
  { id: 'huile', nom: 'Huile alimentaire', c: 2000 },
  { id: 'alu', nom: 'Aluminium', c: 900 },
  { id: 'cuivre', nom: 'Cuivre', c: 385 },
];                                         // c en J·kg⁻¹·K⁻¹ (valeurs usuelles arrondies)
export const matDe = id => MATERIAUX.find(x => x.id === id);

export const capacite = (m, c) => m * c;                        // J·K⁻¹
export const variationU = (W, Q) => W + Q;                      // J
export const variationT = (dU, C) => dU / C;                    // K (= °C)
export const temperatureFinale = (Ti, dU, C) => Ti + dU / C;    // °C
export const energieNecessaire = (C, Ti, Tf) => C * (Tf - Ti);  // J : ΔU = C ΔT
export const chaleurPuissance = (P, t) => P * t;                // J (P en W, t en s)
/** Domaine de validité : pas de changement d'état. Eau liquide entre 0 et 100 °C ; huile, solides : on borne à 5 … 95 °C (domaine du modèle affiché). */
export const dansDomaine = Tf => Tf >= 5 && Tf <= 95;

// ---------- tirages bornés des défis ----------
export function rngGraine(graine) {
  let a = (graine >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const r2 = x => Number(x.toPrecision(2));
/** Écart relatif dû à l'arrondi de C à 2 chiffres significatifs (l'élève qui arrondit C avant de continuer ne doit pas sortir de la tolérance). */
export const ecartArrondiC = C => Math.abs(r2(C) - C) / C;
const tire = (t, rng) => t[Math.floor(rng() * t.length)];
/** Défi « chauffer un liquide » : matériau, masse m (kg), θi (°C), puissance P (W), durée t (min), Tf. Q1 : C (J·K⁻¹) ; Q2 : Q = P t (kJ) ; Q3 : θf (°C). Pertes négligées. */
export function tirageChauffer(rng = Math.random) {
  for (;;) {
    const mat = tire(MATERIAUX.filter(x => x.id === 'eau' || x.id === 'huile'), rng), m = tire([0.20, 0.25, 0.40, 0.50, 0.80, 1.00], rng), Ti = tire([10, 12, 15, 18, 20, 22], rng), P = tire([200, 300, 500, 800, 1000], rng), tmin = tire([1.0, 2.0, 3.0, 4.0, 5.0], rng);
    const C = capacite(m, mat.c), Q = chaleurPuissance(P, tmin * 60), Tf = temperatureFinale(Ti, Q, C);
    if (Tf < Ti + 8 || Tf > 90 || ecartArrondiC(C) > 0.03) continue;
    return { type: 'chauffer', mat, m, Ti, P, tmin, rep1: C, rep2: Q / 1000, rep3: Tf };
  }
}
/** Défi « bilan d'énergie » : bloc (aluminium ou cuivre) de masse m (kg), θi, Q (J, reçu, signe quelconque) et W (J, reçu). Q1 : ΔU (J) ; Q2 : ΔT (K) ; Q3 : énergie Q′ (kJ) à recevoir par transfert thermique, sans travail, pour passer de θi à θc. */
export function tirageBilan(rng = Math.random) {
  for (;;) {
    const mat = tire(MATERIAUX.filter(x => x.id === 'alu' || x.id === 'cuivre'), rng), m = tire([0.50, 1.00, 1.50, 2.00], rng), Ti = tire([15, 20, 25, 30], rng);
    const Q = tire([-4000, -2000, 3000, 5000, 8000, 12000], rng), W = tire([500, 1000, 1500, 2000, 3000], rng), Tc = tire([40, 50, 60, 70, 80], rng);
    const C = capacite(m, mat.c), dU = variationU(W, Q), dT = variationT(dU, C), Qp = energieNecessaire(C, Ti, Tc);
    if (ecartArrondiC(C) > 0.03 || Math.abs(dU) < 1500 || Math.abs(dT) < 2 || Math.abs(dT) > 40 || Ti + dT < 5 || Ti + dT > 90 || Tc <= Ti + 10) continue;
    return { type: 'bilan', mat, m, Ti, Q, W, Tc, C, rep1: dU, rep2: dT, rep3: Qp / 1000 };
  }
}
