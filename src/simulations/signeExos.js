// Exercices ANA, VAL et S'APP de la simulation 238 « Conservation de l'énergie : bilan et signe des transferts ». Préfixe : sgn-.
// Capacités visées (jamais affichées) : distinguer, dans un bilan d'énergie, la variation de l'énergie stockée et les transferts d'énergie (travail, transfert thermique) ; algébriser les transferts ; exploiter le principe de conservation de l'énergie ; ΔU = m c ΔT (relation donnée).
const DOM = 'Conservation de l’énergie : bilan et signe des transferts';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const SGN_ANA = [
  { id: 'sgn-ana-recoit', domaine: DOM, titre: 'Une pièce chaude plongée dans un bac d’eau',
    enonce: 'Une pièce métallique chaude est plongée dans un grand bac d’eau froide. La pièce cède 400 J à l’eau par transfert thermique. On étudie le système « l’eau du bac ».', q: 'Quelle est la valeur algébrique du transfert thermique Q pour l’eau ?', options: [
      V('Q = +400 J, car l’eau reçoit cette énergie de la pièce chaude', 'Une énergie reçue par le système est comptée positivement : pour l’eau, Q = +400 J.'),
      F('Q = −400 J, car un transfert thermique est toujours négatif', 'Le signe ne dépend pas de la nature du transfert mais du système : ce que l’eau reçoit est compté positivement.'),
      F('Q = 0 J, car l’eau ne fait que recevoir de la chaleur', 'Le transfert existe : l’eau reçoit 400 J, donc Q = +400 J.'),
      F('on ne peut pas savoir : le signe dépend de la température finale', 'Le signe se déduit du sens du transfert : reçu (+) ou cédé (−) par le système étudié.'),
    ] },
  { id: 'sgn-ana-cede', domaine: DOM, titre: 'Le même transfert, vu depuis la pièce métallique',
    enonce: 'Une pièce métallique chaude est plongée dans un grand bac d’eau froide. La pièce cède 400 J à l’eau par transfert thermique. On étudie maintenant le système « la pièce métallique ».', q: 'Que vaut le transfert thermique Q pour la pièce ?', options: [
      V('Q = −400 J, car la pièce cède cette énergie à l’eau froide', 'Une énergie cédée par le système est comptée négativement : pour la pièce, Q = −400 J.'),
      F('Q = +400 J, car la valeur du transfert ne change pas', 'La valeur absolue ne change pas, mais le signe dépend du système : la pièce cède de l’énergie, Q = −400 J.'),
      F('Q = 0 J, car la pièce ne stocke pas d’énergie', 'La pièce stocke de l’énergie interne ; et dans tous les cas le transfert échangé vaut 400 J en valeur absolue.'),
      F('Q = −800 J, car il faut compter l’énergie cédée puis reçue', 'On ne compte qu’une fois le transfert : 400 J cédés par la pièce, donc Q = −400 J.'),
    ] },
  { id: 'sgn-ana-conservation', domaine: DOM, titre: 'Un système qui reçoit un travail et cède un transfert thermique',
    enonce: 'Un système reçoit un travail W = +300 J et cède un transfert thermique Q = −100 J. On suppose qu’il n’échange pas d’autre énergie.', q: 'Que fait l’énergie stockée par ce système ?', options: [
      V('elle augmente de 200 J, car ΔE = (+300 J) + (−100 J) = +200 J', 'Le principe de conservation : la variation de l’énergie stockée est la somme algébrique des transferts, soit +300 + (−100) = +200 J.'),
      F('elle augmente de 400 J, car il faut additionner les valeurs absolues', 'Les transferts s’ajoutent avec leur signe : +300 − 100 = +200 J, pas 400 J.'),
      F('elle diminue de 100 J, car le système cède de la chaleur', 'Le système reçoit aussi 300 J : le bilan est +200 J, l’énergie stockée augmente.'),
      F('elle ne varie pas, car le système reçoit et cède de l’énergie', 'Elle ne serait constante que si les transferts se compensaient exactement, ce qui n’est pas le cas (300 J reçus, 100 J cédés).'),
    ] },
  { id: 'sgn-ana-regime', domaine: DOM, titre: 'Un four à température constante',
    enonce: 'Un four électrique fonctionne depuis longtemps ; la température de son enceinte est constante. Il reçoit du travail électrique et cède de la chaleur à la pièce.', q: 'Que peut-on dire des deux transferts, en valeur absolue ?', options: [
      V('ils sont égaux : ΔE = 0, donc l’énergie reçue égale l’énergie cédée', 'ΔE = 0, donc la somme algébrique des transferts est nulle : |W| = |Q|.'),
      F('le travail électrique reçu est plus grand, car le four doit en garder une partie', 'Si le four en gardait une partie, son énergie interne augmenterait et sa température aussi.'),
      F('la chaleur cédée est plus grande, car le four est plus chaud que la pièce', 'Le sens du transfert dépend des températures, mais sa valeur est fixée par le bilan : elle est égale au travail reçu.'),
      F('on ne peut rien dire sans connaître la température de la pièce', 'Ce n’est pas nécessaire : température constante signifie ΔE = 0, donc |W| = |Q|.'),
    ] },
];

