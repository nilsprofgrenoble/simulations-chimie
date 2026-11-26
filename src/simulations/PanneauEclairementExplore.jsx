import { useRef, useState } from "react";
import { KIT, styleBoite } from "../commun";
import { NB } from "./Distillation";
import { nbf, Seg, useEtroit, coordSvg, StyleAnim } from "./exploAnim";
import * as M from "./panneauEclairementModele";
import { useHorloge } from "./PanneauSceneAnim";

// ====================================================
//  Exploration animée de la simulation 229 (éclairement et distance à la source).
//  Pièce sombre : la lampe envoie sa lumière dans un cône dont l'intensité s'affaiblit avec la distance ;
//  on tire le panneau (ou le point de la courbe) pour changer d ; un panneau fantôme à 2 d montre que E est divisée par 4.
//  Tout vient de panneauEclairementModele.js.
// ====================================================
const C = { E: '#b45309', d: '#0369a1', P: '#dc2626', ink: '#0f172a' };
const wm = v => `${nbf(v, v >= 100 ? 0 : v >= 10 ? 1 : 2)}${NB}W/m²`;
const mW = v => `${nbf(v * 1000, v * 1000 >= 100 ? 0 : v * 1000 >= 10 ? 1 : 2)}${NB}mW`;

export function PanneauEclairementExplore({ ti, setTi }) {
  const boite = useRef(null), svgRef = useRef(null), drag = useRef(null);
  const etroit = useEtroit(boite);
  const anim = useHorloge();
  const [touche, setTouche] = useState(false);
  const W = etroit ? 340 : 700, { phi, d, S } = ti;
  const E = M.eclairement(phi, d), Plum = E * S / 1e4, Pel = Plum * M.ETA_EXPLO;
  const Emax = M.eclairement(phi, M.D_MIN);
  // scène
  const x0 = 50, xd = dd => x0 + (W - x0 - 36) * dd / M.D_MAX, yC = 98;
  const demi = x => 12 + (x - x0) * (etroit ? 0.19 : 0.1);
  const hPan = 20 + S * 0.38;                                     // hauteur du panneau dessiné ∝ √S (S en cm²) : approximation visuelle
  const hP = 10 + Math.sqrt(S) * 3, hG = Math.min(2 * hP, 62);
  void hPan;
  const lumE = Math.min(1, E / 700);
  // graphe
  const GY0 = 240, GH = 140, GXo = 56, GWd = W - GXo - 22;
  const gx = dd => GXo + GWd * (dd - M.D_MIN) / (M.D_MAX - M.D_MIN), gy = e => GY0 + GH - GH * Math.min(e / (Emax * 1.05), 1);
  const regler = ch => setTi(s => ({ ...s, ...ch }));
  const placer = dd => { const v = Math.round(Math.min(Math.max(dd, M.D_MIN), M.D_MAX) * 20) / 20; if (v !== d) regler({ d: v }); };
  const debutScene = ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = 's'; setTouche(true); bouge(ev); };
  const debutGraphe = ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = 'g'; setTouche(true); bouge(ev); };
  const bouge = ev => {
    if (!drag.current) return;
    const { X } = coordSvg(svgRef.current, ev);
    placer(drag.current === 's' ? (X - x0) / (W - x0 - 36) * M.D_MAX : M.D_MIN + (X - GXo) / GWd * (M.D_MAX - M.D_MIN));
  };
  const fait = ev => { drag.current = null; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const clavier = ev => {
    const s = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : 0; if (!s) return;
    ev.preventDefault(); placer(d + s * 0.05);
  };

  const bandes = Array.from({ length: 44 }, (_, k) => { const a = x0 + (W - x0 - 36) * k / 44, b = x0 + (W - x0 - 36) * (k + 1) / 44, dm = ((a + b) / 2 - x0) / (W - x0 - 36) * M.D_MAX + 0.12; return { a, b, o: Math.min(0.85, 0.1 + 0.9 * (0.2 / dm) ** 2 * lumPhi(phi)) }; });
  function lumPhi(f) { return f / 300 * 0.55; }
  const ghost = 2 * d <= M.D_MAX + 1e-9;
  const message = !touche ? 'Tire le panneau vers la lampe ou loin d’elle : l’éclairement change. Regarde le panneau fantôme à 2 d.'
    : `À d = ${nbf(d, 2)} m : E = Φ ÷ (4π d²) = ${wm(E)}.${ghost ? ` À 2 d, E serait ${wm(E / 4)} : quatre fois plus petit.` : ' À 2 d (hors de la règle), E serait divisé par 4.'}`;

  return (
    <div ref={boite}>
      <StyleAnim/>
      <svg ref={svgRef} className="xa-svg" viewBox={etroit ? '0 0 340 430' : '0 0 700 430'} role="img"
        aria-label={`Scène animée : une lampe de ${phi} watts éclaire un panneau de ${nbf(S, 1)} centimètres carrés placé à ${nbf(d, 2)} mètre ; éclairement ${wm(E)}, lumière reçue ${mW(Plum)}.`}>
        <defs>
          <linearGradient id="pee-nuit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0f172a"/><stop offset="1" stopColor="#1e293b"/></linearGradient>
          <radialGradient id="pee-bulbe" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ffffff"/><stop offset="0.5" stopColor="#fde047"/><stop offset="1" stopColor="#f59e0b"/></radialGradient>
          <filter id="pee-ombre" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000" floodOpacity="0.4"/></filter>
        </defs>
        <rect width="700" height="500" fill="#f8fafc"/>
        <rect x="0" y="0" width={W} height="206" rx="14" fill="url(#pee-nuit)"/>
        {/* cône de lumière : intensité ∝ 1/d² */}
        {bandes.map((b, k) => <polygon key={k} points={`${b.a},${yC - demi(b.a)} ${b.b + 0.6},${yC - demi(b.b)} ${b.b + 0.6},${yC + demi(b.b)} ${b.a},${yC + demi(b.a)}`} fill="#fde047" opacity={b.o}/>)}
        {[-0.7, -0.35, 0, 0.35, 0.7].map((f, k) => <line key={k} x1={x0} y1={yC} x2={W - 36} y2={yC + f * demi(W - 36)} stroke="#fff" strokeWidth="1.6" strokeDasharray="6 10" strokeDashoffset={-anim * 60} opacity="0.55"/>)}
        {/* règle de distance */}
        <line x1={xd(0)} y1="186" x2={xd(M.D_MAX)} y2="186" stroke="#94a3b8" strokeWidth="2"/>
        {[0, 0.5, 1, 1.5].map(v => <g key={v}><line x1={xd(v)} y1="181" x2={xd(v)} y2="191" stroke="#94a3b8" strokeWidth="2"/><text x={xd(v)} y="203" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#cbd5e1">{v === 0 ? '0' : `${nbf(v, 1)} m`}</text></g>)}
        {/* lampe */}
        <circle cx={x0} cy={yC} r="34" fill="#fde047" opacity="0.3"/>
        <circle cx={x0} cy={yC} r="18" fill="url(#pee-bulbe)" stroke="#a16207" strokeWidth="2.5" filter="url(#pee-ombre)"/>
        <text x={x0} y="40" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fde047">Φ = {phi}{NB}W</text>
        {/* panneau fantôme à 2 d */}
        {ghost && <g><rect x={xd(2 * d) - 5} y={yC - hG} width="10" height={2 * hG} rx="2" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="5 4"/>
          <text x={xd(2 * d)} y={yC - hG - 8} textAnchor="middle" fontSize="13" fontWeight="800" fill="#e2e8f0">2 d : E ÷ 4</text></g>}
        {/* panneau (poignée) */}
        <rect x={x0 - 6} y={yC - 60} width={W - x0 - 20} height="120" fill="transparent" style={{ cursor: 'pointer', touchAction: 'none' }} onPointerDown={debutScene} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait}/>
        <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Distance du panneau à la lampe" aria-valuemin={M.D_MIN} aria-valuemax={M.D_MAX} aria-valuenow={d} aria-valuetext={`${nbf(d, 2)} mètre`}
          onPointerDown={debutScene} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier}>
          <rect x={xd(d) - 26} y={yC - hP - 10} width="52" height={2 * hP + 20} fill="transparent"/>
          {!touche && <rect className="xa-pulse" x={xd(d) - 11} y={yC - hP - 5} width="22" height={2 * hP + 10} rx="5" fill="none" stroke="#fde047" strokeWidth="3"/>}
          <rect className="xa-anneau" x={xd(d) - 6} y={yC - hP} width="12" height={2 * hP} rx="3" fill={`rgb(${Math.round(60 + 190 * lumE)},${Math.round(90 + 150 * lumE)},${Math.round(130 - 60 * lumE)})`} stroke="#e2e8f0" strokeWidth="3" filter="url(#pee-ombre)"/>
          <text x={Math.min(Math.max(xd(d), 62), W - 62)} y={yC - hP - 10} textAnchor="middle" fontSize="14" fontWeight="800" fill="#fde047" stroke="#0f172a" strokeWidth="4" paintOrder="stroke">E = {wm(E)}</text>
        </g>
        <line x1={x0} y1="176" x2={xd(d)} y2="176" stroke="#38bdf8" strokeWidth="3"/>
        <text x={(x0 + xd(d)) / 2} y="168" textAnchor="middle" fontSize="14" fontWeight="800" fill="#7dd3fc" stroke="#0f172a" strokeWidth="4" paintOrder="stroke">d = {nbf(d, 2)}{NB}m</text>

        {/* graphe E(d) */}
        <rect x="0" y="212" width={W} height="188" rx="14" fill="#fff" stroke="#cbd5e1" transform={etroit ? 'translate(0 10) ' : undefined} display="none"/>
        <text x={GXo - 4} y={GY0 - 12} fontSize="13" fontWeight="800" fill={C.E}>Éclairement E (W/m²)</text>
        {[0, 0.5, 1].map(f => <g key={f}><line x1={GXo} x2={GXo + GWd} y1={gy(f * Emax)} y2={gy(f * Emax)} stroke="#e2e8f0"/><text x={GXo - 6} y={gy(f * Emax) + 4} textAnchor="end" fontSize="12" fill="#475569">{nbf(f * Emax, 0)}</text></g>)}
        {[0.2, 0.5, 1, 1.5].map(v => <text key={v} x={gx(v)} y={GY0 + GH + 16} textAnchor="middle" fontSize="12" fill="#475569">{nbf(v, v === 0.2 ? 1 : v % 1 ? 1 : 0)}</text>)}
        <line x1={GXo} x2={GXo} y1={GY0} y2={GY0 + GH} stroke="#334155" strokeWidth="2"/><line x1={GXo} x2={GXo + GWd} y1={GY0 + GH} y2={GY0 + GH} stroke="#334155" strokeWidth="2"/>
        <text x={GXo + GWd} y={GY0 + GH + 34} textAnchor="end" fontSize="13" fontWeight="800" fill={C.d}>distance d (m)</text>
        <polyline points={Array.from({ length: 66 }, (_, k) => { const dd = M.D_MIN + (M.D_MAX - M.D_MIN) * k / 65; return `${gx(dd).toFixed(1)},${gy(M.eclairement(phi, dd)).toFixed(1)}`; }).join(' ')} fill="none" stroke={C.E} strokeWidth="4" strokeLinejoin="round"/>
        {ghost && <g pointerEvents="none"><line x1={gx(2 * d)} x2={gx(2 * d)} y1={gy(E / 4)} y2={GY0 + GH} stroke="#94a3b8" strokeDasharray="4 4"/><circle cx={gx(2 * d)} cy={gy(E / 4)} r="6" fill="#fff" stroke="#64748b" strokeWidth="2.5"/></g>}
        <line x1={gx(d)} x2={gx(d)} y1={gy(E)} y2={GY0 + GH} stroke={C.d} strokeDasharray="4 4"/><line x1={GXo} x2={gx(d)} y1={gy(E)} y2={gy(E)} stroke={C.d} strokeDasharray="4 4"/>
        <rect x={GXo - 6} y={GY0 - 8} width={GWd + 12} height={GH + 16} fill="transparent" style={{ cursor: 'pointer', touchAction: 'none' }} onPointerDown={debutGraphe} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait}/>
        <g pointerEvents="none"><circle cx={gx(d)} cy={gy(E)} r="10" fill="#fff" stroke={C.P} strokeWidth="3.5"/><circle cx={gx(d)} cy={gy(E)} r="3.5" fill={C.P}/></g>
      </svg>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: touche ? 700 : 400, color: KIT.txt2 }}>{message}</div>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Flux de la lampe Φ" valeur={phi} onChange={v => regler({ phi: v })} options={M.FLUX_LISTE.map(v => [v, `${v} W`])}/>
        <Seg label="Surface du panneau S" valeur={S} onChange={v => regler({ S: v })} options={M.SURFACES_CM2.map(v => [v, `${nbf(v, v % 1 ? 1 : 0)} cm²`])}/>
      </div>
      <div className="xa-chips" style={{ maxWidth: 920, margin: '10px auto 0', '--n': 4 }}>
        {[['Éclairement E', wm(E), C.E], ['Lumière reçue E × S', mW(Plum), C.d], ['Électricité (η = 15 %)', mW(Pel), '#15803d'], ['E à 2 d', wm(E / 4), '#64748b']].map(([n, v, c]) => (
          <div key={n} style={{ ...styleBoite, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>{n}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
          </div>))}
      </div>
    </div>);
}
