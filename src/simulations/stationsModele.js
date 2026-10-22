// ====================================================
//  Modèles des « stations » de la journée au labo (sans React, testable seul).
//  Une station reprend un modèle de simulation existant, mais ses paramètres sont CACHÉS : l'élève doit les trouver par la mesure.
//  Ici : le banc à gradient de température (TMFF). Hypothèse de scénario : l'abaissement de la TMFF par % de coalescent
//  (efficacité) vaut entre 2,6 et 3,6 °C/% selon le lot ; l'élève ne le sait pas, il le déduit de ses essais.
// ====================================================
import { rng, gauss } from "./etalonnageModele";

export const EFF_MIN = 2.6, EFF_MAX = 3.6;          // °C par % de coalescent sur polymère sec (secret)
export const SIGMA_BANC = 0.4;                       // °C : dispersion de lecture du banc (écart-type, hypothèse)
export const DOSES_BANC = [0, 1, 2, 3, 4, 5, 6, 8, 10];   // g de DPnB proposés
export const DEM_MIN = 0.9, DEM_MAX = 1.05;          // facteur caché sur la dose de dispersant nécessaire
export const ESSAIS_MAX = 6;                         // essais maximum au banc (chacun coûte du temps)
export const DUREE_ESSAI = 5;                        // min par essai

// Tirage des paramètres cachés d'une partie (appelé une fois, à la création de la partie)
export function secretsAleatoires() {
  const graine = Math.floor(Math.random() * 2 ** 31);
  return secretsDe(graine);
}
export function secretsDe(graine) {
  const r = rng(graine);
  const eff = Math.round((EFF_MIN + r() * (EFF_MAX - EFF_MIN)) * 100) / 100;
  const dem = Math.round((DEM_MIN + r() * (DEM_MAX - DEM_MIN)) * 100) / 100;   // décalage de la demande en dispersant de ce lot de poudres
  const f = () => 0.96 + r() * 0.08;   // prises d'huile du lot de poudres : valeurs de référence × (0,96 à 1,04), à découvrir par la mesure
  const ph = { tio2: Math.round(25 * f() * 10) / 10, caco3: Math.round(30 * f() * 10) / 10 };
  const rf = Math.round((0.85 + r() * 0.30) * 100) / 100;   // facteur de réponse du DPnB par rapport à l'étalon interne (caché)
  return { graine, eff, dem, ph, rf };
}

// Lecture au banc : TMFF vraie + bruit reproductible (même graine et même numéro d'essai = même lecture), lue au 0,5 °C près ; le banc s'arrête à 0 °C
export function lectureBanc(tmffVraie, graine, n) {
  const r = rng((graine ^ (n * 2654435761)) >>> 0);
  const v = tmffVraie + SIGMA_BANC * gauss(r);
  if (v <= 0) return null;                          // film continu sur tout le banc : « < 0 °C »
  return Math.round(v * 2) / 2;
}

// Pente tmff = f(% coalescent) estimée par moindres carrés sur les essais au banc (lectures non nulles, au moins 2 doses différentes)
export function penteMesuree(essais) {
  const pts = essais.filter(x => x.tmff != null);
  if (new Set(pts.map(x => x.pct)).size < 2 || pts.length < 3) return null;
  const n = pts.length, mx = pts.reduce((s, p) => s + p.pct, 0) / n, my = pts.reduce((s, p) => s + p.tmff, 0) / n;
  const Sxx = pts.reduce((s, p) => s + (p.pct - mx) ** 2, 0), Sxy = pts.reduce((s, p) => s + (p.pct - mx) * (p.tmff - my), 0);
  const a = Sxy / Sxx, b = my - a * mx;
  const SSres = pts.reduce((s, p) => s + (p.tmff - (a * p.pct + b)) ** 2, 0);
  const sa = n > 2 ? Math.sqrt(SSres / (n - 2) / Sxx) : null;
  return { efficacite: -a, incertitude: sa, tmff0: b, n };
}

