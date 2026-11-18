// ====================================================
//  MODÈLE « SOLUTION TAMPON » (sim 131, niveau TG) — mélange d'un acide faible AH et de sa base conjuguée A⁻ à 25 °C.
//  Réutilise acidesBasesModele.js (sim 85) SANS le modifier (pH exact par la conservation de la charge).
//  Hypothèses de travail (rappelées dans la simulation) :
//   - 25 °C ; activités ≈ concentrations / c° (c° = 1 mol/L) ; volumes additifs ;
//   - tampon préparé dans V0 = 100 mL ; l'acide fort (HCl) et la base forte (NaOH) ajoutés sont à 0,10 mol/L, totalement dissociés ;
//   - le pH est calculé « exactement » (autoprotolyse comprise) : les formules approchées du cours n'interviennent pas ;
//   - un seul couple acide-base (monoacide) ; pas de CO₂ dissous.
//  Unités internes : volumes en mL, quantités de matière en mmol (mmol / mL = mol/L).
// ====================================================
import { fractions, pH as pHExact } from './acidesBasesModele.js';

export const V0 = 100;          // volume initial de chaque bécher (mL)
export const C_AJOUT = 0.10;    // concentration de l'acide chlorhydrique et de la soude ajoutés (mol/L)
export const PAS = 10;          // volume d'un ajout (mL)

export const COUPLES = {
  ch3: { id: 'ch3', nom: 'acide éthanoïque / ion éthanoate', AH: 'CH₃COOH', A: 'CH₃COO⁻', pKa: 4.76, sel: 'éthanoate de sodium' },
  nh4: { id: 'nh4', nom: 'ion ammonium / ammoniac', AH: 'NH₄⁺', A: 'NH₃', pKa: 9.20, sel: 'ammoniac' },
};
export const ORDRE = ['ch3', 'nh4'];

// composition initiale : concentration totale Ctot (mol/L, AH + A⁻ dans V0) et fraction x de forme basique → quantités en mmol
export const quantites = (Ctot, x) => ({ nAH: Ctot * V0 * (1 - x), nA: Ctot * V0 * x });

// volumes ajoutés : va (acide), vb (soude), ve (eau pure), en mL
export const volumeTotal = ({ va = 0, vb = 0, ve = 0 }) => V0 + va + vb + ve;

// pH d'un tampon (nAH, nA en mmol dans V0) après les ajouts. Cas général : la base conjuguée vient d'un sel de sodium (ou de NH₃) : cb = nA/Vt.
export function pHTampon({ pKa, nAH, nA, va = 0, vb = 0, ve = 0 }) {
  const Vt = volumeTotal({ va, vb, ve });
  return pHExact({ C: (nAH + nA) / Vt, pKas: [pKa], cb: (nA + C_AJOUT * vb) / Vt, ca: (C_AJOUT * va) / Vt });
}
// pH de l'eau pure après les mêmes ajouts (acide fort et base forte dans l'eau)
export function pHEau({ va = 0, vb = 0, ve = 0 }) {
  const Vt = volumeTotal({ va, vb, ve });
  return pHExact({ C: 0, pKas: [], cb: (C_AJOUT * vb) / Vt, ca: (C_AJOUT * va) / Vt });
}
// pH d'une solution quelconque dans V0 : acide faible seul, base faible seule (sel), acide fort seul…
//  spec = { pKa, nAH, nA, cbExtra, caExtra } ; sert aux défis (acide faible seul : nA = 0 ; sel seul : nAH = 0 ; acide fort : pas de pKa)
export function pHSolution(spec, aj = {}) {
  const { va = 0, vb = 0, ve = 0 } = aj, Vt = volumeTotal({ va, vb, ve });
  if (spec.pKa == null) return pHExact({ C: 0, pKas: [], cb: (spec.cb || 0) * V0 / Vt + C_AJOUT * vb / Vt, ca: (spec.ca || 0) * V0 / Vt + C_AJOUT * va / Vt });
  return pHExact({ C: (spec.nAH + spec.nA) / Vt, pKas: [spec.pKa], cb: (spec.nA + C_AJOUT * vb) / Vt, ca: (C_AJOUT * va) / Vt });
}

