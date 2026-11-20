// QCM du parcours guidé de la simulation « Transformation nucléaire : isotopes, Soleil et centrales » (sim 203, 2GT).
// Fichier sans React : la longueur des options est contrôlée par nucleaire2gtQcm.test.mjs (la bonne réponse n'est jamais la plus longue, ni toujours la plus courte).
// bonne : indice de la bonne réponse dans options (l'ordre est mélangé à l'affichage). Les mauvaises réponses sont de vraies erreurs d'élèves.
// Aucune formulation d'une bonne réponse n'est reprise dans le texte de l'étape qui porte la question.
export const QCM = {
  iso1: {
    q: 'On cherche un isotope du carbone 12, dont le symbole est ¹²₆C. Quel noyau convient ?',
    options: ['le noyau ¹⁴₆C', 'le noyau ¹²₇N', 'le noyau ¹⁴₇N', 'le noyau ¹⁶₈O'], bonne: 0,
    expl: 'Un isotope du carbone garde Z = 6 (c’est toujours du carbone) mais a un nombre de nucléons A différent : ¹⁴₆C convient. ¹²₇N a le même A que le carbone 12, mais Z = 7 : c’est de l’azote. ¹⁴₇N et ¹⁶₈O sont aussi d’autres éléments (azote et oxygène).',
    indice: 'Même élément veut dire même Z, le nombre écrit en bas à gauche du symbole. Cherche le noyau dont Z vaut 6.' },
  iso2: {
    q: 'Parmi ces quatre noyaux, lesquels sont des isotopes l’un de l’autre ?',
    options: ['¹⁶₈O et ¹⁷₈O', '¹⁴₆C et ¹⁴₇N', '¹⁴₇N et ¹⁶₈O', '¹⁴₆C et ¹⁷₈O'], bonne: 0,
    expl: 'Les noyaux ¹⁶₈O et ¹⁷₈O ont le même Z (8) : ce sont deux noyaux d’oxygène, avec A = 16 et A = 17. ¹⁴₆C et ¹⁴₇N ont le même A, mais pas le même Z : le carbone et l’azote sont deux éléments différents.',
    indice: 'Compare, sur les dessins, le nombre de disques rouges (protons) de chaque noyau, ou le nombre Z du symbole : des isotopes ont le même Z.' },
  physchim: {
    q: 'Une barre de fer exposée à l’air humide se couvre de rouille (des oxydes de fer). Quelle affirmation est correcte ?',
    options: ['c’est chimique : le fer forme de nouvelles espèces avec l’air', 'c’est physique : le fer reste du fer, seule sa surface change', 'c’est physique : le fer change d’état comme un glaçon qui fond', 'c’est chimique : les atomes de fer se changent en atomes d’oxygène'], bonne: 0,
    expl: 'La rouille est une nouvelle espèce chimique : le fer et le dioxygène de l’air se transforment, mais les atomes de fer et d’oxygène sont conservés. Ce n’est ni un changement d’état, ni un changement d’élément.',
    indice: 'Pose-toi deux questions : les espèces (molécules) d’avant sont-elles les mêmes qu’après ? Les atomes sont-ils conservés ?' },
  soleil: {
    q: 'Dans le cœur du Soleil, des noyaux d’hydrogène (Z = 1) sont transformés en noyaux d’hélium (Z = 2). Quelle transformation est la source de l’énergie rayonnée ?',
    options: ['une fusion : des noyaux s’assemblent', 'une fission : un noyau se casse', 'une combustion : l’hydrogène brûle', 'une transformation chimique : les atomes se réarrangent'], bonne: 0,
    expl: 'Les noyaux changent (Z passe de 1 à 2) : l’élément change, c’est une transformation nucléaire. De petits noyaux donnent un noyau plus gros : c’est une fusion. Une combustion ou une transformation chimique conservent les noyaux, donc l’élément ; une fission casserait un gros noyau.',
    indice: 'Si l’élément change, les noyaux changent. Ici, des noyaux petits donnent un noyau plus gros : comment appelle-t-on cela ?' },
  isoEcriture: {
    q: 'Parmi les produits possibles de la fission de l’uranium 235, on trouve ⁹⁴₃₈Sr, ⁹²₃₈Sr, ⁹²₃₆Kr et ¹⁴⁰₅₄Xe. Quels noyaux sont des isotopes l’un de l’autre ?',
    options: ['⁹⁴₃₈Sr et ⁹²₃₈Sr', '⁹²₃₈Sr et ⁹²₃₆Kr', '⁹⁴₃₈Sr et ¹⁴⁰₅₄Xe', '⁹²₃₆Kr et ¹⁴⁰₅₄Xe'], bonne: 0,
    expl: '⁹⁴₃₈Sr et ⁹²₃₈Sr ont le même Z (38) : ce sont deux noyaux de strontium, avec A = 94 et A = 92. ⁹²₃₈Sr et ⁹²₃₆Kr ont le même A, mais pas le même Z : ce sont deux éléments différents (strontium et krypton). Le xénon (Z = 54) n’a pas d’isotope dans cette liste.',
    indice: 'Des isotopes ont le même Z, le nombre écrit en bas à gauche. Attention : un même A ne suffit pas.' },
  fusionFission: {
    q: 'Observez les deux réactions A et B. Quelle affirmation est correcte ?',
    options: ['A est une fusion, B est une fission', 'A est une fission, B est une fusion', 'A et B sont deux fusions nucléaires', 'A et B sont deux fissions nucléaires'], bonne: 0,
    expl: 'Dans A, de petits noyaux s’assemblent en un noyau plus gros : c’est une fusion. Dans B, un gros noyau se casse en deux noyaux plus petits : c’est une fission.',
    indice: 'Regarde la taille des noyaux avant et après la flèche. Où les noyaux grossissent-ils ? Où se cassent-ils ?' },
  chaine: {
    q: 'Dans le réacteur, la fission chauffe de l’eau. Quelle forme d’énergie reçoit l’eau ?',
    options: ['de l’énergie thermique : l’eau reçoit de la chaleur', 'de l’énergie électrique : le courant est produit ici', 'de l’énergie chimique : l’uranium brûle avec le dioxygène', 'de l’énergie de mouvement : l’eau tourne comme une turbine'], bonne: 0,
    expl: 'La fission libère de l’énergie qui chauffe l’eau : l’eau reçoit de la chaleur (énergie thermique) et se vaporise. Le mouvement vient après, avec la turbine ; l’électricité est produite à la fin par l’alternateur. Et il n’y a pas de combustion : l’uranium ne brûle pas, ses noyaux se cassent.',
    indice: 'Une plaque de cuisson qui chauffe de l’eau lui donne de la chaleur. Comment s’appelle cette forme d’énergie ?' },
  energie: {
    q: 'Une centrale à charbon et une centrale nucléaire produisent la même énergie électrique pendant un an. Que peut-on dire de la masse de combustible utilisée ?',
    options: ['bien plus petite pour la centrale nucléaire : on casse des noyaux', 'bien plus petite pour la centrale à charbon : on brûle des molécules', 'à peu près la même, car l’énergie produite est la même', 'bien plus grande pour la centrale nucléaire, car elle est plus puissante'], bonne: 0,
    expl: 'Un noyau qui se casse libère bien plus d’énergie qu’une molécule qui brûle : il faut donc beaucoup moins d’uranium que de charbon pour la même énergie. Les deux centrales produisent la même énergie, mais pas avec la même masse de combustible.',
    indice: 'Compare l’énergie libérée par un noyau qui se casse et par une molécule qui brûle. Plus chaque entité libère d’énergie, plus il en faut peu.' },
  ecritures: {
    q: 'Une seule de ces écritures décrit une transformation nucléaire. Laquelle ?',
    options: ['l’écriture C : l’uranium devient du krypton et du baryum', 'l’écriture B : le carbone devient du dioxyde de carbone', 'l’écriture A : l’eau liquide devient de l’eau gazeuse', 'les écritures B et C : de nouvelles espèces apparaissent dans les deux'], bonne: 0,
    expl: 'Dans C, des noyaux changent : l’uranium devient du krypton et du baryum, trois éléments différents. Dans B, une nouvelle molécule apparaît, mais ce sont toujours des atomes de carbone et d’oxygène : c’est chimique. A est un changement d’état (physique). Une nouvelle espèce ne suffit pas à être nucléaire : il faut que l’élément change.',
    indice: 'Cherche l’écriture où un élément devient un autre élément (pas seulement une nouvelle molécule).' },
};
