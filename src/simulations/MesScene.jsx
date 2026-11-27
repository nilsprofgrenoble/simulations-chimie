/* eslint-disable react-refresh/only-export-components */
import { useId, useRef, useState, useEffect } from "react";
import * as M from "./mesModele";
import { reduitMouvement } from "./hookHorloge";

// ====================================================
//  Scène de la simulation 319 : une écriture de Lewis d'une espèce (atomes, liaisons, doublets non liants, charges formelles).
//  Les doublets sont cliquables : un clic lance l'animation du déplacement (flèches courbes de mésomérie), puis l'écriture suivante s'affiche.
//  Le même dessin sert aux petites vignettes des défis (compact). Hybride de résonance : liaisons partielles (pointillés) et charges δ.
// ====================================================
export const COUL = { plus: '#c2410c', moins: '#0f766e', fl: '#ea580c', txt: '#0f172a', gris: '#475569', C: '#0f172a', N: '#1d4ed8', O: '#b91c1c', H: '#475569' };
const SUB = ['', '', '₂', '₃', '₄'];
const etiquette = a => a.el + (a.h > 0 ? 'H' + (a.h > 1 ? SUB[a.h] : '') : '');
const CAND = [-90, -45, -135, 0, 180, 45, 135, 90];
const dAng = (a, b) => { let d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const rad = d => d * Math.PI / 180;
const lisse = t => t * t * (3 - 2 * t);

// géométrie fixe d'une espèce : angles des liaisons, emplacements possibles des doublets non liants, emplacement de la charge
function geometrie(e, f) {
  const P = Object.fromEntries(e.atomes.map(a => [a.id, a]));
  const info = {};
  for (const a of e.atomes) {
    const angs = e.liaisons.filter(l => l[0] === a.id || l[1] === a.id).map(l => { const o = P[l[0] === a.id ? l[1] : l[0]]; return Math.atan2(o.y - a.y, o.x - a.x) * 180 / Math.PI; });
    const GRILLE = Array.from({ length: 24 }, (_, i) => -90 + 15 * i).map(x => (x > 180 ? x - 360 : x));
    const rang = [], ref = [...angs];
    for (let n = 0; n < 4; n++) {
      let best = null; for (const ang of GRILLE) { const c = ref.length ? Math.min(...ref.map(x => dAng(x, ang))) : 180; if (c >= 50 && (!best || c > best.c + 1e-9)) best = { ang, c }; }
      if (!best) break; rang.push(best.ang); ref.push(best.ang);
    }
    const n = f.lp[a.id], utilises = rang.slice(0, n), occ = [...angs, ...utilises];
    let bd = null; for (const ang of CAND) { const c = occ.length ? Math.min(...occ.map(x => dAng(x, ang))) : 180; if (!bd || c > bd.c + 1e-9) bd = { ang, c }; }
    info[a.id] = { slots: rang, angs, badge: bd.ang };
  }
  return { P, info };
}
const pointSlot = (a, ang, dist) => [a.x + dist * Math.cos(rad(ang)), a.y + dist * Math.sin(rad(ang))];
const distLp = a => 21 + (etiquette(a).length > 2 ? 9 : 0) + (etiquette(a).length === 2 ? 3 : 0);
const milieu = (A, B) => [(A.x + B.x) / 2, (A.y + B.y) / 2];

function Paire({ x, y, ang, r = 2.7, couleur = COUL.txt, ecart = 3.6 }) {
  const px = -Math.sin(rad(ang)) * ecart, py = Math.cos(rad(ang)) * ecart;
  return <g><circle cx={x + px} cy={y + py} r={r} fill={couleur}/><circle cx={x - px} cy={y - py} r={r} fill={couleur}/></g>;
}
function Liaison({ A, B, n, pointille = 0, taille = 1 }) {
  const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
  const garde = (a, s) => { const demi = etiquette(a).length * 6.4 + 4, r = 11 + Math.abs(s * ux) * Math.max(0, demi - 11); return r; };
  const r1 = garde(A, 1), r2 = garde(B, -1);
  const x1 = A.x + ux * r1, y1 = A.y + uy * r1, x2 = B.x - ux * r2, y2 = B.y - uy * r2;
  const decals = n >= 3 ? [-4, 0, 4] : n === 2 ? [-3.2, 3.2] : [0];
  const tr = (o, i) => <line key={i} x1={x1 + nx * o} y1={y1 + ny * o} x2={x2 + nx * o} y2={y2 + ny * o} stroke={COUL.txt} strokeWidth={2.5 * taille} strokeLinecap="round"/>;
  if (pointille > 0) { // liaison partielle : un trait plein et un trait en pointillés
    return <g>{tr(0, 'a')}<line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COUL.txt} strokeWidth={2.4} strokeDasharray="5 5" strokeLinecap="round" opacity={0.35 + 0.65 * pointille} transform={`translate(${nx * 6.4} ${ny * 6.4})`}/></g>;
  }
  return <g>{decals.map(tr)}</g>;
}

