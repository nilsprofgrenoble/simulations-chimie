import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, Curseur, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./uvVisModele";
import { QCM_PARCOURS as Q } from "./uvVisQcm";
import { SpectreUV, GrapheEtalonnage, CuveCouleur, SvgCouleurCarte, SvgEmpreinteCarte, SvgUVCarte, SvgBeerCarte, SvgValiditeCarte } from "./uvVisSchemas";

const SIM_ID = 169, CLE_GUIDE = 'uvvis-tg-guide-v1';
declarerDefis(SIM_ID, [['identification', 'Identifier une espèce à partir de son spectre'], ['concentration', 'Déterminer une concentration à partir de A lue à λmax']]);

// ====================================================
// SIM 169 — SPECTROSCOPIE UV-VISIBLE : IDENTIFIER UNE ESPÈCE, PUIS DOSER (TG spé PC, « Déterminer la composition d'un système », B).
//  Une seule idée : le spectre A(λ) est l'empreinte d'une espèce ; on l'identifie par λmax (valeurs tabulées), on dose à λmax avec A = ε·l·c,
//  tant que la solution reste dans le domaine de validité (A ≲ 1,5-2).
//  Capacités visées (jamais affichées à l'élève) : exploiter un spectre UV-visible à l'aide de données tabulées pour identifier une espèce ;
//  exploiter la loi de Beer-Lambert pour déterminer une concentration et citer ses domaines de validité.
//  Hors périmètre : spectroscopie IR, mélange de deux espèces dont les spectres se recouvrent, étalonnage complet (sims 10 et 135/136).
//  Modèle : uvVisModele.js. Valeurs de λmax et de ε : TYPIQUES (ordres de grandeur), annoncées comme telles.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const nbs = (v, cs = 2) => { if (!v) return '0'; const e = Math.floor(Math.log10(Math.abs(v))); return Number(v).toFixed(Math.max(0, cs - 1 - e)).replace('.', ','); };
const BLEU = '#0369a1';
const IDS = ['spectre', 'couleur', 'lambdamax', 'identifier', 'incolore', 'lambdaTravail', 'doubler', 'calcul', 'limite', 'quefaire', 'dilution', 'bilan'];
const SPLIT = (v, e) => nbs(v / Math.pow(10, e), 2) + '×10' + [...String(e)].map(c => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }[c])).join('');
const mol = v => SPLIT(v, Math.floor(Math.log10(v)));            // 1,8×10⁻⁵

// scène de chaque étape du parcours : espèce, concentration (dans l'unité du menu), échelle verticale, ce qui est visible
const U = 'tartrazine';
const SCENE = [
  { esp: U, c: 20, yMax: 1 }, { esp: U, c: 20, yMax: 1 }, { esp: U, c: 20, yMax: 1 }, { esp: U, c: 20, yMax: 1 },
  { esp: 'paracetamol', c: 60, yMax: 1 }, { esp: U, c: 20, yMax: 1 }, { esp: U, c: 20, yMax: 1, curseurC: 40 },
  { esp: 'cochenille', c: 18.4, yMax: 1, inconnue: true }, { esp: U, c: 20, yMax: 3, curseurC: 120 }, { esp: U, c: 20, yMax: 3, curseurC: 120 },
  { esp: 'bleu', c: 6, yMax: 1, inconnue: true }, { esp: U, c: 20, yMax: 3, curseurC: 120 },
];
const CAND4 = ['tartrazine', 'jaune', 'cochenille', 'bleu'];

// ---------- formules ----------
const FBeer = <Formule><mi>A</mi><mo>=</mo><mi>ε</mi><mo>×</mo><mi>l</mi><mo>×</mo><mi>c</mi></Formule>;
const FConc = <Formule><mi>c</mi><mo>=</mo><mfrac><mi>A</mi><mrow><mi>ε</mi><mo>×</mo><mi>l</mi></mrow></mfrac></Formule>;
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const U_EPS = 'L·mol⁻¹·cm⁻¹';

const eps = k => M.ESPECES[k].eps, epsT = k => M.epsTexte(M.ESPECES[k].eps), lmax = k => M.ESPECES[k].lambdaMax;
// absorbance AFFICHÉE au maximum (3 décimales) d'une solution de concentration c (unité du menu) : c'est ce que l'élève lit
const aLue = (k, c) => Number(M.absorbance(k, lmax(k), M.enMolL(k, c)).toFixed(3));
const A8 = aLue('cochenille', 18.4), C8 = A8 / (eps('cochenille') * M.L_CUVE) * 1e6;                 // µmol/L
const F11 = 10, A11 = aLue('bleu', 6), C11p = A11 / (eps('bleu') * M.L_CUVE) * 1e6, C11 = F11 * C11p;          // µmol/L (dilution 10 fois ; boisson ≈ 60 µmol/L ≈ 35 mg/L)

