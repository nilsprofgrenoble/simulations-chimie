// QCM du parcours guidé de la simulation 238 (conservation de l'énergie, signe des transferts, TSTL). `bonne` = indice de la bonne option.
export const QCM = {
  origine: {
    options: ['de transferts avec d’autres systèmes : ici, du travail électrique reçu', 'de lui-même : un corps qui chauffe crée de l’énergie interne, sans aucun apport', 'de l’air de la pièce, qui lui cède forcément de la chaleur, même s’il est plus froid', 'de rien : aucun autre système n’a besoin d’en perdre'],
    bonne: 0 },
  mode: {
    options: ['par travail électrique : un courant circule dans la résistance', 'par transfert thermique par conduction, de la batterie vers le bloc', 'par rayonnement : la batterie éclaire le bloc de cuivre', 'elle ne cède rien : le bloc fabrique son énergie tout seul'],
    bonne: 0 },
  sens: {
    options: ['du bloc vers l’air, car le bloc est plus chaud que l’air', 'de l’air vers le bloc, car l’air entoure le bloc de cuivre', 'dans les deux sens à la fois, avec la même valeur', 'il n’y en a pas : l’air est un très mauvais conducteur de la chaleur'],
    bonne: 0 },
  autre: {
    options: ['+300 J : l’air reçoit l’énergie que le bloc cède', '−300 J : un transfert thermique est toujours négatif', '0 J : l’air ne stocke pas d’énergie', '+500 J : on ajoute l’énergie interne du bloc'],
    bonne: 0 },
  sensvar: {
    options: ['elle augmente, car ΔU est positive pour le bloc de cuivre', 'elle diminue, car le bloc cède de la chaleur à l’air', 'elle ne change pas, car le bloc reçoit autant qu’il cède', 'on ne peut rien dire sans connaître la masse du bloc de cuivre'],
    bonne: 0 },
  regime: {
    options: ['constante : ΔU = 0, car il cède autant qu’il reçoit', 'elle augmente sans fin, car le bloc reçoit toujours du travail', 'elle diminue, car le bloc cède de l’énergie à l’air', 'elle baisse jusqu’à la température de la batterie'],
    bonne: 0 },
  total: {
    options: ['0 J : l’énergie perdue par l’un est gagnée par les autres', '+800 J : c’est l’énergie fournie par la batterie au bloc', '−800 J : la batterie perd de l’énergie, les autres n’en gagnent pas', '+500 J : seule la variation d’énergie du bloc de cuivre compte'],
    bonne: 0 },
};
