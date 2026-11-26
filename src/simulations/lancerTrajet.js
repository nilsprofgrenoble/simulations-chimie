// Vol animé de la simulation 251 : lancer vertical depuis une plate-forme, avec ou sans frottement de l'air (k·v²).
// Les images sont échantillonnées à 120 par seconde à partir de l'intégration RK4 de lancerChuteModele.js.
import { G, objet, vol, hauteurSansFrott } from "./lancerChuteModele.js";
export { G };
export const FPS = 120;
// off : hauteur (m) de l'origine des altitudes sous le point de lancement (0 = origine au lancement, 3 = origine au sol).
export function trajet({ obj, v0, frott, off = 0 }) {
  const o = objet(obj), s = vol({ m: o.m, k: o.k, v0, frott, n: 4 }), h = s.hist, T = s.T;
  const e = (z, v) => { const Ec = 0.5 * o.m * v * v, Epp = o.m * G * (z + off); return { Ec, Epp, Em: Ec + Epp }; };
  const Em0 = e(0, v0).Em, frames = [], n = Math.max(Math.ceil(T * FPS), 1);
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const t = Math.min(i / FPS, T);
    while (j < h.length - 2 && h[j + 1].t < t) j++;
    const a = h[j], b = h[j + 1], f = b.t === a.t ? 0 : Math.min(Math.max((t - a.t) / (b.t - a.t), 0), 1);
    const z = Math.max(a.z + f * (b.z - a.z), 0), v = a.v + f * (b.v - a.v), q = e(z, v);
    frames.push({ t, z, v, ...q, diss: Em0 - q.Em, f: frott ? o.k * v * v : 0, ph: 'V' });
  }
  return { o, T, tFin: T, hMax: s.hMax, tMax: s.tMax, vRetour: s.vRetour, Em0, Ec0: 0.5 * o.m * v0 * v0, hSans: hauteurSansFrott(v0), off, frames };
}
