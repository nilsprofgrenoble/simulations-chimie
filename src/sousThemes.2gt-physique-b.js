// Sous-thèmes des chapitres de seconde « Ondes et signaux » : « 2gt-son » (émettre et percevoir un son), « 2gt-lumiere » (vision et image) et « 2gt-circuits » (signaux et capteurs).
// Même structure que SOUS_THEMES (voir sousThemes.js) ; à intégrer dans SOUS_THEMES lors de la fusion.
// Un sous-thème = une capacité exigible du programme de seconde (partie « Ondes et signaux ») ; chaque exercice est dans UN seul sous-thème.
// Capacités expérimentales (mesurer la vitesse du son, utiliser un microcontrôleur, produire un spectre, tester les lois de Snell-Descartes, mesurer une tension
// ou une intensité au multimètre, utiliser un capteur) : non couvrables par un QCM ; seuls les raisonnements associés sont travaillés ici.
export default {
  '2gt-son': [
    { id: 'emission', nom: 'Comment un son est émis et se propage', capacite: 'Décrire l’émission d’un signal sonore par la mise en vibration d’un objet, le rôle d’une caisse de résonance et le rôle du milieu matériel dans la propagation du son.',
      refs: ['37:prevoir:son2gt-emis-ana-sable', '37:prevoir:son2gt-emis-ana-diapason-table', '37:prevoir:son2gt-emis-ana-espace', '37:prevoir:son2gt-emis-ana-bougie', '77:plausible:son2gt-emis-val-film-espace'] },
    { id: 'vitesse', nom: 'La vitesse du son', capacite: 'Citer une valeur approchée de la vitesse du son dans l’air, la comparer à d’autres vitesses et l’utiliser (distance, durée, retard).',
      refs: ['34:son2gt-emis-sapp-orage', '34:son2gt-emis-sapp-micros', '37:prevoir:son2gt-emis-ana-retard-double', '37:prevoir:son2gt-emis-ana-eclairs', '77:plausible:son2gt-emis-val-tonnerre', '77:plausible:son2gt-emis-val-kmh', '77:plausible:son2gt-emis-val-micros-inverse', '77:plausible:son2gt-emis-val-avion'] },
    { id: 'periode', nom: 'Période et fréquence d’un son', capacite: 'Définir et déterminer la période et la fréquence d’un signal sonore périodique à partir de sa représentation temporelle ; utiliser f = 1 / T.',
      refs: ['34:son2gt-per-sapp-note', '34:son2gt-per-sapp-ecran', '37:prevoir:son2gt-per-ana-periode-double', '37:prevoir:son2gt-per-ana-motifs-ecran', '77:plausible:son2gt-per-val-oubli-ms', '77:plausible:son2gt-per-val-voix', '77:plausible:son2gt-per-val-cinq-motifs'] },
    { id: 'hauteur', nom: 'Aigu, grave, fort, timbre', capacite: 'Relier qualitativement la fréquence à la hauteur d’un son, la forme du signal au timbre, l’amplitude à la force du son ; citer les domaines de fréquences des sons audibles, des infrasons et des ultrasons.',
      refs: ['37:prevoir:son2gt-per-ana-aigu-grave', '37:prevoir:son2gt-per-ana-timbre', '37:prevoir:son2gt-per-ana-amplitude', '37:prevoir:son2gt-per-ana-ultrason', '77:plausible:son2gt-per-val-diapason', '77:plausible:son2gt-per-val-limite'] },
    { id: 'niveau', nom: 'Le niveau sonore et les décibels', capacite: 'Relier qualitativement intensité sonore et niveau d’intensité sonore ; exploiter une échelle de niveaux d’intensité sonore.',
      refs: ['34:son2gt-niv-sapp-ecart', '37:prevoir:son2gt-niv-ana-amplitude', '37:prevoir:son2gt-niv-ana-plus-10', '37:prevoir:son2gt-niv-ana-deux-sources', '37:prevoir:son2gt-niv-ana-distance', '37:prevoir:son2gt-niv-ana-zero-db', '77:plausible:son2gt-niv-val-dix-pourcent', '77:plausible:son2gt-niv-val-deux-enceintes', '77:plausible:son2gt-niv-val-smartphone'] },
    { id: 'danger', nom: 'Les dangers d’un son trop fort ou trop long', capacite: 'Exploiter une échelle de niveaux d’intensité sonore pour citer les dangers inhérents à l’exposition sonore (niveau et durée d’exposition).',
      refs: ['34:son2gt-niv-sapp-duree', '37:prevoir:son2gt-niv-ana-duree-baisse', '77:plausible:son2gt-niv-val-concert-duree', '77:plausible:son2gt-niv-val-casque-court'] },
  ],

  '2gt-lumiere': [
    { id: 'vitesse', nom: 'La lumière : en ligne droite et très vite', capacite: 'Connaître la propagation rectiligne de la lumière ; citer la valeur de la vitesse de la lumière dans le vide ou dans l’air et la comparer à d’autres vitesses.',
      refs: ['37:prevoir:lum2gt-ana-soleil', '37:prevoir:lum2gt-ana-ombre', '77:plausible:lum2gt-val-c-unite', '77:plausible:lum2gt-val-terre-lune', '77:plausible:lum2gt-val-terre-lune-ok'] },
    { id: 'spectres', nom: 'Lumière blanche, lumière colorée, spectres', capacite: 'Caractériser le spectre d’un corps chaud (continu) et celui d’un gaz (raies) ; caractériser un rayonnement monochromatique par sa longueur d’onde ; exploiter un spectre de raies.',
      refs: ['37:prevoir:lum-spectre-sodium', '37:prevoir:lum-etoile-temperature', '37:prevoir:lum2gt-ana-raies', '37:prevoir:prisme2gt-ana-sodium', '77:plausible:lum2gt-val-lampe-continu', '77:plausible:prisme2gt-val-visible'] },
    { id: 'reflexion-refraction', nom: 'Réflexion et réfraction d’un rayon', capacite: 'Exploiter les lois de Snell-Descartes pour la réflexion et la réfraction : angles mesurés depuis la normale, rayon qui se rapproche ou s’éloigne de la normale.',
      refs: ['34:snell2.0', '37:prevoir:lum-reflexion', '37:prevoir:lum-air-eau', '37:prevoir:lum-incidence-normale', '37:prevoir:lum-verre-air', '77:plausible:lum2gt-val-reflexion-surface', '77:plausible:lum-angle-refracte-inverse', '77:plausible:lum-angle-refracte-ok'] },
    { id: 'indice', nom: 'L’indice de réfraction d’un milieu', capacite: 'Utiliser l’indice optique d’un milieu matériel (n = c / v) et déterminer l’indice de réfraction d’un milieu à partir de mesures d’angles.',
      refs: ['34:indice2', '34:snell2.1', '37:prevoir:lum2gt-ana-indice', '77:plausible:lum-indice-inverse'] },
    { id: 'dispersion', nom: 'La dispersion de la lumière par un prisme', capacite: 'Décrire et expliquer qualitativement la dispersion de la lumière par un prisme : l’indice du verre dépend de la couleur.',
      refs: ['34:prisme2gt-sapp-angle', '34:prisme2gt-sapp-ecart', '37:prevoir:prisme2gt-ana-laser', '37:prevoir:prisme2gt-ana-ordre', '37:prevoir:prisme2gt-ana-sans-dispersion', '37:prevoir:prisme2gt-ana-sortie', '77:plausible:prisme2gt-val-colore', '77:plausible:prisme2gt-val-rouge-plus-devie', '77:plausible:prisme2gt-val-laser-ok', '77:plausible:prisme2gt-val-angle-divise'] },
    { id: 'foyers', nom: 'Lentille convergente : foyers et rayons', capacite: 'Caractériser les foyers d’une lentille mince convergente à l’aide du modèle du rayon lumineux (rayon parallèle à l’axe, rayon par le centre optique, rayon par le foyer).',
      refs: ['37:prevoir:lum-lentille-parallele', '37:prevoir:lum-lentille-centre', '37:prevoir:lum-image-infini', '37:prevoir:img2gt-ana-rayon-parallele', '37:prevoir:img2gt-ana-rayon-centre', '77:plausible:img2gt-val-rayon-foyer'] },
    { id: 'image', nom: 'L’image d’une lentille : position, taille, grandissement', capacite: 'Déterminer la position, la taille et le sens de l’image réelle d’un objet plan réel donnée par une lentille mince convergente ; définir et déterminer un grandissement (théorème de Thalès).',
      refs: ['34:img2gt-sapp-bougie', '34:img2gt-sapp-projecteur', '37:prevoir:img2gt-ana-ecran', '37:prevoir:img2gt-ana-rapproche', '37:prevoir:img2gt-ana-grandissement', '77:plausible:img2gt-val-grandissement', '77:plausible:img2gt-val-thales-ok', '77:plausible:img2gt-val-image-droite', '77:plausible:img2gt-val-objet-loin'] },
    { id: 'oeil', nom: 'L’œil, modèle de l’œil réduit', capacite: 'Modéliser l’œil (lentille convergente et écran) ; déterminer la taille de l’image sur la rétine ; comprendre que le cristallin change de forme pour voir net de près.',
      refs: ['34:oeil2gt-sapp-arbre', '34:oeil2gt-sapp-bougie', '37:prevoir:oeil2gt-ana-sens', '37:prevoir:oeil2gt-ana-distance', '37:prevoir:oeil2gt-ana-proche', '37:prevoir:oeil2gt-ana-bombe', '37:prevoir:oeil2gt-ana-deux-arbres', '77:plausible:oeil2gt-val-image-arbre', '77:plausible:oeil2gt-val-image-droite', '77:plausible:oeil2gt-val-bougie-taille', '77:plausible:oeil2gt-val-focale-proche', '77:plausible:oeil2gt-val-nette-loin'] },
  ],

  '2gt-circuits': [
    { id: 'noeuds', nom: 'La loi des nœuds : le courant se partage', capacite: 'Exploiter la loi des nœuds dans un circuit électrique comportant au plus deux mailles : intensité en série et en dérivation.',
      refs: ['37:prevoir:cir-serie-intensite', '37:prevoir:cir-derivation-intensite', '37:prevoir:cir2gt-ana-noeud', '77:plausible:cir2gt-val-noeud', '77:plausible:cir2gt-val-noeud-ok'] },
    { id: 'mailles', nom: 'La loi des mailles : la tension se partage', capacite: 'Exploiter la loi des mailles dans un circuit électrique comportant au plus deux mailles : tension en série et en dérivation.',
      refs: ['37:prevoir:cir-derivation-tension', '37:prevoir:cir-serie-tension', '37:prevoir:cir-derivation-panne', '37:prevoir:ene-loi-mailles', '77:plausible:cir-tension-serie-val'] },
    { id: 'mesure', nom: 'Mesurer une tension et une intensité', capacite: 'Mesurer une tension (voltmètre en dérivation) et une intensité (ampèremètre en série) ; lire l’unité affichée par le calibre.',
      refs: ['37:prevoir:cir-voltmetre', '37:prevoir:cir2gt-ana-amperemetre', '77:plausible:cir2gt-val-calibre'] },
    { id: 'caracteristique', nom: 'La caractéristique d’un dipôle', capacite: 'Exploiter la caractéristique tension-courant d’un dipôle : reconnaître un comportement ohmique, lire le point de fonctionnement, identifier une situation de proportionnalité.',
      refs: ['37:prevoir:cir2gt-ana-ohmique', '37:prevoir:cir2gt-ana-point', '37:prevoir:ene-pente-caracteristique', '77:plausible:cir2gt-val-lampe-ohm', '77:plausible:cir2gt-val-lampe-ohm-ok'] },
    { id: 'ohm', nom: 'La loi d’Ohm', capacite: 'Utiliser la loi d’Ohm U = R × I pour un résistor : calculer une tension ou une intensité, prévoir l’effet d’un changement de U ou de R.',
      refs: ['34:ohm2', '37:prevoir:cir-ohm-tension-double', '37:prevoir:cir-ohm-resistance-double', '77:plausible:cir-ohm-kohm'] },
    { id: 'capteurs', nom: 'Les capteurs résistifs et leur courbe d’étalonnage', capacite: 'Citer des exemples de capteurs électriques résistifs (CTN, photorésistance) ; produire et utiliser une courbe d’étalonnage reliant la résistance à la température ou à l’éclairement.',
      refs: ['35:ctn', '35:photoresistance', '37:prevoir:cir2gt-ana-photoresistance', '77:plausible:cir2gt-val-ctn'] },
  ],
};
