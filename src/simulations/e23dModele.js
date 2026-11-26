// Modèle PUR de la vue 3D d'une élimination E2 : H (porté par Cβ) et Br (porté par Cα) sont ANTI-PÉRIPLANAIRES (de part et d'autre de la liaison C–C).
// Aucune dépendance à React ni à three.js : testé par e23dModele.test.mjs. Géométrie schématique ; pas de calcul d'énergie.
// Repère : la liaison Cβ–Cα est sur l'axe x (Cβ en x < 0). H pointe vers +y, Br vers −y. Le plan de l'alcène formé est le plan (x, z).
export const seg = (u, a, b) => { const t = Math.min(1, Math.max(0, (u - a) / (b - a))); return t * t * (3 - 2 * t); };
const DX = 0.8, LCH = 1.0, LR = 1.5, R3 = Math.sqrt(8) / 3;          // 0,9428 = √8 / 3 : composante perpendiculaire d'une liaison tétraédrique
const norm = v => { const n = Math.hypot(...v); return v.map(t => t / n); };
const mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const add = (a, b, k = 1) => a.map((x, i) => x + k * b[i]);
const phi = (sx, deg) => { const a = deg * Math.PI / 180; return [sx / 3, R3 * Math.cos(a), R3 * Math.sin(a)]; };   // direction tétraédrique, φ mesuré depuis +y

export function etat(u) {
  const g = seg(u, 0.1, 0.6), f = seg(u, 0.3, 0.8), d = seg(u, 0.35, 0.9);
  const cb = [-DX, 0, 0], ca = [DX, 0, 0];
  const dirH = phi(-1, 0), dirBr = phi(1, 180);
  // groupes R : de la direction tétraédrique à la direction trigonale plane (dans le plan x, z)
  const plan = (sx, sz) => [sx * 0.5, 0, sz * Math.sqrt(3) / 2];
  const rb = [[phi(-1, 120), plan(-1, 1)], [phi(-1, 240), plan(-1, -1)]].map(([t, p]) => norm(mix(t, p, f)));
  const rc = [[phi(1, 60), plan(1, 1)], [phi(1, 300), plan(1, -1)]].map(([t, p]) => norm(mix(t, p, f)));
  const H = add(cb, dirH, LCH + 0.7 * g);                     // H s'éloigne un peu de Cβ quand la base l'attire
  const base = add(H, [0, 1, 0], 2.8 - 1.8 * g);               // la base arrive d'en haut, du côté de H
  const br = add(ca, dirBr, 1.9 + 1.8 * d);
  const opCH = 1 - seg(u, 0.3, 0.6), opBr = 1 - seg(u, 0.3, 0.6), opBH = seg(u, 0.3, 0.65), opPi = f;
  return { cb, ca, H, base, br, rb: rb.map(v => add(cb, v, LR)), rc: rc.map(v => add(ca, v, LR)), dirsB: rb, dirsC: rc, opCH, opBr, opBH, opPi, f, g, dirH, dirBr };
}
