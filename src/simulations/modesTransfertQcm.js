// QCM du parcours guidé de la simulation 245 (travail ou transfert thermique, TSTL). `bonne` = indice de la bonne option.
export const QCM = {
  deux: {
    options: ['par travail : elle exerce une force qui fait varier la vitesse', 'par transfert thermique : la main est plus chaude que le chariot', 'par rayonnement, car la main est proche du chariot', 'elle ne transfère rien : l’énergie vient du chariot lui-même'],
    bonne: 0 },
  meca: {
    options: ['un frein qui ralentit une roue en rotation', 'une pierre posée sur une table immobile qui la porte', 'une casserole posée sur une plaque chaude qui chauffe', 'un fil parcouru par un courant électrique'],
    bonne: 0 },
  elec: {
    options: ['par un courant électrique : c’est un travail électrique', 'par rayonnement, puisque la lampe éclaire', 'par conduction thermique, à travers les fils métalliques', 'par convection, car l’air autour de la lampe chauffe'],
    bonne: 0 },
  conduction: {
    options: ['par conduction : la chaleur se propage de proche en proche', 'par convection : la matière de la barre se déplace', 'par rayonnement : la barre émet des ondes vers l’eau', 'par travail mécanique : l’eau exerce une force sur la barre'],
    bonne: 0 },
  convection: {
    options: ['par convection : l’eau en mouvement transporte la chaleur', 'par conduction : la chaleur passe de proche en proche, sans mouvement', 'par travail électrique : un courant circule dans l’eau', 'par rayonnement : le fond de la cuve éclaire l’eau'],
    bonne: 0 },
  matiere: {
    options: ['non : le métal ne s’écoule pas, c’est la conduction', 'oui : tout corps chauffé transporte la chaleur par convection, même solide', 'oui, mais seulement si le bloc est très chaud', 'non : la chaleur ne se propage pas dans un solide du tout'],
    bonne: 0 },
  rayonnement: {
    options: ['par rayonnement : des ondes qui n’ont pas besoin de matière', 'par conduction : la chaleur passe de proche en proche', 'par convection : de la matière chauffée se déplace jusqu’à la sonde, à travers l’espace', 'par travail mécanique : le Soleil exerce une force sur la sonde'],
    bonne: 0 },
  melange: {
    options: ['travail électrique, puis conduction vers le fond', 'conduction dans la plaque, puis travail électrique vers le fond de la casserole', 'rayonnement de la plaque, puis convection', 'travail mécanique de la plaque, puis conduction'],
    bonne: 0 },
};
