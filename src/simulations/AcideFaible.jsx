import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./acideFaibleModele";
import { QCM } from "./acideFaibleQcm";
import { GrilleMolecules, GrapheAlpha, SvgFortFaible, SvgLogCS, SvgAlpha, SvgDilution, SvgKa, SvgPKa } from "./AcideFaibleSchemas";

const SIM_ID = 138, CLE_GUIDE = 'acide-faible-tstl-guide-v1';
declarerDefis(SIM_ID, [['inconnu', 'Un acide faible inconnu : α, Ka et pKa'], ['paire', 'Deux solutions : le même acide ou deux acides différents ?']]);

// ====================================================
//  SIM 138 — ACIDE FAIBLE : COEFFICIENT DE DISSOCIATION, CONSTANTE D'ACIDITÉ Ka, pKa (TSTL, enseignement PCM, séquence 2 « Réactions acido-basiques »).
//  Une seule idée : un acide faible ne réagit que partiellement avec l'eau ; on mesure la part qui réagit (α), on en tire Ka puis pKa, et l'on voit que
//  la dilution fait croître α alors que Ka reste constant. Notions : acide et base (Brønsted), acide faible, constante d'acidité, lien avec le
//  logarithme décimal. (La solution tampon fera l'objet d'une simulation voisine.) Aucun acide, aucune valeur ni situation des documents du Moodle.
//  Capacités visées (jamais affichées à l'élève) : écrire l'équation de la réaction d'un acide avec l'eau ; distinguer acide fort et acide faible par
//  le pH ; calculer un coefficient de dissociation et une constante d'acidité à partir d'un pH ; comparer des acides par leur pKa ; utiliser le logarithme décimal.
//  Modèle : acideFaibleModele.js (réutilise acidesBasesModele.js sans le modifier). Schémas : AcideFaibleSchemas.jsx. QCM : acideFaibleQcm.js.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sci = (v, cs = 2) => { const [m, e] = Number(v).toExponential(cs - 1).split('e'); return `${m.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => SUP[c]).join('')}`; };
const fmtC = c => ({ 0.1: '0,10', 0.05: '0,050', 0.02: '0,020', 0.01: '0,010', 0.005: '0,0050', 0.002: '0,0020', 0.001: '0,0010' }[c] ?? nbf(c, 4));
const fmtAlpha = v => { const r = M.arrondiCS(v, 2); return nbf(r, r < 0.1 ? 3 : 2); };
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', gris: '#64748b' };
const PRESET = { ac: 'c6h5', c: 0.010, vusC: [] };
const P = M.PARCOURS;
const mP = M.mesure(P.ac, P.C), mD = M.mesure(P.ac, P.Cdilue), m2 = M.mesure(P.autre, P.Cautre);
const hP = sci(mP.h, 2), AHP = sci(mP.AH, 2), KaP = sci(mP.Ka, 2), KaD = sci(mD.Ka, 2);

// ---------- formules (MathML) ----------
const H3O = <><msub><mi mathvariant="normal">H</mi><mn>3</mn></msub><msup><mi mathvariant="normal">O</mi><mo>+</mo></msup></>;
const conc = x => <><mo>[</mo>{x}<mo>]</mo></>;
const Am = <msup><mi mathvariant="normal">A</mi><mo>−</mo></msup>;
const C0 = <msub><mi>C</mi><mn>0</mn></msub>;
const Kamath = <msub><mi>K</mi><mi mathvariant="normal">a</mi></msub>;
const FpH = <Formule><mi>pH</mi><mo>=</mo><mo>−</mo><mi>log</mi><mfrac><mrow>{conc(H3O)}</mrow><mrow><msup><mi>c</mi><mo>°</mo></msup></mrow></mfrac></Formule>;
const Falpha = <Formule><mi>α</mi><mo>=</mo><mfrac><mrow>{conc(Am)}</mrow><mrow>{C0}</mrow></mfrac></Formule>;
const Fconserv = <Formule>{C0}<mo>=</mo>{conc(<mi mathvariant="normal">AH</mi>)}<mo>+</mo>{conc(Am)}</Formule>;
const FKa = <Formule>{Kamath}<mo>=</mo><mfrac><mrow>{conc(Am)}<mo>·</mo>{conc(H3O)}</mrow><mrow>{conc(<mi mathvariant="normal">AH</mi>)}</mrow></mfrac></Formule>;
const FracA = <FormuleEnLigne><mfrac><mrow>{conc(Am)}</mrow><mrow>{C0}</mrow></mfrac></FormuleEnLigne>;
const FracKa = <FormuleEnLigne><mfrac><mrow>{conc(Am)}<mo>·</mo>{conc(H3O)}</mrow><mrow>{conc(<mi mathvariant="normal">AH</mi>)}</mrow></mfrac></FormuleEnLigne>;
const FpKa = <Formule><mi>pKa</mi><mo>=</mo><mo>−</mo><mi>log</mi>{Kamath}</Formule>;

// ---------- équation de la réaction, toujours en tête ----------
const Esp = ({ children }) => <span style={{ whiteSpace: 'nowrap' }}>{children}</span>;
function Equation({ ac, C }) {
  const a = M.ACIDES[ac];
  return (
    <div style={{ ...styleBoite, textAlign: 'center' }}>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4 }}>Solution d’{a.nom}</div>
      <div style={{ fontSize: 17, color: KIT.txt, lineHeight: 1.6 }} aria-label="Équation de la réaction de l’acide avec l’eau">
        <Esp>{a.AH}(aq)</Esp> + <Esp>H₂O(ℓ)</Esp> <Esp>{a.fort ? '→' : '⇌'}</Esp> <Esp>{a.A}(aq)</Esp> + <Esp>H₃O⁺(aq)</Esp>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>Concentration en soluté apporté <strong>C₀ = {fmtC(C)}{NB}mol·L⁻¹</strong>, à 25{NB}°C</div>
    </div>);
}
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };

