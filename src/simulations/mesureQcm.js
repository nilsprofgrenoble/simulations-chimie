// QCM du parcours guidé de la simulation 161 « Mesure et incertitudes ». Fichier sans React : la longueur des options est contrôlée par un script
// (la bonne réponse n'est jamais la plus longue). Toutes les options d'une question suivent le patron « réponse : justification ».
// bonne : indice de la bonne réponse dans options (varie d'une question à l'autre).
export const QCM = {
  variab: {
    q: 'Comment expliquer que deux mesures faites dans les mêmes conditions donnent deux valeurs différentes ?',
    options: ['un essai est faux : une seule des deux valeurs peut être la bonne', 'la mesure varie : le geste de l’opérateur varie un peu d’un essai à l’autre', 'le pendule a changé : sa durée d’oscillation augmente à chaque essai', 'le chronomètre est défectueux : un bon appareil donne toujours le même nombre'],
    bonne: 1,
    expl: 'Chaque mesure est un peu différente de la précédente : le déclenchement à la main, la lecture, les petites variations du montage introduisent des écarts aléatoires. Aucune des deux valeurs n’est « fausse » : elles sont deux résultats possibles de la même mesure. C’est pourquoi on répète les mesures et on étudie leur dispersion.',
    indice: 'Le même opérateur lance et arrête le chronomètre à la main : refait-il exactement le même geste au dixième de seconde près ?' },
  disp: {
    q: 'Ces deux séries de 20 mesures ont des moyennes voisines. Laquelle a le plus petit écart-type s ?',
    options: ['la série 1 : elle couvre un plus grand intervalle, donc elle est plus précise', 'la série 2 : ses mesures sont toutes groupées assez près de la moyenne', 'aucune : des moyennes voisines donnent des écarts-types voisins', 'on ne peut pas savoir : il faudrait la liste de toutes les valeurs'],
    bonne: 1,
    expl: 'L’écart-type s mesure l’étalement des mesures autour de la moyenne : plus les barres de l’histogramme sont groupées au centre, plus s est petit. Ici la série 2 occupe peu de classes (mesures resserrées), la série 1 en occupe beaucoup. La moyenne et l’écart-type sont deux informations indépendantes : deux séries peuvent avoir la même moyenne et des dispersions très différentes.',
    indice: 'Regardez sur combien de classes chaque série s’étale : une série étroite et haute ou une série large et basse ?' },
  protocole: {
    q: 'On veut des mesures moins dispersées. Quel changement de protocole y contribue le plus ?',
    options: ['mesurer une seule oscillation : la durée à lire est plus petite', 'afficher les millièmes de seconde : le chronomètre est plus fin', 'déclencher par une cellule : on réduit fortement la part due au geste', 'ne faire qu’une seule mesure : on évite d’avoir à comparer plusieurs valeurs'],
    bonne: 2,
    expl: 'La dispersion vient surtout du geste de l’opérateur au départ et à l’arrivée. Une cellule photoélectrique déclenche et arrête le chronomètre à un repère fixe : la part due au geste est fortement réduite et les mesures se resserrent. Afficher plus de chiffres ne supprime pas la variation du geste ; mesurer une seule oscillation rend l’écart de réaction proportionnellement plus grand (on chronomètre plutôt 10 oscillations) ; ne faire qu’une mesure cache la dispersion sans la réduire.',
    indice: 'Cherchez ce qui introduit la variation d’un essai à l’autre, puis ce qui la supprime : l’affichage, la durée mesurée, ou le geste ?' },
  syst: {
    q: 'On passe de 10 à 100 pesées de la même masse marquée. L’écart entre la moyenne et la valeur de référence 20,000 g…',
    options: ['diminue : la moyenne se rapproche de 20,000 g quand N augmente', 'reste du même ordre : le décalage est le même à chaque pesée', 'disparaît : les écarts positifs et négatifs se compensent', 'augmente : les erreurs de chacune des pesées s’additionnent'],
    bonne: 1,
    expl: 'Répéter les mesures réduit l’effet des variations aléatoires (qui se compensent en partie), mais pas un décalage systématique : une balance mal tarée est trop haute à chaque pesée, donc la moyenne reste décalée, même avec 100 mesures. L’incertitude-type de type A, elle, devient petite : elle ne « voit » pas ce décalage. Seul un étalonnage ou un contrôle avec une référence permet de le détecter.',
    indice: 'La balance est décalée de la même façon à chaque pesée : en faisant la moyenne de nombreuses pesées, ce décalage se compense-t-il ?' },
  ecrire: {
    q: 'Quelle écriture du résultat est correcte ?',
    options: ['f′ = 153,0 ± 3,46 mm', 'f′ = 153 ± 3 mm', 'f′ = 153 ± 4 mm', 'f′ = 153 ± 3,5 mm'],
    bonne: 2,
    expl: 'L’incertitude 3,46 mm s’écrit avec un seul chiffre significatif (le premier chiffre n’est pas 1), arrondie par excès pour ne pas la sous-estimer : 4 mm. La valeur estimée est arrondie au même rang, l’unité : 153 mm. 3 mm sous-estime l’incertitude ; 3,5 et 3,46 ont plus de chiffres que justifié, et 153,0 donne à la valeur plus de précision que l’incertitude ne le permet.',
    indice: 'Gardez 1 chiffre significatif pour u, en arrondissant vers le haut, puis arrondissez la valeur estimée à la même décimale que u.' },
  comparer: {
    q: 'Que conclure de la comparaison entre la mesure et la valeur du fabricant ?',
    options: ['incompatibles : les valeurs 153 mm et 150 mm ne sont pas identiques', 'incompatibles : l’incertitude de 4 mm est trop grande pour conclure', 'on ne peut pas conclure : il faudrait d’abord refaire plus de mesures', 'compatibles : l’écart de 3 mm est inférieur à l’incertitude de 4 mm'],
    bonne: 3,
    expl: 'Deux valeurs mesurées sont rarement rigoureusement égales : on les compare en tenant compte de l’incertitude. Ici 150 mm est dans l’intervalle 153 ± 4 mm (de 149 mm à 157 mm), l’écart est du même ordre que l’incertitude : la mesure est compatible avec la valeur du fabricant. Un écart de plusieurs fois l’incertitude, lui, appellerait une explication (erreur systématique, protocole…).',
    indice: 'Calculez l’écart entre 153 mm et 150 mm, puis comparez-le à l’incertitude 4 mm : est-il plus petit, du même ordre, ou beaucoup plus grand ?' },
  choisir: {
    q: 'Un élève lit une seule fois 37,0 mL sur une éprouvette dont la notice indique ± 0,5 mL. Comment évaluer l’incertitude-type ?',
    options: ['type A : u = s / √N, avec N = 1 puisqu’il y a une seule lecture', 'type B : u = a / √3, avec a = 0,5 mL donné par la notice fournie', 'type B : u = a, la demi-largeur de l’intervalle est l’incertitude', 'aucune : sans série de mesures, on ne peut pas parler d’incertitude'],
    bonne: 1,
    expl: 'Avec une seule mesure, il n’y a pas de série : pas d’écart-type, donc pas de type A. On utilise les caractéristiques connues de l’instrument : c’est le type B. Avec la loi uniforme sur [x − a ; x + a], u = a / √3 = 0,5 / √3 = 0,29 mL, soit 0,3 mL arrondi par excès. u = a surestime l’incertitude-type ; dire qu’il n’y a pas d’incertitude est faux : l’instrument en apporte une.',
    indice: 'Une seule lecture : peut-on calculer un écart-type ? Sinon, quelle information la notice de l’instrument vous donne-t-elle ?' },
};
