// Banque d'exercices « Types de réaction et transposition » (BTS Métiers de la chimie).
// Programme : « Reconnaître, dans un mécanisme réactionnel, une addition, une substitution, une élimination, une insertion,
// une réaction acide-base ou une transposition » ; « extraire d'un mécanisme et/ou d'un profil les informations qui expliquent
// la formation d'un produit, des sous-produits ».   tr-type, tr-carbocation, tr-produits, tr-profil
import { CAS, barriereMigration, gainStabilite } from './transpoModele.js';
const tire = t => t[Math.floor(Math.random() * t.length)];
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const DOM = 'Types de réaction et transposition (BTS)';
const TYPES = ['addition', 'substitution', 'élimination', 'transposition', 'réaction acide-base', 'insertion'];
const DEF = {
  'addition': 'des atomes ou groupes se fixent de part et d\'autre d\'une liaison multiple, sans que rien ne soit perdu',
  'substitution': 'un groupe est remplacé par un autre sur le même atome',
  'élimination': 'deux atomes ou groupes sont perdus sur deux atomes voisins et une liaison multiple se forme',
  'transposition': 'un atome ou un groupe migre d\'un atome vers l\'atome voisin, sans rien ajouter ni éliminer',
  'réaction acide-base': 'un proton H⁺ est transféré d\'un acide vers une base',
  'insertion': 'un groupe s\'intercale dans une liaison existante, qu\'il remplace par deux liaisons',
};
const REACTIONS = [
  ['CH₂=CH₂ + Br₂ → BrCH₂–CH₂Br', 'addition'],
  ['CH₃–CH=CH₂ + HBr → CH₃–CHBr–CH₃', 'addition'],
  ['CH₃–CH₂–Br + HO⁻ → CH₃–CH₂–OH + Br⁻', 'substitution'],
  ['(CH₃)₃C–Br + H₂O → (CH₃)₃C–OH + HBr', 'substitution'],
  ['CH₃–CH₂–Br + CH₃CH₂O⁻ → CH₂=CH₂ + CH₃CH₂OH + Br⁻', 'élimination'],
  ['(CH₃)₃C–Br → (CH₃)₂C=CH₂ + HBr', 'élimination'],
  ['(CH₃)₂CH–CH⁺–CH₃ → (CH₃)₂C⁺–CH₂–CH₃ (migration d\'un atome H)', 'transposition'],
  ['CH₃–CH⁺–C(CH₃)₃ → CH₃–CH(CH₃)–C⁺(CH₃)₂ (migration d\'un groupe CH₃)', 'transposition'],
  ['CH₃COOH + HO⁻ → CH₃COO⁻ + H₂O', 'réaction acide-base'],
  ['NH₃ + H₃O⁺ → NH₄⁺ + H₂O', 'réaction acide-base'],
  ['R–H + :CH₂ (carbène) → R–CH₃ (le carbène s\'intercale dans la liaison C–H)', 'insertion'],
];

