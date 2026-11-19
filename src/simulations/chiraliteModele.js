// ====================================================
//  MODÈLE « CHIRALITÉ ET CONFIGURATION ABSOLUE R / S » (Terminale STL, PCM · Constitution de la matière · Structure spatiale)
//
//  Une molécule est un graphe (atomes + liaisons, hydrogènes compris) construit à partir d'un SMILES SANS stéréochimie.
//  Pour chaque carbone asymétrique on calcule, à partir du graphe seulement :
//    1. les priorités CIP des 4 substituants (règle de l'atome de plus grand numéro atomique Z, comparaison COUCHE PAR COUCHE,
//       liaison double comptée deux fois, atomes « fantômes » de Z = 0 pour compléter à 3 voisins) ;
//    2. sa chiralité (4 substituants tous différents) ;
//    3. sa configuration R / S, à partir de la DISPOSITION dans l'espace des 4 substituants (vecteurs 3D du dessin de Cram).
//  Hypothèses (affichées à l'élève) : molécules sans cycle ni isotopes, règles CIP limitées à ce qu'exige le programme
//  (numéro atomique couche par couche, liaison double comptée deux fois), pas de composé méso, pas de cas pathologique.
//
//  Disposition (dessin de Cram) : un carbone a 4 « emplacements » : A et B (traits dans le plan), W (coin plein, vers l'observateur),
//  D (tirets, derrière le plan). Deux orientations : « bas » (A et B vers le haut, W et D vers le bas : carbone en pointe basse d'un zigzag)
//  et « haut » (même dessin retourné d'un demi-tour dans le plan : carbone en pointe haute). Repère : x vers la droite, y vers le haut,
//  z vers l'observateur (repère direct).
//  Convention de calcul : on prend les vecteurs a, b, c vers les substituants de priorités 1, 2, 3.
//     a · (b × c) < 0  ⇔  1 → 2 → 3 tourne dans le sens horaire quand le substituant 4 est derrière  ⇔  configuration R.
// ====================================================

export const Z = { H: 1, C: 6, N: 7, O: 8, F: 9, S: 16, Cl: 17, Br: 35, I: 53 };
const VALENCE = { C: 4, N: 3, O: 2, S: 2, F: 1, Cl: 1, Br: 1, I: 1 };

// ---------- graphe à partir d'un SMILES (sans cycle, sans stéréochimie) ----------
export function graphe(smiles) {
  const el = [], liaisons = [];           // el[i] : symbole ; liaisons : [i, j, ordre]
  const pile = []; let prec = -1, ordre = 1, i = 0;
  while (i < smiles.length) {
    const ch = smiles[i];
    if (ch === '(') { pile.push(prec); i++; continue; }
    if (ch === ')') { prec = pile.pop(); i++; continue; }
    if (ch === '=') { ordre = 2; i++; continue; }
    const sym = /^(Cl|Br)/.test(smiles.slice(i)) ? smiles.slice(i, i + 2) : ch;
    if (!(sym in Z)) throw new Error(`SMILES : symbole inconnu « ${sym} » dans ${smiles}`);
    const n = el.length; el.push(sym); i += sym.length;
    if (prec >= 0) liaisons.push([prec, n, ordre]);
    prec = n; ordre = 1;
  }
  const nLourds = el.length;
  const somme = el.map(() => 0);
  liaisons.forEach(([a, b, o]) => { somme[a] += o; somme[b] += o; });
  el.slice(0, nLourds).forEach((s, a) => {
    const nH = VALENCE[s] - somme[a];
    if (nH < 0) throw new Error(`SMILES : valence dépassée pour l'atome ${a} (${s}) dans ${smiles}`);
    for (let k = 0; k < nH; k++) { const h = el.length; el.push('H'); liaisons.push([a, h, 1]); }
  });
  const voisins = el.map(() => []);
  liaisons.forEach(([a, b, o]) => { voisins[a].push({ j: b, ordre: o }); voisins[b].push({ j: a, ordre: o }); });
  return { el, voisins, nLourds };
}

