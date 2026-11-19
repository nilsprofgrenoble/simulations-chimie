// ====================================================
//  Modèle de la simulation « Dissolution d'un solide ionique dans l'eau : équation et concentration des ions » (1G spé PC, sim 157).
//  Modèle pur (sans React), testé par dissolutionModele.test.mjs.
//  Hypothèses : solide ionique pur et anhydre, totalement dissous (concentrations modestes, loin de la solubilité) ; dissociation totale
//  (aucune paire d'ions, aucune réaction des ions avec l'eau) ; volume de la solution = volume de la fiole jaugée ; masses molaires
//  atomiques arrondies au dixième (modèle de la simulation 152). La formule du solide est une formule statistique : elle donne les
//  proportions d'ions, pas une molécule. La conductivité et la solubilité maximale ne sont pas traitées.
// ====================================================
import { MM_ATOME } from './quantiteMatiereModele.js';

const MM = { ...MM_ATOME, Al: 27.0 };

// Sels proposés. f = formule statistique (affichage) ; atomes = [symbole, nombre] pour la masse molaire ;
// cat / an = ion positif / négatif : s = symbole avec charge, q = valeur absolue de la charge, nu = nombre d'ions par formule, nom, poly = ion polyatomique.
export const SELS = [
  { id: 'nacl', nom: 'chlorure de sodium', f: 'NaCl', atomes: [['Na', 1], ['Cl', 1]], cat: { s: 'Na⁺', q: 1, nu: 1, nom: 'ion sodium' }, an: { s: 'Cl⁻', q: 1, nu: 1, nom: 'ion chlorure' } },
  { id: 'kcl', nom: 'chlorure de potassium', f: 'KCl', atomes: [['K', 1], ['Cl', 1]], cat: { s: 'K⁺', q: 1, nu: 1, nom: 'ion potassium' }, an: { s: 'Cl⁻', q: 1, nu: 1, nom: 'ion chlorure' } },
  { id: 'cacl2', nom: 'chlorure de calcium', f: 'CaCl₂', atomes: [['Ca', 1], ['Cl', 2]], cat: { s: 'Ca²⁺', q: 2, nu: 1, nom: 'ion calcium' }, an: { s: 'Cl⁻', q: 1, nu: 2, nom: 'ion chlorure' } },
  { id: 'mgcl2', nom: 'chlorure de magnésium', f: 'MgCl₂', atomes: [['Mg', 1], ['Cl', 2]], cat: { s: 'Mg²⁺', q: 2, nu: 1, nom: 'ion magnésium' }, an: { s: 'Cl⁻', q: 1, nu: 2, nom: 'ion chlorure' } },
  { id: 'alcl3', nom: 'chlorure d’aluminium', f: 'AlCl₃', atomes: [['Al', 1], ['Cl', 3]], cat: { s: 'Al³⁺', q: 3, nu: 1, nom: 'ion aluminium' }, an: { s: 'Cl⁻', q: 1, nu: 3, nom: 'ion chlorure' } },
  { id: 'na2so4', nom: 'sulfate de sodium', f: 'Na₂SO₄', atomes: [['Na', 2], ['S', 1], ['O', 4]], cat: { s: 'Na⁺', q: 1, nu: 2, nom: 'ion sodium' }, an: { s: 'SO₄²⁻', q: 2, nu: 1, nom: 'ion sulfate', poly: true } },
  { id: 'cuso4', nom: 'sulfate de cuivre(II)', f: 'CuSO₄', atomes: [['Cu', 1], ['S', 1], ['O', 4]], cat: { s: 'Cu²⁺', q: 2, nu: 1, nom: 'ion cuivre(II)' }, an: { s: 'SO₄²⁻', q: 2, nu: 1, nom: 'ion sulfate', poly: true } },
  { id: 'feno33', nom: 'nitrate de fer(III)', f: 'Fe(NO₃)₃', atomes: [['Fe', 1], ['N', 3], ['O', 9]], cat: { s: 'Fe³⁺', q: 3, nu: 1, nom: 'ion fer(III)' }, an: { s: 'NO₃⁻', q: 1, nu: 3, nom: 'ion nitrate', poly: true } },
];
export const selDe = id => SELS.find(s => s.id === id);

const NB = ' ';
export const coef = nu => (nu === 1 ? '' : `${nu}${NB}`);
// Équation de dissolution (l'eau n'est pas écrite) : « MgCl₂(s) → Mg²⁺(aq) + 2 Cl⁻(aq) »
export const equation = s => `${s.f}(s) → ${coef(s.cat.nu)}${s.cat.s}(aq) + ${coef(s.an.nu)}${s.an.s}(aq)`;
export const masseMolaire = s => Number(s.atomes.reduce((t, [a, n]) => t + n * MM[a], 0).toFixed(1));
// Neutralité du cristal : somme des charges positives = somme des charges négatives (par formule)
export const chargePlus = s => s.cat.nu * s.cat.q;
export const chargeMoins = s => s.an.nu * s.an.q;
export const neutre = s => chargePlus(s) === chargeMoins(s);

// ---------- relations (mol, L, g) ----------
export const quantite = (m, M) => m / M;                       // n = m / M
export const concApportee = (n, V_L) => n / V_L;               // c = n / V (soluté apporté)
export const concIon = (nu, c) => nu * c;                      // [ion] = coefficient × c
export const concCation = (s, c) => concIon(s.cat.nu, c);
export const concAnion = (s, c) => concIon(s.an.nu, c);
export const masseAPeser = (c, V_L, M) => c * V_L * M;

// ---------- tirages des défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const arr3 = x => Number(x.toPrecision(3));
export const CONC_DEFI = [0.050, 0.100, 0.200, 0.250, 0.500];
export const VOL_DEFI = [100, 250, 500];
// Défi 1 : on donne m, M, V ; on demande la concentration effective d'un ion. La masse AFFICHÉE (3 chiffres significatifs) sert au corrigé.
export function tirerDefiIon() {
  const s = tire(SELS), M = masseMolaire(s), V = tire(VOL_DEFI), c = tire(CONC_DEFI), m = arr3(c * V / 1000 * M);
  const ion = tire(['cat', 'an']), nu = s[ion].nu, ionS = s[ion].s;
  return { s, M, V, m, ion, nu, ionS, c: m / M / (V / 1000), vrai: nu * (m / M) / (V / 1000) };
}
// Défi 2 : on veut une concentration effective d'ion donnée ; masse à peser (concentration cible tirée parmi des valeurs rondes de c).
export function tirerDefiMasse() {
  const s = tire(SELS), M = masseMolaire(s), V = tire(VOL_DEFI), c = tire(CONC_DEFI);
  const ion = tire(['cat', 'an']), nu = s[ion].nu, ionS = s[ion].s, cible = nu * c;
  return { s, M, V, ion, nu, ionS, c, cible, vrai: cible / nu * (V / 1000) * M };
}
