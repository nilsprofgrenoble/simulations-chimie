import { useState, useEffect, useRef, useMemo } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, indicesProfond, lireNombre, proche } from "../commun";
import { FLUIDES, rhoDe, facteurConv, sig, sciTxt, nf, analyser, Un, Chaine, ConvPrefixe, RhoLigne, AlerteRho } from "./DebitsFluides";

// ====================================================
//  SIM 28 — DÉBIT ET VITESSE D'ÉCOULEMENT : Qv = v·S, v₁·S₁ = v₂·S₂
// ====================================================

// ── Modèle (fonctions pures) ──
// Fluide incompressible, régime permanent, tuyau plein, vitesse uniforme sur la section (vitesse moyenne) :
//   Qv = v · S     S = π D² / 4     Qv = v₁·S₁ = v₂·S₂ (conservation)     Qm = ρ · Qv     ρ = d × ρ_eau
// Les données (D, Qv) ont 2 chiffres significatifs, les résultats aussi ; les valeurs intermédiaires en gardent 3.
const DIAMS = [10, 20, 25, 30, 40, 50, 60, 80];                     // mm, 2 chiffres significatifs
const suite = (a, b, pas, dec = 3) => { const t = []; for (let x = a; x <= b + 1e-9; x += pas) t.push(Number(x.toFixed(dec))); return t; };
const DEBITS = {                                                   // valeurs à 2 chiffres significatifs dans chaque unité
  'L/s': [...suite(0.10, 0.95, 0.05, 2), ...suite(1.0, 2.0, 0.1, 1)],
  'L/min': suite(10, 95, 5, 0),
  'm³/h': suite(0.5, 9.5, 0.5, 1),
};
const FACT_SI = { 'L/s': 1e-3, 'L/min': 1e-3 / 60, 'm³/h': 1 / 3600 };    // pour passer en m³·s⁻¹
const UNITE_Q = { 'L/s': 'L·s⁻¹', 'L/min': 'L·min⁻¹', 'm³/h': 'm³·h⁻¹' };
const qSI = (q, u) => q * FACT_SI[u];
const surface = D => Math.PI * (D / 1000) ** 2 / 4;                // m², D en mm

// Valeurs du parcours guidé : huile d'olive, D₁ = 40 mm, D₂ = 20 mm, Qv = 0,50 L·s⁻¹
const G = { D1: 40, D2: 20, Q: 0.5, fl: 'huile', D2b: 10 };
G.rho = rhoDe(FLUIDES[G.fl].d);                                     // 920 kg·m⁻³
G.qsi = qSI(G.Q, 'L/s');                                            // 5,0·10⁻⁴ m³·s⁻¹
G.S1 = surface(G.D1); G.S2 = surface(G.D2); G.S2b = surface(G.D2b);
G.v1 = G.qsi / G.S1; G.v2 = G.qsi / G.S2; G.v2b = G.qsi / G.S2b;
G.qm = G.rho * G.qsi;                                               // 0,46 kg·s⁻¹

// ── Chaînes de calcul avec unités ──
const sD = D => sig(D / 1000, 2);                                   // « 0,040 »
const chD = D => [{ num: [{ n: D, s: String(D), u: 'mm' }], den: [] }, facteurConv('mm', 'm', 'num')];
const chS = D => [{ num: [{ n: Math.PI, s: 'π' }], den: [{ n: 4 }] },
  { num: [{ n: D / 1000, s: sD(D), u: 'm' }], den: [] }, { num: [{ n: D / 1000, s: sD(D), u: 'm' }], den: [] }];
function chQsi(q, u) {
  if (u === 'L/s') return [{ num: [{ n: q, s: sig(q, 2), u: 'L' }], den: [{ u: 's' }] }, facteurConv('L', 'm³', 'num')];
  if (u === 'L/min') return [{ num: [{ n: q, s: sig(q, 2), u: 'L' }], den: [{ u: 'min' }] }, facteurConv('L', 'm³', 'num'), facteurConv('min', 's', 'den')];
  return [{ num: [{ n: q, s: sig(q, 2), u: 'm³' }], den: [{ u: 'h' }] }, facteurConv('h', 's', 'den')];
}
const chV = (q, S) => [{ num: [{ n: q, s: sciTxt(q, 2), u: 'm³' }], den: [{ u: 's' }] }, { div: true, num: [{ n: S, s: sciTxt(S, 3), u: 'm²' }], den: [] }];
const litS = k => `π × R_${k}² = π × (D_${k} / 2)² = π × D_${k}² / 4`;
const chQm = (rho, q) => [{ compact: true, num: [{ n: rho, u: 'kg' }], den: [{ u: 'm³' }] }, { num: [{ n: q, s: sciTxt(q, 2), u: 'm³' }], den: [{ u: 's' }] }];

