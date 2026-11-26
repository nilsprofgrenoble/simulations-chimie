// QCM du parcours guidé de la simulation 262 (looping, TSTL). `bonne` = indice de la bonne option.
export const QCM = {
  depart: {
    options: ['entièrement potentielle : Em = Epp = m g H, car Ec = 0', 'entièrement cinétique, car le wagon va bientôt descendre', 'nulle, car le wagon est immobile au départ', 'moitié potentielle, moitié cinétique'],
    bonne: 0 },
  sommet: {
    options: ['z = 2 R : un diamètre au-dessus du point bas', 'z = R : le sommet est au rayon du cercle', 'z = π R : c’est la moitié de la longueur du cercle', 'z = H : le wagon revient à sa hauteur de départ'],
    bonne: 0 },
  masse: {
    options: ['la même : la masse se simplifie dans la conservation de l’énergie', 'plus grande, car le wagon lourd a plus d’énergie potentielle au départ', 'plus petite, car un wagon lourd est plus difficile à accélérer'],
    bonne: 0 },
  contact: {
    options: ['il reste en contact : sa vitesse au sommet dépasse la vitesse minimale', 'il décroche : sa vitesse au sommet est inférieure à la vitesse minimale', 'on ne peut pas savoir sans connaître la masse du wagon', 'il reste en contact seulement si le looping est très grand'],
    bonne: 0 },
  trop: {
    options: ['il décroche avant le sommet : l’énergie ne suffit pas pour arriver assez vite', 'il passe quand même, avec une vitesse nulle au sommet', 'il passe, mais plus lentement que le wagon lâché de 10 m', 'il passe : le looping est toujours franchi si le wagon part de plus haut que le sommet'],
    bonne: 0 },
  frott: {
    options: ['plus haut : une partie de l’énergie est dissipée avant le sommet', 'à la même hauteur : le frottement ne change pas la vitesse minimale', 'moins haut : le frottement retient le wagon contre le rail', 'à une hauteur qui ne dépend plus du rayon du looping'],
    bonne: 0 },
};
