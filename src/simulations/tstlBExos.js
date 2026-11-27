// Exercices ANA (prévoir sans calculer, choisir la relation) et VAL (« ça paraît plausible ? ») créés pour combler les trous de six chapitres de TSTL (SPCL) :
// régulation, contrôle des systèmes, transferts thermiques, évaporation et cristallisation, distillation, « Des ondes pour observer » (résolution).
// Branchés dans AtelierAnalyserBanque.js (PREVOIR, RELATIONS) et AtelierValiderBanque.js (PLAUSIBLES). Chaque exercice vise UNE capacité exigible du programme de TSTL
// (voir src/sousThemes.tstl-b.js) ; les nombres sont recalculés par src/simulations/tstlBExos.test.mjs.

import { presenter } from './presenter.js';

const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = (o) => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

// ───────────────────────────── ANA : prévoir sans calculer ─────────────────────────────
export const TSTLB_ANA = [
  // ── Régulation ──
  { id: 'reg-prev-grandeurs', domaine: 'Régulation', titre: 'Réglée, réglante, perturbatrice',
    ...presenter({ contexte: 'Un échangeur chauffe de l’eau avec de la vapeur. Un régulateur maintient la température de l’eau à la sortie en commandant l’ouverture d’une vanne placée sur l’arrivée de vapeur. Le débit d’eau à chauffer change selon les besoins de l’atelier.', liste: [['Capteur', 'sonde de température placée à la sortie de l’eau'], ['Actionneur', 'vanne motorisée sur la vapeur'], ['Consigne', '60 °C']] }),
    q: 'Quelle association est correcte ?', options: [
      V('réglée : température de sortie ; réglante : débit de vapeur ; perturbatrice : débit d’eau', 'La grandeur réglée est celle que l’on veut maintenir (la température de sortie). La grandeur réglante est celle sur laquelle agit l’actionneur (le débit de vapeur, par la vanne). Le débit d’eau change sans que le régulateur le commande : c’est une perturbation.'),
      F('réglée : débit de vapeur ; réglante : température de sortie ; perturbatrice : débit d’eau', 'Les deux rôles sont inversés : la température est le résultat que l’on veut contrôler, le débit de vapeur est le moyen d’action.'),
      F('réglée : température de sortie ; réglante : débit d’eau ; perturbatrice : débit de vapeur', 'Le régulateur n’agit pas sur le débit d’eau (imposé par l’atelier) : il agit sur la vapeur. Le débit d’eau est donc la perturbation, et le débit de vapeur la grandeur réglante.'),
      F('réglée : débit d’eau ; réglante : débit de vapeur ; perturbatrice : température de sortie', 'On ne cherche pas à maintenir le débit d’eau, mais la température de sortie. Et la température de sortie n’est pas une perturbation venue de l’extérieur : c’est la grandeur contrôlée.'),
    ] },
  { id: 'reg-prev-boucle-comparateur', domaine: 'Régulation', titre: 'Lire le schéma d’une boucle de régulation',
    ...presenter({ contexte: 'Le schéma représente une boucle de régulation. Ses cinq éléments sont repérés par les lettres A à E ; le sens des flèches indique le sens de circulation de l’information ou de l’énergie.', schema: { type: 'boucleRegul' } }),
    q: 'Quel élément calcule l’écart entre la consigne et la mesure ?', options: [
      V('l’élément A', 'A reçoit la consigne (signe +) et la mesure renvoyée par le capteur (signe −) : sa sortie est l’écart « consigne − mesure ».'),
      F('l’élément B', 'B reçoit l’écart calculé par A et en déduit la commande : c’est le régulateur. Il ne calcule pas l’écart lui-même.'),
      F('l’élément C', 'C reçoit la commande du régulateur et agit sur le procédé (vanne, résistance chauffante…) : c’est l’actionneur. Il ne compare rien.'),
      F('l’élément E', 'E est sur la voie de retour : il mesure la grandeur réglée et transmet la mesure à A. C’est le capteur, qui ne connaît pas la consigne.'),
    ] },
  { id: 'reg-prev-boucle-capteur', domaine: 'Régulation', titre: 'Un capteur qui se dérègle',
    ...presenter({ contexte: 'La boucle du schéma régule la température d’un four. Le régulateur comporte une action intégrale : en régime permanent, il annule l’écart entre la consigne et la mesure. L’élément E se dérègle : il indique toujours 2 °C de moins que la température réelle du four. La consigne est de 80 °C et la boucle reste stable.', schema: { type: 'boucleRegul' } }),
    q: 'En régime permanent, la température réelle du four est…', options: [
      V('82 °C', 'La boucle ne connaît que la mesure : elle ajuste la puissance jusqu’à ce que la mesure vaille 80 °C. Comme le capteur indique 2 °C de moins que la réalité, le four est à 82 °C.'),
      F('80 °C', 'Ce serait vrai si le capteur était juste. Ici l’écart annulé par le régulateur est « consigne − mesure », et la mesure est fausse de 2 °C.'),
      F('78 °C', 'Sens de l’erreur inversé : le capteur indique moins que la réalité, donc le four est plus chaud que la mesure, pas plus froid.'),
      F('instable, sans valeur fixe', 'Un capteur décalé d’une valeur constante ne rend pas la boucle instable : il déplace seulement la valeur d’équilibre.'),
    ] },
  { id: 'reg-prev-point-fonct', domaine: 'Régulation', titre: 'Le point de fonctionnement se déplace',
    ...presenter({ contexte: 'Un four est régulé par un régulateur proportionnel seul : Y = K_p × (consigne − θ), avec Y en % de la puissance maximale. Sa caractéristique statique (température atteinte en régime permanent pour une commande Y donnée) est θ = θ_ext + 1,0 K·%⁻¹ × Y (Y en %).', liste: [['Consigne', '80 °C'], ['Gain du régulateur', 'K_p = 10 %·K⁻¹'], ['Température du local', 'passe de 20 °C à 0 °C']], suite: 'Après cette baisse, le régime permanent est atteint (boucle stable). On le compare au régime permanent précédent.' }),
    q: 'La commande Y et l’écart statique (consigne − θ) ont…', options: [
      V('augmenté tous les deux', 'Avant : θ = 20 + Y et Y = 10 × (80 − θ) donnent Y ≈ 54,5 % et θ ≈ 74,5 °C, soit un écart d’environ 5,5 K. Après : θ = Y et Y = 10 × (80 − θ) donnent Y ≈ 72,7 % et θ ≈ 72,7 °C, soit un écart d’environ 7,3 K. Le four perd plus de chaleur, il faut plus de commande, et avec un régulateur P il n’y en a pas sans un écart plus grand.'),
      F('ne pas changé du tout', 'Ce serait le cas avec une action intégrale. Avec un régulateur proportionnel seul, la perturbation (le froid) déplace la caractéristique du four et donc le point de fonctionnement.'),
      F('augmenté pour Y, pas pour l’écart', 'Avec un régulateur P, Y = K_p × écart et K_p est fixé : si Y augmente (ici de 54,5 % à 72,7 %), l’écart augmente dans la même proportion.'),
      F('inchangé pour Y, accru pour l’écart', 'Y et l’écart sont proportionnels (Y = K_p × écart) : l’un ne peut pas rester fixe pendant que l’autre varie. Ici les deux augmentent.'),
    ] },
  { id: 'reg-prev-tor-continue', domaine: 'Régulation', titre: 'Tout ou rien ou régulation continue ?',
    ...presenter({ contexte: 'Un même four est régulé d’abord par un thermostat tout ou rien (deux seuils de part et d’autre de 80 °C), puis par un régulateur PI correctement réglé (boucle stable). Les perturbations sont constantes ; on regarde l’enregistrement de la température une fois le régime établi.' }),
    q: 'On observe, sur l’enregistrement…', options: [
      V('des oscillations permanentes avec le TOR, une valeur constante avec le PI', 'Un régulateur TOR commute la puissance entre deux valeurs : la température monte jusqu’au seuil haut, puis redescend jusqu’au seuil bas, et ainsi de suite. Un PI bien réglé ajuste la puissance de façon continue et la température se fixe, sans écart.'),
      F('une valeur constante avec le TOR, des oscillations permanentes avec le PI', 'C’est l’inverse : le TOR provoque une oscillation entre ses deux seuils, alors qu’un PI bien réglé stabilise la température.'),
      F('des oscillations permanentes, de même amplitude, avec les deux régulateurs', 'Un PI correctement réglé ne fait pas osciller la température en régime établi : il ajuste la commande en continu.'),
      F('une valeur constante, exactement égale à la consigne, avec les deux régulateurs', 'Un TOR ne peut pas maintenir une valeur fixe : sa commande ne prend que deux valeurs, et la température passe d’un seuil à l’autre.'),
    ] },
  { id: 'reg-prev-criteres', domaine: 'Régulation', titre: 'Précision, rapidité, stabilité : lequel se dégrade ?',
    ...presenter({ contexte: 'On applique un échelon de consigne de 50 °C à 60 °C à un four régulé en proportionnel, avec deux réglages du gain. On relève, pour chacun, les trois critères de performance de la boucle.', liste: [['Réglage 1 (gain faible)', 'écart statique 1,8 K ; temps de réponse à 5 % : 40 s ; valeur maximale atteinte : 58,2 °C'], ['Réglage 2 (gain élevé)', 'écart statique 0,3 K ; temps de réponse à 5 % : 25 s ; valeur maximale atteinte : 60,9 °C']] }),
    q: 'En passant du réglage 1 au réglage 2, quel critère se dégrade ?', options: [
      V('la stabilité : un dépassement apparaît', 'Avec le réglage 1, la mesure monte jusqu’à 58,2 °C sans dépasser sa valeur finale. Avec le réglage 2, elle atteint 60,9 °C avant de redescendre vers 59,7 °C : un dépassement de 1,2 K apparaît, la boucle est moins stable. La précision (1,8 K puis 0,3 K) et la rapidité (40 s puis 25 s) sont meilleures.'),
      F('la précision : l’écart statique augmente', 'C’est l’inverse : l’écart statique passe de 1,8 K à 0,3 K, la boucle est plus précise.'),
      F('la rapidité : le temps de réponse à 5 % augmente', 'Le temps de réponse à 5 % passe de 40 s à 25 s : la boucle est plus rapide.'),
      F('aucun critère ne se dégrade, tout s’améliore', 'La précision et la rapidité s’améliorent, mais un gain élevé a un prix : la mesure dépasse maintenant sa valeur finale (60,9 °C), ce qui dégrade la stabilité.'),
    ] },
  { id: 'reg-prev-pi-ecart', domaine: 'Régulation', titre: 'Ajouter une action intégrale',
    ...presenter({ contexte: 'Un four régulé par un régulateur proportionnel seul garde, en régime permanent, un écart statique de 2,0 K sous la consigne. On ajoute au régulateur une action intégrale (régulateur PI), sans changer le gain proportionnel. Les perturbations restent constantes et la boucle reste stable.' }),
    q: 'En régime permanent, avec le régulateur PI, l’écart statique est…', options: [
      V('nul', 'Le terme intégral continue de modifier la commande tant que l’écart n’est pas nul. En régime permanent, la commande est constante : l’écart est donc nul (si la commande n’est pas saturée).'),
      F('inférieur à 2,0 K mais non nul', 'L’action intégrale ne réduit pas l’écart « un peu » : elle l’annule, car elle agit tant qu’il en reste.'),
      F('égal à 2,0 K, comme avec le régulateur P', 'Avec le P seul, la commande est proportionnelle à l’écart, donc non nulle seulement s’il reste un écart. L’intégrale fournit cette commande sans écart.'),
      F('supérieur à 2,0 K, à cause du retard introduit', 'L’action intégrale ralentit la réponse et peut diminuer la stabilité, mais elle ne dégrade pas la précision en régime permanent.'),
    ] },

  // ── Contrôle des systèmes ──
  { id: 'ctl-prev-necessite-incubateur', domaine: 'Contrôle des systèmes', titre: 'Pourquoi réguler un incubateur ?',
    ...presenter({ contexte: 'Un incubateur de laboratoire doit maintenir des cultures à 37,0 °C ± 0,5 °C. Un essai sans régulation (chauffage à puissance fixe) donne les relevés ci-dessous.', liste: [['Local à 18 °C', 'température de l’incubateur : 34 °C'], ['Local à 24 °C', 'température de l’incubateur : 40 °C'], ['Tolérance de l’utilisateur', '37,0 °C ± 0,5 °C']] }),
    q: 'Que montre ce document sur l’intérêt d’une régulation ?', options: [
      V('La température suit celle du local : la tolérance n’est pas tenue', 'Quand le local gagne 6 °C, l’incubateur gagne 6 °C aussi, bien au-delà des ± 0,5 °C permis. Une boucle de régulation mesure la température et ajuste la puissance pour compenser ces variations.'),
      F('La température ne dépend pas du local : une régulation serait inutile', 'Les relevés montrent le contraire : 34 °C avec un local à 18 °C, 40 °C avec un local à 24 °C.'),
      F('Le chauffage est trop faible : une résistance plus puissante suffirait à régler le problème', 'Plus de puissance relèverait toutes les températures, mais l’incubateur suivrait encore les variations du local : le problème de dépendance reste entier.'),
      F('L’intérêt du contrôle serait seulement de consommer moins d’électricité', 'Le document porte sur la précision de la température, pas sur la consommation. Un contrôle peut aussi économiser de l’énergie, mais ce n’est pas ce que montrent ces relevés.'),
    ] },
  { id: 'ctl-prev-necessite-reacteur', domaine: 'Contrôle des systèmes', titre: 'Pourquoi automatiser le refroidissement d’un réacteur ?',
    ...presenter({ contexte: 'Dans un réacteur de laboratoire, une réaction exothermique fait monter la température de 15 °C en 5 minutes si le refroidissement n’est pas ajusté. Au-delà de 80 °C, une réaction parasite dangereuse s’amorce. Un opérateur vérifie la température toutes les 30 minutes et règle à la main le débit d’eau de refroidissement.' }),
    q: 'Quel argument justifie le mieux un contrôle automatique de la température ?', options: [
      V('Il mesure et corrige en quelques secondes, bien avant 30 min', 'La température peut monter de 15 °C en 5 minutes : un contrôle manuel toutes les 30 minutes peut laisser passer la limite de 80 °C. Un système automatique mesure en continu et réagit tout de suite.'),
      F('Il permet de supprimer l’eau de refroidissement dans le montage du réacteur', 'Le refroidissement reste indispensable pour évacuer la chaleur : le contrôle automatique ajuste le débit d’eau, il ne le supprime pas.'),
      F('Il diminue l’énergie libérée par la réaction exothermique', 'La régulation ne change pas l’énergie dégagée par la réaction : elle agit seulement sur l’évacuation de la chaleur.'),
      F('Il permet de travailler au-dessus de 80 °C sans danger', 'La limite de 80 °C vient de la réaction parasite, pas de l’opérateur : un automate n’y change rien, il aide justement à ne pas la dépasser.'),
    ] },
  { id: 'ctl-prev-sources-champ', domaine: 'Contrôle des systèmes', titre: 'Qui crée un champ magnétique ?',
    ...presenter({ contexte: 'Une petite boussole est approchée, l’un après l’autre, de quatre objets placés à quelques centimètres d’elle. On rappelle que les aimants et les courants électriques sont des sources de champ magnétique (la Terre aussi, par son champ magnétique propre).' }),
    q: 'Lequel de ces objets ne crée aucun champ magnétique ?', options: [
      V('une pièce de cuivre posée sur la table, hors circuit', 'Le cuivre n’est pas aimanté et aucun courant ne le traverse : il ne crée pas de champ magnétique (l’aiguille ne dévie pas).'),
      F('une bobine de 500 spires parcourue par un courant de 20 mA', 'Tout courant électrique crée un champ magnétique, et les spires de la bobine additionnent leurs effets : la boussole dévie.'),
      F('un aimant en néodyme, de la taille d’une pièce de monnaie', 'Un aimant est une source de champ magnétique, même petit : le champ à quelques centimètres est bien supérieur à celui de la Terre.'),
      F('un fil de cuivre parcouru par un courant continu de 2 A', 'Un fil parcouru par un courant crée un champ magnétique autour de lui (expérience d’Œrsted) : la boussole dévie.'),
    ] },
  { id: 'ctl-prev-pas-principe', domaine: 'Contrôle des systèmes', titre: 'Principe du moteur pas à pas',
    ...presenter({ contexte: 'Un moteur pas à pas simplifié a un rotor formé d’un aimant permanent, entouré de quatre bobines fixes, placées à 90° les unes des autres. Une seule bobine est alimentée à la fois ; elle crée un champ magnétique dirigé vers le centre du moteur. On alimente la bobine 1, puis la bobine 2 (voisine, à 90°).' }),
    q: 'Qu’est-ce qui fait tourner le rotor d’un quart de tour ?', options: [
      V('le champ change de direction : le rotor aimanté s’aligne sur lui', 'Chaque bobine alimentée crée un champ dans sa propre direction. L’aimant du rotor s’oriente sur le champ présent : changer de bobine fait tourner le champ, donc le rotor. Chaque changement correspond à un pas.'),
      F('le champ de la bobine 2 est plus intense que celui de la bobine 1', 'Les deux bobines sont identiques et alimentées de la même façon : l’intensité du champ ne change pas. C’est sa direction qui change.'),
      F('les bobines tournent autour du rotor, qui est entraîné avec elles', 'Les bobines sont fixes (c’est le stator). Seul le rotor tourne, et il le fait parce que son aimant s’oriente dans le champ.'),
      F('le courant électrique passe de la bobine 1 à la bobine 2 par le rotor', 'Chaque bobine a son propre circuit : aucun courant ne passe par le rotor, qui est un aimant. C’est le champ magnétique qui agit sur lui, à distance.'),
    ] },

  // ── Transferts thermiques et machines thermiques ──
  { id: 'therm-prev-modes', domaine: 'Transferts thermiques', titre: 'Un thermos : quels transferts reste-t-il ?',
    ...presenter({ contexte: 'Un thermos est formé de deux parois de verre séparées par du vide. Les faces des parois tournées vers le vide sont recouvertes d’une couche d’argent qui réfléchit le rayonnement infrarouge.' }),
    q: 'Le vide entre les deux parois supprime…', options: [
      V('la conduction et la convection, pas le rayonnement', 'La conduction et la convection ont besoin d’une matière pour transporter la chaleur. Le rayonnement, lui, se propage dans le vide : c’est pourquoi on réfléchit le rayonnement avec une couche d’argent.'),
      F('la conduction, la convection et le rayonnement', 'Le rayonnement traverse le vide (c’est ainsi que la chaleur du Soleil nous parvient) : le vide seul ne le supprime pas.'),
      F('seulement le rayonnement, grâce à la couche d’argent', 'Le vide supprime justement la conduction et la convection ; l’argent ne fait que réduire le rayonnement, sans le supprimer.'),
      F('seulement la convection, la conduction restant possible', 'Sans matière entre les parois, la conduction est supprimée aussi : elle ne subsiste que par le goulot de verre.'),
    ] },
  { id: 'therm-prev-contre-courant', domaine: 'Transferts thermiques', titre: 'Co-courant ou contre-courant ?',
    ...presenter({ contexte: 'Dans un échangeur tubulaire, de l’eau chaude (qui entre à 80 °C) cède de la chaleur à de l’eau froide (qui entre à 15 °C). Les deux fluides ont même capacité thermique, l’échangeur est long et les pertes sont négligées.' }),
    q: 'Pour que l’eau froide puisse sortir plus chaude que l’eau chaude, il faut…', options: [
      V('un montage à contre-courant, avec un échangeur assez long', 'À contre-courant, l’eau froide qui sort rencontre l’eau chaude qui entre : elle peut se réchauffer jusqu’à une température proche de 80 °C, supérieure à celle de l’eau chaude à la sortie. Le second principe n’est pas violé : en chaque point, le fluide chaud est plus chaud que le fluide froid voisin.'),
      F('un montage à co-courant, avec un échangeur plus long', 'À co-courant, les deux fluides se rapprochent d’une température commune, que l’eau froide n’atteint jamais en la dépassant : sa sortie reste inférieure ou égale à celle de l’eau chaude, même avec un échangeur très long.'),
      F('un débit d’eau froide plus faible, quel que soit le montage', 'Le débit change les températures atteintes, mais à co-courant l’eau froide ne peut jamais sortir plus chaude que l’eau chaude, quels que soient les débits.'),
      F('rien : le second principe l’interdit dans tous les montages', 'Le second principe interdit un transfert spontané du froid vers le chaud en un point donné, pas la comparaison des températures de sortie : à contre-courant, ce résultat est possible.'),
    ] },
  { id: 'therm-prev-cop-temperature', domaine: 'Machines thermiques', titre: 'Une pompe à chaleur par grand froid',
    ...presenter({ contexte: 'Une pompe à chaleur air–eau chauffe une maison avec une eau de chauffage à 35 °C. Elle prélève de la chaleur à l’air extérieur. En hiver, la température de l’air extérieur passe de 7 °C à −5 °C ; le circuit de chauffage reste à 35 °C.' }),
    q: 'Le coefficient de performance (COP) de la pompe à chaleur devient…', options: [
      V('plus faible : l’écart entre les deux sources augmente', 'Plus l’air extérieur est froid, plus la machine doit « remonter » la chaleur sur un grand écart de température : le compresseur consomme davantage pour une même chaleur fournie, donc le COP diminue. C’est une limite d’utilisation des pompes à chaleur.'),
      F('plus grand : l’air plus froid contient davantage de chaleur', 'Un air plus froid contient moins de chaleur prélevable, et surtout l’écart de température à franchir augmente : le COP diminue.'),
      F('inchangé : il ne dépend que de la qualité du compresseur', 'Le COP dépend aussi des températures des deux sources : à machine identique, il baisse quand l’écart entre elles grandit.'),
      F('nul : en dessous de 0 °C, plus aucune chaleur n’est prélevée', 'La machine fonctionne encore avec de l’air à −5 °C, mais son COP est plus faible ; il ne devient pas nul.'),
    ] },

  // ── Évaporation et cristallisation ──
  { id: 'crist-prev-evaporation', domaine: 'Évaporation et cristallisation', titre: 'Concentrer un jus par évaporation',
    ...presenter({ contexte: 'Un jus sucré, non saturé, contient 10 % de sucre en masse. On le concentre dans un évaporateur en éliminant la moitié de sa masse sous forme de vapeur d’eau. Le sucre ne s’évapore pas et aucun cristal n’apparaît.' }),
    q: 'La fraction massique en sucre du jus concentré est…', options: [
      V('20 %', 'Pour 100 kg de jus, il y a 10 kg de sucre. Après évaporation de 50 kg, il reste 50 kg de jus et toujours 10 kg de sucre : 10 / 50 = 20 %.'),
      F('15 %', 'La fraction ne s’additionne pas : on ne peut pas ajouter 5 % à 10 %. Il faut diviser la masse de sucre (inchangée, 10 kg) par la nouvelle masse totale (50 kg).'),
      F('10 %', 'La fraction massique ne changerait pas si l’on retirait du jus entier ; ici on retire seulement de l’eau, donc le sucre se concentre.'),
      F('5 %', 'Ce serait le résultat d’une dilution (masse totale doublée), pas d’une évaporation.'),
    ] },

  // ── Distillation ──
  { id: 'dist-prev-diag-courbes', domaine: 'Distillation', titre: 'Lire un diagramme binaire isobare : courbes et zones',
    ...presenter({ contexte: 'Le diagramme isobare ci-dessous décrit l’équilibre liquide–vapeur d’un mélange de deux liquides miscibles. L’axe horizontal donne la fraction molaire du constituant le plus volatil. Les deux courbes sont numérotées (1) et (2) ; les trois zones sont notées X, Y et Z.', schema: { type: 'diagBinaire' } }),
    q: 'Quelle affirmation est correcte ?', options: [
      V('(1) est la courbe d’ébullition ; en zone Y, liquide et vapeur coexistent', 'À basse température (zone X), le mélange est entièrement liquide ; en chauffant, la première bulle apparaît sur la courbe d’ébullition, ici la courbe (1). Entre les deux courbes (zone Y), liquide et vapeur coexistent ; au-dessus de la courbe de rosée (2), tout est vapeur (zone Z).'),
      F('(1) est la courbe de rosée ; la zone X est entièrement gazeuse', 'Une température basse correspond à un liquide : la zone X (en bas) est entièrement liquide, et la courbe qui la limite est la courbe d’ébullition.'),
      F('(2) est la courbe d’ébullition ; la zone Z est entièrement liquide', 'À haute température, le mélange est gazeux : la zone Z (en haut) est entièrement vapeur, et la courbe (2) qui la limite est la courbe de rosée.'),
      F('les deux sont des courbes d’ébullition ; la zone Y est entièrement liquide ici', 'Il y a une courbe d’ébullition (première bulle) et une courbe de rosée (première goutte) ; entre elles le mélange est diphasé, pas entièrement liquide.'),
    ] },
  { id: 'dist-prev-diag-premiere-bulle', domaine: 'Distillation', titre: 'Composition de la première bulle de vapeur',
    ...presenter({ contexte: 'Même type de diagramme isobare. On chauffe lentement, à pression constante, un liquide de composition x₀ (verticale en pointillés), en partant du point P. Les points P, Q, R et S sont repérés sur le diagramme.', schema: { type: 'diagBinaire', x0: 0.3, points: true, apres: { ligne: true } } }),
    q: 'Quel point représente la composition de la première bulle de vapeur, au moment où le liquide commence à bouillir ?', options: [
      V('le point R', 'Le liquide commence à bouillir en Q, sur la courbe d’ébullition. La vapeur en équilibre se lit à la même température sur la courbe de rosée : c’est R, plus riche que le liquide en constituant volatil.'),
      F('le point Q', 'Q est le liquide qui commence à bouillir, pas la vapeur : la composition de la vapeur se lit sur la courbe de rosée.'),
      F('le point S', 'S est sur la courbe de rosée à la composition x₀ : c’est le point où la dernière goutte de liquide disparaît, à une température plus élevée que celle du début d’ébullition.'),
      F('le point P', 'P est le liquide avant chauffage, à une température inférieure à l’ébullition : il n’y a pas encore de vapeur.'),
    ] },

  // ── Des ondes pour observer : résolution ──
  { id: 'obs-prev-resolution-lambda', domaine: 'Microscope', titre: 'Résolution d’un microscope et couleur de la lumière',
    enonce: 'Le plus petit détail séparé par un microscope optique, limité par la diffraction, vaut d = 0,61 · frac(λ|ON), où ON est l’ouverture numérique de l’objectif. On observe le même échantillon avec le même objectif, d’abord en lumière rouge (λ = 650 nm), puis en lumière bleue (λ = 450 nm).',
    q: 'Avec la lumière bleue, le plus petit détail séparé est…', options: [
      V('plus petit : environ 0,7 fois celui de la lumière rouge', 'd est proportionnel à λ : 450 / 650 ≈ 0,69. Une longueur d’onde plus courte donne une meilleure résolution (détails plus fins séparés).'),
      F('plus grand : environ 1,4 fois celui de la lumière rouge', 'Rapport inversé : d est proportionnel à λ, donc plus petit quand λ diminue.'),
      F('identique : il ne dépend que de l’objectif', 'La résolution dépend aussi de la longueur d’onde, par la diffraction : d est proportionnel à λ.'),
      F('nul : en lumière bleue, tous les détails sont séparés', 'La diffraction impose toujours une limite : d reste de l’ordre de la demi-longueur d’onde divisée par l’ouverture numérique, jamais nul.'),
    ] },
  { id: 'obs-prev-choix-objectif', domaine: 'Microscope', titre: 'Choisir un objectif d’après la fiche constructeur',
    ...presenter({ contexte: 'La fiche d’un microscope donne ses objectifs ci-dessous. On observe en lumière verte (λ = 550 nm) et on veut séparer deux détails distants de 0,55 µm. Le plus petit détail séparé vaut d = 0,61 · frac(λ|ON).', liste: [['Objectif ×10', 'ON = 0,25'], ['Objectif ×20', 'ON = 0,40'], ['Objectif ×40', 'ON = 0,65'], ['Objectif ×100 (immersion)', 'ON = 1,25']] }),
    q: 'Quel est l’objectif le moins grossissant qui convient ?', options: [
      V('l’objectif ×40', 'Il faut d ≤ 0,55 µm. Comme λ = 0,55 µm, cela revient à 0,61 / ON ≤ 1, soit ON ≥ 0,61. Seuls les objectifs ×40 (0,65) et ×100 (1,25) conviennent : le moins grossissant est le ×40.'),
      F('l’objectif ×20', 'Avec ON = 0,40, d = 0,61 × 0,55 / 0,40 ≈ 0,84 µm : supérieur à 0,55 µm, les deux détails ne sont pas séparés.'),
      F('l’objectif ×10', 'Avec ON = 0,25, d ≈ 1,3 µm : très au-dessus de 0,55 µm.'),
      F('l’objectif ×100', 'Il convient (d ≈ 0,27 µm), mais ce n’est pas le moins grossissant : le ×40 suffit déjà (d ≈ 0,52 µm).'),
    ] },
  { id: 'obs-prev-lunette-diametre', domaine: 'Lunette astronomique', titre: 'Diamètre de l’objectif et résolution d’une lunette',
    enonce: 'Le plus petit angle séparable par une lunette, limité par la diffraction, vaut θ_min = 1,22 · λ / D, où D est le diamètre de l’objectif. Un astronome remplace l’objectif de sa lunette par un objectif de même longueur focale mais de diamètre deux fois plus grand, et observe à la même longueur d’onde.',
    q: 'Le plus petit angle séparable devient…', options: [
      V('deux fois plus petit : des détails plus fins sont séparés', 'θ_min est inversement proportionnel à D : si D double, θ_min est divisé par 2.'),
      F('deux fois plus grand : les détails sont moins bien séparés', 'Sens inversé : un objectif plus large diffracte moins la lumière, donc sépare de plus petits angles.'),
      F('quatre fois plus petit, car il dépend du carré de D, pas de D', 'La relation donnée est en 1/D, pas en 1/D² : le facteur est 2.'),
      F('inchangé : il ne dépend que de la longueur d’onde', 'D intervient aussi dans la relation : θ_min = 1,22 · λ / D.'),
    ] },
];

