// QCM du parcours guidé de la simulation 216 (fichier séparé pour contrôler par script la longueur des options). La bonne réponse est toujours en première position (mélangée à l'affichage).
export const QCM_PARCOURS = {
  systeme: { options: ['l’eau du bécher, et rien d’autre', 'l’eau, le bécher et la plaque chauffante', 'la plaque chauffante et l’air de la pièce', 'la paillasse sur laquelle le bécher est posé'], bonne: 0 },
  micro: { options: ['l’agitation désordonnée des molécules et leurs interactions', 'la vitesse du bécher quand on le déplace', 'la hauteur du bécher au-dessus du sol', 'le poids de l’eau contenue dans le bécher'], bonne: 0 },
  temperature: { options: ['l’énergie interne augmente, car l’agitation augmente', 'l’énergie interne diminue, car les molécules s’écartent', 'l’énergie interne ne change pas, seule T change', 'l’énergie interne augmente, car la masse augmente'], bonne: 0 },
  sens: { options: ['du cuivre (plus chaud) vers l’eau (plus froide)', 'de l’eau (plus froide) vers le cuivre (plus chaud)', 'dans les deux sens, à parts égales, dès le début', 'il n’y en a pas : le cuivre est un solide'], bonne: 0 },
  modes: { options: ['la pale qui brasse l’eau (travail)', 'la plaque chauffante sous le bécher (chaleur)', 'l’air chaud de la pièce autour du bécher', 'l’eau plus chaude versée dans le bécher'], bonne: 0 },
  prevoir: { options: ['le cuivre, car sa capacité thermique massique est plus faible', 'l’eau, car sa capacité thermique massique est plus grande', 'les deux de la même façon, car ils reçoivent la même énergie', 'le cuivre, car il est plus dense que l’eau'], bonne: 0 },
};
export function texteRendu(n) {
  if (n == null || n === false) return '';
  if (typeof n === 'string' || typeof n === 'number') return String(n).replace(/_/g, '');
  if (Array.isArray(n)) return n.map(texteRendu).join('');
  if (n.type === 'mfrac') return [].concat(n.props.children).map(texteRendu).join('');
  return texteRendu(n.props?.children);
}
