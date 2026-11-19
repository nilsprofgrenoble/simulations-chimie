// ====================================================
//  MODÈLE « FAMILLES FONCTIONNELLES ET POLYMÈRES » (TG, « Élaborer des stratégies en synthèse organique », structure et propriétés)
//  Espèces simples du programme, à chaîne carbonée LINÉAIRE saturée :
//   • esters (R–CO–O–R′), amines (primaires, secondaires, tertiaires), amides (non substitués ou N-substitués), halogénoalcanes (chloro, bromo) ;
//   • rappels de première (alcools, acides carboxyliques, aldéhyde, cétone) pour les comparaisons.
//  Polymères idéalisés à chaîne régulière : polyéthylène, poly(chlorure de vinyle), polypropylène, polystyrène (motif écrit entre crochets, avec n).
//  Hors périmètre : stéréoisomérie, mécanismes, synthèses multi-étapes, polymères à plusieurs monomères.
//
//  Une molécule est un GRAPHE { atoms: [{ el, x, y }], bonds: [[a, b, ordre]] } (coordonnées en longueurs de liaison, y vers le bas).
//  Tout le reste est CALCULÉ à partir du graphe (hydrogènes implicites, formule brute, formule semi-développée, groupes caractéristiques,
//  nom) : le test vérifie que ces calculs concordent avec les noms et formules écrits à la main dans le catalogue.
// ====================================================

export const VALENCE = { C: 4, N: 3, O: 2, Cl: 1, Br: 1 };
const U = Math.sqrt(3) / 2;                              // abscisse d'un pas de zigzag (liaison de longueur 1, angle de 120°)
const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
export const indice = n => String(n).split('').map(c => SUB[c] ?? c).join('');
const PREF = ['', 'méth', 'éth', 'prop', 'but', 'pent', 'hex'];
const ALK = ['', 'méthyl', 'éthyl', 'propyl', 'butyl', 'pentyl'];

// ---------- construction d'un graphe : chaîne en zigzag + substituants verticaux ----------
// els : éléments de la chaîne principale ; brs : [[indice du sommet, élément, ordre de liaison]] ; un substituant sort verticalement, du côté extérieur du zigzag
export function chaine(els, brs = []) {
  const atoms = els.map((el, i) => ({ el, x: i * U, y: i % 2 === 0 ? 0.5 : 0 }));
  const bonds = [];
  for (let i = 0; i + 1 < els.length; i++) bonds.push([i, i + 1, 1]);
  for (const [i, el, ordre = 1] of brs) {
    atoms.push({ el, x: atoms[i].x, y: atoms[i].y + (i % 2 === 0 ? 1 : -1) });
    bonds.push([i, atoms.length - 1, ordre]);
  }
  return { atoms, bonds, nChaine: els.length };
}

// ---------- hydrogènes implicites, formule brute, formule semi-développée ----------
export function nbH(g, i) {
  const s = g.bonds.filter(b => b[0] === i || b[1] === i).reduce((t, b) => t + b[2], 0);
  return VALENCE[g.atoms[i].el] - s;
}
export function valide(g) { return g.atoms.every((_, i) => nbH(g, i) >= 0 && (g.atoms[i].el === 'C' || g.atoms[i].el === 'N' || g.atoms[i].el === 'O' || nbH(g, i) === 0)); }
export function compte(g) {
  const c = {};
  g.atoms.forEach((a, i) => { c[a.el] = (c[a.el] || 0) + 1; c.H = (c.H || 0) + nbH(g, i); });
  return c;
}
export function brute(g) {
  const c = compte(g);
  const ordre = ['C', 'H', ...Object.keys(c).filter(e => e !== 'C' && e !== 'H').sort()];
  return ordre.filter(e => c[e]).map(e => e + (c[e] > 1 ? indice(c[e]) : '')).join('');
}
const voisins = (g, i) => g.bonds.filter(b => b[0] === i || b[1] === i).map(b => ({ j: b[0] === i ? b[1] : b[0], ordre: b[2] }));
const hLabel = n => (n === 0 ? '' : n === 1 ? 'H' : 'H' + indice(n));
const etiqSimple = (g, i) => {
  const a = g.atoms[i], h = nbH(g, i);
  if (a.el === 'C') return 'C' + hLabel(h);
  if (a.el === 'O' || a.el === 'N') return a.el + hLabel(h);
  return a.el;
};
// Formule semi-développée d'une molécule construite par chaine() (chaîne principale + substituants d'un atome)
export function semiDeveloppee(g) {
  const n = g.nChaine, morceaux = [];
  for (let i = 0; i < n; i++) {
    const a = g.atoms[i], h = nbH(g, i);
    const subs = voisins(g, i).filter(v => v.j >= n);       // substituants hors chaîne
    let s;
    if (a.el === 'C') {
      const dbO = subs.find(v => v.ordre === 2 && g.atoms[v.j].el === 'O');
      if (dbO) s = h > 0 ? (i === 0 ? 'HCO' : 'CHO') : 'CO';
      else {
        s = 'C' + hLabel(h);
        for (const v of subs) { const L = etiqSimple(g, v.j); s += (L === 'Cl' || L === 'Br') ? L : `(${L})`; }
      }
    } else if (a.el === 'N') {
      s = 'N' + hLabel(h);
      for (const v of subs) s += `(${etiqSimple(g, v.j)})`;
    } else s = a.el + hLabel(h);
    morceaux.push(s);
  }
  return morceaux.join('–').replace(/CO–OH$/, 'COOH');
}

