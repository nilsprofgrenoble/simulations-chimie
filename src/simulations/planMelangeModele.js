// ====================================================
//  Modèle du plan de mélange ternaire (BTS Métiers de la Chimie, « Plans d'expériences : plan de mélanges ternaires »)
//  Composants : A = cire de candelilla, B = huile de ricin, C = cire d'abeille (corps gras d'un rouge à lèvres).
//  Hypothèses de travail (à afficher dans la simulation) :
//   - les proportions sont des fractions massiques, de somme 1 ; les autres ingrédients de la formule sont fixes ;
//   - le modèle de Scheffé n'a pas de terme constant (la somme des proportions vaut 1) ;
//   - les moindres carrés supposent des erreurs indépendantes, de même écart-type, de loi normale ;
//   - une seule mesure par essai dans le TP : l'écart-type de répétabilité n'a pas été mesuré.
// ====================================================

export const COMPOSANTS = [
  { id: 'A', nom: 'Cire de candelilla', court: 'candelilla', coul: '#b45309' },
  { id: 'B', nom: 'Huile de ricin', court: 'huile de ricin', coul: '#0f766e' },
  { id: 'C', nom: "Cire d'abeille", court: "cire d'abeille", coul: '#7c3aed' },
];

// Formule de référence du TP (masses des trois corps gras, en g, pour une formule de 7 g)
export const MASSES_REF = [0.56, 0.35, 0.70];
export const fractionsDe = m => { const t = m.reduce((a, b) => a + b, 0); return m.map(x => x / t); };
export const FREF = fractionsDe(MASSES_REF);                 // ≈ 0,348 ; 0,217 ; 0,435

// ---------- plus grand simplexe de même orientation dont la formule de référence est le centre ----------
// Au centre d'un simplexe de bornes basses Lᵢ et de côté s : xᵢ = Lᵢ + s/3. Avec Lᵢ ≥ 0, on a s ≤ 3·xᵢ pour tout i : s = 3·min(xᵢ).
export function simplexeCentre(fref) {
  const m = Math.min(...fref), s = 3 * m;
  const L = fref.map(x => x - m);
  return { m, s, L, sommets: [0, 1, 2].map(i => L.map((l, j) => l + (j === i ? s : 0))) };
}
export const pseudoVersReel = (z, dom) => z.map((zi, i) => dom.L[i] + dom.s * zi);
export const reelVersPseudo = (x, dom) => x.map((xi, i) => (xi - dom.L[i]) / dom.s);

// ---------- plan à 7 essais (ordre du plan de mélange centré, JMP, sans randomisation) ----------
// Coordonnées en pseudo-composants (somme = 1) : A, B, C
export const PLAN7 = [
  { n: 1, z: [1, 0, 0], nom: 'sommet A' },
  { n: 2, z: [0, 1, 0], nom: 'sommet B' },
  { n: 3, z: [0, 0, 1], nom: 'sommet C' },
  { n: 4, z: [0.5, 0.5, 0], nom: 'milieu AB' },
  { n: 5, z: [0.5, 0, 0.5], nom: 'milieu AC' },
  { n: 6, z: [0, 0.5, 0.5], nom: 'milieu BC' },
  { n: 7, z: [1 / 3, 1 / 3, 1 / 3], nom: 'centre' },
];
// Points « sur les axes » qui complètent le plan (10 essais)
export const AXIAUX = [
  { n: 8, z: [2 / 3, 1 / 6, 1 / 6], nom: 'axe A' },
  { n: 9, z: [1 / 6, 2 / 3, 1 / 6], nom: 'axe B' },
  { n: 10, z: [1 / 6, 1 / 6, 2 / 3], nom: 'axe C' },
];

// Mesures réelles du TP (texturomètre, mobile « guillotine », paramètres « fruit pénétro ») : fermeté en g, une mesure par essai
// (fichier « TPF RaL résultats collectifs », échantillons 1 à 7 dans l'ordre du plan ci-dessus)
export const FERMETE = [288, 141, 407, 377, 822, 254, 479];

