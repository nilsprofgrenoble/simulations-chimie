// QCM du parcours guidé de la simulation « Dispersion de la lumière blanche par un prisme » (sim 201, 2GT).
// Fichier sans React : la longueur des options est contrôlée par prisme2gtQcm.test.mjs (la bonne réponse n'est jamais la plus longue).
// bonne : indice de la bonne réponse dans options (l'ordre est mélangé à l'affichage). Les mauvaises réponses sont de vraies erreurs d'élèves.
export const QCM = {
  observer: {
    q: 'Que peut-on conclure sur la lumière blanche ?',
    options: ['elle contient plusieurs couleurs, que le prisme sépare', 'elle n’a pas de couleur, le verre du prisme la colore', 'elle est d’une seule couleur très claire, que le prisme étale', 'le prisme crée des couleurs qui n’étaient pas dans la lumière'], bonne: 0,
    expl: 'Le prisme ne fabrique pas de couleurs : il les trie. Chaque couleur est déviée d’un angle un peu différent, donc on voit sur l’écran toutes les couleurs que la lumière blanche contenait déjà.',
    indice: 'Regarde l’écran : combien de couleurs y voit-on ? D’où peuvent-elles venir, puisque le prisme est un bloc de verre transparent et incolore ?' },
  deviee: {
    q: 'Quelle couleur est la plus déviée ?',
    options: ['le violet', 'le rouge', 'les deux de la même façon', 'on ne peut pas le dire avec ce schéma'], bonne: 0,
    expl: 'La tache violette est la plus éloignée du trajet en pointillés : le violet est le plus dévié, le rouge le moins.',
    indice: 'Compare, sur l’écran, la distance entre chaque tache colorée et l’extrémité des pointillés : la plus grande distance correspond à la plus grande déviation.' },
  indice: {
    q: 'Le violet a un indice plus grand que le rouge. Dans le verre, le rayon violet est…',
    options: ['plus près de la normale que le rayon rouge', 'plus loin de la normale que le rayon rouge', 'exactement au même endroit que le rayon rouge', 'impossible à placer sans calculer'], bonne: 0,
    expl: 'Quand l’indice est plus grand, l’angle avec la normale est plus petit (comme l’exemple de l’air vers le verre d’indice 1,50). Le violet (n = 1,69) est donc plus près de la normale que le rouge (n = 1,63).',
    indice: 'Reprends l’exemple : l’air (n = 1,00) vers le verre (n = 1,50), avec i₁ = 60 °, donne i₂ = 35,3 °. Cet angle i₂ est-il plus petit ou plus grand que i₁ ?' },
  sortie: {
    q: 'Dans l’air, après la seconde face, le rayon rouge fait avec la normale un angle…',
    options: ['plus grand : il s’écarte de la normale', 'plus petit : il se rapproche de la normale', 'le même : le rayon n’est pas dévié', 'nul : le rayon sort le long de la normale'], bonne: 0,
    expl: 'Le rayon passe du verre (n = 1,63) à l’air (n = 1,00) : l’indice diminue, donc l’angle avec la normale augmente (i₄ est plus grand que i₃). C’est l’inverse de l’entrée.',
    indice: 'Compare les indices : le rayon va d’un milieu d’indice élevé vers un milieu d’indice plus faible. Dans l’exemple facultatif (verre vers air), l’angle de sortie est-il plus grand ou plus petit que l’angle dans le verre ?' },
  deuxFaces: {
    q: 'À l’entrée, le rouge et le violet sont séparés d’environ 1 °, à la sortie de 7,5 °. Comment l’expliquer ?',
    options: ['la seconde face dévie encore plus le violet : les écarts s’ajoutent', 'après la seconde face, le violet va plus vite que le rouge dans l’air', 'c’est l’écran, placé loin du prisme, qui agrandit l’écart entre les couleurs', 'le verre colore davantage la lumière au moment où elle sort du prisme'], bonne: 0,
    expl: 'À la seconde face, l’indice du violet est encore plus grand que celui du rouge : la face dévie le violet plus que le rouge. Cette seconde séparation s’ajoute à la première, ce qui donne un écart bien plus grand à la sortie.',
    indice: 'Combien de réfractions la lumière subit-elle dans le prisme ? L’indice dépend-il de la couleur à chacune de ces réfractions ?' },
  continu: {
    q: 'Quel type de spectre la lumière blanche donne-t-elle sur l’écran ?',
    options: ['un spectre continu : toutes les couleurs, sans trou', 'un spectre de raies : quelques traits fins séparés', 'un spectre à une seule couleur : le blanc', 'pas de spectre : la lumière blanche n’a pas de couleur'], bonne: 0,
    expl: 'Sur l’écran, les couleurs se suivent du rouge au violet sans interruption : c’est un spectre continu, comme celui d’une lampe à incandescence ou du Soleil (simulation « Spectres »).',
    indice: 'Regarde la bande colorée sur l’écran : y a-t-il des zones noires entre les couleurs, ou se suivent-elles sans interruption ?' },
  laser: {
    q: 'Que peut-on dire d’un faisceau laser qui traverse le prisme ?',
    options: ['il est dévié mais pas étalé : une seule tache sur l’écran', 'il est étalé en plusieurs couleurs comme la lumière blanche', 'il n’est pas dévié du tout, car il n’a qu’une couleur', 'il est dévié et sa couleur change en traversant le verre'], bonne: 0,
    expl: 'Le verre dévie chaque couleur d’un angle précis. Une lumière monochromatique n’a qu’une couleur : elle est déviée, mais elle ne peut pas être séparée en plusieurs couleurs. La couleur ne change pas.',
    indice: 'Pourquoi la lumière blanche est-elle étalée ? Parce qu’elle contient plusieurs couleurs. Que se passe-t-il pour une lumière qui n’en contient qu’une ?' },
  longueur: {
    q: 'Comment la déviation varie-t-elle avec la longueur d’onde ?',
    options: ['plus la longueur d’onde est petite, plus la lumière est déviée', 'plus la longueur d’onde est grande, plus la lumière est fortement déviée', 'elle ne dépend pas de la longueur d’onde', 'elle est maximale pour le vert, au milieu du visible'], bonne: 0,
    expl: 'Le tableau montre que l’indice est plus grand pour les courtes longueurs d’onde (405 nm : 1,69 ; 650 nm : 1,63), donc ces lumières sont plus déviées. Le violet, à 400 nm environ, est la couleur la plus déviée.',
    indice: 'Classe les trois lasers par longueur d’onde, puis par indice (tableau), puis par position de la tache sur l’écran. Que remarques-tu ?' },
  raies: {
    q: 'Que nous apprend ce spectre sur la lumière de la lampe à vapeur de mercure ?',
    options: ['elle ne contient que quelques couleurs bien précises', 'elle contient toutes les couleurs, comme la lumière blanche', 'elle n’est formée que d’une seule couleur', 'elle ne contient aucune couleur visible'], bonne: 0,
    expl: 'Chaque raie est une couleur précise (une longueur d’onde) émise par le mercure. Entre les raies, il n’y a pas de lumière. C’est un spectre de raies, qui permet d’identifier un élément chimique (simulation « Spectres »).',
    indice: 'Compte les traits colorés sur l’écran et regarde ce qu’il y a entre eux. La lampe envoie-t-elle de la lumière de toutes les couleurs ?' },
};
