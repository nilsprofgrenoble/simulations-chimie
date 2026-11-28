// Exercices ANA et VAL ajoutés pour les chapitres BTS « Analyse » (lot 2) : mesures et contrôles, titrages,
// chromatographie, étalonnage, RMN, cristallographie, sélectivités. Chaque exercice est adossé à une capacité du référentiel BTS MDC (S5, S6).
// Branchés dans AtelierAnalyserBanque.js (PREVOIR) et AtelierValiderBanque.js (PLAUSIBLES).
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = (o) => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });
const MES = 'Mesures et contrôles (BTS)';

const ANA_MES = [
  // ── Mesures et contrôles ──
  { id: 'mes-bts-sys-aleatoire', domaine: MES, titre: 'Juste, fidèle, ou ni l’un ni l’autre ?',
    enonce: 'Un matériau de référence certifié contient 50,0 mg·L⁻¹ d’un analyte. Un technicien le dose 10 fois : moyenne 52,3 mg·L⁻¹, écart-type 0,1 mg·L⁻¹. On suppose les résultats distribués selon une loi normale : l’écart-type de la moyenne est alors d’environ 0,03 mg·L⁻¹.', q: 'Que peut-on conclure sur la méthode ?', options: [
      V('Fidèle mais pas juste : dispersion faible, erreur systématique d’environ +2,3 mg·L⁻¹', 'La justesse se juge sur l’écart entre la moyenne et la valeur de référence (2,3, très supérieur à 0,03) ; la fidélité sur la dispersion (0,1, faible).'),
      F('Juste mais pas fidèle : les résultats sont dispersés autour de la valeur certifiée de 50,0', 'Les résultats sont très groupés (0,1) mais centrés sur 52,3, pas sur 50,0 : c’est l’inverse.'),
      F('Ni juste ni fidèle : un écart à la valeur certifiée suffit à disqualifier la fidélité', 'La fidélité ne concerne que la dispersion des résultats entre eux, pas leur écart à la référence.'),
    ] },
  { id: 'mes-bts-correction-systematique', domaine: MES, titre: 'Corriger une erreur systématique',
    enonce: 'Une balance affiche toujours 0,8 mg de trop, quelle que soit la masse pesée (erreur systématique constante). Un opérateur veut obtenir des résultats justes.', q: 'Quelle action est efficace ?', options: [
      V('Étalonner la balance avec une masse de référence, ou corriger du décalage', 'Une erreur systématique a un signe et une valeur reproductibles : on la corrige par étalonnage ou par une correction.'),
      F('Répéter chaque pesée vingt fois et faire la moyenne des résultats obtenus ensuite', 'La moyenne réduit l’erreur aléatoire, pas une erreur systématique : le décalage de 0,8 mg reste dans la moyenne.'),
      F('Faire peser chaque échantillon par un opérateur différent à chaque fois', 'Changer d’opérateur ne supprime pas un décalage de l’appareil : l’erreur est liée à la balance.'),
    ] },
  { id: 'mes-bts-chaine-etendue', domaine: MES, titre: 'Choisir une chaîne de mesure',
    enonce: 'Cahier des charges : peser environ 10 mg de produit avec une résolution de 0,1 mg. Deux balances sont disponibles : A (étendue 0 – 220 g, résolution 0,1 mg) ; B (étendue 0 – 6 kg, résolution 0,01 g).', q: 'Quelle balance choisir ?', options: [
      V('La balance A : résolution suffisante et 10 mg dans son étendue', 'Il faut une résolution au moins égale à celle du cahier des charges, et une valeur à mesurer comprise dans l’étendue.'),
      F('La balance B : son étendue plus grande permet de mesurer plus de masses', 'Une grande étendue ne compense pas une résolution trop grossière : B ne distingue que 0,01 g = 10 mg.'),
      F('Aucune des deux : une balance ne peut pas mesurer une masse aussi petite', 'La balance A convient : sa résolution (0,1 mg) est 100 fois plus fine que 10 mg.'),
    ] },
  { id: 'mes-bts-temps-reponse', domaine: MES, titre: 'Lire trop tôt avec un capteur lent',
    enonce: 'Une sonde de température a un temps de réponse long. On la plonge dans un bain à 80 °C alors qu’elle est à 20 °C, et on lit l’affichage au bout de quelques secondes seulement. On suppose que la sonde s’approche de la température du bain progressivement (réponse du premier ordre).', q: 'Que lit-on ?', options: [
      V('Une valeur inférieure à 80 °C : la sonde n’a pas fini de s’échauffer', 'Le temps de réponse est la durée nécessaire pour que l’indication se rapproche de la valeur réelle ; il faut attendre la stabilisation.'),
      F('Exactement 80 °C, car une sonde sensible donne tout de suite la bonne valeur', 'La sensibilité (variation de l’indication par unité de grandeur) n’a rien à voir avec la vitesse de réponse.'),
      F('Une valeur supérieure à 80 °C, car la sonde dépasse d’abord la valeur finale', 'Dans une réponse du premier ordre, l’indication approche la valeur finale sans la dépasser.'),
    ] },
  { id: 'mes-bts-materiau-reference', domaine: MES, titre: 'Que lire sur le certificat d’un matériau de référence ?',
    enonce: 'Pour qualifier un appareil, on utilise un matériau de référence certifié dont le certificat indique une teneur et plusieurs informations.', q: 'Quelles informations faut-il prendre en compte pour juger si l’appareil donne un résultat juste ?', options: [
      V('La valeur certifiée et son incertitude, à comparer à l’écart observé', 'Un écart n’est significatif que s’il dépasse l’incertitude associée à la valeur certifiée.'),
      F('La valeur certifiée seule, l’incertitude ne concernant que le fabricant du matériau de référence', 'L’incertitude du certificat fait partie de la comparaison : sans elle, on ne peut pas conclure.'),
      F('La moyenne des analyses précédentes du laboratoire, plus fiable que le certificat', 'Un matériau de référence sert justement d’étalon indépendant : on ne le remplace pas par ses propres résultats.'),
    ] },
  { id: 'mes-bts-carte-limite-action', domaine: MES, titre: 'Un point hors de la limite d’action',
    enonce: 'Sur une carte de contrôle, on suit un matériau de référence : cible 100,0 ; limites de surveillance à ± 2 s, limites d’action à ± 3 s. On suppose les résultats distribués selon une loi normale (environ 99,7 % des points entre ± 3 s). Aujourd’hui, le point est à + 3,4 s.', q: 'Quelle décision appliquer ?', options: [
      V('Suspendre les analyses, chercher la cause et corriger avant de continuer', 'Un point hors de la limite d’action est très improbable si la méthode est stable : on suppose une dérive ou un dérèglement.'),
      F('Continuer : un seul point hors limite est normal et se compense au point suivant sur la carte', 'Moins de 0,3 % des points tombent hors de ± 3 s : ce n’est pas un simple hasard.'),
      F('Continuer, en notant seulement que le point est dans la zone de surveillance', 'La zone de surveillance s’arrête à ± 2 s : le point est au-delà de la limite d’action.'),
    ] },
  { id: 'met-fid-intermediaire', domaine: MES, titre: 'Même laboratoire, opérateurs différents',
    enonce: 'Un laboratoire dose le même échantillon sur trois semaines, avec trois opérateurs différents et deux lots de réactifs, avec le même appareil.', q: 'De quel type de fidélité parle-t-on ?', options: [
      V('Fidélité intermédiaire : un seul laboratoire, mais des facteurs qui varient', 'Les conditions varient (temps, opérateurs, réactifs) dans un même laboratoire : c’est entre répétabilité et reproductibilité.'),
      F('Répétabilité : le laboratoire et l’appareil sont les mêmes pour toutes ces mesures-là', 'La répétabilité impose aussi même opérateur et courte durée : ce n’est pas le cas ici.'),
      F('Reproductibilité interlaboratoire : plusieurs personnes ont participé aux mesures', 'Ce type suppose des laboratoires différents ; ici il n’y en a qu’un.'),
    ] },
  { id: 'val-bts-linearite', domaine: MES, titre: 'Quand la droite d’étalonnage s’incurve',
    enonce: 'Une droite d’étalonnage est linéaire de 0 à 8 mg·L⁻¹, puis la courbe s’aplatit. Un échantillon donne un signal correspondant à environ 12 mg·L⁻¹ si l’on prolonge la droite. On suppose que le modèle linéaire n’est valable que dans le domaine testé.', q: 'Que faire ?', options: [
      V('Diluer l’échantillon pour revenir dans le domaine de linéarité testé', 'Hors du domaine de linéarité, le signal n’est plus proportionnel à la concentration.'),
      F('Prolonger la droite : la linéarité observée jusqu’ici se poursuit forcément ensuite', 'Rien ne garantit la linéarité au-delà des étalons : la courbe s’aplatit déjà.'),
      F('Garder le résultat à 12 mg·L⁻¹ : un coefficient R² proche de 1 suffit à le valider', 'R² décrit les points mesurés, pas ce qui se passe au-delà : il ne valide pas une extrapolation.'),
    ] },
  { id: 'val-bts-ld-lq', domaine: MES, titre: 'Entre limite de détection et de quantification',
    enonce: 'Pour une méthode, la limite de détection est 0,3 µg·L⁻¹ et la limite de quantification 1,0 µg·L⁻¹. Un échantillon donne un signal correspondant à 0,5 µg·L⁻¹.', q: 'Que peut-on dire ?', options: [
      V('L’analyte est détecté, mais sa teneur n’est pas assez fiable', 'Au-dessus de la LD, on détecte ; sous la LQ, la quantification est trop incertaine.'),
      F('L’analyte est quantifié : 0,5 µg·L⁻¹ est supérieur à la limite de détection', 'Il faut dépasser la limite de quantification (1,0) pour donner une valeur fiable.'),
      F('L’analyte n’est pas détecté : 0,5 est inférieur à la limite de quantification', 'La détection se juge avec la limite de détection (0,3), que 0,5 dépasse.'),
    ] },
  { id: 'val-bts-specificite', domaine: MES, titre: 'Un interférent gêne le dosage',
    enonce: 'On dose un colorant par spectrophotométrie à 520 nm. L’échantillon contient aussi un composé qui absorbe à 520 nm.', q: 'Que dire de la spécificité de la méthode ?', options: [
      V('Insuffisante : il faut changer de longueur d’onde ou séparer les composés', 'Une méthode est spécifique si la réponse n’est pas perturbée par d’autres espèces que l’analyte.'),
      F('Elle est bonne : l’appareil mesure toujours l’absorbance de l’analyte uniquement ici', 'Le spectrophotomètre mesure l’absorbance totale, toutes espèces confondues.'),
      F('Elle est inchangée : la spécificité dépend seulement de la sensibilité', 'La sensibilité est la pente de la réponse ; la spécificité concerne les interférences.'),
    ] },
  { id: 'inc-bts-elargie', domaine: MES, titre: 'Le facteur d’élargissement k = 2',
    enonce: 'Un résultat est donné avec une incertitude-type u. On le présente avec une incertitude élargie U = 2·u. On suppose une loi normale.', q: 'Que signifie U ?', options: [
      V('x ± U contient la valeur avec un niveau de confiance d’environ 95 %', 'Pour une loi normale, k = 2 correspond à environ 95 % de confiance.'),
      F('x ± U contient la valeur avec une certitude totale, de 100 %, quelle que soit la loi', 'Aucune incertitude élargie finie ne donne 100 % : on parle d’un niveau de confiance.'),
      F('x ± U contient environ 68 % des résultats possibles, soit deux tiers des valeurs', 'Environ 68 % correspond à l’incertitude-type (k = 1).'),
    ] },
  { id: 'inc-bts-ecriture', domaine: MES, titre: 'Écrire U avec deux chiffres significatifs',
    enonce: 'Un dosage donne c = 12,3478 mg·L⁻¹ avec une incertitude élargie U = 0,6342 mg·L⁻¹ (k = 2). Convention : U est écrite avec deux chiffres significatifs, et le résultat est arrondi à la même décimale.', q: 'Quelle écriture est correcte ?', options: [
      V('c = 12,35 ± 0,63 mg·L⁻¹ (k = 2)', 'U = 0,63 a deux chiffres significatifs (rang du centième) ; c est arrondi au centième.'),
      F('c = 12,3 ± 0,6 mg·L⁻¹ (k = 2)', 'Un seul chiffre significatif pour U : la convention en demande deux.'),
      F('c = 12,348 ± 0,63 mg·L⁻¹ (k = 2)', 'Le résultat a plus de décimales que U : les chiffres en trop n’ont pas de sens.'),
    ] },
  { id: 'cap-bts-variabilite', domaine: MES, titre: 'Production ou mesure : d’où vient la dispersion ?',
    enonce: 'Sur une série de lots, la dispersion des résultats est s = 0,9. La répétabilité de la méthode seule est s_r = 0,8 (mêmes unités). On suppose les variances indépendantes et additives.', q: 'Que peut-on conclure ?', options: [
      V('Elle vient surtout de la mesure : la fabrication varie bien moins', 's² = s²(fabrication) + s²(mesure) : 0,81 − 0,64 laisse une part faible à la fabrication.'),
      F('Elle vient surtout de la fabrication : les lots diffèrent beaucoup entre eux', 'La mesure seule explique presque toute la dispersion observée.'),
      F('On ne peut rien conclure : mesure et fabrication ne peuvent pas se comparer ici', 'On peut les comparer par leurs variances si elles sont indépendantes.'),
    ] },
  { id: 'cap-bts-tolerance', domaine: MES, titre: 'Incertitude de la méthode et tolérance',
    enonce: 'Un produit doit avoir une teneur de 5,0 % avec une tolérance de ± 0,2 %. La méthode de dosage disponible a une incertitude élargie de ± 0,2 %.', q: 'La méthode est-elle adaptée pour décider de la conformité ?', options: [
      V('Non : près des limites, on ne peut pas décider si le lot est conforme', 'L’incertitude doit être nettement plus petite que la tolérance, sinon un résultat proche d’une limite reste indécis.'),
      F('Oui : l’incertitude est égale à la tolérance, donc tout résultat est exploitable', 'À égalité, un résultat sur une limite est ambigu.'),
      F('Oui : l’incertitude ne concerne pas la décision, seulement la valeur mesurée', 'La décision de conformité doit tenir compte de l’incertitude.'),
    ] },
];

