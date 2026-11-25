// Exercices ANA (prévoir sans calculer), VAL (plausible ?) et S'APP (repérer les données utiles) de la simulation 229 « Éclairement et distance à la source » (TSTL, PCM, Énergie et ondes).
// Préfixe d'identifiants : pve- ; domaine : « Panneau photovoltaïque : éclairement et distance à la source ». Branchés dans AtelierAnalyserBanque.js, AtelierValiderBanque.js et AtelierDonneesBanque.js ; les familles REA sont dans AtelierRealiserBanque.jsx.
// Capacités visées (jamais affichées) : relation entre flux énergétique et éclairement (E = Φ ÷ S) ; effectuer le bilan énergétique d'un panneau photovoltaïque ; estimer un rendement. Aucune situation du Moodle : valeurs inventées.
const DOM = 'Panneau photovoltaïque : éclairement et distance à la source';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

// ───────────── ANA : prévoir sans calculer ─────────────
export const PVE_ANA = [
  { id: 'pve-ana-double', domaine: DOM, titre: 'Un capteur deux fois plus loin',
    enonce: 'Une petite source lumineuse émet un flux constant de façon uniforme dans toutes les directions. Un capteur d’éclairement est placé à 40 cm de la source, face à elle. On l’éloigne à 80 cm, sans rien changer d’autre.', q: 'Comment évolue l’éclairement mesuré par le capteur ?', options: [
      V('il est divisé par 4, car la surface de la sphère est 4 fois plus grande', 'La même puissance lumineuse se répartit sur une sphère dont la surface (4πd²) est 4 fois plus grande quand d double : l’éclairement est divisé par 4.'),
      F('il est divisé par 2, car la distance a été multipliée par 2 (proportionnalité inverse)', 'La surface de la sphère varie comme d², pas comme d : doubler la distance divise l’éclairement par 2² = 4, pas par 2.'),
      F('il est multiplié par 2, car la lumière parcourt un chemin deux fois plus long', 'Plus loin de la source, la lumière est plus étalée : l’éclairement diminue.'),
      F('il ne change pas, car le flux émis par la source reste constant', 'Le flux émis est constant, mais il se répartit sur une surface plus grande : l’éclairement, lui, diminue.'),
    ] },
  { id: 'pve-ana-flux', domaine: DOM, titre: 'Une source deux fois plus puissante',
    enonce: 'Un panneau photovoltaïque est placé à 60 cm d’une petite source lumineuse qui émet de façon uniforme dans toutes les directions. On remplace la source par une autre, de même taille, dont le flux lumineux émis est deux fois plus grand. Le panneau ne bouge pas.', q: 'Comment évolue l’éclairement reçu par le panneau ?', options: [
      V('il est multiplié par 2, car l’éclairement est proportionnel au flux', 'E = Φ ÷ (4πd²) : à distance fixée, l’éclairement est proportionnel au flux émis Φ. Φ double, donc E double.'),
      F('il est multiplié par 4, car le flux est élevé au carré dans la formule', 'Le carré porte sur la distance, pas sur le flux : E est simplement proportionnel à Φ.'),
      F('il ne change pas, car la distance entre la source et le panneau est la même', 'La distance est la même, mais le flux émis est plus grand : l’éclairement augmente proportionnellement.'),
      F('il est divisé par 2, car la lumière est plus étalée', 'Rien n’est plus étalé : la surface de la sphère est la même, la puissance qui la traverse double.'),
    ] },
  { id: 'pve-ana-surface', domaine: DOM, titre: 'Un panneau trois fois plus grand',
    enonce: 'Deux panneaux, de surfaces S et 3 × S, sont placés l’un après l’autre exactement à la même distance d’une même source lumineuse, face à elle. La distance est grande devant la taille des panneaux.', q: 'Que peut-on dire de l’éclairement et de la puissance lumineuse reçue par le grand panneau ?', options: [
      V('l’éclairement est le même, la puissance lumineuse reçue est triplée', 'L’éclairement ne dépend que de la source et de la distance. Plum = E × S : avec E inchangé, une surface triple reçoit une puissance triple.'),
      F('l’éclairement est triplé, la puissance lumineuse reçue aussi', 'L’éclairement est la puissance reçue par mètre carré : il dépend de la distance, pas de la taille du panneau.'),
      F('l’éclairement est divisé par 3, car la lumière se répartit sur le panneau', 'La lumière reçue par mètre carré est la même ; c’est la puissance totale qui augmente avec la surface.'),
      F('l’éclairement et la puissance reçue sont les mêmes, car la distance est la même', 'À éclairement égal, Plum = E × S est proportionnelle à la surface : elle triple.'),
    ] },
  { id: 'pve-ana-tiers', domaine: DOM, titre: 'Trois fois plus près de la source',
    enonce: 'Une source lumineuse ponctuelle émet un flux constant dans toutes les directions. On mesure l’éclairement à 90 cm de la source, puis on rapproche le capteur à 30 cm, face à la source.', q: 'Par quel facteur l’éclairement est-il multiplié ?', options: [
      V('par 9, car la distance est divisée par 3 et E varie comme 1/d²', 'La distance est divisée par 3, donc la surface 4πd² de la sphère est divisée par 3² = 9 : l’éclairement est multiplié par 9.'),
      F('par 3, car l’éclairement est inversement proportionnel à la distance', 'L’éclairement varie comme l’inverse du carré de la distance : diviser d par 3 multiplie E par 9, pas par 3.'),
      F('par 6, car il y a deux fois plus de lumière à chaque division', 'Il n’y a pas d’addition de facteurs : E varie comme 1/d², soit un facteur 3² = 9.'),
      F('par 27, car la distance est divisée par 3 et E varie comme 1/d³', 'Le facteur est 3² = 9 : la distance est élevée au carré, pas au cube.'),
    ] },
];

