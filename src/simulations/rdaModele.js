// ====================================================
//  Modèle de la simulation 184 « Radioactivité : diagramme (N, Z) et équations de désintégration » (TG spé PC).
//  Données : liste CURATÉE de noyaux réels, avec leur mode de désintégration PRINCIPAL (vérifié dans la table des états fondamentaux de l'AIEA,
//  nds.iaea.org/relnsd, et recoupé avec les données de décroissance usuelles). Ce n'est pas la table complète des noyaux.
//  Modes : 's' stable ; 'b-' radioactivité β⁻ ; 'b+' radioactivité β⁺ ; 'a' radioactivité α.
//  Conventions (écrites aussi dans le panneau d'hypothèses) : particule α = ⁴₂He ; β⁻ = électron ⁰₋₁e ; β⁺ = positon ⁰₊₁e ;
//  (anti)neutrino ⁰₀ν : écrit dans les corrigés, jamais exigé dans les réponses (A = 0 et Z = 0 : il ne change aucun calcul).
//  Test : rdaModele.test.mjs.
// ====================================================

// Z → [symbole, nom] (seulement les éléments utilisés par la simulation)
export const ELEMENTS = {
  1: ['H', 'hydrogène'], 2: ['He', 'hélium'], 3: ['Li', 'lithium'], 4: ['Be', 'béryllium'], 5: ['B', 'bore'], 6: ['C', 'carbone'], 7: ['N', 'azote'], 8: ['O', 'oxygène'],
  9: ['F', 'fluor'], 10: ['Ne', 'néon'], 11: ['Na', 'sodium'], 12: ['Mg', 'magnésium'], 13: ['Al', 'aluminium'], 14: ['Si', 'silicium'], 15: ['P', 'phosphore'],
  16: ['S', 'soufre'], 17: ['Cl', 'chlore'], 18: ['Ar', 'argon'], 27: ['Co', 'cobalt'], 28: ['Ni', 'nickel'], 30: ['Zn', 'zinc'], 31: ['Ga', 'gallium'],
  38: ['Sr', 'strontium'], 39: ['Y', 'yttrium'], 40: ['Zr', 'zirconium'], 53: ['I', 'iode'], 54: ['Xe', 'xénon'], 55: ['Cs', 'césium'], 56: ['Ba', 'baryum'],
  82: ['Pb', 'plomb'], 83: ['Bi', 'bismuth'], 84: ['Po', 'polonium'], 86: ['Rn', 'radon'], 88: ['Ra', 'radium'], 89: ['Ac', 'actinium'], 90: ['Th', 'thorium'],
  91: ['Pa', 'protactinium'], 92: ['U', 'uranium'], 93: ['Np', 'neptunium'], 94: ['Pu', 'plutonium'], 95: ['Am', 'américium'],
};
export const sym = Z => ELEMENTS[Z][0];
export const nomEl = Z => ELEMENTS[Z][1];

// Particules émises (A, Z, symbole)
export const PARTICULES = {
  a: { A: 4, Z: 2, s: 'He', nom: 'particule α', court: 'α' },
  'b-': { A: 0, Z: -1, s: 'e', nom: 'électron', court: 'β⁻' },
  'b+': { A: 0, Z: 1, s: 'e', nom: 'positon', court: 'β⁺' },
};
export const NU = { 'b-': { anti: true, nom: 'antineutrino électronique' }, 'b+': { anti: false, nom: 'neutrino électronique' } };
export const NOM_TYPE = { a: 'radioactivité α', 'b-': 'radioactivité β⁻', 'b+': 'radioactivité β⁺', s: 'stable' };
export const TYPES = ['a', 'b-', 'b+'];
// déplacement dans le diagramme (N en abscisse, Z en ordonnée)
export const DEPLACEMENT = { a: { dN: -2, dZ: -2 }, 'b-': { dN: -1, dZ: 1 }, 'b+': { dN: 1, dZ: -1 } };

