import { useRef, useState } from "react";
import { KIT, styleBoite, Curseur, LigneMesure, Section } from "../commun";
import { NB } from "./Distillation";
import * as M from "./chuteVisqueuseModele";
import { COL, nbf, useEtroit, useLecture, coordSvg, StyleAnim, DefsAnim, BarreLecture, Chips, Seg } from "./exploAnim";

// ====================================================
//  Partie animée de l'exploration de la simulation 270 (chute verticale avec frottement visqueux).
//  Scène : un objet lâché dans un fluide (poids P, frottement f = k v, vitesse v) devant une règle qui défile.
//  Graphe v(t) : l'asymptote v_lim porte une poignée saisissable (elle règle k = m g ÷ v_lim) ; la tangente à l'origine, τ et le point à 63 % sont tracés.
// ====================================================
const cl = (x, a, b) => Math.max(a, Math.min(b, x));
const PXN = 3, PXM = 11;   // px par newton (flèches), px par mètre (règle qui défile)

export function ChuteVisqueuseExplore({ ex, setEx }) {
  const svgRef = useRef(null), drag = useRef(false), boite = useRef(null);
  const etroit = useEtroit(boite), [ouvert, setOuvert] = useState(false);
  const { m, k } = ex;
  const L = useLecture(M.T_FIN, false), t = Math.min(L.t, M.T_FIN), jeu = L.t > 0 || L.joue;
  const vl = M.vlim(m, k), ta = M.tau(m, k), v = M.vit(m, k, t), f = M.frott(m, k, t), a = M.acc(m, k, t), d = M.dist(m, k, t);
  const Fm = etroit ? 1.25 : 1;
  // ----- scène -----
  const SW = 300, SH = 340, cx = 168, cy = 150, P = m * M.G, r = 14 + 4 * Math.sqrt(m), LP = P * PXN, LF = f * PXN;
  const regle = Array.from({ length: 33 }, (_, i) => i - 3);
  // ----- graphe -----
  const GW = 460, GH = etroit ? 330 : 300, gx0 = 58, gx1 = GW - 22, gy0 = 26, gy1 = GH - 46;
  const gX = tt => gx0 + tt / M.T_FIN * (gx1 - gx0), gY = vv => gy1 - vv / M.V_MAX * (gy1 - gy0);
  const nCourbe = 61, courbe = Array.from({ length: nCourbe }, (_, i) => { const tt = M.T_FIN * i / (nCourbe - 1); return [tt, M.vit(m, k, tt)]; });
  const vivante = courbe.filter(([tt]) => tt <= t + 1e-9);
  const debut = ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = true; L.setTouche(true); };
  const bouge = ev => {
    if (!drag.current) return; const { Y } = coordSvg(svgRef.current, ev), vv = cl((gy1 - Y) / (gy1 - gy0) * M.V_MAX, 0.4, M.V_MAX);
    const kk = cl(Math.round(m * M.G / vv / M.K_PAS) * M.K_PAS, M.K_MIN, M.K_MAX); L.reset(); setEx(s => ({ ...s, k: kk }));
  };
  const fait = ev => { drag.current = false; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const clavier = ev => { if (!['ArrowUp', 'ArrowDown'].includes(ev.key)) return; ev.preventDefault(); L.setTouche(true); L.reset(); setEx(s => ({ ...s, k: cl(s.k + (ev.key === 'ArrowUp' ? -M.K_PAS : M.K_PAS), M.K_MIN, M.K_MAX) })); };
  const change = (cle, val) => { L.reset(); setEx(s => ({ ...s, [cle]: val })); };
  const yH = gY(vl), xT = gX(ta), yT = gY(M.vit(m, k, ta)), xg = gx1 - (etroit ? 34 : 30), gripL = etroit ? 62 : 46, gripH = etroit ? 44 : 30;
  const message = !L.touche && !jeu ? 'Saisis la poignée sur la ligne rouge en pointillés (la vitesse limite) et déplace-la : elle règle le coefficient de frottement k. Puis « Lâcher ».'
    : !jeu ? 'La courbe se prévoit avant le lâcher : vitesse limite = m g ÷ k et τ = m ÷ k. Appuie sur « Lâcher » pour voir la chute.'
      : L.fin || t >= 5 * ta ? `Régime permanent : f = P (${nbf(P, 1)} N), a = 0, v reste égale à ${nbf(vl, 1)} m/s.` : `Régime transitoire : f = ${nbf(f, 1)} N < P = ${nbf(P, 1)} N, a = ${nbf(a, 1)} m/s² diminue, v augmente.`;
  const aria = `Objet de ${m} kilogrammes lâché dans un fluide, coefficient de frottement ${nbf(k, 1)} kilogramme par seconde. Vitesse limite ${nbf(vl, 1)} mètre par seconde, constante de temps ${nbf(ta, 2)} seconde. À l'instant ${nbf(t, 2)} secondes : vitesse ${nbf(v, 1)} mètre par seconde, frottement ${nbf(f, 1)} newtons, accélération ${nbf(a, 1)} mètre par seconde carrée.`;
  return (
    <div ref={boite}>
      <StyleAnim/>
      <style>{`.fvx-deux { display: grid; gap: 10px; align-items: start; grid-template-columns: minmax(0, 1fr); max-width: 920px; margin: 0 auto; } @media (min-width: 760px) { .fvx-deux { grid-template-columns: minmax(0, 300px) minmax(0, 1fr); } }`}</style>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Masse de l’objet" valeur={m} onChange={v2 => change('m', v2)} options={M.MASSES.map(x => [x, `${x} kg`])}/>
      </div>
      <div className="fvx-deux">
        <svg className="xa-svg" viewBox={`0 0 ${SW} ${SH}`} role="img" aria-label={aria} style={{ maxWidth: 320, margin: '0 auto' }}>
          <DefsAnim/>
          <rect x="6" y="6" width={SW - 12} height={SH - 12} rx="16" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2.5"/>
          <text x={SW - 16} y="30" textAnchor="end" fontSize={14 * Fm} fontWeight="700" fill="#0369a1">fluide</text>
          <clipPath id="fvx-clip"><rect x="8" y="8" width={SW - 16} height={SH - 16} rx="14"/></clipPath>
          <g clipPath="url(#fvx-clip)">{regle.map(i => { const n = i + Math.floor(d), y = cy + i * PXM - (d - Math.floor(d)) * PXM, g5 = n % 5 === 0; return <g key={i}><line x1="8" y1={y} x2={g5 ? 34 : 22} y2={y} stroke="#0369a1" strokeWidth={g5 ? 3 : 1.8} opacity="0.7"/></g>; })}</g>
          <text x="40" y={SH - 18} fontSize={13 * Fm} fontWeight="700" fill="#0369a1">règle : 1 m entre deux traits</text>
          {/* poids (constant) et frottement (croissant) */}
          <line x1={cx} y1={cy + r} x2={cx} y2={cy + r + LP - 14} stroke="#c2410c" strokeWidth="6"/><polygon points={`${cx},${cy + r + LP} ${cx - 8},${cy + r + LP - 17} ${cx + 8},${cy + r + LP - 17}`} fill="#c2410c"/>
          <text x={cx + 14} y={cy + r + LP * 0.55 + 6} fontSize={17 * Fm} fontWeight="800" fill="#c2410c" stroke="#fff" strokeWidth="4" paintOrder="stroke">P</text>
          {LF > 8 && <g><line x1={cx} y1={cy - r} x2={cx} y2={cy - r - LF + 14} stroke="#6d28d9" strokeWidth="6"/><polygon points={`${cx},${cy - r - LF} ${cx - 8},${cy - r - LF + 17} ${cx + 8},${cy - r - LF + 17}`} fill="#6d28d9"/>
            <text x={cx + 14} y={cy - r - Math.min(LF * 0.5, 40)} fontSize={17 * Fm} fontWeight="800" fill="#6d28d9" stroke="#fff" strokeWidth="4" paintOrder="stroke">f</text></g>}
          <circle cx={cx} cy={cy} r={r} fill="#dbeafe" stroke="#0b4f94" strokeWidth="4" filter="url(#xa-ombre)"/>
          {/* vitesse */}
          {v > 0.3 && <g><line x1={SW - 40} y1={52} x2={SW - 40} y2={52 + v * 6 - 12} stroke="#475569" strokeWidth="5"/><polygon points={`${SW - 40},${52 + v * 6} ${SW - 47},${52 + v * 6 - 14} ${SW - 33},${52 + v * 6 - 14}`} fill="#475569"/>
            <text x={SW - 52} y={52 + Math.min(v * 3, 60) + 6} textAnchor="end" fontSize={17 * Fm} fontWeight="800" fill="#475569" stroke="#fff" strokeWidth="4" paintOrder="stroke">v</text></g>}
        </svg>
        <div>
          <svg ref={svgRef} className="xa-svg" viewBox={`0 0 ${GW} ${GH}`} role="img" aria-label="Graphique de la vitesse en fonction du temps, avec la vitesse limite, la tangente à l’origine et la constante de temps" >
            <rect width={GW} height={GH} fill="#fff"/>
            <line x1={gx0} y1={gy1} x2={gx1 + 6} y2={gy1} stroke="#475569" strokeWidth="2.5"/><line x1={gx0} y1={gy1} x2={gx0} y2={gy0 - 8} stroke="#475569" strokeWidth="2.5"/>
            {[0, 1, 2, 3, 4, 5, 6].map(tt => <g key={tt}><line x1={gX(tt)} y1={gy1} x2={gX(tt)} y2={gy1 + 6} stroke="#475569" strokeWidth="2"/><text x={gX(tt)} y={gy1 + 12 + 14 * Fm * 0.9} textAnchor="middle" fontSize={13 * Fm * 0.95} fontWeight="700" fill="#475569">{tt}</text></g>)}
            {[0, 5, 10, 15, 20].map(vv => <g key={vv}><line x1={gx0 - 5} y1={gY(vv)} x2={gx0} y2={gY(vv)} stroke="#475569" strokeWidth="2"/><text x={gx0 - 9} y={gY(vv) + 5} textAnchor="end" fontSize={13 * Fm * 0.95} fontWeight="700" fill="#475569">{vv}</text></g>)}
            <text x={gx1} y={gy1 + 12 + 30 * Fm * 0.9} textAnchor="end" fontSize={13 * Fm * 0.95} fontWeight="800" fill="#475569">temps (s)</text><text x={gx0 + 8} y={gy0 - 8} fontSize={13 * Fm * 0.95} fontWeight="800" fill="#475569">vitesse (m/s)</text>
            {/* tangente à l'origine, τ, 63 % */}
            <line x1={gX(0)} y1={gY(0)} x2={xT} y2={yH} stroke="#6d28d9" strokeWidth="2.4" strokeDasharray="6 5" opacity="0.8"/>
            <line x1={xT} y1={yH} x2={xT} y2={gy1 + 6} stroke="#6d28d9" strokeWidth="1.8" strokeDasharray="3 4" opacity="0.8"/>
            <text x={xT} y={gy1 - 8} textAnchor="middle" fontSize={15 * Fm * 0.95} fontWeight="800" fill="#6d28d9" stroke="#fff" strokeWidth="4" paintOrder="stroke">τ = {nbf(ta, 2)} s</text>
            <line x1={gx0} y1={yT} x2={xT} y2={yT} stroke="#15803d" strokeWidth="1.8" strokeDasharray="4 4" opacity="0.85"/><circle cx={xT} cy={yT} r="5.5" fill="#fff" stroke="#15803d" strokeWidth="2.8"/>
            <text x={xT + 12} y={yT + 22} fontSize={13 * Fm * 0.95} fontWeight="800" fill="#15803d" stroke="#fff" strokeWidth="4" paintOrder="stroke">63 % de v<tspan dy="3" fontSize={10 * Fm}>lim</tspan></text>
            {/* courbe prévue, courbe vivante */}
            <polyline points={courbe.map(([tt, vv]) => `${gX(tt).toFixed(1)},${gY(vv).toFixed(1)}`).join(' ')} fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="7 6"/>
            {jeu && <polyline points={vivante.map(([tt, vv]) => `${gX(tt).toFixed(1)},${gY(vv).toFixed(1)}`).join(' ')} fill="none" stroke="#0b4f94" strokeWidth="5" strokeLinecap="round"/>}
            {jeu && <circle cx={gX(t)} cy={gY(v)} r="7" fill="#0b4f94" stroke="#fff" strokeWidth="2.5"/>}
            {/* asymptote v_lim avec poignée */}
            <line x1={gx0} y1={yH} x2={gx1 + 4} y2={yH} stroke="#b91c1c" strokeWidth="2.6" strokeDasharray="8 6"/>
            <text x={gx0 + 8} y={yH - 8} fontSize={15 * Fm * 0.95} fontWeight="800" fill="#b91c1c" stroke="#fff" strokeWidth="4" paintOrder="stroke">v<tspan dy="3" fontSize={11 * Fm}>lim</tspan><tspan dy="-3"> = {nbf(vl, 1)} m/s</tspan></text>
            <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Vitesse limite : flèches haut et bas pour changer le coefficient de frottement k" aria-valuemin={M.K_MIN} aria-valuemax={M.K_MAX} aria-valuenow={k} aria-valuetext={`k = ${nbf(k, 1)} kilogramme par seconde, vitesse limite ${nbf(vl, 1)} mètre par seconde`} onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier}>
              <rect x={gx0} y={yH - 22} width={gx1 - gx0} height="44" fill="transparent"/>
              <rect className="xa-anneau" x={xg - gripL / 2} y={yH - gripH / 2} width={gripL} height={gripH} rx={gripH / 2} fill="#fff" stroke="#b91c1c" strokeWidth="3.5"/>
              <g stroke="#b91c1c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"><polyline points={`${xg - 6},${yH - 4} ${xg},${yH - 10} ${xg + 6},${yH - 4}`}/><polyline points={`${xg - 6},${yH + 4} ${xg},${yH + 10} ${xg + 6},${yH + 4}`}/></g>
              {!L.touche && <rect className="xa-pulse" x={xg - gripL / 2 - 3} y={yH - gripH / 2 - 3} width={gripL + 6} height={gripH + 6} rx={gripH / 2 + 3} fill="none" stroke="#b91c1c" strokeWidth="3"/>}
            </g>
          </svg>
        </div>
      </div>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.fin ? 700 : 400, color: L.fin ? '#15803d' : KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={M.T_FIN} libelle="▶ Lâcher"/>
      <Chips items={[['Instant t', `${nbf(t, 2)} s`], ['Vitesse v', `${nbf(v, 1)} m/s`, COL.v], ['Frottement f', `${nbf(f, 1)} N`, '#6d28d9'], ['Accélération a', `${nbf(a, 1)} m/s²`, COL.Epp]]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
        <LigneMesure nom="Poids P = m g" valeur={`${nbf(P, 1)}${NB}N`} couleur="#c2410c"/>
        <LigneMesure nom="Vitesse limite v_lim = m g ÷ k" valeur={`${nbf(vl, 1)}${NB}m/s`} couleur="#b91c1c"/>
        <LigneMesure nom="Constante de temps τ = m ÷ k" valeur={`${nbf(ta, 2)}${NB}s`} couleur="#6d28d9"/>
        <LigneMesure nom="Vitesse à t = τ (63 % de v_lim)" valeur={`${nbf(M.vit(m, k, ta), 1)}${NB}m/s`} couleur="#15803d"/>
        <LigneMesure nom="Fin du régime transitoire (≈ 5 τ)" valeur={`${nbf(5 * ta, 1)}${NB}s`}/>
        <div style={{ marginTop: 6, fontSize: 14, color: KIT.txt2, lineHeight: 1.5 }}>La tangente à l’origine (pente g) coupe l’asymptote à t = τ : on peut lire τ sans calcul. Doubler m double v_lim et τ ; doubler k divise v_lim et τ par 2.</div>
      </div>
      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre="Réglages précis (clavier)" ouvert={ouvert} onBascule={() => setOuvert(o => !o)}>
          <Curseur nom="Coefficient de frottement k" valeur={k} onChange={v2 => change('k', v2)} min={M.K_MIN} max={M.K_MAX} pas={M.K_PAS} unite="kg/s" decimales={1} couleur="#b91c1c"/>
        </Section>
      </div>
    </div>);
}
