// Modèle de la simulation 251 « Lancer vers le haut et chute : courbes d'énergie » (TSTL, PCM, partie « Énergie mécanique »).
// Lancer vertical depuis le point de lancement (z = 0). Sans frottement : poids seul. Avec frottement de l'air : force de valeur k·v², opposée au mouvement.
// Objets et valeurs de k inventés pour la simulation (ordres de grandeur réalistes).
export const G = 9.8;
export const OBJETS = [
  { id: 'boule', nom: 'boule métallique', m: 0.50, k: 0.0010 },
  { id: 'tennis', nom: 'balle de tennis', m: 0.058, k: 0.0011 },
  { id: 'mousse', nom: 'ballon en mousse', m: 0.030, k: 0.0040 },
];
export const objet = id => OBJETS.find(o => o.id === id);
export const energies = (m, z, v, zRef = 0) => { const Ec = 0.5 * m * v * v, Epp = m * G * (z - zRef); return { Ec, Epp, Em: Ec + Epp }; };
export const hauteurSansFrott = v0 => v0 * v0 / (2 * G);

// Intégration (RK4) du vol jusqu'au retour à z = 0. Renvoie T (durée), hMax, tMax, vRetour et n+1 points régulièrement répartis dans le temps.
export function vol({ m, k, v0, frott, n = 120, dt = 0.0005 }) {
  const kk = frott ? k / m : 0;
  const acc = v => -G - kk * v * Math.abs(v);
  let t = 0, z = 0, v = v0, hMax = 0, tMax = 0, T = 0, vR = 0;
  const hist = [{ t, z, v }];
  for (let i = 0; i < 4e6; i++) {
    const k1z = v, k1v = acc(v), k2z = v + dt / 2 * k1v, k2v = acc(v + dt / 2 * k1v), k3z = v + dt / 2 * k2v, k3v = acc(v + dt / 2 * k2v), k4z = v + dt * k3v, k4v = acc(v + dt * k3v);
    const zn = z + dt / 6 * (k1z + 2 * k2z + 2 * k3z + k4z), vn = v + dt / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
    if (zn <= 0 && v < 0) { const f = z / (z - zn); T = t + f * dt; vR = v + f * (vn - v); t = T; z = 0; v = vR; hist.push({ t, z, v }); break; }
    t += dt; z = zn; v = vn; hist.push({ t, z, v });
    if (z > hMax) { hMax = z; tMax = t; }
  }
  const pts = []; let j = 0;
  for (let i = 0; i <= n; i++) {
    const ti = T * i / n; while (j < hist.length - 2 && hist[j + 1].t < ti) j++;
    const a = hist[j], b = hist[j + 1], f = b.t === a.t ? 0 : (ti - a.t) / (b.t - a.t);
    pts.push({ t: ti, z: a.z + f * (b.z - a.z), v: a.v + f * (b.v - a.v) });
  }
  return { T, hMax, tMax, vRetour: Math.abs(vR), pts, hist };
}
// Énergie dissipée sur tout le vol = −W(f) = Em au lancement − Em au retour (ΔEm = W(f))
export const energieDissipee = (m, v0, vR) => 0.5 * m * (v0 * v0 - vR * vR);

// Parcours guidé : balle de 0,20 kg lancée à 10 m/s
export const PARCOURS = { m: 0.20, v0: 10, zMi: 2.5, vR: 8.0,
  Ec0: 0.5 * 0.20 * 100, hMax: hauteurSansFrott(10), EcMi: 0.5 * 0.20 * 100 - 0.20 * G * 2.5, Wf: 0.5 * 0.20 * (64 - 100) };

// Défi A : reconnaître Ec, Epp et Em sur trois courbes anonymes
const tire = t => t[Math.floor(Math.random() * t.length)];
const melange = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export function tirageDefiA() {
  const frott = Math.random() < 0.5, o = frott ? tire(OBJETS.filter(x => x.id !== 'boule')) : tire(OBJETS), v0 = tire([10, 12, 15, 20]);
  return { frott, obj: o.id, v0, ordre: melange(['Ec', 'Epp', 'Em']) };           // ordre[i] = grandeur tracée par la courbe i (a, b, c)
}
// Défi B : travail de la force de frottement sur un aller-retour, d'après la vitesse de retour affichée
export function tirageDefiB() {
  for (;;) {
    const o = tire(OBJETS.filter(x => x.id !== 'boule')), v0 = tire([8, 10, 12, 15, 20]), s = vol({ m: o.m, k: o.k, v0, frott: true, n: 4 });
    const vr = Math.round(s.vRetour * 10) / 10;
    if (vr < 0.5 * v0 || vr > 0.92 * v0) continue;
    const mg = Math.round(o.m * 1000), W = 0.5 * (mg / 1000) * (vr * vr - v0 * v0);
    return { obj: o.id, mg, v0, vr, W };
  }
}
