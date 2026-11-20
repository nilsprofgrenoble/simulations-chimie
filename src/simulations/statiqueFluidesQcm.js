// QCM du parcours guidé de la simulation « Statique des fluides : pression et profondeur » (sim 163).
// Fichier sans React : la longueur des options et la position de la bonne réponse sont contrôlées par un script.
// Toutes les options d'une question suivent le même patron « réponse : justification ». bonne : indice de la bonne réponse dans options.
// La place de la bonne réponse APRÈS le mélange de CarteParcours (ordreOptions, graine = indice d'étape) est répartie : voir /tmp/c163_/ordre.mjs.
export const QCM = {
  tableau: {   // étape d'indice 1
    q: 'La profondeur augmente de 2 m à chaque ligne du tableau. Que fait la pression ?',
    options: [
      'P double quand la profondeur double : la pression est proportionnelle à la profondeur',
      'P augmente de plus en plus vite : les écarts entre lignes grandissent',
      'P ne change pas : l’atmosphère impose la même pression partout',
      'P augmente de la même valeur à chaque ligne : les écarts sont égaux'], bonne: 3,
    expl: 'Les écarts sont à peu près égaux (environ 196 hPa tous les 2 m) : la pression augmente régulièrement avec la profondeur. Elle ne double pas (1 013 hPa à la surface, 1 209 hPa à 2 m) : à la surface, la pression de l’atmosphère est déjà présente.',
    indice: 'Calculez la différence entre deux lignes voisines du tableau : trouve-t-on la même valeur à chaque fois ?' },
  relation: {  // étape d'indice 2
    q: 'Sur le schéma, le point B est plus bas que le point A. Que dit la relation fournie de P_B par rapport à P_A ?',
    options: [
      'P_B < P_A : z_B est plus petit que z_A, donc le résultat est négatif',
      'P_B > P_A : z_A − z_B est positif, car A est situé plus haut que B',
      'P_B = P_A : les deux points sont dans le même liquide au repos',
      'impossible à dire : le signe dépend de la valeur de ρ et de g'], bonne: 1,
    expl: 'z_A − z_B est positif quand A est au-dessus de B (axe z vers le haut), donc P_B − P_A = ρ·g·(z_A − z_B) est positif : P_B > P_A. Plus on descend, plus la pression est grande. Attention à l’ordre dans la parenthèse : z_A − z_B, et non z_B − z_A.',
    indice: 'Avec un axe vers le haut, le point le plus haut a le plus grand z. Quel est le signe de z_A − z_B quand A est au-dessus de B ?' },
  ordre: {     // étape d'indice 6
    q: 'Un plongeur est à 30 m de profondeur dans la mer. Quel est l’ordre de grandeur de la pression absolue qu’il subit ?',
    options: [
      '3 bar : ce sont les bars dus aux 30 m d’eau, l’atmosphère est comptée à part',
      '31 bar : environ 1 bar de plus pour chaque mètre de profondeur',
      '4 bar : 1 bar de l’atmosphère et environ 3 bar dus aux 30 m d’eau',
      '2 bar : 1 bar de l’atmosphère et 1 bar pour les 10 premiers mètres'], bonne: 2,
    expl: 'ρ·g·h ≈ 1 000 × 9,81 × 30 ≈ 2,9 × 10⁵ Pa, soit environ 3 bar (1 bar = 10⁵ Pa), à ajouter à la pression atmosphérique d’environ 1 bar : on trouve environ 4 bar. Règle pratique : environ 1 bar de plus tous les 10 m d’eau.',
    indice: 'Calculez ρ·g·h pour h = 30 m (1 bar = 10⁵ Pa), puis ajoutez la pression de l’atmosphère (environ 1 bar).' },
  niveau: {    // étape d'indice 7
    q: 'Les points A, B et C sont à la même profondeur dans le même liquide au repos. Comment se comparent les pressions en A, B et C ?',
    options: [
      'P_A est la plus grande : la cuve large contient le plus de liquide',
      'P_B est la plus grande : le liquide est plus serré dans le tube étroit',
      'P_C est la plus petite : les parois obliques du vase soutiennent le liquide',
      'elles sont égales : à même profondeur, la forme du récipient ne compte pas'], bonne: 3,
    expl: 'La relation P_B − P_A = ρ·g·(z_A − z_B) ne contient ni la forme du récipient, ni la quantité de liquide : seule la différence de hauteur compte. A, B et C sont à la même hauteur, donc z_A − z_B = 0 : les pressions sont égales. C’est pourquoi le liquide monte au même niveau dans des branches communicantes de formes différentes.',
    indice: 'Pour deux points à la même profondeur, que vaut z_A − z_B dans la relation fournie ? La forme du récipient y apparaît-elle ?' },
  graphe: {    // étape d'indice 9
    q: 'On trace P en fonction de h. Quel résultat est en accord avec la relation fournie ?',
    options: [
      'une courbe qui s’aplatit : la pression se stabilise quand on descend',
      'une droite d’ordonnée à l’origine P à la surface, de pente égale à ρ·g',
      'une droite horizontale : la pression ne dépend pas de la profondeur',
      'une droite passant par l’origine : P est proportionnelle à la profondeur'], bonne: 1,
    expl: 'P = P_surface + ρ·g·h est une fonction affine de h : sa représentation est une droite qui coupe l’axe vertical en P_surface (environ 1 013 hPa) et dont la pente vaut ρ·g. Elle ne passe pas par l’origine, puisque l’atmosphère appuie déjà à la surface.',
    indice: 'Écrivez P en fonction de h : P = P_surface + ρ·g·h. De quel type de fonction s’agit-il ? Que vaut P quand h = 0 ?' },
  limite: {    // étape d'indice 11
    q: 'Pour laquelle de ces situations l’hypothèse « ρ constante » est-elle la moins justifiée ?',
    options: [
      'l’eau d’un lac sur 30 m de profondeur : l’eau est très comprimée',
      'le mercure d’un baromètre sur 76 cm : il est très dense',
      'l’huile d’une cuve sur 2 m de hauteur : elle est visqueuse',
      'l’air, du niveau de la mer à 5 000 m : sa masse volumique varie'], bonne: 3,
    expl: 'Un liquide est quasi incompressible : l’eau d’un lac est très peu comprimée, même à 30 m (moins de 0,02 % de variation de ρ). La densité ou la viscosité ne changent pas la validité de l’hypothèse. Un gaz comme l’air est compressible : sa masse volumique diminue nettement avec l’altitude, donc la relation avec ρ constante ne convient plus sur de grandes hauteurs.',
    indice: 'La relation suppose que ρ ne change pas entre A et B. Quel fluide a une masse volumique qui change beaucoup quand la pression change ?' },
};
