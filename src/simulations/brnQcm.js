// QCM du parcours guidé de la simulation 188 (fichier séparé pour contrôler par script la longueur des options : la bonne réponse, en tête ici,
// n'est jamais la plus longue ; l'affichage mélange l'ordre des choix). Chaque question a son explication ciblée dans TransfertsH.jsx.
export const QCM_PARCOURS = {
  role: { options: ['un acide : le couple s’écrit HCOOH / HCOO⁻', 'une base : le couple HCOO⁻ / HCOOH', 'un acide : le couple s’écrit HCOO⁻ / HCOOH (base d’abord)', 'une base : le couple s’écrit HCOOH / HCOO⁻ (acide d’abord)'], bonne: 0 },
  demi: { options: ['CH₃COOH → CH₃COO⁻ + H⁺', 'CH₃COOH → CH₃COO + H⁺', 'CH₃COOH → CH₃COO⁻ + H', 'CH₃COOH → CH₃COO⁻ + 2 H⁺'], bonne: 0 },
  ou: { options: ['celui lié à l’oxygène, dans la liaison O–H du groupe carboxyle –COOH', 'l’un des trois liés au carbone du groupe –CH₃, dans une liaison C–H', 'n’importe lequel des quatre : ils sont tous équivalents dans la molécule', 'aucun : un atome d’hydrogène ne peut jamais se détacher d’une molécule'], bonne: 0 },
  doublet: { options: ['il a 7 électrons, un de plus que O seul (6) : charge −1', 'il a 7 électrons, un de plus que O seul : charge +1', 'il a 8 électrons (octet) : donc charge 0, comme dans l’acide', 'il a 5 électrons, un de moins que O seul (6) : charge +1'], bonne: 0 },
  amine: { options: ['l’atome d’azote N, grâce à son doublet non liant', 'un atome d’hydrogène du groupe –NH₂, qui possède un doublet non liant', 'l’atome de carbone, lié à quatre atomes', 'aucun atome : la molécule est neutre'], bonne: 0 },
  azote: { options: ['quatre liaisons et aucun doublet non liant : il lui manque un électron', 'la charge + du H⁺ reste portée par l’atome d’hydrogène qui vient d’arriver', 'il a perdu un atome d’hydrogène en captant H⁺', 'le carbone voisin lui a cédé sa charge positive'], bonne: 0 },
  equation: { options: ['CH₃COOH + NH₃ → CH₃COO⁻ + NH₄⁺', 'CH₃COOH + NH₃ → CH₃COO⁻ + NH₄', 'CH₃COOH + NH₃ → CH₃COOH₂⁺ + NH₂⁻', 'CH₃COO⁻ + NH₄⁺ → CH₃COOH + NH₃'], bonne: 0 },
  eau: { options: ['CH₃NH₂ + H₂O → CH₃NH₃⁺ + HO⁻ : l’eau est l’acide', 'CH₃NH₂ + H₂O → CH₃NH₃⁺ + HO⁻ : l’eau est la base', 'CH₃NH₂ + H₂O → CH₃NH₃⁺ + H₃O⁺ : l’eau est la base', 'CH₃NH₂ + H₂O → CH₃NH₃ + HO : l’eau est l’acide'], bonne: 0 },
  amphotere: { options: ['HCO₃⁻', 'CO₃²⁻', 'CH₃COO⁻', 'HO⁻'], bonne: 0 },
};
