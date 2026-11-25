// ====================================================
//  Exercice « calcul » de la simulation 241 (modifier la chaîne carbonée) : tirage pur, sans React, testable avec node (chcExos.test.mjs relit le texte
//  affiché et refait le calcul). Rendements d'étape : données fournies (fictives). Masses molaires arrondies, données dans l'énoncé.
// ====================================================
const NB = '\u00a0';
const d = (x, k) => Number(x).toFixed(k).replace('.', ',').replace('-', '−');
export function tirageCalcul(tire) {
  // q1 : nombre d'atomes de carbone du produit d'une addition d'organomagnésien sur un composé carbonylé
  const n1 = tire([2, 3, 4]), n2 = tire([2, 3, 4]), v1 = n1 + n2;
  const q1 = { id: 'ch0', type: 'num', unite: 'atomes de C', vrai: v1, tolRel: 0.05, csMin: 1,
    q: `Un bromoalcane R–Br dont le groupe R compte ${n1}${NB}atomes de carbone est transformé en organomagnésien R–MgBr. Celui-ci réagit avec un composé carbonylé de ${n2}${NB}atomes de carbone, puis on hydrolyse. Combien d’atomes de carbone compte l’alcool formé ?`,
    aide: 'L’organomagnésien se lie au carbone du groupe C=O par une nouvelle liaison C–C : le produit réunit les deux squelettes. La formation de l’organomagnésien ne change pas le nombre d’atomes de carbone.',
    pieges: [[n1, 'Vous n’avez compté que le groupe R : le squelette du composé carbonylé s’ajoute à celui de l’organomagnésien.'], [n2, 'Vous n’avez compté que le composé carbonylé : le squelette de l’organomagnésien est conservé dans le produit.'], [v1 + 1, 'Vous avez ajouté un atome de carbone de trop : aucun atome de carbone n’est apporté par Mg ni par l’eau.']],
    expl: `Le produit réunit les deux squelettes : ${n1} + ${n2} = ${v1} atomes de carbone.` };
  // q2 : rendement global d'une séquence de trois étapes (organomagnésien, addition, oxydation)
  const e1 = tire([80, 85, 90]), e2 = tire([60, 65, 70, 75]), e3 = tire([80, 85, 90]), v2 = e1 * e2 * e3 / 10000;
  const q2 = { id: 'ch1', type: 'num', unite: '%', vrai: v2, tolRel: 0.05, csMin: 2,
    q: `Une synthèse comporte trois étapes successives : formation d’un organomagnésien (rendement ${e1}${NB}%), addition sur un aldéhyde puis hydrolyse (${e2}${NB}%), oxydation de l’alcool secondaire en cétone (${e3}${NB}%) ; données fournies. Quel est le rendement global de la synthèse (en %) ?`,
    aide: 'Rendement global = η₁ × η₂ × η₃, chaque rendement étant écrit comme un nombre compris entre 0 et 1 ; exprimez le résultat en pourcentage.',
    pieges: [[(e1 + e2 + e3) / 3, 'Vous avez fait la moyenne des trois rendements : les étapes s’enchaînent, on les multiplie.'], [e1 * e2 / 100, 'Vous avez oublié la troisième étape : multipliez aussi par son rendement.'], [Math.min(e1, e2, e3), 'Le rendement global est plus petit que le plus petit rendement d’étape : les pertes de chaque étape s’accumulent.']],
    expl: `η global = frac(${e1}|100) × frac(${e2}|100) × frac(${e3}|100) = ${d(v2 / 100, 3)}, soit ${d(v2, 1)}${NB}%.` };
  // q3 : masse de butan-2-ol obtenue à partir du bromoéthane (G3 puis G4)
  const n0 = tire([0.20, 0.25, 0.40, 0.50]), r1 = tire([80, 85, 90]), r2 = tire([60, 65, 70, 75]), M = 74.1, v3 = n0 * r1 * r2 / 10000 * M;
  const q3 = { id: 'ch2', type: 'num', unite: 'g', vrai: v3, tolRel: 0.06, csMin: 2,
    q: `On part de ${d(n0, 2)}${NB}mol de bromoéthane. Il est transformé en bromure d’éthylmagnésium (rendement ${r1}${NB}%), qui réagit avec l’éthanal puis on hydrolyse (rendement ${r2}${NB}%) pour donner du butan-2-ol, de masse molaire M = 74,1${NB}g/mol ; les coefficients stœchiométriques valent tous 1. Quelle masse de butan-2-ol obtient-on (en g) ?`,
    aide: 'Quantité finale = quantité de départ × η₁ × η₂ (rendements écrits entre 0 et 1) ; puis masse = quantité × masse molaire.',
    pieges: [[n0 * r1 / 100 * M, 'Vous n’avez appliqué que le rendement de la première étape : la seconde fait aussi perdre de la matière.'], [n0 * r2 / 100 * M, 'Vous n’avez appliqué que le rendement de la seconde étape : la première fait aussi perdre de la matière.'], [n0 * r1 * r2 / 10000, 'Vous avez donné une quantité de matière en mol : multipliez par la masse molaire pour obtenir une masse en g.']],
    expl: `n(butan-2-ol) = ${d(n0, 2)} × frac(${r1}|100) × frac(${r2}|100) = ${d(n0 * r1 * r2 / 10000, 4)}${NB}mol ; m = n × M = ${d(n0 * r1 * r2 / 10000, 4)} × 74,1 = ${d(v3, 2)}${NB}g.` };
  // q4 : masse de bromoéthane nécessaire pour une masse visée de butan-2-ol
  const m4 = tire([5.0, 8.0, 10.0, 12.0, 15.0]), r3 = tire([80, 85, 90]), r4 = tire([60, 65, 70, 75]), MBr = 109, v4 = m4 / M / (r3 * r4 / 10000) * MBr;
  const q4 = { id: 'ch3', type: 'num', unite: 'g', vrai: v4, tolRel: 0.06, csMin: 2,
    q: `On veut obtenir ${d(m4, 1)}${NB}g de butan-2-ol (M = 74,1${NB}g/mol) à partir de bromoéthane (M = 109${NB}g/mol) par les deux étapes précédentes, de rendements ${r3}${NB}% et ${r4}${NB}% ; les coefficients stœchiométriques valent tous 1. Quelle masse de bromoéthane faut-il engager (en g) ?`,
    aide: 'Quantité de butan-2-ol visée = masse ÷ masse molaire. La quantité de bromoéthane à engager est plus grande : divisez par le rendement global (écrit entre 0 et 1), puis multipliez par la masse molaire du bromoéthane.',
    pieges: [[m4 / M * MBr, 'Vous avez ignoré les rendements : une partie de la matière est perdue, il faut engager plus de bromoéthane.'], [m4 / M * (r3 * r4 / 10000) * MBr, 'Vous avez multiplié par le rendement global au lieu de diviser : il faut engager plus de réactif que le calcul sans perte, pas moins.'], [m4 / (r3 * r4 / 10000), 'Vous avez corrigé par le rendement mais oublié les masses molaires : passez par les quantités de matière.']],
    expl: `n(butan-2-ol) = ${d(m4, 1)} ÷ 74,1 = ${d(m4 / M, 4)}${NB}mol ; n(bromoéthane) = ${d(m4 / M, 4)} ÷ (frac(${r3}|100) × frac(${r4}|100)) = ${d(m4 / M / (r3 * r4 / 10000), 4)}${NB}mol ; m = n × M = ${d(v4, 1)}${NB}g.` };
  const qs = [q1, q2, q3, q4];
  qs.forEach(q => { const seuil = Math.max(1.5 * q.tolRel, 0.08); q.pieges = q.pieges.filter(([v]) => Number.isFinite(v) && Math.abs(v - q.vrai) > seuil * Math.abs(q.vrai)); });
  return { intro: 'Modifier la chaîne carbonée : atomes de carbone d’un produit, rendement global d’une séquence, masse de produit et masse de réactif (données fournies).', questions: qs,
    retenir: ['Une liaison C–C nouvelle réunit deux squelettes : le nombre d’atomes de carbone du produit est la somme de ceux des deux réactifs organiques.', 'Rendement global = produit des rendements d’étape (écrits entre 0 et 1) : il est inférieur au plus petit rendement d’étape.', 'Quantité de produit = quantité de départ × rendement global (coefficients égaux à 1) ; quantité à engager = quantité visée ÷ rendement global.'] };
}
