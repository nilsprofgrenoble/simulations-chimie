// QCM du parcours guidé de la simulation 251 (lancer vers le haut et chute, TSTL). `bonne` = indice de la bonne option.
export const QCM = {
  epp0: {
    options: ['nulle : le point de lancement est l’origine z = 0, donc Epp = 0 J', 'égale à son énergie cinétique, car la balle est au point de départ du mouvement', 'positive : la balle est sur le point de monter, donc Epp > 0', 'négative : la balle est au point le plus bas de toute sa trajectoire'],
    bonne: 0 },
  sommet: {
    options: ['nulle : la vitesse de la balle s’annule alors, donc Ec = ½ m v² = 0 J', 'maximale, car la balle est à l’altitude la plus haute de sa trajectoire', 'égale à la moitié de sa valeur au lancement, car on est au milieu du vol', 'égale à sa valeur au lancement, car aucune force n’agit sur la balle'],
    bonne: 0 },
  conserv: {
    options: ['constante : seul le poids travaille, il convertit Ec en Epp sans perte', 'décroissante à la montée, puis croissante à la descente de la balle', 'croissante à la montée, car l’altitude de la balle augmente en permanence', 'nulle à chaque instant, car Ec et Epp sont des énergies opposées'],
    bonne: 0 },
  retour: {
    options: ['égale à v0, mais vers le bas : Ec retrouve sa valeur du lancement', 'nulle, car la balle s’arrête dès qu’elle touche le sol', 'plus grande que v0, car la balle a chuté de toute la hauteur atteinte', 'plus petite que v0, car la balle a perdu de l’énergie en montant'],
    bonne: 0 },
  frott: {
    options: ['diminue : la force de frottement de l’air a un travail résistant', 'reste constante, car le poids garde le même travail sur le vol', 'augmente à la descente, car la balle y accélère sous l’action du poids', 'diminue à la montée, puis augmente à la descente quand le poids agit'],
    bonne: 0 },
  hfrott: {
    options: ['plus petite : une partie de l’énergie cinétique est dissipée', 'identique, car seul le poids fait varier l’altitude de la balle', 'plus grande, car l’air soutient la balle pendant sa montée', 'plus petite seulement si la balle est très lourde, sinon identique'],
    bonne: 0 },
};
