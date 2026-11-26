// Simulation « Synthèse additive et synthèse soustractive » (BTS MDC, Formulation, « Aspect »).
// Modèle : couleurModele.js (CIE 1931 2°, tables au pas de 10 nm de 380 à 780 nm).
// Deux volets :
//  - LUMIÈRES (additive) : trois sources à bande large (LED), un jaune monochromatique ; les spectres s'ajoutent, puis l'œil ne garde que
//    trois nombres (réponses L, M, S des trois types de cônes). Cônes : transformation de Hunt-Pointer-Estevez des fonctions colorimétriques CIE (approximation).
//  - FILTRES et PEINTURES (soustractive) : absorbances qui s'ajoutent (loi de Beer-Lambert pour un filtre) ; pour une couche de peinture opaque,
//    théorie de Kubelka-Munk avec un pouvoir diffusant S indépendant de la longueur d'onde (seul K varie) : K/S s'additionne.
// Les courbes de pigments sont ILLUSTRATIVES (pigments imaginaires), pas des mesures.
import * as C from './couleurModele.js';
import { LAMBDA, XBAR, YBAR, ZBAR } from './couleurDonnees.js';

export const NB = LAMBDA.length;
const gau = (c, s) => LAMBDA.map(l => Math.exp(-0.5 * ((l - c) / s) ** 2));
const sig = (l, c, w) => 1 / (1 + Math.exp(-(l - c) / w));
const bosse = (l, c, w) => Math.exp(-(((l - c) / w) ** 2));

// ================= LUMIÈRES =================
const xyzSpec = s => { let X = 0, Y = 0, Z = 0; for (let i = 0; i < NB; i++) { X += s[i] * XBAR[i]; Y += s[i] * YBAR[i]; Z += s[i] * ZBAR[i]; } return { X, Y, Z }; };
export const lms = ({ X, Y, Z }) => ({ L: 0.4002 * X + 0.7076 * Y - 0.0808 * Z, M: -0.2263 * X + 1.1653 * Y + 0.0457 * Z, S: 0.9182 * Z });
const inv3 = m => {
  const [[a, b, c], [d, e, f], [g, h, i]] = m, det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  return [[(e * i - f * h), (c * h - b * i), (b * f - c * e)], [(f * g - d * i), (a * i - c * g), (c * d - a * f)], [(d * h - e * g), (b * g - a * h), (a * e - b * d)]].map(r => r.map(v => v / det));
};
const mul3 = (m, v) => m.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
/** Courbes de sensibilité des trois types de cônes (L, M, S), normalisées à 1 au maximum (approximation HPE des fonctions colorimétriques CIE). */
export const CONES = (() => {
  const L = [], M = [], S = [];
  for (let i = 0; i < NB; i++) { const r = lms({ X: XBAR[i], Y: YBAR[i], Z: ZBAR[i] }); L.push(Math.max(0, r.L)); M.push(Math.max(0, r.M)); S.push(Math.max(0, r.S)); }
  const n = a => { const m = Math.max(...a); return a.map(v => v / m); };
  return { L: n(L), M: n(M), S: n(S) };
})();

