// QCM du parcours guidé de la simulation « Changement d'état : équation, transfert thermique et énergie » (sim 195, 2GT).
// Fichier sans React : la longueur des options est contrôlée par changementEtat2gtQcm.test.mjs (la bonne réponse n'est jamais la plus longue).
// bonne : indice de la bonne réponse dans options (l'ordre est mélangé à l'affichage). Les mauvaises réponses sont de vraies erreurs d'élèves.
export const QCM = {
  etats: {
    q: 'Dans lequel de ces cas l’eau change-t-elle d’état ?',
    options: ['une flaque d’eau qui disparaît peu à peu au soleil', 'de l’eau du robinet qu’on réchauffe de 15 °C à 40 °C', 'une bouteille d’eau qu’on secoue très fort', 'un verre d’eau qu’on verse dans un grand seau'], bonne: 0,
    expl: 'Dans la flaque, l’eau liquide devient de la vapeur d’eau, un gaz : c’est un changement d’état. Dans les autres cas, l’eau reste liquide : sa température ou sa place change, pas son état.',
    indice: 'Un changement d’état, c’est le passage de solide, liquide ou gaz à un autre de ces états. Dans quels cas l’eau reste-t-elle liquide du début à la fin ?' },
  noms: {
    q: 'De la vapeur d’eau se dépose en gouttes sur un miroir froid. Comment s’appelle ce changement d’état, du gaz au liquide ?',
    options: ['la liquéfaction', 'la solidification', 'la vaporisation', 'la fusion'], bonne: 0,
    expl: 'Du gaz devient un liquide : c’est la liquéfaction. C’est le changement inverse de la vaporisation (liquide vers gaz).',
    indice: 'Le gaz est au départ, le liquide à l’arrivée. Liquéfaction : le gaz devient liquide, c’est l’inverse de la vaporisation. Quel nom correspond ?' },
  sublim: {
    q: 'Sur une vitre très froide, la vapeur d’eau de l’air se change directement en glace : c’est le givre. Quel est ce changement d’état ?',
    options: ['la condensation solide', 'la sublimation', 'la solidification de l’eau', 'la liquéfaction de la vapeur'], bonne: 0,
    expl: 'Le gaz devient directement un solide, sans passer par l’état liquide : c’est la condensation solide, le changement inverse de la sublimation.',
    indice: 'On part d’un gaz et on arrive à un solide, sans liquide entre les deux. Cherche le changement inverse de celui du texte.' },
  equation: {
    q: 'Quelle écriture décrit la vaporisation de l’eau ?',
    options: ['H₂O(l) → H₂O(g)', 'H₂O(g) → H₂O(l)', 'H₂O(s) → H₂O(g)', 'H₂O(l) → H₂(g) + O(g)'], bonne: 0,
    expl: 'La vaporisation est le passage de liquide à gaz : l’eau liquide H₂O(l) devient de la vapeur d’eau H₂O(g). La formule ne change pas, seul l’état change.',
    indice: 'Vaporisation : liquide vers gaz. Écris la formule de l’eau avec l’état de départ avant la flèche, l’état d’arrivée après.' },
  micro: {
    q: 'Pendant la fusion de la glace, que deviennent les molécules d’eau ?',
    options: ['elles restent les mêmes molécules, mais ne sont plus rangées', 'elles se séparent en atomes d’hydrogène et d’oxygène isolés', 'elles disparaissent et de nouvelles molécules se créent dans le liquide', 'elles grossissent peu à peu en absorbant l’énergie reçue'], bonne: 0,
    expl: 'Les molécules sont les mêmes avant et après (H₂O) : seule leur disposition change. Rangées dans le solide, elles deviennent mobiles dans le liquide.',
    indice: 'Regarde la formule de l’eau avant et après la fusion, puis compare la place des disques dans les deux dessins.' },
  sens: {
    q: 'L’eau liquide d’un bac à glaçons se solidifie dans le congélateur. Quelle phrase est correcte ?',
    options: ['l’eau cède de l’énergie au milieu : exothermique', 'l’eau reçoit de l’énergie du milieu : exothermique', 'l’eau reçoit de l’énergie du milieu : endothermique', 'l’eau cède de l’énergie au milieu : endothermique'], bonne: 0,
    expl: 'Pour se solidifier, l’eau libère de l’énergie vers le congélateur (sa température reste à 0 °C pendant la solidification). Le système cède de l’énergie : le changement d’état est exothermique. C’est l’inverse de la fusion.',
    indice: 'La solidification est le changement inverse de la fusion. La fusion reçoit de l’énergie : que fait l’inverse ?' },
  dissolution: {
    q: 'On verse du sel de cuisine dans de l’eau et le sel « disparaît ». Quelle affirmation est correcte ?',
    options: ['c’est une dissolution : le sel se disperse dans l’eau', 'c’est une fusion : le sel devient liquide, comme un glaçon', 'c’est une liquéfaction : le sel se change en eau pure', 'c’est une vaporisation : le sel part dans l’air ambiant'], bonne: 0,
    expl: 'Le sel ne devient pas liquide : ses entités se séparent et se mêlent à l’eau, qui reste de l’eau liquide. On change de mélange, pas d’état : c’est une dissolution, pas une fusion.',
    indice: 'Dans une fusion, un seul corps change d’état. Ici, combien de corps sont mélangés ? L’eau a-t-elle changé d’état ?' },
  pourquoi: {
    q: 'Pourquoi faut-il bien plus d’énergie pour vaporiser de l’eau que pour faire fondre la même masse de glace ?',
    options: ['les molécules doivent s’éloigner beaucoup plus les unes des autres', 'l’eau doit d’abord être chauffée de 0 °C à 100 °C pendant la vaporisation', 'il y a plus de molécules dans la vapeur que dans la glace', 'les molécules de la vapeur sont plus grosses que celles de la glace'], bonne: 0,
    expl: 'Dans la glace, les molécules sont rangées et serrées ; dans l’eau liquide elles sont encore proches. Les molécules s’attirent : pour obtenir un gaz, il faut les éloigner complètement, ce qui demande bien plus d’énergie. Le nombre et la taille des molécules ne changent pas. Fusion à 0 °C et vaporisation à 100 °C : la température de l’eau ne varie pas pendant le changement d’état, la différence d’énergie ne vient donc pas d’une différence de température.',
    indice: 'Compare la distance entre les molécules dans le liquide et dans le gaz (dessins de l’étape « Le monde des molécules »). Le nombre de molécules change-t-il ?' },
};
