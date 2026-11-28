// Exercices ANA, VAL et S'APP de la simulation 266 « Gravitation et poids ». Préfixe : grv-.
// Capacités visées (jamais affichées) : force d'interaction gravitationnelle (même valeur, sens opposés, en 1/d²), poids P = m g, g = G M / R², différence masse / poids.
const DOM = 'Gravitation et poids';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const GRV_ANA = [
  { id: 'grv-ana-reciproque', domaine: DOM, titre: 'Un satellite et la Terre',
    enonce: 'Un satellite de 500 kg tourne autour de la Terre. La Terre exerce sur lui une force gravitationnelle de valeur F.', q: 'Que peut-on dire de la force exercée par le satellite sur la Terre ?', options: [
      V('elle a la même valeur F, mais dirigée en sens opposé', 'Les forces d’interaction gravitationnelle entre deux corps ont la même valeur et des sens opposés.'),
      F('elle est beaucoup plus petite, car le satellite est léger', 'La valeur frac(G × m_A × m_B|d²) est la même pour les deux corps : seul leur effet diffère.'),
      F('elle est nulle : seule la Terre attire le satellite', 'L’interaction est réciproque : le satellite attire aussi la Terre.'),
      F('elle a la valeur F, et le même sens que la force sur le satellite', 'Les deux forces sont dirigées chacune vers l’autre corps : les sens sont opposés.'),
    ] },
  { id: 'grv-ana-distance', domaine: DOM, titre: 'Trois fois plus loin',
    enonce: 'Deux astéroïdes s’attirent avec une force gravitationnelle de valeur F. On éloigne l’un de l’autre de façon à tripler la distance qui les sépare (les masses ne changent pas).', q: 'Que devient la valeur de la force ?', options: [
      V('elle est divisée par 9 : F varie en 1/d², donc elle devient un neuvième', 'F = frac(G × m_A × m_B|d²) : si d est multipliée par 3, F est divisée par 3² = 9.'),
      F('elle est divisée par 3 : F est inversement proportionnelle à d', 'La distance intervient au carré dans la formule.'),
      F('elle est multipliée par 3 : plus la distance est grande, plus F est grande', 'F diminue quand la distance augmente.'),
      F('elle ne change pas : seules les masses comptent dans la formule', 'La distance d intervient dans la valeur de la force.'),
    ] },
  { id: 'grv-ana-masse', domaine: DOM, titre: 'Une sonde sur Mars',
    enonce: 'Une sonde d’une masse de 300 kg est transportée de la Terre vers Mars, où l’intensité de pesanteur est plus petite que sur Terre.', q: 'Que devient la masse de la sonde et son poids ?', options: [
      V('masse inchangée, poids plus petit : P = m × g avec g plus petit', 'La masse est la même partout ; le poids dépend de g.'),
      F('masse plus petite, poids plus petit : il y a moins de gravité sur Mars', 'La masse est une propriété de l’objet, elle ne change pas avec le lieu.'),
      F('masse inchangée, poids inchangé : le poids est une propriété de la sonde', 'Le poids dépend de l’astre : P = m × g, et g change.'),
      F('masse plus grande, poids plus petit : la sonde a voyagé loin', 'La masse ne change pas au cours d’un voyage.'),
    ] },
  { id: 'grv-ana-altitude', domaine: DOM, titre: 'En orbite basse',
    enonce: 'Un satellite est en orbite à 400 km d’altitude, soit une distance au centre de la Terre un peu plus grande que le rayon terrestre (6 400 km). On compare l’intensité de pesanteur g à cette altitude et sur le sol.', q: 'Comment se comparent ces deux valeurs ?', options: [
      V('un peu plus petite à 400 km, sans jamais être nulle là-haut', 'g = frac(G M|R + h)² diminue légèrement quand h augmente, mais reste proche de 9,8 N/kg.'),
      F('nulle à 400 km : le satellite est en apesanteur', 'La gravitation agit encore : l’apesanteur apparente vient du mouvement, pas de l’absence de g.'),
      F('exactement la même, car 400 km est très petit devant la Terre', 'La valeur est un peu plus petite : environ 89 % de la valeur au sol.'),
      F('plus grande à 400 km, car on est plus près du ciel', 'g diminue quand la distance au centre augmente.'),
    ] },
];

