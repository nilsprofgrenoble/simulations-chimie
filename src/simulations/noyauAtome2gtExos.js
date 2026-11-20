// Exercices ANA (prévoir sans calculer), VAL (plausible ?) et S'APP (repérer les données utiles) de la simulation 202 « Le noyau de l'atome : taille, masse et écriture ZAX » (2GT).
// Préfixe d'identifiants : noy2gt- ; domaine : « Noyau de l’atome (2GT) ». Branchés dans AtelierAnalyserBanque.js, AtelierValiderBanque.js et AtelierDonneesBanque.js ; la famille REA est dans AtelierRealiserBanque.jsx (genNoyau2GT).
// Questions adossées aux capacités du programme : ordre de grandeur de la taille d'un atome, comparaison de la taille et de la masse d'un atome et de son noyau, écriture conventionnelle d'un noyau, charge et masse des particules, atome neutre.
// Questions adossées aux capacités du programme : ordre de grandeur de la taille d'un atome, comparaison de la taille et de la masse d'un atome et de son noyau, écriture conventionnelle d'un noyau, charge et masse des particules, atome neutre.
const DOM = 'Noyau de l’atome (2GT)';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

// ───────────── ANA : prévoir sans calculer ─────────────
export const NOY2GT_ANA = [
  { id: 'noy2gt-ana-masse', domaine: DOM, titre: 'Ce que pèsent les électrons du sodium',
    enonce: 'Un atome de sodium contient 11 protons, 12 neutrons et 11 électrons. On compare la masse de l’atome entier à celle de son seul noyau.', q: 'De combien l’atome pèse-t-il plus que son noyau ?', options: [
      V('de moins de 0,1\u00a0% : presque rien', 'Un électron est environ 1\u00a0800 fois plus léger qu’un nucléon : les 11 électrons ajoutent environ 0,03\u00a0% à la masse du noyau (23 nucléons). L’atome pèse presque autant que son noyau.'),
      F('d’environ 48\u00a0% : 11 particules de plus', 'On aurait 11 ÷ 23 ≈ 48\u00a0% si un électron pesait autant qu’un nucléon. Or il pèse 1\u00a0800 fois moins : l’ajout est minuscule.'),
      F('d’environ 1\u00a0800 fois : les électrons sont lourds', 'C’est le rapport inversé : un électron est 1\u00a0800 fois plus léger qu’un nucléon, et non plus lourd.'),
      F('de 100\u00a0000 fois : le nuage est immense', 'Le nombre 100\u00a0000 compare des tailles, pas des masses. Le nuage est grand, mais sa masse est minuscule.'),
    ] },
  { id: 'noy2gt-ana-charge', domaine: DOM, titre: 'La charge du noyau de chlore',
    enonce: 'Un noyau de chlore contient 17 protons et 18 neutrons. La charge élémentaire est e.', q: 'Quelle est la charge électrique de ce noyau ?', options: [
      V('+17e : seuls les protons comptent', 'Chaque proton porte +e, les neutrons n’ont pas de charge : la charge du noyau est 17 × (+e) = +17e.'),
      F('+35e : tous les nucléons comptent', 'Les neutrons n’ont pas de charge électrique : on ne compte que les 17 protons, pas les 35 nucléons.'),
      F('0 : le noyau est neutre comme l’atome', 'C’est l’atome entier qui est neutre, grâce aux électrons. Le noyau, lui, porte la charge positive de ses protons.'),
      F('+18e : ce sont les neutrons qui sont positifs', 'Les neutrons n’ont pas de charge. Ce sont les protons (17 ici) qui portent +e chacun.'),
    ] },
  { id: 'noy2gt-ana-echelle', domaine: DOM, titre: 'Un atome agrandi jusqu’à un stade',
    enonce: 'On agrandit un atome et son noyau avec le même facteur, jusqu’à ce que l’atome ait la taille d’un stade de 100\u00a0m. Rappel : l’atome est 100\u00a0000 fois plus large que son noyau.', q: 'Quelle serait alors la taille du noyau agrandi ?', options: [
      V('environ 1\u00a0mm : un grain de sable', '100\u00a0m ÷ 100\u00a0000 = 0,001\u00a0m = 1\u00a0mm : le noyau serait un grain de sable au centre d’un stade.'),
      F('environ 1\u00a0cm : une bille', '1\u00a0cm serait 10 fois trop grand : 100\u00a0m ÷ 100\u00a0000 = 0,001\u00a0m, soit 1\u00a0mm, et non 1\u00a0cm.'),
      F('environ 10\u00a0cm : une balle', 'On aurait 10\u00a0cm en divisant par 1\u00a0000 seulement. Le rapport est 100\u00a0000 : 100\u00a0m ÷ 100\u00a0000 = 1\u00a0mm.'),
      F('environ 0,01\u00a0mm : une poussière fine', 'Ce serait 100 fois trop petit : 100\u00a0m ÷ 100\u00a0000 = 0,001\u00a0m = 1\u00a0mm.'),
    ] },
  { id: 'noy2gt-ana-element', domaine: DOM, titre: 'Ce qui fait un noyau de carbone',
    enonce: 'Le carbone est un élément chimique : tous ses atomes se ressemblent par leur noyau.', q: 'Qu’est-ce qui permet d’affirmer qu’un noyau est un noyau de carbone ?', options: [
      V('il contient 6 protons', 'Le numéro atomique Z, le nombre de protons, donne l’identité de l’élément : Z = 6 pour le carbone.'),
      F('il contient 12 nucléons', 'Le nombre de nucléons A ne suffit pas : des noyaux d’éléments différents peuvent avoir le même nombre de nucléons. C’est Z qui identifie l’élément.'),
      F('il contient 6 neutrons', 'Le nombre de neutrons ne donne pas l’élément : c’est le nombre de protons qui le donne.'),
      F('il pèse environ 2,0\u00a0×\u00a010⁻²⁶\u00a0kg', 'La masse dépend du nombre de nucléons, pas de l’élément seul : elle ne permet pas d’identifier le carbone.'),
    ] },
  { id: 'noy2gt-ana-ecriture', domaine: DOM, titre: 'Une écriture impossible',
    enonce: 'On écrit chaque noyau avec son nombre de masse A en haut et son numéro atomique Z en bas.', q: 'Parmi ces écritures, laquelle ne peut décrire aucun noyau ?', options: [
      V('un noyau ⁶₁₂C', 'A = 6 nucléons mais Z = 12 protons : il y aurait plus de protons que de nucléons, ce qui est impossible, car les protons sont des nucléons.'),
      F('un noyau ¹²₆C', 'A = 12 nucléons dont Z = 6 protons : il reste 6 neutrons. L’écriture est possible.'),
      F('un noyau ⁴₂He', 'A = 4 nucléons dont 2 protons : il reste 2 neutrons. L’écriture est possible.'),
      F('un noyau d’hydrogène ¹₁H', 'A = 1 nucléon qui est un proton, sans neutron : l’écriture est possible.'),
    ] },
];

