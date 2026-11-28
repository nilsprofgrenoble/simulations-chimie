// Exercices ANA (prévoir sans calculer), VAL (plausible ?) et S'APP (repérer les données utiles) de la simulation 230 « Laser : éclairement, énergie reçue et sécurité ».
// Préfixe d'identifiants : las- ; domaine : « Laser : éclairement, énergie reçue et sécurité ». Branchés dans AtelierAnalyserBanque.js, AtelierValiderBanque.js et AtelierDonneesBanque.js.
// Capacités visées (jamais affichées) : établir et exploiter la relation entre l'énergie reçue, le flux énergétique et la durée d'exposition ; citer les propriétés d'un faisceau laser ; exploiter une norme pour déterminer la durée maximale d'exposition.
const DOM = 'Laser : éclairement, énergie reçue et sécurité';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

// ───────────── ANA : prévoir sans calculer ─────────────
export const LAS_ANA = [
  { id: 'las-ana-diametre', domaine: DOM, titre: 'Un faisceau deux fois plus fin',
    enonce: 'Un laser émet un flux constant. Son faisceau, de section circulaire, est rendu deux fois plus fin (son diamètre est divisé par 2) à l’aide d’un système optique, sans perte de flux.', q: 'Comment évolue l’éclairement du faisceau sur un écran ?', options: [
      V('il est multiplié par 4, car la surface du faisceau est divisée par 4', 'La surface d’un disque varie comme le carré du diamètre : diamètre ÷ 2, surface ÷ 4. Le même flux sur une surface 4 fois plus petite multiplie l’éclairement par 4.'),
      F('il est multiplié par 2, car le diamètre est divisé par 2', 'La surface dépend du carré du diamètre, pas du diamètre : l’éclairement est multiplié par 2² = 4, pas par 2.'),
      F('il ne change pas, car le flux du laser est resté le même', 'Le flux est le même, mais il est concentré sur une surface plus petite : l’éclairement, lui, augmente.'),
      F('il est divisé par 4, car le faisceau est plus fin et transporte moins de lumière', 'Le flux est inchangé (aucune perte) : c’est la surface qui est divisée par 4, donc l’éclairement qui est multiplié par 4.'),
    ] },
  { id: 'las-ana-flux', domaine: DOM, titre: 'Un laser trois fois plus puissant',
    enonce: 'Un faisceau laser de section constante éclaire la peau pendant 0,5 s. On remplace le laser par un modèle de même faisceau, dont le flux est trois fois plus grand, et on garde la même durée d’exposition.', q: 'Que deviennent l’éclairement et l’énergie reçue par la peau ?', options: [
      V('tous deux sont multipliés par 3, car ils sont proportionnels au flux', 'E = φ ÷ S et Q = φ × Δt : à section et durée fixées, E et Q sont proportionnels au flux φ, donc multipliés par 3.'),
      F('l’éclairement est multiplié par 3 mais l’énergie reçue ne change pas, car la durée est la même', 'Q = φ × Δt : si φ triple et Δt reste le même, l’énergie reçue triple aussi.'),
      F('tous deux sont multipliés par 9, car le flux intervient au carré', 'Le flux n’est pas élevé au carré : E et Q sont proportionnels à φ, donc multipliés par 3.'),
      F('l’éclairement ne change pas, car la section du faisceau est la même', 'L’éclairement est le flux divisé par la section : à section égale, il est multiplié par 3 si le flux triple.'),
    ] },
  { id: 'las-ana-duree', schema: { type: 'laserCible' }, domaine: DOM, titre: 'Une exposition deux fois plus longue',
    enonce: 'Un faisceau laser de flux constant éclaire une cible pendant 2,0 s. On le laisse allumé 4,0 s au lieu de 2,0 s, sans rien changer d’autre.', q: 'Que deviennent l’éclairement de la cible et l’énergie qu’elle reçoit ?', options: [
      V('l’éclairement reste le même, l’énergie reçue est multipliée par 2', 'L’éclairement ne dépend que du flux et de la section. L’énergie Q = φ × Δt est proportionnelle à la durée : elle double.'),
      F('l’éclairement est multiplié par 2, l’énergie reçue aussi', 'L’éclairement est une puissance par unité de surface : il ne dépend pas de la durée.'),
      F('l’éclairement et l’énergie reçue ne changent pas, car le flux est constant', 'Le flux est constant, donc l’éclairement aussi, mais l’énergie reçue augmente tant que le faisceau éclaire.'),
      F('l’éclairement est divisé par 2, car la lumière est répartie sur plus de temps', 'L’éclairement est lié à la surface, pas à la durée : il reste constant, seule l’énergie reçue augmente.'),
    ] },
  { id: 'las-ana-distance', domaine: DOM, titre: 'Un laser et une lampe que l’on éloigne',
    enonce: 'Un laser et une petite lampe ponctuelle ont le même flux. On place un capteur à 1 m de chacun, puis à 3 m (trois fois plus loin). Le faisceau du laser reste quasi cylindrique.', q: 'Comment évolue l’éclairement reçu par le capteur dans chaque cas ?', options: [
      V('il baisse très peu pour le laser, et il est divisé par 9 pour la lampe', 'Le faisceau laser garde une section presque constante : son éclairement diminue très peu. La lumière de la lampe se répartit sur une sphère : E varie comme 1/d², soit un facteur 3² = 9.'),
      F('il est divisé par 9 pour les deux sources, car la distance est triplée', 'La loi en 1/d² vient de la lumière qui part dans toutes les directions ; le faisceau laser, quasi cylindrique, s’élargit très peu.'),
      F('il est divisé par 3 pour la lampe et ne change pas pour le laser', 'Pour une lampe ponctuelle, E varie comme 1/d², donc elle est divisée par 9, pas par 3 ; pour le laser, l’éclairement diminue très peu, sans être strictement nul.'),
      F('il ne change pas pour la lampe et il est divisé par 9 pour le laser', 'C’est l’inverse : le laser garde presque le même éclairement, alors que celui de la lampe est divisé par 9.'),
    ] },
];

