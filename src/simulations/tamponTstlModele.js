// ====================================================
//  MODÈLE « SOLUTION TAMPON : CHOISIR UN COUPLE ET LE PRÉPARER » (sim 140, TSTL, enseignement PCM, partie « Réactions acido-basiques »).
//  Un tampon est un mélange d'un acide faible AH et de sa base conjuguée A⁻, préparé avec deux solutions mères de même concentration (0,10 mol/L)
//  dont les volumes (vA pour la base, V0 − vA pour l'acide) fixent le rapport nA/nAH.
//  Hypothèses de travail (rappelées dans un panneau de la simulation) :
//   - 25 °C ; activités ≈ concentrations / c° (c° = 1 mol/L) ; volumes additifs ;
//   - l'acide fort (ions H₃O⁺) et la base forte (ions HO⁻) ajoutés sont totalement dissociés ; chaque « ajout » apporte 1,0 mmol dans 1,0 mL ;
//   - la réaction de H₃O⁺ sur A⁻ (ou de HO⁻ sur AH) est quasi totale : le bilan de matière donne les quantités nA et nAH après ajout ;
//   - formule du cours : pH = pKa + log(nA/nAH) (le volume se simplifie, donc la dilution ne change pas le pH) ;
//   - le pH affiché est calculé exactement (conservation de la charge, autoprotolyse comprise) : la formule du cours en est une très bonne approximation
//     tant que 0,1 ≤ nA/nAH ≤ 10 et que le tampon n'est pas trop dilué ; hors de ce domaine, ou si l'ajout dépasse la quantité du réactif, elle ne s'applique plus ;
//   - pKa : valeurs usuelles à 25 °C arrondies au dixième ; un seul couple acide/base par tampon.
//  Unités : volumes en mL, quantités de matière en mmol (mmol / mL = mol/L).
// ====================================================
import { pH as pHExact } from './acidesBasesModele.js';

export const COUPLES = {
  benz:  { id: 'benz',  nom: 'acide benzoïque',        AH: 'C₆H₅COOH',  A: 'C₆H₅COO⁻',  pKa: 4.2 },
  prop:  { id: 'prop',  nom: 'acide propanoïque',      AH: 'C₂H₅COOH',  A: 'C₂H₅COO⁻',  pKa: 4.9 },
  hclo:  { id: 'hclo',  nom: 'acide hypochloreux',     AH: 'HClO',      A: 'ClO⁻',      pKa: 7.5 },
  phen:  { id: 'phen',  nom: 'phénol',                 AH: 'C₆H₅OH',    A: 'C₆H₅O⁻',    pKa: 10.0 },
};
export const ORDRE = ['benz', 'prop', 'hclo', 'phen'];
export const V0 = 100;          // volume du tampon préparé (mL)
export const C_MERE = 0.10;     // concentration des solutions mères d'acide et de base conjuguée (mol/L)
export const PAS = 1.0;         // un ajout = 1,0 mmol d'acide fort ou de base forte, dans 1,0 mL

export const arrondiCS = (x, cs = 2) => Number(Number(x).toPrecision(cs));
export const arrondiPH = pH => Math.round(pH * 100) / 100;

// ---------- formules du cours ----------
export const pHFormule = (pKa, nA, nAH) => pKa + Math.log10(nA / nAH);
export const rapportDepuisPH = (pH, pKa) => 10 ** (pH - pKa);
// volume de solution de base conjuguée (mL) à mélanger à V0 − vA de solution d'acide, pour un rapport r = nA/nAH (solutions mères de même concentration)
export const volumeBase = (r, V = V0) => V * r / (1 + r);
export const volumeAcide = (r, V = V0) => V / (1 + r);
export const dansDomaine = r => r >= 0.1 - 1e-9 && r <= 10 + 1e-9;
export const pHAcideFort = (n, V) => -Math.log10(n / V);

// ---------- préparation et bilan de matière ----------
// Quantités initiales (mmol) pour vA mL de solution de base conjuguée et V0 − vA mL de solution d'acide
export const quantites = (vA, C = C_MERE, V = V0) => ({ nA: C * vA, nAH: C * (V - vA) });
// Après ajout de nAcide mmol d'acide fort et nBase mmol de base forte : quantités restantes et excès éventuel de H₃O⁺ ou de HO⁻ (mmol)
export function bilan({ nA, nAH, nAcide = 0, nBase = 0 }) {
  const net = nAcide - nBase;
  if (net >= 0) {
    if (net <= nA) return { nA: nA - net, nAH: nAH + net, excesH: 0, excesOH: 0 };
    return { nA: 0, nAH: nAH + nA, excesH: net - nA, excesOH: 0 };
  }
  const m = -net;
  if (m <= nAH) return { nA: nA + m, nAH: nAH - m, excesH: 0, excesOH: 0 };
  return { nA: nA + nAH, nAH: 0, excesH: 0, excesOH: m - nAH };
}
export const volumeTotal = ({ nAcide = 0, nBase = 0, ve = 0 }, V = V0) => V + PAS * nAcide + PAS * nBase + ve;

