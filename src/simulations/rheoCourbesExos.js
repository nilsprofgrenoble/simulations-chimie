// Exercices ANA (prévoir sans calculer), VAL (plausible ?) et S'APP (repérer les données utiles) de la simulation 217
// « Courbes d'écoulement et de viscosité : lire un rhéogramme » (BTS MDC, formulation).
// Préfixe d'identifiants : rhc- ; domaine « Rhéologie ». Branchés dans AtelierAnalyserBanque.js (PREVOIR),
// AtelierValiderBanque.js et AtelierDonneesBanque.js. La famille REA (calculs) est dans RheoCourbesRealiser.jsx.
// Capacités du référentiel : « gradient de vitesse, contrainte de cisaillement, viscosité dynamique et cinématique » ;
// « identifier à partir de rhéogrammes (courbe de viscosité, courbe d'écoulement) les comportements : newtonien, plastique idéal,
// plastique non idéal, pseudoplastique, rhéoépaississant, thixotrope ».

const DOM = 'Rhéologie';
const NB = ' ';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = (o) => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });
const tire = (t) => t[Math.floor(Math.random() * t.length)];

// ───────────── ANA : prévoir sans calculer ─────────────
export const RHC_ANA = [
  { id: 'rhc-ana-newton', domaine: DOM, titre: 'Gradient triplé pour un fluide newtonien',
    enonce: 'Le glycérol est un fluide newtonien. Dans un viscosimètre, on triple le gradient de vitesse γ̇ en gardant la même température.', q: 'Que deviennent la contrainte de cisaillement τ et la viscosité η ?', options: [
      V('τ est multipliée par 3 ; η ne change pas', 'Pour un fluide newtonien, η est constante : τ = η × γ̇ est proportionnelle à γ̇, donc multipliée par 3.'),
      F('τ ne change pas ; η est multipliée par 3', 'C’est l’inverse : η est une propriété du fluide, constante pour un newtonien, et τ suit γ̇.'),
      F('τ et η sont toutes deux multipliées par 3', 'Si η était multipliée par 3, la courbe d’écoulement ne serait pas une droite : ce ne serait pas un fluide newtonien.'),
      F('τ est multipliée par 3 ; η est divisée par 3', 'Une viscosité qui diminue quand γ̇ augmente est celle d’un fluide rhéofluidifiant, pas d’un newtonien.'),
    ] },
  { id: 'rhc-ana-pseudo', domaine: DOM, titre: 'Gradient doublé pour un shampooing',
    enonce: 'Un shampooing est un fluide pseudoplastique, sans seuil d’écoulement. On double le gradient de vitesse, de 10 s⁻¹ à 20 s⁻¹.', q: 'Que peut-on prévoir pour τ et η ?', options: [
      V('τ augmente, mais de moins du double ; η diminue', 'La courbe d’écoulement s’incurve vers le bas : τ augmente moins vite que γ̇, donc η = τ / γ̇ diminue.'),
      F('τ est exactement doublée et η ne change pas', 'Ce serait le cas d’un fluide newtonien. Ici la viscosité dépend du gradient.'),
      F('τ est doublée et η est doublée aussi', 'Une viscosité qui augmente avec γ̇ est celle d’un rhéoépaississant, pas d’un pseudoplastique.'),
      F('τ diminue, car le shampooing devient plus fluide', 'C’est η qui diminue. La contrainte τ = η × γ̇ augmente quand même, car γ̇ augmente plus que η ne diminue.'),
    ] },
  { id: 'rhc-ana-seuil', domaine: DOM, titre: 'Un ketchup sous son seuil d’écoulement',
    enonce: 'Un ketchup est un fluide plastique non idéal, de contrainte seuil τ₀ ≈ 15 Pa. Une cuillère de ketchup est posée sur une assiette inclinée : la contrainte due à son poids reste inférieure à τ₀.', q: 'Que fait le ketchup ?', options: [
      V('Il ne s’écoule pas : sous le seuil, il se comporte en solide', 'Tant que la contrainte reste inférieure à τ₀, le produit ne s’écoule pas : il se comporte comme un solide.'),
      F('Il s’écoule lentement : sa viscosité est très grande mais constante', 'Un fluide à seuil n’a pas de viscosité constante : sous le seuil, il ne coule pas du tout (en pratique).'),
      F('Il s’écoule comme un fluide newtonien, mais plus lentement', 'Un newtonien n’a pas de seuil : il s’écoule dès que la contrainte n’est plus nulle.'),
      F('Il s’écoule de plus en plus vite, car il est rhéofluidifiant', 'Le caractère rhéofluidifiant joue quand le produit s’écoule déjà. Sous le seuil, rien ne coule.'),
    ] },
  { id: 'rhc-ana-thixo', domaine: DOM, titre: 'Une contrainte plus faible à la descente',
    enonce: 'On mesure la contrainte de cisaillement d’une crème en montant γ̇ de 1 à 300 s⁻¹, puis en le redescendant de 300 à 1 s⁻¹. Pour chaque gradient, la contrainte à la descente est plus faible qu’à la montée.', q: 'Quel comportement est mis en évidence ?', options: [
      V('Thixotrope : la structure détruite se reforme lentement', 'Le cisaillement détruit la structure ; elle ne se reconstruit pas instantanément : la viscosité est plus faible au retour.'),
      F('Rhéoépaississant : le cisaillement épaissit la crème', 'Un rhéoépaississant aurait une viscosité qui augmente avec γ̇. Ici, c’est l’effet de l’histoire du produit qui est visible.'),
      F('Newtonien : la crème a toujours la même viscosité', 'Un newtonien aurait des courbes aller et retour superposées.'),
      F('Plastique idéal : la crème possède un seuil d’écoulement', 'Le seuil se lit à l’ordonnée à l’origine de la courbe. L’écart entre aller et retour traduit autre chose : l’effet du temps.'),
    ] },
  { id: 'rhc-ana-droite-seuil', domaine: DOM, titre: 'Une droite qui coupe l’axe des τ',
    enonce: 'La courbe d’écoulement d’un produit est une droite qui coupe l’axe des τ en 20 Pa. Au-delà, la contrainte augmente proportionnellement à γ̇.', q: 'Quel comportement identifier ?', options: [
      V('Plastique idéal : seuil de 20 Pa, puis viscosité constante', 'Une droite qui ne passe pas par l’origine traduit un seuil (20 Pa), puis une viscosité constante : plastique idéal.'),
      F('Newtonien : toute droite d’écoulement est celle d’un newtonien', 'Un newtonien donne une droite passant par l’origine. Ici, la droite coupe l’axe à 20 Pa.'),
      F('Plastique non idéal : la courbe devrait s’incurver après le seuil', 'Après le seuil, la droite signifie une viscosité constante. Un plastique non idéal s’incurverait.'),
      F('Pseudoplastique : un seuil de 20 Pa ne change pas ce comportement', 'Un pseudoplastique n’a pas de seuil : sa courbe part de l’origine et s’incurve.'),
    ] },
];

