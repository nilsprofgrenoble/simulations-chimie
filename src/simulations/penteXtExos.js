// Exercices ANA, VAL et S'APP de la simulation 265 « Lire une vitesse sur un graphique x(t) ». Préfixe : pxt-.
// Capacités visées (jamais affichées) : vitesse = pente de la corde (moyenne) ou de la tangente (instantanée) sur x(t) ; signe de la vitesse ; vitesse nulle = tangente horizontale.
const DOM = 'Lire une vitesse sur un graphique x(t)';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const PXT_ANA = [
  { id: 'pxt-ana-pente', domaine: DOM, titre: 'Deux droites sur le même graphique',
    enonce: 'Sur un même graphique x(t), on a tracé la droite de la position de deux chariots A et B sur un rail. Les deux droites sont montantes ; celle de A est plus raide que celle de B.', q: 'Que peut-on dire des vitesses de A et de B ?', options: [
      V('A va plus vite que B : sa pente, donc sa vitesse, est plus grande', 'Pour un mouvement uniforme, la vitesse est la pente de la droite x(t) : plus la droite est raide, plus la vitesse est grande.'),
      F('B va plus vite que A, car sa droite est plus proche de l’axe t', 'Une droite plus proche de l’axe des dates a une pente plus faible : le mobile va moins vite.'),
      F('les deux vont à la même vitesse, car les droites montent toutes les deux', 'Deux droites montantes peuvent avoir des pentes différentes, donc des vitesses différentes.'),
      F('on ne peut pas comparer sans connaître les positions initiales', 'La vitesse est la pente de la droite : elle ne dépend pas de la position initiale.'),
    ] },
  { id: 'pxt-ana-signe', domaine: DOM, titre: 'Une droite qui descend',
    enonce: 'Le graphique x(t) d’un chariot sur un rail est une droite descendante : x diminue régulièrement au cours du temps.', q: 'Que peut-on dire de la coordonnée v_x de sa vitesse ?', options: [
      V('négative, constante : il va vers les x décroissants', 'La pente est négative : v_x < 0. La pente est constante : v_x est constante.'),
      F('elle est positive et diminue : le chariot ralentit peu à peu', 'La droite a une pente constante : la vitesse ne varie pas. Et sa coordonnée est négative.'),
      F('elle est nulle : la position x n’augmente pas', 'x diminue : le chariot se déplace, sa vitesse n’est pas nulle.'),
      F('elle est négative et de plus en plus grande en valeur absolue', 'La pente d’une droite est constante : la vitesse est constante.'),
    ] },
  { id: 'pxt-ana-corde', domaine: DOM, titre: 'Moyenne ou instantanée ?',
    enonce: 'Le graphique x(t) d’un mobile est une courbe de plus en plus raide (le mobile accélère). On compare la vitesse moyenne entre les dates t1 et t2, avec t2 > t1, et la vitesse du mobile à la date t1.', q: 'Comment se comparent ces deux vitesses ?', options: [
      V('la vitesse moyenne est plus grande : la corde est plus raide que la tangente en t1', 'La courbe se redresse après t1 : la pente de la corde entre t1 et t2 dépasse celle de la tangente en t1.'),
      F('la vitesse moyenne est plus petite : la corde est moins raide que la tangente en t1', 'Ce serait vrai si la courbe devenait de moins en moins raide.'),
      F('elles sont égales : la vitesse moyenne est la vitesse à la date t1', 'Elles ne sont égales que si la vitesse est constante, ce qui n’est pas le cas ici.'),
      F('on ne peut pas savoir sans connaître la durée entre t1 et t2', 'Quelle que soit la durée, la corde est plus raide que la tangente en t1 pour une courbe qui se redresse.'),
    ] },
  { id: 'pxt-ana-plat', domaine: DOM, titre: 'Un palier sur la courbe',
    enonce: 'Le graphique x(t) d’un mobile sur un axe comporte un palier : entre les dates 3 s et 6 s, la courbe est horizontale, puis elle remonte.', q: 'Que fait le mobile entre 3 s et 6 s ?', options: [
      V('immobile : sa position ne change pas, sa vitesse est nulle', 'Courbe horizontale : pente nulle, donc v_x = 0 pendant toute la durée du palier.'),
      F('il se déplace à vitesse constante, la position restant la même', 'Une position qui ne change pas correspond à une vitesse nulle.'),
      F('il est revenu à l’origine du repère et il va repartir', 'Le palier indique une position constante, pas forcément l’origine.'),
      F('il ralentit : sa vitesse diminue jusqu’à la date 6 s', 'La vitesse est nulle pendant tout le palier, pas seulement à la fin.'),
    ] },
];

