// QCM du parcours guidé de la simulation « Quantité de matière : masse molaire, volume molaire » (sim 152).
// Fichier sans React : la longueur des options est contrôlée par un script (la bonne réponse n'est jamais la plus longue).
// bonne : indice de la bonne réponse dans options.
export const QCM = {
  paquet: {
    q: 'Une mole d’atomes de fer et une mole de molécules d’eau contiennent…',
    options: ['le même nombre d’entités : 6,02 × 10²³ chacune', 'plus d’entités dans la mole de fer : le fer est un solide', 'plus d’entités dans la mole d’eau : H₂O compte trois atomes', 'une seule entité chacune : « mole » est un diminutif de « molécule »'], bonne: 0,
    expl: 'Une mole est un paquet de 6,02 × 10²³ entités (constante d’Avogadro), quelle que soit la nature des entités : atomes, molécules ou ions. Ici, les entités comptées sont des atomes de fer d’un côté, des molécules d’eau de l’autre. Comme une douzaine compte 12 objets, une mole compte un nombre précis d’entités : ce n’est pas une masse.',
    indice: 'La mole sert à compter des entités, comme la douzaine sert à compter des œufs ou des melons : on compte des atomes de fer d’un côté, des molécules d’eau de l’autre.' },
  molaire: {
    q: 'Ces trois échantillons ont-ils la même masse ?',
    options: ['non : les atomes n’ont pas tous la même masse', 'oui : même nombre d’atomes, donc même masse', 'oui : une mole pèse toujours 6,02 × 10²³ grammes'], bonne: 0,
    expl: 'Chaque échantillon contient le même nombre d’atomes (6,02 × 10²³), mais un atome de cuivre est plus lourd qu’un atome de carbone : la masse d’une mole dépend de l’espèce. C’est la masse molaire, notée M.',
    indice: 'Une boîte de 12 œufs et une boîte de 12 melons contiennent autant d’objets : ont-elles la même masse ?' },
  vmcommun: {
    q: 'Dans les mêmes conditions, 1 mol de dioxygène O₂ et 1 mol de dihydrogène H₂ occupent…',
    options: ['le même volume : c’est le volume molaire V_m, le même pour tous les gaz', 'un volume 16 fois plus grand pour O₂ : sa molécule est 16 fois plus lourde', 'un volume 16 fois plus grand pour H₂ : sa molécule est plus petite et plus légère', 'un volume qui dépend du gaz : chaque gaz a son propre volume molaire'], bonne: 0,
    expl: 'Dans les mêmes conditions de température et de pression, une mole de n’importe quel gaz occupe le même volume V_m (modèle du gaz parfait : les molécules sont très éloignées les unes des autres, leur taille et leur masse comptent peu). Seule la masse de la mole change : 32,0 g pour O₂, 2,0 g pour H₂.',
    indice: 'Dans un gaz, les molécules sont très espacées : leur taille et leur masse changent peu le volume occupé.' },
  vmtp: {
    q: 'À pression constante, quand la température du gaz augmente, son volume molaire…',
    options: ['augmente : les molécules s’écartent', 'diminue : les molécules se rapprochent', 'ne change pas : c’est une constante, comme N_A', 'ne dépend que de la nature du gaz : chaque gaz a le sien'], bonne: 0,
    expl: 'À pression constante, l’agitation des molécules augmente avec la température et les écarte les unes des autres : le volume occupé par une mole augmente. V_m passe de 22,4 L/mol à 0 °C à 24,0 L/mol à 20 °C (1013 hPa). V_m dépend de la température et de la pression : il faut toujours le lire dans l’énoncé.',
    indice: 'Choisissez deux températures différentes et comparez les deux valeurs de V_m.' },
  melange: {
    q: 'Quel constituant du mélange contient le plus de molécules ?',
    options: ['l’eau : sa quantité de matière est la plus grande', 'l’éthanol : sa masse est la plus grande', 'autant des deux : les masses sont proches', 'on ne peut pas savoir : il faudrait connaître les volumes'], bonne: 0,
    expl: 'Le nombre de molécules est proportionnel à la quantité de matière : n(eau) = frac(18,0|18,0) = 1,00 mol contre n(éthanol) = frac(23,0|46,0) = 0,500 mol. Une molécule d’éthanol est plus lourde qu’une molécule d’eau : à masse comparable, il y en a moins. La masse seule ne permet pas de comparer des nombres de molécules : il faut calculer n pour chaque constituant.',
    indice: 'Le nombre de molécules est proportionnel à n, pas à la masse : comparez n(eau) et n(éthanol).' },
};
