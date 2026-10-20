// ====================================================
//  SIMS 57 et 58 (2GT) — MODÈLE DE L'ATOME, DES IONS ET DES MOLÉCULES (logique pure, sans React)
//  Hypothèses de travail (celles du programme de seconde, à lire dans le panneau « Hypothèses » des simulations) :
//   • éléments de Z = 1 à 20 (jusqu'au calcium) ; ordre de remplissage 1s 2s 2p 3s 3p 4s ;
//   • « couche de valence » = couche (n) la plus externe occupée ; un entité est STABLE si elle a la configuration d'un gaz noble
//     (2 ou 8 électrons de valence, c'est-à-dire 2, 10 ou 18 électrons au total : He, Ne, Ar) ;
//   • molécule : modèle de Lewis (règle de l'octet, règle du duet pour H), liaisons covalentes simples, doubles ou triples,
//     sans charge formelle ni octet étendu (hors programme).
// ====================================================

const SUPS = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻' };
const SUBS = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
export const sup = s => String(s).replace(/[0-9+-]/g, c => SUPS[c]);
export const sub = s => String(s).replace(/[0-9]/g, c => SUBS[c]);
// Charge d'un ion en exposant : 2 → « ²⁺ », −1 → « ⁻ », 0 → ''
export const chargeTxt = q => (q === 0 ? '' : `${Math.abs(q) > 1 ? sup(Math.abs(q)) : ''}${q > 0 ? '⁺' : '⁻'}`);
export const ionTxt = (sym, q) => `${sym}${chargeTxt(q)}`;

// ---------- configuration électronique ----------
export const SOUS_COUCHES = [['1s', 2], ['2s', 2], ['2p', 6], ['3s', 2], ['3p', 6], ['4s', 2]];
// Remplit les sous-couches avec n électrons : [{ nom: '2p', e: 4, max: 6 }, …] (seulement les sous-couches non vides)
export function configuration(n) {
  let reste = Math.max(0, n);
  const res = [];
  for (const [nom, max] of SOUS_COUCHES) { if (reste <= 0) break; const e = Math.min(max, reste); res.push({ nom, e, max }); reste -= e; }
  return res;
}
export const configTxt = n => (n <= 0 ? '(aucun électron)' : configuration(n).map(s => `${s.nom}${sup(s.e)}`).join(' '));
// Électrons par couche (n = 1, 2, 3, 4) : [2, 8, 7]
export function couches(n) {
  const c = {};
  configuration(n).forEach(s => { const k = Number(s.nom[0]); c[k] = (c[k] || 0) + s.e; });
  return Object.keys(c).sort().map(k => c[k]);
}
export const valence = n => { const c = couches(n); return c.length ? c[c.length - 1] : 0; };
// Texte de la couche de valence : « 2s² 2p⁴ »
export function configValenceTxt(n) {
  const cs = configuration(n); if (!cs.length) return '—';
  const k = cs[cs.length - 1].nom[0];
  return cs.filter(s => s.nom[0] === k).map(s => `${s.nom}${sup(s.e)}`).join(' ');
}
export const GAZ_NOBLES = [{ sym: 'He', n: 2 }, { sym: 'Ne', n: 10 }, { sym: 'Ar', n: 18 }];
// Le nombre d'électrons n est celui d'un gaz noble ? (He, Ne, Ar)
export const gazNobleDe = n => GAZ_NOBLES.find(g => g.n === n) || null;