// ── Schéma animé : un tuyau qui change de section, des tranches de fluide de même volume ──
// L'animation ne passe pas par React (pas de re-rendu à chaque image) : on met à jour directement quelques éléments SVG
// à chaque image (requestAnimationFrame), à partir du temps écoulé, ce qui reste fluide.
const X0 = 20, XA = 320, XB = 420, X1 = 740, CY = 98, KMAX = 80, VPX = 150, KR = 0.55;   // échelle K (px·s⁻¹ pour 1 m·s⁻¹) : 80 au plus, réduite pour que la plus grande vitesse reste ≤ 150 px·s⁻¹ ; rayon en px = KR × D (mm)
const NC = 6, NRANG = 5, ESP = 14, XP = X0 + 24, NPAQ = 3;                    // paquet de points : 6 colonnes × 5 rangées, espacées de 14 px
const RANGS = [-0.75, -0.375, 0, 0.375, 0.75];                                // position relative dans la section (0 : axe, ±1 : paroi)
function Tuyau({ qv, D1, D2, coul, animer, vit, cmd }) {
  const gBandes = useRef(null), gLignes = useRef(null), pts = useRef([]);
  const temps = useRef(0), dernier = useRef(null), paquets = useRef([]), cmdVue = useRef({ n: 0, eff: 0 });
  const dloc = x => (x <= XA ? D1 : x >= XB ? D2 : D1 + (D2 - D1) * (x - XA) / (XB - XA));
  // temps de parcours T(x) depuis l'entrée (tableau, un point par pixel) : positions des tranches à l'état stationnaire
  const table = useMemo(() => {
    const K = Math.min(KMAX, VPX / (qv / surface(Math.min(D1, D2))));
    const t = [0];
    for (let x = X0; x < X1; x++) {
      const xm = x + 0.5, D = xm <= XA ? D1 : xm >= XB ? D2 : D1 + (D2 - D1) * (xm - XA) / (XB - XA);
      t.push(t[t.length - 1] + 1 / (K * qv / surface(D)));
    }
    return t;
  }, [qv, D1, D2]);
  const posAge = a => {                                          // position d'une tranche entrée il y a « a » secondes
    if (a >= table[table.length - 1]) return null;
    let lo = 0, hi = table.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (table[mid] <= a) lo = mid; else hi = mid; }
    return X0 + lo + (a - table[lo]) / (table[hi] - table[lo]);
  };
  const rayon = x => KR * dloc(x);
  const dessin = useRef(null);
  dessin.current = () => {
    const t = temps.current, ph = t - Math.floor(t), cyc = Math.floor(t);
    let bandes = '', lignes = '', prec = X0;
    for (let n = 0; n < 2500; n++) {
      const x = posAge(ph + n), xe = x == null ? X1 : x;
      if ((((n - 1 + cyc) % 2) + 2) % 2 === 0) bandes += `M${prec.toFixed(1)} 0H${xe.toFixed(1)}V200H${prec.toFixed(1)}Z`;
      if (x == null) break;
      lignes += `M${x.toFixed(1)} ${(CY - rayon(x)).toFixed(1)}V${(CY + rayon(x)).toFixed(1)}`;
      prec = x;
    }
    if (gBandes.current) gBandes.current.setAttribute('d', bandes);
    if (gLignes.current) gLignes.current.setAttribute('d', lignes);
    pts.current.forEach(c => c && c.setAttribute('visibility', 'hidden'));
    paquets.current.forEach((t0, j) => {
      for (let c = 0; c < NC; c++) {
        const age0 = table[XP + c * ESP - X0] + (t - t0);
        const x = posAge(age0);
        for (let k = 0; k < NRANG; k++) {
          const el = pts.current[(j * NC + c) * NRANG + k];
          if (!el) continue;
          if (x == null) continue;
          el.setAttribute('cx', x.toFixed(1)); el.setAttribute('cy', (CY + RANGS[k] * rayon(x)).toFixed(1)); el.setAttribute('visibility', 'visible');
        }
      }
    });
  };
  useEffect(() => {                                              // lâcher / effacer les paquets de points
    const v = cmdVue.current;
    if (cmd.n < v.n || cmd.eff > v.eff) paquets.current = [];
    if (cmd.n > v.n && cmd.n > cmd.eff) paquets.current = [...paquets.current.slice(-(NPAQ - 1)), temps.current];
    cmdVue.current = { n: cmd.n, eff: cmd.eff };
    dessin.current();
  }, [cmd]);
  useEffect(() => { paquets.current = []; dessin.current(); }, [table]);     // le réglage change : on repart de zéro
  useEffect(() => {
    if (!animer) { dernier.current = null; dessin.current(); return undefined; }
    let raf;
    const boucle = ts => {
      if (dernier.current != null) temps.current += Math.min(0.1, (ts - dernier.current) / 1000) * vit;
      dernier.current = ts; dessin.current(); raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => { cancelAnimationFrame(raf); dernier.current = null; };
  }, [animer, vit]);
  const contour = `M${X0},${CY - rayon(X0)} H${XA} L${XB},${CY - rayon(XB)} H${X1} V${CY + rayon(X1)} H${XB} L${XA},${CY + rayon(XA)} H${X0} Z`;
  const fond = coul === '#f1f5f9' ? '#cbd5e1' : coul;
  const cotes = [[170, D1, 1], [580, D2, 2]];
  return (
    <svg viewBox="0 0 760 200" style={{ width: '100%', display: 'block' }} role="img" aria-label="Tuyau à deux sections et tranches de fluide">
      <defs><clipPath id="vd-clip"><path d={contour}/></clipPath></defs>
      <g clipPath="url(#vd-clip)">
        <rect x={X0} y="0" width={X1 - X0} height="200" fill={fond} fillOpacity="0.2"/>
        <path ref={gBandes} fill={fond} fillOpacity="0.4"/>
      </g>
      <path ref={gLignes} fill="none" stroke="#1e293b" strokeOpacity="0.28" strokeWidth="1"/>
      <path d={contour} fill="none" stroke="#475569" strokeWidth="4" strokeLinejoin="round"/>
      {Array.from({ length: NPAQ * NC * NRANG }, (_, i) => (
        <circle key={i} ref={el => { pts.current[i] = el; }} r="2.6" cx="0" cy="0" fill="#0f172a" stroke="white" strokeWidth="0.8" visibility="hidden"/>))}
      <text x={X0} y="22" fontSize="12" fill="#334155">écoulement →</text>
      <text x={X1} y="22" fontSize="12" fill="#334155" textAnchor="end">Q<tspan fontSize="9" dy="3">v</tspan><tspan dy="-3"> = {sig(qv * 1000, 2)} L·s⁻¹</tspan></text>
      {cotes.map(([x, D, k]) => (
        <g key={k}>
          <line x1={x} x2={x} y1={CY - rayon(x)} y2={CY + rayon(x)} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 3"/>
          <text x={x} y={CY + rayon(x) + 20} textAnchor="middle" fontSize="13" fontWeight="700" fill="#b91c1c">section {k}</text>
          <text x={x} y={CY + rayon(x) + 36} textAnchor="middle" fontSize="12.5" fill="#334155">D<tspan fontSize="9" dy="3">{k}</tspan><tspan dy="-3"> = {D} mm</tspan></text>
        </g>))}
      <text x={X0} y="193" fontSize="11" fill="#64748b">Chaque bande = fluide qui traverse une section en 1 s (volume identique partout). Schéma non à l’échelle : diamètres agrandis.</text>
    </svg>
  );
}

