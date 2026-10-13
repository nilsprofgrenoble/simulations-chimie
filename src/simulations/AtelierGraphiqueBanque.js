// ====================================================
//  ATELIER « LIRE UN GRAPHIQUE » — BANQUE DE GRAPHIQUES ET DE QUESTIONS
// ====================================================
// Un graphique = un scénario (grandeurs, unités, fonction) + des paramètres tirés au hasard + une échelle (grandes et petites graduations) tirée parmi plusieurs.
// À partir de lui, questions(g) fabrique les questions : axes et unités, valeur d'une graduation, lecture directe et inverse, ordonnée à l'origine,
// conversion d'unité, allure, proportionnalité, coefficient directeur, extrapolation. Aucune dépendance à React : testable seul.

const tire = t => t[Math.floor(Math.random() * t.length)];
export const mulberry32 = a => () => {
  a |= 0; a = (a + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const nb = (x, d = null) => (d == null
  ? Number(x).toLocaleString('fr-FR', { maximumSignificantDigits: 4 })
  : Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }));
export const decimales = s => { const t = String(+Number(s).toFixed(6)); const i = t.indexOf('.'); return i < 0 ? 0 : t.length - i - 1; };
export const fmtAxe = (v, pas) => nb(v, decimales(pas));

function resoudre(f, y, a, b) {                              // f monotone sur [a, b]
  const fa = f(a) - y; let lo = a, hi = b;
  for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if ((f(m) - y) * fa > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
const derivee = (f, x, h) => (f(x + h) - f(x - h)) / (2 * h);

// ── Scénarios ──
// ech : couples [grande graduation, nombre de petits carreaux par grande graduation] possibles pour l'axe.
export const SCENARIOS = [
  { id: 'manometre', domaine: 'Transport des fluides', type: 'droite', prop: true, tend: 'A',
    gen: () => { const rho = tire([800, 1000, 1260]); return { rho, k: rho * 9.81e-4, liq: { 800: 'éthanol', 1000: 'eau', 1260: 'glycérol' }[rho] }; },
    titre: p => `Étalonnage d’un manomètre (liquide : ${p.liq})`,
    axes: () => ({
      x: { nom: 'Hauteur de liquide', sym: 'h', u: 'cm', min: 0, max: 30, ech: [[5, 5], [10, 5], [10, 2]] },
      y: { nom: 'Pression relative', sym: 'P', u: 'hPa', min: 0, max: 40, ech: [[10, 5], [10, 2], [5, 5]] } }),
    f: p => x => p.k * x, penteU: 'hPa·cm⁻¹', penteConv: { fact: 1e4, unit: 'Pa·m⁻¹' }, conv: { axis: 'y', fact: 100, unit: 'Pa' }, xe: 40 },
  { id: 'beer', domaine: 'Chimie', type: 'droite', prop: true, tend: 'A',
    gen: () => { const [eps, l] = tire([[2400, 1], [3000, 1], [1800, 2], [2400, 2]]); return { eps, l, k: eps * l * 1e-6 }; },
    titre: () => 'Droite d’étalonnage de solutions de permanganate',
    axes: p => {
      const ymax = p.k * 300 <= 0.95 ? 1 : 1.5;
      return {
        x: { nom: 'Concentration en ions permanganate', sym: 'c', u: 'µmol·L⁻¹', min: 0, max: 300, ech: [[50, 5], [100, 5], [50, 2]] },
        y: { nom: 'Absorbance', sym: 'A', u: '', min: 0, max: ymax, ech: ymax === 1 ? [[0.2, 4], [0.5, 5], [0.2, 2]] : [[0.5, 5], [0.5, 2], [0.25, 5]] } };
    },
    f: p => x => p.k * x, penteU: 'L·µmol⁻¹', penteConv: { fact: 1e6, unit: 'L·mol⁻¹' }, conv: { axis: 'x', fact: 1e-6, unit: 'mol·L⁻¹' }, xe: 400 },
  { id: 'ressort', domaine: 'Mécanique', type: 'droite', prop: false, tend: 'E',
    gen: () => ({ l0: tire([11, 12, 13]), s: tire([0.04, 0.06, 0.08]) }),
    titre: () => 'Allongement d’un ressort',
    axes: () => ({
      x: { nom: 'Masse accrochée', sym: 'm', u: 'g', min: 0, max: 200, ech: [[50, 5], [50, 2], [20, 4]] },
      y: { nom: 'Longueur du ressort', sym: 'l', u: 'cm', min: 10, max: 30, ech: [[5, 5], [5, 2], [2, 4]] } }),
    f: p => x => p.l0 + p.s * x, penteU: 'cm·g⁻¹', penteConv: { fact: 10, unit: 'm·kg⁻¹' }, conv: { axis: 'x', fact: 0.001, unit: 'kg' }, xe: 260,
    origine: p => ({ texte: 'Quelle est la longueur du ressort à vide (m = 0) ?', val: p.l0 }) },
  { id: 'bouilloire', domaine: 'Transferts thermiques', type: 'courbe', tend: 'C',
    gen: () => ({ Te: tire([18, 20, 22, 24]), T0: tire([90, 95]), tau: tire([25, 35, 45]) }),
    titre: () => 'Refroidissement de l’eau d’une bouilloire',
    axes: () => ({
      x: { nom: 'Durée de refroidissement', sym: 't', u: 'min', min: 0, max: 60, ech: [[10, 5], [10, 2], [5, 5]] },
      y: { nom: 'Température de l’eau', sym: 'θ', u: '°C', min: 10, max: 100, ech: [[10, 5], [10, 2]] } }),
    f: p => x => p.Te + (p.T0 - p.Te) * Math.exp(-x / p.tau), conv: { axis: 'x', fact: 60, unit: 's' },
    origine: p => ({ texte: 'Quelle est la température de l’eau à l’instant initial (t = 0) ?', val: p.T0 }) },
  { id: 'titrage', domaine: 'Chimie', type: 'courbe', tend: 'D',
    gen: () => ({ Ve: tire([10, 12, 15, 18, 20]), w: tire([0.5, 0.8]) }),
    titre: () => 'Titrage d’un acide fort par la soude : suivi pH-métrique',
    axes: () => ({
      x: { nom: 'Volume de soude versé', sym: 'V', u: 'mL', min: 0, max: 30, ech: [[5, 5], [10, 5], [5, 5]] },
      y: { nom: 'Acidité de la solution', sym: 'pH', u: '', min: 0, max: 14, ech: [[2, 4], [2, 2], [1, 2]] } }),
    f: p => x => 7 + 5.8 * Math.tanh((x - p.Ve) / p.w), conv: { axis: 'x', fact: 1e-3, unit: 'L' },
    inverse: p => ({ y: 7, texte: 'Quel volume de soude a-t-on versé à l’équivalence ? (pour cet acide fort, pH = 7 à l’équivalence : milieu du saut de pH)', val: p.Ve }) },
  { id: 'capteur', domaine: 'Transmission de signaux numériques', type: 'courbe', tend: 'B',
    gen: () => ({ Ui: tire([0.5, 1]), Uf: tire([3, 4, 4.5]), tau: tire([1, 1.5, 2]), t0: 1 }),
    titre: () => 'Réponse d’un capteur à un échelon',
    axes: () => ({
      x: { nom: 'Temps', sym: 't', u: 's', min: 0, max: 10, ech: [[1, 5], [2, 4], [1, 2]] },
      y: { nom: 'Tension de sortie du capteur', sym: 'U', u: 'V', min: 0, max: 5, ech: [[1, 5], [1, 4], [0.5, 5]] } }),
    f: p => x => (x < p.t0 ? p.Ui : p.Uf - (p.Uf - p.Ui) * Math.exp(-(x - p.t0) / p.tau)), conv: { axis: 'y', fact: 1000, unit: 'mV' },
    origine: p => ({ texte: 'Quelle est la tension avant l’échelon (à t = 0) ?', val: p.Ui }),
    inverse: p => ({ y: p.Ui + 0.95 * (p.Uf - p.Ui), texte: 'À quel instant la tension a-t-elle atteint 95 % de sa variation totale (de la valeur initiale à la valeur finale) ?', val: p.t0 + p.tau * Math.log(20) }) },
  { id: 'pompe', domaine: 'Transport des fluides', type: 'courbe', tend: 'F',
    gen: () => ({ H0: tire([25, 30, 35]), Qm: tire([45, 50, 55]) }),
    titre: () => 'Caractéristique d’une pompe centrifuge',
    axes: () => ({
      x: { nom: 'Débit volumique', sym: 'Q', u: 'm³·h⁻¹', min: 0, max: 40, ech: [[10, 5], [10, 2], [5, 5]] },
      y: { nom: 'Hauteur manométrique', sym: 'H', u: 'm', min: 0, max: 40, ech: [[10, 5], [10, 2], [5, 5]] } }),
    f: p => x => p.H0 * (1 - (x / p.Qm) ** 2), conv: { axis: 'x', fact: 1000 / 3600, unit: 'L·s⁻¹' },
    origine: p => ({ texte: 'Quelle hauteur manométrique la pompe fournit-elle à débit nul (Q = 0) ?', val: p.H0 }) },
  { id: 'cinetique', domaine: 'Chimie', type: 'courbe', tend: 'C',
    gen: () => ({ c0: tire([12, 16, 18]), th: tire([100, 150, 200]) }),
    titre: () => 'Disparition d’un réactif au cours du temps',
    axes: () => ({
      x: { nom: 'Temps', sym: 't', u: 's', min: 0, max: 600, ech: [[100, 5], [100, 4], [50, 5]] },
      y: { nom: 'Concentration du réactif', sym: 'c', u: 'mmol·L⁻¹', min: 0, max: 20, ech: [[5, 5], [5, 2], [2, 4]] } }),
    f: p => x => p.c0 * Math.exp(-Math.LN2 * x / p.th), conv: { axis: 'x', fact: 1 / 60, unit: 'min' },
    origine: p => ({ texte: 'Quelle est la concentration du réactif à t = 0 ?', val: p.c0 }),
    inverse: p => ({ y: p.c0 / 2, texte: 'Lisez le temps de demi-réaction t½ : durée au bout de laquelle la concentration est divisée par 2.', val: p.th }) },
];

export const COMPETENCES = ['Identifier grandeurs, axes et unités', 'Lire sur le graphique (échelle, valeurs)', 'Interpréter l’allure de la courbe', 'Exploiter (pente, extrapolation)'];

const ALLURES = {
  A: 'y augmente proportionnellement à x (droite passant par l’origine)',
  B: 'y augmente de moins en moins vite, jusqu’à se stabiliser sur une valeur finale',
  C: 'y diminue de moins en moins vite, jusqu’à se stabiliser',
  D: 'y varie peu, puis très brusquement (saut), puis de nouveau peu',
  E: 'y augmente linéairement, mais ne vaut pas 0 quand x vaut 0',
  F: 'y diminue de plus en plus vite',
};
const melange = (a, rnd) => { const t = a.slice(); for (let i = t.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [t[i], t[j]] = [t[j], t[i]]; } return t; };

// Construit un graphique ; forceP et forceEch (indices dans ech) servent au parcours guidé
export function nouveauGraphique(id, forceP = null, forceEch = null) {
  const sc = SCENARIOS.find(s => s.id === id), p = forceP || sc.gen();
  const ax = sc.axes(p), choisir = (a, i) => { const [major, div] = a.ech[i ?? Math.floor(Math.random() * a.ech.length)]; return { ...a, major, div, minor: major / div }; };
  const x = choisir(ax.x, forceEch && forceEch[0]), y = choisir(ax.y, forceEch && forceEch[1]);
  const f = sc.f(p), graine = 1 + Math.floor(Math.random() * 99999), rnd = mulberry32(graine);
  let pts = [];
  if (sc.type === 'droite') {                                    // mesures : légèrement dispersées autour de la droite
    const n = 7; for (let i = 0; i < n; i++) { const xi = x.min + (x.max - x.min) * (0.06 + 0.88 * i / (n - 1) ); pts.push({ x: xi, y: f(xi) + (rnd() * 2 - 1) * 0.25 * y.minor }); }
  }
  return { id, sc, p, x, y, f, pts, graine, titre: sc.titre(p) };
}

const arrondiAu = (v, pas) => Math.round(v / pas) * pas;
const pasX = g => (g.x.max - g.x.min);
export const tolLecture = (g, x0) => 0.55 * g.y.minor + 0.25 * Math.abs(derivee(g.f, x0, pasX(g) * 1e-4)) * g.x.minor;
const aff = (v, ndec) => nb(v, ndec);

export function questions(g) {
  const { sc, p, x, y, f } = g, rnd = mulberry32(g.graine + 17), Q = [];
  const lib = a => `${a.nom} ${a.sym}${a.u ? `, en ${a.u}` : ' (sans unité)'}`;
  const dx = decimales(x.minor), dy = decimales(y.minor);
  // 1. grandeurs et unités des axes
  { const ax = rnd() < 0.5 ? x : y, autre = ax === x ? y : x;
    const bonne = lib(ax);
    const faux = [lib(autre), `${ax.nom} ${ax.sym}, en ${autre.u || 'mol·L⁻¹'}`, `${autre.nom} ${autre.sym}, en ${ax.u || 'mol·L⁻¹'}`]
      .filter((v, i, t) => t.indexOf(v) === i && v !== bonne).slice(0, 3);
    const opts = melange([bonne, ...faux], rnd);
    Q.push({ id: 'axe', comp: 0, type: 'qcm', q: `Que représente l’axe ${ax === x ? 'horizontal' : 'vertical'} ?`, options: opts, bonne: opts.indexOf(bonne),
      expl: `Le nom de la grandeur et son unité sont écrits le long de l’axe : ${lib(ax)}.` }); }
  // 2. échelle
  { const ax = rnd() < 0.5 ? x : y;
    Q.push({ id: 'ech', comp: 1, type: 'num', q: `Sur l’axe ${ax === x ? 'horizontal' : 'vertical'}, que vaut un petit carreau (la plus petite graduation) ?`, unite: ax.u, vrai: ax.minor, tol: ax.minor * 0.02,
      pieges: [[ax.major, `C’est l’écart entre deux grandes graduations (${nb(ax.major)}). Combien de petits carreaux y a-t-il entre elles ? (${ax.div})`]],
      aide: 'Repérez deux grandes graduations voisines, puis comptez les petits carreaux qui les séparent.', marques: [],
      expl: `Entre deux grandes graduations (${nb(ax.major)}), il y a ${ax.div} petits carreaux : ${nb(ax.major)} ÷ ${ax.div} = ${nb(ax.minor)}.` }); }
  // 3. lecture directe
  const bornes = (a, lo, hi) => { const n = Math.round((a.max - a.min) / a.minor); return a.min + a.minor * Math.max(1, Math.round(n * (lo + (hi - lo) * rnd()))); };
  { let x0 = bornes(x, 0.2, 0.8);
    for (let essai = 0; essai < 40 && ((sc.id === 'capteur' && x0 < p.t0 + 1) || tolLecture(g, x0) > 0.12 * (y.max - y.min)); essai++) x0 = bornes(x, 0.15, 0.85);   // pas de lecture là où la courbe est presque verticale
    const y0 = f(x0);
    Q.push({ id: 'lect', comp: 1, type: 'num', q: `Quelle est la valeur de ${y.sym} pour ${x.sym} = ${nb(x0)}${x.u ? ' ' + x.u : ''} ?`, unite: y.u, vrai: y0, tol: tolLecture(g, x0), dec: dy + 1,
      pieges: [], aide: `Placez-vous sur ${x.sym} = ${nb(x0)}, montez jusqu’à la courbe, puis lisez l’axe vertical.`, marques: [{ x: x0, y: y0 }],
      expl: `On part de ${x.sym} = ${nb(x0)} sur l’axe horizontal, on monte jusqu’à la courbe, puis on lit ${y.sym} ≈ ${aff(y0, dy + 1)}${y.u ? ' ' + y.u : ''}.` }); }
  // 4. lecture inverse
  { let y1, x1, texte;
    if (sc.inverse) { const c = sc.inverse(p); y1 = c.y; x1 = c.val; texte = c.texte; }
    else { let yy, essai = 0;
      do { const xa = bornes(x, 0.25, 0.7); yy = arrondiAu(f(xa), y.minor); if (yy <= y.min || yy >= y.max || yy >= Math.max(f(x.min), f(x.max)) - 0.3 * y.minor || yy <= Math.min(f(x.min), f(x.max)) + 0.3 * y.minor) yy = f(xa); x1 = resoudre(f, yy, x.min, x.max); essai++; }
      while (essai < 40 && (Math.abs(derivee(f, x1, pasX(g) * 1e-3)) < 1e-9 || 0.25 * y.minor / Math.abs(derivee(f, x1, pasX(g) * 1e-3)) > 1.5 * x.minor));   // pas de lecture là où la courbe est presque horizontale
      y1 = yy;
      texte = `Pour quelle valeur de ${x.sym} a-t-on ${y.sym} = ${nb(y1, dy)}${y.u ? ' ' + y.u : ''} ?`; }
    const sl = Math.max(Math.abs(derivee(f, x1, pasX(g) * 1e-3)), 1e-9);
    Q.push({ id: 'inv', comp: 1, type: 'num', q: texte, unite: x.u, vrai: x1, tol: 0.55 * x.minor + 0.25 * y.minor / sl, dec: dx + 1,
      pieges: [], aide: `Cette fois on part de l’axe vertical (${y.sym} = ${nb(y1, dy + 1)}), on va jusqu’à la courbe, puis on descend lire l’axe horizontal.`, marques: [{ x: x1, y: y1 }],
      expl: `On part de ${y.sym} = ${nb(y1, dy + 1)} sur l’axe vertical, on rejoint la courbe, puis on descend sur l’axe horizontal : ${x.sym} ≈ ${aff(x1, dx + 1)}${x.u ? ' ' + x.u : ''}.` }); }
  // 5. valeur à l’origine
  if (sc.origine) { const o = sc.origine(p);
    Q.push({ id: 'orig', comp: 1, type: 'num', q: o.texte, unite: y.u, vrai: o.val, tol: 0.55 * y.minor, dec: dy + 1,
      pieges: sc.id === 'ressort' ? [[y.min, `Attention : l’axe vertical ne commence pas à 0 mais à ${nb(y.min)} ${y.u}. Relisez la graduation de la ligne du bas.`]] : [],
      aide: `Regardez où la courbe coupe l’axe vertical (${x.sym} = 0). Attention à la graduation de départ de cet axe${y.min !== 0 ? ` : elle vaut ${nb(y.min)} et non 0` : ''}.`, marques: [{ x: 0, y: o.val }],
      expl: `En ${x.sym} = 0 la courbe est à ${y.sym} = ${nb(o.val)} ${y.u}${y.min !== 0 ? ` (l’axe vertical commence à ${nb(y.min)} et non à 0)` : ''}.` }); }
  // 6. lecture avec une grandeur exprimée dans une autre unité que celle de l’axe (seul « calcul » autorisé : une conversion)
  if (sc.conv) { const c = sc.conv, a = c.axis === 'x' ? x : y;
    let x0 = bornes(x, 0.2, 0.8);
    for (let essai = 0; essai < 40 && ((sc.id === 'capteur' && x0 < p.t0 + 1) || tolLecture(g, x0) > 0.12 * (y.max - y.min)); essai++) x0 = bornes(x, 0.15, 0.85);
    let y0;
    if (c.axis === 'x') {
      const xv = Number((x0 * c.fact).toPrecision(2)); x0 = xv / c.fact; y0 = f(x0);   // valeur « ronde » dans l’unité demandée
      Q.push({ id: 'lectAlt', comp: 1, type: 'num', q: `Quelle est la valeur de ${y.sym} pour ${x.sym} = ${nb(xv)} ${c.unit} ?`, unite: y.u, vrai: y0, tol: tolLecture(g, x0), dec: dy + 1,
        pieges: [], aide: `L’axe horizontal est gradué en ${x.u}. Convertissez d’abord ${nb(xv)} ${c.unit} en ${x.u} (1 ${x.u} = ${nb(c.fact)} ${c.unit}), puis lisez la courbe.`, marques: [{ x: x0, y: y0 }],
        expl: `${nb(xv)} ${c.unit} correspond à ${nb(Number(x0.toPrecision(4)))} ${x.u} (car 1 ${x.u} = ${nb(c.fact)} ${c.unit}). On lit ensuite ${y.sym} ≈ ${aff(y0, dy + 1)}${y.u ? ' ' + y.u : ''}.` });
    } else {
      y0 = f(x0);
      Q.push({ id: 'lectAlt', comp: 1, type: 'num', q: `Quelle est la valeur de ${y.sym} pour ${x.sym} = ${nb(x0)}${x.u ? ' ' + x.u : ''} ? Donnez le résultat en ${c.unit}.`, unite: c.unit, vrai: y0 * c.fact, tol: tolLecture(g, x0) * c.fact, dec: dy + 1,
        pieges: [[y0, `Vous avez lu ${y.sym} en ${y.u}, unité de l’axe. Convertissez-le en ${c.unit} (1 ${y.u} = ${nb(c.fact)} ${c.unit}).`]], aide: `Lisez d’abord ${y.sym} en ${y.u} sur l’axe vertical, puis convertissez en ${c.unit} : 1 ${y.u} = ${nb(c.fact)} ${c.unit}.`, marques: [{ x: x0, y: y0 }],
        expl: `On lit ${y.sym} ≈ ${aff(y0, dy + 1)} ${y.u}, soit ${aff(y0, dy + 1)} × ${nb(c.fact)} ≈ ${nb(y0 * c.fact)} ${c.unit}.` });
    } }
  // 8. allure et proportionnalité
  { const bonne = ALLURES[sc.tend], autres = Object.entries(ALLURES).filter(([c]) => c !== sc.tend).map(([, v]) => v);
    const opts = melange([bonne, ...melange(autres, rnd).slice(0, 3)], rnd);
    Q.push({ id: 'allure', comp: 2, type: 'qcm', q: 'Comment la grandeur y évolue-t-elle quand x augmente ?', options: opts, bonne: opts.indexOf(bonne), expl: `Réponse : ${bonne}.` }); }
  if (sc.type === 'droite') {
    const O = ['Oui : c’est une droite qui passe par le point (0 ; 0)', 'Non : la droite ne passe pas par le point (0 ; 0)', 'Oui : toute droite représente une proportionnalité', 'Impossible à dire sans calculer'];
    Q.push({ id: 'prop', comp: 2, type: 'qcm', q: 'La grandeur y est-elle proportionnelle à x ?', options: O, bonne: sc.prop ? 0 : 1,
      expl: sc.prop ? 'Oui : la droite passe par l’origine (0 ; 0). Une droite qui ne passe pas par l’origine n’est pas une proportionnalité.'
        : `Non : pour x = 0, y ne vaut pas 0 (et l’axe vertical ne commence pas à 0 : regardez la graduation du bas). Une droite qui ne passe pas par l’origine n’est pas une proportionnalité.` }); }
  return Q;
}

// Vérifie une réponse numérique : { ok, msg }
export function verifierNum(q, x) {
  if (!isFinite(x)) return { ok: false, msg: 'Entrez une valeur numérique (virgule ou point).' };
  if (Math.abs(x - q.vrai) <= q.tol) return { ok: true, msg: '' };
  const pg = (q.pieges || []).find(([v]) => Math.abs(x - v) <= Math.max(q.tol, Math.abs(v) * 0.03));
  if (pg) return { ok: false, msg: pg[1] };
  if (q.vrai && x !== 0) { const r = Math.log10(Math.abs(x / q.vrai)); if (Math.abs(r - Math.round(r)) < 0.03 && Math.round(r) !== 0) return { ok: false, msg: 'Problème de puissance de 10 : vérifiez les unités.' }; }
  if (Math.abs(x - q.vrai) <= 3 * q.tol) return { ok: false, msg: x > q.vrai ? 'Presque, mais un peu trop grand : relisez plus précisément les graduations.' : 'Presque, mais un peu trop petit : relisez plus précisément les graduations.' };
  return { ok: false, msg: '' };
}
