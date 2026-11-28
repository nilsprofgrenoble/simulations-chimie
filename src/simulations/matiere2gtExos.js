// Exercices ANA (prévoir sans calculer) et VAL (ça paraît plausible ?) de rémédiation 2GT « Constitution et transformations de la matière » (lot 2).
// Ils comblent les capacités exigibles du programme de seconde GT qui n'avaient pas d'exercice : entités (atome, molécule, anion, cation), composés ioniques et électroneutralité,
// électrons de valence et position dans le tableau périodique, ions stables, schéma de Lewis et énergie de liaison, composition de l'air et d'un mélange, soluté et solvant, verrerie,
// échelle de teintes et étalonnage, ajustement et écriture d'équations de réaction, changements d'état (noms, modèle microscopique, transfert d'énergie), nature d'une transformation
// (physique, chimique, nucléaire) et énergie du Soleil et des centrales. Préfixe d'identifiants : mat2gt-. Branchés dans AtelierAnalyserBanque.js (PREVOIR) et AtelierValiderBanque.js (PLAUSIBLES).
// Règles : une seule bonne réponse par QCM, la bonne réponse n'est jamais strictement la plus longue, chaque option est expliquée, aucune loi hors programme de seconde.
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

const MIC = 'Matière à l’échelle microscopique';
const SOL = 'Solutions et concentration';
const PUR = 'Corps purs et mélanges (2GT)';
const EQ = 'Équation de réaction (2GT)';
const ETAT = 'Changement d’état (2GT)';
const NUC = 'Transformation nucléaire (2GT)';

