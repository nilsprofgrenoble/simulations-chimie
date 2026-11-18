// ====================================================
//  MODÈLE « COUPLES ACIDE-BASE : PRÉDOMINANCE, DISTRIBUTION, INDICATEURS COLORÉS » (sim 130, niveau TG) — couple AH / A⁻ de pKA donné, à 25 °C.
//  Réutilise acidesBasesModele.js (sim 85) SANS le modifier (fractions, INDICATEURS).
//  Hypothèses de travail (rappelées dans la simulation) :
//   - 25 °C ; activités ≈ concentrations / c° (c° = 1 mol/L) : solutions diluées ;
//   - on impose le pH (solution tamponnée par ailleurs) : le couple ne modifie pas le pH, seul le rapport [A⁻]/[AH] = 10^(pH − pKA) en découle ;
//   - monoacide AH / A⁻ (pas de polyacide ni d'acide α-aminé) ;
//   - indicateur coloré = couple HIn / In⁻ dont les deux formes ont des teintes différentes ; zone de virage idéalisée : pKA ± 1
//     (une forme est au moins 10 fois plus abondante que l'autre en dehors de cette zone) ; les tables donnent des bornes un peu différentes.
// ====================================================
import { fractions, INDICATEURS } from './acidesBasesModele.js';

export const COUPLES = {
  hcooh: { id: 'hcooh', nom: 'acide méthanoïque', AH: 'HCOOH',    A: 'HCOO⁻',    pKa: 3.75 },
  c6h5:  { id: 'c6h5',  nom: 'acide benzoïque',   AH: 'C₆H₅COOH', A: 'C₆H₅COO⁻', pKa: 4.20 },
  ch3:   { id: 'ch3',   nom: 'acide éthanoïque',  AH: 'CH₃COOH',  A: 'CH₃COO⁻',  pKa: 4.76 },
  nh4:   { id: 'nh4',   nom: 'ion ammonium',      AH: 'NH₄⁺',     A: 'NH₃',      pKa: 9.20 },
};
export const ORDRE = ['hcooh', 'c6h5', 'ch3', 'nh4'];

// rapport [A⁻]/[AH] = K_A / [H₃O⁺] = 10^(pH − pKA)
export const rapport = (pH, pKa) => 10 ** (pH - pKa);
// fractions (pourcentages / 100) de chaque forme à un pH donné (diagramme de distribution)
export const fracBase = (pH, pKa) => fractions(10 ** -pH, [pKa])[1];
export const fracAcide = (pH, pKa) => fractions(10 ** -pH, [pKa])[0];
export const pct = x => 100 * x;
// forme prédominante : AH si pH < pKA, A⁻ si pH > pKA (égalité à pKA)
export const predominante = (pH, pKa) => (Math.abs(pH - pKa) < 1e-9 ? 'egal' : pH < pKa ? 'AH' : 'A');
// concentrations des deux formes pour une concentration totale C du couple
export const concBase = (C, pH, pKa) => C * fracBase(pH, pKa);
export const concAcide = (C, pH, pKa) => C * fracAcide(pH, pKa);
// pH auquel la fraction de forme basique vaut p (0 < p < 1) : [A⁻]/[AH] = p/(1−p)
export const pHPourFraction = (p, pKa) => pKa + Math.log10(p / (1 - p));
// courbes du diagramme de distribution
export function courbes(pKa, n = 141) {
  const pts = [];
  for (let i = 0; i < n; i++) { const pH = 14 * i / (n - 1); pts.push({ pH, acide: fracAcide(pH, pKa), base: fracBase(pH, pKa) }); }
  return pts;
}

// ---------- indicateurs colorés (couples HIn / In⁻ ; teintes de acidesBasesModele.js) ----------
export const INDIC = ['jm', 'vbc', 'bbt', 'bth', 'jar'].map(id => {
  const i = INDICATEURS.find(x => x.id === id);
  return { id, nom: i.nom.replace(' (2ᵉ virage)', ''), pKa: i.pKa, acide: i.acide, base: i.base, zone: [Math.round((i.pKa - 1) * 10) / 10, Math.round((i.pKa + 1) * 10) / 10] };
});
export const indicParId = id => INDIC.find(i => i.id === id);
// couleur d'un indicateur : mélange des deux teintes, interpolé en teinte (le BBT passe par le vert entre le jaune et le bleu)
const hexRGB = c => [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16) / 255);
function rgbHSL([r, g, b]) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1)), h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslRGB([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r + m, g + m, b + m].map(v => Math.round(255 * v));
}
export const couleurIndic = (ind, pH) => {
  const t = fracBase(pH, ind.pKa), a = rgbHSL(hexRGB(ind.acide)), b = rgbHSL(hexRGB(ind.base));
  let dh = b[0] - a[0]; if (dh > 180) dh -= 360; if (dh < -180) dh += 360;
  const h = (a[0] + dh * t + 360) % 360;
  return `rgb(${hslRGB([h, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]).join(',')})`;
};
// teinte perçue : « acide » (forme HIn ≥ 10 fois In⁻), « basique » (In⁻ ≥ 10 fois HIn) ou « mélange » (zone de virage)
export const teinte = (ind, pH) => (pH <= ind.pKa - 1 ? 'acide' : pH >= ind.pKa + 1 ? 'base' : 'melange');
// un indicateur convient pour un titrage si son pKA est à moins de 1 unité du pH à l'équivalence (zone de virage qui contient ce pH)
export const convient = (ind, pHeq) => pHeq >= ind.zone[0] && pHeq <= ind.zone[1];

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const arr1 = x => Math.round(x * 10) / 10;
// défi 1 : couple + pH (1 décimale) → forme prédominante et pourcentage de forme basique
export function tirageDefiPred() {
  const c = COUPLES[tire(ORDRE)], pH = arr1(c.pKa + tire([-1.5, -1, -0.5, 0.5, 1, 1.5, 2])), pKa = c.pKa;
  const pb = pct(fracBase(pH, pKa));
  return { couple: c, pH, pKa, prod: predominante(pH, pKa), pctBase: pb };
}
// défi 2 : pH à l'équivalence donné, trois indicateurs dont un seul convient (marges nettes)
export function tirageDefiIndic() {
  for (let essai = 0; essai < 5000; essai++) {
    const ind = INDIC.slice().sort(() => Math.random() - 0.5).slice(0, 3), pHeq = arr1(2.5 + Math.random() * 9);
    const bons = ind.filter(i => convient(i, pHeq));
    if (bons.length === 1 && Math.abs(bons[0].pKa - pHeq) <= 0.7 && ind.every(i => i === bons[0] || Math.abs(i.pKa - pHeq) >= 1.4)) return { pHeq, ind, vrai: ind.indexOf(bons[0]) };
  }
  const ind = [indicParId('jm'), indicParId('bbt'), indicParId('jar')];
  return { pHeq: 6.8, ind, vrai: 1 };
}
