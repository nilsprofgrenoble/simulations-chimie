// QCM du parcours guidé de la simulation 250 (travail du poids selon le trajet, TSTL). `bonne` = indice de la bonne option.
export const QCM = {
  forces: {
    options: ['son poids et la réaction du rail, perpendiculaire au rail', 'son poids seulement, car le rail ne pousse pas le chariot', 'son poids, la réaction du rail et une force dans le sens du mouvement', 'la réaction du rail seulement, car le poids est compensé par le rail'],
    bonne: 0 },
  perp: {
    options: ['nul : la réaction est perpendiculaire à la trajectoire', 'moteur : le rail pousse le chariot vers l’avant', 'résistant : le rail retient le chariot qui roule', 'positif en descente et négatif en montée, comme le poids'],
    bonne: 0 },
  descente: {
    options: ['moteur : le poids est dirigé vers le bas, comme le déplacement du chariot', 'résistant : le poids tire le chariot vers le bas, contre le rail qui le retient', 'nul : le rail soutient le chariot pendant toute la descente du trajet', 'nul, car le chariot revient à la même énergie cinétique qu’au départ'],
    bonne: 0 },
  montee: {
    options: ['résistant : le chariot monte, à l’opposé du poids', 'moteur : le poids est toujours moteur', 'nul : la montée est compensée par le rail', 'moteur, car le chariot gagne de l’énergie potentielle'],
    bonne: 0 },
  indep: {
    options: ['inchangé : il ne dépend que des altitudes de départ et d’arrivée', 'plus grand, car le chemin parcouru par le chariot est bien plus long', 'plus petit, car le chariot passe plus bas pendant le trajet', 'nul, car le trajet n’est plus le même qu’au départ'],
    bonne: 0 },
  aller: {
    options: ['nul : l’altitude finale est égale à l’altitude initiale du chariot', 'moteur : le chariot a descendu autant qu’il a monté sur le trajet entier', 'résistant : la montée de la fin du trajet est la plus difficile', 'égal au double du travail de l’aller, car le retour s’ajoute'],
    bonne: 0 },
  frott: {
    options: ['résistant, comme à l’aller : le frottement s’oppose au mouvement', 'moteur, car le sens du mouvement s’est inversé au point d’arrivée', 'nul, car le trajet est un aller-retour qui ramène au départ', 'résistant seulement à la montée, nul à la descente'],
    bonne: 0 },
};
