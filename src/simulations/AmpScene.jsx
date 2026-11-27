/* eslint-disable react-refresh/only-export-components */
import { useId } from "react";
import { coordSvg } from "./exploAnim";
import * as A from "./ampModele";

// ====================================================
//  Scène animée de la simulation 315 : la tension du capteur (en mV) traverse l'amplificateur et arrive au CAN (plage 0 à 5 V).
//  En haut, Ue(t) en mV ; en bas, Us(t) en V avec la fenêtre verte du CAN, les lignes de saturation (±12 V) et, en rouge, les parties du signal
//  qui sortent de la plage du CAN. Deux poignées verticales : le niveau maximal de la sortie (règle A) et la valeur moyenne (règle la tension continue Vdc).
// ====================================================
export const COUL = { ue: '#2563eb', us: '#ea580c', can: '#15803d', ko: '#dc2626', sat: '#b45309', poignee: '#dc2626', poignee2: '#7c3aed', txt: '#0f172a', gris: '#475569', grille: '#cbd5e1' };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const halo = { stroke: '#f8fafc', strokeWidth: 3, paintOrder: 'stroke' };
const nb = A.nbf;
const NB = A.NB;

function layout(etroit, showUs, aop) {
  if (!etroit) {
    const x0 = aop ? 250 : 76;
    return { W: 760, H: showUs ? 472 : 226, x0, x1: 736, U: { yT: 50, yB: 170 }, S: { yT: 240, yB: 420 }, fs: 1 };
  }
  return { W: 380, H: showUs ? 448 : 196, x0: 50, x1: 366, U: { yT: 46, yB: 142 }, S: { yT: 212, yB: 380 }, fs: 1.05 };
}
const pasNice = (span, nMax) => { for (const p of [1, 2, 4, 5, 10, 20, 50, 100]) if (span / p <= nMax) return p; return 200; };

