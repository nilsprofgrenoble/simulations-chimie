// Exercices ANA, VAL et S'APP de la simulation 270 « Chute verticale avec frottement visqueux (1) ». Préfixe : fvi-.
// Capacités visées (jamais affichées) : régimes transitoire et permanent ; vitesse limite et temps caractéristique d'une chute avec frottement fluide linéaire ; effet de la masse et du coefficient de frottement.
const DOM = 'Chute avec frottement visqueux';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const FVI_ANA = [
  { id: 'fvi-ana-depart', domaine: DOM, titre: 'L’accélération juste après le lâcher',
    enonce: 'Un objet est lâché sans vitesse initiale dans un fluide visqueux. Le frottement vaut f = k v. On compare, à l’instant du lâcher, l’accélération de l’objet à celle qu’il aurait dans le vide.', q: 'À l’instant du lâcher, l’accélération dans le fluide est :', options: [
      V('la même que dans le vide : a = g', 'À t = 0, v = 0 donc f = k v = 0 : seul le poids agit.'),
      F('plus petite que dans le vide, car le fluide freine l’objet', 'Le frottement est proportionnel à la vitesse : il est nul tant que l’objet est immobile.'),
      F('nulle, car le fluide retient l’objet immobile', 'Le poids agit seul à cet instant : l’objet accélère avec a = g.'),
      F('plus grande que dans le vide, car le fluide pousse l’objet', 'Le frottement s’oppose au mouvement : il ne peut pas augmenter l’accélération.'),
    ] },
  { id: 'fvi-ana-permanent', domaine: DOM, titre: 'Une chute à vitesse constante',
    enonce: 'Un objet chute verticalement dans un fluide visqueux. Après quelques secondes, sa vitesse ne change plus : le régime permanent est atteint. Deux forces s’exercent sur lui : son poids et le frottement du fluide.', q: 'Que peut-on dire de ces deux forces ?', options: [
      V('elles ont la même valeur et des sens opposés', 'Vitesse constante en ligne droite : ΣF = 0, donc f = P avec des sens opposés.'),
      F('le frottement est plus grand que le poids, car l’objet est freiné', 'Si f > P, la vitesse diminuerait : elle ne serait pas constante.'),
      F('le frottement est nul, car l’objet n’accélère plus', 'Le frottement est maximal en régime permanent : f = k v_lim = P.'),
      F('le poids est plus grand que le frottement, car l’objet descend', 'Si P > f, la vitesse augmenterait encore : elle ne serait pas constante.'),
    ] },
  { id: 'fvi-ana-masse', domaine: DOM, titre: 'Un objet trois fois plus lourd',
    enonce: 'Dans un fluide donné (coefficient de frottement k fixé), on lâche successivement deux objets : le second a une masse trois fois plus grande que le premier. Pour chacun, on attend le régime permanent.', q: 'Comparée à celle du premier objet, la vitesse limite du second est :', options: [
      V('multipliée par 3 : v_lim = m g ÷ k', 'v_lim = m g ÷ k est proportionnelle à la masse m : elle est multipliée par 3.'),
      F('la même, car le fluide est le même', 'La vitesse limite dépend de la masse : v_lim = m g ÷ k.'),
      F('divisée par 3, car un objet plus lourd est plus freiné', 'Le poids est plus grand : il faut une vitesse plus grande pour que f = k v l’égale.'),
      F('multipliée par 9, car le poids varie comme m²', 'Le poids est proportionnel à m, pas à m² : le facteur est 3.'),
    ] },
  { id: 'fvi-ana-tau', domaine: DOM, titre: 'Un fluide quatre fois plus visqueux',
    enonce: 'Un objet est lâché dans un fluide, puis dans un autre fluide où le coefficient de frottement k est quatre fois plus grand. L’objet est le même dans les deux cas.', q: 'Comparée à celle du premier cas, la durée du régime transitoire dans le second est :', options: [
      V('divisée par 4 : τ = m ÷ k', 'τ = m ÷ k est inversement proportionnelle à k : elle est divisée par 4, comme la durée du régime transitoire (≈ 5 τ).'),
      F('multipliée par 4, car le fluide retient plus l’objet', 'Un frottement plus fort limite plus vite la vitesse : le régime permanent arrive plus tôt.'),
      F('la même : seule la masse de l’objet compte', 'τ = m ÷ k dépend aussi de k.'),
      F('divisée par 2, car k intervient par sa racine', 'τ est inversement proportionnelle à k, pas à sa racine : le facteur est 4.'),
    ] },
];

