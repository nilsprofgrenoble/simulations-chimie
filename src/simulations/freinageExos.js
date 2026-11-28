// Exercices ANA, VAL et S'APP de la simulation 260 « Distance de freinage : énergie cinétique et travail de la force de freinage ». Préfixe : dfr-.
// Capacités visées (jamais affichées) : théorème de l'énergie cinétique ; travail d'une force constante ; distance d'arrêt ∝ v², ∝ m, ∝ 1/F ; conversion km/h → m/s ; effet d'une pente.
const DOM = 'Distance de freinage : énergie cinétique et travail de la force de freinage';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const DFR_ANA = [
  { id: 'dfr-ana-vitesse', domaine: DOM, titre: 'Deux voitures, deux vitesses',
    enonce: 'Deux voitures identiques, aux freins identiques, roulent sur la même route horizontale : la première à 50 km/h, la seconde à 100 km/h. Chacune freine jusqu’à l’arrêt avec la même force de freinage constante.', q: 'Comment se comparent leurs distances d’arrêt ?', options: [
      V('la distance de la seconde est 4 fois plus grande', 'Théorème de l’énergie cinétique : d = ½ m v² ÷ F. La distance est proportionnelle au carré de la vitesse : doubler la vitesse multiplie d par 4.'),
      F('celle de la seconde est 2 fois plus grande', 'Ce serait vrai si la distance était proportionnelle à la vitesse ; or c’est le carré de la vitesse qui intervient.'),
      F('elles sont égales : seules les freins déterminent la distance', 'La force est la même, mais l’énergie cinétique à dissiper dépend de la vitesse.'),
      F('celle de la seconde est 8 fois plus grande', 'L’énergie cinétique est proportionnelle à v², pas à v³.'),
    ] },
  { id: 'dfr-ana-masse', domaine: DOM, titre: 'Distance d’arrêt d’un camion chargé',
    enonce: 'Un camion a une masse 4 fois plus grande qu’une voiture. Les deux roulent à la même vitesse sur une route horizontale et freinent avec la même force de freinage constante.', q: 'Comment se compare la distance d’arrêt du camion à celle de la voiture ?', options: [
      V('elle est 4 fois plus grande : 4 fois plus d’énergie à dissiper', 'd = ½ m v² ÷ F : à v et F fixés, d est proportionnelle à la masse.'),
      F('elle est 2 fois plus grande, car la masse intervient en racine carrée', 'Aucune racine carrée n’intervient : d est proportionnelle à m.'),
      F('elle est égale, car la vitesse et la force sont les mêmes', 'Les deux véhicules n’ont pas la même énergie cinétique : le plus lourd en a 4 fois plus.'),
      F('elle est 16 fois plus grande, car la masse intervient au carré', 'La masse n’est pas au carré dans Ec = ½ m v² : c’est la vitesse.'),
    ] },
  { id: 'dfr-ana-travail', domaine: DOM, titre: 'Les travaux pendant un freinage',
    enonce: 'Une voiture freine jusqu’à l’arrêt sur une route droite et horizontale. Elle est soumise à son poids, à la réaction normale de la route et à la force de freinage, opposée au déplacement.', q: 'Quelle proposition donne correctement les travaux de ces forces ?', options: [
      V('poids : nul ; réaction normale : nulle ; force de freinage : résistante (négatif)', 'Le poids et la réaction normale sont perpendiculaires au déplacement horizontal : leur travail est nul. La force de freinage est opposée au déplacement : son travail est négatif.'),
      F('poids : moteur ; réaction normale : nulle ; force de freinage : résistant', 'Le poids est vertical, perpendiculaire à la route horizontale : son travail est nul.'),
      F('poids : nul ; réaction normale : résistant ; force de freinage : résistant', 'La réaction normale est perpendiculaire à la route : son travail est nul.'),
      F('poids : nul ; réaction normale : nulle ; force de freinage : nul, car la voiture finit immobile', 'Le travail se calcule sur tout le déplacement : F est opposée au déplacement pendant tout le freinage.'),
    ] },
  { id: 'dfr-ana-pente', schema: { type: 'deuxReliefs' }, domaine: DOM, titre: 'Freiner dans une montée',
    enonce: 'Une voiture roule à vitesse donnée et freine avec une force de freinage constante, d’abord sur une route horizontale, puis dans une montée, sur la même vitesse et avec la même force.', q: 'Comment se compare la distance d’arrêt dans la montée à celle sur route horizontale ?', options: [
      V('plus petite : le poids s’oppose au mouvement et aide à freiner', 'Dans une montée, le travail du poids est résistant : il s’ajoute à celui de la force de freinage. L’énergie cinétique s’épuise sur une distance plus courte.'),
      F('elle est plus grande : la route inclinée augmente la distance', 'L’inclinaison, en montée, ajoute un travail résistant du poids : elle raccourcit la distance.'),
      F('elle est identique : le poids est perpendiculaire à la route', 'Sur une route inclinée, le poids n’est plus perpendiculaire au déplacement : il a une composante le long de la route.'),
      F('elle est plus grande car le moteur doit lutter contre la pente', 'On suppose qu’il n’y a pas de force motrice pendant le freinage.'),
    ] },
];

