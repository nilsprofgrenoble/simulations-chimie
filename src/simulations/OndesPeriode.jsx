import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect } from "react";
import { FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import { nbf, tire } from "./Travail";
import * as M from "./ondesPeriodeModele";
import { FICHES } from "./OndesPeriodeFiches";

const SIM_ID = 151;
declarerDefis(SIM_ID, [['celerite', 'Mesurer la célérité de l’onde'], ['longueur', 'Prévoir la longueur d’onde'], ['reglage', 'Régler la source pour une longueur d’onde donnée']]);

// ====================================================
//  SIM 151 — ONDES MÉCANIQUES : PÉRIODE, LONGUEUR D’ONDE ET RELATION λ = c·T (1G, « Ondes et signaux », Ondes mécaniques)
//  Une corde, une onde progressive sinusoïdale déjà établie : y(x, t) = A·sin(2π(t/T − x/λ)), λ = c·T.
//  Deux graphiques : la « photo » de la corde à l'instant t (y en fonction de x → longueur d'onde) et l'enregistrement d'un point (y en fonction de t → période).
//  Hypothèses (panneau d'hypothèses) : onde établie, sans amortissement, c imposée par le milieu seul, échelle verticale agrandie, animation au ralenti.
// ====================================================

const W = 480, H = 240, PL = 48, PR = 456, YC = 108, KY = 24.3, YBAS = 193;
const X = x => PL + x * (PR - PL) / M.X_MAX, XT = t => PL + t * (PR - PL) / M.T_FEN, Y = v => YC - v * KY;
const ROUGE = '#dc2626', BLEU = '#2563eb', CORDE = '#334155', ORANGE_AIDE = '#c2410c', VERT = '#15803d';
const P0 = { T: 0.4, c: 50, A: 2, x1: 10, x2: 25 };
const cm = (v, n = 1) => nbf(v, n);
const sec = (v, n = 2) => nbf(v, n);
const halo = { paintOrder: 'stroke', stroke: '#fff', strokeWidth: 4, strokeLinejoin: 'round' };
const fleche2 = (x1, x2, y, c) => (<g stroke={c} fill={c}><line x1={x1 + 7} y1={y} x2={x2 - 7} y2={y} strokeWidth="2.4"/>
  <polygon points={`${x1},${y} ${x1 + 10},${y - 5} ${x1 + 10},${y + 5}`} stroke="none"/><polygon points={`${x2},${y} ${x2 - 10},${y - 5} ${x2 - 10},${y + 5}`} stroke="none"/></g>);
const reduit = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- quadrillage et axes communs ----------
function Fond({ grad, abscisse }) {          // abscisse : 'x' (cm) ou 't' (s)
  const lignes = [];
  if (abscisse === 'x') for (let x = 0; x <= M.X_MAX; x += 5) lignes.push(<line key={x} x1={X(x)} y1={Y(M.Y_MAX)} x2={X(x)} y2={YBAS} stroke={x % 10 === 0 ? '#cbd5e1' : '#e8edf3'} strokeWidth={x % 10 === 0 ? 1.2 : 1}/>);
  else for (let k = 0; k <= 32; k++) lignes.push(<line key={k} x1={XT(k * 0.05)} y1={Y(M.Y_MAX)} x2={XT(k * 0.05)} y2={YBAS} stroke={k % 2 === 0 ? '#cbd5e1' : '#e8edf3'} strokeWidth={k % 2 === 0 ? 1.2 : 1}/>);
  return (<g>
    <rect x={PL} y={Y(M.Y_MAX)} width={PR - PL} height={YBAS - Y(M.Y_MAX)} fill="#fff" stroke="#94a3b8" strokeWidth="1.5"/>
    {grad && lignes}
    {grad && [-3, -2, -1, 1, 2, 3].map(v => <line key={v} x1={PL} y1={Y(v)} x2={PR} y2={Y(v)} stroke="#e8edf3" strokeWidth="1"/>)}
    <line x1={PL} y1={Y(0)} x2={PR} y2={Y(0)} stroke="#64748b" strokeWidth="1.5" strokeDasharray="7 4"/>
    {grad && [-3, -2, -1, 0, 1, 2, 3].map(v => <text key={v} x={PL - 6} y={Y(v) + 5.5} textAnchor="end" fontSize="19" fill="#0f172a">{v < 0 ? `−${-v}` : v}</text>)}
    {grad && abscisse === 'x' && [0, 20, 40, 60, 80, 100].map(x => <text key={x} x={X(x)} y={YBAS + 22} textAnchor="middle" fontSize="19" fill="#0f172a">{x}</text>)}
    {grad && abscisse === 't' && [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6].map(t => <text key={t} x={XT(t)} y={YBAS + 22} textAnchor="middle" fontSize="19" fill="#0f172a">{String(t).replace('.', ',')}</text>)}
    {grad && <text x={PR} y={H - 2} textAnchor="end" fontSize="19" fontWeight="700" fill="#0f172a">{abscisse === 'x' ? 'x (cm)' : 't (s)'}</text>}
    {grad && <text x="4" y="17" fontSize="19" fontWeight="700" fill="#0f172a">y (cm)</text>}
  </g>);
}

// ---------- graphique 1 : la corde photographiée à l'instant t ----------
function Photo({ P, t, grad, bleu, aideL }) {
  const par = { A: P.A, T: P.T, c: P.c };
  const pts = []; for (let x = 0; x <= M.X_MAX + 1e-9; x += 0.5) pts.push(`${X(x).toFixed(1)},${Y(M.y(x, t, par)).toFixed(1)}`);
  const cr = aideL ? M.cretes(t, par).slice(0, 2) : [];
  const mq = (x, c, nom, dx) => (<g key={nom}>
    <line x1={X(x)} y1={Y(M.y(x, t, par))} x2={X(x)} y2={YBAS} stroke={c} strokeWidth="1.6" strokeDasharray="4 3" opacity="0.7"/>
    <circle cx={X(x)} cy={Y(M.y(x, t, par))} r="7" fill={c} stroke="#fff" strokeWidth="2"/>
    <text x={X(x) + dx} y={Y(M.y(x, t, par)) - 11} textAnchor="middle" fontSize="19" fontWeight="800" fill={c} {...halo}>{nom}</text></g>);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Photo de la corde à l’instant t = ${sec(t)} s : y en fonction de x. Point rouge M1 à x = ${cm(P.x1, 0)} cm${bleu ? `, point bleu M2 à x = ${cm(P.x2, 0)} cm` : ''}`}
      style={{ display: 'block', maxWidth: 480, margin: '0 auto', background: '#fff' }}>
      <Fond grad={grad} abscisse="x"/>
      <g stroke="#475569" fill="#475569"><line x1="112" y1="12" x2="152" y2="12" strokeWidth="2.4"/><polygon points="168,12 156,6.5 156,17.5" stroke="none"/></g>
      <text x="176" y="19" fontSize="19" fontWeight="700" fill="#475569">propagation</text>
      {cr.length === 2 && <g>{cr.map(x => <line key={x} x1={X(x)} y1={Y(P.A)} x2={X(x)} y2={YBAS - 6} stroke={ORANGE_AIDE} strokeWidth="1.6" strokeDasharray="3 3"/>)}
        {fleche2(X(cr[0]), X(cr[1]), YBAS - 8, ORANGE_AIDE)}<text x={(X(cr[0]) + X(cr[1])) / 2} y={YBAS - 14} textAnchor="middle" fontSize="21" fontWeight="800" fill={ORANGE_AIDE} {...halo}>λ</text></g>}
      <polyline points={pts.join(' ')} fill="none" stroke={CORDE} strokeWidth="3.2" strokeLinejoin="round"/>
      <circle cx={X(0)} cy={Y(M.y(0, t, par))} r="5.5" fill="#0f172a"/>
      <text x={X(0) + 11} y={Y(M.y(0, t, par)) + 24} fontSize="19" fontWeight="800" fill="#0f172a" {...halo}>S</text>
      {mq(P.x1, ROUGE, 'M₁', 0)}{bleu && mq(P.x2, BLEU, 'M₂', 0)}
    </svg>);
}

// ---------- graphique 2 : le mouvement d'un point au cours du temps ----------
function GrapheTemps({ P, t, bleu, aideT }) {
  const par = { A: P.A, T: P.T, c: P.c };
  const courbe = x => { const r = []; for (let k = 0; k <= 320; k++) { const tt = k * M.T_FEN / 320; r.push(`${XT(tt).toFixed(1)},${Y(M.y(x, tt, par)).toFixed(1)}`); } return r.join(' '); };
  const mx = aideT ? M.maxima(P.x1, par).slice(0, 2) : [];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Mouvement du point rouge M1 (x = ${cm(P.x1, 0)} cm)${bleu ? ` et du point bleu M2 (x = ${cm(P.x2, 0)} cm)` : ''} : y en fonction de t entre 0 et 1,6 s`}
      style={{ display: 'block', maxWidth: 480, margin: '0 auto', background: '#fff' }}>
      <Fond grad abscisse="t"/>
      {mx.length === 2 && <g>{mx.map(x => <line key={x} x1={XT(x)} y1={Y(P.A)} x2={XT(x)} y2={YBAS - 6} stroke={ORANGE_AIDE} strokeWidth="1.6" strokeDasharray="3 3"/>)}
        {fleche2(XT(mx[0]), XT(mx[1]), YBAS - 8, ORANGE_AIDE)}<text x={(XT(mx[0]) + XT(mx[1])) / 2} y={YBAS - 14} textAnchor="middle" fontSize="21" fontWeight="800" fill={ORANGE_AIDE} {...halo}>T</text></g>}
      <polyline points={courbe(P.x1)} fill="none" stroke={ROUGE} strokeWidth="4.2" strokeLinejoin="round"/>
      {bleu && <polyline points={courbe(P.x2)} fill="none" stroke={BLEU} strokeWidth="2" strokeLinejoin="round"/>}
      <line x1={XT(t)} y1={Y(M.Y_MAX)} x2={XT(t)} y2={YBAS} stroke="#475569" strokeWidth="1.4" strokeDasharray="5 4"/>
      <circle cx={XT(t)} cy={Y(M.y(P.x1, t, par))} r="6.5" fill={ROUGE} stroke="#fff" strokeWidth="2"/>
      {bleu && <circle cx={XT(t)} cy={Y(M.y(P.x2, t, par))} r="4.5" fill={BLEU} stroke="#fff" strokeWidth="1.5"/>}
    </svg>);
}

