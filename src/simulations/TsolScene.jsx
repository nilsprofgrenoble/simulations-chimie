import { useId } from "react";
import { coordSvg } from "./exploAnim";
import * as M from "./tsolModele";

// ====================================================
//  Scène animée de la simulation 312 : un bécher (eau + solide), un thermomètre, la courbe de solubilité s(T) et le point d'état (T ; masse de solide pour 100 g d'eau).
//  Tout est une fonction de la température T : on la règle par la poignée sur l'axe, ou par un balayage (chauffer / refroidir). Au-dessus de la courbe, le solide ne se dissout plus entièrement : des cristaux se déposent.
// ====================================================
const STROKE = '#334155';
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const spot = (k, s) => ({ u: ((k + 1) * (0.6180339887 + s * 0.137)) % 1, v: ((k + 1) * (0.7548776662 + s * 0.071)) % 1 });
export const T_PAS = 1;
export const N_IONS = 14, N_GRAINS = 18;

function layout(etroit, becher) {
  if (becher) return etroit
    ? { W: 420, H: 640, fs: 1.15, B: { bx: 60, bw: 290, bh: 190, bB: 250 }, G: { x0: 72, x1: 396, yT: 346, yB: 560 } }
    : { W: 700, H: 380, fs: 1, B: { bx: 30, bw: 250, bh: 200, bB: 310 }, G: { x0: 402, x1: 672, yT: 46, yB: 290 } };
  return etroit
    ? { W: 420, H: 350, fs: 1.15, B: null, G: { x0: 66, x1: 396, yT: 40, yB: 270 } }
    : { W: 700, H: 330, fs: 1, B: null, G: { x0: 80, x1: 672, yT: 36, yB: 260 } };
}

