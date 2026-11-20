// ====================================================
//  Scènes (schémas animés) de la simulation « Le son : émission et propagation » (2GT).
//  Tous les SVG : width 100 %, maxWidth 480, centrés ; textes ≥ 16 unités (viewBox de 480 de large).
//  Animations : requestAnimationFrame, arrêtées (image fixe) si l'élève demande moins de mouvement (prefers-reduced-motion).
// ====================================================
import { useState, useEffect } from "react";
import * as M from "./sonEmission2gtModele";

const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', encre: '#0f172a' };
const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb' };
const NB = ' ';
const alea = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };   // pseudo-aléa déterministe (pas de saut d'un rendu à l'autre)
const reduit = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

// Horloge d'animation : t en secondes depuis l'affichage ; boucle > 0 : t revient à 0 toutes les « boucle » secondes ; inactive ou mouvement réduit : image fixe à tFixe
function useHorloge(actif = true, boucle = 0, tFixe = 2.1) {
  const [t, setT] = useState(tFixe);
  const [calme] = useState(reduit);
  useEffect(() => {
    if (!actif || calme) return undefined;
    let id; const t0 = performance.now();
    const f = now => { const s = (now - t0) / 1000; setT(boucle > 0 ? s % boucle : s); id = requestAnimationFrame(f); };
    id = requestAnimationFrame(f);
    return () => cancelAnimationFrame(id);
  }, [actif, calme, boucle]);
  return !actif || calme ? tFixe : t;
}

const arc = (cx, cy, r, a0, a1) => {                              // arc de cercle (angles en degrés, 0° = vers la droite, sens horaire à l'écran)
  const p = a => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
};

// ---------- scène 1 : un diapason et un haut-parleur qui vibrent ----------
export function SceneDiapason({ t = 0, vibre = true }) {
  const cx = 110, a = vibre ? 7 * Math.sin(2 * Math.PI * 3 * t) : 0, b = vibre ? 4 * Math.sin(2 * Math.PI * 5 * t) : 0;
  const op = k => (vibre ? 0.2 + 0.8 * Math.max(0, Math.sin(2 * Math.PI * (1.2 * t - k * 0.22))) : 0);
  const R = [40, 62, 84];
  return (
    <svg viewBox="0 0 480 262" style={stl} role="img" aria-label={`À gauche, un diapason dont les deux branches ${vibre ? 'vont et viennent très vite' : 'sont immobiles'}. À droite, un haut-parleur dont la membrane ${vibre ? 'avance et recule' : 'est immobile'}.`}>
      <line x1={cx - 12} y1="62" x2={cx - 12} y2="170" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4"/>
      <line x1={cx + 12} y1="62" x2={cx + 12} y2="170" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4"/>
      <path d={`M${cx - 12},170 Q${cx - 12},192 ${cx},192 Q${cx + 12},192 ${cx + 12},170`} fill="none" stroke="#64748b" strokeWidth="10" strokeLinecap="round"/>
      <line x1={cx - 12} y1="170" x2={cx - 12 - a} y2="62" stroke="#64748b" strokeWidth="10" strokeLinecap="round"/>
      <line x1={cx + 12} y1="170" x2={cx + 12 + a} y2="62" stroke="#64748b" strokeWidth="10" strokeLinecap="round"/>
      <line x1={cx} y1="192" x2={cx} y2="226" stroke="#475569" strokeWidth="8" strokeLinecap="round"/>
      {R.map((r, k) => <g key={k} opacity={op(k)}>
        <path d={arc(cx + 22, 112, r, -48, 48)} fill="none" stroke={COL.bleu} strokeWidth="3.5" strokeLinecap="round"/>
        <path d={arc(cx - 22, 112, r, 132, 228)} fill="none" stroke={COL.bleu} strokeWidth="3.5" strokeLinecap="round"/></g>)}
      <text x={cx} y="252" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>Diapason</text>
      <rect x="290" y="90" width="50" height="120" rx="6" fill="#334155"/>
      <polygon points={`340,128 ${384 + b},84 ${384 + b},216 340,172`} fill="#94a3b8" stroke="#475569" strokeWidth="2.5"/>
      <line x1={384 + b} y1="84" x2={384 + b} y2="216" stroke="#334155" strokeWidth="4"/>
      {R.map((r, k) => <path key={k} d={arc(392, 150, r - 12, -50, 50)} fill="none" stroke={COL.bleu} strokeWidth="3.5" strokeLinecap="round" opacity={op(k)}/>)}
      <text x="340" y="252" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>Haut-parleur</text>
    </svg>);
}

