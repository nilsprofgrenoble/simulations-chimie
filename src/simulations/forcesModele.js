// ====================================================================================================
//  MODÈLE PUR (aucune dépendance React) des simulations 59 (modéliser une action par une force)
//  et 60 (principe d'inertie), niveau 2GT, thème « Mouvement et interactions ».
//
//  Hypothèses de travail (reprises dans l'encadré « Hypothèses » des simulations) :
//   • système = point matériel (la taille de l'objet n'intervient pas) ;
//   • mouvement horizontal étudié dans un référentiel terrestre supposé galiléen ;
//   • g = G·M/R² (≈ 9,8 N/kg sur Terre), on ne distingue pas poids et attraction gravitationnelle (rotation de la Terre négligée) ;
//   • frottement solide : valeur constante f = μ·m·g, opposée au mouvement (pas de frottement fluide) ;
//   • pour animer le mouvement, la simulation 60 utilise un calcul numérique (hors programme de seconde) :
//     on n'écrit jamais de loi « F = m·a » à l'élève, il observe seulement la vitesse.
// ====================================================================================================
export const G = 6.67e-11;
export const ASTRES = [
  { id: 'terre', nom: 'la Terre', Nom: 'Terre', M: 5.98e24, R: 6.378e6 },
  { id: 'lune', nom: 'la Lune', Nom: 'Lune', M: 7.35e22, R: 1.737e6 },
  { id: 'mars', nom: 'Mars', Nom: 'Mars', M: 6.42e23, R: 3.39e6 },
];
export const astre = id => ASTRES.find(a => a.id === id);
export const gravite = (a, h = 0) => G * a.M / ((a.R + h) ** 2);          // N/kg ; h : altitude en m
export const forceGrav = (a, m, h = 0) => m * gravite(a, h);              // N

// ---------- nombres en notation française ----------
export const fr = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '—');
export const sci = (x, d = 2) => { if (!x) return '0'; const e = Math.floor(Math.log10(Math.abs(x))); const m = x / 10 ** e; return `${m.toFixed(d).replace('.', ',')} × 10${String(e).replace(/[0-9-]/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹⁻'['0123456789-'.indexOf(c)])}`; };

// ---------- vecteur force ----------
export const PX_CM = 40;                                   // 1 cm = 40 px à l'écran
export const ECHELLES = [20, 50, 100, 200];               // N pour 1 cm
// F (N), angle (° par rapport à l'horizontale, sens trigonométrique), échelle (N/cm) → composantes écran (y vers le bas)
export function vecteurDe(F, angle, echelle) {
  const L = F / echelle, a = angle * Math.PI / 180;
  return { L, dx: L * PX_CM * Math.cos(a), dy: -L * PX_CM * Math.sin(a) };
}
const norm180 = a => { let x = ((a + 180) % 360 + 360) % 360 - 180; if (x === -180) x = 180; return x; };
export function caracteristiques(dx, dy, echelle) {
  const L = Math.hypot(dx, dy) / PX_CM, F = L * echelle, angle = L === 0 ? 0 : norm180(Math.atan2(-dy, dx) * 180 / Math.PI);
  return { L, F, angle, ...direction(angle, L === 0) };
}
export function direction(angle, nul = false) {
  if (nul) return { direction: '—', sens: '—' };
  const a = norm180(angle), r = Math.round(a);
  if (r === 0) return { direction: 'horizontale', sens: 'vers la droite' };
  if (r === 180) return { direction: 'horizontale', sens: 'vers la gauche' };
  if (r === 90) return { direction: 'verticale', sens: 'vers le haut' };
  if (r === -90) return { direction: 'verticale', sens: 'vers le bas' };
  const h = Math.abs(a) < 90 ? 'vers la droite' : 'vers la gauche', v = a > 0 ? 'vers le haut' : 'vers le bas';
  const ang = Math.abs(a) <= 90 ? Math.abs(a) : 180 - Math.abs(a);
  return { direction: `oblique (${Math.round(ang)}° avec l’horizontale)`, sens: `${v} et ${h}` };
}
// le vecteur tracé par l'élève correspond-il à la consigne ? tolérances : 0,3 cm et 10°
export function conforme(cible, dx, dy, tolL = 0.3, tolAng = 10) {
  const c = caracteristiques(dx, dy, cible.echelle), Lc = cible.F / cible.echelle;
  const dA = Math.abs(norm180(c.angle - cible.angle));
  return { okL: Math.abs(c.L - Lc) <= tolL, okAng: c.L > 0 && dA <= tolAng, c, Lc };
}

