// Exercices ANA, VAL et S'APP de la simulation 262 « Looping : vitesse en chaque point et hauteur minimale de départ ». Préfixe : lpg-.
// Capacités visées (jamais affichées) : conservation de Em (vitesse en un point d'après l'altitude, indépendante de la masse) ; condition de contact au sommet ADMISE (v ≥ √(g R)).
const DOM = 'Looping : vitesse en chaque point et hauteur minimale de départ';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const LPG_ANA = [
  { id: 'lpg-ana-masse', domaine: DOM, titre: 'Deux wagons dans le même looping',
    enonce: 'Deux wagons, l’un de 200 kg et l’autre de 400 kg, sont lâchés sans vitesse de la même hauteur au sommet d’une pente qui mène à un looping. On néglige les frottements.', q: 'Comment se comparent leurs vitesses au sommet du looping ?', options: [
      V('elles sont égales : la masse se simplifie dans l’égalité des énergies', 'Em est conservée : m g H = m g (2R) + ½ m v², la masse m se simplifie et v ne dépend que de H et de R.'),
      F('le wagon le plus lourd est plus rapide, car son énergie potentielle est plus grande', 'Son énergie cinétique à acquérir est aussi plus grande : la masse se simplifie.'),
      F('le wagon le plus léger est plus rapide, car il est plus facile à accélérer', 'Le poids du wagon léger est plus petit aussi : au final les deux vitesses sont égales.'),
      F('on ne peut pas répondre sans connaître la hauteur et le rayon', 'Les deux wagons partent de la même hauteur dans le même looping : leurs vitesses sont égales, quelles que soient ces valeurs.'),
    ] },
  { id: 'lpg-ana-bas-haut', domaine: DOM, titre: 'En bas ou en haut du looping',
    enonce: 'Un wagon lâché sans vitesse d’une hauteur H passe par le point le plus bas du looping, puis par son sommet. On néglige les frottements.', q: 'Comment se comparent sa vitesse en bas et sa vitesse au sommet ?', options: [
      V('plus grande en bas : de l’Ec est devenue de l’Epp au sommet', 'Em est conservée : au sommet Epp = m g (2R) est plus grande qu’en bas (Epp = 0), donc Ec, donc v, est plus petite.'),
      F('plus grande au sommet : le wagon accélère en montant dans le looping', 'En montant, l’altitude augmente : Epp augmente et Ec diminue.'),
      F('égales : l’énergie mécanique est conservée, donc la vitesse aussi', 'C’est Em = Ec + Epp qui est conservée, pas Ec : quand Epp augmente, Ec diminue.'),
      F('égales : le wagon revient au même point du cercle', 'Le sommet et le point le plus bas sont à des altitudes différentes (2R d’écart).'),
    ] },
  { id: 'lpg-ana-rayon', domaine: DOM, titre: 'Un looping plus grand',
    enonce: 'Un wagon est lâché sans vitesse d’une hauteur H qui lui permet de passer un looping de rayon R. On le lâche de la même hauteur dans un looping de rayon 1,5 fois plus grand, qu’il parvient encore à franchir. On néglige les frottements.', q: 'Comment sa vitesse au sommet évolue-t-elle ?', options: [
      V('plus petite : le sommet est plus haut, donc moins d’énergie cinétique', 'v² = 2 g (H − 2R) : quand R augmente, 2R augmente et v diminue.'),
      F('elle est plus grande : un grand looping laisse plus de place pour accélérer', 'Ce n’est pas la place qui compte, mais l’altitude du sommet : elle augmente avec R.'),
      F('elle est identique : elle ne dépend que de la hauteur de départ H', 'Elle dépend de la différence d’altitude H − 2R entre le départ et le sommet.'),
      F('elle est identique : la masse et la hauteur H n’ont pas changé', 'Le rayon change l’altitude du sommet, donc la vitesse au sommet.'),
    ] },
  { id: 'lpg-ana-hmin', domaine: DOM, titre: 'Doubler le rayon du looping',
    enonce: 'Pour passer un looping de rayon R, un wagon doit partir au moins d’une hauteur H minimale (on néglige les frottements et on admet que la vitesse au sommet doit être au moins √(g R)).', q: 'Quelle hauteur minimale faut-il pour passer un looping de rayon 2 R ?', options: [
      V('le double : H minimale est proportionnelle à R, car H = 2,5 R', 'H minimale = 2R + R/2 : ½ m v² = ½ m g R au sommet, plus l’énergie potentielle m g (2R). Elle est proportionnelle à R.'),
      F('quatre fois plus : la vitesse minimale dépend de R au carré', 'La vitesse minimale √(gR) est proportionnelle à √R, et H minimale à R.'),
      F('la même : le wagon aura plus de vitesse dans un plus grand looping', 'Plus grand looping, sommet plus haut : il faut partir de plus haut.'),
      F('le double plus un peu, car la vitesse au sommet doit rester non nulle', 'Cette vitesse non nulle est déjà comprise dans le calcul : H minimale = 2,5 R exactement.'),
    ] },
];

