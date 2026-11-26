import { useRef, useState, useEffect } from "react";
import { KIT, styleBoite, styleBouton } from "../commun";
import { NB } from "./Distillation";
import { nbf, Seg, useEtroit, useLecture, coordSvg, StyleAnim } from "./exploAnim";
import * as M from "./jouleModele";

// ====================================================
//  Exploration animée de la simulation 232 (effet Joule).
//  Un circuit vivant : des charges circulent (plus vite quand I augmente), le résistor rougeoie et dégage des ondes de chaleur,
//  le câble (si on en met un) chauffe aussi. On tire les poignées pour changer la tension U et la résistance R ;
//  l'énergie thermique s'accumule pendant que le temps (accéléré) s'écoule.
//  Aucun calcul propre : tout vient de jouleModele.js (loi d'Ohm, P = R × I², W = P × Δt).
// ====================================================
const W = 700, H = 400;
const C = { U: '#0369a1', I: '#b45309', chaleur: '#ef4444', cable: '#7c3aed', fil: '#475569', ink: '#0f172a', gris: '#475569' };
const T_ANIM = 6;                                              // durée animée (s) = durée réelle choisie (minutes)
const X_G = 112, X_R = 568, Y_H = 116, Y_B = 290;              // générateur, résistor, fil du haut, fil du bas
const TRAJET = [[X_G, 146], [X_G, Y_H], [X_R, Y_H], [X_R, 154], [X_R, 252], [X_R, Y_B], [X_G, Y_B], [X_G, 258], [X_G, 146]];   // sens conventionnel : de la borne + vers la borne −
const SEGS = TRAJET.slice(1).map((p, i) => ({ a: TRAJET[i], b: p, l: Math.hypot(p[0] - TRAJET[i][0], p[1] - TRAJET[i][1]) }));
const LONG = SEGS.reduce((s, x) => s + x.l, 0);
const pointSur = s => { let r = ((s % LONG) + LONG) % LONG; for (const g of SEGS) { if (r <= g.l) return [g.a[0] + (g.b[0] - g.a[0]) * r / g.l, g.a[1] + (g.b[1] - g.a[1]) * r / g.l]; r -= g.l; } return TRAJET[0]; };
const luminance = P => Math.min(1, Math.log10(1 + Math.max(P, 0)) / Math.log10(400));     // échelle logarithmique : 0 W → sombre, 400 W → incandescent
const nrj = v => (v >= 1e4 ? `${nbf(v / 1000, 1)}${NB}kJ` : v >= 100 ? `${nbf(v, 0)}${NB}J` : `${nbf(v, 1)}${NB}J`);
const pw = v => (v >= 100 ? `${nbf(v, 0)}${NB}W` : v >= 10 ? `${nbf(v, 1)}${NB}W` : `${nbf(v, 2)}${NB}W`);

