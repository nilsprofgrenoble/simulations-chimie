import { useRef, useState } from "react";
import { KIT, styleBoite } from "../commun";
import { NB } from "./Distillation";
import { nbf, Seg, useEtroit, coordSvg, StyleAnim } from "./exploAnim";
import * as M from "./laserModele";
import { useHorloge } from "./PanneauSceneAnim";

// ====================================================
//  Exploration animée de la simulation 230 (laser : éclairement, énergie reçue, sécurité).
//  Un faisceau part du laser et s'élargit avec la divergence (dessin NON à l'échelle) ; on tire l'œil le long du faisceau (distance L) :
//  l'éclairement E = φ ÷ S est comparé à la limite de la simulation sur une jauge logarithmique, l'œil devient rouge au-dessus.
//  Tout vient de laserModele.js (norme inventée pour la simulation, annoncée dans les hypothèses).
// ====================================================
const C = { E: '#b45309', ok: '#15803d', mal: '#dc2626', ink: '#0f172a', d: '#0369a1' };
const gd = v => (v >= 1000 ? `${nbf(v / 1000, v >= 1e5 ? 0 : 1)}${NB}kW/m²` : `${nbf(v, v >= 100 ? 0 : 1)}${NB}W/m²`);

export function LaserExplore({ ti, setTi }) {
  const boite = useRef(null), svgRef = useRef(null), drag = useRef(false);
  const etroit = useEtroit(boite);
  const anim = useHorloge();
  const [touche, setTouche] = useState(false);
  const W = etroit ? 340 : 700, phi = ti.mw / 1000;
  const D = M.diametre(ti.D, ti.th, ti.L), E = M.eclairement(phi, D), S = M.sectionMm2(D);
  const H = E * ti.ms / 1000, sur = ti.ms > 250 ? E > M.E_MAX : H > M.H_MAX;
  const regler = ch => setTi(s => ({ ...s, ...ch }));
  const x0 = 124, xe = L => x0 + (W - x0 - 48) * L / 20, yC = 104;
  const demi = Lm => Math.min(5 + M.diametre(ti.D, ti.th, Lm) * 2.6, 84);
  const poly = `${x0},${yC - demi(0)} ${xe(ti.L)},${yC - demi(ti.L)} ${xe(ti.L)},${yC + demi(ti.L)} ${x0},${yC + demi(0)}`;
  const op = Math.min(0.85, 0.25 + 0.1 * Math.max(Math.log10(Math.max(E, 1)), 0));
  // jauge logarithmique 1 .. 10^6 W/m²
  const GX = 24, GW = W - 48, gy = 276;
  const pos = e => GX + GW * Math.min(Math.max(Math.log10(Math.max(e, 1)), 0), 6) / 6;
  const debut = ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = true; setTouche(true); bouge(ev); };
  const bouge = ev => {
    if (!drag.current) return;
    const { X } = coordSvg(svgRef.current, ev);
    const v = Math.round(Math.min(Math.max((X - x0) / (W - x0 - 48) * 20, 0), 20) * 2) / 2;
    if (v !== ti.L) regler({ L: v });
  };
  const fait = ev => { drag.current = false; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const clavier = ev => {
    const s = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : 0; if (!s) return;
    ev.preventDefault(); regler({ L: Math.min(Math.max(ti.L + s * 0.5, 0), 20) });
  };
  const tms = ti.ms >= 1000 ? `${ti.ms / 1000} s` : `${ti.ms} ms`;
  const message = !touche ? 'Tire l’œil le long du faisceau : plus loin, le faisceau s’élargit (divergence), la section grandit et l’éclairement diminue. Change le flux ou le diamètre.'
    : sur ? `Danger : pour ${tms}, E = ${gd(E)} dépasse la limite de la simulation (${ti.ms > 250 ? '10 W/m²' : `exposition H = E × t = ${nbf(H, 2)} J/m² > 2,5 J/m²`}).`
      : `Sous la limite : E = ${gd(E)} pour ${tms}.`;
  const nPh = 14;

  return (
    <div ref={boite}>
      <StyleAnim/>
      <svg ref={svgRef} className="xa-svg" viewBox={`0 0 ${W} 340`} role="img"
        aria-label={`Scène animée : un laser de ${ti.mw} milliwatts, faisceau de ${nbf(D, 2)} millimètre à ${nbf(ti.L, 1)} mètre ; éclairement ${gd(E)} ; ${sur ? 'au-dessus' : 'sous'} la limite de sécurité.`}>
        <defs>
          <linearGradient id="lax-fond" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0f172a"/><stop offset="1" stopColor="#1e293b"/></linearGradient>
          <filter id="lax-ombre" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000" floodOpacity="0.45"/></filter>
        </defs>
        <rect width={W} height="340" fill="#f8fafc"/>
        <rect x="0" y="0" width={W} height="214" rx="14" fill="url(#lax-fond)"/>
        {/* faisceau */}
        <polygon points={poly} fill="#ef4444" opacity={op * 0.55}/>
        <polygon points={poly} fill="none" stroke="#fca5a5" strokeWidth="1.5" opacity="0.8"/>
        <line x1={x0} y1={yC} x2={xe(ti.L)} y2={yC} stroke="#fecaca" strokeWidth="2.5" strokeDasharray="12 14" strokeDashoffset={-anim * 90}/>
        {Array.from({ length: nPh }, (_, k) => { const s = (anim * 0.7 + k / nPh) % 1, x = x0 + (xe(ti.L) - x0) * s; return <circle key={k} cx={x} cy={yC + Math.sin(k * 5.3) * demi(ti.L * s) * 0.7} r="2.4" fill="#fff" opacity="0.9"/>; })}
        {/* laser */}
        <g filter="url(#lax-ombre)"><rect x="14" y={yC - 20} width="82" height="40" rx="8" fill="#475569" stroke="#cbd5e1" strokeWidth="2.5"/><rect x="82" y={yC - 7} width="16" height="14" rx="3" fill="#ef4444"/></g>
        <text x="55" y={yC + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff">{ti.mw}{NB}mW</text>
        <text x="55" y={yC - 30} textAnchor="middle" fontSize="14" fontWeight="800" fill="#fca5a5">Laser</text>
        {/* règle */}
        <line x1={xe(0)} y1="192" x2={xe(20)} y2="192" stroke="#94a3b8" strokeWidth="2"/>
        {[0, 5, 10, 15, 20].map(v => <g key={v}><line x1={xe(v)} y1="187" x2={xe(v)} y2="197" stroke="#94a3b8" strokeWidth="2"/><text x={xe(v)} y="210" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#cbd5e1">{v === 20 ? '20 m' : v}</text></g>)}
        <text x={Math.min(Math.max(xe(ti.L), 96), W - 96)} y="26" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fde68a" stroke="#0f172a" strokeWidth="4" paintOrder="stroke">L = {nbf(ti.L, 1)}{NB}m · D = {nbf(D, 1)}{NB}mm</text>
        {/* œil : poignée */}
        <rect className="xa-poignee" x={x0 - 10} y={yC - 62} width={W - x0 - 20} height="124" fill="transparent" style={{ cursor: 'pointer', touchAction: 'none' }} onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait}/>
        <g className="xa-poignee" data-poignee="1" role="slider" tabIndex={0} style={{ touchAction: 'none', cursor: 'grab' }} aria-label="Distance de l'œil au laser" aria-valuemin={0} aria-valuemax={20} aria-valuenow={ti.L} aria-valuetext={`${nbf(ti.L, 1)} mètre`}
          onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier}>
          <rect x={xe(ti.L) - 34} y={yC - 52} width="68" height="104" fill="transparent" style={{ touchAction: 'none' }}/>
          <circle cx={xe(ti.L)} cy={yC} r={sur ? 36 : 30} fill={sur ? '#dc2626' : '#16a34a'} opacity="0.3"/>
          {!touche && <circle className="xa-pulse" cx={xe(ti.L)} cy={yC} r="30" fill="none" stroke="#fde047" strokeWidth="3"/>}
          <g className="xa-anneau" filter="url(#lax-ombre)"><ellipse cx={xe(ti.L)} cy={yC} rx="22" ry="15" fill="#fff" stroke={sur ? '#dc2626' : '#16a34a'} strokeWidth="3.5"/>
            <circle cx={xe(ti.L) - 3} cy={yC} r="8.5" fill="#0369a1"/><circle cx={xe(ti.L) - 3} cy={yC} r="4" fill="#0f172a"/></g>
        </g>
        {/* jauge logarithmique de l'éclairement */}
        <text x={GX} y={gy - 44} fontSize="14" fontWeight="800" fill={C.ink}>{etroit ? 'Éclairement E (échelle log)' : 'Éclairement E reçu par l’œil (échelle logarithmique)'}</text>
        <rect x={GX} y={gy - 14} width={GW / 6} height="22" fill="#86efac"/><rect x={GX + GW / 6} y={gy - 14} width={GW * 5 / 6} height="22" fill="#fca5a5"/>
        <rect x={GX} y={gy - 14} width={GW} height="22" fill="none" stroke="#475569" strokeWidth="2"/>
        {[0, 1, 2, 3, 4, 5, 6].map(k => <g key={k}><line x1={GX + GW * k / 6} x2={GX + GW * k / 6} y1={gy + 8} y2={gy + 14} stroke="#475569" strokeWidth="2"/><text x={GX + GW * k / 6} y={gy + 28} textAnchor="middle" fontSize="12" fill="#475569">{k === 0 ? '1' : k === 6 ? '10⁶' : `10${'⁰¹²³⁴⁵⁶'[k]}`}</text></g>)}
        <text x={GX + GW / 6 + 4} y={gy + 2} fontSize="12" fontWeight="800" fill="#7f1d1d">{etroit ? '' : 'limite 10 W/m²'}</text>
        <text x={GX + 4} y={gy + 2} fontSize="12" fontWeight="800" fill="#14532d">{etroit ? '' : ''}</text>
        <g pointerEvents="none"><path d={`M ${pos(E)} ${gy - 16} l -9 -14 h 18 z`} fill={sur ? C.mal : C.ok} stroke="#0f172a" strokeWidth="1.5"/></g>
        <text x={Math.min(Math.max(pos(E), 60), W - 60)} y={gy + 50} textAnchor="middle" fontSize={etroit ? 13 : 15} fontWeight="800" fill={sur ? C.mal : C.ok}>E = {gd(E)} · {sur ? (etroit ? 'trop élevé' : 'au-dessus de la limite') : (etroit ? 'ok' : 'sous la limite')}</text>
      </svg>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: touche ? 700 : 400, color: touche && sur ? C.mal : KIT.txt2 }}>{message}</div>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Flux du laser φ" valeur={ti.mw} onChange={v => regler({ mw: v })} options={M.FLUX_LISTE_MW.map(v => [v, `${v} mW`])}/>
        <Seg label="Diamètre du faisceau au départ" valeur={ti.D} onChange={v => regler({ D: v })} options={M.D_LISTE_MM.map(v => [v, `${v} mm`])}/>
        <Seg label="Divergence θ" valeur={ti.th} onChange={v => regler({ th: v })} options={M.THETA_LISTE.map(v => [v, `${nbf(v, 1)} mrad`])}/>
        <Seg label="Durée d’exposition de l’œil" valeur={ti.ms} onChange={v => regler({ ms: v })} options={M.DUREES_MS.map(v => [v, v >= 1000 ? `${v / 1000} s` : `${v} ms`])}/>
      </div>
      <div className="xa-chips" style={{ maxWidth: 920, margin: '10px auto 0', '--n': 5 }}>
        {[['Diamètre D à L', `${nbf(D, 2)}${NB}mm`, C.d], ['Section S = π D² ÷ 4', `${nbf(S, 2)}${NB}mm²`, C.d], ['Éclairement E = φ ÷ S', gd(E), C.E], ['Énergie reçue φ × t', `${nbf(ti.mw * ti.ms / 1000, 2)}${NB}mJ`, C.E], ['Classe du laser', M.classe(phi), C.ok]].map(([n, v, c]) => (
          <div key={n} style={{ ...styleBoite, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>{n}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
          </div>))}
      </div>
    </div>);
}
