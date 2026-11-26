// Modèle de la simulation 265 « Lire une vitesse sur un graphique x(t) » (TSTL, PCM, partie « Mouvements »).
// Mouvements rectilignes imposés x(t) polynomiaux du second degré. Vitesse moyenne = pente de la corde, vitesse instantanée = pente de la tangente = dérivée.
export const COURBES = {
  uniforme: { nom: 'Mouvement uniforme', x: t => 1 + 2 * t, v: () => 2, tmax: 8, xmax: 20, xmin: 0 },
  acceleree: { nom: 'Mouvement qui accélère', x: t => 0.5 * t * t + t, v: t => t + 1, tmax: 8, xmax: 40, xmin: 0 },
  recul: { nom: 'Mouvement de recul', x: t => 12 - 1.5 * t, v: () => -1.5, tmax: 8, xmax: 12, xmin: 0 },
  aller: { nom: 'Aller puis retour', x: t => -t * t + 6 * t, v: t => -2 * t + 6, tmax: 6, xmax: 10, xmin: -2 },
};
export const ORDRE = ['uniforme', 'acceleree', 'recul', 'aller'];
export const vMoy = (c, t1, t2) => (c.x(t2) - c.x(t1)) / (t2 - t1);
export const vInst = (c, t) => c.v(t);
// Tangente en t0 : x = x(t0) + v (t − t0)
export const tangente = (c, t0) => ({ t0, x0: c.x(t0), v: c.v(t0) });
export const PARCOURS = { // parcours guidé : x(t) = 0,50 t² + 1,0 t (x en m, t en s), v(t) = t + 1
  c: COURBES.acceleree, t0: 4, x4: 12, corde: [4, 6], vCorde: 6, vTang: 5, tBas: 2, xBas: 2, tHaut: 6, xHaut: 22, tD: 6, vD: 7,
};
// Défi « lire sur une tangente » : tangente tracée passant par deux points affichés (écart de 4 s) ; v = Δx ÷ Δt
export function tirageDefiTangente(rnd = Math.random) {
  let a, b, t0, v;
  do { a = [0.5, 1, 1.5, -0.5][Math.floor(rnd() * 4)]; b = [1, 2, 3][Math.floor(rnd() * 3)]; t0 = [3, 4, 5][Math.floor(rnd() * 3)]; v = b + a * t0; } while (v === 0);
  const x0 = 0.5 * a * t0 * t0 + b * t0, t1 = t0 - 2, t2 = t0 + 2;
  return { a, b, t0, v, x1: x0 - 2 * v, x2: x0 + 2 * v, t1, t2, x0 };
}
// Défi « corde puis tangente » : x(t) = ½ a t² + b t ; vitesse moyenne entre t0 et t0 + dt, puis vitesse à t0
export function tirageDefiCorde(rnd = Math.random) {
  const a = [1, 2, 3][Math.floor(rnd() * 3)], b = [1, 2, 3][Math.floor(rnd() * 3)], t0 = [2, 3, 4][Math.floor(rnd() * 3)], dt = [1, 2][Math.floor(rnd() * 2)];
  const x = t => 0.5 * a * t * t + b * t;
  return { a, b, t0, dt, vMoy: (x(t0 + dt) - x(t0)) / dt, vInst: b + a * t0, x0: x(t0), x1: x(t0 + dt) };
}
