// ====================================================
//  MODÈLE DE LA SIMULATION 179 « ÉQUATION DE RÉACTION : ÉCRIRE ET AJUSTER » (2GT, partie « Modéliser une transformation chimique par une réaction »).
//  Fichier sans React, testé par equationReactionModele.test.mjs.
//
//  HYPOTHÈSES DU MODÈLE (affichées à l'élève dans le panneau « Hypothèses de travail ») :
//   • l'équation de réaction modélise le BILAN de la transformation (ce qui disparaît, ce qui apparaît), pas le déroulement (mécanisme) ;
//   • la transformation est supposée totale : tous les réactifs de l'équation disparaissent (le réactif limitant n'est pas traité en 2GT) ;
//   • les coefficients stœchiométriques sont les plus petits nombres entiers qui conservent les éléments chimiques et la charge électrique ;
//   • les coefficients se lisent comme des proportions entre entités (atomes, molécules, ions ; « unités » pour le solide ionique CaCO₃) ; la quantité de matière n'est pas utilisée en 2GT ;
//   • la combustion est supposée complète (seulement CO₂ et H₂O) ; H⁺ est une écriture simplifiée de l'ion hydrogène en solution ;
//   • les états physiques suivent les conventions du site : (s) solide, (l) liquide, (g) gaz, (aq) en solution aqueuse ; dans une combustion, l'eau est
//     écrite à l'état gazeux (vapeur dans la flamme), comme dans la simulation 159 (1G).
// ====================================================

export const NB = '\u00a0';

// ---------- espèces chimiques ----------
// atomes : composition ; charge : en unités de charge élémentaire ; etat : s, l, g ou aq ;
// dessin : positions des atomes (en diamètres d'atome) pour les « bonshommes » ; null = trop gros pour être dessiné atome par atome.
const D = {
  C: { f: 'C', nom: 'carbone', atomes: { C: 1 }, charge: 0, etat: 's', dessin: [['C', 0, 0]] },
  O2: { f: 'O₂', nom: 'dioxygène', atomes: { O: 2 }, charge: 0, etat: 'g', dessin: [['O', -0.54, 0], ['O', 0.54, 0]] },
  CO2: { f: 'CO₂', nom: 'dioxyde de carbone', atomes: { C: 1, O: 2 }, charge: 0, etat: 'g', dessin: [['O', -1.12, 0], ['C', 0, 0], ['O', 1.12, 0]] },
  CH4: { f: 'CH₄', nom: 'méthane', atomes: { C: 1, H: 4 }, charge: 0, etat: 'g', dessin: [['C', 0, 0], ['H', -0.82, -0.82], ['H', 0.82, -0.82], ['H', -0.82, 0.82], ['H', 0.82, 0.82]] },
  H2O_g: { f: 'H₂O', nom: 'eau (vapeur)', atomes: { H: 2, O: 1 }, charge: 0, etat: 'g', dessin: [['H', -0.9, 0.66], ['O', 0, 0], ['H', 0.9, 0.66]] },
  H2O_l: { f: 'H₂O', nom: 'eau', atomes: { H: 2, O: 1 }, charge: 0, etat: 'l', dessin: [['H', -0.9, 0.66], ['O', 0, 0], ['H', 0.9, 0.66]] },
  H2: { f: 'H₂', nom: 'dihydrogène', atomes: { H: 2 }, charge: 0, etat: 'g', dessin: [['H', -0.46, 0], ['H', 0.46, 0]] },
  Zn: { f: 'Zn', nom: 'zinc', atomes: { Zn: 1 }, charge: 0, etat: 's', dessin: [['Zn', 0, 0]] },
  Fe: { f: 'Fe', nom: 'fer', atomes: { Fe: 1 }, charge: 0, etat: 's', dessin: [['Fe', 0, 0]] },
  Mg: { f: 'Mg', nom: 'magnésium', atomes: { Mg: 1 }, charge: 0, etat: 's', dessin: [['Mg', 0, 0]] },
  Al: { f: 'Al', nom: 'aluminium', atomes: { Al: 1 }, charge: 0, etat: 's', dessin: [['Al', 0, 0]] },
  Hp: { f: 'H⁺', nom: 'ion hydrogène', atomes: { H: 1 }, charge: 1, etat: 'aq', dessin: [['H', 0, 0]] },
  Zn2: { f: 'Zn²⁺', nom: 'ion zinc', atomes: { Zn: 1 }, charge: 2, etat: 'aq', dessin: [['Zn', 0, 0]] },
  Fe2: { f: 'Fe²⁺', nom: 'ion fer II', atomes: { Fe: 1 }, charge: 2, etat: 'aq', dessin: [['Fe', 0, 0]] },
  Mg2: { f: 'Mg²⁺', nom: 'ion magnésium', atomes: { Mg: 1 }, charge: 2, etat: 'aq', dessin: [['Mg', 0, 0]] },
  Al3: { f: 'Al³⁺', nom: 'ion aluminium', atomes: { Al: 1 }, charge: 3, etat: 'aq', dessin: [['Al', 0, 0]] },
  CaCO3: { f: 'CaCO₃', nom: 'carbonate de calcium (calcaire)', atomes: { Ca: 1, C: 1, O: 3 }, charge: 0, etat: 's',
    dessin: [['Ca', -2.3, 0.35], ['C', 0, 0], ['O', 0, -1.1], ['O', -1.0, 0.64], ['O', 1.0, 0.64]] },
  Ca2: { f: 'Ca²⁺', nom: 'ion calcium', atomes: { Ca: 1 }, charge: 2, etat: 'aq', dessin: [['Ca', 0, 0]] },
  HO: { f: 'HO⁻', nom: 'ion hydroxyde', atomes: { H: 1, O: 1 }, charge: -1, etat: 'aq', dessin: [['O', 0, 0], ['H', 1.0, 0]] },
  Na: { f: 'Na⁺', nom: 'ion sodium', atomes: { Na: 1 }, charge: 1, etat: 'aq', dessin: [['Na', 0, 0]] },
  Cl: { f: 'Cl⁻', nom: 'ion chlorure', atomes: { Cl: 1 }, charge: -1, etat: 'aq', dessin: [['Cl', 0, 0]] },
  BZ: { f: 'C₇H₆O', nom: 'benzaldéhyde', atomes: { C: 7, H: 6, O: 1 }, charge: 0, etat: 'l', dessin: null },
  PR: { f: 'C₃H₆O', nom: 'propanone', atomes: { C: 3, H: 6, O: 1 }, charge: 0, etat: 'l', dessin: null },
  DBA: { f: 'C₁₇H₁₄O', nom: 'dibenzalacétone', atomes: { C: 17, H: 14, O: 1 }, charge: 0, etat: 's', dessin: null },
};
export const ESPECES = Object.fromEntries(Object.entries(D).map(([id, e]) => [id, { id, ...e }]));
export const espece = id => ESPECES[id];
export const formuleEtat = id => `${ESPECES[id].f}(${ESPECES[id].etat})`;

