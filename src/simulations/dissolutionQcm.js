// QCM du parcours guidé de la simulation « Dissolution d'un solide ionique dans l'eau : équation et concentration des ions » (sim 157).
// Fichier sans React : la longueur des options est contrôlée par un script (la bonne réponse n'est jamais la plus longue ni toujours à la même place).
// bonne : indice de la bonne réponse dans options.
export const QCM = {
  cristal: {
    q: 'Dans un cristal de chlorure de sodium, qu’est-ce qui maintient les ions les uns contre les autres ?',
    options: ['des liaisons covalentes : chaque atome de sodium partage des électrons avec un atome de chlore', 'l’attraction entre les ions de même signe : ils se rassemblent en un empilement ordonné', 'l’attraction électrostatique entre ions de signes opposés : les cations attirent les anions', 'la forme du flacon : les parois en verre empêchent les ions de s’éloigner'], bonne: 2,
    expl: 'Le cristal est un empilement ordonné d’ions Na⁺ et Cl⁻. Les ions de signes opposés s’attirent (interaction électrostatique) : c’est la liaison ionique, vue dans le chapitre sur la cohésion. Les ions de même signe, eux, se repoussent.',
    indice: 'Un cation et un anion portent des charges de signes opposés : que se passe-t-il entre deux charges opposées ?' },
  formule: {
    q: 'Que signifie la formule NaCl du chlorure de sodium solide ?',
    options: ['une molécule faite d’un atome de sodium lié à un atome de chlore : le solide en est un amas', 'une paire d’ions isolée, un Na⁺ lié à un seul Cl⁻ : le solide est un amas de paires', 'le cristal ne contient qu’un ion Na⁺ et qu’un ion Cl⁻ : il est constitué de deux ions', 'autant d’ions Na⁺ que d’ions Cl⁻ dans le cristal : la formule donne les proportions'], bonne: 3,
    expl: 'La formule d’un solide ionique est une formule statistique : elle indique les proportions d’ions (ici 1 ion Na⁺ pour 1 ion Cl⁻), pas une molécule. Un cristal contient un nombre immense d’ions, répartis en un empilement régulier, sans paires isolées.',
    indice: 'Regardez le schéma : compte-t-on des molécules, des paires isolées, ou un empilement d’ions en proportions fixes ?' },
  dissociation: {
    q: 'Au contact du cristal, que font les molécules d’eau polaires ?',
    options: ['elles brisent des liaisons covalentes Na–Cl : le cristal éclate en petites molécules', 'elles renforcent l’attraction entre les ions : le cristal devient plus solide', 'elles affaiblissent l’attraction entre ions voisins : ils peuvent se séparer', 'elles font fondre le cristal : la chaleur de l’eau le transforme en liquide'], bonne: 2,
    expl: 'Les molécules d’eau, polaires, s’insèrent entre les ions et font écran : dans l’eau, l’attraction entre deux ions voisins est environ 80 fois plus faible que dans le vide (ordre de grandeur, à retenir qualitativement). Les ions peuvent alors se séparer : c’est la dissociation du cristal.',
    indice: 'L’eau s’interpose entre les ions du cristal : l’attraction entre ions voisins devient-elle plus forte ou plus faible ?' },
  solvatation: {
    q: 'Un ion chlorure Cl⁻ est libre dans l’eau. Comment les molécules d’eau se placent-elles autour de lui ?',
    options: ['avec leurs hydrogènes (pôle +) tournés vers l’ion : des charges opposées qui s’attirent', 'avec leur atome d’oxygène (pôle −) tourné vers l’ion : le gros atome se place au plus près', 'dans toutes les directions : une molécule d’eau est neutre, elle n’interagit pas avec un ion', 'en s’éloignant de l’ion : l’eau repousse les ions pour les isoler les uns des autres'], bonne: 0,
    expl: 'L’ion Cl⁻ est négatif : il attire le pôle positif des molécules d’eau, c’est-à-dire leurs atomes d’hydrogène (δ+). Un cation, au contraire, attire l’atome d’oxygène (δ−). Ces interactions attractives ion–dipôle forment la couche de solvatation (hydratation, quand le solvant est l’eau). Une molécule d’eau est neutre globalement mais polaire.',
    indice: 'Une molécule d’eau a un pôle + (côté hydrogène) et un pôle − (côté oxygène). Un anion est négatif : quel pôle attire-t-il ?' },
  dispersion: {
    q: 'Dans la solution, que deviennent les ions séparés du cristal ?',
    options: ['ils restent des ions, entourés d’eau, et se répartissent dans la solution', 'ils se rassemblent de nouveau en petits cristaux au fond du récipient', 'ils se lient à l’eau par des liaisons covalentes et forment de nouvelles molécules', 'ils se transforment en atomes neutres : le sel fond et ne laisse que de l’eau'], bonne: 0,
    expl: 'Chaque ion reste entouré de molécules d’eau (interactions ion–dipôle) : il est stabilisé et se répartit dans la solution (dispersion), sans se transformer ni former de liaison covalente, et sans reformer le cristal. Les ions n’ont pas disparu : on peut récupérer le sel en évaporant l’eau.',
    indice: 'Pensez à l’étape précédente : l’eau entoure chaque ion. Un ion entouré d’eau reste-t-il un ion ?' },
  equationNaCl: {
    q: 'Quelle est l’équation de la dissolution du chlorure de sodium dans l’eau ?',
    options: ['NaCl(s) + H₂O(l) → Na⁺(aq) + Cl⁻(aq)', 'NaCl(s) → Na⁺(aq) + Cl⁻(aq)', 'NaCl(s) → Na(aq) + Cl(aq)', 'NaCl(aq) → Na⁺(s) + Cl⁻(s)'], bonne: 1,
    expl: 'À gauche, la formule du solide avec (s) ; à droite, les ions avec (aq), c’est-à-dire entourés de molécules d’eau. On n’écrit pas la formule de l’eau : elle est le solvant, pas un réactif de cette équation. Les ions portent leur charge ; la charge totale est conservée (0 = +1 − 1).',
    indice: 'Le solide est noté (s). Les espèces dissoutes sont des ions, notés (aq) : écrivez leurs charges. L’eau, solvant, ne s’écrit pas.' },
  equationMgCl2: {
    q: 'Le chlorure de magnésium solide est formé d’ions Mg²⁺ et Cl⁻. Quelle est l’équation de sa dissolution ?',
    options: ['MgCl₂(s) → Mg²⁺(aq) + Cl₂²⁻(aq)', 'MgCl₂(s) + H₂O(l) → Mg²⁺(aq) + 2 Cl⁻(aq)', 'MgCl₂(s) → Mg²⁺(aq) + Cl⁻(aq)', 'MgCl₂(s) → Mg²⁺(aq) + 2 Cl⁻(aq)'], bonne: 3,
    expl: 'La formule MgCl₂ indique 1 ion Mg²⁺ pour 2 ions Cl⁻. Chaque ion se retrouve séparément dans la solution : le coefficient 2 est écrit devant l’ion Cl⁻ (et non en indice). La charge est conservée : 0 = (+2) + 2 × (−1). L’équation avec un seul Cl⁻ ne conserve pas la charge, celle avec Cl₂²⁻ invente un ion qui n’existe pas, et l’eau, solvant, ne s’écrit pas.',
    indice: 'À gauche le solide est neutre : à droite, la somme des charges des ions doit aussi valoir 0. Et l’eau, solvant, ne s’écrit pas.' },
  equationNa2SO4: {
    q: 'Le sulfate de sodium solide Na₂SO₄ est formé d’ions sodium Na⁺ et d’ions sulfate SO₄²⁻ (ion polyatomique). Quelle est l’équation de sa dissolution ?',
    options: ['Na₂SO₄(s) → Na₂⁺(aq) + SO₄²⁻(aq)', 'Na₂SO₄(s) → 2 Na⁺(aq) + SO₄⁻(aq)', 'Na₂SO₄(s) → 2 Na⁺(aq) + S²⁻(aq) + 4 O²⁻(aq)', 'Na₂SO₄(s) → 2 Na⁺(aq) + SO₄²⁻(aq)'], bonne: 3,
    expl: 'L’ion sulfate SO₄²⁻ est un ion polyatomique : il reste groupé en solution, avec sa charge 2− donnée, et il ne se casse pas en ions S²⁻ et O²⁻. Les 2 ions Na⁺ viennent de l’indice 2 de la formule : on écrit le coefficient 2 devant Na⁺. Charge : 0 = 2 × (+1) + (−2).',
    indice: 'Compte des charges : le solide est neutre, donc les charges des ions à droite doivent s’annuler. Combien de Na⁺ pour compenser un SO₄²⁻ ?' },
  bilan: {
    q: 'On prépare une solution de chlorure d’aluminium AlCl₃ de concentration c = 0,010 mol/L en soluté apporté (équation : AlCl₃(s) → Al³⁺(aq) + 3 Cl⁻(aq)). Quelle affirmation est exacte ?',
    options: ['[Al³⁺] = 0,010 mol/L et [Cl⁻] = 0,010 mol/L : toutes les concentrations sont égales à c', '[Al³⁺] = 0,010 mol/L et [Cl⁻] = 0,030 mol/L : chaque formule donne un Al³⁺ et trois Cl⁻', '[Al³⁺] = 0,030 mol/L et [Cl⁻] = 0,010 mol/L : la charge 3+ est reportée sur la concentration', '[Al³⁺] = 0,0025 mol/L et [Cl⁻] = 0,0075 mol/L : les 4 ions se partagent la quantité c'], bonne: 1,
    expl: 'La concentration effective d’un ion est son coefficient dans l’équation multiplié par c : [Al³⁺] = 1 × c = 0,010 mol/L et [Cl⁻] = 3 × c = 0,030 mol/L. La charge 3+ de l’ion n’intervient pas dans la concentration : seul le coefficient compte. Les concentrations effectives ne sont donc pas toujours égales à c.',
    indice: 'Lisez les coefficients de l’équation : combien d’ions Al³⁺ et combien d’ions Cl⁻ apparaissent pour une formule AlCl₃ dissoute ?' },
};
