import { G, FACTEUR_AIR, DIST_SECU } from "./pompierModele";

// Scène du jeu « Pompiers » (sim 296) : camion-pompe, tuyau (diamètre, longueur et coudes réels de la mission), pompier et lance, jet (trajectoire calculée
// par le modèle), foyer de la mission avec flammes qui s'éteignent. Dessin pur : toute la physique vient de pompierModele.js (attaque()).

const W = 900, H = 430, SOL = 340, X0 = 170;
const CIELS = {
  Jour: ['#8ec9f3', '#d6ecfb', false], Soir: ['#f08a4b', '#fbd6a2', false], Nuit: ['#0b1e3d', '#27426e', true], Aube: ['#6f7fc4', '#f6b8a4', false],
};
const COUL_DN = { 45: '#f5a31a', 70: '#e2432f', 110: '#2b6fd6' };
const fr = (x, d = 0) => x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

export const STYLE_POMPIER = `
@keyframes pp-flick{0%,100%{transform:scaleY(1) skewX(0)}30%{transform:scaleY(1.14) skewX(3deg)}60%{transform:scaleY(.92) skewX(-3deg)}}
@keyframes pp-flick2{0%,100%{transform:scaleY(1.05) skewX(0)}40%{transform:scaleY(.9) skewX(-3deg)}70%{transform:scaleY(1.15) skewX(2deg)}}
@keyframes pp-fumee{0%{transform:translateY(0) scale(.6);opacity:.0}20%{opacity:.5}100%{transform:translateY(-70px) scale(1.7);opacity:0}}
@keyframes pp-vapeur{0%{transform:translateY(0) scale(.6);opacity:0}25%{opacity:.8}100%{transform:translateY(-60px) scale(1.8);opacity:0}}
@keyframes pp-flux{to{stroke-dashoffset:-32}}
@keyframes pp-jet{to{stroke-dashoffset:-36}}
@keyframes pp-gyro{0%,49%{opacity:1}50%,100%{opacity:.15}}
@keyframes pp-gyro2{0%,49%{opacity:.15}50%,100%{opacity:1}}
@keyframes pp-secoue{0%,100%{transform:translate(0,0)}25%{transform:translate(-2px,1px)}50%{transform:translate(2px,-1px)}75%{transform:translate(-1px,-2px)}}
@keyframes pp-etoile{0%,100%{opacity:.35}50%{opacity:1}}
.pp-f0{animation:pp-flick .9s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
.pp-f1{animation:pp-flick2 .7s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
.pp-fumee{animation:pp-fumee 4s ease-out infinite}
.pp-vapeur{animation:pp-vapeur 2.4s ease-out infinite}
.pp-flux{animation:pp-flux linear infinite}
.pp-jet{animation:pp-jet .5s linear infinite}
.pp-g1{animation:pp-gyro .8s steps(1) infinite}.pp-g2{animation:pp-gyro2 .8s steps(1) infinite}
.pp-secoue{animation:pp-secoue .12s linear infinite}
.pp-etoile{animation:pp-etoile 3s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.pp-f0,.pp-f1,.pp-fumee,.pp-vapeur,.pp-flux,.pp-jet,.pp-g1,.pp-g2,.pp-secoue,.pp-etoile{animation:none}}
`;

const goutte = (cx, hh, w) => `M${cx - w} 0 C${cx - w} ${-hh * 0.45} ${cx - w * 0.2} ${-hh * 0.6} ${cx} ${-hh} C${cx + w * 0.2} ${-hh * 0.6} ${cx + w} ${-hh * 0.45} ${cx + w} 0 Z`;