// ---------- algèbre linéaire minimale ----------
function inverse(M) {
  const n = M.length, A = M.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-12) return null;
    [A[c], A[p]] = [A[p], A[c]];
    const d = A[c][c];
    for (let k = 0; k < 2 * n; k++) A[c][k] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c]; if (f) for (let k = 0; k < 2 * n; k++) A[r][k] -= f * A[c][k]; }
  }
  return A.map(r => r.slice(n));
}

// ---------- modèles de Scheffé ----------
export const DEGRES = {
  lineaire: { noms: ['β₁', 'β₂', 'β₃'], p: 3 },
  quadratique: { noms: ['β₁', 'β₂', 'β₃', 'β₁₂', 'β₁₃', 'β₂₃'], p: 6 },
  cubique: { noms: ['β₁', 'β₂', 'β₃', 'β₁₂', 'β₁₃', 'β₂₃', 'β₁₂₃'], p: 7 },
};
export function termes(z, degre) {
  const t = [z[0], z[1], z[2]];
  if (degre !== 'lineaire') t.push(z[0] * z[1], z[0] * z[2], z[1] * z[2]);
  if (degre === 'cubique') t.push(z[0] * z[1] * z[2]);
  return t;
}
export const predit = (coefs, degre, z) => termes(z, degre).reduce((s, t, i) => s + t * coefs[i], 0);

// Ajustement par moindres carrés. points : [[z1,z2,z3], …] ; y : réponses.
export function ajuste(points, y, degre) {
  const X = points.map(z => termes(z, degre)), p = DEGRES[degre].p, n = points.length;
  const XtX = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0)));
  const inv = inverse(XtX);
  if (!inv) return null;
  const Xty = Array.from({ length: p }, (_, i) => X.reduce((s, r, k) => s + r[i] * y[k], 0));
  const coefs = inv.map(r => r.reduce((s, v, j) => s + v * Xty[j], 0));
  const pred = X.map(r => r.reduce((s, v, i) => s + v * coefs[i], 0));
  const residus = y.map((v, k) => v - pred[k]);
  const sce = residus.reduce((s, r) => s + r * r, 0);
  const moy = y.reduce((a, b) => a + b, 0) / n;
  const sct = y.reduce((s, v) => s + (v - moy) * (v - moy), 0);
  const ddl = n - p;
  const s = ddl > 0 ? Math.sqrt(sce / ddl) : null;
  const se = ddl > 0 ? inv.map((r, i) => s * Math.sqrt(r[i])) : null;
  return { degre, noms: DEGRES[degre].noms, coefs, pred, residus, sce, sct, ddl, n, p, s, se,
    // Dans un modèle sans constante, la somme des carrés de régression se mesure par rapport à la moyenne des y
    r2: sct > 0 ? 1 - sce / sct : 1 };
}

// ---------- calcul « à la main » sur le plan à 7 essais ----------
export const ecartMilieu = (yij, yi, yj) => yij - (yi + yj) / 2;               // écart au mélange « sans interaction »
export const betaBinaire = (yij, yi, yj) => 4 * yij - 2 * yi - 2 * yj;         // = 4 × écart au milieu
export const betaTernaire = (y123, ys, yb) => 27 * y123 - 12 * (yb[0] + yb[1] + yb[2]) + 3 * (ys[0] + ys[1] + ys[2]);   // modèle cubique spécial
export function coefsMain(y) {                                                  // y : 7 mesures dans l'ordre du plan
  const b = [y[0], y[1], y[2], betaBinaire(y[3], y[0], y[1]), betaBinaire(y[4], y[0], y[2]), betaBinaire(y[5], y[1], y[2])];
  return { quadratique: b, cubique: [...b, betaTernaire(y[6], [y[0], y[1], y[2]], [y[3], y[4], y[5]])] };
}

// ---------- coordonnées du diagramme ternaire ----------
// Disposition du tableau du TP : A (candelilla) en haut, B (huile de ricin) en bas à gauche, C (cire d'abeille) en bas à droite.
const H = Math.sqrt(3) / 2;
export const versXY = x => ({ px: x[2] + 0.5 * x[0], py: H * x[0] });         // côté du triangle = 1, y vers le haut
export function versFractions(px, py) {
  const a = py / H, c = px - 0.5 * a;
  return [a, 1 - a - c, c];
}
export const dansTriangle = (x, tol = 1e-9) => x.every(v => v >= -tol);

