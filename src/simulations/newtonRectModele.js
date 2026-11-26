// Modèle de la simulation 268 « Bilan des forces et lois de Newton sur un mouvement rectiligne » (TSTL, PCM, partie « Interactions »).
// Un chariot (masse m) glisse sur un rail horizontal : poids et réaction se compensent ; sur l'axe du mouvement, une poussée F (N, positive vers la droite)
// et un frottement f constant qui s'oppose au glissement. À l'arrêt, le frottement compense la poussée tant que |F| ≤ f.
// Somme des forces ΣF = F + (force de frottement) ; deuxième loi : ΣF = m a ; ΣF = 0 ⇔ vitesse constante (principe d'inertie).
export const G = 9.8;
export const poids = m => m * G;
export const somme = (F, f) => F - f;                 // poussée vers l'avant, frottement vers l'arrière (cas du mouvement vers la droite)
export const accel = (S, m) => S / m;
export const masse = (S, a) => S / a;
export const frottement = (F, m, a) => F - m * a;     // f = F − m a (mouvement vers l'avant)
export const FPS = 120, T = 6;

// Simulation numérique (pas fin, accélération constante par morceaux) : renvoie les images {t, x, v, a, F, fr, S}.
export function simuler({ F, f, m, v0 = 0, tFin = T, fps = FPS, sous = 8 }) {
  const dt = 1 / fps / sous, n = Math.round(tFin * fps), out = [];
  let x = 0, v = v0;
  const etat = () => {
    if (Math.abs(v) < 1e-12) { // à l'arrêt : le frottement compense la poussée tant que |F| ≤ f
      const fr = Math.abs(F) <= f ? -F : -f * Math.sign(F);
      return { fr, a: (F + fr) / m };
    }
    const fr = -f * Math.sign(v); return { fr, a: (F + fr) / m };
  };
  for (let i = 0; i <= n; i++) {
    const e = etat(); out.push({ t: i / fps, x, v, a: e.a, F, fr: e.fr, S: F + e.fr });
    if (i === n) break;
    for (let k = 0; k < sous; k++) {
      const s = etat(), vn = v + s.a * dt;
      if (v !== 0 && vn * v < 0) { x += (v / 2) * (Math.abs(v) / Math.abs(s.a)); v = 0; continue; } // le frottement arrête le chariot : il ne repart pas en arrière tout seul
      x += (v + vn) / 2 * dt; v = Math.abs(vn) < 1e-12 ? 0 : vn;
    }
  }
  return out;
}
export const MASSES = [1, 2, 4], FROTTEMENTS = [0, 2, 4, 6], VITESSES0 = [0, 3];
export const PARCOURS = { m: 2.0, F: 10, f: 4, S: 6, a: 3.0, m2: 3.0, S2: 12, a2: 4.0, P: 20 };
// Défi 1 : accélération (a en m/s²)
export function tirageDefiAcc(rnd = Math.random) {
  const t = c => c[Math.floor(rnd() * c.length)];
  const m = t([2.0, 2.5, 4.0, 5.0]), f = t([2, 3, 4, 6]), F = f + t([4, 6, 8, 10, 12]);
  return { m, F, f, S: F - f, a: (F - f) / m };
}
// Défi 2 : frottement (f en N) à partir de la poussée, de la masse et de l'accélération mesurée
export function tirageDefiFrott(rnd = Math.random) {
  const t = c => c[Math.floor(rnd() * c.length)];
  const m = t([2.0, 2.5, 4.0, 5.0]), a = t([0.5, 1.0, 1.5, 2.0]), f = t([2, 3, 4, 5]), F = Math.round(f + m * a);
  const aa = (F - f) / m; // l'accélération affichée est celle qui correspond à F arrondie (donnée = corrigé)
  return { m, F, f, a: Number(aa.toFixed(2)), fv: F - m * Number(aa.toFixed(2)) };
}
