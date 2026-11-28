// Exercices ANA (prévoir sans calculer) et VAL (ça paraît plausible ?) ajoutés aux chapitres de première générale « Ondes mécaniques », « Couleurs »,
// « Image donnée par une lentille mince », « Modèles de la lumière » et « Mesure et incertitudes » (lot 2 : un exercice par capacité exigible qui n'en avait pas).
// Branchés dans AtelierAnalyserBanque.js (PREVOIR) et AtelierValiderBanque.js (PLAUSIBLES). Chaque exercice répond à une capacité du programme de première spécialité.
const D_CEL = 'Ondes mécaniques : célérité et retard';
const D_PER = 'Ondes mécaniques périodiques';
const D_COUL = 'Couleurs : synthèses additive et soustractive, couleur des objets';
const D_LEN = 'Lentille mince';
const D_PHOT = 'Domaines spectraux et énergie d’un photon';
const D_NIV = 'Niveaux d’énergie : absorption, émission et spectres de raies';
const D_MES = 'Mesure et incertitudes (1G)';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

// ───────────── ANA : prévoir sans calculer ─────────────
export const ONDES1G_ANA = [
  // Ondes mécaniques : propagation d'une perturbation sans transport de matière
  { id: 'ond1g-propagation-son-air', domaine: D_CEL, titre: 'Un papier devant un haut-parleur',
    enonce: 'Un haut-parleur émet un son grave et fort. Devant lui, un petit morceau de papier de soie est suspendu à un fil fin, dans une pièce sans courant d’air. Le son se propage dans l’air de proche en proche.',
    q: 'Que fait le papier de soie pendant que l’onde sonore passe ?', options: [
      V('il vibre légèrement autour de sa position, sans avancer', 'Une onde sonore est une perturbation de l’air qui se transmet de proche en proche : l’air et le papier oscillent autour de leur position, sans être emportés avec le son.'),
      F('il est entraîné loin du haut-parleur avec le son qui avance', 'Le son se propage, mais l’air ne voyage pas avec lui : il n’y a pas de transport de matière, le papier reste à peu près à sa place.'),
      F('il reste immobile, car un son n’agit pas sur un objet aussi léger', 'Une onde sonore est une perturbation mécanique : elle met en mouvement l’air, puis le papier léger, qui se met à vibrer.'),
      F('il se déplace à la célérité du son, soit 340 m/s', '340 m/s est la célérité de la perturbation, pas la vitesse d’un point du milieu : le papier oscille sur place, avec de petits mouvements.'),
    ] },
  { id: 'ond1g-propagation-houle', domaine: D_CEL, titre: 'Un bouchon sur la houle',
    enonce: 'Une houle régulière avance vers la côte. Un bouchon de liège flotte sur l’eau, loin du rivage. On néglige le vent et les courants, et on décrit la houle comme une onde progressive.',
    q: 'Comment le bouchon se déplace-t-il quand les vagues passent ?', options: [
      V('il monte et descend à peu près sur place', 'La perturbation avance vers la côte, mais l’eau ne suit pas : dans ce modèle, chaque point de la surface monte puis descend autour de sa position.'),
      F('il est poussé vers la côte à la célérité des vagues', 'Une onde ne transporte pas de matière : les vagues avancent, mais le bouchon ne les suit pas.'),
      F('il reste parfaitement immobile sur l’eau', 'Le bouchon suit les mouvements de la surface : chaque vague qui passe le soulève, puis le redescend.'),
      F('il avance dans le sens des vagues, mais plus lentement', 'Plus ou moins vite, ce serait encore un transport de matière : le bouchon ne progresse pas avec les vagues.'),
    ] },
  // Ondes mécaniques : retard et localisation d'une source
  { id: 'ond1g-celerite-localiser-egale', domaine: D_CEL, titre: 'Deux capteurs, aucun retard',
    enonce: 'Deux capteurs A et B sont posés sur un sol plat, à 200 m l’un de l’autre. Une secousse naît en un point S du sol et se propage avec la même célérité dans toutes les directions. Les deux capteurs enregistrent son arrivée exactement au même instant.',
    q: 'Que peut-on en déduire sur la position de la source S ?', options: [
      V('S est à la même distance de A et de B', 'Même célérité et même durée de propagation : la distance parcourue, d = c × Δt, est la même jusqu’à A et jusqu’à B.'),
      F('S est très proche de l’un des deux capteurs', 'Si S était plus près de A que de B, la secousse arriverait en A avant d’arriver en B : il y aurait un retard entre les capteurs.'),
      F('S est forcément au milieu du segment AB', 'Être à égale distance de A et de B ne place pas S sur le segment : S peut être n’importe où sur la médiatrice de [AB], même loin des capteurs.'),
      F('on ne peut rien dire sans connaître la célérité', 'La valeur de c n’est pas nécessaire : même célérité et même durée donnent deux distances égales, quelle que soit c.'),
    ] },
  // Ondes périodiques : périodicités spatiale et temporelle
  { id: 'ond1g-periode-spatiale-temporelle', domaine: D_PER, titre: 'Une photographie et un enregistrement',
    schema: { type: 'onde', cas: 'photo-enregistrement' },
    enonce: 'Une onde sinusoïdale se propage le long d’une corde. On dispose de deux documents : une photographie de la corde prise à un instant donné (l’élongation y en fonction de la position x), et l’enregistrement du mouvement d’un seul point de la corde (y en fonction du temps t).',
    q: 'Que lit-on directement sur chacun des deux documents ?', options: [
      V('photographie : la longueur d’onde ; enregistrement : la période', 'La photographie montre la répétition dans l’espace (distance entre deux crêtes voisines : λ) ; l’enregistrement montre la répétition dans le temps (durée d’une oscillation : T).'),
      F('photographie : la période de l’onde ; enregistrement : sa longueur d’onde', 'C’est l’inverse : une durée se lit sur un axe des temps (enregistrement), une longueur sur un axe des positions (photographie).'),
      F('les deux documents donnent directement la période', 'La photographie est prise à un seul instant : on n’y lit aucune durée, seulement des distances.'),
      F('les deux documents donnent directement la longueur d’onde', 'L’enregistrement concerne un seul point : on n’y lit aucune distance, seulement des durées.'),
    ] },
  { id: 'ond1g-periode-lecture-lambda', domaine: D_PER, titre: 'Lire la longueur d’onde sur une photographie',
    schema: { type: 'onde', cas: 'cretes', n: 4 },
    enonce: 'Sur la photographie d’une corde parcourue par une onde sinusoïdale, on repère quatre crêtes consécutives. On mesure, à la règle, la distance entre la première crête et la quatrième : 90 cm.',
    q: 'Quelle est la longueur d’onde λ de l’onde ?', options: [
      V('30 cm : trois intervalles séparent les quatre crêtes', 'Deux crêtes voisines sont séparées de λ. De la première à la quatrième crête, il y a 3 intervalles : λ = 90 ÷ 3 = 30 cm.'),
      F('22,5 cm : on divise 90 cm par le nombre de crêtes, soit 4', 'Quatre crêtes délimitent 3 intervalles, pas 4 : en divisant par 4, on obtient une valeur trop petite.'),
      F('90 cm : c’est la distance mesurée sur la photographie', '90 cm contient trois longueurs d’onde : λ est la distance entre deux crêtes voisines seulement.'),
      F('360 cm : on multiplie 90 cm par les quatre crêtes', 'La distance totale est plus grande que λ : il faut la diviser par le nombre d’intervalles, pas la multiplier.'),
    ] },
  // Couleurs : couleur blanche, complémentaires, trichromie, choix du modèle
  { id: 'coul1g-ana-complementaires', domaine: D_COUL, titre: 'Une lampe jaune et une lampe bleue',
    enonce: 'On éclaire un même point d’un écran blanc, dans une pièce sans autre lumière, avec une lampe jaune (qui envoie du rouge et du vert) et une lampe bleue.',
    q: 'Quelle couleur observe-t-on au point éclairé par les deux lampes ?', options: [
      V('blanche : le rouge, le vert et le bleu sont tous présents', 'Les lumières s’ajoutent : rouge + vert + bleu donne du blanc. Le jaune et le bleu sont deux couleurs complémentaires.'),
      F('verte : le bleu et le jaune se mélangent comme deux peintures', 'C’est le raisonnement des peintures (synthèse soustractive). Des lampes émettent de la lumière : les radiations s’ajoutent, rien n’est absorbé.'),
      F('noire : la lampe bleue éteint la lumière de la lampe jaune', 'Des lumières ne s’éteignent pas entre elles : elles s’ajoutent, et le point est plus lumineux qu’avec une seule lampe.'),
      F('jaune : le bleu est trop faible pour changer la couleur', 'Le bleu stimule les cônes sensibles au bleu : avec le rouge et le vert déjà présents, l’œil perçoit du blanc.'),
    ] },
  { id: 'coul1g-ana-trichromie-ecran', domaine: D_COUL, titre: 'Un écran de téléphone qui paraît jaune',
    enonce: 'L’écran d’un téléphone est formé de minuscules points lumineux rouges, verts et bleus, qui s’allument séparément. Vu de loin, un morceau de l’écran paraît jaune.',
    q: 'Quels points lumineux sont allumés dans ce morceau d’écran ?', options: [
      V('les rouges et les verts, les bleus restent éteints', 'Le jaune est perçu quand les cônes sensibles au rouge et au vert sont stimulés, mais pas ceux du bleu (trichromie) : l’œil additionne les lumières des points voisins.'),
      F('des points jaunes : l’écran contient du jaune', 'L’écran n’a que des points rouges, verts et bleus : le jaune est une sensation produite par le rouge et le vert ensemble.'),
      F('les bleus seulement, car le jaune est complémentaire du bleu', 'Les points bleus seuls donneraient du bleu. Le jaune est complémentaire du bleu : l’un avec l’autre, ils donnent du blanc.'),
      F('tous les points : rouges, verts et bleus à la fois', 'Les trois radiations allumées ensemble donnent du blanc, pas du jaune.'),
    ] },
  { id: 'coul1g-ana-modele-vitrail', domaine: D_COUL, titre: 'Un verre rouge dans un vitrail',
    enonce: 'Un vitrail comporte un morceau de verre rouge. Il est éclairé de l’extérieur par la lumière blanche du jour, et on observe, à l’intérieur de l’église, la lumière qui le traverse.',
    q: 'Quel modèle permet de prévoir la couleur de la lumière qui sort du verre ?', options: [
      V('la synthèse soustractive : le verre absorbe le vert et le bleu', 'Le verre agit comme un filtre : il absorbe une partie des radiations de la lumière blanche (ici le vert et le bleu) et ne laisse passer que le rouge.'),
      F('la synthèse additive : le verre ajoute du rouge à la lumière du jour', 'Un verre coloré ne fabrique pas de lumière : il ne peut que retirer des radiations à celles qu’il reçoit.'),
      F('la synthèse additive : le verre émet lui-même de la lumière rouge', 'Le verre n’est pas une source : s’il n’y avait pas de lumière du jour derrière, rien n’en sortirait.'),
      F('aucun modèle : un verre colore la lumière sans absorber de radiation', 'Un verre rouge absorbe le vert et le bleu : c’est cette absorption qui donne sa couleur à la lumière transmise.'),
    ] },
  { id: 'lum1-grandissement-image-reelle', domaine: D_LEN, titre: 'Signe du grandissement d’une image sur un écran',
    enonce: 'Avec une lentille mince convergente, un élève obtient sur un écran l’image nette d’un objet réel AB. Le grandissement est γ = frac(OA′|OA), avec OA < 0 car l’objet est devant la lentille.',
    q: 'Que peut-on dire du signe de γ ?', options: [
      V('γ est négatif : l’image est renversée', 'Une image qui se forme sur un écran est réelle : elle est derrière la lentille, donc OA′ > 0. Avec OA < 0, le quotient frac(OA′|OA) est négatif : image renversée.'),
      F('γ est positif : l’image est droite, comme l’objet', 'Un γ positif correspond à une image droite, donc virtuelle pour une lentille convergente : on ne pourrait pas la recueillir sur un écran.'),
      F('γ est nul : l’image est à une position bien précise', 'γ = 0 voudrait dire que l’image a une taille nulle, ce qui n’est pas le cas d’une image nette visible sur l’écran.'),
      F('on ne peut pas savoir sans connaître la distance focale', 'Le signe se déduit déjà de la position de l’écran : image sur écran signifie OA′ > 0, quelle que soit f′.'),
    ] },
  // Lentille mince : mise au point et estimation de la distance focale
  { id: 'lum1-mise-au-point', domaine: D_LEN, titre: 'Mise au point : objet rapproché de la lentille',
    schema: { type: 'optique', cas: 'conjugaison', d: 20, f: 10, apres: { reponse: true } },
    enonce: 'Une lentille convergente de distance focale f′ = 10 cm donne, sur un écran, l’image nette d’un objet placé à 30 cm devant elle : l’écran est à 15 cm derrière la lentille. On rapproche l’objet à 20 cm de la lentille, sans toucher à celle-ci.',
    q: 'Que faut-il faire pour retrouver une image nette sur l’écran ?', options: [
      V('éloigner l’écran : l’image se forme à 20 cm de la lentille', '1/OA′ = 1/f′ + 1/OA = 1/10 − 1/20 = 1/20, donc OA′ = +20 cm, plus grand que les 15 cm initiaux : plus l’objet se rapproche du foyer, plus l’image s’éloigne.'),
      F('rapprocher l’écran : l’image se forme à 10 cm de la lentille', 'Le sens est inversé : quand l’objet se rapproche, l’image s’éloigne de la lentille. 10 cm est la distance focale, pas la position de l’image.'),
      F('laisser l’écran à sa place : l’image reste nette à 15 cm', 'La position de l’image dépend de celle de l’objet : si OA change, OA′ change aussi (relation de conjugaison).'),
      F('éloigner l’écran jusqu’à 30 cm : l’image se forme à 30 cm', 'Cette valeur correspond à un objet placé à 15 cm de la lentille, pas à 20 cm.'),
    ] },
  { id: 'lum1-focale-objet-lointain', domaine: D_LEN, titre: 'Estimer f′ avec un objet très éloigné',
    enonce: 'Pour estimer la distance focale d’une lentille mince convergente, on forme sur un écran l’image nette d’un objet très éloigné (un arbre à plusieurs centaines de mètres), puis on mesure la distance entre la lentille et l’écran.',
    q: 'Que représente, à peu près, la distance mesurée ?', options: [
      V('la distance focale f′ de la lentille', 'Pour un objet très éloigné, 1/OA est presque nul : la relation 1/OA′ − 1/OA = 1/f′ donne OA′ ≈ f′. L’image se forme (presque) dans le plan focal image.'),
      F('le double de la distance focale, 2 f′', 'La distance 2 f′ correspond à un objet placé à 2 f′ de la lentille, pas à un objet très éloigné.'),
      F('la distance entre l’objet et la lentille', 'L’objet est à plusieurs centaines de mètres : la distance mesurée est de l’ordre du centimètre, sur le banc d’optique.'),
      F('l’inverse de la distance focale, frac(1|f′)', 'L’inverse de f′ est la vergence, en dioptries ; la distance mesurée est une longueur, en centimètres ou en mètres.'),
    ] },
  // Modèles de la lumière : domaines spectraux et spectres de raies
  { id: 'phot1g-ana-ordre-domaines', domaine: D_PHOT, titre: 'Radio FM, wifi, lumière bleue et rayons X',
    enonce: 'Sur une échelle de fréquences croissantes, les domaines se succèdent ainsi : ondes radio, micro-ondes, infrarouge, visible, ultraviolet, rayons X. On compare quatre ondes : la radio FM, le wifi (micro-ondes), la lumière bleue et les rayons X d’une radiographie.',
    q: 'Laquelle a la plus grande longueur d’onde, et laquelle la plus petite ?', options: [
      V('la radio FM la plus grande, les rayons X la plus petite', 'λ = c ÷ ν diminue quand la fréquence augmente : l’onde de plus basse fréquence (radio FM) a la plus grande λ, celle de plus haute fréquence (rayons X) la plus petite.'),
      F('les rayons X la plus grande, la radio FM la plus petite', 'C’est l’inverse : une fréquence plus élevée correspond à une longueur d’onde plus petite, puisque λ = c ÷ ν.'),
      F('le wifi la plus grande, la lumière bleue la plus petite', 'Le wifi a une fréquence plus élevée que la radio FM, donc une longueur d’onde plus petite ; et les rayons X ont une λ plus petite que la lumière bleue.'),
      F('la lumière bleue la plus grande, les rayons X la plus petite', 'La lumière bleue a une fréquence bien plus élevée que la radio FM et le wifi : sa longueur d’onde est donc plus petite que les leurs.'),
    ] },
  { id: 'niv1g-ana-lampe-raies', domaine: D_NIV, titre: 'Une lampe à incandescence et une lampe au sodium',
    enonce: 'À travers un réseau, on observe le spectre de deux lampes : une lampe à incandescence, qui donne un spectre continu (toutes les couleurs, sans interruption), et une lampe à vapeur de sodium (gaz de sodium sous faible pression), qui ne donne que quelques raies colorées.',
    q: 'Comment expliquer que le gaz de sodium n’émette que des longueurs d’onde bien précises ?', options: [
      V('l’énergie d’un atome est quantifiée : seuls certains ΔE existent', 'Les atomes isolés du gaz n’ont que certains niveaux d’énergie : un photon émis a l’énergie d’un écart ΔE entre deux niveaux, donc une longueur d’onde λ = h·c ÷ ΔE bien précise.'),
      F('le gaz est moins chaud que le filament de la lampe à incandescence', 'La température joue sur la brillance des raies, pas sur leur nombre : même très chaud, un gaz d’atomes isolés n’émet que des raies.'),
      F('le gaz émet toutes les couleurs, mais l’œil n’en perçoit que quelques-unes', 'Le réseau sépare toutes les longueurs d’onde émises : les couleurs absentes du spectre ne sont pas émises par le gaz.'),
      F('tous les photons émis ont la même énergie, quels que soient les niveaux', 'On observe plusieurs raies : les photons n’ont pas tous la même énergie, mais seulement des énergies égales aux écarts entre niveaux.'),
    ] },
  // Mesure et incertitudes : histogramme, écriture du résultat
  { id: 'mes1g-ana-histogramme', domaine: D_MES, titre: 'Deux histogrammes, une même moyenne',
    enonce: 'Deux élèves mesurent chacun 50 fois la même durée avec le même type de chronomètre. Les deux séries ont la même moyenne, 1,50 s. L’histogramme du premier élève est étroit, resserré autour de 1,50 s ; celui du second est large, étalé de part et d’autre.',
    q: 'Que peut-on affirmer ?', options: [
      V('le premier élève a l’écart-type le plus petit : mesures moins dispersées', 'La largeur de l’histogramme traduit la dispersion : une série resserrée autour de sa moyenne a un écart-type plus petit.'),
      F('les deux séries ont le même écart-type, car elles ont la même moyenne', 'La moyenne repère le centre de l’histogramme, l’écart-type sa largeur : deux séries de même moyenne peuvent avoir des dispersions très différentes.'),
      F('le premier élève a le plus grand écart-type, car ses valeurs sont proches', 'C’est l’inverse : des valeurs proches les unes des autres donnent un petit écart-type.'),
      F('on ne peut rien dire sans connaître la valeur vraie de la durée', 'La dispersion se lit sur l’histogramme lui-même : la valeur vraie n’est pas nécessaire pour comparer les largeurs.'),
    ] },
  { id: 'mes1g-ana-ecriture-resultat', domaine: D_MES, titre: 'Écrire une tension avec son incertitude',
    enonce: 'Après plusieurs mesures, une tension a pour moyenne 4,8374 V et pour incertitude-type de type A u = 0,0213 V. Convention adoptée : u est arrondie par excès à 1 chiffre significatif (2 si le premier chiffre est 1), puis la valeur est arrondie à la même décimale que u.',
    q: 'Quelle écriture du résultat est correcte ?', options: [
      V('U = 4,84 ± 0,03 V', 'u = 0,0213 V est arrondie par excès à 0,03 V (rang du centième) ; la valeur est alors arrondie au centième : 4,8374 devient 4,84 V.'),
      F('U = 4,8374 ± 0,0213 V', 'Les décimales plus fines que l’incertitude (millième et dix-millième) n’ont pas de sens : elles suggèrent une précision que la mesure n’a pas.'),
      F('U = 4,84 ± 0,02 V', 'La convention demande d’arrondir u par excès (0,0213 devient 0,03) et non au plus proche, pour ne pas sous-estimer l’incertitude.'),
      F('U = 4,8 ± 0,03 V', 'La valeur doit être arrondie à la même décimale que u, donc au centième, et non au dixième : on perdrait un chiffre significatif.'),
    ] },
];

