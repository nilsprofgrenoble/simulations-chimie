// Exercices ANA, VAL et S'APP de la simulation 263 « Flipper : vitesse d'éjection minimale pour atteindre le haut de la rampe ». Préfixe : flp-.
// Capacités visées (jamais affichées) : conservation de Em (Ec en bas = Epp en haut), indépendance vis-à-vis de la masse et de l'angle sans frottement, effet d'un frottement. Aucune énergie de ressort : la vitesse d'éjection est une donnée.
const DOM = 'Flipper : vitesse d’éjection minimale pour atteindre le haut de la rampe';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const FLP_ANA = [
  { id: 'flp-ana-masse', domaine: DOM, titre: 'Deux billes sur la même rampe',
    enonce: 'Un lanceur éjecte au pied d’une rampe inclinée, avec la même vitesse, une bille de 50 g puis une bille de 150 g. On néglige les frottements et la rampe est assez haute pour que les billes s’arrêtent avant son sommet.', q: 'Comment se comparent les hauteurs maximales atteintes ?', options: [
      V('elles sont égales : la masse se simplifie dans le bilan', 'Ec en bas = Epp en haut : ½ m v² = m g h, donc h = v² ÷ (2 g), indépendante de la masse.'),
      F('la bille de 150 g monte plus haut, car elle a plus d’énergie', 'Elle a plus d’énergie cinétique, mais aussi un poids plus grand à soulever : la masse se simplifie.'),
      F('la bille de 50 g monte plus haut, car elle est plus légère' , 'Plus légère, elle a aussi moins d’énergie cinétique : les deux effets se compensent exactement.'),
      F('on ne peut pas savoir sans l’angle de la rampe', 'Sans frottement, la hauteur atteinte ne dépend pas de l’angle de la rampe.'),
    ] },
  { id: 'flp-ana-vitesse', domaine: DOM, titre: 'Éjecter deux fois plus vite',
    enonce: 'Une bille éjectée à la vitesse v0 sur une rampe très haute monte jusqu’à une hauteur h avant de s’arrêter. On néglige les frottements. On l’éjecte maintenant à la vitesse 2 v0.', q: 'Quelle hauteur atteint-elle ?', options: [
      V('quatre fois plus haut : h varie comme le carré de la vitesse v0', 'h = v0² ÷ (2 g) : si v0 double, v0² est multiplié par 4.'),
      F('deux fois plus haut : la hauteur est proportionnelle à la vitesse', 'L’énergie cinétique ½ m v² est proportionnelle au carré de la vitesse.'),
      F('la même hauteur : elle ne dépend que de la masse de la bille', 'Elle dépend de v0 et pas de la masse.'),
      F('quatre fois plus haut seulement si la rampe est inclinée à 45°', 'Le résultat est le même pour toutes les inclinaisons sans frottement.'),
    ] },
  { id: 'flp-ana-angle', domaine: DOM, titre: 'Rampe douce ou rampe raide',
    enonce: 'Deux rampes montent à la même hauteur h : l’une est inclinée de 20°, l’autre de 60° (donc plus courte). On néglige les frottements. On cherche la vitesse d’éjection minimale pour atteindre le sommet.', q: 'Comment se comparent les vitesses minimales sur les deux rampes ?', options: [
      V('elles sont égales : seule la hauteur h compte, pas la longueur', 'Ec en bas = Epp en haut = m g h, quelle que soit la longueur de la rampe.'),
      F('plus petite sur la rampe raide, car le trajet est plus court', 'Un trajet plus court ne change pas l’énergie à fournir : seule h compte sans frottement.'),
      F('plus petite sur la rampe douce, car la bille monte plus facilement', 'La pente douce allonge le trajet mais l’énergie nécessaire est la même.'),
      F('plus grande sur la rampe raide, car la montée est plus brutale', 'La brutalité de la montée n’intervient pas dans le bilan d’énergie.'),
    ] },
  { id: 'flp-ana-frott', domaine: DOM, titre: 'Un petit frottement sur la rampe',
    enonce: 'Deux rampes montent à la même hauteur : l’une est douce (donc longue), l’autre raide (donc courte). Le frottement de la rampe sur la bille est une force constante, la même sur les deux rampes.', q: 'Pour atteindre le sommet, sur quelle rampe faut-il éjecter la bille le plus vite ?', options: [
      V('sur la rampe douce : le trajet plus long dissipe plus d’énergie', 'Le travail du frottement vaut f × L : plus L est grand, plus l’énergie perdue est grande.'),
      F('sur la rampe raide : la montée y est plus difficile', 'La hauteur à gagner est la même : c’est la longueur parcourue qui fait varier les pertes.'),
      F('sur les deux de la même façon : l’énergie à fournir est la même', 'Sans frottement ce serait vrai, mais le frottement dissipe d’autant plus que le trajet est long.'),
      F('sur la rampe raide, car le frottement y est plus fort', 'Dans l’énoncé la force de frottement est la même : seule la longueur du trajet change.'),
    ] },
];

