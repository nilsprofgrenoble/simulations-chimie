import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef, useMemo } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";

const SIM_ID = 46;
declarerDefis(SIM_ID, [['principal', 'Mesurer un champ avec la boussole']]);

// ====================================================
//  SIM 46 — BOUSSOLE ET CHAMP MAGNÉTIQUE : direction, sens, intensité ; addition des champs ; ordres de grandeur
// ====================================================

const B_T = 50e-6;                       // champ terrestre : 50 µT (valeur du cours), dirigé vers le nord
const R_REF = 0.03, B_REF = 20e-3;       // aimant : 20 mT sur son axe à 3 cm de son centre
const K = B_REF * R_REF ** 3 / 2;        // dipôle : B_axe = 2K / r³
const PX = 1000;                         // pixels par mètre dans la scène
const nbf = (v, d) => v.toFixed(d).replace('.', ',');
const fn = v => nbf(v, v >= 100 ? 0 : v >= 10 ? 1 : 2);
const fB = T => T < 1e-3 ? `${fn(T * 1e6)}${NB}µT` : T < 1 ? `${fn(T * 1e3)}${NB}mT` : `${fn(T)}${NB}T`;
const deg = r => r * 180 / Math.PI;
const mod = (a, m) => ((a % m) + m) % m;
const ecart = (a, b) => mod(a - b + 180, 360) - 180;
const Baxe = r => 2 * K / r ** 3;

// Champ en un point (x vers l'est, y vers le nord, en m) : Terre + aimant (dipôle) ; thetaM = direction du pôle N de l'aimant (° depuis le nord, sens horaire)
function champs(x, y, aimant, thetaM, terre = true) {
  const Bt = terre ? [0, B_T] : [0, 0];
  let Ba = [0, 0];
  if (aimant) {
    const r = Math.max(Math.hypot(x, y), 0.03), ux = x / r, uy = y / r;
    const mx = Math.sin(thetaM * Math.PI / 180), my = Math.cos(thetaM * Math.PI / 180);
    const md = mx * ux + my * uy, c = K / r ** 3;
    Ba = [c * (3 * md * ux - mx), c * (3 * md * uy - my)];
  }
  const B = [Bt[0] + Ba[0], Bt[1] + Ba[1]];
  return { Bt, Ba, B, nBa: Math.hypot(Ba[0], Ba[1]), nB: Math.hypot(B[0], B[1]), ang: deg(Math.atan2(B[0], B[1])) };
}

// Lignes de champ (intégration pas à pas dans la direction du champ). Partent du pôle N de l'aimant, et du bas de la scène pour la Terre.
function lignesDeChamp(aimant, thetaM, terre) {
  const L = [], H = 0.005, XM = 0.30, YM = 0.20;
  const suit = (x0, y0) => {
    const pts = [[x0, y0]]; let x = x0, y = y0, sorti = false;
    for (let i = 0; i < 700; i++) {
      const f1 = champs(x, y, aimant, thetaM, terre); if (f1.nB === 0) break;
      const mx = x + H / 2 * f1.B[0] / f1.nB, my = y + H / 2 * f1.B[1] / f1.nB;
      const f2 = champs(mx, my, aimant, thetaM, terre); if (f2.nB === 0) break;
      x += H * f2.B[0] / f2.nB; y += H * f2.B[1] / f2.nB;
      const r = Math.hypot(x, y);
      if (Math.abs(x) > XM || Math.abs(y) > YM) { pts.push([x, y]); break; }
      if (aimant && r < 0.034 && i > 3) { pts.push([x, y]); break; }
      if (r > 0.04) sorti = true;
      pts.push([x, y]);
    }
    return pts;
  };
  if (aimant) {
    for (let k = 0; k < 28; k++) {
      const a = k / 28 * 2 * Math.PI, x = 0.036 * Math.cos(a), y = 0.036 * Math.sin(a);
      const f = champs(x, y, aimant, thetaM, terre);
      if (f.B[0] * x + f.B[1] * y > 0) L.push(suit(x, y));      // lignes qui sortent de l'aimant
    }
  }
  if (terre) for (let x = -0.28; x <= 0.2801; x += 0.04) L.push(suit(x, -YM + 0.002));
  return L;
}

