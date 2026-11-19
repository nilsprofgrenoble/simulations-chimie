// QCM du parcours guidé de la simulation « Combustions » (sim 159).
// Fichier sans React : la longueur des options est contrôlée par un script (la bonne réponse n'est jamais la plus longue).
// bonne : indice de la bonne réponse dans options (l'ordre est mélangé à l'affichage). Les mauvaises réponses sont de vraies erreurs d'élèves.
export const QCM = {
  combustibles: {
    q: 'Un combustible est un corps qui peut brûler en libérant de l’énergie. Quel lot ne contient que des combustibles usuels ?',
    options: ['le dioxygène, le butane et l’éthanol : le dioxygène alimente toute flamme, il brûle', 'le dioxyde de carbone, le bois et le butane : le CO₂ est présent dans toute flamme', 'l’eau, le bois et l’éthanol : tous les liquides peuvent finir par brûler', 'le bois, le butane et l’éthanol : ces trois corps brûlent et libèrent de l’énergie'], bonne: 3,
    expl: 'Le bois, le butane (gaz de réchaud) et l’éthanol (alcool à brûler) sont des combustibles usuels. Le dioxygène est le comburant : il permet la combustion mais ne brûle pas. Le dioxyde de carbone et l’eau sont des produits de combustion : ils ne peuvent plus brûler.',
    indice: 'Un combustible brûle. Parmi ces corps, lesquels sont déjà le résultat d’une combustion, ou servent seulement à la faire fonctionner ?' },
  incomplete: {
    q: 'Au bec B, la flamme est jaune et dépose de la suie noire sur la capsule. Quelle explication est la bonne ?',
    options: ['un excès de dioxygène : la combustion est plus vive, elle forme alors du carbone C en plus', 'le manque de dioxygène : la combustion est incomplète, elle forme du carbone C et du CO', 'un gaz impur : la suie vient de poussières, la combustion reste tout de même complète', 'une température trop haute : le CO₂ formé se transforme ensuite en suie dans la flamme'], bonne: 1,
    expl: 'Avec peu de dioxygène, la combustion est incomplète : au lieu de CO₂, il se forme du carbone C (la suie, qui rend la flamme jaune) et du monoxyde de carbone CO, gaz toxique. Avec assez de dioxygène (bec A), la combustion est complète et ne donne que du CO₂ et de la vapeur d’eau H₂O.',
    indice: 'Pour brûler entièrement, le combustible a besoin de dioxygène. Que forme-t-il quand le carbone n’en trouve pas assez pour devenir du CO₂ ?' },
  propane: {
    q: 'Quelle est l’équation équilibrée de la combustion complète du propane C₃H₈ ?',
    options: ['C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O : on équilibre C, puis H, puis O en dernier', 'C₃H₈ + 3 O₂ → 3 CO₂ + 4 H₂O : on met un O₂ pour chaque atome de carbone', 'C₃H₈ + 5 O₂ → 3 CO₂ + 8 H₂O : on garde les 8 atomes H, un H₂O pour chacun', 'C₃H₈ + 10 O₂ → 3 CO₂ + 4 H₂O : on compte les 10 atomes O, un par O₂'], bonne: 0,
    expl: 'C : 3 atomes dans C₃H₈, donc 3 CO₂. H : 8 atomes, donc 4 H₂O (chaque H₂O contient 2 H). O : 3 × 2 + 4 × 1 = 10 atomes à droite, donc 5 O₂ (chaque O₂ contient 2 atomes O). Vérification : 10 atomes O de chaque côté.',
    indice: 'Équilibrez dans l’ordre C, H, O. Une molécule H₂O contient 2 atomes H ; une molécule O₂ contient 2 atomes O.' },
  ethanol: {
    q: 'Quelle est l’équation équilibrée de la combustion complète de l’éthanol C₂H₅OH ?',
    options: ['C₂H₅OH + 3½ O₂ → 2 CO₂ + 3 H₂O : comme un alcane, 7 atomes O à droite', 'C₂H₅OH + 2 O₂ → 2 CO₂ + 3 H₂O : un O₂ pour chaque carbone de l’éthanol', 'C₂H₅OH + 3 O₂ → 2 CO₂ + 3 H₂O : l’éthanol a déjà un atome O en propre', 'C₂H₅OH + 7 O₂ → 2 CO₂ + 3 H₂O : 7 atomes O à droite, un par molécule O₂'], bonne: 2,
    expl: 'C : 2 CO₂. H : 6 atomes (5 + 1 dans OH), donc 3 H₂O. O : 2 × 2 + 3 = 7 atomes à droite ; l’éthanol en apporte déjà 1 à gauche, il en reste 6 à fournir, soit 3 O₂. Vérification : 1 + 6 = 7 atomes O de chaque côté. Dans un alcool, l’oxygène de la molécule compte.',
    indice: 'Comptez les atomes O à droite, puis retranchez celui que contient déjà la molécule d’éthanol : le reste vient de O₂.' },
  rompreFormer: {
    q: 'Quelle affirmation est correcte pour les liaisons entre atomes lors d’une réaction chimique ?',
    options: ['rompre une liaison libère de l’énergie, en former une en demande', 'rompre une liaison demande de l’énergie, en former en libère', 'rompre et former une liaison libèrent chacune de l’énergie', 'rompre et former une liaison demandent chacune de l’énergie'], bonne: 1,
    expl: 'Deux atomes liés se retiennent : pour les séparer, il faut fournir de l’énergie (rompre une liaison coûte). Quand des atomes se lient, l’énergie est libérée (former une liaison rapporte). C’est pourquoi on dit que l’énergie de liaison D est une énergie à fournir pour rompre 1 mol de liaisons : D est positive.',
    indice: 'Pensez à deux aimants collés : faut-il dépenser de l’énergie pour les séparer, ou en récupère-t-on ?' },
  signe: {
    q: 'Quelle conclusion tirer de ce calcul, comparé à la valeur de référence ?',
    options: ['réaction exothermique : l’estimation est proche de la référence, à environ 1 % près', 'réaction endothermique : E_r est négative, donc de l’énergie est absorbée', 'réaction exothermique : l’écart avec la référence prouve une erreur de calcul', 'réaction endothermique : l’estimation est proche de la référence, à environ 1 % près'], bonne: 0,
    expl: 'E_r < 0 : le système libère de l’énergie vers l’extérieur, la réaction est exothermique (une combustion chauffe). L’écart de 1,2 % est faible : les énergies de liaison sont des moyennes, donc le calcul donne une estimation, pas la valeur exacte ; un petit écart avec la mesure est normal.',
    indice: 'Un signe négatif signifie que le système perd de l’énergie. Un écart de quelques % entre une estimation par moyennes et une valeur mesurée est-il surprenant ?' },
  risques: {
    q: 'Dans un logement mal ventilé, une chaudière à gaz a une flamme jaune et noircit les parois. Quel est le principal risque pour les habitants ?',
    options: ['l’intoxication au dioxyde de carbone : le seul gaz toxique d’une combustion', 'un excès de dioxygène : l’air de la pièce devient alors irrespirable', 'aucun risque : une flamme jaune est seulement moins esthétique qu’une bleue', 'l’intoxication au monoxyde de carbone : gaz toxique, incolore, inodore'], bonne: 3,
    expl: 'Une flamme jaune et de la suie signalent une combustion incomplète, donc du monoxyde de carbone CO. Ce gaz est toxique, sans couleur ni odeur : on ne le détecte pas sans détecteur. Précautions : aérer, faire entretenir chaudières et chauffe-eau, ne jamais utiliser un brasero ou un groupe électrogène dans un local fermé.',
    indice: 'Rappelez-vous les produits d’une combustion incomplète. Lequel est dangereux et impossible à repérer par les sens ?' },
};