// ---------- groupes caractéristiques repérés sur le graphe ----------
// Renvoie [{ fam, atomes: [indices] }] ; fam ∈ ester, acide, amide, amine, halogeno, alcool, aldehyde, cetone
export function groupes(g) {
  const out = [], N = g.atoms.length, el = i => g.atoms[i].el, vs = i => voisins(g, i);
  for (let c = 0; c < N; c++) {
    if (el(c) === 'C') {
      const carbonyle = vs(c).find(v => v.ordre === 2 && el(v.j) === 'O');
      if (carbonyle) {
        const autres = vs(c).filter(v => v.j !== carbonyle.j);
        const oS = autres.find(v => el(v.j) === 'O'), nS = autres.find(v => el(v.j) === 'N');
        if (oS) {
          const ester = vs(oS.j).some(v => v.j !== c && el(v.j) === 'C');
          out.push({ fam: ester ? 'ester' : 'acide', atomes: [c, carbonyle.j, oS.j] });
        } else if (nS) out.push({ fam: 'amide', atomes: [c, carbonyle.j, nS.j] });
        else out.push({ fam: nbH(g, c) > 0 ? 'aldehyde' : 'cetone', atomes: [c, carbonyle.j] });
      }
      for (const v of vs(c)) if ((el(v.j) === 'Cl' || el(v.j) === 'Br') && v.ordre === 1) out.push({ fam: 'halogeno', atomes: [c, v.j] });
      for (const v of vs(c)) if (el(v.j) === 'O' && v.ordre === 1 && nbH(g, v.j) === 1 && !vs(c).some(w => w.ordre === 2)) out.push({ fam: 'alcool', atomes: [c, v.j] });
    }
    if (el(c) === 'N') {
      const surCarbonyle = vs(c).some(v => el(v.j) === 'C' && vs(v.j).some(w => w.ordre === 2 && el(w.j) === 'O'));
      if (!surCarbonyle && vs(c).every(v => el(v.j) === 'C')) out.push({ fam: 'amine', atomes: [c] });
    }
  }
  return out;
}
export const FAMILLES = { ester: 'ester', acide: 'acide carboxylique', amide: 'amide', amine: 'amine', halogeno: 'halogénoalcane', alcool: 'alcool', aldehyde: 'aldéhyde', cetone: 'cétone' };
export const GROUPE_ECRIT = { ester: '–COO–', acide: '–COOH', amide: '–CO–N', amine: '–N', halogeno: 'C–X', alcool: '–OH', aldehyde: 'CHO', cetone: 'C=O' };
export const classeAmine = (g, iN) => ['', 'primaire', 'secondaire', 'tertiaire'][voisins(g, iN).filter(v => g.atoms[v.j].el === 'C').length];

