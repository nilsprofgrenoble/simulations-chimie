// ====================================================
//  Modèle de la simulation 146 « Tensioactifs : de la structure à la CMC » (BTS MDC, Formulation)
//  Relation de Klevens / Traube : log₁₀(CMC / 1 mmol·L⁻¹) = A(tête) − B·n, n = nombre de carbones de la chaîne.
//  A et B sont AJUSTÉS ici, au chargement, sur les données ci-dessous (jamais écrits à la main) :
//   • non ioniques et amphotères : une pente B commune, un A par famille de tête ;
//   • sulfates et ammoniums quaternaires : une droite par famille.
//  Données : tableau de détergents fourni par Nils (CMC à 20-25 °C) ; sulfates et ammoniums : série de H. Yamamoto
//  (pages Pirika) reprise par S. Abbott (licence CC BY, valeurs « illustratives », 25 °C, faible salinité).
//  Hypothèses : voir le panneau de la simulation (monodisperse, 25 °C, eau pure, domaine de n par famille).
// ====================================================

export const RT = 2.479;                       // kJ/mol à 298 K
export const NS = 16;                          // emplacements de monomères à l'interface dans la scène

const moy = p => (p.hi ? Math.sqrt(p.lo * p.hi) : p.lo);

// classe : 'non ionique' | 'anionique' | 'cationique' | 'amphotère'
export const FAMILLES = [
  { id: 'maltoside', nom: 'maltoside', classe: 'non ionique', tete: 'maltose (sucre, non chargé)', dom: [10, 16], groupe: 'commun' },
  { id: 'glucamide', nom: 'N-méthylglucamide', classe: 'non ionique', tete: 'N-méthylglucamine (sucre, non chargé)', dom: [8, 10], groupe: 'commun' },
  { id: 'phosphine', nom: 'oxyde de diméthylphosphine', classe: 'non ionique', tete: 'oxyde de phosphine (polaire, non chargé)', dom: [10, 12], groupe: 'commun' },
  { id: 'sulfobetaine', nom: 'sulfobétaïne', classe: 'amphotère', tete: 'ammonium + sulfonate (± , charge totale nulle)', dom: [8, 16], groupe: 'commun' },
  { id: 'sulfate', nom: 'sulfate de sodium', classe: 'anionique', tete: 'sulfate (−), contre-ion Na⁺', dom: [8, 14], groupe: 'seul' },
  { id: 'ammonium', nom: 'bromure d’alkyltriméthylammonium', classe: 'cationique', tete: 'ammonium quaternaire (+), contre-ion Br⁻', dom: [8, 16], groupe: 'seul' },
];

