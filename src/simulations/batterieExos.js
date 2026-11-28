// Exercices ANA (prévoir sans calculer), VAL (plausible ?) et S'APP (repérer les données utiles) de la simulation 231 « Batterie : énergie et durée de fonctionnement ».
// Préfixe d'identifiants : bat- ; domaine : « Batterie : énergie disponible et durée de fonctionnement ».
// Capacités visées (jamais affichées) : relation entre quantité d'électricité, durée de fonctionnement et intensité ; énergie disponible d'un accumulateur ; durée de fonctionnement selon le récepteur ; extraire d'une documentation les caractéristiques utiles.
const DOM = 'Batterie : énergie disponible et durée de fonctionnement';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const BAT_ANA = [
  { id: 'bat-ana-capacite', domaine: DOM, titre: 'Une batterie de capacité double',
    enonce: 'Deux accumulateurs ont la même tension. Le second a une capacité deux fois plus grande que le premier. On les branche l’un après l’autre sur la même lampe, qui demande toujours la même intensité.', q: 'Comparée à celle du premier, comment est la durée de fonctionnement du second ?', options: [
      V('elle est deux fois plus longue, car la durée vaut frac(Qs|I) et Qs a doublé', 'La durée est le rapport frac(capacité|intensité) : à intensité égale, une capacité double donne une durée double.'),
      F('elle est deux fois plus courte, car une batterie plus grosse se vide plus vite', 'La capacité est la quantité d’électricité stockée : plus elle est grande, plus la batterie dure, à intensité égale.'),
      F('elle est identique, car les deux batteries ont la même tension', 'La tension ne donne pas la durée : c’est le rapport frac(capacité|intensité) qui la fixe, et la capacité a doublé.'),
      F('elle est quatre fois plus longue, car la capacité intervient au carré', 'La durée est proportionnelle à la capacité (Δt = frac(Qs|I)), pas à son carré : elle double.'),
    ] },
  { id: 'bat-ana-puissance', domaine: DOM, titre: 'Un récepteur trois fois plus puissant',
    enonce: 'Un accumulateur de tension constante alimente d’abord une lampe de puissance P. On la remplace par une lampe de puissance 3P, sous la même tension.', q: 'Comment évoluent l’intensité du courant débité et la durée de fonctionnement ?', options: [
      V('l’intensité est multipliée par 3 et la durée est divisée par 3', 'I = frac(P|U) : à tension égale, trois fois plus de puissance donne trois fois plus d’intensité. Δt = frac(Qs|I) est alors divisée par 3.'),
      F('l’intensité est multipliée par 3 et la durée aussi', 'Plus l’intensité est grande, plus la batterie se vide vite : la durée est divisée par 3, pas multipliée.'),
      F('l’intensité ne change pas, seule la durée est divisée par 3', 'I = frac(P|U) : si P triple sous la même tension, l’intensité triple.'),
      F('l’intensité est divisée par 3 et la durée est multipliée par 3', 'C’est l’inverse : une lampe plus puissante demande plus de courant, donc la batterie dure moins longtemps.'),
    ] },
  { id: 'bat-ana-tension', domaine: DOM, titre: 'Même capacité, tension double',
    enonce: 'Deux accumulateurs ont la même capacité, 5,0 Ah, mais le premier a une tension de 6 V et le second une tension de 12 V.', q: 'Comparée à celle du premier, comment est l’énergie disponible du second ?', options: [
      V('elle est deux fois plus grande, car E = Qs × U avec U qui double', 'Avec la même capacité, l’énergie disponible est proportionnelle à la tension : E = 5,0 × 12 = 60 Wh contre 30 Wh.'),
      F('elle est identique, car la capacité en ampères-heures est la même', 'La capacité ne donne pas l’énergie : E = Qs × U dépend aussi de la tension, qui a doublé.'),
      F('elle est deux fois plus petite, car la tension est plus élevée', 'L’énergie est proportionnelle à la tension : à capacité égale, une tension double donne une énergie double.'),
      F('elle est quatre fois plus grande, car la tension double deux fois', 'E = Qs × U est proportionnelle à U (pas à son carré) : l’énergie double.'),
    ] },
  { id: 'bat-ana-courant', domaine: DOM, titre: 'Un courant deux fois plus intense',
    enonce: 'Un courant traverse un fil. On double son intensité en laissant la durée du passage inchangée.', q: 'Comment évolue la quantité d’électricité (la charge Q) qui a traversé le fil ?', options: [
      V('elle est multipliée par 2, car Q = I × Δt et I est doublé', 'À durée égale, la charge est proportionnelle à l’intensité : elle double.'),
      F('elle ne change pas, car la durée est la même', 'Q = I × Δt dépend aussi de l’intensité : si I double à durée égale, Q double.'),
      F('elle est divisée par 2, car le courant est plus intense', 'Un courant plus intense transporte plus de charges en une seconde : la charge est multipliée par 2.'),
      F('elle est multipliée par 4, car l’intensité intervient au carré', 'Q = I × Δt est proportionnelle à I : elle double, pas elle quadruple.'),
    ] },
];

