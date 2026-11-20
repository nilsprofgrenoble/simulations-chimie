// QCM du parcours guidé de la simulation « Niveau sonore et dangers de l'exposition » (sim 192, 2GT).
// Fichier sans React : la longueur des options est contrôlée par un script (la bonne réponse n'est jamais la plus longue).
// bonne : indice de la bonne réponse dans options.
export const QCM = {
  amplitude: {
    q: 'Les sons C, D et E ont la même note. Lequel est le plus fort ?',
    options: ['Le son D', 'Le son C', 'Le son E', 'Ils sont tous aussi forts'], bonne: 0,
    expl: 'Le son D a la plus grande amplitude : sa courbe monte et descend le plus loin. Plus l’amplitude est grande, plus l’intensité du son est grande, donc plus il est fort.',
    indice: 'Regardez jusqu’où chaque courbe monte et descend : plus elle s’écarte de la ligne en pointillés, plus l’amplitude est grande.' },
  niveau: {
    q: 'Quel son a la plus grande amplitude ?',
    options: ['Le son B', 'Le son A', 'Les deux ont la même amplitude', 'On ne peut pas le savoir'], bonne: 0,
    expl: 'Le sonomètre affiche un niveau plus élevé pour le son B (70 dB contre 50 dB) : son intensité est plus grande, donc sa vibration a une plus grande amplitude (même haut-parleur, même distance).',
    indice: 'Un niveau en dB plus élevé veut dire une intensité plus grande. Et une intensité plus grande vient d’une plus grande amplitude.' },
  deuxsources: {
    q: 'Une moto fait 80 dB. Deux motos identiques roulent côte à côte, en même temps. Quel niveau mesure-t-on environ ?',
    options: ['Environ 83 dB', 'Exactement 160 dB : le double de 80 dB', 'Environ 90 dB : 10 dB de plus', 'Toujours 80 dB : rien ne change'], bonne: 0,
    expl: 'Deux motos identiques apportent deux fois plus d’intensité (× 2), ce qui correspond à environ + 3 dB : 80 + 3 = 83 dB. On n’additionne pas les niveaux (160 dB serait un son insupportable).',
    indice: 'Repère : une intensité multipliée par 2 correspond à environ + 3 dB. Ajoutez ces 3 dB au niveau d’une seule moto.' },
  distance: {
    q: 'À 1 m de l’enceinte, le sonomètre affiche 90 dB. On le recule à 4 m. Quelle valeur peut-il afficher ?',
    options: ['78 dB', '90 dB', '96 dB', '102 dB'], bonne: 0,
    expl: 'Plus on s’éloigne de la source, plus le niveau diminue : seul un nombre plus petit que 90 dB est possible. Ici, le sonomètre affiche environ 78 dB.',
    indice: 'Le son s’affaiblit quand on s’éloigne de l’enceinte. Le nombre affiché sera-t-il plus grand ou plus petit que 90 ?' },
  dangers: {
    q: 'Marc travaille depuis des années dans un atelier très bruyant, sans protection. Il n’entend plus les sons aigus, même quand il est au calme. Quel danger l’a touché ?',
    options: ['Une surdité', 'Une fatigue auditive', 'Un acouphène', 'Un écho'], bonne: 0,
    expl: 'Marc entend moins bien depuis des années, même au calme : sa perte d’audition ne revient pas, c’est une surdité. La fatigue auditive, elle, passe après un moment de repos, et un acouphène est un sifflement.',
    indice: 'Une fatigue auditive disparaît après un moment de repos. Ici, le problème dure depuis des années, même au calme.' },
  duree: {
    q: 'Léa reste 2 h dans un concert à 100 dB. Par rapport à la durée repère de ce niveau, c’est…',
    options: ['au-dessus de la durée repère', 'dans la durée repère de 2 h', 'sans risque : le niveau ne compte pas', 'sans danger, car c’est de la musique'], bonne: 0,
    expl: 'À 100 dB, la durée repère est d’environ 15 min : 2 h, c’est 8 fois plus long. Léa dépasse largement le repère : son audition est en danger si elle ne se protège pas.',
    indice: 'Cherchez la ligne 100 dB sur le graphique : quelle durée est indiquée ? Comparez-la à 2 h (120 min).' },
  protections: {
    q: 'Au concert, quel geste protège le mieux les oreilles ?',
    options: ['Porter des bouchons d’oreille adaptés', 'Se coller aux enceintes pour mieux entendre', 'Écouter la musique encore plus fort', 'Attendre que les oreilles s’habituent'], bonne: 0,
    expl: 'Des bouchons d’oreille adaptés baissent le niveau qui arrive à l’oreille. S’éloigner des enceintes aide aussi. Au contraire, les oreilles ne s’habituent pas : elles s’abîment, souvent sans douleur.',
    indice: 'Pour protéger l’oreille, il faut diminuer le niveau sonore qui l’atteint. Quelle option le fait ?' },
  smartphone: {
    q: 'Dans la cantine, l’application affiche 76 dB. Quelle conclusion est correcte ?',
    options: ['Environ 76 dB, à quelques dB près', 'Exactement 76,0 dB, partout dans la salle', 'Le niveau ne peut pas être mesuré ainsi', 'Plus de 120 dB : le micro est trop sensible'], bonne: 0,
    expl: 'Le smartphone donne une valeur indicative : à quelques dB près, à l’endroit et au moment de la mesure. Pour une mesure plus sûre, on la répète à plusieurs endroits.',
    indice: 'Le micro d’un smartphone n’est pas un appareil de précision : peut-on garantir la valeur exacte et la même partout ?' },
};
