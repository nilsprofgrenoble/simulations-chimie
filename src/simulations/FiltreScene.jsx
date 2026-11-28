/* eslint-disable react-refresh/only-export-components */
import { useId } from "react";
import { coordSvg } from "./exploAnim";
import * as M from "./filtreModele";
import { FormuleSvg } from '../svgFrac';

// ====================================================
//  Scène animée de la simulation 316 : un générateur (GBF) envoie une tension sinusoïdale Ue dans un filtre RC ; l'oscilloscope montre Ue (bleu) et Us (orange) ;
//  la courbe A(f) (échelle logarithmique) porte un point mobile et une poignée de fréquence. Tout réagit en direct quand on déplace la poignée.
//  Les « charges » du circuit oscillent à la fréquence visuelle (lente) ; côté sortie, leur amplitude est multipliée par A.
// ====================================================
export const COUL = { ue: '#2563eb', us: '#ea580c', courbe: '#0f766e', poignee: '#dc2626', txt: '#0f172a', gris: '#475569', grille: '#cbd5e1' };
const TWO_PI = 2 * Math.PI;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function layout(etroit, graphe) {
  if (!etroit) return { W: 760, H: graphe ? 572 : 312, fs: 1, circ: { x: 0, y: 52, k: 1.07 }, scope: { x: 420, y: 0, d: 30 }, G: { x0: 70, x1: 736, yT: 362, yB: 526 } };
  return { W: 380, H: graphe ? 804 : 530, fs: 1.04, circ: { x: 0, y: 0, k: 1 }, scope: { x: 25, y: 206, d: 31 }, G: { x0: 50, x1: 362, yT: 590, yB: 752 } };
}

const trace = (d, cy, nPer, amp, phi) => {
  const pts = [];
  for (let x = 0; x <= 10 * d; x += 2) pts.push(`${(10 + x).toFixed(1)},${(cy - amp * d * Math.sin(TWO_PI * (x / d) / nPer + phi)).toFixed(1)}`);
  return pts.join(' ');
};