// ───────────── VAL : plausible ? ─────────────
export const RHC_VAL = [
  P({ id: 'rhc-val-conversion', domaine: DOM, niveau: 1, titre: 'Viscosité d’une huile : unité', plausible: false,
    enonce: 'Un viscosimètre indique une contrainte de cisaillement τ = 25 Pa pour un gradient γ̇ = 2,0 s⁻¹. Un élève calcule la viscosité de l’huile et trouve η = 12 500 Pa·s.',
    reperes: [['Définition', 'η = τ / γ̇'], ['Eau', 'environ 1 mPa·s'], ['Huile alimentaire', 'quelques dizaines de mPa·s'], ['Miel', 'environ 10 Pa·s']],
    ver: 'η = 25 / 2,0 = 12,5 Pa·s, soit 12 500 mPa·s. L’élève a écrit le bon nombre avec la mauvaise unité : 12 500 Pa·s serait mille fois plus visqueux que le miel.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('Il a écrit la valeur en mPa·s avec l’unité Pa·s', '12,5 Pa·s = 12 500 mPa·s : le nombre trouvé est correct en mPa·s.'),
      F('Il a divisé γ̇ par τ au lieu de diviser τ par γ̇', '2,0 / 25 = 0,080 : ce n’est pas 12 500.'),
      F('Il a multiplié τ par γ̇ au lieu de les diviser entre eux', '25 × 2,0 = 50 : ce n’est pas 12 500.'),
    ] }),
  P({ id: 'rhc-val-newtonienne', domaine: DOM, niveau: 2, titre: 'Peinture A : newtonienne ?', plausible: false,
    enonce: 'Pour la peinture A, on mesure η = 18 290 mPa·s à γ̇ = 1 s⁻¹ et η = 874 mPa·s à γ̇ = 300 s⁻¹. Un élève conclut : « La peinture est newtonienne, car sa viscosité reste de l’ordre de plusieurs centaines de mPa·s ».',
    reperes: [['Fluide newtonien', 'viscosité constante, quel que soit γ̇'], ['Rapport des viscosités', 'η(1 s⁻¹) / η(300 s⁻¹)'], ['Fluide rhéofluidifiant', 'η diminue quand γ̇ augmente']],
    ver: 'La viscosité est divisée par 18 290 / 874 ≈ 21 entre 1 et 300 s⁻¹ : elle n’est pas constante. La peinture est rhéofluidifiante (pseudoplastique), pas newtonienne.',
    q2: 'Quelle est l’erreur de raisonnement ?',
    options: [
      V('Une viscosité newtonienne est constante, or elle est divisée par 21', 'Le critère du newtonien est la constance de η quand γ̇ varie, pas son ordre de grandeur.'),
      F('Il a confondu viscosité et contrainte de cisaillement dans ses calculs', 'Les valeurs données sont bien des viscosités, en mPa·s.'),
      F('Il n’a pas converti les mPa·s en Pa·s avant de comparer les valeurs', 'La conversion d’unité ne change pas le rapport des deux viscosités, qui reste proche de 21.'),
    ] }),
  P({ id: 'rhc-val-thixo-ok', domaine: DOM, niveau: 2, titre: 'Peinture A : perte de viscosité', plausible: true,
    enonce: 'Pour la peinture A, à γ̇ = 1 s⁻¹, la viscosité vaut 18 290 mPa·s à la montée et 15 110 mPa·s à la descente. Un élève calcule une perte de 17 % et conclut que la peinture est thixotrope, mais faiblement.',
    reperes: [['Perte relative', '(η montée − η descente) / η montée'], ['Thixotrope', 'courbe retour sous la courbe aller'], ['Ordre de grandeur', 'perte inférieure à 30 % : thixotropie modérée']],
    ver: '(18 290 − 15 110) / 18 290 ≈ 0,174, soit 17 % : le calcul est correct. La viscosité est plus faible au retour, donc la peinture est bien thixotrope, avec une perte modérée.',
    q2: 'Quel raisonnement est correct ?',
    options: [
      V('Cohérent : (18 290 − 15 110) / 18 290 ≈ 17 %, descente sous la montée', 'La perte relative se calcule par rapport à la valeur de départ ; une descente plus basse que la montée signifie thixotrope.'),
      F('Pas cohérent : la perte vaut 15 110 / 18 290 ≈ 83 % de la valeur de départ', 'Ce rapport est la part de viscosité conservée. La perte est le complément : 100 % − 83 % ≈ 17 %.'),
      F('Pas cohérent : une perte non nulle prouve que la peinture est newtonienne', 'Un newtonien aurait des courbes aller et retour superposées, donc aucune perte.'),
    ] }),
];

