// Exercices ANA (prévoir sans calculer), VAL (plausible ?) et S'APP (repérer les données utiles) de la simulation 228 « Rendement d'un panneau photovoltaïque : bilan et facteurs limitants » (TSTL, PCM, Énergie et ondes).
// Préfixe d'identifiants : pvr- ; domaine : « Panneau photovoltaïque : rendement et bilan énergétique ». Branchés dans AtelierAnalyserBanque.js, AtelierValiderBanque.js et AtelierDonneesBanque.js ; les familles REA sont dans AtelierRealiserBanque.jsx.
// Capacités visées (jamais affichées) : relation entre flux énergétique et éclairement (Φ = E × S) ; estimer le rendement d'un panneau photovoltaïque à partir de données fournies et identifier les facteurs limitants ; bilan énergétique d'un panneau.
// Aucune situation du Moodle : valeurs inventées pour ces exercices.
const DOM = 'Panneau photovoltaïque : rendement et bilan énergétique';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

// ───────────── ANA : prévoir sans calculer ─────────────
export const PVR_ANA = [
  { id: 'pvr-ana-surface', domaine: DOM, titre: 'Un panneau de surface double',
    enonce: 'Deux panneaux photovoltaïques, fabriqués avec les mêmes cellules, sont éclairés de la même façon sous 800 W/m². Le deuxième a une surface deux fois plus grande que le premier. Les deux fonctionnent à leur puissance maximale.', q: 'Que peut-on dire du rendement et de la puissance lumineuse reçue par le deuxième panneau ?', options: [
      V('sa puissance lumineuse reçue double, mais son rendement reste le même', 'Plum = E × S : avec le même éclairement, doubler S double Plum. Les cellules sont identiques, donc le rendement ne change pas ; la puissance électrique double aussi.'),
      F('sa puissance lumineuse reçue et son rendement sont tous deux doublés', 'Seule la lumière reçue double : le rendement est un rapport frac(Pél|Plum), et les deux puissances doublent, donc le rapport reste le même.'),
      F('sa puissance lumineuse reçue est doublée, son rendement est divisé par 2', 'Le rendement ne dépend pas de la taille d’un panneau de même technologie : Pél et Plum doublent ensemble.'),
      F('sa puissance lumineuse reçue est la même, car l’éclairement est le même', 'Plum = E × S : à éclairement égal, une surface double reçoit une puissance lumineuse double.'),
    ] },
  { id: 'pvr-ana-eclair', domaine: DOM, titre: 'Moins de lumière sur le même panneau',
    enonce: 'Un panneau photovoltaïque est éclairé sous 1000 W/m², puis sous 500 W/m². La température est la même. Dans les deux cas, la résistance branchée est choisie pour obtenir la puissance électrique maximale.', q: 'Comment évoluent la puissance électrique fournie et le rendement ?', options: [
      V('la puissance électrique baisse de moitié, le rendement varie peu', 'La puissance électrique maximale est à peu près proportionnelle à la lumière reçue : le rapport frac(Pél|Plum), c’est-à-dire le rendement, varie peu.'),
      F('la puissance électrique est divisée par 2 et le rendement aussi', 'Le rendement est un rapport : si Pél et Plum sont tous deux divisés par 2, il ne change presque pas.'),
      F('la puissance électrique ne change pas, mais le rendement double aussi', 'La puissance électrique dépend de la lumière reçue : elle diminue quand l’éclairement diminue.'),
      F('la puissance électrique est divisée par 4, le rendement est divisé par 2', 'La puissance électrique varie à peu près comme l’éclairement (division par 2), pas comme son carré.'),
    ] },
  { id: 'pvr-ana-pertes', domaine: DOM, titre: 'Que devient la lumière d’un panneau à 20 %',
    enonce: 'Un panneau photovoltaïque a, à son point de puissance maximale, un rendement de 20 %. Il reçoit une puissance lumineuse Plum.', q: 'Quelle part de la puissance lumineuse reçue est perdue ?', options: [
      V('environ 80 %, principalement sous forme de chaleur dégagée', 'pertes = Plum − Pél = Plum × (1 − 0,20) : 80 % de la lumière reçue n’est pas convertie en électricité, surtout en chaleur.'),
      F('environ 20 %, car le rendement est le pourcentage perdu', 'Le rendement est la part utile (convertie en électricité), pas la part perdue : les pertes valent 100 % − 20 %.'),
      F('aucune : l’énergie se conserve, donc rien n’est perdu', 'L’énergie totale se conserve, mais seule une partie devient électricité : le reste est perdu pour l’utilisateur (chaleur).'),
      F('environ 120 %, car il faut ajouter le rendement à la lumière reçue', 'Une perte ne peut pas dépasser la lumière reçue : pertes = Plum − Pél, donc inférieure à 100 % de Plum.'),
    ] },
  { id: 'pvr-ana-charge', domaine: DOM, titre: 'Une charge trop grande',
    enonce: 'Un panneau photovoltaïque est éclairé sous 600 W/m². Il alimente une résistance choisie pour obtenir sa puissance maximale. On la remplace par une résistance beaucoup plus grande, sans changer l’éclairement.', q: 'Que deviennent la puissance lumineuse reçue et le rendement ?', options: [
      V('la lumière reçue ne change pas, le rendement baisse fortement', 'Plum = E × S ne dépend pas de la résistance. Avec une charge trop grande, le courant devient faible : Pél = U × I diminue, donc le rendement baisse.'),
      F('la lumière reçue diminue, le rendement ne change pas', 'La lumière reçue ne dépend que de E et de S : la résistance ne la modifie pas, alors que Pél, donc le rendement, change.'),
      F('la lumière reçue et le rendement ne changent pas, car E est constant', 'E est constant donc Plum aussi, mais Pél = U × I dépend du point de fonctionnement : le rendement change.'),
      F('le rendement augmente, car la tension du panneau est plus grande', 'La tension augmente un peu, mais le courant chute beaucoup : le produit U × I, donc le rendement, diminue.'),
    ] },
];

