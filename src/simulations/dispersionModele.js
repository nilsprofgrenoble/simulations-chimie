// Modèle de la simulation 225 « Mouiller, disperser, stabiliser une suspension » (BTS MDC, Formulation).
// Capacités visées (jamais affichées à l'élève) : « Expliquer le choix d'un agent mouillant ou d'un agent dispersant selon son mode d'action et les matières premières utilisées » ;
// « Mettre en œuvre un contrôle d'homogénéité d'une suspension par une mesure granulométrique ».
// Fil rouge : l'étape d'empâtage d'une peinture (eau + dispersant + antimousse, puis pulvérulents sous très forte agitation).
// Modèle QUALITATIF : la poudre est un mélange de particules primaires et d'agglomérats (deux populations log-normales). Les ordres de grandeur (D50 de l'ordre du µm,
// agglomérats de 10 à 20 µm) s'inspirent de distributions mesurées au granulomètre laser ; ils sont annoncés comme tels dans les hypothèses.

export const SOLIDES = [
  { id: 'tio2', nom: 'dioxyde de titane (pigment blanc, hydrophile)', court: 'TiO₂', m0: 0.9, fa0: 0.24, d50p: 1.5, sp: 1.85, d50a: 13, sa: 1.45 },
  { id: 'fer', nom: 'oxyde de fer jaune (pigment coloré, hydrophile)', court: 'oxyde de fer', m0: 0.9, fa0: 0.32, d50p: 0.9, sp: 2.0, d50a: 13, sa: 1.5 },
  { id: 'noir', nom: 'noir de carbone (pigment noir, hydrophobe)', court: 'noir de carbone', m0: 0.05, fa0: 0.3, d50p: 1.0, sp: 1.9, d50a: 13, sa: 1.5 },
];
export const solide = id => SOLIDES.find(s => s.id === id);

export const K_DISP = 0.05;      // % de dispersant actif (sur la masse de pigment) pour demi-saturation de l'adsorption
export const SEUIL_AGGLO = 5;    // µm : au-delà, on parle d'agglomérats
export const D50_SPEC = 1.1;     // µm : spécification illustrative du défi (D50 maximal)
export const AGGLO_MAX = 0.12;   // fraction (volumique, assimilée à massique) d'agglomérats tolérée (spécification illustrative)

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const theta = (x, K = K_DISP) => (x <= 0 ? 0 : x / (x + K));           // taux de recouvrement par adsorption (Langmuir)
export const transmission = m => 0.25 + 0.75 * clamp(m);                      // part de l'énergie de dispersion qui atteint les agglomérats (0 = air emprisonné)
// État : m (mouillage 0..1), E (énergie de dispersion 0..1), x (% de dispersant sec), g (broyage 0..1)
// Mouillage effectif : un solide hydrophile (m0 élevé) est déjà mouillé par l'eau ; un solide hydrophobe (m0 faible) ne l'est qu'avec un agent mouillant (m)
export const mouillageEff = (sol, m) => 1 - (1 - sol.m0) * (1 - clamp(m));
export const fractionAgglo = (sol, { m, E, x }) => sol.fa0 * (1 - clamp(E * transmission(mouillageEff(sol, m))) * (0.35 + 0.65 * theta(x)));
export const d50Primaires = (sol, { g }) => sol.d50p * (1 - 0.55 * clamp(g));

export const GRILLE = Array.from({ length: 41 }, (_, i) => Math.pow(10, (i / 40) * Math.log10(400)) / 10);   // 0,1 à 40 µm, échelle log
const lognorm = (d, d50, sg) => Math.exp(-0.5 * (Math.log(d / d50) / Math.log(sg)) ** 2);
// Distribution en volume q(%) (= massique si la masse volumique est uniforme) par point de la grille (somme = 100)
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
export const CLASSES = [[0.1, 0.5], [0.5, 1], [1, 2], [2, 5], [5, 10], [10, 20], [20, 40]];
export function parClasses(q) {
  return CLASSES.map(([a, b]) => q.reduce((s, v, i) => s + (GRILLE[i] >= a && GRILLE[i] < b + (b === 40 ? 1 : 0) ? v : 0), 0));
}

// Viscosité de la pâte d'empâtage (Pa·s) en fonction du dosage de dispersant actif (% sur pigment) : chute par adsorption, puis léger recul en surdose (qualitatif)
export const viscosite = x => 1.2 + 10.8 * (1 - theta(x, 0.05)) + 6 * Math.max(0, x - 0.25);
export function dosageOptimal() { let best = 1e9, xb = 0; for (let x = 0; x <= 0.6001; x += 0.01) { const v = viscosite(x); if (v < best - 1e-9) { best = v; xb = x; } } return xb; }
// Dosage d'un dispersant en solution : mP (g de pigment), pc (% de matière active sur la masse de pigment), ES (extrait sec de la solution, %)
export const masseActive = (mP, pc) => (mP * pc) / 100;
export const masseSolution = (mP, pc, ES) => masseActive(mP, pc) / (ES / 100);

// ---------- Défis ----------
const choix = (L, r) => L[Math.floor(r() * L.length) % L.length];
export function tirageDosage(r = Math.random) {
  const mP = choix([200, 250, 300, 400, 500], r), pc = choix([0.1, 0.15, 0.2, 0.25, 0.3], r), ES = choix([30, 40, 50], r);
  return { mP, pc, ES, active: masseActive(mP, pc), vrai: masseSolution(mP, pc, ES) };
}
export const CAS = ['mouillage', 'energie', 'dispersant', 'broyage', 'aucune'];
export const CAUSES = { mouillage: 'agent mouillant absent avec un pigment hydrophobe : l’air des pores empêche le mouillage des agglomérats', energie: 'énergie de dispersion insuffisante : les agglomérats ne sont pas cassés', dispersant: 'dispersant absent : les agglomérats se reforment après dispersion', broyage: 'particules primaires trop grosses : il faut broyer', aucune: 'aucune lacune : mouillage, dispersion, dispersant et broyage sont en place' };
export const REMEDES = { mouillage: 'ajouter un agent mouillant dans la cuve d’empâtage (pigment hydrophobe)', energie: 'augmenter l’énergie de dispersion (disperseur plus rapide ou plus long)', dispersant: 'ajouter un dispersant', broyage: 'broyer (broyeur à billes) pour réduire les particules primaires', aucune: 'ne rien changer' };
// État type de chaque cas : une seule lacune à la fois
export function etatDuCas(cas, r = Math.random) {
  const u = (a, b) => a + (b - a) * r();
  const base = { m: u(0.85, 1), E: u(0.85, 1), x: Math.round(u(0.2, 0.3) * 20) / 20, g: u(0.6, 0.85) };
  if (cas === 'mouillage') base.m = u(0, 0.15);   // (cas réservé à un solide hydrophobe : voir tirageDiagnostic)
  if (cas === 'energie') base.E = u(0.05, 0.2);
  if (cas === 'dispersant') base.x = 0;
  if (cas === 'broyage') base.g = 0;
  return base;
}
export function tirageDiagnostic(r = Math.random) {
  const cas = choix(CAS, r), sol = cas === 'broyage' ? SOLIDES[0] : cas === 'mouillage' ? solide('noir') : choix(SOLIDES, r), etat = etatDuCas(cas, r);
  if (sol.m0 > 0.5) etat.m = 0;   // pigment hydrophile : pas d'agent mouillant dans la peinture
  const q = distribution(sol, etat);
  return { cas, solide: sol, etat, q, d10: diametre(q, 10), d50: diametre(q, 50), d90: diametre(q, 90), agglo: fractionAuDessus(q) };
}
