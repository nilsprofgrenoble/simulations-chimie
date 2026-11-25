// QCM du parcours guidé de la simulation 231 (batterie, TSTL). `bonne` = indice de la bonne option.
export const QCM = {
  reservoir: {
    options: ['l’énergie chimique stockée diminue et passe à la lampe par le courant électrique', 'la batterie fabrique de l’énergie à partir de rien, donc elle ne s’use jamais, même longtemps', 'l’énergie chimique stockée reste exactement la même, car l’énergie se conserve toujours', 'la batterie perd de l’énergie, qui disparaît complètement dans la lampe'],
    bonne: 0 },
  fiche: {
    options: ['la capacité de la batterie, en ampères-heures (Ah), qui mesure la charge stockée', 'la tension nominale en volts (V), qui mesure la quantité d’électricité stockée', 'le courant de décharge maximal en ampères (A), qui est la quantité d’électricité stockée', 'la masse en kg, qui est proportionnelle à la quantité d’électricité'],
    bonne: 0 },
  double: {
    options: ['elle est divisée par 2, car l’intensité du courant demandé est multipliée par 2', 'elle ne change pas, car la batterie contient toujours la même énergie, quelle que soit la lampe', 'elle est multipliée par 2, car une lampe plus puissante dure plus longtemps', 'elle est divisée par 4, car la puissance intervient au carré dans la durée'],
    bonne: 0 },
  compare: {
    options: ['la batterie de 12 V, 7,0 Ah : le produit de sa capacité par sa tension est le plus grand', 'la batterie de 3,7 V, 10 Ah, car sa capacité en ampères-heures est la plus grande des deux batteries', 'les deux stockent la même énergie, car la capacité et la tension se compensent toujours', 'on ne peut pas les comparer, car les tensions et les unités sont différentes'],
    bonne: 0 },
};
