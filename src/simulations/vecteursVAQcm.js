// QCM du parcours guidé de la simulation 166 (fichier séparé pour pouvoir contrôler par script la longueur des options : la bonne réponse, en tête ici, n'est jamais la plus longue, égalité comprise).
// Notation vectorielle : vec(a) s'affiche a surmonté d'une flèche.
export const QCM_PARCOURS = {
  position: { options: ['22,5 m, l’abscisse du point M_5 lue sur l’axe', '16,0 m, l’abscisse du point précédent M_4', '30,0 m, l’abscisse du point suivant M_6', '6,5 m, le déplacement entre M_4 et M_5 pendant la dernière seconde'], bonne: 0 },
  tracev: { options: ['elle augmente : les points s’écartent de plus en plus', 'elle diminue : les points se rapprochent peu à peu', 'elle reste constante : les flèches sont de même longueur', 'elle change de sens : les flèches se retournent'], bonne: 0 },
  sens: { options: ['même direction et même sens que vec(v), vers l’avant', 'même direction, mais sens opposé à vec(v)', 'perpendiculaire à vec(v), vers le haut de la figure', 'aucune : vec(a) est nul puisque la trajectoire est droite'], bonne: 0 },
  arret: { options: ['non nul : vec(v) est en train de changer de sens ici', 'nul : le palet est arrêté, donc vec(v) est nul ici', 'nul : la norme de la vitesse est minimale en M_3', 'indéterminé : il faudrait connaître la masse du palet'], bonne: 0 },
  mrua: { options: ['rectiligne uniformément accéléré : vec(a) constant, non nul', 'rectiligne uniforme : la vitesse est constante', 'rectiligne, avec une accélération qui varie dans le temps', 'circulaire, car l’accélération n’est pas nulle'], bonne: 0 },
  mru: { options: ['le vecteur nul, car vec(v) ne varie pas dans le temps', 'un vecteur non nul, de même sens que vec(v)', 'le vecteur nul, mais seulement si le chariot est arrêté', 'un vecteur non nul, perpendiculaire à vec(v)'], bonne: 0 },
};
