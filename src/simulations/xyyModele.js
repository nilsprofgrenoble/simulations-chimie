// Simulation « Le diagramme de chromaticité xy » (BTS MDC, Aspect). Modèle : couleurModele.js (CIE 1931, observateur 2°, blanc D65).
// Le diagramme est celui de la CIE 1931 ; les primaires de l'écran sont celles de la norme sRGB (valeurs publiées).
import * as C from './couleurModele.js';

export const W = C.BLANC_XY, P = C.PRIMAIRES_SRGB;
export const PT_LECTURE = C.pointDeDominante(590, 0.6);     // point lu dans le parcours : dominante 590 nm, pureté 0,60
export const PT_POURPRE = C.pointPourpre(540, 0.5);          // pourpre du parcours : complémentaire 540 nm
export const PAIRE = { lam1: 600, lam2: C.lireChromaticite(C.pointLieu(600).x, C.pointLieu(600).y).complementaire };
/** Part w de la lumière 2 qui amène le mélange de P1 et P2 sur le blanc (projection sur le segment). */
export function partBlanc(P1, P2) {
  const dx = P2.x - P1.x, dy = P2.y - P1.y;
  return ((W.x - P1.x) * dx + (W.y - P1.y) * dy) / (dx * dx + dy * dy);
}
/** Illuminants proposés comme blanc de référence (tables CIE du modèle de couleur) et leur point blanc (x ; y). */
export const ILLUMS = [{ id: 'D65', nom: 'D65 : lumière du jour' }, { id: 'A', nom: 'A : lampe à incandescence' }, { id: 'F2', nom: 'F2 : tube fluorescent' }];
export const blancIll = id => { const w = C.xyY(C.blancDe(id)); return { x: w.x, y: w.y }; };
/** Adaptation chromatique de Bradford : chromaticité sous laquelle un œil adapté au blanc wSrc perçoit un stimulus de chromaticité p,
 *  exprimée par rapport au blanc d'affichage wDst (couleur « correspondante »). Modèle approché, la luminance n'est pas représentée. */
const BRAD = [[0.8951, 0.2664, -0.1614], [-0.7502, 1.7135, 0.0367], [0.0389, -0.0685, 1.0296]];
const mul = (m, v) => m.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
function inv3(m) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m, A = e * i - f * h, B = -(d * i - f * g), Cc = d * h - e * g, det = a * A + b * B + c * Cc;
  return [[A / det, -(b * i - c * h) / det, (b * f - c * e) / det], [B / det, (a * i - c * g) / det, -(a * f - c * d) / det], [Cc / det, -(a * h - b * g) / det, (a * e - b * d) / det]];
}
const xyz1 = q => [q.x / q.y, 1, (1 - q.x - q.y) / q.y];
export function adapter(p, wSrc, wDst) {
  const r = mul(BRAD, xyz1(p)), s = mul(BRAD, xyz1(wSrc)), d = mul(BRAD, xyz1(wDst));
  const [X, Y, Z] = mul(inv3(BRAD), [r[0] * d[0] / s[0], r[1] * d[1] / s[1], r[2] * d[2] / s[2]]), t = X + Y + Z;
  return { x: X / t, y: Y / t };
}
/** Lecture complète d'un point : tout ce que le diagramme permet de dire. */
export function lecture(x, y, w = W) {
  const l = C.lireChromaticite(x, y, w);
  return { ...l, dansEcran: C.dansTriangle({ x, y }, P), dansDiagramme: C.dansDiagramme(x, y), teinte: C.nomTeinte(l.dominante) };
}
/** Lumière définie par une longueur d'onde et une pureté (mélange de monochromatique et de blanc). */
export const lumiere = (lam, pur) => C.pointDeDominante(lam, pur);

const choix = (rnd, t) => t[Math.floor(rnd() * t.length)];
export const LAM_DEFI = [470, 480, 490, 500, 510, 520, 540, 560, 570, 580, 590, 600, 610];
/** Défi « lire la longueur d'onde dominante » : point de dominante connue, pureté 0,4 à 0,8. */
export function tirageDominante(rnd) {
  const lam = choix(rnd, LAM_DEFI), pur = choix(rnd, [0.4, 0.5, 0.6, 0.7, 0.8]);
  return { lam, pur, pt: C.pointDeDominante(lam, pur), tolNm: 8 };
}
/** Défi « nature de la couleur et reproduction sur écran » : lumière de dominante connue ou pourpre ; reproductible si dans le triangle sRGB. */
export function tirageNature(rnd) {
  for (let k = 0; k < 500; k++) {
    const pourpre = rnd() < 0.4;
    const pt = pourpre ? C.pointPourpre(choix(rnd, [500, 510, 520, 530, 540, 550, 560]), choix(rnd, [0.3, 0.5, 0.7, 0.9]))
      : C.pointDeDominante(choix(rnd, LAM_DEFI), choix(rnd, [0.3, 0.5, 0.7, 0.9]));
    const d = marge(pt);
    if (d < 0.02) continue;                                   // jamais trop près du bord du triangle : verdict net
    return { pt, nature: pourpre ? 'pourpre' : 'spectrale', repro: C.dansTriangle(pt, P) };
  }
  return { pt: PT_LECTURE, nature: 'spectrale', repro: true };
}
/** Distance du point au triangle sRGB (plus petite distance aux trois côtés). */
export function marge(pt) {
  const seg = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, t = Math.max(0, Math.min(1, ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / (dx * dx + dy * dy))); return Math.hypot(pt.x - a.x - t * dx, pt.y - a.y - t * dy); };
  return Math.min(seg(P.R, P.G), seg(P.G, P.B), seg(P.B, P.R));
}
