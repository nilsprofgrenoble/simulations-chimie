/* eslint-disable react-refresh/only-export-components */
import { useRef, useState, useEffect } from "react";
import { coordSvg } from "./exploAnim";
import { NB } from "./Distillation";
import * as M from "./panneauPvModele";

// ====================================================
//  Scène animée commune aux explorations des simulations 227 (caractéristique) et 228 (rendement) :
//  un soleil, des photons qui arrivent sur le panneau, un panneau dont les cellules s'éclairent avec l'éclairement E,
//  un circuit avec ampèremètre et voltmètre où circulent des charges, et une poignée « soleil » pour régler E.
//  Repère local : 340 × 320, placé en (ox, oy) dans le SVG de l'exploration.
//  Aucun calcul propre : les valeurs viennent de panneauPvModele.js.
// ====================================================
export const COLP = { E: '#b45309', U: '#0369a1', I: '#15803d', P: '#dc2626', ink: '#0f172a', gris: '#475569' };
export function useHorloge() {
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf = 0, dernier = performance.now();
    const pas = now => { setAnim(a => a + Math.min((now - dernier) / 1000, 0.05)); dernier = now; raf = requestAnimationFrame(pas); };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, []);
  return anim;
}

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const TRAJET = [[236, 178], [236, 268], [120, 268], [120, 178]];     // sens conventionnel : borne + du panneau, résistance, retour
const SEGS = TRAJET.slice(1).map((b, i) => ({ a: TRAJET[i], b, l: Math.hypot(b[0] - TRAJET[i][0], b[1] - TRAJET[i][1]) }));
const LONG = SEGS.reduce((s, x) => s + x.l, 0);
const pointSur = s => { let r = ((s % LONG) + LONG) % LONG; for (const g of SEGS) { if (r <= g.l) return [g.a[0] + (g.b[0] - g.a[0]) * r / g.l, g.a[1] + (g.b[1] - g.a[1]) * r / g.l]; r -= g.l; } return TRAJET[0]; };
const gp = (x, y) => [x, y];

