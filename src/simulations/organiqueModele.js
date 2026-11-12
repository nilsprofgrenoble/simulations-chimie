// ====================================================
//  MODÈLE « NOMENCLATURE ORGANIQUE » (1re spé, chapitre « La chimie organique »)
//  Composés à chaîne carbonée SATURÉE, de 1 à 6 atomes de carbone dans la chaîne principale :
//   • alcanes (linéaires ou ramifiés, substituants méthyle et éthyle, deux au plus) ;
//   • composés à UN SEUL groupe caractéristique : alcool, aldéhyde, cétone, acide carboxylique (chaîne linéaire).
//  Hors programme, volontairement absent : alcènes, cycles, amines, composés polyfonctionnels, stéréochimie.
//
//  Une molécule est décrite par  { n, subs: [{ pos, L }], g: null | { t, pos } }
//    n    : nombre d'atomes de carbone de la chaîne principale
//    subs : substituants alkyle (L = 1 : méthyle, L = 2 : éthyle) portés par le carbone n° pos
//    g    : groupe caractéristique, t ∈ 'OH' (alcool), 'CHO' (aldéhyde), 'CO' (cétone), 'COOH' (acide carboxylique)
//  Deux calculs indépendants du nom (voir le test) : nom(m), construit à partir de la description,
//  et nomDepuisSchema(schema(m)), qui retrouve le nom à partir du DESSIN (atomes et liaisons) en appliquant la méthode du cours.
// ====================================================

export const PREF = ['méth', 'éth', 'prop', 'but', 'pent', 'hex'];
export const N_MAX = PREF.length;
export const NOM_SUB = { 1: 'méthyl', 2: 'éthyl' };
const DI = ['', '', 'di', 'tri'];
export const sansAccent = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

export const GROUPES = {
  OH: { cle: 'hydroxyle', nom: 'hydroxyle', ecrit: '–OH', famille: 'alcool' },
  CHO: { cle: 'carbonyle', nom: 'carbonyle', ecrit: 'C=O', famille: 'aldehyde' },
  CO: { cle: 'carbonyle', nom: 'carbonyle', ecrit: 'C=O', famille: 'cetone' },
  COOH: { cle: 'carboxyle', nom: 'carboxyle', ecrit: '–COOH', famille: 'acide' },
};
export const FAMILLES = {
  alcane: 'alcane', alcool: 'alcool', aldehyde: 'aldéhyde', cetone: 'cétone', acide: 'acide carboxylique',
};

// ---------- fabrique et forme canonique ----------
export const mol = (n, opts = {}) => ({ n, subs: opts.subs || [], g: opts.g || null });
export const alcane = (n, subs = []) => mol(n, { subs });
export const alcool = (n, pos = 1) => mol(n, { g: { t: 'OH', pos } });
export const aldehyde = n => mol(n, { g: { t: 'CHO', pos: 1 } });
export const cetone = (n, pos = 2) => mol(n, { g: { t: 'CO', pos } });
export const acide = n => mol(n, { g: { t: 'COOH', pos: 1 } });

const cmpTab = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) - (b[i] ?? 0); } return 0; };
const nomSub = L => NOM_SUB[L];
const alpha = (a, b) => (sansAccent(a) < sansAccent(b) ? -1 : sansAccent(a) > sansAccent(b) ? 1 : 0);
// locants dans l'ordre alphabétique des substituants (pour départager deux numérotations)
const locantsAlpha = subs => [...subs].sort((x, y) => alpha(nomSub(x.L), nomSub(y.L)) || x.pos - y.pos).map(s => s.pos);
const locantsTries = subs => subs.map(s => s.pos).sort((a, b) => a - b);

export function canonique(m) {
  const n = m.n;
  if (m.g) {
    const { t, pos } = m.g;
    if (t === 'CHO' || t === 'COOH') return { n, subs: [], g: { t, pos: 1 } };
    return { n, subs: [], g: { t, pos: Math.min(pos, n + 1 - pos) } };
  }
  const miroir = m.subs.map(s => ({ ...s, pos: n + 1 - s.pos }));
  const c = cmpTab(locantsTries(m.subs), locantsTries(miroir)) || cmpTab(locantsAlpha(m.subs), locantsAlpha(miroir));
  const subs = (c <= 0 ? m.subs : miroir).map(s => ({ ...s })).sort((x, y) => x.pos - y.pos || x.L - y.L);
  return { n, subs, g: null };
}

