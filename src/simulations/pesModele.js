// ====================================================
//  Modèle de la simulation 175 : mouvement dans un champ de pesanteur uniforme (TG spé PC).
//  Projectile modélisé par son centre de masse ; poids seul (frottements de l'air négligés) ; g uniforme ; référentiel terrestre supposé galiléen.
//  Axes : Ox horizontal vers la droite, Oy vertical vers le haut, origine au point de lancer projeté sur le sol (le sol est y = 0) ; le point de lancer est (0 ; h).
//  Équations horaires : x(t) = v0 cos α · t ; y(t) = −g t²/2 + v0 sin α · t + h ; vx = v0 cos α ; vy = −g t + v0 sin α ; ax = 0 ; ay = −g.
// ====================================================

export const CORPS = {
  terre: { nom: 'la Terre', g: 9.8 },
  lune: { nom: 'la Lune', g: 1.6 },
  mars: { nom: 'Mars', g: 3.7 },
};
export const G_TERRE = 9.8;
export const rad = d => d * Math.PI / 180;
export const sig = (x, k) => Number(Number(x).toPrecision(k));

// p = { v0, alpha (degrés), h (m), g (m/s²) }
export const vx0 = p => p.v0 * Math.cos(rad(p.alpha));
export const vy0 = p => p.v0 * Math.sin(rad(p.alpha));
export const pos = (p, t) => ({ x: vx0(p) * t, y: -p.g * t * t / 2 + vy0(p) * t + p.h });
export const vit = (p, t) => ({ x: vx0(p), y: -p.g * t + vy0(p) });
export const acc = p => ({ x: 0, y: -p.g });
export const norme = v => Math.hypot(v.x, v.y);
// trajectoire y(x) : on élimine t entre les deux équations horaires (valable pour cos α ≠ 0)
export const yDeX = (p, x) => -p.g * x * x / (2 * p.v0 * p.v0 * Math.cos(rad(p.alpha)) ** 2) + Math.tan(rad(p.alpha)) * x + p.h;
// sommet (flèche) : vy = 0
export const tSommet = p => Math.max(0, vy0(p) / p.g);
export const hauteurMax = p => pos(p, tSommet(p)).y;
// durée du vol jusqu'au sol (y = 0) : racine positive de −g t²/2 + vy0 t + h = 0
export const dureeVol = p => (vy0(p) + Math.sqrt(vy0(p) ** 2 + 2 * p.g * p.h)) / p.g;
export const portee = p => vx0(p) * dureeVol(p);
// théorème de l'énergie cinétique entre le lancer et le sol : ½ m v² − ½ m v0² = m g h
export const vitesseSol = p => Math.sqrt(p.v0 * p.v0 + 2 * p.g * p.h);
// énergies (masse m en kg, Epp = m g y, Epp = 0 au sol)
export const energies = (p, m, t) => { const v = norme(vit(p, t)), y = pos(p, t).y; const Ec = m * v * v / 2, Epp = m * p.g * y; return { Ec, Epp, Em: Ec + Epp }; };
// points de la trajectoire jusqu'au sol (pour le dessin)
export function trace(p, n = 120) {
  const T = dureeVol(p), pts = [];
  for (let k = 0; k <= n; k++) { const t = T * k / n, q = pos(p, t); pts.push({ t, x: q.x, y: Math.max(0, q.y) }); }
  return pts;
}

// ---------- défis ----------
const tire = (t, rnd) => t[Math.floor(rnd() * t.length)];
const V0_CORPS = { terre: [8, 9, 10, 11, 12, 13, 14, 15, 16], lune: [5, 6, 7, 8], mars: [6, 7, 8, 9, 10, 12] };
const V0_CORPS_LECTURE = { terre: [10, 12, 14, 15, 16, 18, 20], lune: [5, 6, 7, 8], mars: [8, 10, 12, 14] };
// Défi 1 : toucher une cible. Les réglages (v0 par pas de 0,5 m/s, α par pas de 1°) sont ceux des boutons − / +. Départ au sol (h = 0) : le lancer est à l'origine.
export const PAS_V0 = 0.5, PAS_ALPHA = 1, RAYON_CIBLE = 0.6, V0_MIN = 5, V0_MAX = 25;
export function tirageDefiCible(rnd = Math.random) {
  for (let essai = 0; essai < 500; essai++) {
    const corps = tire(['terre', 'terre', 'lune', 'mars'], rnd), g = CORPS[corps].g;
    const v0 = tire(V0_CORPS[corps], rnd), alpha = tire([25, 30, 35, 40, 45, 50, 55, 60], rnd);
    const vrai = { v0: v0, alpha, h: 0, g };
    const T = dureeVol(vrai), tc = T * tire([0.55, 0.65, 0.75, 0.85], rnd), q = pos(vrai, tc);
    const cible = { x: Number(q.x.toFixed(1)), y: Number(q.y.toFixed(1)) };
    if (cible.y < 1.0 || cible.x < 4) continue;
    return { corps, g, cible, vrai };
  }
  throw new Error('tirage défi cible impossible');
}
// distance minimale entre la trajectoire et la cible (tir jusqu'au sol)
export function distanceCible(p, cible) {
  let d = Infinity;
  const T = dureeVol(p), n = 600;
  for (let k = 0; k <= n; k++) { const q = pos(p, T * k / n); d = Math.min(d, Math.hypot(q.x - cible.x, q.y - cible.y)); }
  return d;
}
export const touche = (p, cible) => distanceCible(p, cible) <= RAYON_CIBLE;
// Défi 2 : retrouver v0 à partir de la portée P et de la flèche H d'un tir depuis le sol (h = 0).
//   H = v0² sin²α / (2g) ; P = v0² sin 2α / g  ⇒  tan α = 4H / P ; v0 = √(P g / sin 2α)
export function tirageDefiLecture(rnd = Math.random) {
  const corps = tire(['terre', 'terre', 'lune', 'mars'], rnd), g = CORPS[corps].g;
  const v0 = tire(V0_CORPS_LECTURE[corps], rnd), alpha = tire([25, 30, 35, 40, 50, 55, 60], rnd);
  const p = { v0, alpha, h: 0, g };
  const P = sig(portee(p), 3), H = sig(hauteurMax(p), 3);
  return { corps, g, P, H, vrai: v0DeLecture(P, H, g), v0, alpha };
}
export const alphaDeLecture = (P, H) => Math.atan(4 * H / P) * 180 / Math.PI;
export const v0DeLecture = (P, H, g) => Math.sqrt(P * g / Math.sin(2 * Math.atan(4 * H / P)));
// Pire écart relatif d'un élève qui garde au moins 3 chiffres significatifs en intermédiaire (consigne de l'indice) avec g donné, puis arrondit le résultat à 2 chiffres
export function pireEcartLecture(d) {
  let pire = 0;
  for (const k of [3, 4]) {
    const tanA = sig(4 * d.H / d.P, k), a = Math.atan(tanA), s2 = sig(Math.sin(2 * a), k), v = Math.sqrt(sig(d.P * d.g, k) / s2);
    pire = Math.max(pire, Math.abs(v - d.vrai) / d.vrai);
  }
  return Math.max(pire, Math.abs(sig(d.vrai, 2) - d.vrai) / d.vrai);
}