// ───────────────────────────── ANA : prévoir sans calculer ─────────────────────────────
export const MAT2GT_ANA = [
  // ── Constitution de la matière à l'échelle microscopique : entités chimiques
  { id: 'mat2gt-ana-entite-molecule', domaine: MIC, titre: 'Atome, ion ou molécule ?',
    enonce: 'Voici quatre entités chimiques, données par leur formule : Ar, Na⁺, Cl⁻ et O₂.', q: 'Laquelle est une molécule ?', options: [
      V('O₂ : deux atomes liés, sans charge', 'Une molécule est un groupe d’atomes liés et électriquement neutre. O₂ est formée de deux atomes d’oxygène : c’est une molécule.'),
      F('Ar : un atome seul, sans charge', 'Ar est un atome d’argon : un seul atome, pas un groupe d’atomes liés. Ce n’est pas une molécule.'),
      F('Na⁺ : un atome qui a perdu un électron', 'Na⁺ est un ion positif (un cation) formé à partir d’un seul atome. Ce n’est pas une molécule.'),
      F('Cl⁻ : un atome qui a gagné un électron', 'Cl⁻ est un ion négatif (un anion) formé à partir d’un seul atome. Ce n’est pas une molécule.'),
    ] },
  { id: 'mat2gt-ana-entite-cation', domaine: MIC, titre: 'Cation ou anion ?',
    enonce: 'Un atome de calcium (Z = 20, donc 20 électrons) devient l’ion calcium Ca²⁺.', q: 'Comment appelle-t-on cet ion, et combien a-t-il d’électrons ?', options: [
      V('un cation, avec 18 électrons', 'La charge est positive : c’est un cation. Elle vaut +2e, donc l’ion a perdu 2 électrons : 20 − 2 = 18 électrons.'),
      F('un anion, avec 22 électrons', 'Un anion porte une charge négative. Ici la charge est positive : l’ion a perdu des électrons, il n’en a pas gagné.'),
      F('un cation, avec 22 électrons', 'Le mot cation est le bon, mais une charge positive vient d’une perte d’électrons : 18 électrons, et non 22.'),
      F('un anion, avec 18 électrons', 'Avec 18 électrons, l’ion a perdu 2 électrons : il est positif, donc c’est un cation et non un anion.'),
    ] },

  // ── Composés ioniques, électroneutralité
  { id: 'mat2gt-ana-nom-ion', domaine: MIC, titre: 'Le nom de l’ion F⁻',
    enonce: 'Un atome de fluor gagne un électron et devient l’ion F⁻.', q: 'Comment s’appelle cet ion ?', options: [
      V('l’ion fluorure', 'Les ions négatifs d’un élément prennent la terminaison « -ure » : fluorure pour F⁻, chlorure pour Cl⁻.'),
      F('l’ion fluor', 'Fluor est le nom de l’atome. L’ion négatif s’appelle l’ion fluorure.'),
      F('l’ion fluorique', 'Le mot fluorique n’est pas le nom de cet ion. Pour un anion, on utilise la terminaison « -ure » : fluorure.'),
      F('l’ion fluoré', 'Fluoré qualifie un produit qui contient du fluor : ce n’est pas le nom de l’ion F⁻.'),
    ] },
  { id: 'mat2gt-ana-formule-cacl2', domaine: MIC, titre: 'La formule du chlorure de calcium',
    enonce: 'Le chlorure de calcium est un solide ionique formé d’ions calcium Ca²⁺ et d’ions chlorure Cl⁻. Un solide ionique est électriquement neutre.', q: 'Quelle est sa formule ?', options: [
      V('CaCl₂ : 1 ion Ca²⁺ pour 2 ions Cl⁻', 'Un ion Ca²⁺ porte +2 : il faut 2 ions Cl⁻ (2 × (−1) = −2) pour que la charge totale soit nulle.'),
      F('CaCl : 1 ion Ca²⁺ pour 1 ion Cl⁻', 'La charge totale serait +2 − 1 = +1 : le solide ne serait pas neutre.'),
      F('Ca₂Cl : 2 ions Ca²⁺ pour 1 ion Cl⁻', 'La charge totale serait +4 − 1 = +3 : il y a bien trop de charges positives.'),
      F('Ca²Cl⁻ : on recopie les charges dans la formule', 'Une formule de solide ionique ne porte pas de charges : elle donne seulement les nombres d’ions, ici 1 et 2.'),
    ] },
  { id: 'mat2gt-ana-neutralite', domaine: MIC, titre: 'Un sel de cuisine chargé… mais neutre',
    enonce: 'Le sel de cuisine est formé d’ions Na⁺ et d’ions Cl⁻. Pourtant, un morceau de sel est électriquement neutre.', q: 'Pourquoi ?', options: [
      V('les charges + et − se compensent exactement', 'Il y a autant de charges positives (Na⁺) que de charges négatives (Cl⁻) : la charge totale est nulle. C’est l’électroneutralité.'),
      F('les ions perdent leur charge quand ils sont réunis dans le cristal', 'Les ions gardent leur charge : on les retrouve identiques quand le sel est dissous dans l’eau.'),
      F('seuls les ions Cl⁻ portent une charge, les ions Na⁺ sont neutres', 'Les ions Na⁺ portent +e : c’est ce que montre le signe + dans leur écriture.'),
      F('le sel ne contient pas d’électrons, donc il n’a pas de charge', 'Les ions Cl⁻ ont des électrons en plus ; le sel en contient. La neutralité vient de la compensation des charges.'),
    ] },

  // ── Électrons de valence, position dans le tableau périodique
  { id: 'mat2gt-ana-valence-config', domaine: MIC, titre: 'Les électrons de valence du chlore',
    enonce: 'Le chlore (Z = 17) a pour configuration électronique à l’état fondamental : 1s² 2s² 2p⁶ 3s² 3p⁵.', q: 'Combien d’électrons de valence possède-t-il ?', options: [
      V('7 : ceux de la couche 3 (3s² et 3p⁵)', 'Les électrons de valence sont ceux de la dernière couche, ici la couche 3 : 2 + 5 = 7. Les couches 1 et 2 sont pleines et intérieures.'),
      F('17 : tous ses électrons', '17 est le nombre total d’électrons (Z = 17). Seuls ceux de la dernière couche sont de valence.'),
      F('5 : seulement ceux de la sous-couche 3p', 'La sous-couche 3s² appartient aussi à la couche 3 : les électrons de valence sont 3s² et 3p⁵, soit 7.'),
      F('8 : le nombre d’électrons d’une couche externe pleine', '8 est le nombre d’électrons de valence de l’ion Cl⁻ (après gain d’un électron), pas celui de l’atome de chlore.'),
    ] },
  { id: 'mat2gt-ana-position', domaine: MIC, titre: 'Où est le magnésium dans le tableau ?',
    enonce: 'Le magnésium (Z = 12) a pour configuration électronique : 1s² 2s² 2p⁶ 3s². On rappelle : la ligne (période) est donnée par la dernière couche occupée, la colonne par les électrons de valence.', q: 'Quelle est la position du magnésium ?', options: [
      V('3e ligne, 2e colonne', 'La dernière couche occupée est la couche 3 : 3e ligne. Il y a 2 électrons de valence (3s²) : 2e colonne.'),
      F('2e ligne, 3e colonne', 'Les deux nombres sont inversés : la ligne vient de la couche (3) et la colonne des électrons de valence (2).'),
      F('3e ligne, 12e colonne', '12 est le nombre total d’électrons (Z = 12). La colonne est donnée par les électrons de valence, ici 2.'),
      F('1re ligne, 2e colonne', 'La ligne ne se lit pas sur la première sous-couche 1s² mais sur la dernière couche occupée, ici la couche 3.'),
    ] },

  // ── Stabilité : ions monoatomiques
  { id: 'mat2gt-ana-charge-tableau', domaine: MIC, titre: 'L’ion du magnésium, lu dans le tableau',
    enonce: 'Le magnésium est dans la 2e colonne du tableau périodique : il a 2 électrons de valence. Il forme un ion monoatomique stable, de configuration d’un gaz noble (8 électrons de valence après le changement).', q: 'Quel est cet ion ?', options: [
      V('Mg²⁺ : il perd ses 2 électrons de valence', 'Perdre 2 électrons laisse une couche pleine à 8 électrons (celle du néon). La charge est +2e : l’ion s’écrit Mg²⁺.'),
      F('Mg²⁻ : il gagne 2 électrons', 'Avec 2 électrons de plus, il aurait 4 électrons de valence : loin de la couche pleine. Un métal à 2 électrons de valence en perd 2.'),
      F('Mg⁶⁻ : il gagne 6 électrons pour avoir 8 électrons de valence', 'On gagne ou perd le moins d’électrons possible : perdre 2 électrons est bien plus simple que d’en gagner 6.'),
      F('Mg⁺ : il ne perd qu’un seul électron', 'Avec un seul électron perdu, il resterait 1 électron de valence : la couche n’est pas pleine, l’ion n’est pas stable.'),
    ] },

  // ── Schéma de Lewis et énergie de liaison
  { id: 'mat2gt-ana-lewis-eau', domaine: MIC, titre: 'Le schéma de Lewis de l’eau',
    enonce: 'La molécule d’eau H₂O est formée d’un atome d’oxygène (6 électrons de valence) lié à deux atomes d’hydrogène (1 électron de valence chacun). Au total, il y a 8 électrons de valence. Chaque H doit avoir 2 électrons autour de lui et O doit en avoir 8.', q: 'Combien de doublets liants et non liants le schéma de Lewis compte-t-il ?', options: [
      V('2 doublets liants et 2 doublets non liants', 'Chaque H est lié à O par un doublet liant : 2 doublets liants. Il reste 2 doublets, non liants, sur l’oxygène : O a alors 2 × 2 + 2 × 2 = 8 électrons.'),
      F('2 doublets liants et 4 doublets non liants', 'Il n’y a que 4 doublets en tout (8 électrons de valence, 2 par doublet). Avec 2 + 4 = 6 doublets, on aurait 12 électrons.'),
      F('4 doublets liants et 0 doublet non liant', 'Il faudrait 4 liaisons : chaque H n’en peut faire qu’une seule (il n’a qu’un électron de valence).'),
      F('1 doublet liant et 3 doublets non liants', 'Les deux atomes H doivent chacun être liés à O : il faut 2 doublets liants, pas 1.'),
    ] },
  { id: 'mat2gt-ana-lewis-ammoniac', domaine: MIC, titre: 'Le schéma de Lewis de l’ammoniac',
    enonce: 'La molécule d’ammoniac NH₃ est formée d’un atome d’azote (5 électrons de valence) lié à trois atomes d’hydrogène (1 électron de valence chacun). Au total, il y a 8 électrons de valence. Chaque H doit avoir 2 électrons autour de lui et N doit en avoir 8.', q: 'Combien de doublets non liants porte l’atome d’azote ?', options: [
      V('1 doublet non liant', 'Les 3 liaisons N–H utilisent 3 doublets. Sur les 4 doublets, il en reste 1, non liant, sur l’azote : N a alors 3 × 2 + 2 = 8 électrons.'),
      F('0 doublet non liant : N est lié à 3 H', 'Avec 3 liaisons seulement, N n’aurait que 6 électrons autour de lui. Il lui manque le doublet non liant pour atteindre 8.'),
      F('2 doublets non liants', 'Avec 3 doublets liants, il resterait 4 − 3 = 1 seul doublet : on ne peut pas en placer 2.'),
      F('3 doublets non liants : un par hydrogène', 'Les doublets non liants ne sont pas associés aux hydrogènes : les doublets liants, eux, relient N à chaque H.'),
    ] },
  { id: 'mat2gt-ana-energie-liaison', domaine: MIC, titre: 'Casser la liaison de H₂',
    enonce: 'Pour casser la liaison entre les deux atomes d’hydrogène d’une molécule H₂, il faut fournir de l’énergie : c’est l’énergie de liaison. À l’inverse, deux atomes H isolés qui se lient libèrent cette énergie.', q: 'Que peut-on en conclure ?', options: [
      V('H₂ est plus stable que deux atomes H séparés', 'Il faut de l’énergie pour séparer les atomes : la molécule a moins d’énergie qu’eux, elle est plus stable.'),
      F('deux atomes H séparés sont plus stables que H₂', 'C’est l’inverse : si l’on doit fournir de l’énergie pour les séparer, la molécule est la plus stable.'),
      F('H₂ et deux atomes H séparés sont aussi stables', 'Si leur stabilité était la même, casser la liaison ne demanderait pas d’énergie.'),
      F('la stabilité ne dépend pas de l’énergie à fournir', 'L’énergie nécessaire pour casser une liaison mesure justement sa solidité : plus elle est grande, plus la liaison est stable.'),
    ] },

  // ── Composition d'un mélange, composition de l'air
  { id: 'mat2gt-ana-air-volume', domaine: PUR, titre: 'Le dioxygène dans l’air d’une pièce',
    enonce: 'L’air contient environ 4/5 de diazote et 1/5 de dioxygène en volume. Une pièce contient 50 m³ d’air.', q: 'Quel est environ le volume de dioxygène dans la pièce ?', options: [
      V('environ 10 m³', 'Le dioxygène représente environ 1/5 de l’air : frac(50|5) = 10 m³.'),
      F('environ 40 m³', '40 m³ correspond à 4/5 de l’air : c’est le volume de diazote, pas celui de dioxygène.'),
      F('environ 2,5 m³', '2,5 m³ vient de frac(50|20) : on a pris 20 comme diviseur alors que 20 % = 1/5, soit frac(50|5) = 10 m³.'),
      F('environ 250 m³', 'Un morceau d’un mélange ne peut pas dépasser le volume total (50 m³). On a multiplié par 5 au lieu de diviser.'),
    ] },
  { id: 'mat2gt-ana-comp-massique', domaine: PUR, titre: 'Le pourcentage de sel dans un mélange',
    enonce: 'On mélange 30 g de sel fin et 70 g de sable. Le mélange pèse donc 100 g.', q: 'Quel est le pourcentage en masse de sel dans ce mélange ?', options: [
      V('30 %', 'Pourcentage en masse = frac(masse de sel|masse du mélange) = frac(30|100) = 0,30, soit 30 %.'),
      F('70 %', '70 % est le pourcentage de sable frac(70|100), pas celui du sel.'),
      F('43 %', '43 % vient de frac(30|70) : on a divisé par la masse de sable. Il faut diviser par la masse du mélange entier (100 g).'),
      F('3 %', '3 % serait 3 g de sel pour 100 g de mélange : on s’est trompé d’un facteur 10 dans la division.'),
    ] },

  // ── Solutions : soluté, solvant, concentration en masse, masse volumique
  { id: 'mat2gt-ana-solute-solvant', domaine: SOL, titre: 'Le soluté et le solvant d’un sirop',
    enonce: 'On prépare un sirop : on dissout 50 g de sucre dans 250 mL d’eau. On obtient un liquide sucré homogène.', q: 'Quel est le soluté, quel est le solvant ?', options: [
      V('soluté : le sucre ; solvant : l’eau', 'Le soluté est ce qui se dissout (le sucre) ; le solvant est le liquide qui le dissout (l’eau). Le sirop est la solution obtenue.'),
      F('soluté : l’eau ; solvant : le sucre', 'C’est inversé : le sucre est dissous, donc c’est lui le soluté. L’eau qui dissout est le solvant.'),
      F('soluté : le sirop ; solvant : l’eau', 'Le sirop est le mélange obtenu : c’est la solution. Ce n’est pas le soluté, qui est ce qu’on a dissous.'),
      F('soluté : le sucre ; solvant : le sirop', 'Le sirop contient déjà le sucre dissous : c’est la solution. Le solvant est l’eau, utilisée avant la dissolution.'),
    ] },
  { id: 'mat2gt-ana-rho-ou-t', domaine: SOL, titre: 'Masse volumique ou concentration en masse ?',
    enonce: 'Une solution de sel contient 20 g de sel dissous dans 1,0 L de solution. Sa masse volumique est 1,01 g·mL⁻¹, soit 1 010 g·L⁻¹.', q: 'Quelle grandeur vaut 20 g·L⁻¹ ?', options: [
      V('la concentration en masse du sel', 'La concentration en masse compare la masse du soluté seul au volume de solution : frac(20 g|1,0 L) = 20 g·L⁻¹.'),
      F('la masse volumique de la solution', 'La masse volumique compare la masse de toute la solution (eau et sel) à son volume : ici 1 010 g·L⁻¹.'),
      F('la masse volumique du sel solide', 'Le sel solide n’est pas en cause : 20 g·L⁻¹ concerne le sel dissous dans la solution, pas le solide.'),
      F('la masse de la solution par litre d’eau', 'La grandeur 20 g·L⁻¹ compte la masse de sel seule, et le volume est celui de la solution, pas celui de l’eau.'),
    ] },
  { id: 'mat2gt-ana-fiole', domaine: SOL, titre: 'Quelle verrerie pour une solution précise ?',
    enonce: 'On veut préparer 100,0 mL d’une solution de sel de concentration connue avec précision. On a dissous le sel dans un peu d’eau et il faut maintenant ajuster le volume final.', q: 'Quelle verrerie choisir pour ajuster le volume ?', options: [
      V('une fiole jaugée de 100,0 mL', 'La fiole jaugée a un trait de jauge : en complétant jusqu’au trait, on obtient 100,0 mL avec précision.'),
      F('un bécher gradué de 100 mL', 'Les graduations d’un bécher sont approximatives : on n’obtient pas un volume précis.'),
      F('une éprouvette graduée de 100 mL', 'L’éprouvette est plus précise qu’un bécher, mais moins qu’une fiole jaugée : elle ne sert pas à préparer une solution précise.'),
      F('un erlenmeyer avec un trait à 100 mL', 'Le trait d’un erlenmeyer n’est qu’un repère grossier : il ne garantit pas un volume précis.'),
    ] },
  { id: 'mat2gt-ana-pipette', domaine: SOL, titre: 'Prélever 10,0 mL pour diluer',
    enonce: 'Pour réaliser une dilution, on doit prélever exactement 10,0 mL de solution mère.', q: 'Quelle verrerie utiliser pour ce prélèvement ?', options: [
      V('une pipette jaugée de 10,0 mL', 'La pipette jaugée prélève un volume précis, ici 10,0 mL, jusqu’à son trait de jauge.'),
      F('un bécher gradué de 50 mL', 'Le bécher ne mesure les volumes qu’approximativement : le prélèvement ne serait pas précis.'),
      F('une éprouvette graduée de 100 mL', 'Pour 10 mL, une éprouvette de 100 mL est peu précise : les graduations sont trop espacées.'),
      F('un compte-gouttes', 'Un compte-gouttes ne mesure aucun volume précis : il ne permet pas de prélever 10,0 mL.'),
    ] },

  // ── Dosage par étalonnage : échelle de teintes et gamme
  { id: 'mat2gt-ana-teintes-encadrer', domaine: SOL, titre: 'Lire une échelle de teintes',
    enonce: 'Une échelle de teintes de sulfate de cuivre comporte quatre tubes de concentrations en masse 2 g·L⁻¹, 4 g·L⁻¹, 6 g·L⁻¹ et 8 g·L⁻¹. La teinte de la solution à doser est comprise entre celles du tube à 4 g·L⁻¹ et du tube à 6 g·L⁻¹.', q: 'Que peut-on dire de sa concentration en masse ?', options: [
      V('elle est comprise entre 4 g·L⁻¹ et 6 g·L⁻¹', 'La teinte est entre celles des deux tubes : on encadre la concentration, sans pouvoir donner de valeur plus précise.'),
      F('elle vaut exactement 5 g·L⁻¹', 'On ne peut pas affirmer 5 g·L⁻¹ : la teinte est seulement intermédiaire. L’échelle donne un encadrement.'),
      F('elle est comprise entre 6 g·L⁻¹ et 8 g·L⁻¹', 'Une teinte entre celle du tube à 4 et celle du tube à 6 correspond à une concentration entre 4 et 6 g·L⁻¹.'),
      F('elle vaut 10 g·L⁻¹ : 4 + 6', 'On n’additionne pas les concentrations des tubes : la concentration est comprise entre elles.'),
    ] },
  { id: 'mat2gt-ana-etalonnage-rho', domaine: SOL, titre: 'Étalonner avec la masse volumique',
    enonce: 'On mesure la masse volumique de solutions de sirop de concentration connue : 1,02 g·mL⁻¹ pour 50 g·L⁻¹ et 1,04 g·mL⁻¹ pour 100 g·L⁻¹ (valeurs arrondies). On admet que la masse volumique augmente régulièrement avec la concentration. Une solution inconnue a pour masse volumique 1,03 g·mL⁻¹.', q: 'Quelle est sa concentration en masse, environ ?', options: [
      V('environ 75 g·L⁻¹ : au milieu des deux étalons', '1,03 est au milieu de 1,02 et 1,04 : la concentration est au milieu de 50 et 100 g·L⁻¹, soit 75 g·L⁻¹.'),
      F('environ 150 g·L⁻¹ : on additionne 50 et 100', 'On n’additionne pas les concentrations des étalons : la solution est entre les deux, donc entre 50 et 100 g·L⁻¹.'),
      F('environ 1,03 g·L⁻¹ : on recopie la masse volumique', 'La masse volumique et la concentration en masse sont deux grandeurs différentes : on lit la concentration grâce aux étalons.'),
      F('environ 30 g·L⁻¹ : on retient seulement 0,03', 'La masse volumique de l’eau vaut déjà 1,00 g·mL⁻¹ ; il faut comparer 1,03 aux masses volumiques des étalons.'),
    ] },

  // ── Transformation chimique : équations
  { id: 'mat2gt-ana-ajuster-mg', domaine: EQ, titre: 'Ajuster la combustion du magnésium',
    enonce: 'Le magnésium brûle dans le dioxygène et forme de l’oxyde de magnésium : Mg + O₂ → MgO. L’équation n’est pas ajustée.', q: 'Quelle équation est correctement ajustée ?', options: [
      V('2 Mg + O₂ → 2 MgO', '2 atomes Mg et 2 atomes O de chaque côté : les atomes sont conservés, sans changer aucune formule.'),
      F('Mg + O₂ → MgO₂', 'Les atomes sont bien comptés, mais on a changé la formule du produit : MgO₂ n’est pas l’oxyde de magnésium MgO.'),
      F('2 Mg + 2 O₂ → 2 MgO', 'À gauche, 4 atomes O ; à droite, 2 : l’oxygène n’est pas conservé.'),
      F('Mg + O₂ → 2 MgO', 'À gauche 1 atome Mg, à droite 2 : le magnésium n’est pas conservé.'),
    ] },
  { id: 'mat2gt-ana-ajuster-al', domaine: EQ, titre: 'Ajuster la combustion de l’aluminium',
    enonce: 'L’aluminium brûle dans le dioxygène et forme de l’oxyde d’aluminium : Al + O₂ → Al₂O₃. L’équation n’est pas ajustée.', q: 'Quelle équation est correctement ajustée ?', options: [
      V('4 Al + 3 O₂ → 2 Al₂O₃', 'À gauche 4 Al et 6 O ; à droite 2 × 2 = 4 Al et 2 × 3 = 6 O : tous les atomes sont conservés.'),
      F('2 Al + 3 O₂ → Al₂O₃', 'À gauche 6 atomes O, à droite 3 : l’oxygène n’est pas conservé.'),
      F('2 Al + O₂ → Al₂O₃', 'Les atomes Al sont conservés (2 de chaque côté), mais il y a 2 atomes O à gauche pour 3 à droite.'),
      F('4 Al + 2 O₂ → 2 Al₂O₃', 'À gauche 4 atomes O, à droite 6 : l’oxygène n’est pas conservé.'),
    ] },
  { id: 'mat2gt-ana-eq-carbone', domaine: EQ, titre: 'La combustion complète du carbone',
    enonce: 'Du charbon (carbone solide C) brûle complètement dans le dioxygène O₂ et forme du dioxyde de carbone CO₂.', q: 'Quelle équation modélise cette transformation ?', options: [
      V('C(s) + O₂(g) → CO₂(g)', 'Un atome C et deux atomes O de chaque côté : l’équation est ajustée et correspond bien au dioxyde de carbone.'),
      F('C(s) + O₂(g) → CO(g)', 'CO est le monoxyde de carbone, formé en combustion incomplète. L’énoncé parle du dioxyde, CO₂.'),
      F('C(s) + 2 O₂(g) → CO₂(g)', 'À gauche 4 atomes O, à droite 2 : l’oxygène n’est pas conservé.'),
      F('2 C(s) + O₂(g) → CO₂(g)', 'À gauche 2 atomes C, à droite 1 : le carbone n’est pas conservé.'),
    ] },
  { id: 'mat2gt-ana-eq-calcaire', domaine: EQ, titre: 'Un acide sur du calcaire',
    enonce: 'Un acide (ions H⁺) attaque du calcaire (carbonate de calcium CaCO₃). On observe des bulles de dioxyde de carbone. À la fin, il y a des ions calcium Ca²⁺ et de l’eau liquide dans le bécher.', q: 'Quelle équation modélise cette transformation ?', options: [
      V('CaCO₃(s) + 2 H⁺(aq) → Ca²⁺(aq) + CO₂(g) + H₂O(l)', 'Atomes : 1 Ca, 1 C, 3 O, 2 H de chaque côté. Charges : +2 à gauche, +2 à droite. L’équation est ajustée.'),
      F('CaCO₃(s) + H⁺(aq) → Ca²⁺(aq) + CO₂(g) + H₂O(l)', 'Il y a 1 atome H à gauche pour 2 à droite, et la charge est +1 à gauche pour +2 à droite : non ajustée.'),
      F('CaCO₃(s) + 2 H⁺(aq) → Ca(s) + CO₂(g) + H₂O(l)', 'La charge est +2 à gauche et 0 à droite. Les ions calcium Ca²⁺ restent en solution, il ne se forme pas de calcium solide.'),
      F('CaCO₃(s) + 2 H⁺(aq) → Ca²⁺(aq) + CO₂(g) + 2 H₂O(l)', 'À droite, 4 atomes H et 4 atomes O ; à gauche 2 H et 3 O : il y a trop de H₂O, l’équation n’est pas ajustée.'),
    ] },
  { id: 'mat2gt-ana-modeliser-pop', domaine: EQ, titre: 'Quels sont les réactifs et les produits ?',
    enonce: 'Un morceau de zinc plongé dans de l’acide chlorhydrique disparaît peu à peu et des bulles se forment. Le gaz recueilli fait « pop » à l’approche d’une flamme. On trouve aussi des ions zinc Zn²⁺ dans la solution.', q: 'Quels sont les réactifs et les produits de cette transformation ?', options: [
      V('réactifs : Zn et H⁺ ; produits : Zn²⁺ et H₂', 'Ce qui disparaît (le zinc et les ions H⁺ de l’acide) est consommé : ce sont les réactifs. Ce qui apparaît (Zn²⁺ et le dihydrogène du « pop ») sont les produits.'),
      F('réactifs : Zn²⁺ et H₂ ; produits : Zn et H⁺', 'C’est inversé : le zinc disparaît, donc c’est un réactif ; les ions Zn²⁺ apparaissent, donc ce sont des produits.'),
      F('réactifs : Zn et H₂ ; produits : Zn²⁺ et H⁺', 'Le dihydrogène n’est pas un réactif : il se forme (c’est le gaz qui fait « pop »), ce n’est pas lui qu’on introduit.'),
      F('réactifs : Zn, H⁺ et Zn²⁺ ; produit : H₂', 'Les ions Zn²⁺ ne sont pas dans la solution au début : ils apparaissent au cours de la transformation, ce sont des produits.'),
    ] },

  // ── Transformation physique : noms, modèle microscopique, transfert d'énergie
  { id: 'mat2gt-ana-liquefaction', domaine: ETAT, titre: 'La buée sur la vitre',
    enonce: 'De la vapeur d’eau passe à l’état liquide sur la vitre froide d’une salle de bain : c’est la buée.', q: 'Quel est le nom de ce changement d’état et son équation ?', options: [
      V('liquéfaction : H₂O(g) → H₂O(l)', 'Le passage de l’état gazeux à l’état liquide s’appelle la liquéfaction. On écrit l’état de départ (g) à gauche et celui d’arrivée (l) à droite.'),
      F('vaporisation : H₂O(g) → H₂O(l)', 'L’équation est la bonne, mais le nom ne l’est pas : la vaporisation est le passage du liquide au gaz.'),
      F('solidification : H₂O(l) → H₂O(s)', 'La solidification est le passage du liquide au solide : ici on part d’un gaz et on arrive à un liquide.'),
      F('liquéfaction : H₂O(l) → H₂O(g)', 'Le nom est le bon, mais l’équation est écrite à l’envers : l’état de départ est le gaz (g).'),
    ] },
  { id: 'mat2gt-ana-vie-courante', schema: { type: 'lingeFil' }, domaine: ETAT, titre: 'Le linge qui sèche',
    enonce: 'Du linge mouillé sèche sur un fil : l’eau liquide passe à l’état gazeux, sans que l’eau bouille.', q: 'Quel changement d’état a lieu ?', options: [
      V('la vaporisation : de liquide à gaz', 'Le passage de l’état liquide à l’état gazeux s’appelle la vaporisation : elle peut avoir lieu sans ébullition.'),
      F('la sublimation : de solide à gaz', 'Il n’y a pas de solide au départ : l’eau du linge est liquide. La sublimation est le passage direct du solide au gaz.'),
      F('la liquéfaction : de gaz à liquide', 'C’est le sens inverse : ici le liquide devient un gaz.'),
      F('la fusion : de solide à liquide', 'La fusion part d’un solide. Le linge n’est pas gelé : l’eau est déjà liquide.'),
    ] },
  { id: 'mat2gt-ana-micro-gaz', domaine: ETAT, titre: 'Les molécules d’eau qui se vaporisent',
    enonce: 'À l’échelle microscopique, on représente l’eau par des molécules H₂O. On fait bouillir de l’eau liquide : elle se vaporise.', q: 'Que deviennent les molécules d’eau ?', options: [
      V('elles ne changent pas, mais s’éloignent les unes des autres', 'Une vaporisation ne change pas les molécules : elles restent H₂O. Elles s’éloignent et se déplacent librement dans le gaz.'),
      F('elles grossissent et changent de forme pour occuper plus de place', 'Les molécules gardent la même taille et la même forme : c’est la distance entre elles qui augmente.'),
      F('elles se séparent en atomes d’hydrogène et d’oxygène dans le gaz', 'Ce serait une transformation chimique. La vapeur d’eau est encore formée de molécules H₂O.'),
      F('elles disparaissent : il y a moins de matière après la vaporisation', 'La matière se conserve : les molécules sont toujours là, simplement plus éloignées.'),
    ] },
  { id: 'mat2gt-ana-micro-fusion', domaine: ETAT, titre: 'Les molécules d’eau qui fondent',
    enonce: 'Un morceau de glace fond. Dans la glace comme dans l’eau liquide, les molécules sont toutes des molécules H₂O.', q: 'Qu’est-ce qui change à l’échelle microscopique ?', options: [
      V('ordre dans la glace, désordre mobile dans l’eau liquide', 'Dans la glace, les molécules sont rangées en ordre ; dans le liquide, elles restent proches mais se déplacent et sont désordonnées.'),
      F('la nature de chaque molécule, qui n’est plus H₂O après la fonte', 'Une fusion est une transformation physique : les molécules ne changent pas, elles restent H₂O.'),
      F('le nombre de molécules, qui augmente quand la glace fond', 'Le nombre de molécules ne change pas : la masse se conserve pendant la fusion.'),
      F('la taille de chaque molécule, qui diminue quand elle fond', 'Les molécules gardent la même taille. Ce qui change, c’est leur arrangement.'),
    ] },
  { id: 'mat2gt-ana-fusion-dissolution', domaine: ETAT, titre: 'Eau de fonte ou thé sucré ?',
    enonce: 'Dans un premier verre, un glaçon d’eau pure fond entièrement. Dans un second verre, un morceau de sucre se dissout entièrement dans du thé.', q: 'Que peut-on dire des deux liquides obtenus ?', options: [
      V('eau de fonte : corps pur ; thé sucré : mélange', 'La fusion ne change que l’état d’un seul corps pur : l’eau reste pure. La dissolution mélange deux corps : le thé sucré contient de l’eau, du sucre et le thé.'),
      F('les deux liquides sont des corps purs', 'Le thé sucré contient plusieurs espèces chimiques (eau, sucre, espèces du thé) : c’est un mélange.'),
      F('les deux liquides sont des mélanges', 'L’eau de fonte provient d’un glaçon d’eau pure : elle ne contient qu’une seule espèce, c’est un corps pur.'),
      F('l’eau de fonte est un mélange, le thé sucré un corps pur', 'C’est l’inverse : la fusion garde un corps pur, la dissolution fabrique un mélange.'),
    ] },
  { id: 'mat2gt-ana-exo-buee', domaine: ETAT, titre: 'La buée : qui cède de l’énergie ?',
    enonce: 'La vapeur d’eau se liquéfie sur une vitre froide : c’est la formation de la buée.', q: 'Comment qualifier cette transformation, et dans quel sens va l’énergie ?', options: [
      V('exothermique : l’eau cède de l’énergie à la vitre', 'En se liquéfiant, l’eau cède de l’énergie à son milieu (la vitre) : la transformation est exothermique.'),
      F('endothermique : l’eau cède de l’énergie à la vitre', 'Si l’eau cède de l’énergie à son milieu, la transformation est exothermique : « endothermique » veut dire que le système reçoit de l’énergie.'),
      F('exothermique : l’eau reçoit de l’énergie de la vitre', 'Dans une transformation exothermique, c’est le système (l’eau) qui cède de l’énergie. Ici elle ne la reçoit pas.'),
      F('endothermique : l’eau reçoit de l’énergie de la vitre', 'C’est le contraire de ce qui se passe : la liquéfaction, inverse de la vaporisation, cède de l’énergie.'),
    ] },

  // ── Transformation nucléaire : nature d'une transformation, Soleil, centrales
  { id: 'mat2gt-ana-nature-ecriture', domaine: NUC, titre: 'Laquelle est nucléaire ?',
    enonce: 'Voici quatre écritures symboliques. (A) CH₄ + 2 O₂ → CO₂ + 2 H₂O ; (B) H₂O(s) → H₂O(l) ; (C) ²₁H + ³₁H → ⁴₂He + ¹₀n ; (D) NaCl(s) → Na⁺(aq) + Cl⁻(aq).', q: 'Laquelle représente une transformation nucléaire ?', options: [
      V('C : les noyaux changent, de l’hélium se forme', 'Dans une transformation nucléaire, des noyaux sont transformés : ici des noyaux d’hydrogène (Z = 1) donnent un noyau d’hélium (Z = 2).'),
      F('A : la combustion libère beaucoup d’énergie', 'C’est une transformation chimique : les atomes se réarrangent, leurs noyaux ne changent pas. Une grande énergie ne suffit pas à la rendre nucléaire.'),
      F('B : le solide devient liquide en changeant d’état', 'C’est une transformation physique : H₂O(s) → H₂O(l) est la fusion de la glace. Les molécules restent H₂O.'),
      F('D : le sel se sépare en ions dans l’eau, en se dissolvant', 'Une dissolution est une transformation physique : les noyaux des atomes sont intacts.'),
    ] },
  { id: 'mat2gt-ana-nature-physique', schema: { type: 'casserole' }, domaine: NUC, titre: 'Une casserole d’eau qui bout',
    enonce: 'Une casserole d’eau bout : on écrit H₂O(l) → H₂O(g).', q: 'Quelle est la nature de cette transformation ?', options: [
      V('physique : les molécules H₂O restent les mêmes', 'Seul l’état de l’eau change : les molécules sont les mêmes avant et après. C’est une transformation physique (un changement d’état).'),
      F('chimique : l’eau devient une autre espèce chimique', 'Dans une transformation chimique, des espèces disparaissent et d’autres apparaissent. Ici la vapeur est de l’eau : H₂O des deux côtés.'),
      F('nucléaire : les noyaux des atomes d’hydrogène changent', 'Les noyaux ne sont pas concernés : la formule H₂O est la même des deux côtés de la flèche.'),
      F('aucune transformation : la température reste constante pendant l’ébullition', 'Une température constante n’empêche pas une transformation : de l’eau liquide se transforme en vapeur d’eau, c’est un changement d’état.'),
    ] },
  { id: 'mat2gt-ana-fusion-ecriture', domaine: NUC, titre: 'Lire une écriture de fusion',
    enonce: 'Dans le cœur du Soleil, on modélise une réaction par l’écriture symbolique : ²₁H + ²₁H → ⁴₂He. Les noyaux ²₁H sont des noyaux d’hydrogène (Z = 1) et ⁴₂He est un noyau d’hélium (Z = 2).', q: 'Que montre cette écriture ?', options: [
      V('des noyaux d’hydrogène s’assemblent : c’est une fusion', 'Deux petits noyaux se réunissent en un noyau plus gros, d’un autre élément : c’est une fusion nucléaire, qui libère de l’énergie.'),
      F('un noyau d’hélium se casse : c’est une fission', 'La flèche va des deux petits noyaux vers le noyau plus gros : ils s’assemblent, ils ne se cassent pas.'),
      F('de l’hydrogène brûle dans du dioxygène : c’est une combustion', 'Il n’y a pas de dioxygène dans l’écriture, et les noyaux changent : ce n’est pas une combustion.'),
      F('de l’hydrogène change d’état pour devenir de l’hélium', 'Un changement d’état ne change pas l’élément. Ici l’hydrogène (Z = 1) devient de l’hélium (Z = 2) : ce sont les noyaux qui changent.'),
    ] },
  { id: 'mat2gt-ana-fission-ecriture', domaine: NUC, titre: 'Lire une écriture de fission',
    enonce: 'Dans le réacteur d’une centrale, on modélise une réaction par : ²³⁵₉₂U + ¹₀n → ⁹⁴₃₈Sr + ¹⁴⁰₅₄Xe + 2 ¹₀n. Le noyau d’uranium (235 nucléons) est un gros noyau ; ceux du strontium (94) et du xénon (140) sont plus petits.', q: 'Que montre cette écriture ?', options: [
      V('un gros noyau se casse : c’est une fission', 'Un neutron frappe un gros noyau d’uranium, qui se casse en deux noyaux plus petits et libère des neutrons : c’est une fission nucléaire.'),
      F('de petits noyaux s’assemblent : c’est une fusion', 'C’est l’inverse : le noyau d’uranium se casse en deux noyaux plus petits.'),
      F('de l’uranium brûle comme du charbon : c’est une combustion', 'L’uranium ne brûle pas : ses noyaux se cassent et changent d’élément (Sr et Xe), ce qui est nucléaire.'),
      F('de l’uranium change d’état : c’est une vaporisation', 'Un changement d’état conserve l’élément. Ici l’uranium donne du strontium et du xénon, d’autres éléments.'),
    ] },
];

