// Sous-thèmes du chapitre « 1g-evolution » (Suivi de l’évolution d’un système, siège d’une transformation), Première spécialité.
// Même structure que SOUS_THEMES (src/sousThemes.js) : à intégrer par fusion. Un exercice dans un seul sous-thème.
export default {
  '1g-evolution': [
    { id: 'quantite', nom: 'Quantité de matière', capacite: 'Calculer une quantité de matière à partir d’une masse (masse molaire) ou du volume d’un gaz (volume molaire).',
      refs: ['34:mol1g-qte-solide', '34:mol1g-qte-gaz', '37:prevoir:mol1g-qte-masse-egale', '37:prevoir:mol1g-qte-gaz-temperature', '37:prevoir:mol1g-qte-gaz-nature', '37:prevoir:mol1g-qte-liquide-volume',
        '77:plausible:mol1g-qte-val-mg', '77:plausible:mol1g-qte-val-gaz', '77:plausible:mol1g-qte-val-masse', '77:plausible:mol1g-qte-val-eau', '36:mol1g-qte-calcul'] },
    { id: 'concentration', nom: 'Concentration, dissolution, dilution', capacite: 'Calculer une concentration en quantité de matière ; préparer une solution par dissolution ou par dilution.',
      refs: ['34:mol1g-conc-dissol', '34:mol1g-conc-dilution', '37:relation:dilution', '37:prevoir:mol1g-conc-volume-double', '37:prevoir:mol1g-conc-masse-egale', '37:prevoir:mol1g-conc-prelevement-double', '37:prevoir:mol1g-conc-facteur-volume', '37:prevoir:mol1g-conc-verre-precision',
        '77:plausible:mol1g-conc-val-ml', '77:plausible:mol1g-conc-val-sel', '77:plausible:mol1g-conc-val-prelevement', '77:plausible:mol1g-conc-val-facteur', '77:plausible:mol1g-conc-val-masse', '77:plausible:vinaigre-dilution', '77:plausible:vinaigre-dilution-ok', '36:mol1g-conc-calcul'] },
    { id: 'redox', nom: 'Couples redox et équations', capacite: 'Écrire les demi-équations d’un couple oxydant-réducteur puis l’équation d’une réaction d’oxydo-réduction.',
      refs: ['34:redox1g-equation', '37:prevoir:redox1g-fe2-deux-roles', '37:prevoir:redox1g-al-cu-proportions', '37:prevoir:redox1g-demi-fausse', '37:prevoir:redox1g-acide-h-plus',
        '77:plausible:redox1g-val-demi-charge', '77:plausible:redox1g-val-equation-juste', '77:plausible:redox1g-val-electrons-presents', '77:plausible:redox1g-val-al-cu', '77:plausible:redox1g-val-permanganate', '77:plausible:redox1g-val-iode', '36:redox1g-calcul'] },
    { id: 'avancement', nom: 'Avancement et réactif limitant', capacite: 'Établir un bilan de matière : avancement maximal, réactif limitant, quantités des produits.',
      refs: ['37:relation:evo-avancement-limitant', '37:prevoir:evo-avancement-exces', '77:plausible:avancement-max', '77:plausible:evo-avancement-bilan', '35:cinetique'] },
    { id: 'titrage', nom: 'Titrer une espèce chimique', capacite: 'Repérer l’équivalence d’un titrage et en déduire la quantité ou la concentration de l’espèce titrée.',
      refs: ['34:aspirine', '35:titrage', '36:titrage-direct', '37:probleme:vinaigre', '37:relation:diacide', '37:hypothese:titrage', '37:prevoir:evo-equivalence-limitant',
        '77:plausible:aspirine-masse', '77:compat:vinaigre-etiquette', '77:compat:aspirine-comprime', '77:compat:deux-methodes-conc', '77:compat:etalon-nacl'] },
    { id: 'spectro', nom: 'Absorbance et concentration', capacite: 'Déterminer une concentration par spectrophotométrie : loi de Beer-Lambert et droite d’étalonnage.',
      refs: ['34:beer', '35:beer', '37:relation:etalonnage', '37:hypothese:beer', '37:prevoir:absorbance', '77:plausible:absorbance-5'] },
    { id: 'plus-loin', nom: 'Pour aller plus loin', capacite: 'Méthodes d’analyse de l’enseignement supérieur (BTS), hors capacités exigibles de Première.',
      refs: ['37:prevoir:chr-clhp-acn', '37:prevoir:chr-cpg-temperature', '37:prevoir:chr-sm-ion-moleculaire', '37:prevoir:elc-demi-equivalence', '37:prevoir:elc-apres-equivalence', '37:prevoir:elc-ampero-courant-limite', '37:prevoir:iE-mur-eau-ph', '37:prevoir:iE-surtension-oxydation-eau',
        '77:plausible:chr-resolution-ok', '77:plausible:elc-equivalence-hors-intervalle', '77:plausible:elc-demi-equivalence-ok', '77:plausible:iE-fer-ph-faux', '77:plausible:iE-eau-ph7-ok'] },
  ],
};