// ───────────── VAL : plausible ? ─────────────
export const LAS_VAL = [
  P({ id: 'las-val-section', domaine: DOM, niveau: 1, titre: 'Éclairement d’un faisceau de 3 mW', plausible: true,
    enonce: 'Un laser émet un flux de 3,0 mW dans un faisceau de diamètre 2,0 mm. Un élève calcule une section d’environ 3,1 mm², puis un éclairement d’environ 950 W/m².',
    reperes: [['Flux φ', '3,0 mW = 0,0030 W'], ['Diamètre D', '2,0 mm'], ['Section S = π D² ÷ 4', '≈ 3,14 mm² = 3,14·10⁻⁶ m²'], ['E = φ ÷ S', '≈ 955 W/m²']],
    ver: 'S = π × 2,0² ÷ 4 ≈ 3,14 mm² = 3,14·10⁻⁶ m² ; E = 0,0030 ÷ 3,14·10⁻⁶ ≈ 955 W/m². La valeur de l’élève est cohérente : elle est plausible.',
    q2: 'On remplace le faisceau par un faisceau de même flux mais de diamètre 1,0 mm. Que devient l’éclairement ?',
    options: [
      V('il est multiplié par 4, soit environ 3 800 W/m², car la section est divisée par 4', 'Le diamètre est divisé par 2, la section par 4 : E = 955 × 4 ≈ 3 800 W/m².'),
      F('il est multiplié par 2, soit environ 1 900 W/m², car le diamètre est divisé par 2', 'La section dépend du carré du diamètre : l’éclairement est multiplié par 4, pas par 2.'),
      F('il ne change pas, car le flux reste égal à 3,0 mW', 'Le flux est le même, mais il est concentré sur une surface plus petite : l’éclairement augmente.'),
    ] }),
  P({ id: 'las-val-energie', domaine: DOM, niveau: 2, titre: 'Énergie reçue en 2 secondes', plausible: false,
    enonce: 'Un laser de flux 5 mW éclaire une cible pendant 2,0 s. Un élève calcule l’énergie reçue : « Q = 5 × 2,0 = 10 J ».',
    reperes: [['Flux φ', '5 mW = 0,005 W'], ['Durée Δt', '2,0 s'], ['Q = φ × Δt', '0,005 × 2,0 = 0,010 J'], ['Valeur de l’élève', '10 J (1 000 fois trop grande)']],
    ver: 'Le flux doit être converti en watts : 5 mW = 0,005 W. Q = 0,005 × 2,0 = 0,010 J = 10 mJ. La valeur de 10 J est 1 000 fois trop grande : elle n’est pas plausible (le flux est resté en mW sans conversion).',
    q2: 'Quelle est la cause de l’écart ?',
    options: [
      V('le flux est resté en mW alors que le résultat est donné en joules', 'Pour obtenir des joules, le flux doit être en watts (1 mW = 0,001 W) : 5 × 2,0 donne des mJ, pas des J.'),
      F('la durée aurait dû être multipliée par 1 000 car elle est en secondes', 'La durée en secondes convient pour des joules ; c’est le flux, en mW, qui doit être converti en W.'),
      F('l’énergie ne se calcule pas avec le flux d’un laser', 'L’énergie reçue vaut bien Q = φ × Δt : il suffit d’exprimer le flux en watts et la durée en secondes.'),
    ] }),
];

