// ═══════════════════════════════════════════════════════════════════════════
//  SOUS-THÈMES des chapitres de Terminale spécialité « Mouvement et interactions » :
//  « tg-decrire-mouvement » (Décrire un mouvement), « tg-newton » (Relier les actions appliquées à un système à son mouvement)
//  et « tg-fluides » (Modéliser l’écoulement d’un fluide).
//  Même structure que SOUS_THEMES (voir sousThemes.js) ; à intégrer dans SOUS_THEMES.
//  Un sous-thème = une capacité exigible du programme (colonne « capacités exigibles »). Chaque exercice du chapitre est dans UN seul sous-thème.
//  Les références « 36:… » (exercices de calcul) ne comptent pas dans le chapitre (ils servent à tous les chapitres) mais accompagnent la carte.
// ═══════════════════════════════════════════════════════════════════════════
export default {
  'tg-decrire-mouvement': [
    { id: 'derivees', nom: 'Vitesse et accélération : dériver la position', capacite: 'Définir le vecteur vitesse comme la dérivée du vecteur position et le vecteur accélération comme la dérivée du vecteur vitesse ; en établir les coordonnées cartésiennes à partir de x(t).',
      refs: ['36:vac-calcul', '34:vac-sapp-derivee', '37:prevoir:vac-ana-tangente', '37:prevoir:vac-ana-polynome', '77:plausible:vac-val-derivee', '77:plausible:vac-val-ordre'] },
    { id: 'chronophoto', nom: 'Chronophotographie : vitesse et accélération', capacite: 'Exploiter une chronophotographie pour déterminer les coordonnées approchées, ou représenter les vecteurs vitesse et accélération.',
      refs: ['34:vac-sapp-chrono', '37:mouvement:vac-ana-sommet', '77:plausible:vac-val-signe'] },
    { id: 'rectilignes', nom: 'L’accélération des mouvements rectilignes', capacite: 'Caractériser le vecteur accélération d’un mouvement rectiligne, rectiligne uniforme et rectiligne uniformément accéléré.',
      refs: ['37:mouvement:vac-ana-freinage', '37:mouvement:vac-ana-deux', '37:mouvement:vac-ana-mrua', '77:plausible:vac-val-mrua'] },
    { id: 'frenet', nom: 'Le repère de Frenet', capacite: 'Citer et exploiter les expressions des coordonnées des vecteurs vitesse et accélération dans le repère de Frenet, pour un mouvement circulaire.',
      refs: ['36:fre-calcul', '34:fre-sapp-circ', '37:prevoir:fre-ana-vitesse', '37:prevoir:fre-ana-rayon', '37:prevoir:fre-ana-freinage', '77:plausible:fre-val-conversion'] },
    { id: 'circulaire-uniforme', nom: 'Le mouvement circulaire uniforme', capacite: 'Caractériser le vecteur accélération d’un mouvement circulaire et d’un mouvement circulaire uniforme.',
      refs: ['37:prevoir:fre-ana-uniforme', '77:plausible:fre-val-nulle', '77:plausible:fre-val-ok'] },
  ],
  'tg-newton': [
    { id: 'newton', nom: 'Deuxième loi de Newton', capacite: 'Utiliser la deuxième loi de Newton pour déterminer l’accélération du centre de masse (forces connues) ou la somme des forces (mouvement connu), y compris à l’équilibre.',
      refs: ['36:nwt-calcul', '34:nwt-sapp-chariot', '34:nwt-sapp-cabine', '37:prevoir:nwt-ana-balance', '37:prevoir:nwt-ana-masse', '77:plausible:nwt-val-somme', '77:plausible:nwt-val-caisse'] },
    { id: 'galileen', nom: 'Centre de masse et référentiel galiléen', capacite: 'Justifier qualitativement la position du centre de masse d’un système ; discuter qualitativement du caractère galiléen d’un référentiel pour le mouvement étudié.',
      refs: ['37:prevoir:nwt-ana-centre-masse', '37:prevoir:nwt-ana-galileen', '37:prevoir:nwt-ana-galileen-terre', '77:plausible:nwt-val-centre-masse'] },
    { id: 'pesanteur', nom: 'Mouvement dans un champ de pesanteur uniforme', capacite: 'Montrer que le mouvement dans un champ uniforme est plan ; établir et exploiter les équations horaires et la trajectoire.',
      refs: ['36:pes-calcul', '34:pes-sapp-lancer', '37:prevoir:pes-ana-plan', '37:prevoir:pes-ana-masse', '37:prevoir:pes-ana-sommet', '37:prevoir:pes-ana-lune', '77:plausible:pes-val-signe', '77:plausible:pes-val-portee'] },
    { id: 'condensateur', nom: 'Particule chargée dans un condensateur plan', capacite: 'Discuter de l’influence des grandeurs physiques sur le champ électrique d’un condensateur plan (E = U / d) ; établir le mouvement d’une particule chargée dans ce champ uniforme.',
      refs: ['36:cpl-calcul', '34:cpl-sapp-particule', '37:prevoir:cpl-ana-sens', '37:prevoir:cpl-ana-vitesse', '77:plausible:cpl-val-champ', '77:plausible:cpl-val-poids'] },
    { id: 'energie', nom: 'Aspects énergétiques dans un champ uniforme', capacite: 'Exploiter la conservation de l’énergie mécanique ou le théorème de l’énergie cinétique dans le cas du mouvement dans un champ uniforme.',
      refs: ['34:pes-sapp-energie', '37:prevoir:pes-ana-energie', '37:prevoir:cpl-ana-tension', '77:plausible:pes-val-ok', '77:plausible:cpl-val-vitesse', '77:plausible:cpl-val-proton'] },
    { id: 'accelerateur', nom: 'L’accélérateur linéaire de particules', capacite: 'Décrire le principe d’un accélérateur linéaire de particules chargées.',
      refs: ['37:prevoir:cpl-ana-tubes', '37:prevoir:cpl-ana-tubes-longueur', '37:prevoir:cpl-ana-alternance', '77:plausible:cpl-val-tubes'] },
    { id: 'satellites', nom: 'Satellites : vitesse, période et lois de Kepler', capacite: 'Déterminer les vecteurs vitesse et accélération d’un système en mouvement circulaire dans un champ de gravitation ; établir et exploiter la troisième loi de Kepler.',
      refs: ['36:kep-calcul', '34:kep-sapp-satellite', '37:prevoir:kep-ana-masse', '37:prevoir:kep-ana-rayon', '37:prevoir:kep-ana-troisieme', '77:plausible:kep-val-vitesse', '77:plausible:kep-val-kepler'] },
    { id: 'geostationnaire', nom: 'Le satellite géostationnaire', capacite: 'Reconnaître un satellite géostationnaire et déterminer son orbite à partir de la troisième loi de Kepler.',
      refs: ['37:prevoir:kep-ana-geo', '37:prevoir:kep-ana-geo-altitude', '77:plausible:kep-val-geo'] },
  ],
  'tg-fluides': [
    { id: 'archimede-origine', nom: 'D’où vient la poussée d’Archimède ?', capacite: 'Expliquer qualitativement l’origine de la poussée d’Archimède (la pression augmente avec la profondeur).',
      refs: ['37:prevoir:arc-ana-origine', '37:prevoir:arc-ana-profondeur', '77:plausible:arc-val-pressions'] },
    { id: 'archimede-expression', nom: 'Valeur et sens de la poussée d’Archimède', capacite: 'Utiliser l’expression vectorielle de la poussée d’Archimède : direction, sens et valeur Π = ρ·V·g.',
      refs: ['36:arc-calcul', '34:arc-sapp-flotteur.1', '37:prevoir:arc-ana-masse', '77:plausible:arc-val-poids', '77:plausible:arc-val-unite'] },
    { id: 'flottaison', nom: 'Flotter ou couler', capacite: 'Utiliser la poussée d’Archimède pour prévoir la flottaison d’un corps et sa part immergée (à l’équilibre, poids = poussée).',
      refs: ['34:arc-sapp-flotteur.0', '37:prevoir:arc-ana-fluide', '37:prevoir:arc-ana-coule', '77:plausible:arc-val-iceberg', '77:plausible:arc-val-bateau'] },
    { id: 'debit', nom: 'Débit volumique et vitesse d’un fluide', capacite: 'Exploiter la conservation du débit volumique d’un fluide incompressible pour déterminer une vitesse.',
      refs: ['36:ber-calcul', '34:ber-sapp-venturi.0', '37:prevoir:ber-ana-debit', '77:plausible:ber-val-debit', '77:plausible:ber-val-elargissement'] },
    { id: 'bernoulli', nom: 'La relation de Bernoulli', capacite: 'Exploiter la relation de Bernoulli, fournie, pour étudier qualitativement puis quantitativement l’écoulement permanent d’un fluide incompressible.',
      refs: ['34:ber-sapp-venturi.1', '37:prevoir:ber-ana-section', '37:prevoir:ber-ana-conditions', '77:plausible:ber-val-bernoulli'] },
    { id: 'venturi', nom: 'L’effet Venturi', capacite: 'Relier le rétrécissement d’une conduite, la vitesse du fluide et sa pression (effet Venturi).',
      refs: ['37:prevoir:ber-ana-venturi', '37:prevoir:ber-ana-venturi-debit', '77:plausible:ber-val-venturi'] },
    { id: 'torricelli', nom: 'Vidange d’un réservoir', capacite: 'Appliquer la relation de Bernoulli à la vidange d’un grand réservoir ouvert pour exprimer la vitesse de sortie.',
      refs: ['37:prevoir:ber-ana-torricelli', '37:prevoir:ber-ana-torricelli-profondeur', '77:plausible:ber-val-torricelli'] },
  ],
};
