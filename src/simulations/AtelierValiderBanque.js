// ====================================================
//  BANQUE DE L'ATELIER « VALIDER » (compétence VAL : juger la vraisemblance d'un résultat, le comparer à une référence)
// ====================================================
// Principe : on ne demande JAMAIS à l'élève de connaître le sujet. Tout ce qu'il faut pour juger est écrit à l'écran
// (« repères » : ordres de grandeur, valeurs de référence, règle de décision). La difficulté vient du raisonnement, pas de la mémoire.
//
// Chaque exercice est rattaché à un thème (champ « domaine », voir chapitres.js) et a un niveau de 1 à 3 :
//   niveau 1 : une seule idée, repère direct, erreur « grossière » (unité, puissance de 10) ;
//   niveau 2 : il faut estimer ou combiner deux repères ;
//   niveau 3 : résultat plausible mais pas forcément exact, ou deux incertitudes à composer.
// Les nombres sont écrits à la main et vérifiés (src/simulations/AtelierValiderBanque.test.mjs).
//
// Option de QCM : [texte, juste (booléen), explication].

const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];

export const NIVEAUX = { 1: 'Niveau 1 · repère direct', 2: 'Niveau 2 · estimer', 3: 'Niveau 3 · nuancer' };

export const METHODE_PLAUSIBLE = [
  'Repérer ce que représente le résultat (une vitesse, une pression, une énergie…) et son unité.',
  'Le comparer aux repères donnés : est-il du même ordre de grandeur ?',
  'S’il est très différent (facteur 10, 1 000…), chercher l’erreur classique : unité, puissance de 10, formule.',
];
export const METHODE_COMPAT = [
  'Calculer l’écart entre la mesure et la référence : |x − x_ref|.',
  'Le comparer à 2·u (u = incertitude-type) : écart ≤ 2·u ⇒ compatible.',
  'Conclure en une phrase ; si ce n’est pas compatible, chercher une source d’erreur qui explique aussi le sens de l’écart.',
];

// ─────────────── 1. « Ça paraît plausible ? » ───────────────
// ver : explication du verdict ; q2/options : « pourquoi ? » ou « quelle erreur ? » (une seule bonne réponse)
const VERDICT = (ok, ver) => [
  ['Plausible', ok, ver],
  ['Pas plausible', !ok, ver],
];

