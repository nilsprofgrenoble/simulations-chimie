import { useState, useMemo, useRef, useCallback } from "react";
import { KIT, styleBoite, Section, Curseur } from "../commun";
import { trajet, imageA, G, plat } from "./loopingTrajet";
import { COL, nbf, J, Seg, useEtroit, useLecture, coordSvg, StyleAnim, DefsAnim, BarresEnergie, BarresHtml, GrapheTemps, BarreLecture, Chips } from "./exploAnim";

// ====================================================
//  Exploration animée de la simulation 262 (looping).
//  On soulève le wagon en haut de la pente puis on le lâche ; on tire le haut du looping pour changer son rayon.
//  Le mouvement vient de loopingTrajet.js : conservation (ou non) de l'énergie mécanique + force de contact de la piste.
// ====================================================
const S = 20, X0 = 450, YB = 358, W = 700, H = 400;       // 20 px par mètre, bas du looping en (450 ; 358)
const px = x => X0 + x * S, py = z => YB - z * S;
const Lf = R => plat(R);

export function LoopingExplore() {
  const [p, setP] = useState({ m: 200, H: 10, R: 3, f: 0 });
  const [ouv, setOuv] = useState(false);
  const svgRef = useRef(null), drag = useRef(null), boite = useRef(null);
  const etroit = useEtroit(boite);
  const tr = useMemo(() => trajet(p), [p]);
  const L = useLecture(tr.tFin);
  const { t } = L;
  const q = imageA(tr, t), q0 = tr.frames[0];
  const regler = useCallback(ch => { L.reset(); setP(s => ({ ...s, ...ch })); }, [L]);
  const vmin = Math.sqrt(G * p.R);

  const debut = type => ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = { type, bouge: false }; L.setTouche(true); };
  const bouge = ev => {
    const d = drag.current; if (!d) return;
    const { Y } = coordSvg(svgRef.current, ev); d.bouge = true;
    const z = (YB - Y) / S;
    if (d.type === 'wagon') { const h = Math.min(Math.max(Math.round(z / 0.5) * 0.5, 2), 15); if (h !== p.H) regler({ H: h }); }
    else { const r = Math.min(Math.max(Math.round(z / 2 / 0.5) * 0.5, 1.5), 5); if (r !== p.R) regler({ R: r }); }
  };
  const fait = ev => {
    const d = drag.current; drag.current = null;
    try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ }
    if (d && d.type === 'wagon' && d.bouge) L.demarrer();
  };
  const clavier = type => ev => {
    const sens = ev.key === 'ArrowUp' || ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowDown' || ev.key === 'ArrowLeft' ? -1 : 0; if (!sens) return;
    ev.preventDefault(); if (type === 'wagon') regler({ H: Math.min(Math.max(p.H + sens * 0.5, 2), 15) }); else regler({ R: Math.min(Math.max(p.R + sens * 0.5, 1.5), 5) });
  };

  // ---- dessin ----
  const Fm = etroit ? 1.3 : 1;
  const pw = { x: px(q.x), y: py(q.z) }, deg = -q.ang * 180 / Math.PI;
  const pg = { x: px(q0.x), y: py(q0.z) }, degG = -q0.ang * 180 / Math.PI;
  const supports = []; for (let h = 1; h < p.H - 0.2; h += 1.5) supports.push(h);
  const traine = []; { const n = Math.floor(t * 120), pas = 8; for (let i = 0; i <= n && i < tr.frames.length; i += pas) traine.push(tr.frames[i]); }
  const Emax = Math.max(tr.E0, 1) * 1.05;
  const dansLoop = q.ph === 'loop', contact = dansLoop ? q.N >= 0 : null;
  const cN = { x: px(0), y: py(p.R) };
  const nLong = dansLoop && q.N > 0 ? Math.min(q.N / (p.m * G) * 14, 56) : 0;
  const dirN = dansLoop ? { x: cN.x - pw.x, y: cN.y - pw.y } : { x: 0, y: 0 }, nn = Math.hypot(dirN.x, dirN.y) || 1;
  const Em0txt = J(tr.E0);
  const message = !L.touche && !L.joue && t === 0 ? 'Soulève le wagon en haut de la pente puis lâche-le, ou appuie sur « Lâcher ». Tu peux aussi saisir le haut du looping pour changer son rayon.'
    : !L.fin ? '' : tr.issue === 'passe' ? `Le wagon passe le looping : au sommet, sa vitesse est ${nbf(tr.vTop, 1)} m/s, supérieure à √(g R) = ${nbf(vmin, 1)} m/s.`
    : tr.issue === 'decroche' ? 'Le wagon perd le contact avec la piste : il va trop lentement pour rester collé au rail, il décroche avant d’arriver au sommet.'
    : tr.issue === 'recule' ? 'Le wagon n’a pas assez d’énergie pour franchir le looping : il remonte puis redescend en arrière.' : 'Le wagon s’arrête : le frottement le retient.';
  const ok = L.fin && tr.issue === 'passe';

  return (
    <div ref={boite}>
      <StyleAnim/>
      <svg ref={svgRef} className="xa-svg" viewBox={etroit ? `0 20 ${W} ${H - 20}` : `0 0 ${W} ${H}`} role="img" aria-label="Scène animée : un wagon est lâché en haut d’une pente, descend, parcourt un looping circulaire puis repart ; les barres d’énergie et la force de la piste suivent son mouvement.">
        <DefsAnim/>
        <rect width={W} height={H} fill="url(#xa-ciel)"/>
        <path d={`M0,${YB - 40} C150,${YB - 110} 300,${YB - 20} 430,${YB - 70} C540,${YB - 105} 620,${YB - 40} ${W},${YB - 80} L${W},${YB} L0,${YB} Z`} fill="#dbeafe" opacity="0.7"/>
        <rect y={YB} width={W} height={H - YB} fill="url(#xa-sol)"/>
        <line x1="0" y1={YB} x2={W} y2={YB} stroke="#57534e" strokeWidth="3"/>
        {Array.from({ length: 35 }, (_, i) => <line key={i} x1={i * 21} y1={YB + 6} x2={i * 21 - 12} y2={YB + 24} stroke="#78716c" strokeWidth="1.2" opacity="0.45" style={{ display: YB + 6 > H ? 'none' : undefined }}/>)}
        {/* supports sous la pente */}
        {supports.map(h => <line key={h} x1={px(-Lf(p.R) - p.H + h)} y1={py(p.H - h)} x2={px(-Lf(p.R) - p.H + h)} y2={YB} stroke="#cbd5e1" strokeWidth="3"/>)}
        {/* piste : pente + looping + sortie */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={`M ${px(-Lf(p.R) - p.H)} ${py(p.H)} L ${px(-Lf(p.R))} ${py(0)} L ${px(0) + (1.5 * p.R + 3) * S} ${py(0)}`} stroke="#334155" strokeWidth="9"/>
          <circle cx={px(0)} cy={py(p.R)} r={p.R * S} stroke="#334155" strokeWidth="9"/>
          <path d={`M ${px(-Lf(p.R) - p.H)} ${py(p.H)} L ${px(-Lf(p.R))} ${py(0)} L ${px(0) + (1.5 * p.R + 3) * S} ${py(0)}`} stroke="#94a3b8" strokeWidth="4"/>
          <circle cx={px(0)} cy={py(p.R)} r={p.R * S} stroke="#94a3b8" strokeWidth="4"/>
        </g>
        {/* repères */}
        <line x1={px(-Lf(p.R) - p.H) - 10} y1={py(p.H)} x2={px(-Lf(p.R)) + 40} y2={py(p.H)} stroke={COL.Em} strokeWidth="1.5" strokeDasharray="6 5" opacity="0.8"/>
        <text x={px(-Lf(p.R) - p.H / 2) } y={py(p.H) - 9} textAnchor="middle" fontSize={17 * Fm} fontWeight="700" fill={COL.Em}>H = {nbf(p.H, 1)} m</text>
        <text x={px(0)} y={py(p.R) + 6} textAnchor="middle" fontSize={17 * Fm} fontWeight="700" fill={COL.Epp}>R = {nbf(p.R, 1)} m</text>
        {/* traînée */}
        {traine.map((c, i) => <circle key={i} cx={px(c.x)} cy={py(c.z)} r={2 + 2 * i / Math.max(traine.length, 1)} fill={COL.Ec} opacity={0.15 + 0.5 * i / Math.max(traine.length, 1)}/>)}
        {/* force de la piste */}
        {nLong > 3 && <line x1={pw.x} y1={pw.y} x2={pw.x + dirN.x / nn * (nLong + 14)} y2={pw.y + dirN.y / nn * (nLong + 14)} stroke="#0891b2" strokeWidth="4" strokeLinecap="round" markerEnd="url(#xa-pointe-c)"/>}
        <defs><marker id="xa-pointe-c" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#0891b2"/></marker></defs>
        {/* wagon */}
        <g transform={`translate(${pw.x} ${pw.y}) rotate(${deg})`} filter="url(#xa-ombre)" pointerEvents="none">
          <rect x="-19" y="-19" width="38" height="15" rx="5" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2"/>
          <rect x="-10" y="-25" width="20" height="8" rx="3" fill="#fecaca" stroke="#7f1d1d" strokeWidth="1.5"/>
          <circle cx="-11" cy="-4" r="4.5" fill="#334155" stroke="#0f172a" strokeWidth="1.5"/><circle cx="11" cy="-4" r="4.5" fill="#334155" stroke="#0f172a" strokeWidth="1.5"/>
        </g>
        {q.v > 0.3 && !L.fin && <line x1={pw.x} y1={pw.y - 4} x2={pw.x + Math.min(q.v * 3, 70) * Math.cos(q.ang)} y2={pw.y - 4 - Math.min(q.v * 3, 70) * Math.sin(q.ang)} stroke="#15803d" strokeWidth="4" strokeLinecap="round" markerEnd="url(#xa-pointe)"/>}
        {/* poignée : le wagon au départ (fantôme ensuite) */}
        <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Wagon : soulever ou descendre pour régler la hauteur de départ" aria-valuemin={2} aria-valuemax={15} aria-valuenow={p.H} aria-valuetext={`${nbf(p.H, 1)} mètres`}
          onPointerDown={debut('wagon')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier('wagon')}>
          <circle cx={pg.x} cy={pg.y - 8} r="34" fill="transparent"/>
          <circle className="xa-anneau" cx={pg.x} cy={pg.y - 8} r="26" fill="none" stroke="transparent"/>
          {t > 0 && <g transform={`translate(${pg.x} ${pg.y}) rotate(${degG})`} opacity="0.35"><rect x="-19" y="-19" width="38" height="15" rx="5" fill="#fecaca" stroke="#dc2626" strokeWidth="2" strokeDasharray="5 4"/></g>}
        </g>
        {!L.touche && !L.joue && t === 0 && <g className="xa-tire" pointerEvents="none"><path d={`M ${pg.x + 34} ${pg.y - 38} l 0 26 m -8 -9 l 8 9 l 8 -9`} fill="none" stroke="#0369a1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/><text x={pg.x + 50} y={pg.y - 26} fontSize={16 * Fm} fontWeight="700" fill="#0369a1" stroke="#fff" strokeWidth="4" paintOrder="stroke">soulève</text></g>}
        {/* poignée du haut du looping : rayon */}
        <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Haut du looping : rayon" aria-valuemin={1.5} aria-valuemax={5} aria-valuenow={p.R} aria-valuetext={`${nbf(p.R, 1)} mètres`}
          onPointerDown={debut('rayon')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier('rayon')}>
          <circle cx={px(0)} cy={py(2 * p.R)} r="26" fill="transparent"/>
          {!L.touche && <circle className="xa-pulse" cx={px(0)} cy={py(2 * p.R)} r="14" fill="none" stroke={COL.Epp} strokeWidth="3"/>}
          <circle className="xa-anneau" cx={px(0)} cy={py(2 * p.R)} r="12" fill="#fff7ed" stroke={COL.Epp} strokeWidth="3.5" filter="url(#xa-ombre)"/>
          <path d={`M ${px(0)} ${py(2 * p.R) - 6} v 12 M ${px(0) - 4} ${py(2 * p.R) - 2} l 4 -4 l 4 4 M ${px(0) - 4} ${py(2 * p.R) + 2} l 4 4 l 4 -4`} fill="none" stroke={COL.Epp} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        {!etroit && <BarresEnergie q={q} E0={tr.E0} Emax={Emax} x={W - 204} y={6}/>}
      </svg>
      {etroit && <BarresHtml q={q} E0={tr.E0} Emax={Emax}/>}

      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.fin ? 700 : 400, color: L.fin ? (ok ? '#15803d' : '#b91c1c') : KIT.txt2 }}>{message}</div>

      <BarreLecture L={L} tFin={tr.tFin} libelle="▶ Lâcher"/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Masse du wagon" valeur={p.m} onChange={v => regler({ m: v })} options={[[100, '100 kg'], [200, '200 kg'], [500, '500 kg']]}/>
        <Seg label="Frottement le long de la piste" valeur={p.f} onChange={v => regler({ f: v })} options={[[0, 'aucun'], [20, 'faible'], [50, 'moyen'], [100, 'fort']]}/>
      </div>
      <Chips items={[['Vitesse v', `${nbf(q.v, 1)} m/s`, COL.v], ['Altitude z', `${nbf(q.z, 1)} m`], ['Ec', J(q.Ec), COL.Ec], ['Epp', J(q.Epp), COL.Epp], ['Em', J(q.Em), COL.Em], ['Contact piste', dansLoop ? (contact ? 'oui' : 'perdu') : '—', contact === false ? COL.rouge : '#0891b2']]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        Énergie mécanique au départ : Em = m × g × H = <strong style={{ color: COL.Em }}>{Em0txt}</strong>. Pour rester collé à la piste au sommet, il faut v ≥ √(g R) = <strong style={{ color: '#15803d' }}>{nbf(vmin, 1)} m/s</strong> ; sans frottement, cela demande H ≥ 2,5 R = {nbf(2.5 * p.R, 1)} m.
      </div>
      <GrapheTemps frames={tr.frames} tFin={tr.tFin} t={t} Emax={Emax} etroit={etroit}/>
      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre={`Réglages précis : H = ${nbf(p.H, 1)} m · R = ${nbf(p.R, 1)} m`} ouvert={ouv} onBascule={() => setOuv(o => !o)}>
          <Curseur nom="Hauteur de départ H" valeur={p.H} onChange={v => regler({ H: Number(v.toFixed(1)) })} min={2} max={15} pas={0.5} unite="m" decimales={1} couleur={COL.Em}/>
          <Curseur nom="Rayon du looping R" valeur={p.R} onChange={v => regler({ R: Number(v.toFixed(1)) })} min={1.5} max={5} pas={0.5} unite="m" decimales={1} couleur={COL.Epp}/>
          <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Mêmes réglages qu’avec la souris, pour le clavier.</div>
        </Section>
      </div>
    </div>);
}
