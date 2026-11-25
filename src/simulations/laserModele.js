// Modèle de la simulation 230 « Laser : éclairement, énergie reçue et sécurité » (TSTL, PCM, Énergie et ondes).
// Faisceau laser de section circulaire (diamètre D, en mm), de flux φ (en W). Éclairement E = φ ÷ S avec S = π D² ÷ 4 (en m²).
// Énergie reçue Q = φ × Δt. Divergence θ (en mrad) : D(L) = D0 + θ × L (θ en mrad et L en m donnent des mm).
// Norme INVENTÉE pour la simulation (valeurs voisines de celles utilisées en optique pour un laser visible, mais non reprises d'un document) :
//   pour l'œil, faisceau visible : exposition énergétique maximale H_MAX = 2,5 J/m² pour une durée ≤ 0,25 s (réflexe palpébral),
//   éclairement maximal E_MAX = 10 W/m² pour une durée > 0,25 s. Remarque : E_MAX × 0,25 s = H_MAX.
// Hypothèses : faisceau uniforme (éclairement constant sur la section), section circulaire, pas d'absorption par l'air, œil exposé directement.

export const arrondiCS = (x, n = 3) => (x === 0 || !isFinite(x) ? x : Number(Number(x).toPrecision(n)));
export const E_MAX = 10, H_MAX = 2.5, T_REFLEXE = 0.25;

export const sectionMm2 = dMm => Math.PI * dMm * dMm / 4;              // mm²
export const section = dMm => sectionMm2(dMm) * 1e-6;                  // m²
export const eclairement = (phi, dMm) => phi / section(dMm);           // phi en W → W/m²
export const flux = (E, dMm) => E * section(dMm);
export const energie = (phi, dt) => phi * dt;                          // J
export const duree = (Q, phi) => Q / phi;                              // s
export const diametre = (d0Mm, thetaMrad, L) => d0Mm + thetaMrad * L;  // mm
export const fluxMax = dMm => E_MAX * section(dMm);                    // flux maximal pour une exposition prolongée
export const dureeMax = E => (E > E_MAX ? H_MAX / E : Infinity);       // s ; infinie si E ≤ E_MAX
export const CLASSES = [[1e-3, '2'], [5e-3, '3R'], [0.5, '3B'], [Infinity, '4']];  // classe selon le flux d'un faisceau visible (W), classe 1 non traitée
export const classe = phi => { for (const [m, c] of CLASSES) if (phi <= m) return c; return '4'; };

export const PARCOURS = { phi: 0.004, d: 2.0, theta: 0.1, L: 5, Pgrav: 2.0, Qgrav: 0.4, Pdef: 20e-3, tdef: 2.0 };
export const FLUX_LISTE_MW = [1, 4, 5, 50, 500];
export const D_LISTE_MM = [1, 2, 3];
export const THETA_LISTE = [0, 0.1, 0.5, 1];
export const DUREES_MS = [1, 10, 250, 1000];

const choisir = (t, alea) => t[Math.min(t.length - 1, Math.floor(alea() * t.length))];

// Défi A : sécurité d'un faisceau (données : φ en mW, D en mm). L'élève calcule E (W/m²) puis la durée d'exposition maximale (ms).
export function tirageDefiA(alea = Math.random) {
  for (let k = 0; k < 800; k++) {
    const phiMw = choisir([2, 3, 4, 5, 8, 10, 15], alea), D = choisir([1, 1.5, 2, 2.5, 3, 4], alea);
    const E = eclairement(phiMw / 1000, D), t = dureeMax(E) * 1000;     // ms
    if (E < 200 || E > 20000 || t < 0.1) continue;
    return { type: 'secu', phiMw, D, E, tMs: t };
  }
  throw new Error('tirage défi A impossible');
}
// Défi B : tache laser de découpe. Données : φ (W), D (mm), durée Δt (ms). L'élève calcule l'énergie Q (J) et l'éclairement E (W/mm²).
export function tirageDefiB(alea = Math.random) {
  const phi = choisir([20, 50, 100, 200], alea), D = choisir([0.2, 0.3, 0.5], alea), tMs = choisir([5, 10, 20, 50], alea);
  return { type: 'decoupe', phi, D, tMs, Q: phi * tMs / 1000, Emm: phi / sectionMm2(D) };
}