// ---------- éléments (Z = 1 à 20) ----------
// [Z, symbole, nom, période, colonne]
const BRUT = [
  [1, 'H', 'hydrogène', 1, 1], [2, 'He', 'hélium', 1, 18],
  [3, 'Li', 'lithium', 2, 1], [4, 'Be', 'béryllium', 2, 2], [5, 'B', 'bore', 2, 13], [6, 'C', 'carbone', 2, 14], [7, 'N', 'azote', 2, 15],
  [8, 'O', 'oxygène', 2, 16], [9, 'F', 'fluor', 2, 17], [10, 'Ne', 'néon', 2, 18],
  [11, 'Na', 'sodium', 3, 1], [12, 'Mg', 'magnésium', 3, 2], [13, 'Al', 'aluminium', 3, 13], [14, 'Si', 'silicium', 3, 14], [15, 'P', 'phosphore', 3, 15],
  [16, 'S', 'soufre', 3, 16], [17, 'Cl', 'chlore', 3, 17], [18, 'Ar', 'argon', 3, 18],
  [19, 'K', 'potassium', 4, 1], [20, 'Ca', 'calcium', 4, 2],
];
export const FAMILLES = {
  alcalin: { nom: 'les alcalins', nomSing: 'alcalin', court: 'Alcalins', colonne: 1 },
  terreux: { nom: 'les alcalino-terreux', nomSing: 'alcalino-terreux', court: 'Alcalino-terreux', colonne: 2 },
  halogene: { nom: 'les halogènes', nomSing: 'halogène', court: 'Halogènes', colonne: 17 },
  noble: { nom: 'les gaz nobles', nomSing: 'gaz noble', court: 'Gaz nobles', colonne: 18 },
};
const familleDe = (Z, col) => (Z === 1 ? null : col === 1 ? 'alcalin' : col === 2 ? 'terreux' : col === 17 ? 'halogene' : col === 18 ? 'noble' : null);
export const ELEMENTS = BRUT.map(([Z, sym, nom, periode, colonne]) => ({ Z, sym, nom, periode, colonne, famille: familleDe(Z, colonne) }));
export const element = Z => ELEMENTS.find(e => e.Z === Z);
export const elementDeSym = s => ELEMENTS.find(e => e.sym === s);
// Éléments connus par leur seule colonne (hors Z ≤ 20) : sert aux halogènes et alcalino-terreux du TP (Br, I, Sr)
export const HORS_LISTE = { halogene: ['Br', 'I'], terreux: ['Sr'], alcalin: ['Rb'] };
// Nombre d'électrons de valence d'un atome neutre d'après sa colonne (règle du tableau périodique)
export const valenceColonne = col => (col === 18 ? 8 : col <= 2 ? col : col - 10);

// Ion monoatomique « probable » : celui qui donne la configuration du gaz noble le plus proche.
// { q: charge, courant: bool } ou null (gaz nobles : pas d'ion ; carbone et silicium : pas d'ion monoatomique ; hydrogène : cas à part)
export function ionProbable(Z) {
  const e = element(Z); if (!e) return null;
  if (Z === 1) return { q: 1, courant: true, special: true };          // H⁺ : plus aucun électron
  if (e.colonne === 18 || e.colonne === 14) return null;
  if (e.colonne <= 2) return { q: e.colonne, courant: true };
  if (e.colonne === 13) return { q: 3, courant: Z === 13 };
  return { q: e.colonne - 18, courant: e.colonne >= 16 };               // 15 : −3 (N³⁻, P³⁻), 16 : −2, 17 : −1
}
// État d'une entité à n électrons pour l'élément Z (atome si n = Z, ion sinon)
export function etatEntite(Z, n) {
  const e = element(Z), q = Z - n;
  const gn = gazNobleDe(n);
  return { e, n, q, valence: valence(n), config: configTxt(n), configVal: configValenceTxt(n), gaz: gn, stable: !!gn,
    type: q === 0 ? 'atome' : q > 0 ? 'cation' : 'anion', formule: ionTxt(e.sym, q) };
}

