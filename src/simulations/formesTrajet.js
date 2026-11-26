// Les trois situations animées de la simulation 244 : chute d'une bille, bloc qui glisse puis s'arrête, eau chauffée au repos.
// Images à 120 par seconde. Champs : t, Ec, Ep, U (énergie interne gagnée), Tot = Ec + Ep + U, v, z (chute), x (bloc), dT (eau), recu.
export const G = 9.8, FPS = 120, A_FROTT = 2.0, T_CHAUFFE = 5, M_EAU = 0.2, C_EAU = 4180, T0 = 20;
export function trajet({ sit, m, H, v0, Q }) {
  const frames = []; let tFin, Etot0;
  if (sit === 'chute') {
    tFin = Math.sqrt(2 * H / G); Etot0 = m * G * H;
    const n = Math.ceil(tFin * FPS); for (let i = 0; i <= n; i++) { const t = Math.min(i / FPS, tFin), v = G * t, z = Math.max(H - G * t * t / 2, 0), Ec = 0.5 * m * v * v, Ep = m * G * z; frames.push({ t, Ec, Ep, U: 0, Tot: Ec + Ep, v, z, x: 0, dT: 0, recu: 0 }); }
  } else if (sit === 'glisse') {
    tFin = v0 / A_FROTT; Etot0 = 0.5 * m * v0 * v0;
    const n = Math.ceil(tFin * FPS); for (let i = 0; i <= n; i++) { const t = Math.min(i / FPS, tFin), v = Math.max(v0 - A_FROTT * t, 0), x = v0 * t - A_FROTT * t * t / 2, Ec = 0.5 * m * v * v, U = Etot0 - Ec; frames.push({ t, Ec, Ep: 0, U, Tot: Ec + U, v, z: 0, x, dT: 0, recu: 0 }); }
  } else {
    tFin = T_CHAUFFE; Etot0 = Q;
    const n = Math.ceil(tFin * FPS); for (let i = 0; i <= n; i++) { const t = Math.min(i / FPS, tFin), q = Q * t / tFin; frames.push({ t, Ec: 0, Ep: 0, U: q, Tot: q, v: 0, z: 0, x: 0, dT: q / (M_EAU * C_EAU), recu: q }); }
  }
  return { sit, tFin, Etot0, frames, xMax: sit === 'glisse' ? v0 * v0 / (2 * A_FROTT) : 0 };
}
