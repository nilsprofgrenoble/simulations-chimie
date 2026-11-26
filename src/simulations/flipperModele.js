// Modèle de la simulation 263 : flipper (TSTL PCM, énergie mécanique).
// Une bille de masse m est éjectée au pied d'une rampe inclinée de l'angle α avec la vitesse v0 (donnée : l'énergie du ressort n'est pas étudiée).
// La rampe monte à la hauteur h (longueur L = h / sin α). Altitude z = 0 au pied de la rampe. Frottement éventuel : force constante f le long de la rampe.
export const G = 9.8;
const rad = deg => deg * Math.PI / 180;
export const energieCin = (m, v) => 0.5 * m * v * v;
export const hauteurAtteinte = v0 => v0 * v0 / (2 * G);                         // sans frottement : ½ m v0² = m g h
export const vitesseMinSans = h => Math.sqrt(2 * G * h);
export const longueur = (h, deg) => h / Math.sin(rad(deg));
// avec frottement : ½ m v0² = m g h + f L
export const vitesseMinFrott = ({ m, h, deg, f }) => Math.sqrt(2 * G * h + 2 * f * longueur(h, deg) / m);
export const vitesseEnHaut = (v0, h) => { const a = v0 * v0 - 2 * G * h; return a >= 0 ? Math.sqrt(a) : NaN; };
// profil de la montée : s = distance parcourue sur la rampe de 0 à min(sArret, L)
export function profil({ m, h, deg, f, v0, n = 60 }) {
  const L = longueur(h, deg), sinA = Math.sin(rad(deg)), E0 = energieCin(m, v0);
  const sArret = E0 / (m * G * sinA + f), arrive = sArret >= L - 1e-12, smax = arrive ? L : sArret;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const s = smax * i / n, z = s * sinA, Epp = m * G * z, Em = E0 - f * s, Ec = Math.max(Em - Epp, 0);
    pts.push({ s, z, Epp, Ec, Em, v: Math.sqrt(2 * Ec / m) });
  }
  return { pts, L, sArret, arrive, vHaut: arrive ? pts[n].v : NaN, hMax: sArret * sinA };
}
export const PARCOURS = { m: 0.08, v0: 3.0, hVol: hauteurAtteinte(3.0), h: 0.8, deg: 30, vMin: vitesseMinSans(0.8), L: longueur(0.8, 30), v5: vitesseEnHaut(5.0, 0.8), f: 0.05, vMinF: vitesseMinFrott({ m: 0.08, h: 0.8, deg: 30, f: 0.05 }) };

const tire = t => t[Math.floor(Math.random() * t.length)];
// Défi A : vitesse d'éjection minimale sans frottement (m et angle sont des données inutiles)
export function tirageDefiA() { const h = tire([0.4, 0.5, 0.6, 0.8, 1.0, 1.2]); return { m: tire([0.05, 0.08, 0.1, 0.15]), deg: tire([20, 30, 45, 60]), h, v: vitesseMinSans(h) }; }
// Défi B : vitesse d'éjection minimale avec frottement (la longueur L affichée, arrondie au centimètre, sert au corrigé)
export function tirageDefiB() { const x = { m: tire([0.05, 0.08, 0.1, 0.15]), h: tire([0.4, 0.5, 0.6, 0.8, 1.0]), deg: tire([20, 30, 45]), f: tire([0.03, 0.05, 0.08]) }; const L = Number(longueur(x.h, x.deg).toFixed(2)); return { ...x, L, v: Math.sqrt(2 * G * x.h + 2 * x.f * L / x.m), vSans: vitesseMinSans(x.h) }; }
