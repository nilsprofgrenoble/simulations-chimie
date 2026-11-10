// ═══════════════════════════════════════════════════════════════════════════
//  BANQUE D'EXERCICES « MÉCANISMES RÉACTIONNELS » (Terminale STL — SPCL)
//  Format identique à AtelierSituationsBanque.js (exercices à étapes : QCM et saisies, une aide par étape,
//  nombres tirés au hasard, aucune dépendance à React). Les schémas (types « meca » et « profilReac »)
//  sont dessinés par SchemasMeca.jsx, avec le même moteur que la simulation « Mécanismes réactionnels ».
//
//  Contenus du référentiel TSTL couverts (colonne « capacités exigibles ») :
//   • Nommer le type de réaction (addition, substitution, élimination)            → meca-type-reaction
//   • Illustrer les étapes élémentaires d'un mécanisme fourni (flèches courbes)    → meca-fleche-pi, meca-nucleophile
//   • Établir la géométrie de carbocations et de carbanions (VSEPR)                → meca-geometrie
//   • Déterminer les stéréoisomères formés à partir d'un même carbocation ;
//     repérer énantiomères et diastéréoisomères ; mélange racémique               → meca-racemique, meca-stereo-relations
//   • Loi de Biot, excès énantiomérique                                            → meca-biot
//   • Comparer la stabilité des intermédiaires réactionnels (mécanisme fourni)     → meca-stabilite
//   • Identifier le catalyseur et expliquer son rôle dans un mécanisme             → meca-catalyseur
//   • Identifier les formes mésomères d'ions simples                               → meca-mesomerie
//   • (appui) intermédiaires réactionnels et étapes élémentaires, sur un profil    → meca-profil
// ═══════════════════════════════════════════════════════════════════════════

const tire = t => t[Math.floor(Math.random() * t.length)];
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const nb = (x, d) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const DOM = 'Mécanismes réactionnels';

// ── Types de réaction ──
const DEF = {
  addition: 'une addition : deux molécules se réunissent en une seule, la double liaison C=C disparaît',
  substitution: 'une substitution : un atome ou un groupe d\'atomes est remplacé par un autre, sans changer le squelette carboné',
  elimination: 'une élimination : une petite molécule (eau, HBr…) est retirée et une double liaison C=C apparaît',
};
const NOM = { addition: 'Une addition', substitution: 'Une substitution', elimination: 'Une élimination' };
const REACTIONS = [
  { type: 'addition', eq: 'propène + bromure d\'hydrogène → 2-bromopropane', ex: 'les atomes H et Br se fixent sur les deux carbones de la double liaison C=C du propène, qui disparaît.' },
  { type: 'addition', eq: 'éthène + dibrome → 1,2-dibromoéthane', ex: 'les deux atomes Br se fixent sur les deux carbones de la double liaison C=C de l\'éthène, qui disparaît.' },
  { type: 'substitution', eq: 'bromométhane + ion hydroxyde → méthanol + ion bromure', ex: 'le groupe OH prend la place de l\'atome Br sur le même carbone.' },
  { type: 'substitution', eq: 'chloroéthane + ion iodure → iodoéthane + ion chlorure', ex: 'l\'atome I prend la place de l\'atome Cl sur le même carbone.' },
  { type: 'elimination', eq: '2-bromopropane + ion hydroxyde → propène + eau + ion bromure', ex: 'HBr est retiré de la molécule (H d\'un carbone, Br de l\'autre) et une double liaison C=C apparaît.' },
  { type: 'elimination', eq: 'éthanol → éthène + eau (chauffage en présence d\'acide sulfurique concentré)', ex: 'une molécule d\'eau est retirée de l\'éthanol et une double liaison C=C apparaît.' },
];

// ── Carbocations : alcène de départ, carbocation le plus stable (A) et l'autre (B) ──
const ALCENES = [
  { nom: 'le propène', f: 'CH₃–CH=CH₂', A: 'CH₃–CH⁺–CH₃', clA: 'secondaire', B: 'CH₃–CH₂–CH₂⁺', clB: 'primaire', pA: '2-bromopropane', pB: '1-bromopropane' },
  { nom: 'le but-1-ène', f: 'CH₃–CH₂–CH=CH₂', A: 'CH₃–CH₂–CH⁺–CH₃', clA: 'secondaire', B: 'CH₃–CH₂–CH₂–CH₂⁺', clB: 'primaire', pA: '2-bromobutane', pB: '1-bromobutane' },
  { nom: 'le 2-méthylprop-1-ène', f: '(CH₃)₂C=CH₂', A: '(CH₃)₃C⁺', clA: 'tertiaire', B: '(CH₃)₂CH–CH₂⁺', clB: 'primaire', pA: '2-bromo-2-méthylpropane', pB: '1-bromo-2-méthylpropane' },
  { nom: 'le 2-méthylbut-2-ène', f: '(CH₃)₂C=CH–CH₃', A: '(CH₃)₂C⁺–CH₂–CH₃', clA: 'tertiaire', B: '(CH₃)₂CH–CH⁺–CH₃', clB: 'secondaire', pA: '2-bromo-2-méthylbutane', pB: '2-bromo-3-méthylbutane' },
];
const NB_C = { primaire: 1, secondaire: 2, tertiaire: 3 };

// ── Ions mésomères ──
const IONS = [
  { nom: 'l\'ion éthanoate CH₃–COO⁻', centre: 'carbone', n: 2, formes: 'CH₃–C(=O)–O⁻ ↔ CH₃–C(–O⁻)=O', lien: 'C–O' },
  { nom: 'l\'ion nitrate NO₃⁻', centre: 'azote', n: 3, formes: 'la double liaison N=O peut se placer sur l\'un quelconque des trois atomes d\'oxygène, les deux autres portant une charge −', lien: 'N–O' },
  { nom: 'l\'ion carbonate CO₃²⁻', centre: 'carbone', n: 3, formes: 'la double liaison C=O peut se placer sur l\'un quelconque des trois atomes d\'oxygène, les deux autres portant une charge −', lien: 'C–O' },
];

