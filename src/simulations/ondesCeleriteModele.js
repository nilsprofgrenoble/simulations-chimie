// ====================================================
//  MODÈLE — ONDES MÉCANIQUES : CÉLÉRITÉ ET RETARD (sim 150, 1G)
//  Une perturbation (une « bosse » unique) se propage sans se déformer et sans s'amortir dans un milieu où la célérité c est constante.
//  Corde : y(x, t) = A·exp(−((x − c·t)/W)²) pour x ≥ 0 ; la bosse part de la source (x = 0) à t = 0.
//  Distance parcourue d, durée de propagation (retard) Δt, célérité c : c = d / Δt.
//  Les valeurs sont des ordres de grandeur : la célérité du son dépend de la température, de la pression, de la composition du milieu.
// ====================================================
export const A_BOSSE = 0.20;          // hauteur de la bosse (m)
export const W_BOSSE = 0.45;          // demi-largeur de la bosse (m)
export const L_CORDE = 6;             // longueur de corde dessinée (m)

// Célérité du son (ordres de grandeur) dans trois milieux : air à 20 °C, eau, acier (ondes longitudinales)
export const MILIEUX = [
  { id: 'air', nom: 'air', c: 340 },
  { id: 'eau', nom: 'eau', c: 1500 },
  { id: 'acier', nom: 'acier', c: 5900 },
];
export const C_AIR = 340, C_EAU = 1500, C_P = 6000;       // m/s : son dans l'air, son dans l'eau, ondes sismiques P dans la croûte
// Corde du dessin : trois états de la corde (valeurs choisies pour l'animation)
export const CORDES = [
  { id: 'lache', nom: 'corde lâche', c: 2.5 },
  { id: 'moyenne', nom: 'corde moyennement tendue', c: 4 },
  { id: 'tendue', nom: 'corde bien tendue', c: 6 },
];

// ---------- relation fondamentale ----------
export const duree = (d, c) => d / c;              // Δt = d / c
export const celerite = (d, dt) => d / dt;         // c = d / Δt
export const distance = (c, dt) => c * dt;         // d = c × Δt
export const profondeurEcho = (c, dtAllerRetour) => c * dtAllerRetour / 2;    // écho : l'onde fait l'aller-retour

// ---------- corde ----------
export const elongation = (x, t, c) => (x < 0 ? 0 : A_BOSSE * Math.exp(-(((x - c * t) / W_BOSSE) ** 2)));
// vitesse (verticale) du point d'abscisse x : dy/dt. Positive vers le haut. Elle n'a rien à voir avec c.
export const vitessePoint = (x, t, c) => { const u = (x - c * t) / W_BOSSE; return 2 * A_BOSSE * c * u * Math.exp(-u * u) / W_BOSSE; };
export const vitesseMax = c => A_BOSSE * c * Math.sqrt(2) * Math.exp(-0.5) / W_BOSSE;      // maximum de |dy/dt|, atteint en u = ±1/√2
export const instantPassage = (x, c) => x / c;     // instant où le maximum de la bosse passe en x
export const dureeObservation = (x2, c) => { const t = x2 / c + 0.45; return t <= 1.5 ? 1.5 : t <= 2 ? 2 : t <= 3 ? 3 : t <= 4 ? 4 : 6; };

