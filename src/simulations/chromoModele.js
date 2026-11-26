// Modèle de la simulation 303 « UV-visible : couleur, conjugaison et auxochromes ». Fonctions pures, testées par chromoModele.test.mjs.
// Hypothèses : bandes d'absorption gaussiennes (illustratives) ; valeurs de λmax et ε arrondies, d'ordre de grandeur (littérature, solvant usuel) ;
// couleur = couleur de la lumière transmise par une solution dont l'absorbance au maximum vaut 1 (concentration ajustée), sous lumière blanche D65.
import { LAMBDA } from './couleurDonnees.js';
import { cssObjet } from './couleurModele.js';

export const LAM_MIN = 200, LAM_MAX = 800, VIS_MIN = 380, VIS_MAX = 780;
export const gauss = (x, c, s) => Math.exp(-0.5 * ((x - c) / s) ** 2);
export const largeur = lam => 15 + 0.06 * lam;                       // écart-type de la bande (nm), schématique
// Polyènes linéaires CH2=CH–(CH=CH)n–1…: λmax pour n liaisons C=C conjuguées (valeurs arrondies de la littérature ; n = 11 : β-carotène)
export const ANCRES = [[1, 170], [2, 217], [3, 258], [4, 290], [5, 334], [6, 364], [11, 450]];
export function lamPolyene(n) {
  if (n <= ANCRES[0][0]) return ANCRES[0][1];
  for (let i = 1; i < ANCRES.length; i++) { const [n0, l0] = ANCRES[i - 1], [n1, l1] = ANCRES[i]; if (n <= n1) return l0 + (l1 - l0) * (n - n0) / (n1 - n0); }
  return ANCRES.at(-1)[1];
}
export const epsPolyene = n => 10000 + 12000 * (n - 1);            // L·mol⁻¹·cm⁻¹, ordre de grandeur
export const NOMS_POLYENE = { 1: 'éthène', 2: 'buta-1,3-diène', 3: 'hexa-1,3,5-triène', 4: 'octa-1,3,5,7-tétraène', 5: 'déca-1,3,5,7,9-pentaène', 6: 'dodéca-hexaène', 11: 'β-carotène' };

// Molécules aromatiques et autres (λmax en nm, ε en L·mol⁻¹·cm⁻¹ ; bande principale accessible au spectrophotomètre)
export const MOLS = {
  benzene: { id: 'benzene', nom: 'benzène', lam: 255, eps: 200 },
  phenol: { id: 'phenol', nom: 'phénol', lam: 270, eps: 1500 },
  phenolate: { id: 'phenolate', nom: 'ion phénolate', lam: 287, eps: 2600 },
  aniline: { id: 'aniline', nom: 'aniline', lam: 280, eps: 1500 },
  anilinium: { id: 'anilinium', nom: 'ion anilinium', lam: 254, eps: 160 },
  nitrophenol: { id: 'nitrophenol', nom: '4-nitrophénol', lam: 317, eps: 10000 },
  nitrophenolate: { id: 'nitrophenolate', nom: 'ion 4-nitrophénolate', lam: 400, eps: 18000 },
  transstil: { id: 'transstil', nom: 'trans-stilbène', lam: 295, eps: 28000 },
  cisstil: { id: 'cisstil', nom: 'cis-stilbène', lam: 280, eps: 10500 },
};
// Spectre d'absorption molaire ε(λ) sur [200 ; 800] nm
export const epsLam = (lam, eps, lam0) => eps * gauss(lam, lam0, largeur(lam0));
export const spectreEps = (lam0, eps, pas = 5) => { const r = []; for (let l = LAM_MIN; l <= LAM_MAX; l += pas) r.push([l, epsLam(l, eps, lam0)]); return r; };
// Absorbance sur la grille visible de couleurModele (380 à 780 nm, pas de 10 nm), normalisée à 1 au maximum de la bande
export const absorbanceVisible = lam0 => LAMBDA.map(l => gauss(l, lam0, largeur(lam0)));
export const transmittanceVisible = lam0 => absorbanceVisible(lam0).map(a => 10 ** -a);
export const cssSolution = lam0 => cssObjet(transmittanceVisible(lam0), 'D65');
export const rvbSolution = lam0 => cssSolution(lam0).match(/\d+/g).map(Number);
export const cssLumiere = lam => { const t = LAMBDA.map(l => 10 ** (-3 * gauss(l, lam, 12))); return cssObjet(t, 'D65'); };   // lumière monochromatique absorbée, vue en soustraction (schématique)