// ---------- molécules (schémas de Lewis) ----------
// atomes : symboles ; ref : une structure correcte [i, j, ordre] (la solution montrée à l'élève ; d'autres structures peuvent être correctes)
export const MOLECULES = [
  { id: 'H2', formule: 'H₂', nom: 'dihydrogène', atomes: ['H', 'H'], ref: [[0, 1, 1]] },
  { id: 'HCl', formule: 'HCl', nom: 'chlorure d’hydrogène', atomes: ['H', 'Cl'], ref: [[0, 1, 1]] },
  { id: 'HF', formule: 'HF', nom: 'fluorure d’hydrogène', atomes: ['H', 'F'], ref: [[0, 1, 1]] },
  { id: 'Cl2', formule: 'Cl₂', nom: 'dichlore', atomes: ['Cl', 'Cl'], ref: [[0, 1, 1]] },
  { id: 'O2', formule: 'O₂', nom: 'dioxygène', atomes: ['O', 'O'], ref: [[0, 1, 2]] },
  { id: 'N2', formule: 'N₂', nom: 'diazote', atomes: ['N', 'N'], ref: [[0, 1, 3]] },
  { id: 'H2O', formule: 'H₂O', nom: 'eau', atomes: ['O', 'H', 'H'], ref: [[0, 1, 1], [0, 2, 1]] },
  { id: 'NH3', formule: 'NH₃', nom: 'ammoniac', atomes: ['N', 'H', 'H', 'H'], ref: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
  { id: 'CH4', formule: 'CH₄', nom: 'méthane', atomes: ['C', 'H', 'H', 'H', 'H'], ref: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
  { id: 'CO2', formule: 'CO₂', nom: 'dioxyde de carbone', atomes: ['C', 'O', 'O'], ref: [[0, 1, 2], [0, 2, 2]] },
  { id: 'C2H4', formule: 'C₂H₄', nom: 'éthène', atomes: ['C', 'C', 'H', 'H', 'H', 'H'], ref: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]] },
  { id: 'CH2O', formule: 'CH₂O', nom: 'méthanal', atomes: ['C', 'O', 'H', 'H'], ref: [[0, 1, 2], [0, 2, 1], [0, 3, 1]] },
  { id: 'HCN', formule: 'HCN', nom: 'cyanure d’hydrogène', atomes: ['C', 'N', 'H'], ref: [[0, 1, 3], [0, 2, 1]] },
  { id: 'C2H6O', formule: 'C₂H₆O', nom: 'éthanol ou éther diméthylique', atomes: ['C', 'C', 'O', 'H', 'H', 'H', 'H', 'H', 'H'],
    ref: [[0, 1, 1], [1, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1], [1, 6, 1], [1, 7, 1], [2, 8, 1]] },
];
export const moleculeDe = id => MOLECULES.find(m => m.id === id);
// Molécules proposées pour un défi (les plus simples d'abord)
export const MOLECULES_DEFI = ['HCl', 'HF', 'Cl2', 'O2', 'H2O', 'NH3', 'CH4', 'N2', 'CO2', 'CH2O', 'HCN', 'C2H4', 'C2H6O'];

const cle = (i, j) => (i < j ? `${i}-${j}` : `${j}-${i}`);
export const cleLiaison = cle;
// bonds : { '0-1': ordre } ; lp : nombre de doublets non liants par atome
export function ordreLiaison(bonds, i, j) { return bonds[cle(i, j)] || 0; }
export function liaisonsDe(bonds, i) { let b = 0; for (const k of Object.keys(bonds)) { const [a, c] = k.split('-').map(Number); if (a === i || c === i) b += bonds[k]; } return b; }
export const voisinsDe = (bonds, i) => Object.keys(bonds).map(k => k.split('-').map(Number)).filter(([a, c]) => (a === i || c === i) && bonds[cle(a, c)] > 0).map(([a, c]) => (a === i ? c : a));

