// Exercices ANA (prévoir sans calculer), VAL (plausible ?) et S'APP (repérer les données utiles) de la simulation 227 « Panneau photovoltaïque : caractéristique et puissance maximale » (TSTL, PCM, Énergie électrique).
// Préfixe d'identifiants : pvc- ; domaine : « Panneau photovoltaïque : caractéristique, puissance maximale, éclairement ». Branchés dans AtelierAnalyserBanque.js, AtelierValiderBanque.js et AtelierDonneesBanque.js ; la famille REA est dans AtelierRealiserBanque.jsx.
// Capacités visées (jamais affichées) : puissance électrique P = U × I fournie par un générateur ; loi d'Ohm ; caractéristique intensité-tension d'un panneau photovoltaïque comparée à celle d'une source idéale de tension.
// Aucune situation du Moodle : valeurs inventées pour ces exercices.
const DOM = 'Panneau photovoltaïque : caractéristique, puissance maximale, éclairement';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

// ───────────── ANA : prévoir sans calculer ─────────────
export const PVC_ANA = [
  { id: 'pvc-ana-extremes', domaine: DOM, titre: 'Un panneau relié par un simple fil',
    enonce: 'Les deux bornes d’un panneau photovoltaïque éclairé sont reliées par un simple fil (court-circuit). Le panneau débite alors son courant de court-circuit Icc, qui est le plus grand courant qu’il puisse fournir.', q: 'Quelle puissance électrique le panneau fournit-il dans ce cas ?', options: [
      V('une puissance nulle, car la tension à ses bornes est nulle', 'La puissance est P = U × I. Avec un simple fil, U = 0 : malgré le courant maximal, le produit est nul.'),
      F('la puissance maximale : le courant est le plus grand possible', 'Le courant est maximal, mais la tension est nulle : P = U × I = 0. La puissance maximale est obtenue entre le court-circuit et le circuit ouvert.'),
      F('le produit Uco × Icc, qui réunit les deux valeurs extrêmes', 'Uco correspond à I = 0 et Icc à U = 0 : ces deux valeurs ne sont jamais atteintes en même temps, leur produit n’est pas une puissance fournie.'),
      F('une puissance négative : le panneau absorbe de l’énergie', 'P = U × I vaut 0, pas une valeur négative : le panneau ne reçoit pas d’énergie électrique, il n’en fournit simplement pas.'),
    ] },
  { id: 'pvc-ana-charge', domaine: DOM, titre: 'Quelle charge pour la puissance maximale ?',
    enonce: 'Un panneau photovoltaïque éclairé alimente une résistance variable R. Sa caractéristique intensité-tension présente un plateau de courant, puis une chute rapide près de la tension à vide.', q: 'Pour quelle charge la puissance fournie est-elle la plus grande ?', options: [
      V('une résistance intermédiaire, point de fonctionnement au coude', 'Pour R très petite, U est presque nulle ; pour R très grande, I est presque nulle. Entre les deux, le produit U × I passe par un maximum, au coude de la caractéristique.'),
      F('la plus petite résistance possible, car le courant est alors maximal', 'Pour R presque nulle, U est presque nulle : le produit U × I est presque nul, malgré le courant élevé.'),
      F('la plus grande résistance possible, car la tension est alors maximale', 'Pour R très grande, I est presque nulle : P = U × I est presque nulle, malgré la tension élevée.'),
      F('n’importe laquelle : la puissance ne dépend pas de la charge', 'Le point de fonctionnement (U ; I) dépend de R, donc la puissance aussi : elle passe par un maximum pour une valeur précise de R.'),
    ] },
  { id: 'pvc-ana-ideale', domaine: DOM, titre: 'Source idéale ou panneau sur une faible résistance',
    enonce: 'On branche une résistance de 2 Ω successivement sur une source idéale de tension de 3 V, puis sur un panneau photovoltaïque éclairé dont la tension à vide est voisine de 3,7 V et le courant de court-circuit égal à 200 mA.', q: 'Que peut-on dire des intensités débitées ?', options: [
      V('la source idéale débite 1,5 A, le panneau au plus environ 200 mA', 'Source idéale : I = U ÷ R = 3 ÷ 2 = 1,5 A. Le panneau ne peut pas dépasser son courant de court-circuit : il n’impose pas sa tension.'),
      F('les deux débitent 1,5 A, car leurs tensions sont voisines', 'Le courant du panneau est limité à Icc = 200 mA : il ne peut pas atteindre 1,5 A, quelle que soit sa tension à vide.'),
      F('le panneau débite davantage, car sa tension à vide est plus élevée', 'Sur 2 Ω, le courant du panneau est limité à environ 200 mA, bien en dessous des 1,5 A de la source idéale.'),
      F('les deux débitent 200 mA : une source idéale est limitée aussi', 'Une source idéale ne limite pas le courant : elle maintient sa tension, donc I = U ÷ R = 1,5 A sur 2 Ω.'),
    ] },
  { id: 'pvc-ana-eclair', domaine: DOM, titre: 'Un éclairement divisé par deux',
    enonce: 'Un panneau photovoltaïque est éclairé sous 800 W/m² ; on relève son courant de court-circuit et sa tension à vide. On diminue l’éclairement jusqu’à 400 W/m², la température restant la même.', q: 'Que deviennent ces deux grandeurs ?', options: [
      V('Icc est divisé par 2, alors que Uco ne baisse que de quelques pour cent', 'Icc est proportionnel à l’éclairement. Uco varie comme le logarithme de l’éclairement : diviser E par 2 ne la diminue que de quelques pour cent.'),
      F('Icc et Uco sont tous deux divisés par 2, comme l’éclairement', 'Seul le courant de court-circuit est proportionnel à l’éclairement ; la tension à vide en dépend très peu.'),
      F('Uco est divisée par 2, tandis qu’Icc reste inchangé', 'C’est l’inverse : le courant de court-circuit suit l’éclairement, la tension à vide en dépend très peu.'),
      F('ni l’une ni l’autre ne change : l’éclairement ne joue que sur la couleur', 'L’éclairement fixe le nombre de photons reçus, donc le courant photogénéré : le courant de court-circuit change.'),
    ] },
];

