/* eslint-disable react-refresh/only-export-components */
import { useRef, useState, useEffect } from "react";
import * as M from "./staModele";
import { reduitMouvement } from "./hookHorloge";

// ====================================================
//  Scène de la simulation 320 : le carbone d'un intermédiaire réactionnel en 3D (projection orthogonale tournante).
//  Carbocation : trois substituants dans un plan (120°) et une orbitale p vide ; carbanion : pyramide à base triangulaire et un doublet non liant (trait) ;
//  radical : presque plan, un électron célibataire (point). La forme change avec animation quand on change de type. On tourne la molécule au doigt/à la souris.
// ====================================================
export const COUL = { plus: '#c2410c', moins: '#0f766e', fl: '#ea580c', txt: '#0f172a', gris: '#475569' };
const FOND = { H: '#e2e8f0', Me: '#cbd5e1', Cl: '#bbf7d0', CN: '#bfdbfe' };
const BORD = { H: '#64748b', Me: '#475569', Cl: '#15803d', CN: '#1d4ed8' };
const rad = d => d * Math.PI / 180;
const lisse = t => t * t * (3 - 2 * t);

// pyramidalisation animée vers la cible (≈ 0,7 s) ; mouvement réduit : valeur immédiate
export function usePyr(cible, duree = 700) {
  const [v, setV] = useState(cible), cur = useRef(cible), raf = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const depart = cur.current;
    if (reduitMouvement() || Math.abs(depart - cible) < 1e-9) { cur.current = cible; raf.current = requestAnimationFrame(() => setV(cible)); return () => cancelAnimationFrame(raf.current); }
    const t0 = performance.now();
    const boucle = ts => { const t = Math.min(1, (ts - t0) / duree), x = depart + (cible - depart) * lisse(t); cur.current = x; setV(x); if (t < 1) raf.current = requestAnimationFrame(boucle); };
    raf.current = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf.current);
  }, [cible, duree]);
  return v;
}

function proj(p, rot, tilt, S, cx, cy) {
  const r = rad(rot), t = rad(tilt), x1 = p[0] * Math.cos(r) + p[2] * Math.sin(r), z1 = -p[0] * Math.sin(r) + p[2] * Math.cos(r);
  const y2 = p[1] * Math.cos(t) - z1 * Math.sin(t), z2 = p[1] * Math.sin(t) + z1 * Math.cos(t);
  return { x: cx + S * x1, y: cy - S * y2, z: z2 };
}

