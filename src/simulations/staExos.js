// Exercices ANA, VAL et S'APP de la simulation 320 « Stabilité des intermédiaires et produit majoritaire » (terminale STL, SPCL, Chimie et développement durable). Préfixe : sta-.
// Capacités visées (jamais affichées) : prévoir la géométrie de carbocations et carbanions ; comparer la stabilité d'intermédiaires pour interpréter le produit majoritaire (mécanisme fourni).
const DOM = 'Stabilité des intermédiaires';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const STA_ANA = [
  { id: 'sta-ana-geometrie', domaine: DOM, titre: 'Géométrie de CH₃⁺ et de CH₃⁻',
    enonce: 'Le carbocation CH₃⁺ et le carbanion CH₃⁻ ont chacun un carbone lié à trois atomes d’hydrogène.', q: 'Quelle affirmation est correcte ?', options: [
      F('Les deux sont plans, car ils ont trois liaisons', 'Le carbanion a en plus un doublet non liant qui repousse les liaisons : il n’est pas plan.'),
      F('Les deux sont pyramidaux, car ils ont trois liaisons', 'Le carbocation n’a aucun doublet non liant : ses trois liaisons s’écartent au maximum dans un plan.'),
      V('CH₃⁺ est plan et CH₃⁻ est pyramidal', 'Trois groupes d’électrons se placent dans un plan à 120° ; avec un doublet non liant en plus, le carbone forme une pyramide.'),
      F('CH₃⁺ est pyramidal et CH₃⁻ est plan', 'C’est l’inverse : le doublet non liant du carbanion le rend pyramidal.'),
    ] },
  { id: 'sta-ana-cations', domaine: DOM, titre: 'Quel carbocation est le plus stable ?',
    enonce: 'On compare trois carbocations : CH₃–CH₂⁺ (classe I), (CH₃)₂CH⁺ (classe II) et (CH₃)₃C⁺ (classe III).', q: 'Lequel est le plus stable ?', options: [
      F('CH₃–CH₂⁺, qui a le moins de groupes alkyles liés', 'Les groupes alkyles donneurs stabilisent la charge + : moins de groupes donne moins de stabilité.'),
      F('(CH₃)₂CH⁺, de classe intermédiaire', 'Un seul groupe alkyle de plus stabilise encore mieux la charge +.'),
      F('Les trois sont aussi stables', 'Le nombre de groupes donneurs autour du carbone chargé change la stabilité.'),
      V('(CH₃)₃C⁺, avec trois groupes alkyles', 'Chaque groupe alkyle donneur stabilise le carbocation : III > II > I.'),
    ] },
  { id: 'sta-ana-attracteur', domaine: DOM, titre: 'Effet de l’atome de chlore sur un carbanion',
    enonce: 'On compare le carbanion CH₃⁻ et le carbanion Cl₃C⁻, dont le carbone porte trois atomes de chlore, atomes attracteurs d’électrons.', q: 'Lequel est le plus stable ?', options: [
      V('Cl₃C⁻, car les chlores attracteurs répartissent la charge', 'Un groupe attracteur retire des électrons au carbone : il stabilise un carbanion.'),
      F('CH₃⁻, car les atomes d’hydrogène sont plus petits', 'La taille n’est pas le critère ici : c’est l’effet donneur ou attracteur des substituants.'),
      F('Les deux, car la charge est la même', 'Même charge ne veut pas dire même stabilité : les substituants jouent un rôle.'),
      F('Cl₃C⁻ est moins stable, car les chlores ajoutent des électrons', 'Un chlore est plus électronégatif que le carbone : il attire les électrons, il n’en ajoute pas.'),
    ] },
  { id: 'sta-ana-majoritaire', domaine: DOM, titre: 'Produit majoritaire de l’addition de HBr sur le propène',
    enonce: 'Mécanisme fourni : H⁺ se fixe sur un carbone de la double liaison du propène CH₃–CH=CH₂ pour former un carbocation, puis Br⁻ se fixe sur le carbone chargé.', q: 'Quel est le produit majoritaire ?', options: [
      F('Le 1-bromopropane, car il vient du carbocation primaire, le moins encombré', 'Le carbocation primaire est moins stable : il se forme moins vite.'),
      F('Les deux produits en quantités égales', 'Les deux carbocations n’ont pas la même stabilité : les produits ne se forment pas à parts égales.'),
      V('Le 2-bromopropane, issu du carbocation secondaire', 'Le carbocation secondaire (classe II) est plus stable que le primaire : il se forme majoritairement.'),
      F('Le propane, sans brome', 'Br⁻ se fixe sur le carbone chargé : le produit contient du brome.'),
    ] },
];

