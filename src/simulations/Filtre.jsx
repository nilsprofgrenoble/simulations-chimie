import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, lireNombre, IndiceDefi, indicesProfond , Frac } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./filtreModele";
import { SceneFiltre } from "./FiltreScene";
import { SvgAmplCarte, SvgFcCarte, SvgNaturesCarte, SvgBandeCarte, SvgRCCarte } from "./FiltreSchemas";
import { useEtroit, useLecture, StyleAnim, BarreLecture, Chips, COL } from "./exploAnim";
import { usePhase, reduitMouvement } from "./hookHorloge";

// ====================================================
// SIM 316 — « Filtres passifs : passe-bas, passe-haut et fréquence de coupure » (terminale STL, SPCL, Systèmes et procédés : flux d'information).
//  Une idée : un filtre RC laisse passer certaines fréquences et en atténue d'autres ; on le caractérise par sa nature, son facteur d'amplification A(f) et sa fréquence de coupure fc (A = 0,7 × Amax).
//  Capacités visées (jamais affichées à l'élève) : exploiter des résultats expérimentaux pour caractériser un filtre (facteur d'amplification, nature, bande passante) ; déterminer expérimentalement A et la bande passante.
//  Hors périmètre : fonction de transfert complexe, ordre du filtre, diagramme de Bode asymptotique, déphasage (visible à l'oscilloscope, non étudié). Modèle : filtreModele.js. Scène animée : FiltreScene.jsx.
// ====================================================
const BLEU = '#0369a1', NB = M.NB, nb = M.nbf;
const SIM_ID = 316, CLE_GUIDE = 'filtre-guide-v1';
declarerDefis(SIM_ID, [['boite', 'Boîte noire : nature et fréquence de coupure'], ['sortie', 'Prévoir l’amplitude de la sortie']]);
const IDS = ['signal', 'lire', 'releve', 'nature', 'fc', 'haut', 'fcHaut', 'bande', 'rc', 'predire', 'bilan'];
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// valeurs utilisées dans le parcours (toutes annoncées dans le texte des étapes)
const FC1 = M.fcRC(220, 1), FCH = M.fcRC(1000, 1);
const A_1K = M.gain('bas', 1000, FC1), US_1K = A_1K * M.UE_MAX;
const A_2K = M.gain('bas', 2000, FC1), US_2K = A_2K * M.UE_MAX;
const FC1_ARR = Math.round(FC1 / 10) * 10, FCH_ARR = Math.round(FCH / 10) * 10;

const BASE = { nature: 'bas', R: 220, C: 1, circuit: 'boite', graphe: false, fixe: null, f0: 1000, voie2: true, courbe: 0, tracer: false, seuil: false, proj: false, marqueFc: false, bande: false, reperes: false, chipF: false, chipA: false, releve: false, rcSel: false, aide: '' };
const AIDE_P = 'Faites glisser la poignée rouge sur l’axe des fréquences (ou touchez le graphe) : le point, l’oscilloscope et les charges du circuit réagissent.';
const SCENES = {
  signal: { ...BASE, fixe: 1000, voie2: false },
  lire: { ...BASE, fixe: 1000 },
  releve: { ...BASE, graphe: true, releve: true, chipF: true, chipA: true, aide: AIDE_P },
  nature: { ...BASE, graphe: true, releve: true, tracer: true, chipF: true, chipA: true, aide: 'La courbe se trace à travers vos points. Vous pouvez encore déplacer la poignée rouge.' },
  fc: { ...BASE, graphe: true, circuit: 'rc', courbe: 1, seuil: true, proj: true, chipF: true, chipA: true, aide: 'Déplacez la poignée rouge jusqu’à ce que le point (cercle rouge) touche la ligne orange pointillée, puis lisez la fréquence.' },
  haut: { ...BASE, nature: 'haut', graphe: true, circuit: 'rc', courbe: 1, chipF: true, chipA: true, aide: AIDE_P },
  fcHaut: { ...BASE, nature: 'haut', R: 1000, graphe: true, circuit: 'rc', courbe: 1, seuil: true, proj: true, chipF: true, chipA: true, aide: 'Placez la poignée rouge là où la courbe coupe la ligne orange pointillée (A = 0,7).' },
  bande: { ...BASE, nature: 'haut', R: 1000, graphe: true, circuit: 'rc', courbe: 1, seuil: true, chipF: true, chipA: true, aide: AIDE_P },
  rc: { ...BASE, graphe: true, circuit: 'rc', courbe: 1, seuil: true, marqueFc: true, rcSel: true, chipF: true, chipA: true, aide: 'Changez R et C avec les menus : le trait orange vertical marque la fréquence de coupure.' },
  predire: { ...BASE, graphe: true, circuit: 'rc', courbe: 1, proj: true, fixe: 2000, chipF: true, aide: 'Le point rouge est placé à 2 000 Hz : lisez sa hauteur sur l’axe vertical (graduations de 0,1).' },
  bilan: { ...BASE, graphe: true, circuit: 'rc', courbe: 1, marqueFc: true, bande: true, reperes: true, rcSel: true, chipF: true, chipA: true, aide: AIDE_P },
};
const FREQS_RAPIDES = [[10, '10 Hz'], [100, '100 Hz'], [1000, '1 kHz'], [1e4, '10 kHz'], [1e5, '100 kHz']];
const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
const sel = (id, lab, v, onChange, opts) => (<div style={{ minWidth: 0 }}>
  <label htmlFor={id} style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{lab}</label>
  <select id={id} value={v} onChange={onChange} style={menu}>{opts}</select></div>);