// ---------- règles CIP : arbre de substituants, comparaison couche par couche ----------
// Un nœud : { el, enfants:[nœuds] } ; une liaison double ajoute à CHAQUE extrémité un atome « dupliqué » (sans enfants réels).
function noeud(g, i, parent, dup = false) {
  if (dup) return { el: g.el[i], enfants: [], dup: true };
  const enfants = [];
  g.voisins[i].forEach(({ j, ordre }) => {
    if (j === parent) { if (ordre === 2) enfants.push({ el: g.el[j], enfants: [], dup: true }); return; }
    enfants.push(noeud(g, j, i));
    if (ordre === 2) enfants.push({ el: g.el[j], enfants: [], dup: true });
  });
  return { el: g.el[i], enfants };
}
const FANTOME = { el: null, enfants: [], fantome: true };
const zDe = n => (n.fantome ? 0 : Z[n.el]);

// Compare deux nœuds A et B (racines) : > 0 si A est prioritaire. Renvoie { signe, couche, ensA, ensB } pour pouvoir expliquer.
function comparerNoeuds(A, B) {
  let sphA = [A], sphB = [B], couche = 1;
  for (let garde = 0; garde < 12; garde++) {
    const n = Math.max(sphA.length, sphB.length);
    for (let k = 0; k < n; k++) {
      const a = sphA[k] ? zDe(sphA[k]) : -1, b = sphB[k] ? zDe(sphB[k]) : -1;
      if (a !== b) return { signe: Math.sign(a - b), couche, pos: k, ensA: sphA.map(zDe), ensB: sphB.map(zDe) };
    }
    const suite = sph => sph.flatMap(x => { const e = trier(x.enfants); while (e.length < 3) e.push(FANTOME); return x.fantome ? [FANTOME, FANTOME, FANTOME] : e; });
    sphA = suite(sphA); sphB = suite(sphB); couche++;
    if (sphA.every(x => x.fantome) && sphB.every(x => x.fantome)) break;
  }
  return { signe: 0, couche, pos: 0, ensA: [], ensB: [] };
}
// Enfants d'un même atome : par Z décroissant, puis par comparaison de leurs propres branches
function trier(enfants) {
  return [...enfants].sort((x, y) => (zDe(y) - zDe(x)) || comparerNoeuds(y, x).signe);
}

// Ensemble des atomes de la couche k (k = 1 : l'atome lié au carbone ; k = 2 : ses voisins…) pour l'affichage
function ensembleCouche(noeudRacine, k) {
  let sph = [noeudRacine];
  for (let c = 1; c < k; c++) sph = sph.flatMap(x => { const e = trier(x.enfants); while (e.length < 3) e.push(FANTOME); return x.fantome ? [FANTOME, FANTOME, FANTOME] : e; });
  return sph;
}

// Classement CIP des 4 substituants d'un atome c. Renvoie, par ordre de priorité décroissante, [{ j, noeud }] et un drapeau « distincts ».
export function classementCIP(g, c) {
  const vs = g.voisins[c].map(({ j }) => ({ j, noeud: noeud(g, j, c) }));
  vs.sort((x, y) => comparerNoeuds(y.noeud, x.noeud).signe);
  let distincts = vs.length === 4;
  for (let k = 0; k < vs.length - 1; k++) if (comparerNoeuds(vs[k].noeud, vs[k + 1].noeud).signe === 0) distincts = false;
  return { ordre: vs, distincts };
}
export const compareCIP = (g, c, j1, j2) => comparerNoeuds(noeud(g, j1, c), noeud(g, j2, c));

// Carbone asymétrique : carbone à 4 voisins simples, tous différents
export function estAsymetrique(g, c) {
  if (g.el[c] !== 'C' || g.voisins[c].length !== 4 || g.voisins[c].some(v => v.ordre !== 1)) return false;
  return classementCIP(g, c).distincts;
}
export const carbonesAsymetriques = g => g.el.map((_, i) => i).filter(i => i < g.nLourds && estAsymetrique(g, i));

