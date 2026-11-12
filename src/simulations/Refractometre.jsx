import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useMemo } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { MELANGES, Teb, yEq, wDe, degre } from "./distillationModele";
import { Diagramme, nf, NB, Xi } from "./Distillation";
import { Pic } from "../Pictos";

const SIM_ID = 43;
declarerDefis(SIM_ID, [['principal', 'Indice et composition']]);

// ====================================================
//  SIM 43 — RÉFRACTOMÈTRE : lire un indice de réfraction, puis en déduire la composition eau – éthanol
// ====================================================

// Courbe d'étalonnage n = f(x) (x : fraction molaire en éthanol, 20 °C, raie D du sodium), d'après le document de TP :
// n = 1,333 pour l'eau pure, maximum ≈ 1,366 vers x = 0,6, 1,3615 pour l'éthanol pur. Interpolation monotone par morceaux (Fritsch-Carlson).
const PX = [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const PN = [1.3330, 1.3430, 1.3500, 1.3590, 1.3640, 1.3652, 1.3659, 1.3662, 1.3658, 1.3652, 1.3640, 1.3615];
const PM = (() => {
  const n = PX.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((PN[i + 1] - PN[i]) / (PX[i + 1] - PX[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return m;
})();
export function nDe(x) {
  const u = Math.min(1, Math.max(0, x)); let i = 0; while (i < PX.length - 2 && u > PX[i + 1]) i++;
  const h = PX[i + 1] - PX[i], t = (u - PX[i]) / h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * PN[i] + (t3 - 2 * t2 + t) * h * PM[i] + (-2 * t3 + 3 * t2) * PN[i + 1] + (t3 - t2) * h * PM[i + 1];
}
// Toutes les compositions x possibles pour un indice n (une ou deux)
export function compositions(n) {
  const sol = []; let prev = nDe(0) - n;
  for (let k = 1; k <= 1000; k++) {
    const x = k / 1000, v = nDe(x) - n;
    if (prev === 0 || prev * v < 0) { let a = (k - 1) / 1000, b = x; for (let i = 0; i < 40; i++) { const c = (a + b) / 2; if ((nDe(a) - n) * (nDe(c) - n) <= 0) b = c; else a = c; } sol.push((a + b) / 2); }
    prev = v;
  }
  return sol;
}

const K = 40000;            // pixels par unité d'indice : 0,001 ↔ 40 px
const CY = 160;             // ordonnée du repère (réticule et index de l'échelle)
const nExacte = x => Math.round(nDe(x) * 1e4) / 1e4;

// Champ de l'oculaire : frontière clair / sombre, réticule, échelle
function Oculaire({ nE, nR, goutte, comp }) {
  const decal = (nE - nR) * K;                 // une frontière plus haute pour un indice d'échantillon plus grand
  const yB = CY - decal;
  const hors = yB < 10 || yB > 310;
  const ticks = [];
  const n0 = Math.floor((nR - 0.0045) * 2000) / 2000;
  for (let k = 0; k < 20; k++) {
    const v = n0 + k * 0.0005, y = CY - (v - nR) * K, entier = Math.abs(Math.round(v * 1000) - v * 1000) < 1e-6;
    if (y < 4 || y > 316) continue;
    ticks.push(<g key={k}><line x1={entier ? 244 : 252} x2="272" y1={y} y2={y} stroke="#0f172a" strokeWidth={entier ? 1.6 : 1}/>
      {entier && <text x="276" y={y + 4} fontSize="12" fill="#0f172a" fontWeight="600">{nf(v, 3)}</text>}</g>);
  }
  const yb = Math.min(310, Math.max(10, yB));
  return (
    <svg viewBox="0 0 360 320" style={{ width: '100%', maxWidth: 400, display: 'block', margin: '0 auto' }} role="img" aria-label="Champ de l’oculaire du réfractomètre : frontière clair - sombre, réticule et échelle des indices">
      <defs>
        <clipPath id="rf-champ"><circle cx="180" cy="160" r="156"/></clipPath>
        <linearGradient id="rf-irise" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff7d6"/><stop offset="0.2" stopColor="#fde68a"/><stop offset="0.45" stopColor="#fb923c"/>
          <stop offset="0.6" stopColor="#a78bfa"/><stop offset="0.8" stopColor="#3b82f6"/><stop offset="1" stopColor="#1f2937"/>
        </linearGradient>
      </defs>
      <circle cx="180" cy="160" r="158" fill="#0f172a"/>
      <g clipPath="url(#rf-champ)">
        {!goutte ? <rect x="0" y="0" width="360" height="320" fill="#1f2937"/> : (
          <>
            <rect x="0" y="0" width="360" height="320" fill="#1f2937"/>
            <rect x="0" y="0" width="360" height={Math.min(320, Math.max(0, yB))} fill="#fff7d6"/>
            {!comp && !hors && <rect x="0" y={yb - 14} width="360" height="28" fill="url(#rf-irise)"/>}
          </>)}
        {/* échelle (verre dépoli clair) */}
        <rect x="236" y="0" width="130" height="320" fill="rgba(255,255,255,0.92)"/>
        {ticks}
        <polygon points="238,160 230,154 230,166" fill="#dc2626"/>
        <line x1="238" y1={CY} x2="300" y2={CY} stroke="#dc2626" strokeWidth="1.2" strokeDasharray="3 3"/>
        {/* réticule */}
        <g stroke="#0f172a" strokeWidth="1.5"><line x1="80" y1="120" x2="160" y2="200"/><line x1="160" y1="120" x2="80" y2="200"/></g>
        <circle cx="120" cy="160" r="3" fill="#dc2626"/>
      </g>
      <circle cx="180" cy="160" r="157" fill="none" stroke="#475569" strokeWidth="3"/>
      {!goutte && <text x="150" y="60" textAnchor="middle" fontSize="12" fill="#e2e8f0">pas d’échantillon : champ sombre</text>}
      {goutte && hors && <text x="120" y={yB < 10 ? 60 : 280} textAnchor="middle" fontSize="12" fontWeight="700" fill={yB < 10 ? '#f8fafc' : '#7c2d12'}>{yB < 10 ? 'champ tout sombre : augmentez l’indice (▶)' : 'champ tout clair : diminuez l’indice (◀)'}</text>}
      <text x="120" y="312" textAnchor="middle" fontSize="10.5" fill="#cbd5e1" style={{ display: 'none' }}>réticule</text>
    </svg>
  );
}

// Schéma du principe : prisme, goutte, rayons
function Principe({ goutte, anim }) {
  return (
    <svg viewBox="0 0 300 170" style={{ width: '100%', maxWidth: 340, display: 'block', margin: '0 auto' }} role="img" aria-label="Schéma du prisme du réfractomètre avec la goutte d’échantillon">
      <style>{`@keyframes rf-tombe { 0% { transform: translateY(-56px); opacity: 0; } 20% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(0); opacity: 0; } } .rf-goutte { animation: rf-tombe 0.8s ease-in both; }`}</style>
      <polygon points="40,120 260,120 235,152 65,152" fill="#bfdbfe" stroke="#475569" strokeWidth="2"/>
      <text x="150" y="141" textAnchor="middle" fontSize="11" fill="#0f172a">prisme (n ≈ 1,62)</text>
      <polygon points="60,112 240,112 260,120 40,120" fill="#e2e8f0" stroke="#475569" strokeWidth="1"/>
      {goutte && <ellipse cx="150" cy="116" rx="62" ry="4" fill="#93c5fd" stroke="#2563eb" strokeWidth="1.2"/>}
      {goutte && <text x="150" y="104" textAnchor="middle" fontSize="11" fill="#1d4ed8" fontWeight="700">film d’échantillon (n inconnu)</text>}
      {!goutte && <text x="150" y="104" textAnchor="middle" fontSize="11" fill="#64748b">prisme sec</text>}
      {goutte && anim && <circle cx="150" cy="112" r="6" fill="#60a5fa" stroke="#2563eb" className="rf-goutte"/>}
      <path d="M150 116 L110 154 M150 116 L190 154" stroke="#f59e0b" strokeWidth="1.6" fill="none"/>
      <text x="150" y="30" textAnchor="middle" fontSize="11" fill="#334155">rayons rasants : au-delà de l’angle limite,</text>
      <text x="150" y="44" textAnchor="middle" fontSize="11" fill="#334155">plus de lumière transmise → zone sombre</text>
    </svg>
  );
}

// Courbe d'étalonnage n = f(x) avec la ligne de lecture et les compositions possibles
function Etalonnage({ nR, lecture, candidats, xVrai }) {
  const W = 420, H = 260, L = 58, R = 14, Tp = 14, B = 44, w = W - L - R, h = H - Tp - B, lo = 1.330, hi = 1.370;
  const px = x => L + x * w, py = n => Tp + (hi - n) / (hi - lo) * h;
  const pts = []; for (let k = 0; k <= 100; k++) pts.push(`${px(k / 100).toFixed(1)},${py(nDe(k / 100)).toFixed(1)}`);
  const gy = []; for (let n = 1.330; n <= 1.3701; n += 0.005) gy.push(n);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 520, display: 'block', margin: '0 auto' }} role="img" aria-label="Courbe d’étalonnage : indice de réfraction en fonction de la fraction molaire en éthanol">
      <rect x={L} y={Tp} width={w} height={h} fill="white" stroke="#cbd5e1"/>
      {gy.map((n, i) => <g key={i}><line x1={L} x2={L + w} y1={py(n)} y2={py(n)} stroke="#e2e8f0"/><text x={L - 5} y={py(n) + 4} textAnchor="end" fontSize="10.5" fill="#334155">{nf(n, 3)}</text></g>)}
      {[0, 0.2, 0.4, 0.6, 0.8, 1].map(x => <g key={x}><line x1={px(x)} x2={px(x)} y1={Tp} y2={Tp + h} stroke="#e2e8f0"/><text x={px(x)} y={Tp + h + 14} textAnchor="middle" fontSize="10.5" fill="#334155">{nf(x, 1)}</text></g>)}
      <text x={L + w / 2} y={H - 6} textAnchor="middle" fontSize="12" fill="#0f172a">fraction molaire en éthanol x</text>
      <text transform={`translate(13 ${Tp + h / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="#0f172a">indice n</text>
      <polyline points={pts.join(' ')} fill="none" stroke="#7c3aed" strokeWidth="2.6"/>
      {lecture && nR >= lo && nR <= hi && <line x1={L} x2={L + w} y1={py(nR)} y2={py(nR)} stroke="#ea580c" strokeWidth="1.6" strokeDasharray="5 4"/>}
      {lecture && candidats.map((x, i) => <g key={i}>
        <line x1={px(x)} x2={px(x)} y1={py(nR)} y2={Tp + h} stroke="#ea580c" strokeDasharray="3 3"/>
        <circle cx={px(x)} cy={py(nR)} r="5" fill="#ea580c" stroke="#0f172a"/>
        <text x={px(x)} y={Tp + h - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="#9a3412" stroke="white" strokeWidth="3" paintOrder="stroke">x ≈ {nf(x, 2)}</text></g>)}
      {xVrai != null && <circle cx={px(xVrai)} cy={py(nDe(xVrai))} r="4" fill="#16a34a" stroke="#0f172a"/>}
    </svg>
  );
}

const INDICE_Q = {"q1": "Repérez la graduation sous l’index, puis estimez le dernier chiffre à l’œil.", "q2": "Tracez l’horizontale à l’indice lu sur la courbe : combien de points d’intersection ?", "q3": "Lisez l’abscisse de la première intersection, la plus à gauche.", "q4": "w = x·M_A ÷ (x·M_A + (1 − x)·M_B)."};
export function SimulationRefractometre({ naviguer }) {
  const [mode, setMode] = useState(() => modeOuverture('refracto-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('refracto-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [x, setX] = useState(0.9);                 // composition de l'échantillon (inconnue de l'élève en défi)
  const [nR, setNR] = useState(1.3500);            // indice lu sous le repère (position de la molette)
  const [goutte, setGoutte] = useState(true);
  const [comp, setComp] = useState(true);
  const [lectureNum, setLectureNum] = useState(false);
  const [anim, setAnim] = useState(() => { try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return true; } });
  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const xE = enDefi && defi ? defi.x : x;
  const nE = nExacte(xE);
  const ecart = nE - nR, aligne = goutte && Math.abs(ecart) < 0.0002;
  const cands = useMemo(() => compositions(nR), [nR]);
  const ew = MELANGES.ew;
  const tourne = v => setNR(Math.round(Math.min(1.370, Math.max(1.330, v)) * 1e4) / 1e4);

  const G = useMemo(() => {
    const xs = 0.9, n = nExacte(xs), c = compositions(n);
    return { x: xs, n, x1: c[0], x2: c[c.length - 1], nb: c.length, ycTete: yEq(ew, 0.04), Taz: ew.az[1] };
  }, [ew]);
  const etape = guide.etape;
  const idEtape = ETAPES_ID(etape);
  function ETAPES_ID(e) { return e; }
  void idEtape;

  const ETAPES = [
    { id: 'principe', titre: 'Que mesure un réfractomètre ?', focus: ['principe'],
      texte: <>Un réfractomètre mesure l’<strong>indice de réfraction</strong> n d’un liquide. La lumière traverse un prisme, puis le film de liquide. Les rayons rasants ne passent dans le liquide que si l’angle est assez petit : il existe un <strong>angle limite</strong>, qui dépend de n. Dans l’oculaire, on voit donc une zone claire et une zone sombre, séparées par une <strong>frontière nette</strong>.</>,
      tache: { type: 'qcm', q: 'La position de la frontière clair – sombre dépend…', options: ['de l’indice de réfraction du liquide déposé sur le prisme', 'de la couleur du liquide', 'du volume de la goutte déposée'], bonne: 0,
        expl: 'La frontière correspond à l’angle limite de réfraction : elle ne dépend que de l’indice du liquide (et de la température), pas de la quantité déposée.', indice: "La frontière correspond à l’angle limite de réfraction : de quoi dépend-il ?" } },
    { id: 'goutte', titre: 'Déposer la goutte', focus: ['principe', 'reglages'],
      texte: <>L’échantillon est le <strong>distillat</strong> d’une distillation fractionnée d’un vin. Déposez une goutte sur le prisme et refermez le prisme. Sans échantillon, le champ reste sombre.</>,
      tache: { type: 'action', ok: goutte && Math.abs(x - 0.9) < 1e-9, label: 'Déposer la goutte', faire: () => { setX(0.9); setGoutte(true); }, consigne: goutte ? null : 'Déposez la goutte' } },
    { id: 'comp', titre: 'Supprimer les irisations', focus: ['reglages', 'champ'],
      retenirTitre: 'À RETENIR : LE PRINCIPE ET LE COMPENSATEUR',
      retenir: <>
        <svg viewBox="0 0 360 140" role="img" aria-label="Principe du réfractomètre : la lumière traverse un prisme puis le film de liquide ; au-delà d’un angle limite qui dépend de l’indice n du liquide, les rayons rasants ne passent plus ; dans l’oculaire, on voit une zone claire et une zone sombre séparées par une frontière nette" style={{ width: '100%', maxWidth: 360, height: 'auto', display: 'block', margin: '0 auto 6px' }}>
          <polygon points="60,70 150,20 240,20 240,70" fill="#dbeafe" stroke="#1d4ed8" strokeWidth="2" /><text x="150" y="48" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e3a8a">prisme</text>
          <rect x="60" y="70" width="180" height="8" fill="#fde68a" stroke="#b45309" strokeWidth="1.5" /><text x="150" y="98" textAnchor="middle" fontSize="12" fontWeight="700" fill="#92400e">film de liquide (indice n)</text>
          <line x1="40" y1="30" x2="118" y2="70" stroke="#d55e00" strokeWidth="2.5" /><line x1="40" y1="50" x2="104" y2="70" stroke="#d55e00" strokeWidth="2.5" />
          <line x1="240" y1="78" x2="290" y2="108" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 3" /><text x="236" y="122" fontSize="11" fill="#475569">angle limite θ</text>
          <rect x="300" y="14" width="50" height="40" fill="#fffbeb" stroke="#334155" strokeWidth="1.5" /><rect x="325" y="14" width="25" height="40" fill="#1e293b" /><line x1="325" y1="14" x2="325" y2="54" stroke="#ef4444" strokeWidth="2" />
          <text x="325" y="68" textAnchor="middle" fontSize="10.5" fill="#334155">oculaire</text>
        </svg>
        <Formule><mi>n</mi><mo>=</mo><mfrac><mi>c</mi><mi>v</mi></mfrac></Formule>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Un réfractomètre mesure l’<strong>indice de réfraction n</strong> d’un liquide : il existe un <strong>angle limite</strong> qui dépend de n ; la frontière clair – sombre se déplace quand n change.</li>
          <li>Le <strong>compensateur</strong> supprime les irisations dues à la dispersion (l’indice dépend un peu de la couleur) : n est mesuré pour la raie D du sodium, n<sub>D</sub>, à 20 °C.</li>
          <li>Sans échantillon, le champ reste sombre.</li>
        </ul>
      </>,
      texte: <>Regardez la frontière : si le compensateur est inactif, elle est <strong>floue et colorée</strong> (la lumière blanche est dispersée : l’indice dépend un peu de la couleur). Le <strong>compensateur</strong> corrige cette dispersion : l’indice mesuré est celui de la raie jaune du sodium (n<sub>D</sub>).</>,
      tache: { type: 'action', ok: comp && goutte, label: 'Activer le compensateur', faire: () => { setGoutte(true); setComp(true); }, consigne: comp ? null : 'Activez le compensateur' } },
    { id: 'aligner', titre: 'Amener la frontière sur le réticule', focus: ['champ', 'reglages'],
      texte: <>Tournez la <strong>molette</strong> pour amener la frontière clair – sombre exactement sur le <strong>centre de la croix</strong> (point rouge). L’échelle se déplace en même temps : ce qui est sous l’index rouge est l’indice lu.</>,
      tache: { type: 'action', ok: aligne && comp, label: 'Rapprocher la frontière du réticule', faire: () => { tourne(Math.round(nE * 1000) / 1000 + 0.0010); }, consigne: aligne && comp ? null : 'Affinez avec les boutons ◀ ▶ (pas de 0,0001) jusqu’à superposer la frontière et le point rouge' } },
    { id: 'lire', titre: 'Lire l’indice', focus: ['champ'],
      texte: <>Lisez l’échelle <strong>au niveau de l’index rouge</strong>. Les grandes graduations sont espacées de 0,001. Estimez le <strong>dixième de graduation</strong> pour donner 4 décimales (par exemple 1,3640).</>,
      tache: { type: 'num', q: 'Indice de réfraction n lu', unite: '', vrai: G.n, tol: 0.00015, affiche: v => nf(v, 4), cs: 5,
        bloque: aligne && comp ? null : 'Alignez d’abord la frontière sur le réticule (étape 4).',
        aide: 'Lecture : repérez la graduation (tous les 0,001) juste sous l’index rouge, puis estimez à l’œil le dixième de l’intervalle entre deux graduations pour la 4e décimale.',
        pieges: [[1.364 + 0.001, 'Vous avez lu une graduation voisine : regardez bien quelle graduation est juste sous l’index.'], [1.36, 'Vous n’avez gardé que 2 décimales : la graduation vaut 0,001 et on estime le dixième de graduation, soit 4 décimales.']],
        expl: 'n ≈ 1,3640. L’échelle est graduée tous les 0,001 : on lit la graduation puis on estime le dixième, d’où 4 décimales. L’incertitude de lecture est de l’ordre de 0,0002.', indice: "La 4ᵉ décimale s’estime à l’œil entre deux graduations." } },
    { id: 'decimales', titre: 'Combien de décimales ?', focus: ['champ'],
      retenirTitre: 'À RETENIR : LIRE L’INDICE',
      retenir: <>
                <table style={{ borderCollapse: 'collapse', margin: '6px 0 2px', fontSize: 13.5 }}>
          <thead><tr><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Lecture</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Valeur</th></tr></thead>
          <tbody>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>grande graduation</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>0,001</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>estimation à l’œil</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>dixième de graduation, soit 0,0001</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>écriture du résultat</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>4 décimales, avec incertitude : n = 1,3640 ± 0,0002</td></tr>
          </tbody>
        </table>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>On amène la frontière sur le <strong>centre du réticule</strong> et on lit l’échelle <strong>au niveau de l’index rouge</strong>.</li>
          <li>n est un nombre <strong>sans unité</strong> ; l’incertitude doit rester cohérente avec la précision de la lecture (±0,0002 environ).</li>
        </ul>
      </>,
      texte: <>La plus petite graduation de l’échelle vaut 0,001, mais on estime le dixième de graduation à l’œil.</>,
      tache: { type: 'qcm', q: 'Quelle écriture traduit le mieux la lecture ?', options: ['n = 1,3640 ± 0,0002', 'n = 1,364 ± 0,01', 'n = 1,36 ± 0,0001'], bonne: 0,
        expl: 'On garde 4 décimales (dixième de graduation estimé) avec une incertitude de quelques 10⁻⁴. Écrire ±0,0001 serait trop optimiste, et ±0,01 beaucoup trop pessimiste.', indice: "Le nombre de décimales du résultat doit être cohérent avec l’incertitude annoncée." } },
    { id: 'courbe', titre: 'Passer de n à la composition', focus: ['courbe'],
      retenirTitre: 'À RETENIR : DE L’INDICE À LA COMPOSITION',
      retenir: <>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
          <li>Préparer des mélanges eau – éthanol de composition connue et mesurer leur indice : <strong>courbe d’étalonnage n = f(x)</strong>.</li>
          <li>Tracer sur la courbe la ligne horizontale n = n<sub>mesuré</sub>.</li>
          <li>Lire l’abscisse x (fraction molaire en éthanol) de chaque intersection.</li>
        </ol>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>La courbe <strong>monte, passe par un maximum, puis redescend</strong> : pour un indice assez élevé, il y a <strong>deux</strong> compositions possibles (avant et après le maximum).</li>
        </ul>
      </>,
      texte: <>Pour connaître la composition, on utilise la <strong>courbe d’étalonnage</strong> n = f(x) obtenue avec des mélanges eau – éthanol connus. La ligne orange correspond à votre lecture, n = {nf(G.n, 4)} (étape 5) : lisez l’abscisse du premier point d’intersection avec la courbe, <strong>le plus à gauche</strong>.</>,
      tache: { type: 'num', q: 'Fraction molaire x en éthanol (première composition possible)', unite: '', vrai: G.x1, tol: 0.1, affiche: v => nf(v, 2), cs: 2,
        bloque: aligne ? null : 'Alignez d’abord la frontière (étape 4).',
        aide: 'Lecture : suivez la ligne orange horizontale jusqu’à sa première rencontre avec la courbe (en partant de la gauche), puis lisez l’abscisse sur l’axe horizontal.',
        pieges: [[G.x2, 'C’est la seconde composition possible (branche descendante de la courbe, à droite du maximum). On demande la première, la plus à gauche.']],
        expl: 'La droite n = 1,364 coupe la branche croissante de la courbe vers x ≈ 0,30.', indice: "L’indice n’est pas monotone avec la composition : il peut y avoir deux solutions, on cherche la plus petite." } },
    { id: 'deux', titre: 'Une seule composition ?', focus: ['courbe'],
      texte: <>Regardez la courbe : elle monte, passe par un maximum, puis redescend. Une même valeur de n peut donc correspondre à <strong>deux</strong> compositions.</>,
      tache: { type: 'qcm', q: 'Pour n = 1,3640, combien de compositions sont possibles ?', options: ['une seule, x ≈ 0,30', 'deux : x ≈ 0,30 et x ≈ 0,90', 'aucune'], bonne: 1,
        expl: 'Le maximum de la courbe (n ≈ 1,366 vers x = 0,6) fait que, pour n > 1,3615, deux compositions donnent le même indice : une avant et une après le maximum.' } },
    { id: 'choix', titre: 'Choisir grâce au contexte', focus: ['courbe', 'diagramme'],
      retenirTitre: 'À RETENIR : LEVER L’AMBIGUÏTÉ',
      retenir: <>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>La mesure seule ne suffit pas : il faut une <strong>autre information</strong> (contexte).</li>
          <li>Une colonne très efficace plafonne à l’<strong>azéotrope eau – éthanol</strong> (température d’ébullition minimale, composition voisine de x ≈ 0,90) : le distillat ne peut pas être beaucoup plus riche, ni beaucoup plus pauvre en éthanol.</li>
          <li>La <strong>température en tête de colonne</strong> et l’étape de la distillation permettent de choisir la bonne composition parmi les deux.</li>
        </ul>
      </>,
      texte: <>La mesure seule ne suffit pas : il faut une <strong>autre information</strong>. Ce distillat sort d’une colonne très efficace, qui plafonne à l’azéotrope eau – éthanol, dont la température d’ébullition est {nf(G.Taz, 1)}{NB}°C. Le thermomètre en tête indique 78,3{NB}°C.</>,
      tache: { type: 'qcm', q: 'Quelle composition retenez-vous pour le distillat ?', options: ['x ≈ 0,30 : un distillat pauvre en éthanol', 'x ≈ 0,90 : le distillat est proche de l’azéotrope', 'aucune des deux'], bonne: 1,
        expl: 'À 78,3 °C, la vapeur de tête est presque à la température de l’azéotrope : sa composition est x ≈ 0,90, proche de l’azéotrope. Avec x ≈ 0,30, le thermomètre afficherait beaucoup plus de 80 °C.', indice: "Rappelez-vous la nature du distillat : riche ou pauvre en éthanol ?" } },
    { id: 'degre', titre: 'En degré alcoolique', focus: ['courbe'],
      retenirTitre: 'À RETENIR : FRACTION MOLAIRE, MASSIQUE ET DEGRÉ',
      retenir: <>
        <Formule><mi>w</mi><mo>=</mo><mfrac><mrow><mi>x</mi><mo>×</mo><msub><mi>M</mi><mtext>éthanol</mtext></msub></mrow><mrow><mi>x</mi><mo>×</mo><msub><mi>M</mi><mtext>éthanol</mtext></msub><mo>+</mo><mo>(</mo><mn>1</mn><mo>−</mo><mi>x</mi><mo>)</mo><mo>×</mo><msub><mi>M</mi><mtext>eau</mtext></msub></mrow></mfrac></Formule>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>M(éthanol) = 46 g·mol⁻¹ ; M(eau) = 18 g·mol⁻¹. Raisonner sur <strong>1 mol de mélange</strong> : masse d’éthanol = x × 46, masse d’eau = (1 − x) × 18.</li>
          <li>Le <strong>degré alcoolique</strong> est le volume d’éthanol pour 100 volumes de mélange (à 20 °C) : on passe de w au volume avec les masses volumiques.</li>
          <li>x et w sont des fractions (sans unité) comprises entre 0 et 1.</li>
        </ul>
      </>,
      texte: <>Convertissez la fraction molaire en fraction massique (M<sub>éthanol</sub> = 46 g·mol⁻¹, M<sub>eau</sub> = 18 g·mol⁻¹) puis en degré alcoolique avec la masse volumique du mélange (le simulateur le fait pour vous ci-dessous).</>,
      tache: { type: 'num', q: 'Fraction massique w en éthanol du distillat (x = 0,90)', unite: '', vrai: wDe(ew, 0.9), tol: 0.03, affiche: v => nf(v, 3), cs: 3,
        calcul: () => {
          const nA = 0.9 * ew.MA, nB = 0.1 * ew.MB;
          return [`On raisonne pour 1 mol de distillat (mélange binaire eau – éthanol) : 0,90 mol d’éthanol (M_A = ${ew.MA} g·mol⁻¹) et 0,10 mol d’eau (M_B = ${ew.MB} g·mol⁻¹).`,
            `Masse d’éthanol : 0,90 × ${ew.MA} = ${nf(nA, 1)} g. Masse d’eau : 0,10 × ${ew.MB} = ${nf(nB, 1)} g.`,
            `Masse totale : ${nf(nA, 1)} + ${nf(nB, 1)} = ${nf(nA + nB, 1)} g.`,
            `w = ${nf(nA, 1)} / ${nf(nA + nB, 1)} = ${nf(wDe(ew, 0.9), 3)}.`];
        },
        pieges: [[0.9, 'C’est la fraction molaire. L’éthanol est plus lourd que l’eau : il faut tenir compte des masses molaires.', 0.01],
          [0.9 * ew.MA, 'Il manque la division : w = (masse d’éthanol) / (masse totale d’éthanol et d’eau), pas seulement la masse d’éthanol.'],
          [wDe({ MA: ew.MB, MB: ew.MA }, 0.9), 'Masses molaires inversées : M_A = 46 g·mol⁻¹ est celle de l’éthanol, M_B = 18 g·mol⁻¹ celle de l’eau.']],
        expl: 'w = 0,90 × 46 / (0,90 × 46 + 0,10 × 18) ≈ 0,958, soit environ 96° : on retrouve le « 95° » du distillat de la distillation fractionnée.', indice: "w = x·M_éthanol ÷ (x·M_éthanol + (1 − x)·M_eau)." } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenirTitre: 'À RETENIR : LE BILAN',
      retenir: <>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Réfractomètre</strong> : la frontière clair – sombre (angle limite) donne l’indice n du liquide ; compensateur → n<sub>D</sub> à 20 °C.</li>
          <li><strong>Lecture</strong> : graduation + dixième de graduation → 4 décimales, n sans unité.</li>
          <li><strong>Composition</strong> : courbe d’étalonnage n = f(x) ; pour eau – éthanol, <strong>deux compositions</strong> possibles pour un même n.</li>
          <li>On choisit grâce au <strong>contexte</strong> (azéotrope, température en tête), puis x → w → degré alcoolique.</li>
        </ul>
      </>,
      texte: <>Vous savez lire un réfractomètre, passer de l’indice à la composition, et lever l’ambiguïté grâce au contexte. Vous pouvez maintenant tester d’autres échantillons en mode exploration.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const idCourant = ETAPES[Math.min(etape, ETAPES.length - 1)].id;

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const tire = t => t[Math.floor(Math.random() * t.length)];
    setGoutte(true); setComp(false); tourne(1.3500);
    setDefi({ x: tire([0.04, 0.08, 0.15, 0.25, 0.35, 0.8, 0.85, 0.9, 0.95, 1.0]), reps: {}, verifie: false });
  }
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi();
    if (md === 'defi' && defi) { setGoutte(true); }
    if (md === 'guide') { setX(0.9); setGoutte(false); setComp(false); tourne(1.3500); }
    if (md === 'explore') { setGoutte(true); setComp(true); }
  }
  const voletDefi = defi && (() => {
    const n = nExacte(defi.x), c = compositions(n), x1 = c[0];
    const Q = [
      { id: 'q1', q: <>Indice de réfraction n de l’échantillon (lu sur l’échelle, 4 décimales)</>, unite: '', vrai: n, tol: 0.00015, aff: nf(n, 4) },
      { id: 'q2', q: <>Combien de compositions en éthanol sont compatibles avec cet indice ? (1 ou 2)</>, unite: '', vrai: c.length, tol: 0, aff: String(c.length) },
      { id: 'q3', q: <>Fraction molaire x en éthanol de la première composition possible (la plus petite)</>, unite: '', vrai: x1, tol: 0.1, aff: nf(x1, 2) },
      { id: 'q4', q: <>Fraction massique w en éthanol correspondant à cette composition</>, unite: '', vrai: wDe(ew, x1), tol: 0.06, aff: nf(wDe(ew, x1), 3) },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
          Une goutte d’un mélange eau – éthanol de composition <strong>inconnue</strong> est déposée sur le prisme. Activez le compensateur, amenez la frontière sur le réticule avec la molette, lisez l’indice, puis utilisez la courbe d’étalonnage. Répondez avec 3 chiffres significatifs (4 décimales pour n).
        </div>
        {Q.map((qu, k) => {
          const rep = defi.reps[qu.id] || '', ok = proche(lireNombre(rep), qu.vrai, qu.tol);
          return (
            <div key={qu.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {qu.q}</div>
              {INDICE_Q[qu.id] && <IndiceDefi cache={defi.verifie && ok}>{INDICE_Q[qu.id]}</IndiceDefi>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={rep} placeholder="?" aria-label={`Réponse ${k + 1}`} onChange={ev => { const v = ev.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [qu.id]: v } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 120 }}/>
                {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {qu.aff}</div>}
            </div>);
        })}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => { noterDefi(Q.every(qu => proche(lireNombre(defi.reps[qu.id] || ''), qu.vrai, qu.tol))); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={nouveauDefi} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        </div>
      </div>);
  })();

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température</strong> : l’indice dépend de la température (environ −4 × 10⁻⁴ par °C pour un liquide usuel). La courbe d’étalonnage est donnée à 20 °C ; il faut thermostater le prisme.</li>
      <li><strong>Longueur d’onde</strong> : n est mesuré pour la raie D du sodium (589 nm) grâce au compensateur ; avec de la lumière blanche, la frontière est irisée.</li>
      <li><strong>Mélange binaire</strong> : eau et éthanol seulement. Un autre soluté (sucre, sels) changerait n et fausserait la composition.</li>
      <li><strong>Film homogène</strong> : la goutte est supposée de composition uniforme et ne s’évapore pas (l’éthanol est volatil : il faut mesurer vite, prisme refermé).</li>
      <li><strong>Courbe d’étalonnage</strong> : simplifiée d’après le document du TP (n = 1,333 pour l’eau, maximum d’environ 1,366 vers x = 0,6, 1,3615 pour l’éthanol pur). La lecture sur courbe papier est moins précise que le calcul du simulateur.</li>
      <li><strong>Lecture à 10⁻⁴</strong> : estimée à l’œil au dixième de graduation ; l’incertitude de lecture est de quelques 10⁻⁴, ce qui donne environ ±0,01 sur x lorsque la courbe est pentue, mais beaucoup plus près du maximum où la courbe est plate.</li>
      <li><strong>Deux compositions</strong> : une mesure d’indice seule est ambiguë pour n &gt; 1,3615 ; il faut une information supplémentaire (température en tête de colonne, étape de la distillation, un 2ᵉ mesure après dilution…).</li>
    </ul>);
  const panneauHypo = (
    <div style={styleBoite}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défi</button>
      {naviguer && <button onClick={() => naviguer(41)} style={styleBouton(false, '#0b4f94')}><Pic n="testtube"/>Distillation</button>}
    </span>);

  const presets = [['vin', 0.04], ['1ères gouttes (simple)', 0.29], ['mélange 50 %', 0.5], ['distillat fractionné', 0.9]];
  const reglages = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {!enDefi && (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {presets.map(([l, v]) => <button key={l} disabled={enGuide} onClick={() => { setX(v); setGoutte(true); }} style={stylePetitBouton(Math.abs(x - v) < 1e-9, '#0891b2')}>{l}</button>)}
          </div>
          <Curseur nom={<>x : fraction molaire en éthanol de l’échantillon</>} valeur={x} onChange={v => setX(Math.round(v * 100) / 100)} min={0} max={1} pas={0.01} decimales={2} couleur="#0891b2"/>
        </>)}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => setGoutte(g => !g)} style={stylePetitBouton(goutte, '#0891b2')}>{goutte ? '💧 échantillon déposé' : '💧 déposer la goutte'}</button>
        <button onClick={() => setComp(c => !c)} style={stylePetitBouton(comp, '#7c3aed')}>{comp ? '🌈 compensateur actif' : '🌈 compensateur inactif'}</button>
      </div>
      <Curseur nom="Molette : indice sous le repère" valeur={nR} onChange={tourne} min={1.330} max={1.370} pas={0.0001} decimales={4} couleur="#ea580c"/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => tourne(nR - 0.001)} style={stylePetitBouton(false)} aria-label="Diminuer de 0,001">◀◀</button>
        <button onClick={() => tourne(nR - 0.0001)} style={stylePetitBouton(false)} aria-label="Diminuer de 0,0001">◀</button>
        <button onClick={() => tourne(nR + 0.0001)} style={stylePetitBouton(false)} aria-label="Augmenter de 0,0001">▶</button>
        <button onClick={() => tourne(nR + 0.001)} style={stylePetitBouton(false)} aria-label="Augmenter de 0,001">▶▶</button>
        <span style={{ fontSize: 12.5, color: KIT.txt2 }}>pas 0,001 (◀◀ ▶▶) ou 0,0001 (◀ ▶)</span>
      </div>
      <label style={{ fontSize: 12.5, color: KIT.txt2, display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}><input type="checkbox" checked={anim} onChange={ev => setAnim(ev.target.checked)}/> animer</label>
      {mode === 'explore' && <label style={{ fontSize: 12.5, color: KIT.txt2, display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={lectureNum} onChange={ev => setLectureNum(ev.target.checked)}/> afficher la valeur lue (pour vérifier)</label>}
    </div>);

  const cEtat = !goutte ? 'pas d’échantillon' : aligne ? (comp ? '✔ frontière sur le réticule' : 'sur le réticule, mais irisée') : Math.abs(ecart) < 0.001 ? 'presque : affinez' : 'frontière loin du réticule';
  const mesures = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Lectures</div>
      <LigneMesure nom="état du champ" valeur={cEtat} couleur={aligne && comp ? '#15803d' : '#475569'}/>
      {mode === 'explore' && lectureNum && <LigneMesure nom={<>n<sub>D</sub><sup>20</sup> sous le repère</>} valeur={nf(nR, 4)} couleur="#9a3412"/>}
      {mode === 'explore' && goutte && <LigneMesure nom="composition de l’échantillon" valeur={`${nf(x, 2)}${NB}(fraction molaire) ; w = ${nf(wDe(ew, x), 3)}`}/>}
      {mode === 'explore' && goutte && <LigneMesure nom="degré alcoolique (à 20 °C)" valeur={`${nf(degre(wDe(ew, x)), 1)}${NB}°`}/>}
      {mode === 'explore' && goutte && aligne && <LigneMesure nom="compositions compatibles" valeur={cands.map(c => nf(c, 2)).join(' ou ')} couleur="#9a3412"/>}
    </div>);

  const montreCourbe = enGuide ? ['courbe', 'deux', 'choix', 'degre', 'bravo'].includes(idCourant) : true;
  const lecture = enDefi ? aligne : aligne;
  const champ = (
    <div style={{ ...styleBoite, ...cadre('champ') }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Ce que l’on voit dans l’oculaire</div>
      <Oculaire nE={nE} nR={nR} goutte={goutte} comp={comp}/>
      <div style={{ fontSize: 12, color: KIT.txt2, marginTop: 4 }}>Croix : réticule. À droite, l’échelle des indices (graduations de 0,001) ; le triangle rouge est l’index de lecture.</div>
    </div>);
  const principe = (
    <div style={{ ...styleBoite, ...cadre('principe') }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Le prisme et la goutte</div>
      <Principe goutte={goutte} anim={anim}/>
    </div>);
  const courbe = (
    <div style={{ ...styleBoite, ...cadre('courbe') }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Courbe d’étalonnage eau – éthanol (20 °C)</div>
      {montreCourbe ? <Etalonnage nR={nR} lecture={lecture} candidats={enDefi ? [] : (lecture ? cands : [])} xVrai={mode === 'explore' && goutte ? x : null}/>
        : <div style={{ fontSize: 13.5, color: KIT.txt2, padding: '10px 4px' }}>La courbe d’étalonnage apparaîtra quand vous aurez mesuré l’indice.</div>}
      <div style={{ fontSize: 12, color: KIT.txt2 }}>{enDefi ? 'Ligne orange : votre lecture. Cherchez où elle coupe la courbe.' : 'Ligne orange : votre lecture n. Points orange : compositions compatibles. Point vert : composition réelle de l’échantillon (exploration).'}</div>
    </div>);
  const diagRef = (
    <div style={{ ...styleBoite, ...cadre('diagramme') }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Diagramme isobare eau – éthanol (rappel)</div>
      <Diagramme m={ew} pt={{ xB: 0.04 }} N={0} escalierVisible={false}/>
      <div style={{ fontSize: 12, color: KIT.txt2 }}>Azéotrope : {nf(ew.az[0], 3)} ; {nf(ew.az[1], 1)}{NB}°C. La température en tête renseigne sur la composition de la vapeur.</div>
    </div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .rf-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .rf-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .rf-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .rf-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(300px, 1fr) minmax(300px, 1fr); }
        .rf-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (max-width: 900px) { .rf-l1.cote, .rf-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Réfractomètre : lire un indice de réfraction</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un réfractomètre mesure l’indice de réfraction n d’un liquide ; avec une courbe d’étalonnage, on en déduit la <strong>composition</strong> d’un mélange eau – éthanol (par exemple un distillat).</div>
      <div className={`rf-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div>
          {enDefi && <div style={{ ...styleBoite, marginBottom: 12 }}><>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></></div>}
          <div className={`rf-pri${mode !== 'explore' ? ' pile' : ''}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{champ}{mesures}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{reglages}{!enDefi && principe}</div>
          </div>
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : enDefi ? panneauHypo : null}
      </div>
      <div className="rf-l2">
        {courbe}
        {(enGuide || enDefi) ? (idCourant === 'choix' ? diagRef : null) : panneauHypo}
      </div>
      {mode === 'explore' && (
        <div className="rf-l2">
          <div style={styleBoite}>
            <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
              <li>Désactivez le compensateur : que devient la frontière ? Pourquoi une lumière blanche pose-t-elle problème ?</li>
              <li>Sans échantillon déposé, que voit-on ? Et si on ne tourne pas la molette ?</li>
              <li>Mesurez le vin (x = 0,04), les premières gouttes d’une distillation simple (x = 0,29) et le distillat fractionné (x = 0,90) : que remarquez-vous pour n ?</li>
              <li>Cherchez deux échantillons de compositions différentes qui ont le même indice. Où se trouve le maximum de la courbe ?</li>
              <li>Près du maximum (x entre 0,5 et 0,7), pourquoi la composition est-elle difficile à déduire de n ?</li>
            </ul>
          </div>
          <ARetenir>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
              <li>la frontière clair – sombre se place selon l’indice de l’échantillon</li>
              <li>on la ramène sur le réticule, puis on lit l’échelle : 4 décimales</li>
              <li>courbe d’étalonnage : n → x, mais deux compositions possibles pour n &gt; 1,3615</li>
            </ul>
          </ARetenir>
        </div>
      )}
    </div>
  );
}
