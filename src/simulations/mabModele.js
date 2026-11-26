// Modèle de la simulation 294 « Équations d'oxydo-réduction en milieu acide ou basique » (TSTL SPCL).
// Fichier sans React, testé par mabModele.test.mjs.
//
// Principe : chaque espèce est décrite par sa formule (éléments et nombres d'atomes) et sa charge. Une demi-équation est établie par la méthode en quatre temps
// (1. élément principal ; 2. O avec H₂O ; 3. H avec H⁺ ; 4. charges avec e⁻), ce qui donne l'écriture en MILIEU ACIDE. Le passage au MILIEU BASIQUE se fait
// en ajoutant, des deux côtés, autant d'ions HO⁻ que d'ions H⁺ (H⁺ + HO⁻ → H₂O), puis en simplifiant les H₂O. L'équation de réaction est la somme de deux
// demi-équations multipliées pour que les électrons échangés soient en même nombre, puis simplifiée (H₂O, H⁺, HO⁻ communs aux deux membres).
// Hypothèses : 25 °C, espèces écrites sous leur forme simple (Ag⁺ et Cu²⁺ ne sont pas écrits sous forme de complexes, aldéhyde noté RCHO) ; la méthode ne
// prévoit pas si la réaction a lieu (voir la simulation sur le sens d'évolution) : les réactions proposées sont des transformations réelles.

export const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', encre: '#0f172a', jaune: '#ca8a04' };

const SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = { 2: '²', 3: '³' };
const sub = s => String(s).replace(/\d/g, d => SUB[+d]);

// id : [formule, charge, état, affichage particulier]
const DEF = {
  Hp: ['H', 1, 'aq'], OHm: ['OH', -1, 'aq', 'HO⁻'], H2O: ['H2O', 0, 'l'], em: ['e', -1, ''],
  MnO4m: ['MnO4', -1, 'aq'], Mn2p: ['Mn', 2, 'aq'], MnO2: ['MnO2', 0, 's'],
  Cr2O72m: ['Cr2O7', -2, 'aq'], Cr3p: ['Cr', 3, 'aq'], I2: ['I2', 0, 'aq'], Im: ['I', -1, 'aq'],
  NO3m: ['NO3', -1, 'aq'], NO: ['NO', 0, 'g'], Cu2p: ['Cu', 2, 'aq'], Cu: ['Cu', 0, 's'], Cu2O: ['Cu2O', 0, 's'],
  Fe2p: ['Fe', 2, 'aq'], Fe3p: ['Fe', 3, 'aq'], H2O2: ['H2O2', 0, 'aq'], O2: ['O2', 0, 'g'], H2: ['H2', 0, 'g'],
  SO32m: ['SO3', -2, 'aq'], SO42m: ['SO4', -2, 'aq'], Al: ['Al', 0, 's'], AlOH4m: ['AlO4H4', -1, 'aq', '[Al(OH)₄]⁻'],
  NH4p: ['NH4', 1, 'aq'], RCHO: ['RCHO', 0, 'aq'], RCOOm: ['RCOO', -1, 'aq'], Agp: ['Ag', 1, 'aq'], Ag: ['Ag', 0, 's'], ClOm: ['ClO', -1, 'aq'], Clm: ['Cl', -1, 'aq'],
};
const parse = f => { const o = {}; for (const [, el, n] of f.matchAll(/([A-Z][a-z]?)(\d*)/g)) o[el] = (o[el] || 0) + (n ? +n : 1); return o; };
export const ESPECES = Object.fromEntries(Object.entries(DEF).map(([id, [f, q, e, aff]]) => [id, { id, f, q, etat: e, aff, els: id === 'em' ? {} : parse(f) }]));
const chargeTxt = q => (q === 0 ? '' : `${SUP[Math.abs(q)] ?? ''}${q > 0 ? '⁺' : '⁻'}`);
/** Texte Unicode d'une espèce : « MnO₄⁻ », « e⁻ » (avec l'état : « Cu²⁺(aq) »). */
export const texte = (id, etat = false) => { const s = ESPECES[id]; return `${s.aff ?? `${sub(s.f)}${chargeTxt(s.q)}`}${etat && s.etat ? `(${s.etat})` : ''}`; };
const cnt = (id, el) => ESPECES[id].els[el] || 0;
const pgcd = (a, b) => (b ? pgcd(b, a % b) : Math.abs(a));
export const ppcm = (a, b) => Math.abs(a * b) / pgcd(a, b);

