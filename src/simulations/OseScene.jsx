/* eslint-disable react-refresh/only-export-components */
import { useRef, useState } from "react";
import { coordSvg, nbf } from "./exploAnim";

// Scène animée de la simulation 322 : un chariot sur un rail, relié à un ressort (qu'on tire à la souris, au doigt ou aux flèches du clavier),
// avec amortisseur (frottements) et dispositif d'entretien facultatifs ; barres d'énergie et graphes Ec, Ep, Em tracés en direct. Convention : x > 0 vers la droite.
const BLEU = '#0369a1', ORANGE = '#ea580c', GRIS = '#475569', VERT = '#15803d', VIOLET = '#7c3aed', ROUGE = '#dc2626';
export const COUL = { ep: BLEU, ec: ORANGE, em: VIOLET, q: ROUGE, w: VERT };
const XE = 215, SX = 150, YR = 162;

function zigzag(x1, x2, y, n = 10, amp = 12) {
  const pts = [[x1, y]]; const h = (x2 - x1 - 16) / n;
  for (let i = 0; i < n; i++) pts.push([x1 + 8 + h * (i + 0.5), y + (i % 2 ? -amp : amp)]);
  pts.push([x2, y]);
  return pts.map(p => p.join(',')).join(' ');
}

export function SceneChariot({ x, zeta = 0, c = 0, vitesse = 0, afficheAmort = true, afficheEntretien = false, interactif = true, onDrag, onRelease, aria, indice = true }) {
  const ref = useRef(null), [drag, setDrag] = useState(false);
  const xc = Math.max(-0.97, Math.min(0.97, x)), cx = XE + xc * SX, gauche = cx - 38;
  const mv = ev => { if (!drag || !ref.current || !interactif) return; const { X } = coordSvg(ref.current, ev); onDrag(Math.max(-0.95, Math.min(0.95, (X - XE) / SX))); };
  const fin = ev => { if (!drag) return; setDrag(false); try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* sans effet */ } onRelease(); };
  const cle = ev => {
    if (!interactif) return;
    if (ev.key === 'ArrowRight') { ev.preventDefault(); onDrag(Math.min(0.95, x + 0.1)); } else if (ev.key === 'ArrowLeft') { ev.preventDefault(); onDrag(Math.max(-0.95, x - 0.1)); }
    else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onRelease(); }
  };
  const alpha = zeta > 0 ? Math.min(0.85, 0.25 + 1.2 * zeta) : 0;
  const pousse = afficheEntretien && c > 0.05 && zeta > 0 && Math.abs(vitesse) > 0.08;
  const sens = vitesse >= 0 ? 1 : -1, L = 14 + 34 * c;
  return (
    <svg ref={ref} viewBox="0 0 400 215" role="img" aria-label={aria} style={{ width: '100%', display: 'block', touchAction: 'none' }}>
      <defs>
        <linearGradient id="ose-chariot" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#38bdf8"/><stop offset="1" stopColor="#0369a1"/></linearGradient>
        <pattern id="ose-hach" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="2"/></pattern>
      </defs>
      <rect x="6" y="52" width="16" height="112" rx="3" fill="url(#ose-hach)" stroke="#94a3b8"/>
      <line x1="22" x2="22" y1="52" y2="164" stroke={GRIS} strokeWidth="3"/>
      <line x1="22" x2="394" y1={YR} y2={YR} stroke={GRIS} strokeWidth="3.5"/>
      <line x1={XE} x2={XE} y1="46" y2="174" stroke="#94a3b8" strokeWidth="1.6" strokeDasharray="6 5"/>
      <text x={XE} y="40" textAnchor="middle" fontSize="15" fill={GRIS}>équilibre</text>
      {afficheAmort && zeta > 0 && <g>
        <rect x="24" y="62" width="62" height="18" rx="4" fill="#bae6fd" fillOpacity={alpha} stroke={GRIS} strokeWidth="2"/>
        <polyline points={`${86},71 ${Math.max(86, cx - 20)},71 ${cx - 20},106`} fill="none" stroke="#64748b" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round"/>
        <text x="30" y="57" fontSize="13" fill={GRIS}>amortisseur</text>
      </g>}
      {afficheEntretien && <g>
        <rect x="336" y="64" width="50" height="46" rx="6" fill={c > 0.05 ? '#dcfce7' : '#f1f5f9'} stroke={c > 0.05 ? VERT : '#94a3b8'} strokeWidth="2.2"/>
        <text x="361" y="92" textAnchor="middle" fontSize="11" fontWeight="700" fill={c > 0.05 ? VERT : GRIS}>entretien</text>
      </g>}
      <polyline points={zigzag(22, gauche, 130)} fill="none" stroke="#64748b" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
      {Math.abs(xc) > 0.05 && <g>
        <line x1={XE} x2={cx} y1="184" y2="184" stroke={ORANGE} strokeWidth="3"/>
        <polygon points={`${cx},184 ${cx + (xc > 0 ? -10 : 10)},178 ${cx + (xc > 0 ? -10 : 10)},190`} fill={ORANGE}/>
        <text x={(XE + cx) / 2} y="206" textAnchor="middle" fontSize="18" fontStyle="italic" fontWeight="700" fill={ORANGE}>x</text>
      </g>}
      {pousse && <g>
        <line x1={cx} x2={cx + sens * L} y1="94" y2="94" stroke={VERT} strokeWidth="4"/>
        <polygon points={`${cx + sens * (L + 9)},94 ${cx + sens * L},88 ${cx + sens * L},100`} fill={VERT}/>
      </g>}
      <g className="xa-poignee" role="slider" tabIndex={interactif ? 0 : -1} aria-label="Chariot : tirez-le vers la gauche ou vers la droite, puis lâchez" aria-valuemin={-95} aria-valuemax={95} aria-valuenow={Math.round(x * 100)}
        onPointerDown={ev => { if (!interactif) return; setDrag(true); ev.currentTarget.setPointerCapture(ev.pointerId); mv(ev); }} onPointerMove={mv} onPointerUp={fin} onPointerCancel={fin} onKeyDown={cle} style={{ cursor: interactif ? 'grab' : 'default', outline: 'none' }}>
        {interactif && <rect x={cx - 50} y="90" width="100" height="76" rx="12" fill="transparent"/>}
        {interactif && indice && !drag && <rect x={cx - 44} y="100" width="88" height="58" rx="10" fill="none" stroke={ORANGE} strokeWidth="2" strokeDasharray="5 4"/>}
        <rect x={gauche} y="106" width="76" height="46" rx="8" fill="url(#ose-chariot)" stroke="#075985" strokeWidth="2"/>
        <circle cx={cx - 22} cy="156" r="6" fill="#334155"/><circle cx={cx + 22} cy="156" r="6" fill="#334155"/>
        <text x={cx} y="137" textAnchor="middle" fontSize="22" fontWeight="700" fontStyle="italic" fill="#fff">m</text>
      </g>
      {interactif && indice && <text x="200" y="22" textAnchor="middle" fontSize="15" fill={GRIS}>Tirez le chariot, puis lâchez-le</text>}
    </svg>);
}

