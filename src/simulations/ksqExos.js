// Exercices ANA, VAL et S'APP de la simulation 309 « Dissoudre ou précipiter ? Qr, Ks et solution saturée » (terminale STL, SPCL, Chimie et développement durable). Préfixe : ksq-.
// Capacités visées (jamais affichées) : écrire l'équation de dissolution et l'expression de Ks ; comparer Qr à Ks pour prévoir l'évolution d'un système ; relier Ks et solubilité (mol/L, g/L).
// Valeurs de Ks : annexe « Solubility Products » d'OpenStax Chemistry 2e (modèle ksqModele.js).
import { SELS, solubilite, solubiliteGL, qr, apresMelange, sci, sup } from './ksqModele.js';
const DOM = 'Ks, quotient de réaction et solubilité';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });

export const KSQ_ANA = [
  { id: 'ksq-ana-expression', domaine: DOM, titre: 'Écrire l’expression de Ks',
    enonce: 'Le carbonate d’argent Ag₂CO₃ est un solide ionique peu soluble. Sa dissolution dans l’eau est décrite par l’équation Ag₂CO₃(s) ⇌ 2 Ag⁺(aq) + CO₃²⁻(aq).', q: 'Quelle est l’expression de sa constante Ks ?', options: [
      V('Ks = [Ag⁺]² × [CO₃²⁻]', 'Chaque concentration est élevée à la puissance de son coefficient : 2 pour Ag⁺, 1 pour CO₃²⁻ ; le solide n’y figure pas.'),
      F('Ks = [Ag⁺] × [CO₃²⁻]', 'Le coefficient 2 de Ag⁺ doit figurer en exposant.'),
      F('Ks = 2 [Ag⁺] × [CO₃²⁻]', 'Le coefficient stœchiométrique est un exposant, pas un facteur.'),
      F('Ks = [Ag⁺]² × [CO₃²⁻] ÷ [Ag₂CO₃]', 'Le solide n’intervient pas dans l’expression de Ks.'),
    ] },
  { id: 'ksq-ana-sens', domaine: DOM, titre: 'Précipité ou non ?',
    enonce: 'On mélange deux solutions d’ions Cu⁺ et I⁻ dans de l’eau. Juste après le mélange, le quotient de réaction vaut Qr = 5×10⁻¹⁴. Pour CuI(s) ⇌ Cu⁺ + I⁻, la constante vaut Ks = 1,27×10⁻¹² à 25 °C.', q: 'Que se passe-t-il ?', options: [
      V('il n’y a pas de précipité : Qr est inférieur à Ks', 'Qr < Ks : la solution n’est pas saturée, les ions restent dissous.'),
      F('un précipité de CuI se forme : Qr est très petit', 'Un précipité se forme quand Qr est supérieur à Ks, pas quand il est très petit.'),
      F('la solution est saturée : Qr et Ks sont du même ordre de grandeur', 'Il y a deux ordres de grandeur d’écart : Qr ≪ Ks, la solution n’est pas saturée.'),
      F('on ne peut pas conclure sans connaître les volumes mélangés', 'Qr est donné juste après le mélange : on le compare directement à Ks.'),
    ] },
  { id: 'ksq-ana-dilution', domaine: DOM, titre: 'Ajouter de l’eau',
    enonce: 'Une solution contient des ions Ca²⁺ et F⁻ sans précipité : Qr est inférieur à Ks pour CaF₂. On y ajoute de l’eau pure (sans autre changement).', q: 'Que devient Qr, et que se passe-t-il ?', options: [
      V('Qr diminue : toujours pas de précipité', 'L’ajout d’eau dilue les ions : les concentrations baissent et Qr aussi, il reste inférieur à Ks.'),
      F('Qr augmente, donc un précipité peut apparaître', 'La dilution diminue les concentrations des ions, donc Qr.'),
      F('Qr ne change pas, car la quantité d’ions est la même', 'La quantité d’ions est la même mais le volume augmente : les concentrations (donc Qr) diminuent.'),
      F('Qr devient égal à Ks, car l’eau sature la solution', 'L’eau pure n’apporte aucun ion : elle ne peut pas saturer la solution.'),
    ] },
  { id: 'ksq-ana-comparer', domaine: DOM, titre: 'Comparer deux sels de même formule',
    enonce: 'Les sels SrCO₃ (Ks = 7×10⁻¹⁰) et CuI (Ks = 1,27×10⁻¹²) ont la même forme de formule : un cation et un anion de coefficients 1, SrCO₃(s) ⇌ Sr²⁺ + CO₃²⁻ et CuI(s) ⇌ Cu⁺ + I⁻.', q: 'Quel est le plus soluble dans l’eau ?', options: [
      V('SrCO₃ : même forme d’équation et Ks plus grand', 'Pour une même forme d’équation, s = sqrt(K)s : la solubilité et Ks varient dans le même sens.'),
      F('CuI : son Ks est le plus petit', 'Un Ks plus petit correspond à une solubilité plus petite, pas plus grande.'),
      F('ils sont aussi solubles : ils contiennent chacun un cation et un anion', 'Leurs Ks diffèrent de plus de deux ordres de grandeur : les solubilités diffèrent.'),
      F('on ne peut pas savoir : il faut connaître leurs masses molaires', 'La masse molaire sert à passer de mol/L à g/L, pas à comparer des solubilités en mol/L.'),
    ] },
];