export function SceneSta({ type, subs, pyr: pyrFixe = null, compact = false, pos = null, aria, rot0 = 28 }) {
  const cible = pyrFixe != null ? pyrFixe : M.pyramidalisation(type), anime = usePyr(cible), pyr = pyrFixe != null ? pyrFixe : anime;
  const [rot, setRot] = useState(rot0), drag = useRef(null), svgRef = useRef(null);
  const S = 88, cx = 150, cy = 108, tilt = 22;
  const P = (p) => proj(p, rot, tilt, S, cx, cy);
  const C = P([0, 0, 0]), pts = M.positions(pyr).map((p, i) => ({ ...P(p), s: subs[i], i }));
  const ordre = [...pts].sort((a, b) => a.z - b.z), derriere = ordre.filter(p => p.z < 0), devant = ordre.filter(p => p.z >= 0);
  const lobeH = P([0, 0.62, 0]), lobeB = P([0, -0.62, 0]);
  const aff = (p) => {
    const g = M.SUBS[p.s], long = g.sym.length > 2, r = (long ? 20 : 16) * (1 + p.z * 0.06), d = Math.hypot(p.x - C.x, p.y - C.y) || 1, ux = (p.x - C.x) / d, uy = (p.y - C.y) / d;
    return (<g key={p.i}>
      <line x1={C.x + ux * 15} y1={C.y + uy * 15} x2={p.x - ux * (r - 2)} y2={p.y - uy * (r - 2)} stroke={COUL.txt} strokeWidth={3.6 + p.z * 0.8} strokeLinecap="round"/>
      <circle cx={p.x} cy={p.y} r={r} fill={FOND[p.s]} stroke={BORD[p.s]} strokeWidth="2"/>
      <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={long ? 13 : 15} fontWeight="800" fill={COUL.txt}>{g.sym}</text>
    </g>);
  };
  const t = M.TYPES[type];
  const lobe = (L, plein, bas) => <ellipse cx={L.x} cy={L.y} rx="19" ry="30" fill={plein ? 'rgba(15,118,110,0.16)' : 'rgba(234,88,12,0.10)'} stroke={plein ? COUL.moins : COUL.fl} strokeWidth="2.2" strokeDasharray={plein ? '0' : '5 4'} transform={`rotate(${bas ? 0 : 0} ${L.x} ${L.y})`}/>;
  const lobes = (
    <g>
      {type === 'cation' && <>{lobe(lobeB, false)}{lobe(lobeH, false)}</>}
      {type === 'anion' && <>{lobe(lobeH, true)}<line x1={lobeH.x - 10} y1={lobeH.y} x2={lobeH.x + 10} y2={lobeH.y} stroke={COUL.moins} strokeWidth="5" strokeLinecap="round"/></>}
      {type === 'radical' && <>{lobe(lobeB, false)}{lobe(lobeH, false)}<circle cx={lobeH.x} cy={lobeH.y} r="5.4" fill={COUL.fl}/></>}
    </g>);
  const bx = cx + 72, by = 30;
  const tete = (
    <g>
      <circle cx={C.x} cy={C.y} r="17" fill="#fff" stroke={COUL.txt} strokeWidth="2.6"/>
      <text x={C.x} y={C.y + 6} textAnchor="middle" fontSize="17" fontWeight="800" fill={COUL.txt}>C</text>
    </g>);
  const badge = type !== 'radical' && (
    <g><circle cx={bx} cy={by} r="12" fill="#fff" stroke={type === 'cation' ? COUL.plus : COUL.moins} strokeWidth="2.2"/>
      <text x={bx} y={by + 7} textAnchor="middle" fontSize="22" fontWeight="800" fill={type === 'cation' ? COUL.plus : COUL.moins}>{t.signe}</text></g>);
  const onDown = ev => { drag.current = { x: ev.clientX, r: rot }; ev.currentTarget.setPointerCapture?.(ev.pointerId); };
  const onMove = ev => { if (drag.current) setRot(drag.current.r + (ev.clientX - drag.current.x) * 0.7); };
  const onUp = () => { drag.current = null; };
  const onKey = ev => { if (ev.key === 'ArrowLeft') { ev.preventDefault(); setRot(r => r - 15); } else if (ev.key === 'ArrowRight') { ev.preventDefault(); setRot(r => r + 15); } };
  const attrs = pos ? { x: pos.x, y: pos.y, width: pos.w, height: pos.h } : { width: '100%' };
  return (
    <svg ref={svgRef} viewBox="0 0 300 200" {...attrs} role="img" aria-label={aria || `${t.nom} : ${t.forme}`} tabIndex={compact ? undefined : 0}
      style={{ display: 'block', touchAction: 'pan-y', cursor: compact ? 'default' : 'grab', outline: 'none', maxWidth: compact ? undefined : 460, margin: compact ? undefined : '0 auto' }}
      onPointerDown={compact ? undefined : onDown} onPointerMove={compact ? undefined : onMove} onPointerUp={compact ? undefined : onUp} onPointerCancel={compact ? undefined : onUp} onKeyDown={compact ? undefined : onKey}>
      {lobes}
      {derriere.map(aff)}{tete}{devant.map(aff)}
      {badge}
      {!compact && <text x="150" y="194" textAnchor="middle" fontSize="12.5" fill={COUL.gris}>Faites glisser pour tourner la molécule</text>}
    </svg>);
}

// vignette plane d'un intermédiaire (défis) : carbone central, charge et trois substituants lisibles
export function VignetteIntermediaire({ type, subs, aria }) {
  const pos = [[80, 36], [26, 98], [134, 98]];
  const t = M.TYPES[type];
  return (
    <svg viewBox="0 0 160 124" width="100%" role="img" aria-label={aria || M.nomIntermediaire(type, subs)} style={{ display: 'block', maxWidth: 190, margin: '0 auto' }}>
      {pos.map(([x, y], i) => <line key={i} x1="80" y1="74" x2={x} y2={y} stroke={COUL.txt} strokeWidth="3.2" strokeLinecap="round"/>)}
      {pos.map(([x, y], i) => { const g = M.SUBS[subs[i]], l = g.sym.length > 2; return (<g key={i}><circle cx={x} cy={y} r={l ? 19 : 16} fill={FOND[subs[i]]} stroke={BORD[subs[i]]} strokeWidth="2"/>
        <text x={x} y={y + 5} textAnchor="middle" fontSize={l ? 13 : 15} fontWeight="800" fill={COUL.txt}>{g.sym}</text></g>); })}
      <circle cx="80" cy="74" r="14" fill="#fff" stroke={COUL.txt} strokeWidth="2.4"/><text x="80" y="80" textAnchor="middle" fontSize="16" fontWeight="800" fill={COUL.txt}>C</text>
      {type !== 'radical' && <g><circle cx="106" cy="52" r="10" fill="#fff" stroke={type === 'cation' ? COUL.plus : COUL.moins} strokeWidth="2"/><text x="106" y="58" textAnchor="middle" fontSize="17" fontWeight="800" fill={type === 'cation' ? COUL.plus : COUL.moins}>{t.signe}</text></g>}
      {type === 'anion' && <line x1="70" y1="98" x2="90" y2="98" stroke={COUL.moins} strokeWidth="4.4" strokeLinecap="round"/>}
      {type === 'radical' && <circle cx="80" cy="98" r="4.6" fill={COUL.fl}/>}
    </svg>);
}