export const GRV_VAL = [
  P({ id: 'grv-val-force', domaine: DOM, niveau: 1, titre: 'Force entre deux blocs : la distance au carré oubliée', plausible: false,
    enonce: 'Un élève calcule la force gravitationnelle entre deux blocs de 1 000 kg séparés de 2,0 m : « F = frac(G × m_A × m_B|d) = frac(6,67×10⁻¹¹ × 1 000 × 1 000|2,0) ≈ 3,3×10⁻⁵ N. »',
    reperes: [['Masses', '1 000 kg chacune'], ['Distance', '2,0 m'], ['G', '6,67×10⁻¹¹ N·m²·kg⁻²']],
    ver: 'La distance doit être au carré : F = frac(6,67×10⁻¹¹ × 10⁶|2,0²) ≈ 1,7×10⁻⁵ N. Il frac(a|d) au lieu de d².',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a divisé par d et non par d² : F vaut 1,7×10⁻⁵ N environ', 'La formule contient d² : 2,0² = 4,0, d’où F ≈ 1,7×10⁻⁵ N.'),
      F('il a oublié que la force dépend de la masse totale des deux blocs', 'La formule fait intervenir le produit m_A × m_B, déjà pris en compte.'),
      F('il aurait dû multiplier par la distance et non diviser', 'F diminue quand la distance augmente : on divise par d².'),
    ] }),
  P({ id: 'grv-val-poids', domaine: DOM, niveau: 2, titre: 'Un astronaute sur la Lune', plausible: true,
    enonce: 'Un élève écrit : « Un astronaute de masse 70 kg a sur la Terre un poids P = 70 × 9,8 ≈ 690 N. Sur la Lune, g = 1,6 N/kg : P = 70 × 1,6 = 112 N, soit six fois moins ; sa masse reste 70 kg. »',
    reperes: [['g sur la Terre', '9,8 N/kg'], ['g sur la Lune', '1,6 N/kg'], ['Masse', '70 kg']],
    ver: 'P_Terre = 686 N et P_Lune = 112 N : rapport 6,1. La masse ne change pas : le raisonnement est juste.',
    q2: 'Pourquoi la masse de l’astronaute reste-t-elle 70 kg sur la Lune ?',
    options: [
      V('c’est une propriété de l’astronaute, sans lien avec le lieu', 'La masse mesure la quantité de matière ; seul le poids dépend de g.'),
      F('parce que g est plus petit sur la Lune, donc la masse aussi', 'g agit sur le poids, pas sur la masse.'),
      F('parce que la masse se mesure en newtons comme le poids', 'La masse se mesure en kilogrammes ; le poids, en newtons.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const GC = 6.67e-11;
export const GRV_SAPP = [
  {
    id: 'grv-sapp-force', domaine: DOM, titre: 'Deux blocs qui s’attirent : valeur de la force', noms: ['Force gravitationnelle entre les deux blocs', 'Force si la distance est doublée'],
    gen: () => ({ m1: tire([500, 800, 1000, 1500]), m2: tire([500, 1000, 2000]), d: tire([1, 2, 3]), c: tire([20, 25, 30]) }),
    build: epure((p, q) => {
      const tokens = {
        m1: tok(`${p.m1} kg`, 'Masse du premier bloc', p.m1, 'kg'), m2: tok(`${p.m2} kg`, 'Masse du second bloc', p.m2, 'kg'),
        d: tok(`${p.d} m`, 'Distance entre les centres des blocs', p.d, 'm'), c: tok(`${p.c} °C`, 'Température du local', p.c, '°C'),
      };
      const debut = ['Deux blocs de masses ', T('m1'), ' et ', T('m2'), ' sont séparés de ', T('d'), ' (centre à centre) dans un local à ', T('c'), '. G = 6,67×10⁻¹¹ N·m²·kg⁻². '];
      const F0 = GC * p.m1 * p.m2 / (p.d * p.d) * 1e6;
      if (q === 0) return { tokens, derivees: ['F = frac(G × m_A × m_B|d²)'], texte: [...debut, 'Quelle est la valeur de la force gravitationnelle entre les deux blocs, en µN ?'], utiles: ['m1', 'm2', 'd'],
        raisons: { c: 'La température du local n’intervient pas dans la force gravitationnelle.' },
        cherche: { bonne: 'La valeur de la force gravitationnelle (en µN)', faux: ['Le poids du premier bloc (en N)', 'L’intensité de pesanteur à la surface d’un bloc (en N/kg)', 'La masse totale des deux blocs (en kg)'] },
        manque: null, solution: { txt: 'F = frac(G × m_A × m_B|d²)', val: F0, u: 'µN' } };
      return { tokens, derivees: ['F′ = frac(G × m_A × m_B|2 d)²', 'F′ = frac(F|4)'], texte: [...debut, 'On double la distance entre les blocs. Quelle est la nouvelle valeur de la force, en µN ?'], utiles: ['m1', 'm2', 'd'],
        raisons: { c: 'La température du local n’intervient pas dans la force gravitationnelle.' },
        cherche: { bonne: 'La valeur de la force après doublement de la distance (en µN)', faux: ['La valeur de la force avant le déplacement (en µN)', 'La variation de la distance (en m)', 'Le poids d’un bloc (en N)'] },
        manque: null, solution: { txt: 'F′ = frac(G × m_A × m_B|2 d)²', val: F0 / 4, u: 'µN' } };
    }),
  },
  {
    id: 'grv-sapp-poids', domaine: DOM, titre: 'Planète inventée : intensité de pesanteur et poids', noms: ['Intensité de pesanteur à la surface', 'Poids de l’objet à la surface'],
    gen: () => { for (;;) { const M = tire([2, 3, 4, 5, 8]), R = tire([2, 3, 4]), g = GC * M * 1e23 / (R * R * 1e12); if (g > 1.5) return { M, R, m: tire([40, 50, 60, 80]), h: tire([100, 200, 300]) }; } },
    build: epure((p, q) => {
      const tokens = {
        M: tok(`${p.M}×10²³ kg`, 'Masse de la planète', p.M * 1e23, 'kg'), R: tok(`${p.R}×10⁶ m`, 'Rayon de la planète', p.R * 1e6, 'm'),
        m: tok(`${p.m} kg`, 'Masse de l’objet', p.m, 'kg'), h: tok(`${p.h} km`, 'Altitude d’un satellite', p.h, 'km'),
      };
      const debut = ['Une planète a pour masse ', T('M'), ' et pour rayon ', T('R'), '. Un objet de masse ', T('m'), ' est posé à sa surface ; un satellite orbite à ', T('h'), ' d’altitude. G = 6,67×10⁻¹¹ N·m²·kg⁻². '];
      const g = GC * p.M * 1e23 / ((p.R * 1e6) ** 2);
      if (q === 0) return { tokens, derivees: ['g = frac(G × M|R²)'], texte: [...debut, 'Quelle est l’intensité de pesanteur à la surface de la planète, en N/kg ?'], utiles: ['M', 'R'],
        raisons: { m: 'La masse de l’objet n’intervient pas dans g.', h: 'L’altitude du satellite ne sert pas pour la surface.' },
        cherche: { bonne: 'L’intensité de pesanteur à la surface (en N/kg)', faux: ['Le poids de l’objet à la surface (en N)', 'L’intensité de pesanteur à l’altitude du satellite (en N/kg)', 'La force exercée par l’objet sur la planète (en N)'] },
        manque: null, solution: { txt: 'g = frac(G × M|R²)', val: g, u: 'N/kg' } };
      return { tokens, derivees: ['g = frac(G × M|R²)', 'P = m × g'], texte: [...debut, 'Quel est le poids de l’objet à la surface de la planète, en N ?'], utiles: ['M', 'R', 'm'],
        raisons: { h: 'L’altitude du satellite ne sert pas pour la surface.' },
        cherche: { bonne: 'Le poids de l’objet à la surface (en N)', faux: ['L’intensité de pesanteur à la surface (en N/kg)', 'La masse de l’objet sur Terre (en kg)', 'La force exercée par la planète sur le satellite (en N)'] },
        manque: null, solution: { txt: 'P = frac(m × G × M|R²)', val: p.m * g, u: 'N' } };
    }),
  },
];