const optsR = M.R_OPTIONS.map(v => <option key={v} value={v}>{M.RTxt(v)}</option>);
const optsC = M.C_OPTIONS.map(v => <option key={v} value={v}>{M.CTxt(v)}</option>);

// Scène du parcours guidé : la poignée règle f ; les points relevés sont conservés d'une étape à l'autre (par filtre)
function SceneGuide({ sc, pts, setPts, aria }) {
  const svgRef = useRef(null), boite = useRef(null), etroit = useEtroit(boite), anime = !reduitMouvement();
  const [f, setF] = useState(sc.f0), [touche, setTouche] = useState(false), [R, setR] = useState(sc.R), [C, setC] = useState(sc.C);
  const L = useLecture(4, sc.tracer && anime);
  const fe = sc.fixe ?? f, fc = M.fcRC(R, C), A = M.gain(sc.nature, fe, fc);
  const phase = usePhase(M.fVisuel(fe), anime);
  const courbe = sc.tracer ? (anime ? (L.fin ? 1 : L.t / 4) : 1) : sc.courbe;
  const cle = `${sc.nature}-${R}-${C}`, lst = pts[cle] || [];
  const regler = v => { setTouche(true); setF(v); };
  const relever = () => setPts(p => { const l = p[cle] || []; return l.some(x => Math.abs(x / fe - 1) < 0.02) ? p : { ...p, [cle]: [...l, fe] }; });
  const triees = [...lst].sort((a, b) => a - b);
  return (
    <div ref={boite} style={{ ...styleBoite, padding: 6 }}>
      <StyleAnim/>
      <SceneFiltre nature={sc.nature} R={R} C={C} fc={fc} f={fe} setF={regler} etroit={etroit} svgRef={svgRef} aria={aria} phase={phase}
        circuit={sc.circuit} graphe={sc.graphe} poignee={sc.fixe == null} touche={touche} courbe={courbe} points={sc.releve ? lst : []} seuil={sc.seuil} proj={sc.proj}
        marqueFc={sc.marqueFc} bande={sc.bande} reperes={sc.reperes} voie2={sc.voie2} ue={sc.ue ?? M.UE_MAX}/>
      {(sc.chipF || sc.chipA) && <Chips items={[sc.chipF && ['f', M.fTxt(fe), '#dc2626'], sc.chipA && ['A', nb(A, 2), '#0f766e']].filter(Boolean)}/>}
      {sc.rcSel && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 10 }}>
        {sel('fil-r', 'Résistance R', R, ev => setR(Number(ev.target.value)), optsR)}{sel('fil-c', 'Condensateur C', C, ev => setC(Number(ev.target.value)), optsC)}</div>}
      {sc.releve && <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Aller à :</span>
          {FREQS_RAPIDES.map(([v, l]) => <button key={v} type="button" onClick={() => regler(v)} aria-pressed={Math.abs(fe / v - 1) < 0.02} style={{ ...stylePetitBouton(Math.abs(fe / v - 1) < 0.02, '#dc2626'), minHeight: 40 }}>{l}</button>)}
          <button type="button" onClick={relever} style={{ ...styleBouton(true, '#0f766e'), minHeight: 44 }}>📍 Relever ce point</button>
          {sc.tracer && <button type="button" onClick={L.demarrer} style={{ ...styleBouton(false, '#0f766e'), minHeight: 44 }}>↻ Retracer la courbe</button>}
        </div>
        {triees.length > 0 && <div style={{ marginTop: 8, overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 14, width: '100%' }}>
            <thead><tr><th style={{ textAlign: 'left', padding: '3px 8px', color: KIT.txt2 }}>f</th>{triees.map(p => <th key={p} style={{ padding: '3px 8px', fontFamily: 'ui-monospace, monospace' }}>{M.fTxt(p)}</th>)}</tr></thead>
            <tbody><tr><td style={{ padding: '3px 8px', fontWeight: 700, color: KIT.txt2 }}>A</td>{triees.map(p => <td key={p} style={{ padding: '3px 8px', textAlign: 'center', fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: '#0f766e' }}>{nb(M.gain(sc.nature, p, fc), 2)}</td>)}</tr></tbody>
          </table></div>}
      </div>}
      {sc.aide && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 8, lineHeight: 1.45 }}>{sc.aide}</div>}
    </div>);
}