/** Termes [[id, coef], ...] → « 2 H₂O + MnO₄⁻ » (les termes de coefficient nul sont ignorés). */
export const membre = (termes, etat = false) => termes.filter(([, c]) => c > 0).map(([id, c]) => `${c === 1 ? '' : `${c} `}${texte(id, etat && id !== 'em')}`).join(' + ');

// ---------------------------------------------------------------- couples (Ox / Red)
export const COUPLES = {
  'MnO4m/Mn2p': ['MnO4m', 'Mn2p'], 'MnO4m/MnO2': ['MnO4m', 'MnO2'], 'Cr2O72m/Cr3p': ['Cr2O72m', 'Cr3p'], 'I2/Im': ['I2', 'Im'], 'NO3m/NO': ['NO3m', 'NO'],
  'Cu2p/Cu': ['Cu2p', 'Cu'], 'Cu2p/Cu2O': ['Cu2p', 'Cu2O'], 'Fe3p/Fe2p': ['Fe3p', 'Fe2p'], 'H2O2/H2O': ['H2O2', 'H2O'], 'O2/H2O2': ['O2', 'H2O2'],
  'Hp/H2': ['Hp', 'H2'], 'SO42m/SO32m': ['SO42m', 'SO32m'], 'AlOH4m/Al': ['AlOH4m', 'Al'], 'RCOOm/RCHO': ['RCOOm', 'RCHO'], 'Agp/Ag': ['Agp', 'Ag'], 'ClOm/Clm': ['ClOm', 'Clm'], 'NO3m/NH4p': ['NO3m', 'NH4p'],
};
/** Nom du couple : « MnO₄⁻ / Mn²⁺ ». En milieu basique, le couple de l'eau s'écrit H₂O / H₂. */
export const coupleTxt = (id, milieu = 'acide') => (id === 'Hp/H2' && milieu === 'basique' ? 'H₂O / H₂' : `${texte(COUPLES[id][0])} / ${texte(COUPLES[id][1])}`);

const ORDRE_AFF = ['H2O', 'Hp', 'OHm', 'em'];
const trier = (termes, principaux) => [...termes].sort((a, b) => { const ia = principaux.includes(a[0]) ? -1 : ORDRE_AFF.indexOf(a[0]), ib = principaux.includes(b[0]) ? -1 : ORDRE_AFF.indexOf(b[0]); return ia - ib; });
const ajouter = (termes, id, k) => { const t = termes.find(([i]) => i === id); if (t) t[1] += k; else termes.push([id, k]); };
/** Coefficient d'une espèce dans un membre (0 si absente). */
export const coefDe = (termes, id) => (termes.find(([i]) => i === id) || [0, 0])[1];
const copie = ts => ts.map(([i, c]) => [i, c]);

/** Élément du premier temps : premier élément (autre que O et H) commun aux deux espèces, sinon O, sinon H. */
export function elementPrincipal(ox, red) {
  const communs = Object.keys(ESPECES[ox].els).filter(e => e !== 'O' && e !== 'H' && ESPECES[red].els[e]);
  if (communs.length) return communs[0];
  if (cnt(ox, 'O') && cnt(red, 'O')) return 'O';
  return 'H';
}

/**
 * Demi-équation d'un couple, établie pas à pas.
 * Retourne { id, ox, red, X, a, b, w, h, n, stades, acide, basique, k } avec
 *  - stades : liste d'étapes { cle, titre, gauche, droite, ajouts } : ajouts = espèces nouvellement écrites à cette étape ;
 *    clés : depart, element, oxygene, hydrogene, charges (milieu acide) puis ajoutHO, eau, simplifier (milieu basique, seulement si H⁺ ≠ 0) ;
 *  - acide / basique : { gauche, droite } finaux ; n : électrons ; k : nombre de H⁺ de la demi-équation acide (= nombre de HO⁻ ajoutés).
 */
