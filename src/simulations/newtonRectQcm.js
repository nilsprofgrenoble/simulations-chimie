// QCM du parcours guidé de la simulation 268 (la bonne réponse, en tête ici, n'est jamais la plus longue). `bonne` = indice.
export const QCM = {
  reaction: { options: ['20 N, vers le haut : elle compense le poids', '20 N, vers le bas, comme le poids', 'nulle : le rail ne fait que soutenir le chariot', '40 N, vers le haut, pour le soutenir aussi'], bonne: 0 },
  uniforme: { options: ['6 N, vers l’arrière, car la somme des forces est nulle', '0 N : un frottement n’existe que si le chariot accélère', '6 N, vers l’avant, dans le sens du mouvement', '12 N, vers l’arrière, car il faut doubler la poussée'], bonne: 0 },
  masse: { options: ['divisée par 2 : a = ΣF ÷ m', 'multipliée par 2 : un objet plus lourd accélère plus', 'inchangée : la somme des forces ne change pas', 'divisée par 4 : a varie comme 1/m²'], bonne: 0 },
  arret: { options: ['sa vitesse diminue jusqu’à s’annuler', 'sa vitesse reste constante : plus aucune poussée', 'sa vitesse augmente, car le frottement l’entraîne', 'il s’arrête immédiatement, sans transition'], bonne: 0 },
  inertie: { options: ['non : il peut aussi avancer à vitesse constante', 'oui : sans force, tout objet finit par s’arrêter', 'oui : un objet en mouvement a toujours une force qui le pousse', 'non : il est alors en train d’accélérer légèrement'], bonne: 0 },
  reciproque: { options: ['10 N, vers la gauche, exercée par le chariot', '0 N : les deux forces se compensent sur le chariot', '10 N, vers la droite, comme la poussée du moteur', 'plus de 10 N, car le chariot est plus lourd que le moteur'], bonne: 0 },
};
