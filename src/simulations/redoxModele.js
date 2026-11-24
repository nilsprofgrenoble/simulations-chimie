// Modèle de la simulation « Oxydo-réduction : couples, demi-équations et équation de réaction » (sim 156, 1G spé PC).
// Fichier sans React, testé par redoxModele.test.mjs.
//
// Principe : chaque espèce est décrite par sa formule (éléments et nombres d'atomes) et sa charge. Les demi-équations sont ÉTABLIES par la méthode
// en quatre temps du cours (1. éléments autres que O et H ; 2. O avec H2O ; 3. H avec H+ ; 4. charges avec e-), puis l'équation de réaction est la
// somme de deux demi-équations multipliées pour que les électrons échangés soient en même nombre (ils disparaissent alors).
// Hypothèses : milieu acide seulement (le milieu basique est hors programme de 1G) ; on ne prévoit PAS le sens de la réaction (la classification
// des couples est hors programme) : les réactions proposées sont des transformations qui ont réellement lieu.

/** Couleurs de la simulation (bleu : oxydant/donnée, orange : réducteur/grandeur à repérer, vert : juste, rouge : piège). */
export const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', encre: '#0f172a' };

const SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = { 1: '', 2: '²', 3: '³' };
const sub = s => String(s).replace(/\d/g, d => SUB[+d]);

// formule (sans charge), charge, état physique
const DEF = {
  Cu: ['Cu', 0, 's'], Cu2p: ['Cu', 2, 'aq'], Ag: ['Ag', 0, 's'], Agp: ['Ag', 1, 'aq'], Fe: ['Fe', 0, 's'], Fe2p: ['Fe', 2, 'aq'], Fe3p: ['Fe', 3, 'aq'],
  Zn: ['Zn', 0, 's'], Zn2p: ['Zn', 2, 'aq'], Al: ['Al', 0, 's'], Al3p: ['Al', 3, 'aq'], Im: ['I', -1, 'aq'], I2: ['I2', 0, 'aq'],
  Hp: ['H', 1, 'aq'], H2: ['H2', 0, 'g'], MnO4m: ['MnO4', -1, 'aq'], Mn2p: ['Mn', 2, 'aq'], Cr2O72m: ['Cr2O7', -2, 'aq'], Cr3p: ['Cr', 3, 'aq'],
  H2O: ['H2O', 0, 'l'], H2O2: ['H2O2', 0, 'aq'], O2: ['O2', 0, 'g'], em: ['e', -1, ''],
};
const parse = f => { const o = {}; for (const [, el, n] of f.matchAll(/([A-Z][a-z]?)(\d*)/g)) o[el] = (o[el] || 0) + (n ? +n : 1); return o; };
export const ESPECES = Object.fromEntries(Object.entries(DEF).map(([id, [f, q, e]]) => [id, { id, f, q, etat: e, els: id === 'em' ? {} : parse(f) }]));

const chargeTxt = q => (q === 0 ? '' : `${SUP[Math.abs(q)] ?? ''}${q > 0 ? '⁺' : '⁻'}`);
/** Texte Unicode d'une espèce : « Cu²⁺ », « MnO₄⁻ », « e⁻ » (avec l'état si etat = true : « Cu²⁺(aq) »). */
export const texte = (id, etat = false) => { const s = ESPECES[id]; return `${sub(s.f)}${chargeTxt(s.q)}${etat && s.etat ? `(${s.etat})` : ''}`; };
/** Termes d'un membre : [[id, coef], ...] → « 2 Ag⁺ + Cu ». */
export const membre = (termes, etat = false) => termes.filter(([, c]) => c > 0).map(([id, c]) => `${c === 1 ? '' : `${c} `}${texte(id, etat && id !== 'em')}`).join(' + ');

const pgcd = (a, b) => (b ? pgcd(b, a % b) : Math.abs(a));
export const ppcm = (a, b) => Math.abs(a * b) / pgcd(a, b);
const cnt = (id, el) => ESPECES[id].els[el] || 0;

// ---------------------------------------------------------------- couples
export const COUPLES = {
  'Cu2p/Cu': ['Cu2p', 'Cu'], 'Ag+/Ag': ['Agp', 'Ag'], 'Fe2p/Fe': ['Fe2p', 'Fe'], 'Fe3p/Fe2p': ['Fe3p', 'Fe2p'], 'Zn2p/Zn': ['Zn2p', 'Zn'], 'Al3p/Al': ['Al3p', 'Al'],
  'I2/Im': ['I2', 'Im'], 'Hp/H2': ['Hp', 'H2'], 'MnO4m/Mn2p': ['MnO4m', 'Mn2p'], 'Cr2O72m/Cr3p': ['Cr2O72m', 'Cr3p'], 'O2/H2O2': ['O2', 'H2O2'],
};
export const coupleTxt = id => { const [ox, red] = COUPLES[id]; return `${texte(ox)}/${texte(red)}`; };

