// Exercices ANA, VAL et S'APP de la simulation 316 « Filtres passifs : passe-bas, passe-haut et fréquence de coupure » (terminale STL, SPCL, Systèmes et procédés). Préfixe : filt-.
// Capacités visées (jamais affichées) : exploiter des résultats expérimentaux pour caractériser un filtre (facteur d'amplification, nature, bande passante).
import * as M from './filtreModele.js';
const DOM = 'Filtrage et amplification de tension';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const FILT_ANA = [
  { id: 'filt-ana-nature', domaine: DOM, titre: 'Reconnaître la nature d’un filtre',
    enonce: 'Un filtre RC est alimenté par une tension sinusoïdale d’amplitude constante. À 100 Hz, la tension de sortie a presque la même amplitude que celle d’entrée. À 50 kHz, son amplitude est devenue très petite.', q: 'Quelle est la nature de ce filtre ?', options: [
      V('un passe-bas', 'Il laisse passer les basses fréquences (100 Hz) et atténue les hautes (50 kHz).'),
      F('un passe-haut', 'Un passe-haut ferait l’inverse : il atténuerait 100 Hz et laisserait passer 50 kHz.'),
      F('un passe-bande', 'Un passe-bande n’atténuerait pas seulement les hautes fréquences : il atténuerait aussi les basses.'),
      F('un réjecteur', 'Un réjecteur atténue une plage de fréquences autour d’une valeur et laisse passer les fréquences plus basses et plus hautes.'),
    ] },
  { id: 'filt-ana-compare', domaine: DOM, titre: 'Comparer deux fréquences',
    enonce: 'Un filtre passe-bas a une fréquence de coupure fc = 1 kHz. On lui envoie successivement deux tensions sinusoïdales de même amplitude : l’une à 200 Hz, l’autre à 10 kHz.', q: 'Que peut-on dire de l’amplitude des tensions de sortie ?', options: [
      V('elle est plus petite à 10 kHz qu’à 200 Hz', 'À 10 kHz on est bien au-dessus de fc : le passe-bas atténue fortement. À 200 Hz, on est dans la bande passante.'),
      F('elle est plus petite à 200 Hz qu’à 10 kHz', 'C’est l’inverse : un passe-bas atténue les hautes fréquences, pas les basses.'),
      F('elle est la même aux deux fréquences', 'A dépend de la fréquence : c’est justement ce que le filtre modifie.'),
      F('elle est plus grande que celle de l’entrée à 200 Hz', 'Un filtre passif n’amplifie pas : A ≤ 1.'),
    ] },
  { id: 'filt-ana-capa', domaine: DOM, titre: 'Doubler la capacité',
    enonce: 'Un filtre RC passe-bas a une fréquence de coupure fc. On remplace son condensateur par un condensateur de capacité deux fois plus grande, sans changer la résistance.', q: 'Comment la fréquence de coupure évolue-t-elle ?', options: [
      V('elle diminue', 'Le produit R × C augmente : la fréquence de coupure diminue.'),
      F('elle augmente', 'Plus R × C est grand, plus fc est petite : doubler C la diminue.'),
      F('elle ne change pas', 'fc dépend de R et de C : changer C la modifie.'),
      F('elle devient nulle', 'fc devient plus petite, mais elle ne s’annule pas.'),
    ] },
  { id: 'filt-ana-bande', domaine: DOM, titre: 'Dans la bande passante ?',
    enonce: 'Un filtre passe-haut a une fréquence de coupure fc = 500 Hz. On lui envoie une tension sinusoïdale de fréquence 2 kHz.', q: 'Le signal est-il dans la bande passante du filtre ?', options: [
      V('oui : 2 kHz est supérieure à fc', 'La bande passante d’un passe-haut est l’ensemble des fréquences supérieures à fc : A y est au moins égal à 0,7 × Amax.'),
      F('non : 2 kHz est trop élevée pour être transmise', 'C’est un passe-haut : il transmet les hautes fréquences.'),
      F('non : seule la fréquence fc elle-même passe, aucune autre', 'La bande passante est un ensemble de fréquences, pas une seule valeur.'),
      F('on ne peut pas répondre sans connaître Ue,max', 'La bande passante ne dépend pas de l’amplitude d’entrée.'),
    ] },
];