const VAL_MES = [
  P({ id: 'mes-bts-justesse-faux', domaine: MES, niveau: 2, titre: 'Très groupés donc juste ?', plausible: false,
    enonce: 'Un technicien dose cinq fois un matériau de référence certifié à 10,00 mg·L⁻¹. Il obtient une moyenne de 10,45 mg·L⁻¹ avec un écart-type de 0,02 mg·L⁻¹ et conclut : « résultats très groupés, la méthode est donc juste ».',
    reperes: [['Justesse', 'accord entre la moyenne et la valeur de référence'], ['Fidélité', 'accord des résultats entre eux (dispersion)'], ['Hypothèse', 'incertitude du matériau de référence faible devant l’écart observé']],
    ver: 'Des résultats groupés traduisent la fidélité. La justesse se juge sur l’écart entre la moyenne (10,45) et la référence (10,00) : il est de 0,45, bien supérieur à la dispersion, d’où une erreur systématique.',
    q2: 'Quel raisonnement est correct ?', options: [
      V('Fidèle mais pas juste : la moyenne s’écarte de la valeur certifiée', 'Le faible écart-type ne dit rien sur la justesse.'),
      F('Elle est juste : un faible écart-type prouve l’absence d’erreur systématique', 'Une erreur systématique décale tous les résultats dans le même sens, sans augmenter la dispersion.'),
      F('La méthode n’est ni juste ni fidèle : l’écart à la référence annule la fidélité', 'La fidélité ne dépend pas de la valeur de référence.'),
    ] }),
  P({ id: 'mes-bts-resolution-faux', domaine: MES, niveau: 1, titre: 'Quatre décimales affichées : mesure précise ?', plausible: false,
    enonce: 'Un pH-mètre affiche le pH avec quatre décimales (résolution 0,0001). Un élève conclut : « mon pH = 7,4132 est donc juste à 0,0001 près ».',
    reperes: [['Résolution', 'plus petite variation affichée'], ['Justesse et incertitude', 'dépendent de l’étalonnage et de la qualité de la chaîne, pas de l’afficheur']],
    ver: 'La résolution est la plus petite variation que l’appareil peut afficher ; elle ne garantit pas l’exactitude. L’étalonnage et les incertitudes (tampons, électrode, température) sont en général bien plus grands que 0,0001.',
    q2: 'Quel raisonnement est correct ?', options: [
      V('Non : la résolution n’est pas l’incertitude, qui dépend de l’étalonnage', 'Les chiffres affichés ne sont pas tous significatifs.'),
      F('Oui : une résolution fine garantit une mesure juste jusqu’au dernier chiffre', 'Une résolution fine n’empêche pas une erreur systématique.'),
      F('Oui : à condition de répéter la mesure deux fois sur le même échantillon', 'Répéter ne corrige pas un décalage de l’étalonnage.'),
    ] }),
  P({ id: 'mes-bts-carte-tendance', domaine: MES, niveau: 2, titre: 'Sept points du même côté de la cible', plausible: false,
    enonce: 'Sur une carte de contrôle, les sept derniers points sont tous au-dessus de la cible, mais tous à l’intérieur des limites de surveillance. Un opérateur conclut : « aucun point hors limite, tout va bien ».',
    reperes: [['Hypothèse', 'sans dérive, chaque point est au-dessus ou au-dessous de la cible avec la même probabilité'], ['Carte de contrôle', 'les limites de surveillance encadrent la cible']],
    ver: 'Sans dérive, sept points du même côté (haut ou bas) arrivent avec une probabilité d’environ 1 sur 64 : c’est un signal de dérive, même si aucune limite n’est franchie.',
    q2: 'Quelle décision est la plus adaptée ?', options: [
      V('Vérifier l’appareillage : la règle signale une dérive sans point hors limite', 'Les règles de décision tiennent compte des séries de points.'),
      F('Ne rien faire : seuls les points hors des limites comptent pour décider', 'Une série de points d’un même côté est un signal à part entière.'),
      F('Recalculer les limites avec ces sept points pour que la carte redevienne normale', 'Recalculer les limites masquerait la dérive au lieu de l’expliquer.'),
    ] }),
];