export function SimulationUvVisible() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviI, noterI] = useCompteurDefi(), [suiviC, noterC] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('identification');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ reglages: false, superposer: false, graphe: true, essayer: false, retenir: false });
  const [lamG, setLamG] = useState(300), [cG, setCG] = useState(20);                       // parcours : curseur de longueur d'onde, concentration (µmol/L)
  const [ex, setEx] = useState({ esp: 'tartrazine', c: 20, l: 1, lam: 427, comp: '' });     // exploration
  const [lamD, setLamD] = useState(300);                                                    // défi : curseur
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;

  // ---------- étapes ----------
  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);
  const SG = SCENE[Math.max(idx, 0)];
  const cEff = enGuide ? (SG.inconnue ? SG.c : SG.curseurC ? Math.min(cG, SG.curseurC) : SG.c) : 0;   // concentration réellement affichée (µmol/L)

  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'spectre', titre: 'Lire un spectre d’absorption', focus: ['scene'],
      texte: <>Une boisson jaune contient un colorant alimentaire dissous dans l’eau. On en place un échantillon dans un spectrophotomètre UV-visible : pour chaque longueur d’onde λ (en nm), l’appareil mesure l’<strong>absorbance A</strong>, sans unité. La courbe A = f(λ) est le <strong>spectre d’absorption</strong> de la solution. La bande colorée sous l’axe indique la couleur de la lumière à chaque longueur d’onde.</>,
      tache: { type: 'qcm', q: 'Que représente la hauteur de la courbe, pour une longueur d’onde donnée ?', ...Q.spectre,
        expl: 'A mesure la lumière absorbée à cette longueur d’onde : plus la courbe est haute, plus la solution absorbe cette lumière, et moins il en reste à la sortie de la cuve.',
        indice: 'Un point haut de la courbe est une longueur d’onde que la solution absorbe beaucoup. Que reste-t-il alors de cette lumière à la sortie de la cuve ?' } },
    { id: 'couleur', titre: 'Couleur de la solution et lumière absorbée', focus: ['scene', 'curseur'],
      texte: <>La solution est jaune (cuve ci-dessous). Une solution colorée absorbe une partie de la lumière blanche qui la traverse : l’œil reçoit les couleurs qui ne sont pas absorbées. Comparez la couleur de la solution et la zone de la bande colorée sous le sommet de la courbe.</>,
      tache: { type: 'qcm', q: 'Quelle lumière cette solution jaune absorbe-t-elle principalement ?', ...Q.couleur,
        expl: 'Le spectre est haut dans le violet-bleu : c’est la lumière absorbée. L’œil reçoit le reste de la lumière blanche, qui paraît jaune : le jaune est la couleur complémentaire du violet-bleu. Une solution n’absorbe pas la couleur qu’on lui voit.',
        indice: 'Regardez la couleur de la bande sous le sommet de la courbe. Les couleurs que la solution n’absorbe pas sont celles que l’œil reçoit.' } },
    { id: 'lambdamax', titre: 'Longueur d’onde du maximum d’absorption', focus: ['scene', 'curseur'],
      retenirTitre: 'À RETENIR : COULEUR VUE, COULEUR ABSORBÉE',
      retenir: <>
        <SvgCouleurCarte/>
        <ul style={ULS}>
          <li>Une solution colorée absorbe une partie de la lumière blanche ; la couleur qu’on voit est la <strong>couleur complémentaire</strong> de la lumière absorbée (couples approximatifs).</li>
          <li>Exemple de la simulation : la solution jaune absorbe surtout le violet-bleu et laisse passer le reste.</li>
          <li>Moyen de s’en souvenir : <strong>« on voit ce qui n’est pas absorbé »</strong>. Idée fausse : « une solution jaune absorbe le jaune ». Vrai : elle absorbe la couleur complémentaire (violet-bleu).</li>
        </ul></>,
      texte: <>Un curseur apparaît sur le spectre : déplacez-le pour lire, en chaque point, la longueur d’onde λ et l’absorbance A (zone Mesures). La longueur d’onde λ_max du <strong>maximum d’absorption</strong> est une caractéristique de l’espèce qui absorbe.</>,
      tache: { type: 'num', q: 'Placez le curseur au sommet de la courbe : quelle est la longueur d’onde λ_max du maximum d’absorption, en nm ?', unite: 'nm', vrai: lmax(U), tol: 0.05, affiche: v => nbf(v, 0), carnet: 'Longueur d’onde λ_max lue',
        calcul: () => ['Le sommet de la courbe correspond à la plus grande valeur de A : on lit sa longueur d’onde avec le curseur.', `λ_max ≈ ${lmax(U)} nm (une lecture à une vingtaine de nm près est acceptée).`],
        pieges: [[0.54, 'Vous avez donné l’absorbance A du sommet ; on demande sa longueur d’onde λ, en nm.']],
        expl: `Le sommet est à environ ${lmax(U)} nm.`, indice: 'Déplacez le curseur jusqu’au point le plus haut de la courbe, puis lisez la valeur de λ dans la zone Mesures.' } },
    { id: 'identifier', titre: 'Identifier une espèce avec des valeurs tabulées', focus: ['scene', 'table'],
      texte: <>Les colorants autorisés dans cette boisson figurent dans le tableau, avec leur valeur tabulée de λ_max (valeurs typiques, ordres de grandeur issus de tables : elles varient un peu avec le solvant et la source). Une espèce est identifiée quand la valeur lue sur le spectre est proche de la valeur tabulée de l’une des espèces candidates. Vous avez lu λ_max ≈ {lmax(U)}{NB}nm à une vingtaine de nanomètres près.</>,
      tache: { type: 'qcm', q: 'Quel colorant contient la boisson ?', ...Q.identifier,
        expl: `λ_max ≈ ${lmax(U)} nm est celle de la tartrazine (${lmax('tartrazine')} nm), pas celle du jaune orangé S (${lmax('jaune')} nm), du rouge cochenille A (${lmax('cochenille')} nm) ou du bleu patenté V (${lmax('bleu')} nm). La couleur de la boisson limite le choix, mais c’est λ_max qui tranche.`,
        indice: 'Comparez la valeur lue de λ_max à celles du tableau : la bonne espèce est celle dont la valeur tabulée est la plus proche.' } },
    { id: 'incolore', titre: 'Une solution incolore a-t-elle un spectre ?', focus: ['scene', 'table'],
      retenirTitre: 'À RETENIR : LE SPECTRE, EMPREINTE D’UNE ESPÈCE',
      retenir: <>
        <SvgEmpreinteCarte/>
        <ul style={ULS}>
          <li>Le spectre A = f(λ) est propre à chaque espèce ; la longueur d’onde <strong>λ_max</strong> du maximum la caractérise. Pour identifier une espèce, on lit λ_max puis on la compare aux valeurs tabulées des espèces candidates.</li>
          <li>Exemple de la simulation : tartrazine (jaune) et jaune orangé S (orange) ont des λ_max différentes ({lmax('tartrazine')}{NB}nm et {lmax('jaune')}{NB}nm).</li>
          <li>Moyen de s’en souvenir : <strong>« λ_max = carte d’identité de l’espèce »</strong>. Idée fausse : « la couleur suffit à identifier ». Vrai : deux espèces de couleurs voisines se distinguent par leur λ_max.</li>
        </ul></>,
      texte: <>Autre échantillon : un sirop incolore contient une seule espèce dissoute. Son spectre est tracé ci-dessous ; le tableau contient maintenant toutes les espèces candidates. Déplacez le curseur pour repérer le sommet de la courbe.</>,
      tache: { type: 'qcm', q: 'Quelle conclusion est correcte pour cette solution incolore ?', ...Q.incolore,
        expl: `Le sommet est vers ${lmax('paracetamol')} nm, dans l’ultraviolet (λ < 400 nm) : l’œil ne le voit pas, d’où une solution incolore. Cette valeur est celle du paracétamol ; la caféine (${lmax('cafeine')} nm) est incolore aussi, mais son maximum est plus loin.`,
        indice: 'Repérez la valeur de λ du sommet avec le curseur, puis cherchez dans le tableau l’espèce incolore dont la valeur tabulée est la plus proche.' } },
    { id: 'lambdaTravail', titre: 'Choisir la longueur d’onde pour doser', focus: ['scene', 'curseur'],
      retenirTitre: 'À RETENIR : INCOLORE NE VEUT PAS DIRE « SANS SPECTRE »',
      retenir: <>
        <SvgUVCarte/>
        <ul style={ULS}>
          <li>Le spectre UV-visible s’étend de l’ultraviolet (λ &lt; 400 nm environ) au visible (400 à 800 nm environ). L’œil ne voit que le visible.</li>
          <li>Une espèce incolore n’absorbe pas dans le visible mais peut absorber dans l’UV : son spectre permet de l’identifier et de la doser. Exemple : paracétamol (λ_max ≈ {lmax('paracetamol')}{NB}nm), caféine (≈ {lmax('cafeine')}{NB}nm).</li>
          <li>Moyen de s’en souvenir : <strong>« invisible à l’œil, pas pour le spectrophotomètre »</strong>. Idée fausse : « incolore donc pas de spectre ». Vrai : le maximum est dans l’UV.</li>
        </ul></>,
      texte: <>On revient à la boisson jaune : la tartrazine est identifiée. Pour déterminer sa concentration, on mesure A à une longueur d’onde fixée. Déplacez le curseur pour comparer l’absorbance au sommet de la courbe et plus loin, par exemple vers 550{NB}nm.</>,
      tache: { type: 'qcm', q: 'À quelle longueur d’onde se placer pour doser avec la meilleure sensibilité (la plus grande variation de A pour une même variation de c) ?', ...Q.lambdaTravail,
        expl: 'Pour une même variation de concentration, A varie d’autant plus que ε est grand ; or ε est maximal à λ_max : on se place au maximum d’absorption. De plus la courbe y est plate : une petite erreur de réglage de la longueur d’onde change peu A.',
        indice: 'La sensibilité est la variation de A pour une variation donnée de c : où la solution absorbe-t-elle le plus de lumière ? Comparez A au sommet et vers 550 nm avec le curseur.' } },
    { id: 'doubler', titre: 'Effet de la concentration sur le spectre', focus: ['scene', 'curseur'],
      texte: <>Un curseur de concentration apparaît ; il est réglé sur c = 20{NB}µmol/L. Doublez la concentration (40{NB}µmol/L) et observez le spectre : sa forme, sa hauteur et la position de son maximum.</>,
      tache: { type: 'qcm', q: 'Quand on double la concentration c, que devient le spectre ?', ...Q.doubler,
        expl: 'Le spectre garde la même forme et le même λ_max ; A est proportionnelle à c, donc elle double à chaque longueur d’onde. λ_max ne dépend pas de la concentration : c’est une caractéristique de l’espèce.',
        indice: 'Mettez c à 40 µmol/L puis ramenez-la à 20 µmol/L : le sommet de la courbe change-t-il de hauteur ? de longueur d’onde ?' } },
    { id: 'calcul', titre: 'Déterminer une concentration', focus: ['scene', 'curseur', 'table'],
      texte: <>Une sauce rouge contient du rouge cochenille A : λ_max = {lmax('cochenille')}{NB}nm et ε = {epsT('cochenille')}{NB}{U_EPS} à cette longueur d’onde (valeurs tabulées typiques). Son spectre est mesuré dans une cuve de longueur l = 1,00{NB}cm ; sa concentration est inconnue (le curseur de concentration ne sert donc plus). On admet la loi de Beer-Lambert : {FBeer}Placez le curseur à λ_max (bouton) et lisez A.</>,
      tache: { type: 'num', q: 'Concentration c de la sauce, en µmol/L (2 chiffres significatifs)', unite: 'µmol/L', vrai: C8, tol: 0.06, affiche: v => nbs(v, 2), cs: 2, carnet: 'Concentration c de la sauce',
        calcul: () => [`À λ_max = ${lmax('cochenille')} nm : A = ${nbf(A8, 3)} (valeur lue).`, `c = frac(A|ε × l) = frac(${nbf(A8, 3)}|${epsT('cochenille')} × 1,00) = ${mol(A8 / eps('cochenille'))} mol/L.`, `Conversion : 1 µmol/L = 10⁻⁶ mol/L, donc c = ${nbs(C8, 3)} µmol/L, soit ${nbs(C8, 2)} µmol/L.`],
        pieges: [[C8 * 1e-6, 'Vous avez donné c en mol/L : convertissez en µmol/L (multipliez par 10⁶).'], [C8 * 1e-3, 'Vous avez donné c en mmol/L : 1 mmol/L = 1 000 µmol/L.'], [A8 * eps('cochenille'), 'Vous avez multiplié A par ε : il faut diviser A par ε × l.']],
        expl: `c = frac(A|ε × l) = frac(${nbf(A8, 3)}|${epsT('cochenille')} × 1,00) = ${mol(A8 / eps('cochenille'))} mol/L = ${nbs(C8, 2)} µmol/L.`,
        indice: 'A = ε × l × c : isolez c. Avec ε en L·mol⁻¹·cm⁻¹ et l en cm, c sort en mol/L ; convertissez ensuite en µmol/L (1 µmol/L = 10⁻⁶ mol/L).' } },
    { id: 'limite', titre: 'Les limites de la loi de Beer-Lambert', focus: ['scene', 'graphe'],
      retenirTitre: 'À RETENIR : LA LOI DE BEER-LAMBERT',
      retenir: <>
        <SvgBeerCarte/>
        <ul style={ULS}>
          <li>Loi de Beer-Lambert : {FBeer}A sans unité ; ε en {U_EPS} ; l en cm ; c en mol/L. On en tire c = frac(A|ε × l).</li>
          <li>On travaille à <strong>λ_max</strong> : A y est la plus grande, donc la mesure est la plus sensible. ε ne dépend que de l’espèce et de λ, pas de c.</li>
          <li>Moyen de s’en souvenir : <strong>« A proportionnelle à c : si c double, A double »</strong>. Idée fausse : « ε change quand on dilue ». Vrai : ε est la même ; c’est A qui change.</li>
        </ul></>,
      texte: <>Un graphique apparaît : absorbance de la tartrazine à λ_max = {lmax(U)}{NB}nm en fonction de la concentration c. Les tirets prolongent la droite A = ε × l × c ; le trait plein est l’absorbance que mesure l’appareil. Faites varier c (de 0 à 120{NB}µmol/L) et observez les deux courbes.</>,
      tache: { type: 'qcm', q: 'À partir de quelle absorbance environ le trait plein s’écarte-t-il nettement de la droite ?', ...Q.limite,
        expl: 'Jusqu’à A voisine de 1,5 à 2, la mesure suit la droite : A est proportionnelle à c. Au-delà, la courbe s’aplatit : l’appareil sous-estime A (dans cette simulation, à cause d’un peu de lumière parasite, modèle simplifié ; en pratique, une solution trop concentrée produit aussi cet écart). La loi de Beer-Lambert n’est plus utilisable.',
        indice: 'Faites monter c progressivement et repérez la valeur de A (axe vertical) à laquelle le trait plein quitte les tirets de façon visible.' } },
    { id: 'quefaire', titre: 'Que faire quand A est trop grande ?', focus: ['graphe'],
      texte: <>Un élève mesure, pour une boisson très colorée contenant de la tartrazine, A = 2,4 à λ_max = {lmax(U)}{NB}nm, et calcule c = frac(A|ε × l) comme précédemment. Sa mesure est le point orange du graphique ; la zone hachurée repère maintenant la limite de validité.</>,
      tache: { type: 'qcm', q: 'Que doit faire cet élève pour déterminer la concentration ?', ...Q.quefaire,
        expl: 'A = 2,4 est hors du domaine de validité (A ≲ 1,5 à 2) : la concentration calculée serait trop faible. Il faut diluer la solution d’un facteur F connu, mesurer A de la solution diluée (A dans le domaine de validité), calculer c′, puis c = F × c′. Une cuve plus longue ferait encore augmenter A.',
        indice: 'Il faut ramener A dans le domaine de validité. Diluer fait-il augmenter ou diminuer A ? Que faut-il faire ensuite pour retrouver la solution de départ ?' } },
    { id: 'dilution', titre: 'Dosage avec dilution', focus: ['scene', 'curseur'],
      texte: <>Une boisson bleue très colorée contient du bleu patenté V : λ_max = {lmax('bleu')}{NB}nm et ε = {epsT('bleu')}{NB}{U_EPS}. On la dilue {F11}{NB}fois (1 volume de boisson et {F11 - 1} volumes d’eau), puis on mesure le spectre de la solution diluée dans une cuve de longueur l = 1,00{NB}cm. La concentration est inconnue : le curseur de concentration n’est plus proposé. Placez le curseur à λ_max (bouton) et lisez A.</>,
      tache: { type: 'num', q: 'Concentration c de la boisson initiale, en µmol/L (2 chiffres significatifs)', unite: 'µmol/L', vrai: C11, tol: 0.06, affiche: v => nbs(v, 2), cs: 2, carnet: 'Concentration c de la boisson',
        calcul: () => [`À λ_max = ${lmax('bleu')} nm : A = ${nbf(A11, 3)} (valeur lue), dans le domaine de validité.`, `c′ = frac(A|ε × l) = frac(${nbf(A11, 3)}|${epsT('bleu')} × 1,00) = ${mol(A11 / eps('bleu'))} mol/L = ${nbs(C11p, 3)} µmol/L (solution diluée).`, `c = ${F11} × c′ = ${F11} × ${nbs(C11p, 3)} = ${nbs(C11, 3)} µmol/L, soit ${nbs(C11, 2)} µmol/L.`],
        pieges: [[C11p, 'Vous avez donné la concentration de la solution diluée : multipliez par le facteur de dilution ' + F11 + '.'], [C11 * 1e-6, 'Vous avez donné c en mol/L : convertissez en µmol/L (multipliez par 10⁶).'], [C11p / F11, 'Il faut multiplier par ' + F11 + ' (pas diviser) : la boisson initiale est plus concentrée que la solution diluée.']],
        expl: `c′ = frac(A|ε × l) = ${nbs(C11p, 3)} µmol/L ; c = ${F11} × c′ = ${nbs(C11, 2)} µmol/L.`,
        indice: 'D’abord c′ de la solution diluée avec c′ = A divisée par (ε × l), puis la boisson initiale est ' + F11 + ' fois plus concentrée : c = ' + F11 + ' × c′.' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : DOMAINE DE VALIDITÉ',
      retenir: <>
        <SvgValiditeCarte/>
        <ul style={ULS}>
          <li>La loi {FBeer}n’est valable que : pour une <strong>solution diluée</strong>, avec une <strong>lumière monochromatique</strong>, sans réaction du soluté avec le solvant, et pour <strong>A ≲ 1,5 à 2</strong>.</li>
          <li>Exemple de la simulation : au-delà de A ≈ 2, l’absorbance mesurée s’écarte de la droite ; on dilue d’un facteur connu F, on mesure, puis c = F × c′.</li>
          <li>Moyen de s’en souvenir : <strong>« A ≲ 2, sinon on dilue »</strong>. Idée fausse : « la droite A = ε × l × c vaut pour toutes les concentrations ». Vrai : elle n’est utilisable que dans son domaine.</li>
        </ul></>,
      texte: <>Vous savez lire un spectre UV-visible, identifier une espèce avec λ_max et des valeurs tabulées (même incolore, si elle absorbe dans l’UV), déterminer une concentration avec A = ε × l × c à λ_max, et citer les limites de cette loi. Passez à l’exploration (autres espèces, cuves, longueurs d’onde, spectres superposés) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'identification') { const t = M.tirageDefiIdentification(); setDefi({ type, ...t, choix: '', verifie: false }); }
    else { const t = M.tirageDefiConcentration(); setDefi({ type, ...t, rep: '', verifie: false }); }
    setLamD(300);
  };
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const procheTol = (x, v, t) => isFinite(x) && Math.abs(x - v) <= t * v;
  const verifier = () => {
    if (defi.type === 'identification') { const ok = defi.choix === defi.inconnue; setDefi(d => ({ ...d, verifie: true, ok, essais: ok ? d.essais : (d.essais || 0) + 1 })); noterI(ok); }
    else { const ok = procheTol(lireNombre(defi.rep), defi.attendue, 0.06); setDefi(d => ({ ...d, verifie: true, ok, essais: ok ? d.essais : (d.essais || 0) + 1 })); noterC(ok); }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const tableValeurs = (cles, avecEps, ouvert) => (
    <details open={ouvert} key={`${cles.length}${avecEps}${ouvert}`} style={{ ...styleBoite, ...cadre('table') }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 15, color: KIT.txt }}>Valeurs tabulées (typiques)</summary>
      <div style={{ overflowX: 'auto', marginTop: 6 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13.5, width: '100%', color: KIT.txt }}>
          <thead><tr style={{ textAlign: 'left', borderBottom: `2px solid ${KIT.bord}` }}><th style={{ padding: '4px 4px' }}>Espèce</th>{!avecEps && <th style={{ padding: '4px 4px' }}>Solution</th>}<th style={{ padding: '4px 4px', whiteSpace: 'nowrap' }}>λ{indicesProfond('_max')} (nm)</th>{avecEps && <th style={{ padding: '4px 4px' }}>ε ({U_EPS})</th>}</tr></thead>
          <tbody>{cles.map(k => <tr key={k} style={{ borderBottom: `1px dashed ${KIT.bord}` }}><td style={{ padding: '4px 4px' }}>{M.ESPECES[k].nom}{M.ESPECES[k].formule ? ` ${M.ESPECES[k].formule}` : ''}</td>{!avecEps && <td style={{ padding: '4px 4px' }}>{M.ESPECES[k].couleur}</td>}<td style={{ padding: '4px 4px', fontFamily: 'monospace', fontWeight: 700 }}>{lmax(k)}</td>{avecEps && <td style={{ padding: '4px 4px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{epsT(k)}</td>}</tr>)}</tbody>
        </table>
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Ordres de grandeur typiques de tables : ils varient un peu avec le solvant et le pH.</div>
    </details>);

  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['identification', 'Identifier une espèce'], ['concentration', 'Déterminer une concentration']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'identification' ? 'Défi : quelle est l’espèce dissoute ?' : 'Défi : quelle est la concentration ?'}</div>
      {defi.type === 'identification' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une solution contient une seule espèce, parmi les quatre candidates du tableau. Son spectre est tracé ci-dessous : lisez λ_max avec le curseur, comparez aux valeurs tabulées, puis choisissez l’espèce.</div>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Espèce dissoute
          <select value={defi.choix} onChange={e => setDefi(d => ({ ...d, choix: e.target.value, verifie: false }))} style={{ ...menu, marginTop: 2 }}>
            <option value="">Choisir une espèce…</option>
            {defi.candidates.map(k => <option key={k} value={k}>{M.ESPECES[k].nom}</option>)}
          </select>
        </label>
        <IndiceDefi cache={false}>Déplacez le curseur jusqu’au sommet de la courbe et lisez λ_max, puis cherchez dans le tableau l’espèce dont la valeur tabulée de λ_max est la plus proche.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>La solution contient {M.ESPECES[defi.esp].de} <strong>{M.ESPECES[defi.esp].court}</strong> (λ_max = <strong>{lmax(defi.esp)}{NB}nm</strong> ; ε = <strong>{epsT(defi.esp)}{NB}{U_EPS}</strong> à cette longueur d’onde), mesuré dans une cuve de <strong>l = 1,00{NB}cm</strong>. {defi.F > 1 ? <>La solution a été <strong>diluée {defi.F}{NB}fois</strong> avant la mesure : le spectre ci-dessous est celui de la solution diluée. </> : <>Le spectre ci-dessous est celui de la solution étudiée. </>}Placez le curseur à λ_max (bouton), lisez A et déterminez la concentration de la solution <strong>{defi.F > 1 ? 'initiale' : 'étudiée'}</strong>, en {M.ESPECES[defi.esp].unite} (2 chiffres significatifs, marge acceptée : 6{NB}%).</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>c =</span>
          <input value={defi.rep} aria-label="c" onKeyDown={e => e.key === 'Enter' && document.getElementById('uv-verif')?.click()} onChange={e => setDefi(d => ({ ...d, rep: e.target.value, verifie: false }))} inputMode="decimal"
            style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{M.ESPECES[defi.esp].unite}</span>
        </div>
        <IndiceDefi cache={false}>A = ε × l × c : c = A divisée par (ε × l), en mol/L (ε en L·mol⁻¹·cm⁻¹, l en cm). Convertissez dans l’unité demandée, puis multipliez par le facteur de dilution s’il y en a un.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button id="uv-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'identification'
          ? (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.ok || (defi.essais || 0) >= 2 ? `Le maximum est à ${lmax(defi.inconnue)} nm : c’est la valeur tabulée de l’espèce « ${M.ESPECES[defi.inconnue].nom} ».` : 'Lisez λ_max avec le curseur, comparez-la aux valeurs du tableau et vérifiez à nouveau (l’indice peut vous aider).')
          : (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.ok || (defi.essais || 0) >= 2
            ? `A = ${nbf(defi.aLue, 3)} ; c${defi.F > 1 ? '′' : ''} = frac(A|ε × l) = frac(${nbf(defi.aLue, 3)}|${epsT(defi.esp)} × 1,00) = ${mol(M.concentration(defi.aLue, eps(defi.esp)))} mol/L${defi.F > 1 ? ` ; c = ${defi.F} × c′` : ''}, soit ${nbs(defi.attendue, 2)} ${M.ESPECES[defi.esp].unite} (marge acceptée : 6 %).`
            : 'Calculez c = A / (ε × l) en mol/L, convertissez, tenez compte de la dilution, et vérifiez à nouveau (l’indice peut vous aider).')}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Une seule espèce absorbante</strong>, dissoute dans l’eau (solvant transparent) ; pas de mélange de deux espèces à spectres qui se recouvrent (hors programme).</li>
      <li><strong>Cuve de 1,00 cm</strong>, température de 25 °C ; en exploration, la longueur de cuve est un menu (0,50 ; 1,00 ou 2,00 cm).</li>
      <li><strong>Loi de Beer-Lambert</strong> A = ε × l × c, avec ε constante (indépendante de c), <strong>lumière monochromatique</strong>, solution <strong>diluée</strong>, soluté sans réaction avec le solvant : domaine de validité A ≲ 1,5 à 2.</li>
      <li><strong>Écart à la linéarité au-delà de ce domaine</strong> : il est simulé par un modèle simple (0,3 % de lumière parasite atteint le détecteur). C’est un modèle de la simulation, pas une loi du programme : en pratique, d’autres causes (interactions entre espèces dans une solution concentrée) donnent aussi une courbe qui s’infléchit.</li>
      <li><strong>Valeurs tabulées typiques</strong> : λ_max et ε sont des ordres de grandeur de tables ; ils varient un peu avec le solvant et le pH. Les spectres sont modélisés par des bandes gaussiennes : leur allure est réaliste, pas exacte.</li>
      <li><strong>Absorbances affichées</strong> à 3 décimales ; les résultats demandés sont à 2 chiffres significatifs, avec une marge de 5 à 6 %.</li>
      <li><strong>Hors périmètre</strong> : spectroscopie infrarouge, mélange de plusieurs espèces absorbantes, étalonnage complet (voir les autres simulations du chapitre).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- paramètres de la scène courante ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  let P;                                  // { esp, cMolL, l, yMax, curseur, lam }
  if (enGuide) P = { esp: SG.esp, cMolL: M.enMolL(SG.esp, cEff), l: M.L_CUVE, yMax: SG.yMax, curs: idx >= 2, lam: lamG, setLam: setLamG };
  else if (dd) P = dd.type === 'identification' ? { esp: dd.inconnue, cMolL: dd.c, l: M.L_CUVE, yMax: 1.5, curs: true, lam: lamD, setLam: setLamD } : { esp: dd.esp, cMolL: dd.cDil, l: M.L_CUVE, yMax: 1.5, curs: true, lam: lamD, setLam: setLamD };
  else P = { esp: ex.esp, cMolL: M.enMolL(ex.esp, ex.c), l: ex.l, yMax: M.A_MAX_AFFICHE, curs: true, lam: ex.lam, setLam: x => setEx(s => ({ ...s, lam: x })) };
  const sp = M.ESPECES[P.esp];
  const Alam = M.absorbance(P.esp, P.lam, P.cMolL, P.l), Ath = M.aTheorique(P.esp, P.lam, P.cMolL, P.l);
  const anonyme = enDefi || (enGuide && (SG.inconnue || idx <= 4));
  const ariaScene = `Spectre d'absorption A en fonction de la longueur d'onde en nanomètres, de 220 à 750 nm. ${anonyme ? 'Solution étudiée.' : sp.nom + '.'} ${P.curs ? `Le curseur est à ${P.lam} nm, où l'absorbance vaut ${nbf(Alam, 3)}.` : ''}`;
  const compare = enExplore && ex.comp && ex.comp !== ex.esp ? ex.comp : null;

  const boutonLmax = (enGuide && SG.inconnue) || (dd && dd.type === 'concentration');
  const boxScene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enExplore && <div style={aide}>Le spectre de la solution choisie : absorbance A en fonction de la longueur d’onde. Le curseur orange lit A à la longueur d’onde choisie.</div>}
      {dd && dd.type === 'identification' && <div style={aide}>Spectre de la solution inconnue (la concentration varie d’un tirage à l’autre : la hauteur du pic ne permet pas d’identifier l’espèce).</div>}
      <SpectreUV esp={P.esp} c={P.cMolL} l={P.l} yMax={P.yMax} curseur={P.curs ? P.lam : null} compare={compare} aria={ariaScene}/>
      {compare && <div style={{ ...aide, marginTop: 6 }}>Spectres normalisés (chacun ramené à 1 au maximum) : trait plein = {sp.court}, tirets orange = {M.ESPECES[compare].court}.</div>}
    </div>);
  // boîte « Mesures » : cuve (parcours), concentration (parcours, quand elle est réglable), curseur de longueur d'onde et lectures
  const surC = enGuide && deja('doubler') && !SG.inconnue, curC = SG.curseurC || 40;
  const q10 = enGuide && idx === 9;      // étape « que faire » : seule la mesure de l'élève (A = 2,4) est montrée, sur le graphique
  const cQ10 = M.depuisMolL(U, 3 / eps(U));   // A théorique 3,0 → A mesurée ≈ 2,4
  const boxCurseur = (enGuide ? idx >= 1 && !q10 : enDefi && !!dd) && (
    <div style={{ ...styleBoite, ...cadre('curseur') }}>
      <div style={titreCarte}>{enGuide && idx === 1 ? 'La solution' : 'Mesures'}</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {enGuide && <div style={{ flex: '0 0 96px', textAlign: 'center', fontSize: 13.5, color: KIT.txt, fontWeight: 700 }}>
          <CuveCouleur esp={SG.esp} c={M.enMolL(SG.esp, SG.inconnue ? SG.c : Math.max(cEff, 5))}/>
          <div>solution {sp.couleur}</div></div>}
        {(enDefi || idx >= 2) && <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          {surC && <Curseur nom="Concentration c de la tartrazine" valeur={Math.min(cG, curC)} onChange={setCG} min={0} max={curC} pas={curC > 40 ? 1 : 5} unite="µmol/L" couleur="#15803d"/>}
          <Curseur nom="Longueur d’onde λ du curseur" valeur={P.lam} onChange={P.setLam} min={M.LAMBDA_MIN} max={M.LAMBDA_MAX} pas={1} unite="nm" couleur={ORANGE_GUIDE}/>
          {boutonLmax && <div style={{ marginBottom: 8 }}><button onClick={() => P.setLam(lmax(P.esp))} style={styleBouton(false, ORANGE_GUIDE)}>Placer le curseur à λ{indicesProfond('_max')} tabulée</button></div>}
          <LigneMesure nom="Longueur d’onde λ" valeur={`${P.lam}${NB}nm`} couleur={ORANGE_GUIDE}/>
          <LigneMesure nom="Absorbance A" valeur={nbf(Alam, 3)} couleur="#b91c1c"/>
          {surC && <LigneMesure nom="Concentration c" valeur={`${nbf(cEff, 0)}${NB}µmol/L`}/>}
        </div>}
      </div>
    </div>);
  const boxGraphe = enGuide && deja('limite') && !SG.inconnue && (
    <div style={{ ...styleBoite, ...cadre('graphe') }}>
      <div style={titreCarte}>Absorbance à λ{indicesProfond('_max')} = {lmax(U)}{NB}nm en fonction de c</div>
      <GrapheEtalonnage esp={U} lam={lmax(U)} cUnite={q10 ? cQ10 : Math.min(cG, 120)} cMaxUnite={120} zone={apres('limite')} aria={`Graphique de l'absorbance A en fonction de la concentration de tartrazine, de 0 à 120 micromoles par litre : droite en tirets et absorbance mesurée en trait plein${apres('limite') ? ', avec la zone limite de validité hachurée' : ''}.`}/>
      <div style={{ ...aide, marginTop: 6 }}>Tirets : droite A = ε × l × c. Trait plein : absorbance mesurée. {q10 ? ' Point orange : la mesure de l’élève (A = 2,4).' : ' Point orange : la concentration réglée.'}{apres('limite') ? ' Zone hachurée : limite du domaine de validité (A ≈ 1,5 à 2).' : ''}</div>
    </div>);
  const tableGuide = enGuide && idx >= 3 && !q10 && tableValeurs(idx >= 4 ? M.ORDRE : CAND4, idx >= 7, [3, 4, 7].includes(idx));

  // ---------- mesures de l'exploration ----------
  const ecart = Ath > 0 ? (Alam - Ath) / Ath * 100 : 0;
  const validite = Ath <= M.A_LIMITE_BAS ? 'domaine de validité respecté (A ≤ 1,5)' : Ath <= M.A_LIMITE_HAUT ? 'à la limite du domaine (A entre 1,5 et 2)' : `hors domaine (A > 2) : la mesure est ${nbf(Math.abs(ecart), 0)} % sous la droite`;
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures</div>
      <div style={aide}>Valeurs à la longueur d’onde choisie, pour la solution réglée.</div>
      <LigneMesure nom="Espèce" valeur={sp.court}/>
      <LigneMesure nom="λ_max tabulée" valeur={`${lmax(ex.esp)}${NB}nm`}/>
      <LigneMesure nom="ε à la λ choisie" valeur={`${M.epsTexte(M.epsilon(ex.esp, ex.lam))}${NB}${U_EPS}`}/>
      <LigneMesure nom="A théorique ε × l × c" valeur={nbf(Ath, 3)} couleur={BLEU}/>
      <LigneMesure nom="A mesurée" valeur={nbf(Alam, 3)} couleur="#b91c1c"/>
      <div role="status" aria-live="polite" style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, background: Ath > M.A_LIMITE_BAS ? '#fffbeb' : '#f0fdf4', border: `1.5px solid ${Ath > M.A_LIMITE_BAS ? '#b45309' : '#15803d'}`, color: KIT.txt }}>{validite}</div>
    </div>);
  const reglagesEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez l’espèce et sa concentration : le spectre se met à jour.</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Espèce dissoute
        <select value={ex.esp} onChange={e => { const k = e.target.value; setEx(s => ({ ...s, esp: k, c: M.ESPECES[k].cDefaut, lam: lmax(k), comp: s.comp === k ? '' : s.comp })); }} style={{ ...menu, marginTop: 2 }}>
          {M.ORDRE.map(k => <option key={k} value={k}>{M.ESPECES[k].nom}</option>)}
        </select>
      </label>
      <Curseur nom="Concentration c" valeur={ex.c} onChange={x => setEx(s => ({ ...s, c: x }))} min={0} max={sp.cMax} pas={sp.pas} unite={sp.unite} decimales={sp.pas < 1 ? 1 : 0} couleur="#15803d"/>
      <Section titre={`Cuve et longueur d’onde : cuve ${nbf(ex.l, 2)} cm · λ = ${ex.lam} nm`} ouvert={ouv.reglages} onBascule={() => setOuv(o => ({ ...o, reglages: !o.reglages }))}>
        <div style={aide}>La longueur de la cuve multiplie A ; le curseur de longueur d’onde déplace la lecture sur le spectre (et fixe la longueur d’onde du graphique A = f(c)).</div>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Longueur de la cuve
          <select value={ex.l} onChange={e => setEx(s => ({ ...s, l: Number(e.target.value) }))} style={{ ...menu, marginTop: 2 }}>
            {M.L_MENU.map(v => <option key={v} value={v}>{nbf(v, 2)} cm</option>)}
          </select>
        </label>
        <Curseur nom="Longueur d’onde λ" valeur={ex.lam} onChange={x => setEx(s => ({ ...s, lam: x }))} min={M.LAMBDA_MIN} max={M.LAMBDA_MAX} pas={1} unite="nm" couleur={ORANGE_GUIDE}/>
        <button onClick={() => setEx(s => ({ ...s, lam: lmax(s.esp) }))} style={styleBouton(false, ORANGE_GUIDE)}>Aller à λ{indicesProfond('_max')} tabulée</button>
      </Section>
      <Section titre={`Superposer un second spectre : ${ex.comp ? M.ESPECES[ex.comp].court : 'aucun'}`} ouvert={ouv.superposer} onBascule={() => setOuv(o => ({ ...o, superposer: !o.superposer }))}>
        <div style={aide}>Compare deux espèces : les spectres sont normalisés (ramenés à 1 au maximum) pour comparer les positions des maxima.</div>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2 }}>Second spectre
          <select value={ex.comp} onChange={e => setEx(s => ({ ...s, comp: e.target.value }))} style={{ ...menu, marginTop: 2 }}>
            <option value="">Aucun</option>
            {M.ORDRE.filter(k => k !== ex.esp).map(k => <option key={k} value={k}>{M.ESPECES[k].nom}</option>)}
          </select>
        </label>
      </Section>
    </div>);
  const grapheEx = enExplore && (
    <div style={styleBoite}>
      <Section titre={`Graphique A = f(c) à ${ex.lam} nm : droite et domaine de validité`} ouvert={ouv.graphe} onBascule={() => setOuv(o => ({ ...o, graphe: !o.graphe }))}>
        <div style={aide}>L’absorbance à la longueur d’onde choisie en fonction de c, pour la cuve choisie. La zone hachurée repère la limite du domaine de validité.</div>
        <GrapheEtalonnage esp={ex.esp} lam={ex.lam} l={ex.l} cUnite={ex.c} cMaxUnite={sp.cMax} zone aria={`Graphique de l'absorbance en fonction de la concentration pour ${sp.nom} à ${ex.lam} nanomètres : droite en tirets, absorbance mesurée en trait plein, zone limite hachurée.`}/>
        <div style={{ ...aide, marginTop: 6 }}>Tirets : droite A = ε × l × c (pente ε × l). Trait plein : absorbance mesurée. Point orange : la concentration réglée.</div>
      </Section>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Pour la tartrazine, doublez la concentration : que deviennent la hauteur du spectre et la position de λ_max ?</li>
        <li>Passez à la cuve de 2,00 cm à concentration fixée : que devient A ? Comparez avec un doublement de c.</li>
        <li>Augmentez c jusqu’à ce que A théorique dépasse 2 : que devient le sommet du spectre ? À partir de quand le trait plein quitte-t-il la droite du graphique ?</li>
        <li>Placez la longueur d’onde loin de λ_max et regardez la pente du graphique A = f(c) : pourquoi se place-t-on à λ_max pour doser ?</li>
        <li>Choisissez le paracétamol : la solution est incolore, mais où est son maximum ? Superposez-le à la caféine.</li>
        <li>Superposez la tartrazine et le jaune orangé S : deux solutions de couleurs voisines se distinguent-elles par leur spectre ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Spectre A = f(λ) : empreinte d’une espèce ; λ_max la caractérise (à comparer aux valeurs tabulées)</li>
          <li>Couleur vue = complémentaire de la couleur absorbée ; une espèce incolore peut absorber dans l’UV</li>
          <li>Beer-Lambert : A = ε × l × c, c = frac(A|ε × l) ; on travaille à λ_max</li>
          <li>Domaine de validité : solution diluée, lumière monochromatique, pas de réaction avec le solvant, A ≲ 1,5 à 2</li>
          <li>Si A est trop grande : diluer d’un facteur F connu, mesurer, puis c = F × c′</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .uv-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .uv-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .uv-col { display: flex; flex-direction: column; gap: 12px; }
        .uv-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        .uv-rang { display: grid; gap: 12px; grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .uv-l1.cote .uv-carte { order: 2; } .uv-l1.cote .uv-main { order: 1; }
          .uv-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .uv-ex > * { grid-column: 1; } .uv-ex > .uv-ctrl { grid-column: 2; grid-row: 1 / span 4; } }
        @media (max-width: 900px) { .uv-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .uv-in { animation: uv-fondu 0.35s ease-out; } @keyframes uv-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Spectroscopie UV-visible : identifier une espèce, puis la doser</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Le spectre d’absorption d’une espèce est son <strong>empreinte</strong> : λ<sub>max</sub> permet de l’identifier ; la loi de <strong>Beer-Lambert</strong> permet de la doser, dans son domaine de validité.</div>
      {!enExplore && <div className="uv-l1 cote">
        {enGuide ? <div className="uv-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="uv-carte">{panneauHypo}</div> : null}
        <div className="uv-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'identification' ? suiviI : suiviC}/></div>}
          <div className="uv-col">
            {(!enDefi || defi) && !q10 && <div className="uv-in">{boxScene}</div>}
            {boxCurseur && <div className="uv-in">{boxCurseur}</div>}
            {enDefi && defi && defi.type === 'identification' && <div className="uv-in">{tableValeurs(defi.candidates, false, true)}</div>}
            {tableGuide && <div className="uv-in">{tableGuide}</div>}
            {boxGraphe && <div className="uv-in">{boxGraphe}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="uv-ex">
        <div>{boxScene}</div>
        <div className="uv-ctrl">{reglagesEx}</div>
        <div>{mesuresEx}</div>
        <div>{grapheEx}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