// ---------- scène 2 : la vibration se transmet de particule en particule ----------
const VPX = 130, LAM = 100;                                       // vitesse (px/s) et distance entre deux « paquets » de particules, pour le dessin
const COLS = 14, LIGNES = 5, X0 = 80, DX = 28, Y0 = 82, DY = 30, IP = 7, JP = 2, A_PART = 9;
export function SceneAir({ t = 2.1 }) {
  const T0 = LAM / VPX, plaque = 6 * Math.sin(2 * Math.PI * t / T0);
  const dep = x0 => {                                             // déplacement d'une particule dont la place de repos est x0
    const retardPx = x0 - 50, atteint = t * VPX - retardPx;
    if (atteint <= 0) return 0;
    const g = Math.min(1, atteint / 24);
    return A_PART * g * Math.sin(2 * Math.PI * (t / T0 - retardPx / LAM));
  };
  const xp = X0 + IP * DX;
  return (
    <svg viewBox="0 0 480 284" style={stl} role="img" aria-label="Une rangée de particules d’air. Un haut-parleur à gauche pousse les particules voisines, qui poussent les suivantes : la vibration avance vers l’oreille à droite. Une particule est colorée en orange et un trait pointillé marque sa place de repos.">
      <text x="14" y="36" fontSize="18" fontWeight="700" fill={COL.encre}>haut-parleur</text>
      <text x="448" y="36" fontSize="26" textAnchor="middle">👂</text>
      <rect x={40 + plaque} y="62" width="12" height="164" rx="3" fill="#334155"/>
      <line x1={xp} y1="62" x2={xp} y2="226" stroke={COL.orange} strokeWidth="2" strokeDasharray="5 5"/>
      {Array.from({ length: LIGNES }, (_, j) => Array.from({ length: COLS }, (_, i) => {
        const x0 = X0 + i * DX, est = i === IP && j === JP;
        return <circle key={`${i}-${j}`} cx={x0 + dep(x0)} cy={Y0 + j * DY} r={est ? 7 : 5} fill={est ? COL.orange : '#38bdf8'} stroke={est ? '#7c2d12' : '#0369a1'} strokeWidth={est ? 2 : 1}/>;
      }))}
      <text x={xp} y="248" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.orange}>place de repos</text>
      <circle cx="30" cy="270" r="5" fill="#38bdf8" stroke="#0369a1"/>
      <text x="42" y="275" fontSize="18" fill="#334155">une particule d’air (la orange est à suivre)</text>
    </svg>);
}

