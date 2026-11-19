// QCM du parcours guidé de la simulation 158 « Savons et amphiphilie ». Fichier sans React : la longueur des options est
// contrôlée par un script (la bonne réponse n'est jamais la plus longue). Toutes les options suivent le patron
// « constat : justification » ; les mauvaises réponses sont de vraies erreurs d'élèves (densité confondue avec polarité,
// liaison C–H jugée polaire, ion « sans sodium », bicouche prise pour une micelle…).
// bonne : indice de la bonne réponse dans options (l'ordre d'affichage est mélangé par la carte du parcours).
export const QCM = {
  constat: {
    q: 'Pourquoi l’huile et l’eau ne se mélangent-elles pas ?',
    options: ['l’huile est visqueuse : ses molécules ne peuvent pas circuler dans l’eau', 'l’huile est apolaire, l’eau est polaire : elles ne s’attirent pas assez', 'l’huile est moins dense : elle flotte donc ne peut pas s’y mélanger', 'l’huile est polaire et l’eau est apolaire : leurs molécules se repoussent'], bonne: 1,
    expl: 'Les liaisons C–C et C–H des molécules d’huile sont apolaires, alors que l’eau est polaire : les molécules d’eau s’attirent entre elles bien plus qu’elles n’attirent l’huile. La faible densité de l’huile explique seulement qu’elle flotte, pas qu’elle ne se mélange pas.',
    indice: 'Pense à la règle « qui se ressemble s’assemble » : compare la polarité des molécules d’eau et celle des molécules d’huile.' },
  polaire: {
    q: 'Dans l’ion stéarate CH₃–(CH₂)₁₆–COO⁻, quelle partie attire les molécules d’eau ?',
    options: ['la chaîne CH₃–(CH₂)₁₆ : les liaisons C–H sont assez polarisées', 'le groupe COO⁻ : il porte une charge, donc il est bien polaire', 'les deux parties : tous les atomes d’un ion sont polaires', 'la chaîne CH₃–(CH₂)₁₆ : plus elle est longue, plus elle attire l’eau'], bonne: 1,
    expl: 'Le groupe COO⁻ est chargé : il est polaire et attire les molécules d’eau. Dans la chaîne, la liaison C–H n’est pas polarisée (écart d’électronégativité 2,55 − 2,20 = 0,35, inférieur à 0,4) et la liaison C–C relie deux atomes identiques : la chaîne est apolaire.',
    indice: 'Une liaison est polarisée quand l’écart d’électronégativité est assez grand (plus de 0,4). Compare C et H : χ(C) = 2,55 ; χ(H) = 2,20. Une charge, elle, attire l’eau.' },
  courte: {
    q: 'L’ion éthanoate CH₃–COO⁻ a la même tête que l’ion stéarate, mais n’est pas un savon. Pourquoi ?',
    options: ['sa chaîne est trop courte : un seul carbone ne rend pas l’ion lipophile', 'sa tête COO⁻ n’est pas chargée : elle n’attire donc pas les molécules d’eau', 'il ne contient pas de sodium Na⁺ : un savon doit être un sel de sodium', 'sa chaîne est polaire : elle repousse les graisses autant que l’eau'], bonne: 0,
    expl: 'La tête COO⁻ de l’ion éthanoate est bien chargée et attire l’eau, mais sa chaîne ne compte qu’un atome de carbone : trop courte pour être lipophile. L’ion est entièrement hydrophile, donc pas amphiphile. Le contre-ion (Na⁺ ou K⁺) ne joue aucun rôle dans le lavage.',
    indice: 'Pour être amphiphile, il faut une tête polaire ET une partie lipophile : compte les atomes de carbone de la chaîne de l’ion éthanoate.' },
  micelle: {
    q: 'Dans l’eau, les ions carboxylate s’assemblent en micelles. Comment sont-ils placés ?',
    options: ['têtes COO⁻ vers l’extérieur, en contact avec l’eau ; chaînes au centre', 'chaînes vers l’extérieur, au contact de l’eau ; têtes COO⁻ au centre', 'têtes d’un côté, chaînes de l’autre, en deux couches plates face à face', 'ions alignés en file, chaque tête collée à la chaîne de l’ion suivant'], bonne: 0,
    expl: 'Les têtes polaires restent au contact de l’eau et les chaînes apolaires se regroupent au centre, à l’abri de l’eau : la micelle est à peu près sphérique. Une micelle n’est pas une goutte d’eau entourée de savon : l’eau est à l’extérieur.',
    indice: 'Quelle partie de l’ion peut rester au contact de l’eau, et laquelle doit s’en protéger ?' },
  insertion: {
    q: 'Une goutte d’huile apolaire est entourée d’ions carboxylate. Quelle partie des ions pénètre dans l’huile ?',
    options: ['le groupe COO⁻ polaire : il est attiré par les molécules d’huile', 'l’ion entier : il se dissout dans l’huile comme dans l’eau', 'la chaîne carbonée apolaire : elle est compatible avec l’huile', 'aucune partie : les ions ne peuvent pas toucher la goutte d’huile'], bonne: 2,
    expl: 'La chaîne carbonée est apolaire, comme l’huile : elle s’y insère. Le groupe COO⁻, polaire, reste côté eau : la goutte se retrouve entourée de têtes hydrophiles.',
    indice: 'Applique « qui se ressemble s’assemble » à la chaîne apolaire puis au groupe polaire COO⁻.' },
  rincage: {
    q: 'L’huile est piégée dans une micelle. Pourquoi est-elle emportée par l’eau de rinçage ?',
    options: ['la micelle est entourée de chaînes apolaires : elle glisse sur l’eau', 'la micelle est entourée de têtes polaires : elle se disperse dans l’eau', 'la micelle est trop lourde : elle coule et l’eau l’entraîne vers l’évier', 'l’huile se dissout seule dans l’eau de rinçage : le savon est inutile'], bonne: 1,
    expl: 'La surface de la micelle est couverte de têtes COO⁻, qui attirent l’eau : la micelle reste dispersée dans l’eau et part avec elle. L’huile, elle, n’est pas détruite ni dissoute : elle est emportée à l’intérieur de la micelle.',
    indice: 'Regarde ce que la micelle présente à l’eau : ses têtes ou ses chaînes ? Et que fait l’eau avec ce qu’elle attire ?' },
  applications: {
    q: 'Pour une mayonnaise, on disperse de fines gouttes d’huile dans l’eau. Quel ingrédient joue le rôle de tensioactif ?',
    options: ['le jaune d’œuf : sa lécithine est une espèce amphiphile', 'le vinaigre : son acide rend l’huile soluble dans l’eau', 'le sel : ses ions attirent les gouttes d’huile vers l’eau', 'l’huile elle-même : ses molécules sont amphiphiles'], bonne: 0,
    expl: 'La lécithine du jaune d’œuf possède une partie polaire et une partie apolaire : elle entoure les gouttes d’huile et les maintient dispersées dans l’eau (émulsion). Le vinaigre et le sel sont des espèces hydrophiles ; l’huile est lipophile.',
    indice: 'Un tensioactif est une espèce amphiphile : laquelle de ces espèces a une partie polaire et une partie apolaire ?' },
  bilan: {
    q: 'Parmi ces entités, laquelle est amphiphile ?',
    options: ['CH₃–(CH₂)₁₀–CH₃ : une longue chaîne apolaire, mais rien de polaire', 'CH₃–CH₂–OH : une tête polaire, mais une chaîne de deux carbones', 'Na⁺ et Cl⁻ : deux ions entourés d’eau, sans aucune chaîne carbonée', 'CH₃–(CH₂)₁₀–COO⁻ : une longue chaîne apolaire et une tête chargée'], bonne: 3,
    expl: 'Seule l’entité CH₃–(CH₂)₁₀–COO⁻ (ion laurate) a deux parties aux propriétés opposées : une chaîne de 11 carbones, apolaire et lipophile, et une tête COO⁻, polaire et hydrophile. Le dodécane est lipophile, l’éthanol et les ions Na⁺ et Cl⁻ sont hydrophiles.',
    indice: 'Cherche l’entité qui possède à la fois une partie polaire et une longue chaîne carbonée apolaire.' },
};
