// ====================================================
//  Modèle de la simulation 177 : satellites et lois de Kepler (TG spé PC, « Mouvement dans un champ de gravitation »).
//  Hypothèses : astre central de symétrie sphérique, de masse M ; satellite de masse m négligeable devant M ; référentiel galiléen centré sur l'astre ;
//  seule la force gravitationnelle de l'astre s'exerce (autres astres, frottements, aplatissement : négligés) ; orbite circulaire de rayon r (distance au centre de l'astre).
//  Unités SI partout (m, s, kg, N) ; les affichages convertissent (km, h, jours).
//  Force : F = G m M / r² (vers le centre). 2e loi de Newton : a = G M / r² (centripète, indépendante de m).
//  Repère de Frenet : a_t = dv/dt = 0 (uniforme) et a_n = v²/r  ⇒  v = √(G M / r) ; T = 2π r / v ; 3e loi : T² / r³ = 4π² / (G M).
//  Orbite elliptique : intégration numérique (RK4) de la loi de Newton, en unités réduites (G M = 1, demi-grand axe a = 1) ; l'aire balayée est calculée
//  à partir des positions intégrées (triangles) : la loi des aires est ainsi TESTÉE, non imposée.
// ====================================================
export const G = 6.67e-11;                                  // N·m²·kg⁻²
export const JOUR = 86400, HEURE = 3600;                    // s

// Astres : masse M (kg), rayon R (m), période de rotation propre Trot (s, jour sidéral) ; valeurs arrondies à 3 chiffres significatifs (ordres de grandeur usuels)
export const ASTRES = {
  terre: { id: 'terre', nom: 'la Terre', Nom: 'Terre', M: 5.97e24, R: 6.37e6, Trot: 86164 },
  mars: { id: 'mars', nom: 'Mars', Nom: 'Mars', M: 6.42e23, R: 3.39e6, Trot: 88642 },
  jupiter: { id: 'jupiter', nom: 'Jupiter', Nom: 'Jupiter', M: 1.90e27, R: 7.15e7, Trot: 35730 },
  soleil: { id: 'soleil', nom: 'le Soleil', Nom: 'Soleil', M: 1.99e30, R: 6.96e8, Trot: null },
};
export const ORDRE_ASTRES = ['terre', 'mars', 'jupiter', 'soleil'];

// ---------- formules ----------
/** Accélération (m/s²) : a = G M / r². */
export const acceleration = (M, r) => G * M / (r * r);
/** Valeur de la vitesse (m/s) sur une orbite circulaire de rayon r : v = √(G M / r). */
export const vitesse = (M, r) => Math.sqrt(G * M / r);
/** Période de révolution (s) : T = 2π r / v. */
export const periode = (M, r) => 2 * Math.PI * r / vitesse(M, r);
/** Constante de la 3e loi (s²/m³) : T² / r³ = 4π² / (G M). */
export const constanteKepler = M => 4 * Math.PI * Math.PI / (G * M);
/** Rapport T² / r³ d'après des données (T en s, r en m). */
export const rapportKepler = (T, r) => T * T / (r * r * r);
/** Masse de l'astre central (kg) d'après r et T : M = 4π² r³ / (G T²). */
export const masseDepuis = (r, T) => 4 * Math.PI * Math.PI * r * r * r / (G * T * T);
/** Rayon d'orbite (m) d'après la période : r = (G M T² / 4π²)^(1/3). */
export const rayonDepuis = (M, T) => Math.cbrt(G * M * T * T / (4 * Math.PI * Math.PI));
/** Orbite stationnaire (T = période de rotation propre de l'astre) : rayon et altitude (m). */
export const orbiteStationnaire = astre => { const r = rayonDepuis(astre.M, astre.Trot); return { r, h: r - astre.R }; };

