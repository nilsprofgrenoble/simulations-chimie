// Vue « Le diagramme dans le temps » de la simulation 301 : trois panneaux visibles en même temps.
// ① le diagramme de Perrin-Jablonski (processus cliquables, populations dessinées), ② l'échantillon tel qu'on le voit,
// ③ les intensités de fluorescence et de phosphorescence en fonction du temps (échelle logarithmique), avec un curseur d'instant.
// Flash très bref à t = 0 ; l'animation fait défiler le temps de 10⁻¹⁵ s à 10³ s.
import { useState, useEffect, useRef } from "react";
import { K, T } from "./schemaOutils";
import * as M from "./fluoModele";
import { couleurLam } from "./fluoDispositif";
import { reduitMouvement } from "./hookHorloge";
import { KIT, stylePetitBouton, styleBouton } from "../commun";

const NB = ' ';
const COL = { abs: '#7c3aed', fluo: '#15803d', phos: '#b91c1c', cis: '#c2410c', nr: '#64748b' };
const LT0 = -15, LT1 = 3, DUREE = 24000, PAS_LT = 0.25;            // l'affichage avance par quarts de décade (environ 3 fois par seconde)
const sup = n => String(n).replace('-', '⁻').replace(/\d/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]);
const txtT = lt => { const e = Math.floor(lt + 1e-9), m = 10 ** (lt - e); const mr = Math.round(m * 10) / 10;
  return mr >= 9.95 ? `10${sup(e + 1)}${NB}s` : mr < 1.05 ? `10${sup(e)}${NB}s` : `${String(mr).replace('.', ',')}${NB}×${NB}10${sup(e)}${NB}s`; };
const pct = v => `${v >= 0.995 ? 100 : v < 0.01 && v > 0 ? '< 1' : Math.round(100 * v)}${NB}%`;

// ---------- ① diagramme ----------
const flV = (x, y1, y2, col, w, dash) => { const s = y2 < y1 ? 1 : -1;
  return <><line x1={x} y1={y1} x2={x} y2={y2 + s * 9} stroke={col} strokeWidth={w} strokeDasharray={dash}/><polygon points={`${x},${y2} ${x - 6},${y2 + s * 12} ${x + 6},${y2 + s * 12}`} fill={col}/></>; };
const ond = (x, y1, y2, col) => { let d = `M${x},${y1}`; const n = Math.max(2, Math.floor((y2 - y1) / 5)), dy = (y2 - y1) / n; for (let i = 1; i <= n; i++) d += ` L${x + (i % 2 ? 4 : -4)},${y1 + dy * i}`;
  return <><path d={d} fill="none" stroke={col} strokeWidth="2"/><polygon points={`${x},${y2 + 1} ${x - 4},${y2 - 7} ${x + 4},${y2 - 7}`} fill={col}/></>; };
