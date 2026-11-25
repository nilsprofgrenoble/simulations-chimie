// ═══════════════════════════════════════════════════════════════════════════
//  SOUS-THÈMES des chapitres de première générale « Ondes et signaux » et « Mesure et incertitudes » :
//  « ondes-meca », « 1g-couleurs », « 1g-lentille », « 1g-lumiere », « 1g-mesure ».
//  Même structure que SOUS_THEMES (voir sousThemes.js) ; à intégrer dans SOUS_THEMES.
//  Un sous-thème = une capacité exigible du programme de première spécialité (texte officiel reformulé) ; un exercice appartient à un seul sous-thème.
// ═══════════════════════════════════════════════════════════════════════════
export default {
  'ondes-meca': [
    { id: 'propagation', nom: 'Une onde transporte une perturbation', capacite: 'Décrire la propagation d’une perturbation mécanique dans un milieu (houle, onde sonore, onde le long d’une corde) : la perturbation avance, la matière ne suit pas.',
      refs: ['37:prevoir:ond1g-celerite-matiere', '37:prevoir:ond1g-celerite-vitesse-point', '37:prevoir:ond1g-propagation-son-air', '37:prevoir:ond1g-propagation-houle'] },
    { id: 'celerite', nom: 'Célérité, distance et durée', capacite: 'Exploiter la relation entre la durée de propagation, la distance parcourue par une perturbation et la célérité (retard d’un écho, d’un orage, d’un séisme).',
      refs: ['34:ond1g-celerite-sonar', '34:ond1g-celerite-station', '37:prevoir:ond1g-celerite-retard-distance', '77:plausible:ond1g-celerite-val-orage', '77:plausible:ond1g-celerite-val-inverse', '77:plausible:ond1g-celerite-val-sonar', '77:plausible:ond1g-celerite-val-seisme'] },
    { id: 'localiser', nom: 'Localiser une source', capacite: 'Utiliser les retards d’arrivée d’une perturbation en plusieurs points pour localiser la source d’une onde.',
      refs: ['37:prevoir:ond1g-celerite-premiere-station', '37:prevoir:ond1g-celerite-localiser-egale', '77:plausible:ond1g-celerite-val-localiser'] },
    { id: 'milieu', nom: 'Le milieu fixe la célérité', capacite: 'Illustrer l’influence du milieu sur la célérité d’une onde : la célérité dépend du milieu, pas de la source ni de l’amplitude.',
      refs: ['37:prevoir:ond1g-celerite-milieu', '37:prevoir:ond1g-celerite-secouer-plus-fort', '77:plausible:ond1g-celerite-val-eau'] },
    { id: 'lire', nom: 'Lire la période et la longueur d’onde', capacite: 'Distinguer périodicité temporelle et spatiale ; déterminer la période, la fréquence et la longueur d’onde à partir d’une représentation temporelle ou spatiale.',
      refs: ['37:prevoir:ond1g-periode-lecture-T', '37:prevoir:ond1g-periode-lecture-lambda', '37:prevoir:ond1g-periode-spatiale-temporelle', '37:prevoir:ond1g-periode-phase-opposition', '77:plausible:ond1g-periode-val-periode', '77:plausible:ond1g-periode-val-frequence'] },
    { id: 'relation', nom: 'La relation λ = c · T', capacite: 'Justifier et exploiter la relation entre période, longueur d’onde et célérité d’une onde périodique.',
      refs: ['34:ond1g-periode-corde', '37:prevoir:ond1g-periode-frequence-lambda', '37:prevoir:ond1g-periode-milieu', '77:plausible:ond1g-periode-val-son', '77:plausible:ond1g-periode-val-celerite', '77:plausible:ond1g-periode-val-celerite-ok'] },
  ],
  '1g-couleurs': [
    { id: 'additive', nom: 'Mélanger des lumières colorées', capacite: 'Prévoir le résultat de la superposition de lumières colorées (synthèse additive) ; couleur blanche, couleurs complémentaires ; vision des couleurs et trichromie.',
      refs: ['37:prevoir:coul1g-ana-vert-bleu', '37:prevoir:coul1g-ana-complementaires', '37:prevoir:coul1g-ana-trichromie-ecran', '77:plausible:coul1g-val-complementaires', '77:plausible:coul1g-val-complementaires-ok'] },
    { id: 'filtres', nom: 'Les filtres colorés', capacite: 'Prévoir l’effet d’un ou plusieurs filtres colorés sur une lumière incidente (synthèse soustractive : absorption et transmission).',
      refs: ['37:prevoir:coul1g-ana-filtres-succession', '37:prevoir:coul1g-ana-filtre-cyan-rouge', '77:plausible:coul1g-val-cyan-magenta'] },
    { id: 'objets', nom: 'La couleur d’un objet', capacite: 'Interpréter la couleur perçue d’un objet à partir de la lumière incidente et des phénomènes d’absorption, de diffusion et de transmission.',
      refs: ['34:coul1g-sapp-objet', '37:prevoir:coul1g-ana-ballon-vert', '77:plausible:coul1g-val-citron-bleu', '77:plausible:coul1g-val-feuille-verte'] },
    { id: 'modele', nom: 'Additive ou soustractive ?', capacite: 'Choisir le modèle de la synthèse additive ou celui de la synthèse soustractive selon la situation à interpréter.',
      refs: ['37:prevoir:coul1g-ana-modele-affiche', '37:prevoir:coul1g-ana-modele-vitrail', '77:plausible:coul1g-val-marron', '77:plausible:coul1g-val-noir-imprimante'] },
  ],
  '1g-lentille': [
    { id: 'position', nom: 'Où se forme l’image ?', capacite: 'Exploiter la relation de conjugaison (fournie) pour déterminer la position de l’image d’un objet-plan réel ; réaliser une mise au point.',
      refs: ['34:lum1-projecteur', '37:prevoir:lum1-conjugaison-calcul', '37:prevoir:lum1-mise-au-point', '77:plausible:lum1-val-conjugaison'] },
    { id: 'grandissement', nom: 'Taille et sens de l’image', capacite: 'Exploiter la relation de grandissement (fournie) pour déterminer la taille et le sens de l’image.',
      refs: ['37:prevoir:lum1-grandissement-signe', '37:prevoir:lum1-grandissement-image-reelle', '77:plausible:lum1-val-grandissement', '77:plausible:lum1-val-grandissement-inverse'] },
    { id: 'virtuelle', nom: 'Image réelle ou image virtuelle', capacite: 'Déterminer les caractéristiques de l’image : réelle ou virtuelle, droite ou renversée, selon la position de l’objet par rapport au foyer.',
      refs: ['37:prevoir:lum1-virtuelle-loupe', '37:prevoir:lum1-objet-au-foyer', '77:plausible:lum1-val-loupe'] },
    { id: 'focale', nom: 'Estimer la distance focale', capacite: 'Estimer la distance focale d’une lentille mince convergente ; tester la relation de conjugaison avec des mesures.',
      refs: ['37:prevoir:lum1-focale-objet-lointain', '77:plausible:lum1-val-focale-estimee', '77:plausible:lum1-val-test-relation'] },
  ],
  '1g-lumiere': [
    { id: 'domaines', nom: 'Les domaines des ondes électromagnétiques', capacite: 'Utiliser une échelle de fréquences ou de longueurs d’onde pour identifier un domaine spectral ; citer des ordres de grandeur (radio, wifi, visible, rayons X…).',
      refs: ['37:prevoir:phot1g-ana-ordre-longueurs', '37:prevoir:phot1g-ana-echelle-log', '37:prevoir:phot1g-ana-ordre-domaines', '77:plausible:phot1g-val-domaine-fm', '77:plausible:phot1g-val-rayons-x-longueur'] },
    { id: 'lambda-nu', nom: 'Longueur d’onde, fréquence et célérité', capacite: 'Exploiter la relation entre longueur d’onde, célérité de la lumière et fréquence (λ = c / ν).',
      refs: ['37:prevoir:phot1g-ana-lambda-nu', '77:plausible:phot1g-val-wifi-nm', '77:plausible:phot1g-val-frequence-verte-ok'] },
    { id: 'photon', nom: 'L’énergie d’un photon', capacite: 'Utiliser l’expression de l’énergie d’un photon E = h·ν = h·c / λ (en joules et en électronvolts).',
      refs: ['34:phot1g-sapp-photon', '37:prevoir:phot1g-ana-photon-uv', '37:prevoir:phot1g-ana-puissance-photon', '77:plausible:phot1g-val-energie-visible', '77:plausible:phot1g-val-energie-x', '77:plausible:phot1g-val-ev-j'] },
    { id: 'niveaux', nom: 'Niveaux d’énergie et transitions', capacite: 'Exploiter un diagramme de niveaux d’énergie avec ΔE = h·ν et λ = c / ν : énergie et longueur d’onde du photon absorbé ou émis.',
      refs: ['34:niv1g-sapp-transition', '37:prevoir:niv1g-ana-ecart-lambda', '37:prevoir:niv1g-ana-niveaux-negatifs', '77:plausible:niv1g-val-superieur', '77:plausible:niv1g-val-unite-lambda', '77:plausible:niv1g-val-hydrogene-uv'] },
    { id: 'spectres', nom: 'Spectres de raies d’émission et d’absorption', capacite: 'Interpréter le spectre d’une source spectrale (raies d’émission, raies d’absorption) à partir du diagramme de niveaux d’énergie des entités qui la constituent.',
      refs: ['37:prevoir:niv1g-ana-emission-absorption', '37:prevoir:niv1g-ana-raies-noires', '37:prevoir:niv1g-ana-cascade', '37:prevoir:niv1g-ana-intensite', '37:prevoir:niv1g-ana-lampe-raies', '77:plausible:niv1g-val-raies-absorption', '77:plausible:niv1g-val-sodium-raie'] },
  ],
  '1g-mesure': [
    { id: 'variabilite', nom: 'La variabilité d’une mesure', capacite: 'Exploiter une série de mesures indépendantes (histogramme, moyenne, écart-type) ; discuter l’influence de l’instrument et du protocole sur la dispersion.',
      refs: ['37:prevoir:mes1g-ana-histogramme', '37:prevoir:mes1g-ana-s-et-n', '37:prevoir:mes1g-ana-protocole'] },
    { id: 'type-a', nom: 'Incertitude-type de type A', capacite: 'Évaluer une incertitude-type par une approche statistique (type A) : u = s / √N pour N mesures indépendantes.',
      refs: ['34:mes1g-sapp-serie', '37:prevoir:mes1g-ana-n-quadruple', '37:prevoir:dispersion-double', '77:plausible:mes1g-val-u-egale-s', '77:plausible:u-moyenne-ok'] },
    { id: 'type-b', nom: 'Incertitude-type de type B', capacite: 'Évaluer une incertitude-type par une approche non statistique (type B) à partir des caractéristiques de l’instrument ou de la lecture : u = a / √3 pour une loi uniforme.',
      refs: ['34:mes1g-sapp-instrument', '37:prevoir:mes1g-ana-typeb-intervalle', '77:plausible:mes1g-val-typeb-eprouvette', '77:plausible:u-nulle'] },
    { id: 'ecriture', nom: 'Écrire le résultat d’une mesure', capacite: 'Écrire, avec un nombre adapté de chiffres significatifs, le résultat d’une mesure et son incertitude-type.',
      refs: ['37:prevoir:mes1g-ana-ecriture-resultat', '77:plausible:mes1g-val-ecriture', '77:plausible:mes1g-val-ecriture-ok', '77:plausible:mes1g-val-ecriture-u-trop-precise'] },
    { id: 'reference', nom: 'Comparer à une valeur de référence', capacite: 'Comparer qualitativement un résultat à une valeur de référence ; distinguer dispersion (type A) et décalage systématique.',
      refs: ['37:prevoir:mes1g-ana-systematique', '77:plausible:mes1g-val-compat', '77:plausible:mes1g-val-100-pesees'] },
  ],
};
