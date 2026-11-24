// QCM du parcours guidé de la simulation 220 (charge d'un tensioactif selon le pH). La bonne réponse est en premier ; l'ordre est mélangé à l'affichage.
// Les propositions ont des longueurs voisines (la bonne n'est jamais la plus longue : contrôlé par script dans le test du modèle).
export const QCM = {
  sds: { bonne: 0, options: [
    'Le groupe sulfate vient d’un acide très fort : il ne capte pas H⁺',
    'Les ions Na⁺ voisins protègent la tête et bloquent les ions H⁺',
    'La longue chaîne carbonée empêche H⁺ d’atteindre la tête',
    'Les ions H⁺ ajoutent des charges + qui compensent la charge −'] },
  ctab: { bonne: 0, options: [
    'L’azote n’a aucun H à perdre : il ne réagit pas avec HO⁻',
    'La longue chaîne carbonée empêche HO⁻ d’approcher la tête',
    'Les ions bromure Br⁻ compensent la charge en milieu basique',
    'Les ions HO⁻ sont trop peu nombreux pour agir sur la tête'] },
  savon: { bonne: 0, options: [
    'Elle capte H⁺ et devient COOH : neutre, sans aucune charge',
    'Elle capte H⁺ et passe d’une charge − à une charge +',
    'Elle reste chargée − : le pH ne change rien à sa tête',
    'Elle porte à la fois une charge − et une charge +'] },
  ioniques: { bonne: 0, options: [
    'Non : chacun ne porte qu’une sorte de charge, parfois nulle',
    'Oui : le savon porte les deux charges autour de son pKa',
    'Oui : l’amine porte les deux charges en milieu très basique',
    'Oui : le SDS porte les deux charges en milieu très acide'] },
  betaine: { bonne: 0, options: [
    'Non : sa tête porte une charge + et une charge − qui se compensent',
    'Oui : une charge nette nulle veut dire une tête sans aucune charge',
    'Oui : à pH 7 ses deux groupes sont neutres, comme un non ionique',
    'Non : sa tête porte deux charges − compensées par les ions Na⁺'] },
  betaineAcide: { bonne: 0, options: [
    'Elle est + en milieu très acide, puis nulle : jamais −',
    'Elle est + en milieu acide, nulle au milieu, − en milieu basique',
    'Elle reste égale à zéro sur toute l’échelle de pH',
    'Elle est − en milieu très acide, puis + en milieu basique'] },
  alanine: { bonne: 0, options: [
    '+ en milieu acide, nulle au milieu, puis − en milieu basique',
    'Toujours −, comme un tensioactif anionique ordinaire',
    '+ en milieu acide puis nulle, comme la bétaïne',
    '− en milieu acide, nulle au milieu, puis + en milieu basique'] },
  distinguer: { bonne: 0, options: [
    'B : les deux courbes sont non nulles en même temps',
    'A : la courbe rouge monte quand le pH augmente',
    'C : la courbe bleue baisse quand le pH augmente',
    'Aucun : une courbe ne suffit pas pour le dire'] },
  nonionique: { bonne: 0, options: [
    'Sa tête forme des liaisons hydrogène avec l’eau (groupes O et OH)',
    'Sa tête forme des liaisons ioniques avec les ions de l’eau',
    'Sa chaîne carbonée est attirée par les molécules d’eau',
    'Elle se charge dès que l’eau est un peu acide ou basique'] },
  melange: { bonne: 0, options: [
    'Un anionique avec un cationique, qui forment un sel peu soluble',
    'Un anionique avec un non ionique, qui n’ont aucune charge opposée',
    'Un cationique avec un non ionique, qui n’ont aucune charge opposée',
    'Un anionique avec un amphotère, dont la charge nette est nulle'] },
  emulsion: { bonne: 0, options: [
    'Choisir un tensioactif qui garde son action à pH 5',
    'Ajouter davantage de savon pour compenser les têtes neutres',
    'Acidifier encore : les gouttes se repousseront davantage',
    'Chauffer la crème pour que la charge des têtes revienne'] },
};
