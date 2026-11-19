import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./predoTstlModele";
import { QCM } from "./predoTstlQcm";
import { ScenePredo, GrapheRepartition, SvgPredo, SvgRelation, SvgDizaines, SvgIndicateur, SvgPKaSpectro } from "./PredoTstlSchemas";

const SIM_ID = 139, CLE_GUIDE = 'predo-tstl-guide-v1';
declarerDefis(SIM_ID, [['ratio', 'Rapport des concentrations et concentration de la base'], ['indicateur', 'Le pKa d’un indicateur coloré inconnu']]);

// ====================================================
//  SIM 139 — pH = pKa + log, DIAGRAMME DE PRÉDOMINANCE ET INDICATEUR COLORÉ (TSTL, enseignement PCM, séquence 2 « Réactions acido-basiques »).
//  Une seule idée : le pH d'une solution et le pKa d'un couple fixent le rapport [A⁻]/[AH]. Notions : couple acide/base, base conjuguée, diagramme de prédominance,
//  relation pH = pKa + log([A⁻]/[AH]), indicateur coloré (teinte sensible), détermination d'un pKa par spectrophotométrie (loi de Beer-Lambert).
//  Aucune espèce, valeur ni situation des documents du Moodle : indicateur coloré FICTIF, couples distincts de ceux des documents.
//  Capacités visées (jamais affichées à l'élève) : tracer/lire un diagramme de prédominance ; donner l'expression du pH ; exploiter Beer-Lambert pour une concentration ;
//  déterminer un pKa ; prévoir l'espèce prédominante ; utiliser le logarithme décimal.
//  Modèle : predoTstlModele.js. Schémas : PredoTstlSchemas.jsx. QCM : predoTstlQcm.js.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sci = (v, cs = 2) => { const [m, e] = Number(v).toExponential(cs - 1).split('e'); return `${m.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => SUP[c]).join('')}`; };
const sp = s => s.replace(/\u00a0/g, ' ');
const fmtC = c => ({ 0.1: '0,10', 0.05: '0,050', 0.02: '0,020', 0.01: '0,010' }[c] ?? sci(c, 2));
const fmtAbs = a => nbf(a, 3);
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', gris: '#64748b' };
const PRESET = { couple: 'prop', pH: 4.9, C: 0.020 };
const P = M.PARCOURS, K = M.COUPLES[P.couple].pKa, C0 = P.C;
const eR = M.etat(P.couple, P.pHRatio, C0), eL = M.etat(P.couple, P.pHRel, C0), eV = M.etat(P.couple, P.pHInv, C0);
const eI = M.etat('ind', P.indPHMes, M.IND.C), eDil = M.etat('ind', P.indPHMes, P.indDil);
const absDil = Math.round(M.absorbance(M.IND.eps, M.IND.l, eDil.A) * 1000) / 1000;
const IndB = eI.abs / (M.IND.eps * M.IND.l), IndB2 = M.arrondiCS(IndB, 2), HIndB2 = M.IND.C - IndB2;
const pKaIndVrai = M.pKaDepuisRapport(P.indPHMes, IndB2 / HIndB2);
const rV = M.arrondiCS(eV.r, 2);

// ---------- formules (MathML) ----------
const conc = x => <><mo>[</mo>{x}<mo>]</mo></>;
const Am = <msup><mi mathvariant="normal">A</mi><mo>−</mo></msup>;
const AHm = <mi mathvariant="normal">AH</mi>;
const Kamath = <msub><mi>K</mi><mi mathvariant="normal">a</mi></msub>;
const H3O = <><msub><mi mathvariant="normal">H</mi><mn>3</mn></msub><msup><mi mathvariant="normal">O</mi><mo>+</mo></msup></>;
const FKa = <Formule>{Kamath}<mo>=</mo><mfrac><mrow>{conc(Am)}<mo>·</mo>{conc(H3O)}</mrow><mrow>{conc(AHm)}</mrow></mfrac></Formule>;
const FpHpKa = <Formule><mi>pH</mi><mo>=</mo><mi>pKa</mi><mo>+</mo><mi>log</mi><mfrac><mrow>{conc(Am)}</mrow><mrow>{conc(AHm)}</mrow></mfrac></Formule>;
const FBeer = <Formule><mi>A</mi><mo>=</mo><mi>ε</mi><mo>·</mo><mi>ℓ</mi><mo>·</mo>{conc(<msup><mi mathvariant="normal">Ind</mi><mo>−</mo></msup>)}</Formule>;
const FRapport = <FormuleEnLigne><mfrac><mrow>{conc(Am)}</mrow><mrow>{conc(AHm)}</mrow></mfrac></FormuleEnLigne>;
const FRapportInd = <FormuleEnLigne><mfrac><mrow>{conc(<msup><mi mathvariant="normal">Ind</mi><mo>−</mo></msup>)}</mrow><mrow>{conc(<mi mathvariant="normal">HInd</mi>)}</mrow></mfrac></FormuleEnLigne>;

