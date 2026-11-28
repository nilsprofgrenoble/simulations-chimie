// Exercices ANA, VAL et S'APP de la simulation 261 « Chute d’une hauteur h : vitesse d’arrivée et force de frottement moyenne ». Préfixe : chh-.
// Capacités visées (jamais affichées) : Epp = m g z ; conservation de Em sans frottement (v = sqrt(2 g h)) ; théorème de l'énergie mécanique ΔEm = W(f) ; travail du poids ne dépendant que des altitudes.
const DOM = 'Chute d’une hauteur h : vitesse d’arrivée et force de frottement moyenne';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const CHH_ANA = [
  { id: 'chh-ana-masse', domaine: DOM, titre: 'Deux billes lâchées ensemble',
    enonce: 'Deux billes, l’une de 20 g et l’autre de 100 g, sont lâchées sans vitesse de la même hauteur au-dessus du sol. On néglige les frottements de l’air.', q: 'Comment se comparent leurs vitesses à l’arrivée au sol ?', options: [
      V('elles sont égales : la masse n’intervient pas dans le résultat', 'm g h = ½ m v² : la masse se simplifie, v = sqrt(2 g h) ne dépend que de la hauteur.'),
      F('la plus lourde arrive plus vite car son énergie potentielle est plus grande', 'Elle a plus d’énergie potentielle, mais aussi plus d’énergie cinétique à acquérir : la masse se simplifie.'),
      F('la plus légère arrive plus vite car elle est plus facile à accélérer', 'Le poids de la bille la plus légère est plus petit aussi : au final les deux vitesses sont égales.'),
      F('on ne peut pas répondre sans connaître la hauteur exacte', 'Pas besoin de la valeur de h : les deux billes partent de la même hauteur.'),
    ] },
  { id: 'chh-ana-hauteur', domaine: DOM, titre: 'Lâcher de plus haut',
    enonce: 'Un objet est lâché sans vitesse d’une hauteur h et arrive au sol à la vitesse v. On le lâche maintenant d’une hauteur 9 fois plus grande. On néglige les frottements.', q: 'Quelle est sa vitesse d’arrivée ?', options: [
      V('3 v : v est proportionnelle à la racine de h', 'v = sqrt(2 g h) : la hauteur est multipliée par 9, donc la vitesse par sqrt(9) = 3.'),
      F('9 v : la vitesse est proportionnelle à la hauteur', 'C’est l’énergie cinétique, proportionnelle à v², qui est proportionnelle à h.'),
      F('81 v : la vitesse est proportionnelle au carré de h', 'Il n’y a pas de carré de h : c’est v² qui est proportionnelle à h.'),
      F('v : la vitesse ne dépend pas de la hauteur', 'Le travail du poids m g h augmente avec h : l’énergie cinétique d’arrivée aussi.'),
    ] },
  { id: 'chh-ana-trajet', domaine: DOM, titre: 'Toboggan raide ou toboggan long',
    enonce: 'Deux enfants partent sans vitesse du haut de deux toboggans de même hauteur : l’un est court et raide, l’autre long et peu incliné. On néglige les frottements.', q: 'Comment comparer leurs vitesses à l’arrivée en bas ?', options: [
      V('elles sont égales : le travail du poids ne dépend que de la hauteur', 'W(P) = m g (z_A − z_B) ne dépend que des altitudes de départ et d’arrivée : même ΔEc, même vitesse.'),
      F('le toboggan le plus raide donne la plus grande vitesse', 'La pente change la durée de la descente, pas la vitesse finale sans frottement.'),
      F('le toboggan le plus long donne la plus grande vitesse, car le poids travaille plus longtemps', 'Le travail du poids ne dépend pas de la longueur du trajet, seulement de la dénivellation.'),
      F('on ne peut pas comparer sans connaître la masse des enfants', 'La masse se simplifie : elle ne change pas la vitesse d’arrivée.'),
    ] },
  { id: 'chh-ana-frott', domaine: DOM, titre: 'Un toboggan qui frotte',
    enonce: 'Un objet glisse sans vitesse initiale du haut d’une rampe. On compare deux cas : sans frottement, puis avec un frottement moyen constant le long de la rampe.', q: 'Quelle proposition compare correctement les deux cas à l’arrivée en bas ?', options: [
      V('avec frottement, Ec est plus petite : une part de Epp est dissipée en frottement', 'ΔEm = W(f) < 0 : une partie de l’énergie potentielle du départ est dissipée, il en reste moins pour Ec.'),
      F('avec frottement, l’énergie cinétique est la même : le poids est inchangé', 'Le poids est le même, mais le frottement retire de l’énergie à l’objet sur toute la longueur de la rampe.'),
      F('avec frottement, l’énergie cinétique est plus grande car le frottement retient l’objet', 'Le frottement s’oppose au mouvement : il retire de l’énergie, il n’en apporte pas.'),
      F('avec frottement, l’énergie mécanique est conservée mais répartie autrement', 'Em n’est conservée que sans frottement : avec frottement, ΔEm = W(f) < 0.'),
    ] },
];

