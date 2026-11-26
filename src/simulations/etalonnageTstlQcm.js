// QCM du parcours guidé de la simulation 258 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici, n'est ni la plus longue ni la plus courte).
export const QCM_PARCOURS = {
  droite: { options: [
    'une droite passant par l’origine : G est proportionnelle à la concentration',
    'une droite qui ne passe pas par l’origine : G vaut déjà quelque chose à c = 0',
    'une courbe qui monte de plus en plus lentement, puis se stabilise',
    'une droite horizontale : G ne dépend pas de la concentration des ions'], bonne: 0 },
  domaine: { options: [
    'les trois plus dilués (2,0 à 10 mmol/L), seuls dans le domaine de validité',
    'les cinq : plus la gamme est étendue, plus la droite d’étalonnage est précise',
    'les deux plus concentrés, car G y est plus grande et donc mieux mesurée',
    'aucun : un étalon doit avoir exactement la concentration de la solution à doser'], bonne: 0 },
  choixF: { options: [
    'prélever 5,00 mL de X, puis compléter à 250,0 mL avec de l’eau (F = 50)',
    'prélever 10,0 mL de X et compléter à 100,0 mL avec de l’eau (F = 10)',
    'prélever 1,00 mL de X et compléter à 500,0 mL avec de l’eau distillée (F = 500)',
    'ne pas diluer X : mesurer directement sa conductance avec la cellule'], bonne: 0 },
  temperature: { options: [
    'G′ est plus grande, donc la concentration lue sur la droite est trop grande',
    'G′ est plus petite, donc la concentration lue est trop petite',
    'rien ne change : la température n’agit pas sur la conductivité d’une solution',
    'la droite se décale aussi, donc la lecture reste juste quelle que soit la température'], bonne: 0 },
};