export function JouleExplore({ ti, setTi }) {
  const boite = useRef(null), svgRef = useRef(null), drag = useRef(null);
  const etroit = useEtroit(boite);
  const L = useLecture(T_ANIM);
  const [anim, setAnim] = useState(0);
  useEffect(() => {                                            // horloge des charges et des ondes (hors lecture de l'énergie)
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf = 0, dernier = performance.now();
    const pas = now => { setAnim(a => a + Math.min((now - dernier) / 1000, 0.05)); dernier = now; raf = requestAnimationFrame(pas); };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { U, R, r, dt } = ti;
  const I = U / (R + r), PR = R * I * I, Pc = r * I * I, Pt = U * I;
  const tau = Math.min(L.t / T_ANIM, 1), minutes = tau * dt;
  const WR = PR * dt * 60 * tau, WC = Pc * dt * 60 * tau, WT = Pt * dt * 60 * tau;
  const g = luminance(PR), gc = r > 0 ? luminance(Pc * 6) : 0;
  const Fm = etroit ? 1.75 : 1, Fg = etroit ? 1.3 : 1, GW = etroit ? 330 : 590;

  const regler = ch => { setTi(s => ({ ...s, ...ch })); L.demarrer(); };
  const xU = i => 52 + i * 54, xR = i => 410 + i * 62;
  const iU = M.TENSIONS.indexOf(U), iR = M.RESISTANCES.indexOf(R);
  const debut = type => ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = type; L.setTouche(true); bouge(ev); };
  const bouge = ev => {
    const type = drag.current; if (!type) return;
    const { X } = coordSvg(svgRef.current, ev);
    if (type === 'U') { const i = Math.min(Math.max(Math.round((X - 52) / 54), 0), M.TENSIONS.length - 1); if (M.TENSIONS[i] !== U) regler({ U: M.TENSIONS[i] }); }
    else { const i = Math.min(Math.max(Math.round((X - 410) / 62), 0), M.RESISTANCES.length - 1); if (M.RESISTANCES[i] !== R) regler({ R: M.RESISTANCES[i] }); }
  };
  const fait = ev => { drag.current = null; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const clavier = (type, ev) => {
    const s = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : 0; if (!s) return;
    ev.preventDefault();
    if (type === 'U') regler({ U: M.TENSIONS[Math.min(Math.max(iU + s, 0), M.TENSIONS.length - 1)] });
    else regler({ R: M.RESISTANCES[Math.min(Math.max(iR + s, 0), M.RESISTANCES.length - 1)] });
  };

  // charges en mouvement : vitesse proportionnelle à l'intensité I
  const vitesse = 16 + Math.min(I, 10) * 20;
  const charges = Array.from({ length: Math.floor(LONG / 34) }, (_, k) => pointSur(k * 34 + anim * vitesse)).filter(([x, y]) => !(Math.abs(x - X_G) < 3 && y > 150 && y < 254));
  const ondes = [0, 1, 2].map(k => ({ k, ph: (anim * 0.7 + k / 3) % 1 }));

  const message = !L.touche && !L.fin ? 'Tire la poignée bleue (tension U) ou la poignée grise (résistance R) : les charges accélèrent et le résistor chauffe plus ou moins. Clique sur « Chauffer » pour relancer le temps.'
    : L.fin ? (r > 0 ? `En ${dt} min, le générateur fournit ${nrj(Pt * dt * 60)} : ${nrj(PR * dt * 60)} chauffent le résistor et ${nrj(Pc * dt * 60)} (${nbf(100 * Pc / Pt, 0)} %) sont perdus dans le câble.`
      : `En ${dt} min, toute l’énergie électrique reçue (${nrj(PR * dt * 60)}) est devenue de la chaleur dans le résistor : c’est l’effet Joule.`) : '';

  const ymaxG = Math.max(Pt * dt * 60, 1e-9);
  const gx = a => 64 + GW * a, gy = v => 150 - 112 * Math.min(v / ymaxG, 1);
  const lignes = [[WT, '#6d28d9', 'fournie'], [WR, C.chaleur, 'résistor'], [WC, C.cable, 'câble']].filter(x => x[2] !== 'câble' || r > 0);

  return (
    <div ref={boite}>
      <StyleAnim/>
      <svg ref={svgRef} className="xa-svg" viewBox={etroit ? '0 20 700 380' : `0 0 ${W} ${H}`} role="img"
        aria-label={`Scène animée : un générateur de ${U} volts alimente un résistor de ${R} ohms${r > 0 ? ` par un câble de ${nbf(r, 1)} ohm` : ''}. Intensité ${nbf(I, 2)} ampères, puissance dissipée ${nbf(PR, 1)} watts.`}>
        <defs>
          <linearGradient id="jx-fond" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8fafc"/><stop offset="1" stopColor="#e2e8f0"/></linearGradient>
          <linearGradient id="jx-table" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d6c7ae"/><stop offset="1" stopColor="#b8a68a"/></linearGradient>
          <linearGradient id="jx-ceram" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#e7e2d8"/><stop offset="0.5" stopColor="#faf7f0"/><stop offset="1" stopColor="#cfc7b6"/></linearGradient>
          <linearGradient id="jx-pile" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1e3a8a"/><stop offset="0.5" stopColor="#2563eb"/><stop offset="1" stopColor="#1e40af"/></linearGradient>
          <radialGradient id="jx-halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ff6a3d" stopOpacity="0.95"/><stop offset="0.6" stopColor="#f97316" stopOpacity="0.4"/><stop offset="1" stopColor="#f97316" stopOpacity="0"/></radialGradient>
          <filter id="jx-ombre" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.28"/></filter>
        </defs>
        <rect width={W} height={H} fill="url(#jx-fond)"/>
        <rect x="0" y="318" width={W} height="82" fill="url(#jx-table)"/>
        <rect x="0" y="316" width={W} height="4" fill="#8a7a5f"/>

        {/* titre de scène */}
        {!etroit && <text x="350" y="30" textAnchor="middle" fontSize="17" fontWeight="800" fill={C.ink} stroke="#fff" strokeWidth="4" paintOrder="stroke">Un générateur, un résistor et un câble</text>}

        {/* fils */}
        <g fill="none" stroke={C.fil} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d={`M ${X_G} 146 V ${Y_H} H ${X_R} V 154`}/><path d={`M ${X_R} 252 V ${Y_B} H ${X_G} V 258`}/>
        </g>
        {/* câble (gaine épaisse) sur le fil du haut */}
        {r > 0 && <g>
          <rect x="250" y={Y_H - 12} width="190" height="24" rx="12" fill="#a78bfa" stroke="#5b21b6" strokeWidth="2.5" filter="url(#jx-ombre)"/>
          <rect x="250" y={Y_H - 12} width="190" height="24" rx="12" fill="url(#jx-halo)" opacity={gc}/>
          <text x="345" y={Y_H + 40} textAnchor="middle" fontSize={15 * Fm} fontWeight="800" fill={C.cable} stroke="#fff" strokeWidth="4" paintOrder="stroke">câble r = {nbf(r, 1)}{NB}Ω</text>
          {gc > 0.25 && ondes.map(o => <path key={o.k} d={`M ${280 + o.k * 60} ${Y_H - 16 - o.ph * 20} q 8 -7 16 0 t 16 0`} fill="none" stroke={C.cable} strokeWidth="3" strokeLinecap="round" opacity={(1 - o.ph) * gc}/>)}
        </g>}

        {/* générateur */}
        <g filter="url(#jx-ombre)">
          <rect x={X_G - 34} y="146" width="68" height="112" rx="12" fill="url(#jx-pile)" stroke="#1e3a8a" strokeWidth="2.5"/>
          <rect x={X_G - 14} y="136" width="28" height="12" rx="3" fill="#94a3b8" stroke="#475569" strokeWidth="2"/>
        </g>
        <text x={X_G} y="196" textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff">+</text>
        <text x={X_G} y="244" textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff">−</text>
        <text x={X_G + 44} y="208" fontSize={17 * Fm} fontWeight="800" fill={C.U} stroke="#fff" strokeWidth="4" paintOrder="stroke">U = {U}{NB}V</text>

        {/* résistor : corps en céramique, spirale, halo de chaleur */}
        <circle cx={X_R} cy="203" r={64 + 36 * g} fill="url(#jx-halo)" opacity={0.15 + 0.85 * g}/>
        <g filter="url(#jx-ombre)">
          <rect x={X_R - 24} y="154" width="48" height="98" rx="22" fill="url(#jx-ceram)" stroke="#8b8372" strokeWidth="2.5"/>
          <rect x={X_R - 24} y="154" width="48" height="98" rx="22" fill={C.chaleur} opacity={0.12 + 0.62 * g}/>
          <path d={`M ${X_R - 16} 170 L ${X_R + 16} 178 L ${X_R - 16} 188 L ${X_R + 16} 196 L ${X_R - 16} 206 L ${X_R + 16} 214 L ${X_R - 16} 224 L ${X_R + 16} 232`} fill="none" stroke={g > 0.55 ? '#fde68a' : '#475569'} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
        </g>
        {ondes.map(o => <path key={o.k} d={`M ${X_R - 28 + o.k * 28} ${148 - o.ph * 36} q 7 -8 14 0 t 14 0`} fill="none" stroke={C.chaleur} strokeWidth="3.5" strokeLinecap="round" opacity={(1 - o.ph) * Math.min(1, g * 1.4)}/>)}
        <text x={etroit ? X_R - 38 : X_R + 40} y="200" textAnchor={etroit ? 'end' : 'start'} fontSize={17 * Fm} fontWeight="800" fill="#334155" stroke="#fff" strokeWidth="4" paintOrder="stroke">R = {R}{NB}Ω</text>
        <text x={etroit ? X_R - 38 : X_R + 40} y={etroit ? 232 : 222} textAnchor={etroit ? 'end' : 'start'} fontSize={15 * Fm} fontWeight="800" fill={C.chaleur} stroke="#fff" strokeWidth="4" paintOrder="stroke">{pw(PR)}</text>

        {/* charges qui circulent */}
        {charges.map(([x, y], k) => <circle key={k} cx={x} cy={y} r="4.6" fill="#fde047" stroke="#a16207" strokeWidth="1.3"/>)}
        {/* flèche du sens conventionnel + intensité */}
        <g pointerEvents="none">
          <path d={`M 330 ${Y_H - 40} h 40 m -9 -7 l 9 7 l -9 7`} fill="none" stroke={C.I} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="350" y={Y_H - (etroit ? 62 : 52)} textAnchor="middle" fontSize={17 * Fm} fontWeight="800" fill={C.I} stroke="#fff" strokeWidth="4" paintOrder="stroke">I = {nbf(I, 2)}{NB}A</text>
        </g>

        {/* poignée de la tension */}
        <g>
          <text x="52" y="338" fontSize={14 * (etroit ? 1.6 : 1)} fontWeight="800" fill={C.U}>tension U (V)</text>
          <line x1={xU(0)} y1="364" x2={xU(M.TENSIONS.length - 1)} y2="364" stroke="#7c6f57" strokeWidth="6" strokeLinecap="round"/>
          <rect x={xU(0) - 14} y="344" width={xU(M.TENSIONS.length - 1) - xU(0) + 28} height="40" fill="transparent" style={{ cursor: 'pointer', touchAction: 'none' }} onPointerDown={debut('U')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait}/>
          {M.TENSIONS.map((v, i) => <g key={v}><circle cx={xU(i)} cy="364" r="5" fill="#fff" stroke="#7c6f57" strokeWidth="2"/><text x={xU(i)} y="392" textAnchor="middle" fontSize={13 * (etroit ? 1.45 : 1)} fontWeight="700" fill="#3f3a2e">{v}</text></g>)}
          <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Tension du générateur" aria-valuemin={M.TENSIONS[0]} aria-valuemax={M.TENSIONS[M.TENSIONS.length - 1]} aria-valuenow={U} aria-valuetext={`${U} volts`}
            onPointerDown={debut('U')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={ev => clavier('U', ev)}>
            <rect x={xU(iU) - (etroit ? 52 : 26)} y="338" width={etroit ? 104 : 52} height="52" fill="transparent"/>
            {!L.touche && <circle className="xa-pulse" cx={xU(iU)} cy="364" r="15" fill="none" stroke={C.U} strokeWidth="3"/>}
            <circle className="xa-anneau" cx={xU(iU)} cy="364" r="12" fill="#e0f2fe" stroke={C.U} strokeWidth="3.5" filter="url(#jx-ombre)"/>
            <path d={`M ${xU(iU) - 5} 364 h 10 M ${xU(iU) - 2} 360 l -4 4 l 4 4 M ${xU(iU) + 2} 360 l 4 4 l -4 4`} fill="none" stroke={C.U} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
        </g>
        {/* poignée de la résistance */}
        <g>
          <text x="410" y="338" fontSize={14 * (etroit ? 1.6 : 1)} fontWeight="800" fill="#334155">résistance R (Ω)</text>
          <line x1={xR(0)} y1="364" x2={xR(M.RESISTANCES.length - 1)} y2="364" stroke="#7c6f57" strokeWidth="6" strokeLinecap="round"/>
          <rect x={xR(0) - 14} y="344" width={xR(M.RESISTANCES.length - 1) - xR(0) + 28} height="40" fill="transparent" style={{ cursor: 'pointer', touchAction: 'none' }} onPointerDown={debut('R')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait}/>
          {M.RESISTANCES.map((v, i) => <g key={v}><circle cx={xR(i)} cy="364" r="5" fill="#fff" stroke="#7c6f57" strokeWidth="2"/><text x={xR(i)} y="392" textAnchor="middle" fontSize={13 * (etroit ? 1.45 : 1)} fontWeight="700" fill="#3f3a2e">{v}</text></g>)}
          <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Résistance du résistor" aria-valuemin={M.RESISTANCES[0]} aria-valuemax={M.RESISTANCES[M.RESISTANCES.length - 1]} aria-valuenow={R} aria-valuetext={`${R} ohms`}
            onPointerDown={debut('R')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={ev => clavier('R', ev)}>
            <rect x={xR(iR) - (etroit ? 52 : 26)} y="338" width={etroit ? 104 : 52} height="52" fill="transparent"/>
            {!L.touche && <circle className="xa-pulse" cx={xR(iR)} cy="364" r="15" fill="none" stroke="#334155" strokeWidth="3"/>}
            <circle className="xa-anneau" cx={xR(iR)} cy="364" r="12" fill="#f1f5f9" stroke="#334155" strokeWidth="3.5" filter="url(#jx-ombre)"/>
            <path d={`M ${xR(iR) - 5} 364 h 10 M ${xR(iR) - 2} 360 l -4 4 l 4 4 M ${xR(iR) + 2} 360 l 4 4 l -4 4`} fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
        </g>
      </svg>

      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.fin ? 700 : 400, color: L.fin ? '#15803d' : KIT.txt2 }}>{message}</div>

      <div className="xa-ctrl lect" style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {L.joue
            ? <button type="button" onClick={() => L.setJoue(false)} style={styleBouton(true, '#475569')}>⏸ Pause</button>
            : <button type="button" onClick={L.demarrer} style={styleBouton(true, '#b91c1c')}>{L.fin ? '↻ Rejouer' : '🔥 Chauffer'}</button>}
        </div>
        <label style={{ display: 'block', minWidth: 0 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Temps écoulé : {nbf(minutes, 1)} min sur {dt} min (accéléré)</span>
          <input type="range" min={0} max={T_ANIM} step={1 / 60} value={Math.min(L.t, T_ANIM)} aria-label="Temps écoulé" onChange={ev => { L.setJoue(false); L.setT(Number(ev.target.value)); L.setTouche(true); }} style={{ width: '100%', minHeight: 32 }}/>
        </label>
        <Seg label="Vitesse de lecture" valeur={L.vit} onChange={L.setVit} options={[[1, '×1'], [0.5, '×½'], [0.25, '×¼']]}/>
      </div>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Câble en série avec le résistor" valeur={r} onChange={v => regler({ r: v })} options={[[0, 'aucun'], [0.2, '0,2 Ω'], [0.5, '0,5 Ω'], [1, '1,0 Ω']]}/>
        <Seg label="Durée de fonctionnement" valeur={dt} onChange={v => regler({ dt: v })} options={[[1, '1 min'], [5, '5 min'], [10, '10 min'], [30, '30 min']]}/>
      </div>

      <div className="xa-chips" style={{ maxWidth: 920, margin: '10px auto 0', '--n': r > 0 ? 6 : 4 }}>
        {[['Intensité I', `${nbf(I, 2)} A`, C.I], ['Puissance du résistor', pw(PR), C.chaleur], ['Chaleur dégagée (résistor)', nrj(WR), C.chaleur], ...(r > 0 ? [['Pertes dans le câble', pw(Pc), C.cable], ['Chaleur perdue (câble)', nrj(WC), C.cable]] : []), ['Énergie fournie', nrj(WT), '#6d28d9']].slice(0, r > 0 ? 6 : 4).map(([n, v, c]) => (
          <div key={n} style={{ ...styleBoite, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>{n}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
          </div>))}
      </div>

      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        Loi d’Ohm : I = U ÷ R = <strong style={{ color: C.I }}>{nbf(I, 2)} A</strong>{r > 0 ? ` (R + r = ${nbf(R + r, 1)} Ω)` : ''}. Puissance dissipée dans le résistor : P = R × I² = <strong style={{ color: C.chaleur }}>{pw(PR)}</strong>. Énergie : W = P × Δt avec Δt = {dt} min = {dt * 60} s.
      </div>

      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>L’énergie qui s’accumule au fil du temps</div>
        <svg viewBox={`0 0 ${GW + 110} 210`} style={{ width: '100%', display: 'block' }} role="img" aria-label="Graphique : l’énergie électrique fournie et l’énergie thermique dégagée augmentent régulièrement avec le temps ; il se trace pendant l’animation.">
          <rect x="64" y="38" width={GW} height="112" rx="6" fill="#fafcff" stroke="#e2e8f0"/>
          {lignes.map(([v, c]) => <line key={c} x1={gx(0)} y1={gy(0)} x2={gx(tau)} y2={gy(v)} stroke={c} strokeWidth={c === '#6d28d9' ? 3 : 4} strokeLinecap="round" strokeDasharray={c === '#6d28d9' ? '9 5' : undefined}/>)}
          <text x="58" y="48" textAnchor="end" fontSize={15 * Fg} fill="#475569">{nrj(ymaxG)}</text><text x="58" y="154" textAnchor="end" fontSize={15 * Fg} fill="#475569">0</text>
          <text x={64 + GW / 2} y="176" textAnchor="middle" fontSize={15 * Fg} fill="#475569">temps (min) · de 0 à {dt}</text>
          {[[etroit ? 'fournie' : 'énergie fournie', '#6d28d9', 64], [etroit ? 'résistor' : 'chaleur du résistor', C.chaleur, etroit ? 170 : 224], ...(r > 0 ? [[etroit ? 'câble' : 'chaleur du câble', C.cable, etroit ? 290 : 440]] : [])].map(([n, c, x]) => <g key={n}><line x1={x} x2={x + 22} y1="20" y2="20" stroke={c} strokeWidth="4"/><text x={x + 28} y="25" fontSize={15 * (etroit ? 1.5 : 1)} fontWeight="700" fill={c}>{n}</text></g>)}
          <line x1={gx(tau)} x2={gx(tau)} y1="38" y2="150" stroke="#94a3b8" strokeWidth="1.5"/>
        </svg>
      </div>
    </div>);
}

