// Mouvements de molécules animés dans la simulation 304 : géométrie, déplacements, variation du moment dipolaire.
// Hypothèses : modèle simplifié (mouvements des atomes dessinés d'après la symétrie, centre de masse fixe, charges partielles arbitraires) ;
// il sert à montrer SI le moment dipolaire varie, pas à calculer une intensité. Les nombres d'onde sont ceux du gaz (valeurs arrondies).
import { masseReduite } from "./hookModele.js";
export const MASSE_A = { H: 1, C: 12, N: 14, O: 16, Cl: 35 };
const TH = 52.25 * Math.PI / 180, SN = Math.sin(TH), CS = Math.cos(TH);
const U1 = [-SN, -CS], U2 = [SN, -CS], T1 = [-CS, SN], T2 = [CS, SN];     // O→H et tangentes d'ouverture de l'angle (y vers le haut)
const add = (u, v) => [u[0] + v[0], u[1] + v[1]], mul = (c, u) => [c * u[0], c * u[1]], sub = (u, v) => add(u, mul(-1, v));
const atomes = l => l.map(([s, q, x, y]) => ({ s, m: MASSE_A[s], q, x, y }));
export const MOLS = {
  H2O: { id: 'H2O', nom: 'Eau H₂O', S: 78, liaisons: [[0, 1], [0, 2]], double: false,
    atomes: atomes([['O', -0.66, 0, 0], ['H', 0.33, -SN, -CS], ['H', 0.33, SN, -CS]]), cy: 52,
    modes: [{ id: 'sym', nom: 'élongation symétrique', sigma: 3657 }, { id: 'antisym', nom: 'élongation antisymétrique', sigma: 3756 }, { id: 'def', nom: 'déformation (variation de l’angle)', sigma: 1595 }] },
  CO2: { id: 'CO2', nom: 'Dioxyde de carbone CO₂', S: 74, liaisons: [[0, 1], [0, 2]], double: true,
    atomes: atomes([['C', 0.8, 0, 0], ['O', -0.4, -1, 0], ['O', -0.4, 1, 0]]), cy: 78,
    modes: [{ id: 'sym', nom: 'élongation symétrique', sigma: 1388 }, { id: 'antisym', nom: 'élongation antisymétrique', sigma: 2349 }, { id: 'def', nom: 'déformation (la molécule se plie)', sigma: 667 }] },
  HCl: { id: 'HCl', nom: 'Chlorure d’hydrogène HCl', S: 96, liaisons: [[0, 1]], double: false,
    atomes: atomes([['H', 0.18, -35 / 36, 0], ['Cl', -0.18, 1 / 36, 0]]), cy: 78,
    modes: [{ id: 'vib', nom: 'vibration d’élongation', sigma: 2886 }, { id: 'rot', nom: 'rotation de la molécule', sigma: 106, rot: true, B: 10.6 }] },
  N2: { id: 'N2', nom: 'Diazote N₂', S: 96, liaisons: [[0, 1]], double: false,
    atomes: atomes([['N', 0, -0.5, 0], ['N', 0, 0.5, 0]]), cy: 78,
    modes: [{ id: 'vib', nom: 'vibration d’élongation', sigma: 2331 }, { id: 'rot', nom: 'rotation de la molécule', sigma: 20, rot: true, B: 2.0 }] },
};
export const mode = (molId, modeId) => MOLS[molId].modes.find(m => m.id === modeId);
// Déplacements (unité arbitraire) de chaque atome pour une amplitude de 1, centre de masse immobile
export function deplacements(molId, modeId) {
  const M = MOLS[molId], m = M.atomes.map(a => a.m);
  if (molId === 'H2O') {
    const r = m[1] / m[0];
    if (modeId === 'sym') return [mul(-r, add(U1, U2)), U1, U2];
    if (modeId === 'antisym') return [mul(-r, sub(U1, U2)), U1, mul(-1, U2)];
    return [mul(-r, add(T1, T2)), T1, T2];
  }
  if (molId === 'CO2') {
    const c = 2 * m[1] / m[0];
    if (modeId === 'sym') return [[0, 0], [-1, 0], [1, 0]];
    if (modeId === 'antisym') return [[-c, 0], [1, 0], [1, 0]];
    return [[0, -c], [0, 1], [0, 1]];
  }
  const M2 = m[0] + m[1];                                                    // diatomique : variation de longueur
  return [[-m[1] / M2, 0], [m[0] / M2, 0]];
}
export const amplitudeMax = (molId, modeId) => Math.max(...deplacements(molId, modeId).map(d => Math.hypot(d[0], d[1])));
// Variation du moment dipolaire Σ qᵢ·dᵢ pour une amplitude 1
export const variationDipole = (molId, modeId) => { const d = deplacements(molId, modeId), A = MOLS[molId].atomes; return d.reduce((s, di, i) => add(s, mul(A[i].q, di)), [0, 0]); };
// Moment dipolaire permanent Σ qᵢ·rᵢ
export const dipolePermanent = molId => MOLS[molId].atomes.reduce((s, a) => add(s, mul(a.q, [a.x, a.y])), [0, 0]);
export const EPS = 1e-9;
export const actifIR = (molId, modeId) => (mode(molId, modeId).rot ? Math.hypot(...dipolePermanent(molId)) : Math.hypot(...variationDipole(molId, modeId))) > EPS;
// Bandes du spectre (transmittance) de chaque molécule : seuls les mouvements qui font varier le moment dipolaire apparaissent
const PROF = { H2O: { sym: 0.7, antisym: 0.8, def: 0.8 }, CO2: { antisym: 0.9, def: 0.8 }, HCl: { vib: 0.8 }, N2: {} };
const LARG = { H2O: 20, CO2: 16, HCl: 25, N2: 20 };
export const bandesMolecule = molId => MOLS[molId].modes.filter(m => !m.rot && actifIR(molId, m.id)).map(m => ({ sigma: m.sigma, larg: LARG[molId], prof: PROF[molId][m.id] }));
// Rotation : fréquence réelle (tours/s) ≈ c·σ de la raie J → J+1 (σ = 2B(J+1)), et ralenti de l'animation à 0,5 tour/s
export const TOURS_ANIM = 0.5;
export const sigmaRaieRot = (B, J) => 2 * B * (J + 1);
export const massesReduites = molId => { const a = MOLS[molId].atomes; return a.length === 2 ? masseReduite(a[0].m, a[1].m) : null; };