// Couleurs des atomes (le symbole est toujours écrit dans le disque : la couleur ne porte jamais seule l'information)
export const COULEUR = {
  H: { fond: '#ffffff', trait: '#475569', texte: '#0f172a', r: 0.46 },
  C: { fond: '#334155', trait: '#0f172a', texte: '#ffffff', r: 0.58 },
  O: { fond: '#dc2626', trait: '#7f1d1d', texte: '#ffffff', r: 0.55 },
  Zn: { fond: '#6366f1', trait: '#3730a3', texte: '#ffffff', r: 0.64 },
  Fe: { fond: '#b45309', trait: '#78350f', texte: '#ffffff', r: 0.64 },
  Mg: { fond: '#15803d', trait: '#14532d', texte: '#ffffff', r: 0.64 },
  Al: { fond: '#0e7490', trait: '#164e63', texte: '#ffffff', r: 0.64 },
  Ca: { fond: '#f59e0b', trait: '#92400e', texte: '#0f172a', r: 0.66 },
  Na: { fond: '#a855f7', trait: '#6b21a8', texte: '#ffffff', r: 0.64 },
  Cl: { fond: '#a3e635', trait: '#3f6212', texte: '#0f172a', r: 0.64 },
};

// ---------- transformations ----------
// reactifs / produits : identifiants d'espèces ; attendus : coefficients attendus (contrôlés par le test à partir de la conservation) ;
// spect : espèces spectatrices (présentes des deux côtés dans l'écriture complète).
export const REACTIONS = [
  { id: 'carbone', titre: 'Combustion du carbone', theme: 'combustion', reactifs: ['C', 'O2'], produits: ['CO2'], attendus: [1, 1, 1] },
  { id: 'methane', titre: 'Combustion du méthane', theme: 'combustion', reactifs: ['CH4', 'O2'], produits: ['CO2', 'H2O_g'], attendus: [1, 2, 1, 2] },
  { id: 'zinc', titre: 'Zinc et acide chlorhydrique', theme: 'métal et acide', reactifs: ['Zn', 'Hp'], produits: ['Zn2', 'H2'], attendus: [1, 2, 1, 1] },
  { id: 'fer', titre: 'Fer et acide chlorhydrique', theme: 'métal et acide', reactifs: ['Fe', 'Hp'], produits: ['Fe2', 'H2'], attendus: [1, 2, 1, 1] },
  { id: 'magnesium', titre: 'Magnésium et acide chlorhydrique', theme: 'métal et acide', reactifs: ['Mg', 'Hp'], produits: ['Mg2', 'H2'], attendus: [1, 2, 1, 1] },
  { id: 'aluminium', titre: 'Aluminium et acide chlorhydrique', theme: 'métal et acide', reactifs: ['Al', 'Hp'], produits: ['Al3', 'H2'], attendus: [2, 6, 2, 3] },
  { id: 'calcaire', titre: 'Calcaire et acide chlorhydrique', theme: 'acide et calcaire', reactifs: ['CaCO3', 'Hp'], produits: ['Ca2', 'CO2', 'H2O_l'], attendus: [1, 2, 1, 1, 1] },
  { id: 'neutralisation', titre: 'Acide chlorhydrique et hydroxyde de sodium', theme: 'acide et base', reactifs: ['Hp', 'HO'], produits: ['H2O_l'], attendus: [1, 1, 1] },
  { id: 'neutraComplete', titre: 'Acide chlorhydrique et hydroxyde de sodium (ions spectateurs écrits)', theme: 'acide et base', reactifs: ['Hp', 'Cl', 'Na', 'HO'], produits: ['H2O_l', 'Na', 'Cl'], attendus: [1, 1, 1, 1, 1, 1, 1], spect: ['Na', 'Cl'], cache: true },
  { id: 'dba', titre: 'Synthèse de la dibenzalacétone (pour aller plus loin)', theme: 'synthèse', reactifs: ['BZ', 'PR'], produits: ['DBA', 'H2O_l'], attendus: [2, 1, 1, 2], loin: true },
];
export const reaction = id => REACTIONS.find(r => r.id === id);
export const especesDe = r => [...r.reactifs, ...r.produits];
// Écriture en coefficients de l'ordre : réactifs puis produits (un coefficient par espèce)
export const nbEspeces = r => r.reactifs.length + r.produits.length;