// ---------- équation de la réaction, toujours en tête ----------
const Esp = ({ children }) => <span style={{ whiteSpace: 'nowrap' }}>{children}</span>;
function Equation({ coupleId }) {
  const c = M.COUPLES[coupleId];
  return (
    <div style={{ ...styleBoite, textAlign: 'center' }}>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4 }}>Couple acide/base {c.AH} / {c.A} : {c.nom}</div>
      <div style={{ fontSize: 17, color: KIT.txt, lineHeight: 1.6 }} aria-label="Équation de la réaction de l’acide avec l’eau">
        <Esp>{c.AH}(aq)</Esp> + <Esp>H₂O(ℓ)</Esp> ⇌ <Esp>{c.A}(aq)</Esp> + <Esp>H₃O⁺(aq)</Esp>
      </div>
    </div>);
}
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// ====================================================
export function SimulationPredoTstl() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviR, noterR] = useCompteurDefi(), [suiviI, noterI] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('ratio');
  const [ouv, setOuv] = useState({});
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- étapes du parcours ----------
  const IDS = ['couple', 'egal', 'inf', 'sup', 'ratio', 'rel', 'inv', 'conc', 'indic', 'zone', 'beer', 'pkind', 'invar', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- situation affichée (couple, pH, concentration totale) ----------
  const scGuide = { couple: ['prop', K, C0], egal: ['prop', K, C0], inf: ['prop', P.pHInf, C0], sup: ['prop', P.pHSup, C0], ratio: ['prop', P.pHRatio, C0], rel: ['prop', P.pHRel, C0],
    inv: ['prop', P.pHInv, C0], conc: ['prop', P.pHInv, C0], indic: ['ind', P.indPH, M.IND.C], zone: ['ind', 5.4, M.IND.C], beer: ['ind', P.indPHMes, M.IND.C], pkind: ['ind', P.indPHMes, M.IND.C],
    invar: ['ind', P.indPHMes, P.indDil], bilan: ['prop', P.pHRatio, C0] };
  const [coupleId, pHs, Cs] = enGuide ? scGuide[idE] : [ti.couple, ti.pH, ti.couple === 'ind' ? M.IND.C : ti.C];
  const c = M.COUPLES[coupleId], e = M.etat(coupleId, pHs, Cs), ind = coupleId === 'ind';
  const pHVisible = idE !== 'rel', pKaVisible = !['beer', 'pkind'].includes(idE);
  const zones = enExplore || (deja('ratio') && !['indic', 'beer', 'pkind'].includes(idE));
  const barres = enExplore || (deja('ratio') && !['rel', 'inv', 'conc', 'indic', 'beer', 'pkind'].includes(idE));

  const ETAPES = [
    { id: 'couple', titre: 'Un couple acide/base', focus: ['scene'],
      texte: <>Un <strong>acide</strong> est une espèce capable de <strong>céder un proton</strong> H⁺ ; une <strong>base</strong> est une espèce capable d’en <strong>capter un</strong>. Quand l’acide AH cède un proton, il se transforme en sa <strong>base conjuguée</strong> A⁻ : les deux espèces forment un <strong>couple acide/base</strong> noté AH / A⁻. Ici, le couple de l’acide propanoïque : C₂H₅COOH / C₂H₅COO⁻ (équation en haut).</>,
      tache: { type: 'qcm', q: 'Quelle est la base conjuguée de l’acide propanoïque C₂H₅COOH ?', ...QCM.couple,
        expl: 'La base conjuguée s’obtient en retirant un proton H⁺ à l’acide : C₂H₅COOH perd H⁺ et devient C₂H₅COO⁻. H₃O⁺ est l’acide conjugué de l’eau, et OH⁻ la base du couple de l’eau.', indice: 'Base conjuguée = acide privé d’un proton H⁺ : la charge diminue d’une unité.' } },
    { id: 'egal', titre: 'Quand le pH est égal au pKa', focus: ['scene', 'mesures'],
      texte: <>La constante d’acidité du couple s’écrit {FKa}Le pKa vaut −log Ka, donc Ka = 10^(−pKa). Pour le couple C₂H₅COOH / C₂H₅COO⁻, pKa = {nbf(K, 1)}. On prépare une solution dont le pH est <strong>fixé à {nbf(K, 1)}</strong>, donc [H₃O⁺] = 10^(−pH) = 10^(−pKa) = Ka (repère rouge sur l’axe).</>,
      tache: { type: 'qcm', q: 'Dans cette solution (pH = pKa), comment comparer [C₂H₅COO⁻] et [C₂H₅COOH] ?', ...QCM.egal,
        expl: 'Si [H₃O⁺] = Ka, la relation Ka = frac([A⁻] × [H₃O⁺]|[AH]) donne [A⁻] = [AH] : les deux formes du couple ont la même concentration.', indice: 'Écrivez Ka = frac([A⁻] × [H₃O⁺]|[AH]) et remplacez [H₃O⁺] par Ka : que reste-t-il ?' } },
    { id: 'inf', titre: 'Un milieu plus acide que le pKa', focus: ['scene'],
      texte: <>Même couple, pKa = {nbf(K, 1)}. On impose maintenant un pH de <strong>{nbf(P.pHInf, 1)}</strong>, inférieur au pKa : [H₃O⁺] = 10^(−pH) est plus grande que Ka = 10^(−pKa). Rappel : Ka = frac([A⁻] × [H₃O⁺]|[AH]).</>,
      tache: { type: 'qcm', q: 'Dans cette solution (pH = 2,9), quelle espèce du couple prédomine ?', ...QCM.inf,
        expl: 'Ka = frac([A⁻] × [H₃O⁺]|[AH]) donne frac([A⁻]|[AH]) = frac(Ka|[H₃O⁺]). Comme [H₃O⁺] > Ka, ce rapport est inférieur à 1 : [A⁻] < [AH]. L’acide prédomine.', indice: 'Isolez le rapport frac([A⁻]|[AH]) = frac(Ka|[H₃O⁺]) : est-il plus grand ou plus petit que 1 quand [H₃O⁺] > Ka ?' } },
    { id: 'sup', titre: 'Un milieu plus basique que le pKa', focus: ['scene'],
      texte: <>Même couple. On impose maintenant un pH de <strong>{nbf(P.pHSup, 1)}</strong>, supérieur au pKa : [H₃O⁺] est plus petite que Ka. Utilisez le même raisonnement qu’à l’étape précédente.</>,
      tache: { type: 'qcm', q: 'Dans cette solution (pH = 7,4), quelle espèce du couple prédomine ?', ...QCM.sup,
        expl: 'frac([A⁻]|[AH]) = frac(Ka|[H₃O⁺]) est maintenant supérieur à 1 : [A⁻] > [AH]. La base prédomine.', indice: 'Même raisonnement : le rapport frac([A⁻]|[AH]) = frac(Ka|[H₃O⁺]) est-il plus grand ou plus petit que 1 quand [H₃O⁺] < Ka ?' } },
    { id: 'ratio', titre: 'Le rapport des concentrations', focus: ['scene', 'mesures'],
      retenirTitre: 'À RETENIR : LE DIAGRAMME DE PRÉDOMINANCE',
      retenir: <>
        <SvgPredo/>
        <ul style={puces}>
          <li><strong>pH &lt; pKa : l’acide AH prédomine</strong> ; <strong>pH &gt; pKa : la base A⁻ prédomine</strong> ; <strong>pH = pKa : [AH] = [A⁻]</strong>.</li>
          <li>Exemple de la simulation : acide propanoïque, pKa = 4,9 ; à pH 2,9 (acide) et à pH 7,4 (base).</li>
          <li>Moyen de s’en souvenir : <strong>« pH sous le pKa, l’acide gagne ; pH au-dessus, la base gagne »</strong>.</li>
        </ul></>,
      texte: <>On impose pH = <strong>{nbf(P.pHRatio, 1)}</strong>, soit pKa + 1. La simulation affiche les concentrations : [C₂H₅COO⁻] = {sci(eR.A, 2)}{NB}mol·L⁻¹ et [C₂H₅COOH] = {sci(eR.AH, 2)}{NB}mol·L⁻¹ (concentration totale C = 0,020{NB}mol·L⁻¹). Calculez leur rapport.</>,
      tache: { type: 'num', q: 'Rapport frac([C₂H₅COO⁻]|[C₂H₅COOH])', unite: '(sans unité)', vrai: M.arrondiCS(eR.A, 2) / M.arrondiCS(eR.AH, 2), tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['frac([A⁻]|[AH]) = frac(' + sp(sci(eR.A, 2)) + '|' + sp(sci(eR.AH, 2)) + ')', 'Le rapport vaut 10 (sans unité) : [A⁻] est 10 fois plus grande que [AH].'],
        pieges: [[0.1, 'Le rapport est inversé : c’est [A⁻] divisée par [AH], donc supérieur à 1 ici.'], [M.arrondiCS(eR.A, 2), 'C’est [A⁻] : il faut la diviser par [AH].'], [M.arrondiCS(eR.A, 2) - M.arrondiCS(eR.AH, 2), 'Un rapport est un quotient, pas une différence : divisez [A⁻] par [AH].']],
        expl: 'Le rapport est 10 : pH = pKa + 1 correspond à une base 10 fois plus concentrée que l’acide.', indice: 'Divisez [C₂H₅COO⁻] par [C₂H₅COOH] : les deux valeurs sont en mol·L⁻¹, le rapport n’a pas d’unité.' } },
    { id: 'rel', titre: 'La relation pH = pKa + log', focus: ['mesures'],
      texte: <>On retient : {FpHpKa}Elle vient de Ka = frac([A⁻] × [H₃O⁺]|[AH]) et des propriétés du logarithme décimal. Autre solution du même couple (pKa = {nbf(K, 1)}) : [C₂H₅COO⁻] = {sci(eL.A, 2)}{NB}mol·L⁻¹ et [C₂H₅COOH] = {sci(eL.AH, 2)}{NB}mol·L⁻¹. Quel est son pH ?</>,
      tache: { type: 'num', q: 'pH de cette solution', unite: '(sans unité)', vrai: M.pHDepuisRapport(K, M.arrondiCS(eL.A, 2) / M.arrondiCS(eL.AH, 2)), tol: 0.02, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => ['frac([A⁻]|[AH]) = frac(' + sp(sci(eL.A, 2)) + '|' + sp(sci(eL.AH, 2)) + ') = 0,25', 'pH = pKa + log(0,25) = 4,9 − 0,60 = 4,3 (sans unité).'],
        pieges: [[5.5, 'Le logarithme de 0,25 est négatif (rapport inférieur à 1) : le pH est inférieur au pKa.'], [K, 'Vous avez oublié le terme log : le pH n’est égal au pKa que si [A⁻] = [AH].'], [K + 4, 'Il faut calculer log(0,25) = −0,60, pas diviser ni multiplier par 4.']],
        expl: 'pH = pKa + log(0,25) = 4,9 − 0,60 = 4,3 : la base est moins concentrée que l’acide, le pH est sous le pKa.', indice: 'Calculez d’abord le rapport frac([A⁻]|[AH]), puis son log avec la touche log (négatif si le rapport est inférieur à 1), et ajoutez-le au pKa.' } },
    { id: 'inv', titre: 'Du pH au rapport', focus: ['scene', 'mesures'],
      retenirTitre: 'À RETENIR : pH = pKa + log',
      retenir: <>
        <SvgRelation/>
        <ul style={puces}>
          <li><strong>pH = pKa + log</strong> {FRapport}, d’où {FRapport} <strong>= 10<sup>pH − pKa</sup></strong> (touche 10ˣ).</li>
          <li>Exemple de la simulation : rapport 0,25 pour un pH inférieur de 0,6 au pKa, rapport 10 pour pH = pKa + 1.</li>
          <li>Piège : le logarithme d’un rapport inférieur à 1 est <strong>négatif</strong> ; c’est un rapport, pas une différence.</li>
        </ul></>,
      texte: <>Retournons la relation : frac([A⁻]|[AH]) = 10^(pH − pKa). On impose pH = <strong>{nbf(P.pHInv, 1)}</strong> au couple de pKa = {nbf(K, 1)}.</>,
      tache: { type: 'num', q: 'Rapport frac([C₂H₅COO⁻]|[C₂H₅COOH])', unite: '(sans unité)', vrai: eV.r, tol: 0.05, affiche: v => nbf(M.arrondiCS(v, 2), 0), cs: 2,
        calcul: () => ['pH − pKa = 6,2 − 4,9 = 1,3', 'frac([A⁻]|[AH]) = 10^(1,3) ≈ 20 (sans unité).'],
        pieges: [[1.3, 'C’est la différence pH − pKa, c’est-à-dire le logarithme du rapport : il faut encore prendre 10 puissance 1,3.'], [10 ** -1.3, 'Le signe de l’exposant est inversé : pH > pKa donne un rapport supérieur à 1.'], [6.2 / 4.9, 'Il faut calculer 10^(pH − pKa), pas le quotient pH divisé par pKa.']],
        expl: 'frac([A⁻]|[AH]) = 10^(1,3) ≈ 20 : la base est environ 20 fois plus concentrée que l’acide.', indice: 'Calculez pH − pKa puis utilisez la touche 10ˣ : rapport = 10^(pH − pKa).' } },
    { id: 'conc', titre: 'Des concentrations à partir du rapport', focus: ['scene', 'mesures'],
      retenirTitre: 'À RETENIR : PROPORTIONS SELON pH − pKa',
      retenir: <>
        <SvgDizaines/>
        <ul style={puces}>
          <li>À <strong>pH = pKa ± 1</strong>, une forme est <strong>10 fois</strong> plus concentrée que l’autre (91 % contre 9 %) ; à <strong>± 2</strong>, <strong>100 fois</strong> (99 % contre 1 %).</li>
          <li>Exemple de la simulation : pH = pKa + 1 pour l’acide propanoïque, C₂H₅COO⁻ représente 91 % du couple.</li>
          <li>Moyen de s’en souvenir : <strong>« une unité de pH = un facteur 10 »</strong>.</li>
        </ul></>,
      texte: <>Retour à pH = {nbf(P.pHInv, 1)} : le rapport vaut environ <strong>{nbf(rV, 0)}</strong>. La concentration totale du couple est C = {fmtC(C0)}{NB}mol·L⁻¹, avec la conservation de la matière C = [AH] + [A⁻]. Si r = frac([A⁻]|[AH]), alors [AH] = frac(C|1 + r) et [A⁻] = r × [AH].</>,
      tache: { type: 'num', q: 'Concentration de la base [C₂H₅COO⁻]', unite: 'mol·L⁻¹', vrai: eV.A, tol: 0.05, affiche: v => sci(v, 2), cs: 2,
        calcul: () => [`[AH] = frac(C|1 + r) = frac(0,020|1 + ${nbf(rV, 0)}) = ${sp(sci(0.020 / (1 + rV), 2))} mol·L⁻¹.`, `[A⁻] = C − [AH] = 0,020 − ${sp(sci(0.020 / (1 + rV), 2))} = ${sp(sci(eV.A, 2))} mol·L⁻¹.`],
        pieges: [[0.020 * rV, 'C’est C × r : le total ne peut pas dépasser C. Utilisez [AH] = frac(C|1 + r) puis [A⁻] = C − [AH].'], [0.020 / (1 + rV), 'C’est la concentration de l’acide [AH], pas celle de la base.'], [0.020 / rV, 'Il faut tenir compte de l’acide : le total est [AH] + [A⁻] = C, donc [AH] = frac(C|1 + r).']],
        expl: `[A⁻] = ${sp(sci(eV.A, 2))} mol·L⁻¹ : environ 95 % du couple est sous forme de base.`, indice: 'Utilisez C = [AH] + [A⁻] et [A⁻] = r × [AH] : [AH] = frac(C|1 + r), puis [A⁻] = C − [AH].' } },
    { id: 'indic', titre: 'Un indicateur coloré', focus: ['scene'],
      texte: <>Un <strong>indicateur coloré</strong> est un couple acide/base dont les deux formes n’ont pas la même couleur. Indicateur fictif étudié ici : HInd / Ind⁻ ; la forme acide HInd est <strong>jaune</strong>, la forme basique Ind⁻ est <strong>violette</strong>. Sa concentration totale est très faible (C = {sci(M.IND.C, 2)}{NB}mol·L⁻¹) : il ne modifie pas le pH. Sa solution a ici un pH de <strong>{nbf(P.indPH, 1)}</strong> ; son pKa est 5,4.</>,
      tache: { type: 'qcm', q: 'Dans la solution jaune (pH = 3,4), quelle forme de l’indicateur prédomine ?', ...QCM.indic,
        expl: 'À pH = 3,4, inférieur au pKa = 5,4, c’est la forme acide HInd qui prédomine : la solution est jaune, couleur de HInd.', indice: 'Comparez le pH (3,4) au pKa (5,4) : pH inférieur au pKa, c’est l’acide qui prédomine.' } },
    { id: 'zone', titre: 'La teinte sensible', focus: ['scene'],
      texte: <>L’œil ne perçoit la couleur d’une forme que si elle est au moins <strong>10 fois plus concentrée</strong> que l’autre ; entre les deux, on voit un mélange des deux teintes. Le rapport frac([Ind⁻]|[HInd]) est 10^(pH − pKa) : le mélange est visible tant que ce rapport est compris entre 0,1 et 10.</>,
      tache: { type: 'qcm', q: 'Dans quel intervalle de pH la couleur de l’indicateur (pKa = 5,4) est-elle intermédiaire ?', ...QCM.zone,
        expl: 'Rapport entre 0,1 et 10 : 10^(pH − pKa) entre 10^(−1) et 10^(1), soit pH entre pKa − 1 et pKa + 1, ici entre 4,4 et 6,4. En dehors, une seule teinte domine.', indice: 'Cherchez les pH pour lesquels 10^(pH − pKa) vaut 0,1 puis 10 : pH − pKa vaut −1 puis +1.' } },
    { id: 'beer', titre: 'Mesurer une concentration : Beer-Lambert', focus: ['scene', 'mesures'],
      retenirTitre: 'À RETENIR : L’INDICATEUR COLORÉ',
      retenir: <>
        <SvgIndicateur/>
        <ul style={puces}>
          <li>Teinte de l’acide si <strong>pH &lt; pKa − 1</strong> ; teinte de la base si <strong>pH &gt; pKa + 1</strong> ; <strong>mélange</strong> entre les deux : c’est la <strong>teinte sensible</strong>, de largeur 2 unités de pH.</li>
          <li>Exemple de la simulation : indicateur jaune/violet de pKa 5,4, teinte sensible entre 4,4 et 6,4.</li>
          <li>Moyen de s’en souvenir : <strong>« le pKa est le centre de la teinte sensible »</strong>.</li>
        </ul></>,
      texte: <>Pour mesurer la concentration de la forme violette, on utilise un spectrophotomètre réglé sur une longueur d’onde où seule Ind⁻ absorbe. Loi de Beer-Lambert : {FBeer}avec ε = {sci(M.IND.eps, 2)}{NB}L·mol⁻¹·cm⁻¹ et ℓ = {nbf(M.IND.l, 2)}{NB}cm. À pH = <strong>{nbf(P.indPHMes, 1)}</strong>, la solution (C = {sci(M.IND.C, 2)}{NB}mol·L⁻¹) a une absorbance <strong>A = {fmtAbs(eI.abs)}</strong> (sans unité).</>,
      tache: { type: 'num', q: 'Concentration de la forme basique [Ind⁻]', unite: 'mol·L⁻¹', vrai: IndB, tol: 0.05, affiche: v => sci(v, 2), cs: 2,
        calcul: () => ['[Ind⁻] = frac(A|ε × ℓ)', `[Ind⁻] = frac(${fmtAbs(eI.abs)}|${sp(sci(M.IND.eps, 2))} × ${nbf(M.IND.l, 2)}) = ${sp(sci(IndB, 2))} mol·L⁻¹.`],
        pieges: [[eI.abs * M.IND.eps * M.IND.l, 'Il faut diviser A par ε × ℓ, pas les multiplier : [Ind⁻] = frac(A|ε × ℓ).'], [eI.abs, 'C’est l’absorbance, sans unité : il faut la diviser par ε × ℓ.'], [M.IND.eps / eI.abs, 'Le rapport est inversé : [Ind⁻] = frac(A|ε × ℓ).']],
        expl: `[Ind⁻] = ${sp(sci(IndB, 2))} mol·L⁻¹ : environ les trois quarts de l’indicateur sont sous forme basique.`, indice: 'Isolez la concentration dans A = ε · ℓ · [Ind⁻] : [Ind⁻] = frac(A|ε × ℓ), avec ℓ = 1,00 cm.' } },
    { id: 'pkind', titre: 'Déterminer le pKa de l’indicateur', focus: ['mesures'],
      texte: <>Le pKa de l’indicateur n’est plus affiché : on le détermine. À pH = <strong>{nbf(P.indPHMes, 1)}</strong>, on a trouvé [Ind⁻] ≈ {sci(IndB2, 2)}{NB}mol·L⁻¹ ; la concentration totale est C = {sci(M.IND.C, 2)}{NB}mol·L⁻¹, donc [HInd] = C − [Ind⁻] par conservation de la matière. Utilisez pH = pKa + log(frac([Ind⁻]|[HInd])).</>,
      tache: { type: 'num', q: 'pKa du couple HInd / Ind⁻', unite: '(sans unité)', vrai: pKaIndVrai, tol: 0.02, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => [`[HInd] = C − [Ind⁻] = ${sp(sci(M.IND.C, 2))} − ${sp(sci(IndB2, 2))} = ${sp(sci(HIndB2, 2))} mol·L⁻¹.`, `pKa = pH − log(frac([Ind⁻]|[HInd])) = ${nbf(P.indPHMes, 1)} − log(${nbf(IndB2 / HIndB2, 2)}) = ${nbf(pKaIndVrai, 2)}.`],
        pieges: [[P.indPHMes + Math.log10(IndB2 / HIndB2), 'Le signe est inversé : pKa = pH − log(frac([Ind⁻]|[HInd])).'], [P.indPHMes, 'Vous avez oublié le terme log : le pKa n’est égal au pH que si [Ind⁻] = [HInd].'], [P.indPHMes - Math.log10(IndB2 / M.IND.C), 'Au dénominateur, c’est [HInd] = C − [Ind⁻], pas la concentration totale C.']],
        expl: `pKa = ${nbf(P.indPHMes, 1)} − log(${nbf(IndB2 / HIndB2, 2)}) = ${nbf(pKaIndVrai, 2)} : on retrouve la valeur 5,4 à la précision de la mesure.`, indice: 'Isolez pKa = pH − log(frac([Ind⁻]|[HInd])), avec [HInd] = C − [Ind⁻].' } },
    { id: 'invar', titre: 'Le pKa dépend-il de la concentration ?', focus: ['scene', 'mesures'],
      retenirTitre: 'À RETENIR : DÉTERMINER UN pKa PAR SPECTROPHOTOMÉTRIE',
      retenir: <>
        <SvgPKaSpectro/>
        <ul style={puces}>
          <li>On mesure l’absorbance à plusieurs pH : <strong>A = ε · ℓ · [Ind⁻]</strong> donne [Ind⁻], puis [HInd] = C − [Ind⁻] et <strong>pKa = pH − log</strong> {FRapportInd}.</li>
          <li>Repère graphique : l’absorbance vaut <strong>la moitié de son maximum</strong> quand <strong>pH = pKa</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« A max divisée par 2, c’est le pKa »</strong>.</li>
        </ul></>,
      texte: <>On dilue l’indicateur par 2 (C = {sci(P.indDil, 2)}{NB}mol·L⁻¹) et on mesure à nouveau à pH = <strong>{nbf(P.indPHMes, 1)}</strong> : l’absorbance devient A = {fmtAbs(absDil)}, au lieu de {fmtAbs(eI.abs)}. On refait la détermination du pKa avec cette solution.</>,
      tache: { type: 'qcm', q: 'Le pKa trouvé avec la solution diluée sera…', ...QCM.invar,
        expl: 'L’absorbance est divisée par 2 comme les concentrations, mais le rapport frac([Ind⁻]|[HInd]) reste le même à un pH donné : on retrouve le même pKa. Un pKa ne dépend que du couple et de la température.', indice: 'Comparez le rapport [Ind⁻]/[HInd] avant et après dilution : les deux concentrations sont divisées par le même facteur.' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      texte: <>Vous savez écrire un couple acide/base, prévoir l’espèce qui prédomine d’après le pH et le pKa, utiliser pH = pKa + log pour passer du pH au rapport des concentrations (et inversement), expliquer le fonctionnement d’un indicateur coloré, et déterminer un pKa par spectrophotométrie. Explorez maintenant tous les couples, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'ratio' ? { ...M.tirageRatio(), reps: { r: '', A: '' }, verifie: false } : { ...M.tirageIndicateur(), reps: { pka: '' }, verifie: false });
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'explore') setTi(s => ({ ...PRESET, ...s }));
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'ratio') {
      const r = lireNombre(defi.reps.r), A = lireNombre(defi.reps.A);
      const ok = isFinite(r) && isFinite(A) && proche(r, defi.r, 0.05) && proche(A, defi.A, 0.05);
      setDefi(d => ({ ...d, verifie: true, ok })); noterR(ok);
    } else {
      const k = lireNombre(defi.reps.pka);
      const ok = isFinite(k) && proche(k, defi.pKa, 0.03);
      setDefi(d => ({ ...d, verifie: true, ok })); noterI(ok);
    }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (cle, aria, ok) => (
    <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('pd-verif')?.click()} onChange={e2 => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e2.target.value }, verifie: false }))} inputMode="decimal"
      style={{ width: 120, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>);
  const dc = defi && defi.type === 'ratio' ? M.COUPLES[defi.coupleId] : null;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['ratio', 'Rapport et concentration'], ['indicateur', 'pKa d’un indicateur']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'ratio' ? 'Défi : du pH aux concentrations' : 'Défi : le pKa d’un indicateur inconnu'}</div>
      {defi.type === 'ratio' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une solution contient le couple {dc.AH} / {dc.A} (pKa = {nbf(dc.pKa, 1)}), de concentration totale <strong>C = {fmtC(defi.C)}{NB}mol·L⁻¹</strong>, à 25{NB}°C. Son pH est imposé à <strong>{nbf(defi.pH, 2)}</strong>. Calculez le rapport {avecIndices(`frac([${dc.A}]|[${dc.AH}])`)} puis la concentration de la base [{dc.A}] (2 chiffres significatifs, sans unité pour le rapport).</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Rapport =</span>{champ('r', 'Rapport des concentrations base sur acide', defi.ok || proche(lireNombre(defi.reps.r), defi.r, 0.05))}
          <span>[{dc.A}] (mol·L⁻¹) =</span>{champ('A', 'Concentration de la base', defi.ok || proche(lireNombre(defi.reps.A), defi.A, 0.05))}<span>(écriture 6,2e-3 acceptée)</span>
        </div>
        <IndiceDefi cache={false}>{FRapport} = 10<sup>pH − pKa</sup> ; conservation de la matière : C = [AH] + [A⁻], donc [AH] = C divisée par (1 + rapport), puis [A⁻] = C − [AH].</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un indicateur coloré inconnu HInd / Ind⁻ est étudié par spectrophotométrie, à une longueur d’onde où seule Ind⁻ absorbe. Concentration totale <strong>C = {sci(defi.C, 2)}{NB}mol·L⁻¹</strong> ; ε = <strong>{sci(defi.eps, 2)}{NB}L·mol⁻¹·cm⁻¹</strong> ; ℓ = <strong>{nbf(defi.l, 2)}{NB}cm</strong>. À pH = <strong>{nbf(defi.pH, 2)}</strong>, l’absorbance mesurée est <strong>A = {fmtAbs(defi.abs)}</strong>. Calculez son pKa (3 chiffres significatifs, sans unité).</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>pKa =</span>{champ('pka', 'pKa de l’indicateur', defi.ok || proche(lireNombre(defi.reps.pka), defi.pKa, 0.03))}
        </div>
        <IndiceDefi cache={false}>[Ind⁻] = A divisée par (ε × ℓ) ; [HInd] = C − [Ind⁻] ; pKa = pH − log {FRapportInd}.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="pd-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices(defi.type === 'ratio'
          ? (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + `Rapport = 10^(${nbf(defi.pH, 2)} − ${nbf(dc.pKa, 1)}) ≈ ${M.arrondiCS(defi.r, 2).toString().replace('.', ',')} ; [${dc.A}] ≈ ${sci(defi.A, 2)} mol·L⁻¹ et [${dc.AH}] ≈ ${sci(defi.AH, 2)} mol·L⁻¹ : ${defi.pH > dc.pKa ? 'la base prédomine' : 'l’acide prédomine'}.`
          : (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + `pKa ≈ ${nbf(defi.pKa, 1)} : la teinte sensible de cet indicateur va de ${nbf(defi.pKa - 1, 1)} à ${nbf(defi.pKa + 1, 1)}.`)}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température constante : 25 °C</strong>. Ka et le pKa ne dépendent que de la température ; la simulation ne la fait pas varier.</li>
      <li><strong>pH imposé</strong> : on suppose que le pH de la solution est fixé (par exemple par le mélange acide/base d’un tampon, ou parce que l’espèce étudiée est très diluée, comme un indicateur coloré) et n’est pas modifié par l’espèce étudiée. La simulation ne calcule pas ce que deviendrait le pH si l’on dissolvait l’acide dans l’eau pure (voir la simulation sur l’acide faible).</li>
      <li><strong>Activités ≈ concentrations</strong> : solutions diluées. [X] désigne la concentration divisée par c° = 1 mol·L⁻¹ ; Ka, les rapports et les logarithmes n’ont pas d’unité.</li>
      <li><strong>Relation pH = pKa + log</strong> {FRapport} : elle découle de la définition de Ka et est exacte dans ce modèle. Pour un couple dont l’acide est un ion (méthylammonium), l’acide AH est chargé et la base A est neutre : la relation est la même.</li>
      <li><strong>Teinte sensible</strong> : « 10 fois plus concentrée » est le critère habituel de perception de l’œil. C’est une convention commode, qui varie d’un observateur et d’un indicateur à l’autre.</li>
      <li><strong>Beer-Lambert</strong> : valable pour des solutions diluées, avec une seule espèce absorbante à la longueur d’onde choisie (ici Ind⁻) ; ε est supposé constant. Le spectrophotomètre virtuel est idéal et affiche 3 décimales.</li>
      <li><strong>Indicateur fictif</strong> : HInd / Ind⁻ (pKa 5,4 ; jaune / violet) est inventé pour la simulation. <strong>pKa des autres couples</strong> : valeurs usuelles à 25 °C arrondies au dixième, données et non à retrouver.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène, réglages, mesures ----------
  const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
  const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
  const scene = !(enGuide && idE === 'couple') && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{ind ? 'Indicateur coloré en solution' : 'Quelle forme du couple prédomine ?'}</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>L’axe donne le pH de la solution (repère rouge) et le pKa du couple ; les barres montrent la part de chaque forme.{ind ? ' Le tube montre la couleur de la solution.' : ''}</div>}
      <ScenePredo coupleId={coupleId} pH={pHVisible ? pHs : null} C={Cs} barres={barres} zones={zones} pKaVisible={pKaVisible}/>
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <label htmlFor="pd-couple" style={libelle}>Couple acide/base</label>
      <select id="pd-couple" value={ti.couple} onChange={ev => setTi(s => ({ ...s, couple: ev.target.value }))} style={{ ...selectStyle, marginBottom: 8 }}>
        {M.ORDRE.map(id => <option key={id} value={id}>{M.COUPLES[id].AH} / {M.COUPLES[id].A} · pKa {nbf(M.COUPLES[id].pKa, 1)}</option>)}
      </select>
      <Curseur nom="pH de la solution" valeur={ti.pH} onChange={v => setTi(s => ({ ...s, pH: v }))} min={0} max={14} pas={0.1} decimales={1} couleur="#b91c1c"/>
      {!ind && <>
        <label htmlFor="pd-c" style={libelle}>Concentration totale C (mol·L⁻¹)</label>
        <select id="pd-c" value={ti.C} onChange={ev => setTi(s => ({ ...s, C: Number(ev.target.value) }))} style={selectStyle}>
          {M.CONC.map(v => <option key={v} value={v}>{fmtC(v)}</option>)}
        </select>
      </>}
      {ind && <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Indicateur : C = {sci(M.IND.C, 2)}{NB}mol·L⁻¹, ε = {sci(M.IND.eps, 2)}{NB}L·mol⁻¹·cm⁻¹, ℓ = {nbf(M.IND.l, 2)}{NB}cm.</div>}
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>C est la somme des concentrations des deux formes du couple : C = [AH] + [A⁻].</div>
    </div>);
  const montrerMesures = enExplore || (enGuide && deja('egal'));
  const mesures = montrerMesures && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>pH imposé, pKa du couple et concentrations des deux formes.</div>}
      {pHVisible && <LigneMesure nom="pH" valeur={nbf(pHs, 2)} couleur="#b91c1c"/>}
      {pKaVisible && <LigneMesure nom="pKa du couple" valeur={nbf(c.pKa, 1)}/>}
      {pHVisible && pKaVisible && (enExplore || apres('ratio')) && <LigneMesure nom="pH − pKa" valeur={nbf(pHs - c.pKa, 2)}/>}
      {barres && <>
        <LigneMesure nom={`[${c.AH}]`} valeur={`${sci(e.AH, 2)}${NB}mol·L⁻¹`} couleur={COL.bleu}/>
        <LigneMesure nom={`[${c.A}]`} valeur={`${sci(e.A, 2)}${NB}mol·L⁻¹`} couleur={COL.orange}/>
      </>}
      {barres && (enExplore || apres('ratio')) && <LigneMesure nom={`Rapport frac([${c.A}]|[${c.AH}])`} valeur={e.r >= 100 ? sci(e.r, 2) : e.r < 0.01 ? sci(e.r, 2) : nbf(M.arrondiCS(e.r, 2), e.r >= 10 ? 0 : e.r >= 1 ? 1 : 2)} couleur={COL.vert}/>}
      {ind && (enExplore || deja('beer')) && <LigneMesure nom="Absorbance A (seule Ind⁻ absorbe)" valeur={fmtAbs(e.abs)} couleur={COL.vert}/>}
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Placez le pH exactement au pKa : que valent les deux concentrations ? Qu’indiquent les barres ?</li>
      <li>Montez le pH d’une unité au-dessus du pKa, puis de deux : de quel facteur le rapport {FRapport} change-t-il ?</li>
      <li>Changez la concentration totale C sans toucher au pH : que se passe-t-il pour le rapport ? Pour les concentrations ?</li>
      <li>Avec l’indicateur coloré, cherchez les pH où la couleur est jaune, violette, ou intermédiaire. Comparez avec pKa − 1 et pKa + 1.</li>
      <li>Avec l’indicateur coloré, relevez l’absorbance à pH = pKa : quelle fraction de l’absorbance maximale obtenez-vous ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>pH &lt; pKa : l’acide AH prédomine ; pH &gt; pKa : la base A⁻ prédomine ; pH = pKa : [AH] = [A⁻]</li>
        <li>pH = pKa + log({FRapport}) ; donc {FRapport} = 10<sup>pH − pKa</sup></li>
        <li>À pH = pKa ± 1 : un facteur 10 entre les deux formes ; à ± 2 : un facteur 100</li>
        <li>Conservation de la matière : C = [AH] + [A⁻]</li>
        <li>Indicateur coloré : teinte sensible de pKa − 1 à pKa + 1 ; Beer-Lambert A = ε · ℓ · [espèce absorbante]</li>
      </ul>
    </ARetenir>);
  const resume = `${c.AH} / ${c.A} · pH ${nbf(pHs, 1)}`;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pd-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pd-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pd-col { display: flex; flex-direction: column; gap: 12px; }
        .pd-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .pd-l1.cote .pd-carte { order: 2; } .pd-l1.cote .pd-main { order: 1; }
          .pd-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .pd-ex > * { grid-column: 1; }
          .pd-ex > .pd-reg { grid-column: 2; grid-row: 1 / span 3; }
        }
        @media (max-width: 900px) { .pd-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .pd-in { animation: pd-fondu 0.35s ease-out; } @keyframes pd-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>pH, pKa et espèce prédominante</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Dans un couple acide/base, c’est le <strong>pH</strong> comparé au <strong>pKa</strong> qui décide quelle forme <strong>prédomine</strong>. La relation <strong>pH = pKa + log</strong> {FRapport} donne le rapport des concentrations ; un <strong>indicateur coloré</strong> et la <strong>spectrophotométrie</strong> permettent de le vérifier.</div>
      {!enExplore && <div className={`pd-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="pd-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="pd-carte">{panneauHypo}</div>}
        <div className="pd-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'ratio' ? suiviR : suiviI}/></div>}
          {enGuide && <div className="pd-col">
            <Equation coupleId={coupleId}/>
            {scene && <div className="pd-in">{scene}</div>}
            {mesures && <div className="pd-in">{mesures}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="pd-ex">
          <Equation coupleId={coupleId}/>
          {scene}
          <div className="pd-reg">{reglages}</div>
          {mesures}
        </div>
        <Section titre={`Graphique : proportion de chaque forme selon le pH (${resume})`} ouvert={!!ouv.graphe} onBascule={() => bascule('graphe')}>
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Courbe bleue : part de l’acide AH ; courbe orange : part de la base A⁻. Elles se croisent à 50 % quand le pH est égal au pKa. Le trait rouge repère le pH choisi.</div>
          <GrapheRepartition coupleId={coupleId} pH={pHs}/>
        </Section>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('bilan'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
