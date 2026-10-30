// ====================================================
//  ATELIER « COMPRENDRE UNE SITUATION » (S'APP) — BANQUE D'EXERCICES À ÉTAPES
// ====================================================
// Un exercice = un contexte (énoncé) + des étapes. Chaque étape est :
//   • un QCM : { id, titre, q, aide, o: [[texte, juste, explication], …] }  (une seule bonne réponse)
//   • une saisie numérique : { id, titre, q, aide, type: 'saisie', champs: [{ id, lib, u, vrai, tol (relatif), ok? }] }
//       ok(valeurs, id) : facultatif, renvoie les valeurs acceptées pour le champ id selon ce que l'élève a déjà écrit dans les autres champs.
// construire() renvoie { enonce, tableau?, etapes, retenir } ; les nombres de certains exercices sont tirés au hasard.
// Aucune dépendance à React : testable seul. Notation : « U_R » s'affiche avec un indice (voir avecIndices dans commun.jsx).

const tire = t => t[Math.floor(Math.random() * t.length)];
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const nb = (x, d) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
export const mel = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const DOM = 'Transmission de signaux numériques';

// ── S2 : quelle instruction Arduino ? ──
const arduino = (id, titre, enonce, nature, instr, retenir) => ({
  id, domaine: DOM, niveau: 1, titre,
  construire: () => ({
    enonce,
    etapes: [
      { id: 'nature', titre: 'La nature de la broche', q: 'Que doit faire la carte avec cette broche ?', aide: 'Entrée ou sortie ? Signal « tout ou rien » (numérique) ou tension qui peut prendre beaucoup de valeurs (analogique) ?', o: nature },
      { id: 'instr', titre: 'L’instruction', q: 'Quelle instruction faut-il écrire ?', aide: 'Le nom de l’instruction dit ce qu’elle fait : write = écrire (commander une sortie), read = lire (une entrée), print = afficher.', o: instr },
    ],
    retenir,
  }),
});

const NAT = {
  sortieNum: [
    V('Une sortie numérique : la carte commande l’état de la broche (HIGH ou LOW)', 'Allumer ou éteindre un composant, c’est lui envoyer un signal « tout ou rien » : la carte écrit sur la broche.'),
    F('Une entrée numérique : la carte lit l’état de la broche', 'Une entrée sert à lire un signal venant de l’extérieur (bouton, capteur « tout ou rien »). Ici, la carte doit agir sur un composant.'),
    F('Une entrée analogique : la carte mesure une tension', 'Une entrée analogique sert à mesurer une tension variable. Ici, on commande un composant, on ne mesure rien.'),
  ],
  entreeNum: [
    V('Une entrée numérique : la carte lit l’état de la broche (HIGH ou LOW)', 'Un bouton est soit appuyé, soit relâché : c’est un signal « tout ou rien », que la carte lit.'),
    F('Une sortie numérique : la carte commande l’état de la broche', 'Une sortie sert à commander un composant. Ici, c’est le bouton qui informe la carte.'),
    F('Une entrée analogique : la carte mesure une tension variable', 'Un bouton ne fournit que deux états : une mesure analogique (0 à 1 023) n’est pas utile.'),
  ],
  entreeAna: [
    V('Une entrée analogique : la carte convertit une tension en un nombre N de 0 à 1 023', 'La tension du pont diviseur varie de façon continue : le CAN de la carte la convertit en nombre (10 bits).'),
    F('Une entrée numérique : la carte lit seulement HIGH ou LOW', 'On obtiendrait seulement 0 ou 1 : on perdrait l’information sur la valeur de la tension.'),
    F('Une sortie numérique : la carte commande la broche', 'On ne veut pas commander un composant mais mesurer une tension.'),
  ],
  affichage: [
    V('Ni l’un ni l’autre : on envoie un message vers l’ordinateur par la liaison série (moniteur série)', 'Afficher une valeur ne passe pas par une broche d’entrée ou de sortie : la carte envoie un texte à l’ordinateur par le câble USB.'),
    F('Une sortie numérique : on commande une broche à HIGH ou LOW', 'Une broche à HIGH ou LOW ne peut pas écrire le nombre N : seul le moniteur série affiche des valeurs sur l’écran.'),
    F('Une entrée analogique : la carte mesure une tension', 'N est déjà connu du programme : il ne s’agit plus de le mesurer mais de l’afficher.'),
  ],
};

