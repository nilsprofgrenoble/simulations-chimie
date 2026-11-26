// ═══════════════════════════════════════════════════════════════════════════
//  COUVERTURE DES PROGRAMMES : source unique de la barre « programme couvert » et de la liste « pas encore couvert »
//  affichées sur l'accueil pour chaque niveau.
//
//  Règle de calcul (estimation, annoncée sur le site) : chaque PARTIE du programme officiel compte pour 1 si elle est couverte,
//  pour ½ si elle l'est en partie, pour 0 si aucune simulation ne la traite. Pourcentage = total / nombre de parties.
//  « Couverte » = au moins une simulation du niveau traite l'essentiel des capacités exigibles de la partie.
//  Les parties sont celles des programmes officiels (dossier programmes/ du projet), regroupées par thème.
//
//  Maintenance : à chaque nouvelle simulation, passer la partie concernée de 'avenir' à 'partiel' ou 'ok' (et renseigner
//  `chap` : identifiant du chapitre du menu qui la traite), puis mettre à jour DATE_COUVERTURE. Rien d'autre à toucher.
//  Le test src/couverture.test.mjs vérifie que les identifiants de chapitres existent et que le calcul est cohérent.
//
//  Champs d'une partie : t = intitulé, th = thème du programme, e = état ('ok' | 'partiel' | 'avenir'),
//  chap = chapitre du menu qui la traite (si ok ou partiel), reste = ce qui manque (si partiel).
//  Le BTS n'a pas de barre : son référentiel n'est pas décliné ici au même niveau de détail.
// ═══════════════════════════════════════════════════════════════════════════
export const DATE_COUVERTURE = '26 novembre 2026';

export const ETATS = { ok: 1, partiel: 0.5, avenir: 0 };

const MESURE = 'Mesure et incertitudes';
const CTM = 'Constitution et transformations de la matière';
const MVT = 'Mouvement et interactions';
const NRJ = 'L’énergie : conversions et transferts';
const OND = 'Ondes et signaux';

