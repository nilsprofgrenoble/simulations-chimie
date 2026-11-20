// QCM du parcours guidé de la simulation 177 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici,
// n'est ni la plus courte ni la plus longue ; longueurs comptées sur le texte rendu ; l'affichage mélange l'ordre des choix).
export const QCM_PARCOURS = {
  force: { options: [
    'vers le centre de la Terre, selon la droite joignant les deux corps',
    'tangente à la trajectoire, dirigée dans le sens du mouvement du satellite',
    'à l’opposé de la Terre, selon la droite qui joint leurs centres',
    'perpendiculaire au plan de l’orbite, vers le pôle nord de la Terre',
  ], bonne: 0 },
  accel: { options: [
    'vers le centre de la Terre, de norme frac(G M|r²), sans dépendre de sa masse',
    'vers le centre de la Terre, de norme frac(G m M|r²) : elle croît avec m',
    'tangente à la trajectoire, de norme frac(G M|r²), dans le sens du mouvement du satellite',
    'nulle, puisque le satellite reste toujours à la même altitude',
  ], bonne: 0 },
  uniforme: { options: [
    'a_t = 0 : la vitesse garde la même valeur v (mouvement uniforme)',
    'a_t = 0 : le satellite est immobile sur son orbite, à altitude constante',
    'a_t > 0 : la valeur v de la vitesse augmente au cours du mouvement',
    'a_t = frac(v²|r) : la valeur de la vitesse change à chaque instant',
  ], bonne: 0 },
  kepler3: { options: [
    'frac(T²|r³) = frac(4π²|G M) : la même valeur pour tous les satellites de cet astre central',
    'frac(T²|r³) = frac(4π²|G m), avec m la masse du satellite : valeur propre à chacun',
    'frac(T²|r²) = frac(4π²|G M) : la même valeur pour tous les satellites de cet astre',
    'frac(T|r) = frac(2π|v) : le rapport de T à r est le même pour tous les satellites de l’astre',
  ], bonne: 0 },
  geo: { options: [
    'dans le plan de l’équateur, dans le sens de rotation de la Terre, avec T égale au jour sidéral',
    'dans le plan de l’équateur, dans le sens opposé à la rotation de la Terre, avec T égale au jour sidéral',
    'dans un plan quelconque contenant le centre de la Terre, avec T égale au jour sidéral',
    'dans un plan passant par les pôles, dans un sens quelconque, avec T égale à un demi-jour sidéral',
  ], bonne: 0 },
  aires: { options: [
    'A₁ = A₂ : le satellite va plus vite sur le premier arc, plus proche de l’astre',
    'A₁ > A₂ : le premier arc est plus long, donc l’aire balayée est plus grande',
    'A₁ < A₂ : le rayon est plus grand sur le second arc, donc l’aire est plus grande',
    'A₁ = A₂ : le satellite a la même vitesse sur les deux arcs de l’orbite',
  ], bonne: 0 },
};

// texte rendu d'une option (fractions aplaties) pour le contrôle de longueur ; une fraction compte pour la plus longue de ses deux parties
export function texteRendu(n) {
  if (n == null || n === false) return '';
  if (typeof n === 'string' || typeof n === 'number') return String(n).replace(/frac\(([^|]*)\|([^)]*)\)/g, (_, a, b) => (a.length > b.length ? a : b)).replace(/_/g, '');
  if (Array.isArray(n)) return n.map(texteRendu).join('');
  if (n.type === 'mfrac') { const [a, b] = [].concat(n.props.children).map(texteRendu); return a.length > b.length ? a : b; }
  return texteRendu(n.props?.children);
}