export function demiEquation(coupleId) {
  const [ox, red] = COUPLES[coupleId], X = elementPrincipal(ox, red), cx = cnt(ox, X), cr = cnt(red, X), L = ppcm(cx, cr), a = L / cx, b = L / cr;
  let w = 0, h = 0;
  if (X !== 'H' && X !== 'O') w = a * cnt(ox, 'O') - b * cnt(red, 'O');
  if (X !== 'H') h = (b * cnt(red, 'H') + 2 * Math.max(0, w)) - (a * cnt(ox, 'H') + 2 * Math.max(0, -w));
  const n = a * ESPECES[ox].q + Math.max(0, h) - (b * ESPECES[red].q + Math.max(0, -h));
  const P = [ox, red], stades = [];
  const G = [[ox, 1]], D = [[red, 1]];
  stades.push({ cle: 'depart', gauche: copie(G), droite: copie(D), ajouts: [] });
  G[0][1] = a; D[0][1] = b;
  stades.push({ cle: 'element', gauche: copie(G), droite: copie(D), ajouts: [] });
  if (w > 0) ajouter(D, 'H2O', w); else if (w < 0) ajouter(G, 'H2O', -w);
  stades.push({ cle: 'oxygene', gauche: trier(G, P), droite: trier(D, P), ajouts: w ? ['H2O'] : [] });
  if (h > 0) ajouter(G, 'Hp', h); else if (h < 0) ajouter(D, 'Hp', -h);
  stades.push({ cle: 'hydrogene', gauche: trier(G, P), droite: trier(D, P), ajouts: h ? ['Hp'] : [] });
  if (n > 0) ajouter(G, 'em', n); else if (n < 0) ajouter(D, 'em', -n);
  stades.push({ cle: 'charges', gauche: trier(G, P), droite: trier(D, P), ajouts: n ? ['em'] : [] });
  const acide = { gauche: trier(G, P), droite: trier(D, P) }, kG = coefDe(G, 'Hp'), kD = coefDe(D, 'Hp'), k = kG + kD;
  // milieu basique : on ajoute k HO⁻ des deux côtés, H⁺ + HO⁻ → H₂O, puis on simplifie les H₂O
  const GB = copie(G), DB = copie(D);
  if (k) {
    ajouter(GB, 'OHm', k); ajouter(DB, 'OHm', k);
    stades.push({ cle: 'ajoutHO', gauche: trier(GB, P), droite: trier(DB, P), ajouts: ['OHm'] });
    const cote = kG > 0 ? GB : DB;                                                // côté où se trouvent les H⁺
    cote.splice(cote.findIndex(([i]) => i === 'Hp'), 1); cote.splice(cote.findIndex(([i]) => i === 'OHm'), 1); ajouter(cote, 'H2O', k);
    stades.push({ cle: 'eau', gauche: trier(GB, P), droite: trier(DB, P), ajouts: ['H2O'] });
    const g = GB.find(([i]) => i === 'H2O'), d = DB.find(([i]) => i === 'H2O');
    if (g && d) { const m = Math.min(g[1], d[1]); g[1] -= m; d[1] -= m; }
  }
  const basique = { gauche: trier(GB.filter(([, c]) => c > 0), P), droite: trier(DB.filter(([, c]) => c > 0), P) };
  if (k) stades.push({ cle: 'simplifier', gauche: basique.gauche, droite: basique.droite, ajouts: [] });
  return { id: coupleId, ox, red, X, a, b, w, h, n, k, stades, acide, basique };
}

export const NOMS_STADES = {
  depart: 'On écrit le couple : Ox = Red', element: '1. On équilibre l’élément principal', oxygene: '2. On équilibre O avec H₂O', hydrogene: '3. On équilibre H avec H⁺', charges: '4. On équilibre les charges avec e⁻',
  ajoutHO: '5. On ajoute autant de HO⁻ que de H⁺, des deux côtés', eau: '6. H⁺ + HO⁻ donne H₂O', simplifier: '7. On simplifie les H₂O',
};
export const demiTxt = (d, milieu = 'acide', etat = false) => { const m = milieu === 'basique' ? d.basique : d.acide; return `${membre(m.gauche, etat)} = ${membre(m.droite, etat)}`; };

// ---------------------------------------------------------------- bilan de conservation
/** Décompte d'un membre : atomes par élément et charge totale. */
export function decompte(termes) {
  const els = {}; let q = 0;
  for (const [id, c] of termes) { for (const [e, n] of Object.entries(ESPECES[id].els)) els[e] = (els[e] || 0) + c * n; q += c * ESPECES[id].q; }
  return { els, q };
}
/** Lignes du bilan : éléments (ordre : principal, O, H, autres) puis charge, avec les décomptes gauche/droite. */
export function bilanLignes(gauche, droite) {
  const g = decompte(gauche), d = decompte(droite), tous = [...new Set([...Object.keys(g.els), ...Object.keys(d.els)])];
  const ordre = e => (e === 'O' ? 1000 : e === 'H' ? 1001 : 0);
  const lignes = tous.sort((x, y) => ordre(x) - ordre(y)).map(e => ({ nom: e, g: g.els[e] || 0, d: d.els[e] || 0 }));
  lignes.push({ nom: 'charge', g: g.q, d: d.q });
  return lignes.map(l => ({ ...l, ok: l.g === l.d }));
}
export const equilibre = (gauche, droite) => bilanLignes(gauche, droite).every(l => l.ok);

