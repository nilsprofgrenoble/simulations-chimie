// QCM du parcours guidé de la simulation « Le son : émission et propagation » (2GT).
// Fichier sans React : la longueur des options est contrôlée par un script (la bonne réponse n'est jamais la plus longue, ni la plus courte en général).
// bonne : indice de la bonne réponse dans options (les options sont mélangées à l'affichage).
export const QCM = {
  vibre: {
    q: 'Une corde de guitare sonne. On pose la main dessus : le son s’arrête. Pourquoi ?',
    options: ['la main arrête le va-et-vient de la corde, donc le son', 'la main fait sortir le son hors de la pièce', 'la corde se détend dès qu’on la touche et ne peut plus sonner', 'la main chauffe la corde, qui ne peut plus sonner'], bonne: 0,
    expl: 'Pas de vibration, pas de son : en posant la main, on arrête le va-et-vient de la corde, et le son s’arrête avec elle. C’est comme les branches du diapason quand on pose le doigt dessus.',
    indice: 'Pensez au diapason : que deviennent ses branches quand on pose le doigt dessus ? Et que devient le son ?' },
  proche: {
    q: 'Pendant que le son passe, que fait la particule orange ?',
    options: ['elle va et vient autour de sa place de repos', 'elle avance jusqu’à l’oreille avec le son', 'elle s’éloigne du haut-parleur sans jamais revenir', 'elle reste complètement immobile'], bonne: 0,
    expl: 'La particule orange va et vient autour de sa place de départ (repérée par le trait pointillé) : elle pousse sa voisine, puis revient. Ce n’est pas l’air qui voyage jusqu’à l’oreille : c’est la vibration qui avance de proche en proche.',
    indice: 'Regardez le trait pointillé : c’est la place de la particule au repos. Où se trouve la particule orange par rapport à ce trait, quelques instants plus tard ?' },
  caisse: {
    q: 'Pourquoi la caisse rend-elle le son de la guitare plus fort ?',
    options: ['elle vibre aussi et met beaucoup d’air en mouvement', 'elle fabrique du son sans avoir besoin de vibrer elle-même', 'elle serre la corde, qui vibre plus fort', 'elle garde le son enfermé dans la guitare'], bonne: 0,
    expl: 'La corde est très fine : seule, elle met très peu d’air en mouvement. Elle fait vibrer la caisse, dont la grande surface met beaucoup plus d’air en mouvement : le son est plus fort. Voilà l’intérêt d’une caisse de résonance.',
    indice: 'Comparez ce que la corde seule peut pousser (une ligne très fine) et ce que peut pousser une grande surface qui vibre.' },
  vide: {
    q: 'Quand il ne reste presque plus d’air dans la cloche, que devient le son entendu à l’extérieur ?',
    options: ['il s’affaiblit jusqu’à disparaître, alors que la sonnerie vibre', 'il devient plus fort, car rien ne le gêne', 'il ne change pas, car le verre laisse tout passer', 'il devient plus fort, car la sonnerie vibre de plus en plus vite'], bonne: 0,
    expl: 'Sans air, la vibration de la sonnerie ne peut plus se transmettre de proche en proche jusqu’à la cloche, puis à l’extérieur. Le son a besoin d’un milieu matériel pour se propager : dans le vide, il ne se propage pas.',
    indice: 'Le son se transmet de proche en proche, de particule en particule. S’il n’y a presque plus de particules dans la cloche, qu’est-ce qui peut transmettre la vibration ?' },
  retard: {
    q: 'On éloigne le micro 2 (la distance d augmente). Que devient le retard Δt ?',
    options: ['il augmente : le son a plus de chemin à faire', 'il diminue : le son a plus de place pour aller vite', 'il ne change pas, car le son va toujours aussi vite', 'il devient nul, car le micro est loin'], bonne: 0,
    expl: 'Le son avance à peu près à la même vitesse, mais il a plus de chemin à faire : il met plus de temps. Le retard Δt augmente quand la distance d augmente.',
    indice: 'Essayez avec le curseur : regardez le chronomètre pour d = 17 m, puis pour d = 85 m. Comparez les deux retards.' },
  valeur: {
    q: 'Notre mesure (310 m/s) et la valeur de référence (340 m/s) sont-elles cohérentes ?',
    options: ['oui : l’écart vient de la précision du chronomètre', 'non : 310 m/s est trop loin de 340 m/s', 'non : une mesure doit toujours donner exactement 340 m/s', 'oui : on ne compare jamais une mesure à une valeur connue'], bonne: 0,
    expl: 'Le chronomètre lit Δt = 0,11 s à 0,01 s près. Avec Δt = 0,10 s, on trouverait v = 34 ÷ 0,10 = 340 m/s ; avec Δt = 0,12 s, v ≈ 283 m/s. La valeur de référence 340 m/s est dans ce que permet notre mesure : les deux sont cohérentes. Une mesure n’est jamais exactement égale à la valeur connue.',
    indice: 'Le chronomètre peut se tromper de 0,01 s sur Δt = 0,11 s. Refaites le calcul de v avec Δt = 0,10 s, puis avec Δt = 0,12 s. Que trouvez-vous pour v ?' },
  comparer: {
    q: 'Lequel de ces véhicules va plus vite que le son dans l’air ? (le son : 340 m/s, soit environ 1 200 km/h)',
    options: ['un avion de chasse qui vole à 2 400 km/h', 'un avion de ligne en croisière, à 250 m/s', 'un TGV lancé à pleine vitesse, à 300 km/h', 'une voiture sur autoroute à 25 m/s'], bonne: 0,
    expl: '2 400 km/h dépasse 1 200 km/h (en m/s : environ 670 m/s, contre 340 m/s pour le son). Les autres sont plus lents que le son : 250 m/s < 340 m/s ; 300 km/h ≈ 83 m/s ; 25 m/s = 90 km/h. Pour comparer, il faut toujours écrire les deux vitesses dans la même unité.',
    indice: 'Mettez toutes les vitesses dans la même unité : soit en km/h (le son : 1 200 km/h), soit en m/s (le son : 340 m/s). Pour passer de km/h à m/s, on divise par 3,6.' },
};
