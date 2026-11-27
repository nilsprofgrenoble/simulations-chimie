/* eslint-disable react-refresh/only-export-components */
import { coordSvg } from "./exploAnim";
import * as B from "./biotModele";

// ====================================================
//  Scène animée de la simulation 318 : un polarimètre. Une lumière polarisée (plan de polarisation vertical à la sortie du polariseur) traverse une cuve de longueur L
//  contenant une solution chirale de concentration C ; le plan de polarisation tourne progressivement de α. Le cadran de droite montre l'orientation finale du plan.
//  Poignées : l'extrémité de la cuve (longueur L), le curseur de concentration C et le curseur de composition (fraction de l'énantiomère (+)).
// ====================================================
export const COUL = { plus: '#c2410c', moins: '#0f766e', lum: '#ca8a04', txt: '#0f172a', gris: '#475569', cuve: '#94a3b8', poignee: '#dc2626', poignee2: '#7c3aed', ok: '#15803d' };
const halo = { stroke: '#f8fafc', strokeWidth: 3, paintOrder: 'stroke' };
const nb = B.nbf, NB = B.NB;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function layout(etroit) {
  if (!etroit) return { W: 760, H: 320, ax: 96, xSrc: 44, xPol: 112, x0: 150, lmax: 330, dial: { cx: 650, cy: 96, R: 56 }, pistes: { C: { x0: 70, x1: 340, y: 266 }, P: { x0: 430, x1: 700, y: 266 } }, fs: 1 };
  return { W: 380, H: 330, ax: 70, xSrc: 22, xPol: 52, x0: 72, lmax: 160, dial: { cx: 312, cy: 70, R: 46 }, pistes: { C: { x0: 50, x1: 330, y: 228 }, P: { x0: 50, x1: 330, y: 286 } }, fs: 1.1 };
}

// piste horizontale avec une poignée (role slider)
function Piste({ svgRef, p, val, min, max, pas, onChange, couleur, titre, texte, aria, fs, fond }) {
  const X = v => p.x0 + (v - min) / (max - min) * (p.x1 - p.x0);
  const vDe = ev => { const { X: x } = coordSvg(svgRef.current, ev); return min + (clamp(x, p.x0, p.x1) - p.x0) / (p.x1 - p.x0) * (max - min); };
  const drag = {
    onPointerDown: ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); ev.currentTarget.dataset.d = '1'; onChange(vDe(ev)); },
    onPointerMove: ev => { if (ev.currentTarget.dataset.d === '1') onChange(vDe(ev)); },
    onPointerUp: ev => { ev.currentTarget.dataset.d = ''; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } },
  };
  const clavier = ev => {
    const d = ev.key === 'ArrowUp' || ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowDown' || ev.key === 'ArrowLeft' ? -1 : 0;
    if (d) { ev.preventDefault(); onChange(val + d * pas); }
  };
  const xv = X(val);
  return (
    <g>
      <text x={p.x0} y={p.y - 22} fontSize={13.5 * fs} fontWeight="800" fill={couleur}>{titre}</text>
      <text x={p.x1} y={p.y - 22} textAnchor="end" fontSize={13.5 * fs} fontWeight="800" fill={COUL.txt}>{texte}</text>
      {fond ? fond(X) : <rect x={p.x0} y={p.y - 5} width={p.x1 - p.x0} height="10" rx="5" fill="#e2e8f0"/>}
      <g className="xa-poignee" role="slider" tabIndex={0} aria-label={aria} aria-valuemin={min} aria-valuemax={max} aria-valuenow={val} aria-valuetext={texte} onKeyDown={clavier} {...drag} style={{ cursor: 'ew-resize', touchAction: 'none' }}>
        <circle cx={xv} cy={p.y} r="24" fill="transparent"/>
        <circle cx={xv} cy={p.y} r="12" fill="#fff" stroke={couleur} strokeWidth="3.4"/>
        <circle cx={xv} cy={p.y} r="4.4" fill={couleur}/>
      </g>
    </g>);
}