// ---------- nom calculé à partir du dessin (indépendant des noms écrits à la main) ----------
// composante carbonée connexe (liaisons C–C) contenant le carbone c, sans passer par « exclu » ; renvoie la liste ordonnée du bout à l'autre bout (chaîne linéaire)
function cheminC(g, c, exclu = []) {
  const sel = new Set([c]); const pile = [c];
  while (pile.length) { const x = pile.pop(); for (const v of voisins(g, x)) if (g.atoms[v.j].el === 'C' && v.ordre === 1 && !exclu.includes(v.j) && !sel.has(v.j)) { sel.add(v.j); pile.push(v.j); } }
  const deg = i => voisins(g, i).filter(v => sel.has(v.j)).length;
  const bouts = [...sel].filter(i => deg(i) <= 1);
  if (bouts.some(i => deg(i) > 2) || [...sel].some(i => deg(i) > 2)) throw new Error('chaîne ramifiée non prise en charge');
  const chemin = [bouts[0]]; let prec = -1, cur = bouts[0];
  while (chemin.length < sel.size) { const suiv = voisins(g, cur).find(v => sel.has(v.j) && v.j !== prec); prec = cur; cur = suiv.j; chemin.push(cur); }
  return chemin;
}
const nomSubstituants = tailles => {
  if (!tailles.length) return '';
  const lst = [...tailles].sort((a, b) => a - b), groupes = {};
  lst.forEach(t => { groupes[t] = (groupes[t] || 0) + 1; });
  return Object.entries(groupes).map(([t, k]) => `${Array(k).fill('N').join(',')}-${['', '', 'di', 'tri'][k]}${ALK[t]}`).join('-');
};
export function nomDepuisGraphe(g) {
  const gr = groupes(g).filter(x => ['ester', 'amide', 'amine', 'halogeno'].includes(x.fam));
  if (gr.length !== 1) return null;
  const { fam, atomes } = gr[0];
  if (fam === 'ester') {
    const [c, , o] = atomes, alkyle = voisins(g, o).find(v => v.j !== c).j;
    const n1 = cheminC(g, c).length, n2 = cheminC(g, alkyle).length;
    const al = ALK[n2] + 'e';
    return `${PREF[n1]}anoate ${/^[aeiouyéè]/.test(al) ? 'd’' : 'de '}${al}`;
  }
  if (fam === 'amide') {
    const [c, , n] = atomes, subs = voisins(g, n).filter(v => v.j !== c).map(v => cheminC(g, v.j).length);
    const n1 = cheminC(g, c).length;
    return `${nomSubstituants(subs)}${PREF[n1]}anamide`;
  }
  if (fam === 'amine') {
    const n = atomes[0], chaines = voisins(g, n).map(v => cheminC(g, v.j, [n]));
    chaines.sort((a, b) => b.length - a.length);
    const [principale, ...autres] = chaines, L = principale.length;
    const attache = voisins(g, n).map(v => v.j).find(j => principale.includes(j)), p = principale.indexOf(attache) + 1, pos = Math.min(p, L + 1 - p);
    return `${nomSubstituants(autres.map(c => c.length))}${PREF[L]}an${L >= 3 ? `-${pos}-` : ''}amine`;
  }
  const [c, x] = atomes, ch = cheminC(g, c), L = ch.length, p = ch.indexOf(c) + 1, pos = Math.min(p, L + 1 - p);
  return `${L >= 3 ? `${pos}-` : ''}${g.atoms[x].el === 'Cl' ? 'chloro' : 'bromo'}${PREF[L]}ane`;
}
export const nbCarbones = g => g.atoms.filter(a => a.el === 'C').length;

