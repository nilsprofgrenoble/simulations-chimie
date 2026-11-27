// ====================================================
//  Modèle de la simulation 133 : électrolyse et accumulateur (TG spé PC, « Prévoir l'état final d'un système »,
//  partie C « Forcer le sens d'évolution d'un système »).
//  Même cellule que la pile (sim 132) : deux demi-piles métal / ion métallique reliées par un pont salin.
//  On branche entre les lames un générateur de tension réglable U_G (borne + du générateur sur le pôle + de la pile)
//  et une résistance de circuit R. Intensité de départ : I = (U_G − E) / R, arrondie à 0,01 A (lecture de l'ampèremètre),
//  puis supposée constante (le générateur est réajusté).
//    I < 0 : la pile débite dans le générateur (sens spontané, Q_r va vers K) ;
//    I > 0 : le générateur force la transformation inverse (électrolyse, charge d'un accumulateur, Q_r s'éloigne de K).
//  La tension à vide E est calculée par la loi de Nernst (hors programme, jamais affichée comme formule).
//  Unités : concentrations en mol/L, volumes en mL, masses en g, quantités en mol, charge en C, durée en s ou en h.
// ====================================================
import { METAUX, F, potentiel, poles, equation, logK } from './pileModele.js';
export { METAUX, F, poles, equation, equationTexte, demiOx, demiRed, logK, ORDRE, PAIRES } from './pileModele.js';

export const R_CIRCUIT = 5;      // Ω, résistance totale du circuit (fils, ampèremètre, solutions)
export const V_SOL = 100;        // mL, volume de chaque solution
export const M_LAME = 2.0;       // g, masse immergée de chaque lame dans l'exploration
export const UG_LISTE = [0, 0.5, 1.0, 1.5, 2.0];   // V, tensions proposées dans l'exploration (0 V : simple fil, la pile débite dans R)

// Accumulateur : { g: { id, c, m }, d: { id, c, m } } (volumes V_SOL). Renvoie les grandeurs du pôle + et du pôle −.
function decoupe(a) {
  const { plus, moins } = poles(a.g.id, a.d.id), P = plus === a.g.id ? a.g : a.d, Mo = plus === a.g.id ? a.d : a.g;
  return { plus, moins, P, Mo, plusG: plus === a.g.id };
}

// État après le passage de xi mol d'électrons dans le sens SPONTANÉ (xi > 0 : la pile a débité ; xi < 0 : charge forcée).
// xi est borné par l'épuisement d'un réactif dans chaque sens.
export function etat(a, xi = 0) {
  const { plus, moins, P, Mo, plusG } = decoupe(a), A = METAUX[moins], C = METAUX[plus], V = V_SOL / 1000;
  const nIonP0 = P.c * V, nIonM0 = Mo.c * V, nMetP0 = P.m / C.M, nMetM0 = Mo.m / A.M;
  const xiMaxDech = Math.min(A.z * nMetM0, C.z * nIonP0);      // pile : métal du pôle − ou ions du pôle + épuisés
  const xiMaxCharge = Math.min(A.z * nIonM0, C.z * nMetP0);    // charge : ions du pôle − ou métal du pôle + épuisés
  const x = Math.min(Math.max(xi, -xiMaxCharge), xiMaxDech);
  const nIonM = nIonM0 + x / A.z, nMetM = nMetM0 - x / A.z, nIonP = nIonP0 - x / C.z, nMetP = nMetP0 + x / C.z;
  const cM = nIonM / V, cP = nIonP / V;
  const finDech = x >= xiMaxDech * (1 - 1e-12), finCharge = x <= -xiMaxCharge * (1 - 1e-12);
  // tension à vide (V) : nulle si la pile est usée ; concentrations bornées à 10⁻⁹ mol/L pour rester fini
  let E = potentiel(plus, Math.max(cP, 1e-9)) - potentiel(moins, Math.max(cM, 1e-9));
  if (finDech || !(E > 0)) E = 0;
  const { a: ca, c: cc } = equation(moins, plus);
  const logQr = ca * Math.log10(Math.max(cM, 1e-12)) - cc * Math.log10(Math.max(cP, 1e-12));
  return {
    plus, moins, P, Mo, plusG, x, xiMaxDech, xiMaxCharge, finDech, finCharge,
    nIonP0, nIonM0, nMetP0, nMetM0, nIonP, nIonM, nMetP, nMetM, cP, cM,
    mP: nMetP * C.M, mM: nMetM * A.M, E, logQr, logK: logK(moins, plus),
    limitantCharge: A.z * nIonM0 <= C.z * nMetP0 ? 'ion' : 'metal', limitantDech: A.z * nMetM0 <= C.z * nIonP0 ? 'metal' : 'ion',
  };
}