// ---------- nom construit ----------
function prefixeSubs(subs) {
  const groupes = new Map();
  for (const s of subs) groupes.set(s.L, [...(groupes.get(s.L) || []), s.pos]);
  return [...groupes.entries()].sort((a, b) => alpha(nomSub(a[0]), nomSub(b[0])))
    .map(([L, ps]) => `${ps.sort((a, b) => a - b).join(',')}-${DI[ps.length]}${nomSub(L)}`).join('-');
}
function assembler(n, subs, g, loc) {
  const base = PREF[n - 1];
  if (!g) return (subs.length ? prefixeSubs(subs) : '') + base + 'ane';
  if (g === 'OH') return base + 'an' + (n >= 3 ? `-${loc}-` : '') + 'ol';
  if (g === 'CHO') return base + 'anal';
  if (g === 'CO') return base + 'an' + (n >= 5 ? `-${loc}-` : '') + 'one';
  return 'acide ' + base + 'anoïque';
}
export function nom(m0) { const m = canonique(m0); return assembler(m.n, m.subs, m.g && m.g.t, m.g && m.g.pos); }

// Noms acceptés à la saisie : le nom du cours, et la forme avec numéro explicite pour propanone et butanone
export function nomsAcceptes(m0) {
  const m = canonique(m0), liste = [nom(m)];
  if (m.g && m.g.t === 'CO' && m.n <= 4) liste.push(PREF[m.n - 1] + `an-${m.g.pos}-one`);
  return liste;
}