// ───────────── VAL : plausible ? ─────────────
export const PVR_VAL = [
  P({ id: 'pvr-val-sup100', domaine: DOM, niveau: 1, titre: 'Un rendement supérieur à 100 %', plausible: false,
    enonce: 'Un élève éclaire un panneau photovoltaïque de 25 cm² sous 800 W/m². Il mesure, à la meilleure résistance, une puissance électrique fournie de 2,6 W. Il en déduit : « le panneau fonctionne avec un rendement de 130 % ».',
    reperes: [['Éclairement E', '800 W/m²'], ['Surface S', '25 cm², soit 0,0025 m²'], ['Plum = E × S', '2,0 W'], ['Puissance électrique mesurée', '2,6 W']],
    ver: 'La lumière reçue est Plum = 800 × 0,0025 = 2,0 W. Une puissance électrique de 2,6 W dépasserait la puissance reçue : le rendement serait de 130 %, impossible. La mesure ou le calcul est faux.',
    q2: 'Quelle est la cause d’erreur la plus probable ?',
    options: [
      V('la surface est restée en cm², ou la mesure de U × I est incorrecte', 'Un rendement supérieur à 100 % signale une erreur de calcul ou de mesure (par exemple surface en cm² non convertie, ou I laissée en mA) : l’énergie ne peut pas être créée.'),
      F('le panneau fonctionne bien : un bon panneau dépasse parfois 100 %', 'Aucun panneau n’a un rendement supérieur à 100 % : il fournirait plus d’énergie qu’il n’en reçoit.'),
      F('l’éclairement a augmenté pendant la mesure, ce qui fait monter le rendement', 'Si l’éclairement augmente, Plum augmente aussi : le rapport reste inférieur à 100 %.'),
    ] }),
  P({ id: 'pvr-val-eta', domaine: DOM, niveau: 2, titre: 'Rendement mesuré sur un panneau de laboratoire', plausible: true,
    enonce: 'Un panneau de 37,5 cm² est éclairé sous 1000 W/m². À la résistance qui donne la puissance maximale, un voltmètre indique U = 3,1 V et un ampèremètre I = 187 mA. L’élève calcule un rendement d’environ 15 %.',
    reperes: [['Conversion', '1 cm² = 10⁻⁴ m² ; 1 mA = 10⁻³ A'], ['Puissances', 'Plum = E × S (lumière reçue) ; Pél = U × I (électricité fournie)']],
    ver: 'Plum = 1000 × 0,00375 = 3,75 W ; Pél = 3,1 × 0,187 ≈ 0,58 W ; η = frac(0,58|3,75) ≈ 0,155, soit environ 15 %. Cette valeur est plausible pour un panneau au silicium (de l’ordre de 15 à 25 %).',
    q2: 'Quelle part de la lumière reçue est alors perdue ?',
    options: [
      V('environ 85 % de la lumière reçue, surtout en chaleur', 'pertes = Plum − Pél ≈ 3,75 − 0,58 ≈ 3,17 W, soit environ 85 % de la lumière reçue.'),
      F('environ 15 %, c’est la valeur du rendement', '15 % est la part convertie en électricité ; la part perdue vaut 100 % − 15 % = 85 %.'),
      F('aucune, car le rendement est faible mais l’énergie est conservée', 'Elle est conservée, mais elle part sous forme de chaleur : c’est une perte pour l’utilisateur.'),
    ] }),
];

