// ====================================================
//  Modèle de la simulation 211 « Intensité sonore, niveau d'intensité et atténuation » (TG spé PC, « Ondes et signaux »).
//  Modèle pur (sans React), testé par isnModele.test.mjs.
//  Hypothèses : champ libre (pas de sol ni de mur qui réfléchit), source ponctuelle isotrope, milieu homogène sans absorption par l'air,
//  pas de réverbération, de réflexion ni de diffraction. Niveau d'intensité sonore non pondéré (pas de dB(A)). Logarithme décimal uniquement.
//  Une paroi retire A dB (donnée du matériau, FICTIVE : ordre de grandeur plausible), A = L_entrée − L_sortie, indépendante du niveau et de la fréquence.
//  Unités : I en W·m⁻², P en W, d en m, L et A en dB.
// ====================================================
export const I0 = 1.0e-12;                                   // intensité sonore de référence (seuil d'audibilité), W·m⁻²

/** Intensité sonore I = P / S pour une puissance P traversant une surface S perpendiculaire à la propagation (W·m⁻²). */
export const intensiteSurface = (P, S) => P / S;
/** Intensité à la distance d d'une source ponctuelle isotrope de puissance P : I = P / (4π d²). */
export const intensiteSphere = (P, d) => P / (4 * Math.PI * d * d);
/** Niveau d'intensité sonore L = 10 log (I / I0), en dB. */
export const niveau = I => 10 * Math.log10(I / I0);
/** Fonction réciproque : I = I0 × 10^(L / 10). */
export const intensiteDepuisNiveau = L => I0 * Math.pow(10, L / 10);
/** Niveau à la distance d d'une source de puissance P, après une paroi d'atténuation A (dB) si d dépasse la position de la paroi. */
export const niveauSource = (P, d, A = 0) => niveau(intensiteSphere(P, d)) - A;
/** Atténuation géométrique entre d1 et d2 (dB) : 20 log (d2 / d1). */
export const attenuationGeometrique = (d1, d2) => 20 * Math.log10(d2 / d1);
/** Niveau au point d, avec une paroi placée en dp (dp < d) : atténuation géométrique + absorption. */
export const niveauAvecParoi = (P, d, dp, A) => niveauSource(P, d, d > dp ? A : 0);
/** Distance où le niveau (avec A dB retirés par la paroi) vaut Ls : d = √(P / (4π I)) avec I = I0 × 10^((Ls + A) / 10). */
export const distanceSeuil = (P, Ls, A = 0) => Math.sqrt(P / (4 * Math.PI * intensiteDepuisNiveau(Ls + A)));
/** Niveau total de n sources identiques qui valent chacune L : L + 10 log n. */
export const niveauNSources = (L, n) => L + 10 * Math.log10(n);
/** Variation de niveau quand l'intensité est multipliée par k : 10 log k. */
export const variationNiveau = k => 10 * Math.log10(k);

// ---------- sources (ordres de grandeur de PUISSANCE ACOUSTIQUE, pas de puissance électrique) ----------
export const SOURCES = [
  { id: 'chuchote', nom: 'Chuchotement', P: 1e-8 },
  { id: 'conv', nom: 'Conversation', P: 1e-5 },
  { id: 'cri', nom: 'Cri', P: 1e-3 },
  { id: 'trompette', nom: 'Trompette (fort)', P: 1e-1 },
  { id: 'enceinte', nom: 'Enceinte de concert', P: 1 },
];
// ---------- matériaux : atténuation par absorption en dB (valeurs FICTIVES, ordres de grandeur plausibles, annoncées comme telles) ----------
export const MATERIAUX = [
  { id: 'aucun', nom: 'Aucune paroi', A: 0 },
  { id: 'rideau', nom: 'Rideau épais', A: 5 },
  { id: 'vitre', nom: 'Vitre simple', A: 25 },
  { id: 'cloison', nom: 'Cloison en plâtre', A: 35 },
  { id: 'beton', nom: 'Mur de béton', A: 50 },
];
export const materiau = id => MATERIAUX.find(m => m.id === id);
export const source = id => SOURCES.find(s => s.id === id);

