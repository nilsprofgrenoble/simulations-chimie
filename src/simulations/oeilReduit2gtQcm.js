// QCM du parcours guidé de la simulation « L'œil réduit : une lentille et un écran » (sim 200, 2GT).
// Fichier sans React : la longueur des options est contrôlée par oeilReduit2gtQcm.test.mjs (la bonne réponse n'est jamais la plus longue).
// bonne : indice de la bonne réponse dans options (l'ordre est mélangé à l'affichage). Les mauvaises réponses sont de vraies erreurs d'élèves.
export const QCM = {
  parties: {
    q: 'Comment s’appelle la couche du fond de l’œil, qui reçoit l’image ?',
    options: ['la rétine', 'le nerf optique', 'l’humeur vitrée', 'la sclérotique'], bonne: 0,
    expl: 'C’est la rétine : elle est sensible à la lumière et envoie l’image au cerveau par le nerf optique. Le nerf optique transporte l’information ; l’humeur vitrée est le liquide transparent qui remplit l’œil ; la sclérotique est le blanc de l’œil.',
    indice: 'Cherchez le nom de la couche sensible à la lumière, tout au fond de l’œil : c’est elle qui reçoit l’image.' },
  modele: {
    q: 'Quel objet d’optique remplace la cornée et le cristallin dans l’œil réduit ?',
    options: ['une lentille convergente', 'une lentille divergente', 'un miroir plan incliné', 'un prisme en verre très épais'], bonne: 0,
    expl: 'La cornée et le cristallin font converger la lumière vers la rétine : ils sont remplacés par une seule lentille convergente. La rétine est remplacée par un écran.',
    indice: 'Le cristallin est « une sorte de lentille » qui rapproche les rayons pour former l’image au fond de l’œil. Quelle lentille rapproche les rayons ?' },
  centre: {
    q: 'Le rayon orange part du sommet B de l’arbre et arrive en O. Où arrive-t-il ensuite sur la rétine ?',
    options: ['sous l’axe, en bas de la rétine', 'au-dessus de l’axe, en haut de la rétine', 'sur l’axe, au centre de la rétine', 'il n’atteint pas la rétine'], bonne: 0,
    expl: 'Le rayon passe par O sans être dévié : il continue en ligne droite. Il arrivait de haut en bas : après O, il continue vers le bas et touche la rétine sous l’axe.',
    indice: 'Un rayon qui passe par O continue tout droit. Il descend vers O : après O, continue-t-il à descendre ou remonte-t-il ?' },
  bords: {
    q: 'Après la lentille, où vont se couper les deux rayons bleus issus de B ?',
    options: ['là où le rayon orange touche la rétine', 'sur l’axe, tout au centre de la rétine', 'au-dessus de l’axe, en haut de la rétine', 'très loin derrière l’écran de la rétine'], bonne: 0,
    expl: 'Tous les rayons qui partent d’un même point B se rejoignent en un même point B′. Le rayon orange passe par B′ : les deux rayons bleus s’y coupent aussi, sur la rétine.',
    indice: 'Comme pour le pied A de l’arbre, tous les rayons issus du point B se rejoignent en un seul point. Le rayon orange est l’un d’eux.' },
  image: {
    q: 'L’image de l’arbre sur la rétine est…',
    options: ['réelle et renversée', 'réelle, mais à l’endroit', 'plus grande que l’arbre', 'invisible pour l’œil'], bonne: 0,
    expl: 'L’image se forme sur la rétine, qui joue le rôle d’un écran : elle est réelle. La flèche verte pointe vers le bas alors que l’arbre pointe vers le haut : elle est renversée (le cerveau la remet à l’endroit).',
    indice: 'Comparez le sens de la flèche verte à celui de la flèche noire. Est-elle sur un écran ?' },
  distance: {
    q: 'L’arbre est maintenant à 100 m. Que devient la taille de l’image sur la rétine ?',
    options: ['elle est 2 fois plus petite', 'elle devient 2 fois plus grande', 'elle ne change pas du tout', 'elle devient 4 fois plus petite'], bonne: 0,
    expl: 'A′B′ ÷ AB = OA′ ÷ OA : OA′ ne change pas (17 mm), OA double. Le rapport est divisé par 2 : l’image est 2 fois plus petite, soit environ 1,0 mm au lieu de 2,0 mm.',
    indice: 'Dans A′B′ ÷ AB = OA′ ÷ OA, que devient le rapport si OA double alors que OA′ et AB restent les mêmes ?' },
  proche: {
    q: 'Qu’en est-il de l’image de la bougie sur la rétine ?',
    options: ['elle est floue : une tache sur la rétine', 'elle est nette, comme celle de l’arbre', 'elle est nette, mais renversée', 'elle n’existe pas pour un objet si proche'], bonne: 0,
    expl: 'Les rayons issus de B se rejoignent derrière la rétine. Sur la rétine, ils font une tache : l’image est floue. Le cristallin au repos n’est pas fait pour voir de près.',
    indice: 'Regardez où les rayons se rejoignent : sur la rétine, ou en arrière ? Que voit la rétine s’ils ne se sont pas encore rejoints ?' },
  bombe: {
    q: 'La bougie passe de 40 cm à 25 cm de l’œil. Pour rester nette, le cristallin doit…',
    options: ['se bomber plus : f′ diminue', 'se bomber moins : f′ augmente', 'revenir au repos : f′ = 17,0 mm', 'garder exactement la même forme'], bonne: 0,
    expl: 'Plus l’objet est près, plus le cristallin doit se bomber, donc plus f′ est petite : f′ ≈ 16,3 mm à 40 cm et ≈ 15,9 mm à 25 cm. La rétine, elle, reste à 17 mm.',
    indice: 'Au repos (objet très loin), f′ = 17,0 mm. Pour voir de près, f′ diminue. Plus l’objet est près, plus f′ diminue.' },
};
