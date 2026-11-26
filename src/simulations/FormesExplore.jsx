import { useState, useMemo, useRef, useCallback } from "react";
import { KIT, styleBoite, Section, Curseur } from "../commun";
import { trajet, M_EAU, T0 } from "./formesTrajet";
import { COL, nbf, J, imageA, Seg, useEtroit, useLecture, coordSvg, StyleAnim, DefsAnim, GrapheTemps, BarreLecture, Chips } from "./exploAnim";

// ====================================================
//  Exploration animée de la simulation 244 (formes d'énergie stockée).
//  Trois situations : la bille lâchée (on tire la bille vers le haut), le bloc lancé (on tire la flèche de vitesse), l'eau chauffée (on règle l'énergie fournie).
//  Un clic sur l'objet lance l'animation ; les colonnes Ec, Ep, ΔU et leur somme suivent en direct.
//  Mouvement : formesTrajet.js.
// ====================================================
const W = 700, H = 400, YG = 348, XB = 250, SH = 80, PXV = 30, XBL = 90;
const SITS = [['chute', 'Chute d’une bille'], ['glisse', 'Bloc qui glisse'], ['chauffe', 'Eau chauffée']];
const COUL = { Ec: COL.Ec, Ep: COL.Epp, U: COL.rouge, Tot: COL.Em };

