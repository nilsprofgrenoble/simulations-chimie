// QCM du parcours guidé de la simulation 265 (la bonne réponse, en tête ici, n'est jamais la plus longue). `bonne` = indice.
export const QCM = {
  pente: { options: ['la vitesse du mobile, exprimée en m/s', 'la position du mobile à l’instant initial', 'la distance totale parcourue par le mobile', 'la durée totale du mouvement étudié'], bonne: 0 },
  recul: { options: ['négative : le mobile va vers les x décroissants', 'positive : le mobile se déplace vers les x croissants', 'nulle : le mobile est immobile sur l’axe', 'positive : la position x reste toujours positive'], bonne: 0 },
  courbe: { options: ['la pente augmente : la vitesse augmente avec le temps', 'la pente est constante : la vitesse est constante', 'la pente diminue : la vitesse diminue au cours du temps', 'la pente est nulle : le mobile est à l’arrêt'], bonne: 0 },
  rapproche: { options: ['elle tend vers la tangente : la vitesse moyenne tend vers la vitesse en t', 'elle devient horizontale : la vitesse moyenne tend vers zéro quand Δt diminue', 'elle reste identique : la vitesse moyenne ne change pas quand Δt diminue', 'elle devient verticale : la vitesse moyenne devient infinie quand Δt diminue'], bonne: 0 },
  sommet: { options: ['nulle : la tangente est horizontale, le mobile s’arrête un instant', 'maximale : le mobile est à sa position la plus éloignée, donc le plus rapide', 'positive : la position est la plus grande à cet instant', 'impossible à dire sans connaître l’accélération du mobile'], bonne: 0 },
};
