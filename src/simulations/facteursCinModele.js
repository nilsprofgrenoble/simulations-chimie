// ====================================================
//  Modèle de la simulation 187 : facteurs cinétiques, catalyse et choix d'un capteur de suivi (TG spé PC).
//  MODÈLE CONSTRUIT, annoncé comme tel dans la simulation (jamais présenté comme une mesure) :
//   • le réactif suivi (ou le produit suivi) évolue selon c(t) = c0 · exp(−k t) (réactif) ou c(t) = c∞ · (1 − exp(−k t)) (produit) : le temps de demi-réaction est t½ = ln 2 / k ;
//   • la constante k augmente avec la température (t½ divisé par 2 pour +10 °C : ordre de grandeur courant en solution à température ambiante, ni loi d'Arrhenius ni énergie d'activation) ;
//   • la concentration du réactif EN EXCÈS accélère la transformation (t½ inversement proportionnel à cette concentration, dans ce modèle) ;
//   • un catalyseur multiplie k par un facteur propre au couple (transformation, catalyseur) ; la catalase n'a aucun effet sur la transformation du peroxodisulfate (catalyseur spécifique).
//  Les durées sont des ORDRES DE GRANDEUR de séances de TP, pas des valeurs mesurées. Pas de « vitesse de réaction » : seulement vitesse volumique et temps de demi-réaction.
// ====================================================

export const NB = ' ';
export const T_REF = 20;                                    // °C : température de référence des t½ de REACTIONS
export const TEMPERATURES = [10, 15, 20, 25, 30, 35, 40, 45, 50];

// ---------- capteurs de suivi ----------
export const CAPTEURS = {
  spectro: { id: 'spectro', nom: 'spectrophotomètre', court: 'Spectrophotomètre', grandeur: 'absorbance A', critere: 'une espèce colorée apparaît ou disparaît' },
  conduct: { id: 'conduct', nom: 'conductimètre', court: 'Conductimètre', grandeur: 'conductivité σ', critere: 'des ions apparaissent ou disparaissent' },
  ph: { id: 'ph', nom: 'pH-mètre', court: 'pH-mètre', grandeur: 'pH', critere: 'H₃O⁺ ou HO⁻ apparaît ou disparaît' },
  pression: { id: 'pression', nom: 'capteur de pression', court: 'Capteur de pression', grandeur: 'pression P', critere: 'un gaz apparaît ou disparaît' },
};
export const ORDRE_CAPTEURS = ['spectro', 'conduct', 'ph', 'pression'];

// ---------- espèces : f = formule affichée, brute = formule pour le contrôle des atomes (si elle diffère), propriétés pour le choix du capteur ----------
// type : 'ion' (ion en solution), 'mol' (espèce moléculaire dissoute), 'gaz', 'solide', 'liquide' (solvant)
export const esp = (f, nom, coeff, role, type, couleur = 'incolore', brute = null) => ({ f, nom, coeff, role, type, couleur, brute: brute || f });

