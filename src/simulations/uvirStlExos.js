// Exercices ANA, VAL et S'APP « UV-visible et infrarouge » de la terminale STL (SPCL, Chimie et développement durable). Préfixe : uvs-. Rattachés au chapitre « Spectroscopies » (sim 306).
// Capacités visées (jamais affichées) : relier l'énergie d'un photon à la longueur d'onde (E = h c / λ) ; identifier ou confirmer une structure avec des spectres IR ou UV-visible et des données ;
// déterminer une concentration avec une droite d'étalonnage établie par spectrophotométrie.
const DOM = 'Spectroscopies UV-visible et infrarouge : énergie, identification et dosage';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const UVS_ANA = [
  { id: 'uvs-ana-energie', domaine: DOM, titre: 'Quel photon est le plus énergétique ?',
    enonce: 'Trois rayonnements monochromatiques sont émis par un spectrophotomètre : un rayonnement ultraviolet de longueur d’onde 250 nm, un rayonnement visible de 600 nm et un rayonnement infrarouge de 5 000 nm.', q: 'Lequel transporte les photons les plus énergétiques ?', options: [
      V('l’ultraviolet à 250 nm, de longueur d’onde la plus courte', 'E = h frac(c|λ) : l’énergie d’un photon est inversement proportionnelle à la longueur d’onde.'),
      F('l’infrarouge à 5 000 nm, car sa longueur d’onde est la plus grande', 'C’est l’inverse : plus λ est grande, moins le photon est énergétique.'),
      F('le visible à 600 nm, car c’est le seul rayonnement perçu par l’œil', 'La perception par l’œil ne mesure pas l’énergie des photons.'),
      F('aucun en particulier, car ils ont tous la même célérité dans le vide', 'La célérité est la même, mais E = h frac(c|λ) dépend de la longueur d’onde.'),
    ] },
  { id: 'uvs-ana-ir-ester', domaine: DOM, titre: 'Identifier un composé avec un spectre IR',
    enonce: 'Le spectre IR d’un liquide pur présente une bande fine et intense vers 1 740 cm⁻¹ et aucune bande large entre 2 500 et 3 600 cm⁻¹. Données : O–H d’un alcool 3 200–3 600 cm⁻¹ (large) ; O–H d’un acide carboxylique 2 500–3 200 cm⁻¹ (très large) ; C=O d’un ester 1 730–1 750 cm⁻¹.', q: 'Quelle structure est compatible avec ce spectre ?', options: [
      V('CH₃–CO–O–CH₂–CH₃, un ester', 'Bande C=O de l’ester vers 1 740 cm⁻¹ et aucune liaison O–H : compatible.'),
      F('CH₃–CH₂–CH₂–COOH, un acide carboxylique', 'Un acide carboxylique présenterait aussi une bande O–H très large de 2 500 à 3 200 cm⁻¹, absente ici.'),
      F('CH₃–CH₂–CH₂–OH, un alcool', 'Un alcool n’a pas de C=O et présenterait une bande O–H large vers 3 300 cm⁻¹.'),
      F('CH₃–O–CH₂–CH₃, un éther', 'Un éther n’a ni C=O ni O–H : aucune bande vers 1 740 cm⁻¹.'),
    ] },
  { id: 'uvs-ana-oxydation', domaine: DOM, titre: 'Confirmer une transformation avec l’IR',
    enonce: 'On oxyde le propan-2-ol CH₃–CH(OH)–CH₃ en propanone CH₃–CO–CH₃. On enregistre le spectre IR du produit obtenu après réaction.', q: 'Quelle évolution du spectre confirme que la transformation a eu lieu ?', options: [
      V('la bande O–H large disparaît et une bande C=O apparaît vers 1 715 cm⁻¹', 'L’alcool devient une cétone : le groupe O–H disparaît et le groupe C=O apparaît.'),
      F('une bande O–H large apparaît vers 3 300 cm⁻¹ et la bande C=O disparaît', 'C’est l’évolution inverse de celle d’une oxydation.'),
      F('une bande C=O apparaît, mais la bande O–H large reste inchangée vers 3 300 cm⁻¹', 'Le produit n’a plus de groupe O–H : la bande large doit disparaître.'),
      F('le spectre ne change pas, car les deux molécules ont trois atomes de carbone', 'Les groupes caractéristiques diffèrent (O–H, puis C=O) : le spectre change.'),
    ] },
  { id: 'uvs-ana-lambdamax', domaine: DOM, titre: 'Choisir la longueur d’onde de travail',
    enonce: 'On veut doser un colorant par spectrophotométrie. Son spectre d’absorption présente un maximum d’absorbance à 520 nm. Pour tracer la droite d’étalonnage, on règle le spectrophotomètre sur une longueur d’onde.', q: 'Pourquoi choisir 520 nm ?', options: [
      V('l’absorbance y est la plus grande : la mesure est la plus sensible', 'Au maximum, A = ε ℓ c varie le plus pour une même variation de concentration.'),
      F('c’est la seule longueur d’onde où la loi de Beer-Lambert est vérifiée', 'La loi s’applique à toute longueur d’onde absorbée, tant que la solution est diluée.'),
      F('à cette longueur d’onde, l’absorbance ne dépend plus de la concentration', 'L’absorbance reste proportionnelle à la concentration à toute longueur d’onde absorbée.'),
      F('c’est la longueur d’onde de la lumière que le colorant transmet le mieux', 'Au maximum d’absorbance, la lumière est le plus absorbée, pas le plus transmise.'),
    ] },
];

