// Exercices ANA, VAL et S'APP de la simulation 315 « Amplifier une tension : de quelques mV au CAN » (terminale STL, SPCL, Systèmes et procédés). Préfixe : amp-.
// Capacités visées (jamais affichées) : exploiter le facteur d'amplification d'un montage amplificateur ; adapter un signal à la plage d'entrée d'un CAN.
import * as M from './ampModele.js';
const DOM = 'Filtrage et amplification de tension';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const AMP_ANA = [
  { id: 'amp-ana-ecretage', domaine: DOM, titre: 'Un signal qui dépasse la plage du CAN',
    enonce: 'Un amplificateur envoie à un convertisseur analogique-numérique, qui lit de 0 à 5 V, une tension dont la valeur minimale est 1 V et la valeur maximale 7 V.', q: 'Que se passe-t-il pour la partie du signal comprise entre 5 V et 7 V ?', options: [
      F('le CAN la lit exactement : sa plage s’adapte au signal', 'Le CAN ne lit que des tensions de 0 à 5 V : sa plage est fixe.'),
      F('le CAN la lit comme 0 V, car elle est hors de sa plage', 'Au-dessus de 5 V, le CAN lit la valeur limite haute, 5 V, et non 0 V.'),
      V('le CAN la lit comme 5 V : le signal est écrêté', 'Le CAN ne distingue plus les valeurs au-dessus de 5 V : il lit 5 V et l’information est perdue.'),
      F('le CAN la lit comme une tension négative de même valeur', 'Une tension trop élevée n’est jamais lue comme une valeur négative.'),
    ] },
  { id: 'amp-ana-negatif', domaine: DOM, titre: 'Un microphone branché sur un CAN',
    enonce: 'Un microphone délivre une tension alternative comprise entre −10 mV et +10 mV. Un amplificateur multiplie cette tension par 200, sans rien lui ajouter, puis l’envoie à un CAN qui lit de 0 à 5 V.', q: 'Que devient la partie négative du signal ?', options: [
      F('elle est lue normalement, avec des valeurs négatives conservées', 'Le CAN ne lit pas de tension négative : sa plage commence à 0 V.'),
      F('elle est ramenée en tension positive de même valeur absolue', 'Le CAN ne calcule pas de valeur absolue : il ne lit simplement rien en dessous de 0 V.'),
      F('elle est atténuée mais elle reste lisible par le CAN', 'La partie négative n’est pas atténuée : elle sort entièrement de la plage du CAN.'),
      V('elle est perdue : le CAN lit 0 V quand Us est négative', 'Sans tension continue ajoutée, toute la moitié négative du signal est lue comme 0 V.'),
    ] },
  { id: 'amp-ana-sat', domaine: DOM, titre: 'Un amplificateur qui sature',
    enonce: 'Un amplificateur à AOP alimenté en ±12 V a un facteur d’amplification A = 600. La tension du capteur monte jusqu’à 30 mV, si bien que A × Ue vaudrait 18 V.', q: 'Quelle est la valeur maximale réelle de la tension de sortie ?', options: [
      F('18 V : Us = A × Ue, sans limite', 'La sortie d’un AOP ne peut pas dépasser sa tension d’alimentation.'),
      V('12 V : l’AOP sature à sa tension d’alimentation', 'La sortie est limitée à ±12 V : le haut du signal est écrêté.'),
      F('5 V : l’amplificateur s’adapte à la plage du CAN', 'L’amplificateur ne connaît pas le CAN : il ne limite pas sa sortie à 5 V.'),
      F('30 mV : l’amplificateur laisse passer l’entrée', 'Un AOP saturé délivre sa tension limite, il ne recopie pas son entrée.'),
    ] },
  { id: 'amp-ana-continu', domaine: DOM, titre: 'Ajouter une tension continue',
    enonce: 'À la tension de sortie d’un amplificateur, qui oscille autour de 0 V, un montage sommateur ajoute une tension continue de +2 V.', q: 'Quel est l’effet de cette tension continue sur le signal ?', options: [
      F('l’amplitude du signal augmente de 2 V entre son bas et son haut', 'L’amplitude ne change pas : tous les points sont décalés de la même valeur.'),
      F('la fréquence du signal augmente de 2 Hz à chaque oscillation complète', 'Une tension continue ne modifie pas la fréquence.'),
      V('le signal est décalé de 2 V vers le haut, sans changer de forme', 'Us = A × Ue + Vdc : on ajoute Vdc à chaque instant, la forme reste identique.'),
      F('chaque valeur du signal est multipliée par 2 à chaque instant', 'On ajoute la tension continue, on ne multiplie pas : Us = A × Ue + Vdc.'),
    ] },
];

