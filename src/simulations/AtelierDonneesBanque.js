// ====================================================
//  ATELIER « EXTRAIRE LES DONNÉES D'UN ÉNONCÉ » — BANQUE D'ÉNONCÉS
// ====================================================
// Chaque énoncé est un petit problème de TSTL dont les nombres sont tirés au hasard. Il est construit par build(p, q) :
//   • texte : liste de morceaux de texte et de « données » cliquables {t: identifiant}
//   • tokens : pour chaque donnée, ce qu'elle représente (quoi), son affichage (aff) et la valeur à utiliser dans le calcul (use : val + unité)
//   • utiles : identifiants des données utiles POUR LA QUESTION posée (une même donnée peut être utile à une question et inutile à une autre)
//   • raisons : pour chaque donnée inutile, pourquoi elle l'est
//   • derivees : grandeurs à calculer avant d'appliquer la formule (surface, écart de température, section…)
//   • cherche : la grandeur cherchée (bonne réponse) et des propositions fausses plausibles
//   • manque : l'information qui n'est pas dans l'énoncé et qu'il faudra calculer ou chercher (facultatif)
//   • solution : le calcul final (affiché seulement dans le parcours guidé, pour montrer à quoi servent les données)
// Aucune de ces fonctions ne dépend de React : elles sont testables seules.

const tire = t => t[Math.floor(Math.random() * t.length)];
export const nb = (x, d = null) => (d == null
  ? Number(x).toLocaleString('fr-FR', { maximumSignificantDigits: 6 })
  : Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }));
const NB = s => s.replace(/ /g, ' ');                       // espace insécable : une donnée ne se coupe pas en fin de ligne
const sg = x => (x < 0 ? '−' + nb(Math.abs(x)) : nb(x));          // nombre avec « vrai » signe moins
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NB(aff), quoi, use: { val, u } });