const niv = (x1, x2, y, k) => [0, 1, 2].map(i => <line key={k + i} x1={x1} x2={x2} y1={y - 10 * i} y2={y - 10 * i} stroke={i ? '#94a3b8' : '#0f172a'} strokeWidth={i ? 1.1 : 2.6}/>);
function Diagramme({ mol, lt, P, sel, onSel }) {
  const B = !!mol.tauT1, actif = {
    absorption: lt < -13.5, rv: lt >= -14 && lt < -11.3, ci: lt >= -14 && lt < -11.3,
    fluo: lt >= -12.5 && P.fluo > 0.01, cis: B && lt >= -12.5 && P.fluo > 0.01, phos: B && lt >= -10 && P.phos > 0.01,
  };
  const g = (id, enfant, lab) => { const on = actif[id] || sel === id;
    return (<g key={id} opacity={on ? 1 : 0.22} style={{ cursor: 'pointer' }} onClick={() => onSel(sel === id ? '' : id)} role="button" tabIndex={0} aria-pressed={sel === id}
      aria-label={M.PROCESSUS.find(p => p.id === id).nom} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSel(sel === id ? '' : id))}>
      {enfant}{lab}</g>); };
  const bulle = (x, y, p, k) => p > 0.004 && <circle key={k} cx={x} cy={y} r={4 + 13 * Math.sqrt(p)} fill="#0f172a" opacity=".82" stroke="#fff" strokeWidth="2"/>;
  return (<svg role="img" viewBox="0 0 430 320" style={{ display: 'block', width: '100%' }}
    aria-label={`Diagramme de Perrin-Jablonski à t = ${txtT(lt)}. Molécules excitées : niveaux de vibration élevés ${pct(P.chaud)}, bas de S1 ${pct(P.S1)}${B ? `, T1 ${pct(P.T1)}` : ''}, revenues dans S0 ${pct(P.S0)}.`}>
    {T(10, 22, 'E', { size: 16, gras: true, anchor: 'start' })}<line x1="14" y1="300" x2="14" y2="34" stroke={K.gris} strokeWidth="1.4"/><polygon points="14,28 10,38 18,38" fill={K.gris}/>
    {T(25, 22, '(écarts non à l’échelle)', { size: 13.5, fill: K.gris, anchor: 'start' })}
    {niv(60, 400, 290, 's0')}{T(54, 295, 'S₀', { size: 16, gras: true, anchor: 'end' })}
    {niv(60, 206, 150, 's1')}{T(54, 155, 'S₁', { size: 16, gras: true, anchor: 'end' })}
    {niv(60, 206, 82, 's2')}{T(54, 87, 'S₂', { size: 16, gras: true, anchor: 'end' })}
    {B && <>{niv(254, 400, 200, 't1')}{T(404, 205, 'T₁', { size: 16, gras: true, anchor: 'start' })}</>}
    {g('absorption', <>{flV(80, 288, 132, COL.abs, 4)}{flV(96, 288, 64, COL.abs, 4)}</>, T(104, 222, 'absorption', { size: 15, gras: true, fill: COL.abs, anchor: 'start', halo: true }))}
    {g('rv', <>{ond(126, 130, 148, COL.nr)}{ond(126, 62, 80, COL.nr)}{B && ond(270, 180, 198, COL.nr)}</>, T(134, 128, 'RV', { size: 14, gras: true, fill: COL.nr, anchor: 'start', halo: true }))}
    {g('ci', <>{flV(150, 82, 132, COL.nr, 2.2, '5 4')}</>, T(158, 110, 'CI', { size: 14, gras: true, fill: COL.nr, anchor: 'start', halo: true }))}
    {g('fluo', <>{flV(190, 152, 288, COL.fluo, 4.2)}</>, T(198, 230, 'fluorescence', { size: 15, gras: true, fill: COL.fluo, anchor: 'start', halo: true }))}
    {B && g('cis', <><line x1="206" y1="152" x2="248" y2="178" stroke={COL.cis} strokeWidth="2.6" strokeDasharray="6 4"/><polygon points="254,182 241,180 247,170" fill={COL.cis}/></>, T(232, 152, 'CIS', { size: 14, gras: true, fill: COL.cis, anchor: 'start', halo: true }))}
    {B && g('phos', <>{flV(346, 202, 288, COL.phos, 4.2, '9 4')}</>, T(338, 256, 'phosphorescence', { size: 15, gras: true, fill: COL.phos, anchor: 'end', halo: true }))}
    {bulle(112, 66, P.chaud, 'c')}{bulle(110, 142, P.S1, 's1p')}{B && bulle(310, 192, P.T1, 't1p')}{bulle(250, 282, P.S0, 's0p')}
  </svg>);
}