// ---------- géométrie du dessin de Cram ----------
const S = Math.sqrt(2 / 3), C = 1 / Math.sqrt(3), PHI = 0.42;     // PHI : léger éventail (convention de dessin) entre coin plein et tirets
const W_BAS = [S * Math.sin(PHI), -C, S * Math.cos(PHI)], D_BAS = [-S * Math.sin(PHI), -C, -S * Math.cos(PHI)];
const tourne180 = v => [-v[0], -v[1], v[2]];                      // demi-tour dans le plan de la feuille (axe z)
export const GEOM = {
  bas: { A: [-S, C, 0], B: [S, C, 0], W: W_BAS, D: D_BAS },
  haut: { A: tourne180([-S, C, 0]), B: tourne180([S, C, 0]), W: tourne180(W_BAS), D: tourne180(D_BAS) },
};
export const EMPLACEMENTS = ['A', 'B', 'W', 'D'];
// Même disposition, mais en tétraèdre régulier (utilisé par la vue qui tourne) : le tétraèdre idéal, tourné de 0,5 rad autour de la verticale
// pour que le coin plein et les tirets ne se superposent pas à l'écran.
const rotY = (v, a) => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
const IDEAL = { A: [-S, C, 0], B: [S, C, 0], W: [0, -C, S], D: [0, -C, -S] };
const bas3 = Object.fromEntries(Object.entries(IDEAL).map(([k, v]) => [k, rotY(v, 0.5)]));
export const GEOM3D = { bas: bas3, haut: Object.fromEntries(Object.entries(bas3).map(([k, v]) => [k, tourne180(v)])) };

export const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
export const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const norm = v => Math.hypot(v[0], v[1], v[2]);
const unit = v => { const n = norm(v); return [v[0] / n, v[1] / n, v[2] / n]; };

// Une disposition : { orient:'bas'|'haut', A:j, B:j, W:j, D:j } (j = indice d'atome voisin)
export const vecteurDe = (aff, j) => { const e = EMPLACEMENTS.find(k => aff[k] === j); return GEOM[aff.orient][e]; };
export const vecteur3D = (aff, j) => { const e = EMPLACEMENTS.find(k => aff[k] === j); return GEOM3D[aff.orient][e]; };

// Configuration absolue (calcul par le produit mixte) : 'R' | 'S' | null (si le carbone n'est pas asymétrique)
export function configuration(g, c, aff) {
  const cl = classementCIP(g, c);
  if (!cl.distincts) return null;
  const [a, b, cc] = cl.ordre.slice(0, 3).map(x => vecteurDe(aff, x.j));
  return dot(a, cross(b, cc)) < 0 ? 'R' : 'S';
}

// Image dans un miroir : on réfléchit les vecteurs (x → −x). Renvoie la configuration calculée sur les vecteurs réfléchis.
export function configurationMiroir(g, c, aff) {
  const cl = classementCIP(g, c);
  if (!cl.distincts) return null;
  const refl = v => [-v[0], v[1], v[2]];
  const [a, b, cc] = cl.ordre.slice(0, 3).map(x => refl(vecteurDe(aff, x.j)));
  return dot(a, cross(b, cc)) < 0 ? 'R' : 'S';
}
// Même image miroir, exprimée comme une disposition : on échange les deux traits dans le plan (A ↔ B).
export const affMiroir = aff => ({ ...aff, A: aff.B, B: aff.A });
// Échange de deux emplacements quelconques
export const echanger = (aff, e1, e2) => ({ ...aff, [e1]: aff[e2], [e2]: aff[e1] });
export const inverse = r => (r === 'R' ? 'S' : r === 'S' ? 'R' : null);