// ───────────────────────────── ANA : choisir la bonne relation ─────────────────────────────
export const TSTLB_REL = [
  { id: 'therm-rel-chaudiere', domaine: 'Transferts thermiques', titre: 'Débit de gaz d’une chaudière',
    enonce: 'Une chaudière au gaz doit transmettre 120 kW de puissance thermique à l’eau d’un circuit de chauffage. Son rendement est de 90 %. Le pouvoir calorifique inférieur (PCI) du gaz vaut 36 MJ·m⁻³. On cherche le débit volumique de gaz à brûler.',
    q: 'Quelle relation permet de répondre ?', options: [
      V('q_gaz = P_utile / (η × PCI)', 'La puissance utile est une fraction η de la puissance de combustion q_gaz × PCI : P_utile = η × q_gaz × PCI. Ici q_gaz = 120×10³ / (0,90 × 36×10⁶) ≈ 3,7×10⁻³ m³·s⁻¹, soit environ 13 m³·h⁻¹.'),
      F('q_gaz = P_utile × (1 − η) / PCI', 'Cette expression ne donnerait que la puissance perdue, convertie en débit de gaz, et non le débit nécessaire.'),
      F('q_gaz = (P_utile × η) / PCI', 'Multiplier par le rendement donne un débit trop faible : avec des pertes, il faut brûler plus de gaz que si le rendement était de 100 %, pas moins.'),
      F('q_gaz = P_utile / PCI', 'Juste seulement pour un rendement de 100 % : ici, 10 % de l’énergie du gaz est perdue, donc le débit est sous-estimé.'),
    ] },
  { id: 'therm-rel-dimensionner', domaine: 'Transferts thermiques', titre: 'Surface d’un échangeur à dimensionner',
    enonce: 'On veut dimensionner un échangeur eau–eau : il doit transférer une puissance thermique P de 80 kW. Le coefficient global d’échange K vaut 800 W·m⁻²·K⁻¹. L’écart de température moyen entre les deux fluides, calculé avec la formule fournie, est ΔT_ml = 25 K. On cherche la surface d’échange S.',
    q: 'Quelle relation permet de répondre ?', options: [
      V('S = P / (K × ΔT_ml)', 'La puissance échangée vaut P = K × S × ΔT_ml, d’où S = P / (K × ΔT_ml) = 80 000 / (800 × 25) = 4,0 m².'),
      F('S = P × K × ΔT_ml', 'Ce produit n’a pas la dimension d’une surface : S doit diminuer quand K ou ΔT_ml augmentent (échange plus efficace).'),
      F('S = K × ΔT_ml / P', 'C’est l’inverse de la bonne relation : cette expression donnerait une surface qui diminue quand la puissance à transférer augmente.'),
      F('S = P / (K × (θ_ce − θ_fe))', 'Ici θ_ce − θ_fe est l’écart entre les entrées des deux fluides. Ce n’est pas l’écart moyen ΔT_ml, seul à intervenir dans P = K × S × ΔT_ml.'),
    ] },
  { id: 'dist-rel-fractions', domaine: 'Distillation', titre: 'Fraction molaire d’un mélange eau–éthanol',
    enonce: 'On mélange 100 g d’éthanol (M = 46 g·mol⁻¹) et 100 g d’eau (M = 18 g·mol⁻¹). On cherche la fraction molaire x de l’éthanol dans le mélange liquide.',
    q: 'Quelle relation permet de répondre ?', options: [
      V('x = n_éthanol / (n_éthanol + n_eau), avec n = m / M', 'La fraction molaire est la quantité de matière du constituant rapportée à la quantité totale : n_éthanol = 100 / 46 ≈ 2,2 mol ; n_eau = 100 / 18 ≈ 5,6 mol ; x ≈ 0,28.'),
      F('x = m_éthanol / (m_éthanol + m_eau), avec des masses en grammes', 'C’est la fraction massique (ici 0,50), pas la fraction molaire : elle ne tient pas compte des masses molaires, très différentes (46 et 18 g·mol⁻¹).'),
      F('x = n_éthanol / n_eau', 'C’est le rapport des quantités de matière de deux constituants (≈ 0,39), pas une fraction du total : une fraction vaut au plus 1.'),
      F('x = M_éthanol / (M_éthanol + M_eau)', 'Elle ne dépend que des masses molaires : elle donnerait la même valeur quelle que soit la composition du mélange.'),
    ] },
];

