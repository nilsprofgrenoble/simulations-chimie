// QCM du parcours guidé de la simulation 257 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici, n'est ni la plus longue ni la plus courte).
export const QCM_PARCOURS = {
  pourquoi: { options: [
    'les ions présents changent : certains disparaissent, d’autres arrivent',
    'la solution se dilue tellement que la conductivité finit par s’annuler',
    'le titrant est un liquide qui ne conduit pas du tout le courant électrique',
    'les molécules d’eau formées par la réaction conduisent bien le courant'], bonne: 0 },
  spectateur: { options: [
    'Cl⁻ : il ne participe pas à la réaction, il reste dans la solution',
    'H₃O⁺ : il ne réagit pas avec les ions hydroxyde versés par la burette',
    'Cl⁻ et H₃O⁺ : tous les ions de départ réagissent avec la soude versée',
    'aucun : tous les ions finissent par réagir avec le titrant versé'], bonne: 0 },
  allure: { options: [
    'σ baisse jusqu’à l’équivalence, puis remonte : un minimum, courbe en V',
    'σ augmente jusqu’à l’équivalence, puis baisse : maximum à l’équivalence',
    'σ reste constante jusqu’à l’équivalence, puis augmente seulement après',
    'σ baisse sans cesse, car les ions disparaissent à chaque ajout de soude'], bonne: 0 },
  faible: { options: [
    'elle augmente peu : des ions apparaissent, mais leurs λ sont faibles',
    'elle diminue comme pour un acide fort, car l’acide disparaît',
    'elle reste nulle : l’acide faible ne forme jamais d’ions',
    'elle augmente fortement, comme après l’équivalence, dès le premier ajout'], bonne: 0 },
  inverse: { options: [
    'elle baisse avant l’équivalence (HO⁻ remplacé par Cl⁻), puis monte vite',
    'elle augmente avant l’équivalence, puis baisse quand H₃O⁺ est en excès',
    'elle monte avant l’équivalence comme pour un acide, puis reste constante',
    'elle reste constante avant l’équivalence, puis baisse quand H₃O⁺ est en excès'], bonne: 0 },
  precip: { options: [
    'elle reste presque constante : NO₃⁻ remplace Cl⁻ avec un λ voisin',
    'elle baisse nettement, car les ions Cl⁻ disparaissent à chaque ajout',
    'elle monte nettement, car les ions Ag⁺ s’accumulent dès le début',
    'elle est nulle, puisque le précipité retire tous les ions de la solution'], bonne: 0 },
  comparer: { options: [
    'après : H₃O⁺ en excès (λ très grand) s’ajoute avec Cl⁻ aux ions déjà là',
    'avant : les ions NH₄⁺ formés ont un λ plus grand que celui de H₃O⁺',
    'les deux pentes sont égales, car on verse le même acide dans les deux cas',
    'avant : l’ammoniac est une molécule et il conduit mieux le courant'], bonne: 0 },
};
