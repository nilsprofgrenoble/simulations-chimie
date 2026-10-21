// ═══════════════════════════════════════════════════════════════════════════
//  SIM 74 — MAILLES CRISTALLINES : modèle (structures cubiques, sites interstitiels, cristaux ioniques)
//  Atomes = sphères dures. Les positions sont des coordonnées réduites (fractions de l'arête a) dans la maille [0 ; 1]³.
//  Un atome (ou un site) situé sur une face, une arête ou un sommet est partagé : son poids dans la maille vaut 1/2, 1/4 ou 1/8.
// ═══════════════════════════════════════════════════════════════════════════
import { ECHANTILLONS } from "./drxModele";

export { ECHANTILLONS };
export const NA = 6.02214076e23;
const R2 = Math.SQRT2, R3 = Math.sqrt(3);

export const POS = {
  P: [[0, 0, 0]],
  I: [[0, 0, 0], [0.5, 0.5, 0.5]],
  F: [[0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]],
};

// n : atomes par maille ; coord : coordinence ; R(a) : rayon des sphères tangentes ; C : compacité ; seg : direction de contact (coordonnées réduites)
export const STRUCT = {
  P: { cle: 'P', nom: 'cubique simple', court: 'CS', n: 1, coord: 6, contact: 'l’arête du cube', rel: 'a = 2 R', formR: 'a / 2', R: a => a / 2, C: Math.PI / 6, seg: [[0, 0, 0], [1, 0, 0]] },
  I: { cle: 'I', nom: 'cubique centré', court: 'CC', n: 2, coord: 8, contact: 'la diagonale du cube', rel: 'a√3 = 4 R', formR: 'a√3 / 4', R: a => a * R3 / 4, C: Math.PI * R3 / 8, seg: [[0, 0, 0], [1, 1, 1]] },
  F: { cle: 'F', nom: 'cubique à faces centrées', court: 'CFC', n: 4, coord: 12, contact: 'la diagonale d’une face', rel: 'a√2 = 4 R', formR: 'a√2 / 4', R: a => a * R2 / 4, C: Math.PI * R2 / 6, seg: [[0, 0, 0], [1, 1, 0]] },
};
export const METAUX_PAR_STRUCT = { P: ['Po'], I: ['W', 'Fe', 'Cr', 'Mo'], F: ['Cu', 'Al', 'Ni', 'Ag'] };

export const compacite = (n, R, a) => n * (4 / 3) * Math.PI * R ** 3 / a ** 3;
export const masseVol = (n, M, a) => n * M / (NA * (a * 1e-7) ** 3);   // g/cm³, a en nm

// Fermeture d'une liste de positions { p, esp } : un atome en 0 est répété en 1, avec le poids correspondant.
export function fermer(positions) {
  const out = [];
  positions.forEach(({ p, esp }) => {
    let combos = [[]], w = 1;
    p.forEach(v => { const nul = Math.abs(v) < 1e-9; if (nul) w /= 2; combos = combos.flatMap(c => (nul ? [0, 1] : [v]).map(x => [...c, x])); });
    combos.forEach(c => out.push({ p: c, w, esp }));
  });
  return out;
}
export const cleLigne = (esp, w) => `${esp}|${w}`;
export function denombrer(atomes) {
  const m = new Map();
  atomes.forEach(a => { const k = cleLigne(a.esp, a.w), g = m.get(k) || { esp: a.esp, w: a.w, nb: 0 }; g.nb++; m.set(k, g); });
  return [...m.values()].sort((x, y) => x.esp - y.esp || x.w - y.w);
}
export const FR = { 0.125: '1/8', 0.25: '1/4', 0.5: '1/2', 1: '1' };

