// Exercices ANA, VAL et S'APP de la simulation 268 « Bilan des forces et lois de Newton sur un mouvement rectiligne ». Préfixe : nwr-.
// Capacités visées (jamais affichées) : bilan des forces sur un système ; somme des forces et deuxième loi ΣF = m a ; principe d'inertie ; actions réciproques.
const DOM = 'Bilan des forces et lois de Newton';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const NWR_ANA = [
  { id: 'nwr-ana-inertie', domaine: DOM, titre: 'Un chariot à vitesse constante',
    enonce: 'Un chariot se déplace en ligne droite sur un rail horizontal, à vitesse constante. Plusieurs forces s’exercent sur lui : son poids, la réaction du rail, une poussée et un frottement.', q: 'Que peut-on dire de la somme des forces qui s’exercent sur le chariot ?', options: [
      V('elle est nulle : les forces se compensent', 'Vitesse constante en ligne droite : d’après le principe d’inertie, la somme des forces est nulle.'),
      F('elle est dirigée dans le sens du mouvement, car le chariot avance', 'Une somme des forces non nulle ferait varier la vitesse : le chariot accélérerait.'),
      F('elle est dirigée à l’opposé du mouvement, car le frottement freine', 'Le frottement est compensé par la poussée : la somme des forces reste nulle.'),
      F('on ne peut rien dire sans connaître la vitesse du chariot', 'Seule la constance de la vitesse compte : elle impose ΣF = 0.'),
    ] },
  { id: 'nwr-ana-masse', domaine: DOM, titre: 'Même poussée, chariot trois fois plus lourd',
    enonce: 'Un chariot, soumis à une certaine somme des forces horizontale, a une accélération donnée. On le remplace par un chariot trois fois plus lourd, soumis à la même somme des forces.', q: 'Que devient la valeur de l’accélération ?', options: [
      V('elle est divisée par 3 : a = frac(ΣF|m)', 'ΣF = m a : à ΣF constante, a est inversement proportionnelle à m.'),
      F('elle est multipliée par 3, car la masse est multipliée par 3', 'C’est l’inverse : plus la masse est grande, plus l’accélération est petite.'),
      F('elle reste la même : la somme des forces n’a pas changé', 'L’accélération dépend aussi de la masse : a = frac(ΣF|m).'),
      F('elle est divisée par 9, car elle varie comme 1/m²', 'La masse intervient à la puissance 1 dans a = frac(ΣF|m).'),
    ] },
  { id: 'nwr-ana-ralenti', schema: { type: 'mobile', objet: 'chariot', sol: 'rail' }, domaine: DOM, titre: 'Un chariot qui ralentit',
    enonce: 'Un chariot se déplace vers la droite sur un rail horizontal. Sa vitesse diminue peu à peu, sans que sa trajectoire change (elle reste rectiligne).', q: 'Dans quel sens est dirigée la somme des forces qui s’exercent sur lui ?', options: [
      V('vers la gauche, à l’opposé du mouvement', 'La vitesse diminue : l’accélération, de même sens que ΣF, est vers la gauche.'),
      F('vers la droite, dans le sens du mouvement', 'Dans le sens du mouvement, la vitesse augmenterait.'),
      F('elle est nulle, car le chariot continue d’avancer', 'Une somme des forces nulle donnerait une vitesse constante.'),
      F('vers le haut, perpendiculairement au rail', 'Le poids et la réaction se compensent : ils ne changent pas la vitesse horizontale.'),
    ] },
  { id: 'nwr-ana-reciproque', domaine: DOM, titre: 'Un aimant et une bille de fer',
    enonce: 'Un aimant attire une bille de fer avec une force de valeur 2 N. On s’intéresse à la force que la bille exerce, en retour, sur l’aimant.', q: 'Cette force est :', options: [
      V('de valeur 2 N, de sens opposé à celui de la force sur la bille', 'Actions réciproques : même valeur, même direction, sens opposés.'),
      F('de valeur plus petite, car la bille est plus légère que l’aimant', 'La masse n’intervient pas : les deux forces ont la même valeur.'),
      F('nulle : seul l’aimant exerce une force', 'Si l’aimant agit sur la bille, la bille agit aussi sur l’aimant.'),
      F('de valeur 2 N et de même sens que la force sur la bille', 'Les deux forces sont de sens opposés.'),
    ] },
];

