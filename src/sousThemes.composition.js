// Sous-thèmes du chapitre « Déterminer la composition d’un système par des méthodes physiques et chimiques » (Terminale spécialité).
// Même structure que SOUS_THEMES (voir sousThemes.js) ; à intégrer dans SOUS_THEMES lors de la fusion.
export default {
  'tg-composition': [
    { id: 'acide-base', nom: 'Transferts de H⁺ : couples et équations', capacite: 'Identifier un couple acide-base, écrire l’équation d’une réaction acide-base et représenter un ion ou une molécule par son schéma de Lewis.',
      refs: ['34:brn-sapp-lewis', '34:brn-sapp-melange', '37:prevoir:brn-ana-conjuguee', '37:prevoir:brn-ana-amphotere', '37:prevoir:brn-ana-soude', '77:plausible:brn-val-equation', '77:plausible:brn-val-lewis'] },
    { id: 'ph', nom: 'pH et concentration en ions oxonium', capacite: 'Relier le pH à la concentration en ions oxonium, exprimer un résultat avec le bon nombre de chiffres significatifs et prévoir l’effet d’une dilution.',
      refs: ['34:phc-ph-hcl', '34:phc-dilution-ph', '37:prevoir:phc-dilution-facteur', '37:prevoir:phc-comparer-ph', '37:prevoir:phc-ecrire-resultat', '77:plausible:phc-val-signe', '77:plausible:phc-val-dilution', '77:plausible:phc-val-limite'] },
    { id: 'kohlrausch', nom: 'Conductivité d’une solution ionique', capacite: 'Calculer la conductivité d’une solution avec la loi de Kohlrausch et connaître son domaine de validité.',
      refs: ['34:cdt-sapp-sel', '37:prevoir:cdt-ana-domaine', '77:plausible:cdt-val-unite', '77:plausible:cmp-cdt-val-ions'] },
    { id: 'etalonnage-cdt', nom: 'Doser par étalonnage conductimétrique', capacite: 'Utiliser la constante de cellule et une droite d’étalonnage pour déterminer une concentration par conductimétrie.',
      refs: ['34:etl-sapp-cellule', '34:etl-sapp-droite', '37:prevoir:etl-ana-cellule', '37:prevoir:etl-ana-conditions', '37:prevoir:etl-ana-limite', '77:plausible:etl-val-gsigma', '77:plausible:etl-val-prolonge'] },
    { id: 'uv-visible', nom: 'Spectrophotométrie UV-visible', capacite: 'Exploiter un spectre d’absorption et la loi de Beer-Lambert pour identifier un colorant et déterminer sa concentration.',
      refs: ['34:uvv-sapp-dosage', '37:prevoir:uvv-ana-couleur', '37:prevoir:uvv-ana-identifier', '37:prevoir:uvv-ana-limite', '37:prevoir:cmp-uvv-longueur-onde', '77:plausible:uvv-val-conversion', '77:plausible:uvv-val-ok'] },
    { id: 'infrarouge', nom: 'Spectroscopie infrarouge', capacite: 'Exploiter un spectre infrarouge et un tableau de données pour identifier des groupes caractéristiques.',
      refs: ['34:irt-sapp-bande', '37:prevoir:irt-ana-esterification', '37:prevoir:irt-ana-oh-nh', '37:prevoir:irt-ana-empreinte', '77:plausible:irt-val-conversion', '77:plausible:irt-val-cetone', '77:plausible:irt-val-ester'] },
    { id: 'titrage-ph', nom: 'Titrage suivi par pH-métrie', capacite: 'Repérer l’équivalence d’un titrage pH-métrique, choisir un indicateur coloré et exploiter le volume équivalent.',
      refs: ['34:titph-ca', '34:titph-compo', '37:prevoir:titph-apres-eq', '37:prevoir:titph-phe-benz', '37:prevoir:titph-indic-benz', '37:prevoir:cmp-titph-equivalence', '77:plausible:titph-val-phe', '77:plausible:titph-val-ca'] },
    { id: 'titrage-cdt', nom: 'Titrage suivi par conductimétrie', capacite: 'Interpréter l’allure de la courbe σ = f(V) d’un titrage conductimétrique et en déduire le volume équivalent.',
      refs: ['34:cdt-sapp-equiv', '34:cdt-sapp-pente', '34:cdt-sapp-compo', '37:prevoir:cdt-ana-dilution', '37:prevoir:cdt-ana-nitrique', '37:prevoir:cdt-ana-apres', '37:prevoir:cmp-cdt-avant-equiv', '77:plausible:cdt-val-spectateurs', '77:plausible:cdt-val-conc', '77:plausible:cdt-val-faible'] },
  ],
};
