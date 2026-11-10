// ═══════════════════════════════════════════════════════════════════════════
//  BANQUE D'EXERCICES « RÉGIOSÉLECTIVITÉ » (BTS Métiers de la chimie)
//  Même format que AtelierSituationsBanque.js (exercices à étapes : QCM et saisies, une aide par étape, nombres tirés au hasard).
//  Compétences visées (chimie organique, addition électrophile sur les alcènes) :
//   • Reconnaître un alcène symétrique ou dissymétrique et prévoir le nombre de produits       → regio-nombre
//   • Écrire un carbocation intermédiaire et le classer (primaire, secondaire, tertiaire)      → regio-carbocation
//   • Comparer la stabilité de carbocations (effet donneur des groupes alkyle)                 → regio-stabilite
//   • Prévoir le produit majoritaire (règle de Markovnikov expliquée par le mécanisme)        → regio-produit
//   • Exploiter un profil d'énergie à deux voies, loi d'Arrhenius, effet de la température    → regio-barrieres
//   • Relier régiosélectivité et stéréochimie (carbone asymétrique, mélange racémique)         → regio-chiral
//  Les valeurs d'énergie sont des ordres de grandeur, comme dans la simulation « Régiosélectivité de l'addition de HBr ».
// ═══════════════════════════════════════════════════════════════════════════

const tire = t => t[Math.floor(Math.random() * t.length)];
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const nb = (x, d) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const maj1 = s => s.charAt(0).toUpperCase() + s.slice(1);
const DOM = 'Régiosélectivité (BTS)';
const melange = t => t.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
const CL = { primaire: 1, secondaire: 2, tertiaire: 3 };

// ── Nombre de produits d'addition de HBr ──
const NOMBRE = [
  { nom: 'le but-2-ène', f: 'CH₃–CH=CH–CH₃', cas: 'sym', prod: ['le 2-bromobutane'], note: 'Les deux carbones de la double liaison portent chacun un H et un CH₃ : ils sont équivalents.' },
  { nom: 'l\'hex-3-ène', f: 'CH₃–CH₂–CH=CH–CH₂–CH₃', cas: 'sym', prod: ['le 3-bromohexane'], note: 'Les deux carbones de la double liaison portent chacun un H et un éthyle : ils sont équivalents.' },
  { nom: 'le propène', f: 'CH₃–CH=CH₂', cas: 'sel', prod: ['le 1-bromopropane', 'le 2-bromopropane'], cA: 'secondaire', cB: 'primaire', note: 'Un carbone de la double liaison porte un CH₃, l\'autre deux H : ils ne sont pas équivalents.' },
  { nom: 'le pent-2-ène', f: 'CH₃–CH=CH–CH₂–CH₃', cas: 'mel', prod: ['le 2-bromopentane', 'le 3-bromopentane'], cA: 'secondaire', cB: 'secondaire', note: 'Un carbone porte un CH₃, l\'autre un éthyle : ils ne sont pas équivalents.' },
  { nom: 'le 2-méthylbut-2-ène', f: '(CH₃)₂C=CH–CH₃', cas: 'sel', prod: ['le 2-bromo-2-méthylbutane', 'le 3-bromo-2-méthylbutane'], cA: 'tertiaire', cB: 'secondaire', note: 'Un carbone porte deux CH₃, l\'autre un H et un CH₃ : ils ne sont pas équivalents.' },
];

// ── Carbocations ──
const ALCENES = [
  { nom: 'le propène', f: 'CH₃–CH=CH₂', H1: { c: 'C2', cat: 'CH₃–CH⁺–CH₃', cl: 'secondaire' }, H2: { c: 'C1', cat: 'CH₃–CH₂–CH₂⁺', cl: 'primaire' } },
  { nom: 'le but-1-ène', f: 'CH₃–CH₂–CH=CH₂', H1: { c: 'C2', cat: 'CH₃–CH₂–CH⁺–CH₃', cl: 'secondaire' }, H2: { c: 'C1', cat: 'CH₃–CH₂–CH₂–CH₂⁺', cl: 'primaire' } },
  { nom: 'le 2-méthylprop-1-ène', f: '(CH₃)₂C=CH₂', H1: { c: 'C2', cat: '(CH₃)₃C⁺', cl: 'tertiaire' }, H2: { c: 'C1', cat: '(CH₃)₂CH–CH₂⁺', cl: 'primaire' } },
  { nom: 'le 2-méthylbut-2-ène', f: '(CH₃)₂C=CH–CH₃', H1: { c: 'C3', cat: '(CH₃)₂CH–CH⁺–CH₃', cl: 'secondaire' }, H2: { c: 'C2', cat: '(CH₃)₂C⁺–CH₂–CH₃', cl: 'tertiaire' } },
];
// H1 : carbocation obtenu quand H se fixe sur le carbone « de gauche » (C1, ou C2 pour le méthylbutène) ; H2 : sur l'autre
const CARBONE_H = [['C1', 'C2'], ['C1', 'C2'], ['C1', 'C2'], ['C2', 'C3']];

