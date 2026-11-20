// QCM du parcours guidé de la simulation 215 (fichier séparé pour contrôler par script la longueur des options).
export const QCM_PARCOURS = {
  echelles: { options: ['la pression exercée par le gaz sur la paroi', 'la vitesse d’une molécule précise', 'la position d’une molécule à un instant donné', 'la direction d’une molécule entre deux chocs'], bonne: 0 },
  chocs: { options: ['les chocs sur la paroi sont plus nombreux', 'chaque choc sur la paroi est plus violent', 'les molécules vont plus vite qu’avant', 'les molécules se repoussent plus fortement'], bonne: 0 },
  agitation: { options: ['les molécules vont en moyenne plus vite', 'les molécules grossissent et se serrent davantage', 'chaque molécule devient plus lourde', 'les molécules se rapprochent les unes des autres'], bonne: 0 },
  modele: { options: ['chacune continue sans être influencée par l’autre', 'elles s’attirent légèrement puis s’éloignent', 'elles se repoussent fortement à courte distance', 'elles se lient provisoirement avant de se séparer ensuite'], bonne: 0 },
  unites: { options: ['P en Pa, V en m³, T en K', 'P en bar, V en L, T en °C', 'P en hPa, V en mL, T en K', 'P en Pa, V en L, T en K'], bonne: 0 },
  prevoir: { options: ['(a) P double ; (b) P double', '(a) P double ; (b) P est divisée par 2', '(a) P est divisée par 2 ; (b) P double', '(a) P fixe ; (b) P double'], bonne: 0 },
  limites: { options: ['aux petits volumes, donc aux hautes pressions', 'aux grands volumes, donc à basse pression', 'partout de la même façon, quel que soit le volume', 'seulement quand la température est très élevée'], bonne: 0 },
};

// Longueur visuelle d'une option (texte rendu)
export function texteRendu(n) {
  if (n == null || n === false) return '';
  if (typeof n === 'string' || typeof n === 'number') return String(n).replace(/_/g, '');
  if (Array.isArray(n)) return n.map(texteRendu).join('');
  if (n.type === 'mfrac') return [].concat(n.props.children).map(texteRendu).join('');
  return texteRendu(n.props?.children);
}