export function FormesExplore() {
  const [p, setP] = useState({ sit: 'chute', m: 0.5, H: 2, v0: 4, Q: 800 });
  const [ouv, setOuv] = useState(false);
  const svgRef = useRef(null), drag = useRef(null), boite = useRef(null);
  const etroit = useEtroit(boite);
  const tr = useMemo(() => trajet(p), [p]);
  const framesG = useMemo(() => tr.frames.map(f => ({ t: f.t, Ec: f.Ec, Ep: f.Ep, 'ΔU': f.U, Total: f.Tot })), [tr]);
  const L = useLecture(tr.tFin);
  const { t } = L;
  const q = imageA(tr.frames, t);
  const regler = useCallback(ch => { L.reset(); setP(s => ({ ...s, ...ch })); }, [L]);
  const changerSit = sit => regler({ sit, m: sit === 'chute' ? 0.5 : sit === 'glisse' ? 2 : p.m });

  const debut = type => ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = { type, bouge: false }; L.setTouche(true); };
  const bouge = ev => {
    const d = drag.current; if (!d || d.type === 'objet') return;
    const { X, Y } = coordSvg(svgRef.current, ev); d.bouge = true;
    if (d.type === 'H') { const h = Math.min(Math.max(Math.round((YG - 12 - Y) / SH * 2) / 2, 1), 3); if (h !== p.H) regler({ H: h }); }
    if (d.type === 'v') { const v = Math.min(Math.max(Math.round((X - XBL - 30) / PXV), 2), 6); if (v !== p.v0) regler({ v0: v }); }
    if (d.type === 'Q') { const k = Math.round(Math.min(Math.max((X - 420) / 80, 0), 2)); const Q = [400, 800, 1200][k]; if (Q !== p.Q) regler({ Q }); }
  };
  const fait = ev => {
    const d = drag.current; drag.current = null;
    try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ }
    if (d && d.type === 'objet' && !d.bouge) L.demarrer();
  };
  const clavier = (type, ev) => {
    const sens = ev.key === 'ArrowUp' || ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowDown' || ev.key === 'ArrowLeft' ? -1 : 0; if (!sens) return;
    ev.preventDefault();
    if (type === 'H') regler({ H: Math.min(Math.max(p.H + 0.5 * sens, 1), 3) });
    if (type === 'v') regler({ v0: Math.min(Math.max(p.v0 + sens, 2), 6) });
    if (type === 'Q') regler({ Q: [400, 800, 1200][Math.min(Math.max([400, 800, 1200].indexOf(p.Q) + sens, 0), 2)] });
  };
  const lancer = ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); L.demarrer(); } };

  const Fm = etroit ? 1.3 : 1;
  const Emax = Math.max(tr.Etot0, 1) * 1.05;
  const bars = [['Ec', q.Ec, COUL.Ec], ['Ep', q.Ep, COUL.Ep], ['ΔU', q.U, COUL.U], ['Total', q.Tot, COUL.Tot]];
  const rb = p.sit === 'chute' ? 8 + 14 * Math.sqrt(p.m) : 0;
  const msg = {
    chute: 'Clique sur la bille (ou sur « Lâcher ») : elle tombe. Tire-la vers le haut pour changer la hauteur de lâcher.',
    glisse: 'Clique sur le bloc (ou sur « Lancer ») : il glisse et s’arrête. Tire la flèche verte pour changer sa vitesse.',
    chauffe: 'Clique sur la casserole (ou sur « Chauffer ») : l’eau reçoit de l’énergie. Déplace le curseur de la plaque pour en fournir plus.',
  }[p.sit];
  const fin = p.sit === 'chute' ? `Juste avant le sol : toute l’énergie potentielle (${J(tr.Etot0)}) est devenue cinétique, v = ${nbf(q.v, 1)} m/s. La somme est restée constante.`
    : p.sit === 'glisse' ? `Le bloc est arrêté : l’énergie cinétique (${J(tr.Etot0)}) est devenue énergie interne (bloc et sol légèrement plus chauds). Ec + ΔU est restée constante.`
    : `L’eau n’a pas bougé : elle a reçu ${J(p.Q)} et sa température a augmenté de ${nbf(q.dT, 1)} K. Seule l’énergie interne a varié.`;
  const message = !L.touche && !L.joue && t === 0 ? msg : L.fin ? fin : '';
  const sbVal = v => nbf(v, Math.abs(v) < 10 ? 2 : 1);

  const sceneChute = () => {
    const y = z => YG - z * SH - rb, yh = y(p.H);
    return (<g>
      <rect x={XB - 38} y={YG - 3} width="76" height="6" rx="3" fill="#78716c"/>
      <line x1="96" y1={YG} x2="96" y2={YG - 3.3 * SH} stroke="#64748b" strokeWidth="2"/>
      {[0, 1, 2, 3].map(z => <g key={z}><line x1="90" y1={YG - z * SH} x2="104" y2={YG - z * SH} stroke="#64748b" strokeWidth="2"/><text x="84" y={YG - z * SH + 5} textAnchor="end" fontSize={14 * Fm} fontWeight="700" fill="#475569">{z} m</text></g>)}
      <line x1="104" y1={yh + rb} x2={XB + 80} y2={yh + rb} stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 5"/>
      <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Bille : hauteur de lâcher" aria-valuemin={1} aria-valuemax={3} aria-valuenow={p.H} aria-valuetext={`${nbf(p.H, 1)} mètres`} onPointerDown={debut('H')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={ev => clavier('H', ev)}>
        <circle cx={XB} cy={yh} r={rb + 18} fill="transparent"/>
        <circle cx={XB} cy={yh} r={rb} fill="#fef3c7" stroke="#d97706" strokeWidth="2" strokeDasharray="4 3" opacity={t > 0 ? 0.5 : 0}/>
        {!L.touche && <circle className="xa-pulse" cx={XB} cy={yh} r={rb + 6} fill="none" stroke={COL.Epp} strokeWidth="3"/>}
      </g>
      <text x={XB + rb + 14} y={yh - 4} fontSize={16 * Fm} fontWeight="800" fill={COL.Epp} stroke="#fff" strokeWidth="4" paintOrder="stroke">H = {nbf(p.H, 1)} m</text>
      <g className="xa-poignee" role="button" tabIndex={0} aria-label="Bille : cliquer pour la lâcher" style={{ cursor: 'pointer' }} onPointerDown={debut('objet')} onPointerUp={fait} onKeyDown={lancer}>
        <circle cx={XB} cy={y(q.z)} r={rb + 16} fill="transparent"/>
        <g filter="url(#xa-ombre)"><circle cx={XB} cy={y(q.z)} r={rb} fill="url(#xa-bille)" stroke="#b45309" strokeWidth="2.5"/></g>
      </g>
      {t > 0 && !L.fin && q.v > 0.3 && <line x1={XB + rb + 10} y1={y(q.z)} x2={XB + rb + 10} y2={y(q.z) + Math.min(q.v * 7, 100)} stroke={COL.v} strokeWidth="4.5" strokeLinecap="round" markerEnd="url(#xa-pointe)"/>}
    </g>);
  };
  const sceneGlisse = () => {
    const bw = 22 + p.m * 8, bh = 26 + p.m * 5, xs = XBL + q.x * 55, chaud = Math.min(q.U / Math.max(tr.Etot0, 1), 1);
    return (<g>
      <rect x={XBL - 20} y={YG - 1} width={tr.xMax * 55 + bw + 80} height="5" fill={`rgba(220,38,38,${0.08 + 0.7 * chaud})`}/>
      {chaud > 0.02 && Array.from({ length: 8 }, (_, i) => <path key={i} d={`M ${xs - bw / 2 + i * bw / 7} ${YG - 4} q 5 -10 0 -20 q -5 -10 0 -20`} fill="none" stroke={COL.rouge} strokeWidth="2.5" strokeLinecap="round" opacity={0.15 + 0.6 * chaud} className={t > 0 ? '' : ''}/>)}
      <g className="xa-poignee" role="button" tabIndex={0} aria-label="Bloc : cliquer pour le lancer" style={{ cursor: 'pointer' }} onPointerDown={debut('objet')} onPointerUp={fait} onKeyDown={lancer}>
        <rect x={xs - bw / 2 - 10} y={YG - bh - 12} width={bw + 20} height={bh + 14} fill="transparent"/>
        {t > 0 && <rect x={XBL - bw / 2} y={YG - bh} width={bw} height={bh} rx="4" fill="#fde68a" stroke="#d97706" strokeDasharray="5 4" strokeWidth="2" opacity="0.45"/>}
        <g filter="url(#xa-ombre)"><rect x={xs - bw / 2} y={YG - bh} width={bw} height={bh} rx="5" fill={`rgb(${Math.round(180 + 60 * chaud)},${Math.round(110 - 60 * chaud)},${Math.round(60 - 20 * chaud)})`} stroke="#7c2d12" strokeWidth="2.5"/>
          <rect x={xs - bw / 2 + 5} y={YG - bh + 6} width={bw - 10} height="9" rx="2" fill="#fef3c7" opacity="0.85"/></g>
        <text x={xs} y={YG - bh + 14} textAnchor="middle" fontSize="11" fontWeight="800" fill="#7c2d12" pointerEvents="none">{p.m} kg</text>
      </g>
      <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Flèche de vitesse : vitesse initiale du bloc" aria-valuemin={2} aria-valuemax={6} aria-valuenow={p.v0} aria-valuetext={`${p.v0} mètres par seconde`} onPointerDown={debut('v')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={ev => clavier('v', ev)}>
        <line x1={XBL + 14 + 16} y1={YG - bh - 24} x2={XBL + 30 + p.v0 * PXV} y2={YG - bh - 24} stroke={COL.v} strokeWidth="5" strokeLinecap="round"/>
        <circle cx={XBL + 30 + p.v0 * PXV} cy={YG - bh - 24} r="24" fill="transparent"/>
        {!L.touche && <circle className="xa-pulse" cx={XBL + 30 + p.v0 * PXV} cy={YG - bh - 24} r="13" fill="none" stroke={COL.v} strokeWidth="3"/>}
        <circle className="xa-anneau" cx={XBL + 30 + p.v0 * PXV} cy={YG - bh - 24} r="11" fill="#f0fdf4" stroke={COL.v} strokeWidth="3.5" filter="url(#xa-ombre)"/>
        <path d={`M ${XBL + 30 + p.v0 * PXV - 5} ${YG - bh - 24} h 10 M ${XBL + 30 + p.v0 * PXV - 2} ${YG - bh - 28} l 4 4 l -4 4`} fill="none" stroke={COL.v} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <text x={XBL + 36 + p.v0 * PXV} y={YG - bh - 44} textAnchor="middle" fontSize={16 * Fm} fontWeight="800" fill={COL.v} stroke="#fff" strokeWidth="4" paintOrder="stroke">v₀ = {p.v0} m/s</text>
      {t > 0 && q.v > 0.2 && <line x1={xs + bw / 2 + 6} y1={YG - bh / 2} x2={xs + bw / 2 + 6 + q.v * 11} y2={YG - bh / 2} stroke={COL.v} strokeWidth="4.5" strokeLinecap="round" markerEnd="url(#xa-pointe)"/>}
    </g>);
  };
  const sceneChauffe = () => {
    const tm = T0 + q.dT, th = 40 + Math.min(q.dT / 3, 1) * 70, flam = 0.45 + 0.55 * (p.Q / 1200) * (t > 0 && !L.fin ? 1 : 0.3), kx = 420 + [400, 800, 1200].indexOf(p.Q) * 80;
    return (<g>
      <rect x={XB - 120} y={YG - 28} width="240" height="28" rx="6" fill="#475569" stroke="#1e293b" strokeWidth="2.5" filter="url(#xa-ombre)"/>
      <rect x={XB - 100} y={YG - 34} width="200" height="8" rx="3" fill={t > 0 ? '#f97316' : '#64748b'}/>
      {[-60, -20, 20, 60].map(dx => <path key={dx} d={`M ${XB + dx} ${YG - 36} q ${6 * flam} ${-14 * flam} 0 ${-24 * flam} q ${-6 * flam} ${-8 * flam} 0 ${-14 * flam}`} fill="none" stroke={COL.Epp} strokeWidth="4" strokeLinecap="round" opacity={t > 0 || !L.touche ? 0.85 : 0.35}/>)}
      <g className="xa-poignee" role="button" tabIndex={0} aria-label="Casserole : cliquer pour chauffer" style={{ cursor: 'pointer' }} onPointerDown={debut('objet')} onPointerUp={fait} onKeyDown={lancer}>
        <g filter="url(#xa-ombre)"><path d={`M ${XB - 84} ${YG - 150} L ${XB - 76} ${YG - 76} Q ${XB - 74} ${YG - 70} ${XB - 66} ${YG - 70} L ${XB + 66} ${YG - 70} Q ${XB + 74} ${YG - 70} ${XB + 76} ${YG - 76} L ${XB + 84} ${YG - 150} Z`} fill="url(#xa-acier)" stroke="#475569" strokeWidth="3"/>
          <path d={`M ${XB - 80} ${YG - 118} L ${XB - 75} ${YG - 76} Q ${XB - 74} ${YG - 72} ${XB - 66} ${YG - 72} L ${XB + 66} ${YG - 72} Q ${XB + 74} ${YG - 72} ${XB + 75} ${YG - 76} L ${XB + 80} ${YG - 118} Z`} fill={`rgb(${Math.round(125 + 90 * Math.min(q.dT / 3, 1))},${Math.round(190 - 50 * Math.min(q.dT / 3, 1))},${Math.round(245 - 90 * Math.min(q.dT / 3, 1))})`} opacity="0.9"/>
          <rect x={XB + 84} y={YG - 132} width="44" height="9" rx="4" fill="#475569"/></g>
        <text x={XB} y={YG - 90} textAnchor="middle" fontSize={15 * Fm} fontWeight="800" fill="#0c4a6e" pointerEvents="none">eau · 0,20 kg</text>
        <rect x={XB - 90} y={YG - 160} width="180" height="100" fill="transparent"/>
      </g>
      {t > 0 && <g pointerEvents="none"><line x1={XB} y1={YG - 38} x2={XB} y2={YG - 64} stroke={COL.Epp} strokeWidth="5" strokeLinecap="round" markerEnd="url(#xa-pointe)"/><text x={XB + 12} y={YG - 50} fontSize={15 * Fm} fontWeight="800" fill={COL.Epp} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">énergie reçue</text></g>}
      {/* thermomètre */}
      <g transform={`translate(${XB - 150} ${YG - 160})`}>
        <rect x="-7" y="0" width="14" height="116" rx="7" fill="#fff" stroke="#64748b" strokeWidth="2.5"/><circle cx="0" cy="122" r="12" fill={COL.rouge} stroke="#64748b" strokeWidth="2.5"/>
        <rect x="-3.5" y={116 - th} width="7" height={th + 4} fill={COL.rouge}/>
        <text x="-16" y="30" textAnchor="end" fontSize={15 * Fm} fontWeight="800" fill={COL.rouge} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">{nbf(tm, 2)} °C</text>
      </g>
      {/* réglage de l'énergie fournie */}
      <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Énergie fournie par la plaque" aria-valuemin={400} aria-valuemax={1200} aria-valuenow={p.Q} aria-valuetext={`${p.Q} joules`} onPointerDown={debut('Q')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={ev => clavier('Q', ev)}>
        <rect x="408" y={YG - 58} width="184" height="40" fill="transparent"/>
        <line x1="420" y1={YG - 38} x2="580" y2={YG - 38} stroke="#94a3b8" strokeWidth="6" strokeLinecap="round"/>
        {[400, 800, 1200].map((v, i) => <g key={v}><circle cx={420 + i * 80} cy={YG - 38} r="4" fill="#64748b"/><text x={420 + i * 80} y={YG - 8} textAnchor="middle" fontSize={13 * Fm} fontWeight="700" fill="#475569">{v} J</text></g>)}
        {!L.touche && <circle className="xa-pulse" cx={kx} cy={YG - 38} r="14" fill="none" stroke={COL.Epp} strokeWidth="3"/>}
        <circle className="xa-anneau" cx={kx} cy={YG - 38} r="12" fill="#fff7ed" stroke={COL.Epp} strokeWidth="3.5" filter="url(#xa-ombre)"/>
        <path d={`M ${kx - 6} ${YG - 38} h 12 M ${kx - 3} ${YG - 42} l -4 4 l 4 4 M ${kx + 3} ${YG - 42} l 4 4 l -4 4`} fill="none" stroke={COL.Epp} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <text x="500" y={YG - 66} textAnchor="middle" fontSize={15 * Fm} fontWeight="800" fill={COL.Epp} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">énergie fournie</text>
    </g>);
  };

  return (
    <div ref={boite}>
      <StyleAnim/>
      <div style={{ maxWidth: 920, margin: '0 auto 10px' }}><Seg label="Situation" valeur={p.sit} onChange={changerSit} options={SITS}/></div>
      <svg ref={svgRef} className="xa-svg" viewBox={etroit ? `0 80 ${W} ${H - 80}` : `0 0 ${W} ${H}`} role="img" aria-label="Scène animée : colonnes d’énergie cinétique, potentielle, interne et totale qui suivent le mouvement de la situation choisie.">
        <DefsAnim/>
        <rect width={W} height={H} fill="url(#xa-ciel)"/>
        <rect y={YG} width={W} height={H - YG} fill="url(#xa-sol)"/>
        <line x1="0" y1={YG} x2={W} y2={YG} stroke="#57534e" strokeWidth="3"/>
        {p.sit === 'chute' && sceneChute()}{p.sit === 'glisse' && sceneGlisse()}{p.sit === 'chauffe' && sceneChauffe()}
        {!etroit && <g transform={`translate(${W - 214} 6)`}>
          <rect width="204" height="200" rx="14" fill="white" opacity="0.93" stroke="#cbd5e1"/>
          <text x="102" y="22" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.ink}>Énergies (J)</text>
          {bars.map(([n, v, c], i) => { const xb = 14 + i * 47, h = Math.max(Math.min(v, Emax), 0) / Emax * 116;
            return <g key={n}><rect x={xb} y="52" width="34" height="116" rx="5" fill="#f1f5f9"/><rect x={xb} y={52 + 116 - h} width="34" height={h} rx="5" fill={c}/>
              <text x={xb + 17} y={52 + 116 - h - 5} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={c} stroke="#fff" strokeWidth="3" paintOrder="stroke">{sbVal(v)}</text>
              <text x={xb + 17} y="188" textAnchor="middle" fontSize="14.5" fontWeight="700" fill={c}>{n}</text></g>; })}
        </g>}
      </svg>
      {etroit && <div style={{ ...styleBoite, marginTop: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Énergies</div>
        {bars.map(([n, v, c]) => <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ width: 46, fontWeight: 700, color: c, fontSize: 15 }}>{n}</span>
          <span style={{ flex: 1, height: 16, borderRadius: 8, background: '#f1f5f9', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${Math.max(Math.min(v / Emax, 1), 0) * 100}%`, background: c, borderRadius: 8 }}/></span>
          <span style={{ width: 72, textAlign: 'right', fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 700, color: c }}>{J(v)}</span></div>)}
      </div>}

      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.fin ? 700 : 400, color: L.fin ? '#15803d' : KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={tr.tFin} libelle={p.sit === 'chute' ? '▶ Lâcher' : p.sit === 'glisse' ? '▶ Lancer' : '▶ Chauffer'}/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {p.sit === 'chute' && <Seg label="Masse de la bille" valeur={p.m} onChange={v => regler({ m: v })} options={[[0.2, '0,2 kg'], [0.5, '0,5 kg'], [1, '1 kg']]}/>}
        {p.sit === 'glisse' && <Seg label="Masse du bloc" valeur={p.m} onChange={v => regler({ m: v })} options={[[1, '1 kg'], [2, '2 kg'], [3, '3 kg']]}/>}
        {p.sit === 'chauffe' && <Seg label="Énergie fournie" valeur={p.Q} onChange={v => regler({ Q: v })} options={[[400, '400 J'], [800, '800 J'], [1200, '1 200 J']]}/>}
      </div>
      <Chips items={[['Ec', J(q.Ec), COUL.Ec], ['Ep', J(q.Ep), COUL.Ep], ['ΔU', J(q.U), COUL.U], ['Ec + Ep + ΔU', J(q.Tot), COUL.Tot], [p.sit === 'chauffe' ? 'ΔT' : 'Vitesse v', p.sit === 'chauffe' ? `+${nbf(q.dT, 2)} K` : `${nbf(q.v, 1)} m/s`, COL.v], ['Énergie reçue', J(q.recu), COL.gris]]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        {p.sit === 'chute' && <>Ep = m × g × z, Ec = ½ m v². Au départ : Ep = <strong style={{ color: COL.Ep }}>{J(tr.Etot0)}</strong>. Pendant la chute, Ep diminue exactement de ce que gagne Ec : <strong>l’énergie totale ne change pas</strong> (pas de frottement).</>}
        {p.sit === 'glisse' && <>Ec = ½ m v² = <strong style={{ color: COL.Ec }}>{J(tr.Etot0)}</strong> au départ. Le frottement ralentit le bloc : son énergie cinétique devient énergie interne (le bloc et le sol chauffent), la somme Ec + ΔU reste constante.</>}
        {p.sit === 'chauffe' && <>L’eau ne bouge pas (Ec = 0) et ne change pas d’altitude (Ep constante) : seule l’énergie interne augmente, car elle <strong>reçoit</strong> de l’énergie de la plaque. ΔT = Q ÷ (m × c) avec c = 4 180 J·kg⁻¹·K⁻¹, soit {nbf(p.Q / (M_EAU * 4180), 2)} K pour {J(p.Q)}.</>}
      </div>
      <GrapheTemps frames={framesG} tFin={Math.max(tr.tFin, 0.01)} t={t} Emax={Emax} etroit={etroit} cles={[['Ec', COUL.Ec], ['Ep', COUL.Ep], ['ΔU', COUL.U], ['Total', COUL.Tot, true]]} titre="Les énergies au cours du temps"/>
      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre={p.sit === 'chute' ? `Réglages précis : H = ${nbf(p.H, 1)} m` : p.sit === 'glisse' ? `Réglages précis : v₀ = ${p.v0} m/s` : `Réglages précis : ${p.Q} J`} ouvert={ouv} onBascule={() => setOuv(o => !o)}>
          {p.sit === 'chute' && <Curseur nom="Hauteur de lâcher H" valeur={p.H} onChange={v => regler({ H: Math.round(v * 2) / 2 })} min={1} max={3} pas={0.5} unite="m" decimales={1} couleur={COL.Epp}/>}
          {p.sit === 'glisse' && <Curseur nom="Vitesse initiale v₀" valeur={p.v0} onChange={v => regler({ v0: Math.round(v) })} min={2} max={6} pas={1} unite="m/s" decimales={0} couleur={COL.v}/>}
          {p.sit === 'chauffe' && <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Utilise les boutons « Énergie fournie » ci-dessus.</div>}
          <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Mêmes réglages qu’avec la souris, pour le clavier.</div>
        </Section>
      </div>
    </div>);
}
