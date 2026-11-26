// QCM du parcours guidé de la simulation 263 (flipper, TSTL). `bonne` = indice de la bonne option.
export const QCM = {
  depart: {
    options: ['uniquement cinétique : Em = Ec = ½ m v0², car z = 0', 'uniquement potentielle, car la bille va monter ensuite', 'nulle, car la bille est au niveau du sol', 'moitié cinétique, moitié potentielle'],
    bonne: 0 },
  masse: {
    options: ['la même : la masse se simplifie dans ½ m v0² = m g h', 'plus petite : la bille lourde monte moins haut', 'plus grande : la bille lourde a plus d’énergie', 'on ne peut pas savoir sans connaître l’angle de la rampe'],
    bonne: 0 },
  angle: {
    options: ['la même : elle ne dépend que de v0, pas de l’inclinaison', 'plus grande, car la rampe plus raide aide la bille à monter', 'plus petite, car la bille monte plus vite', 'plus grande, car la rampe est plus longue'],
    bonne: 0 },
  trop: {
    options: ['elle s’arrête avant le haut de la rampe, puis redescend', 'elle atteint le haut de la rampe avec une vitesse nulle', 'elle atteint le haut en allant simplement plus lentement', 'elle atteint le haut car la rampe est inclinée'],
    bonne: 0 },
  frott: {
    options: ['plus grande : une partie de l’énergie est dissipée sur la rampe', 'la même : le frottement ne change ni l’énergie ni la hauteur à atteindre', 'plus petite : le frottement aide à monter', 'plus petite, car la bille est freinée'],
    bonne: 0 },
  angfrott: {
    options: ['plus petite : chemin plus court sur la rampe, donc moins de pertes', 'plus grande : la rampe raide freine davantage la bille que la douce', 'la même : l’angle n’intervient jamais', 'plus grande : la rampe raide est plus difficile à monter'],
    bonne: 0 },
};
