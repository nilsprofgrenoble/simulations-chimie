import { useRef, useState } from "react";
import { KIT, styleBoite } from "../commun";
import { NB } from "./Distillation";
import { nbf, Seg, useEtroit, coordSvg, StyleAnim } from "./exploAnim";
import * as RM from "./panneauRendementModele";
import { ScenePanneau, useHorloge, COLP } from "./PanneauSceneAnim";

// ====================================================
//  Exploration animée de la simulation 228 (rendement d'un panneau photovoltaïque).
//  À gauche, la même scène que la 227 ; à droite le bilan de puissance (lumière reçue = éclairement × surface,
//  puissance électrique utile, pertes) et la courbe du rendement η selon la résistance de charge,
//  sur laquelle on tire le point de fonctionnement. Tout vient de panneauRendementModele.js.
// ====================================================
const GX = 50, GW = 270, GY = 196, GH = 100;
const pct1 = v => `${nbf(v * 100, 1)}${NB}%`;
const mW = v => `${nbf(v * 1000, v * 1000 >= 100 ? 0 : v * 1000 >= 10 ? 1 : 2)}${NB}mW`;
const Wm = v => (v >= 1 ? `${nbf(v, 2)}${NB}W` : mW(v));

export function PanneauRendementExplore({ ti, setTi }) {
  const boite = useRef(null), svgRef = useRef(null), drag = useRef(false);
  const etroit = useEtroit(boite);
  const anim = useHorloge();
  const [touche, setTouche] = useState(false);
  const p = RM.PANNEAUX[ti.pan], E = ti.E, Rc = ti.R, L = RM.R_LISTE, n = L.length - 1;
  const pt = RM.point(p, E, Rc), plum = RM.plum(p, E), eta = RM.eta(p, E, Rc), etaM = RM.etaMax(p, E);
  const iR = L.indexOf(Rc), gx = i => GX + GW * i / n;
  const etaMaxAxe = Math.max(RM.etaMax(p, 1000), 0.05) * 1.15, gy = e => GY + GH - GH * Math.min(e / etaMaxAxe, 1);
  const oxG = etroit ? 0 : 350, oyG = etroit ? 352 : 0;
  const regler = ch => setTi(s => ({ ...s, ...ch }));
  const courbe = L.map((r, i) => `${gx(i).toFixed(1)},${gy(RM.eta(p, E, r)).toFixed(1)}`).join(' ');

  const debut = ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = true; setTouche(true); bouge(ev); };
  const bouge = ev => {
    if (!drag.current) return;
    const { X } = coordSvg(svgRef.current, ev);
    const i = Math.min(Math.max(Math.round((X - oxG - GX) / GW * n), 0), n);
    if (L[i] !== Rc) regler({ R: L[i] });
  };
  const fait = ev => { drag.current = false; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const clavier = ev => {
    const s = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : 0; if (!s) return;
    ev.preventDefault(); regler({ R: L[Math.min(Math.max(iR + s, 0), n)] });
  };

  const rel = etaM > 0 ? Math.abs(eta - etaM) / etaM : 1;
  const message = !touche ? 'Tire le point sur la courbe pour changer la résistance de charge, et le soleil pour changer l’éclairement : regarde la part de lumière transformée en électricité.'
    : Rc === 0 || !isFinite(Rc) ? 'Sans charge utile (court-circuit ou circuit ouvert), la puissance électrique est nulle : le rendement est nul.'
    : rel < 0.03 ? `Rendement maximal : η ≈ ${pct1(etaM)}. Le panneau est utilisé à sa puissance maximale.` : `η = P ÷ P lumineuse = ${mW(pt.P)} ÷ ${Wm(plum)} = ${pct1(eta)}. Cherche le maximum.`;

  const largeBar = 296, frU = plum > 0 ? Math.min(pt.P / plum, 1) : 0;
  const ticks = [[0, '0'], [L.indexOf(10), '10'], [L.indexOf(50), '50'], [L.indexOf(200), '200'], [n, '∞']];

  return (
    <div ref={boite}>
      <StyleAnim/>
      <svg ref={svgRef} className="xa-svg" viewBox={etroit ? '0 0 340 700' : '0 0 700 344'} role="img"
        aria-label={`Scène animée : le panneau reçoit ${Wm(plum)} de lumière et fournit ${mW(pt.P)} d’électricité, soit un rendement de ${pct1(eta)}.`}>
        <rect width="700" height="700" fill="#f8fafc"/>
        <ScenePanneau ox={0} oy={0} svgRef={svgRef} E={E} onE={v => regler({ E: v })} U={pt.U} I={pt.I} R={Rc} anim={anim} touche={touche} onTouche={() => setTouche(true)}/>
        <g transform={`translate(${oxG} ${oyG})`}>
          <rect x="4" y="4" width="334" height="336" rx="14" fill="#ffffff" stroke="#cbd5e1"/>
          <text x="170" y="26" textAnchor="middle" fontSize="15" fontWeight="800" fill={COLP.ink}>Bilan de puissance du panneau</text>
          {/* barre de lumière reçue */}
          <text x="22" y="52" fontSize="13" fontWeight="800" fill={COLP.E}>Lumière reçue = {E}{NB}W/m² × {nbf(RM.surfaceCm2(p), 1)}{NB}cm² = {Wm(plum)}</text>
          <rect x="22" y="60" width={largeBar} height="30" rx="6" fill="#fde68a" stroke="#b45309" strokeWidth="2"/>
          <rect x="22" y="60" width={Math.max(largeBar * frU, frU > 0 ? 2 : 0)} height="30" rx="6" fill="#16a34a" stroke="#14532d" strokeWidth="2"/>
          {frU < 0.2 ? <text x={22 + Math.max(largeBar * frU, 2) + 8} y="80" fontSize="13" fontWeight="800" fill="#14532d">{mW(pt.P)} utiles</text> : <text x="30" y="80" fontSize="13" fontWeight="800" fill="#fff">{mW(pt.P)} utiles</text>}
          {frU < 0.55 && <text x={22 + largeBar - 8} y="80" textAnchor="end" fontSize="13" fontWeight="800" fill="#7c2d12">pertes</text>}
          <text x="22" y="112" fontSize="13" fill="#475569">vert : électricité utile (P = U × I) · jaune : pertes</text>
          <text x="170" y="150" textAnchor="middle" fontSize="30" fontWeight="800" fill={COLP.I}>η = {pct1(eta)}</text>
          <text x="170" y="172" textAnchor="middle" fontSize="13" fill="#475569">η = P électrique ÷ P lumineuse · maximum : {pct1(etaM)}</text>
          {/* courbe η(R) */}
          <text x={GX - 2} y={GY - 8} fontSize="13" fontWeight="800" fill={COLP.I}>η (%)</text>
          <line x1={GX} x2={GX} y1={GY} y2={GY + GH} stroke="#334155" strokeWidth="2"/><line x1={GX} x2={GX + GW} y1={GY + GH} y2={GY + GH} stroke="#334155" strokeWidth="2"/>
          {[0, 0.5, 1].map(f => <g key={f}><line x1={GX} x2={GX + GW} y1={gy(f * etaMaxAxe)} y2={gy(f * etaMaxAxe)} stroke="#e2e8f0"/><text x={GX - 6} y={gy(f * etaMaxAxe) + 4} textAnchor="end" fontSize="12" fill="#475569">{nbf(f * etaMaxAxe * 100, 0)}</text></g>)}
          {ticks.map(([i, t]) => <text key={t} x={gx(i)} y={GY + GH + 16} textAnchor="middle" fontSize="12" fill="#475569">{t}</text>)}
          <text x={GX + GW} y={GY + GH + 33} textAnchor="end" fontSize="13" fontWeight="800" fill="#334155">résistance de charge R (Ω)</text>
          <line x1={GX} x2={GX + GW} y1={gy(etaM)} y2={gy(etaM)} stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="5 4"/>
          <polyline points={courbe} fill="none" stroke={COLP.I} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round"/>
          <rect x={GX - 6} y={GY - 10} width={GW + 12} height={GH + 20} fill="transparent" style={{ cursor: 'pointer', touchAction: 'none' }} onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait}/>
          <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Résistance de charge" aria-valuemin={0} aria-valuemax={n} aria-valuenow={iR} aria-valuetext={isFinite(Rc) ? `${Rc} ohms, rendement ${pct1(eta)}` : `circuit ouvert, rendement nul`}
            onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier}>
            <circle cx={gx(iR)} cy={gy(eta)} r="24" fill="transparent"/>
            {!touche && <circle className="xa-pulse" cx={gx(iR)} cy={gy(eta)} r="14" fill="none" stroke={COLP.P} strokeWidth="3"/>}
            <circle className="xa-anneau" cx={gx(iR)} cy={gy(eta)} r="10" fill="#fff" stroke={COLP.P} strokeWidth="3.5" filter="url(#pvs-ombre)"/>
            <circle cx={gx(iR)} cy={gy(eta)} r="3.5" fill={COLP.P}/>
          </g>
        </g>
      </svg>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: touche ? 700 : 400, color: touche && rel < 0.03 ? '#15803d' : KIT.txt2 }}>{message}</div>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Panneau (surface différente)" valeur={ti.pan} onChange={v => regler({ pan: v })} options={RM.IDS_PANNEAUX.map(id => [id, RM.PANNEAUX[id].nom.replace(/ \(.*\)/, '') + ` (${nbf(RM.surfaceCm2(RM.PANNEAUX[id]), 0)} cm²)`])}/>
      </div>
      <div className="xa-chips" style={{ maxWidth: 920, margin: '10px auto 0', '--n': 5 }}>
        {[['Lumière reçue', Wm(plum), COLP.E], ['Puissance P', mW(pt.P), COLP.P], ['Rendement η', pct1(eta), COLP.I], ['η maximal', pct1(etaM), '#7c3aed'], ['Éclairement', `${E}${NB}W/m²`, COLP.E]].map(([nm, v, c]) => (
          <div key={nm} style={{ ...styleBoite, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>{nm}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
          </div>))}
      </div>
    </div>);
}
