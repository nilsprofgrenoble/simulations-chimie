// Exercices ANA, VAL et S'APP de la simulation 323 « Oscillations forcées et résonance » (terminale STL, SPCL, Ondes, séquence 1). Préfixe : osr-.
// Capacités visées (jamais affichées) : résonance (fréquence de résonance, facteur de qualité) ; lien qualitatif entre Q et amortissement.
const DOM = 'Oscillations forcées et résonance';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const OSR_ANA = [
  { id: 'osr-ana-frequence', schema: { type: 'osrExcite' }, domaine: DOM, titre: 'Fréquence en régime permanent',
    enonce: 'Une masse suspendue à un ressort est excitée par un moteur qui impose une fréquence fe. On attend que le régime transitoire soit terminé.', q: 'En régime permanent, à quelle fréquence la masse oscille-t-elle ?', options: [
      F('à sa fréquence propre, quelle que soit la fréquence du moteur', 'En oscillation forcée, c’est l’excitateur qui impose le rythme : la fréquence propre ne s’impose pas.'),
      V('à la fréquence fe du moteur', 'En régime permanent, l’oscillateur oscille à la fréquence de l’excitateur.'),
      F('à la somme de la fréquence propre et de fe', 'Les deux fréquences ne s’additionnent pas en régime permanent : seule la fréquence de l’excitateur subsiste.'),
      F('à une fréquence qui change sans cesse', 'Le régime permanent est stable : la fréquence et l’amplitude sont constantes.'),
    ] },
  { id: 'osr-ana-resonance', schema: { type: 'osrExcite' }, domaine: DOM, titre: 'Où est la résonance ?',
    enonce: 'Un oscillateur peu amorti a une fréquence propre f₀. On l’excite avec un moteur dont on peut régler la fréquence fe.', q: 'Pour quelle fréquence d’excitation l’amplitude des oscillations est-elle maximale ?', options: [
      F('pour une fréquence fe très inférieure à f₀', 'Une excitation très lente produit une amplitude voisine de celle de l’excitateur, sans amplification.'),
      F('pour une fréquence fe très supérieure à f₀', 'Une excitation très rapide produit une amplitude faible : l’oscillateur ne suit pas.'),
      F('pour fe = 0', 'À fréquence nulle, il n’y a pas d’oscillation forcée.'),
      V('pour une fréquence fe voisine de f₀', 'La résonance a lieu quand fe est voisine de la fréquence propre, très proche de f₀ si l’amortissement est faible.'),
    ] },
  { id: 'osr-ana-amortissement', schema: { type: 'osrCourbe', deux: true }, domaine: DOM, titre: 'Effet de l’amortissement sur la résonance',
    enonce: 'On trace les courbes de résonance d’un même oscillateur avec deux amortissements différents : l’une a un pic haut et étroit, l’autre un pic bas et large.', q: 'Quelle courbe correspond à l’amortissement le plus fort ?', options: [
      F('la courbe au pic haut et étroit', 'Un pic haut et étroit traduit une faible dissipation d’énergie.'),
      V('la courbe au pic bas et large', 'Un amortissement fort dissipe plus d’énergie : le pic est plus bas et plus large.'),
      F('les deux, car l’amortissement ne change pas l’amplitude', 'L’amortissement modifie la hauteur et la largeur du pic.'),
      F('aucune : il n’y a pas de résonance dans ce cas', 'Il y a résonance dans les deux cas, plus ou moins marquée.'),
    ] },
  { id: 'osr-ana-qualite', schema: { type: 'osrCourbe', bande: true }, domaine: DOM, titre: 'Largeur de bande et facteur de qualité',
    enonce: 'La résonance d’un oscillateur a lieu à la fréquence fres, avec une largeur de bande Δf. On modifie l’oscillateur : fres reste la même, mais la largeur de bande devient deux fois plus grande.', q: 'Que devient le facteur de qualité Q = fres divisée par Δf ?', options: [
      F('il est multiplié par 2', 'Q est inversement proportionnel à Δf : une bande plus large donne un Q plus petit.'),
      F('il ne change pas, car fres est inchangée', 'Q dépend aussi de Δf : si Δf change, Q change.'),
      V('il est divisé par 2', 'Q = fres divisée par Δf : si Δf double, Q est divisé par 2.'),
      F('il est divisé par 4', 'Q varie comme l’inverse de Δf, pas comme son carré : le facteur est 2, pas 4.'),
    ] },
];

