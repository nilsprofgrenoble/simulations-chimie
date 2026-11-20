// ====================================================
//  SIM 188 (TG) — TRANSFERTS DE H⁺ : ACIDES CARBOXYLIQUES, CARBOXYLATES, AMINES, IONS AMMONIUM (logique pure, sans React)
//  Programme : « Modéliser des transformations acide-base par des transferts d'ion hydrogène H⁺ » (couples de l'eau, de l'acide carbonique, d'acides carboxyliques, d'amines).
//  Hypothèses de travail (reprises dans le panneau « Hypothèses » de la simulation) :
//   • modèle de Brønsted : un acide cède un ion H⁺, une base le capte ; un couple AH / A⁻ (acide / base conjuguée) ne diffère que par un H⁺ ;
//   • schéma de Lewis : octet (duet pour H), un trait = un doublet liant, un tiret = un doublet non liant, charge portée par l'atome concerné ;
//     le schéma est une écriture : les angles et les distances du dessin ne sont pas ceux de la molécule ;
//   • l'ion carboxylate (et l'ion carbonate) est dessiné avec UNE seule écriture (C=O et O⁻) : les deux atomes d'oxygène terminaux jouent en réalité un rôle équivalent
//     (la mésomérie n'est pas au programme et n'est pas traitée) ;
//   • H⁺ n'existe pas seul en solution : on l'écrit pour suivre le transfert (demi-équation) ; dans une réaction acide-base, le H⁺ passe d'un acide à une base,
//     ce qui fait apparaître H₃O⁺ (ou H₂O quand H₃O⁺ est consommé) ;
//   • dans une équation de réaction, la flèche → donne le sens du transfert étudié : elle ne dit pas si la transformation est totale ou limitée (cela dépend des Ka, hors sujet ici) ;
//   • aucun pKA, aucun Ka, aucun diagramme de prédominance ici ; pas de flèche courbe (mécanisme : sim. 186).
// ====================================================

export const L = 50;                       // longueur d'une liaison dans le dessin (unités du viewBox)
export const VALENCE = { H: 1, C: 4, N: 5, O: 6 };   // électrons de valence de l'atome seul
export const NOM_EL = { H: 'hydrogène', C: 'carbone', N: 'azote', O: 'oxygène' };
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const SUPS = { 2: '²' };

const at = (el, x, y, lp = []) => ({ el, x, y, lp });
const lien = (i, j, o = 1) => [i, j, o];
const mol = (atomes, liens) => ({ atomes, liens });

// ---------- comptages d'une structure ----------
export const nbLiaisons = (g, i) => g.liens.reduce((t, [a, b, o]) => t + (a === i || b === i ? o : 0), 0);
export const chargeAtome = (g, i) => VALENCE[g.atomes[i].el] - nbLiaisons(g, i) - 2 * g.atomes[i].lp.length;
export const chargeTotale = g => g.atomes.reduce((t, _, i) => t + chargeAtome(g, i), 0);
export function compterAtomes(g) { const c = {}; g.atomes.forEach(a => { c[a.el] = (c[a.el] || 0) + 1; }); return c; }
export const electronsAutour = (g, i) => 2 * nbLiaisons(g, i) + 2 * g.atomes[i].lp.length;
export const nT = g => g.atomes.reduce((t, a) => t + VALENCE[a.el], 0) - chargeTotale(g);   // électrons de valence à répartir
export const nDoublets = g => nT(g) / 2;
export const nDoubletsNonLiants = g => g.atomes.reduce((t, a) => t + a.lp.length, 0);
export const nDoubletsLiants = g => g.liens.reduce((t, [, , o]) => t + o, 0);

// Valide un schéma de Lewis : octet (duet pour H), 4 liaisons pour C, charges entières cohérentes. Renvoie la liste des problèmes (vide si correct).
export function valider(g) {
  const pb = [];
  g.atomes.forEach((a, i) => {
    const cible = a.el === 'H' ? 2 : 8, au = electronsAutour(g, i);
    if (au !== cible) pb.push(`${a.el}${i} : ${au} électrons autour au lieu de ${cible}`);
    if (a.el === 'C' && nbLiaisons(g, i) !== 4) pb.push(`C${i} : ${nbLiaisons(g, i)} liaisons au lieu de 4`);
    if (a.el === 'H' && a.lp.length) pb.push(`H${i} : doublet non liant`);
  });
  return pb;
}

