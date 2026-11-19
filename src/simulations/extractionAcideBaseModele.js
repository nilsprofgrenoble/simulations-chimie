// Modèle de la simulation 143 : extraction acide-base (TSTL, PCM, séquence 2).
// Une espèce acide ou basique existe sous deux formes : la forme NEUTRE (HA ou B), soluble dans le solvant organique, et la forme IONIQUE (A⁻ ou BH⁺), qui reste dans l'eau.
// Coefficient de partage de la forme neutre : K = [forme neutre]org / [forme neutre]aq (valeur donnée, indépendante du pH, à 25 °C).
// Distribution du composé (toutes formes) : D = K × α, où α est la fraction de la forme neutre dans l'eau, qui dépend du pH et du pKa.
// Fraction extraite en un contact avec r = Vorg / Vaq : E = D r / (1 + D r). Après n contacts avec du solvant neuf : reste = (1 / (1 + D r))^n.
// Hypothèses : l'espèce ionique ne passe pas du tout en phase organique ; solvants non miscibles ; activités ≈ concentrations ; le pH de la phase aqueuse est imposé et ne change pas ; équilibres atteints.

export const ESPECES = {
  benz:    { id: 'benz', nom: 'acide benzoïque', type: 'acide', pKa: 4.2, K: 20, neutre: 'HA', ion: 'A⁻' },
  phenol:  { id: 'phenol', nom: 'phénol', type: 'acide', pKa: 10.0, K: 30, neutre: 'HA', ion: 'A⁻' },
  aniline: { id: 'aniline', nom: 'aniline', type: 'base', pKa: 4.6, K: 25, neutre: 'B', ion: 'BH⁺' },
  tea:     { id: 'tea', nom: 'triéthylamine', type: 'base', pKa: 10.7, K: 40, neutre: 'B', ion: 'BH⁺' },
};
export const IDS_ESP = ['benz', 'phenol', 'aniline', 'tea'];
export const NEUTRE = { id: 'neutre', nom: 'composé neutre', type: 'neutre', K: 50 };

export const arrondiCS = (x, n = 2) => (x === 0 ? 0 : Number(Number(x).toPrecision(n)));

// fraction de la forme neutre dans la phase aqueuse (HA pour un acide, B pour une base)
export function alpha(e, pH) {
  if (e.type === 'neutre') return 1;
  return e.type === 'acide' ? 1 / (1 + 10 ** (pH - e.pKa)) : 1 / (1 + 10 ** (e.pKa - pH));
}
// rapport [forme ionique] / [forme neutre] : 10^(pH − pKa) pour un acide, 10^(pKa − pH) pour une base
export const rapportIon = (e, pH) => (e.type === 'acide' ? 10 ** (pH - e.pKa) : 10 ** (e.pKa - pH));
export const formeDominante = (e, pH) => (pH === e.pKa ? 'egal' : (alpha(e, pH) > 0.5 ? 'neutre' : 'ion'));
export const distribution = (e, pH) => e.K * alpha(e, pH);
export const fractionExtraite = (D, r = 1) => (D * r) / (1 + D * r);
export const fractionAq = (D, r = 1) => 1 / (1 + D * r);
export const resteApres = (D, r, n) => fractionAq(D, r) ** n;
export const nomForme = (e, neutre) => (neutre ? e.neutre : e.ion);

// pH le plus bas / haut pour atteindre une fraction extraite visée : α ≥ E / (1 − E) / (K r)
export function pHPourExtraction(e, E, r = 1) {
  const aMin = (E / (1 - E)) / (e.K * r);
  if (aMin >= 1) return null;
  const x = 1 / aMin - 1; // = 10^(±(pH − pKa))
  return e.type === 'acide' ? e.pKa + Math.log10(x) : e.pKa - Math.log10(x);
}

export const PH_MIL = [1, 2, 4, 6, 8, 10, 12];
export const PH_ENS = Array.from({ length: 27 }, (_, i) => i * 0.5 + 1); // 1 à 14
export const RATIOS = [0.5, 1, 2];

// valeurs fixes du parcours guidé
export const PARCOURS = { Corg: 0.060, Caq: 0.0030, pHion: 12, pHneutre: 2, pH1: 3.2, esp: 'benz', Kbenz: 20, pHbase: 10, pHmel: 12 };

// tirages des défis (données arrondies avant le calcul de la réponse)
const choisir = (t, alea) => t[Math.min(t.length - 1, Math.floor(alea() * t.length))];
const OFF_ACIDE = [-2.5, -2, -1.5, -1, -0.5, 0, 0.5], OFF_BASE = [-0.5, 0, 0.5, 1, 1.5, 2, 2.5];
export function tirageExtraction(alea = Math.random) {
  const e = ESPECES[choisir(IDS_ESP, alea)], off = choisir(e.type === 'acide' ? OFF_ACIDE : OFF_BASE, alea), pH = Math.round((e.pKa + off) * 10) / 10, r = choisir(RATIOS, alea);
  const al = arrondiCS(alpha(e, pH), 2), D = arrondiCS(e.K * al, 2), E = arrondiCS(100 * fractionExtraite(D, r), 3);
  return { type: 'extraction', e, pH, r, alpha: al, D, E };
}
export function tiragePasses(alea = Math.random) {
  const e = ESPECES[choisir(IDS_ESP, alea)], off = choisir(e.type === 'acide' ? OFF_ACIDE.slice(0, 6) : OFF_BASE.slice(1), alea), pH = Math.round((e.pKa + off) * 10) / 10, r = choisir(RATIOS, alea), n = choisir([2, 3], alea);
  const al = arrondiCS(alpha(e, pH), 2), D = arrondiCS(e.K * al, 2), reste = arrondiCS(100 * resteApres(D, r, n), 2), unique = arrondiCS(100 * fractionAq(D, r), 2);
  return { type: 'passes', e, pH, r, n, alpha: al, D, reste, unique };
}