// ---------- noyaux du diagramme « légers » : Z de 1 à 18 ----------
// Stables : liste complète (AIEA) pour Z ≤ 18. Radioactifs : sélection de noyaux réels dont le noyau fils figure aussi dans la liste.
const STABLES_LEGERS = [[1, 0], [1, 1], [2, 1], [2, 2], [3, 3], [3, 4], [4, 5], [5, 5], [5, 6], [6, 6], [6, 7], [7, 7], [7, 8], [8, 8], [8, 9], [8, 10], [9, 10],
  [10, 10], [10, 11], [10, 12], [11, 12], [12, 12], [12, 13], [12, 14], [13, 14], [14, 14], [14, 15], [14, 16], [15, 16], [16, 16], [16, 17], [16, 18], [16, 20],
  [17, 18], [17, 20], [18, 18], [18, 20], [18, 22]];
const RADIO_LEGERS = [
  [1, 2, 'b-'], [2, 4, 'b-'], [4, 6, 'b-'],
  [6, 4, 'b+'], [6, 5, 'b+'], [6, 8, 'b-'], [6, 9, 'b-'],
  [7, 6, 'b+'], [7, 9, 'b-'],
  [8, 6, 'b+'], [8, 7, 'b+'], [8, 11, 'b-'],
  [9, 8, 'b+'], [9, 9, 'b+'], [9, 11, 'b-'],
  [10, 8, 'b+'], [10, 9, 'b+'], [10, 13, 'b-'],
  [11, 10, 'b+'], [11, 11, 'b+'], [11, 13, 'b-'],
  [12, 11, 'b+'], [12, 15, 'b-'],
  [13, 12, 'b+'], [13, 13, 'b+'], [13, 15, 'b-'],
  [14, 13, 'b+'], [14, 17, 'b-'], [14, 18, 'b-'],
  [15, 15, 'b+'], [15, 17, 'b-'], [15, 18, 'b-'],
  [16, 15, 'b+'], [16, 19, 'b-'], [16, 21, 'b-'],
  [17, 17, 'b+'], [17, 19, 'b-'], [17, 21, 'b-'],
  [18, 17, 'b+'],
];
export const LEGERS = [...STABLES_LEGERS.map(([Z, N]) => [Z, N, 's']), ...RADIO_LEGERS];

// ---------- noyaux du diagramme « lourds » : chaîne de désintégration de l'uranium 238 (Z de 82 à 92) ----------
export const CHAINE_U238 = [[92, 146, 'a'], [90, 144, 'b-'], [91, 143, 'b-'], [92, 142, 'a'], [90, 140, 'a'], [88, 138, 'a'], [86, 136, 'a'], [84, 134, 'a'],
  [82, 132, 'b-'], [83, 131, 'b-'], [84, 130, 'a'], [82, 128, 'b-'], [83, 127, 'b-'], [84, 126, 'a'], [82, 124, 's']];
export const LOURDS = [...CHAINE_U238, [82, 125, 's'], [82, 126, 's']];

// ---------- régions (cadre du diagramme) ----------
export const REGIONS = {
  legers: { id: 'legers', nom: 'noyaux légers (Z de 1 à 18)', Zmin: 1, Zmax: 18, Nmin: 0, Nmax: 23, noyaux: LEGERS, pasN: 4, pasZ: 2 },
  lourds: { id: 'lourds', nom: 'noyaux lourds (chaîne de l’uranium 238)', Zmin: 82, Zmax: 92, Nmin: 124, Nmax: 146, noyaux: LOURDS, pasN: 4, pasZ: 2 },
};

// ---------- noyaux supplémentaires, pour les exercices seulement (hors diagramme) : mode principal vérifié (AIEA) ----------
export const EXTRA = [[27, 33, 'b-'], [38, 52, 'b-'], [39, 51, 'b-'], [53, 78, 'b-'], [55, 82, 'b-'], [31, 37, 'b+'], [95, 146, 'a'], [94, 145, 'a'], [92, 143, 'a'], [90, 142, 'a'], [88, 140, 'b-']];

export const TOUS = [...LEGERS, ...LOURDS.filter(n => !LEGERS.some(m => m[0] === n[0] && m[1] === n[1])), ...EXTRA];
const cle = (Z, N) => `${Z},${N}`;
const INDEX = new Map(TOUS.map(n => [cle(n[0], n[1]), n]));
export const trouve = (Z, N) => INDEX.get(cle(Z, N)) || null;
export const trouveFils = trouve;
export const A = n => n[0] + n[1];
export const estRadio = n => n[2] !== 's';
export const radioactifs = (liste = TOUS) => liste.filter(estRadio);

