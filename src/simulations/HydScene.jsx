import { useId } from "react";
import * as M from "./hydModele";
import { coordSvg } from "./exploAnim";

// ====================================================
//  Scène animée de la simulation 311 : un bécher contient deux cations métalliques ; on règle le pH (poignée sur l'axe, ou ajout de soude animé).
//  Quand le pH dépasse le seuil d'un cation, ses ions disparaissent et des grains d'hydroxyde se forment puis tombent au fond (nombre de grains = fraction précipitée).
//  L'axe de pH montre, pour chaque cation, la zone où il précipite (début → quasi total) et la fenêtre de séparation entre les deux.
// ====================================================
const STROKE = '#334155';
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const spot = (k, s) => ({ u: ((k + 1) * (0.6180339887 + s * 0.137)) % 1, v: ((k + 1) * (0.7548776662 + s * 0.071)) % 1 });
export const PH_PAS = 0.1;
export const N_IONS = 12, N_GRAINS = 16;

const LAY = {
  large: { W: 700, H: 510, bx: 215, bw: 270, bh: 165, bB: 282, dropY: 14, ax0: 40, ax1: 660, ya: 346, dy: 48, bar: 18, fs: 1, hy: 332 },
  etroit: { W: 420, H: 640, bx: 62, bw: 296, bh: 180, bB: 330, dropY: 18, ax0: 22, ax1: 398, ya: 416, dy: 58, bar: 22, fs: 1.18, hy: 398 },
};