// ---------- les transformations ----------
// suivi : espèce suivie ; sens 'reactif' (c décroît de c0 à 0) ou 'produit' (c croît de 0 à c∞) ; cMax en `unite`
// capteurs : par capteur proposé, [convient ?, raison]
export const REACTIONS = {
  persulfate: {
    id: 'persulfate', menu: 'Peroxodisulfate et iodure',
    contexte: 'Mélange d’une solution d’iodure de potassium (en excès) et d’une solution de peroxodisulfate de potassium, à la température choisie.',
    especes: [esp('I⁻', 'ion iodure', 2, 'reactif', 'ion'), esp('S₂O₈²⁻', 'ion peroxodisulfate', 1, 'reactif', 'ion'), esp('I₂', 'diiode', 1, 'produit', 'mol', 'jaune-brun'), esp('SO₄²⁻', 'ion sulfate', 2, 'produit', 'ion')],
    suivi: { f: 'I₂', nom: 'diiode', sens: 'produit', cMax: 2.0, unite: 'mmol·L⁻¹', fct: 1 },
    t12ref: 18 * 60, horizon: 120 * 60,
    exces: { f: 'I⁻', nom: 'ion iodure', valeurs: [0.025, 0.050, 0.10, 0.20, 0.40], iRef: 2 },
    catalyseurs: { fe3: 10, catalase: 1 },
    proposes: ['spectro', 'ph', 'pression'],
    capteurs: {
      spectro: [true, 'Le diiode I₂ est la seule espèce colorée (jaune-brun) : son apparition fait augmenter l’absorbance.'],
      ph: [false, 'Aucune espèce acido-basique n’intervient (ni H₃O⁺ ni HO⁻) : le pH ne varie pas.'],
      pression: [false, 'Aucun gaz n’est formé ni consommé : la pression ne varie pas.'],
    },
  },
  violet: {
    id: 'violet', menu: 'Cristal violet et ion hydroxyde',
    contexte: 'Solution de cristal violet (cation CV⁺, violet) dans de la soude concentrée (HO⁻ en très large excès, 0,050 mol·L⁻¹ à la référence), à la température choisie.',
    especes: [esp('CV⁺', 'cation du cristal violet', 1, 'reactif', 'ion', 'violette', 'C₂₅H₃₀N₃⁺'), esp('HO⁻', 'ion hydroxyde', 1, 'reactif', 'ion'), esp('CVOH', 'alcool dérivé du cristal violet', 1, 'produit', 'mol', 'incolore', 'C₂₅H₃₁N₃O')],
    suivi: { f: 'CV⁺', nom: 'cristal violet', sens: 'reactif', cMax: 5.0, unite: 'µmol·L⁻¹', fct: 1 },
    t12ref: 2 * 60, horizon: 12 * 60,
    exces: { f: 'HO⁻', nom: 'ion hydroxyde', valeurs: [0.0125, 0.025, 0.050, 0.10, 0.20], iRef: 2 },
    catalyseurs: null,
    proposes: ['spectro', 'conduct', 'ph', 'pression'],
    capteurs: {
      spectro: [true, 'CV⁺ est violet, son produit CVOH est incolore : l’absorbance diminue au cours de la transformation.'],
      conduct: [false, 'HO⁻ est en très large excès : la quantité d’ions présents varie à peine, la conductivité reste presque constante.'],
      ph: [false, 'HO⁻ est en très large excès (quelques µmol·L⁻¹ consommées sur 0,05 mol·L⁻¹) : le pH reste constant.'],
      pression: [false, 'Aucun gaz n’est formé ni consommé.'],
    },
  },
  h2o2: {
    id: 'h2o2', menu: 'Décomposition de l’eau oxygénée',
    contexte: 'Solution d’eau oxygénée dans un flacon fermé, à la température choisie ; un catalyseur peut être ajouté.',
    especes: [esp('H₂O₂', 'peroxyde d’hydrogène (eau oxygénée)', 2, 'reactif', 'mol'), esp('H₂O', 'eau', 2, 'produit', 'liquide'), esp('O₂', 'dioxygène', 1, 'produit', 'gaz')],
    suivi: { f: 'H₂O₂', nom: 'eau oxygénée', sens: 'reactif', cMax: 100, unite: 'mmol·L⁻¹', fct: 1 },
    t12ref: 360 * 60, horizon: 60 * 60,
    exces: null,
    catalyseurs: { fe3: 30, catalase: 240 },
    proposes: ['spectro', 'conduct', 'ph', 'pression'],
    capteurs: {
      pression: [true, 'Du dioxygène gazeux se forme : dans un flacon fermé, la pression augmente.'],
      spectro: [false, 'H₂O₂, H₂O et O₂ sont incolores : l’absorbance (dans le visible) ne varie pas.'],
      conduct: [false, 'Aucun ion n’apparaît ni ne disparaît : la conductivité ne varie pas.'],
      ph: [false, 'Ni H₃O⁺ ni HO⁻ n’intervient dans l’équation : le pH ne varie pas notablement.'],
    },
  },
  rcl: {
    id: 'rcl', menu: 'Hydrolyse du 2-chloro-2-méthylpropane',
    contexte: 'Hydrolyse dans un mélange d’eau et de propanone, à la température choisie (c’est la transformation étudiée dans la simulation sur l’ordre 1).',
    especes: [esp('(CH₃)₃C–Cl', '2-chloro-2-méthylpropane', 1, 'reactif', 'mol'), esp('H₂O', 'eau', 2, 'reactif', 'liquide'), esp('(CH₃)₃C–OH', '2-méthylpropan-2-ol', 1, 'produit', 'mol'), esp('H₃O⁺', 'ion oxonium', 1, 'produit', 'ion'), esp('Cl⁻', 'ion chlorure', 1, 'produit', 'ion')],
    suivi: { f: '(CH₃)₃C–Cl', nom: '2-chloro-2-méthylpropane', sens: 'reactif', cMax: 40, unite: 'mmol·L⁻¹', fct: 1 },
    t12ref: 4.6 * 60, horizon: 25 * 60,
    exces: null,
    catalyseurs: null,
    proposes: ['spectro', 'conduct', 'ph', 'pression'],
    capteurs: {
      conduct: [true, 'Les ions H₃O⁺ et Cl⁻ apparaissent : la conductivité augmente.'],
      ph: [true, 'H₃O⁺ apparaît : le pH diminue.'],
      spectro: [false, 'Toutes les espèces sont incolores : l’absorbance ne varie pas.'],
      pression: [false, 'Aucun gaz n’est formé ni consommé.'],
    },
  },
};
export const ORDRE_REACTIONS = ['persulfate', 'violet', 'h2o2', 'rcl'];