const P = (o) => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const PLAUSIBLES = [
  // ── Transport des fluides ──
  P({ id: 'vitesse-eau', domaine: 'Transport des fluides', niveau: 1, titre: 'Vitesse de l’eau dans une conduite', plausible: false,
    enonce: 'Une conduite d’eau de diamètre intérieur d = 50 mm transporte un débit volumique Q_V = 7,2 m³·h⁻¹. Un élève calcule la vitesse moyenne v = Q_V / S, avec S = π·d²/4, et trouve v = 3,7×10³ m·s⁻¹.',
    reperes: [['Vitesse usuelle de l’eau dans une canalisation', '0,5 à 3 m·s⁻¹'], ['Vitesse du son dans l’air', '340 m·s⁻¹'], ['Voiture sur autoroute', '130 km·h⁻¹ ≈ 36 m·s⁻¹']],
    ver: '3,7×10³ m·s⁻¹ font plus de 13 000 km·h⁻¹, bien plus vite que le son (340 m·s⁻¹). Dans une canalisation, l’eau circule à quelques m·s⁻¹ au plus.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('Q_V est resté en m³·h⁻¹ au lieu d’être converti en m³·s⁻¹', '7,2 m³·h⁻¹ = 2,0×10⁻³ m³·s⁻¹. Oublier de diviser par 3 600 rend v 3 600 fois trop grande : 3,7×10³ / 3 600 ≈ 1,0 m·s⁻¹.'),
      F('Le diamètre a été utilisé comme rayon', 'Cela multiplierait la section par 4 : v serait 4 fois plus petite (≈ 0,25 m·s⁻¹), pas des milliers de fois plus grande.'),
      F('Le diamètre a été laissé en mm', 'S serait énorme (1 963 m²) et v minuscule, pas gigantesque.'),
    ] }),
  P({ id: 'pression-cuve', domaine: 'Transport des fluides', niveau: 1, titre: 'Pression au fond d’une cuve', plausible: false,
    enonce: 'Une cuve ouverte contient de l’eau (ρ = 1 000 kg·m⁻³) sur une hauteur h = 3,0 m. Un élève calcule la pression due à l’eau au fond, ΔP = ρ·g·h, et trouve ΔP = 2,9×10⁶ Pa.',
    reperes: [['Pression atmosphérique', '1 bar = 10⁵ Pa'], ['Hauteur d’eau qui correspond à 1 bar', '≈ 10 m'], ['Pneu de voiture', '≈ 2 à 3 bar']],
    ver: '2,9×10⁶ Pa = 29 bar, ce qui correspond à environ 290 m d’eau ! Pour 3 m d’eau, on attend environ 0,3 bar, soit 3×10⁴ Pa.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('h a été saisie en cm (300) au lieu de m', '1 000 × 9,81 × 300 ≈ 2,9×10⁶ Pa : c’est bien le résultat de l’élève. Avec h = 3,0 m on trouve 2,9×10⁴ Pa.'),
      F('La pression atmosphérique a été oubliée', 'Elle ajouterait 1 bar : le résultat serait plus petit, pas 100 fois trop grand.'),
      F('ρ a été pris en g·cm⁻³ (ρ = 1)', 'On trouverait 29 Pa : beaucoup trop petit, pas trop grand.'),
    ] }),
  P({ id: 'p-hydraulique', domaine: 'Transport des fluides', niveau: 2, titre: 'Rendement d’une pompe', plausible: false,
    enonce: 'Une pompe fournit au fluide la puissance hydraulique P_h = Q_V × ΔP, avec Q_V = 2,0×10⁻³ m³·s⁻¹ et ΔP = 2,5 bar. Un élève trouve P_h = 500 W. Il mesure par ailleurs la puissance électrique absorbée par la pompe : P_e = 420 W.',
    reperes: [['Rendement d’une pompe', 'η = P_hydraulique / P_électrique, toujours inférieur à 1'], ['Rendement usuel d’une petite pompe', '40 à 70 %']],
    ver: 'η = 500 / 420 ≈ 1,19 : la pompe donnerait plus de puissance qu’elle n’en reçoit, ce qui est impossible. Avec η ≈ 0,6, on attendrait P_e ≈ 830 W.',
    q2: 'Que faut-il en conclure ?',
    options: [
      V('Au moins une des deux valeurs est fausse : il faut revérifier les calculs, les conversions (bar → Pa) et la mesure', 'Un rendement supérieur à 1 signale toujours une erreur quelque part.'),
      F('La pompe est exceptionnellement performante', 'Un rendement supérieur à 1 violerait la conservation de l’énergie.'),
      F('En exprimant le rendement en %, la contradiction disparaît', '119 % reste supérieur à 100 % : le problème est le même.'),
    ] }),

  // ── Transmission de signaux numériques ──
  P({ id: 'quantum-can', domaine: 'Transmission de signaux numériques', niveau: 1, titre: 'Quantum d’un CAN 10 bits', plausible: true,
    enonce: 'Un convertisseur analogique-numérique (CAN) de n = 10 bits convertit des tensions de 0 à 5 V. Un élève calcule son quantum q = ΔU / 2ⁿ et trouve q = 4,9 mV.',
    reperes: [['2¹⁰', '1 024 valeurs possibles'], ['Plage de conversion', '0 à 5 V'], ['Quantum', 'plus petit écart de tension que le CAN distingue']],
    ver: '5 V sont répartis sur environ 1 000 niveaux : chaque niveau vaut environ 5 mV. Le résultat 4,9 mV est cohérent (estimation : 5 V / 1 000 = 5 mV).',
    q2: 'Quel raisonnement permet de le vérifier rapidement ?',
    options: [
      V('Arrondir 2¹⁰ à 1 000 : 5 V / 1 000 = 5 mV', 'Une estimation avec des nombres ronds suffit pour juger de l’ordre de grandeur.'),
      F('Comparer q à la plage : q doit valoir environ 5 V', 'q est l’écart entre deux niveaux voisins, donc bien plus petit que la plage entière.'),
      F('Vérifier que q est un nombre entier de bits', 'Le quantum est une tension, pas un nombre de bits.'),
    ] }),
  P({ id: 'quantum-faux', domaine: 'Transmission de signaux numériques', niveau: 1, titre: 'Quantum : un résultat étonnant', plausible: false,
    enonce: 'Même CAN de n = 10 bits, plage de 0 à 5 V. Un autre élève trouve un quantum q = 0,5 V.',
    reperes: [['2¹⁰', '1 024 valeurs possibles'], ['Plage de conversion', '0 à 5 V'], ['Quantum', 'plus petit écart de tension que le CAN distingue']],
    ver: 'Avec q = 0,5 V, le CAN n’aurait que 10 niveaux sur 5 V. Or 10 bits donnent 1 024 niveaux : q doit être de l’ordre de 5 mV.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('Il a divisé par n = 10 au lieu de 2ⁿ = 1 024', '5 V / 10 = 0,5 V : c’est exactement son résultat.'),
      F('Il a oublié de convertir les mV en V', 'Cela ne changerait pas la grandeur physique : un facteur d’unité n’explique pas ce raisonnement.'),
      F('Il a confondu le quantum avec la fréquence d’échantillonnage', 'La fréquence d’échantillonnage n’intervient pas dans le calcul du quantum.'),
    ] }),
  P({ id: 'nb-valeurs', domaine: 'Transmission de signaux numériques', niveau: 2, titre: 'Nombre de valeurs d’un CAN 12 bits', plausible: false,
    enonce: 'Un CAN de 12 bits peut coder N valeurs différentes. Un élève trouve N = 144.',
    reperes: [['10 bits', '1 024 valeurs'], ['Chaque bit supplémentaire', 'double le nombre de valeurs']],
    ver: 'Avec 10 bits on a déjà 1 024 valeurs : 12 bits en donnent forcément davantage (4 096), pas seulement 144. Or 144 = 12².',
    q2: 'Quelle est la bonne relation ?',
    options: [
      V('N = 2ⁿ (et non n²)', '2¹² = 4 096 ; chaque bit en plus double le nombre de valeurs.'),
      F('N = 2 × n', '2 × 12 = 24 : cela ne double pas à chaque bit supplémentaire.'),
      F('N ne dépend pas du nombre de bits', 'Il en dépend directement : plus il y a de bits, plus il y a de valeurs.'),
    ] }),
  P({ id: 'debit-binaire', domaine: 'Transmission de signaux numériques', niveau: 2, titre: 'Débit binaire d’un signal audio', plausible: false,
    enonce: 'Un signal audio mono est numérisé à f_éch = 44,1 kHz sur 16 bits. Un élève calcule le débit binaire D = f_éch × n et trouve D = 7,1×10⁸ bit·s⁻¹.',
    reperes: [['CD audio stéréo (2 voies)', '1,41 Mbit·s⁻¹'], ['Connexion ADSL', '1 à 20 Mbit·s⁻¹'], ['Fibre optique', '100 à 1 000 Mbit·s⁻¹']],
    ver: 'Une seule voie doit faire environ la moitié du CD stéréo : 0,7 Mbit·s⁻¹ = 7×10⁵ bit·s⁻¹. Le résultat de l’élève est 1 000 fois trop grand.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('44,1 kHz a été converti en 44,1 MHz au lieu de 44 100 Hz', '44,1×10⁶ × 16 ≈ 7,1×10⁸ : c’est bien le résultat de l’élève (facteur 1 000 en trop).'),
      F('Il a pris 8 bits au lieu de 16', 'Cela diviserait le résultat par 2, sans changer l’ordre de grandeur.'),
      F('Il a oublié de multiplier par le nombre de voies', 'Le signal est mono : une seule voie, il n’y a rien à multiplier.'),
    ] }),

  // ── Transferts thermiques ──
  P({ id: 'chauffer-eau', domaine: 'Transferts thermiques', niveau: 1, titre: 'Énergie pour chauffer de l’eau', plausible: true,
    enonce: 'On chauffe m = 2,0 kg d’eau de 20 °C à 80 °C. Un élève calcule Q = m·c·ΔT, avec c = 4 180 J·kg⁻¹·K⁻¹, et trouve Q = 5,0×10⁵ J.',
    reperes: [['Chauffer 1 kg d’eau de 1 K', '≈ 4 kJ'], ['Bouilloire électrique', '≈ 2 kW (2 000 J par seconde)']],
    ver: 'Estimation : 2 kg × 60 K = 120 kg·K, soit environ 120 × 4 kJ = 480 kJ ≈ 5×10⁵ J. Une bouilloire de 2 kW fournirait cette énergie en 250 s (environ 4 min) : c’est réaliste.',
    q2: 'Que signifie « plausible » ici ?',
    options: [
      V('Le résultat est du bon ordre de grandeur ; cela ne prouve pas qu’il est exact au chiffre près', 'Le test de vraisemblance détecte les grosses erreurs (unités, puissances de 10, formule), pas une erreur de 2 %.'),
      F('Le résultat est forcément exact', 'Un résultat peut être plausible et faux (par exemple une erreur de 5 % sur ΔT).'),
      F('Le résultat est bon car il est écrit avec peu de chiffres', 'Le nombre de chiffres ne dit rien sur la justesse.'),
    ] }),
  P({ id: 'chauffer-eau-faux', domaine: 'Transferts thermiques', niveau: 1, titre: 'Énergie pour chauffer de l’eau : un autre résultat', plausible: false,
    enonce: 'Même situation : m = 2,0 kg d’eau chauffée de 20 °C à 80 °C, c = 4 180 J·kg⁻¹·K⁻¹. Un autre élève trouve Q = 5,0×10⁸ J.',
    reperes: [['Chauffer 1 kg d’eau de 1 K', '≈ 4 kJ'], ['Bouilloire électrique', '≈ 2 kW (2 000 J par seconde)']],
    ver: 'Avec 5×10⁸ J, une bouilloire de 2 kW chaufferait pendant 250 000 s, soit presque 70 h, pour chauffer 2 kg d’eau ! On attend environ 5×10⁵ J.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('La masse a été prise en grammes (2 000) alors que c est en J·kg⁻¹·K⁻¹', '2 000 × 4 180 × 60 ≈ 5,0×10⁸ : facteur 1 000 en trop, c’est bien le résultat de l’élève.'),
      F('ΔT a été calculé comme 80 + 20 au lieu de 80 − 20', 'On trouverait ΔT = 100 K et Q ≈ 8,4×10⁵ J : même ordre de grandeur, pas un facteur 1 000.'),
      F('ΔT a été mal converti de °C en K', 'Un écart de température est le même en °C et en K : aucune conversion n’est nécessaire.'),
    ] }),
  P({ id: 'melange', domaine: 'Transferts thermiques', niveau: 2, titre: 'Température d’un mélange', plausible: false,
    enonce: 'On mélange 1,0 kg d’eau à 80 °C et 1,0 kg d’eau à 20 °C dans un calorimètre parfaitement isolé. Un élève annonce une température finale T_f = 100 °C.',
    reperes: [['Température d’équilibre', 'toujours comprise entre les deux températures initiales'], ['Deux masses égales du même liquide', 'T_f = moyenne des deux températures']],
    ver: 'Le mélange ne peut pas être plus chaud que l’eau chaude (80 °C). Avec des masses égales, T_f est la moyenne : (80 + 20) / 2 = 50 °C.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('Les températures ont été additionnées (80 + 20) au lieu d’être moyennées', '80 + 20 = 100 : c’est exactement le résultat de l’élève.'),
      F('Le calorimètre a apporté de l’énergie à l’eau', 'Il est parfaitement isolé : il n’échange aucune énergie.'),
      F('L’eau a atteint son point d’ébullition', 'Elle ne chauffe pas : le mélange est plus froid que l’eau chaude de départ.'),
    ] }),
  P({ id: 'melange-3', domaine: 'Transferts thermiques', niveau: 3, titre: 'Mélange : plausible mais exact ?', plausible: true,
    enonce: 'On mélange 3,0 kg d’eau à 80 °C et 1,0 kg d’eau à 20 °C dans un calorimètre isolé. Un élève annonce T_f = 62 °C.',
    reperes: [['Température d’équilibre', 'comprise entre les deux températures initiales'], ['Masses inégales', 'T_f est plus proche de la température du liquide le plus abondant'], ['Formule', 'T_f = (m₁·T₁ + m₂·T₂) / (m₁ + m₂)']],
    ver: 'T_f est bien entre 20 et 80 °C, et plus proche de 80 °C puisque l’eau chaude est trois fois plus abondante (le milieu serait 50 °C). Le calcul exact donne (3×80 + 1×20) / 4 = 65 °C : 62 °C est plausible, mais pas exact.',
    q2: 'Que faut-il faire ensuite ?',
    options: [
      V('Refaire le calcul exact pour savoir si les 3 °C d’écart viennent d’une erreur ou de pertes thermiques', 'Plausible ne veut pas dire correct : le test de vraisemblance ne remplace pas le calcul.'),
      F('Valider définitivement le résultat puisqu’il est plausible', 'Un résultat plausible peut encore être faux.'),
      F('Rejeter le résultat car il n’est pas égal à 50 °C', '50 °C correspond à des masses égales : ce n’est pas le cas ici.'),
    ] }),

  // ── Régulation ──
  P({ id: 'erreur-statique', domaine: 'Régulation', niveau: 1, titre: 'Erreur statique d’un four', plausible: false,
    enonce: 'Un four est régulé à la consigne de 60 °C. En régime permanent, la mesure vaut 59,4 °C. Un élève écrit : « l’erreur statique est ε = 0,6 °C, soit 10 % de la consigne ».',
    reperes: [['Erreur statique', 'ε = consigne − mesure en régime permanent'], ['1 % de 60 °C', '0,6 °C'], ['10 % de 60 °C', '6 °C']],
    ver: '10 % de 60 °C font 6 °C, pas 0,6 °C. L’erreur de 0,6 °C représente 0,6 / 60 = 0,01, soit 1 % de la consigne.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('La virgule a été décalée d’un rang : 0,6 / 60 = 0,01 = 1 %, pas 10 %', 'Une erreur sur un pourcentage se repère en calculant 1 % de la valeur.'),
      F('L’erreur statique devrait être donnée en % et non en °C', 'Les deux écritures sont possibles ; ici c’est le pourcentage qui est faux.'),
      F('ε aurait dû être négative', 'ε = 60 − 59,4 = +0,6 °C : positive ici.'),
    ] }),
  P({ id: 'tps-reponse', domaine: 'Régulation', niveau: 2, titre: 'Temps de réponse d’un 1er ordre', plausible: false,
    enonce: 'Un système du 1er ordre a pour constante de temps τ = 40 s. Un élève annonce un temps de réponse à 5 % : t_r5% = 13 s.',
    reperes: [['À t = τ', 'la sortie a atteint 63 % de sa valeur finale'], ['À t = 3τ', '95 % atteint : t_r5% ≈ 3τ']],
    ver: 'À t = τ = 40 s, la sortie n’a atteint que 63 %. À 13 s elle est donc encore très loin de 95 % : on attend t_r5% ≈ 3τ = 120 s.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('Il a divisé τ par 3 au lieu de le multiplier par 3', '40 / 3 ≈ 13 s : c’est exactement son résultat.'),
      F('Il a donné le temps en minutes au lieu de secondes', '40 s = 0,67 min : cela ne donne pas 13.'),
      F('Il a donné le temps de réponse à 63 %', 'Ce temps vaut τ = 40 s, pas 13 s.'),
    ] }),

  // ── Mesure et incertitudes ──
  P({ id: 'u-plus-grand-que-s', domaine: 'Mesure et incertitudes', niveau: 1, titre: 'Incertitude de la moyenne de 16 mesures', plausible: false,
    enonce: 'On répète 16 fois une mesure de volume : l’écart-type expérimental est s = 0,20 mL. Un élève calcule l’incertitude-type de la moyenne, u = s/√n, et trouve u = 0,80 mL.',
    reperes: [['Incertitude-type de la moyenne', 'u = s / √n'], ['√16', '4'], ['Pour n > 1', 'u est toujours plus petite que s : la moyenne est plus précise qu’une mesure seule']],
    ver: 'u = 0,80 mL est 4 fois plus grande que s = 0,20 mL : la moyenne serait moins précise qu’une mesure isolée, ce qui est absurde. On attend u = 0,20/4 = 0,05 mL.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('Il a multiplié s par √n au lieu de le diviser', '0,20 × 4 = 0,80 mL : c’est exactement son résultat.'),
      F('Il a divisé par n au lieu de √n', '0,20/16 = 0,0125 mL : trop petit, pas trop grand.'),
      F('Il a oublié de convertir les mL en L', 'Un oubli d’unité ne donnerait pas un facteur 4.'),
    ] }),
  P({ id: 'u-moyenne-ok', domaine: 'Mesure et incertitudes', niveau: 1, titre: 'Incertitude de la moyenne de 9 mesures', plausible: true,
    enonce: 'On répète 9 fois un titrage : l’écart-type expérimental est s = 0,36 mL. Un élève trouve une incertitude-type de la moyenne u = 0,12 mL.',
    reperes: [['Incertitude-type de la moyenne', 'u = s / √n'], ['√9', '3'], ['Pour n > 1', 'u est plus petite que s']],
    ver: 'u = 0,36/3 = 0,12 mL : plus petite que s, avec un rapport √9 = 3 : cohérent.',
    q2: 'Quel raisonnement permet de le vérifier rapidement ?',
    options: [
      V('Diviser s par √9 = 3 : 0,36/3 = 0,12', 'Un calcul mental avec une racine entière suffit.'),
      F('Vérifier que u est égal à s', 'u est plus petite que s pour une moyenne de plusieurs mesures.'),
      F('Vérifier que u est plus grande que la moyenne', 'La moyenne n’intervient pas dans u.'),
    ] }),
  P({ id: 'ecriture-resultat', domaine: 'Mesure et incertitudes', niveau: 2, titre: 'Écriture d’un résultat', plausible: false,
    enonce: 'Un élève écrit le résultat d’une pesée : m = 12,3456 g ± 0,23 g (u = 0,23 g).',
    reperes: [['Règle pour u', '2 chiffres significatifs si u commence par 1, 2, 3 ou 4 ; 1 seul s’il commence par 5, 6, 7, 8 ou 9'], ['Règle pour le résultat', 'la dernière décimale est la même que celle de u']],
    ver: 'u = 0,23 g est bien écrite avec 2 chiffres, mais le résultat est donné au dix-millième de gramme alors que l’incertitude est de l’ordre du dixième : les chiffres 456 n’ont aucun sens. On écrit m = 12,35 g ± 0,23 g.',
    q2: 'Quelle correction faut-il apporter ?',
    options: [
      V('Arrondir m au même rang que u : m = 12,35 g', 'Les décimales plus fines que l’incertitude ne sont pas significatives.'),
      F('Ajouter des décimales à u : ± 0,2300 g', 'Cela donnerait une fausse impression de précision.'),
      F('Garder 4 décimales pour ne pas perdre d’information', 'Les décimales plus fines que l’incertitude n’apportent pas d’information.'),
    ] }),
  P({ id: 'u-nulle', domaine: 'Mesure et incertitudes', niveau: 3, titre: 'Une incertitude nulle ?', plausible: false,
    enonce: 'Une balance affiche la masse à 0,1 g près. On mesure 5 fois le même objet : 25,3 g ; 25,3 g ; 25,3 g ; 25,3 g ; 25,3 g. L’écart-type est s = 0 g, donc un élève conclut : « u = s/√5 = 0 g, la masse est connue exactement ».',
    reperes: [['Résolution de la balance', '0,1 g : elle n’affiche pas de variation plus petite'], ['Incertitude nulle', 'signifierait qu’on connaît la valeur avec une certitude absolue'], ['Dispersion des mesures', 's = 0 g ici']],
    ver: 'Les cinq valeurs sont identiques parce que la balance arrondit à 0,1 g, pas parce que la masse est connue exactement : la résolution crée une incertitude d’au moins quelques centièmes de gramme.',
    q2: 'Quelle est la bonne conclusion ?',
    options: [
      V('La dispersion est nulle, mais l’incertitude ne l’est pas : la résolution de l’afficheur est une autre source d’incertitude', 'Les mesures répétées ne détectent pas ce qui est plus fin que la résolution.'),
      F('Il faut refaire plus de mesures jusqu’à ce que s ne soit plus nulle', 'Avec cette balance, les valeurs resteront identiques : la dispersion est cachée par l’arrondi.'),
      F('Le résultat est plausible : 5 valeurs identiques prouvent que la masse est exacte', 'Des valeurs identiques prouvent seulement que l’instrument ne voit pas de variation.'),
    ] }),

  // ── Distillation ──
  P({ id: 'teb-melange', domaine: 'Distillation', niveau: 1, titre: 'Température en tête de colonne', plausible: false,
    enonce: 'On distille un mélange eau–éthanol à la pression atmosphérique (1 013 hPa). Un élève relève en tête de colonne une température T = 112 °C.',
    reperes: [['Température d’ébullition de l’éthanol (1 013 hPa)', '78 °C'], ['Température d’ébullition de l’eau (1 013 hPa)', '100 °C'], ['Tête de colonne', 'on y mesure la température de la vapeur']],
    ver: 'À 1 013 hPa, un mélange eau–éthanol bout entre 78 °C et 100 °C ; la vapeur en tête ne peut pas dépasser 100 °C. 112 °C est hors de cet intervalle.',
    q2: 'Quelle cause est la plus probable ?',
    options: [
      V('Le thermomètre est mal placé (près du chauffe-ballon, hors des vapeurs) ou mal étalonné', 'La vapeur ne peut pas être aussi chaude : le problème vient de la mesure.'),
      F('Le mélange contient un composé qui bout à 112 °C', 'Le mélange ne contient que de l’eau et de l’éthanol.'),
      F('En chauffant plus fort, la température de la vapeur monte au-dessus de 100 °C', 'Chauffer plus fort augmente le débit de vapeur, pas sa température (palier d’ébullition).'),
    ] }),
  P({ id: 'rendement-dist', domaine: 'Distillation', niveau: 2, titre: 'Rendement d’une distillation', plausible: false,
    enonce: 'Un mélange de 100 mL contient 20 mL d’éthanol. Après distillation, un élève recueille 28 mL de distillat qu’il suppose être de l’éthanol pur et annonce un rendement η = 140 %.',
    reperes: [['Rendement', 'η = quantité obtenue / quantité maximale possible'], ['Éthanol présent au départ', '20 mL']],
    ver: 'On ne peut pas recueillir plus d’éthanol (20 mL) qu’il n’y en avait au départ : un rendement ne dépasse pas 100 %.',
    q2: 'Quelle explication est la plus probable ?',
    options: [
      V('Le distillat n’est pas de l’éthanol pur : il contient aussi de l’eau', 'Une distillation simple ne sépare pas totalement les deux liquides : les 28 mL contiennent de l’eau.'),
      F('De l’éthanol s’est formé pendant la distillation', 'La distillation sépare des constituants, elle n’en fabrique pas.'),
      F('Avec une colonne efficace, le rendement peut dépasser 100 %', 'Une colonne efficace permet de s’approcher de 100 %, jamais de le dépasser.'),
    ] }),

  // ── Évaporation et cristallisation ──
  P({ id: 'rendement-crist', domaine: 'Évaporation et cristallisation', niveau: 2, titre: 'Rendement d’une cristallisation', plausible: false,
    enonce: 'Une cristallisation devrait fournir au maximum 12,0 g de cristaux. Un élève pèse 12,6 g de cristaux et annonce un rendement η = 105 %.',
    reperes: [['Rendement', 'η = masse obtenue / masse maximale possible'], ['Cristaux à peine essorés', 'retiennent de la solution (eau) à leur surface']],
    ver: 'On ne peut pas obtenir plus de produit que la quantité maximale possible : η ≤ 100 %. Le résultat de 105 % signale un problème.',
    q2: 'Quelle explication est la plus probable ?',
    options: [
      V('Les cristaux n’ont pas été séchés : ils contiennent encore de l’eau et de la solution', 'La balance pèse aussi l’eau retenue : après séchage la masse diminue.'),
      F('Le rendement peut dépasser 100 % si on travaille bien', 'Un rendement ne dépasse jamais 100 % : le produit ne se crée pas.'),
      F('La balance mesure en kg', 'Cela ne donnerait pas un écart de 5 %.'),
    ] }),
  P({ id: 'cristaux', domaine: 'Évaporation et cristallisation', niveau: 3, titre: 'Masse de cristaux obtenue', plausible: false,
    enonce: 'Une solution saturée de nitrate de potassium à 60 °C contient 200 g d’eau. On la refroidit à 20 °C. Un élève annonce que l’on recueille 220 g de cristaux.',
    reperes: [['Solubilité du KNO₃ à 60 °C', '≈ 110 g pour 100 g d’eau'], ['Solubilité du KNO₃ à 20 °C', '≈ 32 g pour 100 g d’eau']],
    ver: 'À 60 °C, 200 g d’eau dissolvent 220 g de KNO₃ : en recueillir 220 g reviendrait à tout faire cristalliser. Or à 20 °C, 200 g d’eau en gardent encore ≈ 64 g en solution : il cristallise au plus 220 − 64 = 156 g.',
    q2: 'Quelle erreur explique le mieux ce résultat ?',
    options: [
      V('Il a confondu la masse de soluté dissous à 60 °C avec la masse de cristaux obtenue', 'Une partie du soluté (≈ 64 g) reste dissoute à 20 °C : seule la différence cristallise.'),
      F('La solubilité augmente quand on refroidit', 'Pour le KNO₃ c’est l’inverse (110 g → 32 g) : c’est pour cela que des cristaux apparaissent.'),
      F('Il faut ajouter la masse d’eau à celle du soluté', 'L’eau ne cristallise pas.'),
    ] }),
];

