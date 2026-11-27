// Exercices ANA, VAL et S'APP de la simulation 318 « Pouvoir rotatoire, loi de Biot et excès énantiomérique » (terminale STL, SPCL, Chimie et développement durable). Préfixe : biot-.
// Capacités visées (jamais affichées) : déterminer l'excès énantiomérique à partir de la valeur de l'activité optique d'un mélange ; exploiter la loi de Biot.
import * as M from './biotModele.js';
const DOM = 'Pouvoir rotatoire et loi de Biot';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const BIOT_ANA = [
  { id: 'biot-ana-longueur', domaine: DOM, titre: 'Doubler la longueur de la cuve',
    enonce: 'Une solution d’un énantiomère pur donne un pouvoir rotatoire α = +4,0° dans une cuve de longueur L. On remplace la cuve par une cuve deux fois plus longue, sans changer la solution.', q: 'Que devient le pouvoir rotatoire mesuré ?', options: [
      F('il reste égal à +4,0° : seule la nature du composé compte', 'La longueur de la cuve intervient dans α = [α] × L × C.'),
      F('il est divisé par deux : α = +2,0°', 'Plus la lumière traverse de solution, plus le plan tourne : α augmente avec L.'),
      V('il double : α = +8,0°', 'α = [α] × L × C est proportionnel à L : L doublée, α doublé.'),
      F('il double et change de signe : α = −8,0°', 'Le signe de α dépend du composé (dextrogyre ou lévogyre), pas de la longueur de la cuve.'),
    ] },
  { id: 'biot-ana-dilution', domaine: DOM, titre: 'Diluer une solution',
    enonce: 'Une solution d’un énantiomère pur, de concentration C, donne α = −12° dans une cuve donnée. On la dilue avec de l’eau pour obtenir une solution de concentration C ÷ 4, puis on mesure dans la même cuve.', q: 'Quel pouvoir rotatoire mesure-t-on ?', options: [
      F('α = −48° : la dilution augmente la rotation', 'Diluer diminue la quantité de molécules traversées : |α| diminue.'),
      F('α = +3,0° : la dilution change le sens de rotation', 'La dilution ne change pas le sens de rotation du composé : α reste négatif.'),
      F('α = 0° : une solution diluée n’est plus active', 'Une solution diluée reste optiquement active : |α| est seulement plus petit.'),
      V('α = −3,0° : α est proportionnel à C', 'α = [α] × L × C est proportionnel à C : C divisée par 4, α divisé par 4.'),
    ] },
  { id: 'biot-ana-racemique', domaine: DOM, titre: 'Un mélange à parts égales',
    enonce: 'On dissout 0,10 mol d’un énantiomère (+) et 0,10 mol de son énantiomère (−) dans un solvant inactif, puis on place la solution dans un polarimètre.', q: 'Quel est le pouvoir rotatoire de ce mélange ?', options: [
      F('le double de celui de l’énantiomère (+) seul', 'Les rotations s’ajoutent algébriquement : celle du (−) est de signe opposé et ne s’ajoute pas en valeur absolue.'),
      V('nul : les deux rotations opposées se compensent', 'Quantités égales, rotations opposées : α = 0, c’est un mélange racémique.'),
      F('celui de l’énantiomère (+) seul, car le (−) ne tourne pas le plan', 'L’énantiomère (−) est actif lui aussi, avec une rotation opposée à celle du (+).'),
      F('la moitié de celui de l’énantiomère (+) seul', 'La rotation ne vaut pas la moitié : la contribution du (−) annule exactement celle du (+).'),
    ] },
  { id: 'biot-ana-enantiomere', domaine: DOM, titre: 'Le pouvoir rotatoire de l’énantiomère',
    enonce: 'L’énantiomère (+) d’un composé a un pouvoir rotatoire spécifique [α] = +30 °·dm⁻¹·g⁻¹·mL, mesuré dans des conditions données.', q: 'Quel est le pouvoir rotatoire spécifique de son énantiomère (−) dans les mêmes conditions ?', options: [
      V('−30 : même valeur absolue, signe opposé', 'Deux énantiomères ont des pouvoirs rotatoires spécifiques opposés : +30 et −30.'),
      F('+30 : deux énantiomères ont le même pouvoir rotatoire', 'Les deux énantiomères tournent le plan en sens opposés : leurs [α] sont de signes opposés.'),
      F('0 : seul l’énantiomère (+) est optiquement actif', 'Les deux énantiomères sont optiquement actifs.'),
      F('−60 : le pouvoir rotatoire de l’image dans un miroir est doublé', 'Les valeurs absolues sont égales : l’image dans un miroir ne double pas le pouvoir rotatoire.'),
    ] },
];