const TIT = 'Titrages (BTS)';
const ANA_TIT = [
  { id: 'tit-cond-allure', domaine: TIT, titre: 'Allure d’un titrage conductimétrique',
    enonce: 'On titre une solution d’acide chlorhydrique (H⁺ + Cl⁻) par de la soude concentrée (Na⁺ + HO⁻), en suivant la conductivité σ. On néglige la dilution (titrant concentré). Les ions H⁺ conduisent beaucoup mieux que les ions Na⁺.', q: 'Comment évolue σ avant l’équivalence ?', options: [
      V('Elle diminue : H⁺ consommés, remplacés par des Na⁺ moins conducteurs', 'Avant l’équivalence, H⁺ + HO⁻ → H₂O : H⁺ disparaît, Na⁺ apparaît ; Cl⁻ est spectateur.'),
      F('Elle augmente : on ajoute des ions Na⁺ et HO⁻ dans la solution à chaque goutte versée', 'Les HO⁻ sont consommés par la réaction : ils ne s’accumulent qu’après l’équivalence.'),
      F('Elle reste constante : les ions spectateurs fixent seuls la conductivité', 'Les H⁺ très conducteurs sont remplacés par des Na⁺ moins conducteurs : σ varie.'),
    ] },
  { id: 'tit-indicateur-choix', domaine: TIT, titre: 'Indicateur coloré pour un titrage (BTS)',
    enonce: 'On titre l’acide éthanoïque (acide faible) par la soude. À l’équivalence, la solution contient l’ion éthanoate, base faible : son pH est supérieur à 7. Zones de virage : hélianthine 3,1 – 4,4 ; bleu de bromothymol 6,0 – 7,6 ; phénolphtaléine 8,2 – 10,0.', q: 'Quel indicateur convient ?', options: [
      V('La phénolphtaléine, dont la zone de virage contient le pH basique de l’équivalence', 'L’indicateur doit virer au voisinage du pH à l’équivalence.'),
      F('L’hélianthine, car une zone de virage acide signale plus tôt la fin du titrage', 'Elle virerait bien avant l’équivalence : le volume serait sous-estimé.'),
      F('Le bleu de bromothymol, car le pH d’un point d’équivalence est toujours proche de 7', 'Pour un acide faible titré par une base forte, le pH à l’équivalence est basique.'),
    ] },
  { id: 'tit-prec-mohr', domaine: TIT, titre: 'Fin de titrage par précipitation (méthode de Mohr)',
    enonce: 'On dose des ions chlorure par une solution d’ions argent Ag⁺, avec quelques gouttes de chromate de potassium comme indicateur. Dans les conditions du dosage, AgCl (blanc) précipite en premier ; Ag₂CrO₄ (rouge brique) ne précipite que lorsque Ag⁺ est en excès.', q: 'Que signale l’apparition de la couleur rouge brique ?', options: [
      V('Les chlorures sont épuisés : l’excès d’Ag⁺ précipite avec le chromate', 'Le chromate joue le rôle d’indicateur de fin de réaction.'),
      F('Le précipité de chlorure d’argent vient de se dissoudre sous l’action des chromates', 'AgCl ne se redissout pas : la couleur vient d’un second précipité.'),
      F('Les ions chromate ont réagi les premiers avec Ag⁺, puis les chlorures ont commencé à réagir', 'Dans les conditions données, AgCl précipite en premier.'),
    ] },
  { id: 'tit-prec-conduct', schema: { type: 'titrage', sonde: 'conductimètre', burette: 'nitrate d’argent', becher: 'chlorure de sodium' }, domaine: TIT, titre: 'Conductivité pendant un titrage par précipitation',
    enonce: 'On titre une solution de chlorure de sodium (Na⁺ + Cl⁻) par du nitrate d’argent concentré (Ag⁺ + NO₃⁻), en suivant σ. AgCl précipite ; on néglige la dilution. Les ions Cl⁻ et NO₃⁻ ont des conductivités molaires ioniques voisines.', q: 'Comment évolue σ avant l’équivalence ?', options: [
      V('Elle varie peu : chaque Cl⁻ consommé est remplacé par un NO₃⁻ de conductivité voisine', 'Ag⁺ forme AgCl avec Cl⁻, alors que NO₃⁻ apparaît dans la solution : l’échange est neutre.'),
      F('Elle chute fortement : les ions Ag⁺ et Cl⁻ disparaissent de la solution en même temps', 'Ag⁺ et Cl⁻ disparaissent, mais NO₃⁻ est ajouté en même quantité.'),
      F('Elle augmente fortement : tous les ions ajoutés restent en solution', 'Ag⁺ est consommé par la précipitation avant l’équivalence.'),
    ] },
  { id: 'tit-cplx-indicateur', domaine: TIT, titre: 'Indicateur coloré d’un titrage par complexation',
    enonce: 'On dose les ions Ca²⁺ et Mg²⁺ d’une eau par l’EDTA. L’indicateur (noir ériochrome T) forme avec ces ions un complexe rouge-violet ; libre, il est bleu. Le complexe ion–EDTA est plus stable que le complexe ion–indicateur.', q: 'Que se passe-t-il à l’équivalence ?', options: [
      V('L’EDTA déplace l’indicateur : la solution passe du rouge-violet au bleu', 'Une fois les ions libres consommés, l’EDTA capte ceux de l’indicateur, qui redevient libre.'),
      F('L’EDTA détruit l’indicateur : la solution se décolore alors complètement', 'L’indicateur n’est pas détruit, il est libéré et redevient bleu.'),
      F('L’indicateur déplace l’EDTA de son complexe et la solution reste rouge-violet', 'Le complexe avec l’EDTA est le plus stable : l’EDTA ne cède pas ses ions.'),
    ] },
  { id: 'tit-cplx-ph', domaine: TIT, titre: 'Pourquoi tamponner à pH 10 ?',
    enonce: 'Le dosage de la dureté d’une eau par l’EDTA est réalisé dans une solution tampon à pH ≈ 10. L’EDTA est un tétra-acide : sa forme complexante est Y⁴⁻.', q: 'Pourquoi imposer ce pH ?', options: [
      V('À pH plus bas, Y⁴⁻ est protoné et complexe moins ; le pH doit rester constant', 'Le pH influence la complexation, car l’EDTA est un ligand basique en compétition avec H⁺.'),
      F('Parce que les ions calcium et magnésium ne sont solubles qu’en milieu très acide', 'Ces ions sont solubles en milieu neutre ; Mg²⁺ précipite en milieu très basique.'),
      F('Parce que l’indicateur coloré ne vire que si la solution contient de la soude concentrée', 'Un tampon n’est pas une solution de soude concentrée.'),
    ] },
];
const VAL_TIT = [
  P({ id: 'tit-prec-eau-salee', domaine: TIT, niveau: 1, titre: 'Chlorure dans une eau salée diluée', plausible: false,
    enonce: 'Une eau de mer est diluée 100 fois. On dose 20,0 mL de la solution diluée par Ag⁺ à 0,0100 mol·L⁻¹ : V_E = 11,2 mL (réaction 1 Ag⁺ pour 1 Cl⁻). Un élève trouve [Cl⁻] = 5,6×10⁻³ mol·L⁻¹ et l’annonce comme concentration de l’eau de mer.',
    reperes: [['Eau de mer', '[Cl⁻] ≈ 0,5 à 0,6 mol·L⁻¹'], ['Dilution', 'facteur 100'], ['Eau du robinet', '[Cl⁻] ≈ 10⁻³ mol·L⁻¹']],
    ver: 'Le dosage donne bien 5,6×10⁻³ mol·L⁻¹ dans la solution diluée. L’élève a oublié le facteur de dilution : 100 × 5,6×10⁻³ = 0,56 mol·L⁻¹, valeur attendue pour l’eau de mer.',
    q2: 'Quelle erreur explique le mieux ce résultat ?', options: [
      V('Il a oublié de multiplier par le facteur de dilution', 'Sa valeur est celle d’une eau douce.'),
      F('Il a utilisé le volume équivalent au lieu du volume de la prise d’essai', 'Le calcul de c = c_Ag·V_E/V reste cohérent.'),
      F('Il a utilisé un rapport stœchiométrique de 2 Ag⁺ pour 1 Cl⁻', 'La stœchiométrie est de 1 pour 1.'),
    ] }),
  P({ id: 'tit-cplx-eau-dure', domaine: TIT, niveau: 2, titre: 'Dureté d’une eau du robinet', plausible: false,
    enonce: 'On dose 100,0 mL d’eau du robinet par l’EDTA à 0,0100 mol·L⁻¹ (réaction 1 pour 1) : V_E = 15,0 mL. Un élève annonce un titre hydrotimétrique de 150 °f.',
    reperes: [['Titre hydrotimétrique', '1 °f correspond à 1,0×10⁻⁴ mol·L⁻¹ de Ca²⁺ et Mg²⁺'], ['Eaux courantes', 'de 5 à 40 °f environ']],
    ver: 'n = 0,0100 × 15,0×10⁻³ = 1,50×10⁻⁴ mol dans 0,1000 L : 1,50×10⁻³ mol·L⁻¹, soit 15 °f. 150 °f dépasse toute eau courante : erreur d’un facteur 10.',
    q2: 'Quelle explication est la plus probable ?', options: [
      V('Il s’est trompé d’un facteur 10 dans la conversion en degrés français', 'La valeur correcte est 15 °f.'),
      F('Son eau est exceptionnellement dure, bien au-delà de toutes les eaux courantes', 'Aucune eau de robinet n’atteint 150 °f.'),
      F('Il a utilisé 150 mL d’eau au lieu des 100 mL prélevés', 'Cela ne changerait la valeur que de 50 %.'),
    ] }),
];

