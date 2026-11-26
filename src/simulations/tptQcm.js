// QCM du parcours guidé de la simulation 297 (bonne réponse en tête, mélangée par le composant ; ni la plus longue ni la plus courte).
export const QCM_PARCOURS = {
  montage: { options: [
    'Aucune couleur nette ne signale la fin de la réaction : on suit le potentiel de la solution',
    'Le cérium(IV) est incolore, donc il faut obligatoirement un voltmètre pour le voir',
    'Le voltmètre permet de verser plus vite sans risquer de dépasser l’équivalence ni de se tromper',
    'La mesure de tension remplace la burette : on n’a plus besoin de lire le volume versé'], bonne: 0 },
  reaction: { options: [
    'Ce⁴⁺ : son couple a le potentiel standard le plus élevé (1,44 V contre 0,77 V)',
    'Fe²⁺ : il cède un électron au cérium et se transforme en Fe³⁺ pendant la réaction',
    'Fe³⁺ : c’est lui qui est formé et son potentiel standard est le plus petit des deux',
    'Ce³⁺ : c’est l’espèce qui reste dans la burette avant le début du dosage de la solution'], bonne: 0 },
  saut: { options: [
    'Le réactif dosé est entièrement consommé : le rapport [Ox]/[Red] qui fixe E change brutalement',
    'La solution change de couleur en passant du jaune au rouge, ce qui perturbe l’électrode de platine',
    'Le volume de la solution double à ce moment-là et la tension mesurée double aussi',
    'L’électrode de référence se met à réagir avec le cérium(IV) en excès versé dans le bécher'], bonne: 0 },
};