export const BIOT_VAL = [
  P({ id: 'biot-val-cm', domaine: DOM, niveau: 2, titre: 'Un pouvoir rotatoire calculé trop vite', plausible: false,
    enonce: 'Une solution d’un énantiomère pur, de concentration C = 0,10 g/mL, est placée dans une cuve de 10 cm ; son pouvoir rotatoire spécifique est [α] = +40 °·dm⁻¹·g⁻¹·mL. Un élève calcule α = 40 × 10 × 0,10 = +40° et annonce : « le plan de polarisation tourne de 40° ».',
    reperes: [['[α]', '+40 °·dm⁻¹·g⁻¹·mL'], ['C', '0,10 g/mL'], ['Longueur de la cuve', '10 cm']],
    ver: 'La cuve mesure 10 cm = 1,0 dm : α = 40 × 1,0 × 0,10 = +4,0°. L’élève a utilisé la longueur en centimètres, alors que la loi de Biot demande des décimètres.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a utilisé la longueur de la cuve en cm au lieu de dm', 'La loi de Biot s’écrit avec L en dm : 10 cm = 1,0 dm, donc α = +4,0°.'),
      F('il a oublié de diviser par la concentration', 'On multiplie par C : α = [α] × L × C.'),
      F('le résultat devrait être négatif, car la solution est diluée', 'Le signe de α est celui de [α] : ici positif, quel que soit C.'),
    ] }),
  P({ id: 'biot-val-ee', domaine: DOM, niveau: 2, titre: 'Un excès énantiomérique annoncé', plausible: false,
    enonce: 'Une synthèse fournit un mélange contenant 70 % de l’énantiomère (+) et 30 % de l’énantiomère (−). Le chimiste annonce : « l’excès énantiomérique de mon produit est de 70 % ».',
    reperes: [['Énantiomère (+)', '70 %'], ['Énantiomère (−)', '30 %']],
    ver: 'e.e. = |70 − 30| ÷ (70 + 30) × 100 = 40 %. La valeur de 70 % est la proportion du (+), pas l’excès énantiomérique.',
    q2: 'Quelle est l’erreur du chimiste ?',
    options: [
      F('un excès énantiomérique ne peut pas s’exprimer en pourcentage', 'L’excès énantiomérique s’exprime bien en pourcentage : 0 % pour un racémique, 100 % pour un énantiomère pur.'),
      V('il a donné la proportion du (+) au lieu de la différence entre les deux énantiomères', 'L’excès est |n₊ − n₋| ÷ (n₊ + n₋) × 100 = 40 % : on soustrait la part de (−).'),
      F('il aurait dû multiplier par le pouvoir rotatoire spécifique', 'Le pouvoir rotatoire n’intervient pas dans la définition de l’excès énantiomérique.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const nbf = M.nbf;
export const BIOT_SAPP = [
  {
    id: 'biot-sapp-alpha', domaine: DOM, titre: 'Loi de Biot : pouvoir rotatoire et concentration', noms: ['Pouvoir rotatoire α', 'Concentration de la solution'],
    gen: () => { const sub = M.SUBS[tire(M.LISTE)], Lc = tire([10, 20, 25]), C = tire([0.04, 0.05, 0.08, 0.1, 0.12, 0.15, 0.2]); return { A: sub.A, M: sub.M, Lc, C, alpha: Math.round(sub.A * Lc / 10 * C * 100) / 100 }; },
    build: epure((p, q) => {
      const tokens = {
        A: tok(`+${p.A} °·dm⁻¹·g⁻¹·mL`, 'Pouvoir rotatoire spécifique', p.A, ''), L: tok(`${p.Lc} cm`, 'Longueur de la cuve', p.Lc / 10, 'dm'), C: tok(`${nbf(p.C, 2)} g/mL`, 'Concentration massique', p.C, 'g/mL'),
        alpha: tok(`${M.fmtDeg(p.alpha, 2)}°`, 'Pouvoir rotatoire mesuré', p.alpha, '°'), Mm: tok(`${p.M} g/mol`, 'Masse molaire du composé', p.M, 'g/mol'), temp: tok('20 °C', 'Température de la mesure', 20, '°C'),
      };
      const raisons = { Mm: 'La masse molaire ne sert pas ici : la loi de Biot est écrite avec la concentration massique, en g/mL.', temp: 'La température est une condition de la mesure, déjà prise en compte dans la valeur de [α].' };
      return q === 0
        ? { tokens, derivees: ['α = [α] × L × C'], texte: ['Un énantiomère dextrogyre pur, de pouvoir rotatoire spécifique ', T('A'), ' et de masse molaire ', T('Mm'), ', est dissous à la concentration ', T('C'), '. La solution est placée à ', T('temp'), ' dans une cuve de longueur ', T('L'), '. Quel pouvoir rotatoire α mesure-t-on ?'], utiles: ['A', 'L', 'C'],
          raisons, cherche: { bonne: 'Le pouvoir rotatoire α de la solution (en °)', faux: ['La concentration de la solution', 'La longueur de la cuve', 'Le pouvoir rotatoire spécifique du composé'] }, manque: null, solution: { txt: '[α] × L × C', val: p.A * p.Lc / 10 * p.C, u: '°' } }
        : { tokens, derivees: ['C = α ÷ ([α] × L)'], texte: ['Un énantiomère dextrogyre pur, de pouvoir rotatoire spécifique ', T('A'), ' et de masse molaire ', T('Mm'), ', est dissous. La solution est placée à ', T('temp'), ' dans une cuve de longueur ', T('L'), ' et le polarimètre indique ', T('alpha'), '. Quelle est la concentration massique de la solution ?'], utiles: ['alpha', 'A', 'L'],
          raisons, cherche: { bonne: 'La concentration massique de la solution (en g/mL)', faux: ['Le pouvoir rotatoire α de la solution', 'La longueur de la cuve', 'La masse molaire du composé'] }, manque: null, solution: { txt: 'α ÷ ([α] × L)', val: p.alpha / (p.A * p.Lc / 10), u: 'g/mL' } };
    }),
  },
  {
    id: 'biot-sapp-ee', domaine: DOM, titre: 'Excès énantiomérique d’un mélange', noms: ['Excès énantiomérique à partir des quantités', 'Excès énantiomérique à partir de α'],
    gen: () => { const [np, nm] = tire([[0.08, 0.02], [0.09, 0.01], [0.07, 0.03], [0.06, 0.04]]), apur = tire([5, 8, 10, 12]), ee = Math.round(Math.abs(np - nm) / (np + nm) * 100); return { np, nm, apur, ee, amel: apur * ee / 100, L: tire([1, 2]), C: tire([0.1, 0.2]), V: tire([50, 100, 250]) }; },
    build: epure((p, q) => {
      const tokens = {
        np: tok(`${nbf(p.np, 2)} mol`, 'Quantité de l’énantiomère (+)', p.np, 'mol'), nm: tok(`${nbf(p.nm, 2)} mol`, 'Quantité de l’énantiomère (−)', p.nm, 'mol'), V: tok(`${p.V} mL`, 'Volume de la solution', p.V, 'mL'),
        apur: tok(`+${nbf(p.apur, 1)}°`, 'Pouvoir rotatoire de l’énantiomère (+) pur', p.apur, '°'), amel: tok(`+${nbf(p.amel, 2)}°`, 'Pouvoir rotatoire du mélange', p.amel, '°'),
        L: tok(`${nbf(p.L, 1)} dm`, 'Longueur de la cuve', p.L, 'dm'), C: tok(`${nbf(p.C, 2)} g/mL`, 'Concentration totale', p.C, 'g/mL'),
      };
      return q === 0
        ? { tokens, derivees: ['e.e. = |n₊ − n₋| ÷ (n₊ + n₋) × 100'], texte: ['Un mélange contient ', T('np'), ' de l’énantiomère (+) et ', T('nm'), ' de l’énantiomère (−), dissous dans ', T('V'), ' de solution. Quel est l’excès énantiomérique du mélange ?'], utiles: ['np', 'nm'],
          raisons: { V: 'Le volume de solution n’intervient pas : l’excès compare seulement les quantités des deux énantiomères.' }, cherche: { bonne: 'L’excès énantiomérique du mélange (en %)', faux: ['Le pouvoir rotatoire du mélange', 'La concentration de l’énantiomère (+)', 'Le volume de solution'] }, manque: null, solution: { txt: '|n₊ − n₋| ÷ (n₊ + n₋) × 100', val: p.ee, u: '%' } }
        : { tokens, derivees: ['e.e. = |α| ÷ |α pur| × 100'], texte: ['L’énantiomère (+) pur donne ', T('apur'), ' dans une cuve de ', T('L'), ', à la concentration ', T('C'), '. Un mélange des deux énantiomères, placé dans la même cuve à la même concentration totale, donne ', T('amel'), '. Quel est l’excès énantiomérique du mélange ?'], utiles: ['apur', 'amel'],
          raisons: { L: 'La longueur de la cuve est la même pour les deux mesures : elle se simplifie dans le rapport.', C: 'La concentration totale est la même pour les deux mesures : elle se simplifie dans le rapport.' }, cherche: { bonne: 'L’excès énantiomérique du mélange (en %)', faux: ['Le pouvoir rotatoire spécifique du composé', 'La concentration de l’énantiomère (+)', 'La longueur de la cuve'] }, manque: null, solution: { txt: '|α| ÷ |α pur| × 100', val: p.amel / p.apur * 100, u: '%' } };
    }),
  },
];
