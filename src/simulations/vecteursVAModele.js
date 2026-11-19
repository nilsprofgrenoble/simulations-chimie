// ====================================================
//  Modèle de la simulation 166 : vecteurs position, vitesse et accélération (TG spé PC, « Décrire un mouvement »).
//  Du vecteur position OM(t) au vecteur vitesse (dérivée) puis au vecteur accélération (dérivée du vecteur vitesse), en coordonnées cartésiennes.
//  Chronophotographie : points M_i aux dates t_i = i × τ (pointage idéal, sans incertitude).
//  Estimations (annoncées dans le panneau d'hypothèses) :
//    vecteur vitesse   v_i ≈ (OM_{i+1} − OM_{i−1}) / (2τ)      (défini pour 1 ≤ i ≤ N−1)
//    vecteur accélération a_i ≈ (v_{i+1} − v_{i−1}) / (2τ)      (défini pour 2 ≤ i ≤ N−2)
//  Pour un mouvement dont les coordonnées sont des polynômes du second degré en t, ces deux estimations sont EXACTES ;
//  pour un autre mouvement (oscillation), elles sont approchées et l'écart augmente avec τ.
// ====================================================

// Chaque mouvement donne les fonctions exactes x(t), y(t), v(t), a(t) (dérivées calculées à la main), la mise en page de la scène et le pas τ.
export const MOUVEMENTS = {
  acc: { id: 'acc', nom: 'Voiture qui démarre', court: 'Mouvement rectiligne qui accélère', dim: 2, layout: 'ligne', N: 8, tau: 1.0, taus: [0.5, 1.0, 2.0], unite: 'm',
    x: t => 2 * t + 0.5 * t * t, y: () => 0, vx: t => 2 + t, vy: () => 0, ax: () => 1, ay: () => 0,
    formule: 'x(t) = 2,0 t + 0,50 t²', note: 'Le point est lancé à 2,0 m/s et sa vitesse augmente.' },
  frein: { id: 'frein', nom: 'Voiture qui freine', court: 'Mouvement rectiligne qui ralentit', dim: 2, layout: 'ligne', N: 7, tau: 1.0, taus: [0.5, 1.0], unite: 'm',
    x: t => 9 * t - 0.5 * t * t, y: () => 0, vx: t => 9 - t, vy: () => 0, ax: () => -1, ay: () => 0,
    formule: 'x(t) = 9,0 t − 0,50 t²', note: 'Le point va vers les x croissants (vx > 0) mais sa vitesse diminue.' },
  retour: { id: 'retour', nom: 'Palet sur un plan incliné glissant', court: 'Aller-retour : monte, s’arrête, redescend', dim: 2, layout: 'etage', N: 8, tau: 1.0, taus: [0.5, 1.0], unite: 'm',
    x: t => 6 * t - t * t, y: () => 0, vx: t => 6 - 2 * t, vy: () => 0, ax: () => -2, ay: () => 0,
    formule: 'x(t) = 6,0 t − 1,0 t²', note: 'Axe Ox le long du plan, vers le haut. Les points sont décalés vers le bas au fil du temps pour ne pas se superposer : le mouvement est bien rectiligne.' },
  unif: { id: 'unif', nom: 'Chariot à vitesse constante', court: 'Mouvement rectiligne uniforme', dim: 2, layout: 'ligne', N: 8, tau: 1.0, taus: [0.5, 1.0, 2.0], unite: 'm',
    x: t => 3 + 5 * t, y: () => 0, vx: () => 5, vy: () => 0, ax: () => 0, ay: () => 0,
    formule: 'x(t) = 3,0 + 5,0 t', note: 'Les points sont équidistants : la vitesse est constante.' },
  parabole: { id: 'parabole', nom: 'Balle lancée (exemple de coordonnées x(t) et y(t))', court: 'Mouvement dans un plan (exemple)', dim: 2, layout: 'plan', N: 6, tau: 0.2, taus: [0.1, 0.2, 0.3], unite: 'm',
    x: t => 4 * t, y: t => 6 * t - 5 * t * t, vx: () => 4, vy: t => 6 - 10 * t, ax: () => 0, ay: () => -10,
    formule: 'x(t) = 4,0 t et y(t) = 6,0 t − 5,0 t²', note: 'Deux coordonnées : x(t) donne vx constante, y(t) donne vy qui diminue puis change de signe.' },
  sinus: { id: 'sinus', nom: 'Mobile qui va et vient (oscillation)', court: 'Va-et-vient : l’accélération varie', dim: 2, layout: 'etage', N: 8, tau: 1.0, taus: [0.5, 1.0, 2.0], unite: 'm', approx: true,
    x: t => 4 * Math.sin(Math.PI * t / 4), y: () => 0, vx: t => Math.PI * Math.cos(Math.PI * t / 4), vy: () => 0, ax: t => -(Math.PI * Math.PI / 4) * Math.sin(Math.PI * t / 4), ay: () => 0,
    formule: 'x(t) = 4,0 sin(π t / 4)', note: 'Ici x(t) n’est pas un polynôme du second degré : les estimations sur un pas τ sont approchées (comparez avec les valeurs exactes).' },
};
// Scénario réservé au parcours guidé (étapes sur les dérivées) : x(t) = 1,5 t² + 2,0 t
MOUVEMENTS.derive = { id: 'derive', nom: 'Chariot qui accélère', court: 'Mouvement rectiligne', dim: 2, layout: 'ligne', N: 6, tau: 1.0, taus: [1.0], unite: 'm', guide: true,
  x: t => 1.5 * t * t + 2 * t, y: () => 0, vx: t => 3 * t + 2, vy: () => 0, ax: () => 3, ay: () => 0, formule: 'x(t) = 1,5 t² + 2,0 t', note: '' };
