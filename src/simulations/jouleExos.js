// Exercices ANA, VAL et S'APP de la simulation 232 « Effet Joule : puissance, énergie thermique et pertes ». Préfixe : jou-.
// Capacités visées (jamais affichées) : loi d'Ohm ; puissance électrique reçue ; relation entre puissance et énergie ; interpréter l'effet Joule comme conversion d'énergie électrique en énergie thermique, en citer des applications ; analyser les échanges d'énergie dans un circuit simple.
const DOM = 'Effet Joule : puissance, énergie thermique et pertes';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const JOU_ANA = [
  { id: 'jou-ana-courant', domaine: DOM, titre: 'Un courant trois fois plus intense',
    enonce: 'Un résistor de résistance constante est parcouru par un courant. On triple l’intensité de ce courant (par exemple en augmentant la tension de la source).', q: 'Que devient la puissance dissipée par effet Joule dans le résistor ?', options: [
      V('elle est multipliée par 9, car P = R × I² dépend du carré de I', 'À résistance égale, P = R × I² : si I est multipliée par 3, P est multipliée par 3² = 9.'),
      F('elle est multipliée par 3, car la puissance est proportionnelle à I', 'La puissance dissipée dépend du carré de l’intensité (P = R × I²), pas de l’intensité seule : elle est multipliée par 9.'),
      F('elle ne change pas, car la résistance du résistor est la même', 'R est constante, mais P = R × I² dépend aussi de I : si I triple, P est multipliée par 9.'),
      F('elle est multipliée par 6, car I triple et la tension double', 'Rien dans l’énoncé ne dit que la tension double ; avec R constante, P = R × I² est multipliée par 3² = 9.'),
    ] },
  { id: 'jou-ana-tension', domaine: DOM, titre: 'Une tension deux fois plus petite',
    enonce: 'Un résistor de résistance constante est branché sur une source de tension. On remplace la source par une autre dont la tension est deux fois plus petite.', q: 'Que devient la puissance dissipée par effet Joule dans le résistor ?', options: [
      V('elle est divisée par 4 : I est divisée par 2, donc R × I² par 4', 'Avec R constante, I = U ÷ R est divisée par 2 ; P = R × I² est donc divisée par 2² = 4 (ou P = U² ÷ R).'),
      F('elle est divisée par 2, car la tension utilisée est divisée par 2', 'La puissance dépend du carré de la tension (P = U² ÷ R) : elle est divisée par 4.'),
      F('elle ne change pas, car la résistance du résistor est la même', 'La résistance est la même, mais le courant et donc la puissance diminuent : P est divisée par 4.'),
      F('elle est multipliée par 2, car I diminue', 'Si I diminue, P = R × I² diminue aussi : elle est divisée par 4.'),
    ] },
  { id: 'jou-ana-duree', domaine: DOM, titre: 'Un chauffage allumé trois fois plus longtemps',
    enonce: 'Un résistor chauffant est parcouru par un courant constant. On le laisse allumé trois fois plus longtemps, sans rien changer d’autre.', q: 'Que deviennent la puissance dissipée et l’énergie thermique dégagée ?', options: [
      V('la puissance ne change pas, l’énergie est multipliée par 3', 'La puissance dépend de R et de I, pas de la durée. W = P × Δt est proportionnelle à la durée : elle triple.'),
      F('la puissance et l’énergie sont multipliées par 3', 'La puissance est une énergie par seconde : elle ne change pas avec la durée ; seule l’énergie triple.'),
      F('la puissance est divisée par 3, l’énergie ne change pas', 'Rien ne change pour la puissance ; l’énergie dégagée, elle, augmente avec la durée.'),
      F('ni la puissance ni l’énergie ne changent, car le courant est constant', 'Le courant est constant, donc la puissance aussi, mais l’énergie dégagée augmente tant que le résistor chauffe.'),
    ] },
  { id: 'jou-ana-ligne', domaine: DOM, titre: 'Transporter la même puissance sous dix fois plus de tension',
    enonce: 'Une installation transporte une puissance donnée dans un câble de résistance r. On décide de la transporter sous une tension dix fois plus grande, à la même puissance.', q: 'Que deviennent l’intensité dans le câble et les pertes par effet Joule ?', options: [
      V('l’intensité est divisée par 10 et les pertes par 100', 'P = U × I : à puissance égale, U × 10 donne I ÷ 10. Les pertes r × I² sont alors divisées par 10² = 100.'),
      F('l’intensité est divisée par 10 et les pertes aussi', 'Les pertes sont proportionnelles à I² : si I est divisée par 10, elles sont divisées par 100.'),
      F('l’intensité ne change pas et les pertes sont divisées par 10', 'Pour une puissance donnée, P = U × I : si la tension est multipliée par 10, l’intensité est divisée par 10.'),
      F('l’intensité est multipliée par 10 et les pertes par 100', 'C’est l’inverse : à puissance égale, une tension plus grande demande un courant plus petit.'),
    ] },
];