export const SGN_VAL = [
  P({ id: 'sgn-val-bilan', domaine: DOM, niveau: 1, titre: 'Bilan d’énergie d’un bloc métallique', plausible: true,
    enonce: 'Un bloc métallique reçoit un travail W = +600 J et cède un transfert thermique Q = −250 J à l’air. Un élève trouve ΔU = +350 J et en conclut que la température du bloc augmente (pas de changement d’état).',
    reperes: [['Travail reçu', 'W = +600 J'], ['Transfert thermique cédé', 'Q = −250 J'], ['ΔU = W + Q', '600 − 250 = +350 J'], ['Signe de ΔU', 'positif : la température monte']],
    ver: 'ΔU = W + Q = 600 + (−250) = +350 J. ΔU est positive et il n’y a pas de changement d’état : la température du bloc augmente. L’élève a raison.',
    q2: 'Si le même bloc recevait W = +250 J et cédait Q = −250 J, que deviendrait sa température ?',
    options: [
      V('elle resterait constante, car ΔU = 250 − 250 = 0', 'Les transferts se compensent : ΔU = 0, la température ne varie pas.'),
      F('elle augmenterait, car le bloc reçoit un travail électrique', 'Il cède aussi 250 J : le bilan est nul, la température ne varie pas.'),
      F('elle diminuerait, car il cède de la chaleur', 'Il reçoit autant qu’il cède : ΔU = 0 et la température reste constante.'),
    ] }),
  P({ id: 'sgn-val-signe', domaine: DOM, niveau: 2, titre: 'Un bloc chaud qui cède de la chaleur', plausible: false,
    enonce: 'Un bloc chaud cède 120 J à l’air de la pièce par transfert thermique. Un élève écrit « Q = +120 J pour le bloc » et en déduit que l’énergie interne du bloc augmente.',
    reperes: [['Transfert', '120 J du bloc vers l’air'], ['Le bloc reçoit ou cède ?', 'il cède'], ['Q pour le bloc', '−120 J'], ['Sans autre transfert', 'ΔU = −120 J (elle diminue)']],
    ver: 'Le bloc cède de l’énergie : on compte ce transfert négativement, Q = −120 J. Sans autre transfert, ΔU = −120 J : l’énergie interne du bloc diminue. Le raisonnement de l’élève n’est pas plausible.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a compté + une énergie cédée par le système', 'Reçu : +, cédé : − pour le système étudié. Le bloc cède l’énergie, donc Q est négatif.'),
      F('il a oublié que l’air ne stocke pas d’énergie', 'L’air stocke de l’énergie interne ; le problème est le signe attribué à Q pour le bloc.'),
      F('il a confondu un transfert thermique avec un travail', 'Le transfert est bien thermique ; c’est son signe pour le bloc qui est faux.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const vir = x => String(Number(Number(x).toPrecision(3))).replace('.', ',');
export const SGN_SAPP = [
  {
    id: 'sgn-sapp-bloc', domaine: DOM, titre: 'Bilan d’énergie d’un bloc et variation de température', noms: ['Variation d’énergie interne', 'Variation de température'],
    gen: () => ({ W: tire([400, 600, 900, 1200]), Q: tire([100, 200, 300]), m: tire([0.40, 0.50, 0.80]), c: 385, dt: tire([30, 60, 120]) }),
    build: epure((p, q) => {
      const tokens = {
        W: tok(`${p.W} J`, 'Travail électrique reçu par le bloc', p.W, 'J'),
        Q: tok(`${p.Q} J`, 'Transfert thermique cédé à l’air par le bloc', p.Q, 'J'),
        m: tok(`${vir(p.m)} kg`, 'Masse du bloc de cuivre', p.m, 'kg'),
        c: tok(`${p.c} J·kg⁻¹·K⁻¹`, 'Capacité thermique massique du cuivre', p.c, 'J·kg⁻¹·K⁻¹'),
        dt: tok(`${p.dt} s`, 'Durée de l’opération', p.dt, 's'),
      };
      const debut = ['Un bloc de cuivre de masse ', T('m'), ' reçoit un travail électrique ', T('W'), ' et cède à l’air un transfert thermique ', T('Q'), ', pendant ', T('dt'), '. '];
      if (q === 0) return { tokens, derivees: ['ΔU = W + Q, avec W reçu (+) et Q cédé (−)'], texte: [...debut, 'Quelle est la variation d’énergie interne du bloc, en joules ?'], utiles: ['W', 'Q'],
        raisons: { m: 'La masse ne sert pas pour la variation d’énergie : elle servira pour la température.', c: 'La capacité thermique ne sert pas pour ce bilan.', dt: 'La durée ne sert pas : on cherche une énergie, pas une puissance.' },
        cherche: { bonne: 'La variation d’énergie interne du bloc (en J)', faux: ['La variation de température du bloc (en K)', 'La puissance du transfert thermique (en W)', 'L’énergie cédée à l’air (en J)'] },
        manque: null, solution: { txt: 'ΔU = W − Q (Q cédé)', val: p.W - p.Q, u: 'J' } };
      return { tokens, derivees: ['ΔU = W + Q, avec W reçu (+) et Q cédé (−)', 'ΔT = ΔU ÷ (m × c)'], texte: [...debut, 'La capacité thermique massique du cuivre vaut ', T('c'), '. Quelle est la variation de température du bloc, en kelvins ?'], utiles: ['W', 'Q', 'm', 'c'],
        raisons: { dt: 'La durée ne sert pas : on cherche une variation de température, pas une puissance.' },
        cherche: { bonne: 'La variation de température du bloc (en K)', faux: ['La variation d’énergie interne du bloc (en J)', 'La puissance du travail électrique (en W)', 'L’énergie cédée à l’air (en J)'] },
        manque: null, solution: { txt: 'ΔT = (W − Q) ÷ (m c)', val: (p.W - p.Q) / (p.m * p.c), u: 'K' } };
    }),
  },
  {
    id: 'sgn-sapp-air', domaine: DOM, titre: 'Énergie reçue par l’air et puissance du transfert', noms: ['Énergie reçue par l’air', 'Puissance du transfert thermique'],
    gen: () => ({ Q: tire([150, 240, 360, 450]), dt: tire([30, 60, 90, 120]), W: tire([600, 900]), m: tire([0.40, 0.50, 0.80]) }),
    build: epure((p, q) => {
      const tokens = {
        Q: tok(`${p.Q} J`, 'Énergie cédée par le bloc à l’air (transfert thermique)', p.Q, 'J'),
        dt: tok(`${p.dt} s`, 'Durée du transfert', p.dt, 's'),
        W: tok(`${p.W} J`, 'Travail électrique reçu par le bloc', p.W, 'J'),
        m: tok(`${vir(p.m)} kg`, 'Masse du bloc de cuivre', p.m, 'kg'),
      };
      const debut = ['Un bloc de cuivre de masse ', T('m'), ' reçoit un travail électrique ', T('W'), ' et cède à l’air de la pièce un transfert thermique ', T('Q'), ' en ', T('dt'), '. '];
      if (q === 0) return { tokens, derivees: ['pour l’air, le transfert est reçu : valeur algébrique positive'], texte: [...debut, 'On étudie le système « l’air de la pièce ». Quelle est la valeur algébrique du transfert thermique qu’il reçoit, en joules ?'], utiles: ['Q'],
        raisons: { m: 'La masse du bloc ne sert pas pour le transfert reçu par l’air.', W: 'Le travail est reçu par le bloc, pas par l’air.', dt: 'La durée ne sert pas : on cherche une énergie, pas une puissance.' },
        cherche: { bonne: 'Le transfert thermique reçu par l’air (en J, valeur algébrique)', faux: ['Le transfert thermique cédé par le bloc (en J, valeur algébrique)', 'La puissance du transfert (en W)', 'La variation d’énergie interne du bloc (en J)'] },
        manque: null, solution: { txt: 'Q reçu par l’air = + Q cédé par le bloc', val: p.Q, u: 'J' } };
      return { tokens, derivees: ['P = |Q| ÷ Δt'], texte: [...debut, 'Quelle est la puissance de ce transfert thermique, en watts ?'], utiles: ['Q', 'dt'],
        raisons: { m: 'La masse du bloc ne sert pas pour cette puissance.', W: 'Le travail reçu par le bloc ne sert pas : on étudie le transfert thermique.' },
        cherche: { bonne: 'La puissance du transfert thermique (en W)', faux: ['Le transfert thermique reçu par l’air (en J)', 'La variation d’énergie interne du bloc (en J)', 'La puissance du travail électrique (en W)'] },
        manque: null, solution: { txt: 'P = |Q| ÷ Δt', val: p.Q / p.dt, u: 'W' } };
    }),
  },
];