// ───────────────────────────── VAL : ça paraît plausible ? ─────────────────────────────
export const TSTLB_VAL = [
  // ── Régulation ──
  P({ id: 'reg-val-boucle-ouverte', domaine: 'Régulation', niveau: 2, titre: 'Un four sans régulation et une porte mal fermée', plausible: true,
    ...presenter({ contexte: 'Un four est chauffé à puissance constante, sans capteur ni régulateur (boucle ouverte). Une porte mal fermée laisse échapper plus de chaleur. On suppose le régime permanent atteint avant et après.', liste: [['Puissance de chauffe (fixe)', '1 200 W'], ['Température du local', '20 °C'], ['Pertes, porte fermée', '30 W par kelvin d’écart avec le local'], ['Pertes, porte mal fermée', '40 W par kelvin d’écart avec le local']], suite: 'Un élève annonce que la température du four, qui était de 60 °C porte fermée, se stabilise maintenant à 50 °C.' }),
    reperes: [['Régime permanent', 'puissance de chauffe = puissance perdue'], ['Pertes', 'G × (θ − 20 °C), avec G en W·K⁻¹'], ['Boucle ouverte', 'rien ne modifie la puissance de chauffe quand la température change']],
    ver: 'Porte fermée : 1 200 = 30 × (θ − 20) donne θ = 60 °C. Porte mal fermée : 1 200 = 40 × (θ − 20) donne θ = 50 °C. L’élève a raison : sans régulation, une perturbation (ici une fuite) déplace durablement la température. C’est ce qu’une boucle fermée sert à corriger.',
    q2: 'Quel raisonnement est correct ?',
    options: [
      V('Plausible : 1 200 = 40 × (θ − 20) donne 50 °C, sans correction', 'En boucle ouverte, la puissance reste à 1 200 W ; le four se stabilise là où les pertes la compensent.'),
      F('Pas plausible : le four doit revenir à 60 °C, sa température normale', 'Seule une boucle fermée (mesure, comparaison, correction) pourrait ramener la température à 60 °C. Ici la puissance de chauffe ne change pas.'),
      F('Pas plausible : des pertes plus fortes refroidissent le four jusqu’à 20 °C', 'Le chauffage de 1 200 W compense encore les pertes ; la température ne tombe pas à celle du local, elle se stabilise à 50 °C.'),
    ] }),
  P({ id: 'reg-val-point-fonct', domaine: 'Régulation', niveau: 2, titre: 'Le point de fonctionnement d’un four régulé en P', plausible: false,
    ...presenter({ contexte: 'Un four est régulé par un régulateur proportionnel seul, en régime permanent (boucle stable).', liste: [['Consigne', '80 °C'], ['Loi du régulateur', 'Y = K_p × (consigne − θ), avec K_p = 10 %·K⁻¹'], ['Caractéristique statique du four', 'θ = 20 °C + 1,0 K·%⁻¹ × Y (Y en %)']], suite: 'Un élève lit sur la caractéristique du four que, pour atteindre 80 °C, il faut Y = 60 %. Il en conclut que le point de fonctionnement est θ = 80 °C avec Y = 60 %.' }),
    reperes: [['Point de fonctionnement', 'valeurs de θ et de Y qui vérifient à la fois la caractéristique du four et la loi du régulateur'], ['Régulateur P', 'si θ est égale à la consigne, l’écart est nul et Y = 0'], ['Vérification', 'calculer Y avec la loi du régulateur pour θ = 80 °C']],
    ver: 'Pour θ = 80 °C, le régulateur donne Y = 10 × (80 − 80) = 0 % et non 60 % : ce couple ne vérifie pas la loi du régulateur. Le point de fonctionnement est à l’intersection des deux caractéristiques : θ ≈ 74,5 °C et Y ≈ 54,5 %, avec un écart statique d’environ 5,5 K.',
    q2: 'Quelle erreur explique ce résultat ?',
    options: [
      V('Il a utilisé la caractéristique du four sans la loi du régulateur', 'Le point de fonctionnement doit vérifier les deux relations : la caractéristique du four et la loi du régulateur.'),
      F('Il a oublié de convertir les températures en kelvins avant de calculer', 'Un écart de température vaut la même chose en °C et en K : la conversion n’a aucun effet ici.'),
      F('Il a pris un gain K_p trop faible dans son calcul de la commande', 'Quel que soit K_p, un régulateur P donne Y = 0 lorsque θ est égale à la consigne : une commande de 60 % exige un écart non nul.'),
    ] }),
  P({ id: 'reg-val-pi-sature', domaine: 'Régulation', niveau: 3, titre: 'Un PI et une pompe trop petite', plausible: false,
    ...presenter({ contexte: 'Un réservoir est régulé en niveau par un régulateur PI (boucle stable en fonctionnement normal).', liste: [['Consigne de niveau', '2,00 m'], ['Débit maximal de la pompe', '60 m³·h⁻¹'], ['Soutirage', 'passe brusquement de 20 à 70 m³·h⁻¹, puis reste constant']], suite: 'Un élève affirme : « Le régulateur est un PI : après un temps assez long, le niveau sera revenu à 2,00 m. »' }),
    reperes: [['Pompe', 'débit proportionnel à la commande Y, de 0 (Y = 0 %) à 60 m³·h⁻¹ (Y = 100 %)'], ['Action intégrale', 'fait varier la commande tant que l’écart n’est pas nul']],
    ver: 'Pour que le niveau se stabilise, la pompe devrait fournir 70 m³·h⁻¹. Or elle ne peut pas dépasser 60 m³·h⁻¹ : la commande reste bloquée à 100 % et le réservoir se vide de 10 m³·h⁻¹ en continu. L’action intégrale ne peut pas annuler l’écart quand la commande est saturée.',
    q2: 'Quel raisonnement est correct ?',
    options: [
      V('Pas plausible : la pompe, saturée à 60 m³·h⁻¹, ne compense pas un soutirage de 70', 'La commande est bloquée à 100 % : aucun terme intégral ne peut faire fournir plus à la pompe.'),
      F('Pas plausible : un régulateur PI n’annule jamais l’écart statique, quel que soit le cas', 'Faux : en régime permanent et si la commande reste dans ses limites, un PI annule l’écart statique. Ici, c’est la saturation de la pompe qui l’empêche.'),
      F('Plausible : l’action intégrale annule toujours l’écart, quelle que soit la perturbation', 'Elle ne le fait que si la commande peut atteindre la valeur nécessaire, ce qui n’est pas le cas ici (70 > 60 m³·h⁻¹).'),
      F('Plausible : la commande peut dépasser 100 % pour compenser le surplus', 'Une commande est limitée à 100 % : la pompe a un débit maximal que l’on ne peut pas dépasser.'),
    ] }),

  // ── Transferts thermiques et machines thermiques ──
  P({ id: 'therm-val-isolant', domaine: 'Transferts thermiques', niveau: 1, titre: 'Classer des matériaux selon leur pouvoir isolant', plausible: false,
    ...presenter({ contexte: 'Un élève doit classer trois matériaux, du plus isolant au moins isolant, d’après leur conductivité thermique.', liste: [['Laine de verre', 'λ = 0,040 W·m⁻¹·K⁻¹'], ['Béton', 'λ = 1,4 W·m⁻¹·K⁻¹'], ['Acier', 'λ = 50 W·m⁻¹·K⁻¹']], suite: 'Il écrit : « Le meilleur isolant est l’acier, puis le béton, puis la laine de verre, car leur conductivité thermique est de plus en plus petite. »' }),
    reperes: [['Conductivité thermique λ', 'mesure la facilité avec laquelle un matériau conduit la chaleur'], ['Résistance thermique d’une paroi plane', 'R = e / (λ·S) : à épaisseur et surface fixées, plus λ est grand, plus R est petit'], ['Repère', 'les métaux conduisent très bien la chaleur ; l’air immobile la conduit très mal']],
    ver: 'Un bon isolant a une conductivité thermique faible : il laisse peu passer la chaleur. L’ordre correct est donc la laine de verre (0,040), puis le béton (1,4), puis l’acier (50), excellent conducteur et très mauvais isolant.',
    q2: 'Quelle erreur explique ce classement ?',
    options: [
      V('Il a pris une conductivité élevée pour celle d’un bon isolant', 'C’est l’inverse : plus λ est petit, plus le matériau est isolant.'),
      F('Il a comparé les matériaux à des épaisseurs différentes, sans le dire', 'Le classement par λ se fait à matériau seul : l’épaisseur n’intervient pas dans la comparaison de conductivités.'),
      F('Il a oublié de convertir les W en kW dans les valeurs de λ', 'Les trois valeurs sont dans la même unité : une conversion identique ne changerait pas l’ordre.'),
    ] }),
  P({ id: 'therm-val-chaudiere-debit', domaine: 'Transferts thermiques', niveau: 2, titre: 'Puissance d’une chaudière à vapeur', plausible: false,
    ...presenter({ contexte: 'Une chaudière industrielle produit de la vapeur d’eau à 100 °C, à partir d’eau liquide à 20 °C, avec un débit de 1,0 t·h⁻¹ (pertes négligées).', suite: 'Un élève calcule la puissance thermique que la chaudière doit transmettre à l’eau et trouve 93 kW.' }),
    reperes: [['Capacité thermique massique de l’eau liquide', 'c = 4,18 kJ·kg⁻¹·K⁻¹'], ['Énergie massique de vaporisation de l’eau à 100 °C', 'L_v = 2,26 MJ·kg⁻¹'], ['Débit massique', '1,0 t·h⁻¹ ≈ 0,28 kg·s⁻¹']],
    ver: 'Chauffer l’eau de 20 °C à 100 °C demande 0,278 × 4 180 × 80 ≈ 93 kW : c’est exactement le résultat de l’élève. Mais l’eau doit aussi être vaporisée : 0,278 × 2,26×10⁶ ≈ 628 kW. La puissance totale est d’environ 7,2×10² kW, près de huit fois plus.',
    q2: 'Quelle erreur explique ce résultat ?',
    options: [
      V('Il a oublié la vaporisation, après le chauffage de l’eau', 'Avec changement d’état, il faut ajouter q_m × L_v au terme q_m × c × Δθ.'),
      F('Il a oublié de convertir les tonnes en kilogrammes avant de calculer', 'Avec 1 000 kg·h⁻¹ correctement converti en 0,278 kg·s⁻¹, le chauffage seul donne bien 93 kW : la conversion est correcte.'),
      F('Il a utilisé L_v à la place de c dans son calcul de puissance', 'L_v à la place de c donnerait environ 630 kW, pas 93 kW.'),
    ] }),
  P({ id: 'therm-val-echangeur-surface', domaine: 'Transferts thermiques', niveau: 1, titre: 'Surface d’échange d’un échangeur de 80 kW', plausible: false,
    ...presenter({ contexte: 'Un échangeur doit transférer 80 kW avec un coefficient global d’échange K = 800 W·m⁻²·K⁻¹ et un écart de température moyen de 25 K.', suite: 'Un élève calcule la surface d’échange S = P / (K × ΔT_ml) et trouve S = 4,0×10⁻³ m².' }),
    reperes: [['Surface d’un échangeur à plaques industriel', 'quelques mètres carrés'], ['Une feuille A4', '6×10⁻² m²'], ['Unité de K', 'W·m⁻²·K⁻¹ : la puissance doit donc être en watts']],
    ver: '4,0×10⁻³ m² font 40 cm², moins qu’une feuille A4 : c’est absurde pour 80 kW. En convertissant 80 kW = 80 000 W, on obtient S = 80 000 / (800 × 25) = 4,0 m². L’élève a gardé la puissance en kW.',
    q2: 'Quelle erreur explique ce résultat ?',
    options: [
      V('Il a gardé la puissance en kW alors que K est en W·m⁻²·K⁻¹', 'Il manque un facteur 1 000 : 80 au lieu de 80 000 donne une surface 1 000 fois trop petite.'),
      F('Il a exprimé l’écart de température en °C au lieu de kelvins', 'Un écart de température a la même valeur en °C et en K : ce choix ne change rien.'),
      F('Il a multiplié P par K × ΔT_ml au lieu de diviser', 'Ce produit donnerait un résultat énorme (de l’ordre de 10⁹), pas 4,0×10⁻³ m².'),
    ] }),
  P({ id: 'therm-val-cop', domaine: 'Machines thermiques', niveau: 2, titre: 'Un COP de 3 : est-ce possible ?', plausible: true,
    ...presenter({ contexte: 'Une pompe à chaleur chauffe une maison. Pendant une heure, son compresseur consomme 2,0 kWh d’énergie électrique, et elle fournit 6,0 kWh d’énergie thermique au circuit de chauffage.', suite: 'Un élève calcule le coefficient de performance COP = 6,0 / 2,0 = 3,0.' }),
    reperes: [['COP d’une pompe à chaleur', 'rapport entre l’énergie thermique fournie à la source chaude et l’énergie reçue (travail du compresseur)'], ['Conservation de l’énergie', 'énergie fournie à la source chaude = travail + chaleur prélevée à la source froide'], ['Ordre de grandeur', 'COP des pompes à chaleur de chauffage : de 2 à 5']],
    ver: 'Le COP de 3,0 est dans l’ordre de grandeur habituel. La conservation de l’énergie est respectée : 6,0 = 2,0 + 4,0 ; les 4,0 kWh manquants sont prélevés à l’air extérieur (source froide). La machine ne crée pas d’énergie, elle la déplace.',
    q2: 'Quel raisonnement est correct ?',
    options: [
      V('Cohérent : 6,0 = 2,0 + 4,0, les 4,0 kWh manquants sont pris à l’air extérieur', 'Le premier principe s’applique : l’énergie reçue par la maison vient du compresseur et de la source froide.'),
      F('Pas cohérent : l’énergie fournie ne peut pas dépasser l’énergie consommée', 'Cela ne vaudrait que si la machine ne prélevait rien à l’extérieur. Une pompe à chaleur transfère aussi de la chaleur de la source froide.'),
      F('Pas cohérent : un COP vaut au plus 1, sinon l’énergie ne serait pas conservée', 'Pour une pompe à chaleur, le COP est supérieur à 1 : c’est ce qui la rend intéressante. La conservation de l’énergie est respectée avec la chaleur prélevée.'),
      F('Cohérent : la pompe à chaleur crée de l’énergie à partir de rien', 'Elle ne crée pas d’énergie : l’excédent vient de l’air extérieur.'),
    ] }),

  // ── Évaporation et cristallisation ──
  P({ id: 'crist-val-evaporation-debit', domaine: 'Évaporation et cristallisation', niveau: 2, titre: 'Débit d’eau évaporée dans un évaporateur', plausible: false,
    ...presenter({ contexte: 'Un évaporateur concentre un jus sucré en continu, sans cristallisation.', liste: [['Jus entrant', '1 000 kg·h⁻¹, à 12 % de sucre en masse'], ['Concentré sortant', '60 % de sucre en masse']], suite: 'Un élève calcule le débit d’eau évaporée et trouve 200 kg·h⁻¹.' }),
    reperes: [['Le sucre ne s’évapore pas', 'son débit massique est le même à l’entrée et dans le concentré'], ['Bilan sur la masse totale', 'entrée = concentré + vapeur d’eau']],
    ver: 'Sucre : 0,12 × 1 000 = 120 kg·h⁻¹. Concentré : 120 / 0,60 = 200 kg·h⁻¹. Eau évaporée : 1 000 − 200 = 800 kg·h⁻¹. Le résultat de l’élève (200) est le débit de concentré, pas celui de l’eau évaporée.',
    q2: 'Quelle erreur explique ce résultat ?',
    options: [
      V('Il a donné le débit de concentré, pas celui de la vapeur d’eau', 'Le débit de concentré vaut bien 200 kg·h⁻¹ ; l’eau évaporée est la différence avec le débit d’entrée.'),
      F('Il a confondu les deux fractions massiques, 12 % et 60 %, en calculant', 'En les échangeant, il obtiendrait un concentré de 5 000 kg·h⁻¹, plus que ce qui entre : ce n’est pas son résultat.'),
      F('Il a calculé le débit de sucre à la place du débit d’eau évaporée', 'Le débit de sucre vaut 120 kg·h⁻¹, pas 200 kg·h⁻¹.'),
    ] }),

  // ── Distillation ──
  P({ id: 'dist-val-fractions', domaine: 'Distillation', niveau: 2, titre: 'Fraction molaire ou fraction massique ?', plausible: false,
    ...presenter({ contexte: 'On prépare un mélange eau–éthanol de 50 g d’éthanol et 50 g d’eau (50 % d’éthanol en masse). Le diagramme binaire disponible est tracé en fraction molaire.', suite: 'Un élève lit le diagramme à x = 0,50 pour déterminer la température d’ébullition de ce mélange.' }),
    reperes: [['Masses molaires', 'éthanol 46 g·mol⁻¹ ; eau 18 g·mol⁻¹'], ['Fraction molaire', 'x = n_éthanol / (n_éthanol + n_eau), avec n = m / M']],
    ver: '50 g d’éthanol font 1,09 mol et 50 g d’eau font 2,78 mol : x = 1,09 / 3,87 ≈ 0,28. L’élève a pris la fraction massique (0,50) pour la fraction molaire. L’eau, plus légère par mole, est bien plus nombreuse en quantité de matière.',
    q2: 'Quelle erreur explique ce choix de x = 0,50 ?',
    options: [
      V('Il a confondu fraction massique et fraction molaire', 'Les deux fractions ne coïncident que si les masses molaires sont égales, ce qui n’est pas le cas.'),
      F('Il a oublié de convertir les grammes en kilogrammes', 'Un facteur 1 000 identique sur les deux masses disparaît dans une fraction : cela ne change pas x.'),
      F('Il a lu le diagramme avec la fraction molaire de l’eau', 'La fraction molaire de l’eau vaut ≈ 0,72, pas 0,50.'),
    ] }),

  // ── Des ondes pour observer : résolution ──
  P({ id: 'obs-val-resolution', domaine: 'Microscope', niveau: 2, titre: 'Le grossissement ne suffit pas à tout voir', plausible: false,
    ...presenter({ contexte: 'Un élève observe un échantillon avec un microscope optique : objectif ×100 à immersion (ON = 1,25), oculaire ×10, lumière verte (λ = 550 nm).', suite: 'Il annonce qu’avec un grossissement total de ×1 000, il distingue deux détails séparés de 50 nm.' }),
    reperes: [['Pouvoir de résolution', 'd = 0,61 · frac(λ|ON) : plus petit écart entre deux détails séparés, fixé par la diffraction'], ['Ordre de grandeur pour un microscope optique', 'de l’ordre de 0,2 µm']],
    ver: 'd = 0,61 × 550 / 1,25 ≈ 270 nm : deux détails distants de 50 nm ne peuvent pas être séparés, quel que soit le grossissement. Un grossissement plus fort agrandit l’image mais ne permet pas de dépasser la limite imposée par la diffraction.',
    q2: 'Quel raisonnement est correct ?',
    options: [
      V('La limite est fixée par la diffraction (d ≈ 270 nm), pas par le grossissement', 'Au-delà de cette limite, l’image est plus grande mais n’est pas plus détaillée.'),
      F('Avec ×1 000, le microscope sépare des détails 1 000 fois plus petits qu’à l’œil nu', 'Le grossissement agrandit l’image ; il n’abaisse pas la limite de résolution, qui dépend de λ et de l’ouverture numérique.'),
      F('Il aurait dû utiliser une lumière rouge, de résolution meilleure', 'Le rouge est de plus grande longueur d’onde que le vert : d serait plus grand, donc moins bon.'),
    ] }),
  P({ id: 'obs-val-afm', domaine: 'Microscope', niveau: 1, titre: 'Microscope optique ou microscope à force atomique ?', plausible: false,
    ...presenter({ contexte: 'Un élève compare deux instruments : un microscope optique (pouvoir de résolution de l’ordre de 0,2 µm) et un microscope à force atomique, ou AFM (pouvoir de résolution de l’ordre du nanomètre).', suite: 'Il annonce que l’AFM distingue des détails environ un million de fois plus petits que ceux du microscope optique.' }),
    reperes: [['Conversions', '1 µm = 10³ nm ; 1 mm = 10⁶ nm'], ['Rapport de deux résolutions', 'résolution du microscope optique ÷ résolution de l’AFM, dans la même unité']],
    ver: '0,2 µm = 200 nm : le rapport avec 1 nm est de l’ordre de 200, pas de 10⁶. Un facteur un million correspondrait à un microscope optique qui ne séparerait que des détails d’un millimètre.',
    q2: 'Quelle erreur explique ce résultat ?',
    options: [
      V('Il a mal converti : 0,2 µm vaut 200 nm, donc le rapport est voisin de 200', 'Le calcul correct est 200 nm / 1 nm = 200.'),
      F('Il a inversé les deux instruments : l’AFM est moins résolvant', 'L’AFM est bien plus résolvant que le microscope optique : l’erreur est sur le facteur, pas sur le sens de la comparaison.'),
      F('Il a oublié que l’AFM utilise la lumière visible, limitée par la diffraction', 'Un AFM n’utilise pas la lumière : une pointe très fine balaie la surface, d’où son pouvoir de résolution bien meilleur.'),
    ] }),
];