export function SceneSolubilite({ solide, m, mEau, T, setT, etroit = false, touche = true, svgRef, aria, phase = 0, dir = null, lecture = false, pointEtat = true, regions = true, becher = true }) {
  const id = useId().replace(/:/g, ''), so = solide, { W, H, fs, B, G } = layout(etroit, becher);
  const xT = t => G.x0 + clamp(t, 0, 100) / 100 * (G.x1 - G.x0), yS = s => G.yB - clamp(s, 0, so.ymax) / so.ymax * (G.yB - G.yT);
  const e = M.etat(so, T, m, mEau), w = m / mEau * 100, sT = M.sol(so, T), xc = xT(T);
  const courbe = []; for (let t = 0; t <= 100; t += 2) courbe.push(`${xT(t).toFixed(1)},${yS(M.sol(so, t)).toFixed(1)}`);
  const ligne = courbe.join(' '), dessous = `${xT(0)},${G.yB} ${ligne} ${xT(100)},${G.yB}`, dessus = `${xT(0)},${G.yT} ${ligne} ${xT(100)},${G.yT}`;
  const croit = so.sens === 'croissante';
  // contenu du bécher
  const ions = [], grains = [];
  let yL = 0, reg = null, bord = '';
  if (B) {
    yL = B.bB - B.bh + 26; reg = { x0: B.bx + 16, x1: B.bx + B.bw - 16, y0: yL + 18, y1: B.bB - 34 };
    bord = `M${B.bx} ${B.bB - B.bh} L${B.bx + 6} ${B.bB - 4} Q${B.bx + 7} ${B.bB} ${B.bx + 14} ${B.bB} L${B.bx + B.bw - 14} ${B.bB} Q${B.bx + B.bw - 7} ${B.bB} ${B.bx + B.bw - 6} ${B.bB - 4} L${B.bx + B.bw} ${B.bB - B.bh}`;
    const fd = m > 0 ? e.dissous / m : 0, reste = N_IONS * fd;
    for (let k = 0; k < N_IONS; k++) { const op = clamp(reste - k, 0, 1); if (op > 0.02) ions.push({ k, op }); }
    const form = e.cristaux > 0 ? Math.max(0.7, e.cristaux / m * N_GRAINS) : 0;
    for (let k = 0; k < N_GRAINS; k++) {
      const p = clamp(form - k, 0, 1); if (p <= 0) continue;
      const { u, v } = spot(k + 40, 2), x0 = reg.x0 + u * (reg.x1 - reg.x0), y0 = reg.y0 + v * (reg.y1 - reg.y0);
      const lit = Math.floor(k / 9), col = k % 9, xr = B.bx + 24 + (col + 0.5 + (lit % 2) * 0.5) * ((B.bw - 48) / 9.5), yr = B.bB - 10 - lit * 9, ww = ease(p);
      grains.push({ k, x: x0 + (xr - x0) * ww, y: y0 + (yr - y0) * ww, op: Math.min(1, p * 3), r: 4.6 + (k % 3) * 0.9 });
    }
  }
  const pos = (k, s) => { const { u, v } = spot(k, s); return { x: reg.x0 + u * (reg.x1 - reg.x0) + 3.2 * Math.sin(phase * 1.3 + k * 1.7), y: reg.y0 + v * (reg.y1 - reg.y0) + 3.2 * Math.cos(phase * 1.1 + k * 2.3) }; };
  const poser = ev => { const { X } = coordSvg(svgRef.current, ev); setT(clamp(Math.round((X - G.x0) / (G.x1 - G.x0) * 100 / T_PAS) * T_PAS, 0, 100)); };
  const drag = {
    onPointerDown: ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); ev.currentTarget.dataset.d = '1'; poser(ev); },
    onPointerMove: ev => { if (ev.currentTarget.dataset.d === '1') poser(ev); },
    onPointerUp: ev => { ev.currentTarget.dataset.d = ''; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } },
  };
  const grilleY = []; for (let v = 0; v <= so.ymax + 1e-9; v += so.pasY) grilleY.push(v);
  const fmtY = v => (so.ymax <= 5 ? M.nbf(v, 1) : String(v));
  const rayon = etroit ? 17 : 14, couleurPt = e.statut === 'depot' ? '#f59e0b' : e.statut === 'limite' ? '#16a34a' : so.col;
  const merc = clamp(T / 100, 0, 1), rouge = Math.round(30 + 200 * merc), bleu = Math.round(220 - 170 * merc);
  const ancre = xc < G.x0 + 40 ? 'start' : xc > G.x1 - 40 ? 'end' : 'middle';
  return (
    <svg ref={svgRef} className="xa-svg" viewBox={`0 0 ${W} ${H}`} role="group" aria-label={aria} style={{ background: 'linear-gradient(#f0f9ff, #fff 70%)' }}>
      <defs>
        <linearGradient id={`${id}b`} x1="0" x2="1"><stop offset="0" stopColor="#bae6fd" stopOpacity="0.9"/><stop offset="1" stopColor="#e0f2fe" stopOpacity="0.8"/></linearGradient>
        {B && <clipPath id={`${id}m`}><path d={`${bord} Z`}/></clipPath>}
        <filter id={`${id}o`} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.2"/></filter>
      </defs>
      {B && <g>
        {/* plaque chauffante / bain froid */}
        <rect x={B.bx - 12} y={B.bB + 3} width={B.bw + 24} height="14" rx="4" fill="#475569"/>
        {dir === 'chaud' && <g>{[0, 1, 2, 3, 4].map(i => <path key={i} d={`M${B.bx + 20 + i * ((B.bw - 40) / 4)} ${B.bB + 28} q${5 * Math.sin(phase * 2 + i)} -8 0 -16`} stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" opacity={0.55 + 0.35 * Math.sin(phase * 3 + i)}/>)}</g>}
        {dir === 'froid' && <g>{[0, 1, 2, 3].map(i => <rect key={i} x={B.bx + 30 + i * ((B.bw - 70) / 3)} y={B.bB + 22 + 3 * Math.sin(phase * 2 + i)} width="16" height="13" rx="3" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5"/>)}</g>}
        <g filter={`url(#${id}o)`}>
          <g clipPath={`url(#${id}m)`}>
            <rect x={B.bx} y={yL} width={B.bw} height={B.bB - yL + 10} fill={`url(#${id}b)`}/>
            <line x1={B.bx} x2={B.bx + B.bw} y1={yL} y2={yL} stroke="#38bdf8" strokeWidth="2" opacity="0.8"/>
            {ions.map(o => { const p = pos(o.k, 1); return <circle key={o.k} cx={p.x} cy={p.y} r={6 * Math.max(1, fs * 0.95)} fill={so.col} stroke="#fff" strokeWidth="1.6" opacity={o.op * 0.9}/>; })}
            {grains.map(q => <polygon key={q.k} points={`${q.x},${q.y - q.r} ${q.x + q.r},${q.y} ${q.x},${q.y + q.r * 0.8} ${q.x - q.r},${q.y}`} fill="#fff" stroke={so.col} strokeWidth="1.6" strokeLinejoin="round" opacity={q.op}/>)}
          </g>
          <path d={bord} fill="none" stroke={STROKE} strokeWidth="3" strokeLinecap="round"/>
          <path d={`M${B.bx + 12} ${B.bB - B.bh + 10} L${B.bx + 17} ${B.bB - 18}`} stroke="#fff" strokeWidth="4" opacity="0.7" strokeLinecap="round"/>
        </g>
        <text x={B.bx + B.bw / 2} y={B.bB - B.bh - 8} textAnchor="middle" fontSize={13.5 * fs} fontWeight="800" fill={so.col}>{so.formule}</text>
        <text x={B.bx + B.bw / 2} y={B.bB + 58 * fs} textAnchor="middle" fontSize={12.5 * fs} fontWeight="700" fill="#334155">{M.gTxt(mEau)}{M.NB}g d’eau · {M.gTxt(m)}{M.NB}g de {so.formule}</text>
        {/* thermomètre */}
        <g>
          <rect x={B.bx + B.bw + 14} y={B.bB - 150} width="12" height="146" rx="6" fill="#fff" stroke={STROKE} strokeWidth="2"/>
          <rect x={B.bx + B.bw + 17.5} y={B.bB - 8 - merc * 128} width="5" height={merc * 128 + 2} rx="2.5" fill={`rgb(${rouge},60,${bleu})`}/>
          <circle cx={B.bx + B.bw + 20} cy={B.bB - 2} r="9" fill={`rgb(${rouge},60,${bleu})`} stroke={STROKE} strokeWidth="2"/>
          <text x={B.bx + B.bw + 20} y={B.bB - 160} textAnchor="middle" fontSize={13 * fs} fontWeight="800" fill={`rgb(${rouge},60,${bleu})`}>{Math.round(T)}{M.NB}°C</text>
        </g>
      </g>}
      {/* graphe de la solubilité */}
      <rect x={G.x0} y={G.yT} width={G.x1 - G.x0} height={G.yB - G.yT} fill="#fff" stroke="#e2e8f0"/>
      {regions && <g>
        <polygon points={dessous} fill={so.colS} opacity="0.4"/>
        <polygon points={dessus} fill="#fde68a" opacity="0.25"/>
        <text x={croit ? G.x0 + 8 : G.x1 - 8} y={G.yT + 18 * fs} textAnchor={croit ? 'start' : 'end'} fontSize={12.5 * fs} fontWeight="800" fill="#b45309">au-dessus : dépôt de cristaux</text>
        <text x={croit ? G.x1 - 8 : G.x0 + 8} y={G.yB - 34 * fs} textAnchor={croit ? 'end' : 'start'} fontSize={12.5 * fs} fontWeight="800" fill={so.col}>au-dessous : tout est dissous</text>
      </g>}
      {grilleY.map(v => <g key={v}><line x1={G.x0} x2={G.x1} y1={yS(v)} y2={yS(v)} stroke="#cbd5e1" strokeWidth={v === 0 ? 0 : 0.8}/><text x={G.x0 - 6} y={yS(v) + 4} textAnchor="end" fontSize={11.5 * fs} fill="#475569">{fmtY(v)}</text></g>)}
      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(t => <line key={t} x1={xT(t)} x2={xT(t)} y1={G.yT} y2={G.yB} stroke="#cbd5e1" strokeWidth={t % 20 === 0 ? 0.9 : 0.5}/>)}
      <line x1={G.x0} x2={G.x1} y1={G.yB} y2={G.yB} stroke={STROKE} strokeWidth="2"/><line x1={G.x0} x2={G.x0} y1={G.yT} y2={G.yB} stroke={STROKE} strokeWidth="2"/>
      {[0, 20, 40, 60, 80, 100].map(t => <text key={t} x={xT(t)} y={G.yB + 17 * fs} textAnchor="middle" fontSize={11.5 * fs} fill="#334155">{t}</text>)}
      <text x={G.x0} y={G.yT - 8} fontSize={12.5 * fs} fontWeight="700" fill="#0f172a">s (g pour 100 g d’eau)</text>
      <text x={G.x1} y={G.yB + 34 * fs} textAnchor="end" fontSize={12.5 * fs} fontWeight="700" fill="#334155">T (°C)</text>
      <polyline points={ligne} fill="none" stroke={so.col} strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round"/>
      {/* repère de température, lecture, point d'état */}
      <line x1={xc} x2={xc} y1={G.yT} y2={G.yB} stroke="#0f172a" strokeWidth="2" strokeDasharray="5 3" pointerEvents="none"/>
      {lecture && <g pointerEvents="none">
        <line x1={G.x0} x2={xc} y1={yS(sT)} y2={yS(sT)} stroke={so.col} strokeWidth="1.8" strokeDasharray="4 3"/>
        <circle cx={xc} cy={yS(sT)} r="5.5" fill="#fff" stroke={so.col} strokeWidth="3"/>
        <text x={G.x0 + 8} y={yS(sT) - 7} fontSize={13 * fs} fontWeight="800" fill={so.col}>s = {M.gTxt(sT)}</text>
      </g>}
      {pointEtat && <g pointerEvents="none">
        <circle cx={xc} cy={yS(w)} r={9 * Math.max(1, fs * 0.9)} fill={couleurPt} opacity="0.25"/>
        <circle cx={xc} cy={yS(w)} r={6 * Math.max(1, fs * 0.9)} fill={couleurPt} stroke="#fff" strokeWidth="2"/>
        <text x={xc + (ancre === 'end' ? -12 : 12)} y={yS(w) - 10} textAnchor={ancre === 'end' ? 'end' : 'start'} fontSize={12.5 * fs} fontWeight="800" fill={couleurPt}>{M.gTxt(w)} g / 100 g</text>
      </g>}
      <rect x={G.x0 - 6} y={G.yT} width={G.x1 - G.x0 + 12} height={G.yB - G.yT + 30} fill="transparent" style={{ touchAction: 'none', cursor: 'pointer' }} {...drag}/>
      <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Température : flèches gauche et droite (1 °C), Page haut et bas (10 °C)" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(T)} aria-valuetext={`${Math.round(T)} °C`} {...drag}
        onKeyDown={ev => { const d = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : ev.key === 'PageUp' ? 10 : ev.key === 'PageDown' ? -10 : 0; if (d) { ev.preventDefault(); setT(clamp(Math.round(T) + d, 0, 100)); } }} style={{ touchAction: 'none', cursor: 'grab', outline: 'none' }}>
        <rect x={xc - 26} y={G.yB - 20} width="52" height="44" fill="transparent"/>
        <circle className="xa-anneau" cx={xc} cy={G.yB} r={rayon} fill="#fff" stroke="#dc2626" strokeWidth="3.5"/>
        <path d={`M${xc - 4} ${G.yB} l-5 0 M${xc + 4} ${G.yB} l5 0 M${xc - 8} ${G.yB} l4 -4 M${xc - 8} ${G.yB} l4 4 M${xc + 8} ${G.yB} l-4 -4 M${xc + 8} ${G.yB} l-4 4`} stroke="#dc2626" strokeWidth="2" fill="none"/>
        {!touche && <circle className="xa-pulse" cx={xc} cy={G.yB} r={rayon + 5} fill="none" stroke="#dc2626" strokeWidth="3"/>}
      </g>
      <text x={xc} y={G.yB + 50 * fs} textAnchor={ancre} fontSize={13.5 * fs} fontWeight="800" fill="#dc2626" pointerEvents="none">T = {Math.round(T)}{M.NB}°C</text>
    </svg>);
}