export const KSQ_VAL = [
  P({ id: 'ksq-val-comparer', domaine: DOM, niveau: 2, titre: 'Ks et solubilité de deux sels', plausible: false,
    enonce: 'Un élève compare Ag₂CO₃ (Ks = 8,1×10⁻¹²) et SrCO₃ (Ks = 7×10⁻¹⁰) : « Le Ks de Ag₂CO₃ est plus petit que celui de SrCO₃, donc Ag₂CO₃ est moins soluble que SrCO₃. »',
    reperes: [['Ks de Ag₂CO₃', '8,1×10⁻¹²'], ['Ks de SrCO₃', '7×10⁻¹⁰']],
    ver: 'Les formules diffèrent (Ag₂CO₃ : Ks = 4 s³ ; SrCO₃ : Ks = s²). s(Ag₂CO₃) = ∛(8,1×10⁻¹² ÷ 4) ≈ 1,3×10⁻⁴ mol/L, s(SrCO₃) = sqrt(7×10⁻¹⁰) ≈ 2,6×10⁻⁵ mol/L : Ag₂CO₃ est environ cinq fois plus soluble.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il compare des Ks de formules différentes : il faut comparer les s', 'Avec des stœchiométries différentes, Ks et s ne se classent pas dans le même ordre.'),
      F('il a confondu Ks avec le quotient de réaction Qr, qui n’a pas la même définition', 'Ks et Qr sont bien distincts, mais l’élève n’a calculé aucun quotient : l’erreur est ailleurs.'),
      F('un Ks plus petit devrait toujours correspondre à un sel plus soluble', 'C’est l’inverse pour une même forme de formule : l’erreur vient de la comparaison de formules différentes.'),
    ] }),
  P({ id: 'ksq-val-dilution', domaine: DOM, niveau: 2, titre: 'Qr juste après un mélange', plausible: false,
    enonce: 'On mélange 20 mL d’une solution d’ions Ca²⁺ à 4,0×10⁻⁴ mol/L et 20 mL d’une solution d’ions F⁻ à 4,0×10⁻⁴ mol/L. Pour CaF₂, Ks = 4,0×10⁻¹¹. Un élève calcule : « Qr = [Ca²⁺] × [F⁻]² = 4,0×10⁻⁴ × (4,0×10⁻⁴)² = 6,4×10⁻¹¹, supérieur à Ks : un précipité se forme. »',
    reperes: [['Volumes mélangés', '20 mL et 20 mL'], ['Concentrations de départ', '4,0×10⁻⁴ mol/L'], ['Ks de CaF₂', '4,0×10⁻¹¹']],
    ver: 'Après le mélange, le volume est doublé : [Ca²⁺] = [F⁻] = 2,0×10⁻⁴ mol/L. Qr = 2,0×10⁻⁴ × (2,0×10⁻⁴)² = 8,0×10⁻¹², inférieur à Ks : il n’y a pas de précipité.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il n’a pas tenu compte de la dilution des ions', 'Les concentrations de départ sont divisées par deux après mélange à volumes égaux.'),
      F('il a oublié le carré sur [F⁻] dans l’expression de Qr', 'Le carré est bien présent dans son calcul : l’erreur porte sur les concentrations utilisées.'),
      F('il a comparé Qr à Ks dans le mauvais sens pour conclure', 'Il a bien conclu qu’un précipité se forme quand Qr > Ks : l’erreur est dans la valeur de Qr.'),
    ] }),
];