const CHR = 'Chromatographie et spectrométrie de masse (BTS)';
const ANA_CHR = [
  { id: 'chr-ccm-rf', domaine: CHR, titre: 'Rapport frontal d’une tache',
    enonce: 'Sur une plaque de CCM, la ligne de dépôt est à 1,0 cm du bas, le front de l’éluant à 6,0 cm du bas, et le centre d’une tache à 3,0 cm du bas. Le rapport frontal est le rapport de la distance parcourue par l’espèce à celle parcourue par le front, depuis la ligne de dépôt.', q: 'Quel est le rapport frontal de cette espèce ?', options: [
      V('0,40 : 2,0 cm pour l’espèce, 5,0 cm pour le front', 'On mesure les distances à partir de la ligne de dépôt.'),
      F('0,50 : 3,0 cm depuis le bas pour 6,0 cm du front, soit la moitié', 'Les distances se mesurent depuis la ligne de dépôt, pas depuis le bas.'),
      F('2,5 : le rapport du front à la distance parcourue par l’espèce', 'Le rapport frontal est inférieur à 1.'),
    ] },
  { id: 'chr-ccm-ordre', domaine: CHR, titre: 'Qui migre le plus loin sur silice ?',
    enonce: 'Une CCM sur silice (phase stationnaire polaire) est éluée par un solvant peu polaire (phase mobile). Deux composés sont déposés : un alcool polaire A et un hydrocarbure apolaire B.', q: 'Quel est l’ordre de migration attendu ?', options: [
      V('B migre plus loin que A : A, polaire, est davantage retenu par la silice polaire', 'Plus un composé interagit avec la phase stationnaire, moins il migre.'),
      F('A migre plus loin que B : un composé polaire est entraîné facilement par l’éluant', 'Avec un éluant peu polaire, c’est l’inverse.'),
      F('A et B migrent à la même hauteur, car le solvant impose la vitesse de tous', 'Les composés se séparent grâce à des affinités différentes.'),
    ] },
  { id: 'chr-ccm-temoin', schema: { type: 'plaqueCCM' }, domaine: CHR, titre: 'Identifier par comparaison à un témoin',
    enonce: 'Un produit de synthèse et un témoin du produit attendu ont le même rapport frontal dans un éluant donné, sur la même plaque.', q: 'Que peut-on conclure ?', options: [
      V('Probablement identiques ; on confirme avec un autre éluant', 'Deux espèces différentes peuvent avoir le même Rf dans un éluant donné.'),
      F('Identiques avec certitude : un même Rf dans un éluant prouve la même espèce', 'Un seul éluant ne suffit pas.'),
      F('Différents : deux espèces distinctes ne peuvent pas avoir le même rapport frontal', 'Le même Rf est cohérent avec la même espèce.'),
    ] },
  { id: 'chr-cpg-elements', domaine: CHR, titre: 'Les éléments d’un appareil de CPG',
    enonce: 'Un appareil de chromatographie en phase gazeuse comporte un injecteur, une colonne, un four et un détecteur.', q: 'Dans quel ordre l’échantillon rencontre-t-il ces éléments ?', options: [
      V('Injecteur, puis colonne (placée dans le four), puis détecteur', 'La colonne est thermostatée dans le four.'),
      F('Four, puis injecteur, puis colonne, puis détecteur en sortie', 'Le four n’est pas une étape séparée : il contient la colonne.'),
      F('Injecteur, puis détecteur, puis colonne pour séparer les espèces détectées', 'Le détecteur est en sortie, après la séparation.'),
    ] },
  { id: 'chr-cpg-colonne-polarite', domaine: CHR, titre: 'Colonne apolaire et alcanes',
    enonce: 'On analyse en CPG un mélange d’alcanes linéaires sur une colonne apolaire, avec le même programme de température. On suppose que l’ordre de sortie n’est lié qu’à la volatilité.', q: 'Quel est l’ordre de sortie ?', options: [
      V('Par température d’ébullition croissante : le plus volatil sort en premier', 'Sur colonne apolaire, la rétention suit la volatilité.'),
      F('Par température d’ébullition décroissante : le moins volatil sort en premier', 'Un composé peu volatil passe peu en phase gazeuse.'),
      F('Dans un ordre sans lien avec la volatilité, fixé par la polarité de chaque alcane', 'Les alcanes sont tous apolaires.'),
    ] },
  { id: 'chr-clhp-pression', domaine: CHR, titre: 'Pression anormalement élevée en CLHP',
    enonce: 'Pendant une analyse par CLHP, la pression indiquée par la pompe monte nettement au-dessus de sa valeur habituelle, à débit constant.', q: 'Quelle est la cause la plus probable ?', options: [
      V('Un bouchage, par exemple un fritté ou une tête de colonne encrassés', 'Un obstacle augmente la résistance à l’écoulement.'),
      F('Une fuite au niveau d’un raccord entre la pompe et la colonne, à la sortie', 'Une fuite fait baisser la pression.'),
      F('Une lampe de détecteur usée, qui ferait monter la pression de la pompe', 'La lampe n’agit pas sur la pression.'),
    ] },
  { id: 'chr-clhp-phase-inverse', domaine: CHR, titre: 'Ordre de sortie en phase inverse',
    enonce: 'En CLHP en phase inverse (colonne C18 apolaire, éluant eau / acétonitrile), on injecte un composé très polaire P et un composé apolaire A.', q: 'Quel composé sort en premier ?', options: [
      V('Le composé polaire P : peu retenu par C18, entraîné par l’éluant polaire', 'En phase inverse, le polaire sort en premier.'),
      F('Le composé apolaire A : il est très soluble dans l’éluant et traverse sans retard', 'A est retenu par la phase apolaire.'),
      F('Les deux en même temps : la phase C18 ne retient aucun des deux', 'La séparation repose sur des rétentions différentes.'),
    ] },
  { id: 'chr-quant-normalisation', domaine: CHR, titre: 'Contrainte de la normalisation interne',
    enonce: 'Par normalisation interne, on calcule la proportion de chaque composé par le rapport de son aire à la somme de toutes les aires du chromatogramme.', q: 'Quelle condition doit être remplie ?', options: [
      V('Tous les constituants sont élués et détectés avec des réponses voisines', 'Un composé non élué fausse le total.'),
      F('Un étalon interne est ajouté en quantité connue avant l’injection de chaque échantillon dosé', 'Cela décrit l’étalonnage interne.'),
      F('Les étalons de concentration connue sont injectés avant l’échantillon', 'Cela décrit l’étalonnage externe.'),
    ] },
  { id: 'chr-quant-externe', domaine: CHR, titre: 'Contrainte de l’étalonnage externe',
    enonce: 'Pour doser un composé par étalonnage externe, on injecte des solutions étalons puis l’échantillon.', q: 'Quel paramètre doit être particulièrement bien reproductible ?', options: [
      V('Le volume injecté, identique pour les étalons et l’échantillon', 'Sans étalon interne, une variation de volume change directement l’aire.'),
      F('La masse molaire du composé, qui change à chaque injection', 'La masse molaire est constante.'),
      F('Le choix d’un étalon interne dont le pic est séparé de celui de l’analyte', 'L’étalonnage externe n’utilise pas d’étalon interne.'),
    ] },
  { id: 'chr-sm-isotopes', domaine: CHR, titre: 'Un pic M+2 trois fois plus petit',
    enonce: 'Le spectre de masse d’un composé organique montre un pic parent à m/z = 112 et un pic à m/z = 114 d’intensité environ trois fois plus faible. Le chlore existe sous forme de deux isotopes, ³⁵Cl et ³⁷Cl, dans le rapport d’environ 3 pour 1.', q: 'Que suggère ce couple de pics ?', options: [
      V('La molécule contient un atome de chlore, présent sous ses deux isotopes', 'Les molécules à ³⁵Cl donnent le pic M, celles à ³⁷Cl le pic M+2.'),
      F('La molécule contient deux atomes de carbone, dont l’un est un isotope plus lourd, le carbone 13', 'Le carbone 13 donne un petit pic M+1 d’environ 1 %.'),
      F('La molécule est instable et perd deux unités de masse par fragmentation, d’où le pic à 114', 'Un fragment apparaît à une masse plus faible.'),
    ] },
  { id: 'chr-sm-pic-base', domaine: CHR, titre: 'Pic de base et pic parent',
    enonce: 'Dans un spectre de masse, le pic le plus intense (pic de base) est à m/z = 43 ; le pic de plus grand m/z de la molécule est à m/z = 86 avec une intensité faible.', q: 'Quelle lecture est correcte ?', options: [
      V('La masse molaire est 86 g·mol⁻¹ ; le pic de base est un fragment très stable', 'Le pic parent est celui de plus grand m/z.'),
      F('La masse molaire est 43 g·mol⁻¹, car le pic le plus intense représente la molécule', 'Le pic le plus intense n’est pas forcément l’ion moléculaire.'),
      F('La masse molaire est 129 g·mol⁻¹, somme des deux pics', 'Les pics ne s’additionnent pas.'),
    ] },
];