export function SceneBiot({ sub, L, C, p = 1, setL, setC, setP, ctrlL = false, ctrlC = false, ctrlP = false, valeurs = false, showC = true, showP = false, showAlpha = true, infoL = true,
  nomSub = true, etroit = false, svgRef, aria, tau = 0, touche = true, alphaFixe = null }) {
  const { W, H, ax, xSrc, xPol, x0, lmax, dial, pistes, fs } = layout(etroit);
  const fz = v => v * fs;
  const len = 40 + (L - B.L_MIN) / (B.L_MAX - B.L_MIN) * (lmax - 40);
  const x1 = x0 + len, xFin = dial.cx - dial.R - 6;
  const alpha = alphaFixe !== null ? alphaFixe : B.alphaMel(sub, L, C, p);
  const aff = clamp(alpha, -85, 85);
  const gap = etroit ? 17 : 20;
  const marques = []; for (let x = xPol + 16; x < xFin - 4; x += gap) marques.push(x);
  const theta = x => (x <= x0 ? 0 : x >= x1 ? aff : aff * (x - x0) / len);
  const pulsations = i => Math.abs(Math.cos(2 * Math.PI * (tau * 1.2 - i * 0.16)));
  const cuveH = etroit ? 46 : 58;
  const teinte = 0.1 + 0.5 * (C - B.C_MIN) / (B.C_MAX - B.C_MIN);
  const coulAl = alpha > 1e-9 ? COUL.plus : alpha < -1e-9 ? COUL.moins : COUL.gris;
  const R = dial.R, cx = dial.cx, cy = dial.cy;
  const rad = a => (a * Math.PI) / 180;
  const pt = (a, r) => [cx + r * Math.sin(rad(a)), cy - r * Math.cos(rad(a))];
  const [ax1, ay1] = pt(aff, R - 8), [ax2, ay2] = pt(aff + 180, R - 8);
  const [t0x, t0y] = pt(0, R - 8);
  const arc = Math.abs(aff) > 0.5 ? `M ${t0x} ${t0y} A ${R - 8} ${R - 8} 0 0 ${aff > 0 ? 1 : 0} ${ax1.toFixed(1)} ${ay1.toFixed(1)}` : null;
  const ticks = []; for (let a = -60; a <= 60; a += 10) ticks.push(a);
  const lbl = valeurs ? [-60, -30, 0, 30, 60] : [0];

  return (
    <svg ref={svgRef} role="img" aria-label={aria} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxWidth: W * 1.25, margin: '0 auto', fontFamily: 'inherit', touchAction: 'pan-y' }}>
      <rect x="2" y="2" width={W - 4} height={H - 4} rx="16" fill="#f8fafc" stroke="#cbd5e1"/>
      {/* faisceau */}
      <rect x={xSrc + 14} y={ax - 3} width={xFin - xSrc - 14} height="6" rx="3" fill="#fde68a" opacity="0.55"/>
      {/* source */}
      <circle cx={xSrc} cy={ax} r={etroit ? 14 : 20} fill="#fef08a" stroke={COUL.lum} strokeWidth="2.4"/>
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const [u, v] = [Math.cos(rad(a)), Math.sin(rad(a))], r0 = (etroit ? 17 : 24), r1 = r0 + 6; return <line key={a} x1={xSrc + r0 * u} y1={ax + r0 * v} x2={xSrc + r1 * u} y2={ax + r1 * v} stroke={COUL.lum} strokeWidth="2" strokeLinecap="round"/>; })}
      <text x={xSrc} y={ax + (etroit ? 40 : 50)} textAnchor="middle" fontSize={fz(12)} fill={COUL.gris}>lampe</text>
      {/* polariseur */}
      <rect x={xPol - 3} y={ax - 30} width="6" height="60" rx="3" fill="#475569"/>
      {[-22, -11, 0, 11, 22].map(d => <line key={d} x1={xPol - 8} y1={ax + d} x2={xPol + 8} y2={ax + d} stroke="#64748b" strokeWidth="1.6" opacity="0.8"/>)}
      <text x={xPol + 6} y={ax + (etroit ? 56 : 66)} textAnchor="middle" fontSize={fz(12)} fill={COUL.gris}>polariseur</text>
      {/* cuve */}
      <rect x={x0} y={ax - cuveH / 2} width={len} height={cuveH} rx="6" fill="#0d9488" opacity={teinte}/>
      <rect x={x0} y={ax - cuveH / 2} width={len} height={cuveH} rx="6" fill="none" stroke={COUL.cuve} strokeWidth="3"/>
      {showC && <text x={x0 + len / 2} y={ax - cuveH / 2 - 8} textAnchor="middle" fontSize={fz(13)} fontWeight="700" fill="#0f766e" style={halo}>{nomSub ? `${sub.nom} · ` : ''}C = {nb(C, 2)}{NB}g/mL</text>}
      {!showC && nomSub && <text x={x0 + len / 2} y={ax - cuveH / 2 - 8} textAnchor="middle" fontSize={fz(13)} fontWeight="700" fill="#0f766e" style={halo}>{sub.nom} · C = ?</text>}
      {infoL && <g>
        <line x1={x0} y1={ax + cuveH / 2 + 12} x2={x1} y2={ax + cuveH / 2 + 12} stroke={COUL.gris} strokeWidth="1.8"/>
        <line x1={x0} y1={ax + cuveH / 2 + 7} x2={x0} y2={ax + cuveH / 2 + 17} stroke={COUL.gris} strokeWidth="1.8"/>
        <line x1={x1} y1={ax + cuveH / 2 + 7} x2={x1} y2={ax + cuveH / 2 + 17} stroke={COUL.gris} strokeWidth="1.8"/>
        <text x={(x0 + x1) / 2} y={ax + Math.max(cuveH / 2 + 32, etroit ? 78 : 90)} textAnchor="middle" fontSize={fz(13)} fontWeight="700" fill={COUL.txt}>L = {nb(L, 1)}{NB}dm ({nb(L * 10, 0)}{NB}cm)</text>
      </g>}
      {/* plans de polarisation le long du faisceau */}
      {marques.map((x, i) => { const h = 5 + 15 * pulsations(i); return (
        <line key={x} x1={x} y1={ax - h} x2={x} y2={ax + h} stroke={COUL.lum} strokeWidth="3.2" strokeLinecap="round" transform={`rotate(${theta(x).toFixed(2)} ${x} ${ax})`}/>); })}
      {/* poignée de longueur */}
      {ctrlL && (() => {
        const vDe = ev => { const { X: x } = coordSvg(svgRef.current, ev); return B.L_MIN + (clamp(x, x0 + 40, x0 + lmax) - (x0 + 40)) / (lmax - 40) * (B.L_MAX - B.L_MIN); };
        const drag = {
          onPointerDown: ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); ev.currentTarget.dataset.d = '1'; setL(B.arrondiL(vDe(ev))); },
          onPointerMove: ev => { if (ev.currentTarget.dataset.d === '1') setL(B.arrondiL(vDe(ev))); },
          onPointerUp: ev => { ev.currentTarget.dataset.d = ''; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } },
        };
        const clavier = ev => { const d = ev.key === 'ArrowUp' || ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowDown' || ev.key === 'ArrowLeft' ? -1 : 0; if (d) { ev.preventDefault(); setL(B.arrondiL(L + d * B.L_PAS)); } };
        return (
          <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Longueur L de la cuve : flèches pour la changer par pas de 0,5 dm" aria-valuemin={B.L_MIN} aria-valuemax={B.L_MAX} aria-valuenow={L} aria-valuetext={`${nb(L, 1)} dm`} onKeyDown={clavier} {...drag} style={{ cursor: 'ew-resize', touchAction: 'none' }}>
            <circle cx={x1} cy={ax} r="24" fill="transparent"/>
            <circle cx={x1} cy={ax} r="13" fill="#fff" stroke={COUL.poignee} strokeWidth="3.6"/>
            <path d={`M ${x1 - 6} ${ax} L ${x1 + 6} ${ax} M ${x1 - 6} ${ax} l 3 -3 M ${x1 - 6} ${ax} l 3 3 M ${x1 + 6} ${ax} l -3 -3 M ${x1 + 6} ${ax} l -3 3`} stroke={COUL.poignee} strokeWidth="2" strokeLinecap="round" fill="none"/>
            {!touche && <circle cx={x1} cy={ax} r="20" fill="none" stroke={COUL.poignee} strokeWidth="2" opacity="0.5" className="xa-pulse"/>}
          </g>);
      })()}
      {/* cadran de lecture */}
      <circle cx={cx} cy={cy} r={R} fill="#fff" stroke="#334155" strokeWidth="3"/>
      {ticks.map(a => { const [u1, v1] = pt(a, R - 3), [u2, v2] = pt(a, R - (a % 30 === 0 ? 12 : 8)); return <line key={a} x1={u1} y1={v1} x2={u2} y2={v2} stroke="#475569" strokeWidth={a % 30 === 0 ? 2.2 : 1.3}/>; })}
      {lbl.map(a => { const [u, v] = pt(a, R + 15); return <text key={a} x={u} y={v + 4} textAnchor="middle" fontSize={fz(11.5)} fill={COUL.gris}>{a > 0 ? '+' : a < 0 ? '−' : ''}{Math.abs(a)}</text>; })}
      {arc && <path d={arc} fill="none" stroke={coulAl} strokeWidth="5" strokeLinecap="round" opacity="0.5"/>}
      <line x1={ax1} y1={ay1} x2={ax2} y2={ay2} stroke={COUL.lum} strokeWidth="5" strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r="5" fill="#334155"/>
      {valeurs && <text x={cx - R * 0.45} y={cy + R * 0.62} textAnchor="middle" fontSize={fz(12.5)} fontWeight="800" fill={COUL.moins}>(−)</text>}
      {valeurs && <text x={cx + R * 0.45} y={cy + R * 0.62} textAnchor="middle" fontSize={fz(12.5)} fontWeight="800" fill={COUL.plus}>(+)</text>}
      <text x={cx} y={cy + R + (etroit ? 18 : 20)} textAnchor="middle" fontSize={fz(12)} fill={COUL.gris}>plan de polarisation</text>
      {showAlpha && <text x={cx} y={cy + R + (etroit ? 40 : 44)} textAnchor="middle" fontSize={fz(17)} fontWeight="800" fill={coulAl} style={halo}>α = {B.fmtDeg(alpha, 1)}°</text>}
      {showAlpha && valeurs && <text x={cx} y={cy + R + (etroit ? 58 : 64)} textAnchor="middle" fontSize={fz(12)} fontWeight="700" fill={coulAl}>{B.sensDe(alpha)}</text>}
      {/* curseurs */}
      {ctrlC && <Piste svgRef={svgRef} p={pistes.C} val={C} min={B.C_MIN} max={B.C_MAX} pas={B.C_PAS} onChange={v => setC(B.arrondiC(v))} couleur="#0f766e" titre="Concentration C" texte={`${nb(C, 2)} g/mL`} aria="Concentration C de la solution : flèches pour la changer par pas de 0,01 g/mL" fs={fs}/>}
      {(ctrlP || showP) && (ctrlP
        ? <Piste svgRef={svgRef} p={pistes.P} val={p} min={0} max={1} pas={0.05} onChange={v => setP(B.arrondiP(v))} couleur={COUL.poignee2} titre="Composition" texte={`${Math.round(p * 100)} % (+) · ${Math.round((1 - p) * 100)} % (−)`} aria="Composition : pourcentage de l’énantiomère (+), flèches pour changer par pas de 5 %" fs={fs}
          fond={X => <g><rect x={pistes.P.x0} y={pistes.P.y - 6} width={X(p) - pistes.P.x0} height="12" rx="6" fill={COUL.plus} opacity="0.75"/><rect x={X(p)} y={pistes.P.y - 6} width={pistes.P.x1 - X(p)} height="12" rx="6" fill={COUL.moins} opacity="0.75"/></g>}/>
        : <g>
          <text x={pistes.P.x0} y={pistes.P.y - 22} fontSize={13.5 * fs} fontWeight="800" fill={COUL.poignee2}>Composition</text>
          <text x={pistes.P.x1} y={pistes.P.y - 22} textAnchor="end" fontSize={13.5 * fs} fontWeight="800" fill={COUL.txt}>{Math.round(p * 100)} % (+) · {Math.round((1 - p) * 100)} % (−)</text>
          <rect x={pistes.P.x0} y={pistes.P.y - 6} width={(pistes.P.x1 - pistes.P.x0) * p} height="12" rx="6" fill={COUL.plus} opacity="0.75"/>
          <rect x={pistes.P.x0 + (pistes.P.x1 - pistes.P.x0) * p} y={pistes.P.y - 6} width={(pistes.P.x1 - pistes.P.x0) * (1 - p)} height="12" rx="6" fill={COUL.moins} opacity="0.75"/></g>)}
    </svg>);
}
