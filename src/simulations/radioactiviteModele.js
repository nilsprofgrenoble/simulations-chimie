// ====================================================
//  MODÈLE « RADIOACTIVITÉ : LOI DE DÉCROISSANCE, DEMI-VIE, ACTIVITÉ ET DATATION » (sim 123, niveau TG)
//  Le calcul de la décroissance est celui de la cinétique d'ordre 1 de la simulation 122 (vitesseOrdre1Modele.js), importé SANS modification :
//  N(t) = N0·e^(−λ·t) joue le rôle de c(t) = c0·e^(−k·t) ; l'activité A = −dN/dt = λ·N joue le rôle de la vitesse volumique v = −dc/dt.
//  Hypothèses de travail (rappelées dans la simulation) :
//   - noyaux tous identiques et indépendants : chacun a la même probabilité λ·dt de se désintégrer pendant dt, quel que soit son âge
//     (pas de « vieillissement » des noyaux) ;
//   - nombre de noyaux grand : la loi N(t) = N0·e^(−λt) décrit la valeur moyenne ; pour un petit échantillon, le nombre observé fluctue autour d'elle ;
//   - les noyaux fils ne se désintègrent pas dans la fenêtre étudiée (pas de filiation) ;
//   - activité d'un échantillon : nombre moyen de désintégrations par seconde, A = λ·N (en becquerel) ;
//   - compteur idéal : il détecte toutes les désintégrations de l'échantillon ; le nombre n compté pendant la durée Δt suit une loi de Poisson de moyenne A·Δt
//     (écart-type √(A·Δt)) ; activité mesurée = n / Δt ;
//   - datation : teneur initiale en noyaux radioactifs connue et constante ; aucun échange avec l'extérieur après l'événement daté.
//  Unités : N en noyaux, temps en jours (échantillon) ou en années (datation), λ en j⁻¹ (ou an⁻¹), activité en Bq (= s⁻¹).
//  P = { type: 'A', c0: N0, k: λ } : même forme que le modèle de la 122 (c0 = nombre initial de noyaux, k = λ dans l'unité de temps choisie).
// ====================================================
import { LN2, conc, th1, vit, tempsPour, dureeDemi, tangente } from "./vitesseOrdre1Modele.js";

export { LN2, tempsPour, dureeDemi, tangente };

export const JOUR_S = 86400;                 // secondes dans un jour
export const N0_DEFAUT = 4.0e7;              // noyaux (40 millions) : activité initiale ≈ 40 Bq pour l'iode 131
export const TH_DEFAUT = 8.0;                // demi-vie (jours) de l'iode 131 (valeur arrondie de la donnée usuelle)
export const TH_C14 = 5730;                  // demi-vie du carbone 14 (années)
export const TH_OPTIONS = [2, 4, 8, 16];     // demi-vies proposées en exploration (jours)
export const N0_OPTIONS = [1.0e7, 2.0e7, 4.0e7, 8.0e7];

// paramètres du modèle de la 122 : λ = ln 2 / t½ (dans l'unité de temps choisie)
export const params = (N0, th) => ({ type: 'A', c0: N0, k: LN2 / th });
export const lambda = P => P.k;
export const demiVie = P => th1(P);

// nombre moyen de noyaux restants à l'instant t
export const N = (P, t) => conc(P, t);
// fraction restante N / N0
export const fraction = (P, t) => conc(P, t) / P.c0;
// activité (Bq) à l'instant t : A = λ·N, avec λ converti en s⁻¹ (uniteS = nombre de secondes dans l'unité de temps)
export const activite = (P, t, uniteS = JOUR_S) => vit(P, t) / uniteS;
export const lambdaS = (P, uniteS = JOUR_S) => P.k / uniteS;
// durée de la n-ième demi-vie : toujours t½ (propriété de la loi exponentielle)
export const dureeNiveau = (P, n) => dureeDemi(P, n);

// ---------- datation ----------
// âge (même unité que t½) d'un échantillon dont la fraction restante de noyaux radioactifs est f (0 < f ≤ 1)
export const ageDepuisFraction = (th, f) => th * Math.log(1 / f) / LN2;
export const fractionDepuisAge = (th, age) => Math.exp(-LN2 * age / th);

// ---------- hasard : désintégration de noyaux individuels ----------
export function prng(graine) {
  let a = graine >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function gauss(r) { let u = 0; while (u === 0) u = r(); const v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

// instants de désintégration (même unité que t½) de n noyaux identiques : loi exponentielle de paramètre λ = ln 2 / t½
export function instantsDeces(n, th, graine) {
  const r = prng(graine), l = LN2 / th, res = new Array(n);
  for (let i = 0; i < n; i++) { let u = r(); if (u === 0) u = 1e-12; res[i] = -Math.log(u) / l; }
  return res;
}
// nombre de noyaux (sur n) encore intacts à l'instant t
export const restantsA = (instants, t) => instants.reduce((s, x) => s + (x > t ? 1 : 0), 0);
// même chose sans garder les instants (n jusqu'à quelques 10⁵)
export function restantsApres(n, th, t, graine) {
  const r = prng(graine), pSurvie = Math.exp(-LN2 * t / th);
  let k = 0; for (let i = 0; i < n; i++) if (r() < pSurvie) k++;
  return k;
}
// écart-type du nombre de noyaux restants pour n noyaux (loi binomiale) à l'instant t
export const ecartTypeRestants = (n, th, t) => { const p = Math.exp(-LN2 * t / th); return Math.sqrt(n * p * (1 - p)); };

// ---------- comptage d'une activité ----------
// nombre n de désintégrations comptées pendant dtS secondes quand l'activité vaut aBq (loi de Poisson de moyenne aBq·dtS)
export function poisson(moyenne, r) {
  if (moyenne <= 0) return 0;
  if (moyenne < 30) { const L = Math.exp(-moyenne); let k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; }
  return Math.max(0, Math.round(moyenne + Math.sqrt(moyenne) * gauss(r)));   // approximation normale (moyenne ≥ 30)
}
// série de mesures d'activité : un comptage de dtS secondes tous les `pas` unités de temps, de 0 à tmax
export function serieActivite(P, dtS, graine, pas, tmax, uniteS = JOUR_S) {
  const r = prng(graine), pts = [], n = Math.round(tmax / pas);
  for (let i = 0; i <= n; i++) {
    const t = i * pas, a = activite(P, t, uniteS), compte = poisson(a * dtS, r);
    pts.push({ t, a, n: compte, am: compte / dtS });
  }
  return pts;
}
// incertitude-type sur l'activité d'un comptage unique : u(A) = √n / Δt ; incertitude relative 1 / √n
export const incertitudeActivite = (n, dtS) => Math.sqrt(n) / dtS;
export const incertitudeRelative = n => (n > 0 ? 1 / Math.sqrt(n) : Infinity);

// ajustement linéaire de ln(A mesurée) en fonction de t (moindres carrés, points d'activité mesurée > 0) : pente = −λ
export function ajustementLnActivite(pts) {
  const q = pts.filter(x => x.am > 0).map(x => ({ t: x.t, y: Math.log(x.am) })), m = q.length;
  if (m < 3) return null;
  const mt = q.reduce((s, x) => s + x.t, 0) / m, my = q.reduce((s, x) => s + x.y, 0) / m;
  const sxx = q.reduce((s, x) => s + (x.t - mt) ** 2, 0), sxy = q.reduce((s, x) => s + (x.t - mt) * (x.y - my), 0);
  const pente = sxy / sxx;
  return { pente, ordonnee: my - pente * mt, th: LN2 / -pente, n: m };
}
