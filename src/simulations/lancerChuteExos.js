// Exercices ANA, VAL et S'APP de la simulation 251 « Lancer vers le haut et chute : courbes d'énergie ». Préfixe : lcv-.
// Capacités visées (jamais affichées) : Epp = m g z à une constante près ; Em = Ec + Epp ; conservation de Em sans frottement ; ΔEm = W(f) avec frottement ; lecture de courbes d'énergie.
const DOM = 'Lancer vers le haut et chute : courbes d’énergie';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const LCV_ANA = [
  { id: 'lcv-ana-ref', domaine: DOM, titre: 'Un autre choix pour z = 0',
    enonce: 'Une balle est lancée vers le haut depuis le sol. Un premier élève calcule l’énergie potentielle de pesanteur Epp = m g z en prenant z = 0 au sol ; un second prend z = 0 au sommet d’un toit situé 3 m plus haut. Ils étudient le même vol.', q: 'Quelle grandeur est la même pour les deux élèves ?', options: [
      V('la variation d’énergie potentielle entre deux instants du vol', 'Changer l’origine ajoute la même constante à Epp à tout instant : sa valeur change, pas sa variation. Epp est définie à une constante près.'),
      F('la valeur de l’énergie potentielle au lancement', 'L’origine n’est pas la même : au lancement, Epp vaut 0 pour le premier et −m g × 3 pour le second.'),
      F('la valeur de l’énergie mécanique au sommet de la trajectoire', 'Em = Ec + Epp contient Epp : elle est décalée de la même constante.'),
      F('la valeur de l’énergie potentielle au sommet de la trajectoire', 'Les deux élèves n’ont pas la même origine, donc pas la même valeur de z au sommet.'),
    ] },
  { id: 'lcv-ana-conserv', domaine: DOM, titre: 'La montée sans frottement',
    enonce: 'Une balle est lancée verticalement vers le haut. On néglige les frottements de l’air. On suit l’énergie cinétique Ec, l’énergie potentielle de pesanteur Epp et l’énergie mécanique Em = Ec + Epp entre le lancement et le sommet.', q: 'Comment évoluent Ec, Epp et Em pendant la montée ?', options: [
      V('Ec diminue, Epp augmente, Em reste constante', 'Le poids est la seule force qui travaille : il convertit de l’énergie cinétique en énergie potentielle, sans rien perdre. Em se conserve.'),
      F('Ec diminue, Epp augmente, Em diminue', 'Sans frottement, aucune force ne retire d’énergie mécanique : Em reste constante.'),
      F('Ec et Epp augmentent, Em augmente aussi', 'La balle ralentit en montant : son énergie cinétique diminue.'),
      F('Ec reste constante, Epp augmente, Em augmente', 'La vitesse diminue pendant la montée, donc Ec diminue.'),
    ] },
  { id: 'lcv-ana-frott', domaine: DOM, titre: 'Le retour avec frottement',
    enonce: 'Une balle est lancée vers le haut avec une vitesse v0, puis retombe jusqu’à son point de lancement. L’air exerce un frottement non négligeable sur la balle.', q: 'Comment se compare l’énergie cinétique de la balle à son retour à celle du lancement ?', options: [
      V('plus petite : Em a diminué alors que Epp est inchangée', 'Au retour, l’altitude est la même qu’au lancement : seule Ec peut avoir changé, et elle a diminué de l’énergie dissipée par le frottement.'),
      F('identique : la balle revient à l’altitude de départ', 'Revenir à la même altitude conserve Epp, pas Ec : le frottement a retiré de l’énergie à la balle.'),
      F('plus grande : le poids a accéléré la balle à la descente', 'Le poids a accéléré la balle à la descente mais l’avait ralentie à la montée : sur le vol complet son travail est nul.'),
      F('nulle : la balle s’arrête en arrivant au sol', 'La balle arrive avec une vitesse non nulle (plus petite qu’au lancement).'),
    ] },
  { id: 'lcv-ana-courbes', domaine: DOM, titre: 'Reconnaître les trois courbes',
    enonce: 'Sur le graphique d’un lancer vertical sans frottement, en fonction du temps, on voit trois courbes : une droite horizontale ; une courbe qui part de zéro, passe par un maximum au sommet puis revient à zéro ; une courbe qui part d’un maximum, tombe à zéro au sommet puis remonte.', q: 'Quelle association est correcte ?', options: [
      V('horizontale : Em ; part de zéro : Epp ; part du maximum : Ec', 'Em est constante sans frottement ; Epp = m g z est nulle au sol et maximale au sommet ; Ec = ½ m v² est maximale au lancement et nulle au sommet (v = 0).'),
      F('horizontale : Ec ; part de zéro : Em ; part d’un maximum : Epp', 'Ec varie avec la vitesse, qui change tout au long du vol.'),
      F('horizontale : Epp ; part de zéro : Ec ; part d’un maximum : Em', 'Epp varie avec l’altitude, qui change tout au long du vol.'),
      F('horizontale : Em ; part de zéro : Ec ; part du max. : Epp', 'Au lancement la balle a une vitesse non nulle : Ec n’est pas nulle, c’est Epp qui vaut 0 (z = 0).'),
    ] },
];

