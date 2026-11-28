// Exercices ANA, VAL et S'APP de la simulation 312 « Chaud, froid : solubilité, température et recristallisation » (terminale STL, SPCL, Chimie et développement durable). Préfixe : tsol-.
// Capacités visées (jamais affichées) : lire et exploiter une courbe de solubilité ; prévoir la saturation et la masse de solide qui cristallise ; déterminer une masse d'eau minimale et un rendement de recristallisation.
// Valeurs de solubilité : modèle tsolModele.js (tables usuelles, g pour 100 g d'eau). Solides : NH4Cl et Li2CO3.
import * as M from './tsolModele.js';
const DOM = 'Solubilité, température et recristallisation';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });
const A = M.SOLIDES.nh4cl;

export const TSOL_ANA = [
  { id: 'tsol-ana-refroidir', domaine: DOM, titre: 'Refroidir une solution saturée',
    enonce: 'La solubilité du chlorure d’ammonium NH₄Cl dans l’eau augmente avec la température. On prépare une solution saturée de NH₄Cl à 80 °C, puis on la laisse refroidir jusqu’à 20 °C.', q: 'Que se passe-t-il pendant le refroidissement ?', options: [
      V('des cristaux de NH₄Cl se déposent', 'À 20 °C, l’eau dissout moins de NH₄Cl qu’à 80 °C : l’excès ne reste pas dissous et cristallise.'),
      F('rien : la solution reste saturée et limpide', 'Une solution saturée à 80 °C contient plus de solide dissous que ce que l’eau peut garder à 20 °C : le surplus se dépose.'),
      F('le solide se dissout davantage, car l’eau est plus dense', 'C’est l’inverse : pour NH₄Cl la solubilité diminue quand on refroidit.'),
      F('la solution devient non saturée', 'En refroidissant, on perd de la capacité de dissolution : on passe au-dessus de la courbe, pas en dessous.'),
    ] },
  { id: 'tsol-ana-chauffer', domaine: DOM, titre: 'Chauffer une solution de carbonate de lithium',
    enonce: 'Le carbonate de lithium Li₂CO₃ est l’un des rares solides dont la solubilité dans l’eau diminue quand la température augmente. Une solution saturée de Li₂CO₃ est préparée à 20 °C, puis chauffée jusqu’à 80 °C.', q: 'Qu’observe-t-on pendant le chauffage ?', options: [
      V('un dépôt de cristaux de Li₂CO₃', 'À 80 °C, l’eau dissout moins de Li₂CO₃ qu’à 20 °C : l’excès précipite.'),
      F('la solution devient non saturée : tout reste dissous', 'Ce serait vrai pour un solide dont la solubilité augmente avec T, pas pour Li₂CO₃.'),
      F('aucun changement : la solubilité ne dépend pas de T', 'La solubilité dépend de la température ; pour Li₂CO₃ elle diminue quand T augmente.'),
      F('le solide se dissout davantage, il faut ajouter de l’eau', 'Au contraire : chauffer réduit la solubilité de Li₂CO₃.'),
    ] },
  { id: 'tsol-ana-eau', domaine: DOM, titre: 'Eau minimale selon la température',
    enonce: 'On veut dissoudre une masse donnée de chlorure d’ammonium dans la plus petite masse d’eau possible. Sa solubilité augmente avec la température. On compare deux températures de travail : 20 °C et 60 °C.', q: 'Comment la masse d’eau minimale à 60 °C se compare-t-elle à celle à 20 °C ?', options: [
      V('elle est plus petite à 60 °C', 'À 60 °C, 100 g d’eau dissolvent davantage de solide : il faut moins d’eau pour dissoudre la même masse.'),
      F('elle est plus grande à 60 °C', 'Plus s est grande, moins il faut d’eau : m(eau) = frac(100 × m(solide)|s).'),
      F('elle est la même : la masse de solide est la même', 'La masse de solide est la même, mais la solubilité change : la masse d’eau minimale change aussi.'),
      F('on ne peut pas comparer sans connaître la masse de solide', 'Le rapport des deux masses d’eau ne dépend que des solubilités s(20 °C) et s(60 °C).'),
    ] },
  { id: 'tsol-ana-proportion', domaine: DOM, titre: 'Doubler la masse d’eau',
    enonce: 'Une solution saturée de chlorure d’ammonium à 80 °C, préparée avec 100 g d’eau, donne une certaine masse de cristaux quand on la refroidit à 20 °C. On refait la même expérience avec 200 g d’eau, toujours saturée à 80 °C.', q: 'Comment la masse de cristaux obtenue évolue-t-elle ?', options: [
      V('elle double : elle est proportionnelle à la masse d’eau', 'La masse de cristaux est frac((s(80 °C) − s(20 °C)) × m(eau)|100) : elle est proportionnelle à m(eau).'),
      F('elle ne change pas : s ne dépend pas de la masse d’eau', 's ne dépend pas de m(eau), mais la masse dissoute (et donc déposée) en dépend : elle est proportionnelle à m(eau).'),
      F('elle est divisée par deux, car la solution est plus diluée', 'Les deux solutions sont saturées à 80 °C : celle à 200 g d’eau contient deux fois plus de solide dissous.'),
      F('elle est multipliée par quatre', 'La proportionnalité est simple : deux fois plus d’eau, deux fois plus de cristaux.'),
    ] },
];