// ---------- schéma : atomes, liaisons, positions de la formule semi-développée ----------
//  ligne (row) : 0 = chaîne principale ; négatif = au-dessus ; positif = en dessous
export function schema(m0, flip0 = false, exact = false) {
  // Convention d'écriture (forme canonique) : un groupe en bout de chaîne s'écrit à droite (CH₃–CH₂–OH, CH₃–CHO, CH₃–COOH)
  const flip = !exact && m0.g && (m0.g.t === 'CHO' || m0.g.t === 'COOH' || (m0.g.t === 'OH' && m0.g.pos === 1 && m0.n > 1)) ? !flip0 : flip0;
  // exact : on dessine la molécule telle qu'elle est décrite (carbone n° 1 à gauche), sans la renuméroter ; sinon forme canonique
  const m = exact ? { n: m0.n, subs: m0.subs.map(s => ({ ...s })), g: m0.g ? { ...m0.g } : null } : canonique(m0), n = m.n;
  const noeuds = [], liaisons = [];
  const add = (el, col, row, extra = {}) => { const nd = { id: noeuds.length, el, col, row, ...extra }; noeuds.push(nd); return nd; };
  const lie = (a, b, ordre = 1) => liaisons.push({ a: a.id, b: b.id, ordre });
  const t = m.g && m.g.t;
  // atomes terminaux écrits dans le prolongement de la chaîne (un par côté au plus)
  const coteDe = k => (n === 1 || k === 1 ? (flip ? 'd' : 'g') : (flip ? 'g' : 'd'));
  const autreCote = c => (c === 'g' ? 'd' : 'g');
  const terminaux = [];                                     // { k : carbone portant l'atome, sym, cote }
  if (t === 'OH' && (m.g.pos === 1 || m.g.pos === n)) terminaux.push({ k: m.g.pos, sym: 'OH', cote: coteDe(m.g.pos) });
  if (t === 'CHO') { terminaux.push({ k: 1, sym: 'H', cote: coteDe(1) }); if (n === 1) terminaux.push({ k: 1, sym: 'H', cote: autreCote(coteDe(1)) }); }
  if (t === 'COOH') { terminaux.push({ k: 1, sym: 'OH', cote: coteDe(1) }); if (n === 1) terminaux.push({ k: 1, sym: 'H', cote: autreCote(coteDe(1)) }); }
  const nbGauche = terminaux.filter(x => x.cote === 'g').length, nbDroite = terminaux.filter(x => x.cote === 'd').length;
  const colDe = k => nbGauche + (flip ? n - k : k - 1);
  const C = [];
  for (let k = 1; k <= n; k++) C[k] = add('C', colDe(k), 0, { num: k });
  for (let k = 1; k < n; k++) lie(C[k], C[k + 1]);
  for (const x of terminaux) {
    const col = x.cote === 'g' ? 0 : nbGauche + n;
    lie(C[x.k], x.sym === 'OH' ? add('O', col, 0) : add('H', col, 0));
  }
  if (t === 'OH' && !(m.g.pos === 1 || m.g.pos === n)) lie(C[m.g.pos], add('O', colDe(m.g.pos), 1));
  if (t === 'CHO' || t === 'COOH') lie(C[1], add('O', colDe(1), -1), 2);
  if (t === 'CO') lie(C[m.g.pos], add('O', colDe(m.g.pos), -1), 2);
  m.subs.forEach((s, i) => {
    const cote = i % 2 === 0 ? -1 : 1;
    let prec = C[s.pos];
    for (let j = 1; j <= s.L; j++) { const x = add('C', colDe(s.pos), cote * j, { sub: true }); lie(prec, x); prec = x; }
  });
  // hydrogènes implicites : un carbone fait 4 liaisons, un oxygène 2
  const somme = new Array(noeuds.length).fill(0);
  for (const l of liaisons) { somme[l.a] += l.ordre; somme[l.b] += l.ordre; }
  for (const nd of noeuds) {
    nd.h = nd.el === 'C' ? 4 - somme[nd.id] : nd.el === 'O' ? 2 - somme[nd.id] : 1 - somme[nd.id];
    nd.lab = nd.el === 'C' ? 'C' + (nd.h > 0 ? 'H' + (nd.h > 1 ? nd.h : '') : '') : nd.el === 'O' ? (nd.h > 0 ? 'OH' : 'O') : 'H';
  }
  // un hydroxyle écrit à gauche de son carbone s'écrit « HO » (HO–CH₂–…)
  for (const nd of noeuds) {
    if (nd.el === 'O' && nd.h === 1 && nd.row === 0) {
      const l = liaisons.find(x => x.a === nd.id || x.b === nd.id), v = noeuds[l.a === nd.id ? l.b : l.a];
      if (v.col > nd.col) nd.lab = 'HO';
    }
  }
  return { noeuds, liaisons, cols: nbGauche + n + nbDroite, mol: m };
}

export function brute(m) {
  const s = schema(m);
  let C = 0, H = 0, O = 0;
  for (const nd of s.noeuds) { if (nd.el === 'C') { C++; H += nd.h; } else if (nd.el === 'O') { O++; H += nd.h; } else H++; }
  return { C, H, O };
}
const sub = d => String.fromCharCode(0x2080 + d);
const indices = k => String(k).split('').map(x => sub(+x)).join('');
export function brutePourAffichage(m) { const { C, H, O } = brute(m); return [['C', C], ['H', H], ['O', O]].filter(x => x[1] > 0); }
// formule brute en caractères (indices Unicode), pour les énoncés d'exercices
export const brUnicode = m => brutePourAffichage(m).map(([e, k]) => e + (k > 1 ? indices(k) : '')).join('');