// ---------- structures de départ (acides) ----------
const H3O = mol([at('O', 0, 0, [270]), at('H', -L, 0), at('H', L, 0), at('H', 0, L)], [lien(0, 1), lien(0, 2), lien(0, 3)]);
const NH4 = mol([at('N', 0, 0), at('H', -L, 0), at('H', L, 0), at('H', 0, L), at('H', 0, -L)], [lien(0, 1), lien(0, 2), lien(0, 3), lien(0, 4)]);
const CH3NH3 = mol([at('C', 0, 0), at('H', 0, -L), at('H', 0, L), at('H', -L, 0), at('N', L, 0), at('H', 2 * L, 0), at('H', L, L), at('H', L, -L)],
  [lien(0, 1), lien(0, 2), lien(0, 3), lien(0, 4), lien(4, 5), lien(4, 6), lien(4, 7)]);
// groupe carboxyle : C (0,0) ; O double en haut ; O(H) en bas à droite ; R en bas à gauche (zigzag, angles de 120° dans le dessin)
const D = 43, DD = 25;                     // L × cos 30° ≈ 43 ; L × sin 30° = 25
const carboxyle = (R) => {
  const a = [at('C', 0, 0), at('O', 0, -L, [180, 0]), at('O', D, DD, [270, 90]), at('H', D + L, DD)];
  const l = [lien(0, 1, 2), lien(0, 2), lien(2, 3)];
  if (R === 'H') { a.push(at('H', -D, DD)); l.push(lien(0, 4)); }
  else {   // R = CH3
    a.push(at('C', -D, DD), at('H', -D, DD + L), at('H', -2 * D, DD + DD), at('H', -2 * D, DD - DD));
    l.push(lien(0, 4), lien(4, 5), lien(4, 6), lien(4, 7));
  }
  return mol(a, l);
};

// ---------- retirer / ajouter H⁺ ----------
// Retire l'atome d'hydrogène h de l'acide : l'atome relié (site) garde le doublet de la liaison, qui devient un doublet non liant dans la direction de l'ancien H.
export function retirerH(g, h) {
  const l = g.liens.find(([a, b]) => a === h || b === h), site = l[0] === h ? l[1] : l[0];
  const ang = Math.round(((Math.atan2(g.atomes[h].y - g.atomes[site].y, g.atomes[h].x - g.atomes[site].x) * 180 / Math.PI) + 360) % 360);
  const atomes = g.atomes.map(a => ({ ...a, lp: [...a.lp] })); atomes[site].lp.push(ang);
  const garde = i => i !== h, nouv = i => i - (i > h ? 1 : 0);
  return { atomes: atomes.filter((_, i) => garde(i)), liens: g.liens.filter(([a, b]) => a !== h && b !== h).map(([a, b, o]) => [nouv(a), nouv(b), o]), site: nouv(site), angle: ang };
}

// ---------- espèces ----------
// id → { id, formule (écriture usuelle avec indices Unicode), sd (formule semi-développée), nom, graphe (schéma de Lewis) ou null, atomes, charge }
const fmtCharge = q => (q === 0 ? '' : `${Math.abs(q) > 1 ? SUPS[Math.abs(q)] : ''}${q > 0 ? '⁺' : '⁻'}`);
const ESP = {};
function def(id, formule, nom, graphe, extra = {}) {
  const g = graphe ? { atomes: graphe.atomes, liens: graphe.liens } : null;
  ESP[id] = { ...extra, id, formule, nom, graphe: g, atomes: g ? compterAtomes(g) : extra.atomes, charge: g ? chargeTotale(g) : extra.charge, sd: extra.sd || formule };
  return ESP[id];
}
const baseDe = (acide, h) => { const b = retirerH(acide, h); return { atomes: b.atomes, liens: b.liens }; };

// Couples : { id, acide, base, h (indice de l'atome H qui part, dans le graphe de l'acide), site (indice de l'atome qui reçoit le doublet, dans le graphe de la base) }
export const COUPLES = [];
function couple(id, acideId, baseId, h, texte) {
  COUPLES.push({ id, acide: acideId, base: baseId, h, ...texte });
}