export const BAT_VAL = [
  P({ id: 'bat-val-energie', domaine: DOM, niveau: 1, titre: 'Énergie disponible d’un accumulateur de 12 V', plausible: true,
    enonce: 'Un accumulateur de tension 12 V et de capacité 5,0 Ah. Un élève trouve une énergie disponible de 60 Wh, soit environ 2,2 × 10⁵ J.',
    reperes: [['Tension U', '12 V'], ['Capacité Qs', '5,0 Ah'], ['E = Qs × U', '5,0 × 12 = 60 Wh'], ['1 Wh', '3 600 J : 60 Wh = 216 000 J']],
    ver: 'E = 5,0 × 12 = 60 Wh ; 60 × 3 600 = 216 000 J ≈ 2,2 × 10⁵ J. La valeur de l’élève est cohérente : elle est plausible.',
    q2: 'On branche un récepteur de 15 W sur cet accumulateur. Quelle est la durée de fonctionnement ?',
    options: [
      V('environ 4 h, car Δt = frac(E|P) = frac(60 Wh|15 W)', 'Δt = frac(E|P) = frac(60 Wh|15 W) = 4,0 h.'),
      F('environ 15 h, car on multiplie la puissance par la capacité', 'Qs × P n’est pas une durée : Δt = frac(E|P) = frac(60|15) = 4 h.'),
      F('environ 0,25 h, car Δt = frac(P|E) = frac(15|60)', 'Le rapport est inversé : Δt = frac(E|P) = frac(60|15) = 4,0 h.'),
    ] }),
  P({ id: 'bat-val-duree', domaine: DOM, niveau: 2, titre: 'Durée de fonctionnement d’un accumulateur', plausible: false,
    enonce: 'Un accumulateur de capacité 2,0 Ah alimente un récepteur qui demande 0,50 A. Un élève écrit : « Δt = frac(I|Qs) = frac(0,50|2,0) = 0,25 h, soit 15 minutes ».',
    reperes: [['Unité de la capacité', 'l’ampère-heure : 1 Ah = 1 A débité pendant 1 h'], ['Ordre de grandeur', 'un récepteur qui consomme 0,5 A vide une batterie de quelques ampères-heures en plusieurs heures']],
    ver: 'La durée est Δt = frac(Qs|I) = frac(2,0|0,50) = 4,0 h. L’élève a inversé le rapport : 15 minutes est 16 fois trop court. Ce n’est pas plausible : un courant de 0,50 A pendant 4 h transporte bien 2,0 Ah.',
    q2: 'Quelle est la cause de l’écart ?',
    options: [
      V('le rapport est inversé : il fallait diviser la capacité par l’intensité', 'Δt = frac(Qs|I) (capacité divisée par intensité), pas frac(I|Qs).'),
      F('la capacité aurait dû être convertie en coulombs avant le calcul de la durée', 'En ampères-heures, divisée par des ampères, elle donne directement des heures : aucune conversion n’est nécessaire.'),
      F('la durée d’une batterie ne se calcule pas avec l’intensité du courant', 'Si : Δt = frac(Qs|I) relie la capacité, l’intensité et la durée de fonctionnement.'),
    ] }),
];

