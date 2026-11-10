// Banque d'exercices « Chimiosélectivité » (BTS Métiers de la chimie).
// Programme : « Sélectivité : chimiosélectivité… » ; « extraire d'un mécanisme les informations qui expliquent la formation d'un produit, des sous-produits ».
//   ch-groupe, ch-choisir, ch-perte, ch-paracetamol
import { SUBSTRATS, bilan, nomGroupe } from './chimioModele.js';
const tire = t => t[Math.floor(Math.random() * t.length)];
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const DOM = 'Chimiosélectivité (BTS)';

export const EXERCICES = [
  { id: 'ch-groupe', domaine: DOM, niveau: 2, titre: 'Quel groupe fonctionnel réagit ?',
    construire: () => {
      const s = tire(['cetoester', 'alcenone']), S = SUBSTRATS[s], re = tire(Object.keys(S.reactifs).filter(r => bilan(s, r).nb === 1)), b = bilan(s, re);
      const g = b.touches[0], autre = g === 'A' ? 'B' : 'A';
      return {
        enonce: `Le ${S.nom} porte deux groupes fonctionnels : ${S.gA} et ${S.gB}. On le traite par ${b.R.nom}.`,
        etapes: [
          { id: 'qui', titre: 'Le groupe transformé', q: 'Quel groupe est transformé ?', aide: 'Comparez la réactivité des deux groupes vis-à-vis du réactif.',
            o: [V(`Le groupe ${nomGroupe(s, g)}`, b.R.pourquoi),
              F(`Le groupe ${nomGroupe(s, autre)}`, `Ce groupe n'est pas attaqué dans ces conditions : ${b.R.pourquoi}`),
              F('Les deux groupes', 'Dans ces conditions, un seul des deux groupes réagit.')] },
          { id: 'prod', titre: 'Le produit', q: 'Quel est le produit obtenu ?', aide: 'Transformez uniquement le groupe concerné.',
            o: [V(b.R.produit, `Le groupe ${nomGroupe(s, g)} est transformé ; l'autre est conservé.`),
              ...[...new Set(Object.values(S.reactifs).map(r => r.produit).filter(x => x !== b.R.produit && x !== 'aucune réaction notable'))].slice(0, 2).map(x => F(x, 'Ce produit correspond à un autre réactif ou à d\'autres conditions.')),
              F('Un produit où les deux groupes sont transformés', 'Dans ces conditions, un seul groupe réagit.')].slice(0, 3) },
          { id: 'chi', titre: 'Le qualificatif', q: 'Cette réaction est-elle chimiosélective ?', aide: 'Un seul groupe sur deux réagit-il ?',
            o: [V('Oui : un seul groupe fonctionnel réagit', 'Chimiosélective : un groupe fonctionnel est transformé de préférence à l\'autre.'),
              F('Non : les deux groupes réagissent', 'Ici seul un groupe est transformé.'),
              F('Non : cela concerne la position, pas le groupe', 'C\'est la régiosélectivité qui concerne la position ; ici on compare deux groupes différents.')] },
        ],
        retenir: ['Chimiosélectivité : un réactif transforme un groupe fonctionnel de préférence à un autre, en raison de leurs réactivités différentes.'],
      };
    } },
  { id: 'ch-choisir', domaine: DOM, niveau: 2, titre: 'Choisir le réactif pour viser un groupe',
    construire: () => {
      const viseCetone = Math.random() < 0.5;
      return {
        enonce: 'On dispose de l\'hex-5-én-2-one, qui porte une cétone et une double liaison C=C. On souhaite ' + (viseCetone ? 'réduire seulement la cétone (obtenir l\'hex-5-én-2-ol).' : 'réduire seulement la liaison C=C (obtenir l\'hexan-2-one).'),
        etapes: [
          { id: 'ch', titre: 'Le réactif', q: 'Quel réactif faut-il choisir ?', aide: viseCetone ? 'Un hydrure attaque le carbone électrophile du C=O.' : 'Le dihydrogène activé par un métal s\'additionne sur C=C.',
            o: [V(viseCetone ? 'NaBH₄ dans l\'éthanol' : 'H₂ sur Pd/C, 1 bar, 25 °C', viseCetone ? 'NaBH₄ réduit le C=O et laisse la C=C.' : 'H₂/Pd réduit la C=C et laisse le C=O.'),
              F(viseCetone ? 'H₂ sur Pd/C, 1 bar, 25 °C' : 'NaBH₄ dans l\'éthanol', viseCetone ? 'H₂/Pd réduirait la C=C, pas la cétone.' : 'NaBH₄ réduirait la cétone, pas la C=C.'),
              F('Aucun : il est impossible de réduire un seul groupe', 'Le choix du réactif permet précisément de cibler un des deux groupes.')] },
          { id: 'pro', titre: 'La justification', q: 'Qu\'est-ce qui rend cette sélectivité possible ?', aide: 'Les deux groupes ont-ils la même polarité ?',
            o: [V('Les deux groupes n\'ont pas la même réactivité : C=O est polarisé (carbone électrophile), C=C ne l\'est pas', 'Un hydrure attaque un site électrophile ; H₂/Pd agit sur C=C à la surface du métal.'),
              F('Les deux groupes réagissent de la même façon avec tous les réactifs', 'Si c\'était le cas, il n\'y aurait pas de sélectivité.'),
              F('La température seule détermine le groupe qui réagit', 'Ici c\'est la nature du réactif qui décide.')] },
        ],
        retenir: ['Le choix du réactif permet de viser un groupe : hydrures pour C=O, H₂/Pd pour C=C.'],
      };
    } },
  { id: 'ch-perte', domaine: DOM, niveau: 2, titre: 'Quand la chimiosélectivité disparaît',
    construire: () => {
      const cas = tire([
        { s: 'cetoester', r: 'LiAlH4', q: 'On remplace NaBH₄ par LiAlH₄ pour réduire le 4-oxopentanoate d\'éthyle.', pour: 'LiAlH₄ est un réducteur beaucoup plus puissant : il réduit aussi l\'ester.', conj: 'le pouvoir réducteur du réactif augmente', prod: 'pentane-1,4-diol' },
        { s: 'aminophenol', r: 'Ac2Oexc', q: 'On acétyle le 4-aminophénol avec un grand excès d\'anhydride éthanoïque et de la pyridine, en chauffant à 80 °C.', pour: 'Excès de réactif et chauffage permettent d\'acyler aussi le phénol.', conj: 'les conditions sont plus dures (excès, chauffage)', prod: 'éthanoate de 4-acétamidophényle' },
      ]);
      return {
        enonce: cas.q,
        etapes: [
          { id: 'nb', titre: 'Les groupes qui réagissent', q: 'Combien de groupes fonctionnels sont transformés ?', aide: 'Comparez avec les conditions douces.',
            type: 'saisie', champs: [{ id: 'nb', lib: 'Groupes transformés', u: '', vrai: 2, tol: 0.02 }], expl: 'Les deux groupes sont transformés : ' + cas.prod + '.' },
          { id: 'cause', titre: 'La cause', q: 'Pourquoi la chimiosélectivité est-elle perdue ?', aide: 'Qu\'est-ce qui a changé par rapport aux conditions sélectives ?',
            o: [V('Parce que ' + cas.conj, cas.pour),
              F('Parce que le deuxième groupe est devenu plus réactif', 'Le groupe n\'a pas changé ; ce sont les conditions ou le réactif qui sont plus agressifs.'),
              F('Parce que la réaction est devenue stéréosélective', 'La stéréosélectivité n\'a rien à voir avec cette perte de chimiosélectivité.')] },
          { id: 'rem', titre: 'Le remède', q: 'Comment retrouver la chimiosélectivité ?', aide: 'Revenez à des conditions plus douces.',
            o: [V('En utilisant un réactif plus doux ou des conditions plus douces (moins de réactif, température plus basse)', 'Réactifs et conditions doux permettent de ne faire réagir que le groupe le plus réactif.'),
              F('En augmentant encore la température', 'Cela renforcerait la perte de sélectivité.'),
              F('En ajoutant un grand excès de réactif', 'L\'excès fait réagir les deux groupes.')] },
        ],
        retenir: ['Un réactif trop puissant ou des conditions trop dures (excès, chauffage) font réagir les deux groupes : la chimiosélectivité se perd.'],
      };
    } },
  { id: 'ch-paracetamol', domaine: DOM, niveau: 2, titre: 'Chimiosélectivité dans la synthèse du paracétamol',
    construire: () => {
      return {
        enonce: 'Le paracétamol est obtenu par action d\'un équivalent d\'anhydride éthanoïque sur le 4-aminophénol, en solution aqueuse. Le 4-aminophénol porte un groupe –NH₂ (amine) et un groupe –OH (phénol).',
        etapes: [
          { id: 'qui', titre: 'Le groupe acylé', q: 'Quel groupe est acylé ?', aide: 'Comparez le caractère nucléophile de l\'azote et de l\'oxygène du phénol.',
            o: [V('L\'amine –NH₂, qui donne un amide', 'Le doublet de l\'azote est plus nucléophile que celui de l\'oxygène phénolique.'),
              F('Le phénol –OH, qui donne un ester', 'Le phénol est moins nucléophile que l\'amine dans ces conditions.'),
              F('Les deux, à parts égales', 'Avec un seul équivalent, c\'est l\'amine qui réagit.')] },
          { id: 'q2', titre: 'Le type de sélectivité', q: 'De quel type de sélectivité s\'agit-il ?', aide: 'Deux groupes différents sont en compétition.',
            o: [V('Chimiosélectivité', 'Deux groupes fonctionnels différents (amine et phénol) sont en compétition.'),
              F('Régiosélectivité', 'La régiosélectivité concerne le choix d\'une position sur un même groupe ou une même liaison.'),
              F('Stéréosélectivité', 'Aucun stéréoisomère n\'est en jeu.')] },
          { id: 'q3', titre: 'Le produit', q: 'Quel est le produit ?', aide: 'L\'amine est transformée en amide.',
            o: [V('N-(4-hydroxyphényl)éthanamide (paracétamol)', 'L\'amine est acylée : le groupe –OH reste libre.'),
              F('Éthanoate de 4-aminophényle', 'Ce serait l\'ester issu de l\'acylation du phénol.'),
              F('Éthanoate de 4-acétamidophényle', 'Ce produit résulte de l\'acylation des deux groupes.')] },
        ],
        retenir: ['La synthèse du paracétamol est chimiosélective : l\'amine, plus nucléophile que le phénol, est acylée de préférence avec un équivalent d\'anhydride.'],
      };
    } },
];
