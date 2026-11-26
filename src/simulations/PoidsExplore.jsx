import { useState, useMemo, useRef, useCallback } from "react";
import { KIT, styleBoite, Section } from "../commun";
import { trajet, PTS, F_FROTT, G } from "./railTrajet";
import { COL, nbf, imageA, Seg, useEtroit, useLecture, coordSvg, StyleAnim, DefsAnim, BarreLecture, Chips } from "./exploAnim";

// ====================================================
//  Exploration animée de la simulation 250 (travail du poids selon le trajet).
//  On déplace les drapeaux de départ et d'arrivée sur les points A à E, un clic sur le chariot le met en route ;
//  les travaux du poids et de la réaction du rail se cumulent en direct.
//  Mouvement : railTrajet.js (déplacement à vitesse modérée, constante le long du rail).
// ====================================================
const W = 700, H = 400, X0 = 46, YB = 346, S = 124;
const px = x => X0 + x * S, py = z => YB - z * S;
const sg = v => (Math.abs(v) < 0.05 ? '' : v > 0 ? '+' : '−') + nbf(Math.abs(v), 1);
const nat = v => (Math.abs(v) < 0.05 ? 'nul' : v > 0 ? 'moteur' : 'résistant');
const couleurNat = v => (Math.abs(v) < 0.05 ? COL.gris : v > 0 ? COL.v : COL.rouge);
const ptDe = id => PTS.find(p => p.id === id);