// ---------- sites interstitiels ----------
const tetI = [];
[[0.5, 0.25, 0], [0.5, 0.75, 0], [0.25, 0.5, 0], [0.75, 0.5, 0]].forEach(([x, y, z]) => { tetI.push([x, y, z], [z, x, y], [y, z, x]); });
const tetF = []; [0.25, 0.75].forEach(x => [0.25, 0.75].forEach(y => [0.25, 0.75].forEach(z => tetF.push([x, y, z]))));
export const SITES = {
  F: { oct: [[0.5, 0.5, 0.5], [0.5, 0, 0], [0, 0.5, 0], [0, 0, 0.5]], tet: tetF, nOct: 4, nTet: 8 },
  I: { oct: [[0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5], [0.5, 0, 0], [0, 0.5, 0], [0, 0, 0.5]], tet: tetI, nOct: 6, nTet: 12 },
};
// rayon de la plus grande sphère qui tient dans le site (tangente aux atomes hôtes de rayon R)
export const formSite = { F: { oct: 'a / 2 − R', tet: 'a√3 / 4 − R' }, I: { oct: 'a / 2 − R', tet: 'a√5 / 4 − R' } };
export const rSite = (type, site, a, R) => (site === 'oct' ? a / 2 - R : a * (type === 'F' ? R3 / 4 : Math.sqrt(5) / 4) - R);

export const HOTES = {
  FeA: { nom: 'fer α', formule: 'Fe α', type: 'I', a: 0.28665, M: 55.845 },
  FeG: { nom: 'fer γ', formule: 'Fe γ', type: 'F', a: 0.3647, M: 55.845 },
  Pd: { nom: 'palladium', formule: 'Pd', type: 'F', a: 0.38907, M: 106.42 },
};
// rayons covalents approchés (nm)
export const INSERES = { H: { nom: 'hydrogène', r: 0.032 }, C: { nom: 'carbone', r: 0.077 }, N: { nom: 'azote', r: 0.071 }, O: { nom: 'oxygène', r: 0.066 } };

// ---------- cristaux ioniques ----------
// r : rayons ioniques (nm) ; seg : un contact cation–anion ; somme(a) : r₊ + r₋ déduit de a ; aDe(s) : a déduit de r₊ + r₋
const anionsF = POS.F;
export const IONIQUES = {
  CsCl: { nom: 'chlorure de césium', formule: 'CsCl', a: 0.4123, M: 168.36, rho: 3.99, cat: { nom: 'Cs⁺', r: 0.174 }, an: { nom: 'Cl⁻', r: 0.181 },
    anions: [[0, 0, 0]], cations: [[0.5, 0.5, 0.5]], coord: 8, seg: [[0, 0, 0], [0.5, 0.5, 0.5]], rel: 'a√3 = 2 (r₊ + r₋)', formA: 'a√3 / 2', aDe: s => 2 * s / R3, contact: 'la diagonale du cube',
    desc: 'les ions Cl⁻ occupent les sommets du cube et un ion Cs⁺ occupe le centre' },
  NaCl: { nom: 'chlorure de sodium', formule: 'NaCl', a: 0.5640, M: 58.44, rho: 2.165, cat: { nom: 'Na⁺', r: 0.102 }, an: { nom: 'Cl⁻', r: 0.181 },
    anions: anionsF, cations: [[0.5, 0, 0], [0, 0.5, 0], [0, 0, 0.5], [0.5, 0.5, 0.5]], coord: 6, seg: [[0, 0, 0], [0.5, 0, 0]], rel: 'a = 2 (r₊ + r₋)', formA: 'a / 2', aDe: s => 2 * s, contact: 'l’arête du cube',
    desc: 'les ions Cl⁻ forment un réseau cubique à faces centrées et les ions Na⁺ occupent tous les sites octaédriques' },
  ZnS: { nom: 'sulfure de zinc (blende)', formule: 'ZnS', a: 0.5409, M: 97.47, rho: 4.09, cat: { nom: 'Zn²⁺', r: 0.060 }, an: { nom: 'S²⁻', r: 0.184 },
    anions: anionsF, cations: [[0.25, 0.25, 0.25], [0.75, 0.75, 0.25], [0.75, 0.25, 0.75], [0.25, 0.75, 0.75]], coord: 4, seg: [[0, 0, 0], [0.25, 0.25, 0.25]], rel: 'a√3 = 4 (r₊ + r₋)', formA: 'a√3 / 4', aDe: s => 4 * s / R3, contact: 'la diagonale d’un petit cube d’arête a / 2',
    desc: 'les ions S²⁻ forment un réseau cubique à faces centrées et les ions Zn²⁺ occupent la moitié des sites tétraédriques' },
};
// règle des rapports de rayons : coordinence prévue pour r₊ / r₋
export const coordPrevue = q => (q < 0.225 ? 3 : q < 0.414 ? 4 : q < 0.732 ? 6 : 8);
