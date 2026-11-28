// Exercices ANA, VAL et S'APP de la simulation 243 « Formes d'énergie stockée : cinétique, potentielle, interne ». Préfixe : frm-.
// Capacités visées (jamais affichées) : identifier les formes d'énergie stockée (cinétique, potentielle, interne) ; Ec = ½mv² ; énergie totale Etot = Ec + Ep + U ; changement de forme et conservation de l'énergie.
const DOM = 'Formes d’énergie stockée : cinétique, potentielle, interne';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const FRM_ANA = [
  { id: 'frm-ana-sommet', domaine: DOM, titre: 'Une pierre lancée vers le haut',
    enonce: 'Une pierre est lancée verticalement vers le haut, avec une vitesse non nulle, depuis le sol. On néglige les frottements. Au sommet de sa trajectoire, sa vitesse est nulle un bref instant.', q: 'Que peut-on dire de ses énergies au sommet, par rapport au départ ?', options: [
      V('Ec est nulle et Ep est plus grande : l’énergie a changé de forme', 'Sans frottement, U ne varie pas : l’énergie cinétique perdue est gagnée en énergie potentielle. Au sommet, v = 0 donc Ec = 0.'),
      F('Ec est maximale et Ep nulle, car la pierre est tout en haut', 'Au sommet la vitesse est nulle, donc Ec = 0 ; c’est l’énergie potentielle qui est la plus grande.'),
      F('Ec et Ep sont toutes les deux nulles, car la pierre s’arrête un instant', 'La pierre est en hauteur : elle stocke de l’énergie potentielle. L’énergie ne disparaît pas, elle change de forme.'),
      F('Ec et Ep ont augmenté, car la pierre est montée', 'Ec a diminué (la pierre a ralenti). Ce que Ec perd, Ep le gagne.'),
    ] },
  { id: 'frm-ana-vitesse', domaine: DOM, titre: 'Un chariot qui accélère',
    enonce: 'Un chariot de masse constante roule sur une voie horizontale. Sa vitesse est multipliée par 3.', q: 'Que devient son énergie cinétique ?', options: [
      V('elle est multipliée par 9, car Ec dépend de v²', 'Ec = ½ m v² : si v est multipliée par 3, v² est multipliée par 9 et Ec aussi.'),
      F('elle est multipliée par 3, comme la vitesse', 'Ec n’est pas proportionnelle à v mais à v² : le facteur est 3² = 9.'),
      F('elle est multipliée par 6, car il faut doubler le facteur ½', 'Le facteur ½ est une constante ; il ne change pas le rapport. Le rapport est 3² = 9.'),
      F('elle ne change pas, car la masse du chariot ne change pas', 'Ec dépend de la masse et de la vitesse : la vitesse change, donc Ec aussi.'),
    ] },
  { id: 'frm-ana-frottement', domaine: DOM, titre: 'Un patineur qui s’arrête',
    enonce: 'Un patineur glisse sur la glace puis s’arrête sans que personne ne le touche, à cause des frottements. On étudie le système « patineur, glace et air ».', q: 'Que peut-on dire de l’énergie totale de ce système ?', options: [
      V('elle est constante : Ec diminue et U augmente d’autant', 'Le système n’échange rien avec l’extérieur : Etot = Ec + Ep + U est constante. L’énergie cinétique perdue devient de l’énergie interne.'),
      F('elle diminue, car l’énergie cinétique du patineur a disparu', 'Ec n’a pas disparu : elle est devenue de l’énergie interne. Etot ne varie pas.'),
      F('elle augmente, car la glace et l’air s’échauffent', 'L’énergie interne augmente, mais Ec diminue d’autant : la somme reste constante.'),
      F('elle est nulle à l’arrêt, car la vitesse du patineur est nulle', 'Seule Ec s’annule. Etot comprend aussi l’énergie interne, qui a augmenté.'),
    ] },
  { id: 'frm-ana-total', domaine: DOM, titre: 'Une bille lâchée sans vitesse',
    enonce: 'Une bille est lâchée sans vitesse initiale ; on néglige les frottements, donc U ne varie pas. À un instant de sa chute, elle stocke Ec = 3 J et Ep = 5 J.', q: 'Quelle était l’énergie potentielle de la bille au moment du lâcher ?', options: [
      V('8 J, car Ec + Ep reste constante et Ec valait 0 au départ', 'Ec + Ep = 3 + 5 = 8 J à tout instant ; au départ la vitesse est nulle, donc Ec = 0 et Ep = 8 J.'),
      F('5 J, car l’énergie potentielle ne change pas pendant la chute', 'Ep diminue pendant la chute : une partie devient de l’énergie cinétique.'),
      F('3 J, car c’est l’énergie cinétique gagnée pendant la chute', 'Ec = 3 J est ce que la bille a gagné jusque-là, mais Ep a aussi diminué de 3 J seulement ; au départ Ep = 5 + 3 = 8 J.'),
      F('15 J, car il faut multiplier les deux énergies', 'Les énergies s’additionnent : Etot = Ec + Ep = 8 J et ne se multiplient pas.'),
    ] },
];