// ---------- scène 3 : une corde seule, puis une corde avec sa caisse de résonance ----------
export function SceneCaisse({ t = 0 }) {
  const s = Math.sin(2 * Math.PI * 4 * t), k = 1 + 0.015 * s;
  const cordeG = `M46,140 Q123,${140 + 6 * s} 200,140`, cordeD = `M246,150 Q330,${150 + 6 * s} 414,150`;
  const op = j => 0.25 + 0.75 * Math.max(0, Math.sin(2 * Math.PI * (1.3 * t - j * 0.2)));
  return (
    <svg viewBox="0 0 480 284" style={stl} role="img" aria-label="À gauche, une corde tendue seule qui vibre : elle met peu d’air en mouvement. À droite, la même corde fixée à une guitare : la caisse en bois vibre aussi et met beaucoup plus d’air en mouvement.">
      <line x1="240" y1="20" x2="240" y2="250" stroke="#e2e8f0" strokeWidth="2"/>
      <rect x="36" y="124" width="10" height="34" rx="3" fill="#78716c"/><rect x="200" y="124" width="10" height="34" rx="3" fill="#78716c"/>
      <path d={cordeG} fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round"/>
      <path d={arc(123, 140, 30, 255, 285)} fill="none" stroke={COL.bleu} strokeWidth="2.5" strokeLinecap="round" opacity={0.25 + 0.5 * Math.max(0, s)}/>
      <path d={arc(123, 140, 30, 75, 105)} fill="none" stroke={COL.bleu} strokeWidth="2.5" strokeLinecap="round" opacity={0.25 + 0.5 * Math.max(0, s)}/>
      <text x="123" y="250" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>Corde seule</text>
      <g transform={`translate(348,150) scale(${k}) translate(-348,-150)`}>
        <circle cx="352" cy="150" r="58" fill="#d6a45a" stroke="#7c4a14" strokeWidth="3"/>
        <circle cx="296" cy="150" r="40" fill="#d6a45a" stroke="#7c4a14" strokeWidth="3"/>
        <circle cx="352" cy="150" r="56" fill="#d6a45a"/><circle cx="296" cy="150" r="38" fill="#d6a45a"/>
        <circle cx="338" cy="150" r="17" fill="#3b2a14"/>
      </g>
      <rect x="244" y="144" width="60" height="12" fill="#7c4a14"/>
      <rect x="400" y="138" width="8" height="24" rx="2" fill="#3b2a14"/>
      <path d={cordeD} fill="none" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round"/>
      <path d={cordeD} fill="none" stroke="#475569" strokeWidth="1.6" strokeLinecap="round"/>
      {[0, 1, 2].map(j => <path key={j} d={arc(352, 150, 72 + j * 20, -42, 42)} fill="none" stroke={COL.bleu} strokeWidth="4" strokeLinecap="round" opacity={op(j)}/>)}
      <text x="340" y="250" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>Corde + caisse</text>
    </svg>);
}

// ---------- scène 4 : un réveil sous une cloche dont on retire l'air ----------
const CLOCHE = Array.from({ length: 70 }, (_, i) => ({ x: 156 + alea(i) * 136, y: 84 + alea(i + 500) * 138 })).filter(p => Math.hypot(p.x - 220, p.y - 200) > 40);
export function SceneCloche({ air = 100, t = 0 }) {
  const n = Math.round(CLOCHE.length * air / 100), vib = 2.5 * Math.sin(2 * Math.PI * 9 * t), f = air / 100;
  const op = k => (air < 3 ? 0 : f * (0.3 + 0.7 * Math.max(0, Math.sin(2 * Math.PI * (1.3 * t - k * 0.2)))));
  return (
    <svg viewBox="0 0 480 304" style={stl} role="img" aria-label={`Un réveil qui sonne est placé sous une cloche en verre reliée à une pompe. Il reste ${air} pour cent de l’air dans la cloche. Les particules d’air sont représentées par des points gris. À gauche, un auditeur et des arcs qui représentent le son entendu à l’extérieur.`}>
      <text x="44" y="150" fontSize="28" textAnchor="middle">👂</text>
      {[0, 1, 2].map(k => <path key={k} d={arc(150, 160, 28 + k * 18, 150, 210)} fill="none" stroke={COL.bleu} strokeWidth="4" strokeLinecap="round" opacity={op(k)}/>)}
      <path d="M142,238 L142,128 Q142,66 222,66 Q302,66 302,128 L302,238 Z" fill="#f0f9ff" stroke={COL.bleu} strokeWidth="3.5"/>
      <rect x="122" y="238" width="200" height="14" rx="3" fill="#94a3b8"/>
      {CLOCHE.slice(0, n).map((p, i) => <circle key={i} cx={p.x + 1.4 * Math.sin(t * 7 + i)} cy={p.y + 1.4 * Math.cos(t * 6 + i)} r="3" fill="#64748b"/>)}
      <g transform={`translate(${220 + vib},200)`}>
        <circle r="24" fill="#fef3c7" stroke={COL.orange} strokeWidth="3"/>
        <line x1="0" y1="0" x2="0" y2="-14" stroke={COL.encre} strokeWidth="3" strokeLinecap="round"/><line x1="0" y1="0" x2="10" y2="4" stroke={COL.encre} strokeWidth="3" strokeLinecap="round"/>
        <path d="M-20,-18 Q-26,-30 -12,-32 Z" fill="#b91c1c"/><path d="M20,-18 Q26,-30 12,-32 Z" fill="#b91c1c"/>
        <line x1="-16" y1="22" x2="-22" y2="31" stroke={COL.encre} strokeWidth="4" strokeLinecap="round"/><line x1="16" y1="22" x2="22" y2="31" stroke={COL.encre} strokeWidth="4" strokeLinecap="round"/>
      </g>
      <path d="M186,176 Q178,186 186,196" fill="none" stroke={COL.rouge} strokeWidth="3" strokeLinecap="round" opacity={0.5 + 0.5 * Math.sin(t * 40)}/>
      <path d="M254,176 Q262,186 254,196" fill="none" stroke={COL.rouge} strokeWidth="3" strokeLinecap="round" opacity={0.5 + 0.5 * Math.cos(t * 40)}/>
      <line x1="322" y1="245" x2="388" y2="245" stroke="#64748b" strokeWidth="6"/>
      <rect x="388" y="212" width="64" height="66" rx="8" fill="#e2e8f0" stroke="#475569" strokeWidth="2.5"/>
      <rect x="410" y={216 + 8 * (1 - f)} width="20" height="24" rx="3" fill="#475569"/>
      <text x="222" y="40" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>cloche en verre</text>
      <text x="420" y="298" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>pompe</text>
      <text x="222" y="278" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>réveil qui sonne</text>
    </svg>);
}