export function SceneFiltre({ nature = 'bas', R = 220, C = 1, fc, f, setF, etroit = false, svgRef, aria, phase = 0, ue = M.UE_MAX,
  circuit = 'rc', graphe = true, poignee = true, touche = true, courbe = 0, points = [], seuil = false, proj = false, marqueFc = false, bande = false, reperes = false, voie2 = true, nomGraphe = 'A' }) {
  const id = useId().replace(/:/g, ''), { W, H, fs, circ, scope, G } = layout(etroit, graphe);
  const fcc = fc ?? M.fcRC(R, C), A = M.gain(nature, f, fcc), dph = M.dephasage(nature, f, fcc);
  const fz = v => v * fs;
  const X = fr => M.posLog(fr, G.x0, G.x1), Y = a => G.yB - a / 1.05 * (G.yB - G.yT);
  const poser = ev => { const { X: x } = coordSvg(svgRef.current, ev); setF(clamp(M.arrondiF(M.freqDepuisPos(x, G.x0, G.x1)), M.F_MIN, M.F_MAX)); };
  const drag = poignee ? {
    onPointerDown: ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); ev.currentTarget.dataset.d = '1'; poser(ev); },
    onPointerMove: ev => { if (ev.currentTarget.dataset.d === '1') poser(ev); },
    onPointerUp: ev => { ev.currentTarget.dataset.d = ''; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } },
  } : {};

  // ---------- circuit ----------
  const rc = circuit === 'rc', bas = nature === 'bas';
  const rail = (x1, x2, y) => <line x1={x1} y1={y} x2={x2} y2={y} stroke="#334155" strokeWidth="3" strokeLinecap="round"/>;
  const ampE = 7, ampS = Math.max(0.6, 7 * A), cy = 110;
  const dotsE = [58, 70, 82].map(x => ({ x, dx: ampE * Math.sin(phase), c: COUL.ue }));
  const xsMilieu = rc ? (bas ? [168, 184, 200, 216] : [146, 162, 178, 194, 210]) : [];
  const dotsS = [...xsMilieu, ...(rc ? [252, 266] : []), 282, 294, 306, 320].map(x => ({ x, dx: ampS * Math.sin(phase + dph), c: COUL.us }));
  const circuitSvg = (
    <g transform={`translate(${circ.x} ${circ.y}) scale(${circ.k})`}>
      <rect x="4" y="6" width="372" height="190" rx="16" fill="#f8fafc" stroke={COUL.grille}/>
      <text x="190" y="26" textAnchor="middle" fontSize={fz(13.5)} fontWeight="800" fill={COUL.txt}>{rc ? (bas ? 'Filtre RC : résistance en série' : 'Filtre RC : condensateur en série') : 'Le filtre à étudier'}</text>
      {/* générateur */}
      {rail(44, 44, 62)}{rail(44, 44, 82)}{rail(44, 44, 138)}{rail(44, 44, 158)}
      <circle cx="44" cy={cy} r="28" fill="#fff" stroke={COUL.ue} strokeWidth="3"/>
      <path d="M 28 110 Q 36 92 44 110 T 60 110" fill="none" stroke={COUL.ue} strokeWidth="2.6" strokeLinecap="round"/>
      <text x="44" y="176" textAnchor="middle" fontSize={fz(13)} fontWeight="800" fill={COUL.ue}>GBF</text>
      {/* rails */}
      {rc ? <>{rail(44, bas ? 96 : 116, 62)}{bas ? rail(156, 336, 62) : rail(128, 336, 62)}{rail(44, 336, 158)}</>
        : <>{rail(44, 100, 62)}{rail(270, 336, 62)}{rail(44, 100, 158)}{rail(270, 336, 158)}</>}
      {rc && bas && <>
        <rect x="96" y="51" width="60" height="22" rx="4" fill="#fff" stroke="#334155" strokeWidth="2.6"/>
        {rail(236, 236, 62)}{rail(236, 236, 99)}
        <line x1="236" y1="62" x2="236" y2="99" stroke="#334155" strokeWidth="3"/><line x1="236" y1="113" x2="236" y2="158" stroke="#334155" strokeWidth="3"/>
        <line x1="220" y1="99" x2="252" y2="99" stroke="#334155" strokeWidth="3.4"/><line x1="220" y1="113" x2="252" y2="113" stroke="#334155" strokeWidth="3.4"/>
        <circle cx="236" cy="62" r="4.4" fill="#334155"/>
        <text x="126" y="44" textAnchor="middle" fontSize={fz(13)} fontWeight="800" fill={COUL.txt}>R = {M.RTxt(R)}</text>
        <text x="262" y="102" fontSize={fz(13)} fontWeight="800" fill={COUL.txt}>C</text><text x="262" y="118" fontSize={fz(13)} fontWeight="800" fill={COUL.txt}>{M.CTxt(C)}</text>
      </>}
      {rc && !bas && <>
        <line x1="116" y1="46" x2="116" y2="78" stroke="#334155" strokeWidth="3.4"/><line x1="128" y1="46" x2="128" y2="78" stroke="#334155" strokeWidth="3.4"/>
        <line x1="236" y1="62" x2="236" y2="90" stroke="#334155" strokeWidth="3"/><line x1="236" y1="130" x2="236" y2="158" stroke="#334155" strokeWidth="3"/>
        <rect x="224" y="90" width="24" height="40" rx="4" fill="#fff" stroke="#334155" strokeWidth="2.6"/>
        <circle cx="236" cy="62" r="4.4" fill="#334155"/>
        <text x="122" y="38" textAnchor="middle" fontSize={fz(13)} fontWeight="800" fill={COUL.txt}>C = {M.CTxt(C)}</text>
        <text x="260" y="106" fontSize={fz(13)} fontWeight="800" fill={COUL.txt}>R</text><text x="260" y="122" fontSize={fz(13)} fontWeight="800" fill={COUL.txt}>{M.RTxt(R)}</text>
      </>}
      {!rc && <>
        <rect x="100" y="38" width="170" height="134" rx="16" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2.4" strokeDasharray="7 5"/>
        <text x="185" y="104" textAnchor="middle" fontSize={fz(19)} fontWeight="800" fill={COUL.txt}>Filtre</text>
        <text x="185" y="130" textAnchor="middle" fontSize={fz(13)} fill={COUL.gris}>circuit à étudier</text>
      </>}
      {/* sortie */}
      <circle cx="336" cy="62" r="5" fill="#fff" stroke="#334155" strokeWidth="2.4"/><circle cx="336" cy="158" r="5" fill="#fff" stroke="#334155" strokeWidth="2.4"/>
      {voie2 && <text x="348" y="114" fontSize={fz(15)} fontWeight="800" fill={COUL.us}>Us</text>}
      <text x="62" y="46" textAnchor="middle" fontSize={fz(15)} fontWeight="800" fill={COUL.ue}>Ue</text>
      {/* charges qui oscillent */}
      {dotsE.map((d, i) => <circle key={`e${i}`} cx={d.x + d.dx} cy="62" r="4" fill={d.c} stroke="#fff" strokeWidth="1.2"/>)}
      {voie2 && dotsS.map((d, i) => <circle key={`s${i}`} cx={d.x + d.dx} cy="62" r="4" fill={d.c} stroke="#fff" strokeWidth="1.2"/>)}
      <text x="226" y="190" textAnchor="middle" fontSize={fz(12)} fill={COUL.gris}>les charges oscillent à la fréquence f</text>
    </g>);

  // ---------- oscilloscope ----------
  const d = scope.d, tdiv = M.baseTemps(f), nPer = 1 / (f * tdiv), sy = 28, cyS = sy + 4 * d, Wd = 10 * d + 20, Hd = 8 * d + sy + 44;
  const ph = phase;
  const grille = [];
  for (let i = 0; i <= 10; i++) grille.push(<line key={`v${i}`} x1={10 + i * d} x2={10 + i * d} y1={sy} y2={sy + 8 * d} stroke={i === 5 ? '#94a3b8' : '#dbe4ee'} strokeWidth={i === 5 ? 1.6 : 1}/>);
  for (let j = 0; j <= 8; j++) grille.push(<line key={`h${j}`} x1="10" x2={10 + 10 * d} y1={sy + j * d} y2={sy + j * d} stroke={j === 4 ? '#94a3b8' : '#dbe4ee'} strokeWidth={j === 4 ? 1.6 : 1}/>);
  const ticks = [];
  for (let k = -20; k <= 20; k++) if (k % 5) ticks.push(<line key={`ty${k}`} x1={10 + 5 * d - 3} x2={10 + 5 * d + 3} y1={cyS - k * d / 5} y2={cyS - k * d / 5} stroke="#94a3b8" strokeWidth="1"/>);
  for (let k = -25; k <= 25; k++) if (k % 5) ticks.push(<line key={`tx${k}`} x1={10 + 5 * d + k * d / 5} x2={10 + 5 * d + k * d / 5} y1={cyS - 3} y2={cyS + 3} stroke="#94a3b8" strokeWidth="1"/>);
  const ampUs = ue * A;
  const scopeSvg = (
    <g transform={`translate(${scope.x} ${scope.y})`}>
      <rect x="0" y="0" width={Wd} height={Hd} rx="16" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
      <text x="12" y="19" fontSize={fz(13.5)} fontWeight="800" fill={COUL.txt}>Oscilloscope</text>
      <circle cx={Wd - 20} cy="14" r="4" fill="#16a34a"/>
      <rect x="10" y={sy} width={10 * d} height={8 * d} fill="#f8fafc" stroke="#475569" strokeWidth="2"/>
      {grille}{ticks}
      <clipPath id={`${id}sc`}><rect x="10" y={sy} width={10 * d} height={8 * d}/></clipPath>
      <g clipPath={`url(#${id}sc)`}>
        {reperes && <>
          <line x1="10" x2={10 + 10 * d} y1={cyS - ue * d} y2={cyS - ue * d} stroke={COUL.ue} strokeWidth="1.4" strokeDasharray="6 4"/>
          {voie2 && <line x1="10" x2={10 + 10 * d} y1={cyS - ampUs * d} y2={cyS - ampUs * d} stroke={COUL.us} strokeWidth="1.4" strokeDasharray="6 4"/>}
        </>}
        <polyline points={trace(d, cyS, nPer, ue, ph)} fill="none" stroke={COUL.ue} strokeWidth="3.2" strokeLinejoin="round"/>
        {voie2 && <polyline points={trace(d, cyS, nPer, ue * A, ph + dph)} fill="none" stroke={COUL.us} strokeWidth="3.2" strokeLinejoin="round"/>}
      </g>
      {reperes && <>
        <text x={10 + 10 * d - 4} y={cyS - ue * d - 4} textAnchor="end" fontSize={fz(12.5)} fontWeight="800" fill={COUL.ue} stroke="#f8fafc" strokeWidth="3" paintOrder="stroke">Ue,max = {M.nbf(ue, 2)} V</text>
        {voie2 && <text x={10 + 10 * d - 4} y={cyS - ampUs * d + (ampUs * d > 16 ? 15 : -4)} textAnchor="end" fontSize={fz(12.5)} fontWeight="800" fill={COUL.us} stroke="#f8fafc" strokeWidth="3" paintOrder="stroke">Us,max = {M.nbf(ampUs, ampUs < 0.1 ? 3 : 2)} V</text>}
      </>}
      <text x="10" y={sy + 8 * d + 18} fontSize={fz(12.5)} fontWeight="800" fill={COUL.ue}>voie 1 (Ue) : 1 V/div</text>
      {voie2 && <text x="10" y={sy + 8 * d + 35} fontSize={fz(12.5)} fontWeight="800" fill={COUL.us}>voie 2 (Us) : 1 V/div</text>}
      <text x={Wd - 10} y={sy + 8 * d + 18} textAnchor="end" fontSize={fz(12.5)} fontWeight="800" fill={COUL.txt}>base de temps</text>
      <text x={Wd - 10} y={sy + 8 * d + 35} textAnchor="end" fontSize={fz(12.5)} fontWeight="800" fill={COUL.txt}>{M.tdivTxt(tdiv)}</text>
    </g>);

  // ---------- courbe A(f) ----------
  let grapheSvg = null;
  if (graphe) {
    const fmax = M.F_MIN * 10 ** (4 * clamp(courbe, 0, 1)), pts = [];
    if (courbe > 0) for (let k = 0; k <= 160; k++) { const fr = 10 ** (1 + 4 * k / 160); if (fr > fmax + 1e-9) break; pts.push(`${X(fr).toFixed(1)},${Y(M.gain(nature, fr, fcc)).toFixed(1)}`); }
    const decs = [10, 100, 1000, 1e4, 1e5], mineurs = [];
    for (const dd of [10, 100, 1000, 1e4]) for (let m = 2; m <= 9; m++) mineurs.push(dd * m);
    const labDec = v => (v >= 1000 ? `${v / 1000} kHz` : `${v} Hz`);
    const fx = X(f), fy = Y(A), xfc = X(fcc);
    const xa = bas ? G.x0 : xfc, xb = bas ? xfc : G.x1;
    grapheSvg = (
      <g>
        <rect x="4" y={G.yT - 50} width={W - 8} height={G.yB - G.yT + 110} rx="16" fill="#f8fafc" stroke={COUL.grille}/>
        <FormuleSvg x={G.x0} y={G.yT - 30} s={fz(13.5)} w={800} c={COUL.txt} a="start" parts={[`${nomGraphe} = `, { h: 'Us,max', b: 'Ue,max' }, ', selon la fréquence f']} />
        {/* quadrillage */}
        {Array.from({ length: 11 }, (_, k) => <line key={`gy${k}`} x1={G.x0} x2={G.x1} y1={Y(k / 10)} y2={Y(k / 10)} stroke={k % 5 === 0 ? '#cbd5e1' : '#e8eef5'} strokeWidth="1"/>)}
        {decs.map(v => <line key={`gx${v}`} x1={X(v)} x2={X(v)} y1={G.yT} y2={G.yB} stroke="#cbd5e1" strokeWidth="1"/>)}
        {mineurs.map(v => <line key={`mx${v}`} x1={X(v)} x2={X(v)} y1={G.yB} y2={G.yB + 5} stroke="#64748b" strokeWidth="1"/>)}
        {bande && <>
          <rect x={xa} y={G.yT} width={xb - xa} height={G.yB - G.yT} fill={COUL.courbe} opacity="0.12"/>
          <rect x={xa} y={G.yB - 4} width={xb - xa} height="8" rx="3" fill={COUL.courbe}/>
          <text x={(xa + xb) / 2} y={G.yB - 12} textAnchor="middle" fontSize={fz(13)} fontWeight="800" fill={COUL.courbe} stroke="#f8fafc" strokeWidth="3" paintOrder="stroke">bande passante</text>
        </>}
        <line x1={G.x0} x2={G.x0} y1={G.yT} y2={G.yB} stroke="#334155" strokeWidth="2"/><line x1={G.x0} x2={G.x1} y1={G.yB} y2={G.yB} stroke="#334155" strokeWidth="2"/>
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map(a => <text key={`ya${a}`} x={G.x0 - 7} y={Y(a) + 4.5} textAnchor="end" fontSize={fz(12.5)} fill={COUL.gris}>{M.nbf(a, a === 0 || a === 1 ? 0 : 1)}</text>)}
        {decs.map(v => <text key={`xa${v}`} x={X(v)} y={G.yB + 25} textAnchor={v === 10 ? 'start' : v === 1e5 ? 'end' : 'middle'} fontSize={fz(12.5)} fill={COUL.gris}>{labDec(v)}</text>)}
        <text x={G.x0 - 7} y={G.yT - 4} textAnchor="end" fontSize={fz(13.5)} fontWeight="800" fill={COUL.courbe}>{nomGraphe}</text>
        <text x={G.x1} y={G.yB + 44} textAnchor="end" fontSize={fz(12.5)} fill={COUL.gris}>f (échelle logarithmique : une graduation = ×10)</text>
        {seuil && <>
          <line x1={G.x0} x2={G.x1} y1={Y(1)} y2={Y(1)} stroke="#64748b" strokeWidth="1.4" strokeDasharray="2 5"/>
          <line x1={G.x0} x2={G.x1} y1={Y(M.SEUIL)} y2={Y(M.SEUIL)} stroke={COUL.us} strokeWidth="1.8" strokeDasharray="7 5"/>
          <text x={G.x1 - 4} y={Y(1) - 5} textAnchor="end" fontSize={fz(12.5)} fontWeight="800" fill={COUL.gris}>Amax = 1</text>
          <text x={G.x1 - 4} y={Y(M.SEUIL) - 5} textAnchor="end" fontSize={fz(12.5)} fontWeight="800" fill={COUL.us}>0,7 × Amax</text>
        </>}
        {marqueFc && <>
          <line x1={xfc} x2={xfc} y1={G.yT - 12} y2={G.yB} stroke={COUL.us} strokeWidth="1.8" strokeDasharray="7 5"/>
          <text x={xfc} y={G.yT - 14} textAnchor="middle" fontSize={fz(13)} fontWeight="800" fill={COUL.us} stroke="#f8fafc" strokeWidth="3" paintOrder="stroke">fc = {M.fTxt(fcc)}</text>
        </>}
        {pts.length > 1 && <polyline points={pts.join(' ')} fill="none" stroke={COUL.courbe} strokeWidth="3.6" strokeLinejoin="round" strokeLinecap="round"/>}
        {points.map((p, i) => <g key={`p${i}`}><circle cx={X(p)} cy={Y(M.gain(nature, p, fcc))} r="6.5" fill={COUL.courbe} stroke="#fff" strokeWidth="2"/></g>)}
        {proj && <>
          <line x1={G.x0} x2={fx} y1={fy} y2={fy} stroke={COUL.poignee} strokeWidth="1.5" strokeDasharray="4 4"/>
        </>}
        <line x1={fx} x2={fx} y1={fy} y2={G.yB} stroke={COUL.poignee} strokeWidth="1.6" strokeDasharray="4 4"/>
        <circle cx={fx} cy={fy} r="7.5" fill="#fff" stroke={COUL.poignee} strokeWidth="3.4"/>
        {poignee && <rect x={G.x0} y={G.yT} width={G.x1 - G.x0} height={G.yB - G.yT + 22} fill="transparent" style={{ cursor: 'pointer', touchAction: 'none' }} {...drag}/>}
        <g className={poignee ? 'xa-poignee' : undefined} role={poignee ? 'slider' : undefined} tabIndex={poignee ? 0 : undefined} aria-label="Fréquence : flèches gauche et droite pour changer, une graduation du clavier vaut un douzième de décade"
          aria-valuemin={M.F_MIN} aria-valuemax={M.F_MAX} aria-valuenow={Math.round(f)} aria-valuetext={M.fTxt(f)} {...drag}
          onKeyDown={poignee ? ev => { const dd = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : ev.key === 'PageUp' ? 12 : ev.key === 'PageDown' ? -12 : 0; if (dd) { ev.preventDefault(); setF(clamp(M.arrondiF(M.freqPas(f, dd)), M.F_MIN, M.F_MAX)); } } : undefined} style={{ touchAction: 'none' }}>
          <circle className="xa-anneau" cx={fx} cy={G.yB} r="17" fill="transparent" stroke="transparent"/>
          {poignee && !touche && <circle className="xa-pulse" cx={fx} cy={G.yB} r="17" fill="none" stroke={COUL.poignee} strokeWidth="3"/>}
          <circle cx={fx} cy={G.yB} r="10.5" fill={COUL.poignee} stroke="#fff" strokeWidth="3"/>
          <path d={`M ${fx - 4} ${G.yB - 1} l 4 -5 l 4 5 M ${fx - 4} ${G.yB + 2} l 4 5 l 4 -5`} fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" transform={`rotate(90 ${fx} ${G.yB})`}/>
        </g>
        <g transform={`translate(${clamp(fx, G.x0 + 52, G.x1 - 52)} ${G.yB - 30})`}>
          <rect x="-48" y="-15" width="96" height="24" rx="12" fill={COUL.poignee}/>
          <text x="0" y="2" textAnchor="middle" fontSize={fz(14)} fontWeight="800" fill="#fff">f = {M.fTxt(f)}</text>
        </g>
      </g>);
  }

  return (
    <svg ref={svgRef} className="xa-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} style={{ background: '#fff' }}>
      <defs><filter id={`${id}o`} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.15"/></filter></defs>
      {circuitSvg}{scopeSvg}{grapheSvg}
    </svg>);
}
