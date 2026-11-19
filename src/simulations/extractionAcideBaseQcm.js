// QCM du parcours guidé de la simulation 143 (extraction acide-base, TSTL). `bonne` = indice de la bonne option (le cadre les mélange à l'affichage).
// Fichier à part pour contrôler par script que la bonne réponse n'est jamais la plus longue.
export const QCM = {
  ionique: {
    options: ['elle reste dans l’eau : un ion est bien soluble dans l’eau', 'elle passe dans le solvant organique : elle contient les mêmes atomes que HA', 'elle se répartit comme HA, avec le même coefficient de partage K', 'elle disparaît : A⁻ ne peut exister que dans le solvant organique'],
    bonne: 0 },
  neutre: {
    options: ['HA, dans le solvant organique : pH < pKa', 'A⁻, dans l’eau : le pH est inférieur à 7, donc la base prédomine', 'HA, dans l’eau : une molécule d’acide reste toujours dissoute dans l’eau', 'A⁻, dans le solvant organique : les ions s’y dissolvent mieux'],
    bonne: 0 },
  choixpH: {
    options: ['pH 2 : bien inférieur au pKa, HA prédomine', 'pH 7 : milieu neutre, ni acide ni basique, pour ne pas dégrader l’acide', 'pH 12 : A⁻ prédomine et il est très soluble dans l’organique', 'pH 4,2 : égal au pKa, toute la quantité est alors sous forme HA'],
    bonne: 0 },
  base: {
    options: ['pH 10 : bien supérieur au pKa, B (forme neutre) prédomine', 'pH 1 : bien inférieur au pKa, comme pour un acide, donc B prédomine', 'pH 4,6 : égal au pKa, toute la quantité est alors sous forme B', 'pH 2 : en milieu acide, la base est neutralisée et passe dans l’organique'],
    bonne: 0 },
  separation: {
    options: ['B et N : seul l’acide passe dans l’eau, sous forme A⁻', 'N seul : l’acide et la base passent tous deux dans l’eau', 'HA et N : la base est ionisée à pH 12 et passe dans l’eau', 'les trois : un pH ne change jamais la solubilité d’un composé organique dans l’eau'],
    bonne: 0 },
  recuperer: {
    options: ['on acidifie à pH 2 : A⁻ redevient HA, que l’on extrait', 'on ajoute de la soude : A⁻ devient HA, soluble dans l’organique', 'on dilue avec de l’eau : A⁻ devient HA quand la concentration baisse', 'on ne peut pas : un ion ne peut plus jamais redevenir une molécule'],
    bonne: 0 },
};
