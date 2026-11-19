import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import * as D from "./dissolutionModele";
import { QCM } from "./dissolutionQcm";
import { SvgCristal, SvgTroisTemps, SvgEquation, SvgConcEffective, SvgMasseIons } from "./dissolutionSchemas";
import { SceneCristal, SceneNeutralite, SceneTroisTemps, SceneBecherIons, SceneBarres } from "./dissolutionScenes";

const SIM_ID = 157, CLE_GUIDE = 'dissolution-ionique-1g-guide-v1';
declarerDefis(SIM_ID, [['ion', 'Quelle est la concentration effective d’un ion ?'], ['masse', 'Quelle masse de solide faut-il peser pour obtenir une concentration en ion donnée ?']]);

// ====================================================
//  SIM 157 — DISSOLUTION D'UN SOLIDE IONIQUE DANS L'EAU : ÉQUATION ET CONCENTRATION DES IONS (1G spé PC, thème « Constitution et transformations
//  de la matière », partie 2.B « Cohésion, dissolution, solubilité »). Prérequis : simulation 53 (interactions, solubilité et miscibilité : le bilan
//  des interactions n'est pas refait ici), simulation 152 (n = m/M) et simulation 153 (c = n/V).
//  Une seule idée : de la formule statistique du cristal aux ions en solution, à l'équation et à leurs concentrations effectives.
//  Parcours (13 étapes) : cristal et formule statistique (3), trois temps (3), équations (3), concentrations effectives (3), bilan (1).
//  Capacités visées (jamais affichées à l'élève) : expliquer la capacité de l'eau à dissocier une espèce ionique et à solvater les ions ;
//  modéliser la dissolution d'un composé ionique par une équation, notations (s) et (aq) ; calculer la concentration des ions dans la solution.
//  La conductivité et la solubilité maximale ne sont pas des objectifs de cette partie : elles ne sont pas traitées.
// ====================================================

const NB = ' ';
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const sciF = (x, cs = 3) => { const [a, e] = Number(x).toExponential(cs - 1).split('e'); return `${a.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => (c === '-' ? '⁻' : SUP[c])).join('')}`; };
const nbs = (x, cs = 3) => {
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e6 || a < 1e-3) return sciF(x, cs);
  return Number(x.toPrecision(cs)).toFixed(Math.max(0, cs - 1 - Math.floor(Math.log10(a)))).replace('.', ',');
};
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', cat: '#2563eb', an: '#15803d' };
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// ---------- formules (MathML) ----------
const FIon = <Formule><mo>[</mo><mi>ion</mi><mo>]</mo><mo>=</mo><mi>coefficient</mi><mo>×</mo><mi>c</mi></Formule>;
const FN = <Formule><mi>n</mi><mo>=</mo><mfrac><mi>m</mi><mi>M</mi></mfrac></Formule>;
const FC = <Formule><mi>c</mi><mo>=</mo><mfrac><mi>n</mi><mi>V</mi></mfrac></Formule>;

const aide = (t) => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
// équation en texte HTML (blocs insécables qui passent à la ligne), 17 px
const equation = (eq) => <div style={{ fontSize: 17, fontWeight: 700, color: KIT.txt, textAlign: 'center', padding: '6px 4px 10px', lineHeight: 1.6 }}>{eq.split(' ').map((m, i) => <span key={i} style={{ whiteSpace: 'nowrap' }}>{m}{' '}</span>)}</div>;
const partie = (nu, q, sg) => `${nu === 1 ? '' : `${nu} × `}(${sg}${q})`;
const bilanCharge = s => `0 = ${partie(s.cat.nu, s.cat.q, '+')} + ${partie(s.an.nu, s.an.q, '−')}`;

const NACL = D.selDe('nacl'), MGCL2 = D.selDe('mgcl2'), NA2SO4 = D.selDe('na2so4'), ALCL3 = D.selDe('alcl3'), CACL2 = D.selDe('cacl2');

