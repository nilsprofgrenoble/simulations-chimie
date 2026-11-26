// Modèle PUR de la vue 3D d'un carbone (aucune dépendance à React ni à three.js) : testé par carbone3dModele.test.mjs.
// La vue 3D tourne la molécule avec une matrice de rotation 3 × 3 (lignes = axes écran x, y, z exprimés dans le repère de la molécule),
// la même convention que `cameraA` / `projeter` de chiraliteModele.js : écran = R · v, avec z > 0 vers l'observateur.
import * as M from './chiraliteModele.js';

// Matrice de la vue « dans l'axe C → 4 » : le groupe n°4 est exactement derrière le carbone, le groupe n°1 est en haut.
export function matriceVueAxe(g, c, aff) {
  const { e1, e2, n } = M.baseVue(g, c, aff);
  return [e1, e2, n];
}

// Lecture de la configuration pour une orientation R donnée.
//  derriere : le groupe n°4 est derrière le carbone (z écran < 0) ; seul cas où le sens lu sur l'écran donne la bonne lettre
//  sens     : sens de rotation APPARENT de 1 → 2 → 3 à l'écran ('horaire' | 'antihoraire')
//  lettre   : lettre lue (R ou S) si le n°4 est derrière ; sinon null (il faudrait inverser)
// Preuve de la règle « n°4 derrière ⇒ sens apparent correct » : le triangle 1-2-3 est perpendiculaire à l'axe C → 4 et change de sens
// apparent exactement quand l'axe C → 4 devient perpendiculaire à la direction de visée, c'est-à-dire quand z4 = 0.
export function lecture(g, c, aff, R) {
  const cl = M.classementCIP(g, c);
  if (!cl.distincts) return null;
  const v = cl.ordre.map(x => M.projeter(R, M.vecteur3D(aff, x.j)));
  const aire = (v[1][0] - v[0][0]) * (v[2][1] - v[0][1]) - (v[2][0] - v[0][0]) * (v[1][1] - v[0][1]);   // > 0 : antihoraire (y vers le haut)
  const sens = aire < 0 ? 'horaire' : 'antihoraire';
  const derriere = v[3][2] < -0.02;
  return { derriere, sens, lettre: derriere ? (sens === 'horaire' ? 'R' : 'S') : null, z4: v[3][2] };
}

// Plus court chemin de rotation d'un sens à l'autre : renvoie l'angle signé (−π, π] de p vers q autour de l'axe u (vecteurs unitaires).
export function angleSigne(u, p, q) {
  const c = M.cross(p, q);
  return Math.atan2(M.dot(u, c), M.dot(p, q));
}

// Points de la flèche courbe 1 → 2 → 3 : arc de cercle autour de l'axe u = −v4 (dirigé vers l'observateur de la vue dans l'axe),
// de rayon r, à la hauteur h le long de u. Renvoie { arcs: [[points], [points]], axe: u } (2 arcs : 1 → 2 puis 2 → 3).
export function fleche123(g, c, aff, { r = 0.95, h = 0.75, pas = 14 } = {}) {
  const cl = M.classementCIP(g, c);
  if (!cl.distincts) return null;
  const v = cl.ordre.map(x => M.vecteur3D(aff, x.j));
  const n = Math.hypot(...v[3]);
  const u = v[3].map(x => -x / n);
  const perp = w => { const p = M.dot(w, u); const q = [w[0] - p * u[0], w[1] - p * u[1], w[2] - p * u[2]]; const l = Math.hypot(...q); return q.map(x => x / l); };
  const P = [perp(v[0]), perp(v[1]), perp(v[2])];
  const arc = (p, q) => {
    const a = angleSigne(u, p, q), t0 = M.cross(u, p);
    const pts = [];
    for (let k = 0; k <= pas; k++) {
      const th = a * k / pas;
      pts.push([0, 1, 2].map(i => r * (Math.cos(th) * p[i] + Math.sin(th) * t0[i]) + h * u[i]));
    }
    return pts;
  };
  return { arcs: [arc(P[0], P[1]), arc(P[1], P[2])], axe: u };
}

// Image dans un miroir (plan x = 0) d'un vecteur du repère de la molécule
export const reflechi = v => [-v[0], v[1], v[2]];
