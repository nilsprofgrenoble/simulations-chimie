// QCM du parcours guidé de la simulation 204 « Synthèse d'une espèce naturelle : montage à reflux et CCM » (2GT).
// Fichier sans React : la longueur des options est contrôlée par syntheseReflux2gtQcm.test.mjs (la bonne réponse n'est jamais la plus longue).
// bonne : indice de la bonne réponse dans options (l'ordre est mélangé à l'affichage). Les mauvaises réponses sont de vraies erreurs d'élèves.
export const QCM = {
  ester: {
    q: 'Dans cette synthèse, quelles espèces sont les produits, c’est-à-dire celles qui se forment ?',
    options: ['l’acétate d’isoamyle et l’eau', 'l’alcool isoamylique et l’acide éthanoïque', 'l’acétate d’isoamyle et l’acide éthanoïque', 'l’alcool isoamylique et l’eau'], bonne: 0,
    expl: 'Les produits sont les espèces qui se forment : ici l’acétate d’isoamyle (l’arôme) et l’eau. L’alcool isoamylique et l’acide éthanoïque sont les réactifs : on les mélange au départ, ils sont transformés (en partie) pendant la transformation.',
    indice: 'Les réactifs sont les espèces qu’on met au départ. Les produits sont celles qui apparaissent : dans le schéma, elles sont après la flèche.' },
  chauffer: {
    q: 'Que montre ce schéma sur l’effet du chauffage ?',
    options: ['on obtient la même quantité d’ester, plus vite', 'on obtient beaucoup plus d’ester à la fin, grâce à la chaleur', 'à 20\u00a0°C, il ne se forme jamais d’ester', 'le chauffage détruit une partie de l’ester déjà formé'], bonne: 0,
    expl: 'Les deux courbes montent vers la même hauteur : à la fin, la quantité d’ester est la même. La courbe du mélange chauffé y arrive plus tôt : chauffer accélère la transformation sans changer ce qu’on obtient à la fin.',
    indice: 'Regardez où chaque courbe finit (même hauteur ou non ?), puis laquelle monte le plus vite.' },
  fuite: {
    q: 'Quel est le principal problème d’un chauffage dans un ballon laissé ouvert ?',
    options: ['des vapeurs s’échappent du ballon : de la matière se perd', 'le mélange chauffe mal car la chaleur sort par l’ouverture', 'l’air entre dans le ballon et fait disparaître l’ester formé', 'le ballon risque d’exploser parce que la pression monte trop'], bonne: 0,
    expl: 'Quand le mélange bout, les vapeurs montent et sortent du ballon : on perd des réactifs et de l’ester, et on respire des vapeurs irritantes et inflammables. Un ballon ouvert n’explose pas : c’est un montage fermé qui est dangereux (on le verra plus loin).',
    indice: 'Un liquide qui bout donne des vapeurs. Où vont-elles si rien ne les arrête ?' },
  reflux: {
    q: 'Que deviennent les vapeurs qui montent dans le réfrigérant ?',
    options: ['elles se refroidissent, redeviennent liquides et retombent', 'elles traversent le réfrigérant puis sortent par le haut du tube', 'elles passent dans l’eau qui circule autour du tube', 'elles se transforment en une autre espèce chimique'], bonne: 0,
    expl: 'Au contact de la paroi froide, les vapeurs redeviennent liquides (changement d’état : la liquéfaction) et les gouttes retombent dans le ballon : c’est le reflux. L’eau de refroidissement ne touche pas le mélange : elle circule dans la gaine, autour du tube.',
    indice: 'Pensez aux états de la matière (gaz, liquide) : que devient un gaz qui touche une paroi froide ?' },
  ouvert: {
    q: 'Pourquoi ne faut-il jamais boucher le haut du réfrigérant ?',
    options: ['en chauffant un montage fermé, la pression monte et il peut éclater', 'le bouchon empêcherait l’eau de circuler dans la gaine du réfrigérant', 'l’air doit entrer dans le ballon pour que la transformation ait lieu', 'les vapeurs ne pourraient plus se refroidir dans le tube'], bonne: 0,
    expl: 'Un gaz chauffé dans un récipient fermé augmente sa pression : le bouchon peut être projeté ou la verrerie éclater. Le haut du tube reste ouvert à l’air : la pression reste celle de la pièce. Les vapeurs, elles, se liquéfient avant d’arriver en haut.',
    indice: 'Un gaz chauffé cherche à occuper plus de place. Que subit un récipient fermé qui ne peut pas s’agrandir ?' },
  secu: {
    q: 'Quelle consigne de sécurité est correcte pour un chauffage à reflux ?',
    options: ['lunettes, blouse, hotte, et aucune flamme près des vapeurs inflammables', 'ajouter la pierre ponce quand le mélange commence à bouillir', 'travailler sur la paillasse et ouvrir une fenêtre à la place de la hotte', 'couper l’eau du réfrigérant dès que le chauffage est éteint'], bonne: 0,
    expl: 'Les vapeurs sont irritantes et inflammables : on protège les yeux et la peau, on travaille sous la hotte et loin de toute flamme. La pierre ponce se met avant de chauffer (dans un liquide déjà chaud, elle fait déborder le mélange), on surveille toujours le montage, et l’eau circule jusqu’au refroidissement complet.',
    indice: 'Les vapeurs sont irritantes et inflammables. Quelle précaution protège de ces deux dangers ?' },
  brut: {
    q: 'Lisez la plaque. Que peut-on dire du produit brut ?',
    options: ['il contient l’ester et, probablement, de l’alcool qui n’a pas réagi', 'c’est un corps pur : la deuxième tache vient d’un défaut de la plaque', 'il contient l’ester et de l’eau, formés ensemble pendant la synthèse', 'il contient deux esters différents, tous deux à odeur de banane'], bonne: 0,
    expl: 'Deux taches : au moins deux espèces. La tache du haut est alignée avec l’ester naturel ; celle du bas est alignée avec la référence « alcool » : il reste de l’alcool isoamylique qui n’a pas réagi. Le produit brut n’est pas pur.',
    indice: 'Comptez les taches de la voie du produit brut, puis comparez la hauteur de chacune à celle des références.' },
  identique: {
    q: 'Lisez la plaque. Que peut-on dire de l’arôme de synthèse et de l’arôme de banane ?',
    options: ['les deux arômes peuvent être identiques, mais ce n’est pas prouvé', 'les deux arômes sont identiques : c’est maintenant prouvé', 'les deux arômes sont différents, puisque la CCM ne montre qu’une tache', 'l’arôme de synthèse est plus pur, puisque sa tache est plus nette'], bonne: 0,
    expl: 'Même hauteur : c’est compatible avec la même espèce, avec cet éluant. Deux espèces différentes peuvent monter à la même hauteur : ce n’est pas une preuve. Pour confirmer, on change d’éluant (voir la simulation sur la CCM).',
    indice: 'Comparez le nombre de taches et leur hauteur sur les trois voies. Une même hauteur suffit-elle à prouver quelque chose ?' },
};