export const JOU_VAL = [
  P({ id: 'jou-val-puissance', domaine: DOM, niveau: 1, titre: 'Puissance dissipée dans un résistor de 100 Ω', plausible: true,
    enonce: 'Un résistor de résistance 100 Ω est parcouru par un courant de 0,30 A. Un élève trouve une puissance dissipée de 9,0 W.',
    reperes: [['Résistance R', '100 Ω'], ['Intensité I', '0,30 A'], ['P = R × I²', '100 × 0,30² = 9,0 W'], ['Tension U = R × I', '30 V (et U × I = 9,0 W)']],
    ver: 'P = R × I² = 100 × 0,30² = 9,0 W ; on retrouve U × I = 30 × 0,30 = 9,0 W. La valeur de l’élève est cohérente : elle est plausible.',
    q2: 'Ce résistor reste allumé 5,0 minutes. Quelle énergie thermique dégage-t-il ?',
    options: [
      V('environ 2 700 J, car W = P × Δt = 9,0 × 300', 'La durée doit être en secondes : 5,0 min = 300 s ; W = 9,0 × 300 = 2 700 J.'),
      F('environ 45 J, car W = P × Δt = 9,0 × 5,0', 'La durée a été laissée en minutes : il faut la convertir en secondes (5,0 min = 300 s) pour obtenir des joules.'),
      F('environ 9,0 J, car l’énergie est égale à la puissance', 'Une énergie est une puissance multipliée par une durée : W = P × Δt.'),
    ] }),
  P({ id: 'jou-val-energie', domaine: DOM, niveau: 2, titre: 'Énergie dégagée par un résistor de 500 W', plausible: false,
    enonce: 'Un résistor chauffant de puissance 500 W fonctionne pendant 2,0 minutes. Un élève écrit : « W = P × Δt = 500 × 2,0 = 1 000 J ».',
    reperes: [['Puissance P', '500 W'], ['Durée Δt', '2,0 min = 120 s'], ['W = P × Δt', '500 × 120 = 60 000 J'], ['Valeur de l’élève', '1 000 J (60 fois trop petite)']],
    ver: 'La durée doit être en secondes : 2,0 min = 120 s ; W = 500 × 120 = 60 000 J = 60 kJ. La valeur de l’élève est 60 fois trop petite : elle n’est pas plausible (la durée est restée en minutes).',
    q2: 'Quelle est la cause de l’écart ?',
    options: [
      V('la durée est restée en minutes au lieu d’être convertie en secondes', 'Pour obtenir des joules avec des watts, la durée doit être en secondes : 2,0 min = 120 s.'),
      F('la puissance aurait dû être divisée par la durée', 'L’énergie est le produit de la puissance par la durée, pas leur quotient.'),
      F('l’énergie thermique d’un résistor ne se calcule pas avec sa puissance', 'Si : le résistor convertit toute l’énergie électrique en énergie thermique, W = P × Δt.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const virg = (x, d) => Number(x).toFixed(d).replace('.', ',');
export const JOU_SAPP = [
  {
    id: 'jou-sapp-puissance', domaine: DOM, titre: 'Puissance dissipée dans un résistor', noms: ['Intensité du courant', 'Puissance dissipée'],
    gen: () => ({ R: tire([10, 15, 20, 30]), U: tire([6, 12, 24]), m: tire([12, 25, 40]), Tmax: tire([120, 150, 200]) }),
    build: epure((p, q) => {
      const tokens = {
        R: tok(`${p.R} Ω`, 'Résistance du résistor', p.R, 'Ω'),
        U: tok(`${p.U} V`, 'Tension aux bornes du résistor', p.U, 'V'),
        m: tok(`${p.m} g`, 'Masse du résistor', p.m, 'g'),
        Tmax: tok(`${p.Tmax} °C`, 'Température maximale supportée par le résistor', p.Tmax, '°C'),
      };
      const debut = ['Un résistor chauffant de résistance ', T('R'), ' et de masse ', T('m'), ' supporte au maximum ', T('Tmax'), '. Il est branché sur une source de tension ', T('U'), '. '];
      if (q === 0) return { tokens, derivees: ['I = U ÷ R'], texte: [...debut, 'Quelle est l’intensité du courant dans le résistor ?'], utiles: ['U', 'R'],
        raisons: { m: 'La masse ne sert pas dans ce calcul.', Tmax: 'La température maximale ne sert pas dans ce calcul.' },
        cherche: { bonne: 'L’intensité du courant (en A)', faux: ['La puissance dissipée (en W)', 'L’énergie dégagée en une minute (en J)', 'La résistance du résistor (en Ω)'] },
        manque: null, solution: { txt: 'I = U ÷ R', val: p.U / p.R, u: 'A' } };
      return { tokens, derivees: ['I = U ÷ R', 'P = U × I (ou P = U² ÷ R)'], texte: [...debut, 'Quelle est la puissance dissipée par effet Joule ?'], utiles: ['U', 'R'],
        raisons: { m: 'La masse ne sert pas dans ce calcul.', Tmax: 'La température maximale ne sert pas dans ce calcul.' },
        cherche: { bonne: 'La puissance dissipée (en W)', faux: ['L’intensité du courant (en A)', 'L’énergie dégagée en une minute (en J)', 'La température atteinte (en °C)'] },
        manque: null, solution: { txt: 'P = U² ÷ R', val: p.U * p.U / p.R, u: 'W' } };
    }),
  },
  {
    id: 'jou-sapp-energie', domaine: DOM, titre: 'Énergie thermique dégagée par un résistor', noms: ['Énergie en J', 'Énergie en Wh'],
    gen: () => ({ P: tire([6, 12, 20, 30]), dt: tire([2, 5, 10, 15]), R: tire([10, 24, 30]), m: tire([12, 25, 40]) }),
    build: epure((p, q) => {
      const tokens = {
        P: tok(`${p.P} W`, 'Puissance dissipée par le résistor', p.P, 'W'),
        dt: tok(`${p.dt} min`, 'Durée de fonctionnement', p.dt, 'min'),
        R: tok(`${p.R} Ω`, 'Résistance du résistor', p.R, 'Ω'),
        m: tok(`${p.m} g`, 'Masse du résistor', p.m, 'g'),
      };
      const debut = ['Un résistor de résistance ', T('R'), ' et de masse ', T('m'), ' dissipe une puissance ', T('P'), ' pendant ', T('dt'), '. '];
      if (q === 0) return { tokens, derivees: ['durée en s = durée en min × 60', 'W = P × Δt'], texte: [...debut, 'Quelle énergie thermique dégage-t-il, en joules ?'], utiles: ['P', 'dt'],
        raisons: { R: 'La résistance ne sert pas ici : la puissance est donnée.', m: 'La masse ne sert pas dans ce calcul.' },
        cherche: { bonne: 'L’énergie thermique dégagée (en J)', faux: ['L’intensité du courant (en A)', 'La puissance dissipée (en W)', 'La température atteinte (en °C)'] },
        manque: null, solution: { txt: 'W = P × Δt, avec Δt en s', val: p.P * p.dt * 60, u: 'J' } };
      return { tokens, derivees: ['durée en h = durée en min ÷ 60', 'W (Wh) = P × Δt'], texte: [...debut, 'Quelle énergie thermique dégage-t-il, en wattheures ?'], utiles: ['P', 'dt'],
        raisons: { R: 'La résistance ne sert pas ici : la puissance est donnée.', m: 'La masse ne sert pas dans ce calcul.' },
        cherche: { bonne: 'L’énergie thermique dégagée (en Wh)', faux: ['L’énergie thermique dégagée (en J)', 'La puissance dissipée (en W)', 'La durée de fonctionnement (en h)'] },
        manque: null, solution: { txt: 'W = P × Δt, avec Δt en h', val: p.P * p.dt / 60, u: 'Wh' } };
    }),
  },
];
