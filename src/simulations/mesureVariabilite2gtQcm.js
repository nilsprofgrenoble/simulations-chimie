// QCM du parcours guidé de la simulation « Mesure : variabilité, histogramme, moyenne et écart-type » (2GT).
// Fichier sans React : la longueur des options est contrôlée par un script (la bonne réponse n'est jamais la plus longue).
// bonne : indice de la bonne réponse dans options.
export const QCM = {
  variabilite: {
    q: 'Pourquoi les 8 mesures ne donnent-elles pas toutes exactement la même valeur ?',
    options: ['on ne déclenche jamais le chronomètre exactement au même instant', 'la bille tombe un peu plus vite à chaque nouveau lancer', 'le chronomètre est en panne : il faut le changer', 'seule la plus grande valeur est juste : les sept autres sont fausses'], bonne: 0,
    expl: 'Aucune mesure n’est parfaitement reproductible : à la main, on déclenche et on arrête le chronomètre avec un petit décalage différent à chaque essai, alors que la chute est toujours la même. Les valeurs sont toutes un peu différentes sans qu’aucune soit « fausse ». Cette variation d’une mesure à l’autre s’appelle la variabilité.',
    indice: 'La bille et la hauteur sont les mêmes à chaque essai. Qu’est-ce qui change d’un essai à l’autre quand on chronomètre à la main ?' },
  dispersion: {
    q: 'Les deux histogrammes ont la même échelle horizontale. Quelle série est la plus dispersée ?',
    options: ['la série B', 'la série A', 'les deux, car elles ont la même moyenne', 'impossible à dire sans calculer les écarts-types'], bonne: 0,
    expl: 'Les valeurs de la série B s’étalent sur une zone bien plus large que celles de A : B est la plus dispersée. La moyenne ne renseigne pas sur la dispersion : deux séries de même moyenne peuvent être très différentes.',
    indice: 'Regardez la largeur de la zone occupée par les barres, en utilisant la même échelle de temps pour les deux séries.' },
  ecartType: {
    q: 'Un tableur donne trois écarts-types : 0,02 s, 0,05 s et 0,09 s. Quelle série a pour écart-type 0,05 s ?',
    options: ['la série A', 'la série B', 'la série C', 'impossible à dire sans refaire les calculs'], bonne: 0,
    expl: 'La série B est la plus étroite (0,02 s) et la série C la plus large (0,09 s). Il reste la série A, de largeur intermédiaire : 0,05 s. L’écart-type classe les séries comme leur largeur.',
    indice: 'Classez les trois histogrammes du plus étroit au plus large, puis classez les trois écarts-types du plus petit au plus grand.' },
  instrument: {
    q: 'On mesure chaque crayon une seule fois. Quel instrument permet de voir que deux crayons diffèrent de 0,5 mm ?',
    options: ['le pied à coulisse : sa dispersion est inférieure à 0,5 mm', 'la règle : ses valeurs sont plus dispersées, donc plus sensibles', 'n’importe lequel : l’instrument ne change pas la dispersion', 'le pied à coulisse, car il donne des valeurs plus grandes'], bonne: 0,
    expl: 'Avec le pied à coulisse, l’écart-type est d’environ 0,1 mm : une différence de 0,5 mm est bien plus grande que la variabilité de l’instrument, on la voit. Avec la règle, l’écart-type est d’environ 0,7 mm : une différence de 0,5 mm se confond avec la variabilité.',
    indice: 'Comparez l’écart de 0,5 mm entre les crayons à l’écart-type de chaque instrument. Une différence plus petite que l’écart-type se perd dans la variabilité.' },
  protocole: {
    q: 'Pourquoi la série « 10 intervalles ÷ 10 » est-elle moins dispersée que la série « un intervalle » ?',
    options: ['le retard de déclenchement à la main est le même, mais il est partagé entre 10 intervalles', 'le chronomètre est plus précis quand il mesure une durée plus longue, car ses graduations sont plus fines', 'on a fait dix fois plus de mesures dans cette série, donc l’histogramme est plus étroit', 'les gouttes tombent plus régulièrement quand on les observe longtemps'], bonne: 0,
    expl: 'Le décalage dû à la main (déclencher, arrêter) est à peu près le même pour 1 ou pour 10 intervalles. Mais pour 10 intervalles, on divise le total par 10 : le décalage est partagé entre les 10 intervalles. Les deux séries ont 20 mesures, et le chronomètre est le même.',
    indice: 'Dans chaque mesure, il y a un décalage de départ et d’arrêt à la main. Que devient ce décalage quand on divise le total par 10 ?' },
  independance: {
    q: 'Pour laquelle de ces deux séries la moyenne et l’écart-type résument-ils correctement les 20 mesures ?',
    options: ['la série A : ses points ne montrent aucune tendance', 'la série B : ses points montent régulièrement, donc elle est plus précise', 'les deux : une moyenne se calcule toujours', 'aucune : il faut d’abord trier les valeurs par ordre croissant'], bonne: 0,
    expl: 'Dans la série A, les points se répartissent au hasard autour d’une valeur : les mesures sont indépendantes. Dans la série B, les valeurs augmentent régulièrement : le mesurande change pendant la série (ici, le robinet est alimenté par une bouteille qui se vide, les gouttes s’espacent). La moyenne et l’écart-type ne décrivent plus une grandeur unique.',
    indice: 'Regardez si les points montent ou descendent au fil des mesures, ou s’ils se répartissent au hasard autour d’une valeur.' },
  nombre: {
    q: 'On refait la série avec 10 fois plus de mesures (50 au lieu de 5), avec le même chronomètre à main et le même protocole. L’écart-type de la série…',
    options: ['reste à peu près le même : le paquet garde la même largeur', 'est divisé par 10, car il y a 10 fois plus de mesures pour compenser les écarts', 'devient presque nul, puisque les écarts se compensent quand on mesure beaucoup', 'est multiplié par 10, car la série contient 10 fois plus de valeurs'], bonne: 0,
    expl: 'La largeur du paquet de mesures est due à l’instrument et au protocole : elle ne change pas quand on ajoute des mesures. Avec 50 valeurs, l’histogramme est simplement mieux rempli, donc plus facile à lire. Ce que l’on améliore en faisant plus de mesures, c’est la connaissance de la moyenne : c’est l’objet de la simulation suivante.',
    indice: 'Comparez la largeur des deux histogrammes tracés avec la même échelle : la zone occupée est-elle très différente ?' },
};
