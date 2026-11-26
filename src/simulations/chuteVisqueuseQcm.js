// QCM du parcours guidé de la simulation 270 (la bonne réponse, en tête ici, n'est jamais la plus longue). `bonne` = indice.
export const QCM = {
  forces: { options: ['vers le haut ; elle augmente avec la vitesse', 'vers le bas ; elle diminue quand la vitesse augmente', 'vers le haut ; elle reste constante pendant toute la chute', 'vers le bas ; elle s’ajoute au poids et fait accélérer l’objet'], bonne: 0 },
  depart: { options: ['a = g : seul le poids agit, f = 0', 'a = 0 : le poids et le frottement se compensent déjà', 'a est plus petite que g : le frottement freine dès le départ', 'a est nulle, car l’objet n’a pas encore de vitesse'], bonne: 0 },
  transitoire: { options: ['f augmente, la somme des forces diminue : a diminue', 'f diminue, la somme des forces augmente : a augmente', 'f reste nulle, donc l’accélération garde la valeur g', 'f augmente, mais l’accélération reste égale à g jusqu’au bout'], bonne: 0 },
  permanent: { options: ['la vitesse est constante, car f = P et a = 0', 'la vitesse continue d’augmenter, car le poids est plus grand', 'la vitesse diminue peu à peu, car f devient plus grand que P', 'l’objet s’arrête, car le frottement annule la vitesse'], bonne: 0 },
  masse: { options: ['v_lim et τ sont tous deux multipliés par 2', 'v_lim est multipliée par 2, mais τ ne change pas', 'v_lim ne change pas, mais τ est multiplié par 2', 'v_lim et τ sont tous deux divisés par 2'], bonne: 0 },
  k: { options: ['v_lim et τ sont tous deux divisés par 2', 'v_lim est divisée par 2, mais τ ne change pas', 'v_lim est multipliée par 2, et τ est divisé par 2', 'v_lim et τ sont tous deux multipliés par 2'], bonne: 0 },
};
