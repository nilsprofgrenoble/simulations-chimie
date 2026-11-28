// Exercices ANA, VAL et S'APP de la simulation 321 « Oscillations libres : période, amortissement et régimes » (terminale STL, SPCL, Ondes, séquence 1). Préfixe : osl-.
// Capacités visées (jamais affichées) : identifier la grandeur vibratoire ; caractériser les oscillations libres (pseudopériodiques, critiques, apériodiques) ; période, fréquence, amplitude, pseudopériode, temps caractéristique d'amortissement.
const DOM = 'Oscillations libres';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const OSL_ANA = [
  { id: 'osl-ana-grandeur', schema: { type: 'oscRegle' }, domaine: DOM, titre: 'Grandeur vibratoire d’une règle plate',
    enonce: 'Une règle plate en plastique est serrée par une extrémité dans un étau. On écarte l’autre extrémité de sa position de repos, puis on la lâche : elle vibre.', q: 'Quelle grandeur est ici la grandeur vibratoire ?', options: [
      F('la masse de la règle', 'La masse ne varie pas pendant la vibration : une grandeur vibratoire évolue autour d’une valeur d’équilibre.'),
      F('la longueur de la partie qui dépasse de l’étau', 'Cette longueur est fixe : elle ne se répète pas au cours du temps.'),
      V('la position de l’extrémité libre', 'Cette position évolue autour de la position d’équilibre : c’est la grandeur vibratoire.'),
      F('la température de la règle', 'La température ne décrit pas le mouvement de va-et-vient de l’extrémité.'),
    ] },
  { id: 'osl-ana-frequence', schema: { type: 'oscPiston' }, domaine: DOM, titre: 'Fréquence d’un piston',
    enonce: 'Un piston de petit moteur effectue 3 000 allers-retours en une minute.', q: 'Quelle est la fréquence de son mouvement ?', options: [
      V('50 Hz, car frac(3 000|60 s)', 'La fréquence est le nombre d’oscillations par seconde : frac(3 000|60) = 50 Hz.'),
      F('3 000 Hz, le nombre d’allers-retours', 'Ce nombre est celui d’une minute : la fréquence se calcule par seconde.'),
      F('0,02 Hz, l’inverse de 50', 'Cette valeur est l’inverse de la fréquence (une durée en secondes) : ce n’est pas la fréquence.'),
      F('180 000 Hz, car 3 000 × 60', 'Il faut diviser par 60 s pour passer des minutes aux secondes, pas multiplier.'),
    ] },
  { id: 'osl-ana-regime', schema: { type: 'oscAiguille' }, domaine: DOM, titre: 'Quel régime pour une aiguille d’appareil ?',
    enonce: 'L’aiguille d’un appareil de mesure analogique est amortie. Quand on applique une tension, on souhaite qu’elle atteigne sa position finale le plus vite possible sans la dépasser.', q: 'Quel régime d’amortissement faut-il viser ?', options: [
      F('périodique, sans aucun frottement', 'Sans amortissement, l’aiguille oscillerait indéfiniment sans jamais se stabiliser.'),
      F('pseudopériodique, avec de petites oscillations', 'L’aiguille dépasserait la position finale puis oscillerait avant de se stabiliser.'),
      F('apériodique très fort, pour qu’il n’y ait aucune oscillation', 'Il n’y a plus d’oscillation, mais l’aiguille atteindrait sa position finale lentement.'),
      V('critique', 'Le régime critique est le retour le plus rapide à l’équilibre sans oscillation.'),
    ] },
  { id: 'osl-ana-resistance', schema: { type: 'oscRLC' }, domaine: DOM, titre: 'Résistance plus grande dans un circuit RLC',
    enonce: 'Un circuit RLC série est en régime pseudopériodique. On remplace sa résistance par une résistance plus grande, sans toucher à la bobine ni au condensateur, et le circuit reste pseudopériodique.', q: 'Que devient le temps caractéristique d’amortissement τ ?', options: [
      F('il augmente : les oscillations durent plus longtemps', 'Une résistance plus grande amortit davantage : les oscillations s’éteignent plus vite, donc τ diminue.'),
      V('il diminue : l’amplitude décroît plus vite', 'Plus la résistance est grande, plus l’amortissement est fort, donc plus τ est petit.'),
      F('il ne change pas, la résistance n’intervenant pas dans l’amortissement', 'La résistance est la cause de l’amortissement (énergie dissipée par effet Joule) : elle change τ.'),
      F('il devient infini : le régime devient périodique', 'Un régime périodique correspond à une résistance nulle, pas à une résistance plus grande.'),
    ] },
];

