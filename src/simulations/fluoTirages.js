// Tirages de la simulation 301 : chaque photon est un événement au hasard (absorption, relaxation, émission) qui ajoute un coup au spectre.
// Fonctions pures (le hasard est fourni par `rnd`), testées par fluoTirages.test.mjs.
// Hypothèses : structure vibronique schématique (5 sous-niveaux de vibration, mêmes facteurs de Franck-Condon pour l'absorption et l'émission,
// donc spectres d'allure « image miroir ») ; la molécule part toujours du niveau le plus bas de S₀ ; règle de Kasha (relaxation vibrationnelle complète
// jusqu'au bas de S₁ avant toute émission) ; raies élargies par une gaussienne de largeur 0,05 eV ; E(eV) × λ(nm) = 1243.
import { gauss } from './fluoModele.js';

export const HC = 1243;
export const SIG = 0.05;                                   // largeur (écart-type, eV) de chaque raie vibronique
export const FC = [0.08, 0.22, 0.36, 0.22, 0.12];          // poids des transitions vers v = 0 … 4 (somme = 1) ; maximum pour v = 2
export const NV = FC.length;
export const BORNES = { lam0: 290, lam1: 600, pas: 5 };
export const NBINS = Math.round((BORNES.lam1 - BORNES.lam0) / BORNES.pas);
export const LAM_EXC = { min: 290, max: 410 };             // domaine balayé pour le spectre d'excitation
export const FENETRE = 12;                                 // demi-largeur (nm) de la fenêtre de détection
export const P_ABS_MAX = 0.9;                              // probabilité d'absorption au sommet d'une raie
export const MAX_PHOTONS = 20000;

// Molécules : E00 = écart entre le bas de S₁ et le bas de S₀ ; hw = écart entre deux sous-niveaux de vibration (eV)
// A : maxima 350 nm (absorption) et 450 nm (fluorescence), comme la molécule A du reste de la simulation.
// B : 350 nm, 420 nm (fluorescence) et 520 nm (phosphorescence), comme la molécule B.
export const MOLS_T = {
  A: { id: 'A', nom: 'Molécule A (fluorescente)', E00: 3.157, hw: 0.197, rend: { fluo: 0.7, cis: 0 }, T: null },
  B: { id: 'B', nom: 'Molécule B (phosphorescente)', E00: 3.256, hw: 0.148, rend: { fluo: 0.15, cis: 0.6 }, T: { E00: 2.686, phos: 0.55 } },
};
export const lamDe = E => HC / E;
export const energieDe = lam => HC / lam;
export const raiesAbs = mol => FC.map((_, v) => mol.E00 + v * mol.hw);
export const raiesFluo = mol => FC.map((_, v) => mol.E00 - v * mol.hw);
export const raiesPhos = mol => (mol.T ? FC.map((_, v) => mol.T.E00 - v * mol.hw) : []);

// Spectre d'absorption (non normalisé) et probabilité d'absorption d'un photon d'énergie E
const densAbs = (mol, E) => raiesAbs(mol).reduce((s, E0, v) => s + FC[v] * gauss(E, E0, SIG), 0);
const maxAbsCache = {};
const maxAbs = mol => maxAbsCache[mol.id] ??= Math.max(...Array.from({ length: 2000 }, (_, i) => densAbs(mol, 2.5 + i * 0.001)));
export const pAbs = (mol, E) => P_ABS_MAX * densAbs(mol, E) / maxAbs(mol);
// Densité de probabilité (par eV) de l'énergie d'un photon émis, pour une famille de raies
const pdfRaies = (raies, E) => raies.reduce((s, E0, v) => s + FC[v] * gauss(E, E0, SIG) / (SIG * Math.sqrt(2 * Math.PI)), 0);
export const pdfFluo = (mol, E) => pdfRaies(raiesFluo(mol), E);
export const pdfPhos = (mol, E) => (mol.T ? pdfRaies(raiesPhos(mol), E) : 0);
// Part des photons de fluorescence (ou de phosphorescence) émis entre deux longueurs d'onde (intégration numérique)
const partEntre = (pdf, lam1, lam2, mol) => { const n = 200, d = (lam2 - lam1) / n; let s = 0; for (let i = 0; i < n; i++) { const l = lam1 + (i + 0.5) * d, E = HC / l; s += pdf(mol, E) * HC / (l * l) * d; } return s; };

// ---------- un photon ----------
const normale = rnd => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
const tirerV = rnd => { let u = rnd(), s = 0; for (let v = 0; v < NV; v++) { s += FC[v]; if (u < s) return v; } return NV - 1; };
// Photon d'énergie E envoyé sur la molécule. Renvoie l'événement : absorbé ou non, sous-niveau atteint dans S₁, voie de désexcitation, énergie émise.
export function photon(mol, E, rnd) {
  if (rnd() >= pAbs(mol, E)) return { absorbe: false };
  const poids = raiesAbs(mol).map((E0, v) => FC[v] * gauss(E, E0, SIG)), tot = poids.reduce((a, b) => a + b, 0);
  let u = rnd() * tot, vAbs = 0; for (; vAbs < NV - 1; vAbs++) { u -= poids[vAbs]; if (u < 0) break; }
  const r = rnd();
  if (r < mol.rend.fluo) { const v = tirerV(rnd); return { absorbe: true, vAbs, voie: 'fluo', v, Eem: mol.E00 - v * mol.hw + SIG * normale(rnd) }; }
  if (r < mol.rend.fluo + mol.rend.cis) {
    if (rnd() < mol.T.phos) { const v = tirerV(rnd); return { absorbe: true, vAbs, voie: 'phos', v, Eem: mol.T.E00 - v * mol.hw + SIG * normale(rnd) }; }
    return { absorbe: true, vAbs, voie: 'nrT' };
  }
  return { absorbe: true, vAbs, voie: 'nr' };
}

