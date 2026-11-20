// QCM du parcours guidé de la simulation « Signal sonore : période, fréquence, hauteur et timbre » (2GT).
// Fichier sans React : la longueur des options est contrôlée par un script (la bonne réponse n'est jamais la plus longue).
// bonne : indice de la bonne réponse dans options.
export const QCM = {
  periodique: {
    q: 'Lequel de ces deux enregistrements est périodique ?',
    options: ['A : le même motif se répète régulièrement', 'B : il a de grandes variations, donc il se répète', 'les deux : un son est toujours périodique', 'aucun : un signal ne se répète jamais'], bonne: 0,
    expl: 'L’enregistrement A répète le même motif, identique, à intervalles réguliers : il est périodique (c’est une note tenue). L’enregistrement B ne revient jamais sur lui-même : c’est un claquement, qui n’est pas périodique.',
    indice: 'Cherchez un petit dessin qui revient identique, toujours après la même durée.' },
  hauteur: {
    q: 'Les deux sons sont enregistrés avec la même échelle de temps. Lequel est le plus aigu ?',
    options: ['B : il a plus de motifs dans la même durée', 'A : sa période est la plus courte', 'les deux : la hauteur ne dépend pas du signal', 'B : sa période est plus longue que celle de A'], bonne: 0,
    expl: 'Le son B répète son motif plus souvent : sa période est plus courte et sa fréquence plus grande. Plus la fréquence est grande, plus le son est aigu. Le son A, avec peu de motifs, est le plus grave.',
    indice: 'Comptez les motifs de A et de B sur la même durée. Celui qui en a le plus a la plus grande fréquence.' },
  timbre: {
    q: 'Quels enregistrements correspondent à la même note jouée par deux instruments différents ?',
    options: ['A et B', 'A et C', 'B et C', 'les trois'], bonne: 0,
    expl: 'A et B ont la même période (même hauteur) mais des formes de motif différentes (timbres différents) : c’est la même note jouée par un violon et par une clarinette. Le motif de C est deux fois plus court : sa note est plus aiguë.',
    indice: 'Une même note veut dire une même période. Cherchez deux enregistrements dont les motifs ont la même durée mais pas la même forme.' },
  amplitude: {
    q: 'Comparé au son A, le son B est…',
    options: ['plus fort, pas plus aigu', 'plus aigu, mais pas plus fort', 'plus fort et plus aigu à la fois', 'ni plus fort ni plus aigu'], bonne: 0,
    expl: 'Les deux signaux ont la même période : la hauteur ne change pas. L’amplitude de B est trois fois plus grande : le son B est plus fort.',
    indice: 'Comparez la durée d’un motif (période) pour la hauteur, puis la hauteur maximale du signal (amplitude) pour la force.' },
  domaines: {
    q: 'Le cri d’une chauve-souris a une fréquence de 50 kHz. C’est…',
    options: ['un ultrason : 50 kHz dépasse 20 kHz', 'un son audible : 50 est entre 20 et 20 000', 'un infrason : 50 est inférieur à 20 000', 'un son audible : 50 kHz est bien plus grand que 20 Hz'], bonne: 0,
    expl: '50 kHz = 50 000 Hz, ce qui dépasse 20 kHz = 20 000 Hz : c’est un ultrason, inaudible pour nous. Il faut comparer des fréquences dans la même unité, et non 50 et 20 000.',
    indice: 'Mettez 50 kHz en hertz (1 kHz = 1 000 Hz), puis comparez avec 20 Hz et 20 000 Hz.' },
};
