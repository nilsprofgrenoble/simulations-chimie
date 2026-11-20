// QCM du parcours guidé de la simulation « Quantité de matière : compter les entités et la mole » (sim 178, 2GT).
// Fichier sans React : la longueur des options est contrôlée par un script (la bonne réponse n'est jamais la plus longue).
// bonne : indice de la bonne réponse dans options.
export const QCM = {
  mole: {
    q: 'Une mole d’atomes de cuivre et une mole d’atomes de fer contiennent…',
    options: ['le même nombre d’atomes : 6,02 × 10²³', 'plus d’atomes dans la mole de cuivre : il est plus lourd', 'plus d’atomes dans la mole de fer : il est plus répandu', 'des nombres différents : ce sont deux métaux différents'], bonne: 0,
    expl: 'Une mole est un paquet de 6,02 × 10²³ entités, quelle que soit la nature de l’entité : comme une douzaine vaut toujours 12, que ce soient des œufs ou des oranges. Les deux moles contiennent donc autant d’atomes ; en revanche, leurs masses ne sont pas les mêmes.',
    indice: 'Une boîte de 6 œufs contient 6 œufs, que ce soient des œufs de poule ou de caille. Ici, le paquet est la mole : combien d’entités contient-elle ?' },
  conversion: {
    q: 'Une goutte d’eau pèse 0,050 g. Quelle est sa masse en kilogrammes ?',
    options: ['5,0 × 10⁻⁵ kg', '5,0 × 10⁻² kg', '5,0 × 10⁻⁴ kg', '5,0 × 10⁻⁶ kg'], bonne: 0,
    expl: '0,050 g = 5,0 × 10⁻² g. Comme 1 g = 10⁻³ kg, on multiplie encore par 10⁻³ : 5,0 × 10⁻² × 10⁻³ = 5,0 × 10⁻⁵ kg. (Un kilogramme est mille fois plus grand qu’un gramme : le nombre de kg est mille fois plus petit.)',
    indice: '1 g = 10⁻³ kg. Écrivez d’abord 0,050 g sous la forme 5,0 × 10⁻² g, puis multipliez par 10⁻³ : les puissances de 10 s’additionnent (−2 + (−3)).' },
};