export const ENONCES = [
  // ───────────────────────────── 1. Mur (transferts thermiques)
  {
    id: 'paroi', domaine: 'Transferts thermiques', titre: 'Les pertes thermiques d’un mur', noms: ['Puissance perdue', 'Coût de l’énergie perdue'],
    gen: () => ({ e: tire([15, 20, 25, 30]), L: tire([3, 4, 5, 6]), h: 2.5, lam: 0.25, Ti: tire([19, 20, 21]), Te: tire([-5, -2, 0, 2, 5]),
      an: tire([1975, 1985, 1995, 2005]), prix: 0.17, dur: 24 }),
    build: (p, q) => {
      const S = p.L * p.h, dT = p.Ti - p.Te, e = p.e / 100;
      const tokens = {
        an: tok(`${p.an}`, 'Année de construction', p.an, ''),
        L: tok(`${nb(p.L, 1)} m`, 'Longueur du mur', p.L, 'm'),
        h: tok(`${nb(p.h, 1)} m`, 'Hauteur du mur', p.h, 'm'),
        e: tok(`${p.e} cm`, 'Épaisseur du mur', e, 'm'),
        lam: tok(`${nb(p.lam, 2)} W·m⁻¹·K⁻¹`, 'Conductivité thermique de la brique', p.lam, 'W·m⁻¹·K⁻¹'),
        Ti: tok(`${sg(p.Ti)} °C`, 'Température intérieure', p.Ti, '°C'),
        Te: tok(`${sg(p.Te)} °C`, 'Température extérieure', p.Te, '°C'),
        prix: tok(`${nb(p.prix, 2)} € par kWh`, 'Prix de l’électricité', p.prix, '€·kWh⁻¹'),
      };
      const debut = ['Un mur de brique, construit en ', T('an'), ', mesure ', T('L'), ' de long et ', T('h'), ' de haut. Son épaisseur est de ', T('e'),
        ' et la conductivité thermique de la brique vaut ', T('lam'), '. La température de l’air est de ', T('Ti'), ' à l’intérieur et de ', T('Te'),
        ' à l’extérieur. L’électricité coûte ', T('prix'), '. '];
      const derivees = [
        { id: 'S', nom: 'Surface S du mur', expr: 'S = longueur × hauteur', val: S, u: 'm²' },
        { id: 'dT', nom: 'Écart de température ΔT', expr: 'ΔT = T_int − T_ext', val: dT, u: 'K' },
      ];
      const P = p.lam * S * dT / e;
      if (q === 0) return { tokens, derivees, texte: [...debut, 'Quelle est la puissance thermique perdue à travers ce mur ?'],
        utiles: ['L', 'h', 'e', 'lam', 'Ti', 'Te'],
        raisons: { an: 'La date de construction n’intervient pas dans la loi de la conduction thermique.', prix: 'Le prix servirait à calculer un coût, pas une puissance.' },
        cherche: { bonne: 'La puissance thermique P perdue par le mur (en W)', faux: ['La résistance thermique R_th du mur (en K·W⁻¹)', 'L’énergie perdue en une journée (en kWh)', 'La température à l’intérieur du mur (en °C)'] },
        manque: null, solution: { txt: 'P = λ·S·ΔT / e', val: P, u: 'W' } };
      tokens.dur = tok(`${p.dur} heures`, 'Durée', p.dur, 'h');
      return { tokens, derivees, texte: [...debut, 'Quel est le coût de l’énergie perdue à travers ce mur pendant ', T('dur'), ' ?'],
        utiles: ['L', 'h', 'e', 'lam', 'Ti', 'Te', 'prix', 'dur'],
        raisons: { an: 'La date de construction n’intervient ni dans la puissance perdue ni dans son coût.' },
        cherche: { bonne: 'Le coût de l’énergie thermique perdue (en €)', faux: ['La puissance thermique P perdue par le mur (en W)', 'La résistance thermique R_th du mur (en K·W⁻¹)', 'La consommation électrique du chauffage (en W)'] },
        manque: null, solution: { txt: 'coût = P × durée × prix, avec P = λ·S·ΔT / e', val: P / 1000 * p.dur * p.prix, u: '€' } };
    },
  },
  // ───────────────────────────── 2. Conduite (transport des fluides)
  {
    id: 'conduite', domaine: 'Transport des fluides', titre: 'Une pompe et sa conduite', noms: ['Vitesse de l’eau', 'Masse d’eau refoulée'],
    gen: () => ({ D: tire([40, 50, 63, 80]), Lc: tire([60, 120, 200]), Q: tire([9, 12, 18, 24]), Pel: tire([1.1, 1.5, 2.2]) }),
    build: (p, q) => {
      const tokens = {
        Pel: tok(`${nb(p.Pel, 1)} kW`, 'Puissance électrique de la pompe', p.Pel * 1000, 'W'),
        D: tok(`${p.D} mm`, 'Diamètre intérieur de la conduite', p.D / 1000, 'm'),
        Lc: tok(`${p.Lc} m`, 'Longueur de la conduite', p.Lc, 'm'),
        Q: tok(`${p.Q} m³·h⁻¹`, 'Débit volumique', p.Q / 3600, 'm³·s⁻¹'),
      };
      const debut = ['Une pompe de puissance électrique ', T('Pel'), ' refoule de l’eau dans une conduite cylindrique de diamètre intérieur ', T('D'),
        ' et de longueur ', T('Lc'), '. Le débit volumique est de ', T('Q'), '. '];
      const S = Math.PI * (p.D / 1000) ** 2 / 4;
      if (q === 0) return { tokens, texte: [...debut, 'Quelle est la vitesse moyenne de l’eau dans la conduite ?'],
        utiles: ['D', 'Q'],
        raisons: { Pel: 'La puissance de la pompe n’intervient pas dans la relation entre débit, section et vitesse.', Lc: 'La longueur de la conduite compte pour les pertes de charge, pas pour la vitesse de l’eau.' },
        derivees: [{ id: 'S', nom: 'Section S de la conduite', expr: 'S = π·D² / 4', val: S, u: 'm²' }],
        cherche: { bonne: 'La vitesse moyenne v de l’eau (en m·s⁻¹)', faux: ['Le débit massique de l’eau (en kg·s⁻¹)', 'La perte de charge dans la conduite (en Pa)', 'La puissance hydraulique de la pompe (en W)'] },
        manque: { bonne: 'La section S de la conduite (à calculer à partir du diamètre)', faux: ['La masse volumique de l’eau', 'La viscosité de l’eau', 'La rugosité de la conduite'],
          expl: 'La vitesse se déduit de Q = v·S : il faut S, que l’énoncé ne donne pas mais qu’on calcule avec le diamètre.' },
        solution: { txt: 'v = Q / S', val: (p.Q / 3600) / S, u: 'm·s⁻¹' } };
      tokens.tdur = tok('1 heure', 'Durée', 3600, 's');
      return { tokens, texte: [...debut, 'Quelle masse d’eau la pompe refoule-t-elle en ', T('tdur'), ' ?'],
        utiles: ['Q', 'tdur'],
        raisons: { Pel: 'La puissance de la pompe ne donne pas la masse d’eau déplacée.', D: 'Le diamètre n’intervient pas : le débit est déjà donné.', Lc: 'La longueur de la conduite n’intervient pas dans la masse d’eau refoulée.' },
        derivees: [{ id: 'V', nom: 'Volume V d’eau refoulé', expr: 'V = Q × durée', val: p.Q, u: 'm³' }],
        cherche: { bonne: 'La masse m d’eau refoulée (en kg)', faux: ['Le débit massique de l’eau (en kg·s⁻¹)', 'La vitesse moyenne de l’eau (en m·s⁻¹)', 'Le volume d’eau contenu dans la conduite (en m³)'] },
        manque: { bonne: 'La masse volumique de l’eau (à chercher : 1000 kg·m⁻³)', faux: ['La section de la conduite', 'La viscosité de l’eau', 'Rien ne manque'],
          expl: 'Pour passer d’un volume à une masse, il faut la masse volumique : m = ρ·V. L’énoncé ne la donne pas.' },
        solution: { txt: 'm = ρ·Q·durée', val: 1000 * p.Q, u: 'kg' } };
    },
  },
  // ───────────────────────────── 3. Dosage d'un comprimé (chimie analytique)
  {
    id: 'aspirine', domaine: 'Chimie', titre: 'Dosage d’un comprimé d’aspirine', noms: ['Concentration de la solution', 'Masse d’acide dans le comprimé'],
    gen: () => {
      const [VA, cB] = tire([[20, 0.1], [20, 0.05], [10, 0.05]]), m = tire([480, 500, 520]), Vf = 100;
      const VE = Math.round(((m / 180) * (VA / Vf) / cB) * 10) / 10;
      return { mc: tire([0.55, 0.6, 0.65]), M: 180, Vf, VA, cB, VE };
    },
    build: (p, q) => {
      const tokens = {
        mc: tok(`${nb(p.mc, 2)} g`, 'Masse du comprimé', p.mc, 'g'),
        M: tok(`${p.M} g·mol⁻¹`, 'Masse molaire de l’acide', p.M, 'g·mol⁻¹'),
        Vf: tok(`${nb(p.Vf, 1)} mL`, 'Volume de la fiole jaugée', p.Vf / 1000, 'L'),
        VA: tok(`${nb(p.VA, 1)} mL`, 'Volume de solution titré', p.VA / 1000, 'L'),
        cB: tok(`${nb(p.cB, 3)} mol·L⁻¹`, 'Concentration de la soude', p.cB, 'mol·L⁻¹'),
        pH: tok('8,2 à 10', 'Zone de virage de l’indicateur', 8.2, 'pH'),
        VE: tok(`${nb(p.VE, 1)} mL`, 'Volume de soude versé à l’équivalence', p.VE / 1000, 'L'),
      };
      const texte = ['Un comprimé d’aspirine, de masse ', T('mc'), ', contient de l’acide acétylsalicylique (noté AH, de masse molaire ', T('M'),
        ') et des excipients. Le comprimé est broyé puis dissous dans un mélange eau–éthanol, dans une fiole jaugée de ', T('Vf'),
        ' (solution S₀). On prélève ', T('VA'), ' de S₀ que l’on titre avec une solution de soude (Na⁺ + HO⁻) de concentration ', T('cB'),
        ', en présence de phénolphtaléine (zone de virage de pH ', T('pH'), '). L’équivalence est repérée pour un volume de soude versé de ', T('VE'), '. ',
        q === 0 ? 'Quelle est la concentration en acide acétylsalicylique de la solution S₀ ?' : 'Quelle masse d’acide acétylsalicylique contient un comprimé ?'];
      const manque = { bonne: 'L’équation de la réaction de titrage (pour relier les quantités de matière à l’équivalence)',
        faux: ['La constante d’acidité Ka du couple', 'La température du laboratoire', 'Rien ne manque'],
        expl: 'Pour relier la quantité de soude versée à celle d’acide, il faut l’équation de la réaction (ici 1 AH pour 1 HO⁻). L’énoncé ne la donne pas.' };
      const c0 = p.cB * p.VE / p.VA;
      if (q === 0) return { tokens, texte, utiles: ['VA', 'cB', 'VE'], derivees: [], manque,
        raisons: { mc: 'La masse du comprimé servirait à calculer un pourcentage en masse, pas la concentration de S₀.', M: 'La masse molaire servirait à passer d’une quantité de matière à une masse : ce n’est pas demandé ici.',
          Vf: 'Le volume de la fiole servirait à calculer la quantité de matière totale ; la concentration, elle, se déduit du titrage de la prise.', pH: 'La zone de virage sert à choisir l’indicateur, pas à calculer une concentration.' },
        cherche: { bonne: 'La concentration c₀ en acide AH de la solution S₀ (en mol·L⁻¹)', faux: ['La masse d’acide AH dans le comprimé (en g)', 'La quantité de matière de soude versée (en mol)', 'Le pourcentage en masse d’acide dans le comprimé'] },
        solution: { txt: 'c₀ = c_B·V_E / V_A', val: c0, u: 'mol·L⁻¹' } };
      return { tokens, texte, utiles: ['Vf', 'VA', 'cB', 'VE', 'M'], derivees: [], manque,
        raisons: { mc: 'La masse du comprimé entier n’intervient pas : on cherche la masse d’acide, qu’on déduit de la concentration, du volume de la fiole et de la masse molaire.', pH: 'La zone de virage sert à choisir l’indicateur, pas à calculer une masse.' },
        cherche: { bonne: 'La masse m d’acide AH dans le comprimé (en g)', faux: ['La concentration c₀ en acide AH de la solution S₀ (en mol·L⁻¹)', 'Le pourcentage en masse d’acide dans le comprimé', 'La quantité de matière de soude versée (en mol)'] },
        solution: { txt: 'm = c₀·V_f·M avec c₀ = c_B·V_E / V_A', val: c0 * (p.Vf / 1000) * p.M, u: 'g' } };
    },
  },
  // ───────────────────────────── 4. CAN (transmission de signaux numériques)
  {
    id: 'can', domaine: 'Transmission de signaux numériques', titre: 'Un capteur et son convertisseur', noms: ['Quantum du CAN', 'Plus petite variation détectable'],
    gen: () => {
      const [vmin, vmax] = tire([[0, 5], [-5, 5], [0, 3.3], [-10, 10]]);
      return { n: tire([8, 10, 12, 16]), vmin, vmax, fe: tire([1, 10, 48]), sens: tire([10, 20]) };
    },
    build: (p, q) => {
      const E = p.vmax - p.vmin, N = 2 ** p.n, qt = E / N;
      const tokens = {
        sens: tok(`${p.sens} mV·°C⁻¹`, 'Sensibilité du capteur', p.sens / 1000, 'V·°C⁻¹'),
        n: tok(`${p.n} bits`, 'Nombre de bits du CAN', p.n, 'bits'),
        vmin: tok(`${sg(p.vmin)} V`, 'Tension minimale de la plage d’entrée', p.vmin, 'V'),
        vmax: tok(`${sg(p.vmax)} V`, 'Tension maximale de la plage d’entrée', p.vmax, 'V'),
        fe: tok(`${p.fe} kHz`, 'Fréquence d’échantillonnage', p.fe * 1000, 'Hz'),
      };
      const debut = ['Un capteur de température délivre une tension proportionnelle à la température, avec une sensibilité de ', T('sens'),
        '. Cette tension est numérisée par un convertisseur analogique-numérique (CAN) de ', T('n'), ' dont la plage d’entrée va de ', T('vmin'), ' à ', T('vmax'),
        '. La fréquence d’échantillonnage est de ', T('fe'), '. '];
      const derivees = [
        { id: 'E', nom: 'Étendue de la plage d’entrée', expr: 'étendue = V_max − V_min', val: E, u: 'V' },
        { id: 'N', nom: 'Nombre de valeurs numériques possibles', expr: 'N = 2^n', val: N, u: '' },
      ];
      if (q === 0) return { tokens, derivees, texte: [...debut, 'Quel est le quantum q du CAN ?'], utiles: ['n', 'vmin', 'vmax'],
        raisons: { sens: 'La sensibilité du capteur sert à convertir une tension en température, pas à calculer le quantum du CAN.', fe: 'La fréquence d’échantillonnage fixe le nombre de mesures par seconde, pas la finesse de la numérisation.' },
        cherche: { bonne: 'Le quantum q du convertisseur (en V)', faux: ['La plus petite variation de température détectable (en °C)', 'La durée entre deux mesures (en s)', 'Le nombre de valeurs numériques possibles du CAN'] },
        manque: null, solution: { txt: 'q = (V_max − V_min) / 2^n', val: qt, u: 'V' } };
      return { tokens, texte: [...debut, 'Quelle est la plus petite variation de température que cette chaîne de mesure peut détecter ?'], utiles: ['sens', 'n', 'vmin', 'vmax'],
        derivees: [...derivees, { id: 'q', nom: 'Quantum q du CAN', expr: 'q = étendue / N', val: qt, u: 'V' }],
        raisons: { fe: 'La fréquence d’échantillonnage fixe le nombre de mesures par seconde, pas la plus petite variation détectable.' },
        cherche: { bonne: 'La plus petite variation de température détectable (en °C)', faux: ['Le quantum q du convertisseur (en V)', 'La durée entre deux mesures (en s)', 'La température maximale mesurable (en °C)'] },
        manque: null, solution: { txt: 'Δθ = q / sensibilité', val: qt / (p.sens / 1000), u: '°C' } };
    },
  },
  // ───────────────────────────── 5. Échangeur (transferts thermiques)
  {
    id: 'echangeur', domaine: 'Transferts thermiques', titre: 'Un échangeur eau chaude – eau froide', noms: ['Puissance cédée par l’eau chaude', 'Température de sortie de l’eau froide'],
    gen: () => {
      for (;;) {
        const p = { qc: tire([0.2, 0.3, 0.4]), Tce: tire([70, 80, 90]), Tcs: tire([50, 55, 60]), qf: tire([0.3, 0.5]), Tfe: tire([10, 15, 20]) };
        const Tfs = p.Tfe + p.qc * (p.Tce - p.Tcs) / p.qf;
        if (Tfs < p.Tcs - 3) return p;                              // résultat physiquement cohérent quel que soit le sens des écoulements
      }
    },
    build: (p, q) => {
      const tokens = {
        qc: tok(`${nb(p.qc, 2)} kg·s⁻¹`, 'Débit massique de l’eau chaude', p.qc, 'kg·s⁻¹'),
        Tce: tok(`${p.Tce} °C`, 'Température d’entrée de l’eau chaude', p.Tce, '°C'),
        Tcs: tok(`${p.Tcs} °C`, 'Température de sortie de l’eau chaude', p.Tcs, '°C'),
        c: tok('4,18 kJ·kg⁻¹·K⁻¹', 'Capacité thermique massique de l’eau', 4180, 'J·kg⁻¹·K⁻¹'),
        qf: tok(`${nb(p.qf, 2)} kg·s⁻¹`, 'Débit massique de l’eau froide', p.qf, 'kg·s⁻¹'),
        Tfe: tok(`${p.Tfe} °C`, 'Température d’entrée de l’eau froide', p.Tfe, '°C'),
      };
      const debut = ['Dans un échangeur thermique, de l’eau chaude, de débit massique ', T('qc'), ', entre à ', T('Tce'), ' et ressort à ', T('Tcs'),
        '. De l’eau froide, de débit massique ', T('qf'), ', entre à ', T('Tfe'), '. La capacité thermique massique de l’eau vaut ', T('c'),
        '. Les pertes thermiques vers l’extérieur sont négligées. '];
      const dTc = p.Tce - p.Tcs, P = p.qc * 4180 * dTc;
      const derivees = [{ id: 'dTc', nom: 'Variation de température de l’eau chaude', expr: 'ΔT = T_entrée − T_sortie', val: dTc, u: 'K' }];
      if (q === 0) return { tokens, derivees, texte: [...debut, 'Quelle puissance thermique l’eau chaude cède-t-elle ?'], utiles: ['qc', 'Tce', 'Tcs', 'c'],
        raisons: { qf: 'Le débit de l’eau froide ne change pas l’énergie cédée par l’eau chaude.', Tfe: 'La température d’entrée de l’eau froide ne change pas l’énergie cédée par l’eau chaude.' },
        cherche: { bonne: 'La puissance thermique cédée par l’eau chaude (en W)', faux: ['La puissance thermique reçue par l’eau froide (en W)', 'La température de sortie de l’eau froide (en °C)', 'L’écart moyen logarithmique de température (en K)'] },
        manque: null, solution: { txt: 'P = q_m,chaud · c · (T_entrée − T_sortie)', val: P, u: 'W' } };
      return { tokens, derivees: [...derivees, { id: 'P', nom: 'Puissance cédée par l’eau chaude', expr: 'P = q_m · c · ΔT', val: P, u: 'W' }],
        texte: [...debut, 'Quelle est la température de sortie de l’eau froide ?'], utiles: ['qc', 'Tce', 'Tcs', 'c', 'qf', 'Tfe'], raisons: {},
        cherche: { bonne: 'La température de sortie de l’eau froide (en °C)', faux: ['La puissance thermique cédée par l’eau chaude (en W)', 'La variation de température de l’eau chaude (en K)', 'La température moyenne dans l’échangeur (en °C)'] },
        manque: { bonne: 'Rien ne manque : les pertes sont négligées, donc l’énergie cédée par l’eau chaude est entièrement reçue par l’eau froide', faux: ['La surface d’échange de l’échangeur', 'Le coefficient global d’échange U', 'Le sens des écoulements (co-courant ou contre-courant)'],
          expl: 'Surface et coefficient U serviraient à calculer la puissance échangée à partir de l’écart de température, mais ici on la connaît par le circuit chaud. L’énoncé précise que les pertes sont négligées : P_reçue = P_cédée.' },
        solution: { txt: 'T_sortie,froid = T_entrée,froid + P / (q_m,froid · c)', val: p.Tfe + P / (p.qf * 4180), u: '°C' } };
    },
  },
  // ───────────────────────────── 6. Beer-Lambert (spectrophotométrie)
  {
    id: 'beer', domaine: 'Chimie', titre: 'Une solution de permanganate', noms: ['Concentration', 'Transmittance'],
    gen: () => ({ lam: tire([520, 525, 530]), l: tire([1, 2]), A: tire([0.25, 0.452, 0.6, 0.8]), eps: 2400, theta: tire([20, 25]) }),
    build: (p, q) => {
      const tokens = {
        lam: tok(`${p.lam} nm`, 'Longueur d’onde de la mesure', p.lam, 'nm'),
        l: tok(`${nb(p.l, 1)} cm`, 'Largeur de la cuve', p.l, 'cm'),
        A: tok(`${nb(p.A, 3)}`, 'Absorbance', p.A, ''),
        eps: tok('2,4×10³ L·mol⁻¹·cm⁻¹', 'Coefficient d’absorption molaire', p.eps, 'L·mol⁻¹·cm⁻¹'),
        theta: tok(`${p.theta} °C`, 'Température de la solution', p.theta, '°C'),
      };
      const debut = ['On mesure l’absorbance d’une solution aqueuse de permanganate de potassium à ', T('lam'), ' avec un spectrophotomètre, dans une cuve de largeur ', T('l'),
        '. On lit A = ', T('A'), '. À cette longueur d’onde, le coefficient d’absorption molaire des ions permanganate vaut ε = ', T('eps'), '. La solution est à ', T('theta'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la concentration en ions permanganate de la solution ?'], utiles: ['A', 'l', 'eps'],
        raisons: { lam: 'La longueur d’onde est déjà « contenue » dans la valeur de ε donnée pour cette longueur d’onde.', theta: 'La température n’intervient pas dans la loi de Beer-Lambert (au premier ordre).' },
        cherche: { bonne: 'La concentration c en ions permanganate (en mol·L⁻¹)', faux: ['La transmittance T de la solution', 'Le coefficient d’absorption molaire ε (en L·mol⁻¹·cm⁻¹)', 'La longueur d’onde du maximum d’absorption (en nm)'] },
        manque: null, solution: { txt: 'c = A / (ε·ℓ)', val: p.A / (p.eps * p.l), u: 'mol·L⁻¹' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle est la transmittance de la solution ?'], utiles: ['A'],
        raisons: { lam: 'La longueur d’onde n’intervient pas pour passer de l’absorbance à la transmittance.', l: 'La largeur de la cuve est déjà prise en compte dans l’absorbance mesurée.',
          eps: 'ε et ℓ relient l’absorbance à la concentration ; ici on passe directement de A à T.', theta: 'La température n’intervient pas dans la relation entre absorbance et transmittance.' },
        cherche: { bonne: 'La transmittance T de la solution (en %)', faux: ['La concentration c en ions permanganate (en mol·L⁻¹)', 'Le coefficient d’absorption molaire ε (en L·mol⁻¹·cm⁻¹)', 'L’intensité lumineuse incidente (en W·m⁻²)'] },
        manque: null, solution: { txt: 'T = 10^(−A)', val: 100 * 10 ** (-p.A), u: '%' } };
    },
  },
  // ───────────────────────────── 7. Réservoir (statique des fluides)
  {
    id: 'reservoir', domaine: 'Transport des fluides', titre: 'Un réservoir d’eau', noms: ['Pression au fond', 'Masse d’eau contenue'],
    gen: () => ({ rho: 1000, h: tire([2, 3, 4, 5]), D: tire([1, 2, 3]), Patm: tire([1010, 1013, 1020]) }),
    build: (p, q) => {
      const tokens = {
        rho: tok(`${nb(p.rho)} kg·m⁻³`, 'Masse volumique de l’eau', p.rho, 'kg·m⁻³'),
        h: tok(`${nb(p.h, 1)} m`, 'Hauteur d’eau', p.h, 'm'),
        D: tok(`${nb(p.D, 1)} m`, 'Diamètre du réservoir', p.D, 'm'),
        Patm: tok(`${p.Patm} hPa`, 'Pression atmosphérique', p.Patm * 100, 'Pa'),
      };
      const debut = ['Un réservoir cylindrique, ouvert à l’air libre, contient de l’eau (de masse volumique ', T('rho'), ') sur une hauteur de ', T('h'),
        '. Son diamètre est de ', T('D'), '. La pression atmosphérique vaut ', T('Patm'), '. '];
      const S = Math.PI * p.D ** 2 / 4;
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la pression absolue au fond du réservoir ?'], utiles: ['rho', 'h', 'Patm'],
        raisons: { D: 'La pression hydrostatique ne dépend que de la hauteur d’eau : le diamètre n’intervient pas.' },
        cherche: { bonne: 'La pression absolue au fond du réservoir (en Pa)', faux: ['La force exercée par l’eau sur le fond (en N)', 'La masse d’eau contenue dans le réservoir (en kg)', 'La pression relative à la surface libre (en Pa)'] },
        manque: { bonne: 'L’intensité de la pesanteur g (à chercher : 9,81 N·kg⁻¹)', faux: ['La viscosité de l’eau', 'La température de l’eau', 'Rien ne manque'],
          expl: 'La relation fondamentale de l’hydrostatique, P = P_atm + ρ·g·h, fait intervenir g, que l’énoncé ne donne pas.' },
        solution: { txt: 'P_fond − P_atm = ρ·g·h  (ΔP = ρ·g·Δz), donc P_fond = P_atm + ρ·g·h', val: p.Patm * 100 + p.rho * 9.81 * p.h, u: 'Pa' } };
      return { tokens, texte: [...debut, 'Quelle est la masse d’eau contenue dans le réservoir ?'], utiles: ['rho', 'h', 'D'],
        derivees: [{ id: 'S', nom: 'Section S du réservoir', expr: 'S = π·D² / 4', val: S, u: 'm²' }, { id: 'V', nom: 'Volume V d’eau', expr: 'V = S × h', val: S * p.h, u: 'm³' }],
        raisons: { Patm: 'La pression atmosphérique ne change pas la masse d’eau contenue.' },
        cherche: { bonne: 'La masse m d’eau contenue dans le réservoir (en kg)', faux: ['La pression absolue au fond du réservoir (en Pa)', 'Le poids de l’eau (en N)', 'Le débit d’eau nécessaire pour remplir le réservoir (en m³·s⁻¹)'] },
        manque: { bonne: 'Rien ne manque (π est une constante mathématique)', faux: ['L’intensité de la pesanteur g', 'La viscosité de l’eau', 'La pression au fond du réservoir'],
          expl: 'On cherche une masse, pas un poids : g n’intervient pas (m = ρ·V). Tout ce qu’il faut est dans l’énoncé.' },
        solution: { txt: 'm = ρ·V = ρ·S·h', val: p.rho * S * p.h, u: 'kg' } };
    },
  },
  // ───────────────────────────── Régulation
  {
    id: 'regulP', domaine: 'Régulation', titre: 'Régulation proportionnelle du niveau d’un réservoir', noms: ['Commande nécessaire', 'Écart statique', 'Niveau en régime permanent'],
    gen: () => ({ hc: tire([3, 4, 5]), Kp: tire([50, 80, 100, 150]), Qmax: tire([100, 120, 150]), Qp: tire([30, 36, 45, 60]), S: tire([2, 3, 4]), Ti: tire([20, 50, 100]) }),
    build: (p, q) => {
      const Y = p.Qp / p.Qmax * 100, e = Y / p.Kp;
      const tokens = {
        S: tok(`${p.S} m²`, 'Section du réservoir', p.S, 'm²'),
        Qmax: tok(`${p.Qmax} m³·h⁻¹`, 'Débit maximal de la pompe (commande de 100 %)', p.Qmax, 'm³·h⁻¹'),
        Qp: tok(`${p.Qp} m³·h⁻¹`, 'Débit de soutirage', p.Qp, 'm³·h⁻¹'),
        hc: tok(`${p.hc} m`, 'Consigne de niveau', p.hc, 'm'),
        Kp: tok(`${p.Kp} %·m⁻¹`, 'Gain proportionnel du régulateur', p.Kp, '%·m⁻¹'),
        Ti: tok(`${p.Ti} h`, 'Temps intégral (réglage d’un régulateur PI)', p.Ti, 'h'),
      };
      const debut = ['Un réservoir de section ', T('S'), ' est rempli par une pompe dont le débit est proportionnel à la commande Y (100 % ↔ ', T('Qmax'), '). Un soutirage constant de ', T('Qp'),
        ' vide le réservoir. Le régulateur proportionnel calcule Y = K_p × (consigne − H) avec K_p = ', T('Kp'), ' ; la consigne est de ', T('hc'), '. Le régulateur dispose aussi d’un réglage de temps intégral de ', T('Ti'), ' (inutilisé en régulation P). '];
      const rS = 'La section règle la vitesse d’évolution du niveau, pas sa valeur en régime permanent.', rTi = 'Le temps intégral ne sert qu’en régulation PI : ici le régulateur est proportionnel.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'En régime permanent, quelle commande Y le régulateur doit-il envoyer à la pompe ?'], utiles: ['Qmax', 'Qp'],
        raisons: { S: rS, hc: 'La consigne intervient dans le calcul de l’écart, pas dans la commande nécessaire pour compenser le soutirage.', Kp: 'Le gain relie la commande à l’écart de niveau, mais ne dit pas quelle commande est nécessaire.', Ti: rTi },
        cherche: { bonne: 'La commande Y qui compense exactement le soutirage (en %)', faux: ['Le niveau de liquide en régime permanent (en m)', 'L’écart entre la consigne et le niveau (en m)', 'Le débit de la pompe (en m³·h⁻¹)'] },
        manque: { bonne: 'Rien ne manque : le débit de la pompe est proportionnel à Y', faux: ['La masse volumique du liquide', 'La hauteur du réservoir', 'Le temps de réponse du capteur'],
          expl: 'En régime permanent, le niveau est stable : le débit de la pompe est égal au soutirage, donc Y/100 × Q_max = Q_p.' },
        solution: { txt: 'Y = Q_p / Q_max × 100', val: Y, u: '%' } };
      if (q === 1) return { tokens, texte: [...debut, 'Quel est l’écart statique (consigne − niveau) en régime permanent ?'], utiles: ['Qmax', 'Qp', 'Kp'],
        derivees: [{ id: 'Y', nom: 'Commande nécessaire', expr: 'Y = Q_p / Q_max × 100', val: Y, u: '%' }],
        raisons: { S: rS, hc: 'L’écart ne dépend pas de la valeur de la consigne, seulement de la commande à fournir et du gain.', Ti: rTi },
        cherche: { bonne: 'L’écart statique entre la consigne et le niveau (en m)', faux: ['La commande Y (en %)', 'Le niveau de liquide (en m)', 'Le temps pour atteindre le régime permanent (en h)'] },
        manque: { bonne: 'Rien ne manque : la commande s’écrit Y = K_p × écart', faux: ['La hauteur du réservoir', 'La masse volumique du liquide', 'Le temps de réponse de la pompe'],
          expl: 'Le régulateur ne fournit Y que s’il y a un écart : écart = Y / K_p.' },
        solution: { txt: 'écart = Y / K_p', val: e, u: 'm' } };
      return { tokens, texte: [...debut, 'Quel est le niveau du liquide en régime permanent ?'], utiles: ['Qmax', 'Qp', 'Kp', 'hc'],
        derivees: [{ id: 'Y', nom: 'Commande nécessaire', expr: 'Y = Q_p / Q_max × 100', val: Y, u: '%' }, { id: 'e', nom: 'Écart statique', expr: 'écart = Y / K_p', val: e, u: 'm' }],
        raisons: { S: rS, Ti: rTi },
        cherche: { bonne: 'Le niveau H en régime permanent (en m)', faux: ['L’écart statique (en m)', 'La commande Y (en %)', 'La consigne de niveau (en m)'] },
        manque: { bonne: 'Rien ne manque : le niveau se déduit de la consigne et de l’écart', faux: ['La hauteur du réservoir', 'La masse volumique du liquide', 'La vitesse de remplissage'],
          expl: 'Un régulateur proportionnel laisse le niveau sous la consigne (le soutirage demande une commande non nulle) : H = consigne − écart.' },
        solution: { txt: 'H = consigne − écart', val: p.hc - e, u: 'm' } };
    },
  },
  {
    id: 'premord', domaine: 'Régulation', titre: 'Réponse d’un capteur de température (1er ordre)', noms: ['Temps de réponse à 5 %', 'Température lue après une durée t'],
    gen: () => {
      const tau = tire([15, 20, 30, 40]), k = tire([1, 2, 3]);
      return { tau, T0: tire([15, 20, 25]), Tf: tire([60, 80, 100]), t: tau * k, res: tire([0.1, 0.5]), m: tire([12, 15, 20]) };
    },
    build: (p, q) => {
      const tokens = {
        tau: tok(`${p.tau} s`, 'Constante de temps du capteur', p.tau, 's'),
        T0: tok(`${p.T0} °C`, 'Température initiale du capteur', p.T0, '°C'),
        Tf: tok(`${p.Tf} °C`, 'Température du bain', p.Tf, '°C'),
        t: tok(`${p.t} s`, 'Durée écoulée depuis l’immersion', p.t, 's'),
        res: tok(`${nb(p.res, 1)} °C`, 'Résolution de l’afficheur', p.res, '°C'),
        m: tok(`${p.m} g`, 'Masse du capteur', p.m, 'g'),
      };
      const debut = ['Un capteur de température se comporte comme un système du 1er ordre de constante de temps ', T('tau'), '. À l’instant initial, il est à ', T('T0'), ' et on le plonge dans un bain à ', T('Tf'),
        '. L’afficheur a une résolution de ', T('res'), ' et le capteur a une masse de ', T('m'), '. '];
      const rRes = 'La résolution de l’afficheur ne change pas la réponse du capteur.', rM = 'La masse est déjà prise en compte dans la constante de temps donnée.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le temps de réponse du capteur à 5 % ?'], utiles: ['tau'],
        raisons: { T0: 'Un temps de réponse à 5 % ne dépend pas des températures de départ et d’arrivée.', Tf: 'Un temps de réponse à 5 % ne dépend pas des températures de départ et d’arrivée.', t: 'Cette durée est celle d’une lecture, pas le temps de réponse du capteur.', res: rRes, m: rM },
        cherche: { bonne: 'Le temps de réponse à 5 % : durée au bout de laquelle le capteur est à 5 % de sa valeur finale (en s)', faux: ['La température du capteur à l’instant t (en °C)', 'La constante de temps τ (en s)', 'La durée pour atteindre exactement la température du bain (en s)'] },
        manque: { bonne: 'Le lien entre temps de réponse à 5 % et τ (t₅ % = 3·τ, à connaître)', faux: ['La capacité thermique du capteur', 'La conductivité thermique du bain', 'Rien ne manque'],
          expl: 'Pour un système du 1er ordre, la sortie atteint 95 % de sa valeur finale à t ≈ 3·τ : cette relation n’est pas dans l’énoncé.' },
        solution: { txt: 't₅ % ≈ 3 × τ', val: 3 * p.tau, u: 's' } };
      const f = 1 - Math.exp(-p.t / p.tau), dT = p.Tf - p.T0;
      return { tokens, texte: [...debut, 'Quelle température le capteur indique-t-il ', T('t'), ' après l’immersion ?'], utiles: ['tau', 'T0', 'Tf', 't'],
        derivees: [{ id: 'dT', nom: 'Écart total à parcourir', expr: 'ΔT = T_f − T_0', val: dT, u: '°C' }, { id: 'f', nom: 'Fraction de l’écart atteinte', expr: 'f = 1 − e^(−t/τ)', val: f, u: '' }],
        raisons: { res: rRes, m: rM },
        cherche: { bonne: 'La température indiquée par le capteur à l’instant t (en °C)', faux: ['Le temps de réponse à 5 % (en s)', 'La température du bain (en °C)', 'La constante de temps τ (en s)'] },
        manque: { bonne: 'La relation de la réponse d’un 1er ordre : T = T_f − (T_f − T_0)·e^(−t/τ)', faux: ['La capacité thermique du capteur', 'La conductivité thermique du bain', 'Rien ne manque'],
          expl: 'La réponse d’un système du 1er ordre à un échelon suit une exponentielle : cette relation n’est pas dans l’énoncé.' },
        solution: { txt: 'T = T_0 + (T_f − T_0)·(1 − e^(−t/τ))', val: p.T0 + dT * f, u: '°C' } };
    },
  },
  // ───────────────────────────── Distillation
  {
    id: 'distil', domaine: 'Distillation', titre: 'Distillation d’un mélange eau–éthanol', noms: ['Volume d’éthanol présent', 'Rendement de la distillation'],
    gen: () => {
      const V = tire([200, 250, 300, 400, 500]), x = tire([10, 12, 15, 20]), y = tire([80, 85, 90]), P = tire([400, 500, 600]);
      const Vd = Math.round(V * x / 100 * tire([0.6, 0.7, 0.75, 0.8]) / (y / 100));
      return { V, x, y, P, Vd, Te: 78.4 };
    },
    build: (p, q) => {
      const tokens = {
        V: tok(`${p.V} mL`, 'Volume du mélange initial', p.V, 'mL'),
        x: tok(`${p.x} %`, 'Proportion d’éthanol dans le mélange (en volume)', p.x, '%'),
        P: tok(`${p.P} W`, 'Puissance du chauffe-ballon', p.P, 'W'),
        Te: tok(`${nb(p.Te, 1)} °C`, 'Température d’ébullition de l’éthanol', p.Te, '°C'),
        Vd: tok(`${p.Vd} mL`, 'Volume de distillat recueilli', p.Vd, 'mL'),
        y: tok(`${p.y} %`, 'Proportion d’éthanol dans le distillat (en volume)', p.y, '%'),
      };
      const debut = ['On distille ', T('V'), ' d’un mélange eau–éthanol qui contient ', T('x'), ' d’éthanol en volume. Le chauffe-ballon a une puissance de ', T('P'),
        '. L’éthanol bout à ', T('Te'), ' (l’eau à 100 °C). On recueille ', T('Vd'), ' d’un distillat qui contient ', T('y'), ' d’éthanol en volume. '];
      const Vi = p.V * p.x / 100, Vr = p.Vd * p.y / 100;
      const rTemp = 'La température d’ébullition explique la séparation, mais n’entre pas dans le calcul d’un volume ou d’un rendement.';
      const rPuis = 'La puissance de chauffe fixe la durée de la distillation, pas les volumes.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel volume d’éthanol contenait le mélange initial ?'], utiles: ['V', 'x'],
        raisons: { P: rPuis, Te: rTemp, Vd: 'Le distillat est ce que l’on récupère après la distillation : il ne dit pas ce qu’il y avait au départ.', y: 'La pureté du distillat concerne ce que l’on récupère, pas le mélange initial.' },
        cherche: { bonne: 'Le volume d’éthanol présent dans le mélange initial (en mL)', faux: ['Le volume d’éthanol récupéré dans le distillat (en mL)', 'Le rendement de la distillation (en %)', 'La masse d’éthanol présente (en g)'] },
        manque: { bonne: 'Rien ne manque : un pourcentage en volume suffit', faux: ['La masse volumique de l’éthanol', 'La pression atmosphérique', 'La température du mélange'],
          expl: 'Un pourcentage en volume s’applique à un volume : V_éthanol = x × V. Aucune masse volumique n’est nécessaire.' },
        solution: { txt: 'V_éthanol = (x / 100) × V', val: Vi, u: 'mL' } };
      return { tokens, texte: [...debut, 'Quel est le rendement de la distillation (volume d’éthanol récupéré par rapport au volume d’éthanol présent) ?'], utiles: ['V', 'x', 'Vd', 'y'],
        derivees: [{ id: 'Vi', nom: 'Volume d’éthanol présent au départ', expr: 'V_i = V × x / 100', val: Vi, u: 'mL' }, { id: 'Vr', nom: 'Volume d’éthanol dans le distillat', expr: 'V_r = V_distillat × y / 100', val: Vr, u: 'mL' }],
        raisons: { P: rPuis, Te: rTemp },
        cherche: { bonne: 'Le rendement : volume d’éthanol récupéré divisé par volume d’éthanol présent (en %)', faux: ['Le volume total de distillat (en mL)', 'La pureté du distillat (en %)', 'Le volume d’éthanol perdu (en mL)'] },
        manque: { bonne: 'Rien ne manque : tout est dans l’énoncé', faux: ['La masse volumique de l’éthanol', 'La durée de la distillation', 'La pression atmosphérique'],
          expl: 'Les deux quantités d’éthanol se calculent à partir de volumes et de pourcentages en volume ; le rendement est leur rapport.' },
        solution: { txt: 'η = V_r / V_i × 100', val: Vr / Vi * 100, u: '%' } };
    },
  },
  // ───────────────────────────── Évaporation et cristallisation
  {
    id: 'cristal', domaine: 'Évaporation et cristallisation', titre: 'Refroidir une solution saturée de nitrate de potassium', noms: ['Masse dissoute à 60 °C', 'Masse de cristaux obtenue'],
    gen: () => ({ me: tire([100, 150, 200, 250, 500]), s60: 110, s20: 32, dur: tire([30, 45, 60]), mb: tire([80, 120, 150]) }),
    build: (p, q) => {
      const tokens = {
        me: tok(`${p.me} g`, 'Masse d’eau', p.me, 'g'),
        mb: tok(`${p.mb} g`, 'Masse du bécher vide', p.mb, 'g'),
        s60: tok(`${p.s60} g pour 100 g d’eau`, 'Solubilité du nitrate de potassium à 60 °C', p.s60, 'g pour 100 g d’eau'),
        s20: tok(`${p.s20} g pour 100 g d’eau`, 'Solubilité du nitrate de potassium à 20 °C', p.s20, 'g pour 100 g d’eau'),
        dur: tok(`${p.dur} minutes`, 'Durée du refroidissement', p.dur, 'min'),
      };
      const debut = ['On prépare à 60 °C une solution saturée de nitrate de potassium dans ', T('me'), ' d’eau, dans un bécher de masse ', T('mb'), ' (vide). À 60 °C, la solubilité du nitrate de potassium est de ',
        T('s60'), ' ; à 20 °C, elle est de ', T('s20'), '. On refroidit la solution lentement jusqu’à 20 °C en ', T('dur'), '. '];
      const m60 = p.s60 * p.me / 100, m20 = p.s20 * p.me / 100;
      const rB = 'Le bécher n’intervient pas dans la quantité de soluté dissous.', rD = 'La durée du refroidissement ne change pas les masses à l’équilibre.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle masse de nitrate de potassium est dissoute dans la solution à 60 °C ?'], utiles: ['me', 's60'],
        raisons: { mb: rB, dur: rD, s20: 'Cette solubilité concerne 20 °C : la solution de départ est à 60 °C.' },
        cherche: { bonne: 'La masse de nitrate de potassium dissoute à 60 °C (en g)', faux: ['La masse de cristaux formés au refroidissement (en g)', 'La masse de nitrate de potassium encore dissoute à 20 °C (en g)', 'La masse totale de solution (en g)'] },
        manque: { bonne: 'Rien ne manque : la solubilité est donnée pour 100 g d’eau et la masse d’eau est connue', faux: ['La masse volumique de la solution', 'La masse molaire du nitrate de potassium', 'La température de cristallisation'],
          expl: 'La solubilité est proportionnelle à la masse d’eau : on ramène la valeur donnée « pour 100 g d’eau » à la masse d’eau de l’énoncé.' },
        solution: { txt: 'm_dissoute(60 °C) = s₆₀ × m_eau / 100', val: m60, u: 'g' } };
      return { tokens, texte: [...debut, 'Quelle masse de cristaux obtient-on à 20 °C ?'], utiles: ['me', 's60', 's20'],
        derivees: [{ id: 'm60', nom: 'Masse dissoute à 60 °C', expr: 'm₆₀ = s₆₀ × m_eau / 100', val: m60, u: 'g' }, { id: 'm20', nom: 'Masse encore dissoute à 20 °C', expr: 'm₂₀ = s₂₀ × m_eau / 100', val: m20, u: 'g' }],
        raisons: { mb: rB, dur: rD },
        cherche: { bonne: 'La masse de cristaux formés au refroidissement (en g)', faux: ['La masse de nitrate de potassium dissoute à 60 °C (en g)', 'La masse de nitrate de potassium encore dissoute à 20 °C (en g)', 'La masse totale de solution à 60 °C (en g)'] },
        manque: { bonne: 'Rien ne manque : les deux solubilités et la masse d’eau suffisent', faux: ['La masse volumique de la solution', 'La masse molaire du nitrate de potassium', 'La vitesse de refroidissement'],
          expl: 'Ce qui cristallise est la différence entre la masse dissoute à 60 °C et celle qui peut encore l’être à 20 °C.' },
        solution: { txt: 'm_cristaux = m₆₀ − m₂₀', val: m60 - m20, u: 'g' } };
    },
  },
  // ───────────────────────────── Mouvement et vitesse (seconde)
  {
    id: 'trajet', domaine: 'Mouvement et vitesse', titre: 'Un trajet en train', noms: ['Vitesse moyenne du train', 'Durée d’un autre trajet'],
    gen: () => { const v = tire([80, 100, 120, 150]), dur = tire([90, 120, 150, 180]), h0 = tire([7, 8, 9, 14]), m0 = tire([0, 15, 30, 45]);
      return { v, dur, h0, m0, d: v * dur / 60, pass: tire([180, 240, 320, 410]), prix: tire([24, 32, 45]) }; },
    build: (p, q) => {
      const hm = min => `${Math.floor(min / 60) % 24} h ${String(min % 60).padStart(2, '0')}`;
      const dep = p.h0 * 60 + p.m0, arr = dep + p.dur;
      const tokens = {
        d: tok(`${p.d} km`, 'Distance parcourue par le train', p.d, 'km'),
        dep: tok(hm(dep), 'Heure de départ', dep / 60, 'h'),
        arr: tok(hm(arr), 'Heure d’arrivée', arr / 60, 'h'),
        pass: tok(`${p.pass} passagers`, 'Nombre de passagers', p.pass, ''),
        prix: tok(`${p.prix} €`, 'Prix du billet', p.prix, '€'),
      };
      if (q === 0) return { tokens,
        derivees: [{ id: 'dt', nom: 'Durée Δt du trajet', expr: 'Δt = heure d’arrivée − heure de départ', val: p.dur / 60, u: 'h' }],
        texte: ['Un train part de la gare à ', T('dep'), ' et arrive à destination à ', T('arr'), '. Il transporte ', T('pass'), ' et parcourt ', T('d'), '. Le billet coûte ', T('prix'), '. Quelle est la vitesse moyenne du train ?'],
        utiles: ['d', 'dep', 'arr'],
        raisons: { pass: 'Le nombre de passagers ne change pas la vitesse du train dans cet exercice.', prix: 'Le prix du billet n’a aucun rapport avec la vitesse.' },
        cherche: { bonne: 'La vitesse moyenne v du train (en km·h⁻¹)', faux: ['La distance parcourue par le train (en km)', 'La durée du trajet (en h)', 'L’accélération du train (en m·s⁻²)'] },
        manque: null, solution: { txt: 'v = d / Δt', val: p.v, u: 'km·h⁻¹' } };
      tokens.v = tok(`${p.v} km·h⁻¹`, 'Vitesse moyenne d’un autre train', p.v, 'km·h⁻¹');
      return { tokens, derivees: [],
        texte: ['Un autre train roule à la vitesse moyenne de ', T('v'), '. Il part à ', T('dep'), ' avec ', T('pass'), ' et doit parcourir ', T('d'), '. Combien de temps dure ce trajet ?'],
        utiles: ['v', 'd'],
        raisons: { dep: 'L’heure de départ permettrait de calculer l’heure d’arrivée, mais on demande seulement la durée.', pass: 'Le nombre de passagers ne change pas la durée du trajet.', prix: 'Le prix du billet n’a aucun rapport avec la durée.' },
        cherche: { bonne: 'La durée Δt du trajet (en h)', faux: ['La vitesse moyenne du train (en km·h⁻¹)', 'L’heure d’arrivée (en h)', 'La distance parcourue (en km)'] },
        manque: null, solution: { txt: 'Δt = d / v', val: p.dur / 60, u: 'h' } };
    },
  },
  {
    id: 'course', domaine: 'Mouvement et vitesse', titre: 'Une course à pied', noms: ['Vitesse en m·s⁻¹', 'Distance parcourue en roulant'],
    gen: () => ({ d: tire([5, 6, 8, 10]), t: tire([25, 30, 40, 50]), v: tire([8, 10, 12, 15]), tv: tire([30, 45, 90]), age: tire([17, 24, 31, 45]), dos: tire([128, 245, 316, 470]) }),
    build: (p, q) => {
      const tokens = {
        age: tok(`${p.age} ans`, 'Âge de la personne', p.age, 'ans'),
        dos: tok(`n° ${p.dos}`, 'Numéro de dossard', p.dos, ''),
      };
      if (q === 0) {
        tokens.d = tok(`${p.d} km`, 'Distance parcourue', p.d * 1000, 'm');
        tokens.t = tok(`${p.t} min`, 'Durée de la course', p.t * 60, 's');
        return { tokens, derivees: [],
          texte: ['Un coureur de ', T('age'), ' porte le dossard ', T('dos'), '. Il parcourt ', T('d'), ' en ', T('t'), '. Quelle est sa vitesse moyenne, en mètres par seconde ?'],
          utiles: ['d', 't'],
          raisons: { age: 'L’âge du coureur ne change pas le calcul de sa vitesse.', dos: 'Le numéro de dossard sert à identifier le coureur, pas à calculer sa vitesse.' },
          cherche: { bonne: 'La vitesse moyenne v du coureur (en m·s⁻¹)', faux: ['La distance parcourue (en m)', 'La durée de la course (en s)', 'La vitesse du coureur (en km·h⁻¹)'] },
          manque: null, solution: { txt: 'v = d / Δt, avec d en m et Δt en s', val: p.d * 1000 / (p.t * 60), u: 'm·s⁻¹' } };
      }
      tokens.v = tok(`${p.v} km·h⁻¹`, 'Vitesse du cycliste', p.v, 'km·h⁻¹');
      tokens.tv = tok(`${p.tv} min`, 'Durée du trajet à vélo', p.tv / 60, 'h');
      return { tokens, derivees: [],
        texte: ['Un cycliste de ', T('age'), ' roule à la vitesse constante de ', T('v'), ' pendant ', T('tv'), '. Il porte le dossard ', T('dos'), '. Quelle distance parcourt-il, en kilomètres ?'],
        utiles: ['v', 'tv'],
        raisons: { age: 'L’âge du cycliste ne change pas la distance parcourue.', dos: 'Le numéro de dossard ne sert pas dans le calcul.' },
        cherche: { bonne: 'La distance d parcourue par le cycliste (en km)', faux: ['La vitesse du cycliste (en km·h⁻¹)', 'La durée du trajet (en h)', 'Le nombre de tours de roue'] },
        manque: null, solution: { txt: 'd = v × Δt, avec Δt en h', val: p.v * p.tv / 60, u: 'km' } };
    },
  },
  // ───────────────────────────── Interactions et champs (1re spécialité)
  {
    id: 'gravi', domaine: 'Interactions et champs', titre: 'Interaction gravitationnelle', noms: ['Force entre deux satellites', 'Champ de gravitation d’une planète'],
    gen: () => { const [M, ex, R] = tire([[6.42, 23, 3390], [4.87, 24, 6052], [5.97, 24, 6371]]); return { M, ex, R, m1: tire([2, 5, 8]), m2: tire([3, 4, 6]), d: tire([10, 20, 50]), an: tire([1999, 2008, 2015]),
      h: tire([200, 400, 800]), m: tire([50, 70, 90]), G: 6.674e-11 }; },
    build: (p, q) => {
      const sci = x => nb(Number((x).toPrecision(3))).replace('.', ',');
      const tokens = { G: tok('G = 6,674 × 10⁻¹¹ N·m²·kg⁻²', 'Constante de gravitation universelle', p.G, 'N·m²·kg⁻²') };
      if (q === 0) {
        tokens.m1 = tok(`${p.m1} tonnes`, 'Masse du satellite 1', p.m1 * 1000, 'kg');
        tokens.m2 = tok(`${p.m2} tonnes`, 'Masse du satellite 2', p.m2 * 1000, 'kg');
        tokens.d = tok(`${p.d} m`, 'Distance entre les centres des satellites', p.d, 'm');
        tokens.an = tok(`${p.an}`, 'Année de lancement', p.an, '');
        return { tokens, derivees: [],
          texte: ['Deux satellites, lancés en ', T('an'), ', ont pour masses ', T('m1'), ' et ', T('m2'), '. Leurs centres sont distants de ', T('d'), '. On donne ', T('G'), '. Quelle est la valeur de la force d’attraction gravitationnelle entre eux ?'],
          utiles: ['G', 'm1', 'm2', 'd'],
          raisons: { an: 'L’année de lancement n’intervient pas dans la loi de la gravitation.' },
          cherche: { bonne: 'La force gravitationnelle F entre les deux satellites (en N)', faux: ['Le champ de gravitation créé par un satellite (en N·kg⁻¹)', 'L’énergie des satellites (en J)', 'La vitesse des satellites (en m·s⁻¹)'] },
          manque: null, solution: { txt: 'F = G·m₁·m₂ / d²', val: p.G * p.m1 * p.m2 * 1e6 / (p.d * p.d), u: 'N' } };
      }
      tokens.M = tok(`${sci(p.M)} × 10${p.ex === 23 ? '²³' : '²⁴'} kg`, 'Masse de la planète', p.M * Math.pow(10, p.ex), 'kg');
      tokens.R = tok(`${p.R} km`, 'Rayon de la planète', p.R * 1000, 'm');
      tokens.h = tok(`${p.h} km`, 'Altitude du point étudié', p.h * 1000, 'm');
      tokens.m = tok(`${p.m} kg`, 'Masse d’une sonde posée sur le sol', p.m, 'kg');
      return { tokens,
        derivees: [{ id: 'd', nom: 'Distance d au centre de la planète', expr: 'd = rayon + altitude', val: (p.R + p.h) * 1000, u: 'm' }],
        texte: ['Une planète sphérique de masse ', T('M'), ' a un rayon de ', T('R'), '. Une sonde de ', T('m'), ' est posée sur le sol. On cherche le champ de gravitation créé par la planète en un point situé à l’altitude ', T('h'), '. On donne ', T('G'), '.'],
        utiles: ['G', 'M', 'R', 'h'],
        raisons: { m: 'Le champ de gravitation créé par la planète ne dépend pas de la masse de la sonde qui s’y trouve.' },
        cherche: { bonne: 'Le champ de gravitation g créé par la planète à cette altitude (en N·kg⁻¹)', faux: ['La force subie par la sonde (en N)', 'La masse de la planète (en kg)', 'La vitesse de libération de la sonde (en m·s⁻¹)'] },
        manque: null, solution: { txt: 'g = G·M / d², avec d = R + h', val: p.G * p.M * Math.pow(10, p.ex) / Math.pow((p.R + p.h) * 1000, 2), u: 'N·kg⁻¹' } };
    },
  },
  {
    id: 'electro', domaine: 'Interactions et champs', titre: 'Interaction électrostatique', noms: ['Force entre deux charges', 'Force dans un champ uniforme'],
    gen: () => ({ q1: tire([2, 4, 5]), q2: tire([3, 6, 8]), d: tire([2, 4, 5]), U: tire([100, 200, 300]), e: tire([2, 4, 5]), q: tire([2, 5, 10]), mp: tire([20, 50, 100]) }),
    build: (p, q) => {
      const tokens = {};
      if (q === 0) {
        tokens.k = tok('k = 9,0 × 10⁹ N·m²·C⁻²', 'Constante de la loi de Coulomb', 9.0e9, 'N·m²·C⁻²');
        tokens.q1 = tok(`${p.q1} nC`, 'Charge de la bille 1', p.q1 * 1e-9, 'C');
        tokens.q2 = tok(`${p.q2} nC`, 'Charge de la bille 2', p.q2 * 1e-9, 'C');
        tokens.d = tok(`${p.d} cm`, 'Distance entre les billes', p.d * 1e-2, 'm');
        tokens.mp = tok(`${p.mp} g`, 'Masse de chaque bille', p.mp * 1e-3, 'kg');
        return { tokens, derivees: [],
          texte: ['Deux petites billes de ', T('mp'), ' portent des charges de ', T('q1'), ' et ', T('q2'), '. Leurs centres sont distants de ', T('d'), '. On donne ', T('k'), '. Quelle est la valeur de la force électrostatique entre les billes ?'],
          utiles: ['k', 'q1', 'q2', 'd'],
          raisons: { mp: 'La masse des billes n’intervient pas dans la loi de Coulomb (elle servirait pour calculer leur poids ou leur accélération).' },
          cherche: { bonne: 'La force électrostatique F entre les deux billes (en N)', faux: ['Le champ électrique créé par une bille (en V·m⁻¹)', 'La charge totale des billes (en C)', 'Le poids des billes (en N)'] },
          manque: null, solution: { txt: 'F = k·|q₁·q₂| / d²', val: 9.0e9 * p.q1 * 1e-9 * p.q2 * 1e-9 / Math.pow(p.d * 1e-2, 2), u: 'N' } };
      }
      tokens.U = tok(`${p.U} V`, 'Tension entre les plaques', p.U, 'V');
      tokens.e = tok(`${p.e} mm`, 'Distance entre les plaques', p.e * 1e-3, 'm');
      tokens.q = tok(`${p.q} nC`, 'Charge de la petite boule', p.q * 1e-9, 'C');
      tokens.mp = tok(`${p.mp} mg`, 'Masse de la petite boule', p.mp * 1e-6, 'kg');
      return { tokens,
        derivees: [{ id: 'E', nom: 'Valeur du champ électrique E entre les plaques', expr: 'E = U / distance', val: p.U / (p.e * 1e-3), u: 'V·m⁻¹' }],
        texte: ['Deux plaques parallèles, distantes de ', T('e'), ', sont reliées à un générateur qui impose une tension de ', T('U'), '. Une petite boule de ', T('mp'), ', portant une charge de ', T('q'), ', est placée entre les plaques. Quelle est la valeur de la force électrique qu’elle subit ?'],
        utiles: ['U', 'e', 'q'],
        raisons: { mp: 'La masse de la boule n’intervient pas dans la force électrique F = q·E (elle servirait pour son poids).' },
        cherche: { bonne: 'La force électrique F subie par la boule (en N)', faux: ['Le champ électrique E entre les plaques (en V·m⁻¹)', 'Le poids de la boule (en N)', 'L’énergie de la boule (en J)'] },
        manque: null, solution: { txt: 'F = q·E, avec E = U / distance', val: p.q * 1e-9 * p.U / (p.e * 1e-3), u: 'N' } };
    },
  },
];

