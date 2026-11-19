// QCM du parcours guidé de la simulation 172 (fichier séparé pour contrôler par script la longueur des options :
// la bonne réponse, en tête ici, n'est ni strictement la plus longue ni systématiquement la plus courte).
// Les textes passent par avecIndices ; les formules sont écrites avec des indices Unicode.
export const QCM_PARCOURS = {
  semi: { options: ['CH₂=CH–CH₂–CH₂–CH₃', 'CH₃–CH=CH–CH₂–CH₃', 'CH₂=CH–CH₂–CH₃', 'CH₂=C(CH₃)–CH₂–CH₃'], bonne: 0 },
  cycle: { options: ['C₅H₁₀ : chaque carbone du cycle porte 2 H', 'C₅H₁₂ : comme une chaîne saturée de 5 carbones', 'C₅H₈ : le cycle compte comme une double liaison', 'C₅H₅ : chaque carbone ne porte qu’un seul H'], bonne: 0 },
  nom: { options: ['2-méthylpentane', '4-méthylpentane', '1,1-diméthylbutane', '2-éthylbutane'], bonne: 0 },
  isomeres: { options: ['seulement B', 'seulement C', 'B et C', 'ni B ni C'], bonne: 0 },
  meme: { options: ['la même molécule : seule la façon de la dessiner change', 'deux isomères : l’enchaînement des carbones est différent', 'deux molécules de formules brutes différentes', 'on ne peut pas savoir sans connaître leur nom'], bonne: 0 },
  types: { options: ['A et B', 'A et C', 'B et C', 'aucune des trois paires'], bonne: 0 },
};