// ---------- courbes isoréponses : triangles de marche sur un réseau de n subdivisions ----------
// f(z) donne la réponse en un point de coordonnées z (somme 1). Renvoie des segments [[z, z'], …] en coordonnées z.
export function segmentsIso(f, niveau, n = 40) {
  const segs = [];
  const pt = (i, j) => [i / n, j / n, 1 - i / n - j / n];
  const coupe = (a, b, fa, fb) => { const t = (niveau - fa) / (fb - fa); return a.map((v, k) => v + t * (b[k] - v)); };
  const tri = (a, b, c) => {
    const P = [a, b, c], F = P.map(f), pts = [];
    for (const [u, v] of [[0, 1], [1, 2], [2, 0]]) if ((F[u] >= niveau) !== (F[v] >= niveau)) pts.push(coupe(P[u], P[v], F[u], F[v]));
    if (pts.length === 2) segs.push(pts);
  };
  for (let i = 0; i < n; i++) for (let j = 0; i + j < n; j++) {
    tri(pt(i, j), pt(i + 1, j), pt(i, j + 1));
    if (i + j < n - 1) tri(pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1));
  }
  return segs;
}

// ---------- maximum et minimum d'un modèle sur le simplexe ----------
export function extremes(f, n = 60) {
  let mn = { y: Infinity, z: null }, mx = { y: -Infinity, z: null };
  for (let i = 0; i <= n; i++) for (let j = 0; i + j <= n; j++) {
    const z = [i / n, j / n, 1 - i / n - j / n], v = f(z);
    if (v < mn.y) mn = { y: v, z }; if (v > mx.y) mx = { y: v, z };
  }
  return { min: mn, max: mx };
}

// ---------- domaine général avec bornes basses ET hautes (parcours expert) ----------
// Sommets du polygone {Lᵢ ≤ xᵢ ≤ Uᵢ, Σxᵢ = 1} : on impose deux bornes (haute ou basse) et on déduit la troisième.
export function sommetsDomaine(L, U) {
  const out = [];
  const garde = x => x.every((v, i) => v >= L[i] - 1e-9 && v <= U[i] + 1e-9);
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
    const k = 3 - i - j;
    for (const bi of [L[i], U[i]]) for (const bj of [L[j], U[j]]) {
      const x = []; x[i] = bi; x[j] = bj; x[k] = 1 - bi - bj;
      if (garde(x) && !out.some(o => o.every((v, q) => Math.abs(v - x[q]) < 1e-9))) out.push(x);
    }
  }
  const c = out.reduce((s, x) => s.map((v, q) => v + x[q] / out.length), [0, 0, 0]), cc = versXY(c);
  return out.sort((a, b) => { const pa = versXY(a), pb = versXY(b); return Math.atan2(pa.py - cc.py, pa.px - cc.px) - Math.atan2(pb.py - cc.py, pb.px - cc.px); });
}
export const aireRelative = sommets => {                                       // aire du polygone / aire du triangle complet
  let s = 0;
  for (let i = 0; i < sommets.length; i++) { const a = versXY(sommets[i]), b = versXY(sommets[(i + 1) % sommets.length]); s += a.px * b.py - b.px * a.py; }
  return Math.abs(s) / 2 / (H / 2);
};

// ---------- bruit simulé (répétitions de l'expert) ----------
export function alea(graine) {                                                  // mulberry32
  let a = graine >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function gauss(rnd) { const u = 1 - rnd(), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
// Quantile de Student à 95 % (bilatéral), pour ddl entier (tableau du cours ; au-delà de 30, 1,96)
const T95 = [NaN, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086];
export const student95 = ddl => (ddl <= 20 ? T95[ddl] : ddl <= 30 ? 2.042 : 1.96);

// ---------- coût matière (réponse linéaire : exemple de mélange sans interaction) ----------
// Prix INDICATIFS en €/kg, choisis pour la simulation (à remplacer par les prix relevés par les élèves)
export const PRIX = [28, 12, 34];
export const coutKg = x => x.reduce((s, xi, i) => s + xi * PRIX[i], 0);
