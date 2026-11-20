// QCM du parcours guidé de la simulation « Chromatographie sur couche mince : identifier et comparer » (sim 197, 2GT).
// Fichier sans React : la longueur des options est contrôlée par ccm2gtQcm.test.mjs (la bonne réponse n'est jamais la plus longue).
// bonne : indice de la bonne réponse dans options (l'ordre est mélangé à l'affichage). Les mauvaises réponses sont de vraies erreurs d'élèves.
export const QCM = {
  utile: {
    q: 'On dépose une goutte d’encre noire de feutre sur une plaque et on fait une CCM. On voit quatre taches de couleurs différentes. Que peut-on conclure ?',
    options: ['l’encre est un mélange d’au moins quatre colorants', 'l’encre est un corps pur, formé d’un seul colorant', 'la plaque est abîmée : une encre ne donne qu’une tache', 'les colorants se sont transformés en quatre autres espèces'], bonne: 0,
    expl: 'Chaque tache est une espèce chimique séparée des autres : quatre taches, c’est au moins quatre espèces, donc un mélange. La CCM sépare les espèces, elle ne les transforme pas.',
    indice: 'La CCM sépare les espèces d’un mélange : chaque espèce forme sa propre tache. Combien d’espèces faut-il pour obtenir quatre taches ?' },
  materiel: {
    q: 'On pose un couvercle sur la cuve pendant la migration. Pourquoi ?',
    options: ['pour que l’éluant ne s’évapore pas dans la pièce', 'pour que la plaque reste au chaud pendant la migration', 'pour que l’éluant monte plus vite grâce à la pression', 'pour empêcher la lumière d’abîmer les taches'], bonne: 0,
    expl: 'L’éluant est volatil : il s’évapore facilement. Sous le couvercle, les vapeurs restent dans la cuve : l’éluant monte régulièrement sur la plaque et on respire moins de vapeurs.',
    indice: 'Un éluant est un liquide volatil : il passe facilement à l’état gazeux. Que fait le couvercle des vapeurs ?' },
  deposer: {
    q: 'Dans la cuve, le niveau de l’éluant doit être…',
    options: ['en dessous de la ligne de dépôt, sans la toucher', 'au-dessus de la ligne, pour bien mouiller les dépôts', 'exactement au niveau de la ligne de dépôt', 'peu importe : seul compte le temps de migration'], bonne: 0,
    expl: 'Si l’éluant touchait les dépôts, il les dissoudrait dans la cuve : plus rien ne monterait sur la plaque. Il doit seulement mouiller le bas de la plaque et monter jusqu’aux dépôts.',
    indice: 'L’éluant doit monter jusqu’aux dépôts en traversant la plaque. S’il les recouvrait dès le départ, que deviendraient les taches ?' },
  lire: {
    q: 'Après la CCM, l’enrobage rouge ne donne qu’une seule tache. Que peut-on dire ?',
    options: ['il contient probablement un seul colorant (corps pur)', 'il contient sûrement un seul colorant, sans aucun doute', 'c’est un mélange de colorants dont les couleurs se sont superposées', 'la CCM a échoué : une CCM réussie donne toujours deux taches'], bonne: 0,
    expl: 'Une seule tache : on ne voit qu’une espèce, donc un corps pur est probable. On ne peut pas en être sûr : une autre espèce pourrait monter à la même hauteur avec cet éluant (on le verra plus loin).',
    indice: 'Une tache = une espèce. Combien d’espèces voit-on ici ? Et peut-on être certain de n’en avoir pas manqué une ?' },
  comparer: {
    q: 'Quels colorants l’enrobage orange contient-il probablement ?',
    options: ['le jaune E102 et le rouge E129', 'l’orangé E110 seul, car l’enrobage est orange', 'le jaune E102 et l’orangé E110', 'le rouge E129 et le bleu E133'], bonne: 0,
    expl: 'Les deux taches de l’enrobage orange sont alignées avec la référence jaune et avec la référence rouge. Aucune tache n’est alignée avec l’orangé ou le bleu. La couleur de l’enrobage ne dit rien : seul l’alignement compte.',
    indice: 'Cherchez, pour chaque tache de l’échantillon, la référence qui est à la même hauteur (utilisez la règle). Une référence sans tache alignée n’est pas dans l’échantillon.' },
  limite1: {
    q: 'Avec cet éluant, la tache de l’arôme de synthèse et celle de l’extrait naturel sont à la même hauteur (le co-dépôt ne donne qu’une tache). Que peut-on conclure ?',
    options: ['elles sont peut-être la même espèce, mais sans preuve', 'elles sont la même espèce : c’est maintenant prouvé', 'ce sont deux espèces différentes, c’est certain', 'on ne peut rien en conclure : la CCM n’a servi à rien du tout'], bonne: 0,
    expl: 'Même hauteur : c’est compatible avec la même espèce, mais deux espèces différentes peuvent monter à la même hauteur dans un éluant. Pour confirmer, on recommence avec un autre éluant.',
    indice: 'Deux espèces différentes peuvent-elles migrer pareil dans un même éluant ? Si oui, la même hauteur suffit-elle à prouver quelque chose ?' },
  limite2: {
    q: 'Cliquez sur « Éluant 2 » pour refaire la CCM avec un autre éluant. Que conclure ?',
    options: ['deux espèces différentes : une hauteur ne coïncide plus', 'c’est la même espèce : la première plaque l’avait déjà prouvé', 'c’est la même espèce : l’éluant 2 est simplement mal choisi', 'on ne peut pas conclure : les deux plaques se contredisent'], bonne: 0,
    expl: 'Avec l’éluant 2, les deux taches ne sont plus à la même hauteur : ce sont deux espèces différentes. Les plaques ne se contredisent pas : l’éluant 1 ne les séparait pas, l’éluant 2 si. Une différence de hauteur prouve que les espèces sont différentes ; une égalité ne le prouve jamais.',
    indice: 'Regardez la plaque avec l’éluant 2 : les deux taches sont-elles encore à la même hauteur ? Qu’est-ce qui prouve que deux espèces sont différentes ?' },
  erreurs: {
    q: 'Quelle plaque montre un dépôt trop concentré ?',
    options: ['la plaque A', 'la plaque B', 'la plaque C', 'aucune des trois plaques'], bonne: 0,
    expl: 'Sur la plaque A, les taches sont grosses, étalées vers le bas et se touchent : on ne peut plus lire les hauteurs. Plaque B : dépôt sous le niveau de l’éluant (aucune tache). Plaque C : front arrivé au bord de la plaque.',
    indice: 'Un dépôt trop concentré donne des taches très grosses, qui traînent et se touchent. Cherchez-les sur les trois plaques.' },
};
