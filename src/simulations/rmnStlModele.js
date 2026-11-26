// ═════════════════════════════════════════════════════════════════
//  SIM 306 — RMN DU PROTON, NIVEAU TERMINALE STL (modèle : sélection de molécules simples, banque de données de déplacements chimiques)
//  Programme STL : « attribuer les signaux d'un spectre RMN aux protons d'une molécule donnée » et « identifier ou confirmer une structure
//  en utilisant des banques de données », sur des cas simples. On réutilise la bibliothèque de spectres de la simulation 75 (BTS) sans la modifier ;
//  on n'en garde que les molécules dont tous les multiplets suivent la règle des n + 1 sans ambiguïté, sans proton labile, sans cycle aromatique.
//  Hypothèses : spectromètre de 400 MHz (non discuté ici : ni constante J ni champ B₀ au programme STL) ; multiplets du premier ordre ; δ usuels (CDCl₃).
// ═════════════════════════════════════════════════════════════════
import { MOL, visibles, spectre, courbeGroupe, plat } from './rmnModele.js';

export const NU = 400;
export { MOL, visibles, spectre, courbeGroupe, plat };

// molécules retenues pour le niveau STL (cas simples : aucun multiplet complexe, aucun H labile, aucun cycle)
export const IDS_STL = ['dichloroethane12', 'dichloroethane11', 'dichloropropane22', 'dichloropropane13', 'dibromopropane', 'neopentyl', 'ethoxyethane', 'bromobutane',
  'acetateethyle', 'propanoatemethyle', 'butanoateethyle', 'methylbutanone', 'dimethylpentanone'];
export const MOLS = IDS_STL.map(id => MOL[id]);
// familles d'isomères pour « identifier » (au moins deux candidats)
export const FAMILLES_STL = { C2H4Cl2: ['dichloroethane12', 'dichloroethane11'], C3H6Cl2: ['dichloropropane13', 'dichloropropane22'], C4H8O2: ['acetateethyle', 'propanoatemethyle'] };

// banque de données : déplacements chimiques usuels des protons (en ppm)
export const BANQUE = [
  { id: 'alkyle', type: 'H d’un CH₃ ou d’un CH₂ éloigné des atomes électronégatifs', plage: [0.8, 1.8] },
  { id: 'betaX', type: 'H d’un carbone voisin d’un carbone lié à Cl ou Br', plage: [1.6, 2.5] },
  { id: 'carbonyle', type: 'H d’un carbone voisin d’un groupe C=O', plage: [2.0, 2.7] },
  { id: 'CX', type: 'H d’un carbone lié à Cl, Br ou O', plage: [3.3, 4.4] },
  { id: 'CX2', type: 'H d’un carbone lié à deux atomes de chlore', plage: [5.5, 6.0] },
];
// type de proton de chaque groupe (clé du groupe dans rmnModele → ligne de la banque)
export const TYPE = {
  dichloroethane12: { ch2: 'CX' }, dichloroethane11: { ch: 'CX2', me: 'betaX' }, dichloropropane22: { me: 'betaX' },
  dichloropropane13: { ex: 'CX', ce: 'betaX' }, dibromopropane: { ex: 'CX', ce: 'betaX' }, neopentyl: { ch2: 'CX', me: 'alkyle' },
  ethoxyethane: { ch2: 'CX', me: 'alkyle' }, bromobutane: { br: 'CX', b: 'betaX', c: 'alkyle', me: 'alkyle' },
  acetateethyle: { och2: 'CX', ac: 'carbonyle', me: 'alkyle' }, propanoatemethyle: { ome: 'CX', ch2: 'carbonyle', me: 'alkyle' },
  butanoateethyle: { och2: 'CX', alpha: 'carbonyle', mid: 'alkyle', me2: 'alkyle', me1: 'alkyle' },
  methylbutanone: { ch: 'carbonyle', ac: 'carbonyle', me2: 'alkyle' }, dimethylpentanone: { ch2: 'carbonyle', ac: 'carbonyle', tbu: 'alkyle' },
};
export const ligneBanque = (m, x) => BANQUE.find(b => b.id === TYPE[m.id][x.k]);
// lignes de la banque compatibles avec un δ (une même valeur peut convenir à plusieurs lignes : il faut alors s'aider de la multiplicité)
export const compatibles = d => BANQUE.filter(b => d >= b.plage[0] && d <= b.plage[1]);

export const nbSignaux = m => m.liste.length;
export const nbH = m => m.N;
// multiplicité attendue d'un signal (règle des n + 1) : nom court (s, d, t, q, quint, sext, sept)
export const multiplicite = x => x.mult;
// hauteurs des paliers de la courbe d'intégration (mm) pour une échelle k (mm par proton)
export const paliers = (m, k) => m.liste.map(x => Math.round(x.n * k * 10) / 10);
export const NOMS_MULT = { s: 'singulet', d: 'doublet', t: 'triplet', q: 'quadruplet', quint: 'quintuplet', sext: 'sextuplet', sept: 'septuplet' };
// nombre de raies d'un signal : n + 1
export const nbRaies = x => x.nv + 1;
