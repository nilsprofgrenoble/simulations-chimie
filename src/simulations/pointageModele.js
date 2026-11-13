// Modèle de l'outil « Pointage et bilan énergétique » : pendule filmé (film virtuel), conversion pixels → mètres,
// vitesse par différence centrée, énergies Ec, Epp, Em et incertitude.
export const G = 9.8;
export const RAD = Math.PI / 180;

// Film virtuel : pendule simple amorti (intégration RK4), pivot P, longueur L. Origine des y au point le plus bas.
export function filmPendule({ L = 0.6, theta0 = 35, tau = 1 / 30, n = 48, amort = 0 } = {}) {
  let th = theta0 * RAD, om = 0; const f = (t, o) => [o, -(G / L) * Math.sin(t) - amort * o];
  const sub = 20, h = tau / sub, pts = [];
  for (let i = 0; i < n; i++) {
    pts.push({ i, t: i * tau, theta: th, x: L * Math.sin(th), y: L * (1 - Math.cos(th)) });
    for (let k = 0; k < sub; k++) {
      const [a1, b1] = f(th, om), [a2, b2] = f(th + 0.5 * h * a1, om + 0.5 * h * b1), [a3, b3] = f(th + 0.5 * h * a2, om + 0.5 * h * b2), [a4, b4] = f(th + h * a3, om + h * b3);
      th += (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4); om += (h / 6) * (b1 + 2 * b2 + 2 * b3 + b4);
    }
  }
  return pts;
}
// Pointage au millimètre : les coordonnées lues sont arrondies (résolution du pointage)
export const arrondiPointage = (pts, pas = 0.001) => pts.map(p => ({ ...p, x: Math.round(p.x / pas) * pas, y: Math.round(p.y / pas) * pas }));

// Conversion pixels → mètres
export const echelle = (longueurM, longueurPx) => longueurM / longueurPx;                      // m par pixel
export const pxVersMetres = ({ px, py }, { echelle: e, origine: [ox, oy] }) => ({ x: (px - ox) * e, y: (oy - py) * e });  // y vers le haut

// Vitesse (norme) en i par différence centrée : v ≈ M(i−1)M(i+1) / (2τ)
export function vitesse(pts, i, tau) {
  const a = pts[i - 1], b = pts[i + 1];
  return Math.hypot(b.x - a.x, b.y - a.y) / (2 * tau);
}
export const ecin = (m, v) => 0.5 * m * v * v;
export const epp = (m, y) => m * G * y;
// Bilan : pour i = 1 … n−2. u(Em) = 7 % (hypothèse de l'activité : incertitude relative type B sur Em, voir panneau d'hypothèses)
export function bilan(pts, m, tau, uRel = 0.07) {
  const out = [];
  for (let i = 1; i < pts.length - 1; i++) {
    const v = vitesse(pts, i, tau), Ec = ecin(m, v), Epp = epp(m, pts[i].y), Em = Ec + Epp;
    out.push({ i, t: pts[i].t, x: pts[i].x, y: pts[i].y, v, Ec, Epp, Em, uEm: uRel * Em });
  }
  return out;
}
// Deux énergies mécaniques sont compatibles si leur écart est inférieur à l'incertitude composée √(u1²+u2²) (hypothèse : incertitudes indépendantes)
export const compatibles = (a, b) => Math.abs(a.Em - b.Em) <= Math.hypot(a.uEm, b.uEm);

// Lecture d'un CSV (Fizziq, tableur…) : colonnes t, x, y ; séparateur , ; ou tabulation ; virgule décimale tolérée ; lignes d'en-tête ignorées.
export function lireCSV(texte) {
  const lignes = texte.split(/\r?\n/).map(l => l.trim()).filter(Boolean), pts = [];
  let sep = null, iT = 1, iX = 2, iY = 3;
  for (const l of lignes) {
    if (!sep) sep = l.includes('\t') ? '\t' : l.includes(';') ? ';' : ',';
    const c = l.split(sep).map(s => s.trim());
    const num = c.map(s => Number(s.replace(',', '.')));
    if (c.some(s => /[a-zA-Z]/.test(s)) && !c.every(s => isFinite(Number(s.replace(',', '.'))))) {       // ligne d'en-tête
      const nom = c.map(s => s.toLowerCase().replace(/[^a-z]/g, ''));
      const t = nom.indexOf('t'), x = nom.indexOf('x'), y = nom.indexOf('y');
      if (t >= 0 && x >= 0 && y >= 0) { iT = t; iX = x; iY = y; }
      continue;
    }
    if (num.length > Math.max(iT, iX, iY) && [iT, iX, iY].every(k => isFinite(num[k]))) pts.push({ i: pts.length, t: num[iT], x: num[iX], y: num[iY] });
  }
  return pts;
}
export const pasDeTemps = pts => pts.length > 1 ? (pts[pts.length - 1].t - pts[0].t) / (pts.length - 1) : NaN;