// ---------- S'APP ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const sc = x => NBSP(sci(x, 2));
const eq = s => `${s.f}(s) ⇌ ${s.a > 1 ? s.a + ' ' : ''}${s.cation} + ${s.b > 1 ? s.b + ' ' : ''}${s.anion}`;
export const KSQ_SAPP = [
  {
    id: 'ksq-sapp-melange', domaine: DOM, titre: 'Un mélange de deux solutions : concentrations et Qr', noms: ['Concentration d’un ion après mélange', 'Quotient de réaction Qr après mélange'],
    gen: () => ({ sel: tire(['SrCO3', 'CaF2']), c1: tire([2.0e-3, 4.0e-3, 6.0e-3, 8.0e-3]), V1: tire([10, 20, 30]), c2: tire([2.0e-3, 4.0e-3, 6.0e-3, 8.0e-3]), V2: tire([10, 20, 40]) }),
    build: epure((p, q) => {
      const s = SELS[p.sel], m = apresMelange(p.c1, p.V1, p.c2, p.V2), Q = qr(s, m.c1, m.c2);
      const tokens = {
        eq: tok(eq(s), 'Équation de dissolution du sel', 0, ''), Ks: tok(sc(s.Ks), 'Constante Ks du sel à 25 °C', s.Ks, ''),
        c1: tok(`${sc(p.c1)} mol/L`, `Concentration de la solution d’ions ${s.cation}`, p.c1, 'mol/L'), V1: tok(`${p.V1} mL`, `Volume de la solution d’ions ${s.cation}`, p.V1, 'mL'),
        c2: tok(`${sc(p.c2)} mol/L`, `Concentration de la solution d’ions ${s.anion}`, p.c2, 'mol/L'), V2: tok(`${p.V2} mL`, `Volume de la solution d’ions ${s.anion}`, p.V2, 'mL'),
      };
      const debut = ['On mélange ', T('V1'), ' d’une solution d’ions ', s.cation, ' à ', T('c1'), ' et ', T('V2'), ' d’une solution d’ions ', s.anion, ' à ', T('c2'), '. Équation de dissolution : ', T('eq'), ', avec Ks = ', T('Ks'), '. '];
      if (q === 0) return { tokens, derivees: [`c (${s.cation}) après mélange = c1 × V1 ÷ (V1 + V2)`], texte: [...debut, 'Quelle est la concentration des ions ', s.cation, ' juste après le mélange, en mol/L ?'], utiles: ['c1', 'V1', 'V2'],
        raisons: { c2: `La concentration de l’autre solution ne sert pas pour les ions ${s.cation}.`, Ks: 'Ks ne sert pas à calculer une concentration après dilution.', eq: 'L’équation n’intervient pas dans une dilution.' },
        cherche: { bonne: `La concentration en ions ${s.cation} après mélange (en mol/L)`, faux: ['Le quotient de réaction Qr', 'La solubilité du sel (en mol/L)', 'La quantité d’ions du mélange (en mol)'] },
        manque: null, solution: { txt: `c (${s.cation}) = c1 × V1 ÷ (V1 + V2)`, val: m.c1, u: 'mol/L' } };
      return { tokens, derivees: [`c (${s.cation}) = c1 × V1 ÷ (V1 + V2)`, `c (${s.anion}) = c2 × V2 ÷ (V1 + V2)`, 'Qr = produit des concentrations à la puissance des coefficients'], texte: [...debut, 'Quel est le quotient de réaction Qr juste après le mélange ?'], utiles: ['c1', 'V1', 'c2', 'V2', 'eq'],
        raisons: { Ks: 'Ks sert ensuite à comparer Qr, pas à le calculer.' },
        cherche: { bonne: 'Le quotient de réaction Qr juste après le mélange', faux: ['La solubilité du sel (en mol/L)', 'La constante Ks du sel', 'La masse de précipité formée (en g)'] },
        manque: null, solution: { txt: `Qr = [${s.cation}]${s.a > 1 ? sup(s.a) : ''} × [${s.anion}]${s.b > 1 ? sup(s.b) : ''}`, val: Q, u: '' } };
    }),
  },
  {
    id: 'ksq-sapp-solubilite', domaine: DOM, titre: 'De Ks à la solubilité, en mol/L puis en g/L', noms: ['Solubilité en mol/L', 'Solubilité en g/L'],
    gen: () => ({ sel: tire(['CuI', 'CaF2', 'Ag2CO3', 'SrCO3']) }),
    build: epure((p, q) => {
      const s = SELS[p.sel], so = solubilite(s), g = solubiliteGL(s);
      const tokens = {
        eq: tok(eq(s), 'Équation de dissolution du sel', 0, ''), Ks: tok(sc(s.Ks), 'Constante Ks du sel à 25 °C', s.Ks, ''), M: tok(`${String(s.M).replace('.', ',')} g/mol`, 'Masse molaire du sel', s.M, 'g/mol'), th: tok('25 °C', 'Température de la solution', 25, '°C'),
      };
      const debut = ['Le sel ', s.f, ' se dissout selon ', T('eq'), ', avec Ks = ', T('Ks'), ' à ', T('th'), '. '];
      if (q === 0) return { tokens, derivees: [`s : Ks = ${s.a === 1 && s.b === 1 ? 's²' : '4 s³'}`], texte: [...debut, 'Quelle est la solubilité s de ce sel, en mol/L ?'], utiles: ['eq', 'Ks'],
        raisons: { M: 'La masse molaire sert seulement à passer de mol/L à g/L.', th: 'La température est celle de la table de Ks : elle ne sert pas dans le calcul.' },
        cherche: { bonne: 'La solubilité s (en mol/L)', faux: ['La solubilité en g/L', 'La concentration saturée de l’ion le plus concentré (en mol/L)', 'Le quotient de réaction Qr'] },
        manque: null, solution: { txt: s.a === 1 && s.b === 1 ? 's = sqrt(K)s' : 's = ∛(Ks ÷ 4)', val: so, u: 'mol/L' } };
      return { tokens, derivees: [`s (mol/L) : Ks = ${s.a === 1 && s.b === 1 ? 's²' : '4 s³'}`, 's (g/L) = s (mol/L) × M'], texte: [...debut, 'La masse molaire du sel est ', T('M'), '. Quelle est la solubilité s de ce sel, en g/L ?'], utiles: ['eq', 'Ks', 'M'],
        raisons: { th: 'La température est celle de la table de Ks : elle ne sert pas dans le calcul.' },
        cherche: { bonne: 'La solubilité en g/L', faux: ['La solubilité en mol/L', 'La masse de sel pour 100 mL de solution (en g)', 'La concentration massique de l’ion cation (en g/L)'] },
        manque: null, solution: { txt: 's (g/L) = s (mol/L) × M', val: g, u: 'g/L' } };
    }),
  },
];
