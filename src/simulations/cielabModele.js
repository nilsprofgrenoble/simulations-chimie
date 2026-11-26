// Simulation « Couleur : L*, a*, b* et écart de couleur » (BTS MDC, Aspect). Fil rouge : le contrôle d'un lot de peinture bleue par rapport à la teinte cible.
// Modèle : couleurModele.js (CIELAB, observateur 2°, illuminant D65). Tolérances : écart ΔE*ab (sphère) et écart CMC(2:1) (ellipsoïde).
import * as C from './couleurModele.js';

export const CIBLE = { L: 45, a: 7, b: -24 };       // teinte cible du cahier des charges (bleu ardoise) : C* = 25, h ≈ 286°
export const LOT0 = { L: 44, a: 9, b: -26 };        // lot fabriqué : ΔL* = −1, Δa* = +2, Δb* = −2, donc ΔE*ab = 3
export const TOL_ECART = 1.5, TOL_CMC = 1;
export const LIMITES = { L: [0, 100], a: [-70, 70], b: [-70, 70] };

/** Affichage sRGB : indique aussi si la couleur sort du gamut de l'écran. */
export const affichage = lab => C.srgb(C.xyzDeLab(lab));
export const enGamut = lab => !affichage(lab).hors;

/** Description qualitative de l'écart lot − cible. */
export function description(lot, cible) {
  const d = C.ecartCylindrique(lot, cible);
  return {
    lum: Math.abs(d.dL) < 0.5 ? 'identique' : d.dL < 0 ? 'plus foncé' : 'plus clair',
    sat: Math.abs(d.dC) < 0.5 ? 'identique' : d.dC < 0 ? 'plus terne' : 'plus saturé',
    rouge: Math.abs(lot.a - cible.a) < 0.5 ? 'identique' : lot.a > cible.a ? 'plus rouge' : 'plus vert',
    jaune: Math.abs(lot.b - cible.b) < 0.5 ? 'identique' : lot.b > cible.b ? 'plus jaune' : 'plus bleu',
  };
}

const entier = (rnd, lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const choix = (rnd, t) => t[Math.floor(rnd() * t.length)];
/** Défi « calculer ΔE*ab puis conclure » : cible et lot en nombres entiers, tolérance du cahier des charges, verdict net (écart d'au moins 12 % avec la tolérance). */
export function tirageEcart(rnd) {
  for (let k = 0; k < 500; k++) {
    const cible = { L: entier(rnd, 35, 75), a: entier(rnd, -35, 35), b: entier(rnd, -35, 35) };
    const lot = { L: cible.L + entier(rnd, -3, 3), a: cible.a + entier(rnd, -3, 3), b: cible.b + entier(rnd, -3, 3) };
    const tol = choix(rnd, [1, 1.5, 2, 2.5, 3]), e = C.deltaE76(lot, cible);
    if (e < 0.9 || Math.abs(e - tol) / tol < 0.12 || !enGamut(cible) || !enGamut(lot)) continue;
    return { cible, lot, tol, vrai: Math.round(e * 10) / 10, conforme: e <= tol };
  }
  return { cible: CIBLE, lot: LOT0, tol: 2, vrai: 3, conforme: false };
}
/** Défi « décrire l'écart » : luminosité (ΔL*) et saturation (ΔC*). */
export function tirageLecture(rnd) {
  for (let k = 0; k < 500; k++) {
    const cible = { L: entier(rnd, 35, 75), a: entier(rnd, -35, 35), b: entier(rnd, -35, 35) };
    const lot = { L: cible.L + choix(rnd, [-3, -2, 0, 2, 3]), a: cible.a + entier(rnd, -4, 4), b: cible.b + entier(rnd, -4, 4) };
    const d = C.ecartCylindrique(lot, cible);
    if (Math.abs(d.dC) < 1.2 || !enGamut(cible) || !enGamut(lot)) continue;
    const ds = description(lot, cible);
    return { cible, lot, lum: ds.lum, sat: ds.sat };
  }
  return { cible: CIBLE, lot: LOT0, lum: 'plus foncé', sat: 'plus saturé' };
}
/** Deux lots à 1,5 de la cible (ΔE*ab identique) : l'un décalé en saturation, l'autre en teinte (pour la tolérance CMC). */
export function lotsTolerance(cible = CIBLE, d = 1.5) {
  const c = C.lch(cible);
  return { enC: C.labDeLch({ L: cible.L, C: c.C + d, h: c.h }), enH: C.labDeLch({ L: cible.L, C: c.C, h: c.h + d * 180 / Math.PI / c.C }) };
}