export function PoidsExplore() {
  const [p, setP] = useState({ m: 2, dep: 'A', arr: 'E', frott: false });
  const [ouv, setOuv] = useState(false);
  const svgRef = useRef(null), drag = useRef(null), boite = useRef(null);
  const etroit = useEtroit(boite);
  const tr = useMemo(() => trajet(p), [p]);
  const L = useLecture(tr.tFin);
  const { t } = L;
  const q = imageA(tr.frames, t);
  const regler = useCallback(ch => { L.reset(); setP(s => ({ ...s, ...ch })); }, [L]);

  const zRail = x => { for (let i = 0; i < PTS.length - 1; i++) { const a = PTS[i], b = PTS[i + 1]; if (x <= b.x) { const u = (x - a.x) / (b.x - a.x); return a.z + (b.z - a.z) * (1 - Math.cos(Math.PI * u)) / 2; } } return PTS[PTS.length - 1].z; };
  const rail = useMemo(() => { let d = ''; for (let i = 0; i <= 160; i++) { const x = 4.5 * i / 160; d += `${i ? 'L' : 'M'}${px(x).toFixed(1)},${py(zRail(x)).toFixed(1)} `; } return d; }, []);

  const plusProche = X => { const x = (X - X0) / S; return PTS.reduce((b, c) => (Math.abs(c.x - x) < Math.abs(b.x - x) ? c : b)).id; };
  const debut = type => ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = { type, bouge: false }; L.setTouche(true); };
  const bouge = ev => {
    const d = drag.current; if (!d || d.type === 'chariot') return;
    const { X } = coordSvg(svgRef.current, ev); d.bouge = true; const id = plusProche(X);
    if (d.type === 'dep' && id !== p.dep) regler({ dep: id }); if (d.type === 'arr' && id !== p.arr) regler({ arr: id });
  };
  const fait = ev => {
    const d = drag.current; drag.current = null;
    try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ }
    if (d && d.type === 'chariot' && !d.bouge) L.demarrer();
  };
  const clavier = (type, ev) => {
    const sens = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : 0; if (!sens) return;
    ev.preventDefault(); const i = PTS.findIndex(c => c.id === (type === 'dep' ? p.dep : p.arr)), j = Math.min(Math.max(i + sens, 0), PTS.length - 1);
    regler(type === 'dep' ? { dep: PTS[j].id } : { arr: PTS[j].id });
  };

  const Fm = etroit ? 1.3 : 1;
  const A = ptDe(p.dep), B = ptDe(p.arr);
  const cx = px(q.x), cy = py(q.z), deg = -q.th * 180 / Math.PI, cosT = Math.cos(q.th);
  const lP = 12 + p.m * 9, lN = lP * cosT, lF = 4 + F_FROTT * 12;
  const sensX = q.sens || 1;
  const enMarche = t > 0 && !L.fin;
  const Wp = q.Wp, Wr = q.Wr, Wt = q.Wt;
  const trace = [];
  if (tr.ok && t > 0) { for (let i = 0; i < tr.frames.length; i += 6) { const f = tr.frames[i]; if (f.t > t) break; trace.push(`${trace.length ? 'L' : 'M'}${px(f.x).toFixed(1)},${(py(f.z) - 2).toFixed(1)}`); } }
  const message = !tr.ok ? 'Choisis deux points différents : déplace le drapeau vert (départ) ou le drapeau rouge (arrivée).'
    : !L.touche && !L.joue && t === 0 ? 'Clique sur le chariot (ou sur « Rouler ») pour le déplacer de A vers l’arrivée. Déplace les drapeaux pour changer le trajet.'
    : !L.fin ? ''
    : `Poids : ${sg(Wp)} J (${nat(Wp)}), car l’altitude ${B.z < A.z ? 'diminue' : B.z > A.z ? 'augmente' : 'est la même'}.${p.frott ? ` Frottement : ${sg(Wr)} J, toujours résistant.` : ' La réaction du rail ne travaille pas (perpendiculaire).'}`;

  // panneau de barres signées (grand écran)
  const Wmax = tr.Wmax, hb = 56, bar = v => Math.max(-1, Math.min(1, v / Wmax)) * hb;
  const items = [['Poids', Wp, COL.rouge], ['Rail', Wr, COL.Epp], ['Somme', Wt, COL.Em]];
  return (
    <div ref={boite}>
      <StyleAnim/>
      <svg ref={svgRef} className="xa-svg" viewBox={etroit ? `0 60 ${W} ${H - 60}` : `0 0 ${W} ${H}`} role="img" aria-label="Scène animée : un chariot roule sur un rail aux points A à E, d’un drapeau de départ à un drapeau d’arrivée ; les travaux du poids et du rail se cumulent.">
        <DefsAnim/>
        <rect width={W} height={H} fill="url(#xa-ciel)"/>
        <rect y={YB} width={W} height={H - YB} fill="url(#xa-sol)"/>
        <line x1="0" y1={YB} x2={W} y2={YB} stroke="#57534e" strokeWidth="3"/>
        <path d={`${rail} L${px(4.5)},${YB} L${px(0)},${YB} Z`} fill="#e2e8f0" opacity="0.9"/>
        <path d={`${rail} L${px(4.5)},${YB} L${px(0)},${YB} Z`} fill="none"/>
        <line x1={px(-0.1)} y1={py(0)} x2={px(4.65)} y2={py(0)} stroke="#64748b" strokeWidth="1.5" strokeDasharray="6 5"/>
        <text x={px(4.62)} y={py(0) + 18} textAnchor="end" fontSize={14 * Fm} fontWeight="700" fill="#475569">z = 0</text>
        <path d={rail} fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" filter="url(#xa-ombre)"/>
        <path d={rail} fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/>
        {trace.length > 1 && <path d={trace.join(' ')} fill="none" stroke={COL.Em} strokeWidth="6" strokeLinecap="round" opacity="0.5"/>}
        {PTS.map(c => <g key={c.id}>
          <circle cx={px(c.x)} cy={py(c.z)} r="5.5" fill="white" stroke="#0f172a" strokeWidth="2.5"/>
          <text x={px(c.x)} y={py(c.z) + 34} textAnchor="middle" fontSize={15 * Fm} fontWeight="800" fill="#0f172a" stroke="#f1f5f9" strokeWidth="3.5" paintOrder="stroke">{c.id} · {nbf(c.z, 1)} m</text>
        </g>)}
        {/* drapeaux */}
        {[['dep', A, COL.v, 'départ'], ['arr', B, COL.rouge, 'arrivée']].map(([type, c, col, nom]) => {
          const dx = px(c.x) < 260 ? 9 : -9, haut = type === 'dep' ? 62 : 82;
          return (
            <g key={type} className="xa-poignee" role="slider" tabIndex={0} aria-label={`Drapeau d’${nom === 'départ' ? 'abord' : 'arrivée'} : point ${nom}`} aria-valuemin={0} aria-valuemax={4} aria-valuenow={PTS.findIndex(z => z.id === c.id)} aria-valuetext={`point ${c.id}`}
              onPointerDown={debut(type)} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={ev => clavier(type, ev)}>
              <rect x={px(c.x) - 26} y={py(c.z) - haut - 22} width="52" height={haut + 24} fill="transparent"/>
              <line x1={px(c.x)} y1={py(c.z) - 4} x2={px(c.x)} y2={py(c.z) - haut} stroke="#334155" strokeWidth="3" strokeLinecap="round"/>
              <path d={`M ${px(c.x)} ${py(c.z) - haut} l ${dx * 3.6} 8 l ${-dx * 3.6} 8 Z`} fill={col} stroke="#fff" strokeWidth="1.5" className="xa-anneau" filter="url(#xa-ombre)"/>
              <text x={px(c.x) + dx * 2.4 - (dx > 0 ? -2 : 2)} y={py(c.z) - haut - 6} textAnchor={dx > 0 ? 'start' : 'end'} fontSize={14 * Fm} fontWeight="800" fill={col} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">{nom}</text>
              {!L.touche && type === 'dep' && <circle className="xa-pulse" cx={px(c.x)} cy={py(c.z) - haut} r="10" fill="none" stroke={col} strokeWidth="3"/>}
            </g>);
        })}
        {/* chariot */}
        <g className="xa-poignee" role="button" tabIndex={0} aria-label="Chariot : cliquer pour le déplacer" style={{ cursor: tr.ok ? 'pointer' : 'default' }} onPointerDown={debut('chariot')} onPointerUp={fait} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); L.demarrer(); } }}>
          <g transform={`translate(${cx} ${cy}) rotate(${deg})`} filter="url(#xa-ombre)">
            <rect x="-24" y="-30" width="48" height="23" rx="6" fill="#bae6fd" stroke="#0369a1" strokeWidth="3"/>
            <rect x="-17" y="-26" width="34" height="9" rx="3" fill="#e0f2fe"/>
            <text x="0" y="-9.8" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0c4a6e">{p.m} kg</text>
            <circle cx="-13" cy="-4" r="6.5" fill="#1f2937" stroke="#0f172a" strokeWidth="2"/><circle cx="13" cy="-4" r="6.5" fill="#1f2937" stroke="#0f172a" strokeWidth="2"/>
            <circle cx="-13" cy="-4" r="2.4" fill="#cbd5e1"/><circle cx="13" cy="-4" r="2.4" fill="#cbd5e1"/>
          </g>
          <circle cx={cx} cy={cy - 16} r="34" fill="transparent"/>
        </g>
        {/* forces sur le chariot */}
        <g pointerEvents="none">
          <line x1={cx} y1={cy - 16} x2={cx} y2={cy - 16 + lP} stroke={COL.rouge} strokeWidth="4.5" strokeLinecap="round"/><polygon points={`${cx},${cy - 16 + lP + 9} ${cx - 6},${cy - 16 + lP - 2} ${cx + 6},${cy - 16 + lP - 2}`} fill={COL.rouge}/>
          <text x={cx + 12} y={cy - 16 + lP + 4} fontSize={15 * Fm} fontWeight="800" fill={COL.rouge} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">P</text>
          <g transform={`translate(${cx} ${cy - 16}) rotate(${deg})`}><line x1="0" y1="0" x2="0" y2={-lN} stroke={COL.Ec} strokeWidth="4.5" strokeLinecap="round"/><polygon points={`0,${-lN - 9} -6,${-lN + 2} 6,${-lN + 2}`} fill={COL.Ec}/>
            <text x="12" y={-lN + 2} fontSize={15 * Fm} fontWeight="800" fill={COL.Ec} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">R</text></g>
          {p.frott && enMarche && <g transform={`translate(${cx} ${cy - 3}) rotate(${deg})`}><line x1="0" y1="0" x2={-sensX * lF} y2="0" stroke={COL.Epp} strokeWidth="4.5" strokeLinecap="round"/><polygon points={`${-sensX * (lF + 9)},0 ${-sensX * (lF - 2)},-6 ${-sensX * (lF - 2)},6`} fill={COL.Epp}/>
            <text x={-sensX * lF / 2} y="-9" textAnchor="middle" fontSize={15 * Fm} fontWeight="800" fill={COL.Epp} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">f</text></g>}
        </g>
        {!etroit && <g transform={`translate(${W - 214} 6)`}>
          <rect width="204" height="184" rx="14" fill="white" opacity="0.93" stroke="#cbd5e1"/>
          <text x="102" y="22" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.ink}>Travaux (J)</text>
          <line x1="14" x2="190" y1="100" y2="100" stroke="#94a3b8" strokeWidth="1.5"/>
          {items.map(([n, v, c], i) => { const xb = 22 + i * 62, h = bar(v);
            return <g key={n}><rect x={xb} y="42" width="38" height="116" rx="5" fill="#f1f5f9"/><rect x={xb} y={h >= 0 ? 100 - h : 100} width="38" height={Math.max(Math.abs(h), 0.5)} rx="4" fill={c}/>
              <text x={xb + 19} y={h >= 0 ? 100 - h - 5 : 100 + Math.abs(h) + 15} textAnchor="middle" fontSize="13.5" fontWeight="700" fill={c} stroke="#fff" strokeWidth="3" paintOrder="stroke">{sg(v) || '0,0'}</text>
              <text x={xb + 19} y="176" textAnchor="middle" fontSize="15" fontWeight="700" fill={c}>{n}</text></g>; })}
        </g>}
      </svg>
      {etroit && <div style={{ ...styleBoite, marginTop: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Travaux depuis le départ</div>
        {items.map(([n, v, c]) => <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ width: 54, fontWeight: 700, color: c, fontSize: 15 }}>{n}</span>
          <span style={{ flex: 1, height: 16, borderRadius: 8, background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', top: 0, bottom: 0, left: v >= 0 ? '50%' : `${50 - Math.min(Math.abs(v) / Wmax, 1) * 50}%`, width: `${Math.min(Math.abs(v) / Wmax, 1) * 50}%`, background: c, borderRadius: 8 }}/>
            <span style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1.5, background: '#64748b' }}/></span>
          <span style={{ width: 70, textAlign: 'right', fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 700, color: c }}>{sg(v) || '0,0'} J</span></div>)}
      </div>}

      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.fin ? 700 : 400, color: L.fin ? '#15803d' : KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={tr.tFin} libelle="▶ Rouler" desactive={!tr.ok}/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Masse du chariot" valeur={p.m} onChange={v => regler({ m: v })} options={[[1, '1 kg'], [2, '2 kg'], [3, '3 kg'], [5, '5 kg']]}/>
        <Seg label="Réaction du rail" valeur={p.frott} onChange={v => regler({ frott: v })} options={[[false, 'perpendiculaire (sans frottement)'], [true, `avec frottement (f = ${nbf(F_FROTT, 1)} N)`]]}/>
      </div>
      <Chips items={[['Altitude z', `${nbf(q.z, 2)} m`], ['Travail du poids', `${sg(Wp) || '0,0'} J`, couleurNat(Wp)], ['Travail de la réaction', `${sg(Wr) || '0,0'} J`, couleurNat(Wr)], ['Somme des travaux', `${sg(Wt) || '0,0'} J`, COL.Em], ['Énergie cinétique', Math.abs(Wt) < 0.05 ? 'ne varie pas' : Wt > 0 ? 'augmente' : 'diminue', COL.Ec]]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        Travail du poids : W = m × g × (z départ − z arrivée) = <strong style={{ color: COL.rouge }}>{nbf(p.m, 0)} × {nbf(G, 1)} × ({nbf(A.z, 1)} − {nbf(B.z, 1)}) = {tr.ok ? sg(p.m * G * (A.z - B.z)) : '0,0'} J</strong> : il ne dépend que des altitudes, pas du chemin. Le chariot est déplacé à vitesse modérée pour suivre les travaux ; la variation de son énergie cinétique serait égale à la somme des travaux.
      </div>
      <GrapheW tr={tr} t={t} etroit={etroit}/>
      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre={`Réglages précis : départ ${p.dep} · arrivée ${p.arr}`} ouvert={ouv} onBascule={() => setOuv(o => !o)}>
          <Seg label="Point de départ" valeur={p.dep} onChange={v => regler({ dep: v })} options={PTS.map(c => [c.id, `${c.id} (${nbf(c.z, 1)} m)`])}/>
          <div style={{ height: 10 }}/>
          <Seg label="Point d’arrivée" valeur={p.arr} onChange={v => regler({ arr: v })} options={PTS.map(c => [c.id, `${c.id} (${nbf(c.z, 1)} m)`])}/>
          <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5, marginTop: 8 }}>Mêmes réglages qu’avec les drapeaux, pour le clavier.</div>
        </Section>
      </div>
    </div>);
}

