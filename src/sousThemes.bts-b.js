// ═══════════════════════════════════════════════════════════════════════════
//  SOUS-THÈMES des chapitres BTS Métiers de la chimie « bts-mecanismes », « bts-cinetique », « bts-solubilite », « bts-films »,
//  « bts-rheologie », « bts-tensioactifs » et « bts-plans » (lot 2). Même structure que SOUS_THEMES (voir sousThemes.js).
//  Chaque sous-thème correspond à une capacité exigible du référentiel du BTS MC (S6 Synthèse, S7 Formulation) ; la capacité est
//  reprise au plus près du texte du référentiel. Exercices ajoutés : voir src/simulations/exosBtsB.js.
// ═══════════════════════════════════════════════════════════════════════════
const A = (...ids) => ids.map(i => `37:prevoir:${i}`);          // ANA : prévoir sans calculer
const VV = (...ids) => ids.map(i => `77:plausible:${i}`);       // VAL : ça paraît plausible ?
const S = (...ids) => ids.map(i => `34:${i}`);                  // S'APP : comprendre une situation (ou énoncé)
const R = (...ids) => ids.map(i => `36:${i}`);                  // REA : calcul

export default {
  // ───────────────────────── S6 · Synthèse : mécanismes réactionnels ─────────────────────────
  'bts-mecanismes': [
    { id: 'type', nom: 'Reconnaître le type de réaction', capacite: 'Reconnaître, dans un mécanisme réactionnel, une addition, une substitution, une élimination, une insertion, une réaction acide-base ou une transposition.',
      refs: [...S('tr-type'), ...A('tr-ana-transposition', 'tr-ana-e1-acidebase'), ...VV('tr-val-addition-substitution')] },
    { id: 'sn-e', nom: 'Substitution ou élimination ?', capacite: 'Extraire d’un mécanisme les informations qui expliquent la formation du produit d’intérêt et des sous-produits : substitution ou élimination selon le substrat, le réactif et la température.',
      refs: S('sn-meca', 'sn-conditions') },
    { id: 'etape-lente', nom: 'L’étape lente et la loi de vitesse', capacite: 'Relier le mécanisme (une ou deux étapes, étape cinétiquement déterminante) à la loi de vitesse, pour prévoir les paramètres d’influence sur la cinétique.',
      refs: [...S('sn-ordre'), ...A('sn-ana-etape-lente'), ...VV('sn-val-sn2-ordre')] },
    { id: 'profil', nom: 'Lire un profil de réaction', capacite: 'Extraire d’un profil de réaction les informations permettant d’expliquer la formation d’un produit : intermédiaire de réaction, états de transition, étape cinétiquement déterminante.',
      refs: S('sn-profil', 'tr-profil') },
    { id: 'carbocation', nom: 'Carbocation et transposition', capacite: 'Extraire d’un mécanisme les informations qui expliquent la formation d’un produit d’intérêt et d’un sous-produit : intermédiaire carbocation, transposition (migration 1,2).',
      refs: S('tr-carbocation', 'tr-produits') },
    { id: 'bromonium', nom: 'Addition de Br₂ : l’ion bromonium', capacite: 'Reconnaître une addition et identifier l’intermédiaire de réaction (ion bromonium) qui explique que l’addition se fasse en anti.',
      refs: S('br-test', 'br-meca') },
    { id: 'stereo', nom: 'Stéréochimie du produit', capacite: 'Extraire d’un mécanisme la ou les sélectivité(s) observée(s) : inversion ou racémique, stéréospécificité, addition syn ou anti.',
      refs: S('sn-stereo', 'br-stereo', 'br-cyclo') },
  ],

  // ───────────────────────── S6 · Synthèse : produit majoritaire, facteurs cinétique et thermodynamique ─────────────────────────
  'bts-cinetique': [
    { id: 'allylique', nom: 'Deux produits d’un diène conjugué', capacite: 'Extraire d’un mécanisme les informations permettant d’expliquer la formation d’un produit d’intérêt et d’un sous-produit : carbocation allylique, addition 1,2 et addition 1,4.',
      refs: [...S('cinet-diene'), ...A('cinet-ana-non-conjugue')] },
    { id: 'profil', nom: 'Lire un profil à deux produits', capacite: 'Extraire d’un profil de réaction les informations qui expliquent la formation de deux produits : barrières d’activation, stabilité des produits.',
      refs: [...S('cinet-profil'), ...VV('cinet-val-stable-rapide')] },
    { id: 'conditions', nom: 'Contrôle cinétique ou thermodynamique', capacite: 'Produit majoritaire : facteurs temps et température. Exploiter les conditions expérimentales (température, durée) pour savoir quel produit domine.',
      refs: [...S('cinet-conditions', 'cinet-arrhenius'), ...A('cinet-ana-froid-long')] },
    { id: 'equilibre', nom: 'La composition à l’équilibre', capacite: 'Exploiter les conditions expérimentales pour rendre compte du produit majoritaire obtenu à l’équilibre.',
      refs: [...S('cinet-equilibre'), ...VV('cinet-val-equilibre-egal')] },
  ],

  // ───────────────────────── S7 · Formulation : comment solubiliser des matières premières ? ─────────────────────────
  'bts-solubilite': [
    { id: 'hansen', nom: 'Les paramètres de Hansen et la sphère de solubilité', capacite: 'Paramètre de solubilité, système de Hansen : exploiter un diagramme de solubilité (les trois paramètres δD, δP, δH, le centre et le rayon R₀ de la sphère).',
      refs: [...S('for-hansen-sapp-donnees'), ...A('for-hansen-composantes', 'for-hansen-r0')] },
    { id: 'red', nom: 'Distance de Hansen et RED', capacite: 'Exploiter un diagramme de solubilité : calculer et lire la distance Ra et le RED = Ra / R₀ pour savoir si un solvant dissout un polymère.',
      refs: [...A('for-hansen-red'), ...VV('for-hansen-ra-sans-racine', 'for-hansen-red-ethanol-ok')] },
    { id: 'melange', nom: 'Formuler un mélange de solvants', capacite: 'Exploiter un diagramme de solubilité pour formuler un mélange de solvants (paramètres du mélange pondérés par les fractions volumiques).',
      refs: [...A('for-hansen-melange'), ...VV('for-hansen-melange-moyenne-red')] },
    { id: 'volatilite', nom: 'Volatilité des solvants et séchage', capacite: 'Expliquer le choix des solvants en tenant compte de leur volatilité (taux d’évaporation, solvants lourds, légers et moyens) ; expliquer l’évolution des propriétés du produit formulé lors du séchage.',
      refs: A('for-hansen-evaporation', 'for-solv-ana-pinceau', 'for-solv-ana-sechage-melange') },
    { id: 'cov', nom: 'Le taux de COV', capacite: 'Évaluer un taux de COV à partir de la constitution du produit formulé.',
      refs: [...S('for-cov-sapp-formule'), ...VV('for-cov-val-eau')] },
  ],

  // ───────────────────────── S7 · Formulation : comment se forment les films ? ─────────────────────────
  'bts-films': [
    { id: 'extrait-sec', nom: 'Extrait sec et film sec', capacite: 'Évaluer quelques grandeurs caractéristiques d’un produit formulé : extrait sec.',
      refs: [...A('for-extrait-sec'), ...VV('for-val-extrait-sec')] },
    { id: 'mode', nom: 'Séchage physique ou chimique ?', capacite: 'Identifier le mode de séchage à partir de la nature de la matière filmogène ; expliquer le choix d’une matière filmogène selon les propriétés recherchées.',
      refs: [...A('sec-ana-mode-nitro', 'sec-ana-choix-pu'), ...VV('sec-val-photo-ombre')] },
    { id: 'latex', nom: 'Séchage d’un latex : coalescence', capacite: 'Séchage physique (coalescence et fusion des dispersions acryliques et vinyliques) ; expliquer le choix des additifs selon le mode de séchage : agents de coalescence.',
      refs: A('for-sechage-latex', 'for-coalescent', 'for-tmff') },
    { id: 'oxydant', nom: 'Séchage oxydant : siccatif et anti-peau', capacite: 'Séchage chimique (siccativation des huiles siccatives et résines alkydes) ; expliquer le choix des additifs selon le mode de séchage : siccatifs et antipeaux.',
      refs: [...A('for-lasure-siccatif', 'for-lasure-antipeau'), ...VV('for-lasure-antipeau-seche-plus-vite')] },
    { id: 'durcisseur', nom: 'Bicomposant : la quantité de durcisseur', capacite: 'Évaluer la quantité de durcisseur à employer à partir des poids équivalents (séchage chimique par réaction entre deux composants : polyuréthanes et époxy).',
      refs: [...S('sec-sapp-durcisseur'), ...A('sec-ana-durcisseur-exces'), ...VV('sec-val-durcisseur-inverse')] },
    { id: 'cpv', nom: 'CPV, CPVC et aspect du film', capacite: 'Évaluer la concentration pigmentaire volumique (CPV) ; établir un lien entre le brillant et les caractéristiques d’une formule (CPV, CPVC).',
      refs: A('for-cpv', 'for-cpvc', 'for-aspect-cpv', 'for-prise-huile') },
  ],

  // ───────────────────────── S7 · Formulation : propriétés rhéologiques ─────────────────────────
  'bts-rheologie': [
    { id: 'grandeurs', nom: 'Gradient, contrainte et viscosité', capacite: 'Gradient de vitesse, contrainte de cisaillement, viscosité dynamique : mettre en œuvre une méthode de contrôle de la rhéologie (viscosimétrie).',
      refs: [...S('rhc-sapp-viscosimetre'), ...A('rhc-ana-newton'), ...VV('rhc-val-conversion'), ...R('rhc-calcul')] },
    { id: 'comportements', nom: 'Reconnaître le comportement d’un fluide', capacite: 'Identifier à partir de rhéogrammes (courbe de viscosité, courbe d’écoulement) les comportements : newtonien, plastique idéal, plastique non idéal, pseudoplastique, rhéoépaississant.',
      refs: [...S('rheo-ecoulement'), ...A('rhc-ana-pseudo', 'rhc-ana-seuil', 'rhc-ana-droite-seuil', 'rhc-ana-palier'), ...VV('rhc-val-newtonienne', 'rhc-val-seuil-extrapole')] },
    { id: 'thixotropie', nom: 'La thixotropie : montée et descente', capacite: 'Identifier à partir de rhéogrammes le comportement thixotrope (boucle aller-retour : la viscosité au retour est plus faible).',
      refs: [...S('rhc-sapp-perte', 'rheo-peintures'), ...A('rhc-ana-thixo'), ...VV('rhc-val-thixo-ok')] },
    { id: 'itt', nom: 'Le test en trois intervalles (3ITT)', capacite: 'Mettre en œuvre des méthodes de contrôle de la rhéologie (rhéométrie) : mesurer la régénération d’une peinture après cisaillement et prévoir nivellement ou coulures.',
      refs: [...S('itt-sapp-m1', 'itt-sapp-pente', 'rheo-3itt'), ...A('itt-ana-court', 'itt-ana-newton', 'itt-ana-rapide', 'itt-ana-lente'), ...VV('itt-val-pourcent', 'itt-val-temps', 'itt-val-pente'), ...R('itt-calcul')] },
    { id: 'additifs', nom: 'Comment agit un épaississant', capacite: 'Additifs rhéologiques : épaississants inorganiques, organiques (non associatifs, associatifs et associants). Expliquer le mode d’action des additifs rhéologiques.',
      refs: [...S('rheo-gant-crochet', 'rheo-thixol', 'rheo-coapur', 'rheo-ase', 'rheo-dose-forte'), ...A('rheo-ana-bentonite')] },
    { id: 'choix', nom: 'Choisir un additif rhéologique', capacite: 'Expliquer le choix d’un additif rhéologique selon le comportement attendu.',
      refs: [...S('rheo-famille'), ...A('rheo-ana-choix-heur'), ...VV('rheo-val-newtonien-sedim')] },
    { id: 'defloculation', nom: 'Dispersant : courbe de défloculation et flow point', capacite: 'Influence des agents dispersants ; courbe de défloculation et « flow point » : évaluer la dosologie optimale d’un dispersant à partir de sa courbe de défloculation.',
      refs: [...A('disp-ana-optimum', 'rheo-ana-flow-point'), ...VV('rheo-val-defloc-optimum')] },
  ],

  // ───────────────────────── S7 · Formulation : milieux dispersés, tensioactifs, mouillage ─────────────────────────
  'bts-tensioactifs': [
    { id: 'familles', nom: 'Familles de tensioactifs et charge selon le pH', capacite: 'Tensioactifs, différentes familles (cationiques, anioniques, amphotères, non ioniques) : expliquer le rôle émulsifiant d’un tensioactif et prévoir sa charge selon le pH.',
      refs: [...A('tens-ana-famille', 'chtens-ana-sulfate', 'chtens-ana-savon', 'chtens-ana-cationique', 'chtens-ana-betaine', 'chtens-ana-nonionique', 'chtens-ana-emulsion', 'chtens-ana-ecriture-na', 'chtens-ana-ecriture-br', 'chtens-ana-contre-ion'),
        ...VV('chtens-val-savon-amphotere', 'chtens-val-nonionique-ph', 'chtens-val-sel-amphotere')] },
    { id: 'cmc', nom: 'Micelles et concentration micellaire critique', capacite: 'Concentration micellaire critique : évaluer la CMC par conductimétrie ou par tensiométrie ; distinguer monomères libres et micelles.',
      refs: [...S('tens-libres', 'tens-micelles'), ...A('tens-ana-plateau', 'tens-ana-conducti', 'tens-ana-chaine', 'tens-ana-tete'), ...VV('tens-val-monomeres', 'tens-val-micelles'), ...R('tens-libres-micelles')] },
    { id: 'sens', nom: 'Sens d’une émulsion et épaississement', capacite: 'Identifier expérimentalement le sens d’une émulsion (E/H ou H/E) ; distinguer les différents types de milieux dispersés.',
      refs: [...A('semul-ana-dilution', 'semul-ana-conduct-forte', 'semul-ana-conduct-faible', 'semul-ana-rouge-soudan', 'semul-ana-deux-colorants', 'semul-ana-epaissir-sauce', 'semul-ana-epaissir-eh', 'semul-ana-diluer-lotion', 'semul-ana-fraction', 'semul-ana-limite'),
        ...VV('semul-val-conduct-faible', 'semul-val-epaissir-eh', 'semul-val-violet', 'semul-val-dilution-eau')] },
    { id: 'instabilites', nom: 'Les instabilités d’une émulsion', capacite: 'Coalescence, crémage, floculation, sédimentation : identifier les problèmes liés à l’instabilité des milieux dispersés et en identifier les causes.',
      refs: [...A('inst-ana-cremage-haut', 'inst-ana-stokes-rayon', 'inst-ana-stokes-viscosite', 'inst-ana-sedimentation', 'inst-ana-floculation', 'inst-ana-coalescence', 'inst-ana-coal-volume', 'inst-ana-ostwald', 'inst-ana-remede-coalescence', 'inst-ana-remede-ostwald'),
        ...VV('inst-val-stokes-diametre', 'inst-val-agitation-coalescence', 'inst-val-cremage-duree', 'inst-val-viscosite-duree')] },
    { id: 'hlb', nom: 'HLB requis et mélange d’émulsifiants', capacite: 'Notion de balance hydrophile-lipophile (HLB) : évaluer la composition d’un mélange d’émulsifiants par la méthode du RHLB (HLB requis).',
      refs: [...A('hlb-ana-lipophile', 'hlb-ana-choix-seul', 'hlb-ana-rhlb-melange', 'hlb-ana-hlb-melange', 'hlb-ana-equilibre', 'hlb-ana-fraction', 'hlb-ana-hors-portee', 'hlb-ana-trop-lipophile', 'hlb-ana-sens', 'hlb-ana-limites'),
        ...VV('hlb-val-moyenne-simple', 'hlb-val-melange-ok', 'hlb-val-fraction-inversee', 'hlb-val-hors-intervalle', 'for-hlb-melange-ok')] },
    { id: 'mousses', nom: 'Les mousses et les antimousses', capacite: 'Cas des mousses : expliquer le mode d’action d’un tensioactif dans une mousse ; expliquer le mode d’action des agents antimousse.',
      refs: [...A('mou-ana-role', 'mou-ana-antimousse'), ...VV('mou-val-dose')] },
    { id: 'suspension', nom: 'Stabilité d’une suspension : charge, pH et sel', capacite: 'Identifier les causes d’instabilité d’une suspension (floculation, sédimentation) et prévoir l’effet de la charge de surface, du pH et d’un sel.',
      refs: [...A('susp-ana-charge-acide', 'susp-ana-charge-silice', 'susp-ana-pie-flocule', 'susp-ana-delta', 'susp-ana-sel-valence', 'susp-ana-eau-deminer', 'susp-ana-choc-ph', 'susp-ana-disp-aqueux', 'susp-ana-liant', 'susp-ana-taille'),
        ...VV('susp-val-pie-interpole', 'susp-val-sel-stabilise', 'susp-val-signe-inverse', 'susp-val-silice-pie')] },
    { id: 'mouiller-disperser', nom: 'Mouiller et disperser une poudre', capacite: 'Cas des suspensions : expliquer le choix d’un agent mouillant ou d’un agent dispersant selon son mode d’action ; identifier les situations de mouillage total, partiel ou de non-mouillage selon l’angle de raccordement ; contrôler l’homogénéité par une mesure granulométrique.',
      refs: [...A('disp-ana-mouillant-role', 'disp-ana-mouillant-tension', 'disp-ana-energie', 'disp-ana-broyage', 'disp-ana-pic', 'disp-ana-d90', 'disp-ana-milieu-organique', 'disp-ana-pce', 'disp-ana-optimum', 'disp-ana-dosage-eau', 'disp-ana-angle', 'disp-ana-zisman'),
        ...VV('disp-val-agglo-d50', 'disp-val-energie-suffit', 'disp-val-dosage-eau', 'disp-val-pce-ions', 'disp-val-angle-grand')] },
  ],

  // ───────────────────────── S7 · Formulation : plans d’expériences ─────────────────────────
  'bts-plans': [
    { id: 'melange', nom: 'Plan de mélange : fractions et somme égale à 1', capacite: 'Plan de mélanges ternaires : mettre en œuvre un plan d’expériences pour développer ou optimiser une formule (facteurs d’entrée, réponses, fractions dont la somme vaut 1).',
      refs: [...S('pmel-melange'), ...A('pmel-pas-de-constante', 'pmel-composant-seul'), ...VV('pmel-val-fractions')] },
    { id: 'modele-melange', nom: 'Exploiter le modèle d’un plan de mélange', capacite: 'Exploiter les résultats d’un plan de mélange : interaction entre deux constituants (synergie, antagonisme), prévision d’une formule.',
      refs: [...A('pmel-ecart-milieu-sens'), ...VV('pmel-val-prevision'), ...R('pmel-calcul')] },
    { id: 'factoriel', nom: 'Plan factoriel : coder, calculer les effets', capacite: 'Plan factoriel complet : mettre en œuvre un plan, coder les niveaux, calculer les effets des facteurs et exploiter les résultats (interactions).',
      refs: [...S('pfac-flan'), ...A('pfac-niveau-central', 'pfac-parallele'), ...VV('pfac-val-coefficient'), ...R('pfac-calcul')] },
    { id: 'validite', nom: 'Valider un plan et ses limites', capacite: 'Évaluer la validité d’un plan d’expériences : degrés de liberté, essai de contrôle, effets confondus (les plans fractionnaires sont un prolongement du référentiel).',
      refs: [...A('pmel-centre-controle', 'pfac-fraction-essais', 'pfac-alias-hierarchie'), ...VV('pfac-val-sature')] },
    { id: 'isoreponses', nom: 'Courbes isoréponses : choisir ses conditions', capacite: 'Exploiter des courbes isoréponses pour choisir les conditions de formulation.',
      refs: [...A('pmel-iso-resserrees', 'pfac-iso-fenetre'), ...VV('pfac-iso-extrapolation')] },
  ],
};
