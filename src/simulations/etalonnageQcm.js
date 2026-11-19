// QCM du parcours guidé de la simulation 136 (fichier séparé pour pouvoir contrôler par script la longueur des options : la bonne réponse, en tête ici, n'est jamais la plus longue, égalité comprise).
export const QCM_PARCOURS = {
  conductance: { options: ['elle diminue : le courant a plus de solution à traverser', 'elle augmente : il y a plus de solution entre les plaques', 'elle ne change pas : G ne dépend que de la solution', 'elle devient nulle : le courant ne passe plus du tout'], bonne: 0 },
  cellule: { options: ['le m⁻¹, car σ s’exprime en S·m⁻¹ et G en S', 'le S, comme la conductance G que l’on mesure', 'le m, comme la distance L entre les deux plaques', 'le S·m⁻¹, comme la conductivité'], bonne: 0 },
  pente: { options: ['sa pente diminue : il faut refaire l’étalonnage', 'elle reste la même : elle ne dépend que du soluté', 'sa pente augmente : G croît à même concentration', 'elle ne passe plus par l’origine'], bonne: 0 },
  limites: { options: ['la diluer d’un facteur connu, puis mesurer la solution diluée', 'prolonger la droite au-delà de 10 mmol/L : elle y reste valable', 'choisir un autre sel dont les ions conduisent mieux', 'changer de cellule pour une constante k plus petite'], bonne: 0 },
};