// ---------- scène 5 : la même distance dans plusieurs milieux (course de sons, au ralenti) ----------
// lanes : [{ id, nom, v, fond, trait }] ; d : distance commune (m) ; la voie la plus lente met 3 s à l'écran (boucle de 5 s)
export function SceneCourse({ lanes, d, t = 4, titre = true }) {
  const tau = t % 5, dts = lanes.map(l => (l.v ? d / l.v : Infinity));
  const dtMax = Math.max(...dts.filter(isFinite), 1e-9), H = 56 + lanes.length * 82;
  return (
    <svg viewBox={`0 0 480 ${H}`} style={stl} role="img" aria-label={`Course de sons sur ${M.longueur(d)} : ${lanes.map(l => l.nom).join(', ')}. Un chronomètre est placé à l’arrivée de chaque tube. La scène est au ralenti.`}>
      {titre && <text x="240" y="28" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>Même distance : {M.longueur(d)} (au ralenti)</text>}
      {lanes.map((l, i) => {
        const y0 = 56 + i * 82, fini = !isFinite(dts[i]);
        const pos = fini ? 0 : Math.min(1, (tau / 3) * (dtMax / dts[i])), tChrono = fini ? null : Math.min(dts[i], dts[i] * pos);
        const x = 118 + pos * 322, arrive = pos >= 1;
        return <g key={l.id}>
          <text x="10" y={y0 + 24} fontSize="18" fontWeight="700" fill={COL.encre}>{l.Nom || l.nom}</text>
          <rect x="108" y={y0 + 4} width="342" height="26" rx="13" fill={l.fond} stroke={l.trait} strokeWidth="2"/>
          <rect x="88" y={y0 + 6} width="18" height="22" rx="3" fill="#334155"/>
          {fini ? <text x="280" y={y0 + 23} fontSize="18" textAnchor="middle" fill={COL.rouge} fontWeight="700">rien ne se propage</text>
            : <><circle cx={x} cy={y0 + 17} r="10" fill={COL.orange} stroke="#7c2d12" strokeWidth="2"/>
              {pos > 0.03 && !arrive && <path d={arc(x - 8, y0 + 17, 16, 150, 210)} fill="none" stroke={COL.orange} strokeWidth="3" strokeLinecap="round"/>}</>}
          <text x="450" y={y0 + 52} fontSize="18" fontWeight="700" textAnchor="end" fill={arrive ? COL.vert : COL.gris} style={{ fontFamily: 'monospace' }}>
            chrono : {fini ? '—' : M.duree(tChrono, 2)}</text>
        </g>;
      })}
    </svg>);
}