export const FRM_VAL = [
  P({ id: 'frm-val-bilan', domaine: DOM, niveau: 1, titre: 'Un chariot qui s’arrête par frottement', plausible: true,
    enonce: 'Un chariot de masse 4,0 kg roule sur un sol horizontal à 3,0 m/s puis s’arrête à cause des frottements. Un élève calcule Ec = ½ × 4,0 × 3,0² = 18 J et en déduit que l’énergie interne du chariot et du sol a augmenté de 18 J.',
    reperes: [['Masse', 'm = 4,0 kg'], ['Vitesse initiale', 'v = 3,0 m/s'], ['Ec = ½ m v²', '½ × 4,0 × 9,0 = 18 J'], ['À l’arrêt', 'Ec = 0 : ΔU = + 18 J']],
    ver: 'Ec = ½ m v² = ½ × 4,0 × 3,0² = 18 J. Le sol est horizontal (Ep constante) et le système {chariot, sol} n’échange rien : l’énergie cinétique perdue devient de l’énergie interne, ΔU = +18 J. L’élève a raison.',
    q2: 'Si le chariot ne ralentissait que jusqu’à 1,5 m/s, de combien l’énergie interne augmenterait-elle ?',
    options: [
      V('de 13,5 J : Ec passe de 18 J à 4,5 J en fin de course', 'À 1,5 m/s, Ec = ½ × 4,0 × 1,5² = 4,5 J. ΔU = 18 − 4,5 = 13,5 J.'),
      F('de 9 J, car la vitesse est divisée par deux donc l’énergie aussi', 'Ec dépend de v² : diviser v par 2 divise Ec par 4 (18 → 4,5 J), donc ΔU = 13,5 J.'),
      F('de 4,5 J, qui est l’énergie cinétique restante', '4,5 J est l’énergie cinétique qui reste ; l’énergie interne gagnée est la différence avec les 18 J du départ.'),
    ] }),
  P({ id: 'frm-val-chute', domaine: DOM, niveau: 2, titre: 'L’énergie au départ d’une chute', plausible: false,
    enonce: 'Une bille est lâchée sans vitesse ; on néglige les frottements. À un instant de sa chute, elle stocke Ec = 6 J et Ep = 4 J. Un élève affirme : « L’énergie se conserve, donc au départ la bille stockait Ep = 4 J. »',
    reperes: [['À l’instant étudié', 'Ec = 6 J ; Ep = 4 J'], ['Etot = Ec + Ep + U', '6 + 4 + U constante'], ['Au départ', 'vitesse nulle : Ec = 0'], ['Ep au départ', '6 + 4 = 10 J']],
    ver: 'Sans frottement, Ec + Ep est constante : 6 + 4 = 10 J. Au départ la vitesse est nulle, donc Ec = 0 et Ep = 10 J, pas 4 J. L’énergie se conserve, mais c’est l’énergie totale qui est constante, pas Ep. Le raisonnement de l’élève n’est pas plausible.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a cru que Ep se conserve seule, alors que c’est Ec + Ep', 'C’est la somme Ec + Ep (avec U constante) qui est conservée : Ep a diminué pendant la chute parce que Ec a augmenté.'),
      F('il a oublié que l’énergie interne de la bille augmente pendant la chute', 'Sans frottement, U ne varie pas : l’erreur n’est pas là, elle porte sur Ep.'),
      F('il a confondu énergie cinétique et énergie potentielle', 'Les deux formes sont bien distinguées ; l’erreur est d’avoir supposé que Ep ne change pas.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const vir = x => String(Number(Number(x).toPrecision(3))).replace('.', ',');
export const FRM_SAPP = [
  {
    id: 'frm-sapp-glisse', domaine: DOM, titre: 'Bloc qui ralentit sur un sol horizontal : énergie cinétique et énergie interne', noms: ['Énergie cinétique initiale', 'Énergie interne gagnée'],
    gen: () => { let v0, v1; do { v0 = tire([3, 4, 5, 6]); v1 = tire([1, 2, 3]); } while (v1 >= v0); return { m: tire([1.0, 2.0, 3.0, 4.0]), v0, v1, d: tire([2.0, 3.0, 5.0, 8.0]), dt: tire([1.5, 2.0, 3.0]) }; },
    build: epure((p, q) => {
      const tokens = {
        m: tok(`${vir(p.m)} kg`, 'Masse du bloc', p.m, 'kg'),
        v0: tok(`${p.v0} m/s`, 'Vitesse initiale du bloc', p.v0, 'm/s'),
        v1: tok(`${p.v1} m/s`, 'Vitesse finale du bloc', p.v1, 'm/s'),
        d: tok(`${vir(p.d)} m`, 'Distance parcourue pendant le ralentissement', p.d, 'm'),
        dt: tok(`${vir(p.dt)} s`, 'Durée du ralentissement', p.dt, 's'),
      };
      const debut = ['Un bloc de masse ', T('m'), ' glisse sur un sol horizontal. Sa vitesse passe de ', T('v0'), ' à ', T('v1'), ' en parcourant ', T('d'), ', pendant ', T('dt'), '. '];
      if (q === 0) return { tokens, derivees: ['Ec = ½ × m × v²'], texte: [...debut, 'Quelle est l’énergie cinétique du bloc au départ, en joules ?'], utiles: ['m', 'v0'],
        raisons: { v1: 'La vitesse finale ne sert pas pour l’énergie au départ.', d: 'La distance ne sert pas : l’énergie cinétique dépend de la masse et de la vitesse.', dt: 'La durée ne sert pas pour une énergie cinétique.' },
        cherche: { bonne: 'L’énergie cinétique du bloc au départ (en J)', faux: ['L’énergie interne gagnée par le bloc et le sol (en J)', 'L’énergie cinétique du bloc à la fin (en J)', 'La puissance perdue par le bloc (en W)'] },
        manque: null, solution: { txt: 'Ec = ½ m v0²', val: 0.5 * p.m * p.v0 ** 2, u: 'J' } };
      return { tokens, derivees: ['Ec = ½ × m × v²', 'ΔU = Ec initiale − Ec finale (Ep constante)'], texte: [...debut, 'Quelle est l’énergie interne gagnée par le bloc et le sol, en joules ?'], utiles: ['m', 'v0', 'v1'],
        raisons: { d: 'La distance ne sert pas : on connaît déjà les deux vitesses.', dt: 'La durée ne sert pas pour une énergie.' },
        cherche: { bonne: 'L’énergie interne gagnée par le bloc et le sol (en J)', faux: ['L’énergie cinétique du bloc au départ (en J)', 'L’énergie cinétique restante du bloc (en J)', 'La puissance perdue par le bloc (en W)'] },
        manque: null, solution: { txt: 'ΔU = ½ m v0² − ½ m v1²', val: 0.5 * p.m * (p.v0 ** 2 - p.v1 ** 2), u: 'J' } };
    }),
  },
  {
    id: 'frm-sapp-chute', domaine: DOM, titre: 'Bille en chute libre : énergie cinétique et vitesse', noms: ['Énergie cinétique à l’instant considéré', 'Vitesse à l’instant considéré'],
    gen: () => { const Ep0 = tire([6, 8, 12, 15, 20]); return { m: tire([0.2, 0.5, 1.0, 2.0]), Ep0, Ep1: tire([1, 2, 3, 4].filter(x => x < Ep0 - 1)), dt: tire([0.3, 0.5, 0.6]), H: tire([1.0, 1.5, 2.0]) }; },
    build: epure((p, q) => {
      const tokens = {
        m: tok(`${vir(p.m)} kg`, 'Masse de la bille', p.m, 'kg'),
        Ep0: tok(`${p.Ep0} J`, 'Énergie potentielle au départ', p.Ep0, 'J'),
        Ep1: tok(`${p.Ep1} J`, 'Énergie potentielle à l’instant considéré', p.Ep1, 'J'),
        dt: tok(`${vir(p.dt)} s`, 'Durée écoulée depuis le lâcher', p.dt, 's'),
        H: tok(`${vir(p.H)} m`, 'Hauteur de lâcher', p.H, 'm'),
      };
      const debut = ['Une bille de masse ', T('m'), ' est lâchée sans vitesse de ', T('H'), ' de hauteur. Elle stocke ', T('Ep0'), ' d’énergie potentielle au départ ; ', T('dt'), ' plus tard, elle en stocke ', T('Ep1'), '. On néglige les frottements. '];
      if (q === 0) return { tokens, derivees: ['Ec + Ep reste constante (U ne varie pas) ; Ec = 0 au départ', 'Ec = Ep départ − Ep instant'], texte: [...debut, 'Quelle est son énergie cinétique à cet instant, en joules ?'], utiles: ['Ep0', 'Ep1'],
        raisons: { m: 'La masse ne sert pas pour ce bilan d’énergie : elle servira pour la vitesse.', dt: 'La durée ne sert pas : on utilise un bilan d’énergie.', H: 'La hauteur ne sert pas : les énergies sont déjà données.' },
        cherche: { bonne: 'L’énergie cinétique de la bille à cet instant (en J)', faux: ['La vitesse de la bille à cet instant (en m/s)', 'L’énergie interne gagnée par la bille (en J)', 'L’énergie potentielle perdue depuis le départ (en J)'] },
        manque: null, solution: { txt: 'Ec = Ep0 − Ep1', val: p.Ep0 - p.Ep1, u: 'J' } };
      return { tokens, derivees: ['Ec = Ep départ − Ep instant', 'v = sqrt(2 × Ec ÷ m)'], texte: [...debut, 'Quelle est sa vitesse à cet instant, en m/s ?'], utiles: ['m', 'Ep0', 'Ep1'],
        raisons: { dt: 'La durée ne sert pas : la vitesse se déduit de l’énergie cinétique.', H: 'La hauteur ne sert pas : les énergies sont déjà données.' },
        cherche: { bonne: 'La vitesse de la bille à cet instant (en m/s)', faux: ['L’énergie cinétique de la bille à cet instant (en J)', 'La hauteur de la bille à cet instant (en m)', 'L’accélération de la bille (en m/s²)'] },
        manque: null, solution: { txt: 'v = sqrt(2 Ec ÷ m)', val: Math.sqrt(2 * (p.Ep0 - p.Ep1) / p.m), u: 'm/s' } };
    }),
  },
];