export const FLP_VAL = [
  P({ id: 'flp-val-hauteur', domaine: DOM, niveau: 1, titre: 'Hauteur atteinte : une masse oubliée', plausible: false,
    enonce: 'Un élève calcule la hauteur maximale atteinte par une bille éjectée à 3,0 m/s sur une rampe très haute, sans frottement : « ½ v0² = g h, donc h = v0² ÷ g = 9,0 ÷ 9,8 ≈ 0,92 m. »',
    reperes: [['Vitesse d’éjection', '3,0 m/s'], ['g', '9,8 N/kg'], ['Ordre de grandeur', 'une bille éjectée à 3 m/s monte de quelques dizaines de centimètres']],
    ver: 'De ½ v0² = g h on tire h = v0² ÷ (2 g) = 9,0 ÷ 19,6 ≈ 0,46 m : le facteur 2 du dénominateur a été oublié.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a oublié le facteur 2 : h = v0² ÷ (2 × g) = 0,46 m', '½ v0² = g h donne h = v0² ÷ (2 g) = 0,46 m.'),
      F('il a oublié de multiplier par la masse de la bille ici', 'La masse se simplifie des deux côtés : elle n’intervient pas.'),
      F('il aurait dû tenir compte de l’angle de la rampe', 'Sans frottement la hauteur atteinte ne dépend pas de l’angle.'),
    ] }),
  P({ id: 'flp-val-vmin', domaine: DOM, niveau: 2, titre: 'Vitesse minimale pour une rampe de 0,50 m', plausible: true,
    enonce: 'Un élève écrit : « La rampe monte à 0,50 m de hauteur. Sans frottement, ½ m v0² = m g h, donc v0 = sqrt(2 g h) = sqrt(2 × 9,8 × 0,50) ≈ 3,1 m/s. On n’a pas besoin de la longueur de la rampe. »',
    reperes: [['Hauteur de la rampe', '0,50 m'], ['g', '9,8 N/kg'], ['Ordre de grandeur', 'quelques m/s pour monter de quelques dizaines de centimètres']],
    ver: 'v0 = sqrt(2 × 9,8 × 0,50) = sqrt(9,8) ≈ 3,1 m/s : le calcul est juste, la longueur de la rampe n’intervient pas sans frottement.',
    q2: 'Pourquoi la longueur de la rampe n’est-elle pas utile ?',
    options: [
      V('sans frottement, seule la variation d’altitude compte dans l’énergie', 'L’énergie potentielle de pesanteur ne dépend que de l’altitude.'),
      F('la longueur de la rampe est toujours égale à sa hauteur', 'Une rampe inclinée est plus longue que sa hauteur : L = h ÷ sin α.'),
      F('la bille arrive en haut avec une vitesse qui ne dépend pas de la longueur', 'Ce n’est pas la raison : ici on cherche la vitesse d’éjection.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const fr = x => String(x).replace('.', ',');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
export const FLP_SAPP = [
  {
    id: 'flp-sapp-hauteur', domaine: DOM, titre: 'Bille éjectée : énergie cinétique et hauteur atteinte', noms: ['Énergie cinétique à l’éjection', 'Hauteur maximale atteinte'],
    gen: () => ({ m: tire([0.05, 0.08, 0.1, 0.15]), v: tire([2, 3, 4, 5]), a: tire([20, 30, 45]), d: tire([0.05, 0.1, 0.2]) }),
    build: epure((p, q) => {
      const tokens = {
        m: tok(`${fr(p.m)} kg`, 'Masse de la bille', p.m, 'kg'), v: tok(`${p.v} m/s`, 'Vitesse d’éjection', p.v, 'm/s'),
        a: tok(`${p.a} °`, 'Angle de la rampe', p.a, '°'), d: tok(`${fr(p.d)} s`, 'Durée de la poussée du lanceur', p.d, 's'),
      };
      const debut = ['Un lanceur éjecte au pied d’une rampe, en ', T('d'), ', une bille de masse ', T('m'), ' à la vitesse ', T('v'), '. La rampe est inclinée de ', T('a'), ' et assez haute pour que la bille s’arrête avant son sommet. On néglige les frottements, g = 9,8 N/kg. '];
      if (q === 0) return { tokens, derivees: ['Ec = ½ × m × v²'], texte: [...debut, 'Quelle est l’énergie cinétique de la bille à l’éjection, en J ?'], utiles: ['m', 'v'],
        raisons: { a: 'L’angle de la rampe n’intervient pas dans l’énergie cinétique.', d: 'La durée de la poussée ne sert pas ici.' },
        cherche: { bonne: 'L’énergie cinétique de la bille à l’éjection (en J)', faux: ['La hauteur maximale atteinte (en m)', 'La force exercée par le lanceur (en N)', 'La longueur parcourue sur la rampe (en m)'] },
        manque: null, solution: { txt: 'Ec = ½ × m × v²', val: 0.5 * p.m * p.v * p.v, u: 'J' } };
      return { tokens, derivees: ['½ m v² = m g h', 'h = v² ÷ (2 × g)'], texte: [...debut, 'Quelle est la hauteur maximale atteinte par la bille, en m ?'], utiles: ['v'],
        raisons: { m: 'La masse se simplifie dans la conservation de l’énergie.', a: 'Sans frottement, la hauteur ne dépend pas de l’angle de la rampe.', d: 'La durée de la poussée ne sert pas ici.' },
        cherche: { bonne: 'La hauteur maximale atteinte par la bille (en m)', faux: ['L’énergie cinétique à l’éjection (en J)', 'La longueur parcourue sur la rampe (en m)', 'Le temps de montée (en s)'] },
        manque: null, solution: { txt: 'h = v² ÷ (2 × g)', val: p.v * p.v / (2 * 9.8), u: 'm' } };
    }),
  },
  {
    id: 'flp-sapp-vmin', domaine: DOM, titre: 'Atteindre le haut de la rampe : vitesse minimale et vitesse en haut', noms: ['Vitesse d’éjection minimale', 'Vitesse de la bille en haut de la rampe'],
    gen: () => { for (;;) { const h = tire([0.4, 0.6, 0.8, 1.0]), v = tire([4, 5, 6]); if (v * v - 2 * 9.8 * h >= 2) return { m: tire([0.05, 0.08, 0.1, 0.15]), h, v, a: tire([20, 30, 45]) }; } },
    build: epure((p, q) => {
      const tokens = {
        m: tok(`${fr(p.m)} kg`, 'Masse de la bille', p.m, 'kg'), h: tok(`${fr(p.h)} m`, 'Hauteur du haut de la rampe', p.h, 'm'),
        v: tok(`${p.v} m/s`, 'Vitesse d’éjection réelle', p.v, 'm/s'), a: tok(`${p.a} °`, 'Angle de la rampe', p.a, '°'),
      };
      const debut = ['Une bille de masse ', T('m'), ' est éjectée au pied d’une rampe inclinée de ', T('a'), ' dont le haut est à la hauteur ', T('h'), '. On néglige les frottements, g = 9,8 N/kg. '];
      if (q === 0) return { tokens, derivees: ['½ m v² = m g h', 'v minimale = sqrt(2 × g × h)'], texte: [...debut, 'Quelle est la vitesse d’éjection minimale pour atteindre le haut de la rampe, en m/s ?'], utiles: ['h'],
        raisons: { m: 'La masse se simplifie dans la conservation de l’énergie.', a: 'Sans frottement, seule la hauteur compte, pas l’inclinaison.', v: 'Ici on cherche la vitesse minimale, pas la vitesse réelle.' },
        cherche: { bonne: 'La vitesse d’éjection minimale (en m/s)', faux: ['La hauteur maximale atteinte (en m)', 'L’énergie cinétique de la bille en haut (en J)', 'La longueur de la rampe (en m)'] },
        manque: null, solution: { txt: 'v minimale = sqrt(2 × g × h)', val: Math.sqrt(2 * 9.8 * p.h), u: 'm/s' } };
      const tk2 = { ...tokens }; const texte = ['Une bille de masse ', T('m'), ' est éjectée à la vitesse ', T('v'), ' au pied d’une rampe inclinée de ', T('a'), ' dont le haut est à la hauteur ', T('h'), '. On néglige les frottements, g = 9,8 N/kg. Quelle est la vitesse de la bille en haut de la rampe, en m/s ?'];
      return { tokens: tk2, derivees: ['Em conservée : ½ m v0² = m g h + ½ m v²', 'v = sqrt(v0² − 2 × g × h)'], texte, utiles: ['v', 'h'],
        raisons: { m: 'La masse se simplifie dans la conservation de l’énergie.', a: 'Sans frottement, l’inclinaison n’intervient pas.' },
        cherche: { bonne: 'La vitesse de la bille en haut de la rampe (en m/s)', faux: ['La vitesse d’éjection minimale (en m/s)', 'La perte d’énergie mécanique (en J)', 'La longueur de la rampe (en m)'] },
        manque: null, solution: { txt: 'v = sqrt(v0² − 2 × g × h)', val: Math.sqrt(p.v * p.v - 2 * 9.8 * p.h), u: 'm/s' } };
    }),
  },
];
