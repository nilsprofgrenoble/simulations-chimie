// QCM du parcours guidé de la sim 155. Toutes les options d'une question suivent le même patron « réponse : justification » ;
// la bonne réponse (index 0 dans le tableau, mélangée à l'affichage) n'est ni la plus longue ni la plus courte (vérifié par geometrieQcm.test.mjs).
// Les distracteurs sont des erreurs réelles d'élèves : doublets non liants ignorés, forme confondue avec l'arrangement des doublets,
// liaison double comptée pour deux X, polarité de la liaison confondue avec polarité de la molécule.
export const QCM = {
  d2: {
    q: 'Deux doublets se repoussent autour de l’atome A. Quel angle forment finalement leurs directions ?',
    options: ['180° : ils se placent face à face, de chaque côté de A, alignés', '90° : ils se placent à angle droit, comme les axes d’un repère', '120° : ils se répartissent régulièrement tout autour de l’atome A', '109,5° : ils prennent l’angle d’un tétraèdre régulier autour de A'], bonne: 0,
    expl: 'Deux doublets se repoussent le plus loin possible : ils se placent de part et d’autre de A, à 180°. On parle d’arrangement digonal.',
    indice: 'Pensez à deux aimants de même pôle posés de part et d’autre d’un point : où s’arrêtent-ils ? Vous pouvez aussi lancer la répulsion avec le bouton sous le schéma.' },
  d4: {
    q: 'Quatre doublets se repoussent autour de A, dans l’espace. Ils se disposent…',
    options: ['aux sommets d’un tétraèdre : 109,5° entre deux doublets voisins', 'en croix, dans un même plan : 90° entre deux doublets voisins', 'en étoile, dans un même plan, avec 120° entre deux doublets voisins'], bonne: 0,
    expl: 'En trois dimensions, quatre doublets s’écartent au maximum en formant un tétraèdre régulier : 109,5° entre deux doublets. Dans un plan, on ne pourrait pas les éloigner autant (90° au mieux). On parle d’arrangement tétragonal.',
    indice: 'Choisissez 4 doublets dans le menu, lancez la répulsion, puis tournez le modèle : sont-ils tous dans un même plan ?' },
  axe: {
    q: 'Quelle est la notation AXₙEₘ de la molécule d’eau (atome central O) ?',
    options: ['AX₂E₂', 'AX₂E₀', 'AX₄E₀', 'AX₂E₁'], bonne: 0,
    expl: 'Deux atomes H sont liés à O (n = 2) et O porte deux doublets non liants (m = 2) : AX₂E₂. Il y a n + m = 4 doublets autour de O.',
    indice: 'n est le nombre d’atomes liés à O (les traits entre atomes), m le nombre de doublets non liants de O (les petits traits placés sur O).' },
  eau: {
    q: 'Quelle est la forme de la molécule H₂O (celle que dessinent les trois atomes) ?',
    options: ['coudée : seuls deux des quatre sommets du tétraèdre portent un atome H', 'linéaire : H–O–H s’écrit en ligne, donc les trois atomes sont alignés', 'tétraédrique : les doublets forment un tétraèdre, donc la molécule aussi'], bonne: 0,
    expl: 'Les 4 doublets de O pointent vers les sommets d’un tétraèdre, mais seuls 2 sont occupés par un atome H. La forme de la molécule est celle des atomes : O et les deux H forment un V, la molécule est coudée (angle H–O–H d’environ 105°).',
    indice: 'Les doublets violets ne sont pas des atomes : imaginez la molécule sans eux et regardez seulement les 3 atomes H, O, H.' },
  nh3: {
    q: 'Quelle est la forme de la molécule d’ammoniac NH₃ (atome central N) ?',
    options: ['pyramidale : AX₃E₁, les trois H forment la base d’une pyramide', 'trigonale plane : AX₃, il n’y a que 3 atomes H autour de l’atome N', 'tétraédrique : AX₃E₁ donne 4 doublets, donc 4 sommets occupés'], bonne: 0,
    expl: 'NH₃ est de type AX₃E₁ : 4 doublets en tétraèdre autour de N, dont un seul non liant. Les 3 atomes H et l’atome N forment une pyramide à base triangulaire : la molécule est pyramidale (angle H–N–H d’environ 107°).',
    indice: 'Comptez n (atomes H liés à N) et m (doublets non liants de N). Puis imaginez le tétraèdre des doublets et regardez les sommets occupés par un atome.' },
  co2: {
    q: 'Quelle est la forme de la molécule de dioxyde de carbone CO₂ (atome central C) ?',
    options: ['linéaire : AX₂E₀, le carbone ne porte aucun doublet non liant', 'coudée : AX₂, comme l’eau, les deux atomes O forment un V', 'tétraédrique : AX₄E₀, une liaison double compte pour deux doublets'], bonne: 0,
    expl: 'Chaque liaison C=O ne définit qu’une direction autour de C : n = 2. C ne porte aucun doublet non liant (m = 0). CO₂ est de type AX₂E₀ : arrangement digonal, molécule linéaire (angle O–C–O de 180°). Contrairement à l’eau, il n’y a aucun doublet non liant sur l’atome central.',
    indice: 'Sur le schéma, comptez les atomes liés à C (n) et les doublets non liants de C (m). Une liaison double reste une seule direction.' },
  cram: {
    q: 'Dans la représentation de Cram, le trait en pointillés représente une liaison C–H…',
    options: ['qui s’éloigne de vous, derrière le plan de la feuille', 'qui est dans le plan de la feuille, comme un trait ordinaire', 'qui est plus faible, sur le point de se rompre'], bonne: 0,
    expl: 'Le triangle plein sort de la feuille vers vous ; les pointillés vont dans l’autre sens, derrière la feuille (le modèle 3D qui apparaît le confirme). Ce n’est pas une liaison plus faible : c’est une information sur la position dans l’espace.',
    indice: 'Le trait plein est dans le plan de la feuille et le triangle plein est vers l’avant : quelle position reste-t-il pour les pointillés ?' },
  chi: {
    q: 'Dans la molécule H–Cl, quel atome attire le plus fortement les électrons de la liaison ?',
    options: ['l’atome de chlore : son électronégativité est la plus élevée des deux', 'l’atome d’hydrogène : c’est le plus petit atome, il attire le doublet liant', 'aucun des deux : un doublet liant est toujours partagé à égalité'], bonne: 0,
    expl: 'Plus χ est grand, plus l’atome attire les électrons de la liaison : χ(Cl) = 3,0 > χ(H) = 2,2, donc le doublet est en moyenne plus proche du chlore. Le partage n’est égal que si les deux atomes ont des électronégativités égales ou très proches.',
    indice: 'Lisez dans le diagramme les valeurs de χ pour H et pour Cl : l’atome qui a la plus grande valeur attire le plus.' },
  liaison: {
    q: 'Parmi ces liaisons, laquelle est non polarisée (convention du cours) ?',
    options: ['C–H', 'N–H', 'O–H', 'H–Cl'], bonne: 0,
    expl: 'χ(C) = 2,5 et χ(H) = 2,2, donc Δχ(C–H) = 0,3 ≤ 0,4 : liaison non polarisée. Pour N–H (0,8), O–H (1,3) et H–Cl (0,8), Δχ dépasse 0,4 : ces liaisons sont polarisées.',
    indice: 'Calculez Δχ pour chaque liaison avec les valeurs du diagramme, puis cherchez celle dont Δχ est inférieur ou égal à 0,4.' },
  co2p: {
    q: 'La molécule de CO₂ est linéaire et ses deux liaisons C=O sont polarisées. Est-elle polaire ?',
    options: ['apolaire : G⁺ et G⁻ sont confondus, au centre de la molécule', 'polaire : G⁻ est sur les atomes O et G⁺ sur C, deux points distincts', 'polaire : la molécule possède deux liaisons C=O polarisées'], bonne: 0,
    expl: 'Chaque liaison C=O est polarisée, mais elles sont opposées : G⁻ (milieu des deux O) tombe sur le carbone, qui est lui-même G⁺. Les deux points coïncident : la molécule est apolaire. Avoir des liaisons polarisées ne suffit pas, la géométrie compte.',
    indice: 'Placez G⁻ au milieu des deux charges −δ (sur les O) et G⁺ sur la charge +2δ (sur C). Sont-ils au même endroit ?' },
  h2o: {
    q: 'La molécule d’eau, coudée, a deux liaisons O–H polarisées. Est-elle polaire ?',
    options: ['polaire : G⁺ (entre les deux atomes H) et G⁻ (sur O) sont distincts', 'apolaire : G⁺ et G⁻ sont confondus, les deux liaisons O–H étant identiques', 'apolaire : G⁺ et G⁻ sont confondus au centre, comme dans CO₂'], bonne: 0,
    expl: 'Les deux liaisons O–H sont identiques, mais comme la molécule est coudée, elles ne s’opposent pas : G⁺ se trouve entre les deux atomes H et G⁻ sur l’atome O. Ces deux points sont distincts : la molécule est polaire. (Neutre ne veut pas dire apolaire : la charge totale est nulle, pas leur répartition.)',
    indice: 'Les charges −δ sont sur O. Où se trouve le milieu des deux charges +δ, portées par les deux H ? Est-ce le même point que O ?' },
  nh3p: {
    q: 'L’ammoniac NH₃ (pyramidal ; Δχ(N–H) = 0,8) est-il polaire ?',
    options: ['polaire : G⁻ est près de N, G⁺ au milieu des trois H, ils sont distincts', 'apolaire : G⁺ et G⁻ sont confondus, car les trois liaisons N–H sont identiques', 'apolaire : G⁺ et G⁻ sont confondus sur N, au centre de la molécule'], bonne: 0,
    expl: 'Les liaisons N–H sont polarisées (Δχ = 0,8). La molécule est pyramidale : les trois H sont d’un même côté de N, donc G⁺ (centre du triangle des H) n’est pas confondu avec G⁻ (sur N). NH₃ est polaire. À comparer avec CH₄ : tétraédrique et liaisons C–H non polarisées, donc apolaire.',
    indice: 'Les trois H forment un triangle placé d’un seul côté de l’atome N : où est le point au milieu des trois charges +δ ?' },
};