// ---------- la scène : les deux graphiques, l'horloge et les commandes de lecture ----------
function Scene({ P, vis, identifiant }) {
  const [t, setT] = useState(0), [lecture, setLecture] = useState(() => !reduit());
  useEffect(() => {
    if (!lecture) return undefined;
    let raf, prec = performance.now();
    const pas = now => { const dt = Math.min(0.1, (now - prec) / 1000); prec = now; setT(x => { const n = x + dt * 0.5; return n >= M.T_FEN ? n - M.T_FEN : n; }); raf = requestAnimationFrame(pas); };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [lecture]);
  const legende = { fontSize: 14, fontWeight: 700, color: KIT.txt, margin: '2px 0 4px', lineHeight: 1.35 };
  return (
    <div data-scene={identifiant}>
      <div style={legende}>{vis.grad ? 'Photo de la corde à l’instant t' : 'La corde vue de côté'} : <span style={{ color: KIT.txt2 }}>y en fonction de x</span></div>
      <Photo P={P} t={t} grad={vis.grad} bleu={vis.bleu} aideL={vis.aideL}/>
      {vis.graphT && <>
        <div style={{ ...legende, marginTop: 10 }}>Mouvement du point rouge <span style={{ color: ROUGE }}>M₁</span>{vis.bleu ? <> et du point bleu <span style={{ color: BLEU }}>M₂</span></> : null} : <span style={{ color: KIT.txt2 }}>y en fonction de t</span></div>
        <GrapheTemps P={P} t={t} bleu={vis.bleu} aideT={vis.aideT}/></>}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={() => setLecture(l => !l)} aria-pressed={lecture} style={stylePetitBouton(lecture, '#334155')}>{lecture ? '⏸ Pause' : '▶ Lecture'}</button>
        <span style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}>t = {sec(t)}{NB}s</span>
      </div>
      {vis.curseurT && <div style={{ marginTop: 6 }}><Curseur nom="Instant t (arrêt sur image)" valeur={Math.round(t * 100) / 100} onChange={v => { setLecture(false); setT(v); }} min={0} max={M.T_FEN} pas={0.01} unite="s" decimales={2} couleur="#475569"/></div>}
    </div>);
}