// Intensité de départ (A), signée : > 0 si le générateur force, < 0 si la pile débite. Arrondie à 0,01 A.
export function intensite(a, UG) {
  const E = etat(a, 0).E;
  const I = Math.round((UG - E) / R_CIRCUIT * 100) / 100;
  return Object.is(I, -0) ? 0 : I;
}
export const sensDe = I => (I > 0 ? 'force' : I < 0 ? 'spontane' : 'aucun');

// Fonctionnement pendant tH heures avec l'intensité de départ (constante).
export function fonctionner(a, UG, tH) {
  const I = intensite(a, UG), xi = -I * tH * 3600 / F;
  const e = etat(a, xi), Qpasse = Math.abs(e.x) * F;
  return { ...e, I, UG, sens: sensDe(I), tH, Q: Qpasse, ne: Math.abs(e.x),
    arret: (I > 0 && e.finCharge) || (I < 0 && e.finDech) };
}
// Durée (h) au bout de laquelle un réactif est épuisé dans le sens du courant (Infinity si I = 0).
export function dureeMax(a, UG) {
  const I = intensite(a, UG), e = etat(a, 0);
  if (I === 0) return Infinity;
  return (I > 0 ? e.xiMaxCharge : e.xiMaxDech) * F / Math.abs(I) / 3600;
}

// ---------------- relations du programme (Q = I × Δt ; n(e⁻) = Q / F ; n(métal) = n(e⁻) / z) ----------------
export const charge = (I, dt) => I * dt;                        // C (I en A, dt en s)
export const nMetal = (Q, z) => Q / (z * F);                     // mol
export const dureePour = (Q, I) => Q / I;                        // s

// ---------------- parcours guidé : pile zinc-cuivre de la sim 132, déjà utilisée (elle a débité 965 C) ----------------
// Départ : [Zn²⁺] = 0,15 mol/L, [Cu²⁺] = 0,05 mol/L ; lames : zinc 1,7 g, cuivre 2,3 g (valeurs arrondies données à l'élève).
export const ACCU_GUIDE = { g: { id: 'zn', c: 0.15, m: 1.7 }, d: { id: 'cu', c: 0.05, m: 2.3 } };

// ---------------- défis ----------------
const tire = t => t[Math.floor(Math.random() * t.length)];
const arr = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
const PAIRES_DEFI = [['zn', 'cu'], ['fe', 'cu'], ['zn', 'fe'], ['cu', 'ag'], ['zn', 'ag'], ['fe', 'ag']];

// Défi 1 : la tension du générateur décide du sens. Tension à vide lue (2 décimales) ; U_G écartée d'au moins 0,25 V de E.
export function tirageDefiSens() {
  const [p, q] = tire(PAIRES_DEFI), gauche = Math.random() < 0.5 ? p : q, droite = gauche === p ? q : p;
  const a = { g: { id: gauche, c: 0.10, m: 2.0 }, d: { id: droite, c: 0.10, m: 2.0 } };
  const e = etat(a, 0), E = arr(e.E, 2);
  const choix = [0.5, 1.0, 1.5, 2.0, 2.5].filter(u => Math.abs(u - E) >= 0.25);
  const UG = tire(choix), sens = UG > E ? 'force' : 'spontane';
  return { a, E, UG, sens, plus: e.plus, moins: e.moins };
}
// Défi 2 : électrolyse forcée pendant Δt à I constante ; quantité de métal déposé au pôle −, masse de métal dissous au pôle +.
// Données exactes (I, Δt) ; F et M arrondis comme affichés.
export function tirageDefiQuantite() {
  const [p, q] = tire(PAIRES_DEFI), { plus, moins } = poles(p, q);
  const I = tire([0.10, 0.20, 0.25, 0.50]), dtMin = tire([10, 15, 20, 30, 45]);
  const A = METAUX[moins], C = METAUX[plus], Q = I * dtMin * 60;
  const nDep = Q / (A.z * F), mDiss = Q / (C.z * F) * C.M;
  return { plus, moins, I, dtMin, Q, nDep, mDiss };
}

// Écriture « m × 10ⁿ » (1 chiffre après la virgule) d'une puissance de 10 donnée par son logarithme décimal (ex. K ≈ 1,9 × 10³⁷).
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const nbv = (v, d) => Number(v).toFixed(d).replace('.', ',');
export const puiss10 = lg => { const e = Math.floor(lg), mm = Math.round(10 ** (lg - e) * 10) / 10;
  return mm >= 10 ? `1,0 × 10${[...String(e + 1)].map(c => SUP[c]).join('')}` : `${nbv(mm, 1)} × 10${[...String(e)].map(c => SUP[c]).join('')}`; };