// Écriture linéaire de la formule semi-développée (exercices, étiquettes) : CH₃–CH(CH₃)–CH₂–CH₃
export function lineaire(m0) {
  const s = schema(m0), m = s.mol, n = m.n, t = m.g && m.g.t;
  const lab = nd => nd.lab.replace(/H(\d)/, (_, d) => 'H' + indices(d));
  const chaine = [];
  for (let k = 1; k <= n; k++) {
    const nd = s.noeuds.find(x => x.el === 'C' && x.num === k);
    let txt = lab(nd);
    if (t === 'CHO' && k === 1) txt = n === 1 ? 'HCHO' : 'CHO';
    else if (t === 'COOH' && k === 1) txt = n === 1 ? 'HCOOH' : 'COOH';
    else if (t === 'CO' && k === m.g.pos) txt = 'CO';
    else if (t === 'OH' && k === m.g.pos && m.g.pos > 1) txt = lab(nd) + '(OH)';
    else if (t === 'OH' && m.g.pos === 1 && k === 1) txt = lab(nd) + '–OH';
    const sb = m.subs.filter(x => x.pos === k);
    if (sb.length) {
      const brs = sb.map(x => (x.L === 1 ? 'CH' + indices(3) : 'CH' + indices(2) + '–CH' + indices(3)));
      txt = (nd.h === 0 ? 'C' : 'CH') + brs.map(b => `(${b})`).join('');
    }
    chaine.push(txt);
  }
  // un groupe en bout de chaîne (carbone n° 1) est écrit à droite : on lit alors la chaîne du carbone n à 1
  const bout = t === 'CHO' || t === 'COOH' || (t === 'OH' && m.g.pos === 1);
  const sequence = bout ? [...chaine].reverse() : chaine;
  return sequence.join('–');
}

// ---------- famille, chaîne ----------
export function famille(m0) {
  const m = canonique(m0);
  if (!m.g) return { cle: 'alcane', nom: FAMILLES.alcane, groupe: null };
  const g = GROUPES[m.g.t];
  return { cle: g.famille, nom: FAMILLES[g.famille], groupe: g };
}
export const chaineLineaire = m => canonique(m).subs.length === 0;
export const nbCarbones = m => { const c = canonique(m); return c.n + c.subs.reduce((s, x) => s + x.L, 0); };
export const aGroupe = m => !!m.g;

// ---------- nom retrouvé à partir du dessin (méthode du cours) ----------
//  1. chaîne principale : la plus longue chaîne carbonée (celle qui porte le groupe caractéristique, s'il y en a un) ;
//  2. numérotation : le groupe, puis les substituants, aux plus petits numéros ; 3. noms des substituants ;
//  4. assemblage ; 5. ordre alphabétique des substituants.
export function nomDepuisSchema(s) {
  const nd = s.noeuds, carb = nd.filter(x => x.el === 'C');
  const voisins = new Map(nd.map(x => [x.id, []]));
  for (const l of s.liaisons) { voisins.get(l.a).push([l.b, l.ordre]); voisins.get(l.b).push([l.a, l.ordre]); }
  const voisinsC = id => voisins.get(id).filter(([j]) => nd[j].el === 'C').map(([j]) => j);
  // groupe caractéristique
  let groupe = null, gc = null;
  for (const c of carb) {
    const vs = voisins.get(c.id);
    const dbl = vs.some(([j, o]) => nd[j].el === 'O' && o === 2);
    const oh = vs.some(([j, o]) => nd[j].el === 'O' && o === 1 && nd[j].h === 1);
    const hExpl = vs.some(([j]) => nd[j].el === 'H');
    if (dbl) { groupe = oh ? 'COOH' : (hExpl || voisinsC(c.id).length <= 1) ? 'CHO' : 'CO'; gc = c.id; }
    else if (oh) { groupe = 'OH'; gc = c.id; }
  }
  // tous les chemins simples du squelette carboné (arbre)
  const chemins = [];
  const parcourir = chemin => {
    chemins.push([...chemin]);
    for (const j of voisinsC(chemin[chemin.length - 1])) if (!chemin.includes(j)) { chemin.push(j); parcourir(chemin); chemin.pop(); }
  };
  for (const c of carb) parcourir([c.id]);
  const orientes = [];
  for (const ch of chemins) { orientes.push(ch); if (ch.length > 1) orientes.push([...ch].reverse()); }
  let valides = orientes.filter(ch => gc == null || ch.includes(gc));
  if (groupe === 'CHO' || groupe === 'COOH') valides = valides.filter(ch => ch[0] === gc);
  const L = Math.max(...valides.map(ch => ch.length));
  const taille = (id, depuis) => { let k = 1, lineaire = true; const rec = (x, p) => { const f = voisinsC(x).filter(j => j !== p); if (f.length > 1) lineaire = false; for (const j of f) { k++; rec(j, x); } }; rec(id, depuis); return { k, lineaire }; };
  const candidats = valides.filter(ch => ch.length === L).map(ch => {
    const subs = [];
    ch.forEach((id, i) => { for (const j of voisinsC(id)) if (!ch.includes(j)) { const { k, lineaire } = taille(j, id); subs.push({ pos: i + 1, L: k, ok: lineaire && k <= 2 }); } });
    return { ch, subs, gl: gc == null ? 0 : ch.indexOf(gc) + 1 };
  });
  const rang = (a, b) => (b.subs.length - a.subs.length) || (a.gl - b.gl)
    || cmpTab(locantsTries(a.subs), locantsTries(b.subs)) || cmpTab(locantsAlpha(a.subs.filter(x => x.ok)), locantsAlpha(b.subs.filter(x => x.ok)));
  candidats.sort(rang);
  const meilleur = candidats[0];
  if (meilleur.subs.some(x => !x.ok)) return { nom: null, longueur: L, chemin: meilleur.ch };
  return { nom: assembler(L, meilleur.subs, groupe, meilleur.gl), longueur: L, groupe, chemin: meilleur.ch };
}

