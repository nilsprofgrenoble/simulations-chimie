// Modèle de la simulation 225 « Mouiller, disperser, stabiliser une suspension » (BTS MDC, Formulation).
// Capacités visées (jamais affichées à l'élève) : « Expliquer le choix d'un agent mouillant ou d'un agent dispersant selon son mode d'action et les matières premières utilisées » ;
// « Mettre en œuvre un contrôle d'homogénéité d'une suspension par une mesure granulométrique ».
// Modèle QUALITATIF : la poudre est un mélange de particules primaires et d'agglomérats (deux populations log-normales). Les ordres de grandeur du ciment (D50 ≈ 15 à 20 µm,
// agglomérats de 100 à 200 µm) s'inspirent de distributions mesurées au granulomètre laser ; ils sont annoncés comme tels dans les hypothèses.

export const SOLIDES = [
  { id: 'blanc', nom: 'ciment Portland blanc', court: 'ciment blanc', fa0: 0.24, d50p: 15, sp: 1.85, d50a: 130, sa: 1.45 },
  { id: 'prompt', nom: 'ciment Prompt', court: 'ciment Prompt', fa0: 0.32, d50p: 9, sp: 2.0, d50a: 130, sa: 1.5 },
];
export const solide = id => SOLIDES.find(s => s.id === id);

export const K_DISP = 0.35;      // % de dispersant sec (sur la masse de solide) pour demi-saturation de l'adsorption
export const SEUIL_AGGLO = 50;   // µm : au-delà, on parle d'agglomérats
export const D50_SPEC = 11;      // µm : spécification illustrative du défi (D50 maximal)
export const AGGLO_MAX = 0.12;   // fraction massique d'agglomérats tolérée (spécification illustrative)

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const theta = (x, K = K_DISP) => (x <= 0 ? 0 : x / (x + K));           // taux de recouvrement par adsorption (Langmuir)
export const transmission = m => 0.25 + 0.75 * clamp(m);                      // part de l'énergie de dispersion qui atteint les agglomérats (0 = air emprisonné)
// État : m (mouillage 0..1), E (énergie de dispersion 0..1), x (% de dispersant sec), g (broyage 0..1)
export const fractionAgglo = (sol, { m, E, x }) => sol.fa0 * (1 - clamp(E * transmission(m)) * (0.35 + 0.65 * theta(x)));
export const d50Primaires = (sol, { g }) => sol.d50p * (1 - 0.55 * clamp(g));

export const GRILLE = Array.from({ length: 41 }, (_, i) => Math.pow(10, 0 + (i / 40) * Math.log10(400)));   // 1 à 400 µm, échelle log
const lognorm = (d, d50, sg) => Math.exp(-0.5 * (Math.log(d / d50) / Math.log(sg)) ** 2);
// Distribution massique q(%) par point de la grille (somme = 100)
export function distribution(sol, etat) {
  const fa = fractionAgglo(sol, etat), dp = d50Primaires(sol, etat);
  const ps = GRILLE.map(d => lognorm(d, dp, sol.sp)), as = GRILLE.map(d => lognorm(d, sol.d50a, sol.sa));
  const sp = ps.reduce((a, b) => a + b, 0), sa = as.reduce((a, b) => a + b, 0);
  const q = GRILLE.map((_, i) => 100 * ((1 - fa) * ps[i] / sp + fa * as[i] / sa));
  return q;
}
export const cumule = q => { let c = 0; return q.map(v => (c += v)); };
export function diametre(q, pct) {   // D à pct % cumulés (interpolation linéaire en log d)
  const c = cumule(q);
  for (let i = 1; i < c.length; i++) if (c[i] >= pct) { const t = (pct - c[i - 1]) / (c[i] - c[i - 1] || 1); return Math.exp(Math.log(GRILLE[i - 1]) + t * (Math.log(GRILLE[i]) - Math.log(GRILLE[i - 1]))); }
  return GRILLE[GRILLE.length - 1];
}
export const fractionAuDessus = (q, d0 = SEUIL_AGGLO) => q.reduce((s, v, i) => s + (GRILLE[i] > d0 ? v : 0), 0) / 100;
export const etendue = q => (diametre(q, 90) - diametre(q, 10)) / diametre(q, 50);
// Classes pour un tableau lu à la main : [d_min, d_max[ en µm
export const CLASSES = [[1, 5], [5, 10], [10, 20], [20, 50], [50, 100], [100, 200], [200, 400]];
export function parClasses(q) {
  return CLASSES.map(([a, b]) => q.reduce((s, v, i) => s + (GRILLE[i] >= a && GRILLE[i] < b + (b === 400 ? 1 : 0) ? v : 0), 0));
}

