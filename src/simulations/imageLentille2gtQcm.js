// QCM du parcours guidé de la simulation 199 « Image réelle et grandissement avec une lentille convergente » (2GT).
// Fichier sans React : la longueur des options est contrôlée par imageLentille2gtQcm.test.mjs (la bonne réponse n'est jamais la plus longue).
// bonne : indice de la bonne réponse dans options (l'ordre est mélangé à l'affichage). Les mauvaises réponses sont de vraies erreurs d'élèves.
// Les tracés a, b, c, d sont ceux du schéma (calculés par le modèle) : le bon tracé est vérifié par imageLentille2gtModele.test.mjs.
export const QCM = {
  rayon1: {
    q: 'Le rayon parallèle à l’axe part de B. Après la lentille, quel tracé suit-il ?',
    options: ['le tracé a', 'le tracé b', 'le tracé c', 'le tracé d'], bonne: 1,
    expl: 'Il ressort en passant par le foyer image F′ : c’est le tracé b. Le tracé a passe par un point plus loin que F′, le tracé c n’est pas dévié, le tracé d s’écarte de l’axe comme s’il venait de F.',
    indice: 'Un rayon parallèle à l’axe ressort en passant par un foyer. Lequel, F ou F′ ? Repérez le tracé gris qui arrive exactement sur ce point de l’axe.' },
  rayon2: {
    q: 'Le rayon qui passe par O part de B. Après la lentille, quel tracé suit-il ?',
    options: ['le tracé a', 'le tracé b', 'le tracé c', 'le tracé d'], bonne: 2,
    expl: 'Au centre, la lentille est très mince : le rayon n’est pas dévié et continue en ligne droite, dans le prolongement de B–O : c’est le tracé c. Les tracés a et d se courbent trop vers le bas, le tracé b remonte.',
    indice: 'Le rayon n’est pas dévié : il continue dans la même direction. Quel tracé gris est dans le prolongement exact du trait orange qui arrive en O ?' },
  rayon3: {
    q: 'Le rayon issu de B passe par le foyer F. Après la lentille, quel tracé suit-il ?',
    options: ['le tracé a', 'le tracé b', 'le tracé c', 'le tracé d'], bonne: 0,
    expl: 'Un rayon qui passe par F ressort parallèle à l’axe : c’est le tracé a. Les tracés b et c remontent vers l’axe, le tracé d descend.',
    indice: 'C’est le trajet inverse du premier rayon (celui qui arrive parallèle à l’axe). Quel tracé gris reste parallèle à l’axe ?' },
  ecran: {
    q: 'On place un écran en A′, puis on le recule de 3\u00a0cm, en l’éloignant de la lentille. Que voit-on sur l’écran ?',
    options: ['une image floue : les rayons se sont déjà croisés, puis écartés', 'une image floue : les rayons ne se sont pas encore croisés', 'la même image nette : les rayons se croisent toujours sur l’écran', 'une image nette, mais plus grande : les rayons s’écartent'], bonne: 0,
    expl: 'L’image ne se forme qu’à l’endroit où les rayons se croisent, en A′B′. Plus loin, les rayons se sont déjà croisés puis écartés : la lumière est étalée et l’image est floue. Si l’écran était trop près, les rayons ne se seraient pas encore croisés : l’image serait floue aussi.',
    indice: 'Où se croisent les trois rayons ? Que deviennent les rayons juste après ce point ?' },
  sens: {
    q: 'La pointe B de la bougie est au-dessus de l’axe. Où se trouve la pointe B′ de l’image, sur l’écran, et comment est l’image ?',
    options: ['sous l’axe : l’image est renversée', 'au-dessus de l’axe : l’image est droite', 'sous l’axe : l’image est droite', 'au-dessus de l’axe : l’image est renversée'], bonne: 0,
    expl: 'Les trois rayons se croisent sous l’axe, en B′ : la pointe de l’image est en bas, alors que celle de l’objet est en haut. L’image est renversée, la tête en bas.',
    indice: 'Regardez où se croisent les trois rayons : B′ est-il au-dessus ou au-dessous de l’axe ?' },
  deplace: {
    q: 'On rapproche la bougie de la lentille : l’objet passe de 12\u00a0cm à 6\u00a0cm. Que devient l’image ?',
    options: ['elle s’éloigne de la lentille et devient plus grande', 'elle se rapproche de la lentille et devient plus grande', 'elle s’éloigne de la lentille et devient plus petite', 'elle se rapproche de la lentille et devient plus petite'], bonne: 0,
    expl: 'Objet à 12\u00a0cm : image à 6\u00a0cm, plus petite que l’objet. Objet à 6\u00a0cm : image à 12\u00a0cm, plus grande. Quand l’objet se rapproche, l’image s’éloigne de la lentille et grandit.',
    indice: 'Cliquez sur les trois positions de l’objet et comparez, à chaque fois, la distance OA′ (règle) et la hauteur de l’image.' },
  loin: {
    q: 'D’après le tableau, quand l’objet est de plus en plus loin de la lentille, où se forme l’image ?',
    options: ['de plus en plus près de F′, et de plus en plus petite', 'de plus en plus près de F′, mais de plus en plus grande', 'de plus en plus près de O, et de plus en plus petite', 'de plus en plus loin de F′, et de plus en plus grande'], bonne: 0,
    expl: 'Quand OA passe de 12\u00a0cm à 40\u00a0cm, OA′ passe de 6\u00a0cm à 4,4\u00a0cm : l’image se rapproche de F′ (à 4\u00a0cm de la lentille) et sa hauteur diminue, de 1,0\u00a0cm à 0,22\u00a0cm.',
    indice: 'Regardez la colonne « Image à OA′ » quand l’objet passe de 12\u00a0cm à 20\u00a0cm puis à 40\u00a0cm : vers quelle valeur les nombres se rapprochent-ils ? Comparez-la à OF′ = 4\u00a0cm.' },
};
