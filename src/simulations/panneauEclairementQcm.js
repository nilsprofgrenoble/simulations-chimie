// QCM du parcours guidé de la simulation 229 (éclairement et distance à la source, TSTL). `bonne` = indice de la bonne option (le cadre les mélange à l'affichage).
// Fichier à part pour contrôler par script que la bonne réponse n'est jamais la plus longue ni la plus courte.
export const QCM = {
  flux: {
    options: ['seulement une petite part, car la lumière part dans tous les sens', 'la totalité des 300 W, car toute la lumière émise arrive sur le panneau', 'plus de 300 W, car la lumière se concentre en s’éloignant de la source', 'aucune puissance, car la lumière ne transporte pas d’énergie'],
    bonne: 0 },
  double: {
    options: ['il est divisé par 2, car la distance a été multipliée par 2 (proportionnalité inverse)', 'il est divisé par 4, car la lumière se répartit sur 4 fois plus de surface', 'il est multiplié par 4, car la lumière se concentre quand on s’éloigne', 'il ne change pas, car la source continue d’émettre exactement le même flux'],
    bonne: 1 },
  loi: {
    options: ['E varie comme l’inverse de d', 'E varie comme l’inverse du carré de d', 'E varie comme le carré de d', 'E diminue linéairement quand d augmente'],
    bonne: 1 },
  limite: {
    options: ['d est très grande devant les dimensions de la source et du panneau', 'la distance d est très petite devant la taille de la source et du panneau', 'le panneau est placé parallèlement aux rayons lumineux', 'la source est très puissante, quelle que soit la distance'],
    bonne: 0 },
};
