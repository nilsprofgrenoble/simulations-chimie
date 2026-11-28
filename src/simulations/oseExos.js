// Exercices ANA, VAL et S'APP de la simulation 322 « Énergie d'un oscillateur et entretien des oscillations » (terminale STL, SPCL, Ondes, séquence 1). Préfixe : ose-.
// Capacités visées (jamais affichées) : échanges d'énergie en mécanique et en électricité ; rôle d'un dispositif d'entretien ; analogies mécanique-électricité.
const DOM = 'Énergie d’un oscillateur';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const OSE_ANA = [
  { id: 'ose-ana-equilibre', schema: { type: 'oseChariot' }, domaine: DOM, titre: 'Énergie au passage par l’équilibre',
    enonce: 'Un chariot, relié à un ressort et roulant sur un rail, oscille sans frottements. On le regarde à l’instant où il passe par sa position d’équilibre.', q: 'Quelle forme d’énergie du système est alors maximale ?', options: [
      F('l’énergie potentielle élastique', 'À l’équilibre le ressort n’est ni étiré ni comprimé : l’énergie potentielle élastique est nulle.'),
      V('l’énergie cinétique', 'À l’équilibre la vitesse est maximale : toute l’énergie mécanique est cinétique.'),
      F('les deux formes, à parts égales', 'Les deux ne sont à parts égales qu’à certains instants, pas au passage par l’équilibre où l’une est nulle.'),
      F('aucune, car le chariot ne s’arrête pas', 'Le chariot possède de l’énergie cinétique tant qu’il se déplace, et elle est maximale à l’équilibre.'),
    ] },
  { id: 'ose-ana-doubler', schema: { type: 'oseChariot' }, domaine: DOM, titre: 'Écarter deux fois plus le chariot',
    enonce: 'Un chariot relié à un ressort est lâché sans vitesse après avoir été écarté de sa position d’équilibre. On recommence l’expérience, avec le même ressort, en l’écartant deux fois plus loin.', q: 'Que devient l’énergie mécanique initiale du système ?', options: [
      F('elle est multipliée par 2', 'L’énergie potentielle élastique ½ k x² varie comme le carré de l’élongation, pas comme l’élongation.'),
      F('elle ne change pas, car le ressort est le même', 'L’énergie dépend de l’élongation : un ressort plus étiré emmagasine plus d’énergie.'),
      F('elle est divisée par 2', 'Un ressort plus étiré emmagasine davantage d’énergie, pas moins.'),
      V('elle est multipliée par 4', 'Ep = ½ k x² : si x double, x² est multiplié par 4, donc l’énergie aussi.'),
    ] },
  { id: 'ose-ana-chaleur', schema: { type: 'oseChariot', amort: true }, domaine: DOM, titre: 'Où va l’énergie perdue ?',
    enonce: 'Un chariot relié à un ressort et à un amortisseur oscille avec des amplitudes de plus en plus petites : son énergie mécanique diminue.', q: 'Que devient l’énergie mécanique perdue ?', options: [
      F('elle disparaît définitivement', 'L’énergie ne disparaît pas : elle est transférée sous une autre forme.'),
      F('elle est stockée dans le ressort, qui devient plus raide', 'Le ressort ne change pas : l’énergie perdue n’y est pas stockée.'),
      V('elle est dissipée sous forme de chaleur', 'Les frottements échauffent légèrement l’amortisseur, le ressort et l’air : l’énergie mécanique perdue devient de la chaleur.'),
      F('elle se transforme en énergie cinétique supplémentaire', 'Une énergie cinétique supplémentaire ferait augmenter la vitesse, alors que l’amplitude diminue.'),
    ] },
  { id: 'ose-ana-lc', schema: { type: 'oseLC' }, domaine: DOM, titre: 'Énergie dans un circuit LC',
    enonce: 'Un circuit est formé d’une bobine et d’un condensateur en série, sans résistance. Le condensateur est chargé au départ, puis il se décharge dans la bobine.', q: 'À l’instant où le condensateur est complètement déchargé (tension nulle), où est stockée l’énergie du circuit ?', options: [
      V('dans la bobine, où le courant est maximal', 'Toute l’énergie est magnétique, stockée dans la bobine : c’est l’analogue du chariot à l’équilibre.'),
      F('dans le condensateur, qui reste chargé', 'Sa tension est nulle : il ne stocke plus d’énergie (½ C u² = 0).'),
      F('elle a été dissipée dans la résistance', 'Le circuit étant sans résistance, rien n’est dissipé : l’énergie se conserve.'),
      F('elle est répartie à égalité entre les deux composants', 'La tension du condensateur est nulle : tout le stockage se fait dans la bobine.'),
    ] },
];

