// QCM du parcours guidé de la simulation « Le diagramme de chromaticité xy ».
// Ordre FIXE : place de la bonne réponse choisie à la main (équilibrée, jamais deux fois de suite à la même place), jamais la plus longue.
const mk = (pos, bonne, ...autres) => ({ ordreFixe: true, bonne: pos, options: [...autres.slice(0, pos), bonne, ...autres.slice(pos)] });
export const QCM = {
  locus: mk(1, 'Sur la courbe en cloche, le lieu spectral',
    'À l’intérieur du diagramme, près du point blanc, là où les couleurs sont pâles',
    'Sur la droite qui ferme le diagramme en bas, entre le violet et le rouge',
    'Un peu partout dans le diagramme, selon la luminance de la lumière'),
  pourpres: mk(3, 'En mélangeant du rouge et du violet',
    'Avec une lumière monochromatique, de longueur d’onde choisie entre 500 et 550 nm',
    'En ajoutant de la lumière blanche à une lumière verte',
    'On ne peut pas l’obtenir : le magenta n’est pas une couleur de lumière'),
  blanc: mk(0, 'Il se rapproche du blanc : la couleur est plus pâle',
    'Il reste sur la courbe, mais la couleur devient plus claire',
    'Il se déplace vers le bleu : la couleur est plus vive',
    'Il quitte la droite blanc–bleu : la teinte change vers le jaune'),
  gamut: mk(2, 'Ce point est hors du triangle des trois primaires de l’écran',
    'Les écrans n’ont pas de primaire verte : ils n’utilisent que du rouge et du bleu',
    'Ce point est dans le triangle, mais l’écran n’est pas assez lumineux pour l’afficher',
    'Le vert à 520 nm est un pourpre, que l’écran ne sait afficher qu’avec du blanc'),
  lum: mk(1, 'Seulement leur clarté : même teinte et même saturation',
    'Seulement leur teinte : x et y fixent la clarté, pas la couleur',
    'Leur saturation, car Y mesure la pureté de la couleur',
    'Rien : x et y suffisent à décrire complètement une couleur'),
};