export const SITUATIONS = [
  arduino('arduino-allumer', 'Quelle instruction : allumer une DEL',
    'Sur une carte Arduino, une DEL est branchée sur la broche numérique 11 (déjà configurée en sortie avec pinMode). On veut l’allumer.',
    NAT.sortieNum, [
      V('digitalWrite(11, HIGH)', 'digitalWrite(broche, état) écrit un état sur une broche numérique : HIGH met la broche à 5 V, la DEL s’allume.'),
      F('analogRead(11, HIGH)', 'analogRead lit une tension sur une entrée analogique et ne prend qu’un seul argument (la broche) : cette instruction n’existe pas.'),
      F('Serial.print(11, HIGH)', 'Serial.print affiche une valeur dans le moniteur série de l’ordinateur : elle ne commande pas la broche 11.'),
      F('digitalRead(11)', 'digitalRead lit l’état d’une broche : elle ne la modifie pas, donc elle n’allume pas la DEL.'),
    ],
    ['Sortie numérique : digitalWrite(broche, HIGH ou LOW). Dans setup(), on déclare la broche en sortie avec pinMode(broche, OUTPUT).']),
  arduino('arduino-bouton', 'Quelle instruction : lire un bouton',
    'Un bouton poussoir est relié à la broche numérique 2 d’une carte Arduino (déjà configurée en entrée avec pinMode). Le programme doit savoir si le bouton est appuyé.',
    NAT.entreeNum, [
      V('digitalRead(2)', 'digitalRead(broche) renvoie l’état de la broche numérique : HIGH ou LOW. C’est ce qu’il faut pour un bouton.'),
      F('digitalWrite(2, HIGH)', 'digitalWrite commande une sortie : elle n’indique pas si le bouton est appuyé.'),
      F('analogRead(2)', 'analogRead lit les entrées analogiques (A0, A1, …) et renvoie un nombre de 0 à 1 023 : inutile pour un bouton qui n’a que deux états.'),
      F('Serial.println(2)', 'Serial.println affiche la valeur 2 dans le moniteur série : elle ne lit pas le bouton.'),
    ],
    ['Entrée numérique : digitalRead(broche). Dans setup(), on déclare la broche en entrée avec pinMode(broche, INPUT).']),
  arduino('arduino-tension', 'Quelle instruction : mesurer la tension du capteur',
    'La tension U_R du pont diviseur (photorésistance et résistance) est reliée à l’entrée analogique A0 d’une carte Arduino. Le programme doit récupérer le nombre N, entre 0 et 1 023, qui correspond à cette tension.',
    NAT.entreeAna, [
      V('analogRead(A0)', 'analogRead(broche) fait convertir la tension de l’entrée analogique par le CAN et renvoie le nombre N (0 à 1 023).'),
      F('digitalRead(A0)', 'digitalRead ne distingue que HIGH ou LOW : on perdrait la valeur de la tension.'),
      F('digitalWrite(A0, HIGH)', 'digitalWrite commande une sortie : elle ne mesure rien.'),
      F('Serial.println(A0)', 'Serial.println affiche la valeur donnée en argument (ici, le numéro de la broche) : elle ne mesure pas la tension.'),
    ],
    ['Entrée analogique : N = analogRead(A0), nombre de 0 à 1 023 (CAN 10 bits). On affiche ensuite N avec Serial.println(N).']),
  arduino('arduino-afficher', 'Quelle instruction : afficher la valeur de N',
    'Un programme Arduino a calculé le nombre N à partir de la tension d’un capteur. Pour vérifier le montage, on veut lire la valeur de N sur l’écran de l’ordinateur, pendant que la carte est reliée en USB.',
    NAT.affichage, [
      V('Serial.println(N)', 'Serial.println(valeur) envoie la valeur au moniteur série de l’ordinateur, suivie d’un retour à la ligne (Serial.begin doit avoir été appelé dans setup).'),
      F('digitalWrite(N, HIGH)', 'digitalWrite commande une broche : N serait pris pour un numéro de broche, rien ne s’afficherait.'),
      F('analogRead(N)', 'analogRead mesure une tension sur une entrée : il ne sert pas à afficher.'),
      F('digitalRead(N)', 'digitalRead lit l’état d’une broche : il ne sert pas à afficher.'),
    ],
    ['Afficher une valeur : Serial.begin(9600) dans setup(), puis Serial.println(valeur) dans loop().']),

  // ── S3 : pourquoi le temps de réponse compte-t-il ? ──
  ...[
    {
      id: 'reponse-tunnel-entree', titre: 'Temps de réponse : entrée dans un tunnel',
      enonce: 'Les phares d’une voiture s’allument automatiquement quand un capteur de lumière mesure un éclairement trop faible. La voiture entre dans un tunnel : l’éclairement passe très vite de 10 000 lx à 100 lx. Le temps de réponse du capteur est trop long.',
      evt: [
        V('L’éclairement baisse brusquement à l’entrée du tunnel', 'C’est le changement rapide que le capteur doit suivre : l’éclairement passe presque instantanément d’une valeur forte à une valeur faible (« échelon »).'),
        F('L’éclairement reste constant dans le tunnel', 'Il est à peu près constant une fois dans le tunnel, mais c’est le passage de l’extérieur au tunnel qui est brusque et qui pose problème.'),
        F('La température du capteur augmente', 'La température n’intervient pas dans cette situation.'),
      ],
      lent: [
        V('Le signal du capteur reste trop longtemps élevé : le système croit qu’il fait encore jour', 'Le capteur met du temps à atteindre sa nouvelle valeur finale : pendant ce temps, la valeur mesurée est encore celle d’un éclairement fort.'),
        F('Le capteur mesure tout de suite la bonne valeur, mais l’affiche mal', 'Un temps de réponse trop long, c’est justement une mesure qui n’est pas encore à la bonne valeur.'),
        F('Le capteur mesure un éclairement plus faible que la réalité', 'Au début, c’est l’inverse : la valeur mesurée est encore trop forte.'),
      ],
      rep: [
        V('Entrée dans un tunnel : l’éclairement baisse brusquement. Si le capteur est trop lent, il mesure encore un éclairement fort, donc la décision d’allumer les phares est prise trop tard : le conducteur roule quelques secondes sans éclairage dans un endroit sombre, ce qui est dangereux.', 'Les quatre éléments sont là : événement brusque, capteur trop lent, décision tardive, conséquence concrète.'),
        F('L’éclairement baisse brusquement à l’entrée du tunnel, donc il faut que le capteur de lumière soit très précis pour que les phares fonctionnent correctement dans le tunnel.', 'Confusion avec la précision : un capteur très précis peut être lent. Ici, c’est la rapidité qui compte ; de plus, la conséquence concrète n’est pas donnée.'),
        F('À l’entrée du tunnel, l’éclairement baisse brusquement et le capteur est lent, donc les phares s’allument en retard.', 'L’événement et le retard sont bien identifiés, mais la conséquence concrète pour le conducteur manque (rouler sans éclairage dans un endroit sombre).'),
      ],
      retenir: ['Une bonne réponse enchaîne : événement brusque → capteur trop lent → décision tardive → conséquence concrète.'],
    },
    {
      id: 'reponse-tunnel-sortie', titre: 'Temps de réponse : sortie d’un tunnel',
      enonce: 'Les mêmes phares automatiques s’éteignent quand l’éclairement mesuré dépasse un seuil. La voiture sort du tunnel : l’éclairement passe très vite de 100 lx à 10 000 lx. Le temps de réponse du capteur est trop long.',
      evt: [
        V('L’éclairement augmente brusquement à la sortie du tunnel', 'C’est le changement rapide que le capteur doit suivre, cette fois dans l’autre sens : de faible à fort.'),
        F('L’éclairement diminue brusquement', 'C’était le cas à l’entrée du tunnel. À la sortie, la lumière du jour revient : l’éclairement augmente.'),
        F('La tension d’alimentation du capteur diminue', 'L’alimentation n’est pas concernée.'),
      ],
      lent: [
        V('Le signal du capteur reste trop longtemps faible : le système croit qu’il fait encore sombre', 'La valeur mesurée met du temps à rejoindre sa valeur finale, donc elle reste celle d’un faible éclairement.'),
        F('Le signal du capteur dépasse tout de suite le seuil', 'Ce serait un capteur rapide. Avec un temps de réponse trop long, le seuil n’est atteint qu’après un certain délai.'),
        F('Le signal du capteur devient négatif', 'Un temps de réponse long ralentit la mesure : il ne change pas son signe.'),
      ],
      rep: [
        V('Sortie du tunnel : l’éclairement augmente brusquement. Si le capteur est trop lent, il mesure encore un faible éclairement, donc l’extinction des phares est décidée trop tard : ils restent allumés quelques secondes en plein jour. La conséquence est limitée (consommation inutile, pas de danger), contrairement à l’entrée dans le tunnel.', 'La réponse suit la structure attendue et nuance la gravité : l’enjeu de sécurité est surtout à l’entrée du tunnel.'),
        F('Le capteur est lent, donc les phares s’éteignent trop tard et c’est très dangereux.', 'Le sens est bon, mais « très dangereux » est exagéré : des phares allumés en plein jour ne mettent pas en danger le conducteur. La conséquence doit être concrète et proportionnée.'),
        F('À la sortie du tunnel, l’éclairement augmente brusquement ; il faut donc un capteur très précis pour que les phares s’éteignent au bon moment.', 'Confusion avec la précision (écart à la valeur vraie) : ici, c’est la rapidité qui compte. On ne dit ni ce que fait un capteur lent, ni la conséquence.'),
      ],
      retenir: ['Le temps de réponse compte dans les deux sens (augmentation ou diminution) ; la gravité de la conséquence dépend de la situation.'],
    },
    {
      id: 'reponse-fumee', titre: 'Temps de réponse : détecteur de fumée',
      enonce: 'Un détecteur de fumée déclenche une alarme quand la concentration en particules dépasse un seuil. Un incendie démarre dans une pièce : la concentration en particules augmente brusquement. Le temps de réponse du capteur est trop long.',
      evt: [
        V('La concentration en particules augmente brusquement au début de l’incendie', 'C’est l’événement que le capteur doit suivre sans délai excessif.'),
        F('La concentration en particules reste faible', 'Ce serait l’état normal, sans incendie. L’événement à détecter est justement l’augmentation brusque.'),
        F('La pièce se refroidit', 'Un incendie réchauffe la pièce : l’événement important est l’apparition de la fumée.'),
      ],
      lent: [
        V('Le signal reste trop longtemps sous le seuil : le système croit qu’il n’y a pas de danger', 'La valeur mesurée monte lentement vers sa valeur finale et met du temps à franchir le seuil.'),
        F('Le signal dépasse le seuil dès les premières secondes', 'C’est ce qui arriverait avec un capteur rapide.'),
        F('Le capteur déclenche l’alarme sans fumée', 'Un temps de réponse long retarde l’alarme, il ne la déclenche pas à tort.'),
      ],
      rep: [
        V('La concentration en particules augmente brusquement. Si le capteur est trop lent, le signal franchit le seuil trop tard : l’alarme se déclenche en retard et l’évacuation des personnes est retardée, ce qui augmente le risque d’intoxication.', 'Événement brusque, capteur trop lent, décision tardive, conséquence concrète : la structure est complète.'),
        F('Un détecteur de fumée doit être très sensible : plus il détecte de petites quantités de particules, plus l’alarme se déclenche tôt en cas d’incendie.', 'La sensibilité est une autre qualité : elle concerne la plus petite quantité détectable, pas la rapidité de réponse du capteur dont parle l’énoncé.'),
        F('Lors d’un incendie, la concentration en particules augmente brusquement et le capteur est lent, donc l’alarme est mauvaise.', '« Mauvaise » ne dit pas ce qui arrive : il manque la décision tardive et la conséquence concrète pour les personnes.'),
      ],
      retenir: ['Temps de réponse ≠ sensibilité : le premier concerne la rapidité, la seconde la plus petite variation détectable.'],
    },
    {
      id: 'reponse-regulation', titre: 'Temps de réponse : régulation de température',
      enonce: 'Un four de laboratoire est régulé en température : une sonde mesure la température, et le chauffage est coupé quand elle atteint la consigne (80 °C). La température du four monte vite. Le temps de réponse de la sonde est trop long.',
      evt: [
        V('La température du four monte rapidement vers la consigne', 'C’est l’évolution que la sonde doit suivre : si elle va trop vite pour elle, la mesure prend du retard.'),
        F('La consigne change toutes les secondes', 'Rien n’indique cela : la consigne reste à 80 °C.'),
        F('La température du four reste constante', 'Elle monte vers la consigne : c’est justement ce qui pose problème avec une sonde lente.'),
      ],
      lent: [
        V('La température mesurée a du retard : elle indique encore moins que la température réelle', 'Pendant que la température réelle monte, la sonde n’a pas encore atteint la valeur correspondante.'),
        F('La température mesurée dépasse la température réelle', 'Le retard donne l’inverse quand la température monte : la valeur mesurée est inférieure à la valeur réelle.'),
        F('La sonde mesure la température d’un autre point du four', 'Cela concerne l’emplacement de la sonde, pas son temps de réponse.'),
      ],
      rep: [
        V('La température du four monte rapidement. Si la sonde est trop lente, la température mesurée a du retard : le chauffage est coupé trop tard et la température réelle dépasse la consigne de 80 °C, ce qui peut abîmer les échantillons.', 'La structure est complète : événement, capteur trop lent, décision tardive, conséquence concrète.'),
        F('La température du four monte rapidement vers 80 °C ; la sonde doit donc mesurer cette température avec une très bonne précision pour que la régulation fonctionne.', 'La précision est une autre qualité : elle concerne l’écart à la valeur vraie, pas la rapidité de la sonde.'),
        F('Si la sonde est lente, le four chauffe moins bien et n’atteint jamais la consigne de 80 °C.', 'Faux : le four chauffe normalement, mais la coupure arrive trop tard. La conséquence est un dépassement de la consigne, non un chauffage insuffisant.'),
      ],
      retenir: ['Dans une régulation, un capteur trop lent provoque un retard de commande, donc un dépassement de la consigne.'],
    },
  ].map(c => ({
    id: c.id, domaine: DOM, niveau: 1, titre: c.titre,
    construire: () => ({
      enonce: c.enonce,
      etapes: [
        { id: 'evt', titre: 'L’événement brusque', q: 'Quel est l’événement brusque que le capteur doit suivre ?', aide: 'Cherchez dans l’énoncé ce qui change vite : quelle grandeur, et dans quel sens ?', o: c.evt },
        { id: 'lent', titre: 'Un capteur trop lent', q: 'Que se passe-t-il si le temps de réponse du capteur est trop long ?', aide: 'Après un changement brusque, la valeur mesurée met du temps à atteindre la nouvelle valeur : que vaut-elle pendant ce temps ?', o: c.lent },
        { id: 'rep', titre: 'La réponse rédigée', q: 'Quelle réponse explique le mieux pourquoi le temps de réponse est important ?', aide: 'Une bonne réponse nomme l’événement, dit ce que fait le capteur lent, la décision qui arrive en retard, et la conséquence concrète.', o: c.rep },
      ],
      retenir: c.retenir,
    }),
  })),

  // ── S4 : compléter un tableau bilan (nombres tirés au hasard) ──
  {
    id: 'bilan-photoresistance', domaine: DOM, niveau: 2, titre: 'Compléter un tableau bilan (éclairement, résistance, tension, N)',
    construire: () => {
      const [a, b] = tire([[45, 0.55], [50, 0.546], [60, 0.56], [55, 0.52]]);
      const Es = [200, 450, 720, 1020, 1500, 2120, 2570, 3110, 3430];
      const Rp = e => Math.round(a * Math.pow(e, -b) * 100) / 100;
      const R = tire([1.0, 2.2]), UG = 5.0;
      const Ea = tire([450, 720, 1020]), Ee = tire([2120, 2570, 3110]);
      const lignes = [['allumage', Ea], ['extinction', Ee]].map(([nom, E]) => {
        const rp = Rp(E), ur = UG * R / (R + rp), n = ur * 1023 / UG;
        return { nom, E, rp, ur, n };
      });
      const champs = (cle, lib, u, tol, fonction) => lignes.map((l, i) => ({ id: `${cle}${i}`, lib: `${lib} (${l.nom} à ${l.E} lx)`, u, vrai: fonction(l), tol }));
      return {
        enonce: `Pour régler le programme d’allumage automatique, on complète un tableau bilan. La photorésistance (caractéristique ci-dessous) est en série avec R = ${nb(R, 1)} kΩ, sous U_G = ${nb(UG, 1)} V ; on mesure la tension U_R aux bornes de R. Cette tension est convertie par un CAN 10 bits en un nombre N. Hypothèse : réponse linéaire du CAN (N = 0 pour 0 V, N = 1 023 pour 5,0 V). Spécifications : allumage à ${Ea} lx, extinction à ${Ee} lx.`,
        tableau: { entetes: ['E (lx)', ...Es.map(String)], lignes: [['R_p (kΩ)', ...Es.map(e => nb(Rp(e), 2))]] },
        etapes: [
          { id: 'rp', titre: 'Lire R_p', q: 'Lisez dans le tableau la résistance R_p aux deux éclairements des spécifications.', aide: 'Cherchez la colonne de l’éclairement (en lx), puis lisez la valeur de R_p juste en dessous.', type: 'saisie', champs: champs('rp', 'R_p', 'kΩ', 0.005, l => l.rp),
            expl: 'On lit la valeur de R_p dans la colonne de l’éclairement demandé.' },
          { id: 'ur', titre: 'Calculer U_R', q: 'Calculez U_R avec le pont diviseur (U_R est la tension aux bornes de R).', aide: 'U_R = U_G × R / (R + R_p), avec R et R_p dans la même unité (ici le kΩ).', type: 'saisie', champs: champs('ur', 'U_R', 'V', 0.025, l => l.ur),
            expl: 'U_R = U_G × R / (R + R_p) ; contrôle : 0 < U_R < U_G.' },
          { id: 'n', titre: 'Calculer N', q: 'Calculez le nombre N donné par le CAN pour chaque valeur de U_R.', aide: 'N = U_R × 1 023 / 5,0 ; N est un nombre entier compris entre 0 et 1 023.', type: 'saisie',
            champs: champs('n', 'N', '', 0.012, l => l.n).map((c, i) => ({ ...c, ok: v => { const u = Number(String(v[`ur${i}`] ?? '').replace(',', '.')); return isFinite(u) && u > 0 ? [u * 1023 / UG] : []; } })),
            expl: 'N = U_R × 1 023 / 5,0 (on peut utiliser la valeur de U_R que vous avez calculée, arrondie).' },
        ],
        retenir: ['Chaîne de calcul : éclairement → R_p (caractéristique) → U_R (pont diviseur) → N (proportionnalité). L’éclairement d’allumage donne un N plus faible que celui d’extinction, puisque U_R augmente avec l’éclairement (U_R mesurée aux bornes de R).'],
      };
    },
  },
];

// Vérifie un champ de saisie : renvoie true / false (nombre à l'unité près selon tol relatif)
export const champOk = (champ, valeurs) => {
  const x = Number(String(valeurs[champ.id] ?? '').trim().replace(',', '.').replace(/\s/g, ''));
  if (!isFinite(x) || String(valeurs[champ.id] ?? '').trim() === '') return false;
  const cibles = [champ.vrai, ...(champ.ok ? champ.ok(valeurs) : [])];
  return cibles.some(c => Math.abs(x - c) <= Math.max(Math.abs(c) * champ.tol, c === 0 ? 1e-9 : 0) + (champ.u === '' ? 1 : 0));
};