// ───────────────────────────── VAL : ça paraît plausible ? ─────────────────────────────
export const MAT2GT_VAL = [
  P({ id: 'mat2gt-val-sel-molecules', domaine: MIC, niveau: 1, titre: 'Les « molécules » de sel', plausible: false,
    enonce: 'Un élève écrit : « le sel de cuisine est formé de molécules NaCl, chacune avec un atome de sodium et un atome de chlore ».',
    reperes: [['Sel de cuisine', 'solide dont la formule est NaCl'], ['Ions', 'Na⁺ (positif) et Cl⁻ (négatif)'], ['Molécule', 'groupe d’atomes liés, électriquement neutre']],
    ver: 'Le sel est un solide ionique : il est formé d’ions Na⁺ et Cl⁻, en nombre égal. La formule NaCl donne seulement cette proportion 1 pour 1 ; ce ne sont pas des molécules.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('le sel est fait d’ions Na⁺ et Cl⁻, pas de molécules', 'Un solide ionique est un empilement d’ions de charges opposées : Na⁺ et Cl⁻. Il ne contient pas de molécules NaCl.'),
      F('il a oublié que le chlorure de sodium est un gaz à 20 °C', 'Le sel de cuisine est solide à 20 °C. L’état physique n’est pas en cause dans l’erreur de l’élève.'),
      F('il aurait dû écrire la formule Na₂Cl₂ pour une molécule', 'La formule d’un solide ionique donne la proportion des ions : NaCl, avec 1 Na⁺ pour 1 Cl⁻. Il n’y a pas de molécule Na₂Cl₂.'),
    ] }),
  P({ id: 'mat2gt-val-formule-mgcl', domaine: MIC, niveau: 2, titre: 'La formule du chlorure de magnésium', plausible: false,
    enonce: 'Le chlorure de magnésium est formé d’ions Mg²⁺ et Cl⁻. Un élève écrit sa formule MgCl et explique : « un ion de chaque, donc 1 pour 1 ».',
    reperes: [['Ion magnésium', 'Mg²⁺ : charge +2'], ['Ion chlorure', 'Cl⁻ : charge −1'], ['Règle', 'un solide ionique est neutre : la somme des charges est nulle']],
    ver: 'Un ion Mg²⁺ (charge +2) doit être compensé par deux ions Cl⁻ (2 × (−1) = −2). La formule est MgCl₂ : MgCl aurait une charge totale de +1.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il n’a pas équilibré les charges : il faut 2 ions Cl⁻', 'Pour que la charge totale soit nulle, un ion Mg²⁺ (+2) demande deux ions Cl⁻ (−1 chacun) : MgCl₂.'),
      F('il a oublié d’écrire les charges + et − dans la formule du solide', 'La formule d’un solide ionique n’indique pas les charges : elle donne seulement les nombres d’ions. L’erreur est ailleurs.'),
      F('il a mélangé les ions : le chlore devrait être écrit en premier', 'L’ordre d’écriture est une convention (le cation d’abord). L’erreur de l’élève porte sur le nombre d’ions Cl⁻.'),
    ] }),
  P({ id: 'mat2gt-val-valence', domaine: MIC, niveau: 1, titre: 'Les électrons de valence du carbone', plausible: false,
    enonce: 'Le carbone (Z = 6) a pour configuration 1s² 2s² 2p². Un élève annonce : « le carbone a 6 électrons de valence, car Z = 6 ».',
    reperes: [['Configuration du carbone', '1s² 2s² 2p²'], ['Électrons de valence', 'ceux de la dernière couche occupée'], ['Couche 1', 'intérieure : ses électrons ne sont pas de valence']],
    ver: 'La dernière couche occupée est la couche 2 : 2s² 2p² donne 2 + 2 = 4 électrons de valence. Les 2 électrons de la couche 1 (1s²) ne sont pas de valence.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il compte tous les électrons, pas ceux de valence', 'Z = 6 donne le nombre total d’électrons. Les électrons de valence sont seulement ceux de la dernière couche : 4.'),
      F('il a oublié que 2p² contient 4 électrons', 'L’exposant 2 de 2p² indique 2 électrons : il n’y en a pas 4. L’erreur est ailleurs.'),
      F('il a confondu les électrons avec les protons du noyau', 'Le nombre de protons est lui aussi égal à Z = 6, mais l’élève parle bien d’électrons. L’erreur porte sur lesquels compter.'),
    ] }),
  P({ id: 'mat2gt-val-ion-faux', domaine: MIC, niveau: 2, titre: 'L’ion du fluor', plausible: false,
    enonce: 'Le fluor (Z = 9, 7 électrons de valence) forme un ion stable. Un élève écrit : « il gagne 2 électrons et devient l’ion F²⁻ ».',
    reperes: [['Fluor', '7 électrons de valence'], ['Couche pleine', '8 électrons de valence, comme le néon'], ['Principe', 'gagner ou perdre le moins d’électrons possible']],
    ver: 'Il manque 1 électron au fluor pour avoir 8 électrons de valence : il gagne 1 électron et devient F⁻. Avec 2 électrons gagnés, la couche de valence ne serait pas celle d’un gaz noble.',
    q2: 'Quelle est la bonne réponse ?',
    options: [
      V('il lui manque 1 électron pour en avoir 8 : l’ion est F⁻', 'Avec 7 électrons de valence, un seul électron de plus donne la configuration du néon. L’ion stable est F⁻.'),
      F('il perd 1 électron pour avoir 6 électrons de valence : F⁺', 'Perdre un électron éloigne de la couche pleine : F⁺ aurait 6 électrons de valence, loin des 8.'),
      F('il garde ses 7 électrons de valence : le fluor n’a pas d’ion', 'Avec 7 électrons de valence, le fluor n’est pas stable : il forme facilement l’ion F⁻.'),
    ] }),
  P({ id: 'mat2gt-val-lewis', domaine: MIC, niveau: 2, titre: 'Le schéma de Lewis de H₂', plausible: false,
    enonce: 'Un élève dessine le schéma de Lewis de la molécule de dihydrogène H₂ avec deux liaisons entre les atomes, en expliquant : « chaque hydrogène doit avoir 8 électrons ».',
    reperes: [['Hydrogène', '1 électron de valence'], ['Règle du duet', 'l’hydrogène est stable avec 2 électrons, comme l’hélium'], ['Doublet liant', 'une liaison = 2 électrons partagés']],
    ver: 'L’hydrogène suit la règle du duet : 2 électrons lui suffisent. Une seule liaison (un doublet liant) donne 2 électrons à chaque atome H : le schéma de H₂ a une seule liaison.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('H suit la règle du duet : 2 électrons lui suffisent, 1 liaison', 'L’hydrogène complète sa couche avec 2 électrons, pas 8 : une seule liaison suffit dans H₂.'),
      F('il aurait dû dessiner des doublets non liants sur chaque atome H', 'Avec un seul électron de valence, H ne peut faire qu’une liaison : il n’a aucun électron en plus pour un doublet non liant.'),
      F('il a oublié que les atomes identiques ne peuvent pas se lier', 'Deux atomes identiques se lient très bien : H₂, O₂ et N₂ sont des molécules formées d’atomes identiques.'),
    ] }),

  P({ id: 'mat2gt-val-air-pourcent', domaine: PUR, niveau: 1, titre: 'La composition de l’air', plausible: false,
    enonce: 'Un élève écrit : « l’air est composé d’environ 50 % de dioxygène et 50 % de diazote en volume ».',
    reperes: [['Diazote', 'environ 4/5 du volume de l’air, soit 80 %'], ['Dioxygène', 'environ 1/5 du volume, soit 20 %'], ['Autres gaz', 'en très petite quantité']],
    ver: 'L’air contient environ 80 % de diazote et 20 % de dioxygène en volume, pas moitié-moitié. Le dioxygène ne représente qu’environ un cinquième de l’air.',
    q2: 'Quelle est la bonne composition de l’air ?',
    options: [
      V('environ 4/5 de diazote et 1/5 de dioxygène', 'C’est la composition approchée de l’air : le diazote est largement majoritaire.'),
      F('environ 4/5 de dioxygène et 1/5 de diazote', 'C’est inversé : le diazote est le gaz le plus abondant de l’air, et le dioxygène seulement environ un cinquième.'),
      F('presque entièrement du dioxyde de carbone', 'Le dioxyde de carbone n’est présent qu’en très petite quantité (environ 0,04 %) dans l’air.'),
    ] }),
  P({ id: 'mat2gt-val-rho-air', domaine: PUR, niveau: 2, titre: 'Un litre d’air sur la balance', plausible: false,
    enonce: 'Un élève pèse un ballon de 1,0 L rempli d’air et trouve que l’air qu’il contient a une masse de 1,2 kg.',
    reperes: [['Masse volumique de l’air', 'environ 1,2 g·L⁻¹'], ['Masse volumique de l’eau liquide', '1,0 kg·L⁻¹, soit 1 000 g·L⁻¹'], ['Comparaison', 'l’air est environ 800 fois moins dense que l’eau']],
    ver: 'La masse volumique de l’air vaut environ 1,2 g·L⁻¹ : 1,0 L d’air pèse environ 1,2 g, et non 1,2 kg. Un litre d’air pèserait autant qu’un litre d’eau, ce qui est faux.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a écrit des kg au lieu de g : environ 1,2 g', '1,0 L d’air pèse environ 1,2 g : l’élève a pris le kilogramme pour le gramme, soit un facteur 1 000.'),
      F('il a oublié que l’air est plus lourd que l’eau', 'L’air est bien moins dense que l’eau : 1 L d’eau pèse 1 kg, 1 L d’air seulement environ 1 g.'),
      F('il a oublié de retirer la masse du dioxygène', 'Le dioxygène fait partie de l’air : la masse mesurée concerne l’air entier, avec tous ses gaz.'),
    ] }),
  P({ id: 'mat2gt-val-teinte-hors', domaine: SOL, niveau: 2, titre: 'Plus foncé que la teinte la plus foncée', plausible: false,
    enonce: 'Une élève compare sa solution à une échelle de teintes dont le tube le plus foncé est à 8 g·L⁻¹. Sa solution est encore plus foncée que ce tube. Elle écrit : « la concentration en masse est de 8 g·L⁻¹ ».',
    reperes: [['Échelle de teintes', 'tubes de concentrations connues, de la plus claire à la plus foncée'], ['Plus foncé', 'plus concentré en espèce colorée'], ['Limite', 'on ne lit pas en dehors de l’échelle']],
    ver: 'Sa solution est plus foncée que le tube à 8 g·L⁻¹ : elle est plus concentrée que 8 g·L⁻¹. L’échelle ne permet pas de conclure : il faut diluer la solution, puis comparer à nouveau.',
    q2: 'Que doit-elle écrire ou faire ?',
    options: [
      V('sa concentration dépasse 8 g·L⁻¹ : diluer puis comparer', 'Plus foncée veut dire plus concentrée : au-delà de l’échelle, on dilue la solution pour la ramener dans l’échelle.'),
      F('une solution plus foncée est forcément moins concentrée', 'C’est l’inverse : une teinte plus foncée correspond à plus d’espèce colorée dissoute.'),
      F('l’échelle de teintes ne s’utilise que pour des gaz', 'Une échelle de teintes sert à doser une espèce colorée en solution. Ce n’est pas le problème ici.'),
    ] }),

  P({ id: 'mat2gt-val-exo-sens', domaine: EQ, niveau: 1, titre: 'Une température qui monte', plausible: false,
    enonce: 'Un élève mélange deux solutions et note que la température du mélange passe de 20 °C à 35 °C. Il écrit : « la transformation est endothermique, car elle dégage de la chaleur ».',
    reperes: [['Endothermique', 'le système reçoit de l’énergie du milieu : la température du milieu baisse'], ['Exothermique', 'le système cède de l’énergie au milieu : la température du milieu monte'], ['Mesure', '20 °C avant, 35 °C après']],
    ver: 'Une transformation qui réchauffe le milieu cède de l’énergie : elle est exothermique. Le mot endothermique est employé quand la température du milieu baisse.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('une transformation qui réchauffe le milieu est exothermique', 'Le milieu se réchauffe : il reçoit de l’énergie de la transformation. C’est le propre d’une transformation exothermique.'),
      F('il a lu le thermomètre à l’envers : 35 °C est plus froid que 20 °C', 'Le thermomètre est correctement lu : 35 °C est plus chaud que 20 °C. L’erreur est dans le vocabulaire.'),
      F('une température qui monte prouve qu’aucune transformation n’a eu lieu', 'Au contraire : la variation de température est un indice d’une transformation chimique.'),
    ] }),

  P({ id: 'mat2gt-val-nature-combustion', domaine: NUC, niveau: 2, titre: 'Une combustion qui libère beaucoup d’énergie', plausible: false,
    enonce: 'Un élève écrit : « CH₄ + 2 O₂ → CO₂ + 2 H₂O libère beaucoup d’énergie, c’est donc une transformation nucléaire ».',
    reperes: [['Transformation chimique', 'les atomes sont réarrangés, leurs noyaux ne changent pas'], ['Transformation nucléaire', 'des noyaux sont transformés en d’autres noyaux'], ['Écriture', 'les formules CH₄, O₂, CO₂ et H₂O sont des molécules']],
    ver: 'Les mêmes atomes C, H et O se retrouvent des deux côtés : seuls leurs partenaires changent. Les noyaux ne changent pas, c’est une transformation chimique (une combustion), même si elle libère de l’énergie.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('les atomes sont réarrangés sans changer de noyau : chimique', 'Dans la combustion du méthane, aucun noyau ne change : les atomes C, H et O se retrouvent dans d’autres molécules.'),
      F('une transformation nucléaire ne libère jamais d’énergie sous forme de chaleur', 'Une transformation nucléaire (fusion, fission) libère au contraire beaucoup d’énergie, plus encore qu’une combustion.'),
      F('les équations nucléaires ne contiennent jamais de molécules ni d’états physiques', 'Ce n’est pas une règle utile ici : la raison est que les noyaux ne changent pas dans cette équation.'),
    ] }),
  P({ id: 'mat2gt-val-soleil-duree', domaine: NUC, niveau: 3, titre: 'Le Soleil ne peut pas brûler', plausible: true,
    enonce: 'Un élève écrit : « si le Soleil brûlait comme du bois, il s’éteindrait en quelques milliers d’années. Or il brille depuis environ 4,6 milliards d’années, donc son énergie ne vient pas d’une combustion ».',
    reperes: [['Durée de vie du Soleil', 'environ 4,6 milliards d’années'], ['Combustion', 'réarrangement d’atomes : peu d’énergie par kilogramme'], ['Fusion nucléaire', 'transformation de noyaux : bien plus d’énergie par kilogramme']],
    ver: 'Le raisonnement est juste : une combustion libère trop peu d’énergie par kilogramme pour alimenter le Soleil pendant des milliards d’années. La fusion de noyaux d’hydrogène libère bien plus d’énergie pour la même masse.',
    q2: 'Pourquoi ce raisonnement est-il valable ?',
    options: [
      V('la fusion libère bien plus d’énergie par kilogramme qu’une combustion', 'Pour la même masse de combustible, la fusion nucléaire libère des millions de fois plus d’énergie : le Soleil brille très longtemps.'),
      F('le Soleil ne contient pas d’hydrogène, donc il ne peut pas brûler', 'Le Soleil est surtout formé d’hydrogène : c’est le combustible de la fusion nucléaire qui s’y produit.'),
      F('une combustion libère toujours plus d’énergie qu’une fusion nucléaire', 'C’est l’inverse : une fusion libère bien plus d’énergie par kilogramme qu’une combustion.'),
    ] }),
];
