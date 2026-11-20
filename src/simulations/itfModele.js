// ====================================================
//  Modèle de la simulation 183 : interférences de deux ondes (Terminale générale, spécialité physique-chimie).
//  Réutilise (sans la modifier) la géométrie de la cuve à ondes de ondesModele.js : distances aux sources, hyperboles, champ de deux sources circulaires.
//  Hypothèses (reprises dans le panneau « Hypothèses de travail ») :
//   • deux sources ponctuelles S1 (0 ; +s/2) et S2 (0 ; −s/2), reliées au même générateur : synchrones et en phase ;
//   • ondes progressives sinusoïdales, circulaires, dans un milieu homogène : la célérité est la même partout et vaut V_CUVE (valeur de modèle) ;
//   • amplitudes égales dans les formules ; dans le dessin de la cuve l'amplitude décroît en 1/√r : le calme n'est donc pas rigoureusement nul loin des sources ;
//   • δ = |r2 − r1| (valeur absolue) ; déphasage Δφ = 2π δ / λ : retard de phase de l'onde la plus lointaine sur l'autre.
// ====================================================
import { distancesSources, yPourDelta, natureInterference } from './ondesModele.js';
export { distancesSources, yPourDelta };

export const V_CUVE = 0.40;                                   // m/s : célérité des ondes à la surface de l'eau (valeur de modèle)
export const F_BASE = 20;                                     // Hz : fréquence de base
export const S_BASE = 6;                                      // cm : écartement de base des sources
export const lambdaCm = f => V_CUVE / f * 100;                // cm : λ = v / f
export const periodeMs = f => 1000 / f;                       // ms
export const retardMs = deltaCm => deltaCm * 1e-2 / V_CUVE * 1e3;      // τ = δ / v (ms)
export const dephasage = (deltaCm, lamCm) => 2 * Math.PI * deltaCm / lamCm;           // Δφ = 2π δ / λ (rad)
export const deltaPoint = (s, x, y) => { const [r1, r2] = distancesSources(s, x, y); return Math.abs(r2 - r1); };

// Nature d’une interférence d’après δ / λ : constructive si δ = kλ, destructive si δ = (k + ½)λ (tolérance 0,1 sur δ / λ)
export const nature = (deltaSurLam, tol = 0.1) => natureInterference(deltaSurLam, tol);

// Somme de deux signaux sinusoïdaux synchrones : s1 = A1 cos(ωt), s2 = A2 cos(ωt − Δφ) ; amplitude de la somme
export const ampSomme = (a1, a2, dphi) => Math.sqrt(a1 * a1 + a2 * a2 + 2 * a1 * a2 * Math.cos(dphi));
export const signal1 = (tMs, f) => Math.cos(2 * Math.PI * f * tMs * 1e-3);
export const signal2 = (tMs, f, dphi) => Math.cos(2 * Math.PI * f * tMs * 1e-3 - dphi);

// Poids d’une onde à la distance r (décroissance géométrique 1/√r, bornée près de la source) : même loi que champCuveDeux
const poids = (r, lam) => 1 / Math.sqrt(1 + r / (2 * lam));
// Amplitude de l’eau en (x, y), relative au maximum possible en ce point (1 = interférence parfaitement constructive)
export function amplitudeRelative(s, lam, x, y) {
  const [r1, r2] = distancesSources(s, x, y), k = 2 * Math.PI / lam, w1 = poids(r1, lam), w2 = poids(r2, lam);
  return Math.hypot(w1 * Math.cos(k * r1) + w2 * Math.cos(k * r2), w1 * Math.sin(k * r1) + w2 * Math.sin(k * r2)) / (w1 + w2);
}

// Nombre de lignes d’interférence : chaque ligne coupe le segment S1S2 (|δ| < s). Constructives : δ = kλ ; destructives : δ = (k + ½)λ (k entier relatif).
export const nbConstructives = (s, lam) => 2 * (Math.ceil(s / lam - 1e-9) - 1) + 1;
export const nbDestructives = (s, lam) => 2 * Math.max(0, Math.ceil(s / lam - 0.5 - 1e-9));
// Un point de la ligne δ = d (cm) d’abscisse x : ordonnée y > 0 (branche haute)
export const pointSurDelta = (s, d, x) => ({ x, y: yPourDelta(s, d, x) });

// Défi « combien de lignes ? » : couples (s, λ) où s / λ n’est jamais proche d’un entier (aucune ligne limite)
export const COUPLES_LIGNES = (() => {
  const L = [];
  for (const s of [4, 5, 6, 8, 10, 12]) for (const lam of [1.0, 1.5, 2.0, 2.5, 3.0, 4.0]) { const r = s / lam, fr = r - Math.floor(r); if (r > 1.2 && fr > 0.15 && fr < 0.85) L.push({ s, lam }); }
  return L;
})();

// Défi « retrouver λ » : un point M sur la ligne destructive de rang k (δ = (k + ½)λ) ; distances arrondies au dixième de centimètre (ce sont ces valeurs qui servent au corrigé)
export function tirageLambda(alea = Math.random) {
  const tire = t => t[Math.floor(alea() * t.length)];
  for (let essai = 0; essai < 200; essai++) {
    const lam = tire([1.2, 1.5, 1.8, 2.0, 2.5, 3.0]), k = tire([0, 1, 2]), s = tire([6, 8, 10, 12]);
    const d = (k + 0.5) * lam;
    if (d >= s - 0.5 || d < 1.4) continue;
    const x = tire([12, 14, 16, 18, 20]), y = yPourDelta(s, d, x);
    const [a, b] = distancesSources(s, x, y), r1 = Math.round(a * 10) / 10, r2 = Math.round(b * 10) / 10, dl = Math.round((r2 - r1) * 10) / 10;
    if (dl < 1.4) continue;
    return { s, k, r1, r2, delta: dl, vrai: dl / (k + 0.5) };
  }
  return { s: 8, k: 1, r1: 15.0, r2: 18.0, delta: 3.0, vrai: 2.0 };
}

// Textes de correction des défis (chaînes d'un seul bloc : la notation frac(a|b) doit être écrite entière dans une même chaîne pour être mise en forme)
const nbf = (v, d = 1) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
export const solutionLignes = d => { const kmax = Math.ceil(d.s / d.lam - 1e-9) - 1; return `On cherche les k entiers tels que |kλ| < s, soit |k| < frac(${nbf(d.s, 0)}|${nbf(d.lam, 1)}) = ${nbf(d.s / d.lam, 2)} : k va de −${kmax} à +${kmax}, soit ${nbConstructives(d.s, d.lam)} lignes.`; };
export const solutionLambda = d => `δ = r₂ − r₁ = ${nbf(d.delta, 1)} cm et δ = (k + ½)λ avec k = ${d.k}, donc λ = frac(δ|k + ½) = frac(${nbf(d.delta, 1)}|${nbf(d.k + 0.5, 1)}) = ${nbf(d.vrai, 2)} cm.`;