// noyau fils (couple [Z, N]) d'un noyau radioactif
export function filsDe(n) {
  const d = DEPLACEMENT[n[2]]; if (!d) return null;
  return [n[0] + d.dZ, n[1] + d.dN];
}
// type déduit du couple (père, fils) d'après A et Z (null si incompatible avec α, β⁻, β⁺)
export function typeDe(pereAZ, filsAZ) {
  const dA = filsAZ.A - pereAZ.A, dZ = filsAZ.Z - pereAZ.Z;
  if (dA === -4 && dZ === -2) return 'a';
  if (dA === 0 && dZ === 1) return 'b-';
  if (dA === 0 && dZ === -1) return 'b+';
  return null;
}
// conservation : sommes de A et de Z à gauche et à droite
export function bilan(pere, fils, mode) {
  const p = PARTICULES[mode];
  return { A: { gauche: pere.A, droite: fils.A + p.A }, Z: { gauche: pere.Z, droite: fils.Z + p.Z } };
}
export const conserve = b => b.A.gauche === b.A.droite && b.Z.gauche === b.Z.droite;
export const AZ = n => ({ A: n[0] + n[1], Z: n[0] });
// noyaux d'une région pour un élément donné, triés par N
export const isotopesDe = (liste, Z) => liste.filter(n => n[0] === Z).sort((a, b) => a[1] - b[1]);

// chaîne de désintégration : suite de noyaux jusqu'au noyau stable (ou au bout des données)
export function chaine(depart) {
  const out = [depart]; let n = depart;
  while (estRadio(n)) { const f = filsDe(n), s = trouveFils(f[0], f[1]); if (!s) break; out.push(s); n = s; }
  return out;
}
export const compte = (ch, mode) => ch.filter(n => n[2] === mode).length;

// ---------- chaînes d'exercice : A et Z d'arrivée connus, nombre de α et de β⁻ ----------
// n α et m β⁻ : A' = A − 4n ; Z' = Z − 2n + m
export const apresChaine = (A0, Z0, nA, nB) => ({ A: A0 - 4 * nA, Z: Z0 - 2 * nA + nB });
export const comptesChaine = (dep, arr) => {
  const nA = (dep.A - arr.A) / 4, nB = arr.Z - dep.Z + 2 * nA;
  return Number.isInteger(nA) && nA >= 0 && nB >= 0 ? { nA, nB } : null;
};

// ---------- écriture en texte (étiquettes accessibles, tests) ----------
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', SUB = '₀₁₂₃₄₅₆₇₈₉';
const enSup = x => String(x).replace(/[0-9]/g, c => SUP[c]).replace('-', '⁻').replace('+', '⁺');
const enSub = x => String(x).replace(/[0-9]/g, c => SUB[c]).replace('-', '₋').replace('+', '₊');
export const noyauTexte = (A, Z, s) => `${enSup(A)}${enSub(Z)}${s}`;
export function equationTexte(pere, fils, mode) {
  const p = PARTICULES[mode], nu = NU[mode];
  return `${noyauTexte(pere.A, pere.Z, pere.s)} → ${noyauTexte(fils.A, fils.Z, fils.s)} + ${noyauTexte(p.A, p.Z > 0 && p.s === 'e' ? '+' + p.Z : p.Z, p.s)}${nu ? ` + ${noyauTexte(0, 0, nu.anti ? 'ν̄' : 'ν')}` : ''}`;
}
// père/fils sous forme {A, Z, s}
export const noyauAZ = n => ({ A: n[0] + n[1], Z: n[0], s: sym(n[0]) });

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
// réserve de désintégrations possibles : tout noyau radioactif de la liste (le noyau fils d'une désintégration réelle est un noyau réel ;
// il suffit que son élément figure dans le tableau des symboles)
export const RESERVE = radioactifs().map(n => { const f = filsDe(n); return ELEMENTS[f[0]] ? { pere: n, fils: f, mode: n[2] } : null; }).filter(Boolean);
export function tirageDefi(types = TYPES) {
  const d = tire(RESERVE.filter(r => types.includes(r.mode)));
  return { pere: noyauAZ(d.pere), fils: { A: d.fils[0] + d.fils[1], Z: d.fils[0], s: sym(d.fils[0]) }, mode: d.mode };
}
// équation à compléter : on masque le père ou le fils (A et Z demandés)
export function tirageTrou() {
  const d = tirageDefi(), cache = tire(['pere', 'fils']);
  return { ...d, cache };
}
