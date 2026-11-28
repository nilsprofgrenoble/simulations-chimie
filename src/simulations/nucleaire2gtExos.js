// Exercices ANA (prévoir sans calculer), VAL (plausible ?) et S'APP (repérer les données utiles) de la simulation 203 « Transformation nucléaire : isotopes, Soleil et centrales » (2GT).
// Préfixe d'identifiants : nuc2gt- ; domaine : « Transformation nucléaire (2GT) ». Branchés dans AtelierAnalyserBanque.js, AtelierValiderBanque.js et AtelierDonneesBanque.js.
// Capacités : isotopes (même Z, A différents), nature physique / chimique / nucléaire, fusion (Soleil) et fission (centrale), chaîne énergétique. Aucune désintégration, demi-vie, ni E = mc².
import * as NM from './nucleaire2gtModele.js';

const DOM = 'Transformation nucléaire (2GT)';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

// ───────────── ANA : prévoir sans calculer ─────────────
export const NUC2GT_ANA = [
  { id: 'nuc2gt-ana-iso-carbone', domaine: DOM, titre: 'Le carbone 12 et le carbone 14',
    enonce: 'Un noyau de carbone 12 et un noyau de carbone 14 sont deux isotopes du carbone.', q: 'Quelle grandeur est la même pour ces deux noyaux ?', options: [
      V('le nombre de protons Z', 'Des isotopes sont des noyaux du même élément : ils ont le même nombre de protons Z. Ici Z = 6 pour les deux.'),
      F('le nombre de nucléons A', 'Le carbone 12 a 12 nucléons et le carbone 14 en a 14 : A est différent pour des isotopes.'),
      F('le nombre de neutrons', 'Avec le même nombre de protons et des nombres de nucléons différents, les nombres de neutrons sont différents.'),
      F('le nombre de protons et de neutrons ensemble', 'Cette somme est le nombre de nucléons A, qui vaut 12 pour l’un et 14 pour l’autre.'),
    ] },
  { id: 'nuc2gt-ana-meme-a', domaine: DOM, titre: 'Deux noyaux de même nombre de nucléons',
    enonce: 'Un noyau a 14 nucléons dont 6 protons. Un autre noyau a aussi 14 nucléons, dont 7 protons.', q: 'Ces deux noyaux sont-ils des isotopes ?', options: [
      V('non : les nombres de protons sont différents', 'Pour des isotopes, il faut le même Z. Ici Z vaut 6 et 7 : ce sont deux éléments différents (carbone et azote).'),
      F('oui : ils ont le même nombre de nucléons', 'Des isotopes ont des nombres de nucléons différents et le même Z : ici c’est l’inverse.'),
      F('oui : ils ont presque le même nombre de protons', 'Un seul proton de différence suffit à changer d’élément : il faut exactement le même Z.'),
      F('on ne peut pas savoir sans connaître l’élément', 'Les nombres de protons suffisent : 6 et 7 sont différents, donc les éléments sont différents.'),
    ] },
  { id: 'nuc2gt-ana-charbon', domaine: DOM, titre: 'Le charbon qui brûle',
    enonce: 'Un morceau de charbon (carbone) brûle dans le dioxygène et forme du dioxyde de carbone.', q: 'Que deviennent les noyaux de carbone au cours de cette combustion ?', options: [
      V('ils ne changent pas dans le dioxyde de carbone', 'La combustion est une transformation chimique : les atomes se réarrangent en de nouvelles molécules, mais leurs noyaux restent les mêmes.'),
      F('ils fusionnent avec les noyaux d’oxygène', 'Dans une fusion, les noyaux s’assemblent pour former un autre élément : ce n’est pas ce qui se passe dans une combustion.'),
      F('ils se cassent en noyaux plus petits', 'Ce serait une fission, qui libère bien plus d’énergie : une combustion ne casse pas les noyaux.'),
      F('ils se transforment en noyaux d’un autre élément', 'Le carbone reste du carbone : seul le rangement des atomes change.'),
    ] },
  { id: 'nuc2gt-ana-soleil', domaine: DOM, titre: 'La source d’énergie du Soleil',
    enonce: 'Le Soleil rayonne de la lumière et de la chaleur depuis des milliards d’années. Il est surtout formé d’hydrogène.', q: 'D’où vient cette énergie ?', options: [
      V('de la fusion de noyaux d’hydrogène en hélium', 'Dans le cœur du Soleil, de petits noyaux d’hydrogène s’assemblent en noyaux d’hélium : c’est une fusion, qui libère beaucoup d’énergie.'),
      F('de la combustion de l’hydrogène avec le dioxygène', 'Il n’y a pas assez de dioxygène dans le Soleil, et une combustion libérerait beaucoup trop peu d’énergie.'),
      F('de la fission de gros noyaux d’uranium', 'La fission des gros noyaux est utilisée dans les centrales sur Terre, pas dans le Soleil.'),
      F('d’une transformation chimique de l’hydrogène', 'Une transformation chimique conserve les noyaux et libère peu d’énergie : l’énergie du Soleil vient de noyaux qui changent.'),
    ] },
  { id: 'nuc2gt-ana-chaine', domaine: DOM, titre: 'Du réacteur au réseau électrique',
    enonce: 'Dans une centrale nucléaire, de l’énergie libérée par la fission est finalement convertie en électricité.', q: 'Quel est l’ordre des étapes ?', options: [
      V('réacteur, vapeur, turbine puis alternateur', 'La fission chauffe l’eau, la vapeur fait tourner la turbine, qui entraîne l’alternateur : celui-ci produit l’électricité.'),
      F('réacteur, alternateur, turbine, eau chauffée en vapeur', 'L’alternateur est la dernière étape : il reçoit le mouvement de la turbine, il ne chauffe pas l’eau.'),
      F('turbine, réacteur, vapeur, alternateur', 'Le réacteur est la source : c’est lui qui chauffe l’eau, avant que la vapeur n’atteigne la turbine.'),
      F('réacteur, turbine, alternateur, vapeur', 'La vapeur est produite avant la turbine : c’est elle qui la fait tourner.'),
    ] },
];