// ───────────── Station « courbe de défloculation » (TP de dosologie du Coadis BR3, mélange 50/50 TiO₂ / CaCO₃, 250 g de poudres) ─────────────
// Points RÉELS (sujet de TP, viscosimètre à haut gradient) de 0,094 à 0,21 % puis 0,566 % ; les points de 0,25 à 0,50 % sont INVENTÉS (plateau plausible).
// [ % de dispersant sec / poudres, viscosité à 258 s⁻¹, viscosité à 129 s⁻¹ (mPa·s) ]
export const COURBE_REF = [
  [0.09392, 2947, 4877], [0.12688, 1287, 2220], [0.14656, 556, 937], [0.16048, 403, 719], [0.17776, 151, 251], [0.2096, 83, 158],
  [0.25, 65, 118], [0.30, 58, 98], [0.35, 54, 86], [0.40, 52, 78], [0.45, 51, 73], [0.50, 50, 70], [0.56576, 50, 68],
];
export const X_HORS_GAMME = 0.0939;                    // en dessous : viscosité trop élevée pour le viscosimètre (> 5000 mPa·s)
export const DOSES_COURBE = [0.06, 0.09, 0.11, 0.13, 0.15, 0.17, 0.19, 0.21, 0.25, 0.30, 0.40, 0.55];   // % de matière active sur les poudres
export const COURBE_MAX = 8, COURBE_DUREE = 3, COURBE_PREP = 5;
export const BORNE_BASSE = 0.133, BORNE_SEUIL = 0.165, BORNE_HAUTE = 0.35;   // % « effectifs » : en dessous de 0,133, les amas restent ; au-dessus de 0,165 on est sur le plateau ; au-delà de 0,35 : surdosage inutile
export const masseCoadis = (pct, mPoudres = 250) => pct / 100 * mPoudres / 0.4;   // g de Coadis BR3 (ES 40 %) pour pct % de matière active

// Viscosité vraie à la dose x (interpolation log-linéaire entre les points ; la demande du lot décale l'axe des doses). null = hors gamme.
export function viscoVraie(x, dem = 1) {
  const xe = x / dem;
  if (xe < X_HORS_GAMME) return null;
  const T = COURBE_REF;
  if (xe >= T.at(-1)[0]) return [T.at(-1)[1], T.at(-1)[2]];
  const i = T.findIndex((p, k) => xe >= p[0] && xe < T[k + 1][0]), a = T[i], b = T[i + 1], u = (xe - a[0]) / (b[0] - a[0]);
  const L = (ya, yb) => Math.exp(Math.log(ya) + u * (Math.log(yb) - Math.log(ya)));
  return [L(a[1], b[1]), L(a[2], b[2])];
}
// Lecture : bruit relatif de 4 % (hypothèse), arrondi à l'unité
export function lectureVisco(x, dem, graine, n) {
  const v = viscoVraie(x, dem); if (!v) return null;
  const r = rng((graine ^ (n * 40503) ^ 0x9e3779b9) >>> 0);
  return v.map(y => Math.round(y * (1 + 0.04 * gauss(r))));
}

// ───────────── Station « prise d'huile » (méthode à la spatule, 10 g de poudre, huile de lin) ─────────────
// Valeurs de référence (poudres du lycée, d'après le professeur) : TiO₂ ≈ 25, CaCO₃ ≈ 30 g/100 g ; le lot tiré en diffère de ± 4 % (caché).
export const M_POUDRE = 10, HUILE_MAX_ESSAIS = 6, HUILE_DUREE = 8;
export const POUDRES_HUILE = { tio2: 'TiO₂', caco3: 'CaCO₃ léger' };
// Rapport (huile ajoutée / huile nécessaire) → état de la pâte. Point final : pâte lisse et cohérente, 0,96 à 1,04 (appréciation de l'opérateur ≈ ± 4 %, hypothèse)
export function etatPate(rapport) {
  if (rapport < 0.75) return { cle: 'seche', t: 'poudre encore sèche', c: '#e5e7eb' };
  if (rapport < 0.96) return { cle: 'grumeaux', t: 'grumeaux humides, qui ne se tiennent pas', c: '#fef3c7' };
  if (rapport <= 1.04) return { cle: 'fin', t: 'pâte lisse et cohérente, qui ne se brise pas', c: '#fde68a' };
  return { cle: 'fluide', t: 'pâte trop fluide : le point final est dépassé', c: '#fca5a5' };
}
export const rapportPate = (huile, phVrai) => huile / M_POUDRE * 100 / phVrai;

