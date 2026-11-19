import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import * as C from "./concentrationModele";
import { QCM } from "./concentrationQcm";
import { SvgConcentration, SvgCmC, SvgDissolution, SvgConservation, SvgFacteur, SvgVerrerie } from "./concentrationSchemas";
import { SceneComparer, SceneSolution, SceneDissolution, SceneDilution, SceneVerrerie, SceneConservation } from "./concentrationScenes";

const SIM_ID = 153, CLE_GUIDE = 'concentration-dilution-1g-guide-v1';
declarerDefis(SIM_ID, [['solide', 'Quelle masse de solide faut-il peser ?'], ['dilution', 'Quel volume de solution mère faut-il prélever ?']]);

// ====================================================
//  SIM 153 — CONCENTRATION EN QUANTITÉ DE MATIÈRE : DISSOLUTION ET DILUTION (1G spé PC, thème « Constitution et transformations de la matière »,
//  partie « Suivi de l'évolution d'un système » : composition du système initial). Prérequis : la simulation 152 (M, n = m/M).
//  Une seule idée : la concentration c = n/V, et comment la fabriquer (dissolution : masse à peser ; dilution : volume à prélever), avec le bon verre.
//  Parcours (13 étapes) : concentration, n = c·V, lien Cm / c, dissolution (n puis m, verrerie), conservation de n, volume à prélever, facteur de dilution,
//  verrerie de la dilution, compléter au trait de jauge. Le modèle est dans concentrationModele.js (testé).
//  Capacités visées (jamais affichées à l'élève) : déterminer la quantité de matière d'un soluté à partir de sa concentration en masse ou en quantité de
//  matière et du volume de solution ; préparer une solution par dissolution ou par dilution en choisissant le matériel adapté.
//  Les précisions des verres sont qualitatives seulement : le calcul d'incertitudes relève de la partie « Mesure ».
// ====================================================

const NB = ' ';
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const sciF = (x, cs = 3) => { const [a, e] = Number(x).toExponential(cs - 1).split('e'); return `${a.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => (c === '-' ? '⁻' : SUP[c])).join('')}`; };
const nbs = (x, cs = 3) => {
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e6 || a < 1e-3) return sciF(x, cs);
  return Number(x.toPrecision(cs)).toFixed(Math.max(0, cs - 1 - Math.floor(Math.log10(a)))).replace('.', ',');
};
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', violet: '#6d28d9' };
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// ---------- formules (MathML) ----------
const FC = <Formule><mi>c</mi><mo>=</mo><mfrac><mi>n</mi><mi>V</mi></mfrac></Formule>;
const Fcm = <Formule><msub><mi>C</mi><mi>m</mi></msub><mo>=</mo><mi>c</mi><mo>·</mo><mi>M</mi></Formule>;
const FF = <Formule><mi>F</mi><mo>=</mo><mfrac><msub><mi>c</mi><mi>mère</mi></msub><msub><mi>c</mi><mi>fille</mi></msub></mfrac></Formule>;
const FFV = <Formule><mi>F</mi><mo>=</mo><mfrac><msub><mi>V</mi><mi>fille</mi></msub><msub><mi>V</mi><mi>mère</mi></msub></mfrac></Formule>;
const FCons = <Formule><msub><mi>c</mi><mi>mère</mi></msub><mo>·</mo><msub><mi>V</mi><mi>mère</mi></msub><mo>=</mo><msub><mi>c</mi><mi>fille</mi></msub><mo>·</mo><msub><mi>V</mi><mi>fille</mi></msub></Formule>;

const aide = (t) => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const equation = (eq) => <div style={{ fontSize: 17, fontWeight: 700, color: KIT.txt, textAlign: 'center', padding: '6px 4px 10px', lineHeight: 1.6 }}>{eq.split(' ').map((m, i) => <span key={i} style={{ whiteSpace: 'nowrap' }}>{m}{' '}</span>)}</div>;

