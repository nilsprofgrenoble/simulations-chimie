// QCM du parcours guidé de la simulation 230 (laser, TSTL). `bonne` = indice de la bonne option.
export const QCM = {
  brillant: {
    options: ['son faisceau est très mince : toute la puissance est concentrée sur une toute petite surface', 'son flux est beaucoup plus grand que celui de la lampe, même quand les deux sont annoncés à 4 mW', 'sa lumière est monochromatique, donc elle transporte davantage d’énergie qu’une lumière blanche', 'sa lumière se propage plus vite que celle d’une lampe, donc elle arrive plus fort sur l’œil'],
    bonne: 0 },
  limite: {
    options: ['il dépasse très largement la limite : l’œil ne doit pas y rester exposé longtemps', 'il est sous la limite, car un flux de 4 mW est une puissance très faible pour l’œil', 'il est exactement à la limite, car la limite est en W/m² et le flux est en mW', 'il est sans danger, car un éclairement ne peut pas se comparer à une limite'],
    bonne: 0 },
  reflexe: {
    options: ['non : la durée maximale est bien plus courte que la fermeture de la paupière', 'oui : la paupière se ferme toujours assez vite pour tout faisceau laser visible, même puissant', 'oui : le réflexe dure 0,25 s, donc il bloque entièrement la lumière avant la durée maximale', 'non : ce réflexe n’existe pas pour une lumière qui est monochromatique'],
    bonne: 0 },
  classe: {
    options: ['classe 3R : le flux de 4 mW est compris entre 1 mW et 5 mW', 'classe 2 : le flux de 4 mW est inférieur à 5 mW, donc très peu dangereux', 'classe 3B : un laser de classe 3B émet toujours plus de 4 mW', 'classe 4 : tout laser de plus de 1 mW est de classe 4'],
    bonne: 0 },
  consigne: {
    options: ['ne jamais regarder le faisceau, direct ou réfléchi, et écarter les objets brillants', 'regarder le faisceau une demi-seconde est sans risque, grâce au réflexe de la paupière', 'des lunettes de soleil suffisent à protéger l’œil de tous les lasers connus', 'diriger le faisceau vers le plafond est sans risque, même avec un plafond miroir'],
    bonne: 0 },
};