export const ORDRE_MOUVEMENTS = ['acc', 'frein', 'retour', 'unif', 'parabole', 'sinus'];

// Points de la chronophotographie : [{ i, t, x, y }]
export function chrono(mv, tau = mv.tau, N = mv.N) {
  const P = [];
  for (let i = 0; i <= N; i++) { const t = i * tau; P.push({ i, t, x: mv.x(t), y: mv.y(t) }); }
  return P;
}
// Vecteur vitesse approché au point i (1 ≤ i ≤ N−1) : (OM_{i+1} − OM_{i−1}) / (2τ)
export function vitesseApprochee(P, i, tau) {
  if (i < 1 || i > P.length - 2) return null;
  return { x: (P[i + 1].x - P[i - 1].x) / (2 * tau), y: (P[i + 1].y - P[i - 1].y) / (2 * tau) };
}
// Vecteur accélération approché au point i (2 ≤ i ≤ N−2) : (v_{i+1} − v_{i−1}) / (2τ)
export function accelerationApprochee(P, i, tau) {
  const a = vitesseApprochee(P, i + 1, tau), b = vitesseApprochee(P, i - 1, tau);
  if (!a || !b) return null;
  return { x: (a.x - b.x) / (2 * tau), y: (a.y - b.y) / (2 * tau) };
}
// Valeurs exactes (dérivées analytiques) à la date t
export const vitesseExacte = (mv, t) => ({ x: mv.vx(t), y: mv.vy(t) });
export const accelerationExacte = (mv, t) => ({ x: mv.ax(t), y: mv.ay(t) });
export const norme = v => Math.hypot(v.x, v.y);

// Mise à l'échelle de la scène (en pixels du viewBox) : renvoie { px (pixels par mètre), xmin, ymin, echV, echA, minEcart }
export function echelles(mv, P, tau, largeur = 340, hauteur = 150) {
  const xs = P.map(p => p.x), ys = P.map(p => p.y), xmin = Math.min(0, ...xs), xmax = Math.max(...xs), ymin = Math.min(0, ...ys), ymax = Math.max(...ys);
  let px = largeur / Math.max(xmax - xmin, 1e-9);
  if (mv.layout === 'plan') px = Math.min(px, hauteur / Math.max(ymax - ymin, 1e-9));
  px = Math.min(px, 90);
  // plus petit écart (en pixels) entre deux points voisins : sert à borner la longueur des flèches
  let minEcart = Infinity;
  for (let i = 0; i < P.length - 1; i++) { const d = Math.hypot(P[i + 1].x - P[i].x, mv.layout === 'plan' ? P[i + 1].y - P[i].y : 0) * px; if (d > 1e-6) minEcart = Math.min(minEcart, d); }
  if (!isFinite(minEcart)) minEcart = 20;
  const vmax = Math.max(1e-9, ...P.slice(1, -1).map((_, k) => norme(vitesseApprochee(P, k + 1, tau))));
  const amax = Math.max(1e-9, ...P.slice(2, -2).map((_, k) => norme(accelerationApprochee(P, k + 2, tau))));
  const echV = Math.min(0.85 * tau * px, 60 / vmax * 1.0);
  const longA = mv.layout === 'etage' ? 44 : Math.min(0.9 * minEcart, 46);
  const echA = amax < 1e-6 ? 18 : longA / amax;
  return { px, xmin, xmax, ymin, ymax, echV, echA, minEcart, vmax, amax };
}