// ───────────── VAL : plausible ? ─────────────
export const PVE_VAL = [
  P({ id: 'pve-val-correct', domaine: DOM, niveau: 1, titre: 'Éclairement à 1,5 m d’une source de 200 W', plausible: true,
    enonce: 'Une source lumineuse ponctuelle émet un flux de 200 W de façon uniforme dans toutes les directions. Un élève place un capteur à 1,5 m de la source, face à elle, et lit un éclairement de 7,0 W/m².',
    reperes: [['Flux émis Φ', '200 W'], ['Distance d', '1,5 m'], ['Surface de la sphère 4πd²', '≈ 28 m²'], ['E = Φ ÷ (4πd²)', '≈ 7,1 W/m²']],
    ver: '4πd² = 4π × 1,5² ≈ 28,3 m² ; E = 200 ÷ 28,3 ≈ 7,1 W/m². La valeur lue (7,0 W/m²) est cohérente avec le calcul : elle est plausible.',
    q2: 'On rapproche le capteur à 0,75 m, c’est-à-dire deux fois plus près. Que devient l’éclairement ?',
    options: [
      V('il est multiplié par 4, soit environ 28 W/m², car d est divisée par 2', 'La distance est divisée par 2 : la surface de la sphère est divisée par 4, donc E est multiplié par 4 : 4 × 7,1 ≈ 28 W/m².'),
      F('il est multiplié par 2, soit environ 14 W/m², car d est divisée par 2, selon 1/d', 'E varie comme 1/d² : diviser d par 2 multiplie E par 2² = 4, pas par 2.'),
      F('il ne change pas, car le flux émis par la source reste le même', 'Le flux est le même, mais il se répartit sur une sphère plus petite : l’éclairement augmente.'),
    ] }),
  P({ id: 'pve-val-loi', domaine: DOM, niveau: 2, titre: 'Éclairement à trois distances différentes', plausible: false,
    enonce: 'Un élève mesure l’éclairement d’une même source ponctuelle, sans changer son orientation. À 1,0 m il lit 8,0 W/m². À 3,0 m il lit 2,7 W/m². Il conclut : « l’éclairement est inversement proportionnel à la distance ».',
    reperes: [['E à 1,0 m', '8,0 W/m²'], ['E à 3,0 m (mesuré)', '2,7 W/m²'], ['Rapport des distances', '3'], ['E attendu à 3,0 m avec 1/d²', '8,0 ÷ 9 ≈ 0,89 W/m²']],
    ver: 'Pour une source ponctuelle, E est inversement proportionnel au carré de d : en passant de 1,0 m à 3,0 m, E est divisé par 3² = 9, soit environ 0,89 W/m². La valeur 2,7 W/m² correspondrait à une division par 3 seulement : elle n’est pas plausible pour une source ponctuelle (elle suppose une loi en 1/d).',
    q2: 'Quelle cause d’écart est la plus probable ?',
    options: [
      V('de la lumière parasite (jour, murs) s’ajoute à celle de la source', 'Un éclairement trop grand à longue distance trahit souvent de la lumière parasite : lumière du jour, murs et plafond qui réfléchissent. Le modèle en 1/d² suppose qu’il n’y en a pas.'),
      F('la loi en 1/d² ne s’applique pas à la lumière, seulement au son', 'La loi en 1/d² vient de la géométrie (surface de la sphère) : elle vaut pour toute puissance qui se répartit uniformément dans toutes les directions.'),
      F('le capteur mesure une puissance en watts, donc il n’y a pas de loi en 1/d²', 'Le capteur mesure bien un éclairement en W/m² : la puissance reçue par mètre carré suit la loi en 1/d² pour une source ponctuelle.'),
    ] }),
];