// ───────────── S'APP : repérer les données utiles ─────────────
const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const virg = (x, d) => Number(x).toFixed(d).replace('.', ',');
export const LAS_SAPP = [
  {
    id: 'las-sapp-eclair', domaine: DOM, titre: 'Éclairement d’un faisceau laser', noms: ['Section du faisceau', 'Éclairement'],
    gen: () => ({ phi: tire([2, 3, 4, 5, 8]), D: tire([1, 1.5, 2, 2.5, 3]), lam: tire([532, 635, 650]), ph: tire([1.5, 2.0, 2.5]) }),
    build: epure((p, q) => {
      const tokens = {
        phi: tok(`${p.phi} mW`, 'Flux énergétique du faisceau', p.phi, 'mW'),
        D: tok(`${virg(p.D, p.D % 1 ? 1 : 0)} mm`, 'Diamètre du faisceau', p.D, 'mm'),
        lam: tok(`${p.lam} nm`, 'Longueur d’onde du laser', p.lam, 'nm'),
        ph: tok(`${virg(p.ph, 1)} W`, 'Puissance électrique consommée par le laser', p.ph, 'W'),
      };
      const debut = ['Un laser de longueur d’onde ', T('lam'), ' consomme une puissance électrique de ', T('ph'), '. Il émet un faisceau de section circulaire, de diamètre ', T('D'), ', de flux énergétique ', T('phi'), '. '];
      if (q === 0) return { tokens, derivees: ['section = π D² ÷ 4'], texte: [...debut, 'Quelle est la section du faisceau ?'], utiles: ['D'],
        raisons: { phi: 'Le flux sert à calculer l’éclairement, pas la section du faisceau.', lam: 'La longueur d’onde ne sert pas dans ce calcul.', ph: 'La puissance consommée par le laser ne sert pas dans ce calcul.' },
        cherche: { bonne: 'La section du faisceau (en mm²)', faux: ['L’éclairement du faisceau (en W/m²)', 'L’énergie reçue en une seconde (en J)', 'Le périmètre du faisceau (en mm)'] },
        manque: null, solution: { txt: 'section = π D² ÷ 4', val: Math.PI * p.D ** 2 / 4, u: 'mm²' } };
      return { tokens, derivees: ['flux en watts : valeur en mW ÷ 1000', 'section en m² : valeur en mm² × 10⁻⁶', 'E = φ ÷ S'], texte: [...debut, 'Quel est l’éclairement du faisceau ?'], utiles: ['phi', 'D'],
        raisons: { lam: 'La longueur d’onde ne sert pas dans ce calcul.', ph: 'La puissance consommée n’est pas le flux du faisceau, qui est donné.' },
        cherche: { bonne: 'L’éclairement du faisceau (en W/m²)', faux: ['La section du faisceau (en mm²)', 'La puissance consommée par le laser (en W)', 'L’énergie reçue en une seconde (en J)'] },
        manque: null, solution: { txt: 'E = φ ÷ (π D² ÷ 4), avec φ en W et D en m', val: (p.phi / 1000) / (Math.PI * (p.D / 1000) ** 2 / 4), u: 'W/m²' } };
    }),
  },
  {
    id: 'las-sapp-duree', domaine: DOM, titre: 'Durée maximale d’exposition au faisceau', noms: ['Éclairement', 'Durée maximale d’exposition'],
    gen: () => ({ phi: tire([2, 3, 4, 5, 8]), D: tire([1, 1.5, 2, 2.5, 3]), H: 2.5, Emax: 10, t: tire([0.5, 1, 2, 5]) }),
    build: epure((p, q) => {
      const tokens = {
        phi: tok(`${p.phi} mW`, 'Flux énergétique du faisceau', p.phi, 'mW'),
        D: tok(`${virg(p.D, p.D % 1 ? 1 : 0)} mm`, 'Diamètre du faisceau', p.D, 'mm'),
        H: tok('2,5 J/m²', 'Exposition énergétique maximale permise pour une durée inférieure ou égale à 0,25 s', 2.5, 'J/m²'),
        Em: tok('10 W/m²', 'Éclairement maximal permis pour une durée supérieure à 0,25 s', 10, 'W/m²'),
        t: tok(`${virg(p.t, 1)} s`, 'Durée pendant laquelle le laser est resté allumé hier', p.t, 's'),
      };
      const debut = ['Un faisceau laser visible, de section circulaire, a un diamètre de ', T('D'), ' et un flux de ', T('phi'), '. Une norme fournit pour l’œil : ', T('H'), ' (durée inférieure ou égale à 0,25 s) et ', T('Em'), ' (durée supérieure à 0,25 s). Le laser est resté allumé ', T('t'), ' hier. '];
      if (q === 0) return { tokens, derivees: ['section = π D² ÷ 4', 'E = φ ÷ S, avec φ en W et S en m²'], texte: [...debut, 'Quel est l’éclairement du faisceau ?'], utiles: ['phi', 'D'],
        raisons: { H: 'L’exposition maximale permise sert à comparer, pas à calculer l’éclairement du faisceau.', Em: 'L’éclairement maximal permis sert à comparer, pas à calculer l’éclairement du faisceau.', t: 'La durée d’allumage de la veille ne sert pas dans ce calcul.' },
        cherche: { bonne: 'L’éclairement du faisceau (en W/m²)', faux: ['La section du faisceau (en mm²)', 'L’énergie reçue pendant la durée d’allumage (en J)', 'La durée maximale d’exposition (en ms)'] },
        manque: null, solution: { txt: 'E = φ ÷ (π D² ÷ 4), avec φ en W et D en m', val: (p.phi / 1000) / (Math.PI * (p.D / 1000) ** 2 / 4), u: 'W/m²' } };
      return { tokens, derivees: ['E = φ ÷ S', 'Δt max = H ÷ E (exposition ≤ 0,25 s)'], texte: [...debut, 'Quelle est la durée maximale d’exposition de l’œil à ce faisceau, pour une durée inférieure ou égale à 0,25 s ?'], utiles: ['phi', 'D', 'H'],
        raisons: { Em: 'L’éclairement maximal permis concerne les durées supérieures à 0,25 s, pas ce cas.', t: 'La durée d’allumage de la veille ne sert pas dans ce calcul.' },
        cherche: { bonne: 'La durée maximale d’exposition de l’œil (en ms)', faux: ['L’éclairement du faisceau (en W/m²)', 'L’énergie reçue par l’œil pendant la veille (en J)', 'La section du faisceau (en mm²)'] },
        manque: null, solution: { txt: 'Δt max = H ÷ E, avec E = φ ÷ (π D² ÷ 4)', val: 2.5 / ((p.phi / 1000) / (Math.PI * (p.D / 1000) ** 2 / 4)) * 1000, u: 'ms' } };
    }),
  },
];
