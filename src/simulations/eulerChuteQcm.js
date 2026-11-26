// QCM du parcours guidé de la simulation 271 (la bonne réponse, en tête ici, n'est jamais la plus longue). `bonne` = indice.
export const QCM = {
  poussee: { options: ['vers le haut ; égale au poids du fluide déplacé', 'vers le bas ; égale au poids de l’objet entier', 'vers le haut ; égale au poids de l’objet entier', 'nulle, car le fluide est immobile autour de l’objet'], bonne: 0 },
  equation: { options: ['m dv/dt = m g − m_f g − k v', 'm dv/dt = m g + m_f g − k v (poussée ajoutée)', 'm dv/dt = m g − m_f g + k v (frottement moteur)', 'm v = m g − m_f g − k v'], bonne: 0 },
  effet: { options: ['v_lim diminue, τ ne change pas', 'v_lim et τ diminuent tous les deux', 'v_lim augmente, τ ne change pas', 'v_lim ne change pas, τ diminue'], bonne: 0 },
  formule: { options: ['v_(i+1) = v_i + a_i × Δt, avec a_i calculée avec v_i', 'v_(i+1) = a_i × Δt, car la vitesse initiale est nulle', 'v_(i+1) = v_i + v_i × Δt, quelle que soit l’accélération', 'v_(i+1) = v_i − a_i × Δt, car le frottement freine l’objet'], bonne: 0 },
  pas: { options: ['plus fidèle à la solution exacte, mais avec plus de pas à calculer', 'moins fidèle à la solution exacte, mais avec moins de pas à calculer', 'aussi fidèle à la solution exacte, car le pas n’intervient pas', 'plus fidèle à la solution exacte, avec moins de pas à calculer'], bonne: 0 },
  grand: { options: ['très imprécise : la vitesse peut dépasser v_lim et osciller', 'toujours aussi précise, car l’équation ne dépend pas de Δt', 'plus précise, car on calcule moins de pas intermédiaires', 'inutilisable, car la vitesse devient négative dès le premier pas'], bonne: 0 },
};