// ---------- Addition vectorielle ----------
function Addition({ ch }) {
  const m = Math.max(B_T, ch.nBa, ch.nB), s = 90 / m, c = 120, d = 150;
  const P = v => [c + v[0] * s, d - v[1] * s];
  const t = P(ch.Bt), a = P(ch.Ba), b = P(ch.B);
  const fl = (p, col, id) => <line x1={c} y1={d} x2={p[0]} y2={p[1]} stroke={col} strokeWidth="4" strokeLinecap="round" markerEnd={`url(#${id})`}/>;
  const mk = (id, col) => <marker id={id} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse"><path d="M0,0 L6,3 L0,6 z" fill={col}/></marker>;
  return (
    <svg viewBox="0 0 280 190" style={{ width: '100%', maxWidth: 360, display: 'block', margin: '0 auto' }} role="img" aria-label="Addition vectorielle du champ de la Terre et du champ de l’aimant">
      <defs>{mk('mt', '#2563eb')}{mk('ma', '#dc2626')}{mk('mb', '#16a34a')}</defs>
      <circle cx={c} cy={d} r="3" fill="#0f172a"/>
      {ch.nBa > 0 && <><line x1={t[0]} y1={t[1]} x2={b[0]} y2={b[1]} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 3"/>
        <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4 3"/></>}
      {fl(t, '#2563eb', 'mt')}{ch.nBa > 0 && fl(a, '#dc2626', 'ma')}{fl(b, '#16a34a', 'mb')}
      <text x="8" y="16" fontSize="12" fontWeight="700" fill="#2563eb">champ de la Terre</text>
      <text x="8" y="31" fontSize="12" fontWeight="700" fill="#dc2626">champ de l’aimant</text>
      <text x="8" y="46" fontSize="12" fontWeight="700" fill="#16a34a">champ total = somme</text>
      <text x="270" y="16" textAnchor="end" fontSize="11" fill="#64748b">nord ↑</text>
    </svg>);
}

// ---------- Échelle logarithmique des champs ----------
const SUP = { '-6': '⁻⁶', '-5': '⁻⁵', '-4': '⁻⁴', '-3': '⁻³', '-2': '⁻²', '-1': '⁻¹', '0': '⁰', '1': '¹', '2': '²', '3': '³' };
function Echelle({ nB }) {
  const W = 620, H = 170, ml = 20, mr = 20, lo = -6, hi = 3;
  const X = T => ml + (Math.log10(T) - lo) / (hi - lo) * (W - ml - mr);
  const pts = [[B_T, 'Terre', '50 µT', 0], [20e-3, 'aimant droit', '20 mT', 1], [1, 'électroaimant', '1 à 10 T', 0], [100, 'record', '100 T', 1]];
  const dec = []; for (let e = lo; e <= hi; e++) dec.push(e);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img" aria-label="Échelle logarithmique des champs magnétiques, de 10⁻⁶ T à 10³ T">
      <line x1={ml} x2={W - mr} y1="84" y2="84" stroke="#475569" strokeWidth="2"/>
      {dec.map(e => <g key={e}><line x1={X(10 ** e)} x2={X(10 ** e)} y1="78" y2="90" stroke="#475569"/>
        <text x={X(10 ** e)} y="108" textAnchor="middle" fontSize="14" fill="#475569">10{SUP[e]}</text></g>)}
      <rect x={X(1)} y="78" width={X(10) - X(1)} height="12" fill="#c4b5fd" opacity="0.8"/>
      {pts.map(([T, nom, val, h]) => <g key={nom}><circle cx={X(T)} cy="84" r="5" fill="#7c3aed"/>
        <text x={X(T)} y={h ? 30 : 52} textAnchor="middle" fontSize="14" fontWeight="700" fill="#0f172a">{nom}</text>
        <text x={X(T)} y={h ? 47 : 69} textAnchor="middle" fontSize="14" fill="#475569">{val}</text></g>)}
      {nB > 0 && <g><path d={`M${X(nB)},80 l-6,-12 l12,0 z`} fill="#16a34a"/><text x={X(nB)} y="134" textAnchor="middle" fontSize="14" fontWeight="700" fill="#16a34a">▲ ici : {fB(nB)}</text></g>}
      <text x={W - mr} y="164" textAnchor="end" fontSize="14" fill="#64748b">champ magnétique B en tesla (échelle logarithmique)</text>
    </svg>);
}

