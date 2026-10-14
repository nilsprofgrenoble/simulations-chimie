// Modèle du rotor d'un moteur pas à pas piloté par un programme (sim 45).
// Rotor = aimant à 2 pôles : oscillateur amorti autour de la direction du champ résultant des bobines alimentées.
// Unités : temps en secondes ; couples en unité du couple maximal d'UNE seule bobine (champ = 1).
export const PHI = [0, 90, 180, 270];                  // bobines 1 (haut), 2 (droite), 3 (bas), 4 (gauche), angle depuis le haut, sens horaire
export const F0 = 100;                                  // fréquence propre du rotor (Hz) : choisie pour que delay(5) fonctionne à vide
export const ZETA = 0.5;                                // amortissement
export const N_PAS = 16;                                // nombre de pas commandés par exécution
const W0 = 2 * Math.PI * F0, DT = 1e-4, TOL = 30;       // pas d'intégration 0,1 ms ; un pas est « suivi » à ±30°

export function champ(c) {
  let bx = 0, by = 0;
  c.forEach((v, i) => { if (v) { const p = PHI[i] * Math.PI / 180; bx += Math.sin(p); by += Math.cos(p); } });
  return { bx, by, B: Math.hypot(bx, by), ang: Math.atan2(bx, by) * 180 / Math.PI };
}
const mod = (a, m) => ((a % m) + m) % m;

// cycle : tableau d'états [b1,b2,b3,b4] répétés ; delaiMs : delay() entre deux pas ; charge : couple résistant (0 à 1)
export function simuler(cycle, delaiMs, charge) {
  const L = cycle.length, N = N_PAS, D = delaiMs / 1000;
  const fp = champ(cycle[L - 1]);
  let incoh = fp.B === 0, Tp = fp.B > 0 ? fp.ang : 0;
  const T0 = Tp, T = [];
  for (let k = 0; k < N; k++) {
    const f = champ(cycle[k % L]);
    if (f.B === 0) { incoh = true; T.push(Tp); continue; }
    let d = mod(f.ang - Tp + 180, 360) - 180;
    if (Math.abs(d) >= 179) { incoh = true; d = 180; }
    Tp += d; T.push(Tp);
  }
  let th = T0 * Math.PI / 180, om = 0, t = 0;
  const pts = [[0, T0]], suivi = [];
  const pas = (c, nsub) => {
    const f = champ(c);
    for (let i = 0; i < nsub; i++) {
      const a = -W0 * W0 * (Math.sin(th) * f.by - Math.cos(th) * f.bx) - 2 * ZETA * W0 * om - W0 * W0 * charge;
      om += a * DT; th += om * DT; t += DT;
      if (i % 5 === 4) pts.push([t, th * 180 / Math.PI]);
    }
  };
  const nsub = Math.max(1, Math.round(D / DT));
  for (let k = 0; k < N; k++) { pas(cycle[k % L], nsub); suivi.push(Math.abs(th * 180 / Math.PI - T[k]) < TOL); }
  pas(cycle[(N - 1) % L], 200);                          // le dernier état reste appliqué 20 ms : le rotor se stabilise
  const thF = th * 180 / Math.PI, ang = incoh ? null : (T[N - 1] - T0);
  const pasAng = ang == null ? null : ang / N;
  const perdus = pasAng ? Math.round((T[N - 1] - thF) / pasAng) : null;
  return { pts, T, T0, D, N, suivi, nSuivis: suivi.filter(Boolean).length, thF, incoh, attendu: ang, perdus,
    dureeProg: N * D, dureeTot: t, ok: !incoh && perdus === 0 && suivi.every(Boolean) };
}

// plus petit délai (ms, par 0,5 ms) à partir duquel plus aucun pas n'est perdu pour tous les délais supérieurs (jusqu'à 30 ms)
export function delaiMin(cycle, charge) {
  let dmin = 30;
  for (let d = 30; d >= 0.5; d -= 0.5) { if (simuler(cycle, d, charge).ok) dmin = d; else break; }
  return dmin;
}