const ETA = 'Dosages par étalonnage (BTS)';
const ANA_ETA = [
  { id: 'dosage-alteration-soude', domaine: ETA, titre: 'Une solution de soude qui vieillit',
    enonce: 'Une solution de soude à 0,100 mol·L⁻¹, préparée il y a trois mois et conservée dans un flacon mal fermé, est titrée : on trouve 0,094 mol·L⁻¹.', q: 'Quelle est la cause la plus probable ?', options: [
      V('Le CO₂ de l’air a réagi avec la soude, qui est consommée', 'La soude est une solution de conservation limitée.'),
      F('L’eau du flacon s’est évaporée, ce qui a dilué la soude restante', 'L’évaporation concentrerait la solution.'),
      F('La soude a été réduite par la lumière, comme le permanganate', 'La lumière n’altère pas la soude.'),
    ] },
  { id: 'dosage-verrerie-in-ex', domaine: ETA, titre: 'Verrerie In et Ex',
    enonce: 'Pour préparer une solution étalon, on utilise une fiole jaugée (verrerie In) et une pipette jaugée (verrerie Ex).', q: 'Que signifie cette distinction ?', options: [
      V('La fiole contient le volume indiqué ; la pipette délivre le volume indiqué en s’écoulant', 'In : contient ; Ex : délivre.'),
      F('La fiole délivre le volume indiqué ; la pipette contient le volume indiqué', 'C’est l’inverse.'),
      F('Les deux contiennent le volume indiqué : il faut donc rincer la pipette avec de l’eau distillée', 'La pipette délivre ; on la rince avec la solution.'),
    ] },
  { id: 'dosage-gamme', domaine: ETA, titre: 'Un échantillon plus concentré que les étalons',
    enonce: 'Une gamme d’étalons donne des absorbances de 0,10 à 1,00. L’échantillon a une absorbance de 1,90. On suppose la gamme linéaire sur son domaine.', q: 'Que faire ?', options: [
      V('Diluer l’échantillon pour ramener l’absorbance dans la gamme', 'On ne sait pas si la droite reste valable au-delà.'),
      F('Prolonger la droite d’étalonnage jusqu’à l’absorbance de 1,90 mesurée', 'Extrapoler est risqué.'),
      F('Réduire la gamme d’étalons aux deux valeurs extrêmes, 0,10 et 1,00', 'Deux points ne valident pas la linéarité.'),
    ] },
  { id: 'dosage-cond-proportion', domaine: ETA, titre: 'Conductivité et concentration',
    enonce: 'On dose une solution diluée de chlorure de sodium par étalonnage conductimétrique : σ est proportionnelle à la concentration (loi de Kohlrausch, solution diluée).', q: 'Un étalon est dilué 2 fois. Que devient sa conductivité ?', options: [
      V('Divisée par 2 : σ est proportionnelle à la concentration (solution diluée)', 'Loi de Kohlrausch : σ = Σ λᵢ cᵢ.'),
      F('Elle est divisée par 4 : la conductivité varie comme le carré de la concentration', 'La dépendance est linéaire.'),
      F('Elle ne change pas : la conductivité est une propriété de l’eau', 'Elle dépend de la concentration des ions.'),
    ] },
  { id: 'dosage-cond-temperature', domaine: ETA, titre: 'Température et conductimétrie',
    enonce: 'La conductivité d’une solution augmente d’environ 2 % par degré. Les étalons sont à 20 °C ; l’échantillon, sorti d’un réfrigérateur, est à 10 °C.', q: 'Que faire ?', options: [
      V('Mettre étalons et échantillon à la même température avant la mesure', 'Sinon l’écart de température fausse le résultat.'),
      F('Mesurer tout de suite, la température n’intervenant que sur le pH du milieu', 'Elle agit aussi sur σ.'),
      F('Mesurer et ajouter 20 % au résultat sans connaître l’appareil', 'Une correction approximative est moins fiable.'),
    ] },
  { id: 'dosage-ise-force-ionique', domaine: ETA, titre: 'Électrode spécifique et force ionique',
    enonce: 'L’électrode spécifique répond à l’activité de l’ion dosé. On ajoute la même solution d’ajustement de force ionique aux étalons et à l’échantillon.', q: 'Quel est l’intérêt ?', options: [
      V('Force ionique identique : activité et concentration restent proportionnelles', 'Le coefficient d’activité devient constant.'),
      F('Elle augmente l’activité de l’ion dosé pour rendre le potentiel mesuré plus élevé', 'Ce n’est pas le but.'),
      F('Elle remplace l’étalonnage, la droite n’étant plus nécessaire pour le dosage', 'L’étalonnage reste nécessaire.'),
    ] },
  { id: 'dosage-ise-droite', domaine: ETA, titre: 'Droite d’étalonnage d’une électrode spécifique',
    enonce: 'Le potentiel d’une électrode spécifique varie avec le logarithme de la concentration, à force ionique constante.', q: 'Quelle représentation donne une droite ?', options: [
      V('Le potentiel E en fonction de log c', 'E est une fonction affine de log c.'),
      F('Le potentiel E en fonction de c', 'La courbe est un logarithme.'),
      F('La concentration c en fonction de log E', 'Ce n’est pas la forme de la loi.'),
    ] },
];
const VAL_ETA = [
  P({ id: 'dosage-cond-unite-faux', domaine: ETA, niveau: 2, titre: 'Conductivité d’une solution de KCl', plausible: false,
    enonce: 'Une solution de KCl à 0,010 mol·L⁻¹ a une conductivité de 1 413 µS·cm⁻¹. Un élève convertit en 1,41 S·m⁻¹.',
    reperes: [['Eau de mer', '≈ 5 S·m⁻¹'], ['Eau du robinet', '≈ 0,05 S·m⁻¹'], ['Unités', 'µS·cm⁻¹ et S·m⁻¹']],
    ver: '1 413 µS·cm⁻¹ = 0,1413 S·m⁻¹. La valeur 1,41 S·m⁻¹ est dix fois trop grande, ce qui est incohérent pour une solution à 0,010 mol·L⁻¹.',
    q2: 'Quelle erreur explique le mieux ce résultat ?', options: [
      V('Il a pris 1 µS·cm⁻¹ = 10⁻³ S·m⁻¹ au lieu de 10⁻⁴ S·m⁻¹', 'Erreur d’une puissance de 10.'),
      F('Il a oublié que la conductivité dépend de la température', 'Cela n’explique pas un facteur 10.'),
      F('Il a confondu conductivité et conductance de la cellule', 'Pas de lien avec le facteur 10.'),
    ] }),
];

