// Exercices ANA, VAL et S'APP de la simulation 245 « Travail ou transfert thermique : classer les transferts d'énergie ». Préfixe : mtr-.
// Capacités visées (jamais affichées) : classer un transfert d'énergie (travail mécanique ou électrique, transfert thermique par conduction, convection, rayonnement) ; algébriser un transfert ; ΔEc = somme des travaux ; puissance d'un transfert.
const DOM = 'Travail ou transfert thermique : classer les transferts d’énergie';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const MTR_ANA = [
  { id: 'mtr-ana-posee', domaine: DOM, titre: 'Une pierre posée sur une table',
    enonce: 'Une pierre est posée sur une table immobile. La table exerce une force sur la pierre, qui reste immobile.', q: 'Y a-t-il un transfert d’énergie par travail de la table vers la pierre ?', options: [
      V('non : la force ne fait varier la vitesse d’aucun des deux', 'Un travail mécanique suppose qu’une force fasse varier la valeur de la vitesse. Ici la pierre reste immobile : il n’y a pas de transfert par travail.'),
      F('oui : une force s’exerce, donc il y a toujours un travail', 'Une force seule ne suffit pas : il faut qu’elle fasse varier la valeur de la vitesse.'),
      F('oui : la pierre est lourde, donc la table lui cède de l’énergie', 'La masse de la pierre ne crée pas de transfert : sans variation de vitesse, il n’y a pas de travail.'),
      F('non, car un transfert thermique a lieu à la place', 'Rien n’impose un transfert thermique : il faudrait une différence de température entre la table et la pierre.'),
    ] },
  { id: 'mtr-ana-vide', domaine: DOM, titre: 'Un objet chauffé à travers le vide',
    enonce: 'Dans une enceinte où l’on a fait le vide, un filament très chaud réchauffe la paroi de l’enceinte, qui n’est pas en contact avec lui.', q: 'Par quel mode l’énergie est-elle transférée du filament à la paroi ?', options: [
      V('par rayonnement : des ondes, sans matière nécessaire', 'Il n’y a pas de matière entre le filament et la paroi : conduction et convection sont impossibles ; seul le rayonnement transfère l’énergie.'),
      F('par conduction : la chaleur se propage de proche en proche', 'La conduction suppose de la matière entre les deux corps ; ici c’est le vide.'),
      F('par convection : l’air chaud monte vers la paroi', 'Il n’y a pas d’air dans l’enceinte : la convection exige un liquide ou un gaz qui se déplace.'),
      F('par travail électrique : un courant relie le filament à la paroi', 'Aucun courant ne relie le filament à la paroi : c’est un transfert thermique.'),
    ] },
  { id: 'mtr-ana-solide', domaine: DOM, titre: 'Un bloc de métal chauffé en un point',
    enonce: 'On chauffe un bloc de métal en un point. La chaleur se propage peu à peu dans tout le bloc, qui ne bouge pas.', q: 'Pourquoi ce transfert n’est-il pas une convection ?', options: [
      V('parce que la matière d’un solide ne se déplace pas', 'La convection est un mouvement macroscopique de matière et ne concerne que les liquides et les gaz. Dans un solide, la chaleur se propage par conduction.'),
      F('parce que la chaleur ne se propage jamais dans un solide', 'Au contraire : la conduction concerne les solides, les liquides et les gaz.'),
      F('parce qu’un solide chaud émet toujours du rayonnement', 'Un solide chaud rayonne, mais la propagation décrite ici, de proche en proche, est une conduction.'),
      F('parce que le métal est un très mauvais conducteur', 'Les métaux sont de bons conducteurs thermiques ; la raison est que leur matière ne s’écoule pas.'),
    ] },
  { id: 'mtr-ana-signe', domaine: DOM, titre: 'Un chariot freiné',
    enonce: 'Un chariot roule sur un sol horizontal. Une force de freinage fait diminuer la valeur de sa vitesse. On étudie le système « le chariot ».', q: 'Que peut-on dire du travail de la force de freinage pour le chariot ?', options: [
      V('il est négatif : le chariot cède de l’énergie cinétique', 'ΔEc = somme des travaux : l’énergie cinétique du chariot diminue, donc le travail est négatif.'),
      F('il est positif : une force qui s’exerce fournit toujours de l’énergie', 'Le signe dépend du système : le chariot perd de l’énergie cinétique, donc W < 0.'),
      F('il est nul, car la vitesse du chariot ne s’annule pas forcément', 'Le travail est non nul dès que la valeur de la vitesse varie.'),
      F('il est positif, car le freinage chauffe le chariot', 'Le travail est lié à la variation d’énergie cinétique : elle diminue, donc W est négatif.'),
    ] },
];

