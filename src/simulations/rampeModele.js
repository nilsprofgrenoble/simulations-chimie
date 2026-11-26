// Modèle de la simulation 261 : chute d'une hauteur h le long d'une rampe (TSTL PCM, énergie mécanique).
// Un objet de masse m est lâché sans vitesse en haut d'une rampe de longueur L, de hauteur h ; frottement moyen f (force constante, opposée au mouvement).
export const G = 9.8;
export const energiePot = (m, z) => m * G * z;
export const energieCin = (m, v) => 0.5 * m * v * v;
// vitesse d'arrivée sans frottement : ΔEc = W(P) = m g h
export const vitesseSans = h => Math.sqrt(2 * G * h);
// vitesse d'arrivée avec frottement moyen f sur la longueur L (NaN si l'objet ne glisse pas)
export const vitesseAvec = ({ m, h, L, f }) => { const Ec = m * G * h - f * L; return Ec > 0 ? Math.sqrt(2 * Ec / m) : NaN; };
export const forceFrott = ({ m, h, L, vR }) => (m * G * h - energieCin(m, vR)) / L;
// profil le long de la rampe, abscisse s de 0 à L : altitude, vitesse, énergies
export function profil({ m, h, L, f, n = 60 }) {
  const pts = []; const glisse = m * G * h / L > f;
  for (let i = 0; i <= n; i++) {
    const s = L * i / n, z = h * (1 - s / L), Epp = m * G * z, Ec = glisse ? Math.max(m * G * (h - z) - f * s, 0) : 0;
    pts.push({ s, z, Epp, Ec, Em: Epp + Ec, v: Math.sqrt(2 * Ec / m) });
  }
  return { glisse, pts };
}
export const PARCOURS = { m: 2.0, h: 5.0, L: 10.0, Epp0: 98, vSans: Math.sqrt(2 * G * 5), vR: 8.0, EcR: 64, Wf: -34, f: 3.4, h4: 20, vSans4: Math.sqrt(2 * G * 20) };

const tire = t => t[Math.floor(Math.random() * t.length)];
// Défi A : vitesse d'arrivée sans frottement (masse et longueur de rampe = données inutiles)
export function tirageDefiA() { const h = tire([2, 3, 4, 6, 8, 10, 12]), m = tire([1.5, 2, 3, 5]), L = tire([6, 8, 12, 15]); return { m, h, L, v: vitesseSans(h) }; }
// Défi B : force de frottement moyenne d'après la vitesse d'arrivée mesurée (vR arrondie au dixième)
export function tirageDefiB() {
  for (;;) {
    const m = tire([1.5, 2, 3, 5]), h = tire([2, 3, 4, 5, 6]), L = tire([6, 8, 10, 12]), f0 = tire([0.5, 1, 1.5, 2, 3]);
    const vR = Math.round(10 * vitesseAvec({ m, h, L, f: f0 })) / 10; if (!isFinite(vR)) continue;
    const f = forceFrott({ m, h, L, vR }); if (f > 0.3 && f < 0.9 * m * G * h / L) return { m, h, L, vR, f, vs: vitesseSans(h) };
  }
}
