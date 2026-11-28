// Exercices ANA, VAL et S'APP de la simulation 305 « Piles : polarité, équation de fonctionnement et durée » (TSTL, PCM, séquence 4). Préfixe : pilp-.
// Capacités visées (jamais affichées) : polarité lue au voltmètre, anode et cathode, sens des porteurs, équation de fonctionnement, quantité d'électricité Q = n(e⁻) F, durée Q = i Δt.
import { METAUX } from './pilePcmModele.js';
const DOM = 'Piles : polarité, équation de fonctionnement et durée';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const PILP_ANA = [
  { id: 'pilp-ana-pole', domaine: DOM, titre: 'Lire le pôle + avec le signe de la tension',
    enonce: 'Une pile est formée d’une lame de fer plongée dans une solution d’ions fer (II) et d’une lame de cuivre plongée dans une solution d’ions cuivre (II), reliées par un pont salin. On branche un voltmètre : la borne V sur la lame de fer, la borne COM sur la lame de cuivre. Il affiche −0,78 V.', q: 'Quel est le pôle + de cette pile ?', options: [
      V('la lame de cuivre, reliée à la borne COM', 'Tension négative : la borne V est sur le pôle −. La lame de fer est donc le pôle −, et le cuivre le pôle +.'),
      F('la lame de fer, reliée à la borne V', 'Une tension négative indique que la borne V est reliée au pôle −, pas au pôle +.'),
      F('aucune : le signe − montre que la pile est défectueuse', 'Le signe renseigne seulement sur l’orientation du branchement.'),
      F('on ne peut pas le savoir sans connaître les couples', 'Le signe de la tension suffit à repérer les pôles.'),
    ] },
  { id: 'pilp-ana-electrons', domaine: DOM, titre: 'Sens de circulation des électrons', schema: { type: 'pileLampe' },
    enonce: 'Une pile zinc / argent débite dans une lampe. Le zinc est le pôle −, l’argent est le pôle +. Les deux demi-piles sont reliées par un pont salin et la lampe est branchée entre les deux lames par des fils de cuivre.', q: 'Dans les fils, les électrons circulent :', options: [
      V('de la lame de zinc vers la lame d’argent, à travers la lampe', 'Les électrons quittent l’anode (pôle −, zinc) et gagnent la cathode (pôle +, argent). Le courant conventionnel va en sens inverse.'),
      F('de la lame d’argent vers la lame de zinc, à travers la lampe', 'Ce serait le sens du courant conventionnel, pas celui des électrons.'),
      F('dans le pont salin, de la lame de zinc vers celle d’argent', 'Les électrons ne circulent que dans les fils ; le pont salin transporte des ions.'),
      F('de façon alternée : ils font des allers-retours dans les fils', 'Une pile fournit un courant continu : les électrons circulent toujours dans le même sens.'),
    ] },
  { id: 'pilp-ana-pont', domaine: DOM, titre: 'Le rôle des ions du pont salin',
    enonce: 'Dans une pile cuivre / zinc, le pont salin contient une solution de nitrate de potassium (ions K⁺ et NO₃⁻). Pendant le fonctionnement, la demi-pile de zinc (anode) reçoit des ions Zn²⁺ et la demi-pile de cuivre (cathode) perd des ions Cu²⁺.', q: 'Pour que chaque solution reste électriquement neutre, les ions nitrate NO₃⁻ du pont se déplacent :', options: [
      V('vers la demi-pile de zinc, où des charges positives apparaissent', 'La solution de l’anode gagne des cations Zn²⁺ : des anions arrivent pour la neutraliser.'),
      F('vers la demi-pile de cuivre, où des charges positives disparaissent', 'Du côté du cuivre, ce sont des charges positives qui manquent : les cations K⁺ y vont.'),
      F('vers les deux demi-piles à parts égales, sans direction privilégiée', 'Les deux demi-piles ont des besoins opposés : le mouvement est orienté.'),
      F('ils ne bougent pas : seuls les électrons assurent la neutralité', 'Les électrons ne traversent pas les solutions ; ce sont les ions du pont qui assurent la neutralité.'),
    ] },
  { id: 'pilp-ana-intensite', domaine: DOM, titre: 'Débiter plus fort : capacité et durée',
    enonce: 'Une pile contient des quantités fixées de réactifs. Elle alimente un récepteur avec un courant constant de 20 mA jusqu’à son usure complète. On répète l’expérience avec une pile identique, neuve, mais avec un récepteur qui impose 100 mA.', q: 'Avec 100 mA, par rapport à 20 mA :', options: [
      V('la quantité d’électricité Q est la même et la durée est divisée par 5', 'Q = n(e⁻) F ne dépend que des réactifs ; Δt = frac(Q|i) est 5 fois plus petite quand i est 5 fois plus grand.'),
      F('la quantité d’électricité Q est multipliée par 5 et la durée est la même', 'Les réactifs sont les mêmes : la charge totale disponible ne change pas.'),
      F('la quantité d’électricité Q et la durée sont multipliées par 5', 'Un courant plus intense épuise plus vite la pile : la durée diminue.'),
      F('la quantité d’électricité Q est divisée par 5 et la durée est la même', 'Q est fixée par le réactif limitant, pas par l’intensité du courant.'),
    ] },
  { id: 'pilp-ana-equation', domaine: DOM, titre: 'Équation de fonctionnement d’une pile fer / argent',
    enonce: 'Dans une pile fer / argent, le fer est le pôle − (couple Fe²⁺/Fe) et l’argent le pôle + (couple Ag⁺/Ag). À l’anode, le fer s’oxyde : Fe → Fe²⁺ + 2 e⁻. À la cathode, les ions argent se réduisent : Ag⁺ + e⁻ → Ag.', q: 'L’équation de fonctionnement de cette pile est :', options: [
      V('Fe + 2 Ag⁺ → Fe²⁺ + 2 Ag', 'On multiplie la réduction par 2 pour égaliser les électrons, puis on additionne : les électrons s’annulent.'),
      F('Fe + Ag⁺ → Fe²⁺ + Ag, sans autre modification', 'Les charges ne sont pas équilibrées : Fe donne 2 e⁻, il en faut 2 captés par 2 Ag⁺.'),
      F('Fe²⁺ + 2 Ag → Fe + 2 Ag⁺, car le pôle + est réduit', 'Ce serait le sens inverse : à l’anode le fer s’oxyde, à la cathode l’argent se réduit.'),
      F('Fe + 2 Ag⁺ + 2 e⁻ → Fe²⁺ + 2 Ag', 'L’équation de fonctionnement n’a plus d’électrons : ils s’annulent.'),
    ] },
];