export function SimulationBoussole({ naviguer }) {
  const [mode, setMode] = useState(() => modeOuverture('boussole-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('boussole-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [pos, setPos] = useState({ x: 0.25, y: 0 });
  const [aimant, setAimant] = useState(true);
  const [thetaM, setThetaM] = useState(90);
  const [lignes, setLignes] = useState('total');         // 'total', 'aimant' ou 'aucune'
  const [, setT] = useState(0);
  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const svgRef = useRef(null), glisse = useRef(false);
  const N = useRef({ psi: 0, om: 0 });
  const ch = champs(pos.x, pos.y, aimant, thetaM);
  const E = useRef(null); E.current = ch;

  useEffect(() => {
    let raf, last = performance.now();
    const boucle = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const n = N.current, c = E.current;
      const w = Math.min(2 * Math.PI * 5, 2 * Math.PI * 1.2 * Math.sqrt(c.nB / B_T));
      const nsub = Math.max(1, Math.ceil(dt * w / 0.15)), h = dt / nsub;
      for (let i = 0; i < nsub; i++) {
        const e = ecart(n.psi, c.ang) * Math.PI / 180;
        n.om += (-w * w * Math.sin(e) - 2 * 0.25 * w * n.om) * h; n.psi += deg(n.om * h);
      }
      if (Math.abs(n.om) > 0.003 || Math.abs(ecart(n.psi, c.ang)) > 0.05) setT(t => (t + 1) % 1e9);
      raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, []);

  const place = (x, y) => {
    x = Math.max(-0.29, Math.min(0.29, x)); y = Math.max(-0.19, Math.min(0.19, y));
    const r = Math.hypot(x, y);
    if (r < 0.03) { const u = r > 1e-9 ? 0.03 / r : 1; x = r > 1e-9 ? x * u : 0.03; y = r > 1e-9 ? y * u : 0; }
    setPos({ x, y });
  };
  const versScene = e => {
    const rc = svgRef.current.getBoundingClientRect(), k = 600 / rc.width;
    return [((e.clientX - rc.left) * k - 300) / PX, (200 - (e.clientY - rc.top) * k) / PX];
  };
  const r = Math.hypot(pos.x, pos.y);
  const psi = N.current.psi, dev = ecart(psi, 0);
  const calme = Math.abs(ecart(psi, ch.ang)) < 2 && Math.abs(N.current.om) < 0.05;
  const surAxe = Math.abs(pos.y) < 0.01 && aimant && Math.abs(ecart(thetaM, 90)) < 1;
  const rEq = (2 * K / B_T) ** (1 / 3);
  const tracesLignes = useMemo(() => lignes === 'aucune' ? [] : lignesDeChamp(aimant, thetaM, lignes === 'total'), [lignes, aimant, thetaM]);

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const B10 = Baxe(0.10);
  const aPlace = (x, y) => { setAimant(true); setThetaM(90); setPos({ x, y }); };
  const ETAPES = [
    { id: 'champ', titre: 'Qu’est-ce qu’un champ magnétique ?', focus: ['scene'],
      texte: <>Un aimant, un courant électrique ou la Terre créent un <strong>champ magnétique</strong>, que l’on représente par un vecteur. Une <strong>boussole</strong> (petit aimant mobile) s’oriente le long de ce champ. Ici, la boussole est la petite rose à droite de l’aimant ; vous pouvez la faire glisser. Les lignes grises sont les lignes de champ : près de l’aimant, ce sont celles de l’aimant ; loin de lui, elles se redressent vers le nord.</>,
      tache: { type: 'qcm', q: 'Un champ magnétique est caractérisé par…', options: ['sa direction, son sens et son intensité (en tesla)', 'seulement son intensité', 'sa couleur et sa température'], bonne: 0,
        expl: 'Le champ magnétique est une grandeur vectorielle : direction, sens et intensité (norme), exprimée en tesla (T).' } },
    { id: 'terre', titre: 'Le champ de la Terre', focus: ['scene', 'reglages'],
      texte: <>La Terre crée elle aussi un champ magnétique : c’est pourquoi une boussole indique le nord. <strong>Retirez l’aimant</strong> et regardez l’aiguille.</>,
      tache: { type: 'action', ok: !aimant && calme && Math.abs(dev) < 3, label: 'Retirer l’aimant', faire: () => setAimant(false), consigne: 'Cliquez sur « Retirer l’aimant »' } },
    { id: 'valeurT', titre: 'Son intensité', focus: ['mesures'],
      texte: <>Lisez l’intensité du champ terrestre dans « Mesures ».</>,
      tache: { type: 'num', q: 'Intensité du champ terrestre', unite: 'µT', vrai: B_T * 1e6, tol: 0.02, affiche: v => nbf(v, 0), cs: 2,
        aide: 'C’est une lecture, sans calcul : recopiez l’intensité affichée dans « Mesures », en µT (1 µT = 10⁻⁶ T). Le champ de l’aimant doit être retiré.',
        pieges: [[B_T, 'Votre valeur est en tesla (5,0 × 10⁻⁵ T). L’unité demandée est le microtesla : 1 T = 10⁶ µT.']],
        expl: 'B ≈ 50 µT = 5,0 × 10⁻⁵ T : un champ très faible.' } },
    { id: 'pres', titre: 'Approcher l’aimant', focus: ['scene', 'reglages'],
      texte: <>Remettez l’aimant et placez la boussole <strong>à 10 cm de son centre, sur son axe</strong> (à droite). L’aimant est horizontal : son pôle N pointe vers l’est.</>,
      tache: { type: 'action', ok: aimant && Math.abs(r - 0.10) < 0.005 && Math.abs(pos.y) < 0.01 && Math.abs(ecart(thetaM, 90)) < 1,
        label: 'Placer la boussole à 10 cm', faire: () => aPlace(0.10, 0), consigne: 'Aimant remis, orienté vers l’est ; boussole à 10 cm sur son axe' } },
    { id: 'domine', titre: 'Qui l’emporte ?', focus: ['scene', 'addition'],
      texte: <>Observez l’aiguille et le schéma d’addition des champs : chaque source ajoute son vecteur champ.</>,
      tache: { type: 'qcm', q: 'À 10 cm de l’aimant, l’aiguille…', options: ['s’oriente presque selon le champ de l’aimant, bien plus intense que celui de la Terre', 'pointe toujours le nord comme avant', 'tourne sans s’arrêter'], bonne: 0,
        expl: 'Le champ total est la somme vectorielle des deux champs. Celui de l’aimant (≈ 540 µT) est ici dix fois plus grand que celui de la Terre (50 µT) : l’aiguille se place presque dans sa direction, perpendiculaire au nord.' } },
    { id: 'valeurA', titre: 'Le champ de l’aimant', focus: ['mesures'],
      texte: <>Lisez dans « Mesures » l’intensité du champ créé <strong>par l’aimant seul</strong> à cette distance.</>,
      tache: { type: 'num', q: 'Champ de l’aimant à 10 cm sur son axe', unite: 'µT', vrai: B10 * 1e6, tol: 0.03, affiche: v => nbf(v, 0), cs: 3,
        bloque: aimant && Math.abs(r - 0.10) < 0.005 && Math.abs(pos.y) < 0.01 ? null : 'Placez la boussole à 10 cm de l’aimant, sur son axe (étape 4).',
        calcul: () => ['Hypothèse : aimant droit idéal modélisé par un dipôle, dont le champ sur l’axe décroît en 1/r³ ; la Terre n’est pas comptée (champ de l’aimant seul).',
          `Donnée du modèle : B = ${nbf(B_REF * 1e3, 0)} mT à r = ${nbf(R_REF * 100, 0)} cm. Donc B(r) = ${nbf(B_REF * 1e3, 0)} mT × (${nbf(R_REF * 100, 0)} / r)³ avec r en cm.`,
          `À r = 10 cm : B = ${nbf(B_REF * 1e3, 0)} × (${nbf(R_REF * 100, 0)} / 10)³ = ${nbf(B_REF * 1e3, 0)} × ${nbf((R_REF / 0.1) ** 3, 3)} = ${nbf(B10 * 1e3, 2)} mT.`,
          `Conversion : 1 mT = 1 000 µT, donc B = ${nbf(B10 * 1e3, 2)} × 1 000 = ${nbf(B10 * 1e6, 0)} µT.`],
        pieges: [[B10 * 1e3, 'Attention à l’unité : 540 µT = 0,54 mT.'],
          [B_REF * 1e6 * (R_REF / 0.1) ** 2, 'Vous avez utilisé une décroissance en 1/r². Pour un aimant (dipôle), le champ décroît en 1/r³.'],
          [B10 * 1e6 + B_T * 1e6, 'Vous avez ajouté le champ de la Terre : on demande le champ créé par l’aimant seul.']],
        expl: 'À 10 cm, B ≈ 540 µT soit environ 0,5 mT : dix fois le champ de la Terre.' } },
    { id: 'distance', titre: 'L’éloigner', focus: ['scene', 'mesures'],
      texte: <>Doublez la distance (20 cm) et comparez l’intensité du champ de l’aimant. Dans ce modèle (un aimant droit idéal), le champ décroît très vite avec la distance.</>,
      tache: { type: 'qcm', q: 'En doublant la distance à l’aimant, son champ est divisé par…', options: ['2', '4', '8'], bonne: 2,
        expl: 'Le champ d’un aimant (dipôle) décroît comme 1/r³ : distance × 2, champ ÷ 8 (540 µT → 68 µT).' } },
    { id: 'tangente', titre: 'La boussole des tangentes', focus: ['scene', 'mesures', 'addition'],
      texte: <>Le champ de l’aimant (est – ouest) est perpendiculaire à celui de la Terre (nord). L’aiguille dévie d’un angle α tel que tan α = B<sub>aimant</sub> / B<sub>Terre</sub>. <strong>Placez la boussole sur l’axe</strong> (à droite ou à gauche) pour obtenir une déviation de <strong>45°</strong> (±3°) : que valent alors les deux champs ?</>,
      tache: { type: 'action', ok: surAxe && calme && Math.abs(Math.abs(dev) - 45) < 3, label: 'Placer pour 45°', faire: () => aPlace(rEq, 0), consigne: 'Faites glisser la boussole sur l’axe horizontal jusqu’à obtenir 45° (déviation lue dans « Mesures »)' } },
    { id: 'somme', titre: 'Additionner deux champs perpendiculaires', focus: ['addition', 'mesures'],
      texte: <>Les deux champs ont la même intensité (50 µT) et sont perpendiculaires. Le champ total est la diagonale du carré.</>,
      tache: { type: 'num', q: 'Intensité du champ total', unite: 'µT', vrai: B_T * 1e6 * Math.SQRT2, tol: 0.03, affiche: v => nbf(v, 1), cs: 3,
        bloque: surAxe && Math.abs(Math.abs(dev) - 45) < 4 ? null : 'Placez d’abord la boussole pour obtenir 45° (étape précédente).',
        calcul: () => ['Hypothèse : les deux champs sont perpendiculaires (Terre vers le nord, aimant vers l’est) et de même intensité, 50 µT chacun.',
          'Pythagore : B = √(B_Terre² + B_aimant²).',
          `B = √(${nbf(B_T * 1e6, 0)}² + ${nbf(B_T * 1e6, 0)}²) = √${nbf(2 * (B_T * 1e6) ** 2, 0)} = ${nbf(B_T * 1e6 * Math.SQRT2, 1)} µT.`],
        pieges: [[100, 'On n’additionne pas les intensités : les champs sont perpendiculaires, il faut additionner les vecteurs (Pythagore).'],
          [2 * (B_T * 1e6) ** 2, 'Vous avez oublié la racine carrée : la somme des carrés vaut B², pas B.'],
          [B_T * 1e6, 'C’est l’intensité d’un seul champ. Le champ total est la somme vectorielle des deux.']],
        expl: 'B = √(50² + 50²) = 50 × √2 ≈ 70,7 µT. Même résultat que pour deux bobines voisines du moteur pas à pas (×√2).' } },
    { id: 'grandeur', titre: 'Ordres de grandeur', focus: ['echelle'],
      texte: <>Sur l’échelle logarithmique, la Terre est à 50 µT, un aimant droit à 20 mT, un électroaimant puissant à 1 – 10 T et le record à 100 T. Comparez un électroaimant de 10 T avec le champ de la Terre.</>,
      tache: { type: 'num', q: 'Combien de fois 10 T est-il plus grand que le champ terrestre ?', unite: 'fois', vrai: 10 / B_T, tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['Mettre les deux champs dans la même unité : 50 µT = 50 × 10⁻⁶ T = 5,0 × 10⁻⁵ T.',
          'Rapport = 10 T / (5,0 × 10⁻⁵ T)',
          `= ${nbf(10 / B_T / 1000, 0)} × 10³ = 200 000 fois.`],
        pieges: [[2000, 'Attention aux puissances de dix : 50 µT = 5 × 10⁻⁵ T.'], [20000, 'Attention aux puissances de dix : 50 µT = 5 × 10⁻⁵ T.'],
          [10 / (B_T * 1e6), 'Les deux champs ne sont pas dans la même unité : 10 T est en tesla, 50 est en microtesla. Convertissez avant de diviser.'],
          [B_T / 10, 'Division à l’envers : on cherche 10 T divisé par le champ terrestre.']],
        expl: '10 / (50 × 10⁻⁶) = 200 000 : un électroaimant de 10 T est 200 000 fois plus intense que le champ terrestre.' } },
    { id: 'local', titre: 'Une boussole peut se tromper', focus: ['scene'],
      texte: <>Près d’un aimant, la boussole ne pointe plus le nord.</>,
      tache: { type: 'qcm', q: 'Pourquoi une boussole peut-elle se tromper près d’un haut-parleur ou d’un câble parcouru par un courant ?', options: ['un champ local plus intense que celui de la Terre s’ajoute vectoriellement à lui', 'la Terre a changé de pôle', 'la boussole est trop lourde'], bonne: 0,
        expl: 'Tout aimant ou courant proche crée un champ qui s’ajoute à celui de la Terre ; s’il est plus fort, l’aiguille s’oriente dans la direction du champ total, pas vers le nord.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>le champ magnétique est un vecteur : direction, sens, intensité (tesla)</li>
        <li>une boussole s’aligne sur le champ total, somme vectorielle des champs de toutes les sources</li>
        <li>deux champs perpendiculaires de même intensité : somme ×√2</li>
        <li>ordres de grandeur : Terre 50 µT, aimant 20 mT, électroaimant 1 – 10 T, record 100 T</li></ul>,
      texte: <>Vous savez lire un champ magnétique, additionner deux champs et situer son intensité. Essayez maintenant le défi : mesurer un champ avec la boussole.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const tire = t => t[Math.floor(Math.random() * t.length)];
    setAimant(true); setThetaM(90); setPos({ x: 0.28, y: 0.1 });
    setDefi({ X: tire([30, 40, 50, 60, 70]), reps: {}, verifie: false });
  }
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') { if (!defi) nouveauDefi(); else { setAimant(true); setThetaM(90); } }
    if (md === 'guide') { setAimant(true); setThetaM(90); setPos({ x: 0.25, y: 0.1 }); }
  }
  const defiVrai = defi && B_T * Math.tan(defi.X * Math.PI / 180);
  const defiRes = (() => {
    if (!defi || !defi.verifie) return null;
    const x = lireNombre(defi.reps.b);
    const posOk = surAxe && calme && Math.abs(Math.abs(dev) - defi.X) <= 3;
    const valOk = isFinite(x) && proche(x * 1e-6, defiVrai, 0.05);
    return { posOk, valOk, x };
  })();
  const voletDefi = defi && (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : mesurer un champ avec la boussole</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        1. Placez la boussole <strong>sur l’axe de l’aimant</strong> (horizontalement) pour que l’aiguille dévie de <strong>{defi.X}{NB}°</strong> par rapport au nord (±3°).<br/>
        2. Sans lire le champ de l’aimant, <strong>déduisez-le</strong> de l’angle, avec le champ terrestre (50{NB}µT).
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
        <span>Champ de l’aimant à cet endroit</span>
        <input value={defi.reps.b ?? ''} aria-label="Champ de l’aimant" onChange={e => setDefi(d => ({ ...d, reps: { b: e.target.value }, verifie: false }))}
          style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defiRes ? (defiRes.valOk ? '#16a34a' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
        <span>µT</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => { noterDefi(surAxe && calme && Math.abs(Math.abs(dev) - defi.X) <= 3 && proche(lireNombre(defi.reps.b) * 1e-6, defiVrai, 0.05)); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={nouveauDefi} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defiRes && <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5 }}>
        <div style={{ color: defiRes.posOk ? '#16a34a' : '#dc2626' }}>{defiRes.posOk ? '✓ Position correcte.' : '✗ Position : placez la boussole sur l’axe horizontal et attendez que l’aiguille se stabilise à ' + defi.X + '° (±3°).'}</div>
        <div style={{ color: defiRes.valOk ? '#16a34a' : '#dc2626' }}>{defiRes.valOk ? '✓ Champ de l’aimant correct.' : `✗ Pensez à tan α = B aimant / B Terre : B aimant = 50 × tan ${defi.X}° ≈ ${nbf(defiVrai * 1e6, 0)}${NB}µT.`}</div>
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Champ terrestre</strong> : 50 µT dirigé vers le nord, uniforme (valeur du cours). La boussole ne sent que la composante horizontale, plus faible en France (de l’ordre de 20 µT) ; le champ réel a aussi une composante verticale.</li>
      <li><strong>Aimant</strong> : un aimant droit idéal (dipôle), calibré à 20 mT sur son axe à 3 cm de son centre ; son champ décroît en 1/r³. Très près de l’aimant, le champ réel est plus compliqué.</li>
      <li><strong>Plan horizontal</strong> : tout est dans le plan de la scène ; la boussole est un aimant parfait, très léger, qui s’aligne sur le champ total (avec de petites oscillations).</li>
      <li><strong>Pas d’autre source</strong> : ni fer, ni câble, ni écran à proximité. Dans une vraie salle, ces objets modifient le champ local.</li>
      <li><strong>Échelle de la scène</strong> : le champ de l’aimant égale celui de la Terre à environ {nbf(rEq * 100, 0)}{NB}cm sur son axe.</li>
    </ul>);
  const panneauHypo = (
    <div style={styleBoite}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défi</button>
      {naviguer && <button onClick={() => naviguer(44)} style={styleBouton(false, '#b45309')}><Pic n="magnet"/>Moteur pas à pas</button>}
    </span>);

  // ---------- scène ----------
  const cx = 300 + pos.x * PX, cy = 200 - pos.y * PX;
  const fleches = tracesLignes.map((pts, i) => {
    if (pts.length < 3) return null;
    const d = pts.map((p, j) => `${j ? 'L' : 'M'}${(300 + p[0] * PX).toFixed(1)},${(200 - p[1] * PX).toFixed(1)}`).join(' ');
    const m = Math.floor(pts.length / 2), q = pts[m], q2 = pts[Math.min(pts.length - 1, m + 1)];
    const an = deg(Math.atan2(q2[0] - q[0], q2[1] - q[1]));
    return <g key={i}><path d={d} fill="none" stroke={lignes === 'aimant' ? '#dc2626' : '#64748b'} strokeWidth="1.4" opacity="0.7"/>
      <path d="M0,-6 L4,3 L-4,3 z" transform={`translate(${300 + q[0] * PX} ${200 - q[1] * PX}) rotate(${an})`} fill={lignes === 'aimant' ? '#dc2626' : '#64748b'} opacity="0.85"/></g>;
  });
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <svg ref={svgRef} viewBox="0 0 600 400" style={{ width: '100%', display: 'block', touchAction: 'none', background: '#f8fafc', borderRadius: 8 }}
        onPointerMove={e => { if (glisse.current) { const [x, y] = versScene(e); place(x, y); } }}
        onPointerUp={() => { glisse.current = false; }} onPointerLeave={() => { glisse.current = false; }}
        role="img" aria-label="Vue de dessus : un aimant au centre, une boussole que l’on peut déplacer">
        {fleches}
        <text x="12" y="22" fontSize="13" fontWeight="700" fill="#2563eb">↑ nord (champ de la Terre)</text>
        {aimant && <g transform={`translate(300 200) rotate(${thetaM - 90})`}>
          <rect x="-25" y="-9" width="25" height="18" fill="#2563eb" rx="2"/><rect x="0" y="-9" width="25" height="18" fill="#dc2626" rx="2"/>
          <text x="-12.5" y="5" textAnchor="middle" fontSize="13" fontWeight="800" fill="white">S</text>
          <text x="12.5" y="5" textAnchor="middle" fontSize="13" fontWeight="800" fill="white">N</text></g>}
        {!aimant && <text x="300" y="204" textAnchor="middle" fontSize="12" fill="#94a3b8">(aimant retiré)</text>}
        <g transform={`translate(${cx} ${cy})`} style={{ cursor: 'grab' }}
          onPointerDown={e => { glisse.current = true; e.currentTarget.ownerSVGElement.setPointerCapture?.(e.pointerId); }}>
          <circle r="30" fill="white" stroke="#475569" strokeWidth="2" opacity="0.95"/>
          {[['N', 0, -22], ['E', 22, 4], ['S', 0, 29], ['O', -22, 4]].map(([t, x, y]) => <text key={t} x={x} y={y} textAnchor="middle" fontSize="10" fontWeight="700" fill="#64748b">{t}</text>)}
          <g transform={`rotate(${psi})`}><path d="M0,-17 L5,0 L-5,0 z" fill="#dc2626"/><path d="M0,17 L5,0 L-5,0 z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8"/><circle r="2" fill="#0f172a"/></g>
        </g>
      </svg>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Faites glisser la boussole. Le bout rouge de l’aiguille indique le sens du champ total. {lignes === 'total' ? 'Lignes grises : lignes du champ total (aimant + Terre).' : lignes === 'aimant' ? 'Lignes rouges : lignes du champ de l’aimant seul.' : ''}</div>
    </div>);

  const reglages = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => setAimant(a => !a)} disabled={enDefi} style={stylePetitBouton(aimant, '#dc2626')}>{aimant ? 'Retirer l’aimant' : 'Remettre l’aimant'}</button>
      </div>
      <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Lignes de champ</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['total', 'Champ total'], ['aimant', 'Aimant seul'], ['aucune', 'Aucune']].map(([v, l]) => <button key={v} onClick={() => setLignes(v)} style={stylePetitBouton(lignes === v, '#0891b2')}>{l}</button>)}
      </div>
      {!enDefi && <><div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Placer la boussole</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => place(0.05, 0)} style={stylePetitBouton(false)}>5 cm sur l’axe</button>
        <button onClick={() => place(0.10, 0)} style={stylePetitBouton(false)}>10 cm sur l’axe</button>
        <button onClick={() => place(0, 0.10)} style={stylePetitBouton(false)}>10 cm au-dessus</button>
        <button onClick={() => place(rEq, 0)} style={stylePetitBouton(false)}>{nbf(rEq * 100, 0)} cm : champs égaux</button>
      </div></>}
      <Curseur nom={<>Direction du pôle N de l’aimant (depuis le nord)</>} valeur={thetaM} onChange={v => !enDefi && setThetaM(v)} min={0} max={360} pas={5} unite="°" decimales={0} couleur="#dc2626"/>
    </div>);
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures à l’emplacement de la boussole</div>
      <LigneMesure nom="Distance au centre de l’aimant" valeur={`${nbf(r * 100, 1)}${NB}cm`}/>
      <LigneMesure nom="Champ de la Terre" valeur={fB(B_T)} couleur="#2563eb"/>
      {!enDefi && <LigneMesure nom="Champ de l’aimant" valeur={aimant ? fB(ch.nBa) : '–'} couleur="#dc2626"/>}
      {!enDefi && <LigneMesure nom="Champ total" valeur={fB(ch.nB)} couleur="#16a34a"/>}
      {!enDefi && <LigneMesure nom="Rapport B aimant / B Terre" valeur={aimant ? nbf(ch.nBa / B_T, ch.nBa / B_T >= 100 ? 0 : 2) : '–'}/>}
      <LigneMesure nom="Déviation de l’aiguille (+ : vers l’est)" valeur={`${dev >= 0 ? '+' : '−'}${nbf(Math.abs(dev), 0)}${NB}°`}/>
    </div>);
  const addition = (
    <div style={{ ...styleBoite, ...cadre('addition') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Addition des champs</div>
      <Addition ch={ch}/>
      <div style={{ fontSize: 12, color: KIT.txt2 }}>Les flèches sont tracées à l’échelle (le plus grand vecteur est toujours ramené à la même longueur).</div>
    </div>);
  const echelle = (
    <div style={{ ...styleBoite, ...cadre('echelle') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Ordres de grandeur</div>
      <Echelle nB={enDefi ? 0 : ch.nB}/>
    </div>);

  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Retirez l’aimant : où pointe l’aiguille ? Et si on la déplace ?</li>
        <li>Placez la boussole au-dessus ou en dessous de l’aimant (sur sa médiatrice) : le champ de l’aimant est-il de même sens que sur l’axe ?</li>
        <li>Retournez l’aimant de 180° : que devient la déviation de l’aiguille ?</li>
        <li>Cherchez la distance pour laquelle l’aimant et la Terre créent des champs égaux. Quel angle lit-on ?</li>
        <li>Comparez « Aimant seul » et « Champ total » : près de l’aimant les lignes sont presque identiques ; à partir de quelle distance la Terre redresse-t-elle les lignes vers le nord ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>le champ magnétique est un vecteur (direction, sens, intensité en tesla)</li>
        <li>la boussole indique la direction du champ total = somme vectorielle</li>
        <li>Terre 50 µT ≪ aimant 20 mT ≪ électroaimant 1 – 10 T</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .bs-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .bs-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .bs-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .bs-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .bs-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (max-width: 900px) { .bs-l1.cote, .bs-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Boussole et champ magnétique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un <strong>champ magnétique</strong> a une direction, un sens et une intensité (en tesla). Une <strong>boussole</strong> s’aligne sur le champ <strong>total</strong>, somme des champs de la Terre et d’un aimant : déplacez-la autour de l’aimant et observez.</div>
      <div className={`bs-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div>
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}><>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></></div>}
          <div className={`bs-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {scene}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{reglages}{mesures}</div>
          </div>
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : enDefi ? panneauHypo : null}
      </div>
      <div className="bs-l2">{enDefi ? null : addition}{echelle}</div>
      {!enDefi && <div className="bs-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="bs-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