// ───────────── VAL : plausible ? ─────────────
export const PVC_VAL = [
  P({ id: 'pvc-val-impossible', domaine: DOM, niveau: 1, titre: 'Une tension supérieure à la tension à vide', plausible: false,
    enonce: 'Un élève relève, aux bornes d’un panneau photovoltaïque fermé sur une résistance de 50 Ω, une tension U = 4,2 V. Il avait mesuré auparavant, sous le même éclairement, la tension à vide Uco = 3,7 V du même panneau.',
    reperes: [['Tension à vide Uco', '3,7 V'], ['Tension relevée sur 50 Ω', '4,2 V'], ['Fonctionnement en générateur', 'U comprise entre 0 et Uco']],
    ver: 'Quand le panneau débite un courant, la tension à ses bornes est inférieure ou égale à sa tension à vide. La valeur 4,2 V dépasse Uco = 3,7 V : elle n’est pas plausible.',
    q2: 'Quelle valeur est plausible pour U sur 50 Ω ?',
    options: [
      V('un peu moins de 3,7 V : le courant est faible sur 50 Ω', 'Sur 50 Ω, le courant reste faible : le point de fonctionnement est près de la tension à vide, juste en dessous de Uco.'),
      F('environ 4,5 V : en charge, la tension du panneau augmente', 'En charge, la tension diminue par rapport à la tension à vide : elle ne peut pas la dépasser.'),
      F('environ 1 V : une résistance de 50 Ω écroule la tension', 'Sur 50 Ω, le courant est faible, donc la tension reste proche de Uco : 1 V correspondrait à une résistance beaucoup plus faible.'),
    ] }),
  P({ id: 'pvc-val-eclair', domaine: DOM, niveau: 2, titre: 'Courant et tension à deux éclairements', plausible: true,
    enonce: 'Un élève mesure sur un petit panneau, sous 1000 W/m² : Icc = 120 mA et Uco = 4,1 V. Sous 500 W/m², il trouve Icc = 61 mA et Uco = 3,9 V. Il conclut : « le courant a été divisé par 2, alors que la tension à vide a à peine changé ».',
    reperes: [['Rapport des éclairements', 'frac(500|1000) = 0,5'], ['Rapport des courants', '61 divisé par 120 ≈ 0,51'], ['Rapport des tensions', '3,9 divisé par 4,1 ≈ 0,95']],
    ver: 'Le rapport des courants (0,51) est voisin de celui des éclairements (0,5) : Icc est proportionnel à E. Le rapport des tensions (0,95) est proche de 1 : Uco varie très peu. La conclusion est plausible.',
    q2: 'Pourquoi la tension à vide varie-t-elle si peu avec l’éclairement ?',
    options: [
      V('elle varie comme le logarithme de l’éclairement, donc très lentement', 'Uco dépend du logarithme du rapport entre le courant photogénéré et un courant de fuite : un facteur 2 sur E ne change Uco que de quelques pour cent.'),
      F('elle est imposée par la lampe et non par le panneau', 'La tension à vide est une propriété du panneau (nombre de cellules, matériau) : elle varie peu avec l’éclairement, sans être imposée par la lampe.'),
      F('elle est proportionnelle à l’éclairement, comme le courant', 'Ce n’est pas le cas : le courant est proportionnel à l’éclairement, mais pas la tension à vide.'),
    ] }),
];