const DESC = ['2R,3R', '2S,3S', '2R,3S', '2S,3R'];
const inverse = d => d.split(',').map(x => x.replace('R', 'X').replace('S', 'R').replace('X', 'S')).join(',');
const nbInverses = (a, b) => a.split(',').filter((x, i) => x !== b.split(',')[i]).length;
const shuffle = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export const EXERCICES = [

  // ── M1 : nommer le type de réaction ──
  {
    id: 'meca-type-reaction', domaine: DOM, niveau: 1, titre: 'Addition, substitution ou élimination ?',
    construire: () => {
      const r = tire(REACTIONS);
      const autres = Object.keys(DEF).filter(t => t !== r.type);
      return {
        enonce: `Un chimiste écrit l'équation suivante : ${r.eq}. Il veut d'abord savoir à quel type de réaction elle appartient, avant d'écrire son mécanisme.`,
        etapes: [
          { id: 'type', titre: 'Le type de réaction', q: 'À quel type de réaction appartient cette transformation ?',
            aide: 'Comparez les réactifs et les produits : qu\'est-ce qui s\'ajoute, qu\'est-ce qui est remplacé, qu\'est-ce qui part ?',
            o: [V(NOM[r.type], `Oui : ${r.ex.charAt(0).toUpperCase() + r.ex.slice(1)}`),
              ...autres.map(t => F(NOM[t], `Non : ce serait ${DEF[t]}. Ici, ${r.ex}`))] },
          { id: 'cc', titre: 'La double liaison C=C', q: 'Que devient la double liaison C=C dans cette transformation ?',
            aide: 'Cherchez une double liaison carbone-carbone parmi les réactifs, puis parmi les produits.',
            o: [
              r.type === 'addition' ? V('Elle disparaît : elle est « ouverte » par l\'addition', 'Dans une addition sur un alcène, la liaison π de la double liaison est utilisée pour former deux nouvelles liaisons.') : F('Elle disparaît', r.type === 'elimination' ? 'C\'est l\'inverse : dans une élimination, une double liaison apparaît.' : 'Il n\'y a aucune double liaison C=C parmi les réactifs.'),
              r.type === 'elimination' ? V('Elle apparaît : elle se forme quand la petite molécule est retirée', 'Dans une élimination, le retrait de H et d\'un autre atome ou groupe sur deux carbones voisins crée une double liaison C=C.') : F('Elle apparaît', r.type === 'addition' ? 'C\'est l\'inverse : dans une addition, la double liaison disparaît.' : 'Aucune double liaison C=C ne se forme dans cette substitution.'),
              r.type === 'substitution' ? V('Aucune double liaison C=C n\'est formée ni rompue', 'Dans cette substitution, le squelette carboné reste identique : seul un atome ou un groupe est remplacé.') : F('Aucune double liaison C=C n\'est formée ni rompue', r.type === 'addition' ? 'Si : dans cette addition, la double liaison C=C du réactif disparaît.' : 'Si : dans cette élimination, une double liaison C=C apparaît.'),
            ] },
        ],
        retenir: ['Addition : deux molécules se réunissent et la double liaison C=C disparaît. Élimination : une petite molécule est retirée et une double liaison C=C apparaît. Substitution : un atome ou un groupe en remplace un autre.'],
      };
    },
  },

  // ── M2 : lire la première flèche courbe (π → H) ──
  {
    id: 'meca-fleche-pi', domaine: DOM, niveau: 1, titre: 'Lire les flèches de la première étape',
    construire: () => ({
      enonce: 'Voici le début du mécanisme de l\'addition du bromure d\'hydrogène HBr sur le but-2-ène. Les deux flèches rouges sont des flèches courbes. Dans HBr, l\'atome de brome est δ− et l\'atome d\'hydrogène est δ+.',
      schema: { type: 'meca', u: 0, fleches: true, legende: 'but-2-ène (en haut) et HBr (en bas) : début du mécanisme' },
      etapes: [
        { id: 'depart', titre: 'Le départ de la grande flèche', q: 'La grande flèche part de la double liaison. Que représente son point de départ ?',
          aide: 'Une flèche courbe ne part jamais d\'un atome : elle part d\'un doublet d\'électrons.',
          o: [V('Le doublet d\'électrons de la liaison π', 'Une flèche courbe décrit le déplacement d\'un doublet : ici, celui de la liaison π de la double liaison, facile à déplacer.'),
            F('Le noyau d\'un atome de carbone', 'Une flèche courbe ne suit pas un atome, mais des électrons.'),
            F('L\'atome d\'hydrogène lié au carbone', 'Cet atome ne bouge pas à cette étape : seul un doublet d\'électrons se déplace.')] },
        { id: 'arrivee', titre: 'L\'arrivée de la flèche', q: 'Vers quel atome pointe la grande flèche ?',
          aide: 'Un doublet riche en électrons va vers un site pauvre en électrons (δ+).',
          o: [V('Vers l\'atome d\'hydrogène de HBr, pauvre en électrons (δ+)', 'Le doublet π, riche en électrons, est attiré par H (δ+) : il formera une liaison C–H.'),
            F('Vers l\'atome de brome, riche en électrons (δ−)', 'Un doublet ne va pas vers un site déjà riche en électrons (δ−) : il est repoussé.'),
            F('Vers l\'autre carbone de la double liaison', 'La flèche indique où va le doublet : il va vers H, pas vers l\'autre carbone.')] },
        { id: 'raison', titre: 'Pourquoi ce sens ?', q: 'Quelle règle explique le sens de cette flèche ?',
          aide: 'Pensez aux charges : les électrons sont chargés négativement.',
          o: [V('Un doublet riche en électrons se déplace vers un site pauvre en électrons', 'C\'est la règle d\'orientation des flèches courbes : du site riche (nucléophile) vers le site pauvre (électrophile).'),
            F('Un doublet va toujours vers l\'atome le plus lourd', 'La masse de l\'atome n\'intervient pas : ce qui compte, c\'est la répartition des charges.'),
            F('Un doublet va toujours vers l\'atome le plus riche en électrons', 'C\'est le contraire : les électrons vont vers un site pauvre en électrons.')] },
        { id: 'deuxieme', titre: 'La deuxième flèche', q: 'La petite flèche part de la liaison H–Br et pointe vers l\'atome Br. Que devient cette liaison ?',
          aide: 'Si le doublet de H–Br va entièrement sur Br, la liaison peut-elle subsister ?',
          o: [V('Elle se rompt : son doublet reste sur Br, qui devient l\'ion Br⁻', 'Le doublet de la liaison passe entièrement sur Br : H n\'est plus lié à Br, et Br porte la charge −.'),
            F('Elle devient plus forte : Br attire le doublet', 'La flèche indique que le doublet quitte la liaison pour devenir un doublet non liant de Br.'),
            F('Elle se rompt : son doublet part sur H', 'La flèche pointe vers Br, pas vers H : c\'est Br qui garde le doublet.')] },
      ],
      retenir: ['Une flèche courbe suit un doublet d\'électrons : elle part d\'un doublet (liaison ou doublet non liant) et pointe vers le site pauvre en électrons qui le reçoit.'],
    }),
  },

  // ── M3 : nucléophile et électrophile (étape 2) ──
  {
    id: 'meca-nucleophile', domaine: DOM, niveau: 1, titre: 'Qui attaque qui ?',
    construire: () => ({
      enonce: 'Deuxième étape du mécanisme de l\'addition de HBr sur le but-2-ène : l\'ion bromure Br⁻ rencontre un carbocation. Le petit carré bleu symbolise la case vide du carbocation (lacune électronique). La flèche rouge part de Br⁻.',
      schema: { type: 'meca', u: 0.62, fleches: true, legende: 'étape 2 : Br⁻ s\'approche du carbocation (petit carré bleu : lacune)' },
      etapes: [
        { id: 'electrons', titre: 'Le carbone chargé +', q: 'Le carbone du carbocation est lié à trois autres atomes et n\'a aucun doublet non liant. Combien d\'électrons l\'entourent ?',
          aide: 'Chaque liaison simple est un doublet (2 électrons). Comptez les liaisons.',
          o: [V('6 électrons (3 doublets liants) : il lui manque 2 électrons pour l\'octet', 'Trois liaisons simples = 6 électrons. Le carbone n\'a pas son octet : c\'est la lacune électronique.'),
            F('8 électrons : son octet est complet', 'L\'octet est complet dans le produit final, pas dans le carbocation.'),
            F('4 électrons : seulement deux liaisons', 'Il y a bien trois liaisons autour du carbone chargé, donc 6 électrons.')] },
        { id: 'donneur', titre: 'Qui possède le doublet ?', q: 'Quelle espèce fournit le doublet d\'électrons qui va se déplacer dans cette étape ?',
          aide: 'La flèche part de l\'espèce qui possède le doublet.',
          o: [V('L\'ion Br⁻, avec l\'un de ses doublets non liants', 'La flèche part d\'un doublet non liant de Br⁻ : Br⁻ donne le doublet.'),
            F('Le carbocation, qui « attaque » Br⁻', 'Le carbocation n\'a aucun doublet à donner : au contraire, il lui manque deux électrons. C\'est lui qui reçoit.'),
            F('L\'atome d\'hydrogène voisin', 'Aucun atome d\'hydrogène n\'intervient dans cette étape.')] },
        { id: 'roles', titre: 'Nucléophile et électrophile', q: 'Comment qualifie-t-on Br⁻ et le carbocation dans cette étape ?',
          aide: 'Nucléophile : qui possède un doublet à donner. Électrophile : qui a une lacune ou un site pauvre en électrons.',
          o: [V('Br⁻ est nucléophile et le carbocation est électrophile', 'Br⁻ donne un doublet (nucléophile) ; le carbocation, avec sa lacune, le reçoit (électrophile).'),
            F('Br⁻ est électrophile et le carbocation est nucléophile', 'C\'est l\'inverse : un nucléophile donne un doublet, un électrophile en reçoit un.'),
            F('Les deux sont nucléophiles, car ils sont chargés', 'La charge ne suffit pas : un carbocation, chargé +, est pauvre en électrons, donc électrophile.')] },
        { id: 'liaison', titre: 'La liaison formée', q: 'Quelle liaison se forme à la fin de cette étape ?',
          aide: 'Le doublet de Br⁻ devient un doublet liant entre deux atomes.',
          o: [V('Une liaison C–Br, formée avec le doublet de Br⁻', 'Le doublet non liant de Br⁻ devient le doublet liant de la liaison C–Br : le carbone retrouve son octet.'),
            F('Une liaison H–Br', 'La liaison H–Br a été rompue à l\'étape 1 : elle ne se reforme pas ici.'),
            F('Une double liaison C=Br', 'Un seul doublet est donné : la liaison formée est simple.')] },
      ],
      retenir: ['Le nucléophile (riche en électrons, doublet à donner) attaque l\'électrophile (lacune ou site δ+). La flèche part du doublet du nucléophile : ce n\'est jamais le carbocation qui « attaque ».'],
    }),
  },

  // ── M4 : géométrie VSEPR d'un carbocation ou d'un carbanion ──
  {
    id: 'meca-geometrie', domaine: DOM, niveau: 2, titre: 'La forme d\'un carbocation et d\'un carbanion',
    construire: () => {
      const cat = Math.random() < 0.5;
      const esp = cat ? 'le carbocation (CH₃)₃C⁺ (cation tert-butyle)' : 'le carbanion CH₃⁻ (anion méthanide)';
      const nbDom = cat ? 3 : 4;
      return {
        enonce: `On étudie ${esp}. L'atome de carbone central est lié à trois atomes${cat ? ' de carbone' : ' d\'hydrogène'} par des liaisons simples. ${cat ? 'Il ne porte aucun doublet non liant (il lui manque 2 électrons).' : 'Il porte en plus un doublet non liant (la charge − est portée par le carbone).'} On cherche la géométrie autour de ce carbone avec la théorie VSEPR.`,
        etapes: [
          { id: 'domaines', titre: 'Les domaines électroniques', q: 'Combien de domaines électroniques (liaisons et doublets non liants) entourent le carbone central ?',
            aide: 'Comptez une liaison simple pour un domaine, et un doublet non liant pour un domaine.',
            o: [V(`${nbDom} domaines`, cat ? 'Trois liaisons simples, aucun doublet non liant : 3 domaines (type AX₃).' : 'Trois liaisons simples et un doublet non liant : 4 domaines (type AX₃E).'),
              F(cat ? '4 domaines' : '3 domaines', cat ? 'Il n\'y a pas de doublet non liant sur le carbone d\'un carbocation : seulement 3 domaines.' : 'Il faut compter aussi le doublet non liant : 4 domaines.'),
              F('2 domaines', 'Il y a au moins trois liaisons autour du carbone central.')] },
          { id: 'geo', titre: 'La géométrie', q: 'Quelle est la géométrie autour du carbone central ?',
            aide: 'Les domaines se placent le plus loin possible les uns des autres : 3 domaines dans un plan, 4 domaines vers les sommets d\'un tétraèdre.',
            o: [V(cat ? 'Plane triangulaire, avec des angles voisins de 120°' : 'Pyramidale à base triangulaire (le doublet non liant occupe le 4ᵉ sommet du tétraèdre)', cat ? 'Trois domaines se répartissent dans un plan à 120° les uns des autres.' : 'Quatre domaines pointent vers les sommets d\'un tétraèdre : les trois liaisons et le doublet non liant donnent une pyramide.'),
              F(cat ? 'Pyramidale à base triangulaire' : 'Plane triangulaire', cat ? 'Cette forme correspond à 4 domaines dont un doublet non liant : il n\'y en a pas ici.' : 'Le plan triangulaire correspond à 3 domaines seulement : le doublet non liant compte aussi.'),
              F('Linéaire', 'Une forme linéaire correspond à 2 domaines seulement.')] },
          cat
            ? { id: 'cons', titre: 'La conséquence sur la réaction', q: 'Un nucléophile arrive sur ce carbocation. Que permet la géométrie plane ?',
                aide: 'Regardez de chaque côté du plan : y a-t-il un obstacle d\'un côté plutôt que de l\'autre ?',
                o: [V('Il peut arriver par l\'une ou l\'autre des deux faces du plan, avec la même probabilité', 'Dans un carbocation plan, les deux faces sont équivalentes : c\'est l\'origine du mélange racémique quand le produit est chiral.'),
                  F('Il ne peut arriver que par une seule face', 'Les deux faces du plan sont accessibles de la même façon.'),
                  F('Il doit d\'abord rendre le carbocation pyramidal', 'La géométrie du carbone change au cours de la réaction, mais ce n\'est pas ce qui permet l\'attaque.')] }
            : { id: 'cons', titre: 'Le comportement du carbanion', q: 'Que permet le doublet non liant du carbanion ?',
                aide: 'Un doublet non liant est un doublet d\'électrons disponible.',
                o: [V('Il peut être donné à un site électrophile : le carbanion est nucléophile', 'Le doublet non liant peut former une nouvelle liaison avec un électrophile : c\'est un nucléophile.'),
                  F('Il rend le carbanion électrophile', 'Un électrophile a une lacune ou un site pauvre en électrons : ce n\'est pas le cas d\'un carbanion.'),
                  F('Il empêche toute réaction', 'Au contraire : il rend le carbanion très réactif.')] },
        ],
        retenir: ['Carbocation : 3 domaines, plan triangulaire (≈ 120°), attaque possible par les deux faces. Carbanion : 4 domaines dont un doublet non liant, pyramidal ; son doublet en fait un nucléophile.'],
      };
    },
  },

  // ── M5 : racémique du 2-bromobutane ──
  {
    id: 'meca-racemique', domaine: DOM, niveau: 2, titre: 'Pourquoi le 2-bromobutane est un mélange racémique',
    construire: () => ({
      enonce: 'L\'addition de HBr sur le but-2-ène conduit au 2-bromobutane CH₃–CHBr–CH₂–CH₃ en passant par un carbocation plan. Le dessin montre les deux produits possibles : Br arrive soit devant le plan du carbocation (coin plein), soit derrière (traits). Les carbones sont numérotés de 1 à 4.',
      schema: [{ type: 'meca', u: 1, face: 1, fleches: false, numC: true, legende: 'Br arrive par l\'avant' }, { type: 'meca', u: 1, face: -1, fleches: false, numC: true, legende: 'Br arrive par l\'arrière' }],
      etapes: [
        { id: 'asym', titre: 'Le carbone asymétrique', q: 'Quel carbone du 2-bromobutane est asymétrique ?',
          aide: 'Un carbone asymétrique porte quatre groupes tous différents.',
          o: [V('Le carbone 2 : il porte H, Br, CH₃ et CH₂CH₃', 'Quatre groupes différents : c\'est le centre stéréogène de la molécule.'),
            F('Le carbone 1', 'Le carbone 1 est un groupe CH₃ : trois groupes identiques (H).'),
            F('Le carbone 3', 'Le carbone 3 porte deux atomes H identiques : il n\'est pas asymétrique.')] },
        { id: 'nombre', titre: 'Les stéréoisomères', q: 'Combien de stéréoisomères de configuration le 2-bromobutane possède-t-il ?',
          aide: 'Un seul carbone asymétrique : deux dispositions possibles des groupes.',
          o: [V('Deux : les énantiomères (R) et (S)', 'Un seul centre stéréogène donne deux stéréoisomères, images l\'un de l\'autre dans un miroir.'),
            F('Un seul', 'Les deux dessins ne sont pas superposables : ce sont deux molécules différentes.'),
            F('Quatre', 'Il en faudrait deux centres stéréogènes pour obtenir quatre stéréoisomères.')] },
        { id: 'face', titre: 'La face d\'attaque', q: 'Br⁻ attaque le carbocation plan aussi souvent par l\'avant que par l\'arrière. Quelle est la composition du produit ?',
          aide: 'Les deux faces du carbocation sont équivalentes : elles sont attaquées avec la même probabilité.',
          o: [V('50 % de (R) et 50 % de (S) : un mélange racémique', 'Chaque face est attaquée une fois sur deux : proportions égales des deux énantiomères.'),
            F('Uniquement l\'énantiomère (R)', 'Aucune face n\'est favorisée : les deux énantiomères se forment.'),
            F('75 % de (R) et 25 % de (S)', 'Rien ne favorise une face : les proportions sont égales (50 % / 50 %).')] },
        { id: 'optique', titre: 'L\'activité optique du mélange', q: 'Ce mélange dévie-t-il le plan de polarisation d\'une lumière polarisée ?',
          aide: 'Les deux énantiomères dévient le plan du même angle, mais dans des sens opposés.',
          o: [V('Non : les deux déviations opposées se compensent, le mélange est optiquement inactif', 'Même quantité de chaque énantiomère : les pouvoirs rotatoires opposés s\'annulent.'),
            F('Oui, toujours dans le sens de l\'énantiomère (R)', 'Il y a autant de (S) que de (R) : aucun sens n\'est privilégié.'),
            F('Oui, deux fois plus que l\'énantiomère pur', 'Le mélange est moins actif qu\'un énantiomère pur : ici, il est même inactif.')] },
      ],
      retenir: ['Un carbocation plan est attaqué avec la même probabilité par ses deux faces : si le produit possède un seul carbone asymétrique, on obtient un mélange racémique (50 % / 50 % des deux énantiomères), optiquement inactif.'],
    }),
  },

  // ── M6 : relations entre stéréoisomères (deux carbones asymétriques) ──
  {
    id: 'meca-stereo-relations', domaine: DOM, niveau: 2, titre: 'Énantiomères ou diastéréoisomères ?',
    construire: () => {
      const ref = tire(DESC), b = tire(DESC.filter(d => d !== ref));
      const nbInv = nbInverses(ref, b);
      const enant = inverse(ref);
      const diast = DESC.filter(d => d !== ref && d !== enant);
      return {
        enonce: `Le 3-bromobutan-2-ol, CH₃–CH(OH)–CHBr–CH₃, possède deux carbones asymétriques non équivalents, C2 et C3. Ses stéréoisomères de configuration sont notés (2R,3R), (2S,3S), (2R,3S) et (2S,3R). On s'intéresse aux stéréoisomères (${ref}) et (${b}).`,
        etapes: [
          { id: 'nombre', titre: 'Le nombre de stéréoisomères', q: 'Combien de stéréoisomères de configuration ce composé possède-t-il ?',
            aide: 'Deux carbones asymétriques, chacun avec deux configurations possibles (R ou S).',
            o: [V('Quatre', 'Deux centres stéréogènes indépendants : 2 × 2 = 4 combinaisons, toutes distinctes car la molécule n\'est pas symétrique.'),
              F('Deux', 'Il y a deux centres stéréogènes : deux stéréoisomères ne suffisent pas.'),
              F('Trois', 'Les quatre combinaisons (R,R), (S,S), (R,S) et (S,R) sont toutes différentes.')] },
          { id: 'relation', titre: 'La relation entre deux stéréoisomères', q: `Quelle est la relation entre les stéréoisomères (${ref}) et (${b}) ?`,
            aide: 'Énantiomères : tous les descripteurs sont inversés. Diastéréoisomères : certains seulement sont inversés.',
            o: [nbInv === 2 ? V('Ce sont des énantiomères', `Tous les descripteurs sont inversés (${ref} → ${b}) : les deux molécules sont images l'une de l'autre dans un miroir.`) : F('Ce sont des énantiomères', `Un seul descripteur est inversé (${ref} → ${b}) : l'image dans un miroir de (${ref}) est (${enant}), pas (${b}).`),
              nbInv === 1 ? V('Ce sont des diastéréoisomères', `Un seul descripteur est inversé (${ref} → ${b}) : ce sont des stéréoisomères qui ne sont pas images l'un de l'autre dans un miroir.`) : F('Ce sont des diastéréoisomères', `Ici tous les descripteurs sont inversés : ce sont des énantiomères.`),
              F('Ce sont deux représentations de la même molécule', 'Les configurations diffèrent en au moins un carbone asymétrique : ce sont deux molécules distinctes.')] },
          { id: 'enant', titre: 'L\'énantiomère', q: `Quel est l'énantiomère du stéréoisomère (${ref}) ?`,
            aide: 'L\'énantiomère est l\'image dans un miroir : tous les descripteurs changent de R à S, ou de S à R.',
            o: [V(`(${enant})`, `On inverse les deux descripteurs : (${ref}) → (${enant}).`),
              ...diast.map(d => F(`(${d})`, `Un seul descripteur est inversé par rapport à (${ref}) : c'est un diastéréoisomère, pas l'énantiomère.`))] },
        ],
        retenir: ['Deux stéréoisomères images l\'un de l\'autre dans un miroir sont des énantiomères (tous les descripteurs R/S sont inversés). Les stéréoisomères non images l\'un de l\'autre sont des diastéréoisomères (certains descripteurs seulement sont inversés).'],
      };
    },
  },

  // ── M7 : loi de Biot et excès énantiomérique ──
  {
    id: 'meca-biot', domaine: DOM, niveau: 2, titre: 'Mesurer un excès énantiomérique au polarimètre',
    construire: () => {
      const spec = tire([25, 40, 50, 60]);          // pouvoir rotatoire spécifique de l'énantiomère (+) pur, °·mL·g⁻¹·dm⁻¹
      const l = tire([1, 2]);                       // longueur de la cuve, dm
      const c = tire([0.10, 0.20, 0.25]);           // concentration, g/mL
      const ee = tire([20, 30, 40, 60, 80]);        // excès énantiomérique, %
      const s = tire([1, -1]);
      const aPur = spec * l * c;
      const aObs = s * ee / 100 * aPur;
      const maj = (100 + ee) / 2;
      const signe = s > 0 ? '(+)' : '(−)';
      return {
        enonce: `Un laboratoire prépare un composé chiral dont l'énantiomère (+) pur a un pouvoir rotatoire spécifique [α] = +${nb(spec, 0)} °·mL·g⁻¹·dm⁻¹ (à 20 °C, raie D du sodium). Un échantillon d'un mélange des deux énantiomères, de concentration totale c = ${nb(c, 2)} g·mL⁻¹, est placé dans une cuve de longueur ℓ = ${nb(l, 0)} dm. Le polarimètre indique α = ${s > 0 ? '+' : '−'}${nb(Math.abs(aObs), 2)} °. La loi de Biot s'écrit α = [α] × ℓ × c.`,
        etapes: [
          { id: 'apur', titre: 'L\'énantiomère pur', q: `Quelle serait la valeur de α pour l'énantiomère (+) pur, à la même concentration c = ${nb(c, 2)} g·mL⁻¹, dans la même cuve ?`,
            aide: 'Appliquez la loi de Biot : α = [α] × ℓ × c, avec ℓ en dm et c en g·mL⁻¹.',
            type: 'saisie', champs: [{ id: 'apur', lib: 'α (énantiomère pur)', u: '°', vrai: aPur, tol: 0.02 }],
            expl: `α = [α] × ℓ × c = ${nb(spec, 0)} × ${nb(l, 0)} × ${nb(c, 2)} = ${nb(aPur, 2)} °.` },
          { id: 'ee', titre: 'L\'excès énantiomérique', q: 'Calculez l\'excès énantiomérique du mélange, en pourcentage.',
            aide: 'L\'excès énantiomérique est le rapport entre l\'angle mesuré (en valeur absolue) et l\'angle de l\'énantiomère pur, à la même concentration.',
            type: 'saisie', champs: [{ id: 'ee', lib: 'e.e.', u: '%', vrai: ee, tol: 0.02 }],
            expl: `e.e. = |α_mesuré| / α_pur = ${nb(Math.abs(aObs), 2)} / ${nb(aPur, 2)} = ${nb(ee / 100, 2)}, soit ${nb(ee, 0)} %.` },
          { id: 'majo', titre: 'L\'énantiomère majoritaire', q: 'Quel énantiomère est en excès dans ce mélange ?',
            aide: 'Comparez le signe de l\'angle mesuré à celui du pouvoir rotatoire spécifique de l\'énantiomère (+).',
            o: [V(`L'énantiomère ${signe}`, s > 0 ? 'L\'angle mesuré est positif, comme [α] de l\'énantiomère (+) : celui-ci est en excès.' : 'L\'angle mesuré est négatif : c\'est l\'énantiomère (−), de pouvoir rotatoire opposé, qui est en excès.'),
              F(`L'énantiomère ${s > 0 ? '(−)' : '(+)'}`, s > 0 ? 'Un excès de (−) donnerait un angle négatif.' : 'Un excès de (+) donnerait un angle positif.'),
              F('Aucun : le mélange est racémique', 'Un mélange racémique serait optiquement inactif (α = 0), ce qui n\'est pas le cas ici.')] },
          { id: 'compo', titre: 'La composition du mélange', q: `Quel est le pourcentage de l'énantiomère en excès dans le mélange (sur 100 % d'énantiomères) ?`,
            aide: 'Si l\'énantiomère majoritaire représente x % et l\'autre (100 − x) %, l\'excès énantiomérique vaut x − (100 − x).',
            type: 'saisie', champs: [{ id: 'maj', lib: 'Énantiomère majoritaire', u: '%', vrai: maj, tol: 0.02 }],
            expl: `e.e. = x − (100 − x) = 2x − 100 = ${nb(ee, 0)}, donc x = (100 + ${nb(ee, 0)}) / 2 = ${nb(maj, 0)} %.` },
        ],
        retenir: ['Loi de Biot : α = [α] × ℓ × c. Excès énantiomérique : e.e. = |α mesuré| / α de l\'énantiomère pur = %(majoritaire) − %(minoritaire). Un mélange racémique a un excès nul.'],
      };
    },
  },

  // ── M8 : stabilité des carbocations et produit majoritaire ──
  {
    id: 'meca-stabilite', domaine: DOM, niveau: 2, titre: 'Quel carbocation, quel produit majoritaire ?',
    construire: () => {
      const a = tire(ALCENES);
      return {
        enonce: `On fait réagir ${a.nom} (${a.f}) avec HBr. Le mécanisme est fourni : à l'étape 1, l'atome H se fixe sur l'un des deux carbones de la double liaison, ce qui donne un carbocation ; à l'étape 2, Br⁻ se fixe sur le carbone chargé +. Deux carbocations sont possibles : ${a.A} ou ${a.B}. Les groupes alkyles donnent des électrons au carbone chargé + et stabilisent le carbocation : plus le carbone chargé porte de groupes alkyles, plus le carbocation est stable.`,
        etapes: [
          { id: 'classe', titre: 'La classe du carbocation', q: `Le carbocation ${a.A} est-il primaire, secondaire ou tertiaire ?`,
            aide: 'Comptez les atomes de carbone directement liés au carbone chargé +.',
            o: ['primaire', 'secondaire', 'tertiaire'].map(c => c === a.clA
              ? V(`${c.charAt(0).toUpperCase() + c.slice(1)}`, `Le carbone chargé + est lié à ${NB_C[c]} atome${NB_C[c] > 1 ? 's' : ''} de carbone : le carbocation est ${c}.`)
              : F(`${c.charAt(0).toUpperCase() + c.slice(1)}`, `Le carbone chargé + est lié à ${NB_C[a.clA]} atome${NB_C[a.clA] > 1 ? 's' : ''} de carbone (pas ${NB_C[c]}) : le carbocation est ${a.clA}.`)) },
          { id: 'stable', titre: 'Le plus stable', q: `Entre ${a.A} (${a.clA}) et ${a.B} (${a.clB}), quel carbocation est le plus stable ?`,
            aide: 'Plus le carbone chargé + porte de groupes alkyles donneurs, plus le carbocation est stable.',
            o: [V(`${a.A}, ${a.clA}`, `Il porte plus de groupes alkyles donneurs que le carbocation ${a.clB} : il est plus stable.`),
              F(`${a.B}, ${a.clB}`, `Il porte moins de groupes alkyles donneurs : il est moins stable que le carbocation ${a.clA}.`),
              F('Ils ont la même stabilité', 'Le nombre de groupes alkyles liés au carbone chargé + est différent : la stabilité aussi.')] },
          { id: 'produit', titre: 'Le produit majoritaire', q: 'Quel produit est obtenu majoritairement ?',
            aide: 'Le carbocation le plus stable se forme plus facilement et plus vite : le produit qui en découle est le plus abondant.',
            o: [V(`Le ${a.pA}`, `Il se forme à partir du carbocation le plus stable (${a.clA}) : c'est le produit majoritaire. Le ${a.pB} est minoritaire.`),
              F(`Le ${a.pB}`, `Il provient du carbocation ${a.clB}, moins stable : il est minoritaire.`),
              F('Les deux produits en proportions égales', 'Les deux carbocations n\'ont pas la même stabilité : les deux produits ne se forment pas en proportions égales.')] },
        ],
        retenir: ['Dans l\'addition de HBr sur un alcène, le carbocation intermédiaire le plus stable (tertiaire > secondaire > primaire) se forme préférentiellement : il conduit au produit majoritaire.'],
      };
    },
  },

  // ── M9 : le catalyseur dans un mécanisme ──
  {
    id: 'meca-catalyseur', domaine: DOM, niveau: 2, titre: 'Repérer le catalyseur dans un mécanisme',
    construire: () => ({
      enonce: 'L\'hydratation de l\'éthène en éthanol est catalysée par un acide. Son mécanisme comporte trois étapes élémentaires : (1) CH₂=CH₂ + H⁺ → CH₃–CH₂⁺ ; (2) CH₃–CH₂⁺ + H₂O → CH₃–CH₂–OH₂⁺ ; (3) CH₃–CH₂–OH₂⁺ → CH₃–CH₂–OH + H⁺.',
      etapes: [
        { id: 'cata', titre: 'Le catalyseur', q: 'Quelle espèce est le catalyseur de cette réaction ?',
          aide: 'Un catalyseur est présent au départ, intervient dans le mécanisme, puis est retrouvé intact à la fin.',
          o: [V('H⁺ : consommé à l\'étape 1, il est régénéré à l\'étape 3', 'H⁺ est présent au départ, consommé puis régénéré : il est retrouvé à la fin. C\'est la signature d\'un catalyseur.'),
            F('CH₃–CH₂⁺', 'Cette espèce apparaît à l\'étape 1 et disparaît à l\'étape 2 : c\'est un intermédiaire réactionnel, ni présent au départ ni à la fin.'),
            F('H₂O', 'L\'eau est un réactif : elle est consommée et n\'est pas régénérée.')] },
        { id: 'bilan', titre: 'L\'équation globale', q: 'Quelle est l\'équation de la réaction globale (en additionnant les trois étapes) ?',
          aide: 'Additionnez les trois étapes et simplifiez les espèces qui apparaissent des deux côtés.',
          o: [V('CH₂=CH₂ + H₂O → CH₃–CH₂–OH', 'H⁺, CH₃–CH₂⁺ et CH₃–CH₂–OH₂⁺ se simplifient : il reste l\'éthène et l\'eau d\'un côté, l\'éthanol de l\'autre.'),
            F('CH₂=CH₂ + H₂O + H⁺ → CH₃–CH₂–OH', 'H⁺ est régénéré : il n\'apparaît ni parmi les réactifs ni parmi les produits de l\'équation globale (et la charge ne serait pas conservée).'),
            F('CH₂=CH₂ + H⁺ → CH₃–CH₂⁺', 'Ce n\'est que l\'étape 1, pas la réaction globale.')] },
        { id: 'inter', titre: 'Les intermédiaires', q: 'Combien d\'intermédiaires réactionnels apparaissent dans ce mécanisme ?',
          aide: 'Un intermédiaire est formé dans une étape puis consommé dans la suivante ; il n\'est ni réactif de départ ni produit final.',
          o: [V('Deux : CH₃–CH₂⁺ et CH₃–CH₂–OH₂⁺', 'Ces deux espèces apparaissent puis disparaissent. H⁺ est le catalyseur, pas un intermédiaire.'),
            F('Un seul', 'Il y en a deux : le carbocation et l\'ion oxonium CH₃–CH₂–OH₂⁺.'),
            F('Trois, en comptant H⁺', 'H⁺ est présent au départ et retrouvé à la fin : c\'est le catalyseur, pas un intermédiaire.')] },
        { id: 'role', titre: 'Le rôle du catalyseur', q: 'Quel est le rôle du catalyseur dans cette réaction ?',
          aide: 'Un catalyseur change la vitesse, pas le bilan.',
          o: [V('Il ouvre un chemin réactionnel plus rapide (énergie d\'activation plus faible) sans modifier le bilan de la réaction', 'Le catalyseur accélère la réaction en offrant un mécanisme de plus basse énergie d\'activation, et il est régénéré.'),
            F('Il déplace l\'équilibre vers la formation d\'éthanol', 'Un catalyseur ne change pas l\'état d\'équilibre : il accélère les deux sens.'),
            F('Il est consommé définitivement pour fournir de l\'énergie', 'Un catalyseur est régénéré à la fin du mécanisme : il n\'est pas consommé.')] },
      ],
      retenir: ['Un catalyseur est présent au départ, consommé puis régénéré dans le mécanisme : il n\'apparaît pas dans l\'équation globale. Il accélère la réaction en abaissant l\'énergie d\'activation, sans changer le bilan. Un intermédiaire n\'est ni au départ ni à la fin.'],
    }),
  },

  // ── M10 : mésomérie ──
  {
    id: 'meca-mesomerie', domaine: DOM, niveau: 2, titre: 'Les formes mésomères d\'un ion',
    construire: () => {
      const i = tire(IONS);
      const autre = i.n === 2 ? 3 : 2;
      return {
        enonce: `On étudie ${i.nom}. Son schéma de Lewis ne peut pas être écrit d'une seule façon : ${i.formes}. Ces écritures sont des formes mésomères (ou formes limites) d'une même espèce.`,
        etapes: [
          { id: 'nombre', titre: 'Le nombre de formes', q: `Combien de formes mésomères équivalentes peut-on écrire pour ${i.nom} ?`,
            aide: 'Combien de positions différentes la double liaison peut-elle occuper ?',
            o: [V(`${i.n} formes`, `La double liaison peut se placer sur ${i.n === 2 ? 'l\'un ou l\'autre' : 'l\'un quelconque'} des ${i.n} atomes d'oxygène : ${i.n} écritures équivalentes.`),
              F(`${autre} formes`, `Il y a autant de formes que de positions possibles pour la double liaison, soit ${i.n}.`),
              F('Une seule forme', 'Plusieurs écritures de Lewis équivalentes sont possibles : ce sont les formes mésomères.')] },
          { id: 'longueur', titre: 'Les longueurs de liaison', q: `Que dire des longueurs des liaisons ${i.lien} de cet ion ?`,
            aide: 'L\'ion réel n\'est aucune des formes limites : c\'est un « hybride » de toutes.',
            o: [V('Elles sont toutes identiques, intermédiaires entre celle d\'une liaison simple et celle d\'une liaison double', 'La charge et les doublets sont délocalisés : l\'ion réel est un hybride de toutes les formes limites, et toutes les liaisons sont équivalentes.'),
              F('Une est courte (double liaison) et les autres sont longues (simples)', 'Ce serait vrai pour une seule forme limite, mais l\'ion réel est un hybride : toutes les liaisons sont identiques.'),
              F('Elles alternent très vite entre simple et double', 'Les formes mésomères ne sont pas des états qui se succèdent : l\'ion n\'a qu\'une seule structure réelle, intermédiaire.')] },
          { id: 'symbole', titre: 'Le symbole', q: 'Quel symbole relie deux formes mésomères ?',
            aide: 'Il ne s\'agit pas d\'une transformation : ce sont deux écritures de la même espèce.',
            o: [V('Une flèche à double pointe ↔', 'La flèche ↔ relie deux écritures de la même espèce : elle ne représente ni une réaction ni un équilibre.'),
              F('Une double flèche ⇌ comme pour un équilibre', 'Cette double flèche représente un équilibre entre deux espèces différentes, ce qui n\'est pas le cas ici.'),
              F('Une flèche simple → comme pour une réaction', 'Une flèche → représente une transformation chimique : les formes mésomères ne se transforment pas l\'une en l\'autre.')] },
        ],
        retenir: ['Les formes mésomères sont plusieurs écritures de Lewis d\'une même espèce, reliées par ↔. L\'espèce réelle est un hybride : liaisons de même longueur, charge délocalisée.'],
      };
    },
  },

  // ── M11 : lire un profil réactionnel ──
  {
    id: 'meca-profil', domaine: DOM, niveau: 2, titre: 'Lire le profil d\'une réaction en deux étapes',
    construire: () => {
      let e1, a2, i, p;
      do { e1 = tire([40, 60, 80, 100]); i = tire([10, 20, 30]); a2 = tire([20, 40, 60, 80]); p = tire([-20, -40, -60]); } while (e1 === a2 || e1 - i < 10);
      const energies = [0, e1, i, i + a2, p];
      const lente = e1 > a2 ? 1 : 2;
      return {
        enonce: 'Le profil ci-dessous est celui d\'une réaction dont le mécanisme comporte deux étapes élémentaires. Cinq points sont repérés par une lettre ; les énergies sont données par rapport aux réactifs.',
        schema: { type: 'profilReac', energies, lettres: ['A', 'B', 'C', 'D', 'E'], valeurs: true },
        etapes: [
          { id: 'inter', titre: 'L\'intermédiaire réactionnel', q: 'Quel point correspond à l\'intermédiaire réactionnel ?',
            aide: 'Un intermédiaire est une espèce, qui existe un court instant : il est dans un creux du profil.',
            o: [V('Le point C (le creux entre les deux sommets)', 'L\'intermédiaire est formé par la première étape et consommé par la seconde : il occupe le creux entre les deux sommets.'),
              F('Le point B (un sommet)', 'Un sommet est un état de transition : ce n\'est pas une espèce que l\'on peut isoler.'),
              F('Le point A (les réactifs)', 'Le point A correspond aux réactifs, d\'où part la réaction.')] },
          { id: 'etapes', titre: 'Les étapes élémentaires', q: 'Combien d\'étapes élémentaires comporte ce mécanisme ?',
            aide: 'Chaque étape élémentaire franchit un sommet du profil.',
            o: [V('Deux, car il y a deux sommets (B et D)', 'Chaque sommet est franchi lors d\'une étape élémentaire : B pour la première, D pour la seconde.'),
              F('Une, car les réactifs donnent directement les produits', 'Le creux C montre qu\'un intermédiaire se forme : il y a donc deux étapes.'),
              F('Trois, car il y a cinq points repérés', 'Les points A, C et E sont des espèces ; ce sont les sommets (B et D) qui comptent les étapes.')] },
          { id: 'ea1', titre: 'L\'énergie d\'activation de l\'étape 1', q: 'Quelle est l\'énergie d\'activation de l\'étape 1 (de A à B) ?',
            aide: 'C\'est la hauteur à gravir : énergie du sommet B moins énergie du point de départ A.',
            type: 'saisie', champs: [{ id: 'ea1', lib: 'Ea (étape 1)', u: 'kJ·mol⁻¹', vrai: e1, tol: 0.02 }],
            expl: `Ea₁ = E(B) − E(A) = ${e1} − 0 = ${e1} kJ·mol⁻¹.` },
          { id: 'lente', titre: 'L\'étape la plus lente', q: 'Quelle étape est la plus lente ?',
            aide: 'Plus la barrière à franchir est haute, plus l\'étape est lente. Comparez Ea₁ (de A à B) et Ea₂ (de C à D).',
            o: [lente === 1 ? V('L\'étape 1', `Ea₁ = ${e1} kJ·mol⁻¹ est supérieure à Ea₂ = E(D) − E(C) = ${a2} kJ·mol⁻¹ : l'étape 1 est la plus lente.`) : F('L\'étape 1', `Ea₁ = ${e1} kJ·mol⁻¹ est inférieure à Ea₂ = E(D) − E(C) = ${a2} kJ·mol⁻¹.`),
              lente === 2 ? V('L\'étape 2', `Ea₂ = E(D) − E(C) = ${a2} kJ·mol⁻¹ est supérieure à Ea₁ = ${e1} kJ·mol⁻¹ : l'étape 2 est la plus lente.`) : F('L\'étape 2', `Ea₂ = E(D) − E(C) = ${a2} kJ·mol⁻¹ est inférieure à Ea₁ = ${e1} kJ·mol⁻¹.`),
              F('Les deux étapes ont la même vitesse', `Les barrières ne sont pas égales (${e1} et ${a2} kJ·mol⁻¹) : les vitesses sont différentes.`)] },
        ],
        retenir: ['Sur un profil, les creux sont des intermédiaires réactionnels et les sommets des états de transition ; chaque sommet franchi correspond à une étape élémentaire. L\'étape de plus haute barrière est la plus lente.'],
      };
    },
  },
];
