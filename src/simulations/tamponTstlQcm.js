// QCM du parcours guidé de la simulation 140 (solution tampon, TSTL). `bonne` = indice de la bonne option (le cadre les mélange à l'affichage).
// Fichier à part pour contrôler par script que la bonne réponse n'est jamais la plus longue.
export const QCM = {
  melange: {
    options: ['égal au pKa : pH = 4,9', 'égal à 7,0, car il y a autant d’acide que de base', 'inférieur à 4,9, car le mélange contient un acide', 'supérieur à 4,9, car la base est ajoutée sous forme de sel'],
    bonne: 0 },
  reaction: {
    options: ['la base C₂H₅COO⁻ : H₃O⁺ + C₂H₅COO⁻ → C₂H₅COOH + H₂O', 'l’acide C₂H₅COOH, qui capte H₃O⁺ pour donner la base C₂H₅COO⁻', 'aucune : les ions H₃O⁺ restent tous libres dans la solution', 'l’eau uniquement, qui se transforme en ions HO⁻ en excès'],
    bonne: 0 },
  base: {
    options: ['il augmente légèrement : AH consomme HO⁻ et forme A⁻', 'il augmente fortement, comme celui de l’eau pure qui reçoit la même base', 'il diminue légèrement : A⁻ consomme les ions HO⁻ ajoutés', 'il ne change pas du tout : il reste exactement égal à 4,9'],
    bonne: 0 },
  dilution: {
    options: ['il reste voisin de 4,9 : le rapport des quantités est inchangé', 'il est divisé par 10, comme la concentration du tampon', 'il augmente d’environ 1 unité, car le tampon est dix fois moins concentré', 'il tend vers 7, le pH de l’eau pure qui a servi à diluer'],
    bonne: 0 },
  limite: {
    options: ['la base est épuisée : H₃O⁺ en excès, le pH chute', 'le pH ne varie que de 0,2 unité, comme pour un petit ajout', 'l’acide AH est consommé en premier et le pH augmente fortement', 'le tampon devient plus efficace, car il contient plus d’acide'],
    bonne: 0 },
  equimol: {
    options: ['équimolaire : autant d’acide que de base', 'avec beaucoup plus de base A⁻ que d’acide AH', 'avec beaucoup plus d’acide AH que de base A⁻', 'avec uniquement de la base A⁻, sans acide AH'],
    bonne: 0 },
  choix: {
    options: ['HClO / ClO⁻ : son pKa de 7,5 est proche de 7,8', 'C₂H₅COOH / C₂H₅COO⁻ : le pKa de 4,9 est le plus bas', 'C₆H₅OH / C₆H₅O⁻ : son pKa de 10,0 est le plus élevé', 'C₆H₅COOH / C₆H₅COO⁻ : le pKa de 4,2 est le plus acide'],
    bonne: 0 },
};