const QM_UNITE = 'kg·s⁻¹';

export function SimulationVitesseDebit() {
  const [mode, setMode] = useState('explore');
  const [guide, setGuide] = useEtatPersistant('vitesse-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [fluide, setFluide] = useState('eau');
  const [D1, setD1] = useState(40);
  const [D2, setD2] = useState(20);
  const [uQ, setUQ] = useState('L/s');
  const [q, setQ] = useState(0.5);
  const [anim, setAnim] = useState(() => { try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return true; } });
  const [vit, setVit] = useState(1);                              // 1 : temps réel ; 0,4 : ralenti
  const [cmd, setCmd] = useState({ n: 0, eff: 0 });                 // paquets de points : lâchés / effacés
  const lacher = () => setCmd(c => ({ ...c, n: c.n + 1 }));
  const effacer = () => setCmd(c => ({ ...c, eff: c.n }));
  const paquetActif = cmd.n > cmd.eff;
  const enGuide = mode === 'guide';
  const d = FLUIDES[fluide].d, rho = rhoDe(d);
  const qsi = qSI(q, uQ), S1 = surface(D1), S2 = surface(D2), v1 = qsi / S1, v2 = qsi / S2;
  const liste = DEBITS[uQ], iq = Math.max(0, liste.findIndex(x => Math.abs(x - q) < 1e-9));
  function changerUnite(u) {
    const cible = qsi / FACT_SI[u];
    const proche_ = DEBITS[u].reduce((a, x) => (Math.abs(x - cible) < Math.abs(a - cible) ? x : a), DEBITS[u][0]);
    setUQ(u); setQ(proche_);
  }

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const reglageGuide = fluide === G.fl && D1 === G.D1 && D2 === G.D2 && uQ === 'L/s' && Math.abs(q - G.Q) < 1e-9;
  const reglageB = fluide === G.fl && D1 === G.D1 && D2 === G.D2b && uQ === 'L/s' && Math.abs(q - G.Q) < 1e-9;
  const reglerGuide = () => { setFluide(G.fl); setD1(G.D1); setD2(G.D2); setUQ('L/s'); setQ(G.Q); };
  const ETAPES = [
    { id: 'observer', titre: 'Observer l’écoulement', focus: ['manip'],
      texte: <>Un fluide s’écoule de gauche à droite dans un tuyau dont la section <strong>se rétrécit</strong>. Chaque bande du schéma est la tranche de fluide qui traverse une section pendant <strong>1 s</strong>. Observez l’animation : les tranches avancent plus ou moins vite selon l’endroit.</>,
      tache: { type: 'qcm', q: 'Où le fluide avance-t-il le plus vite ?', options: ['Dans la partie étroite du tuyau', 'Dans la partie large du tuyau', 'Partout à la même vitesse'], bonne: 0,
        expl: 'Dans la partie étroite, une tranche parcourt plus de distance en 1 s : le fluide y est plus rapide. Reste à comprendre pourquoi, puis à le calculer.' } },
    { id: 'regler', titre: 'Régler l’expérience', focus: ['manip'],
      texte: <>Fluide : l’<strong>huile d’olive</strong> (d = 0,92). Section 1 : <strong>D₁ = 40 mm</strong>. Section 2 : <strong>D₂ = 20 mm</strong>. Débit volumique réglé : <strong>Q<sub>v</sub> = 0,50 L·s⁻¹</strong>.</>,
      tache: { type: 'action', ok: reglageGuide, label: 'Régler l’expérience', faire: reglerGuide, consigne: reglageGuide ? null : 'Cliquez pour régler le fluide, les diamètres et le débit' } },
    { id: 'tranche', titre: 'Le volume d’une tranche', focus: ['manip'],
      texte: <>Un débit volumique est un volume par unité de temps : Q<sub>v</sub> = V / Δt. Chaque bande est le fluide qui traverse une section pendant Δt = 1 s.</>,
      tache: { type: 'num', q: 'Volume V d’une tranche (1 s de débit)', unite: 'L', vrai: G.Q, tol: 0.01, affiche: x => sig(x, 2),
        pieges: [[500, 'Il y a 0,50 L en 1 s, pas 500 : Q_v = 0,50 L·s⁻¹ donc V = Q_v × 1 s = 0,50 L.']],
        expl: 'V = Q_v × Δt = 0,50 L·s⁻¹ × 1 s = 0,50 L. Toutes les tranches ont ce même volume, que le tuyau soit large ou étroit : sinon du fluide s’accumulerait ou disparaîtrait.' } },
    { id: 'paquet', titre: 'Suivre un paquet de fluide', focus: ['manip'],
      texte: <>Pour mieux voir comment le fluide se déforme, on marque un « paquet » de fluide avec des <strong>points noirs régulièrement espacés</strong> sur toute la largeur du tuyau. Lâchez-le et suivez-le jusqu’à la section étroite (si besoin, choisissez « Ralenti »).</>,
      tache: { type: 'action', ok: paquetActif, label: 'Lâcher un paquet de points', faire: lacher, consigne: paquetActif ? null : 'Appuyez sur « Lâcher un paquet de points »' } },
    { id: 'longueur', titre: 'Une tranche dans un tuyau plus étroit', focus: ['manip'],
      texte: <>Le volume d’une tranche est le même dans les deux sections, mais la section du tuyau a changé.</>,
      tache: { type: 'qcm', q: 'Dans la section étroite, la longueur d’une tranche est…', options: ['plus grande, pour garder le même volume', 'plus petite, parce que le tuyau est plus petit', 'identique, parce que le volume est identique'], bonne: 0,
        expl: 'Le volume d’un cylindre est V = S × longueur. À volume égal, une section plus petite impose une tranche plus longue. Et cette longueur est la distance parcourue en 1 s : c’est la vitesse du fluide.' } },
    { id: 'relation', titre: 'Débit, vitesse, section', focus: [],
      texte: <>Une tranche de longueur L = v × Δt, de section S, a pour volume <strong>V = S × v × Δt</strong>. Le débit volumique est donc Q<sub>v</sub> = V / Δt. Regardez aussi les <strong>unités</strong> : Q<sub>v</sub> en m³·s⁻¹, v en m·s⁻¹, S en m².</>,
      tache: { type: 'qcm', q: 'Quelle relation lie Q_v, v et S ?', options: ['Q_v = v × S', 'Q_v = v / S', 'Q_v = S / v'], bonne: 0,
        expl: <>Q<sub>v</sub> = v × S. Contrôle des unités : <Un u="m"/>·<Un u="s" inv/> × <Un u="m²"/> = <Un u="m³"/>·<Un u="s" inv/>, ce sont bien des m³·s⁻¹. Pour un même débit, v est donc inversement proportionnelle à S.</> } },
    { id: 'Dm', titre: 'Le diamètre en mètres', focus: [],
      texte: <>
        <p style={{ margin: '0 0 8px' }}>Le tuyau est circulaire : S = π D² / 4. Mais pour obtenir des m², il faut D en <strong>mètres</strong>. Les diamètres sont donnés en millimètres. Quand on change de préfixe, on utilise une <strong>puissance de 10</strong> : le préfixe « m » (milli) vaut 10⁻³, donc 1 mm = 10⁻³ m. Exemple : 25 mm en m, avec les unités dans le calcul :</p>
        <ConvPrefixe nom="D" n={25} de="mm" vers="m" e={-3}/>
        <p style={{ margin: '8px 0 0' }}>Faites de même pour D₁ = 40 mm.</p>
      </>,
      tache: { type: 'num', q: 'D₁ en m', unite: 'm', vrai: 0.04, tol: 0.001, affiche: x => sig(x, 2),
        pieges: [[0.4, '1 mm = 10⁻³ m : 40 mm = 40 × 10⁻³ m = 0,040 m, et non 0,4 m (ce serait 40 cm).'], [40000, 'On passe des mm aux m : le nombre diminue. 1 mm = 10⁻³ m (exposant négatif).']],
        expl: <ConvPrefixe nom="D_1" n={40} de="mm" vers="m" e={-3}/> } },
    { id: 'S1', titre: 'La section 1', focus: [],
      texte: <>
        <p style={{ margin: '0 0 8px' }}>On calcule S₁ = π D₁² / 4 avec D₁ en m. Les m se multiplient : m × m = <strong>m²</strong>.</p>
        <Chaine nom="S_1" litt={litS(1)} facteurs={chS(G.D1)} nsf={3} sci cacher/>
        <p style={{ margin: '8px 0 0' }}>Vous pouvez écrire 1,26e-3 ou 0,00126. On garde ici 3 chiffres significatifs (un de plus que les données) pour les calculs intermédiaires.</p>
      </>,
      tache: { type: 'num', q: 'S₁ en m²', unite: 'm²', vrai: G.S1, tol: 0.04, affiche: x => sciTxt(x, 3),
        pieges: [[Math.PI * 0.04 ** 2, 'La formule est π D² / 4 (ou π R² avec R = D / 2) : il manque la division par 4.'], [G.S1 * 1e6, 'Ce résultat est en mm² (calcul avec D en mm). Reprenez avec D₁ en m pour avoir des m².']],
        expl: <>S₁ = π × 0,040² / 4 ≈ 1,26 × 10⁻³ m².</> } },
    { id: 'qsi', titre: 'Le débit en m³·s⁻¹', focus: [],
      texte: <>Pour que v sorte en m·s⁻¹, il faut aussi Q<sub>v</sub> en <strong>m³·s⁻¹</strong>. On part de Q<sub>v</sub> = 0,50 L·s⁻¹. Convertissez en vérifiant que les L se simplifient.</>,
      tache: { type: 'num', q: 'Q_v en m³·s⁻¹', unite: 'm³·s⁻¹', vrai: G.qsi, tol: 0.01, affiche: x => sciTxt(x, 2),
        aide: '1 L = 10⁻³ m³ (soit 1 m³ = 10³ L). Le litre est au numérateur de Q_v : on multiplie par une fraction qui a des L au dénominateur.',
        pieges: [[0.5, 'Il manque la conversion : 0,50 L·s⁻¹ ne vaut pas 0,50 m³·s⁻¹.'], [500, '1 L = 10⁻³ m³ : le nombre diminue quand on passe aux m³.']],
        expl: <Chaine nom="Q_v" facteurs={chQsi(0.5, 'L/s')} nsf={2} sci/> } },
    { id: 'v1', titre: 'La vitesse dans la section 1', focus: [],
      texte: <>
        <p style={{ margin: '0 0 8px' }}>Q<sub>v</sub> = v × S donc <strong>v = Q<sub>v</sub> / S</strong>. Regardez les unités : m³·s⁻¹ ÷ m² = m·s⁻¹ (les m³ et m² donnent des m).</p>
        <Chaine nom="v_1" litt="Q_v / S_1" facteurs={chV(G.qsi, G.S1)} nsf={2} cacher/>
      </>,
      tache: { type: 'num', q: 'v₁ en m·s⁻¹', unite: 'm·s⁻¹', vrai: G.v1, tol: 0.02, affiche: x => sig(x, 2),
        pieges: [[G.qsi * G.S1, 'Vous avez multiplié : v = Q_v / S.'], [G.S1 / G.qsi, 'Attention à l’ordre : on divise Q_v par S.']],
        expl: 'v₁ = 5,0 × 10⁻⁴ / 1,26 × 10⁻³ ≈ 0,40 m·s⁻¹. On donne 2 chiffres significatifs, comme les données (D et Q_v).' } },
    { id: 'S2', titre: 'La section 2', focus: [],
      texte: <>Même méthode pour D₂ = 20 mm : convertissez D₂ en m, puis calculez S₂ = π D₂² / 4.</>,
      tache: { type: 'num', q: 'S₂ en m²', unite: 'm²', vrai: G.S2, tol: 0.04, affiche: x => sciTxt(x, 3),
        pieges: [[G.S1, 'C’est S₁ : D₂ vaut 20 mm, pas 40 mm.'], [G.S2 * 1e6, 'Ce résultat est en mm² : refaites avec D₂ en m.']],
        expl: <Chaine nom="S_2" litt={litS(2)} facteurs={chS(G.D2)} nsf={3} sci/> } },
    { id: 'v2', titre: 'La vitesse dans la section 2', focus: [],
      texte: <>Avec le même débit Q<sub>v</sub> = 5,0 × 10⁻⁴ m³·s⁻¹, calculez v₂ = Q<sub>v</sub> / S₂.</>,
      tache: { type: 'num', q: 'v₂ en m·s⁻¹', unite: 'm·s⁻¹', vrai: G.v2, tol: 0.02, affiche: x => sig(x, 2),
        pieges: [[G.v1, 'C’est v₁ : la section 2 est plus petite, donc le fluide y est plus rapide.']],
        expl: <><Chaine nom="v_2" litt="Q_v / S_2" facteurs={chV(G.qsi, G.S2)} nsf={2}/></> } },
    { id: 'continuite', titre: 'Ce qui se conserve', focus: ['manip'],
      texte: <>Vous avez trouvé v₂ plus grande que v₁ alors que S₂ est plus petite. Calculez les produits : v₁ × S₁ = 0,40 × 1,26 × 10⁻³ ≈ 5,0 × 10⁻⁴ m³·s⁻¹ et v₂ × S₂ = 1,6 × 3,14 × 10⁻⁴ ≈ 5,0 × 10⁻⁴ m³·s⁻¹.</>,
      tache: { type: 'qcm', q: 'Que peut-on dire du débit volumique Q_v entre les sections 1 et 2 ?', options: ['Il est le même : v₁·S₁ = v₂·S₂', 'Il est plus grand dans la section étroite', 'Il est plus grand dans la section large'], bonne: 0,
        expl: 'Le fluide est incompressible et le régime permanent : tout le volume qui entre dans le tuyau en 1 s en ressort. C’est l’équation de continuité v₁S₁ = v₂S₂. Quand S diminue, v augmente dans les mêmes proportions.' } },
    { id: 'rapport', titre: 'Prévoir avant de calculer', focus: [],
      texte: <>On garde D₁ = 40 mm et Q<sub>v</sub>, mais on <strong>divise D₂ par 2</strong> : D₂ = 10 mm. Sans calculer S₂, prévoyez : par quel facteur v₂ est-elle multipliée ? Attention : S dépend de D<strong>²</strong>.</>,
      tache: { type: 'num', q: 'Facteur de multiplication de v₂', unite: '', vrai: 4, tol: 0.01, affiche: x => sig(x, 1),
        pieges: [[2, 'Si D est divisé par 2, S = π D² / 4 est divisée par 4 (et non par 2), donc v est multipliée par 4.']],
        expl: 'S ∝ D² : D divisé par 2, S divisée par 4, et comme v = Q_v / S, v₂ est multipliée par 4. Vérifions avec la simulation.' } },
    { id: 'verif', titre: 'Vérifier avec la simulation', focus: ['manip'],
      texte: <>Réglez D₂ = 10 mm (les tranches deviennent très longues dans la section 2), puis calculez v₂.</>,
      tache: { type: 'action', ok: reglageB, label: 'Régler D₂ = 10 mm', faire: () => { setFluide(G.fl); setD1(G.D1); setD2(G.D2b); setUQ('L/s'); setQ(G.Q); }, consigne: reglageB ? null : 'Cliquez pour régler D₂ = 10 mm' } },
    { id: 'v2b', titre: 'La vitesse avec D₂ = 10 mm', focus: [],
      texte: <>Calculez S₂ pour D₂ = 10 mm, puis v₂ = Q<sub>v</sub> / S₂, avec Q<sub>v</sub> = 5,0 × 10⁻⁴ m³·s⁻¹.</>,
      tache: { type: 'num', q: 'v₂ en m·s⁻¹ (D₂ = 10 mm)', unite: 'm·s⁻¹', vrai: G.v2b, tol: 0.02, affiche: x => sig(x, 2),
        bloque: !reglageB ? 'Réglez d’abord D₂ = 10 mm (étape précédente).' : null,
        pieges: [[G.v2 * 2, 'Ce serait ×2 : la section est divisée par 4, donc la vitesse est multipliée par 4.']],
        expl: 'v₂ ≈ 6,4 m·s⁻¹, soit 4 fois la valeur précédente (1,6 m·s⁻¹ × 4 ≈ 6,4) : la prévision était bonne.' } },
    { id: 'rho', titre: 'Masse volumique', focus: ['manip'],
      texte: <>
        <p style={{ margin: '0 0 8px' }}>Le fluide est de l’huile d’olive, de densité d = 0,92. Comme dans la simulation sur les débits : <strong>ρ = d × ρ<sub>eau</sub></strong>, avec ρ<sub>eau</sub> = 1 000 kg·m⁻³.</p>
        <AlerteRho/>
      </>,
      tache: { type: 'num', q: 'Masse volumique ρ de l’huile', unite: 'kg·m⁻³', vrai: G.rho, tol: 0.001, affiche: x => nf(x),
        pieges: [[0.92, 'La densité n’a pas d’unité : ρ = d × 1 000 kg·m⁻³.']],
        expl: <RhoLigne d={0.92}/> } },
    { id: 'qm', titre: 'Le débit massique', focus: [],
      texte: <>Le débit massique est le même dans les deux sections (régime permanent). Calculez Q<sub>m</sub> = ρ × Q<sub>v</sub>, avec Q<sub>v</sub> = 5,0 × 10⁻⁴ m³·s⁻¹ et ρ en kg·m⁻³.</>,
      tache: { type: 'num', q: 'Q_m en kg·s⁻¹', unite: 'kg·s⁻¹', vrai: G.qm, tol: 0.02, affiche: x => sig(x, 2),
        pieges: [[G.rho * 0.5, 'Il faut Q_v en m³·s⁻¹ : 0,50 L·s⁻¹ = 5,0 × 10⁻⁴ m³·s⁻¹.'], [G.qsi / G.rho, 'On multiplie : Q_m = ρ × Q_v (les m³ se simplifient).']],
        expl: <Chaine nom="Q_m" litt="ρ × Q_v" facteurs={chQm(G.rho, G.qsi)} nsf={2}/> } },
    { id: 'hypotheses', titre: 'Sur quoi repose ce raisonnement ?', focus: ['hypo'],
      texte: <>Lisez l’encadré « Hypothèses de travail ».</>,
      tache: { type: 'qcm', q: 'Pour que le débit volumique soit le même dans les deux sections, que suppose-t-on ?', options: ['Fluide incompressible, régime permanent, tuyau plein sans fuite', 'Fluide compressible, dont la masse volumique change le long du tuyau', 'Vitesse différente à chaque instant, selon un régime variable'], bonne: 0,
        expl: 'Si la masse volumique variait (gaz comprimé) ou si le régime n’était pas permanent (du fluide s’accumule), v₁S₁ ne serait pas égal à v₂S₂. Pour un liquide dans un tuyau plein, l’hypothèse est très bonne.' } },
    { id: 'chiffres', titre: 'Combien de chiffres significatifs ?', focus: [],
      texte: <>Les données D (40 mm, à lire 4,0 × 10¹ mm) et Q<sub>v</sub> (0,50 L·s⁻¹) ont <strong>2 chiffres significatifs</strong>. Vos calculs en ont donné davantage.</>,
      tache: { type: 'qcm', q: 'Avec combien de chiffres significatifs donner v₁ ?', options: ['2, comme les données D et Q_v', '3, comme S₁ = 1,26 × 10⁻³ m² calculée', '6, comme l’affichage de la calculatrice'], bonne: 0,
        expl: 'Un résultat n’est pas plus précis que la donnée la moins précise. S₁ en a 3 seulement parce qu’on garde un chiffre de plus dans les calculs intermédiaires ; au final, v₁ ≈ 0,40 m·s⁻¹ (2 chiffres significatifs).' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous savez relier débit, vitesse et section (Q<sub>v</sub> = v × S, v₁S₁ = v₂S₂), calculer une section à partir d’un diamètre en convertissant les unités, et prévoir comment la vitesse change quand le diamètre change. En exploration libre, changez l’unité du débit, les diamètres et le fluide, puis passez à la simulation suivante : la relation de Bernoulli.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const tire = t => t[Math.floor(Math.random() * t.length)];
    const dd = [20, 25, 30, 40, 50, 60, 80];
    const a = tire(dd); let b = tire(dd); while (b === a) b = tire(dd);
    const u = tire(['L/s', 'L/min', 'm³/h']);
    const lst = DEBITS[u].filter(x => qSI(x, u) / surface(Math.min(a, b)) < 4 && qSI(x, u) / surface(Math.max(a, b)) > 0.1);
    setDefi({ a, b, u, q: tire(lst), fl: tire(Object.keys(FLUIDES)), reps: {}, verifie: false, corr: false });
  }
  function changerMode(m) {
    setMode(m);
    if (m === 'defi' && !defi) nouveauDefi();
    if (m === 'guide') { setFluide('eau'); setD1(40); setD2(20); setUQ('L/s'); setQ(0.5); setCmd({ n: 0, eff: 0 }); }
  }
  const voletDefi = defi && (() => {
    const d0 = FLUIDES[defi.fl].d, r0 = rhoDe(d0), qs = qSI(defi.q, defi.u);
    const sA = surface(defi.a), sB = surface(defi.b), vA = qs / sA, vB = qs / sB;
    const Q = [
      { id: 'q1', q: <>Section S<sub>1</sub> du tuyau 1 (D<sub>1</sub> = {defi.a} mm), en <strong>m²</strong></>, unite: 'm²', vrai: sA, tol: 0.04, aff: sciTxt(sA, 3), ch: chS(defi.a), nom: 'S_1', litt: litS(1), sci: true, nsf: 3 },
      { id: 'q2', q: <>Vitesse v<sub>1</sub> du fluide dans le tuyau 1, en <strong>m·s⁻¹</strong></>, unite: 'm·s⁻¹', vrai: vA, tol: 0.03, aff: sig(vA, 2), ch: chV(qs, sA), nom: 'v_1', litt: 'Q_v / S_1', sci: false, nsf: 2 },
      { id: 'q3', q: <>Vitesse v<sub>2</sub> du fluide dans le tuyau 2 (D<sub>2</sub> = {defi.b} mm), en <strong>m·s⁻¹</strong></>, unite: 'm·s⁻¹', vrai: vB, tol: 0.03, aff: sig(vB, 2), ch: chV(qs, sB), nom: 'v_2', litt: 'Q_v / S_2', sci: false, nsf: 2 },
      { id: 'q4', q: <>Masse volumique ρ du fluide (en SI)</>, unite: 'kg·m⁻³', vrai: r0, tol: 0.002, aff: nf(r0), ch: null },
      { id: 'q5', q: <>Débit massique Q<sub>m</sub>, en <strong>kg·s⁻¹</strong></>, unite: 'kg·s⁻¹', vrai: r0 * qs, tol: 0.03, aff: sig(r0 * qs, 2), ch: chQm(r0, qs), nom: 'Q_m', litt: 'ρ × Q_v', sci: false, nsf: 2 },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
          Un tuyau de diamètre <strong>D<sub>1</sub> = {defi.a} mm</strong> se raccorde à un tuyau de diamètre <strong>D<sub>2</sub> = {defi.b} mm</strong>.
          Il transporte {FLUIDES[defi.fl].nom.toLowerCase()} (densité <strong>d = {String(d0).replace('.', ',')}</strong>) avec un débit volumique <strong>Q<sub>v</sub> = {sig(defi.q, 2)} {UNITE_Q[defi.u]}</strong>.
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>Rappels : Q<sub>v</sub> = v × S ; S = π D² / 4 ; Q<sub>m</sub> = ρ·Q<sub>v</sub> ; ρ = d × ρ<sub>eau</sub> avec ρ<sub>eau</sub> = 1 000 kg·m⁻³. Écrivez les unités dans vos calculs et donnez les résultats avec <strong>2 chiffres significatifs</strong> (notation possible : 1,3e-3).</div>
        </div>
        <AlerteRho/>
        {Q.map((qu, k) => {
          const rep = defi.reps[qu.id] || '', ok = proche(lireNombre(rep), qu.vrai, qu.tol);
          return (
            <div key={qu.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. <span>{indicesProfond(qu.q)}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={rep} placeholder="?" aria-label={`Réponse ${k + 1}`} onChange={x => { const val = x.target.value; setDefi(df => ({ ...df, verifie: false, corr: false, reps: { ...df.reps, [qu.id]: val } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 130 }}/>
                <span style={{ fontSize: 14, color: KIT.txt2 }}>{qu.unite}</span>
                {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {qu.aff} {qu.unite}</div>}
              {defi.corr && qu.ch && <div style={{ marginTop: 6 }}><Chaine nom={qu.nom} litt={qu.litt} facteurs={qu.ch} nsf={qu.nsf} sci={qu.sci}/></div>}
              {defi.corr && !qu.ch && <div style={{ marginTop: 6 }}><RhoLigne d={d0}/></div>}
              {defi.corr && k === 0 && <div style={{ marginTop: 6 }}><Chaine nom="Q_v" facteurs={chQsi(defi.q, defi.u)} nsf={2} sci/></div>}
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setDefi(df => ({ ...df, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          {defi.verifie && <button onClick={() => setDefi(df => ({ ...df, corr: !df.corr }))} style={styleBouton(defi.corr, '#7e22ce')}>{defi.corr ? 'Masquer' : 'Voir'} les calculs avec les unités</button>}
          <button onClick={nouveauDefi} style={styleBouton(false)}>🔄 Nouveau défi</button>
        </div>
      </div>
    );
  })();

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Fluide incompressible</strong> (masse volumique ρ constante, toujours exprimée en kg·m⁻³, avec ρ = d × ρ<sub>eau</sub> et ρ<sub>eau</sub> = 1 000 kg·m⁻³ : valeur qui dépend de la température) et <strong>régime permanent</strong> (Q<sub>v</sub> et les vitesses ne varient pas au cours du temps). C’est ce qui permet d’écrire v₁S₁ = v₂S₂ et la conservation du débit massique.</li>
      <li><strong>Tuyau plein, sans fuite</strong> ni apport de fluide entre les deux sections.</li>
      <li><strong>Vitesse uniforme sur la section</strong> : v est la vitesse moyenne du fluide, définie par Q<sub>v</sub> = v × S. En réalité, la vitesse est nulle contre la paroi et maximale au centre du tuyau.</li>
      <li><strong>Sections circulaires</strong>, S = π D² / 4. Le raccord entre les deux sections est progressif ; on néglige ici les pertes de charge (voir la simulation sur la relation de Bernoulli).</li>
      <li><strong>Chiffres significatifs</strong> : les diamètres et le débit sont donnés avec 2 chiffres significatifs (D = 40 mm se lit 4,0 × 10¹ mm). Les vitesses et le débit massique ont donc 2 chiffres significatifs ; les valeurs intermédiaires (comme S) en gardent 3.</li>
      <li><strong>Schéma</strong> : l’animation est à l’échelle de temps réelle (1 s d’animation = 1 s), mais pas à l’échelle des longueurs : les diamètres sont agrandis par rapport à la longueur du tuyau.</li>
    </ul>
  );
  const panneauHypo = (
    <div style={{ ...styleBoite, ...cadre('hypo') }}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>
  );
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );

  const TXT = KIT.txt, TXT2 = '#475569';
  const lab = { fontSize: 12, color: TXT2, fontWeight: 600 };
  const sel = { fontSize: 13, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, background: 'white', color: TXT };
  const coulF = FLUIDES[fluide].coul;

  // ── Boîtes de calcul (exploration libre) ──
  const boiteSection = (k, D, S) => (
    <div key={k} style={{ ...styleBoite, ...cadre('calc') }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: TXT, marginBottom: 6 }}>Section {k} : D<sub>{k}</sub> = {D} mm</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ConvPrefixe nom={`D_${k}`} n={D} de="mm" vers="m" e={-3}/>
        <Chaine nom={`S_${k}`} litt={litS(k)} facteurs={chS(D)} nsf={3} sci/>
        <Chaine nom={`v_${k}`} litt={`Q_v / S_${k}`} facteurs={chV(qsi, S)} nsf={2}/>
      </div>
    </div>
  );
  const boiteConv = (
    <div style={{ ...styleBoite, ...cadre('calc') }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: TXT, marginBottom: 6 }}>Débit volumique en m³·s⁻¹ (pour les calculs des deux sections)</div>
      <Chaine nom="Q_v" facteurs={chQsi(q, uQ)} nsf={2} sci/>
    </div>
  );
  const boiteMasse = (
    <div style={{ ...styleBoite, ...cadre('calc') }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: TXT, marginBottom: 6 }}>Débit massique : Q<sub>m</sub> = ρ · Q<sub>v</sub></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AlerteRho/>
        <div style={{ fontSize: 13.5, color: TXT }}>Densité d = <strong>{String(d).replace('.', ',')}</strong> (sans unité) :</div>
        <RhoLigne d={d}/>
        <Chaine nom="Q_m" litt="ρ × Q_v" facteurs={chQm(rho, qsi)} nsf={2}/>
        <div style={{ fontSize: 12.5, color: TXT2 }}>Q<sub>m</sub> est le même dans les deux sections (conservation de la masse en régime permanent).</div>
      </div>
    </div>
  );

  const exploration = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...styleBoite, ...cadre('manip') }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: TXT, marginBottom: 8 }}>Manip : un fluide dans un tuyau qui change de section</div>
        <Tuyau qv={qsi} D1={D1} D2={D2} coul={coulF} animer={anim} vit={vit} cmd={cmd}/>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 10 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={lab}>Diamètre D<sub>1</sub> (section 1)</span>
            <select value={D1} onChange={e => setD1(parseInt(e.target.value, 10))} style={sel} aria-label="Diamètre D1">
              {DIAMS.map(x => <option key={x} value={x}>{x} mm</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={lab}>Diamètre D<sub>2</sub> (section 2)</span>
            <select value={D2} onChange={e => setD2(parseInt(e.target.value, 10))} style={sel} aria-label="Diamètre D2">
              {DIAMS.map(x => <option key={x} value={x}>{x} mm</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={lab}>Fluide</span>
            <select value={fluide} onChange={e => setFluide(e.target.value)} style={sel} aria-label="Fluide">
              {Object.entries(FLUIDES).map(([k, f]) => <option key={k} value={k}>{f.nom}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={lab}>Unité du débit</span>
            <select value={uQ} onChange={e => changerUnite(e.target.value)} style={sel} aria-label="Unité du débit volumique">
              {Object.keys(DEBITS).map(u => <option key={u} value={u}>{UNITE_Q[u]}</option>)}
            </select>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 200px' }}>
            <span style={lab}>Débit volumique Q<sub>v</sub> : <strong style={{ color: '#0e7490' }}>{sig(q, 2)} {UNITE_Q[uQ]}</strong></span>
            <input type="range" min="0" max={liste.length - 1} step="1" value={iq} onChange={e => setQ(liste[parseInt(e.target.value, 10)])}
              aria-label="Débit volumique" style={{ accentColor: '#0e7490', width: '100%' }}/>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => setAnim(a => !a)} style={stylePetitBouton(false, '#334155')}>{anim ? '⏸ Pause' : '▶ Animer'}</button>
            <button onClick={() => setVit(1)} style={stylePetitBouton(vit === 1, '#0369a1')}>Temps réel</button>
            <button onClick={() => setVit(0.4)} style={stylePetitBouton(vit === 0.4, '#0369a1')}>Ralenti</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
          <button onClick={lacher} style={stylePetitBouton(true, '#0f172a')}>⚫ Lâcher un paquet de points</button>
          <button onClick={effacer} disabled={!paquetActif} style={{ ...stylePetitBouton(false, '#64748b'), opacity: paquetActif ? 1 : 0.45 }}>Effacer les points</button>
          <span style={{ fontSize: 12.5, color: TXT2 }}>Les points marquent un « paquet » de fluide : suivez comment il s’étire ou s’amincit.</span>
        </div>
        <div style={{ fontSize: 13.5, color: TXT, marginTop: 8 }}>Densité du fluide : <strong>d = {String(d).replace('.', ',')}</strong> <span style={{ color: TXT2 }}>(sans unité)</span></div>
      </div>
      {!enGuide && <>
        {boiteConv}
        <div className="vd-l2">{boiteSection(1, D1, S1)}{boiteSection(2, D2, S2)}</div>
        {boiteMasse}
      </>}
    </div>
  );

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .vd-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .vd-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .vd-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 960px) { .vd-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Débit et vitesse d’écoulement</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div className={`vd-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {mode === 'defi' ? <div style={styleBoite}>{voletDefi}</div> : exploration}
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : mode === 'defi' ? <div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Hypothèses de travail</div>{hypotheses}</div>
            : null}
      </div>
      {mode === 'explore' && (
        <div className="vd-l2">
          <div style={styleBoite}>
            <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
              <li>Divisez D<sub>2</sub> par 2 : par combien v<sub>2</sub> est-elle multipliée ? Pourquoi pas par 2 ?</li>
              <li>Doublez le débit Q<sub>v</sub> : que deviennent v<sub>1</sub>, v<sub>2</sub> et Q<sub>m</sub> ?</li>
              <li>Prenez D<sub>1</sub> = D<sub>2</sub> : que deviennent les tranches du schéma ?</li>
              <li>Changez de fluide : quelles grandeurs changent, lesquelles ne changent pas ?</li>
              <li>Changez l’unité du débit et regardez quelles unités se simplifient (barrées) dans le calcul.</li>
              <li>Comparez v₁ et v₂ : de quels diamètres dépend leur rapport ?</li>
            </ul>
          </div>
          {panneauHypo}
        </div>
      )}
      {mode === 'guide' && panneauHypo}
    </div>
  );
}