// ── Stabilité ──
const TRIPLETS = [
  [['CH₃–CH₂⁺', 'primaire'], ['(CH₃)₂CH⁺', 'secondaire'], ['(CH₃)₃C⁺', 'tertiaire']],
  [['CH₃–CH₂–CH₂–CH₂⁺', 'primaire'], ['CH₃–CH₂–CH⁺–CH₃', 'secondaire'], ['(CH₃)₂C⁺–CH₂–CH₃', 'tertiaire']],
  [['(CH₃)₂CH–CH₂⁺', 'primaire'], ['(CH₃)₂CH–CH⁺–CH₃', 'secondaire'], ['(CH₃)₂C⁺–CH₂–CH₃', 'tertiaire']],
];

// ── Produit majoritaire sur des alcènes nouveaux (pas de transposition attendue) ──
const NOUVEAUX = [
  { nom: 'le pent-1-ène', f: 'CH₃–CH₂–CH₂–CH=CH₂', hC: 'C1', pM: 'le 2-bromopentane', pm: 'le 1-bromopentane', cM: 'secondaire', cm: 'primaire' },
  { nom: 'l\'hex-1-ène', f: 'CH₃–(CH₂)₃–CH=CH₂', hC: 'C1', pM: 'le 2-bromohexane', pm: 'le 1-bromohexane', cM: 'secondaire', cm: 'primaire' },
  { nom: 'le 2-méthylpent-1-ène', f: 'CH₂=C(CH₃)–CH₂–CH₂–CH₃', hC: 'C1', pM: 'le 2-bromo-2-méthylpentane', pm: 'le 1-bromo-2-méthylpentane', cM: 'tertiaire', cm: 'primaire' },
  { nom: 'le 1-méthylcyclohexène', f: 'cycle à 6 carbones avec une double liaison C1=C2 et un CH₃ sur C1', hC: 'C2', pM: 'le 1-bromo-1-méthylcyclohexane', pm: 'le 1-bromo-2-méthylcyclohexane', cM: 'tertiaire', cm: 'secondaire' },
];

// ── Régiosélectivité et chiralité ──
const CHIRAL = [
  { nom: 'le but-1-ène', f: 'CH₃–CH₂–CH=CH₂', p: 'le 2-bromobutane', ch: true, subs: 'H, CH₃, CH₂CH₃ et Br' },
  { nom: 'le pent-1-ène', f: 'CH₃–CH₂–CH₂–CH=CH₂', p: 'le 2-bromopentane', ch: true, subs: 'H, CH₃, CH₂CH₂CH₃ et Br' },
  { nom: 'le propène', f: 'CH₃–CH=CH₂', p: 'le 2-bromopropane', ch: false, subs: 'H, CH₃, CH₃ et Br (deux groupes identiques)' },
  { nom: 'le 2-méthylbut-1-ène', f: 'CH₂=C(CH₃)–CH₂–CH₃', p: 'le 2-bromo-2-méthylbutane', ch: false, subs: 'CH₃, CH₃, CH₂CH₃ et Br (deux groupes identiques)' },
];

