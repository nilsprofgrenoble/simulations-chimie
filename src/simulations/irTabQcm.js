// QCM du parcours guidé de la simulation 170 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici, n'est ni la plus longue
// ni systématiquement la plus courte ; CarteParcours mélange l'ordre à l'affichage).
export const QCM_PARCOURS = {
  tableau: { options: ['aldéhyde ou cétone, et acide carboxylique', 'ester et aldéhyde ou cétone, mais pas l’acide', 'amide et acide carboxylique, mais pas la cétone', 'ester seulement, la ligne la plus haute'], bonne: 0 },
  ch: { options: ['C–H : bande fine, dans l’intervalle 2850–3000 cm⁻¹', 'O–H d’un acide : 2970 est dans l’intervalle 2500–3200', 'N–H : bande fine et de force moyenne, comme ici', 'O–H d’un alcool : bande de force moyenne, comme ici'], bonne: 0 },
  alcool: { options: ['O–H d’un alcool : large et forte, 3200 à 3700', 'C–H d’un carbone saturé : forte, entre 2850 et 3000', 'C=O d’un acide carboxylique : forte, vers 1710', 'C=O d’une cétone : forte, entre 1705 et 1740'], bonne: 0 },
  acide: { options: ['O–H d’un acide : très large, de 2500 à 3200', 'O–H d’un alcool : large et forte, 3200–3700', 'C–H d’un carbone saturé : fine, 2850–3000', 'C=O d’un acide carboxylique : fine, 1700–1725'], bonne: 0 },
  amine: { options: ['N–H : bandes fines et moyennes, pas celles de O–H', 'O–H : elles sont proches de 3300 cm⁻¹, comme un alcool', 'C–H : toutes les bandes de cette zone sont des C–H', 'N–H : larges et fortes, comme celles d’un alcool'], bonne: 0 },
  combiner: { options: ['un acide carboxylique : O–H très large avec C=O', 'un alcool : la bande O–H est la plus visible', 'une cétone : la bande C=O fine est la plus forte', 'une amine : on voit des bandes au-dessus de 3000'], bonne: 0 },
  espece: { options: ['éthanal (CH₃–CHO) : groupe C=O, sans O–H ni N–H nets', 'éthanol (CH₃–CH₂–OH) : groupe hydroxyle, bande O–H large', 'acide éthanoïque (CH₃–COOH) : C=O et O–H très large', 'éthylamine (CH₃–CH₂–NH₂) : groupe amino, bandes N–H'], bonne: 0 },
  ambigu: { options: ['ester, aldéhyde ou cétone : chercher les C–H d’aldéhyde', 'ester seulement : 1738 est dans 1735–1750, rien à chercher en plus', 'acide carboxylique ou amide : chercher une bande O–H très large', 'cétone seulement : chercher une bande C=C vers 1650'], bonne: 0 },
  suivi: { options: ['plus de bande O–H ; la bande C=O reste, vers 1740 cm⁻¹', 'une bande O–H large apparaît, vers 3300 cm⁻¹', 'la bande C=O disparaît : l’ester ne contient plus de C=O', 'aucun changement : réactifs et ester ont les mêmes liaisons'], bonne: 0 },
  conclure: { options: ['O–H disparue, C=O décalée : un ester s’est formé', 'C=O disparue : la réaction n’a pas eu lieu du tout', 'C=O toujours présente : le produit est encore de l’acide', 'une bande O–H est apparue : l’alcool est formé'], bonne: 0 },
};
