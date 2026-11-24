// ====================================================
//  MODÈLE DE LA SIMULATION 159 « COMBUSTIONS » (1G spé PC) : combustion complète d'un alcane ou d'un alcool,
//  énergie molaire de réaction estimée à partir des énergies de liaison, pouvoir calorifique.
//  Fichier sans React, testé par combustionModele.test.mjs.
//
//  HYPOTHÈSES DU MODÈLE (affichées à l'élève dans le panneau « Hypothèses de travail ») :
//   • phase gazeuse : tous les corps, y compris l'eau, sont pris à l'état gazeux (pas d'énergie de changement d'état) ;
//   • combustion complète : seuls CO₂ et H₂O se forment ;
//   • énergies de liaison = valeurs MOYENNES tabulées (une liaison C–H a la même énergie dans toutes les molécules) :
//     E_r est donc une ESTIMATION, à comparer à une valeur de référence (écart de quelques %) ;
//   • l'équation est écrite avec le coefficient 1 pour le combustible (coefficients demi-entiers autorisés) :
//     E_r est alors l'énergie pour 1 mol de combustible brûlé ;
//   • D(A–B) > 0 : énergie à fournir pour rompre 1 mol de liaisons ; E_r = Σ D(rompues) − Σ D(formées), E_r < 0 : exothermique.
//  La grandeur « enthalpie » ΔrH n'est pas utilisée (hors programme) : elle n'est pas écrite à l'écran.
// ====================================================

// Énergies de liaison moyennes (kJ·mol⁻¹), jeu cohérent de valeurs courantes de manuels ; C=O est celle du dioxyde de carbone.
export const D_LIAISON = { CH: 413, CC: 348, CO: 358, OH: 463, OO: 498, CdO: 804 };
export const NOM_LIAISON = { CH: 'C–H', CC: 'C–C', CO: 'C–O', OH: 'O–H', OO: 'O=O', CdO: 'C=O' };
export const ORDRE_LIAISONS = ['CH', 'CC', 'CO', 'OH', 'OO', 'CdO'];
// Masses molaires atomiques arrondies (g/mol), comme dans les autres simulations de 1G
export const M_ATOME = { C: 12.0, H: 1.0, O: 16.0 };

// Valeur de référence de l'énergie molaire de réaction (kJ·mol⁻¹, phase gazeuse, eau gazeuse), arrondie : valeurs tabulées issues de mesures.
export const COMBUSTIBLES = [
  { id: 'ch4', nom: 'méthane', f: 'CH₄', type: 'alcane', nC: 1, ref: -802, usage: 'gaz naturel' },
  { id: 'c3h8', nom: 'propane', f: 'C₃H₈', type: 'alcane', nC: 3, ref: -2043, usage: 'bouteille de gaz' },
  { id: 'c4h10', nom: 'butane', f: 'C₄H₁₀', type: 'alcane', nC: 4, ref: -2657, usage: 'réchaud de camping' },
  { id: 'c8h18', nom: 'octane', f: 'C₈H₁₈', type: 'alcane', nC: 8, ref: -5116, usage: 'constituant de l’essence' },
  { id: 'ch3oh', nom: 'méthanol', f: 'CH₃OH', type: 'alcool', nC: 1, ref: -676, usage: 'carburant de compétition' },
  { id: 'c2h5oh', nom: 'éthanol', f: 'C₂H₅OH', type: 'alcool', nC: 2, ref: -1278, usage: 'bioéthanol, alcool à brûler' },
  { id: 'c3h7oh', nom: 'propan-1-ol', f: 'C₃H₇OH', type: 'alcool', nC: 3, ref: -1892, usage: 'solvant' },
];
export const combustible = id => COMBUSTIBLES.find(c => c.id === id);

// ---------- composition ----------
export const atomes = c => c.type === 'alcane' ? { C: c.nC, H: 2 * c.nC + 2, O: 0 } : { C: c.nC, H: 2 * c.nC + 2, O: 1 };
export const masseMolaire = c => { const a = atomes(c); return a.C * M_ATOME.C + a.H * M_ATOME.H + a.O * M_ATOME.O; };
// Coefficients pour 1 mol de combustible : CxHyOz + (x + y/4 − z/2) O₂ → x CO₂ + (y/2) H₂O
export const coefficients = c => { const a = atomes(c); return { fuel: 1, O2: a.C + a.H / 4 - a.O / 2, CO2: a.C, H2O: a.H / 2 }; };

// ---------- écriture ----------
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
export const coefTexte = x => {
  if (x === 1) return '';
  const k = Math.floor(x), demi = x - k === 0.5;
  return `${k > 0 || !demi ? k : ''}${demi ? '½' : ''}${NB}`.replace(/^0/, '');
};
const NB = ' ';
// « 6½ O₂ » : coefficient (avec demi-entier écrit ½), espace insécable, formule
const terme = (x, f) => `${coefTexte(x)}${f}`;
export const equation = (c, { cache = null } = {}) => {
  const k = coefficients(c);
  const t = (cle, x, f) => (cache && cache.includes(cle) ? `…${NB}${f}` : terme(x, f));
  return `${c.f} + ${t('O2', k.O2, 'O₂')} → ${t('CO2', k.CO2, 'CO₂')} + ${t('H2O', k.H2O, 'H₂O')}`;
};
export const equationATrous = c => `${c.f} + …${NB}O₂ → …${NB}CO₂ + …${NB}H₂O`;
export const estEntiere = c => Number.isInteger(coefficients(c).O2);

// ---------- liaisons ----------
// Liaisons de la molécule de combustible (formule développée)
export const liaisonsMolecule = c => {
  const a = atomes(c);
  const L = { CH: a.C * 2 + 2 - (a.O ? 1 : 0), CC: a.C - 1 };
  if (a.O) { L.CO = 1; L.OH = 1; }
  return L;
};
// Liaisons rompues : celles du combustible (× 1) et de O₂ (× coefficient) ; formées : C=O de CO₂ et O–H de H₂O.
export const liaisonsRompues = c => {
  const L = {}; const k = coefficients(c);
  for (const [t, n] of Object.entries(liaisonsMolecule(c))) if (n) L[t] = n;
  L.OO = k.O2;
  return L;
};
export const liaisonsFormees = c => { const k = coefficients(c); return { CdO: 2 * k.CO2, OH: 2 * k.H2O }; };
export const somme = L => Object.entries(L).reduce((s, [t, n]) => s + n * D_LIAISON[t], 0);
export const energieRompue = c => somme(liaisonsRompues(c));
export const energieFormee = c => somme(liaisonsFormees(c));
// Énergie molaire de réaction estimée (kJ/mol de combustible) : négative = exothermique
export const energieReaction = c => energieRompue(c) - energieFormee(c);
export const ecartRelatif = c => Math.abs(energieReaction(c) - c.ref) / Math.abs(c.ref);
// Pouvoir calorifique estimé (énergie libérée par kg de combustible) : kJ/g = MJ/kg
export const pouvoirCalorifique = c => -energieReaction(c) / masseMolaire(c);

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
export const tirerDefiEnergie = () => { const c = tire(COMBUSTIBLES.filter(x => x.id !== 'c8h18')); return { c, vrai: energieReaction(c) }; };
export const tirerDefiPouvoir = () => { const c = tire(COMBUSTIBLES.filter(x => x.id !== 'c8h18')); return { c, M: masseMolaire(c), vrai: pouvoirCalorifique(c) }; };
