import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { KIT, styleBouton, stylePetitBouton, styleBoite, Section, Curseur } from "../commun";
import { NB } from "./Distillation";
import { trajet, imageA, FPS, G, X_LANCEUR, X_PIED, D_MAX, V_MAX, recul } from "./flipperTrajet";

// ====================================================
//  Exploration animée de la simulation 263 (flipper).
//  On TIRE la bille en arrière contre le ressort et on la lâche ; on tire le haut de la rampe pour changer h et α.
//  Tout le mouvement vient de flipperTrajet.js (lois exactes de la conservation / non-conservation de l'énergie mécanique).
// ====================================================
const S = 120, OX = 24, YSOL = 340, W = 700, H = 400;   // 120 px par mètre ; origine x à 24 px ; sol à y = 340
const px = x => OX + x * S;
const COL = { Ec: '#0369a1', Epp: '#c2410c', Em: '#6d28d9', v: '#15803d', ink: '#0f172a', gris: '#475569' };
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const rad = d => d * Math.PI / 180;
const rBille = m => 11 + 16 * Math.cbrt(m);              // rayon dessiné (px) : 50 g ≈ 17, 150 g ≈ 19
const J = (v) => `${nbf(v, v < 0.1 ? 3 : 2)}${NB}J`;

const Seg = ({ label, valeur, options, onChange }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{label}</div>
    <div role="group" aria-label={label} style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {options.map(([v, l]) => <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={valeur === v} style={{ ...stylePetitBouton(valeur === v, '#0369a1'), minHeight: 38 }}>{l}</button>)}
    </div>
  </div>);