def('H3O+', 'H₃O⁺', 'ion oxonium', H3O, { sd: 'H₃O⁺' });
def('H2O', 'H₂O', 'eau', baseDe(H3O, 3), { sd: 'H₂O' });
def('HO-', 'HO⁻', 'ion hydroxyde', baseDe(baseDe(H3O, 3), 2), { sd: 'HO⁻' });
def('CO2,H2O', 'CO₂,H₂O', 'dioxyde de carbone dissous', null, { atomes: { C: 1, H: 2, O: 3 }, charge: 0 });
// HCO₃⁻ et CO₃²⁻ : pas de schéma de Lewis (hors capacités du programme : seuls acide carboxylique, carboxylate, amine et ammonium le demandent)
def('HCO3-', 'HCO₃⁻', 'ion hydrogénocarbonate', null, { atomes: { C: 1, H: 1, O: 3 }, charge: -1, sd: 'HO–C(=O)–O⁻' });
def('CO3--', 'CO₃²⁻', 'ion carbonate', null, { atomes: { C: 1, O: 3 }, charge: -2, sd: '⁻O–C(=O)–O⁻' });
const ETHA = carboxyle('CH3'), METHA = carboxyle('H');
def('CH3COOH', 'CH₃COOH', 'acide éthanoïque', ETHA, { sd: 'CH₃–C(=O)–OH' });
def('CH3COO-', 'CH₃COO⁻', 'ion éthanoate', baseDe(ETHA, 3), { sd: 'CH₃–C(=O)–O⁻' });
def('HCOOH', 'HCOOH', 'acide méthanoïque', METHA, { sd: 'H–C(=O)–OH' });
def('HCOO-', 'HCOO⁻', 'ion méthanoate', baseDe(METHA, 3), { sd: 'H–C(=O)–O⁻' });
def('NH4+', 'NH₄⁺', 'ion ammonium', NH4, { sd: 'NH₄⁺' });
def('NH3', 'NH₃', 'ammoniac', baseDe(NH4, 4), { sd: 'NH₃' });
def('CH3NH3+', 'CH₃NH₃⁺', 'ion méthylammonium', CH3NH3, { sd: 'CH₃–NH₃⁺' });
def('CH3NH2', 'CH₃NH₂', 'méthylamine', baseDe(CH3NH3, 7), { sd: 'CH₃–NH₂' });

// graphe de l'acide d'un couple : celui de l'espèce acide ; le H qui part est repéré par son indice h dans ce graphe
couple('eau-oxonium', 'H3O+', 'H2O', 3, { texte: 'H₃O⁺ / H₂O', famille: 'eau' });
couple('eau-hydroxyde', 'H2O', 'HO-', 2, { texte: 'H₂O / HO⁻', famille: 'eau' });
couple('carbonique', 'CO2,H2O', 'HCO3-', null, { texte: 'CO₂,H₂O / HCO₃⁻', famille: 'acide carbonique' });
couple('hydrogenocarbonate', 'HCO3-', 'CO3--', null, { texte: 'HCO₃⁻ / CO₃²⁻', famille: 'acide carbonique' });
couple('ethanoique', 'CH3COOH', 'CH3COO-', 3, { texte: 'CH₃COOH / CH₃COO⁻', famille: 'acide carboxylique' });
couple('methanoique', 'HCOOH', 'HCOO-', 3, { texte: 'HCOOH / HCOO⁻', famille: 'acide carboxylique' });
couple('ammonium', 'NH4+', 'NH3', 4, { texte: 'NH₄⁺ / NH₃', famille: 'amine' });
couple('methylammonium', 'CH3NH3+', 'CH3NH2', 7, { texte: 'CH₃NH₃⁺ / CH₃NH₂', famille: 'amine' });

export const espece = id => ESP[id];
export const couplePar = id => COUPLES.find(c => c.id === id);
export const TOUTES_ESPECES = Object.values(ESP);
export const aLewis = c => !!(ESP[c.acide].graphe && ESP[c.base].graphe);

// Graphes de l'animation d'un couple : l'acide, et la base obtenue en retirant le H (mêmes atomes, mêmes positions)
export function grapheCouple(c) {
  const ac = ESP[c.acide].graphe; if (!ac || c.h == null) return null;
  const b = retirerH(ac, c.h);
  return { acide: ac, base: { atomes: b.atomes, liens: b.liens }, h: c.h, site: b.site, angle: b.angle };
}

