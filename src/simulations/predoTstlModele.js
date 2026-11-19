// ====================================================
//  MODÈLE « pH = pKa + log, DIAGRAMME DE PRÉDOMINANCE ET INDICATEUR COLORÉ » (sim 139, TSTL, enseignement PCM,
//  partie « Réactions acido-basiques en solution aqueuse »).
//  Un couple acide/base AH/A⁻ de pKa donné, dans une solution dont le pH est IMPOSÉ (par exemple par un mélange de l'acide et de sa base conjuguée,
//  ou par un tampon) : on en déduit le rapport [A⁻]/[AH] et les concentrations.
//  Hypothèses de travail (rappelées dans un panneau de la simulation) :
//   - 25 °C ; activités ≈ concentrations / c° (c° = 1 mol/L) : solutions diluées ;
//   - le pH est fixé : l'ajout de l'espèce étudiée ne le modifie pas (justifié par un tampon ou par une très faible concentration, ex. un indicateur coloré) ;
//   - conservation de la matière : C = [AH] + [A⁻] ;
//   - relation pH = pKa + log([A⁻]/[AH]) (modèle exact ici : c'est la définition de Ka) ;
//   - spectrophotométrie : loi de Beer-Lambert A = ε·ℓ·[espèce absorbante], une seule espèce (la forme basique de l'indicateur) absorbe à la longueur d'onde choisie ;
//   - pKa : valeurs usuelles à 25 °C arrondies au dixième ; indicateur coloré FICTIF (pas un indicateur réel) ;
//   - pH-mètre idéal à 2 décimales, spectrophotomètre idéal à 3 décimales.
//  Unités : concentrations en mol/L ; ε en L·mol⁻¹·cm⁻¹ ; ℓ en cm ; A, Ka, pKa et rapports sans unité.
// ====================================================

export const COUPLES = {
  clch2: { id: 'clch2', nom: 'acide chloroéthanoïque',      AH: 'ClCH₂COOH', A: 'ClCH₂COO⁻', pKa: 2.9,  type: 'acide' },
  prop:  { id: 'prop',  nom: 'acide propanoïque',           AH: 'C₂H₅COOH',  A: 'C₂H₅COO⁻',  pKa: 4.9,  type: 'acide' },
  hclo:  { id: 'hclo',  nom: 'acide hypochloreux',          AH: 'HClO',      A: 'ClO⁻',      pKa: 7.5,  type: 'acide' },
  mam:   { id: 'mam',   nom: 'ion méthylammonium',          AH: 'CH₃NH₃⁺',   A: 'CH₃NH₂',    pKa: 10.7, type: 'ion' },
  ind:   { id: 'ind',   nom: 'indicateur coloré (fictif)',  AH: 'HInd',      A: 'Ind⁻',      pKa: 5.4,  type: 'indicateur' },
};
export const ORDRE = ['clch2', 'prop', 'ind', 'hclo', 'mam'];
export const CONC = [0.10, 0.050, 0.020, 0.010];                // mol/L (couples chimiques)
export const IND = { C: 5.0e-5, eps: 1.2e4, l: 1.00 };          // indicateur : C (mol/L), ε (L·mol⁻¹·cm⁻¹), ℓ (cm)
export const PH_MIN = 0, PH_MAX = 14;

export const arrondiPH = pH => Math.round(pH * 100) / 100;
export const arrondiCS = (x, cs = 2) => Number(Number(x).toPrecision(cs));

// ---------- formules du cours ----------
export const rapport = (pH, pKa) => 10 ** (pH - pKa);                       // [A⁻]/[AH] = 10^(pH − pKa)
export const pHDepuisRapport = (pKa, r) => pKa + Math.log10(r);             // pH = pKa + log([A⁻]/[AH])
export const pKaDepuisRapport = (pH, r) => pH - Math.log10(r);              // pKa = pH − log([A⁻]/[AH])
export const fracBase = (pH, pKa) => { const r = rapport(pH, pKa); return r / (1 + r); };   // [A⁻]/C
export const fracAcide = (pH, pKa) => 1 / (1 + rapport(pH, pKa));           // [AH]/C
export const absorbance = (eps, l, c) => eps * l * c;                       // loi de Beer-Lambert
export const concDepuisAbs = (A, eps, l) => A / (eps * l);

