// Exercices ANA (prévoir sans calculer), VAL (plausible ?) et S'APP (repérer les données utiles) de la simulation 218
// « Thixotropie : le test 3ITT » (BTS MDC, formulation). Préfixe d'identifiants : itt- ; domaine « Rhéologie ».
// Branchés dans AtelierAnalyserBanque.js (PREVOIR), AtelierValiderBanque.js et AtelierDonneesBanque.js.
// La famille REA (calculs) est dans Itt3Realiser.jsx. Capacité visée : identifier un comportement thixotrope et
// évaluer la régénération de la structure d'une peinture après cisaillement.

const DOM = 'Rhéologie';
const NB = ' ';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = (o) => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });
const tire = (t) => t[Math.floor(Math.random() * t.length)];
const ms = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, NB);

// ───────────── ANA ─────────────
export const ITT_ANA = [
  { id: 'itt-ana-court', domaine: DOM, titre: 'Un intervalle 2 beaucoup plus court',
    enonce: 'Dans un test 3ITT, on raccourcit l’intervalle 2 (fort gradient) de 20 s à 2 s, sans rien changer d’autre.', q: 'Que prévoir pour la viscosité au tout début de l’intervalle 3 ?', options: [
      V('Plus élevée qu’avec 20 s : la structure est moins détruite', 'Un cisaillement plus court détruit moins la structure : la viscosité de départ de l’intervalle 3 est plus grande.'),
      F('Plus faible qu’avec 20 s, car le test dure moins longtemps', 'La durée totale ne fait pas baisser la viscosité : c’est la destruction de la structure qui compte.'),
      F('Identique, car la viscosité ne dépend que du gradient', 'Pour une peinture thixotrope, la viscosité dépend aussi de l’histoire du cisaillement.'),
      F('Nulle, car la peinture n’a pas eu le temps de couler', 'La viscosité ne peut pas être nulle : elle reste de l’ordre de grandeur de la viscosité à γ̇ fort.'),
    ] },
  { id: 'itt-ana-newton', domaine: DOM, titre: 'Un fluide newtonien soumis au 3ITT',
    enonce: 'On fait passer le test 3ITT (1 s⁻¹, puis 256 s⁻¹, puis 1 s⁻¹) à de l’huile de silicone, un fluide newtonien sans thixotropie.', q: 'Que prévoir pour la viscosité dans l’intervalle 3 par rapport à l’intervalle 1 ?', options: [
      V('Identique : aucune régénération à mesurer', 'Pour un newtonien, η ne dépend ni du gradient ni de l’histoire : elle reste constante pendant tout le test.'),
      F('Plus faible au début, puis elle remonte lentement', 'C’est le signe d’une thixotropie, que l’huile newtonienne ne possède pas.'),
      F('Beaucoup plus élevée, car l’huile a été cisaillée', 'Le cisaillement ne change pas la viscosité d’un fluide newtonien.'),
      F('Divisée par 256 comme au passage à l’intervalle 2', 'η d’un newtonien ne varie pas avec γ̇, donc pas non plus à l’intervalle 2.'),
    ] },
  { id: 'itt-ana-rapide', domaine: DOM, titre: 'Une régénération presque instantanée',
    enonce: 'Une peinture retrouve presque toute sa viscosité de repos quelques secondes après l’arrêt du fort cisaillement.', q: 'Quel défaut risque-t-on à l’application ?', options: [
      V('Des traces de pinceau : mauvais nivellement', 'La peinture se fige avant d’avoir pu s’étaler : les traces de pinceau restent visibles.'),
      F('Un affaissement : la peinture coule sur le mur', 'La coulure vient d’une régénération trop lente, pas trop rapide.'),
      F('Une sédimentation des pigments dans le pot', 'La sédimentation dépend du comportement aux très bas gradients, pas de la régénération après application.'),
      F('Aucun : plus la régénération est rapide, mieux c’est', 'Il faut un compromis : trop rapide gêne le nivellement.'),
    ] },
  { id: 'itt-ana-lente', domaine: DOM, titre: 'Une peinture qui met 60 s à se régénérer',
    enonce: 'Après un cisaillement fort, une peinture met environ 60 s pour atteindre la moitié de sa viscosité de repos.', q: 'Que peut-on prévoir sur un mur vertical ?', options: [
      V('Un risque d’affaissement : elle reste fluide trop longtemps', 'Tant que la structure n’est pas reconstruite, la viscosité est faible et la peinture peut couler.'),
      F('Un risque de traces de pinceau, car elle est trop visqueuse', 'Les traces de pinceau viennent d’une régénération trop rapide.'),
      F('Aucun risque : la viscosité finit toujours par remonter', 'Elle remonte, mais après avoir laissé la peinture couler.'),
      F('Un risque de sédimentation dans le pot', 'La sédimentation se joue au repos, dans le pot, pas après l’application.'),
    ] },
];

