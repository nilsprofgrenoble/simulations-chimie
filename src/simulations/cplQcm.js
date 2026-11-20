// QCM du parcours guidé de la simulation 176 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici,
// n'est jamais la plus longue ni systématiquement la plus courte ; l'affichage mélange l'ordre des choix).
export const QCM_PARCOURS = {
  sens: { options: ['vers le bas, de la plaque + vers la plaque −', 'vers le haut, de la plaque − vers la plaque +', 'horizontal, dans le sens du déplacement de la particule', 'nul : les deux plaques sont isolées'], bonne: 0 },
  force: { options: ['vers le haut, sens opposé à vec(E), car q < 0', 'vers le bas, dans le sens de vec(E) comme pour toute particule', 'nulle, car la particule est au repos', 'horizontale, dans le sens du mouvement de la particule'], bonne: 0 },
  plan: { options: ['vec(a) selon Oy et vec(v)₀ selon Ox : aucun mouvement selon Oz', 'la particule est attirée par les deux plaques à la fois', 'la vitesse reste constante pendant toute la traversée des plaques', 'le champ est uniforme, donc la trajectoire est une droite dans ce plan'], bonne: 0 },
  horaires: { options: ['x(t) = v_0 × t  et  y(t) = frac(1|2) × a_y × t²', 'x(t) = frac(1|2) × a_y × t²  et  y(t) = v_0 × t', 'x(t) = v_0 × t  et  y(t) = a_y × t', 'x(t) = v_0 × t  et  y(t) = frac(1|2) × a_y × t² + v_0 × t'], bonne: 0 },
  trajectoire: { options: ['un arc de parabole : y est proportionnel à x²', 'une droite inclinée : y est proportionnel à x', 'un arc de cercle, car la force est perpendiculaire à vec(v)₀', 'une courbe qui s’éloigne de l’axe Ox de plus en plus lentement'], bonne: 0 },
  lineaire: { options: ['la vitesse augmente alors que la durée d’une alternance reste la même', 'la force électrique est de plus en plus grande dans les intervalles', 'la particule ralentit dans chaque tube et doit parcourir plus de distance', 'le champ électrique est de plus en plus faible dans les tubes'], bonne: 0 },
};