export const UVS_VAL = [
  P({ id: 'uvs-val-energie', domaine: DOM, niveau: 2, titre: 'Énergie d’un photon visible', plausible: false,
    enonce: 'Un photon visible a une longueur d’onde de 500 nm. Un élève calcule son énergie : « E = h frac(c|λ) = frac(6,63×10⁻³⁴ × 3,00×10⁸|500) = 4,0×10⁻²⁸ J. »',
    reperes: [['Constante de Planck', 'h = 6,63×10⁻³⁴ J·s'], ['Célérité de la lumière', 'c = 3,00×10⁸ m/s']],
    ver: 'Avec λ = 5,00×10⁻⁷ m : E = 1,99×10⁻²⁵ ÷ 5,00×10⁻⁷ = 4,0×10⁻¹⁹ J, soit environ 2,5 eV : 10⁹ fois plus que le résultat de l’élève.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il n’a pas converti λ en mètres : 500 nm = 5,00×10⁻⁷ m', 'La relation E = h frac(c|λ) exige λ en mètres pour obtenir E en joules.'),
      F('la relation correcte est E = h frac(λ|c) et non E = h frac(c|λ)', 'E = h frac(c|λ) est la bonne relation : l’énergie diminue quand λ augmente.'),
      F('un photon visible a une énergie de l’ordre de 10⁻²⁸ J, donc le résultat est bon', 'Un photon visible porte environ 10⁻¹⁹ J (quelques eV).'),
    ] }),
  P({ id: 'uvs-val-etalonnage', domaine: DOM, niveau: 2, titre: 'Dosage hors de la gamme d’étalonnage', plausible: false,
    enonce: 'Une droite d’étalonnage A = k c est tracée avec des solutions de concentrations 0,10 à 0,50 mmol/L, dont les absorbances vont de 0,20 à 1,00 (k = 2,0 L/mmol). Une solution inconnue donne A = 2,4. Un élève calcule : « c = frac(A|k) = frac(2,4|2,0) = 1,2 mmol/L. »',
    reperes: [['Gamme d’étalonnage', '0,10 à 0,50 mmol/L'], ['k', '2,0 L/mmol'], ['A mesurée', '2,4']],
    ver: 'Le calcul c = frac(A|k) est exact, mais A = 2,4 est bien au-delà de la gamme d’étalonnage (1,00 au plus) : la proportionnalité n’est pas vérifiée. Il faut diluer la solution pour que son absorbance soit dans la gamme.',
    q2: 'Que doit faire l’élève ?',
    options: [
      V('diluer la solution, puis mesurer de nouveau l’absorbance', 'On travaille avec une absorbance comprise dans la gamme d’étalonnage, puis on tient compte de la dilution.'),
      F('modifier k pour que la droite passe par le point mesuré, sans autre mesure', 'On ne modifie pas la droite d’étalonnage pour y faire passer un point.'),
      F('garder 1,2 mmol/L, car une droite d’étalonnage se prolonge sans limite', 'La loi de Beer-Lambert n’est valable que pour des solutions assez diluées : on ne prolonge pas la droite.'),
    ] }),
  P({ id: 'uvs-val-ir', domaine: DOM, niveau: 1, titre: 'Interpréter une bande IR vers 1 715 cm⁻¹', plausible: true,
    enonce: 'Le spectre IR d’une espèce synthétisée présente une bande intense vers 1 715 cm⁻¹ et aucune bande large vers 3 300 cm⁻¹. Un élève écrit : « La bande vers 1 715 cm⁻¹ correspond à une liaison C=O. L’absence de bande O–H large montre que le produit n’est ni un alcool ni un acide carboxylique. » Données : C=O 1 650–1 750 cm⁻¹ ; O–H d’un alcool 3 200–3 600 cm⁻¹ (large).',
    reperes: [['Bande intense', 'vers 1 715 cm⁻¹'], ['Zone C=O', '1 650 à 1 750 cm⁻¹']],
    ver: 'Le raisonnement est correct : 1 715 cm⁻¹ est dans la zone C=O, et l’absence de bande O–H large exclut un alcool ou un acide carboxylique.',
    q2: 'Que peut-on encore affirmer sur ce produit ?',
    options: [
      V('un composé carbonylé sans O–H (cétone, aldéhyde ou ester)', 'Les zones C=O de ces familles sont proches : il faut d’autres informations pour trancher.'),
      F('c’est forcément une cétone, car 1 715 cm⁻¹ est la valeur d’une cétone', 'Les zones C=O des cétones, des aldéhydes et des esters se chevauchent en partie : le spectre seul ne suffit pas.'),
      F('on ne peut rien dire, car une seule bande ne renseigne sur aucun groupe de la molécule', 'Une bande dans une zone caractéristique permet d’identifier un groupe : ici C=O.'),
    ] }),
];

