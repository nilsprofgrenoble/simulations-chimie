// Exercices ANA, VAL et S'APP de la simulation 271 « Chute avec frottement visqueux (2) : équation différentielle et méthode d'Euler ». Préfixe : eul-.
// Capacités visées (jamais affichées) : établir l'équation différentielle du mouvement ; en déduire v_lim et τ ; résoudre par la méthode d'Euler et discuter le pas.
const DOM = 'Équation différentielle et méthode d’Euler';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const EUL_ANA = [
  { id: 'eul-ana-poussee', domaine: DOM, titre: 'Effet de la poussée d’Archimède au départ',
    enonce: 'Un objet est lâché sans vitesse dans un fluide. Il subit son poids P, la poussée d’Archimède Π = m_f g (m_f : masse de fluide déplacé, plus petite que la masse m de l’objet) et un frottement f = k v. On compare l’accélération initiale à g.', q: 'À l’instant du lâcher, l’accélération de l’objet est :', options: [
      V('plus petite que g, car la poussée s’oppose au poids : a = g (1 − frac(m_f|m))', 'À t = 0, v = 0 donc f = 0 ; il reste P − Π = m g − m_f g, donc a = g (1 − frac(m_f|m)) < g.'),
      F('égale à g, car le frottement est nul au départ', 'Le frottement est nul, mais la poussée d’Archimède agit déjà et diminue l’accélération.'),
      F('plus grande que g, car la poussée s’ajoute au poids', 'La poussée est dirigée vers le haut : elle retranche, elle n’ajoute pas.'),
      F('nulle, car la poussée équilibre le poids', 'Π = m_f g est plus petite que P = m g : le poids l’emporte et l’objet accélère.'),
    ] },
  { id: 'eul-ana-vlim', domaine: DOM, titre: 'Vitesse limite avec poussée d’Archimède',
    enonce: 'Dans un fluide donné (k fixé), un même objet de masse m déplace une masse de fluide m_f. En régime permanent, la vitesse est constante. On compare la vitesse limite réelle à celle que l’on calculerait en oubliant la poussée.', q: 'Par rapport au calcul qui oublie la poussée frac(m g|k), la vitesse limite réelle est :', options: [
      V('plus petite : v_lim = frac((m − m_f) g|k)', 'En régime permanent, P − Π − f = 0, soit k v_lim = (m − m_f) g : la poussée diminue v_lim.'),
      F('la même, car la poussée ne dépend pas de la vitesse', 'La poussée intervient dans le bilan des forces et fait diminuer le poids « apparent ».'),
      F('plus grande, car la poussée aide l’objet à descendre', 'La poussée est vers le haut : elle s’oppose à la descente.'),
      F('plus petite, mais seulement dans le régime transitoire', 'En régime permanent aussi : v_lim = frac((m − m_f) g|k).'),
    ] },
  { id: 'eul-ana-euler', domaine: DOM, titre: 'Un pas de la méthode d’Euler',
    enonce: 'On calcule la vitesse d’un objet qui chute avec frottement par la méthode d’Euler, avec un pas Δt. À la date t_i, la vitesse vaut v_i et l’accélération calculée vaut a_i.', q: 'La vitesse à la date t_i + Δt est estimée par :', options: [
      V('v_i + a_i × Δt, avec a_i calculée à partir de v_i', 'Euler : on suppose l’accélération constante pendant le pas : v(i+1) = v_i + a_i Δt.'),
      F('a_i × Δt, car l’accélération donne directement la vitesse', 'Il faut ajouter la vitesse déjà acquise v_i : on calcule un accroissement de vitesse.'),
      F('v_i + a_0 × Δt, avec l’accélération du départ à chaque pas', 'L’accélération change avec la vitesse : on la recalcule à chaque pas.'),
      F('v_i + v_i × Δt, car la vitesse croît proportionnellement', 'On multiplie l’accélération (en m/s²) par Δt, pas la vitesse.'),
    ] },
  { id: 'eul-ana-pas', domaine: DOM, titre: 'Le choix du pas',
    enonce: 'Pour une chute de constante de temps τ, on applique la méthode d’Euler deux fois : avec un pas Δt = frac(τ|20), puis avec un pas Δt = frac(τ|2). On compare chaque suite à la solution exacte.', q: 'Quelle affirmation est correcte ?', options: [
      V('le pas frac(τ|20) donne la suite la plus proche de la solution exacte, mais demande plus de calculs', 'Plus Δt est petit devant τ, meilleure est l’approximation « a constante pendant un pas ».'),
      F('le pas frac(τ|2) donne la suite la plus proche, car il y a moins d’erreurs cumulées', 'Moins de pas ne veut pas dire plus de précision : chaque pas approche davantage la courbe quand Δt est petit.'),
      F('les deux pas donnent exactement la solution, car l’équation est simple', 'Euler est une approximation : l’écart ne disparaît pas, il diminue avec Δt.'),
      F('les deux suites sont identiques, car elles partent de la même vitesse nulle', 'Elles partent du même point mais s’écartent ensuite de façon différente.'),
    ] },
];