// points d'étalonnage : [famille, n, CMC ou borne basse, borne haute, nom, source]
const S_T = 'tableau', S_S = 'série';
export const POINTS = [
  ['maltoside', 10, 1.6, null, 'décyl-β-D-maltopyranoside', S_T], ['maltoside', 11, 0.59, null, 'undécyl-β-D-maltoside', S_T],
  ['maltoside', 12, 0.15, null, 'dodécyl-β-D-maltoside', S_T], ['maltoside', 16, 0.0006, null, 'hexadécyl-β-D-maltoside', S_T],
  ['glucamide', 8, 58, null, 'MEGA-8', S_T], ['glucamide', 9, 19, 25, 'MEGA-9', S_T], ['glucamide', 10, 6, 7, 'MEGA-10', S_T],
  ['phosphine', 10, 4.6, null, 'APO-10', S_T], ['phosphine', 12, 0.568, null, 'APO-12', S_T],
  ['sulfobetaine', 8, 330, null, 'SB3-8', S_T], ['sulfobetaine', 10, 25, 40, 'SB3-10', S_T], ['sulfobetaine', 12, 2, 4, 'SB3-12', S_T],
  ['sulfobetaine', 14, 0.1, 0.4, 'SB3-14', S_T], ['sulfobetaine', 16, 0.01, 0.06, 'SB3-16', S_T],
  ['sulfate', 8, 130, null, 'octyl sulfate de sodium', S_S], ['sulfate', 9, 65, null, 'nonyl sulfate de sodium', S_S], ['sulfate', 10, 33, null, 'décyl sulfate de sodium', S_S],
  ['sulfate', 11, 16, null, 'undécyl sulfate de sodium', S_S], ['sulfate', 12, 8, null, 'dodécyl sulfate de sodium (SDS)', S_S],
  ['sulfate', 13, 4, null, 'tridécyl sulfate de sodium', S_S], ['sulfate', 14, 2.2, null, 'tétradécyl sulfate de sodium', S_S],
  ['ammonium', 8, 290, null, 'octyltriméthylammonium (OTAB)', S_S], ['ammonium', 9, 139, null, 'nonyltriméthylammonium', S_S], ['ammonium', 10, 60, null, 'décyltriméthylammonium (DTAB)', S_S],
  ['ammonium', 11, 36, null, 'undécyltriméthylammonium', S_S], ['ammonium', 12, 13.3, null, 'dodécyltriméthylammonium', S_S],
  ['ammonium', 14, 3.41, null, 'tétradécyltriméthylammonium (TTAB)', S_S], ['ammonium', 16, 1, null, 'hexadécyltriméthylammonium (CTAB)', S_S],
].map(([fam, n, lo, hi, nom, src]) => ({ fam, n, lo, hi, nom, src }));

// valeurs du tableau fourni pour des tensioactifs ioniques : servent à comparer, pas à ajuster
export const TABLEAU_IONIQUES = [
  { fam: 'sulfate', n: 12, lo: 7, hi: 10, nom: 'dodécyl sulfate de sodium (SDS)', src: S_T },
  { fam: 'ammonium', n: 14, lo: 4, hi: 5, nom: 'TTAB', src: S_T },
  { fam: 'ammonium', n: 16, lo: 1, hi: null, nom: 'CTAB', src: S_T },
];

// nombres d'agrégation du tableau fourni (jamais estimés)
export const N_AGG = { 'sulfobetaine:10': 41, 'sulfobetaine:12': 55, 'sulfobetaine:14': 83, 'sulfobetaine:16': 155, 'sulfate:12': 62, 'ammonium:14': 80, 'ammonium:16': 170, 'maltoside:12': 98 };
export const nAgg = (fam, n) => N_AGG[`${fam}:${n}`] ?? null;

// ---------- ajustement par moindres carrés ----------
function ajuster() {
  const param = {};
  const stats = f => {
    const P = POINTS.filter(p => p.fam === f).map(p => [p.n, Math.log10(moy(p))]);
    const xb = P.reduce((s, p) => s + p[0], 0) / P.length, yb = P.reduce((s, p) => s + p[1], 0) / P.length;
    return { xb, yb, sxx: P.reduce((s, p) => s + (p[0] - xb) ** 2, 0), sxy: P.reduce((s, p) => s + (p[0] - xb) * (p[1] - yb), 0) };
  };
  const comm = FAMILLES.filter(f => f.groupe === 'commun'), st = Object.fromEntries(FAMILLES.map(f => [f.id, stats(f.id)]));
  const Bc = -comm.reduce((s, f) => s + st[f.id].sxy, 0) / comm.reduce((s, f) => s + st[f.id].sxx, 0);
  FAMILLES.forEach(f => {
    const s = st[f.id], B = f.groupe === 'commun' ? Bc : -s.sxy / s.sxx;
    param[f.id] = { A: s.yb + B * s.xb, B };
  });
  return param;
}
export const PARAM = ajuster();