const RMN = 'Spectroscopie RMN';
const ANA_RMN = [
  { id: 'rmn-couplage-j-champ', domaine: RMN, titre: 'Constante de couplage à 300 et 600 MHz',
    enonce: 'À 300 MHz, un doublet a ses deux pics écartés de 7 Hz. On enregistre le même échantillon à 600 MHz.', q: 'Quel est l’écart entre les deux pics à 600 MHz ?', options: [
      V('7 Hz : la constante de couplage J ne dépend pas du champ', 'J est en hertz et reste inchangée.'),
      F('14 Hz : tout est doublé avec le champ magnétique', 'Seuls les écarts de déplacement chimique en Hz sont doublés.'),
      F('3,5 Hz : plus le champ est grand, plus un doublet se resserre', 'Ce n’est pas le cas.'),
    ] },
  { id: 'rmn-couplage-reciproque', domaine: RMN, titre: 'Deux groupes qui se couplent',
    enonce: 'Dans un spectre du premier ordre, un quadruplet (CH₂) a une constante J = 7,1 Hz. Il est couplé au CH₃ voisin.', q: 'Quelle est la constante de couplage du triplet du CH₃ ?', options: [
      V('7,1 Hz : deux groupes couplés ont la même constante J', 'Le couplage est réciproque.'),
      F('3,6 Hz : la moitié, car le CH₃ a deux voisins seulement, le CH₂', 'Le nombre de voisins change la multiplicité, pas J.'),
      F('21,3 Hz : le triple, car le CH₃ contient trois H', 'J ne dépend pas du nombre de H.'),
    ] },
  { id: 'rmn-securite-champ', domaine: RMN, titre: 'Près d’un spectromètre RMN',
    enonce: 'Un spectromètre RMN contient un aimant supraconducteur dont le champ reste intense autour de l’appareil.', q: 'Quelle attitude adopter ?', options: [
      V('Retirer cartes et objets métalliques, éloigner les stimulateurs cardiaques', 'Le champ attire les objets ferromagnétiques.'),
      F('Aucune précaution : le champ est limité à l’intérieur de la sonde de l’appareil', 'Le champ de fuite existe.'),
      F('Poser ses outils métalliques sur l’appareil pour les protéger de la poussière', 'Un objet métallique peut être projeté.'),
    ] },
  { id: 'rmn-autre-noyau-f', domaine: RMN, titre: 'Un fluor voisin en RMN du proton',
    enonce: 'Le noyau ¹⁹F, de spin 1/2 et d’abondance naturelle 100 %, se couple aux H comme un H voisin (règle des n + 1). On étudie le 1,1,1-trifluoroéthane CH₃–CF₃.', q: 'Quel est l’aspect du signal des H du CH₃ ?', options: [
      V('Un quadruplet : trois ¹⁹F voisins donnent n + 1 = 4 pics', 'Trois F équivalents : 3 + 1 pics.'),
      F('Un singulet : le carbone voisin ne porte aucun hydrogène, donc aucun couplage', 'Le fluor porte un spin.'),
      F('Un triplet : les trois H du CH₃ se couplent entre eux', 'Des H équivalents ne se couplent pas visiblement.'),
    ] },
  { id: 'rmn-autre-noyau-p', domaine: RMN, titre: 'Un phosphore voisin en RMN du proton',
    enonce: 'Le noyau ³¹P a un spin 1/2 et une abondance de 100 %. Dans le triméthylphosphate (CH₃O)₃P=O, les 9 H sont équivalents. Chaque groupe CH₃ est lié à O, lié à un seul atome de P.', q: 'Quel est l’aspect du signal des H ?', options: [
      V('Un doublet : un seul ³¹P voisin donne n + 1 = 2 pics', 'Un seul noyau couplé.'),
      F('Un singulet : le phosphore ne se couple jamais aux H', 'Le ³¹P a un spin non nul.'),
      F('Un décuplet : les 9 H voisins entre eux donnent n + 1 = 10 pics', 'H équivalents entre eux ne se couplent pas.'),
    ] },
  { id: 'rmn-structure-ester', domaine: RMN, titre: 'Quelle structure pour ce spectre ?',
    enonce: 'Un composé de formule C₄H₈O₂ donne trois signaux en RMN du proton : δ = 1,2 ppm (triplet, 3 H), δ = 2,0 ppm (singulet, 3 H), δ = 4,1 ppm (quadruplet, 2 H).', q: 'Quelle structure est cohérente ?', options: [
      V('CH₃–C(=O)–O–CH₂–CH₃ : CH₃ du C=O (2,0), CH₂ lié à O (4,1)', 'Intégrations 3, 3, 2 et multiplicités cohérentes.'),
      F('CH₃–CH₂–C(=O)–O–CH₃ : un singulet de CH₃ à 2,0 et un quadruplet de CH₂ à 4,1', 'Le CH₃O serait vers 3,7 et le CH₂ vers 2,3.'),
      F('CH₃–CH₂–CH₂–C(=O)–OH : un triplet à 1,2 et un quadruplet à 4,1 pour le CH₂', 'Cette molécule donne plusieurs signaux de multiplicités différentes.'),
    ] },
];
const VAL_RMN = [
  P({ id: 'rmn-val-quadruplet-ch3', domaine: RMN, niveau: 1, titre: 'Le CH₃ du chloroéthane', plausible: false,
    enonce: 'Dans le chloroéthane CH₃–CH₂–Cl, un élève annonce que le signal du CH₃ est un quadruplet « car il contient 3 H, donc 3 + 1 pics ».',
    reperes: [['Règle des (n+1)-uplets', 'un H ayant n H voisins sur le carbone adjacent donne n+1 pics'], ['Voisins du CH₃', 'les 2 H du CH₂']],
    ver: 'Le nombre de pics dépend des H voisins, pas de ceux du groupe. Le CH₃ a 2 H voisins : triplet. C’est le CH₂ qui est un quadruplet.',
    q2: 'Quelle erreur explique le mieux cette réponse ?', options: [
      V('Il a compté les H du groupe lui-même au lieu des H voisins', 'Il faut compter les voisins.'),
      F('Il a oublié que le chlore perturbe le couplage et change la multiplicité', 'Le chlore n’a pas de spin utile.'),
      F('Il a lu le spectre à un champ trop faible pour séparer correctement les pics', 'Le champ change l’écart en hertz entre signaux, mais pas le nombre de pics d’une multiplicité.'),
    ] }),
];