// Analyse d'un schéma de Lewis : par atome, électrons de valence v, liaisons b, doublets non liants l,
// « utilisés » = b + 2l (doit valoir v), « autour » = 2b + 2l (doit valoir 8, ou 2 pour H)
export function analyserLewis(atomes, bonds, lp) {
  const par = atomes.map((sym, i) => {
    const v = valenceColonne(elementDeSym(sym).colonne), b = liaisonsDe(bonds, i), l = lp[i] || 0;
    const utilises = b + 2 * l, autour = 2 * b + 2 * l, cible = sym === 'H' ? 2 : 8;
    let msg = '';
    if (b === 0 && l === 0) msg = 'Cet atome n’est relié à rien : trace une liaison avec un autre atome.';
    else if (utilises > v) msg = `Trop d’électrons : ${sym} n’a que ${v} électron${v > 1 ? 's' : ''} de valence (liaisons + 2 × doublets non liants = ${utilises}).`;
    else if (utilises < v) {
      const r = v - utilises;
      msg = r >= 2 ? `Il reste ${r} électrons de valence à placer : ajoute un doublet non liant, ou une liaison.` : 'Il reste 1 électron de valence à placer : trace une liaison de plus.';
    } else if (autour < cible) msg = `Il manque ${cible - autour} électron${cible - autour > 1 ? 's' : ''} autour de ${sym} pour ${sym === 'H' ? 'le duet' : 'l’octet'} : fais une liaison de plus (liaison double ou triple, ou autre voisin) et retire un doublet non liant.`;
    else if (autour > cible) msg = `Trop d’électrons autour de ${sym} : ${autour} au lieu de ${cible}.`;
    return { sym, v, b, l, utilises, autour, cible, ok: msg === '', msg };
  });
  // connexe ?
  const vu = new Set([0]), pile = [0];
  while (pile.length) { const x = pile.pop(); voisinsDe(bonds, x).forEach(y => { if (!vu.has(y)) { vu.add(y); pile.push(y); } }); }
  const connexe = atomes.length > 0 && vu.size === atomes.length;
  const tousOk = par.every(a => a.ok);
  return { par, connexe, ok: tousOk && connexe,
    resume: tousOk && !connexe ? 'Chaque atome est satisfait, mais la molécule est en plusieurs morceaux : relie-les.' : '' };
}
// Doublets non liants d'une structure de liaisons correcte : (v − b)/2 par atome
export function doubletsAuto(atomes, bonds) {
  return atomes.map((sym, i) => Math.max(0, Math.floor((valenceColonne(elementDeSym(sym).colonne) - liaisonsDe(bonds, i)) / 2)));
}
export function liaisonsDeRef(ref) { const b = {}; ref.forEach(([i, j, o]) => { b[cle(i, j)] = o; }); return b; }

