// ═══════════════════════════════════════════════════════════════════════════
//  SOUS-THÈMES des chapitres de Seconde GT « Mouvement et interactions » et « Mesure et incertitudes » :
//  2gt-forces (Modéliser une action par une force), 2gt-mouvement (Décrire un mouvement), 2gt-mesure (Mesurer et exprimer un résultat).
//  Même structure que SOUS_THEMES (voir sousThemes.js) ; à intégrer dans SOUS_THEMES.
//  Un sous-thème = une capacité exigible du programme de 2GT (texte dans programmes/2GT.md). Chaque exercice est dans UN seul sous-thème.
// ═══════════════════════════════════════════════════════════════════════════
export default {
  '2gt-forces': [
    { id: 'force-vecteur', nom: 'Une force se représente par une flèche', capacite: 'Modéliser l’action d’un objet sur un autre par une force, et la représenter par un vecteur qui a une norme (la longueur de la flèche), une direction et un sens.',
      refs: ['37:prevoir:frc-echelle-vecteur', '37:prevoir:frc-direction-poids', '37:prevoir:frc-vecteur-sens', '37:hypothese:frc-hyp-vecteur', '36:vecteur-somme'] },
    { id: 'reciproques', nom: 'Quand A pousse B, B pousse A', capacite: 'Exploiter le principe des actions réciproques : deux objets qui interagissent s’exercent des forces de même valeur, de même direction et de sens opposés.',
      refs: ['37:prevoir:frc-actions-reciproques', '37:prevoir:ch-reaction', '37:prevoir:frc-reciproques-tir', '37:prevoir:frc-reciproques-camion'] },
    { id: 'contact-distance', nom: 'Actions à distance, actions de contact', capacite: 'Distinguer les actions à distance (gravitation, poids) des actions de contact (support, fil) et repérer les forces qui s’exercent sur un objet.',
      refs: ['37:prevoir:frc-distance-contact', '37:prevoir:frc-liste-forces-lustre', '37:prevoir:frc-inventaire-balle'] },
    { id: 'gravitation', nom: 'L’attraction de gravitation', capacite: 'Utiliser l’expression de la force d’interaction gravitationnelle F = G·m₁·m₂ / d² : comment elle change quand la masse ou la distance change.',
      refs: ['34:gravi.0', '37:relation:ch-grav', '37:prevoir:ch-d-double', '37:prevoir:ch-m-double', '77:plausible:gravitation-eleves', '37:prevoir:frc-iss-flotte'] },
    { id: 'poids', nom: 'Le poids d’un objet', capacite: 'Utiliser l’expression du poids P = m × g, approché par l’attraction de la planète sur l’objet ; ne pas confondre masse et poids.',
      refs: ['34:poids2', '35:poids-planete', '37:prevoir:frc-masse-poids-lune', '37:prevoir:frc-poids-proportionnel', '77:plausible:frc-poids-pomme', '77:plausible:frc-poids-rover', '77:plausible:poids-lune'] },
    { id: 'support', nom: 'La force d’un support', capacite: 'Représenter qualitativement la force exercée par un support (table, sol) dans une situation d’équilibre simple.',
      refs: ['37:prevoir:frc-objet-immobile', '77:plausible:frc-reaction-sol', '37:prevoir:frc-support-sac', '37:prevoir:frc-support-pile'] },
    { id: 'inertie', nom: 'Le principe d’inertie', capacite: 'Exploiter le principe d’inertie ou sa contraposée : immobile ou mouvement rectiligne uniforme ⇒ forces qui se compensent ; forces qui ne se compensent pas ⇒ la vitesse change.',
      refs: ['37:prevoir:frc-vitesse-constante', '37:prevoir:frc-cycliste-accelere', '37:prevoir:frc-glissement-arret', '37:prevoir:frc-chrono-uniforme', '77:plausible:frc-parachutiste-frottement-ok'] },
    { id: 'variation-vitesse', nom: 'La variation de vitesse et la chute libre', capacite: 'Relier la variation du vecteur vitesse entre deux instants voisins à la somme des forces, en particulier dans une chute libre à une dimension.',
      refs: ['34:chute2', '36:vecteur-difference', '37:prevoir:frc-dv-chute', '37:prevoir:frc-dv-montee', '37:prevoir:frc-sommet-trajectoire', '37:prevoir:frc-dv-freinage', '37:prevoir:frc-dv-lune', '37:prevoir:frc-chute-sans-air'] },
  ],
  '2gt-mouvement': [
    { id: 'referentiel', nom: 'Le mouvement dépend du point de vue', capacite: 'Choisir un référentiel pour décrire un mouvement et expliquer comment, dans une translation, la description du mouvement change avec le référentiel.',
      refs: ['37:prevoir:mvt-referentiel', '37:prevoir:mvt-manege-ref', '37:prevoir:mvt-bagage', '37:prevoir:mvt-bagage-quai', '37:prevoir:mvt-valve', '37:mouvement:trajet-train-quai', '37:mouvement:trajet-train-dans', '37:mouvement:trajet-valve-sol', '37:mouvement:trajet-valve-velo', '37:prevoir:mvt-ref-cyclistes', '37:prevoir:mvt-ref-couloir'] },
    { id: 'echelles', nom: 'Choisir les bonnes échelles', capacite: 'Identifier les échelles de temps et d’espace adaptées à la description d’un mouvement.',
      refs: ['37:prevoir:mvt-echelle-temps', '37:prevoir:mvt-echelle-colibri', '37:prevoir:mvt-echelle-train'] },
    { id: 'point-trajectoire', nom: 'Un point et sa trajectoire', capacite: 'Décrire le mouvement d’un objet par celui d’un point (et ce que l’on perd en le faisant) ; caractériser différentes trajectoires.',
      refs: ['37:hypothese:mvt-decrire', '37:hypothese:mvt-point', '37:prevoir:mvt-manege', '37:prevoir:mvt-lune', '37:mouvement:chrono-cercle', '37:mouvement:chrono-lancer', '37:prevoir:mvt-point-perte'] },
    { id: 'vitesse-moyenne', nom: 'La vitesse moyenne', capacite: 'Définir et calculer la vitesse moyenne (distance parcourue divisée par la durée), changer d’unité (m·s⁻¹ et km·h⁻¹) et juger si le résultat est vraisemblable.',
      refs: ['34:trajet', '34:course', '34:vitesse2', '35:cycliste', '36:vitesses', '37:relation:mvt-vitesse', '37:relation:mvt-distance', '37:relation:mvt-duree', '37:hypothese:mvt-moyenne',
        '37:prevoir:mvt-duree-double', '37:prevoir:mvt-vitesse-double', '77:plausible:mvt-val-cycliste', '77:plausible:mvt-val-voiture', '77:plausible:mvt-val-tgv', '77:plausible:mvt-vitesse-terre-orbite-ok'] },
    { id: 'vecteur-vitesse', nom: 'Le vecteur vitesse', capacite: 'Approcher le vecteur vitesse d’un point par le vecteur déplacement MM′ divisé par la durée Δt entre deux positions voisines, et le représenter (direction, sens, longueur).',
      refs: ['37:mouvement:mvt-vecteur-deplacement', '37:mouvement:mvt-vecteur-vitesse-sens', '37:mouvement:mvt-vecteur-vitesse-longueur', '77:plausible:mvt-vecteur-vitesse-calcul'] },
    { id: 'rectiligne', nom: 'Mouvement uniforme ou non uniforme', capacite: 'Caractériser un mouvement rectiligne uniforme ou non uniforme (accéléré, ralenti) à partir d’une chronophotographie ou de mesures de vitesse.',
      refs: ['37:prevoir:mvt-chrono-uniforme', '37:prevoir:mvt-chrono-accelere', '37:prevoir:mvt-chrono-ralenti', '37:mouvement:chrono-uniforme', '37:mouvement:chrono-accelere', '37:mouvement:chrono-ralenti',
        '37:prevoir:mvt-pomme', '37:prevoir:mvt-freinage', '37:prevoir:mvt-regulateur'] },
  ],
  '2gt-mesure': [
    { id: 'moyenne-histogramme', nom: 'Série de mesures : histogramme et moyenne', capacite: 'Exploiter une série de mesures indépendantes d’une même grandeur : lire un histogramme, calculer une moyenne, savoir quand elle a un sens.',
      refs: ['36:mes2gt-var-calcul', '34:mes2gt-var-sapp-histo', '34:mes2gt-var-sapp-moyenne', '37:prevoir:mes2gt-var-ana-derive', '37:prevoir:mes2gt-var-ana-deux-bosses', '77:plausible:mes2gt-var-val-moyenne-hors'] },
    { id: 'dispersion', nom: 'La dispersion et l’écart-type', capacite: 'Évaluer la dispersion d’une série de mesures et l’exprimer par l’écart-type : largeur de l’histogramme, signification de la valeur obtenue.',
      refs: ['37:prevoir:mes2gt-var-ana-ecart-nul', '77:plausible:mes2gt-var-val-ecart-type-grand', '77:plausible:mes2gt-var-val-largeur-ecart-type', '37:prevoir:mes2gt-var-ana-ecart-type-sens'] },
    { id: 'instrument-protocole', nom: 'Instrument et protocole', capacite: 'Discuter de l’influence de l’instrument de mesure et du protocole sur la dispersion des mesures.',
      refs: ['37:prevoir:mes2gt-var-ana-instrument', '37:prevoir:mes2gt-var-ana-protocole', '37:prevoir:mes2gt-var-ana-plus-mesures', '77:plausible:mes2gt-var-val-dix-intervalles', '77:plausible:mes2gt-var-val-cent-mesures'] },
    { id: 'incertitude-type', nom: 'L’incertitude-type', capacite: 'Expliquer qualitativement la signification d’une incertitude-type et l’évaluer par une approche statistique (u = s ÷ √n).',
      refs: ['36:mes2gt-inc-calcul', '34:mes2gt-inc-sapp-incertitude', '37:prevoir:mes2gt-inc-ana-plus-de-mesures', '37:prevoir:mes2gt-inc-ana-moins-de-mesures', '37:prevoir:mes2gt-inc-ana-meilleur-instrument',
        '77:plausible:mes2gt-inc-val-n-divise', '77:plausible:mes2gt-inc-val-calcul-ok'] },
    { id: 'ecriture', nom: 'Écrire un résultat', capacite: 'Écrire le résultat d’une mesure avec un nombre adapté de chiffres significatifs, en accord avec l’incertitude-type.',
      refs: ['77:plausible:mes2gt-inc-val-trop-de-chiffres', '37:prevoir:mes2gt-inc-ana-arrondi', '77:plausible:mes2gt-inc-val-ecriture-ok'] },
    { id: 'reference', nom: 'Comparer à une valeur de référence', capacite: 'Comparer qualitativement un résultat à une valeur de référence : la référence est-elle dans la zone [m − u ; m + u] ?',
      refs: ['34:mes2gt-inc-sapp-reference', '77:plausible:mes2gt-inc-val-compatible-faux', '77:plausible:mes2gt-inc-val-systematique', '37:prevoir:mes2gt-inc-ana-decalage', '37:prevoir:mes2gt-inc-ana-conclusion-change'] },
  ],
};