// ---------- conservation ----------
// Pour chaque élément : nombre d'atomes à gauche et à droite ; pour la charge : somme des charges à gauche et à droite.
export function bilan(r, coefs) {
  const nr = r.reactifs.length, ids = especesDe(r);
  const elements = [];
  ids.forEach(id => Object.keys(ESPECES[id].atomes).forEach(el => { if (!elements.includes(el)) elements.push(el); }));
  const ORDRE = ['C', 'H', 'O'];
  elements.sort((a, b) => { const ia = ORDRE.indexOf(a), ib = ORDRE.indexOf(b); return (ia < 0 ? 9 : ia) - (ib < 0 ? 9 : ib) || a.localeCompare(b); });
  const lignes = elements.map(el => {
    let g = 0, d = 0;
    ids.forEach((id, i) => { const n = (ESPECES[id].atomes[el] || 0) * coefs[i]; if (i < nr) g += n; else d += n; });
    return { el, g, d, ok: g === d };
  });
  let cg = 0, cd = 0;
  ids.forEach((id, i) => { const q = ESPECES[id].charge * coefs[i]; if (i < nr) cg += q; else cd += q; });
  const aCharge = ids.some(id => ESPECES[id].charge !== 0);
  const charge = { g: cg, d: cd, ok: cg === cd, present: aCharge };
  const ok = lignes.every(l => l.ok) && charge.ok;
  return { lignes, charge, ok };
}
export const estAjustee = (r, coefs) => bilan(r, coefs).ok;
export const pgcd = (a, b) => (b ? pgcd(b, a % b) : Math.abs(a));
// Ajustée avec les plus petits entiers (pgcd des coefficients = 1)
export const estMinimale = (r, coefs) => estAjustee(r, coefs) && coefs.reduce(pgcd, 0) === 1 && coefs.every(c => c >= 1);

