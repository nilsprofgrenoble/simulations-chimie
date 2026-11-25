// ═══════════════════════════════════════════════════════════════════════════
//  SOUS-THÈMES des chapitres de chimie de Première spécialité (programme : « Constitution et transformations de la matière », parties 2 et 3) :
//  structure-entites, 1g-cohesion, 1g-combustions, 1g-organique, 1g-synthese.
//  Même structure que SOUS_THEMES (voir sousThemes.js) ; à intégrer dans SOUS_THEMES. Chaque exercice du chapitre est dans UN seul sous-thème.
//  Références : « 37:prevoir:id » (ANA), « 77:plausible:id » (VAL), « 34:id » (S'APP, toutes les questions), « 36:id » (REA, calcul).
// ═══════════════════════════════════════════════════════════════════════════
export default {
  // 2.A De la structure à la polarité d'une entité
  'structure-entites': [
    { id: 'lewis-molecules', nom: 'Schéma de Lewis d’une molécule', capacite: 'Établir le schéma de Lewis d’une molécule (O₂, H₂, N₂, H₂O, CO₂, NH₃, CH₄, HCl) à partir du tableau périodique : électrons de valence, doublets liants et non liants.',
      refs: ['34:lewis1g-entite', '36:lewis1g-calcul', '37:prevoir:lewis1g-carbone-liaisons', '77:plausible:lewis1g-val-diazote', '77:plausible:lewis1g-val-eau'] },
    { id: 'lewis-ions', nom: 'Schéma de Lewis d’un ion, lacune électronique', capacite: 'Établir le schéma de Lewis d’un ion mono ou polyatomique (H⁺, H₃O⁺, Na⁺, NH₄⁺, Cl⁻, OH⁻, O²⁻) : électrons à représenter, charge, lacune électronique.',
      refs: ['37:prevoir:lewis1g-ammonium-ammoniac', '37:prevoir:lewis1g-lacune-hplus-naplus', '37:prevoir:lewis1g-anion-cation', '77:plausible:lewis1g-val-ammonium', '77:plausible:lewis1g-val-hydroxyde'] },
    { id: 'geometrie', nom: 'La forme d’une molécule', capacite: 'Interpréter la géométrie d’une entité (linéaire, coudée, pyramidale, tétraédrique) à partir de son schéma de Lewis.',
      refs: ['37:prevoir:geo1g-ana-forme-eau-nh3', '37:prevoir:geo1g-ana-ch4-co2-forme', '77:plausible:geo1g-val-eau-lineaire', '77:plausible:geo1g-val-eau-coudee-ok', '77:plausible:geo1g-val-nh3-plan'] },
    { id: 'polarite-liaison', nom: 'Électronégativité et polarité d’une liaison', capacite: 'Déterminer le caractère polaire d’une liaison covalente à partir de l’électronégativité des atomes (écart Δχ, seuil de la convention du cours).',
      refs: ['34:geo1g-sapp-liaison', '36:geo1g-calcul', '77:plausible:geo1g-val-delta-oh', '77:plausible:geo1g-val-delta-ch'] },
    { id: 'polarite-molecule', nom: 'Molécule polaire ou apolaire', capacite: 'Déterminer le caractère polaire ou apolaire d’une entité moléculaire à partir de sa géométrie et de la polarité de ses liaisons.',
      refs: ['37:prevoir:geo1g-ana-hcl-polaire', '37:prevoir:geo1g-ana-ccl4', '37:prevoir:geo1g-ana-ch4-apolaire', '37:prevoir:geo1g-ana-co2-lineaire', '77:plausible:geo1g-val-co2', '77:plausible:geo1g-val-ccl4'] },
  ],

  // 2.B De la structure des entités à la cohésion et à la solubilité / miscibilité
  '1g-cohesion': [
    { id: 'interactions', nom: 'Ce qui fait tenir la matière', capacite: 'Expliquer la cohésion d’un solide ionique ou moléculaire, et les propriétés qui en dépendent, par l’analyse des interactions entre entités (ions, dipôles, van der Waals, pont hydrogène).',
      refs: ['37:prevoir:coh-cohesion-solides', '77:plausible:coh-val-cristal-molecules', '37:prevoir:coh-liaison-hydrogene', '37:prevoir:coh-chaine-alcanes', '37:prevoir:coh-ebullition-eau', '77:plausible:coh-teb-kelvin'] },
    { id: 'dissolution-eau', nom: 'Pourquoi l’eau dissout un sel', capacite: 'Expliquer la capacité de l’eau à dissocier une espèce ionique et à solvater les ions.',
      refs: ['37:prevoir:coh-polarite-eau', '37:prevoir:coh-dissolution-ionique', '37:prevoir:coh-dissolution-orientation'] },
    { id: 'equation-dissolution', nom: 'Écrire l’équation de dissolution', capacite: 'Modéliser, au niveau macroscopique, la dissolution d’un composé ionique dans l’eau par une équation de réaction, avec les notations (s) et (aq).',
      refs: ['37:prevoir:diss1g-ana-equation-nitrate', '77:plausible:diss1g-val-eau-ecrite', '77:plausible:diss1g-val-charge-alcl3', '77:plausible:diss1g-val-equation-cacl2-ok', '77:plausible:diss1g-val-sulfate-casse'] },
    { id: 'concentration-ions', nom: 'Concentration des ions en solution', capacite: 'Calculer la concentration des ions dans la solution obtenue par dissolution d’un solide ionique (concentration en soluté apporté, puis coefficients de l’équation).',
      refs: ['34:dissol2', '34:diss1g-sapp-solution', '36:diss1g-calcul', '37:prevoir:diss1g-ana-cl-double', '37:prevoir:diss1g-ana-dilution-ions', '37:prevoir:diss1g-ana-meme-masse', '37:prevoir:diss1g-ana-sulfate-ions',
        '77:plausible:diss1g-val-cl-mgcl2', '77:plausible:diss1g-val-masse-nacl', '77:plausible:diss1g-val-sulfate-sodium', '77:plausible:diss1g-val-conversion-ml'] },
    { id: 'solubilite', nom: 'Solubilité et miscibilité', capacite: 'Expliquer ou prévoir la solubilité d’une espèce chimique dans un solvant, et la miscibilité de deux liquides, par l’analyse des interactions entre les entités ; comparer la solubilité dans différents solvants.',
      refs: ['37:prevoir:coh-solvant-diiode', '37:prevoir:coh-miscibilite-eau-ethanol', '77:plausible:coh-solubilite-diiode', '77:plausible:coh-saccharose-eau-ok', '77:plausible:coh-val-sel-cyclohexane'] },
    { id: 'extraction', nom: 'L’extraction liquide-liquide', capacite: 'Interpréter un protocole d’extraction liquide-liquide à partir des solubilités et des densités ; choisir un solvant extracteur.',
      refs: ['37:prevoir:ext-position', '37:prevoir:ext-solvant', '37:prevoir:ext-gestes', '37:prevoir:coh-ampoule', '77:plausible:ext-val-densite', '77:plausible:coh-masse-volumique-cyclohexane'] },
    { id: 'savon-structure', nom: 'Un savon : tête polaire, chaîne apolaire', capacite: 'Expliquer le caractère amphiphile d’un savon à partir de la formule semi-développée de ses entités (tête hydrophile, chaîne lipophile) ; dénombrer ses atomes et sa quantité de matière.',
      refs: ['34:savon1g-pain', '36:savon1g-calcul', '37:prevoir:savon1g-ana-chaine-courte', '37:prevoir:savon1g-ana-acide-gras', '77:plausible:savon1g-val-acetate', '77:plausible:savon1g-val-carbones', '77:plausible:savon1g-val-masse'] },
    { id: 'savon-lavage', nom: 'Comment un savon lave', capacite: 'Expliquer les propriétés lavantes d’un savon : orientation à l’interface eau-huile, micelles autour des salissures.',
      refs: ['37:prevoir:savon1g-ana-interface-huile', '37:prevoir:savon1g-ana-micelle-huile', '77:plausible:savon1g-val-micelle', '77:plausible:savon1g-val-lavage'] },
  ],

  // 3.C Conversion de l'énergie stockée dans la matière organique
  '1g-combustions': [
    { id: 'equation', nom: 'Équation de combustion complète', capacite: 'Écrire l’équation de réaction de combustion complète d’un alcane et d’un alcool (produits CO₂ et H₂O, équilibrage).',
      refs: ['36:comb1g-calcul', '37:prevoir:comb1g-ana-equation-butane', '37:prevoir:comb1g-ana-o2-alcool', '77:plausible:comb1g-val-equation-propane', '77:plausible:comb1g-val-equation-ethanol-ok'] },
    { id: 'energie-liaisons', nom: 'Énergie de réaction et énergies de liaison', capacite: 'Estimer l’énergie molaire de réaction d’une combustion en phase gazeuse à partir des énergies de liaison ; interpréter le signe, la quantité brûlée et l’écart avec une valeur de référence.',
      refs: ['34:comb1g-sapp-combustion', '37:prevoir:comb1g-ana-signe-liaisons', '37:prevoir:comb1g-ana-taille-molecule', '37:prevoir:comb1g-ana-quantite-energie', '77:plausible:comb1g-val-signe-methane', '77:plausible:comb1g-val-liaisons-ch4',
        '77:plausible:comb1g-val-ecart-methanol', '77:plausible:comb1g-val-eau-liquide'] },
    { id: 'pouvoir-calorifique', nom: 'Le pouvoir calorifique', capacite: 'Déterminer le pouvoir calorifique massique d’un combustible à partir de l’énergie molaire de réaction et de la masse molaire ; choisir la grandeur adaptée à une comparaison.',
      refs: ['37:prevoir:comb1g-ana-pc-choix-grandeur', '77:plausible:comb1g-val-pc-ethanol', '77:plausible:comb1g-val-pc-ethanol-ok'] },
    { id: 'enjeux', nom: 'Combustions : risques et avenir', capacite: 'Citer des applications usuelles qui mettent en œuvre des combustions et les risques associés (combustion incomplète) ; citer des axes d’étude s’inscrivant dans une perspective de développement durable.',
      refs: ['37:prevoir:comb1g-ana-monoxyde', '37:prevoir:comb1g-ana-incomplete-energie', '77:plausible:comb1g-val-hydrogene'] },
  ],

  // 3.A Structure des entités organiques
  '1g-organique': [
    { id: 'formules', nom: 'Formule brute et formule semi-développée', capacite: 'Passer de la formule semi-développée à la formule brute d’une molécule organique (comptage des atomes, isomères de constitution).',
      refs: ['37:prevoir:org-isomeres', '77:plausible:org-brute-hexane', '77:plausible:org-brute-butanal'] },
    { id: 'familles', nom: 'Groupes caractéristiques et familles', capacite: 'Identifier, à partir d’une formule semi-développée, les groupes caractéristiques associés aux familles : alcool, aldéhyde, cétone, acide carboxylique.',
      refs: ['37:prevoir:org-carbonyle', '37:prevoir:org-familles-groupes', '77:plausible:org-val-cooh-alcool', '77:plausible:org-val-propanal-ok'] },
    { id: 'nom', nom: 'Du nom à la formule, et inversement', capacite: 'Justifier le nom associé à la formule semi-développée de molécules simples possédant un seul groupe caractéristique, et inversement (chaîne principale, numérotation, suffixe).',
      refs: ['37:prevoir:org-chaine-principale', '37:prevoir:org-numerotation', '37:prevoir:org-nom-acide', '77:plausible:org-nom-butanone'] },
    { id: 'infrarouge', nom: 'Spectre infrarouge', capacite: 'Exploiter, à partir de valeurs de référence, un spectre d’absorption infrarouge pour identifier un groupe caractéristique (nombre d’onde, bandes O–H et C=O).',
      refs: ['37:prevoir:ir-nombre-onde', '37:prevoir:ir-alcool-cetone', '37:prevoir:ir-reaction', '77:plausible:ir-val-nombre-onde'] },
  ],

  // 3.B Synthèses d'espèces chimiques organiques
  '1g-synthese': [
    { id: 'etapes', nom: 'Les étapes d’une synthèse', capacite: 'Identifier, dans un protocole, les étapes de transformation, d’isolement, de purification et d’analyse ; justifier le choix d’une méthode d’isolement.',
      refs: ['37:prevoir:syn-etapes-protocole', '37:prevoir:syn-choix-isolement', '37:prevoir:syn-sechage'] },
    { id: 'purification', nom: 'Purifier un solide : la recristallisation', capacite: 'Justifier, à partir des propriétés physico-chimiques du produit, le choix et la mise en œuvre d’une méthode de purification (recristallisation).',
      refs: ['37:prevoir:syn-recristal-choix-solvant', '37:prevoir:syn-recristal-volume'] },
    { id: 'rendement', nom: 'Le rendement d’une synthèse', capacite: 'Déterminer, à partir d’un protocole et de données expérimentales, le rendement d’une synthèse (réactif limitant, quantité maximale).',
      refs: ['36:syn1g-calcul', '37:prevoir:syn-limitant', '37:prevoir:syn-rendement-reference', '77:plausible:syn-val-rendement', '77:plausible:syn-val-rendement-ok'] },
    { id: 'analyse', nom: 'Analyser le produit : CCM et température de fusion', capacite: 'Analyser un produit synthétisé (identification, pureté) : rapport frontal en CCM, comparaison à des références, température de fusion.',
      refs: ['37:prevoir:ccm-rf', '37:prevoir:ccm-comparer', '37:prevoir:ccm-tf-pur', '77:plausible:ccm-val-rf'] },
  ],
};