export const EXERCICES = [
  // ── R1 : nombre de produits ──
  {
    id: 'regio-nombre', domaine: DOM, niveau: 2, titre: 'Combien de produits dans l\'addition de HBr ?',
    construire: () => {
      const a = tire(NOMBRE), n = a.prod.length;
      return {
        enonce: `On fait réagir ${a.nom} (${a.f}) avec le bromure d'hydrogène HBr, sans peroxydes (mécanisme ionique en deux étapes, passant par un carbocation).`,
        etapes: [
          { id: 'nb', titre: 'Le nombre de produits', q: `Combien de produits d'addition différents (isomères de constitution) peut-on écrire ?`,
            aide: 'Regardez si les deux carbones de la double liaison sont équivalents : si oui, H et Br donnent le même produit quel que soit le carbone choisi.',
            o: [V(n === 1 ? 'Un seul' : 'Deux', n === 1 ? `${a.note} Un seul produit est possible : ${a.prod[0]}.` : `${a.note} Br peut se fixer sur l'un ou l'autre carbone : ${a.prod[0]} ou ${a.prod[1]}.`),
              F(n === 1 ? 'Deux' : 'Un seul', n === 1 ? 'Les deux carbones de la double liaison sont équivalents : H sur l\'un et Br sur l\'autre ou l\'inverse donnent la même molécule.' : 'Les deux carbones de la double liaison ne sont pas équivalents : on obtient deux isomères de constitution.'),
              F('Trois', 'La double liaison n\'a que deux carbones : H et Br ne peuvent se placer que de deux façons.')] },
          { id: 'cat', titre: 'Les carbocations', q: n === 1 ? 'Combien de carbocations différents peut-on former à l\'étape 1 ?' : `Les deux carbocations possibles sont-ils de même classe (primaire, secondaire, tertiaire) ?`,
            aide: n === 1 ? 'Si les deux carbones sont équivalents, les deux façons de fixer H conduisent au même carbocation.' : 'Comptez les carbones liés au carbone chargé + dans chaque carbocation.',
            o: n === 1
              ? [V('Un seul', 'Les deux carbones étant équivalents, un seul carbocation peut se former.'), F('Deux, de stabilités différentes', 'Il n\'y a qu\'un carbocation possible : pas de compétition entre deux voies.'), F('Aucun : l\'alcène réagit sans intermédiaire', 'Le mécanisme passe par un carbocation, intermédiaire de l\'étape 1.')]
              : a.cA === a.cB
                ? [V('Oui : les deux sont secondaires', 'Chaque carbone chargé + est lié à deux carbones : les deux carbocations sont secondaires, de stabilité voisine.'), F('Non : l\'un est tertiaire', 'Aucun des deux carbocations n\'est tertiaire ici.'), F('Non : l\'un est primaire', 'Aucun des deux carbocations n\'est primaire ici.')]
                : [V(`Non : un ${a.cA} et un ${a.cB}`, `L'un est ${a.cA}, l'autre ${a.cB} : leurs stabilités sont différentes.`), F('Oui : les deux sont de même classe', 'Les deux carbones n\'ont pas le même nombre de carbones voisins : les classes diffèrent.'), F(`Non : un ${a.cA === 'tertiaire' ? 'primaire' : 'tertiaire'} et un ${a.cB}`, 'Recomptez les carbones liés au carbone chargé + dans chaque carbocation.')] },
          { id: 'sel', titre: 'La conclusion', q: 'Que peut-on dire de la composition du mélange obtenu ?',
            aide: 'Si les deux carbocations ont des stabilités différentes, la voie la plus stable est la plus rapide.',
            o: [a.cas === 'sym' ? V('Un seul produit : la question de la régiosélectivité ne se pose pas', `Un seul produit est possible (${a.prod[0]}).`) : F('Un seul produit : la question de la régiosélectivité ne se pose pas', 'Deux produits sont possibles : la question se pose.'),
              a.cas === 'mel' ? V('Deux produits en proportions voisines : peu de régiosélectivité', 'Les deux carbocations secondaires ont des stabilités voisines : les deux voies sont à peu près aussi rapides.') : F('Deux produits en proportions voisines : peu de régiosélectivité', a.cas === 'sym' ? 'Un seul produit est possible ici.' : 'Les deux carbocations n\'ont pas la même stabilité : une voie est nettement favorisée.'),
              a.cas === 'sel' ? V('Un produit largement majoritaire : la réaction est régiosélective', 'Le carbocation le plus stable se forme beaucoup plus vite : son produit est largement majoritaire.') : F('Un produit largement majoritaire : la réaction est régiosélective', a.cas === 'sym' ? 'Un seul produit est possible ici : il n\'y a pas de choix entre deux voies.' : 'Les deux carbocations ont des stabilités voisines : pas de produit largement majoritaire.')] },
        ],
        retenir: ['Un alcène symétrique ne donne qu\'un produit d\'addition. Un alcène dissymétrique en donne deux : la réaction est régiosélective quand l\'un des deux carbocations est nettement plus stable que l\'autre.'],
      };
    },
  },

  // ── R2 : écrire le carbocation ──
  {
    id: 'regio-carbocation', domaine: DOM, niveau: 2, titre: 'Écrire le carbocation de l\'étape 1',
    construire: () => {
      const i = Math.floor(Math.random() * ALCENES.length), a = ALCENES[i];
      const voie = Math.random() < 0.5 ? 'H1' : 'H2', v = a[voie], w = a[voie === 'H1' ? 'H2' : 'H1'];
      const cH = CARBONE_H[i][voie === 'H1' ? 0 : 1];
      return {
        enonce: `À l'étape 1 de l'addition de HBr sur ${a.nom} (${a.f}), le doublet de la liaison π attaque l'atome H (δ+) de HBr. L'atome H se fixe sur le carbone ${cH} de la double liaison.`,
        etapes: [
          { id: 'ou', titre: 'La charge +', q: `Sur quel carbone se trouve la charge + du carbocation formé ?`,
            aide: 'Le carbone qui reçoit H utilise le doublet π ; l\'autre carbone de la double liaison perd sa part de ce doublet.',
            o: [V(`Sur ${v.c}`, `${cH} reçoit H grâce au doublet π ; ${v.c}, qui n'en reçoit plus sa part, n'a plus que 6 électrons : il porte la charge +.`),
              F(`Sur ${cH}`, `${cH} vient de se lier à H : il garde 8 électrons, la charge + est sur l'autre carbone de la double liaison.`),
              F('Sur l\'atome de brome', 'Br est encore dans HBr à ce stade (puis il devient l\'ion Br⁻, chargé −).')] },
          { id: 'formule', titre: 'La formule du carbocation', q: 'Quelle est la formule du carbocation formé ?',
            aide: 'Ajoutez H sur le carbone indiqué, transformez la double liaison en liaison simple et placez la charge + sur l\'autre carbone.',
            o: [V(v.cat, `H est fixé sur ${cH}, la charge + est sur ${v.c}.`),
              F(w.cat, `Ce carbocation se formerait si H se fixait sur ${v.c} (et non sur ${cH}).`),
              F(a.f.replace('=', '–') + '⁺', 'Un carbocation de l\'étape 1 contient un H de plus que l\'alcène de départ : il en a fixé un.')] },
          { id: 'classe', titre: 'La classe', q: 'Ce carbocation est-il primaire, secondaire ou tertiaire ?',
            aide: 'Comptez les atomes de carbone directement liés au carbone chargé +.',
            o: ['primaire', 'secondaire', 'tertiaire'].map(c => c === v.cl ? V(maj1(c), `Le carbone chargé + est lié à ${CL[c]} atome${CL[c] > 1 ? 's' : ''} de carbone : carbocation ${c}.`) : F(maj1(c), `Le carbone chargé + est lié à ${CL[v.cl]} atome${CL[v.cl] > 1 ? 's' : ''} de carbone : le carbocation est ${v.cl}.`)) },
        ],
        retenir: ['À l\'étape 1, H se fixe sur un carbone de la double liaison et la charge + apparaît sur l\'autre carbone : on obtient deux carbocations possibles selon le carbone qui reçoit H.'],
      };
    },
  },

  // ── R3 : classer par stabilité ──
  {
    id: 'regio-stabilite', domaine: DOM, niveau: 2, titre: 'Classer des carbocations par stabilité',
    construire: () => {
      const t = tire(TRIPLETS), [p, s, te] = t;
      const ordres = [[p, s, te], [te, s, p], [s, te, p], [p, te, s]];
      const nom = o => o.map(x => x[0]).join(' < ');
      const bon = nom(ordres[0]);
      return {
        enonce: `On compare trois carbocations : ${melange(t).map(x => x[0]).join(' ; ')}.`,
        etapes: [
          { id: 'classes', titre: 'Les classes', q: `Quel carbocation est tertiaire ?`,
            aide: 'Un carbocation tertiaire a son carbone chargé + lié à trois atomes de carbone.',
            o: melange(t).map(x => x[1] === 'tertiaire' ? V(x[0], 'Son carbone chargé + est lié à trois carbones : tertiaire.') : F(x[0], `Son carbone chargé + est lié à ${CL[x[1]]} carbone${CL[x[1]] > 1 ? 's' : ''} : ${x[1]}.`)) },
          { id: 'ordre', titre: 'Le classement', q: 'Quel classement par stabilité croissante est correct ?',
            aide: 'La stabilité augmente avec le nombre de groupes alkyle donneurs sur le carbone chargé +.',
            o: [V(bon, 'Primaire < secondaire < tertiaire : chaque groupe alkyle supplémentaire stabilise la charge +.'),
              F(nom(ordres[1]), 'C\'est l\'ordre inverse : le tertiaire est le plus stable, pas le moins stable.'),
              F(nom(ordres[2]), 'Le primaire est le moins stable : il ne porte qu\'un groupe alkyle donneur.')] },
          { id: 'pourquoi', titre: 'L\'explication', q: 'Pourquoi un carbocation tertiaire est-il plus stable qu\'un carbocation primaire ?',
            aide: 'Pensez au rôle des groupes alkyle liés au carbone qui manque d\'électrons.',
            o: [V('Les groupes alkyle donnent de la densité électronique au carbone chargé + (effet inductif donneur, hyperconjugaison) : la charge est mieux répartie', 'Plus il y a de groupes alkyle autour de C⁺, plus la charge est « diluée » : le carbocation est plus stable.'),
              F('Les groupes alkyle attirent les électrons vers le carbone chargé +', 'Les groupes alkyle sont donneurs d\'électrons, pas attracteurs.'),
              F('Un carbocation tertiaire possède plus d\'électrons de valence autour de C⁺', 'C⁺ a 6 électrons dans tous les cas : c\'est la répartition de la charge qui change.')] },
        ],
        retenir: ['Stabilité des carbocations : tertiaire > secondaire > primaire, car les groupes alkyle donnent de la densité électronique au carbone chargé +.'],
      };
    },
  },

  // ── R4 : produit majoritaire sur un alcène nouveau ──
  {
    id: 'regio-produit', domaine: DOM, niveau: 2, titre: 'Prévoir le produit majoritaire de l\'addition de HBr',
    construire: () => {
      const a = tire(NOUVEAUX);
      return {
        enonce: `On fait réagir ${a.nom} (${a.f}) avec HBr (mécanisme ionique, sans peroxydes). On suppose qu'aucune transposition du carbocation n'a lieu.`,
        etapes: [
          { id: 'carb', titre: 'Le carbocation le plus stable', q: 'Quel carbocation intermédiaire est le plus stable ?',
            aide: 'Écrivez les deux carbocations possibles (H sur l\'un ou l\'autre carbone de la double liaison) et comptez les carbones voisins du carbone chargé +.',
            o: [V(`Le carbocation ${a.cM}`, `Le carbocation ${a.cM} est plus stable que le ${a.cm} : il se forme plus vite.`),
              F(`Le carbocation ${a.cm}`, `Le carbocation ${a.cm} a moins de groupes alkyle donneurs que le ${a.cM}.`),
              F('Les deux ont la même stabilité', `Le carbocation ${a.cM} et le carbocation ${a.cm} diffèrent par leur classe : leurs stabilités ne sont pas égales.`)] },
          { id: 'h', titre: 'Où se fixe H ?', q: `Sur quel carbone de la double liaison l'atome H se fixe-t-il majoritairement ?`,
            aide: 'H se fixe sur le carbone qui n\'est pas celui qui portera la charge + dans le carbocation le plus stable.',
            o: [V(`Sur ${a.hC}`, `H se fixe sur ${a.hC} : la charge + apparaît sur l'autre carbone de la double liaison, qui forme le carbocation ${a.cM}. C'est le carbone qui portait déjà le plus d'atomes H (règle de Markovnikov).`),
              F(`Sur l'autre carbone de la double liaison`, `H se fixerait alors de l'autre côté et conduirait au carbocation ${a.cm}, moins stable.`),
              F('Sur un carbone qui ne fait pas partie de la double liaison', 'L\'addition a lieu sur les deux carbones de la double liaison C=C.')] },
          { id: 'prod', titre: 'Le produit majoritaire', q: 'Quel est le produit majoritaire ?',
            aide: 'Br⁻ se fixe sur le carbone chargé + du carbocation le plus stable.',
            o: [V(maj1(a.pM), `Br se fixe sur le carbone chargé + du carbocation ${a.cM} : ${a.pM}. ${maj1(a.pm)} est le produit minoritaire.`),
              F(maj1(a.pm), `Ce produit vient du carbocation ${a.cm}, moins stable : il est minoritaire.`),
              F('Les deux en quantités égales', 'Les deux carbocations n\'ont pas la même stabilité : la réaction est régiosélective.')] },
        ],
        retenir: ['Règle de Markovnikov : dans l\'addition de HBr, H se fixe sur le carbone de la double liaison qui porte le plus d\'atomes H ; Br se fixe sur le carbone le plus substitué. Elle s\'explique par la stabilité du carbocation intermédiaire.'],
      };
    },
  },

  // ── R5 : deux barrières, loi d'Arrhenius ──
  {
    id: 'regio-barrieres', domaine: DOM, niveau: 2, titre: 'Lire un profil à deux voies : barrières et proportions',
    construire: () => {
      const EA = tire([85, 90, 95, 100]), d = tire([6, 8, 10, 12]), T = tire([273, 298, 323, 350]);
      const EB = EA + d, r = Math.exp(d * 1000 / (8.314 * T)), p = 100 * r / (1 + r);
      return {
        enonce: `Pour un alcène dissymétrique, l'addition de HBr suit deux voies qui passent par deux carbocations différents. L'étape 1 est l'étape lente. Les énergies d'activation sont E_a(A) = ${EA} kJ·mol⁻¹ pour la voie A (produit A) et E_a(B) = ${EB} kJ·mol⁻¹ pour la voie B (produit B). La réaction est sous contrôle cinétique à T = ${T} K. Le rapport des vitesses des deux voies vaut v_A / v_B = exp[(E_a(B) − E_a(A)) / (R·T)], avec R = 8,314 J·mol⁻¹·K⁻¹.`,
        etapes: [
          { id: 'ecart', titre: 'L\'écart des barrières', q: 'Quelle est la différence E_a(B) − E_a(A) ?',
            aide: 'Soustrayez les deux énergies d\'activation (même unité : kJ·mol⁻¹).',
            type: 'saisie', champs: [{ id: 'ecart', lib: 'E_a(B) − E_a(A)', u: 'kJ·mol⁻¹', vrai: d, tol: 0.02 }],
            expl: `${EB} − ${EA} = ${d} kJ·mol⁻¹.` },
          { id: 'rapport', titre: 'Le rapport des vitesses', q: `Calculez v_A / v_B à ${T} K.`,
            aide: 'Convertissez l\'écart en J·mol⁻¹ avant de l\'utiliser avec R = 8,314 J·mol⁻¹·K⁻¹.',
            type: 'saisie', champs: [{ id: 'r', lib: 'v_A / v_B', u: '', vrai: r, tol: 0.03 }],
            expl: `v_A / v_B = exp(${d} × 1000 / (8,314 × ${T})) = exp(${nb(d * 1000 / (8.314 * T), 3)}) = ${nb(r, 1)}.` },
          { id: 'pct', titre: 'La proportion du produit A', q: 'En déduire le pourcentage du produit A dans le mélange (contrôle cinétique).',
            aide: 'Le produit A représente v_A / (v_A + v_B) = r / (1 + r) du mélange.',
            type: 'saisie', champs: [{ id: 'pct', lib: 'Produit A', u: '%', vrai: p, tol: 0.015 }],
            expl: `%A = 100 × r / (1 + r) = 100 × ${nb(r, 1)} / ${nb(1 + r, 1)} = ${nb(p, 1)} %.` },
          { id: 'temp', titre: 'L\'effet de la température', q: 'Si l\'on augmente la température, comment évolue la proportion du produit A ?',
            aide: 'Regardez la dépendance de exp(ΔE / RT) en T : T est au dénominateur de l\'exposant.',
            o: [V('Elle diminue : la réaction devient moins sélective', 'Quand T augmente, ΔE/RT diminue donc le rapport des vitesses se rapproche de 1 : les deux voies deviennent plus comparables.'),
              F('Elle augmente : la réaction devient plus sélective', 'Une température plus élevée rend les deux barrières plus faciles à franchir : la différence entre voies se réduit.'),
              F('Elle ne change pas : seul l\'écart des énergies compte', 'Le rapport dépend de T par exp(ΔE/RT) : la proportion varie avec T.')] },
        ],
        retenir: ['Sous contrôle cinétique, le rapport des vitesses de deux voies concurrentes vaut exp(ΔE_a / RT). Plus l\'écart des barrières est grand et plus la température est basse, plus la sélectivité est marquée.'],
      };
    },
  },

  // ── R6 : régiosélectivité et stéréochimie ──
  {
    id: 'regio-chiral', domaine: DOM, niveau: 2, titre: 'Régiosélectivité et chiralité du produit',
    construire: () => {
      const a = tire(CHIRAL);
      return {
        enonce: `On fait réagir ${a.nom} (${a.f}) avec HBr (mécanisme ionique). Le produit majoritaire est ${a.p}. Le carbocation intermédiaire est plan : Br⁻ peut l'attaquer avec la même probabilité des deux côtés du plan.`,
        etapes: [
          { id: 'asym', titre: 'Le carbone portant Br', q: `Le carbone qui porte Br dans ${a.p} est lié à ${a.subs}. Est-il asymétrique ?`,
            aide: 'Un carbone asymétrique est lié à quatre atomes ou groupes d\'atomes tous différents.',
            o: [a.ch ? V('Oui : quatre groupes différents', `Ses quatre substituants (${a.subs}) sont tous différents : carbone asymétrique, la molécule est chirale.`) : F('Oui : quatre groupes différents', 'Deux de ses substituants sont identiques : ce carbone n\'est pas asymétrique.'),
              !a.ch ? V('Non : deux groupes sont identiques', `Deux substituants sont identiques (${a.subs}) : ce carbone n'est pas asymétrique, la molécule est achirale.`) : F('Non : deux groupes sont identiques', 'Les quatre substituants sont différents : le carbone est asymétrique.'),
              F('On ne peut pas savoir sans connaître le mécanisme', 'La structure du produit suffit pour savoir si un carbone est asymétrique.')] },
          { id: 'forme', titre: 'Ce qu\'on obtient', q: 'Quel est le résultat de l\'attaque de Br⁻ sur les deux faces du carbocation plan ?',
            aide: a.ch ? 'Deux faces équivalentes donnent des quantités égales des deux configurations possibles.' : 'Si le carbone n\'est pas asymétrique, les deux attaques donnent-elles des molécules différentes ?',
            o: [a.ch ? V('Un mélange racémique : 50 % de (R) et 50 % de (S)', 'Les deux faces sont attaquées avec la même probabilité : les deux énantiomères se forment en quantités égales.') : F('Un mélange racémique : 50 % de (R) et 50 % de (S)', 'Le produit est achiral : il n\'a pas d\'énantiomère.'),
              !a.ch ? V('Une seule molécule, achirale', 'Les deux attaques donnent la même molécule : le produit est achiral, sans stéréoisomère.') : F('Une seule molécule, achirale', 'Le produit possède un carbone asymétrique : il est chiral.'),
              F('Un seul énantiomère, obtenu par la face la moins encombrée', 'Le carbocation plan n\'a pas de face privilégiée : on n\'obtient pas un seul énantiomère.')] },
          { id: 'alpha', titre: 'Au polarimètre', q: 'Que mesure-t-on avec un polarimètre sur le produit majoritaire obtenu ?',
            aide: 'Un mélange racémique ou une molécule achirale n\'ont pas de pouvoir rotatoire.',
            o: [V('α = 0 : le produit est optiquement inactif', a.ch ? 'Le mélange racémique contient autant de (R) que de (S) : les rotations se compensent.' : 'Une molécule achirale n\'a pas de pouvoir rotatoire.'),
              F('Une rotation positive', 'Aucun excès énantiomérique : pas de rotation du plan de polarisation.'),
              F('Une rotation négative', 'Aucun excès énantiomérique : pas de rotation du plan de polarisation.')] },
        ],
        retenir: ['La régiosélectivité (quel carbone porte Br) et la stéréochimie sont deux questions distinctes : un carbocation plan donne un mélange racémique si le carbone portant Br est asymétrique dans le produit ; sinon le produit est achiral.'],
      };
    },
  },
];
