// QCM du parcours guidé de la simulation « Corps pur ou mélange : température de changement d'état » (sim 196, 2GT).
// Fichier sans React : la longueur des options est contrôlée par corpsPur2gtQcm.test.mjs (la bonne réponse n'est jamais la plus longue).
// bonne : indice de la bonne réponse dans options (l'ordre est mélangé à l'affichage). Les mauvaises réponses sont de vraies erreurs d'élèves.
export const QCM = {
  pur: {
    q: 'Dans quel cas la matière est-elle un corps pur ?',
    options: ['du cuivre pur d’un fil électrique', 'de l’eau minérale en bouteille', 'du jus de pomme sans pulpe', 'de l’air contenu dans un pneu de vélo'], bonne: 0,
    expl: 'Le cuivre pur ne contient qu’une seule espèce chimique : c’est un corps pur. L’eau minérale (eau et sels dissous), le jus de pomme et l’air contiennent plusieurs espèces : ce sont des mélanges.',
    indice: 'Un corps pur ne contient qu’une seule espèce chimique. Dans quel cas n’y a-t-il qu’un seul constituant ?' },
  homhet: {
    q: 'Lequel de ces mélanges est hétérogène ?',
    options: ['du jus d’orange avec pulpe', 'du sirop de grenadine bien dilué', 'de l’eau sucrée bien mélangée', 'de l’eau minérale plate'], bonne: 0,
    expl: 'Dans le jus d’orange avec pulpe, on voit des morceaux de pulpe dans le liquide : on distingue plusieurs matières, le mélange est hétérogène. Les trois autres paraissent n’être qu’un seul liquide : ils sont homogènes.',
    indice: 'Un mélange hétérogène laisse voir plusieurs matières à l’œil nu. Dans quel verre voit-on autre chose qu’un liquide uniforme ?' },
  palier: {
    q: 'Entre quelles dates l’éthanol est-il en train de bouillir ?',
    options: ['entre 10 et 15 minutes environ', 'entre 0 et 10 minutes environ', 'entre 5 et 10 minutes environ', 'pendant toute l’expérience, de 0 à 15 minutes'], bonne: 0,
    expl: 'L’éthanol bout pendant la partie horizontale de la courbe, à 78 °C, d’environ 10 à 15 minutes. Avant, sa température monte seulement.',
    indice: 'Cherchez sur la courbe la partie horizontale. Entre quelles dates (en minutes) commence-t-elle et finit-elle ?' },
  melange: {
    q: 'On chauffe un liquide et on obtient la courbe de la scène. De quoi s’agit-il ?',
    options: ['d’un mélange : on ne voit aucune partie plate', 'd’un corps pur : la température monte régulièrement', 'd’un corps pur : la courbe commence à 20 °C', 'd’un mélange : il bout à 100 °C exactement'], bonne: 0,
    expl: 'La température continue de monter pendant l’ébullition : la courbe n’a aucune partie plate. C’est la signature d’un mélange : un corps pur aurait un palier.',
    indice: 'Rappelez-vous la courbe de l’éthanol, un corps pur. Retrouvez-vous une partie horizontale sur cette courbe-ci ?' },
  precision: {
    q: 'Le thermomètre est précis à ± 1 °C et indique 56 °C. La vraie température est…',
    options: ['entre 55 °C et 57 °C', 'exactement 56 °C, ni plus ni moins', 'entre 56 °C et 57 °C seulement', 'entre 50 °C et 62 °C environ'], bonne: 0,
    expl: 'La précision est de ± 1 °C : la vraie température peut être 1 °C plus basse ou 1 °C plus haute que la valeur lue, donc entre 55 °C et 57 °C.',
    indice: 'La précision se compte vers le haut et vers le bas : retirez 1 °C à la valeur lue, puis ajoutez-lui 1 °C.' },
  compat: {
    q: 'Un élève lit 77,5 °C avec un thermomètre précis à ± 1 °C. La valeur de référence de l’éthanol est 78 °C. Que conclure ?',
    options: ['compatible : l’écart de 0,5 °C est inférieur à 1 °C', 'pas compatible : 77,5 est différent de 78', 'pas compatible : l’écart de 0,5 °C est plus grand que 1 °C', 'pas compatible : 77,5 est plus petit que 78'], bonne: 0,
    expl: 'L’écart est 78 − 77,5 = 0,5 °C. Il est inférieur à la précision (1 °C) : la valeur lue est compatible avec la référence de l’éthanol.',
    indice: 'Calculez l’écart entre 77,5 °C et 78 °C, puis comparez-le à la précision du thermomètre, 1 °C.' },
  identifier: {
    q: 'Un liquide pur bout à 80,5 °C (thermomètre précis à ± 1 °C). Quel liquide du tableau est compatible ?',
    options: ['le cyclohexane, dont l’écart (0,5 °C) est inférieur à 1 °C', 'l’éthanol, car 78 °C est la valeur la plus proche de 80,5 °C', 'l’eau, car 100 °C est la plus grande valeur du tableau', 'l’acétone, car 56 °C est la plus petite valeur du tableau'], bonne: 0,
    expl: 'Écart avec le cyclohexane : 81 − 80,5 = 0,5 °C, inférieur à 1 °C. Avec l’éthanol : 80,5 − 78 = 2,5 °C, supérieur à 1 °C. Les écarts avec l’eau et l’acétone sont bien plus grands : seul le cyclohexane convient.',
    indice: 'Calculez l’écart entre 80,5 °C et la référence de chaque liquide, puis gardez ceux dont l’écart est inférieur à 1 °C.' },
  eausalee: {
    q: 'Un liquide inconnu bout à 102 °C (thermomètre précis à ± 0,5 °C). La référence de l’eau pure est 100 °C. Que conclure ?',
    options: ['ce n’est pas de l’eau pure : l’écart de 2 °C dépasse 0,5 °C', 'c’est de l’eau pure : 102 °C est proche de 100 °C', 'c’est de l’eau pure : la température est stable, donc corps pur', 'on ne peut rien dire sans thermomètre parfait'], bonne: 0,
    expl: 'L’écart avec la référence de l’eau pure est 102 − 100 = 2 °C : il dépasse la précision du thermomètre (0,5 °C), la valeur n’est pas compatible. Ce liquide était de l’eau salée, un mélange : elle bout au-dessus de 100 °C.',
    indice: 'Calculez l’écart entre 102 °C et la référence de l’eau pure, puis comparez-le à la précision, 0,5 °C.' },
};