// Étalement d'une pâte (cm) en fonction du dosage de dispersant sec (%) : saturation par adsorption puis léger recul en surdose (qualitatif)
export const etalement = x => 6 + 22 * theta(x, 0.35) - 0.9 * Math.max(0, x - 3);
export function dosageOptimal() { let best = 0, xb = 0; for (let x = 0; x <= 5.0001; x += 0.05) { const e = etalement(x); if (e > best + 1e-9) { best = e; xb = x; } } return xb; }
// Dosage en dispersant liquide : mC (g), pc (% de matière sèche sur la masse de ciment), ES (extrait sec, %), EC (rapport eau/ciment)
export const masseSeche = (mC, pc) => (mC * pc) / 100;
export const masseHumide = (mC, pc, ES) => masseSeche(mC, pc) / (ES / 100);
export const eauApportee = (mC, pc, ES) => masseHumide(mC, pc, ES) - masseSeche(mC, pc);
export const eauAPeser = (mC, pc, ES, EC) => EC * mC - eauApportee(mC, pc, ES);

// ---------- Défis ----------
const choix = (L, r) => L[Math.floor(r() * L.length) % L.length];
const arr1 = x => Math.round(x * 10) / 10;
export function tirageDosage(r = Math.random) {
  for (let k = 0; k < 200; k++) {
    const mC = choix([100, 150, 200, 250], r), pc = choix([0.5, 1, 1.5, 2, 2.5], r), ES = choix([30, 35, 40, 45], r), EC = choix([0.3, 0.33, 0.35, 0.4], r);
    const vrai = eauAPeser(mC, pc, ES, EC);
    if (vrai > 0.5 * EC * mC) return { mC, pc, ES, EC, seche: masseSeche(mC, pc), humide: masseHumide(mC, pc, ES), apportee: eauApportee(mC, pc, ES), vrai, total: EC * mC };
  }
  return null;
}
export const CAS = ['mouillage', 'energie', 'dispersant', 'broyage', 'aucune'];
export const CAUSES = { mouillage: 'agent mouillant absent : l’air reste emprisonné dans les agglomérats', energie: 'énergie de dispersion insuffisante : les agglomérats ne sont pas cassés', dispersant: 'dispersant absent : les agglomérats se reforment après dispersion', broyage: 'particules primaires trop grosses : il faut broyer', aucune: 'aucune lacune : mouillage, dispersion, dispersant et broyage sont en place' };
export const REMEDES = { mouillage: 'ajouter un agent mouillant', energie: 'augmenter l’énergie de dispersion (disperseur plus rapide ou plus long)', dispersant: 'ajouter un dispersant', broyage: 'broyer la poudre avant la dispersion', aucune: 'ne rien changer' };
// État type de chaque cas : une seule lacune à la fois
export function etatDuCas(cas, r = Math.random) {
  const u = (a, b) => a + (b - a) * r();
  const base = { m: u(0.85, 1), E: u(0.85, 1), x: arr1(u(2, 3)), g: u(0.6, 0.85) };
  if (cas === 'mouillage') base.m = u(0, 0.15);
  if (cas === 'energie') base.E = u(0.05, 0.2);
  if (cas === 'dispersant') base.x = 0;
  if (cas === 'broyage') base.g = 0;
  return base;
}
export function tirageDiagnostic(r = Math.random) {
  const cas = choix(CAS, r), sol = cas === 'broyage' ? SOLIDES[0] : choix(SOLIDES, r), etat = etatDuCas(cas, r), q = distribution(sol, etat);
  return { cas, solide: sol, etat, q, d10: diametre(q, 10), d50: diametre(q, 50), d90: diametre(q, 90), agglo: fractionAuDessus(q) };
}
