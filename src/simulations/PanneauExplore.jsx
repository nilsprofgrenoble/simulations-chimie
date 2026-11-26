import { useRef, useState } from "react";
import { KIT, styleBoite } from "../commun";
import { NB } from "./Distillation";
import { nbf, Seg, useEtroit, coordSvg, StyleAnim } from "./exploAnim";
import * as M from "./panneauPvModele";
import { ScenePanneau, useHorloge, COLP } from "./PanneauSceneAnim";

// ====================================================
//  Exploration animée de la simulation 227 (caractéristique d'un panneau photovoltaïque).
//  À gauche, la scène (soleil, photons, panneau, circuit, instruments) ; à droite la caractéristique I(U) :
//  on tire le POINT sur la courbe (ce qui change la résistance de charge R), l'aire du rectangle U × I est la puissance,
//  elle est maximale au coude. Le soleil se règle avec sa poignée. Tout vient de panneauPvModele.js.
// ====================================================
const GX = 48, GW = 276, GY = 46, GH = 224;
const nice = (max, n = 5) => { const brut = max / n; for (const s of [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200]) if (s >= brut) return s; return 500; };
const mW = v => `${nbf(v * 1000, v * 1000 >= 100 ? 0 : v * 1000 >= 10 ? 1 : 2)}${NB}mW`;