// ---------------------------------------------------------------- équation de réaction
/**
 * Réaction entre l'oxydant du couple `ox` (il est réduit) et le réducteur du couple `red` (il est oxydé), en milieu acide ou basique.
 * Retourne { milieu, d1, d2, n1, n2, N, m1, m2, etapes: {gauche1, droite1, gauche2, droite2}, somme, final } où
 *  - somme : { reactifs, produits } avant simplification (les électrons ont déjà disparu) ; final : après simplification.
 */
export function reaction(ox, red, milieu = 'acide') {
  const d1 = demiEquation(ox), d2 = demiEquation(red), n1 = d1.n, n2 = d2.n, N = ppcm(n1, n2), m1 = N / n1, m2 = N / n2;
  const dm = d => (milieu === 'basique' ? d.basique : d.acide);
  const mul = (ts, k) => ts.map(([i, c]) => [i, c * k]);
  const g1 = mul(dm(d1).gauche, m1), r1 = mul(dm(d1).droite, m1);              // réduction : Ox1 + e⁻ → Red1
  const g2 = mul(dm(d2).gauche, m2), r2 = mul(dm(d2).droite, m2);              // le couple 2 est écrit Ox2 + e⁻ → Red2 ; il est parcouru à l'envers (oxydation)
  const R = [], Pd = [];
  for (const [i, c] of g1) ajouter(R, i, c);
  for (const [i, c] of r2) ajouter(R, i, c);                                    // Red2 + ... (membre de droite de la demi-équation 2)
  for (const [i, c] of r1) ajouter(Pd, i, c);
  for (const [i, c] of g2) ajouter(Pd, i, c);
  const sans = ts => ts.filter(([i, c]) => !(i === 'em' && c >= 0) || c < 0);
  const retire = (A, B, id) => { const a = A.find(([i]) => i === id), b = B.find(([i]) => i === id); if (a && b) { const m = Math.min(a[1], b[1]); a[1] -= m; b[1] -= m; } };
  retire(R, Pd, 'em');
  const somme = { reactifs: R.filter(([, c]) => c > 0).map(([i, c]) => [i, c]), produits: Pd.filter(([, c]) => c > 0).map(([i, c]) => [i, c]) };
  void sans;
  const R2 = copie(somme.reactifs), P2 = copie(somme.produits);
  for (const id of ['H2O', 'Hp', 'OHm']) retire(R2, P2, id);
  let fin = { reactifs: R2.filter(([, c]) => c > 0), produits: P2.filter(([, c]) => c > 0) };
  const g = [...fin.reactifs, ...fin.produits].reduce((x, [, c]) => pgcd(x, c), 0);
  if (g > 1) fin = { reactifs: fin.reactifs.map(([i, c]) => [i, c / g]), produits: fin.produits.map(([i, c]) => [i, c / g]) };
  const principaux = [d1.ox, d2.red, d1.red, d2.ox];
  fin = { reactifs: trier(fin.reactifs, principaux), produits: trier(fin.produits, principaux) };
  return { milieu, d1, d2, n1, n2, N, m1, m2, somme: { reactifs: trier(somme.reactifs, principaux), produits: trier(somme.produits, principaux) }, final: fin, facteur: g > 1 ? g : 1 };
}
export const equationTxt = (r, etat = false) => `${membre(r.reactifs, etat)} → ${membre(r.produits, etat)}`;
/** Coefficient d'une espèce dans un membre (0 si absente). */