// ───────────── VAL : ça paraît plausible ? ─────────────
export const ONDES1G_VAL = [
  P({ id: 'ond1g-celerite-val-localiser', domaine: D_CEL, niveau: 2, titre: 'Distance d’un séisme à partir de deux stations', plausible: false,
    enonce: 'Un séisme, la station A et la station B sont alignés dans cet ordre, avec AB = 12 km. La station B enregistre l’onde 2,4 s après la station A. La célérité est c = 5,0 km/s. Un élève écrit : « c × Δt = 5,0 × 2,4 = 12 km, donc le séisme s’est produit à 12 km de la station A ».',
    reperes: [['Relation', 'distance = c × durée de propagation']],
    ver: 'Le produit c × Δt = 12 km est bien la distance AB entre les deux stations : le retard est la durée de propagation de A à B. Il ne dit rien sur la distance du séisme à A : il faudrait la durée écoulée depuis le séisme, ou une troisième station.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('il a pris le retard entre les stations pour la durée depuis le séisme', 'Le retard Δt = 2,4 s est la durée de A à B : c × Δt donne la distance AB (12 km), et non la distance du séisme à A.'),
      F('il a utilisé une mauvaise relation : il fallait diviser la célérité par Δt', 'La relation d = c × Δt est bonne ; l’erreur porte sur le sens donné à Δt, pas sur la formule.'),
      F('il a oublié l’aller-retour de l’onde entre les deux stations', 'Les stations enregistrent l’onde à l’aller seulement : il n’y a pas d’aller-retour, donc pas de facteur 2 à ajouter.'),
    ] }),
  P({ id: 'ond1g-periode-val-frequence', domaine: D_PER, niveau: 1, titre: 'Fréquence déduite d’une période', plausible: false,
    enonce: 'On lit sur l’enregistrement d’un point d’une corde une période T = 0,20 s. Un élève écrit : « la fréquence est f = 0,20 Hz ».',
    reperes: [['Relation', 'f = 1 ÷ T'], ['Fréquence', 'nombre d’oscillations par seconde, en hertz (Hz)'], ['Source qui secoue une corde à la main', 'quelques oscillations par seconde']],
    ver: 'Une période de 0,20 s signifie 5 oscillations par seconde : f = 1 ÷ 0,20 = 5,0 Hz. Écrire 0,20 Hz reviendrait à une oscillation toutes les 5 s, ce que l’enregistrement ne montre pas.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('il a gardé le nombre de T et changé seulement l’unité', 'f = 1 ÷ T = 5,0 Hz : la fréquence est l’inverse de la période, elle n’est pas égale à son nombre.'),
      F('il a calculé 1 ÷ T mais s’est trompé de puissance de 10', 'Avec 1 ÷ 0,20 = 5,0, il n’y a pas de puissance de 10 à ajuster : le résultat 0,20 de l’élève n’est pas un inverse.'),
      F('il a oublié que la période se mesure en hertz', 'La période se mesure en secondes ; c’est la fréquence qui se mesure en hertz.'),
    ] }),
  P({ id: 'ond1g-periode-val-celerite-ok', domaine: D_PER, niveau: 1, titre: 'Célérité d’une onde sur une corde : le bon calcul', plausible: true,
    enonce: 'Sur une photo de corde, on lit λ = 20 cm. Sur l’enregistrement d’un point, on lit T = 0,40 s. Un élève calcule c = λ ÷ T = 0,20 m ÷ 0,40 s = 0,50 m/s.',
    reperes: [['Relation', 'c = λ ÷ T'], ['Unités', 'λ en mètres et T en secondes donnent c en m/s'], ['Onde créée à la main sur une corde', 'célérité de l’ordre du mètre par seconde']],
    ver: 'λ = 20 cm = 0,20 m : le quotient 0,20 ÷ 0,40 = 0,50 m/s est bien exprimé en m/s, avec un ordre de grandeur réaliste pour une corde secouée à la main. Le résultat est plausible.',
    q2: 'Quel raisonnement est correct ?',
    options: [
      V('Cohérent : λ est converti en mètres et 0,50 m/s est réaliste', 'La relation est bien utilisée, avec des unités cohérentes, et l’ordre de grandeur est celui d’une corde peu tendue.'),
      F('Pas cohérent : une célérité aussi faible n’existe pas, il faut 340 m/s', '340 m/s est la célérité du son dans l’air, pas celle d’une onde sur une corde peu tendue : la célérité dépend du milieu.'),
      F('Pas cohérent : il fallait diviser T par λ au lieu de diviser λ par T', 'Une célérité est une distance divisée par une durée, donc λ ÷ T ; T ÷ λ serait en s/m.'),
    ] }),
  P({ id: 'coul1g-val-complementaires', domaine: D_COUL, niveau: 1, titre: 'Rouge et vert, couleurs complémentaires ?', plausible: false,
    enonce: 'Un élève éclaire un écran blanc, dans le noir, avec une lampe rouge et une lampe verte. Il affirme : « Le rouge et le vert sont des couleurs complémentaires : dans la zone commune, on voit du blanc. »',
    reperes: [['Couleurs complémentaires', 'deux lumières dont l’addition apporte le rouge, le vert et le bleu : du blanc'], ['Rouge + vert', 'le bleu manque : on obtient du jaune'], ['Complémentaire du rouge', 'la lumière qui apporte le vert et le bleu : le cyan']],
    ver: 'Rouge + vert donnent du jaune : il manque le bleu pour obtenir du blanc. La complémentaire du rouge est le cyan (vert + bleu), celle du vert est le magenta (rouge + bleu), celle du bleu est le jaune (rouge + vert).',
    q2: 'Quelle erreur explique le mieux cette affirmation ?',
    options: [
      V('il prend deux lumières primaires pour des complémentaires', 'Le rouge et le vert sont deux des trois radiations de base ; deux couleurs complémentaires, elles, apportent à elles deux les trois radiations.'),
      F('il applique à des lampes le modèle des peintures qui absorbent', 'Avec des peintures, rouge et vert donneraient un marron, pas du blanc : son erreur est un mauvais choix de couleurs complémentaires.'),
      F('il oublie que le rouge et le vert se compensent comme des opposés', 'Des lumières ne se compensent pas : elles s’ajoutent. Rouge + vert ne retire rien et donne du jaune.'),
    ] }),
  P({ id: 'coul1g-val-complementaires-ok', domaine: D_COUL, niveau: 1, titre: 'Rouge et cyan, couleurs complémentaires ?', plausible: true,
    enonce: 'Un élève éclaire un écran blanc, dans le noir, avec une lampe rouge et une lampe cyan. Il affirme : « Le cyan est la couleur complémentaire du rouge : dans la zone commune, on voit du blanc. »',
    reperes: [['Cyan', 'vert + bleu'], ['Rouge', 'rouge seul'], ['Lumières qui s’ajoutent', 'rouge + vert + bleu = blanc']],
    ver: 'Le cyan apporte le vert et le bleu, le rouge apporte le rouge : les trois radiations sont présentes et la zone commune paraît blanche. Le cyan et le rouge sont des couleurs complémentaires.',
    q2: 'Quel jugement est correct ?',
    options: [
      V('cohérent : à eux deux, le rouge et le cyan apportent les trois radiations', 'Rouge + (vert + bleu) = les trois radiations : la somme des lumières donne du blanc.'),
      F('pas cohérent : le cyan contient du rouge, il ne peut pas compléter le rouge', 'Le cyan est formé de vert et de bleu : il ne contient pas de rouge, c’est pourquoi il complète le rouge.'),
      F('pas cohérent : deux lampes superposées donnent toujours du jaune', 'Le jaune vient seulement du rouge et du vert. La couleur obtenue dépend des radiations ajoutées.'),
    ] }),
  P({ id: 'lum1-val-focale-estimee', domaine: D_LEN, niveau: 1, titre: 'Distance focale estimée avec un lampadaire', plausible: false,
    enonce: 'Pour estimer la distance focale d’une lentille convergente, un élève forme sur un écran l’image nette d’un lampadaire situé à 80 m. L’écran est à 12 cm de la lentille. Il écrit : « f′ = 80 m, la distance du lampadaire à la lentille ».',
    reperes: [['Objet très éloigné', 'l’image se forme (presque) dans le plan focal image : OA′ ≈ f′'], ['Distance de l’objet à la lentille', 'c’est OA, sans rapport direct avec f′'], ['Lentille de banc d’optique', 'f′ de quelques centimètres à quelques dizaines de centimètres']],
    ver: 'La distance focale se lit sur la distance lentille–écran : f′ ≈ 12 cm. Une focale de 80 m n’a pas de sens pour une lentille de banc d’optique : l’élève a repris la distance de l’objet.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('il a pris la distance de l’objet comme distance focale', 'f′ ≈ OA′ = 12 cm pour un objet très éloigné ; 80 m est la distance OA de l’objet, qui ne donne pas f′.'),
      F('il a oublié de convertir la distance de 12 cm en mètres', 'Une conversion donnerait 0,12 m, qui n’a aucun rapport avec 80 m : son résultat est la distance du lampadaire.'),
      F('il a utilisé le double de la distance focale au lieu de f′', 'Doubler la distance de 12 cm donnerait 24 cm : 80 m ne vient pas de la mesure faite sur l’écran.'),
    ] }),
  P({ id: 'lum1-val-grandissement-inverse', domaine: D_LEN, niveau: 1, titre: 'Grandissement : rapport écrit à l’envers', plausible: false,
    enonce: 'Une lentille convergente a une distance focale f′ = 8 cm. Un objet est placé à 24 cm devant elle (OA = −24 cm), et la relation de conjugaison donne OA′ = +12 cm. Un élève écrit γ = frac(OA|OA′) = −frac(24|12) = −2 et conclut : « l’image est renversée et deux fois plus grande que l’objet ».',
    reperes: [['Grandissement', 'γ = frac(OA′|OA) = A′frac(B′|AB)'], ['Objet au-delà de 2f′ (ici 16 cm)', 'image réelle, renversée, plus petite que l’objet'], ['|γ| < 1', 'image plus petite que l’objet']],
    ver: 'L’objet est à 24 cm, au-delà de 2f′ = 16 cm : l’image est plus petite que l’objet. Le bon calcul est γ = frac(OA′|OA) = frac(12|−24) = −0,5 : image renversée et deux fois plus petite. L’élève a écrit le rapport à l’envers.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('il a calculé OA ÷ OA′ au lieu de OA′ ÷ OA', 'γ = frac(OA′|OA) = frac(12|−24) = −0,5 ; son quotient −frac(24|12) = −2 est l’inverse du bon : le signe est juste, la taille est fausse.'),
      F('il a oublié le signe : γ aurait dû être positif', 'γ est bien négatif : une image réelle donnée par une lentille convergente est renversée. Seul le rapport de tailles est faux.'),
      F('il a pris OA = +24 cm au lieu de OA = −24 cm', 'Avec OA = +24 cm, γ serait positif, ce n’est pas le −2 de l’élève : son −2 vient de −frac(24|12).'),
    ] }),
  P({ id: 'lum1-val-test-relation', domaine: D_LEN, niveau: 2, titre: 'Tester la relation de conjugaison', plausible: true,
    enonce: 'Pour tester la relation de conjugaison, un élève mesure, sur un banc d’optique, deux couples de positions pour la même lentille : OA = −40 cm et OA′ = +24 cm, puis OA = −30 cm et OA′ = +30 cm. Il calcule 1/OA′ − 1/OA dans chaque cas et conclut : « la relation est vérifiée, avec f′ ≈ 15 cm ».',
    reperes: [['Relation de conjugaison', '1/OA′ − 1/OA = 1/f′, avec f′ constante pour une lentille donnée'], ['Positions lues', 'à ± 1 cm : de petits écarts sont normaux']],
    ver: 'Premier couple : 1/24 + 1/40 = 8/120 = 1/15. Second couple : 1/30 + 1/30 = 2/30 = 1/15. Les deux couples donnent la même valeur, f′ = 15 cm : la relation est vérifiée, aux incertitudes de lecture près.',
    q2: 'Quel raisonnement est correct ?',
    options: [
      V('Cohérent : les deux couples donnent la même valeur de f′', 'Les deux couples conduisent à 1/(15 cm) : c’est ce que prévoit la relation, avec une lentille de focale constante.'),
      F('Pas cohérent : OA′ devrait être égale à −OA pour chaque couple', 'OA′ = −OA seulement pour un objet à 2 f′ (ici 30 cm) ; pour les autres positions, ce n’est pas le cas.'),
      F('Pas cohérent : un seul couple suffisait, le second ne sert à rien', 'Un test demande plusieurs positions : un seul couple ne permettrait pas de voir si f′ reste la même.'),
    ] }),
  P({ id: 'phot1g-val-rayons-x-longueur', domaine: D_PHOT, niveau: 2, titre: 'Longueur d’onde des rayons X d’une radiographie', plausible: false,
    enonce: 'Les rayons X d’une radiographie ont une fréquence de l’ordre de 3 × 10¹⁸ Hz. Un élève calcule λ = c ÷ ν = 3,00 × 10⁸ ÷ 3 × 10¹⁸ = 1 × 10⁻¹⁰ m, puis écrit : « ces rayons ont une longueur d’onde d’environ 1 mm ».',
    reperes: [['Relation', 'λ = c ÷ ν, avec λ en mètres'], ['Lumière visible', 'λ de 400 à 780 nm, soit environ 10⁻⁷ m'], ['Rayons X', 'λ plus petite que celle du visible']],
    ver: 'Le calcul est bon : λ = 1 × 10⁻¹⁰ m, soit 0,1 nm, bien plus petite que le visible, comme il se doit pour des rayons X. Écrire « 1 mm » est une erreur de conversion d’un facteur 10⁷ environ.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('il a mal converti 10⁻¹⁰ m en une autre unité', '1 mm vaut 10⁻³ m : le résultat correct, 10⁻¹⁰ m, s’exprime en nanomètres (0,1 nm), pas en millimètres.'),
      F('il a multiplié c par ν au lieu de les diviser', 'Multiplier donnerait un nombre énorme (de l’ordre de 10²⁷) : son calcul numérique est bien une division.'),
      F('il a utilisé la célérité du son au lieu de celle de la lumière', 'Il a bien pris c = 3,00 × 10⁸ m/s, la célérité de la lumière dans le vide.'),
    ] }),
  P({ id: 'phot1g-val-frequence-verte-ok', domaine: D_PHOT, niveau: 1, titre: 'Fréquence d’une lumière verte', plausible: true,
    enonce: 'Un élève calcule la fréquence d’une lumière verte de longueur d’onde 532 nm dans le vide : ν = c ÷ λ = 3,00 × 10⁸ ÷ (532 × 10⁻⁹) ≈ 5,6 × 10¹⁴ Hz.',
    reperes: [['Relation', 'ν = c ÷ λ, avec λ en mètres'], ['Nanomètre', '1 nm = 10⁻⁹ m'], ['Lumière visible', 'fréquence de l’ordre de 4 × 10¹⁴ à 8 × 10¹⁴ Hz']],
    ver: 'λ = 532 nm = 5,32 × 10⁻⁷ m : ν = 3,00 × 10⁸ ÷ 5,32 × 10⁻⁷ ≈ 5,6 × 10¹⁴ Hz, valeur typique du visible. Le résultat est plausible.',
    q2: 'Quel jugement est correct ?',
    options: [
      V('plausible : 5,6 × 10¹⁴ Hz est une fréquence de lumière visible', 'La conversion de λ en mètres est faite et le résultat est dans la plage des fréquences du visible.'),
      F('invraisemblable : une fréquence de lumière devrait être de l’ordre du GHz', 'Le gigahertz (10⁹ Hz) est l’ordre de grandeur des micro-ondes (wifi) : la lumière visible oscille environ 10⁵ fois plus vite.'),
      F('invraisemblable : il fallait diviser λ par c, ce qui donne environ 1,8 × 10⁻¹⁵ s', 'λ ÷ c est une durée (la période de l’onde), pas une fréquence : la relation est ν = c ÷ λ.'),
    ] }),
  P({ id: 'mes1g-val-ecriture-ok', domaine: D_MES, niveau: 1, titre: 'Écriture correcte d’une masse et de son incertitude', plausible: true,
    enonce: 'Après plusieurs pesées, un élève obtient une masse moyenne de 12,3456 g et une incertitude-type u = 0,0273 g. Il écrit : « m = 12,35 ± 0,03 g ».',
    reperes: [['Incertitude', '1 chiffre significatif (2 si le premier est 1), arrondie par excès'], ['Valeur', 'arrondie à la même décimale que u'], ['Ici', 'u = 0,0273 g : le premier chiffre est 2']],
    ver: 'u = 0,0273 g est arrondie par excès à 0,03 g (1 chiffre significatif, car le premier chiffre est 2) ; la masse est arrondie au centième : 12,3456 devient 12,35 g. L’écriture est correcte.',
    q2: 'Quel jugement est correct ?',
    options: [
      V('correct : u est arrondie par excès à 0,03 g et m est écrite au centième', 'L’incertitude a un chiffre significatif et la valeur s’arrête à la même décimale qu’elle.'),
      F('incorrect : il faut garder les quatre décimales de la balance, 12,3456 g', 'Les décimales plus fines que l’incertitude (millième, dix-millième) ne sont pas significatives : 12,3456 laisserait croire à une précision qu’on n’a pas.'),
      F('incorrect : u devait s’écrire avec trois chiffres, 0,0273 g', 'Écrire u avec trois chiffres suggère une précision qu’elle n’a pas : 1 ou 2 chiffres significatifs suffisent.'),
    ] }),
  P({ id: 'mes1g-val-ecriture-u-trop-precise', domaine: D_MES, niveau: 1, titre: 'Une incertitude écrite avec trop de chiffres', plausible: false,
    enonce: 'Un élève mesure un diamètre avec un pied à coulisse et obtient d = 5,24 mm, avec une incertitude-type u = 0,0364 mm. Il écrit : « d = 5,24 ± 0,0364 mm ».',
    reperes: [['Incertitude', '1 chiffre significatif (2 si le premier est 1), arrondie par excès'], ['Valeur', 'arrondie à la même décimale que u'], ['Ici', 'u = 0,0364 mm : le premier chiffre est 3']],
    ver: 'L’incertitude s’écrit avec un seul chiffre significatif, arrondi par excès : 0,0364 devient 0,04 mm. La valeur est ensuite arrondie à la même décimale : d = 5,24 ± 0,04 mm. Ici, la valeur était déjà au centième : seule l’écriture de u est à corriger.',
    q2: 'Quel est le défaut de cette écriture ?',
    options: [
      V('l’incertitude est écrite avec trop de chiffres', 'u = 0,0364 mm doit devenir 0,04 mm : trois chiffres significatifs suggèrent une précision que l’incertitude n’a pas.'),
      F('la valeur 5,24 mm est écrite avec trop de décimales', 'Au contraire : 5,24 est au centième, comme u = 0,04 mm une fois arrondie. La valeur est cohérente.'),
      F('l’incertitude devrait être arrondie vers zéro, soit 0,03 mm', 'On arrondit par excès (0,04 mm) pour ne pas sous-estimer l’incertitude.'),
    ] }),
];
