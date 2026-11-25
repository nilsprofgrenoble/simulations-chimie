// ═══════════════════════════════════════════════════════════════════════════
//  SOUS-THÈMES des chapitres 2GT « Constitution et transformations de la matière » :
//  2gt-microscopique, 2gt-solutions, 2gt-transformation-chimique, 2gt-transformation-physique, 2gt-transformation-nucleaire.
//  Même structure que SOUS_THEMES (voir sousThemes.js) ; à intégrer dans SOUS_THEMES. Un sous-thème = une capacité exigible du programme de seconde GT
//  (texte officiel : programmes/2GT.md), dans l'ordre du programme. Chaque exercice du chapitre est dans UN seul sous-thème.
// ═══════════════════════════════════════════════════════════════════════════

// Raccourcis : ANA « 37:prevoir:… », VAL « 77:plausible:… »
const A = (...ids) => ids.map(i => `37:prevoir:${i}`);
const Va = (...ids) => ids.map(i => `77:plausible:${i}`);
const S = (...ids) => ids.map(i => `34:${i}`);

export default {
  // ─────────────── Constitution de la matière à l'échelle microscopique (B)
  '2gt-microscopique': [
    { id: 'entites', nom: 'Atomes, molécules, anions, cations', capacite: 'Utiliser le terme adapté (molécule, atome, anion, cation) pour qualifier une entité chimique à partir de sa formule ; savoir qu’une espèce chimique est une collection d’entités identiques.',
      refs: [...A('mat2gt-ana-entite-molecule', 'mat2gt-ana-entite-cation', 'mic-ion-sodium', 'mic-ion-chlorure', 'mic-electrons-atome'), ...Va('mat2gt-val-sel-molecules')] },
    { id: 'ioniques', nom: 'Ions, noms et électroneutralité', capacite: 'Nommer les ions courants (H⁺, Na⁺, K⁺, Ca²⁺, Mg²⁺, Cl⁻, F⁻) et exploiter l’électroneutralité de la matière pour écrire la formule d’un composé ionique.',
      refs: [...A('mat2gt-ana-nom-ion', 'mat2gt-ana-formule-cacl2', 'mat2gt-ana-neutralite'), ...Va('mat2gt-val-formule-mgcl')] },
    { id: 'noyau', nom: 'Le noyau et son écriture', capacite: 'Établir l’écriture conventionnelle d’un noyau à partir de sa composition (nombre de nucléons A, numéro atomique Z) et inversement ; identité de l’élément chimique ; charge du noyau.',
      refs: [...S('noyau2'), ...A('noy2gt-ana-charge', 'noy2gt-ana-element', 'noy2gt-ana-ecriture'), ...Va('noy2gt-val-neutrons-sodium', 'noy2gt-val-charge-helium')] },
    { id: 'taille-masse', nom: 'Taille et masse : atome, noyau, électrons', capacite: 'Citer l’ordre de grandeur de la taille d’un atome ; comparer la taille et la masse d’un atome et de son noyau ; écriture scientifique et puissances de 10.',
      refs: [...S('noy2gt-sapp-compo', 'noy2gt-sapp-echelle'), ...A('mic-masse-noyau', 'noy2gt-ana-masse', 'noy2gt-ana-echelle', 'mol2gt-ion-electron'),
        ...Va('mic-taille-atome', 'mic-masse-carbone', 'noy2gt-val-taille-noyau', 'noy2gt-val-rapport-masses', 'noy2gt-val-masse-oxygene')] },
    { id: 'electrons', nom: 'Électrons de valence, tableau périodique et familles', capacite: 'Déterminer les électrons de valence (Z ⩽ 18) et la position dans le tableau périodique à partir de la configuration électronique (1s, 2s, 2p, 3s, 3p) ; associer la famille chimique à des propriétés communes.',
      refs: [...A('mat2gt-ana-valence-config', 'mat2gt-ana-position', 'mic-famille-alcalins'), ...Va('mat2gt-val-valence')] },
    { id: 'stabilite', nom: 'Gaz nobles et ions stables', capacite: 'Établir le lien entre stabilité chimique et configuration électronique de valence d’un gaz noble ; déterminer la charge d’un ion monoatomique courant à partir du tableau périodique.',
      refs: [...A('mic-gaz-nobles', 'mic-octet-sodium', 'mic-octet-chlore', 'mat2gt-ana-charge-tableau'), ...Va('mat2gt-val-ion-faux')] },
    { id: 'lewis', nom: 'Molécules : schéma de Lewis et énergie de liaison', capacite: 'Décrire et exploiter le schéma de Lewis d’une molécule (doublets liants et non liants) pour justifier sa stabilisation par rapport aux atomes isolés ; associer l’énergie d’une liaison à l’énergie nécessaire pour la rompre.',
      refs: [...A('mat2gt-ana-lewis-eau', 'mat2gt-ana-lewis-ammoniac', 'mat2gt-ana-energie-liaison'), ...Va('mat2gt-val-lewis')] },
    { id: 'mole', nom: 'Compter les entités : la mole', capacite: 'Déterminer la masse d’une entité à partir de sa formule brute ; déterminer le nombre d’entités et la quantité de matière (en mol) dans une masse d’échantillon.',
      refs: [...S('mol2gt-balance', 'mol2gt-echantillon'), ...A('mol2gt-masse-double', 'mol2gt-objet-leger', 'mol2gt-comparer-n', 'mol2gt-meme-masse-atomes', 'mol2gt-molecule-legere'),
        ...Va('mol2gt-val-pates', 'mol2gt-val-puissance', 'mol2gt-val-masse-molecule', 'mol2gt-val-n-goutte', 'mol2gt-val-paquet')] },
  ],

  // ─────────────── Description et caractérisation de la matière à l'échelle macroscopique (A) : espèces, mélanges, solutions
  '2gt-solutions': [
    { id: 'purs', nom: 'Corps pur ou mélange ? Composition d’un mélange', capacite: 'Citer des exemples courants de corps purs et de mélanges (homogènes, hétérogènes) ; citer la composition approchée de l’air et établir la composition d’un échantillon (pourcentages, fractions).',
      refs: [...A('pur2gt-ana-minerale', 'pur2gt-ana-or18', 'mat2gt-ana-air-volume', 'mat2gt-ana-comp-massique'), ...Va('pur2gt-val-air-pur', 'pur2gt-val-huile-pure', 'mat2gt-val-air-pourcent', 'mat2gt-val-rho-air')] },
    { id: 'temperatures', nom: 'Identifier un corps pur par sa température de changement d’état', capacite: 'Identifier une espèce chimique à partir de valeurs de référence (températures de changement d’état) ; distinguer un mélange d’un corps pur à partir de données expérimentales (palier de température).',
      refs: [...S('pur2gt-sapp-flacon', 'pur2gt-sapp-saumure'), ...A('pur2gt-ana-courbe-melange', 'pur2gt-ana-limite', 'pur2gt-ana-cire'), ...Va('pur2gt-val-ecart-precision', 'pur2gt-val-acetone-ok', 'pur2gt-val-saumure-pur')] },
    { id: 'masse-volumique', nom: 'La masse volumique', capacite: 'Déterminer et comparer des masses volumiques (eau liquide, autres corps purs et mélanges) ; distinguer la masse volumique d’un échantillon et la concentration en masse d’un soluté.',
      refs: [...S('rho2'), ...A('sol-huile-eau', 'mat2gt-ana-rho-ou-t'), ...Va('sol-masse-volumique-unite')] },
    { id: 'tests', nom: 'Les tests chimiques (eau, gaz)', capacite: 'Citer et mettre en œuvre les tests chimiques courants de présence d’eau, de dihydrogène, de dioxygène et de dioxyde de carbone ; en tirer une conclusion correcte.',
      refs: [...S('test2gt-sapp-gaz-inconnu', 'test2gt-sapp-poudre'), ...A('test2gt-ana-ethanol', 'test2gt-ana-allumette', 'test2gt-ana-un-test-de-plus', 'test2gt-ana-bougie', 'test2gt-ana-pop-buee', 'test2gt-ana-azote'),
        ...Va('test2gt-val-eau-pure', 'test2gt-val-air-co2', 'test2gt-val-pop', 'test2gt-val-braise-co2', 'test2gt-val-bougie-deux')] },
    { id: 'ccm', nom: 'La chromatographie sur couche mince', capacite: 'Réaliser et exploiter une chromatographie sur couche mince (rapport frontal) pour identifier une espèce ou comparer une espèce synthétisée et une espèce extraite de la nature.',
      refs: [...S('ccm2gt-sapp-comparer', 'ccm2gt-sapp-colorant'), ...A('ccm2gt-ana-une-tache', 'ccm2gt-ana-inconnue', 'ccm2gt-ana-niveau', 'ccm2gt-ana-concentre', 'ccm2gt-ana-suite', 'ccm2gt-ana-crayon'),
        ...Va('ccm2gt-val-rf-sup1', 'ccm2gt-val-rf-ok', 'ccm2gt-val-prouve', 'ccm2gt-val-differentes', 'ccm2gt-val-pur-sur')] },
    { id: 'solutions', nom: 'Solvant, soluté et concentration en masse', capacite: 'Identifier le soluté et le solvant ; déterminer la concentration en masse d’un soluté à partir d’une préparation par dissolution ; notion de concentration maximale (saturation).',
      refs: [...S('conc2'), ...A('mat2gt-ana-solute-solvant', 'sol-masse-double', 'sol-volume-double', 'sol-masse-conservee', 'sol-saturation'), ...Va('sol-saturation-val')] },
    { id: 'dilution', nom: 'Dilution et verrerie', capacite: 'Déterminer la concentration en masse d’une solution obtenue par dilution ; choisir la verrerie adaptée pour préparer une solution par dissolution ou par dilution.',
      refs: [...A('sol-dilution-facteur', 'mat2gt-ana-fiole', 'mat2gt-ana-pipette'), ...Va('sol-dilution-val', 'sol-dilutions-successives-ok')] },
    { id: 'etalonnage', nom: 'Doser par étalonnage', capacite: 'Déterminer une concentration en masse à l’aide d’une gamme d’étalonnage (échelle de teintes, mesure de masse volumique).',
      refs: [...A('sol-echelle-teintes', 'mat2gt-ana-teintes-encadrer', 'mat2gt-ana-etalonnage-rho'), ...Va('mat2gt-val-teinte-hors')] },
  ],

  // ─────────────── Transformation chimique (B)
  '2gt-transformation-chimique': [
    { id: 'ajuster', nom: 'Ajuster une équation de réaction', capacite: 'Établir l’équation de réaction associée à une transformation et l’ajuster : conservation de chaque élément et de la charge, sans changer les formules.',
      refs: [...A('eq2gt-ana-indice', 'eq2gt-ana-charge', 'mat2gt-ana-ajuster-mg', 'mat2gt-ana-ajuster-al'), ...Va('eq2gt-val-oxygene', 'eq2gt-val-charge-atomes', 'eq2gt-val-dba', 'syn2gt-val-equation')] },
    { id: 'proportions', nom: 'Lire une équation : les proportions', capacite: 'Exploiter les coefficients d’une équation de réaction comme des proportions (proportionnalité) entre les quantités de réactifs consommés et de produits formés.',
      refs: [...S('eq2gt-sapp-metal', 'eq2gt-sapp-methane', 'eq2gt-sapp-dba'), ...A('eq2gt-ana-proportions'), ...Va('eq2gt-val-proportions-methane')] },
    { id: 'ecrire', nom: 'Écrire l’équation de réactions courantes', capacite: 'Modéliser par une équation la combustion du carbone et du méthane, la corrosion d’un métal par un acide, l’action d’un acide sur le calcaire, l’action de l’acide chlorhydrique sur la soude ; notion d’espèce spectatrice.',
      refs: [...A('mat2gt-ana-modeliser-pop', 'mat2gt-ana-eq-carbone', 'mat2gt-ana-eq-calcaire', 'eq2gt-ana-spectatrices'), ...Va('eq2gt-val-spectatrices-ok')] },
    { id: 'limitant', nom: 'Le réactif limitant', capacite: 'Identifier le réactif limitant à partir des quantités de matière initiales et de l’équation, ou à partir des espèces présentes dans l’état final d’une transformation totale.',
      refs: [...S('rl2gt-donnees'), ...A('rl2gt-double-methane', 'rl2gt-etat-final-lire', 'rl2gt-proportions-exactes', 'rl2gt-plus-petit', 'rl2gt-double-limitant', 'rl2gt-calcaire-ajout'),
        ...Va('rl2gt-reste-impossible', 'rl2gt-produit-trop', 'rl2gt-reste-plausible', 'rl2gt-dba-reste')] },
    { id: 'energie', nom: 'Exothermique ou endothermique ?', capacite: 'Suivre l’évolution d’une température pour déterminer le caractère endothermique ou exothermique d’une transformation chimique ; étudier l’influence de la masse du réactif limitant.',
      refs: [...A('eq2gt-ana-endothermique', 'rl2gt-exces-energie'), ...Va('mat2gt-val-exo-sens', 'rl2gt-energie-triple')] },
    { id: 'reflux', nom: 'Synthèse et montage à reflux', capacite: 'Réaliser le schéma légendé d’un montage à reflux et le mettre en œuvre pour synthétiser une espèce présente dans la nature (sécurité, sens de l’eau, durées, choix du ballon).',
      refs: [...S('syn2gt-sapp-ballon', 'syn2gt-sapp-duree'), ...A('syn2gt-ana-sans-refrigerant', 'syn2gt-ana-eau-haut', 'syn2gt-ana-bouche', 'syn2gt-ana-pierre'),
        ...Va('syn2gt-val-eau-bas', 'syn2gt-val-eau-haut', 'syn2gt-val-ferme', 'syn2gt-val-chauffer')] },
  ],

  // ─────────────── Transformation physique (A)
  '2gt-transformation-physique': [
    { id: 'noms', nom: 'Les changements d’état et leurs équations', capacite: 'Citer des exemples de changements d’état de la vie courante et établir l’écriture symbolique d’un changement d’état (fusion, vaporisation, liquéfaction, solidification, sublimation, condensation solide).',
      refs: [...A('etat2gt-ana-sublimation', 'mat2gt-ana-liquefaction', 'mat2gt-ana-vie-courante'), ...Va('etat2gt-val-sublimation-sens')] },
    { id: 'micro', nom: 'À l’échelle des molécules', capacite: 'Modéliser à l’échelle microscopique un changement d’état : molécules inchangées, rangées ou non, plus ou moins proches ; palier de température d’un corps pur.',
      refs: A('etat2gt-ana-palier', 'mat2gt-ana-micro-gaz', 'mat2gt-ana-micro-fusion') },
    { id: 'dissolution', nom: 'Fusion ou dissolution ?', capacite: 'Distinguer fusion et dissolution : un seul corps qui change d’état, ou deux corps qui se mélangent.',
      refs: [...A('etat2gt-ana-dissolution', 'mat2gt-ana-fusion-dissolution'), ...Va('etat2gt-val-sel-fusion')] },
    { id: 'transfert', nom: 'Qui donne, qui reçoit de l’énergie ?', capacite: 'Identifier le sens du transfert thermique lors d’un changement d’état et le relier aux termes endothermique et exothermique.',
      refs: [...A('etat2gt-ana-peau', 'mat2gt-ana-exo-buee'), ...Va('etat2gt-val-solidification-ok')] },
    { id: 'energie', nom: 'Énergie et masse : E = m × L', capacite: 'Exploiter la relation entre l’énergie transférée lors d’un changement d’état et l’énergie massique de changement d’état ; relier l’énergie à la masse de l’espèce qui change d’état.',
      refs: [...S('etat2gt-sapp-glacon', 'etat2gt-sapp-ethanol'), ...A('etat2gt-ana-masse', 'etat2gt-ana-corps'), ...Va('etat2gt-val-glacon-grammes', 'etat2gt-val-vapeur-moins')] },
  ],

  // ─────────────── Transformation nucléaire (C)
  '2gt-transformation-nucleaire': [
    { id: 'isotopes', nom: 'Les isotopes', capacite: 'Identifier des isotopes : même élément (même nombre de protons Z), nombres de nucléons différents.',
      refs: [...S('nuc2gt-sapp-liste'), ...A('nuc2gt-ana-iso-carbone', 'nuc2gt-ana-meme-a'), ...Va('nuc2gt-val-uranium', 'nuc2gt-val-tritium')] },
    { id: 'soleil', nom: 'L’énergie du Soleil : la fusion', capacite: 'Relier l’énergie convertie dans le Soleil à des réactions nucléaires de fusion ; lire l’écriture symbolique d’une réaction nucléaire.',
      refs: [...A('nuc2gt-ana-soleil', 'mat2gt-ana-fusion-ecriture'), ...Va('nuc2gt-val-soleil', 'mat2gt-val-soleil-duree')] },
    { id: 'centrales', nom: 'Les centrales nucléaires : la fission', capacite: 'Relier l’énergie convertie dans une centrale nucléaire à des réactions nucléaires de fission ; chaîne de conversion du réacteur au réseau électrique.',
      refs: [...S('nuc2gt-sapp-fissions'), ...A('nuc2gt-ana-chaine', 'mat2gt-ana-fission-ecriture'), ...Va('nuc2gt-val-centrale')] },
    { id: 'nature', nom: 'Physique, chimique ou nucléaire ?', capacite: 'Identifier la nature physique, chimique ou nucléaire d’une transformation à partir de sa description ou d’une écriture symbolique.',
      refs: [...A('nuc2gt-ana-charbon', 'mat2gt-ana-nature-ecriture', 'mat2gt-ana-nature-physique'), ...Va('mat2gt-val-nature-combustion')] },
  ],
};