// Barres d'énergie (en pourcentage de l'énergie initiale E0), seules les barres demandées s'affichent.
export function BarresEnergie({ ep, ec, em, q = 0, w = 0, montrer, aria }) {
  const lignes = [['ep', 'Ep', ep, 'énergie potentielle'], ['ec', 'Ec', ec, 'énergie cinétique'], ['em', 'Em', em, 'énergie mécanique'], ['q', 'Pertes', q, 'énergie dissipée'], ['w', 'Apport', w, 'énergie apportée']].filter(l => montrer[l[0]]);
  const H = 18 + lignes.length * 36;
  return (
    <svg viewBox={`0 0 300 ${H}`} role="img" aria-label={aria || 'Barres des énergies, en pourcentage de l’énergie initiale.'} style={{ width: '100%', display: 'block' }}>
      <text x="150" y="14" textAnchor="middle" fontSize="13" fill={GRIS}>énergies, en % de l’énergie initiale E₀</text>
      {lignes.map(([k, nom, v, long], i) => { const y = 24 + i * 36, pct = Math.max(0, v) * 100, l = Math.min(1, Math.max(0, v)) * 168;
        return (<g key={k}>
          <text x="4" y={y + 17} fontSize="15" fontWeight="700" fill={COUL[k]}>{nom}</text>
          <rect x="62" y={y + 2} width="170" height="22" rx="6" fill="#f1f5f9" stroke="#e2e8f0"><title>{long}</title></rect>
          <rect x="63" y={y + 3} width={l} height="20" rx="5" fill={COUL[k]}/>
          <text x="238" y={y + 18} fontSize="14" fontWeight="700" fill="#0f172a">{pct > 300 ? '> 300' : nbf(pct, 0)} %</text>
        </g>); })}
    </svg>);
}

