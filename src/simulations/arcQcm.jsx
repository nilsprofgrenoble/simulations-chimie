// QCM du parcours guidé de la simulation 213 (fichier séparé pour contrôler par script la longueur des options).
// Jamais « vec(Π) » dans une chaîne : avecIndices ne reconnaît que les lettres latines et grecques courtes de la forme vec(A-Za-zΔ) ; pour Π on écrit « la poussée ».
export const QCM_PARCOURS = {
  forces: { options: ['son poids, la tension du fil et l’action de l’eau', 'son poids et la tension du fil seulement', 'son poids et l’action de l’eau, sans le fil', 'son poids, la tension du fil et l’action de l’air ambiant'], bonne: 0 },
  pressions: { options: ['plus grande sur la face du bas', 'plus grande sur la face du haut', 'égales sur les deux faces', 'nulle sur la face du haut'], bonne: 0 },
  resultante: { options: ['verticale, dirigée vers le haut', 'verticale, dirigée vers le bas', 'de valeur nulle', 'horizontale, dirigée vers le côté'], bonne: 0 },
  signe: { options: ['de sens contraire à vec(g) : vers le haut', 'de même sens que vec(g) : vers le bas', 'sa norme est négative quand le solide est immergé', 'elle diminue quand le volume immergé augmente'], bonne: 0 },
  tester: { options: ['Π est proportionnelle à V immergé', 'Π augmente, mais pas proportionnellement', 'Π ne dépend pas de V immergé', 'Π diminue quand V immergé augmente'], bonne: 0 },
  nature: { options: ['elle reste égale à 9,8 N', 'elle est multipliée par 2,9', 'elle devient 2,9 fois plus faible', 'elle devient nulle'], bonne: 0 },
  equilibre: { options: ['il monte jusqu’à la surface', 'il coule jusqu’au fond', 'il reste immobile entre deux eaux', 'il oscille autour de sa position'], bonne: 0 },
  fluide: { options: ['moins enfoncé qu’avant', 'plus enfoncé qu’avant', 'enfoncé autant qu’avant', 'complètement sous l’eau'], bonne: 0 },
};

// Longueur visuelle d'une option (les « _ » ne s'affichent pas)
export function texteRendu(n) {
  if (n == null || n === false) return '';
  if (typeof n === 'string' || typeof n === 'number') return String(n).replace(/_/g, '');
  if (Array.isArray(n)) return n.map(texteRendu).join('');
  if (n.type === 'mfrac') return [].concat(n.props.children).map(texteRendu).join('');
  return texteRendu(n.props?.children);
}
