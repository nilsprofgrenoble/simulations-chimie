// Exercices ANA, VAL et S'APP de la simulation 233 « Chaîne énergétique et rendement d'un convertisseur ». Préfixe : cha-.
// Capacités visées (jamais affichées) : schématiser une chaîne énergétique (réservoirs, convertisseurs) ; exploiter le principe de conservation de l'énergie pour réaliser un bilan énergétique, estimer l'énergie dissipée et calculer un rendement ; associer une dissipation d'énergie à un transfert thermique.
const DOM = 'Chaîne énergétique, conservation de l’énergie et rendement';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const CHA_ANA = [
  { id: 'cha-ana-rendement', domaine: DOM, titre: 'Un meilleur rendement pour la même énergie reçue',
    enonce: 'Un convertisseur reçoit toujours la même énergie. On le remplace par un modèle plus performant dont le rendement passe de 60 % à 80 %.', q: 'Que devient l’énergie dissipée par transfert thermique ?', options: [
      V('elle diminue, car une plus grande part de l’énergie reçue devient utile', 'Reçue = utile + dissipée : si la part utile passe de 60 % à 80 %, la part dissipée passe de 40 % à 20 %.'),
      F('elle augmente, car un meilleur rendement veut dire que le convertisseur travaille davantage', 'Un meilleur rendement signifie moins de pertes : à énergie reçue égale, la part dissipée diminue.'),
      F('elle ne change pas, car l’énergie reçue est la même', 'L’énergie reçue est la même, mais elle se répartit autrement : plus d’énergie utile, donc moins d’énergie dissipée.'),
      F('elle devient nulle, car le rendement dépasse 50 %', 'Un rendement de 80 % laisse encore 20 % de l’énergie reçue dissipée par transfert thermique.'),
    ] },
  { id: 'cha-ana-amont', domaine: DOM, titre: 'Soulever la même charge avec un moteur moins performant',
    enonce: 'Pour soulever une charge, on doit fournir une énergie utile donnée. On remplace un moteur de rendement 80 % par un moteur de rendement 40 %, pour soulever la même charge de la même hauteur.', q: 'Que devient l’énergie qu’il faut fournir au moteur ?', options: [
      V('elle est multipliée par 2, car l’énergie reçue vaut Eu ÷ η, avec η divisé par 2', 'Er = Eu ÷ η : si η est divisé par 2 et que Eu est la même, Er est multipliée par 2.'),
      F('elle est divisée par 2, car le moteur moins performant a besoin de moins d’énergie', 'Plus le rendement est faible, plus il faut fournir d’énergie pour la même énergie utile : Er = Eu ÷ η est multipliée par 2.'),
      F('elle ne change pas, car l’énergie utile reste la même dans les deux cas', 'L’énergie utile est la même, mais il faut fournir plus d’énergie pour compenser les pertes : Er est multipliée par 2.'),
      F('elle est multipliée par 4, car le rendement passe de 80 à 40 en deux étapes', 'Le rendement est divisé par 2 (80 % → 40 %), donc l’énergie à fournir est multipliée par 2, pas par 4.'),
    ] },
  { id: 'cha-ana-serie', domaine: DOM, titre: 'Ajouter un convertisseur à une chaîne',
    enonce: 'Une chaîne énergétique contient un convertisseur de rendement 90 %. On place derrière lui un second convertisseur, de rendement 95 %.', q: 'Que peut-on dire du rendement de l’ensemble ?', options: [
      V('il est inférieur à 90 %, car il vaut 0,90 × 0,95', 'Le rendement d’une chaîne est le produit des rendements : 0,90 × 0,95 = 0,855, soit 85,5 %, inférieur à chacun des deux.'),
      F('il est supérieur à 95 %, car le second convertisseur améliore la chaîne', 'Un convertisseur de rendement inférieur à 100 % ajoute des pertes : le rendement global ne peut pas augmenter.'),
      F('il vaut 92,5 %, la moyenne des deux rendements', 'Les rendements se multiplient, ils ne se moyennent pas : 0,90 × 0,95 = 0,855.'),
      F('il reste égal à 90 %, car le second convertisseur est très performant', 'Même un convertisseur très performant (95 %) perd 5 % de l’énergie qu’il reçoit : le rendement global baisse.'),
    ] },
  { id: 'cha-ana-reservoir', domaine: DOM, titre: 'Un moteur qui tourne depuis longtemps',
    enonce: 'Un moteur de treuil fonctionne depuis longtemps, à régime constant : il reçoit de l’énergie électrique et cède du travail mécanique et un transfert thermique.', q: 'Que peut-on dire de l’énergie stockée par ce moteur ?', options: [
      V('elle ne varie pas : c’est un convertisseur, il cède autant qu’il reçoit', 'Un convertisseur ne stocke pas d’énergie : la somme des énergies qu’il reçoit est égale à la somme de celles qu’il cède.'),
      F('elle augmente au fil du temps, car il reçoit de l’énergie électrique en continu', 'Il cède aussi de l’énergie (travail utile et chaleur) : à régime constant, il cède autant qu’il reçoit.'),
      F('elle diminue au fil du temps, car il cède de la chaleur et du travail en continu', 'Il en reçoit aussi : reçu et cédé se compensent, l’énergie stockée ne varie pas.'),
      F('elle varie, mais seulement pendant la phase où le moteur chauffe', 'À régime constant, le moteur ne s’échauffe plus davantage : son énergie stockée est constante, et il cède sa chaleur à l’air.'),
    ] },
];

