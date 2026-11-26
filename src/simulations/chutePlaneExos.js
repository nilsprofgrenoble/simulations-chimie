// Exercices ANA, VAL et S'APP de la simulation 269 « Chute libre plane ». Préfixe : clp-.
// Capacités visées (jamais affichées) : deuxième loi de Newton appliquée à un projectile ; lois horaires de la chute libre ; sommet, hauteur maximale, portée ; effet de l'angle et de la masse.
const DOM = 'Chute libre plane';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const CLP_ANA = [
  { id: 'clp-ana-acc', domaine: DOM, titre: 'L’accélération d’un projectile au sommet',
    enonce: 'Un projectile est lancé du sol, obliquement vers le haut. On néglige l’air : seul son poids agit. On s’intéresse à l’instant où il atteint le point le plus haut de sa trajectoire.', q: 'À cet instant, l’accélération du projectile est :', options: [
      V('verticale, dirigée vers le bas, de valeur g', 'Le poids ne change pas au cours du vol : a = g à chaque instant, y compris au sommet.'),
      F('nulle, car le projectile ne monte plus', 'La vitesse verticale est nulle un instant, mais elle continue de varier : a n’est pas nulle.'),
      F('horizontale, dans le sens du mouvement du projectile', 'Aucune force horizontale ne s’exerce : aₓ = 0.'),
      F('verticale vers le haut, car il vient de monter', 'La seule force est le poids, dirigé vers le bas : a est dirigée vers le bas.'),
    ] },
  { id: 'clp-ana-vitesse', domaine: DOM, titre: 'La vitesse au sommet et au départ',
    enonce: 'Un projectile est lancé du sol avec une vitesse de 20 m/s, inclinée de 40° au-dessus de l’horizontale. On néglige l’air. On compare la valeur de sa vitesse au sommet de la trajectoire à celle du départ.', q: 'Au sommet, la valeur de la vitesse est :', options: [
      V('plus petite que 20 m/s : il reste seulement vₓ', 'Au sommet vᵧ = 0 et vₓ = v₀ cos α < v₀ : la vitesse est horizontale et plus petite qu’au départ.'),
      F('égale à 20 m/s, car la vitesse ne change pas du tout pendant le vol', 'Seule la composante horizontale reste constante : la vitesse totale varie.'),
      F('nulle, car le projectile s’arrête un instant', 'Seule la composante verticale s’annule : vₓ n’est pas nulle.'),
      F('plus grande que 20 m/s, car le projectile a pris de l’élan en montant', 'Pendant la montée le poids ralentit le projectile : sa vitesse diminue.'),
    ] },
  { id: 'clp-ana-angle', domaine: DOM, titre: 'Deux tirs d’angles complémentaires',
    enonce: 'On lance un projectile du sol avec la même vitesse initiale deux fois, d’abord avec un angle de 30°, puis avec un angle de 60° au-dessus de l’horizontale. On néglige l’air.', q: 'Comparée à celle du tir à 30°, la portée du tir à 60° est :', options: [
      V('la même, mais le projectile monte plus haut', 'D = v₀² sin(2α) ÷ g : sin 60° = sin 120°, donc même portée ; v₀ᵧ est plus grande à 60°, donc H aussi.'),
      F('plus grande, car l’angle est plus grand', 'La portée est maximale à 45° : au-delà, elle diminue.'),
      F('plus petite, car le projectile monte plus haut', 'Les angles complémentaires 30° et 60° donnent la même portée.'),
      F('la même, et la hauteur atteinte est aussi la même', 'La hauteur dépend de v₀ᵧ = v₀ sin α : elle est plus grande à 60°.'),
    ] },
  { id: 'clp-ana-double', domaine: DOM, titre: 'Une vitesse initiale doublée',
    enonce: 'Un projectile est lancé du sol avec une vitesse initiale donnée, inclinée de 45°. On refait le tir avec le même angle, mais une vitesse initiale deux fois plus grande. On néglige l’air.', q: 'La hauteur maximale atteinte est :', options: [
      V('multipliée par 4 : H = (v₀ sin α)² ÷ (2 g)', 'H est proportionnelle à v₀ᵧ², donc à v₀² : doubler v₀ multiplie H par 4.'),
      F('multipliée par 2, comme la vitesse initiale', 'H dépend du carré de la vitesse verticale : le facteur est 4.'),
      F('la même, car le poids ne change pas', 'Le poids est le même, mais le projectile part plus vite vers le haut : il monte plus haut.'),
      F('multipliée par 8, car v₀ intervient au cube', 'H varie comme v₀², pas comme v₀³.'),
    ] },
];

