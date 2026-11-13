import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./travailModele";

const SIM_ID = 106;
declarerDefis(SIM_ID, [['frott', 'Trouver la force de frottement'], ['arret', 'Prévoir la distance d’arrêt']]);

// ====================================================
//  SIM 106 — TRAVAIL D'UNE FORCE ET ÉNERGIE CINÉTIQUE (1G, chapitre 12, partie 1)
//  Scène 1 : chariot tiré par une force constante (W = F·AB·cos θ, théorème de l'énergie cinétique, force résistante, force ⟂).
//  Scène 2 : mobile sur un plan incliné avec deux barrières lumineuses (travail du poids, frottement, v = ℓ/Δt), comme l'activité expérimentale.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const tire = t => t[Math.floor(Math.random() * t.length)];
const ROUGE = '#dc2626', VERT = '#16a34a', BLEU = '#2563eb', ORANGE = '#c2410c', NOIR = '#0f172a', GRIS = '#64748b';
const L_EF = 1, S_E = 0.2, ELL = 0.01, M_PLAN = 0.2;     // distance E→F (m), distance lâcher→E (m), largeur de la languette (m), masse du mobile (kg)
const TIRE_DEPART = { m: 2, F: 0, theta: 0, AB: 2, vA: 3 };
const PLAN_DEPART = { alpha: 15, f: 0, m: M_PLAN };
const reduit = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

// ---------- animation : position relative pos ∈ [0, 1] ----------
function useLecture(duree) {
  const [pos, setPos] = useState(0), [joue, setJoue] = useState(false), raf = useRef(null);
  useEffect(() => {
    if (!joue) return;
    if (reduit()) { setPos(1); setJoue(false); return; }
    let t0 = null;
    const pas = now => { if (t0 === null) t0 = now - pos * duree * 1000; const p = Math.min(1, (now - t0) / (duree * 1000)); setPos(p); if (p < 1) raf.current = requestAnimationFrame(pas); else setJoue(false); };
    raf.current = requestAnimationFrame(pas);
    return () => raf.current && cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joue]);
  const lancer = () => { setPos(0); setJoue(true); };
  return { pos, setPos, joue, lancer, arreter: () => setJoue(false) };
}

// ---------- scène 1 : chariot tiré ----------
function SceneTire({ p, pos, force }) {
  const C = M.chariot(p), W0 = 60, W1 = 540, hautSol = 150;
  const fin = C.arrete && C.distArret != null ? C.distArret / p.AB : 1;       // le chariot s'arrête avant B si la force résistante est trop forte
  const frac = Math.min(pos, 1) * fin;
  const cx = W0 + 30 + frac * (W1 - W0 - 60);
  const composante = p.F * Math.cos(p.theta * M.RAD);
  const v = Math.sqrt(Math.max(0, p.vA * p.vA + 2 * composante * frac * p.AB / p.m));
  const L = 28 + p.F * 6, ang = p.theta * M.RAD, fx = L * Math.cos(ang), fy = -L * Math.sin(ang);
  const lv = Math.min(110, 18 * v);
  return (
    <svg viewBox="0 0 600 200" style={{ width: '100%', display: 'block', background: '#f8fafc', borderRadius: 8 }} role="img"
      aria-label={`Chariot de masse ${nbf(p.m, 1)} kilogrammes sur un rail horizontal entre les points A et B distants de ${nbf(p.AB, 1)} mètres${force && p.F > 0 ? `, tiré par une force de ${nbf(p.F, 0)} newtons faisant un angle de ${nbf(p.theta, 0)} degrés avec le déplacement` : ''}`}>
      <line x1="20" y1={hautSol} x2="580" y2={hautSol} stroke={GRIS} strokeWidth="3"/>
      {[[W0 + 30, 'A'], [W1 - 30, 'B']].map(([x, n]) => <g key={n}><line x1={x} y1="60" x2={x} y2={hautSol} stroke="#94a3b8" strokeDasharray="4 4"/><text x={x} y="175" textAnchor="middle" fontSize="15" fontWeight="700" fill={NOIR}>{n}</text></g>)}
      <g>
        <rect x={cx - 34} y={hautSol - 44} width="68" height="28" rx="4" fill="#fde68a" stroke={NOIR} strokeWidth="2"/>
        <circle cx={cx - 20} cy={hautSol - 8} r="8" fill="#475569"/><circle cx={cx + 20} cy={hautSol - 8} r="8" fill="#475569"/>
        {v > 0.05 && <g><line x1={cx} y1={hautSol - 62} x2={cx + lv} y2={hautSol - 62} stroke={VERT} strokeWidth="4"/><polygon points={`${cx + lv + 9},${hautSol - 62} ${cx + lv - 2},${hautSol - 68} ${cx + lv - 2},${hautSol - 56}`} fill={VERT}/>
          <text x={cx} y={hautSol - 70} fontSize="13" fontWeight="700" fill={VERT}>v</text></g>}
        {force && p.F > 0 && <g><line x1={cx} y1={hautSol - 30} x2={cx + fx} y2={hautSol - 30 + fy} stroke={ROUGE} strokeWidth="4"/>
          <polygon points={`${cx + fx},${hautSol - 30 + fy} ${cx + fx - 10 * Math.cos(ang) - 5 * Math.sin(ang)},${hautSol - 30 + fy + 10 * Math.sin(ang) - 5 * Math.cos(ang)} ${cx + fx - 10 * Math.cos(ang) + 5 * Math.sin(ang)},${hautSol - 30 + fy + 10 * Math.sin(ang) + 5 * Math.cos(ang)}`} fill={ROUGE}/>
          <text x={cx + fx / 2 + (fx >= 0 ? 6 : -18)} y={hautSol - 36 + fy / 2 - 4} fontSize="14" fontWeight="700" fill={ROUGE} stroke="#fff" strokeWidth="3" paintOrder="stroke">F</text></g>}
      </g>
    </svg>);
}

// ---------- scène 2 : plan incliné et barrières lumineuses ----------
function ScenePlan({ alpha, pos, a, flechesPRF, f, m }) {
  const ang = alpha * M.RAD, ech = 330, x0 = 40, y0 = 40, sMax = S_E + L_EF;
  const pt = s => [x0 + s * ech * Math.cos(ang), y0 + s * ech * Math.sin(ang)];
  const [xA, yA] = pt(0), [xB, yB] = pt(sMax + 0.12);
  const sCourant = Math.min(sMax, 0.5 * a * Math.pow(pos * Math.sqrt(2 * sMax / Math.max(a, 1e-9)), 2));
  const [mx, my] = pt(sCourant);
  const nx = -Math.sin(ang), ny = Math.cos(ang);           // normale au plan, vers le bas (côté du plan) ; l'objet est du côté opposé
  const cx = mx - nx * 14, cy = my - ny * 14;
  const fleche = (x1, y1, dx, dy, col, nom, dxt = 6, dyt = -6) => {
    const n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n;
    return <g key={nom}><line x1={x1} y1={y1} x2={x1 + dx} y2={y1 + dy} stroke={col} strokeWidth="4"/>
      <polygon points={`${x1 + dx},${y1 + dy} ${x1 + dx - 11 * ux - 5.5 * uy},${y1 + dy - 11 * uy + 5.5 * ux} ${x1 + dx - 11 * ux + 5.5 * uy},${y1 + dy - 11 * uy - 5.5 * ux}`} fill={col}/>
      <text x={x1 + dx + dxt} y={y1 + dy + dyt} fontSize="14" fontWeight="700" fill={col} stroke="#fff" strokeWidth="3" paintOrder="stroke">{nom}</text></g>;
  };
  const P = 0.55 * 100;                                   // longueur du poids (px) ; les autres forces sont à la même échelle (1 px ≈ 0,036 N)
  const forces = flechesPRF ? [
    fleche(cx, cy, 0, P, ROUGE, 'P', 8, 4),
    fleche(cx, cy, nx * -P * Math.cos(ang), ny * -P * Math.cos(ang), BLEU, 'R', 8, -2),
    ...(f > 0 ? [fleche(cx, cy, -Math.cos(ang) * (f / (m * M.G)) * P, -Math.sin(ang) * (f / (m * M.G)) * P, ORANGE, 'f', -22, -6)] : []),
  ] : [];
  return (
    <svg viewBox="0 0 600 300" style={{ width: '100%', display: 'block', background: '#f8fafc', borderRadius: 8 }} role="img"
      aria-label={`Mobile sur un plan incliné de ${nbf(alpha, 0)} degrés muni de deux barrières lumineuses E et F distantes de 1,00 mètre${flechesPRF ? ' ; forces : poids, réaction du support' + (f > 0 ? ', frottement' : '') : ''}`}>
      <polygon points={`${xA},${yA} ${xB},${yB} ${xB},${yA}`} fill="#e2e8f0" stroke={GRIS} strokeWidth="2"/>
      <line x1={xA} y1={yA} x2={xB} y2={yB} stroke={NOIR} strokeWidth="4"/>
      <path d={`M${xB - 50},${yB} A50,50 0 0 0 ${xB - 50 * Math.cos(ang) * 1},${yB - 50 * Math.sin(ang)}`} fill="none" stroke={GRIS} strokeWidth="1.5" transform={`translate(0,0)`}/>
      {[[S_E, 'E'], [sMax, 'F']].map(([s, n]) => { const [gx, gy] = pt(s); return <g key={n}>
        <line x1={gx - nx * 8} y1={gy - ny * 8} x2={gx - nx * 40} y2={gy - ny * 40} stroke={ORANGE} strokeWidth="3"/><line x1={gx} y1={gy} x2={gx - nx * 10} y2={gy - ny * 10} stroke={ORANGE} strokeWidth="3"/>
        <text x={gx - nx * 50 - 4} y={gy - ny * 50 + 2} fontSize="15" fontWeight="700" fill={ORANGE}>{n}</text></g>; })}
      <g transform={`rotate(${alpha} ${cx} ${cy})`}>
        <rect x={cx - 22} y={cy - 8} width="44" height="16" rx="3" fill="#fde68a" stroke={NOIR} strokeWidth="2"/>
        <rect x={cx - 3} y={cy - 16} width="6" height="9" fill={NOIR}/></g>
      {forces}
      <text x={xB - 82} y={yB - 6} fontSize="13" fontWeight="700" fill={GRIS}>α</text>
    </svg>);
}

