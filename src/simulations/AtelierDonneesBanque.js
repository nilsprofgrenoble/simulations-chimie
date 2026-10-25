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
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sci3 = x => { const [m, e] = Number(x).toExponential(2).split('e'); return `${Number(m).toLocaleString('fr-FR')} × 10${[...String(Number(e))].map(c => SUP[c]).join('')}`; };
export const nb = (x, d = null) => (d == null
  ? (x !== 0 && (Math.abs(x) < 1e-3 || Math.abs(x) >= 1e7) ? sci3(x) : Number(x).toLocaleString('fr-FR', { maximumSignificantDigits: 4 }))
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
    gen: () => ({ D: tire([50, 63, 80, 100]), Lc: tire([60, 120, 200]), Q: tire([6, 9, 12]), Pel: tire([1.1, 1.5, 2.2]) }),
    build: (p, q) => {
      const tokens = {
        Pel: tok(`${nb(p.Pel, 1)} kW`, 'Puissance électrique de la pompe', p.Pel * 1000, 'W'),
        D: tok(`${p.D} mm`, 'Diamètre intérieur de la conduite', p.D / 1000, 'm'),
        Lc: tok(`${p.Lc} m`, 'Longueur de la conduite', p.Lc, 'm'),
        Q: tok(`${p.Q} m³·h⁻¹`, 'Débit volumique', p.Q / 3600, 'm³·s⁻¹'),
      };
      const debut = ['Une pompe de puissance électrique ', T('Pel'), ' refoule de l’eau dans une conduite cylindrique de diamètre intérieur ', T('D'),
        ' et de longueur ', T('Lc'), '. La conduite est pleine et le débit volumique est de ', T('Q'), '. '];
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
      const [VA, cB] = tire([[20, 0.1], [20, 0.05], [10, 0.05]]), m = tire([480, 500]), Vf = 100;
      const VE = Math.round(((m / 180) * (VA / Vf) / cB) * 10) / 10;
      return { mc: tire([0.6, 0.65, 0.7]), M: 180, Vf, VA, cB, VE };
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
        cherche: { bonne: 'Le temps de réponse à 5 % : durée au bout de laquelle l’écart à la valeur finale devient inférieur à 5 % de l’échelon (en s)', faux: ['La température du capteur à l’instant t (en °C)', 'La fréquence de coupure du capteur (en Hz)', 'La durée pour atteindre exactement la température du bain (en s)'] },
        manque: { bonne: 'Le lien entre temps de réponse à 5 % et τ (t₅ % = 3·τ, à connaître)', faux: ['La capacité thermique du capteur', 'La conductivité thermique du bain', 'Rien ne manque'],
          expl: 'Pour un système du 1er ordre, la sortie atteint 95 % de sa valeur finale à t ≈ 3·τ : cette relation n’est pas dans l’énoncé.' },
        solution: { txt: 't₅ % ≈ 3 × τ', val: 3 * p.tau, u: 's' } };
      const f = 1 - Math.exp(-p.t / p.tau), dT = p.Tf - p.T0;
      return { tokens, texte: [...debut, 'Quelle température le capteur indique-t-il ', T('t'), ' après l’immersion ?'], utiles: ['tau', 'T0', 'Tf', 't'],
        derivees: [{ id: 'dT', nom: 'Écart total à parcourir', expr: 'ΔT = T_f − T_0', val: dT, u: '°C' }, { id: 'f', nom: 'Fraction de l’écart atteinte', expr: 'f = 1 − e^(−t/τ)', val: f, u: '' }],
        raisons: { res: rRes, m: rM },
        cherche: { bonne: 'La température indiquée par le capteur à l’instant t (en °C)', faux: ['Le temps de réponse à 5 % (en s)', 'La vitesse de variation de la température à l’instant t (en °C·s⁻¹)', 'La durée pour atteindre 99 % de la variation (en s)'] },
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
      const debut = ['On distille avec une colonne (distillation fractionnée) ', T('V'), ' d’un mélange eau–éthanol qui contient ', T('x'), ' d’éthanol en volume. Le chauffe-ballon a une puissance de ', T('P'),
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
    gen: () => ({ me: tire([100, 150, 200, 250]), s60: 110, s20: 32, dur: tire([30, 45, 60]), mb: tire([80, 120, 150]) }),
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
  // ───────────────────────────── Mesure et incertitudes (TSTL)
  {
    id: 'incertA', domaine: 'Mesure et incertitudes', titre: 'Incertitude d’une série de mesures répétées', noms: ['Incertitude-type de la moyenne', 'Incertitude élargie', 'Borne haute de l’intervalle'],
    gen: () => { const n = tire([9, 16, 25]), u0 = tire([0.02, 0.03, 0.04]); return { n, s: Math.round(u0 * Math.sqrt(n) * 100) / 100, xm: tire([12.4, 15.2, 18.6, 20.3]), k: 2, res: tire([0.05, 0.1]), dur: tire([10, 15, 20]) }; },
    build: (p, q) => {
      const u = p.s / Math.sqrt(p.n), U = p.k * u;
      const tokens = {
        n: tok(`${p.n} mesures`, 'Nombre de mesures de la série', p.n, ''),
        xm: tok(`${nb(p.xm, 1)} mL`, 'Moyenne des mesures', p.xm, 'mL'),
        s: tok(`${nb(p.s, 2)} mL`, 'Écart-type expérimental de la série', p.s, 'mL'),
        k: tok('k = 2', 'Facteur d’élargissement', p.k, ''),
        res: tok(`${nb(p.res, 2)} mL`, 'Résolution de la burette', p.res, 'mL'),
        dur: tok(`${p.dur} min`, 'Durée de la série', p.dur, 'min'),
      };
      const debut = ['On répète ', T('n'), ' fois le titrage d’une même solution, dans les mêmes conditions. Le volume équivalent moyen est ', T('xm'), ' et l’écart-type expérimental de la série vaut ', T('s'),
        '. La burette a une résolution de ', T('res'), ' ; la série a duré ', T('dur'), '. On élargit l’incertitude avec ', T('k'), ' (niveau de confiance d’environ 95 %, loi normale supposée). '];
      const rRes = 'On ne demande ici que l’incertitude liée à la dispersion des mesures répétées (type A) ; la résolution de la burette est une autre source, qu’on traite à part.';
      const rDur = 'La durée de la série n’intervient pas dans le calcul de l’incertitude.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est l’incertitude-type u de la moyenne ?'], utiles: ['s', 'n'],
        raisons: { xm: 'La valeur de la moyenne ne change pas l’incertitude : elle dépend de la dispersion et du nombre de mesures.', k: 'Le facteur d’élargissement sert pour l’incertitude élargie, pas pour l’incertitude-type.', res: rRes, dur: rDur },
        cherche: { bonne: 'L’incertitude-type u de la moyenne (en mL)', faux: ['L’incertitude élargie U (en mL)', 'L’incertitude relative u / x̄ (sans unité)', 'La variance de la série (en mL²)'] },
        manque: null, solution: { txt: 'u = s / √n', val: u, u: 'mL' } };
      if (q === 1) return { tokens, texte: [...debut, 'Quelle est l’incertitude élargie U, due à la dispersion des mesures répétées (type A seulement), avec le facteur d’élargissement donné ?'], utiles: ['s', 'n', 'k'],
        derivees: [{ id: 'u', nom: 'Incertitude-type de la moyenne', expr: 'u = s / √n', val: u, u: 'mL' }],
        raisons: { xm: 'La moyenne ne sert pas à calculer l’incertitude.', res: rRes, dur: rDur },
        cherche: { bonne: 'L’incertitude élargie U (en mL)', faux: ['L’incertitude-type u de la moyenne (en mL)', 'La borne basse x̄ − U de l’intervalle (en mL)', 'Le nombre de mesures nécessaire'] },
        manque: null, solution: { txt: 'U = k × u', val: U, u: 'mL' } };
      return { tokens, texte: [...debut, 'Quelle est la borne haute de l’intervalle x̄ ± U ?'], utiles: ['xm', 's', 'n', 'k'],
        derivees: [{ id: 'u', nom: 'Incertitude-type de la moyenne', expr: 'u = s / √n', val: u, u: 'mL' }, { id: 'U', nom: 'Incertitude élargie', expr: 'U = k × u', val: U, u: 'mL' }],
        raisons: { res: rRes, dur: rDur },
        cherche: { bonne: 'La borne haute x̄ + U de l’intervalle (en mL)', faux: ['L’incertitude élargie U (en mL)', 'La largeur totale de l’intervalle (en mL)', 'La borne basse x̄ − U de l’intervalle (en mL)'] },
        manque: null, solution: { txt: 'x̄ + U', val: p.xm + U, u: 'mL' } };
    },
  },
  {
    id: 'compatS', domaine: 'Mesure et incertitudes', titre: 'Une mesure et sa valeur de référence', noms: ['Écart à la référence', 'Écart rapporté à l’incertitude-type'],
    gen: () => {
      const cref = tire([0.05, 0.1, 0.2]), d = tire([0.002, 0.003, 0.004, 0.006]), sg_ = tire([-1, 1]);
      return { cref, x: Math.round((cref + sg_ * d) * 1000) / 1000, d, u: tire([0.001, 0.002]), n: tire([6, 8, 10]), theta: tire([20, 22, 25]) };
    },
    build: (p, q) => {
      const tokens = {
        x: tok(`${nb(p.x, 3)} mol·L⁻¹`, 'Concentration mesurée', p.x, 'mol·L⁻¹'),
        u: tok(`${nb(p.u, 3)} mol·L⁻¹`, 'Incertitude-type de la mesure', p.u, 'mol·L⁻¹'),
        cref: tok(`${nb(p.cref, 3)} mol·L⁻¹`, 'Valeur de référence (solution étalon)', p.cref, 'mol·L⁻¹'),
        n: tok(`${p.n} dosages`, 'Nombre de dosages de la série', p.n, ''),
        theta: tok(`${p.theta} °C`, 'Température du laboratoire', p.theta, '°C'),
      };
      const debut = ['On dose une solution étalon et on trouve ', T('x'), ', avec une incertitude-type ', T('u'), ' (déjà calculée à partir de ', T('n'), '). La valeur de référence de l’étalon est ', T('cref'),
        '. Le laboratoire est à ', T('theta'), '. '];
      const rN = 'Le nombre de dosages a déjà servi à calculer l’incertitude-type, qui est donnée.', rT = 'La température n’intervient pas dans la comparaison.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est l’écart entre la mesure et la référence ?'], utiles: ['x', 'cref'],
        raisons: { u: 'L’incertitude-type sert à juger l’écart, pas à le calculer.', n: rN, theta: rT },
        cherche: { bonne: 'L’écart |x − x_ref| (en mol·L⁻¹)', faux: ['L’incertitude-type de la mesure (en mol·L⁻¹)', 'La concentration de la solution étalon', 'Le rapport entre la mesure et la référence'] },
        manque: null, solution: { txt: '|x − x_ref|', val: p.d, u: 'mol·L⁻¹' } };
      return { tokens, texte: [...debut, 'Combien vaut l’écart exprimé en nombre d’incertitudes-types ? (La mesure est compatible avec la référence si ce nombre est au plus 2.)'], utiles: ['x', 'cref', 'u'],
        derivees: [{ id: 'e', nom: 'Écart à la référence', expr: '|x − x_ref|', val: p.d, u: 'mol·L⁻¹' }],
        raisons: { n: rN, theta: rT },
        cherche: { bonne: 'Le rapport écart / u (sans unité)', faux: ['L’écart |x − x_ref| (en mol·L⁻¹)', 'L’incertitude élargie U (en mol·L⁻¹)', 'Le pourcentage d’erreur par rapport à la référence'] },
        manque: null, solution: { txt: '|x − x_ref| / u', val: p.d / p.u, u: '' } };
    },
  },

  // ───────────────────────────── Contrôle des systèmes (TSTL) : moteur pas à pas et champ magnétique
  {
    id: 'moteurPas', domaine: 'Contrôle des systèmes', titre: 'Un moteur pas à pas piloté par un programme', noms: ['Angle d’un pas', 'Fréquence des pas', 'Vitesse de rotation', 'Rotation obtenue'],
    gen: () => ({ N: tire([20, 48, 200]), D: tire([4, 5, 8, 10]), Np: tire([100, 200, 400, 600]), U: tire([12, 24]), R: tire([5, 10, 20]) }),
    build: (p, q) => {
      const f = 1000 / p.D;
      const tokens = {
        N: tok(`${p.N} pas par tour`, 'Nombre de pas pour faire un tour complet', p.N, 'pas/tour'),
        D: tok(`${p.D} ms`, 'Délai entre deux pas (instruction delay du programme)', p.D, 'ms'),
        Np: tok(`${p.Np} pas`, 'Nombre de pas commandés par le programme', p.Np, 'pas'),
        U: tok(`${p.U} V`, 'Tension d’alimentation', p.U, 'V'),
        R: tok(`${p.R} Ω`, 'Résistance d’une bobine', p.R, 'Ω'),
      };
      const debut = ['Un moteur pas à pas fait ', T('N'), '. Un programme allume les bobines pas après pas, en attendant ', T('D'), ' entre deux pas, et commande ', T('Np'),
        ' au total. Le moteur est alimenté sous ', T('U'), ' et chaque bobine a une résistance de ', T('R'), '. '];
      const rU = 'La tension d’alimentation fixe le couple disponible, pas l’angle ni la fréquence des pas.', rR = 'La résistance des bobines fixe le courant, pas l’angle ni la fréquence des pas.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'De quel angle tourne le rotor à chaque pas ?'], utiles: ['N'],
        raisons: { D: 'Le délai fixe la vitesse, pas l’angle d’un pas.', Np: 'Le nombre de pas commandés dit combien de pas on fait, pas de quel angle chacun tourne.', U: rU, R: rR },
        cherche: { bonne: 'L’angle d’un pas (en °)', faux: ['La vitesse de rotation (en tr/min)', 'La fréquence des pas (en Hz)', 'Le nombre de tours effectués'] },
        manque: { bonne: 'Rien ne manque : un tour complet vaut 360°', faux: ['La masse du rotor', 'Le couple maximal du moteur', 'Le sens de rotation'], expl: 'Un tour complet fait 360° et se décompose en N pas égaux.' },
        solution: { txt: 'α = 360° / N', val: 360 / p.N, u: '°' } };
      if (q === 1) return { tokens, derivees: [], texte: [...debut, 'Combien de pas le moteur fait-il par seconde ?'], utiles: ['D'],
        raisons: { N: 'Le nombre de pas par tour ne change pas le nombre de pas par seconde.', Np: 'Le nombre total de pas ne donne pas le rythme auquel ils s’enchaînent.', U: rU, R: rR },
        cherche: { bonne: 'La fréquence des pas (en pas par seconde, soit en Hz)', faux: ['La vitesse de rotation (en tr/min)', 'La durée totale du programme (en s)', 'L’angle d’un pas (en °)'] },
        manque: { bonne: 'Rien ne manque : 1 s = 1 000 ms', faux: ['L’angle d’un pas', 'Le couple résistant', 'La tension de chaque bobine'], expl: 'Un pas dure D millisecondes : en 1 000 ms, on fait 1 000 / D pas.' },
        solution: { txt: 'f = 1 000 / D (D en ms)', val: f, u: 'pas/s' } };
      if (q === 2) return { tokens, texte: [...debut, 'Quelle est la vitesse de rotation du moteur, en tours par minute ?'], utiles: ['N', 'D'],
        derivees: [{ id: 'f', nom: 'Fréquence des pas', expr: 'f = 1 000 / D', val: f, u: 'pas/s' }],
        raisons: { Np: 'Le nombre total de pas ne change pas la vitesse, seulement la durée de la rotation.', U: rU, R: rR },
        cherche: { bonne: 'La vitesse de rotation n (en tr/min)', faux: ['La fréquence des pas (en Hz)', 'Le nombre de tours effectués', 'L’angle tourné en un pas (en °)'] },
        manque: { bonne: 'Rien ne manque : 1 min = 60 s', faux: ['La masse du rotor', 'Le couple maximal', 'Le courant dans les bobines'], expl: 'f pas par seconde ÷ N pas par tour = f/N tours par seconde ; × 60 pour passer en tours par minute.' },
        solution: { txt: 'n = 60 × f / N', val: 60 * f / p.N, u: 'tr/min' } };
      return { tokens, derivees: [], texte: [...debut, 'Combien de tours le rotor fait-il au total ?'], utiles: ['N', 'Np'],
        raisons: { D: 'Le délai fixe la vitesse, pas le nombre de tours : il change seulement la durée.', U: rU, R: rR },
        cherche: { bonne: 'Le nombre de tours effectués', faux: ['La vitesse de rotation (en tr/min)', 'La durée du programme (en s)', 'L’angle d’un pas (en °)'] },
        manque: null, solution: { txt: 'tours = N_p / N', val: p.Np / p.N, u: 'tours' } };
    },
  },
  {
    id: 'champB', domaine: 'Contrôle des systèmes', titre: 'Une boussole près d’un aimant', noms: ['Champ total', 'Déviation de l’aiguille', 'Champ de l’aimant plus loin'],
    gen: () => {
      const Ba = tire([10, 20, 40, 60, 160]), r1 = tire([8, 10, 12]);
      return { BT: 20, Ba, mT: tire([true, false]), r1, r2: r1 * tire([2, 3]), m: tire([20, 25, 40]), T: tire([19, 21, 23]) };
    },
    build: (p, q) => {
      const tokens = {
        BT: tok('20 µT', 'Composante horizontale du champ magnétique terrestre', p.BT, 'µT'),
        Ba: tok(p.mT ? `${nb(p.Ba / 1000, 3)} mT` : `${p.Ba} µT`, 'Champ de l’aimant à la distance r₁', p.Ba, 'µT'),
        r1: tok(`${p.r1} cm`, 'Distance boussole – aimant', p.r1, 'cm'),
        r2: tok(`${p.r2} cm`, 'Nouvelle distance boussole – aimant', p.r2, 'cm'),
        m: tok(`${p.m} g`, 'Masse de l’aimant', p.m, 'g'),
        T: tok(`${p.T} °C`, 'Température de la salle', p.T, '°C'),
      };
      const debut = ['Une boussole est placée à ', T('r1'), ' du centre d’un aimant droit (masse ', T('m'), '), sur son axe, l’aimant étant orienté perpendiculairement à la direction du nord. À cet endroit, le champ de l’aimant vaut ',
        T('Ba'), ' et la composante horizontale du champ de la Terre vaut ', T('BT'), '. La salle est à ', T('T'), '. On pourra éloigner la boussole à ', T('r2'), ' ; le champ de l’aimant décroît alors comme 1/r³. '];
      const rm = 'La masse de l’aimant est déjà contenue dans la valeur de son champ.', rT = 'La température n’intervient pas ici.';
      const rr1 = 'La distance est déjà contenue dans la valeur du champ de l’aimant donnée à cet endroit.', rr2 = 'Cette distance ne concerne pas cette question : le champ utilisé est celui donné à r₁.';
      const Bt = Math.hypot(p.BT, p.Ba);
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le champ magnétique total à l’endroit de la boussole (placée à r₁) ?'], utiles: ['BT', 'Ba'],
        raisons: { r1: rr1, r2: rr2, m: rm, T: rT },
        cherche: { bonne: 'L’intensité du champ total (en µT)', faux: ['L’angle de déviation de l’aiguille (en °)', 'Le champ de l’aimant seul (en µT)', 'La distance boussole – aimant'] },
        manque: { bonne: 'Rien ne manque : les deux champs sont perpendiculaires', faux: ['La longueur de l’aimant', 'Le sens du courant', 'L’altitude du lieu'], expl: 'Deux champs perpendiculaires s’ajoutent comme les côtés d’un triangle rectangle : B² = B_T² + B_a².' },
        solution: { txt: 'B = √(B_T² + B_a²)', val: Bt, u: 'µT' } };
      if (q === 1) return { tokens, derivees: [], texte: [...debut, 'De quel angle l’aiguille de la boussole dévie-t-elle par rapport au nord ?'], utiles: ['BT', 'Ba'],
        raisons: { r1: rr1, r2: rr2, m: rm, T: rT },
        cherche: { bonne: 'L’angle de déviation α de l’aiguille (en °)', faux: ['L’intensité du champ total (en µT)', 'Le rapport des deux champs', 'La direction du champ de la Terre'] },
        manque: { bonne: 'Rien ne manque : tan α = B_a / B_T', faux: ['La longueur de l’aiguille', 'La masse de l’aiguille', 'Le champ à une autre distance'], expl: 'L’aiguille se place selon le champ total : sa déviation est donnée par tan α = B_a / B_T (boussole des tangentes).' },
        solution: { txt: 'α = arctan(B_a / B_T)', val: Math.atan(p.Ba / p.BT) * 180 / Math.PI, u: '°' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le champ de l’aimant lorsque la boussole est à la distance r₂ ?'], utiles: ['Ba', 'r1', 'r2'],
        raisons: { BT: 'Le champ de la Terre ne dépend pas de la distance à l’aimant, et on cherche le champ de l’aimant seul.', m: rm, T: rT },
        cherche: { bonne: 'Le champ de l’aimant seul à la distance r₂ (en µT)', faux: ['Le champ total à r₂ (en µT)', 'La déviation de l’aiguille à r₂ (en °)', 'Le champ de la Terre à r₂'] },
        manque: null, solution: { txt: 'B₂ = B_a × (r₁ / r₂)³', val: p.Ba * (p.r1 / p.r2) ** 3, u: 'µT' } };
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
    gen: () => { const [d, t] = tire([[5, 28], [6, 33], [8, 42], [10, 55]]); return { d, t, v: tire([15, 20, 25, 30]), tv: tire([30, 45, 90]), age: tire([17, 24, 31, 45]), dos: tire([128, 245, 316, 470]) }; },
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
          cherche: { bonne: 'La vitesse moyenne v du coureur (en m·s⁻¹)', faux: ['L’accélération moyenne du coureur (en m·s⁻²)', 'La durée pour courir 1 km à cette allure (en s)', 'L’énergie dépensée par le coureur (en J)'] },
          manque: null, solution: { txt: 'v = d / Δt, avec d en m et Δt en s', val: p.d * 1000 / (p.t * 60), u: 'm·s⁻¹' } };
      }
      tokens.v = tok(`${p.v} km·h⁻¹`, 'Vitesse du cycliste', p.v, 'km·h⁻¹');
      tokens.tv = tok(`${p.tv} min`, 'Durée du trajet à vélo', p.tv / 60, 'h');
      return { tokens, derivees: [],
        texte: ['Un cycliste de ', T('age'), ' roule à la vitesse constante de ', T('v'), ' pendant ', T('tv'), '. Il porte le dossard ', T('dos'), '. Quelle distance parcourt-il, en kilomètres ?'],
        utiles: ['v', 'tv'],
        raisons: { age: 'L’âge du cycliste ne change pas la distance parcourue.', dos: 'Le numéro de dossard ne sert pas dans le calcul.' },
        cherche: { bonne: 'La distance d parcourue par le cycliste (en km)', faux: ['L’accélération du cycliste (en m·s⁻²)', 'La durée pour parcourir 1 km à cette vitesse (en min)', 'Le nombre de tours de roue'] },
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
  // ───────────────────────────── Seconde et première : « de quelle grandeur s'agit-il ? » (masse ou volume, kg ou g, mL ou L, min ou h…)
  {
    id: 'rho2', domaine: 'Solutions et concentration', titre: 'La masse volumique d’un liquide', noms: ['Masse volumique du liquide', 'Masse d’un volume de liquide'],
    gen: () => { const liq = tire([['de l’huile', 0.92], ['de l’éthanol', 0.79], ['du glycérol', 1.26], ['du sirop', 1.30]]); const V = tire([20, 25, 40, 50]), mv = tire([45, 52, 60]);
      return { nom: liq[0], rho: liq[1], V, mv, mt: Math.round((mv + liq[1] * V) * 10) / 10, T: tire([18, 20, 22]), VL: tire([0.25, 0.5, 1.5, 2]) }; },
    build: (p, q) => {
      const tokens = { T: tok(`${p.T} °C`, 'Température du laboratoire', p.T, '°C') };
      if (q === 0) {
        tokens.mv = tok(`${nb(p.mv, 1)} g`, 'Masse de l’éprouvette vide', p.mv, 'g');
        tokens.mt = tok(`${nb(p.mt, 1)} g`, 'Masse de l’éprouvette contenant le liquide', p.mt, 'g');
        tokens.V = tok(`${p.V} mL`, 'Volume de liquide dans l’éprouvette', p.V, 'mL');
        return { tokens, derivees: [{ id: 'm', nom: 'Masse m du liquide seul', expr: 'm = masse avec le liquide − masse de l’éprouvette vide', val: Math.round((p.mt - p.mv) * 10) / 10, u: 'g' }],
          texte: ['Pour déterminer la masse volumique d’un liquide, on pèse une éprouvette graduée vide : ', T('mv'), '. On y verse du liquide jusqu’à lire ', T('V'), ', et on pèse l’ensemble : ', T('mt'), '. La température du laboratoire est de ', T('T'), '. Quelle est la masse volumique de ce liquide (en g·mL⁻¹) ?'],
          utiles: ['mv', 'mt', 'V'],
          raisons: { T: 'On mesure directement m et V : la température du laboratoire ne figure pas dans la formule ρ = m / V (elle est notée seulement parce qu’un volume varie un peu avec la température).' },
          cherche: { bonne: 'La masse volumique ρ du liquide (en g·mL⁻¹)', faux: ['La masse m du liquide seul (en g)', 'Le poids du liquide (en N)', 'La quantité de matière de liquide (en mol)'] },
          manque: null, solution: { txt: 'ρ = m / V, avec m = m_avec liquide − m_éprouvette', val: (p.mt - p.mv) / p.V, u: 'g·mL⁻¹' } };
      }
      delete tokens.T;
      tokens.rho = tok(`${nb(p.rho, 2)} g·mL⁻¹`, 'Masse volumique du liquide', p.rho, 'g·mL⁻¹');
      tokens.VL = tok(`${nb(p.VL, 2)} L`, 'Volume de liquide à peser', p.VL * 1000, 'mL');
      tokens.mv = tok(`${nb(p.mv, 1)} g`, 'Masse du flacon vide', p.mv, 'g');
      return { tokens, derivees: [],
        texte: ['La masse volumique ' + p.nom + ' vaut ', T('rho'), '. Un technicien en verse ', T('VL'), ' dans un flacon vide de masse ', T('mv'), '. Quelle est la masse de liquide versé (en g) ?'],
        utiles: ['rho', 'VL'],
        raisons: { mv: 'La masse du flacon vide ne compte pas : on demande la masse du liquide seul.' },
        cherche: { bonne: 'La masse m de liquide versé (en g)', faux: ['La masse totale flacon + liquide (en g)', 'Le poids du liquide (en N)', 'La quantité de matière de liquide (en mol)'] },
        manque: null, solution: { txt: 'm = ρ × V (avec V converti en mL)', val: p.rho * p.VL * 1000, u: 'g' } };
    },
  },
  {
    id: 'conc2', domaine: 'Solutions et concentration', titre: 'Préparer une solution de sel', noms: ['Concentration en masse de la solution', 'Masse de sel à peser'],
    gen: () => ({ m: tire([2, 5, 10, 15]), Vf: tire([100, 250, 500]), Vi: tire([50, 80, 120]), t: tire([9, 20, 40]), M: 58.5 }),
    build: (p, q) => {
      const tokens = { M: tok('58,5 g·mol⁻¹', 'Masse molaire du chlorure de sodium', p.M, 'g·mol⁻¹') };
      if (q === 0) {
        tokens.m = tok(`${p.m} g`, 'Masse de sel pesée', p.m, 'g');
        tokens.Vi = tok(`${p.Vi} mL`, 'Volume d’eau versé pour dissoudre le sel', p.Vi / 1000, 'L');
        tokens.Vf = tok(`${p.Vf} mL`, 'Volume de la solution (fiole jaugée)', p.Vf / 1000, 'L');
        return { tokens, derivees: [],
          texte: ['Un élève pèse ', T('m'), ' de chlorure de sodium. Il les dissout dans environ ', T('Vi'), ' d’eau distillée dans une fiole jaugée de ', T('Vf'), ', puis complète avec de l’eau jusqu’au trait de jauge. Données : ', T('M'), '. Quelle est la concentration en masse de la solution (en g·L⁻¹) ?'],
          utiles: ['m', 'Vf'],
          raisons: { Vi: 'C’est le volume d’eau versé au début, pas le volume de la solution : le volume de la solution, c’est celui de la fiole jaugée (jusqu’au trait de jauge).', M: 'La masse molaire sert à calculer une concentration en quantité de matière (mol·L⁻¹), pas une concentration en masse.' },
          cherche: { bonne: 'La concentration en masse t de la solution (en g·L⁻¹)', faux: ['La masse de sel dissous (en g)', 'Le volume de la solution (en L)', 'La concentration en quantité de matière (en mol·L⁻¹)'] },
          manque: null, solution: { txt: 't = m / V (avec V converti en L)', val: p.m / (p.Vf / 1000), u: 'g·L⁻¹' } };
      }
      tokens.t = tok(`${p.t} g·L⁻¹`, 'Concentration en masse souhaitée', p.t, 'g·L⁻¹');
      tokens.Vf = tok(`${p.Vf} mL`, 'Volume de la solution à préparer (fiole jaugée)', p.Vf / 1000, 'L');
      tokens.Vi = tok(`${p.Vi} mL`, 'Volume d’eau versé pour dissoudre le sel', p.Vi / 1000, 'L');
      return { tokens, derivees: [],
        texte: ['On veut préparer une solution de chlorure de sodium de concentration en masse ', T('t'), ', dans une fiole jaugée de ', T('Vf'), '. On dissoudra d’abord le sel dans environ ', T('Vi'), ' d’eau. Données : ', T('M'), '. Quelle masse de sel faut-il peser (en g) ?'],
        utiles: ['t', 'Vf'],
        raisons: { Vi: 'C’est le volume d’eau versé au début : la solution finale fait le volume de la fiole jaugée.', M: 'La masse molaire n’intervient pas : la concentration est donnée en masse, pas en quantité de matière.' },
        cherche: { bonne: 'La masse m de sel à peser (en g)', faux: ['La concentration en masse de la solution (en g·L⁻¹)', 'Le volume d’eau à verser (en mL)', 'La quantité de matière de sel (en mol)'] },
        manque: null, solution: { txt: 'm = t × V (avec V converti en L)', val: p.t * p.Vf / 1000, u: 'g' } };
    },
  },
  {
    id: 'poids2', domaine: 'Forces et principe d’inertie', titre: 'Le poids d’un objet', noms: ['Poids sur la Terre', 'Poids sur un autre astre'],
    gen: () => { const a = tire([['la Lune', 1.6], ['Mars', 3.7], ['Vénus', 8.9]]); const mat = tire([['fer', 7.9], ['aluminium', 2.7], ['cuivre', 9.0], ['laiton', 8.5]]); const mg = tire([250, 500, 750]);
      return { astre: a[0], ga: a[1], mat: mat[0], mg, V: Math.round(mg / mat[1]), mk: tire([2.4, 3.5, 12, 60]) }; },
    build: (p, q) => {
      if (q === 0) {
        const tokens = { mg: tok(`${p.mg} g`, 'Masse de l’objet', p.mg / 1000, 'kg'), g: tok('9,8 N·kg⁻¹', 'Intensité de la pesanteur sur Terre', 9.8, 'N·kg⁻¹'), V: tok(`${p.V} cm³`, 'Volume de l’objet', p.V, 'cm³') };
        return { tokens, derivees: [],
          texte: ['Un objet en ' + p.mat + ' de ', T('mg'), ' et de volume ', T('V'), ' est accroché à un dynamomètre sur Terre. Données : ', T('g'), '. Quel est le poids de l’objet (en N) ?'],
          utiles: ['mg', 'g'],
          raisons: { V: 'Le volume de l’objet n’intervient pas dans le calcul du poids : c’est la masse (en kg) qui compte.' },
          cherche: { bonne: 'Le poids P de l’objet (en N)', faux: ['La masse volumique de l’objet (en g·cm⁻³)', 'L’énergie potentielle de pesanteur de l’objet (en J)', 'La pression exercée par l’objet sur la table (en Pa)'] },
          manque: null, solution: { txt: 'P = m × g (avec m convertie en kg)', val: p.mg / 1000 * 9.8, u: 'N' } };
      }
      const tokens = { mk: tok(`${nb(p.mk)} kg`, 'Masse de l’objet', p.mk, 'kg'), ga: tok(`${nb(p.ga, 1)} N·kg⁻¹`, 'Intensité de la pesanteur sur ' + p.astre, p.ga, 'N·kg⁻¹'), g: tok('9,8 N·kg⁻¹', 'Intensité de la pesanteur sur Terre', 9.8, 'N·kg⁻¹') };
      const sur = p.astre === 'Mars' || p.astre === 'Vénus' ? 'sur ' + p.astre : 'sur la Lune';
      return { tokens, derivees: [],
        texte: ['Un objet de ', T('mk'), ' est envoyé ' + sur + ', où l’intensité de la pesanteur vaut ', T('ga'), '. Sur Terre, elle vaut ', T('g'), '. Quel est le poids de l’objet ' + sur + ' (en N) ?'],
        utiles: ['mk', 'ga'],
        raisons: { g: 'La valeur de g sur Terre ne sert pas : on cherche le poids ' + sur + ', où la pesanteur est différente.' },
        cherche: { bonne: 'Le poids P de l’objet ' + sur + ' (en N)', faux: ['La masse de l’objet ' + sur + ' (en kg)', 'Le poids de l’objet sur Terre (en N)', 'L’énergie potentielle de l’objet à 1 m du sol (en J)'] },
        manque: null, solution: { txt: 'P = m × g (avec g de ' + p.astre + ')', val: p.mk * p.ga, u: 'N' } };
    },
  },
  {
    id: 'vitesse2', domaine: 'Mouvement et vitesse', titre: 'La vitesse d’un cycliste', noms: ['Vitesse moyenne', 'Durée du trajet'],
    gen: () => { const [d, t] = tire([[6, 20], [9, 20], [9, 25], [3, 10], [4.5, 15], [15, 40], [12, 25]]); const [v, tt] = tire([[18, 200], [21.6, 300], [25.2, 400], [28.8, 600]]);
      return { d, t, m: tire([65, 72, 80]), v, dm: Math.round(v / 3.6 * tt) }; },
    build: (p, q) => {
      if (q === 0) {
        const tokens = { d: tok(`${nb(p.d)} km`, 'Distance parcourue', p.d * 1000, 'm'), t: tok(`${p.t} min`, 'Durée du trajet', p.t * 60, 's'), m: tok(`${p.m} kg`, 'Masse du cycliste', p.m, 'kg') };
        return { tokens, derivees: [],
          texte: ['Un cycliste de ', T('m'), ' parcourt ', T('d'), ' en ', T('t'), '. Quelle est sa vitesse moyenne (en m·s⁻¹) ?'],
          utiles: ['d', 't'],
          raisons: { m: 'La masse du cycliste ne sert pas à calculer sa vitesse : c’est une masse, pas une distance ni une durée.' },
          cherche: { bonne: 'La vitesse moyenne v du cycliste (en m·s⁻¹)', faux: ['L’accélération moyenne du cycliste (en m·s⁻²)', 'La distance qu’il parcourrait en une heure à cette vitesse (en km)', 'L’énergie cinétique du cycliste (en J)'] },
          manque: null, solution: { txt: 'v = d / Δt (d en m, Δt en s)', val: p.d * 1000 / (p.t * 60), u: 'm·s⁻¹' } };
      }
      const tokens = { dm: tok(`${p.dm} m`, 'Distance à parcourir', p.dm, 'm'), v: tok(`${nb(p.v)} km·h⁻¹`, 'Vitesse moyenne du cycliste', p.v / 3.6, 'm·s⁻¹'), m: tok(`${p.m} kg`, 'Masse du cycliste', p.m, 'kg') };
      return { tokens, derivees: [],
        texte: ['Un cycliste de ', T('m'), ' doit parcourir ', T('dm'), ' à la vitesse moyenne de ', T('v'), '. Quelle est la durée du trajet (en s) ?'],
        utiles: ['dm', 'v'],
        raisons: { m: 'La masse du cycliste n’intervient pas : on cherche une durée à partir d’une distance et d’une vitesse.' },
        cherche: { bonne: 'La durée Δt du trajet (en s)', faux: ['L’accélération moyenne du cycliste (en m·s⁻²)', 'La distance parcourue en une heure à cette vitesse (en km)', 'L’énergie cinétique du cycliste (en J)'] },
        manque: null, solution: { txt: 'Δt = d / v (v convertie en m·s⁻¹)', val: p.dm / (p.v / 3.6), u: 's' } };
    },
  },
  {
    id: 'ohm2', domaine: 'Circuits électriques', titre: 'Un résistor dans un circuit', noms: ['Tension aux bornes du résistor', 'Intensité du courant'],
    gen: () => ({ R: tire([1.0, 2.2, 4.7]), I: tire([1, 2]), Rm: tire([470, 1000, 2200]), U: tire([3, 6, 9]), L: tire([20, 40]) }),
    build: (p, q) => {
      if (q === 0) {
        const tokens = { R: tok(`${nb(p.R, 1)} kΩ`, 'Résistance du résistor', p.R * 1000, 'Ω'), I: tok(`${p.I} mA`, 'Intensité du courant', p.I / 1000, 'A'), L: tok(`${p.L} cm`, 'Longueur du fil de connexion', p.L / 100, 'm') };
        return { tokens, derivees: [],
          texte: ['Un résistor de résistance ', T('R'), ' est traversé par un courant d’intensité ', T('I'), '. Il est relié au circuit par un fil de ', T('L'), ' (dont la résistance est négligeable). Quelle est la tension à ses bornes (en V) ?'],
          utiles: ['R', 'I'],
          raisons: { L: 'La longueur du fil est une longueur : elle n’apparaît pas dans la loi d’Ohm U = R × I (et la résistance du fil est négligeable).' },
          cherche: { bonne: 'La tension U aux bornes du résistor (en V)', faux: ['La puissance reçue par le résistor (en W)', 'L’énergie reçue par le résistor en une minute (en J)', 'La charge électrique qui traverse le résistor en une seconde (en C)'] },
          manque: null, solution: { txt: 'U = R × I (R en Ω, I en A)', val: p.R * 1000 * p.I / 1000, u: 'V' } };
      }
      const tokens = { U: tok(`${p.U} V`, 'Tension aux bornes du résistor', p.U, 'V'), Rm: tok(`${p.Rm} Ω`, 'Résistance du résistor', p.Rm, 'Ω'), L: tok(`${p.L} cm`, 'Longueur du fil de connexion', p.L / 100, 'm') };
      return { tokens, derivees: [],
        texte: ['Un générateur impose une tension de ', T('U'), ' aux bornes d’un résistor de résistance ', T('Rm'), ', relié par un fil de ', T('L'), ' (dont la résistance est négligeable). Quelle est l’intensité du courant qui traverse le résistor (en mA) ?'],
        utiles: ['U', 'Rm'],
        raisons: { L: 'La longueur du fil n’intervient pas dans la loi d’Ohm (et la résistance du fil est négligeable).' },
        cherche: { bonne: 'L’intensité I du courant (en mA)', faux: ['La puissance reçue par le résistor (en W)', 'L’énergie reçue par le résistor en une minute (en J)', 'La charge électrique qui traverse le résistor en une seconde (en C)'] },
        manque: null, solution: { txt: 'I = U / R (R en Ω, I d’abord en A puis en mA)', val: p.U / p.Rm * 1000, u: 'mA' } };
    },
  },
  {
    id: 'indice2', domaine: 'Lumière', titre: 'Indice de réfraction et vitesse de la lumière', noms: ['Indice de réfraction', 'Vitesse de la lumière dans le milieu'],
    gen: () => ({ milieu: tire([['un bloc de verre', 200000, 1.5, [2, 5, 10]], ['un bloc de verre crown', 197000, 1.52, [2, 5, 10]], ['une cuve remplie d’eau', 225000, 1.33, [5, 10, 20]], ['un diamant taillé', 124000, 2.42, [0.5, 1]]]) }),
    build: (p, q) => {
      const [obj, vkm, n, eps] = p.milieu, ep = tire(eps);
      const tokens = { c: tok('c = 3,00 × 10⁸ m·s⁻¹', 'Vitesse de la lumière dans le vide', 3.0e8, 'm·s⁻¹'), ep: tok(`${nb(ep)} cm`, 'Épaisseur traversée', ep / 100, 'm') };
      if (q === 0) {
        tokens.v = tok(`${nb(vkm)} km·s⁻¹`, 'Vitesse de la lumière dans le milieu', vkm * 1000, 'm·s⁻¹');
        return { tokens, derivees: [],
          texte: ['Un faisceau lumineux traverse ' + obj + ' sur ', T('ep'), '. Dans ce milieu, la lumière se propage à la vitesse de ', T('v'), '. On donne ', T('c'), '. Quel est l’indice de réfraction du milieu ?'],
          utiles: ['c', 'v'],
          raisons: { ep: 'L’épaisseur traversée n’intervient pas dans l’indice (elle servirait à calculer une durée de traversée).' },
          cherche: { bonne: 'L’indice de réfraction n du milieu (sans unité)', faux: ['La fréquence de la lumière (en Hz)', 'La durée de la traversée du milieu (en s)', 'L’angle de réfraction (en °)'] },
          manque: null, solution: { txt: 'n = c / v (v convertie en m·s⁻¹)', val: 3.0e8 / (vkm * 1000), u: '' } };
      }
      tokens.n = tok(`n = ${nb(n, 2)}`, 'Indice de réfraction du milieu', n, '');
      return { tokens, derivees: [],
        texte: ['Un faisceau lumineux traverse ' + obj + ' sur ', T('ep'), '. Le milieu a pour ', T('n'), ' (pour la lumière utilisée). On donne ', T('c'), '. Quelle est la vitesse de la lumière dans ce milieu (en m·s⁻¹) ?'],
        utiles: ['c', 'n'],
        raisons: { ep: 'L’épaisseur traversée n’intervient pas : la vitesse dépend seulement de l’indice du milieu.' },
        cherche: { bonne: 'La vitesse v de la lumière dans le milieu (en m·s⁻¹)', faux: ['La durée de la traversée du milieu (en s)', 'La longueur d’onde de la lumière dans le milieu (en nm)', 'La fréquence de la lumière (en Hz)'] },
        manque: null, solution: { txt: 'v = c / n', val: 3.0e8 / n, u: 'm·s⁻¹' } };
    },
  },
  {
    id: 'snell2', domaine: 'Lumière', titre: 'Réfraction : loi de Snell-Descartes', noms: ['Angle de réfraction', 'Indice du second milieu'],
    gen: () => { const m = tire([['l’eau', 1.33], ['le verre', 1.50], ['le plexiglas', 1.49]]); const i1 = tire([20, 30, 45, 60]); const n2 = m[1];
      return { milieu: m[0], n2, i1, lam: tire([532, 633, 650]), i2: Math.round(Math.asin(Math.sin(i1 * Math.PI / 180) / n2) * 180 / Math.PI * 10) / 10 }; },
    build: (p, q) => {
      const tokens = { n1: tok('n₁ = 1,00', 'Indice de réfraction de l’air', 1.0, ''), i1: tok(`${p.i1}°`, 'Angle d’incidence', p.i1, '°'), lam: tok(`${p.lam} nm`, 'Longueur d’onde du laser', p.lam, 'nm') };
      if (q === 0) {
        tokens.n2 = tok(`n₂ = ${nb(p.n2, 2)}`, 'Indice de réfraction du second milieu', p.n2, '');
        return { tokens, derivees: [],
          texte: ['Un faisceau laser de longueur d’onde ', T('lam'), ' passe de l’air (', T('n1'), ') vers ' + p.milieu + ' (', T('n2'), ') avec un angle d’incidence de ', T('i1'), '. Quel est l’angle de réfraction ?'],
          utiles: ['n1', 'n2', 'i1'],
          raisons: { lam: 'Les indices sont déjà donnés pour cette radiation : la longueur d’onde n’apparaît pas dans la loi n₁ sin i₁ = n₂ sin i₂.' },
          cherche: { bonne: 'L’angle de réfraction i₂ (en °)', faux: ['L’angle de réflexion (en °)', 'La déviation du rayon, c’est-à-dire l’écart entre i₁ et i₂ (en °)', 'La vitesse de la lumière dans le second milieu (en m·s⁻¹)'] },
          manque: null, solution: { txt: 'sin i₂ = n₁ × sin i₁ / n₂, puis i₂ = arcsin(sin i₂)', val: p.i2, u: '°' } };
      }
      tokens.i2 = tok(`${nb(p.i2, 1)}°`, 'Angle de réfraction', p.i2, '°');
      return { tokens, derivees: [],
        texte: ['Un faisceau laser de longueur d’onde ', T('lam'), ' passe de l’air (', T('n1'), ') vers un milieu transparent inconnu avec un angle d’incidence de ', T('i1'), '. L’angle de réfraction mesuré vaut ', T('i2'), '. Quel est l’indice de ce milieu ?'],
        utiles: ['n1', 'i1', 'i2'],
        raisons: { lam: 'La longueur d’onde n’intervient pas dans la loi de Snell-Descartes.' },
        cherche: { bonne: 'L’indice de réfraction n₂ du milieu inconnu (sans unité)', faux: ['L’angle de réflexion (en °)', 'La vitesse de la lumière dans le milieu (en m·s⁻¹)', 'La longueur d’onde de la lumière dans le milieu (en nm)'] },
        manque: null, solution: { txt: 'n₂ = n₁ × sin i₁ / sin i₂', val: Math.sin(p.i1 * Math.PI / 180) / Math.sin(p.i2 * Math.PI / 180), u: '' } };
    },
  },
  {
    id: 'noyau2', domaine: 'Matière à l’échelle microscopique', titre: 'Le noyau d’un atome', noms: ['Nombre de neutrons', 'Charge électrique du noyau'],
    gen: () => ({ at: tire([['carbone', 6, 12], ['azote', 7, 14], ['oxygène', 8, 16], ['sodium', 11, 23], ['aluminium', 13, 27], ['chlore', 17, 35], ['calcium', 20, 40], ['fer', 26, 56], ['cuivre', 29, 63]]) }),
    build: (p, q) => {
      const [nom, Z, A] = p.at;
      const tokens = { A: tok(`${A}`, 'Nombre de nucléons de l’atome', A, ''), Z: tok(`${Z}`, 'Numéro atomique (nombre de protons)', Z, ''), e: tok('e = 1,6 × 10⁻¹⁹ C', 'Charge élémentaire', 1.6e-19, 'C'), mp: tok('1,67 × 10⁻²⁷ kg', 'Masse d’un nucléon', 1.67e-27, 'kg') };
      const base = ['Un atome de ' + nom + ' contient ', T('A'), ' nucléons dont ', T('Z'), ' protons. '];
      if (q === 0) return { tokens, derivees: [],
        texte: [...base, 'On donne la charge élémentaire (', T('e'), ') et la masse d’un nucléon (', T('mp'), '). Quel est le nombre de neutrons de son noyau ?'],
        utiles: ['A', 'Z'],
        raisons: { e: 'La charge élémentaire sert à calculer une charge électrique, pas un nombre de particules.', mp: 'La masse d’un nucléon sert à calculer une masse, pas un nombre de particules.' },
        cherche: { bonne: 'Le nombre N de neutrons du noyau', faux: ['La charge électrique du noyau (en C)', 'Le nombre d’électrons de l’atome neutre', 'La masse du noyau (en kg)'] },
        manque: null, solution: { txt: 'N = A − Z', val: A - Z, u: '' } };
      return { tokens, derivees: [],
        texte: [...base, 'La charge d’un proton est égale à la charge élémentaire (', T('e'), ') et la masse d’un nucléon vaut ', T('mp'), '. Quelle est la charge électrique du noyau (en C) ?'],
        utiles: ['Z', 'e'],
        raisons: { A: 'Le nombre de nucléons compte aussi les neutrons, qui n’ont pas de charge : seul le nombre de protons intervient.', mp: 'La masse d’un nucléon n’intervient pas dans le calcul d’une charge.' },
        cherche: { bonne: 'La charge électrique Q du noyau (en C)', faux: ['Le nombre de neutrons du noyau', 'La masse du noyau (en kg)', 'La charge électrique de l’atome (en C)'] },
        manque: null, solution: { txt: 'Q = Z × e', val: Z * 1.6e-19, u: 'C' } };
    },
  },
  {
    id: 'dissol2', domaine: 'Cohésion et solubilité', titre: 'Dissoudre un soluté : quantité de matière et concentration', noms: ['Concentration en quantité de matière', 'Masse de soluté à peser'],
    gen: () => { const s = tire([['chlorure de sodium', 58.5], ['glucose', 180], ['saccharose', 342], ['sulfate de cuivre anhydre', 159.6]]);
      return { nom: s[0], M: s[1], m: tire([2, 5, 10, 20]), Vf: tire([100, 250, 500]), c: tire([0.05, 0.1, 0.2]), Ve: tire([40, 60, 80]), T: tire([18, 20, 25]) }; },
    build: (p, q) => {
      const tokens = { M: tok(`${nb(p.M)} g·mol⁻¹`, 'Masse molaire du ' + p.nom, p.M, 'g·mol⁻¹'), T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'), Ve: tok(`${p.Ve} mL`, 'Volume d’eau versé pour dissoudre', p.Ve / 1000, 'L') };
      if (q === 0) {
        tokens.m = tok(`${p.m} g`, 'Masse de soluté pesée', p.m, 'g');
        tokens.Vf = tok(`${p.Vf} mL`, 'Volume de la solution (fiole jaugée)', p.Vf / 1000, 'L');
        return { tokens, derivees: [{ id: 'n', nom: 'Quantité de matière n de soluté', expr: 'n = m / M', val: p.m / p.M, u: 'mol' }],
          texte: ['On dissout ', T('m'), ' de ' + p.nom + ' (', T('M'), ') dans environ ', T('Ve'), ' d’eau, puis on complète à ', T('Vf'), ' avec de l’eau distillée dans une fiole jaugée. La température de la solution est de ', T('T'), '. Quelle est la concentration en quantité de matière du soluté dans la solution (en mol·L⁻¹) ?'],
          utiles: ['m', 'M', 'Vf'],
          raisons: { Ve: 'C’est le volume d’eau versé au début : la solution finale a le volume de la fiole jaugée.', T: 'La température n’est pas une donnée de la formule c = n / V.' },
          cherche: { bonne: 'La concentration c du soluté (en mol·L⁻¹)', faux: ['La quantité de matière n de soluté (en mol)', 'La concentration en masse t du soluté (en g·L⁻¹)', 'La masse molaire du soluté (en g·mol⁻¹)'] },
          manque: null, solution: { txt: 'c = n / V avec n = m / M (V converti en L)', val: p.m / p.M / (p.Vf / 1000), u: 'mol·L⁻¹' } };
      }
      tokens.c = tok(`${nb(p.c, 2)} mol·L⁻¹`, 'Concentration souhaitée', p.c, 'mol·L⁻¹');
      tokens.Vf = tok(`${p.Vf} mL`, 'Volume de solution à préparer', p.Vf / 1000, 'L');
      return { tokens, derivees: [{ id: 'n', nom: 'Quantité de matière n de soluté à dissoudre', expr: 'n = c × V', val: p.c * p.Vf / 1000, u: 'mol' }],
        texte: ['On veut préparer une solution de ' + p.nom + ' de concentration ', T('c'), ' dans une fiole jaugée de ', T('Vf'), '. La solution est à ', T('T'), '. On dissout d’abord le soluté dans environ ', T('Ve'), ' d’eau. Donnée : ', T('M'), '. Quelle masse de soluté faut-il peser (en g) ?'],
        utiles: ['c', 'Vf', 'M'],
        raisons: { Ve: 'C’est le volume d’eau versé au début, pas le volume de la solution.', T: 'La température ne joue aucun rôle dans le calcul de la masse à peser.' },
        cherche: { bonne: 'La masse m de soluté à peser (en g)', faux: ['La quantité de matière n de soluté (en mol)', 'La concentration en masse t (en g·L⁻¹)', 'Le volume d’eau à verser (en mL)'] },
        manque: null, solution: { txt: 'm = n × M avec n = c × V (V converti en L)', val: p.c * (p.Vf / 1000) * p.M, u: 'g' } };
    },
  },
  {
    id: 'ener2', domaine: 'Énergie électrique', titre: 'Énergie et effet Joule', noms: ['Énergie consommée', 'Puissance dissipée par effet Joule'],
    gen: () => ({ P: tire([800, 1500, 2000]), dmin: tire([15, 30, 45, 90]), prix: 0.25, R: tire([1.0, 2.2, 4.7]), I: tire([1, 2, 5]), L: tire([2, 5, 10]) }),
    build: (p, q) => {
      if (q === 0) {
        const tokens = { P: tok(`${p.P} W`, 'Puissance de l’appareil', p.P / 1000, 'kW'), d: tok(`${p.dmin} min`, 'Durée de fonctionnement', p.dmin / 60, 'h'), prix: tok(`${nb(p.prix, 2)} € par kWh`, 'Prix de l’électricité', p.prix, '€·kWh⁻¹') };
        return { tokens, derivees: [],
          texte: ['Un four électrique de puissance ', T('P'), ' (supposée constante) fonctionne pendant ', T('d'), '. L’électricité coûte ', T('prix'), '. Quelle énergie électrique a-t-il consommée (en kWh) ?'],
          utiles: ['P', 'd'],
          raisons: { prix: 'Le prix servirait à calculer le coût de l’énergie, pas l’énergie elle-même.' },
          cherche: { bonne: 'L’énergie électrique E consommée (en kWh)', faux: ['La puissance P du four (en kW)', 'Le coût de l’énergie consommée (en €)', 'L’intensité du courant dans le four (en A)'] },
          manque: null, solution: { txt: 'E = P × Δt (P en kW, Δt en h)', val: p.P / 1000 * p.dmin / 60, u: 'kWh' } };
      }
      const tokens = { R: tok(`${nb(p.R, 1)} kΩ`, 'Résistance du résistor', p.R * 1000, 'Ω'), I: tok(`${p.I} mA`, 'Intensité du courant', p.I / 1000, 'A'), L: tok(`${p.L} cm`, 'Longueur du résistor', p.L / 100, 'm') };
      return { tokens, derivees: [],
        texte: ['Un résistor de résistance ', T('R'), ' et de longueur ', T('L'), ' est traversé par un courant d’intensité ', T('I'), '. Quelle puissance dissipe-t-il par effet Joule (en W) ?'],
        utiles: ['R', 'I'],
        raisons: { L: 'La longueur du résistor est une longueur : elle n’intervient pas dans P = R × I².' },
        cherche: { bonne: 'La puissance P dissipée par effet Joule (en W)', faux: ['La tension U aux bornes du résistor (en V)', 'L’énergie dissipée en une heure (en kWh)', 'La charge électrique qui traverse le résistor en une seconde (en C)'] },
        manque: null, solution: { txt: 'P = R × I² (R en Ω, I en A)', val: p.R * 1000 * Math.pow(p.I / 1000, 2), u: 'W' } };
    },
  },
  {
    id: 'meca2', domaine: 'Mécanique', titre: 'Énergie cinétique et travail', noms: ['Énergie cinétique', 'Travail d’une force'],
    gen: () => { const [mt, L] = tire([[0.8, 3.6], [1.2, 4.2], [1.5, 4.6]]); return { mt, L, v: tire([36, 54, 72, 90]), F: tire([0.5, 1.2, 2, 3]), d: tire([50, 80, 120, 300]), a: tire([0, 30, 45, 60]) }; },
    build: (p, q) => {
      if (q === 0) {
        const tokens = { m: tok(`${nb(p.mt)} t`, 'Masse du véhicule', p.mt * 1000, 'kg'), v: tok(`${p.v} km·h⁻¹`, 'Vitesse du véhicule', p.v / 3.6, 'm·s⁻¹'), L: tok(`${nb(p.L)} m`, 'Longueur du véhicule', p.L, 'm') };
        return { tokens, derivees: [],
          texte: ['Un véhicule de ', T('m'), ' et de ', T('L'), ' de long roule à ', T('v'), ' (dans le référentiel terrestre). Quelle est son énergie cinétique (en J) ?'],
          utiles: ['m', 'v'],
          raisons: { L: 'La longueur du véhicule n’intervient pas dans Ec = ½ m v².' },
          cherche: { bonne: 'L’énergie cinétique Ec du véhicule (en J)', faux: ['La puissance du moteur du véhicule (en W)', 'Le travail de la force motrice (en J)', 'L’énergie potentielle de pesanteur du véhicule (en J)'] },
          manque: null, solution: { txt: 'Ec = ½ × m × v² (m en kg, v en m·s⁻¹)', val: 0.5 * p.mt * 1000 * Math.pow(p.v / 3.6, 2), u: 'J' } };
      }
      const tokens = { F: tok(`${nb(p.F)} kN`, 'Valeur de la force', p.F * 1000, 'N'), d: tok(`${p.d} cm`, 'Distance parcourue', p.d / 100, 'm'), a: tok(`${p.a}°`, 'Angle entre la force et le déplacement', p.a, '°'), mt: tok(`${nb(p.mt)} t`, 'Masse de l’objet déplacé', p.mt * 1000, 'kg') };
      return { tokens, derivees: [],
        texte: ['Une force de valeur ', T('F'), ' agit sur un objet de ', T('mt'), ' qui se déplace de ', T('d'), '. L’angle entre la force et le déplacement est de ', T('a'), '. Quel est le travail de la force pendant ce déplacement (en J) ?'],
        utiles: ['F', 'd', 'a'],
        raisons: { mt: 'La masse de l’objet n’intervient pas dans W = F × d × cos α.' },
        cherche: { bonne: 'Le travail W de la force (en J)', faux: ['L’énergie cinétique de l’objet (en J)', 'La puissance de la force (en W)', 'L’énergie potentielle de pesanteur (en J)'] },
        manque: null, solution: { txt: 'W = F × d × cos α (F en N, d en m)', val: p.F * 1000 * p.d / 100 * Math.cos(p.a * Math.PI / 180), u: 'J' } };
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
  incertA: { n: 'n', xm: 'x̄', s: 's', k: 'k', res: '', dur: '' },
  compatS: { x: 'x', u: 'u', cref: 'x_ref', n: '', theta: '' },
  moteurPas: { N: 'N', D: 'D', Np: 'N_p', U: 'U', R: 'R' },
  champB: { BT: 'B_T', Ba: 'B_a', r1: 'r₁', r2: 'r₂', m: 'm', T: 'θ' },
  rho2: { T: '', mv: 'm_vide', mt: 'm_avec liquide', V: 'V', rho: 'ρ', VL: 'V' },
  conc2: { M: 'M', m: 'm', Vi: 'V_eau', Vf: 'V', t: 't' },
  poids2: { mg: 'm', g: 'g', V: 'V', mk: 'm', ga: 'g' },
  vitesse2: { d: 'd', t: 'Δt', m: 'm', dm: 'd', v: 'v' },
  ohm2: { R: 'R', I: 'I', L: 'ℓ', U: 'U', Rm: 'R' },
  indice2: { c: 'c', ep: 'e', v: 'v', n: 'n' },
  snell2: { n1: 'n₁', i1: 'i₁', lam: 'λ', n2: 'n₂', i2: 'i₂' },
  noyau2: { A: 'A', Z: 'Z', e: 'e', mp: 'm_nucléon' },
  dissol2: { M: 'M', T: '', Ve: 'V_eau', m: 'm', Vf: 'V', c: 'c' },
  ener2: { P: 'P', d: 'Δt', prix: 'prix', R: 'R', I: 'I', L: 'ℓ' },
  meca2: { m: 'm', v: 'v', L: 'ℓ', F: 'F', d: 'd', a: 'α', mt: 'm' },
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