export const PILP_VAL = [
  P({ id: 'pilp-val-q', domaine: DOM, niveau: 2, titre: 'Quantité d’électricité d’une pile cuivre / zinc', plausible: false,
    enonce: 'Dans une pile, la demi-pile de cuivre contient 50 mL de solution d’ions Cu²⁺ à 0,20 mol/L ; la lame de zinc, de 3,0 g, est en large excès. L’équation de fonctionnement est Zn + Cu²⁺ → Zn²⁺ + Cu. Un élève écrit : « Cu²⁺ est le réactif limitant, n(Cu²⁺) = 0,20 × 0,050 = 0,010 mol, donc n(e⁻) = 0,010 mol et Q = 0,010 × 96 500 = 965 C. »',
    reperes: [['Constante de Faraday', 'F = 96 500 C/mol']],
    ver: 'Chaque ion Cu²⁺ capte 2 électrons : n(e⁻) = 2 × 0,010 = 0,020 mol, donc Q = 0,020 × 96 500 = 1 930 C, le double du résultat de l’élève.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il oublie les 2 électrons échangés par ion Cu²⁺ : n(e⁻) = 2 n(Cu²⁺)', 'La demi-équation Cu²⁺ + 2 e⁻ → Cu montre 2 électrons par ion réduit : Q vaut 1 930 C.'),
      F('le réactif limitant est le zinc et non les ions Cu²⁺ de la solution', 'Le zinc est en large excès : le réactif limitant est bien Cu²⁺.'),
      F('il doit diviser par F plutôt que multiplier : Q = frac(n(e⁻)|F), en coulombs', 'La relation est Q = n(e⁻) × F, comme le fait l’élève.'),
    ] }),
  P({ id: 'pilp-val-duree', domaine: DOM, niveau: 1, titre: 'Durée de fonctionnement d’une pile', plausible: true,
    enonce: 'Une pile peut débiter une quantité d’électricité Q = 1,2 × 10³ C. Elle alimente un récepteur avec un courant constant i = 50 mA. Un élève calcule : « Δt = frac(Q|i) = frac(1 200|0,050) = 24 000 s, soit frac(24 000|3 600) = 6,7 h. »',
    reperes: [['Quantité d’électricité Q', '1,2 × 10³ C'], ['Intensité i', '50 mA']],
    ver: 'Le calcul est correct : i = 50 mA = 0,050 A ; Δt = 24 000 s ≈ 6,7 h.',
    q2: 'Pourquoi l’élève divise-t-il par 0,050 et non par 50 ?',
    options: [
      V('car l’intensité doit être en ampères pour obtenir des secondes', 'Q en coulombs et i en ampères donnent Δt en secondes : 50 mA = 0,050 A.'),
      F('parce que le courant s’exprime toujours avec des nombres décimaux en physique', 'Ce n’est pas une question de décimaux, mais d’unité : l’ampère est l’unité du système international.'),
      F('parce que la pile ne débite qu’une petite fraction de sa capacité totale', 'La pile débite toute sa capacité : c’est l’unité de i qu’il faut convertir.'),
    ] }),
];