// ---------- repères de niveau (ordres de grandeur, à ± 10 dB) ----------
export const SEUIL_EXPO = 85;       // dB : au-delà, la durée d'exposition doit être limitée
export const SEUIL_DOULEUR = 120;   // dB : seuil de douleur (ordre de grandeur)

// ---------- affichage ----------
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const supStr = n => String(n).split('').map(c => SUP[c]).join('');
/** Notation à la française : virgule décimale, signe moins typographique. */
export const nbf = (v, d = 1) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
/** Mantisse et exposant d'une valeur positive : 1,989e-6 → { m: 1.989, e: -6 }. */
export function mantExp(x) {
  let e = Math.floor(Math.log10(x) + 1e-12), m = x / Math.pow(10, e);
  if (m >= 10 - 1e-9) { m /= 10; e += 1; }
  return { m, e };
}
/** Écriture scientifique « 2,0×10⁻⁶ » avec `chiffres` décimales sur la mantisse (jamais de « ^ »). */
export function sci(x, chiffres = 1) {
  const { m, e } = mantExp(x);
  let mm = Number(m.toFixed(chiffres)), ee = e;
  if (mm >= 10) { mm /= 10; ee += 1; }
  if (ee === 0) return nbf(mm, chiffres);
  return `${nbf(mm, chiffres)}×10${supStr(ee)}`;
}
/** Valeur arrondie à n chiffres significatifs, en nombre. */
export const arrondiCS = (x, n = 2) => Number(Number(x).toPrecision(n));

// ---------- distances proposées par les contrôles (m) ----------
export const D_LISTE = [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];
export const D_GUIDE = [1, 2, 4];

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
/** Puissance de la forme m × 10ⁿ (m = 1, 2 ou 5). */
export const puissanceTiree = (ns = [-5, -4, -3, -2, -1, 0]) => tire([1, 2, 5]) * Math.pow(10, tire(ns));

/** Défi 1 : niveau à d sans paroi, puis derrière une paroi de matériau donné (A fourni) ; niveau final entre 10 et 70 dB, pièges hors tolérance. */
export function tirageNiveau() {
  for (;;) {
    const P = puissanceTiree(), d = tire([5, 6, 8, 10, 12, 15, 20]), mat = tire(MATERIAUX.filter(m => m.A >= 25));
    const L1 = niveauSource(P, d), L2 = L1 - mat.A;
    if (L1 < 45 || L1 > 75 || L2 < 10 || L2 > 70) continue;
    const dp = tire([2, 3].filter(x => x < d));
    return { P, d, dp, mat, A: mat.A, L1, L2 };
}}
/** Pièges de la question 1 (niveau sans paroi) et de la question 2 (avec paroi) : erreurs classiques, toutes hors tolérance (vérifié par le test). */
export const piegesNiveau = t => ({
  q1: [niveau(t.P / (4 * Math.PI * t.d)), niveauSource(t.P, 1) - 10 * Math.log10(t.d), niveau(t.P / (t.d * t.d))],
  q2: [t.L1, t.L1 + t.A, t.L1 - t.A / 2],
});
/** Défi 2 : distance où le niveau vaut Ls pour une source de puissance P, puis intensité à cette distance. */
export function tirageDistance() {
  for (;;) {
    const P = puissanceTiree([-4, -3, -2, -1, 0]), Ls = tire([60, 65, 70, 75, 80, 85]);
    const L1 = niveauSource(P, 1), d = distanceSeuil(P, Ls);
    if (L1 < Ls + 10 || d > 150) continue;
    return { P, Ls, L1, d, I: intensiteDepuisNiveau(Ls) };
  }
}