// ---------- scène 6 : un claquement, deux micros et un chronomètre ----------
// mode 'anim' : le son avance (d réglable) ; mode 'fixe' : image fixe avec le retard donné (dtTxt) ; vTxt : bandeau « vitesse mesurée » (facultatif)
export function SceneDeuxMicros({ d, t = 0, mode = 'anim', dtTxt = null, dtReel = null, milieuId = 'air', vTxt = null }) {
  const mil = M.milieu(milieuId), anim = mode === 'anim';
  const x1 = 120, dpx = anim ? 40 + d * 3.2 : 210, x2 = x1 + dpx, xs = 56, PX = 110;
  const tau = t % 5, xf = xs + PX * tau;
  const dtR = dtReel ?? M.retard(d, M.V_AIR);
  const prog = anim ? Math.max(0, Math.min(1, (xf - x1) / (x2 - x1))) : 1;
  const lu = anim ? M.nbf(dtR * prog, 2) + `${NB}s` : dtTxt;
  const op = k => 0.3 + 0.7 * Math.max(0, Math.sin(2 * Math.PI * (1.3 * t - k * 0.2)));
  return (
    <svg viewBox={`0 0 480 ${vTxt ? 296 : 252}`} style={stl} role="img" aria-label={`Un haut-parleur émet un claquement dans ${mil.nom}. Deux micros, distants de ${M.longueur(d)}, sont reliés à un chronomètre qui affiche le retard ${lu}.`}>
      <rect x="150" y="8" width="180" height="50" rx="10" fill="#0f172a"/>
      <text x="240" y="26" fontSize="18" textAnchor="middle" fill="#cbd5e1">Chronomètre</text>
      <text x="240" y="50" fontSize="22" fontWeight="700" textAnchor="middle" fill="#86efac" style={{ fontFamily: 'monospace' }}>Δt = {lu}</text>
      <rect x="8" y="72" width="464" height="80" rx="10" fill={mil.fond} stroke={mil.trait} strokeWidth="1.5"/>
      <rect x="26" y="96" width="22" height="34" rx="4" fill="#334155"/><polygon points="48,106 66,94 66,132 48,120" fill="#94a3b8" stroke="#475569" strokeWidth="2"/>
      {[x1, x2].map((x, i) => <g key={i}>
        <line x1={x} y1="112" x2={x} y2="160" stroke="#475569" strokeWidth="4"/>
        <circle cx={x} cy="106" r="12" fill="#fde68a" stroke={COL.orange} strokeWidth="3"/>
        <text x={x} y="184" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>micro {i + 1}</text></g>)}
      {anim && xf < x2 + 20 && [0, 1].map(k => xf - 12 * k > xs + 6 && <path key={k} d={arc(xf - 12 * k, 112, 20, -50, 50)} fill="none" stroke={COL.bleu} strokeWidth="4" strokeLinecap="round" opacity={op(k)}/>)}
      {!anim && [0, 1, 2].map(k => <path key={k} d={arc(72 + k * 12, 112, 13, -50, 50)} fill="none" stroke={COL.bleu} strokeWidth="3.5" strokeLinecap="round" opacity={0.85 - 0.22 * k}/>)}
      <line x1={x1} y1="204" x2={x2} y2="204" stroke={COL.orange} strokeWidth="3"/>
      <polygon points={`${x1},204 ${x1 + 10},199 ${x1 + 10},209`} fill={COL.orange}/><polygon points={`${x2},204 ${x2 - 10},199 ${x2 - 10},209`} fill={COL.orange}/>
      <text x={(x1 + x2) / 2} y="232" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.orange}>d = {M.longueur(d, 2).replace('.', ',')}</text>
      {vTxt && <><rect x="110" y="250" width="260" height="36" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2"/>
        <text x="240" y="274" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.vert}>{vTxt}</text></>}
    </svg>);
}

