// QCM du parcours guidé de la simulation 292 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici, n'est ni la plus longue ni la plus courte).
export const QCM_PARCOURS = {
  esh: { options: [
    'la différence E(couple) − E(ESH), soit E(couple) puisque E(ESH) = 0 V',
    'le potentiel absolu du couple, qui ne dépend d’aucune référence choisie',
    'le potentiel de l’ESH, qui change avec le couple placé à droite de la pile',
    'l’intensité du courant dans le fil du voltmètre'], bonne: 0 },
  zinc: { options: [
    'Zn est un réducteur plus fort que H₂ : il cède plus facilement ses électrons',
    'Zn²⁺ est un oxydant plus fort que H⁺ : il capte plus facilement des électrons',
    'le zinc ne peut jamais réagir, car son potentiel standard est négatif',
    'les ions Zn²⁺ sont toujours moins nombreux que les ions H⁺ en solution'], bonne: 0 },
  predire: { options: [
    'elle diminue : [Cu²⁺] baisse, donc le log du quotient devient plus négatif',
    'elle augmente : une solution plus diluée est un oxydant bien plus puissant que l’autre',
    'elle ne change pas : le couple garde son potentiel standard à toute concentration donnée',
    'elle s’annule : sans ions, aucune tension ne peut être mesurée'], bonne: 0 },
  ph: { options: [
    'E diminue : H⁺ est du côté oxydant, donc moins de H⁺ abaisse E',
    'E augmente : moins de H⁺ rend l’oxydant MnO₄⁻ plus puissant',
    'E ne change pas : H⁺ n’est pas une espèce du couple, il n’intervient pas',
    'E s’annule dès que le pH dépasse 1, car la réaction s’arrête'], bonne: 0 },
};