// ---------------------------------------------------------------- transformations proposées
// ox : couple dont l'oxydant est réduit ; red : couple dont le réducteur est oxydé.
export const REACTIONS = [
  { id: 'cr-i', milieu: 'acide', titre: 'Dichromate et iodure', ox: 'Cr2O72m/Cr3p', red: 'I2/Im' },
  { id: 'no3-cu', milieu: 'acide', titre: 'Acide nitrique et cuivre', ox: 'NO3m/NO', red: 'Cu2p/Cu' },
  { id: 'h2o2-fe', milieu: 'acide', titre: 'Eau oxygénée et ions fer(II)', ox: 'H2O2/H2O', red: 'Fe3p/Fe2p' },
  { id: 'mno4-h2o2', milieu: 'acide', titre: 'Permanganate et eau oxygénée', ox: 'MnO4m/Mn2p', red: 'O2/H2O2' },
  { id: 'mno4-so3', milieu: 'basique', titre: 'Permanganate et sulfite', ox: 'MnO4m/MnO2', red: 'SO42m/SO32m' },
  { id: 'al-eau', milieu: 'basique', titre: 'Aluminium et soude (déboucheur)', ox: 'Hp/H2', red: 'AlOH4m/Al' },
  { id: 'clo-h2o2', milieu: 'basique', titre: 'Eau de Javel et eau oxygénée', ox: 'ClOm/Clm', red: 'O2/H2O2' },
  { id: 'rcho-ag', milieu: 'basique', titre: 'Aldéhyde et miroir d’argent', ox: 'Agp/Ag', red: 'RCOOm/RCHO' },
  { id: 'rcho-cu', milieu: 'basique', titre: 'Aldéhyde et liqueur de Fehling', ox: 'Cu2p/Cu2O', red: 'RCOOm/RCHO' },
];
export const reactionDe = id => { const t = REACTIONS.find(x => x.id === id); return { ...t, eq: reaction(t.ox, t.red, t.milieu) }; };
/** Couples proposés aux défis : (couple, milieu) pour lesquels la demi-équation est intéressante. */
export const COUPLES_DEFI = { acide: ['MnO4m/Mn2p', 'Cr2O72m/Cr3p', 'NO3m/NO', 'H2O2/H2O', 'O2/H2O2', 'RCOOm/RCHO'], basique: ['MnO4m/MnO2', 'ClOm/Clm', 'SO42m/SO32m', 'AlOH4m/Al', 'O2/H2O2', 'RCOOm/RCHO', 'Cu2p/Cu2O'] };

// ---------------------------------------------------------------- défis
const tire = t => t[Math.floor(Math.random() * t.length)];
/** Défi « demi-équation » : on demande le coefficient d'une espèce (H⁺ ou HO⁻, H₂O, e⁻) de la demi-équation écrite dans le milieu donné. */
export function tirageDefiDemi() {
  for (let k = 0; ; k++) {
    const milieu = tire(['acide', 'basique']), id = tire(COUPLES_DEFI[milieu]), d = demiEquation(id), m = milieu === 'basique' ? d.basique : d.acide;
    const cibles = [milieu === 'basique' ? 'OHm' : 'Hp', 'H2O', 'em'].filter(e => coefDe(m.gauche, e) + coefDe(m.droite, e) > 0);
    if (!cibles.length) continue;
    const cible = tire(cibles), coef = coefDe(m.gauche, cible) + coefDe(m.droite, cible);
    if (coef > 1 || k > 50) return { couple: id, milieu, cible, coef, d };
  }
}
/** Défi « équation de réaction » : coefficient d'une espèce de l'équation finale. */
export function tirageDefiEq() {
  for (let k = 0; ; k++) {
    const t = tire(REACTIONS), r = reaction(t.ox, t.red, t.milieu), ids = [...r.final.reactifs, ...r.final.produits].map(([i]) => i).filter(i => i !== 'em');
    const cible = tire(ids), coef = coefDe(r.final.reactifs, cible) + coefDe(r.final.produits, cible);
    if (coef > 1 || k > 50) return { t, r, cible, coef };
  }
}

/** Couples proposés aux exercices S'APP : demi-équation avec H⁺ et charges non nulles à équilibrer / passage au milieu basique avec au moins un H₂O restant. */
export const COUPLES_SAPP = ['MnO4m/Mn2p', 'MnO4m/MnO2', 'Cr2O72m/Cr3p', 'NO3m/NO', 'SO42m/SO32m', 'ClOm/Clm', 'H2O2/H2O', 'O2/H2O2'];
export const COUPLES_BASIQUE = ['MnO4m/MnO2', 'SO42m/SO32m', 'ClOm/Clm', 'O2/H2O2', 'RCOOm/RCHO'];
/** Couples des familles REA « demi-équation » (milieu acide) et des réactions REA « équation de réaction » (au moins quatre valeurs différentes parmi N et les coefficients). */
export const COUPLES_REA = ['MnO4m/Mn2p', 'Cr2O72m/Cr3p', 'NO3m/NH4p'];
export const REACTIONS_REA = ['cr-i', 'no3-cu', 'mno4-h2o2', 'mno4-so3', 'rcho-cu'];