// ───────────── VAL : plausible ? ─────────────
export const NUC2GT_VAL = [
  P({ id: 'nuc2gt-val-uranium', domaine: DOM, niveau: 1, titre: 'Les isotopes de l’uranium', plausible: false,
    enonce: 'Un élève affirme : « L’uranium 235 et l’uranium 238 sont des isotopes parce qu’ils ont le même nombre de nucléons ».',
    reperes: [['Uranium 235', 'A = 235 ; Z = 92'], ['Uranium 238', 'A = 238 ; Z = 92'], ['Isotopes', 'même Z, nombres de nucléons A différents']],
    ver: 'Ce sont bien des isotopes, mais pour une autre raison : ils ont le même nombre de protons (Z = 92), donc le même élément, et des nombres de nucléons différents (235 et 238).',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il prend « même A » au lieu de « même Z »', 'Des isotopes ont le même Z et des A différents ; ici A vaut 235 et 238, il n’est pas identique.'),
      F('il oublie qu’il faut le même nombre de neutrons', 'Des isotopes n’ont pas le même nombre de neutrons : c’est même ce qui les distingue.'),
      F('un A différent signifie un autre élément', 'Un A différent ne change pas l’élément : seul le nombre de protons Z le décide, et il vaut 92 pour les deux noyaux.'),
    ] }),
  P({ id: 'nuc2gt-val-soleil', domaine: DOM, niveau: 1, titre: 'Le Soleil et la combustion', plausible: false,
    enonce: 'Un élève écrit : « Le Soleil brille parce que l’hydrogène brûle dans le dioxygène. C’est une transformation chimique ».',
    reperes: [['Soleil', 'surtout de l’hydrogène et de l’hélium, très peu de dioxygène'], ['Transformation chimique', 'les molécules changent, les noyaux restent les mêmes'], ['Énergie libérée', 'bien plus grande qu’une combustion']],
    ver: 'Dans le cœur du Soleil, des noyaux d’hydrogène fusionnent en noyaux d’hélium : c’est une transformation nucléaire, et non une combustion.',
    q2: 'Quelle correction apporter ?',
    options: [
      V('les noyaux d’hydrogène fusionnent : c’est nucléaire', 'La fusion de noyaux d’hydrogène en noyaux d’hélium est une transformation nucléaire : les noyaux changent.'),
      F('c’est une transformation physique, un changement d’état', 'Aucune molécule ne change d’état ici : ce sont les noyaux qui sont modifiés.'),
      F('l’hydrogène se casse en noyaux plus petits', 'Dans le Soleil, de petits noyaux s’assemblent (fusion), ils ne se cassent pas.'),
    ] }),
  P({ id: 'nuc2gt-val-tritium', domaine: DOM, niveau: 2, titre: 'Le noyau de tritium', plausible: true,
    enonce: 'Un élève lit que le tritium est un isotope de l’hydrogène avec A = 3 et écrit : « un noyau de tritium contient 1 proton et 2 neutrons ».',
    reperes: [['Hydrogène', 'Z = 1 pour tous ses isotopes'], ['Tritium', 'A = 3 nucléons au total'], ['Neutrons', 'nombre de nucléons moins nombre de protons']],
    ver: 'Le tritium est un isotope de l’hydrogène : Z = 1. Avec A = 3, il reste 3 − 1 = 2 neutrons. L’affirmation est correcte.',
    q2: 'Pourquoi cette affirmation est-elle vraisemblable ?',
    options: [
      V('Z = 1 comme tout hydrogène et 3 − 1 = 2 neutrons', 'Les isotopes ont le même Z : un proton. Les 2 autres nucléons sont des neutrons.'),
      F('il a 3 neutrons, car son A vaut 3', 'A compte tous les nucléons, protons compris : avec 1 proton, il reste 2 neutrons.'),
      F('autant de neutrons que l’hydrogène 1, même élément', 'Des isotopes ont le même Z mais pas le même nombre de neutrons : c’est ce qui les distingue.'),
    ] }),
  P({ id: 'nuc2gt-val-centrale', domaine: DOM, niveau: 2, titre: 'Dans le réacteur d’une centrale', plausible: true,
    enonce: 'Un élève écrit : « Dans une centrale, des noyaux d’uranium 235 se cassent. L’énergie libérée chauffe de l’eau, qui devient de la vapeur ».',
    reperes: [['Uranium 235', 'gros noyau, cassé par un neutron'], ['Transformation', 'fission : les noyaux changent'], ['Énergie libérée', 'transférée à l’eau sous forme de chaleur']],
    ver: 'C’est correct : la fission de l’uranium 235 libère de l’énergie, qui chauffe l’eau. La vapeur fait ensuite tourner une turbine.',
    q2: 'Pourquoi cette description est-elle vraisemblable ?',
    options: [
      V('une fission libère de l’énergie qui chauffe l’eau', 'Dans le réacteur, les noyaux d’uranium se cassent et l’énergie libérée est transférée à l’eau, qui devient de la vapeur.'),
      F('l’uranium brûle comme du charbon dans le réacteur', 'L’uranium ne brûle pas : ses noyaux se cassent, ce qui est une transformation nucléaire et non une combustion.'),
      F('les noyaux d’uranium s’assemblent en un noyau plus gros', 'Ce serait une fusion : dans une centrale, c’est la fission d’un gros noyau qui est utilisée.'),
    ] }),
];