// ====================================================
export function SimulationConcentrationDilution() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviS, noterS] = useCompteurDefi(), [suiviD, noterD] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('solide');
  const [hypoOuv, setHypoOuv] = useState(false);
  // exploration
  const [ex, setEx] = useState({ objet: 'solution', sol: 'nacl', n: 0.05, V: 250, dsol: 'nacl', dc: 0.1, dV: 250, c0: 0.5, F: 10, V1: 100, verreF: 'fiole', verreP: 'pipette', ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const setE = f => setEx(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['comparer', 'defc', 'nsol', 'cm', 'ncm', 'dissol', 'verreS', 'conserv', 'vpreleve', 'facteur', 'vf', 'verreD', 'jauge'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => etape > IDS.indexOf(id);
  const fait = id => apres(id) || !!(guide.reussies && guide.reussies[IDS.indexOf(id)]);   // étape passée ou réussie à l'instant

  const ETAPES = [
    { id: 'comparer', titre: 'Deux solutions à comparer', focus: ['scene'],
      texte: <>Une <strong>solution</strong> est obtenue en dissolvant un <strong>soluté</strong> (ici du sel) dans un <strong>solvant</strong> (ici de l’eau). Voici deux solutions, A et B, qui contiennent <strong>la même quantité de sel dissous</strong> : chaque point représente une particule de soluté.</>,
      tache: { type: 'qcm', ...QCM.comparer } },
    { id: 'defc', titre: 'Une concentration à calculer', focus: ['scene'],
      texte: <>La <strong>concentration en quantité de matière</strong> d’un soluté, notée <em>c</em>, est la quantité de matière de soluté dissous dans <strong>un litre</strong> de solution : <em>c</em> = <em>n</em> / <em>V</em>, avec <em>n</em> en mol, <em>V</em> en L et <em>c</em> en mol/L. On dissout <strong>n = 0,0500{NB}mol</strong> de glucose dans de l’eau pour obtenir <strong>V = 250,0{NB}mL</strong> de solution (volume de la solution, pas celui de l’eau versée).{FC}</>,
      tache: { type: 'num', q: 'Concentration de la solution de glucose', carnet: 'c de la solution de glucose', unite: 'mol/L', vrai: 0.2, tol: 0.01, affiche: v => nbf(v, 3),
        calcul: () => ['V = 250,0 mL = 0,2500 L (1 mL = 10⁻³ L). Hypothèse : V est le volume de la solution obtenue, pas celui de l’eau versée.', 'c = n / V = 0,0500 mol ÷ 0,2500 L = 0,200 mol/L.'],
        pieges: [[0.0002, 'Il faut convertir le volume en litres : 250,0 mL = 0,2500 L.'], [5.0, 'Le rapport est inversé : c = n / V (la quantité de matière en haut).'], [12.5, 'On divise n par V, on ne les multiplie pas : c = n / V.']],
        expl: 'c = 0,0500 / 0,2500 = 0,200 mol/L : un litre de cette solution contient 0,200 mol de glucose.', indice: 'c = n / V : convertissez d’abord le volume en litres.' } },
    { id: 'nsol', titre: 'Du soluté dans un prélèvement', focus: ['scene'],
      texte: <>Une solution de glucose a pour concentration <strong>c = 0,100{NB}mol/L</strong> : chaque litre de solution contient 0,100{NB}mol de glucose. On en prélève un volume <strong>V = 50,0{NB}mL</strong>. Combien de glucose contient ce prélèvement, en millimoles (1 mmol = 10⁻³ mol) ?</>,
      tache: { type: 'num', q: 'Quantité de matière de glucose dans le prélèvement', carnet: 'n de glucose dans 50,0 mL', unite: 'mmol', vrai: 5.0, tol: 0.01, affiche: v => nbf(v, 2),
        calcul: () => ['V = 50,0 mL = 0,0500 L. De c = n / V, on tire n = c × V (les litres se simplifient).', 'n = 0,100 mol/L × 0,0500 L = 5,00 × 10⁻³ mol = 5,00 mmol.'],
        pieges: [[0.005, 'Le résultat est demandé en millimoles : 0,00500 mol = 5,00 mmol.'], [2.0, 'On multiplie c par V, on ne les divise pas : n = c × V.'], [0.5, 'Le rapport est inversé : n = c × V.']],
        expl: 'n = 0,100 × 0,0500 = 5,00 × 10⁻³ mol, soit 5,00 mmol.', indice: 'La concentration donne les moles par litre : n = c × V, avec V en litres.' },
      retenirTitre: 'À RETENIR : LA CONCENTRATION c',
      retenir: <>
        <SvgConcentration/>
        {FC}
        <ul style={liste}>
          <li><strong>c = soluté par litre de solution</strong> (mol/L). Plus il y a de particules dans le même volume, plus la solution est concentrée.</li>
          <li>Exemple de la simulation : 0,0500 mol de glucose dans 250,0 mL = 0,2500 L donnent c = 0,200 mol/L.</li>
          <li><strong>Idée fausse</strong> : « un plus grand volume contient plus de soluté, donc c’est plus concentré ». <strong>Vrai</strong> : c compare n et V ; on convertit toujours V en litres.</li>
        </ul></> },
    { id: 'cm', titre: 'Deux façons de donner la concentration', focus: ['scene'],
      texte: <>Le sérum physiologique est une solution de chlorure de sodium NaCl, de <strong>concentration en masse C<sub>m</sub> = 9,0{NB}g/L</strong> (masse de soluté dissous par litre de solution, vue en seconde). Un litre de sérum contient donc 9,0{NB}g de NaCl. La masse molaire du chlorure de sodium est <strong>M = 58,5{NB}g/mol</strong>. Quelle est sa concentration en quantité de matière ?</>,
      tache: { type: 'num', q: 'Concentration en quantité de matière du sérum physiologique', carnet: 'c du sérum physiologique', unite: 'mol/L', vrai: 9.0 / 58.5, tol: 0.03, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['Dans 1 L de solution : m = 9,0 g de NaCl, donc n = m / M = 9,0 g ÷ 58,5 g/mol = 0,154 mol.', 'c = n / V = 0,154 mol ÷ 1 L = 0,154 mol/L, soit 0,15 mol/L avec 2 chiffres significatifs (la donnée Cm en a 2). Autrement dit c = Cm / M.'],
        pieges: [[526.5, 'On divise Cm par M, on ne les multiplie pas : g/L ÷ g/mol donne des mol/L.'], [6.5, 'Le rapport est inversé : c = Cm / M (la concentration en masse en haut).']],
        expl: 'c = Cm / M = 9,0 / 58,5 = 0,154 mol/L ≈ 0,15 mol/L.', indice: 'Dans 1 L de solution il y a 9,0 g de NaCl : à combien de moles correspondent ces 9,0 g ? (n = m / M)' } },
    { id: 'ncm', titre: 'Quantité de matière à partir de Cm', focus: ['scene'],
      texte: <>Un flacon contient <strong>V = 250,0{NB}mL</strong> de sérum physiologique, de concentration en masse <strong>C<sub>m</sub> = 9,0{NB}g/L</strong> en chlorure de sodium NaCl, de masse molaire <strong>M = 58,5{NB}g/mol</strong>. Quelle quantité de matière de NaCl ce flacon contient-il, en millimoles (1{NB}mmol = 10⁻³{NB}mol) ?</>,
      tache: { type: 'num', q: 'Quantité de matière de NaCl dans le flacon', carnet: 'n de NaCl dans 250,0 mL de sérum', unite: 'mmol', vrai: 9.0 * 0.25 / 58.5 * 1000, tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['V = 250,0 mL = 0,2500 L. Masse de NaCl dissous : m = Cm × V = 9,0 g/L × 0,2500 L = 2,25 g.', 'n = m / M = 2,25 g ÷ 58,5 g/mol = 0,0385 mol = 38 mmol (2 chiffres significatifs, comme Cm). En une fois : n = Cm × V / M.'],
        pieges: [[0.0385, 'Le résultat est demandé en millimoles : 0,0385 mol = 38,5 mmol.'], [131.6, 'On divise la masse par M, on ne la multiplie pas : n = m / M.'], [0.154, 'Vous avez calculé la concentration c ; il faut encore tenir compte du volume du flacon : n = c × V.']],
        expl: 'n = Cm × V / M = 9,0 × 0,2500 / 58,5 = 0,0385 mol ≈ 38 mmol.', indice: 'Quelle masse de NaCl y a-t-il dans 250,0 mL (Cm est une masse par litre) ? Combien de moles représente cette masse (n = m / M) ?' } },
    { id: 'dissol', titre: 'Quelle masse faut-il peser ?', focus: ['scene'],
      texte: <>On veut préparer un volume <strong>V = 250,0{NB}mL</strong> de solution de chlorure de sodium, de concentration <strong>c = 0,100{NB}mol/L</strong>, en dissolvant du solide dans l’eau. La dissolution s’écrit :{equation('NaCl(s) → Na⁺(aq) + Cl⁻(aq)')}La masse molaire du chlorure de sodium est <strong>M = 58,5{NB}g/mol</strong>. Quelle masse de solide faut-il placer sur la balance ?</>,
      tache: { type: 'num', q: 'Masse de chlorure de sodium à peser', carnet: 'Masse de NaCl à peser', unite: 'g', vrai: 0.025 * 58.5, tol: 0.01, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => ['V = 250,0 mL = 0,2500 L. Quantité de soluté à dissoudre : n = c × V = 0,100 mol/L × 0,2500 L = 2,50 × 10⁻² mol.', 'Masse : m = n × M = 2,50 × 10⁻² mol × 58,5 g/mol = 1,46 g. Hypothèse : le sel est pur (100 %) et sec.'],
        pieges: [[0.025, 'Ce nombre est la quantité de matière (en mol), pas la masse : il reste à multiplier par M, m = n × M.'], [1462.5, 'Il faut convertir le volume en litres : 250,0 mL = 0,2500 L.'], [0.000427, 'On multiplie n par M, on ne les divise pas : m = n × M.']],
        expl: 'n = c × V = 0,100 × 0,2500 = 2,50 × 10⁻² mol ; m = n × M = 2,50 × 10⁻² × 58,5 = 1,46 g (en un seul calcul : m = c × V × M).', indice: 'D’abord la quantité de matière à dissoudre : n = c × V (V en litres). Puis la masse : m = n × M.' },
      retenirTitre: 'À RETENIR : Cm ET c',
      retenir: <>
        <SvgCmC/>
        {Fcm}
        <ul style={liste}>
          <li><strong>Cm en g/L, c en mol/L</strong> : on passe de l’une à l’autre avec la masse molaire M (g/mol). Moyen de s’en souvenir : les unités se simplifient.</li>
          <li>Exemple de la simulation : le sérum physiologique à 9,0 g/L de NaCl (M = 58,5 g/mol) a une concentration c = 0,15 mol/L.</li>
          <li>Dans un volume V de solution : <strong>n = Cm × V / M</strong> (la masse de soluté Cm × V, divisée par M).</li>
          <li><strong>Piège</strong> : multiplier au lieu de diviser. Pour un soluté de masse molaire supérieure à 1 g/mol, la valeur de c (mol/L) est plus petite que celle de Cm (g/L).</li>
        </ul></> },
    { id: 'verreS', titre: 'Le récipient pour ajuster le volume', focus: ['scene'],
      texte: <>La masse est pesée. Il reste à fabriquer exactement 250,0{NB}mL de solution. Voici quelques récipients du laboratoire, tous d’une capacité de 250{NB}mL environ.</>,
      tache: { type: 'qcm', ...QCM.verreSolide } },
    { id: 'conserv', titre: 'Que devient le soluté qu’on dilue ?', focus: ['scene'],
      texte: <>On sait préparer une solution à partir d’un solide. On peut aussi la préparer à partir d’une solution plus concentrée. Pour obtenir une solution moins concentrée, on <strong>dilue</strong> une solution plus concentrée, appelée <strong>solution mère</strong> : on en prélève un volume avec une pipette jaugée, on le verse dans une fiole jaugée et on complète avec de l’eau distillée. La solution obtenue est la <strong>solution fille</strong>. Ici, on prélève 10{NB}mL de solution mère pour obtenir 100{NB}mL de solution fille.</>,
      tache: { type: 'qcm', ...QCM.conserv },
      retenirTitre: 'À RETENIR : PRÉPARER PAR DISSOLUTION',
      retenir: <>
        <SvgDissolution/>
        <ul style={liste}>
          <li><strong>Calculer, peser, dissoudre, ajuster</strong> : m = c × V × M, puis on complète la fiole jaugée jusqu’au trait.</li>
          <li>Exemple de la simulation : 250,0 mL de NaCl à 0,100 mol/L demandent 1,46 g de chlorure de sodium.</li>
          <li><strong>Piège</strong> : V est le volume final de la solution (celui de la fiole), pas le volume d’eau que l’on verse.</li>
        </ul></> },
    { id: 'vpreleve', titre: 'Quel volume de solution mère prélever ?', focus: ['scene'],
      texte: <>On veut préparer <strong>V<sub>fille</sub> = 100,0{NB}mL</strong> de solution fille, de concentration <strong>c<sub>fille</sub> = 0,0500{NB}mol/L</strong>, à partir d’une solution mère de concentration <strong>c<sub>mère</sub> = 0,500{NB}mol/L</strong>. Pendant la dilution, la quantité de matière de soluté ne change pas : celle du prélèvement est égale à celle de la solution fille. Quel volume de solution mère faut-il prélever ?</>,
      tache: { type: 'num', q: 'Volume de solution mère à prélever', carnet: 'V de solution mère à prélever', unite: 'mL', vrai: 10.0, tol: 0.01, affiche: v => nbf(v, 1),
        calcul: () => ['La quantité de soluté se conserve : c_mère × V_mère = c_fille × V_fille, donc V_mère = c_fille × V_fille / c_mère.', 'V_mère = 0,0500 mol/L × 100,0 mL ÷ 0,500 mol/L = 10,0 mL (les unités de concentration se simplifient, on garde des mL). Hypothèse : la fiole est complétée exactement au trait de jauge.'],
        pieges: [[1000, 'Le rapport est inversé : V_mère = c_fille × V_fille / c_mère (la mère au dénominateur).'], [90.0, 'C’est à peu près le volume d’eau à ajouter (V_fille − V_mère), pas le volume de solution mère.'], [0.01, 'Le résultat est demandé en mL : ne le convertissez pas en litres.']],
        expl: 'n(fille) = 0,0500 × 0,1000 = 5,00 × 10⁻³ mol, apportée par V_mère = 5,00 × 10⁻³ ÷ 0,500 = 0,0100 L = 10,0 mL.', indice: 'c_mère × V_mère = c_fille × V_fille : isolez V_mère (les volumes peuvent rester en mL).' } },
    { id: 'facteur', titre: 'Combien de fois plus diluée ?', focus: ['scene'],
      texte: <>On dilue une solution mère de concentration <strong>c<sub>mère</sub> = 0,400{NB}mol/L</strong> pour obtenir une solution fille de concentration <strong>c<sub>fille</sub> = 0,0100{NB}mol/L</strong>. Le <strong>facteur de dilution</strong> F est le rapport de la concentration de la solution mère à celle de la solution fille ; il n’a pas d’unité.{FF}</>,
      tache: { type: 'num', q: 'Facteur de dilution', carnet: 'Facteur de dilution F', unite: '(sans unité)', vrai: 40, tol: 0.01, affiche: v => nbf(v, 1),
        calcul: () => ['F = c_mère / c_fille : on divise la plus grande concentration par la plus petite (les mol/L se simplifient).', 'F = 0,400 ÷ 0,0100 = 40,0 : la solution fille est 40 fois moins concentrée que la solution mère.'],
        pieges: [[0.025, 'Le rapport est inversé : F = c_mère / c_fille, et F est supérieur à 1 pour une dilution.'], [0.39, 'Un rapport n’est pas une différence : F = c_mère / c_fille.']],
        expl: 'F = 0,400 / 0,0100 = 40,0 : on a dilué 40 fois.', indice: 'Divisez la concentration de la solution mère par celle de la solution fille.' },
      retenirTitre: 'À RETENIR : LA DILUTION CONSERVE n',
      retenir: <>
        <SvgConservation/>
        {FCons}
        <ul style={liste}>
          <li><strong>On ajoute de l’eau, pas de soluté</strong> : n ne change pas, V augmente, donc c diminue.</li>
          <li>Exemple de la simulation : on prélève 10 mL de solution mère pour faire 100 mL de solution fille : n est le même avant et après.</li>
          <li><strong>Idée fausse</strong> : « diluer, c’est retirer du soluté ». <strong>Vrai</strong> : le soluté prélevé est tout entier dans la fille.</li>
        </ul></> },
    { id: 'vf', titre: 'Utiliser le facteur de dilution', focus: ['scene'],
      texte: <>Avec ce facteur <strong>F = 40,0</strong>, on veut préparer <strong>V<sub>fille</sub> = 200,0{NB}mL</strong> de solution fille. Diluer <em>F</em> fois, c’est aussi multiplier le volume de la solution par <em>F</em> : la solution fille occupe un volume <em>F</em> fois plus grand que le prélèvement de solution mère. Quel volume de solution mère faut-il prélever ?</>,
      tache: { type: 'num', q: 'Volume de solution mère à prélever', carnet: 'V de solution mère (200,0 mL, F = 40,0)', unite: 'mL', vrai: 5.0, tol: 0.01, affiche: v => nbf(v, 2),
        calcul: () => ['V_fille = F × V_mère, donc V_mère = V_fille / F.', 'V_mère = 200,0 mL ÷ 40,0 = 5,00 mL. On retrouve le même résultat avec c_mère × V_mère = c_fille × V_fille.'],
        pieges: [[8000, 'On divise V_fille par F, on ne les multiplie pas : la mère est plus petite que la fille.'], [195.0, 'C’est à peu près le volume d’eau à ajouter, pas le volume de solution mère.']],
        expl: 'V_mère = 200,0 / 40,0 = 5,00 mL.', indice: 'La solution fille a un volume F fois plus grand que le prélèvement : divisez V_fille par F.' } },
    { id: 'verreD', titre: 'Le matériel de la dilution', focus: ['scene'],
      texte: <>Reprenons la dilution : <strong>5,00{NB}mL</strong> de solution mère à prélever, <strong>200,0{NB}mL</strong> de solution fille à préparer. Voici le matériel disponible.</>,
      tache: { type: 'qcm', ...QCM.verreDilution },
      retenirTitre: 'À RETENIR : LE FACTEUR DE DILUTION',
      retenir: <>
        <SvgFacteur/>
        {FF}{FFV}
        <ul style={liste}>
          <li><strong>« Diluer F fois » : le volume est multiplié par F, la concentration divisée par F</strong>.</li>
          <li>Exemple de la simulation : dilution d’une solution à 2,0 mol/L jusqu’à 0,50 mol/L, donc F = 4,0 : pour 100 mL de fille, on prélève 25 mL de mère.</li>
          <li><strong>Piège</strong> : F est sans unité et supérieur à 1 ; il ne faut pas confondre « diluer 4 fois » et « ajouter 4 volumes d’eau ».</li>
        </ul></> },
    { id: 'jauge', titre: 'Obtenir la solution fille', focus: ['scene'],
      texte: <>Le volume prélevé de solution mère (5,00{NB}mL) est dans la fiole jaugée de 200,0{NB}mL. Il reste à obtenir la solution fille.</>,
      tache: { type: 'qcm', ...QCM.jauge },
      retenirTitre: 'À RETENIR : LE BON VERRE',
      retenir: <>
        <SvgVerrerie/>
        <ul style={liste}>
          <li><strong>Volume précis : verre jaugé</strong> (fiole jaugée pour le volume final, pipette jaugée pour le prélèvement) ; éprouvette graduée : volume approché ; bécher : on ne mesure pas avec.</li>
          <li>Exemple de la simulation : 5,00 mL de mère à la pipette jaugée, 200,0 mL de fille dans une fiole jaugée.</li>
          <li><strong>Idée fausse</strong> : « un bécher de 250 mL contient 250 mL ». <strong>Vrai</strong> : ses graduations sont indicatives. Le calcul des incertitudes est traité dans la partie « Mesure ».</li>
        </ul></> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { setDefi({ ...(type === 'solide' ? C.tirerDefiSolide() : C.tirerDefiDilution()), reps: {}, verifie: false }); };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const x = lireNombre(defi.reps.v), ok = isFinite(x) && proche(x, defi.vrai, 0.02);
    setDefi(d => ({ ...d, verifie: true, ok })); (defi.type === 'solide' ? noterS : noterD)(ok);
  };
  const champ = (label, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.v ?? ''} aria-label={`${label} ${unite}`} onKeyDown={e => e.key === 'Enter' && document.getElementById('cc-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, v: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['solide', 'Dissolution : masse à peser'], ['dilution', 'Dilution : volume à prélever']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'solide' ? 'Défi : quelle masse faut-il peser ?' : 'Défi : quel volume de solution mère faut-il prélever ?'}</div>
      {defi.type === 'solide' ? <>
        {equation(defi.s.eq)}
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>On prépare <strong>V = {defi.V}{NB}mL</strong> de solution de {defi.s.nom} {C.formuleSolute(defi.s)}, de concentration <strong>c = {nbs(defi.c, 3)}{NB}mol/L</strong>, par dissolution du solide. Sa masse molaire est <strong>M = {nbf(defi.M, 1)}{NB}g/mol</strong>. Quelle masse faut-il peser ? Donnez le résultat en grammes avec 3{NB}chiffres significatifs (marge acceptée : ± 2{NB}%).</div>
        {champ('Masse à peser', 'g')}
        <IndiceDefi cache={false}>Quantité de matière à dissoudre : n = c × V, avec V converti en litres. Puis m = n × M, en grammes avec M en g/mol.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Une solution mère de {defi.s.nom} {C.formuleSolute(defi.s)} a pour concentration <strong>c<sub>mère</sub> = {nbs(defi.c0, 3)}{NB}mol/L</strong>. Par dilution, on veut préparer <strong>V<sub>fille</sub> = {defi.V1}{NB}mL</strong> de solution fille de concentration <strong>c<sub>fille</sub> = {nbs(defi.c1, 3)}{NB}mol/L</strong>. Quel volume de solution mère faut-il prélever ? Donnez le résultat en mL avec 3{NB}chiffres significatifs (marge acceptée : ± 2{NB}%).</div>
        {champ('Volume de solution mère', 'mL')}
        <IndiceDefi cache={false}>La quantité de matière de soluté se conserve : c_mère × V_mère = c_fille × V_fille. Isolez V_mère : V_mère = c_fille × V_fille / c_mère (les volumes peuvent rester en mL). Vous pouvez aussi calculer F = c_mère / c_fille puis V_mère = V_fille / F.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="cc-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? (defi.type === 'solide' ? `✓ Correct. n = ${nbs(defi.c * defi.V / 1000, 3)} mol, soit m = ${nbs(defi.vrai, 3)} g (marge acceptée : ± 2 %).`
          : `✓ Correct. F = ${nbs(defi.F, 2)}, V mère = ${nbs(defi.vrai, 3)} mL : c’est le volume d’une pipette jaugée usuelle (marge acceptée : ± 2 %).`)
          : defi.type === 'solide' ? '✗ Vérifiez : n = c × V avec V en litres ; puis m = n × M, en grammes.'
            : '✗ Vérifiez : c mère × V mère = c fille × V fille ; la mère est plus concentrée, donc son volume est plus petit que celui de la fille.'}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Solution idéale</strong> : on suppose que le volume de la solution est celui de la fiole jaugée (rempli jusqu’au trait de jauge). Les volumes ne sont pas rigoureusement additifs : 100 mL d’eau et 10 g de sel ne donnent pas exactement 100 mL de solution, d’où l’usage de la fiole jaugée et du trait de jauge, plutôt qu’une addition de volumes.</li>
      <li><strong>Température</strong> : la verrerie jaugée est étalonnée à 20 °C ; on suppose que les solutions sont à cette température (le volume d’un liquide varie un peu avec la température). Certains solides, comme le chlorure de calcium, s’échauffent beaucoup en se dissolvant : on laisse revenir la solution à 20 °C avant d’ajuster au trait de jauge.</li>
      <li><strong>Pureté et dissolution totale</strong> : le solide est supposé pur et sec (pureté 100 %, pas d’eau d’hydratation) et entièrement dissous. Les tirages restent loin de la solubilité (ordres de grandeur à 20 °C, en g pour 1 L d’eau : NaCl 360, glucose 900, NaHCO₃ 96) ; au-delà, tout le solide ne se dissoudrait pas et les calculs ne seraient plus valables.</li>
      <li><strong>Concentration apportée</strong> : c est calculée avec la quantité de matière de soluté introduite. Pour un composé ionique totalement dissocié, [Na⁺] = c et [Cl⁻] = c pour NaCl, mais [Cl⁻] = 2c pour CaCl₂ (exploration).</li>
      <li><strong>Dilution</strong> : l’eau ajoutée est pure (elle n’apporte pas de soluté) ; le soluté prélevé est entièrement transféré dans la fiole (pas de perte, pipette bien vidée) ; la quantité de matière se conserve.</li>
      <li><strong>Verrerie</strong> : la précision des verres (très bonne pour la fiole et la pipette jaugées, moyenne pour l’éprouvette, faible pour le bécher) est donnée à titre qualitatif ; les incertitudes sont traitées dans la partie « Mesure ». Les pipettes jaugées usuelles sont de 1, 2, 5, 10, 20 et 25 mL.</li>
      <li><strong>Masses molaires</strong> : valeurs arrondies au dixième (simulation « Quantité de matière »). <strong>Chiffres significatifs</strong> : un résultat ne doit pas avoir plus de chiffres significatifs que la donnée la moins précise ; les calculs intermédiaires gardent un chiffre de plus.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const donnee = (nom, valeur, c) => <LigneMesure key={nom} nom={nom} valeur={valeur} couleur={c}/>;
  const sceneGuide = (() => {
    switch (idE) {
      case 'comparer': return boite('Deux béchers', <SceneComparer/>, cadre('scene'));
      case 'defc': return boite('Une solution de glucose',
        <><SceneSolution n={0.05} V={250} nParPoint={0.005} titre="Solution de glucose" sous={['n = 0,0500 mol', 'V = 250,0 mL']}/><div style={{ marginTop: 8 }}>
          {donnee('Quantité de matière n', `0,0500${NB}mol`)}{donnee('Volume de solution V', `250,0${NB}mL`)}
          {fait('defc') && donnee('Concentration c', `0,200${NB}mol/L`, COL.orange)}</div></>, cadre('scene'));
      case 'nsol': return boite('Un prélèvement de solution de glucose',
        <><SceneSolution n={0.005} V={50} Vmax={250} nParPoint={0.0005} titre="Prélèvement de 50,0 mL" sous={['c = 0,100 mol/L', 'V = 50,0 mL']}/><div style={{ marginTop: 8 }}>
          {donnee('Concentration c', `0,100${NB}mol/L`)}{donnee('Volume prélevé V', `50,0${NB}mL`)}
          {fait('nsol') && donnee('Quantité de matière n', `5,00${NB}×${NB}10⁻³${NB}mol`, COL.orange)}</div></>, cadre('scene'));
      case 'cm': return boite('Un litre de sérum physiologique',
        <><SceneSolution n={9.0 / 58.5} V={1000} nParPoint={0.01} titre="1 L de sérum physiologique" sous={['Cm = 9,0 g/L', 'NaCl : M = 58,5 g/mol']}/><div style={{ marginTop: 8 }}>
          {donnee('Concentration en masse Cm', `9,0${NB}g/L`)}{donnee('Masse molaire M', `58,5${NB}g/mol`)}
          {fait('cm') && donnee('Concentration c', `0,15${NB}mol/L`, COL.orange)}</div></>, cadre('scene'));
      case 'ncm': return boite('Un flacon de sérum physiologique',
        <><SceneSolution n={9.0 * 0.25 / 58.5} V={250} nParPoint={0.005} legende={false} titre="250,0 mL de sérum physiologique" sous={['Cm = 9,0 g/L', 'NaCl : M = 58,5 g/mol']}/><div style={{ marginTop: 8 }}>
          {donnee('Volume de solution V', `250,0${NB}mL`)}{donnee('Concentration en masse Cm', `9,0${NB}g/L`)}{donnee('Masse molaire M', `58,5${NB}g/mol`)}
          {fait('ncm') && donnee('Quantité de matière n', `38${NB}mmol`, COL.orange)}</div></>, cadre('scene'));
      case 'dissol': {
        const m = fait('dissol');
        return (<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {boite('La dissolution', <>{equation('NaCl(s) → Na⁺(aq) + Cl⁻(aq)')}
            <SceneDissolution solute="chlorure de sodium" forme="NaCl" V="250,0" masse={m ? '1,46 g' : '? g'} etat={m ? 'jauge' : 'pese'} titre="Dissoudre du solide dans une fiole"/></>, cadre('scene'))}
          <div style={styleBoite}>
            {donnee('Volume de solution V', `250,0${NB}mL`)}{donnee('Concentration voulue c', `0,100${NB}mol/L`)}{donnee('Masse molaire M', `58,5${NB}g/mol`)}
            {m && donnee('Masse à peser m', `1,46${NB}g`, COL.orange)}
          </div>
        </div>);
      }
      case 'verreS': return boite('Le matériel de jaugeage', <SceneVerrerie liste={['fiole', 'becher', 'eprouvette', 'erlenmeyer']} titre="Quatre récipients de 250 mL environ"/>, cadre('scene'));
      case 'conserv': return boite('Prélever, verser, compléter', <SceneDilution V0="10" V1="100" nPts={24} apres={fait('conserv')} titre="Une dilution"/>, cadre('scene'));
      case 'vpreleve': return boite('Préparer 100,0 mL de solution fille',
        <><SceneDilution V0={fait('vpreleve') ? '10,0' : '?'} V1="100,0" nPts={24} apres={fait('vpreleve')} titre="Quel prélèvement ?"/><div style={{ marginTop: 8 }}>
          {donnee('Concentration de la mère', `0,50${NB}mol/L`)}{donnee('Concentration de la fille', `0,050${NB}mol/L`)}{donnee('Volume de la fille', `100,0${NB}mL`)}
          {fait('vpreleve') && donnee('Volume de la mère à prélever', `10,0${NB}mL`, COL.orange)}</div></>, cadre('scene'));
      case 'facteur': return boite('Une solution plus diluée',
        <><SceneConservation V0="V mère" V1="V fille" nPts={18} c0Txt="0,400 mol/L" c1Txt="0,0100 mol/L" note="Schéma non à l’échelle"/><div style={{ marginTop: 8 }}>
          {donnee('Concentration de la mère', `0,400${NB}mol/L`)}{donnee('Concentration de la fille', `0,0100${NB}mol/L`)}
          {fait('facteur') && donnee('Facteur de dilution F', '40,0', COL.orange)}</div></>, cadre('scene'));
      case 'vf': return boite('Préparer 200,0 mL de solution fille',
        <><SceneDilution V0={fait('vf') ? '5,00' : '?'} V1="200,0" nPts={24} apres={fait('vf')} titre="Quel prélèvement ?"/><div style={{ marginTop: 8 }}>
          {donnee('Facteur de dilution F', '40,0')}{donnee('Volume de la fille', `200,0${NB}mL`)}
          {fait('vf') && donnee('Volume de la mère à prélever', `5,00${NB}mL`, COL.orange)}</div></>, cadre('scene'));
      case 'verreD': return boite('Le matériel de la dilution', <SceneVerrerie liste={['pipette', 'fiole', 'eprouvette', 'becher']} titre="Quatre verres disponibles"/>, cadre('scene'));
      case 'jauge': return boite('La fiole jaugée de 200,0 mL', <SceneDilution V0="5,00" V1="200,0" nPts={24} apres={fait('jauge')} titre="Obtenir la solution fille"/>, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const etiquette = (l, ctrl) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{l}{ctrl}</label>;
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });
  const optsSolute = C.SOLUTES.map(s => <option key={s.id} value={s.id}>{s.nom} {C.formuleSolute(s)}</option>);

  // Alerte de solubilité : les valeurs (g pour 1 L d'eau, à 20 °C) sont des ordres de grandeur ; on prévient dès la moitié de la valeur
  const alerteSol = (Cm, so) => Cm > so.solub
    ? <div role="alert" style={{ marginTop: 6, fontSize: 13.5, color: COL.rouge, fontWeight: 700, lineHeight: 1.5 }}>Cm dépasse la solubilité d’environ {so.solub}{NB}g pour 1{NB}L d’eau : tout le solide ne se dissoudrait pas, ces valeurs ne sont plus valables.</div>
    : Cm > 0.5 * so.solub ? <div style={{ marginTop: 6, fontSize: 13.5, color: COL.orange, fontWeight: 700, lineHeight: 1.5 }}>Attention : Cm dépasse la moitié de la solubilité (environ {so.solub}{NB}g pour 1{NB}L d’eau) ; la dissolution serait longue et la solution presque saturée.</div> : null;

  // --- objet 1 : une solution (n, V, c, Cm) ---
  const sS = C.soluteDe(ex.sol), MS = C.masseMolaireSoluteDe(sS), cS = C.concentration(ex.n, ex.V / 1000), CmS = C.concMasse(cS, MS);
  const solReglages = (<>
    {etiquette('Soluté', <select value={ex.sol} onChange={x => setE({ sol: x.target.value })} style={sel}>{optsSolute}</select>)}
    <Curseur nom="Quantité de matière de soluté n" valeur={ex.n} onChange={v => setE({ n: v })} min={0.01} max={0.5} pas={0.01} unite="mol" decimales={3} couleur="#b45309"/>
    <Curseur nom="Volume de solution V" valeur={ex.V} onChange={v => setE({ V: v })} min={50} max={1000} pas={10} unite="mL" decimales={0} couleur="#0369a1"/>
    {aide('Un point représente 0,01 mol de soluté. Gardez n et changez V : la concentration varie ; gardez V et changez n : elle varie aussi.')}
  </>);
  const solScene = <SceneSolution n={ex.n} V={ex.V} titre={`${sS.nom} ${C.formuleSolute(sS)}`} sous={[`c = ${nbs(cS, 3)} mol/L`, `Cm = ${nbs(CmS, 3)} g/L`]}/>;
  const solMesures = (<>
    {donnee('Masse molaire M', `${nbf(MS, 1)}${NB}g/mol`)}
    {donnee('Concentration c = n / V', `${nbs(cS, 3)}${NB}mol/L`, COL.orange)}
    {donnee('Concentration en masse Cm = c × M', `${nbs(CmS, 3)}${NB}g/L`, COL.vert)}
    {donnee('Masse de soluté m = n × M', `${nbs(ex.n * MS, 3)}${NB}g`, COL.violet)}
    {sS.ions.length > 0 && sS.ions.map(([ion, k]) => donnee(`Concentration en ${ion}`, `${nbs(k * cS, 3)}${NB}mol/L`, COL.bleu))}
    {alerteSol(CmS, sS)}
  </>);

  // --- objet 2 : préparer par dissolution ---
  const sD = C.soluteDe(ex.dsol), MD = C.masseMolaireSoluteDe(sD), nD = ex.dc * ex.dV / 1000, mD = nD * MD, CmD = ex.dc * MD, satD = CmD > sD.solub;

  const disReglages = (<>
    {etiquette('Soluté à dissoudre', <select value={ex.dsol} onChange={x => setE({ dsol: x.target.value })} style={sel}>{optsSolute}</select>)}
    {etiquette('Concentration voulue', <select value={ex.dc} onChange={x => setE({ dc: Number(x.target.value) })} style={sel}>{C.CONC_SOLIDE.map(c => <option key={c} value={c}>{nbs(c, 3)} mol/L</option>)}</select>)}
    {etiquette('Fiole jaugée (volume de solution)', <select value={ex.dV} onChange={x => setE({ dV: Number(x.target.value) })} style={sel}>{C.FIOLES.map(v => <option key={v} value={v}>{v} mL</option>)}</select>)}
    {aide('La simulation calcule la quantité de matière à dissoudre, puis la masse à peser (m = c × V × M).')}
    <Section titre={`Verrerie : ${C.VERRES[ex.verreF].nom} pour ajuster le volume`} ouvert={!!ex.ouv.verreD} onBascule={() => ouvrir('verreD')}>
      {etiquette('Récipient où l’on complète le volume', <select value={ex.verreF} onChange={x => setE({ verreF: x.target.value })} style={sel}>{['fiole', 'eprouvette', 'becher'].map(k => <option key={k} value={k}>{C.VERRES[k].nom}</option>)}</select>)}
      {aide(`${C.VERRES[ex.verreF].nom} : ${C.VERRES[ex.verreF].usage}. Précision : ${C.VERRES[ex.verreF].precision}.${ex.verreF === 'fiole' ? ' La concentration obtenue est connue précisément.' : ' La concentration réelle de la solution ne serait connue qu’approximativement : pour une solution de concentration précise, il faut une fiole jaugée.'}`)}
    </Section>
  </>);
  const disScene = (<>
    {equation(sD.eq)}
    <SceneDissolution solute={sD.nom} forme={C.formuleSolute(sD)} V={String(ex.dV)} masse={`${nbs(mD, 3)} g`} etat="jauge" titre="Dissoudre du solide dans une fiole"/>
  </>);
  const disMesures = (<>
    {donnee('Volume de solution V', `${ex.dV}${NB}mL = ${nbs(ex.dV / 1000, 3)}${NB}L`)}
    {donnee('Quantité de matière n = c × V', `${nbs(nD, 3)}${NB}mol`, COL.vert)}
    {donnee('Masse molaire M', `${nbf(MD, 1)}${NB}g/mol`)}
    {donnee('Masse à peser m = n × M', `${nbs(mD, 3)}${NB}g`, COL.orange)}
    {donnee('Concentration en masse Cm = c × M', `${nbs(CmD, 3)}${NB}g/L`, COL.violet)}
    {alerteSol(CmD, sD)}
    {!satD && mD < 0.2 && <div style={{ marginTop: 6, fontSize: 13.5, color: COL.orange, fontWeight: 700, lineHeight: 1.5 }}>Cette masse est très petite : difficile à peser précisément avec une balance usuelle. Choisissez une fiole plus grande ou une solution plus concentrée.</div>}
  </>);

  // --- objet 3 : préparer par dilution ---
  const facts = C.facteursPossibles(ex.c0), fioles = C.fiolesPossibles(ex.c0, ex.F);
  const V1d = fioles.includes(ex.V1) ? ex.V1 : fioles[0], V0d = V1d / ex.F, c1d = ex.c0 / ex.F, nd = ex.c0 * V0d / 1000;
  const changerC0 = c0 => { const f = C.facteursPossibles(c0), F = f.includes(ex.F) ? ex.F : f[0], fi = C.fiolesPossibles(c0, F); setE({ c0, F, V1: fi.includes(ex.V1) ? ex.V1 : fi[0] }); };
  const changerF = F => { const fi = C.fiolesPossibles(ex.c0, F); setE({ F, V1: fi.includes(ex.V1) ? ex.V1 : fi[0] }); };
  const diluReglages = (<>
    {etiquette('Concentration de la solution mère', <select value={ex.c0} onChange={x => changerC0(Number(x.target.value))} style={sel}>{C.CONC_MERE.map(c => <option key={c} value={c}>{nbs(c, 3)} mol/L</option>)}</select>)}
    {etiquette('Facteur de dilution F', <select value={ex.F} onChange={x => changerF(Number(x.target.value))} style={sel}>{facts.map(f => <option key={f} value={f}>on dilue {f} fois (F = {f})</option>)}</select>)}
    {etiquette('Fiole jaugée de la solution fille', <select value={V1d} onChange={x => setE({ V1: Number(x.target.value) })} style={sel}>{fioles.map(v => <option key={v} value={v}>{v} mL</option>)}</select>)}
    {aide('Seules les combinaisons réalisables avec une pipette jaugée usuelle (1, 2, 5, 10, 20 ou 25 mL) sont proposées.')}
    <Section titre={`Verrerie : ${C.VERRES[ex.verreP].nom} pour prélever`} ouvert={!!ex.ouv.verreP} onBascule={() => ouvrir('verreP')}>
      {etiquette('Verre utilisé pour prélever la solution mère', <select value={ex.verreP} onChange={x => setE({ verreP: x.target.value })} style={sel}>{['pipette', 'eprouvette', 'becher'].map(k => <option key={k} value={k}>{C.VERRES[k].nom}</option>)}</select>)}
      {aide(`${C.VERRES[ex.verreP].nom} : ${C.VERRES[ex.verreP].usage}. Précision : ${C.VERRES[ex.verreP].precision}.${ex.verreP === 'pipette' ? ' Le volume prélevé est connu précisément.' : ' Le volume prélevé, donc la concentration de la solution fille, ne serait connu qu’approximativement.'}`)}
    </Section>
  </>);
  const diluScene = (<>
    <SceneDilution V0={nbs(V0d, 3)} V1={String(V1d)} nPts={24} apres titre={`Dilution ${C.facteurDilution(ex.c0, c1d)} fois`}/>
    <div style={{ marginTop: 8 }}><SceneConservation V0={`${nbs(V0d, 3)} mL`} V1={`${nbs(V1d, 3)} mL`} nPts={20} c0Txt={`${nbs(ex.c0, 3)} mol/L`} c1Txt={`${nbs(c1d, 3)} mol/L`} note="Schéma non à l’échelle"/></div>
  </>);
  const diluMesures = (<>
    {donnee('Facteur de dilution F = c mère / c fille', nbs(ex.F, 2), COL.violet)}
    {donnee('Concentration de la fille', `${nbs(c1d, 3)}${NB}mol/L`, COL.vert)}
    {donnee('Volume de mère à prélever', `${nbs(V0d, 3)}${NB}mL`, COL.orange)}
    {donnee('Quantité de soluté prélevée = c mère × V mère', `${nbs(nd, 3)}${NB}mol`, COL.bleu)}
    {donnee('Quantité de soluté dans la fille = c fille × V fille', `${nbs(c1d * V1d / 1000, 3)}${NB}mol`, COL.bleu)}
    {aide(`Les deux quantités de matière sont égales : la dilution conserve le soluté. Environ ${nbs(V1d - V0d, 3)} mL d’eau sont ajoutés, mais on complète toujours jusqu’au trait de jauge.`)}
  </>);

  const objets = [['solution', 'Lire une solution : n, V, c et Cm'], ['dissolution', 'Préparer une solution par dissolution'], ['dilution', 'Préparer une solution par dilution']];
  const parObjet = {
    solution: [solReglages, solScene, solMesures, 'Une solution : de n et V à la concentration'],
    dissolution: [disReglages, disScene, disMesures, 'Dissolution : la masse à peser'],
    dilution: [diluReglages, diluScene, diluMesures, 'Dilution : le volume à prélever'],
  }[ex.objet];
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Solution : gardez n et doublez V. Que devient c ? Gardez V et doublez n : et maintenant ?</li>
      <li>Solution : choisissez le chlorure de calcium et lisez les concentrations des ions : pourquoi [Cl⁻] est-elle le double de c ?</li>
      <li>Dissolution : préparez 250 mL de solution à 0,100 mol/L pour le glucose, puis pour le chlorure de sodium. Pourquoi les masses diffèrent-elles ?</li>
      <li>Dissolution : choisissez le bécher pour ajuster le volume. Qu’est-ce qui change pour la qualité de la solution ?</li>
      <li>Dilution : gardez F et changez la fiole : que devient le volume de solution mère ? Et la concentration de la fille ?</li>
      <li>Dilution : comparez les deux quantités de soluté (prélevée et dans la fille) pour toutes les combinaisons.</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>c = n / V (mol/L ; V en litres) et n = c × V</li>
        <li>C<sub>m</sub> = c × M (g/L = mol/L × g/mol) ; n = C<sub>m</sub> × V / M</li>
        <li>dissolution : m = c × V × M ; on ajuste le volume dans une fiole jaugée jusqu’au trait</li>
        <li>dilution : c<sub>mère</sub> × V<sub>mère</sub> = c<sub>fille</sub> × V<sub>fille</sub> ; F = c<sub>mère</sub> / c<sub>fille</sub> = V<sub>fille</sub> / V<sub>mère</sub></li>
        <li>volume précis : pipette jaugée (prélèvement) et fiole jaugée (volume final)</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cc-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 900px) { .cc-hypo-defi { order: 2; } }
        @media (min-width: 901px) { .cc-l1.cote .cc-carte { order: 2; } .cc-l1.cote .cc-main { order: 1; }
          .cc-ex { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); }
          .cc-ex > .cc-ex-scene { grid-column: 1; grid-row: 1; } .cc-ex > .cc-ex-reglages { grid-column: 2; grid-row: 1 / span 2; } .cc-ex > .cc-ex-mesures { grid-column: 1; grid-row: 2; } }
        @media (max-width: 900px) { .cc-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .cc-in { animation: cc-fondu 0.35s ease-out; } @keyframes cc-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Concentration en quantité de matière : dissolution et dilution</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>La <strong>concentration</strong> <em>c</em> d’une solution, en <strong>mol/L</strong>, est la quantité de matière de soluté par litre de solution. On prépare une solution de concentration voulue par <strong>dissolution</strong> d’un solide (masse à peser) ou par <strong>dilution</strong> d’une solution plus concentrée (volume à prélever), avec le bon matériel.</div>
      {enExplore ? <>
        <div style={{ ...styleBoite, marginBottom: 12 }}>
          {etiquette('Que voulez-vous étudier ?', <select value={ex.objet} onChange={x => setE({ objet: x.target.value })} style={sel}>{objets.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>)}
        </div>
        <div className="cc-ex">
          <div className="cc-ex-scene">{boite(parObjet[3], parObjet[1])}</div>
          <div className="cc-ex-reglages">{boite('Réglages', parObjet[0])}</div>
          <div className="cc-ex-mesures">{boite('Mesures et calculs', parObjet[2])}</div>
        </div>
        {(ex.objet === 'dissolution' || ex.objet === 'dilution') && <Section titre="La verrerie et sa précision (qualitatif)" ouvert={!!ex.ouv.verres} onBascule={() => ouvrir('verres')}>
          <SceneVerrerie liste={['fiole', 'pipette', 'eprouvette', 'becher']} precision titre="Précision de chaque verre"/>
          {aide('Les incertitudes de mesure ne sont pas calculées ici : elles font l’objet de la partie « Mesure ».')}
        </Section>}
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`cc-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="cc-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="cc-carte cc-hypo-defi">{panneauHypo}</div> : null}
          <div className="cc-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'solide' ? suiviS : suiviD}/></div>}
            {enDefi && defi && <div className="cc-in">{boite(defi.type === 'solide' ? 'La dissolution' : 'La dilution',
              defi.type === 'solide' ? <SceneDissolution solute={defi.s.nom} forme={C.formuleSolute(defi.s)} V={String(defi.V)} masse="? g" etat="pese" titre="Dissoudre du solide dans une fiole"/>
                : <SceneDilution V0="?" V1={String(defi.V1)} nPts={24} apres={false} titre="Quel prélèvement ?"/>)}</div>}
            {enGuide && <div className="cc-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && fait('jauge') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
