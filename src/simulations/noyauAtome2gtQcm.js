// QCM du parcours guidé de la simulation « Le noyau de l'atome : taille, masse et écriture ZAX » (sim 202, 2GT).
// Fichier sans React : les contrôles (4 options distinctes, la bonne réponse jamais strictement la plus longue, pas systématiquement la plus courte) sont dans noyauAtome2gtQcm.test.mjs.
// bonne : indice de la bonne réponse dans options (l'ordre est mélangé à l'affichage). Les mauvaises réponses sont de vraies erreurs d'élèves.
export const QCM = {
  taille: {
    q: 'Quel est l’ordre de grandeur de la taille d’un atome ?',
    options: ['10⁻¹⁰\u00a0m', '10⁻⁸\u00a0m', '10⁻¹²\u00a0m', '10⁻¹⁵\u00a0m'], bonne: 0,
    expl: 'Un atome mesure environ 10⁻¹⁰\u00a0m, soit 0,000\u00a0000\u00a0000\u00a01\u00a0m : un dixième de nanomètre. C’est environ mille fois plus petit qu’un virus (10⁻⁷\u00a0m).',
    indice: 'Le virus mesure 10⁻⁷\u00a0m et l’atome est mille fois plus petit : 1\u00a0000 = 10³. Il faut donc trois zéros de plus après la virgule.' },
  rapport: {
    q: 'Combien de fois l’atome est-il plus large que son noyau ?',
    options: ['100\u00a0000 fois', '1\u00a0000 fois', '10\u00a0000\u00a0000\u00a0000 fois', '5 fois'], bonne: 0,
    expl: 'On divise la grande taille par la petite : 10⁻¹⁰ ÷ 10⁻¹⁵ = 10⁵, soit 100\u00a0000. Le diamètre de l’atome est environ 100\u00a0000 fois celui de son noyau.',
    indice: 'Pour diviser des puissances de 10, on soustrait les nombres du haut : −10 − (−15) = −10 + 15. Puis on écrit 10 avec ce nombre.' },
  neutre: {
    q: 'Un atome de sodium contient 11 protons et 12 neutrons. Combien a-t-il d’électrons ?',
    options: ['11 électrons : autant que de protons', '12 électrons : autant que de neutrons', '23 électrons : tous les nucléons', '0 électron : l’atome est neutre'], bonne: 0,
    expl: 'Le noyau porte la charge +11e. Pour que l’atome soit neutre, le nuage doit porter −11e : 11 électrons. Les neutrons n’ont pas de charge, ils ne comptent pas.',
    indice: 'Les neutrons n’ont pas de charge. Le noyau porte +e par proton ; le nuage doit compenser exactement cette charge.' },
  element: {
    q: 'Un noyau contient 17 protons. De quel élément s’agit-il ?',
    options: ['le chlore (symbole Cl)', 'l’argon (symbole Ar)', 'le soufre (symbole S)', 'le phosphore (symbole P)'], bonne: 0,
    expl: 'Le nombre de protons est le numéro atomique : Z = 17. Dans le tableau, la case 17 est le chlore, de symbole Cl. L’argon (Z = 18) a un proton de plus, le soufre (Z = 16) un de moins, le phosphore (Z = 15) deux de moins.',
    indice: 'Cherchez, dans le tableau, la case dont le petit nombre (le numéro atomique Z) est 17.' },
};
// Choix de l'étape 10 (écriture ZAX d'un noyau d'azote : 7 protons et 7 neutrons) : [A, Z, symbole, explication]
export const ZAX_CHOIX = [
  [14, 7, 'N', 'Juste : A = 7 + 7 = 14 nucléons en haut, Z = 7 protons en bas, symbole N de l’azote.'],
  [7, 14, 'N', 'A et Z sont échangés : le nombre de nucléons (le plus grand) s’écrit en haut, le nombre de protons en bas.'],
  [7, 7, 'N', 'Il manque les neutrons : A compte tous les nucléons, protons et neutrons : 7 + 7 = 14.'],
  [14, 6, 'C', 'Ce noyau a 6 protons, c’est du carbone. Ici il y a 7 protons : Z = 7, symbole N.'],
];