// Espèce qui prédomine : 'acide' si pH < pKa, 'base' si pH > pKa, 'egal' si pH = pKa
export const predomine = (pH, pKa) => (Math.abs(pH - pKa) < 1e-9 ? 'egal' : pH < pKa ? 'acide' : 'base');

// ---------- état de la solution (couple, pH, concentration totale C) ----------
export function etat(coupleId, pH, C) {
  const c = COUPLES[coupleId], r = rapport(pH, c.pKa), fb = r / (1 + r);
  const A = C * fb, AH = C * (1 - fb);
  const out = { coupleId, pH, C, pKa: c.pKa, r, A, AH, fb, pred: predomine(pH, c.pKa) };
  if (coupleId === 'ind') out.abs = Math.round(absorbance(IND.eps, IND.l, A) * 1000) / 1000;
  return out;
}

// Couleur de la solution d'indicateur : mélange linéaire de la teinte acide (jaune) et de la teinte basique (violet) selon la fraction de forme basique
const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
export const TEINTE_ACIDE = '#f5c518', TEINTE_BASE = '#6d28d9';
export function couleurIndicateur(fb) {
  const a = hex(TEINTE_ACIDE), b = hex(TEINTE_BASE);
  return '#' + a.map((x, i) => Math.round(x + (b[i] - x) * fb).toString(16).padStart(2, '0')).join('');
}

// ---------- situations du parcours guidé (toutes calculées par le modèle) ----------
export const PARCOURS = {
  couple: 'prop', C: 0.020,
  pHInf: 2.9, pHSup: 7.4,                       // prédictions : pKa − 2 et pKa + 2,5
  pHRatio: 5.9,                                 // pKa + 1 : rapport 10
  pHRel: 4.3,                                   // pKa − 0,6 : rapport 0,25
  pHInv: 6.2,                                   // pKa + 1,3 : rapport ≈ 20
  indPH: 3.4, indPHMes: 5.8, indDil: 2.5e-5,    // indicateur : solution jaune (pH 3,4), mesure à pH 5,8, solution diluée
};

// ---------- défis à valeurs aléatoires ----------
const tire = (t, alea) => t[Math.floor(alea() * t.length)];
const pHsPossibles = (pKa, ecarts) => ecarts.map(e => arrondiPH(pKa + e)).filter(p => p > 0.5 && p < 13.5);
const ECARTS_RATIO = [-1.8, -1.5, -1.2, -0.8, -0.5, 0.5, 0.8, 1.2, 1.5, 1.8];
const defiRatio = [];
for (const id of ['clch2', 'prop', 'hclo', 'mam']) for (const C of CONC) for (const pH of pHsPossibles(COUPLES[id].pKa, ECARTS_RATIO)) defiRatio.push({ id, C, pH });
export const CANDIDATS_RATIO = defiRatio;
// Défi 1 : on donne le couple (pKa), C et le pH ; il faut le rapport [A⁻]/[AH] et [A⁻]
export function tirageRatio(alea = Math.random) {
  const { id, C, pH } = tire(defiRatio, alea), e = etat(id, pH, C);
  return { type: 'ratio', coupleId: id, C, pH, r: e.r, A: e.A, AH: e.AH };
}
// Défi 2 : un indicateur inconnu (pKa caché), on donne C, ε, ℓ, le pH et l'absorbance ; il faut son pKa
export const PKA_INCONNUS = [3.8, 4.2, 4.6, 5.0, 5.4, 5.8, 6.2, 6.6, 7.0];
const ECARTS_IND = [-0.8, -0.6, -0.4, -0.3, 0.3, 0.4, 0.6, 0.8];
export function tirageIndicateur(alea = Math.random) {
  const pKa = tire(PKA_INCONNUS, alea), pH = arrondiPH(pKa + tire(ECARTS_IND, alea));
  const C = tire([3.0e-5, 5.0e-5, 8.0e-5], alea), eps = tire([8000, 10000, 12000, 15000], alea), l = tire([1.0, 2.0], alea);
  const fb = fracBase(pH, pKa), A = Math.round(absorbance(eps, l, C * fb) * 1000) / 1000;
  return { type: 'indicateur', pKa, pH, C, eps, l, abs: A, fb, Amax: Math.round(absorbance(eps, l, C) * 1000) / 1000 };
}
