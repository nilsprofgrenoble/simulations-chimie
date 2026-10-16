// ============================================================
//  BANDEAUX « À PROPOS DE CETTE SIMULATION »
//  Un bloc par simulation, repéré par son numéro (id dans App.jsx).
//  but : à quoi sert la simulation ; apprendre : ce qu'on y apprend ;
//  etapes : par où commencer (3 ou 4 actions concrètes) ; niveau : facultatif.
//  Modifiez librement ces textes : ils s'affichent en haut de chaque simulation.
//  Une simulation refondue avec un parcours guidé n'a plus besoin de bandeau (ex. n° 5).
// ============================================================

export const CONTEXTES = {
  6: {
    but: "Découvrir une boucle de régulation de niveau et la caractéristique statique du procédé, puis trouver son point de fonctionnement.",
    apprendre: "Le vocabulaire de la régulation (grandeur réglée, réglante, perturbatrice, signal de commande et de mesure) et la notion de point de fonctionnement.",
    etapes: [
      "Repérez sur le schéma chaque élément de la boucle : actionneur, système à régler, capteur.",
      "Faites varier le signal de commande Y et observez la hauteur d'eau H obtenue.",
      "Ouvrez l'onglet « Caractéristique statique » pour voir H en fonction du débit, puis l'onglet « Point de fonctionnement ».",
      "Modifiez l'ouverture du robinet de puisage (une perturbation) et regardez le point de fonctionnement se déplacer.",
    ],
    niveau: "Terminale STL",
  },
  7: {
    but: "Faire cristalliser du nitrate de potassium KNO₃ par refroidissement ou par évaporation, à l'aide de son diagramme de solubilité.",
    apprendre: "Distinguer une solution insaturée d'une solution saturée, lire une courbe de solubilité et calculer la masse de cristaux obtenue.",
    etapes: [
      "Choisissez le mode : par refroidissement ou par évaporation.",
      "Fixez la masse de soluté dissoute.",
      "Baissez la température (ou évaporez le solvant) et suivez le point sur le diagramme de solubilité.",
      "Dès que la solution est saturée, lisez la masse cristallisée dans le bilan de matière.",
    ],
    niveau: "Terminale STL",
  },
  8: {
    but: "Suivre une chaîne de mesure complète qui allume les phares d'une voiture quand il fait sombre : photorésistance, pont diviseur, convertisseur analogique-numérique (CAN) d'une carte Arduino, algorithme.",
    apprendre: "Le rôle de chaque maillon d'une chaîne de mesure, la caractéristique d'un capteur et la conversion d'une tension en nombre N.",
    etapes: [
      "Faites varier l'éclairement E, de la nuit au plein soleil.",
      "Suivez la résistance du capteur, la tension Ur du conditionneur et le nombre N donné par le CAN (de 0 à 1023).",
      "Observez la caractéristique Rp = f(E) du capteur.",
      "Activez l'algorithme des phares et cherchez à partir de quel éclairement ils s'allument.",
    ],
    niveau: "Terminale STL",
  },
  12: {
    but: "Simuler une séparation par chromatographie liquide haute performance (CLHP) en phase inverse C18, avec un éluant acétonitrile / eau (modèle de X. Bataille) : schéma de l'appareil (pompe, manomètre, injecteur, colonne, détecteur), chromatogramme enregistré en direct, grandeurs lues sur les pics (t0, tR, k', α, Rs), diagnostic de pannes.",
    apprendre: "L'influence de la colonne, de la composition de l'éluant, du débit et de la température sur les temps de rétention et la qualité de la séparation ; l'identification d'un pic par son temps de rétention, l'élution en gradient, la lecture de la pression et le diagnostic de pannes (colonne encrassée ou vieillie, fuite, bulle, lampe) ; les hypothèses du modèle.",
    etapes: [
      "Choisissez les composés du mélange à séparer, puis cliquez sur « Injecter ».",
      "Faites varier le pourcentage d'acétonitrile et observez à la fois l'écart et la largeur des pics.",
      "Ajustez la colonne (longueur, taille des particules) et le débit, en surveillant le manomètre.",
      "Cherchez des conditions qui séparent tous les pics (Rs ≥ 1,5) dans un temps d'analyse raisonnable, ou lancez le parcours guidé et les défis.",
    ],
    niveau: "BTS Métiers de la chimie",
  },
  55: {
    but: "Simuler une analyse par chromatographie en phase gazeuse couplée à la spectrométrie de masse (ionisation électronique, quadripôle) : courant ionique total, spectre de masse de chaque pic (spectres réels de la base MassBank), recherche en bibliothèque, chromatogrammes d'ions extraits.",
    apprendre: "Le rôle de la source, de l'analyseur et du détecteur ; l'ion moléculaire et le pic de base ; les motifs isotopiques du chlore ; l'identification par la bibliothèque et le temps de rétention ; la séparation de pics co-élués par les ions extraits ; le contrôle air / eau et quelques pannes.",
    etapes: [
      "Choisissez les composés, puis cliquez sur « Injecter ».",
      "Cliquez sur un pic pour afficher son spectre et les propositions de la bibliothèque.",
      "Extrayez un ion caractéristique pour suivre un composé, même s'il co-élue.",
      "Simulez un défaut, ou lancez le parcours guidé et les défis.",
    ],
    niveau: "BTS Métiers de la chimie",
  },
  54: {
    but: "Simuler une analyse par chromatographie en phase gazeuse (CPG) de solvants courants : colonne capillaire apolaire ou polaire, four isotherme ou programmé, gaz vecteur à débit constant, injecteur split / splitless, détecteur FID. Les temps de rétention sont calculés à partir d'indices de Kováts publiés.",
    apprendre: "Le rôle de chaque élément de l'appareil ; l'ordre d'élution sur colonne apolaire et polaire ; l'identification par le temps de rétention ; le choix de la colonne et du programme de température ; l'effet du débit et du rapport de division ; le diagnostic des pannes courantes (septum, liner, flamme du FID, ressuage).",
    etapes: [
      "Choisissez les composés de l'échantillon, puis cliquez sur « Injecter ».",
      "Changez de colonne (apolaire ou polaire) et comparez l'ordre de sortie.",
      "Passez de l'isotherme à la programmation du four, réglez débit et injecteur.",
      "Simulez un défaut, ou lancez le parcours guidé et les défis.",
    ],
    niveau: "BTS Métiers de la chimie",
  },
};