// ---------- orbites proposées par astre (rayon r = distance au centre, en m) ----------
const km = x => x * 1e3;
const alt = (astre, h) => ({ r: astre.R + km(h) });
export const ORBITES = {
  terre: [
    { id: 'h400', nom: 'Satellite à 400 km d’altitude (type station spatiale)', court: 'altitude 400 km', ...alt(ASTRES.terre, 400) },
    { id: 'h800', nom: 'Satellite à 800 km d’altitude (observation de la Terre)', court: 'altitude 800 km', ...alt(ASTRES.terre, 800) },
    { id: 'h2000', nom: 'Satellite à 2 000 km d’altitude', court: 'altitude 2 000 km', ...alt(ASTRES.terre, 2000) },
    { id: 'h20200', nom: 'Satellite à 20 200 km d’altitude (navigation par satellites)', court: 'altitude 20 200 km', ...alt(ASTRES.terre, 20200) },
    { id: 'geo', nom: 'Satellite géostationnaire (période = jour sidéral)', court: 'géostationnaire', r: orbiteStationnaire(ASTRES.terre).r },
    { id: 'lune', nom: 'La Lune (rayon d’orbite 384 400 km)', court: 'la Lune', r: km(384400) },
  ],
  mars: [
    { id: 'h400', nom: 'Sonde à 400 km d’altitude', court: 'altitude 400 km', ...alt(ASTRES.mars, 400) },
    { id: 'phobos', nom: 'Phobos (rayon d’orbite 9 380 km)', court: 'Phobos', r: km(9380) },
    { id: 'stat', nom: 'Orbite stationnaire de Mars (période = jour sidéral martien)', court: 'orbite stationnaire', r: orbiteStationnaire(ASTRES.mars).r },
    { id: 'deimos', nom: 'Deimos (rayon d’orbite 23 460 km)', court: 'Deimos', r: km(23460) },
  ],
  jupiter: [
    { id: 'io', nom: 'Io (rayon d’orbite 421 800 km)', court: 'Io', r: km(421800) },
    { id: 'europe', nom: 'Europe (rayon d’orbite 671 100 km)', court: 'Europe', r: km(671100) },
    { id: 'ganymede', nom: 'Ganymède (rayon d’orbite 1 070 400 km)', court: 'Ganymède', r: km(1070400) },
    { id: 'callisto', nom: 'Callisto (rayon d’orbite 1 882 700 km)', court: 'Callisto', r: km(1882700) },
  ],
  soleil: [
    { id: 'mercure', nom: 'Mercure (rayon d’orbite 57,9 millions de km)', court: 'Mercure', r: km(57.9e6) },
    { id: 'venus', nom: 'Vénus (rayon d’orbite 108,2 millions de km)', court: 'Vénus', r: km(108.2e6) },
    { id: 'terre', nom: 'la Terre (rayon d’orbite 149,6 millions de km)', court: 'la Terre', r: km(149.6e6) },
    { id: 'mars', nom: 'Mars (rayon d’orbite 227,9 millions de km)', court: 'Mars', r: km(227.9e6) },
    { id: 'jupiter', nom: 'Jupiter (rayon d’orbite 778,6 millions de km)', court: 'Jupiter', r: km(778.6e6) },
  ],
};

// ---------- données astronomiques de l'étape « test de la 3e loi » (valeurs publiées arrondies ; a = demi-grand axe ≈ rayon, orbites presque circulaires) ----------
//  a en km, T en jours (période sidérale)
export const LUNES_JUPITER = [
  { nom: 'Io', a: 421800, T: 1.769 }, { nom: 'Europe', a: 671100, T: 3.551 }, { nom: 'Ganymède', a: 1070400, T: 7.155 }, { nom: 'Callisto', a: 1882700, T: 16.689 },
];
export const PLANETES = [
  { nom: 'Mercure', a: 57.9e6, T: 87.97 }, { nom: 'Vénus', a: 108.2e6, T: 224.70 }, { nom: 'Terre', a: 149.6e6, T: 365.26 },
  { nom: 'Mars', a: 227.9e6, T: 686.98 }, { nom: 'Jupiter', a: 778.6e6, T: 4332.6 },
];

