// Exercices ANA, VAL et S'APP de la simulation 311 « Précipitation sélective des hydroxydes selon le pH » (terminale STL, SPCL, Chimie et développement durable). Préfixe : hyd-.
// Capacités visées (jamais affichées) : écrire Ks d'un hydroxyde et calculer le pH de début de précipitation ; comparer des pH de précipitation pour séparer des cations ; effet de la concentration.
// Valeurs de Ks : annexe « Solubility Products » d'OpenStax Chemistry 2e (modèle hydModele.js). Cations : Cr(III), Ni(II), Mn(II), Mg(II).
import * as M from './hydModele.js';
const DOM = 'Précipitation des hydroxydes et pH';
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const VERDICT = (ok, ver) => [['Plausible', ok, ver], ['Pas plausible', !ok, ver]];
const P = o => ({ ...o, verdict: VERDICT(o.plausible, o.ver) });
const C = M.CATS;

export const HYD_ANA = [
  { id: 'hyd-ana-expression', domaine: DOM, titre: 'Écrire Ks d’un hydroxyde',
    enonce: 'L’hydroxyde de chrome(III) Cr(OH)₃ est un solide peu soluble. Sa dissolution dans l’eau est décrite par l’équation Cr(OH)₃(s) ⇌ Cr³⁺(aq) + 3 HO⁻(aq).', q: 'Quelle est l’expression de sa constante Ks ?', options: [
      V('Ks = [Cr³⁺] × [HO⁻]³', 'Chaque concentration est élevée à la puissance de son coefficient : 1 pour Cr³⁺, 3 pour HO⁻ ; le solide n’y figure pas.'),
      F('Ks = [Cr³⁺] × [HO⁻]', 'Le coefficient 3 de HO⁻ doit figurer en exposant.'),
      F('Ks = [Cr³⁺] × 3 [HO⁻]', 'Le coefficient stœchiométrique est un exposant, pas un facteur.'),
      F('Ks = [Cr³⁺]³ × [HO⁻]', 'Les exposants sont inversés : l’ion HO⁻ a le coefficient 3, l’ion Cr³⁺ le coefficient 1.'),
    ] },
  { id: 'hyd-ana-premier', domaine: DOM, titre: 'Quel hydroxyde précipite en premier ?',
    enonce: 'Une solution contient des ions Ni²⁺ et des ions Mn²⁺, chacun à 0,010 mol/L. On y ajoute peu à peu de la soude. Les deux hydroxydes ont la même forme, M(OH)₂, avec Ks(Ni(OH)₂) = 1,6×10⁻¹⁶ et Ks(Mn(OH)₂) = 2×10⁻¹³.', q: 'Lequel précipite en premier quand le pH augmente ?', options: [
      V('Ni(OH)₂ : son Ks est le plus petit', 'Même forme et même concentration : le Ks le plus petit demande moins d’ions HO⁻, donc un pH plus bas.'),
      F('Mn(OH)₂ : son Ks est plus grand, il précipite plus vite', 'Un Ks plus grand signifie un hydroxyde plus soluble : il faut davantage d’ions HO⁻ pour qu’il précipite.'),
      F('les deux en même temps : ils ont la même formule', 'Les Ks diffèrent de trois ordres de grandeur : les pH de début de précipitation sont différents.'),
      F('on ne peut pas savoir sans calculer les deux pH', 'À formule et concentration égales, comparer les Ks suffit pour classer les pH de début.'),
    ] },
  { id: 'hyd-ana-dilution', domaine: DOM, titre: 'Diluer la solution',
    enonce: 'Une solution d’ions Ni²⁺ à 0,010 mol/L commence à précipiter sous forme de Ni(OH)₂ à un pH donné quand on ajoute de la soude. On refait l’expérience avec la même solution diluée dix fois.', q: 'Comment évolue le pH de début de précipitation ?', options: [
      V('il augmente : il faut plus de HO⁻', 'Dans Ks = c × [HO⁻]², c diminue, donc [HO⁻] doit augmenter : le pH de début augmente (ici de 0,5 unité).'),
      F('il diminue, car la solution est moins concentrée', 'Moins d’ions Ni²⁺ nécessitent plus d’ions HO⁻ pour atteindre Ks : le pH de début augmente.'),
      F('il ne change pas : Ks est une constante', 'Ks est constant, mais [HO⁻] de début dépend de la concentration c : [HO⁻]² = Ks ÷ c.'),
      F('il devient égal à 7, car l’eau est neutre', 'L’eau ajoutée dilue les ions mais ne fixe pas le pH de précipitation, qui dépend de Ks et de c.'),
    ] },
  { id: 'hyd-ana-fenetre', domaine: DOM, titre: 'Séparer par le pH ?',
    enonce: 'Mn(OH)₂ n’est quasi totalement précipité (≤ 1,0×10⁻⁵ mol/L en ions Mn²⁺) qu’à partir de pH 10,2. Dans la même solution, Mg(OH)₂ commence à précipiter dès pH 9,5.', q: 'Peut-on séparer les ions Mn²⁺ et Mg²⁺ en jouant seulement sur le pH ?', options: [
      V('non : les deux zones se chevauchent', 'Il n’existe aucun pH où Mn(OH)₂ est quasi total (≥ 10,2) et Mg(OH)₂ pas encore commencé (< 9,5).'),
      F('oui, à un pH un peu supérieur à 10,2', 'À pH supérieur à 10,2, Mg(OH)₂ précipite déjà : les deux solides se mélangent.'),
      F('oui, à un pH inférieur à 9,5', 'À pH inférieur à 9,5, Mn(OH)₂ est loin d’être totalement précipité : il reste des ions Mn²⁺ en solution.'),
      F('oui, à un pH compris entre 9,5 et 10,2', 'Dans cette zone les deux hydroxydes précipitent en même temps : pas de séparation.'),
    ] },
];