// ---------- scène 9 : éclair et tonnerre (ou feu d'artifice et bruit) ----------
// source : 'eclair' | 'feu' ; dtTxt : retard affiché (null : « ? ») ; dTxt : distance affichée (null : « ? »)
export function SceneOrage({ source = 'eclair', dtTxt = null, dTxt = null }) {
  const eclair = source === 'eclair';
  return (
    <svg viewBox="0 0 480 252" style={stl} role="img" aria-label={eclair ? `Un orage à gauche, un observateur à droite. Entre l’éclair et le tonnerre, le chronomètre indique ${dtTxt || 'un retard à lire'}. La distance entre l’orage et l’observateur est ${dTxt || 'à trouver'}.` : `Un feu d’artifice à gauche, un spectateur à droite. La distance est ${dTxt || 'à trouver'} et le retard du bruit est ${dtTxt || 'à trouver'}.`}>
      <rect x="0" y="0" width="480" height="176" fill={eclair ? '#e2e8f0' : '#1e293b'}/>
      <rect x="0" y="176" width="480" height="76" fill={eclair ? '#bbf7d0' : '#334155'}/>
      {eclair ? <>
        <ellipse cx="86" cy="52" rx="62" ry="26" fill="#64748b"/><ellipse cx="128" cy="62" rx="44" ry="20" fill="#475569"/><ellipse cx="54" cy="64" rx="38" ry="18" fill="#475569"/>
        <polygon points="90,72 110,72 98,112 118,112 84,176 92,126 74,126" fill="#facc15" stroke="#a16207" strokeWidth="2"/>
        <text x="86" y="198" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>éclair</text></>
        : <>
        {Array.from({ length: 10 }, (_, i) => <line key={i} x1={96 + 12 * Math.cos(i * Math.PI / 5)} y1={78 + 12 * Math.sin(i * Math.PI / 5)} x2={96 + 46 * Math.cos(i * Math.PI / 5)} y2={78 + 46 * Math.sin(i * Math.PI / 5)} stroke={i % 2 ? '#fde047' : '#fb923c'} strokeWidth="4" strokeLinecap="round"/>)}
        <rect x="90" y="140" width="12" height="36" fill="#78716c"/>
        <text x="96" y="198" fontSize="18" fontWeight="700" textAnchor="middle" fill="#f8fafc">explosion</text></>}
      <circle cx="400" cy="128" r="11" fill="#fcd9b6" stroke="#7c4a14" strokeWidth="2"/><rect x="389" y="140" width="22" height="36" rx="5" fill="#2563eb"/>
      <text x="400" y="198" fontSize="18" fontWeight="700" textAnchor="middle" fill={eclair ? COL.encre : '#f8fafc'}>observateur</text>
      <rect x="196" y="12" width="190" height="62" rx="10" fill="#0f172a"/>
      <text x="291" y="32" fontSize="18" textAnchor="middle" fill="#cbd5e1">{eclair ? 'Retard du tonnerre' : 'Retard du bruit'}</text>
      <text x="291" y="62" fontSize="22" fontWeight="700" textAnchor="middle" fill="#86efac" style={{ fontFamily: 'monospace' }}>Δt = {dtTxt || '?'}</text>
      <line x1="96" y1="224" x2="400" y2="224" stroke={COL.orange} strokeWidth="3" strokeDasharray="8 5"/>
      <polygon points="96,224 106,219 106,229" fill={COL.orange}/><polygon points="400,224 390,219 390,229" fill={COL.orange}/>
      <rect x="196" y="208" width="190" height="32" rx="8" fill="white" opacity="0.92"/>
      <text x="291" y="232" fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.orange}>d = {dTxt || '?'}</text>
    </svg>);
}

// ---------- scène 10 : conversion m/s ↔ km/h (règle graduée) ----------
export function SceneConversion() {
  const X = v => 30 + 14 * v, vals = [0, 5, 10, 15, 20, 25, 30];
  return (
    <svg viewBox="0 0 480 226" style={stl} role="img" aria-label="Deux règles graduées l’une au-dessus de l’autre. En haut des vitesses en mètres par seconde de 0 à 30, en bas les mêmes vitesses en kilomètres par heure de 0 à 108. Chaque valeur du haut est multipliée par 3,6 pour obtenir celle du bas : 10 mètres par seconde font 36 kilomètres par heure.">
      <text x="30" y="26" fontSize="18" fontWeight="700" fill={COL.bleu}>en m/s</text>
      <text x="30" y="214" fontSize="18" fontWeight="700" fill={COL.orange}>en km/h</text>
      <line x1={X(0)} y1="62" x2={X(30)} y2="62" stroke={COL.bleu} strokeWidth="3"/><line x1={X(0)} y1="150" x2={X(30)} y2="150" stroke={COL.orange} strokeWidth="3"/>
      {vals.map(v => <g key={v}>
        <line x1={X(v)} y1="62" x2={X(v)} y2="150" stroke={v === 10 ? COL.vert : '#cbd5e1'} strokeWidth={v === 10 ? 3.5 : 1.5} strokeDasharray={v === 10 ? '0' : '4 4'}/>
        <line x1={X(v)} y1="54" x2={X(v)} y2="70" stroke={COL.bleu} strokeWidth="3"/><line x1={X(v)} y1="142" x2={X(v)} y2="158" stroke={COL.orange} strokeWidth="3"/>
        <text x={X(v)} y="46" fontSize="18" fontWeight={v === 10 ? 800 : 600} textAnchor="middle" fill={COL.bleu}>{v}</text>
        <text x={X(v)} y="182" fontSize="18" fontWeight={v === 10 ? 800 : 600} textAnchor="middle" fill={COL.orange}>{M.nbf(v * 3.6, 0)}</text></g>)}
      <text x="140" y="112" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.orange}>× 3,6 ↓</text>
      <text x="360" y="112" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.bleu}>÷ 3,6 ↑</text>
    </svg>);
}

