// ====================================================
//  Exercice « calcul » de la simulation 210 (stratégie de synthèse) : tirage pur, sans React, testable avec node (strExos.test.mjs relit le texte affiché
//  et refait le calcul). Les nombres sont écrits en décimales fixes. Rendements d'étape et déchets : données fournies (fictives).
// ====================================================
const NB = ' ';
const d = (x, k) => Number(x).toFixed(k).replace('.', ',').replace('-', '−');
export function tirageCalcul(tire) {
  // q1 : rendement global de deux étapes
  const a = tire([70, 75, 80, 85, 90]), b = tire([50, 60, 65, 70, 75]), v1 = a * b / 100;
  const q1 = { id: 'st0', type: 'num', unite: '%', vrai: v1, tolRel: 0.05, csMin: 2,
    q: `Une synthèse comporte deux étapes successives, de rendements ${a}${NB}% puis ${b}${NB}% (données fournies). Quel est le rendement global de la synthèse (en %) ?`,
    aide: 'Les étapes s’enchaînent : on multiplie les rendements écrits comme des nombres compris entre 0 et 1 (85 % = 0,85), puis on exprime le résultat en pourcentage.',
    pieges: [[(a + b) / 2, 'Vous avez fait la moyenne des deux rendements : les étapes s’enchaînent, il faut les multiplier.'], [a + b, 'Vous avez additionné les rendements : un rendement global ne peut pas dépasser 100 %.'], [Math.min(a, b), 'Le rendement global est plus petit que le plus petit rendement d’étape : il faut multiplier les rendements, pas en garder un seul.'], [a * b / 10000, 'Vous avez multiplié les rendements sans repasser en pourcentage : multipliez le résultat par 100.']],
    expl: `η global = frac(${a}|100) × frac(${b}|100) = ${d(v1 / 100, 3)}, soit ${d(v1, 1)}${NB}%.` };
  // q2 : trois étapes
  const e1 = tire([90, 95, 85]), e2 = tire([80, 85, 75]), e3 = tire([60, 70, 65]), v2 = e1 * e2 * e3 / 10000;
  const q2 = { id: 'st1', type: 'num', unite: '%', vrai: v2, tolRel: 0.05, csMin: 2,
    q: `Une synthèse en trois étapes a pour rendements d’étape ${e1}${NB}%, ${e2}${NB}% et ${e3}${NB}% (données fournies). Quel est son rendement global (en %) ?`,
    aide: 'Rendement global = η₁ × η₂ × η₃, avec chaque rendement écrit comme un nombre compris entre 0 et 1 ; exprimez le résultat en pourcentage.',
    pieges: [[(e1 + e2 + e3) / 3, 'Vous avez fait la moyenne des trois rendements : on les multiplie.'], [e3, 'Vous n’avez gardé que la dernière étape : la matière perdue aux étapes précédentes compte aussi.'], [e1 * e2 / 100, 'Vous avez oublié la troisième étape : multipliez aussi par son rendement.']],
    expl: `η global = frac(${e1}|100) × frac(${e2}|100) × frac(${e3}|100) = ${d(v2 / 100, 3)}, soit ${d(v2, 1)}${NB}%.` };
  // q3 : quantité de produit final (coefficients stœchiométriques tous égaux à 1)
  const n0 = tire([0.20, 0.40, 0.50, 0.80, 1.00]), r1 = tire([60, 70, 80, 90]), r2 = tire([50, 60, 75, 80]), v3 = n0 * r1 * r2 / 10000;
  const q3 = { id: 'st2', type: 'num', unite: 'mol', vrai: v3, tolRel: 0.06, csMin: 2,
    q: `On part de ${d(n0, 2)}${NB}mol d’un réactif. Les deux étapes de la synthèse ont des rendements de ${r1}${NB}% et ${r2}${NB}% ; les coefficients stœchiométriques valent tous 1. Quelle quantité de produit final obtient-on (en mol) ?`,
    aide: 'Quantité finale = quantité de départ × η₁ × η₂ (rendements écrits entre 0 et 1) : chaque étape ne transforme qu’une part de la quantité reçue.',
    pieges: [[n0 * r1 / 100, 'Vous n’avez appliqué que le rendement de la première étape : la seconde fait aussi perdre de la matière.'], [n0 * r2 / 100, 'Vous n’avez appliqué que le rendement de la seconde étape : la première fait aussi perdre de la matière.'], [n0 * (r1 + r2) / 200, 'Vous avez utilisé la moyenne des rendements : on multiplie les rendements.']],
    expl: `n = ${d(n0, 2)} × frac(${r1}|100) × frac(${r2}|100) = ${d(v3, 3)}${NB}mol.` };
  // q4 : déchets
  const k1 = tire([1.5, 2.0, 2.5, 3.0, 3.5]), k2 = tire([1.0, 1.5, 2.0, 2.5]), m = tire([100, 200, 250, 400, 500]), v4 = (k1 + k2) * m;
  const q4 = { id: 'st3', type: 'num', unite: 'g', vrai: v4, tolRel: 0.05, csMin: 2,
    q: `Une voie de synthèse produit ${d(k1, 1)}${NB}kg de déchets à l’étape 1 et ${d(k2, 1)}${NB}kg à l’étape 2, pour 1,0${NB}kg de produit final obtenu (données fournies). Quelle masse de déchets produit-elle pour obtenir ${m}${NB}g de produit final (en g) ?`,
    aide: 'Additionnez les déchets des deux étapes (en kg par kg de produit), puis multipliez par la masse de produit exprimée en kg (100 g = 0,100 kg) ; donnez le résultat en g.',
    pieges: [[(k1 + k2) * 1000, 'Cette masse correspond à 1,0 kg de produit : ici on en prépare moins, convertissez la masse de produit en kg.'], [k1 * m, 'Vous n’avez compté que les déchets de l’étape 1 : ajoutez ceux de l’étape 2.'], [(k1 + k2) * m / 1000, 'Vous avez donné des kg : la réponse est demandée en g.']],
    expl: `Déchets par kg de produit : ${d(k1, 1)} + ${d(k2, 1)} = ${d(k1 + k2, 1)} kg. Pour ${m} g = ${d(m / 1000, 3)} kg de produit : ${d(k1 + k2, 1)} × ${d(m / 1000, 3)} = ${d((k1 + k2) * m / 1000, 3)} kg, soit ${d(v4, 0)}${NB}g.` };
  const qs = [q1, q2, q3, q4];
  qs.forEach(q => { const seuil = Math.max(1.5 * q.tolRel, 0.08); q.pieges = q.pieges.filter(([v]) => Number.isFinite(v) && Math.abs(v - q.vrai) > seuil * Math.abs(q.vrai)); });
  return { intro: 'Stratégie de synthèse : rendement global d’une synthèse multi-étapes, quantité de produit final et déchets (données fournies).', questions: qs,
    retenir: ['Rendement global = produit des rendements d’étape (écrits entre 0 et 1) : il est inférieur au plus petit rendement d’étape.', 'Quantité finale = quantité de départ × rendement global (coefficients stœchiométriques égaux à 1).', 'Déchets d’une voie : on additionne les déchets de chaque étape (kg par kg de produit), puis on multiplie par la masse de produit en kg.'] };
}
