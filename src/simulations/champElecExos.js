// Exercices ANA, VAL et S'APP de la simulation 267 « Champ et force électrostatiques entre deux armatures ». Préfixe : chel-.
// Capacités visées (jamais affichées) : champ uniforme entre deux armatures planes (sens, E = U/d), force F = q E (valeur, sens selon le signe de q).
const DOM = 'Champ et force électrostatiques';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const CEL_ANA = [
  { id: 'chel-ana-polarite', domaine: DOM, titre: 'On inverse le générateur',
    enonce: 'Deux armatures planes parallèles sont reliées à un générateur : l’armature de gauche est positive, celle de droite négative. On inverse les branchements du générateur (même tension) : la gauche devient négative, la droite positive.', q: 'Que devient le champ électrostatique entre les armatures ?', options: [
      V('même valeur, mais dirigé de la droite vers la gauche', 'Le champ va de l’armature + vers l’armature − ; la valeur U ÷ d est inchangée.'),
      F('nul, car les charges se compensent', 'Les armatures sont toujours chargées : le champ existe encore.'),
      F('de valeur opposée, donc négative, et toujours dirigé vers la droite', 'Une valeur de champ est positive ; c’est le sens qui s’inverse.'),
      F('inchangé : il est toujours dirigé de la gauche vers la droite', 'Le sens du champ suit la polarité des armatures : de + vers −.'),
    ] },
  { id: 'chel-ana-distance', domaine: DOM, titre: 'Des armatures trois fois plus proches',
    enonce: 'Deux armatures planes sont reliées à un générateur qui maintient la tension U. On rapproche les armatures pour que leur distance devienne trois fois plus petite.', q: 'Que devient la valeur du champ entre les armatures ?', options: [
      V('elle est multipliée par 3 : E = U ÷ d avec d divisée par 3', 'E est inversement proportionnelle à d : d trois fois plus petite, E trois fois plus grande.'),
      F('elle est divisée par 3, car on rapproche les armatures l’une de l’autre', 'E = U ÷ d augmente quand d diminue.'),
      F('elle est multipliée par 9, car E dépend du carré de la distance d', 'La distance intervient à la puissance 1 dans E = U ÷ d (le carré est celui de la gravitation).'),
      F('elle ne change pas : la tension reste la même', 'E dépend de U et de d : si d change, E change.'),
    ] },
  { id: 'chel-ana-signe', domaine: DOM, titre: 'Un ion négatif entre les armatures',
    enonce: 'Un ion de charge négative est placé entre deux armatures planes dont celle de gauche est positive et celle de droite négative.', q: 'Dans quel sens la force électrostatique est-elle dirigée ?', options: [
      V('vers la gauche, vers l’armature +, à l’opposé du champ', 'Pour q < 0, F = q E est de sens opposé à E ; E va vers la droite, F vers la gauche.'),
      F('vers la droite, dans le sens du champ', 'Dans le sens du champ, c’est le cas d’une charge positive.'),
      F('vers le haut, parallèlement aux armatures', 'Le champ et la force sont perpendiculaires aux armatures.'),
      F('elle est nulle, car l’ion est entouré de charges des deux signes', 'Le champ est non nul entre les armatures, donc la force aussi.'),
    ] },
  { id: 'chel-ana-position', domaine: DOM, titre: 'Près d’une armature ou au milieu',
    enonce: 'Une particule chargée est placée successivement près de l’armature positive, puis au milieu des armatures, puis près de l’armature négative (loin des bords). La tension et la distance restent les mêmes.', q: 'Comment se comparent les valeurs de la force électrostatique aux trois endroits ?', options: [
      V('elles sont égales : le champ est uniforme entre les armatures', 'Le champ E = U ÷ d est le même en tout point, donc F = |q| E aussi.'),
      F('la force est plus grande près de l’armature positive', 'Le champ n’est pas plus fort près d’une armature : il est uniforme.'),
      F('la force est plus grande au milieu, plus petite près des armatures', 'Entre deux armatures planes, il n’y a pas de zone privilégiée.'),
      F('la force est plus grande près de l’armature négative', 'La valeur du champ ne dépend pas de la position entre les armatures.'),
    ] },
];

