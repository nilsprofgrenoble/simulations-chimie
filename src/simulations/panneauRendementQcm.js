// QCM du parcours guidé de la simulation 228 (rendement d'un panneau photovoltaïque, TSTL). `bonne` = indice de la bonne option (le cadre les mélange à l'affichage).
// Fichier à part pour contrôler par script que la bonne réponse n'est jamais la plus longue ni la plus courte.
export const QCM = {
  chaine: {
    options: ['elle est stockée dans le panneau et pourra être restituée plus tard sous forme électrique', 'elle est perdue, surtout sous forme de chaleur et de lumière non utilisée par la cellule', 'elle s’ajoute à la puissance électrique, qui est donc plus grande que la lumière reçue', 'elle disparaît, car l’énergie n’est pas conservée dans une cellule photovoltaïque'],
    bonne: 1 },
  point: {
    options: ['parce que la résistance R modifie l’éclairement que reçoit le panneau', 'parce que la puissance U × I dépend du point de fonctionnement choisi', 'parce que la surface du panneau diminue quand la résistance augmente', 'parce que la lampe s’éteint progressivement quand R devient très grande'],
    bonne: 1 },
  eclairE: {
    options: ['il est divisé par 2,5, comme l’éclairement, car tout est proportionnel', 'il reste voisin, car la puissance électrique suit à peu près la lumière', 'il est multiplié par 2,5, car il y a moins de pertes à faible éclairement', 'il devient nul dès que l’éclairement passe sous 500 W/m², faute de lumière'],
    bonne: 1 },
  facteurs: {
    options: ['le panneau fournit plus d’énergie électrique qu’il n’en reçoit sous forme de lumière', 'le rendement du panneau dépasse 100 %, ce qui est possible pour un bon panneau', 'la résistance branchée chauffe le panneau, ce qui diminue la lumière reçue', 'une partie de la lumière devient de la chaleur au lieu de devenir de l’électricité'],
    bonne: 3 },
};
