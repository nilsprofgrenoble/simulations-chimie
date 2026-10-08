// ============================================================
//  BANDEAUX « À PROPOS DE CETTE SIMULATION »
//  Un bloc par simulation, repéré par son numéro (id dans App.jsx).
//  but : à quoi sert la simulation ; apprendre : ce qu'on y apprend ;
//  etapes : par où commencer (3 ou 4 actions concrètes) ; niveau : facultatif.
//  Modifiez librement ces textes : ils s'affichent en haut de chaque simulation.
//  Une simulation refondue avec un parcours guidé n'a plus besoin de bandeau (ex. n° 5).
// ============================================================

export const CONTEXTES = {
  3: {
    but: "Comprendre les titrages électrochimiques à partir des courbes intensité-potentiel i = f(E), sur l'exemple du dosage des ions Fe²⁺ par les ions Ce⁴⁺.",
    apprendre: "Relier la position des courbes i = f(E) à l'allure des courbes de titrage en potentiométrie (à courant nul ou imposé) et en ampérométrie.",
    etapes: [
      "Choisissez un mode de titrage : potentiométrie à i = 0, potentiométrie à courant imposé, ou ampérométrie.",
      "Faites varier x, l'avancement du titrage, de 0 (début) à 2 (bien après l'équivalence).",
      "Observez le point de fonctionnement se déplacer sur les courbes i = f(E), et la courbe de titrage se construire.",
      "Affichez les réactions pour voir quelles espèces réagissent à chaque électrode.",
    ],
    niveau: "BTS Métiers de la chimie",
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
  9: {
    but: "Évaluer la fidélité d'une méthode d'analyse par une étude interlaboratoire (norme ISO 5725) : plusieurs laboratoires analysent le même échantillon, et l'on évalue la méthode, non les laboratoires.",
    apprendre: "Repérer les laboratoires aberrants avec les tests de Cochran (dispersions) et de Grubbs (moyennes), puis calculer la répétabilité sr et la reproductibilité sR.",
    etapes: [
      "Choisissez le nombre de laboratoires p, le nombre d'essais par laboratoire n et la valeur cible.",
      "Générez un jeu de données aléatoire, ou saisissez vos propres résultats.",
      "Suivez les tests de Cochran puis de Grubbs, et regardez quels laboratoires sont écartés.",
      "Lisez les valeurs finales de sr et sR.",
    ],
    niveau: "BTS Métiers de la chimie",
  },
  12: {
    but: "Simuler une séparation par chromatographie liquide haute performance (CLHP) en phase inverse C18, avec un éluant acétonitrile / eau (modèle de X. Bataille).",
    apprendre: "L'influence de la colonne, de la composition de l'éluant, du débit et de la température sur les temps de rétention et la qualité de la séparation.",
    etapes: [
      "Choisissez les composés du mélange à séparer.",
      "Faites varier le pourcentage de solvant organique et observez le chromatogramme.",
      "Ajustez la colonne (longueur, taille des particules) et le débit.",
      "Cherchez des conditions qui séparent tous les pics, dans un temps d'analyse raisonnable.",
    ],
    niveau: "BTS Métiers de la chimie",
  },
  13: {
    but: "Quantifier les constituants d'un mélange en chromatographie par étalonnage interne ou par normalisation interne.",
    apprendre: "Le principe de chaque méthode, et le calcul des concentrations à partir des rapports d'aires et des coefficients de réponse.",
    etapes: [
      "Choisissez la méthode : étalon interne ou normalisation interne, et lisez son principe.",
      "Suivez le mode opératoire de l'exemple (hydrobenzoïne, benzoïne, benzile), ou saisissez vos propres données.",
      "Observez les chromatogrammes obtenus.",
      "Retrouvez les concentrations avec la formule affichée.",
    ],
    niveau: "BTS Métiers de la chimie",
  },
  15: {
    but: "Déterminer la plus petite variation de température qu'une chaîne de mesure peut détecter, à partir du quantum de son convertisseur analogique-numérique (CAN).",
    apprendre: "Le quantum d'un CAN, la sensibilité d'un capteur, et comment les deux fixent la résolution en température.",
    etapes: [
      "Générez des données d'exemple (température T et tension Ur), ou utilisez vos mesures de TP.",
      "Choisissez un modèle qui relie la température à la tension mesurée.",
      "Zoomez sur la courbe pour voir les « marches » du CAN : la largeur d'une marche est le quantum.",
      "Lisez la résolution en température qui en découle, et regardez si elle change selon la température.",
    ],
    niveau: "Terminale STL",
  },
};
