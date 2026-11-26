import { useRef, useState } from "react";
import { KIT, styleBoite, styleBouton } from "../commun";
import { NB } from "./Distillation";
import { nbf, Seg, useEtroit, coordSvg, StyleAnim } from "./exploAnim";
import * as M from "./modesTransfertModele";
import { useHorloge } from "./PanneauSceneAnim";

// ====================================================
//  Exploration animée de la simulation 245 (travail ou transfert thermique : classer les phénomènes).
//  À gauche, la situation en mouvement (chariot, roue freinée, ressort, circuit, barre de métal, plaques, casserole, Soleil…).
//  On fait une hypothèse sur le mode de transfert (5 boutons) : un retour dit si c'est le bon.
//  À droite, la carte du transfert : qui cède, qui reçoit, signe pour le système cliquable, énergie réglable. Tout vient de modesTransfertModele.js.
// ====================================================
const C = { W: '#0369a1', Q: '#b45309', ok: '#15803d', mal: '#b91c1c', ink: '#0f172a', vio: '#6d28d9' };
const sgJ = v => (v > 0 ? '+' : v < 0 ? '−' : '') + nbf(Math.abs(v), 0) + `${NB}J`;
const cyc = (a, T) => (a / T) % 1;

function Scene({ k, a }) {
  const sol = <g><rect x="0" y="176" width="340" height="54" fill="#d6d3d1"/><rect x="0" y="174" width="340" height="4" fill="#a8a29e"/></g>;
  const chariot = (x, roues = 0) => (
    <g>
      <rect x={x} y="128" width="78" height="30" rx="6" fill="#0369a1" stroke="#0c4a6e" strokeWidth="3"/>
      <rect x={x + 6} y="118" width="30" height="14" rx="3" fill="#7dd3fc" stroke="#0c4a6e" strokeWidth="2"/>
      {[16, 62].map(d => <g key={d} transform={`translate(${x + d} 160) rotate(${roues})`}><circle r="13" fill="#334155" stroke="#0f172a" strokeWidth="2.5"/><line x1="-10" x2="10" stroke="#e2e8f0" strokeWidth="2.5"/><line y1="-10" y2="10" stroke="#e2e8f0" strokeWidth="2.5"/></g>)}
    </g>);
  if (k === 'chariot') {
    const p = cyc(a, 3.2), x = 90 + p * 110;
    return <g>{sol}{chariot(x, p * 700)}
      <g><rect x={x - 44} y="132" width="30" height="22" rx="8" fill="#fdba74" stroke="#9a3412" strokeWidth="2.5"/><path d={`M ${x - 12} 143 h 8`} stroke="#9a3412" strokeWidth="3"/></g>
      <path d={`M ${x - 52} 100 h 30`} stroke="#b91c1c" strokeWidth="5" markerEnd="url(#mtx-fl)"/><text x={x - 56} y="92" fontSize="14" fontWeight="800" fill="#b91c1c">force F</text></g>;
  }
  if (k === 'frein') {
    const w = 7 * (1 - cyc(a, 3.5)), ang = a * w * 40;
    return <g><rect x="0" y="0" width="340" height="230" fill="#f1f5f9"/>
      <g transform={`translate(150 112) rotate(${ang})`}><circle r="66" fill="#475569" stroke="#0f172a" strokeWidth="5"/><circle r="52" fill="#94a3b8"/>
        {[0, 60, 120, 180, 240, 300].map(d => <line key={d} x1="0" y1="0" x2={Math.cos(d * Math.PI / 180) * 52} y2={Math.sin(d * Math.PI / 180) * 52} stroke="#e2e8f0" strokeWidth="4"/>)}<circle r="9" fill="#0f172a"/></g>
      <rect x="216" y="74" width="26" height="76" rx="5" fill="#64748b" stroke="#0f172a" strokeWidth="3"/>
      <path d="M 276 112 h -30" stroke="#b91c1c" strokeWidth="5" markerEnd="url(#mtx-fl)"/><text x="248" y="100" fontSize="14" fontWeight="800" fill="#b91c1c">force F</text>
      {Array.from({ length: 5 }, (_, i) => <circle key={i} cx={212 - (cyc(a * 2 + i / 5, 1)) * 24} cy={90 + i * 12} r="3" fill="#f59e0b" opacity={1 - cyc(a * 2 + i / 5, 1)}/>)}</g>;
  }
  if (k === 'ressort') {
    const p = cyc(a, 3), lib = p > 0.35, ext = lib ? 1 : 0.4 + p / 0.35 * 0, L = lib ? 100 : 100 - 50 * (1 - p / 0.35 * 0) ;
    void ext; void L;
    const long = p < 0.3 ? 50 : 50 + Math.min((p - 0.3) / 0.12, 1) * 50;       // longueur du ressort
    const bx = p < 0.3 ? 60 + 50 : 60 + long + (p > 0.42 ? (p - 0.42) / 0.58 * 150 : 0);
    const pts = Array.from({ length: 13 }, (_, i) => `${60 + (long * i) / 12},${150 + (i % 2 ? -16 : 16) * (i === 0 || i === 12 ? 0 : 1)}`).join(' ');
    return <g>{sol}<rect x="46" y="118" width="14" height="60" fill="#475569"/>
      <polyline points={pts} fill="none" stroke="#b45309" strokeWidth="5" strokeLinejoin="round"/>
      <circle cx={bx + 14} cy="154" r="14" fill="#ef4444" stroke="#7f1d1d" strokeWidth="3"/>
      {p > 0.45 && <path d={`M ${bx - 10} 118 h 40`} stroke="#15803d" strokeWidth="4" markerEnd="url(#mtx-fv)"/>}</g>;
  }
  if (k === 'pile') {
    const L = 2 * (150 + 100), pt = s => { const r = ((s % L) + L) % L; return r < 150 ? [70 + r, 60] : r < 250 ? [220, 60 + (r - 150)] : r < 400 ? [220 - (r - 250), 160] : [70, 160 - (r - 400)]; };
    return <g><rect x="0" y="0" width="340" height="230" fill="#f1f5f9"/>
      <path d="M 70 60 H 220 V 160 H 70 Z" fill="none" stroke="#475569" strokeWidth="5" strokeLinejoin="round"/>
      <rect x="40" y="86" width="60" height="48" rx="6" fill="#fef9c3" stroke="#334155" strokeWidth="4"/><rect x="48" y="94" width="26" height="32" fill="#16a34a"/><text x="90" y="116" fontSize="18" fontWeight="800" fill="#0f172a" textAnchor="middle">+</text>
      <circle cx="220" cy="110" r="30" fill="#fde047" opacity={0.3 + 0.2 * Math.sin(a * 3)}/><circle cx="220" cy="110" r="20" fill="#fef08a" stroke="#475569" strokeWidth="4"/><path d="M 210 118 l 5 -10 l 5 8 l 5 -8 l 5 10" fill="none" stroke="#475569" strokeWidth="2.5"/>
      {Array.from({ length: 12 }, (_, i) => { const [x, y] = pt(i * (L / 12) + a * 60); return <circle key={i} cx={x} cy={y} r="4.5" fill="#fde047" stroke="#a16207" strokeWidth="1.2"/>; })}</g>;
  }
  if (k === 'barre') {
    const front = 0.25 + 0.75 * cyc(a, 4);
    return <g><rect x="0" y="0" width="340" height="230" fill="#f1f5f9"/>
      <rect x="20" y="118" width="70" height="76" rx="8" fill="#fdba74" stroke="#9a3412" strokeWidth="3"/>
      {Array.from({ length: 3 }, (_, i) => <path key={i} d={`M ${36 + i * 20} 112 q 5 -8 0 -16 q -5 -8 0 -16`} fill="none" stroke="#ef4444" strokeWidth="2.5" opacity={0.4 + 0.5 * Math.abs(Math.sin(a * 3 + i))}/>)}
      {Array.from({ length: 16 }, (_, i) => { const x = 60 + i * 17, t = Math.max(0, 1 - (i / 15) / front); return <rect key={i} x={x} y="128" width="17.5" height="26" fill={`rgb(${Math.round(148 + 100 * t)},${Math.round(163 - 60 * t)},${Math.round(184 - 120 * t)})`} stroke="#475569" strokeWidth="1"/>; })}
      <rect x="60" y="126" width="272" height="30" rx="5" fill="none" stroke="#334155" strokeWidth="3"/></g>;
  }
  if (k === 'melange') {
    const t = 0.2 + 0.8 * cyc(a, 4);
    return <g><rect x="0" y="0" width="340" height="230" fill="#f1f5f9"/>
      <rect x="60" y="150" width="220" height="30" rx="5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="3"/><text x="170" y="171" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">plaque chaude</text>
      <rect x="80" y="112" width="180" height="34" rx="5" fill={`rgb(${Math.round(125 + 110 * t)},${Math.round(190 - 60 * t)},${Math.round(250 - 190 * t)})`} stroke="#334155" strokeWidth="3"/>
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M ${100 + i * 28} ${150 - cyc(a + i / 6, 1.2) * 34} v -2`} stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" opacity={0.9 - cyc(a + i / 6, 1.2) * 0.8}/>)}</g>;
  }
  if (k === 'casserole') {
    return <g><rect x="0" y="0" width="340" height="230" fill="#f1f5f9"/>
      <path d="M 70 70 V 160 a 20 20 0 0 0 20 20 H 250 a 20 20 0 0 0 20 -20 V 70" fill="#bae6fd" stroke="#475569" strokeWidth="5"/>
      {[0, 1, 2, 3, 4].map(i => <path key={i} d={`M ${110 + i * 30} 200 q 6 -12 0 -22 q -6 -10 0 -18`} fill="none" stroke="#f97316" strokeWidth="5" opacity={0.6 + 0.4 * Math.sin(a * 6 + i)}/>)}
      {Array.from({ length: 10 }, (_, i) => { const th = (i / 10 + a * 0.18) * 2 * Math.PI, x = 170 + 62 * Math.cos(th), y = 124 - 36 * Math.sin(th), hot = Math.cos(th) < 0; return <circle key={i} cx={x} cy={y} r="6" fill={Math.sin(th) > 0 ? '#ef4444' : '#3b82f6'} stroke="#fff" strokeWidth="1.5" opacity={hot ? 1 : 0.95}/>; })}
      <text x="170" y="128" textAnchor="middle" fontSize="13" fontWeight="800" fill="#334155">eau</text></g>;
  }
  if (k === 'soleil') {
    return <g><rect x="0" y="0" width="340" height="230" fill="#0f172a"/>
      {[[20, 20], [120, 40], [200, 14], [300, 30], [250, 190], [60, 200], [150, 180], [320, 120]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" fill="#e2e8f0"/>)}
      {Array.from({ length: 12 }, (_, i) => { const th = i * Math.PI / 6; return <line key={i} x1={44 + Math.cos(th) * 36} y1={115 + Math.sin(th) * 36} x2={44 + Math.cos(th) * (46 + 5 * Math.sin(a * 4 + i))} y2={115 + Math.sin(th) * (46 + 5 * Math.sin(a * 4 + i))} stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round"/>; })}
      <circle cx="44" cy="115" r="32" fill="#fde047" stroke="#f59e0b" strokeWidth="3"/>
      {[-24, 0, 24].map(dy => <path key={dy} d={Array.from({ length: 44 }, (_, i) => `${i ? 'L' : 'M'} ${96 + i * 4.6} ${115 + dy * (i / 43) + 7 * Math.sin(i * 0.9 - a * 8)}`).join(' ')} fill="none" stroke="#fde68a" strokeWidth="2.5" opacity="0.85"/>)}
      <g transform="translate(300 115)"><rect x="-16" y="-14" width="32" height="28" rx="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="3"/><rect x="-40" y="-10" width="22" height="20" fill="#2563eb" stroke="#1e3a8a" strokeWidth="2"/><rect x="18" y="-10" width="22" height="20" fill="#2563eb" stroke="#1e3a8a" strokeWidth="2"/></g>
      <text x="170" y="214" textAnchor="middle" fontSize="13" fontWeight="800" fill="#cbd5e1">vide : pas de matière entre les deux</text></g>;
  }
  // glisse
  const p = cyc(a, 3.2), x = 60 + 170 * (1 - (1 - p) * (1 - p));
  return <g>{sol}{chariot(x, p * 400)}
    {Array.from({ length: 4 }, (_, i) => <circle key={i} cx={x + 10 + i * 18} cy={178 + 2} r={3 + 2 * Math.sin(a * 8 + i) ** 2} fill="#f59e0b" opacity={0.9 * (1 - p)}/>)}
    <path d={`M ${x + 82} 143 h -34`} stroke="#b91c1c" strokeWidth="5" markerEnd="url(#mtx-fl)" opacity="0.9"/><text x={x + 46} y="124" fontSize="13" fontWeight="800" fill="#b91c1c">frottements</text></g>;
}

export function ModesTransfertExplore({ ti, setTi, indices }) {
  const boite = useRef(null), svgRef = useRef(null), drag = useRef(false);
  const etroit = useEtroit(boite);
  const a = useHorloge();
  const [touche, setTouche] = useState(false);
  const sit = M.situation(ti.sit), mT = M.mode(sit.mode);
  const hypOK = ti.hyp !== '' && ti.hyp === sit.mode, hypKO = ti.hyp !== '' && !hypOK;
  const v = ti.sys === 'de' ? -ti.E : ti.E, syst = ti.sys === 'de' ? sit.de : sit.vers;
  const col = hypOK ? (mT.type === 'W' ? C.W : C.Q) : '#94a3b8';
  const regler = ch => setTi(s => ({ ...s, ...ch }));
  const idx = M.SITUATIONS.findIndex(s => s.id === ti.sit);
  const suivante = () => { setTouche(true); regler({ sit: M.SITUATIONS[(idx + 1) % M.SITUATIONS.length].id, hyp: '' }); };
  const hasard = () => { setTouche(true); let j; do { j = Math.floor(Math.random() * M.SITUATIONS.length); } while (j === idx); regler({ sit: M.SITUATIONS[j].id, hyp: '' }); };
  // poignée d'énergie
  const LE = [100, 300, 600], tx = 40, tw = 260, xe = i => tx + tw * i / 2, iE = LE.indexOf(ti.E);
  const debut = ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = true; setTouche(true); bouge(ev); };
  const bouge = ev => {
    if (!drag.current) return;
    const { X } = coordSvg(svgRef.current, ev);
    const base = etroit ? 0 : 350, i = Math.min(Math.max(Math.round((X - base - tx) / tw * 2), 0), 2);
    if (LE[i] !== ti.E) regler({ E: LE[i] });
  };
  const fait = ev => { drag.current = false; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const clavier = ev => { const s = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : 0; if (!s) return; ev.preventDefault(); regler({ E: LE[Math.min(Math.max(iE + s, 0), 2)] }); };
  const message = ti.hyp === '' ? 'Observe la situation, puis choisis le mode de transfert avec les boutons. Utilise « Situation suivante » pour en essayer d’autres.'
    : hypOK ? `✓ Bon mode. ${mT.nom} : ${M.RAISON[mT.id]}.`
      : `✗ Ce n’est pas le bon mode. ${indices[sit.mode]}`;
  const ep = 6 + 14 * ti.E / 600, nP = 3 + Math.round(ti.E / 100);
  const oxC = etroit ? 0 : 350, oyC = etroit ? 250 : 0;

  return (
    <div ref={boite}>
      <StyleAnim/>
      <svg ref={svgRef} className="xa-svg" viewBox={etroit ? '0 0 340 500' : '0 0 700 250'} role="img"
        aria-label={`Situation animée : ${sit.texte} Transfert d'énergie de ${sit.de} vers ${sit.vers}.`}>
        <defs>
          <marker id="mtx-fl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#b91c1c"/></marker>
          <marker id="mtx-fv" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#15803d"/></marker>
          <filter id="mtx-ombre" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.25"/></filter>
          <clipPath id="mtx-clip"><rect x="2" y="2" width="336" height="226" rx="12"/></clipPath>
        </defs>
        <rect width="700" height="500" fill="#f8fafc"/>
        <g clipPath="url(#mtx-clip)" transform="translate(2 2)"><Scene k={sit.scene} a={a}/></g>
        <rect x="4" y="4" width="332" height="224" rx="12" fill="none" stroke={hypOK ? C.ok : '#cbd5e1'} strokeWidth={hypOK ? 4 : 2}/>
        {/* carte du transfert */}
        <g transform={`translate(${oxC} ${oyC})`}>
          <rect x="4" y="4" width="334" height="224" rx="14" fill="#fff" stroke="#cbd5e1"/>
          <text x="170" y="26" textAnchor="middle" fontSize="15" fontWeight="800" fill={C.ink}>Qui cède ? Qui reçoit ?</text>
          {[['de', 18, sit.de, 'cède'], ['vers', 202, sit.vers, 'reçoit']].map(([id, x, nom, verbe]) => (
            <g key={id} role="button" tabIndex={0} aria-pressed={ti.sys === id} aria-label={`Système étudié : ${nom}`} style={{ cursor: 'pointer' }}
              onClick={() => { setTouche(true); regler({ sys: id }); }} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); regler({ sys: id }); } }}>
              {ti.sys === id && <rect x={x - 5} y="40" width="114" height="64" rx="14" fill="none" stroke="#ea580c" strokeWidth="3.5" strokeDasharray="8 5"/>}
              <rect x={x} y="45" width="104" height="54" rx="10" fill={verbe === 'cède' ? '#fee2e2' : '#dcfce7'} stroke={verbe === 'cède' ? '#dc2626' : '#16a34a'} strokeWidth="2.5" filter="url(#mtx-ombre)"/>
              <text x={x + 52} y="67" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={C.ink}>{nom.length > 17 ? nom.slice(0, 16) + '…' : nom}</text>
              <text x={x + 52} y="88" textAnchor="middle" fontSize="13" fontWeight="700" fill={verbe === 'cède' ? '#b91c1c' : '#15803d'}>{verbe}</text>
            </g>))}
          <line x1="126" y1="72" x2="196" y2="72" stroke={col} strokeWidth={ep} strokeLinecap="round" opacity="0.4"/>
          {Array.from({ length: nP }, (_, i) => { const s = (a * 0.6 + i / nP) % 1; return <circle key={i} cx={126 + 70 * s} cy="72" r={Math.max(3, ep * 0.32)} fill={col} stroke="#fff" strokeWidth="1.5"/>; })}
          <path d="M 190 62 L 200 72 L 190 82" fill="none" stroke={col} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="170" y="128" textAnchor="middle" fontSize="15" fontWeight="800" fill={hypOK ? col : '#475569'}>{hypOK ? `${mT.type === 'W' ? 'Travail W' : 'Transfert thermique Q'} · ${mT.court}` : 'mode du transfert : ?'}</text>
          <text x="170" y="154" textAnchor="middle" fontSize="16" fontWeight="800" fill={!hypOK ? '#475569' : v > 0 ? C.ok : C.mal}>{hypOK ? `pour ${syst.length > 16 ? 'ce système' : syst} : ${mT.type} = ${sgJ(v)}` : 'choisis d’abord le mode'}</text>
          {/* poignée d'énergie */}
          <text x={tx} y="176" fontSize="13.5" fontWeight="800" fill={C.vio}>Énergie transférée (J)</text>
          <line x1={tx} y1="206" x2={tx + tw} y2="206" stroke="#7c6f57" strokeWidth="6" strokeLinecap="round"/>
          {LE.map((e, i) => <text key={e} x={xe(i)} y="190" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#334155">{e}</text>)}
          <rect x={tx - 14} y="188" width={tw + 28} height="36" fill="transparent" style={{ cursor: 'pointer', touchAction: 'none' }} onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait}/>
          <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Énergie transférée" aria-valuemin={100} aria-valuemax={600} aria-valuenow={ti.E} aria-valuetext={`${ti.E} joules`} onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier}>
            <rect x={xe(iE) - 24} y="188" width="48" height="36" fill="transparent"/>
            <circle className="xa-anneau" cx={xe(iE)} cy="206" r="11" fill="#fff" stroke={C.vio} strokeWidth="4" filter="url(#mtx-ombre)"/><circle cx={xe(iE)} cy="206" r="3.5" fill={C.vio}/>
          </g>
        </g>
      </svg>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0', fontSize: 15, lineHeight: 1.5, color: KIT.txt }}><strong>{sit.texte}</strong></div>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <Seg label="Ton hypothèse : quel mode de transfert ?" valeur={ti.hyp} onChange={h => { setTouche(true); regler({ hyp: h }); }} options={M.MODES.map(m => [m.id, m.court.charAt(0).toUpperCase() + m.court.slice(1)])}/>
      </div>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: ti.hyp !== '' ? 700 : 400, color: hypOK ? C.ok : hypKO ? C.mal : KIT.txt2 }}>{touche || ti.hyp !== '' ? message : 'Observe la situation, puis choisis le mode de transfert avec les boutons. Utilise « Situation suivante » pour en essayer d’autres.'}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 920, margin: '10px auto 0' }}>
        <button type="button" onClick={suivante} style={styleBouton(true, '#0369a1')}>Situation suivante ▶</button>
        <button type="button" onClick={hasard} style={styleBouton(false, '#475569')}>🎲 Au hasard</button>
        <span style={{ alignSelf: 'center', fontSize: 13.5, color: KIT.txt2 }}>Situation {idx + 1} sur {M.SITUATIONS.length}</span>
      </div>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Durée du transfert" valeur={ti.dt} onChange={d => regler({ dt: d })} options={[2, 5, 10].map(d => [d, `${d} s`])}/>
      </div>
      <div className="xa-chips" style={{ maxWidth: 920, margin: '10px auto 0', '--n': 3 }}>
        {[['Famille du transfert', hypOK ? (mT.type === 'W' ? 'travail W' : 'transfert thermique Q') : '?', hypOK ? col : '#64748b'], ['Valeur algébrique', hypOK ? sgJ(v) : '?', hypOK ? (v > 0 ? C.ok : C.mal) : '#64748b'], ['Puissance |E| ÷ Δt', hypOK ? `${nbf(M.puissance(ti.E, ti.dt), 1)}${NB}W` : '?', C.vio]].map(([n, val, c]) => (
          <div key={n} style={{ ...styleBoite, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>{n}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15, fontWeight: 700, color: c }}>{val}</div>
          </div>))}
      </div>
    </div>);
}
