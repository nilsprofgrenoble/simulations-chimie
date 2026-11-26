import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./fluoModele";
import { QCM } from "./fluoQcm";
import { SceneJablonski, SceneEmission, SceneSpectresFluo, SvgCarteJablonski, SvgCarteTemps, SvgCarteBilanFluo } from "./FluoSchemas";

const SIM_ID = 301, CLE_GUIDE = 'fluo-guide-v1';
declarerDefis(SIM_ID, [['stokes', 'Énergie perdue entre absorption et émission'], ['duree', 'Quelle lumière après l’arrêt ?']]);

// ====================================================
//  SIM 301 — FLUORESCENCE ET PHOSPHORESCENCE : DIAGRAMME DE PERRIN-JABLONSKI (BTS MDC, Analyse)
//  Capacités visées (jamais affichées à l'élève) : différencier fluorescence et phosphorescence ; décrire à l'aide du diagramme de Perrin-Jablonski
//  les processus (absorption, relaxation vibrationnelle, conversion interne, croisement intersystème, émission).
//  Modèle : fluoModele.js. Schémas : FluoSchemas.jsx.
// ====================================================

const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const NB = '\u00a0';
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const ORDRE = ['absorption', 'relaxation', 'fluo', 'stokes', 'cis', 'phos', 'temps', 'ecart', 'spectres', 'tri', 'bilan'];
const BASE = { te: -9 };
const DEPART = { temps: { te: -9 } };
const arrondi3 = v => Number(Number(v).toPrecision(3));
const txtT = t => { const e = Math.round(Math.log10(t)); if (Math.abs(Math.log10(t) - e) < 0.02) { const s = String(e).replace('-', '⁻').replace(/\d/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]); return `10${s}${NB}s`; } return `${t.toExponential(1)}${NB}s`; };
const ST = { S0: 'S₀ (état fondamental)', S1: 'S₁', T1: 'T₁' };
const num2 = s => parseFloat(String(s).replace(/\s|\u00a0/g, '').replace(',', '.').replace('−', '-'));
const A = M.MOLS.A, B = M.MOLS.B;
const DE_STOKES = M.decalageStokes(350, 450), DE_ST = M.energie(420) - M.energie(520);

