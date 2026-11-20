// QCM du parcours guidé de la simulation « Équation de réaction : écrire et ajuster » (sim 179, 2GT).
// Fichier sans React : la longueur des options est contrôlée par equationReactionQcm.test.mjs (la bonne réponse n'est jamais la plus longue).
// bonne : indice de la bonne réponse dans options (l'ordre est mélangé à l'affichage). Les mauvaises réponses sont de vraies erreurs d'élèves.
export const QCM = {
  reactifs: {
    q: 'Dans la combustion du carbone, quels corps sont les réactifs ?',
    options: ['le carbone et le dioxygène, qui disparaissent', 'le dioxyde de carbone, qui apparaît à la fin', 'le dioxygène et le dioxyde de carbone ensemble', 'le carbone seul, car c’est lui qui brûle'], bonne: 0,
    expl: 'Les réactifs sont les corps qui disparaissent (ils sont consommés) : ici le carbone et le dioxygène. Le produit est le corps qui apparaît : le dioxyde de carbone.',
    indice: 'Regarde ce qui est présent AVANT la réaction et qui a disparu APRÈS : ce sont les réactifs.' },
  conservation: {
    q: 'Pendant la combustion du carbone, que deviennent les atomes ?',
    options: ['ils se réarrangent, aucun n’est perdu ni créé', 'certains atomes d’oxygène disparaissent pendant la réaction', 'de nouveaux atomes d’oxygène se créent dans le produit', 'les atomes de carbone se changent en atomes d’oxygène'], bonne: 0,
    expl: 'Avant : 1 atome C et 2 atomes O. Après : 1 atome C et 2 atomes O, dans CO₂. Les atomes sont les mêmes, ils sont seulement assemblés autrement : on ne perd rien, on ne crée rien.',
    indice: 'Compte les atomes C et O dans C + O₂, puis dans CO₂ : sont-ils aussi nombreux avant qu’après ?' },
  etats: {
    q: 'Dans l’équation de la combustion du méthane, H₂O(g) signifie que l’eau formée est…',
    options: ['de la vapeur d’eau, un gaz', 'de l’eau liquide, comme dans un verre', 'de la glace, de l’eau solide', 'de l’eau dissoute dans de l’eau'], bonne: 0,
    expl: '(g) veut dire « gaz » : dans la flamme très chaude, tous les corps sont gazeux et l’eau formée est de la vapeur. (s) solide, (l) liquide, (aq) dissous dans l’eau.',
    indice: 'Lis la légende : (s) solide, (l) liquide, (g) gaz, (aq) dissous dans l’eau.' },
  produits: {
    q: 'Le gaz fait « pop » près d’une flamme : c’est du dihydrogène H₂. Le test des ions zinc Zn²⁺ est positif (précipité blanc avec la soude). La lame de zinc diminue. Quels sont les produits ?',
    options: ['le dihydrogène H₂ et les ions zinc Zn²⁺', 'le dioxyde de carbone CO₂ et les ions zinc Zn²⁺', 'le dihydrogène H₂ et le zinc solide Zn', 'l’eau H₂O et les ions chlorure Cl⁻'], bonne: 0,
    expl: 'Le « pop » montre qu’il se forme du dihydrogène H₂ ; le test positif montre que des ions Zn²⁺ sont apparus. Le zinc solide, lui, diminue : c’est un réactif, pas un produit.',
    indice: 'Un produit est un corps qui APPARAÎT. Le zinc solide diminue : il disparaît. Que montrent le « pop » et le test des ions zinc ?' },
  spect: {
    q: 'Dans cette écriture avec tous les ions, quelles espèces sont spectatrices ?',
    options: ['Na⁺ et Cl⁻ : ils ne changent pas', 'H⁺ et HO⁻ : ce sont les deux réactifs', 'H₂O seule : c’est le seul produit', 'aucune : toutes les espèces réagissent'], bonne: 0,
    expl: 'Na⁺ et Cl⁻ sont présents avant et après, sans changer : ce sont des espèces spectatrices. Seuls H⁺ et HO⁻ réagissent pour former H₂O.',
    indice: 'Une espèce spectatrice apparaît des deux côtés de la flèche, identique. Laquelle voit-on avant ET après ?' },
  exo: {
    q: 'Quelle transformation est exothermique, c’est-à-dire qu’elle libère de l’énergie vers le milieu ?',
    options: ['A, car la température du milieu monte', 'B, car la température du milieu baisse', 'les deux, car la température change', 'aucune, car l’énergie ne change pas'], bonne: 0,
    expl: 'Dans A, le milieu se réchauffe : la transformation libère de l’énergie, elle est exothermique. Dans B, il se refroidit : elle prend de l’énergie au milieu, elle est endothermique.',
    indice: 'Quand une transformation libère de l’énergie, le milieu qui la reçoit se réchauffe : la température monte.' },
};
