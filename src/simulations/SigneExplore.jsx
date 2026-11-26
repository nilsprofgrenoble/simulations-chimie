import { useRef, useState } from "react";
import { KIT, styleBoite } from "../commun";
import { NB } from "./Distillation";
import { nbf, Seg, useEtroit, coordSvg, StyleAnim } from "./exploAnim";
import * as M from "./signeModele";
import { useHorloge } from "./PanneauSceneAnim";

// ====================================================
//  Exploration animée de la simulation 238 (conservation de l'énergie, bilan et signe des transferts).
//  Trois systèmes (batterie, bloc de cuivre, air) échangent de l'énergie : on choisit le système en cliquant sur sa case,
//  les flèches deviennent vertes (énergie reçue, valeur positive) ou rouges (énergie cédée, valeur négative), grises si le système n'est pas concerné.
//  Deux poignées règlent le travail électrique W et la part Q cédée à l'air. Tout vient de signeModele.js.
// ====================================================
const C = { v: '#15803d', r: '#dc2626', g: '#94a3b8', vio: '#6d28d9', ink: '#0f172a', or: '#ea580c' };
const sg = v => (v === 0 ? `0${NB}J` : `${v > 0 ? '+' : '−'}${nbf(Math.abs(v), 0)}${NB}J`);
const NOMS = { batterie: 'Batterie', bloc: 'Bloc de cuivre', air: 'Air de la pièce' };
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

