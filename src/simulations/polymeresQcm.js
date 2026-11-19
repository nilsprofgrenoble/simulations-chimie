// QCM du parcours guidé de la simulation 173 (fichier séparé : la longueur des options se contrôle par script, voir polymeresTirages.test.mjs).
// La bonne réponse est en tête ici ; l'ordre affiché est mélangé par CarteParcours. Les textes passent par avecIndices (aucun « _ » brut).
export const QCM_PARCOURS = {
  ester: { options: ['l’oxygène simple est lié à un carbone, et non à un hydrogène', 'l’ester a un atome d’oxygène de plus que l’acide', 'le C=O de l’ester est lié à deux carbones', 'la chaîne carbonée de l’ester est ramifiée, pas celle de l’acide'], bonne: 0 },
  nomEster: { options: ['éthanoate de propyle', 'propanoate d’éthyle', 'méthanoate de propyle', 'propanoate de propyle'], bonne: 0 },
  classe: { options: ['secondaire : deux carbones sont liés à l’azote', 'primaire : un seul carbone est lié à l’azote', 'tertiaire : trois atomes de carbone sont liés à l’azote', 'primaire : l’azote porte deux atomes d’hydrogène'], bonne: 0 },
  nomAmine: { options: ['N-méthyléthanamine', 'N-éthylméthanamine', 'propan-1-amine', 'N,N-diméthyléthanamine'], bonne: 0 },
  amide: { options: ['amide : un C=O est directement lié à l’azote', 'amine : la molécule contient un atome d’azote', 'ester : le C=O est lié à un atome d’oxygène', 'acide carboxylique : le C=O porte un groupe OH'], bonne: 0 },
  nomAmide: { options: ['N-méthyléthanamide', 'N-éthylméthanamide', 'N-méthyléthanamine', 'N,N-diméthyléthanamide'], bonne: 0 },
  halogeno: { options: ['2-chloropropane', '1-chloropropane', 'chloropropane', 'chloro-2-propane'], bonne: 0 },
  formule: { options: ['CH₃–CH₂–CH₂–CO–O–CH₃', 'CH₃–CO–O–CH₂–CH₂–CH₂–CH₃', 'CH₃–CH₂–CH₂–CH₂–CO–O–CH₃', 'CH₃–CH₂–CH₂–O–CO–CH₃'], bonne: 0 },
  motif: { options: ['le groupe –CH₂–CHCl–', 'le groupe –CH₂–CHCl–CH₂–', 'le seul atome –CHCl–', 'le groupe –CHCl–CHCl–'], bonne: 0 },
  naturel: { options: ['la cellulose, présente dans le coton', 'le polyéthylène des sacs plastiques', 'le polystyrène des pots de yaourt', 'le nylon, utilisé pour les cordages et les textiles'], bonne: 0 },
};