export const TSOL_VAL = [
  P({ id: 'tsol-val-eau', domaine: DOM, niveau: 2, titre: 'Masse de cristaux et masse d’eau', plausible: false,
    enonce: 'Une solution saturée de chlorure d’ammonium est préparée à 80 °C avec 200 g d’eau, puis refroidie à 20 °C. Un élève calcule : « s(80 °C) − s(20 °C) = 65,6 − 37,2 = 28,4 g de cristaux. »',
    reperes: [['Solubilité du chlorure d’ammonium', '80 °C : 65,6 g ; 20 °C : 37,2 g (masses dissoutes à saturation, d’après les tables)']],
    ver: 'Les solubilités sont données pour 100 g d’eau : il faut multiplier la différence par frac(m(eau)|100) = 2. Les cristaux pèsent 28,4 × 2 = 56,8 g. Le résultat de l’élève correspond à 100 g d’eau seulement.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a oublié de multiplier par frac(m(eau)|100)', 'La différence 28,4 g est valable pour 100 g d’eau ; avec 200 g d’eau, on obtient le double.'),
      F('il a inversé s(80 °C) et s(20 °C)', 'Il a bien soustrait la plus petite solubilité à la plus grande : le signe est correct.'),
      F('il a oublié que la solution reste saturée à 20 °C', 'Il soustrait justement la solubilité à 20 °C : cet aspect est pris en compte.'),
    ] }),
  P({ id: 'tsol-val-rendement', domaine: DOM, niveau: 2, titre: 'Rendement d’une recristallisation', plausible: false,
    enonce: 'On refroidit une solution saturée de chlorure d’ammonium de 80 °C à 20 °C. Un élève calcule le rendement : « η = frac(65,6 − 37,2|37,2) = 0,76, soit 76 % de solide récupéré. »',
    reperes: [['s(80 °C)', '65,6 g pour 100 g d’eau'], ['s(20 °C)', '37,2 g pour 100 g d’eau']],
    ver: 'Le rendement compare la masse récupérée à la masse initialement dissoute à 80 °C : η = frac(65,6 − 37,2|65,6) = 0,43, soit 43 %. Diviser par s(20 °C) donne un nombre qui n’a pas de sens physique (il pourrait dépasser 100 %).',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a divisé par s(20 °C) au lieu de s(80 °C)', 'Le rendement se rapporte à la masse initialement dissoute, celle à la température la plus haute : s(T₁).'),
      F('il a fait une erreur de signe dans la différence', 'La différence 65,6 − 37,2 = 28,4 est correcte.'),
      F('il a oublié de multiplier par la masse d’eau', 'La masse d’eau se simplifie dans le rapport : le rendement n’en dépend pas.'),
    ] }),
];