// ---------- ② l'échantillon ----------
function Echantillon({ mol, lt, P }) {
  const cF = couleurLam(mol.lamFluo), cP = mol.lamPhos ? couleurLam(mol.lamPhos) : '#000', flash = lt < -13;
  const vu = P.fluo > 0.01 && P.phos > 0.01 ? 'les deux' : P.phos > 0.01 ? 'phosphorescence' : P.fluo > 0.01 ? 'fluorescence' : 'rien';
  return (<svg role="img" viewBox="0 0 300 320" style={{ display: 'block', width: '100%', maxWidth: 330, margin: '0 auto' }}
    aria-label={`Échantillon à t = ${txtT(lt)} : fluorescence ${pct(P.fluo)}, phosphorescence ${mol.tauT1 ? pct(P.phos) : 'aucune'}.`}>
    <defs><radialGradient id="fl-tf"><stop offset="0" stopColor={cF} stopOpacity="1"/><stop offset="1" stopColor={cF} stopOpacity="0"/></radialGradient>
      <radialGradient id="fl-tp"><stop offset="0" stopColor={cP} stopOpacity="1"/><stop offset="1" stopColor={cP} stopOpacity="0"/></radialGradient></defs>
    <rect x="0" y="0" width="300" height="250" rx="14" fill="#0f172a"/>
    {/* flash */}
    <g opacity={flash ? 1 : 0.35}><rect x="18" y="104" width="44" height="34" rx="6" fill={flash ? '#ede9fe' : '#334155'} stroke="#a78bfa" strokeWidth="2"/>
      {T(40, 160, 'flash UV', { size: 14, gras: true, fill: '#e2e8f0' })}{T(40, 177, '350 nm', { size: 14, fill: '#cbd5e1' })}</g>
    {flash && <line x1="62" y1="121" x2="122" y2="121" stroke="#a78bfa" strokeWidth="6" opacity=".9"/>}
    {/* lueurs */}
    <circle cx="170" cy="121" r="78" fill="url(#fl-tf)" opacity={Math.min(1, P.fluo * 0.95)}/>
    {mol.tauT1 && <circle cx="170" cy="121" r="78" fill="url(#fl-tp)" opacity={Math.min(1, P.phos * 0.85)}/>}
    {/* cuve */}
    <rect x="136" y="56" width="68" height="132" rx="5" fill="#ffffff" fillOpacity=".08" stroke="#e2e8f0" strokeWidth="2.4"/>
    <rect x="138" y="84" width="64" height="102" fill="#e0f2fe" fillOpacity=".18"/>
    {T(170, 216, `on voit : ${vu}`, { size: 16, gras: true, fill: '#f8fafc' })}
    {T(170, 237, `t = ${txtT(lt)}`, { size: 15, fill: '#cbd5e1' })}
    <rect x="10" y="262" width="12" height="12" rx="2" fill={cF}/>{T(28, 273, `fluorescence (${mol.lamFluo}${NB}nm) : ${pct(P.fluo)}`, { size: 14.5, anchor: 'start' })}
    {mol.tauT1 ? <><rect x="10" y="286" width="12" height="12" rx="2" fill={cP}/>{T(28, 297, `phosphorescence (${mol.lamPhos}${NB}nm) : ${pct(P.phos)}`, { size: 14.5, anchor: 'start' })}</>
      : T(10, 297, 'cette molécule ne phosphoresce pas', { size: 14.5, anchor: 'start', fill: K.gris })}
  </svg>);
}

