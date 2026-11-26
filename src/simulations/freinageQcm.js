// QCM du parcours guidé de la simulation 260 (distance de freinage, TSTL). `bonne` = indice de la bonne option.
export const QCM = {
  frein: {
    options: ['résistant (négatif) : la force est opposée au déplacement du véhicule', 'moteur (positif) : la force agit sur le véhicule et fait changer sa vitesse', 'nul : le véhicule ne se déplace plus à la fin du freinage', 'nul, car la force est perpendiculaire à la route plane'],
    bonne: 0 },
  arret: {
    options: ['négative : ΔEc = 0 − Ec initiale, donc ΔEc = − Ec initiale < 0', 'nulle, car l’énergie cinétique finale du véhicule est nulle', 'positive : le véhicule a reçu de l’énergie de la part des freins', 'égale à son énergie cinétique initiale, avec un signe positif'],
    bonne: 0 },
  theoreme: {
    options: ['la force de freinage seule : le poids et la réaction normale sont perpendiculaires', 'le poids et la force de freinage, car le poids agit toujours sur le véhicule en mouvement', 'la réaction de la route et la force de freinage, car la route retient le véhicule', 'aucune force : un véhicule qui s’arrête garde la même énergie'],
    bonne: 0 },
  double: {
    options: ['4, car l’énergie cinétique est proportionnelle au carré de la vitesse', '2, car la vitesse a doublé et la distance lui est proportionnelle', '8, car l’énergie cinétique est proportionnelle au cube de la vitesse', '1 : la force de freinage ne dépend pas de la vitesse, la distance non plus'],
    bonne: 0 },
  masse: {
    options: ['multipliée par 2 : le véhicule a deux fois plus d’énergie à dissiper', 'multipliée par 4, car la distance dépend du carré de la masse', 'divisée par 2, car un véhicule plus lourd est plus difficile à déplacer', 'inchangée, car la force de freinage et la vitesse sont les mêmes'],
    bonne: 0 },
  mouille: {
    options: ['multipliée par 2 : même énergie dissipée par une force deux fois plus faible', 'divisée par 2, car le véhicule roule moins vite sur une route mouillée', 'multipliée par 4, car la force de freinage intervient au carré dans le calcul', 'inchangée, car l’énergie cinétique à dissiper est la même'],
    bonne: 0 },
  descente: {
    options: ['plus grande : le poids est moteur et compense une partie du freinage', 'plus petite : le poids aide le véhicule à s’arrêter, puisqu’il descend', 'identique, car le poids est perpendiculaire à la route inclinée', 'identique : seul le freinage a un travail dans tous les cas de route'],
    bonne: 0 },
};