export function ScenePanneau({ ox, oy, svgRef, E, onE, U, I, R, anim, touche, onTouche, motsE = 'éclairement E' }) {
  const drag = useRef(false);
  const iE = M.E_LISTE.indexOf(E), xe = i => 32 + i * (276 / 9);
  const frac = (E - 100) / 900;
  const debut = ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = true; onTouche(); bouge(ev); };
  const bouge = ev => {
    if (!drag.current) return;
    const { X } = coordSvg(svgRef.current, ev);
    const i = Math.min(Math.max(Math.round((X - ox - 32) / (276 / 9)), 0), 9);
    if (M.E_LISTE[i] !== E) onE(M.E_LISTE[i]);
  };
  const fait = ev => { drag.current = false; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const clavier = ev => {
    const s = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : 0; if (!s) return;
    ev.preventDefault(); onE(M.E_LISTE[Math.min(Math.max(iE + s, 0), 9)]);
  };

  // panneau en perspective : coins haut-gauche, haut-droit, bas-droit, bas-gauche
  const A = gp(92, 86), B = gp(264, 86), Cc = gp(292, 176), D = gp(64, 176);
  const pt = (u, v) => { const t = [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u], b = [D[0] + (Cc[0] - D[0]) * u, D[1] + (Cc[1] - D[1]) * u]; return [t[0] + (b[0] - t[0]) * v, t[1] + (b[1] - t[1]) * v]; };
  const cellule = (c, r) => { const q = [pt(c / 3 + 0.012, r / 2 + 0.03), pt((c + 1) / 3 - 0.012, r / 2 + 0.03), pt((c + 1) / 3 - 0.012, (r + 1) / 2 - 0.03), pt(c / 3 + 0.012, (r + 1) / 2 - 0.03)]; return q.map(z => z.join(',')).join(' '); };
  const rgb = mix([30, 58, 138], [56, 189, 248], frac);
  const nPh = Math.max(2, Math.round(E / 140));
  const vit = 14 + Math.min(I * 1000, 260) * 0.55;                                 // I en A → mA
  const charges = Array.from({ length: Math.floor(LONG / 30) }, (_, k) => pointSur(k * 30 + anim * vit));
  const mA = v => `${(v * 1000).toFixed(v * 1000 < 10 ? 1 : 0).replace('.', ',')}`;

  return (
    <g transform={`translate(${ox} ${oy})`}>
      <defs>
        <linearGradient id="pvs-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bae6fd"/><stop offset="1" stopColor="#f0f9ff"/></linearGradient>
        <linearGradient id="pvs-table" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d6c7ae"/><stop offset="1" stopColor="#b8a68a"/></linearGradient>
        <radialGradient id="pvs-soleil" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#fffbeb"/><stop offset="0.45" stopColor="#fde047"/><stop offset="1" stopColor="#f59e0b"/></radialGradient>
        <filter id="pvs-ombre" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.28"/></filter>
      </defs>
      <rect x="0" y="0" width="340" height="240" fill="url(#pvs-ciel)"/>
      <rect x="0" y="240" width="340" height="80" fill="url(#pvs-table)"/><rect x="0" y="238" width="340" height="4" fill="#8a7a5f"/>

      {/* soleil : taille des rayons ∝ E */}
      {Array.from({ length: 12 }, (_, k) => { const a = k * Math.PI / 6; return <line key={k} x1={56 + Math.cos(a) * 28} y1={46 + Math.sin(a) * 28} x2={56 + Math.cos(a) * (34 + 16 * frac)} y2={46 + Math.sin(a) * (34 + 16 * frac)} stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" opacity={0.4 + 0.6 * frac}/>; })}
      <circle cx="56" cy="46" r="26" fill="url(#pvs-soleil)" filter="url(#pvs-ombre)"/>
      <text x="4" y="98" textAnchor="start" fontSize="13.5" fontWeight="800" fill={COLP.E} stroke="#fff" strokeWidth="4" paintOrder="stroke">{E}{NB}W/m²</text>

      {/* photons du soleil vers le panneau */}
      {Array.from({ length: nPh }, (_, k) => { const s = (anim * 0.55 + k / nPh) % 1; return <circle key={k} cx={84 + (170 - 84) * s + Math.sin(k * 3) * 6} cy={66 + (120 - 66) * s} r="3.6" fill="#fde047" stroke="#d97706" strokeWidth="1" opacity={0.95 - 0.4 * s}/>; })}

      {/* panneau */}
      <g filter="url(#pvs-ombre)">
        <polygon points={[A, B, Cc, D].map(z => z.join(',')).join(' ')} fill="#e2e8f0" stroke="#475569" strokeWidth="3" strokeLinejoin="round"/>
        {[0, 1].flatMap(r => [0, 1, 2].map(c => <polygon key={`${r}${c}`} points={cellule(c, r)} fill={`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`} stroke="#94a3b8" strokeWidth="1.5"/>))}
        {[0, 1].flatMap(r => [0, 1, 2].map(c => <line key={`g${r}${c}`} x1={pt(c / 3 + 0.04, r / 2 + 0.1)[0]} y1={pt(c / 3 + 0.04, r / 2 + 0.1)[1]} x2={pt((c + 1) / 3 - 0.06, r / 2 + 0.06)[0]} y2={pt((c + 1) / 3 - 0.06, r / 2 + 0.06)[1]} stroke="#fff" strokeWidth="2" opacity={0.15 + 0.35 * frac}/>))}
      </g>
      <text x="178" y="76" textAnchor="middle" fontSize="14" fontWeight="800" fill={COLP.ink} stroke="#fff" strokeWidth="4" paintOrder="stroke">panneau</text>
      {/* bornes */}
      <circle cx="236" cy="178" r="5" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.5"/><circle cx="120" cy="178" r="5" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5"/>
      <text x="246" y="176" fontSize="16" fontWeight="800" fill="#b91c1c">+</text><text x="102" y="176" fontSize="18" fontWeight="800" fill="#334155">−</text>

      {/* circuit */}
      <path d="M 236 178 V 268 H 120 V 178" fill="none" stroke="#475569" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/>
      {/* résistance de charge */}
      <rect x="150" y="256" width="70" height="24" rx="6" fill="#fff" stroke="#475569" strokeWidth="3" filter="url(#pvs-ombre)"/>
      <path d="M 156 268 l 7 -9 l 9 18 l 9 -18 l 9 18 l 9 -18 l 7 9" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinejoin="round"/>
      <text x="185" y="252" textAnchor="middle" fontSize="14" fontWeight="800" fill="#334155" stroke="#fff" strokeWidth="4" paintOrder="stroke">R = {isFinite(R) ? `${R}${NB}Ω` : 'ouvert'}</text>
      {/* ampèremètre */}
      <circle cx="120" cy="222" r="21" fill="#f0fdf4" stroke={COLP.I} strokeWidth="3" filter="url(#pvs-ombre)"/>
      <text x="120" y="219" textAnchor="middle" fontSize="12" fontWeight="800" fill={COLP.I}>A</text>
      <text x="120" y="234" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={COLP.ink}>{mA(I)}</text>
      <text x="92" y="228" textAnchor="end" fontSize="11.5" fontWeight="700" fill={COLP.I}>mA</text>
      {/* voltmètre en dérivation */}
      <path d="M 236 205 H 288 M 120 205 V 196" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4"/>
      <circle cx="288" cy="222" r="21" fill="#f0f9ff" stroke={COLP.U} strokeWidth="3" filter="url(#pvs-ombre)"/>
      <text x="288" y="219" textAnchor="middle" fontSize="12" fontWeight="800" fill={COLP.U}>V</text>
      <text x="288" y="234" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={COLP.ink}>{U.toFixed(2).replace('.', ',')}</text>
      <path d="M 288 201 V 205" stroke="#94a3b8" strokeWidth="2"/>
      <path d="M 236 205 V 178" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4"/>

      {/* charges qui circulent */}
      {charges.filter(([x, y]) => Math.hypot(x - 120, y - 222) > 25).map(([x, y], k) => <circle key={k} cx={x} cy={y} r="4" fill="#fde047" stroke="#a16207" strokeWidth="1.2"/>)}

      {/* poignée « soleil » pour l'éclairement */}
      <text x="32" y="302" fontSize="14" fontWeight="800" fill={COLP.E}>{motsE} (W/m²)</text>
      <line x1={xe(0)} y1="320" x2={xe(9)} y2="320" stroke="#7c6f57" strokeWidth="6" strokeLinecap="round"/>
      <rect x={xe(0) - 14} y="304" width={xe(9) - xe(0) + 28} height="34" fill="transparent" style={{ cursor: 'pointer', touchAction: 'none' }} onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait}/>
      <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Éclairement" aria-valuemin={100} aria-valuemax={1000} aria-valuenow={E} aria-valuetext={`${E} watts par mètre carré`}
        onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier}>
        <rect x={xe(iE) - 26} y="298" width="52" height="44" fill="transparent"/>
        {!touche && <circle className="xa-pulse" cx={xe(iE)} cy="320" r="17" fill="none" stroke={COLP.E} strokeWidth="3"/>}
        <circle className="xa-anneau" cx={xe(iE)} cy="320" r="13" fill="url(#pvs-soleil)" stroke="#b45309" strokeWidth="3" filter="url(#pvs-ombre)"/>
      </g>
    </g>);
}
