// QCM du parcours guidé de la simulation 130 (fichier séparé pour pouvoir contrôler par script la longueur des options : la bonne réponse, en tête ici, n'est jamais la plus longue).
export const QCM_PARCOURS = {
  pred: { options: ['CH₃COOH : le rapport frac([A⁻]|[AH]) est inférieur à 1', 'CH₃COO⁻ : plus le pH est bas, plus la base domine', 'les deux formes : elles sont toujours en proportions égales', 'aucune des deux : le couple n’existe qu’à pH = pK_A'], bonne: 0 },
  dist: { options: ['pH = 4,76 : le pK_A, à 50 % de chaque forme', 'pH = 7,00 : le pH de l’eau pure, qui est neutre', 'pH = 5,76 : le pH de la solution étudiée plus haut', 'pH = 14 : là où la forme basique atteint 100 %'], bonne: 0 },
  couple: { options: ['NH₄⁺ : le pH 7,0 est inférieur à pK_A = 9,20', 'NH₃ : à pH neutre, c’est la forme basique qui domine', 'NH₃ : son pK_A est supérieur à celui de l’éthanoïque', 'les deux : à pH 7,0 elles sont en quantités égales'], bonne: 0 },
  indic: { options: ['bleue : le pH 10 dépasse le pK_A, donc In⁻ domine', 'jaune : un milieu basique favorise la forme HIn', 'verte : à pH 10 les deux formes sont en mélange', 'incolore : le pH est trop élevé pour voir l’indicateur'], bonne: 0 },
  choix: { options: ['le bleu de thymol : 8,7 est dans sa zone de virage', 'le bleu de bromothymol : sa zone est autour du pH neutre', 'le jaune de méthyle : il vire pour un pH acide', 'le jaune d’alizarine : il vire pour un pH très basique'], bonne: 0 },
};
