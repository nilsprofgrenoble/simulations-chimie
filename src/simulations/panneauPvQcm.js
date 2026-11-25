// QCM du parcours guidé de la simulation 227 (panneau photovoltaïque, TSTL). `bonne` = indice de la bonne option (le cadre les mélange à l'affichage).
// Fichier à part pour contrôler par script que la bonne réponse n'est jamais la plus longue ni la plus courte.
export const QCM = {
  role: {
    options: ['R est le générateur et le panneau le récepteur, car c’est R qui impose le courant', 'le panneau est le générateur (il convertit la lumière), R est le récepteur', 'le panneau et R sont tous deux des générateurs, puisqu’un courant les traverse', 'la lampe est le générateur : le panneau ne fait que transmettre l’énergie'],
    bonne: 1 },
  allure: {
    options: ['I diminue régulièrement quand U augmente, en suivant une droite inclinée', 'I reste presque constant, puis chute vite près de la plus grande tension', 'I augmente avec U, comme dans un conducteur ohmique ordinaire, jusqu’à Uco', 'I est nul sauf pour une valeur très précise de la tension U'],
    bonne: 1 },
  zero: {
    options: ['maximale au court-circuit, car l’intensité I y est la plus grande possible', 'nulle au court-circuit mais maximale à vide, car U y est la plus grande', 'nulle dans les deux cas : U est nulle d’un côté, I est nulle de l’autre', 'maximale à vide, car la tension U y est la plus grande possible'],
    bonne: 2 },
  generateur: {
    options: ['oui : un panneau garde toujours la même tension, quelle que soit la résistance', 'non : seul le courant d’une source idéale est limité, pas celui d’un panneau', 'non : son courant est limité par Icc, mais une source idéale fixe sa tension', 'oui : sur R = 2,0 Ω, le panneau fournit aussi 1,5 A comme la source idéale'],
    bonne: 2 },
  eclair: {
    options: ['Icc et Uco sont toutes deux multipliées par 0,4, comme l’éclairement', 'ni Icc ni Uco ne changent : seule la couleur de la lumière a de l’effet', 'Icc ne change pas, mais Uco est multipliée par 0,4', 'Icc est multipliée par 0,4, Uco baisse de quelques pour cent'],
    bonne: 3 },
};
