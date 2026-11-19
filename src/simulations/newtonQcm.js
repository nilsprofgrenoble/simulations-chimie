// QCM du parcours guidé de la simulation 168 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici,
// n'est jamais la plus longue, égalité comprise ; l'affichage mélange l'ordre des choix).
export const QCM_PARCOURS = {
  centre: { options: ['la charge est lourde et à gauche : G s’en rapproche', 'G est toujours au milieu de l’objet, quelle que soit la répartition', 'G est le point où les frottements s’exercent', 'G se place du côté de la roue qui tourne le plus vite'], bonne: 0 },
  bilan: { options: ['son poids, la réaction du rail et la tension du fil', 'son poids, la réaction, la tension du fil et une force de mouvement', 'seulement la tension du fil, qui le fait avancer', 'son poids et la tension du fil : le rail n’exerce rien'], bonne: 0 },
  loi: { options: ['vers la droite, comme la somme des forces', 'dirigé vers la gauche : il s’oppose au mouvement', 'nul, puisque le chariot roule déjà', 'vertical, car il est dû au poids du chariot'], bonne: 0 },
  freinage: { options: ['vers le bas, bien que la cabine monte', 'vers le haut, comme la vitesse', 'nul, car la vitesse reste dirigée vers le haut', 'vers le haut, car le câble tire toujours vers le haut'], bonne: 0 },
  galileen: { options: ['celui de la voie, où la bille garde sa vitesse', 'celui du wagon, où la bille accélère vers l’arrière', 'les deux, car la bille se déplace dans chacun', 'aucun : une bille posée n’est soumise à aucune force'], bonne: 0 },
  terrestre: { options: ['oui, car la Terre tourne très peu en quelques secondes', 'non, la Terre tourne : aucun référentiel terrestre n’est galiléen', 'non, le chariot bouge, donc le laboratoire ne peut pas l’être', 'oui, quelle que soit la durée et le mouvement'], bonne: 0 },
};