export const FILT_VAL = [
  P({ id: 'filt-val-amp', domaine: DOM, niveau: 2, titre: 'Un filtre passif qui amplifie ?', plausible: false,
    enonce: 'On mesure l’entrée et la sortie d’un filtre RC passif (résistance et condensateur seuls) : Ue,max = 4,0 V et Us,max = 5,0 V. Un élève conclut : « A = frac(5,0|4,0) = 1,25 : ce filtre amplifie le signal. »',
    reperes: [['Ue,max', '4,0 V'], ['Us,max', '5,0 V'], ['Composants', 'R et C seulement']],
    ver: 'Un filtre passif (sans source d’énergie) ne peut pas amplifier : A ≤ 1, donc Us,max ≤ Ue,max. La mesure est fausse (voies inversées, calibres différents ou lecture erronée).',
    q2: 'Que faut-il en conclure ?',
    options: [
      V('la mesure est suspecte : un filtre passif a A ≤ 1', 'Sans source d’énergie, la sortie ne peut pas avoir une amplitude supérieure à l’entrée.'),
      F('le calcul A = frac(Us,max|Ue,max) est faux', 'La définition de A est correcte : c’est la valeur mesurée qui n’est pas plausible.'),
      F('ce filtre est un passe-haut', 'La nature du filtre ne dit rien sur l’amplification : un passe-haut passif ne peut pas non plus amplifier.'),
    ] }),
  P({ id: 'filt-val-fc', domaine: DOM, niveau: 2, titre: 'Lire la fréquence de coupure', plausible: false,
    enonce: 'La courbe A(f) d’un filtre passe-bas a un maximum Amax = 1. Un élève lit la fréquence de coupure là où A = 0,5 et trouve fc = 3,2 kHz.',
    reperes: [['Amax', '1'], ['Valeur de A utilisée', '0,5']],
    ver: 'La fréquence de coupure correspond à A = frac(Amax|sqrt(2)) ≈ 0,7 × Amax, soit 0,7 ici. Lire la courbe à A = 0,5 donne une fréquence plus grande que fc pour un passe-bas.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a lu la courbe à A = 0,5 au lieu de A = 0,7', 'À la fréquence de coupure, A = frac(Amax|sqrt(2)) ≈ 0,7 × Amax.'),
      F('il a oublié que le filtre est un passe-bas', 'La nature du filtre n’intervient pas dans la définition de fc.'),
      F('il aurait dû lire A = Amax', 'A = Amax est la valeur maximale, atteinte loin de la coupure, pas à fc.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const g2 = v => M.nbf(v, 2);
export const FILT_SAPP = [
  {
    id: 'filt-sapp-gain', domaine: DOM, titre: 'Facteur d’amplification et amplitude de sortie', noms: ['Facteur d’amplification du filtre', 'Amplitude de la sortie pour une autre tension d’entrée'],
    gen: () => ({ ue: tire([2, 3, 4, 5]), A: tire([0.2, 0.3, 0.4, 0.5, 0.6, 0.8]), ue2: tire([1, 1.5, 2.5, 6]), f: tire([200, 500, 2000, 5000]) }),
    build: epure((p, q) => {
      const us = Math.round(p.ue * p.A * 100) / 100, A = us / p.ue, us2 = A * p.ue2;
      const tokens = {
        ue: tok(`${M.nbf(p.ue, 1)} V`, 'Amplitude de la tension d’entrée', p.ue, 'V'), us: tok(`${g2(us)} V`, 'Amplitude de la tension de sortie', us, 'V'),
        f: tok(`${p.f} Hz`, 'Fréquence du signal', p.f, 'Hz'), ue2: tok(`${M.nbf(p.ue2, 1)} V`, 'Nouvelle amplitude d’entrée', p.ue2, 'V'),
      };
      const debut = ['Un filtre RC passif, alimenté à ', T('f'), ', reçoit une tension d’amplitude Ue,max = ', T('ue'), ' et délivre une tension d’amplitude Us,max = ', T('us'), '. '];
      if (q === 0) return { tokens, derivees: ['A = frac(Us,max|Ue,max)'], texte: [...debut, 'Quel est le facteur d’amplification A du filtre à cette fréquence ?'], utiles: ['ue', 'us'],
        raisons: { f: 'La fréquence ne sert pas au calcul de A : elle précise seulement dans quelles conditions A a été mesuré.', ue2: 'La nouvelle amplitude ne sert pas pour cette question.' },
        cherche: { bonne: 'Le facteur d’amplification A (sans unité)', faux: ['L’amplitude de la sortie pour une autre entrée', 'La fréquence de coupure du filtre', 'L’atténuation en volts'] },
        manque: null, solution: { txt: 'A = frac(Us,max|Ue,max)', val: A, u: '' } };
      return { tokens, derivees: ['A = frac(Us,max|Ue,max)', 'Us,max′ = A × Ue,max′'], texte: [...debut, 'À la même fréquence, on applique une tension d’amplitude Ue,max′ = ', T('ue2'), '. Quelle est l’amplitude de la tension de sortie ?'], utiles: ['ue', 'us', 'ue2'],
        raisons: { f: 'La fréquence est la même : A reste identique, elle ne sert pas au calcul.' },
        cherche: { bonne: 'L’amplitude de la sortie pour la nouvelle entrée (en V)', faux: ['Le facteur d’amplification A', 'La fréquence de coupure', 'La différence Ue,max − Us,max'] },
        manque: null, solution: { txt: 'Us,max′ = frac(Us,max|Ue,max) × Ue,max′', val: us2, u: 'V' } };
    }),
  },
  {
    id: 'filt-sapp-coupure', domaine: DOM, titre: 'Valeur de A à la fréquence de coupure', noms: ['Valeur de A à la fréquence de coupure', 'Amplitude de la sortie à la fréquence de coupure'],
    gen: () => ({ Amax: tire([1, 2, 4, 5, 10]), ue: tire([0.5, 1, 2, 3]) }),
    build: epure((p, q) => {
      const Ac = p.Amax * Math.SQRT1_2, usc = Ac * p.ue;
      const tokens = { Am: tok(`${p.Amax}`, 'Valeur maximale du facteur d’amplification', p.Amax, ''), ue: tok(`${M.nbf(p.ue, 1)} V`, 'Amplitude de la tension d’entrée', p.ue, 'V') };
      const debut = ['Un filtre a un facteur d’amplification maximal Amax = ', T('Am'), '. On lui applique une tension sinusoïdale d’amplitude Ue,max = ', T('ue'), '. '];
      if (q === 0) return { tokens, derivees: ['A(fc) = frac(Amax|sqrt(2))'], texte: [...debut, 'Quelle est la valeur de A à la fréquence de coupure fc ?'], utiles: ['Am'],
        raisons: { ue: 'L’amplitude d’entrée ne sert pas pour cette question.' },
        cherche: { bonne: 'La valeur de A à la fréquence de coupure', faux: ['La fréquence de coupure fc', 'L’amplitude de la sortie à fc', 'La largeur de la bande passante'] },
        manque: null, solution: { txt: 'A(fc) = frac(Amax|sqrt(2))', val: Ac, u: '' } };
      return { tokens, derivees: ['A(fc) = frac(Amax|sqrt(2))', 'Us,max = A(fc) × Ue,max'], texte: [...debut, 'Quelle est l’amplitude de la tension de sortie à la fréquence de coupure ?'], utiles: ['Am', 'ue'],
        raisons: {}, cherche: { bonne: 'L’amplitude de la sortie à fc (en V)', faux: ['La valeur de A à fc', 'La fréquence de coupure fc', 'L’amplitude de la sortie à très basse fréquence'] },
        manque: null, solution: { txt: 'Us,max = frac(Amax|sqrt(2)) × Ue,max', val: usc, u: 'V' } };
    }),
  },
];