// Arrondi « propre » pour la barre d'échelle : 1, 2 ou 5 × 10^k
export function valeurRonde(v) {
  const e = Math.pow(10, Math.floor(Math.log10(v))), m = v / e;
  return (m >= 5 ? 5 : m >= 2 ? 2 : 1) * e;
}

// ── Défi 1 : lire l'accélération sur une chronophotographie (positions données à 2 décimales) ──
export const POINTS_DEFI = 6;   // i = 0 … 6
export function tirageDefiChrono(rnd = Math.random) {
  // on écarte les tirages où un élève qui arrondit les deux vitesses à 2 chiffres significatifs s'éloignerait de plus de 5 % de a (voir le test)
  for (let essai = 0; essai < 200; essai++) { const d = tirageChrono1(rnd); if (d.ecartArrondi <= 0.05) return d; }
  return tirageChrono1(rnd);
}
function tirageChrono1(rnd) {
  const tire = t => t[Math.floor(rnd() * t.length)];
  const type = tire(['acc', 'frein', 'retour']), tau = tire([1.0, 2.0]);
  const mag = tire([0.5, 1.0, 1.5, 2.0, 2.5]);
  let a, v0;
  if (type === 'acc') { a = mag; v0 = tire([0.5, 1.0, 1.5, 2.0, 3.0]); }
  else if (type === 'frein') { a = -mag; v0 = Math.ceil(mag * tau * 6 / 0.5) * 0.5 + tire([0.5, 1.0, 2.0]); }       // la vitesse reste positive jusqu'au dernier point
  else { a = -mag; v0 = tire([1.0, 2.0, 3.0, 4.0]) * mag * tau; v0 = Math.round(v0 / 0.5) * 0.5; if (v0 < 0.5) v0 = 0.5; }
  const x0 = tire([0, 2, 5]);
  const x = i => { const t = i * tau; return Math.round((x0 + v0 * t + 0.5 * a * t * t) * 100) / 100; };
  const pts = Array.from({ length: POINTS_DEFI + 1 }, (_, i) => ({ i, t: i * tau, x: x(i), y: 0 }));
  // point k où l'on demande l'accélération : 2, 3 ou 4 ; on évite un point où la vitesse est nulle (ni « accélère » ni « ralentit »)
  const ks = [2, 3, 4].filter(k => Math.abs(vitesseApprochee(pts, k, tau).x) > 0.2);
  const k = tire(ks.length ? ks : [3]);
  const vk = vitesseApprochee(pts, k, tau).x, ak = accelerationApprochee(pts, k, tau).x;
  const sens = Math.abs(ak) < 1e-9 ? 'cst' : vk * ak > 0 ? 'acc' : 'ral';
  const sig2 = v => Number(Number(v).toPrecision(2));
  const aEleve = (sig2(vitesseApprochee(pts, k + 1, tau).x) - sig2(vitesseApprochee(pts, k - 1, tau).x)) / (2 * tau);
  return { type, tau, a, v0, x0, pts, k, vk, ak, sens, ecartArrondi: Math.abs(aEleve - ak) / Math.abs(ak) };
}

// ── Défi 2 : de x(t) à l'accélération et à l'instant d'arrêt ──
export function tirageDefiDerive(rnd = Math.random) {
  const tire = t => t[Math.floor(rnd() * t.length)];
  const A = tire([0.5, 1.0, 1.5, 2.0]) * tire([1, -1]), t0 = tire([1.0, 1.5, 2.0, 2.5, 3.0, 4.0]);
  const B = Math.round(-2 * A * t0 * 100) / 100, C = tire([0, 1.0, 2.0, 5.0]);
  return { A, B, C, a: 2 * A, t0: -B / (2 * A) };
}
// Écriture « 1,5 t² − 3,0 t + 2,0 » de x(t) (coefficients à 1 décimale si possible)
export function ecritX({ A, B, C }) {
  const f = (v, d = 1) => Math.abs(v).toFixed(d).replace('.', ',');
  const dec = v => (Math.abs(v * 10 - Math.round(v * 10)) < 1e-9 ? 1 : 2);
  const sg = v => (v < 0 ? '−' : '+');
  return `${A < 0 ? '−' : ''}${f(A, dec(A))} t² ${sg(B)} ${f(B, dec(B))} t${C === 0 ? '' : ` ${sg(C)} ${f(C, dec(C))}`}`;
}