// ─────────────── 2. « Compatible avec la référence ? » ───────────────
// x : mesure { val, u } ; ref : { val, u? } ; ecart : valeur de l'écart dans l'unité « uEcart » ; uc : incertitude composée (niveau 3)
// seuil = 2·u (ou 2·u_c) dans l'unité de l'écart
export const COMPATIBLES = [
  { id: 'rho-eau', domaine: 'Transport des fluides', niveau: 1, titre: 'Masse volumique de l’eau',
    contexte: 'Un élève mesure la masse volumique de l’eau à 20 °C en pesant un volume connu. Il trouve ρ = 1 003 kg·m⁻³ avec une incertitude-type u = 4 kg·m⁻³. La valeur de référence est ρ_ref = 998 kg·m⁻³.',
    reperes: [['Mesure', 'x = 1 003 kg·m⁻³'], ['Incertitude-type', 'u = 4 kg·m⁻³'], ['Référence', 'x_ref = 998 kg·m⁻³'], ['Règle', 'compatible si |x − x_ref| ≤ 2·u']],
    ecart: 5, uEcart: 'kg·m⁻³', seuil: 8, compatible: true,
    expl: '|1 003 − 998| = 5 kg·m⁻³ et 2·u = 8 kg·m⁻³. Comme 5 ≤ 8, la mesure est compatible avec la référence.',
    q4: 'Que peut-on conclure ?',
    options: [
      V('La mesure est compatible avec la référence : l’écart est inférieur à 2·u, il s’explique par l’incertitude', 'Aucune raison de chercher une erreur : l’écart est de l’ordre de l’incertitude.'),
      F('La mesure est exacte puisqu’elle tombe sur la référence', 'Elle ne « tombe » pas dessus (5 kg·m⁻³ d’écart) : compatible ne veut pas dire identique.'),
      F('La mesure est fausse puisqu’elle est différente de la référence', 'Un écart non nul est normal. Ce qui compte, c’est de le comparer à l’incertitude.'),
    ] },
  { id: 'c-eau', domaine: 'Transferts thermiques', niveau: 1, titre: 'Capacité thermique massique de l’eau',
    contexte: 'Avec un calorimètre, un élève détermine la capacité thermique massique de l’eau : c = 4 650 J·kg⁻¹·K⁻¹, avec u = 150 J·kg⁻¹·K⁻¹. La valeur de référence est c_ref = 4 180 J·kg⁻¹·K⁻¹.',
    reperes: [['Mesure', 'x = 4 650 J·kg⁻¹·K⁻¹'], ['Incertitude-type', 'u = 150 J·kg⁻¹·K⁻¹'], ['Référence', 'x_ref = 4 180 J·kg⁻¹·K⁻¹'], ['Règle', 'compatible si |x − x_ref| ≤ 2·u'], ['Formule utilisée', 'c = Q / (m·ΔT)']],
    ecart: 470, uEcart: 'J·kg⁻¹·K⁻¹', seuil: 300, compatible: false,
    expl: '|4 650 − 4 180| = 470 et 2·u = 300. Comme 470 > 300, la mesure n’est pas compatible avec la référence (écart de 11 %).',
    q4: 'Quelle source d’erreur systématique est la plus probable ?',
    options: [
      V('Des pertes thermiques vers l’extérieur : l’eau chauffe moins que prévu (ΔT trop petit), donc c = Q / (m·ΔT) est trop grand', 'Le sens de l’écart (mesure supérieure à la référence) est cohérent avec cette explication.'),
      F('La résolution du thermomètre est trop faible', 'Une résolution limitée donne une dispersion aléatoire, déjà prise en compte dans u : elle n’explique pas un écart de 11 %.'),
      F('L’eau n’était pas exactement à 20 °C', 'c varie de moins de 1 % entre 15 et 25 °C.'),
    ] },
  { id: 'teb-ethanol', domaine: 'Distillation', niveau: 2, titre: 'Température d’ébullition de l’éthanol',
    contexte: 'Un élève mesure la température d’ébullition de l’éthanol : θ = 77,2 °C avec u = 0,5 °C. La référence à 1 013 hPa est 78,4 °C. Le jour de la mesure, la pression atmosphérique était de 970 hPa.',
    reperes: [['Mesure', 'x = 77,2 °C'], ['Incertitude-type', 'u = 0,5 °C'], ['Référence (1 013 hPa)', 'x_ref = 78,4 °C'], ['Règle', 'compatible si |x − x_ref| ≤ 2·u'], ['Effet de la pression', 'une pression plus basse fait bouillir plus tôt']],
    ecart: 1.2, uEcart: '°C', seuil: 1.0, compatible: false,
    expl: '|77,2 − 78,4| = 1,2 °C et 2·u = 1,0 °C. Comme 1,2 > 1,0, la mesure n’est pas compatible avec la référence.',
    q4: 'Quelle explication est la plus cohérente avec les données ?',
    options: [
      V('La pression (970 hPa) était inférieure à 1 013 hPa : l’éthanol bout un peu plus tôt, ce qui explique une mesure plus basse', 'Le sens de l’écart (mesure inférieure à la référence) et la pression plus basse vont ensemble : la référence ne s’applique pas telle quelle.'),
      F('L’incertitude u = 0,5 °C est trop grande', 'Elle est déjà dans le test ; elle ne permet pas d’expliquer le sens de l’écart.'),
      F('L’éthanol utilisé contenait de l’eau', 'L’eau ferait monter la température d’ébullition (vers 100 °C), pas la baisser.'),
    ] },
  { id: 'tension-can', domaine: 'Transmission de signaux numériques', niveau: 2, titre: 'Tension lue par un CAN',
    contexte: 'Un CAN numérise une tension que l’on mesure aussi avec un voltmètre étalon. Le CAN donne U = 2,507 V avec u = 0,004 V. Le voltmètre étalon indique U_ref = 2,500 V.',
    reperes: [['Mesure du CAN', 'x = 2,507 V'], ['Incertitude-type', 'u = 0,004 V = 4 mV'], ['Référence', 'x_ref = 2,500 V'], ['Règle', 'compatible si |x − x_ref| ≤ 2·u']],
    ecart: 7, uEcart: 'mV', seuil: 8, compatible: true,
    expl: '|2,507 − 2,500| = 0,007 V = 7 mV et 2·u = 8 mV. Comme 7 ≤ 8, la mesure est compatible avec la référence, mais de justesse.',
    q4: 'Que peut-on conclure ?',
    options: [
      V('Compatible, mais l’écart est proche de la limite : on peut répéter la mesure pour réduire u et en être plus sûr', 'Un écart proche de 2·u incite à la prudence : plusieurs mesures permettent de réduire l’incertitude.'),
      F('Le CAN est parfaitement réglé : l’écart est nul', 'L’écart est de 7 mV : non nul, simplement du même ordre que l’incertitude.'),
      F('Le CAN est défectueux car il diffère du voltmètre', 'Un écart inférieur à 2·u n’est pas anormal.'),
    ] },
  { id: 'tr-modele', domaine: 'Régulation', niveau: 2, titre: 'Modèle et expérience : temps de réponse',
    contexte: 'Le modèle du 1er ordre (τ = 40 s) prévoit un temps de réponse à 5 % de 3τ = 120 s. L’expérience donne t_r5% = 118 s avec u = 6 s.',
    reperes: [['Mesure', 'x = 118 s'], ['Incertitude-type', 'u = 6 s'], ['Prévision du modèle', 'x_ref = 120 s'], ['Règle', 'compatible si |x − x_ref| ≤ 2·u']],
    ecart: 2, uEcart: 's', seuil: 12, compatible: true,
    expl: '|118 − 120| = 2 s et 2·u = 12 s. Comme 2 ≤ 12, l’expérience est compatible avec le modèle.',
    q4: 'Que peut-on conclure sur le modèle ?',
    options: [
      V('Le modèle n’est pas contredit par l’expérience ; cela ne prouve pas pour autant qu’il est exact', 'Un test de compatibilité peut réfuter un modèle, mais une compatibilité ne le démontre pas définitivement.'),
      F('Le modèle est démontré exact', 'Une seule mesure compatible ne démontre rien de définitif.'),
      F('Le modèle est faux, car 118 s ≠ 120 s', 'Un écart de 2 s est très inférieur à l’incertitude (2·u = 12 s).'),
    ] },
  { id: 'debit-2methodes', domaine: 'Transport des fluides', niveau: 3, titre: 'Deux mesures de débit',
    contexte: 'On mesure un débit de deux façons. Débitmètre : Q₁ = 7,2 m³·h⁻¹ avec u₁ = 0,3 m³·h⁻¹. Jaugeage (volume recueilli / durée) : Q₂ = 6,6 m³·h⁻¹ avec u₂ = 0,2 m³·h⁻¹. Les deux mesures ont chacune une incertitude : on les compare avec l’incertitude composée.',
    reperes: [['Mesure 1', 'Q₁ = 7,2 ± 0,3 m³·h⁻¹'], ['Mesure 2', 'Q₂ = 6,6 ± 0,2 m³·h⁻¹'], ['Incertitude composée', 'u_c = √(u₁² + u₂²)'], ['Règle', 'compatibles si |Q₁ − Q₂| ≤ 2·u_c']],
    ecart: 0.6, uEcart: 'm³·h⁻¹', uc: 0.36, seuil: 0.72, compatible: true,
    expl: '|7,2 − 6,6| = 0,6 m³·h⁻¹. u_c = √(0,3² + 0,2²) = √0,13 ≈ 0,36 m³·h⁻¹, donc 2·u_c ≈ 0,72. Comme 0,6 ≤ 0,72, les deux mesures sont compatibles.',
    q4: 'Que peut-on conclure ?',
    options: [
      V('Les deux mesures sont compatibles : rien ne permet de dire que l’une des deux méthodes est défaillante', 'L’écart de 0,6 reste inférieur à 2·u_c ≈ 0,72.'),
      F('Les mesures sont incompatibles, car l’écart (0,6) dépasse 2·u₂ = 0,4', 'Quand deux mesures sont incertaines, on utilise l’incertitude composée u_c (plus grande que u₁ et que u₂), pas une seule des deux.'),
      F('Les deux mesures sont identiques à l’incertitude près, donc le vrai débit vaut 6,9 m³·h⁻¹', 'La compatibilité n’autorise pas à choisir une valeur « vraie » : elle dit seulement qu’il n’y a pas de contradiction.'),
    ] },
  { id: 'energie-chauffage', domaine: 'Transferts thermiques', niveau: 3, titre: 'Énergie fournie et énergie reçue',
    contexte: 'On chauffe 2,0 kg d’eau de 20 °C à 80 °C avec une résistance. L’énergie reçue par l’eau, calculée par m·c·ΔT, est Q = 502 kJ avec u₁ = 8 kJ. Un wattmètre mesure l’énergie électrique fournie : E = 540 kJ avec u₂ = 12 kJ.',
    reperes: [['Énergie reçue par l’eau', 'Q = 502 ± 8 kJ'], ['Énergie électrique fournie', 'E = 540 ± 12 kJ'], ['Incertitude composée', 'u_c = √(u₁² + u₂²)'], ['Règle', 'compatibles si |E − Q| ≤ 2·u_c']],
    ecart: 38, uEcart: 'kJ', uc: 14.4, seuil: 28.8, compatible: false,
    expl: '|540 − 502| = 38 kJ. u_c = √(8² + 12²) = √208 ≈ 14,4 kJ, donc 2·u_c ≈ 28,8 kJ. Comme 38 > 28,8, les deux valeurs ne sont pas compatibles.',
    q4: 'Quelle explication est la plus cohérente ?',
    options: [
      V('Une partie de l’énergie électrique est perdue (récipient, air ambiant) : E est supérieure à Q, comme on s’y attend', 'Le sens de l’écart (E > Q) est physiquement cohérent : l’énergie fournie est toujours au moins égale à l’énergie reçue.'),
      F('L’eau a reçu plus d’énergie que la résistance n’en a fournie', 'Ce serait impossible : cela violerait la conservation de l’énergie.'),
      F('Le wattmètre est forcément défectueux', 'Rien ne le prouve : une perte thermique suffit à expliquer l’écart.'),
    ] },
  { id: 'volume-pipette', domaine: 'Mesure et incertitudes', niveau: 1, titre: 'Volume d’une pipette jaugée',
    contexte: 'Un élève vérifie une pipette jaugée de 20,00 mL en pesant l’eau délivrée. Il trouve V = 19,96 mL avec une incertitude-type u = 0,03 mL.',
    reperes: [['Mesure', 'x = 19,96 mL'], ['Incertitude-type', 'u = 0,03 mL'], ['Référence', 'x_ref = 20,00 mL'], ['Règle', 'compatible si |x − x_ref| ≤ 2·u']],
    ecart: 0.04, uEcart: 'mL', seuil: 0.06, compatible: true,
    expl: '|19,96 − 20,00| = 0,04 mL et 2·u = 0,06 mL. Comme 0,04 ≤ 0,06, la mesure est compatible avec le volume annoncé.',
    q4: 'Que peut-on conclure ?',
    options: [
      V('La pipette est compatible avec son volume annoncé : l’écart s’explique par l’incertitude', 'Rien ne permet de dire que la pipette est défectueuse.'),
      F('La pipette est fausse puisque 19,96 mL ≠ 20,00 mL', 'Un écart non nul est normal : il faut le comparer à l’incertitude.'),
      F('La pipette délivre exactement 20,00 mL', 'Compatible ne veut pas dire identique : on ne peut pas démontrer l’égalité.'),
    ] },
  { id: 'etalonnage-ph', domaine: 'Mesure et incertitudes', niveau: 2, titre: 'pH-mètre dans une solution tampon',
    contexte: 'Un pH-mètre plongé dans une solution tampon de pH 7,00 indique pH = 7,18, avec une incertitude-type u = 0,05.',
    reperes: [['Mesure', 'x = 7,18'], ['Incertitude-type', 'u = 0,05'], ['Référence (tampon)', 'x_ref = 7,00'], ['Règle', 'compatible si |x − x_ref| ≤ 2·u']],
    ecart: 0.18, uEcart: '', seuil: 0.10, compatible: false,
    expl: '|7,18 − 7,00| = 0,18 et 2·u = 0,10. Comme 0,18 > 0,10, la mesure n’est pas compatible avec la référence : l’appareil est mal réglé.',
    q4: 'Que faut-il faire ?',
    options: [
      V('Réétalonner le pH-mètre : l’écart est un décalage systématique, pas un effet du hasard', 'L’écart dépasse nettement l’incertitude : répéter la mesure ne le ferait pas disparaître.'),
      F('Répéter la mesure et prendre la moyenne : l’écart finira par disparaître', 'Une moyenne réduit le hasard, pas un décalage systématique.'),
      F('Augmenter u pour que la mesure devienne compatible', 'On ne choisit pas u pour obtenir le verdict voulu : u doit être estimée honnêtement.'),
    ] },
  { id: 'deux-series', domaine: 'Mesure et incertitudes', niveau: 3, titre: 'Deux séries de mesures du même volume',
    contexte: 'Deux élèves dosent la même solution. Série 1 : V₁ = 12,50 mL avec u₁ = 0,10 mL. Série 2 : V₂ = 12,80 mL avec u₂ = 0,12 mL. Les deux mesures ont chacune une incertitude : on les compare avec l’incertitude composée.',
    reperes: [['Série 1', 'V₁ = 12,50 ± 0,10 mL'], ['Série 2', 'V₂ = 12,80 ± 0,12 mL'], ['Incertitude composée', 'u_c = √(u₁² + u₂²)'], ['Règle', 'compatibles si |V₁ − V₂| ≤ 2·u_c']],
    ecart: 0.3, uEcart: 'mL', uc: 0.156, seuil: 0.312, compatible: true,
    expl: '|12,50 − 12,80| = 0,30 mL. u_c = √(0,10² + 0,12²) = √0,0244 ≈ 0,156 mL, donc 2·u_c ≈ 0,31 mL. Comme 0,30 ≤ 0,31, les deux séries sont compatibles, mais de justesse.',
    q4: 'Que peut-on conclure ?',
    options: [
      V('Les séries sont compatibles, mais de justesse : il serait prudent de refaire quelques mesures', 'L’écart est presque égal à 2·u_c : la conclusion est fragile.'),
      F('Les séries sont incompatibles car 0,30 > 2×0,10 = 0,20', 'On compare à l’incertitude composée u_c, plus grande que u₁ : 2·u_c ≈ 0,31.'),
      F('Les séries sont identiques, donc le volume vrai vaut 12,65 mL', 'La compatibilité ne permet pas de choisir une valeur « vraie ».'),
    ] },
];

export const FAMILLES = [
  { id: 'plausible', titre: 'Ça paraît plausible ?', liste: PLAUSIBLES,
    aide: 'Un élève a obtenu un résultat. À toi de juger s’il est vraisemblable en le comparant aux repères donnés. Tu n’as rien à savoir par cœur : tout est à l’écran.' },
  { id: 'compat', titre: 'Compatible avec la référence ?', liste: COMPATIBLES,
    aide: 'Une mesure est comparée à une valeur de référence ou à un modèle. À toi de décider si l’écart est dû aux incertitudes ou s’il faut chercher une erreur. La règle est rappelée à chaque exercice.' },
];