// ---------- scène 11 : des vitesses courantes comparées (barres, en m/s) ----------
export function SceneVitesses({ lignes = ['pieton', 'velo', 'voiture', 'tgv', 'avion', 'son', 'lumiere'] }) {
  const L = M.VITESSES.filter(v => lignes.includes(v.id)), H = 12 + L.length * 46 + 8 + (lignes.includes('lumiere') ? 24 : 0);
  return (
    <svg viewBox={`0 0 480 ${H}`} style={stl} role="img" aria-label={`Des vitesses courantes comparées par des barres : ${L.map(v => `${v.nom} ${v.id === 'lumiere' ? '3,0 fois 10 puissance 8 mètres par seconde' : `${v.ms} mètres par seconde, soit ${v.kmh} kilomètres par heure`}`).join(' ; ')}.`}>
      {L.map((v, i) => {
        const y = 28 + i * 46, son = v.id === 'son', lum = v.id === 'lumiere', w = Math.max(4, v.ms / 340 * 440);
        return <g key={v.id}>
          <text x="20" y={y} fontSize="18" fontWeight="700" fill={son ? COL.orange : COL.encre}>{v.nom}</text>
          <text x="460" y={y} fontSize="18" textAnchor="end" fill={son ? COL.orange : '#334155'}>
            {lum ? `3,0${NB}×${NB}10⁸${NB}m/s` : `${M.nbf(v.ms, v.ms < 10 ? (v.ms === 5 ? 0 : 1) : 0)}${NB}m/s = ${M.entier(v.kmh)}${NB}km/h`}</text>
          {lum ? <><line x1="20" y1={y + 12} x2="440" y2={y + 12} stroke={COL.rouge} strokeWidth="6" strokeDasharray="14 8"/><polygon points={`460,${y + 12} 440,${y + 3} 440,${y + 21}`} fill={COL.rouge}/><text x="20" y={y + 40} fontSize="18" fill={COL.rouge}>hors échelle : ≈ 900 000 fois plus vite</text></>
            : <rect x="20" y={y + 7} width={w} height="10" rx="5" fill={son ? COL.orange : COL.bleu}/>}
        </g>;
      })}
    </svg>);
}

// ---------- versions animées (chaque composant a sa propre horloge : seule la scène est redessinée à chaque image) ----------
export function DiapasonAnime({ vibre }) { const t = useHorloge(true, 0, 0.1); return <SceneDiapason t={t} vibre={vibre}/>; }
export function AirAnime() { const t = useHorloge(true, 0, 2.1); return <SceneAir t={t}/>; }
export function CaisseAnime() { const t = useHorloge(true, 0, 0.1); return <SceneCaisse t={t}/>; }
export function ClocheAnime({ air }) { const t = useHorloge(true, 0, 0.1); return <SceneCloche air={air} t={t}/>; }
export function CourseAnime({ lanes, d, titre = true }) { const t = useHorloge(true, 5, 4); return <SceneCourse lanes={lanes} d={d} t={t} titre={titre}/>; }
export function MicrosAnime({ d }) { const t = useHorloge(true, 5, 4); return <SceneDeuxMicros d={d} t={t} mode="anim"/>; }
