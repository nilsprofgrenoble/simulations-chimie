// QCM du parcours guidé de la simulation 234 (Mouillage : tension superficielle, angle de contact, tension critique).
// Ordre FIXE : place de la bonne réponse choisie à la main (équilibrée, jamais deux fois de suite à la même place), jamais la plus longue.
const mk = (pos, bonne, ...autres) => ({ ordreFixe: true, bonne: pos, options: [...autres.slice(0, pos), bonne, ...autres.slice(pos)] });
export const QCM = {
  surface: mk(2, 'Les molécules de surface, attirées vers l’intérieur, tendent à réduire la surface',
    'La pesanteur écrase la goutte vers le bas et la rend toujours sphérique',
    'L’air extérieur exerce une pression plus forte sur le haut de la goutte que sur les côtés',
    'Les molécules du liquide se repoussent entre elles et s’écartent le plus possible'),
  situations: mk(0, 'Mouillage partiel : le liquide mouille plutôt bien le solide',
    'Mouillage total : le liquide s’étale complètement en film mince',
    'Non mouillage : le liquide reste en goutte presque sphérique',
    'Mouillage partiel impossible : seuls θ = 0 ou θ = 180° existent'),
  critere: mk(3, 'Sa tension superficielle est inférieure à la tension critique γc du solide',
    'Sa tension superficielle est supérieure à celle de l’eau pure, soit 72,8 mN/m',
    'Il est plus dense que le solide, donc il s’étale sous son propre poids',
    'Il contient assez de molécules polaires pour former des liaisons hydrogène'),
  zisman: mk(1, 'La tension critique γc : sous cette valeur, un liquide s’étale complètement',
    'La tension superficielle de l’eau, mesurée sur ce solide à 20 °C',
    'L’angle de contact maximal que peut prendre un liquide quelconque sur ce solide',
    'La tension superficielle du solide, mesurée directement à la balance'),
  encre: mk(2, 'Sa tension superficielle dépasse la tension critique du film',
    'Le film de PE est trop lisse pour que l’encre puisse s’y accrocher',
    'L’encre est trop visqueuse : la viscosité fixe l’angle de contact',
    'Le PE est un solide cristallin : aucun liquide ne le mouille jamais'),
  vieillissement: mk(3, 'L’effet du traitement s’atténue : l’énergie de surface diminue',
    'L’encre vieillit et sa tension superficielle augmente toute seule',
    'Le traitement a rendu le film plus lisse, ce qui augmente l’angle',
    'Le film absorbe l’encre, ce qui change sa tension critique'),
};
