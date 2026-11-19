// QCM du parcours guidé de la simulation « Schéma de Lewis » (sim 154). Fichier sans React : la longueur des options est contrôlée par un script
// (la bonne réponse n'est jamais la plus longue ni la plus courte). bonne : indice de la bonne réponse dans options.
// Toutes les options suivent le même patron : « constat : justification ».
export const QCM = {
  liaisons: {
    q: 'Un atome d’oxygène possède 6 électrons de valence. Pour avoir 8 électrons autour de lui, combien de liaisons covalentes simples peut-il former ?',
    options: ['deux liaisons : il lui manque deux électrons pour en avoir huit', 'six liaisons : il met en commun ses six électrons de valence', 'quatre liaisons : l’octet est formé de quatre doublets d’électrons', 'une seule liaison : un atome ne partage jamais plus d’un électron'], bonne: 0,
    expl: 'Chaque liaison covalente est un doublet partagé : pour l’atome, elle compte comme un électron de plus autour de lui. Il manque 8 − 6 = 2 électrons à l’oxygène, donc deux liaisons. Même raisonnement pour les autres atomes : H en forme 1 (duet : 2 − 1), N en forme 3 (8 − 5), C en forme 4 (8 − 4).',
    indice: 'Combien d’électrons manque-t-il à l’oxygène pour en avoir 8 autour de lui ? Chaque liaison covalente lui en apporte un.' },
  bilan: {
    q: 'Le schéma ci-contre, proposé pour l’ion ammonium NH₄⁺, comporte une erreur. Laquelle ?',
    options: ['la charge + est oubliée : N a un électron de moins que l’atome N seul', 'il manque un doublet non liant : N n’a que quatre électrons autour de lui', 'une liaison est en trop : l’ion ne devrait avoir que trois liaisons', 'la charge devrait être − : l’ion a gagné un électron supplémentaire'], bonne: 0,
    expl: 'N est lié par 4 liaisons : il possède 4 électrons (un par liaison), alors que l’atome N seul en a 5 : il en a un de moins, donc il porte la charge +. Autour de N, il y a bien 4 × 2 = 8 électrons : l’octet est respecté, il n’y a pas de doublet non liant à ajouter. Avec 3 liaisons et un doublet non liant, ce serait NH₃.',
    indice: 'Compare les électrons de valence de l’atome N seul à ceux qu’il possède dans l’ion : un par liaison, deux par doublet non liant.' },
};
