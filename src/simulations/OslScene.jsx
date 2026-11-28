import { useRef, useState } from "react";
import { coordSvg, nbf } from "./exploAnim";
import * as M from "./oslModele";

// Scène animée de la simulation 321 : un ressort vertical avec sa masse (qu'on tire à la souris, au doigt ou aux flèches du clavier) et le graphe x(t) tracé en direct.
// Le ressort et son amortisseur se dessinent ; l'élève lâche la masse et observe le régime obtenu. Convention : x > 0 vers le bas.
const BLEU = '#0369a1', ORANGE = '#ea580c', GRIS = '#475569', VERT = '#15803d';
const SY = 95, YEQ = 172, XM = 100;

function ressort(yHaut, yBas, n = 9, amp = 17) {
  const pts = [[XM, yHaut]]; const h = (yBas - yHaut - 16) / n;
  for (let i = 0; i < n; i++) pts.push([XM + (i % 2 ? -amp : amp), yHaut + 8 + h * (i + 0.5)]);
  pts.push([XM, yBas]);
  return pts.map(p => p.join(',')).join(' ');
}

export function SceneRessort({ x, zeta = 0, afficheAmort = true, interactif = true, onDrag, onRelease, aria, indice = true, montrerX = true }) {
  const ref = useRef(null), [drag, setDrag] = useState(false);
  const xc = Math.max(-0.97, Math.min(0.97, x)), yc = YEQ + xc * SY, haut = yc - 22;
  const mv = ev => { if (!drag || !ref.current || !interactif) return; const { Y } = coordSvg(ref.current, ev); onDrag(Math.max(-0.95, Math.min(0.95, (Y - YEQ) / SY))); };
  const fin = ev => { if (!drag) return; setDrag(false); try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* sans effet */ } onRelease(); };
  const cle = ev => {
    if (!interactif) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); onDrag(Math.min(0.95, x + 0.1)); } else if (ev.key === 'ArrowUp') { ev.preventDefault(); onDrag(Math.max(-0.95, x - 0.1)); }
    else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onRelease(); }
  };
  const alpha = zeta > 0 ? Math.min(0.85, 0.25 + 0.3 * Math.min(zeta, 2)) : 0;
  return (
    <svg ref={ref} viewBox="0 0 250 330" role="img" aria-label={aria} style={{ width: '100%', maxWidth: 260, display: 'block', margin: '0 auto', touchAction: 'none' }}>
      <defs>
        <linearGradient id="osl-masse" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#38bdf8"/><stop offset="1" stopColor="#0369a1"/></linearGradient>
        <pattern id="osl-hach" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="2"/></pattern>
      </defs>
      <rect x="20" y="6" width="210" height="14" rx="3" fill="url(#osl-hach)" stroke="#94a3b8"/>
      <line x1="20" x2="230" y1="20" y2="20" stroke="#475569" strokeWidth="3"/>
      {/* position d'équilibre */}
      <line x1="30" x2="226" y1={YEQ} y2={YEQ} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6 5"/>
      <text x="246" y={YEQ - 6} textAnchor="end" fontSize="16" fill={GRIS}>équilibre</text>
      {/* amortisseur */}
      {afficheAmort && zeta > 0 && <g>
        <line x1="175" x2="175" y1={Math.max(52, haut - 74)} y2={haut} stroke="#64748b" strokeWidth="5" strokeLinecap="round"/>
        <rect x="163" y="20" width="24" height="86" rx="4" fill="#bae6fd" fillOpacity={alpha} stroke="#475569" strokeWidth="2"/>
        <text transform="rotate(90 192 30)" x="192" y="30" fontSize="15" fill={GRIS}>amortisseur</text>
      </g>}
      {/* ressort */}
      <line x1={XM} x2={XM} y1="20" y2="28" stroke="#475569" strokeWidth="3"/>
      <polyline points={ressort(28, haut)} fill="none" stroke="#64748b" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
      {/* flèche du déplacement x */}
      {montrerX && Math.abs(xc) > 0.06 && <g>
        <line x1="46" x2="46" y1={YEQ} y2={yc} stroke={ORANGE} strokeWidth="3"/>
        <polygon points={`46,${yc} 40,${yc + (xc > 0 ? -10 : 10)} 52,${yc + (xc > 0 ? -10 : 10)}`} fill={ORANGE}/>
        <text x="28" y={(YEQ + yc) / 2 + 5} textAnchor="middle" fontSize="20" fontStyle="italic" fontWeight="700" fill={ORANGE}>x</text>
      </g>}
      {/* masse (poignée) */}
      <g className="xa-poignee" role="slider" tabIndex={interactif ? 0 : -1} aria-label="Masse : tirez-la vers le haut ou vers le bas, puis lâchez" aria-valuemin={-95} aria-valuemax={95} aria-valuenow={Math.round(x * 100)}
        onPointerDown={ev => { if (!interactif) return; setDrag(true); ev.currentTarget.setPointerCapture(ev.pointerId); mv(ev); }} onPointerMove={mv} onPointerUp={fin} onPointerCancel={fin} onKeyDown={cle} style={{ cursor: interactif ? 'grab' : 'default', outline: 'none' }}>
        {interactif && <rect x={XM - 52} y={yc - 34} width="104" height="68" rx="12" fill="transparent"/>}
        {interactif && indice && !drag && <rect x={XM - 44} y={yc - 26} width="88" height="52" rx="10" fill="none" stroke={ORANGE} strokeWidth="2" strokeDasharray="5 4"/>}
        <rect x={XM - 36} y={yc - 22} width="72" height="44" rx="8" fill="url(#osl-masse)" stroke="#075985" strokeWidth="2"/>
        <text x={XM} y={yc + 8} textAnchor="middle" fontSize="24" fontWeight="700" fontStyle="italic" fill="#fff">m</text>
      </g>
      {interactif && indice && <text x="125" y="322" textAnchor="middle" fontSize="16" fill={GRIS}>Tirez la masse, puis lâchez-la</text>}
    </svg>);
}