/** Les trois lampes (LED à bande large) : centre et écart-type en nm. */
export const LAMPES = { R: { nom: 'rouge', c: 625, s: 14 }, V: { nom: 'verte', c: 545, s: 16 }, B: { nom: 'bleue', c: 460, s: 12 } };
const GAU = { R: gau(625, 14), V: gau(545, 16), B: gau(460, 12) };
// étalonnage : les trois lampes à fond (100 %) donnent le blanc D65, de luminance Y = 100
const A = (() => {
  const u = ['R', 'V', 'B'].map(k => xyzSpec(GAU[k]));
  const m = [[u[0].X, u[1].X, u[2].X], [u[0].Y, u[1].Y, u[2].Y], [u[0].Z, u[1].Z, u[2].Z]];
  const w = C.BLANC_D65, a = mul3(inv3(m), [w.X, w.Y, w.Z]);
  return { R: a[0], V: a[1], B: a[2] };
})();
export const ETALONNAGE = A;
/** Spectre de la lumière des trois lampes réglées à r, v, b (entre 0 et 1) : somme des trois spectres. */
export const spectreRVB = (r, v, b) => LAMBDA.map((_, i) => r * A.R * GAU.R[i] + v * A.V * GAU.V[i] + b * A.B * GAU.B[i]);
/** Spectre d'une lumière monochromatique (largeur 6 nm) de longueur d'onde lam et de luminance Y. */
export function spectreMono(lam, Y) {
  const g = gau(lam, 6), y = xyzSpec(g).Y;
  return g.map(v => v * Y / y);
}
export const somme = (...ss) => LAMBDA.map((_, i) => ss.reduce((t, s) => t + s[i], 0));
export const xyzLumiere = xyzSpec;
export const reponses = s => lms(xyzSpec(s));
export const chroma = s => C.xyY(xyzSpec(s));
/** Couleur affichée d'une lumière : si elle sort du gamut sRGB, on réduit la saturation (L* et teinte conservés) plutôt que d'écrêter chaque canal. */
export const cssLumiere = s => { const l = C.lab(xyzSpec(s), C.BLANC_D65); return C.srgbAffichable({ ...l, L: Math.min(100, l.L) }).css; };
export const luminance = s => xyzSpec(s).Y;

/** Réglages (r, v) des lampes rouge et verte (b = 0) qui donnent à l'œil les mêmes réponses L et M qu'une lumière monochromatique de longueur d'onde lam
 *  et de luminance Y. Renvoie aussi la réponse S des deux lumières. */
export function equivalentRV(lam, Y) {
  const m = spectreMono(lam, Y), cm = reponses(m), cr = reponses(spectreRVB(1, 0, 0)), cv = reponses(spectreRVB(0, 1, 0));
  const det = cr.L * cv.M - cv.L * cr.M;
  const r = (cm.L * cv.M - cv.L * cm.M) / det, v = (cr.L * cm.M - cm.L * cr.M) / det;
  return { r, v, mono: cm, mix: reponses(spectreRVB(r, v, 0)) };
}
/** Lumière jaune de l'étape « cônes » : 580 nm, luminance choisie pour que le mélange équivalent reste réglable (r, v ≤ 1). */
export const JAUNE = { lam: 580, Y: 40 };
/** Deux lumières confondues par un œil sans cônes M (deutéranope) : un orange (610 nm) et un vert-jaune (lam2) réglés pour la même réponse L. */
export function paireDeuteranope() {
  const o = spectreMono(610, 30), co = reponses(o);
  const g0 = spectreMono(545, 1), cg0 = reponses(g0), k = co.L / cg0.L;
  const g = spectreMono(545, k), cg = reponses(g);
  return { orange: o, vert: g, co, cg, kY: k };
}