// ───────────── VAL : plausible ? ─────────────
export const NOY2GT_VAL = [
  P({ id: 'noy2gt-val-taille-noyau', domaine: DOM, niveau: 1, titre: 'La taille du noyau d’un atome', plausible: false,
    enonce: 'Un élève écrit : « le noyau d’un atome mesure environ 10⁻¹⁰\u00a0m ».',
    reperes: [['Atome', 'environ 10⁻¹⁰\u00a0m'], ['Noyau', 'environ 10⁻¹⁵\u00a0m'], ['Quotient', 'l’atome est environ 100\u00a0000 fois plus large que son noyau']],
    ver: 'La valeur 10⁻¹⁰\u00a0m est la taille de l’atome entier. Le noyau est 100\u00a0000 fois plus petit : environ 10⁻¹⁵\u00a0m.',
    q2: 'Quelle erreur explique le mieux sa réponse ?',
    options: [
      V('il donne la taille de l’atome entier', 'Un atome mesure environ 10⁻¹⁰\u00a0m ; son noyau est 100\u00a0000 fois plus petit, environ 10⁻¹⁵\u00a0m.'),
      F('il a mal converti des mètres en nanomètres', 'Aucune conversion n’est en cause : la valeur est exprimée en mètres, mais c’est celle de l’atome et non celle du noyau.'),
      F('il pense que le noyau est plus grand', 'Le noyau est au centre de l’atome et bien plus petit que lui : il est contenu dans l’atome.'),
    ] }),
  P({ id: 'noy2gt-val-rapport-masses', domaine: DOM, niveau: 2, titre: 'Proton et électron', plausible: true,
    enonce: 'Un élève calcule : « 1,67\u00a0×\u00a010⁻²⁷\u00a0kg ÷ (9,11\u00a0×\u00a010⁻³¹\u00a0kg) ≈ 1,8\u00a0×\u00a010³ : l’électron est environ 1\u00a0800 fois plus léger que le proton ».',
    reperes: [['Proton', '1,67\u00a0×\u00a010⁻²⁷\u00a0kg'], ['Électron', '9,11\u00a0×\u00a010⁻³¹\u00a0kg'], ['Règle', 'on divise les nombres, puis on soustrait les nombres du haut : −27 − (−31) = 4']],
    ver: '1,67 ÷ 9,11 ≈ 0,183 et 10⁻²⁷ ÷ 10⁻³¹ = 10⁴ : on obtient 0,183\u00a0×\u00a010⁴ ≈ 1,8\u00a0×\u00a010³. Le résultat est juste.',
    q2: 'Pourquoi ce résultat est-il vraisemblable ?',
    options: [
      V('un électron est très léger devant un proton', 'Le proton pèse environ 10³ fois plus que l’électron : le quotient 1,8\u00a0×\u00a010³ est un grand nombre, comme on s’y attend.'),
      F('un électron et un proton ont des masses presque égales', 'C’est faux : l’électron est environ 1\u00a0800 fois plus léger. Cela ne justifie donc pas le résultat.'),
      F('le quotient de deux masses vaut toujours environ 1', 'Le quotient de deux masses peut être très grand ou très petit : ici les masses sont très différentes.'),
    ] }),
  P({ id: 'noy2gt-val-neutrons-sodium', domaine: DOM, niveau: 1, titre: 'Les neutrons du sodium', plausible: false,
    enonce: 'Le noyau de sodium s’écrit ²³₁₁Na. Un élève annonce : « il contient 34 neutrons, car 23 + 11 = 34 ».',
    reperes: [['A', 'nombre de nucléons : 23'], ['Z', 'nombre de protons : 11'], ['Neutrons', 'nucléons moins protons : A − Z']],
    ver: 'Les neutrons sont les nucléons qui ne sont pas des protons : 23 − 11 = 12. Un noyau ne peut pas avoir plus de neutrons que de nucléons (34 est plus grand que 23).',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il additionne au lieu de soustraire', 'Les protons font partie des nucléons : on retire Z à A, 23 − 11 = 12 neutrons.'),
      F('il prend A pour le nombre de neutrons', 'Avec cette erreur, il aurait répondu 23 neutrons, pas 34. Son résultat vient d’une addition : 23 + 11 = 34.'),
      F('il divise A par Z', 'Avec cette erreur, il aurait trouvé 23 ÷ 11 ≈ 2,1, pas 34. Son résultat vient de l’addition 23 + 11.'),
    ] }),
  P({ id: 'noy2gt-val-charge-helium', domaine: DOM, niveau: 2, titre: 'La charge du noyau d’hélium', plausible: false,
    enonce: 'Le noyau d’hélium s’écrit ⁴₂He. Un élève calcule sa charge : « il y a 4 nucléons, donc 4 × 1,60\u00a0×\u00a010⁻¹⁹\u00a0C = 6,4\u00a0×\u00a010⁻¹⁹\u00a0C ».',
    reperes: [['Protons', '2'], ['Neutrons', '2, sans charge'], ['Charge élémentaire', 'e = 1,60\u00a0×\u00a010⁻¹⁹\u00a0C']],
    ver: 'Seuls les 2 protons portent une charge : 2 × 1,60\u00a0×\u00a010⁻¹⁹ = 3,20\u00a0×\u00a010⁻¹⁹\u00a0C. L’élève a multiplié par A = 4, qui compte aussi les neutrons.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il compte aussi les neutrons, sans charge', 'La charge est celle des protons seuls : 2 × e, soit 3,20\u00a0×\u00a010⁻¹⁹\u00a0C.'),
      F('il compte un seul proton', 'Avec un seul proton, il aurait trouvé 1,60\u00a0×\u00a010⁻¹⁹\u00a0C, pas 6,4\u00a0×\u00a010⁻¹⁹\u00a0C : ce n’est pas ce qu’il a fait.'),
      F('il oublie de multiplier par le nombre de particules', 'Sans multiplier, il aurait donné e = 1,60\u00a0×\u00a010⁻¹⁹\u00a0C. Son résultat, 6,4, est quatre fois plus grand : il a bien multiplié, mais par 4 au lieu de 2.'),
    ] }),
  P({ id: 'noy2gt-val-masse-oxygene', domaine: DOM, niveau: 2, titre: 'La masse d’un atome d’oxygène', plausible: true,
    enonce: 'L’oxygène s’écrit ¹⁶₈O. Un élève estime la masse d’un atome : « 16 × 1,67\u00a0×\u00a010⁻²⁷\u00a0kg ≈ 2,7\u00a0×\u00a010⁻²⁶\u00a0kg ».',
    reperes: [['Nucléons', 'A = 16'], ['Un nucléon', '1,67\u00a0×\u00a010⁻²⁷\u00a0kg'], ['Électrons', 'leur masse est négligeable']],
    ver: '16 × 1,67 = 26,7 : 26,7\u00a0×\u00a010⁻²⁷\u00a0kg = 2,7\u00a0×\u00a010⁻²⁶\u00a0kg. Les électrons ajoutent moins de 0,1\u00a0% : l’estimation est vraisemblable.',
    q2: 'Pourquoi peut-on ignorer les électrons dans ce calcul ?',
    options: [
      V('ils sont 1\u00a0800 fois plus légers qu’un nucléon', 'Leur masse totale est négligeable devant celle des 16 nucléons : la masse de l’atome est presque celle de son noyau.'),
      F('les atomes d’oxygène n’ont pas d’électrons', 'L’atome neutre d’oxygène a 8 électrons : on les ignore parce qu’ils pèsent très peu.'),
      F('les électrons sont dans le noyau avec les nucléons', 'Les électrons sont autour du noyau, dans le nuage. Ils pèsent très peu, c’est pourquoi on les ignore.'),
    ] }),
];