// ---------- S'APP ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const fr = x => String(x).replace('.', ',');
const H = 6.63e-34, C = 3.00e8, E = 1.60e-19;
export const UVS_SAPP = [
  {
    id: 'uvs-sapp-energie', domaine: DOM, titre: 'Un photon absorbé par un colorant : énergie', noms: ['Longueur d’onde en mètres', 'Énergie du photon en eV'],
    gen: () => ({ lam: tire([250, 300, 350, 400, 450, 500, 550, 600, 650, 700]), A: tire([0.30, 0.45, 0.60, 0.80]) }),
    build: epure((p, q) => {
      const tokens = {
        lam: tok(`${p.lam} nm`, 'Longueur d’onde du rayonnement absorbé', p.lam, 'nm'), h: tok('6,63×10⁻³⁴ J·s', 'Constante de Planck', H, 'J·s'), c: tok('3,00×10⁸ m/s', 'Célérité de la lumière dans le vide', C, 'm/s'),
        e: tok('1,60×10⁻¹⁹ J/eV', 'Valeur d’un électronvolt', E, 'J/eV'), A: tok(fr(p.A.toFixed(2)), 'Absorbance mesurée de la solution', p.A, ''),
      };
      const debut = ['Une solution d’un colorant absorbe un rayonnement de longueur d’onde ', T('lam'), '. Son absorbance mesurée vaut ', T('A'), '. '];
      if (q === 0) return { tokens, derivees: ['λ (en m) = λ (en nm) × 10⁻⁹'], texte: [...debut, 'Quelle est cette longueur d’onde, exprimée en mètres ?'], utiles: ['lam'],
        raisons: { A: 'L’absorbance ne sert pas à convertir une longueur d’onde.', },
        cherche: { bonne: 'La longueur d’onde (en m)', faux: ['La fréquence du rayonnement (en Hz)', 'L’énergie d’un photon (en eV)', 'La concentration du colorant (en mol/L)'] },
        manque: null, solution: { txt: 'λ = λ(nm) × 10⁻⁹', val: p.lam * 1e-9, u: 'm' } };
      return { tokens, derivees: ['λ (en m) = λ (en nm) × 10⁻⁹', 'E = h frac(c|λ) (en J)', 'E (en eV) = E (en J) ÷ 1,60×10⁻¹⁹'], texte: [...debut, 'Les constantes utiles sont ', T('h'), ', ', T('c'), ' et ', T('e'), '. Quelle est l’énergie d’un photon de ce rayonnement, en eV ?'], utiles: ['lam', 'h', 'c', 'e'],
        raisons: { A: 'L’absorbance ne change pas l’énergie d’un photon.' },
        cherche: { bonne: 'L’énergie d’un photon (en eV)', faux: ['La concentration du colorant (en mol/L)', 'La fréquence du rayonnement (en Hz)', 'L’énergie totale absorbée par la solution (en J)'] },
        manque: null, solution: { txt: 'E = h frac(c|λ), puis ÷ 1,60×10⁻¹⁹', val: H * C / (p.lam * 1e-9) / E, u: 'eV' } };
    }),
  },
  {
    id: 'uvs-sapp-etalonnage', domaine: DOM, titre: 'Un dosage par étalonnage : concentration de la solution mère', noms: ['Concentration de la solution diluée', 'Concentration de la solution mère'],
    gen: () => ({ k: tire([1500, 2000, 2500, 3000, 4000]), A: tire([0.30, 0.45, 0.60, 0.75, 0.90]), f: tire([5, 10, 20]), V: tire([5, 10, 25]) }),
    build: epure((p, q) => {
      const tokens = {
        k: tok(`${fr((p.k / 1000).toFixed(1))}×10³ L/mol`, 'Coefficient directeur de la droite d’étalonnage A = k c', p.k, 'L/mol'), A: tok(fr(p.A.toFixed(2)), 'Absorbance de la solution diluée', p.A, ''),
        f: tok(`${p.f} fois`, 'Facteur de dilution', p.f, ''), V: tok(`${p.V} mL`, 'Volume de la prise d’essai', p.V, 'mL'),
      };
      const c = p.A / p.k;
      const debut = ['La droite d’étalonnage d’un colorant est A = k c, avec k = ', T('k'), '. Une solution mère est diluée ', T('f'), ' (prise d’essai de ', T('V'), '). La solution diluée a pour absorbance ', T('A'), '. '];
      if (q === 0) return { tokens, derivees: ['c = A ÷ k'], texte: [...debut, 'Quelle est la concentration de la solution diluée, en mol/L ?'], utiles: ['k', 'A'],
        raisons: { f: 'Le facteur de dilution ne sert qu’ensuite, pour remonter à la solution mère.', V: 'Le volume de la prise d’essai ne change pas une concentration : seul le facteur de dilution compte.' },
        cherche: { bonne: 'La concentration de la solution diluée (en mol/L)', faux: ['La concentration de la solution mère (en mol/L)', 'La quantité de matière de la prise d’essai (en mol)', 'Le facteur de dilution'] },
        manque: null, solution: { txt: 'c = A ÷ k', val: c, u: 'mol/L' } };
      return { tokens, derivees: ['c (diluée) = A ÷ k', 'c (mère) = c (diluée) × facteur de dilution'], texte: [...debut, 'Quelle est la concentration de la solution mère, en mol/L ?'], utiles: ['k', 'A', 'f'],
        raisons: { V: 'Le volume de la prise d’essai ne change pas une concentration : seul le facteur de dilution compte.' },
        cherche: { bonne: 'La concentration de la solution mère (en mol/L)', faux: ['La concentration de la solution diluée (en mol/L)', 'La quantité de colorant dans la prise d’essai (en mol)', 'L’absorbance de la solution mère'] },
        manque: null, solution: { txt: 'c (mère) = (A ÷ k) × facteur de dilution', val: c * p.f, u: 'mol/L' } };
    }),
  },
];