export const AMP_VAL = [
  P({ id: 'amp-val-gain', domaine: DOM, niveau: 2, titre: 'Calcul d’un facteur d’amplification', plausible: false,
    enonce: 'Un capteur délivre une tension maximale Ue,max = 5 mV. À la sortie d’un amplificateur, on mesure Us,max = 2 V. Un élève calcule A = Ue ÷ Us = 0,0025 et affirme que l’amplificateur « amplifie bien la tension ».',
    reperes: [['Ue,max', '5 mV'], ['Us,max', '2 V']],
    ver: 'A = Us ÷ Ue = 2 V ÷ 0,005 V = 400. L’élève a inversé le rapport : un facteur de 0,0025, inférieur à 1, correspondrait à un montage qui atténue.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a divisé Ue par Us au lieu de diviser Us par Ue', 'A = Us ÷ Ue : le facteur d’amplification compare la sortie à l’entrée, ici 400.'),
      F('il a oublié de convertir les millivolts en volts', 'Les unités sont bien converties : 0,005 ÷ 2 = 0,0025 ; le défaut est l’inversion du rapport.'),
      F('il aurait dû multiplier Us par Ue', 'On ne multiplie pas : A = Us ÷ Ue.'),
    ] }),
  P({ id: 'amp-val-sat', domaine: DOM, niveau: 2, titre: 'Une sortie qui dépasse l’alimentation', plausible: false,
    enonce: 'Un capteur délivre une tension de −20 mV à +20 mV. Un amplificateur à AOP alimenté en ±12 V a un facteur d’amplification A = 1 000, et on ajoute une tension continue Vdc = 2,5 V. Un élève annonce : « la tension de sortie varie de −17,5 V à +22,5 V ».',
    reperes: [['Alimentation', '±12 V'], ['A', '1 000'], ['Vdc', '2,5 V']],
    ver: 'A × Ue varie de −20 V à +20 V ; avec Vdc, le calcul donnerait de −17,5 V à +22,5 V. Mais l’AOP ne peut pas sortir au-delà de ±12 V : la sortie réelle est écrêtée entre −12 V et +12 V.',
    q2: 'Pourquoi cette annonce est-elle impossible ?',
    options: [
      V('l’AOP ne peut pas fournir des tensions au-delà de son alimentation de ±12 V', 'La sortie sature à ±12 V : le signal est écrêté, il ne peut pas atteindre 22,5 V.'),
      F('le CAN limite la tension de sortie de l’amplificateur à 5 V', 'Le CAN ne modifie pas la tension de l’amplificateur : il se contente de la lire.'),
      F('une tension continue ne peut pas s’ajouter à un signal alternatif', 'On peut très bien ajouter Vdc : Us = A × Ue + Vdc.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const g1 = v => M.nbf(v, 1);
export const AMP_SAPP = [
  {
    id: 'amp-sapp-gain', domaine: DOM, titre: 'Facteur d’amplification d’un amplificateur', noms: ['Facteur d’amplification', 'Tension maximale de sortie'],
    gen: () => { const ue = tire([2, 4, 5, 6, 8, 10]), A = tire([100, 200, 250, 400, 500]); return { ue, A, us: A * ue / 1000, f: tire([500, 1000, 2000]) }; },
    build: epure((p, q) => {
      const tokens = {
        ue: tok(`${p.ue} mV`, 'Tension maximale du capteur', p.ue / 1000, 'V'), us: tok(`${g1(p.us)} V`, 'Tension maximale de sortie mesurée', p.us, 'V'), A: tok(`${p.A}`, 'Facteur d’amplification', p.A, ''),
        alim: tok('±12 V', 'Tension d’alimentation de l’AOP', 12, 'V'), f: tok(`${p.f / 1000} kHz`, 'Fréquence du signal', p.f, 'Hz'),
      };
      const raisons = { alim: 'La tension d’alimentation limite la sortie (saturation) mais ne sert pas au calcul demandé.', f: 'La fréquence du signal ne sert pas au calcul du facteur d’amplification.', us: 'On demande justement la tension de sortie : elle n’est pas donnée.' };
      return q === 0
        ? { tokens, derivees: ['A = Us ÷ Ue'], texte: ['Un capteur délivre une tension de valeur maximale ', T('ue'), ', de fréquence ', T('f'), '. À la sortie d’un amplificateur à AOP alimenté en ', T('alim'), ', on mesure une tension de valeur maximale ', T('us'), '. Quel est le facteur d’amplification A de l’amplificateur ?'], utiles: ['ue', 'us'],
          raisons: { alim: raisons.alim, f: raisons.f }, cherche: { bonne: 'Le facteur d’amplification de l’amplificateur (sans unité)', faux: ['La tension maximale de sortie', 'La tension d’alimentation de l’AOP', 'La fréquence du signal'] }, manque: null, solution: { txt: 'A = Us,max ÷ Ue,max', val: p.us / (p.ue / 1000), u: '' } }
        : { tokens, derivees: ['Us = A × Ue'], texte: ['Un amplificateur à AOP alimenté en ', T('alim'), ' a un facteur d’amplification A = ', T('A'), '. Le capteur délivre une tension de valeur maximale ', T('ue'), ', de fréquence ', T('f'), '. Quelle est la tension maximale de sortie ?'], utiles: ['A', 'ue'],
          raisons: { alim: raisons.alim, f: raisons.f }, cherche: { bonne: 'La tension maximale de sortie (en V)', faux: ['Le facteur d’amplification de l’amplificateur', 'La tension d’alimentation de l’AOP', 'La fréquence du signal'] }, manque: null, solution: { txt: 'Us,max = A × Ue,max', val: p.A * p.ue / 1000, u: 'V' } };
    }),
  },
  {
    id: 'amp-sapp-plage', domaine: DOM, titre: 'Adapter un signal à la plage du CAN', noms: ['Facteur d’amplification maximal', 'Tension maximale après ajout de la tension continue'],
    gen: () => {
      let ue, A; do { ue = tire([4, 5, 8, 10, 12, 20, 25]); A = tire([100, 150, 200, 250, 300]); } while (A * ue > 2000 || A * ue < 600);
      return { ue, A, vdc: tire([2, 2.5, 3]), f: tire([500, 1000, 2000]) };
    },
    build: epure((p, q) => {
      const tokens = {
        ue: tok(`${p.ue} mV`, 'Tension maximale du capteur', p.ue / 1000, 'V'), A: tok(`${p.A}`, 'Facteur d’amplification', p.A, ''), vdc: tok(`${g1(p.vdc)} V`, 'Tension continue ajoutée', p.vdc, 'V'),
        plage: tok('5 V', 'Tension maximale lue par le CAN', 5, 'V'), f: tok(`${p.f / 1000} kHz`, 'Fréquence du signal', p.f, 'Hz'),
      };
      const rf = 'La fréquence du signal ne sert pas à ce calcul.';
      return q === 0
        ? { tokens, derivees: ['Us,max = A × Ue,max', 'Us,max ≤ 5 V'], texte: ['Un capteur délivre une tension de 0 à ', T('ue'), ', de fréquence ', T('f'), '. Le CAN lit de 0 à ', T('plage'), '. Quel facteur d’amplification maximal peut-on choisir pour que la tension de sortie ne dépasse pas la plage du CAN ?'], utiles: ['ue', 'plage'],
          raisons: { f: rf }, cherche: { bonne: 'Le facteur d’amplification maximal (sans unité)', faux: ['La tension maximale de sortie', 'La tension continue à ajouter', 'La fréquence maximale du signal'] }, manque: null, solution: { txt: 'A = 5 V ÷ Ue,max', val: 5 / (p.ue / 1000), u: '' } }
        : { tokens, derivees: ['Us = A × Ue + Vdc'], texte: ['Un capteur délivre une tension alternative de −', T('ue'), ' à +', T('ue'), ', de fréquence ', T('f'), '. Un amplificateur de facteur d’amplification A = ', T('A'), ' lui est associé, et un montage sommateur ajoute une tension continue ', T('vdc'), '. Quelle est la valeur maximale de la tension de sortie ?'], utiles: ['ue', 'A', 'vdc'],
          raisons: { f: rf }, cherche: { bonne: 'La valeur maximale de la tension de sortie (en V)', faux: ['La valeur minimale de la tension de sortie', 'Le facteur d’amplification de l’amplificateur', 'La fréquence du signal de sortie'] }, manque: null, solution: { txt: 'Us,max = A × Ue,max + Vdc', val: p.A * p.ue / 1000 + p.vdc, u: 'V' } };
    }),
  },
];