// ---------- cumul des tirages ----------
export const etatVide = () => ({ nEnv: 0, nAbs: 0, nFl: 0, nPh: 0, fl: new Array(NBINS).fill(0), ph: new Array(NBINS).fill(0), ex: new Array(NBINS).fill(0), dernier: null });
export const indiceLam = lam => { const i = Math.floor((lam - BORNES.lam0) / BORNES.pas); return i >= 0 && i < NBINS ? i : -1; };
export const lamCentre = i => BORNES.lam0 + (i + 0.5) * BORNES.pas;
// params : { mode: 'emission' | 'excitation', lamExc (nm, mode émission), lamEm (nm, mode excitation) }
export function lancer(etat, mol, params, k, rnd) {
  const e = { ...etat, fl: etat.fl.slice(), ph: etat.ph.slice(), ex: etat.ex.slice() };
  for (let j = 0; j < k && e.nEnv < MAX_PHOTONS; j++) {
    const lamIn = params.mode === 'excitation' ? LAM_EXC.min + (LAM_EXC.max - LAM_EXC.min) * rnd() : params.lamExc;
    const ev = photon(mol, HC / lamIn, rnd);
    e.nEnv++;
    const lamOut = ev.Eem ? HC / ev.Eem : null;
    let detecte = false;
    if (ev.absorbe) {
      e.nAbs++;
      if (params.mode === 'excitation') { if (lamOut != null && Math.abs(lamOut - params.lamEm) <= FENETRE) { const i = indiceLam(lamIn); if (i >= 0) { e.ex[i]++; detecte = true; } } }
      else if (lamOut != null) { const i = indiceLam(lamOut); if (i >= 0) { (ev.voie === 'fluo' ? e.fl : e.ph)[i]++; detecte = true; } }
      if (ev.voie === 'fluo') e.nFl++; else if (ev.voie === 'phos') e.nPh++;
    }
    e.dernier = { ...ev, lamIn, lamOut, detecte };
  }
  return e;
}

// ---------- comptes attendus (pour la courbe de comparaison) ----------
export function attendu(mol, params, etat) {
  const out = new Array(NBINS).fill(0);
  if (params.mode === 'excitation') {
    const pw = mol.rend.fluo * partEntre(pdfFluo, params.lamEm - FENETRE, params.lamEm + FENETRE, mol)
      + (mol.T ? mol.rend.cis * mol.T.phos * partEntre(pdfPhos, params.lamEm - FENETRE, params.lamEm + FENETRE, mol) : 0);
    for (let i = 0; i < NBINS; i++) { const l = lamCentre(i); if (l >= LAM_EXC.min && l < LAM_EXC.max) out[i] = etat.nEnv * BORNES.pas / (LAM_EXC.max - LAM_EXC.min) * pAbs(mol, HC / l) * pw; }
  } else {
    const nF = etat.nAbs * mol.rend.fluo, nP = mol.T ? etat.nAbs * mol.rend.cis * mol.T.phos : 0;
    for (let i = 0; i < NBINS; i++) { const l = lamCentre(i), E = HC / l, jac = HC / (l * l) * BORNES.pas; out[i] = nF * pdfFluo(mol, E) * jac + nP * pdfPhos(mol, E) * jac; }
  }
  return out;
}
export const lamMaxEmission = mol => { let m = 0, lm = 0; for (let l = 380; l < 620; l += 0.5) { const v = pdfFluo(mol, HC / l) * HC / (l * l); if (v > m) { m = v; lm = l; } } return lm; };
export const lamMaxAbsorption = mol => { let m = 0, lm = 0; for (let l = 290; l < 420; l += 0.5) { const v = pAbs(mol, HC / l); if (v > m) { m = v; lm = l; } } return lm; };
export const rendementQuantique = mol => mol.rend.fluo;

// Texte du dernier événement, pour l'affichage
const NB = '\u00a0';
export function texteEvenement(d, mode) {
  if (!d) return 'aucun photon envoyé';
  if (!d.absorbe) return 'traverse l’échantillon sans être absorbé';
  const abs = `absorbé (S₀ v = 0 → S₁ v′ = ${d.vAbs})`, rv = d.vAbs > 0 ? ', relaxation vibrationnelle' : '';
  const fin = d.voie === 'fluo' ? `, fluorescence (S₁ v′ = 0 → S₀ v = ${d.v}) à ${Math.round(d.lamOut)}${NB}nm`
    : d.voie === 'phos' ? `, croisement intersystème, phosphorescence (T₁ → S₀ v = ${d.v}) à ${Math.round(d.lamOut)}${NB}nm`
    : d.voie === 'nrT' ? ', croisement intersystème, retour à S₀ sans photon (chaleur)' : ', retour à S₀ sans photon (chaleur)';
  const hors = mode === 'excitation' && d.lamOut != null && !d.detecte ? ' ; photon émis hors de la fenêtre de détection' : '';
  return `${abs}${rv}${fin}${hors}`;
}