/** Élément servant au premier temps de la méthode (le premier élément autre que O et H commun aux deux espèces). */
export function elementPrincipal(ox, red) {
  const communs = Object.keys(ESPECES[ox].els).filter(e => e !== 'O' && e !== 'H' && ESPECES[red].els[e]);
  if (communs.length) return communs[0];
  if (cnt(ox, 'O') && cnt(red, 'O')) return 'O';
  return 'H';
}

/**
 * Demi-équation Ox + n e⁻ = Red (milieu acide), établie par la méthode en quatre temps.
 * Retourne { ox, red, a, b, w, h, n, gauche, droite } : a·Ox + h·H⁺ + n·e⁻ = b·Red + w·H₂O (h ou w négatif : l'espèce passe de l'autre côté).
 */
export function demiEquation(ox, red) {
  const X = elementPrincipal(ox, red), cx = cnt(ox, X), cr = cnt(red, X), L = ppcm(cx, cr), a = L / cx, b = L / cr;
  let w = 0, h = 0;
  if (X !== 'H' && X !== 'O') w = a * cnt(ox, 'O') - b * cnt(red, 'O');                        // temps 2 : l'oxygène (H2O du côté qui en manque)
  if (X !== 'H') h = (b * cnt(red, 'H') + 2 * Math.max(0, w)) - (a * cnt(ox, 'H') + 2 * Math.max(0, -w));   // temps 3 : l'hydrogène (H+ du côté qui en manque)
  const Lq = a * ESPECES[ox].q + Math.max(0, h), Rq = b * ESPECES[red].q + Math.max(0, -h);
  const n = Lq - Rq;                                                                           // temps 4 : les charges (e- du côté qui en manque)
  if (n <= 0 || !Number.isInteger(n)) throw new Error(`demi-équation impossible pour ${ox}/${red}`);
  const gauche = [[ox, a], ['Hp', Math.max(0, h)], ['em', n], ['H2O', Math.max(0, -w)]].filter(([, c]) => c > 0);
  const droite = [[red, b], ['H2O', Math.max(0, w)], ['Hp', Math.max(0, -h)]].filter(([, c]) => c > 0);
  return { ox, red, a, b, w, h, n, X, gauche, droite };
}
export const demiTxt = (d, etat = false) => `${membre(d.gauche, etat)} = ${membre(d.droite, etat)}`;
/** Demi-équation multipliée par k : toutes les quantités sont multipliées. */
export const multiplier = (termes, k) => termes.map(([id, c]) => [id, c * k]);

/**
 * Somme de m1 fois la demi-équation du couple 1 (sens direct Ox1 → Red1) et de m2 fois celle du couple 2 (sens inverse Red2 → Ox2).
 * Les électrons sont retirés (ils s'annulent seulement si m1·n1 = m2·n2) ; les espèces présentes des deux côtés sont simplifiées.
 * Retourne { couple1, couple2, d1, d2, n1, n2, m1, m2, egal, reactifs, produits, ecartE } (ecartE = électrons captés − cédés).
 */
export function sommer(couple1, couple2, m1, m2) {
  const [ox1, red1] = COUPLES[couple1], [ox2, red2] = COUPLES[couple2];
  const d1 = demiEquation(ox1, red1), d2 = demiEquation(ox2, red2);
  const net = {};
  const ajoute = (termes, k, signe) => termes.forEach(([id, c]) => { if (id !== 'em') net[id] = (net[id] || 0) + signe * k * c; });
  ajoute(d1.gauche, m1, 1); ajoute(d1.droite, m1, -1);        // Ox1 + ... = Red1 + ...   (sens direct)
  ajoute(d2.droite, m2, 1); ajoute(d2.gauche, m2, -1);        // Red2 + ... = Ox2 + ...   (sens inverse)
  const ordre = (liste, vers) => { const ids = Object.keys(net).filter(id => vers * net[id] > 0); return [...new Set([...liste.filter(id => ids.includes(id)), ...ids.filter(id => !liste.includes(id))])].map(id => [id, Math.abs(net[id])]); };
  const ecartE = m1 * d1.n - m2 * d2.n;
  return { couple1, couple2, d1, d2, n1: d1.n, n2: d2.n, m1, m2, egal: ecartE === 0, ecartE, reactifs: ordre([red2, ox1], 1), produits: ordre([ox2, red1], -1) };
}
/** Équation de réaction entre l'oxydant du couple 1 et le réducteur du couple 2 : multiplicateurs minimaux (E = ppcm des électrons échangés). */
export function equilibrer(couple1, couple2) {
  const [ox1, red1] = COUPLES[couple1], [ox2, red2] = COUPLES[couple2];
  const n1 = demiEquation(ox1, red1).n, n2 = demiEquation(ox2, red2).n, E = ppcm(n1, n2);
  return { ...sommer(couple1, couple2, E / n1, E / n2), E };
}
export const equationTxt = (r, etat = true) => `${membre(r.reactifs, etat)} → ${membre(r.produits, etat)}`;