// anim : { coup, t } ; arrows : coup ou null ; hybride : { b, q } ou null ; handles : bool
export function SceneMes({ e, f, anim = null, arrows = null, handles = false, onCoup, hybride = null, compact = false, svgRef, aria, surligne = null, pos = null, rogne = false }) {
  const idm = useId().replace(/:/g, '');
  const { P, info } = geometrie(e, f);
  const k = anim ? anim.coup : null, t = anim ? lisse(anim.t) : 0;
  const lpAff = id => (k && k.type === 'A' && k.a === id ? f.lp[id] - 1 : f.lp[id]);
  const bAff = i => { const l = e.liaisons[i]; return k && ((l[0] === k.b && l[1] === k.c) || (l[0] === k.c && l[1] === k.b)) ? f.b[i] - 1 : f.b[i]; };
  const g = anim && anim.t > 0.6 ? M.appliquer(e, f, k) : f, q = M.charges(e, g);
  const centre = [e.atomes.reduce((s, a) => s + a.x, 0) / e.atomes.length, e.atomes.reduce((s, a) => s + a.y, 0) / e.atomes.length];
  const posLp = (id, idx) => { const a = P[id], ang = info[id].slots[idx]; return ang == null ? null : { p: pointSlot(a, ang, distLp(a)), ang }; };
  const courbe = (De, Vers, hautDe = 30) => {
    const mx = (De[0] + Vers[0]) / 2, my = (De[1] + Vers[1]) / 2, dx = Vers[0] - De[0], dy = Vers[1] - De[1], d = Math.hypot(dx, dy) || 1;
    let nx = -dy / d, ny = dx / d; if ((mx + nx - centre[0]) ** 2 + (my + ny - centre[1]) ** 2 < (mx - nx - centre[0]) ** 2 + (my - ny - centre[1]) ** 2) { nx = -nx; ny = -ny; }
    return `M ${De[0]} ${De[1]} Q ${mx + nx * hautDe} ${my + ny * hautDe} ${Vers[0]} ${Vers[1]}`;
  };
  // éléments mobiles du coup en cours ou des flèches
  const pairesCoup = c => {
    const A = P[c.a], B = P[c.b], C = P[c.c], mAB = milieu(A, B), mBC = milieu(B, C);
    const idxA = f.lp[c.a] - 1, idxC = f.lp[c.c];
    const dep1 = c.type === 'A' ? posLp(c.a, idxA) : null, arr2 = c.type === 'A' ? posLp(c.c, idxC) : null;
    return { mAB, mBC, dep1, arr2 };
  };
  const fleches = c => {
    if (!c) return null; const { mAB, mBC, dep1, arr2 } = pairesCoup(c);
    const de1 = dep1 ? dep1.p : null, vers2 = c.type === 'A' ? (arr2 ? arr2.p : [P[c.c].x, P[c.c].y - 20]) : mAB;
    return (<g fill="none" stroke={COUL.fl} strokeWidth={compact ? 2.4 : 2.6} strokeLinecap="round" opacity={anim ? 1 - 0.7 * lisse(Math.min(1, anim.t * 1.5)) : 1}>
      {de1 && <path d={courbe(de1, mAB, 26)} markerEnd={`url(#fl${idm})`}/>}
      <path d={courbe(mBC, vers2, 26)} markerEnd={`url(#fl${idm})`}/>
    </g>);
  };
  let mobiles = null;
  if (k) {
    const { mAB, mBC, dep1, arr2 } = pairesCoup(k), ang = (A, B) => Math.atan2(B[1] - A[1], B[0] - A[0]) * 180 / Math.PI + 90;
    const lerp = (A, B) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
    const dest2 = k.type === 'A' ? (arr2 ? arr2.p : mBC) : mAB, p2 = lerp(mBC, dest2), a2 = ang(mBC, dest2);
    mobiles = (<g>
      {dep1 && (() => { const p1 = lerp(dep1.p, mAB), a1 = ang(dep1.p, mAB); return <Paire x={p1[0]} y={p1[1]} ang={a1} couleur={COUL.fl} r={3.1}/>; })()}
      <Paire x={p2[0]} y={p2[1]} ang={a2} couleur={COUL.fl} r={3.1}/>
    </g>);
  }
  const hyb = hybride;
  const xs = e.atomes.map(a => a.x), ys = e.atomes.map(a => a.y), vb = rogne ? [Math.min(...xs) - 42, Math.min(...ys) - 34, Math.max(...xs) - Math.min(...xs) + 84, Math.max(...ys) - Math.min(...ys) + 70] : [0, 0, 300, 190];
  return (
    <svg ref={svgRef} role="img" aria-label={aria} viewBox={vb.join(' ')} {...(pos ? { x: pos.x, y: pos.y, width: pos.w, height: pos.h } : { width: '100%', style: { display: 'block', maxWidth: compact ? 300 : 440, margin: '0 auto', fontFamily: 'inherit', touchAction: 'pan-y' } })}>
      <defs><marker id={`fl${idm}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M 0 1 L 9 5 L 0 9 z" fill={COUL.fl}/></marker></defs>
      {e.liaisons.map((l, i) => hyb
        ? <Liaison key={i} A={P[l[0]]} B={P[l[1]]} n={Math.floor(hyb.b[i] + 1e-9)} pointille={hyb.b[i] - Math.floor(hyb.b[i] + 1e-9)} taille={compact ? 1 : 1}/>
        : <Liaison key={i} A={P[l[0]]} B={P[l[1]]} n={bAff(i)}/>)}
      {e.atomes.map(a => {
        const lab = etiquette(a), halo = { stroke: '#fff', strokeWidth: 5, paintOrder: 'stroke' };
        const lps = hyb ? [] : Array.from({ length: lpAff(a.id) }, (_, i) => posLp(a.id, i)).filter(Boolean);
        const qa = hyb ? hyb.q[a.id] : q[a.id], bd = pointSlot(a, info[a.id].badge, 25 + (lab.length > 2 ? 6 : 0));
        return (<g key={a.id}>
          <text x={a.x} y={a.y + 7} textAnchor="middle" fontSize="21" fontWeight="800" fill={COUL[a.el]} style={halo}>{lab}</text>
          {lps.map((l, i) => <Paire key={i} x={l.p[0]} y={l.p[1]} ang={l.ang}/>)}
          {(!hyb || (Math.abs(qa) > 1e-6 && Math.abs(qa - Math.round(qa)) < 1e-6)) && qa !== 0 && <g><circle cx={bd[0]} cy={bd[1]} r="11" fill="#fff" stroke={qa > 0 ? COUL.plus : COUL.moins} strokeWidth="2"/><text x={bd[0]} y={bd[1] + 6.2} textAnchor="middle" fontSize="20" fontWeight="800" fill={qa > 0 ? COUL.plus : COUL.moins}>{qa > 0 ? '+' : '−'}</text></g>}
          {hyb && Math.abs(qa) > 1e-6 && Math.abs(qa - Math.round(qa)) > 1e-6 && <text x={bd[0]} y={bd[1] + 5} textAnchor="middle" fontSize="15.5" fontWeight="800" fill={qa > 0 ? COUL.plus : COUL.moins} style={halo}>δ{qa > 0 ? '+' : '−'}</text>}
          {surligne === a.id && <circle cx={a.x} cy={a.y} r="25" fill="none" stroke="#ca8a04" strokeWidth="2.6" strokeDasharray="4 4"/>}
        </g>);
      })}
      {!anim && arrows && fleches(arrows)}
      {anim && fleches(anim.coup)}
      {mobiles}
      {handles && !anim && M.coups(e, f).map((c, i) => {
        const { mBC, dep1 } = pairesCoup(c), pt = dep1 ? dep1.p : mBC, nom = c.type === 'A' ? `le doublet de l’atome ${e.atomes.find(a => a.id === c.a).el}` : 'les électrons de la double liaison';
        const ouvrir = ev => { ev.preventDefault(); onCoup && onCoup(c); };
        return (<g key={i} className="xa-poignee" role="button" tabIndex={0} aria-label={`Déplacer ${nom} (flèches de mésomérie)`} onClick={ouvrir} onKeyDown={ev => (ev.key === 'Enter' || ev.key === ' ') && ouvrir(ev)} style={{ cursor: 'pointer' }}>
          <circle cx={pt[0]} cy={pt[1]} r="24" fill="transparent"/>
          <circle className="xa-anneau xa-pulse" cx={pt[0]} cy={pt[1]} r="14" fill="rgba(234,88,12,0.12)" stroke={COUL.fl} strokeWidth="2.4" strokeDasharray="4 3"/>
        </g>);
      })}
    </svg>);
}

// animation d'un déplacement de doublets (≈ 1,3 s) ; réduit le mouvement : application immédiate
export function useCoup(onFin, duree = 1300) {
  const [anim, setAnim] = useState(null), raf = useRef(0), fin = useRef(onFin);
  useEffect(() => { fin.current = onFin; }, [onFin]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const lancer = coup => {
    cancelAnimationFrame(raf.current);
    if (reduitMouvement()) { fin.current(coup); return; }
    const t0 = performance.now();
    const boucle = ts => { const t = Math.min(1, (ts - t0) / duree); if (t >= 1) { setAnim(null); fin.current(coup); } else { setAnim({ coup, t }); raf.current = requestAnimationFrame(boucle); } };
    setAnim({ coup, t: 0 }); raf.current = requestAnimationFrame(boucle);
  };
  return [anim, lancer];
}
