// Exercices ANA, VAL et S'APP de la simulation 319 « Mésomérie : délocaliser un doublet » (terminale STL, SPCL, Chimie et développement durable). Préfixe : meso-.
// Capacité visée (jamais affichée) : identifier les formes mésomères de molécules ou d'ions simples en exploitant des schémas de Lewis fournis.
import * as M from './mesModele.js';
const DOM = 'Mésomérie';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const MESO_ANA = [
  { id: 'meso-ana-invariants', domaine: DOM, titre: 'Ce qui ne change pas entre deux formes',
    enonce: 'On écrit deux formes mésomères d’un même ion en déplaçant des doublets d’électrons.', q: 'Parmi ces grandeurs, laquelle est la même dans les deux formes ?', options: [
      F('la place de la double liaison', 'La double liaison change de place d’une forme mésomère à l’autre.'),
      F('la charge formelle de chaque atome', 'Les charges formelles changent quand les doublets se déplacent.'),
      V('la place des atomes et le nombre d’électrons', 'Seuls des doublets se déplacent : les atomes restent en place et le nombre d’électrons ne change pas.'),
      F('le nombre de doublets non liants de chaque atome', 'Un doublet non liant peut devenir liant : le nombre de doublets non liants change pour certains atomes.'),
    ] },
  { id: 'meso-ana-carbonate', domaine: DOM, titre: 'Charge moyenne dans l’ion carbonate',
    enonce: 'L’ion carbonate CO₃²⁻ possède trois formes mésomères équivalentes : dans chacune, la double liaison C=O est sur un oxygène différent et les deux autres oxygènes portent une charge −.', q: 'Quelle est la charge moyenne de chaque atome d’oxygène dans la structure réelle ?', options: [
      F('−1 : chaque oxygène porte exactement une charge −1', 'Dans une écriture, un oxygène a une charge 0 : la charge moyenne est plus petite en valeur absolue.'),
      F('−2 : toute la charge est portée par un seul oxygène', 'Dans l’hybride, la charge n’est pas portée par un seul atome : elle est répartie.'),
      F('0 : les charges se compensent', 'Les charges −1 des oxygènes ne sont pas compensées : la charge de l’ion reste −2.'),
      V('−2/3 : charge −2 répartie sur trois oxygènes', 'Chaque oxygène porte −1, −1 et 0 dans les trois écritures : la moyenne vaut −2/3.'),
    ] },
  { id: 'meso-ana-allyle', domaine: DOM, titre: 'La charge du cation allyle',
    enonce: 'Le cation allyle CH₂=CH–CH₂⁺ a deux formes mésomères : dans chacune, la charge + est portée par un carbone terminal, et la double liaison est de l’autre côté.', q: 'Dans la structure réelle, où se trouve la charge + ?', options: [
      F('uniquement sur le carbone central CH de la molécule', 'Le carbone central n’a pas de lacune dans aucune des deux écritures : il ne porte pas de charge.'),
      V('partagée entre les deux carbones terminaux', 'La charge + passe d’un carbone terminal à l’autre : dans l’hybride, elle est partagée entre les deux.'),
      F('sur un seul carbone terminal, toujours le même des deux', 'Les deux carbones terminaux jouent le même rôle : aucun n’est privilégié.'),
      F('sur aucun atome : un cation n’a pas de charge localisée', 'La charge de l’ion est bien présente : elle est délocalisée, pas absente.'),
    ] },
  { id: 'meso-ana-enolate', domaine: DOM, titre: 'Forme la plus probable d’un ion énolate',
    enonce: 'L’ion énolate s’écrit CH₂=CH–O⁻ ou ⁻CH₂–CH=O. Dans la première forme la charge − est sur l’oxygène, dans la seconde sur un carbone.', q: 'Quelle écriture contribue le plus à la structure réelle ?', options: [
      F('celle où la charge − est sur le carbone, car le carbone est plus petit', 'Le carbone est moins électronégatif que l’oxygène : il porte moins volontiers une charge −.'),
      F('les deux contribuent exactement autant, car elles ont une seule charge', 'Les deux écritures ont une charge, mais pas sur le même atome : leurs poids diffèrent.'),
      V('celle où la charge − est sur l’oxygène', 'La charge − est mieux placée sur l’atome le plus électronégatif : c’est l’écriture la plus probable.'),
      F('aucune : un énolate n’a pas de forme mésomère', 'Un déplacement de doublet permet de passer d’une écriture à l’autre : ce sont deux formes mésomères.'),
    ] },
];