// ---------- tableau comparatif des acides faibles à la même concentration ----------
function TableauAcides({ C, courant }) {
  const th = { padding: '2px 4px' }, td = { padding: '3px 4px', fontFamily: 'monospace' };
  return (
    <table style={{ width: '100%', fontSize: 13.5, borderCollapse: 'collapse' }}>
      <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={th}>Acide</th><th style={th}>pKa</th><th style={th}>pH</th><th style={th}>α</th></tr></thead>
      <tbody>{M.FAIBLES.map(id => { const a = M.ACIDES[id], m = M.mesure(id, C); return (
        <tr key={id} style={{ borderTop: `1px dashed ${KIT.bord}`, fontWeight: id === courant ? 700 : 400, background: id === courant ? '#fff7ed' : 'transparent' }}>
          <td style={{ padding: '3px 4px' }}>{a.AH}</td><td style={td}>{nbf(a.pKa, 1)}</td><td style={td}>{nbf(m.pH, 2)}</td><td style={td}>{fmtAlpha(m.alpha)}</td></tr>); })}</tbody>
    </table>);
}

// ====================================================
export function SimulationAcideFaible() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviI, noterI] = useCompteurDefi(), [suiviP, noterP] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('inconnu');
  const [ouv, setOuv] = useState({});
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- étapes du parcours ----------
  const IDS = ['fort', 'logfort', 'faible', 'h', 'ah', 'alpha', 'sur100', 'dilu', 'kadef', 'ka', 'kadilue', 'kaconst', 'pka', 'alpha2', 'compar', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- situation affichée (acide, concentration) ----------
  const scGuide = { fort: ['hbr', 0.010], logfort: ['hbr', 0.020], faible: [P.ac, P.C], h: [P.ac, P.C], ah: [P.ac, P.C], alpha: [P.ac, P.C], sur100: [P.ac, P.C], dilu: [P.ac, ti.c],
    kadef: [P.ac, P.C], ka: [P.ac, P.C], kadilue: [P.ac, P.Cdilue], kaconst: [P.ac, P.Cdilue], pka: [P.ac, P.C], alpha2: [P.autre, P.Cautre], compar: [P.autre, P.Cautre], bilan: [P.ac, P.C] };
  const [acId, C] = enGuide ? scGuide[idE] : [ti.ac, ti.c];
  const a = M.ACIDES[acId], m = M.mesure(acId, C);
  const cacher = enGuide && (idE === 'alpha2');                    // le nombre de cases colorées donnerait α
  const cacherMes = enGuide && (idE === 'kadilue' || idE === 'alpha2');   // les mesures intermédiaires donneraient la réponse
  const bloqueDilu = ti.vusC.includes(P.Cdilue) ? null : 'Choisissez d’abord la concentration 0,0010 mol·L⁻¹ dans le menu « Concentration C₀ » (sous le schéma).';
  const choisirC = c => setTi(s => ({ ...s, c, vusC: s.vusC.includes(c) ? s.vusC : [...s.vusC, c] }));

  const ETAPES = [
    { id: 'fort', titre: 'Un acide fort dans l’eau', focus: ['scene'],
      texte: <>Un <strong>acide</strong> est une espèce capable de <strong>céder un proton</strong> H⁺ ; une <strong>base</strong> est une espèce capable d’en <strong>capter un</strong>. Dans l’eau, l’acide cède son proton à H₂O (qui joue le rôle de base) et forme un ion oxonium H₃O⁺. On introduit de l’<strong>acide bromhydrique</strong> HBr, de concentration en soluté apporté C₀ = 0,010{NB}mol·L⁻¹ (quantité de matière introduite par litre de solution). Dans l’équation écrite en haut, la <strong>flèche simple</strong> → signifie que la transformation est quasi totale.</>,
      tache: { type: 'qcm', q: 'Dans l’état final, que reste-t-il de HBr ?', ...QCM.fort,
        expl: 'La flèche simple indique une transformation quasi totale : presque toutes les molécules HBr ont cédé leur proton à l’eau. HBr est un acide fort : il ne reste presque plus d’acide, quelle que soit la concentration.', indice: 'Regardez la flèche de l’équation : → signifie que la réaction va jusqu’à la disparition quasi complète du réactif qui manque (ici l’acide).' } },
    { id: 'logfort', titre: 'Le pH d’un acide fort', focus: ['scene'],
      texte: <>Pour un acide fort, chaque molécule introduite donne un ion oxonium : [H₃O⁺] = C₀. Le pH se calcule avec le <strong>logarithme décimal</strong> : {FpH}où c° = 1{NB}mol·L⁻¹ est la concentration standard (le pH n’a pas d’unité). Nouvelle solution : acide bromhydrique à C₀ = 0,020{NB}mol·L⁻¹.</>,
      tache: { type: 'num', q: 'pH de la solution d’acide bromhydrique', unite: '(sans unité)', vrai: -Math.log10(0.020), tol: 0.05, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => ['Acide fort : [H₃O⁺] = C₀ = 0,020 mol·L⁻¹.', 'pH = −log(0,020) = 1,70.'],
        pieges: [[0.020, 'C’est la concentration [H₃O⁺], pas le pH : pH = −log(frac([H₃O⁺]|c°)).'], [-1.699, 'Le pH est positif ici : log(0,020) est négatif, donc −log(0,020) est positif.'], [3.912, 'Vous avez utilisé ln au lieu de log (logarithme décimal).']],
        expl: 'pH = −log(0,020) = 1,70.', indice: 'Pour un acide fort, [H₃O⁺] = C₀. Calculez ensuite −log(C₀) avec la touche log de la calculatrice.' } },
    { id: 'faible', titre: 'Un acide faible : le test du pH', focus: ['scene', 'mesures'],
      texte: <>On dissout maintenant de l’<strong>acide benzoïque</strong> C₆H₅COOH (un conservateur alimentaire) à la même concentration C₀ = 0,010{NB}mol·L⁻¹. L’équation s’écrit avec une <strong>double flèche</strong> ⇌ : la réaction est limitée, les deux sens se produisent. Le pH-mètre indique pH = {nbf(mP.pH, 2)}, alors qu’un acide fort à cette concentration donnerait pH = −log C₀ = {nbf(M.pHFort(P.C), 2)} (valeurs dans « Mesures »).</>,
      tache: { type: 'qcm', q: 'Que conclut-on pour l’acide benzoïque ?', ...QCM.faible,
        expl: `Un acide fort donnerait pH = −log C₀ = ${nbf(M.pHFort(P.C), 2)}. Le pH mesuré (${nbf(mP.pH, 2)}) est plus élevé : il y a moins d’ions oxonium que si tout l’acide avait réagi. L’acide benzoïque est un acide faible.`, indice: 'Plus il y a d’ions oxonium, plus le pH est bas. Comparez le pH mesuré à la valeur qu’aurait un acide fort.' } },
    { id: 'h', titre: 'Du pH à la concentration', focus: ['mesures'],
      retenirTitre: 'À RETENIR : ACIDE FORT OU ACIDE FAIBLE ?',
      retenir: <>
        <SvgFortFaible/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>On compare le pH mesuré à <strong>−log C₀</strong> : <strong>pH = −log C₀ ⇒ acide fort</strong> (réaction quasi totale, flèche →) ; <strong>pH &gt; −log C₀ ⇒ acide faible</strong> (réaction limitée, flèche ⇌).</li>
          <li>Exemple de la simulation : C₀ = 0,010{NB}mol·L⁻¹, pH mesuré {nbf(mP.pH, 2)} contre {nbf(M.pHFort(P.C), 2)} pour un acide fort.</li>
          <li>Idée fausse : « un acide fort est un acide concentré ». Vrai : fort ou faible dépend de la façon de réagir avec l’eau, pas de C₀.</li>
        </ul></>,
      texte: <>Pour exploiter le pH, on revient à la concentration. Comme pH = −log(frac([H₃O⁺]|c°)) avec c° = 1{NB}mol·L⁻¹, on obtient [H₃O⁺] = 10^(−pH) en mol·L⁻¹. Solution d’acide benzoïque : C₀ = 0,010{NB}mol·L⁻¹ et pH = {nbf(mP.pH, 2)}.</>,
      tache: { type: 'num', q: 'Concentration en ions oxonium [H₃O⁺]', unite: 'mol·L⁻¹', vrai: mP.h, tol: 0.05, affiche: v => sci(v, 2), cs: 2,
        calcul: () => [`[H₃O⁺] = 10^(−pH) = 10^(−${nbf(mP.pH, 2)}) mol·L⁻¹.`, `[H₃O⁺] = ${hP} mol·L⁻¹ (2 décimales pour le pH ⇔ 2 chiffres significatifs pour la concentration).`],
        pieges: [[Math.pow(10, mP.pH), 'Le signe de l’exposant est oublié : [H₃O⁺] = 10^(−pH), un nombre inférieur à 1.'], [mP.pH, 'C’est le pH : on demande la concentration en ions oxonium.'], [0.0010, 'Vous avez arrondi le pH à 3 : gardez les deux décimales du pH.'], [Math.exp(-mP.pH), 'Vous avez utilisé la touche eˣ : pour un pH, c’est la touche 10ˣ (puissance de dix).']],
        expl: `[H₃O⁺] = 10^(−${nbf(mP.pH, 2)}) = ${hP} mol·L⁻¹.`, indice: 'Utilisez la touche 10ˣ de la calculatrice avec l’opposé du pH : 10^(−pH).' } },
    { id: 'ah', titre: 'Conservation de la matière', focus: ['mesures'],
      retenirTitre: 'À RETENIR : pH ET CONCENTRATION',
      retenir: <>
        <SvgLogCS/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>pH = −log [H₃O⁺]</strong> (touche <strong>log</strong>, puis signe −) ; <strong>[H₃O⁺] = 10<sup>−pH</sup></strong> (touche <strong>10ˣ</strong>).</li>
          <li><strong>2 décimales pour le pH ⇔ 2 chiffres significatifs pour [H₃O⁺]</strong>. Exemple : pH = 3,40 ⇔ [H₃O⁺] = 4,0×10⁻⁴{NB}mol·L⁻¹.</li>
          <li>Piège : un pH plus petit de 1 unité, c’est une concentration <strong>10 fois</strong> plus grande, pas « un peu plus ».</li>
        </ul></>,
      texte: <>Chaque ion A⁻ formé s’accompagne d’un ion H₃O⁺ : [A⁻] = [H₃O⁺] (l’eau pure apporte beaucoup moins d’ions que l’acide). La matière se conserve : l’acide introduit est soit resté sous forme AH, soit transformé en A⁻ : {Fconserv}Solution d’acide benzoïque : [H₃O⁺] = [C₆H₅COO⁻] = {hP}{NB}mol·L⁻¹ et C₀ = 0,010{NB}mol·L⁻¹.</>,
      tache: { type: 'num', q: 'Concentration en acide benzoïque restant [C₆H₅COOH]', unite: 'mol·L⁻¹', vrai: mP.AH, tol: 0.05, affiche: v => sci(v, 2), cs: 2,
        calcul: () => ['[AH] = C₀ − [A⁻] (conservation de la matière).', `[AH] = 0,010 − ${hP.replace(/\u00a0/g, ' ')} = ${AHP} mol·L⁻¹.`],
        pieges: [[0.010, 'C’est C₀ : il faut retrancher la quantité d’acide transformée en A⁻.'], [mP.h, 'C’est [A⁻] : [AH] est ce qui reste, soit C₀ − [A⁻].'], [0.010 + mP.h, 'Il faut soustraire [A⁻] à C₀, pas l’ajouter.']],
        expl: `[AH] = C₀ − [A⁻] = ${AHP} mol·L⁻¹ : l’essentiel de l’acide est resté sous forme AH.`, indice: 'Écrivez C₀ = [AH] + [A⁻] et isolez [AH] ; [A⁻] est la valeur de [H₃O⁺] trouvée à l’étape précédente.' } },
    { id: 'alpha', titre: 'Le coefficient de dissociation α', focus: ['mesures'],
      texte: <>La part d’acide qui a réagi se mesure par le <strong>coefficient de dissociation</strong> {Falpha}α est sans unité, compris entre 0 et 1. Acide benzoïque : [A⁻] = {hP}{NB}mol·L⁻¹ et C₀ = 0,010{NB}mol·L⁻¹.</>,
      tache: { type: 'num', q: 'Coefficient de dissociation α', unite: '(sans unité)', vrai: mP.alpha, tol: 0.06, affiche: v => fmtAlpha(v), cs: 2,
        calcul: () => ['α = frac([A⁻]|C₀)', `α = frac(${hP.replace(/\u00a0/g, ' ')}|0,010) = ${fmtAlpha(mP.alpha)} (sans unité).`],
        pieges: [[0.010 / mP.h, 'Le rapport est inversé : α = frac([A⁻]|C₀), un nombre inférieur à 1.'], [mP.alpha * 100, 'α est un nombre entre 0 et 1 : 7,6 % s’écrit 0,076.'], [1 - mP.alpha, 'C’est la part d’acide qui n’a pas réagi ; α est la part qui a réagi.'], [mP.h, 'C’est [A⁻] en mol·L⁻¹ : il faut encore le diviser par C₀.']],
        expl: `α = ${hP.replace(/\u00a0/g, ' ')} divisé par 0,010 = ${fmtAlpha(mP.alpha)} : moins de 8 % des molécules ont réagi, l’acide est faible.`, indice: 'α = [A⁻] divisé par C₀ : les deux concentrations sont en mol·L⁻¹, le résultat n’a pas d’unité.' } },
    { id: 'sur100', titre: 'Se représenter α : 100 molécules', focus: ['scene'],
      retenirTitre: 'À RETENIR : LE COEFFICIENT DE DISSOCIATION α',
      retenir: <>
        <SvgAlpha/>
        {Falpha}
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>α est sans unité, entre 0 et 1 : <strong>acide fort : α = 1</strong> ; <strong>acide faible : α &lt; 1</strong>.</li>
          <li>α × 100 = nombre de molécules sur 100 qui ont réagi. Exemple : α = 0,10 ⇔ 10 molécules sur 100.</li>
          <li>Moyen de s’en souvenir : <strong>« α, c’est la part de l’acide qui a réagi »</strong>.</li>
        </ul></>,
      texte: <>Imaginons <strong>100 molécules</strong> d’acide benzoïque introduites dans l’eau : le schéma les représente par 100 cases, <strong>colorées</strong> quand la molécule a réagi avec l’eau, claires sinon. Rappel : α = {fmtAlpha(mP.alpha)}.</>,
      tache: { type: 'num', q: 'Combien de molécules sur 100 ont réagi avec l’eau ?', unite: 'molécules', vrai: M.nbTransformees(mP.alpha), tol: 0.06, affiche: v => nbf(v, 0), cs: 1,
        calcul: () => [`α × 100 = ${fmtAlpha(mP.alpha)} × 100 = ${nbf(mP.alpha * 100, 1)} molécules sur 100.`, 'Le schéma arrondit à l’unité : 8 cases colorées.'],
        pieges: [[100 - M.nbTransformees(mP.alpha), 'C’est le nombre de molécules restées sous forme acide (100 moins le nombre qui ont réagi).'], [mP.alpha * 1000, 'α × 100, pas α × 1000 : 0,076 donne environ 8 molécules sur 100.']],
        expl: 'α × 100 ≈ 8 : environ 8 molécules sur 100 ont réagi, les 92 autres sont restées sous forme C₆H₅COOH.', indice: 'Comptez les cases colorées, ou calculez α × 100 (α = 0,076).' } },
    { id: 'dilu', titre: 'Effet de la dilution', focus: ['scene', 'reglage'],
      texte: <>Voyons si α dépend de la concentration. Avec le menu « Concentration C₀ » sous le schéma, passez de 0,010 à 0,0010{NB}mol·L⁻¹ (<strong>dilution par 10</strong>) et observez les cases colorées.</>,
      tache: { type: 'qcm', q: 'Quand on dilue l’acide benzoïque de 0,010 à 0,0010 mol·L⁻¹, son coefficient de dissociation α…', ...QCM.dilu, bloque: bloqueDilu,
        expl: 'Plus la solution est diluée, plus la part d’acide qui réagit avec l’eau est grande : α augmente. L’acide reste faible (α < 1), mais il réagit « mieux » quand il est dilué.', indice: 'Comptez les cases colorées pour C₀ = 0,010 puis pour C₀ = 0,0010 mol·L⁻¹.' } },
    { id: 'kadef', titre: 'La constante d’acidité Ka', focus: ['scene'],
      retenirTitre: 'À RETENIR : LA DILUTION FAIT AUGMENTER α',
      retenir: <>
        <SvgDilution c1={P.C} c2={P.Cdilue} a1={mP.alpha} a2={mD.alpha}/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Plus on dilue, plus α augmente</strong> : l’acide faible réagit davantage avec l’eau, sans jamais devenir un acide fort.</li>
          <li>Exemple de la simulation : acide benzoïque, de 0,010 à 0,0010{NB}mol·L⁻¹ (÷ 10), α passe de {fmtAlpha(mP.alpha)} à {fmtAlpha(mD.alpha)}.</li>
          <li>Moyen de s’en souvenir : <strong>« plus il y a d’eau, plus l’acide réagit »</strong>.</li>
        </ul></>,
      texte: <>Un acide faible atteint un état d’équilibre : les concentrations vérifient alors une relation constante, la <strong>constante d’acidité</strong> Ka du couple AH / A⁻, associée à la réaction AH + H₂O ⇌ A⁻ + H₃O⁺ : {FKa}(concentrations en mol·L⁻¹, divisées par c° = 1{NB}mol·L⁻¹ : Ka n’a pas d’unité). L’eau, solvant, n’apparaît pas dans Ka.</>,
      tache: { type: 'qcm', q: 'Quelle équation de réaction est associée à la constante Ka du couple C₆H₅COOH / C₆H₅COO⁻ ?', ...QCM.kadef,
        expl: 'Ka est associée à la réaction de l’acide avec l’eau : C₆H₅COOH + H₂O ⇌ C₆H₅COO⁻ + H₃O⁺. La deuxième équation est celle de la base avec l’eau, la troisième celle de l’eau avec elle-même, la dernière une réaction avec une base forte.', indice: 'Ka contient [H₃O⁺] au numérateur : la réaction associée a H₃O⁺ parmi ses produits et l’acide AH parmi ses réactifs.' } },
    { id: 'ka', titre: 'Calculer Ka avec une mesure de pH', focus: ['mesures'],
      retenirTitre: 'À RETENIR : LA CONSTANTE D’ACIDITÉ Ka',
      retenir: <>
        <SvgKa/>
        {FKa}
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Ka est sans unité : <strong>produits au numérateur, acide au dénominateur</strong>, l’eau n’y figure pas.</li>
          <li>Avec le pH : [A⁻] = [H₃O⁺] = 10<sup>−pH</sup> et [AH] = C₀ − [H₃O⁺].</li>
          <li>Moyen de s’en souvenir : <strong>« Ka ne dépend que du couple et de la température »</strong>.</li>
        </ul></>,
      texte: <>Acide benzoïque, C₀ = 0,010{NB}mol·L⁻¹, pH = {nbf(mP.pH, 2)}. Valeurs déjà calculées : [H₃O⁺] = [C₆H₅COO⁻] = {hP}{NB}mol·L⁻¹ et [C₆H₅COOH] = {AHP}{NB}mol·L⁻¹. Appliquez la définition de Ka.</>,
      tache: { type: 'num', q: 'Constante d’acidité Ka du couple C₆H₅COOH / C₆H₅COO⁻', unite: '(sans unité)', vrai: mP.Ka, tol: 0.05, affiche: v => sci(v, 2), cs: 2,
        calcul: () => ['Ka = frac([A⁻] × [H₃O⁺]|[AH])', `Ka = frac((${hP.replace(/\u00a0/g, ' ')})²|${AHP.replace(/\u00a0/g, ' ')}) = ${KaP} (sans unité).`, 'Hypothèses : 25 °C, activités assimilées aux concentrations.'],
        pieges: [[mP.h * mP.h, 'Il faut diviser par [AH] : Ka = frac([A⁻] × [H₃O⁺]|[AH]).'], [mP.h / mP.AH, 'Il manque un facteur [H₃O⁺] : les deux concentrations des produits sont au numérateur.'], [mP.AH / (mP.h * mP.h), 'Le rapport est inversé : les produits sont au numérateur.'], [mP.h * mP.h / 0.010, 'Au dénominateur, c’est [AH] = C₀ − [A⁻] (9,2×10⁻³), pas C₀.', 0.03]],
        expl: `Ka = (${hP.replace(/\u00a0/g, ' ')})² divisé par ${AHP.replace(/\u00a0/g, ' ')} = ${KaP}.`, indice: '[A⁻] = [H₃O⁺] : le numérateur est [H₃O⁺] au carré. Le dénominateur est [AH], déjà calculée.' } },
    { id: 'kadilue', titre: 'Ka dépend-il de la dilution ?', focus: ['scene', 'mesures'],
      texte: <>On dilue : C₀ = 0,0010{NB}mol·L⁻¹. Le pH-mètre indique pH = {nbf(mD.pH, 2)}. Refaites le même calcul que pour la solution précédente (concentration en ions oxonium, concentration en acide restant, puis Ka).</>,
      tache: { type: 'num', q: 'Constante d’acidité Ka de l’acide benzoïque, solution diluée', unite: '(sans unité)', vrai: mD.Ka, tol: 0.08, affiche: v => sci(v, 2), cs: 2,
        calcul: () => [`[H₃O⁺] = [A⁻] = 10^(−${nbf(mD.pH, 2)}) = ${sci(mD.h, 2).replace(/\u00a0/g, ' ')} mol·L⁻¹.`, `[AH] = C₀ − [A⁻] = 1,0×10⁻³ − ${sci(mD.h, 2).replace(/\u00a0/g, ' ')} = ${sci(mD.AH, 2).replace(/\u00a0/g, ' ')} mol·L⁻¹.`, `Ka = frac((${sci(mD.h, 2).replace(/\u00a0/g, ' ')})²|${sci(mD.AH, 2).replace(/\u00a0/g, ' ')}) = ${KaD} (sans unité).`],
        pieges: [[mD.h * mD.h / 0.0010, 'À cette dilution, α est grand : [AH] = C₀ − [A⁻] est nettement plus petite que C₀ (près d’un quart de moins). Il faut soustraire.'], [mD.h * mD.h, 'Il faut diviser par [AH] : Ka = frac([A⁻] × [H₃O⁺]|[AH]).'], [mD.AH / (mD.h * mD.h), 'Le rapport est inversé : les produits sont au numérateur.']],
        expl: `Ka = ${KaD} : presque la même valeur que pour la solution dix fois plus concentrée (${KaP}).`, indice: 'Même démarche qu’à l’étape précédente : [H₃O⁺] = 10^(−pH), [AH] = C₀ − [H₃O⁺], puis Ka = [H₃O⁺]² divisé par [AH].' } },
    { id: 'kaconst', titre: 'Ce qui varie, ce qui reste constant', focus: ['scene', 'mesures'],
      texte: <>Bilan des deux solutions d’acide benzoïque : à C₀ = 0,010{NB}mol·L⁻¹, α = {fmtAlpha(mP.alpha)} et Ka ≈ {KaP} ; à C₀ = 0,0010{NB}mol·L⁻¹, α = {fmtAlpha(mD.alpha)} et Ka ≈ {KaD}. Les deux valeurs de Ka sont égales à la précision de la mesure près (pH donné à 2 décimales).</>,
      tache: { type: 'qcm', q: 'Que peut-on dire de Ka et de α quand on dilue ?', ...QCM.kaconst,
        expl: 'Ka est une propriété du couple acide-base (à température donnée) : elle ne dépend pas de la concentration. α, lui, augmente quand on dilue : l’état d’équilibre se déplace, mais le quotient Ka reste le même.', indice: 'Comparez les deux valeurs de Ka (≈ 6×10⁻⁵ dans les deux cas), puis les deux valeurs de α.' } },
    { id: 'pka', titre: 'Le pKa', focus: ['mesures'],
      texte: <>Comme pour le pH, on utilise une échelle logarithmique plus commode : {FpKa}Pour l’acide benzoïque, on a trouvé Ka = {KaP}.</>,
      tache: { type: 'num', q: 'pKa du couple C₆H₅COOH / C₆H₅COO⁻', unite: '(sans unité)', vrai: mP.pKa, tol: 0.02, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => [`pKa = −log Ka = −log(${KaP.replace(/\u00a0/g, ' ')}).`, `pKa = ${nbf(mP.pKa, 2)} (la valeur usuelle à 25 °C est 4,2).`],
        pieges: [[-mP.pKa, 'Le signe est inversé : Ka est inférieur à 1, donc log Ka est négatif et −log Ka est positif.'], [mP.Ka, 'C’est Ka lui-même : le pKa est −log Ka.'], [-Math.log(mP.Ka), 'Vous avez utilisé ln au lieu de log (logarithme décimal).']],
        expl: `pKa = −log(${KaP.replace(/\u00a0/g, ' ')}) = ${nbf(mP.pKa, 2)}.`, indice: 'Même démarche que pour le pH : −log de Ka, avec la touche log de la calculatrice.' } },
    { id: 'alpha2', titre: 'Un autre acide faible', focus: ['scene', 'mesures'],
      retenirTitre: 'À RETENIR : LE pKa, ÉCHELLE DE FORCE',
      retenir: <>
        <SvgPKa/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>pKa = −log Ka</strong> (sans unité). À même concentration : <strong>pKa petit ⇔ Ka grand ⇔ α grand ⇔ pH bas ⇔ acide plus fort</strong>.</li>
          <li>Exemple de la simulation : l’acide chloroéthanoïque (pKa 2,9) est plus dissocié que l’acide benzoïque (pKa 4,2).</li>
          <li>Piège : on compare les acides avec Ka ou pKa, pas avec le pH de solutions de concentrations différentes.</li>
        </ul></>,
      texte: <>Autre acide faible : l’<strong>acide chloroéthanoïque</strong> ClCH₂COOH, à la même concentration C₀ = 0,010{NB}mol·L⁻¹. Le pH-mètre indique pH = {nbf(m2.pH, 2)}. Calculez son coefficient de dissociation comme pour l’acide benzoïque.</>,
      tache: { type: 'num', q: 'Coefficient de dissociation α de l’acide chloroéthanoïque', unite: '(sans unité)', vrai: m2.alpha, tol: 0.06, affiche: v => fmtAlpha(v), cs: 2,
        calcul: () => [`[A⁻] = [H₃O⁺] = 10^(−${nbf(m2.pH, 2)}) = ${sci(m2.h, 2).replace(/\u00a0/g, ' ')} mol·L⁻¹.`, `α = frac([A⁻]|C₀) = frac(${sci(m2.h, 2).replace(/\u00a0/g, ' ')}|0,010) = ${fmtAlpha(m2.alpha)} (sans unité).`],
        pieges: [[m2.h, 'C’est [A⁻] en mol·L⁻¹ : il faut encore le diviser par C₀.'], [1 - m2.alpha, 'C’est la part d’acide qui n’a pas réagi ; α est la part qui a réagi.'], [0.010 / m2.h, 'Le rapport est inversé : α = frac([A⁻]|C₀).']],
        expl: `α = ${sci(m2.h, 2).replace(/\u00a0/g, ' ')} divisé par 0,010 = ${fmtAlpha(m2.alpha)} : environ 30 molécules sur 100 ont réagi.`, indice: 'α = [A⁻] divisé par C₀, avec [A⁻] = [H₃O⁺] = 10^(−pH).' } },
    { id: 'compar', titre: 'Comparer la force de deux acides', focus: ['scene', 'mesures'],
      texte: <>À la même concentration C₀ = 0,010{NB}mol·L⁻¹ : l’acide benzoïque (pKa 4,2) a un coefficient α = {fmtAlpha(mP.alpha)} et l’acide chloroéthanoïque (pKa 2,9) a un coefficient α = {fmtAlpha(m2.alpha)}. On prépare maintenant une solution d’un troisième acide faible, de pKa 4,9, à la même concentration.</>,
      tache: { type: 'qcm', q: 'Pour ce troisième acide, le coefficient de dissociation α sera…', ...QCM.compar,
        expl: 'Un pKa plus grand signifie un Ka plus petit : l’acide réagit moins avec l’eau, donc α est plus petit que pour l’acide benzoïque (0,076).', indice: 'Placez 4,9 sur l’échelle des pKa, à côté de 4,2 et 2,9 : plus le pKa est grand, plus l’acide est faible.' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      texte: <>Vous savez écrire la réaction d’un acide avec l’eau, distinguer un acide fort d’un acide faible avec le pH, calculer un coefficient de dissociation α et une constante d’acidité Ka à partir d’un pH, passer au pKa avec le logarithme décimal, et vous savez que la dilution fait augmenter α sans changer Ka. Explorez maintenant tous les acides, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'inconnu' ? { ...M.tirageInconnu(), reps: { alpha: '', ka: '' }, verifie: false } : { ...M.tiragePaire(), reps: { ka2: '', choix: null }, verifie: false });
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') setTi(PRESET);
    if (md === 'explore') setTi(s => ({ ...PRESET, ...s }));
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'inconnu') {
      const al = lireNombre(defi.reps.alpha), ka = lireNombre(defi.reps.ka);
      const ok = isFinite(al) && isFinite(ka) && proche(al, defi.alpha, 0.06) && proche(ka, defi.Ka, 0.10);
      setDefi(d => ({ ...d, verifie: true, ok })); noterI(ok);
    } else {
      const ka = lireNombre(defi.reps.ka2);
      const ok = isFinite(ka) && proche(ka, defi.s2.Ka, 0.10) && defi.reps.choix === (defi.meme ? 'meme' : 'diff');
      setDefi(d => ({ ...d, verifie: true, ok })); noterP(ok);
    }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (cle, aria, ok) => (
    <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e => e.key === 'Enter' && document.getElementById('af-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e.target.value }, verifie: false }))} inputMode="decimal"
      style={{ width: 120, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['inconnu', 'Un acide inconnu : α, Ka et pKa'], ['paire', 'Même acide ou acides différents ?']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'inconnu' ? 'Défi : caractériser un acide faible inconnu' : 'Défi : deux solutions, un seul acide ou deux acides différents ?'}</div>
      {defi.type === 'inconnu' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>On dissout un acide faible inconnu AH dans l’eau : concentration en soluté apporté <strong>C₀ = {fmtC(defi.C)}{NB}mol·L⁻¹</strong>, à 25{NB}°C. Le pH-mètre indique <strong>pH = {nbf(defi.pH, 2)}</strong>. Calculez le coefficient de dissociation α puis la constante d’acidité Ka (2 chiffres significatifs, sans unité).</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>α =</span>{champ('alpha', 'Coefficient de dissociation alpha', defi.ok || proche(lireNombre(defi.reps.alpha), defi.alpha, 0.06))}
          <span>Ka =</span>{champ('ka', 'Constante d’acidité Ka', defi.ok || proche(lireNombre(defi.reps.ka), defi.Ka, 0.10))}<span>(écriture 6,2e-5 acceptée)</span>
        </div>
        <IndiceDefi cache={false}>[H₃O⁺] = [A⁻] = 10<sup>−pH</sup> ; α = [A⁻] divisé par C₀ ; [AH] = C₀ − [A⁻] ; Ka = [A⁻]·[H₃O⁺] divisé par [AH]. Gardez un chiffre significatif de plus dans les calculs intermédiaires.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Deux solutions d’acides faibles sont préparées à 25{NB}°C. La constante d’acidité de la solution 1 est donnée ; pour la solution 2, on ne connaît que C₀ et le pH. Calculez Ka pour la solution 2 (2 chiffres significatifs), puis dites si les deux solutions contiennent le même acide.</div>
        <table style={{ width: '100%', fontSize: 13.5, borderCollapse: 'collapse', marginBottom: 8 }}>
          <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 4px' }}>Solution</th><th style={{ padding: '2px 4px' }}>C₀ (mol·L⁻¹)</th><th style={{ padding: '2px 4px' }}>pH</th><th style={{ padding: '2px 4px' }}>Ka</th></tr></thead>
          <tbody>
            <tr style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 4px', fontWeight: 700 }}>1</td><td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{fmtC(defi.s1.C)}</td><td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{nbf(defi.s1.pH, 2)}</td><td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{sci(defi.s1.KaAff, 2)}</td></tr>
            <tr style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 4px', fontWeight: 700 }}>2</td><td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{fmtC(defi.s2.C)}</td><td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{nbf(defi.s2.pH, 2)}</td><td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>à calculer</td></tr>
          </tbody>
        </table>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Ka (solution 2) =</span>{champ('ka2', 'Constante d’acidité de la solution 2', defi.ok || proche(lireNombre(defi.reps.ka2), defi.s2.Ka, 0.10))}<span>(écriture 6,2e-5 acceptée)</span>
        </div>
        <div role="group" aria-label="Même acide ou non" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {[['meme', 'Le même acide'], ['diff', 'Deux acides différents']].map(([k, l]) => <button key={k} onClick={() => setDefi(d => ({ ...d, reps: { ...d.reps, choix: k }, verifie: false }))} aria-pressed={defi.reps.choix === k}
            style={stylePetitBouton(defi.reps.choix === k, defi.verifie ? ((defi.meme ? 'meme' : 'diff') === k ? '#15803d' : '#dc2626') : '#475569')}>{l}</button>)}
        </div>
        <IndiceDefi cache={false}>Pour la solution 2 : [A⁻] = [H₃O⁺] = 10<sup>−pH</sup>, [AH] = C₀ − [A⁻], Ka = [A⁻]·[H₃O⁺] divisé par [AH]. Ka ne dépend que du couple : comparez-le à celui de la solution 1 (aux incertitudes de mesure près, quelques pourcents).</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="af-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'inconnu'
          ? (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + `[H₃O⁺] = ${sci(defi.h, 2)} mol·L⁻¹, α = ${fmtAlpha(defi.alpha)}, Ka ≈ ${sci(defi.Ka, 2)}, pKa ≈ ${nbf(M.pKaDe(defi.Ka), 2)} : c’est l’${M.ACIDES[defi.acId].nom}.`
          : (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + `Ka de la solution 2 ≈ ${sci(defi.s2.Ka, 2)} ; ${defi.meme ? 'il est égal à celui de la solution 1 (à quelques pourcents près) : même acide, seules les concentrations diffèrent.' : 'il est très différent de celui de la solution 1 : deux acides différents.'}`}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température constante : 25 °C</strong>. Ka et le produit ionique de l’eau ne dépendent que de la température ; la simulation ne la fait pas varier.</li>
      <li><strong>Activités ≈ concentrations</strong> : solutions diluées (C₀ au plus égale à 0,10 mol·L⁻¹). On remplace l’activité de chaque soluté [X] par [X] divisée par c° (c° = 1 mol·L⁻¹) ; Ka et α n’ont pas d’unité. L’eau, solvant, n’apparaît pas dans Ka.</li>
      <li><strong>Calculs du cours</strong> : [A⁻] = [H₃O⁺], car l’eau pure apporte très peu d’ions oxonium (10⁻⁷ mol·L⁻¹) devant ceux de l’acide ; c’est valable tant que le pH reste inférieur à environ 5,8. La conservation de la matière donne [AH] = C₀ − [A⁻].</li>
      <li><strong>Mesure de pH</strong> : le pH-mètre virtuel est idéal et affiche 2 décimales, ce qui donne 2 chiffres significatifs pour [H₃O⁺] ; Ka estimé avec le pH a donc une incertitude de quelques pourcents (jusqu’à 5 %, parfois 9 % avec des arrondis intermédiaires).</li>
      <li><strong>Valeurs de pKa</strong> : valeurs usuelles à 25 °C arrondies au dixième (chloroéthanoïque 2,9 ; benzoïque 4,2 ; propanoïque 4,9 ; hypochloreux 7,5), données et non à retrouver. L’acide bromhydrique est traité comme totalement dissocié (α = 1).</li>
      <li><strong>Représentation à 100 molécules</strong> : le schéma arrondit α à une molécule sur 100 ; il illustre la proportion, pas la réalité microscopique.</li>
      <li><strong>Limites</strong> : monoacides seulement, aucune autre réaction (CO₂ dissous, par exemple), concentrations de 0,0010 à 0,10 mol·L⁻¹ (au-delà, les activités ne sont plus égales aux concentrations ; en dessous, l’autoprotolyse de l’eau devient sensible).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène : équation, schéma des molécules, réglages ----------
  const compte = enExplore || (enGuide && apres('sur100') && !cacher);
  const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
  const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
  const reglages = (enExplore || (enGuide && idE === 'dilu')) && (
    <div style={{ ...styleBoite, ...cadre('reglage') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {enExplore && <>
        <label htmlFor="af-ac" style={libelle}>Acide étudié</label>
        <select id="af-ac" value={ti.ac} onChange={e => setTi(s => ({ ...s, ac: e.target.value }))} style={{ ...selectStyle, marginBottom: 8 }}>
          {M.ORDRE.map(id => <option key={id} value={id}>{M.ACIDES[id].nom} ({M.ACIDES[id].AH}){M.ACIDES[id].fort ? ' : acide fort' : ` : pKa ${nbf(M.ACIDES[id].pKa, 1)}`}</option>)}
        </select>
      </>}
      <label htmlFor="af-c" style={libelle}>Concentration C₀ (mol·L⁻¹)</label>
      <select id="af-c" value={C} onChange={e => choisirC(Number(e.target.value))} style={selectStyle}>
        {(enExplore ? M.CONC : [P.C, P.Cdilue]).map(c => <option key={c} value={c}>{fmtC(c)}</option>)}
      </select>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>C₀ est la quantité d’acide introduite par litre de solution : diluer, c’est diminuer C₀.</div>
    </div>);
  const grilleBox = !dd && !cacher && (enExplore || deja('sur100')) && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Pour 100 molécules d’acide introduites</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Chaque case est une molécule d’acide : colorée si elle a réagi avec l’eau (part α), claire sinon. Un acide fort colore tout.</div>}
      <GrilleMolecules ac={acId} alpha={m.alpha} compte={compte}/>
    </div>);

  // ---------- mesures ----------
  const montrerMesures = enExplore || (enGuide && deja('faible'));
  const mesures = montrerMesures && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Valeurs à l’état final (pH-mètre virtuel à 2 décimales ; les autres grandeurs sont calculées à partir du pH affiché).</div>}
      <LigneMesure nom="pH" valeur={nbf(m.pH, 2)} couleur={COL.orange}/>
      <LigneMesure nom="pH si l’acide était fort (−log C₀)" valeur={nbf(M.pHFort(C), 2)} couleur={COL.vert}/>
      {!cacherMes && (enExplore || apres('h')) && <LigneMesure nom="[H₃O⁺]" valeur={`${sci(m.h, 2)}${NB}mol·L⁻¹`}/>}
      {!cacherMes && (enExplore || apres('ah')) && <>
        <LigneMesure nom={`[${a.A}]`} valeur={`${sci(m.h, 2)}${NB}mol·L⁻¹`}/>
        <LigneMesure nom={`[${a.AH}]`} valeur={a.fort ? '≈ 0 (quasi nulle)' : `${sci(m.AH, 2)}${NB}mol·L⁻¹`}/>
      </>}
      {!cacherMes && (enExplore || apres('alpha')) && <LigneMesure nom="Coefficient de dissociation α" valeur={fmtAlpha(m.alpha)} couleur={COL.vert}/>}
      {!cacherMes && (enExplore || apres('ka')) && <LigneMesure nom="Ka estimé d’après le pH" valeur={a.fort ? '— (acide fort)' : sci(m.Ka, 2)} couleur={COL.bleu}/>}
      {!cacherMes && (enExplore || apres('pka')) && <LigneMesure nom="pKa de référence" valeur={a.fort ? '—' : nbf(a.pKa, 1)}/>}
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, margin: '4px 0 0', lineHeight: 1.5 }}>{avecIndices('Ka est estimé avec [H₃O⁺]² divisé par (C₀ − [H₃O⁺]) : il fluctue de quelques pourcents autour du Ka de référence à cause de l’arrondi du pH.')}</div>}
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Acide bromhydrique à plusieurs concentrations : le pH suit-il −log C₀ ? Que vaut α ?</li>
      <li>Acide benzoïque de 0,10 à 0,0010 mol·L⁻¹ : comment évoluent le pH, α et le Ka estimé ? Lequel reste constant ?</li>
      <li>À C₀ identique, classez les quatre acides faibles par pH croissant, puis par pKa croissant : que remarquez-vous ?</li>
      <li>Acide hypochloreux : α est-il proche de 0 ou de 1 ? La dilution y change-t-elle beaucoup le nombre de cases colorées ?</li>
      <li>Trouvez un acide faible et une concentration pour lesquels α dépasse 0,5 : l’acide est-il devenu « fort » ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Acide fort : réaction quasi totale (→), α = 1, pH = −log C₀</li>
        <li>Acide faible : réaction limitée (⇌), α &lt; 1, pH &gt; −log C₀ ; α augmente quand on dilue</li>
        <li>α = {FracA} ; [AH] = C₀ − [A⁻] (conservation de la matière)</li>
        <li>Ka = {FracKa} (sans unité, indépendante de C₀) ; pKa = −log Ka</li>
        <li>pKa petit ⇔ Ka grand ⇔ acide plus fort (à même concentration)</li>
      </ul>
    </ARetenir>);

  const resume = `${a.nom} · C₀ = ${fmtC(C)} mol·L⁻¹`;
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .af-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .af-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .af-col { display: flex; flex-direction: column; gap: 12px; }
        .af-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .af-l1.cote .af-carte { order: 2; } .af-l1.cote .af-main { order: 1; }
          .af-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .af-ex > * { grid-column: 1; }
          .af-ex > .af-reg { grid-column: 2; grid-row: 1 / span 3; }
        }
        @media (max-width: 900px) { .af-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .af-in { animation: af-fondu 0.35s ease-out; } @keyframes af-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Acide faible : coefficient de dissociation, constante d’acidité Ka et pKa</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un acide <strong>faible</strong> ne réagit que partiellement avec l’eau. On mesure la part qui réagit (<strong>coefficient de dissociation α</strong>), on en tire la <strong>constante d’acidité Ka</strong> puis le <strong>pKa</strong>, grâce au logarithme décimal.</div>
      {!enExplore && <div className={`af-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="af-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="af-carte">{panneauHypo}</div>}
        <div className="af-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'inconnu' ? suiviI : suiviP}/></div>}
          {enGuide && <div className="af-col">
            <Equation ac={acId} C={C}/>
            {grilleBox && <div className="af-in">{grilleBox}</div>}
            {reglages && <div className="af-in">{reglages}</div>}
            {mesures && <div className="af-in">{mesures}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="af-ex">
          <Equation ac={acId} C={C}/>
          {grilleBox}
          <div className="af-reg">{reglages}</div>
          {mesures}
        </div>
        <Section titre={`Graphique : α en fonction de C₀ (${resume})`} ouvert={!!ouv.graphe} onBascule={() => bascule('graphe')}>
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Pour chaque acide faible, α augmente quand C₀ diminue (échelle logarithmique). Le cercle repère la solution choisie ; un acide plus fort (pKa plus petit) est au-dessus.</div>
          <GrapheAlpha ac={acId} C={C}/>
        </Section>
        <Section titre={`Les quatre acides faibles à C₀ = ${fmtC(C)} mol·L⁻¹`} ouvert={!!ouv.tableau} onBascule={() => bascule('tableau')}>
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>À même concentration, on compare les acides par leur pKa, leur pH et leur coefficient α. L’acide choisi est en gras.</div>
          <TableauAcides C={C} courant={acId}/>
        </Section>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('bilan'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
