// Modèle de la simulation 262 : looping (TSTL PCM, énergie mécanique).
// Un wagon de masse m est lâché sans vitesse d'une hauteur H, descend une pente puis entre dans un looping circulaire de rayon R (origine des altitudes au point le plus bas).
// Condition de contact au sommet ADMISE (démontrée plus tard avec la deuxième loi de Newton) : v_sommet ≥ √(g R).
export const G = 9.8;
export const energieCin = (m, v) => 0.5 * m * v * v;
export const altitude = (R, deg) => R * (1 - Math.cos(deg * Math.PI / 180));     // deg = angle depuis le point le plus bas (0 à 360)
// vitesse sans frottement à l'altitude z : Em conservée
export const vitesseSans = (H, z) => { const a = 2 * G * (H - z); return a > 0 ? Math.sqrt(a) : NaN; };
export const vitesseMin = R => Math.sqrt(G * R);
export const hauteurMin = R => 2.5 * R;                                          // ½ m g R + 2 m g R = m g H
// longueur de la pente d'accès (inclinée de 45°) puis arc de cercle parcouru dans le looping
export const longueurPente = H => H * Math.SQRT2;
export function profil({ m, H, R, f, n = 72 }) {
  const pts = []; let perdu = false;
  for (let i = 0; i <= n; i++) {
    const deg = 360 * i / n, z = altitude(R, deg), s = longueurPente(H) + R * deg * Math.PI / 180;
    const Ec = m * G * (H - z) - f * s, ok = Ec > 0; if (!ok) perdu = true;
    pts.push({ deg, z, s, Ec: Math.max(Ec, 0), v: ok ? Math.sqrt(2 * Ec / m) : 0, Em: m * G * H - f * s });
  }
  const top = pts[n / 2], contact = !perdu && top.v >= vitesseMin(R) - 1e-9;
  return { pts, vTop: top.v, contact, arrive: !perdu };
}
export const PARCOURS = { m: 200, H: 10, R: 3, vBas: Math.sqrt(2 * G * 10), vTop: Math.sqrt(2 * G * 4), vMi: Math.sqrt(2 * G * 7), vMin: Math.sqrt(G * 3), Hmin: 7.5, H2: 6 };

const tire = t => t[Math.floor(Math.random() * t.length)];
// Défi A : vitesse au sommet du looping (la masse est une donnée inutile)
export function tirageDefiA() {
  for (;;) { const R = tire([2, 3, 4, 5]), H = tire([6, 8, 10, 12, 15]), m = tire([150, 200, 300, 500]); if (H > 2.6 * R) return { m, R, H, v: vitesseSans(H, 2 * R) }; }
}
// Défi B : hauteur minimale de départ pour passer le looping (R tiré)
export function tirageDefiB() { const R = tire([2, 3, 4, 5, 6]), m = tire([150, 200, 300, 500]); return { m, R, Hmin: hauteurMin(R), vMin: vitesseMin(R) }; }
