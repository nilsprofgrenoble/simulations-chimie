// Modèle PUR de la vue 3D d'une substitution nucléophile sur le (R)-2-bromobutane (SN2 : inversion de Walden ; SN1 : carbocation plan).
// Aucune dépendance à React ni à three.js : testé par sn3dModele.test.mjs.
// Repère : l'axe x est l'axe de l'attaque. Le groupe partant (Br) est à gauche (x < 0) au départ ; les trois autres groupes (C₂H₅, CH₃, H)
// sont répartis autour de l'axe, à 120° les uns des autres (azimuts φ), et penchent du côté opposé au groupe partant.
// Priorités CIP : 1 = Br (puis OH, qui a la même place dans la liste), 2 = C₂H₅, 3 = CH₃, 4 = H (identiques avant et après la réaction).
export const seg = (u, a, b) => { const t = Math.min(1, Math.max(0, (u - a) / (b - a))); return t * t * (3 - 2 * t); };
const LG0 = 1.5;                       // longueur de liaison dessinée
const LOIN = 3.9;                      // distance d'un groupe « libre » (loin du carbone)
const AZ = [0, 2 * Math.PI / 3, 4 * Math.PI / 3];          // azimuts de C₂H₅, CH₃, H autour de l'axe x
const dirSub = (xc, k) => { const r = Math.sqrt(1 - xc * xc); return [xc, r * Math.cos(AZ[k]), r * Math.sin(AZ[k])]; };
const mul = (v, a) => v.map(t => t * a);

// Position des groupes selon l'avancement u ∈ [0, 1].
//  meca 'SN2' : le nucléophile arrive par la droite pendant que Br part par la gauche ; le parapluie des 3 groupes se retourne.
//  meca 'SN1' : Br part (u de 0 à 0,4), le carbocation est plan (u ≈ 0,5), puis le nucléophile attaque la face 'gauche' (celle de Br : rétention)
//               ou la face 'droite' (opposée : inversion), les deux étant également probables.
export function etat(meca, u, face = 'droite') {
  const penche = 1 / 3;                // composante sur l'axe d'une liaison tétraédrique
  let xSub, lg, nu, lgLie, nuLie, lgOp, nuOp;
  if (meca === 'SN2') {
    const f = seg(u, 0.3, 0.7);
    xSub = penche * (1 - 2 * f);
    lg = [-(LG0 + (LOIN - LG0) * seg(u, 0.4, 0.95)), 0, 0];
    nu = [LG0 + (LOIN - LG0) * (1 - seg(u, 0.05, 0.6)), 0, 0];
    lgLie = u < 0.5; nuLie = u >= 0.5;
    lgOp = u < 0.5 ? 1 - 0.6 * seg(u, 0.2, 0.5) : 0.4 * (1 - seg(u, 0.5, 0.8));      // liaisons partielles à l'état de transition
    nuOp = u < 0.5 ? 0.4 * seg(u, 0.2, 0.5) : 0.4 + 0.6 * seg(u, 0.5, 0.8);
  } else {
    const aplat = seg(u, 0.2, 0.5), repliement = seg(u, 0.6, 0.95);
    const cote = face === 'droite' ? 1 : -1;                       // côté d'où arrive le nucléophile
    xSub = penche * (1 - aplat) - cote * penche * repliement;      // plan à u = 0,5 ; puis penche à l'opposé du nucléophile
    lg = [-(LG0 + (LOIN - LG0) * seg(u, 0.05, 0.45)), 0, 0];
    nu = [cote * (LG0 + (LOIN - LG0) * (1 - seg(u, 0.55, 0.95))), 0, 0];
    lgLie = u < 0.25; nuLie = u > 0.75;
    lgOp = 1 - seg(u, 0.1, 0.4); nuOp = seg(u, 0.6, 0.9);
  }
  const subs = [0, 1, 2].map(k => mul(dirSub(xSub, k), LG0));
  return { subs, lg, nu, lgLie, nuLie, lgOp, nuOp, xSub, plan: Math.abs(xSub) < 0.04 };
}

// Configuration (R ou S) lue sur la géométrie : produit mixte a · (b × c) < 0 ⇒ R (même convention que chiraliteModele.js),
// a, b, c = directions vers les groupes de priorités 1, 2, 3 ; null si le carbone n'a pas 4 liaisons (carbocation, état de transition).
const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
export function configuration(e) {
  if (e.plan) return null;
  const prio1 = e.lgLie ? e.lg : e.nuLie ? e.nu : null;
  if (!prio1) return null;
  const [c2h5, ch3] = e.subs;
  return dot(prio1, cross(c2h5, ch3)) < 0 ? 'R' : 'S';
}