// ───────────── S'APP : repérer les données utiles ─────────────
const T = (id) => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff, quoi, use: { val, u } });
const epure = (f) => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some((t) => t && t.t === k))) }; };

export const RHC_SAPP = [
  {
    id: 'rhc-sapp-viscosimetre', domaine: DOM, titre: 'Un viscosimètre rotatif : quelle donnée utiliser ?', noms: ['Viscosité dynamique de l’échantillon', 'Gradient de vitesse imposé par le moteur'],
    gen: () => { const N = tire([10, 50, 100, 200, 500, 1000]); const tau = tire([12, 25, 48, 90, 150, 240]); return { N, g: Math.round(0.3 * N * 10) / 10, tau, C: tire([0.2, 0.4, 0.8, 1.5, 2.4]), T: tire([21.8, 22.5, 23.1]) }; },
    build: epure((p, q) => {
      const tokens = {
        N: tok(`${p.N}${NB}tr/min`, 'Vitesse de rotation du mobile', p.N, 'tr/min'),
        g: tok(`${String(p.g).replace('.', ',')}${NB}s⁻¹`, 'Gradient de vitesse imposé', p.g, 's⁻¹'),
        tau: tok(`${p.tau}${NB}Pa`, 'Contrainte de cisaillement mesurée', p.tau, 'Pa'),
        C: tok(`${String(p.C).replace('.', ',')}${NB}mN·m`, 'Couple mesuré par le capteur', p.C, 'mN·m'),
        T: tok(`${String(p.T).replace('.', ',')}${NB}°C`, 'Température de l’échantillon', p.T, '°C'),
        k: tok('0,30', 'Coefficient du mobile : γ̇ = 0,30 × N', 0.3, 's⁻¹ par tr/min'),
      };
      const debut = ['Un viscosimètre rotatif fait tourner un mobile à la vitesse ', T('N'), '. Pour ce mobile, γ̇ = ', T('k'), ' × N, avec N en tr/min. Le capteur indique un couple ', T('C'), ', ce qui correspond à une contrainte ', T('tau'), ' ; l’échantillon est à ', T('T'), '. '];
      if (q === 0) {
        return { tokens, derivees: [], texte: [...debut, 'Le gradient de vitesse imposé est ', T('g'), '. Quelle est la viscosité dynamique de l’échantillon ?'], utiles: ['tau', 'g'],
          raisons: { N: 'La vitesse de rotation fixe le gradient, mais le gradient est déjà donné : on n’a pas besoin de N pour calculer η.', C: 'Le couple a déjà été converti en contrainte τ : on utilise τ, pas le couple.', T: 'La température ne figure pas dans la relation η = τ / γ̇.', k: 'Le coefficient sert à passer de N à γ̇ ; ici γ̇ est donné.' },
          cherche: { bonne: 'La viscosité dynamique de l’échantillon', faux: ['La contrainte de cisaillement qui correspond au couple', 'La vitesse de rotation à imposer', 'La viscosité cinématique de l’échantillon'] },
          manque: null, solution: { txt: 'La viscosité est la contrainte divisée par le gradient : η = τ / γ̇', val: (p.tau / p.g) * 1000, u: 'mPa·s' } };
      }
      return { tokens, derivees: [], texte: [...debut, 'Quel gradient de vitesse le moteur impose-t-il à l’échantillon ?'], utiles: ['N', 'k'],
        raisons: { tau: 'La contrainte donne accès à la viscosité, pas au gradient imposé par le moteur.', C: 'Le couple mesuré dépend de l’échantillon ; le gradient est fixé par le moteur.', T: 'La température ne fixe pas le gradient imposé.' },
        cherche: { bonne: 'Le gradient de vitesse imposé par le moteur', faux: ['La contrainte de cisaillement de l’échantillon', 'La viscosité dynamique de l’échantillon', 'Le couple exercé sur le mobile'] },
        manque: null, solution: { txt: 'Pour ce mobile, γ̇ = 0,30 × N, avec N en tr/min', val: p.g, u: 's⁻¹' } };
    }),
  },
  {
    id: 'rhc-sapp-perte', domaine: DOM, titre: 'Montée et descente de γ̇ : quelles viscosités comparer ?', noms: ['Perte relative de viscosité', 'Écart de viscosité entre montée et descente'],
    gen: () => {
      const a = tire([18290, 28049, 12548, 17608]); const pc = tire([14, 19, 26, 31]);
      return { a, r: Math.round(a * (1 - pc / 100) / 10) * 10, g: tire([1, 2]), gmax: tire([220, 300]), dt: tire([2, 5]) };
    },
    build: epure((p, q) => {
      const tokens = {
        a: tok(`${p.a.toLocaleString('fr-FR').replace(/\s/g, NB)}${NB}mPa·s`, 'Viscosité à la montée', p.a, 'mPa·s'),
        r: tok(`${p.r.toLocaleString('fr-FR').replace(/\s/g, NB)}${NB}mPa·s`, 'Viscosité à la descente', p.r, 'mPa·s'),
        g: tok(`${p.g}${NB}s⁻¹`, 'Gradient de la comparaison', p.g, 's⁻¹'),
        gmax: tok(`${p.gmax}${NB}s⁻¹`, 'Gradient maximal atteint', p.gmax, 's⁻¹'),
        dt: tok(`${p.dt}${NB}s`, 'Durée de chaque palier', p.dt, 's'),
      };
      const debut = ['Une peinture est cisaillée : on monte γ̇ jusqu’à ', T('gmax'), ', avec des paliers de ', T('dt'), ', puis on le redescend. À γ̇ = ', T('g'), ', la viscosité vaut ', T('a'), ' à la montée et ', T('r'), ' à la descente. '];
      const raisons = { g: 'Le gradient est le même pour les deux viscosités comparées : il ne sert pas dans le calcul.', gmax: 'Le gradient maximal ne sert pas : on compare deux viscosités au même gradient.', dt: 'La durée des paliers ne figure pas dans le calcul de l’écart.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la perte relative de viscosité, en pourcentage de la valeur à la montée ?'], utiles: ['a', 'r'], raisons,
        cherche: { bonne: 'La perte relative de viscosité entre montée et descente', faux: ['Le temps de reconstruction de la structure', 'Le rapport des gradients maximal et minimal', 'La viscosité moyenne de la peinture'] },
        manque: null, solution: { txt: 'La perte relative est (η montée − η descente) / η montée', val: ((p.a - p.r) / p.a) * 100, u: '%' } };
      return { tokens, derivees: [], texte: [...debut, 'De combien la viscosité a-t-elle diminué entre la montée et la descente ?'], utiles: ['a', 'r'], raisons,
        cherche: { bonne: 'L’écart de viscosité entre montée et descente', faux: ['La somme des viscosités mesurées', 'Le gradient pour lequel la viscosité s’annule', 'La durée totale de la mesure'] },
        manque: null, solution: { txt: 'L’écart est la différence entre les deux viscosités : η montée − η descente', val: p.a - p.r, u: 'mPa·s' } };
    }),
  },
];