// Exploration libre : on choisit le filtre, on règle f (poignée) ou on lance un balayage de 10 Hz à 100 kHz
const T_BAL = 8;
const exInitial = () => ({ nature: 'bas', R: 220, C: 1, f: 1000, reperes: true, fcm: true, bande: false });
function FiltreExplore({ ex, setEx, ouv, setOuv }) {
  const svgRef = useRef(null), boite = useRef(null), etroit = useEtroit(boite), anime = !reduitMouvement();
  const L = useLecture(T_BAL, false), jeu = L.t > 0 || L.joue;
  const [touche, setTouche] = useState(false);
  const fc = M.fcRC(ex.R, ex.C), f = jeu ? M.F_MIN * 10 ** (4 * Math.min(1, L.t / T_BAL)) : ex.f;
  const A = M.gain(ex.nature, f, fc), phase = usePhase(M.fVisuel(f), anime);
  const regler = v => { L.reset(); setTouche(true); setEx(x => (x.f === v ? x : { ...x, f: v })); };
  const choisir = patch => { L.reset(); setEx(x => ({ ...x, ...patch })); };
  const dans = ex.nature === 'bas' ? f <= fc * 1.0000001 : f >= fc * 0.9999999;
  const message = !touche && !jeu ? 'Faites glisser la poignée rouge sur l’axe des fréquences (ou touchez le graphe) : l’oscilloscope, le circuit et le point sur la courbe réagissent. Ou lancez le balayage de 10 Hz à 100 kHz.'
    : `À ${M.fTxt(f)}, A = ${nb(A, 2)} : pour Ue,max = ${nb(M.UE_MAX, 1)}${NB}V, la sortie a une amplitude Us,max = ${M.UTxt(A * M.UE_MAX)}. ${dans ? 'Cette fréquence est dans la bande passante (A ≥ 0,7 × Amax) : le signal passe.' : 'Cette fréquence est hors de la bande passante (A < 0,7 × Amax) : le signal est atténué.'}`;
  const aria = `Circuit RC ${M.NATURES[ex.nature]} avec R = ${M.RTxt(ex.R)} et C = ${M.CTxt(ex.C)}, oscilloscope montrant les tensions d’entrée et de sortie à ${M.fTxt(f)}, et courbe du facteur d’amplification en fonction de la fréquence avec une poignée de fréquence.`;
  const tog = (cle, lab) => <button type="button" onClick={() => setEx(x => ({ ...x, [cle]: !x[cle] }))} aria-pressed={ex[cle]} style={{ ...stylePetitBouton(ex[cle], '#0f766e'), minHeight: 40 }}>{lab}</button>;
  return (
    <div ref={boite}>
      <StyleAnim/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <Section titre={`${M.NATURES[ex.nature]} · R = ${M.RTxt(ex.R)} · C = ${M.CTxt(ex.C)} · fc = ${M.fTxt(fc)}`} ouvert={ouv.filtre} onBascule={() => setOuv(o => ({ ...o, filtre: !o.filtre }))}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {sel('fx-nat', 'Montage', ex.nature, ev => choisir({ nature: ev.target.value }), [['bas', 'Passe-bas : R en série, C à la masse'], ['haut', 'Passe-haut : C en série, R à la masse']].map(([v, l]) => <option key={v} value={v}>{l}</option>))}
            {sel('fx-r', 'Résistance R', ex.R, ev => choisir({ R: Number(ev.target.value) }), optsR)}
            {sel('fx-c', 'Condensateur C', ex.C, ev => choisir({ C: Number(ev.target.value) }), optsC)}
          </div>
        </Section>
      </div>
      <SceneFiltre nature={ex.nature} R={ex.R} C={ex.C} fc={fc} f={f} setF={regler} etroit={etroit} svgRef={svgRef} aria={aria} phase={phase}
        circuit="rc" graphe courbe={1} touche={touche || jeu} seuil marqueFc={ex.fcm} bande={ex.bande} reperes={ex.reperes}/>
      <div role="status" aria-live="polite" style={{ minHeight: 70, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, color: KIT.txt2 }}>{message}</div>
      <div style={{ maxWidth: 920, margin: '0 auto 6px', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Afficher :</span>
        {tog('reperes', 'Amplitudes sur l’oscilloscope')}{tog('fcm', 'Fréquence de coupure')}{tog('bande', 'Bande passante')}
      </div>
      <BarreLecture L={L} tFin={T_BAL} libelle="▶ Balayer de 10 Hz à 100 kHz"/>
      <Chips items={[['f', M.fTxt(f), '#dc2626'], ['A', nb(A, 2), '#0f766e'], ['Us,max', M.UTxt(A * M.UE_MAX), COUL_US], ['G = 20 log A', `${nb(M.gainDB(A), 1)}${NB}dB`, COL.gris], ['fc', M.fTxt(fc), '#b45309'], ['Bande passante', dans ? 'dans la bande' : 'hors bande', dans ? '#15803d' : '#b45309']]}/>
    </div>);
}
const COUL_US = '#ea580c';

export function SimulationFiltre() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviB, noterB] = useCompteurDefi(), [suiviS, noterS] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [pts, setPts] = useState({});
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('boite');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ filtre: false, essayer: false, retenir: false });
  const [ex, setEx] = useState(exInitial);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const idx = enGuide ? Math.min(guide.etape, IDS.length - 1) : -1, idE = IDS[Math.max(idx, 0)];
  const nReleves = M.FREQS_TP.filter(v => (pts['bas-220-1'] || []).some(p => Math.abs(p / v - 1) < 0.12)).length;

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'signal', titre: 'Lire une tension sinusoïdale',
      texte: <>Un <strong>générateur basses fréquences (GBF)</strong> envoie une tension sinusoïdale Ue dans un circuit appelé <strong>filtre</strong>. L’oscilloscope affiche Ue (courbe bleue) en fonction du temps. Son amplitude, c’est-à-dire sa valeur maximale, est Ue,max = 2,0{NB}V. Sa <strong>période</strong> T est la durée d’une oscillation complète ; sa <strong>fréquence</strong> est f = <Frac haut={<>1</>} bas={<>T</>} />. Sur l’écran, 1{NB}carreau vaut 1{NB}V à la verticale et 200{NB}µs à l’horizontale (base de temps).</>,
      tache: { type: 'num', q: 'Quelle est la fréquence f de la tension Ue (en Hz) ?', unite: 'Hz', vrai: 1000, tol: 0.08, affiche: v => nb(v, 0), cs: 2, carnet: false,
        calcul: () => ['Une période occupe 5 carreaux de 200 µs : T = 5 × 200 µs = 1 000 µs = 1,0 ms.', 'f = frac(1|T) = frac(1|0,0010 s) = 1 000 Hz.'],
        pieges: [[1, 'Vous avez donné la période en ms. La fréquence est l’inverse de la période : f = frac(1|T).'], [0.001, 'Vous avez donné la période en secondes. La fréquence est l’inverse de la période : f = frac(1|T).'], [200, '200 est la durée d’un carreau (en µs). Comptez les carreaux d’une période (de sommet à sommet) pour obtenir T, puis f = frac(1|T).']],
        expl: 'T = 5 × 200 µs = 1,0 ms, donc f = frac(1|T) = 1 000 Hz.', indice: 'Comptez les carreaux entre deux sommets successifs de la courbe bleue, multipliez par la durée d’un carreau (200 µs) pour obtenir T, puis calculez f = frac(1|T).' } },
    { id: 'lire', titre: 'Mesurer le facteur d’amplification',
      texte: <>La tension traverse maintenant le filtre. En sortie, on observe la tension Us (courbe orange), d’amplitude Us,max. L’effet du filtre se mesure par son <strong>facteur d’amplification</strong> A = <Frac haut={<>Us,max</>} bas={<>Ue,max</>} />, un nombre sans unité. On garde f = 1{NB}000{NB}Hz et Ue,max = 2,0{NB}V. Les deux voies ont le même calibre (1{NB}V par carreau) ; l’axe central porte des graduations de 0,2{NB}V.</>,
      tache: { type: 'num', q: 'Lisez Us,max sur l’oscilloscope, puis calculez A à 1 000 Hz.', unite: '', vrai: A_1K, tol: 0.10, affiche: v => nb(v, 2), cs: 2, carnet: false,
        calcul: () => [`La courbe orange atteint environ ${nb(US_1K, 1)} carreau, soit Us,max ≈ ${nb(US_1K, 1)} V.`, `A = frac(Us,max|Ue,max) = frac(${nb(US_1K, 1)}|2,0) = ${nb(A_1K, 2)} (valeur exacte du modèle : ${nb(A_1K, 2)}).`],
        pieges: [[US_1K, 'Vous avez donné Us,max (une tension en volts). Le facteur d’amplification est le rapport frac(Us,max|Ue,max), sans unité.'], [1 / A_1K, 'Vous avez calculé frac(Ue,max|Us,max), à l’envers. Ici le filtre atténue : A = frac(Us,max|Ue,max) est inférieur à 1.']],
        expl: `Us,max ≈ ${nb(US_1K, 1)} V, donc A = frac(${nb(US_1K, 1)}|2,0) ≈ ${nb(A_1K, 2)}.`, indice: 'Mesurez la hauteur du sommet de la courbe orange au-dessus de l’axe central, en carreaux (1 carreau = 1 V), puis divisez par Ue,max = 2,0 V.' } },
    { id: 'releve', titre: 'Relever A à plusieurs fréquences',
      retenirTitre: 'À retenir : le facteur d’amplification',
      retenir: <><SvgAmplCarte/><ul style={ULS}>
        <li><strong>A = <Frac haut={<>Us,max</>} bas={<>Ue,max</>} /></strong> : rapport des amplitudes de sortie et d’entrée, sans unité.</li>
        <li>Un filtre passif n’amplifie pas : <strong>A ≤ 1</strong>.</li>
        <li>A dépend de la fréquence f du signal d’entrée.</li></ul></>,
      texte: <>Pour savoir comment le filtre se comporte, on relève A pour plusieurs fréquences, comme en TP : une par décade, de 10{NB}Hz à 100{NB}kHz. Placez la poignée rouge sur l’axe des fréquences (échelle logarithmique : chaque graduation multiplie f par 10) ou utilisez les boutons, puis cliquez sur « Relever ce point » : le tableau se remplit et le point se marque sur le graphe.</>,
      tache: { type: 'action', ok: nReleves >= 5, consigne: `Fréquences relevées : ${nReleves} sur 5 (10 Hz, 100 Hz, 1 kHz, 10 kHz, 100 kHz).`, attente: nReleves >= 5 ? null : 'Relevez les cinq fréquences pour continuer.' } },
    { id: 'nature', titre: 'Passe-bas ou passe-haut ?',
      texte: <>La courbe A(f) se trace à travers vos points. Un filtre <strong>passe-bas</strong> laisse passer les basses fréquences (A proche de son maximum) et atténue les hautes fréquences ; un filtre <strong>passe-haut</strong> fait l’inverse. Les filtres <strong>passe-bande</strong> laissent passer une plage de fréquences, et les filtres <strong>réjecteurs</strong> en atténuent une plage. Observez la courbe qui se trace.</>,
      tache: { type: 'qcm', q: 'Quelle est la nature de ce filtre ?', options: ['passe-bas', 'passe-haut', 'passe-bande', 'réjecteur'], bonne: 0,
        expl: 'A est proche de 1 aux basses fréquences (10 Hz, 100 Hz) et devient très petit aux hautes fréquences (10 kHz, 100 kHz) : le filtre laisse passer les basses fréquences, c’est un passe-bas.',
        indice: 'Regardez A à 10 Hz et à 100 kHz : à quelles fréquences le signal passe-t-il presque sans atténuation ?' } },
    { id: 'fc', titre: 'La fréquence de coupure',
      texte: <>Le filtre est un circuit RC : une résistance R = 220{NB}Ω en série et un condensateur C = 1{NB}µF relié à la masse. On note <strong>Amax</strong> la valeur maximale de A (ici Amax = 1). La <strong>fréquence de coupure</strong> fc est la fréquence pour laquelle A = <Frac haut={<>Amax</>} bas={<>√2</>} /> ≈ 0,7 × Amax : c’est la limite entre « laissé passer » et « atténué ». Le trait orange pointillé est tracé à A = 0,7.</>,
      tache: { type: 'num', q: 'Déterminez la fréquence de coupure fc de ce filtre (en Hz).', unite: 'Hz', vrai: FC1, tol: 0.12, affiche: v => nb(v, 0), cs: 2, carnet: false,
        calcul: () => ['On cherche la fréquence pour laquelle A = 0,7 × Amax = 0,7 × 1 = 0,7.', `On place la poignée là où la courbe coupe le trait orange : f ≈ ${nb(FC1_ARR, 0)} Hz.`],
        pieges: [[0.7, 'Le nombre 0,7 est la valeur de A à la coupure. On demande la fréquence correspondante, en hertz.'], [1, 'Le nombre 1 est la valeur maximale de A. La fréquence de coupure est celle pour laquelle A vaut 0,7.']],
        expl: `La courbe coupe le trait A = 0,7 vers ${nb(FC1_ARR, 0)} Hz : fc ≈ ${nb(FC1_ARR, 0)} Hz.`, indice: 'Déplacez la poignée jusqu’à ce que le point rouge arrive sur la ligne orange pointillée (A = 0,7), puis lisez f sur la pastille rouge.' } },
    { id: 'haut', titre: 'Et si on échange R et C ?',
      retenirTitre: 'À retenir : la fréquence de coupure',
      retenir: <><SvgFcCarte/><ul style={ULS}>
        <li><strong>fc</strong> est la fréquence pour laquelle A = <Frac haut={<>Amax</>} bas={<>√2</>} /> ≈ 0,7 × Amax.</li>
        <li>On la lit là où la courbe coupe la ligne A = 0,7 × Amax.</li>
        <li>Passe-bas : A proche de Amax en dessous de fc. Passe-haut : au-dessus de fc.</li></ul></>,
      texte: <>On échange maintenant la place de R et de C : le condensateur est en série et la résistance est reliée à la masse, avec les mêmes valeurs (R = 220{NB}Ω, C = 1{NB}µF). Déplacez la poignée et observez la courbe.</>,
      tache: { type: 'qcm', q: 'Quelle est la nature de ce nouveau filtre ?', options: ['passe-bas', 'passe-haut', 'passe-bande', 'réjecteur'], bonne: 1,
        expl: 'Ici A est presque nul aux basses fréquences et tend vers 1 aux hautes fréquences : c’est un passe-haut. Les deux montages ont la même fréquence de coupure (environ 720 Hz) car ils ont les mêmes R et C.',
        indice: 'Comparez A à 10 Hz et à 100 kHz : à quelles fréquences le signal passe-t-il presque sans atténuation ?' } },
    { id: 'fcHaut', titre: 'Déterminer fc d’un passe-haut',
      retenirTitre: 'À retenir : passe-bas et passe-haut',
      retenir: <><SvgNaturesCarte/><ul style={ULS}>
        <li><strong>Passe-bas</strong> : R en série, C à la masse ; il laisse passer les basses fréquences.</li>
        <li><strong>Passe-haut</strong> : C en série, R à la masse ; il laisse passer les hautes fréquences.</li>
        <li>Dans les deux cas, A ≤ 1 : le filtre est passif.</li></ul></>,
      texte: <>On garde le montage passe-haut, mais la résistance vaut maintenant R = 1{NB}kΩ (C = 1{NB}µF inchangé). Amax = 1, donc le trait orange pointillé est toujours à A = 0,7.</>,
      tache: { type: 'num', q: 'Déterminez la fréquence de coupure fc de ce passe-haut (en Hz).', unite: 'Hz', vrai: FCH, tol: 0.12, affiche: v => nb(v, 0), cs: 2, carnet: false,
        calcul: () => ['On cherche la fréquence pour laquelle A = 0,7 × Amax = 0,7.', `La courbe coupe le trait orange vers ${nb(FCH_ARR, 0)} Hz.`],
        pieges: [[0.7, 'Le nombre 0,7 est la valeur de A à la coupure : on demande la fréquence correspondante, en hertz.'], [FC1, 'Vous avez repris la fréquence de coupure du montage précédent (R = 220 Ω). Avec R = 1 kΩ, la courbe a changé : relisez f à A = 0,7.']],
        expl: `La courbe coupe A = 0,7 vers ${nb(FCH_ARR, 0)} Hz : fc ≈ ${nb(FCH_ARR, 0)} Hz.`, indice: 'Placez la poignée rouge là où la courbe passe par la ligne orange pointillée (A = 0,7), puis lisez f.' } },
    { id: 'bande', titre: 'La bande passante',
      texte: <>La <strong>bande passante</strong> d’un filtre est l’ensemble des fréquences qu’il laisse passer : celles pour lesquelles A ≥ 0,7 × Amax. Pour le passe-haut précédent (R = 1{NB}kΩ, C = 1{NB}µF), la fréquence de coupure est fc ≈ {nb(FCH_ARR, 0)}{NB}Hz.</>,
      tache: { type: 'qcm', q: 'Quelle est la bande passante de ce passe-haut ?', options: [`les fréquences inférieures à ${nb(FCH_ARR, 0)} Hz`, `les fréquences supérieures à ${nb(FCH_ARR, 0)} Hz`, 'toutes les fréquences entre 10 Hz et 100 kHz', `la seule fréquence de ${nb(FCH_ARR, 0)} Hz`], bonne: 1,
        expl: 'Au-dessus de fc, A ≥ 0,7 × Amax : ces fréquences passent. En dessous de fc, le signal est atténué.',
        indice: 'La bande passante est l’ensemble des fréquences pour lesquelles A ≥ 0,7. Sur la courbe, la courbe est au-dessus du trait orange pour quelles fréquences ?' } },
    { id: 'rc', titre: 'Effet de R et de C',
      retenirTitre: 'À retenir : la bande passante',
      retenir: <><SvgBandeCarte/><ul style={ULS}>
        <li>La <strong>bande passante</strong> est l’ensemble des fréquences pour lesquelles A ≥ 0,7 × Amax.</li>
        <li>Passe-bas : de 0 à fc. Passe-haut : de fc vers les hautes fréquences.</li>
        <li>Hors de la bande passante, le signal est atténué.</li></ul></>,
      texte: <>La fréquence de coupure dépend des composants. Revenez au filtre passe-bas (R = 220{NB}Ω, C = 1{NB}µF, fc ≈ {nb(FC1_ARR, 0)}{NB}Hz). Changez R et C avec les menus et observez le trait vertical orange, qui marque fc.</>,
      tache: { type: 'qcm', q: 'On remplace C = 1 µF par C = 0,1 µF (R inchangée). Que devient fc ?', options: ['elle augmente', 'elle diminue', 'elle ne change pas', 'elle devient nulle'], bonne: 0,
        expl: `Avec C = 0,1 µF, le trait orange passe de ${nb(FC1_ARR, 0)} Hz à environ ${nb(Math.round(M.fcRC(220, 0.1) / 10) * 10, 0)} Hz : fc augmente. Plus le produit R × C est petit, plus fc est grande.`,
        indice: 'Choisissez C = 0,1 µF dans le menu et regardez de quel côté se déplace le trait orange vertical.' } },
    { id: 'predire', titre: 'Prévoir la sortie',
      retenirTitre: 'À retenir : R et C fixent fc',
      retenir: <><SvgRCCarte/><ul style={ULS}>
        <li>Plus le produit <strong>R × C</strong> est grand, plus fc est petite.</li>
        <li>Repère : fc = <Frac haut={<>1</>} bas={<>2π × R × C</>} />, avec R en ohms et C en farads.</li>
        <li>En changeant R ou C, on déplace la courbe A(f) vers les basses ou les hautes fréquences.</li></ul></>,
      texte: <>Le filtre est connu : on peut prévoir sa sortie sans refaire de mesure. On envoie dans le passe-bas (R = 220{NB}Ω, C = 1{NB}µF) une tension d’amplitude Ue,max = 2,0{NB}V à la fréquence f = 2{NB}000{NB}Hz. Lisez A sur la courbe (graduations de 0,1), puis calculez Us,max = A × Ue,max.</>,
      tache: { type: 'num', q: 'Quelle est l’amplitude Us,max de la tension de sortie (en V) ?', unite: 'V', vrai: US_2K, tol: 0.12, affiche: v => nb(v, 2), cs: 2, carnet: false,
        calcul: () => [`À 2 000 Hz, la courbe donne A ≈ ${nb(A_2K, 2)}.`, `Us,max = A × Ue,max = ${nb(A_2K, 2)} × 2,0 = ${nb(US_2K, 2)} V.`],
        pieges: [[A_2K, 'Vous avez donné A, qui n’a pas d’unité. L’amplitude de sortie est Us,max = A × Ue,max.'], [2, 'À 2 000 Hz le filtre atténue : Us,max est inférieure à Ue,max = 2,0 V.']],
        expl: `Us,max = A × Ue,max = ${nb(A_2K, 2)} × 2,0 ≈ ${nb(US_2K, 2)} V.`, indice: 'Lisez la hauteur du point rouge sur l’axe vertical (c’est A), puis multipliez par 2,0 V.' } },
    { id: 'bilan', titre: 'Le bilan',
      texte: <>Vous savez mesurer le facteur d’amplification A = <Frac haut={<>Us,max</>} bas={<>Ue,max</>} />, tracer A en fonction de la fréquence, reconnaître un filtre passe-bas ou passe-haut, lire sa fréquence de coupure (A = 0,7 × Amax) et sa bande passante, et prévoir l’amplitude de la sortie. En exploration, choisissez le montage, R et C, puis balayez la fréquence. Dans les défis, vous caractérisez un filtre inconnu (nature et fc), puis vous prévoyez une amplitude de sortie.</>,
      tache: null },
  ];

  const nouveauDefi = type => setDefi({ type, ...(type === 'boite' ? M.tirageDefiBoite() : M.tirageDefiPrevoir()), nat: null, rep: '', verifie: false, corr: false });
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const choisirDefi = t => { setTypeDefi(t); nouveauDefi(t); };
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- défis ----------
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const saisie = { font: 'inherit', fontSize: 16, padding: '8px 10px', minHeight: 44, borderRadius: 10, border: `1.5px solid ${KIT.bord}`, width: '100%', boxSizing: 'border-box' };
  const verifier = () => {
    const x = lireNombre(defi.rep), dq = defi.type === 'boite' ? M.diagBoite(defi, defi.nat, x) : M.diagPrevoir(defi, x);
    setDefi(d => ({ ...d, verifie: true, ok: dq.ok, dq })); (defi.type === 'boite' ? noterB : noterS)(dq.ok);
  };
  const modifie = patch => setDefi(d => ({ ...d, ...patch, verifie: false, corr: false }));
  const voletDefi = defi && (() => {
    const bo = defi.type === 'boite';
    return (<div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['boite', 'Boîte noire'], ['sortie', 'Prévoir la sortie']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={typeDefi === t} style={stylePetitBouton(typeDefi === t, BLEU)}>{l}</button>)}
      </div>
      {bo ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : le filtre inconnu</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Un filtre RC est caché dans la boîte. Déplacez la poignée rouge, relevez des points, puis déterminez sa <strong>nature</strong> et sa <strong>fréquence de coupure fc</strong> (là où A = 0,7 × Amax, avec Amax = 1). Tolérance de lecture : 12{NB}%.</div>
        <div style={{ ...lbl, fontWeight: 700 }}>Nature du filtre</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '4px 0 8px' }}>
          {[['bas', 'Passe-bas'], ['haut', 'Passe-haut']].map(([v, l]) => <button key={v} onClick={() => modifie({ nat: v })} aria-pressed={defi.nat === v} style={{ ...stylePetitBouton(defi.nat === v, '#0f766e'), minHeight: 42 }}>{l}</button>)}
        </div>
        <label style={{ ...lbl, display: 'block' }}>Fréquence de coupure fc (Hz)
          <input type="text" inputMode="text" autoComplete="off" value={defi.rep} onChange={e => modifie({ rep: e.target.value })} aria-label="fréquence de coupure en hertz" style={{ ...saisie, marginTop: 2 }}/></label>
        <div style={{ height: 8 }}/>
        <IndiceDefi cache={false}>Regardez A aux fréquences extrêmes (10 Hz et 100 kHz) pour savoir si le filtre est passe-bas ou passe-haut. Puis cherchez la fréquence pour laquelle A = 0,7 : c’est fc.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : prévoir la sortie</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Le filtre est un {M.NATURES[defi.nature]} (R = {M.RTxt(defi.R)}, C = {M.CTxt(defi.C)}). On lui applique une tension d’amplitude Ue,max = {nb(defi.ue, 1)}{NB}V à la fréquence f = {M.fTxt(defi.f)}. <strong>Lisez</strong> A sur la courbe (point rouge, graduations de 0,1) et calculez l’amplitude Us,max de la sortie, en V (tolérance de lecture 15{NB}%).</div>
        <label style={{ ...lbl, display: 'block' }}>Amplitude Us,max (V)
          <input type="text" inputMode="text" autoComplete="off" value={defi.rep} onChange={e => modifie({ rep: e.target.value })} aria-label="amplitude de sortie en volts" style={{ ...saisie, marginTop: 2 }}/></label>
        <div style={{ height: 8 }}/>
        <IndiceDefi cache={false}>Lisez A (hauteur du point rouge sur l’axe vertical), puis Us,max = A × Ue,max.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} disabled={!defi.rep.trim() || (bo && !defi.nat)} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        {defi.verifie && !defi.ok && <button onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={styleBouton(false, '#b45309')}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button>}
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? (bo ? `✓ Correct : un filtre ${M.NATURES[defi.nature]} de fréquence de coupure ${M.fTxt(defi.fc)}.` : `✓ Correct : Us,max ≈ ${nb(defi.vrai, 2)}${NB}V (A = ${nb(defi.A, 2)}).`) : `✗ ${defi.dq.msg}`}
      </div>}
      {defi.verifie && !defi.ok && defi.corr && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        {bo ? <>
          <div>Nature : <strong>{M.NATURES[defi.nature]}</strong> (A proche de {defi.nature === 'bas' ? '1 aux basses fréquences' : '1 aux hautes fréquences'}).</div>
          <div>fc : fréquence pour laquelle A = 0,71 : <strong>{M.fTxt(defi.fc)}</strong> environ (tolérance : de {M.fTxt(defi.fc * 0.88)} à {M.fTxt(defi.fc * 1.12)}). Ici R = {M.RTxt(defi.R)} et C = {M.CTxt(defi.C)}.</div></>
          : <>
          <div>Lecture : à {M.fTxt(defi.f)}, A ≈ {nb(defi.A, 2)}.</div>
          <div>Us,max = A × Ue,max = {nb(defi.A, 2)} × {nb(defi.ue, 1)} = <strong>{nb(defi.vrai, 2)}{NB}V</strong> (tolérance : de {nb(defi.vrai * 0.85, 2)} à {nb(defi.vrai * 1.15, 2)}{NB}V).</div></>}
      </div>}
    </div>);
  })();

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Filtres RC du premier ordre</strong>, composants idéaux, sans charge à la sortie : on néglige la résistance de sortie du générateur et la résistance d’entrée de l’oscilloscope. En TP, ces éléments et la tolérance des composants (5 ou 10 %) écartent un peu les mesures des valeurs idéales.</li>
      <li><strong>Facteur d’amplification</strong> : A = <Frac haut={<>Us,max</>} bas={<>Ue,max</>} />, calculé à partir des amplitudes de deux sinusoïdes de même fréquence. Les formules A = <Frac haut={<>1</>} bas={<>√(1 + <Frac haut={<>f</>} bas={<>fc</>} />²)</>} /> pour le passe-bas et A = <Frac haut={<><Frac haut={<>f</>} bas={<>fc</>} /></>} bas={<>√(1 + <Frac haut={<>f</>} bas={<>fc</>} />²)</>} /> pour le passe-haut, avec fc = <Frac haut={<>1</>} bas={<>2πRC</>} />, servent à tracer la courbe ; elles ne sont pas exigibles : on exploite la courbe.</li>
      <li><strong>Fréquence de coupure</strong> : A = <Frac haut={<>Amax</>} bas={<>√2</>} /> ≈ 0,707 × Amax (ici Amax = 1), ce qui correspond à un gain G = 20 log A de −3 dB (affiché pour repère en exploration, non exigé). La <strong>bande passante</strong> est l’ensemble des fréquences pour lesquelles A ≥ 0,707 × Amax.</li>
      <li><strong>Oscilloscope</strong> : Ue,max = 2,0 V dans le parcours, calibre 1 V par carreau sur les deux voies ; la base de temps est choisie parmi 1 – 2 – 5 pour que la période occupe 2 à 5 carreaux. Les charges du circuit et la courbe défilent à une vitesse lente, indépendante de la fréquence réelle (animation qualitative).</li>
      <li><strong>Déphasage</strong> : la sortie est décalée dans le temps par rapport à l’entrée (retard pour le passe-bas, avance pour le passe-haut) ; ce décalage est dessiné mais n’est pas étudié.</li>
      <li><strong>Lecture graphique</strong> : tolérance de 10 à 12 % au parcours et dans la boîte noire, de 15 % pour Us,max ; la courbe a une échelle de fréquence logarithmique.</li>
      <li><strong>Composants</strong> : valeurs normalisées de R (100 Ω à 4,7 kΩ) et de C (0,1 µF à 2,2 µF) ; fréquence de coupure entre 15 Hz et 16 kHz.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Lancez le balayage avec le passe-bas : à quelle fréquence l’amplitude de la courbe orange devient-elle égale à 70 % de celle de la courbe bleue ?</li>
        <li>Passez au passe-haut avec les mêmes R et C : quelle est la fréquence de coupure ? Est-elle la même que pour le passe-bas ?</li>
        <li>Choisissez R = 4,7 kΩ puis C = 0,1 µF : combien de décades la fréquence de coupure se déplace-t-elle quand on divise C par 10 ?</li>
        <li>Affichez la bande passante : quelles fréquences sont transmises par un passe-bas de fc = 700 Hz ? Un signal de 3 kHz est-il transmis ?</li>
        <li>À très haute fréquence avec le passe-bas, l’amplitude de la sortie semble disparaître : A est-elle exactement nulle ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
        <li>Facteur d’amplification : A = <Frac haut={<>Us,max</>} bas={<>Ue,max</>} /> (sans unité, A ≤ 1 pour un filtre passif).</li>
        <li>Passe-bas : laisse passer les basses fréquences. Passe-haut : laisse passer les hautes fréquences.</li>
        <li>Fréquence de coupure fc : A = <Frac haut={<>Amax</>} bas={<>√2</>} /> ≈ 0,7 × Amax. Bande passante : fréquences pour lesquelles A ≥ 0,7 × Amax.</li>
        <li>R × C plus grand : fc plus petite (repère : fc = <Frac haut={<>1</>} bas={<>2πRC</>} />).</li>
      </ul>)}
    </Section>);

  // ---------- scène du parcours ----------
  const sc = enGuide ? SCENES[idE] : null;
  const ariaSc = sc ? `Oscilloscope montrant la tension d’entrée${sc.voie2 ? ' et la tension de sortie d’un filtre' : ''}${sc.graphe ? ', avec la courbe du facteur d’amplification en fonction de la fréquence et une poignée rouge pour régler la fréquence' : ''}.` : '';
  const scDefi = defi ? (defi.type === 'boite'
    ? { ...BASE, nature: defi.nature, R: defi.R, C: defi.C, graphe: true, releve: true, chipF: true, chipA: true, aide: 'Déplacez la poignée rouge, observez l’oscilloscope et relevez des points pour faire apparaître la forme de la courbe.' }
    : { ...BASE, nature: defi.nature, R: defi.R, C: defi.C, graphe: true, circuit: 'rc', courbe: 1, proj: true, fixe: defi.f, chipF: true, ue: defi.ue, aide: 'Le point rouge est placé à la fréquence demandée : lisez sa hauteur sur l’axe vertical (graduations de 0,1).' }) : null;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .fil-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .fil-l1.cote { grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr); }
        @media (max-width: 900px) { .fil-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .fil-in { animation: fil-fondu 0.35s ease-out; } @keyframes fil-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Filtres passifs : passe-bas, passe-haut et fréquence de coupure</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un <strong>filtre</strong> laisse passer certaines <strong>fréquences</strong> et en atténue d’autres : on le caractérise par son <strong>facteur d’amplification</strong>, sa <strong>nature</strong> et sa <strong>fréquence de coupure</strong>.</div>
      {!enExplore && <div className={`fil-l1${(enGuide && sc) || (enDefi && scDefi) ? ' cote' : ''}`}>
        {enGuide ? <div><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div>{panneauHypo}</div> : null}
        <div>
          {enDefi && defi && <div style={styleBoite}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'boite' ? suiviB : suiviS}/></div>}
          {enDefi && scDefi && <div key={`d${defi.type}${defi.R}${defi.C}${defi.nature}${defi.f || ''}`} style={{ marginTop: 10 }}><SceneGuide sc={scDefi} pts={pts} setPts={setPts} aria="Oscilloscope, circuit et courbe du facteur d’amplification d’un filtre, avec une poignée rouge pour régler la fréquence."/></div>}
          {enGuide && sc && <div className="fil-in" key={`s${idE}`}><SceneGuide sc={sc} pts={pts} setPts={setPts} aria={ariaSc}/></div>}
        </div>
      </div>}
      {enExplore && <div>
        <FiltreExplore ex={ex} setEx={setEx} ouv={ouv} setOuv={setOuv}/>
        <div style={{ maxWidth: 920, margin: '10px auto 0' }}>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idx >= IDS.length - 1 && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