export function SceneHydroxydes({ cations, ph, setPh, etroit = false, touche = true, svgRef, aria, phase = 0, soude = false, barres = true, fenetre = false, chiffres = true, unSeul = false }) {
  const id = useId().replace(/:/g, ''), D = etroit ? LAY.etroit : LAY.large, fs = D.fs;
  const cs = unSeul ? cations.slice(0, 1) : cations;
  const nRows = cs.length, axY = D.ya + nRows * D.dy - 8 + (barres ? 0 : -nRows * D.dy + 20);
  const H = barres ? D.H - (2 - nRows) * D.dy : D.H - 2 * D.dy + 20;
  const xp = p => D.ax0 + clamp(p, 0, 14) / 14 * (D.ax1 - D.ax0);
  const fr = cs.map(({ cat, c }) => M.fractionPrecipitee(cat, c, ph));
  // ions dissous et grains
  const reg = { x0: D.bx + 14, x1: D.bx + D.bw - 14, y0: D.bB - D.bh + 34, y1: D.bB - 38 };
  const pos = (k, s) => { const { u, v } = spot(k, s); return { x: reg.x0 + u * (reg.x1 - reg.x0) + 3.2 * Math.sin(phase * 1.3 + k * 1.7 + s), y: reg.y0 + v * (reg.y1 - reg.y0) + 3.2 * Math.cos(phase * 1.1 + k * 2.3 + s * 3) }; };
  const ions = [], grains = [];
  cs.forEach(({ cat }, i) => {
    const f = fr[i], reste = N_IONS * (1 - f);
    for (let k = 0; k < N_IONS; k++) { const op = clamp(reste - k, 0, 1); if (op > 0.02) ions.push({ k, i, cat, op }); }
    const form = f * N_GRAINS;
    for (let k = 0; k < N_GRAINS; k++) {
      const p = clamp(form - k, 0, 1); if (p <= 0) continue;
      const { u, v } = spot(k + 40, i + 2), x0 = reg.x0 + u * (reg.x1 - reg.x0), y0 = reg.y0 + v * (reg.y1 - reg.y0);
      const slot = k * nRows + i, lit = Math.floor(slot / 9), col = slot % 9, xr = D.bx + 22 + (col + 0.5 + (lit % 2) * 0.5) * ((D.bw - 44) / 9.5), yr = D.bB - 9 - lit * 8, w = ease(p);
      grains.push({ k, i, cat, x: x0 + (xr - x0) * w, y: y0 + (yr - y0) * w, op: Math.min(1, p * 3), r: 4.2 + (k % 3) * 0.8 });
    }
  });
  const trouble = clamp(fr.reduce((a, b) => a + b, 0) / nRows, 0, 1) * 0.18;
  const bordBecher = `M${D.bx} ${D.bB - D.bh} L${D.bx + 6} ${D.bB - 4} Q${D.bx + 7} ${D.bB} ${D.bx + 14} ${D.bB} L${D.bx + D.bw - 14} ${D.bB} Q${D.bx + D.bw - 7} ${D.bB} ${D.bx + D.bw - 6} ${D.bB - 4} L${D.bx + D.bw} ${D.bB - D.bh}`;
  const yL = D.bB - D.bh + 22, pPill = xp(ph);
  const poser = ev => { const { X } = coordSvg(svgRef.current, ev); setPh(clamp(Math.round((X - D.ax0) / (D.ax1 - D.ax0) * 14 / PH_PAS) * PH_PAS, 0, 14)); };
  const drag = {
    onPointerDown: ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); ev.currentTarget.dataset.d = '1'; poser(ev); },
    onPointerMove: ev => { if (ev.currentTarget.dataset.d === '1') poser(ev); },
    onPointerUp: ev => { ev.currentTarget.dataset.d = ''; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } },
  };
  const statutTxt = i => { const { cat, c } = cs[i], st = M.statut(cat, c, ph), f = fr[i] * 100; return st === 'dissous' ? ['dissous', '#475569'] : st === 'total' ? ['précipité', cat.col] : [`précipite ${f >= 10 ? Math.round(f) : M.nbf(f, 1)} %`, cat.col]; };
  const drop = soude ? ((phase * 0.55) % (2 * Math.PI)) / (2 * Math.PI) : -1;
  const ancre = pPill < 70 ? 'start' : pPill > D.W - 70 ? 'end' : 'middle';
  return (
    <svg ref={svgRef} className="xa-svg" viewBox={`0 0 ${D.W} ${H}`} role="group" aria-label={aria} style={{ background: 'linear-gradient(#f0f9ff, #fff 70%)' }}>
      <defs>
        <linearGradient id={`${id}b`} x1="0" x2="1"><stop offset="0" stopColor="#bae6fd" stopOpacity="0.9"/><stop offset="1" stopColor="#e0f2fe" stopOpacity="0.8"/></linearGradient>
        <clipPath id={`${id}m`}><path d={`${bordBecher} Z`}/></clipPath>
        <filter id={`${id}o`} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.2"/></filter>
        {cs.map(({ cat }, i) => <linearGradient key={cat.id} id={`${id}g${i}`} x1="0" x2="1"><stop offset="0" stopColor={cat.colS} stopOpacity="0.25"/><stop offset="1" stopColor={cat.col} stopOpacity="0.95"/></linearGradient>)}
      </defs>
      {/* burette de soude : tube gradué, liquide qui baisse avec le pH, robinet qui s'ouvre, goutte qui tombe */}
      {(() => {
        const cx = D.bx + D.bw / 2, w = 8 * fs, y0 = 6, tipY = yL - 20, yS = tipY - 30 * fs, niv = clamp(0.96 - 0.55 * ph / 14, 0.3, 0.96), yLiq = yS - (yS - y0 - 10) * niv;
        const ticks = []; for (let y = yS - 6, k = 0; y > y0 + 10; y -= 7, k++) ticks.push({ y, long: k % 5 === 0 });
        return (
          <g opacity={soude ? 1 : 0.8}>
            <defs>
              <linearGradient id={`${id}v`} x1="0" x2="1"><stop offset="0" stopColor="#e0f2fe" stopOpacity="0.9"/><stop offset="0.45" stopColor="#fff" stopOpacity="0.95"/><stop offset="1" stopColor="#bae6fd" stopOpacity="0.9"/></linearGradient>
              <clipPath id={`${id}t`}><rect x={cx - w} y={y0} width={2 * w} height={yS - y0}/></clipPath>
            </defs>
            <rect x={cx - w} y={y0} width={2 * w} height={yS - y0} rx="2" fill={`url(#${id}v)`} stroke={STROKE} strokeWidth="2"/>
            <g clipPath={`url(#${id}t)`}><rect x={cx - w} y={yLiq} width={2 * w} height={yS - yLiq} fill="#fcd34d" opacity="0.85"/><ellipse cx={cx} cy={yLiq} rx={w} ry="2.2" fill="#fbbf24" stroke="#d97706" strokeWidth="1"/><rect x={cx - w + 2.5} y={y0 + 2} width="2.4" height={yS - y0 - 4} rx="1.2" fill="#fff" opacity="0.7"/></g>
            {ticks.map((t, i) => <line key={i} x1={cx - w} x2={cx - w - (t.long ? 8 : 4.5)} y1={t.y} y2={t.y} stroke="#475569" strokeWidth={t.long ? 1.6 : 1}/>)}
            <rect x={cx - w - 2} y={y0 - 5} width={2 * w + 4} height="6" rx="2" fill="#94a3b8" stroke={STROKE} strokeWidth="1.4"/>
            <rect x={cx - w - 5} y={yS} width={2 * w + 10} height={13 * fs} rx="3" fill="#64748b" stroke={STROKE} strokeWidth="1.6"/>
            <g transform={`rotate(${soude ? 90 : 0} ${cx} ${yS + 6.5 * fs})`}><rect x={cx + w + 3} y={yS + 6.5 * fs - 3} width={15 * fs} height="6" rx="3" fill="#dc2626" stroke={STROKE} strokeWidth="1.2"/></g>
            <path d={`M${cx - 4} ${yS + 13 * fs} L${cx - 4} ${yS + 13 * fs + 9} L${cx - 1.2} ${tipY} L${cx + 1.2} ${tipY} L${cx + 4} ${yS + 13 * fs + 9} L${cx + 4} ${yS + 13 * fs} Z`} fill={`url(#${id}v)`} stroke={STROKE} strokeWidth="1.6"/>
            <text x={cx + w + 24 * fs} y={y0 + 26} fontSize={13 * fs} fontWeight="800" fill="#b45309">soude (HO⁻)</text>
            <text x={cx + w + 24 * fs} y={y0 + 26 + 15 * fs} fontSize={11.5 * fs} fill="#64748b">burette graduée</text>
            {drop >= 0 && <ellipse cx={cx} cy={tipY + 4 + drop * (yL - tipY - 8)} rx="3.4" ry="4.8" fill="#f59e0b" opacity={1 - Math.max(0, drop - 0.85) * 6}/>}
          </g>);
      })()}
      <rect x="0" y={D.bB} width={D.W} height="9" fill="#cbd5e1"/><rect x="0" y={D.bB + 9} width={D.W} height="3" fill="#94a3b8"/>
      <g filter={`url(#${id}o)`}>
        <g clipPath={`url(#${id}m)`}>
          <rect x={D.bx} y={yL} width={D.bw} height={D.bB - yL + 10} fill={`url(#${id}b)`}/>
          <rect x={D.bx} y={yL} width={D.bw} height={D.bB - yL + 10} fill="#fff" opacity={trouble}/>
          <line x1={D.bx} x2={D.bx + D.bw} y1={yL} y2={yL} stroke="#38bdf8" strokeWidth="2" opacity="0.8"/>
          {ions.map(o => { const p = pos(o.k, o.i); return <g key={`${o.i}${o.k}`} opacity={o.op}><circle cx={p.x} cy={p.y} r={6.4 * Math.max(1, fs * 0.95)} fill={o.cat.col} stroke="#fff" strokeWidth="1.2"/><text x={p.x} y={p.y + 4.1 * fs} textAnchor="middle" fontSize={11 * fs} fontWeight="700" fill="#fff">+</text></g>; })}
          {grains.map(q => <rect key={`${q.i}${q.k}`} x={q.x - q.r} y={q.y - q.r} width={q.r * 2} height={q.r * 1.8} rx="1.6" fill={q.cat.colS} stroke={q.cat.id === 'Mg' ? '#64748b' : q.cat.col} strokeWidth="1.2" opacity={q.op} transform={`rotate(${(q.k * 37) % 50 - 25} ${q.x} ${q.y})`}/>)}
        </g>
        <path d={bordBecher} fill="none" stroke={STROKE} strokeWidth="3" strokeLinecap="round"/>
        <path d={`M${D.bx + 12} ${D.bB - D.bh + 10} L${D.bx + 17} ${D.bB - 18}`} stroke="#fff" strokeWidth="4" opacity="0.7" strokeLinecap="round"/>
      </g>
      {/* axe de pH et zones de précipitation */}
      <text x={D.ax0} y={barres ? D.ya - 28 * fs : axY - 34} fontSize={13 * fs} fontWeight="700" fill="#0f172a">Axe de pH</text>
      {barres && cs.map(({ cat, c }, i) => {
        const y = D.ya + i * D.dy, a = xp(M.phDebut(cat, c)), b = xp(M.phFin(cat)), [t, ct] = statutTxt(i);
        return (<g key={cat.id}>
          <text x={D.ax0} y={y - 5} fontSize={13 * fs} fontWeight="700" fill={cat.col}>{cat.ion} · {M.sciNb(c, 1)} mol/L</text>
          <text x={D.ax1} y={y - 5} textAnchor="end" fontSize={12.5 * fs} fontWeight="700" fill={ct}>{t}</text>
          <rect x={D.ax0} y={y} width={D.ax1 - D.ax0} height={D.bar} rx="4" fill="#f1f5f9" stroke="#cbd5e1"/>
          <rect x={a} y={y} width={Math.max(2, b - a)} height={D.bar} rx="3" fill={`url(#${id}g${i})`} stroke={cat.col} strokeWidth="1.2"/>
          {b < D.ax1 && <rect x={b} y={y} width={D.ax1 - b} height={D.bar} rx="3" fill={cat.col} opacity="0.18"/>}
          {chiffres && <g><text x={a} y={y + D.bar + 13 * fs} textAnchor="middle" fontSize={11.5 * fs} fill="#475569">{M.phTxt(M.phDebut(cat, c))}</text><text x={b} y={y + D.bar + 13 * fs} textAnchor="middle" fontSize={11.5 * fs} fill="#475569">{M.phTxt(M.phFin(cat))}</text></g>}
        </g>);
      })}
      {barres && fenetre && nRows === 2 && (() => {
        const w = M.fenetre(cs[0].cat, cs[0].c, cs[1].cat, cs[1].c);
        if (w.ok) { const a = xp(w.lo), b = xp(w.hi); return (<g><rect x={a} y={D.ya - 14} width={Math.max(3, b - a)} height={D.dy + D.bar + 12} fill={w.pratique ? '#22c55e' : '#f59e0b'} opacity="0.22" rx="4" stroke={w.pratique ? '#15803d' : '#b45309'} strokeDasharray="4 3"/></g>); }
        return null;
      })()}
      <line x1={D.ax0} x2={D.ax1} y1={axY} y2={axY} stroke={STROKE} strokeWidth="2"/>
      {[0, 2, 4, 6, 7, 8, 10, 12, 14].map(v => <g key={v}><line x1={xp(v)} x2={xp(v)} y1={axY} y2={axY + 6} stroke={STROKE}/><text x={xp(v)} y={axY + 20 * fs} textAnchor="middle" fontSize={11.5 * fs} fill="#334155" fontWeight={v === 7 ? 700 : 400}>{v}</text></g>)}
      {/* marqueur de pH et poignée */}
      <rect x={D.ax0 - 6} y={D.hy - 6} width={D.ax1 - D.ax0 + 12} height={axY - D.hy + 14} fill="transparent" style={{ touchAction: 'none', cursor: 'pointer' }} {...drag}/>
      <line x1={pPill} x2={pPill} y1={Math.min(D.hy + 14, axY - 30)} y2={axY} stroke="#0f172a" strokeWidth="2.2" strokeDasharray="5 3" pointerEvents="none"/>
      <g className="xa-poignee" role="slider" tabIndex={0} aria-label="pH de la solution : flèches gauche et droite (0,1), Page haut et bas (1)" aria-valuemin={0} aria-valuemax={14} aria-valuenow={Number(ph.toFixed(1))} aria-valuetext={`pH ${M.phTxt(ph)}`} {...drag}
        onKeyDown={ev => { const d = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? PH_PAS : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -PH_PAS : ev.key === 'PageUp' ? 1 : ev.key === 'PageDown' ? -1 : 0; if (d) { ev.preventDefault(); setPh(clamp(Math.round((ph + d) * 10) / 10, 0, 14)); } }}>
        <rect x={pPill - 26} y={axY - 22} width="52" height="44" fill="transparent"/>
        <circle className="xa-anneau" cx={pPill} cy={axY} r={etroit ? 17 : 14} fill="#fff" stroke="#dc2626" strokeWidth="3.5"/>
        <path d={`M${pPill - 4} ${axY} l-5 -0 M${pPill + 4} ${axY} l5 0 M${pPill - 8} ${axY} l4 -4 M${pPill - 8} ${axY} l4 4 M${pPill + 8} ${axY} l-4 -4 M${pPill + 8} ${axY} l-4 4`} stroke="#dc2626" strokeWidth="2" fill="none"/>
        {!touche && <circle className="xa-pulse" cx={pPill} cy={axY} r={(etroit ? 17 : 14) + 5} fill="none" stroke="#dc2626" strokeWidth="3"/>}
      </g>
      <text x={pPill} y={axY + 42 * fs} textAnchor={ancre} fontSize={13 * fs} fontWeight="700" fill="#dc2626" pointerEvents="none">pH {M.phTxt(ph)}</text>
    </svg>);
}
