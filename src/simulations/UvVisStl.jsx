import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, Curseur, indicesProfond , Frac } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./uvVisStlModele";
import { QCM_PARCOURS as Q } from "./uvVisQcm";
import { SpectreUV, GrapheEtalonnage, CuveCouleur, SvgCouleurCarte, SvgEmpreinteCarte, SvgBeerCarte, SvgValiditeCarte } from "./uvVisSchemas";
import { GrapheDroite, SvgEnergieCarte, SvgEtalonnageCarte } from "./uvVisStlSchemas";

const SIM_ID = 307, CLE_GUIDE = 'uvvisstl-guide-v1';
declarerDefis(SIM_ID, [['identification', 'Identifier une espèce à partir de son spectre'], ['etalonnage', 'Doser avec une droite d’étalonnage']]);

// ====================================================
// SIM 307 — SPECTROSCOPIE UV-VISIBLE EN TERMINALE STL (SPCL, « Spectroscopies UV-visible, IR et RMN »).
//  Une idée : un photon absorbé a une énergie E = h c / λ ; le spectre est l'empreinte d'une espèce (λmax, valeurs tabulées) ; on dose avec une droite
//  d'étalonnage tracée à partir de solutions étalons (A = k × c), en restant dans le domaine de validité (dilution si A est trop grande).
//  Capacités visées (jamais affichées à l'élève) : interpréter l'interaction lumière-matière avec la relation entre l'énergie d'un photon et la longueur d'onde ;
//  identifier une espèce avec un spectre UV-visible et des données ; déterminer une concentration avec une droite d'étalonnage (mise en œuvre au tableur).
//  Hors périmètre : IR (sim 308), RMN (sim 306), mélange d'espèces absorbantes. Modèle : uvVisStlModele.js (réutilise uvVisModele.js de la sim 169, sans le modifier).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const nbs = (v, cs = 2) => { if (!v) return '0'; const e = Math.floor(Math.log10(Math.abs(v))); return Number(v).toFixed(Math.max(0, cs - 1 - e)).replace('.', ','); };
const BLEU = '#0369a1';
const IDS = ['spectre', 'couleur', 'lambdamax', 'energie', 'identifier', 'lambdaTravail', 'etalons', 'droite', 'limite', 'quefaire', 'dilution', 'bilan'];

// scène de chaque étape du parcours : espèce, concentration (µmol/L), échelle verticale, ce qui est visible (le spectre disparaît pendant l'étalonnage)
const U = 'tartrazine';
const CAND4 = ['tartrazine', 'jaune', 'cochenille', 'bleu'];
const SCENE = [
  { esp: U, c: 20, yMax: 1 }, { esp: U, c: 20, yMax: 1 }, { esp: U, c: 20, yMax: 1 }, { esp: U, c: 20, yMax: 1 }, { esp: U, c: 20, yMax: 1 }, { esp: U, c: 20, yMax: 1 },
  { esp: U, c: 20, yMax: 3, curseurC: 120 }, { esp: U, c: 20, yMax: 3, curseurC: 120 }, { esp: U, c: 20, yMax: 3, curseurC: 120 }, { esp: U, c: 20, yMax: 3, curseurC: 120 },
  { esp: 'bleu', c: 6, yMax: 1, inconnue: true }, { esp: U, c: 20, yMax: 3, curseurC: 120 },
];

// ---------- formules ----------
const FBeer = <Formule><mi>A</mi><mo>=</mo><mi>ε</mi><mo>×</mo><mi>l</mi><mo>×</mo><mi>c</mi></Formule>;
const FE = <Formule><mi>E</mi><mo>=</mo><mfrac><mrow><mi>h</mi><mo>×</mo><mi>c</mi></mrow><mi>λ</mi></mfrac></Formule>;
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const U_EPS = 'L·mol⁻¹·cm⁻¹';

const eps = k => M.ESPECES[k].eps, epsT = k => M.epsTexte(M.ESPECES[k].eps), lmax = k => M.ESPECES[k].lambdaMax;
// valeurs du parcours (calculées avec les absorbances AFFICHÉES à 3 décimales)
const G = M.GUIDE, E0 = M.energieEv(lmax(U)), EJ0 = M.energieJ(lmax(U));
const KAJ = Number(G.kAj.toPrecision(3)), C7 = G.Ax / KAJ, CB = G.FB * G.AB / G.kB, CBp = G.AB / G.kB;      // µmol/L
const sci = (x, d = 2) => { const e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e); return `${nbf(m, d)}×10${[...String(e)].map(ch => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }[ch])).join('')}`; };