// ---------- ③ intensités en fonction du temps ----------
const PX0 = 48, PX1 = 410, YB = 214, PH = 160;
const xT = lt => PX0 + (lt - LT0) / (LT1 - LT0) * (PX1 - PX0), ltX = x => LT0 + (x - PX0) / (PX1 - PX0) * (LT1 - LT0);
function Courbes({ mol, lt, onLt, invite }) {
  const y = v => YB - PH * v;
  const pts = f => { let d = ''; for (let l = LT0; l <= LT1 + 1e-9; l += 0.05) d += `${d ? 'L' : 'M'}${xT(l).toFixed(1)},${y(f(M.populations(mol, 10 ** l))).toFixed(1)}`; return d; };
  const drag = useRef(false);
  const ev = (t, e) => { if (t === 'down') { drag.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); } if (t === 'up') { drag.current = false; return; } if (!drag.current) return;
    const r = e.currentTarget.getBoundingClientRect(); onLt(Math.min(LT1, Math.max(LT0, ltX((e.clientX - r.left) * 430 / r.width)))); };
  const marques = [[-15, 'abs.', COL.abs], [-12, 'RV, CI', COL.nr], [Math.log10(mol.tauS1), 'fluo.', COL.fluo], ...(mol.tauT1 ? [[Math.log10(mol.tauT1), 'phospho.', COL.phos]] : [])];
  const P = M.populations(mol, 10 ** lt), x = xT(lt);
  return (<svg role="img" viewBox="0 0 430 320" style={{ display: 'block', width: '100%', touchAction: 'none' }}
    onPointerDown={e => ev('down', e)} onPointerMove={e => ev('move', e)} onPointerUp={e => ev('up', e)} onPointerCancel={e => ev('up', e)}
    aria-label={`Intensités en fonction du temps, échelle logarithmique ; curseur à ${txtT(lt)}`}>
    {T(PX0, 24, 'intensité relative', { size: 14.5, fill: K.gris, anchor: 'start', gras: true })}
    <line x1={PX0} y1={YB} x2={PX1} y2={YB} stroke={K.gris}/><line x1={PX0} y1={YB} x2={PX0} y2={YB - PH - 6} stroke={K.gris}/>
    {[0, 0.5, 1].map(v => <g key={v}><line x1={PX0 - 4} x2={PX0} y1={y(v)} y2={y(v)} stroke={K.gris}/>{T(PX0 - 7, y(v) + 5, String(v).replace('.', ','), { size: 14, fill: K.gris, anchor: 'end' })}</g>)}
    {[-15, -12, -9, -6, -3, 0, 3].map(l => <g key={l}><line x1={xT(l)} y1={YB} x2={xT(l)} y2={YB + 5} stroke={K.gris}/>{T(xT(l), YB + 22, `10${sup(l)}`, { size: 14, fill: K.gris })}</g>)}
    {T(PX1, YB + 40, 't (s), échelle logarithmique', { size: 14, fill: K.gris, anchor: 'end' })}
    <rect x={xT(Math.log10(0.05))} y={YB - PH - 4} width={PX1 - xT(Math.log10(0.05))} height={PH + 4} fill="#fef3c7" opacity=".55"/>
    <path d={pts(p => p.fluo)} fill="none" stroke={COL.fluo} strokeWidth="3"/>
    {mol.tauT1 && <path d={pts(p => p.phos)} fill="none" stroke={COL.phos} strokeWidth="3" strokeDasharray="8 4"/>}
    {T(xT(-14), y(1) - 8, 'fluorescence', { size: 14, gras: true, fill: COL.fluo, anchor: 'start' })}
    {mol.tauT1 && T(xT(-4.6), y(1) - 8, 'phosphorescence', { size: 14, gras: true, fill: COL.phos, anchor: 'start' })}
    {marques.map(([l, n, c]) => <g key={n}><circle cx={xT(l)} cy={YB + 58} r="4.5" fill={c}/>{T(Math.min(PX1 - 30, Math.max(PX0 + 14, xT(l))), YB + 76, n, { size: 13.5, gras: true, fill: c })}</g>)}
    <rect x={PX0} y={YB + 90} width="12" height="12" fill="#fde68a"/>{T(PX0 + 18, YB + 101, 'durées perçues par l’œil (plus de 0,05 s)', { size: 13.5, fill: '#92400e', anchor: 'start' })}
    <line x1={x} y1={YB} x2={x} y2={YB - PH - 10} stroke="#0f172a" strokeWidth="2"/>
    <circle cx={x} cy={y(P.fluo)} r="5" fill={COL.fluo} stroke="#fff" strokeWidth="1.8"/>{mol.tauT1 && <circle cx={x} cy={y(P.phos)} r="5" fill={COL.phos} stroke="#fff" strokeWidth="1.8"/>}
    <g role="slider" tabIndex={0} aria-label="Instant t" aria-valuemin={LT0} aria-valuemax={LT1} aria-valuenow={Math.round(lt * 10) / 10} aria-valuetext={txtT(lt)} style={{ cursor: 'ew-resize', outline: 'none' }}
      onKeyDown={e => { const d = { ArrowLeft: -0.25, ArrowRight: 0.25, ArrowDown: -0.25, ArrowUp: 0.25 }[e.key]; if (d) { e.preventDefault(); onLt(Math.min(LT1, Math.max(LT0, lt + d * (e.shiftKey ? 4 : 1)))); } }}>
      <rect x={x - 22} y={YB - PH - 30} width="44" height={PH + 44} fill="transparent"/>
      <circle cx={x} cy={YB - PH - 16} r="9" fill="#0f172a" stroke="#fff" strokeWidth="2" className={invite ? 'fl-pulse' : undefined}/></g>
  </svg>);
}