// ---------------------------------------------------------------- vérification d'une équation proposée
/** Bilan par élément et par charge d'une équation { reactifs, produits } : [[id, coef]]. */
export function bilan(eq) {
  const somme = termes => { const t = { q: 0 }; termes.forEach(([id, c]) => { Object.entries(ESPECES[id].els).forEach(([el, n]) => { t[el] = (t[el] || 0) + n * c; }); t.q += ESPECES[id].q * c; }); return t; };
  const g = somme(eq.reactifs), d = somme(eq.produits);
  const els = [...new Set([...Object.keys(g), ...Object.keys(d)])].filter(k => k !== 'q');
  const manque = els.filter(e => (g[e] || 0) !== (d[e] || 0));
  return { g, d, manque, charge: g.q === d.q, ok: manque.length === 0 && g.q === d.q };
}
/** Compare une équation proposée (coefficients saisis) à la référence : conservée ? plus petits entiers ? */
export function verifierEquation(prop, ref) {
  const b = bilan(prop), tous = [...prop.reactifs, ...prop.produits].map(([, c]) => c);
  const g = tous.reduce((x, y) => pgcd(x, y), 0);
  const nul = tous.some(c => !(c >= 1));
  const juste = !nul && b.ok && g === 1;
  return { ...b, plusPetits: g === 1, nul, juste, attendu: ref };
}

