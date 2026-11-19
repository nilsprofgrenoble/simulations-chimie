// QCM du parcours guidé de la simulation « Oxydo-réduction » (sim 156). Fichier sans React : la longueur des options est contrôlée par un script
// (la bonne réponse n'est jamais la plus longue). bonne : indice de la bonne réponse dans options.
export const QCM = {
  role: {
    q: 'Un atome de fer Fe devient un ion Fe²⁺ et des ions Cu²⁺ deviennent des atomes Cu. Quel rôle joue le fer dans cette transformation ?',
    options: ['réducteur : il cède des électrons à l’ion cuivre(II)', 'oxydant : il cède des électrons à l’ion cuivre(II)', 'oxydant : il capte des électrons fournis par le cuivre', 'réducteur : il capte des électrons fournis par le cuivre'], bonne: 0,
    expl: 'Le fer perd deux électrons pour devenir Fe²⁺ : il CÈDE des électrons, c’est donc un réducteur. Ce sont les ions Cu²⁺ qui les captent : ils jouent le rôle d’oxydant.',
    indice: 'Un réducteur est une espèce capable de céder des électrons, un oxydant est capable d’en capter. Le fer gagne-t-il ou perd-il des électrons en devenant Fe²⁺ ?' },
  demiCu: {
    q: 'Quelle écriture modélise le couple Cu²⁺/Cu, l’oxydant étant écrit à gauche du signe égal ?',
    options: ['Cu²⁺ + 2 e⁻ = Cu', 'Cu²⁺ + e⁻ = Cu', 'Cu²⁺ = Cu + 2 e⁻', 'Cu + 2 e⁻ = Cu²⁺'], bonne: 0,
    expl: 'Ox + n e⁻ = Red : les électrons sont du côté de l’oxydant. Pour Cu²⁺ (charge +2), il en faut 2 : la charge totale est +2 − 2 = 0 à gauche, comme celle de l’atome Cu à droite. La demi-équation conserve l’élément cuivre ET la charge.',
    indice: 'Compte la charge totale de chaque côté du signe égal : un électron porte la charge −1. Elle doit être la même à gauche et à droite.' },
  oxred: {
    q: 'Une réduction est un gain d’électrons. Un atome de fer devient Fe²⁺ en perdant deux électrons. Comment nomme-t-on ce passage ?',
    options: ['une oxydation : le fer perd des électrons', 'une réduction : le fer perd des électrons', 'une oxydation : le fer capte des électrons', 'une réduction : le fer capte des électrons'], bonne: 0,
    expl: 'Fe → Fe²⁺ + 2 e⁻ : le fer PERD des électrons, c’est une oxydation. L’inverse, un gain d’électrons (Cu²⁺ + 2 e⁻ → Cu), est une réduction.',
    indice: 'Réduction = gain d’électrons. Que se passe-t-il ici : le fer gagne-t-il ou perd-il des électrons ? Si c’est l’inverse d’une réduction, comment s’appelle-t-il ?' },
  electrons: {
    q: 'En additionnant les deux demi-équations, il y a 2 e⁻ de chaque côté. Pourquoi n’y a-t-il aucun électron dans l’équation de réaction ?',
    options: ['Fe cède autant d’électrons que Cu²⁺ en capte : ils s’annulent', 'les électrons sont trop petits pour figurer dans une équation', 'les électrons transférés restent dans la solution : on les omet', 'les électrons sont remplacés par la charge des ions formés'], bonne: 0,
    expl: 'Les électrons ne restent pas libres en solution : tous ceux cédés par le réducteur sont captés par l’oxydant. C’est pour cela qu’on multiplie les demi-équations : il faut autant d’électrons cédés que captés, et ils disparaissent de l’équation de réaction.',
    indice: 'Combien d’électrons le fer cède-t-il ? Combien l’ion Cu²⁺ en capte-t-il ? Que donne la différence ?' },
  eqCuAg: {
    q: 'Quelle est l’équation de la réaction entre le cuivre Cu(s) et les ions argent Ag⁺(aq), qui donne Cu²⁺(aq) et Ag(s) ?',
    options: ['Cu + 2 Ag⁺ ⟶ Cu²⁺ + 2 Ag', 'Cu + Ag⁺ ⟶ Cu²⁺ + Ag', 'Cu + 2 Ag⁺ ⟶ Cu²⁺ + Ag', '2 Cu + Ag⁺ ⟶ 2 Cu²⁺ + Ag'], bonne: 0,
    expl: 'On additionne 2 Ag⁺ + 2 e⁻ = 2 Ag et Cu = Cu²⁺ + 2 e⁻ : les 2 e⁻ disparaissent et il reste Cu + 2 Ag⁺ → Cu²⁺ + 2 Ag. Éléments : 1 Cu et 2 Ag de chaque côté ; charge : +2 à gauche comme à droite.',
    indice: 'Reprends les deux demi-équations multipliées, additionne-les membre à membre et supprime ce qui apparaît des deux côtés. Vérifie ensuite les éléments et la charge.' },
  eqFei: {
    q: 'Quelle est l’équation de la réaction entre les ions Fe³⁺(aq) et les ions I⁻(aq), qui donne Fe²⁺(aq) et I₂(aq) ?',
    options: ['2 Fe³⁺ + 2 I⁻ ⟶ 2 Fe²⁺ + I₂', 'Fe³⁺ + I⁻ ⟶ Fe²⁺ + I₂', 'Fe³⁺ + 2 I⁻ ⟶ Fe²⁺ + I₂', '2 Fe³⁺ + 2 I⁻ ⟶ 2 Fe²⁺ + 2 I'], bonne: 0,
    expl: 'Fe³⁺ + e⁻ = Fe²⁺ (n = 1) et 2 I⁻ = I₂ + 2 e⁻ (n = 2). On multiplie la première par 2 pour avoir 2 e⁻ de chaque côté, puis on additionne : 2 Fe³⁺ + 2 I⁻ → 2 Fe²⁺ + I₂. Charge : 6 − 2 = +4 à gauche, +4 à droite.',
    indice: 'Combien d’électrons échange chaque demi-équation ? Par quel nombre faut-il multiplier la demi-équation de Fe³⁺/Fe²⁺ pour égaliser les électrons ?' },
  erreur: {
    q: 'Un élève propose, pour la réaction du zinc Zn(s) avec les ions argent Ag⁺(aq) qui donne Zn²⁺(aq) et Ag(s), l’équation écrite en haut de l’écran. Quelle erreur contient-elle ?',
    options: ['la charge totale n’est pas la même des deux côtés', 'les électrons échangés doivent figurer dans l’équation', 'le zinc est un réducteur : il doit être dans le second membre', 'les coefficients ne sont pas les plus petits entiers possibles'], bonne: 0,
    expl: 'Éléments : 1 Zn et 1 Ag de chaque côté, c’est bon. Charge : +1 à gauche (Ag⁺) mais +2 à droite (Zn²⁺) : elle n’est pas conservée. Les électrons cédés (2 par Zn) ne sont pas égaux aux électrons captés (1 par Ag⁺) : il faut 2 Ag⁺ et 2 Ag : Zn + 2 Ag⁺ → Zn²⁺ + 2 Ag.',
    indice: 'Compte les éléments puis la charge électrique totale de chaque côté de la flèche.' },
};