export function SimulationUvVisibleStl() {
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
    { id: 'energie', titre: 'Énergie des photons absorbés', focus: ['scene', 'curseur'],
      texte: <>La tartrazine absorbe surtout vers λ_max ≈ {lmax(U)}{NB}nm. Une radiation de longueur d’onde λ est faite de <strong>photons</strong> : chacun transporte l’énergie {FE} où <strong>h</strong> = 6,63×10⁻³⁴{NB}J·s (constante de Planck), <strong>c</strong> = 3,00×10⁸{NB}m/s (célérité de la lumière dans le vide), λ en mètres et E en joules. En chimie on exprime souvent E en <strong>électronvolts</strong> : 1{NB}eV = 1,60×10⁻¹⁹{NB}J.</>,
      tache: { type: 'num', q: `Quelle est l’énergie E d’un photon absorbé au maximum (λ_max = ${lmax(U)} nm), en eV (3 chiffres significatifs) ?`, unite: 'eV', vrai: E0, tol: 0.03, affiche: v => nbs(v, 3), cs: 3, carnet: 'Énergie d’un photon absorbé',
        calcul: () => [`λ = ${lmax(U)} nm = ${nbf(lmax(U) / 100, 2)}×10⁻⁷ m.`, `E = frac(h × c|λ) = frac(6,63×10⁻³⁴ × 3,00×10⁸|${nbf(lmax(U) / 100, 2)}×10⁻⁷) = ${sci(EJ0, 2)} J.`, `E = frac(${sci(EJ0, 2)}|1,60×10⁻¹⁹) = ${nbs(E0, 3)} eV.`],
        pieges: [[EJ0 / 1e-19, 'Vous avez donné E en 10⁻¹⁹ J : divisez par 1,60×10⁻¹⁹ J pour obtenir des électronvolts.'], [E0 * 1e9, 'Vous n’avez pas converti λ en mètres : 1 nm = 10⁻⁹ m.']],
        expl: `E = frac(h × c|λ) = ${sci(EJ0, 2)} J = ${nbs(E0, 3)} eV.`, indice: 'Convertissez d’abord λ en mètres (1 nm = 10⁻⁹ m), calculez E en joules avec E = frac(h × c|λ), puis divisez par 1,60×10⁻¹⁹ pour passer aux électronvolts.' } },
    { id: 'identifier', titre: 'Identifier une espèce avec des valeurs tabulées', focus: ['scene', 'table'],
      retenirTitre: 'À RETENIR : L’ÉNERGIE D’UN PHOTON',
      retenir: <>
        <SvgEnergieCarte/>
        <ul style={ULS}>
          <li>Un photon de longueur d’onde λ a l’énergie {FE} (λ en m, E en J) ; 1{NB}eV = 1,60×10⁻¹⁹{NB}J. Plus λ est courte, plus le photon est énergétique : UV &gt; visible &gt; IR.</li>
          <li>Exemple de la simulation : un photon de {lmax(U)}{NB}nm a une énergie de {nbs(E0, 3)}{NB}eV ; une solution absorbe les photons dont l’énergie correspond à une transition de ses électrons.</li>
          <li>Moyen de s’en souvenir : <strong>« petite longueur d’onde, grande énergie »</strong>. Idée fausse : « le rouge est plus énergétique que le violet ». Vrai : c’est le contraire, le violet a la plus petite λ du visible.</li>
        </ul></>,
      texte: <>Les colorants autorisés dans cette boisson figurent dans le tableau, avec leur valeur tabulée de λ_max (valeurs typiques, ordres de grandeur issus de tables : elles varient un peu avec le solvant et la source). Une espèce est identifiée quand la valeur lue sur le spectre est proche de la valeur tabulée de l’une des espèces candidates. Vous avez lu λ_max ≈ {lmax(U)}{NB}nm à une vingtaine de nanomètres près.</>,
      tache: { type: 'qcm', q: 'Quel colorant contient la boisson ?', ...Q.identifier,
        expl: `λ_max ≈ ${lmax(U)} nm est celle de la tartrazine (${lmax('tartrazine')} nm), pas celle du jaune orangé S (${lmax('jaune')} nm), du rouge cochenille A (${lmax('cochenille')} nm) ou du bleu patenté V (${lmax('bleu')} nm). La couleur de la boisson limite le choix, mais c’est λ_max qui tranche.`,
        indice: 'Comparez la valeur lue de λ_max à celles du tableau : la bonne espèce est celle dont la valeur tabulée est la plus proche.' } },
    { id: 'lambdaTravail', titre: 'Choisir la longueur d’onde pour doser', focus: ['scene', 'curseur'],
      retenirTitre: 'À RETENIR : LE SPECTRE, EMPREINTE D’UNE ESPÈCE',
      retenir: <>
        <SvgEmpreinteCarte/>
        <ul style={ULS}>
          <li>Le spectre A = f(λ) est propre à chaque espèce ; la longueur d’onde <strong>λ_max</strong> du maximum la caractérise. Pour identifier une espèce, on lit λ_max puis on la compare aux valeurs tabulées des espèces candidates.</li>
          <li>Exemple de la simulation : tartrazine (jaune) et jaune orangé S (orange) ont des λ_max différentes ({lmax('tartrazine')}{NB}nm et {lmax('jaune')}{NB}nm).</li>
          <li>Moyen de s’en souvenir : <strong>« λ_max = carte d’identité de l’espèce »</strong>. Idée fausse : « la couleur suffit à identifier ». Vrai : deux espèces de couleurs voisines se distinguent par leur λ_max.</li>
        </ul></>,
      texte: <>On revient à la boisson jaune : la tartrazine est identifiée. Pour déterminer sa concentration, on mesure A à une longueur d’onde fixée. Déplacez le curseur pour comparer l’absorbance au sommet de la courbe et plus loin, par exemple vers 550{NB}nm.</>,
      tache: { type: 'qcm', q: 'À quelle longueur d’onde se placer pour doser avec la meilleure sensibilité (la plus grande variation de A pour une même variation de c) ?', ...Q.lambdaTravail,
        expl: 'Pour une même variation de concentration, A varie d’autant plus que ε est grand ; or ε est maximal à λ_max : on se place au maximum d’absorption. De plus la courbe y est plate : une petite erreur de réglage de la longueur d’onde change peu A.',
        indice: 'La sensibilité est la variation de A pour une variation donnée de c : où la solution absorbe-t-elle le plus de lumière ? Comparez A au sommet et vers 550 nm avec le curseur.' } },
    { id: 'etalons', titre: 'Les solutions étalons', focus: ['table'],
      retenirTitre: 'À RETENIR : LA LOI DE BEER-LAMBERT',
      retenir: <>
        <SvgBeerCarte/>
        <ul style={ULS}>
          <li>Loi de Beer-Lambert : {FBeer}A sans unité ; ε en {U_EPS} ; l en cm ; c en mol/L. On en tire c = <Frac haut={<>A</>} bas={<>ε × l</>} />.</li>
          <li>On travaille à <strong>λ_max</strong> : A y est la plus grande, donc la mesure est la plus sensible. ε ne dépend que de l’espèce et de λ, pas de c.</li>
          <li>Moyen de s’en souvenir : <strong>« A proportionnelle à c : si c double, A double »</strong>. Idée fausse : « ε change quand on dilue ». Vrai : ε est la même ; c’est A qui change.</li>
        </ul></>,
      texte: <>Pour doser la tartrazine d’un sirop, on prépare cinq <strong>solutions étalons</strong> de concentrations connues et on mesure leur absorbance à λ_max = {lmax(U)}{NB}nm, dans la même cuve de 1,00{NB}cm (tableau ci-dessous). D’après la loi de Beer-Lambert, A est proportionnelle à c : A = k × c, et la droite passe par l’origine. Calculez le <strong>coefficient directeur k</strong> avec le premier et le dernier étalon.</>,
      tache: { type: 'num', q: 'Quel est le coefficient directeur k de la droite d’étalonnage, en L/µmol (2 chiffres significatifs) ?', unite: 'L/µmol', vrai: G.k, tol: 0.06, affiche: v => nbs(v, 2), cs: 2, carnet: 'Coefficient directeur k',
        calcul: () => [`k = frac(A₅ − A₁|c₅ − c₁) = frac(${nbf(G.pts[4].A, 3)} − ${nbf(G.pts[0].A, 3)}|${G.cs[4]} − ${G.cs[0]}) = ${nbs(G.k, 3)} L/µmol.`, 'A n’a pas d’unité ; c est en µmol/L : k s’exprime en L/µmol.'],
        pieges: [[1 / G.k, 'Vous avez calculé frac(c|A) : le coefficient directeur est la variation de A divisée par la variation de c.'], [G.pts[4].A - G.pts[0].A, `Divisez la variation d’absorbance par la variation de concentration (${G.cs[4]} − ${G.cs[0]} = ${G.cs[4] - G.cs[0]} µmol/L).`]],
        expl: `k = frac(${nbf(G.pts[4].A, 3)} − ${nbf(G.pts[0].A, 3)}|${G.cs[4]} − ${G.cs[0]}) = ${nbs(G.k, 3)} L/µmol.`, indice: 'k = variation de A divisée par la variation de c, entre le premier étalon (8 µmol/L) et le dernier (40 µmol/L) : relevez leurs absorbances dans le tableau.' } },
    { id: 'droite', titre: 'Lire une concentration sur la droite', focus: ['graphe'],
      texte: <>Un tableur trace les cinq points (A en fonction de c) et la droite passant par l’origine : son équation est <strong>A = {nbs(KAJ, 3)} × c</strong> (c en µmol/L). Un sirop jaune, non dilué, est mesuré dans les mêmes conditions : <strong>A = {nbf(G.Ax, 3)}</strong>. Le point orange et les pointillés montrent comment on lit c sur la droite ; on peut aussi le calculer.</>,
      tache: { type: 'num', q: 'Quelle est la concentration c de la tartrazine dans le sirop, en µmol/L (2 chiffres significatifs) ?', unite: 'µmol/L', vrai: C7, tol: 0.08, affiche: v => nbs(v, 2), cs: 2, carnet: 'Concentration c du sirop',
        calcul: () => [`A = k × c, donc c = frac(A|k) = frac(${nbf(G.Ax, 3)}|${nbs(KAJ, 3)}) = ${nbs(C7, 2)} µmol/L.`, 'La valeur de A est dans la gamme des étalons (de 0,2 à 1,1 environ) : on peut utiliser la droite.'],
        pieges: [[G.Ax * KAJ, 'Il faut diviser A par k : c = frac(A|k).'], [C7 * 1e-6, 'Vous avez donné c en mol/L : l’énoncé demande des µmol/L (1 µmol/L = 10⁻⁶ mol/L).']],
        expl: `c = frac(A|k) = frac(${nbf(G.Ax, 3)}|${nbs(KAJ, 3)}) = ${nbs(C7, 2)} µmol/L.`, indice: 'A = k × c : isolez c. Vous pouvez aussi lire sur le graphique l’abscisse du point orange (ordonnée A), mais le calcul est plus précis.' } },
    { id: 'limite', titre: 'Les limites de la loi de Beer-Lambert', focus: ['graphe'],
      retenirTitre: 'À RETENIR : LA DROITE D’ÉTALONNAGE',
      retenir: <>
        <SvgEtalonnageCarte/>
        <ul style={ULS}>
          <li>On mesure A de plusieurs solutions étalons (c connues) à λ_max : les points sont alignés avec l’origine, A = k × c. Pour un échantillon, on mesure A, puis <strong>c = <Frac haut={<>A</>} bas={<>k</>} /></strong> (ou lecture sur la droite).</li>
          <li>Exemple de la simulation : k = {nbs(KAJ, 3)} L/µmol ; un sirop d’absorbance {nbf(G.Ax, 3)} a la concentration trouvée à l’étape précédente.</li>
          <li>Moyen de s’en souvenir : <strong>« on mesure A, on lit c sur la droite »</strong>. Idée fausse : « il suffit d’un seul étalon ». Vrai : plusieurs étalons permettent de vérifier l’alignement et d’encadrer la valeur de l’échantillon.</li>
        </ul></>,
      texte: <>Un graphique apparaît : absorbance de la tartrazine à λ_max = {lmax(U)}{NB}nm en fonction de la concentration c. Les tirets prolongent la droite A = ε × l × c ; le trait plein est l’absorbance que mesure l’appareil. Faites varier c (de 0 à 120{NB}µmol/L) et observez les deux courbes.</>,
      tache: { type: 'qcm', q: 'À partir de quelle absorbance environ le trait plein s’écarte-t-il nettement de la droite ?', ...Q.limite,
        expl: 'Jusqu’à A voisine de 1,5 à 2, la mesure suit la droite : A est proportionnelle à c. Au-delà, la courbe s’aplatit : l’appareil sous-estime A (dans cette simulation, à cause d’un peu de lumière parasite, modèle simplifié ; en pratique, une solution trop concentrée produit aussi cet écart). La loi de Beer-Lambert n’est plus utilisable.',
        indice: 'Faites monter c progressivement et repérez la valeur de A (axe vertical) à laquelle le trait plein quitte les tirets de façon visible.' } },
    { id: 'quefaire', titre: 'Que faire quand A est trop grande ?', focus: ['graphe'],
      texte: <>Un élève mesure, pour une boisson très colorée contenant de la tartrazine, A = 2,4 à λ_max = {lmax(U)}{NB}nm, et lit sa concentration sur la droite d’étalonnage prolongée (le dernier étalon avait une absorbance d’environ 1,1). Sa mesure est le point orange du graphique ; la zone hachurée repère maintenant la limite de validité.</>,
      tache: { type: 'qcm', q: 'Que doit faire cet élève pour déterminer la concentration ?', ...Q.quefaire,
        expl: 'A = 2,4 est hors du domaine de validité (A ≲ 1,5 à 2) : la concentration calculée serait trop faible. Il faut diluer la solution d’un facteur F connu, mesurer A de la solution diluée (A dans le domaine de validité), calculer c′, puis c = F × c′. Une cuve plus longue ferait encore augmenter A.',
        indice: 'Il faut ramener A dans le domaine de validité. Diluer fait-il augmenter ou diminuer A ? Que faut-il faire ensuite pour retrouver la solution de départ ?' } },
    { id: 'dilution', titre: 'Dosage avec dilution', focus: ['scene', 'curseur'],
      texte: <>Une boisson bleue très colorée contient du bleu patenté V. Sa droite d’étalonnage, tracée à λ_max = {lmax(G.espB)}{NB}nm dans une cuve de 1,00{NB}cm, a pour équation <strong>A = {nbs(G.kB, 3)} × c</strong> (c en µmol/L). On dilue la boisson {G.FB}{NB}fois (1 volume de boisson et {G.FB - 1} volumes d’eau), puis on mesure le spectre de la solution diluée. La concentration est inconnue : placez le curseur à λ_max (bouton) et lisez A.</>,
      tache: { type: 'num', q: 'Concentration c de la boisson initiale, en µmol/L (2 chiffres significatifs)', unite: 'µmol/L', vrai: CB, tol: 0.08, affiche: v => nbs(v, 2), cs: 2, carnet: 'Concentration c de la boisson',
        calcul: () => [`À λ_max = ${lmax(G.espB)} nm : A = ${nbf(G.AB, 3)} (valeur lue), dans la gamme des étalons.`, `c′ = frac(A|k) = frac(${nbf(G.AB, 3)}|${nbs(G.kB, 3)}) = ${nbs(CBp, 3)} µmol/L (solution diluée).`, `La boisson est ${G.FB} fois plus concentrée : c = ${G.FB} × c′ = ${nbs(CB, 2)} µmol/L.`],
        pieges: [[CBp, 'Vous avez donné la concentration de la solution diluée : multipliez par le facteur de dilution ' + G.FB + '.'], [CB * 1e-6, 'Vous avez donné c en mol/L : l’énoncé demande des µmol/L.'], [CBp / G.FB, 'Il faut multiplier par ' + G.FB + ' (pas diviser) : la boisson initiale est plus concentrée que la solution diluée.']],
        expl: `c′ = frac(A|k) = ${nbs(CBp, 3)} µmol/L ; c = ${G.FB} × c′ = ${nbs(CB, 2)} µmol/L.`,
        indice: 'D’abord c′ de la solution diluée avec c′ = frac(A|k), puis la boisson initiale est ' + G.FB + ' fois plus concentrée : c = ' + G.FB + ' × c′.' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : DOMAINE DE VALIDITÉ',
      retenir: <>
        <SvgValiditeCarte/>
        <ul style={ULS}>
          <li>La loi {FBeer}n’est valable que : pour une <strong>solution diluée</strong>, avec une <strong>lumière monochromatique</strong>, sans réaction du soluté avec le solvant, et pour <strong>A ≲ 1,5 à 2</strong>.</li>
          <li>Exemple de la simulation : au-delà de A ≈ 2, l’absorbance mesurée s’écarte de la droite ; on dilue d’un facteur connu F, on mesure, puis c = F × c′.</li>
          <li>Moyen de s’en souvenir : <strong>« A ≲ 2, sinon on dilue »</strong>. Idée fausse : « la droite A = ε × l × c vaut pour toutes les concentrations ». Vrai : elle n’est utilisable que dans son domaine.</li>
        </ul></>,
      texte: <>Vous savez relier l’énergie d’un photon à la longueur d’onde, lire un spectre UV-visible, identifier une espèce avec λ_max et des valeurs tabulées, établir une droite d’étalonnage et l’utiliser pour doser (avec une dilution si A est trop grande), et citer les limites de cette méthode. Passez à l’exploration (autres espèces, cuves, longueurs d’onde, spectres superposés) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'identification') { const t = M.tirageDefiIdentification(); setDefi({ type, ...t, choix: '', verifie: false }); }
    else { const t = M.tirageDefiEtalonnage(); setDefi({ type, ...t, rep: '', verifie: false, corr: false }); }
    setLamD(300);
  };
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'identification') { const ok = defi.choix === defi.inconnue; setDefi(d => ({ ...d, verifie: true, ok, essais: ok ? d.essais : (d.essais || 0) + 1 })); noterI(ok); }
    else { const x = lireNombre(defi.rep), ok = isFinite(x) && Math.abs(x - defi.attendue) <= 0.08 * defi.attendue; setDefi(d => ({ ...d, verifie: true, ok, corr: false, essais: ok ? d.essais : (d.essais || 0) + 1 })); noterC(ok); }
  };
  // retour diagnostique du défi « étalonnage » : jamais une phrase générique seule
  const diagEtalonnage = d => {
    const x = lireNombre(d.rep), att = d.attendue;
    if (d.rep.trim() === '' || !isFinite(x)) return 'Ce n’est pas un nombre : écrivez la concentration en chiffres (la virgule est acceptée).';
    if (d.F > 1 && Math.abs(x - att / d.F) <= 0.1 * att / d.F) return `Vous avez donné la concentration de la solution diluée : l’échantillon a été dilué ${d.F} fois, multipliez par ${d.F}.`;
    if (d.F > 1 && Math.abs(x - att * d.F) <= 0.1 * att * d.F) return `Vous avez multiplié deux fois par ${d.F} ou divisé au lieu de multiplier : la solution initiale est ${d.F} fois plus concentrée que la solution mesurée.`;
    if (Math.abs(x - d.Ax) <= 0.05 * d.Ax) return 'Vous avez recopié l’absorbance. Calculez d’abord k = variation de A divisée par la variation de c, puis c = frac(A|k).';
    if (Math.abs(x - d.Ax * d.k * d.F) <= 0.1 * d.Ax * d.k * d.F) return 'Il faut diviser A par k (c = frac(A|k)) et non la multiplier.';
    if (Math.abs(x * 1000 - att) <= 0.1 * att || Math.abs(x / 1000 - att) <= 0.1 * att) return 'Vérifiez l’unité : les concentrations du tableau sont en µmol/L, la réponse aussi.';
    return x < att ? 'Votre valeur est trop petite : refaites k avec le premier et le dernier étalon (k = frac(ΔA|Δc)), puis c = frac(A|k), sans oublier la dilution.' : 'Votre valeur est trop grande : refaites k avec le premier et le dernier étalon (k = frac(ΔA|Δc)), puis c = frac(A|k), sans oublier la dilution.';
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

  const tableEtalons = (pts, unite, ouvert, cle = 'g') => (
    <details open={ouvert} key={`${cle}${ouvert}`} style={{ ...styleBoite, ...cadre('table') }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 15, color: KIT.txt }}>Solutions étalons : absorbance à λ{indicesProfond('_max')}</summary>
      <div style={{ overflowX: 'auto', marginTop: 6 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 14, width: '100%', color: KIT.txt }}>
          <thead><tr style={{ textAlign: 'left', borderBottom: `2px solid ${KIT.bord}` }}><th style={{ padding: '4px 6px' }}>Étalon</th><th style={{ padding: '4px 6px' }}>c ({unite})</th><th style={{ padding: '4px 6px' }}>A</th></tr></thead>
          <tbody>{pts.map((p, i) => <tr key={i} style={{ borderBottom: `1px dashed ${KIT.bord}` }}><td style={{ padding: '4px 6px' }}>n° {i + 1}</td><td style={{ padding: '4px 6px', fontFamily: 'monospace', fontWeight: 700 }}>{nbs(p.c, 3)}</td><td style={{ padding: '4px 6px', fontFamily: 'monospace', fontWeight: 700 }}>{nbf(p.A, 3)}</td></tr>)}</tbody>
        </table>
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Mêmes conditions que l’échantillon : même cuve (1,00 cm), même longueur d’onde (λ{indicesProfond('_max')}).</div>
    </details>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['identification', 'Identifier une espèce'], ['etalonnage', 'Doser avec une droite d’étalonnage']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, BLEU)}>{l}</button>)}
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
        <div style={{ ...lbl, marginBottom: 8 }}>Vous dosez {M.ESPECES[defi.esp].de} <strong>{M.ESPECES[defi.esp].court}</strong> à λ_max = <strong>{lmax(defi.esp)}{NB}nm</strong> avec cinq solutions étalons (tableau et graphique ci-dessous). L’échantillon{defi.F > 1 ? <> a été <strong>dilué {defi.F} fois</strong> avant la mesure ; sa solution diluée</> : <></>} a pour absorbance <strong>A = {nbf(defi.Ax, 3)}</strong>. Quelle est la concentration de {defi.F > 1 ? 'l’échantillon initial' : 'l’échantillon'}, en µmol/L (2 chiffres significatifs) ?</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>c =</span>
          <input value={defi.rep} aria-label="c" onKeyDown={e => e.key === 'Enter' && document.getElementById('uv-verif')?.click()} onChange={e => setDefi(d => ({ ...d, rep: e.target.value, verifie: false, corr: false }))} inputMode="decimal"
            style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>µmol/L</span>
        </div>
        <IndiceDefi cache={false}>Calculez le coefficient directeur k = variation de A divisée par la variation de c entre le premier et le dernier étalon, puis c = <Frac haut={<>A</>} bas={<>k</>} />, puis multipliez par le facteur de dilution s’il y en a un.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button id="uv-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        {defi.type === 'etalonnage' && defi.verifie && !defi.ok && <button onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={styleBouton(false, ORANGE_GUIDE)}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button>}
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'identification'
          ? (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.ok || (defi.essais || 0) >= 2 ? `Le maximum est à ${lmax(defi.inconnue)} nm : c’est la valeur tabulée de l’espèce « ${M.ESPECES[defi.inconnue].nom} ».` : 'Lisez λ_max avec le curseur et comparez-la aux valeurs du tableau (l’indice peut vous aider).')
          : (defi.ok ? `✓ Correct : c ≈ ${nbs(defi.attendue, 2)} µmol/L.` : `✗ ${diagEtalonnage(defi)}`)}
      </div>}
      {defi.type === 'etalonnage' && defi.corr && !defi.ok && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        <>
          <div>k = <Frac haut={<>A₅ − A₁</>} bas={<>c₅ − c₁</>} /> = <Frac haut={<>{nbf(defi.pts[4].A, 3)} − {nbf(defi.pts[0].A, 3)}</>} bas={<>{nbs(defi.pts[4].c, 3)} − {nbs(defi.pts[0].c, 3)}</>} /> ≈ {nbs(defi.kDeuxPoints, 3)} L/µmol (le tableur ajusté donne {nbs(defi.k, 3)}).</div>
          <div>c{defi.F > 1 ? '′' : ''} = frac(A|k) = frac({nbf(defi.Ax, 3)}|{nbs(defi.k, 3)}) = {nbs(defi.Ax / defi.k, 3)} µmol/L{defi.F > 1 ? ` ; c = ${defi.F} × c′ = ${nbs(defi.attendue, 3)} µmol/L` : ''}.</div>
          <div>Valeur attendue : environ <strong>{nbs(defi.attendue, 2)} µmol/L</strong> (à 8 % près).</div></>
      </div>}
    </div>);
  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Une seule espèce absorbante</strong>, dissoute dans l’eau (solvant transparent) ; pas de mélange de deux espèces à spectres qui se recouvrent.</li>
      <li><strong>Cuve de 1,00 cm</strong>, température de 25 °C ; en exploration, la longueur de cuve est un menu (0,50 ; 1,00 ou 2,00 cm).</li>
      <li><strong>Solutions étalons</strong> préparées et mesurées dans les mêmes conditions que l’échantillon (même cuve, même longueur d’onde λ_max) ; droite d’étalonnage passant par l’origine, A = k × c. Les absorbances des étalons sont affichées à 3 décimales, avec une petite dispersion de mesure (environ 1 %) dans le défi.</li>
      <li><strong>Loi de Beer-Lambert</strong> A = ε × l × c, avec ε constante (indépendante de c), <strong>lumière monochromatique</strong>, solution <strong>diluée</strong>, soluté sans réaction avec le solvant : domaine de validité A ≲ 1,5 à 2 (les étalons restent sous A ≈ 1,1).</li>
      <li><strong>Écart à la linéarité au-delà de ce domaine</strong> : il est simulé par un modèle simple (0,3 % de lumière parasite atteint le détecteur). C’est un modèle de la simulation, pas une loi du programme.</li>
      <li><strong>Énergie d’un photon</strong> : E = <Frac haut={<>h × c</>} bas={<>λ</>} /> avec h = 6,63×10⁻³⁴ J·s, c = 3,00×10⁸ m/s et 1 eV = 1,60×10⁻¹⁹ J (valeurs arrondies, imposées dans les énoncés).</li>
      <li><strong>Valeurs tabulées typiques</strong> : λ_max et ε sont des ordres de grandeur de tables ; ils varient un peu avec le solvant et le pH. Les spectres sont modélisés par des bandes gaussiennes : leur allure est réaliste, pas exacte.</li>
      <li><strong>Résultats</strong> demandés à 2 ou 3 chiffres significatifs, avec une marge de 3 à 8 % selon la question (lecture, arrondis, ajustement du tableur).</li>
      <li><strong>Hors périmètre</strong> : mélange de plusieurs espèces absorbantes ; spectroscopie IR (simulation voisine) et RMN.</li>
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
  else if (dd) P = dd.type === 'identification' ? { esp: dd.inconnue, cMolL: dd.c, l: M.L_CUVE, yMax: 1.5, curs: true, lam: lamD, setLam: setLamD } : { esp: dd.esp, cMolL: 0, l: M.L_CUVE, yMax: 1.5, curs: false, lam: lamD, setLam: setLamD };
  else P = { esp: ex.esp, cMolL: M.enMolL(ex.esp, ex.c), l: ex.l, yMax: M.A_MAX_AFFICHE, curs: true, lam: ex.lam, setLam: x => setEx(s => ({ ...s, lam: x })) };
  const sp = M.ESPECES[P.esp];
  const Alam = M.absorbance(P.esp, P.lam, P.cMolL, P.l), Ath = M.aTheorique(P.esp, P.lam, P.cMolL, P.l);
  const anonyme = enDefi || (enGuide && (SG.inconnue || idx <= 4));
  const ariaScene = `Spectre d'absorption A en fonction de la longueur d'onde en nanomètres, de 220 à 750 nm. ${anonyme ? 'Solution étudiée.' : sp.nom + '.'} ${P.curs ? `Le curseur est à ${P.lam} nm, où l'absorbance vaut ${nbf(Alam, 3)}.` : ''}`;
  const compare = enExplore && ex.comp && ex.comp !== ex.esp ? ex.comp : null;

  const boutonLmax = enGuide && SG.inconnue;
  const boxScene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enExplore && <div style={aide}>Le spectre de la solution choisie : absorbance A en fonction de la longueur d’onde. Le curseur orange lit A à la longueur d’onde choisie.</div>}
      {dd && dd.type === 'identification' && <div style={aide}>Spectre de la solution inconnue (la concentration varie d’un tirage à l’autre : la hauteur du pic ne permet pas d’identifier l’espèce).</div>}
      <SpectreUV esp={P.esp} c={P.cMolL} l={P.l} yMax={P.yMax} curseur={P.curs ? P.lam : null} compare={compare} aria={ariaScene}/>
      {compare && <div style={{ ...aide, marginTop: 6 }}>Spectres normalisés (chacun ramené à 1 au maximum) : trait plein = {sp.court}, tirets orange = {M.ESPECES[compare].court}.</div>}
    </div>);
  // boîte « Mesures » : cuve et curseur de longueur d'onde (parcours : étapes 2 à 6 et dosage avec dilution ; défi d'identification)
  const showScene = enGuide ? !(idx >= 6 && idx <= 9) : enDefi ? !!dd && dd.type === 'identification' : true;
  const q9 = enGuide && idx === 9;      // étape « que faire » : seule la mesure de l'élève (A = 2,4) est montrée, sur le graphique
  const cQ9 = M.depuisMolL(U, 3 / eps(U));   // A théorique 3,0 → A mesurée ≈ 2,4
  const boxCurseur = (enGuide ? ((idx >= 1 && idx <= 5) || idx === 10) : enDefi && !!dd && dd.type === 'identification') && (
    <div style={{ ...styleBoite, ...cadre('curseur') }}>
      <div style={titreCarte}>{enGuide && idx === 1 ? 'La solution' : 'Mesures'}</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {enGuide && <div style={{ flex: '0 0 96px', textAlign: 'center', fontSize: 13.5, color: KIT.txt, fontWeight: 700 }}>
          <CuveCouleur esp={SG.esp} c={M.enMolL(SG.esp, SG.inconnue ? SG.c : Math.max(cEff, 5))}/>
          <div>solution {sp.couleur}</div></div>}
        {(enDefi || idx >= 2) && <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <Curseur nom="Longueur d’onde λ du curseur" valeur={P.lam} onChange={P.setLam} min={M.LAMBDA_MIN} max={M.LAMBDA_MAX} pas={1} unite="nm" couleur={ORANGE_GUIDE}/>
          {boutonLmax && <div style={{ marginBottom: 8 }}><button onClick={() => P.setLam(lmax(P.esp))} style={styleBouton(false, ORANGE_GUIDE)}>Placer le curseur à λ{indicesProfond('_max')} tabulée</button></div>}
          <LigneMesure nom="Longueur d’onde λ" valeur={`${P.lam}${NB}nm`} couleur={ORANGE_GUIDE}/>
          <LigneMesure nom="Absorbance A" valeur={nbf(Alam, 3)} couleur="#b91c1c"/>
        </div>}
      </div>
    </div>);
  const boxGraphe = enGuide && idx >= 8 && idx !== 10 && (
    <div style={{ ...styleBoite, ...cadre('graphe') }}>
      <div style={titreCarte}>Absorbance à λ{indicesProfond('_max')} = {lmax(U)}{NB}nm en fonction de c</div>
      <GrapheEtalonnage esp={U} lam={lmax(U)} cUnite={q9 ? cQ9 : Math.min(cG, 120)} cMaxUnite={120} zone={apres('limite')} aria={`Graphique de l'absorbance A en fonction de la concentration de tartrazine, de 0 à 120 micromoles par litre : droite en tirets et absorbance mesurée en trait plein${apres('limite') ? ', avec la zone limite de validité hachurée' : ''}.`}/>
      {idx === 8 && <Curseur nom="Concentration c de la tartrazine" valeur={Math.min(cG, 120)} onChange={setCG} min={0} max={120} pas={1} unite="µmol/L" couleur="#15803d"/>}
      <div style={{ ...aide, marginTop: 6 }}>Tirets : droite A = ε × l × c. Trait plein : absorbance mesurée. {q9 ? ' Point orange : la mesure de l’élève (A = 2,4).' : ' Point orange : la concentration réglée.'}{apres('limite') ? ' Zone hachurée : limite du domaine de validité (A ≈ 1,5 à 2).' : ''}</div>
    </div>);
  const boxDroite = enGuide && idx === 7 && (
    <div style={{ ...styleBoite, ...cadre('graphe') }}>
      <div style={titreCarte}>Droite d’étalonnage de la tartrazine à λ{indicesProfond('_max')} = {lmax(U)}{NB}nm</div>
      <GrapheDroite pts={G.pts} k={KAJ} unite="µmol/L" cMax={50} aMax={1.5} ax={G.Ax} lecture aria={`Graphique de l'absorbance A en fonction de la concentration c de tartrazine en micromoles par litre, de 0 à 50 : cinq points d'étalonnage alignés avec l'origine, droite A égale ${nbs(KAJ, 3)} fois c, et l'échantillon d'absorbance ${nbf(G.Ax, 3)} reporté sur la droite par des pointillés.`}/>
      <div style={{ ...aide, marginTop: 6 }}>Points bleus : les cinq étalons. Trait gris : la droite A = k × c tracée par le tableur. Point orange et pointillés : l’échantillon (A mesurée), reporté sur la droite.</div>
    </div>);
  const defiEtal = enDefi && defi && defi.type === 'etalonnage' && (() => {
    const aMax = defi.pts[4].A > 1.0 ? 1.5 : 1.0;
    return (<div style={{ ...styleBoite }}>
      <div style={titreCarte}>Solutions étalons de {M.ESPECES[defi.esp].court} à λ{indicesProfond('_max')} = {lmax(defi.esp)}{NB}nm</div>
      {tableEtalons(defi.pts, 'µmol/L', true, `d${defi.esp}${defi.pts[4].A}`)}
      <div style={{ marginTop: 8 }}><GrapheDroite pts={defi.pts} k={defi.k} unite="µmol/L" cMax={Number((defi.cs[4] * 1.1).toPrecision(2))} aMax={aMax} aria={`Graphique de l'absorbance en fonction de la concentration : cinq points d'étalonnage et la droite ajustée passant par l'origine.`}/></div>
      <div style={{ ...aide, marginTop: 6 }}>Points bleus : les étalons ; trait gris : la droite passant par l’origine, ajustée par le tableur.</div>
    </div>);
  })();
  const tableGuide = enGuide && (idx === 4 ? tableValeurs(CAND4, false, true) : (idx === 6 || idx === 7) ? tableEtalons(G.pts, 'µmol/L', idx === 6) : null);
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
          <li>Beer-Lambert : A = ε × l × c, c = <Frac haut={<>A</>} bas={<>ε × l</>} /> ; on travaille à λ_max</li>
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
        @media (min-width: 901px) { .uv-l1.cote .uv-carte { order: 2; } .uv-l1.cote .uv-main { order: 1; }
          .uv-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .uv-ex > * { grid-column: 1; } .uv-ex > .uv-ctrl { grid-column: 2; grid-row: 1 / span 4; } }
        @media (max-width: 900px) { .uv-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .uv-in { animation: uv-fondu 0.35s ease-out; } @keyframes uv-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Spectroscopie UV-visible : énergie, identification et dosage</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un photon absorbé a une énergie <strong>E = h c / λ</strong> ; le spectre d’absorption d’une espèce est son <strong>empreinte</strong> (λ<sub>max</sub>) ; une <strong>droite d’étalonnage</strong> A = k × c permet de doser, dans le domaine de validité.</div>
      {!enExplore && <div className="uv-l1 cote">
        {enGuide ? <div className="uv-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="uv-carte">{panneauHypo}</div> : null}
        <div className="uv-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'identification' ? suiviI : suiviC}/></div>}
          <div className="uv-col">
            {showScene && (!enDefi || defi) && <div className="uv-in">{boxScene}</div>}
            {boxCurseur && <div className="uv-in">{boxCurseur}</div>}
            {enDefi && defi && defi.type === 'identification' && <div className="uv-in">{tableValeurs(defi.candidates, false, true)}</div>}
            {defiEtal && <div className="uv-in">{defiEtal}</div>}
            {tableGuide && <div className="uv-in">{tableGuide}</div>}
            {boxDroite && <div className="uv-in">{boxDroite}</div>}
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