// ---------- catalogue de toutes les molécules du programme ----------
const cle = m => nom(m);
function enumererAlcanes() {
  const vus = new Map();
  const essai = (n, subs) => {
    const m = canonique(alcane(n, subs)), k = cle(m);
    if (vus.has(k)) return;
    const d = nomDepuisSchema(schema(m));
    if (d.nom === k && d.longueur === n) vus.set(k, m);
  };
  for (let n = 1; n <= N_MAX; n++) {
    essai(n, []);
    for (let p1 = 2; p1 < n; p1++) for (let L1 = 1; L1 <= 2; L1++) {
      essai(n, [{ pos: p1, L: L1 }]);
      for (let p2 = p1; p2 < n; p2++) for (let L2 = 1; L2 <= 2; L2++) { if (p2 === p1 && L2 < L1) continue; essai(n, [{ pos: p1, L: L1 }, { pos: p2, L: L2 }]); }
    }
  }
  return [...vus.values()];
}
const ALCANES = enumererAlcanes();
export const BANQUE = {
  lineaires: ALCANES.filter(m => m.subs.length === 0),
  ramifies: ALCANES.filter(m => m.subs.length > 0),
  alcools: [], aldehydes: [], cetones: [], acides: [],
};
for (let n = 1; n <= N_MAX; n++) {
  for (let p = 1; p <= Math.ceil(n / 2); p++) BANQUE.alcools.push(alcool(n, p));
  BANQUE.aldehydes.push(aldehyde(n));
  BANQUE.acides.push(acide(n));
  if (n >= 3) for (let p = 2; p <= Math.floor((n + 1) / 2); p++) BANQUE.cetones.push(cetone(n, p));
}
export const TOUS = [...BANQUE.lineaires, ...BANQUE.ramifies, ...BANQUE.alcools, ...BANQUE.aldehydes, ...BANQUE.cetones, ...BANQUE.acides];
export const avecGroupe = [...BANQUE.alcools, ...BANQUE.aldehydes, ...BANQUE.cetones, ...BANQUE.acides];
const PAR_NOM = new Map(TOUS.map(m => [nom(m), m]));
export const retrouver = n => PAR_NOM.get(n) || null;
export const memeMolecule = (a, b) => nom(a) === nom(b);

