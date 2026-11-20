// QCM du parcours guidé de la simulation « Fluide au repos : pression, force pressante et loi de Mariotte » (sim 162).
// Fichier sans React : la longueur des options et la position de la bonne réponse sont contrôlées par un script
// (la bonne réponse n'est jamais la plus longue ni la plus courte). bonne : indice de la bonne réponse dans options.
// Toutes les options d'une question suivent le même patron : « réponse : justification ».
export const QCM = {
  fluide: {
    q: "Quels sont les fluides parmi ces trois systèmes ?",
    options: ["seulement l’eau : un fluide est forcément un liquide", "l’eau et l’air : ni l’un ni l’autre n’a de forme propre", "l’air seulement : un fluide est un gaz qu’on peut comprimer", "les trois : tout ce qui est de la matière peut s’écouler"], bonne: 1,
    expl: "Un fluide n’a pas de forme propre : il s’écoule et prend la forme de son récipient. Les liquides (l’eau) et les gaz (l’air) sont des fluides. Le bloc de bois garde sa forme : ce n’est pas un fluide.",
    indice: "Quel système garde sa forme quand on change de récipient ? Et lesquels prennent la forme du verre ou du ballon ?" },
  chocs: {
    q: "Un gaz exerce une pression sur les parois du récipient qui le contient. Comment l’expliquer ?",
    options: ["les entités sont attirées par la paroi : elles s’y collent et la poussent", "les entités se repoussent entre elles : elles poussent donc sur les parois", "les entités frappent sans cesse la paroi : l’ensemble des chocs la pousse", "le poids des entités : elles s’entassent et appuient sur la paroi du bas"], bonne: 2,
    expl: "Les entités du gaz sont en agitation permanente et rebondissent sur les parois. Chaque choc pousse très peu la paroi, mais ils sont extrêmement nombreux : l’ensemble des chocs pousse sur la paroi, c’est l’origine de la pression. Le poids des entités est négligeable, et la pression s’exerce aussi sur les parois du haut et des côtés.",
    indice: "Observez les entités : que font-elles quand elles arrivent à la paroi ?" },
  temperature: {
    q: "On chauffe le gaz dans une seringue dont le piston est bloqué. Que deviennent l’agitation des entités et la pression ?",
    options: ["plus agitées, pression inchangée : le volume du gaz reste le même", "moins agitées, pression plus faible : la chaleur ralentit les entités", "plus agitées, pression plus grande : chocs plus fréquents et forts", "agitation inchangée, pression plus grande : les entités se dilatent"], bonne: 2,
    expl: "Chauffer un gaz augmente l’agitation de ses entités : elles vont plus vite, frappent la paroi plus souvent et plus fort. Le volume est fixe, donc la pression augmente. Température plus élevée = agitation plus grande.",
    indice: "Déplacez le curseur de température : comparez la longueur du déplacement des entités, le nombre de chocs orange et la position de l’aiguille." },
  volume: {
    q: "On diminue le volume du gaz, à température constante. Que devient la pression ?",
    options: ["elle augmente : plus serrées, les entités frappent plus souvent la paroi", "elle diminue : les entités ont moins de place pour bouger librement", "elle augmente : les entités vont plus vite, car on les pousse", "elle ne change pas : la température et le nombre d’entités sont les mêmes"], bonne: 0,
    expl: "Le nombre d’entités est inchangé, mais elles sont réparties dans un volume plus petit : elles sont plus serrées et frappent la paroi plus souvent. Leur agitation ne change pas, car la température est constante : la pression augmente.",
    indice: "Poussez le piston avec le curseur de volume : l’agitation change-t-elle ? Le nombre de chocs sur la paroi change-t-il ?" },
  direction: {
    q: "Quelle est la direction et le sens de la force pressante exercée par le gaz sur la paroi inclinée ?",
    options: ["parallèle à la paroi, dirigée vers le haut du récipient", "perpendiculaire à la paroi, dirigée du gaz vers la paroi", "perpendiculaire à la paroi, dirigée de la paroi vers le gaz", "verticale, dirigée vers le bas comme le poids du gaz"], bonne: 1,
    expl: "La force pressante exercée par un fluide sur une surface est perpendiculaire à cette surface, dirigée du fluide vers la surface (elle la « pousse »). Même pour une paroi inclinée, la force reste perpendiculaire à la paroi.",
    indice: "Chaque entité rebondit sur la paroi : dans quelle direction le choc pousse-t-il la paroi ? La paroi est inclinée, la force aussi." },
  proportion: {
    q: "Entre 60 mL et 30 mL, le volume est divisé par 2. D’après vos mesures, la pression est…",
    options: ["divisée par 2 : P et V varient dans le même sens", "inchangée : la température est constante, donc P ne change pas", "augmentée de 30 hPa : on ajoute à P la baisse de V (30 mL)", "multipliée par 2 : V est divisée par 2, P augmente autant"], bonne: 3,
    expl: "Dans le tableau, on passe de 1011 hPa à 2028 hPa, soit environ deux fois plus. Quand le volume est divisé par 2, la pression est multipliée par 2 : P et V varient en sens inverse.",
    indice: "Divisez la pression mesurée à 30 mL par celle mesurée à 60 mL : quel nombre trouvez-vous, à peu près ?" },
  tester: {
    q: "Les produits P × V du tableau sont presque égaux (écart inférieur à 0,5 %). Que conclure sur la loi de Mariotte ?",
    options: ["compatible avec les mesures : l’écart reste dans les incertitudes", "démentie : les produits ne sont pas rigoureusement égaux", "on ne peut rien conclure : il faudrait que P soit proportionnelle à V", "compatible seulement pour 60 mL : il faut tester un autre gaz"], bonne: 0,
    expl: "Aucune mesure n’est parfaite : la lecture du volume et la précision du capteur donnent, dans cette simulation, environ deux à trois pour cent d’incertitude sur chaque produit (estimation). Un écart inférieur à 0,5 % est plus petit : les mesures sont compatibles avec P × V = constante dans ces conditions.",
    indice: "Comparez l’écart des produits (moins de 0,5 %) à l’incertitude annoncée (environ 2 % à 3 %). Les produits sont-ils plus éloignés que ne le permettent les mesures ?" },
  reel: {
    q: "Pourquoi la canette s’écrase-t-elle ?",
    options: ["la pression extérieure augmente dans l’eau froide : elle écrase la canette", "l’air extérieur est aspiré dans la canette : il la déforme en entrant", "la pression intérieure devient faible : l’air extérieur pousse plus fort", "la vapeur condensée pèse sur le fond de la canette : son poids l’écrase"], bonne: 2,
    expl: "La vapeur d’eau qui remplissait la canette se condense : il reste très peu de gaz à l’intérieur, donc peu de chocs et une pression bien plus faible qu’à l’extérieur. La force pressante exercée par l’air extérieur est alors plus grande que celle de l’intérieur : la paroi cède vers l’intérieur. (La quantité de gaz change : la loi de Mariotte ne s’applique pas ici.)",
    indice: "Comparez la pression à l’intérieur de la canette (peu de gaz, donc peu de chocs) et celle de l’air autour : de quel côté pousse-t-on le plus ?" },
};
