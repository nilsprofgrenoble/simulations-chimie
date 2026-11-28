// Exercices ANA, VAL et S'APP de la simulation 250 « Travail du poids : moteur, résistant ou nul selon le trajet ». Préfixe : pdt-.
// Capacités visées (jamais affichées) : signe du travail du poids selon le trajet ; travail nul d'une force perpendiculaire à la trajectoire ; indépendance du trajet ; travail du frottement ; théorème de l'énergie cinétique.
const DOM = 'Travail du poids : moteur, résistant ou nul selon le trajet';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const PDT_ANA = [
  { id: 'pdt-ana-monte', domaine: DOM, titre: 'Une bille qui monte une rampe',
    enonce: 'Une bille est lancée vers le haut d’une rampe lisse. Elle monte de 0,5 m puis s’arrête un instant. Les frottements sont négligeables.', q: 'Pendant la montée, que valent le signe du travail du poids et l’évolution de l’énergie cinétique ?', options: [
      V('travail résistant ; l’énergie cinétique diminue', 'La bille gagne de l’altitude : le poids s’oppose au déplacement, son travail est résistant (négatif). Comme ΔEc = somme des travaux, l’énergie cinétique diminue jusqu’à s’annuler.'),
      F('travail moteur ; l’énergie cinétique augmente', 'Le travail du poids n’est moteur que si le système perd de l’altitude.'),
      F('travail résistant ; l’énergie cinétique augmente', 'Un travail résistant fait diminuer l’énergie cinétique : ΔEc = somme des travaux.'),
      F('travail nul ; l’énergie cinétique reste constante', 'Le travail du poids est nul seulement si l’altitude ne varie pas : ici la bille monte de 0,5 m.'),
    ] },
  { id: 'pdt-ana-boucle', domaine: DOM, titre: 'Un chariot qui revient à son point de départ',
    enonce: 'Un chariot parcourt un rail comportant une descente puis une montée, et revient exactement à son point de départ. On néglige tout frottement.', q: 'Que vaut le travail du poids sur ce trajet complet ?', options: [
      V('nul : l’altitude finale est égale à l’altitude initiale', 'Le travail du poids ne dépend que de la variation d’altitude. Départ et arrivée étant à la même altitude, il est nul : ce qu’il fournit à la descente, il le reprend à la montée.'),
      F('moteur : le chariot a davantage descendu que monté', 'Il revient à sa position de départ : il a monté exactement autant qu’il a descendu.'),
      F('résistant : la fin du trajet est une montée', 'Le signe se juge sur le trajet complet, pas sur la dernière portion.'),
      F('égal au travail de la descente seule, comme la montée est incluse', 'La montée donne un travail opposé à celui de la descente : leur somme est nulle.'),
    ] },
  { id: 'pdt-ana-cercle', domaine: DOM, titre: 'Une balle qui tourne au bout d’une ficelle',
    enonce: 'Une balle est attachée à une ficelle et décrit un cercle horizontal à vitesse constante. On étudie la tension de la ficelle, dirigée vers le centre du cercle.', q: 'Que peut-on dire du travail de la tension de la ficelle ?', options: [
      V('il est nul : la tension est perpendiculaire à la trajectoire', 'À chaque instant la tension est perpendiculaire au déplacement élémentaire : son produit scalaire avec lui est nul, donc son travail aussi. Cela correspond bien à une vitesse constante.'),
      F('il est moteur : la tension entretient le mouvement de la balle', 'Une force perpendiculaire à la trajectoire ne peut ni accélérer ni freiner la balle.'),
      F('il est résistant : la ficelle retient la balle', 'Retenir la balle sur un cercle ne retire pas d’énergie cinétique : la vitesse reste constante.'),
      F('il est moteur, car la tension agit sur toute la durée du mouvement', 'La durée d’action ne change rien : ce qui compte est l’angle entre la force et le déplacement.'),
    ] },
  { id: 'pdt-ana-frott', domaine: DOM, titre: 'Un traîneau tiré aller-retour',
    enonce: 'Un traîneau glisse sur la neige et subit un frottement de valeur constante. Il fait un aller jusqu’à un piquet, puis revient au point de départ.', q: 'Que peut-on dire du travail de la force de frottement sur l’aller-retour ?', options: [
      V('il est résistant : il s’oppose au mouvement à l’aller comme au retour', 'Le frottement a toujours un sens opposé au mouvement : son travail est négatif sur chaque portion, et ces travaux s’ajoutent. Il ne s’annule pas sur un aller-retour, contrairement à celui du poids.'),
      F('il est nul : le traîneau revient à son point de départ', 'Ce raisonnement vaut pour le poids, dont le travail dépend de l’altitude. Le frottement dépend de la distance parcourue.'),
      F('il est moteur au retour, car le sens du mouvement s’inverse', 'Le frottement s’inverse aussi avec le mouvement : il reste opposé au déplacement, donc résistant.'),
      F('il est résistant à l’aller et moteur au retour : les deux se compensent', 'Il n’y a jamais de compensation : un frottement ne peut que retirer de l’énergie au système.'),
    ] },
];