const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const fr = x => String(x).replace('.', ',');
const MZN = METAUX.zn.M;
const gen = () => {
  for (;;) {
    const p = { c: tire([0.05, 0.10, 0.15, 0.20]), V: tire([50, 100, 150, 200]), m: tire([0.2, 0.3, 0.5, 1.0, 2.0, 3.0]), I: tire([20, 50, 100]), U: tire([1.05, 1.10, 1.12]) };
    const a = 2 * p.c * p.V / 1000, b = 2 * p.m / MZN;
    if (Math.max(a, b) / Math.min(a, b) >= 1.3) return p;
  }
};
const toks = p => ({
  c: tok(`${fr(p.c.toFixed(2))} mol/L`, 'Concentration en ions cuivre (II)', p.c, 'mol/L'), V: tok(`${p.V} mL`, 'Volume de solution', p.V, 'mL'), m: tok(`${fr(p.m.toFixed(1))} g`, 'Masse de la lame de zinc', p.m, 'g'),
  M: tok(`${fr(MZN)} g/mol`, 'Masse molaire du zinc', MZN, 'g/mol'), I: tok(`${p.I} mA`, 'Intensité du courant', p.I, 'mA'), F: tok('96 500 C/mol', 'Constante de Faraday', 96500, 'C/mol'),
  U: tok(`${fr(p.U.toFixed(2))} V`, 'Tension à vide de la pile', p.U, 'V'),
});
export const PILP_SAPP = [
  {
    id: 'pilp-sapp-q', domaine: DOM, titre: 'Une pile cuivre / zinc : quantité d’électricité', noms: ['Quantité d’électrons', 'Quantité d’électricité'],
    gen,
    build: epure((p, q) => {
      const tokens = toks(p);
      const nIon = p.c * p.V / 1000, nZn = p.m / MZN, ne = 2 * Math.min(nIon, nZn);
      const debut = ['Une pile est formée d’une demi-pile contenant ', T('V'), ' de solution d’ions cuivre (II) à ', T('c'), ' et d’une lame de zinc de masse ', T('m'), '. Équation de fonctionnement : Zn + Cu²⁺ → Zn²⁺ + Cu (chaque ion Cu²⁺ et chaque atome Zn échangent 2 électrons). La pile débite jusqu’à usure complète ; M(Zn) = ', T('M'), ', tension à vide ', T('U'), ', ', T('I'), ' débités. '];
      if (q === 0) return { tokens, derivees: ['n(Cu²⁺) = c V', 'n(Zn) = frac(m|M)', 'n(e⁻) = 2 × n du réactif limitant'], texte: [...debut, 'Quelle quantité d’électrons n(e⁻) cette pile peut-elle échanger, en mol ?'], utiles: ['V', 'c', 'm', 'M'],
        raisons: { U: 'La tension à vide ne sert pas à calculer une quantité de matière.', I: 'L’intensité ne change pas la quantité d’électrons échangés.', F: 'F sert à passer de n(e⁻) à Q, pas ici.' },
        cherche: { bonne: 'La quantité d’électrons échangés (en mol)', faux: ['La quantité d’électricité (en C)', 'La durée de fonctionnement (en h)', 'La quantité de zinc oxydé (en mol)'] },
        manque: null, solution: { txt: 'n(e⁻) = 2 × n(réactif limitant)', val: ne, u: 'mol' } };
      return { tokens, derivees: ['n(Cu²⁺) = c V', 'n(Zn) = frac(m|M)', 'n(e⁻) = 2 × n du réactif limitant', 'Q = n(e⁻) F'], texte: [...debut, 'Quelle quantité d’électricité Q cette pile peut-elle débiter, en C ? (F = ', T('F'), ')'], utiles: ['V', 'c', 'm', 'M', 'F'],
        raisons: { U: 'La tension à vide ne sert pas à calculer Q.', I: 'L’intensité ne change pas Q (elle fixe seulement la durée).' },
        cherche: { bonne: 'La quantité d’électricité débitée (en C)', faux: ['La quantité d’électrons échangés (en mol)', 'La durée de fonctionnement (en h)', 'L’énergie électrique fournie (en J)'] },
        manque: null, solution: { txt: 'Q = n(e⁻) × F', val: ne * 96500, u: 'C' } };
    }),
  },
  {
    id: 'pilp-sapp-duree', schema: () => ({ type: 'pileLampe', gauche: 'Zn', droite: 'Cu' }), domaine: DOM, titre: 'Une pile cuivre / zinc : durée de fonctionnement', noms: ['Quantité d’électricité', 'Durée de fonctionnement'],
    gen,
    build: epure((p, q) => {
      const tokens = toks(p);
      const nIon = p.c * p.V / 1000, nZn = p.m / MZN, ne = 2 * Math.min(nIon, nZn), Q = ne * 96500;
      const debut = ['Une pile est formée d’une demi-pile contenant ', T('V'), ' de solution d’ions cuivre (II) à ', T('c'), ' et d’une lame de zinc de masse ', T('m'), '. Équation de fonctionnement : Zn + Cu²⁺ → Zn²⁺ + Cu (2 électrons échangés par ion Cu²⁺ ou par atome Zn). M(Zn) = ', T('M'), ', F = ', T('F'), ', tension à vide ', T('U'), '. La pile débite un courant constant de ', T('I'), ' jusqu’à usure complète. '];
      if (q === 0) return { tokens, derivees: ['n(Cu²⁺) = c V', 'n(Zn) = frac(m|M)', 'n(e⁻) = 2 × n du réactif limitant', 'Q = n(e⁻) F'], texte: [...debut, 'Quelle quantité d’électricité Q la pile débite-t-elle, en C ?'], utiles: ['V', 'c', 'm', 'M', 'F'],
        raisons: { U: 'La tension à vide ne sert pas à calculer Q.', I: 'L’intensité ne change pas Q ; elle servira pour la durée.' },
        cherche: { bonne: 'La quantité d’électricité débitée (en C)', faux: ['La durée de fonctionnement (en h)', 'La quantité d’électrons échangés (en mol)', 'L’énergie électrique fournie (en J)'] },
        manque: null, solution: { txt: 'Q = n(e⁻) × F', val: Q, u: 'C' } };
      return { tokens, derivees: ['n(e⁻) = 2 × n du réactif limitant', 'Q = n(e⁻) F', 'Δt = frac(Q|i)'], texte: [...debut, 'Quelle est la durée de fonctionnement Δt, en heures ?'], utiles: ['V', 'c', 'm', 'M', 'F', 'I'],
        raisons: { U: 'La tension à vide ne sert pas pour la durée.' },
        cherche: { bonne: 'La durée de fonctionnement (en h)', faux: ['La quantité d’électricité débitée (en C)', 'La quantité d’électrons échangés (en mol)', 'La puissance de la pile (en W)'] },
        manque: null, solution: { txt: 'Δt = frac(Q|i)', val: Q / (p.I / 1000) / 3600, u: 'h' } };
    }),
  },
];
