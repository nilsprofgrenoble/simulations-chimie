import * as M from "./vitesseOrdre1Modele";

// ====================================================
//  Schémas de la simulation 122 (cinétique : vitesse volumique, temps de demi-réaction, loi d'ordre 1, niveau TG).
//  Couleurs : bleu = donnée / courbe, orange = grandeur à repérer, vert = bon, rouge = piège, gris = repère.
//  Les ions formés : H₃O⁺ (brun-orangé) et Cl⁻ (vert d'eau) ; le réactif RCl en gris-bleu.
//  Lisibilité sur téléphone : les cartes sont affichées vers 230 px de large (échelle ≈ 0,64 du viewBox de 360) ;
//  tout texte des cartes fait au moins 14 unités de viewBox, soit environ 9 px à l'écran.
// ====================================================
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', h3o: '#c2410c', cl: '#0e7490', rcl: '#64748b' };
const stl = { width: '100%', maxWidth: 380, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const Sub = ({ children }) => <tspan baselineShift="sub" fontSize="0.75em">{children}</tspan>;
const A = { type: 'A', c0: 40, k: 0.15 };
const trace = (f, X, Y, t0, t1, n = 60) => Array.from({ length: n + 1 }, (_, i) => { const t = t0 + (t1 - t0) * i / n; return `${i ? 'L' : 'M'}${X(t).toFixed(1)},${Y(f(t)).toFixed(1)}`; }).join('');

// ---------- scène du montage : le même bécher à t = 0 et à t = 10 min ----------
// 12 « molécules » de départ : à 10 min il en reste 3 (12 × e^(−0,15×10) ≈ 2,7) ; 9 paires d'ions se sont formées.
const POS = [[28, 52], [58, 44], [84, 62], [40, 80], [70, 88], [98, 96], [30, 108], [60, 114], [86, 124], [104, 74], [46, 132], [100, 118]];
function Becher({ x, restants }) {
  return (
    <g transform={`translate(${x},0)`}>
      <path d="M8 22 L8 150 Q8 158 16 158 L124 158 Q132 158 132 150 L132 22" fill="#e0f2fe" stroke="#475569" strokeWidth="2"/>
      <rect x="9" y="36" width="122" height="120" fill="#e0f2fe" opacity="0.9"/>
      {POS.map(([cx, cy], i) => (i < restants
        ? <circle key={i} cx={cx + 6} cy={cy} r="7" fill={COL.rcl} stroke="#334155"/>
        : <g key={i}><circle cx={cx - 2} cy={cy} r="6" fill={COL.h3o}/><text x={cx - 2} y={cy + 3.5} fontSize="10" fill="white" fontWeight="700" textAnchor="middle">+</text>
          <circle cx={cx + 12} cy={cy + 6} r="6" fill={COL.cl}/><text x={cx + 12} y={cy + 9.5} fontSize="10" fill="white" fontWeight="700" textAnchor="middle">−</text></g>))}
      {/* cellule de conductimétrie : câble, poignée, manchon de verre avec deux plaques de platine */}
      <path d="M70 -26 L70 -8" stroke="#1f2937" strokeWidth="3.2" fill="none"/>
      <rect x="61" y="-8" width="18" height="30" rx="5" fill="#475569" stroke="#1f2937" strokeWidth="1.4"/>
      <rect x="64" y="-2" width="12" height="4" rx="2" fill="#94a3b8"/>
      <rect x="59" y="22" width="22" height="5" rx="2" fill="#1f2937"/>
      <rect x="62" y="27" width="16" height="48" rx="2" fill="#ffffff" fillOpacity="0.75" stroke="#334155" strokeWidth="1.5"/>
      <rect x="65.5" y="33" width="3.6" height="32" fill="#111827"/><rect x="70.9" y="33" width="3.6" height="32" fill="#111827"/>
      <line x1="62" y1="69" x2="78" y2="69" stroke="#334155" strokeDasharray="2 2"/>
    </g>);
}
export function SvgMontage() {
  return (
    <svg viewBox="0 -34 400 248" style={{ ...stl, maxWidth: 440 }} role="img"
      aria-label="Deux béchers avec une cellule de conductimétrie. À t égal 0, douze molécules de réactif RCl, aucun ion, conductivité faible. À t égal 10 minutes, il reste trois molécules de RCl et neuf paires d’ions H3O plus et Cl moins, la conductivité est plus grande.">
      <Becher x={10} restants={12}/><Becher x={216} restants={3}/>
      <text x="92" y="-16" fontSize="12.5" fontWeight="700" fill="#334155">cellule de conductimétrie</text>
      <path d="M88 -12 L82 -2" stroke="#334155" strokeWidth="1.2"/>
      <text x="298" y="-16" fontSize="12" fill="#475569">câble vers</text><text x="298" y="-3" fontSize="12" fill="#475569">le conductimètre</text>
      <text x="80" y="182" fontSize="13" fontWeight="700" fill="#0f172a" textAnchor="middle">t = 0</text>
      <text x="286" y="182" fontSize="13" fontWeight="700" fill="#0f172a" textAnchor="middle">t = 10 min</text>
      <path d="M152 90 L206 90" stroke={COL.orange} strokeWidth="2.6" markerEnd="url(#fm)"/>
      <defs><marker id="fm" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={COL.orange}/></marker></defs>
      <text x="180" y="78" fontSize="12" fill={COL.orange} fontWeight="700" textAnchor="middle">temps</text>
      {/* barres de conductivité (le symbole σ est réservé à l'écart-type du bruit des mesures) */}
      <rect x="22" y="192" width="116" height="9" rx="4" fill="#e2e8f0"/><rect x="22" y="192" width="9" height="9" rx="4" fill={COL.bleu}/>
      <rect x="228" y="192" width="116" height="9" rx="4" fill="#e2e8f0"/><rect x="228" y="192" width="87" height="9" rx="4" fill={COL.bleu}/>
      <text x="80" y="211" fontSize="12.5" fill="#334155" textAnchor="middle">conductivité faible</text>
      <text x="286" y="211" fontSize="12.5" fill="#334155" textAnchor="middle">conductivité plus grande</text>
      {/* légende */}
      <circle cx="160" cy="130" r="6" fill={COL.rcl} stroke="#334155"/><text x="170" y="134" fontSize="13" fill="#334155">RCl</text>
      <circle cx="160" cy="148" r="6" fill={COL.h3o}/><text x="157" y="151.5" fontSize="10" fill="white" fontWeight="700">+</text><text x="170" y="152" fontSize="13" fill="#334155">H<Sub>3</Sub>O⁺</text>
      <circle cx="160" cy="166" r="6" fill={COL.cl}/><text x="157" y="169.5" fontSize="10" fill="white" fontWeight="700">−</text><text x="170" y="170" fontSize="13" fill="#334155">Cl⁻</text>
    </svg>);
}

// ---------- carte 1 : vitesse volumique de disparition = opposée de la pente de la tangente ----------
export function SvgVitesse() {
  const W = 360, H = 262, mx = 46, bas = 200, X = t => mx + (W - mx - 12) * t / 20, Y = c => bas - 150 * c / 40;
  const T4 = M.tangente(A, 4), T12 = M.tangente(A, 12);
  const droite = T => `M${X(0)},${Y(T.cA)} L${X(T.tB)},${Y(0)}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={stl} role="img"
      aria-label="Courbe de la concentration en fonction du temps avec deux tangentes. La tangente en t égal 4 minutes est très inclinée : la vitesse volumique est grande. La tangente en t égal 12 minutes est presque plate : la vitesse volumique est petite. La vitesse volumique est l’opposée de la pente de la tangente.">
      <line x1={mx} y1={bas} x2={W - 8} y2={bas} stroke="#94a3b8"/><line x1={mx} y1={Y(40) - 8} x2={mx} y2={bas} stroke="#94a3b8"/>
      <text x={mx + 6} y={Y(40) - 14} fontSize="14" fill="#334155">c (mmol·L⁻¹)</text>
      <path d={trace(t => M.conc(A, t), X, Y, 0, 20)} fill="none" stroke={COL.bleu} strokeWidth="2.6"/>
      <path d={droite(T4)} fill="none" stroke={COL.orange} strokeWidth="1.8" strokeDasharray="5 3"/>
      <path d={droite(T12)} fill="none" stroke={COL.vert} strokeWidth="1.8" strokeDasharray="5 3"/>
      <circle cx={X(4)} cy={Y(T4.c)} r="5" fill={COL.orange} stroke="#0f172a"/><circle cx={X(12)} cy={Y(T12.c)} r="5" fill={COL.vert} stroke="#0f172a"/>
      <text x={X(4) + 12} y={Y(T4.c) - 24} fontSize="14.5" fontWeight="700" fill={COL.orange}>t = 4 min : pente</text>
      <text x={X(4) + 12} y={Y(T4.c) - 8} fontSize="14.5" fontWeight="700" fill={COL.orange}>forte, v grande</text>
      <text x={268} y={Y(T12.c) - 36} fontSize="14.5" fontWeight="700" fill={COL.vert} textAnchor="middle">t = 12 min : pente</text>
      <text x={268} y={Y(T12.c) - 20} fontSize="14.5" fontWeight="700" fill={COL.vert} textAnchor="middle">faible, v petite</text>
      {[0, 5, 10, 15, 20].map(t => <text key={t} x={X(t)} y={bas + 17} fontSize="14" fill="#475569" textAnchor="middle">{t}</text>)}
      <text x={X(10)} y={bas + 35} fontSize="14" fill="#334155" textAnchor="middle">t (min)</text>
      <text x={W / 2} y={H - 8} fontSize="14.5" fontWeight="700" fill="#0f172a" textAnchor="middle">v = − dc/dt = − (pente de la tangente)</text>
    </svg>);
}

// ---------- carte 2 : temps de demi-réaction (durées égales pour l'ordre 1) ----------
export function SvgDemiReaction() {
  const W = 360, H = 262, mx = 50, bas = 196, X = t => mx + (W - mx - 12) * t / 20, Y = c => bas - 146 * c / 40, th = M.th1(A);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={stl} role="img"
      aria-label="Courbe de la concentration en fonction du temps. La concentration passe de c0 à c0 sur 2 en une durée t demi, puis de c0 sur 2 à c0 sur 4 en la même durée t demi, puis de c0 sur 4 à c0 sur 8 encore pendant t demi : pour une loi d’ordre 1, les durées sont égales.">
      <line x1={mx} y1={bas} x2={W - 8} y2={bas} stroke="#94a3b8"/><line x1={mx} y1={Y(40) - 8} x2={mx} y2={bas} stroke="#94a3b8"/>
      <text x={W - 8} y={bas + 17} fontSize="14" fill="#334155" textAnchor="end">t (min)</text>
      {[40, 20, 10, 5].map((c, n) => <g key={c}><line x1={mx} y1={Y(c)} x2={X(th * n)} y2={Y(c)} stroke="#94a3b8" strokeDasharray="3 3"/>
        <text x={mx - 5} y={Y(c) + 5} fontSize="14.5" fill="#334155" textAnchor="end">{n ? <>c<Sub>0</Sub>/{2 ** n}</> : <>c<Sub>0</Sub></>}</text></g>)}
      <path d={trace(t => M.conc(A, t), X, Y, 0, 20)} fill="none" stroke={COL.bleu} strokeWidth="2.6"/>
      {[1, 2, 3].map(n => <g key={n}><line x1={X(th * n)} y1={Y(40 / 2 ** n)} x2={X(th * n)} y2={bas} stroke="#94a3b8" strokeDasharray="3 3"/>
        <circle cx={X(th * n)} cy={Y(40 / 2 ** n)} r="4.5" fill={COL.orange} stroke="#0f172a"/></g>)}
      {[1, 2, 3].map(n => <g key={n}><path d={`M${X(th * (n - 1)) + 2},${bas + 12} L${X(th * n) - 2},${bas + 12}`} stroke={COL.vert} strokeWidth="2.4"/>
        <text x={(X(th * (n - 1)) + X(th * n)) / 2} y={bas + 31} fontSize="15" fontWeight="700" fill={COL.vert} textAnchor="middle">t½</text></g>)}
      <text x={W - 10} y={Y(40) + 22} fontSize="14.5" fontWeight="700" fill="#0f172a" textAnchor="end">ordre 1 :</text>
      <text x={W - 10} y={Y(40) + 40} fontSize="14.5" fontWeight="700" fill="#0f172a" textAnchor="end">3 durées égales</text>
      <text x={W / 2} y={H - 8} fontSize="14.5" fill="#334155" textAnchor="middle">c ÷ 2 à chaque durée t½</text>
    </svg>);
}

// ---------- carte 3 : loi d'ordre 1 : v proportionnelle à c, ln c affine ----------
export function SvgLoiOrdre1() {
  const W = 360, H = 244;
  const X1 = c => 44 + 122 * c / 40, Y1 = v => 150 - 104 * v / 6;
  const X2 = t => 214 + 122 * t / 20, Y2 = y => 36 + (-3.2 - y) / 3.3 * 110;   // ln(c/c°) de −3,22 (t = 0) à −6,22 (t = 20 min) : tout le tracé reste au-dessus de l'axe
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={stl} role="img"
      aria-label="À gauche, la vitesse volumique v en fonction de la concentration c : une droite qui passe par l’origine, v égale k fois c. À droite, ln de c en fonction du temps : une droite de pente moins k.">
      <text x="105" y="22" fontSize="14.5" fontWeight="700" fill={COL.bleu} textAnchor="middle">v = f(c)</text>
      <text x="275" y="22" fontSize="14.5" fontWeight="700" fill={COL.orange} textAnchor="middle">ln c = f(t)</text>
      <line x1="44" y1="150" x2="170" y2="150" stroke="#94a3b8"/><line x1="44" y1="40" x2="44" y2="150" stroke="#94a3b8"/>
      <path d={`M${X1(0)},${Y1(0)} L${X1(40)},${Y1(6)}`} stroke={COL.bleu} strokeWidth="2.6"/>
      {[8, 16, 24, 32, 40].map(c => <circle key={c} cx={X1(c)} cy={Y1(0.15 * c)} r="3.6" fill={COL.bleu}/>)}
      <text x="168" y="169" fontSize="14" fill="#334155" textAnchor="end">c</text><text x="50" y="54" fontSize="14" fill="#334155">v</text>
      <text x="168" y="122" fontSize="14.5" fontWeight="700" fill={COL.bleu} textAnchor="end">v = k × c</text>
      <text x="168" y="140" fontSize="14" fill={COL.bleu} textAnchor="end">par l’origine</text>
      <line x1="214" y1="150" x2="340" y2="150" stroke="#94a3b8"/><line x1="214" y1="40" x2="214" y2="150" stroke="#94a3b8"/>
      <path d={`M${X2(0)},${Y2(M.lnc(40))} L${X2(20)},${Y2(M.lnc(40) - 0.15 * 20)}`} stroke={COL.orange} strokeWidth="2.6"/>
      {[0, 4, 8, 12, 16, 20].map(t => <circle key={t} cx={X2(t)} cy={Y2(M.lnc(40) - 0.15 * t)} r="3.6" fill={COL.orange}/>)}
      <text x="338" y="169" fontSize="14" fill="#334155" textAnchor="end">t</text><text x="208" y="54" fontSize="14" fill="#334155" textAnchor="end">ln c</text>
      <text x="338" y="62" fontSize="14.5" fontWeight="700" fill={COL.orange} textAnchor="end">pente − k</text>
      <text x="338" y="79" fontSize="14" fill={COL.orange} textAnchor="end">k en min⁻¹</text>
      <rect x="20" y="180" width="320" height="56" rx="8" fill="#f0fdf4" stroke={COL.vert}/>
      <text x="180" y="200" fontSize="14.5" fontWeight="700" fill={COL.vert} textAnchor="middle">c(t) = c<Sub>0</Sub> e<tspan baselineShift="super" fontSize="0.75em">−kt</tspan> et t½ = ln 2 / k</text>
      <text x="180" y="221" fontSize="14" fill="#334155" textAnchor="middle">t½ ne dépend pas de c<Sub>0</Sub></text>
    </svg>);
}

// ---------- carte 4 : tester l'ordre 1 : trois critères, deux comportements ----------
export function SvgTestOrdre1() {
  const W = 360, H = 270;
  const colA = 91, colB = 269;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={stl} role="img"
      aria-label="Tableau de trois tests. Test 1, durées de demi-réaction : constantes pour l’ordre 1, doublées à chaque fois pour l’autre comportement. Test 2, ln c en fonction du temps : une droite pour l’ordre 1, une courbe pour l’autre. Test 3, rapport v sur c : constant pour l’ordre 1, qui diminue pour l’autre.">
      <rect x="6" y="6" width="170" height="28" rx="8" fill="#f0fdf4" stroke={COL.vert}/><text x={colA} y="26" fontSize="14.5" fontWeight="700" fill={COL.vert} textAnchor="middle">suit l’ordre 1 ✓</text>
      <rect x="184" y="6" width="170" height="28" rx="8" fill="#fef2f2" stroke={COL.rouge}/><text x={colB} y="26" fontSize="14.5" fontWeight="700" fill={COL.rouge} textAnchor="middle">ne le suit pas ✗</text>
      {[['1', 'durées de demi-réaction'], ['2', 'ln c en fonction de t'], ['3', 'rapport v / c']].map(([n, nom], i) => (
        <g key={n} transform={`translate(0,${52 + i * 68})`}>
          <text x="180" y="4" fontSize="14" fontWeight="700" fill="#0f172a" textAnchor="middle">{n}. {nom}</text>
          <rect x="6" y="10" width="170" height="48" rx="8" fill="white" stroke="#cbd5e1"/><rect x="184" y="10" width="170" height="48" rx="8" fill="white" stroke="#cbd5e1"/>
          {i === 0 && <><text x={colA} y="30" fontSize="14" fill={COL.vert} fontWeight="700" textAnchor="middle">4,6 → 4,6 → 4,6 min</text><text x={colA} y="50" fontSize="14" fill="#334155" textAnchor="middle">constantes</text>
            <text x={colB} y="30" fontSize="14" fill={COL.rouge} fontWeight="700" textAnchor="middle">4,6 → 9,2 → 18,5 min</text><text x={colB} y="50" fontSize="14" fill="#334155" textAnchor="middle">elles doublent</text></>}
          {i === 1 && <><path d="M20 22 L66 46" stroke={COL.vert} strokeWidth="2.4"/><text x="78" y="32" fontSize="14" fill={COL.vert} fontWeight="700">droite</text><text x="78" y="50" fontSize="14" fill="#334155">pente − k</text>
            <path d="M198 20 Q 210 44 256 48" fill="none" stroke={COL.rouge} strokeWidth="2.4"/><text x="266" y="32" fontSize="14" fill={COL.rouge} fontWeight="700">courbe</text><text x="266" y="50" fontSize="14" fill="#334155">pas de k</text></>}
          {i === 2 && <><text x={colA} y="30" fontSize="14" fill={COL.vert} fontWeight="700" textAnchor="middle">0,150 ; 0,150 ; 0,150</text><text x={colA} y="50" fontSize="14" fill="#334155" textAnchor="middle">toujours le même k</text>
            <text x={colB} y="30" fontSize="14" fill={COL.rouge} fontWeight="700" textAnchor="middle">0,216 ; 0,108 ; 0,054</text><text x={colB} y="50" fontSize="14" fill="#334155" textAnchor="middle">il diminue</text></>}
        </g>))}
      <text x="180" y="262" fontSize="14" fill="#475569" textAnchor="middle">un seul test négatif suffit pour écarter l’ordre 1</text>
    </svg>);
}

// ---------- carte 5 : estimer une vitesse sur des mesures bruitées : le choix de l'intervalle ----------
export function SvgIntervalle() {
  const W = 360, H = 252, sig = 0.4, k = 0.15;
  const dts = [1, 2, 4, 8], X = i => 52 + i * 82;
  const fmt = x => (x < 1 ? '< 1' : x < 10 ? x.toFixed(1).replace('.', ',') : String(Math.round(x)));
  const val = dts.map(dt => ({ dt, bruit: 100 * M.incertitudeVitesse(sig, dt) / M.vit(A, 6), biais: 100 * M.biaisSecante(k, dt) }));
  const etiq = val.map(v => `Δt = ${v.dt} minute${v.dt > 1 ? 's' : ''} : bruit ${fmt(v.bruit)} pour cent, courbure ${fmt(v.biais)} pour cent`).join(' ; ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={stl} role="img"
      aria-label={`Estimer une vitesse par sécante sur des mesures bruitées : l’erreur due au bruit diminue quand l’intervalle Δt augmente, l’erreur due à la courbure augmente. ${etiq}. Un intervalle de 4 minutes est un bon compromis.`}>
      <text x="180" y="20" fontSize="14.5" fontWeight="700" fill="#0f172a" textAnchor="middle">v à t = 6 min : deux points écartés de Δt</text>
      <line x1="24" y1="170" x2="346" y2="170" stroke="#94a3b8"/>
      {val.map(({ dt, bruit, biais }, i) => {
        const hb = Math.min(100, bruit * 4), hc = Math.max(1.5, biais * 4);
        return (<g key={dt}>
          <rect x={X(i) - 31} y={170 - hb} width="29" height={hb} fill={COL.rouge} opacity="0.85"/><rect x={X(i) + 2} y={170 - hc} width="29" height={hc} fill={COL.bleu} opacity="0.85"/>
          <text x={X(i) - 17} y={165 - hb} fontSize="14" fontWeight="700" fill={COL.rouge} textAnchor="middle">{fmt(bruit)}{' '}%</text>
          <text x={X(i) + 17} y={165 - hc} fontSize="14" fontWeight="700" fill={COL.bleu} textAnchor="middle">{fmt(biais)}{' '}%</text>
          <text x={X(i)} y="194" fontSize="14.5" fontWeight="700" fill="#0f172a" textAnchor="middle">Δt = {dt}</text></g>);
      })}
      <rect x={X(2) - 44} y="34" width="88" height="140" rx="8" fill="none" stroke={COL.vert} strokeWidth="2" strokeDasharray="5 3"/>
      <text x={X(2)} y="53" fontSize="14.5" fontWeight="700" fill={COL.vert} textAnchor="middle">bon</text>
      <text x={X(2)} y="70" fontSize="14.5" fontWeight="700" fill={COL.vert} textAnchor="middle">compromis</text>
      <rect x="30" y="210" width="13" height="13" fill={COL.rouge} opacity="0.85"/><text x="50" y="222" fontSize="14" fill="#334155">erreur due au bruit</text>
      <rect x="30" y="231" width="13" height="13" fill={COL.bleu} opacity="0.85"/><text x="50" y="243" fontSize="14" fill="#334155">erreur due à la courbure</text>
    </svg>);
}
