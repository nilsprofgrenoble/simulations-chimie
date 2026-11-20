// QCM du parcours guidé de la simulation 210 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici,
// n'est jamais la plus longue, égalité comprise ; l'affichage mélange l'ordre des choix).
export const QCM_PARCOURS = {
  lire: { options: ['le groupe –OH devient C=O, la chaîne carbonée est inchangée', 'le groupe –OH devient C=O et un atome de carbone est ajouté à la chaîne', 'le groupe –OH est conservé et un groupe C=O s’ajoute en bout de chaîne', 'le groupe –OH est réduit en alcane, la chaîne carbonée est inchangée'], bonne: 0 },
  type: { options: ['en R5, HO⁻ capte un ion H⁺ ; en R7, il remplace l’atome Br', 'en R5, HO⁻ remplace le groupe –OH ; en R7, il capte un ion H⁺', 'les deux sont acide-base, car HO⁻ est une base dans les deux cas', 'R5 est une oxydo-réduction, car HO⁻ est un réactif ; R7 est une substitution'], bonne: 0 },
  fragile: { options: ['les deux groupes sont réduits : on n’obtient pas la cible', 'seul l’ester est réduit, donc la cible est obtenue directement', 'seule la cétone est réduite, l’ester reste intact', 'aucune réaction : LiAlH₄ n’attaque ni l’ester ni la cétone'], bonne: 0 },
  ident: { options: ['protection : étape 1 ; déprotection : étape 3', 'protection : étape 2 (LiAlH₄) ; déprotection : étape 3', 'protection : étape 1 ; déprotection : étape 2 (LiAlH₄)', 'aucune : les trois étapes modifient la molécule de la même façon'], bonne: 0 },
  amelio: { options: ['remplacer le dichromate par l’air et un catalyseur, à 30 °C', 'garder le dichromate, mais chauffer moins longtemps pour réduire la durée', 'garder le dichromate et récupérer l’eau du milieu par distillation', 'remplacer l’eau par un solvant organique moins polaire, plus facile à recycler'], bonne: 0 },
};