// ---------- vérification d'une saisie ----------
const normaliser = s => sansAccent(String(s).toLowerCase()).replace(/[‐-―_]/g, '-').replace(/[’'`]/g, '')
  .replace(/\s*-\s*/g, '-').replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ').trim();
const sansPonct = s => s.replace(/[\s,-]/g, '');
// 'ok' : nom juste ; 'ponctuation' : bon nom, mais tirets, virgules ou espaces à revoir ; 'faux'
export function comparerNom(saisie, m) {
  const x = normaliser(saisie || ''); if (!x) return 'faux';
  const acceptes = nomsAcceptes(m).map(normaliser);
  if (acceptes.includes(x)) return 'ok';
  if (acceptes.some(a => sansPonct(a) === sansPonct(x))) return 'ponctuation';
  return 'faux';
}
// Formule brute saisie : « C5H10O », « C₅H₁₀O », « C5 H10 O », ordre libre
export function lireBrute(saisie) {
  const s = String(saisie || '').replace(/[₀-₉]/g, c => String(c.charCodeAt(0) - 0x2080)).replace(/\s+/g, '').toUpperCase();
  if (!s || !/^([CHO]\d*)+$/.test(s)) return null;
  const r = { C: 0, H: 0, O: 0 };
  for (const [, e, k] of s.matchAll(/([CHO])(\d*)/g)) r[e] += k === '' ? 1 : +k;
  return r;
}
export function comparerBrute(saisie, m) {
  const x = lireBrute(saisie), b = brute(m);
  return !!x && x.C === b.C && x.H === b.H && x.O === b.O;
}

// ---------- fausses réponses plausibles (QCM) : [nom, raison de l'erreur] ----------
export function mauvaisNoms(m0) {
  const m = canonique(m0), bon = nom(m), exclus = new Set(nomsAcceptes(m).map(normaliser)), n = m.n, res = [];
  const ajoute = (x, raison) => { if (x && !exclus.has(normaliser(x)) && !res.some(r => normaliser(r[0]) === normaliser(x))) res.push([x, raison]); };
  const t = m.g && m.g.t;
  if (!m.g) {
    if (m.subs.length) {
      const miroir = m.subs.map(s => ({ ...s, pos: n + 1 - s.pos }));
      ajoute(assembler(n, miroir.sort((a, b) => a.pos - b.pos), null), 'la chaîne est numérotée dans le mauvais sens : les numéros doivent être les plus petits possible');
      if (m.subs.length === 2 && m.subs[0].L === m.subs[1].L) ajoute(`${m.subs.map(s => s.pos).join(',')}-${nomSub(m.subs[0].L)}${PREF[n - 1]}ane`, 'deux substituants identiques : il faut le préfixe « di »');
      if (m.subs.length === 2 && m.subs[0].L !== m.subs[1].L) {
        const [a, b] = [...m.subs].sort((x, y) => alpha(nomSub(y.L), nomSub(x.L)));
        ajoute(`${a.pos}-${nomSub(a.L)}-${b.pos}-${nomSub(b.L)}${PREF[n - 1]}ane`, 'les substituants doivent être cités dans l’ordre alphabétique');
      }
      ajoute(assembler(n, m.subs.map(s => ({ ...s, L: 3 - s.L })), null), 'confusion entre méthyle (1 C) et éthyle (2 C)');
      ajoute(prefixeSubs(m.subs).replace(/^\d+(,\d+)*-/, '') + PREF[n - 1] + 'ane', 'le numéro du carbone qui porte le substituant est oublié');
      if (n > 3) ajoute(assembler(n - 1, m.subs, null), 'la chaîne principale est mal comptée (elle doit être la plus longue)');
      if (n < N_MAX) ajoute(assembler(n + 1, m.subs, null), 'la chaîne principale est mal comptée (elle doit être la plus longue)');
    } else {
      if (n > 1) ajoute(PREF[n - 2] + 'ane', 'un atome de carbone a été oublié dans le comptage');
      if (n < N_MAX) ajoute(PREF[n] + 'ane', 'un atome de carbone de trop a été compté');
      ajoute(PREF[n - 1] + 'anol', 'la terminaison « -ol » est celle des alcools : cette molécule n’a pas de groupe caractéristique');
    }
  } else {
    const pos = m.g.pos, autres = { OH: 'ol', CHO: 'al', CO: 'one', COOH: 'oïque' };
    const fam = { OH: 'alcools', CHO: 'aldéhydes', CO: 'cétones', COOH: 'acides carboxyliques' };
    const comme = (g, p) => assembler(n, [], g, p);
    for (const g of ['OH', 'CHO', 'CO', 'COOH']) if (g !== t && !(g === 'CO' && n < 3)) ajoute(comme(g, g === 'CO' ? 2 : 1), `la terminaison « ${g === 'COOH' ? '-oïque' : '-' + autres[g]} » est celle des ${fam[g]}, pas celle des ${fam[t]}`);
    if (t === 'OH' && n >= 3) ajoute(comme('OH', n + 1 - pos), 'la chaîne est numérotée dans le mauvais sens : le groupe –OH doit avoir le plus petit numéro');
    if (t === 'OH' && n >= 3 && pos === 1) ajoute(comme('OH', 2), 'le groupe –OH est en bout de chaîne : numéro 1');
    if (t === 'CO' && n >= 5) ajoute(comme('CO', n + 1 - pos), 'la chaîne est numérotée dans le mauvais sens : le groupe C=O doit avoir le plus petit numéro');
    if (n > 1) ajoute(assembler(n - 1, [], t, Math.min(pos, n - 1)), 'un atome de carbone a été oublié dans le comptage');
    if (n < N_MAX) ajoute(assembler(n + 1, [], t, pos), 'un atome de carbone de trop a été compté');
    if (t === 'COOH') ajoute(PREF[n - 1] + 'anoïque', 'le mot « acide » est oublié');
    if (t === 'COOH') ajoute('acide ' + PREF[n - 1] + 'anal', 'la terminaison « -al » est celle des aldéhydes');
  }
  return res.filter(r => r[0] !== bon);
}

// ---------- remise en forme d'un mauvais dessin : molécules « proches » pour « du nom à la formule » ----------
//  Renvoie des molécules différentes de m (même nombre de carbones si possible) : autres numéros, autre famille…
export function moleculesProches(m0) {
  const m = canonique(m0), res = [], vus = new Set([nom(m)]);
  const ajoute = x => { const c = canonique(x); const k = nom(c); if (!vus.has(k) && TOUS.some(y => nom(y) === k)) { vus.add(k); res.push(c); } };
  if (!m.g) {
    const memeC = nbCarbones(m);
    for (const x of TOUS) if (!x.g && nbCarbones(x) === memeC && nom(x) !== nom(m)) ajoute(x);
    if (!res.length) { if (m.n > 1) ajoute(alcane(m.n - 1)); if (m.n < N_MAX) ajoute(alcane(m.n + 1)); }
  } else {
    const t = m.g.t, n = m.n;
    if (t === 'OH') { if (n >= 3) for (let p = 1; p <= Math.ceil(n / 2); p++) if (p !== m.g.pos) ajoute(alcool(n, p)); ajoute(aldehyde(n)); if (n >= 3) ajoute(cetone(n)); ajoute(acide(n)); }
    if (t === 'CHO') { ajoute(alcool(n, 1)); if (n >= 3) ajoute(cetone(n)); ajoute(acide(n)); }
    if (t === 'CO') { for (let p = 2; p <= Math.floor((n + 1) / 2); p++) if (p !== m.g.pos) ajoute(cetone(n, p)); ajoute(aldehyde(n)); ajoute(alcool(n, 2)); }
    if (t === 'COOH') { ajoute(aldehyde(n)); ajoute(alcool(n, 1)); if (n >= 3) ajoute(cetone(n)); }
    if (res.length < 3) { if (n > 1) ajoute(mol(n - 1, { g: { ...m.g, pos: Math.min(m.g.pos, n - 1) } })); if (n < N_MAX) ajoute(mol(n + 1, { g: m.g })); }
  }
  // petites molécules : on complète avec la même famille et une chaîne plus courte ou plus longue
  for (const d of [1, -1, 2, -2, 3, -3]) {
    if (res.length >= 3) break;
    const k = m.n + d; if (k < 1 || k > N_MAX) continue;
    ajoute(m.g ? mol(k, { g: { ...m.g, pos: Math.min(m.g.pos, Math.ceil(k / 2)) } }) : alcane(k));
  }
  return res;
}
