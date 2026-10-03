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
  4: {
    but: "Prévoir si une résine ou un polymère se dissout dans un solvant, ou dans un mélange de solvants, grâce aux paramètres de solubilité de Hansen.",
    apprendre: "Les trois paramètres δD, δP et δH, la sphère de solubilité de rayon R, et comment un mélange de deux mauvais solvants peut devenir un bon solvant.",
    etapes: [
      "Entrez les paramètres de la résine et le rayon de sa sphère de solubilité (ou gardez l'exemple).",
      "Cochez les solvants à afficher, et regardez lesquels tombent à l'intérieur de la sphère.",
      "Composez un mélange de deux solvants en faisant varier leurs proportions.",
      "Cherchez une proportion qui fait entrer le mélange dans la sphère.",
    ],
    niveau: "BTS Métiers de la chimie",
  },
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
  9: {
    but: "Valider une méthode d'analyse par une étude inter-laboratoires (norme ISO 5725) : plusieurs laboratoires analysent le même échantillon.",
    apprendre: "Repérer les laboratoires aberrants avec les tests de Cochran (dispersions) et de Grubbs (moyennes), puis calculer la répétabilité sr et la reproductibilité sR.",
    etapes: [
      "Choisissez le nombre de laboratoires p, le nombre d'essais par laboratoire n et la valeur cible.",
      "Générez un jeu de données aléatoire, ou saisissez vos propres résultats.",
      "Suivez les tests de Cochran puis de Grubbs, et regardez quels laboratoires sont écartés.",
      "Lisez les valeurs finales de sr et sR.",
    ],
    niveau: "BTS Métiers de la chimie",
  },
  10: {
    but: "Comprendre le fonctionnement d'un spectrophotomètre et la loi de Beer-Lambert, puis doser une espèce colorée.",
    apprendre: "Ce qu'est l'absorbance, pourquoi on travaille au maximum d'absorption, et comment une courbe d'étalonnage permet de retrouver une concentration.",
    etapes: [
      "Choisissez l'espèce colorée (analyte).",
      "Cliquez sur le spectre d'absorption pour choisir la longueur d'onde de travail : visez le maximum.",
      "Affichez une courbe d'étalonnage (exemple, saisie manuelle ou copier-coller depuis un tableur).",
      "Utilisez la courbe pour trouver la concentration d'une solution inconnue à partir de son absorbance.",
    ],
    niveau: "1re générale",
  },
  11: {
    but: "Réaliser un dosage par étalonnage, en spectrophotométrie ou avec une autre technique (absorption atomique, CLHP…).",
    apprendre: "Construire et exploiter une droite d'étalonnage par régression linéaire, et en déduire la concentration d'un échantillon.",
    etapes: [
      "Choisissez la méthode : spectrophotométrie (Beer-Lambert) ou autre méthode.",
      "Choisissez l'analyte et la longueur d'onde (en spectrophotométrie).",
      "Entrez vos solutions étalons : exemple, saisie manuelle ou copier-coller depuis un tableur.",
      "Analysez la droite d'étalonnage, puis calculez la concentration de l'échantillon.",
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
  14: {
    but: "Formuler une peinture et prévoir son aspect une fois sèche (brillant, satiné ou mat).",
    apprendre: "Calculer l'extrait sec, la concentration pigmentaire volumique CPV, la CPV critique (CPVC) et le rapport λ = CPV / CPVC qui fixe l'aspect du film.",
    etapes: [
      "Ajustez les masses des matières premières, en repérant le rôle de chacune (solvant, liant, pigment, charge, additif).",
      "Lisez l'extrait sec, la CPV, la CPVC et λ dans les résultats.",
      "Regardez l'aspect prévu pour le film, puis lancez l'animation du séchage.",
      "Modifiez la formulation pour obtenir un autre aspect.",
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
  16: {
    but: "Évaluer la performance de chaque laboratoire, ou de chaque technicien d'une classe, qui a analysé le même échantillon, à l'aide du critère du z-score.",
    apprendre: "Calculer un z-score et l'interpréter : satisfaisant, discutable ou insatisfaisant.",
    etapes: [
      "Générez un jeu de données, ou collez les résultats de votre classe.",
      "Observez les résultats de chaque laboratoire par rapport à la valeur de référence.",
      "Lisez le z-score de chacun et son interprétation.",
    ],
    niveau: "BTS Métiers de la chimie",
  },
};