// quantités de AH et de A⁻ (mmol) dans le tampon après les ajouts, déduites du pH exact
export function composition({ pKa, nAH, nA, va = 0, vb = 0, ve = 0 }) {
  const ph = pHTampon({ pKa, nAH, nA, va, vb, ve }), f = fractions(10 ** -ph, [pKa]), n = nAH + nA;
  return { pH: ph, nAH: n * f[0], nA: n * f[1] };
}
// courbe pH = f(volume ajouté) : abscisse signée (mL), négative pour l'acide, positive pour la soude ; ve = eau déjà ajoutée
export function courbeAjout({ pKa, nAH, nA, ve = 0 }, vMax = 150, n = 151) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const v = -vMax + 2 * vMax * i / (n - 1), a = v < 0 ? -v : 0, b = v > 0 ? v : 0;
    pts.push({ v, tampon: pHTampon({ pKa, nAH, nA, va: a, vb: b, ve }), eau: pHEau({ va: a, vb: b, ve }) });
  }
  return pts;
}
// variation (en unités de pH, valeur absolue) pour un ajout donné
export const variation = (ph0, ph1) => Math.abs(ph1 - ph0);

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const arr2 = x => Math.round(x * 100) / 100;
const melange = t => t.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(p => p[1]);

// types de béchers du défi 1 (même volume V0 = 100 mL)
const faux = [
  { id: 'faible', nom: 'solution d’acide éthanoïque seul à 0,10 mol/L', spec: { pKa: 4.76, nAH: 10, nA: 0 } },
  { id: 'sel', nom: 'solution d’éthanoate de sodium seul à 0,10 mol/L', spec: { pKa: 4.76, nAH: 0, nA: 10 } },
  { id: 'eau', nom: 'eau pure', spec: { pKa: null, cb: 0, ca: 0 } },
  { id: 'fort', nom: 'solution d’acide chlorhydrique à 0,010 mol/L', spec: { pKa: null, cb: 0, ca: 0.010 } },
];
// défi 1 : trois béchers inconnus, un seul est un tampon (acide faible + base conjuguée en quantités comparables)
export function tirageDefiTampon() {
  const c = tire(['ch3', 'nh4']), cp = COUPLES[c], Ctot = tire([0.10, 0.20, 0.30]), t = { id: 'tampon', nom: `tampon ${cp.AH} / ${cp.A}`, spec: { pKa: cp.pKa, nAH: Ctot * V0 / 2, nA: Ctot * V0 / 2 } };
  const autres = melange(faux).slice(0, 2), bechers = melange([t, ...autres]).map((b, i) => {
    const ph0 = arr2(pHSolution(b.spec)), phA = arr2(pHSolution(b.spec, { va: PAS })), phB = arr2(pHSolution(b.spec, { vb: PAS }));
    return { lettre: 'ABC'[i], id: b.id, nom: b.nom, ph0, phA, phB };
  });
  const vrai = bechers.findIndex(b => b.id === 'tampon'), tb = bechers[vrai];
  return { bechers, vrai, couple: cp, varAcide: arr2(Math.abs(tb.phA - tb.ph0)), varBase: arr2(Math.abs(tb.phB - tb.ph0)) };
}
// défi 2 : pH visé ; trois couples candidats : on choisit celui dont le pKA est le plus proche du pH visé, puis on calcule le rapport n(A⁻)/n(AH) = 10^(pH − pKA)
export const COUPLES_DEFI = [
  { AH: 'HCOOH', A: 'HCOO⁻', pKa: 3.75, nom: 'acide méthanoïque' },
  { AH: 'CH₃COOH', A: 'CH₃COO⁻', pKa: 4.76, nom: 'acide éthanoïque' },
  { AH: 'HClO', A: 'ClO⁻', pKa: 7.54, nom: 'acide hypochloreux' },
  { AH: 'NH₄⁺', A: 'NH₃', pKa: 9.20, nom: 'ion ammonium' },
];
export function tirageDefiCouple() {
  for (let essai = 0; essai < 5000; essai++) {
    const cand = melange(COUPLES_DEFI).slice(0, 3), ref = tire(cand), pHv = arr2(Math.round((ref.pKa + tire([-0.7, -0.5, -0.3, 0.3, 0.5, 0.7])) * 10) / 10);
    const d = cand.map(c => Math.abs(c.pKa - pHv)), tri = d.slice().sort((a, b) => a - b), vrai = d.indexOf(tri[0]);
    if (tri[0] <= 0.75 && tri[0] >= 0.2 && tri[1] - tri[0] >= 0.8) return { pHvise: pHv, cand, vrai, ratio: 10 ** (pHv - cand[vrai].pKa) };
  }
  return { pHvise: 4.5, cand: [COUPLES_DEFI[0], COUPLES_DEFI[1], COUPLES_DEFI[3]], vrai: 1, ratio: 10 ** (4.5 - 4.76) };
}