// ───────────── S'APP : repérer les données utiles ─────────────
const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const virg = (x, d) => Number(x).toFixed(d).replace('.', ',');
export const PVC_SAPP = [
  {
    id: 'pvc-sapp-puissance', domaine: DOM, titre: 'Puissance fournie et résistance de la charge', noms: ['Puissance électrique fournie', 'Résistance de la charge'],
    gen: () => ({ U: tire([1.6, 2.2, 2.8, 3.1, 3.4, 3.8]), I: tire([45, 62, 80, 115, 150, 185]), E: tire([600, 800, 1000]), S: tire([25, 37.5, 50]) }),
    build: epure((p, q) => {
      const tokens = {
        U: tok(`${virg(p.U, 1)} V`, 'Tension aux bornes du panneau', p.U, 'V'),
        I: tok(`${p.I} mA`, 'Intensité du courant dans le circuit', p.I, 'mA'),
        E: tok(`${p.E} W/m²`, 'Éclairement du panneau', p.E, 'W/m²'),
        S: tok(`${virg(p.S, 1)} cm²`, 'Surface du panneau', p.S, 'cm²'),
        T: tok('25 °C', 'Température du panneau', 25, '°C'),
      };
      const debut = ['Un panneau photovoltaïque de ', T('S'), ', éclairé avec ', T('E'), ' et maintenu à ', T('T'), ', alimente une résistance. Un voltmètre indique ', T('U'), ' aux bornes du panneau et un ampèremètre indique ', T('I'), '. '];
      const raisons = { E: 'L’éclairement donne la puissance lumineuse reçue par mètre carré ; il ne sert pas à calculer la puissance électrique à partir de U et I.', S: 'La surface du panneau ne sert pas ici : elle servirait à calculer la puissance lumineuse reçue.', T: 'La température ne sert pas dans le calcul à partir des mesures de U et de I.' };
      if (q === 0) return { tokens, derivees: ['I en ampères : I = valeur en mA ÷ 1000'], texte: [...debut, 'Quelle puissance électrique le panneau fournit-il ?'], utiles: ['U', 'I'], raisons,
        cherche: { bonne: 'La puissance électrique fournie (en W)', faux: ['La résistance de la charge (en Ω)', 'La puissance lumineuse reçue par le panneau (en W)', 'L’énergie fournie pendant une heure (en Wh)'] },
        manque: null, solution: { txt: 'P = U × I, avec I en ampères', val: p.U * p.I / 1000, u: 'W' } };
      return { tokens, derivees: ['I en ampères : I = valeur en mA ÷ 1000'], texte: [...debut, 'Quelle est la valeur de la résistance de la charge ?'], utiles: ['U', 'I'], raisons,
        cherche: { bonne: 'La résistance R de la charge (en Ω)', faux: ['La puissance électrique fournie (en W)', 'Le courant de court-circuit du panneau (en mA)', 'La tension à vide du panneau (en V)'] },
        manque: null, solution: { txt: 'loi d’Ohm : R = U ÷ I, avec I en ampères', val: p.U / (p.I / 1000), u: 'Ω' } };
    }),
  },
  {
    id: 'pvc-sapp-eclair', domaine: DOM, titre: 'Courant et puissance à un autre éclairement', noms: ['Courant de court-circuit au nouvel éclairement', 'Puissance maximale au nouvel éclairement'],
    gen: () => ({ E1: tire([800, 900, 1000]), E2: tire([300, 400, 500, 600]), Icc: tire([96, 120, 150, 180, 240]), Pm: tire([0.25, 0.32, 0.4, 0.5, 0.6]), Uco: tire([1.8, 3.7, 5.5]) }),
    build: epure((p, q) => {
      const tokens = {
        E1: tok(`${p.E1} W/m²`, 'Éclairement de la première mesure', p.E1, 'W/m²'),
        E2: tok(`${p.E2} W/m²`, 'Nouvel éclairement', p.E2, 'W/m²'),
        Icc: tok(`${p.Icc} mA`, 'Courant de court-circuit à la première mesure', p.Icc, 'mA'),
        Pm: tok(`${virg(p.Pm, 2)} W`, 'Puissance maximale à la première mesure', p.Pm, 'W'),
        Uco: tok(`${virg(p.Uco, 1)} V`, 'Tension à vide à la première mesure', p.Uco, 'V'),
        T: tok('25 °C', 'Température du panneau', 25, '°C'),
      };
      const debut = ['Un panneau photovoltaïque, maintenu à ', T('T'), ', est éclairé avec ', T('E1'), '. On mesure un courant de court-circuit de ', T('Icc'), ', une tension à vide de ', T('Uco'), ' et une puissance maximale de ', T('Pm'), '. On éclaire ensuite le panneau avec ', T('E2'), '. On admet que le courant de court-circuit et la puissance maximale sont proportionnels à l’éclairement. '];
      if (q === 0) return { tokens, derivees: ['rapport des éclairements : E2 ÷ E1'], texte: [...debut, 'Quel est alors le courant de court-circuit ?'], utiles: ['E1', 'E2', 'Icc'],
        raisons: { Pm: 'La puissance maximale ne sert pas à trouver le courant de court-circuit.', Uco: 'La tension à vide varie très peu avec l’éclairement et ne sert pas pour trouver le courant.', T: 'La température reste la même : elle n’intervient pas dans le calcul.' },
        cherche: { bonne: 'Le courant de court-circuit à E2 (en mA)', faux: ['La tension à vide à E2 (en V)', 'La puissance maximale à E2 (en W)', 'Le rendement du panneau (en %)'] },
        manque: null, solution: { txt: 'Icc2 = Icc1 × E2 ÷ E1', val: p.Icc * p.E2 / p.E1, u: 'mA' } };
      return { tokens, derivees: ['rapport des éclairements : E2 ÷ E1'], texte: [...debut, 'Quelle puissance maximale peut-on espérer ?'], utiles: ['E1', 'E2', 'Pm'],
        raisons: { Icc: 'Le courant de court-circuit ne sert pas pour passer d’une puissance maximale à l’autre : on utilise le rapport des éclairements.', Uco: 'La tension à vide ne sert pas ici : on admet que la puissance maximale est proportionnelle à l’éclairement.', T: 'La température reste la même : elle n’intervient pas dans le calcul.' },
        cherche: { bonne: 'La puissance maximale à E2 (en W)', faux: ['Le courant de court-circuit à E2 (en mA)', 'La tension à vide à E2 (en V)', 'La résistance qui donne cette puissance (en Ω)'] },
        manque: null, solution: { txt: 'Pmax2 = Pmax1 × E2 ÷ E1', val: p.Pm * p.E2 / p.E1, u: 'W' } };
    }),
  },
];