export function FlipperExplore() {
  const [p, setP] = useState({ m: 0.08, h: 0.8, deg: 30, f: 0, v0: 5.5 });
  const [t, setT] = useState(0), [joue, setJoue] = useState(false), [vit, setVit] = useState(1);
  const [aTouche, setATouche] = useState(false);
  const [ouv, setOuv] = useState(false);
  const svgRef = useRef(null), drag = useRef(null), raf = useRef(0), boite = useRef(null);
  const [etroit, setEtroit] = useState(false);
  useEffect(() => {
    const el = boite.current; if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => setEtroit(el.clientWidth < 600)); ro.observe(el); setEtroit(el.clientWidth < 600);
    return () => ro.disconnect();
  }, []);
  const tr = useMemo(() => trajet(p), [p]);
  const fin = t >= tr.tFin - 1e-9 && tr.tFin > 0;
  const q = imageA(tr, t);

  // ---- lecture ----
  const demarrer = useCallback(() => { setT(0); setJoue(true); setATouche(true); }, []);
  useEffect(() => {
    if (!joue) return undefined;
    let dernier = performance.now();
    const pas = now => {
      const dt = Math.min((now - dernier) / 1000, 0.05); dernier = now;
      let fini = false;
      setT(x => { const y = x + dt * vit; if (y >= tr.tFin) { fini = true; return tr.tFin; } return y; });
      if (fini) setJoue(false); else raf.current = requestAnimationFrame(pas);
    };
    raf.current = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf.current);
  }, [joue, vit, tr.tFin]);
  // première ouverture : un tir de démonstration (sauf si l'élève réduit les animations)
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setTimeout(() => { setT(0); setJoue(true); }, 700);
    return () => clearTimeout(id);
  }, []);
  const regler = useCallback(ch => { setJoue(false); setT(0); setP(s => ({ ...s, ...ch })); }, []);

  // ---- géométrie ----
  const sn = Math.sin(rad(p.deg)), cs = Math.cos(rad(p.deg)), L = p.h / sn, run = p.h / Math.tan(rad(p.deg));
  const r = rBille(p.m), RX = px(X_PIED - 0.14);
  const xPied = px(X_PIED), xTop = px(X_PIED + run), yTop = YSOL - p.h * S;
  const pos = useCallback(f => {
    let th = 0;
    if (f.ph === 'B' || f.ph === 'C') th = rad(p.deg);
    else if (f.ph === 'D') th = rad(p.deg) * Math.max(0, 1 - (f.t - tr.tTop) / 0.12);
    return { x: px(f.x) - Math.sin(th) * r, y: YSOL - f.z * S - Math.cos(th) * r };
  }, [p.deg, r, tr.tTop]);
  const b = pos(q), b0 = pos(tr.frames[0]);
  const traine = useMemo(() => {
    const pts = []; const n = Math.floor(t * FPS), pasI = Math.max(Math.round(FPS * 0.06), 1);
    for (let i = 0; i <= n && i < tr.frames.length; i += pasI) pts.push(pos(tr.frames[i]));
    return pts;
  }, [t, tr, pos]);
  const hautMax = tr.issue === 'redescend' || tr.issue === 'bloquee';

  // ---- manipulation à la souris / au doigt ----
  const monde = ev => { const sv = svgRef.current, pt = sv.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const m = pt.matrixTransform(sv.getScreenCTM().inverse()); return { X: m.x, Y: m.y }; };
  const debut = (type) => ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = { type, bouge: false }; setATouche(true); };
  const bouge = ev => {
    const d = drag.current; if (!d) return;
    const { X, Y } = monde(ev); d.bouge = true;
    if (d.type === 'bille') {
      const recule = Math.min(Math.max(X_LANCEUR - (X - OX) / S, 0), D_MAX);
      const v0 = Math.round(recule / D_MAX * V_MAX / 0.1) * 0.1;
      if (Math.abs(v0 - p.v0) > 1e-9) regler({ v0: Number(v0.toFixed(1)) });
    } else {
      let h = Math.min(Math.max(Math.round((YSOL - Y) / S / 0.05) * 0.05, 0.2), 1.4);
      const dx = Math.max((X - OX) / S - X_PIED, 0.1);
      let deg = Math.min(Math.max(Math.round(Math.atan2(h, dx) * 180 / Math.PI / 5) * 5, 15), 60);
      while (h / Math.tan(rad(deg)) > 2.9 && deg < 60) deg += 5;
      h = Number(h.toFixed(2));
      if (Math.abs(h - p.h) > 1e-9 || deg !== p.deg) regler({ h, deg });
    }
  };
  const fait = ev => {
    const d = drag.current; drag.current = null;
    try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ }
    if (d && d.type === 'bille' && d.bouge && p.v0 > 0) demarrer();
  };
  const clavier = (type) => ev => {
    const k = ev.key, sens = k === 'ArrowRight' || k === 'ArrowUp' ? 1 : k === 'ArrowLeft' || k === 'ArrowDown' ? -1 : 0;
    if (!sens) return;
    ev.preventDefault();
    if (type === 'bille') regler({ v0: Number(Math.min(Math.max(p.v0 - sens * 0.2, 0), V_MAX).toFixed(1)) });
    else regler({ h: Number(Math.min(Math.max(p.h + sens * 0.05, 0.2), 1.4).toFixed(2)) });
  };

  // ---- éléments dessinés ----
  const ruleur = [0, 0.25, 0.5, 0.75, 1, 1.25].filter(z => z <= 1.45);
  const rugosite = p.f > 0 ? Array.from({ length: Math.max(Math.round(L * 22), 6) }, (_, i) => { const s = (i + 0.5) / Math.max(Math.round(L * 22), 6) * L; return [xPied + s * cs * S, YSOL - s * sn * S]; }) : [];
  const pl = px(Math.min(q.x, X_LANCEUR)) - r - 3;           // face du poussoir
  const zig = []; { const n = 10, x0 = 15, x1 = Math.max(pl, x0 + 14); for (let i = 0; i <= n; i++) zig.push(`${(x0 + (x1 - x0) * i / n).toFixed(1)},${(YSOL - 14 + (i === 0 || i === n ? 0 : (i % 2 ? -8 : 8))).toFixed(1)}`); }
  const Emax = Math.max(tr.E0, 1e-6) * 1.08, hb = 108, hh = v => Math.max(Math.min(v, Emax), 0) / Emax * hb;
  const vecteur = q.v > 0.05 && !fin;
  const ang = Math.atan2(-q.vz, q.vx), lv = Math.min(q.v * 9, 70);
  const ombre = Math.max(0.05, 0.28 - 0.1 * q.z);
  const message = !joue && t === 0 && !aTouche ? 'Tire la bille vers la gauche puis lâche-la, ou appuie sur « Tirer ». Tu peux aussi saisir le haut de la rampe pour la monter, la baisser ou l’incliner.'
    : tr.issue === 'immobile' ? 'La vitesse d’éjection est nulle : la bille ne bouge pas. Tire-la vers la gauche.'
    : !fin ? '' : tr.issue === 'sommet' ? `La bille atteint le haut de la rampe à ${nbf(tr.vTop, 1)} m/s, puis elle tombe ${nbf(tr.xLand - (X_PIED + run), 1)} m plus loin.`
    : tr.issue === 'bloquee' ? `La bille monte jusqu’à ${nbf(tr.hMax, 2)} m de hauteur (rampe : ${nbf(p.h, 2)} m) puis reste immobile : le frottement la retient.`
    : `La bille s’arrête à ${nbf(tr.hMax, 2)} m de hauteur (rampe : ${nbf(p.h, 2)} m), puis elle redescend.`;
  const F = etroit ? 1.3 : 1;
  const tourne = !aTouche && !joue && t === 0;

  return (
    <div ref={boite}>
      <style>{`
        .flx-svg { width: 100%; max-width: 920px; display: block; margin: 0 auto; border-radius: 14px; touch-action: manipulation; user-select: none; -webkit-user-select: none; box-shadow: 0 1px 2px rgba(15,23,42,.08), 0 8px 24px rgba(3,105,161,.10); }
        .flx-poignee { cursor: grab; touch-action: none; outline: none; } .flx-poignee:active { cursor: grabbing; }
        .flx-poignee:focus-visible .flx-anneau { stroke: #0f172a; stroke-width: 3; }
        .flx-ctrl { display: grid; gap: 12px; grid-template-columns: minmax(0, 1fr); margin-top: 10px; }
        .flx-chips { display: grid; gap: 8px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 10px; }
        @media (min-width: 700px) { .flx-ctrl { grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: end; } .flx-chips { grid-template-columns: repeat(6, minmax(0, 1fr)); } }
        @media (prefers-reduced-motion: no-preference) {
          .flx-pulse { animation: flx-p 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
          @keyframes flx-p { 0%, 100% { transform: scale(1); opacity: .9; } 50% { transform: scale(1.35); opacity: .35; } }
          .flx-tire { animation: flx-t 1.1s ease-in-out infinite; } @keyframes flx-t { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-9px); } }
        }
      `}</style>
      <svg ref={svgRef} className="flx-svg" viewBox={etroit ? `0 100 560 300` : `0 0 ${W} ${H}`} role="img" aria-label="Scène animée : une bille, tirée en arrière contre un ressort, est lancée vers une rampe inclinée ; les barres d’énergie cinétique, potentielle et mécanique suivent son mouvement.">
        <defs>
          <linearGradient id="flx-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bae6fd"/><stop offset="0.7" stopColor="#f0f9ff"/><stop offset="1" stopColor="#ffffff"/></linearGradient>
          <linearGradient id="flx-sol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d6d3d1"/><stop offset="1" stopColor="#a8a29e"/></linearGradient>
          <linearGradient id="flx-rampe" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e2e8f0"/><stop offset="1" stopColor="#94a3b8"/></linearGradient>
          <radialGradient id="flx-bille" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#ffffff"/><stop offset="0.35" stopColor="#fde68a"/><stop offset="1" stopColor="#d97706"/></radialGradient>
          <linearGradient id="flx-ressort" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f97316"/><stop offset="1" stopColor="#c2410c"/></linearGradient>
          <filter id="flx-ombre" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.28"/></filter>
          <marker id="flx-pointe" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={COL.v}/></marker>
        </defs>
        <rect width={W} height={H} fill="url(#flx-ciel)"/>
        <path d={`M0,${YSOL - 40} C120,${YSOL - 95} 230,${YSOL - 30} 360,${YSOL - 62} C470,${YSOL - 88} 590,${YSOL - 38} ${W},${YSOL - 70} L${W},${YSOL} L0,${YSOL} Z`} fill="#dbeafe" opacity="0.7"/>
        <rect y={YSOL} width={W} height={H - YSOL} fill="url(#flx-sol)"/>
        <line x1="0" y1={YSOL} x2={W} y2={YSOL} stroke="#57534e" strokeWidth="3"/>
        {Array.from({ length: 35 }, (_, i) => <line key={i} x1={i * 21} y1={YSOL + 6} x2={i * 21 - 12} y2={YSOL + 24} stroke="#78716c" strokeWidth="1.2" opacity="0.45"/>)}
        {/* règle des altitudes */}
        <g>
          <line x1={RX} y1={YSOL} x2={RX} y2={YSOL - 1.25 * S} stroke="#64748b" strokeWidth="1.5"/>
          {ruleur.map(z => <g key={z}><line x1={RX - 6} y1={YSOL - z * S} x2={RX + 6} y2={YSOL - z * S} stroke="#64748b" strokeWidth="1.5"/>{z % 0.5 === 0 && z > 0 && <text x={RX - 10} y={YSOL - z * S + 5} textAnchor="end" fontSize={15 * F} fill="#475569">{nbf(z, 1)} m</text>}</g>)}
        </g>
        {/* rampe */}
        <polygon points={`${xPied},${YSOL} ${xTop},${yTop} ${xTop},${YSOL}`} fill="url(#flx-rampe)" stroke="#64748b" strokeWidth="1.5" filter="url(#flx-ombre)"/>
        <line x1={xPied} y1={YSOL} x2={xTop} y2={yTop} stroke="#334155" strokeWidth="5" strokeLinecap="round"/>
        {rugosite.map(([x, y], i) => <path key={i} d={`M ${x.toFixed(1)} ${y.toFixed(1)} l ${(-sn * (6 + 10 * p.f * 8) + cs * 3).toFixed(1)} ${(-cs * (6 + 10 * p.f * 8) - sn * 3).toFixed(1)}`} stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" opacity="0.85"/>)}
        <line x1={xPied - 6} y1={yTop} x2={xTop + 30} y2={yTop} stroke={COL.Em} strokeWidth="1.5" strokeDasharray="6 5" opacity="0.8"/>
        <line x1={xTop + 22} y1={yTop} x2={xTop + 22} y2={YSOL} stroke={COL.Em} strokeWidth="2"/>
        <text x={xTop + 30} y={(yTop + YSOL) / 2 + 5} fontSize={17 * F} fontWeight="700" fill={COL.Em}>h = {nbf(p.h, 2)} m</text>
        <path d={`M ${xPied + 46} ${YSOL} A 46 46 0 0 0 ${xPied + 46 * cs} ${YSOL - 46 * sn}`} fill="none" stroke={COL.Epp} strokeWidth="2.5"/>
        <text x={xPied + 56} y={YSOL - 8} fontSize={17 * F} fontWeight="700" fill={COL.Epp}>{p.deg}°</text>
        {tr.issue !== 'sommet' && hautMax && fin && <g><line x1={xPied - 6} y1={YSOL - tr.hMax * S} x2={xPied + tr.hMax / Math.tan(rad(p.deg)) * S + 40} y2={YSOL - tr.hMax * S} stroke="#dc2626" strokeWidth="2" strokeDasharray="4 4"/><text x={xPied + tr.hMax / Math.tan(rad(p.deg)) * S + 46} y={YSOL - tr.hMax * S + 5} fontSize={16 * F} fontWeight="700" fill="#dc2626">z max = {nbf(tr.hMax, 2)} m</text></g>}
        {/* ressort et butée */}
        <rect x="6" y={YSOL - 38} width="9" height="38" rx="2" fill="#475569"/>
        <polyline points={zig.join(' ')} fill="none" stroke="url(#flx-ressort)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round"/>
        <rect x={pl - 2} y={YSOL - 2 * r - 6} width="6" height={2 * r + 6} rx="2" fill="#334155"/>
        {/* traînée */}
        {traine.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={2 + 2.5 * i / Math.max(traine.length, 1)} fill={COL.Ec} opacity={0.12 + 0.5 * i / Math.max(traine.length, 1)}/>)}
        {/* ombre */}
        <ellipse cx={px(q.x)} cy={YSOL + 4} rx={r * (1 + 0.15 * q.z)} ry="4" fill="#0f172a" opacity={ombre} style={{ display: q.ph === 'B' || q.ph === 'C' ? 'none' : undefined }}/>
        {/* vitesse */}
        {vecteur && lv > 8 && <line x1={b.x} y1={b.y} x2={b.x + lv * Math.cos(ang)} y2={b.y + lv * Math.sin(ang)} stroke={COL.v} strokeWidth="4" strokeLinecap="round" markerEnd="url(#flx-pointe)"/>}
        {/* bille */}
        <circle cx={b.x} cy={b.y} r={r} fill="url(#flx-bille)" stroke="#b45309" strokeWidth="2.5" filter="url(#flx-ombre)" pointerEvents="none"/>
        <circle cx={b.x + 0.55 * r * Math.cos(q.x * S / r)} cy={b.y + 0.55 * r * Math.sin(q.x * S / r)} r={r * 0.17} fill="#92400e" opacity="0.8" pointerEvents="none"/>
        {/* poignée de tir : la bille elle-même au départ, sinon sa position de départ en transparence */}
        <g className="flx-poignee" role="slider" tabIndex={0} aria-label="Bille : tirer vers la gauche pour régler la vitesse d’éjection" aria-valuemin={0} aria-valuemax={V_MAX} aria-valuenow={p.v0} aria-valuetext={`${nbf(p.v0, 1)} mètres par seconde`}
          onPointerDown={debut('bille')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier('bille')}>
          <circle cx={b0.x} cy={b0.y} r={r + 16} fill="transparent"/>
          <circle className="flx-anneau" cx={b0.x} cy={b0.y} r={r + 3} fill="none" stroke="transparent"/>
          {t > 0 && <circle cx={b0.x} cy={b0.y} r={r} fill="#fde68a" fillOpacity="0.35" stroke="#b45309" strokeWidth="2" strokeDasharray="5 4"/>}
        </g>
        {tourne && <g className="flx-tire" pointerEvents="none"><path d={`M ${b0.x - r - 12} ${b0.y} l -26 0 m 9 -8 l -9 8 l 9 8`} fill="none" stroke="#0369a1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/><text x={b0.x - r - 14} y={b0.y - 16} textAnchor="end" fontSize={16 * F} fontWeight="700" fill="#0369a1" stroke="#fff" strokeWidth="4" paintOrder="stroke">tire</text></g>}
        {/* poignée du haut de la rampe */}
        <g className="flx-poignee" role="slider" tabIndex={0} aria-label="Haut de la rampe : hauteur" aria-valuemin={0.2} aria-valuemax={1.4} aria-valuenow={p.h} aria-valuetext={`${nbf(p.h, 2)} mètre`} onPointerDown={debut('rampe')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier('rampe')}>
          <circle cx={xTop} cy={yTop} r="26" fill="transparent"/>
          {!aTouche && <circle className="flx-pulse" cx={xTop} cy={yTop} r="14" fill="none" stroke={COL.Epp} strokeWidth="3"/>}
          <circle className="flx-anneau" cx={xTop} cy={yTop} r="12" fill="#fff7ed" stroke={COL.Epp} strokeWidth="3.5" filter="url(#flx-ombre)"/>
          <path d={`M ${xTop} ${yTop - 6} v 12 M ${xTop - 4} ${yTop - 2} l 4 -4 l 4 4 M ${xTop - 4} ${yTop + 2} l 4 4 l 4 -4`} fill="none" stroke={COL.Epp} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        {/* barres d'énergie */}
        {!etroit && <g transform="translate(14 6)">
          <rect width="190" height="180" rx="14" fill="white" opacity="0.9" stroke="#cbd5e1"/>
          <text x="95" y="22" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.ink}>Énergies (J)</text>
          {[['Ec', q.Ec, COL.Ec], ['Epp', q.Epp, COL.Epp], ['Em', q.Em, COL.Em]].map(([n, v, c], i) => {
            const x = 22 + i * 56, hv = hh(v);
            return (<g key={n}>
              <rect x={x} y={40} width="34" height={hb} rx="5" fill="#f1f5f9"/>
              <rect x={x} y={40 + hb - hv} width="34" height={hv} rx="5" fill={c}/>
              {n === 'Em' && <rect x={x - 2} y={40 + hb - hh(tr.E0)} width="38" height={hh(tr.E0)} rx="6" fill="none" stroke={c} strokeWidth="1.5" strokeDasharray="4 3"/>}
              <text x={x + 17} y={40 + hb - hv - 6} textAnchor="middle" fontSize="14" fontWeight="700" fill={c} stroke="#fff" strokeWidth="3" paintOrder="stroke">{nbf(v, v < 0.1 ? 3 : 2)}</text>
              <text x={x + 17} y="172" textAnchor="middle" fontSize="17" fontWeight="700" fill={c}>{n}</text>
            </g>);
          })}
        </g>}
      </svg>


      {etroit && <div style={{ ...styleBoite, marginTop: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Énergies de la bille</div>
        {[['Ec', q.Ec, COL.Ec], ['Epp', q.Epp, COL.Epp], ['Em', q.Em, COL.Em]].map(([n, v, c]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ width: 34, fontWeight: 700, color: c, fontSize: 15 }}>{n}</span>
            <span style={{ flex: 1, height: 16, borderRadius: 8, background: '#f1f5f9', overflow: 'hidden', position: 'relative' }}>
              <span style={{ display: 'block', height: '100%', width: `${Math.max(Math.min(v / Emax, 1), 0) * 100}%`, background: c, borderRadius: 8 }}/>
              {n === 'Em' && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(tr.E0 / Emax, 1) * 100}%`, border: `1.5px dashed ${c}`, borderRadius: 8, boxSizing: 'border-box' }}/>}
            </span>
            <span style={{ width: 66, textAlign: 'right', fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 700, color: c }}>{J(v)}</span>
          </div>))}
      </div>}

      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: fin ? 700 : 400, color: fin ? (tr.issue === 'sommet' ? '#15803d' : '#b91c1c') : KIT.txt2 }}>{message}</div>

      <div className="flx-ctrl" style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {joue
            ? <button type="button" onClick={() => setJoue(false)} style={styleBouton(true, '#475569')}>⏸ Pause</button>
            : <button type="button" onClick={demarrer} disabled={p.v0 <= 0} style={styleBouton(true, '#0369a1')}>{fin ? '↻ Rejouer' : '▶ Tirer'}</button>}
        </div>
        <label style={{ display: 'block', minWidth: 0 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Instant : {nbf(t, 2)} s</span>
          <input type="range" min={0} max={Math.max(tr.tFin, 0.01)} step={1 / 60} value={Math.min(t, tr.tFin)} aria-label="Instant du mouvement"
            onChange={ev => { setJoue(false); setT(Number(ev.target.value)); setATouche(true); }} style={{ width: '100%', minHeight: 32 }}/>
        </label>
        <Seg label="Vitesse de lecture" valeur={vit} onChange={setVit} options={[[1, '×1'], [0.5, '×½'], [0.25, '×¼']]}/>
        <Seg label="Masse" valeur={p.m} onChange={v => regler({ m: v })} options={[[0.05, '50 g'], [0.08, '80 g'], [0.15, '150 g']]}/>
      </div>
      <div className="flx-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <Seg label="Frottement sur la rampe" valeur={p.f} onChange={v => regler({ f: v })} options={[[0, 'aucun'], [0.03, 'faible'], [0.08, 'fort']]}/>
      </div>

      <div className="flx-chips" style={{ maxWidth: 920, margin: '10px auto 0' }}>
        {[['Instant', `${nbf(t, 2)}${NB}s`, KIT.txt], ['Altitude z', `${nbf(q.z, 2)}${NB}m`, KIT.txt], ['Vitesse v', `${nbf(q.v, 2)}${NB}m/s`, COL.v], ['Ec', J(q.Ec), COL.Ec], ['Epp', J(q.Epp), COL.Epp], ['Em', J(q.Em), COL.Em]].map(([n, v, c]) => (
          <div key={n} style={{ ...styleBoite, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>{n}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
          </div>))}
      </div>


      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Les énergies au cours du temps</div>
        <svg viewBox="0 0 700 210" style={{ width: '100%', display: 'block' }} role="img" aria-label="Graphique : énergie cinétique, potentielle et mécanique de la bille en fonction du temps ; il se trace pendant le mouvement.">
          <rect x="56" y="12" width="628" height="156" rx="6" fill="#fafcff" stroke="#e2e8f0"/>
          {[0, 0.5, 1].map(g => <g key={g}><line x1="56" x2="684" y1={168 - g * 150 / 1.0} y2={168 - g * 150 / 1.0} stroke="#e2e8f0"/></g>)}
          {[['Ec', COL.Ec], ['Epp', COL.Epp], ['Em', COL.Em]].map(([n, c]) => {
            const pts = []; const pasG = 3, fin2 = Math.min(Math.round(t * FPS), tr.frames.length - 1);
            for (let i = 0; i <= fin2; i += pasG) { const f = tr.frames[i]; pts.push(`${(56 + 628 * f.t / Math.max(tr.tFin, 0.01)).toFixed(1)},${(168 - Math.min(f[n] / Emax, 1) * 150).toFixed(1)}`); }
            return <polyline key={n} points={pts.join(' ')} fill="none" stroke={c} strokeWidth={n === 'Em' ? 3.5 : 3} strokeLinejoin="round" strokeDasharray={n === 'Em' ? '9 5' : undefined}/>;
          })}
          <line x1={56 + 628 * Math.min(t / Math.max(tr.tFin, 0.01), 1)} x2={56 + 628 * Math.min(t / Math.max(tr.tFin, 0.01), 1)} y1="12" y2="168" stroke="#94a3b8" strokeWidth="1.5"/>
          <text x="370" y="204" textAnchor="middle" fontSize={15 * (etroit ? 1.35 : 1)} fill="#475569">temps (s) · durée du tir : {nbf(tr.tFin, 1)} s</text>
          <text x="50" y="22" textAnchor="end" fontSize={15 * (etroit ? 1.35 : 1)} fill="#475569">{nbf(Emax, 1)} J</text><text x="50" y="172" textAnchor="end" fontSize={15 * (etroit ? 1.35 : 1)} fill="#475569">0</text>
          {[['Ec', COL.Ec, 470], ['Epp', COL.Epp, 540], ['Em', COL.Em, 620]].map(([n, c, x]) => <g key={n}><line x1={x} x2={x + 22} y1="30" y2="30" stroke={c} strokeWidth="4"/><text x={x + 27} y="35" fontSize={15 * (etroit ? 1.35 : 1)} fontWeight="700" fill={c}>{n}</text></g>)}
        </svg>
      </div>

      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre={`Réglages précis : v0 = ${nbf(p.v0, 1)} m/s · h = ${nbf(p.h, 2)} m · α = ${p.deg}°`} ouvert={ouv} onBascule={() => setOuv(o => !o)}>
          <Curseur nom="Vitesse d’éjection v0" valeur={p.v0} onChange={v => regler({ v0: Number(v.toFixed(1)) })} min={0} max={V_MAX} pas={0.1} unite="m/s" decimales={1} couleur={COL.Ec}/>
          <Curseur nom="Hauteur du haut de la rampe h" valeur={p.h} onChange={v => { let deg = p.deg; while (v / Math.tan(rad(deg)) > 2.9 && deg < 60) deg += 5; regler({ h: Number(v.toFixed(2)), deg }); }} min={0.2} max={1.4} pas={0.05} unite="m" decimales={2} couleur={COL.Em}/>
          <Curseur nom="Angle de la rampe α" valeur={p.deg} onChange={v => { let deg = Math.round(v / 5) * 5; while (p.h / Math.tan(rad(deg)) > 2.9 && deg < 60) deg += 5; regler({ deg }); }} min={15} max={60} pas={5} unite="°" decimales={0} couleur={COL.Epp}/>
          <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Mêmes réglages qu’avec la souris, pour le clavier. Recul du ressort : {nbf(recul(p.v0) * 100, 0)} cm. Pesanteur : g = {nbf(G, 1)} N/kg.</div>
        </Section>
      </div>
    </div>);
}
