// QCM du parcours guidé de la simulation « Couleur : L*, a*, b* et écart de couleur ».
// Ordre FIXE : place de la bonne réponse choisie à la main (équilibrée, jamais deux fois de suite à la même place), jamais la plus longue.
const mk = (pos, bonne, ...autres) => ({ ordreFixe: true, bonne: pos, options: [...autres.slice(0, pos), bonne, ...autres.slice(pos)] });
export const QCM = {
  lum: mk(2, 'Plus foncé : L* diminue quand la couleur s’assombrit',
    'Plus clair : une valeur faible de L* signifie beaucoup de lumière renvoyée',
    'Plus saturé : L* mesure la pureté de la couleur',
    'Identique : seuls a* et b* décrivent l’aspect d’une couleur'),
  plan: mk(0, 'Rouge, car a* est positif et grand',
    'Vert, car a* est positif et grand, comme pour le vert',
    'Jaune, car b* est positif, ce qui correspond au jaune',
    'Bleu, car b* est petit devant a*'),
  sat: mk(3, 'Plus saturé : même teinte, couleur plus vive',
    'Plus clair, avec la même teinte et la même vivacité',
    'D’une autre teinte, plus rouge, mais aussi vive qu’avant',
    'Plus terne : sa couleur se rapproche du gris'),
  ecart: mk(1, 'Il est plus foncé, plus rouge et plus bleu',
    'Il est plus clair, plus rouge et plus bleu',
    'Il est plus foncé, plus vert et plus bleu',
    'Il est plus foncé, plus rouge et plus jaune'),
  tolerance: mk(0, 'Non : 3,0 dépasse la tolérance de 1,5',
    'Oui : le plus grand des trois écarts ΔL*, Δa*, Δb* ne dépasse pas 2',
    'Oui : ΔL* ne vaut que −1, ce qui est inférieur à 1,5',
    'Oui : ΔE*ab s’exprime en pourcentage, et 3,0 % est très faible'),
  cmc: mk(2, 'La tolérance est une ellipsoïde, plus étroite en teinte qu’en saturation',
    'ΔE*ab ignore la luminosité, que la tolérance CMC prend en compte',
    'Le lot décalé en teinte est plus clair que celui décalé en saturation',
    'La tolérance CMC dépend de l’appareil utilisé, pas de la couleur de la cible'),
};