const CRI = 'Analyse cristallographique';
const ANA_CRI = [
  { id: 'cri-amorphe-cristal', domaine: CRI, titre: 'Cristal ou solide amorphe ?',
    enonce: 'Deux solides sont analysés par diffraction des rayons X : le premier donne des pics fins et nombreux, le second un seul massif très large.', q: 'Que peut-on conclure ?', options: [
      V('Le premier est cristallin (ordre à longue distance), le second amorphe', 'Un réseau ordonné diffracte en pics fins.'),
      F('Le premier est amorphe, car il contient plus de pics, donc plus de désordre', 'Plus de pics fins traduit un ordre.'),
      F('Les deux sont cristallins, mais le second a des cristaux plus gros', 'Des cristaux plus gros donneraient des pics plus fins.'),
    ] },
  { id: 'cri-vocabulaire-motif', domaine: CRI, titre: 'Réseau, nœud, motif, maille',
    enonce: 'Le chlorure de sodium est décrit par un réseau cubique à faces centrées. À chaque nœud du réseau est associé un motif.', q: 'Quel est le motif ?', options: [
      V('Un ion Na⁺ et un ion Cl⁻, répétés à chaque nœud du réseau', 'Le motif est le groupe d’entités répété par translation.'),
      F('Un seul ion Cl⁻, les ions Na⁺ se plaçant entre les mailles', 'Le motif contient les deux ions.'),
      F('La maille conventionnelle entière, avec ses huit sommets', 'La maille est le volume, le motif est son contenu répété.'),
    ] },
  { id: 'cri-nature-cristal', domaine: CRI, titre: 'Quelle nature de cristal ?',
    enonce: 'Un solide dur et cassant, fondant vers 800 °C, isolant à l’état solide mais conducteur à l’état fondu.', q: 'Quelle est sa nature ?', options: [
      V('Un solide ionique : les ions sont fixes dans le solide et mobiles à l’état fondu', 'Propriétés typiques d’un cristal ionique.'),
      F('Un métal : il conduit le courant grâce aux électrons de conduction', 'Un métal conduit aussi à l’état solide.'),
      F('Un solide moléculaire : les molécules neutres sont liées par des liaisons faibles', 'Fond bien plus bas et ne conduit pas fondu.'),
    ] },
  { id: 'cri-mecanique-plans', domaine: CRI, titre: 'Malléable ou cassant ?',
    enonce: 'Un morceau de cuivre se déforme sous le marteau, un cristal de sel se brise.', q: 'Comment l’expliquer ?', options: [
      V('Les plans du métal glissent ; dans le sel, des ions de même signe se font face', 'Les répulsions provoquent la rupture.'),
      F('Le cuivre est moins dense que le sel, donc ses liaisons sont bien plus faibles', 'La masse volumique n’explique pas la ductilité.'),
      F('Le sel est amorphe, donc il ne peut pas se déformer sans se rompre', 'Le sel est cristallin.'),
    ] },
  { id: 'cri-alliage-type', domaine: CRI, titre: 'Insertion ou substitution ?',
    enonce: 'Dans l’acier, de petits atomes de carbone sont dans les sites interstitiels du fer. Dans le laiton, des atomes de zinc, de taille voisine de celle du cuivre, remplacent des atomes de cuivre.', q: 'Quels types d’alliages ?', options: [
      V('Acier : alliage d’insertion ; laiton : alliage de substitution', 'Insertion : petits atomes dans les sites.'),
      F('Acier : alliage de substitution ; laiton : alliage d’insertion', 'C’est l’inverse.'),
      F('Les deux sont des alliages d’insertion, car ils contiennent un métal majoritaire', 'Le laiton est de substitution.'),
    ] },
  { id: 'cri-alliage-durete', domaine: CRI, titre: 'Pourquoi un alliage est souvent plus dur',
    enonce: 'Un alliage est souvent plus dur que le métal pur dont il dérive.', q: 'Quelle explication est correcte ?', options: [
      V('Les atomes étrangers gênent le glissement des plans d’atomes', 'La déformation demande plus d’effort.'),
      F('Les atomes étrangers créent des liaisons ioniques entre les plans d’atomes', 'Les liaisons restent métalliques.'),
      F('L’alliage est amorphe, donc sans plans sur lesquels glisser', 'Un alliage reste généralement cristallin.'),
    ] },
];

