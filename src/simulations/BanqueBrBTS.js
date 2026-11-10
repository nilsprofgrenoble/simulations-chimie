// Banque d'exercices « Addition du dibrome sur un alcène » (BTS Métiers de la chimie).
// Compétences visées : test de la double liaison ; mécanisme par ion bromonium ; addition anti ; stéréospécificité.
//   br-test, br-meca, br-stereo, br-cyclo
import { ALCENES } from './brModele.js';
const tire = t => t[Math.floor(Math.random() * t.length)];
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const DOM = 'Addition du dibrome (BTS)';

export const EXERCICES = [
  { id: 'br-test', domaine: DOM, niveau: 2, titre: 'Le test à l\'eau de dibrome',
    construire: () => {
      const c = tire([['le cyclohexène', true], ['le but-1-ène', true], ['l\'hexane', false], ['le cyclohexane', false]]);
      return {
        enonce: `On ajoute quelques gouttes d'eau de dibrome (brune) à un échantillon de ${c[0]}. On agite.`,
        etapes: [
          { id: 'obs', titre: 'L\'observation', q: 'Qu\'observe-t-on ?',
            aide: 'Le dibrome s\'additionne sur une double liaison C=C ; sur un alcane, il ne réagit pas à froid et à l\'obscurité.',
            o: [V(c[1] ? 'La couleur brune disparaît : le mélange se décolore' : 'La couleur brune persiste : pas de réaction', c[1] ? 'Br₂ s\'additionne sur la double liaison C=C : il est consommé, la couleur disparaît.' : 'Un alcane (liaisons simples seulement) ne réagit pas avec Br₂ en l\'absence de lumière.'),
              F(c[1] ? 'La couleur brune persiste' : 'Le mélange se décolore', c[1] ? 'Le dibrome est consommé par l\'addition sur C=C.' : 'Sans double liaison, Br₂ n\'est pas consommé.'),
              F('Un précipité blanc se forme', 'Ce n\'est pas le résultat attendu avec l\'eau de dibrome.')] },
          { id: 'concl', titre: 'La conclusion', q: 'Que peut-on conclure du test ?',
            aide: 'Le test est caractéristique des composés insaturés.',
            o: [V(c[1] ? 'Le composé possède une double liaison C=C' : 'Le composé ne possède pas de double liaison C=C', 'Un test négatif exclut une double liaison ; un test positif en suggère une.'),
              F(c[1] ? 'Le composé est un alcane' : 'Le composé est un alcène', 'C\'est l\'inverse de ce que montre le test.'),
              F('On ne peut rien conclure', 'Le test à l\'eau de dibrome est caractéristique de la double liaison.')] },
        ],
        retenir: ['L\'eau de dibrome brune est décolorée par un alcène (addition de Br₂ sur C=C) et pas par un alcane : test caractéristique de la double liaison.'],
      };
    } },
  { id: 'br-meca', domaine: DOM, niveau: 2, titre: 'Le mécanisme de l\'addition de Br₂ : ion bromonium',
    construire: () => {
      const A = ALCENES[tire(['cyclo', 'Z', 'E'])];
      return {
        enonce: `Le ${A.nom} réagit avec le dibrome Br₂ dans le dichlorométhane.`,
        etapes: [
          { id: 'et1', titre: 'La première étape', q: 'Que se passe-t-il dans la première étape ?',
            aide: 'Le doublet π attaque un atome de brome de la molécule Br₂ polarisée.',
            o: [V('Le doublet π attaque Br ; Br⁻ part ; un ion bromonium (pont Br⁺) se forme', 'Le doublet de C=C est nucléophile : il attaque Br (δ+) et forme un pont à trois chaînons.'),
              F('Un carbocation libre se forme et Br⁻ attaque ensuite', 'Dans ce modèle, le brome forme un pont avec les deux carbones : l\'ion bromonium.'),
              F('Les deux Br se fixent simultanément sur les deux carbones', 'L\'addition se fait en deux étapes, avec un intermédiaire.')] },
          { id: 'et2', titre: 'La seconde étape', q: 'Par quelle face Br⁻ ouvre-t-il le pont ?',
            aide: 'Comparez avec la SN2.',
            o: [V('Par la face opposée au pont', 'Le pont joue le rôle de groupe partant : le nucléophile attaque du côté opposé.'),
              F('Par la même face que le pont', 'Cette face est occupée par Br⁺ : l\'attaque y est impossible.'),
              F('Indifféremment par l\'une ou l\'autre face', 'Seule la face opposée au pont est accessible.')] },
          { id: 'rel', titre: 'La conséquence', q: 'Comment les deux atomes de brome se placent-ils ?',
            aide: 'Un Br provient du pont, l\'autre de Br⁻ qui a attaqué la face opposée.',
            o: [V('De part et d\'autre du plan de l\'ancienne double liaison : addition anti', 'Un Br est sur une face (le pont), l\'autre sur la face opposée (Br⁻).'),
              F('Du même côté du plan : addition syn', 'Cela demanderait une attaque du côté du pont, impossible.'),
              F('Au hasard : syn ou anti', 'Le mécanisme impose l\'addition anti.')] },
        ],
        retenir: ['Br₂ s\'additionne sur C=C par un ion bromonium, ouvert par Br⁻ par la face opposée : addition anti.'],
      };
    } },
  { id: 'br-stereo', domaine: DOM, niveau: 2, titre: 'Stéréospécificité : (Z) ou (E) ?',
    construire: () => {
      const A = ALCENES[tire(['Z', 'E'])], z = A.cle === 'Z';
      return {
        enonce: `On fait réagir le ${A.nom} avec Br₂. La réaction est une addition anti, et les deux faces de l'alcène sont attaquées avec la même probabilité. Le produit est le 2,3-dibromobutane (deux carbones asymétriques).`,
        etapes: [
          { id: 'res', titre: 'Le produit', q: 'Quel est le résultat stéréochimique ?',
            aide: z ? 'Chaque face conduit à un énantiomère.' : 'Les deux faces conduisent au même composé.',
            o: [V(z ? 'Un mélange racémique de (2R,3R) et (2S,3S)' : 'Le composé méso (2R,3S)', z ? 'Chaque face donne un énantiomère, en parts égales : racémique.' : 'Les deux faces donnent le même composé, qui possède un plan de symétrie : méso.'),
              F(z ? 'Le composé méso (2R,3S)' : 'Un mélange racémique de (2R,3R) et (2S,3S)', z ? 'C\'est le produit obtenu à partir du (E), pas du (Z).' : 'C\'est le produit obtenu à partir du (Z), pas du (E).'),
              F('Les quatre stéréoisomères en parts égales', 'L\'addition anti est stéréospécifique : chaque alcène ne donne qu\'une partie des stéréoisomères.')] },
          { id: 'nb', titre: 'Le nombre de stéréoisomères', q: 'Combien de stéréoisomères distincts forme-t-on ?',
            aide: 'Un racémique contient deux énantiomères ; un composé méso est un seul composé.',
            type: 'saisie', champs: [{ id: 'nb', lib: 'Stéréoisomères obtenus', u: '', vrai: A.nbStereo, tol: 0.02 }],
            expl: z ? '2 : (2R,3R) et (2S,3S), en parts égales.' : '1 : le composé méso (2R,3S).' },
          { id: 'opt', titre: 'L\'activité optique', q: 'Le produit fait-il tourner la lumière polarisée ?',
            aide: 'Un racémique et un méso sont tous les deux sans effet.',
            o: [V('Non', z ? 'Le racémique contient autant de (R,R) que de (S,S) : les rotations se compensent.' : 'Le composé méso est achiral (plan de symétrie).'),
              F('Oui, dans le sens de (R,R)', 'Les deux énantiomères sont en quantités égales : pas de rotation nette.'),
              F('Oui, dans le sens de (S,S)', 'Il n\'y a pas d\'excès d\'un énantiomère.')] },
        ],
        retenir: ['Addition anti stéréospécifique : (Z)-but-2-ène → racémique ; (E)-but-2-ène → méso. Dans les deux cas, pas d\'activité optique.'],
      };
    } },
  { id: 'br-cyclo', domaine: DOM, niveau: 2, titre: 'L\'addition de Br₂ sur le cyclohexène',
    construire: () => {
      const A = ALCENES.cyclo;
      return {
        enonce: `Le cyclohexène réagit avec Br₂ pour donner le ${A.produit}. L'addition est anti.`,
        etapes: [
          { id: 'cfg', titre: 'La configuration relative', q: 'Quel stéréoisomère se forme ?',
            aide: 'Anti : les deux Br sont de part et d\'autre du plan moyen du cycle.',
            o: [V('Le trans-1,2-dibromocyclohexane', 'Anti signifie de part et d\'autre du cycle : trans.'),
              F('Le cis-1,2-dibromocyclohexane', 'Le cis aurait les deux Br du même côté, ce qui correspond à une addition syn.'),
              F('Un mélange cis/trans à parts égales', 'L\'addition anti est stéréospécifique.')] },
          { id: 'cn', titre: 'La chiralité', q: 'Le trans-1,2-dibromocyclohexane est-il chiral ?',
            aide: 'Cherchez un plan ou un centre de symétrie.',
            o: [V('Oui : il existe deux énantiomères, (1R,2R) et (1S,2S)', 'Le trans n\'a ni plan ni centre de symétrie : il est chiral.'),
              F('Non : il est méso', 'C\'est le cis qui est méso, pas le trans.'),
              F('Non : il n\'a pas de carbone asymétrique', 'Les deux carbones liés à Br sont asymétriques.')] },
          { id: 'mel', titre: 'Le mélange obtenu', q: 'Quelle est la composition du produit ?',
            aide: 'Les deux faces du cycle sont attaquées avec la même probabilité.',
            o: [V('Un mélange racémique de (1R,2R) et (1S,2S)', 'Chaque face donne un énantiomère, en parts égales.'),
              F('Un seul énantiomère', 'Le dibrome n\'est pas chiral : il n\'y a pas de face privilégiée.'),
              F('Un composé méso', 'Le trans n\'est pas méso.')] },
        ],
        retenir: ['Sur un cycle, l\'addition anti conduit au trans : un racémique, sans activité optique.'],
      };
    } },
];