// Graphe de x(t) tracé en direct jusqu'à l'instant t (le graphe se remplit pendant le mouvement).
export function GrapheX({ t, x0, f0, zeta, tFin, enveloppe = false, marqueT = false, marqueTau = false, etroit = false, titre = 'Position x en fonction du temps', aria }) {
  const F = etroit ? 1.25 : 1, X0 = 54, W = 372, Y0 = 138, H = 104;
  const tx = u => X0 + (W * u) / tFin, ty = v => Y0 - v * H;
  const N = 320, pts = [], tm = Math.min(t, tFin);
  for (let i = 0; i * tFin / N <= tm + 1e-9; i++) { const u = i * tFin / N; pts.push(`${tx(u).toFixed(1)},${ty(M.pos(u, x0, f0, zeta)).toFixed(1)}`); }
  const pas = tFin > 8 ? 2 : 1, ticks = []; for (let u = 0; u <= tFin + 1e-9; u += 0.5) ticks.push(u);
  const tau = M.tauAmort(f0, zeta), Tp = M.pseudoPeriode(f0, zeta), pseudo = Number.isFinite(Tp);
  const env = [];
  if (enveloppe && Number.isFinite(tau)) for (let i = 0; i <= N; i++) { const u = i * tFin / N; env.push([tx(u).toFixed(1), ty(M.enveloppe(u, x0, f0, zeta))]); }
  const xnow = M.pos(tm, x0, f0, zeta);
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{titre}</div>
      <svg viewBox="0 0 440 290" style={{ width: '100%', display: 'block' }} role="img" aria-label={aria || 'Graphe de la position de la masse en fonction du temps, tracé pendant le mouvement.'}>
        <rect x={X0} y="22" width={W} height="232" rx="6" fill="#fafcff" stroke="#e2e8f0"/>
        {ticks.map(u => <line key={u} x1={tx(u)} x2={tx(u)} y1="22" y2="254" stroke={u % 1 === 0 ? '#e2e8f0' : '#f1f5f9'} strokeWidth="1"/>)}
        <line x1={X0} x2={X0 + W} y1={Y0} y2={Y0} stroke="#64748b" strokeWidth="1.5"/>
        {ticks.filter(u => u % pas === 0).map(u => <text key={u} x={tx(u)} y="272" textAnchor="middle" fontSize={14 * F}>{nbf(u, 0)}</text>)}
        <text x={X0 + W / 2} y="288" textAnchor="middle" fontSize={14 * F} fill={GRIS}>temps t (s)</text>
        <text x={X0 - 6} y={Y0 + 5} textAnchor="end" fontSize={14 * F} fill={GRIS}>0</text>
        <text x={X0 - 6} y="40" textAnchor="end" fontSize={14 * F} fill={GRIS}>x</text>
        {env.length > 0 && <g fill="none" stroke={VERT} strokeWidth="2" strokeDasharray="7 5"><polyline points={env.map(p => `${p[0]},${p[1]}`).join(' ')}/><polyline points={env.map(p => `${p[0]},${2 * Y0 - p[1]}`).join(' ')}/></g>}
        {marqueTau && Number.isFinite(tau) && tau < tFin && <g><line x1={tx(tau)} x2={tx(tau)} y1="22" y2="254" stroke={ORANGE} strokeWidth="2" strokeDasharray="4 4"/><text x={tx(tau) + 5} y="38" fontSize={16 * F} fontWeight="700" fill={ORANGE}>τ</text></g>}
        {marqueT && pseudo && tm >= 2 * Tp && 2 * Tp <= tFin && <g stroke={ORANGE} strokeWidth="2.5" fill={ORANGE}>
          <line x1={tx(Tp)} x2={tx(2 * Tp)} y1="46" y2="46"/><polygon points={`${tx(Tp)},46 ${tx(Tp) + 8},41 ${tx(Tp) + 8},51`} stroke="none"/><polygon points={`${tx(2 * Tp)},46 ${tx(2 * Tp) - 8},41 ${tx(2 * Tp) - 8},51`} stroke="none"/>
          <text x={(tx(Tp) + tx(2 * Tp)) / 2} y="36" textAnchor="middle" fontSize={17 * F} fontWeight="700" stroke="none">T</text></g>}
        {pts.length > 1 && <polyline points={pts.join(' ')} fill="none" stroke={BLEU} strokeWidth="3.2" strokeLinejoin="round"/>}
        <circle cx={tx(tm)} cy={ty(xnow)} r="6" fill={ORANGE} stroke="#fff" strokeWidth="2"/>
      </svg>
    </div>);
}

// Vignette statique d'une courbe (défi « quel régime ? ») : trace complète sur [0, tFin].
export function MiniCourbe({ f0, zeta, tFin, couleur = BLEU, aria }) {
  const W = 200, H = 110, N = 140, pts = [];
  for (let i = 0; i <= N; i++) { const u = i * tFin / N; pts.push(`${(8 + (W - 16) * i / N).toFixed(1)},${(H / 2 - M.pos(u, 1, f0, zeta) * 38).toFixed(1)}`); }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img" aria-label={aria}>
      <rect x="2" y="2" width={W - 4} height={H - 4} rx="8" fill="#fafcff" stroke="#e2e8f0"/>
      {[1, 2, 3, 4, 5].map(k => <line key={k} x1={8 + (W - 16) * k / 6} x2={8 + (W - 16) * k / 6} y1="4" y2={H - 4} stroke="#eef2f7"/>)}
      <line x1="8" x2={W - 8} y1={H / 2} y2={H / 2} stroke="#94a3b8" strokeWidth="1.2"/>
      <polyline points={pts.join(' ')} fill="none" stroke={couleur} strokeWidth="2.8" strokeLinejoin="round"/>
    </svg>);
}
