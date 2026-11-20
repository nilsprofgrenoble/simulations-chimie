// QCM du parcours guidé de la simulation 184 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici,
// n'est jamais la plus longue, égalité comprise ; l'affichage mélange l'ordre des choix).
export const QCM_PARCOURS = {
  isotopes: { options: ['6 protons et 8 neutrons (A = 14)', '7 protons et 5 neutrons (A = 12, comme le carbone 12)', '7 protons et 7 neutrons (A = 14)', '5 protons et 7 neutrons (A = 12)'], bonne: 0 },
  diagramme: { options: ['une ligne horizontale : Z est constant', 'une colonne verticale : N est constant', 'une diagonale descendante : A est constant', 'la diagonale ascendante : N = Z'], bonne: 0 },
  conservation: { options: ['le nombre de nucléons A et la charge électrique, donc Z', 'le nombre de protons Z et le nombre de neutrons N, chacun séparément', 'uniquement le nombre de neutrons N', 'le nombre de noyaux : un noyau père donne toujours un seul noyau'], bonne: 0 },
  alpha: { options: ['A = 222 et Z = 86 : on retranche 4 et 2', 'A = 222 et Z = 88 : seul A diminue, le noyau garde Z', 'A = 230 et Z = 90 : on ajoute 4 et 2', 'A = 226 et Z = 86 : A ne change pas, seul Z diminue'], bonne: 0 },
  position: { options: ['β⁻ : une case vers la gauche et une case vers le haut', 'β⁺ : une case vers la droite et une case vers le bas', 'α : deux cases vers la gauche et deux cases vers le bas', 'γ : le noyau ne se déplace pas dans le diagramme'], bonne: 0 },
  particule: { options: ['un positon (A = 0, Z = +1) : radioactivité β⁺', 'un électron (A = 0, Z = −1) : radioactivité β⁻', 'un noyau d’hélium (A = 4, Z = 2) : radioactivité α', 'un photon γ (A = 0, Z = 0) : émission γ'], bonne: 0 },
};