export const LPG_VAL = [
  P({ id: 'lpg-val-sommet', domaine: DOM, niveau: 1, titre: 'Vitesse au sommet : une altitude oubliée', plausible: false,
    enonce: 'Un élève calcule la vitesse au sommet d’un looping de rayon 3,0 m pour un wagon lâché sans vitesse d’une hauteur de 12 m : « m g H = ½ m v², donc v = √(2 g H) = √(2 × 9,8 × 12) ≈ 15 m/s. » Le wagon est à 6,0 m d’altitude au sommet.',
    reperes: [['Hauteur de départ', '12 m'], ['Altitude du sommet', '6,0 m'], ['g', '9,8 N/kg'], ['Ordre de grandeur', 'la vitesse au sommet est plus petite que celle en bas (15 m/s)']],
    ver: 'Au sommet, le wagon a déjà gagné 6,0 m d’altitude : m g H = m g (2R) + ½ m v², donc v = √(2 g (H − 2R)) = √(2 × 9,8 × 6,0) ≈ 11 m/s. Les 15 m/s sont la vitesse au point le plus bas.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a oublié l’énergie potentielle que le wagon a au sommet', 'Au sommet Epp = m g (2R) n’est pas nulle : il faut H − 2R dans la formule.'),
      F('il a oublié de diviser par la masse du wagon', 'La masse se simplifie : elle n’intervient pas dans la vitesse.'),
      F('il a mal utilisé la conservation de l’énergie : elle ne s’applique pas dans un looping', 'La conservation de Em s’applique : l’erreur porte sur l’altitude utilisée.'),
    ] }),
  P({ id: 'lpg-val-hmin', domaine: DOM, niveau: 2, titre: 'Hauteur minimale pour un looping de 4 m de rayon', plausible: true,
    enonce: 'Un élève écrit : « Pour un looping de rayon 4,0 m, la vitesse minimale au sommet est √(g R) = √(9,8 × 4,0) ≈ 6,3 m/s. Le sommet est à 8,0 m : m g H = m g × 8,0 + ½ m × 6,3², donc H = 8,0 + 6,3² ÷ (2 × 9,8) = 10 m. »',
    reperes: [['Rayon', '4,0 m'], ['Vitesse minimale au sommet (admise)', '√(g R) ≈ 6,3 m/s'], ['Altitude du sommet', '8,0 m'], ['Ordre de grandeur', 'H minimale est de l’ordre de 2,5 fois le rayon']],
    ver: 'H = 2R + R ÷ 2 = 2,5 R = 10 m pour R = 4,0 m : le calcul est juste.',
    q2: 'Pourquoi la hauteur minimale n’est-elle pas simplement 2 R = 8,0 m ?',
    options: [
      V('il faut encore une vitesse au moins égale à √(g R) au sommet', 'Au sommet Ec n’est pas nulle : il faut apporter l’énergie ½ m g R en plus de m g (2R).'),
      F('le frottement de l’air dissipe une partie de l’énergie', 'Les frottements sont négligés dans ce calcul : ce n’est pas la raison.'),
      F('le wagon doit revenir au sol avec une énergie cinétique nulle', 'Le problème ne s’intéresse qu’au passage du sommet.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
export const LPG_SAPP = [
  {
    id: 'lpg-sapp-vitesses', domaine: DOM, titre: 'Wagon dans un looping : vitesse en bas et au sommet', noms: ['Vitesse du wagon au point le plus bas', 'Vitesse du wagon au sommet du looping'],
    gen: () => { for (;;) { const R = tire([2, 3, 4, 5]), H = tire([8, 10, 12, 15]); if (H > 2.6 * R) return { m: tire([150, 200, 300, 500]), H, R, t: tire([20, 30, 45]) }; } },
    build: epure((p, q) => {
      const tokens = {
        m: tok(`${p.m} kg`, 'Masse du wagon', p.m, 'kg'), H: tok(`${p.H} m`, 'Hauteur de départ au-dessus du point le plus bas', p.H, 'm'),
        R: tok(`${p.R} m`, 'Rayon du looping', p.R, 'm'), t: tok(`${p.t} s`, 'Durée de la montée jusqu’au départ', p.t, 's'),
      };
      const debut = ['Un wagon de masse ', T('m'), ' est lâché sans vitesse d’une hauteur ', T('H'), ' au-dessus du point le plus bas d’un looping circulaire de rayon ', T('R'), '. La remontée au point de départ a duré ', T('t'), '. On néglige les frottements, g = 9,8 N/kg, origine des altitudes au point le plus bas. '];
      if (q === 0) return { tokens, derivees: ['Em conservée : m g H = ½ m v²', 'v = √(2 × g × H)'], texte: [...debut, 'Quelle est la vitesse du wagon au point le plus bas, en m/s ?'], utiles: ['H'],
        raisons: { m: 'La masse se simplifie dans la conservation de l’énergie.', R: 'Au point le plus bas z = 0 : le rayon du looping n’intervient pas.', t: 'La durée de la remontée ne sert pas ici.' },
        cherche: { bonne: 'La vitesse du wagon au point le plus bas (en m/s)', faux: ['L’énergie cinétique du wagon au sommet (en J)', 'La hauteur minimale de départ (en m)', 'La force exercée par le rail au sommet (en N)'] },
        manque: null, solution: { txt: 'v = √(2 × g × H)', val: Math.sqrt(2 * 9.8 * p.H), u: 'm/s' } };
      return { tokens, derivees: ['altitude du sommet z = 2 × R', 'm g H = m g (2R) + ½ m v²', 'v = √(2 × g × (H − 2 × R))'], texte: [...debut, 'Quelle est la vitesse du wagon au sommet du looping, en m/s ?'], utiles: ['H', 'R'],
        raisons: { m: 'La masse se simplifie dans la conservation de l’énergie.', t: 'La durée de la remontée ne sert pas ici.' },
        cherche: { bonne: 'La vitesse du wagon au sommet du looping (en m/s)', faux: ['La vitesse du wagon au point le plus bas (en m/s)', 'L’énergie potentielle au départ (en J)', 'La durée du parcours du looping (en s)'] },
        manque: null, solution: { txt: 'v = √(2 × g × (H − 2 × R))', val: Math.sqrt(2 * 9.8 * (p.H - 2 * p.R)), u: 'm/s' } };
    }),
  },
  {
    id: 'lpg-sapp-hmin', domaine: DOM, titre: 'Franchir le looping : vitesse minimale et hauteur de départ', noms: ['Vitesse minimale au sommet du looping', 'Hauteur minimale de départ'],
    gen: () => ({ m: tire([150, 200, 300, 500]), R: tire([2, 3, 4, 5, 6]), L: tire([20, 30, 40]) }),
    build: epure((p, q) => {
      const tokens = {
        m: tok(`${p.m} kg`, 'Masse du wagon', p.m, 'kg'), R: tok(`${p.R} m`, 'Rayon du looping', p.R, 'm'), L: tok(`${p.L} m`, 'Longueur de la pente d’accès', p.L, 'm'),
      };
      const debut = ['Un wagon de masse ', T('m'), ' part sans vitesse en haut d’une pente de longueur ', T('L'), ' qui mène à un looping circulaire de rayon ', T('R'), '. On néglige les frottements, g = 9,8 N/kg ; on admet que le wagon reste en contact avec le rail au sommet si sa vitesse y est au moins √(g × R). '];
      if (q === 0) return { tokens, derivees: ['v minimale au sommet = √(g × R)'], texte: [...debut, 'Quelle est la vitesse minimale au sommet du looping, en m/s ?'], utiles: ['R'],
        raisons: { m: 'La vitesse minimale ne dépend pas de la masse.', L: 'La longueur de la pente n’intervient pas dans cette condition.' },
        cherche: { bonne: 'La vitesse minimale au sommet du looping (en m/s)', faux: ['La hauteur minimale de départ (en m)', 'L’énergie cinétique au point le plus bas (en J)', 'Le temps de passage du looping (en s)'] },
        manque: null, solution: { txt: 'v minimale = √(g × R)', val: Math.sqrt(9.8 * p.R), u: 'm/s' } };
      return { tokens, derivees: ['m g H = m g (2R) + ½ m v²', 'avec v² = g × R : H = 2 × R + R ÷ 2 = 2,5 × R'], texte: [...debut, 'Quelle est la hauteur minimale de départ, au-dessus du point le plus bas, en mètres ?'], utiles: ['R'],
        raisons: { m: 'La masse se simplifie dans la conservation de l’énergie.', L: 'Sans frottement, seule la hauteur compte, pas la longueur de la pente.' },
        cherche: { bonne: 'La hauteur minimale de départ (en m)', faux: ['La vitesse du wagon au point le plus bas (en m/s)', 'Le travail du poids sur tout le parcours (en J)', 'La durée de la descente (en s)'] },
        manque: null, solution: { txt: 'H minimale = 2,5 × R', val: 2.5 * p.R, u: 'm' } };
    }),
  },
];
