// QCM du parcours guidé de la simulation 217 (fichier séparé pour contrôler par script la longueur des options). La bonne réponse est toujours en première position (mélangée à l'affichage).
export const QCM_PARCOURS = {
  conduction: { options: ['la conduction : l’énergie passe de proche en proche', 'la convection : le métal chaud se déplace jusqu’à la main', 'le rayonnement : le métal chaud émet de la lumière visible', 'aucun : le métal est un solide et ne transfère rien'], bonne: 0 },
  convection: { options: ['la convection : de l’air en mouvement transporte l’énergie', 'la conduction : l’énergie passe de proche en proche dans le mur', 'le rayonnement : l’air chaud émet une lumière visible', 'aucun : l’air est un mauvais conducteur'], bonne: 0 },
  rayonnement: { options: ['le rayonnement : des ondes traversent le vide', 'la conduction : l’énergie passe de proche en proche dans le vide', 'la convection : un fluide chaud se déplace entre les deux astres', 'aucun : sans matière, rien ne peut être transféré'], bonne: 0 },
  sens: { options: ['de la pièce (20 °C) vers l’extérieur (5 °C)', 'de l’extérieur (5 °C) vers la pièce (20 °C)', 'dans les deux sens, à parts égales', 'dans aucun sens : la paroi est un isolant parfait'], bonne: 0 },
  prevoir: { options: ['il est inchangé', 'il est multiplié par 2', 'il est divisé par 2', 'il est multiplié par 4'], bonne: 0 },
};
export function texteRendu(n) {
  if (n == null || n === false) return '';
  if (typeof n === 'string' || typeof n === 'number') return String(n).replace(/_/g, '');
  if (Array.isArray(n)) return n.map(texteRendu).join('');
  if (n.type === 'mfrac') return [].concat(n.props.children).map(texteRendu).join('');
  return texteRendu(n.props?.children);
}