// ───────────── Station « dosage du DPnB par CPG-FID » (contrôle du COV) — DONNÉES DE SCÉNARIO, pas de chromatogramme réel ─────────────
// Échantillon : 1,00 g de peinture + étalon interne, complété à 10,0 mL au solvant (éthanol) ; étalons : DPnB de 0,25 à 3 mg/mL dans le même solvant.
// Hypothèses du modèle (explicitées dans le débrief) : réponse du FID linéaire sur la plage ; erreur de volume injecté commune aux deux pics (6 %, écart-type) ;
// bruit propre à chaque aire 1,5 % ; erreurs normales, de variance constante ; préparation de l'échantillon ± 1 % (pesée et dilution).
import { regression } from "./etalonnageModele";
export const NIVEAUX_ETALON = [0.25, 0.5, 1, 1.5, 2, 3];   // mg/mL de DPnB
export const C_IS = 1.0;                                    // mg/mL d'étalon interne dans toutes les solutions
export const M_ECH = 1.00, V_ECH = 10;                      // g de peinture, mL de volume final
export const T_PREP = 5, T_INJ = 3, ETAL_MAX = 10, ECH_MAX = 4;
export const SIGMA_VOL = 0.06, SIGMA_AIRE = 0.015, SIGMA_PREP = 0.01, K_AIRE = 10000;
export const TR = { is: 6.2, dpnb: 8.1 };                   // min (données de scénario)

// Une injection : aires du DPnB et de l'étalon interne (même graine et même n° = mêmes aires)
export function injection(graine, n, cDpnb, rf) {
  const r = rng((graine ^ (n * 69069) ^ 0x1234567) >>> 0);
  const vol = 1 + SIGMA_VOL * gauss(r);
  return { aD: Math.round(K_AIRE * rf * cDpnb * vol * (1 + SIGMA_AIRE * gauss(r))), aI: Math.round(K_AIRE * C_IS * vol * (1 + SIGMA_AIRE * gauss(r))) };
}
// Concentration réelle de l'échantillon préparé (mg/mL), avec son erreur de préparation (tirée une fois par partie)
export const cEchantillon = (cov, densite, graine) => cov / (densite * V_ECH) * M_ECH * (1 + SIGMA_PREP * gauss(rng((graine ^ 0x5bd1e995) >>> 0)));
// Droite d'étalonnage : mode 'interne' (aD/aI en fonction de c/C_IS) ou 'externe' (aD en fonction de c)
export function etalonnage(etal, mode) {
  const x = etal.map(p => mode === 'interne' ? p.c / C_IS : p.c), y = etal.map(p => mode === 'interne' ? p.aD / p.aI : p.aD);
  const R = regression(x, y); if (!R) return null;
  return { ...R, mode, xs: x, ys: y, residRel: Math.sqrt(R.SSres / (etal.length - 2)) / (R.my || 1) * 100 };   // écart-type résiduel relatif (%)
}
// Dosage de l'échantillon : concentration x0 (mg/mL), incertitude-type de la droite, moyenne des m injections
export function dosage(D, ech, mode) {
  if (!D || !ech.length) return null;
  const y = ech.map(p => mode === 'interne' ? p.aD / p.aI : p.aD), m = y.length, y0 = y.reduce((a, b) => a + b, 0) / m;
  const x0 = (y0 - D.b) / D.a, ux = D.syx / Math.abs(D.a) * Math.sqrt(1 / m + 1 / D.n + (y0 - D.my) ** 2 / (D.a ** 2 * D.Sxx));
  const u = Math.sqrt(ux ** 2 + (SIGMA_PREP * x0) ** 2);   // composition avec l'erreur de préparation
  return { x0, ux, u, m, y0, dansDomaine: x0 >= Math.min(...D.xs) * (mode === 'interne' ? 1 : 1) && x0 <= Math.max(...D.xs) };
}
// Passage de la concentration de la solution (mg/mL) au COV de la peinture (g/L) : COV = c × V / m × ρ
export const covDepuisC = (c, densite) => c * V_ECH / M_ECH * densite;