// ───────────── S'APP ─────────────
const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const virg = (x, d) => Number(x).toFixed(d).replace('.', ',');
export const BAT_SAPP = [
  {
    id: 'bat-sapp-duree', domaine: DOM, titre: 'Durée de fonctionnement d’un accumulateur', noms: ['Intensité du courant', 'Durée de fonctionnement'],
    gen: () => ({ U: tire([6, 12]), Qs: tire([2.5, 4, 5, 7, 8]), P: tire([5, 10, 15, 20]), m: tire([0.6, 0.9, 1.4, 2.1]), Imax: tire([10, 15, 20]) }),
    build: epure((p, q) => {
      const tokens = {
        U: tok(`${p.U} V`, 'Tension nominale de l’accumulateur', p.U, 'V'),
        Qs: tok(`${virg(p.Qs, 1)} Ah`, 'Capacité de l’accumulateur', p.Qs, 'Ah'),
        P: tok(`${p.P} W`, 'Puissance du récepteur', p.P, 'W'),
        m: tok(`${virg(p.m, 1)} kg`, 'Masse de l’accumulateur', p.m, 'kg'),
        Imax: tok(`${p.Imax} A`, 'Courant de décharge maximal permis par la fiche technique', p.Imax, 'A'),
      };
      const debut = ['La fiche technique d’un accumulateur indique : tension nominale ', T('U'), ', capacité ', T('Qs'), ', masse ', T('m'), ', courant de décharge maximal ', T('Imax'), '. Il alimente un récepteur de puissance ', T('P'), '. '];
      if (q === 0) return { tokens, derivees: ['I = frac(P|U)'], texte: [...debut, 'Quelle est l’intensité du courant débité ?'], utiles: ['P', 'U'],
        raisons: { Qs: 'La capacité sert à calculer la durée, pas l’intensité.', m: 'La masse ne sert pas dans ce calcul.', Imax: 'Le courant maximal permis est une limite : il ne donne pas le courant réellement débité.' },
        cherche: { bonne: 'L’intensité du courant débité (en A)', faux: ['La durée de fonctionnement (en h)', 'L’énergie disponible (en Wh)', 'La puissance de l’accumulateur (en W)'] },
        manque: null, solution: { txt: 'I = frac(P|U)', val: p.P / p.U, u: 'A' } };
      return { tokens, derivees: ['I = frac(P|U)', 'Δt = frac(Qs|I)'], texte: [...debut, 'Quelle est la durée de fonctionnement de l’accumulateur ?'], utiles: ['P', 'U', 'Qs'],
        raisons: { m: 'La masse ne sert pas dans ce calcul.', Imax: 'Le courant maximal permis est une limite : il ne sert pas à calculer la durée.' },
        cherche: { bonne: 'La durée de fonctionnement (en h)', faux: ['L’intensité du courant débité (en A)', 'L’énergie disponible (en Wh)', 'La charge débitée en une heure (en C)'] },
        manque: null, solution: { txt: 'Δt = frac(Qs|I), avec I = frac(P|U)', val: p.Qs / (p.P / p.U), u: 'h' } };
    }),
  },
  {
    id: 'bat-sapp-energie', domaine: DOM, titre: 'Énergie disponible d’un accumulateur', noms: ['Énergie en Wh', 'Énergie en J'],
    gen: () => ({ U: tire([3.7, 6, 12]), Qs: tire([2.5, 4, 5, 7, 10]), P: tire([5, 10, 20]), Imax: tire([10, 15, 20]), prix: tire([18, 25, 40]) }),
    build: epure((p, q) => {
      const tokens = {
        U: tok(`${virg(p.U, p.U % 1 ? 1 : 0)} V`, 'Tension à vide de l’accumulateur', p.U, 'V'),
        Qs: tok(`${virg(p.Qs, p.Qs % 1 ? 1 : 0)} Ah`, 'Capacité de l’accumulateur', p.Qs, 'Ah'),
        P: tok(`${p.P} W`, 'Puissance du chargeur', p.P, 'W'),
        Imax: tok(`${p.Imax} A`, 'Courant de décharge maximal permis', p.Imax, 'A'),
        prix: tok(`${p.prix} €`, 'Prix de l’accumulateur', p.prix, '€'),
      };
      const debut = ['Un accumulateur de tension à vide ', T('U'), ' et de capacité ', T('Qs'), ' coûte ', T('prix'), '. Son courant de décharge maximal est de ', T('Imax'), ' et il se recharge avec un chargeur de ', T('P'), '. '];
      if (q === 0) return { tokens, derivees: ['E = Qs × U'], texte: [...debut, 'Quelle est l’énergie disponible, en wattheures ?'], utiles: ['U', 'Qs'],
        raisons: { P: 'La puissance du chargeur ne donne pas l’énergie stockée.', Imax: 'Le courant maximal est une limite d’utilisation : il ne sert pas dans ce calcul.', prix: 'Le prix ne sert pas dans ce calcul.' },
        cherche: { bonne: 'L’énergie disponible (en Wh)', faux: ['La durée de fonctionnement (en h)', 'La charge stockée (en C)', 'L’intensité du courant débité (en A)'] },
        manque: null, solution: { txt: 'E = Qs × U', val: p.Qs * p.U, u: 'Wh' } };
      return { tokens, derivees: ['E en Wh = Qs × U', 'E en J = E en Wh × 3 600'], texte: [...debut, 'Quelle est l’énergie disponible, en joules ?'], utiles: ['U', 'Qs'],
        raisons: { P: 'La puissance du chargeur ne donne pas l’énergie stockée.', Imax: 'Le courant maximal est une limite d’utilisation : il ne sert pas dans ce calcul.', prix: 'Le prix ne sert pas dans ce calcul.' },
        cherche: { bonne: 'L’énergie disponible (en J)', faux: ['L’énergie disponible (en Wh)', 'La charge stockée (en Ah)', 'La durée de fonctionnement (en s)'] },
        manque: null, solution: { txt: 'E = Qs × U × 3 600', val: p.Qs * p.U * 3600, u: 'J' } };
    }),
  },
];