// ---------- catalogue des molécules ----------
const mol = (famille, nom, els, brs, extra = {}) => {
  const g = chaine(els, brs);
  return { id: nom, famille, nom, ...g, brute: brute(g), sd: semiDeveloppee(g), ...extra };
};
const O2 = (i) => [i, 'O', 2];
export const MOLECULES = [
  // esters
  mol('ester', 'méthanoate de méthyle', ['C', 'O', 'C'], [O2(0)], { usage: 'arôme et solvant' }),
  mol('ester', 'éthanoate de méthyle', ['C', 'C', 'O', 'C'], [O2(1)]),
  mol('ester', 'méthanoate d’éthyle', ['C', 'O', 'C', 'C'], [O2(0)]),
  mol('ester', 'éthanoate d’éthyle', ['C', 'C', 'O', 'C', 'C'], [O2(1)]),
  mol('ester', 'propanoate de méthyle', ['C', 'C', 'C', 'O', 'C'], [O2(2)]),
  mol('ester', 'éthanoate de propyle', ['C', 'C', 'O', 'C', 'C', 'C'], [O2(1)]),
  mol('ester', 'propanoate d’éthyle', ['C', 'C', 'C', 'O', 'C', 'C'], [O2(2)]),
  mol('ester', 'butanoate de méthyle', ['C', 'C', 'C', 'C', 'O', 'C'], [O2(3)]),
  mol('ester', 'butanoate d’éthyle', ['C', 'C', 'C', 'C', 'O', 'C', 'C'], [O2(3)]),
  // amines
  mol('amine', 'méthanamine', ['C', 'N'], []),
  mol('amine', 'éthanamine', ['C', 'C', 'N'], []),
  mol('amine', 'propan-1-amine', ['C', 'C', 'C', 'N'], []),
  mol('amine', 'propan-2-amine', ['C', 'C', 'C'], [[1, 'N']]),
  mol('amine', 'butan-1-amine', ['C', 'C', 'C', 'C', 'N'], []),
  mol('amine', 'N-méthylméthanamine', ['C', 'N', 'C'], []),
  mol('amine', 'N-méthyléthanamine', ['C', 'C', 'N', 'C'], []),
  mol('amine', 'N-éthyléthanamine', ['C', 'C', 'N', 'C', 'C'], []),
  mol('amine', 'N,N-diméthylméthanamine', ['C', 'N', 'C'], [[1, 'C']]),
  // amides
  mol('amide', 'méthanamide', ['C', 'N'], [O2(0)]),
  mol('amide', 'éthanamide', ['C', 'C', 'N'], [O2(1)]),
  mol('amide', 'propanamide', ['C', 'C', 'C', 'N'], [O2(2)]),
  mol('amide', 'butanamide', ['C', 'C', 'C', 'C', 'N'], [O2(3)]),
  mol('amide', 'N-méthylméthanamide', ['C', 'N', 'C'], [O2(0)]),
  mol('amide', 'N-méthyléthanamide', ['C', 'C', 'N', 'C'], [O2(1)]),
  mol('amide', 'N,N-diméthyléthanamide', ['C', 'C', 'N', 'C'], [O2(1), [2, 'C']]),
  // halogénoalcanes
  mol('halogeno', 'chlorométhane', ['C', 'Cl'], []),
  mol('halogeno', 'bromométhane', ['C', 'Br'], []),
  mol('halogeno', 'chloroéthane', ['C', 'C', 'Cl'], []),
  mol('halogeno', 'bromoéthane', ['C', 'C', 'Br'], []),
  mol('halogeno', '1-chloropropane', ['C', 'C', 'C', 'Cl'], []),
  mol('halogeno', '2-chloropropane', ['C', 'C', 'C'], [[1, 'Cl']]),
  mol('halogeno', '1-bromopropane', ['C', 'C', 'C', 'Br'], []),
  mol('halogeno', '2-bromopropane', ['C', 'C', 'C'], [[1, 'Br']]),
  mol('halogeno', '1-chlorobutane', ['C', 'C', 'C', 'C', 'Cl'], []),
  mol('halogeno', '2-chlorobutane', ['C', 'C', 'C', 'C'], [[1, 'Cl']]),
  mol('halogeno', '1-bromobutane', ['C', 'C', 'C', 'C', 'Br'], []),
  // rappels de première
  mol('alcool', 'propan-1-ol', ['C', 'C', 'C', 'O'], []),
  mol('alcool', 'propan-2-ol', ['C', 'C', 'C'], [[1, 'O']]),
  mol('acide', 'acide éthanoïque', ['C', 'C', 'O'], [O2(1)]),
  mol('acide', 'acide propanoïque', ['C', 'C', 'C', 'O'], [O2(2)]),
  mol('cetone', 'propanone', ['C', 'C', 'C'], [O2(1)]),
  mol('aldehyde', 'propanal', ['C', 'C', 'C'], [O2(2)]),
];
export const molParNom = nom => MOLECULES.find(m => m.nom === nom);
export const NOUVELLES = ['ester', 'amine', 'amide', 'halogeno'];
export const duFamille = f => MOLECULES.filter(m => m.famille === f);

// ---------- polymères idéalisés (chaîne régulière, motifs identiques) ----------
// squelette : 2 carbones par motif ; le substituant est porté par le second carbone du motif (sommets impairs : tous du même côté)
export const POLYMERES = [
  { id: 'pe', nom: 'polyéthylène', abr: 'PE', sub: null, motif: 'CH₂–CH₂', brute: 'C₂H₄', nC: 2, M: 28.0, origine: 'synthétique', usages: ['sacs et films plastiques', 'bouteilles et flacons', 'jouets'] },
  { id: 'pvc', nom: 'poly(chlorure de vinyle)', abr: 'PVC', sub: 'Cl', motif: 'CH₂–CHCl', brute: 'C₂H₃Cl', nC: 2, M: 62.5, origine: 'synthétique', usages: ['tuyaux de canalisation', 'cadres de fenêtres', 'gaines de câbles électriques'] },
  { id: 'pp', nom: 'polypropylène', abr: 'PP', sub: 'CH3', motif: 'CH₂–CH(CH₃)', brute: 'C₃H₆', nC: 3, M: 42.0, origine: 'synthétique', usages: ['boîtes alimentaires', 'pièces d’automobile', 'cordages et fibres'] },
  { id: 'ps', nom: 'polystyrène', abr: 'PS', sub: 'Ph', motif: 'CH₂–CH(C₆H₅)', brute: 'C₈H₈', nC: 8, M: 104.0, origine: 'synthétique', usages: ['pots de yaourt et barquettes', 'emballages et isolants (polystyrène expansé)'] },
];
export const polParId = id => POLYMERES.find(p => p.id === id);
// masses molaires atomiques (g·mol⁻¹) utilisées dans les exercices : C 12,0 ; H 1,0 ; Cl 35,5
export const M_ATOMES = { C: 12.0, H: 1.0, Cl: 35.5 };
export const masseMotif = id => { const p = polParId(id); return { pe: 2 * 12 + 4, pvc: 2 * 12 + 3 + 35.5, pp: 3 * 12 + 6, ps: 8 * 12 + 8 }[p.id]; };

