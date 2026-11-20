// QCM du parcours guidé de la simulation « Mesure : incertitude-type et résultat » (sim 194, 2GT).
// Fichier sans React : la longueur des options est contrôlée par un script (la bonne réponse n'est jamais la plus longue).
// bonne : indice de la bonne réponse dans options (varie d'une question à l'autre).
export const QCM = {
  intervalle: {
    q: 'On a mesuré plusieurs fois la longueur d’une feuille : moyenne 29,70 cm et u = 0,05 cm. Laquelle de ces valeurs peut-on raisonnablement attribuer à la longueur ?',
    options: ['29,90 cm', '29,50 cm', '29,72 cm', 'Seulement 29,70 cm exactement'], bonne: 2,
    expl: 'L’intervalle va de 29,70 − 0,05 = 29,65 cm à 29,70 + 0,05 = 29,75 cm. Seule la valeur 29,72 cm est entre les deux. Les valeurs 29,90 cm et 29,50 cm sont en dehors, et la moyenne n’est pas la seule valeur possible : toutes celles de l’intervalle conviennent.',
    indice: 'Calculez les deux bornes : la moyenne moins u, puis la moyenne plus u. Quelle valeur est entre les deux ?' },
  enmots: {
    q: 'Alice et Bob ont mesuré la même pièce. Alice trouve (7,50 ± 0,02) g et Bob trouve (7,50 ± 0,10) g. Quel résultat est le plus précis ?',
    options: ['Le résultat de Bob : son nombre u est plus grand, donc il en dit plus', 'Aucun des deux : la moyenne est la même, donc ils se valent', 'Le résultat d’Alice : sa zone de valeurs est plus étroite', 'On ne peut pas savoir sans connaître la vraie masse de la pièce'], bonne: 2,
    expl: 'Le résultat d’Alice va de 7,48 g à 7,52 g : la zone est étroite, la valeur est connue plus précisément. Le résultat de Bob va de 7,40 g à 7,60 g : la zone est cinq fois plus large. Plus u est petite, plus le résultat est précis (même moyenne ne veut pas dire même précision). Attention : précision n’est pas justesse. Un résultat très précis peut être loin de la vraie valeur, nous le verrons plus loin.',
    indice: 'Pour chacun, calculez la zone de valeurs possibles (moyenne − u, moyenne + u). Laquelle est la plus étroite ?' },
  instrument: {
    q: 'On pèse neuf fois la même pièce avec deux balances (A et B). Pour le même nombre de mesures, quelle balance donne la plus petite incertitude-type u ?',
    options: ['La balance A', 'Aucune : seul le nombre de mesures change u', 'La balance B', 'Les deux : le même u si n est le même'], bonne: 2,
    expl: 'Avec la balance B, les mesures sont plus groupées : l’écart-type s est plus petit, donc u = s ÷ √n est plus petite (n est le même). Un meilleur instrument (ou un meilleur protocole) fait baisser u.',
    indice: 'Regardez les points sur l’axe : pour quelle balance sont-ils les plus resserrés ? Plus ils sont resserrés, plus s est petit.' },
  arrondi: {
    q: 'La calculatrice donne u = 0,0623 s. Quelle écriture de u respecte la règle ?',
    options: ['0,0623 s', '0,06 s', '0,062 s', '0,07 s'], bonne: 3,
    expl: 'Le premier chiffre qui compte est 6 : on garde un seul chiffre significatif. On arrondit vers le haut, par prudence : 0,0623 → 0,07 s. Écrire 0,0623 ou 0,062 garde trop de chiffres, et 0,06 arrondirait vers le bas (on sous-estimerait le doute).',
    indice: 'Un seul chiffre significatif (le premier chiffre non nul est 6). Comme on arrondit vers le haut, que devient 0,0623 ?' },
  resultat: {
    q: 'Une série de mesures de durée donne une moyenne de 12,3846 s et u = 0,0482 s. Quelle écriture du résultat est correcte ?',
    options: ['t = (12,3846 ± 0,05) s', 't = (12,38 ± 0,0482) s', 't = (12,4 ± 0,05) s', 't = (12,38 ± 0,05) s'], bonne: 3,
    expl: 'D’abord u : 0,0482 → 0,05 s (un chiffre significatif, vers le haut). Elle s’arrête au centième, donc la moyenne s’arrête aussi au centième : 12,3846 → 12,38. Le résultat est t = (12,38 ± 0,05) s. Les autres écritures gardent trop de chiffres ou en retirent trop.',
    indice: 'Arrondissez u à un chiffre significatif (vers le haut). Puis arrondissez la moyenne pour qu’elle s’arrête à la même décimale que u.' },
  compare: {
    q: 'Une feuille mesure (29,67 ± 0,05) cm. Le fabricant annonce 29,70 cm. Quelle conclusion est correcte ?',
    options: ['Pas compatible : 29,67 est différent de 29,70', 'Pas compatible : u est trop petite', 'On ne peut rien dire sans la vraie longueur', 'Compatible : 29,70 cm est dans l’intervalle'], bonne: 3,
    expl: 'L’intervalle va de 29,67 − 0,05 = 29,62 cm à 29,67 + 0,05 = 29,72 cm. La valeur de référence 29,70 cm est dedans : le résultat est compatible avec elle. Deux valeurs qui ne sont pas identiques peuvent être compatibles, car une mesure a toujours une incertitude.',
    indice: 'Calculez l’intervalle de 29,67 − 0,05 à 29,67 + 0,05. La valeur 29,70 est-elle entre les deux bornes ?' },
  systematique: {
    q: 'Marie pèse neuf fois une pièce. Ses mesures sont très groupées (u est petite), mais son résultat est loin de la valeur de référence. Quelle explication est possible ?',
    options: ['Il suffit de faire plus de mesures pour que l’écart disparaisse', 'Les mesures sont trop groupées : u aurait dû être grande', 'La balance est décalée : u ne voit pas ce défaut', 'Il faut calculer u avec plus de chiffres significatifs'], bonne: 2,
    expl: 'Une balance dont le zéro est décalé ajoute la même erreur à toutes les mesures : elles restent groupées (u petite) mais toutes décalées. L’incertitude-type u ne détecte pas ce défaut, et refaire des mesures avec la même balance ne le corrige pas.',
    indice: 'Si le décalage est le même à chaque pesée, les mesures restent-elles groupées ? Est-ce que u « voit » ce décalage ?' },
};
