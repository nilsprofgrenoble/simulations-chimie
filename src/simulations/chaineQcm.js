// QCM du parcours guidé de la simulation 233 (chaîne énergétique et rendement, TSTL). `bonne` = indice de la bonne option.
export const QCM = {
  convertisseur: {
    options: ['parce que son énergie stockée ne varie pas : il cède autant d’énergie qu’il en reçoit', 'parce qu’il stocke de l’énergie électrique qu’il restitue plus tard, comme le ferait une batterie', 'parce qu’il ne reçoit aucune énergie : il la produit lui-même', 'parce que son énergie stockée augmente puis diminue au cours du temps'],
    bonne: 0 },
  dissipe: {
    options: ['sous forme de transfert thermique : le moteur chauffe et cède de la chaleur à l’air', 'il reste stocké dans le moteur, qui en garde une partie à chaque tour', 'il disparaît : cette partie de l’énergie est perdue pour toujours, sans aller nulle part', 'sous forme de travail mécanique supplémentaire, utile à la charge soulevée'],
    bonne: 0 },
  limite: {
    options: ['c’est impossible : l’énergie utile ne peut pas dépasser l’énergie reçue', 'c’est possible si le moteur est très bien conçu et bien entretenu, avec des roulements parfaits', 'c’est possible, car la chaleur produite par le moteur est elle aussi une énergie utile', 'c’est possible, mais seulement si le moteur fonctionne à vide'],
    bonne: 0 },
  serie: {
    options: ['plus petit que chacun des deux rendements, car des pertes s’ajoutent à chaque étape', 'égal à la moyenne des deux rendements, soit 77,5 %', 'égal au plus grand des deux rendements, car le moteur compense les pertes du chargeur', 'supérieur à chacun des deux, car les deux convertisseurs travaillent ensemble'],
    bonne: 0 },
  utile: {
    options: ['le transfert thermique cédé à la casserole, car la plaque est conçue pour chauffer', 'le travail électrique reçu du secteur, car c’est le plus grand des transferts de la chaîne', 'le transfert thermique cédé à l’air de la cuisine, qui se réchauffe peu à peu', 'aucun : une plaque de cuisson ne cède pas d’énergie, elle la stocke'],
    bonne: 0 },
};
