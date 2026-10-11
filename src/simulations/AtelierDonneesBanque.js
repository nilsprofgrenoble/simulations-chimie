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
    id: 'aspirine', domaine: 'Dosage', titre: 'Dosage d’un comprimé d’aspirine', noms: ['Concentration de la solution', 'Masse d’acide dans le comprimé'],
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
    id: 'can', domaine: 'Chaîne de mesure', titre: 'Un capteur et son convertisseur', noms: ['Quantum du CAN', 'Plus petite variation détectable'],
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
    id: 'beer', domaine: 'Spectrophotométrie', titre: 'Une solution de permanganate', noms: ['Concentration', 'Transmittance'],
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
    id: 'reservoir', domaine: 'Statique des fluides', titre: 'Un réservoir d’eau', noms: ['Pression au fond', 'Masse d’eau contenue'],
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
        solution: { txt: 'P = P_atm + ρ·g·h', val: p.Patm * 100 + p.rho * 9.81 * p.h, u: 'Pa' } };
      return { tokens, texte: [...debut, 'Quelle est la masse d’eau contenue dans le réservoir ?'], utiles: ['rho', 'h', 'D'],
        derivees: [{ id: 'S', nom: 'Section S du réservoir', expr: 'S = π·D² / 4', val: S, u: 'm²' }, { id: 'V', nom: 'Volume V d’eau', expr: 'V = S × h', val: S * p.h, u: 'm³' }],
        raisons: { Patm: 'La pression atmosphérique ne change pas la masse d’eau contenue.' },
        cherche: { bonne: 'La masse m d’eau contenue dans le réservoir (en kg)', faux: ['La pression absolue au fond du réservoir (en Pa)', 'Le poids de l’eau (en N)', 'Le débit d’eau nécessaire pour remplir le réservoir (en m³·s⁻¹)'] },
        manque: { bonne: 'Rien ne manque (π est une constante mathématique)', faux: ['L’intensité de la pesanteur g', 'La viscosité de l’eau', 'La pression au fond du réservoir'],
          expl: 'On cherche une masse, pas un poids : g n’intervient pas (m = ρ·V). Tout ce qu’il faut est dans l’énoncé.' },
        solution: { txt: 'm = ρ·V = ρ·S·h', val: p.rho * S * p.h, u: 'kg' } };
    },
  },
];

// Mélange reproductible (pour que l’ordre des propositions ne change pas à chaque affichage)
export function melange(tab, graine) {
  const a = tab.slice(); let s = (graine * 2654435761) >>> 0 || 1;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 1664525 + 1013904223) >>> 0; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function nouvelEnonce(id, q, forceParams) {
  const def = ENONCES.find(e => e.id === id);
  const p = forceParams || def.gen();
  return { id, q, p, b: def.build(p, q), graine: 1 + Math.floor(Math.random() * 99999) };
}