// ───────────── S'APP : repérer les données utiles ─────────────
const tire = t => t[Math.floor(Math.random() * t.length)];
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff, quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const el = Z => ({ nom: NM.nomEl(Z), s: NM.sym(Z) });
const melange = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// liste de quatre noyaux dont 1 ou 2 isotopes de la cible, un noyau de même A (autre élément) quand il existe
const listeNoyaux = () => {
  for (let k = 0; k < 300; k++) {
    const Z = tire(NM.Z_LISTE.filter(z => z >= 3 && z <= 18 && NM.ISOTOPES[z].length >= 2)), A = tire(NM.ISOTOPES[Z]);
    const nb = tire([1, 1, 2]), bons = melange(NM.isotopesDe(Z).filter(n => n.A !== A)).slice(0, nb);
    const memeA = NM.Z_LISTE.filter(z => z !== Z && z >= 3 && z <= 18 && NM.ISOTOPES[z].includes(A)).map(z => NM.noyau(z, A));
    const autres = melange(NM.Z_LISTE.filter(z => z !== Z && z >= 3 && z <= 18)).map(z => NM.noyau(z, tire(NM.ISOTOPES[z])));
    const faux = [...(memeA.length ? [tire(memeA)] : []), ...autres.filter(n => n.A !== A)].slice(0, 4 - bons.length);
    if (bons.length < 1 || faux.length + bons.length < 4) continue;
    return { cible: NM.noyau(Z, A), liste: melange([...bons, ...faux]), n: bons.length };
  }
  throw new Error('liste impossible');
};
export const NUC2GT_SAPP = [
  {
    id: 'nuc2gt-sapp-liste', domaine: DOM, titre: 'Les isotopes dans une liste', noms: ['Nombre d’isotopes de la cible dans la liste', 'Nombre de noyaux d’un autre élément dans la liste'],
    gen: () => listeNoyaux(),
    build: epure((p, q) => {
      const tokens = { Zc: tok(`${p.cible.Z}`, 'Nombre de protons Z de la cible', p.cible.Z, 'protons'), Ac: tok(`${p.cible.A}`, 'Nombre de nucléons A de la cible', p.cible.A, 'nucléons') };
      p.liste.forEach((n, i) => { tokens[`Z${i}`] = tok(`${n.Z}`, `Nombre de protons Z du noyau ${i + 1}`, n.Z, 'protons'); tokens[`A${i}`] = tok(`${n.A}`, `Nombre de nucléons A du noyau ${i + 1}`, n.A, 'nucléons'); });
      const raisons = { Ac: 'Pour reconnaître des isotopes de la cible, c’est son Z qui compte : le A de la cible ne sert pas à décider de l’élément.' };
      p.liste.forEach((n, i) => { raisons[`A${i}`] = 'Le nombre de nucléons A ne dit pas de quel élément est le noyau : un même A peut correspondre à deux éléments différents. On regarde Z.'; });
      const texte = ['Un noyau cible est un noyau de ', el(p.cible.Z).nom, ', avec Z = ', T('Zc'), ' protons et A = ', T('Ac'), ' nucléons. Voici une liste de quatre noyaux. '];
      p.liste.forEach((n, i) => texte.push(`Noyau ${i + 1} : Z = `, T(`Z${i}`), ', A = ', T(`A${i}`), i < 3 ? ' ; ' : '. '));
      const utiles = ['Zc', ...p.liste.map((n, i) => `Z${i}`)], nIso = p.n;
      if (q === 0) return { tokens, derivees: [], texte: [...texte, 'Combien de noyaux de la liste sont des isotopes de la cible ?'], utiles, raisons,
        cherche: { bonne: 'Le nombre d’isotopes de la cible dans la liste', faux: ['Le nombre de nucléons de la cible en tout', 'Le nombre de noyaux de la liste qui ont le même A', 'La somme des nombres A de la liste'] },
        manque: null, solution: { txt: 'Des isotopes ont le même Z que la cible : on compte les noyaux de la liste dont Z est égal à celui de la cible', val: nIso, u: 'noyaux' } };
      return { tokens, derivees: [], texte: [...texte, 'Combien de noyaux de la liste sont d’un autre élément que la cible ?'], utiles, raisons,
        cherche: { bonne: 'Le nombre de noyaux d’un autre élément', faux: ['Le nombre de noyaux de même A que la cible', 'Le nombre de neutrons de la cible en tout', 'La différence entre les A de la liste'] },
        manque: null, solution: { txt: 'Un autre élément veut dire un autre Z : on compte les noyaux de la liste dont Z est différent de celui de la cible', val: 4 - nIso, u: 'noyaux' } };
    }),
  },
  {
    id: 'nuc2gt-sapp-fissions', domaine: DOM, titre: 'Les neutrons de plusieurs fissions', noms: ['Nombre total de neutrons libérés', 'Nombre de fissions'],
    gen: () => { const r = tire(['fissionSr', 'fissionKr']), n = NM.neutronsProduits(NM.REACTIONS[r]), k = tire([10, 20, 50, 100, 200]); return { r, n, k }; },
    build: epure((p, q) => {
      const rx = NM.REACTIONS[p.r], tot = p.k * p.n;
      const tokens = {
        n: tok(`${p.n}`, 'Neutrons libérés par une fission (lus après la flèche)', p.n, 'neutrons'),
        k: tok(`${p.k}`, 'Nombre de fissions identiques', p.k, 'fissions'),
        tot: tok(`${tot}`, 'Nombre total de neutrons libérés', tot, 'neutrons'),
        AU: tok('235', 'Nombre de nucléons de l’uranium 235', 235, 'nucléons'),
        ZU: tok('92', 'Nombre de protons de l’uranium', 92, 'protons'),
      };
      const raisons = { AU: 'Le nombre de nucléons de l’uranium ne dit pas combien de neutrons sont libérés : on le lit après la flèche.', ZU: 'Le nombre de protons de l’uranium ne dit pas combien de neutrons sont libérés par une fission.' };
      const debut = ['Une fission de l’uranium (', T('ZU'), ' protons, ', T('AU'), ' nucléons) s’écrit : ' + NM.reactionTexte(rx) + '. Après la flèche, le nombre de neutrons libérés par une fission est ', T('n'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Dans un échantillon, ', T('k'), ' fissions identiques ont lieu. Combien de neutrons sont libérés en tout ?'], utiles: ['n', 'k'], raisons,
        cherche: { bonne: 'Le nombre total de neutrons libérés', faux: ['Le nombre de nucléons de tous les noyaux d’uranium', 'Le nombre de protons libérés par les fissions', 'Le nombre de fissions qui ont lieu'] },
        manque: null, solution: { txt: 'Total = nombre de fissions × neutrons libérés par fission', val: tot, u: 'neutrons' } };
      return { tokens, derivees: [], texte: [...debut, 'Au total, ', T('tot'), ' neutrons sont libérés par des fissions identiques. Combien de fissions ont eu lieu ?'], utiles: ['n', 'tot'], raisons: { ...raisons, k: 'Le nombre de fissions est justement ce que l’on cherche.' },
        cherche: { bonne: 'Le nombre de fissions qui ont eu lieu', faux: ['Le nombre de noyaux d’uranium en tout', 'Le nombre de neutrons libérés par fission', 'Le nombre de neutrons reçus par l’uranium'] },
        manque: null, solution: { txt: 'Nombre de fissions = frac(neutrons libérés en tout|neutrons libérés par fission)', val: p.k, u: 'fissions' } };
    }),
  },
];