export const COUVERTURE = [
  // ───────────────────────────── Seconde ─────────────────────────────
  { id: '2GT', niveau: '2GT', label: 'Seconde', parties: [
    { th: MESURE, t: 'Variabilité de la mesure, écart-type et incertitude-type', e: 'ok', chap: '2gt-mesure' },
    { th: CTM, t: 'Corps purs, mélanges et identification d’espèces chimiques', e: 'ok', chap: '2gt-solutions' },
    { th: CTM, t: 'Solutions : concentration en masse, dilution, dosage par étalonnage', e: 'ok', chap: '2gt-solutions' },
    { th: CTM, t: 'Atomes, ions, molécules, familles chimiques et schémas de Lewis', e: 'ok', chap: '2gt-microscopique' },
    { th: CTM, t: 'Quantité de matière et mole', e: 'ok', chap: '2gt-microscopique' },
    { th: CTM, t: 'Transformation physique : changement d’état et énergie', e: 'ok', chap: '2gt-transformation-physique' },
    { th: CTM, t: 'Transformation chimique : équation de réaction, réactif limitant', e: 'ok', chap: '2gt-transformation-chimique' },
    { th: CTM, t: 'Synthèse d’une espèce chimique : reflux et chromatographie', e: 'ok', chap: '2gt-transformation-chimique' },
    { th: CTM, t: 'Transformation nucléaire : isotopes, Soleil et centrales', e: 'ok', chap: '2gt-transformation-nucleaire' },
    { th: MVT, t: 'Décrire un mouvement : référentiel, trajectoire, vecteur vitesse', e: 'ok', chap: '2gt-mouvement' },
    { th: MVT, t: 'Modéliser une action par une force', e: 'ok', chap: '2gt-forces' },
    { th: MVT, t: 'Principe d’inertie et chute libre', e: 'ok', chap: '2gt-forces' },
    { th: OND, t: 'Émission et perception d’un son', e: 'ok', chap: '2gt-son' },
    { th: OND, t: 'Vision et image : réfraction, lentille convergente, spectres', e: 'ok', chap: '2gt-lumiere' },
    { th: OND, t: 'Signaux électriques : lois des nœuds et des mailles, loi d’Ohm, capteurs', e: 'ok', chap: '2gt-circuits' },
  ] },

  // ───────────────────────── Première spé PC ─────────────────────────
  { id: '1G', niveau: '1G', label: 'Première spé PC', parties: [
    { th: MESURE, t: 'Variabilité de la mesure, incertitudes-types de type A et B', e: 'ok', chap: '1g-mesure' },
    { th: CTM, t: 'Composition du système initial : masse molaire, quantité de matière, concentration', e: 'ok', chap: '1g-evolution' },
    { th: CTM, t: 'Absorbance et loi de Beer-Lambert', e: 'ok', chap: '1g-evolution' },
    { th: CTM, t: 'Oxydo-réduction : couples, demi-équations, équation de réaction', e: 'ok', chap: '1g-evolution' },
    { th: CTM, t: 'Évolution d’un système : avancement et tableau d’avancement', e: 'ok', chap: '1g-evolution' },
    { th: CTM, t: 'Titrage avec repérage de l’équivalence', e: 'ok', chap: '1g-evolution' },
    { th: CTM, t: 'Structure des entités : schéma de Lewis, géométrie, électronégativité, polarité', e: 'ok', chap: 'structure-entites' },
    { th: CTM, t: 'Cohésion, dissolution, solubilité et miscibilité', e: 'ok', chap: '1g-cohesion' },
    { th: CTM, t: 'Chimie organique : groupes caractéristiques, nomenclature, spectroscopie infrarouge', e: 'ok', chap: '1g-organique' },
    { th: CTM, t: 'Synthèse organique : protocole, rendement, contrôle', e: 'ok', chap: '1g-synthese' },
    { th: CTM, t: 'Combustions : énergie molaire de réaction et énergie de liaison', e: 'ok', chap: '1g-combustions' },
    { th: MVT, t: 'Interactions fondamentales et notion de champ', e: 'ok', chap: '1g-champ' },
    { th: MVT, t: 'Fluide au repos : pression, loi de Mariotte, statique des fluides', e: 'ok', chap: '1g-fluide' },
    { th: MVT, t: 'Mouvement d’un système : variation de vitesse et forces', e: 'ok', chap: '1g-mouvement' },
    { th: NRJ, t: 'Aspects énergétiques des phénomènes électriques', e: 'ok', chap: '1g-electricite' },
    { th: NRJ, t: 'Aspects énergétiques des phénomènes mécaniques', e: 'ok', chap: '1g-energie-meca' },
    { th: OND, t: 'Ondes mécaniques : célérité, retard, période, longueur d’onde', e: 'ok', chap: 'ondes-meca' },
    { th: OND, t: 'Image donnée par une lentille mince', e: 'ok', chap: '1g-lentille' },
    { th: OND, t: 'Couleurs : synthèse additive et soustractive', e: 'ok', chap: '1g-couleurs' },
    { th: OND, t: 'Modèles ondulatoire et particulaire de la lumière : photon, niveaux d’énergie', e: 'ok', chap: '1g-lumiere' },
  ] },

  // ──────────────────────── Terminale spé PC ────────────────────────
  { id: 'TG', niveau: 'TG', label: 'Terminale spé PC', parties: [
    { th: MESURE, t: 'Incertitudes-types composées et critère de comparaison à une valeur de référence', e: 'ok', chap: 'tg-mesure' },
    { th: CTM, t: 'Transferts d’ion hydrogène : couples acide-base, équation de réaction', e: 'ok', chap: 'tg-composition' },
    { th: CTM, t: 'pH et concentration en ions oxonium', e: 'ok', chap: 'tg-composition' },
    { th: CTM, t: 'Conductimétrie : loi de Kohlrausch et dosage par étalonnage', e: 'ok', chap: 'tg-composition' },
    { th: CTM, t: 'Spectroscopies infrarouge et UV-visible', e: 'ok', chap: 'tg-composition' },
    { th: CTM, t: 'Titrages avec suivi pH-métrique et conductimétrique', e: 'ok', chap: 'tg-composition' },
    { th: CTM, t: 'Cinétique : vitesse volumique, temps de demi-réaction, loi d’ordre 1', e: 'ok', chap: 'tg-evolution-temporelle' },
    { th: CTM, t: 'Mécanismes réactionnels : acte élémentaire, intermédiaire, flèches courbes', e: 'ok', chap: 'tg-evolution-temporelle' },
    { th: CTM, t: 'Radioactivité : diagramme (N, Z) et équations de désintégration', e: 'ok', chap: 'tg-evolution-temporelle' },
    { th: CTM, t: 'Radioactivité : loi de décroissance, demi-vie, activité, datation', e: 'ok', chap: 'tg-evolution-temporelle' },
    { th: CTM, t: 'Équilibre chimique : quotient de réaction, constante d’équilibre, sens d’évolution', e: 'ok', chap: 'tg-etat-final' },
    { th: CTM, t: 'Pile : demi-piles, pont salin, tension à vide, capacité', e: 'ok', chap: 'tg-etat-final' },
    { th: CTM, t: 'Force des acides et des bases : Ka, diagrammes de prédominance, solution tampon', e: 'ok', chap: 'tg-etat-final' },
    { th: CTM, t: 'Électrolyse : forcer le sens d’évolution d’un système', e: 'ok', chap: 'tg-etat-final' },
    { th: CTM, t: 'Synthèse organique : formules topologiques, isomérie de constitution, polymères', e: 'ok', chap: 'tg-synthese' },
    { th: CTM, t: 'Synthèse organique : optimisation d’une étape (vitesse, rendement)', e: 'ok', chap: 'tg-synthese' },
    { th: CTM, t: 'Synthèse organique : stratégie multi-étapes et synthèses écoresponsables', e: 'ok', chap: 'tg-synthese' },
    { th: MVT, t: 'Décrire un mouvement : vecteurs position, vitesse, accélération, repère de Frenet', e: 'ok', chap: 'tg-decrire-mouvement' },
    { th: MVT, t: 'Deuxième loi de Newton', e: 'ok', chap: 'tg-newton' },
    { th: MVT, t: 'Mouvement dans un champ uniforme (pesanteur, condensateur plan)', e: 'ok', chap: 'tg-newton' },
    { th: MVT, t: 'Mouvement dans un champ de gravitation : satellites, lois de Kepler', e: 'ok', chap: 'tg-newton' },
    { th: MVT, t: 'Écoulement d’un fluide : poussée d’Archimède, relation de Bernoulli', e: 'ok', chap: 'tg-fluides' },
    { th: NRJ, t: 'Gaz parfait', e: 'ok', chap: 'tg-gaz-parfait' },
    { th: NRJ, t: 'Premier principe de la thermodynamique, transferts thermiques', e: 'ok', chap: 'tg-bilans-energie' },
    { th: NRJ, t: 'Bilan thermique du système Terre-atmosphère, effet de serre', e: 'ok', chap: 'tg-bilans-energie' },
    { th: NRJ, t: 'Loi de Newton : évolution de la température d’un système au contact d’un thermostat', e: 'ok', chap: 'tg-bilans-energie' },
    { th: OND, t: 'Intensité sonore, niveau d’intensité et atténuation', e: 'ok', chap: 'tg-ondes' },
    { th: OND, t: 'Diffraction d’une onde', e: 'ok', chap: 'tg-ondes' },
    { th: OND, t: 'Interférences de deux ondes', e: 'ok', chap: 'tg-ondes' },
    { th: OND, t: 'Effet Doppler', e: 'ok', chap: 'tg-ondes' },
    { th: OND, t: 'Lunette astronomique afocale', e: 'ok', chap: 'tg-images-photons' },
    { th: OND, t: 'Photons : effet photoélectrique, cellule photovoltaïque', e: 'ok', chap: 'tg-images-photons' },
    { th: OND, t: 'Dynamique d’un circuit RC', e: 'ok', chap: 'tg-circuit-rc' },
  ] },

  // ───────────────── Terminale STL : SPCL (sciences physiques et chimiques en laboratoire) ─────────────────
  { id: 'TSTL-SPCL', niveau: 'TSTL', label: 'SPCL', parties: [
    { th: MESURE, t: 'Incertitudes de type A et B, sources d’erreurs, incertitudes composées, justesse et fidélité', e: 'partiel', chap: 'tstl-mesure', reste: 'incertitude de type B, sources d’erreurs, incertitudes composées, justesse et fidélité' },
    { th: 'Chimie et développement durable', t: 'Solubilité : quotient de réaction, constante Ks, précipitation sélective', e: 'avenir' },
    { th: 'Chimie et développement durable', t: 'Acides et bases : Ka, pKa, pH, tampon, titrages', e: 'ok', chap: 'tstl-acides-bases' },
    { th: 'Chimie et développement durable', t: 'Conductivité : loi de Kohlrausch, dosage et titrage conductimétriques', e: 'partiel', chap: 'tstl-conductivite', reste: 'constante d’acidité par conductimétrie, allure d’une courbe de titrage, étalonnage' },
    { th: 'Chimie et développement durable', t: 'Oxydo-réduction : potentiel, relation de Nernst, titrages redox', e: 'avenir' },
    { th: 'Chimie et développement durable', t: 'Électrolyse et électrosynthèse', e: 'avenir' },
    { th: 'Chimie et développement durable', t: 'Rendement et optimisation d’une synthèse, chimie verte', e: 'ok', chap: 'tstl-synthese-organique' },
    { th: 'Chimie et développement durable', t: 'Synthèses : estérification, Dean-Stark, chromatographie', e: 'ok', chap: 'tstl-synthese-organique' },
    { th: 'Chimie et développement durable', t: 'Spectroscopies UV-visible, infrarouge et RMN', e: 'avenir' },
    { th: 'Chimie et développement durable', t: 'Mécanismes réactionnels et stéréochimie', e: 'partiel', chap: 'tstl-synthese-organique', reste: 'mésomérie, loi de Biot et excès énantiomérique, stabilité des intermédiaires' },
    { th: 'Ondes', t: 'Oscillateurs : oscillations libres, amorties, résonance', e: 'avenir' },
    { th: 'Ondes', t: 'Ondes progressives sinusoïdales et acoustique', e: 'partiel', chap: 'tstl-ondes', reste: 'périodicités spatiale et temporelle, puissance et amplitude' },
    { th: 'Ondes', t: 'Ondes stationnaires et modes propres', e: 'avenir' },
    { th: 'Ondes', t: 'Ondes électromagnétiques : spectre, laser, rayonnement d’un corps', e: 'avenir' },
    { th: 'Ondes', t: 'Réfraction, réflexion totale et mesure d’un indice', e: 'partiel', chap: 'tstl-distillation', reste: 'lois de Snell-Descartes, angle limite et réflexion totale' },
    { th: 'Ondes', t: 'Polarisation et activité optique : loi de Biot', e: 'avenir' },
    { th: 'Ondes', t: 'Diffraction des ondes', e: 'ok', chap: 'tstl-ondes' },
    { th: 'Ondes', t: 'Interférences et réseaux', e: 'ok', chap: 'tstl-ondes' },
    { th: 'Ondes', t: 'Effet Doppler', e: 'ok', chap: 'tstl-ondes' },
    { th: 'Ondes', t: 'Échographie', e: 'ok', chap: 'tstl-ondes' },
    { th: 'Ondes', t: 'L’œil et la loupe', e: 'ok', chap: 'tstl-ondes-observer' },
    { th: 'Ondes', t: 'Le microscope', e: 'ok', chap: 'tstl-ondes-observer' },
    { th: 'Ondes', t: 'La lunette astronomique', e: 'ok', chap: 'tstl-ondes-observer' },
    { th: 'Ondes', t: 'Miroirs et télescope', e: 'avenir' },
    { th: 'Ondes', t: 'Transmettre l’information : câble, ondes en champ libre, fibre optique', e: 'avenir' },
    { th: 'Ondes', t: 'Stocker, lire et afficher l’information : supports optiques, cristaux liquides', e: 'avenir' },
    { th: 'Systèmes et procédés', t: 'Chaîne d’informations : capteur, conditionneur, convertisseur analogique-numérique', e: 'ok', chap: 'tstl-signaux' },
    { th: 'Systèmes et procédés', t: 'Filtrage et amplification de tension', e: 'avenir' },
    { th: 'Systèmes et procédés', t: 'Contrôle d’un système : champ magnétique, moteur pas à pas', e: 'ok', chap: 'tstl-controle' },
    { th: 'Systèmes et procédés', t: 'Régulation : TOR, proportionnelle, PI', e: 'ok', chap: 'tstl-regulation' },
    { th: 'Systèmes et procédés', t: 'Échangeurs, transferts thermiques et chaudières', e: 'ok', chap: 'tstl-thermique' },
    { th: 'Systèmes et procédés', t: 'Pompes à chaleur, machines frigorifiques, principes de la thermodynamique', e: 'ok', chap: 'tstl-thermique' },
    { th: 'Systèmes et procédés', t: 'Débit, pression et statique des fluides', e: 'ok', chap: 'tstl-fluides' },
    { th: 'Systèmes et procédés', t: 'Circuits hydrauliques, relation de Bernoulli, pompe', e: 'ok', chap: 'tstl-fluides' },
    { th: 'Systèmes et procédés', t: 'Distillation et diagrammes binaires', e: 'ok', chap: 'tstl-distillation' },
    { th: 'Systèmes et procédés', t: 'Évaporation et cristallisation', e: 'ok', chap: 'tstl-cristallisation' },
  ] },

  // ───────────────── Terminale STL : PCM (physique-chimie et mathématiques) ─────────────────
  { id: 'TSTL-PCM', niveau: 'TSTL', label: 'PCM', parties: [
    { th: MESURE, t: 'Incertitudes de type A et B, sources d’erreurs, justesse et fidélité', e: 'partiel', chap: 'tstl-mesure', reste: 'incertitude de type B, sources d’erreurs, incertitudes composées, justesse et fidélité' },
    { th: 'Constitution de la matière', t: 'Structure spatiale : chiralité, énantiomères, diastéréoisomères, configuration R/S, Z et E', e: 'ok', chap: 'tstl-pcm-structure-spatiale' },
    { th: 'Transformation de la matière', t: 'Réactions acido-basiques : Ka, coefficient de dissociation, tampon, CO₂ dissous, extraction', e: 'ok', chap: 'tstl-pcm-reactions-acido-basiques' },
    { th: 'Transformation de la matière', t: 'Oxydo-réduction : nombre d’oxydation, demi-réactions, pile, quantité d’électricité', e: 'avenir' },
    { th: 'Transformation de la matière', t: 'Cinétique : loi de vitesse, ordre 0 et 1, temps de demi-réaction', e: 'avenir' },
    { th: 'Transformation de la matière', t: 'Radioactivité : types, loi de décroissance, activité', e: 'avenir' },
    { th: MVT, t: 'Mouvements : coordonnées de l’accélération', e: 'avenir' },
    { th: MVT, t: 'Interactions : force électrostatique, lois de Newton, chute avec frottement visqueux', e: 'avenir' },
    { th: NRJ, t: 'Chaînes énergétiques, conservation de l’énergie, rendement', e: 'ok', chap: 'tstl-pcm-energie' },
    { th: NRJ, t: 'Énergie mécanique', e: 'partiel', chap: 'tstl-pcm-energie', reste: 'applications (bilan d’énergie : chute d’une hauteur h, looping, jeu de force, flipper)' },
    { th: NRJ, t: 'Énergie chimique : enthalpie, loi de Hess, pouvoir calorifique', e: 'avenir' },
    { th: NRJ, t: 'Énergie électrique : puissance, effet Joule, piles et accumulateurs', e: 'ok', chap: 'tstl-pcm-energie' },
    { th: NRJ, t: 'Énergie et ondes : flux, éclairement, panneau photovoltaïque, laser', e: 'ok', chap: 'tstl-pcm-energie' },
  ] },
];

// Bilan d'un programme : nombre de parties par état et pourcentage arrondi
export function bilan(parties) {
  const n = parties.length;
  const ok = parties.filter(p => p.e === 'ok').length;
  const partiel = parties.filter(p => p.e === 'partiel').length;
  const avenir = n - ok - partiel;
  const total = parties.reduce((s, p) => s + (ETATS[p.e] ?? 0), 0);
  return { n, ok, partiel, avenir, pourcent: n ? Math.round((100 * total) / n) : 0, fracOk: n ? ok / n : 0, fracPartiel: n ? (0.5 * partiel) / n : 0 };
}

export const couverturesDuNiveau = niveau => COUVERTURE.filter(c => c.niveau === niveau);

// Parties pas (ou pas entièrement) couvertes d'un niveau, par programme : sert au menu et à l'accueil.
export const resteDuNiveau = niveau =>
  couverturesDuNiveau(niveau)
    .map(c => ({ id: c.id, label: c.label, items: c.parties.filter(p => p.e !== 'ok') }))
    .filter(x => x.items.length);
