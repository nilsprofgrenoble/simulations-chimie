// QCM du parcours guidé de la simulation 142 (CO₂ dissous, TSTL). `bonne` = indice de la bonne option (le cadre les mélange à l'affichage).
// Fichier à part pour contrôler par script que la bonne réponse n'est jamais la plus longue.
export const QCM = {
  pression: {
    options: ['triplée : [CO₂] est proportionnelle à P', 'inchangée : un liquide ne dissout qu’une quantité fixe de gaz', 'multipliée par 9 : la pression intervient au carré dans la loi', 'divisée par 3 : plus de pression chasse le gaz hors du liquide'],
    bonne: 0 },
  temp: {
    options: ['elle diminue : a est plus petit à 35 °C', 'elle augmente : la chaleur aide le gaz à se dissoudre dans l’eau', 'elle ne change pas : seule la pression compte dans la loi de Henry', 'elle devient nulle : tout le gaz s’échappe dès 35 °C'],
    bonne: 0 },
  acide: {
    options: ['inférieur à 7 : le CO₂ dissous libère des ions H₃O⁺', 'égal à 7 : le CO₂ est un gaz, il n’agit pas sur le pH de l’eau', 'supérieur à 7 : le CO₂ forme des ions HCO₃⁻, qui sont basiques', 'impossible à prévoir : il dépend du volume d’eau utilisé'],
    bonne: 0 },
  couples: {
    options: ['à la fois base du couple 1 et acide du couple 2', 'uniquement un acide : il cède un proton pour donner CO₃²⁻, jamais il n’en capte', 'uniquement une base : il capte un proton pour donner CO₂,H₂O, jamais il n’en cède', 'ni acide ni base : c’est un ion spectateur qui ne réagit avec aucun couple'],
    bonne: 0 },
  diagramme: {
    options: ['HCO₃⁻ : le pH est compris entre pKa1 et pKa2', 'CO₂,H₂O : le pH est supérieur à pKa1 donc l’acide du couple prédomine', 'CO₃²⁻ : le pH est supérieur à 7, donc la base la plus forte prédomine', 'aucune : à pH 8,0 les trois espèces ont des concentrations égales'],
    bonne: 0 },
  degaz: {
    options: ['il augmente : moins de CO₂ dissous, donc moins d’ions H₃O⁺', 'il diminue : le gaz qui s’échappe emporte les ions HO⁻ de l’eau', 'il ne change pas : le pH ne dépend que du pKa, pas du CO₂ dissous', 'il devient exactement 7 : l’eau n’a plus de CO₂, elle redevient pure'],
    bonne: 0 },
  basique: {
    options: ['pH 10 : le CO₂ y est transformé en HCO₃⁻ et CO₃²⁻', 'pH 3 : un milieu acide favorise la dissolution du CO₂, gaz acide', 'pH 6 : près de la neutralité, l’eau dissout le mieux les gaz', 'aucun : [CO₂] est fixée par P, donc le total est le même partout'],
    bonne: 0 },
};
