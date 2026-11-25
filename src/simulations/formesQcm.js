// QCM du parcours guidé de la simulation 243 (formes d'énergie stockée, TSTL). `bonne` = indice de la bonne option.
export const QCM = {
  vitesse: {
    options: ['elle est multipliée par 4, car la vitesse est élevée au carré', 'elle est multipliée par 2, car Ec est proportionnelle à la vitesse', 'elle ne change pas, car la masse du bloc reste la même', 'elle est multipliée par 8, car la vitesse est élevée au cube'],
    bonne: 0 },
  epot: {
    options: ['de l’énergie potentielle seulement, car elle est immobile', 'de l’énergie cinétique seulement, car elle est prête à tomber sous peu', 'aucune des deux : une bille immobile ne stocke rien', 'les deux à la fois, car elle est immobile mais aussi placée en hauteur'],
    bonne: 0 },
  chute: {
    options: ['l’énergie potentielle diminue et l’énergie cinétique augmente', 'l’énergie potentielle et l’énergie cinétique augmentent toutes les deux', 'les deux diminuent, car la bille perd de l’énergie en tombant', 'l’énergie potentielle augmente et l’énergie cinétique diminue'],
    bonne: 0 },
  interne: {
    options: ['dans l’énergie interne du bloc et du sol, qui chauffent', 'nulle part : l’énergie cinétique disparaît quand la vitesse devient nulle', 'dans l’énergie potentielle du bloc', 'dans l’énergie cinétique du sol, qui se met aussitôt à avancer'],
    bonne: 0 },
  chauffe: {
    options: ['l’énergie interne seule : l’eau ne bouge pas, ne monte pas', 'l’énergie cinétique : l’eau chauffe, donc elle se met en mouvement', 'l’énergie potentielle : l’eau reçoit de l’énergie en provenance du réchaud', 'aucune : une eau immobile ne stocke rien de plus'],
    bonne: 0 },
  total: {
    options: ['elle reste constante : Ec, Ep et U varient, mais leur somme non', 'elle augmente, car l’énergie cinétique augmente pendant la chute', 'elle diminue, car l’énergie interne augmente avec le frottement', 'elle est nulle, car le système n’échange rien avec l’extérieur'],
    bonne: 0 },
};
