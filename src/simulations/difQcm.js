// QCM du parcours guidé de la simulation 181 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici,
// n'est jamais la plus longue, égalité comprise ; l'affichage mélange l'ordre des choix).
export const QCM_PARCOURS = {
  onde: { options: ['passe presque sans être déviée, en un faisceau de même largeur', 'repart dans toutes les directions, comme si l’ouverture était un point', 'est arrêtée par le mur, car elle ne peut pas traverser l’ouverture', 'voit sa longueur d’onde augmenter en traversant l’ouverture'], bonne: 0 },
  reduire: { options: ['s’élargit : les ondes s’étalent davantage', 'se rétrécit comme l’ouverture : le faisceau reste droit', 'ne change pas : seule l’amplitude diminue', 'est plus large pour a = 10 cm, car plus d’ondes passent'], bonne: 0 },
  lambda: { options: ['augmente : la diffraction est plus marquée', 'diminue : la diffraction est moins marquée', 'ne dépend que de a, pas de λ : il reste le même', 'est le plus grand pour la plus petite λ, comme pour la plus petite a'], bonne: 0 },
  table: { options: ['la voix à travers la porte ouverte', 'le laser sur la fente fine', 'la cuve à ondes', 'la lumière du jour à travers la porte'], bonne: 0 },
  porte: { options: ['λ du son ≈ a : il s’étale ; λ de la lumière ≪ a : elle reste droite', 'le son traverse les murs, alors que la lumière est arrêtée par eux', 'la lumière a la plus grande longueur d’onde, donc elle contourne moins', 'la fréquence du son est plus élevée que celle de la lumière, donc il passe mieux'], bonne: 0 },
  figure: { options: ['entre les centres des deux premières zones sombres, autour de la tache', 'entre les bords de la tache centrale saturée, là où elle paraît s’arrêter', 'entre les deux taches secondaires les plus brillantes de la figure', 'du bord de l’écran jusqu’au centre de la tache centrale'], bonne: 0 },
};
