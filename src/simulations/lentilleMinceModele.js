// ====================================================
//  Modèle de la lentille mince convergente (1G) : relation de conjugaison, grandissement, rayons particuliers.
//  Grandeurs algébriques (cm) sur l'axe optique orienté dans le sens de propagation de la lumière, origine au centre optique O :
//  OA < 0 pour un objet réel (placé avant la lentille), OA′ > 0 pour une image réelle (après la lentille), OA′ < 0 pour une image virtuelle.
//  Relation de conjugaison : 1/OA′ − 1/OA = 1/f′ ; grandissement : γ = A′B′/AB = OA′/OA.
//  Hypothèses : lentille mince, rayons proches de l'axe (approximation de Gauss), lumière monochromatique, objet-plan perpendiculaire à l'axe.
// ====================================================

export const H_OBJ = 2;            // hauteur AB de l'objet (cm)
export const TOL_NETTE = 0.6;      // l'image est jugée nette si l'écran est à moins de 0,6 cm de OA′ (cm)
export const F_MIN = 5, F_MAX = 20;
export const D_MIN = 4, D_MAX = 32;
export const S_MIN = 5, S_MAX = 50;

// d = distance objet–lentille (cm, d > 0), f = distance focale image f′ (cm)
export function image(d, f) {
  const OA = -d;
  if (Math.abs(d - f) < 1e-9) return { OA, OAp: Infinity, gamma: Infinity, hImg: Infinity, nature: 'infini', droite: false };
  const OAp = (OA * f) / (OA + f);                     // 1/OA′ = 1/OA + 1/f′
  const gamma = OAp / OA;
  return { OA, OAp, gamma, hImg: gamma * H_OBJ, nature: OAp > 0 ? 'reelle' : 'virtuelle', droite: gamma > 0 };
}

// distance focale déduite d'une mesure : 1/f′ = 1/OA′ − 1/OA
export const focaleDepuis = (OA, OAp) => (OA * OAp) / (OA - OAp);

// l'image est nette sur un écran placé à s (cm) derrière la lentille
export function nette(d, f, s) {
  const im = image(d, f);
  return im.nature === 'reelle' && Math.abs(s - im.OAp) <= TOL_NETTE;
}

// Rayons particuliers issus du sommet B de l'objet (coordonnées en cm : x le long de l'axe, y en hauteur).
// R1 : parallèle à l'axe puis passant par F′ ; R2 : passant par O, non dévié ; R3 : passant par F (ou dirigé vers F) puis parallèle à l'axe.
export function rayons(d, f) {
  const yB = H_OBJ;
  const y3 = (yB * f) / (f - d);                       // hauteur du rayon R3 sur la lentille (d ≠ f)
  const r1 = { avant: [[-d, yB], [0, yB]], dir: [f, -yB] };            // après la lentille : direction de (0, yB) vers F′ = (f, 0)
  const r2 = { avant: [[-d, yB], [0, 0]], dir: [d, -yB] };             // direction de B vers O
  const r3 = Math.abs(d - f) < 1e-9 ? null : { avant: [[-d, yB], [0, y3]], dir: [1, 0] };
  return { r1, r2, r3, y3 };
}

// Ordonnée d'un rayon (point de départ p, direction u) à l'abscisse x
export const ordonnee = (p, u, x) => p[1] + (u[1] / u[0]) * (x - p[0]);

// Intersection des rayons R1 et R2 après la lentille (ou de leurs prolongements) : c'est le sommet B′ de l'image
export function sommetImage(d, f) {
  const im = image(d, f);
  if (!isFinite(im.OAp)) return null;
  return [im.OAp, im.hImg];
}

// Fraction d'écart de f′ due à la précision de la mise au point : pire cas sur [OAp − TOL, OAp + TOL]
export function pireEcartFocale(d, f) {
  const im = image(d, f);
  let pire = 0;
  for (const dx of [-TOL_NETTE, TOL_NETTE]) {
    const fm = focaleDepuis(-d, im.OAp + dx);
    pire = Math.max(pire, Math.abs(fm - f) / f);
  }
  return pire;
}