export function SceneAmp({ s, Again, vdc, setA, setVdc, ctrlA = false, ctrlDc = false, montage = 'non', showUs = true, can = true, sat = false, yRange = [-1, 6.5],
  etroit = false, svgRef, aria, tau = 0, valeurs = false, touche = true, aop = true }) {
  const id = useId().replace(/:/g, '');
  const { W, H, x0, x1, U, S, fs } = layout(etroit, showUs, aop && !etroit);
  const fz = v => v * fs;
  const [yLo, yHi] = yRange;
  const lo = Math.min(0, s.umin), hi = s.umax, mU = 0.14 * (hi - lo);
  const Yu = mv => U.yB - (mv - (lo - mU)) / ((hi + mU) - (lo - mU)) * (U.yB - U.yT);
  const Ys = v => S.yB - (v - yLo) / (yHi - yLo) * (S.yB - S.yT);
  const Xt = i => x0 + i * (x1 - x0);
  const Tp = 1 / A.F_SIGNAL, Tw = 3 * Tp, n = 240;
  const ligne = (fn, Y, yMin, yMax) => { const p = []; for (let i = 0; i <= n; i++) p.push(`${Xt(i / n).toFixed(1)},${clamp(Y(fn(tau * Tp + i / n * Tw)), yMin, yMax).toFixed(1)}`); return p.join(' '); };

  const ext = A.extremes(s, Again, vdc), etat = A.etatCAN(s, Again, vdc);
  const lvlMax = A.niveauExtreme(s, Again, vdc), lvlMoy = vdc + Again * A.milieuV(s);

  // ---------- interaction ----------
  const vDe = ev => { const { Y } = coordSvg(svgRef.current, ev); return yHi - (Y - S.yT) / (S.yB - S.yT) * (yHi - yLo); };
  const dragDe = qui => ({
    onPointerDown: ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); ev.currentTarget.dataset.d = '1'; agir(qui, vDe(ev)); },
    onPointerMove: ev => { if (ev.currentTarget.dataset.d === '1') agir(qui, vDe(ev)); },
    onPointerUp: ev => { ev.currentTarget.dataset.d = ''; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } },
  });
  const agir = (qui, v) => {
    if (qui === 'A') setA(A.aDepuisNiveau(v, vdc, s, montage));
    else setVdc(A.arrondiVdc(v - Again * A.milieuV(s)));
  };
  const clavier = qui => ev => {
    const d = ev.key === 'ArrowUp' || ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowDown' || ev.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    ev.preventDefault();
    if (qui === 'A') { const dd = montage === 'inv' ? -d : d, cand = Math.sign(Again) * Math.min(A.A_MAX, Math.max(A.A_MIN, A.arrondi2(Math.abs(Again) * 10 ** (dd / 24)))); setA(cand === Again ? A.aSuivant(Again, dd) : cand); }
    else setVdc(A.arrondiVdc(vdc + d * 0.1));
  };

  // ---------- écran du capteur ----------
  const stepU = pasNice(hi - lo, 5), ticksU = []; for (let v = Math.ceil(lo / stepU) * stepU; v <= hi + 1e-9; v += stepU) ticksU.push(v);
  const ecranUe = (
    <g>
      <rect x="4" y="4" width={W - 8} height={U.yB + 30 - 4} rx="16" fill="#f8fafc" stroke={COUL.grille}/>
      <text x={x0} y="28" fontSize={fz(13.5)} fontWeight="800" fill={COUL.ue}>Tension du capteur Ue (en mV)</text>
      <rect x={x0} y={U.yT} width={x1 - x0} height={U.yB - U.yT} fill="#fff" stroke="#94a3b8" strokeWidth="1.6"/>
      {ticksU.map(v => <g key={`gu${v}`}><line x1={x0} x2={x1} y1={Yu(v)} y2={Yu(v)} stroke={v === 0 ? '#64748b' : '#e2e8f0'} strokeWidth={v === 0 ? 1.4 : 1}/>
        <text x={x0 - 6} y={Yu(v) + 4.5} textAnchor="end" fontSize={fz(12.5)} fill={COUL.gris}>{v}</text></g>)}
      <clipPath id={`${id}u`}><rect x={x0} y={U.yT} width={x1 - x0} height={U.yB - U.yT}/></clipPath>
      <g clipPath={`url(#${id}u)`}><polyline points={ligne(t => A.ueV(s, t) * 1000, Yu, U.yT, U.yB)} fill="none" stroke={COUL.ue} strokeWidth="2.8" strokeLinejoin="round"/></g>
      <text x={x1} y={U.yB + 22} textAnchor="end" fontSize={fz(12.5)} fill={COUL.gris}>durée affichée : {nb(Tw * 1000, 0)}{NB}ms</text>
    </g>);

  // ---------- écran de sortie ----------
  let ecranUs = null;
  if (showUs) {
    const span = yHi - yLo, step = span > 22 ? 4 : span > 11 ? 2 : 1, ticksS = []; for (let v = Math.ceil(yLo / step) * step; v <= yHi + 1e-9; v += step) ticksS.push(v);
    const yC5 = clamp(Ys(A.CAN_MAX), S.yT, S.yB), yC0 = clamp(Ys(0), S.yT, S.yB);
    const polSortie = ligne(t => A.usReel(s, Again, vdc, t), Ys, S.yT, S.yB);
    const hCan = yC0 - yC5;
    const hy = clamp(Ys(lvlMax), S.yT + 12, S.yB - 12), my = clamp(Ys(lvlMoy), S.yT + 12, S.yB - 12);
    const pill = (x, y, c, txt, w) => (<g transform={`translate(${x} ${y})`}><rect x={-w / 2} y="-12" width={w} height="23" rx="11.5" fill={c}/><text x="0" y="4" textAnchor="middle" fontSize={fz(13)} fontWeight="800" fill="#fff">{txt}</text></g>);
    ecranUs = (
      <g>
        <rect x="4" y={U.yB + 34} width={W - 8} height={S.yB + 52 - U.yB - 34} rx="16" fill="#f8fafc" stroke={COUL.grille}/>
        <text x={x0} y={U.yB + 56} fontSize={fz(13.5)} fontWeight="800" fill={COUL.us}>Tension de sortie Us (en V)</text>
        <rect x={x0} y={S.yT} width={x1 - x0} height={S.yB - S.yT} fill="#fff" stroke="#94a3b8" strokeWidth="1.6"/>
        {ticksS.map(v => <g key={`gs${v}`}><line x1={x0} x2={x1} y1={Ys(v)} y2={Ys(v)} stroke={v === 0 ? '#64748b' : '#e2e8f0'} strokeWidth={v === 0 ? 1.4 : 1}/>
          <text x={x0 - 6} y={Ys(v) + 4.5} textAnchor="end" fontSize={fz(12.5)} fill={COUL.gris}>{v}</text></g>)}
        {can && hCan > 4 && <g>
          <rect x={x0} y={yC5} width={x1 - x0} height={hCan} fill={COUL.can} opacity="0.11"/>
          <line x1={x0} x2={x1} y1={yC5} y2={yC5} stroke={COUL.can} strokeWidth="1.8" strokeDasharray="6 4"/><line x1={x0} x2={x1} y1={yC0} y2={yC0} stroke={COUL.can} strokeWidth="1.8" strokeDasharray="6 4"/>
          {hCan > 34 && <text x={(x0 + x1) / 2} y={yC5 + 15} textAnchor="middle" fontSize={fz(12.5)} fontWeight="800" fill={COUL.can} {...halo}>plage du CAN : 0 à 5{NB}V</text>}
        </g>}
        {sat && [A.V_SAT, -A.V_SAT].filter(v => v > yLo && v < yHi).map(v => <g key={`sa${v}`}>
          <line x1={x0} x2={x1} y1={Ys(v)} y2={Ys(v)} stroke={COUL.sat} strokeWidth="1.8" strokeDasharray="3 4"/>
          <text x={x1 - 6} y={Ys(v) + (v > 0 ? 15 : -6)} textAnchor="end" fontSize={fz(12.5)} fontWeight="800" fill={COUL.sat} {...halo}>saturation de l’AOP : {v > 0 ? '+' : '−'}{A.V_SAT}{NB}V</text></g>)}
        <clipPath id={`${id}s`}><rect x={x0} y={S.yT} width={x1 - x0} height={S.yB - S.yT}/></clipPath>
        <clipPath id={`${id}c`}><rect x={x0} y={yC5} width={x1 - x0} height={Math.max(0, hCan)}/></clipPath>
        <g clipPath={`url(#${id}s)`}>
          <polyline points={polSortie} fill="none" stroke={can ? COUL.ko : COUL.us} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
          {can && <g clipPath={`url(#${id}c)`}><polyline points={polSortie} fill="none" stroke={COUL.us} strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round"/></g>}
        </g>
        {valeurs && !(etroit && (ctrlA || ctrlDc)) && <g>
          <text x={x0 + 8} y={clamp(Ys(ext.max) - 8, S.yT + 14, S.yB - 6)} fontSize={fz(12.5)} fontWeight="800" fill={COUL.us} {...halo}>Us,max = {nb(ext.max, 2)}{NB}V</text>
          <text x={x0 + 8} y={clamp(Ys(ext.min) + 17, S.yT + 14, S.yB - 6)} fontSize={fz(12.5)} fontWeight="800" fill={COUL.us} {...halo}>Us,min = {nb(ext.min, 2)}{NB}V</text>
        </g>}
        {ctrlA && <g>
          <line x1={x0} x2={x1 - 16} y1={hy} y2={hy} stroke={COUL.poignee} strokeWidth="1.8" strokeDasharray="6 4"/>
          <rect x={x1 - 62} y={S.yT} width="62" height={S.yB - S.yT} fill="transparent" style={{ cursor: 'ns-resize', touchAction: 'none' }} {...dragDe('A')}/>
          <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Facteur d’amplification A : flèches haut et bas pour changer (le niveau maximal de la sortie suit)" aria-valuemin={A.A_MIN} aria-valuemax={A.A_MAX} aria-valuenow={Math.abs(Again)} aria-valuetext={`A = ${nb(Again, 0)}`} {...dragDe('A')} onKeyDown={clavier('A')}>
            <circle className="xa-anneau" cx={x1 - 16} cy={hy} r="19" fill="transparent" stroke="transparent"/>
            {!touche && <circle className="xa-pulse" cx={x1 - 16} cy={hy} r="19" fill="none" stroke={COUL.poignee} strokeWidth="3"/>}
            <circle cx={x1 - 16} cy={hy} r="11" fill={COUL.poignee} stroke="#fff" strokeWidth="3"/>
            <path d={`M ${x1 - 20} ${hy - 1} l 4 -5 l 4 5 M ${x1 - 20} ${hy + 2} l 4 5 l 4 -5`} fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
          {pill(clamp(x1 - 92, x0 + 50, x1 - 80), hy + (hy < S.yT + 30 ? 24 : -22), COUL.poignee, `A = ${nb(Again, 0)}`, 84)}
        </g>}
        {ctrlDc && <g>
          <line x1={x0 + 16} x2={x1} y1={my} y2={my} stroke={COUL.poignee2} strokeWidth="1.6" strokeDasharray="2 5"/>
          <rect x={x0} y={S.yT} width="62" height={S.yB - S.yT} fill="transparent" style={{ cursor: 'ns-resize', touchAction: 'none' }} {...dragDe('dc')}/>
          <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Tension continue ajoutée Vdc : flèches haut et bas pour décaler le signal de 0,1 V" aria-valuemin={-6} aria-valuemax={6} aria-valuenow={vdc} aria-valuetext={`Vdc = ${nb(vdc, 1)} V`} {...dragDe('dc')} onKeyDown={clavier('dc')}>
            <circle className="xa-anneau" cx={x0 + 16} cy={my} r="19" fill="transparent" stroke="transparent"/>
            {!touche && !ctrlA && <circle className="xa-pulse" cx={x0 + 16} cy={my} r="19" fill="none" stroke={COUL.poignee2} strokeWidth="3"/>}
            <rect x={x0 + 5} y={my - 11} width="22" height="22" rx="4" transform={`rotate(45 ${x0 + 16} ${my})`} fill={COUL.poignee2} stroke="#fff" strokeWidth="3"/>
          </g>
          {pill(x0 + (etroit ? 78 : 86), my + (my > S.yB - 30 ? -22 : 24), COUL.poignee2, `Vdc = ${nb(vdc, 1)}${NB}V`, etroit ? 104 : 110)}
        </g>}
        <g>
          <line x1={x0} x2={x0 + 18} y1={S.yB + 30} y2={S.yB + 30} stroke={can ? COUL.us : COUL.us} strokeWidth="3.4"/><text x={x0 + 24} y={S.yB + 35} fontSize={fz(12.5)} fill={COUL.txt}>Us{can ? ' dans la plage' : ''}</text>
          {can && <><line x1={x0 + fz(146)} x2={x0 + fz(164)} y1={S.yB + 30} y2={S.yB + 30} stroke={COUL.ko} strokeWidth="3.4"/><text x={x0 + fz(170)} y={S.yB + 35} fontSize={fz(12.5)} fill={COUL.txt}>hors plage (lu 0 ou 5{NB}V)</text></>}
        </g>
      </g>);
  }

  // ---------- chaîne : capteur → amplificateur → CAN (grand écran) ----------
  let chaine = null;
  if (aop && !etroit && showUs) {
    const pts = [[78, 108, 78, 210], [78, 296, 78, 344]], dot = k => (((tau * 1.4 + k * 0.33) % 1) + 1) % 1;
    chaine = (
      <g>
        <rect x="14" y="62" width="128" height="46" rx="12" fill="#eff6ff" stroke={COUL.ue} strokeWidth="2"/>
        <text x="78" y="82" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={COUL.ue}>capteur</text>
        <path d="M 40 98 q 8 -12 16 0 t 16 0 t 16 0 t 16 0" fill="none" stroke={COUL.ue} strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="78" y1="108" x2="78" y2="216" stroke="#64748b" strokeWidth="2.4"/>
        <polygon points="70,212 86,212 78,224" fill="#64748b"/>
        <polygon points="26,226 26,306 150,266" fill="#fff7ed" stroke={COUL.us} strokeWidth="2.4" strokeLinejoin="round"/>
        <text x="62" y="260" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={COUL.us}>AOP</text>
        <text x="62" y="279" textAnchor="middle" fontSize="13" fontWeight="800" fill={COUL.txt}>A = {nb(Again, 0)}</text>
        {ctrlDc || vdc !== 0 ? <text x="158" y="262" textAnchor="start" fontSize="12.5" fontWeight="800" fill={COUL.poignee2}>+ Vdc</text> : null}
        <line x1="78" y1="306" x2="78" y2="352" stroke="#64748b" strokeWidth="2.4"/>
        <polygon points="70,346 86,346 78,358" fill="#64748b"/>
        <text x="86" y="336" fontSize="12" fill={COUL.gris}>±{A.V_SAT}{NB}V max</text>
        <rect x="14" y="360" width="128" height="46" rx="12" fill="#f0fdf4" stroke={COUL.can} strokeWidth="2"/>
        <text x="78" y="380" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={COUL.can}>CAN</text>
        <text x="78" y="397" textAnchor="middle" fontSize="12.5" fill={COUL.can}>lit de 0 à 5{NB}V</text>
        {pts.map(([ax, ay, bx, by], i) => [0, 1, 2].map(k => <circle key={`d${i}${k}`} cx={ax + (bx - ax) * dot(k)} cy={ay + (by - ay) * dot(k)} r="3.6" fill={i === 0 ? COUL.ue : COUL.us}/>))}
        {etat.haut && <text x="78" y="424" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={COUL.ko}>haut écrêté</text>}
        {etat.bas && <text x="78" y={etat.haut ? 442 : 424} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={COUL.ko}>bas perdu</text>}
      </g>);
  }

  return (
    <svg ref={svgRef} className="xa-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} style={{ background: '#fff' }}>
      {ecranUe}{ecranUs}{chaine}
    </svg>);
}
