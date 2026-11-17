// ====================================================
//  MODÈLE « CINÉTIQUE : VITESSE VOLUMIQUE, TEMPS DE DEMI-RÉACTION ET LOI D'ORDRE 1 » (sim 122, niveau TG)
//  Situation : hydrolyse du 2-chloro-2-méthylpropane (CH3)3C–Cl dans un mélange eau–propanone, suivie par conductimétrie.
//  Hypothèses de travail (rappelées dans la simulation) :
//   - température et volume constants, une seule réaction totale, réactif limitant = le dérivé chloré (l'eau est le solvant, en grand excès) ;
//   - suivi idéal : la conductivité est proportionnelle à la concentration des ions formés (loi de Kohlrausch, solution diluée),
//     étalonnage supposé fait : on dispose directement de la concentration c(t) du réactif ;
//   - réaction A : v = k·c (loi d'ordre 1) pendant toute la durée du suivi ;
//   - réaction B : contre-exemple, v = c² / (c0·th) (vitesse proportionnelle au carré de c), choisie pour que sa 1ʳᵉ demi-réaction dure autant que celle de A ;
//   - bruit éventuel : écart gaussien centré, indépendant d'un point à l'autre, de même écart-type σ pour toutes les mesures (valeur arrondie au 0,1 mmol/L).
//  Unités : concentrations en mmol/L, temps en min, vitesses volumiques en mmol·L⁻¹·min⁻¹, k en min⁻¹.
//  p = { type: 'A' | 'B', c0, k } ; pour B, k fixe seulement la durée de la 1ʳᵉ demi-réaction th = ln 2 / k.
// ====================================================

export const LN2 = Math.LN2;
export const DUREE = 20;            // durée du suivi (min)
export const PAS = 0.5;             // pas entre deux mesures (min)
export const C0_DEFAUT = 40.0;      // mmol/L
export const K_DEFAUT = 0.150;      // min⁻¹ (t½ = 4,62 min)
export const DT_OPTIONS = [1, 2, 3, 4, 6, 8];   // largeurs d'intervalle possibles pour estimer une vitesse (min)

const arr1 = x => Math.round(x * 10) / 10;

// durée de la 1ʳᵉ demi-réaction (min)
export const th1 = p => LN2 / p.k;

// concentration du réactif (mmol/L) à l'instant t (min)
export const conc = (p, t) => (p.type === 'A' ? p.c0 * Math.exp(-p.k * t) : p.c0 / (1 + t / th1(p)));

// vitesse volumique de disparition v = −dc/dt (mmol·L⁻¹·min⁻¹)
export const vit = (p, t) => (p.type === 'A' ? p.k * conc(p, t) : conc(p, t) ** 2 / (p.c0 * th1(p)));

// instant (min) où la concentration vaut c (mmol/L), 0 < c ≤ c0
export const tempsPour = (p, c) => (p.type === 'A' ? Math.log(p.c0 / c) / p.k : th1(p) * (p.c0 / c - 1));

// durée (min) de la n-ième demi-réaction (n ≥ 1) : de c0/2^(n−1) à c0/2^n
export const dureeDemi = (p, n) => tempsPour(p, p.c0 / 2 ** n) - tempsPour(p, p.c0 / 2 ** (n - 1));

// tangente à la courbe c(t) en t : point de contact, pente (opposée : v), intersections avec l'axe des c (cA, en t = 0) et l'axe des t (tB, en c = 0)
export function tangente(p, t) {
  const c = conc(p, t), v = vit(p, t);
  return { t, c, v, cA: c + v * t, tB: t + c / v };
}

// ln(c / c°) avec c° = 1 mol/L : c est donnée en mmol/L
export const lnc = c => Math.log(c / 1000);

// ---------- série de mesures (éventuellement bruitée) ----------
function prng(graine) {
  let a = graine >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function gauss(r) { let u = 0; while (u === 0) u = r(); const v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

// Points {t, c (valeur exacte du modèle), cm (valeur mesurée, arrondie à 0,1 mmol/L, jamais négative)}
export function serie(p, sigma = 0, graine = 1) {
  const r = prng(graine), pts = [];
  for (let i = 0; i <= Math.round(DUREE / PAS); i++) {
    const t = i * PAS, c = conc(p, t), bruit = sigma * gauss(r);
    pts.push({ t, c, cm: Math.max(0, arr1(c + (sigma ? bruit : 0))) });
  }
  return pts;
}

// vitesse estimée par sécante centrée sur chaque instant : v = (c(t − dt/2) − c(t + dt/2)) / dt (dt en min, multiple de 1 min)
export function vitessesFenetre(pts, dt) {
  const m = Math.round(dt / 2 / PAS), res = [];
  for (let i = m; i < pts.length - m; i++) res.push({ t: pts[i].t, c: pts[i].cm, v: (pts[i - m].cm - pts[i + m].cm) / dt });
  return res;
}
export function vitesseFenetre(pts, t, dt) { return vitessesFenetre(pts, dt).find(q => Math.abs(q.t - t) < 1e-9) || null; }

// incertitude-type due au bruit sur la vitesse estimée par sécante : u(v) = √2 · σ / dt
export const incertitudeVitesse = (sigma, dt) => Math.SQRT2 * sigma / dt;
// écart relatif de la sécante centrée d'une exponentielle par rapport à la tangente : sinh(k·dt/2) / (k·dt/2) − 1
export const biaisSecante = (k, dt) => { const x = k * dt / 2; return Math.sinh(x) / x - 1; };

// ajustement linéaire de ln(c / c°) en fonction de t (moindres carrés), points dont la mesure dépasse seuil (mmol/L)
export function ajustementLn(pts, seuil = 1.0) {
  const q = pts.filter(x => x.cm >= seuil).map(x => ({ t: x.t, y: lnc(x.cm) })), n = q.length;
  if (n < 3) return null;
  const mt = q.reduce((s, x) => s + x.t, 0) / n, my = q.reduce((s, x) => s + x.y, 0) / n;
  const sxx = q.reduce((s, x) => s + (x.t - mt) ** 2, 0), sxy = q.reduce((s, x) => s + (x.t - mt) * (x.y - my), 0), syy = q.reduce((s, x) => s + (x.y - my) ** 2, 0);
  const pente = sxy / sxx, ordonnee = my - pente * mt;
  return { pente, ordonnee, r2: syy ? (sxy * sxy) / (sxx * syy) : 1, n };
}

// durée mesurée d'une demi-réaction : on interpole linéairement la série mesurée pour trouver l'instant où c = niveau
export function instantNiveau(pts, niveau) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (a.cm >= niveau && b.cm < niveau) return a.t + (a.cm - niveau) / (a.cm - b.cm) * (b.t - a.t);
  }
  return null;
}