export const LCV_VAL = [
  P({ id: 'lcv-val-hmax', domaine: DOM, niveau: 1, titre: 'Hauteur atteinte par une balle lancée', plausible: false,
    enonce: 'Un élève lance une balle verticalement à 10 m/s, sans frottement. Il écrit : « Au sommet Ec = 0 et Em est constante, donc ½ m v0² = m g h, soit h = v0² ÷ (2 g) = 100 ÷ (2 × 0,98) ≈ 51 m. »',
    reperes: [['Vitesse de lancement', '10 m/s'], ['g', '9,8 N/kg'], ['Ordre de grandeur', 'un lancer à la main monte de quelques mètres']],
    ver: 'Le raisonnement est juste, mais g a été pris égal à 0,98 au lieu de 9,8 : h = 100 ÷ (2 × 9,8) ≈ 5,1 m. Une balle lancée à la main à 10 m/s ne monte pas à 51 m. L’affirmation n’est pas plausible.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a écrit g = 0,98 au lieu de 9,8 N/kg dans son calcul de h', 'Avec g = 9,8 N/kg : h = 100 ÷ 19,6 ≈ 5,1 m.'),
      F('il a oublié que l’énergie cinétique vaut ½ m v² et non m v²', 'Il a bien utilisé ½ m v0² = m g h.'),
      F('il a utilisé la conservation de Em alors qu’il y a un frottement', 'L’énoncé précise qu’on néglige les frottements : Em se conserve.'),
    ] }),
  P({ id: 'lcv-val-perte', domaine: DOM, niveau: 2, titre: 'Énergie perdue avec le frottement de l’air', plausible: true,
    enonce: 'Un élève mesure qu’une balle lancée vers le haut à 12 m/s revient à son point de départ à 10 m/s à cause du frottement de l’air. Il en conclut : « Son énergie mécanique a diminué d’environ 30 %. »',
    reperes: [['Au lancement (z = 0)', 'Em = Ec = ½ m × 12²'], ['Au retour (z = 0)', 'Em = Ec = ½ m × 10²'], ['Rapport des carrés', '10² ÷ 12² ≈ 0,69']],
    ver: 'Les altitudes de départ et d’arrivée sont les mêmes : Em est égale à Ec aux deux instants. Em passe de ½ m × 144 à ½ m × 100, soit 100 ÷ 144 ≈ 69 % de sa valeur initiale : elle a diminué d’environ 31 %. L’élève a raison.',
    q2: 'Pourquoi l’énergie perdue n’est-elle pas de 17 % (la baisse de la vitesse) ?',
    options: [
      V('parce que Ec est proportionnelle au carré de la vitesse', 'Ec = ½ m v² : une vitesse qui baisse de 17 % fait baisser Ec d’environ 31 %.'),
      F('parce que le poids fournit de l’énergie à la balle', 'Sur un vol qui revient au point de départ, le travail du poids est nul.'),
      F('parce que l’énergie perdue dépend de la masse de la balle', 'La masse se simplifie dans le rapport des énergies.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const G = 9.8;
const fmt = z => String(z).replace('.', ',');
export const LCV_SAPP = [
  {
    id: 'lcv-sapp-hauteur', domaine: DOM, titre: 'Balle lancée vers le haut : énergie au départ et altitude du sommet', noms: ['Énergie cinétique de la balle au lancement', 'Altitude maximale atteinte par la balle'],
    gen: () => { const v0 = tire([6, 8, 10, 12, 15]); return { m: tire([0.05, 0.10, 0.20, 0.50]), v0, tm: Math.round(v0 / G * 100) / 100 }; },
    build: epure((p, q) => {
      const tokens = {
        m: tok(`${fmt(p.m.toFixed(2))} kg`, 'Masse de la balle', p.m, 'kg'),
        v0: tok(`${p.v0} m/s`, 'Vitesse de lancement', p.v0, 'm/s'),
        tm: tok(`${fmt(p.tm)} s`, 'Durée de la montée', p.tm, 's'),
        g: tok('9,8 N/kg', 'Valeur du champ de pesanteur', G, 'N/kg'),
      };
      const debut = ['Une balle de masse ', T('m'), ' est lancée verticalement vers le haut, depuis le sol, à la vitesse ', T('v0'), '. Elle met ', T('tm'), ' pour atteindre son sommet. On néglige les frottements de l’air ; g = ', T('g'), '. '];
      if (q === 0) return { tokens, derivees: ['Ec = ½ × m × v²'], texte: [...debut, 'Quelle est l’énergie cinétique de la balle au lancement, en joules ?'], utiles: ['m', 'v0'],
        raisons: { g: 'g ne sert pas : l’énergie cinétique ne dépend que de la masse et de la vitesse.', tm: 'La durée de la montée ne sert pas pour une énergie cinétique.' },
        cherche: { bonne: 'L’énergie cinétique de la balle au lancement (en J)', faux: ['L’énergie potentielle de pesanteur au sommet (en J)', 'La force exercée par la main sur la balle (en N)', 'L’altitude maximale atteinte (en m)'] },
        manque: null, solution: { txt: 'Ec = ½ × m × v0²', val: 0.5 * p.m * p.v0 * p.v0, u: 'J' } };
      return { tokens, derivees: ['sans frottement, Em est constante', 'au sommet v = 0 donc Ec = 0', 'm × g × h = ½ × m × v0²'], texte: [...debut, 'Quelle est l’altitude maximale atteinte par la balle, en mètres ?'], utiles: ['v0', 'g'],
        raisons: { m: 'La masse se simplifie : m × g × h = ½ × m × v0² donne h = v0² ÷ (2 g).', tm: 'La durée de la montée ne sert pas : l’énergie suffit.' },
        cherche: { bonne: 'L’altitude maximale atteinte par la balle (en m)', faux: ['La vitesse de la balle au retour au sol (en m/s)', 'L’énergie cinétique de la balle au sommet (en J)', 'Le travail du poids sur la montée (en J)'] },
        manque: null, solution: { txt: 'h = v0² ÷ (2 × g)', val: p.v0 * p.v0 / (2 * G), u: 'm' } };
    }),
  },
  {
    id: 'lcv-sapp-frott', domaine: DOM, titre: 'Balle lancée avec frottement : énergie dissipée et force moyenne', noms: ['Énergie mécanique dissipée pendant le vol', 'Valeur moyenne de la force de frottement'],
    gen: () => { const m = tire([0.20, 0.30, 0.50]), v0 = tire([10, 12, 15]), f = tire([0.2, 0.3, 0.5]), h = 0.5 * m * v0 * v0 / (m * G + f), v1 = Math.sqrt(2 * (m * G - f) * h / m); return { m, v0, h: Math.round(h * 10) / 10, v1: Math.round(v1 * 10) / 10 }; },
    build: epure((p, q) => {
      const dE = 0.5 * p.m * (p.v0 * p.v0 - p.v1 * p.v1);
      const tokens = {
        m: tok(`${fmt(p.m.toFixed(2))} kg`, 'Masse de la balle', p.m, 'kg'),
        v0: tok(`${p.v0} m/s`, 'Vitesse de lancement', p.v0, 'm/s'),
        v1: tok(`${fmt(p.v1.toFixed(1))} m/s`, 'Vitesse au retour au sol', p.v1, 'm/s'),
        h: tok(`${fmt(p.h.toFixed(1))} m`, 'Altitude maximale atteinte', p.h, 'm'),
      };
      const debut = ['Une balle de masse ', T('m'), ' est lancée verticalement vers le haut, depuis le sol, à la vitesse ', T('v0'), '. Elle atteint l’altitude maximale ', T('h'), ', puis retombe et touche le sol à la vitesse ', T('v1'), '. L’air exerce un frottement dont on cherche la valeur moyenne. '];
      if (q === 0) return { tokens, derivees: ['Em = Ec au sol (z = 0)', 'énergie dissipée = Em au lancement − Em au retour'], texte: [...debut, 'Quelle énergie mécanique le frottement a-t-il dissipée pendant tout le vol, en joules ?'], utiles: ['m', 'v0', 'v1'],
        raisons: { h: 'L’altitude maximale ne sert pas : au sol, Em = Ec aux deux instants, il suffit de comparer les vitesses.' },
        cherche: { bonne: 'L’énergie mécanique dissipée pendant tout le vol (en J)', faux: ['L’énergie potentielle de la balle au sommet (en J)', 'Le travail du poids sur le vol complet (en J)', 'La force de frottement à l’instant du lancement (en N)'] },
        manque: null, solution: { txt: 'ΔE = ½ × m × (v0² − v1²)', val: dE, u: 'J' } };
      return { tokens, derivees: ['énergie dissipée = |W(f)|', 'W(f) = − f × distance parcourue', 'distance parcourue = 2 × h'], texte: [...debut, 'Quelle est la valeur moyenne de la force de frottement, en newtons ?'], utiles: ['m', 'v0', 'v1', 'h'],
        raisons: {},
        cherche: { bonne: 'La valeur moyenne de la force de frottement (en N)', faux: ['Le poids de la balle (en N)', 'La durée du vol (en s)', 'L’énergie dissipée pendant la montée seule (en J)'] },
        manque: null, solution: { txt: 'f = ½ × m × (v0² − v1²) ÷ (2 × h)', val: dE / (2 * p.h), u: 'N' } };
    }),
  },
];
