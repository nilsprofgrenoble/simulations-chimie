// ====================================================
//  MODÈLE « ACIDES α-AMINÉS : FORME SELON LE pH » (sim 134, niveau TG) — un acide α-aminé à chaîne latérale neutre, deux couples acide-base, à 25 °C.
//  Réutilise acidesBasesModele.js (sim 85) SANS le modifier (fonction fractions, pour un polyacide à deux pKA).
//  Les trois formes, de la plus protonée à la moins protonée :
//    cation      H₃N⁺–CHR–COOH   (charge globale +)   — couple 1 : cation / zwitterion, pKA1 (groupe –COOH)
//    zwitterion  H₃N⁺–CHR–COO⁻   (globalement neutre) — couple 2 : zwitterion / anion,   pKA2 (groupe –NH₃⁺)
//    anion       H₂N–CHR–COO⁻    (charge globale −)
//  Hypothèses de travail (rappelées dans la simulation) :
//   - 25 °C ; activités ≈ concentrations / c° (c° = 1 mol/L) : solutions diluées ;
//   - on impose le pH (solution tamponnée par ailleurs) : l'acide aminé ne modifie pas le pH, seule la répartition entre les trois formes est calculée ;
//   - acide α-aminé à chaîne latérale neutre (glycine, alanine, sérine, phénylalanine) : seulement deux pKA ; ni acide aspartique ni lysine ;
//   - la forme non ionisée H₂N–CHR–COOH est négligée (très minoritaire à tout pH) ;
//   - pKA1 et pKA2 sont éloignés de plus de 6 unités : à chaque frontière on lit un seul couple, l'autre forme est négligeable ;
//   - valeurs de pKA usuelles à 25 °C, arrondies au dixième : données du problème, non à retrouver.
// ====================================================
import { fractions } from './acidesBasesModele.js';

export const ACIDES = {
  gly: { id: 'gly', nom: 'glycine',         R: 'H',   pKa1: 2.3, pKa2: 9.6 },
  ala: { id: 'ala', nom: 'alanine',         R: 'CH₃',       pKa1: 2.3, pKa2: 9.7 },
  ser: { id: 'ser', nom: 'sérine',          R: 'CH₂OH',     pKa1: 2.2, pKa2: 9.2 },
  phe: { id: 'phe', nom: 'phénylalanine',   R: 'CH₂C₆H₅',   pKa1: 1.8, pKa2: 9.1 },
};
export const ORDRE = ['gly', 'ala', 'ser', 'phe'];

export const FORMES = [
  { id: 'cat', nom: 'cation',     charge: '+', groupes: ['H₃N⁺', 'COOH'] },
  { id: 'zw',  nom: 'zwitterion', charge: '0', groupes: ['H₃N⁺', 'COO⁻'] },
  { id: 'an',  nom: 'anion',      charge: '−', groupes: ['H₂N', 'COO⁻'] },
];
// formule semi-développée d'une forme (chaîne latérale R écrite « CHR » sauf pour la glycine : CH₂)
export const formule = (a, forme, generique = false) => {
  const f = FORMES.find(x => x.id === forme), c = a.id === 'gly' && !generique ? 'CH₂' : 'CHR';
  return `${f.groupes[0]}–${c}–${f.groupes[1]}`;
};

// fractions (entre 0 et 1) des trois formes [cation, zwitterion, anion] à un pH donné
export const frac = (pH, a) => fractions(10 ** -pH, [a.pKa1, a.pKa2]);
export const pct = x => 100 * x;
// rapports lus à chaque frontière : [zwitterion]/[cation] = 10^(pH − pKA1) ; [anion]/[zwitterion] = 10^(pH − pKA2)
export const rapport1 = (pH, a) => 10 ** (pH - a.pKa1);
export const rapport2 = (pH, a) => 10 ** (pH - a.pKa2);
// forme prédominante : cation si pH < pKA1, zwitterion entre pKA1 et pKA2, anion si pH > pKA2 (égalité exacte à une frontière : 'egal1' ou 'egal2')
export const predominante = (pH, a) => {
  if (Math.abs(pH - a.pKa1) < 1e-9) return 'egal1';
  if (Math.abs(pH - a.pKa2) < 1e-9) return 'egal2';
  return pH < a.pKa1 ? 'cat' : pH < a.pKa2 ? 'zw' : 'an';
};
// concentrations des trois formes pour une concentration totale C
export const conc = (C, pH, a) => frac(pH, a).map(x => C * x);
// zone de pH où la fraction de zwitterion est au moins p (0 < p < 1) : fz = 1 / (h/KA1 + 1 + KA2/h) ≥ p ⇔ h² − q·KA1·h + KA1·KA2 ≤ 0, avec q = (1 − p)/p
export function zoneZwitterion(p, a) {
  const q = (1 - p) / p, K1 = 10 ** -a.pKa1, K2 = 10 ** -a.pKa2, d = 1 - 4 * K2 / (q * q * K1);
  if (d <= 0) return null;
  const hMax = (q * K1 / 2) * (1 + Math.sqrt(d)), hMin = (q * K1 / 2) * (1 - Math.sqrt(d));
  return [-Math.log10(hMax), -Math.log10(hMin)];
}
// courbes du diagramme de distribution
export function courbes(a, n = 141) {
  const pts = [];
  for (let i = 0; i < n; i++) { const pH = 14 * i / (n - 1), f = frac(pH, a); pts.push({ pH, cat: f[0], zw: f[1], an: f[2] }); }
  return pts;
}

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const arr1 = x => Math.round(x * 10) / 10;
// défi 1 : acide aminé + pH (1 décimale, à 0,5 à 1,5 unité d'une frontière) → forme prédominante et pourcentage de zwitterion
export function tirageDefiForme() {
  const a = ACIDES[tire(ORDRE)], k = tire([1, 2]), pKa = k === 1 ? a.pKa1 : a.pKa2, pH = arr1(pKa + tire([-1.5, -1, -0.5, 0.5, 1, 1.5]));
  const f = frac(pH, a);
  return { acide: a, frontiere: k, pH, prod: predominante(pH, a), pctZw: pct(f[1]), pctCat: pct(f[0]), pctAn: pct(f[2]) };
}
// défi 2 : acide aminé + seuil p (80, 90 ou 95 %) → bornes de pH de la zone où au moins p % de l'acide aminé est sous forme de zwitterion
export function tirageDefiZone() {
  const a = ACIDES[tire(ORDRE)], p = tire([80, 90, 95]), z = zoneZwitterion(p / 100, a);
  return { acide: a, p, bas: z[0], haut: z[1] };
}