export const CEL_VAL = [
  P({ id: 'chel-val-champ', domaine: DOM, niveau: 1, titre: 'Champ entre deux armatures : l’unité de distance', plausible: false,
    enonce: 'Un élève calcule le champ entre deux armatures distantes de 2,0 cm, entre lesquelles la tension est 200 V : « E = U ÷ d = 200 ÷ 2,0 = 100 V/m. »',
    reperes: [['Tension U', '200 V'], ['Distance d', '2,0 cm'], ['Relation', 'E = U ÷ d (d en mètres)']],
    ver: 'd = 2,0 cm = 0,020 m, donc E = 200 ÷ 0,020 = 1,0×10⁴ V/m. L’élève a oublié de convertir d en mètres.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il n’a pas converti d en mètres : E vaut 1,0×10⁴ V/m', 'Avec d = 0,020 m, E = 200 ÷ 0,020 = 1,0×10⁴ V/m.'),
      F('il aurait dû multiplier U par d au lieu de diviser', 'La relation est E = U ÷ d : on divise la tension par la distance.'),
      F('il a oublié que le champ dépend du signe de la charge placée entre les armatures', 'Le champ E ne dépend que de U et de d ; c’est la force qui dépend de q.'),
    ] }),
  P({ id: 'chel-val-force', domaine: DOM, niveau: 2, titre: 'Force sur un ion entre deux armatures', plausible: true,
    enonce: 'Un élève écrit : « Entre deux armatures, le champ vaut E = 5,0×10³ V/m, de la gauche (+) vers la droite (−). Un ion de charge +3,2×10⁻¹⁹ C subit la force F = 3,2×10⁻¹⁹ × 5,0×10³ = 1,6×10⁻¹⁵ N, dirigée vers la droite, dans le sens du champ. »',
    reperes: [['Champ E', '5,0×10³ V/m, vers la droite'], ['Charge q', '+3,2×10⁻¹⁹ C'], ['Relation', 'F = |q| × E']],
    ver: 'F = 3,2×10⁻¹⁹ × 5,0×10³ = 1,6×10⁻¹⁵ N, et la charge positive donne une force dans le sens du champ : le raisonnement est juste.',
    q2: 'Pourquoi la force est-elle dirigée dans le même sens que le champ ?',
    options: [
      V('parce que la charge de l’ion est positive : F = q E', 'Pour q > 0, le vecteur F = q E a le même sens que E.'),
      F('parce que la force a toujours le sens du champ, quelle que soit la charge', 'Pour une charge négative, la force est de sens opposé au champ.'),
      F('parce que l’ion est plus proche de l’armature positive', 'Le sens de la force ne dépend pas de la position entre les armatures.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const EC = 1.6e-19;
export const CEL_SAPP = [
  {
    id: 'chel-sapp-champ', domaine: DOM, titre: 'Deux armatures reliées à un générateur : valeur du champ', noms: ['Champ électrostatique entre les armatures', 'Champ si la distance est doublée'],
    gen: () => ({ U: tire([60, 120, 150, 200, 300]), d: tire([1.5, 2.0, 3.0, 5.0]), T: tire([18, 20, 22]) }),
    build: epure((p, q) => {
      const tokens = {
        U: tok(`${p.U} V`, 'Tension du générateur', p.U, 'V'), d: tok(`${String(p.d).replace('.', ',')} cm`, 'Distance entre les armatures', p.d, 'cm'), T: tok(`${p.T} °C`, 'Température de la salle', p.T, '°C'),
      };
      const debut = ['Deux armatures planes parallèles, distantes de ', T('d'), ', sont reliées aux bornes d’un générateur qui impose la tension ', T('U'), '. La salle est à ', T('T'), '. '];
      const E0 = p.U / (p.d / 100) / 1e3;
      if (q === 0) return { tokens, derivees: ['E = U ÷ d', 'd en mètres : d = distance en cm ÷ 100'], texte: [...debut, 'Quelle est la valeur du champ électrostatique entre les armatures, en kV/m ?'], utiles: ['U', 'd'],
        raisons: { T: 'La température de la salle n’intervient pas dans la valeur du champ.' },
        cherche: { bonne: 'La valeur du champ électrostatique entre les armatures (en kV/m)', faux: ['La force sur une particule placée entre les armatures (en N)', 'La charge portée par une armature (en C)', 'La tension entre les armatures (en V)'] },
        manque: null, solution: { txt: 'E = U ÷ d', val: E0, u: 'kV/m' } };
      return { tokens, derivees: ['E′ = U ÷ (2 d)', 'E′ = E ÷ 2'], texte: [...debut, 'On double la distance entre les armatures, sans changer la tension. Quelle est la nouvelle valeur du champ, en kV/m ?'], utiles: ['U', 'd'],
        raisons: { T: 'La température de la salle n’intervient pas dans la valeur du champ.' },
        cherche: { bonne: 'La valeur du champ après doublement de la distance (en kV/m)', faux: ['La valeur du champ avant le déplacement (en kV/m)', 'La variation de la distance (en cm)', 'La nouvelle tension entre les armatures (en V)'] },
        manque: null, solution: { txt: 'E′ = U ÷ (2 d)', val: E0 / 2, u: 'kV/m' } };
    }),
  },
  {
    id: 'chel-sapp-force', domaine: DOM, titre: 'Un ion entre deux armatures : force et tension', noms: ['Force sur l’ion', 'Tension entre les armatures'],
    gen: () => ({ n: tire([1, 2, 3]), E: tire([4, 5, 8, 10, 12]), d: tire([2.0, 2.5, 4.0, 5.0]), T: tire([18, 20, 22]) }),
    build: epure((p, q) => {
      const tokens = {
        n: tok(`${p.n} × 1,6×10⁻¹⁹ C`, 'Charge de l’ion (positive)', p.n * EC, 'C'), E: tok(`${p.E} kV/m`, 'Valeur du champ entre les armatures', p.E, 'kV/m'),
        d: tok(`${String(p.d).replace('.', ',')} cm`, 'Distance entre les armatures', p.d, 'cm'), T: tok(`${p.T} °C`, 'Température de la salle', p.T, '°C'),
      };
      const debut = ['Un ion de charge ', T('n'), ' est placé entre deux armatures planes parallèles distantes de ', T('d'), ', où le champ vaut ', T('E'), '. La salle est à ', T('T'), '. '];
      if (q === 0) return { tokens, derivees: ['F = |q| × E', 'E en V/m : kV/m × 1 000'], texte: [...debut, 'Quelle est la valeur de la force électrostatique sur l’ion, en 10⁻¹⁵ N ?'], utiles: ['n', 'E'],
        raisons: { d: 'La distance entre les armatures ne sert pas : le champ est déjà donné.', T: 'La température de la salle n’intervient pas dans la force.' },
        cherche: { bonne: 'La valeur de la force sur l’ion (en 10⁻¹⁵ N)', faux: ['La tension entre les armatures (en V)', 'Le poids de l’ion (en N)', 'La valeur du champ (en kV/m)'] },
        manque: null, solution: { txt: 'F = |q| × E', val: p.n * EC * p.E * 1e3 * 1e15, u: '×10⁻¹⁵ N' } };
      return { tokens, derivees: ['E = U ÷ d', 'U = E × d, d en mètres'], texte: [...debut, 'Quelle est la tension entre les armatures, en V ?'], utiles: ['E', 'd'],
        raisons: { n: 'La charge de l’ion ne sert pas pour trouver la tension : le champ est donné.', T: 'La température de la salle n’intervient pas.' },
        cherche: { bonne: 'La tension entre les armatures (en V)', faux: ['La force sur l’ion (en N)', 'La charge de l’ion (en C)', 'La valeur du champ (en kV/m)'] },
        manque: null, solution: { txt: 'U = E × d', val: p.E * 1e3 * p.d / 100, u: 'V' } };
    }),
  },
];