export const CATALYSEURS = {
  aucun: { id: 'aucun', nom: 'aucun catalyseur' },
  fe3: { id: 'fe3', nom: 'ions fer(III) Fe³⁺' },
  catalase: { id: 'catalase', nom: 'catalase (enzyme)' },
};

// ---------- conditions d'une expérience : { T (°C), iB (indice de concentration de l'excès), cat ('aucun' | 'fe3' | 'catalase') } ----------
export const condRef = rid => ({ T: T_REF, iB: REACTIONS[rid].exces ? REACTIONS[rid].exces.iRef : 0, cat: 'aucun' });
export const facteurT = T => Math.pow(2, (T - T_REF) / 10);
export const facteurB = (rid, iB) => { const e = REACTIONS[rid].exces; return e ? e.valeurs[iB] / e.valeurs[e.iRef] : 1; };
export const facteurCat = (rid, cat) => { const c = REACTIONS[rid].catalyseurs; return !c || cat === 'aucun' || cat == null ? 1 : (c[cat] ?? 1); };
export const t12 = (rid, cond) => REACTIONS[rid].t12ref / (facteurT(cond.T) * facteurB(rid, cond.iB) * facteurCat(rid, cond.cat));
export const kcst = (rid, cond) => Math.LN2 / t12(rid, cond);                          // s⁻¹ (constante apparente du modèle)
export const concSuivi = (rid, cond, t) => {
  const s = REACTIONS[rid].suivi, e = Math.exp(-kcst(rid, cond) * t);
  return s.sens === 'reactif' ? s.cMax * e : s.cMax * (1 - e);
};
export const concInit = rid => (REACTIONS[rid].suivi.sens === 'reactif' ? REACTIONS[rid].suivi.cMax : 0);

// conditions modifiables : quels paramètres existent pour la transformation ?
export const parametres = rid => { const R = REACTIONS[rid]; return ['T', ...(R.exces ? ['c'] : []), ...(R.catalyseurs ? ['cat'] : [])]; };
export const concExces = (rid, iB) => REACTIONS[rid].exces.valeurs[iB];
export const nomParam = p => ({ T: 'la température', c: 'la concentration du réactif en excès', cat: 'la présence d’un catalyseur' }[p]);

// ---------- mises en forme (virgule décimale) ----------
export const nbf = (v, d = 1) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
export function formatDuree(s) {
  if (s < 90) return `${nbf(s, s < 10 ? 1 : 0)}${NB}s`;
  if (s < 90 * 60) { const m = s / 60; return `${nbf(m, m < 10 ? 1 : 0)}${NB}min`; }
  const h = s / 3600; return `${nbf(h, h < 10 ? 1 : 0)}${NB}h`;
}
export const formatConc = (v, unite) => `${nbf(v, v >= 10 ? 0 : v >= 1 ? 1 : v >= 0.1 ? 2 : 3)}${NB}${unite}`;
export const formatCExces = v => nbf(v, v < 0.01 ? 4 : v < 0.1 ? 3 : 2) + `${NB}mol·L⁻¹`;