// ---------- regarder « dans l'axe » : le substituant 4 (le moins prioritaire) est derrière ----------
// L'observateur est du côté opposé au substituant 4. Repère écran : x à droite, y en haut (le substituant 1 est placé en haut), z vers l'observateur.
export function baseVue(g, c, aff) {
  const cl = classementCIP(g, c);
  const v = cl.ordre.map(x => vecteur3D(aff, x.j));
  const n = unit([-v[3][0], -v[3][1], -v[3][2]]);                               // vers l'observateur
  const p = dot(v[0], n); const e2 = unit([v[0][0] - p * n[0], v[0][1] - p * n[1], v[0][2] - p * n[2]]);
  const e1 = cross(e2, n);
  return { e1, e2, n, ordre: cl.ordre };
}
// Sens de rotation 1 → 2 → 3 vu dans l'axe : 'horaire' | 'antihoraire'
export function sensDansLAxe(g, c, aff) {
  const { e1, e2, ordre } = baseVue(g, c, aff);
  const P = ordre.slice(0, 3).map(x => { const v = vecteur3D(aff, x.j); return [dot(v, e1), dot(v, e2)]; });
  const aire = (P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (P[1][1] - P[0][1]);   // > 0 : antihoraire (y vers le haut)
  return aire < 0 ? 'horaire' : 'antihoraire';
}
// Sens de rotation 1 → 2 → 3 tel qu'il APPARAÎT sur le dessin de face, sans tourner la molécule (il ne donne la bonne lettre que si le n°4 est en tirets ;
// s'il est en coin plein, la vraie configuration est l'inverse)
export function sensApparent(g, c, aff) {
  const cl = classementCIP(g, c);
  const P = cl.ordre.slice(0, 3).map(x => { const v = vecteurDe(aff, x.j); return [v[0], v[1]]; });
  const aire = (P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (P[1][1] - P[0][1]);
  return aire < 0 ? 'horaire' : 'antihoraire';
}
export const configurationParSens = (g, c, aff) => (classementCIP(g, c).distincts ? (sensDansLAxe(g, c, aff) === 'horaire' ? 'R' : 'S') : null);

// Rotation progressive de la caméra : t = 0 : vue de face (dessin de Cram) ; t = 1 : vue dans l'axe.
// Matrice 3×3 (lignes = axes écran x, y, z exprimés dans le repère de la feuille).
const ident = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
function rodrigues(axe, ang) {
  const [x, y, z] = axe, c = Math.cos(ang), s = Math.sin(ang), k = 1 - c;
  return [[c + x * x * k, x * y * k - z * s, x * z * k + y * s], [y * x * k + z * s, c + y * y * k, y * z * k - x * s], [z * x * k - y * s, z * y * k + x * s, c + z * z * k]];
}
export function cameraA(g, c, aff, t) {
  const { e1, e2, n } = baseVue(g, c, aff);
  const R = [e1, e2, n];
  const tr = R[0][0] + R[1][1] + R[2][2];
  const ang = Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
  if (ang < 1e-9) return ident;
  let axe;
  if (Math.PI - ang < 1e-6) {
    const d = [R[0][0], R[1][1], R[2][2]].map(x => Math.sqrt(Math.max(0, (x + 1) / 2)));
    axe = unit(d);
  } else axe = unit([R[2][1] - R[1][2], R[0][2] - R[2][0], R[1][0] - R[0][1]]);
  return rodrigues(axe, ang * t);
}
export const projeter = (R, v) => [dot(R[0], v), dot(R[1], v), dot(R[2], v)];   // [x écran, y écran, profondeur (> 0 : vers l'observateur)]

// ---------- explications des priorités (pour l'affichage) ----------
// Pour chaque substituant : atome lié, son Z, et l'ensemble de ses voisins (couche 2), liaisons doubles comptées deux fois
export function fichePriorites(g, c) {
  const cl = classementCIP(g, c);
  return cl.ordre.map((x, k) => {
    const c2 = ensembleCouche(x.noeud, 2).filter(n => !n.fantome);
    return { rang: k + 1, j: x.j, el: g.el[x.j], Z: Z[g.el[x.j]], voisins: c2.map(n => n.el).sort((a, b) => Z[b] - Z[a]) };
  });
}
// Pourquoi i passe avant i+1 ? { couche, ensA, ensB } (symboles, couche où la différence apparaît)
export function raisonsPriorites(g, c) {
  const cl = classementCIP(g, c);
  return cl.ordre.slice(0, 3).map((x, k) => {
    const r = comparerNoeuds(x.noeud, cl.ordre[k + 1].noeud);
    // à partir de la couche 2, les atomes vont par groupes de 3 (les voisins d'un même atome) : on montre le groupe où apparaît la première différence
    const ens = nd => { const sph = ensembleCouche(nd, r.couche); const g0 = r.couche === 1 ? 0 : Math.floor(r.pos / 3) * 3; return (r.couche === 1 ? sph : sph.slice(g0, g0 + 3)).filter(n => !n.fantome).map(n => n.el); };
    return { de: k + 1, a: k + 2, couche: r.couche, ensA: ens(x.noeud), ensB: ens(cl.ordre[k + 1].noeud) };
  });
}

// ---------- compositions (pour contrôler les étiquettes affichées) ----------
export function compositionBranche(g, c, j) {
  const cpt = {}; const vu = new Set([c]);
  const parcours = i => { vu.add(i); cpt[g.el[i]] = (cpt[g.el[i]] || 0) + 1; g.voisins[i].forEach(({ j: k }) => { if (!vu.has(k)) parcours(k); }); };
  parcours(j); return cpt;
}
const IND = { '₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9 };
export function compositionEtiquette(etiq) {
  const cpt = {};
  const lire = (s, i) => {                                   // renvoie [compteur, nouvel indice] jusqu'à « ) » ou fin
    const loc = {};
    while (i < s.length && s[i] !== ')') {
      if (s[i] === '(') {
        const [sous, k] = lire(s, i + 1); i = k + 1; let m = 1;
        if (IND[s[i]] !== undefined) { m = IND[s[i]]; i++; }
        for (const e in sous) loc[e] = (loc[e] || 0) + sous[e] * m;
      } else {
        const sym = /^(Cl|Br)/.test(s.slice(i)) ? s.slice(i, i + 2) : s[i]; i += sym.length;
        let m = 1; if (IND[s[i]] !== undefined) { m = IND[s[i]]; i++; }
        loc[sym] = (loc[sym] || 0) + m;
      }
    }
    return [loc, i];
  };
  const [r] = lire(etiq, 0); Object.assign(cpt, r); return cpt;
}

// ---------- catalogue de molécules ----------
// groupes : étiquette du groupe (écriture condensée) pour chaque voisin d'un carbone d'intérêt, par indice d'atome du SMILES.
// Les atomes d'hydrogène s'affichent « H ».
const M = (o) => ({ ...o, g: graphe(o.smiles) });
export const CATALOGUE = [
  // — une seule asymétrie —
  M({ id: 'lactique', nom: 'acide 2-hydroxypropanoïque (acide lactique)', semi: 'CH₃–CH(OH)–COOH', smiles: 'CC(O)C(=O)O', centres: [1], groupes: { 0: 'CH₃', 2: 'OH', 3: 'COOH' } }),
  M({ id: 'chloropropanoique', nom: 'acide 2-chloropropanoïque', semi: 'CH₃–CHCl–COOH', smiles: 'CC(Cl)C(=O)O', centres: [1], groupes: { 0: 'CH₃', 2: 'Cl', 3: 'COOH' } }),
  M({ id: 'bcfm', nom: 'bromochlorofluorométhane', semi: 'CHFClBr', smiles: 'C(F)(Cl)Br', centres: [0], groupes: { 1: 'F', 2: 'Cl', 3: 'Br' } }),
  M({ id: 'bromochloroethane', nom: '1-bromo-1-chloroéthane', semi: 'CH₃–CHBrCl', smiles: 'CC(Cl)Br', centres: [1], groupes: { 0: 'CH₃', 2: 'Cl', 3: 'Br' } }),
  M({ id: 'methylhexane', nom: '3-méthylhexane', semi: 'CH₃CH₂–CH(CH₃)–CH₂CH₂CH₃', smiles: 'CCC(C)CCC', centres: [2], groupes: { 1: 'CH₂CH₃', 3: 'CH₃', 4: 'CH₂CH₂CH₃' } }),
  M({ id: 'serine', nom: 'acide 2-amino-3-hydroxypropanoïque (sérine)', semi: 'HOCH₂–CH(NH₂)–COOH', smiles: 'OCC(N)C(=O)O', centres: [2], groupes: { 1: 'CH₂OH', 3: 'NH₂', 4: 'COOH' } }),
  M({ id: 'cysteine', nom: 'acide 2-amino-3-sulfanylpropanoïque (cystéine)', semi: 'HSCH₂–CH(NH₂)–COOH', smiles: 'SCC(N)C(=O)O', centres: [2], groupes: { 1: 'CH₂SH', 3: 'NH₂', 4: 'COOH' } }),
  M({ id: 'hydroxybutanal', nom: '2-hydroxybutanal', semi: 'CH₃CH₂–CH(OH)–CHO', smiles: 'CCC(O)C=O', centres: [2], groupes: { 1: 'CH₂CH₃', 3: 'OH', 4: 'CHO' } }),
  M({ id: 'aminopropanol', nom: '2-aminopropan-1-ol', semi: 'CH₃–CH(NH₂)–CH₂OH', smiles: 'CC(N)CO', centres: [1], groupes: { 0: 'CH₃', 2: 'NH₂', 3: 'CH₂OH' } }),
  M({ id: 'bromochloropropane', nom: '2-bromo-1-chloropropane', semi: 'CH₃–CHBr–CH₂Cl', smiles: 'CC(Br)CCl', centres: [1], groupes: { 0: 'CH₃', 2: 'Br', 3: 'CH₂Cl' } }),
  M({ id: 'glyceraldehyde', nom: '2,3-dihydroxypropanal (glycéraldéhyde)', semi: 'HOCH₂–CH(OH)–CHO', smiles: 'OCC(O)C=O', centres: [2], groupes: { 1: 'CH₂OH', 3: 'OH', 4: 'CHO' } }),
  M({ id: 'malique', nom: 'acide 2-hydroxybutanedioïque (acide malique)', semi: 'HOOC–CH(OH)–CH₂–COOH', smiles: 'OC(=O)C(O)CC(=O)O', centres: [3], groupes: { 1: 'COOH', 4: 'OH', 5: 'CH₂COOH' } }),
  M({ id: 'aminobutanoique', nom: 'acide 2-aminobutanoïque', semi: 'CH₃CH₂–CH(NH₂)–COOH', smiles: 'CCC(N)C(=O)O', centres: [2], groupes: { 1: 'CH₂CH₃', 3: 'NH₂', 4: 'COOH' } }),
  // — deux carbones asymétriques voisins (chaîne gauche – C – C – droite) —
  M({ id: 'threonine', nom: 'acide 2-amino-3-hydroxybutanoïque (thréonine)', semi: 'CH₃–CH(OH)–CH(NH₂)–COOH', smiles: 'CC(O)C(N)C(=O)O', centres: [3, 1],
    groupes: { 4: 'NH₂', 5: 'COOH', 0: 'CH₃', 2: 'OH' }, chaine: { gauche: 5, c1: 3, c2: 1, droite: 0 }, nomsCentres: ['C2', 'C3'], numeros: [2, 3],
    etiqCentre: { 1: 'CH(OH)CH₃', 3: 'CH(NH₂)COOH' } }),
  M({ id: 'isoleucine', nom: 'acide 2-amino-3-méthylpentanoïque (isoleucine)', semi: 'CH₃CH₂–CH(CH₃)–CH(NH₂)–COOH', smiles: 'CCC(C)C(N)C(=O)O', centres: [4, 2],
    groupes: { 5: 'NH₂', 6: 'COOH', 1: 'CH₂CH₃', 3: 'CH₃' }, chaine: { gauche: 6, c1: 4, c2: 2, droite: 1 }, nomsCentres: ['C2', 'C3'], numeros: [2, 3],
    etiqCentre: { 2: 'CH(CH₃)CH₂CH₃', 4: 'CH(NH₂)COOH' } }),
  // — pas d'asymétrie : le carbone central porte deux groupes identiques —
  M({ id: 'propan2ol', nom: 'propan-2-ol', semi: 'CH₃–CH(OH)–CH₃', smiles: 'CC(O)C', centres: [1], groupes: { 0: 'CH₃', 2: 'OH', 3: 'CH₃' } }),
  M({ id: 'glycine', nom: 'acide 2-aminoéthanoïque (glycine)', semi: 'H₂N–CH₂–COOH', smiles: 'NCC(=O)O', centres: [1], groupes: { 0: 'NH₂', 2: 'COOH' } }),
  M({ id: 'chloropentane', nom: '3-chloropentane', semi: 'CH₃CH₂–CHCl–CH₂CH₃', smiles: 'CCC(Cl)CC', centres: [2], groupes: { 1: 'CH₂CH₃', 3: 'Cl', 4: 'CH₂CH₃' } }),
  M({ id: 'chloromethylpropanoique', nom: 'acide 2-chloro-2-méthylpropanoïque', semi: '(CH₃)₂CCl–COOH', smiles: 'CC(C)(Cl)C(=O)O', centres: [1], groupes: { 0: 'CH₃', 2: 'CH₃', 3: 'Cl', 4: 'COOH' } }),
  M({ id: 'ethanol', nom: 'éthanol', semi: 'CH₃–CH₂–OH', smiles: 'CCO', centres: [1], groupes: { 0: 'CH₃', 2: 'OH' } }),
  M({ id: 'glycolique', nom: 'acide 2-hydroxyéthanoïque (acide glycolique)', semi: 'HO–CH₂–COOH', smiles: 'OCC(=O)O', centres: [1], groupes: { 0: 'OH', 2: 'COOH' } }),
];
export const parId = id => CATALOGUE.find(m => m.id === id);
export const centresAsym = m => m.centres.filter(c => estAsymetrique(m.g, c));
export const estChirale = m => centresAsym(m).length > 0;                // hypothèse : pas de composé méso dans le catalogue
export const CHIRALES_1 = CATALOGUE.filter(m => m.centres.length === 1 && estChirale(m));
export const ACHIRALES = CATALOGUE.filter(m => !estChirale(m));
export const DEUX_CENTRES = CATALOGUE.filter(m => m.chaine);

// Étiquette d'un voisin j du carbone c (dessin)
export function etiquette(m, c, j) {
  if (m.g.el[j] === 'H') return 'H';
  if (m.groupes[j] && !(m.chaine && (j === m.chaine.c1 || j === m.chaine.c2))) return m.groupes[j];
  if (m.etiqCentre && m.etiqCentre[j]) return m.etiqCentre[j];
  throw new Error(`pas d'étiquette pour l'atome ${j} de ${m.id}`);
}

// ---------- dispositions ----------
// Une disposition de la molécule c qui a la configuration voulue (k-ième parmi celles où le n°4 est en tirets / en coin plein / n'importe où)
export function affAvecConfig(m, c, conf, { dernier = null, k = 0, orient = 'bas' } = {}) {
  const cl = classementCIP(m.g, c); const j4 = cl.ordre[3].j;
  const liste = toutesLesAff(m, c, orient).filter(a => configuration(m.g, c, a) === conf && (dernier === null || a[dernier] === j4));
  return liste[k % liste.length];
}
// Disposition d'un carbone à partir d'une liste d'étiquettes { A:'CH₃', B:'COOH', W:'OH', D:'H' } (les doublons sont pris dans l'ordre)
export function affDepuis(m, c, noms, orient = 'bas') {
  const libres = m.g.voisins[c].map(v => v.j); const aff = { orient };
  EMPLACEMENTS.forEach(e => {
    const k = libres.findIndex(j => etiquette(m, c, j) === noms[e]);
    if (k < 0) throw new Error(`${m.id} : « ${noms[e]} » introuvable autour de l'atome ${c}`);
    aff[e] = libres.splice(k, 1)[0];
  });
  return aff;
}
// Toutes les dispositions (24 permutations)
export function toutesLesAff(m, c, orient = 'bas') {
  const vs = m.g.voisins[c].map(v => v.j); const res = [];
  const perm = (reste, prefixe) => { if (!reste.length) { res.push({ orient, A: prefixe[0], B: prefixe[1], W: prefixe[2], D: prefixe[3] }); return; } reste.forEach((x, i) => perm(reste.filter((_, k) => k !== i), [...prefixe, x])); };
  perm(vs, []); return res;
}
// Deux carbones voisins (thréonine…) : A, B imposés par le zigzag ; flips = [bool, bool] : échange du coin plein et des tirets
export function affChaine(m, flips = [false, false]) {
  const { gauche, c1, c2, droite } = m.chaine;
  const autres = (c, ex) => m.g.voisins[c].map(v => v.j).filter(j => !ex.includes(j));
  const [w1, d1] = autres(c1, [gauche, c2]); const [w2, d2] = autres(c2, [c1, droite]);
  return [
    { orient: 'bas', A: gauche, B: c2, W: flips[0] ? d1 : w1, D: flips[0] ? w1 : d1 },
    { orient: 'haut', A: droite, B: c1, W: flips[1] ? d2 : w2, D: flips[1] ? w2 : d2 },
  ];
}
export const descripteurs = (m, affs) => [m.chaine.c1, m.chaine.c2].map((c, i) => configuration(m.g, c, affs[i]));