// ====================================================
export function SimulationDissolutionIonique() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviI, noterI] = useCompteurDefi(), [suiviM, noterM] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('ion');
  const [hypoOuv, setHypoOuv] = useState(false);
  // exploration
  const [ex, setEx] = useState({ objet: 'ions', sel: 'mgcl2', sens: 'c', c: 0.1, m: 2.4, V: 250, temps: 0, ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const setE = f => setEx(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['cristal', 'formule', 'neutralite', 'dissociation', 'solvatation', 'dispersion', 'eqNaCl', 'eqMgCl2', 'eqNa2SO4', 'ionMg', 'ionNa', 'appli', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => etape > IDS.indexOf(id);
  const fait = id => apres(id) || !!(guide.reussies && guide.reussies[IDS.indexOf(id)]);   // étape passée ou réussie à l'instant

  const ETAPES = [
    { id: 'cristal', titre: 'Ce qui tient le cristal', focus: ['scene'],
      texte: <>Le sel de cuisine, ou <strong>chlorure de sodium</strong>, est un <strong>solide cristallin</strong> : un empilement ordonné de particules chargées, les <strong>ions</strong>. Ici, des ions Na⁺ (cations) et des ions Cl⁻ (anions). Le schéma est une version simplifiée en deux dimensions.</>,
      tache: { type: 'qcm', ...QCM.cristal } },
    { id: 'formule', titre: 'Que dit la formule NaCl ?', focus: ['scene'],
      texte: <>Sur le flacon de sel, on lit la formule <strong>NaCl</strong>. Comptez, dans le schéma, les ions Na⁺ et les ions Cl⁻ : comment faut-il lire cette formule ?</>,
      tache: { type: 'qcm', ...QCM.formule } },
    { id: 'neutralite', titre: 'Des charges qui se compensent', focus: ['scene'],
      texte: <>Un cristal est <strong>électriquement neutre</strong> : il contient autant de charges positives que de charges négatives. Le chlorure d’aluminium solide est formé d’ions aluminium <strong>Al³⁺</strong> (3 charges +) et d’ions chlorure <strong>Cl⁻</strong> (1 charge − chacun). Pour un ion Al³⁺, combien d’ions Cl⁻ y a-t-il dans le cristal ?</>,
      tache: { type: 'num', q: 'Nombre d’ions Cl⁻ pour un ion Al³⁺', carnet: false, unite: 'ions Cl⁻', vrai: 3, tol: 0.01, affiche: v => nbf(v, 0),
        calcul: () => ['Charges positives d’un ion Al³⁺ : +3. Chaque ion Cl⁻ apporte une charge −1.', 'Il faut 3 ions Cl⁻ pour compenser : (+3) + 3 × (−1) = 0. La formule du solide est donc AlCl₃ : 1 ion Al³⁺ pour 3 ions Cl⁻.'],
        pieges: [[1, 'Un seul ion Cl⁻ ne compense qu’une charge sur les trois de Al³⁺ : le cristal ne serait pas neutre.'], [2, 'Deux ions Cl⁻ compensent seulement 2 des 3 charges positives : il en manque un.'], [4, 'On cherche le nombre d’ions Cl⁻ qui annule exactement les 3 charges positives, pas le nombre total d’ions.']],
        expl: 'Pour que la charge totale soit nulle : 1 × (+3) + n × (−1) = 0, donc n = 3. Le solide s’écrit AlCl₃.', indice: 'Il faut autant de charges − que de charges + : chaque Cl⁻ apporte une seule charge −.' } },
    { id: 'dissociation', titre: 'Le cristal dans l’eau', focus: ['scene'],
      texte: <>On plonge le cristal dans l’eau. La molécule d’eau H₂O est <strong>polaire</strong> : l’oxygène porte une charge partielle négative δ−, les hydrogènes une charge partielle positive δ+. Les molécules d’eau s’approchent des ions du cristal.</>,
      tache: { type: 'qcm', ...QCM.dissociation },
      retenirTitre: 'À RETENIR : LE CRISTAL IONIQUE',
      retenir: <>
        <SvgCristal/>
        <ul style={liste}>
          <li><strong>Empilement d’ions de signes opposés, cristal neutre</strong> : la formule <strong>statistique</strong> donne les proportions (NaCl : 1 Na⁺ pour 1 Cl⁻ ; MgCl₂ : 1 Mg²⁺ pour 2 Cl⁻).</li>
          <li><strong>Idée fausse</strong> : « une molécule NaCl existe ». <strong>Vrai</strong> : la formule compte les ions.</li>
        </ul>
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div></> },
    { id: 'solvatation', titre: 'Les ions séparés dans l’eau', focus: ['scene'],
      texte: <>Les ions se sont séparés du cristal. Une molécule d’eau est <strong>neutre</strong> mais <strong>polaire</strong> : son côté oxygène est négatif (δ−) et son côté hydrogène positif (δ+). Autour d’un ion, les molécules d’eau forment un entourage : c’est la <strong>solvatation</strong> (ou hydratation, quand le solvant est l’eau).</>,
      tache: { type: 'qcm', ...QCM.solvatation } },
    { id: 'dispersion', titre: 'Les ions dans la solution', focus: ['scene'],
      texte: <>Les ions se sont séparés du cristal et sont entourés de molécules d’eau (solvatation). Ils s’éloignent les uns des autres dans la solution.</>,
      tache: { type: 'qcm', ...QCM.dispersion } },
    { id: 'eqNaCl', titre: 'Écrire la dissolution du sel', focus: ['scene'],
      texte: <>On modélise la dissolution, <strong>à l’échelle macroscopique</strong>, par une <strong>équation</strong>. On note <strong>(s)</strong> l’espèce à l’état solide et <strong>(aq)</strong> une espèce dissoute dans l’eau, entourée de molécules d’eau.</>,
      tache: { type: 'qcm', ...QCM.equationNaCl },
      retenirTitre: 'À RETENIR : LES TROIS TEMPS',
      retenir: <>
        <SvgTroisTemps/>
        <ul style={liste}>
          <li><strong>Dissocier, Solvater, Disperser</strong> (D–S–D). Cation : l’<strong>oxygène (δ−)</strong> de l’eau est tourné vers lui ; anion : les <strong>hydrogènes (δ+)</strong>.</li>
          <li><strong>Idée fausse</strong> : « le sel fond et disparaît ». <strong>Vrai</strong> : les ions sont toujours là, entourés d’eau. L’eau affaiblit beaucoup l’attraction entre ions (environ 80 fois, ordre de grandeur qualitatif).</li>
        </ul>
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div></> },
    { id: 'eqMgCl2', titre: 'Dissoudre le chlorure de magnésium', focus: ['scene'],
      texte: <>Le chlorure de magnésium solide, <strong>MgCl₂</strong>, est formé d’ions magnésium <strong>Mg²⁺</strong> et d’ions chlorure <strong>Cl⁻</strong>. Comme pour NaCl, on écrit à gauche le solide et à droite les ions dissous.</>,
      tache: { type: 'qcm', ...QCM.equationMgCl2 } },
    { id: 'eqNa2SO4', titre: 'Dissoudre le sulfate de sodium', focus: ['scene'],
      texte: <>Certains ions sont formés de plusieurs atomes : ce sont des <strong>ions polyatomiques</strong>, comme l’ion sulfate SO₄²⁻ (sa charge est donnée, il ne se retrouve pas par le calcul). Le sulfate de sodium solide, <strong>Na₂SO₄</strong>, est formé d’ions sodium et d’ions sulfate.</>,
      tache: { type: 'qcm', ...QCM.equationNa2SO4 } },
    { id: 'ionMg', titre: 'La concentration des ions', focus: ['scene'],
      texte: <>La <strong>concentration en soluté apporté</strong> <em>c</em> est la quantité de solide dissous par litre de solution. La <strong>concentration effective</strong> d’un ion X, notée <strong>[X]</strong>, est la quantité de cet ion présente par litre de solution. On dissout du chlorure de magnésium dans l’eau pour obtenir une solution de <strong>c = 0,100{NB}mol/L</strong>.{equation(D.equation(MGCL2))}Quelle est la concentration effective [Cl⁻] en ions chlorure ?</>,
      tache: { type: 'num', q: 'Concentration effective en ions chlorure', carnet: '[Cl⁻] dans MgCl₂ à 0,100 mol/L', unite: 'mol/L', vrai: 0.2, tol: 0.01, affiche: v => nbf(v, 3),
        calcul: () => ['D’après l’équation, 1 mol de MgCl₂ dissoute libère 1 mol de Mg²⁺ et 2 mol de Cl⁻.', '[Cl⁻] = 2 × c = 2 × 0,100 mol/L = 0,200 mol/L (et [Mg²⁺] = 1 × c = 0,100 mol/L). Hypothèse : le solide est entièrement dissous.'],
        pieges: [[0.1, 'C’est la concentration en soluté apporté c (ou [Mg²⁺]) : chaque formule libère 2 ions Cl⁻.'], [0.05, 'On multiplie par le coefficient 2, on ne divise pas : il y a plus d’ions Cl⁻ que de formules dissoutes.'], [0.3, 'Ce nombre compte tous les ions (1 + 2) : on demande seulement les ions chlorure.']],
        expl: '[Cl⁻] = 2 × c = 0,200 mol/L : la concentration effective de Cl⁻ est le double de c.', indice: 'Lisez le coefficient devant Cl⁻ dans l’équation : combien d’ions Cl⁻ par formule dissoute ?' },
      retenirTitre: 'À RETENIR : L’ÉQUATION DE DISSOLUTION',
      retenir: <>
        <SvgEquation/>
        <ul style={liste}>
          <li><strong>Solide (s) à gauche, ions (aq) à droite</strong>, charge conservée, <strong>l’eau ne s’écrit pas</strong> ; un ion polyatomique (SO₄²⁻, NO₃⁻) reste groupé.</li>
          <li>Exemples : Na₂SO₄(s) → 2 Na⁺(aq) + SO₄²⁻(aq) ; AlCl₃(s) → Al³⁺(aq) + 3 Cl⁻(aq).</li>
        </ul>
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div></> },
    { id: 'ionNa', titre: 'La concentration en ions sodium', focus: ['scene'],
      texte: <>On dissout du sulfate de sodium pour obtenir une solution de <strong>c = 0,0400{NB}mol/L</strong> en soluté apporté.{equation(D.equation(NA2SO4))}Quelle est la concentration effective [Na⁺] en ions sodium ?</>,
      tache: { type: 'num', q: 'Concentration effective en ions sodium', carnet: '[Na⁺] dans Na₂SO₄ à 0,0400 mol/L', unite: 'mol/L', vrai: 0.08, tol: 0.01, affiche: v => nbs(v, 3),
        calcul: () => ['Dans l’équation, le coefficient devant Na⁺ est 2 : 1 mol de Na₂SO₄ libère 2 mol de Na⁺.', '[Na⁺] = 2 × c = 2 × 0,0400 mol/L = 0,0800 mol/L (et [SO₄²⁻] = 1 × c = 0,0400 mol/L).'],
        pieges: [[0.04, 'C’est c ou [SO₄²⁻] : chaque formule libère 2 ions Na⁺, donc [Na⁺] = 2 × c.'], [0.02, 'On multiplie par le coefficient 2, on ne divise pas.'], [0.12, 'Ce nombre compte tous les ions (2 + 1) : on demande seulement les ions sodium.']],
        expl: '[Na⁺] = 2 × c = 0,0800 mol/L ; [SO₄²⁻] = c = 0,0400 mol/L.', indice: 'Le coefficient devant Na⁺ dans l’équation donne le nombre d’ions Na⁺ par formule dissoute.' } },
    { id: 'appli', titre: 'Une solution préparée au laboratoire', focus: ['scene'],
      texte: <>On dissout <strong>m = 2,22{NB}g</strong> de chlorure de calcium CaCl₂ (masse molaire <strong>M = 111,1{NB}g/mol</strong>) dans une fiole jaugée de <strong>V = 250,0{NB}mL</strong>, complétée jusqu’au trait de jauge.{equation(D.equation(CACL2))}Quelle est la concentration effective [Cl⁻] en ions chlorure de la solution obtenue ?</>,
      tache: { type: 'num', q: 'Concentration effective en ions chlorure', carnet: '[Cl⁻] de la solution de CaCl₂', unite: 'mol/L', vrai: D.concAnion(CACL2, D.concApportee(D.quantite(2.22, 111.1), 0.25)), tol: 0.02, affiche: v => nbf(v, 3), cs: 3,
        calcul: () => ['Quantité de soluté : n = m / M = 2,22 g ÷ 111,1 g/mol = 1,998 × 10⁻² mol. Volume : V = 250,0 mL = 0,2500 L.', 'Soluté apporté : c = n / V = 1,998 × 10⁻² ÷ 0,2500 = 0,0799 mol/L. Coefficient de Cl⁻ : 2, donc [Cl⁻] = 2 × c = 0,160 mol/L. Hypothèses : solide pur et anhydre, entièrement dissous.'],
        pieges: [[0.08, 'C’est c (ou [Ca²⁺]) : il reste à multiplier par le coefficient 2 de Cl⁻.'], [0.02, 'C’est la quantité de matière n en mol : il faut diviser par le volume pour obtenir une concentration.'], [0.04, 'On multiplie par 2 avant de diviser par le volume : n = 1,998 × 10⁻² mol doit d’abord être divisée par V = 0,2500 L.']],
        expl: 'n = m / M = 0,01998 mol ; c = n / V = 0,0799 mol/L ; [Cl⁻] = 2 × c = 0,160 mol/L ; [Ca²⁺] = c = 0,0799 mol/L.', indice: 'Trois calculs : n = m / M, puis c = n / V (V en litres), puis [Cl⁻] = coefficient × c.' },
      retenirTitre: 'À RETENIR : LA CONCENTRATION EFFECTIVE',
      retenir: <>
        <SvgConcEffective/>
        {FIon}
        <ul style={liste}>
          <li><strong>Le coefficient de l’équation fait le multiplicateur</strong> ; la charge de l’ion n’intervient pas. Na₂SO₄ à 0,0400 mol/L : [Na⁺] = 0,0800 mol/L, [SO₄²⁻] = 0,0400 mol/L.</li>
          <li><strong>Idée fausse</strong> : « chaque ion a la concentration c ». <strong>Vrai</strong> : seulement si le coefficient vaut 1.</li>
        </ul>
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div></> },
    { id: 'bilan', titre: 'Bilan : concentrations effectives et soluté apporté', focus: ['scene'],
      texte: <>Question-bilan : les concentrations effectives en ions sont-elles toujours égales à la concentration c en soluté apporté ? On prépare une solution de chlorure d’aluminium AlCl₃ de <strong>c = 0,010{NB}mol/L</strong>.{equation(D.equation(ALCL3))}</>,
      tache: { type: 'qcm', ...QCM.bilan },
      retenirTitre: 'À RETENIR : DE LA MASSE AUX IONS',
      retenir: <>
        <SvgMasseIons/>
        {FN}{FC}
        <ul style={liste}>
          <li><strong>Masse, quantité de matière, concentration, concentration en ion</strong> : équation d’abord, calcul ensuite (V en litres).</li>
          <li>Hypothèse : solide pur, entièrement dissous, V = volume de la fiole jaugée.</li>
        </ul>
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div></> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { setDefi({ ...(type === 'ion' ? D.tirerDefiIon() : D.tirerDefiMasse()), type, reps: {}, verifie: false }); };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const x = lireNombre(defi.reps.v), ok = isFinite(x) && proche(x, defi.vrai, 0.02);
    setDefi(d => ({ ...d, verifie: true, ok })); (defi.type === 'ion' ? noterI : noterM)(ok);
  };
  const champ = (label, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.v ?? ''} aria-label={`${label} ${unite}`} onKeyDown={e => e.key === 'Enter' && document.getElementById('di-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, v: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const ionsTexte = s => <>Le solide est formé d’ions <strong>{s.cat.s}</strong> et <strong>{s.an.s}</strong>{s.an.poly ? ' (ion polyatomique)' : ''}.</>;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['ion', 'Concentration d’un ion'], ['masse', 'Masse à peser']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'ion' ? 'Défi : quelle est la concentration effective de cet ion ?' : 'Défi : quelle masse de solide faut-il peser ?'}</div>
      {defi.type === 'ion' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>On dissout <strong>m = {nbs(defi.m, 3)}{NB}g</strong> de {defi.s.nom} {defi.s.f} anhydre (masse molaire <strong>M = {nbf(defi.M, 1)}{NB}g/mol</strong>) dans une fiole jaugée de <strong>V = {nbf(defi.V, 1)}{NB}mL</strong>, complétée jusqu’au trait de jauge. {ionsTexte(defi.s)} Quelle est la concentration effective en ions {defi.ionS} ? Donnez le résultat en mol/L avec 3{NB}chiffres significatifs (marge acceptée : ± 2{NB}%).</div>
        {champ(`Concentration en ions ${defi.ionS}`, 'mol/L')}
        <IndiceDefi cache={false}>Écrivez l’équation de dissolution (le solide est neutre, donc la charge totale des ions vaut 0). Puis : n = m / M, c = n / V avec V en litres, et [{defi.ionS}] = coefficient de {defi.ionS} × c.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>On veut préparer <strong>V = {nbf(defi.V, 1)}{NB}mL</strong> d’une solution de {defi.s.nom} {defi.s.f} anhydre (masse molaire <strong>M = {nbf(defi.M, 1)}{NB}g/mol</strong>) dans laquelle la concentration effective en ions {defi.ionS} vaut <strong>[{defi.ionS}] = {nbs(defi.cible, 3)}{NB}mol/L</strong>. {ionsTexte(defi.s)} Quelle masse de solide faut-il peser ? Donnez le résultat en grammes avec 3{NB}chiffres significatifs (marge acceptée : ± 2{NB}%).</div>
        {champ('Masse à peser', 'g')}
        <IndiceDefi cache={false}>Écrivez l’équation de dissolution pour trouver c à partir de [{defi.ionS}] (c = [{defi.ionS}] / coefficient). Puis n = c × V (V en litres) et m = n × M.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="di-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? (defi.type === 'ion' ? `✓ Correct. ${D.equation(defi.s)} ; c = ${nbs(defi.c, 3)} mol/L ; [${defi.ionS}] = ${defi.nu} × c = ${nbs(defi.vrai, 3)} mol/L (marge acceptée : ± 2 %).`
          : `✓ Correct. ${D.equation(defi.s)} ; c = [${defi.ionS}] / ${defi.nu} = ${nbs(defi.c, 3)} mol/L ; m = c × V × M = ${nbs(defi.vrai, 3)} g (marge acceptée : ± 2 %).`)
          : defi.type === 'ion' ? `✗ Vérifiez : n = m / M, c = n / V avec V en litres, puis [${defi.ionS}] = coefficient × c (lisez le coefficient dans l’équation).`
            : '✗ Vérifiez : c = [ion] / coefficient (équation de dissolution), puis m = c × V × M, avec V en litres.'}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Solide pur et anhydre</strong> : les sels sont supposés purs et sans eau d’hydratation (le sulfate de cuivre(II) et le nitrate de fer(III) du commerce sont souvent hydratés ; la masse molaire utilisée est celle du solide anhydre).</li>
      <li><strong>Dissolution totale</strong> : le solide est entièrement dissous, aux concentrations proposées (au plus 0,5 mol/L en soluté apporté). La solubilité maximale n’est pas traitée ici.</li>
      <li><strong>Dissociation totale</strong> : tous les ions sont séparés (pas de paires d’ions) et ne réagissent pas avec l’eau. Dans la réalité, à forte concentration ou pour des ions très chargés (Al³⁺, Fe³⁺), ce modèle est moins fidèle ; il est suffisant à ce niveau.</li>
      <li><strong>Concentration effective</strong> : [ion] = coefficient × c, où le coefficient est celui de l’ion dans l’équation de dissolution et c la concentration en soluté apporté.</li>
      <li><strong>Schémas simplifiés</strong> : le cristal est dessiné en deux dimensions avec les bonnes proportions d’ions mais pas la vraie géométrie ; les tailles des ions et le nombre de molécules d’eau autour d’un ion (4 ou 5 ici) sont schématiques, comme leurs positions. Les distances ne sont pas à l’échelle.</li>
      <li><strong>Affaiblissement par l’eau</strong> : dans l’eau, l’attraction entre deux ions est environ 80 fois plus faible que dans le vide (ordre de grandeur, qualitatif).</li>
      <li><strong>Solution idéale</strong> : le volume de la solution est celui de la fiole jaugée (rempli jusqu’au trait de jauge) ; masses molaires atomiques arrondies au dixième (simulation « Quantité de matière »). Un résultat n’a pas plus de chiffres significatifs que la donnée la moins précise.</li>
      <li><strong>Ce qui n’est pas traité</strong> : la solubilité des solides ioniques dans d’autres solvants que l’eau (simulation « Solubilité et miscibilité »), la conductivité de la solution et la solubilité maximale.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const donnee = (nom, valeur, c) => <LigneMesure key={nom} nom={nom} valeur={valeur} couleur={c}/>;
  const eqFaite = s => <div style={{ marginTop: 8 }}>{equation(D.equation(s))}<div style={{ fontSize: 14, textAlign: 'center', color: KIT.txt2 }}>Bilan de charge : {bilanCharge(s)}</div></div>;
  const sceneGuide = (() => {
    switch (idE) {
      case 'cristal': return boite('Un cristal de chlorure de sodium', <SceneCristal sel={NACL} legendeBas={false}/>, cadre('scene'));
      case 'formule': return boite('Le cristal de chlorure de sodium NaCl', <SceneCristal sel={NACL} titre="Cristal de NaCl (schéma 2D simplifié)" legendeBas={false}/>, cadre('scene'));
      case 'neutralite': return boite('Rendre le cristal neutre', <SceneNeutralite sel={ALCL3} revele={fait('neutralite')}/>, cadre('scene'));
      case 'dissociation': return boite('Le cristal dans l’eau', <SceneTroisTemps sel={NACL} temps={1} annote={false}/>, cadre('scene'));
      case 'solvatation': return boite('Les ions séparés dans l’eau', <SceneTroisTemps sel={NACL} temps={2} revele={fait('solvatation')}/>, cadre('scene'));
      case 'dispersion': return boite('Les ions solvatés', <SceneTroisTemps sel={NACL} temps={3}/>, cadre('scene'));
      case 'eqNaCl': return boite('Du cristal aux ions', <><SceneTroisTemps sel={NACL} temps={3}/>{fait('eqNaCl') && eqFaite(NACL)}</>, cadre('scene'));
      case 'eqMgCl2': return boite('Le cristal de chlorure de magnésium', <><SceneCristal sel={MGCL2} titre="Cristal de MgCl₂ (schéma 2D simplifié)" legendeBas={false}/>{fait('eqMgCl2') && eqFaite(MGCL2)}</>, cadre('scene'));
      case 'eqNa2SO4': return boite('Le cristal de sulfate de sodium', <><SceneCristal sel={NA2SO4} titre="Cristal de Na₂SO₄ (schéma 2D simplifié)" legendeBas={false}/>{fait('eqNa2SO4') && eqFaite(NA2SO4)}</>, cadre('scene'));
      case 'ionMg': return boite('Une solution de chlorure de magnésium',
        <><SceneBecherIons sel={MGCL2} ions={fait('ionMg')} titre="Solution de chlorure de magnésium" sous="c = 0,100 mol/L en soluté apporté"/><div style={{ marginTop: 8 }}>
          {donnee('Soluté apporté c', `0,100${NB}mol/L`)}
          {fait('ionMg') && donnee('[Mg²⁺]', `0,100${NB}mol/L`, COL.cat)}{fait('ionMg') && donnee('[Cl⁻]', `0,200${NB}mol/L`, COL.orange)}</div></>, cadre('scene'));
      case 'ionNa': return boite('Une solution de sulfate de sodium',
        <><SceneBecherIons sel={NA2SO4} ions={fait('ionNa')} titre="Solution de sulfate de sodium" sous="c = 0,0400 mol/L en soluté apporté"/><div style={{ marginTop: 8 }}>
          {donnee('Soluté apporté c', `0,0400${NB}mol/L`)}
          {fait('ionNa') && donnee('[Na⁺]', `0,0800${NB}mol/L`, COL.orange)}{fait('ionNa') && donnee('[SO₄²⁻]', `0,0400${NB}mol/L`, COL.an)}</div></>, cadre('scene'));
      case 'appli': return boite('Une solution de chlorure de calcium',
        <><SceneBecherIons sel={CACL2} ions={fait('appli')} titre="Solution de chlorure de calcium" sous="250,0 mL de solution"/><div style={{ marginTop: 8 }}>
          {donnee('Masse dissoute m', `2,22${NB}g`)}{donnee('Masse molaire M', `111,1${NB}g/mol`)}{donnee('Volume de solution V', `250,0${NB}mL`)}
          {fait('appli') && donnee('Quantité de CaCl₂ n', `1,998${NB}×${NB}10⁻²${NB}mol`)}{fait('appli') && donnee('Soluté apporté c', `0,0799${NB}mol/L`)}
          {fait('appli') && donnee('[Ca²⁺]', `0,0799${NB}mol/L`, COL.cat)}{fait('appli') && donnee('[Cl⁻]', `0,160${NB}mol/L`, COL.orange)}</div></>, cadre('scene'));
      case 'bilan': return boite('Une solution de chlorure d’aluminium',
        <><SceneBecherIons sel={ALCL3} nF={3} ions={fait('bilan')} titre="Solution de chlorure d’aluminium" sous="c = 0,010 mol/L en soluté apporté"/>
          {fait('bilan') && <div style={{ marginTop: 8 }}><SceneBarres sel={ALCL3} c={0.01} fmt={v => nbs(v, 2)} max={0.034}/></div>}</>, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const etiquette = (l, ctrl) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{l}{ctrl}</label>;
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });
  const sE = D.selDe(ex.sel), ME = D.masseMolaire(sE), VL = ex.V / 1000;
  const optsSel = D.SELS.map(s => <option key={s.id} value={s.id}>{s.nom} {s.f}</option>);
  const selecteurSel = etiquette('Solide ionique', <select value={ex.sel} onChange={x => setE({ sel: x.target.value })} style={sel}>{optsSel}</select>);

  // --- objet 1 : les ions et leurs concentrations ---
  const mMax = Number((0.5 * VL * ME).toFixed(1)), pasM = mMax > 10 ? 0.1 : 0.01, mE0 = Math.min(mMax, Math.max(0.05, ex.m));
  const cE = ex.sens === 'c' ? ex.c : D.concApportee(D.quantite(mE0, ME), VL), nE = cE * VL, mE = nE * ME;
  const ionsReglages = (<>
    {selecteurSel}
    {etiquette('Je choisis…', <select value={ex.sens} onChange={x => setE({ sens: x.target.value })} style={sel}><option value="c">la concentration c</option><option value="m">la masse de solide pesée</option></select>)}
    {ex.sens === 'c'
      ? etiquette('Concentration en soluté apporté c', <select value={ex.c} onChange={x => setE({ c: Number(x.target.value) })} style={sel}>{[0.010, 0.020, 0.050, 0.100, 0.200, 0.500].map(c => <option key={c} value={c}>{nbs(c, 3)} mol/L</option>)}</select>)
      : <Curseur nom="Masse de solide pesée m" valeur={mE0} onChange={v => setE({ m: v })} min={0.05} max={Math.max(0.1, mMax)} pas={pasM} unite="g" decimales={pasM < 0.1 ? 2 : 1} couleur="#b45309"/>}
    {etiquette('Fiole jaugée (volume de solution)', <select value={ex.V} onChange={x => setE({ V: Number(x.target.value) })} style={sel}>{[100, 250, 500, 1000].map(v => <option key={v} value={v}>{v} mL</option>)}</select>)}
    {aide('Les concentrations des ions se déduisent de l’équation : le coefficient de chaque ion multiplie c.')}
  </>);
  const ionsScene = (<>
    {equation(D.equation(sE))}
    <div style={{ fontSize: 14, textAlign: 'center', color: KIT.txt2, marginBottom: 6 }}>Bilan de charge : {bilanCharge(sE)}</div>
    <SceneBecherIons sel={sE} nF={4} titre={`${sE.nom} ${sE.f}`} sous={`c = ${nbs(cE, 3)} mol/L en soluté apporté`}/>
  </>);
  const ionsMesures = (<>
    <SceneBarres sel={sE} c={cE} fmt={v => nbs(v, 3)} max={Math.max(cE, sE.cat.nu * cE, sE.an.nu * cE) * 1.12}/>
    <div style={{ marginTop: 8 }}>
      {donnee('Masse molaire M', `${nbf(ME, 1)}${NB}g/mol`)}
      {donnee(ex.sens === 'c' ? 'Masse à peser m = c × V × M' : 'Masse pesée m', `${nbs(mE, 3)}${NB}g`, COL.vert)}
      {donnee('Quantité de soluté n = m / M', `${nbs(nE, 3)}${NB}mol`)}
      {donnee('Soluté apporté c = n / V', `${nbs(cE, 3)}${NB}mol/L`, COL.orange)}
      {donnee(`[${sE.cat.s}] = ${sE.cat.nu} × c`, `${nbs(D.concCation(sE, cE), 3)}${NB}mol/L`, COL.cat)}
      {donnee(`[${sE.an.s}] = ${sE.an.nu} × c`, `${nbs(D.concAnion(sE, cE), 3)}${NB}mol/L`, COL.an)}
    </div></>);

  // --- objet 2 : le cristal et les trois temps ---
  const TEMPS = [[0, 'Le cristal avant la dissolution'], [1, 'Temps 1 : dissociation'], [2, 'Temps 2 : solvatation'], [3, 'Temps 3 : dispersion']];
  const DESC = { 0: 'Empilement ordonné d’ions de signes opposés, qui s’attirent. La formule donne les proportions : pas de molécule.',
    1: 'Les molécules d’eau polaires s’approchent et font écran : l’attraction entre ions voisins s’affaiblit (beaucoup plus faible : environ 80 fois, ordre de grandeur à retenir qualitativement).',
    2: 'Chaque anion attire les hydrogènes (δ+) des molécules d’eau, chaque cation leur oxygène (δ−) : interactions ion–dipôle.',
    3: 'Les ions solvatés s’éloignent et se répartissent parmi les molécules d’eau : ils ne reforment pas le cristal.' };
  const cristalReglages = (<>
    {selecteurSel}
    {etiquette('Étape de la dissolution', <select value={ex.temps} onChange={x => setE({ temps: Number(x.target.value) })} style={sel}>{TEMPS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>)}
    {aide('Choisissez un solide et parcourez les trois temps, du cristal jusqu’aux ions dispersés.')}
  </>);
  const cristalScene = ex.temps === 0 ? <SceneCristal sel={sE} titre={`Cristal de ${sE.f} (schéma 2D simplifié)`}/> : <SceneTroisTemps sel={sE} temps={ex.temps}/>;
  const cristalMesures = (<>
    <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>{DESC[ex.temps]}</div>
    <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
      <div><strong>Formule statistique :</strong> {sE.f}, soit {sE.cat.nu} ion{sE.cat.nu > 1 ? 's' : ''} {sE.cat.s} pour {sE.an.nu} ion{sE.an.nu > 1 ? 's' : ''} {sE.an.s}</div>
      <div><strong>Bilan de charge :</strong> {bilanCharge(sE)}</div>
    </div>
    {equation(D.equation(sE))}
  </>);

  const objets = [['ions', 'Les ions et leurs concentrations'], ['cristal', 'Le cristal et les trois temps']];
  const parObjet = {
    ions: [ionsReglages, ionsScene, ionsMesures, 'Une solution ionique : équation et concentrations des ions', 'Mesures et calculs'],
    cristal: [cristalReglages, cristalScene, cristalMesures, 'Le cristal et sa dissolution', 'Ce qu’il faut voir'],
  }[ex.objet];
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Choisissez le chlorure de sodium, puis le chlorure de calcium, avec la même concentration c : comparez [Cl⁻]. Pourquoi diffèrent-elles ?</li>
      <li>Avec le sulfate de sodium, quel ion a la plus grande concentration effective ? Quel coefficient l’explique ?</li>
      <li>Pour une même concentration c, quel sel donne le plus d’ions au total par litre ? Comparez NaCl, MgCl₂ et AlCl₃.</li>
      <li>Choisissez « la masse pesée » : pesez 5,0 g de NaCl puis 5,0 g de KCl dans une fiole de 250 mL. Pourquoi les concentrations diffèrent-elles ?</li>
      <li>Dans « les trois temps », observez un anion puis un cation : de quel côté sont tournées les molécules d’eau ?</li>
      <li>Pour chaque solide, comptez dans le cristal les ions des deux signes : retrouvez-vous les coefficients de l’équation ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>le cristal est un empilement d’ions ; sa formule (statistique) donne les proportions d’ions et le cristal est neutre</li>
        <li>dissolution : dissociation (l’eau polaire fait écran), solvatation (interactions ion–dipôle), dispersion des ions solvatés</li>
        <li>équation : solide (s) → ions (aq), charge conservée, on n’écrit pas l’eau ; ion polyatomique groupé (SO₄²⁻, NO₃⁻)</li>
        <li>concentration effective : [ion] = coefficient × c, avec c = n / V et n = m / M</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .di-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .di-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .di-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 900px) { .di-hypo-defi { order: 2; } }
        @media (min-width: 901px) { .di-l1.cote .di-carte { order: 2; } .di-l1.cote .di-main { order: 1; }
          .di-ex { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); }
          .di-ex > .di-ex-scene { grid-column: 1; grid-row: 1; } .di-ex > .di-ex-reglages { grid-column: 2; grid-row: 1 / span 2; } .di-ex > .di-ex-mesures { grid-column: 1; grid-row: 2; } }
        @media (max-width: 900px) { .di-l1.cote { grid-template-columns: minmax(0, 1fr); } .di-l1.cote .di-main { order: 1; } .di-l1.cote .di-carte { order: 2; } }
        @media (prefers-reduced-motion: no-preference) { .di-in { animation: di-fondu 0.35s ease-out; } @keyframes di-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Dissolution d’un solide ionique dans l’eau : équation et concentration des ions</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un <strong>solide ionique</strong> se dissout dans l’eau en <strong>ions</strong> : l’eau polaire les sépare (dissociation), les entoure (solvatation) puis ils se dispersent. On modélise la dissolution par une <strong>équation</strong> avec (s) et (aq), et on calcule la <strong>concentration de chaque ion</strong>.</div>
      {enExplore ? <>
        <div style={{ ...styleBoite, marginBottom: 12 }}>
          {etiquette('Que voulez-vous étudier ?', <select value={ex.objet} onChange={x => setE({ objet: x.target.value })} style={sel}>{objets.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>)}
        </div>
        <div className="di-ex">
          <div className="di-ex-scene">{boite(parObjet[3], parObjet[1])}</div>
          <div className="di-ex-reglages">{boite('Réglages', parObjet[0])}</div>
          <div className="di-ex-mesures">{boite(parObjet[4], parObjet[2])}</div>
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`di-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="di-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="di-carte di-hypo-defi">{panneauHypo}</div> : null}
          <div className="di-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'ion' ? suiviI : suiviM}/></div>}
            {enDefi && defi && <div className="di-in">{boite('La solution à étudier',
              <SceneBecherIons sel={defi.s} nF={4} ions={!!(defi.verifie && defi.ok)} titre={`${defi.s.nom} ${defi.s.f}`} sous={`${nbf(defi.V, 1)} mL de solution`}/>)}</div>}
            {enGuide && <div className="di-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && fait('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