export const DFR_VAL = [
  P({ id: 'dfr-val-conv', domaine: DOM, niveau: 1, titre: 'Une distance d’arrêt calculée en km/h', plausible: false,
    enonce: 'Un élève calcule : « Une voiture de 1 000 kg roule à 90 km/h et freine avec une force constante de 8 000 N. d = ½ × m × v² ÷ F = ½ × 1 000 × 90² ÷ 8 000 ≈ 506 m. »',
    reperes: [['Masse', '1 000 kg'], ['Vitesse', '90 km/h'], ['Force de freinage', '8 000 N'], ['Ordre de grandeur', 'un freinage à 90 km/h demande quelques dizaines de mètres']],
    ver: 'La vitesse doit être convertie en m/s : 90 km/h = 25 m/s. Alors d = ½ × 1 000 × 25² ÷ 8 000 ≈ 39 m. Une distance de 506 m n’est pas plausible pour une voiture.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il n’a pas converti la vitesse de km/h en m/s dans son calcul', 'v = 90 ÷ 3,6 = 25 m/s ; avec la valeur en km/h le résultat est environ 13 fois trop grand.'),
      F('il a oublié que la distance est proportionnelle à la masse', 'La masse apparaît bien dans son calcul.'),
      F('il a utilisé la mauvaise formule : il fallait v au lieu de v²', 'La formule d = ½ m v² ÷ F est la bonne : l’erreur porte sur l’unité de v.'),
    ] }),
  P({ id: 'dfr-val-cycliste', domaine: DOM, niveau: 2, titre: 'Un cycliste qui freine', plausible: true,
    enonce: 'Un élève calcule : « Un cycliste et son vélo ont une masse de 90 kg et roulent à 18 km/h. Ils freinent avec une force constante de 300 N : d = ½ × 90 × 5² ÷ 300 ≈ 3,8 m. »',
    reperes: [['Masse', '90 kg'], ['Vitesse', '18 km/h = 5,0 m/s'], ['Force de freinage', '300 N'], ['Ordre de grandeur', 'un cycliste s’arrête en quelques mètres à 18 km/h']],
    ver: 'La vitesse a été convertie (18 ÷ 3,6 = 5,0 m/s) : Ec = ½ × 90 × 5² ≈ 1 125 J, d = 1 125 ÷ 300 ≈ 3,8 m. Le résultat est de l’ordre de grandeur attendu : l’élève a raison.',
    q2: 'Que deviendrait la distance si le cycliste roulait à 36 km/h, avec la même force ?',
    options: [
      V('environ 15 m : la distance est 4 fois plus grande', 'La vitesse double : la distance est multipliée par 4.'),
      F('environ 7,5 m, soit 2 fois plus', 'La distance est proportionnelle au carré de la vitesse, pas à la vitesse.'),
      F('environ 3,8 m : la distance ne dépend pas de la vitesse', 'L’énergie cinétique à dissiper augmente avec la vitesse.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const sep = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const DFR_SAPP = [
  {
    id: 'dfr-sapp-arret', domaine: DOM, titre: 'Voiture qui freine : énergie cinétique et distance d’arrêt', noms: ['Énergie cinétique de la voiture avant le freinage', 'Distance d’arrêt de la voiture'],
    gen: () => ({ m: tire([800, 1000, 1200, 1500]), v: tire([36, 54, 72, 90]), F: tire([5000, 6000, 8000]), L: tire([3.8, 4.2, 4.6]) }),
    build: epure((p, q) => {
      const v = p.v / 3.6, Ec = 0.5 * p.m * v * v;
      const tokens = {
        m: tok(`${sep(p.m)} kg`, 'Masse de la voiture', p.m, 'kg'),
        v: tok(`${p.v} km/h`, 'Vitesse de la voiture au début du freinage', p.v, 'km/h'),
        F: tok(`${sep(p.F)} N`, 'Valeur de la force de freinage', p.F, 'N'),
        L: tok(`${String(p.L).replace('.', ',')} m`, 'Longueur de la voiture', p.L, 'm'),
      };
      const debut = ['Une voiture de masse ', T('m'), ' et de longueur ', T('L'), ' roule à la vitesse ', T('v'), ' sur une route droite et horizontale. Elle freine jusqu’à l’arrêt avec une force de freinage constante de valeur ', T('F'), '. '];
      if (q === 0) return { tokens, derivees: ['v (en m/s) = v (en km/h) ÷ 3,6', 'Ec = ½ × m × v²'], texte: [...debut, 'Quelle est l’énergie cinétique de la voiture avant le freinage, en joules ?'], utiles: ['m', 'v'],
        raisons: { F: 'La force de freinage ne sert pas pour une énergie cinétique.', L: 'La longueur de la voiture ne joue aucun rôle ici.' },
        cherche: { bonne: 'L’énergie cinétique de la voiture avant le freinage (en J)', faux: ['Le travail de la force de freinage (en J)', 'La distance parcourue pendant le freinage (en m)', 'La durée du freinage (en s)'] },
        manque: null, solution: { txt: 'Ec = ½ × m × v² avec v en m/s', val: Ec, u: 'J' } };
      return { tokens, derivees: ['v (en m/s) = v (en km/h) ÷ 3,6', 'ΔEc = somme des travaux : 0 − Ec = − F × d', 'd = Ec ÷ F'], texte: [...debut, 'Quelle est la distance d’arrêt, en mètres ?'], utiles: ['m', 'v', 'F'],
        raisons: { L: 'La longueur de la voiture ne joue aucun rôle dans la distance d’arrêt.' },
        cherche: { bonne: 'La distance d’arrêt de la voiture (en m)', faux: ['La durée du freinage (en s)', 'L’énergie dissipée par les freins (en J)', 'La vitesse de la voiture à mi-distance (en m/s)'] },
        manque: null, solution: { txt: 'd = ½ × m × v² ÷ F', val: Ec / p.F, u: 'm' } };
    }),
  },
  {
    id: 'dfr-sapp-force', domaine: DOM, titre: 'S’arrêter avant l’obstacle : force de freinage nécessaire', noms: ['Énergie cinétique à dissiper', 'Force de freinage minimale'],
    gen: () => ({ m: tire([800, 1000, 1200]), v: tire([10, 15, 20, 25]), D: tire([20, 30, 40, 50]), tr: tire([0.8, 1.0, 1.2]) }),
    build: epure((p, q) => {
      const Ec = 0.5 * p.m * p.v * p.v;
      const tokens = {
        m: tok(`${sep(p.m)} kg`, 'Masse du véhicule', p.m, 'kg'),
        v: tok(`${p.v} m/s`, 'Vitesse du véhicule au début du freinage', p.v, 'm/s'),
        D: tok(`${p.D} m`, 'Distance disponible pour s’arrêter', p.D, 'm'),
        tr: tok(`${String(p.tr).replace('.', ',')} s`, 'Temps de réaction du conducteur', p.tr, 's'),
      };
      const debut = ['Un véhicule de masse ', T('m'), ' roule à la vitesse ', T('v'), ' sur une route droite et horizontale. Le conducteur a un temps de réaction de ', T('tr'), '. Au moment où il commence à freiner, un obstacle est à ', T('D'), ' devant lui. '];
      if (q === 0) return { tokens, derivees: ['Ec = ½ × m × v²'], texte: [...debut, 'Quelle énergie cinétique les freins doivent-ils dissiper pour arrêter le véhicule, en joules ?'], utiles: ['m', 'v'],
        raisons: { D: 'La distance disponible ne sert pas pour calculer l’énergie cinétique.', tr: 'Le temps de réaction concerne l’avant-freinage : il ne change pas l’énergie à dissiper.' },
        cherche: { bonne: 'L’énergie cinétique à dissiper (en J)', faux: ['La distance d’arrêt avec une force donnée (en m)', 'Le travail du poids pendant le freinage (en J)', 'La durée du freinage (en s)'] },
        manque: null, solution: { txt: 'Ec = ½ × m × v²', val: Ec, u: 'J' } };
      return { tokens, derivees: ['ΔEc = somme des travaux : 0 − Ec = − F × D', 'F = Ec ÷ D'], texte: [...debut, 'Quelle force de freinage minimale permet de s’arrêter juste avant l’obstacle, en newtons ?'], utiles: ['m', 'v', 'D'],
        raisons: { tr: 'Le temps de réaction est déjà écoulé au début du freinage : il ne change pas la force nécessaire.' },
        cherche: { bonne: 'La force de freinage minimale (en N)', faux: ['L’énergie cinétique du véhicule (en J)', 'La durée du freinage (en s)', 'La puissance développée par les freins (en W)'] },
        manque: null, solution: { txt: 'F = ½ × m × v² ÷ D', val: Ec / p.D, u: 'N' } };
    }),
  },
];