export const MESO_VAL = [
  P({ id: 'meso-val-octet', domaine: DOM, niveau: 2, titre: 'Une écriture du nitrate proposée par un élève', plausible: false,
    enonce: 'Un élève écrit pour l’ion nitrate NO₃⁻ une forme où l’atome d’azote porte deux doubles liaisons N=O et une liaison simple N–O, sans doublet non liant. Il affirme : « c’est une forme mésomère, car j’ai seulement déplacé des doublets ».',
    reperes: [['Atome d’azote', '2 doubles liaisons + 1 liaison simple'], ['Doublets non liants sur N', '0']],
    ver: 'L’azote serait entouré de 2 × 2 + 1 = 5 doublets liants, soit 10 électrons : il dépasse l’octet. Une forme mésomère respecte l’octet de C, N, O.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      F('il a déplacé un atome d’oxygène', 'Dans cette écriture, les atomes sont à leur place : l’erreur est ailleurs.'),
      V('l’atome d’azote dépasse l’octet (5 doublets liants)', 'N ne peut avoir que 4 doublets autour de lui : 2 doubles + 1 simple font 5 doublets.'),
      F('il n’a pas respecté la charge totale de l’ion', 'La charge totale peut être conservée : le défaut est l’octet de l’azote.'),
    ] }),
  P({ id: 'meso-val-probable', domaine: DOM, niveau: 2, titre: 'Quelle forme de l’éthanamide domine ?', plausible: false,
    enonce: 'Une élève compare deux écritures de l’éthanamide CH₃CONH₂ : l’une sans charge formelle, l’autre avec une charge + sur N et une charge − sur O. Elle annonce : « la plus probable est celle avec charges, car elle contient plus de charges donc plus d’énergie, donc elle domine ».',
    reperes: [['Écriture 1', 'sans charge formelle'], ['Écriture 2', 'N⁺ et O⁻']],
    ver: 'Séparer des charges coûte de l’énergie : la forme sans charge est la plus probable. La forme la plus probable est la moins chargée.',
    q2: 'Quel est le défaut du raisonnement ?',
    options: [
      F('les deux écritures sont toujours équivalentes', 'Ici elles ne sont pas équivalentes : l’une est neutre, l’autre a des charges séparées.'),
      F('la forme la plus probable est celle qui a le plus d’atomes', 'Les deux écritures ont les mêmes atomes : ce critère ne les distingue pas.'),
      V('la forme la plus probable est la moins chargée, pas celle qui a le plus de charges', 'Les charges séparées sont défavorables : la forme sans charge domine.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const nbf = M.nbf;
const IONS_E = [
  { nom: 'nitrate NO₃⁻', centre: 'azote', e: 5, nO: 3, q: 1 }, { nom: 'carbonate CO₃²⁻', centre: 'carbone', e: 4, nO: 3, q: 2 }, { nom: 'nitrite NO₂⁻', centre: 'azote', e: 5, nO: 2, q: 1 },
];
const ESP_D = [
  { nom: 'l’ion éthanoate', nO: 2, qO: 1, nF: 2 }, { nom: 'l’ion carbonate', nO: 3, qO: 2, nF: 3 }, { nom: 'l’ion nitrate', nO: 3, qO: 2, nF: 3 },
];
export const MESO_SAPP = [
  {
    id: 'meso-sapp-electrons', domaine: DOM, titre: 'Nombre d’électrons d’un ion pour dessiner ses formes de Lewis', noms: ['Nombre total d’électrons de valence', 'Nombre de doublets à placer'],
    gen: () => ({ ...tire(IONS_E), Mm: tire([46, 62, 60, 61]) }),
    build: epure((p, q) => {
      const tot = p.e + 6 * p.nO + p.q;
      const tokens = {
        e: tok(`${p.e} électrons de valence`, `Électrons de valence de l’atome central (${p.centre})`, p.e, ''), eO: tok('6 électrons de valence', 'Électrons de valence d’un atome d’oxygène', 6, ''), nO: tok(`${p.nO} atomes d’oxygène`, 'Nombre d’atomes d’oxygène', p.nO, ''),
        c: tok(`${p.q} charge${p.q > 1 ? 's' : ''} négative${p.q > 1 ? 's' : ''}`, 'Charge de l’ion (électrons en plus)', p.q, ''), Mm: tok(`${p.Mm} g/mol`, 'Masse molaire de l’ion', p.Mm, 'g/mol'), temp: tok('25 °C', 'Température de la solution', 25, '°C'),
      };
      const raisons = { Mm: 'La masse molaire ne sert pas à compter des électrons.', temp: 'La température ne change pas le nombre d’électrons de valence.' };
      return q === 0
        ? { tokens, derivees: ['n = e(centre) + nO × 6 + charge'], texte: ['On veut écrire les formes de Lewis de l’ion ', p.nom, ' à ', T('temp'), ' (', T('Mm'), '). Il est formé d’un atome central ', p.centre, ' (', T('e'), ') et de ', T('nO'), ' (', T('eO'), ' chacun). L’ion porte ', T('c'), ' en excès. Combien d’électrons de valence faut-il placer en tout ?'], utiles: ['e', 'eO', 'nO', 'c'],
          raisons, cherche: { bonne: 'Le nombre total d’électrons de valence de l’ion', faux: ['Le nombre de doublets à placer', 'La charge de l’ion', 'Le nombre d’atomes'] }, manque: null, solution: { txt: 'e(centre) + nO × 6 + charge', val: tot, u: '' } }
        : { tokens, derivees: ['n = e(centre) + nO × 6 + charge', 'doublets = frac(n|2)'], texte: ['On veut écrire les formes de Lewis de l’ion ', p.nom, ' à ', T('temp'), ' (', T('Mm'), '). Il est formé d’un atome central ', p.centre, ' (', T('e'), ') et de ', T('nO'), ' (', T('eO'), ' chacun). L’ion porte ', T('c'), ' en excès. Combien de doublets (liants et non liants) faut-il placer en tout ?'], utiles: ['e', 'eO', 'nO', 'c'],
          raisons, cherche: { bonne: 'Le nombre total de doublets à placer', faux: ['Le nombre total d’électrons de valence', 'La charge de l’ion', 'Le nombre de liaisons'] }, manque: null, solution: { txt: 'frac(e(centre) + nO × 6 + charge|2)', val: tot / 2, u: '' } };
    }),
  },
  {
    id: 'meso-sapp-hybride', domaine: DOM, titre: 'Charge et liaison moyennes dans un hybride', noms: ['Valeur absolue de la charge moyenne d’un oxygène', 'Ordre moyen d’une liaison'],
    gen: () => ({ ...tire(ESP_D), V: tire([50, 100, 250]) }),
    build: epure((p, q) => {
      const tokens = {
        nO: tok(`${p.nO} atomes d’oxygène équivalents`, 'Nombre d’atomes d’oxygène équivalents', p.nO, ''), qO: tok(`${p.qO} charge${p.qO > 1 ? 's' : ''} − au total sur les oxygènes dans une écriture`, 'Charge totale portée par les oxygènes dans une écriture', p.qO, ''),
        nF: tok(`${p.nF} écritures équivalentes`, 'Nombre de formes mésomères équivalentes', p.nF, ''), simple: tok(`simple dans ${p.nF - 1} écriture${p.nF > 2 ? 's' : ''}`, 'Ordre de la liaison : simple', p.nF - 1, ''), dbl: tok('double dans 1 écriture', 'Ordre de la liaison : double', 1, ''),
        V: tok(`${p.V} mL`, 'Volume de la solution', p.V, 'mL'),
      };
      const raisons = { V: 'Le volume de solution n’intervient pas dans la charge ou l’ordre de liaison d’un seul ion.', nF: 'Le nombre d’écritures n’intervient pas ici : la charge moyenne se calcule sur les atomes d’oxygène.', simple: 'Cette donnée concerne l’ordre de liaison, pas la charge.', dbl: 'Cette donnée concerne l’ordre de liaison, pas la charge.' };
      const raisons1 = { ...raisons, nF: undefined, nO: 'Le nombre d’atomes d’oxygène ne sert pas à calculer l’ordre moyen.', qO: 'La charge des oxygènes ne sert pas à calculer l’ordre moyen.' };
      return q === 0
        ? { tokens, derivees: ['∣charge moyenne∣ = frac(charge totale sur O|nombre de O)'], texte: ['On étudie ', p.nom, ' dans ', T('V'), ' de solution. Il possède ', T('nF'), ' avec ', T('nO'), '. Dans chaque écriture, il y a ', T('qO'), '. Quelle est la valeur absolue de la charge moyenne portée par chaque atome d’oxygène dans l’hybride (en unité de charge élémentaire) ?'], utiles: ['nO', 'qO'],
          raisons, cherche: { bonne: 'La valeur absolue de la charge moyenne d’un oxygène', faux: ['La charge totale de l’ion', 'Le nombre d’écritures', 'Le nombre d’atomes d’oxygène'] }, manque: null, solution: { txt: 'frac(qO|nO)', val: p.qO / p.nO, u: 'e' } }
        : { tokens, derivees: ['ordre moyen = frac(somme des ordres|nombre d’écritures)'], texte: ['On étudie ', p.nom, ' dans ', T('V'), ' de solution. Il possède ', T('nF'), '. La liaison C–O étudiée est ', T('simple'), ' et ', T('dbl'), '. Quel est l’ordre moyen de cette liaison dans l’hybride ?'], utiles: ['nF', 'simple', 'dbl'],
          raisons: raisons1, cherche: { bonne: 'L’ordre moyen de la liaison', faux: ['Le nombre d’écritures', 'La charge de l’oxygène', 'La longueur de la liaison'] }, manque: null, solution: { txt: 'frac(simple × 1 + 1 × 2|nombre d’écritures)', val: ((p.nF - 1) + 2) / p.nF, u: '' } };
    }),
  },
];
void nbf;
