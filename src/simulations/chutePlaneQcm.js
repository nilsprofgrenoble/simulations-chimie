// QCM du parcours guidé de la simulation 269 (la bonne réponse, en tête ici, n'est jamais la plus longue). `bonne` = indice.
export const QCM = {
  acc: { options: ['(0 ; −g) : nulle à l’horizontale, g vers le bas', '(0 ; 0) : le projectile n’accélère pas en vol', '(g ; −g) : g dans chaque direction à la fois', '(−g ; 0) : l’accélération est horizontale, vers l’arrière'], bonne: 0 },
  vx: { options: ['constante : v_x = v0 cos α, sans force horizontale', 'qui diminue, car le projectile freine peu à peu', 'qui augmente, car le projectile descend en fin de vol', 'nulle dès que le projectile quitte le lanceur'], bonne: 0 },
  sommet: { options: ['v_y = 0 mais v_x ≠ 0 : vitesse horizontale', 'v = 0 : le projectile s’arrête un instant en l’air', 'v_x = 0, mais v_y ≠ 0 : la vitesse est verticale vers le haut', 'v_x = 0 et v_y = 0 : tout s’annule au sommet'], bonne: 0 },
  angle: { options: ['45°, pour un tir qui revient au sol', '90°, pour monter le plus haut possible dans l’air', '30°, car un tir plus tendu va toujours plus loin', '60°, car la portée augmente avec l’angle de tir'], bonne: 0 },
  masse: { options: ['elle est inchangée : la masse n’intervient pas', 'elle est plus courte : le projectile lourd est freiné', 'elle est plus longue : le projectile lourd est plus stable', 'elle est plus haute : le projectile lourd monte mieux'], bonne: 0 },
};