export const CLP_VAL = [
  P({ id: 'clp-val-hauteur', domaine: DOM, niveau: 1, titre: 'Hauteur maximale : le facteur 2 oublié', plausible: false,
    enonce: 'Un projectile est lancé du sol avec une vitesse de 20 m/s, inclinée de 30° au-dessus de l’horizontale (chute libre, g = 9,8 m/s²). Un élève écrit : « v₀ᵧ = 20 × sin 30° = 10 m/s ; H = v₀ᵧ² ÷ g = 10² ÷ 9,8 = 10 m. »',
    reperes: [['Vitesse initiale v₀', '20 m/s'], ['Angle α', '30°'], ['g', '9,8 m/s²']],
    ver: 'H = v₀ᵧ² ÷ (2 g) = 100 ÷ 19,6 = 5,1 m. L’élève a oublié le facteur 2 : sa valeur est le double de la bonne.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a oublié le facteur 2 : H = v₀ᵧ² ÷ (2 g) ≈ 5,1 m', 'Au sommet vᵧ = 0 : H = v₀ᵧ² ÷ (2 g), soit environ 5,1 m.'),
      F('il aurait dû utiliser v₀ cos α à la place de v₀ sin α', 'La hauteur dépend de la composante verticale : le sinus est le bon choix.'),
      F('il aurait dû multiplier v₀ᵧ² par g au lieu de diviser', 'La hauteur diminue quand g augmente : on divise.'),
    ] }),
  P({ id: 'clp-val-portee', domaine: DOM, niveau: 2, titre: 'Portée d’un tir à 45°', plausible: true,
    enonce: 'Un projectile est lancé du sol avec une vitesse de 15 m/s, inclinée de 45° (chute libre, g = 9,8 m/s²). Un élève écrit : « vₓ = v₀ᵧ = 15 × cos 45° ≈ 10,6 m/s ; t_S = v₀ᵧ ÷ g ≈ 1,08 s ; la durée du vol est 2 t_S ≈ 2,16 s ; D = vₓ × 2 t_S ≈ 23 m. »',
    reperes: [['Vitesse initiale v₀', '15 m/s'], ['Angle α', '45°'], ['g', '9,8 m/s²']],
    ver: 'D = v₀² sin(2α) ÷ g = 225 ÷ 9,8 ≈ 23 m : le raisonnement et le résultat sont corrects.',
    q2: 'Pourquoi la durée du vol vaut-elle 2 t_S ?',
    options: [
      V('parce que la descente dure autant que la montée', 'Le projectile retombe à la hauteur de départ : montée et descente sont symétriques.'),
      F('parce que la vitesse horizontale double pendant la descente', 'La vitesse horizontale reste constante pendant tout le vol.'),
      F('parce que l’accélération double quand le projectile redescend', 'L’accélération vaut g tout au long du vol, à la montée comme à la descente.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const RAD = Math.PI / 180, G = 9.8;
export const CLP_SAPP = [
  {
    id: 'clp-sapp-sommet', domaine: DOM, titre: 'Un projectile lancé du sol : durée de la montée et hauteur maximale', noms: ['Durée de la montée', 'Hauteur maximale'],
    gen: () => ({ v0: tire([12, 15, 18, 20, 25]), a: tire([30, 40, 50, 60]), m: tire([0.5, 1.0, 2.0]) }),
    build: epure((p, q) => {
      const fr = x => String(x).replace('.', ',');
      const tokens = {
        v0: tok(`${p.v0} m/s`, 'Vitesse initiale', p.v0, 'm/s'), a: tok(`${p.a}°`, 'Angle de tir', p.a, '°'), m: tok(`${fr(p.m.toFixed(1))} kg`, 'Masse du projectile', p.m, 'kg'), g: tok('9,8 m/s²', 'Intensité de la pesanteur', G, 'm/s²'),
      };
      const debut = ['Un projectile de masse ', T('m'), ' est lancé du sol avec une vitesse initiale de ', T('v0'), ', inclinée de ', T('a'), ' au-dessus de l’horizontale. On néglige l’air ; g = ', T('g'), '. '];
      const vy0 = p.v0 * Math.sin(p.a * RAD);
      if (q === 0) return { tokens, derivees: ['v₀ᵧ = v₀ sin α', 't_S = v₀ᵧ ÷ g'], texte: [...debut, 'Quelle est la durée de la montée jusqu’au sommet, en s ?'], utiles: ['v0', 'a', 'g'],
        raisons: { m: 'La masse ne change pas la trajectoire en chute libre : elle ne sert pas ici.' },
        cherche: { bonne: 'La durée de la montée jusqu’au sommet (en s)', faux: ['La hauteur maximale atteinte (en m)', 'La portée du tir (en m)', 'La vitesse au sommet (en m/s)'] },
        manque: null, solution: { txt: 't_S = v₀ sin α ÷ g', val: vy0 / G, u: 's' } };
      return { tokens, derivees: ['v₀ᵧ = v₀ sin α', 'H = v₀ᵧ² ÷ (2 g)'], texte: [...debut, 'Quelle est la hauteur maximale atteinte, en m ?'], utiles: ['v0', 'a', 'g'],
        raisons: { m: 'La masse ne change pas la trajectoire en chute libre : elle ne sert pas ici.' },
        cherche: { bonne: 'La hauteur maximale atteinte (en m)', faux: ['La durée de la montée (en s)', 'La portée du tir (en m)', 'Le poids du projectile (en N)'] },
        manque: null, solution: { txt: 'H = (v₀ sin α)² ÷ (2 g)', val: vy0 ** 2 / (2 * G), u: 'm' } };
    }),
  },
  {
    id: 'clp-sapp-portee', domaine: DOM, titre: 'Un projectile lancé du sol : durée du vol et portée', noms: ['Durée du vol', 'Portée du tir'],
    gen: () => ({ v0: tire([12, 15, 18, 20, 25]), a: tire([30, 40, 50, 60]), m: tire([0.5, 1.0, 2.0]) }),
    build: epure((p, q) => {
      const fr = x => String(x).replace('.', ',');
      const tokens = {
        v0: tok(`${p.v0} m/s`, 'Vitesse initiale', p.v0, 'm/s'), a: tok(`${p.a}°`, 'Angle de tir', p.a, '°'), m: tok(`${fr(p.m.toFixed(1))} kg`, 'Masse du projectile', p.m, 'kg'), g: tok('9,8 m/s²', 'Intensité de la pesanteur', G, 'm/s²'),
      };
      const debut = ['Un projectile de masse ', T('m'), ' est lancé du sol avec une vitesse initiale de ', T('v0'), ', inclinée de ', T('a'), ' au-dessus de l’horizontale. Il retombe au sol. On néglige l’air ; g = ', T('g'), '. '];
      const vy0 = p.v0 * Math.sin(p.a * RAD), vx = p.v0 * Math.cos(p.a * RAD), tv = 2 * vy0 / G;
      if (q === 0) return { tokens, derivees: ['v₀ᵧ = v₀ sin α', 't_S = v₀ᵧ ÷ g', 'durée du vol = 2 t_S'], texte: [...debut, 'Quelle est la durée du vol, en s ?'], utiles: ['v0', 'a', 'g'],
        raisons: { m: 'La masse ne change pas la trajectoire en chute libre : elle ne sert pas ici.' },
        cherche: { bonne: 'La durée du vol, du lancer à la retombée (en s)', faux: ['La durée de la montée seule (en s)', 'La portée du tir (en m)', 'La hauteur maximale atteinte (en m)'] },
        manque: null, solution: { txt: 'durée du vol = 2 v₀ sin α ÷ g', val: tv, u: 's' } };
      return { tokens, derivees: ['vₓ = v₀ cos α', 'durée du vol = 2 v₀ sin α ÷ g', 'D = vₓ × durée du vol'], texte: [...debut, 'Quelle est la portée du tir, en m ?'], utiles: ['v0', 'a', 'g'],
        raisons: { m: 'La masse ne change pas la trajectoire en chute libre : elle ne sert pas ici.' },
        cherche: { bonne: 'La portée du tir (en m)', faux: ['La hauteur maximale atteinte (en m)', 'La durée du vol (en s)', 'La vitesse horizontale (en m/s)'] },
        manque: null, solution: { txt: 'D = v₀ cos α × 2 v₀ sin α ÷ g', val: vx * tv, u: 'm' } };
    }),
  },
];
