import { useRef, useState } from "react";
import { KIT, styleBoite, Curseur, LigneMesure, Section } from "../commun";
import { NB } from "./Distillation";
import * as M from "./eulerChuteModele";
import { COL, nbf, useEtroit, useLecture, coordSvg, StyleAnim, DefsAnim, BarreLecture, Chips, Seg } from "./exploAnim";

// ====================================================
//  Partie animée de l'exploration de la simulation 271 (équation différentielle et méthode d'Euler).
//  Graphe v(t) : solution exacte (gris) et suite d'Euler (orange). Le premier point d'Euler porte une poignée saisissable : on la glisse horizontalement pour régler le pas Δt.
//  Un tableau donne les premiers pas (t_i, v_i, a_i). « Calculer » fait apparaître les points un par un.
// ====================================================
const cl = (x, a, b) => Math.max(a, Math.min(b, x));
const VMAX = 12, K_MIN = 2, K_MAX = 10;

export function EulerChuteExplore({ ex, setEx }) {
  const svgRef = useRef(null), drag = useRef(false), boite = useRef(null);
  const etroit = useEtroit(boite), [ouvert, setOuvert] = useState(false);
  const { k, mf, dt } = ex, m = M.MASSE;
  const L = useLecture(M.T_FIN, false), t = Math.min(L.t, M.T_FIN), jeu = L.t > 0 || L.joue;
  const suite = M.euler(m, mf, k, dt, M.T_FIN), vl = M.vlim(m, mf, k), ta = M.tau(m, k), a0 = M.A(m, mf);
  const visibles = suite.filter(p => p.t <= (jeu ? t : M.T_FIN) + 1e-9);
  const dernier = visibles[visibles.length - 1];
  const vEx = M.exact(m, mf, k, dernier.t), ecart = dernier.v - vEx;
  const Fm = etroit ? 1.25 : 1, GW = etroit ? 460 : 700, GH = etroit ? 340 : 340, gx0 = etroit ? 56 : 66, gx1 = GW - 20, gy0 = 22, gy1 = GH - 46;
  const gX = tt => gx0 + tt / M.T_FIN * (gx1 - gx0), gY = vv => gy1 - vv / VMAX * (gy1 - gy0);
  const courbe = Array.from({ length: 61 }, (_, i) => { const tt = M.T_FIN * i / 60; return `${gX(tt).toFixed(1)},${gY(M.exact(m, mf, k, tt)).toFixed(1)}`; }).join(' ');
  const p1 = suite[1], gripL = etroit ? 62 : 46, gripH = etroit ? 44 : 30, stable = dt < ta, oscille = dt > ta;
  const debut = ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = true; L.setTouche(true); };
  const bouge = ev => { if (!drag.current) return; const { X } = coordSvg(svgRef.current, ev), d = cl(Math.round((X - gx0) / (gx1 - gx0) * M.T_FIN / M.DT_PAS) * M.DT_PAS, M.DT_MIN, M.DT_MAX); L.reset(); setEx(s => ({ ...s, dt: Number(d.toFixed(2)) })); };
  const fait = ev => { drag.current = false; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const clavier = ev => { if (!['ArrowLeft', 'ArrowRight'].includes(ev.key)) return; ev.preventDefault(); L.setTouche(true); L.reset(); setEx(s => ({ ...s, dt: Number(cl(s.dt + (ev.key === 'ArrowRight' ? M.DT_PAS : -M.DT_PAS), M.DT_MIN, M.DT_MAX).toFixed(2)) })); };
  const change = (cle, val) => { L.reset(); setEx(s => ({ ...s, [cle]: val })); };
  const message = !L.touche && !jeu ? 'Saisis la poignée sur le premier point orange et déplace-la horizontalement : elle règle le pas Δt de la méthode d’Euler. Puis « Calculer ».'
    : !jeu ? `Les points orange sont déjà calculés (pas Δt = ${nbf(dt, 2)} s) : compare-les à la courbe grise, solution exacte. « Calculer » les fait apparaître un par un.`
      : L.fin ? `À t = ${nbf(M.T_FIN, 0)} s : v Euler = ${nbf(dernier.v, 2)} m/s, v exacte = ${nbf(vEx, 2)} m/s (écart ${nbf(Math.abs(ecart), 2)} m/s).` : `Pas n° ${visibles.length - 1} : v = ${nbf(dernier.v, 2)} m/s calculée avec a = ${nbf(dernier.a, 2)} m/s².`;
  const aria = `Graphique de la vitesse en fonction du temps : solution exacte et suite d'Euler de pas ${nbf(dt, 2)} seconde. Vitesse limite ${nbf(vl, 1)} mètre par seconde, constante de temps ${nbf(ta, 2)} seconde. À l'instant ${nbf(dernier.t, 2)} seconde, vitesse d'Euler ${nbf(dernier.v, 2)}, vitesse exacte ${nbf(vEx, 2)} mètre par seconde.`;
  const lignes = suite.slice(0, 7);
  const th = { padding: '4px 6px', textAlign: 'right', fontWeight: 700, color: KIT.txt2, fontSize: 13 }, td = { padding: '4px 6px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 14 };
  return (
    <div ref={boite}>
      <StyleAnim/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Masse de fluide déplacé (objet de 2,0 kg)" valeur={mf} onChange={v2 => change('mf', v2)} options={M.MF_CHOIX.map(x => [x, `${nbf(x, 1)} kg`])}/>
      </div>
      <svg ref={svgRef} className="xa-svg" viewBox={`0 0 ${GW} ${GH}`} role="img" aria-label={aria}>
        <DefsAnim/>
        <rect width={GW} height={GH} fill="#fff"/>
        <clipPath id="eul-clip"><rect x={gx0} y={gy0 - 6} width={gx1 - gx0 + 6} height={gy1 - gy0 + 6}/></clipPath>
        <line x1={gx0} y1={gy1} x2={gx1 + 6} y2={gy1} stroke="#475569" strokeWidth="2.5"/><line x1={gx0} y1={gy1} x2={gx0} y2={gy0 - 8} stroke="#475569" strokeWidth="2.5"/>
        {[0, 0.5, 1, 1.5, 2, 2.5, 3].map(tt => <g key={tt}><line x1={gX(tt)} y1={gy1} x2={gX(tt)} y2={gy1 + 6} stroke="#475569" strokeWidth="2"/>{Number.isInteger(tt) && <text x={gX(tt)} y={gy1 + 12 + 14 * Fm * 0.9} textAnchor="middle" fontSize={13 * Fm * 0.95} fontWeight="700" fill="#475569">{tt}</text>}</g>)}
        {[0, 3, 6, 9, 12].map(vv => <g key={vv}><line x1={gx0 - 5} y1={gY(vv)} x2={gx0} y2={gY(vv)} stroke="#475569" strokeWidth="2"/><text x={gx0 - 9} y={gY(vv) + 5} textAnchor="end" fontSize={13 * Fm * 0.95} fontWeight="700" fill="#475569">{vv}</text></g>)}
        <text x={gx1} y={gy1 + 12 + 30 * Fm * 0.9} textAnchor="end" fontSize={13 * Fm * 0.95} fontWeight="800" fill="#475569">temps (s)</text><text x={gx0 + 8} y={gy0 - 8} fontSize={13 * Fm * 0.95} fontWeight="800" fill="#475569">vitesse (m/s)</text>
        <g clipPath="url(#eul-clip)">
          <line x1={gx0} y1={gY(vl)} x2={gx1 + 6} y2={gY(vl)} stroke="#b91c1c" strokeWidth="2.2" strokeDasharray="8 6"/>
          <polyline points={courbe} fill="none" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round"/>
          {p1 && <line x1={gX(0)} y1={gY(0)} x2={gX(dt)} y2={gY(p1.v)} stroke="#6d28d9" strokeWidth="2.4" strokeDasharray="6 4"/>}
          <polyline points={visibles.map(p => `${gX(p.t).toFixed(1)},${gY(p.v).toFixed(1)}`).join(' ')} fill="none" stroke="#c2410c" strokeWidth="2.6"/>
          {visibles.map((p, i) => <circle key={i} cx={gX(p.t)} cy={gY(p.v)} r={etroit ? 5.5 : 5} fill="#c2410c" stroke="#fff" strokeWidth="1.6"/>)}
          {jeu && <circle cx={gX(t)} cy={gY(M.exact(m, mf, k, t))} r="6" fill="#64748b" stroke="#fff" strokeWidth="2.2"/>}
        </g>
        <text x={gx1} y={gY(vl) - 8} textAnchor="end" fontSize={14 * Fm * 0.95} fontWeight="800" fill="#b91c1c" stroke="#fff" strokeWidth="4" paintOrder="stroke">v<tspan dy="3" fontSize={10.5 * Fm}>lim</tspan><tspan dy="-3"> = {nbf(vl, 2)} m/s</tspan></text>
        <text x={gx1 - 4} y={gy0 + 14 * Fm} textAnchor="end" fontSize={13.5 * Fm * 0.95} fontWeight="800" fill="#64748b">solution exacte (gris)</text>
        {oscille && <text x={gx0 + 10} y={gy0 + 16 * Fm} fontSize={13.5 * Fm * 0.95} fontWeight="800" fill="#b91c1c">Δt &gt; τ : le calcul s’éloigne de la solution</text>}
        {/* poignée du pas Δt : sur le premier point d'Euler */}
        <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Pas Δt de la méthode d’Euler : flèches gauche et droite pour le changer" aria-valuemin={M.DT_MIN} aria-valuemax={M.DT_MAX} aria-valuenow={dt} aria-valuetext={`pas ${nbf(dt, 2)} seconde`} onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier}>
          <rect x={gx0} y={gy1 - 26} width={gx1 - gx0} height="52" fill="transparent"/>
          <line x1={gX(dt)} y1={gy1 + 14} x2={gX(dt)} y2={gy1} stroke="#6d28d9" strokeWidth="2"/>
          <rect className="xa-anneau" x={gX(dt) - gripL / 2} y={gy1 - gripH / 2 - 2} width={gripL} height={gripH} rx={gripH / 2} fill="#fff" stroke="#6d28d9" strokeWidth="3.5"/>
          <g stroke="#6d28d9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"><polyline points={`${gX(dt) - 14},${gy1 - 2 - 6} ${gX(dt) - 20},${gy1 - 2} ${gX(dt) - 14},${gy1 - 2 + 6}`}/><polyline points={`${gX(dt) + 14},${gy1 - 2 - 6} ${gX(dt) + 20},${gy1 - 2} ${gX(dt) + 14},${gy1 - 2 + 6}`}/><text x={gX(dt)} y={gy1 - 2 + 5} textAnchor="middle" fontSize={15 * Fm * 0.9} fontWeight="800" fill="#6d28d9" stroke="none">Δt</text></g>
          {!L.touche && <rect className="xa-pulse" x={gX(dt) - gripL / 2 - 3} y={gy1 - gripH / 2 - 5} width={gripL + 6} height={gripH + 6} rx={gripH / 2 + 3} fill="none" stroke="#6d28d9" strokeWidth="3"/>}
        </g>
      </svg>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.fin ? 700 : 400, color: L.fin ? '#15803d' : KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={M.T_FIN} libelle="▶ Calculer"/>
      <Chips items={[['Pas Δt', `${nbf(dt, 2)} s`, '#6d28d9'], ['v Euler', `${nbf(dernier.v, 2)} m/s`, '#c2410c'], ['v exacte', `${nbf(vEx, 2)} m/s`, COL.v], ['Écart', `${nbf(Math.abs(ecart), 2)} m/s`]]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0', overflowX: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Les premiers pas de la méthode d’Euler</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>pas i</th><th style={th}>t (s)</th><th style={th}>v (m/s)</th><th style={th}>a = A − v ÷ τ (m/s²)</th></tr></thead>
          <tbody>{lignes.map((p, i) => <tr key={i} style={{ background: p.t <= (jeu ? t : -1) + 1e-9 ? '#fff7ed' : 'transparent', borderTop: '1px solid #e2e8f0' }}><td style={td}>{i}</td><td style={td}>{nbf(p.t, 2)}</td><td style={td}>{nbf(p.v, 2)}</td><td style={td}>{nbf(p.a, 2)}</td></tr>)}</tbody>
        </table>
        <div style={{ marginTop: 6, fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Chaque ligne se déduit de la précédente : v(i+1) = v(i) + a(i) × Δt, avec a(i) = A − v(i) ÷ τ.</div>
      </div>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
        <LigneMesure nom="Accélération au départ A = g (1 − m_f ÷ m)" valeur={`${nbf(a0, 2)}${NB}m/s²`} couleur="#c2410c"/>
        <LigneMesure nom="Vitesse limite v_lim = (m − m_f) g ÷ k" valeur={`${nbf(vl, 2)}${NB}m/s`} couleur="#b91c1c"/>
        <LigneMesure nom="Constante de temps τ = m ÷ k" valeur={`${nbf(ta, 2)}${NB}s`} couleur="#6d28d9"/>
        <LigneMesure nom="Pas Δt par rapport à τ" valeur={`${nbf(dt / ta, 2)}${NB}τ`} couleur={stable ? '#15803d' : '#b91c1c'}/>
        <div style={{ marginTop: 6, fontSize: 14, color: KIT.txt2, lineHeight: 1.5 }}>La poussée d’Archimède (m<sub>f</sub> &gt; 0) baisse v<sub>lim</sub> et A mais laisse τ inchangée. Avec un petit pas, la suite d’Euler est proche de la courbe exacte ; quand Δt approche τ, elle s’en éloigne.</div>
      </div>
      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre="Réglages précis (clavier)" ouvert={ouvert} onBascule={() => setOuvert(o => !o)}>
          <Curseur nom="Pas Δt" valeur={dt} onChange={v2 => change('dt', v2)} min={M.DT_MIN} max={M.DT_MAX} pas={M.DT_PAS} unite="s" decimales={2} couleur="#6d28d9"/>
          <Curseur nom="Coefficient de frottement k" valeur={k} onChange={v2 => change('k', v2)} min={K_MIN} max={K_MAX} pas={0.5} unite="kg/s" decimales={1} couleur="#b91c1c"/>
        </Section>
      </div>
    </div>);
}
