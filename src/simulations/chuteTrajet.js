// Trajet animé de la chute le long d'une rampe (exploration de la simulation 261).
// Un objet de masse m est lâché sans vitesse en haut d'une rampe de hauteur h et de pente sin α = s (longueur L = h / s).
// Il glisse avec un frottement constant f (force opposée au mouvement) puis continue sur le sol horizontal, avec le même frottement.
export const G = 9.8;
export const FPS = 120;
export const plat = run => 4 + 0.2 * run;            // longueur de sol visible après la rampe (m)

export function trajet({ m, h, s, f }) {
  const L = h / s, cs = Math.sqrt(1 - s * s), run = L * cs, a = G * s - f / m, Em0 = m * G * h, xEnd = run + plat(run), dt = 1 / FPS;
  const frames = [];
  const push = (t, x, z, v, ph, sp) => { const Ec = 0.5 * m * v * v, Epp = m * G * z; frames.push({ t, x, z, v, Ec, Epp, Em: Ec + Epp, ph, s: sp, diss: Em0 - (Ec + Epp) }); };
  const res = { L, run, Em0, xEnd, issue: 'immobile', vBas: NaN, tBas: NaN, dissBas: NaN, xArret: NaN };
  if (a <= 1e-9) { push(0, 0, h, 0, 'R', 0); res.frames = frames; res.tFin = 0; return res; }
  const tR = Math.sqrt(2 * L / a), vBas = a * tR;
  for (let t = 0; t < tR; t += dt) { const sp = 0.5 * a * t * t; push(t, sp * cs, h - sp * s, a * t, 'R', sp); }
  push(tR, run, 0, vBas, 'P', L);
  res.vBas = vBas; res.tBas = tR; res.dissBas = Em0 - 0.5 * m * vBas * vBas;
  const d = f / m, dist = d > 0 ? vBas * vBas / (2 * d) : Infinity;
  res.issue = run + dist > xEnd ? 'sort' : 'arret';
  const tStop = d > 0 ? vBas / d : Infinity;
  for (let t = dt; ; t += dt) {
    const tt = Math.min(t, tStop), x = run + vBas * tt - 0.5 * d * tt * tt, v = Math.max(vBas - d * tt, 0);
    if (x >= xEnd) { push(tR + t, xEnd, 0, v, 'P', L + xEnd - run); break; }
    push(tR + t, x, 0, v, 'P', L + x - run);
    if (tt >= tStop) { res.xArret = x; break; }
    if (t > 30) break;
  }
  res.frames = frames; res.tFin = frames[frames.length - 1].t;
  return res;
}
export const imageA = (tr, t) => tr.frames[Math.max(0, Math.min(tr.frames.length - 1, Math.round(t * FPS)))];