export const STA_VAL = [
  P({ id: 'sta-val-plan', domaine: DOM, niveau: 2, titre: 'Un élève compare deux intermédiaires', plausible: false,
    enonce: 'Un élève affirme : « le carbanion CH₃⁻ est plan comme le carbocation CH₃⁺, car dans les deux cas le carbone a trois liaisons ».',
    reperes: [['CH₃⁺', 'carbone : 3 liaisons, 0 doublet non liant'], ['CH₃⁻', 'carbone : 3 liaisons, 1 doublet non liant']],
    ver: 'Le carbanion a un groupe d’électrons de plus (le doublet non liant) : quatre groupes d’électrons, AX₃E₁, donc une pyramide. Seul le carbocation (AX₃E₀) est plan.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      F('il pense à tort que le carbocation CH₃⁺ est plan', 'Le carbocation AX₃E₀ est bien plan : l’erreur est ailleurs.'),
      V('il oublie le doublet non liant du carbanion', 'Le doublet non liant compte comme un groupe d’électrons : le carbanion est AX₃E₁, pyramidal.'),
      F('il confond la charge + du carbocation et la charge −', 'La charge n’est pas en cause : c’est la géométrie qui dépend du doublet non liant.'),
    ] }),
  P({ id: 'sta-val-tertiaire', domaine: DOM, niveau: 2, titre: 'Pourquoi le carbocation tertiaire domine ?', plausible: false,
    enonce: 'Une élève explique : « le carbocation tertiaire est le moins stable, car trois groupes alkyles retirent des électrons au carbone chargé ».',
    reperes: [['Groupe alkyle', 'donneur d’électrons'], ['Carbocation', 'a une lacune d’électrons']],
    ver: 'Un groupe alkyle est donneur : il envoie des électrons vers le carbone chargé + et le stabilise. Plus il y a de groupes alkyles, plus le carbocation est stable : le tertiaire est le plus stable.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('un groupe alkyle est donneur, pas attracteur', 'Le carbocation manque d’électrons : les groupes donneurs l’aident, donc le tertiaire est le plus stable.'),
      F('le carbocation tertiaire n’existe pas en chimie organique', 'Les carbocations tertiaires existent et sont même les plus stables.'),
      F('il faut compter les atomes d’hydrogène et non les groupes alkyles', 'Ce sont bien les groupes alkyles liés au carbone chargé qui comptent pour la classe.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const INTER = [
  { nom: 'un carbocation', nl: 3, lp: 0, ec: 0 }, { nom: 'un carbanion', nl: 3, lp: 1, ec: 0 }, { nom: 'un radical', nl: 3, lp: 0, ec: 1 },
];
export const STA_SAPP = [
  {
    id: 'sta-sapp-electrons', domaine: DOM, titre: 'Électrons et groupes d’électrons autour du carbone d’un intermédiaire', noms: ['Nombre d’électrons autour du carbone', 'Nombre de groupes d’électrons'],
    gen: () => ({ ...tire(INTER), Mm: tire([29, 43, 57]) }),
    build: epure((p, q) => {
      const tokens = {
        nl: tok(`${p.nl} liaisons`, 'Nombre de liaisons du carbone', p.nl, ''), lp: tok(`${p.lp} doublet${p.lp > 1 ? 's' : ''} non liant${p.lp > 1 ? 's' : ''}`, 'Nombre de doublets non liants', p.lp, ''), ec: tok(`${p.ec} électron célibataire`, 'Électrons célibataires', p.ec, ''),
        Mm: tok(`${p.Mm} g/mol`, 'Masse molaire de l’intermédiaire', p.Mm, 'g/mol'), temp: tok('298 K', 'Température', 298, 'K'),
      };
      const raisons = { Mm: 'La masse molaire ne sert pas à compter des électrons ni des groupes.', temp: 'La température ne change pas le nombre d’électrons autour du carbone.', ec: 'L’électron célibataire n’est pas un groupe d’électrons à part entière dans cette question.', lp: 'Ici, les doublets non liants ne sont pas à compter pour cette grandeur.' };
      const elec = 2 * p.nl + 2 * p.lp + p.ec, grp = p.nl + p.lp;
      const lpTxt = p.lp ? [' et ', T('lp')] : [];
      const ecTxt = p.ec ? [' et ', T('ec')] : [];
      const debut = ['On étudie ', p.nom, ' de masse molaire ', T('Mm'), ' à ', T('temp'), '. Son atome de carbone a ', T('nl'), ...lpTxt, ...ecTxt, '. '];
      return q === 0
        ? { tokens, derivees: ['électrons = 2 × liaisons + 2 × doublets non liants + électrons célibataires'], texte: [...debut, 'Combien d’électrons entourent ce carbone ?'], utiles: ['nl', ...(p.lp ? ['lp'] : []), ...(p.ec ? ['ec'] : [])],
          raisons, cherche: { bonne: 'Le nombre d’électrons autour du carbone', faux: ['Le nombre de groupes d’électrons', 'La charge de l’intermédiaire', 'Le nombre de liaisons'] }, manque: null, solution: { txt: '2 × liaisons + 2 × doublets non liants + électrons célibataires', val: elec, u: '' } }
        : { tokens, derivees: ['groupes = liaisons + doublets non liants'], texte: [...debut, 'Combien de groupes d’électrons (liaisons et doublets non liants) entourent ce carbone, au sens de la méthode VSEPR ?'], utiles: ['nl', ...(p.lp ? ['lp'] : [])],
          raisons, cherche: { bonne: 'Le nombre de groupes d’électrons autour du carbone', faux: ['Le nombre total d’électrons', 'La charge de l’intermédiaire', 'Le nombre de liaisons seulement'] }, manque: null, solution: { txt: 'liaisons + doublets non liants', val: grp, u: '' } };
    }),
  },
  {
    id: 'sta-sapp-classe', domaine: DOM, titre: 'Classe d’un carbocation', noms: ['Classe du carbocation', 'Nombre d’atomes d’hydrogène sur le carbone chargé'],
    gen: () => ({ n: tire([1, 2]), V: tire([100, 250]) }),
    build: epure((p, q) => {
      const tokens = {
        n: tok(`${p.n} atome${p.n > 1 ? 's' : ''} de carbone`, 'Atomes de carbone liés au carbone chargé', p.n, ''), tot: tok('3 liaisons au total', 'Le carbone chargé a trois liaisons', 3, ''),
        V: tok(`${p.V} mL`, 'Volume de solution', p.V, 'mL'),
      };
      const raisons = { V: 'Le volume de solution ne change pas la structure d’un carbocation.', tot: 'Le nombre total de liaisons est donné pour le calcul des hydrogènes.' };
      const debut = ['Dans ', T('V'), ' de solution, on étudie un carbocation dont le carbone chargé est lié à ', T('n'), ' (groupes alkyles), les autres liaisons étant des liaisons C–H. Ce carbone possède ', T('tot'), '. '];
      return q === 0
        ? { tokens, derivees: ['classe = nombre de carbones liés au carbone chargé'], texte: [...debut, 'Quelle est la classe (I, II ou III) du carbocation ? Donnez le nombre.'], utiles: ['n'],
          raisons, cherche: { bonne: 'La classe du carbocation', faux: ['Le nombre d’hydrogènes', 'La charge', 'Le nombre de liaisons au total'] }, manque: null, solution: { txt: 'nombre de carbones liés au carbone chargé', val: p.n, u: '' } }
        : { tokens, derivees: ['H = liaisons totales − carbones liés'], texte: [...debut, 'Combien d’atomes d’hydrogène sont liés au carbone chargé ?'], utiles: ['n', 'tot'],
          raisons: { V: raisons.V }, cherche: { bonne: 'Le nombre d’atomes d’hydrogène liés au carbone chargé', faux: ['La classe du carbocation', 'Le nombre de carbones liés', 'Le nombre de liaisons'] }, manque: null, solution: { txt: '3 − nombre de carbones liés', val: 3 - p.n, u: '' } };
    }),
  },
];
void T;