export function SigneExplore({ ti, setTi }) {
  const boite = useRef(null), svgRef = useRef(null), drag = useRef(null);
  const etroit = useEtroit(boite);
  const anim = useHorloge();
  const [touche, setTouche] = useState(false);
  const { sys, W, f, dt } = ti, Q = f * W;
  const regler = ch => setTi(s => ({ ...s, ...ch }));
  const dE = id => M.somme(id, W, f);
  const dTbloc = M.deltaT(dE('bloc'));
  // géométrie
  const TW = etroit ? 160 : 164, TH = etroit ? 104 : 126;
  const pos = etroit ? { batterie: [90, 10], bloc: [90, 170], air: [90, 330] } : { batterie: [12, 24], bloc: [268, 24], air: [524, 24] };
  const centre = id => [pos[id][0] + TW / 2, pos[id][1] + TH / 2];
  const arc = (a, b) => etroit ? { x1: centre(a)[0], y1: pos[a][1] + TH, x2: centre(b)[0], y2: pos[b][1] } : { x1: pos[a][0] + TW, y1: centre(a)[1], x2: pos[b][0], y2: centre(b)[1] };
  const fl = [{ id: 'W', de: 'batterie', vers: 'bloc', val: W, type: 'W' }, { id: 'Q', de: 'bloc', vers: 'air', val: Q, type: 'Q' }];
  const impact = fl2 => (sys === fl2.de ? -fl2.val : sys === fl2.vers ? fl2.val : null);   // valeur algébrique pour le système étudié, null si non concerné

  // poignées : W et f
  const trW = etroit ? { x: 30, w: 280, y: 490 } : { x: 30, w: 290, y: 232 }, trF = etroit ? { x: 30, w: 280, y: 560 } : { x: 380, w: 290, y: 232 };
  const iW = M.W_VALEURS.indexOf(W), iF = M.F_VALEURS.indexOf(f);
  const xW = i => trW.x + trW.w * i / (M.W_VALEURS.length - 1), xF = i => trF.x + trF.w * i / (M.F_VALEURS.length - 1);
  const debut = k => ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = k; setTouche(true); bouge(ev); };
  const bouge = ev => {
    if (!drag.current) return;
    const { X } = coordSvg(svgRef.current, ev);
    if (drag.current === 'W') { const i = Math.min(Math.max(Math.round((X - trW.x) / trW.w * (M.W_VALEURS.length - 1)), 0), M.W_VALEURS.length - 1); if (M.W_VALEURS[i] !== W) regler({ W: M.W_VALEURS[i] }); }
    else { const i = Math.min(Math.max(Math.round((X - trF.x) / trF.w * (M.F_VALEURS.length - 1)), 0), M.F_VALEURS.length - 1); if (M.F_VALEURS[i] !== f) regler({ f: M.F_VALEURS[i] }); }
  };
  const fait = ev => { drag.current = null; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const clav = (k, i, liste) => ev => {
    const s = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : 0; if (!s) return;
    ev.preventDefault(); const j = Math.min(Math.max(i + s, 0), liste.length - 1); regler(k === 'W' ? { W: liste[j] } : { f: liste[j] });
  };

  const bilan = dE(sys);
  const sysNom = M.SYSTEMES.find(s => s.id === sys).nom;
  const message = !touche ? 'Clique sur une case pour choisir le système, tire la poignée de W (travail électrique) et celle de la part cédée à l’air : les signes suivent le système choisi.'
    : `Pour ${sysNom} : somme des transferts = ${sg(bilan)} → son énergie stockée ${M.sens(bilan)}.`;
  const hVB = etroit ? 620 : 290;
  const tuile = id => {
    const [x, y] = pos[id], sel = id === sys, d = dE(id);
    const tint = id === 'bloc' ? mix([186, 230, 253], [252, 165, 165], Math.max(0, Math.min(dTbloc / 6.5, 1))) : id === 'air' ? mix([240, 249, 255], [254, 226, 226], Math.min(dE('air') / 1200, 1)) : [254, 249, 195];
    return (
      <g key={id} role="button" tabIndex={0} aria-pressed={sel} aria-label={`Choisir ${NOMS[id]} comme système`} style={{ cursor: 'pointer' }}
        onClick={() => { setTouche(true); regler({ sys: id }); }} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setTouche(true); regler({ sys: id }); } }}>
        {sel && <rect x={x - 7} y={y - 7} width={TW + 14} height={TH + 14} rx="18" fill="none" stroke={C.or} strokeWidth="4" strokeDasharray="9 6"/>}
        <rect x={x} y={y} width={TW} height={TH} rx="14" fill={`rgb(${tint[0]},${tint[1]},${tint[2]})`} stroke={sel ? C.or : '#64748b'} strokeWidth={sel ? 3.5 : 2.5} filter="url(#sgx-ombre)"/>
        <text x={x + TW / 2} y={y + 24} textAnchor="middle" fontSize={etroit ? 15 : 16} fontWeight="800" fill={C.ink}>{NOMS[id]}</text>
        {id === 'batterie' && <g><rect x={x + TW / 2 - 28} y={y + 36} width="56" height={etroit ? 22 : 28} rx="5" fill="#fff" stroke="#334155" strokeWidth="2.5"/>
          <rect x={x + TW / 2 - 25} y={y + 39} width={50 * Math.max(0.1, 1 - W / 1500)} height={etroit ? 16 : 22} rx="3" fill="#16a34a"/><rect x={x + TW / 2 + 28} y={y + 44} width="5" height="10" fill="#334155"/></g>}
        {id === 'bloc' && <g><rect x={x + TW / 2 - 30} y={y + 36} width="60" height={etroit ? 22 : 28} rx="5" fill="#d97706" stroke="#78350f" strokeWidth="2.5"/><text x={x + TW / 2} y={y + (etroit ? 52 : 56)} textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">Cu</text>
          {dTbloc > 0.05 && Array.from({ length: 3 }, (_, k) => <path key={k} d={`M ${x + TW / 2 - 18 + k * 18} ${y + 32} q 5 -6 0 -12`} stroke="#ef4444" strokeWidth="2.5" fill="none" opacity={0.4 + 0.5 * Math.abs(Math.sin(anim * 3 + k))}/>)}</g>}
        {id === 'air' && <g>{Array.from({ length: 5 }, (_, k) => <circle key={k} cx={x + TW / 2 - 40 + k * 20} cy={y + 46 + 8 * Math.sin(anim * 2 + k)} r="4" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5"/>)}</g>}
        <text x={x + TW / 2} y={y + TH - (etroit ? 34 : 38)} textAnchor="middle" fontSize="12.5" fill="#475569">énergie stockée</text>
        <text x={x + TW / 2} y={y + TH - (etroit ? 14 : 16)} textAnchor="middle" fontSize={etroit ? 14 : 16} fontWeight="800" fill={C.vio}>ΔE = {sg(d)} {d > 0 ? '↑' : d < 0 ? '↓' : ''}</text>
      </g>);
  };

  return (
    <div ref={boite}>
      <StyleAnim/>
      <svg ref={svgRef} className="xa-svg" viewBox={etroit ? `0 0 340 ${hVB}` : `0 0 700 ${hVB}`} role="img"
        aria-label={`Trois systèmes : la batterie cède ${sg(-W)} au bloc de cuivre, qui cède ${sg(-Q)} à l'air. Système étudié : ${sysNom}, bilan ${sg(bilan)}.`}>
        <defs><filter id="sgx-ombre" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.25"/></filter></defs>
        <rect width="700" height="700" fill="#f8fafc"/>
        {/* flèches d'énergie */}
        {fl.map(a => {
          const g = arc(a.de, a.vers), v = impact(a), col = v === null ? C.g : v > 0 ? C.v : C.r, ep = 4 + 16 * a.val / 1200;
          const n = Math.max(0, Math.round(1 + 8 * a.val / 1200)), L = Math.hypot(g.x2 - g.x1, g.y2 - g.y1);
          const mx = (g.x1 + g.x2) / 2, my = (g.y1 + g.y2) / 2;
          return (
            <g key={a.id} opacity={a.val === 0 ? 0.35 : 1}>
              <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke={col} strokeWidth={ep} strokeLinecap="round" opacity="0.4"/>
              {Array.from({ length: n }, (_, k) => { const s = (anim * 0.5 + k / n) % 1; return <circle key={k} cx={g.x1 + (g.x2 - g.x1) * s} cy={g.y1 + (g.y2 - g.y1) * s} r={Math.max(3, ep * 0.35)} fill={col} stroke="#fff" strokeWidth="1.5"/>; })}
              <path d={etroit ? `M ${g.x2 - 12} ${g.y2 - 4} L ${g.x2} ${g.y2 + 8} L ${g.x2 + 12} ${g.y2 - 4}` : `M ${g.x2 - 4} ${g.y2 - 12} L ${g.x2 + 8} ${g.y2} L ${g.x2 - 4} ${g.y2 + 12}`} fill="none" stroke={col} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" display={L > 20 ? undefined : 'none'}/>
              <text x={etroit ? mx + 14 : mx} y={etroit ? my - 2 : my - 22} textAnchor={etroit ? 'start' : 'middle'} fontSize="14" fontWeight="800" fill={col === C.g ? '#475569' : col} stroke="#f8fafc" strokeWidth="4" paintOrder="stroke">{a.type === 'W' ? 'Travail W' : 'Transfert Q'}</text>
              <text x={etroit ? mx + 14 : mx} y={etroit ? my + 18 : my + 34} textAnchor={etroit ? 'start' : 'middle'} fontSize="15" fontWeight="800" fill={col === C.g ? '#475569' : col} stroke="#f8fafc" strokeWidth="4" paintOrder="stroke">{v === null ? 'non concerné' : sg(v)}</text>
            </g>);
        })}
        {['batterie', 'bloc', 'air'].map(tuile)}
        {/* poignées */}
        {[['W', trW, M.W_VALEURS, iW, xW, 'Travail électrique cédé par la batterie (J)', '#0369a1', v => `${v}`], ['f', trF, M.F_VALEURS, iF, xF, 'Part de W cédée à l’air par le bloc', '#b45309', v => `${Math.round(100 * v)} %`]].map(([k, tr, liste, i, xf, lib, col, aff]) => (
          <g key={k}>
            <text x={tr.x} y={tr.y - 28} fontSize="14" fontWeight="800" fill={col}>{lib}</text>
            <line x1={tr.x} y1={tr.y + 12} x2={tr.x + tr.w} y2={tr.y + 12} stroke="#7c6f57" strokeWidth="6" strokeLinecap="round"/>
            {liste.map((v, j) => <text key={j} x={xf(j)} y={tr.y - 9} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#334155">{aff(v)}</text>)}
            <rect x={tr.x - 14} y={tr.y - 8} width={tr.w + 28} height="40" fill="transparent" style={{ cursor: 'pointer', touchAction: 'none' }} onPointerDown={debut(k === 'W' ? 'W' : 'f')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait}/>
            <g className="xa-poignee" role="slider" tabIndex={0} aria-label={lib} aria-valuemin={0} aria-valuemax={liste.length - 1} aria-valuenow={i} aria-valuetext={aff(liste[i])}
              onPointerDown={debut(k === 'W' ? 'W' : 'f')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clav(k === 'W' ? 'W' : 'f', i, liste)}>
              <rect x={xf(i) - 26} y={tr.y - 8} width="52" height="40" fill="transparent"/>
              {!touche && k === 'W' && <circle className="xa-pulse" cx={xf(i)} cy={tr.y + 12} r="17" fill="none" stroke={col} strokeWidth="3"/>}
              <circle className="xa-anneau" cx={xf(i)} cy={tr.y + 12} r="13" fill="#fff" stroke={col} strokeWidth="4" filter="url(#sgx-ombre)"/>
              <circle cx={xf(i)} cy={tr.y + 12} r="4.5" fill={col}/>
            </g>
          </g>))}
      </svg>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: touche ? 700 : 400, color: KIT.txt2 }}>{message}</div>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Système étudié" valeur={sys} onChange={v => regler({ sys: v })} options={M.SYSTEMES.map(s => [s.id, NOMS[s.id]])}/>
        <Seg label="Durée du transfert" valeur={dt} onChange={v => regler({ dt: v })} options={[10, 20, 40, 60].map(v => [v, `${v} s`])}/>
      </div>
      <div className="xa-chips" style={{ maxWidth: 920, margin: '10px auto 0', '--n': 5 }}>
        {[['Travail W (batterie → bloc)', `${nbf(W, 0)}${NB}J`, '#0369a1'], ['Transfert Q (bloc → air)', `${nbf(Q, 0)}${NB}J`, '#b45309'], [`Somme pour ${NOMS[sys].toLowerCase()}`, sg(bilan), C.vio], ['ΔT du bloc', `${dE('bloc') >= 0 ? '+' : '−'}${nbf(Math.abs(dTbloc), 1)}${NB}K`, '#dc2626'], [`Puissance de W sur ${dt} s`, `${nbf(W / dt, 1)}${NB}W`, '#0369a1']].map(([n, v, c]) => (
          <div key={n} style={{ ...styleBoite, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>{n}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
          </div>))}
      </div>
    </div>);
}