// ---------- orbite elliptique : intégration numérique (RK4) de la loi de Newton, unités réduites ----------
//  G M = 1, a = 1, périhélie en (1 − e ; 0), vitesse au périhélie √((1 + e)/(1 − e)) dirigée vers +y ; période 2π.
const NPAS = 4800;
const cacheEllipse = new Map();
export function ellipse(e) {
  const cle = Math.round(e * 1000);
  if (cacheEllipse.has(cle)) return cacheEllipse.get(cle);
  const dt = 2 * Math.PI / NPAS, X = new Float64Array(NPAS + 1), Y = new Float64Array(NPAS + 1), V = new Float64Array(NPAS + 1);
  let x = 1 - e, y = 0, vx = 0, vy = Math.sqrt((1 + e) / (1 - e));
  const acc = (px, py) => { const r3 = Math.pow(px * px + py * py, 1.5); return [-px / r3, -py / r3]; };
  for (let i = 0; i <= NPAS; i++) {
    X[i] = x; Y[i] = y; V[i] = Math.hypot(vx, vy);
    const [a1x, a1y] = acc(x, y);
    const k2 = acc(x + 0.5 * dt * vx, y + 0.5 * dt * vy), x2 = vx + 0.5 * dt * a1x, y2 = vy + 0.5 * dt * a1y;
    const k3 = acc(x + 0.5 * dt * x2, y + 0.5 * dt * y2), x3 = vx + 0.5 * dt * k2[0], y3 = vy + 0.5 * dt * k2[1];
    const k4 = acc(x + dt * x3, y + dt * y3), x4 = vx + dt * k3[0], y4 = vy + dt * k3[1];
    const nx = x + dt / 6 * (vx + 2 * x2 + 2 * x3 + x4), ny = y + dt / 6 * (vy + 2 * y2 + 2 * y3 + y4);
    const nvx = vx + dt / 6 * (a1x + 2 * k2[0] + 2 * k3[0] + k4[0]), nvy = vy + dt / 6 * (a1y + 2 * k2[1] + 2 * k3[1] + k4[1]);
    x = nx; y = ny; vx = nvx; vy = nvy;
  }
  const res = { e, X, Y, V, N: NPAS, aireTotale: Math.PI * Math.sqrt(1 - e * e) };
  cacheEllipse.set(cle, res);
  return res;
}
/** Position (x, y), distance au foyer et vitesse à la date t = f × T (f dans [0 ; 1[), par interpolation entre les pas de l'intégration. */
export function positionEllipse(e, f) {
  const o = ellipse(e), u = (((f % 1) + 1) % 1) * o.N, i = Math.min(o.N - 1, Math.floor(u)), s = u - i;
  const x = o.X[i] + s * (o.X[i + 1] - o.X[i]), y = o.Y[i] + s * (o.Y[i + 1] - o.Y[i]), v = o.V[i] + s * (o.V[i + 1] - o.V[i]);
  return { x, y, r: Math.hypot(x, y), v };
}
/** Aire balayée par le rayon vecteur (foyer → satellite) entre les dates f1 et f2 (fractions de période, f2 > f1), en fraction de l'aire de l'ellipse. */
export function aireBalayee(e, f1, f2) {
  const o = ellipse(e), n = o.N;
  const i1 = f1 * n, i2 = f2 * n, tri = (xa, ya, xb, yb) => 0.5 * (xa * yb - xb * ya);
  let A = 0, i = Math.floor(i1);
  const pos = u => { const k = Math.min(n - 1, Math.floor(u)), s = u - k; return [o.X[k] + s * (o.X[k + 1] - o.X[k]), o.Y[k] + s * (o.Y[k + 1] - o.Y[k])]; };
  let [xa, ya] = pos(i1);
  for (;;) {
    const suivant = Math.min(i + 1, i2);
    const [xb, yb] = pos(Math.min(suivant, n - 1e-9));
    A += tri(xa, ya, xb, yb);
    if (suivant >= i2) break;
    xa = xb; ya = yb; i++;
  }
  return A / o.aireTotale;
}
/** Rapport des vitesses au périhélie et à l'aphélie : (1 + e)/(1 − e). */
export const rapportVitesses = e => (1 + e) / (1 - e);

// ---------- affichage ----------
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const NB = ' ';
/** Nombre en notation scientifique à cs chiffres significatifs : « 3,98×10¹⁴ ». */
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const sci = (x, cs = 3) => { const [m, ex] = Number(x).toExponential(cs - 1).split('e'); return `${m.replace('.', ',')}${NB}×${NB}10${String(Number(ex)).split('').map(c => SUP[c]).join('')}`; };
/** Entier avec espaces insécables de milliers (35 800). */
export const entier = x => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, NB);
/** Durée lisible : minutes jusqu'à 3 h, heures jusqu'à 3 jours, jours jusqu'à 2 ans, ans au-delà. */
export function duree(s) {
  if (s < 3 * HEURE) return `${nbf(s / 60, s < 600 ? 1 : 0)}${NB}min`;
  if (s < 3 * JOUR) return `${nbf(s / HEURE, s < 10 * HEURE ? 2 : 1)}${NB}h`;
  if (s < 730 * JOUR) return `${nbf(s / JOUR, s < 30 * JOUR ? 2 : 0)}${NB}jours`;
  return `${nbf(s / (365.25 * JOUR), 1)}${NB}ans`;
}

