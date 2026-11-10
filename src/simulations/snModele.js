// Substitution ou élimination ? Modèle qualitatif (ordres de grandeur) pour des halogénoalcanes en C4.
// Les proportions sont des ORDRES DE GRANDEUR arrondis à 5 % près, choisis pour traduire les tendances
// expérimentales (classe du substrat, force et encombrement de la base, température). Ce ne sont pas des mesures.

export const SUBSTRATS = {
  prim: { cle: 'prim', classe: 'primaire', nom: '1-bromobutane', alcool: 'butan-1-ol', alcene: 'but-1-ène', chiral: false },
  sec: { cle: 'sec', classe: 'secondaire', nom: '2-bromobutane', alcool: 'butan-2-ol', alcene: 'but-2-ène (majoritaire) et but-1-ène', chiral: true },
  tert: { cle: 'tert', classe: 'tertiaire', nom: '2-bromo-2-méthylpropane', alcool: '2-méthylpropan-2-ol', alcene: '2-méthylprop-1-ène', chiral: false },
};
export const REACTIFS = {
  HO: { cle: 'HO', nom: 'HO⁻ dans l\'éthanol', court: 'HO⁻', fort: true, encombre: false, description: 'base forte et bon nucléophile' },
  tBuO: { cle: 'tBuO', nom: 'tBuO⁻ (tert-butylate) dans le tert-butanol', court: 'tBuO⁻', fort: true, encombre: true, description: 'base forte mais encombrée, mauvais nucléophile' },
  H2O: { cle: 'H2O', nom: 'eau / éthanol (sans base ajoutée)', court: 'H₂O', fort: false, encombre: false, description: 'nucléophile faible et base faible' },
};
export const MECA = {
  SN2: { cle: 'SN2', nom: 'SN2', long: 'substitution nucléophile bimoléculaire', etapes: 1, ordre: 2, loi: 'v = k·[RBr]·[Nu]' },
  SN1: { cle: 'SN1', nom: 'SN1', long: 'substitution nucléophile monomoléculaire', etapes: 2, ordre: 1, loi: 'v = k·[RBr]' },
  E2: { cle: 'E2', nom: 'E2', long: 'élimination bimoléculaire', etapes: 1, ordre: 2, loi: 'v = k·[RBr]·[B]' },
  E1: { cle: 'E1', nom: 'E1', long: 'élimination monomoléculaire', etapes: 2, ordre: 1, loi: 'v = k·[RBr]' },
};

// [substitution, élimination] à 25 °C puis à 80 °C ; le mécanisme dépend de la force du réactif et de la classe.
const TABLE = {
  'prim|HO': { m: ['SN2', 'E2'], f: [90, 10], c: [70, 30], v: 'rapide' },
  'prim|tBuO': { m: ['SN2', 'E2'], f: [15, 85], c: [10, 90], v: 'rapide' },
  'prim|H2O': null,
  'sec|HO': { m: ['SN2', 'E2'], f: [30, 70], c: [10, 90], v: 'moyenne' },
  'sec|tBuO': { m: ['SN2', 'E2'], f: [5, 95], c: [0, 100], v: 'moyenne' },
  'sec|H2O': { m: ['SN1', 'E1'], f: [75, 25], c: [55, 45], v: 'lente' },
  'tert|HO': { m: ['SN1', 'E2'], f: [10, 90], c: [5, 95], v: 'rapide' },
  'tert|tBuO': { m: ['SN1', 'E2'], f: [0, 100], c: [0, 100], v: 'rapide' },
  'tert|H2O': { m: ['SN1', 'E1'], f: [80, 20], c: [55, 45], v: 'rapide' },
};

export function proportions(sub, re, chaud) {
  const ligne = TABLE[`${sub}|${re}`];
  if (!ligne) return { reaction: false, p: { SN2: 0, SN1: 0, E2: 0, E1: 0 }, dominant: null, vitesse: 'quasi nulle', substitution: 0, elimination: 0 };
  const [s, e] = chaud ? ligne.c : ligne.f;
  const p = { SN2: 0, SN1: 0, E2: 0, E1: 0 };
  p[ligne.m[0]] = s; p[ligne.m[1]] = e;
  const dominant = s >= e ? ligne.m[0] : ligne.m[1];
  return { reaction: true, p, dominant, vitesse: ligne.v, substitution: s, elimination: e };
}

// Énergies (kJ/mol) des points stationnaires du mécanisme dominant : ordres de grandeur.
// Mécanismes en une étape : réactifs → ET → produits ; en deux étapes : réactifs → ET₁ → carbocation → ET₂ → produits.
const E_CATION = { prim: 160, sec: 85, tert: 55 };
export function profil(meca, sub, re) {
  const encomb = re === 'tBuO' ? 25 : 0;
  if (meca === 'SN2') return { pts: [['réactifs', 0], ['ET', { prim: 85, sec: 100, tert: 125 }[sub] + encomb], ['produits', -30]], etapes: 1 };
  if (meca === 'E2') return { pts: [['réactifs', 0], ['ET', { prim: 95, sec: 88, tert: 78 }[sub]], ['produits', -15]], etapes: 1 };
  const ec = E_CATION[sub];
  return { pts: [['réactifs', 0], ['ET₁', ec + 10], ['carbocation', ec], ['ET₂', ec + 18], ['produits', meca === 'SN1' ? -25 : -15]], etapes: 2 };
}
// Énergie en un point d'abscisse x ∈ [0,1] : interpolation en cosinus entre points stationnaires (extrema plats).
export function energieEn(pts, x) {
  const n = pts.length - 1, i = Math.min(n - 1, Math.floor(x * n)), t = x * n - i;
  const a = pts[i][1], b = pts[i + 1][1];
  return a + (b - a) * (1 - Math.cos(Math.PI * t)) / 2;
}
export const barriere = (meca, sub, re) => { const pts = profil(meca, sub, re).pts; return pts[1][1] - pts[0][1]; };