// ---------- carte : séisme et stations ----------
// L'épicentre est en (50 ; 50) km sur une carte de 110 km de côté ; chaque station est repérée par sa distance à l'épicentre (km) et un angle.
export const CARTE = { xmin: -10, xmax: 100, ymin: -10, ymax: 100 };
export const E_DEPART = { x: 50, y: 50 };
export const C_CARTE = 6;                          // km/s : ondes P (ordre de grandeur dans la croûte)
export const STATIONS_DEPART = [
  { id: 'A', R: 60, ang: 140 },   // Δt = 10,0 s
  { id: 'B', R: 42, ang: 15 },    // Δt = 7,0 s
  { id: 'C', R: 54, ang: 260 },   // Δt = 9,0 s
];
export const placer = (E, R, angDeg) => ({ x: E.x + R * Math.cos(angDeg * Math.PI / 180), y: E.y + R * Math.sin(angDeg * Math.PI / 180) });
export const stationsDe = (E, liste) => liste.map(s => ({ id: s.id, ...placer(E, s.R, s.ang) }));
export const dist = (P, Q) => Math.hypot(P.x - Q.x, P.y - Q.y);
// Intersections de deux cercles (centres P, Q ; rayons r, s)
export function intersections(P, r, Q, s) {
  const d = dist(P, Q);
  if (d === 0 || d > r + s || d < Math.abs(r - s)) return [];
  const a = (r * r - s * s + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r * r - a * a));
  const mx = P.x + a * (Q.x - P.x) / d, my = P.y + a * (Q.y - P.y) / d;
  return [{ x: mx + h * (Q.y - P.y) / d, y: my - h * (Q.x - P.x) / d }, { x: mx - h * (Q.y - P.y) / d, y: my + h * (Q.x - P.x) / d }];
}
// Durées d'arrivée (s) aux stations pour un épicentre donné et une célérité c (km/s)
export const durees = (E, stations, c) => stations.map(S => dist(E, S) / c);
// Points candidats : l'épicentre (commun aux trois cercles) et les autres intersections de deux cercles
export function candidats(stations, rayons, E) {
  const [A, B, C] = stations, [rA, rB, rC] = rayons;
  const pts = [...intersections(A, rA, B, rB), ...intersections(A, rA, C, rC), ...intersections(B, rB, C, rC)];
  const autres = pts.filter(p => dist(p, E) > 3);
  const unique = [];
  autres.forEach(p => { if (!unique.some(q => dist(p, q) < 3)) unique.push(p); });
  return { vrai: E, autres: unique };
}
export const dansCarte = p => p.x >= CARTE.xmin + 2 && p.x <= CARTE.xmax - 2 && p.y >= CARTE.ymin + 2 && p.y <= CARTE.ymax - 2;

// ---------- course entre trois milieux (distance commune) ----------
export const dureesCourse = d => MILIEUX.map(m => d / m.c);

// ---------- constantes d'affichage partagées par les scènes et le composant ----------
export const COUL = { c1: '#1d4ed8', c2: '#dc2626', M: '#ea580c', vit: '#15803d', corde: '#64748b', noir: '#0f172a', deb: '#0f766e', fin: '#7e22ce', sol: '#b45309' };
export const X_M = 4.5;      // abscisse (m) du point M repéré sur la corde
export const fr = (x, d = 2) => Number(x).toFixed(d).replace('.', ',');

// ---------- tirages des défis (valeurs cachées) ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
// Défi « corde » : célérité cachée, capteurs à x1 et x2 = x1 + d. Le retard (≥ 0,5 s) reste lisible à ± 0,02 s près sur chaque pic, et le 2e pic arrive avant 1,6 s (axe fixé à 2 s).
export function listeCorde() {
  const c = [];
  [2.5, 3, 4, 5, 6].forEach(cc => [0.5, 1, 1.5, 2].forEach(x1 => [2, 2.5, 3, 3.5, 4].forEach(d => { const x2 = x1 + d, dt = d / cc; if (x2 <= 5.5 && dt >= 0.5 && dt <= 1.2 && x2 / cc <= 1.6) c.push([cc, x1, d]); })));
  return c;
}
export const tirerCorde = () => { const [c, x1, d] = tire(listeCorde()); return { c, x1, x2: x1 + d, d }; };
// Défi « distance » : orage (Δt en s, c = 340 m/s, résultat en km) ou sonar (Δt en s, aller-retour, c = 1 500 m/s, résultat en m)
export function tirerDistance() {
  if (Math.random() < 0.5) { const dt = tire([3, 4, 5, 6, 7, 8, 9, 10, 12]); return { sous: 'orage', dt, vrai: distance(C_AIR, dt) / 1000, unite: 'km' }; }
  const dt = tire([0.04, 0.06, 0.08, 0.1, 0.12, 0.16, 0.2]); return { sous: 'sonar', dt, vrai: profondeurEcho(C_EAU, dt), unite: 'm' };
}
// Défi « localiser » : trois stations placées sur des cercles centrés sur l'épicentre (stations toujours dans la carte)
export function tirerSource() {
  for (let k = 0; k < 600; k++) {
    const c = tire([5, 6, 7]), E = { x: 35 + Math.floor(Math.random() * 31), y: 35 + Math.floor(Math.random() * 31) };
    const dts = [0, 1, 2].map(() => tire([4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9])), R = dts.map(x => c * x);
    const angs = [100 + Math.floor(Math.random() * 70), -30 + Math.floor(Math.random() * 70), 220 + Math.floor(Math.random() * 70)];
    const st = stationsDe(E, R.map((r, i) => ({ id: 'ABC'[i], R: r, ang: angs[i] })));
    if (st.every(dansCarte)) return { c, E, st, dts, R };
  }
  return { c: C_CARTE, E: E_DEPART, st: stationsDe(E_DEPART, STATIONS_DEPART), dts: [10, 7, 9], R: STATIONS_DEPART.map(s => s.R) };
}