export const PXT_VAL = [
  P({ id: 'pxt-val-pente', domaine: DOM, niveau: 1, titre: 'Vitesse lue sur une droite : un écart de dates mal calculé', plausible: false,
    enonce: 'Un élève lit sur la droite x(t) d’un chariot : x = 4 m à la date 1 s et x = 10 m à la date 4 s. Il écrit : « v = Δx ÷ Δt = (10 − 4) ÷ 4 = 1,5 m/s. »',
    reperes: [['Position à 1 s', '4 m'], ['Position à 4 s', '10 m'], ['Ordre de grandeur', 'un chariot sur un rail : de l’ordre de 1 à 3 m/s']],
    ver: 'La durée écoulée est Δt = 4 − 1 = 3 s, et non 4 s : v = 6 ÷ 3 = 2,0 m/s.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a pris la date 4 s à la place de la durée, 4 − 1 = 3 s', 'Δt est la différence des dates : 4 s − 1 s = 3 s, d’où v = 6 ÷ 3 = 2,0 m/s.'),
      F('il aurait dû diviser la durée par la variation de position', 'On divise la variation de position par la durée, pas l’inverse.'),
      F('il aurait dû ajouter les deux positions avant de diviser', 'La vitesse fait intervenir la variation de position Δx = 10 − 4, pas leur somme.'),
    ] }),
  P({ id: 'pxt-val-signe', domaine: DOM, niveau: 2, titre: 'Un mobile qui revient vers l’origine', plausible: true,
    enonce: 'Un élève lit sur la courbe x(t) d’un mobile : x = 9 m à la date 2 s et x = 0 m à la date 5 s, avec une courbe descendante. Il écrit : « v = (0 − 9) ÷ (5 − 2) = −3 m/s. Le signe moins signifie que le mobile va vers les x décroissants, pas qu’il ralentit. »',
    reperes: [['Position à 2 s', '9 m'], ['Position à 5 s', '0 m'], ['Ordre de grandeur', 'quelques m/s pour un mobile sur un rail']],
    ver: 'v = (0 − 9) ÷ 3 = −3,0 m/s : le calcul est juste et le signe indique le sens du déplacement sur l’axe.',
    q2: 'Que signifie le signe moins de la vitesse ?',
    options: [
      V('le mobile se déplace dans le sens des x décroissants', 'Le signe de v_x donne le sens du déplacement par rapport à l’axe.'),
      F('le mobile ralentit pendant cette durée', 'Ralentir se juge en comparant les vitesses à plusieurs dates, pas avec le signe d’une seule valeur.'),
      F('le calcul est faux, car une vitesse est toujours positive', 'La coordonnée v_x peut être négative ; seule la norme de la vitesse est positive.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const fr = x => String(x).replace('.', ',');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
export const PXT_SAPP = [
  {
    id: 'pxt-sapp-droite', domaine: DOM, titre: 'Chariot sur un rail : vitesse lue sur une droite x(t)', noms: ['Vitesse du chariot', 'Position du chariot à une date ultérieure'],
    gen: () => { for (;;) { const t1 = tire([1, 2]), t2 = tire([4, 5, 6]), v = tire([1.5, 2, 2.5, 3]), x1 = tire([2, 4, 6]), t3 = tire([8, 9, 10]); return { t1, t2, t3, x1, x2: x1 + v * (t2 - t1), m: tire([0.5, 1, 1.5]), v }; } },
    build: epure((p, q) => {
      const tokens = {
        t1: tok(`${p.t1} s`, 'Première date', p.t1, 's'), x1: tok(`${fr(p.x1)} m`, 'Position à la première date', p.x1, 'm'),
        t2: tok(`${p.t2} s`, 'Deuxième date', p.t2, 's'), x2: tok(`${fr(p.x2)} m`, 'Position à la deuxième date', p.x2, 'm'),
        t3: tok(`${p.t3} s`, 'Date ultérieure', p.t3, 's'), m: tok(`${fr(p.m)} kg`, 'Masse du chariot', p.m, 'kg'),
      };
      const debut = ['Un chariot de masse ', T('m'), ' se déplace à vitesse constante sur un rail. Sur la droite de sa position x en fonction du temps, on lit : ', T('x1'), ' à la date ', T('t1'), ' et ', T('x2'), ' à la date ', T('t2'), '. '];
      if (q === 0) return { tokens, derivees: ['v = Δx ÷ Δt = (x₂ − x₁) ÷ (t₂ − t₁)'], texte: [...debut, 'On suit le chariot jusqu’à la date ', T('t3'), '. Quelle est la vitesse du chariot, en m/s ?'], utiles: ['t1', 'x1', 't2', 'x2'],
        raisons: { t3: 'Cette date ne sert pas au calcul de la vitesse.', m: 'La masse du chariot n’intervient pas dans la lecture d’une vitesse sur un graphique de position.' },
        cherche: { bonne: 'La vitesse du chariot (en m/s)', faux: ['La distance parcourue entre les deux dates (en m)', 'La position à la date t = 0 (en m)', 'La durée du mouvement (en s)'] },
        manque: null, solution: { txt: 'v = (x₂ − x₁) ÷ (t₂ − t₁)', val: (p.x2 - p.x1) / (p.t2 - p.t1), u: 'm/s' } };
      return { tokens, derivees: ['v = (x₂ − x₁) ÷ (t₂ − t₁)', 'x(t₃) = x₂ + v × (t₃ − t₂)'], texte: [...debut, 'Le mouvement reste uniforme. Quelle est la position du chariot à la date ', T('t3'), ' ?'], utiles: ['t1', 'x1', 't2', 'x2', 't3'],
        raisons: { m: 'La masse du chariot n’intervient pas dans la lecture d’une position sur un graphique.' },
        cherche: { bonne: 'La position du chariot à la date t₃ (en m)', faux: ['La vitesse du chariot (en m/s)', 'La distance parcourue entre t₁ et t₂ (en m)', 'La durée entre t₂ et t₃ (en s)'] },
        manque: null, solution: { txt: 'x(t₃) = x₂ + v × (t₃ − t₂)', val: p.x2 + p.v * (p.t3 - p.t2), u: 'm' } };
    }),
  },
  {
    id: 'pxt-sapp-tangente', domaine: DOM, titre: 'Mobile qui accélère : tangente et vitesse moyenne', noms: ['Vitesse à une date, lue sur la tangente', 'Vitesse moyenne entre deux dates'],
    gen: () => { for (;;) { const a = tire([1, 2]), b = tire([1, 2]), t0 = tire([2, 3]), t2 = t0 + 2, x = t => 0.5 * a * t * t + b * t, v0 = b + a * t0; return { a, b, t0, t2, xa: x(t0) - 2 * v0, ta: t0 - 2, xb: x(t0) + 2 * v0, tb: t0 + 2, x0: x(t0), x2: x(t2), v0, vm: (x(t2) - x(t0)) / 2, k: tire([0.5, 1]) }; } },
    build: epure((p, q) => {
      const tokens = {
        ta: tok(`${p.ta} s`, 'Date du premier point de la tangente', p.ta, 's'), xa: tok(`${fr(p.xa)} m`, 'Position du premier point de la tangente', p.xa, 'm'),
        tb: tok(`${p.tb} s`, 'Date du second point de la tangente', p.tb, 's'), xb: tok(`${fr(p.xb)} m`, 'Position du second point de la tangente', p.xb, 'm'),
        t0: tok(`${p.t0} s`, 'Date étudiée', p.t0, 's'), x0: tok(`${fr(p.x0)} m`, 'Position à la date étudiée', p.x0, 'm'),
        t2: tok(`${p.t2} s`, 'Date plus tardive', p.t2, 's'), x2: tok(`${fr(p.x2)} m`, 'Position à la date plus tardive', p.x2, 'm'), m: tok(`${fr(p.k)} kg`, 'Masse du mobile', p.k, 'kg'),
      };
      const debut = ['Un mobile de masse ', T('m'), ' accélère sur un rail. Sur la courbe de sa position x en fonction du temps, la tangente à la date ', T('t0'), ' passe par les points (', T('ta'), ' ; ', T('xa'), ') et (', T('tb'), ' ; ', T('xb'), '). La courbe passe par le point (', T('t0'), ' ; ', T('x0'), ') et par le point (', T('t2'), ' ; ', T('x2'), '). '];
      if (q === 0) return { tokens, derivees: ['v(t₀) = pente de la tangente = (xb − xa) ÷ (tb − ta)'], texte: [...debut, 'Quelle est la vitesse du mobile à la date ', T('t0'), ', en m/s ?'], utiles: ['ta', 'xa', 'tb', 'xb'],
        raisons: { m: 'La masse du mobile n’intervient pas dans la lecture d’une vitesse sur le graphique.', t0: 'La date étudiée est repérée sur la courbe : ici seule la pente de la tangente compte.', x0: 'La position à la date étudiée ne donne pas la pente.', t2: 'Ce point appartient à la courbe, pas à la tangente : il sert à la vitesse moyenne.', x2: 'Ce point appartient à la courbe, pas à la tangente : il sert à la vitesse moyenne.' },
        cherche: { bonne: 'La vitesse du mobile à la date t₀ (en m/s)', faux: ['La vitesse moyenne entre t₀ et t₂ (en m/s)', 'La distance parcourue entre t₀ et t₂ (en m)', 'La durée entre t₀ et t₂ (en s)'] },
        manque: null, solution: { txt: 'v(t₀) = (xb − xa) ÷ (tb − ta)', val: p.v0, u: 'm/s' } };
      return { tokens, derivees: ['v moyenne = (x₂ − x₀) ÷ (t₂ − t₀)'], texte: [...debut, 'Quelle est la vitesse moyenne du mobile entre les dates ', T('t0'), ' et ', T('t2'), ', en m/s ?'], utiles: ['t0', 'x0', 't2', 'x2'],
        raisons: { m: 'La masse du mobile n’intervient pas dans la lecture d’une vitesse sur le graphique.', ta: 'Ce point appartient à la tangente : il donne la vitesse à la date étudiée, pas la vitesse moyenne.', xa: 'Ce point appartient à la tangente : il donne la vitesse à la date étudiée, pas la vitesse moyenne.', tb: 'Ce point appartient à la tangente : il donne la vitesse à la date étudiée, pas la vitesse moyenne.', xb: 'Ce point appartient à la tangente : il donne la vitesse à la date étudiée, pas la vitesse moyenne.' },
        cherche: { bonne: 'La vitesse moyenne entre t₀ et t₂ (en m/s)', faux: ['La vitesse à la date t₀ (en m/s)', 'La distance parcourue entre t₀ et t₂ (en m)', 'La durée entre t₀ et t₂ (en s)'] },
        manque: null, solution: { txt: 'v moyenne = (x₂ − x₀) ÷ (t₂ − t₀)', val: p.vm, u: 'm/s' } };
    }),
  },
];
