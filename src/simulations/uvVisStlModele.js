// ====================================================
//  Modèle de la simulation 307 : spectroscopie UV-visible en terminale STL (SPCL) : énergie d'un photon, droite d'étalonnage, dosage.
//  On réutilise sans les modifier les espèces, les spectres (bandes gaussiennes) et la loi de Beer-Lambert de la simulation 169 (uvVisModele.js).
//  Hypothèses : une seule espèce absorbante ; solutions étalons préparées dans les mêmes conditions que l'échantillon (même cuve, même λ de travail = λmax) ;
//  droite d'étalonnage passant par l'origine (A = k × c) dans le domaine de validité (A ≲ 1,2 pour les étalons) ; absorbances affichées à 3 décimales.
// ====================================================
import * as M from './uvVisModele.js';
export * from './uvVisModele.js';

// constantes imposées dans les énoncés
export const H = 6.63e-34, CL = 3.00e8, EV = 1.60e-19;
/** Énergie d'un photon de longueur d'onde lam (nm), en eV : E = h c / λ. */
export const energieEv = lam => H * CL / (lam * 1e-9) / EV;
/** Énergie d'un photon de longueur d'onde lam (nm), en J. */
export const energieJ = lam => H * CL / (lam * 1e-9);

/** Absorbance affichée (3 décimales) d'une solution de concentration c (unité du menu de l'espèce) à λmax, cuve de 1,00 cm. */
export const aAffichee = (esp, c) => Number(M.absorbance(esp, M.ESPECES[esp].lambdaMax, M.enMolL(esp, c)).toFixed(3));
/** Solutions étalons : concentrations cs (unité du menu), absorbance lue à λmax. */
export const etalons = (esp, cs) => cs.map(c => ({ c, A: aAffichee(esp, c) }));
/** Coefficient directeur entre deux étalons (A par unité de concentration du menu). */
export const penteDeuxPoints = (pts, i = 0, j = pts.length - 1) => (pts[j].A - pts[i].A) / (pts[j].c - pts[i].c);
/** Droite passant par l'origine, ajustée par les moindres carrés (ce que fait un tableur avec « droite passant par 0 »). */
export const penteAjustee = pts => pts.reduce((s, p) => s + p.c * p.A, 0) / pts.reduce((s, p) => s + p.c * p.c, 0);

// ---------- données du parcours guidé ----------
export const GUIDE = (() => {
  const esp = 'tartrazine', cs = [8, 16, 24, 32, 40], pts = etalons(esp, cs), k = penteDeuxPoints(pts), kAj = penteAjustee(pts);
  const cx = 28, Ax = aAffichee(esp, cx);                   // sirop jaune non dilué (µmol/L)
  const espB = 'bleu', kB = Number((M.ESPECES[espB].eps * M.L_CUVE * M.ESPECES[espB].facteur).toFixed(3)), FB = 10, cB = 6, AB = aAffichee(espB, cB);   // boisson bleue diluée 10 fois
  return { esp, cs, pts, k, kAj, cx, Ax, espB, kB, FB, AB };
})();

// ---------- défi « droite d'étalonnage » ----------
const arrondi2 = x => { const e = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.round(x / e) * e; };
/** Cinq étalons c0, 2c0 … 5c0 (A du dernier entre 0,70 et 1,10), bruit de mesure ±1 %, puis un échantillon dilué F fois dont l'absorbance
 *  est dans la gamme des étalons. La réponse attendue est calculée à partir des absorbances AFFICHÉES et de la droite ajustée. */
export function tirageDefiEtalonnage(rng = Math.random) {
  const t = a => a[Math.floor(rng() * a.length)];
  const esp = t(['tartrazine', 'jaune', 'cochenille', 'bleu', 'cafeine', 'paracetamol']), sp = M.ESPECES[esp];
  const A5 = t([0.70, 0.80, 0.90, 1.00, 1.10]);
  const c0 = arrondi2(A5 / (sp.eps * M.L_CUVE * sp.facteur) / 5);
  const cs = [1, 2, 3, 4, 5].map(i => Number((i * c0).toPrecision(3)));
  const pts = cs.map(c => ({ c, A: Number((aAffichee(esp, c) * (1 + (rng() - 0.5) * 0.024)).toFixed(3)) }));
  const F = t([1, 5, 10]);
  const Ax = Number((t([0.35, 0.45, 0.55, 0.65, 0.75]) * pts[4].A / 0.75 * 0.9 + 0.004 * t([0, 1, 2, 3])).toFixed(3));
  const k = penteAjustee(pts);
  return { esp, cs, pts, F, Ax, k, kDeuxPoints: penteDeuxPoints(pts), attendue: F * Ax / k };
}
