import { useState, useMemo, useRef, useCallback } from "react";
import { KIT, styleBoite, Section, Curseur } from "../commun";
import { trajet, plat } from "./chuteTrajet";
import { COL, nbf, J, imageA, Seg, useEtroit, useLecture, coordSvg, StyleAnim, DefsAnim, BarresEnergie, BarresHtml, GrapheTemps, BarreLecture, Chips } from "./exploAnim";

// ====================================================
//  Exploration animée de la simulation 261 (chute d'une hauteur h le long d'une rampe).
//  On lâche l'objet (clic sur lui ou bouton) ; on saisit le haut de la rampe pour changer h et la pente.
//  Mouvement : chuteTrajet.js (travail du poids, frottement constant, suite sur le sol).
// ====================================================
const W = 700, H = 400, X0 = 50, YB = 350;

export function ChuteExplore() {
  const [p, setP] = useState({ m: 2, h: 5, s: 0.5, f: 0 });
  const [ouv, setOuv] = useState(false), [fige, setFige] = useState(null);
  const svgRef = useRef(null), drag = useRef(null), boite = useRef(null);
  const etroit = useEtroit(boite);
  const tr = useMemo(() => trajet(p), [p]);
  const L = useLecture(tr.tFin);
  const { t } = L;
  const q = imageA(tr.frames, t);
  const regler = useCallback(ch => { L.reset(); setP(s => ({ ...s, ...ch })); }, [L]);

  // échelle : s'ajuste à la rampe, mais reste figée pendant qu'on la déforme à la souris
  const run = tr.run, Sauto = Math.min((W - X0 - 30) / (run + plat(run)), 255 / p.h), S = fige || Sauto;
  const px = x => X0 + x * S, py = z => YB - z * S;
  const cs = Math.sqrt(1 - p.s * p.s), ang = Math.asin(p.s);

  const debut = type => ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = { type, bouge: false }; if (type === 'rampe') setFige(Sauto); L.setTouche(true); };
  const bouge = ev => {
    const d = drag.current; if (!d || d.type !== 'rampe') return;
    const { X, Y } = coordSvg(svgRef.current, ev); d.bouge = true;
    const h = Math.min(Math.max(Math.round((YB - Y) / S), 2), 10), dx = Math.max((X - X0) / S, 0.5);
    const s = Math.min(Math.max(Math.round(Math.sin(Math.atan2(h, dx)) / 0.05) * 0.05, 0.25), 0.85);
    if (h !== p.h || Math.abs(s - p.s) > 1e-9) regler({ h, s: Number(s.toFixed(2)) });
  };
  const fait = ev => {
    const d = drag.current; drag.current = null;
    try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ }
    if (d && d.type === 'rampe') setFige(null);
    if (d && d.type === 'objet' && !d.bouge) L.demarrer();
  };
  const clavier = ev => {
    const sens = ev.key === 'ArrowUp' || ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowDown' || ev.key === 'ArrowLeft' ? -1 : 0; if (!sens) return;
    ev.preventDefault(); regler({ h: Math.min(Math.max(p.h + sens, 2), 10) });
  };

  const Fm = etroit ? 1.3 : 1;
  const bw = 30 + 3 * Math.sqrt(p.m * 2), bh = 22 + 2 * Math.sqrt(p.m * 2);          // taille de la caisse selon la masse
  const poseR = f => ({ x: px(f.x) - Math.sin(ang) * bh / 2 * (f.ph === 'R' ? 1 : 0), y: py(f.z) - (f.ph === 'R' ? Math.cos(ang) * bh / 2 : bh / 2) });
  const bPos = poseR(q), b0 = poseR(tr.frames[0]);
  const degB = q.ph === 'R' ? ang * 180 / Math.PI : 0;
  const traine = []; { const n = Math.floor(t * 120); for (let i = 0; i <= n && i < tr.frames.length; i += 9) traine.push(tr.frames[i]); }
  const Emax = Math.max(tr.Em0, 1) * 1.05;
  const nRug = Math.max(Math.round(tr.L * S / 14), 6);
  const rug = p.f > 0 ? Array.from({ length: nRug }, (_, i) => (i + 0.5) / nRug * tr.L) : [];
  const rugPlat = p.f > 0 ? Array.from({ length: Math.round((plat(run)) * S / 14) }, (_, i) => run + i * 14 / S + 0.3) : [];
  const message = !L.touche && !L.joue && t === 0 ? 'Clique sur la caisse (ou sur « Lâcher ») pour la faire glisser. Saisis le haut de la rampe pour changer sa hauteur et sa pente.'
    : tr.issue === 'immobile' ? 'La caisse ne glisse pas : la force de frottement est trop grande pour la pente. Change la pente ou le frottement.'
    : !L.fin ? '' : tr.issue === 'arret' ? `En bas de la rampe, v = ${nbf(tr.vBas, 1)} m/s ; la caisse s’arrête ensuite à ${nbf(tr.xArret - run, 1)} m. Toute l’énergie a été dissipée par le frottement.`
    : `En bas de la rampe, v = ${nbf(tr.vBas, 1)} m/s${p.f > 0 ? ` ; ${nbf(tr.dissBas, 0)} J ont déjà été dissipés par le frottement` : ''}. Elle continue sur le sol.`;

  return (
    <div ref={boite}>
      <StyleAnim/>
      <svg ref={svgRef} className="xa-svg" viewBox={etroit ? `0 60 ${W} ${H - 60}` : `0 0 ${W} ${H}`} role="img" aria-label="Scène animée : une caisse est lâchée en haut d’une rampe, glisse, puis continue sur le sol ; les barres d’énergie suivent son mouvement.">
        <DefsAnim/>
        <rect width={W} height={H} fill="url(#xa-ciel)"/>
        <path d={`M0,${YB - 40} C150,${YB - 100} 300,${YB - 20} 430,${YB - 60} C540,${YB - 95} 620,${YB - 40} ${W},${YB - 75} L${W},${YB} L0,${YB} Z`} fill="#dbeafe" opacity="0.7"/>
        <rect y={YB} width={W} height={H - YB} fill="url(#xa-sol)"/>
        <line x1="0" y1={YB} x2={W} y2={YB} stroke="#57534e" strokeWidth="3"/>
        {Array.from({ length: 35 }, (_, i) => <line key={i} x1={i * 21} y1={YB + 6} x2={i * 21 - 12} y2={YB + 22} stroke="#78716c" strokeWidth="1.2" opacity="0.45"/>)}
        {/* rampe */}
        <polygon points={`${px(0)},${py(p.h)} ${px(run)},${YB} ${px(0)},${YB}`} fill="url(#xa-acier)" stroke="#64748b" strokeWidth="1.5" filter="url(#xa-ombre)"/>
        <line x1={px(0)} y1={py(p.h)} x2={px(run)} y2={YB} stroke="#334155" strokeWidth="5" strokeLinecap="round"/>
        {rug.map((s0, i) => <path key={i} d={`M ${px(s0 * cs)} ${py(p.h - s0 * p.s)} l ${(-p.s * (5 + p.f * 1.6)).toFixed(1)} ${(-cs * (5 + p.f * 1.6)).toFixed(1)}`} stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" opacity="0.85"/>)}
        {rugPlat.map((x, i) => <path key={'p' + i} d={`M ${px(x)} ${YB} l 0 ${-(4 + p.f * 1.4)}`} stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" opacity="0.85"/>)}
        <line x1={px(0) - 8} y1={py(p.h)} x2={px(0) - 8} y2={YB} stroke={COL.Em} strokeWidth="2"/>
        <text x={px(0) + 10} y={(py(p.h) + YB) / 2 + 5} textAnchor="start" fontSize={17 * Fm} fontWeight="700" fill={COL.Em}>h = {nbf(p.h, 0)} m</text>
        <text x={px(run * 0.78)} y={YB - 8} textAnchor="end" fontSize={15 * Fm} fontWeight="700" fill={COL.Epp} opacity="0.95" style={{ display: run * S > 150 ? undefined : 'none' }}>L = {nbf(tr.L, 1)} m</text>
        {/* traînée */}
        {traine.map((c, i) => <circle key={i} cx={px(c.x)} cy={py(c.z) - 3} r={2 + 2 * i / Math.max(traine.length, 1)} fill={COL.Ec} opacity={0.12 + 0.45 * i / Math.max(traine.length, 1)}/>)}
        {/* caisse */}
        <g transform={`translate(${bPos.x} ${bPos.y}) rotate(${degB})`} filter="url(#xa-ombre)" pointerEvents="none">
          <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx="4" fill="#d97706" stroke="#7c2d12" strokeWidth="2.5"/>
          <path d={`M ${-bw / 2} ${-bh / 2} L ${bw / 2} ${bh / 2} M ${bw / 2} ${-bh / 2} L ${-bw / 2} ${bh / 2}`} stroke="#92400e" strokeWidth="1.5" opacity="0.7"/>
          <rect x={-bw / 2 + 4} y={-6} width={bw - 8} height="12" rx="3" fill="#fef3c7"/>
          <text x="0" y="4.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="#7c2d12">{nbf(p.m, 0)} kg</text>
        </g>
        {q.v > 0.3 && !L.fin && <line x1={bPos.x} y1={bPos.y - bh / 2 - 6} x2={bPos.x + Math.min(q.v * 4, 80) * (q.ph === 'R' ? cs : 1)} y2={bPos.y - bh / 2 - 6 + (q.ph === 'R' ? Math.min(q.v * 4, 80) * p.s : 0)} stroke="#15803d" strokeWidth="4" strokeLinecap="round" markerEnd="url(#xa-pointe)"/>}
        {/* la caisse au départ : un clic la lâche */}
        <g className="xa-poignee" role="button" tabIndex={0} aria-label="Caisse : cliquer pour la lâcher" style={{ cursor: 'pointer' }} onPointerDown={debut('objet')} onPointerUp={fait} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); L.demarrer(); } }}>
          <circle cx={b0.x} cy={b0.y} r={Math.max(bw, bh) * 0.9} fill="transparent"/>
          {t > 0 && <g transform={`translate(${b0.x} ${b0.y}) rotate(${ang * 180 / Math.PI})`} opacity="0.4"><rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx="4" fill="#fde68a" stroke="#d97706" strokeWidth="2" strokeDasharray="5 4"/></g>}
        </g>
        {!L.touche && !L.joue && t === 0 && <g className="xa-tire" pointerEvents="none"><text x={b0.x + bw} y={b0.y - bh - 4} fontSize={16 * Fm} fontWeight="700" fill="#0369a1" stroke="#fff" strokeWidth="4" paintOrder="stroke">clique</text></g>}
        {/* poignée du haut de la rampe */}
        <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Haut de la rampe : hauteur" aria-valuemin={2} aria-valuemax={10} aria-valuenow={p.h} aria-valuetext={`${nbf(p.h, 0)} mètres`}
          onPointerDown={debut('rampe')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier}>
          <circle cx={px(0)} cy={py(p.h)} r="26" fill="transparent"/>
          {!L.touche && <circle className="xa-pulse" cx={px(0)} cy={py(p.h)} r="14" fill="none" stroke={COL.Epp} strokeWidth="3"/>}
          <circle className="xa-anneau" cx={px(0)} cy={py(p.h)} r="12" fill="#fff7ed" stroke={COL.Epp} strokeWidth="3.5" filter="url(#xa-ombre)"/>
          <path d={`M ${px(0)} ${py(p.h) - 6} v 12 M ${px(0) - 4} ${py(p.h) - 2} l 4 -4 l 4 4 M ${px(0) - 4} ${py(p.h) + 2} l 4 4 l 4 -4`} fill="none" stroke={COL.Epp} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        {!etroit && <BarresEnergie q={q} E0={tr.Em0} Emax={Emax} x={W - 204} y={6}/>}
      </svg>
      {etroit && <BarresHtml q={q} E0={tr.Em0} Emax={Emax}/>}

      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.fin ? 700 : 400, color: L.fin ? '#15803d' : KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={tr.tFin} libelle="▶ Lâcher" desactive={tr.issue === 'immobile'}/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Masse de la caisse" valeur={p.m} onChange={v => regler({ m: v })} options={[[1, '1 kg'], [2, '2 kg'], [5, '5 kg'], [10, '10 kg']]}/>
        <Seg label="Force de frottement" valeur={p.f} onChange={v => regler({ f: v })} options={[[0, 'aucune'], [1, '1 N'], [3, '3 N'], [8, '8 N']]}/>
      </div>
      <Chips items={[['Vitesse v', `${nbf(q.v, 1)} m/s`, COL.v], ['Altitude z', `${nbf(q.z, 1)} m`], ['Ec', J(q.Ec), COL.Ec], ['Epp', J(q.Epp), COL.Epp], ['Em', J(q.Em), COL.Em], ['Énergie dissipée', J(Math.max(q.diss, 0)), COL.rouge]]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        Au départ : Em = m × g × h = <strong style={{ color: COL.Em }}>{J(tr.Em0)}</strong>. Sans frottement, Em reste constante : en bas, v = √(2 g h) = <strong style={{ color: '#15803d' }}>{nbf(Math.sqrt(2 * 9.8 * p.h), 1)} m/s</strong>, quelle que soit la masse et la pente. Avec frottement, l’énergie dissipée vaut f × (distance parcourue).
      </div>
      <GrapheTemps frames={tr.frames} tFin={Math.max(tr.tFin, 0.01)} t={t} Emax={Emax} etroit={etroit}/>
      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre={`Réglages précis : h = ${nbf(p.h, 0)} m · pente sin α = ${nbf(p.s, 2)}`} ouvert={ouv} onBascule={() => setOuv(o => !o)}>
          <Curseur nom="Hauteur de départ h" valeur={p.h} onChange={v => regler({ h: Math.round(v) })} min={2} max={10} pas={1} unite="m" decimales={0} couleur={COL.Em}/>
          <Curseur nom="Pente de la rampe (sin α)" valeur={p.s} onChange={v => regler({ s: Number(v.toFixed(2)) })} min={0.25} max={0.85} pas={0.05} unite="" decimales={2} couleur={COL.Epp}/>
          <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Longueur de la rampe : L = h ÷ sin α = {nbf(tr.L, 1)} m. Mêmes réglages qu’avec la souris, pour le clavier.</div>
        </Section>
      </div>
    </div>);
}
