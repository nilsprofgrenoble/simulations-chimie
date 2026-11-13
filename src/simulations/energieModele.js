// Modèle de la simulation « Énergie mécanique » : bille sur une piste parabolique z = K·x², lâchée sans vitesse.
// Sans frottement : Em = Ec + Epp se conserve. Avec frottement d'intensité constante f (opposé au mouvement) : Em(s) = Em0 − f·s (s = longueur parcourue).
// Référence de l'énergie potentielle : Epp = 0 au point le plus bas de la piste (z = 0).
export const G = 9.8, K = 0.5, N = 800;
export const ecin = (m, v) => 0.5 * m * v * v;
export const epp = (m, z) => m * G * z;
export const profil = x => K * x * x;

// Trajet de x0 (côté droit) vers le côté gauche ; s = abscisse curviligne cumulée. S'arrête quand Ec devient nulle.
export function trajet({ m, x0, f = 0 }) {
  const pts = []; let s = 0, xp = x0;
  const z0 = profil(x0), Em0 = epp(m, z0);
  for (let i = 0; i <= N; i++) {
    const x = x0 - (2 * x0 * i) / N, z = profil(x);
    if (i > 0) s += Math.hypot(x - xp, z - profil(xp));
    xp = x;
    const Em = Em0 - f * s, Ep = epp(m, z), Ec = Em - Ep;
    pts.push({ x, z, s, Em, Epp: Ep, Ec });
  }
  let stop = pts.length - 1;
  for (let i = 1; i < pts.length; i++) if (pts[i].Ec <= 0) { stop = i; break; }
  const cible = pts[stop];
  const bas = pts.findIndex(p => p.x <= 0);
  const atteintBas = bas >= 0 && bas <= stop;
  return { pts: pts.slice(0, stop + 1), z0, Em0, stop, hFinal: cible.z, sFinal: cible.s, bas: atteintBas ? bas : null,
    sBas: pts[bas].s, EcBas: atteintBas ? pts[bas].Ec : null, vBas: atteintBas ? Math.sqrt(2 * pts[bas].Ec / m) : null,
    pertes: f * cible.s, EmFinal: cible.Em };
}
export const hauteurFinale = ({ m, z0, f, s }) => z0 - (f * s) / (m * G);
export const frottementDeduit = ({ m, z0, z1, s }) => (m * G * (z0 - z1)) / s;
