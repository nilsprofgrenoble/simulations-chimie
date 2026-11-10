// Sélectivités stéréochimiques : addition syn ou anti sur un alcène (résultats classiques de cours, sans calcul d'énergie).
export const ALCENES = {
  Z: { cle: 'Z', nom: '(Z)-but-2-ène', R: 'CH₃', cyc: false },
  E: { cle: 'E', nom: '(E)-but-2-ène', R: 'CH₃', cyc: false },
  cyc: { cle: 'cyc', nom: '1,2-diméthylcyclohexène', R: 'cycle', cyc: true },
};
export const REACTIFS = {
  Br2: { cle: 'Br2', nom: 'Br₂ (dans CH₂Cl₂)', court: 'Br₂', mode: 'anti', groupe: 'Br', inter: 'ion bromonium' },
  OsO4: { cle: 'OsO4', nom: 'OsO₄ catalytique (ou KMnO₄ froid et dilué)', court: 'OsO₄', mode: 'syn', groupe: 'OH', inter: 'ester osmique cyclique' },
  H2: { cle: 'H2', nom: 'H₂ sur palladium (Pd/C)', court: 'H₂/Pd', mode: 'syn', groupe: 'H', inter: 'atomes H adsorbés sur le métal' },
};
// Résultat pour chaque couple (alcène, réactif). type : 'specifique' (deux stéréoisomères de départ → produits différents),
// 'selective' (un stéréoisomère formé de préférence), 'sans' (pas de stéréoisomérie dans le produit).
export const RES = {
  'Z|Br2': { produit: '2,3-dibromobutane', resultat: 'racémique', desc: ['(2R,3R)', '(2S,3S)'], n: 2, type: 'specifique' },
  'E|Br2': { produit: '2,3-dibromobutane', resultat: 'méso', desc: ['(2R,3S)'], n: 1, type: 'specifique' },
  'Z|OsO4': { produit: 'butane-2,3-diol', resultat: 'méso', desc: ['(2R,3S)'], n: 1, type: 'specifique' },
  'E|OsO4': { produit: 'butane-2,3-diol', resultat: 'racémique', desc: ['(2R,3R)', '(2S,3S)'], n: 2, type: 'specifique' },
  'Z|H2': { produit: 'butane', resultat: 'aucun stéréoisomère', desc: [], n: 0, type: 'sans' },
  'E|H2': { produit: 'butane', resultat: 'aucun stéréoisomère', desc: [], n: 0, type: 'sans' },
  'cyc|Br2': { produit: '1,2-dibromo-1,2-diméthylcyclohexane', resultat: 'trans (racémique)', desc: ['trans'], n: 2, type: 'selective' },
  'cyc|OsO4': { produit: '1,2-diméthylcyclohexane-1,2-diol', resultat: 'cis (méso)', desc: ['cis'], n: 1, type: 'selective' },
  'cyc|H2': { produit: '1,2-diméthylcyclohexane', resultat: 'cis (méso)', desc: ['cis'], n: 1, type: 'selective' },
};
export const resultat = (a, r) => RES[`${a}|${r}`];
export const NOM_TYPE = { specifique: 'stéréospécifique', selective: 'stéréosélective', sans: 'sans stéréochimie à discuter' };
