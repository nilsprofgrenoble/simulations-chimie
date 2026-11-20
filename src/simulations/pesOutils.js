// Constantes et petits outils de la simulation 175 (séparés des composants pour le rafraîchissement à chaud).
import * as M from './pesModele.js';

export const COLP = { v: '#475569', a: '#6d28d9', P: '#b91c1c', traj: '#0369a1', txt: '#0f172a', gris: '#64748b', clair: '#cbd5e1', cible: '#b45309', vert: '#15803d' };

// Trajectoire d'un ballon avec frottement quadratique (estimation, pour la carte « limite du modèle » seulement) : kf = coefficient du frottement divisé par la masse, en 1/m
export function trajetAvecFrottement(v0, alpha, kf, g = 9.8, dt = 0.005) {
  let x = 0, y = 0, vx = v0 * Math.cos(M.rad(alpha)), vy = v0 * Math.sin(M.rad(alpha)); const a = [{ x, y }];
  for (let i = 0; i < 20000 && (y >= 0); i++) { const n = Math.hypot(vx, vy); vx += -kf * n * vx * dt; vy += (-g - kf * n * vy) * dt; x += vx * dt; y += vy * dt; if (i % 10 === 0) a.push({ x, y: Math.max(0, y) }); }
  return a;
}

// ====================================================
//  Géométrie de la scène du projectile (partagée par le dessin et par la légende des vecteurs masqués)
// ====================================================
export const GX0 = 58, GG = 214, GTOP = 40, RB = 6, YSOL = GG + RB;
const GXMAX = 392, MARGE_V = 74;
// géométrie de la scène + vecteurs réellement dessinables (un vecteur dont la flèche ou l'étiquette sortirait du cadre ou traverserait le sol n'est pas tracé)
export function geomScene(p, t, vecs, m, fen) {
  const sh = new Set(vecs);
  // fen = { X, Y } impose la fenêtre (le défi la garde fixe quand l'élève change les réglages) ; sinon elle suit la trajectoire
  const X = fen ? fen.X : Math.max(M.portee(p), 2) * 1.06, Y = fen ? fen.Y : Math.max(M.hauteurMax(p), p.h, 1.5) * 1.1;
  const xmax = sh.has('v') ? GXMAX - MARGE_V : GXMAX;   // marge à droite pour la flèche de vitesse quand la balle arrive loin
  const s = Math.min((xmax - GX0) / X, (GG - GTOP) / Y);
  const px = x => GX0 + x * s, py = y => GG - y * s;
  const T = M.dureeVol(p), tt = t == null ? 0 : Math.min(Math.max(t, 0), T);
  const b = M.pos(p, tt), bx = px(b.x), by = py(Math.max(b.y, 0));
  const v = M.vit(p, tt), nv = M.norme(v);
  const V = Math.max(p.v0, M.vitesseSol(p)), kv = 50 / V, ka = 38 / p.g, kP = 38 / (m * p.g);
  const dirv = nv > 1e-9 ? { x: v.x / nv, y: -v.y / nv } : { x: 1, y: 0 };
  const v0v = { x: M.vx0(p), y: M.vy0(p) }, dir0 = { x: v0v.x / p.v0, y: -v0v.y / p.v0 };
  const S = 17, hw = (i) => (S * 0.62 + (i ? S * 0.5 : 0)) / 2 + 2;
  const def = [['v0', p.v0 * kv, dir0, COLP.v, undefined, 'v', '0'], ['v', nv * kv, dirv, COLP.v, undefined, 'v', undefined],
    ['a', p.g * ka, { x: 0, y: 1 }, COLP.a, '6 4', 'a', undefined], ['P', m * p.g * kP, { x: 0, y: 1 }, COLP.P, undefined, 'P', undefined]];
  const items = def.filter(d => sh.has(d[0])).map(([cle, L, d, c, dash, l, i]) => {
    const x2 = bx + d.x * L, y2 = by + d.y * L, w = hw(i), vertical = Math.abs(d.x) < 1e-6;
    // vecteur vertical : étiquette à droite de la hampe ; sinon : au-delà de la pointe
    const cx = vertical ? bx + 10 + w : x2 + d.x * (9 + w + 2), cy = vertical ? (by + y2) / 2 + 6 : y2 + d.y * (9 + S * 0.55);
    const boite = { g: cx - w, d: cx + w, h: cy - S * 0.95, b: cy + S * 0.5 };
    const ok = Math.max(x2, boite.d) <= 396 && Math.max(y2, boite.b) <= YSOL - 4 && Math.min(y2, boite.h) >= 3 && Math.min(x2, boite.g) >= 42;
    return { cle, L, d, c, dash, l, i, x2, y2, cx, cy, ok };
  });
  return { X, Y, s, px, py, T, tt, bx, by, v, nv, kv, ka, kP, V, items, v0v };
}
// vecteurs non tracés faute de place (près du sol ou du bord) : ils sont signalés sous la figure
export const vecteursMasques = (p, t, vecs, m = 0.5, fen = null) => geomScene(p, t, vecs, m, fen).items.filter(q => !q.ok).map(q => q.cle);