// ================= FILTRES ET PEINTURES =================
export const PIGMENTS = ['jaune', 'magenta', 'cyan'];
export const NOMS = { jaune: 'Jaune', magenta: 'Magenta', cyan: 'Cyan', blanc: 'Blanc', noir: 'Noir' };
/** Pouvoir absorbant K/S d'une unité de concentration de chaque pigment, par longueur d'onde (illustratif). */
export const KAPPA = {
  jaune: LAMBDA.map(l => 0.03 + 4.2 * (1 - sig(l, 495, 14))),
  magenta: LAMBDA.map(l => 0.03 + 5.0 * bosse(l, 540, 38)),
  cyan: LAMBDA.map(l => 0.03 + 5.0 * sig(l, 598, 16)),
  noir: LAMBDA.map(() => 8),
};
export const BETA = 8;   // pouvoir diffusant ajouté par une unité de blanc (S = 1 + BETA·c_blanc)
/** Réflectance d'une couche opaque d'après Kubelka-Munk : R = 1 + K/S − √((K/S)² + 2K/S). */
export const reflKM = ks => ks <= 0 ? 1 : 1 + ks - Math.sqrt(ks * ks + 2 * ks);
export const ksDe = ks => (1 - ks) ** 2 / (2 * ks);   // K/S d'après R (réciproque)
/** K/S du mélange de concentrations c = { jaune, magenta, cyan, noir, blanc } (entre 0 et 1 chacune). */
export function ksMelange(c) {
  return LAMBDA.map((_, i) => ((c.jaune ?? 0) * KAPPA.jaune[i] + (c.magenta ?? 0) * KAPPA.magenta[i] + (c.cyan ?? 0) * KAPPA.cyan[i] + (c.noir ?? 0) * KAPPA.noir[i]) / (1 + BETA * (c.blanc ?? 0)));
}
export const reflPeinture = c => ksMelange(c).map(reflKM);
/** Réflectance d'un mélange « à la moyenne » des réflectances de chaque pigment seul (modèle FAUX, présenté pour être comparé). */
export function reflMoyenne(c) {
  const cles = ['jaune', 'magenta', 'cyan'].filter(k => (c[k] ?? 0) > 0), tot = cles.reduce((t, k) => t + c[k], 0);
  if (!tot) return LAMBDA.map(() => 1);
  return LAMBDA.map((_, i) => cles.reduce((t, k) => t + c[k] * reflKM(c[k] * KAPPA[k][i]), 0) / tot);
}
export const labPeinture = (refl, id = 'D65') => C.lab(C.xyz(refl, id), C.blancDe(id));
export const cssPeinture = refl => C.cssObjet(refl, 'D65');
/** Absorbance d'un filtre : A = Σ c_i·a_i(λ) ; transmittance T = 10^(−A). Le filtre pigmenté de concentration c a le pouvoir absorbant KAPPA·0,3 par unité. */
export const absorbance = c => LAMBDA.map((_, i) => 0.3 * ((c.jaune ?? 0) * KAPPA.jaune[i] + (c.magenta ?? 0) * KAPPA.magenta[i] + (c.cyan ?? 0) * KAPPA.cyan[i]));
export const transmittance = c => absorbance(c).map(a => 10 ** -a);
/** Couleur de la lumière D65 après le filtre. */
export const cssFiltre = t => C.cssObjet(t, 'D65');
export const xyFiltre = t => C.xyY(C.xyz(t, 'D65'));

// ================= DÉFIS =================
const arr = (v, pas) => Math.round(v / pas) * pas;
/** Défi « reproduire une lumière » : trois réglages cachés (multiples de 0,05), deux lampes au moins nettement allumées. */
export function tirageAppariement(rnd) {
  let r, v, b;
  do { r = arr(rnd(), 0.05); v = arr(rnd(), 0.05); b = arr(rnd(), 0.05); } while ([r, v, b].filter(x => x >= 0.2).length < 2 || Math.max(r, v, b) < 0.6);
  const c = chroma(spectreRVB(r, v, b));
  return { r, v, b, x: c.x, y: c.y, Y: c.Y };
}
/** Défi « retrouver une teinte » : deux pigments parmi jaune, magenta, cyan (0,2 à 0,7) et éventuellement du blanc ; teinte cible en L*a*b*. */
export function tirageRecette(rnd) {
  const ordre = [...PIGMENTS].sort(() => rnd() - 0.5), c = { jaune: 0, magenta: 0, cyan: 0, blanc: 0 };
  c[ordre[0]] = Math.max(0.2, arr(0.2 + 0.5 * rnd(), 0.05)); c[ordre[1]] = Math.max(0.2, arr(0.2 + 0.5 * rnd(), 0.05));
  c.blanc = rnd() < 0.5 ? 0 : Math.max(0.1, arr(0.1 + 0.3 * rnd(), 0.05));
  return { recette: c, lab: labPeinture(reflPeinture(c)) };
}

export const LAMBDAS = LAMBDA;
export { C };