export const MTR_VAL = [
  P({ id: 'mtr-val-chaine', domaine: DOM, niveau: 1, titre: 'Une pile qui alimente une lampe', plausible: true,
    enonce: 'Un élève écrit : « La pile transfère de l’énergie à la lampe par travail électrique, grâce au courant dans le circuit. La lampe cède ensuite de l’énergie à l’air par transfert thermique. »',
    reperes: [['De la pile à la lampe', 'un courant : travail électrique'], ['De la lampe à l’air', 'plus chaude que l’air : transfert thermique'], ['Pile', 'cède : W < 0'], ['Lampe', 'reçoit W > 0, puis cède Q < 0']],
    ver: 'Entre une pile (générateur) et une lampe (récepteur), l’énergie passe par un courant : c’est un travail électrique. La lampe, plus chaude que l’air, cède ensuite un transfert thermique. L’élève a raison.',
    q2: 'Pour le système « la pile », comment est compté le travail électrique transféré à la lampe ?',
    options: [
      V('négativement, car la pile cède cette énergie', 'Une énergie cédée par le système est comptée négativement : W < 0 pour la pile.'),
      F('positivement, car la pile fournit l’énergie', 'Le signe dépend du système : la pile cède de l’énergie, donc W < 0 pour elle.'),
      F('on ne peut pas le savoir sans connaître la température', 'Ce n’est pas un transfert thermique : le signe se déduit du sens du transfert.'),
    ] }),
  P({ id: 'mtr-val-ray', domaine: DOM, niveau: 2, titre: 'La chaleur du Soleil', plausible: false,
    enonce: 'Un élève affirme : « L’énergie du Soleil arrive sur Terre par conduction, car la chaleur se propage de proche en proche dans l’espace. »',
    reperes: [['Entre le Soleil et la Terre', 'presque entièrement du vide'], ['Conduction', 'exige de la matière, de proche en proche'], ['Rayonnement', 'ondes électromagnétiques, sans matière'], ['Mode réel', 'rayonnement']],
    ver: 'La conduction se fait de proche en proche dans la matière. Entre le Soleil et la Terre il y a presque du vide : l’énergie arrive par rayonnement (ondes électromagnétiques). L’affirmation de l’élève n’est pas plausible.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a oublié que la conduction exige de la matière', 'Sans matière, la chaleur ne peut pas se propager de proche en proche : il s’agit de rayonnement.'),
      F('il a confondu la conduction avec la convection', 'La convection exigerait aussi de la matière en mouvement : l’erreur est de ne pas avoir pensé au vide.'),
      F('il a oublié que le Soleil est plus froid que la Terre', 'Le Soleil est bien plus chaud que la Terre : l’erreur est sur le mode de transfert.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const vir = x => String(Number(Number(x).toPrecision(3))).replace('.', ',');
const ec = (m, v) => 0.5 * m * v * v;
const genVit = () => { let v0, v1; do { v0 = tire([2, 3, 4, 5, 6]); v1 = tire([1, 2, 3, 4, 5, 6]); } while (v1 === v0); return { v0, v1 }; };
export const MTR_SAPP = [
  {
    id: 'mtr-sapp-chariot', domaine: DOM, titre: 'Chariot freiné ou poussé : travail algébrique et puissance', noms: ['Travail reçu par le chariot', 'Puissance du transfert par travail'],
    gen: () => ({ m: tire([1, 2, 4]), ...genVit(), dt: tire([2, 4, 5]), d: tire([3, 5, 8, 10]) }),
    build: epure((p, q) => {
      const W = ec(p.m, p.v1) - ec(p.m, p.v0);
      const tokens = {
        m: tok(`${p.m} kg`, 'Masse du chariot', p.m, 'kg'),
        v0: tok(`${p.v0} m/s`, 'Vitesse au début', p.v0, 'm/s'),
        v1: tok(`${p.v1} m/s`, 'Vitesse à la fin', p.v1, 'm/s'),
        dt: tok(`${p.dt} s`, 'Durée de l’opération', p.dt, 's'),
        d: tok(`${p.d} m`, 'Distance parcourue', p.d, 'm'),
      };
      const debut = ['Un chariot de masse ', T('m'), ' roule sur un sol horizontal : sa vitesse passe de ', T('v0'), ' à ', T('v1'), ' en ', T('dt'), ', sur ', T('d'), '. Seule une force horizontale fait varier sa vitesse. '];
      if (q === 0) return { tokens, derivees: ['ΔEc = somme des travaux', 'Ec = ½ × m × v²'], texte: [...debut, 'Quel est le travail reçu par le chariot, en joules (avec son signe) ?'], utiles: ['m', 'v0', 'v1'],
        raisons: { dt: 'La durée ne sert pas pour une énergie : elle servira pour la puissance.', d: 'La distance ne sert pas : on connaît les deux vitesses.' },
        cherche: { bonne: 'Le travail reçu par le chariot (en J, valeur algébrique)', faux: ['La puissance du transfert par travail (en W)', 'La force exercée sur le chariot (en N)', 'L’énergie cinétique initiale du chariot (en J)'] },
        manque: null, solution: { txt: 'W = ½ m v1² − ½ m v0²', val: W, u: 'J' } };
      return { tokens, derivees: ['ΔEc = somme des travaux', 'P = frac(∣W∣|Δt)'], texte: [...debut, 'Quelle est la puissance du transfert par travail, en watts ?'], utiles: ['m', 'v0', 'v1', 'dt'],
        raisons: { d: 'La distance ne sert pas : la puissance est une énergie divisée par une durée.' },
        cherche: { bonne: 'La puissance du transfert par travail (en W)', faux: ['Le travail reçu par le chariot (en J)', 'La force exercée sur le chariot (en N)', 'La variation de vitesse du chariot (en m/s)'] },
        manque: null, solution: { txt: 'P = frac(∣W∣|Δt)', val: Math.abs(W) / p.dt, u: 'W' } };
    }),
  },
  {
    id: 'mtr-sapp-depart', domaine: DOM, titre: 'Chariot lancé depuis l’arrêt : énergie reçue et puissance', noms: ['Énergie reçue par travail', 'Puissance du transfert par travail'],
    gen: () => ({ m: tire([1, 2, 3, 4]), v: tire([2, 3, 4, 5]), dt: tire([2, 3, 4, 5]), d: tire([3, 5, 8, 10]) }),
    build: epure((p, q) => {
      const W = ec(p.m, p.v);
      const tokens = {
        m: tok(`${p.m} kg`, 'Masse du chariot', p.m, 'kg'),
        v: tok(`${p.v} m/s`, 'Vitesse atteinte', p.v, 'm/s'),
        dt: tok(`${p.dt} s`, 'Durée de la poussée', p.dt, 's'),
        d: tok(`${p.d} m`, 'Distance parcourue pendant la poussée', p.d, 'm'),
      };
      const debut = ['Une personne pousse un chariot de masse ', T('m'), ', initialement immobile, sur un sol horizontal, pendant ', T('dt'), ' (sur ', T('d'), '). Il atteint la vitesse ', T('v'), '. Seule la poussée fait varier sa vitesse. '];
      if (q === 0) return { tokens, derivees: ['ΔEc = somme des travaux, avec Ec initiale = 0', 'Ec = ½ × m × v²'], texte: [...debut, 'Quelle énergie le chariot reçoit-il par travail, en joules ?'], utiles: ['m', 'v'],
        raisons: { dt: 'La durée ne sert pas pour une énergie.', d: 'La distance ne sert pas : on utilise la vitesse atteinte.' },
        cherche: { bonne: 'L’énergie reçue par le chariot par travail (en J)', faux: ['La puissance de la poussée (en W)', 'La force de poussée (en N)', 'L’énergie cédée à l’air (en J)'] },
        manque: null, solution: { txt: 'W = ½ m v²', val: W, u: 'J' } };
      return { tokens, derivees: ['W = ½ m v² (départ à l’arrêt)', 'P = frac(∣W∣|Δt)'], texte: [...debut, 'Quelle est la puissance moyenne du transfert par travail, en watts ?'], utiles: ['m', 'v', 'dt'],
        raisons: { d: 'La distance ne sert pas : la puissance est une énergie divisée par une durée.' },
        cherche: { bonne: 'La puissance moyenne du transfert par travail (en W)', faux: ['L’énergie reçue par le chariot (en J)', 'La force de poussée (en N)', 'L’accélération du chariot (en m/s²)'] },
        manque: null, solution: { txt: 'P = frac(½ m v²|Δt)', val: W / p.dt, u: 'W' } };
    }),
  },
];