export const HYD_VAL = [
  P({ id: 'hyd-val-poh', domaine: DOM, niveau: 2, titre: 'pH de début de précipitation', plausible: false,
    enonce: 'Pour des ions Ni²⁺ à 0,010 mol/L, un élève trouve [HO⁻] = 1,3×10⁻⁷ mol/L au début de la précipitation de Ni(OH)₂, puis calcule : « pH = −log (1,3×10⁻⁷) = 6,9. »',
    reperes: [['Ks de Ni(OH)₂', '1,6×10⁻¹⁶'], ['Concentration de Ni²⁺', '0,010 mol/L'], ['[HO⁻] de début', '1,3×10⁻⁷ mol/L']],
    ver: 'L’élève a calculé le pOH. Le pH vaut 14 − 6,9 = 7,1 (ou 14 + log [HO⁻]). Le pH de début de précipitation d’un hydroxyde de nickel est basique, supérieur à 7 : le résultat 6,9 doit alerter.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a calculé le pOH, il faut ensuite 14 − pOH', 'Le calcul donne −log [HO⁻] = pOH ; le pH vaut 14 − pOH.'),
      F('il a oublié que [HO⁻] se calcule avec une racine carrée', 'La concentration [HO⁻] donnée est déjà correcte (racine carrée de Ks ÷ c) : l’erreur est dans le passage à pH.'),
      F('il a oublié de diviser Ks par la concentration', 'La valeur de [HO⁻] donnée tient déjà compte de c : l’erreur est dans le calcul du pH.'),
    ] }),
  P({ id: 'hyd-val-racine', domaine: DOM, niveau: 2, titre: 'Début de précipitation de Cr(OH)₃', plausible: false,
    enonce: 'Pour des ions Cr³⁺ à 0,010 mol/L, un élève écrit : « Ks = [Cr³⁺] × [HO⁻]³ = 6,7×10⁻³¹, donc [HO⁻]² = Ks ÷ c = 6,7×10⁻²⁹, [HO⁻] = 8,2×10⁻¹⁵ mol/L, pH = 14 + log (8,2×10⁻¹⁵) = −0,1. »',
    reperes: [['Ks de Cr(OH)₃', '6,7×10⁻³¹'], ['Concentration de Cr³⁺', '0,010 mol/L']],
    ver: 'Avec l’exposant 3, [HO⁻]³ = Ks ÷ c = 6,7×10⁻²⁹, donc [HO⁻] = ∛(6,7×10⁻²⁹) ≈ 4,1×10⁻¹⁰ mol/L et pH ≈ 4,6. Un pH négatif est impossible quand on ajoute de la base à une solution.',
    q2: 'Quelle est l’erreur de l’élève ?',
    options: [
      V('il a pris une racine carrée au lieu d’une racine cubique', 'Ks = c × [HO⁻]³ : [HO⁻] = ∛(Ks ÷ c), pas √.'),
      F('il n’a pas divisé Ks par la concentration de Cr³⁺', 'La division par c est bien faite dans son calcul (Ks ÷ c = 6,7×10⁻²⁹) : l’erreur est sur l’exposant.'),
      F('il a utilisé pH = 14 − log [HO⁻] au lieu de pH = 14 + log [HO⁻]', 'La relation pH = 14 + log [HO⁻] est bien celle qu’il a écrite : l’erreur est dans [HO⁻].'),
    ] }),
];