// ---------- équations ----------
// Réaction entre l'acide du couple c1 et la base du couple c2 : A1 + B2 → B1 + A2 (espèces identiques regroupées)
const regrouper = ids => { const m = new Map(); ids.forEach(i => m.set(i, (m.get(i) || 0) + 1)); return [...m].map(([id, n]) => ({ id, n })); };
export function reaction(c1, c2) {
  return { c1, c2, reactifs: regrouper([c1.acide, c2.base]), produits: regrouper([c1.base, c2.acide]) };
}
export const texteTerme = ({ id, n }) => `${n > 1 ? n + ' ' : ''}${ESP[id].formule}`;
export const texteReaction = r => `${r.reactifs.map(texteTerme).join(' + ')} → ${r.produits.map(texteTerme).join(' + ')}`;
export function bilan(termes) {
  const at = {}; let q = 0;
  termes.forEach(({ id, n }) => { const e = ESP[id]; Object.entries(e.atomes).forEach(([el, k]) => { at[el] = (at[el] || 0) + n * k; }); q += n * e.charge; });
  return { atomes: at, charge: q };
}
export function conserve(r) {
  const a = bilan(r.reactifs), b = bilan(r.produits), els = new Set([...Object.keys(a.atomes), ...Object.keys(b.atomes)]);
  return { atomes: [...els].every(el => (a.atomes[el] || 0) === (b.atomes[el] || 0)), charge: a.charge === b.charge, reactifs: a, produits: b };
}
export const chargeTxt = q => (q === 0 ? '0' : `${q > 0 ? '+' : '−'}${Math.abs(q)}`);

// Espèces amphotères : à la fois acide d'un couple et base d'un autre couple de la liste
export function amphoteres() {
  const ac = new Set(COUPLES.map(c => c.acide)), ba = new Set(COUPLES.map(c => c.base));
  return [...ac].filter(id => ba.has(id));
}
export const couplesDe = id => COUPLES.filter(c => c.acide === id || c.base === id);
export const roleDans = (id, c) => (c.acide === id ? 'acide' : c.base === id ? 'base' : null);

// ---------- défis ----------
// Réactions du défi « équation » : [couple de l'acide, couple de la base] (coefficients tous égaux à 1)
// Chaque paire : [couple dont on prend l'ACIDE, couple dont on prend la BASE].
export const REACTIONS_DEFI = [
  ['ethanoique', 'ammonium'], ['ethanoique', 'methylammonium'], ['methanoique', 'ammonium'], ['methanoique', 'methylammonium'],
  ['ammonium', 'eau-hydroxyde'], ['methylammonium', 'eau-hydroxyde'], ['eau-oxonium', 'ammonium'], ['eau-oxonium', 'methylammonium'],
  ['eau-oxonium', 'ethanoique'], ['ethanoique', 'eau-hydroxyde'], ['ethanoique', 'eau-oxonium'], ['eau-hydroxyde', 'methylammonium'], ['eau-hydroxyde', 'ammonium'],
  ['eau-oxonium', 'carbonique'], ['ethanoique', 'carbonique'], ['hydrogenocarbonate', 'eau-hydroxyde'],
].map(([a, b]) => reaction(couplePar(a), couplePar(b)));

// Défi « schéma de Lewis » : espèce, atome cible (indice dans le graphe) ; réponse : nombre de doublets non liants et charge de cet atome
export const CIBLES_LEWIS = [];
['CH3COOH', 'CH3COO-', 'HCOOH', 'HCOO-', 'NH4+', 'NH3', 'CH3NH3+', 'CH3NH2'].forEach(id => {
  const g = ESP[id].graphe;
  g.atomes.forEach((a, i) => { if (a.el === 'O' || a.el === 'N') CIBLES_LEWIS.push({ id, i }); });
});
export const reponseLewis = ({ id, i }) => { const g = ESP[id].graphe; return { lp: g.atomes[i].lp.length, charge: chargeAtome(g, i) }; };
// graphe sans les doublets et la charge de l'atome cible (la charge se calcule : elle n'est pas dessinée pour l'atome cible)
export const sansReponse = ({ id, i }) => { const g = ESP[id].graphe; return { atomes: g.atomes.map((a, k) => (k === i ? { ...a, lp: [] } : a)), liens: g.liens }; };

// Formule écrite : renvoie les atomes d'une formule Unicode (pour les tests)
export function lireFormule(f) {
  let s = f, charge = 0;
  const m = s.match(/([²³]?)([⁺⁻])$/);
  if (m) { charge = (m[1] ? 2 : 1) * (m[2] === '⁺' ? 1 : -1); s = s.slice(0, s.length - m[0].length); }
  const at = {}; const re = /([A-Z][a-z]?)([₀-₉]*)/g; let r, lu = 0;
  const sans = s.replace(',', '');
  while ((r = re.exec(sans))) { lu += r[0].length; const n = r[2] ? [...r[2]].reduce((t, c) => t * 10 + SUBS.indexOf(c), 0) : 1; at[r[1]] = (at[r[1]] || 0) + n; }
  if (lu !== sans.length) throw new Error(`formule illisible : ${f}`);
  return { atomes: at, charge };
}
export { fmtCharge };