export const PDT_VAL = [
  P({ id: 'pdt-val-signe', domaine: DOM, niveau: 1, titre: 'Un livre qui tombe d’une étagère', plausible: false,
    enonce: 'Un élève calcule : « Un livre de 0,50 kg tombe d’une étagère située à 1,5 m du sol. Le travail de son poids vaut W(P) = −7,4 J. »',
    reperes: [['Masse', '0,50 kg'], ['Altitude de départ', '1,5 m (par rapport au sol)'], ['Altitude d’arrivée', '0 m'], ['g', '9,8 N/kg']],
    ver: 'Le livre descend : son poids est dans le sens du déplacement, son travail est moteur donc positif. La valeur absolue est correcte (0,50 × 9,8 × 1,5 ≈ 7,4 J) mais le signe est faux : W(P) = +7,4 J. L’affirmation n’est pas plausible.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a mis un signe négatif alors que le livre perd de l’altitude', 'W(P) = m g (z départ − z arrivée) est positif quand le système descend.'),
      F('il a pris la mauvaise formule : il fallait multiplier par ½', 'Le facteur ½ concerne l’énergie cinétique, pas le travail du poids.'),
      F('il a oublié que le travail du poids dépend de la durée de la chute', 'Le travail du poids ne dépend que de la variation d’altitude.'),
    ] }),
  P({ id: 'pdt-val-chemin', domaine: DOM, niveau: 2, titre: 'Deux chemins entre les mêmes points', plausible: true,
    enonce: 'Un élève affirme : « Un chariot passe d’un point A à un point B situé 0,80 m plus bas, soit en suivant un rail direct, soit en suivant un rail plus long qui fait un détour. Le travail de son poids est le même dans les deux cas. »',
    reperes: [['Départ', 'A'], ['Arrivée', 'B, 0,80 m plus bas'], ['Rail direct', 'court'], ['Rail avec détour', 'plus long']],
    ver: 'Le travail du poids ne dépend que de l’altitude de départ et de celle d’arrivée, pas de la forme ni de la longueur du chemin. Dans les deux cas il vaut m × g × 0,80. L’élève a raison.',
    q2: 'Que vaudrait le travail du poids si le chariot revenait ensuite en A ?',
    options: [
      V('zéro, car l’altitude finale serait égale à l’altitude initiale', 'Sur un trajet fermé, le travail du poids est nul.'),
      F('le double, car le chariot parcourt deux fois la distance', 'Le travail du poids ne dépend pas de la distance parcourue.'),
      F('l’opposé du travail de l’aller, c’est-à-dire une valeur négative', 'Le travail du retour est opposé à celui de l’aller, mais leur somme est nulle, et c’est cette somme que donne la question.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const G = 9.8;
const fmtZ = z => String(z).replace('.', ',');
export const PDT_SAPP = [
  {
    id: 'pdt-sapp-descente', domaine: DOM, titre: 'Chariot sur un rail : travail du poids et vitesse atteinte', noms: ['Travail du poids du chariot', 'Vitesse du chariot en bas du rail'],
    gen: () => { let zA, zB; do { zA = tire([0.8, 1.0, 1.2, 1.5, 2.0]); zB = tire([0, 0.2, 0.3, 0.4]); } while (zA - zB < 0.5); return { m: tire([1, 2, 3, 4]), zA, zB, L: tire([3, 4, 5, 6]) }; },
    build: epure((p, q) => {
      const W = p.m * G * (p.zA - p.zB);
      const tokens = {
        m: tok(`${p.m} kg`, 'Masse du chariot', p.m, 'kg'),
        zA: tok(`${fmtZ(p.zA)} m`, 'Altitude du point de départ', p.zA, 'm'),
        zB: tok(`${fmtZ(p.zB)} m`, 'Altitude du point d’arrivée', p.zB, 'm'),
        L: tok(`${p.L} m`, 'Longueur du rail entre les deux points', p.L, 'm'),
        g: tok('9,8 N/kg', 'Valeur du champ de pesanteur', G, 'N/kg'),
      };
      const debut = ['Un chariot de masse ', T('m'), ' part sans vitesse d’un point situé à l’altitude ', T('zA'), ' et descend le long d’un rail jusqu’à un point d’altitude ', T('zB'), '. Le rail est long de ', T('L'), '. On néglige tout frottement ; g = ', T('g'), '. '];
      if (q === 0) return { tokens, derivees: ['W(P) = m × g × (z départ − z arrivée)'], texte: [...debut, 'Quel est le travail du poids du chariot sur ce trajet, en joules ?'], utiles: ['m', 'zA', 'zB', 'g'],
        raisons: { L: 'La longueur du rail ne sert pas : le travail du poids ne dépend que des altitudes de départ et d’arrivée.' },
        cherche: { bonne: 'Le travail du poids du chariot (en J)', faux: ['La longueur de rail parcourue (en m)', 'La force exercée par le rail sur le chariot (en N)', 'L’altitude moyenne du chariot (en m)'] },
        manque: null, solution: { txt: 'W(P) = m × g × (zA − zB)', val: W, u: 'J' } };
      return { tokens, derivees: ['ΔEc = somme des travaux', 'Ec = ½ × m × v²', 'v = sqrt(2 × W ÷ m)'], texte: [...debut, 'Quelle est la vitesse du chariot en bas du rail, en m/s ?'], utiles: ['m', 'zA', 'zB', 'g'],
        raisons: { L: 'La longueur du rail ne sert pas : sans frottement, seul le travail du poids compte, et il ne dépend que des altitudes.' },
        cherche: { bonne: 'La vitesse du chariot en bas du rail (en m/s)', faux: ['L’énergie cinétique du chariot au départ (en J)', 'Le temps de descente du chariot (en s)', 'La force exercée par le rail sur le chariot (en N)'] },
        manque: null, solution: { txt: 'v = sqrt(2 × m × g × (zA − zB) ÷ m)', val: Math.sqrt(2 * W / p.m), u: 'm/s' } };
    }),
  },
  {
    id: 'pdt-sapp-frott', domaine: DOM, titre: 'Palet avec frottement : travail du frottement et vitesse au retour', noms: ['Travail de la force de frottement', 'Vitesse du palet à son retour'],
    gen: () => { let o; do { o = { m: tire([0.5, 1, 2]), v0: tire([3, 4, 5, 6]), f: tire([0.5, 1, 2]), L: tire([1, 2, 3]) }; } while (o.v0 * o.v0 - 4 * o.f * o.L / o.m < 4); return o; },
    build: epure((p, q) => {
      const Wf = -2 * p.f * p.L, v2 = p.v0 * p.v0 + 2 * Wf / p.m;
      const tokens = {
        m: tok(`${fmtZ(p.m)} kg`, 'Masse du palet', p.m, 'kg'),
        v0: tok(`${p.v0} m/s`, 'Vitesse de lancement', p.v0, 'm/s'),
        f: tok(`${fmtZ(p.f)} N`, 'Valeur de la force de frottement', p.f, 'N'),
        L: tok(`${p.L} m`, 'Distance du point de lancement au butoir', p.L, 'm'),
      };
      const debut = ['Un palet de masse ', T('m'), ' est lancé à la vitesse ', T('v0'), ' sur un rail horizontal. Il glisse jusqu’à un butoir situé à ', T('L'), ', rebondit sans perdre d’énergie et revient à son point de lancement. Un frottement de valeur constante ', T('f'), ' s’oppose à son mouvement. '];
      if (q === 0) return { tokens, derivees: ['W(f) = − f × distance parcourue', 'distance parcourue = aller + retour'], texte: [...debut, 'Quel est le travail de la force de frottement sur l’aller-retour, en joules ?'], utiles: ['f', 'L'],
        raisons: { m: 'La masse ne sert pas pour ce travail.', v0: 'La vitesse de lancement ne sert pas pour ce travail.' },
        cherche: { bonne: 'Le travail de la force de frottement sur l’aller-retour (en J, avec son signe)', faux: ['Le travail du poids sur l’aller-retour (en J)', 'La distance totale parcourue par le palet (en m)', 'L’énergie cinétique du palet au lancement (en J)'] },
        manque: null, solution: { txt: 'W(f) = − f × 2L', val: Wf, u: 'J' } };
      return { tokens, derivees: ['ΔEc = somme des travaux', 'Ec = ½ × m × v²', 'travail du poids sur l’aller-retour = 0'], texte: [...debut, 'Quelle est la vitesse du palet à son retour au point de lancement, en m/s ?'], utiles: ['m', 'v0', 'f', 'L'],
        raisons: {},
        cherche: { bonne: 'La vitesse du palet au retour au point de lancement (en m/s)', faux: ['La durée de l’aller-retour (en s)', 'L’énergie cinétique perdue par le palet (en J)', 'La vitesse du palet au butoir (en m/s)'] },
        manque: null, solution: { txt: '½ m v² = ½ m v0² + W(f)', val: Math.sqrt(v2), u: 'm/s' } };
    }),
  },
];