export const EXERCICES = [
  { id: 'tr-type', domaine: DOM, niveau: 2, titre: 'Reconnaître le type de réaction dans un mécanisme',
    construire: () => {
      const [eq, typ] = tire(REACTIONS);
      const autres = TYPES.filter(t => t !== typ).sort(() => Math.random() - 0.5).slice(0, 2);
      const opts = [V(typ, `${eq} : ${DEF[typ]} — c'est bien une ${typ}.`.replace('une élimination', 'une élimination').replace('une insertion', 'une insertion')),
        ...autres.map(t => F(t, `Dans une ${t}, ${DEF[t]} : ce n'est pas ce qui se passe ici.`))].sort(() => Math.random() - 0.5);
      const opts2 = [V(`Dans cette réaction, ${DEF[typ]}`, `C'est la définition de la ${typ}.`),
        ...autres.map(t => F(`Dans cette réaction, ${DEF[t]}`, `Cette description correspond à une ${t}, pas à cette réaction.`))].sort(() => Math.random() - 0.5);
      return {
        enonce: `On étudie la transformation suivante : ${eq}.`,
        etapes: [
          { id: 'type', titre: 'Le type de réaction', q: 'De quel type de réaction s\'agit-il ?', aide: 'Regardez ce qui est ajouté, remplacé, perdu ou déplacé.', o: opts },
          { id: 'just', titre: 'La justification', q: 'Quelle observation justifie votre réponse ?', aide: 'Comparez les réactifs et les produits.', o: opts2 },
        ],
        retenir: ['Addition : on ajoute sur une liaison multiple. Substitution : un groupe en remplace un autre. Élimination : on perd deux groupes et on forme une liaison multiple. Transposition : un groupe migre sur l\'atome voisin. Acide-base : transfert de H⁺. Insertion : un groupe s\'intercale dans une liaison.'],
      };
    } },
  { id: 'tr-carbocation', domaine: DOM, niveau: 2, titre: 'Un carbocation va-t-il se transposer ?',
    construire: () => {
      const C = tire([
        { f: 'CH₃–CH⁺–CH(CH₃)₂', cl: 'secondaire', oui: true, g: 'un atome H', fin: '(CH₃)₂C⁺–CH₂–CH₃', fcl: 'tertiaire' },
        { f: 'CH₃–CH⁺–C(CH₃)₃', cl: 'secondaire', oui: true, g: 'un groupe CH₃', fin: '(CH₃)₂C⁺–CH(CH₃)₂', fcl: 'tertiaire' },
        { f: 'CH₃–CH⁺–CH₂–CH₃', cl: 'secondaire', oui: false, why: 'une migration ne ferait que donner un autre carbocation secondaire : pas de gain de stabilité' },
        { f: '(CH₃)₃C⁺', cl: 'tertiaire', oui: false, why: 'une migration donnerait un carbocation primaire, beaucoup moins stable' },
      ]);
      return {
        enonce: `Un carbocation ${C.cl} de formule ${C.f} est formé au cours d'une réaction.`,
        etapes: [
          { id: 'oui', titre: 'La possibilité d\'une transposition', q: 'Ce carbocation peut-il se transposer en un carbocation plus stable ?', aide: 'Cherchez un carbone voisin dont la migration d\'un groupe donnerait un carbocation plus substitué.',
            o: [V(C.oui ? 'Oui, par migration 1,2 d\'un groupe porté par le carbone voisin' : 'Non, il n\'existe pas de migration qui le stabilise', C.oui ? `La migration de ${C.g} donne ${C.fin}, carbocation ${C.fcl}, plus stable.` : `Non : ${C.why}.`),
              F(C.oui ? 'Non, il n\'existe pas de migration qui le stabilise' : 'Oui, par migration 1,2 d\'un groupe porté par le carbone voisin', C.oui ? 'Il existe un carbone voisin qui, en cédant un groupe, permet d\'obtenir un carbocation plus substitué.' : `Non : ${C.why}.`),
              F('Oui, en perdant H⁺ pour donner un alcool', 'La perte de H⁺ donne un alcène (élimination) et non un alcool ; ce n\'est pas une transposition.')] },
          ...(C.oui ? [{ id: 'g', titre: 'Le groupe qui migre', q: 'Quel groupe migre vers le carbone positif ?', aide: 'Il est porté par le carbone voisin, qui deviendra le carbone positif.',
            o: [V(C.g[0].toUpperCase() + C.g.slice(1), `${C.g[0].toUpperCase() + C.g.slice(1)} migre avec le doublet de sa liaison vers le carbone positif.`),
              F(C.g === 'un atome H' ? 'Un groupe CH₃' : 'Un atome H', 'Le groupe qui migre est celui du carbone voisin qui mène au carbocation tertiaire.'),
              F('L\'ion Br⁻', 'Br⁻ n\'est pas encore intervenu : c\'est un nucléophile qui capture ensuite le carbocation.')] }] : []),
          { id: 'cl', titre: 'Le carbocation final', q: C.oui ? 'Quelle est la classe du carbocation obtenu après transposition ?' : 'Que devient la classe du carbocation s\'il ne se transpose pas ?', aide: 'Comptez les carbones liés au carbone positif.',
            o: [V(C.oui ? 'Tertiaire' : C.cl.charAt(0).toUpperCase() + C.cl.slice(1), C.oui ? 'Le carbone positif est lié à trois carbones : tertiaire.' : 'Sans transposition, la classe est inchangée.'),
              F(C.oui ? 'Secondaire' : (C.cl === 'tertiaire' ? 'Secondaire' : 'Tertiaire'), 'Comptez de nouveau les carbones liés au carbone positif.'),
              F('Primaire', 'Un carbocation primaire est très instable : il ne se forme pas dans ces conditions.')] },
        ],
        retenir: ['Un carbocation se transpose par migration 1,2 (H ou alkyle) lorsqu\'il devient plus stable (secondaire → tertiaire). Sans gain de stabilité, il n\'y a pas de transposition.'],
      };
    } },
  { id: 'tr-produits', domaine: DOM, niveau: 2, titre: 'Produit majoritaire et sous-produit avec transposition',
    construire: () => {
      const K = CAS[tire(['hydrure', 'methyle'])];
      return {
        enonce: `Le ${K.alcene} réagit avec HBr. Le premier intermédiaire est le ${K.cationS}, formé par addition de H⁺. Une transposition 1,2 est possible vers le ${K.cationT}.`,
        etapes: [
          { id: 'maj', titre: 'Le produit majoritaire', q: 'Quel est le produit majoritaire ?', aide: 'Le carbocation le plus stable est le plus abondant.',
            o: [V(K.produitB, `Capture de Br⁻ par le carbocation tertiaire (formé par transposition) : ${K.produitB}, environ ${K.pctB} %.`),
              F(K.produitA, `Ce produit vient de la capture directe du carbocation secondaire : c'est le sous-produit (≈ ${K.pctA} %).`),
              F('Un produit de substitution par HO⁻', 'Il n\'y a pas de HO⁻ dans le milieu : c\'est une addition de HBr.')] },
          { id: 'sous', titre: 'Le sous-produit', q: 'Quel produit explique-t-on par la capture directe, sans transposition ?', aide: 'Br⁻ attaque le carbocation secondaire avant la migration.',
            o: [V(K.produitA, 'Br⁻ s\'est fixé sur C2, là où se trouve la charge du carbocation secondaire formé en premier.'),
              F(K.produitB, 'C\'est le produit issu du carbocation transposé, donc du produit majoritaire.'),
              F('Un alcène', 'Aucune élimination n\'est impliquée ici.')] },
          { id: 'pct', titre: 'La proportion', q: 'Quel pourcentage environ de produit transposé obtient-on (ordre de grandeur) ?', aide: 'Utilisez la simulation « Transposition de carbocation ».',
            type: 'saisie', champs: [{ id: 'pct', lib: 'Produit transposé', u: '%', vrai: K.pctB, tol: 0.1 }], expl: `Ordre de grandeur expérimental : environ ${K.pctB} % (valeur arrondie).` },
        ],
        retenir: ['Une transposition de carbocation explique la formation du produit majoritaire (issu du carbocation le plus stable) et celle du sous-produit (capture directe).'],
      };
    } },
  { id: 'tr-profil', domaine: DOM, niveau: 2, titre: 'Lire le profil d\'une transposition',
    construire: () => {
      const k = tire(['hydrure', 'methyle']), K = CAS[k], ea = barriereMigration(k), gs = gainStabilite(k);
      return {
        enonce: `Pour le ${K.alcene} + HBr, le profil d'énergie à partir du carbocation secondaire (énergie ${K.E.cs} kJ·mol⁻¹, réactifs = 0) indique : état de transition de la migration à ${K.E.etS} kJ·mol⁻¹ ; carbocation tertiaire à ${K.E.ct} kJ·mol⁻¹. La formation du carbocation secondaire à partir des réactifs demande une énergie d'activation d'environ 100 kJ·mol⁻¹.`,
        etapes: [
          { id: 'ea', titre: 'La barrière de migration', q: 'Quelle est l\'énergie d\'activation de la migration ?', aide: 'Énergie de l\'état de transition moins énergie du carbocation secondaire.',
            type: 'saisie', champs: [{ id: 'ea', lib: 'E_a (migration)', u: 'kJ·mol⁻¹', vrai: ea, tol: 0.02 }], expl: `E_a = ${K.E.etS} − ${K.E.cs} = ${ea} kJ·mol⁻¹.` },
          { id: 'gs', titre: 'Le gain de stabilité', q: 'De combien le carbocation tertiaire est-il plus stable que le secondaire ?', aide: 'Différence des énergies des deux carbocations.',
            type: 'saisie', champs: [{ id: 'gs', lib: 'Différence d\'énergie', u: 'kJ·mol⁻¹', vrai: gs, tol: 0.02 }], expl: `${K.E.cs} − ${K.E.ct} = ${gs} kJ·mol⁻¹.` },
          { id: 'vit', titre: 'La plus lente des deux étapes', q: 'Quelle étape est la plus lente : la formation du carbocation secondaire ou sa transposition ?', aide: 'Comparez les énergies d\'activation (≈ 100 contre ' + ea + ' kJ·mol⁻¹).',
            o: [V('La formation du carbocation secondaire (≈ 100 kJ·mol⁻¹)', `Sa barrière (≈ 100) est bien supérieure à celle de la migration (${ea}) : c'est l'étape cinétiquement déterminante.`),
              F('La transposition', `Sa barrière (${ea} kJ·mol⁻¹) est bien plus faible : elle est très rapide.`),
              F('Les deux vont à la même vitesse', 'Les barrières sont très différentes.')] },
        ],
        retenir: ['La migration 1,2 a une barrière faible : elle est rapide devant la formation du carbocation, qui est l\'étape cinétiquement déterminante. Le carbocation tertiaire est plus stable que le secondaire.'],
      };
    } },
];