// ---------- familles : réactions et composés ioniques ----------
// Équation sous la forme { reactifs: [{ f, atomes: {Mg:1}, q: 0 }], produits: [...], eq: [coef de chaque espèce] }
const esp = (f, atomes, q = 0, etat = '') => ({ f, atomes, q, etat });
export const REACTIONS = {
  Mg: { fam: 'terreux', titre: 'Le magnésium dans l’eau', reactifs: [esp('Mg', { Mg: 1 }, 0, 's'), esp('H₂O', { H: 2, O: 1 }, 0, 'l')], produits: [esp('Mg²⁺', { Mg: 1 }, 2, 'aq'), esp('H₂', { H: 2 }, 0, 'g'), esp('HO⁻', { H: 1, O: 1 }, -1, 'aq')], coefs: [1, 2, 1, 1, 2] },
  Ca: { fam: 'terreux', titre: 'Le calcium dans l’eau', reactifs: [esp('Ca', { Ca: 1 }, 0, 's'), esp('H₂O', { H: 2, O: 1 }, 0, 'l')], produits: [esp('Ca²⁺', { Ca: 1 }, 2, 'aq'), esp('H₂', { H: 2 }, 0, 'g'), esp('HO⁻', { H: 1, O: 1 }, -1, 'aq')], coefs: [1, 2, 1, 1, 2] },
  Na: { fam: 'alcalin', titre: 'Le sodium dans l’eau', reactifs: [esp('Na', { Na: 1 }, 0, 's'), esp('H₂O', { H: 2, O: 1 }, 0, 'l')], produits: [esp('Na⁺', { Na: 1 }, 1, 'aq'), esp('H₂', { H: 2 }, 0, 'g'), esp('HO⁻', { H: 1, O: 1 }, -1, 'aq')], coefs: [2, 2, 2, 1, 2] },
  K: { fam: 'alcalin', titre: 'Le potassium dans l’eau', reactifs: [esp('K', { K: 1 }, 0, 's'), esp('H₂O', { H: 2, O: 1 }, 0, 'l')], produits: [esp('K⁺', { K: 1 }, 1, 'aq'), esp('H₂', { H: 2 }, 0, 'g'), esp('HO⁻', { H: 1, O: 1 }, -1, 'aq')], coefs: [2, 2, 2, 1, 2] },
};
// Précipités des halogénures avec l'ion argent (Br, I hors Z ≤ 20 : seul leur nom compte ici)
export const PRECIPITES = {
  Cl: { anion: 'Cl⁻', nom: 'chlorure d’argent', formule: 'AgCl', aspect: 'blanc' },
  Br: { anion: 'Br⁻', nom: 'bromure d’argent', formule: 'AgBr', aspect: 'jaune pâle' },
  I: { anion: 'I⁻', nom: 'iodure d’argent', formule: 'AgI', aspect: 'jaune' },
};
// Bilan des atomes et des charges d'une équation pour des coefficients donnés
export function bilanEquation(reaction, coefs) {
  const esps = [...reaction.reactifs, ...reaction.produits], nR = reaction.reactifs.length;
  const cote = (debut, fin) => {
    const at = {}; let q = 0;
    for (let k = debut; k < fin; k++) { Object.entries(esps[k].atomes).forEach(([a, n]) => { at[a] = (at[a] || 0) + n * coefs[k]; }); q += esps[k].q * coefs[k]; }
    return { at, q };
  };
  const G = cote(0, nR), D = cote(nR, esps.length);
  const noms = [...new Set([...Object.keys(G.at), ...Object.keys(D.at)])];
  const lignes = noms.map(a => ({ a, g: G.at[a] || 0, d: D.at[a] || 0 }));
  const equilibree = lignes.every(l => l.g === l.d) && G.q === D.q && coefs.every(c => c > 0);
  return { lignes, qG: G.q, qD: D.q, equilibree };
}
// Composé ionique : x cations de charge +p et y anions de charge −m avec x·p = y·m (plus petits entiers)
const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);
export function composeIonique(cation, anion) {
  const p = cation.q, m = -anion.q, d = pgcd(p, m);
  return { x: m / d, y: p / d };
}
export function formuleIonique(cation, anion) {
  const { x, y } = composeIonique(cation, anion);
  return `${cation.sym}${x > 1 ? sub(x) : ''}${anion.sym}${y > 1 ? sub(y) : ''}`;
}
const voyelle = s => /^[aeiouyéèh]/i.test(s);
export const nomIonique = (cation, anion) => `${anion.nom} ${voyelle(cation.nom) ? 'd’' : 'de '}${cation.nom}`;
export const CATIONS = [
  { sym: 'Na', q: 1, nom: 'sodium' }, { sym: 'K', q: 1, nom: 'potassium' }, { sym: 'Mg', q: 2, nom: 'magnésium' },
  { sym: 'Ca', q: 2, nom: 'calcium' }, { sym: 'Al', q: 3, nom: 'aluminium' },
];
export const ANIONS = [
  { sym: 'Cl', q: -1, nom: 'chlorure' }, { sym: 'F', q: -1, nom: 'fluorure' }, { sym: 'O', q: -2, nom: 'oxyde' }, { sym: 'S', q: -2, nom: 'sulfure' },
  { sym: 'N', q: -3, nom: 'nitrure' },
];