export const CHH_VAL = [
  P({ id: 'chh-val-masse', domaine: DOM, niveau: 1, titre: 'Une vitesse d’arrivée de 98 m/s ?', plausible: false,
    enonce: 'Un élève calcule la vitesse d’arrivée d’une caisse de 10 kg lâchée sans vitesse d’une hauteur de 5,0 m : « m g h = ½ m v², donc v² = 2 g h = 2 × 9,8 × 5,0 = 98, donc v = 98 m/s. »',
    reperes: [['Masse', '10 kg'], ['Hauteur', '5,0 m'], ['g', '9,8 N/kg'], ['Ordre de grandeur', 'après 5 m de chute, la vitesse est de l’ordre de 10 m/s']],
    ver: 'Le nombre 98 est v², pas v : il faut prendre la racine carrée, v = sqrt(98) ≈ 9,9 m/s. Une vitesse de 98 m/s (350 km/h) après 5 m de chute n’est pas plausible.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a oublié la racine carrée : 98 est la valeur de v²', 'v² = 98 donne v = sqrt(98) ≈ 9,9 m/s.'),
      F('il a oublié de diviser par la masse de la caisse', 'La masse se simplifie dans m g h = ½ m v² : elle ne doit pas intervenir.'),
      F('il a utilisé la mauvaise énergie : il fallait l’énergie cinétique', 'La conservation de Em relie bien m g h à ½ m v² : c’est correct.'),
    ] }),
  P({ id: 'chh-val-frott', domaine: DOM, niveau: 2, titre: 'Frottement moyen sur une piste', plausible: true,
    enonce: 'Un élève calcule : « Un skieur de 60 kg part sans vitesse du haut d’une piste de 100 m de long et de 20 m de dénivellation. Il arrive en bas à 15 m/s. ΔEm = ½ × 60 × 15² − 60 × 9,8 × 20 = 6 750 − 11 760 = −5 010 J, donc f = 5 010 ÷ 100 ≈ 50 N. »',
    reperes: [['Masse', '60 kg'], ['Longueur de la piste', '100 m'], ['Dénivellation', '20 m'], ['Vitesse en bas', '15 m/s'], ['Ordre de grandeur', 'un frottement de quelques dizaines de newtons pour un skieur']],
    ver: 'ΔEm = Em(bas) − Em(haut) = W(f) : Em(bas) = Ec = 6 750 J et Em(haut) = Epp = 11 760 J. Le frottement dissipe 5 010 J sur 100 m (la longueur parcourue, pas la dénivellation) : f ≈ 50 N. Le résultat est plausible.',
    q2: 'Pourquoi divise-t-on l’énergie dissipée par 100 m et non par 20 m ?',
    options: [
      V('W(f) = − f × longueur parcourue, pas la dénivellation', 'W(f) = − f × L avec L la distance parcourue le long de la piste.'),
      F('le travail du frottement ne dépend que de l’altitude', 'C’est le travail du poids qui ne dépend que de l’altitude.'),
      F('la piste de 20 m est trop courte pour que le frottement agisse', 'Le skieur parcourt 100 m : c’est cette distance qui compte pour le frottement.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const vf = x => String(x).replace('.', ',');
export const CHH_SAPP = [
  {
    id: 'chh-sapp-vitesse', domaine: DOM, titre: 'Caisse lâchée en haut d’une rampe : énergie potentielle et vitesse d’arrivée', noms: ['Énergie potentielle de la caisse au départ', 'Vitesse d’arrivée de la caisse'],
    gen: () => ({ m: tire([2, 3, 5, 8]), h: tire([2, 3, 4, 5, 8]), L: tire([6, 8, 10, 12]), t: tire([2, 3, 4]) }),
    build: epure((p, q) => {
      const tokens = {
        m: tok(`${p.m} kg`, 'Masse de la caisse', p.m, 'kg'), h: tok(`${p.h} m`, 'Hauteur de départ au-dessus du bas de la rampe', p.h, 'm'),
        L: tok(`${p.L} m`, 'Longueur de la rampe', p.L, 'm'), t: tok(`${p.t} s`, 'Durée de la descente (mesurée au chronomètre)', p.t, 's'),
      };
      const debut = ['Une caisse de masse ', T('m'), ' est lâchée sans vitesse du haut d’une rampe de longueur ', T('L'), ', dont le haut est à ', T('h'), ' au-dessus du bas. La descente dure ', T('t'), '. On néglige les frottements, g = 9,8 N/kg. '];
      if (q === 0) return { tokens, derivees: ['Epp = m × g × h (l’origine z = 0 est au bas de la rampe)'], texte: [...debut, 'Quelle est l’énergie potentielle de pesanteur de la caisse au départ, en joules ?'], utiles: ['m', 'h'],
        raisons: { L: 'La longueur de la rampe n’intervient pas dans l’énergie potentielle.', t: 'La durée de la descente ne sert pas ici.' },
        cherche: { bonne: 'L’énergie potentielle de la caisse au départ (en J)', faux: ['L’énergie cinétique de la caisse au départ (en J)', 'Le travail de la force de frottement (en J)', 'La force exercée par la rampe sur la caisse (en N)'] },
        manque: null, solution: { txt: 'Epp = m × g × h', val: p.m * 9.8 * p.h, u: 'J' } };
      return { tokens, derivees: ['Em = Ec + Epp est conservée : m g h = ½ m v²', 'v = sqrt(2 × g × h)'], texte: [...debut, 'Quelle est la vitesse de la caisse en bas de la rampe, en m/s ?'], utiles: ['h'],
        raisons: { m: 'La masse se simplifie dans m g h = ½ m v² : elle ne change pas la vitesse.', L: 'Sans frottement, seule la hauteur compte, pas la longueur de la rampe.', t: 'La durée de la descente n’est pas nécessaire : l’énergie suffit.' },
        cherche: { bonne: 'La vitesse de la caisse en bas de la rampe (en m/s)', faux: ['L’accélération de la caisse (en m/s²)', 'L’énergie dissipée par la rampe (en J)', 'L’angle d’inclinaison de la rampe (en °)'] },
        manque: null, solution: { txt: 'v = sqrt(2 × g × h)', val: Math.sqrt(2 * 9.8 * p.h), u: 'm/s' } };
    }),
  },
  {
    id: 'chh-sapp-frott', domaine: DOM, titre: 'Rampe avec frottement : énergie dissipée et force de frottement moyenne', noms: ['Énergie dissipée par le frottement', 'Force de frottement moyenne'],
    gen: () => ({ m: tire([2, 3, 5]), h: tire([3, 4, 5, 6]), L: tire([8, 10, 12]), vR: tire([4.0, 5.0, 6.0, 7.0]), t: tire([2, 3]) }),
    build: epure((p, q) => {
      const Ep = p.m * 9.8 * p.h, Ec = 0.5 * p.m * p.vR * p.vR, ok = Ep - Ec > 0.5;
      const tokens = {
        m: tok(`${p.m} kg`, 'Masse de la caisse', p.m, 'kg'), h: tok(`${p.h} m`, 'Hauteur de départ au-dessus du bas', p.h, 'm'),
        L: tok(`${p.L} m`, 'Longueur de la rampe', p.L, 'm'), vR: tok(`${vf(p.vR.toFixed(1))} m/s`, 'Vitesse mesurée en bas de la rampe', p.vR, 'm/s'), t: tok(`${p.t} s`, 'Durée de la descente', p.t, 's'),
      };
      const debut = ['Une caisse de masse ', T('m'), ' est lâchée sans vitesse du haut d’une rampe de longueur ', T('L'), ', dont le haut est à ', T('h'), ' au-dessus du bas. Elle arrive en bas à la vitesse ', T('vR'), ' ; la descente dure ', T('t'), '. g = 9,8 N/kg. '];
      if (q === 0) return { tokens, derivees: ['ΔEm = Em(bas) − Em(haut) = Ec(bas) − Epp(haut)', 'énergie dissipée = Epp(haut) − Ec(bas)'], texte: [...debut, 'Quelle énergie a été dissipée par le frottement le long de la rampe, en joules ?'], utiles: ['m', 'h', 'vR'],
        raisons: { L: 'La longueur de la rampe sert plus tard, pour la force moyenne.', t: 'La durée de la descente ne sert pas ici.' },
        cherche: { bonne: 'L’énergie dissipée par le frottement (en J)', faux: ['L’énergie potentielle au départ (en J)', 'La force de frottement moyenne (en N)', 'L’énergie cinétique en bas de la rampe (en J)'] },
        manque: null, solution: { txt: 'énergie dissipée = m × g × h − ½ × m × v²', val: ok ? Ep - Ec : 0, u: 'J' } };
      return { tokens, derivees: ['énergie dissipée = Epp(haut) − Ec(bas)', 'W(f) = − f × L, donc f = énergie dissipée ÷ L'], texte: [...debut, 'Quelle est la valeur moyenne de la force de frottement, en newtons ?'], utiles: ['m', 'h', 'vR', 'L'],
        raisons: { t: 'La durée de la descente n’est pas nécessaire : l’énergie suffit.' },
        cherche: { bonne: 'La force de frottement moyenne (en N)', faux: ['L’énergie dissipée (en J)', 'La puissance dissipée (en W)', 'Le travail du poids (en J)'] },
        manque: null, solution: { txt: 'f = (m × g × h − ½ × m × v²) ÷ L', val: ok ? (Ep - Ec) / p.L : 0, u: 'N' } };
    }),
  },
];