function Flammes({ x, y, l, h, k, vapeur }) {
  const vif = Math.max(0, Math.min(1, k));
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      <circle cx="0" cy={-h * 0.5} r={h * 1.1} fill="url(#pp-lueur)" opacity={vif * 0.9} style={{ transition: 'opacity 2.4s' }} />
      <g style={{ transform: `scale(${0.04 + 0.96 * vif})`, transformOrigin: '0 0', transition: 'transform 2.6s ease-in, opacity 2.6s', opacity: vif > 0.02 ? 1 : 0 }}>
        {[[-0.38, 0.62, 0.2], [-0.12, 1, 0.26], [0.2, 0.8, 0.24], [0.42, 0.5, 0.17]].map(([dx, f, w], i) => (
          <g key={i}>
            <path d={goutte(dx * l, h * f, l * w)} fill="url(#pp-flam)" className={i % 2 ? 'pp-f1' : 'pp-f0'} />
            <path d={goutte(dx * l, h * f * 0.55, l * w * 0.5)} fill="#fff3a0" opacity=".9" className={i % 2 ? 'pp-f0' : 'pp-f1'} />
          </g>))}
      </g>
      {vif > 0.3 && [0, 1, 2].map(i => <circle key={i} className="pp-fumee" cx={(i - 1) * l * 0.3} cy={-h} r={14 + i * 4} fill="#3b4252" style={{ animationDelay: `${i * 1.3}s` }} />)}
      {vapeur && [0, 1, 2, 3].map(i => <circle key={i} className="pp-vapeur" cx={(i - 1.5) * l * 0.25} cy={-6} r={12 + i * 3} fill="#f4f8fb" style={{ animationDelay: `${i * 0.5}s` }} />)}
    </g>);
}

// Décor du foyer selon la mission ; (x, y) = pied du foyer au sol
function Decor({ m, x, s }) {
  const sol = SOL;
  switch (m.id) {
    case 1: return (<g aria-hidden="true"><rect x={x - 18} y={sol - 34} width="36" height="34" rx="4" fill="#3d6b4a" stroke="#27432f" strokeWidth="2" /><rect x={x - 22} y={sol - 40} width="44" height="8" rx="3" fill="#2d5238" /><rect x={x - 10} y={sol - 24} width="20" height="3" fill="#27432f" opacity=".6" /></g>);
    case 2: return (<g aria-hidden="true"><path d={`M${x - 46} ${sol - 12} L${x - 40} ${sol - 28} L${x - 18} ${sol - 40} L${x + 14} ${sol - 40} L${x + 34} ${sol - 26} L${x + 48} ${sol - 22} L${x + 48} ${sol - 8} L${x - 46} ${sol - 8} Z`} fill="#516a8c" stroke="#2c3b52" strokeWidth="2" /><path d={`M${x - 16} ${sol - 36} L${x - 24} ${sol - 26} L${x + 28} ${sol - 26} L${x + 12} ${sol - 36} Z`} fill="#bcd6ea" opacity=".85" /><circle cx={x - 28} cy={sol - 8} r="10" fill="#1d2430" /><circle cx={x + 28} cy={sol - 8} r="10" fill="#1d2430" /></g>);
    case 3: { const hh = 8 * s; return (<g aria-hidden="true"><rect x={x - 70} y={sol - hh} width="140" height={hh} fill="#7b8794" stroke="#4a5563" strokeWidth="2" /><path d={`M${x - 76} ${sol - hh} L${x} ${sol - hh - 24} L${x + 76} ${sol - hh}`} fill="#5d6773" stroke="#3b4450" strokeWidth="2" /><rect x={x - 22} y={sol - hh * 0.7} width="44" height={hh * 0.7} fill="#1f2630" /><rect x={x - 56} y={sol - hh * 0.8} width="22" height="14" fill="#d9e6f2" opacity=".6" /><rect x={x + 34} y={sol - hh * 0.8} width="22" height="14" fill="#d9e6f2" opacity=".6" /></g>); }
    case 4: case 5: { const ht = (m.id === 4 ? 17 : 27) * s; const lw = 110; return (<g aria-hidden="true"><rect x={x - lw / 2} y={sol - ht} width={lw} height={ht} fill="#9a8c82" stroke="#5e5249" strokeWidth="2" />{Array.from({ length: m.id === 4 ? 5 : 8 }).map((_, r) => [0, 1, 2].map(c => { const wy = sol - (r + 1) * (ht / (m.id === 4 ? 5.4 : 8.4)); const vis = Math.abs((sol - wy - 6) - m.hFeu * s) < 0.9 * s * (m.id === 4 ? 2.6 : 3); return <rect key={r + '-' + c} x={x - lw / 2 + 12 + c * 32} y={wy - 8} width="22" height="16" fill={vis && c === 1 ? '#1b1411' : '#f4d98b'} opacity={vis && c === 1 ? 1 : 0.7} />; }))}<rect x={x - lw / 2 - 4} y={sol - ht - 6} width={lw + 8} height="8" fill="#6b5f57" /></g>); }
    default: return (<g aria-hidden="true"><rect x={x - 40} y={sol - 8 * s} width="80" height={8 * s} rx="6" fill="#aab4c0" stroke="#5f6b78" strokeWidth="2" /><rect x={x - 40} y={sol - 8 * s + 10} width="80" height="6" fill="#8a96a3" /><rect x={x - 40} y={sol - 8 * s + 28} width="80" height="6" fill="#8a96a3" /><rect x={x - 74} y={sol - 3 * s} width="26" height={3 * s} rx="4" fill="#c4ccd6" stroke="#5f6b78" strokeWidth="2" /></g>);
  }
}