export function SimulationFluorescence() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const idDe = g => ORDRE[Math.min(g.etape ?? 0, ORDRE.length - 1)];
  const [vie, setVie] = useState(() => ({ ...BASE, ...(DEPART[idDe(guide)] ?? {}) }));
  const [ex, setEx] = useState({ onglet: 'diagramme', proc: '', mol: 'B', te: -9 });
  const [ouv, setOuv] = useState({});
  const [suiviS, noterS] = useCompteurDefi(), [suiviD, noterD] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('stokes');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const tV = 10 ** vie.te;

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'absorption', titre: 'L’absorption d’un photon', focus: ['scene'],
      texte: <>Une molécule dans son état fondamental <strong>S₀</strong> reçoit un photon de 350{NB}nm. Si l’énergie du photon correspond à un écart entre deux niveaux, il est <strong>absorbé</strong> (en 10⁻¹⁵{NB}s environ). Le diagramme de <strong>Perrin-Jablonski</strong> représente les états : S₀, S₁, S₂ (électrons de spins opposés) et T₁ (spins parallèles), chacun avec des sous-niveaux de vibration.</>,
      tache: { type: 'qcm', q: 'Que se passe-t-il lors de l’absorption du photon ?', ...QCM.absorption,
        expl: 'Le photon transfère son énergie à la molécule : un électron passe à un niveau d’énergie plus élevé (état excité S₁ ou S₂). Les noyaux n’ont pas le temps de bouger pendant 10⁻¹⁵ s.', indice: 'Regardez la flèche violette : elle monte de S₀ vers un état excité.' } },
    { id: 'relaxation', titre: 'Relaxation vibrationnelle et conversion interne', focus: ['scene'],
      texte: <>Juste après l’absorption, la molécule est dans un sous-niveau de vibration élevé. Elle <strong>descend</strong> les sous-niveaux en 10⁻¹²{NB}s : c’est la <strong>relaxation vibrationnelle</strong> (RV). Si elle est en S₂, elle passe à S₁ par <strong>conversion interne</strong> (CI), toujours en 10⁻¹²{NB}s. Ces processus sont <strong>non radiatifs</strong> : aucun photon n’est émis.</>,
      tache: { type: 'qcm', q: 'Que devient l’énergie perdue lors de la relaxation vibrationnelle ?', ...QCM.relaxation,
        expl: 'La RV et la CI sont non radiatives : l’énergie est transférée au milieu environnant (collisions avec le solvant), qui s’échauffe très légèrement.', indice: 'Non radiatif signifie « sans émission de photon ».' } },
    { id: 'fluo', titre: 'La fluorescence', focus: ['scene'],
      texte: <>Arrivée au bas de S₁, la molécule peut revenir à S₀ en <strong>émettant un photon</strong> : c’est la <strong>fluorescence</strong>, en 10⁻⁹{NB}s environ. Elle a perdu de l’énergie par relaxation vibrationnelle avant d’émettre.</>,
      tache: { type: 'qcm', q: 'Comparée à la longueur d’onde du photon absorbé, celle du photon émis par fluorescence est…', ...QCM.fluo,
        expl: 'La RV a fait perdre de l’énergie : le photon émis est moins énergétique que le photon absorbé, donc sa longueur d’onde est plus grande (E = h·c/λ). C’est le décalage de Stokes.', indice: 'Moins d’énergie, c’est une plus grande longueur d’onde.' } },
    { id: 'stokes', titre: 'Calculer l’énergie perdue', focus: ['scene'],
      texte: <>Une molécule absorbe à <strong>350{NB}nm</strong> et fluoresce à <strong>450{NB}nm</strong>. On utilise E(eV) × λ(nm) = 1243. Calculez l’énergie perdue entre l’absorption et l’émission.</>,
      tache: { type: 'num', q: 'Énergie perdue entre le photon absorbé (350 nm) et le photon émis (450 nm)', unite: 'eV', vrai: arrondi3(DE_STOKES), tol: 0.06, affiche: v => fr(v, 2), cs: 2,
        calcul: () => [`E(abs) = 1243 / 350 ≈ ${fr(1243 / 350, 2)} eV ; E(émis) = 1243 / 450 ≈ ${fr(1243 / 450, 2)} eV.`, `Énergie perdue = ${fr(1243 / 350, 2)} − ${fr(1243 / 450, 2)} ≈ ${fr(DE_STOKES, 2)} eV, soit 22 % de l’énergie absorbée (cédée par RV).`],
        pieges: [[1243 / 100, 'Vous avez utilisé la différence des longueurs d’onde (100 nm) : il faut calculer chaque énergie, puis les soustraire.'], [1243 / 450, 'C’est l’énergie du photon émis : l’énergie perdue est la différence avec le photon absorbé.'], [1243 / 350 + 1243 / 450, 'Vous avez additionné les énergies : l’énergie perdue est leur différence.']],
        expl: 'L’énergie du photon est inversement proportionnelle à λ : on calcule E(abs) et E(émis), puis la différence. Le résultat, environ 0,79 eV, est de l’ordre de grandeur d’une relaxation vibrationnelle.', indice: 'E = 1243 / λ pour chacun des deux photons, puis soustraction.' } },
    { id: 'cis', titre: 'Le croisement intersystème', focus: ['scene'],
      texte: <>Pour certaines molécules, un autre chemin existe : de S₁, la molécule passe à l’état <strong>triplet T₁</strong> par <strong>croisement intersystème</strong> (CIS, 10⁻⁸{NB}s). Dans T₁, les spins des deux électrons sont parallèles : l’énergie de T₁ est inférieure à celle de S₁. Le CIS est non radiatif.</>,
      tache: { type: 'qcm', q: 'Que peut-on dire de l’état T₁ ?', ...QCM.cis,
        expl: 'T₁ est plus bas en énergie que S₁ et on l’atteint depuis S₁ par un processus non radiatif, le croisement intersystème, qui change le spin.', indice: 'Regardez la position de T₁ par rapport à S₁ sur le schéma.' } },
    { id: 'phos', titre: 'La phosphorescence', retenirTitre: 'À retenir : fluorescence ou phosphorescence', retenir: <SvgCarteJablonski/>, focus: ['scene'],
      texte: <>De T₁, le retour à S₀ avec émission d’un photon est la <strong>phosphorescence</strong>. Ce retour change le spin : il est très peu probable, donc <strong>lent</strong> (de 10⁻²{NB}s à 10²{NB}s). La molécule reste donc longtemps en T₁ et la lumière persiste après l’arrêt de l’excitation.</>,
      tache: { type: 'qcm', q: 'Après l’arrêt d’une lampe UV, quelle émission persiste plusieurs secondes ?', ...QCM.phos,
        expl: 'La fluorescence s’éteint en quelques nanosecondes. La phosphorescence, issue de T₁, peut durer de quelques millisecondes à plusieurs minutes (étoiles phosphorescentes).', indice: 'Cherchez le retour le plus lent sur le diagramme.' } },
    { id: 'temps', titre: 'Après l’arrêt de la lumière', retenirTitre: 'À retenir : une échelle de temps', retenir: <SvgCarteTemps/>, focus: ['scene', 'curseur', 'mesures'],
      texte: <>Une molécule phosphorescente est excitée puis la lampe est coupée (t = 0). Le curseur règle le temps écoulé depuis la coupure. Cherchez un moment où la <strong>phosphorescence</strong> est encore visible alors que la <strong>fluorescence</strong> s’est éteinte.</>,
      tache: { type: 'action', ok: vie.te >= -6 && vie.te <= 0, label: 'Régler le temps entre 1 µs et 1 s', faire: () => setVie(v => ({ ...v, te: -3 })), consigne: 'Placez le curseur entre 10⁻⁶ s et 1 s' } },
    { id: 'ecart', titre: 'S₁ et T₁ : quel écart d’énergie ?', focus: ['scene'],
      texte: <>Une molécule fluoresce à <strong>420{NB}nm</strong> (retour S₁ → S₀) et phosphoresce à <strong>520{NB}nm</strong> (retour T₁ → S₀). On admet que les énergies des photons mesurent les écarts S₁ − S₀ et T₁ − S₀ (relaxations dans l’état final négligées). E(eV) × λ(nm) = 1243.</>,
      tache: { type: 'num', q: 'Écart d’énergie entre S₁ et T₁', unite: 'eV', vrai: arrondi3(DE_ST), tol: 0.06, affiche: v => fr(v, 2), cs: 2,
        calcul: () => [`E(fluo) = 1243 / 420 ≈ ${fr(1243 / 420, 2)} eV ; E(phospho) = 1243 / 520 ≈ ${fr(1243 / 520, 2)} eV.`, `E(S₁) − E(T₁) = ${fr(1243 / 420, 2)} − ${fr(1243 / 520, 2)} ≈ ${fr(DE_ST, 2)} eV. Hypothèse : on néglige la relaxation vibrationnelle dans S₀ après émission.`],
        pieges: [[1243 / 100, 'Vous avez utilisé la différence des longueurs d’onde (100 nm) : calculez chaque énergie, puis soustrayez.'], [1243 / 520, 'C’est l’énergie du photon de phosphorescence : on cherche la différence avec celle du photon de fluorescence.'], [1243 / 420, 'C’est l’énergie du photon de fluorescence : on cherche la différence avec celle du photon de phosphorescence.']],
        expl: 'Plus le photon est de grande longueur d’onde, moins il est énergétique : T₁ est donc plus bas que S₁, d’environ 0,57 eV pour cette molécule.', indice: 'E = 1243 / λ pour 420 nm puis pour 520 nm, puis soustraction.' } },
    { id: 'spectres', titre: 'Spectre d’absorption et spectre d’émission', focus: ['scene'],
      texte: <>On trace l’intensité absorbée et l’intensité émise en fonction de λ. Le spectre d’absorption (violet) a son maximum à 350{NB}nm, celui de fluorescence (vert) à 450{NB}nm.</>,
      tache: { type: 'qcm', q: 'Par rapport au spectre d’absorption, le spectre d’émission de fluorescence est…', ...QCM.spectres,
        expl: 'À cause de la relaxation vibrationnelle, la molécule émet des photons moins énergétiques que ceux qu’elle absorbe : le spectre d’émission est décalé vers les grandes longueurs d’onde, avec une forme voisine de celle de l’absorption en image miroir.', indice: 'Les photons émis ont perdu de l’énergie.' } },
    { id: 'tri', titre: 'Fluorescence ou phosphorescence ?', focus: ['scene'],
      texte: <>On éclaire un échantillon, puis on coupe la lampe. Deux secondes plus tard, l’échantillon émet encore une lueur verte. L’intensité de chaque émission est schématisée ci-dessous à t = 2{NB}s.</>,
      tache: { type: 'qcm', q: 'Cette lueur est celle…', ...QCM.tri,
        expl: 'Deux secondes après l’arrêt, la fluorescence (durée de l’ordre de la nanoseconde) est éteinte depuis longtemps : une lueur persistante est de la phosphorescence.', indice: 'Comparez 2 s aux durées caractéristiques de chaque émission.' } },
    { id: 'bilan', titre: 'Le bilan : le diagramme de Perrin-Jablonski', focus: [],
      retenirTitre: 'À retenir : fluorescence et phosphorescence', retenir: <><SvgCarteBilanFluo/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}><li>Absorption, RV et CI : très rapides (≤ 10⁻¹² s) ; RV et CI sont non radiatives.</li><li>Fluorescence : S₁ → S₀, 10⁻⁹ s ; phosphorescence : T₁ → S₀, lente, après un CIS.</li></ul></>,
      texte: <>Vous savez décrire les processus d’un diagramme de Perrin-Jablonski, distinguer fluorescence et phosphorescence par leur origine et leur durée, et prévoir le décalage vers les grandes longueurs d’onde. En exploration, étudiez deux molécules et l’évolution après l’arrêt de la lumière ; les défis testent le calcul de l’énergie perdue et l’identification de la lumière émise. Pour la suite : la spectrofluorimétrie.</> },
  ];
  const etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? ORDRE[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, ORDRE.length - 1);
    if (ni !== Math.min(guide.etape, ORDRE.length - 1)) setVie(() => ({ ...BASE, ...(DEPART[ORDRE[ni]] ?? {}) }));
    setGuide(nv);
  };
  const sc = idE;
  const ACTIFS = { absorption: 'absorption', relaxation: ['absorption', 'rv', 'ci'], fluo: ['absorption', 'rv', 'ci', 'fluo'], stokes: ['absorption', 'fluo'], cis: ['fluo', 'cis'], phos: null, ecart: ['fluo', 'phos', 'cis'] };
  const sceneGuide = !enGuide ? null
    : sc in ACTIFS ? <SceneJablonski actif={ACTIFS[sc]} durees={sc !== 'stokes' && sc !== 'ecart'}/>
    : sc === 'temps' ? <><SceneJablonski actif={null} etat={M.etatDominant(B, tV)}/><div style={{ height: 6 }}/><SceneEmission mol={B} t={tV}/></>
    : sc === 'spectres' ? <SceneSpectresFluo mol={A}/>
    : sc === 'tri' ? <SceneEmission mol={B} t={2}/>
    : null;
  const MES_GUIDE = { temps: [['Temps depuis la coupure', txtT(tV)], ['État peuplé', ST[M.etatDominant(B, tV)]], ['Lumière émise', M.classeEmission(B, tV)]] };
  const lignesGuide = enGuide ? (MES_GUIDE[sc] ?? []) : [];
  const curs = (id, lab_, val, min, max, step, onCh, aide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={onCh} aria-label={lab_} style={{ width: '100%', accentColor: '#16a34a' }}/>
    {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}</div>);
  const selecteur = (id, lab_, val, onCh, options, vide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <select id={id} value={val} onChange={onCh} style={selectStyle}>{vide && <option value="">{vide}</option>}{options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>);
  const curseurTemps = (id, te, onT) => curs(id, `Temps écoulé : ${txtT(10 ** te)}`, te, -15, 3, 1, ev => onT(parseInt(ev.target.value, 10)), 'Échelle logarithmique, de 10⁻¹⁵ s à 10³ s.');
  const curseurGuide = enGuide && sc === 'temps' ? <div style={{ ...styleBoite, ...cadre('curseur') }}>{curseurTemps('fl-te', vie.te, te => setVie(v => ({ ...v, te })))}</div> : null;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'stokes' ? { ...M.tirageDefiStokes(Math.random), rep1: '', verifie: false } : { ...M.tirageDefiDuree(Math.random), rep1: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const maj = f => setDefi(x => ({ ...x, ...f, verifie: false }));
  const verifier = () => {
    let ok;
    if (defi.kind === 'stokes') { ok = Math.abs(num2(defi.rep1) - defi.dE) <= 0.06 * defi.dE; noterS(ok); }
    else { ok = defi.rep1 === defi.rep; noterD(ok); }
    setDefi(x => ({ ...x, verifie: true, ok }));
  };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['stokes', 'Énergie perdue'], ['duree', 'Quelle lumière ?']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#16a34a')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.kind === 'stokes' ? 'Défi : l’énergie perdue avant l’émission' : 'Défi : quelle lumière après l’arrêt ?'}</div>
      {defi.kind === 'stokes' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>Une molécule absorbe un photon de <strong>{defi.lamAbs}{NB}nm</strong> et fluoresce à <strong>{defi.lamEm}{NB}nm</strong>. Quelle énergie a été perdue entre l’absorption et l’émission ? (E(eV) × λ(nm) = 1243 ; 2 chiffres significatifs ; précision attendue : 6 %)</div>
        <div style={{ marginTop: 8 }}><label htmlFor="fl-d1" style={libelle}>Énergie perdue (eV)</label><input id="fl-d1" inputMode="decimal" value={defi.rep1} onChange={ev => maj({ rep1: ev.target.value })} style={{ ...selectStyle, maxWidth: 220 }} autoComplete="off"/></div></>
      : <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Une molécule phosphorescente (fluorescence : durée de vie 2{NB}ns ; phosphorescence : 1{NB}s) est excitée, puis la lampe est coupée. On observe l’échantillon <strong>{defi.txt}</strong> après la coupure. On juge une émission visible tant que son intensité dépasse 1{NB}% de sa valeur initiale.</div>
        {selecteur('fl-d2', 'Quelle lumière observe-t-on ?', defi.rep1, ev => maj({ rep1: ev.target.value }), ['les deux', 'phosphorescence seule', 'aucune'].map(s => ({ id: s, nom: s })), 'Choisir…')}</>}
      <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>{defi.kind === 'stokes'
        ? <>E = 1243 / λ pour chacun des deux photons, puis E(abs) − E(émis).</>
        : <>Intensité = exp(−t/τ) : une émission est visible tant que t est inférieur à environ 4,6 τ (1 %). Comparez t à 2{NB}ns puis à 1{NB}s.</>}</IndiceDefi></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'stokes' ? <>Réponse : {fr(defi.dE, 2)}{NB}eV.</> : <>Réponse : {defi.rep}.</>}
      </div>}
    </div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#16a34a')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const mol = M.MOLS[ex.mol], tE = 10 ** ex.te, pr = M.PROCESSUS.find(p => p.id === ex.proc);
  const aucun = ex.proc === '' ? null : ex.proc === 'rv' ? ['rv'] : ex.proc === 'ci' ? ['ci'] : ex.proc;
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{ex.onglet === 'diagramme' ? 'Choisissez un processus' : ex.onglet === 'temps' ? 'Faites passer le temps' : 'Choisissez la molécule'}</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>{ex.onglet === 'diagramme' ? 'Le processus choisi est mis en valeur sur le diagramme ; les durées sont des ordres de grandeur.'
        : ex.onglet === 'temps' ? 'Le curseur règle le temps écoulé depuis l’arrêt de l’excitation. Le point noir indique l’état le plus peuplé, les barres l’intensité de chaque émission.'
        : 'Les spectres sont schématiques. Comparez la position des maxima d’absorption et d’émission.'}</div>
      {ex.onglet === 'diagramme' && selecteur('fl-ep', 'Processus', ex.proc, ev => setEx(e => ({ ...e, proc: ev.target.value })), M.PROCESSUS.map(p => ({ id: p.id, nom: p.nom })), 'Tous les processus')}
      {ex.onglet !== 'diagramme' && selecteur('fl-em', 'Molécule', ex.mol, ev => setEx(e => ({ ...e, mol: ev.target.value })), Object.values(M.MOLS))}
      {ex.onglet === 'temps' && curseurTemps('fl-ete', ex.te, te => setEx(e => ({ ...e, te })))}
    </div>);
  const pilules = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
      {[['diagramme', 'Le diagramme'], ['temps', 'Après l’arrêt'], ['spectres', 'Les spectres']].map(([k, l]) => <button key={k} onClick={() => setEx(e => ({ ...e, onglet: k }))} aria-pressed={ex.onglet === k} style={stylePetitBouton(ex.onglet === k, '#16a34a')}>{l}</button>)}
    </div>);
  const voletScene = (
    <div style={styleBoite}>
      {pilules}
      {ex.onglet === 'diagramme' ? <SceneJablonski actif={aucun} durees/>
        : ex.onglet === 'temps' ? <><SceneJablonski actif={null} etat={M.etatDominant(mol, tE)}/><div style={{ height: 6 }}/><SceneEmission mol={mol} t={tE}/></>
        : <SceneSpectresFluo mol={mol}/>}
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {ex.onglet === 'diagramme' ? (pr ? <>
        <LigneMesure nom="Processus" valeur={pr.nom}/><LigneMesure nom="Durée typique" valeur={pr.duree}/>
        <LigneMesure nom="Photon émis ou absorbé" valeur={pr.radiatif ? 'oui' : 'non'}/><LigneMesure nom="Description" valeur={pr.desc}/></>
        : <LigneMesure nom="Processus" valeur="choisissez-en un"/>)
      : ex.onglet === 'temps' ? <>
        <LigneMesure nom="Temps depuis la coupure" valeur={txtT(tE)}/><LigneMesure nom="État le plus peuplé" valeur={ST[M.etatDominant(mol, tE)]}/>
        <LigneMesure nom="Fluorescence" valeur={`${fr(100 * M.intensiteFluo(mol, tE), M.intensiteFluo(mol, tE) < 0.1 ? 3 : 0)}${NB}%`}/>
        <LigneMesure nom="Phosphorescence" valeur={mol.tauT1 ? `${fr(100 * M.intensitePhos(mol, tE) / 0.6, M.intensitePhos(mol, tE) < 0.06 ? 3 : 0)}${NB}%` : 'aucune'}/>
        <LigneMesure nom="Lumière émise" valeur={M.classeEmission(mol, tE)}/></>
      : <>
        <LigneMesure nom="Maximum d’absorption" valeur={`${mol.lamAbs}${NB}nm (${fr(M.energie(mol.lamAbs), 2)}${NB}eV)`}/>
        <LigneMesure nom="Maximum de fluorescence" valeur={`${mol.lamFluo}${NB}nm (${fr(M.energie(mol.lamFluo), 2)}${NB}eV)`}/>
        <LigneMesure nom="Énergie perdue" valeur={`${fr(M.decalageStokes(mol.lamAbs, mol.lamFluo), 2)}${NB}eV`}/>
        <LigneMesure nom="Part de l’énergie perdue" valeur={`${fr(100 * M.partPerdue(mol.lamAbs, mol.lamFluo), 0)}${NB}%`}/>
        {mol.lamPhos && <LigneMesure nom="Maximum de phosphorescence" valeur={`${mol.lamPhos}${NB}nm (${fr(M.energie(mol.lamPhos), 2)}${NB}eV)`}/>}</>}
    </div>);
  const aEssayer = (
    <ul style={liste}>
      <li>Diagramme : parcourez les processus. Lesquels émettent un photon ? Lesquels sont les plus rapides ?</li>
      <li>Après l’arrêt : avec la molécule A, à quel temps la lumière a-t-elle disparu ? Et avec la molécule B ?</li>
      <li>Après l’arrêt : avec B, cherchez l’intervalle de temps où l’on ne voit que la phosphorescence.</li>
      <li>Spectres : comparez les deux molécules. Laquelle perd le plus d’énergie avant d’émettre ?</li>
      <li>Spectres : la phosphorescence de B est-elle à une longueur d’onde plus petite ou plus grande que sa fluorescence ? Que dit le diagramme ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Absorption (10⁻¹⁵ s), puis RV et CI (10⁻¹² s) : non radiatives</li>
        <li>Fluorescence : S₁ → S₀, environ 10⁻⁹ s ; s’arrête avec l’excitation</li>
        <li>CIS : S₁ → T₁, changement de spin ; phosphorescence : T₁ → S₀, de 10⁻² à 10² s</li>
        <li>λ d’émission &gt; λ d’absorption : décalage vers les grandes longueurs d’onde</li>
        <li>E(eV) × λ(nm) ≈ 1243 : l’énergie perdue est la différence des énergies des deux photons</li>
      </ul>
    </ARetenir>);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Durées</strong> : ordres de grandeur du cours (absorption 10⁻¹⁵ s, RV et CI 10⁻¹² s, CIS 10⁻⁸ s, fluorescence 10⁻⁹ s, phosphorescence 10⁻² à 10² s) ; elles varient beaucoup selon la molécule et le milieu.</li>
      <li><strong>Molécules A et B</strong> : schématiques. Durées de vie : S₁ 5 ns (A) ou 2 ns (B) ; T₁ 1 s (B). Décroissance exponentielle, émission jugée visible au-dessus de 1 % de l’intensité initiale.</li>
      <li><strong>Énergies</strong> : E(eV) × λ(nm) = 1243 (constantes arrondies). L’énergie du photon émis est assimilée à un écart entre niveaux, en négligeant la relaxation vibrationnelle dans l’état d’arrivée.</li>
      <li><strong>Spectres</strong> : allures gaussiennes schématiques, de largeur arbitraire ; les intensités relatives ne sont pas à l’échelle.</li>
      <li><strong>Hors modèle</strong> : désactivation non radiative S₁ → S₀, extinction de fluorescence (quenching), rendement quantique, règles de sélection détaillées.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .fl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .fl-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .fl-col { display: flex; flex-direction: column; gap: 12px; }
        .fl-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .fl-l1.cote .fl-carte { order: 2; } .fl-l1.cote .fl-main { order: 1; }
          .fl-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .fl-ex > * { grid-column: 1; }
          .fl-ex > .fl-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .fl-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .fl-in { animation: fl-fondu 0.35s ease-out; } @keyframes fl-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .fl-l1 *, .fl-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Fluorescence et phosphorescence : le diagramme de Perrin-Jablonski</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une molécule qui a absorbé un photon revient à son état fondamental par plusieurs chemins, certains <strong>radiatifs</strong> (émission d’un photon), d’autres non. Le <strong>diagramme de Perrin-Jablonski</strong> les représente : on distingue ainsi la <strong>fluorescence</strong>, rapide, et la <strong>phosphorescence</strong>, lente.</div>
      {enGuide && <div className="fl-l1 cote">
        <div className="fl-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="fl-main">
          <div className="fl-col">
            {sceneBloc && <div className="fl-in">{sceneBloc}</div>}
            {curseurGuide && <div className="fl-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="fl-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'stokes' ? suiviS : suiviD}/></div>}
      {enExplore && <>
        <div className="fl-ex">
          {voletScene}
          <div className="fl-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
