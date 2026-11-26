// QCM du parcours guidé de la simulation 267 (la bonne réponse, en tête ici, n'est jamais la plus longue). `bonne` = indice.
export const QCM = {
  sens: { options: ['de l’armature + vers l’armature −', 'de l’armature − vers l’armature +', 'parallèle aux armatures, d’un bord à l’autre', 'nul entre les armatures, car il s’annule'], bonne: 0 },
  distance: { options: ['divisé par 2 : E varie comme 1/d', 'divisé par 4 : E varie comme 1/d²', 'multiplié par 2 : plus d est grande, plus E est grand', 'inchangé : E ne dépend que de U'], bonne: 0 },
  uniforme: { options: ['oui : même valeur et même sens en tout point', 'non : il augmente quand on s’approche de l’armature +', 'non : il est maximal au milieu et nul sur les armatures', 'non : il diminue quand on s’approche de l’armature −'], bonne: 0 },
  sensForce: { options: ['vers l’armature +, à l’opposé du champ', 'vers l’armature −, dans le sens du champ', 'parallèlement aux armatures, vers le haut', 'elle est nulle : la particule est trop petite'], bonne: 0 },
  double: { options: ['inchangée : les effets de q et de d se compensent', 'multipliée par 2 : la charge est doublée', 'divisée par 2 : la distance est doublée', 'multipliée par 4 : la charge et la distance comptent'], bonne: 0 },
};