// ---------- vue complète ----------
const phrase = (mol, lt, P) => {
  if (lt < -13.5) return 'Le flash est absorbé en 10⁻¹⁵ s environ : les molécules montent dans des niveaux de vibration élevés de S₁ ou de S₂.';
  if (lt < -11.5) return 'Relaxation vibrationnelle et conversion interne (≈ 10⁻¹² s) : les molécules descendent au bas de S₁ sans émettre de photon (chaleur cédée au solvant).';
  if (P.fluo > 0.01) return `Les molécules attendent au bas de S₁ (durée de vie ${Math.round(mol.tauS1 * 1e9)}${NB}ns) et le quittent en émettant la fluorescence${mol.tauT1 ? ', ou en passant dans T₁ par croisement intersystème' : ''}.`;
  if (P.phos > 0.01) return `La fluorescence est éteinte. Des molécules sont piégées dans T₁ : le retour T₁ → S₀ change le spin, il est lent, d’où la phosphorescence${lt > Math.log10(0.05) ? ', visible à l’œil après l’arrêt du flash' : ''}.`;
  return 'Toutes les molécules sont revenues dans S₀ : l’échantillon n’émet plus rien.';
};

// ---------- temps réel : la lampe éclaire en continu, puis on l'arrête ----------
// À vitesse réelle, la fluorescence (quelques ns) suit la lampe sans retard visible : elle disparaît dès qu'on coupe l'excitation.
// La phosphorescence (T₁, durée de vie de l'ordre de la seconde) monte et s'éteint avec la constante de temps τ(T₁), sans changer d'échelle.
const NS = 120, DT = 100;                                   // 120 échantillons toutes les 0,1 s : fenêtre glissante de 12 s
function VueReel({ mol }) {
  const B = !!mol.tauT1, init = () => Array.from({ length: NS }, () => ({ l: 1, f: 1, p: B ? 1 : 0 }));
  const [lampe, setLampe] = useState(true), [h, setH] = useState(init), lampeRef = useRef(true), dern = useRef(0);
  useEffect(() => {
    dern.current = performance.now();
    const id = setInterval(() => { const n = performance.now(), dt = (n - dern.current) / 1000; dern.current = n;
      setH(a => { const q = a[a.length - 1], on = lampeRef.current, p = B ? q.p + ((on ? 1 : 0) - q.p) * (1 - Math.exp(-dt / mol.tauT1)) : 0; return [...a.slice(1), { l: on ? 1 : 0, f: on ? 1 : 0, p }]; }); }, DT);
    return () => clearInterval(id);
  }, [mol, B]);
  const bascule = () => { const on = !lampeRef.current; lampeRef.current = on; setLampe(on);
    setH(a => { const q = a[a.length - 1]; return [...a.slice(1), { l: on ? 1 : 0, f: on ? 1 : 0, p: q.p }]; }); };
  const cF = couleurLam(mol.lamFluo), cP = B ? couleurLam(mol.lamPhos) : '#000', q = h[h.length - 1];
  const vu = lampe ? 'la lampe et la fluorescence' : q.p > 0.05 ? 'la phosphorescence seule' : 'rien';
  const X0 = 22, X1 = 410, YB2 = 204, PH2 = 130, x = i => X0 + i / (NS - 1) * (X1 - X0), y = v => YB2 - PH2 * v;
  const ligne = k => h.map((e, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(e[k]).toFixed(1)}`).join('');
  const bandes = []; h.forEach((e, i) => { if (e.l && i < NS - 1) bandes.push(<rect key={i} x={x(i)} y="34" width={x(i + 1) - x(i) + 0.6} height="14" fill="#a78bfa"/>); });
  return (<div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <button onClick={bascule} aria-pressed={!lampe} style={styleBouton(!lampe, '#7c3aed')}>{lampe ? '⏹ Arrêter l’excitation' : '💡 Rallumer la lampe'}</button>
      <span style={{ fontSize: 13.5, color: KIT.txt2 }}>Vitesse réelle : une seconde à l’écran dure une seconde.</span></div>
    <div role="status" aria-live="off" style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.45, marginBottom: 8, minHeight: '6.2em' }}>
      {lampe ? <>La lampe UV éclaire en continu : on voit la lampe et la lueur de fluorescence, qui est émise {B ? 'en même temps que' : 'tant que dure'} l’excitation{B ? ', avec une lueur de phosphorescence qui se met en place en une seconde environ' : ''}. Cliquez sur « Arrêter l’excitation ».</>
        : <>La fluorescence s’éteint en même temps que la lampe : sa durée de vie ({Math.round(mol.tauS1 * 1e9)}{NB}ns) est des millions de fois trop courte pour que l’œil voie une trace.{B ? ' La phosphorescence, elle, persiste et s’éteint en quelques secondes : T₁ se vide lentement car le retour T₁ → S₀ est « interdit » (changement de spin).' : ' Cette molécule ne phosphoresce pas : l’échantillon est tout de suite noir.'}</>}</div>
    <div className="fl-pr">
      <div style={{ background: '#fff', border: `1px solid ${KIT.bord}`, borderRadius: 12, padding: '8px 8px 4px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, margin: '0 0 2px 4px' }}>L’échantillon, tel qu’on le voit</div>
        <svg role="img" viewBox="0 0 300 250" style={{ display: 'block', width: '100%', maxWidth: 330, margin: '0 auto' }}
          aria-label={`Échantillon : lampe ${lampe ? 'allumée' : 'éteinte'}, on voit ${vu}.`}>
          <defs><radialGradient id="fl-rf"><stop offset="0" stopColor={cF} stopOpacity="1"/><stop offset="1" stopColor={cF} stopOpacity="0"/></radialGradient>
            <radialGradient id="fl-rp"><stop offset="0" stopColor={cP} stopOpacity="1"/><stop offset="1" stopColor={cP} stopOpacity="0"/></radialGradient></defs>
          <rect x="0" y="0" width="300" height="250" rx="14" fill="#0f172a"/>
          <g opacity={lampe ? 1 : 0.4}><rect x="18" y="104" width="44" height="34" rx="6" fill={lampe ? '#ede9fe' : '#334155'} stroke="#a78bfa" strokeWidth="2"/>
            {T(40, 160, 'lampe UV', { size: 14, gras: true, fill: '#e2e8f0' })}{T(40, 177, '350 nm', { size: 14, fill: '#cbd5e1' })}</g>
          {lampe && <line x1="62" y1="121" x2="136" y2="121" stroke="#a78bfa" strokeWidth="6" opacity=".9"/>}
          <circle cx="170" cy="121" r="78" fill="url(#fl-rf)" opacity={Math.min(1, q.f * 0.95)}/>
          {B && <circle cx="170" cy="121" r="78" fill="url(#fl-rp)" opacity={Math.min(1, q.p * 0.85)}/>}
          <rect x="136" y="56" width="68" height="132" rx="5" fill="#ffffff" fillOpacity=".08" stroke="#e2e8f0" strokeWidth="2.4"/>
          <rect x="138" y="84" width="64" height="102" fill="#e0f2fe" fillOpacity=".18"/>
          {T(170, 220, `on voit : ${vu}`, { size: 15, gras: true, fill: '#f8fafc' })}</svg></div>
      <div style={{ background: '#fff', border: `1px solid ${KIT.bord}`, borderRadius: 12, padding: '8px 8px 4px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, margin: '0 0 2px 4px' }}>Ce qui est émis, au fil des 12 dernières secondes</div>
        <svg role="img" viewBox="0 0 430 250" style={{ display: 'block', width: '100%' }} aria-label="Intensités relatives de fluorescence et de phosphorescence sur les 12 dernières secondes, échelle linéaire.">
          {T(X0, 28, 'lampe allumée', { size: 13, fill: '#6d28d9', anchor: 'start', gras: true })}{bandes}
          <line x1={X0} y1={YB2} x2={X1} y2={YB2} stroke="#94a3b8" strokeWidth="1.4"/><line x1={X0} y1={y(1)} x2={X1} y2={y(1)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4"/>
          {B && <path d={ligne('p')} fill="none" stroke={COL.phos} strokeWidth="6" strokeLinejoin="round"/>}
          <path d={ligne('f')} fill="none" stroke={COL.fluo} strokeWidth="2.4" strokeLinejoin="round"/>
          {T(X0, YB2 + 20, 'il y a 12 s', { size: 13.5, fill: K.gris, anchor: 'start' })}{T(X1, YB2 + 20, 'maintenant', { size: 13.5, fill: K.gris, anchor: 'end', gras: true })}
          <rect x="22" y="228" width="12" height="12" rx="2" fill={COL.fluo}/>{T(40, 239, 'fluorescence', { size: 13.5, anchor: 'start' })}
          {B ? <><rect x="150" y="228" width="12" height="12" rx="2" fill={COL.phos}/>{T(168, 239, 'phosphorescence', { size: 13.5, anchor: 'start' })}</> : T(150, 239, 'cette molécule ne phosphoresce pas', { size: 13.5, anchor: 'start', fill: K.gris })}
        </svg></div></div>
    <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>La courbe défile : la fluorescence suit la lampe sans le moindre retard visible (échelle de 10⁻⁹ s), alors que la phosphorescence met environ une seconde à s’installer puis à disparaître. L’échelle logarithmique de l’autre vue sert justement à voir ces deux durées sur un même graphique.</div>
  </div>);
}

export function VueTemps({ lt0, molFixe, onLt }) {
  const reduit = reduitMouvement();
  const [molId, setMolId] = useState(molFixe ?? 'B'), [lt, setLt] = useState(lt0 ?? (reduit ? -9 : LT0)), [joue, setJoue] = useState(false), [sel, setSel] = useState(''), [invite, setInvite] = useState(true), [reel, setReel] = useState(false);
  const mol = M.MOLS[molId], P = M.populations(mol, 10 ** lt), pos = useRef(lt0 ?? LT0);
  useEffect(() => { onLt?.(lt); }, [lt, onLt]);
  useEffect(() => {
    if (!joue) return undefined;
    let id, last = null;
    const f = ts => { if (last != null) { const l = Math.min(LT1, pos.current + (ts - last) / DUREE * (LT1 - LT0)); pos.current = l; const q = Math.round(l / PAS_LT) * PAS_LT; setLt(v => (v === q ? v : q)); if (l >= LT1) { setJoue(false); return; } } last = ts; id = requestAnimationFrame(f); };
    id = requestAnimationFrame(f);
    return () => cancelAnimationFrame(id);
  }, [joue]);
  const lancer = () => { if (joue) { setJoue(false); return; } pos.current = lt >= LT1 - 0.01 || lt <= LT0 + 0.01 ? LT0 : lt; if (pos.current === LT0) setLt(LT0); setInvite(false); setJoue(true); };
  const regler = l => { setJoue(false); setInvite(false); pos.current = l; setLt(l); };
  const pr = M.PROCESSUS.find(p => p.id === sel);
  const panneau = (n, t, enfant) => (<div style={{ background: '#fff', border: `1px solid ${KIT.bord}`, borderRadius: 12, padding: '8px 8px 4px' }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, margin: '0 0 2px 4px' }}><span style={{ display: 'inline-block', width: 22, height: 22, lineHeight: '22px', borderRadius: 11, background: '#16a34a', color: '#fff', textAlign: 'center', fontSize: 13, marginRight: 6 }}>{n}</span>{t}</div>{enfant}</div>);
  return (<div>
    <style>{`
      .fl-pt { display: grid; gap: 10px; grid-template-columns: minmax(0, 1fr); }
      .fl-pr { display: grid; gap: 10px; grid-template-columns: minmax(0, 1fr); }
      @media (min-width: 900px) { .fl-pr { grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); } .fl-pt { grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.8fr) minmax(0, 1.15fr); } }
      @media (prefers-reduced-motion: no-preference) { .fl-pulse { animation: fl-pulse 1.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; } @keyframes fl-pulse { 50% { transform: scale(1.4); } } }
    `}</style>
    {!molFixe && <div role="group" aria-label="Échelle de temps" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 13.5, color: KIT.txt2 }}>Échelle de temps</span>
      {[[false, 'Logarithmique (de 10⁻¹⁵ s à 10³ s)'], [true, 'Temps réel (lampe allumée)']].map(([r, l]) => <button key={l} onClick={() => { setJoue(false); setReel(r); }} aria-pressed={reel === r} style={stylePetitBouton(reel === r, '#334155')}>{l}</button>)}</div>}
    {reel ? <>
      {!molFixe && <div role="group" aria-label="Molécule" style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13.5, color: KIT.txt2 }}>Molécule</span>
        {[['A', 'A (fluo.)'], ['B', 'B (phospho.)']].map(([k, l]) => <button key={k} onClick={() => { setMolId(k); setSel(''); }} aria-pressed={molId === k} style={stylePetitBouton(molId === k, '#334155')}>{l}</button>)}</div>}
      <VueReel key={mol.id} mol={mol}/></> : <>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <button onClick={lancer} aria-pressed={joue} style={styleBouton(joue, '#16a34a')}>{joue ? '⏸ Pause' : lt > LT0 + 0.01 && lt < LT1 - 0.01 ? '▶ Reprendre' : '▶ Flash à t = 0'}</button>
      <button onClick={() => { setJoue(false); setInvite(true); pos.current = LT0; setLt(LT0); }} disabled={lt <= LT0 + 0.01 && !joue} style={styleBouton(false, '#334155')}>↺ Revenir au début</button>
      {!molFixe && <div role="group" aria-label="Molécule" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 13.5, color: KIT.txt2 }}>Molécule</span>
        {[['A', 'A (fluo.)'], ['B', 'B (phospho.)']].map(([k, l]) => <button key={k} onClick={() => { setMolId(k); setSel(''); }} aria-pressed={molId === k} style={stylePetitBouton(molId === k, '#334155')}>{l}</button>)}
      </div>}
      <span style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, fontVariantNumeric: 'tabular-nums', minWidth: '9.5em' }}>t = {txtT(lt)}</span>
    </div>
    <div role="status" aria-live="off" style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.45, marginBottom: 8, minHeight: '4.4em' }}>
      {pr ? <><strong>{pr.nom}</strong> ({pr.duree}, {pr.radiatif ? 'avec' : 'sans'} photon) : {pr.desc}.</> : phrase(mol, lt, P)}</div>
    <div className="fl-pt">
      {panneau(1, 'Le diagramme de Perrin-Jablonski', <Diagramme mol={mol} lt={lt} P={P} sel={sel} onSel={setSel}/>)}
      {panneau(2, 'L’échantillon', <Echantillon mol={mol} lt={lt} P={P}/>)}
      {panneau(3, 'Les émissions au cours du temps', <Courbes mol={mol} lt={lt} onLt={regler} invite={invite && !joue}/>)}
    </div>
    <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>Faites glisser l’instant t sur le graphique (une graduation = 1 000 fois plus de temps). Les disques noirs du diagramme représentent les molécules excitées par le flash. Touchez un processus du diagramme pour sa définition.</div>
    </>}
  </div>);
}
