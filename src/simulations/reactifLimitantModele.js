// ====================================================
//  MODÈLE « RÉACTIF LIMITANT » (2GT) — sim 180
//  Une transformation chimique est vue comme une RECETTE : l'équation de réaction donne les proportions (les coefficients).
//  En seconde, on n'écrit ni avancement x ni tableau d'avancement : on compare, pour chaque réactif, la quantité de matière
//  divisée par son coefficient (= le nombre de fois que la recette peut être réalisée). Le plus petit résultat désigne le réactif limitant.
//  Hypothèses : transformation totale et rapide, réactifs purs, pas de réaction parasite, quantités données.
//  Aucune dépendance à React : testable seul (reactifLimitantModele.test.mjs).
// ====================================================

const EPS = 1e-9;
export const arrondi = x => Math.round(x * 1e9) / 1e9;

// Couleurs : réactif 1 = bleu, réactif 2 = orange, produit 1 = vert, produit 2 = violet (les mêmes dans toutes les réactions)
export const COULEURS = { r0: '#2563eb', r1: '#d55e00', p0: '#15803d', p1: '#7c3aed' };

// forme : dessin du jeton (rond pour une espèce chimique ; pain, jambon, sandwich pour l'analogie)
export const REACTIONS = [
  {
    id: 'sandwich', analogie: true, nom: 'Recette de sandwich', unite: 'tranche', jeton: 1, dec: 0,
    contexte: 'Un sandwich se prépare avec une recette : 2 tranches de pain et 1 tranche de jambon.',
    reactifs: [
      { id: 'pain', coef: 2, etiquette: 'pain', nom: 'tranches', max: 8, forme: 'pain' },
      { id: 'jambon', coef: 1, etiquette: 'jambon', nom: 'tranches', max: 6, forme: 'jambon' },
    ],
    produits: [{ id: 'sandwich', coef: 1, etiquette: 'sandwich', nom: 'sandwichs', forme: 'sandwich' }],
    n0: [6, 4],
  },
  {
    id: 'methane', nom: 'Combustion du méthane', unite: 'mol', jeton: 1, dec: 1,
    contexte: 'Le méthane (gaz de ville) brûle dans le dioxygène de l’air.',
    reactifs: [
      { id: 'CH4', f: 'CH₄', nom: 'méthane', coef: 1, compo: { C: 1, H: 4 }, charge: 0, max: 6, forme: 'rond' },
      { id: 'O2', f: 'O₂', nom: 'dioxygène', coef: 2, compo: { O: 2 }, charge: 0, max: 8, forme: 'rond' },
    ],
    produits: [
      { id: 'CO2', f: 'CO₂', nom: 'dioxyde de carbone', coef: 1, compo: { C: 1, O: 2 }, charge: 0, forme: 'rond' },
      { id: 'H2O', f: 'H₂O', nom: 'eau', coef: 2, compo: { H: 2, O: 1 }, charge: 0, forme: 'rond' },
    ],
    n0: [3, 4],
    energie: true,
  },
  {
    id: 'calcaire', nom: 'Acide sur du calcaire', unite: 'mol', jeton: 0.01, dec: 3,
    contexte: 'Une solution d’acide (ions H⁺) attaque le calcaire (carbonate de calcium, un solide blanc) : des bulles de gaz se forment.',
    reactifs: [
      { id: 'CaCO3', f: 'CaCO₃', nom: 'calcaire', coef: 1, compo: { Ca: 1, C: 1, O: 3 }, charge: 0, max: 6, forme: 'rond' },
      { id: 'H+', f: 'H⁺', nom: 'ions de l’acide', coef: 2, compo: { H: 1 }, charge: 1, max: 8, forme: 'rond' },
    ],
    produits: [
      { id: 'Ca2+', f: 'Ca²⁺', nom: 'ions calcium', coef: 1, compo: { Ca: 1 }, charge: 2, forme: 'rond' },
      { id: 'CO2', f: 'CO₂', nom: 'dioxyde de carbone', coef: 1, compo: { C: 1, O: 2 }, charge: 0, forme: 'rond' },
      { id: 'H2O', f: 'H₂O', nom: 'eau', coef: 1, compo: { H: 2, O: 1 }, charge: 0, forme: 'rond' },
    ],
    n0: [4, 6],
  },
  {
    id: 'dba', nom: 'Synthèse de la dibenzylidèneacétone (DBA)', unite: 'mol', jeton: 0.01, dec: 3,
    contexte: 'En synthèse organique, le benzaldéhyde réagit avec l’acétone pour donner un solide jaune, la dibenzylidèneacétone (DBA).',
    reactifs: [
      { id: 'benzald', f: 'C₇H₆O', nom: 'benzaldéhyde', coef: 2, compo: { C: 7, H: 6, O: 1 }, charge: 0, max: 6, forme: 'rond' },
      { id: 'acetone', f: 'C₃H₆O', nom: 'acétone', coef: 1, compo: { C: 3, H: 6, O: 1 }, charge: 0, max: 6, forme: 'rond' },
    ],
    produits: [
      { id: 'DBA', f: 'C₁₇H₁₄O', nom: 'DBA', coef: 1, compo: { C: 17, H: 14, O: 1 }, charge: 0, forme: 'rond' },
      { id: 'H2O', f: 'H₂O', nom: 'eau', coef: 2, compo: { H: 2, O: 1 }, charge: 0, forme: 'rond' },
    ],
    n0: [6, 4],
  },
];
export const reactionDe = id => REACTIONS.find(r => r.id === id);

