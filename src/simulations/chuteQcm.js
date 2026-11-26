// QCM du parcours guidé de la simulation 261 (chute d'une hauteur h, TSTL). `bonne` = indice de la bonne option.
export const QCM = {
  depart: {
    options: ['nulle : l’objet est lâché sans vitesse initiale (v = 0)', 'égale à son énergie potentielle de pesanteur, car l’objet est en hauteur', 'maximale, car l’objet est tout en haut de la rampe', 'impossible à connaître sans la masse de l’objet'],
    bonne: 0 },
  conserv: {
    options: ['égale à l’énergie potentielle de pesanteur qu’il avait au départ', 'nulle, car l’objet arrive au sol à l’altitude z = 0', 'égale à la moitié de l’énergie potentielle du départ', 'plus grande que l’énergie potentielle du départ, car l’objet accélère'],
    bonne: 0 },
  masse: {
    options: ['ne dépend pas de la masse : m se simplifie dans m g h = ½ m v²', 'est plus grande pour l’objet le plus lourd, qui a plus d’énergie potentielle', 'est plus petite pour l’objet le plus lourd, qui est plus difficile à accélérer'],
    bonne: 0 },
  forme: {
    options: ['est la même : seule la hauteur h compte, pas la forme du trajet', 'est plus grande sur la rampe la plus longue, qui laisse plus de temps pour accélérer', 'est plus grande sur la rampe la plus courte, car elle est plus raide'],
    bonne: 0 },
  hauteur: {
    options: ['2 fois plus grande : v est proportionnelle à la racine carrée de h', '4 fois plus grande, car la hauteur a été multipliée par 4', 'identique : la vitesse ne dépend pas de la hauteur de départ', '16 fois plus grande, car l’énergie cinétique est proportionnelle à v²'],
    bonne: 0 },
  frott: {
    options: ['plus petite : le frottement dissipe de l’énergie du départ', 'identique : le frottement n’agit qu’à la fin du trajet', 'plus grande : le frottement aide l’objet à glisser plus vite'],
    bonne: 0 },
};