export const OSR_VAL = [
  P({ id: 'osr-val-frequence', schema: { type: 'osrExcite' }, domaine: DOM, niveau: 2, titre: 'Fréquence d’un oscillateur forcé', plausible: false,
    enonce: 'Un élève affirme : « un oscillateur forcé par un moteur oscille toujours, en régime permanent, à sa fréquence propre, même si le moteur tourne à une autre fréquence ».',
    reperes: [['Système', 'oscillateur excité par un moteur'], ['Régime', 'permanent, après le régime transitoire']],
    ver: 'En régime permanent, l’oscillateur oscille à la fréquence imposée par l’excitateur. La fréquence propre ne joue que dans l’amplitude (résonance) et dans le régime transitoire.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('c’est l’excitateur qui impose la fréquence', 'L’oscillateur oscille à la fréquence du moteur, pas à sa fréquence propre.'),
      F('il pense que le moteur ne fournit pas d’énergie', 'L’énoncé ne parle pas de l’énergie apportée par le moteur.'),
      F('il confond la résonance avec le régime transitoire', 'L’énoncé ne parle ni de résonance ni de transitoire : l’erreur est sur la fréquence.'),
    ] }),
  P({ id: 'osr-val-q', schema: { type: 'osrCourbe', bande: true }, domaine: DOM, niveau: 2, titre: 'Calcul d’un facteur de qualité', plausible: false,
    enonce: 'Une élève lit sur une courbe de résonance : fres = 10 Hz et une largeur de bande Δf = 0,50 Hz. Elle calcule Q = Δf divisée par fres = 0,050 et conclut : « la résonance est très marquée ».',
    reperes: [['Mesures', 'fres = 10 Hz ; Δf = 0,50 Hz'], ['Résultat annoncé', 'Q = 0,050']],
    ver: 'Le facteur de qualité est Q = fres divisée par Δf = 10 Hz divisée par 0,50 Hz = 20. Un Q inférieur à 1 correspondrait à un pic très large : la conclusion de l’élève serait fausse.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      F('elle a confondu les hertz et les kilohertz', 'Les deux valeurs sont en hertz : l’erreur n’est pas dans l’unité.'),
      V('elle a inversé le rapport', 'Q = 10 divisée par 0,50 = 20 : une valeur élevée, qui correspond bien à un pic étroit.'),
      F('elle devrait exprimer Q en hertz', 'Q est un rapport de deux fréquences : il n’a pas d’unité.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const nf = (v, d = 1) => v.toFixed(d).replace('.', ',');
export const OSR_SAPP = [
  {
    id: 'osr-sapp-qualite', schema: () => ({ type: 'osrCourbe', bande: true }), domaine: DOM, titre: 'Facteur de qualité d’une résonance', noms: ['Largeur de bande', 'Facteur de qualité'],
    gen: () => { const fr = tire([5, 8, 10, 12, 20, 25]), Q = tire([5, 8, 10, 16, 20]), df = fr / Q; return { fr, df: Math.round(df * 100) / 100, amp: tire([2.5, 4, 6, 8]), m: tire([0.2, 0.5, 1]) }; },
    build: epure((p, q) => {
      const tokens = {
        fr: tok(`${nf(p.fr)} Hz`, 'Fréquence de résonance', p.fr, 'Hz'), df: tok(`${nf(p.df, 2)} Hz`, 'Largeur de bande', p.df, 'Hz'), amp: tok(`${nf(p.amp)} cm`, 'Amplitude maximale', p.amp, 'cm'), m: tok(`${nf(p.m, 1)} kg`, 'Masse de l’oscillateur', p.m, 'kg'),
      };
      const raisons = { amp: 'L’amplitude maximale ne sert pas à calculer le facteur de qualité.', m: 'La masse ne sert pas à calculer le facteur de qualité.' };
      const debut = ['La courbe de résonance d’un oscillateur de masse ', T('m'), ' présente un maximum de ', T('amp'), ' à la fréquence ', T('fr'), '. Sa largeur de bande est ', T('df'), '. '];
      const Q = p.fr / p.df;
      return q === 0
        ? { tokens, derivees: ['Q = frac(fres|Δf)'], texte: [...debut, 'Quel est le facteur de qualité Q de la résonance ?'], utiles: ['fr', 'df'],
          raisons, cherche: { bonne: 'Le facteur de qualité de la résonance', faux: ['L’amplitude maximale', 'La masse de l’oscillateur', 'La fréquence propre en hertz'] }, manque: null, solution: { txt: 'frac(fres|Δf)', val: Q, u: '' } }
        : { tokens, derivees: ['Δf′ = frac(fres|Q′), avec Q′ = 2 × Q'], texte: [...debut, 'On double le facteur de qualité sans changer la fréquence de résonance. Quelle est alors la largeur de bande ?'], utiles: ['df'],
          raisons: { ...raisons, fr: 'La fréquence de résonance n’est pas nécessaire : il suffit de savoir que Q double et que Q est inversement proportionnel à Δf.' }, cherche: { bonne: 'La nouvelle largeur de bande', faux: ['L’amplitude maximale', 'La masse de l’oscillateur', 'Le nouveau facteur de qualité'] }, manque: null, solution: { txt: 'frac(Δf|2)', val: p.df / 2, u: 'Hz' } };
    }),
  },
  {
    id: 'osr-sapp-propre', schema: () => ({ type: 'osrExcite', symboles: true }), domaine: DOM, titre: 'Fréquence d’excitation à la résonance', noms: ['Fréquence propre', 'Période de l’excitateur'],
    gen: () => ({ T0: tire([0.2, 0.25, 0.4, 0.5, 0.8, 1.25]), m: tire([0.2, 0.5, 1]), Q: tire([8, 10, 15, 20]) }),
    build: epure((p, q) => {
      const tokens = { T0: tok(`${nf(p.T0, 2)} s`, 'Période propre', p.T0, 's'), m: tok(`${nf(p.m, 1)} kg`, 'Masse de l’oscillateur', p.m, 'kg'), Q: tok(`${p.Q}`, 'Facteur de qualité', p.Q, '') };
      const raisons = { m: 'La masse ne sert pas : la période propre est donnée.', Q: 'Le facteur de qualité n’est pas utile : l’amortissement est faible, donc fres ≈ f₀.' };
      const debut = ['Un oscillateur de masse ', T('m'), ' a un facteur de qualité ', T('Q'), ' et une période propre ', T('T0'), '. '];
      return q === 0
        ? { tokens, derivees: ['f₀ = frac(1|T₀)', 'fres ≈ f₀ (amortissement faible)'], texte: [...debut, 'À quelle fréquence faut-il l’exciter pour obtenir la résonance ?'], utiles: ['T0'],
          raisons, cherche: { bonne: 'La fréquence d’excitation à la résonance', faux: ['La largeur de bande', 'La masse de l’oscillateur', 'Le facteur de qualité'] }, manque: null, solution: { txt: 'frac(1|T₀)', val: 1 / p.T0, u: 'Hz' } }
        : { tokens, derivees: ['T = T₀ (excitation à la résonance)'], texte: [...debut, 'Quelle est la période du mouvement imposé par l’excitateur lorsque la résonance est atteinte ?'], utiles: ['T0'],
          raisons, cherche: { bonne: 'La période de l’excitateur à la résonance', faux: ['La largeur de bande', 'La masse de l’oscillateur', 'Le facteur de qualité'] }, manque: null, solution: { txt: 'T₀ (la période est l’inverse de fres ≈ f₀)', val: p.T0, u: 's' } };
    }),
  },
];
void T;