export const OSL_VAL = [
  P({ id: 'osl-val-pseudoperiode', schema: { type: 'oscRessort', amort: true }, domaine: DOM, niveau: 2, titre: 'Pseudopériode et période propre', plausible: false,
    enonce: 'Un élève affirme : « un oscillateur très faiblement amorti a une pseudopériode deux fois plus grande que sa période propre ».',
    reperes: [['Amortissement', 'très faible'], ['Pseudopériode', 'durée entre deux maxima successifs']],
    ver: 'Quand l’amortissement est faible, la pseudopériode est très voisine de la période propre (légèrement supérieure). Un facteur 2 supposerait un amortissement très fort.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      F('il pense à tort que la pseudopériode existe en régime faiblement amorti', 'La pseudopériode existe bien en régime pseudopériodique : l’erreur est ailleurs.'),
      V('il oublie que les deux durées sont voisines', 'Avec un amortissement faible, les deux durées sont presque égales.'),
      F('il confond la période et l’amplitude', 'L’énoncé parle bien de durées : la confusion n’est pas là.'),
    ] }),
  P({ id: 'osl-val-critique', schema: { type: 'oscRessort', amort: true }, domaine: DOM, niveau: 2, titre: 'Le régime critique oscille-t-il ?', plausible: false,
    enonce: 'Une élève écrit : « en régime critique, le système oscille plusieurs fois autour de sa position d’équilibre avant de s’arrêter ».',
    reperes: [['Régime critique', 'amortissement juste suffisant'], ['Oscillations', 'passages répétés par l’équilibre']],
    ver: 'En régime critique, il n’y a aucune oscillation : le système revient à l’équilibre le plus vite possible sans le dépasser. Ce sont les oscillations qui définissent le régime pseudopériodique.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('le régime critique ne présente aucune oscillation', 'Le système revient à l’équilibre sans le dépasser : les oscillations sont propres au régime pseudopériodique.'),
      F('le régime critique oscille, mais avec une amplitude constante', 'Une amplitude constante serait un régime périodique, sans amortissement.'),
      F('le régime critique n’existe que pour les circuits électriques', 'Le régime critique existe aussi pour les oscillateurs mécaniques.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const nf = (v, d = 1) => v.toFixed(d).replace('.', ',');
export const OSL_SAPP = [
  {
    id: 'osl-sapp-periode', schema: () => ({ type: 'oscRessort', courbe: 'mesure' }), domaine: DOM, titre: 'Période et fréquence d’un oscillateur à partir d’une mesure de durée', noms: ['Période', 'Fréquence'],
    gen: () => { const N = tire([8, 10, 12, 15, 20, 25]), dt = tire([6, 7.5, 9, 12, 15, 18, 24]); return { N, dt: N === dt ? dt + 3 : dt, m: tire([0.2, 0.5, 1]) }; },
    build: epure((p, q) => {
      const tokens = {
        N: tok(`${p.N} oscillations`, 'Nombre d’oscillations comptées', p.N, ''), dt: tok(`${nf(p.dt)} s`, 'Durée de la mesure', p.dt, 's'), m: tok(`${nf(p.m)} kg`, 'Masse de l’oscillateur', p.m, 'kg'), temp: tok('20 °C', 'Température de la salle', 20, '°C'),
      };
      const raisons = { m: 'La masse n’est pas nécessaire : la période se déduit directement de la mesure de durée.', temp: 'La température de la salle n’intervient pas dans le calcul d’une période mesurée.' };
      const debut = ['Un oscillateur de masse ', T('m'), ' est étudié dans une salle à ', T('temp'), '. On compte ', T('N'), ' en ', T('dt'), '. '];
      return q === 0
        ? { tokens, derivees: ['période = frac(durée|nombre d’oscillations)'], texte: [...debut, 'Quelle est la période de ses oscillations ?'], utiles: ['N', 'dt'],
          raisons, cherche: { bonne: 'La période des oscillations', faux: ['La fréquence des oscillations', 'L’amplitude des oscillations', 'La masse de l’oscillateur'] }, manque: null, solution: { txt: 'frac(durée|nombre d’oscillations)', val: p.dt / p.N, u: 's' } }
        : { tokens, derivees: ['fréquence = frac(nombre d’oscillations|durée)'], texte: [...debut, 'Quelle est la fréquence de ses oscillations ?'], utiles: ['N', 'dt'],
          raisons, cherche: { bonne: 'La fréquence des oscillations', faux: ['La période des oscillations', 'L’amplitude des oscillations', 'La masse de l’oscillateur'] }, manque: null, solution: { txt: 'frac(nombre d’oscillations|durée)', val: p.N / p.dt, u: 'Hz' } };
    }),
  },
  {
    id: 'osl-sapp-tau', schema: () => ({ type: 'oscRessort', amort: true, courbe: 'amortie' }), domaine: DOM, titre: 'Amplitude d’un oscillateur amorti à un instant donné', noms: ['Amplitude à l’instant τ', 'Amplitude à l’instant 2τ'],
    gen: () => ({ A0: tire([6, 8, 10, 12]), tau: tire([1.5, 2, 2.5, 3]), f: tire([0.8, 1.25, 2]) }),
    build: epure((p, q) => {
      const tokens = {
        A0: tok(`${nf(p.A0)} cm`, 'Amplitude initiale', p.A0, 'cm'), tau: tok(`${nf(p.tau)} s`, 'Temps caractéristique d’amortissement', p.tau, 's'), f: tok(`${nf(p.f, 2)} Hz`, 'Fréquence propre', p.f, 'Hz'), e: tok('e ≈ 2,72', 'Nombre e', 2.72, ''),
      };
      const raisons = { f: 'La fréquence propre ne sert pas à calculer l’amplitude à un multiple de τ.', tau: 'Ici, on exprime l’instant en nombre de τ : sa valeur en secondes ne sert pas.' };
      const debutFin = ['Un oscillateur de fréquence propre ', T('f'), ' est faiblement amorti : son amplitude décroît comme A(t) = A₀ · exp(−t/τ), avec une amplitude initiale ', T('A0'), ' et un temps caractéristique ', T('tau'), '. On donne ', T('e'), '. '];
      return q === 0
        ? { tokens, derivees: ['A(τ) = frac(A₀|e)'], texte: [...debutFin, 'Quelle est l’amplitude à l’instant t = τ ?'], utiles: ['A0', 'e'],
          raisons: { f: raisons.f, tau: raisons.tau }, cherche: { bonne: 'L’amplitude à l’instant t = τ', faux: ['L’amplitude à l’instant t = 2τ', 'L’amplitude initiale', 'La fréquence propre'] }, manque: null, solution: { txt: 'frac(A₀|e)', val: p.A0 / 2.72, u: 'cm' } }
        : { tokens, derivees: ['A(2τ) = frac(A₀|e²)'], texte: [...debutFin, 'Quelle est l’amplitude à l’instant t = 2τ ?'], utiles: ['A0', 'e'],
          raisons: { f: raisons.f, tau: raisons.tau }, cherche: { bonne: 'L’amplitude à l’instant t = 2τ', faux: ['L’amplitude à l’instant t = τ', 'L’amplitude initiale', 'La fréquence propre'] }, manque: null, solution: { txt: 'frac(A₀|e²)', val: p.A0 / (2.72 * 2.72), u: 'cm' } };
    }),
  },
];
void T;
