// Banque d'exercices « Syn, anti et sélectivités » (BTS Métiers de la chimie).
// Programme : « Sélectivité : chimiosélectivité, régiosélectivité, stéréosélectivité, stéréospécificité, syn, anti ».
//   se-mode, se-produit, se-comparer, se-vocabulaire
import { ALCENES, REACTIFS, resultat } from './seleModele.js';
const tire = t => t[Math.floor(Math.random() * t.length)];
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const DOM = 'Syn, anti et sélectivités (BTS)';
const brut = ['Z', 'E'];

export const EXERCICES = [
  { id: 'se-mode', domaine: DOM, niveau: 2, titre: 'Addition syn ou anti ? Reconnaître le mode d\'addition',
    construire: () => {
      const re = tire(['Br2', 'OsO4', 'H2']), R = REACTIFS[re], anti = R.mode === 'anti';
      const raison = { Br2: 'Br₂ forme un ion bromonium ; Br⁻ attaque ensuite par la face opposée au pont.', OsO4: 'OsO₄ forme un ester cyclique : les deux liaisons C–O se créent en même temps, du même côté.', H2: 'Les deux atomes H sont adsorbés sur le métal et transférés par la face qui est en contact avec lui.' }[re];
      return {
        enonce: `Un alcène réagit avec ${R.nom}. Le mécanisme passe par : ${R.inter}.`,
        etapes: [
          { id: 'mode', titre: 'Le mode d\'addition', q: 'L\'addition est-elle syn ou anti ?', aide: 'Syn : même face de l\'alcène. Anti : faces opposées.',
            o: [V(anti ? 'Anti' : 'Syn', raison),
              F(anti ? 'Syn' : 'Anti', anti ? 'Le pont occupe une face : l\'attaque ne peut se faire que par la face opposée.' : 'Les deux groupes sont apportés par la même face.'),
              F('Ni syn ni anti : l\'addition n\'a pas de stéréochimie', 'L\'addition sur les deux faces est l\'un ou l\'autre : syn ou anti.')] },
          { id: 'ou', titre: 'La position des groupes', q: 'Où se trouvent les deux groupes ajoutés par rapport au plan de l\'alcène ?', aide: 'Anti = opposés ; syn = ensemble.',
            o: [V(anti ? 'Sur des faces opposées' : 'Sur la même face', anti ? 'Anti : de part et d\'autre du plan.' : 'Syn : du même côté.'),
              F(anti ? 'Sur la même face' : 'Sur des faces opposées', anti ? 'Ce serait une addition syn.' : 'Ce serait une addition anti.'),
              F('Un seul groupe est ajouté', 'Deux groupes s\'ajoutent sur la double liaison.')] },
        ],
        retenir: ['Anti : Br₂ (ion bromonium). Syn : OsO₄ et H₂/Pd.'],
      };
    } },
  { id: 'se-produit', domaine: DOM, niveau: 2, titre: 'Prévoir le produit d\'une addition syn ou anti sur le but-2-ène',
    construire: () => {
      const a = tire(brut), re = tire(['Br2', 'OsO4']), A = ALCENES[a], R = REACTIFS[re], X = resultat(a, re);
      const rac = X.resultat === 'racémique';
      return {
        enonce: `On fait réagir le ${A.nom} avec ${R.nom} (addition ${R.mode}). Le produit est le ${X.produit}, qui possède deux carbones asymétriques.`,
        etapes: [
          { id: 'res', titre: 'Le résultat', q: 'Quel est le résultat stéréochimique ?', aide: 'Anti sur (Z) → racémique ; anti sur (E) → méso ; syn : l\'inverse.',
            o: [V(rac ? 'Un mélange racémique (2R,3R) + (2S,3S)' : 'Le composé méso (2R,3S)', rac ? 'Les deux faces donnent chacune un énantiomère : racémique.' : 'Les deux faces donnent le même composé, qui possède un plan de symétrie : méso.'),
              F(rac ? 'Le composé méso (2R,3S)' : 'Un mélange racémique (2R,3R) + (2S,3S)', rac ? 'Ce serait le résultat avec l\'autre stéréoisomère de départ.' : 'Ce serait le résultat avec l\'autre stéréoisomère de départ.'),
              F('Un seul énantiomère pur', 'Les deux faces sont équivalentes : aucun énantiomère n\'est favorisé.')] },
          { id: 'nb', titre: 'Le nombre de stéréoisomères', q: 'Combien de stéréoisomères distincts forme-t-on ?', aide: 'Un racémique en contient deux, un méso un seul.',
            type: 'saisie', champs: [{ id: 'nb', lib: 'Stéréoisomères distincts', u: '', vrai: X.n, tol: 0.02 }], expl: rac ? '2 : (2R,3R) et (2S,3S), en parts égales.' : '1 : le composé méso (2R,3S).' },
          { id: 'opt', titre: 'L\'activité optique', q: 'Le produit fait-il tourner la lumière polarisée ?', aide: 'Un racémique et un méso n\'ont pas d\'effet.',
            o: [V('Non', rac ? 'Le racémique contient autant de chaque énantiomère : les rotations se compensent.' : 'Le composé méso est achiral.'),
              F('Oui', 'Ni un racémique ni un composé méso ne présentent d\'activité optique.'),
              F('Oui, mais seulement à chaud', 'La température ne change rien à l\'absence d\'activité optique.')] },
        ],
        retenir: ['Anti : (Z) → racémique, (E) → méso. Syn : (Z) → méso, (E) → racémique.'],
      };
    } },
  { id: 'se-comparer', domaine: DOM, niveau: 2, titre: 'Même alcène, deux réactifs : comparer les produits',
    construire: () => {
      const a = tire(brut), A = ALCENES[a], br = resultat(a, 'Br2'), os = resultat(a, 'OsO4');
      return {
        enonce: `On traite deux fois le ${A.nom} : une fois par Br₂ (addition anti), une fois par OsO₄ (addition syn). Le produit est dans chaque cas un composé à deux carbones asymétriques.`,
        etapes: [
          { id: 'br', titre: 'Avec Br₂', q: 'Quel résultat obtient-on avec Br₂ ?', aide: 'Br₂ est anti.',
            o: [V(br.resultat === 'racémique' ? 'Un mélange racémique' : 'Le composé méso', `Addition anti sur le ${A.nom} : ${br.resultat}.`),
              F(br.resultat === 'racémique' ? 'Le composé méso' : 'Un mélange racémique', 'C\'est le résultat de l\'addition syn sur ce même alcène.'),
              F('Un seul énantiomère', 'Les deux faces sont équivalentes.')] },
          { id: 'os', titre: 'Avec OsO₄', q: 'Quel résultat obtient-on avec OsO₄ ?', aide: 'OsO₄ est syn : le résultat est l\'inverse du précédent.',
            o: [V(os.resultat === 'racémique' ? 'Un mélange racémique' : 'Le composé méso', `Addition syn sur le ${A.nom} : ${os.resultat}.`),
              F(os.resultat === 'racémique' ? 'Le composé méso' : 'Un mélange racémique', 'C\'est le résultat de l\'addition anti sur ce même alcène.'),
              F('Un seul énantiomère', 'Les deux faces sont équivalentes.')] },
          { id: 'conc', titre: 'La conclusion', q: 'Pourquoi les deux résultats sont-ils différents ?', aide: 'Quel paramètre change entre les deux expériences ?',
            o: [V('Parce que l\'addition est anti dans un cas et syn dans l\'autre', 'Le mode d\'addition (syn ou anti) détermine la configuration relative des deux nouveaux centres.'),
              F('Parce que Br₂ et OsO₄ n\'ont pas la même taille', 'Ce n\'est pas la taille qui compte, mais le mécanisme (syn ou anti).'),
              F('Parce que le carbocation est transposé', 'Il n\'y a pas de carbocation dans ces mécanismes.')] },
        ],
        retenir: ['Le mode d\'addition (syn ou anti) fixe le résultat : sur un même alcène, syn et anti donnent des stéréoisomères différents.'],
      };
    } },
  { id: 'se-vocabulaire', domaine: DOM, niveau: 2, titre: 'Stéréosélectif ou stéréospécifique ?',
    construire: () => {
      const spe = Math.random() < 0.5;
      const enonce = spe
        ? 'On additionne Br₂ sur le (Z)-but-2-ène : on obtient le racémique de (2R,3R) et (2S,3S)-2,3-dibromobutane. Avec le (E)-but-2-ène, on obtient le composé méso (2R,3S).'
        : 'On hydrogène le 1,2-diméthylcyclohexène sur palladium : on obtient essentiellement le cis-1,2-diméthylcyclohexane, le trans étant à peine formé.';
      return {
        enonce,
        etapes: [
          { id: 'q', titre: 'Le qualificatif', q: 'Quel qualificatif convient le mieux ?', aide: spe ? 'Deux stéréoisomères de départ donnent deux produits différents.' : 'Un stéréoisomère est formé de préférence à l\'autre.',
            o: [V(spe ? 'La réaction est stéréospécifique' : 'La réaction est stéréosélective', spe ? 'Chaque stéréoisomère de départ donne un stéréoisomère d\'arrivée différent.' : 'Un stéréoisomère est formé de préférence alors que l\'autre est possible ; il n\'y a pas deux réactifs à comparer.'),
              F(spe ? 'La réaction est seulement stéréosélective, sans être stéréospécifique' : 'La réaction est stéréospécifique', spe ? 'Elle est stéréosélective, mais aussi stéréospécifique : (Z) et (E) donnent des produits différents.' : 'Il n\'y a pas deux stéréoisomères de départ dont on compare les produits.'),
              F('La réaction est régiosélective', 'La régiosélectivité concerne le choix de la position d\'un groupe, pas la stéréochimie.')] },
          { id: 'rel', titre: 'Le lien', q: 'Laquelle de ces affirmations est correcte ?', aide: 'Une réaction stéréospécifique a-t-elle forcément un produit favorisé ?',
            o: [V('Toute réaction stéréospécifique est stéréosélective, mais l\'inverse n\'est pas vrai', 'Dans une réaction stéréospécifique, chaque réactif donne un stéréoisomère précis, donc sélectif ; l\'inverse n\'est pas garanti.'),
              F('Toute réaction stéréosélective est stéréospécifique', 'Le cas de l\'hydrogénation du 1,2-diméthylcyclohexène est stéréosélectif, sans comparaison de deux réactifs.'),
              F('Les deux termes sont synonymes', 'Ils décrivent deux situations différentes.')] },
        ],
        retenir: ['Stéréosélective : un stéréoisomère est formé de préférence. Stéréospécifique : à chaque stéréoisomère de départ correspond un stéréoisomère d\'arrivée. Une réaction stéréospécifique est donc stéréosélective.'],
      };
    } },
];
