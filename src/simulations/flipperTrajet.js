// Trajet complet de la bille du flipper (exploration animée de la simulation 263).
// Phases : élan à plat (vitesse constante) → montée sur la rampe (décélération g sinα + f/m) →
//   a) elle atteint le haut : vol libre (chute parabolique) jusqu'au sol ;
//   b) elle s'arrête avant le haut : elle redescend (si le frottement ne la retient pas) puis revient au pied.
// Altitude z = 0 au pied de la rampe. Positions en mètres dans un repère horizontal (x) / vertical (z).
// Les images sont échantillonnées à FPS images par seconde : l'animation lit simplement l'image du temps t.
export const G = 9.8;
export const FPS = 120;
export const X_LANCEUR = 0.6;     // point où la bille quitte le ressort (m)
export const X_PIED = 1.2;        // pied de la rampe (m)
export const D_MAX = 0.36;        // recul maximal de la bille contre le ressort (m), pour v0 = V_MAX
export const V_MAX = 8;           // vitesse d'éjection maximale (m/s)
export const recul = v0 => D_MAX * v0 / V_MAX;   // plus on tire en arrière, plus la vitesse est grande
export const X_MAX = 5.5;         // limite de la scène (m)
const rad = d => d * Math.PI / 180;

export function trajet({ m, h, deg, f, v0 }) {
  const a = rad(deg), sn = Math.sin(a), cs = Math.cos(a), L = h / sn;
  const aUp = G * sn + f / m, aDn = G * sn - f / m;
  const frames = [];
  const push = (t, x, z, vx, vz, ph, s = 0) => {
    const v = Math.hypot(vx, vz), Ec = 0.5 * m * v * v, Epp = m * G * z;
    frames.push({ t, x, z, vx, vz, v, Ec, Epp, Em: Ec + Epp, ph, s });
  };
  const E0 = 0.5 * m * v0 * v0;
  const res = { E0, L, issue: 'immobile', tTop: NaN, vTop: NaN, sMax: 0, hMax: 0, xLand: NaN, tFin: 0, bloquee: false };
  if (v0 <= 1e-9) { push(0, X_LANCEUR, 0, 0, 0, 'R'); res.frames = frames; return res; }
  const dt = 1 / FPS, d = recul(v0), tR = 2 * d / v0, aR = v0 / tR;   // le ressort accélère la bille sur la distance d
  for (let t = 0; t < tR; t += dt) push(t, X_LANCEUR - d + 0.5 * aR * t * t, 0, aR * t, 0, 'R');
  const tA = (X_PIED - X_LANCEUR) / v0;                       // élan à plat
  for (let t = 0; t <= tA; t += dt) push(tR + t, X_LANCEUR + v0 * t, 0, v0, 0, 'A');
  let t0 = tR + tA;
  const arrive = v0 * v0 >= 2 * aUp * L - 1e-12;
  const tB = arrive ? (v0 - Math.sqrt(Math.max(v0 * v0 - 2 * aUp * L, 0))) / aUp : v0 / aUp;
  const sStop = arrive ? L : v0 * v0 / (2 * aUp);
  for (let t = 0; t <= tB; t += dt) {
    const s = v0 * t - 0.5 * aUp * t * t, v = v0 - aUp * t;
    push(t0 + t, X_PIED + s * cs, s * sn, v * cs, v * sn, 'B', s);
  }
  t0 += tB;
  res.sMax = sStop; res.hMax = sStop * sn;
  if (arrive) {
    const vTop = Math.sqrt(Math.max(v0 * v0 - 2 * aUp * L, 0)), xT = X_PIED + L * cs, vx = vTop * cs, vz = vTop * sn;
    res.issue = 'sommet'; res.tTop = t0; res.vTop = vTop;
    const tV = (vz + Math.sqrt(vz * vz + 2 * G * h)) / G;       // vol jusqu'au sol (z = 0)
    for (let t = dt; t <= tV + dt; t += dt) {
      const tt = Math.min(t, tV), x = xT + vx * tt, z = Math.max(h + vz * tt - 0.5 * G * tt * tt, 0);
      push(t0 + t, x, z, vx, vz - G * tt, 'D', L);
      if (x > X_MAX) break;
      if (tt >= tV) break;
    }
    const last = frames[frames.length - 1]; res.xLand = last.x;
  } else if (aDn > 1e-9) {
    res.issue = 'redescend';
    const tR = Math.sqrt(2 * sStop / aDn);
    for (let t = dt; t <= tR + dt; t += dt) {
      const tt = Math.min(t, tR), s = sStop - 0.5 * aDn * tt * tt, v = aDn * tt;
      push(t0 + t, X_PIED + s * cs, s * sn, -v * cs, -v * sn, 'C', s);
    }
    t0 += tR; const vF = aDn * tR;
    const tE = (X_PIED - X_LANCEUR) / vF;                       // retour à plat vers le ressort
    for (let t = dt; t <= tE + dt; t += dt) push(t0 + t, X_PIED - vF * Math.min(t, tE), 0, -vF, 0, 'E');
  } else { res.issue = 'bloquee'; res.bloquee = true; push(t0 + 0.4, X_PIED + sStop * cs, sStop * sn, 0, 0, 'B', sStop); }
  res.frames = frames; res.tFin = frames[frames.length - 1].t;
  return res;
}
export const imageA = (tr, t) => tr.frames[Math.max(0, Math.min(tr.frames.length - 1, Math.round(t * FPS)))];