// ───────────── VAL ─────────────
export const ITT_VAL = [
  P({ id: 'itt-val-pourcent', domaine: DOM, niveau: 1, titre: 'Régénération : valeur et unité', plausible: false,
    enonce: 'Pour la peinture A, ηref = 16 210 mPa·s et η = 13 810 mPa·s 80 s après le début de l’intervalle 3. Un élève calcule 13 810 / 16 210 = 0,85 et écrit : « régénération de 0,85 % ».',
    reperes: [['Régénération (M1)', 'frac(η|ηref) × 100'], ['Régénération complète', '100 %'], ['Valeur obtenue', '0,85 : une fraction']],
    ver: 'Le rapport vaut bien 0,85, mais c’est une fraction : en pourcentage, la régénération est de 85 %. Écrire 0,85 % décrirait une peinture quasi non régénérée.',
    q2: 'Quelle erreur explique le résultat annoncé ?',
    options: [
      V('Il n’a pas multiplié le rapport par 100', 'La régénération en % est le rapport multiplié par 100 : 0,85 × 100 = 85 %.'),
      F('Il a divisé ηref par η au lieu de η par ηref', 'Il aurait trouvé 1,17 : ce n’est pas 0,85.'),
      F('Il a utilisé des mPa·s alors qu’il fallait des Pa·s', 'Le rapport de deux viscosités ne dépend pas de l’unité commune choisie.'),
    ] }),
  P({ id: 'itt-val-temps', domaine: DOM, niveau: 2, titre: 'Temps de régénération compté depuis 0', plausible: false,
    enonce: 'Pour la peinture A, la viscosité atteint 25 % de ηref à l’instant t = 48 s sur l’axe du temps. Un élève annonce : « le temps de régénération à 25 % est de 48 s, compté depuis le début de l’intervalle 3 ». L’intervalle 3 commence à t = 40 s.',
    reperes: [['Début de l’intervalle 3', 't = 40 s'], ['Durée de l’intervalle 3', '80 s'], ['Instant lu', 't = 48 s']],
    ver: 'Le temps de régénération se compte depuis le début de l’intervalle 3 : 48 − 40 = 8 s. L’élève a donné l’instant lu sur l’axe, pas la durée écoulée depuis la fin du fort cisaillement.',
    q2: 'Quelle est la bonne valeur du temps de régénération à 25 % ?',
    options: [
      V('8 s, soit 48 s moins 40 s', 'On retranche le début de l’intervalle 3 : 48 − 40 = 8 s.'),
      F('88 s, soit 48 s plus 40 s', 'On ne rajoute pas 40 s : l’instant 48 s est déjà compté depuis le début du test.'),
      F('48 s, comme lu sur l’axe', 'L’axe compte depuis le début du test, pas depuis le début de l’intervalle 3.'),
    ] }),
  P({ id: 'itt-val-pente', domaine: DOM, niveau: 2, titre: 'Pente de remontée de la viscosité', plausible: true,
    enonce: 'Pour la peinture A, la viscosité passe de 3 730 mPa·s à t = 47,6 s à 11 750 mPa·s à t = 66,7 s. Un élève calcule une pente de 420 mPa·s/s.',
    reperes: [['Pente (M3)', 'frac(Δη|Δt)'], ['Δη', '11 750 − 3 730 = 8 020 mPa·s'], ['Δt', '66,7 − 47,6 = 19,1 s']],
    ver: 'frac(8 020|19,1) ≈ 420 mPa·s/s : le calcul est correct, en mPa·s par seconde.',
    q2: 'Quel raisonnement est correct ?',
    options: [
      V('Cohérent : frac(8 020|19,1) ≈ 420 mPa·s par seconde', 'La pente est la variation de viscosité divisée par la durée.'),
      F('Pas cohérent : la pente vaut 8 020 mPa·s, sans division', 'Une pente est un rapport : il faut diviser Δη par Δt.'),
      F('Pas cohérent : une pente de viscosité ne peut pas être positive', 'Pendant la régénération, η augmente : la pente est positive.'),
    ] }),
];