// Position du centre des flammes : (xF, yF) ; la base des flammes est posée sur le décor
export function PompierScene({ m, a, etat, tentative }) {
  const [c1, c2, nuit] = CIELS[m.temps] || CIELS.Jour;
  const s = Math.min(700 / (m.distFeu + 6), 300 / (Math.max(m.hFeu, m.zLance, 4) + 7));
  const xF = X0 + m.distFeu * s, yF = SOL - m.hFeu * s;
  const xL = Math.min(880, X0 + a.xLance * s), yL = SOL - m.zLance * s;
  const tropPres = !a.ok.securite;
  const eteint = etat === 'ok', rate = etat === 'ko';

  // Jet : l'énergie utile est FACTEUR_AIR × v_j² ; angle de tir qui passe par le foyer si c'est possible, sinon tir en visée (le jet retombe avant)
  const ve2 = FACTEUR_AIR * a.vJet * a.vJet, dx = a.dx, dh = a.dh;
  let jet = null;
  if (a.vJet > 0 && dx > 0.5) {
    const disc = ve2 * ve2 - G * (G * dx * dx + 2 * dh * ve2);
    const atteint = disc >= 0;
    const th = atteint ? Math.atan((ve2 - Math.sqrt(disc)) / (G * dx)) : Math.atan((dh + Math.hypot(dx, dh)) / dx);
    const pts = [], dxFin = dx;   // le jet s'arrête au plan du foyer : s'il passe en dessous, il frappe la façade ou le sol avant
    for (let k = 0; k <= 40; k++) {
      const xm = dxFin * k / 40, ym = xm * Math.tan(th) - G * xm * xm / (2 * ve2 * Math.cos(th) ** 2);
      if (ym < -m.zLance - 0.01) break;
      pts.push([xL + 8 + xm * s, yL - 30 - ym * s]);
    }
    if (pts.length > 1) jet = { d: 'M' + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L'), th, atteint, fin: pts[pts.length - 1] };
  }
  const largeurJet = Math.max(2.5, Math.min(9, a.dJet * 0.28));
  const v = Math.max(0.05, a.v);
  const duree = Math.max(0.12, Math.min(3, 1.3 / v));

  // Chemin du tuyau : au sol (avec une ondulation par coude) ou le long de l'échelle
  const yT = SOL - 7, nC = m.coudes;
  let chemin;
  if (m.zLance > 0) {
    chemin = `M${X0} ${yT} L${X0 + 20} ${yT} L${xL - 4} ${yL - 6}`;
  } else {
    const total = xL - X0; let d = `M${X0} ${yT}`;
    for (let i = 1; i <= nC; i++) { const px = X0 + total * i / (nC + 1); d += ` L${px - 14} ${yT} Q${px} ${yT - (i % 2 ? 20 : -14)} ${px + 14} ${yT}`; }
    chemin = d + ` L${xL} ${yT}`;
  }
  const largHose = Math.max(5, Math.min(13, a.D * 1000 / 7.5));
  const couleurHose = COUL_DN[Math.round(a.D * 1000)] || '#e2432f';
  const nSegments = Math.round(a.L / 20);
  const etoiles = Array.from({ length: 26 }, (_, i) => [(i * 137) % W, (i * 71) % 190, 0.8 + (i % 3) * 0.5]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" width="100%" style={{ display: 'block', borderRadius: 20, background: c2 }}
      aria-label={`Scène : camion-pompe, ${nSegments} tuyau${nSegments > 1 ? 'x' : ''} de diamètre ${Math.round(a.D * 1000)} mm, lance à ${fr(a.pLanceBar, 1)} bar, foyer à ${m.distFeu} m${m.hFeu ? ` et ${m.hFeu} m de haut` : ''}. ${eteint ? 'Le feu est éteint.' : ''}`}>
      <defs>
        <linearGradient id="pp-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient>
        <linearGradient id="pp-flam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#fde047" /><stop offset=".45" stopColor="#f97316" /><stop offset="1" stopColor="#dc2626" /></linearGradient>
        <radialGradient id="pp-lueur"><stop offset="0" stopColor="#ffb347" stopOpacity=".75" /><stop offset="1" stopColor="#ff7a00" stopOpacity="0" /></radialGradient>
        <linearGradient id="pp-sol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={nuit ? '#2a3140' : '#7d8794'} /><stop offset="1" stopColor={nuit ? '#171c26' : '#565f6b'} /></linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#pp-ciel)" />
      {nuit && etoiles.map((e, i) => <circle key={i} className="pp-etoile" cx={e[0]} cy={e[1]} r={e[2]} fill="#fff" style={{ animationDelay: `${(i % 7) * 0.4}s` }} />)}
      {nuit && <circle cx="800" cy="60" r="20" fill="#f6f1d3" />}
      {m.temps === 'Jour' && <circle cx="790" cy="62" r="28" fill="#fff4b8" opacity=".9" />}
      {/* ville au loin */}
      <g opacity={nuit ? 0.9 : 0.55} aria-hidden="true">
        {[[40, 60], [110, 95], [190, 70], [270, 110], [390, 80], [520, 100], [640, 70], [740, 105], [830, 80]].map(([x, h], i) => (
          <g key={i}><rect x={x} y={SOL - h - 20} width="58" height={h + 20} fill={nuit ? '#10213f' : '#8aa0b8'} />
            {nuit && [0, 1, 2].map(r => [0, 1].map(cc => ((i + r + cc) % 3 !== 0) && <rect key={r + '-' + cc} x={x + 10 + cc * 22} y={SOL - h - 10 + r * 24} width="10" height="12" fill="#f9d67a" opacity=".8" />))}</g>))}
      </g>
      <rect y={SOL} width={W} height={H - SOL} fill="url(#pp-sol)" />
      <g stroke="#e7e9ee" strokeWidth="3" strokeDasharray="26 20" opacity=".5"><line x1="0" y1={SOL + 50} x2={W} y2={SOL + 50} /></g>

      {/* zone de chaleur autour du foyer */}
      <ellipse cx={xF} cy={SOL} rx={DIST_SECU * s} ry="14" fill={tropPres ? '#dc2626' : '#f97316'} opacity={tropPres ? 0.4 : 0.18} />
      <line x1={xF - DIST_SECU * s} y1={SOL + 4} x2={xF - DIST_SECU * s} y2={SOL - 16} stroke="#f97316" strokeWidth="2" strokeDasharray="4 4" />
      <text x={xF - DIST_SECU * s} y={SOL - 20} fontSize="12" fontWeight="700" fill={nuit ? '#fdba74' : '#9a3412'} textAnchor="middle">zone de chaleur ({DIST_SECU} m)</text>

      <Decor m={m} x={xF} s={s} />
      <Flammes x={xF} y={m.id === 5 || m.id === 4 ? yF + 10 : (m.id === 6 ? yF + 2 : SOL - (m.id === 1 ? 40 : m.id === 2 ? 38 : m.id === 3 ? 8 * s * 0.55 : 0))}
        l={m.id === 3 ? 110 : m.id >= 4 ? 70 : 60} h={m.id === 3 ? 86 : m.id >= 4 ? 70 : 62} k={eteint ? 0 : 1} vapeur={eteint} />

      {/* camion-pompe */}
      <g aria-hidden="true">
        <rect x="26" y={SOL - 62} width="116" height="54" rx="6" fill="#d62828" stroke="#8d1717" strokeWidth="2" />
        <rect x="26" y={SOL - 36} width="116" height="7" fill="#fff" opacity=".9" />
        <path d={`M2 ${SOL - 8} L2 ${SOL - 38} Q2 ${SOL - 52} 16 ${SOL - 52} L40 ${SOL - 52} L40 ${SOL - 8} Z`} fill="#c01f1f" stroke="#8d1717" strokeWidth="2" />
        <rect x="9" y={SOL - 46} width="24" height="16" rx="3" fill="#bfe3f7" />
        <rect x="40" y={SOL - 70} width="60" height="8" rx="3" fill="#6b7280" />
        <circle className="pp-g1" cx="16" cy={SOL - 56} r="5" fill="#3b82f6" /><circle className="pp-g2" cx="30" cy={SOL - 56} r="5" fill="#ef4444" />
        <circle cx="30" cy={SOL - 6} r="15" fill="#1c1f26" /><circle cx="30" cy={SOL - 6} r="6" fill="#9aa3af" />
        <circle cx="112" cy={SOL - 6} r="15" fill="#1c1f26" /><circle cx="112" cy={SOL - 6} r="6" fill="#9aa3af" />
        <circle cx="140" cy={SOL - 22} r="7" fill="#9aa3af" stroke="#4b5563" strokeWidth="2" />
        <text x="84" y={SOL - 44} textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">POMPIERS</text>
        <text x={66} y={SOL - 23} textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff" stroke="#8d1717" strokeWidth="3" paintOrder="stroke">{fr(m.pPompe)} bar</text>
      </g>
      {/* grande échelle */}
      {m.zLance > 0 && <g aria-hidden="true"><line x1={X0 - 80} y1={SOL - 70} x2={xL} y2={yL + 4} stroke="#cbd5e1" strokeWidth="7" strokeLinecap="round" /><line x1={X0 - 80} y1={SOL - 70} x2={xL} y2={yL + 4} stroke="#475569" strokeWidth="3" strokeDasharray="3 6" /></g>}

      {/* tuyau : fond, puis flux d'eau (vitesse ∝ v), puis raccords tous les 20 m */}
      <path d={chemin} fill="none" stroke="#111827" strokeOpacity=".35" strokeWidth={largHose + 4} strokeLinecap="round" strokeLinejoin="round" transform="translate(0 3)" />
      <path d={chemin} fill="none" stroke={couleurHose} strokeWidth={largHose} strokeLinecap="round" strokeLinejoin="round" />
      <path d={chemin} fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth={Math.max(2, largHose * 0.28)} strokeDasharray="8 24" strokeLinecap="round" className="pp-flux" style={{ animationDuration: `${duree}s` }} />
      {Array.from({ length: nSegments }).map((_, i) => { const frac = (i + 1) / nSegments, px = X0 + (xL - X0) * frac; return i < nSegments - 1 ? <rect key={i} x={px - 3} y={(m.zLance > 0 ? yT + (yL - 6 - yT) * frac : yT) - largHose / 2 - 2} width="6" height={largHose + 4} rx="2" fill="#e5e7eb" stroke="#4b5563" /> : null; })}

      {/* pompier et lance */}
      <g className={rate && a.verdict === 'haute' ? 'pp-secoue' : undefined} aria-hidden="true">
        {m.zLance > 0 && <rect x={xL - 18} y={yL - 2} width="36" height="6" rx="2" fill="#475569" />}
        <g transform={`translate(${xL} ${yL})`}>
          <rect x="-6" y="-14" width="5" height="14" rx="2" fill="#1f2937" /><rect x="1" y="-14" width="5" height="14" rx="2" fill="#1f2937" />
          <rect x="-8" y="-36" width="16" height="24" rx="5" fill="#1e3a5f" /><rect x="-8" y="-26" width="16" height="3.5" fill="#f5c518" />
          <circle cx="0" cy="-42" r="6.5" fill="#f1c9a5" /><path d="M-9 -43 A9 9 0 0 1 9 -43 L11 -40 L-11 -40 Z" fill="#f5c518" />
          <line x1="4" y1="-30" x2={8 + Math.cos(jet ? jet.th : 0.6) * 26} y2={-30 - Math.sin(jet ? jet.th : 0.6) * 26} stroke="#111827" strokeWidth="5" strokeLinecap="round" />
          <line x1="4" y1="-30" x2={8 + Math.cos(jet ? jet.th : 0.6) * 20} y2={-30 - Math.sin(jet ? jet.th : 0.6) * 20} stroke="#f5a31a" strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>

      {/* jet */}
      {jet && <g aria-hidden="true">
        <path d={jet.d} fill="none" stroke="#bfe6ff" strokeOpacity=".55" strokeWidth={largeurJet + 4} strokeLinecap="round" />
        <path d={jet.d} fill="none" stroke="#fff" strokeWidth={Math.max(1.5, largeurJet * 0.5)} strokeDasharray="10 8" strokeLinecap="round" className="pp-jet" />
        {jet.atteint && !eteint && <circle cx={jet.fin[0]} cy={jet.fin[1]} r="10" fill="#bfe6ff" opacity=".6" />}
        {!jet.atteint && <circle cx={jet.fin[0]} cy={jet.fin[1]} r="8" fill="#bfe6ff" opacity=".7" />}
        {!jet.atteint && <text x={Math.max(70, Math.min(W - 70, jet.fin[0]))} y={Math.min(SOL - 6, jet.fin[1] + 24)} textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#fff" stroke="#7f1d1d" strokeWidth="4" paintOrder="stroke">le jet n'atteint pas le foyer</text>}
      </g>}
      {!jet && !tropPres && <g aria-hidden="true"><path d={`M${xL + 10} ${yL - 30} q10 6 12 22`} stroke="#bfe6ff" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="4 4" /></g>}

      {/* cote lance → foyer */}
      {dx > 0 && xL < xF - 6 && <g aria-hidden="true" fontSize="13" fontWeight="800" fill={nuit ? '#fff' : '#0f172a'}>
        <line x1={xL} y1={SOL + 28} x2={xF} y2={SOL + 28} stroke={tropPres ? '#ef4444' : '#38bdf8'} strokeWidth="2.5" markerEnd="none" />
        <line x1={xL} y1={SOL + 22} x2={xL} y2={SOL + 34} stroke={tropPres ? '#ef4444' : '#38bdf8'} strokeWidth="2.5" /><line x1={xF} y1={SOL + 22} x2={xF} y2={SOL + 34} stroke={tropPres ? '#ef4444' : '#38bdf8'} strokeWidth="2.5" />
        <text x={(xL + xF) / 2} y={SOL + 48} textAnchor="middle" fill="#fff">lance → foyer : {fr(dx)} m</text>
      </g>}
      {m.hFeu > 0 && <text x={xF > 650 ? xF - 70 : xF + 70} textAnchor={xF > 650 ? 'end' : 'start'} y={yF - 4} fontSize="12.5" fontWeight="800" fill={nuit ? '#fde68a' : '#78350f'}>foyer à {m.hFeu} m de haut</text>}
      {dx <= 0 && <text x="450" y="40" textAnchor="middle" fontSize="20" fontWeight="900" fill="#fecaca" stroke="#7f1d1d" strokeWidth="5" paintOrder="stroke">🔥 Trop près : tu es dans les flammes !</text>}
      {tropPres && dx > 0 && <text x="450" y="40" textAnchor="middle" fontSize="18" fontWeight="900" fill="#fecaca" stroke="#7f1d1d" strokeWidth="5" paintOrder="stroke">🔥 Trop près du foyer (moins de {DIST_SECU} m)</text>}
      {rate && <text x="450" y="74" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" stroke="#111827" strokeWidth="4" paintOrder="stroke">Attaque n° {tentative} : le feu résiste…</text>}
    </svg>);
}