// ───────────── S'APP : repérer les données utiles ─────────────
const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const virg = (x, d) => Number(x).toFixed(d).replace('.', ',');
export const PVR_SAPP = [
  {
    id: 'pvr-sapp-rendement', domaine: DOM, titre: 'Rendement d’un panneau éclairé', noms: ['Puissance lumineuse reçue', 'Rendement du panneau'],
    gen: () => {
      const S = tire([25, 37.5, 50]), E = tire([600, 800, 1000]), Pl = E * S / 1e4, U = tire([1.6, 2.2, 2.8, 3.1, 3.4, 3.8]);
      const I = Math.max(20, Math.round(tire([0.08, 0.1, 0.12, 0.14, 0.16, 0.18]) * Pl * 1000 / U));
      return { S, E, U, I };
    },
    build: epure((p, q) => {
      const tokens = {
        S: tok(`${virg(p.S, p.S % 1 ? 1 : 0)} cm²`, 'Surface du panneau', p.S, 'cm²'),
        E: tok(`${p.E} W/m²`, 'Éclairement du panneau', p.E, 'W/m²'),
        U: tok(`${virg(p.U, 1)} V`, 'Tension aux bornes du panneau', p.U, 'V'),
        I: tok(`${p.I} mA`, 'Intensité du courant dans le circuit', p.I, 'mA'),
        T: tok('25 °C', 'Température du panneau', 25, '°C'),
      };
      const debut = ['Un panneau photovoltaïque de surface ', T('S'), ', maintenu à ', T('T'), ', est éclairé avec ', T('E'), '. Il alimente une résistance : un voltmètre indique ', T('U'), ' aux bornes du panneau et un ampèremètre indique ', T('I'), '. '];
      if (q === 0) return { tokens, derivees: ['S en m² : S = frac(valeur en cm²|10 000)'], texte: [...debut, 'Quelle puissance lumineuse le panneau reçoit-il ?'], utiles: ['S', 'E'],
        raisons: { U: 'La tension sert à la puissance électrique fournie, pas à la lumière reçue.', I: 'L’intensité sert à la puissance électrique fournie, pas à la lumière reçue.', T: 'La température ne sert pas dans ce calcul.' },
        cherche: { bonne: 'La puissance lumineuse reçue par le panneau (en W)', faux: ['La puissance électrique fournie par le panneau (en W)', 'Le rendement du panneau (en %)', 'L’énergie reçue pendant une heure (en Wh)'] },
        manque: null, solution: { txt: 'Plum = E × S, avec S en m²', val: p.E * p.S / 1e4, u: 'W' } };
      return { tokens, derivees: ['S en m² : S = frac(valeur en cm²|10 000)', 'I en ampères : I = frac(valeur en mA|1000)', 'Plum = E × S ; Pél = U × I'], texte: [...debut, 'Quel est le rendement du panneau ?'], utiles: ['S', 'E', 'U', 'I'],
        raisons: { T: 'La température ne sert pas dans le calcul à partir des mesures.' },
        cherche: { bonne: 'Le rendement du panneau (en %)', faux: ['La puissance électrique fournie (en W)', 'La puissance perdue (en W)', 'La résistance de la charge (en Ω)'] },
        manque: null, solution: { txt: 'η = frac(U × I|E × S), avec I en A et S en m²', val: 100 * (p.U * p.I / 1000) / (p.E * p.S / 1e4), u: '%' } };
    }),
  },
  {
    id: 'pvr-sapp-dimension', domaine: DOM, titre: 'Dimensionner un panneau', noms: ['Puissance lumineuse à recevoir', 'Surface du panneau'],
    gen: () => ({ Pel: tire([1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0]), eta: tire([12, 14, 15, 16, 18]), E: tire([600, 700, 800, 900, 1000]), Tc: tire([20, 25, 30]) }),
    build: epure((p, q) => {
      const tokens = {
        Pel: tok(`${virg(p.Pel, 1)} W`, 'Puissance électrique voulue', p.Pel, 'W'),
        eta: tok(`${p.eta} %`, 'Rendement du panneau', p.eta, '%'),
        E: tok(`${p.E} W/m²`, 'Éclairement', p.E, 'W/m²'),
        T: tok(`${p.Tc} °C`, 'Température ambiante', p.Tc, '°C'),
      };
      const debut = ['On veut alimenter un appareil qui demande une puissance électrique de ', T('Pel'), ' avec un panneau photovoltaïque de rendement ', T('eta'), '. Le panneau sera éclairé avec ', T('E'), ', la température ambiante étant de ', T('T'), '. '];
      if (q === 0) return { tokens, derivees: ['rendement en nombre décimal : η = frac(valeur en %|100)'], texte: [...debut, 'Quelle puissance lumineuse le panneau doit-il recevoir ?'], utiles: ['Pel', 'eta'],
        raisons: { E: 'L’éclairement sert à trouver la surface, pas la puissance lumineuse à recevoir.', T: 'La température ambiante ne sert pas dans ce calcul.' },
        cherche: { bonne: 'La puissance lumineuse à recevoir (en W)', faux: ['La surface du panneau (en cm²)', 'La puissance perdue (en W)', 'L’éclairement nécessaire (en W/m²)'] },
        manque: null, solution: { txt: 'Plum = frac(Pél|η), avec η en nombre décimal', val: p.Pel / (p.eta / 100), u: 'W' } };
      return { tokens, derivees: ['rendement en nombre décimal : η = frac(valeur en %|100)', 'Plum = frac(Pél|η)'], texte: [...debut, 'Quelle surface faut-il donner au panneau ?'], utiles: ['Pel', 'eta', 'E'],
        raisons: { T: 'La température ambiante ne sert pas dans ce calcul.' },
        cherche: { bonne: 'La surface du panneau (en cm²)', faux: ['La puissance lumineuse à recevoir (en W)', 'La puissance perdue (en W)', 'Le nombre de cellules du panneau'] },
        manque: null, solution: { txt: 'S = frac(Plum|E) = frac(Pél|η × E), puis conversion en cm²', val: 1e4 * p.Pel / (p.eta / 100) / p.E, u: 'cm²' } };
    }),
  },
];
