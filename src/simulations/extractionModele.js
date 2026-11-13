// Modèle de l'extraction liquide-liquide (1G, ampoule à décanter) : miscibilité, densité, position des phases.
export const RHO_EAU = 1.00; // g/mL
// d = densité par rapport à l'eau ; miscible = avec l'eau
export const SOLVANTS = {
  eau: { nom: 'eau', d: 1.00, miscible: true, c: '#bfdbfe' },
  cyclohexane: { nom: 'cyclohexane', d: 0.78, miscible: false, c: '#fef9c3' },
  dichloromethane: { nom: 'dichlorométhane', d: 1.33, miscible: false, c: '#fef9c3' },
  ether: { nom: 'éther diéthylique', d: 0.71, miscible: false, c: '#fef9c3' },
  ethanol: { nom: 'éthanol', d: 0.79, miscible: true, c: '#fef9c3' },
};
// solubilité (très / peu) dans l'eau et dans un solvant organique
export const SOLUTES = {
  diiode: { nom: 'diiode', eau: false, org: true, cEau: '#fde68a', cOrg: '#a855f7' },
  chlorureSodium: { nom: 'chlorure de sodium', eau: true, org: false, cEau: '#e0f2fe', cOrg: '#fef9c3' },
};
export const densite = (m, V) => (m / V) / RHO_EAU;            // m en g, V en mL
export const masseVolumique = (m, V) => m / V;
export const biphasique = s => !SOLVANTS[s].miscible;
export const phaseSuperieure = s => (!biphasique(s) ? null : (SOLVANTS[s].d < RHO_EAU ? s : 'eau'));
export const phaseInferieure = s => (!biphasique(s) ? null : (SOLVANTS[s].d < RHO_EAU ? 'eau' : s));
export const bonExtracteur = (soluteCle, s) => biphasique(s) && SOLUTES[soluteCle].org && !SOLUTES[soluteCle].eau;
// après agitation : où se trouve le soluté ? 'organique' | 'eau' | 'partout'
export const oùSoluté = (soluteCle, s) => (!biphasique(s) ? 'partout' : (SOLUTES[soluteCle].org && !SOLUTES[soluteCle].eau ? 'organique' : 'eau'));

// Efficacité de l'extraction : coefficient de partage K = [soluté]organique / [soluté]eau (valeurs illustratives, non au programme de 1G).
export const K_DIIODE = { cyclohexane: 8, dichloromethane: 15, ether: 25 };
// fraction restant dans l'eau après n extractions successives avec Vtot/n d'extractant chacune
export const fractionRestante = (K, Veau, Vtot, n) => Math.pow(1 / (1 + K * (Vtot / n) / Veau), n);
export const fractionExtraite = (K, Veau, Vtot, n) => 1 - fractionRestante(K, Veau, Vtot, n);