// Graphe d'un segment de chaîne de k motifs (substituants sur les carbones impairs) + repères pour dessiner crochets et extrémités
const R_CYC = 0.6;
export function segmentPolymere(id, k = 3) {
  const p = polParId(id), els = Array(2 * k).fill('C'), g = chaine(els, []);
  g.atoms.forEach(a => { a.chaineMotif = true; });
  for (let j = 0; j < k; j++) {
    const i = 2 * j + 1, a = g.atoms[i];
    if (p.sub === 'Cl') { g.atoms.push({ el: 'Cl', x: a.x, y: a.y - 1 }); g.bonds.push([i, g.atoms.length - 1, 1]); }
    else if (p.sub === 'CH3') { g.atoms.push({ el: 'C', x: a.x, y: a.y - 1 }); g.bonds.push([i, g.atoms.length - 1, 1]); }
    else if (p.sub === 'Ph') {
      const att = g.atoms.length, cx = a.x, cy = a.y - 1 - R_CYC;
      for (let m = 0; m < 6; m++) { const th = Math.PI / 2 + m * Math.PI / 3; g.atoms.push({ el: 'C', x: cx + R_CYC * Math.cos(th), y: cy + R_CYC * Math.sin(th), cycle: [cx, cy] }); }
      g.bonds.push([i, att, 1]);
      for (let m = 0; m < 6; m++) g.bonds.push([att + m, att + (m + 1) % 6, m % 2 === 0 ? 2 : 1]);
    }
  }
  g.k = k; g.polymere = p;
  return g;
}
// Les carbones du squelette d'un segment n'ont pas tous 2 voisins de chaîne : les extrémités reçoivent un tiret de continuation (dessin), pas un H.
// Valence : pour le contrôle, on compte les 2 carbones d'extrémité comme liés à un « prolongement » (liaison ouverte).
export function hSegment(g, i) {
  const ext = (i === 0 || i === 2 * g.k - 1) ? 1 : 0;
  return nbH(g, i) - ext;
}
export function bruteSegment(g) {
  let c = 0, h = 0, cl = 0;
  g.atoms.forEach((a, i) => { if (a.el === 'C') { c++; h += (i < 2 * g.k ? hSegment(g, i) : nbH(g, i)); } else if (a.el === 'Cl') cl++; });
  return { C: c, H: h, Cl: cl };
}

// ---------- polymères naturels et exemples d'usage ----------
export const NATURELS = [
  { nom: 'cellulose', motif: 'des unités de glucose', usage: 'bois, coton, papier' },
  { nom: 'amidon', motif: 'des unités de glucose', usage: 'réserve d’énergie des plantes (pomme de terre, blé)' },
  { nom: 'protéines', motif: 'des acides α-aminés', usage: 'cheveux, soie, enzymes, muscles' },
  { nom: 'ADN', motif: 'des nucléotides', usage: 'support de l’information génétique' },
  { nom: 'caoutchouc naturel', motif: 'des unités isoprène', usage: 'pneus, gants (latex de l’hévéa)' },
];
export const AUTRES_SYNTH = [
  { nom: 'polyamide (nylon)', usage: 'textiles, cordages, pièces mécaniques' },
  { nom: 'poly(téréphtalate d’éthylène) (PET)', usage: 'bouteilles d’eau et de soda, fibres textiles (polyester)' },
];

// ---------- distracteurs de noms (défi, exercices) ----------
export function nomsVoisins(m, k = 3) {
  const memes = MOLECULES.filter(x => x.famille === m.famille && x.nom !== m.nom);
  const proches = memes.map(x => ({ x, d: Math.abs(nbCarbones(x) - nbCarbones(m)) + (x.brute === m.brute ? 0 : 0.5) })).sort((a, b) => a.d - b.d || (a.x.nom < b.x.nom ? -1 : 1));
  return proches.slice(0, k).map(o => o.x.nom);
}