// Travaux cumulés en fonction du temps (le zéro est au milieu : un travail peut être négatif).
function GrapheW({ tr, t, etroit }) {
  const F = etroit ? 1.35 : 1, T = Math.max(tr.tFin, 0.01), Wm = tr.Wmax, X = s => 56 + 628 * s / T, Y = w => 99 - Math.max(-1, Math.min(1, w / Wm)) * 66;
  const fin = Math.min(Math.round(t * 120), tr.frames.length - 1);
  const cles = [['Poids', 'Wp', COL.rouge], ['Rail', 'Wr', COL.Epp], ['Somme', 'Wt', COL.Em]];
  return (
    <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Les travaux cumulés au cours du trajet</div>
      <svg viewBox="0 0 700 210" style={{ width: '100%', display: 'block' }} role="img" aria-label="Graphique : travail du poids, de la réaction du rail et leur somme depuis le départ, en fonction du temps.">
        <rect x="56" y="30" width="628" height="138" rx="6" fill="#fafcff" stroke="#e2e8f0"/>
        <line x1="56" x2="684" y1="99" y2="99" stroke="#64748b" strokeWidth="1.5"/>
        {tr.ok && cles.map(([n, k, c]) => { const pts = []; for (let i = 0; i <= fin; i += 3) pts.push(`${X(tr.frames[i].t).toFixed(1)},${Y(tr.frames[i][k]).toFixed(1)}`); return <polyline key={n} points={pts.join(' ')} fill="none" stroke={c} strokeWidth={k === 'Wt' ? 3.5 : 3} strokeDasharray={k === 'Wt' ? '9 5' : undefined} strokeLinejoin="round"/>; })}
        {tr.ok && <line x1={X(Math.min(t, T))} x2={X(Math.min(t, T))} y1="30" y2="168" stroke="#94a3b8" strokeWidth="1.5"/>}
        <text x="50" y="40" textAnchor="end" fontSize={15 * F} fill="#475569">+{nbf(Wm, 0)}</text><text x="50" y="103" textAnchor="end" fontSize={15 * F} fill="#475569">0</text><text x="50" y="172" textAnchor="end" fontSize={15 * F} fill="#475569">−{nbf(Wm, 0)}</text>
        <text x="370" y="204" textAnchor="middle" fontSize={15 * F} fill="#475569">temps (s) · travaux en J</text>
        {cles.map(([n, , c], i) => <g key={n}><line x1={470 + i * 75} x2={492 + i * 75} y1="14" y2="14" stroke={c} strokeWidth="4"/><text x={497 + i * 75} y="19" fontSize={15 * F} fontWeight="700" fill={c}>{n}</text></g>)}
      </svg>
    </div>);
}
