// QCM du parcours guidé de la simulation 139 (pH = pKa + log, prédominance, indicateur coloré). `bonne` = indice de la bonne option
// (le cadre les mélange à l'affichage). Fichier à part pour contrôler par script que la bonne réponse n'est jamais la plus longue.
export const QCM = {
  couple: {
    options: ['C₂H₅COO⁻ : il a perdu un proton', 'C₂H₅COOH₂⁺ : il a gagné un proton', 'H₃O⁺ : c’est l’espèce formée avec l’eau', 'OH⁻ : c’est la base du couple de l’eau'],
    bonne: 0 },
  egal: {
    options: ['égales : [C₂H₅COO⁻] = [C₂H₅COOH]', 'la base est plus concentrée que l’acide', 'l’acide est plus concentré que la base', 'il n’y a plus que de la base dans la solution'],
    bonne: 0 },
  inf: {
    options: ['l’acide C₂H₅COOH, car [H₃O⁺] est supérieure à Ka', 'la base C₂H₅COO⁻, car le milieu est très acide', 'aucune : les deux espèces ont la même concentration', 'aucune : il ne reste que de l’eau dans la solution'],
    bonne: 0 },
  sup: {
    options: ['la base C₂H₅COO⁻, car [H₃O⁺] est inférieure à Ka', 'l’acide C₂H₅COOH, car le milieu est presque neutre', 'aucune : les deux espèces ont la même concentration', 'aucune : l’acide a totalement disparu de l’eau'],
    bonne: 0 },
  indic: {
    options: ['HInd, forme acide : le pH est inférieur au pKa', 'Ind⁻, forme basique : la solution est colorée de façon vive', 'les deux à égalité, car la solution est jaune', 'aucune : la couleur ne dépend pas des espèces'],
    bonne: 0 },
  zone: {
    options: ['entre 4,4 et 6,4 : de pKa − 1 à pKa + 1', 'entre 0 et 5,4 : tout ce qui est acide', 'entre 5,4 et 14 : tout ce qui est basique', 'exactement à pH 5,4 : un seul point'],
    bonne: 0 },
  invar: {
    options: ['le même : le rapport frac([Ind⁻]|[HInd]) ne change pas', 'deux fois plus petit, comme l’absorbance mesurée', 'deux fois plus grand, car la solution est moins colorée', 'nul, car il ne reste presque plus d’indicateur'],
    bonne: 0 },
};