// ───────────── S'APP : repérer les données utiles ─────────────
const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const ELEMENTS = [['le lithium', 'Li', 3, 7], ['le carbone', 'C', 6, 12], ['l’azote', 'N', 7, 14], ['l’oxygène', 'O', 8, 16], ['le sodium', 'Na', 11, 23], ['le magnésium', 'Mg', 12, 24], ['le chlore', 'Cl', 17, 35], ['l’argon', 'Ar', 18, 40]];
export const NOY2GT_SAPP = [
  {
    id: 'noy2gt-sapp-compo', domaine: DOM, titre: 'La masse d’un noyau et son nombre de nucléons', noms: ['Masse du noyau', 'Nombre de nucléons du noyau'],
    gen: () => { const [le, s, Z, A] = tire(ELEMENTS); return { le, s, Z, A, N: A - Z, taille: tire([1, 2, 3]) }; },
    build: epure((p, q) => {
      const nom = p.le.replace(/^l’|^le /, ''), de = /^[aeiouyéèh]/i.test(nom) ? 'd’' : 'de ';
      const tokens = {
        A: tok(`${p.A} nucléons`, 'Nombre de nucléons du noyau', p.A, ''),
        Z: tok(`${p.Z} protons`, 'Nombre de protons du noyau', p.Z, ''),
        N: tok(`${p.N} neutrons`, 'Nombre de neutrons du noyau', p.N, ''),
        e: tok('1,60 × 10⁻¹⁹ C', 'Charge élémentaire e', 1.60e-19, 'C'),
        m: tok('1,67 × 10⁻²⁷ kg', 'Masse d’un nucléon', 1.67e-27, 'kg'),
        t: tok(`${p.taille} × 10⁻¹⁰ m`, 'Diamètre de l’atome (ordre de grandeur)', p.taille * 1e-10, 'm'),
        el: tok(nom, 'Élément chimique', 0, ''),
      };
      if (q === 0) return { tokens, derivees: [], texte: ['Un noyau ', de, T('el'), ' contient ', T('A'), ', dont ', T('Z'), '. L’atome mesure environ ', T('t'), ' et la charge élémentaire est ', T('e'), '. Un nucléon pèse ', T('m'), '. Quelle est la masse du noyau ?'], utiles: ['A', 'm'],
        raisons: { Z: 'Le nombre de protons ne suffit pas : la masse du noyau compte tous les nucléons.', e: 'La charge élémentaire sert pour une charge électrique, pas pour une masse.', t: 'La taille de l’atome ne sert pas pour calculer la masse du noyau.', el: 'Le nom de l’élément est déjà donné par le nombre de protons : il ne sert pas dans le calcul.' },
        cherche: { bonne: 'La masse du noyau (en kg)', faux: ['La charge du noyau (en coulombs)', 'Le nombre de neutrons du noyau', 'La taille du noyau (en m)'] },
        manque: null, solution: { txt: 'masse du noyau ≈ nombre de nucléons × masse d’un nucléon', val: p.A * 1.67e-27, u: 'kg' } };
      return { tokens, derivees: [], texte: ['Un noyau ', de, T('el'), ' contient ', T('Z'), ' et ', T('N'), '. L’atome mesure environ ', T('t'), ' et un nucléon pèse ', T('m'), '. Combien le noyau contient-il de nucléons ?'], utiles: ['Z', 'N'],
        raisons: { m: 'La masse d’un nucléon sert pour une masse, pas pour compter des particules.', t: 'La taille de l’atome ne sert pas pour compter les nucléons.', el: 'Le nom de l’élément ne sert pas dans le calcul.' },
        cherche: { bonne: 'Le nombre de nucléons du noyau', faux: ['La masse du noyau (en kg)', 'La charge du noyau (en coulombs)', 'Le nombre d’électrons de l’atome neutre'] },
        manque: null, solution: { txt: 'nucléons = protons + neutrons', val: p.A, u: 'nucléons' } };
    }),
  },
  {
    id: 'noy2gt-sapp-echelle', domaine: DOM, titre: 'Un atome et son noyau agrandis', noms: ['Taille du noyau agrandi', 'Taille de l’atome agrandi'],
    gen: () => ({ D: tire([50, 100, 200, 500]), d: tire([1, 2, 5, 10]), Z: tire([6, 8, 11, 17]) }),
    build: epure((p, q) => {
      const tokens = {
        atome: tok('10⁻¹⁰ m', 'Taille de l’atome', 1e-10, 'm'),
        noyau: tok('10⁻¹⁵ m', 'Taille du noyau', 1e-15, 'm'),
        D: tok(`${p.D} m`, 'Taille de l’atome agrandi', p.D, 'm'),
        d: tok(`${p.d} mm`, 'Taille du noyau agrandi', p.d * 1e-3, 'm'),
        Z: tok(`${p.Z} protons`, 'Nombre de protons', p.Z, ''),
        m: tok('1,67 × 10⁻²⁷ kg', 'Masse d’un nucléon', 1.67e-27, 'kg'),
      };
      const raisons = { Z: 'Le nombre de protons ne change pas les tailles : l’agrandissement ne dépend que du rapport entre l’atome et son noyau.', m: 'La masse d’un nucléon ne sert pas pour agrandir des tailles.' };
      const debut = ['Un atome contenant ', T('Z'), ' (un nucléon pèse ', T('m'), ') a une taille de ', T('atome'), ' ; son noyau mesure ', T('noyau'), '. On agrandit l’atome et son noyau avec le même facteur. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'L’atome agrandi mesure ', T('D'), '. Quelle est la taille du noyau agrandi ?'], utiles: ['atome', 'noyau', 'D'], raisons,
        cherche: { bonne: 'La taille du noyau agrandi (en mm)', faux: ['Le facteur d’agrandissement exact (sans unité)', 'La masse du noyau agrandi (en kg)', 'La taille de l’atome non agrandi (en m)'] },
        manque: null, solution: { txt: 'taille du noyau agrandi = D × (noyau ÷ atome)', val: p.D * 1e-2, u: 'mm' } };
      return { tokens, derivees: [], texte: [...debut, 'Le noyau agrandi mesure ', T('d'), '. Quelle est la taille de l’atome agrandi ?'], utiles: ['atome', 'noyau', 'd'], raisons,
        cherche: { bonne: 'La taille de l’atome agrandi (en m)', faux: ['La taille du noyau avant agrandissement (en m)', 'Le nombre de protons de l’atome', 'La masse de l’atome agrandi (en kg)'] },
        manque: null, solution: { txt: 'taille de l’atome agrandi = d × (atome ÷ noyau)', val: p.d * 1e-3 * 1e5, u: 'm' } };
    }),
  },
];
