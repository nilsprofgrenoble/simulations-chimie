// QCM du parcours guidé de la simulation « Concentration en quantité de matière : dissolution et dilution » (sim 153).
// Fichier sans React : la longueur des options est contrôlée par un script (la bonne réponse n'est jamais la plus longue ni la plus courte).
// Toutes les options d'une question suivent le même patron : « réponse : justification ». bonne : indice de la bonne réponse dans options.
export const QCM = {
  comparer: {
    q: 'Les deux solutions contiennent la même quantité de sel dissous. Laquelle est la plus concentrée ?',
    options: ['la solution A : la même quantité de sel dans un volume deux fois plus petit', 'la solution B : son plus grand volume contient davantage de sel', 'aucune : elles contiennent la même quantité de sel, donc la même concentration', 'on ne peut pas savoir : il faudrait connaître la nature du sel dissous'], bonne: 0,
    expl: 'La concentration compare la quantité de soluté au volume de solution. Ici la quantité est la même, mais le volume de A est deux fois plus petit : A contient deux fois plus de soluté par litre, elle est deux fois plus concentrée. La nature du sel n’intervient pas pour comparer des quantités de matière.',
    indice: 'Comptez les particules de soluté dans chaque bécher, puis regardez le volume de solution : où sont-elles les plus serrées ?' },
  conserv: {
    q: 'On prélève 10 mL de solution mère et on les verse dans une fiole jaugée de 100 mL, qu’on complète avec de l’eau distillée. La quantité de matière de soluté dans la fiole, comparée à celle des 10 mL prélevés, est…',
    options: ['la même : l’eau distillée ajoutée n’apporte pas de soluté ni n’en retire', 'dix fois plus petite : la solution obtenue est dix fois moins concentrée', 'dix fois plus grande : le volume de la solution a été multiplié par dix', 'un peu plus petite : le soluté se partage entre la solution et l’eau ajoutée'], bonne: 0,
    expl: 'Ajouter de l’eau pure ne retire ni n’ajoute de soluté : les particules prélevées sont toutes dans la fiole. Leur nombre est inchangé, mais elles sont réparties dans un volume dix fois plus grand : c’est la concentration qui est divisée par dix, pas la quantité de matière. On dit que la quantité de matière de soluté se conserve.',
    indice: 'Comptez les particules de soluté dans le prélèvement. L’eau distillée en apporte-t-elle ou en retire-t-elle ?' },
  verreSolide: {
    q: 'On a pesé la masse de sel nécessaire. Pour obtenir exactement 250,0 mL de solution, on dissout le sel puis on ajuste le volume dans…',
    options: ['une fiole jaugée de 250,0 mL : son trait de jauge fixe le volume précis', 'un bécher gradué de 250 mL : ses graduations donnent le volume voulu', 'une éprouvette graduée de 250 mL : sa forme allongée donne une lecture fine', 'un erlenmeyer de 250 mL : son trait à 250 mL donne le volume voulu'], bonne: 0,
    expl: 'Seule la fiole jaugée possède un trait de jauge unique qui fixe le volume avec précision : on y dissout le solide, on remplit aux deux tiers d’eau distillée, on agite jusqu’à dissolution complète, puis on complète jusqu’au trait. Les graduations d’un bécher, d’une éprouvette ou d’un erlenmeyer ne donnent qu’une valeur approchée du volume.',
    indice: 'Parmi ces récipients, lequel porte un trait de jauge unique, fait pour contenir un volume précis ?' },
  verreDilution: {
    q: 'On veut prélever 5,00 mL de solution mère pour préparer 200,0 mL de solution fille. Le matériel adapté est…',
    options: ['une pipette jaugée de 5,00 mL et une fiole jaugée de 200,0 mL : ces deux verres sont précis', 'une pipette graduée de 10 mL et une fiole jaugée de 200,0 mL : on lit 5 mL sur les graduations', 'une pipette jaugée de 5,00 mL et une éprouvette graduée de 250 mL : on y complète jusqu’à 200 mL', 'une pipette graduée de 10 mL et un bécher de 250 mL : ce sont des verres courants'], bonne: 0,
    expl: 'Pour un volume précis à prélever, on utilise une pipette jaugée munie d’une propipette ; pour le volume final, une fiole jaugée. L’éprouvette graduée et le bécher donnent des volumes seulement approchés : la concentration de la solution fille serait moins bien connue. (Le calcul des incertitudes relève d’une autre simulation.)',
    indice: 'Pour chaque volume (prélevé et final), cherchez le verre qui n’a qu’un seul trait de jauge.' },
  jauge: {
    q: 'La pipette a versé 5,00 mL de solution mère dans la fiole jaugée de 200,0 mL. Comment obtient-on alors 200,0 mL de solution fille ?',
    options: ['on complète à l’eau distillée jusqu’au trait de 200,0 mL : c’est le volume de la fiole', 'on ajoute 195 mL d’eau mesurés à l’éprouvette : 5 mL et 195 mL font bien 200 mL', 'on ajoute 200,0 mL d’eau, puis on repère le trait : l’eau doit avoir le volume de la fille', 'on remplit d’abord la fiole d’eau jusqu’au trait : on y verse ensuite la solution mère'], bonne: 0,
    expl: 'On complète avec de l’eau distillée jusqu’au trait de jauge (en fin de remplissage, goutte à goutte), puis on bouche et on agite. C’est le trait qui fixe le volume final, pas une addition de volumes : mesurer 195 mL à l’éprouvette serait moins précis et les volumes de liquides mélangés ne s’additionnent pas toujours exactement. Verser la mère dans une fiole déjà pleine ferait déborder la fiole.',
    indice: 'Le volume de la solution fille est celui de la fiole. Quel repère de la fiole permet de l’atteindre exactement ?' },
};
