// QCM du parcours guidé de la simulation 132 (fichier séparé pour contrôler par script la longueur des options :
// la bonne réponse, écrite en tête ici, n'est jamais la plus longue ; l'ordre affiché est mélangé par CarteParcours).
export const QCM_PARCOURS = {
  contact: { options: [
    'le zinc cède des électrons aux ions Cu²⁺ : du cuivre se dépose',
    'les ions Cu²⁺ cèdent des électrons au zinc, qui se recouvre de Zn',
    'le zinc se dissout simplement, sans aucun échange d’électrons',
    'la lame de zinc rouille au contact de l’eau de la solution bleue'], bonne: 0 },
  separer: { options: [
    'pour obliger les électrons à passer par le circuit extérieur',
    'pour empêcher toute réaction entre le zinc et les ions cuivre',
    'pour que les deux solutions gardent la même concentration',
    'pour que le voltmètre mesure la tension de chaque bécher seul'], bonne: 0 },
  pont: { options: [
    'il ferme le circuit : des ions s’y déplacent, pas des électrons',
    'il transporte les électrons d’un bécher à l’autre, par la solution',
    'il fournit l’énergie de la pile grâce aux ions K⁺ et NO₃⁻ qu’il contient',
    'il mélange lentement les deux solutions pour qu’elles réagissent'], bonne: 0 },
  polarite: { options: ['la lame de cuivre', 'la lame de zinc', 'le pont salin', 'cela dépend du branchement'], bonne: 0 },
  sens: { options: [
    'sens direct : le zinc est oxydé et les ions Cu²⁺ sont réduits',
    'sens inverse : le cuivre est oxydé et les ions Zn²⁺ sont réduits',
    'aucun : Q_r,i = 1, le système est déjà à l’équilibre chimique',
    'aucun : une pile n’évolue que si on la relie à un générateur'], bonne: 0 },
  electrodes: { options: [
    'Zn → Zn²⁺ + 2 e⁻ : une oxydation',
    'Zn²⁺ + 2 e⁻ → Zn : une réduction',
    'Cu²⁺ + 2 e⁻ → Cu : une réduction',
    'Cu → Cu²⁺ + 2 e⁻ : une oxydation'], bonne: 0 },
  ions: { options: [
    'les ions NO₃⁻ vont vers le bécher du zinc, les ions K⁺ vers celui du cuivre',
    'les ions K⁺ vont vers le bécher du zinc, les ions NO₃⁻ vers celui du cuivre',
    'les électrons traversent le pont salin du bécher du zinc vers celui du cuivre',
    'aucun ion ne bouge : le pont salin sert seulement à séparer les deux béchers'], bonne: 0 },
  usure: { options: [
    'les ions Cu²⁺ sont épuisés : Q_r a atteint K',
    'la lame de zinc est entièrement consommée par la réaction',
    'le pont salin s’est vidé de tous ses ions K⁺ et NO₃⁻',
    'les électrons de la lame de cuivre sont tous partis'], bonne: 0 },
};