export const FVI_VAL = [
  P({ id: 'fvi-val-vlim', domaine: DOM, niveau: 1, titre: 'Vitesse limite : une confusion avec τ', plausible: false,
    enonce: 'Un objet de masse 3,0 kg est lâché sans vitesse dans un fluide de coefficient de frottement k = 6,0 kg/s (g = 9,8 N/kg). Un élève écrit : « En régime permanent, v_lim = m ÷ k = 3,0 ÷ 6,0 = 0,50 m/s. »',
    reperes: [['Masse m', '3,0 kg'], ['Coefficient k', '6,0 kg/s'], ['g', '9,8 N/kg']],
    ver: 'v_lim = m g ÷ k = 3,0 × 9,8 ÷ 6,0 = 4,9 m/s. Le quotient m ÷ k = 0,50 s est la constante de temps τ, pas une vitesse.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a calculé τ = m ÷ k ; il faut v_lim = m g ÷ k = 4,9 m/s', 'En régime permanent f = P : k v_lim = m g, donc v_lim = m g ÷ k. Le résultat 0,50 est en secondes, pas en m/s.'),
      F('il aurait dû multiplier par k : v_lim = m g × k', 'v_lim = m g ÷ k : le frottement fixe la vitesse limite en divisant le poids par k.'),
      F('il aurait dû ajouter le poids et le frottement dans le calcul', 'En régime permanent, les deux forces se compensent : f = P, on ne les additionne pas.'),
    ] }),
  P({ id: 'fvi-val-tau', domaine: DOM, niveau: 2, titre: 'Durée du régime transitoire', plausible: true,
    enonce: 'Un objet de masse 4,0 kg est lâché sans vitesse dans un fluide de coefficient de frottement k = 8,0 kg/s. Un élève écrit : « τ = m ÷ k = 4,0 ÷ 8,0 = 0,50 s. Le régime permanent est atteint au bout de 5 τ = 2,5 s. La vitesse limite vaut m g ÷ k = 4,9 m/s ; à t = τ, la vitesse est d’environ 3,1 m/s. »',
    reperes: [['Masse m', '4,0 kg'], ['Coefficient k', '8,0 kg/s'], ['g', '9,8 N/kg']],
    ver: 'τ = 0,50 s ; 5 τ = 2,5 s ; v_lim = 4,0 × 9,8 ÷ 8,0 = 4,9 m/s ; à t = τ : 0,63 × 4,9 ≈ 3,1 m/s : tous les résultats sont corrects.',
    q2: 'Que représente la valeur 3,1 m/s ?',
    options: [
      V('63 % de la vitesse limite, atteinte à la date τ', 'À t = τ, la vitesse atteint 63 % de v_lim : 0,63 × 4,9 ≈ 3,1 m/s.'),
      F('la vitesse limite, atteinte dès la date τ', 'À t = τ, la vitesse n’a pas encore atteint v_lim : seulement 63 % de v_lim.'),
      F('la moitié de la vitesse limite, atteinte à la date 5 τ', 'À 5 τ, la vitesse atteint déjà 99 % de v_lim.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const G = 9.8, fr = x => String(x).replace('.', ',');
const gen = () => ({ m: tire([1.0, 2.0, 2.5, 4.0, 5.0]), k: tire([2.0, 2.5, 4.0, 5.0, 8.0]), H: tire([0.5, 1.0, 2.0]) });
const toks = p => ({
  m: tok(`${fr(p.m.toFixed(1))} kg`, 'Masse de l’objet', p.m, 'kg'), k: tok(`${fr(p.k.toFixed(1))} kg/s`, 'Coefficient de frottement', p.k, 'kg/s'), g: tok('9,8 N/kg', 'Intensité de la pesanteur', G, 'N/kg'), H: tok(`${fr(p.H.toFixed(1))} m`, 'Hauteur du récipient', p.H, 'm'),
});
export const FVI_SAPP = [
  {
    id: 'fvi-sapp-vlim', domaine: DOM, titre: 'Un objet lâché dans un fluide visqueux : vitesse limite', noms: ['Vitesse limite', 'Vitesse limite avec une masse double'],
    gen,
    build: epure((p, q) => {
      const tokens = toks(p);
      const debut = ['Un objet de masse ', T('m'), ' est lâché sans vitesse dans un récipient de hauteur ', T('H'), ' rempli d’un fluide visqueux. Le frottement vaut f = k v avec k = ', T('k'), ' ; g = ', T('g'), '. On néglige la poussée d’Archimède. '];
      const v0 = p.m * G / p.k;
      if (q === 0) return { tokens, derivees: ['régime permanent : f = P', 'k v_lim = m g'], texte: [...debut, 'Quelle est la vitesse limite de l’objet, en m/s ?'], utiles: ['m', 'k', 'g'],
        raisons: { H: 'La hauteur du récipient ne sert pas pour calculer la vitesse limite.' },
        cherche: { bonne: 'La vitesse limite de l’objet (en m/s)', faux: ['La constante de temps de la chute (en s)', 'Le poids de l’objet (en N)', 'La durée de la chute dans le récipient (en s)'] },
        manque: null, solution: { txt: 'v_lim = m g ÷ k', val: v0, u: 'm/s' } };
      return { tokens, derivees: ['v_lim′ = (2 m) g ÷ k'], texte: [...debut, 'On remplace l’objet par un autre de masse double, dans le même fluide. Quelle est la nouvelle vitesse limite, en m/s ?'], utiles: ['m', 'k', 'g'],
        raisons: { H: 'La hauteur du récipient ne sert pas pour calculer la vitesse limite.' },
        cherche: { bonne: 'La vitesse limite de l’objet de masse double (en m/s)', faux: ['La vitesse limite du premier objet (en m/s)', 'La constante de temps du nouvel objet (en s)', 'Le poids du nouvel objet (en N)'] },
        manque: null, solution: { txt: 'v_lim′ = 2 m g ÷ k', val: 2 * v0, u: 'm/s' } };
    }),
  },
  {
    id: 'fvi-sapp-tau', domaine: DOM, titre: 'Un objet lâché dans un fluide visqueux : constante de temps', noms: ['Constante de temps', 'Durée du régime transitoire'],
    gen,
    build: epure((p, q) => {
      const tokens = toks(p);
      const debut = ['Un objet de masse ', T('m'), ' est lâché sans vitesse dans un récipient de hauteur ', T('H'), ' rempli d’un fluide visqueux. Le frottement vaut f = k v avec k = ', T('k'), '. '];
      if (q === 0) return { tokens, derivees: ['τ = m ÷ k'], texte: [...debut, 'Quelle est la constante de temps de la chute, en s ?'], utiles: ['m', 'k'],
        raisons: { H: 'La hauteur du récipient ne sert pas pour calculer la constante de temps.' },
        cherche: { bonne: 'La constante de temps de la chute (en s)', faux: ['La vitesse limite de l’objet (en m/s)', 'Le poids de l’objet (en N)', 'La hauteur de chute en régime permanent (en m)'] },
        manque: null, solution: { txt: 'τ = m ÷ k', val: p.m / p.k, u: 's' } };
      return { tokens, derivees: ['τ = m ÷ k', 'régime permanent à 5 τ'], texte: [...debut, 'On considère que le régime permanent est atteint au bout de 5 τ. Quelle est la durée du régime transitoire, en s ?'], utiles: ['m', 'k'],
        raisons: { H: 'La hauteur du récipient ne sert pas pour calculer la durée du régime transitoire.' },
        cherche: { bonne: 'La durée du régime transitoire (en s)', faux: ['La constante de temps seule (en s)', 'La vitesse limite de l’objet (en m/s)', 'Le temps nécessaire pour traverser le récipient (en s)'] },
        manque: null, solution: { txt: '5 τ = 5 m ÷ k', val: 5 * p.m / p.k, u: 's' } };
    }),
  },
];