// Couleur absorbée et couleur perçue (roue des complémentaires, valeurs usuelles)
export const COMPL = [
  { de: 380, a: 435, abs: 'violet', vue: 'jaune-vert' }, { de: 435, a: 480, abs: 'bleu', vue: 'jaune' },
  { de: 480, a: 490, abs: 'bleu-vert', vue: 'orange' }, { de: 490, a: 500, abs: 'vert-bleu', vue: 'rouge' },
  { de: 500, a: 560, abs: 'vert', vue: 'pourpre' }, { de: 560, a: 580, abs: 'vert-jaune', vue: 'violet' },
  { de: 580, a: 595, abs: 'jaune', vue: 'bleu' }, { de: 595, a: 605, abs: 'orange', vue: 'bleu-vert' },
  { de: 605, a: 780, abs: 'rouge', vue: 'bleu-vert' },
];
export const zone = lam => COMPL.find(z => lam >= z.de && lam < z.a) ?? null;
export const couleurAbsorbee = lam => zone(lam)?.abs ?? 'aucune (hors du visible)';
export const couleurPercue = lam => zone(lam)?.vue ?? 'incolore';
export const estIncolore = lam0 => lam0 + 2.5 * largeur(lam0) < VIS_MIN;       // la bande ne déborde pas sur le visible (queue < 2,5 σ)
export const COULEURS_VUES = ['jaune-vert', 'jaune', 'orange', 'rouge', 'pourpre', 'violet', 'bleu', 'bleu-vert'];

// Absorbance : A = ε·l·c
export const absorbance = (eps, l, c) => eps * l * c;
// Effets sur une bande : déplacement (λ) et intensité (ε)
export const SEUIL_LAM = 8, SEUIL_EPS = 1.25;
export const effetLambda = (l0, l1) => (l1 - l0 > SEUIL_LAM ? 'bathochrome' : l0 - l1 > SEUIL_LAM ? 'hypsochrome' : 'aucun');
export const effetEps = (e0, e1) => (e1 / e0 > SEUIL_EPS ? 'hyperchrome' : e0 / e1 > SEUIL_EPS ? 'hypochrome' : 'aucun');
export const decalageMoyen = (nA, nB) => (lamPolyene(nB) - lamPolyene(nA)) / (nB - nA);

// ---- tirages pour les défis (rnd : fonction aléatoire dans [0 ; 1[) ----
const tire = (rnd, t) => t[Math.floor(rnd() * t.length)];
const LAMS_DEFI = [415, 455, 485, 495, 530, 570, 588, 600, 650];
export const tirageDefiCouleur = rnd => { const lam = tire(rnd, LAMS_DEFI); return { kind: 'couleur', lam, vue: couleurPercue(lam), abs: couleurAbsorbee(lam) }; };
const PAIRES = [['benzene', 'phenol'], ['phenol', 'phenolate'], ['benzene', 'aniline'], ['aniline', 'anilinium'], ['nitrophenol', 'nitrophenolate'], ['transstil', 'cisstil'], ['phenol', 'benzene'], ['phenolate', 'phenol'], ['cisstil', 'transstil'], ['anilinium', 'aniline']];
export function tirageDefiEffet(rnd) {
  const [a, b] = tire(rnd, PAIRES), A = MOLS[a], B = MOLS[b];
  return { kind: 'effet', a: A, b: B, dl: effetLambda(A.lam, B.lam), de: effetEps(A.eps, B.eps) };
}