export const CHA_VAL = [
  P({ id: 'cha-val-rendement', domaine: DOM, niveau: 1, titre: 'Bilan d’un moteur : 350 J reçus', plausible: true,
    enonce: 'Un moteur reçoit 350 J d’énergie électrique et cède 280 J de travail mécanique utile. Un élève trouve une énergie dissipée de 70 J et un rendement de 80 %.',
    reperes: [['Énergie reçue', '350 J'], ['Énergie utile', '280 J'], ['Dissipée = reçue − utile', '350 − 280 = 70 J'], ['η = utile ÷ reçue', '280 ÷ 350 = 0,80']],
    ver: 'Q = 350 − 280 = 70 J et η = 280 ÷ 350 = 0,80, soit 80 %. Les valeurs de l’élève sont cohérentes : elles sont plausibles.',
    q2: 'Avec le même rendement, quelle énergie faut-il fournir pour obtenir 560 J d’énergie utile ?',
    options: [
      V('700 J, car l’énergie reçue vaut 560 divisé par 0,80', 'Er = Eu ÷ η = 560 ÷ 0,80 = 700 J : il faut fournir plus que l’énergie utile.'),
      F('448 J, car il faut multiplier l’énergie utile par le rendement', 'Multiplier par η donne une énergie plus petite que l’énergie utile, ce qui est impossible : il faut diviser.'),
      F('560 J, car c’est l’énergie qu’on veut obtenir', 'Il faut fournir plus que 560 J : une partie de l’énergie reçue est dissipée (Er = Eu ÷ η).'),
    ] }),
  P({ id: 'cha-val-serie', domaine: DOM, niveau: 2, titre: 'Un chargeur et un moteur en série', plausible: false,
    enonce: 'Un chargeur de rendement 80 % alimente un moteur de rendement 70 %. Un élève affirme que le rendement de l’ensemble vaut 75 %, « la moyenne des deux ».',
    reperes: [['Rendement', 'rapport de l’énergie utile à l’énergie reçue : toujours inférieur ou égal à 1'], ['Chaîne en série', 'l’énergie utile du premier appareil est l’énergie reçue du second']],
    ver: 'Les rendements se multiplient : 0,80 × 0,70 = 0,56, soit 56 %. L’élève ne peut pas trouver 75 %, supérieur au plus petit des deux rendements : sa valeur n’est pas plausible.',
    q2: 'Quelle est la cause de l’erreur ?',
    options: [
      V('il a fait la moyenne des deux rendements au lieu de les multiplier', 'Pour des convertisseurs en série, le rendement global est le produit des rendements.'),
      F('il a oublié que le rendement d’un moteur est toujours supérieur à celui d’un chargeur', 'Aucune règle de ce genre : le rendement dépend de chaque appareil.'),
      F('il a additionné les pertes au lieu des rendements', 'Additionner les rendements donnerait 150 % ; la moyenne de 75 % ne vient pas d’une addition de pertes.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, '\u00a0');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
export const CHA_SAPP = [
  {
    id: 'cha-sapp-rendement', domaine: DOM, titre: 'Rendement et énergie dissipée d’un moteur', noms: ['Rendement', 'Énergie dissipée'],
    gen: () => { const Pr = tire([60, 80, 120, 200]), eta = tire([0.4, 0.5, 0.6, 0.75, 0.8]); return { Pr, Pu: Pr * eta, dt: tire([2, 5, 10]), m: tire([5, 10, 20]) }; },
    build: epure((p, q) => {
      const tokens = {
        Pr: tok(`${p.Pr} W`, 'Puissance électrique reçue par le moteur', p.Pr, 'W'),
        Pu: tok(`${String(p.Pu).replace('.', ',')} W`, 'Puissance mécanique utile cédée par le moteur', p.Pu, 'W'),
        dt: tok(`${p.dt} min`, 'Durée de fonctionnement', p.dt, 'min'),
        m: tok(`${p.m} kg`, 'Masse de la charge soulevée', p.m, 'kg'),
      };
      const debut = ['Un moteur de treuil soulève une charge de masse ', T('m'), '. Il reçoit une puissance électrique ', T('Pr'), ' et cède une puissance mécanique utile ', T('Pu'), '. '];
      if (q === 0) return { tokens, derivees: ['η = puissance utile ÷ puissance reçue'], texte: [...debut, 'Quel est son rendement, en pourcentage ?'], utiles: ['Pu', 'Pr'],
        raisons: { m: 'La masse de la charge ne sert pas dans ce calcul.' },
        cherche: { bonne: 'Le rendement du moteur (en %)', faux: ['La puissance dissipée (en W)', 'L’énergie reçue par le moteur (en kJ)', 'L’énergie utile (en kJ)'] },
        manque: null, solution: { txt: 'η = Pu ÷ Pr', val: 100 * p.Pu / p.Pr, u: '%' } };
      return { tokens: { ...tokens, dt: tokens.dt }, derivees: ['puissance dissipée = Pr − Pu', 'durée en s = durée en min × 60', 'Q = puissance dissipée × Δt'], texte: [...debut, 'Le moteur fonctionne pendant ', T('dt'), '. Quelle énergie dissipe-t-il par transfert thermique, en kilojoules ?'], utiles: ['Pr', 'Pu', 'dt'],
        raisons: { m: 'La masse de la charge ne sert pas dans ce calcul.' },
        cherche: { bonne: 'L’énergie dissipée (en kJ)', faux: ['Le rendement du moteur (en %)', 'L’énergie utile (en kJ)', 'La puissance dissipée (en W)'] },
        manque: null, solution: { txt: 'Q = (Pr − Pu) × Δt, avec Δt en s', val: (p.Pr - p.Pu) * p.dt * 60 / 1000, u: 'kJ' } };
    }),
  },
  {
    id: 'cha-sapp-amont', domaine: DOM, titre: 'Énergie à fournir pour obtenir une énergie utile', noms: ['Un convertisseur', 'Deux convertisseurs en série'],
    gen: () => ({ Eu: tire([50, 100, 200]), eta1: tire([0.8, 0.9]), eta2: tire([0.5, 0.6, 0.75]), dt: tire([5, 10, 20]) }),
    build: epure((p, q) => {
      const pc = x => `${Math.round(100 * x)} %`;
      const tokens = {
        Eu: tok(`${p.Eu} kJ`, 'Énergie utile à obtenir', p.Eu, 'kJ'),
        eta1: tok(pc(p.eta1), 'Rendement du premier convertisseur (chargeur)', 100 * p.eta1, '%'),
        eta2: tok(pc(p.eta2), 'Rendement du second convertisseur (moteur)', 100 * p.eta2, '%'),
        dt: tok(`${p.dt} min`, 'Durée de l’opération', p.dt, 'min'),
      };
      if (q === 0) return { tokens, derivees: ['énergie reçue = énergie utile ÷ rendement'], texte: ['Un chargeur de rendement ', T('eta1'), ' doit stocker ', T('Eu'), ' dans une batterie, en ', T('dt'), '. Quelle énergie électrique doit-il recevoir, en kilojoules ?'], utiles: ['Eu', 'eta1'],
        raisons: { dt: 'La durée ne sert pas : il s’agit d’une énergie, pas d’une puissance.' },
        cherche: { bonne: 'L’énergie reçue par le chargeur (en kJ)', faux: ['L’énergie dissipée par le chargeur (en kJ)', 'La puissance reçue par le chargeur (en W)', 'Le rendement du chargeur (en %)'] },
        manque: null, solution: { txt: 'Er = Eu ÷ η', val: p.Eu / p.eta1, u: 'kJ' } };
      return { tokens, derivees: ['rendement global = η₁ × η₂', 'énergie reçue = énergie utile ÷ rendement global'], texte: ['Un chargeur de rendement ', T('eta1'), ' alimente un moteur de rendement ', T('eta2'), '. On veut obtenir ', T('Eu'), ' d’énergie mécanique utile en ', T('dt'), '. Quelle énergie électrique doit recevoir le chargeur, en kilojoules ?'], utiles: ['Eu', 'eta1', 'eta2'],
        raisons: { dt: 'La durée ne sert pas : il s’agit d’une énergie, pas d’une puissance.' },
        cherche: { bonne: 'L’énergie reçue par le chargeur (en kJ)', faux: ['L’énergie dissipée au total (en kJ)', 'Le rendement global de la chaîne (en %)', 'La puissance reçue par le chargeur (en W)'] },
        manque: null, solution: { txt: 'Er = Eu ÷ (η₁ × η₂)', val: p.Eu / (p.eta1 * p.eta2), u: 'kJ' } };
    }),
  },
];