export const NWR_VAL = [
  P({ id: 'nwr-val-acc', domaine: DOM, niveau: 1, titre: 'Accélération d’un chariot : le frottement oublié', plausible: false,
    enonce: 'Un chariot de masse 2,0 kg est poussé vers la droite par une force de 10 N ; le rail exerce un frottement de 4 N vers la gauche. Un élève écrit : « ΣF = 10 N, donc a = frac(ΣF|m) = frac(10|2,0) = 5,0 m/s². »',
    reperes: [['Masse m', '2,0 kg'], ['Poussée F', '10 N vers la droite'], ['Frottement f', '4 N vers la gauche']],
    ver: 'ΣF = 10 − 4 = 6 N, donc a = frac(6|2,0) = 3,0 m/s². L’élève a oublié le frottement dans la somme des forces.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a oublié le frottement : ΣF = 10 − 4 = 6 N et a = 3,0 m/s²', 'Le frottement s’oppose à la poussée : il diminue la somme des forces.'),
      F('il aurait dû multiplier ΣF par la masse : a = 10 × 2,0 = 20 m/s²', 'La relation est a = frac(ΣF|m) : on divise par la masse.'),
      F('il a oublié le poids du chariot dans la somme des forces horizontales', 'Le poids est vertical et compensé par la réaction : il n’intervient pas ici.'),
    ] }),
  P({ id: 'nwr-val-inertie', domaine: DOM, niveau: 2, titre: 'Un chariot lancé sans frottement', plausible: true,
    enonce: 'Un élève écrit : « Un chariot est lancé à 3,0 m/s sur un rail horizontal sans frottement, puis plus aucune poussée ne s’exerce sur lui. Le poids et la réaction se compensent, donc ΣF = 0 : sa vitesse reste égale à 3,0 m/s et il parcourt 12 m en 4,0 s. »',
    reperes: [['Vitesse initiale', '3,0 m/s'], ['Forces horizontales', 'aucune'], ['Durée', '4,0 s']],
    ver: 'ΣF = 0 donne a = 0 : la vitesse reste constante (principe d’inertie) et la distance vaut 3,0 × 4,0 = 12 m : le raisonnement est juste.',
    q2: 'Pourquoi la vitesse du chariot reste-t-elle constante ?',
    options: [
      V('parce que la somme des forces est nulle : a = 0', 'ΣF = m a : si ΣF = 0, alors a = 0 et la vitesse ne change pas.'),
      F('parce qu’une force de même sens que le mouvement l’entretient', 'Aucune force horizontale ne s’exerce : il n’y a rien à entretenir.'),
      F('parce que le poids du chariot le maintient en mouvement', 'Le poids est vertical et compensé par la réaction : il n’agit pas sur la vitesse horizontale.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
export const NWR_SAPP = [
  {
    id: 'nwr-sapp-acc', domaine: DOM, titre: 'Un chariot poussé sur un rail : somme des forces et accélération', noms: ['Accélération du chariot', 'Accélération avec une masse double'],
    gen: () => { const f = tire([2, 3, 4, 6]); return { m: tire([2.0, 2.5, 4.0, 5.0]), f, F: f + tire([4, 6, 8, 10, 12]), L: tire([2, 3, 4]) }; },
    build: epure((p, q) => {
      const fr = x => String(x).replace('.', ',');
      const tokens = {
        m: tok(`${fr(p.m.toFixed(1))} kg`, 'Masse du chariot', p.m, 'kg'), F: tok(`${p.F} N`, 'Poussée vers la droite', p.F, 'N'), f: tok(`${p.f} N`, 'Frottement vers la gauche', p.f, 'N'), L: tok(`${p.L} m`, 'Longueur du rail', p.L, 'm'),
      };
      const debut = ['Un chariot de masse ', T('m'), ' glisse sur un rail horizontal de longueur ', T('L'), '. Il est poussé vers la droite par une force de ', T('F'), ' ; le rail exerce un frottement de ', T('f'), ' vers la gauche. '];
      const a0 = (p.F - p.f) / p.m;
      if (q === 0) return { tokens, derivees: ['ΣF = F − f', 'a = frac(ΣF|m)'], texte: [...debut, 'Quelle est l’accélération du chariot, en m/s² ?'], utiles: ['m', 'F', 'f'],
        raisons: { L: 'La longueur du rail ne sert pas pour calculer l’accélération.' },
        cherche: { bonne: 'L’accélération du chariot (en m/s²)', faux: ['La somme des forces sur le chariot (en N)', 'La vitesse du chariot après 1 s (en m/s)', 'La masse du chariot (en kg)'] },
        manque: null, solution: { txt: 'a = frac(F − f|m)', val: a0, u: 'm/s²' } };
      return { tokens, derivees: ['ΣF = F − f', 'a′ = frac(ΣF|2 m)'], texte: [...debut, 'On remplace le chariot par un autre de masse double, avec les mêmes forces. Quelle est la nouvelle accélération, en m/s² ?'], utiles: ['m', 'F', 'f'],
        raisons: { L: 'La longueur du rail ne sert pas pour calculer l’accélération.' },
        cherche: { bonne: 'L’accélération du chariot de masse double (en m/s²)', faux: ['L’accélération du premier chariot (en m/s²)', 'La somme des forces sur le nouveau chariot (en N)', 'La masse du nouveau chariot (en kg)'] },
        manque: null, solution: { txt: 'a′ = frac(F − f|2 m)', val: a0 / 2, u: 'm/s²' } };
    }),
  },
  {
    id: 'nwr-sapp-frott', domaine: DOM, titre: 'Un chariot dont on mesure l’accélération : le frottement', noms: ['Force de frottement sur le chariot', 'Poussée pour une vitesse constante'],
    gen: () => { const f = tire([2, 3, 4, 5]), m = tire([2.0, 4.0, 5.0]), a = tire([0.5, 1.0, 1.5, 2.0]); return { m, a, f, F: f + m * a, L: tire([2, 3, 4]) }; },
    build: epure((p, q) => {
      const fr = x => String(x).replace('.', ',');
      const tokens = {
        m: tok(`${fr(p.m.toFixed(1))} kg`, 'Masse du chariot', p.m, 'kg'), F: tok(`${fr(p.F)} N`, 'Poussée vers la droite', p.F, 'N'), a: tok(`${fr(p.a.toFixed(1))} m/s²`, 'Accélération mesurée', p.a, 'm/s²'), L: tok(`${p.L} m`, 'Longueur du rail', p.L, 'm'),
      };
      const debut = ['Un chariot de masse ', T('m'), ' glisse sur un rail horizontal de longueur ', T('L'), ', poussé vers la droite par une force de ', T('F'), '. On mesure une accélération de ', T('a'), ' vers la droite. Le poids et la réaction se compensent. '];
      if (q === 0) return { tokens, derivees: ['ΣF = m × a', 'f = F − ΣF'], texte: [...debut, 'Quelle est la valeur de la force de frottement, en N ?'], utiles: ['m', 'F', 'a'],
        raisons: { L: 'La longueur du rail ne sert pas pour calculer le frottement.' },
        cherche: { bonne: 'La valeur de la force de frottement (en N)', faux: ['La somme des forces sur le chariot (en N)', 'Le poids du chariot (en N)', 'La vitesse du chariot (en m/s)'] },
        manque: null, solution: { txt: 'f = F − m × a', val: p.F - p.m * p.a, u: 'N' } };
      return { tokens, derivees: ['ΣF = m × a', 'f = F − ΣF', 'vitesse constante : ΣF = 0, donc F′ = f'], texte: [...debut, 'Quelle poussée faudrait-il exercer pour que le chariot avance à vitesse constante, en N ?'], utiles: ['m', 'F', 'a'],
        raisons: { L: 'La longueur du rail ne sert pas pour calculer cette poussée.' },
        cherche: { bonne: 'La poussée pour une vitesse constante (en N)', faux: ['La poussée actuelle sur le chariot (en N)', 'La somme des forces actuelle (en N)', 'L’accélération actuelle (en m/s²)'] },
        manque: null, solution: { txt: 'F′ = f = F − m × a', val: p.F - p.m * p.a, u: 'N' } };
    }),
  },
];