// Graphe de Ec, Ep, Em en fonction du temps, tracé en direct jusqu'à l'instant t (énergies en unités de E0).
export function GrapheEnergie({ S, t, tFin, montrer, etroit = false, titre = 'Énergies en fonction du temps', aria }) {
  const F = etroit ? 1.25 : 1, X0 = 54, W = 372, Y0 = 254, H = 210;
  const tx = u => X0 + (W * u) / tFin, ty = v => Y0 - Math.min(v, 1.08) * H / 1.08;
  const tm = Math.min(t, tFin), im = Math.round(tm / S.dt);
  const ligne = (k, ep) => { const p = []; for (let i = 0; i <= im; i += 2) p.push(`${tx(S.t[i]).toFixed(1)},${ty(S[k][i]).toFixed(1)}`); return p.length > 1 ? <polyline points={p.join(' ')} fill="none" stroke={COUL[k]} strokeWidth={ep} strokeLinejoin="round"/> : null; };
  const ticks = []; for (let u = 0; u <= tFin + 1e-9; u += 1) ticks.push(u);
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{titre}</div>
      <svg viewBox="0 0 440 290" style={{ width: '100%', display: 'block' }} role="img" aria-label={aria || 'Graphe des énergies cinétique, potentielle et mécanique du chariot en fonction du temps, tracé pendant le mouvement.'}>
        <rect x={X0} y="22" width={W} height="232" rx="6" fill="#fafcff" stroke="#e2e8f0"/>
        {ticks.map(u => <line key={u} x1={tx(u)} x2={tx(u)} y1="22" y2="254" stroke="#e2e8f0" strokeWidth="1"/>)}
        {[0.5, 1].map(v => <line key={v} x1={X0} x2={X0 + W} y1={ty(v)} y2={ty(v)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4"/>)}
        {ticks.map(u => <text key={u} x={tx(u)} y="272" textAnchor="middle" fontSize={14 * F}>{nbf(u, 0)}</text>)}
        <text x={X0 + W / 2} y="288" textAnchor="middle" fontSize={14 * F} fill={GRIS}>temps t (s)</text>
        <text x={X0 - 6} y={ty(0) + 5} textAnchor="end" fontSize={14 * F} fill={GRIS}>0</text>
        <text x={X0 - 6} y={ty(1) + 5} textAnchor="end" fontSize={14 * F} fill={GRIS}>E₀</text>
        {montrer.ep && ligne('ep', 3)}{montrer.ec && ligne('ec', 3)}{montrer.em && ligne('em', 4)}
        {['ep', 'ec', 'em'].filter(k => montrer[k]).map((k, j) => <g key={k}><rect x={X0 + 8 + j * 56} y="28" width="14" height="6" fill={COUL[k]}/><text x={X0 + 26 + j * 56} y="36" fontSize={13 * F} fontWeight="700" fill={COUL[k]}>{k === 'ep' ? 'Ep' : k === 'ec' ? 'Ec' : 'Em'}</text></g>)}
      </svg>
    </div>);
}

// Vignette statique d'une courbe d'énergie (défi « quelle courbe ? ») : un seul tracé, sans légende de grandeur.
export function MiniEnergie({ S, cle, aria }) {
  const W = 200, H = 110, N = 120, pts = []; const tFin = S.t[S.n];
  for (let i = 0; i <= N; i++) { const j = Math.round(i / N * S.n); pts.push(`${(8 + (W - 16) * S.t[j] / tFin).toFixed(1)},${(H - 12 - Math.min(S[cle][j], 1.05) * 84).toFixed(1)}`); }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img" aria-label={aria}>
      <rect x="2" y="2" width={W - 4} height={H - 4} rx="8" fill="#fafcff" stroke="#e2e8f0"/>
      {[1, 2, 3, 4].map(k => <line key={k} x1={8 + (W - 16) * k / 5} x2={8 + (W - 16) * k / 5} y1="4" y2={H - 4} stroke="#eef2f7"/>)}
      <line x1="8" x2={W - 8} y1={H - 12} y2={H - 12} stroke="#94a3b8" strokeWidth="1.2"/>
      <polyline points={pts.join(' ')} fill="none" stroke={BLEU} strokeWidth="2.8" strokeLinejoin="round"/>
    </svg>);
}