// ---------- S'APP ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const NBSP = s => s.replace(/ /g, ' ');
const T = id => ({ t: id });
const tok = (aff, quoi, val, u) => ({ aff: NBSP(aff), quoi, use: { val, u } });
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };
const sc = x => NBSP(M.sci(x, 2));
const eqH = cat => `${cat.solide}(s) ⇌ ${cat.ion} + ${cat.n} HO⁻`;
const CONCS_SAPP = [0.0010, 0.0050, 0.010, 0.050];
const nom = n => (n === 2 ? 'racine carrée' : 'racine cubique');
export const HYD_SAPP = [
  {
    id: 'hyd-sapp-seuil', domaine: DOM, titre: 'Début de précipitation d’un hydroxyde : [HO⁻] puis pH', noms: ['Concentration en HO⁻ de début de précipitation', 'pH de début de précipitation'],
    gen: () => ({ cat: tire(M.ORDRE), c: tire(CONCS_SAPP) }),
    build: epure((p, q) => {
      const cat = C[p.cat], oh = M.ohSeuil(cat, p.c), ph = M.phDe(oh);
      const tokens = {
        eq: tok(eqH(cat), 'Équation de dissolution de l’hydroxyde', 0, ''), Ks: tok(sc(cat.Ks), 'Constante Ks de l’hydroxyde à 25 °C', cat.Ks, ''), c: tok(`${sc(p.c)} mol/L`, `Concentration des ions ${cat.ion}`, p.c, 'mol/L'),
        Ke: tok('14', 'Valeur de pKe à 25 °C (pH + pOH)', 14, ''), oh: tok(`${sc(oh)} mol/L`, 'Concentration en HO⁻ au début de la précipitation', oh, 'mol/L'),
      };
      const debut = ['Une solution contient des ions ', cat.ion, ' à ', T('c'), '. On y ajoute de la soude. Équation de dissolution : ', T('eq'), ', avec Ks = ', T('Ks'), ' à 25 °C. '];
      if (q === 0) return { tokens, derivees: [`[HO⁻] de début : Ks = c × [HO⁻]${M.sup(cat.n)}`], texte: [...debut, 'Quelle est la concentration en ions HO⁻ au début de la précipitation, en mol/L ?'], utiles: ['eq', 'Ks', 'c'],
        raisons: { Ke: 'Le produit ionique de l’eau ne sert que pour passer de [HO⁻] au pH.', oh: 'C’est la grandeur cherchée.' },
        cherche: { bonne: 'La concentration en HO⁻ au début de la précipitation (en mol/L)', faux: ['Le pH de début de précipitation', 'La concentration restante en ions Mⁿ⁺ en fin de précipitation', 'La solubilité de l’hydroxyde dans l’eau pure'] },
        manque: null, solution: { txt: `[HO⁻] = ${nom(cat.n)} de (Ks ÷ c)`, val: oh, u: 'mol/L' } };
      return { tokens, derivees: [`[HO⁻] = ${cat.n === 2 ? '√' : '∛'}(Ks ÷ c)`, 'pH = 14 + log [HO⁻]'], texte: [...debut, 'La concentration en ions HO⁻ au début de la précipitation vaut ', T('oh'), '. Quel est le pH de début de précipitation ? (pH = 14 + log [HO⁻], pKe = ', T('Ke'), ')'], utiles: ['oh', 'Ke'],
        raisons: { eq: 'L’équation a servi à écrire [HO⁻] : elle ne sert plus pour le pH.', Ks: 'Ks a servi à calculer [HO⁻], donnée ici.', c: 'La concentration a servi à calculer [HO⁻], donnée ici.' },
        cherche: { bonne: 'Le pH de début de précipitation', faux: ['Le pOH de début de précipitation', 'La concentration en HO⁻ de fin de précipitation', 'Le pH de fin de précipitation'] },
        manque: null, solution: { txt: 'pH = 14 + log [HO⁻]', val: ph, u: '' } };
    }),
  },
  {
    id: 'hyd-sapp-fenetre', domaine: DOM, titre: 'Séparer deux cations par le pH : bornes de la fenêtre', noms: ['pH de fin de précipitation du premier hydroxyde', 'pH de début de précipitation du second hydroxyde'],
    gen: () => { for (let i = 0; i < 200; i++) { const a = tire(M.ORDRE), b = tire(M.ORDRE); if (a === b) continue; const cA = tire(CONCS_SAPP), cB = tire(CONCS_SAPP), w = M.fenetre(C[a], cA, C[b], cB); if (w.largeur >= 0.5) return { a, b, cA, cB }; } return { a: 'Cr', b: 'Ni', cA: 0.010, cB: 0.010 }; },
    build: epure((p, q) => {
      const w = M.fenetre(C[p.a], p.cA, C[p.b], p.cB), P1 = w.premier, S2 = w.second, c1 = w.cPremier, c2 = w.cSecond;
      const tokens = {
        eq1: tok(eqH(P1), 'Équation de dissolution du premier hydroxyde', 0, ''), Ks1: tok(sc(P1.Ks), `Constante Ks de ${P1.solide}`, P1.Ks, ''), c1: tok(`${sc(c1)} mol/L`, `Concentration des ions ${P1.ion}`, c1, 'mol/L'),
        eq2: tok(eqH(S2), 'Équation de dissolution du second hydroxyde', 0, ''), Ks2: tok(sc(S2.Ks), `Constante Ks de ${S2.solide}`, S2.Ks, ''), c2: tok(`${sc(c2)} mol/L`, `Concentration des ions ${S2.ion}`, c2, 'mol/L'),
        cf: tok(`${sc(M.C_FIN)} mol/L`, 'Concentration d’ions en fin de précipitation (quasi totale)', M.C_FIN, 'mol/L'),
      };
      const debut = ['Une solution contient des ions ', P1.ion, ' à ', T('c1'), ' et des ions ', S2.ion, ' à ', T('c2'), '. Équations : ', T('eq1'), ' (Ks = ', T('Ks1'), ') et ', T('eq2'), ' (Ks = ', T('Ks2'), '), à 25 °C. On ajoute de la soude. '];
      if (q === 0) return { tokens, derivees: [`[HO⁻] de fin : Ks = [${P1.ion}] × [HO⁻]${M.sup(P1.n)} avec [${P1.ion}] = 1,0×10⁻⁵ mol/L`, 'pH = 14 + log [HO⁻]'], texte: [...debut, 'Un hydroxyde est considéré comme quasi totalement précipité quand il reste ', T('cf'), ' d’ions métalliques. Quel est le pH de fin de précipitation de ', P1.solide, ' ?'], utiles: ['eq1', 'Ks1', 'cf'],
        raisons: { c1: 'La concentration de départ ne sert pas : la fin de précipitation est définie par la concentration restante donnée.', eq2: 'Le second hydroxyde sert pour l’autre borne de la fenêtre.', Ks2: 'Le Ks du second hydroxyde sert pour l’autre borne de la fenêtre.', c2: 'La concentration du second cation sert pour l’autre borne de la fenêtre.' },
        cherche: { bonne: `Le pH de fin de précipitation de ${P1.solide}`, faux: [`Le pH de début de précipitation de ${P1.solide}`, `Le pH de début de précipitation de ${S2.solide}`, 'La largeur de la fenêtre de séparation (en unités de pH)'] },
        manque: null, solution: { txt: `pH = 14 + log ${nom(P1.n)} de (Ks ÷ 1,0×10⁻⁵)`, val: M.phFin(P1), u: '' } };
      return { tokens, derivees: [`[HO⁻] de début de ${S2.solide} = ${S2.n === 2 ? '√' : '∛'}(Ks ÷ c)`, 'pH = 14 + log [HO⁻]'], texte: [...debut, 'Quel est le pH de début de précipitation de ', S2.solide, ' ?'], utiles: ['eq2', 'Ks2', 'c2'],
        raisons: { eq1: 'Le premier hydroxyde donne l’autre borne de la fenêtre.', Ks1: 'Le Ks du premier hydroxyde donne l’autre borne de la fenêtre.', c1: 'La concentration du premier cation donne l’autre borne de la fenêtre.', cf: 'La concentration de fin de précipitation concerne le premier hydroxyde.' },
        cherche: { bonne: `Le pH de début de précipitation de ${S2.solide}`, faux: [`Le pH de fin de précipitation de ${S2.solide}`, `Le pH de début de précipitation de ${P1.solide}`, 'La largeur de la fenêtre de séparation (en unités de pH)'] },
        manque: null, solution: { txt: `pH = 14 + log ${nom(S2.n)} de (Ks ÷ c)`, val: M.phDebut(S2, c2), u: '' } };
    }),
  },
];