export function PanneauExplore({ ti, setTi }) {
  const boite = useRef(null), svgRef = useRef(null), drag = useRef(false);
  const etroit = useEtroit(boite);
  const anim = useHorloge();
  const [touche, setTouche] = useState(false);
  const p = M.PANNEAUX[ti.pan], E = ti.E, R = ti.R;
  const pt = M.point(p, E, R), pm = M.pointPmax(p, E), icc = M.courantCC(p, E), uco = M.tensionVide(p, E);
  const Umax = M.tensionVide(p, 1000) * 1.06, Imax = M.courantCC(p, 1000) * 1.12 * 1000;      // axes fixes pour le panneau : on voit la courbe se déplacer
  const gx = U => GX + GW * U / Umax, gy = I => GY + GH - GH * (I * 1000) / Imax;
  const U0 = Math.round(10 * 0.85 * M.tensionVide(p, 1000)) / 10;
  const oxG = etroit ? 0 : 350, oyG = etroit ? 352 : 0;
  const regler = ch => setTi(s => ({ ...s, ...ch }));

  const courbe = Ee => { const ue = M.tensionVide(p, Ee), r = []; for (let k = 0; k <= 70; k++) { const U = ue * k / 70; r.push(`${gx(U).toFixed(1)},${gy(M.courant(p, Ee, U)).toFixed(1)}`); } return r.join(' '); };
  const ghosts = ti.multi === 'plusieurs' ? [[1000, '#0369a1'], [700, '#0f766e'], [400, '#b45309'], [200, '#7e22ce']] : [];

  // pointage sur la courbe : on cherche la résistance dont le point de fonctionnement est le plus proche de la tension pointée
  const debut = ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = true; setTouche(true); bouge(ev); };
  const bouge = ev => {
    if (!drag.current) return;
    const { X } = coordSvg(svgRef.current, ev);
    const Up = (X - oxG - GX) / GW * Umax; let best = null;
    for (const r of M.R_LISTE) { const q = M.point(p, E, r), d = Math.abs(q.U - Up); if (!best || d < best.d) best = { r, d }; }
    if (best.r !== R) regler({ R: best.r });
  };
  const fait = ev => { drag.current = false; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const iR = M.R_LISTE.indexOf(R);
  const clavier = ev => {
    // flèche droite = tension plus grande = résistance plus grande (R_LISTE est croissante)
    const s = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : 0; if (!s) return;
    ev.preventDefault(); regler({ R: M.R_LISTE[Math.min(Math.max(iR + s, 0), M.R_LISTE.length - 1)] });
  };

  const rel = pm.P > 0 ? Math.abs(pt.P - pm.P) / pm.P : 1;
  const message = !touche ? 'Tire le point sur la courbe : l’aire du rectangle orange est la puissance P = U × I. Tire le soleil pour changer l’éclairement.'
    : R === 0 ? 'Court-circuit : la tension est nulle, donc la puissance est nulle (I = Icc).'
    : !isFinite(R) ? 'Circuit ouvert : l’intensité est nulle, donc la puissance est nulle (U = Uco).'
    : rel < 0.03 ? `Au coude de la courbe, le rectangle est le plus grand : P ≈ Pmax = ${mW(pm.P)}.` : `P = ${nbf(pt.U, 2)} V × ${nbf(pt.I * 1000, 0)} mA = ${mW(pt.P)}. Cherche le plus grand rectangle.`;

  const ticksU = [], ticksI = []; const su = nice(Umax / 1, 5), si = nice(Imax, 5);
  for (let u = 0; u <= Umax; u += su) ticksU.push(u);
  for (let i = 0; i <= Imax; i += si) ticksI.push(i);
  const lu = v => nbf(v, su < 1 ? 1 : 0), Fg = 1;

  return (
    <div ref={boite}>
      <StyleAnim/>
      <svg ref={svgRef} className="xa-svg" viewBox={etroit ? '0 0 340 700' : '0 0 700 344'} role="img"
        aria-label={`Scène animée : un panneau photovoltaïque éclairé à ${E} watts par mètre carré débite ${nbf(pt.I * 1000, 0)} milliampères sous ${nbf(pt.U, 2)} volts, soit ${mW(pt.P)} ; à droite sa caractéristique intensité-tension.`}>
        <rect width="700" height="700" fill="#f8fafc"/>
        <ScenePanneau ox={0} oy={0} svgRef={svgRef} E={E} onE={v => regler({ E: v })} U={pt.U} I={pt.I} R={R} anim={anim} touche={touche} onTouche={() => setTouche(true)}/>
        <g transform={`translate(${oxG} ${oyG})`}>
          <rect x="4" y="4" width="334" height="336" rx="14" fill="#ffffff" stroke="#cbd5e1"/>
          <text x="170" y="26" textAnchor="middle" fontSize="15" fontWeight="800" fill={COLP.ink}>Caractéristique I(U) du panneau</text>
          {ticksI.map(i => <g key={`i${i}`}><line x1={GX} x2={GX + GW} y1={gy(i / 1000)} y2={gy(i / 1000)} stroke="#e2e8f0"/><text x={GX - 6} y={gy(i / 1000) + 4} textAnchor="end" fontSize="12" fill="#475569">{i}</text></g>)}
          {ticksU.map(u => <g key={`u${u}`}><line x1={gx(u)} x2={gx(u)} y1={GY} y2={GY + GH} stroke="#e2e8f0"/><text x={gx(u)} y={GY + GH + 16} textAnchor="middle" fontSize="12" fill="#475569">{lu(u)}</text></g>)}
          <line x1={GX} x2={GX} y1={GY} y2={GY + GH} stroke="#334155" strokeWidth="2"/><line x1={GX} x2={GX + GW} y1={GY + GH} y2={GY + GH} stroke="#334155" strokeWidth="2"/>
          <text x={GX - 2} y={GY - 8} fontSize="13" fontWeight="800" fill={COLP.I}>I (mA)</text>
          <text x={GX + GW} y={GY + GH + 34} textAnchor="end" fontSize="13" fontWeight="800" fill={COLP.U}>U (V)</text>

          {ghosts.map(([e2, c]) => <g key={e2}><polyline points={courbe(e2)} fill="none" stroke={c} strokeWidth="2" opacity="0.5"/><text x={gx(M.tensionVide(p, e2)) - 2} y={gy(M.courantCC(p, e2)) - 5} textAnchor="end" fontSize="11" fontWeight="700" fill={c}>{e2}</text></g>)}
          {ti.ideale && <g><line x1={gx(U0)} x2={gx(U0)} y1={GY} y2={GY + GH} stroke="#dc2626" strokeWidth="3" strokeDasharray="8 5"/><text x={gx(U0) + 5} y={GY + 14} fontSize="12" fontWeight="800" fill="#dc2626">source idéale</text></g>}

          {/* aire = puissance */}
          {isFinite(R) && R > 0 && <g><rect x={GX} y={gy(pt.I)} width={gx(pt.U) - GX} height={GY + GH - gy(pt.I)} fill="#f59e0b" opacity="0.32" stroke="#b45309" strokeWidth="2"/>
            <text x={GX + (gx(pt.U) - GX) / 2} y={gy(pt.I) + (GY + GH - gy(pt.I)) / 2 + 4} textAnchor="middle" fontSize="13" fontWeight="800" fill="#7c2d12">P = U × I</text></g>}
          <polyline points={courbe(E)} fill="none" stroke={COLP.U} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round"/>
          <g pointerEvents="none"><circle cx={gx(pm.U)} cy={gy(pm.I)} r="6" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeDasharray="3 3"/>
            <text x={gx(pm.U) + 10} y={gy(pm.I) - 8} fontSize="12" fontWeight="800" fill="#7c3aed">Pmax</text></g>
          <text x={GX + 8} y={gy(icc) - 8} fontSize="12" fontWeight="800" fill={COLP.U}>Icc = {nbf(icc * 1000, 0)} mA</text>
          <text x={gx(uco) - 4} y={GY + GH - 8} textAnchor="end" fontSize="12" fontWeight="800" fill={COLP.U}>Uco = {nbf(uco, 2)} V</text>

          {/* point de fonctionnement : poignée */}
          <rect x={GX - 6} y={GY - 6} width={GW + 12} height={GH + 12} fill="transparent" style={{ cursor: 'pointer', touchAction: 'none' }} onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait}/>
          <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Point de fonctionnement sur la caractéristique (résistance de charge)" aria-valuemin={0} aria-valuemax={M.R_LISTE.length - 1} aria-valuenow={iR} aria-valuetext={`tension ${nbf(pt.U, 2)} volts, intensité ${nbf(pt.I * 1000, 0)} milliampères`}
            onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier}>
            <circle cx={gx(pt.U)} cy={gy(pt.I)} r="24" fill="transparent"/>
            {!touche && <circle className="xa-pulse" cx={gx(pt.U)} cy={gy(pt.I)} r="14" fill="none" stroke={COLP.P} strokeWidth="3"/>}
            <circle className="xa-anneau" cx={gx(pt.U)} cy={gy(pt.I)} r="10" fill="#fff" stroke={COLP.P} strokeWidth="3.5" filter="url(#pvs-ombre)"/>
            <circle cx={gx(pt.U)} cy={gy(pt.I)} r="3.5" fill={COLP.P}/>
          </g>
        </g>
      </svg>

      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: touche ? 700 : 400, color: touche && rel < 0.03 ? '#15803d' : KIT.txt2 }}>{message}</div>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Panneau" valeur={ti.pan} onChange={v => regler({ pan: v })} options={M.IDS_PANNEAUX.map(id => [id, M.PANNEAUX[id].nom.replace(/ \(.*\)/, '') + ` (${M.PANNEAUX[id].Nc})`])}/>
        <Seg label="Courbes affichées" valeur={ti.multi} onChange={v => regler({ multi: v })} options={[['un', 'éclairement choisi'], ['plusieurs', 'plusieurs éclairements']]}/>
        <Seg label="Comparer à une source idéale de tension" valeur={ti.ideale} onChange={v => regler({ ideale: v })} options={[[false, 'non'], [true, 'oui']]}/>
      </div>
      <div className="xa-chips" style={{ maxWidth: 920, margin: '10px auto 0', '--n': 6 }}>
        {[['Icc (court-circuit)', `${nbf(icc * 1000, 0)} mA`, COLP.I], ['Uco (à vide)', `${nbf(uco, 2)} V`, COLP.U], ['Tension U', `${nbf(pt.U, 2)} V`, COLP.U], ['Intensité I', `${nbf(pt.I * 1000, 0)} mA`, COLP.I], ['Puissance P', mW(pt.P), COLP.P], ['Pmax', mW(pm.P), '#7c3aed']].map(([n, v, c]) => (
          <div key={n} style={{ ...styleBoite, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>{n}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
          </div>))}
      </div>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        Un panneau n’est pas une source idéale : son intensité reste proche de Icc tant que U est petite, puis chute près de Uco. La puissance P = U × I est maximale au « coude » (Pmax = {mW(pm.P)} pour U ≈ {nbf(pm.U, 2)} V, soit R ≈ {nbf(pm.R, 0)} Ω). Icc est proportionnel à l’éclairement, Uco varie à peine.
      </div>
    </div>);
}