// ---------- prédiction ----------
export const famille = id => FAMILLES.find(f => f.id === id);
export const dansDomaine = (id, n) => { const f = famille(id); return !!f && Number.isInteger(n) && n >= f.dom[0] && n <= f.dom[1]; };
// CMC prédite en mmol/L (null hors domaine : on ne prédit pas hors des données)
export function cmc(id, n) { return dansDomaine(id, n) ? 10 ** (PARAM[id].A - PARAM[id].B * n) : null; }
export const FACTEUR_BANDE = 2;
export const bande = (id, n) => { const c = cmc(id, n); return c == null ? null : [c / FACTEUR_BANDE, c * FACTEUR_BANDE]; };
// énergie libre de micellisation par CH₂ (kJ/mol) : B · RT · ln 10
export const kJParCH2 = id => PARAM[id].B * RT * Math.LN10;

// valeur de référence à comparer : le tableau fourni d'abord, sinon la série ou le point d'étalonnage
export function reference(id, n) {
  const t = TABLEAU_IONIQUES.find(p => p.fam === id && p.n === n);
  const p = t ?? POINTS.find(q => q.fam === id && q.n === n);
  return p ? { lo: p.lo, hi: p.hi, nom: p.nom, src: p.src, val: moy(p) } : null;
}
// écart multiplicatif entre prédiction et référence (≥ 1), 1 si la prédiction est dans l'intervalle de référence
export function ecartFacteur(id, n) {
  const c = cmc(id, n), r = reference(id, n);
  if (c == null || !r) return null;
  const lo = r.lo, hi = r.hi ?? r.lo;
  if (c >= lo && c <= hi) return 1;
  return c < lo ? lo / c : c / hi;
}

// ---------- scène : ce que l'on voit selon c / CMC ----------
// Hypothèse pédagogique annoncée : l'interface est visiblement saturée avant l'apparition des micelles (dans la réalité,
// la saturation est progressive et les micelles se forment sur un petit intervalle autour de la CMC).
export const X_SAT = 0.5;                       // c / CMC à partir duquel l'interface est dessinée pleine
const A_LANG = 0.04;                             // constante du Langmuir stylisé, en unités de CMC
// tension superficielle, QUALITATIVE (aucune valeur chiffrée affichée) : décroît linéairement en log c jusqu'à la CMC, puis plateau
export const tensionRel = x => (x >= 1 ? 0.5 : 1 - 0.5 * Math.min(1, (Math.log10(x) + 3) / 3));
export function etatScene(x) {
  const th = Math.min(1, (x / (x + A_LANG)) / (X_SAT / (X_SAT + A_LANG)));
  const nSurf = x < 0.002 ? 0 : Math.max(1, Math.round(NS * th));
  const nVol = x < 0.01 ? 0 : x >= 1 ? 12 : Math.max(1, Math.round(12 * Math.sqrt(x)));
  const nMic = x < 1 ? 0 : Math.min(4, 1 + Math.floor(Math.log10(x) * 3.5));
  const stade = x < 0.05 ? 'interface' : x < X_SAT ? 'volume' : x < 1 ? 'saturation' : 'micelles';
  return { couverture: th, nSurf, nVol, nMic, stade, libres: Math.min(x, 1), tension: tensionRel(x) };
}
// curseur 0..100 → c / CMC (échelle logarithmique de 0,001 à 10)
export const xDeCurseur = s => 10 ** (-3 + 4 * s / 100);
export const curseurDeX = x => Math.round((Math.log10(x) + 3) / 4 * 100);

// nom de la molécule choisie (famille + nombre de carbones de la chaîne)
const PREF = { 8: 'octyl', 9: 'nonyl', 10: 'décyl', 11: 'undécyl', 12: 'dodécyl', 13: 'tridécyl', 14: 'tétradécyl', 15: 'pentadécyl', 16: 'hexadécyl' };
export function nomMolecule(id, n) {
  const p = PREF[n] ?? `${n} C`;
  return ({
    sulfate: `${p}sulfate de sodium${n === 12 ? ' (SDS)' : ''}`, ammonium: `bromure de ${p}triméthylammonium`, maltoside: `${p}-β-D-maltoside`,
    glucamide: `MEGA-${n} (N-méthylglucamide)`, phosphine: `APO-${n} (oxyde de ${p}diméthylphosphine)`, sulfobetaine: `SB3-${n} (sulfobétaïne)`,
  })[id];
}
