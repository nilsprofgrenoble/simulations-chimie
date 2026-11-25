// QCM du parcours « Effet photoélectrique » (sim 240). La bonne réponse est l'option 0 (mélangée à l'affichage) ; jamais la plus longue (contrôle : pheTirages.test.mjs).
export const QCM_PARCOURS = {
  photon: { options: ['le photon violet : sa fréquence est la plus grande', 'le photon rouge : sa longueur d’onde est la plus petite', 'le photon vert : il est au milieu du spectre', 'aucun : les trois vont à la même vitesse c'], bonne: 0 },
  seuil: { options: ['l’énergie h ν d’un photon rouge est inférieure à W', 'la lumière rouge est trop intense et bloque les électrons', 'un électron additionne l’énergie de plusieurs photons rouges', 'la lumière rouge chauffe la plaque et piège les électrons'], bonne: 0 },
  intensite: { options: ['le nombre double ; Ec,max reste la même', 'le nombre ne change pas ; Ec,max double', 'le nombre et Ec,max doublent tous les deux', 'rien ne change : seule la fréquence compte'], bonne: 0 },
  frequence: { options: ['elle augmente, car h ν augmente et W ne change pas', 'elle diminue, car la lumière violette est plus absorbée', 'elle ne change pas : seule l’intensité compte', 'elle augmente seulement si l’on augmente l’intensité'], bonne: 0 },
  droite: { options: ['la fréquence seuil ν₀ : en dessous, aucun électron', 'le travail d’extraction W du métal, exprimé en hertz', 'la fréquence pour laquelle le photon devient invisible', 'l’intensité minimale de la lumière pour éjecter un électron'], bonne: 0 },
  histoire: { options: ['il révèle un aspect particulaire de la lumière', 'il prouve que la lumière n’est pas une onde du tout', 'il montre que les électrons vont à la vitesse c', 'il a permis de mesurer la vitesse de la lumière'], bonne: 0 },
  cellule: { options: ['il double : deux fois plus d’électrons par seconde', 'il ne change pas : il ne dépend que de la fréquence', 'il double, car chaque électron a deux fois plus d’énergie', 'il est divisé par deux : les photons se gênent'], bonne: 0 },
};