// ───────────── S'APP : repérer les données utiles ─────────────
const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const virg = (x, d) => Number(x).toFixed(d).replace('.', ',');
export const PVE_SAPP = [
  {
    id: 'pve-sapp-eclair', domaine: DOM, titre: 'Éclairement à une distance de la source', noms: ['Surface de la sphère', 'Éclairement'],
    gen: () => ({ phi: tire([100, 150, 200, 300, 500]), d: tire([0.5, 0.8, 1.0, 1.2, 1.5, 2.0]), V: tire([6, 12, 24]) }),
    build: epure((p, q) => {
      const tokens = {
        phi: tok(`${p.phi} W`, 'Flux lumineux émis par la source', p.phi, 'W'),
        d: tok(`${virg(p.d, 1)} m`, 'Distance entre la source et le capteur', p.d, 'm'),
        V: tok(`${p.V} V`, 'Tension d’alimentation de la source', p.V, 'V'),
        T: tok('25 °C', 'Température de la salle', 25, '°C'),
      };
      const debut = ['Une source lumineuse ponctuelle, alimentée sous ', T('V'), ', émet un flux lumineux de ', T('phi'), ' de façon uniforme dans toutes les directions. Un capteur est placé à ', T('d'), ' de la source, face à elle, dans une salle à ', T('T'), '. '];
      if (q === 0) return { tokens, derivees: ['surface d’une sphère = 4π d²'], texte: [...debut, 'Quelle est la surface de la sphère sur laquelle la lumière est répartie au niveau du capteur ?'], utiles: ['d'],
        raisons: { phi: 'Le flux sert à calculer l’éclairement, pas la surface de la sphère.', V: 'La tension d’alimentation ne sert pas dans ce calcul.', T: 'La température de la salle ne sert pas dans ce calcul.' },
        cherche: { bonne: 'La surface de la sphère de rayon d (en m²)', faux: ['L’éclairement au niveau du capteur (en W/m²)', 'Le volume de la sphère (en m³)', 'La puissance consommée par la source (en W)'] },
        manque: null, solution: { txt: 'surface = 4π d²', val: 4 * Math.PI * p.d ** 2, u: 'm²' } };
      return { tokens, derivees: ['surface de la sphère = 4π d²', 'éclairement : E = Φ ÷ (surface de la sphère)'], texte: [...debut, 'Quel est l’éclairement au niveau du capteur ?'], utiles: ['phi', 'd'],
        raisons: { V: 'La tension d’alimentation ne donne pas le flux lumineux émis, qui est donné.', T: 'La température de la salle ne sert pas dans ce calcul.' },
        cherche: { bonne: 'L’éclairement au niveau du capteur (en W/m²)', faux: ['La surface de la sphère (en m²)', 'La puissance électrique consommée (en W)', 'La puissance lumineuse reçue par un panneau (en W)'] },
        manque: null, solution: { txt: 'E = Φ ÷ (4π d²)', val: p.phi / (4 * Math.PI * p.d ** 2), u: 'W/m²' } };
    }),
  },
  {
    id: 'pve-sapp-panneau', domaine: DOM, titre: 'Puissance fournie par un panneau éclairé', noms: ['Puissance lumineuse reçue', 'Puissance électrique fournie'],
    gen: () => ({ phi: tire([200, 300, 400, 500]), d: tire([0.4, 0.5, 0.6, 0.8, 1.0]), S: tire([25, 37.5, 50, 75]), eta: tire([12, 14, 15, 16, 18]), L: tire([0.8, 1.0, 1.2]) }),
    build: epure((p, q) => {
      const tokens = {
        phi: tok(`${p.phi} W`, 'Flux lumineux émis par la source', p.phi, 'W'),
        d: tok(`${virg(p.d, 1)} m`, 'Distance entre la source et le panneau', p.d, 'm'),
        S: tok(`${virg(p.S, p.S % 1 ? 1 : 0)} cm²`, 'Surface du panneau', p.S, 'cm²'),
        eta: tok(`${p.eta} %`, 'Rendement du panneau', p.eta, '%'),
        L: tok(`${virg(p.L, 1)} m`, 'Longueur du banc sur lequel est posé le panneau', p.L, 'm'),
      };
      const debut = ['Une source lumineuse ponctuelle émet un flux de ', T('phi'), ' de façon uniforme dans toutes les directions. Un panneau photovoltaïque de surface ', T('S'), ' et de rendement ', T('eta'), ' est posé sur un banc de ', T('L'), ' de long, face à la source, à ', T('d'), ' d’elle. '];
      if (q === 0) return { tokens, derivees: ['S en m² : S = valeur en cm² ÷ 10 000', 'éclairement : E = Φ ÷ (4π d²) ; Plum = E × S'], texte: [...debut, 'Quelle puissance lumineuse le panneau reçoit-il ?'], utiles: ['phi', 'd', 'S'],
        raisons: { eta: 'Le rendement sert à la puissance électrique fournie, pas à la puissance lumineuse reçue.', L: 'La longueur du banc ne sert pas dans ce calcul.' },
        cherche: { bonne: 'La puissance lumineuse reçue par le panneau (en W)', faux: ['La puissance électrique fournie par le panneau (en W)', 'L’éclairement au niveau du panneau (en W/m²)', 'La part du flux émis qui n’atteint pas le panneau (en %)'] },
        manque: null, solution: { txt: 'Plum = Φ ÷ (4π d²) × S, avec S en m²', val: p.phi / (4 * Math.PI * p.d ** 2) * p.S / 1e4, u: 'W' } };
      return { tokens, derivees: ['S en m² : S = valeur en cm² ÷ 10 000', 'rendement en nombre décimal : η = valeur en % ÷ 100', 'Plum = Φ ÷ (4π d²) × S ; Pél = η × Plum'], texte: [...debut, 'Quelle puissance électrique le panneau fournit-il ?'], utiles: ['phi', 'd', 'S', 'eta'],
        raisons: { L: 'La longueur du banc ne sert pas dans ce calcul.' },
        cherche: { bonne: 'La puissance électrique fournie par le panneau (en W)', faux: ['La puissance lumineuse reçue par le panneau (en W)', 'La puissance perdue par le panneau (en W)', 'L’éclairement au niveau du panneau (en W/m²)'] },
        manque: null, solution: { txt: 'Pél = η × Φ ÷ (4π d²) × S, avec S en m² et η en nombre décimal', val: p.eta / 100 * p.phi / (4 * Math.PI * p.d ** 2) * p.S / 1e4, u: 'W' } };
    }),
  },
];