const SEL = 'Syn, anti et sélectivités (BTS)';
const ANA_SEL = [
  { id: 'sel-stereospecifique', domaine: SEL, titre: 'Réaction stéréospécifique',
    enonce: 'L’addition anti de Br₂ sur le (Z)-but-2-ène et sur le (E)-but-2-ène conduit à des produits stéréoisomères différents.', q: 'Que signifie qu’elle est stéréospécifique ?', options: [
      V('Chaque stéréoisomère du réactif donne un produit stéréoisomère différent', 'Le stéréoisomère du produit dépend de celui du réactif.'),
      F('Un seul stéréoisomère est formé, quel que soit le réactif de départ choisi', 'Cela décrirait une réaction stéréosélective.'),
      F('La réaction donne toujours un mélange racémique', 'Ce n’est pas la définition.'),
    ] },
  { id: 'sel-regio-tertiaire', domaine: 'Régiosélectivité (BTS)', titre: 'Addition de HBr sur un alcène plus substitué',
    enonce: 'HBr s’additionne sur le propène (carbocation secondaire intermédiaire) puis sur le 2-méthylprop-1-ène (carbocation tertiaire possible). Un carbocation est d’autant plus stable qu’il est plus substitué.', q: 'Que prévoit-on pour le second alcène ?', options: [
      V('Un seul produit, issu du carbocation tertiaire plus stable', 'La voie tertiaire est nettement favorisée.'),
      F('Deux produits en quantités égales, car les deux carbocations existent', 'Ils ne sont pas aussi stables.'),
      F('Le produit anti-Markovnikov, issu du carbocation primaire', 'Le carbocation primaire est le moins stable.'),
    ] },
  { id: 'sel-chimio-borohydrure', domaine: 'Chimiosélectivité (BTS)', titre: 'Réduire la cétone sans toucher à l’ester',
    enonce: 'Le 4-oxopentanoate de méthyle contient une cétone et un ester. Dans les conditions usuelles, NaBH₄ réduit aldéhydes et cétones sans réduire les esters, alors que LiAlH₄ réduit les deux.', q: 'Quel réactif pour réduire seulement la cétone ?', options: [
      V('NaBH₄, chimiosélectif de la cétone', 'Il ne réagit pas avec l’ester.'),
      F('LiAlH₄, plus réactif donc plus sélectif', 'Plus réactif, moins sélectif.'),
      F('L’un ou l’autre, car les deux sont des hydrures', 'Ils n’ont pas la même sélectivité.'),
    ] },
];
const VAL_SEL = [
  P({ id: 'sel-protection-acetal', domaine: 'Chimiosélectivité (BTS)', niveau: 3, titre: 'Déprotéger un acétal', plausible: false,
    enonce: 'Pour réduire l’ester d’un composé cétonique par LiAlH₄, on protège la cétone en acétal, puis on propose de déprotéger l’acétal par de la soude aqueuse concentrée.',
    reperes: [['Réduction par LiAlH₄', 'réduit les esters et les cétones ; ne réduit pas les acétals']],
    ver: 'La protection est judicieuse (l’acétal n’est pas réduit par LiAlH₄), mais la déprotection se fait en milieu acide aqueux : la soude ne régénère pas la cétone.',
    q2: 'Quelle critique est correcte ?', options: [
      V('Il faut déprotéger en milieu acide aqueux ; l’acétal résiste aux bases', 'La soude ne l’hydrolyse pas.'),
      F('La protection est inutile : LiAlH₄ ne réduit jamais les cétones, seulement les esters', 'Il les réduit.'),
      F('L’acétal doit être déprotégé avant la réduction pour ne pas perdre l’ester', 'Il faut déprotéger après.'),
    ] }),
];

export const ANALYSE_BTS_ANA = [...ANA_MES, ...ANA_TIT, ...ANA_CHR, ...ANA_ETA, ...ANA_RMN, ...ANA_CRI, ...ANA_SEL];
export const ANALYSE_BTS_VAL = [...VAL_MES, ...VAL_TIT, ...VAL_ETA, ...VAL_RMN, ...VAL_SEL];