// ───────── équation ─────────
export const etiquetteDe = e => e.f || e.etiquette;
export const termeTexte = e => `${e.coef > 1 ? `${e.coef} ` : ''}${etiquetteDe(e)}`;
export const equationTexte = r => `${r.reactifs.map(termeTexte).join(' + ')} → ${r.produits.map(termeTexte).join(' + ')}`;

// Conservation des éléments chimiques et de la charge (réactions chimiques seulement)
export function conservation(r) {
  if (r.analogie) return { ok: true, diff: {} };
  const somme = liste => { const t = {}; let q = 0; liste.forEach(e => { Object.entries(e.compo).forEach(([a, k]) => { t[a] = (t[a] || 0) + k * e.coef; }); q += e.charge * e.coef; }); return { t, q }; };
  const g = somme(r.reactifs), d = somme(r.produits), diff = {};
  new Set([...Object.keys(g.t), ...Object.keys(d.t)]).forEach(a => { const x = (g.t[a] || 0) - (d.t[a] || 0); if (x !== 0) diff[a] = x; });
  if (g.q !== d.q) diff.charge = g.q - d.q;
  return { ok: Object.keys(diff).length === 0, diff };
}

// ───────── le calcul de seconde : n ÷ coefficient ─────────
export const recettes = (r, n) => r.reactifs.map((e, i) => arrondi(n[i] / e.coef));

// État après k réalisations de la recette (k ≤ nombre de recettes possibles)
export function etatApres(r, n, k) {
  return { reactifs: r.reactifs.map((e, i) => arrondi(n[i] - e.coef * k)), produits: r.produits.map(p => arrondi(p.coef * k)) };
}
// Peut-on réaliser une recette de plus (ou un pas `pas` de recette, ex. 0,01) quand k ont déjà été faites ?
export const peutFaire = (r, n, k, pas = 1) => r.reactifs.every((e, i) => n[i] - e.coef * (k + pas) >= -EPS);

// Bilan complet : transformation totale, elle s'arrête quand le réactif limitant est épuisé
export function bilan(r, n) {
  const rec = recettes(r, n), rmin = Math.min(...rec);
  const limitants = rec.map((x, i) => (Math.abs(x - rmin) <= EPS * Math.max(1, rmin) ? i : -1)).filter(i => i >= 0);
  const fin = etatApres(r, n, rmin);
  return { rec, rmin, limitants, stoechio: limitants.length === r.reactifs.length, restes: fin.reactifs, produits: fin.produits, energie: rmin };
}

// Énergie libérée (qualitatif) : proportionnelle à la quantité de réactif limitant consommée.
// Échelle relative : 1 unité = énergie libérée par la combustion de 1 mol de méthane (aucune valeur en kJ en seconde).
export const energieRelative = (r, n) => (r.energie ? bilan(r, n).rmin : null);

// Vérification des invariants sur un état quelconque : éléments conservés, aucune quantité négative, au moins un réactif épuisé
export function verifierBilan(r, n) {
  const b = bilan(r, n), erreurs = [];
  if (b.restes.some(x => x < -EPS)) erreurs.push('quantité négative');
  if (!b.restes.some(x => Math.abs(x) <= EPS)) erreurs.push('aucun réactif épuisé');
  b.limitants.forEach(i => { if (Math.abs(b.restes[i]) > EPS) erreurs.push('limitant non épuisé'); });
  if (!r.analogie) {
    const atomes = (liste, q) => { const t = {}; liste.forEach((e, i) => Object.entries(e.compo).forEach(([a, k]) => { t[a] = (t[a] || 0) + k * q[i]; })); return t; };
    const avant = atomes(r.reactifs, n), apres = {};
    [[r.reactifs, b.restes], [r.produits, b.produits]].forEach(([l, q]) => Object.entries(atomes(l, q)).forEach(([a, x]) => { apres[a] = (apres[a] || 0) + x; }));
    Object.keys(avant).forEach(a => { if (Math.abs(avant[a] - (apres[a] || 0)) > 1e-7) erreurs.push(`élément ${a} non conservé`); });
    const charge = (liste, q) => liste.reduce((t, e, i) => t + e.charge * q[i], 0);
    if (Math.abs(charge(r.reactifs, n) - charge(r.reactifs, b.restes) - charge(r.produits, b.produits)) > 1e-7) erreurs.push('charge non conservée');
  }
  return erreurs;
}

// ───────── tirages (défis et exercices) ─────────
// Mélange à partir de jetons entiers : le réactif limitant est utilisé en proportions exactes pour `m` recettes ;
// l'autre réactif est en excès de `e` jetons (e ≥ 1). Le résultat est ainsi sans ambiguïté (pas de mélange stœchiométrique).
export function melangeAvecLimitant(r, iLim, m, e) {
  const jeton = r.jeton;
  return r.reactifs.map((x, i) => arrondi((i === iLim ? x.coef * m : x.coef * m + e) * jeton));
}
// Mélange en proportions stœchiométriques pour m recettes
export const melangeStoechio = (r, m) => r.reactifs.map(x => arrondi(x.coef * m * r.jeton));

// ───────── affichage (notation française) ─────────
export const fr = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');
export function quantiteTexte(r, x) {
  if (r.unite === 'mol') return `${fr(x, r.dec)} mol`;
  return `${fr(x, 0)}`;
}