// ---------- simulation 1D (caisse sur un sol horizontal) ----------
// m (kg), F : poussée horizontale algébrique (N, + vers la droite), mu : coefficient de frottement (0 = sans frottement),
// v0 (m/s), T (s). Retourne un échantillon toutes les 0,1 s : { t[], x[], v[] }.
export function simuler({ m, F, mu, v0, T = 6, g = 9.8 }) {
  const dt = 0.002, fk = mu * m * g, pas = Math.round(0.1 / dt), t = [0], x = [0], v = [v0];
  let xx = 0, vv = v0;
  for (let i = 1; i <= Math.round(T / dt); i++) {
    let a;
    if (vv === 0 && Math.abs(F) <= fk) a = 0;
    else { const s = vv !== 0 ? Math.sign(vv) : Math.sign(F); a = (F - s * fk) / m; }
    let vn = vv + a * dt;
    if (vv !== 0 && Math.sign(vn) !== Math.sign(vv) && Math.abs(F) <= fk) vn = 0;       // le frottement ne fait pas repartir en arrière
    xx += (vv + vn) / 2 * dt; vv = vn;
    if (i % pas === 0) { t.push(+(i * dt).toFixed(3)); x.push(xx); v.push(vv); }
  }
  return { t, x, v };
}
// forces exercées sur la caisse à un instant donné (vecteurs en N, + vers la droite / vers le haut)
export function forcesSurCaisse({ m, F, mu, v, g = 9.8 }) {
  const P = m * g, fk = mu * P;
  let f = 0;
  if (mu > 0) f = (Math.abs(v) > 1e-6) ? -Math.sign(v) * fk : (Math.abs(F) <= fk ? -F : -Math.sign(F) * fk);
  const liste = [{ id: 'poids', nom: 'Poids', note: 'P', fx: 0, fy: -P }, { id: 'reaction', nom: 'Réaction du sol', note: 'R', fx: 0, fy: P }];
  if (Math.abs(F) > 1e-9) liste.push({ id: 'poussee', nom: 'Poussée', note: 'F', fx: F, fy: 0 });
  if (Math.abs(f) > 1e-9) liste.push({ id: 'frottement', nom: 'Frottement', note: 'f', fx: f, fy: 0 });
  const R = liste.reduce((s, e) => ({ x: s.x + e.fx, y: s.y + e.fy }), { x: 0, y: 0 });
  return { liste, resultante: { x: Math.abs(R.x) < 1e-6 ? 0 : R.x, y: Math.abs(R.y) < 1e-6 ? 0 : R.y } };
}

// ---------- situations pour les défis ----------
export const FORCES_CANDIDATES = [
  ['poids', 'Poids (action de la Terre)'], ['reaction', 'Réaction du support (sol, table)'], ['traction', 'Force motrice ou traction (moteur, câble, main)'],
  ['frottement', 'Frottements (sol, air)'], ['lancer', '« Force du lancer » (reçue de la main)'],
];
// « vrai » : forces réellement exercées sur le système ; la « force du lancer » n'existe plus une fois l'objet lâché
export const BILANS = [
  { id: 'livre', texte: 'Un livre est posé sur une table.', vrai: ['poids', 'reaction'], compensent: true, mvt: 'repos' },
  { id: 'palet', texte: 'Un palet glisse sur une table à coussin d’air (frottements négligés) après avoir été lancé.', vrai: ['poids', 'reaction'], compensent: true, mvt: 'constante' },
  { id: 'caisse', texte: 'Une caisse est tirée à vitesse constante sur le sol (avec frottements).', vrai: ['poids', 'reaction', 'traction', 'frottement'], compensent: true, mvt: 'constante' },
  { id: 'voiture', texte: 'Une voiture roule à vitesse constante en ligne droite sur une route horizontale.', vrai: ['poids', 'reaction', 'traction', 'frottement'], compensent: true, mvt: 'constante' },
  { id: 'glace', texte: 'Un palet de hockey glisse sur la glace après un tir (frottements négligés).', vrai: ['poids', 'reaction'], compensent: true, mvt: 'constante' },
  { id: 'frein', texte: 'Un cycliste freine sur une route horizontale, sans pédaler.', vrai: ['poids', 'reaction', 'frottement'], compensent: false, mvt: 'varie' },
];
export const PREVOIR = [
  { txt: 'Un palet glisse en ligne droite à 0,5 m/s sur une table à coussin d’air.', compensent: true, mvt: 'constante', expl: 'Vitesse constante en ligne droite (mouvement rectiligne uniforme) : les forces se compensent.' },
  { txt: 'Une voiture roule à 90 km/h en ligne droite sur une route horizontale.', compensent: true, mvt: 'constante', expl: 'Mouvement rectiligne uniforme : la force motrice compense les frottements, et le poids compense la réaction de la route.' },
  { txt: 'Une voiture démarre à un feu rouge.', compensent: false, mvt: 'varie', expl: 'La vitesse augmente : les forces ne se compensent pas (la force motrice l’emporte sur les frottements).' },
  { txt: 'Un ascenseur monte à vitesse constante.', compensent: true, mvt: 'constante', expl: 'Vitesse constante en ligne droite : le poids est compensé par la force du câble.' },
  { txt: 'Un parachutiste tombe à sa vitesse limite, constante.', compensent: true, mvt: 'constante', expl: 'À la vitesse limite, les frottements de l’air compensent exactement le poids.' },
  { txt: 'Un cycliste freine.', compensent: false, mvt: 'varie', expl: 'La vitesse diminue : les forces ne se compensent pas (frottements des freins).' },
  { txt: 'Un livre est posé sur une table.', compensent: true, mvt: 'constante', expl: 'Le livre est immobile (vitesse nulle, donc constante) : poids et réaction de la table se compensent.' },
  { txt: 'Une voiture roule à vitesse de valeur constante dans un virage.', compensent: false, mvt: 'varie', expl: 'La valeur est constante mais la direction change : le vecteur vitesse varie, donc les forces ne se compensent pas.' },
  { txt: 'Une bille lâchée tombe de plus en plus vite.', compensent: false, mvt: 'varie', expl: 'La vitesse augmente : le poids n’est pas compensé.' },
];
