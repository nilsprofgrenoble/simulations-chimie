// QCM du parcours guidé de la simulation 232 (effet Joule, TSTL). `bonne` = indice de la bonne option.
export const QCM = {
  conversion: {
    options: ['elle est convertie en énergie thermique : le résistor s’échauffe', 'elle est stockée sous forme chimique à l’intérieur du résistor, comme dans une batterie', 'elle est convertie en énergie cinétique du résistor entier', 'elle disparaît, car un résistor ne stocke ni ne transforme aucune énergie'],
    bonne: 0 },
  thermique: {
    options: ['toute l’énergie électrique reçue : la conversion est intégrale', 'la moitié seulement, l’autre moitié restant stockée dans le résistor lui-même', 'aucune, car un résistor ne chauffe que s’il est relié à une source de chaleur', 'plus que l’énergie électrique reçue, grâce à l’effet'],
    bonne: 0 },
  double: {
    options: ['elle est multipliée par 4, car P = R × I² dépend du carré de I', 'elle est multipliée par 2, car P est proportionnelle à I', 'elle ne change pas, car la résistance R du résistor reste la même', 'elle est multipliée par 8, car l’énergie thermique dépend du cube de I'],
    bonne: 0 },
  tension: {
    options: ['elle est multipliée par 4 : I double, donc P = R × I² quadruple', 'elle est multipliée par 2, car la tension U est doublée', 'elle est divisée par 2, car l’intensité diminue quand la tension augmente', 'elle ne change pas, car la résistance R est constante'],
    bonne: 0 },
  ligne: {
    options: ['une tension plus élevée : I = P ÷ U diminue, donc les pertes r × I² baissent', 'une tension plus faible, car le courant circule plus facilement dans le câble', 'aucune : seules la longueur et la nature du câble comptent pour les pertes', 'une tension plus élevée, car la puissance dissipée par le câble augmente avec U'],
    bonne: 0 },
  utile: {
    options: ['une plaque de cuisson électrique, faite pour chauffer', 'un câble d’alimentation qui chauffe quand il conduit', 'un moteur dont le bobinage chauffe en fonctionnant', 'un ordinateur dont les composants chauffent pendant le fonctionnement'],
    bonne: 0 },
};