// ---------- éléments d'affichage ----------
const Ind = ({ b, i }) => <>{b}<sub>{i}</sub></>;
const mmlSub = (b, i) => <msub><mi>{b}</mi><mi>{i}</mi></msub>;
const FWab = <Formule><msub><mi>W</mi><mrow><mi>A</mi><mo>→</mo><mi>B</mi></mrow></msub><mo>(</mo><mover><mi>F</mi><mo>→</mo></mover><mo>)</mo><mo>=</mo><mi>F</mi><mo>×</mo><mi>AB</mi><mo>×</mo><mi>cos</mi><mi>θ</mi></Formule>;
const FEc = <Formule><msub><mi>E</mi><mi>c</mi></msub><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>×</mo><mi>m</mi><mo>×</mo><msup><mi>v</mi><mn>2</mn></msup></Formule>;
const FTheo = <Formule><mi>Δ</mi><msub><mi>E</mi><mi>c</mi></msub><mo>=</mo><mi>Σ</mi><mi>W</mi><mo>=</mo><msub><mi>W</mi><mi>1</mi></msub><mo>+</mo><msub><mi>W</mi><mi>2</mi></msub><mo>+</mo><mi>…</mi></Formule>;

// Schémas des cartes « À retenir » (SVG, texte dans le cadre, mêmes couleurs que les scènes)
const Schema = ({ aria, h = 150, children }) => <svg viewBox={`0 0 360 ${h}`} role="img" aria-label={aria} style={{ width: '100%', maxWidth: 420, display: 'block', margin: '4px 0 8px', background: '#fff', borderRadius: 8 }}>{children}</svg>;
const Fl = ({ x1, y1, x2, y2, c = ROUGE, w = 3 }) => { const dx = x2 - x1, dy = y2 - y1, n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n;
  return <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - 9 * ux - 4.5 * uy},${y2 - 9 * uy + 4.5 * ux} ${x2 - 9 * ux + 4.5 * uy},${y2 - 9 * uy - 4.5 * ux}`} fill={c}/></g>; };
const Barre = ({ x, h, c, nom, y0 = 120 }) => <g><rect x={x} y={y0 - h} width="46" height={h} fill={c} opacity="0.85"/><text x={x + 23} y={y0 + 14} textAnchor="middle" fontSize="11.5" fontWeight="700" fill={NOIR}>{nom}</text></g>;
const T = ({ x, y, children, c = NOIR, s = 11.5, w = 600, a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;

const SchemaEc = () => (
  <Schema aria="Deux chariots : le premier roule à la vitesse v, le second à la vitesse 2v ; la barre d'énergie cinétique du second est quatre fois plus haute" h={150}>
    <line x1="10" y1="120" x2="350" y2="120" stroke={GRIS} strokeWidth="2"/>
    <rect x="30" y="94" width="50" height="22" rx="3" fill="#fde68a" stroke={NOIR} strokeWidth="2"/><Fl x1={32} y1={86} x2={62} y2={86} c={VERT}/><T x={34} y={76} c={VERT} w={700}>v</T>
    <rect x="30" y="127" width="0" height="0"/>
    <rect x="200" y="94" width="50" height="22" rx="3" fill="#fde68a" stroke={NOIR} strokeWidth="2"/><Fl x1={202} y1={86} x2={262} y2={86} c={VERT}/><T x={206} y={76} c={VERT} w={700}>2v</T>
    <rect x="94" y="102" width="14" height="14" fill={BLEU}/><T x={92} y={134} c={BLEU} w={700}>E c</T>
    <rect x="270" y="74" width="56" height="42" fill={BLEU} opacity="0.85"/><T x={298} y={134} c={BLEU} w={700} a="middle">4 E c</T>
    <T x={10} y={16} s={13} w={700}>v × 2  ⇒  E c × 4</T><T x={10} y={34} s={12} c={GRIS} w={500}>l’énergie dépend du carré de la vitesse</T>
  </Schema>);
const SchemaMoteur = () => (
  <Schema aria="Un chariot est poussé par une force dans le sens du déplacement : le travail est positif et l'énergie cinétique augmente de A à B" h={150}>
    <line x1="10" y1="108" x2="350" y2="108" stroke={GRIS} strokeWidth="2"/>
    <g><rect x="30" y="80" width="50" height="22" rx="3" fill="#fde68a" stroke={NOIR} strokeWidth="2"/><Fl x1={32} y1={92} x2={12} y2={92} c={ROUGE} w={0}/></g>
    <Fl x1={40} y1={70} x2={90} y2={70} c={ROUGE}/><T x={66} y={62} c={ROUGE} w={700}>F</T>
    <T x={42} y={126} w={700}>A</T><T x={300} y={126} w={700}>B</T>
    <rect x="270" y="80" width="50" height="22" rx="3" fill="#fde68a" stroke={NOIR} strokeWidth="2"/><Fl x1={272} y1={70} x2={322} y2={70} c={ROUGE}/>
    <Fl x1={70} y1={92} x2={96} y2={92} c={VERT}/><Fl x1={272} y1={52} x2={340} y2={52} c={VERT}/><T x={346} y={56} c={VERT} w={700}>v</T>
    <T x={10} y={20} s={13} w={700}>F dans le sens du mouvement</T><T x={10} y={138} s={12} c={VERT} w={700}>W &gt; 0  ⇒  E c augmente</T>
  </Schema>);
const SchemaAngle = () => (
  <Schema aria="Trois cas : force dans le sens du déplacement, force perpendiculaire, force opposée ; le travail est positif, nul ou négatif" h={150}>
    {[[10, 0, VERT, 'θ = 0°', 'W = + F·AB', 'moteur'], [130, 90, GRIS, 'θ = 90°', 'W = 0', 'nul'], [250, 180, ROUGE, 'θ = 180°', 'W = − F·AB', 'résistant']].map(([x, th, c, a, w, n]) => {
      const r = th * M.RAD, fx = 36 * Math.cos(r), fy = -36 * Math.sin(r);
      return <g key={n}><rect x={x + 18} y="86" width="50" height="22" rx="3" fill="#fde68a" stroke={NOIR} strokeWidth="2"/><line x1={x + 10} y1="112" x2={x + 100} y2="112" stroke={GRIS} strokeWidth="2"/>
        <Fl x1={x + 43} y1={80} x2={x + 43 + fx} y2={80 + fy} c={c}/><Fl x1={x + 18} y1={122} x2={x + 68} y2={122} c={BLEU} w={2}/>
        <T x={x + 4} y={20} c={c} w={700}>{a}</T><T x={x + 4} y={138} c={c} w={700}>{w}</T></g>; })}
    <T x={4} y={140} s={0}> </T>
  </Schema>);
const SchemaPoids = () => (
  <Schema aria="Deux trajets différents entre E et F, l'un droit, l'autre courbe : le travail du poids est le même car la différence d'altitude est la même" h={160}>
    <line x1="30" y1="30" x2="330" y2="30" stroke="#94a3b8" strokeDasharray="4 4"/><line x1="30" y1="130" x2="330" y2="130" stroke="#94a3b8" strokeDasharray="4 4"/>
    <circle cx="60" cy="30" r="7" fill={ORANGE}/><T x={44} y={22} c={ORANGE} w={700}>E</T><circle cx="300" cy="130" r="7" fill={ORANGE}/><T x={306} y={150} c={ORANGE} w={700}>F</T>
    <line x1="60" y1="30" x2="300" y2="130" stroke={BLEU} strokeWidth="3"/><path d="M60,30 C60,120 160,135 300,130" fill="none" stroke={ROUGE} strokeWidth="3"/>
    <Fl x1={330} y1={30} x2={330} y2={130} c={NOIR} w={2}/><T x={246} y={86} s={11}>h = z</T><T x={270} y={90} s={9}>E</T><T x={278} y={86} s={11}> − z</T><T x={300} y={90} s={9}>F</T>
    <T x={8} y={156} s={12} w={700}>W(P) = m g (z E − z F)  : même valeur, quel que soit le trajet</T>
  </Schema>);
const SchemaTheoreme = () => (
  <Schema aria="Bilan : l'énergie cinétique en F est égale à l'énergie cinétique en E plus la somme des travaux des forces entre E et F" h={150}>
    <Barre x={30} h={30} c={BLEU} nom="E c (E)"/><T x={92} y={72} s={20} w={700}>+</T>
    <Barre x={120} h={70} c={VERT} nom="W (P)"/><Barre x={172} h={22} c={ROUGE} nom="W (f)"/><T x={238} y={72} s={20} w={700}>=</T>
    <Barre x={266} h={78} c={BLEU} nom="E c (F)"/>
    <T x={10} y={20} s={13} w={700}>ΔE c = ΣW = W(P) + W(R) + W(f)</T><T x={10} y={36} s={12} c={GRIS} w={500}>W(R) = 0 : R ⟂ déplacement</T>
  </Schema>);
const SchemaFrott = () => (
  <Schema aria="Frottement : la force est opposée au déplacement, son travail est négatif et vaut moins f fois la longueur" h={140}>
    <line x1="10" y1="100" x2="350" y2="100" stroke={GRIS} strokeWidth="2"/>
    <rect x="130" y="72" width="60" height="24" rx="3" fill="#fde68a" stroke={NOIR} strokeWidth="2"/>
    <Fl x1={200} y1={60} x2={260} y2={60} c={VERT}/><T x={266} y={64} c={VERT} w={700}>mouvement</T>
    <Fl x1={125} y1={84} x2={70} y2={84} c={ORANGE}/><T x={72} y={76} c={ORANGE} w={700}>f</T>
    <T x={10} y={20} s={13} w={700}>W(f) = − f × L   (f constante, trajet rectiligne)</T>
    <T x={10} y={124} s={12} c={ORANGE} w={700}>Idée fausse : « un frottement ne travaille pas ».  Vrai : il enlève de l’énergie.</T>
  </Schema>);
const puces = (...l) => <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>{l.map((x, i) => <li key={i}>{x}</li>)}</ul>;

// ---------- tâches factorisées ----------
const bloqueSi = (ok, msg) => ok ? null : msg;

export function SimulationTravail() {
  const [mode, setMode] = useState(() => modeOuverture('travail-guide-v1'));
  useSignalerMode(mode);
  const [suiviFrott, noterFrott] = useCompteurDefi(), [suiviArret, noterArret] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('travail-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('frott');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [scene, setScene] = useState('tire');
  const [tp, setTp] = useState(TIRE_DEPART), [pl, setPl] = useState(PLAN_DEPART);
  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const sceneEff = enDefi ? (defi?.type === 'arret' ? 'tire' : 'plan') : scene;
  const tpEff = enDefi && defi?.type === 'arret' ? defi.p : tp;
  const plEff = enDefi && defi?.type === 'frott' ? defi.p : pl;
  const C = M.chariot(tpEff);
  const MP = M.mesurePlan({ m: plEff.m, alpha: plEff.alpha, L: L_EF, sE: S_E, f: plEff.f, l: ELL });
  const dureeTire = 3, dureePlan = 4;
  const lecT = useLecture(dureeTire), lecP = useLecture(dureePlan);
  const lec = sceneEff === 'tire' ? lecT : lecP;
  const etape = guide.etape;

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const fixT = (o) => { setScene('tire'); setTp(t => ({ ...TIRE_DEPART, ...o })); lecT.setPos(0); };
  const fixP = (o) => { setScene('plan'); setPl({ ...PLAN_DEPART, ...o }); lecP.setPos(0); };
  const T0 = (o) => { const x = { ...TIRE_DEPART, ...o }; return x; };
  const est = (o) => scene === 'tire' && Object.entries(o).every(([k, v]) => Math.abs(tp[k] - v) < 1e-9);
  const estP = (o) => scene === 'plan' && Object.entries(o).every(([k, v]) => Math.abs(pl[k] - v) < 1e-9);
  const Ec_9 = M.ecin(2, 3);
  const cMot = M.chariot(T0({ F: 10, theta: 0, vA: 0 })), cRes = M.chariot(T0({ F: 5, theta: 180, vA: 4 })), cPerp = M.chariot(T0({ F: 10, theta: 90, vA: 4 })), cAng = M.chariot(T0({ F: 10, theta: 60, vA: 0 }));
  const mp0 = M.mesurePlan({ m: M_PLAN, alpha: 15, L: L_EF, sE: S_E, f: 0, l: ELL }), mp1 = M.mesurePlan({ m: M_PLAN, alpha: 15, L: L_EF, sE: S_E, f: 0.2, l: ELL });
  const dtE0 = Number(nbf(mp0.dtE * 1e3, 2).replace(',', '.')), dtF0 = Number(nbf(mp0.dtF * 1e3, 2).replace(',', '.'));
  const vF0 = 0.01 / (dtF0 * 1e-3), vE0 = 0.01 / (dtE0 * 1e-3);                     // vitesses calculées à partir des durées affichées
  const vE0a = Number(nbf(vE0, 2).replace(',', '.')), vF0a = Number(nbf(vF0, 2).replace(',', '.'));
  const dEc0 = M.ecin(M_PLAN, vF0a) - M.ecin(M_PLAN, vE0a);
  const vE1a = Number(nbf(mp1.vEmes, 2).replace(',', '.')), vF1a = Number(nbf(mp1.vFmes, 2).replace(',', '.'));
  const dEc1 = M.ecin(M_PLAN, vF1a) - M.ecin(M_PLAN, vE1a);
  const hPlan = Number(nbf(mp0.h, 3).replace(',', '.'));
  const WP = M_PLAN * M.G * hPlan;

  const ETAPES = [
    { id: 'ec', titre: 'L’énergie du mouvement', focus: ['scene'],
      texte: <>Un chariot de masse <em>m</em> = 2,0{NB}kg roule à la vitesse <em>v</em> = 3,0{NB}m/s. Son <strong>énergie cinétique</strong> est l’énergie qu’il possède du fait de son mouvement : <strong><Ind b="E" i="c"/> = ½·m·v²</strong> (avec <em>m</em> en kg et <em>v</em> en m/s, <Ind b="E" i="c"/> est en joules).</>,
      tache: { type: 'num', q: 'Énergie cinétique du chariot', unite: 'J', vrai: Ec_9, tol: 0.02, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Hypothèse : le chariot est modélisé par un point matériel qui se translate (toute la masse avance à la même vitesse).', '1/2 × 2,0 × (3,0)² = 1/2 × 2,0 × 9,0 = 9,0 J.'],
        pieges: [[M.ecin(2, 3) * 2, 'Vous avez oublié le facteur ½.'], [0.5 * 2 * 3, 'Vous avez oublié de mettre la vitesse au carré.'], [(0.5 * 2 * 3) ** 2, 'Le carré ne porte que sur la vitesse, pas sur ½ m v.']],
        expl: '½ × 2,0 × 3,0² = 9,0 J.', indice: 'E_c = ½ × m × v² : calculez d’abord v², puis multipliez par m et par ½.' } },
    { id: 'ec2', titre: 'Si la vitesse double', focus: ['scene'],
      retenirTitre: 'À RETENIR : L’ÉNERGIE CINÉTIQUE',
      retenir: <><SchemaEc/>{FEc}{puces(<>Une phrase-clé : <strong>vitesse × 2 ⇒ énergie × 4</strong> (la vitesse est au carré) ; masse × 2 ⇒ énergie × 2.</>, <>Exemple : 2,0 kg à 3,0 m/s → 9,0 J ; à 6,0 m/s → 36 J.</>, <><strong>Idée fausse</strong> : « deux fois plus vite = deux fois plus d’énergie ». <strong>Vrai</strong> : quatre fois plus (c’est pourquoi la distance de freinage augmente si vite).</>, <>Unités : <em>m</em> en kg, <em>v</em> en m/s, <Ind b="E" i="c"/> en J. L’énergie cinétique dépend du référentiel (comme la vitesse).</>)}</>,
      texte: <>Le chariot roule maintenant deux fois plus vite : <em>v</em> = 6,0{NB}m/s, sa masse ne change pas.</>,
      tache: { type: 'qcm', q: 'Son énergie cinétique est…', options: ['multipliée par 4', 'multipliée par 2', 'inchangée'], bonne: 0,
        expl: '<E_c> est proportionnelle à v² : (2v)² = 4v², donc l’énergie est multipliée par 4 (36 J au lieu de 9,0 J).'.replace('<E_c>', 'E_c'), indice: 'Dans ½ m v², la vitesse est au carré : que devient (2v)² ?' } },
    { id: 'moteur', titre: 'Une force dans le sens du mouvement', focus: ['scene', 'mesures'],
      texte: <>Le chariot est maintenant lâché sans vitesse initiale en A. Une force constante <strong>F</strong> = 10{NB}N le pousse dans le sens du déplacement, sur la distance AB = 2,0{NB}m. Appliquez la force puis lancez le chariot.</>,
      tache: { type: 'action', ok: est({ F: 10, theta: 0, vA: 0 }), label: 'Appliquer la force F', faire: () => fixT({ F: 10, theta: 0, vA: 0 }), consigne: 'Force F = 10 N dans le sens du mouvement, vitesse initiale nulle' } },
    { id: 'effet', titre: 'L’effet de cette force', focus: ['scene'],
      texte: <>Lancez le chariot avec le bouton « Lancer ». Observez la flèche verte (vitesse) entre A et B.</>,
      tache: { type: 'qcm', q: 'Entre A et B, la force F fait…', options: ['augmenter l’énergie cinétique du chariot', 'diminuer l’énergie cinétique du chariot', 'ne pas modifier l’énergie cinétique du chariot'], bonne: 0,
        expl: 'La force pousse dans le sens du mouvement : la vitesse augmente, donc l’énergie cinétique aussi. On dit que la force fournit un travail moteur.', indice: 'Regardez comment varie la flèche verte entre A et B.' } },
    { id: 'wmot', titre: 'Le travail de la force', focus: ['mesures'],
      texte: <>Quand la force est de même direction et de même sens que le déplacement, son <strong>travail</strong> vaut <strong>W = F × AB</strong> (en joules, avec F en N et AB en m). Ici F = 10{NB}N et AB = 2,0{NB}m.</>,
      tache: { type: 'num', q: 'Travail W de F (dans le sens du mouvement)', unite: 'J', vrai: 20, tol: 0.02, affiche: v => nbf(v, 0), cs: 2,
        bloque: bloqueSi(est({ F: 10, theta: 0, vA: 0 }), 'Appliquez d’abord la force (étape « Une force dans le sens du mouvement »).'),
        calcul: () => ['W = F × AB = 10 × 2,0 = 20 J.'],
        pieges: [[10 / 2, 'Vous avez divisé au lieu de multiplier.']],
        expl: 'W = 10 × 2,0 = 20 J : un travail positif (travail moteur).', indice: 'W = F × AB, les deux grandeurs étant en unités SI (N et m).' } },
    { id: 'dec', titre: 'Le travail change l’énergie', focus: ['mesures'],
      retenirTitre: 'À RETENIR : LE TRAVAIL MOTEUR',
      retenir: <><SchemaMoteur/>{puces(<>Une force <strong>dans le sens du déplacement</strong> fournit un travail <strong>positif</strong> : W = + F × AB.</>, <>Ce travail <strong>augmente</strong> l’énergie cinétique : ΔE<sub>c</sub> = E<sub>c</sub>(B) − E<sub>c</sub>(A) = W (si c’est la seule force qui travaille).</>, <>Exemple : F = 10 N sur 2,0 m ⇒ W = 20 J ⇒ un chariot de 2,0 kg lâché sans vitesse atteint 4,5 m/s.</>, <><strong>Idée fausse</strong> : « le travail, c’est l’effort ressenti ». <strong>Vrai</strong> : en physique, W est un transfert d’énergie par une force qui se déplace.</>)}</>,
      texte: <>Le chariot est lâché sans vitesse en A (<Ind b="E" i="c"/>(A) = 0) et arrive en B à la vitesse <em>v</em><sub>B</sub> = {nbf(cMot.vB, 2)}{NB}m/s (lue dans « Mesures »). Calculez la variation d’énergie cinétique <strong>ΔE<sub>c</sub> = <Ind b="E" i="c"/>(B) − <Ind b="E" i="c"/>(A)</strong>.</>,
      tache: { type: 'num', q: 'Variation d’énergie cinétique ΔE_c du chariot entre A et B', unite: 'J', vrai: M.ecin(2, Number(nbf(cMot.vB, 2).replace(',', '.'))), tol: 0.02, affiche: v => nbf(v, 1), cs: 3,
        bloque: bloqueSi(est({ F: 10, theta: 0, vA: 0 }), 'Remettez d’abord la situation (bouton « Rétablir ») : force de 10 N, vitesse initiale nulle.'),
        calcul: () => [`E_c(A) = 0 (vitesse initiale nulle) ; E_c(B) = ½ × 2,0 × ${nbf(cMot.vB, 2)}² = ${nbf(M.ecin(2, Number(nbf(cMot.vB, 2).replace(',', '.'))), 1)} J.`, 'ΔE_c = E_c(B) − E_c(A) = 20 J : c’est exactement le travail W de la force.'],
        pieges: [[0.5 * 2 * cMot.vB, 'Vous avez oublié de mettre la vitesse au carré.'], [2 * cMot.vB * cMot.vB, 'Vous avez oublié le facteur ½.']],
        expl: 'ΔE_c = ½ × 2,0 × 4,47² ≈ 20 J = W : la variation d’énergie cinétique est égale au travail de la force.', indice: 'ΔE_c = E_c(B) − E_c(A), avec E_c = ½ m v² et E_c(A) = 0.' } },
    { id: 'resist', titre: 'Une force qui freine', focus: ['scene', 'mesures'],
      texte: <>Le chariot part de A à <em>v</em><sub>A</sub> = 4,0{NB}m/s. Une force <strong>F</strong> = 5,0{NB}N s’exerce maintenant <strong>en sens opposé</strong> au déplacement (θ = 180°) sur AB = 2,0{NB}m. Appliquez-la puis lancez le chariot.</>,
      tache: { type: 'action', ok: est({ F: 5, theta: 180, vA: 4 }), label: 'Appliquer la force opposée', faire: () => fixT({ F: 5, theta: 180, vA: 4 }), consigne: 'Force F = 5,0 N opposée au mouvement, vitesse initiale 4,0 m/s' } },
    { id: 'resistw', titre: 'Le travail résistant', focus: ['mesures'],
      texte: <>La force est opposée au déplacement : son travail est <strong>résistant</strong>, <strong>W = − F × AB</strong>. Ici F = 5,0{NB}N et AB = 2,0{NB}m.</>,
      tache: { type: 'num', q: 'Travail W de F (opposée au mouvement)', unite: 'J', vrai: -10, tol: 0.02, affiche: v => nbf(v, 0), cs: 2,
        bloque: bloqueSi(est({ F: 5, theta: 180, vA: 4 }), 'Appliquez d’abord la force opposée (étape précédente), avec « Rétablir ».'),
        calcul: () => ['La force est opposée au déplacement : θ = 180°, cos θ = −1.', 'W = − F × AB = − 5,0 × 2,0 = − 10 J.'],
        pieges: [[10, 'Le signe : la force s’oppose au mouvement, son travail est négatif.']],
        expl: 'W = − 10 J (travail résistant) : l’énergie cinétique diminue de 16 J à 6,0 J, soit une variation de − 10 J.', indice: 'W = − F × AB lorsque la force est opposée au déplacement.' } },
    { id: 'perp', titre: 'Une force perpendiculaire', focus: ['scene', 'mesures'],
      texte: <>Dernier cas : la force <strong>F</strong> = 10{NB}N est maintenant <strong>perpendiculaire</strong> au déplacement (θ = 90°) ; le chariot part de A à 4,0{NB}m/s. Appliquez-la et lancez le chariot.</>,
      tache: { type: 'action', ok: est({ F: 10, theta: 90, vA: 4 }), label: 'Force perpendiculaire', faire: () => fixT({ F: 10, theta: 90, vA: 4 }), consigne: 'Force de 10 N perpendiculaire au déplacement, vitesse initiale 4,0 m/s' } },
    { id: 'perpq', titre: 'Qu’observe-t-on ?', focus: ['mesures'],
      texte: <>La vitesse en B est <em>v</em><sub>B</sub> = {nbf(cPerp.vB, 2)}{NB}m/s, la même qu’en A.</>,
      tache: { type: 'qcm', q: 'Le travail d’une force perpendiculaire au déplacement est…', options: ['nul', 'positif', 'négatif'], bonne: 0,
        expl: 'Une force perpendiculaire au déplacement ne modifie pas l’énergie cinétique : son travail est nul (cos 90° = 0). C’est le cas du poids et de la réaction du support sur un rail horizontal.', indice: 'La vitesse a-t-elle changé entre A et B ? Que vaut alors ΔE_c ?' } },
    { id: 'angle', titre: 'Une force oblique', focus: ['scene'],
      texte: <>Dans le cas général, la force fait un angle <strong>θ</strong> avec le déplacement : <strong>W = F × AB × cos θ</strong>. Appliquez F = 10{NB}N avec θ = 60°, AB = 2,0{NB}m, vitesse initiale nulle.</>,
      tache: { type: 'action', ok: est({ F: 10, theta: 60, vA: 0 }), label: 'Force à 60°', faire: () => fixT({ F: 10, theta: 60, vA: 0 }), consigne: 'F = 10 N, θ = 60°, vitesse initiale nulle' } },
    { id: 'cos', titre: 'Le travail dans le cas général', focus: ['mesures'],
      retenirTitre: 'À RETENIR : TRAVAIL D’UNE FORCE CONSTANTE',
      retenir: <><SchemaAngle/>{FWab}{puces(<>θ est l’angle entre la force et le déplacement : θ aigu ⇒ W &gt; 0 (moteur) ; θ = 90° ⇒ W = 0 ; θ obtus ⇒ W &lt; 0 (résistant).</>, <>Exemple : F = 10 N, AB = 2,0 m, θ = 60° ⇒ W = 10 × 2,0 × 0,5 = 10 J.</>, <><strong>Piège</strong> : calculatrice en <strong>degrés</strong> pour cos θ.</>)}</>,
      texte: <>Calculez le travail de la force <strong>F</strong> = 10{NB}N (θ = 60°) sur AB = 2,0{NB}m : <strong>W = F × AB × cos θ</strong>.</>,
      tache: { type: 'num', q: 'Travail W de F (oblique, θ = 60°)', unite: 'J', vrai: 10, tol: 0.02, affiche: v => nbf(v, 0), cs: 2,
        bloque: bloqueSi(est({ F: 10, theta: 60, vA: 0 }), 'Appliquez d’abord la force oblique (étape précédente).'),
        calcul: () => ['W = F × AB × cos θ = 10 × 2,0 × cos 60° = 10 × 2,0 × 0,50 = 10 J.', 'Calculatrice en degrés : cos 60° = 0,50.'],
        pieges: [[20, 'Vous avez oublié le facteur cos θ : seule la composante de F le long du déplacement travaille.'], [10 * 2 * Math.cos(60), 'Votre calculatrice est en radians : l’angle est en degrés.']],
        expl: 'W = 10 × 2,0 × 0,50 = 10 J.', indice: 'W = F × AB × cos θ ; réglez la calculatrice en degrés (cos 60° = 0,5).' } },
    { id: 'plan', titre: 'Un mobile sur un plan incliné', focus: ['scene'],
      texte: <>On modélise une situation concrète (comme dans l’activité expérimentale) : un mobile de masse <em>m</em> = 0,200{NB}kg, lâché sans vitesse, glisse sur un plan incliné de <strong>15°</strong>, <strong>sans frottement</strong>. Deux <strong>barrières lumineuses</strong> E et F, distantes de 1,00{NB}m, mesurent la vitesse. Forces : le <strong>poids</strong> <strong>P</strong> et la <strong>réaction</strong> <strong>R</strong> du support.</>,
      tache: { type: 'action', ok: estP({ alpha: 15, f: 0 }), label: 'Passer au plan incliné', faire: () => fixP({ alpha: 15, f: 0 }), consigne: 'Plan incliné de 15°, sans frottement' } },
    { id: 'reaction', titre: 'La réaction du support', focus: ['scene'],
      texte: <>Le mobile glisse le long du plan. La réaction <strong>R</strong> est perpendiculaire au plan.</>,
      tache: { type: 'qcm', q: 'Le travail de la réaction R du support entre E et F est…', options: ['nul, car R est perpendiculaire au déplacement', 'positif, car R pousse le mobile', 'négatif, car R freine le mobile'], bonne: 0,
        expl: 'R est perpendiculaire au déplacement (θ = 90°, cos θ = 0) : son travail est nul. Seul le poids travaille ici (pas de frottement).', indice: 'Quel est l’angle entre R et le déplacement ? Que vaut cos 90° ?' } },
    { id: 'poids', titre: 'Le travail du poids', focus: ['mesures'],
      retenirTitre: 'À RETENIR : LE TRAVAIL DU POIDS',
      retenir: <><SchemaPoids/>{puces(<>Pour un déplacement de E à F : <strong>W(P) = m·g·(z<sub>E</sub> − z<sub>F</sub>)</strong> ; il ne dépend <strong>que de la différence d’altitude</strong>, pas du trajet.</>, <>Descente (z<sub>E</sub> &gt; z<sub>F</sub>) : W(P) &gt; 0 ; montée : W(P) &lt; 0 ; même niveau : W(P) = 0.</>, <>Exemple : 0,200 kg qui descend de 0,259 m ⇒ W(P) = 0,200 × 9,8 × 0,259 ≈ 0,51 J.</>, <><strong>Piège</strong> : on utilise le <strong>dénivelé</strong>, pas la longueur du trajet.</>)}</>,
      texte: <>Le <strong>travail du poids</strong> entre E et F vaut <strong>W(P) = m·g·(z<sub>E</sub> − z<sub>F</sub>)</strong>, avec <em>g</em> = 9,8{NB}N/kg. Le dénivelé z<sub>E</sub> − z<sub>F</sub> est donné dans « Mesures ».</>,
      tache: { type: 'num', q: 'Travail W(P) du poids entre E et F', unite: 'J', vrai: WP, tol: 0.03, affiche: v => nbf(v, 2), cs: 2,
        bloque: bloqueSi(estP({ alpha: 15, f: 0 }), 'Revenez d’abord au plan incliné de 15° sans frottement (bouton « Rétablir »).'),
        calcul: () => [`m = 0,200 kg ; g = 9,8 N/kg ; z_E − z_F = ${nbf(hPlan, 3)} m.`, `W(P) = 0,200 × 9,8 × ${nbf(hPlan, 3)} = ${nbf(WP, 2)} J.`],
        pieges: [[M_PLAN * hPlan, 'Vous avez oublié g (le poids est P = m g).'], [M_PLAN * M.G * L_EF, 'Vous avez pris la longueur du trajet (1,00 m) : il faut le dénivelé z_E − z_F.']],
        expl: `W(P) = m g (z_E − z_F) ≈ ${nbf(WP, 2)} J.`, indice: 'W(P) = m × g × (z_E − z_F), avec m en kg et le dénivelé en m.' } },
    { id: 'chemin', titre: 'Un autre trajet', focus: ['scene'],
      texte: <>Imaginez maintenant que le mobile descende de E à F par un trajet courbe et plus long, mais entre les mêmes altitudes.</>,
      tache: { type: 'qcm', q: 'Le travail du poids est…', options: ['le même : il ne dépend que de la différence d’altitude', 'plus grand, car le trajet est plus long', 'plus petit, car le trajet est courbe'], bonne: 0,
        expl: 'Le travail du poids ne dépend pas du chemin suivi, seulement de z_E − z_F. C’est un cas particulier : le travail du frottement, lui, dépend du chemin.', indice: 'Dans W(P) = m g (z_E − z_F), la longueur du trajet apparaît-elle ?' } },
    { id: 'barriere', titre: 'Mesurer une vitesse', focus: ['scene', 'mesures'],
      texte: <>Une languette de largeur <em>ℓ</em> = 1,0{NB}cm, fixée sur le mobile, coupe le faisceau de chaque barrière pendant la durée <em>Δt</em>. Pendant ce temps, le mobile avance de <em>ℓ</em> : <strong>v = ℓ / Δt</strong>. Lancez le mobile et lisez <em>Δt</em><sub>F</sub> dans « Mesures ».</>,
      tache: { type: 'num', q: 'Vitesse v_F du mobile en F', unite: 'm/s', vrai: vF0, tol: 0.02, affiche: v => nbf(v, 2), cs: 3,
        bloque: bloqueSi(estP({ alpha: 15, f: 0 }), 'Revenez d’abord au plan incliné de 15° sans frottement (bouton « Rétablir »).'),
        calcul: () => ['Hypothèse : la vitesse moyenne sur 1 cm est proche de la vitesse au niveau de la barrière.', `ℓ = 1,0 cm = 0,010 m ; Δt_F = ${nbf(dtF0, 2)} ms = ${nbf(dtF0 * 1e-3, 5)} s.`, `v_F = 0,010 / ${nbf(dtF0 * 1e-3, 5)} = ${nbf(vF0, 2)} m/s.`],
        pieges: [[0.01 / dtF0, 'La durée doit être en secondes (1 ms = 10⁻³ s).'], [1 / (dtF0 * 1e-3), 'La largeur doit être en mètres (1,0 cm = 0,010 m).']],
        expl: `v_F = ℓ / Δt_F ≈ ${nbf(vF0, 2)} m/s.`, indice: 'v = ℓ ÷ Δt, avec ℓ en m et Δt en s (1 cm = 0,01 m ; 1 ms = 0,001 s).' } },
    { id: 'ecplan', titre: 'La variation d’énergie cinétique', focus: ['mesures'],
      texte: <>En E, la même méthode donne <em>v</em><sub>E</sub> = {nbf(vE0a, 2)}{NB}m/s ; en F, <em>v</em><sub>F</sub> = {nbf(vF0a, 2)}{NB}m/s. Calculez <strong>ΔE<sub>c</sub> = <Ind b="E" i="c"/>(F) − <Ind b="E" i="c"/>(E)</strong> pour <em>m</em> = 0,200{NB}kg.</>,
      tache: { type: 'num', q: 'Variation d’énergie cinétique ΔE_c entre E et F', unite: 'J', vrai: dEc0, tol: 0.03, affiche: v => nbf(v, 2), cs: 2,
        bloque: bloqueSi(estP({ alpha: 15, f: 0 }), 'Revenez d’abord au plan incliné de 15° sans frottement (bouton « Rétablir »).'),
        calcul: () => [`E_c(E) = ½ × 0,200 × ${nbf(vE0a, 2)}² = ${nbf(M.ecin(M_PLAN, vE0a), 3)} J ; E_c(F) = ½ × 0,200 × ${nbf(vF0a, 2)}² = ${nbf(M.ecin(M_PLAN, vF0a), 3)} J.`, `ΔE_c = ${nbf(M.ecin(M_PLAN, vF0a), 3)} − ${nbf(M.ecin(M_PLAN, vE0a), 3)} = ${nbf(dEc0, 2)} J.`],
        pieges: [[M.ecin(M_PLAN, vF0a - vE0a), 'On retranche les énergies, pas les vitesses : E_c(F) − E_c(E) ≠ ½ m (v_F − v_E)².'], [M.ecin(M_PLAN, vF0a), 'Vous avez donné E_c(F) seulement : il faut retrancher E_c(E) (le mobile n’est pas lâché en E).']],
        expl: `ΔE_c ≈ ${nbf(dEc0, 2)} J.`, indice: 'Calculez E_c(E) et E_c(F) séparément avec ½ m v², puis faites la différence.' } },
    { id: 'theoreme', titre: 'Comparer à ΣW', focus: ['mesures'],
      retenirTitre: 'À RETENIR : LE THÉORÈME DE L’ÉNERGIE CINÉTIQUE',
      retenir: <><SchemaTheoreme/>{FTheo}{puces(<>Entre deux positions, la <strong>variation d’énergie cinétique</strong> est égale à la <strong>somme des travaux de toutes les forces</strong> qui s’exercent sur le système.</>, <>Ici (sans frottement) : ΔE<sub>c</sub> = W(P) + W(R) = W(P) + 0.</>, <>Méthode en 5 gestes : choisir les deux positions, faire le bilan des forces, écrire chaque travail, appliquer ΔE<sub>c</sub> = ΣW, résoudre.</>, <>Un petit écart entre ΔE<sub>c</sub> et ΣW vient des mesures (v = ℓ/Δt, arrondis), pas d’une force oubliée, tant que ΣW est complet.</>)}</>,
      texte: <>Vous avez trouvé ΔE<sub>c</sub> ≈ {nbf(dEc0, 2)}{NB}J et W(P) ≈ {nbf(WP, 2)}{NB}J. La réaction travaille 0 J.</>,
      tache: { type: 'qcm', q: 'Que peut-on conclure ?', options: ['ΔE_c = W(P) + W(R) : la variation d’énergie cinétique est égale à la somme des travaux des forces', 'ΔE_c = W(P) seulement par hasard', 'l’énergie cinétique ne dépend pas des forces'], bonne: 0,
        expl: 'C’est le théorème de l’énergie cinétique : ΔE_c = ΣW. Le léger écart éventuel vient des mesures (ℓ/Δt, arrondis).', indice: 'Comparez ΔE_c et W(P) : sont-ils égaux, aux arrondis près ?' } },
    { id: 'frott', titre: 'Ajoutons un frottement', focus: ['scene', 'mesures'],
      texte: <>Le plan n’est plus parfaitement lisse : une force de <strong>frottement</strong> <strong>f</strong> = 0,20{NB}N, d’intensité constante, s’oppose au mouvement. Activez-la et lancez le mobile : les durées <em>Δt</em> changent.</>,
      tache: { type: 'action', ok: estP({ alpha: 15, f: 0.2 }), label: 'Activer le frottement', faire: () => fixP({ alpha: 15, f: 0.2 }), consigne: 'Plan de 15° avec un frottement de 0,20 N' } },
    { id: 'wf', titre: 'Le travail du frottement', focus: ['mesures'],
      retenirTitre: 'À RETENIR : LE FROTTEMENT',
      retenir: <><SchemaFrott/>{puces(<>Une force de frottement d’intensité constante, opposée au mouvement, sur une trajectoire rectiligne : <strong>W(f) = − f × L</strong> (toujours négatif).</>, <>Il <strong>retire</strong> de l’énergie cinétique ; contrairement au poids, son travail <strong>dépend du chemin</strong> parcouru.</>, <>Exemple : f = 0,20 N sur L = 1,00 m ⇒ W(f) = − 0,20 J.</>)}</>,
      texte: <>La force de frottement est de même direction que le déplacement mais de sens opposé : <strong>W(f) = − f × L</strong> (L = EF = 1,00{NB}m).</>,
      tache: { type: 'num', q: 'Travail W(f) du frottement entre E et F', unite: 'J', vrai: -0.2, tol: 0.02, affiche: v => nbf(v, 2), cs: 2,
        bloque: bloqueSi(estP({ alpha: 15, f: 0.2 }), 'Activez d’abord le frottement (étape précédente).'),
        calcul: () => ['W(f) = − f × L = − 0,20 × 1,00 = − 0,20 J.'],
        pieges: [[0.2, 'Le signe : le frottement s’oppose au mouvement, son travail est négatif.']],
        expl: 'W(f) = − 0,20 J.', indice: 'W(f) = − f × L, avec f en N et L en m.' } },
    { id: 'bilan', titre: 'Le bilan avec frottement', focus: ['mesures'],
      texte: <>Avec frottement, on mesure <em>v</em><sub>E</sub> = {nbf(vE1a, 2)}{NB}m/s et <em>v</em><sub>F</sub> = {nbf(vF1a, 2)}{NB}m/s. Calculez la nouvelle variation d’énergie cinétique ΔE<sub>c</sub> entre E et F.</>,
      tache: { type: 'num', q: 'Variation d’énergie cinétique ΔE_c entre E et F (avec frottement)', unite: 'J', vrai: dEc1, tol: 0.03, affiche: v => nbf(v, 2), cs: 2,
        bloque: bloqueSi(estP({ alpha: 15, f: 0.2 }), 'Activez d’abord le frottement avec le bouton « Rétablir ».'),
        calcul: () => [`E_c(E) = ½ × 0,200 × ${nbf(vE1a, 2)}² = ${nbf(M.ecin(M_PLAN, vE1a), 3)} J ; E_c(F) = ½ × 0,200 × ${nbf(vF1a, 2)}² = ${nbf(M.ecin(M_PLAN, vF1a), 3)} J.`, `ΔE_c = ${nbf(dEc1, 2)} J.`],
        pieges: [[dEc0, 'Cette valeur est celle sans frottement : utilisez les nouvelles vitesses.']],
        expl: `ΔE_c ≈ ${nbf(dEc1, 2)} J.`, indice: 'ΔE_c = ½ m v_F² − ½ m v_E², avec les nouvelles vitesses.' } },
    { id: 'verif', titre: 'Le théorème est-il vérifié ?', focus: ['mesures'],
      texte: <>Sans frottement, ΔE<sub>c</sub> ≈ {nbf(dEc0, 2)}{NB}J. Avec frottement, ΔE<sub>c</sub> ≈ {nbf(dEc1, 2)}{NB}J, W(P) ≈ {nbf(WP, 2)}{NB}J et W(f) = − 0,20{NB}J.</>,
      tache: { type: 'num', q: 'Somme des travaux ΣW = W(P) + W(R) + W(f)', unite: 'J', vrai: WP - 0.2, tol: 0.04, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => [`ΣW = W(P) + W(R) + W(f) = ${nbf(WP, 2)} + 0 + (− 0,20) = ${nbf(WP - 0.2, 2)} J.`, `On retrouve ΔE_c ≈ ${nbf(dEc1, 2)} J : le théorème de l’énergie cinétique est vérifié.`],
        pieges: [[WP + 0.2, 'Le travail du frottement est négatif : il se retranche.']],
        expl: `ΣW ≈ ${nbf(WP - 0.2, 2)} J, égale à ΔE_c ≈ ${nbf(dEc1, 2)} J : le théorème est vérifié, y compris avec frottement.`, indice: 'Additionnez les travaux en gardant leur signe : W(P) positif, W(f) négatif, W(R) nul.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenirTitre: 'À RETENIR : LE BILAN',
      retenir: <>{FTheo}{puces(<><strong>Énergie cinétique</strong> : E<sub>c</sub> = ½ m v² ; vitesse × 2 ⇒ E<sub>c</sub> × 4.</>, <><strong>Travail</strong> d’une force constante : W = F·AB·cos θ ; positif, nul ou négatif selon l’angle.</>, <><strong>Poids</strong> : W(P) = m g (z<sub>E</sub> − z<sub>F</sub>), indépendant du trajet ; <strong>frottement</strong> : W(f) = − f L.</>, <><strong>Théorème</strong> : ΔE<sub>c</sub> = ΣW (toutes les forces).</>)}</>,
      texte: <>Vous savez calculer l’énergie cinétique, le travail d’une force constante (poids, frottement) et appliquer le théorème de l’énergie cinétique. Essayez maintenant l’exploration, puis les défis.</>, tache: null },
  ];
  const IDS = ETAPES.map(e => e.id), idE = ETAPES[Math.min(etape, ETAPES.length - 1)].id;
  const apres = id => !enGuide || etape > IDS.indexOf(id), depuis = id => !enGuide || etape >= IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const etapeTire = enGuide && IDS.indexOf(idE) <= IDS.indexOf('cos'), etapePlan = enGuide && !etapeTire;
  const sceneGuide = etapeTire ? 'tire' : 'plan';
  const sceneAff = enGuide ? sceneGuide : sceneEff;

  const rendreBase = () => {
    if (idE === 'wmot' || idE === 'dec') fixT({ F: 10, theta: 0, vA: 0 });
    else if (idE === 'resistw') fixT({ F: 5, theta: 180, vA: 4 });
    else if (idE === 'cos') fixT({ F: 10, theta: 60, vA: 0 });
    else if (['poids', 'barriere', 'ecplan'].includes(idE)) fixP({ alpha: 15, f: 0 });
    else if (['wf', 'bilan'].includes(idE)) fixP({ alpha: 15, f: 0.2 });
  };
  const aRetablir = enGuide && ['wmot', 'dec', 'resistw', 'cos', 'poids', 'barriere', 'ecplan', 'wf', 'bilan'].includes(idE);
  const cibleOk = { wmot: est({ F: 10, theta: 0, vA: 0 }), dec: est({ F: 10, theta: 0, vA: 0 }), resistw: est({ F: 5, theta: 180, vA: 4 }), cos: est({ F: 10, theta: 60, vA: 0 }),
    poids: estP({ alpha: 15, f: 0 }), barriere: estP({ alpha: 15, f: 0 }), ecplan: estP({ alpha: 15, f: 0 }), wf: estP({ alpha: 15, f: 0.2 }), bilan: estP({ alpha: 15, f: 0.2 }) }[idE];
  const lienBase = aRetablir && !cibleOk && <button onClick={rendreBase} style={{ ...styleBouton(true, '#b45309'), marginBottom: 8 }}>Rétablir la situation de l’étape</button>;

  // ════════════════ DÉFIS ════════════════
  const nouveauFrott = () => { const alpha = tire([10, 12, 15, 18, 20]), m = tire([0.15, 0.2, 0.25, 0.3]), f = tire([0.1, 0.15, 0.2, 0.25, 0.3, 0.35]);
    return { type: 'frott', p: { alpha, m, f }, vrai: f, reps: {}, verifie: false }; };
  const nouvelArret = () => { const m = tire([1.5, 2, 2.5, 3]), vA = tire([3, 4, 5]), F = tire([4, 5, 6, 8]);
    return { type: 'arret', p: { m, F, theta: 180, AB: 6, vA }, vrai: M.ecin(m, vA) / F, reps: {}, verifie: false }; };
  const nouveauDefi = t => { setDefi(t === 'frott' ? nouveauFrott() : nouvelArret()); lecT.setPos(0); lecP.setPos(0); };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const x = lireNombre(defi.reps.r), tol = defi.type === 'frott' ? Math.max(0.07, 0.012 / defi.vrai) : 0.04;
    const ok = isFinite(x) && proche(x, defi.vrai, tol);
    setDefi(d => ({ ...d, verifie: true, ok }));
    (defi.type === 'frott' ? noterFrott : noterArret)(ok);
  };
  const champ = (unite, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.r ?? ''} aria-label={label} onKeyDown={e => e.key === 'Enter' && document.getElementById('tr-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { r: e.target.value }, verifie: false }))}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['frott', 'Force de frottement'], ['arret', 'Distance d’arrêt']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'frott' ? 'Défi : quelle est l’intensité de la force de frottement ?' : 'Défi : sur quelle distance le chariot s’arrête-t-il ?'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'frott' && <>Un mobile de masse <em>m</em> = {nbf(defi.p.m * 1000, 0)}{NB}g glisse sur un plan incliné de {nbf(defi.p.alpha, 0)}° ; on ignore l’intensité de la force de frottement <em>f</em> (constante). Les barrières E et F sont distantes de L = 1,00{NB}m. Lancez le mobile, lisez les durées d’obturation (languette de 1,0{NB}cm), calculez les vitesses puis ΔE<sub>c</sub>, et déduisez <em>f</em> avec le théorème de l’énergie cinétique. Donnez <em>f</em> avec 2 chiffres significatifs.</>}
        {defi.type === 'arret' && <>Un chariot de masse <em>m</em> = {nbf(defi.p.m, 1)}{NB}kg part de A à <em>v</em><sub>A</sub> = {nbf(defi.p.vA, 1)}{NB}m/s. Une force constante <em>F</em> = {nbf(defi.p.F, 0)}{NB}N s’oppose au mouvement (θ = 180°). Quelle distance parcourt-il avant de s’arrêter ? Donnez le résultat avec 2 chiffres significatifs.</>}
      </div>
      {defi.type === 'frott' && champ('N', 'Force de frottement f')}
      {defi.type === 'arret' && champ('m', 'Distance d’arrêt d')}
      {defi.type === 'frott' && <IndiceDefi cache={false}>ΔE<sub>c</sub> = W(P) + W(f) avec W(P) = m g L sin α (le dénivelé est L sin α) et W(f) = − f L ; donc f = (m g L sin α − ΔE<sub>c</sub>) / L. Vitesses : v = ℓ / Δt (ℓ = 0,010 m, Δt en s).</IndiceDefi>}
      {defi.type === 'arret' && <IndiceDefi cache={false}>Théorème de l’énergie cinétique : ΔE<sub>c</sub> = E<sub>c</sub>(arrêt) − E<sub>c</sub>(A) = − ½ m v<sub>A</sub>² = W = − F × d. Donc d = ½ m v<sub>A</sub>² ÷ F.</IndiceDefi>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="tr-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? `✓ Correct. Valeur de la simulation : ${nbf(defi.vrai, defi.type === 'frott' ? 2 : 2)}${NB}${defi.type === 'frott' ? 'N' : 'm'}.`
          : defi.type === 'frott' ? '✗ Vérifiez : v = ℓ / Δt avec ℓ = 0,010 m et Δt en secondes ; ΔE_c = E_c(F) − E_c(E) ; W(P) = m g L sin α ; f = (W(P) − ΔE_c) / L ; m en kg.'
            : '✗ Vérifiez : le chariot s’arrête quand E_c = 0 ; ΔE_c = − ½ m v_A² ; W = − F × d ; d = ½ m v_A² / F.'}
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Point matériel</strong> : le chariot et le mobile sont modélisés par un point (translation, pas de rotation des roues ni du mobile).</li>
      <li><strong>Forces constantes</strong> : F, le poids et le frottement f ont une intensité constante ; le travail se calcule par W = F·AB·cos θ sur une trajectoire rectiligne.</li>
      <li><strong>Plan incliné</strong> : mobile lâché sans vitesse ; accélération constante a = g sin α − f/m ; g = 9,8 N/kg ; frottement de norme constante et opposé au mouvement (c’est un modèle ; un frottement réel peut dépendre de la vitesse). Sans soufflerie un vrai mobile frotte toujours un peu.</li>
      <li><strong>Barrière lumineuse</strong> : v = ℓ / Δt est la vitesse <em>moyenne</em> sur la largeur ℓ = 1,0 cm de la languette, supposée égale à la vitesse au niveau de la barrière ; l’écart est inférieur à 0,1 % ici, mais il augmenterait avec une languette plus large.</li>
      <li><strong>Chiffres significatifs</strong> : les durées Δt sont affichées au centième de milliseconde ; les résultats sont arrondis à 2 ou 3 chiffres significatifs. Un petit écart entre ΔE<sub>c</sub> et ΣW est donc normal.</li>
      <li><strong>Défi</strong> : l’incertitude sur f vient surtout de la différence W(P) − ΔE<sub>c</sub> (deux nombres proches) ; la tolérance en tient compte.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES ET MESURES ════════════════
  const aff = enGuide ? { force: depuis('moteur') || !etapeTire, forcesPlan: depuis('plan') } : { force: true, forcesPlan: true };
  const boutonsLecture = (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
      <button onClick={lec.lancer} style={styleBouton(true, '#15803d')}><Pic n="play"/>Lancer</button>
      <input type="range" min="0" max="1" step="0.01" value={lec.pos} aria-label="Position du mobile" onChange={e => { lec.arreter(); lec.setPos(parseFloat(e.target.value)); }} style={{ flex: 1, minWidth: 120, minHeight: 32 }}/>
    </div>);
  const zoneScene = sceneAff === 'tire'
    ? <div><SceneTire p={enGuide || scene === 'tire' ? (enDefi ? tpEff : tp) : tp} pos={lecT.pos} force={aff.force}/>{boutonsLecture}</div>
    : <div><ScenePlan alpha={plEff.alpha} pos={lecP.pos} a={MP.a} flechesPRF={aff.forcesPlan} f={plEff.f} m={plEff.m}/>{boutonsLecture}</div>;
  const sceneBox = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {mode === 'explore' && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['tire', 'Chariot tiré par une force'], ['plan', 'Plan incliné et barrières']].map(([k, l]) => <button key={k} onClick={() => setScene(k)} aria-pressed={scene === k} style={stylePetitBouton(scene === k, '#0e7490')}>{l}</button>)}</div>}
      {lienBase}{zoneScene}
    </div>);

  const reglages = mode === 'explore' && (sceneAff === 'tire' ? (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Curseur nom="Masse m" valeur={tp.m} onChange={v => setTp(t => ({ ...t, m: v }))} min={0.5} max={5} pas={0.5} unite="kg" decimales={1} couleur="#475569"/>
      <Curseur nom="Vitesse initiale vA" valeur={tp.vA} onChange={v => setTp(t => ({ ...t, vA: v }))} min={0} max={6} pas={0.5} unite="m/s" decimales={1} couleur="#16a34a"/>
      <Curseur nom="Force F" valeur={tp.F} onChange={v => setTp(t => ({ ...t, F: v }))} min={0} max={20} pas={1} unite="N" decimales={0} couleur="#dc2626"/>
      <Curseur nom="Angle θ entre F et le déplacement" valeur={tp.theta} onChange={v => setTp(t => ({ ...t, theta: v }))} min={0} max={180} pas={5} unite="°" decimales={0} couleur="#dc2626"/>
      <Curseur nom="Distance AB" valeur={tp.AB} onChange={v => setTp(t => ({ ...t, AB: v }))} min={0.5} max={5} pas={0.5} unite="m" decimales={1} couleur="#b45309"/>
    </div>) : (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Curseur nom="Angle α du plan" valeur={pl.alpha} onChange={v => setPl(p => ({ ...p, alpha: v }))} min={5} max={30} pas={1} unite="°" decimales={0} couleur="#475569"/>
      <Curseur nom="Masse m du mobile" valeur={pl.m} onChange={v => setPl(p => ({ ...p, m: v }))} min={0.1} max={0.5} pas={0.05} unite="kg" decimales={2} couleur="#475569"/>
      <Curseur nom="Frottement f" valeur={pl.f} onChange={v => setPl(p => ({ ...p, f: v }))} min={0} max={0.5} pas={0.05} unite="N" decimales={2} couleur="#c2410c"/>
    </div>));

  const mesures = sceneAff === 'tire' ? (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Masse m" valeur={`${nbf(tpEff.m, 1)}${NB}kg`}/>
      <LigneMesure nom="Vitesse en A, vA" valeur={`${nbf(tpEff.vA, 1)}${NB}m/s`}/>
      {depuis('moteur') && <LigneMesure nom="Force F" valeur={`${nbf(tpEff.F, 0)}${NB}N`} couleur="#dc2626"/>}
      {depuis('moteur') && <LigneMesure nom="Angle θ (F, déplacement)" valeur={`${nbf(tpEff.theta, 0)}${NB}°`}/>}
      {depuis('moteur') && <LigneMesure nom="Distance AB" valeur={`${nbf(tpEff.AB, 1)}${NB}m`}/>}
      {depuis('dec') && <LigneMesure nom="Vitesse en B, vB" valeur={C.arrete ? `0${NB}m/s (arrêt avant B)` : `${nbf(C.vB, 2)}${NB}m/s`} couleur="#15803d"/>}
      {mode === 'explore' && <><LigneMesure nom="Travail W de la force" valeur={`${nbf(C.W, 1)}${NB}J`} couleur="#b45309"/>
        <LigneMesure nom="E_c(A)" valeur={`${nbf(C.EcA, 1)}${NB}J`}/><LigneMesure nom="E_c(B)" valeur={`${nbf(C.EcB, 1)}${NB}J`}/>
        <LigneMesure nom="ΔE_c = E_c(B) − E_c(A)" valeur={`${nbf(C.dEc, 1)}${NB}J`} couleur="#15803d"/></>}
    </div>
  ) : (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Masse m du mobile" valeur={`${nbf(plEff.m * 1000, 0)}${NB}g`}/>
      <LigneMesure nom="Angle α du plan" valeur={`${nbf(plEff.alpha, 0)}${NB}°`}/>
      <LigneMesure nom="Distance EF" valeur={`1,00${NB}m`}/>
      {depuis('poids') && <LigneMesure nom="Dénivelé z_E − z_F" valeur={`${nbf(MP.h, 3)}${NB}m`}/>}
      {(enDefi || depuis('barriere')) && <LigneMesure nom="Largeur ℓ de la languette" valeur={`1,0${NB}cm`}/>}
      {(enDefi || depuis('barriere')) && <LigneMesure nom="Durée Δt_E" valeur={`${nbf(MP.dtE * 1e3, 2)}${NB}ms`} couleur="#c2410c"/>}
      {(enDefi || depuis('barriere')) && <LigneMesure nom="Durée Δt_F" valeur={`${nbf(MP.dtF * 1e3, 2)}${NB}ms`} couleur="#c2410c"/>}
      {(mode === 'explore' || apres('barriere')) && !enDefi && <LigneMesure nom="Vitesse v_F = ℓ / Δt_F" valeur={`${nbf(MP.vFmes, 2)}${NB}m/s`} couleur="#15803d"/>}
      {(mode === 'explore' || depuis('ecplan')) && !enDefi && <LigneMesure nom="Vitesse v_E = ℓ / Δt_E" valeur={`${nbf(MP.vEmes, 2)}${NB}m/s`} couleur="#15803d"/>}
      {(mode === 'explore' || apres('poids')) && !enDefi && <LigneMesure nom="Travail du poids W(P)" valeur={`${nbf(MP.Wp, 2)}${NB}J`} couleur="#b45309"/>}
      {(mode === 'explore' || (plEff.f === 0 ? apres('ecplan') : apres('bilan'))) && !enDefi && <LigneMesure nom="ΔE_c = E_c(F) − E_c(E)" valeur={`${nbf(MP.dEcMes, 2)}${NB}J`} couleur="#15803d"/>}
      {(mode === 'explore' || (plEff.f > 0 && apres('wf'))) && !enDefi && plEff.f > 0 && <LigneMesure nom="Travail du frottement W(f)" valeur={`${nbf(MP.Wf, 2)}${NB}J`} couleur="#c2410c"/>}
      {(mode === 'explore' || apres('verif')) && !enDefi && <LigneMesure nom="Σ W = W(P) + W(R) + W(f)" valeur={`${nbf(MP.sommeW, 2)}${NB}J`} couleur="#b45309"/>}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Chariot : doublez la vitesse initiale avec F = 0. Que devient E<sub>c</sub> ? Et si vous doublez la masse ?</li>
        <li>Chariot : gardez F et AB, faites varier θ de 0° à 180°. Pour quel angle le travail est-il nul ? Négatif ?</li>
        <li>Chariot : réglez θ = 180° et F pour que le chariot s’arrête juste en B. Quelle relation avez-vous trouvée entre F, AB et E<sub>c</sub>(A) ?</li>
        <li>Plan : augmentez α. Le travail du poids augmente-t-il ? Pourquoi ? Comparez ΔE<sub>c</sub> et ΣW.</li>
        <li>Plan : cherchez f pour que le mobile ne descende plus (« reste bloqué »). Que valent alors W(P) et W(f) ?</li>
        <li>Plan : ΔE<sub>c</sub> et ΣW sont-ils exactement égaux ? D’où peut venir le petit écart ? (voir les hypothèses)</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>énergie cinétique : E<sub>c</sub> = ½ m v² (vitesse × 2 ⇒ E<sub>c</sub> × 4)</li>
        <li>travail d’une force constante : W = F · AB · cos θ ; poids : W(P) = m g (z<sub>E</sub> − z<sub>F</sub>) ; frottement : W(f) = − f L</li>
        <li>théorème de l’énergie cinétique : ΔE<sub>c</sub> = ΣW (toutes les forces)</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .tr-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .tr-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .tr-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .tr-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .tr-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .tr-l1.cote .tr-carte { order: 2; } .tr-l1.cote .tr-main { order: 1; } }
        @media (max-width: 900px) { .tr-l1.cote, .tr-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Travail d’une force et énergie cinétique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une force qui travaille <strong>transfère de l’énergie</strong> : le <strong>théorème de l’énergie cinétique</strong> relie la variation d’énergie cinétique d’un système à la somme des travaux des forces qu’il subit.</div>
      <div className={`tr-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="tr-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="tr-carte">{panneauHypo}</div> : null}
        <div className="tr-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'frott' ? suiviFrott : suiviArret}/></div>}
          <div className={`tr-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {sceneBox}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{reglages}{mesures}</div>
          </div>
        </div>
      </div>
      {(mode === 'explore' || (enGuide && etape >= ETAPES.length - 1)) && <div className="tr-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="tr-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
