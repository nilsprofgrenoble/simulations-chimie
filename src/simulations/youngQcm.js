// QCM du parcours guidé de la simulation 182 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici,
// n'est jamais la plus longue ; l'affichage mélange l'ordre des choix).
export const QCM_PARCOURS = {
  dispositif: { options: [
    'elles viennent du même laser : même fréquence et même phase en S₁ et en S₂',
    'chaque trou est éclairé par sa propre lampe, choisie de la même couleur',
    'la lumière est une onde : deux faisceaux interfèrent donc toujours entre eux',
    'l’air entre la plaque et l’écran rend synchrones les deux ondes qui le traversent'], bonne: 0 },
  chemins: { options: [
    'δ = 0 : interférence constructive, frange brillante au centre',
    'δ = 0 : interférence destructive, frange sombre au centre',
    'δ = frac(λ|2) : interférence destructive, frange sombre au centre',
    'δ = a : la différence de chemin est la distance entre les deux trous'], bonne: 0 },
  nature: { options: [
    'destructive : δ = 320 nm est voisin de frac(λ|2) = 325 nm, donc M est sur une frange sombre',
    'constructive : δ = 320 nm est voisin de λ = 650 nm, donc M est sur une frange brillante',
    'constructive : δ = 320 nm n’est pas nul, donc les deux ondes sont décalées et se renforcent',
    'destructive : δ = 320 nm est inférieur à λ = 650 nm, donc les ondes sont toujours en opposition'], bonne: 0 },
  lieux: { options: [
    'x_k = k × frac(λ × D|a)',
    'x_k = k × frac(λ × a|D)',
    'x_k = k × frac(a × D|λ)',
    'x_k = k × frac(λ × D|a²)'], bonne: 0 },
  interfrange: { options: [
    'i = frac(λ × D|a), la même entre toutes les franges consécutives',
    'i = frac(λ × a|D), la même entre toutes les franges consécutives, quel que soit k',
    'i = frac(a × D|λ), la même entre toutes les franges consécutives',
    'i = frac(λ × D|a), de plus en plus grande quand k augmente'], bonne: 0 },
  pourquoi: { options: [
    'l’erreur de pointé reste la même mais pèse moins sur une grande distance',
    'les franges lointaines sont plus brillantes, donc plus faciles à pointer',
    'l’interfrange change d’une frange à l’autre : il faut en faire la moyenne',
    'la formule de l’interfrange ne s’applique qu’à plusieurs franges à la fois'], bonne: 0 },
};