export const OSE_VAL = [
  P({ id: 'ose-val-constante', schema: { type: 'oseChariot', amort: true }, domaine: DOM, niveau: 2, titre: 'Énergie mécanique d’un oscillateur amorti', plausible: false,
    enonce: 'Un élève affirme : « un chariot relié à un ressort et à un amortisseur oscille de moins en moins, mais son énergie mécanique Ec + Ep reste constante ».',
    reperes: [['Système', 'chariot, ressort et amortisseur'], ['Énergie mécanique', 'Ec + Ep']],
    ver: 'Avec des frottements, l’amplitude diminue donc l’énergie potentielle maximale diminue : l’énergie mécanique décroît. L’énergie perdue est dissipée sous forme de chaleur.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il oublie que les frottements dissipent de l’énergie mécanique', 'Les frottements transforment de l’énergie mécanique en chaleur : Ec + Ep diminue.'),
      F('il pense que l’énergie cinétique est maximale à l’élongation maximale', 'L’énoncé ne dit rien de tel : l’erreur concerne l’énergie mécanique totale.'),
      F('il confond l’énergie et la puissance', 'L’énoncé parle bien d’énergie : la confusion n’est pas là.'),
    ] }),
  P({ id: 'ose-val-entretien', schema: { type: 'oseLC', resistance: true }, domaine: DOM, niveau: 2, titre: 'Rôle d’un dispositif d’entretien', plausible: false,
    enonce: 'Une élève écrit : « pour entretenir les oscillations d’un circuit RLC, il faut lui apporter à chaque période beaucoup plus d’énergie que ce que la résistance dissipe ».',
    reperes: [['Circuit', 'bobine, condensateur et résistance'], ['Entretien', 'dispositif qui apporte de l’énergie']],
    ver: 'Pour maintenir une amplitude constante, il suffit d’apporter à chaque période exactement l’énergie dissipée. Un apport bien supérieur ferait augmenter l’amplitude.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      F('elle pense que le dispositif d’entretien ne sert à rien', 'Sans entretien, l’amplitude diminuerait : le dispositif est utile.'),
      V('il suffit de compenser les pertes', 'Un apport égal aux pertes garde l’amplitude constante ; un apport bien plus grand ferait croître l’amplitude.'),
      F('elle confond la bobine et le condensateur', 'L’énoncé ne parle pas de ces composants : l’erreur est ailleurs.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const nf = (v, d = 1) => v.toFixed(d).replace('.', ',');
export const OSE_SAPP = [
  {
    id: 'ose-sapp-ressort', schema: () => ({ type: 'oseChariot', symboles: true }), domaine: DOM, titre: 'Énergie emmagasinée par le ressort d’un chariot', noms: ['Énergie potentielle élastique', 'Énergie mécanique'],
    gen: () => ({ k: tire([20, 25, 40, 50, 80]), x: tire([3, 4, 5, 6, 8]), m: tire([0.2, 0.5, 1]), T: tire([0.5, 0.8, 1.2]) }),
    build: epure((p, q) => {
      const tokens = {
        k: tok(`${p.k} N/m`, 'Raideur du ressort', p.k, 'N/m'), x: tok(`${p.x} cm`, 'Élongation initiale', p.x, 'cm'), m: tok(`${nf(p.m)} kg`, 'Masse du chariot', p.m, 'kg'), T: tok(`${nf(p.T)} s`, 'Période des oscillations', p.T, 's'),
      };
      const raisons = { m: 'La masse ne sert pas à calculer l’énergie emmagasinée par le ressort.', T: 'La période n’intervient pas dans le calcul d’une énergie potentielle élastique.' };
      const debut = ['Un chariot de masse ', T('m'), ' est relié à un ressort de raideur ', T('k'), '. On l’écarte de ', T('x'), ' de sa position d’équilibre, puis on le lâche sans vitesse ; il oscille avec une période ', T('T'), ', sans frottements. '];
      const Ep = 0.5 * p.k * (p.x / 100) ** 2;
      return q === 0
        ? { tokens, derivees: ['Ep = frac(1|2) × k × x²'], texte: [...debut, 'Quelle est l’énergie potentielle élastique du ressort à l’instant du lâcher ?'], utiles: ['k', 'x'],
          raisons, cherche: { bonne: 'L’énergie potentielle élastique du ressort', faux: ['L’énergie cinétique du chariot', 'La période des oscillations', 'La masse du chariot'] }, manque: null, solution: { txt: 'frac(1|2) × k × x²', val: Ep, u: 'J' } }
        : { tokens, derivees: ['Em = Ep (au lâcher, Ec = 0)'], texte: [...debut, 'Quelle est l’énergie mécanique du système pendant tout le mouvement ?'], utiles: ['k', 'x'],
          raisons, cherche: { bonne: 'L’énergie mécanique du système', faux: ['L’énergie cinétique à l’équilibre uniquement', 'La période des oscillations', 'La masse du chariot'] }, manque: null, solution: { txt: 'frac(1|2) × k × x² (Ec = 0 au lâcher)', val: Ep, u: 'J' } };
    }),
  },
  {
    id: 'ose-sapp-vitesse', schema: () => ({ type: 'oseChariot', symboles: true }), domaine: DOM, titre: 'Énergie cinétique et vitesse d’un chariot', noms: ['Énergie cinétique', 'Vitesse maximale'],
    gen: () => ({ m: tire([0.2, 0.25, 0.5, 1]), v: tire([0.3, 0.4, 0.5, 0.8]), k: tire([20, 40, 80]) }),
    build: epure((p, q) => {
      const tokens = {
        m: tok(`${nf(p.m, 2)} kg`, 'Masse du chariot', p.m, 'kg'), v: tok(`${nf(p.v)} m/s`, 'Vitesse du chariot', p.v, 'm/s'), k: tok(`${p.k} N/m`, 'Raideur du ressort', p.k, 'N/m'), E: tok(`${nf(0.5 * p.m * p.v * p.v, 3)} J`, 'Énergie mécanique', 0.5 * p.m * p.v * p.v, 'J'),
      };
      const raisons = { k: 'La raideur du ressort ne sert pas à calculer l’énergie cinétique ni la vitesse à partir de l’énergie.' };
      return q === 0
        ? { tokens, derivees: ['Ec = frac(1|2) × m × v²'], texte: ['Un chariot de masse ', T('m'), ' relié à un ressort de raideur ', T('k'), ' passe par sa position d’équilibre à la vitesse ', T('v'), '. Quelle est son énergie cinétique à cet instant ?'], utiles: ['m', 'v'],
          raisons, cherche: { bonne: 'L’énergie cinétique du chariot', faux: ['L’énergie potentielle élastique à l’équilibre', 'La raideur du ressort', 'La vitesse du chariot'] }, manque: null, solution: { txt: 'frac(1|2) × m × v²', val: 0.5 * p.m * p.v * p.v, u: 'J' } }
        : { tokens, derivees: ['v = sqrt(frac(2 × Em|m))'], texte: ['Un chariot de masse ', T('m'), ' relié à un ressort de raideur ', T('k'), ' oscille sans frottements ; son énergie mécanique est ', T('E'), '. Quelle est sa vitesse maximale, atteinte au passage par l’équilibre ?'], utiles: ['m', 'E'],
          raisons, cherche: { bonne: 'La vitesse maximale du chariot', faux: ['L’énergie cinétique du chariot', 'La raideur du ressort', 'La masse du chariot'] }, manque: null, solution: { txt: 'sqrt(frac(2 × Em|m))', val: p.v, u: 'm/s' } };
    }),
  },
];
void T;