// Recherche des plus petits coefficients entiers (≥ 1) qui conservent éléments et charge : parcours par somme croissante
export function coefsAjustes(r, max = 8) {
  const n = nbEspeces(r), c = new Array(n).fill(1);
  let meilleur = null, somme = Infinity;
  (function rec(i, s) {
    if (s >= somme) return;
    if (i === n) { if (estMinimale(r, c)) { meilleur = [...c]; somme = s; } return; }
    for (let v = 1; v <= max; v++) { c[i] = v; rec(i + 1, s + v); }
  })(0, 0);
  return meilleur;
}

// ---------- écriture ----------
// « 2 H⁺(aq) » : coefficient 1 non écrit, espace insécable entre le coefficient et la formule
export const terme = (id, coef, { etats = true, inconnu = false } = {}) => {
  if (inconnu) return '?';
  const e = ESPECES[id];
  return `${coef === 1 ? '' : `${coef}${NB}`}${e.f}${etats ? `(${e.etat})` : ''}`;
};
export const equationTexte = (r, coefs, { etats = true, inconnus = [] } = {}) => {
  const nr = r.reactifs.length, ids = especesDe(r);
  const t = ids.map((id, i) => terme(id, coefs[i], { etats, inconnu: inconnus.includes(i) }));
  return `${t.slice(0, nr).join(' + ')} → ${t.slice(nr).join(' + ')}`;
};
export const equationAttendue = (r, opts) => equationTexte(r, coefsAjustes(r), opts);

// ---------- espèces spectatrices ----------
// Une espèce est spectatrice si elle figure des deux côtés de l'écriture complète avec les mêmes coefficients
export const spectatrices = (r, coefs = coefsAjustes(r)) => {
  const nr = r.reactifs.length, ids = especesDe(r);
  return [...new Set(ids.slice(0, nr))].filter(id => { const ig = ids.slice(0, nr).indexOf(id), idd = ids.slice(nr).indexOf(id); return idd >= 0 && coefs[ig] === coefs[nr + idd]; });
};
// Équation simplifiée : on retire les spectatrices (un coefficient pour chaque espèce restante)
export const sansSpectatrices = r => {
  const sp = r.spect || [];
  return { ...r, id: `${r.id}-simple`, reactifs: r.reactifs.filter(id => !sp.includes(id)), produits: r.produits.filter(id => !sp.includes(id)) };
};

// ---------- proportionnalité (défi et exercices) ----------
// Pour k fois la réaction : coefficients multipliés par k
export const fois = (coefs, k) => coefs.map(c => c * k);
const tire = t => t[Math.floor(Math.random() * t.length)];
export const REACTIONS_DEFI = ['methane', 'zinc', 'fer', 'magnesium', 'aluminium', 'calcaire'];
// CaCO₃ est un solide ionique : on parle d'« unités CaCO₃ » (la formule donne l'unité qui se répète), pas de molécules.
export const nomEntites = id => (ESPECES[id].charge !== 0 ? 'ions' : id === 'CaCO3' ? 'unités' : Object.keys(ESPECES[id].atomes).length === 1 && Object.values(ESPECES[id].atomes)[0] === 1 ? 'atomes' : 'molécules');
// Défi « ajuster » : une transformation tirée au hasard
export const tirerDefiAjuster = (sauf = null) => { const id = tire(REACTIONS_DEFI.filter(x => x !== sauf)); return { r: reaction(id), vrai: coefsAjustes(reaction(id)) }; };
// Défi « proportions » : N molécules, atomes ou ions d'un réactif, combien d'un produit ? (N multiple du coefficient du réactif : résultat entier)
export const tirerDefiQuantite = () => {
  const r = reaction(tire(['methane', 'aluminium', 'calcaire', 'zinc', 'fer']));
  const c = coefsAjustes(r), nr = r.reactifs.length;
  const i = tire(r.reactifs.map((_, k) => k)), j = nr + tire(r.produits.map((_, k) => k));
  const k = tire([2, 3, 4, 5]);
  return { r, coefs: c, i, j, N: c[i] * k, vrai: c[j] * k, k };
};