export const EUL_VAL = [
  P({ id: 'eul-val-a0', domaine: DOM, niveau: 1, titre: 'Accélération au départ avec poussée', plausible: false,
    enonce: 'Un objet de masse 2,0 kg est lâché sans vitesse dans un fluide. Il déplace une masse de fluide m_f = 0,50 kg ; le frottement vaut f = k v avec k = 4,0 kg/s (g = 9,8 N/kg). Un élève écrit : « À t = 0, f = 0 donc l’accélération vaut g = 9,8 m/s². »',
    reperes: [['Masse m', '2,0 kg'], ['Fluide déplacé m_f', '0,50 kg'], ['Coefficient k', '4,0 kg/s']],
    ver: 'À t = 0 le frottement est nul, mais la poussée Π = m_f g agit : A = g (1 − frac(m_f|m)) = 9,8 × (1 − 0,25) = 7,4 m/s².',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il oublie la poussée d’Archimède : A = g (1 − frac(m_f|m)) ≈ 7,4 m/s²', 'Le frottement est nul à t = 0, mais la poussée retranche m_f g au poids.'),
      F('il oublie le frottement, qui n’est pas nul à t = 0', 'À t = 0, v = 0 donc f = k v = 0 : ce point est correct.'),
      F('il doit ajouter la poussée au poids : A = g (1 + frac(m_f|m))', 'La poussée est dirigée vers le haut : elle diminue l’accélération.'),
    ] }),
  P({ id: 'eul-val-euler', domaine: DOM, niveau: 2, titre: 'Deux pas de la méthode d’Euler', plausible: true,
    enonce: 'Un objet de masse 2,0 kg est lâché sans vitesse dans un fluide (m_f = 0,40 kg, k = 4,0 kg/s, g = 9,8 N/kg). Un élève calcule : « A = 9,8 × (1 − frac(0,40|2,0)) = 7,84 m/s². Avec Δt = 0,20 s : v₁ = 0 + 7,84 × 0,20 = 1,57 m/s. Puis τ = frac(2,0|4,0) = 0,50 s et a₁ = 7,84 − frac(1,57|0,50) = 4,70 m/s², donc v₂ = 1,57 + 4,70 × 0,20 = 2,51 m/s. »',
    reperes: [['Masse m', '2,0 kg'], ['Fluide déplacé m_f', '0,40 kg'], ['Coefficient k', '4,0 kg/s'], ['Pas Δt', '0,20 s']],
    ver: 'Tous les calculs sont corrects (v₂ ≈ 2,5 m/s) ; la vitesse limite vaut 3,9 m/s : l’ordre de grandeur est cohérent.',
    q2: 'Pourquoi a₁ est-elle plus petite que a₀ ?',
    options: [
      V('parce que la vitesse a augmenté, donc le frottement k v est devenu non nul', 'a = A − frac(v|τ) diminue quand v augmente : l’objet accélère de moins en moins.'),
      F('parce que la poussée d’Archimède a augmenté pendant le pas', 'La poussée Π = m_f g est constante : elle ne change pas avec la vitesse.'),
      F('parce que le pas Δt a été divisé par deux', 'Le pas est constant : c’est la vitesse qui change.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const G = 9.8, fr = x => String(x).replace('.', ',');
const gen = () => { let p; do { p = { m: tire([1.0, 2.0, 2.5, 4.0]), mf: tire([0.2, 0.4, 0.5]), k: tire([2.0, 2.5, 4.0, 5.0]), H: tire([0.5, 1.0, 2.0]) }; } while (p.mf > 0.45 * p.m); return p; };
const genEuler = () => { let p; do { p = { ...gen(), dt: tire([0.1, 0.2, 0.25, 0.5]) }; } while (p.dt > 0.6 * p.m / p.k); return p; };
const toks = p => ({
  m: tok(`${fr(p.m.toFixed(1))} kg`, 'Masse de l’objet', p.m, 'kg'), mf: tok(`${fr(p.mf.toFixed(1))} kg`, 'Masse de fluide déplacé', p.mf, 'kg'), k: tok(`${fr(p.k.toFixed(1))} kg/s`, 'Coefficient de frottement', p.k, 'kg/s'),
  g: tok('9,8 N/kg', 'Intensité de la pesanteur', G, 'N/kg'), H: tok(`${fr(p.H.toFixed(1))} m`, 'Hauteur du récipient', p.H, 'm'), dt: tok(`${fr((p.dt ?? 0.2).toFixed(2))} s`, 'Pas de la méthode d’Euler', p.dt ?? 0.2, 's'),
});
export const EUL_SAPP = [
  {
    id: 'eul-sapp-lim', domaine: DOM, titre: 'Un objet lâché dans un fluide : accélération initiale et vitesse limite', noms: ['Accélération initiale', 'Vitesse limite'],
    gen,
    build: epure((p, q) => {
      const tokens = toks(p);
      const debut = ['Un objet de masse ', T('m'), ' est lâché sans vitesse dans un récipient de hauteur ', T('H'), ' rempli d’un fluide. Il déplace une masse de fluide ', T('mf'), ' ; le frottement vaut f = k v avec k = ', T('k'), ' ; g = ', T('g'), '. '];
      if (q === 0) return { tokens, derivees: ['A = g (1 − frac(m_f|m))'], texte: [...debut, 'Quelle est l’accélération de l’objet à l’instant du lâcher, en m/s² ?'], utiles: ['m', 'mf', 'g'],
        raisons: { H: 'La hauteur du récipient ne sert pas ici.', k: 'À t = 0 la vitesse est nulle : le frottement f = k v est nul, k ne sert pas.' },
        cherche: { bonne: 'L’accélération de l’objet à t = 0 (en m/s²)', faux: ['La vitesse limite de l’objet (en m/s)', 'La poussée d’Archimède (en N)', 'La constante de temps (en s)'] },
        manque: null, solution: { txt: 'A = g (1 − frac(m_f|m))', val: G * (1 - p.mf / p.m), u: 'm/s²' } };
      return { tokens, derivees: ['k v_lim = (m − m_f) g'], texte: [...debut, 'Quelle est la vitesse limite de l’objet, en m/s ?'], utiles: ['m', 'mf', 'k', 'g'],
        raisons: { H: 'La hauteur du récipient ne sert pas pour la vitesse limite.' },
        cherche: { bonne: 'La vitesse limite de l’objet (en m/s)', faux: ['La constante de temps (en s)', 'Le poids de l’objet (en N)', 'L’accélération initiale (en m/s²)'] },
        manque: null, solution: { txt: 'v_lim = frac((m − m_f) g|k)', val: (p.m - p.mf) * G / p.k, u: 'm/s' } };
    }),
  },
  {
    id: 'eul-sapp-euler', domaine: DOM, titre: 'Un objet lâché dans un fluide : méthode d’Euler', noms: ['Premier pas d’Euler', 'Deuxième pas d’Euler'],
    gen: genEuler,
    build: epure((p, q) => {
      const tokens = toks(p);
      const A = G * (1 - p.mf / p.m), tau = p.m / p.k, v1 = A * p.dt, a1 = A - v1 / tau;
      const debut = ['Un objet de masse ', T('m'), ' est lâché sans vitesse dans un récipient de hauteur ', T('H'), ' rempli d’un fluide ; masse de fluide déplacé ', T('mf'), ', frottement f = k v avec k = ', T('k'), ', g = ', T('g'), '. On calcule la vitesse par la méthode d’Euler avec un pas Δt = ', T('dt'), '. '];
      if (q === 0) return { tokens, derivees: ['A = g (1 − frac(m_f|m))', 'v₁ = A Δt'], texte: [...debut, 'Quelle est la vitesse à la date t = Δt (premier pas), en m/s ?'], utiles: ['m', 'mf', 'g', 'dt'],
        raisons: { H: 'La hauteur du récipient ne sert pas ici.', k: 'Au premier pas v = 0 : le frottement est nul, k ne sert pas.' },
        cherche: { bonne: 'La vitesse à la date Δt (en m/s)', faux: ['La vitesse limite de l’objet (en m/s)', 'L’accélération initiale (en m/s²)', 'La constante de temps (en s)'] },
        manque: null, solution: { txt: 'v₁ = A × Δt', val: v1, u: 'm/s' } };
      return { tokens, derivees: ['A = g (1 − frac(m_f|m))', 'τ = frac(m|k)', 'a₁ = A − frac(v₁|τ)', 'v₂ = v₁ + a₁ Δt'], texte: [...debut, 'Quelle est la vitesse à la date t = 2 Δt (deuxième pas), en m/s ?'], utiles: ['m', 'mf', 'k', 'g', 'dt'],
        raisons: { H: 'La hauteur du récipient ne sert pas ici.' },
        cherche: { bonne: 'La vitesse à la date 2 Δt (en m/s)', faux: ['La vitesse à la date Δt (en m/s)', 'La vitesse limite de l’objet (en m/s)', 'L’accélération au deuxième pas (en m/s²)'] },
        manque: null, solution: { txt: 'v₂ = v₁ + a₁ Δt', val: v1 + a1 * p.dt, u: 'm/s' } };
    }),
  },
];