// ───────────── S'APP ─────────────
const T = (id) => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff, quoi, use: { val, u } });
const epure = (f) => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some((t) => t && t.t === k))) }; };

export const ITT_SAPP = [
  {
    id: 'itt-sapp-m1', domaine: DOM, titre: 'Test 3ITT : quelles données pour la régénération ?', noms: ['Régénération à un instant donné (M1)', 'Temps de régénération (M2)'],
    gen: () => {
      const ref = tire([12000, 16200, 18500, 24600]);
      const part = tire([0.6, 0.7, 0.8, 0.9]);
      return { ref, eta: Math.round((ref * part) / 10) * 10, etaFin1: ref, gh: tire([100, 256, 400]), d2: tire([10, 20, 30]), cible: tire([25, 50]), tAbs: tire([46, 48, 52, 55]), T: tire([22.5, 22.8]) };
    },
    build: epure((p, q) => {
      const tokens = {
        ref: tok(`${ms(p.ref)}${NB}mPa·s`, 'Viscosité de référence (fin de l’intervalle 1)', p.ref, 'mPa·s'),
        eta: tok(`${ms(p.eta)}${NB}mPa·s`, 'Viscosité mesurée dans l’intervalle 3', p.eta, 'mPa·s'),
        gh: tok(`${p.gh}${NB}s⁻¹`, 'Gradient de l’intervalle 2', p.gh, 's⁻¹'),
        d2: tok(`${p.d2}${NB}s`, 'Durée de l’intervalle 2', p.d2, 's'),
        cible: tok(`${p.cible}${NB}%`, 'Pourcentage visé de ηref', p.cible, '%'),
        tAbs: tok(`${p.tAbs}${NB}s`, 'Instant lu sur l’axe du temps', p.tAbs, 's'),
        T: tok(`${String(p.T).replace('.', ',')}${NB}°C`, 'Température de la peinture', p.T, '°C'),
        d12: tok(`40${NB}s`, 'Début de l’intervalle 3', 40, 's'),
      };
      const debut = ['Une peinture passe un test 3ITT : l’intervalle 2 est à ', T('gh'), ' pendant ', T('d2'), ' ; la peinture est à ', T('T'), '. Sa viscosité de référence est ', T('ref'), '. '];
      const raisons = { gh: 'Le gradient de l’intervalle 2 sert à détruire la structure : il n’intervient pas dans ce calcul.', d2: 'La durée de l’intervalle 2 ne sert pas à évaluer la régénération.', T: 'La température reste voisine de la température ambiante : elle ne sert pas au calcul.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Dans l’intervalle 3, on mesure η = ', T('eta'), '. Quelle est la régénération en % de la viscosité de référence ?'], utiles: ['ref', 'eta'],
        raisons: { ...raisons, cible: 'Le pourcentage visé sert pour le temps de régénération (M2), pas pour M1.', tAbs: 'L’instant lu ne sert pas à calculer un pourcentage à partir d’une viscosité déjà mesurée.', d12: 'Le début de l’intervalle 3 sert à compter un temps, pas un pourcentage.' },
        cherche: { bonne: 'La régénération (M1) en pourcentage de ηref', faux: ['Le temps nécessaire pour atteindre 50 % de ηref', 'La pente de la courbe de viscosité', 'Le gradient de vitesse de l’intervalle 3'] },
        manque: null, solution: { txt: 'Régénération = frac(η|ηref) × 100', val: (p.eta / p.ref) * 100, u: '%' } };
      return { tokens, derivees: [], texte: [...debut, 'La viscosité atteint ', T('cible'), ' de ηref à l’instant ', T('tAbs'), ' sur l’axe ; l’intervalle 3 commence à ', T('d12'), '. Quel est le temps de régénération depuis le début de l’intervalle 3 ?'], utiles: ['tAbs', 'd12'],
        raisons: { ...raisons, ref: 'La viscosité de référence a servi à repérer l’instant ; il est déjà donné.', eta: 'Aucune viscosité n’est utile : l’instant est déjà lu.', cible: 'Le pourcentage a déjà servi à repérer l’instant sur la courbe.' },
        cherche: { bonne: 'Le temps de régénération (M2) depuis le début de l’intervalle 3', faux: ['La régénération en pourcentage à 80 s', 'La pente de la courbe de viscosité', 'La durée de l’intervalle 2'] },
        manque: null, solution: { txt: 'Temps = instant lu − début de l’intervalle 3', val: p.tAbs - 40, u: 's' } };
    }),
  },
  {
    id: 'itt-sapp-pente', domaine: DOM, titre: 'Pente de la courbe de viscosité (M3)', noms: ['Pente de remontée de la viscosité', 'Variation de viscosité sur la fenêtre'],
    gen: () => { const t1 = tire([45, 48, 50]); const e1 = tire([2650, 3730, 4200]); return { t1, t2: t1 + tire([15, 19, 25]), e1, e2: e1 + tire([6000, 8020, 9500]), ref: tire([16210, 24610]), gb: 1 }; },
    build: epure((p, q) => {
      const tokens = {
        t1: tok(`${p.t1}${NB}s`, 'Instant initial', p.t1, 's'), t2: tok(`${p.t2}${NB}s`, 'Instant final', p.t2, 's'),
        e1: tok(`${ms(p.e1)}${NB}mPa·s`, 'Viscosité initiale', p.e1, 'mPa·s'), e2: tok(`${ms(p.e2)}${NB}mPa·s`, 'Viscosité finale', p.e2, 'mPa·s'),
        ref: tok(`${ms(p.ref)}${NB}mPa·s`, 'Viscosité de référence', p.ref, 'mPa·s'), gb: tok(`${p.gb}${NB}s⁻¹`, 'Gradient de l’intervalle 3', p.gb, 's⁻¹'),
      };
      const debut = ['Dans l’intervalle 3 d’un test 3ITT (γ̇ = ', T('gb'), ', ηref = ', T('ref'), '), la viscosité passe de ', T('e1'), ' à l’instant ', T('t1'), ' à ', T('e2'), ' à l’instant ', T('t2'), '. '];
      const raisons = { gb: 'Le gradient est le même sur toute la fenêtre : il ne sert pas au calcul de la pente.', ref: 'ηref sert aux méthodes M1 et M2, pas à la pente M3.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la pente moyenne de la courbe de viscosité sur cette fenêtre ?'], utiles: ['e1', 'e2', 't1', 't2'], raisons,
        cherche: { bonne: 'La pente de remontée de la viscosité (M3)', faux: ['La régénération en pourcentage de ηref', 'Le temps pour atteindre 25 % de ηref', 'La viscosité de référence'] },
        manque: null, solution: { txt: 'Pente = frac(Δη|Δt)', val: (p.e2 - p.e1) / (p.t2 - p.t1), u: 'mPa·s/s' } };
      return { tokens, derivees: [], texte: [...debut, 'De combien la viscosité a-t-elle augmenté sur cette fenêtre ?'], utiles: ['e1', 'e2'], raisons: { ...raisons, t1: 'Les instants servent à calculer une durée, pas une variation de viscosité.', t2: 'Les instants servent à calculer une durée, pas une variation de viscosité.' },
        cherche: { bonne: 'La variation de viscosité entre les deux instants', faux: ['La pente moyenne de la courbe', 'La durée de la fenêtre', 'La part de ηref retrouvée'] },
        manque: null, solution: { txt: 'Variation = η finale − η initiale', val: p.e2 - p.e1, u: 'mPa·s' } };
    }),
  },
];