// ---------- défis (valeurs tirées au hasard ; données affichées arrondies AVANT de calculer la réponse attendue) ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const r2 = x => Number(x.toPrecision(2));
export const TOL_KEP3 = 0.06, TOL_STAT_H = 0.06, TOL_STAT_V = 0.08;
// familles d'orbites : astre, grandeur donnée pour décrire l'orbite (altitude en km, ou rayon en 10³ km / 10⁶ km), valeurs possibles, facteur vers le mètre, unité de masse demandée (10^k kg)
const FAMILLES_KEP = [
  { cle: 'terre', mode: 'h', vals: [500, 800, 1200, 2000, 5000, 10000, 20000, 36000], f: 1e3, kM: 24, unite: 'km', sujet: 'un satellite artificiel' },
  { cle: 'mars', mode: 'h', vals: [300, 600, 1000, 3000, 8000, 15000], f: 1e3, kM: 23, unite: 'km', sujet: 'une sonde' },
  { cle: 'jupiter', mode: 'r', vals: [420, 670, 1100, 1900], f: 1e6, kM: 27, unite: '10³ km', sujet: 'un satellite naturel' },
  { cle: 'soleil', mode: 'r', vals: [58, 108, 150, 228, 780], f: 1e9, kM: 30, unite: '10⁶ km', sujet: 'une planète' },
];
/** Unité de durée adaptée : minutes si T < 4 h, heures si T < 150 h, jours sinon. */
export const uniteDuree = s => (s < 4 * HEURE ? { nom: 'min', s: 60 } : s < 150 * HEURE ? { nom: 'h', s: HEURE } : { nom: 'jours', s: JOUR });
/** Défi 1 : retrouver la période, le rayon (ou l'altitude) ou la masse de l'astre ; cherche = 'T' | 'r' | 'M'. */
export function tirageKepler3(cherche = tire(['T', 'r', 'M'])) {
  const fam = tire(FAMILLES_KEP), astre = ASTRES[fam.cle], val = tire(fam.vals);
  const rAff = fam.mode === 'h' ? astre.R + val * fam.f : val * fam.f;          // m (R est donné à l'élève pour la Terre et Mars)
  const Treel = periode(astre.M, rAff), u = uniteDuree(Treel), Taff = Treel / u.s >= 100 ? Number((Treel / u.s).toPrecision(3)) : r2(Treel / u.s);       // T affichée à 2 chiffres significatifs (3 si elle dépasse 100 : 365 jours, pas 370), dans son unité
  const base = { cherche, fam: fam.cle, mode: fam.mode, val, unite: fam.unite, uT: u.nom, Taff, rAff, M: astre.M, R: astre.R, kM: fam.kM, sujet: fam.sujet };
  if (cherche === 'T') return { ...base, vrai: Treel / u.s, uRep: u.nom };
  if (cherche === 'r') { const r = rayonDepuis(astre.M, Taff * u.s); return { ...base, vrai: fam.mode === 'h' ? (r - astre.R) / 1e3 : r / fam.f, uRep: fam.mode === 'h' ? 'km' : fam.unite }; }
  return { ...base, vrai: masseDepuis(rAff, Taff * u.s) / Math.pow(10, fam.kM), uRep: `10${SUP[Math.floor(fam.kM / 10)]}${SUP[fam.kM % 10]} kg` };
}
/** Défi 2 : orbite stationnaire (période de révolution = période de rotation propre) autour de Mars ou de Jupiter : altitude (km) et vitesse (km/s). */
export function tirageStationnaire() {
  const astre = tire([ASTRES.mars, ASTRES.jupiter]), st = orbiteStationnaire(astre);
  return { astre: astre.id, M: astre.M, R: astre.R, Trot: astre.Trot, h: st.h / 1e3, v: 2 * Math.PI * st.r / astre.Trot / 1e3 };
}