// ---------- S'APP ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const g1 = v => M.nbf(v, 1);
export const TSOL_SAPP = [
  {
    id: 'tsol-sapp-cristaux', domaine: DOM, titre: 'Refroidir une solution saturée : masse dissoute et masse de cristaux', noms: ['Masse de chlorure d’ammonium dissoute à saturation à la température la plus haute', 'Masse de cristaux obtenue au refroidissement'],
    gen: () => ({ T1: tire([60, 80, 100]), T2: tire([0, 20, 40]), mEau: tire([150, 200, 250, 400]) }),
    build: epure((p, q) => {
      const s1 = M.sol(A, p.T1), s2 = M.sol(A, p.T2), m1 = s1 * p.mEau / 100, cr = (s1 - s2) * p.mEau / 100;
      const tokens = {
        me: tok(`${p.mEau} g`, 'Masse d’eau', p.mEau, 'g'), T1: tok(`${p.T1} °C`, 'Température de préparation de la solution saturée', p.T1, '°C'), T2: tok(`${p.T2} °C`, 'Température finale', p.T2, '°C'),
        s1: tok(`${g1(s1)} g`, `Solubilité du chlorure d’ammonium à ${p.T1} °C (pour 100 g d’eau)`, s1, 'g'), s2: tok(`${g1(s2)} g`, `Solubilité du chlorure d’ammonium à ${p.T2} °C (pour 100 g d’eau)`, s2, 'g'),
      };
      const debut = ['On prépare une solution saturée de chlorure d’ammonium dans ', T('me'), ' d’eau à ', T('T1'), ', puis on la refroidit à ', T('T2'), '. Solubilités (pour 100 g d’eau) : ', T('s1'), ' à ', `${p.T1} °C`, ' et ', T('s2'), ' à ', `${p.T2} °C`, '. '];
      if (q === 0) return { tokens, derivees: ['m dissoute = frac(s(T₁) × m(eau)|100)'], texte: [...debut, 'Quelle masse de chlorure d’ammonium est dissoute dans la solution saturée à la température la plus haute ?'], utiles: ['me', 's1'],
        raisons: { T1: 'La température ne sert pas : la solubilité à cette température est donnée.', T2: 'La température finale ne sert pas pour cette question.', s2: 'La solubilité à la température finale ne sert pas pour cette question.' },
        cherche: { bonne: 'La masse de NH₄Cl dissoute à saturation à la température la plus haute (en g)', faux: ['La masse de cristaux qui se déposent au refroidissement', 'La masse qui reste dissoute à la température finale', 'La masse d’eau minimale pour dissoudre cette quantité'] },
        manque: null, solution: { txt: 'm = frac(s(T₁) × m(eau)|100)', val: m1, u: 'g' } };
      return { tokens, derivees: ['cristaux = frac((s(T₁) − s(T₂)) × m(eau)|100)'], texte: [...debut, 'Quelle masse de cristaux se dépose au refroidissement ?'], utiles: ['me', 's1', 's2'],
        raisons: { T1: 'La température ne sert pas : les solubilités correspondantes sont données.', T2: 'La température ne sert pas : la solubilité à cette température est donnée.' },
        cherche: { bonne: 'La masse de cristaux qui se déposent au refroidissement (en g)', faux: ['La masse dissoute à saturation à la température la plus haute', 'La masse qui reste dissoute à la température finale', 'Le rendement de la recristallisation (en %)'] },
        manque: null, solution: { txt: 'cristaux = frac((s(T₁) − s(T₂)) × m(eau)|100)', val: cr, u: 'g' } };
    }),
  },
  {
    id: 'tsol-sapp-eaumin', domaine: DOM, titre: 'Recristallisation : eau minimale et rendement', noms: ['Masse d’eau minimale pour dissoudre le solide à chaud', 'Rendement de la recristallisation'],
    gen: () => ({ T1: tire([60, 80, 100]), T2: tire([0, 20]), m: tire([40, 60, 80, 120, 150]) }),
    build: epure((p, q) => {
      const s1 = M.sol(A, p.T1), s2 = M.sol(A, p.T2), eau = 100 * p.m / s1, eta = (s1 - s2) / s1;
      const tokens = {
        m: tok(`${p.m} g`, 'Masse de chlorure d’ammonium à recristalliser', p.m, 'g'), T1: tok(`${p.T1} °C`, 'Température de dissolution', p.T1, '°C'), T2: tok(`${p.T2} °C`, 'Température de refroidissement', p.T2, '°C'),
        s1: tok(`${g1(s1)} g`, `Solubilité du chlorure d’ammonium à ${p.T1} °C (pour 100 g d’eau)`, s1, 'g'), s2: tok(`${g1(s2)} g`, `Solubilité du chlorure d’ammonium à ${p.T2} °C (pour 100 g d’eau)`, s2, 'g'),
      };
      const debut = ['On purifie ', T('m'), ' de chlorure d’ammonium impur par recristallisation : dissolution à ', T('T1'), ' dans le minimum d’eau, puis refroidissement à ', T('T2'), '. Solubilités (pour 100 g d’eau) : ', T('s1'), ' à ', `${p.T1} °C`, ' et ', T('s2'), ' à ', `${p.T2} °C`, '. '];
      if (q === 0) return { tokens, derivees: ['m(eau) = frac(100 × m(solide)|s)(T₁)'], texte: [...debut, 'Quelle est la masse d’eau minimale à utiliser pour dissoudre tout le solide à chaud ?'], utiles: ['m', 's1'],
        raisons: { T1: 'La température ne sert pas : la solubilité à cette température est donnée.', T2: 'La température finale ne sert pas pour cette question.', s2: 'La solubilité à la température finale ne sert pas pour cette question.' },
        cherche: { bonne: 'La masse d’eau minimale pour dissoudre le solide à chaud (en g)', faux: ['La masse de cristaux obtenue après refroidissement', 'La masse de solide qui reste dissoute à froid', 'La masse d’eau qui dissout le solide à froid'] },
        manque: null, solution: { txt: 'm(eau) = frac(100 × m(solide)|s)(T₁)', val: eau, u: 'g' } };
      return { tokens, derivees: ['η = frac(s(T₁) − s(T₂)|s)(T₁)'], texte: [...debut, 'Quel est le rendement théorique de la recristallisation (rapport de la masse de cristaux à la masse de solide dissoute à chaud), en pourcentage ?'], utiles: ['s1', 's2'],
        raisons: { m: 'La masse de solide se simplifie dans le rapport : le rendement n’en dépend pas.', T1: 'La température ne sert pas : les solubilités sont données.', T2: 'La température ne sert pas : les solubilités sont données.' },
        cherche: { bonne: 'Le rendement théorique de la recristallisation (en %)', faux: ['La masse de cristaux obtenue (en g)', 'La masse d’eau minimale (en g)', 'La masse qui reste dissoute à froid (en g)'] },
        manque: null, solution: { txt: 'η = frac(s(T₁) − s(T₂)|s)(T₁)', val: eta * 100, u: '%' } };
    }),
  },
];