// ---------- analyse d'une formule (pour le contrôle des atomes et de la charge) ----------
const SUB = { '₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9 };
const SUPS = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
export function analyserFormule(f) {
  let charge = 0;
  const m = /([⁰¹²³⁴⁵⁶⁷⁸⁹]*)([⁺⁻])$/.exec(f);
  let corps = f;
  if (m) { charge = (m[1] ? Number([...m[1]].map(c => SUPS[c]).join('')) : 1) * (m[2] === '⁺' ? 1 : -1); corps = f.slice(0, m.index); }
  corps = corps.replace(/[–-]/g, '');
  const pile = [{}];
  let i = 0;
  const lireNb = () => { let s = ''; while (i < corps.length && SUB[corps[i]] !== undefined) { s += SUB[corps[i]]; i++; } return s ? Number(s) : 1; };
  let dernier = null;
  while (i < corps.length) {
    const c = corps[i];
    if (c === '(') { pile.push({}); i++; }
    else if (c === ')') { const g = pile.pop(); i++; const n = lireNb(); for (const [a, v] of Object.entries(g)) pile[pile.length - 1][a] = (pile[pile.length - 1][a] || 0) + v * n; }
    else if (/[A-Z]/.test(c)) { let el = c; i++; if (i < corps.length && /[a-z]/.test(corps[i])) { el += corps[i]; i++; } const n = lireNb(); pile[pile.length - 1][el] = (pile[pile.length - 1][el] || 0) + n; dernier = el; }
    else throw new Error(`caractère inattendu « ${c} » dans ${f}`);
  }
  return { atomes: pile[0], charge, dernier };
}
export function bilanEquation(especes) {
  const tot = { reactif: { atomes: {}, charge: 0 }, produit: { atomes: {}, charge: 0 } };
  for (const e of especes) {
    const a = analyserFormule(e.brute);
    const t = tot[e.role];
    for (const [el, n] of Object.entries(a.atomes)) t.atomes[el] = (t.atomes[el] || 0) + n * e.coeff;
    t.charge += a.charge * e.coeff;
  }
  return tot;
}
export const equationTexte = especes => {
  const cote = r => especes.filter(e => e.role === r).map(e => `${e.coeff > 1 ? e.coeff + NB : ''}${e.f}`).join(' + ');
  return `${cote('reactif')} → ${cote('produit')}`;
};

// ---------- situations pour le choix d'un capteur (parcours, exercices, défi) ----------
// props : propriétés physico-chimiques qui décident du capteur (règle du programme) ; capteurs : [convient ?, raison]
const sit = (id, titre, especes, enonce, props, capteurs) => ({ id, titre, especes, enonce, props, capteurs });
export const SITUATIONS = {
  h2o2: sit('h2o2', 'Décomposition de l’eau oxygénée', REACTIONS.h2o2.especes,
    'Dans un flacon fermé, une solution d’eau oxygénée est décomposée en présence d’un catalyseur.',
    { couleur: false, gaz: true, ions: false, acidobase: false }, REACTIONS.h2o2.capteurs),
  caco3: sit('caco3', 'Carbonate de calcium et acide chlorhydrique',
    [esp('CaCO₃', 'carbonate de calcium', 1, 'reactif', 'solide'), esp('H₃O⁺', 'ion oxonium', 2, 'reactif', 'ion'), esp('Ca²⁺', 'ion calcium', 1, 'produit', 'ion'), esp('CO₂', 'dioxyde de carbone', 1, 'produit', 'gaz'), esp('H₂O', 'eau', 3, 'produit', 'liquide')],
    'De la craie (carbonate de calcium) en petits morceaux est ajoutée à de l’acide chlorhydrique dans un flacon fermé.',
    { couleur: false, gaz: true, ions: true, acidobase: true },
    {
      pression: [true, 'Du dioxyde de carbone gazeux se forme : dans le flacon fermé, la pression augmente.'],
      conduct: [true, 'Les ions H₃O⁺ (très bons conducteurs) sont remplacés par des ions Ca²⁺ : la conductivité diminue nettement.'],
      ph: [true, 'H₃O⁺ est consommé : le pH augmente.'],
      spectro: [false, 'Toutes les espèces sont incolores : l’absorbance ne varie pas.'],
    }),
  rcl: sit('rcl', 'Hydrolyse du 2-chloro-2-méthylpropane', REACTIONS.rcl.especes,
    'Le 2-chloro-2-méthylpropane réagit avec l’eau dans un mélange d’eau et de propanone.',
    { couleur: false, gaz: false, ions: true, acidobase: true }, REACTIONS.rcl.capteurs),
  violet: sit('violet', 'Décoloration du cristal violet par la soude', REACTIONS.violet.especes,
    'Quelques µmol·L⁻¹ de cristal violet (violet) sont mélangées à une solution de soude très concentrée (0,05 mol·L⁻¹, en très large excès).',
    { couleur: true, gaz: false, ions: false, acidobase: false }, REACTIONS.violet.capteurs),
  zinc: sit('zinc', 'Zinc et acide chlorhydrique',
    [esp('Zn', 'zinc', 1, 'reactif', 'solide', 'gris'), esp('H₃O⁺', 'ion oxonium', 2, 'reactif', 'ion'), esp('Zn²⁺', 'ion zinc', 1, 'produit', 'ion'), esp('H₂', 'dihydrogène', 1, 'produit', 'gaz'), esp('H₂O', 'eau', 2, 'produit', 'liquide')],
    'De la poudre de zinc est ajoutée à de l’acide chlorhydrique dans un flacon fermé.',
    { couleur: false, gaz: true, ions: true, acidobase: true },
    {
      pression: [true, 'Du dihydrogène gazeux se forme : dans le flacon fermé, la pression augmente.'],
      conduct: [true, 'Les ions H₃O⁺ (très bons conducteurs) sont remplacés par des ions Zn²⁺ : la conductivité diminue.'],
      ph: [true, 'H₃O⁺ est consommé : le pH augmente.'],
      spectro: [false, 'Aucune espèce n’est colorée (le zinc est un solide gris dont on ne suit pas la couleur) : l’absorbance ne varie pas.'],
    }),
  ester: sit('ester', 'Hydrolyse basique d’un ester',
    [esp('CH₃COOC₂H₅', 'éthanoate d’éthyle', 1, 'reactif', 'mol'), esp('HO⁻', 'ion hydroxyde', 1, 'reactif', 'ion'), esp('CH₃COO⁻', 'ion éthanoate', 1, 'produit', 'ion'), esp('C₂H₅OH', 'éthanol', 1, 'produit', 'mol')],
    'De l’éthanoate d’éthyle réagit avec de la soude, les deux réactifs étant en quantités égales (1,0·10⁻² mol·L⁻¹ chacun).',
    { couleur: false, gaz: false, ions: true, acidobase: true },
    {
      conduct: [true, 'Les ions HO⁻ (très bons conducteurs) sont remplacés par des ions éthanoate CH₃COO⁻ (moins conducteurs) : la conductivité diminue.'],
      ph: [true, 'HO⁻ est consommé (ici en quantité non négligeable) : le pH diminue.'],
      spectro: [false, 'Toutes les espèces sont incolores : l’absorbance ne varie pas.'],
      pression: [false, 'Aucun gaz n’est formé ni consommé.'],
    }),
};
export const ORDRE_SITUATIONS = ['h2o2', 'caco3', 'rcl', 'violet', 'zinc', 'ester'];
// règle du programme : le capteur convient s'il existe une espèce dont la variation de concentration change la grandeur qu'il mesure
export const regleCapteur = (props, c) => ({ spectro: props.couleur, conduct: props.ions, ph: props.acidobase, pression: props.gaz })[c];
export const capteursValides = s => ORDRE_CAPTEURS.filter(c => s.capteurs[c] && s.capteurs[c][0]);

// ---------- tirage du défi « comparer des expériences » ----------
// E1 : référence ; E2 = E1 avec le paramètre p modifié ; E3 = E2 avec le paramètre q modifié (p ≠ q). Les paires (E1,E2) et (E2,E3) isolent un facteur, la paire (E1,E3) n'en isole aucun.
const tire = (t, rnd) => t[Math.floor(rnd() * t.length)];
export function appliquer(rid, cond, p) {
  const n = { ...cond };
  if (p.param === 'T') n.T = p.vers;
  else if (p.param === 'c') n.iB = p.vers;
  else n.cat = p.vers;
  return n;
}
export function tirageDefiFacteurs(rnd = Math.random) {
  for (let essai = 0; essai < 1000; essai++) {
    const rid = tire(['persulfate', 'persulfate', 'violet', 'h2o2'], rnd), R = REACTIONS[rid];
    const params = parametres(rid);
    const p = tire(params, rnd); let q = tire(params, rnd); if (p === q) continue;
    const base = condRef(rid);
    base.T = tire([20, 30], rnd);
    if (R.exces) base.iB = tire([1, 2, 3], rnd);
    const chg = (param, cond) => {
      if (param === 'T') { const vers = tire([cond.T - 10, cond.T + 10, cond.T + 20].filter(x => x >= 10 && x <= 50), rnd); return { param, de: cond.T, vers }; }
      if (param === 'c') { const vers = tire([cond.iB - 1, cond.iB + 1].filter(i => i >= 0 && i <= 4), rnd); return { param, de: cond.iB, vers }; }
      const dispo = Object.keys(R.catalyseurs).filter(k => k !== cond.cat);
      // la catalase (sans effet sur le peroxodisulfate) n'est tirée que dans un quart des cas pour cette transformation
      const vers = R.id === 'persulfate' ? (rnd() < 0.25 ? 'catalase' : 'fe3') : tire(dispo, rnd);
      return { param, de: cond.cat, vers };
    };
    // un catalyseur ne se « retire » pas : le paramètre catalyseur n'est tiré qu'à partir de l'absence de catalyseur
    if (p === 'cat' && base.cat !== 'aucun') continue;
    const c1 = chg(p, base), E2 = appliquer(rid, base, c1);
    if (q === 'cat' && E2.cat !== 'aucun') continue;
    const c2 = chg(q, E2), E3 = appliquer(rid, E2, c2);
    const t = [base, E2, E3].map(c => t12(rid, c));
    const r12 = t[0] / t[1], r23 = t[1] / t[2];
    const net = r => Math.abs(Math.log(r)) > Math.log(1.6) || Math.abs(r - 1) < 1e-9;
    if (!net(r12) || !net(r23)) continue;
    // un seul des deux changements peut être « sans effet » (catalase sur le peroxodisulfate) ; E1 et E3 doivent rester distinguables sur le graphique
    if (Math.abs(r12 - 1) < 1e-9 && Math.abs(r23 - 1) < 1e-9) continue;
    // lisibilité des courbes : ni verticale (t½ < fenêtre/60), ni quasi plate (t½ > 4 fenêtres)
    if (Math.min(...t) < R.horizon / 60 || Math.max(...t) > 4 * R.horizon) continue;
    const quelle = tire([0, 1], rnd);                       // 0 : on interroge sur (E1,E2) ; 1 : sur (E2,E3)
    return { rid, E: [base, E2, E3], changes: [c1, c2], quelle, ratios: [r12, r23] };
  }
  throw new Error('tirage défi facteurs impossible');
}
// effet d'un changement : 'rapide' (t½ plus court), 'lente' (t½ plus long), 'aucun' (sans effet)
export const effetChangement = ratio => (Math.abs(ratio - 1) < 1e-9 ? 'aucun' : ratio > 1 ? 'rapide' : 'lente');

// ---------- tirage du défi « repérer le catalyseur » (peroxodisulfate + iodure) ----------
export function tirageDefiCatalyseur(rnd = Math.random) {
  const ordre = [0, 1, 2].sort(() => rnd() - 0.5);
  const rid = 'persulfate';
  const base = condRef(rid); base.iB = 1;                   // référence : 0,050 mol·L⁻¹ d'ion iodure
  const experiences = [
    { id: 'fe3', nom: 'ions fer(III) Fe³⁺', cond: { ...base, cat: 'fe3' }, avant: 0.020, apres: 0.020, vraiment: 'catalyseur' },
    { id: 'iodure', nom: 'ions iodure I⁻ (supplémentaires)', cond: { ...base, iB: 2 }, avant: 10.0, apres: 9.6, vraiment: 'reactif' },
    { id: 'nitrate', nom: 'nitrate de sodium NaNO₃', cond: { ...base }, avant: 5.0, apres: 5.0, vraiment: 'spectateur' },
  ];
  return { rid, base, experiences: ordre.map(i => experiences[i]) };
}