// pH exact du tampon (couple, vA) après les ajouts. La base conjuguée est introduite sous forme de sel de sodium : nA mmol de Na⁺ dans le bilan de charge.
export function pHTampon({ coupleId, vA, nAcide = 0, nBase = 0, ve = 0 }) {
  const { pKa } = COUPLES[coupleId], q = quantites(vA), Vt = volumeTotal({ nAcide, nBase, ve });
  return pHExact({ C: (q.nA + q.nAH) / Vt, pKas: [pKa], cb: (q.nA + nBase) / Vt, ca: nAcide / Vt });
}
// pH de l'eau pure ayant reçu les mêmes ajouts (V0 mL d'eau au départ)
export function pHEau({ nAcide = 0, nBase = 0, ve = 0 }) {
  const Vt = volumeTotal({ nAcide, nBase, ve });
  return pHExact({ C: 0, pKas: [], cb: nBase / Vt, ca: nAcide / Vt });
}
// État complet d'un tampon
export function etat({ coupleId, vA, nAcide = 0, nBase = 0, ve = 0 }) {
  const c = COUPLES[coupleId], q = quantites(vA), b = bilan({ ...q, nAcide, nBase });
  const r = b.nAH > 0 ? b.nA / b.nAH : Infinity;
  const formuleOk = b.nA > 0 && b.nAH > 0 && b.excesH === 0 && b.excesOH === 0;
  return { ...b, q, r, pKa: c.pKa, Vt: volumeTotal({ nAcide, nBase, ve }), pH: pHTampon({ coupleId, vA, nAcide, nBase, ve }), pHEau: pHEau({ nAcide, nBase, ve }),
    pHFormule: formuleOk ? pHFormule(c.pKa, b.nA, b.nAH) : null, formuleOk, tampon: formuleOk && dansDomaine(r) };
}

// Courbe pH en fonction de la quantité nette ajoutée (mmol, < 0 : acide fort ; > 0 : base forte) pour le tampon et pour l'eau pure
export function courbeAjout({ coupleId, vA, ve = 0 }, nMin = -8, nMax = 8, pas = 0.25) {
  const pts = [];
  for (let n = nMin; n <= nMax + 1e-9; n += pas) {
    const a = n < 0 ? -n : 0, b = n > 0 ? n : 0;
    pts.push({ n, tampon: pHTampon({ coupleId, vA, nAcide: a, nBase: b, ve }), eau: pHEau({ nAcide: a, nBase: b, ve }) });
  }
  return pts;
}

// Variation de pH du tampon (valeur absolue) quand on ajoute 1,0 mmol d'acide fort : plus elle est petite, plus le tampon résiste
export const variationPH = (coupleId, vA, nAcide = PAS) => Math.abs(pHTampon({ coupleId, vA, nAcide }) - pHTampon({ coupleId, vA }));

// ---------- situations du parcours guidé (toutes calculées par le modèle) ----------
export const PARCOURS = {
  couple: 'prop', vA: 50,                 // tampon équimolaire : 5,0 mmol de chaque forme
  nAjout: 1.0,                            // 1,0 mmol d'acide fort (puis de base forte)
  veDilution: 900,                        // dilution par 10
  nLimite: 6.0,                           // plus que les 5,0 mmol de A⁻ : le tampon est épuisé
  cible: 7.8, coupleCible: 'hclo',        // préparation d'un tampon de pH 7,8
};

// ---------- défis à valeurs aléatoires ----------
const tire = (t, alea) => t[Math.floor(alea() * t.length)];
// Défi 1 : préparer V mL de tampon de pH donné avec deux solutions mères de même concentration → volumes de base conjuguée et d'acide
const ECARTS_PREP = [-0.9, -0.7, -0.5, -0.3, 0.3, 0.5, 0.7, 0.9];
export const CANDIDATS_PREP = [];
for (const id of ORDRE) for (const e of ECARTS_PREP) for (const V of [50, 100, 200]) for (const C of [0.10, 0.20]) CANDIDATS_PREP.push({ id, pH: arrondiPH(COUPLES[id].pKa + e), V, C });
export function tiragePrep(alea = Math.random) {
  const { id, pH, V, C } = tire(CANDIDATS_PREP, alea), c = COUPLES[id], r = rapportDepuisPH(pH, c.pKa);
  return { type: 'prep', coupleId: id, pH, V, C, r, vBase: volumeBase(r, V), vAcide: volumeAcide(r, V) };
}
// Défi 2 : tampon de composition connue (nA, nAH en mmol) ; on ajoute x mmol d'acide fort ou de base forte → rapport final et pH
const NA_AJOUT = [[2.0, 8.0], [3.0, 7.0], [4.0, 6.0], [5.0, 5.0], [6.0, 4.0], [7.0, 3.0], [8.0, 2.0]];
export const CANDIDATS_AJOUT = [];
for (const id of ORDRE) for (const [nA, nAH] of NA_AJOUT) for (const x of [1.0, 1.5, 2.0, 2.5, 3.0]) for (const sens of ['acide', 'base']) {
  const nAc = sens === 'acide' ? x : 0, nB = sens === 'base' ? x : 0, b = bilan({ nA, nAH, nAcide: nAc, nBase: nB });
  if (b.nA <= 0.5 || b.nAH <= 0.5) continue;
  const r2 = b.nA / b.nAH, k = COUPLES[id].pKa;
  if (!dansDomaine(r2) || Math.abs(Math.log10(r2) - Math.log10(nA / nAH)) < 0.15) continue;     // le changement de pH doit être bien visible
  CANDIDATS_AJOUT.push({ id, nA, nAH, x, sens, k });
}
export function tirageAjout(alea = Math.random) {
  const { id, nA, nAH, x, sens } = tire(CANDIDATS_AJOUT, alea), c = COUPLES[id];
  const b = bilan({ nA, nAH, nAcide: sens === 'acide' ? x : 0, nBase: sens === 'base' ? x : 0 }), r = b.nA / b.nAH;
  return { type: 'ajout', coupleId: id, nA, nAH, x, sens, nA2: b.nA, nAH2: b.nAH, r, pH: pHFormule(c.pKa, b.nA, b.nAH), pH0: pHFormule(c.pKa, nA, nAH) };
}
