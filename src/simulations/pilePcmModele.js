// ====================================================
//  Modèle de la simulation 305 : « Piles : polarité, équation de fonctionnement et quantité d'électricité » (TSTL, PCM, séquence 4).
//  Réutilise pileModele.js (sim 132, TG) sans le modifier : polarité, équation, réactif limitant, charge Q = n(e⁻) F.
//  Programme TSTL : AUCUNE loi de Nernst et aucun potentiel standard : la polarité se lit au voltmètre (signe de la tension) ; la tension mesurée est une donnée.
//  Ajoute : durée de fonctionnement Q = i Δt, piles en série, tirages des défis. Unités : mol, C, A (i donné en mA), durée en s ou en h.
// ====================================================
import { F, METAUX, etat, poles, equation, equationTexte, demiOx, demiRed } from './pileModele.js';
export { F, METAUX, etat, poles, equation, equationTexte, demiOx, demiRed };

// Piles proposées en exploration : [électrode de gauche, électrode de droite] (le pôle + peut être des deux côtés).
export const PILES = [['zn', 'cu'], ['cu', 'zn'], ['zn', 'ag'], ['ag', 'zn'], ['fe', 'cu'], ['cu', 'fe'], ['cu', 'ag'], ['ag', 'cu']];
export const IE_MIN = 5, IE_MAX = 100, IE_PAS = 5;   // intensité débitée (mA)
export const constit = id => ({ id, c: 0.10, V: 100, m: 2.0 });   // demi-pile standard de l'exploration

// Exemple du parcours guidé : pile cuivre / zinc (V sur la lame de cuivre : + 1,10 V), 100 mL à 0,10 mol/L, lame de zinc de 2,0 g, F = 96 500 C/mol.
export const PARCOURS = { g: constit('zn'), d: constit('cu'), nCu: 0.010, nZn: 2.0 / 65.4, ne: 0.020, Q: 1930, i: 20, duree_s: 96500, duree_h: 96500 / 3600 };

export const duree = (Q, imA) => Q / (imA / 1000);     // s
export const qSerie = (Q) => Q;                       // la charge traversant chaque pile est la même : capacité inchangée en série

// État de la pile d'exploration à la fraction f ∈ [0 ; 1] de sa capacité débitée (f = 1 : pile usée).
export function etatExplore(paire, f) {
  const g = constit(paire[0]), d = constit(paire[1]), e0 = etat(g, d, 0), ne = e0.neMax * Math.max(0, Math.min(1, f));
  return { e: etat(g, d, ne), e0, ne, Q: ne * F, Qmax: e0.neMax * F };
}
// Tension lue : borne V sur 'g' ou 'd' ; renvoie un nombre signé (valeur arrondie à 0,01 V, comme un voltmètre).
export const tensionLue = (paire, borneV) => {
  const g = constit(paire[0]), d = constit(paire[1]), e = etat(g, d, 0), idV = borneV === 'g' ? g.id : d.id;
  return Math.round(e.U * 100) / 100 * (idV === e.plus ? 1 : -1);
};

// ---------------- défis ----------------
const tire = t => t[Math.floor(Math.random() * t.length)];
// Défi « polarité » : pile inconnue (gauche, droite), voltmètre branché, valeur signée affichée ; l'élève donne le pôle +, l'anode et le sens des électrons.
export function tirageDefiPolarite() {
  const [gId, dId] = tire(PILES), borneV = tire(['g', 'd']), lu = tensionLue([gId, dId], borneV);
  const e = etat(constit(gId), constit(dId), 0), cote = id => (id === gId ? 'g' : 'd');
  return { gId, dId, borneV, lu, plus: e.plus, moins: e.moins, cotePlus: cote(e.plus), coteMoins: cote(e.moins), ecart: Math.abs(lu) };
}
// Défi « capacité et durée » : constitution initiale arrondie AVANT le calcul ; réactif limitant net (écart d'au moins 30 % entre les deux quantités d'électrons possibles).
export function tirageDefiCapacite() {
  for (;;) {
    const [p, q] = tire(PILES), { plus, moins } = poles(p, q);
    const c = tire([0.050, 0.10, 0.15, 0.20]), V = tire([50, 100, 150, 200]), m = tire([0.20, 0.30, 0.50, 1.0, 2.0, 3.0]), I = tire([20, 50, 100]);
    const C = METAUX[plus], A = METAUX[moins], nIon = c * V / 1000, nMet = m / A.M, neIon = C.z * nIon, neMet = A.z * nMet, ne = Math.min(neIon, neMet);
    if (Math.max(neIon, neMet) / ne < 1.3) continue;
    const Q = ne * F;
    return { plus, moins, c, V, m, I, nIon, nMet, neIon, neMet, ne, Q, dureeH: Q / (I / 1000) / 3600, limitant: neIon <= neMet ? 'ion' : 'metal' };
  }
}