// ---------------------------------------------------------------- transformations proposées (elles ont réellement lieu)
// couple1 : couple de l'oxydant qui réagit ; couple2 : couple du réducteur qui réagit.
// scene : plaque (métal de la lame, null si aucune), dépôt (espèce solide formée), couleur de la solution avant / après, observation écrite.
const SOL = { cu: '#6bb7e8', incolore: '#eaf3fb', jaune: '#f7efc9', fe2: '#cfe6c6', fe3: '#f0b04e', iode: '#8a4b1f', violet: '#8e2a9e', rose: '#f3e3f1', orange: '#f2c277' };
export const TRANSFORMATIONS = [
  { id: 'fe-cu', couple1: 'Cu2p/Cu', couple2: 'Fe2p/Fe', famille: 'métal', plaque: 'Fe', depot: 'Cu', avant: SOL.cu, apres: SOL.fe2, solution: 'solution de sulfate de cuivre(II)', obs: 'La lame de fer se couvre d’un dépôt rouge-orangé de cuivre ; la solution bleue pâlit et verdit légèrement.' },
  { id: 'zn-cu', couple1: 'Cu2p/Cu', couple2: 'Zn2p/Zn', famille: 'métal', plaque: 'Zn', depot: 'Cu', avant: SOL.cu, apres: SOL.incolore, solution: 'solution de sulfate de cuivre(II)', obs: 'La lame de zinc se couvre de cuivre ; la solution bleue se décolore.' },
  { id: 'cu-ag', couple1: 'Ag+/Ag', couple2: 'Cu2p/Cu', famille: 'métal', plaque: 'Cu', depot: 'Ag', avant: SOL.incolore, apres: SOL.cu, solution: 'solution de nitrate d’argent', obs: 'Des cristaux d’argent se déposent sur le fil de cuivre ; la solution devient bleue.' },
  { id: 'zn-ag', couple1: 'Ag+/Ag', couple2: 'Zn2p/Zn', famille: 'métal', plaque: 'Zn', depot: 'Ag', avant: SOL.incolore, apres: SOL.incolore, solution: 'solution de nitrate d’argent', obs: 'Des cristaux d’argent se déposent sur la lame de zinc ; la solution reste incolore.' },
  { id: 'fe-ag', couple1: 'Ag+/Ag', couple2: 'Fe2p/Fe', famille: 'métal', plaque: 'Fe', depot: 'Ag', avant: SOL.incolore, apres: SOL.fe2, solution: 'solution de nitrate d’argent', obs: 'Du fer en excès est plongé dans la solution : un dépôt d’argent se forme sur le fer ; la solution devient très pâle verdâtre.' },
  { id: 'al-cu', couple1: 'Cu2p/Cu', couple2: 'Al3p/Al', famille: 'métal', plaque: 'Al', depot: 'Cu', avant: SOL.cu, apres: SOL.incolore, solution: 'solution de chlorure de cuivre(II)', obs: 'La lame d’aluminium se couvre de cuivre ; la solution bleue se décolore.' },
  { id: 'fe-fe3', couple1: 'Fe3p/Fe2p', couple2: 'Fe2p/Fe', famille: 'métal', plaque: 'Fe', depot: null, avant: SOL.fe3, apres: SOL.fe2, solution: 'solution de chlorure de fer(III)', obs: 'La lame de fer se dissout peu à peu ; la solution orangée devient verdâtre.' },
  { id: 'zn-h', couple1: 'Hp/H2', couple2: 'Zn2p/Zn', famille: 'métal', plaque: 'Zn', depot: null, gaz: true, avant: SOL.incolore, apres: SOL.incolore, solution: 'solution d’acide chlorhydrique', obs: 'Des bulles de dihydrogène se forment sur la lame de zinc, qui se dissout.' },
  { id: 'fe-h', couple1: 'Hp/H2', couple2: 'Fe2p/Fe', famille: 'métal', plaque: 'Fe', depot: null, gaz: true, avant: SOL.incolore, apres: SOL.fe2, solution: 'solution d’acide chlorhydrique', obs: 'Des bulles de dihydrogène se forment sur la lame de fer, qui se dissout.' },
  { id: 'al-h', couple1: 'Hp/H2', couple2: 'Al3p/Al', famille: 'métal', plaque: 'Al', depot: null, gaz: true, avant: SOL.incolore, apres: SOL.incolore, solution: 'solution d’acide chlorhydrique', obs: 'Des bulles de dihydrogène se forment sur l’aluminium, qui se dissout.' },
  { id: 'fe3-i', couple1: 'Fe3p/Fe2p', couple2: 'I2/Im', famille: 'solution', plaque: null, depot: null, avant: SOL.incolore, apres: SOL.iode, solution: 'solution d’iodure de potassium', obs: 'En ajoutant des ions fer(III) (orangés) à une solution incolore d’iodure de potassium, la solution devient brune : le diiode se forme.' },
  { id: 'mno4-fe2', couple1: 'MnO4m/Mn2p', couple2: 'Fe3p/Fe2p', famille: 'acide', plaque: null, depot: null, avant: SOL.violet, apres: SOL.jaune, solution: 'solution acidifiée de sulfate de fer(II)', obs: 'La goutte violette de permanganate disparaît dans la solution acidifiée contenant les ions fer(II), qui devient très pâle, jaunâtre.' },
  { id: 'cr2o7-fe2', couple1: 'Cr2O72m/Cr3p', couple2: 'Fe3p/Fe2p', famille: 'acide', plaque: null, depot: null, avant: SOL.orange, apres: SOL.fe2, solution: 'solution acidifiée de sulfate de fer(II)', obs: 'La solution orangée de dichromate verdit en présence des ions fer(II) en milieu acide.' },
  { id: 'mno4-h2o2', couple1: 'MnO4m/Mn2p', couple2: 'O2/H2O2', famille: 'acide', plaque: null, depot: null, gaz: true, avant: SOL.violet, apres: SOL.incolore, solution: 'solution acidifiée d’eau oxygénée', obs: 'La solution violette de permanganate se décolore dans l’eau oxygénée acidifiée, avec un dégagement gazeux de dioxygène.' },
  { id: 'cr2o7-i', couple1: 'Cr2O72m/Cr3p', couple2: 'I2/Im', famille: 'acide', plaque: null, depot: null, avant: SOL.orange, apres: SOL.iode, solution: 'solution acidifiée d’iodure de potassium', obs: 'La solution orangée de dichromate, acidifiée, brunit en présence d’ions iodure : du diiode se forme.' },
  { id: 'mno4-i', couple1: 'MnO4m/Mn2p', couple2: 'I2/Im', famille: 'acide', plaque: null, depot: null, avant: SOL.violet, apres: SOL.iode, solution: 'solution acidifiée d’iodure de potassium', obs: 'La solution violette de permanganate, acidifiée, devient brune en présence d’ions iodure : du diiode se forme.' },
];
export const equationDe = t => equilibrer(t.couple1, t.couple2);
// La transformation « fe3-i » : l'oxydant est Fe³⁺ (couple Fe³⁺/Fe²⁺), le réducteur est I⁻ (couple I₂/I⁻)

/** Nom du réactif oxydant et du réducteur d'une transformation (identifiants d'espèces). */
