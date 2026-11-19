// QCM du parcours guidé de la simulation 138 (Acide faible : α, Ka, pKa). Dans un fichier à part pour pouvoir contrôler par script
// que la bonne réponse n'est jamais la plus longue (voir scripts de contrôle). `bonne` = indice de la bonne option.
export const QCM = {
  fort: {
    options: ['presque plus rien : HBr a quasiment tout réagi avec l’eau', 'la moitié : la réaction s’arrête quand les deux sens se compensent', 'presque tout : HBr ne réagit presque pas avec l’eau', 'cela dépend de la concentration C₀ que l’on a choisie'],
    bonne: 0 },
  faible: {
    options: ['faible : le pH est supérieur à −log C₀, la réaction est limitée', 'fort : le pH est supérieur à 0, donc la réaction est totale', 'faible : le pH est inférieur à −log C₀, donc peu d’ions H₃O⁺ sont formés', 'indécidable : il faudrait d’abord connaître le pKa de l’acide'],
    bonne: 0 },
  dilu: {
    options: ['augmente : une plus grande part des molécules réagit', 'diminue : il y a moins de molécules à transformer', 'ne change pas : α ne dépend que de l’acide choisi', 'devient égal à 1 : l’acide dilué se comporte en acide fort'],
    bonne: 0 },
  kadef: {
    options: ['C₆H₅COOH + H₂O ⇌ C₆H₅COO⁻ + H₃O⁺', 'C₆H₅COO⁻ + H₂O ⇌ C₆H₅COOH + HO⁻ (réaction de la base)', '2 H₂O ⇌ H₃O⁺ + HO⁻ (l’eau avec elle-même)', 'C₆H₅COOH + HO⁻ → C₆H₅COO⁻ + H₂O (avec une base forte)'],
    bonne: 0 },
  kaconst: {
    options: ['Ka reste constant (propriété du couple) ; α augmente', 'Ka et α augmentent tous les deux quand on dilue', 'Ka augmente quand on dilue ; α reste constant', 'Ka et α restent tous les deux constants quand on dilue'],
    bonne: 0 },
  compar: {
    options: ['inférieur à 0,076 : pKa plus grand, acide plus faible', 'compris entre 0,076 et 0,30, car son pKa est intermédiaire', 'supérieur à 0,30, car son pKa est le plus élevé des trois', 'égal à 0,076, car la concentration C₀ est la même'],
    bonne: 0 },
};