// Mélange reproductible (pour que l’ordre des propositions ne change pas à chaque affichage)
export function melange(tab, graine) {
  const a = tab.slice(); let s = (graine * 2654435761) >>> 0 || 1;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 1664525 + 1013904223) >>> 0; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Symbole de chaque donnée tel qu'il apparaît dans la formule (affiché à côté du nom de la grandeur)
const SYMBOLES = {
  paroi: { an: '', L: 'L', h: 'h', e: 'e', lam: 'λ', Ti: 'T_int', Te: 'T_ext', prix: 'prix', dur: 'durée' },
  conduite: { Pel: 'P_él', D: 'D', Lc: 'L', Q: 'Q_V', tdur: 'Δt' },
  aspirine: { mc: 'm_comprimé', M: 'M', Vf: 'V_f', VA: 'V_A', cB: 'c_B', pH: 'pH', VE: 'V_E' },
  can: { sens: 's', n: 'n', vmin: 'V_min', vmax: 'V_max', fe: 'f_e' },
  echangeur: { qc: 'q_m,chaud', Tce: 'T_ce', Tcs: 'T_cs', c: 'c', qf: 'q_m,froid', Tfe: 'T_fe' },
  beer: { lam: 'λ', l: 'ℓ', A: 'A', eps: 'ε', theta: 'θ' },
  reservoir: { rho: 'ρ', h: 'h', D: 'D', Patm: 'P_atm' },
  regulP: { hc: 'consigne', Kp: 'K_p', Qmax: 'Q_max', Qp: 'Q_p', S: 'S', Ti: 'T_i' },
  premord: { tau: 'τ', T0: 'T₀', Tf: 'T_f', t: 't', res: '', m: 'm' },
  distil: { V: 'V', x: 'x', y: 'y', Vd: 'V_distillat', Te: 'θ_éb', P: 'P' },
  cristal: { me: 'm_eau', mb: 'm_bécher', s60: 's₆₀', s20: 's₂₀', dur: 'Δt' },
};
export function nouvelEnonce(id, q, forceParams) {
  const def = ENONCES.find(e => e.id === id);
  const p = forceParams || def.gen();
  const b = def.build(p, q);
  Object.entries(b.tokens).forEach(([k, t]) => { t.sym = (SYMBOLES[id] || {})[k] || ''; });
  return { id, q, p, b, graine: 1 + Math.floor(Math.random() * 99999) };
}
