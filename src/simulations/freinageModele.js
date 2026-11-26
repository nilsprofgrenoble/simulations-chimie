// Modèle de la simulation 260 « Distance de freinage : énergie cinétique et travail de la force de freinage » (TSTL, PCM, partie « Énergie mécanique »).
// Véhicule (point matériel) qui freine jusqu'à l'arrêt sur une route droite : force de freinage constante F, opposée au mouvement ; pente éventuelle (poids).
// Convention : p = sin α, positif quand la route monte dans le sens du mouvement.
export const G = 9.8;
export const kmhEnMs = v => v / 3.6;
export const msEnKmh = v => v * 3.6;
export const energieCin = (m, v) => 0.5 * m * v * v;
// Force résultante qui s'oppose au mouvement : freinage + composante du poids le long de la route (si la route monte, elle freine ; si elle descend, elle pousse)
export const forceOppo = (F, m, p) => F + m * G * p;
export const distanceArret = ({ m, v0, F, p = 0 }) => { const f = forceOppo(F, m, p); return f > 0 ? energieCin(m, v0) / f : Infinity; };
// Courbes en fonction de la distance parcourue x (0 → d) : vitesse, Ec, travail de la force de freinage et du poids depuis le début du freinage
export function profil({ m, v0, F, p = 0, n = 60 }) {
  const d = distanceArret({ m, v0, F, p }), pts = [];
  for (let i = 0; i <= n; i++) { const x = d * i / n, WF = -F * x, WP = -m * G * p * x, Ec = Math.max(energieCin(m, v0) + WF + WP, 0); pts.push({ x, v: Math.sqrt(2 * Ec / m), Ec, WF, WP }); }
  return { d, pts };
}
export const PARCOURS = { m: 1000, vkmh: 72, v0: 20, F: 8000, Ec0: 200000, d: 25, vkmh2: 144, v02: 40, d2: 100, pDesc: -0.05, dDesc: 200000 / (8000 - 1000 * G * 0.05) };

const tire = t => t[Math.floor(Math.random() * t.length)];
// Défi A : distance d'arrêt d'après la masse, la vitesse (km/h) et la force de freinage
export function tirageDefiA() {
  for (;;) {
    const m = tire([800, 1000, 1200, 1500]), vkmh = tire([36, 54, 72, 90, 108]), F = tire([5000, 6000, 8000, 10000]), v0 = kmhEnMs(vkmh), d = distanceArret({ m, v0, F });
    if (d >= 6 && d <= 130) return { m, vkmh, F, d };
  }
}
// Défi B : vitesse maximale (km/h) pour s'arrêter sur une distance D donnée
export function tirageDefiB() {
  for (;;) {
    const m = tire([1000, 1200, 1500]), F = tire([6000, 8000, 10000]), D = tire([20, 30, 40, 50]), vmax = msEnKmh(Math.sqrt(2 * F * D / m));
    if (vmax >= 30 && vmax <= 110) return { m, F, D, vmax, vms: Math.sqrt(2 * F * D / m) };
  }
}