const selectStyle = { width: '100%', minHeight: 42, fontSize: 15, padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, background: '#fff', color: KIT.txt };
const FCT = <FormuleEnLigne><mi>c</mi><mo>=</mo><mfrac><mi>λ</mi><mi>T</mi></mfrac></FormuleEnLigne>;
const FLT = <FormuleEnLigne><mi>λ</mi><mo>=</mo><mi>c</mi><mo>·</mo><mi>T</mi></FormuleEnLigne>;
const FF = <FormuleEnLigne><mi>f</mi><mo>=</mo><mfrac><mn>1</mn><mi>T</mi></mfrac></FormuleEnLigne>;

// ====================================================
//  COMPOSANT
// ====================================================
export function SimulationOndesPeriode() {
  const [mode, setMode] = useState(() => modeOuverture('ondes-periode-guide-v1'));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviL, noterL] = useCompteurDefi(), [suiviR, noterR] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('ondes-periode-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('celerite');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [P, setP] = useState(P0);
  const [aides, setAides] = useState({ T: false, L: false });
  const [ouv, setOuv] = useState({ source: false, milieu: false, points: false });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const L = M.lambda(P.c, P.T);

  // ════════════════ PARCOURS GUIDÉ (13 étapes) ════════════════
  const ETAPES = [
    { id: 'onde', titre: 'Une onde le long d’une corde', focus: ['scene'], depart: () => setP(P0),
      texte: <>Une source <strong>S</strong>, à gauche, secoue une corde : une <strong>onde</strong> se propage vers la droite. Le <strong style={{ color: ROUGE }}>point rouge M₁</strong> est une marque collée sur la corde. Regardez-le pendant que l’onde passe (vous pouvez mettre en pause). Pour simplifier, l’onde est déjà établie sur toute la corde et ne s’amortit pas.</>,
      tache: { type: 'qcm', q: 'Pendant que l’onde se propage vers la droite, le point rouge…', options: ['monte et descend sur place, sans avancer avec l’onde', 'avance vers la droite à la même vitesse que l’onde', 'reste immobile : seule la forme de la corde change', 'tourne en cercle autour de sa position de départ'], bonne: 0,
        indice: 'Suivez la position horizontale du point rouge : change-t-elle ? Que fait sa hauteur ?',
        expl: 'La corde est secouée de haut en bas : chaque point oscille sur place, perpendiculairement à la corde (onde transversale). C’est la perturbation qui voyage, pas la matière.' } },
    { id: 'periode', titre: 'Dans le temps : la période', focus: ['scene'], depart: () => setP(P0),
      texte: <>Le graphique du bas enregistre la hauteur <em>y</em> du point rouge à chaque instant <em>t</em>. Le mouvement se répète à l’identique : la durée d’un motif complet (par exemple d’un sommet au sommet suivant) est la <strong>période T</strong>. Mettez en pause et lisez-la sur les graduations.</>,
      tache: { type: 'num', q: 'Période T du mouvement du point rouge', unite: 's', vrai: 0.4, tol: 0.06, affiche: v => sec(v), carnet: 'Période T lue sur le graphique',
        calcul: () => ['Deux sommets successifs de la courbe rouge sont à t = 0,30 s et t = 0,70 s.', 'T = 0,70 − 0,30 = 0,40 s : c’est la durée d’un motif complet.'],
        pieges: [[0.2, 'Entre un sommet et un creux il ne s’écoule qu’une demi-période : prenez deux sommets successifs.'], [0.8, 'Vous avez compté deux motifs : T est la durée d’un seul motif.']],
        expl: 'T = 0,40 s : le point rouge fait une oscillation complète en 0,40 s.', indice: 'Repérez deux sommets (maxima) successifs de la courbe rouge et lisez la durée qui les sépare.' } },
    { id: 'frequence', titre: 'La fréquence', focus: ['scene'], depart: null,
      texte: <>Le point rouge oscille avec la période T = 0,40{NB}s. La <strong>fréquence f</strong> est le nombre d’oscillations complètes <strong>par seconde</strong>, en hertz (Hz). Plus un motif est long, moins il y en a par seconde : {FF}.</>,
      tache: { type: 'num', q: 'Fréquence f du point rouge', unite: 'Hz', vrai: 2.5, tol: 0.02, affiche: v => cm(v), carnet: 'Fréquence f',
        calcul: () => ['f = 1 ÷ T = 1 ÷ 0,40 s.', 'f = 2,5 Hz : 2,5 oscillations chaque seconde.'],
        pieges: [[0.4, 'Vous avez recopié T : la fréquence est l’inverse de la période, f = 1 ÷ T.'], [25, 'Vous avez divisé par 0,040 : T vaut 0,40 s.']],
        expl: 'f = 1 ÷ 0,40 = 2,5 Hz.', indice: <>On divise 1 par la période : {FF}, avec T en secondes.</> } },
    { id: 'photo', titre: 'Dans l’espace : la longueur d’onde', focus: ['scene'], depart: null,
      retenirTitre: 'À RETENIR : PÉRIODE ET FRÉQUENCE', retenir: FICHES.periode,
      texte: <>Le graphique du haut est une « photo » de la corde à un instant : c’est <em>y</em> en fonction de la position <em>x</em> (en cm, graduée maintenant). Ce motif se répète aussi, mais dans l’<strong>espace</strong> : la distance entre deux <strong>crêtes</strong> (points les plus hauts) voisines est la <strong>longueur d’onde λ</strong>.</>,
      tache: { type: 'num', q: 'Longueur d’onde λ de l’onde', unite: 'cm', vrai: 20, tol: 0.06, affiche: v => cm(v), carnet: 'Longueur d’onde λ lue sur la photo',
        calcul: () => ['À un instant donné, deux crêtes voisines sont séparées de 20 cm sur l’axe des x.', 'λ = 20 cm.'],
        pieges: [[10, 'Entre une crête et un creux, la distance n’est que la moitié de λ : prenez deux crêtes voisines.'], [40, 'Vous avez pris deux motifs : λ est la longueur d’un seul motif.']],
        expl: 'λ = 20 cm : le motif de la corde se répète tous les 20 cm.', indice: 'Mettez en pause, repérez deux crêtes voisines et soustrayez leurs abscisses (aidez-vous du quadrillage).' } },
    { id: 'phase', titre: 'Deux points qui vibrent à l’unisson', focus: ['scene', 'reglages'], depart: () => setP({ ...P0, x2: 25 }),
      texte: <>Voici un second point, le <strong style={{ color: BLEU }}>point bleu M₂</strong>, que vous placez avec le curseur. Déplacez-le jusqu’à ce que sa courbe bleue se superpose exactement à la courbe rouge dans le graphique du bas : les deux points montent et descendent <strong>en phase</strong> (ils sont à droite de M₁).</>,
      tache: { type: 'action', ok: enGuide && P.x2 > P.x1 && M.ecartMultiple(P.x2 - P.x1, M.lambda(P.c, P.T)) <= 1.0, consigne: 'Placez M₂ pour que les deux courbes se superposent.' } },
    { id: 'multiple', titre: 'Comparer M₁M₂ et λ', focus: ['scene'], depart: null,
      texte: <>Vous avez trouvé une position de M₂ pour laquelle les deux courbes sont confondues. Essayez d’autres positions : il y en a plusieurs. Comparez la distance M₁M₂ à la longueur d’onde λ = 20{NB}cm.</>,
      tache: { type: 'qcm', q: 'Quand M₂ vibre en phase avec M₁, la distance M₁M₂ est…', options: ['un multiple entier de la longueur d’onde', 'un multiple entier de la période T', 'un multiple impair de la demi-longueur d’onde', 'quelconque, sans lien avec λ'], bonne: 0,
        indice: 'Avec M₁ à x = 10 cm, les positions de M₂ trouvées sont 30 cm, 50 cm, 70 cm… Calculez M₁M₂ et comparez à 20 cm.',
        expl: 'M₂ est en phase avec M₁ à 30, 50, 70… cm, soit à 20, 40, 60… cm de M₁ : des multiples de λ. Une distance ne peut pas être un multiple d’une durée (la période).' } },
    { id: 'parcourue', titre: 'Suivre une crête', focus: ['scene'], depart: null,
      texte: <>Suivez une crête pendant que l’onde avance (curseur de temps ou lecture). Comparez la corde à l’instant t et à l’instant t + T (T = 0,40{NB}s) : que constatez-vous ? Où est passée la crête que vous suiviez ?</>,
      tache: { type: 'qcm', q: 'Pendant une période T, une crête de l’onde parcourt…', options: ['une longueur d’onde', 'une demi-longueur d’onde', 'deux longueurs d’onde', 'une distance qui dépend de l’amplitude'], bonne: 0,
        indice: 'Au bout de T, la corde est exactement la même qu’au départ. De combien la crête a-t-elle dû avancer pour retomber sur une crête ?',
        expl: 'La crête avance jusqu’à la position de la crête suivante : elle parcourt une longueur d’onde λ pendant une période T.' } },
    { id: 'celerite', titre: 'Calculer la célérité', focus: ['scene'], depart: null,
      retenirTitre: 'À RETENIR : LA DOUBLE PÉRIODICITÉ', retenir: FICHES.double,
      texte: <>La <strong>célérité c</strong> est la distance parcourue par l’onde en une seconde. Vous avez mesuré T = 0,40{NB}s (étape 2) et λ = 20{NB}cm (étape 4). Pendant T, l’onde parcourt λ : {FCT}.</>,
      tache: { type: 'num', q: 'Célérité c de l’onde', unite: 'cm/s', vrai: 50, tol: 0.02, affiche: v => cm(v, 0), carnet: 'Célérité c',
        calcul: () => ['c = λ ÷ T = 20 cm ÷ 0,40 s.', 'c = 50 cm/s (soit 0,50 m/s).'],
        pieges: [[0.02, 'Vous avez divisé T par λ : la célérité est λ ÷ T.'], [8, 'Vous avez multiplié λ par T : il faut diviser.'], [0.5, 'Vous avez converti en m/s : ici la réponse est demandée en cm/s.']],
        expl: 'c = 20 ÷ 0,40 = 50 cm/s : l’onde avance de 50 cm chaque seconde.', indice: <>{FCT}, avec λ en cm et T en s : le résultat est en cm/s.</> } },
    { id: 'chgT', titre: 'Prévoir : changer la période', focus: ['scene'], depart: () => setP(p => ({ ...p, T: 0.4, c: 50, A: 2 })),
      texte: <>La corde ne change pas (même tension) : la célérité de l’onde reste <strong>c = 50{NB}cm/s</strong>. La source, elle, peut changer de rythme : sa période passe de 0,40{NB}s à <strong>T = 0,20{NB}s</strong> (elle oscille deux fois plus souvent, sa fréquence double). Avant de régler quoi que ce soit, faites une prévision.</>,
      tache: { type: 'qcm', q: 'Avec la même corde et une période T deux fois plus courte, la longueur d’onde λ…', options: ['est divisée par 2 : les crêtes se rapprochent', 'reste la même, car la corde est la même', 'est multipliée par 2 : les crêtes s’écartent', 'dépend de l’amplitude, qu’on ne connaît pas'], bonne: 0,
        indice: 'Pendant une période, l’onde avance d’une longueur d’onde. Si la période est deux fois plus courte, l’onde avance-t-elle plus loin ou moins loin ?',
        expl: 'La célérité c ne change pas ; pendant une période deux fois plus courte, l’onde avance deux fois moins loin : λ = c·T est divisée par 2.' } },
    { id: 'lambda2', titre: 'Calculer la nouvelle longueur d’onde', focus: ['scene'], depart: null,
      texte: <>La célérité vaut toujours c = 50{NB}cm/s et la source a maintenant la période T = 0,20{NB}s. Calculez la nouvelle longueur d’onde avec {FLT}. La photo ci-dessous montre encore T = 0,40{NB}s : vous la comparerez à votre résultat à l’étape suivante.</>,
      tache: { type: 'num', q: 'Longueur d’onde λ pour T = 0,20 s', unite: 'cm', vrai: 10, tol: 0.02, affiche: v => cm(v), carnet: 'Longueur d’onde λ pour T = 0,20 s',
        calcul: () => ['λ = c × T = 50 cm/s × 0,20 s.', 'λ = 10 cm : deux fois plus courte, comme T.'],
        pieges: [[20, 'λ n’a pas gardé sa valeur : c reste le même mais T a changé, donc λ = c × T change.'], [250, 'Vous avez divisé c par T : la relation est λ = c × T.']],
        expl: 'λ = 50 × 0,20 = 10 cm.', indice: <>{FLT} : multipliez 50 cm/s par 0,20 s.</> } },
    { id: 'reglerT', titre: 'Régler T et vérifier', focus: ['reglages', 'scene'], depart: () => setP(p => ({ ...p, T: 0.4, c: 50, A: 2 })),
      retenirTitre: 'À RETENIR : LA RELATION λ = c·T', retenir: FICHES.celerite,
      texte: <>Réglez maintenant la période de la source à <strong>T = 0,20{NB}s</strong> avec le curseur, puis lisez la distance entre deux crêtes sur la photo de la corde : retrouvez-vous votre prévision ?</>,
      tache: { type: 'action', ok: enGuide && Math.abs(P.T - 0.2) < 0.006, consigne: 'Réglez la période T à 0,20 s.' } },
    { id: 'amplitude', titre: 'L’amplitude', focus: ['reglages'], depart: () => setP(p => ({ ...p, T: 0.2, c: 50 })),
      texte: <>L’<strong>amplitude A</strong> est la valeur maximale de <em>y</em> (la hauteur des crêtes). Modifiez-la avec le curseur et observez les deux graphiques : la source secoue la corde plus ou moins fort.</>,
      tache: { type: 'qcm', q: 'Quand on augmente l’amplitude A, que deviennent la période T et la longueur d’onde λ ?', options: ['ni T ni λ ne changent, seule la hauteur varie', 'T et λ augmentent aussi, car l’onde est plus haute', 'T diminue et λ augmente, car l’onde va plus vite', 'T ne change pas, mais λ augmente avec la hauteur'], bonne: 0,
        indice: 'Pendant que vous changez A, regardez si les crêtes restent espacées de la même distance et si le motif du bas garde la même durée.',
        expl: 'L’amplitude règle seulement la hauteur de l’onde : la période (imposée par la source) et la longueur d’onde (λ = c·T) ne changent pas.' } },
    { id: 'bilan', titre: 'À vous de mesurer une célérité', focus: ['scene'], depart: () => setP(p => ({ ...p, T: 0.5, c: 40, A: 2 })),
      retenirTitre: 'À RETENIR : QUI DÉCIDE DE QUOI', retenir: FICHES.decide,
      texte: <>Nouvelle corde, nouvelle source. Lisez la période T sur le graphique du bas et la longueur d’onde λ sur la photo, puis calculez la célérité c de l’onde.</>,
      tache: { type: 'num', q: 'Célérité c de l’onde', unite: 'cm/s', vrai: 40, tol: 0.1, affiche: v => cm(v, 0), carnet: 'Célérité c de la nouvelle corde',
        calcul: () => ['Sur le graphique du bas : T = 0,50 s (deux sommets successifs de la courbe rouge sont séparés de 0,50 s).', 'Sur la photo : λ = 20 cm.', 'c = λ ÷ T = 20 ÷ 0,50 = 40 cm/s.'],
        pieges: [[0.025, 'Vous avez divisé T par λ : la célérité est λ ÷ T.'], [10, 'Vous avez multiplié λ par T : il faut diviser.']],
        expl: 'c = 20 ÷ 0,50 = 40 cm/s. La lecture graphique donne T et λ à quelques pour cent près : le résultat est compris entre 36 et 44 cm/s.', indice: <>Lisez T (durée entre deux sommets) et λ (distance entre deux crêtes), puis {FCT}.</> } },
  ];
  const etape = Math.min(guide.etape, ETAPES.length - 1);
  const IDS = ETAPES.map(e => e.id);
  const depuis = id => !enGuide || etape >= IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ DÉFIS ════════════════
  const tirages = {
    celerite: () => { const c = M.tirages().filter(x => x.L >= 15); const x = tire(c); return { type: 'celerite', p: { T: x.T, c: x.c, A: tire([1.5, 2, 2.5]), x1: tire([5, 10, 15]), x2: 50 }, vrai: x.c, reps: {}, verifie: false }; },
    longueur: () => { const x = tire(M.tirages()); return { type: 'longueur', p: { T: x.T, c: x.c, A: 2, x1: 10, x2: 50 }, vrai: x.L, reps: {}, verifie: false }; },
    reglage: () => {
      const c = [];
      [30, 40, 50, 60].forEach(cc => { for (let k = 5; k <= 18; k++) { const T = k * 0.05, Lc = cc * T; if (Lc >= 9 && Lc <= 50 && Math.abs(T - 0.4) > 1e-9) c.push({ c: cc, T, Lc }); } });
      const x = tire(c); return { type: 'reglage', p: { T: x.T < 0.5 ? 0.75 : 0.35, c: x.c, A: 2, x1: 10, x2: 50 }, cible: x.Lc, cibleT: x.T, reps: {}, verifie: false };
    },
  };
  const nouveauDefi = t => setDefi(tirages[t]());
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const majDefi = patch => setDefi(x => ({ ...x, p: { ...x.p, ...patch }, verifie: false }));
  const verifierDefi = () => {
    let ok, vrai = defi.vrai;
    if (defi.type === 'reglage') { vrai = defi.cibleT; ok = Math.abs(M.lambda(defi.p.c, defi.p.T) - defi.cible) < 0.011; }
    else { const x = lireNombre(defi.reps.r); ok = isFinite(x) && proche(x, defi.vrai, defi.type === 'celerite' ? 0.1 : 0.05); }
    setDefi(x => ({ ...x, verifie: true, ok, vrai }));
    ({ celerite: noterC, longueur: noterL, reglage: noterR })[defi.type](ok);
  };
  const champ = (unite, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.r ?? ''} aria-label={label} inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('op-verif')?.click()}
        onChange={e => setDefi(x => ({ ...x, reps: { r: e.target.value }, verifie: false }))}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const nomMilieu = c => (M.MILIEUX.find(m => m.c === c) || {}).nom;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['celerite', 'Mesurer c'], ['longueur', 'Prévoir λ'], ['reglage', 'Régler T']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'celerite' ? 'Défi : quelle est la célérité de cette onde ?' : defi.type === 'longueur' ? 'Défi : quelle sera la longueur d’onde ?' : 'Défi : réglez la source pour obtenir la bonne longueur d’onde'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'celerite' && <>Une onde se propage sur une corde dont la célérité est <strong>inconnue</strong>. Lisez la période T sur le graphique du bas et la longueur d’onde λ sur la photo, puis calculez c. Donnez c en cm/s (la lecture graphique est précise à quelques pour cent près).</>}
        {defi.type === 'longueur' && <>La source a pour période <strong>T = {sec(defi.p.T)}{NB}s</strong> et la célérité de l’onde dans la corde est <strong>c = {cm(defi.p.c, 0)}{NB}cm/s</strong>. Calculez la longueur d’onde λ, en cm. La photo de la corde apparaît après « Vérifier ».</>}
        {defi.type === 'reglage' && <>La corde est <strong>{nomMilieu(defi.p.c)}</strong> : la célérité de l’onde est <strong>c = {cm(defi.p.c, 0)}{NB}cm/s</strong>. Réglez la période T de la source pour obtenir une longueur d’onde de <strong>λ = {cm(defi.cible)}{NB}cm</strong>, puis cliquez sur « Vérifier ».</>}
      </div>
      {(defi.type === 'celerite') && champ('cm/s', 'Célérité c')}
      {(defi.type === 'longueur') && champ('cm', 'Longueur d’onde λ')}
      {defi.type === 'celerite' && <IndiceDefi>La relation à utiliser : {FCT}. Mettez en pause : T est la durée entre deux sommets successifs de la courbe rouge, λ la distance entre deux crêtes voisines de la photo (aidez-vous du quadrillage).</IndiceDefi>}
      {defi.type === 'longueur' && <IndiceDefi>La longueur d’onde est la distance parcourue en une période : {FLT}. Gardez les unités cohérentes (cm/s × s = cm).</IndiceDefi>}
      {defi.type === 'reglage' && <IndiceDefi>De {FLT}, on tire <FormuleEnLigne><mi>T</mi><mo>=</mo><mfrac><mi>λ</mi><mi>c</mi></mfrac></FormuleEnLigne>. Calculez T, réglez le curseur, puis vérifiez sur la photo en lisant la distance entre deux crêtes.</IndiceDefi>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="op-verif" onClick={verifierDefi} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? (defi.type === 'celerite' ? `✓ Correct. Valeur de la simulation : c = ${cm(defi.vrai, 0)}${NB}cm/s.` : defi.type === 'longueur' ? `✓ Correct. λ = ${cm(defi.vrai)}${NB}cm.` : `✓ Correct. T = ${sec(defi.vrai)}${NB}s donne λ = ${cm(defi.cible)}${NB}cm.`)
          : defi.type === 'celerite' ? '✗ Vérifiez vos lectures : T entre deux sommets successifs (en s), λ entre deux crêtes voisines (en cm), puis c = λ ÷ T.'
            : defi.type === 'longueur' ? '✗ Vérifiez : λ = c × T, avec c en cm/s et T en s.' : `✗ Pas encore : avec c = ${cm(defi.p.c, 0)}${NB}cm/s, λ = c × T ; cherchez T = λ ÷ c.`}
      </div>}
    </div>);

  // ════════════════ HYPOTHÈSES, MESURES, RÉGLAGES ════════════════
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Onde sinusoïdale transversale</strong> sur une corde idéale, <strong>déjà établie</strong> sur toute la longueur observée (on ne montre pas l’arrivée du début de l’onde) et <strong>sans amortissement</strong> : l’amplitude reste la même, ce qui est faux sur une longue distance dans la réalité.</li>
      <li><strong>La source impose T</strong> (donc f) et A ; <strong>le milieu impose c</strong> (ici la tension de la corde). La célérité ne dépend ni de T ni de A : c’est vrai pour une corde idéale, dans un milieu <strong>non dispersif</strong> (c indépendante de f), mais pas pour tous les milieux. La longueur d’onde λ = c·T en résulte : elle dépend de la source <em>et</em> du milieu.</li>
      <li><strong>Notation</strong> : le programme note <em>v</em> la célérité d’une onde ; ici on la note <em>c</em>. À ne pas confondre avec la célérité de la lumière (3,0×10⁸{NB}m/s).</li>
      <li><strong>Valeurs</strong> choisies pour la lisibilité (corde lente, quelques dizaines de centimètres par seconde) ; une vraie corde tendue transmet l’onde à plusieurs mètres par seconde.</li>
      <li><strong>Échelles</strong> : la hauteur y est très agrandie par rapport à la longueur x, sinon la corde paraîtrait plate. L’animation est au <strong>ralenti</strong>.</li>
      <li><strong>Lecture graphique</strong> : on lit T à ± 0,01 s et λ à ± 0,5 cm environ ; une célérité obtenue en divisant ces deux valeurs est donc précise à quelques pour cent près.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const etat = M.etatPhase(P.x2 - P.x1, L);
  const dsurL = Math.abs(P.x2 - P.x1) / L;
  const mesures = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Période T (source)" valeur={`${sec(P.T)}${NB}s`} couleur={ROUGE}/>
      <LigneMesure nom="Fréquence f" valeur={`${cm(M.frequence(P.T), 2)}${NB}Hz`} couleur={ROUGE}/>
      <LigneMesure nom="Amplitude A" valeur={`${cm(P.A)}${NB}cm`}/>
      <LigneMesure nom="Célérité c (milieu)" valeur={`${cm(P.c, 0)}${NB}cm/s`} couleur="#15803d"/>
      <LigneMesure nom="Longueur d’onde λ = c × T" valeur={`${cm(L)}${NB}cm`} couleur={ORANGE_AIDE}/>
      <LigneMesure nom="Distance M₁M₂" valeur={`${cm(Math.abs(P.x2 - P.x1), 0)}${NB}cm = ${nbf(dsurL, 2)} λ`}/>
      <LigneMesure nom="M₁ et M₂ vibrent" valeur={etat === 'phase' ? 'en phase' : etat === 'opposition' ? 'en opposition' : etat === 'confondus' ? 'confondus (même point)' : etat === 'quasi' ? 'quasi confondus' : 'décalage quelconque'} couleur={etat === 'phase' || etat === 'quasi' ? '#15803d' : etat === 'opposition' ? '#b91c1c' : KIT.txt}/>
    </div>);
  const curT = <Curseur nom="Période T de la source" valeur={P.T} onChange={v => setP(p => ({ ...p, T: Math.round(v * 100) / 100 }))} min={M.T_MIN} max={M.T_MAX} pas={M.T_PAS} unite="s" decimales={2} couleur={ROUGE}/>;
  const curA = <Curseur nom="Amplitude A de la source" valeur={P.A} onChange={v => setP(p => ({ ...p, A: v }))} min={M.A_MIN} max={M.A_MAX} pas={M.A_PAS} unite="cm" decimales={1} couleur="#475569"/>;
  const curX1 = <Curseur nom="Position du point rouge M₁" valeur={P.x1} onChange={v => setP(p => ({ ...p, x1: v }))} min={0} max={M.X_MAX} pas={1} unite="cm" decimales={0} couleur={ROUGE}/>;
  const curX2 = <Curseur nom="Position du point bleu M₂" valeur={P.x2} onChange={v => setP(p => ({ ...p, x2: v }))} min={0} max={M.X_MAX} pas={1} unite="cm" decimales={0} couleur={BLEU}/>;
  const choixMilieu = (
    <div style={{ marginBottom: 8 }}>
      <label htmlFor="op-milieu" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 3 }}>Tension de la corde (le milieu)</label>
      <select id="op-milieu" value={P.c} onChange={e => setP(p => ({ ...p, c: Number(e.target.value) }))} style={selectStyle}>
        {M.MILIEUX.map(m => <option key={m.id} value={m.c}>Corde {m.nom} : c = {m.c} cm/s</option>)}
      </select>
    </div>);
  const titreReglage = (t, ...l) => <span>{t} <span style={{ fontWeight: 500, color: KIT.txt2, fontSize: 13.5 }}>· {l.join(' · ')}</span></span>;
  const reglagesGuide = depuis('phase') && (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {curX2}
      {depuis('reglerT') && curT}
      {depuis('amplitude') && curA}
    </div>);
  const reglagesExplore = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {curT}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 8 }}>La source impose T ; le milieu impose c ; λ = c·T en résulte.</div>
      <Section titre={titreReglage('La source', `A = ${cm(P.A)} cm`)} ouvert={ouv.source} onBascule={() => setOuv(o => ({ ...o, source: !o.source }))}>{curA}</Section>
      <Section titre={titreReglage('Le milieu', `c = ${cm(P.c, 0)} cm/s`)} ouvert={ouv.milieu} onBascule={() => setOuv(o => ({ ...o, milieu: !o.milieu }))}>{choixMilieu}</Section>
      <Section titre={titreReglage('Points de mesure', `M₁ à ${cm(P.x1, 0)} cm`, `M₂ à ${cm(P.x2, 0)} cm`)} ouvert={ouv.points} onBascule={() => setOuv(o => ({ ...o, points: !o.points }))}>
        {curX1}{curX2}<div style={{ fontSize: 12.5, color: KIT.txt2 }}>Placez M₂ à λ, λ/2, 1,5 λ… de M₁ et comparez leurs courbes dans le graphique du bas.</div></Section>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        <span style={{ fontSize: 12.5, color: KIT.txt2, alignSelf: 'center' }}>Repères :</span>
        {[['T', 'montrer T'], ['L', 'montrer λ']].map(([k, l]) => <button key={k} onClick={() => setAides(a => ({ ...a, [k]: !a[k] }))} aria-pressed={aides[k]} style={stylePetitBouton(aides[k], '#c2410c')}>{aides[k] ? '☑' : '☐'} {l}</button>)}
      </div>
    </div>);
  const reglagesDefi = defi && (defi.type === 'reglage' ? (
    <div style={styleBoite}><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Curseur nom="Période T de la source" valeur={defi.p.T} onChange={v => majDefi({ T: Math.round(v * 100) / 100 })} min={M.T_MIN} max={M.T_MAX} pas={M.T_PAS} unite="s" decimales={2} couleur={ROUGE}/></div>
  ) : null);

  // ════════════════ SCÈNE ════════════════
  const PE = enDefi && defi ? defi.p : P;
  const vis = enGuide ? { grad: depuis('photo'), graphT: depuis('periode'), bleu: depuis('phase'), curseurT: depuis('periode'), aideL: false, aideT: false }
    : enDefi ? { grad: true, graphT: true, bleu: false, curseurT: true, aideL: false, aideT: false }
      : { grad: true, graphT: true, bleu: true, curseurT: true, aideL: aides.L, aideT: aides.T };
  const montrerScene = !(enDefi && defi && defi.type === 'longueur' && !defi.verifie);
  const sceneBox = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {montrerScene ? <Scene P={PE} vis={vis} identifiant="p"/>
        : <div style={{ fontSize: 14, color: KIT.txt2, padding: '18px 8px', textAlign: 'center' }}>Calculez d’abord λ, puis cliquez sur « Vérifier » : la photo de la corde apparaîtra pour contrôler votre résultat.</div>}
    </div>);
  const aEssayer = indicesProfond(
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Doublez T sans toucher à la tension de la corde : que deviennent c et λ ? Vérifiez avec « montrer λ ».</li>
        <li>Gardez T et changez la tension de la corde : que deviennent T, c et λ ?</li>
        <li>Placez M₂ à λ/2 de M₁, puis à 1,5 λ : comment se comparent les deux courbes du graphique du bas ?</li>
        <li>Trouvez deux réglages différents (période, tension) qui donnent la même longueur d’onde.</li>
        <li>Faites varier l’amplitude A : le graphique du bas reste une sinusoïde. Que valent ses maxima ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>période T (s) et fréquence : {FF}</li>
        <li>double périodicité : T dans le temps (un point), λ dans l’espace (la corde à un instant)</li>
        <li>relation : {FLT}, soit {FCT}</li>
        <li>points en phase : distance = k·λ ; en opposition : (k + ½)·λ</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .op-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .op-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .op-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .op-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .op-ex > .op-sc { grid-column: 1; grid-row: 1 / span 2; }
        .op-ex > .op-rg { grid-column: 2; grid-row: 1; }
        .op-ex > .op-me { grid-column: 2; grid-row: 2; }
        .op-pile { display: flex; flex-direction: column; gap: 12px; }
        @media (min-width: 901px) { .op-l1.cote .op-carte { order: 2; } .op-l1.cote .op-main { order: 1; } }
        @media (max-width: 900px) { .op-l1.cote, .op-ex { grid-template-columns: minmax(0, 1fr); } .op-ex > .op-sc, .op-ex > .op-rg, .op-ex > .op-me { grid-column: 1; grid-row: auto; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Ondes mécaniques : période, longueur d’onde et relation λ = c·T</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une onde se répète dans le <strong>temps</strong> (période T) et dans l’<strong>espace</strong> (longueur d’onde λ). Lisez ces deux grandeurs sur les graphiques et reliez-les à la <strong>célérité</strong> c de l’onde.</div>
      <div className={`op-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="op-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="op-carte">{panneauHypo}</div> : null}
        <div className="op-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'celerite' ? suiviC : defi.type === 'longueur' ? suiviL : suiviR}/></div>}
          {enExplore ? (
            <div className="op-ex"><div className="op-sc">{sceneBox}</div><div className="op-rg">{reglagesExplore}</div><div className="op-me">{mesures}</div></div>
          ) : (
            <div className="op-pile">{sceneBox}{enGuide ? reglagesGuide : reglagesDefi}</div>
          )}
        </div>
      </div>
      {(enExplore || (enGuide && etape >= ETAPES.length - 1)) && <div className="op-l2">{panneauHypo}</div>}
      {enExplore && <div className="op-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
