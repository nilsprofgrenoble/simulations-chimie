// Parcours animé de la simulation 250 : un chariot est déplacé le long du rail de A à E à vitesse modérée constante ;
// on compte, image par image, le travail du poids et celui de la réaction du rail (frottement éventuel).
import { PTS, pt, chemin, pente, travailPoids, travailFrottement, F_FROTT, G } from "./poidsTrajetModele.js";
export { PTS, F_FROTT, G };
export const FPS = 120, VITESSE = 0.8;     // m de rail par seconde
export function trajet({ m, dep, arr, frott }) {
  const A = pt(dep), ok = dep !== arr;
  if (!ok) return { ok, tFin: 0, L: 0, frames: [{ t: 0, x: A.x, z: A.z, s: 0, th: Math.atan(pente(A.x)), Wp: 0, Wr: 0, Wt: 0, sens: 1 }], Wmax: 1 };
  const c = chemin(dep, arr, 600), L = c[c.length - 1].s, tFin = L / VITESSE, n = Math.max(Math.ceil(tFin * FPS), 1), sens = Math.sign(pt(arr).x - A.x), frames = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const t = Math.min(i / FPS, tFin), s = t * VITESSE;
    while (j < c.length - 2 && c[j + 1].s < s) j++;
    const a = c[j], b = c[j + 1], f = b.s === a.s ? 0 : Math.min(Math.max((s - a.s) / (b.s - a.s), 0), 1);
    const x = a.x + f * (b.x - a.x), z = a.z + f * (b.z - a.z), Wp = travailPoids(m, A.z, z), Wr = frott ? travailFrottement(F_FROTT, s) : 0;
    frames.push({ t, x, z, s, th: Math.atan(pente(x)), Wp, Wr, Wt: Wp + Wr, sens });
  }
  const Wmax = Math.max(1, ...frames.map(q => Math.max(Math.abs(q.Wp), Math.abs(q.Wr), Math.abs(q.Wt)))) * 1.08;
  return { ok, tFin, L, frames, Wmax };
}
