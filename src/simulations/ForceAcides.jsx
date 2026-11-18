import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useMemo } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./forceAcidesModele";
import { SvgAcideFort, SvgPHTranche, SvgTaux, SvgKaPKa, SvgComparer, SvgKe } from "./forceAcidesSchemas";

const SIM_ID = 129, CLE_GUIDE = 'force-acides-tg-guide-v1';
declarerDefis(SIM_ID, [['inconnu', 'Acide fort ou faible ? Constante d’acidité d’un acide inconnu'], ['plus-fort', 'Quel est l’acide le plus fort des trois ?']]);

// ====================================================
//  SIM 129 — FORCE DES ACIDES : CONSTANTE D'ACIDITÉ K_A, PRODUIT IONIQUE Ke, pK_A (TG spé PC, thème « Constitution et transformations de la matière »,
//  partie « Prévoir l'état final d'un système, siège d'une transformation chimique », sous-partie « Comparer la force des acides et des bases »).
//  Une seule idée : la force d'un acide se lit dans son état final (taux d'avancement τ, K_A, pK_A). Première des deux simulations du thème ;
//  la seconde (diagrammes de prédominance et de distribution, indicateurs colorés, solution tampon) ira dans le même chapitre.
//  Capacités visées (jamais affichées à l'élève) : associer K_A et Ke aux équations de réactions ; estimer K_A à l'aide d'une mesure de pH ;
//  associer le caractère fort à la transformation quasi-totale avec l'eau ; prévoir la composition finale d'une solution d'acide fort ou faible ;
//  comparer la force de différents acides ; mesurer le pH pour en déduire le caractère fort ou faible. Capacité numérique : taux d'avancement final d'un acide sur l'eau ;
//  capacité mathématique : équation du second degré. Modèle de calcul : forceAcidesModele.js (réutilise acidesBasesModele.js sans le modifier).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sci = (v, cs = 2) => { const [m, e] = Number(v).toExponential(cs - 1).split('e'); return `${m.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => SUP[c]).join('')}`; };
const fmtM = v => (v === 0 ? '0' : v >= 0.01 ? nbf(v, 3) : sci(v, 2));
const fmtTau = t => (t >= 0.9995 ? '1' : t >= 0.01 ? nbf(t, 3) : sci(t, 2));
const fmtC = c => ({ 0.1: '0,10', 0.05: '0,050', 0.02: '0,020', 0.01: '0,010', 0.005: '0,0050', 0.001: '0,0010' }[c] ?? nbf(c, 3));
const tire = t => t[Math.floor(Math.random() * t.length)];
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b' };
const cadreSvg = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` };
const ETH = M.etat(M.ACIDES.ch3, 0.010);
const CONC_BOUTONS = [0.10, 0.05, 0.01, 0.005, 0.001];
const PRESET = { ac: 'ch3', c: 0.010, vusC: [], vusA: [] };

// ---------- formules (MathML) ----------
const H3O = <><msub><mi mathvariant="normal">H</mi><mn>3</mn></msub><msup><mi mathvariant="normal">O</mi><mo>+</mo></msup></>;
const HO = <msup><mi mathvariant="normal">HO</mi><mo>−</mo></msup>;
const conc = x => <><mo>[</mo>{x}<mo>]</mo></>;
const Am = <msup><mi mathvariant="normal">A</mi><mo>−</mo></msup>;
const KA = <msub><mi>K</mi><mi mathvariant="normal">A</mi></msub>;
const FKa = <Formule>{KA}<mo>=</mo><mfrac><mrow>{conc(Am)}<mo>·</mo>{conc(H3O)}</mrow><mrow>{conc(<mi mathvariant="normal">AH</mi>)}</mrow></mfrac></Formule>;
const Ftau = <Formule><mi>τ</mi><mo>=</mo><mfrac><msub><mi>x</mi><mi mathvariant="normal">f</mi></msub><msub><mi>x</mi><mi>max</mi></msub></mfrac></Formule>;
const FKe = <Formule><msub><mi>K</mi><mi mathvariant="normal">e</mi></msub><mo>=</mo>{conc(H3O)}<mo>·</mo>{conc(HO)}</Formule>;
const FpH = <Formule><mi>pH</mi><mo>=</mo><mo>−</mo><mi>log</mi><mfrac><mrow>{conc(H3O)}</mrow><mrow><msup><mi>c</mi><mo>°</mo></msup></mrow></mfrac></Formule>;
const FSecond = <Formule><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo>{KA}<mo>·</mo><mi>x</mi><mo>−</mo>{KA}<mo>·</mo><mi>C</mi><mo>=</mo><mn>0</mn></Formule>;

// ---------- QCM du parcours (exportés pour le contrôle de la longueur des options) ----------
const QCM_PARCOURS = {
  hcl: { options: ['presque rien : la transformation est quasi-totale', 'environ la moitié : les deux sens de la réaction se compensent', 'presque tout : HCl ne réagit presque pas avec l’eau', 'cela dépend de la valeur de la concentration apportée C'], bonne: 0 },
  eth: { options: ['limitée : la plupart des molécules restent sous forme CH₃COOH', 'quasi-totale : comme pour HCl, il ne reste presque plus de CH₃COOH', 'nulle : l’acide éthanoïque ne réagit pas du tout avec l’eau', 'complète : l’eau est en très grand excès, donc tout réagit'], bonne: 0 },
  phfaible: { options: ['faible : son pH est supérieur à −log C', 'fort : son pH est supérieur à 0, donc il réagit totalement', 'faible : son pH est inférieur à la valeur de −log C', 'indécidable : il faudrait connaître la valeur de K_A'], bonne: 0 },
  dilu: { options: ['augmente : l’acide réagit davantage', 'diminue : il y a moins d’acide à transformer', 'reste égal : c’est une propriété de l’acide seul', 'passe à 1 : la solution diluée devient un acide fort'], bonne: 0 },
  ka: { options: ['CH₃COOH + H₂O ⇌ CH₃COO⁻ + H₃O⁺', 'CH₃COO⁻ + H₂O ⇌ CH₃COOH + HO⁻ (réaction inverse)', '2 H₂O ⇌ H₃O⁺ + HO⁻ (eau avec elle-même)', 'CH₃COOH + HO⁻ → CH₃COO⁻ + H₂O (avec la soude)'], bonne: 0 },
  compar: { options: ['l’acide méthanoïque : plus petit pK_A, plus grand τ', 'l’acide benzoïque : pK_A intermédiaire, pH intermédiaire', 'l’acide éthanoïque : plus grand pK_A, plus petit pH', 'on ne peut pas comparer : les trois acides sont faibles'], bonne: 0 },
  second: { options: ['x² + 1,7×10⁻⁵·x − 3,4×10⁻⁷ = 0', 'x² − 1,7×10⁻⁵·x − 3,4×10⁻⁷ = 0', 'x² + 1,7×10⁻⁵·x − 1,7×10⁻⁵ = 0', 'x² + 3,4×10⁻⁷·x − 1,7×10⁻⁵ = 0'], bonne: 0 },
};

// ---------- équation de la réaction, toujours en tête ----------
const Esp = ({ children }) => <span style={{ whiteSpace: 'nowrap' }}>{children}</span>;
function Equation({ ac, C, nom }) {
  const a = M.ACIDES[ac];
  return (
    <div style={{ ...styleBoite, textAlign: 'center' }}>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4 }}>{nom ?? `Solution d’${a.nom}`}</div>
      <div style={{ fontSize: 17, color: KIT.txt, lineHeight: 1.6 }} aria-label="Équation de la réaction avec l’eau">
        <Esp>{a.AH}(aq)</Esp> + <Esp>H₂O(ℓ)</Esp> <Esp>{a.fort ? '→' : '⇌'}</Esp> <Esp>{a.A}(aq)</Esp> + <Esp>H₃O⁺(aq)</Esp>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>Concentration apportée <strong>C = {fmtC(C)}{NB}mol·L⁻¹</strong>, à 25{NB}°C</div>
    </div>);
}

// ---------- 100 molécules d'acide introduites : cases colorées = molécules qui ont réagi avec l'eau ----------
function Grille({ ac, tau, compte }) {
  const a = M.ACIDES[ac], n = M.nbTransformees(tau);
  const cases = [];
  for (let i = 0; i < 100; i++) cases.push(<rect key={i} x={10 + (i % 10) * 24} y={8 + Math.floor(i / 10) * 24} width="21" height="21" rx="3"
    fill={i < n ? '#ea580c' : '#dbeafe'} stroke={i < n ? '#9a3412' : '#93c5fd'}/>);
  return (
    <svg viewBox="0 0 400 276" style={cadreSvg} role="img"
      aria-label={compte ? `100 molécules d’acide introduites : ${n} ont réagi avec l’eau, les autres sont restées sous forme ${a.AH}.` : 'Représentation de 100 molécules d’acide introduites : les cases colorées ont réagi avec l’eau, les cases claires sont restées sous forme d’acide.'}>
      {cases}
      <rect x="266" y="14" width="16" height="16" rx="3" fill="#ea580c" stroke="#9a3412"/>
      <text x="290" y="27" fontSize="14" fill="#0f172a">a réagi</text>
      <text x="290" y="45" fontSize="14" fill="#0f172a">avec l’eau</text>
      <rect x="266" y="76" width="16" height="16" rx="3" fill="#dbeafe" stroke="#93c5fd"/>
      <text x="290" y="89" fontSize="14" fill="#0f172a">est resté</text>
      <text x="290" y="107" fontSize="14" fill="#0f172a">sous forme</text>
      <text x="290" y="125" fontSize="14" fontWeight="700" fill={COL.bleu}>{a.AH}</text>
      <text x="10" y="266" fontSize="14" fontWeight={compte ? 700 : 400} fill={compte ? COL.orange : COL.gris}>
        {compte ? (n === 0 ? 'moins d’une molécule sur 100 a réagi' : `${n} molécule${n > 1 ? 's' : ''} sur 100 ${n > 1 ? 'ont' : 'a'} réagi`) : '100 molécules d’acide introduites'}</text>
    </svg>);
}

// ---------- tableau comparatif d'acides à la même concentration ----------
function TableauAcides({ ids, C, courant }) {
  return (
    <table style={{ width: '100%', fontSize: 13.5, borderCollapse: 'collapse' }}>
      <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 4px' }}>Acide</th><th style={{ padding: '2px 4px' }}>pK<sub>A</sub></th><th style={{ padding: '2px 4px' }}>pH</th><th style={{ padding: '2px 4px' }}>τ</th></tr></thead>
      <tbody>{ids.map(id => { const a = M.ACIDES[id], e = M.etat(a, C); return (
        <tr key={id} style={{ borderTop: `1px dashed ${KIT.bord}`, fontWeight: id === courant ? 700 : 400, background: id === courant ? '#fff7ed' : 'transparent' }}>
          <td style={{ padding: '3px 4px' }}>{a.AH}</td>
          <td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{a.fort ? '—' : nbf(a.pKa, 2)}</td>
          <td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{nbf(e.pH, 2)}</td>
          <td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{fmtTau(e.tau)}</td></tr>); })}</tbody>
    </table>);
}

// ---------- tirages des défis ----------
const melange = t => [...t].sort(() => Math.random() - 0.5);
function tirageInconnu() {
  const fort = Math.random() < 0.4;
  return { type: 'inconnu', ...M.mesureDefi(fort, tire(M.CONC_DEFI), tire(M.PKA_DEFI)), reps: { choix: null, ka: '' }, verifie: false };
}
function tirageCompar() {
  const PK = [4.0, 4.2, 4.4, 4.6, 4.8, 5.0];
  for (let essai = 0; essai < 2000; essai++) {
    const pk = melange(PK).slice(0, 3);
    if (Math.min(Math.abs(pk[0] - pk[1]), Math.abs(pk[0] - pk[2]), Math.abs(pk[1] - pk[2])) < 0.39) continue;
    const sols = pk.map(p => { const C = tire(M.CONC_DEFI), pH = M.arrondiPH(M.etat({ fort: false, pKa: p }, C).pH); return { pKa: p, C, pH, ka: M.kaDepuisPH(C, pH) }; });
    const arg = (f, sg) => sols.reduce((b, s, i) => (sg * f(s) < sg * f(sols[b]) ? i : b), 0);
    const iFort = arg(s => s.pKa, 1), iPH = arg(s => s.pH, 1), iKa = arg(s => s.ka, -1);
    if (iFort !== iKa || iFort === iPH || new Set(sols.map(s => s.pH)).size < 3) continue;
    return { type: 'plus-fort', sols, vrai: iFort, reps: { choix: null }, verifie: false };
  }
  const sols = [[4.4, 0.10], [4.8, 0.010], [4.0, 0.010]].map(([p, C]) => { const pH = M.arrondiPH(M.etat({ fort: false, pKa: p }, C).pH); return { pKa: p, C, pH, ka: M.kaDepuisPH(C, pH) }; });
  return { type: 'plus-fort', sols, vrai: 2, reps: { choix: null }, verifie: false };
}

// ====================================================
export function SimulationForceAcides() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviI, noterI] = useCompteurDefi(), [suiviP, noterP] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('inconnu');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const setT = f => setTi(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['hcl', 'hclph', 'eth', 'phfaible', 'tau', 'dilu', 'ka', 'kaph', 'pka', 'compar', 'ke', 'second', 'solve', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- situation affichée ----------
  const scGuide = { hcl: ['hcl', 0.010], hclph: ['hcl', 0.020], eth: ['ch3', 0.010], phfaible: ['ch3', 0.010], tau: ['ch3', 0.010], dilu: ['ch3', ti.c], ka: ['ch3', 0.010], kaph: ['ch3', 0.010],
    pka: ['ch3', 0.010], compar: [ti.ac, 0.010], ke: ['ch3', 0.010], second: ['ch3', 0.020], solve: ['ch3', 0.020], bilan: ['ch3', 0.020] };
  const [acId, C] = enGuide ? scGuide[idE] : [ti.ac, ti.c];
  const a = M.ACIDES[acId];
  const e = useMemo(() => M.etat(M.ACIDES[acId], C), [acId, C]);
  const cacher = enGuide && (idE === 'second' || idE === 'solve');       // la réponse (x ou pH) se lirait sur l'écran
  const choixC = enExplore || (enGuide && idE === 'dilu'), choixAc = enExplore || (enGuide && idE === 'compar');
  const bloqueDilu = ti.vusC.includes(0.001) ? null : 'Choisissez d’abord la concentration 0,0010 mol·L⁻¹ (boutons sous le schéma).';
  const bloqueCompar = ['hcooh', 'c6h5', 'ch3'].every(k => ti.vusA.includes(k)) ? null : 'Choisissez d’abord les acides méthanoïque, benzoïque et éthanoïque (boutons « Acide étudié »).';
  const choisirC = c => setT({ c, vusC: ti.vusC.includes(c) ? ti.vusC : [...ti.vusC, c] });
  const choisirAc = id => setT({ ac: id, vusA: ti.vusA.includes(id) ? ti.vusA : [...ti.vusA, id] });

  const Q = QCM_PARCOURS;
  const ETAPES = [
    { id: 'hcl', titre: 'Un acide dans l’eau', focus: ['scene'],
      texte: <>On introduit de l’<strong>acide chlorhydrique</strong> (HCl) dans l’eau. La <strong>concentration apportée</strong> C est la quantité d’acide introduite par litre de solution : ici C = 0,010{NB}mol·L⁻¹ (« mole par litre »). L’équation de la réaction avec l’eau est écrite en haut. Le schéma représente <strong>100 molécules d’acide introduites</strong> : une case colorée est une molécule qui a réagi avec l’eau, une case claire une molécule restée sous forme HCl.</>,
      tache: { type: 'qcm', q: 'Dans l’état final, que reste-t-il de HCl ?', ...Q.hcl,
        expl: 'Toutes les cases sont colorées : presque toutes les molécules HCl ont réagi avec l’eau pour donner Cl⁻ et H₃O⁺. La transformation est quasi-totale (flèche simple dans l’équation), quelle que soit la concentration.', indice: 'Comptez les cases claires sur le schéma : elles représentent les molécules qui sont restées sous forme HCl.' } },
    { id: 'hclph', titre: 'Composition et pH d’un acide fort', focus: ['scene'],
      texte: <>Avec un <strong>acide fort</strong>, la réaction est quasi-totale : chaque molécule introduite donne un ion oxonium, donc [H₃O⁺] = C, [Cl⁻] = C et [HCl] ≈ 0. Le pH se calcule avec {FpH}où c° = 1{NB}mol·L⁻¹ est la concentration standard. Nouvelle solution : C = 0,020{NB}mol·L⁻¹ d’acide chlorhydrique.</>,
      tache: { type: 'num', q: 'pH de la solution d’acide chlorhydrique', unite: '(sans unité)', vrai: 1.699, tol: 0.02, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => ['[H₃O⁺] = C = 0,020 mol·L⁻¹ (acide fort : transformation quasi-totale).', 'pH = −log(0,020 / 1) = 1,70.'],
        pieges: [[0.020, 'C’est la concentration [H₃O⁺], pas le pH : pH = −log([H₃O⁺] / c°).'], [-1.699, 'Un pH est positif ici : log(0,020) est négatif, donc −log(0,020) est positif.'], [3.912, 'Vous avez utilisé ln au lieu de log (logarithme décimal).']],
        expl: 'pH = −log(0,020) = 1,70 ; [H₃O⁺] = [Cl⁻] = 0,020 mol·L⁻¹ ; [HCl] ≈ 0.', indice: 'Pour un acide fort, [H₃O⁺] = C. Calculez ensuite −log(C) avec la touche log de la calculatrice.' } },
    { id: 'eth', titre: 'Un acide faible : l’acide éthanoïque', focus: ['scene', 'mesures'],
      retenirTitre: 'À RETENIR : ACIDE FORT',
      retenir: <>
        <SvgAcideFort/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Acide fort</strong> : réaction <strong>quasi-totale</strong> avec l’eau (flèche →). Il ne reste plus d’acide : [H₃O⁺] = C et <strong>pH = −log C</strong>.</li>
          <li>Exemple de la simulation : HCl à 0,010{NB}mol·L⁻¹ donne pH = 2,00.</li>
          <li>Moyen de s’en souvenir : <strong>« fort = plus rien de l’acide »</strong>. Idée fausse : « un acide fort est un acide concentré ». Vrai : fort ou faible ne dépend pas de C, c’est la façon de réagir avec l’eau.</li>
        </ul></>,
      texte: <>On dissout maintenant de l’<strong>acide éthanoïque</strong> CH₃COOH (l’acide du vinaigre), toujours à C = 0,010{NB}mol·L⁻¹. L’équation s’écrit avec une double flèche ⇌ : les deux sens de la réaction se produisent. Observez le schéma et le pH-mètre.</>,
      tache: { type: 'qcm', q: 'Comment décrire cette transformation avec l’eau ?', ...Q.eth,
        expl: 'Seules quelques cases sont colorées : la plupart des molécules CH₃COOH restent intactes. La transformation est limitée : l’acide éthanoïque est un acide faible.', indice: 'Comparez le nombre de cases colorées ici et pour HCl (étape 1).' } },
    { id: 'phfaible', titre: 'Fort ou faible : le test du pH', focus: ['mesures'],
      texte: <>Pour C = 0,010{NB}mol·L⁻¹, un acide <em>fort</em> donnerait pH = −log C = {nbf(M.pHFort(0.010), 2)}. Le pH-mètre indique ici pH = {nbf(ETH.pH, 2)} : les deux valeurs sont dans le panneau « Mesures ».</>,
      tache: { type: 'qcm', q: 'Que conclut-on pour l’acide éthanoïque ?', ...Q.phfaible,
        expl: 'Un acide fort aurait un pH égal à −log C (ici 2,00). Le pH mesuré (3,39) est plus élevé : il y a moins d’ions oxonium que si tout l’acide avait réagi. L’acide éthanoïque est un acide faible.', indice: 'Plus il y a d’ions oxonium, plus le pH est bas. Comparez 3,39 à la valeur qu’aurait un acide fort.' } },
    { id: 'tau', titre: 'Le taux d’avancement final', focus: ['mesures'],
      retenirTitre: 'À RETENIR : FORT OU FAIBLE ? LE pH TRANCHE',
      retenir: <>
        <SvgPHTranche/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>On compare le pH mesuré à <strong>−log C</strong> : <strong>pH = −log C ⇒ acide fort</strong> ; <strong>pH &gt; −log C ⇒ acide faible</strong>.</li>
          <li>Exemple de la simulation : C = 0,010{NB}mol·L⁻¹, pH mesuré 3,39 contre 2,00 pour un acide fort.</li>
          <li>Moyen de s’en souvenir : <strong>« le pH ne ment pas : plus haut que −log C, c’est faible »</strong>.</li>
        </ul></>,
      texte: <>Pour mesurer ce que l’acide a réellement transformé, on utilise le <strong>taux d’avancement final</strong> {Ftau}Pour 1{NB}L de solution à C = 0,010{NB}mol·L⁻¹, x<sub>max</sub> = 0,010{NB}mol (si tout l’acide réagissait) et x<sub>f</sub> est la quantité d’ions oxonium formés : x<sub>f</sub> = [H₃O⁺] × 1,00{NB}L, avec [H₃O⁺] = 10<sup>−pH</sup>{NB}mol·L⁻¹ (pH = {nbf(ETH.pH, 2)}).</>,
      tache: { type: 'num', q: 'Taux d’avancement final de l’acide éthanoïque', unite: '(sans unité)', vrai: 0.0407, tol: 0.04, affiche: v => nbf(v, 3), cs: 2,
        calcul: () => ['[H₃O⁺] = 10^(−3,39) = 4,1×10⁻⁴ mol·L⁻¹, donc x_f = 4,1×10⁻⁴ mol ; x_max = 0,010 mol.', 'τ = x_f / x_max = 4,1×10⁻⁴ / 0,010 = 0,041 (sans unité), soit 4,1 % : τ < 1, l’acide est faible.'],
        pieges: [[24.5, 'Le rapport est inversé : τ = x_f / x_max, et x_f est plus petit que x_max.'], [4.07, 'τ est sans unité : 4,1 % s’écrit 0,041.'], [0.000407, 'C’est [H₃O⁺] (en mol·L⁻¹) : il faut encore le diviser par C = 0,010 mol·L⁻¹.'], [0.959, 'C’est la part d’acide qui n’a pas réagi ; τ est la part qui a réagi.']],
        expl: 'τ = 4,1×10⁻⁴ / 0,010 = 0,041 : environ 4 molécules sur 100 ont réagi (comme sur le schéma).', indice: '[H₃O⁺] = 10^(−pH) avec la touche 10^x de la calculatrice ; puis τ = [H₃O⁺] / C (le volume se simplifie).' } },
    { id: 'dilu', titre: 'Effet de la dilution', focus: ['scene', 'reglage'],
      retenirTitre: 'À RETENIR : LE TAUX D’AVANCEMENT FINAL τ',
      retenir: <>
        <SvgTaux/>
        {Ftau}
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>τ = x<sub>f</sub> / x<sub>max</sub></strong>, sans unité, entre 0 et 1. <strong>Acide fort : τ = 1</strong> ; <strong>acide faible : τ &lt; 1</strong>. Pour un acide, τ = [H₃O⁺] / C.</li>
          <li>Exemple de la simulation : 4 molécules d’acide éthanoïque sur 100 ont réagi à 0,010{NB}mol·L⁻¹.</li>
          <li>Moyen de s’en souvenir : <strong>« τ, c’est la part de l’acide qui a réagi »</strong>.</li>
        </ul></>,
      texte: <>Voyons si τ dépend de la concentration apportée. Choisissez avec les boutons sous le schéma C = 0,010{NB}mol·L⁻¹ puis C = 0,0010{NB}mol·L⁻¹ (dilution par 10) pour l’acide éthanoïque, et observez les cases colorées et τ.</>,
      tache: { type: 'qcm', q: 'Quand on dilue l’acide éthanoïque de 0,010 à 0,0010 mol·L⁻¹, son taux d’avancement final…', ...Q.dilu, bloque: bloqueDilu,
        expl: 'Plus la solution est diluée, plus la part d’acide qui réagit est grande (de 0,041 à 0,12 environ) : τ augmente. Un acide faible reste faible, mais il réagit « mieux » quand il est dilué.', indice: 'Comptez les cases colorées pour C = 0,010 puis pour C = 0,0010 mol·L⁻¹.' } },
    { id: 'ka', titre: 'La constante d’acidité K_A', focus: ['scene'],
      texte: <>À l’état final, les concentrations de l’acide et de sa base conjuguée vérifient une relation : la <strong>constante d’acidité K<sub>A</sub></strong> du couple AH / A⁻, associée à la réaction de l’acide avec l’eau AH + H₂O ⇌ A⁻ + H₃O⁺ : {FKa}(concentrations en mol·L⁻¹ divisées par c° = 1{NB}mol·L⁻¹ ; l’eau, solvant, n’apparaît pas). Pour l’acide éthanoïque : AH = CH₃COOH et A⁻ = CH₃COO⁻.</>,
      tache: { type: 'qcm', q: 'Quelle équation de réaction est associée à la constante K_A du couple CH₃COOH / CH₃COO⁻ ?', ...Q.ka,
        expl: 'K_A est associée à la réaction de l’acide avec l’eau : CH₃COOH + H₂O ⇌ CH₃COO⁻ + H₃O⁺. La deuxième équation est la réaction de la base avec l’eau, la troisième est celle de l’eau avec elle-même (constante K_e), la dernière est la réaction avec une base forte.', indice: 'K_A contient [CH₃COO⁻] et [H₃O⁺] au numérateur : ce sont les produits de la réaction de l’acide avec l’eau.' } },
    { id: 'kaph', titre: 'Estimer K_A avec une mesure de pH', focus: ['mesures'],
      texte: <>Solution d’acide éthanoïque : C = 0,010{NB}mol·L⁻¹ et pH = {nbf(ETH.pH, 2)}. À l’état final : [H₃O⁺] = [CH₃COO⁻] = 10<sup>−pH</sup>{NB}mol·L⁻¹ et [CH₃COOH] = C − [H₃O⁺]. On en déduit K<sub>A</sub> = [CH₃COO⁻]·[H₃O⁺] / [CH₃COOH].</>,
      tache: { type: 'num', q: 'Constante d’acidité K_A de l’acide éthanoïque', unite: '(sans unité)', vrai: 1.73e-5, tol: 0.08, affiche: v => sci(v, 2), cs: 2,
        calcul: () => ['[H₃O⁺] = [CH₃COO⁻] = 10^(−3,39) = 4,1×10⁻⁴ mol·L⁻¹ ; [CH₃COOH] = 0,010 − 4,1×10⁻⁴ = 9,6×10⁻³ mol·L⁻¹.', 'K_A = (4,1×10⁻⁴)² / 9,6×10⁻³ = 1,7×10⁻⁵ (sans unité). Hypothèses : activités ≈ concentrations, 25 °C.'],
        pieges: [[0.0425, 'Il manque un facteur [H₃O⁺] : K_A = [CH₃COO⁻]·[H₃O⁺] / [CH₃COOH], les deux concentrations de produits sont au numérateur.'], [4.07e-4, 'C’est la concentration [H₃O⁺] : K_A est un rapport faisant intervenir [H₃O⁺] au carré et [CH₃COOH].'], [57800, 'Le rapport est inversé : l’acide est au dénominateur, les produits au numérateur.']],
        expl: 'K_A = (4,1×10⁻⁴)² / (0,010 − 4,1×10⁻⁴) = 1,7×10⁻⁵.', indice: 'Calculez [H₃O⁺] = 10^(−pH), puis [CH₃COOH] = C − [H₃O⁺], puis K_A = [H₃O⁺]² / [CH₃COOH] (car [CH₃COO⁻] = [H₃O⁺]).' } },
    { id: 'pka', titre: 'Le pK_A', focus: ['mesures'],
      texte: <>Comme pour le pH, on utilise une échelle logarithmique plus pratique : le <strong>pK<sub>A</sub> = −log K<sub>A</sub></strong>. Pour l’acide éthanoïque, on vient de trouver K<sub>A</sub> = 1,7×10⁻⁵.</>,
      tache: { type: 'num', q: 'pK_A du couple CH₃COOH / CH₃COO⁻', unite: '(sans unité)', vrai: 4.77, tol: 0.02, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => ['pK_A = −log K_A = −log(1,7×10⁻⁵).', 'pK_A = 4,77 (la valeur de référence 4,76 diffère de 0,01 à cause de l’arrondi du pH mesuré).'],
        pieges: [[-4.77, 'Le signe est inversé : K_A est inférieur à 1, donc log K_A est négatif et −log K_A est positif.'], [1.7e-5, 'C’est K_A lui-même : le pK_A est −log K_A.'], [10.98, 'Vous avez utilisé ln au lieu de log (logarithme décimal).']],
        expl: 'pK_A = −log(1,7×10⁻⁵) = 4,77.', indice: 'Même démarche que pour le pH : −log de K_A, avec la touche log de la calculatrice.' } },
    { id: 'compar', titre: 'Comparer la force de plusieurs acides', focus: ['scene', 'reglage', 'tableau'],
      retenirTitre: 'À RETENIR : LA CONSTANTE D’ACIDITÉ ET LE pK',
      retenir: <>
        <SvgKaPKa/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>K<sub>A</sub> = [A⁻]·[H₃O⁺] / [AH]</strong> (sans unité) à l’état final, associée à AH + H₂O ⇌ A⁻ + H₃O⁺ ; <strong>pK<sub>A</sub> = −log K<sub>A</sub></strong>.</li>
          <li>On estime K<sub>A</sub> avec une mesure de pH : K<sub>A</sub> = [H₃O⁺]² / (C − [H₃O⁺]). Exemple : acide éthanoïque, K<sub>A</sub> = 1,7×10⁻⁵, pK<sub>A</sub> = 4,77.</li>
          <li>Moyen de s’en souvenir : <strong>« K<sub>A</sub> est une propriété du couple, pas de la concentration »</strong>.</li>
        </ul></>,
      texte: <>À la même concentration C = 0,010{NB}mol·L⁻¹, comparons des acides. Avec les boutons « Acide étudié », choisissez l’acide méthanoïque, l’acide benzoïque puis l’acide éthanoïque : le tableau garde leur pK<sub>A</sub>, leur pH et leur τ.</>,
      tache: { type: 'qcm', q: 'Parmi ces trois acides faibles, lequel est le plus fort ?', ...Q.compar, bloque: bloqueCompar,
        expl: 'L’acide méthanoïque a le plus petit pK_A (3,75), donc le plus grand K_A : il a le plus grand taux d’avancement final (0,12) et le pH le plus bas (2,90) à même concentration.', indice: 'Un acide plus fort réagit davantage avec l’eau : son τ est plus grand, son pH plus bas. Regardez la colonne τ du tableau.' } },
    { id: 'ke', titre: 'Le produit ionique de l’eau K_e', focus: ['mesures'],
      retenirTitre: 'À RETENIR : COMPARER LA FORCE DE DEUX ACIDES',
      retenir: <>
        <SvgComparer/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>À même concentration : <strong>pK<sub>A</sub> petit ⇔ K<sub>A</sub> grand ⇔ τ grand ⇔ pH bas ⇔ acide plus fort</strong>.</li>
          <li>Exemple de la simulation : méthanoïque (3,75), benzoïque (4,20), éthanoïque (4,76) : du plus fort au plus faible.</li>
          <li>Piège : on compare les acides avec <strong>K<sub>A</sub> ou pK<sub>A</sub></strong>, pas avec le pH de solutions de concentrations différentes. Et τ change avec C (il augmente par dilution) alors que K<sub>A</sub> ne change pas.</li>
        </ul></>,
      texte: <>L’eau pure réagit un tout petit peu avec elle-même : 2{NB}H₂O ⇌ H₃O⁺ + HO⁻. Sa constante est le <strong>produit ionique de l’eau</strong> {FKe}qui vaut K<sub>e</sub> = 1,0×10⁻¹⁴ à 25{NB}°C. Dans la solution d’acide éthanoïque (pH = {nbf(ETH.pH, 2)}), [H₃O⁺] = 4,1×10⁻⁴{NB}mol·L⁻¹.</>,
      tache: { type: 'num', q: 'Concentration en ions hydroxyde [HO⁻]', unite: 'mol·L⁻¹', vrai: 2.45e-11, tol: 0.06, affiche: v => sci(v, 2), cs: 2,
        calcul: () => ['K_e = [H₃O⁺]·[HO⁻], donc [HO⁻] = K_e / [H₃O⁺].', '[HO⁻] = 1,0×10⁻¹⁴ / 4,1×10⁻⁴ = 2,4×10⁻¹¹ mol·L⁻¹ (2,5×10⁻¹¹ sans arrondir [H₃O⁺]) : très inférieure à [H₃O⁺].'],
        pieges: [[4.1e-18, 'Il faut diviser K_e par [H₃O⁺], pas les multiplier.'], [1e-14, 'C’est K_e lui-même : [HO⁻] = K_e / [H₃O⁺].'], [10.61, 'C’est 14 − pH (le pOH) et non une concentration.'], [4.1e-4, 'C’est [H₃O⁺] : [HO⁻] est beaucoup plus petite.']],
        expl: '[HO⁻] = 1,0×10⁻¹⁴ / 4,1×10⁻⁴ ≈ 2,5×10⁻¹¹ mol·L⁻¹.', indice: 'K_e = [H₃O⁺]·[HO⁻] : isolez [HO⁻], puis calculez avec [H₃O⁺] = 4,1×10⁻⁴ mol·L⁻¹.' } },
    { id: 'second', titre: 'Prévoir la composition : l’équation du second degré', focus: ['scene'],
      retenirTitre: 'À RETENIR : LE PRODUIT IONIQUE DE L’EAU',
      retenir: <>
        <SvgKe/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>K<sub>e</sub> = [H₃O⁺]·[HO⁻] = 1,0×10⁻¹⁴</strong> à 25{NB}°C, associé à 2{NB}H₂O ⇌ H₃O⁺ + HO⁻. Si [H₃O⁺] augmente, [HO⁻] diminue.</li>
          <li>Exemple de la simulation : pH 3,39, soit [H₃O⁺] = 4,1×10⁻⁴{NB}mol·L⁻¹ et [HO⁻] = 2,5×10⁻¹¹{NB}mol·L⁻¹.</li>
          <li>Moyen de s’en souvenir : <strong>« le produit reste fixé : l’un monte, l’autre descend »</strong>.</li>
        </ul></>,
      texte: <>Peut-on prévoir la composition connaissant K<sub>A</sub> et C ? Oui. Soit x = [H₃O⁺] = [A⁻] à l’état final ; alors [AH] = C − x et K<sub>A</sub> = x² / (C − x). On obtient une <strong>équation du second degré</strong> en x : {FSecond}Cas étudié : C = 0,020{NB}mol·L⁻¹ d’acide éthanoïque, K<sub>A</sub> = 1,7×10⁻⁵.</>,
      tache: { type: 'qcm', q: 'Quelle équation permet de trouver x = [H₃O⁺] ?', ...Q.second,
        expl: 'K_A = x² / (C − x) donne x² = K_A (C − x), soit x² + K_A·x − K_A·C = 0. Ici K_A·C = 1,7×10⁻⁵ × 0,020 = 3,4×10⁻⁷.', indice: 'Partez de K_A = x² / (C − x) : multipliez par (C − x), puis passez tout du même côté.' } },
    { id: 'solve', titre: 'Résoudre l’équation', focus: ['scene'],
      texte: <>L’équation est x² + 1,7×10⁻⁵·x − 3,4×10⁻⁷ = 0, de la forme a·x² + b·x + c = 0 avec a = 1, b = 1,7×10⁻⁵ et c = −3,4×10⁻⁷. Le discriminant est Δ = b² − 4ac ; la solution positive (une concentration) est x = (−b + √Δ) / (2a).</>,
      tache: { type: 'num', q: 'Concentration en ions oxonium [H₃O⁺] à l’état final', unite: 'mol·L⁻¹', vrai: 5.75e-4, tol: 0.01, affiche: v => sci(v, 3), cs: 3,
        calcul: () => ['Δ = b² − 4ac = (1,7×10⁻⁵)² + 4 × 3,4×10⁻⁷ = 2,9×10⁻¹⁰ + 1,36×10⁻⁶ = 1,3603×10⁻⁶.', 'x = (−1,7×10⁻⁵ + √(1,3603×10⁻⁶)) / 2 = (−1,7×10⁻⁵ + 1,1663×10⁻³) / 2 = 5,75×10⁻⁴ mol·L⁻¹ (pH = 3,24).'],
        pieges: [[3.4e-7, 'C’est le terme c = −K_A·C (au signe près), pas la solution de l’équation.'], [3.24, 'C’est le pH : on demande la concentration [H₃O⁺].'], [1.15e-3, 'Vous avez oublié de diviser par 2a = 2 dans la formule des racines.'], [0.020, 'C’est la concentration apportée C : l’acide est faible, [H₃O⁺] est beaucoup plus petite.']],
        expl: 'x = 5,75×10⁻⁴ mol·L⁻¹, donc pH = −log(5,75×10⁻⁴) = 3,24 et τ = x / C = 0,029.', indice: 'Calculez Δ = b² − 4ac avec c négatif (−c est positif), puis x = (−b + √Δ) / 2. Gardez au moins 3 chiffres significatifs.' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      texte: <>Vous savez associer K<sub>A</sub> et K<sub>e</sub> aux équations de réaction, reconnaître un acide fort (transformation quasi-totale, pH = −log C) ou faible (pH supérieur à −log C), calculer un taux d’avancement final, estimer K<sub>A</sub> avec le pH, comparer des acides avec le pK<sub>A</sub> et prévoir la composition finale. <strong>Méthode</strong> pour un acide faible : 1) écrire la réaction avec l’eau ; 2) exprimer K<sub>A</sub> avec x = [H₃O⁺] ; 3) résoudre l’équation du second degré ; 4) en déduire pH et τ. Passez à l’exploration (tous les acides, toutes les concentrations) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'inconnu' ? tirageInconnu() : tirageCompar());
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') setTi(PRESET);
    if (md === 'explore') setTi(s => ({ ...PRESET, ...s }));
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'inconnu') {
      const ka = lireNombre(defi.reps.ka), ok = defi.reps.choix === (defi.fort ? 'fort' : 'faible') && (defi.fort || (isFinite(ka) && proche(ka, defi.ka, 0.08)));
      setDefi(d => ({ ...d, verifie: true, ok })); noterI(ok);
    } else { const ok = defi.reps.choix === defi.vrai; setDefi(d => ({ ...d, verifie: true, ok })); noterP(ok); }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['inconnu', 'Un acide inconnu : fort ou faible ?'], ['plus-fort', 'Quel acide est le plus fort ?']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'inconnu' ? 'Défi : l’acide est-il fort ou faible ? Quelle est sa constante d’acidité ?' : 'Défi : lequel de ces trois acides est le plus fort ?'}</div>
      {defi.type === 'inconnu' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>On prépare une solution d’un acide inconnu de concentration apportée <strong>C = {fmtC(defi.C)}{NB}mol·L⁻¹</strong>, à 25{NB}°C. Le pH-mètre indique <strong>pH = {nbf(defi.pH, 2)}</strong>. Indiquez si l’acide est fort ou faible ; s’il est faible, donnez sa constante d’acidité K<sub>A</sub> (2{NB}chiffres significatifs ; marge acceptée : ± 8{NB}%).</div>
        <div role="group" aria-label="Caractère de l’acide" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {[['fort', 'Acide fort'], ['faible', 'Acide faible']].map(([k, l]) => <button key={k} onClick={() => setDefi(d => ({ ...d, reps: { ...d.reps, choix: k }, verifie: false }))} aria-pressed={defi.reps.choix === k}
            style={stylePetitBouton(defi.reps.choix === k, defi.verifie ? ((defi.fort ? 'fort' : 'faible') === k ? '#15803d' : '#dc2626') : '#475569')}>{l}</button>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>K<sub>A</sub> =</span>
          <input value={defi.reps.ka} aria-label="Constante d’acidité K A (laisser vide si l’acide est fort)" onKeyDown={e => e.key === 'Enter' && document.getElementById('fa-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, ka: e.target.value }, verifie: false }))} inputMode="decimal"
            style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>(sans unité ; vide si l’acide est fort)</span>
        </div>
        <IndiceDefi cache={false}>Comparez le pH mesuré à −log C : s’ils sont égaux, l’acide est fort. Sinon, [H₃O⁺] = 10<sup>−pH</sup> = [A⁻] et [AH] = C − [H₃O⁺], donc K<sub>A</sub> = [H₃O⁺]² / (C − [H₃O⁺]).</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Trois solutions d’acides faibles différents ont été préparées à des concentrations apportées différentes. Pour chacune, on mesure le pH à 25{NB}°C. Quel acide est le plus fort, c’est-à-dire de plus grande constante d’acidité K<sub>A</sub> ?</div>
        <table style={{ width: '100%', fontSize: 13.5, borderCollapse: 'collapse', marginBottom: 8 }}>
          <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 4px' }}>Solution</th><th style={{ padding: '2px 4px' }}>C (mol·L⁻¹)</th><th style={{ padding: '2px 4px' }}>pH</th></tr></thead>
          <tbody>{defi.sols.map((s, i) => <tr key={i} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 4px', fontWeight: 700 }}>{i + 1}</td><td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{fmtC(s.C)}</td><td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{nbf(s.pH, 2)}</td></tr>)}</tbody>
        </table>
        <div role="group" aria-label="Acide le plus fort" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {defi.sols.map((s, i) => <button key={i} onClick={() => setDefi(d => ({ ...d, reps: { choix: i }, verifie: false }))} aria-pressed={defi.reps.choix === i}
            style={stylePetitBouton(defi.reps.choix === i, defi.verifie ? (defi.vrai === i ? '#15803d' : '#dc2626') : '#475569')}>Solution {i + 1}</button>)}
        </div>
        <IndiceDefi cache={false}>Le pH seul ne suffit pas : les concentrations sont différentes. Pour chaque solution, calculez K<sub>A</sub> = [H₃O⁺]² / (C − [H₃O⁺]) avec [H₃O⁺] = 10<sup>−pH</sup>, puis comparez les trois valeurs.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="fa-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'inconnu'
          ? (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.fort ? `−log C = ${nbf(M.pHFort(defi.C), 2)} = pH mesuré : acide fort (transformation quasi-totale), pas de K_A.` : `−log C = ${nbf(M.pHFort(defi.C), 2)} est inférieur au pH mesuré : acide faible, avec K_A = [H₃O⁺]² / (C − [H₃O⁺]) = ${sci(defi.ka, 2)} (marge acceptée : ± 8 %).`)
          : (defi.ok ? '✓ Correct. ' : '✗ Ce n’est pas le plus fort. ') + defi.sols.map((s, i) => `Solution ${i + 1} : K_A ≈ ${sci(s.ka, 2)}.`).join(' ') + ` Le plus grand K_A est celui de la solution ${defi.vrai + 1}.`}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température constante : 25 °C</strong>. K<sub>A</sub> et K<sub>e</sub> ne dépendent que de la température : K<sub>e</sub> = 1,0×10⁻¹⁴ à 25 °C ; la simulation ne fait pas varier T.</li>
      <li><strong>Activités ≈ concentrations</strong> : solutions diluées (C au plus égale à 0,10 mol·L⁻¹). On remplace l’activité de chaque soluté par [X] / c° avec c° = 1 mol·L⁻¹ ; K<sub>A</sub>, K<sub>e</sub> et τ n’ont pas d’unité. L’eau, solvant, n’apparaît pas dans K<sub>A</sub>.</li>
      <li><strong>Acide fort</strong> : l’acide chlorhydrique est considéré comme totalement transformé ([HCl] ≈ 0, τ = 1) ; c’est une convention de précision, pas une disparition absolue.</li>
      <li><strong>Valeurs de pK<sub>A</sub></strong> : valeurs usuelles à 25 °C arrondies (méthanoïque 3,75 ; benzoïque 4,20 ; éthanoïque 4,76 ; ion ammonium 9,20), données du problème, non à retrouver.</li>
      <li><strong>Calcul du pH</strong> : la simulation calcule le pH « exact » en tenant compte de l’autoprotolyse de l’eau. La formule du cours (équation du second degré x² + K<sub>A</sub>·x − K<sub>A</sub>·C = 0) la néglige : elle est valable tant que [HO⁻] est très inférieur à [H₃O⁺], ce qui est le cas ici (solutions acides). Les approximations « [AH] ≈ C » ou x = √(K<sub>A</sub>·C) ne sont valables que si τ est petit.</li>
      <li><strong>Mesure de pH</strong> : le pH-mètre virtuel est idéal et affiche 2 décimales ; l’estimation de K<sub>A</sub> par le pH a donc une incertitude de l’ordre de 2 à 3 %.</li>
      <li><strong>Représentation à 100 molécules</strong> : le schéma arrondit τ à une molécule sur 100 ; il illustre la proportion, il ne représente pas la réalité microscopique.</li>
      <li><strong>Limites</strong> : seulement des monoacides (pas de polyacide), aucune autre réaction (CO₂ dissous, par exemple), pas de solution plus concentrée que 0,10 mol·L⁻¹ (les activités ne sont plus égales aux concentrations) ni plus diluée que 0,0010 mol·L⁻¹ (l’autoprotolyse de l’eau devient sensible pour un acide très faible comme l’ion ammonium).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène : équation, schéma des molécules, réglages ----------
  const compte = enExplore || (enGuide && apres('tau') && !cacher);
  const reglages = (choixC || choixAc) && (
    <div style={{ ...styleBoite, ...cadre('reglage') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages de l’expérience</div>
      {choixAc && <>
        {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4, lineHeight: 1.5 }}>1. Choisissez l’acide (chacun a sa constante d’acidité).</div>}
        <div role="group" aria-label="Acide étudié" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          {!enExplore && <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Acide étudié</span>}
          {M.ORDRE.filter(id => enExplore || id !== 'hcl').filter(id => enExplore || id !== 'nh4').map(id => <button key={id} onClick={() => choisirAc(id)} aria-pressed={ti.ac === id} style={stylePetitBouton(ti.ac === id, '#0f766e')}>{M.ACIDES[id].nom}{ti.vusA.includes(id) && !enExplore ? ' ✓' : ''}</button>)}
        </div>
      </>}
      {choixC && <>
        {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4, lineHeight: 1.5 }}>2. Choisissez la concentration apportée C (en mol·L⁻¹, « mole par litre ») : la quantité d’acide introduite par litre de solution.</div>}
        <div role="group" aria-label="Concentration apportée" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {!enExplore && <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Concentration C (mol·L⁻¹)</span>}
          {(enExplore ? CONC_BOUTONS : [0.01, 0.001]).map(c => <button key={c} onClick={() => choisirC(c)} aria-pressed={ti.c === c} style={stylePetitBouton(ti.c === c, '#b45309')}>{fmtC(c)}</button>)}
        </div>
      </>}
    </div>);
  const grilleBox = !dd && !cacher && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Pour 100 molécules d’acide introduites</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Chaque case est une molécule d’acide introduite dans l’eau : colorée si elle a réagi (taux d’avancement final τ), claire sinon. Un acide fort colore tout.</div>}
      <Grille ac={acId} tau={e.tau} compte={compte}/>
    </div>);

  // ---------- mesures ----------
  const montrerMesures = !cacher && (enExplore || (enGuide && deja('eth')));
  const mesures = montrerMesures && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Valeurs à l’état final de la solution choisie (pH-mètre virtuel à 2 décimales).</div>}
      <LigneMesure nom="pH" valeur={nbf(e.pH, 2)} couleur={COL.orange}/>
      {(enExplore || (enGuide && deja('phfaible'))) && <LigneMesure nom={`pH si l’acide était fort (−log C)`} valeur={nbf(M.pHFort(C), 2)} couleur={COL.vert}/>}
      {(enExplore || (enGuide && apres('tau'))) && <>
        <LigneMesure nom="[H₃O⁺]" valeur={`${fmtM(e.h)}${NB}mol·L⁻¹`}/>
        <LigneMesure nom={`[${a.A}]`} valeur={`${fmtM(e.A)}${NB}mol·L⁻¹`}/>
        <LigneMesure nom={`[${a.AH}]`} valeur={a.fort ? '≈ 0 (quasi nulle)' : `${fmtM(e.AH)}${NB}mol·L⁻¹`}/>
        <LigneMesure nom="Taux d’avancement final τ" valeur={fmtTau(e.tau)} couleur={COL.vert}/>
      </>}
      {(enExplore || (enGuide && apres('kaph'))) && <LigneMesure nom="K_A estimé d’après le pH" valeur={a.fort ? '— (acide fort)' : sci(M.kaDepuisPH(C, e.pH), 2)} couleur={COL.bleu}/>}
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, margin: '2px 0 4px', lineHeight: 1.5 }}>{avecIndices('On estime K_A à partir du pH seul : K_A = [H₃O⁺]² / (C − [H₃O⁺]).')}</div>}
      {(enExplore || (enGuide && apres('pka'))) && <LigneMesure nom="pK_A de référence" valeur={a.fort ? '—' : nbf(a.pKa, 2)}/>}
      {(enExplore || (enGuide && apres('ke'))) && <LigneMesure nom="[HO⁻]" valeur={`${sci(e.HO, 2)}${NB}mol·L⁻¹`}/>}
      {enExplore && <LigneMesure nom="Caractère de l’acide" valeur={a.fort ? 'fort (τ = 1)' : 'faible (τ < 1)'}/>}
    </div>);
  const tableau = !dd && ((enGuide && idE === 'compar' && ti.vusA.length > 0) || enExplore) && (
    <div style={{ ...styleBoite, ...cadre('tableau') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enExplore ? `Les cinq acides à C = ${fmtC(C)}${NB}mol·L⁻¹` : 'Acides comparés à C = 0,010 mol·L⁻¹'}</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Tous les acides à la même concentration : on les compare par leur pK<sub>A</sub>, leur pH et leur taux d’avancement τ. L’acide choisi est en gras.</div>}
      <TableauAcides ids={enExplore ? M.ORDRE : M.ORDRE.filter(id => ti.vusA.includes(id))} C={C} courant={acId}/>
    </div>);

  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Acide chlorhydrique à plusieurs concentrations : le pH suit-il −log C ? Que vaut τ ?</li>
        <li>{avecIndices('Acide éthanoïque de 0,10 à 0,0010 mol·L⁻¹ : comment évoluent le pH, τ et le K_A estimé ? Lequel change, lequel reste constant ?')}</li>
        <li>{avecIndices('À la même concentration, classez les cinq acides par pH croissant, puis par pK_A croissant : que remarquez-vous ?')}</li>
        <li>Ion ammonium : le pH est-il plus proche de celui d’un acide fort ou de celui de l’eau pure ? Que vaut τ ?</li>
        <li>Trouvez un acide faible et une concentration pour lesquels τ dépasse 0,3 : l’acide est-il alors devenu « fort » ? Comparez avec l’acide chlorhydrique.</li>
      </ul>
    </div>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Acide fort : réaction quasi-totale avec l’eau, τ = 1, pH = −log C</li>
        <li>Acide faible : réaction limitée (⇌), τ &lt; 1, pH &gt; −log C ; τ augmente quand on dilue</li>
        <li>K_A = [A⁻]·[H₃O⁺] / [AH] (sans unité) pour AH + H₂O ⇌ A⁻ + H₃O⁺ ; pK_A = −log K_A</li>
        <li>K_A estimé par le pH : K_A = [H₃O⁺]² / (C − [H₃O⁺]) ; plus pK_A est petit, plus l’acide est fort</li>
        <li>K_e = [H₃O⁺]·[HO⁻] = 1,0×10⁻¹⁴ à 25 °C ; acide faible : x² + K_A·x − K_A·C = 0</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .fa-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .fa-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .fa-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .fa-col { display: flex; flex-direction: column; gap: 12px; }
        @media (min-width: 901px) { .fa-l1.cote .fa-carte { order: 2; } .fa-l1.cote .fa-main { order: 1; } }
        @media (max-width: 900px) { .fa-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .fa-in { animation: fa-fondu 0.35s ease-out; } @keyframes fa-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Force des acides : constante d’acidité, pK<sub>A</sub> et produit ionique de l’eau</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un acide est <strong>fort</strong> s’il réagit totalement avec l’eau, <strong>faible</strong> sinon. On lit sa force dans son état final : <strong>taux d’avancement τ</strong>, <strong>constante d’acidité K<sub>A</sub></strong> et <strong>pK<sub>A</sub></strong>. (K<sub>e</sub> est le produit ionique de l’eau.)</div>
      <div className={`fa-l1${!enExplore ? ' cote' : ''}`}>
        {enGuide ? <div className="fa-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="fa-carte">{panneauHypo}</div> : null}
        <div className="fa-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'inconnu' ? suiviI : suiviP}/></div>}
          {!dd && <div className="fa-col">
            <Equation ac={acId} C={C}/>
            {reglages && <div className="fa-in">{reglages}</div>}
            {grilleBox && <div className="fa-in">{grilleBox}</div>}
            {mesures && <div className="fa-in">{mesures}</div>}
            {tableau && <div className="fa-in">{tableau}</div>}
          </div>}
        </div>
      </div>
      {enExplore && <div className="fa-l2">{aEssayer}{retenirExplore}</div>}
      {!enDefi && (!enGuide || deja('bilan')) && <div className="fa-l2">{panneauHypo}</div>}
    </div>
  );
}
