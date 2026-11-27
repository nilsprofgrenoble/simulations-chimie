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
const LT0 = -15, LT1 = 3, DUREE = 14000, PAS_LT = 0.25;            // DUREE : durée si rien ne se passait ; l'animation ralentit (jusqu'à ×7) quand des molécules changent de niveau            // l'affichage avance par quarts de décade (environ 3 fois par seconde)
const activite = (mol, lt) => { const P = M.populations(mol, 10 ** lt); return Math.min(1, (lt < -14.3 || (lt > -13.2 && lt < -11.8) ? 1 : 0) + P.flF + P.flP); };
const sup = n => String(n).replace('-', '⁻').replace(/\d/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]);
const txtT = lt => { const e = Math.floor(lt + 1e-9), m = 10 ** (lt - e); const mr = Math.round(m * 10) / 10;
  return mr >= 9.95 ? `10${sup(e + 1)}${NB}s` : mr < 1.05 ? `10${sup(e)}${NB}s` : `${String(mr).replace('.', ',')}${NB}×${NB}10${sup(e)}${NB}s`; };
const pct = v => `${v >= 0.995 ? 100 : v < 0.01 && v > 0 ? '< 1' : Math.round(100 * v)}${NB}%`;


// ---------- grains : chaque molécule excitée est un grain dont l'instant de retour est tiré au hasard ----------
// Tirage reproductible (graine = molécule) : relaxation entre 10⁻¹³ et 10⁻¹² s, sortie de S₁ de loi exponentielle (τ(S₁)),
// puis croisement intersystème vers T₁ avec la probabilité PHI_CIS, sortie de T₁ de loi exponentielle (τ(T₁)).
const NG = 60, LARG = 0.35;                                   // nombre de grains ; durée (en décades) d'une chute
// places dans chaque tas (rang 0 = en bas à gauche) : 0 = haut de S₂, 1 = bas de S₁, 2 = T₁, 3 = S₀
const ZONES = [k => [104 + (k % 14) * 6.4, 79 - Math.floor(k / 14) * 6.4], k => [104 + (k % 14) * 6.4, 147 - Math.floor(k / 14) * 6.4],
  k => [262 + (k % 14) * 9.5, 196 - Math.floor(k / 14) * 6.4], k => [66 + (k % 24) * 13.8, 286 - Math.floor(k / 24) * 6.4], k => [66 + (k % 24) * 13.8, 286 - Math.floor(k / 24) * 6.4]];   // 4 : S₀ avant le flash
// trajets : les grains descendent le long des flèches du diagramme
const CHEMINS = { '40': [[96, 280], [96, 70]], '01': [[150, 86], [150, 136]], '13': [[190, 156], [190, 282]], '12': [[208, 154], [250, 182]], '23': [[346, 204], [346, 282]] };
const COUL_G = { '40': COL.abs, '01': '#64748b', '13': COL.fluo, '12': COL.cis, '23': COL.phos };
const cacheG = {};
function grains(mol) {
  if (cacheG[mol.id]) return cacheG[mol.id];
  let a = 7919 * (mol.id.charCodeAt(0) + 3); const u = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const quantiles = n => { const q = Array.from({ length: n }, (_, k) => (k + 0.5) / n); for (let k = n - 1; k > 0; k--) { const j = Math.floor(u() * (k + 1)); [q[k], q[j]] = [q[j], q[k]]; } return q; };
  const phi = M.PHI_CIS[mol.id] ?? 0, nC = mol.tauT1 ? Math.round(phi * NG) : 0;
  const qa = quantiles(NG), qr = quantiles(NG), qf = quantiles(NG), choix = quantiles(NG), qt = quantiles(Math.max(1, nC)), g = []; let j = 0;
  for (let i = 0; i < NG; i++) {
    const la = LT0 + 0.05 + 0.5 * qa[i], lr = -13 + qr[i], tx = 10 ** lr - mol.tauS1 * Math.log(1 - qf[i]), st = [{ z: 4, t: -99 }, { z: 0, t: la }, { z: 1, t: lr }];
    if (choix[i] * NG < nC) { st.push({ z: 2, t: Math.log10(tx) }); st.push({ z: 3, t: Math.log10(tx - mol.tauT1 * Math.log(1 - qt[j++])) }); }
    else st.push({ z: 3, t: Math.log10(tx) });
    g.push(st);
  }
  return (cacheG[mol.id] = g);
}
const surChemin = (pts, f) => { const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  let r = f * tot; for (let i = 1; i < pts.length; i++) { if (r <= L[i - 1] || i === pts.length - 1) { const q = L[i - 1] ? Math.min(1, r / L[i - 1]) : 1; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * q, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * q]; } r -= L[i - 1]; }
  return pts[pts.length - 1]; };
// cible de chaque grain à l'instant lt : sa place dans le tas (les tas se tassent quand des grains partent), ou un point de sa chute (accélérée)
function cibles(gr, lt) {
  const et = gr.map((st, i) => { let k = st.length - 1; while (k > 0 && lt < st[k].t) k--;
    return { i, z: st[k].z, ta: st[k].t, q: k ? Math.min(1, (lt - st[k].t) / LARG) : 1, tr: k ? `${st[k - 1].z}${st[k].z}` : '' }; });
  const rang = []; [0, 1, 2, 3, 4].forEach(z => et.filter(e => e.z === z).sort((a, b) => a.ta - b.ta || a.i - b.i).forEach((e, r) => { rang[e.i] = r; }));
  return et.map(e => { const d = ZONES[e.z](rang[e.i]);
    return e.q >= 1 ? { p: d, c: '#0f172a' } : { p: surChemin([...CHEMINS[e.tr], d], e.tr === '40' ? 1 - (1 - e.q) * (1 - e.q) : e.q * e.q), c: COUL_G[e.tr] }; });
}
function useGrains(mol, lt, vif) {
  const refs = useRef([]), cur = useRef([]), ltR = useRef(lt), vifR = useRef(vif);
  useEffect(() => { ltR.current = lt; vifR.current = vif; });
  useEffect(() => {
    const gr = grains(mol), red = reduitMouvement(); cur.current = []; let id, last = null;
    const f = ts => {
      const dt = last == null ? 1 : Math.min(0.1, (ts - last) / 1000); last = ts;
      const v = vifR.current, l = v?.joue && v.pos ? v.pos.current : ltR.current, a = red ? 1 : 1 - Math.exp(-dt / 0.06);
      cibles(gr, l).forEach(({ p: [x, y], c }, i) => { const el = refs.current[i]; if (!el) return; let g = cur.current[i];
        if (!g) { g = cur.current[i] = { x, y, c: '' }; el.setAttribute('visibility', 'visible'); } else { g.x += (x - g.x) * a; g.y += (y - g.y) * a; }
        el.setAttribute('transform', `translate(${g.x.toFixed(1)} ${g.y.toFixed(1)})`); if (g.c !== c) { g.c = c; el.setAttribute('fill', c); } });
      id = requestAnimationFrame(f);
    };
    id = requestAnimationFrame(f);
    return () => cancelAnimationFrame(id);
  }, [mol]);
  return refs;
}

// ---------- ① diagramme ----------
const flV = (x, y1, y2, col, w, dash) => { const s = y2 < y1 ? 1 : -1;
  return <><line x1={x} y1={y1} x2={x} y2={y2 + s * 9} stroke={col} strokeWidth={w} strokeDasharray={dash}/><polygon points={`${x},${y2} ${x - 6},${y2 + s * 12} ${x + 6},${y2 + s * 12}`} fill={col}/></>; };
const ond = (x, y1, y2, col) => { let d = `M${x},${y1}`; const n = Math.max(2, Math.floor((y2 - y1) / 5)), dy = (y2 - y1) / n; for (let i = 1; i <= n; i++) d += ` L${x + (i % 2 ? 4 : -4)},${y1 + dy * i}`;
  return <><path d={d} fill="none" stroke={col} strokeWidth="2"/><polygon points={`${x},${y2 + 1} ${x - 4},${y2 - 7} ${x + 4},${y2 - 7}`} fill={col}/></>; };
const niv = (x1, x2, y, k) => [0, 1, 2].map(i => <line key={k + i} x1={x1} x2={x2} y1={y - 10 * i} y2={y - 10 * i} stroke={i ? '#94a3b8' : '#0f172a'} strokeWidth={i ? 1.1 : 2.6}/>);
function Diagramme({ mol, lt, P, sel, onSel, vif }) {
  const refsG = useGrains(mol, lt, vif);
  const B = !!mol.tauT1, actif = {
    absorption: lt < -13.5, rv: lt >= -14 && lt < -11.3, ci: lt >= -14 && lt < -11.3,
    fluo: P.flF > 0.08, cis: B && P.flF > 0.08, phos: B && P.flP > 0.08,
  };
  const g = (id, enfant, lab) => { const on = actif[id] || sel === id;
    return (<g key={id} opacity={on ? 1 : 0.22} style={{ cursor: 'pointer' }} onClick={() => onSel(sel === id ? '' : id)} role="button" tabIndex={0} aria-pressed={sel === id}
      aria-label={M.PROCESSUS.find(p => p.id === id).nom} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSel(sel === id ? '' : id))}>
      {enfant}{lab}</g>); };
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
    {Array.from({ length: NG }, (_, i) => <circle key={`${mol.id}${i}`} ref={el => { refsG.current[i] = el; }} visibility="hidden" r="3.1" fill="#0f172a" stroke="#fff" strokeWidth="1.1"/>)}
  </svg>);
}

// ---------- ② l'échantillon ----------
function Echantillon({ mol, lt, P }) {
  const cF = couleurLam(mol.lamFluo), cP = mol.lamPhos ? couleurLam(mol.lamPhos) : '#000', flash = lt < -13;
  const vu = P.flF > 0.08 && P.flP > 0.08 ? 'les deux' : P.flP > 0.08 ? 'phosphorescence' : P.flF > 0.08 ? 'fluorescence' : 'rien';
  return (<svg role="img" viewBox="0 0 300 320" style={{ display: 'block', width: '100%', maxWidth: 330, margin: '0 auto' }}
    aria-label={`Échantillon à t = ${txtT(lt)} : fluorescence ${pct(P.flF)}, phosphorescence ${mol.tauT1 ? pct(P.flP) : 'aucune'}.`}>
    <defs><radialGradient id="fl-tf"><stop offset="0" stopColor={cF} stopOpacity="1"/><stop offset="1" stopColor={cF} stopOpacity="0"/></radialGradient>
      <radialGradient id="fl-tp"><stop offset="0" stopColor={cP} stopOpacity="1"/><stop offset="1" stopColor={cP} stopOpacity="0"/></radialGradient></defs>
    <rect x="0" y="0" width="300" height="250" rx="14" fill="#0f172a"/>
    {/* flash */}
    <g opacity={flash ? 1 : 0.35}><rect x="18" y="104" width="44" height="34" rx="6" fill={flash ? '#ede9fe' : '#334155'} stroke="#a78bfa" strokeWidth="2"/>
      {T(40, 160, 'flash UV', { size: 14, gras: true, fill: '#e2e8f0' })}{T(40, 177, '350 nm', { size: 14, fill: '#cbd5e1' })}</g>
    {flash && <line x1="62" y1="121" x2="122" y2="121" stroke="#a78bfa" strokeWidth="6" opacity=".9"/>}
    {/* lueurs */}
    <circle cx="170" cy="121" r="78" fill="url(#fl-tf)" opacity={Math.min(1, P.flF * 0.95)}/>
    {mol.tauT1 && <circle cx="170" cy="121" r="78" fill="url(#fl-tp)" opacity={Math.min(1, P.flP * 0.85)}/>}
    {/* cuve */}
    <rect x="136" y="56" width="68" height="132" rx="5" fill="#ffffff" fillOpacity=".08" stroke="#e2e8f0" strokeWidth="2.4"/>
    <rect x="138" y="84" width="64" height="102" fill="#e0f2fe" fillOpacity=".18"/>
    {T(170, 216, `on voit : ${vu}`, { size: 16, gras: true, fill: '#f8fafc' })}
    {T(170, 237, `t = ${txtT(lt)}`, { size: 15, fill: '#cbd5e1' })}
    <rect x="10" y="262" width="12" height="12" rx="2" fill={cF}/>{T(28, 273, `fluorescence (${mol.lamFluo}${NB}nm) : ${pct(P.flF)}`, { size: 14.5, anchor: 'start' })}
    {mol.tauT1 ? <><rect x="10" y="286" width="12" height="12" rx="2" fill={cP}/>{T(28, 297, `phosphorescence (${mol.lamPhos}${NB}nm) : ${pct(P.flP)}`, { size: 14.5, anchor: 'start' })}</>
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
    aria-label={`Photons émis par graduation de temps, échelle logarithmique ; curseur à ${txtT(lt)}`}>
    {T(PX0, 24, 'photons émis (par graduation de temps)', { size: 14.5, fill: K.gris, anchor: 'start', gras: true })}
    <line x1={PX0} y1={YB} x2={PX1} y2={YB} stroke={K.gris}/><line x1={PX0} y1={YB} x2={PX0} y2={YB - PH - 6} stroke={K.gris}/>
    {[0, 0.5, 1].map(v => <g key={v}><line x1={PX0 - 4} x2={PX0} y1={y(v)} y2={y(v)} stroke={K.gris}/>{T(PX0 - 7, y(v) + 5, String(v).replace('.', ','), { size: 14, fill: K.gris, anchor: 'end' })}</g>)}
    {[-15, -12, -9, -6, -3, 0, 3].map(l => <g key={l}><line x1={xT(l)} y1={YB} x2={xT(l)} y2={YB + 5} stroke={K.gris}/>{T(xT(l), YB + 22, `10${sup(l)}`, { size: 14, fill: K.gris })}</g>)}
    {T(PX1, YB + 40, 't (s), échelle logarithmique', { size: 14, fill: K.gris, anchor: 'end' })}
    <rect x={xT(Math.log10(0.05))} y={YB - PH - 4} width={PX1 - xT(Math.log10(0.05))} height={PH + 4} fill="#fef3c7" opacity=".55"/>
    <path d={pts(p => p.flF)} fill="none" stroke={COL.fluo} strokeWidth="3"/>
    {mol.tauT1 && <path d={pts(p => p.flP)} fill="none" stroke={COL.phos} strokeWidth="3" strokeDasharray="8 4"/>}
    {T(xT(Math.log10(mol.tauS1)) - 12, y(0.88), 'fluorescence', { size: 14, gras: true, fill: COL.fluo, anchor: 'end', halo: true })}
    {mol.tauT1 && T(xT(Math.log10(mol.tauT1)) - 12, y(0.88), 'phosphorescence', { size: 14, gras: true, fill: COL.phos, anchor: 'end', halo: true })}
    {marques.map(([l, n, c]) => <g key={n}><circle cx={xT(l)} cy={YB + 58} r="4.5" fill={c}/>{T(Math.min(PX1 - 30, Math.max(PX0 + 14, xT(l))), YB + 76, n, { size: 13.5, gras: true, fill: c })}</g>)}
    <rect x={PX0} y={YB + 90} width="12" height="12" fill="#fde68a"/>{T(PX0 + 18, YB + 101, 'durées perçues par l’œil (plus de 0,05 s)', { size: 13.5, fill: '#92400e', anchor: 'start' })}
    <line x1={x} y1={YB} x2={x} y2={YB - PH - 10} stroke="#0f172a" strokeWidth="2"/>
    <circle cx={x} cy={y(P.flF)} r="5" fill={COL.fluo} stroke="#fff" strokeWidth="1.8"/>{mol.tauT1 && <circle cx={x} cy={y(P.flP)} r="5" fill={COL.phos} stroke="#fff" strokeWidth="1.8"/>}
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
  const ns = `${Math.round(mol.tauS1 * 1e9)}${NB}ns`;
  if (P.flF > 0.08) return `Les molécules quittent S₁ une à une, à des instants tirés au hasard (durée de vie ${ns}) : chacune qui descend vers S₀ émet un photon de fluorescence${mol.tauT1 ? ', les autres passent dans T₁ par croisement intersystème' : ''}.`;
  if (P.S1 > 0.05) return `Les molécules attendent au bas de S₁ : chacune le quittera à un instant tiré au hasard, en moyenne au bout de ${ns}. Pour l’instant, presque aucune n’a émis.`;
  if (P.flP > 0.08) return `Les molécules quittent T₁ une à une : chacune émet un photon de phosphorescence. Le retour T₁ → S₀ change le spin, il est lent${lt > Math.log10(0.05) ? ' : on le voit à l’œil après l’arrêt du flash' : ''}.`;
  if (P.T1 > 0.01) return 'La fluorescence est finie. Des molécules sont piégées dans T₁ et attendent : le retour T₁ → S₀ change le spin, il est lent.';
  return 'Toutes les molécules sont revenues dans S₀ : l’échantillon n’émet plus rien.';
};
export function VueTemps({ lt0, molFixe, onLt }) {
  const reduit = reduitMouvement();
  const [molId, setMolId] = useState(molFixe ?? 'B'), [lt, setLt] = useState(lt0 ?? (reduit ? -9 : LT0)), [joue, setJoue] = useState(false), [sel, setSel] = useState(''), [invite, setInvite] = useState(true), [reel, setReel] = useState(false);
  const mol = M.MOLS[molId], P = M.populations(mol, 10 ** lt), pos = useRef(lt0 ?? LT0);
  useEffect(() => { onLt?.(lt); }, [lt, onLt]);
  useEffect(() => {
    if (!joue) return undefined;
    let id, last = null;
    const f = ts => { if (last != null) { const l = Math.min(LT1, pos.current + Math.min(100, ts - last) / DUREE * (LT1 - LT0) / (1 + 6 * activite(mol, pos.current))); pos.current = l; const q = Math.round(l / PAS_LT) * PAS_LT; setLt(v => (v === q ? v : q)); if (l >= LT1) { setJoue(false); return; } } last = ts; id = requestAnimationFrame(f); };
    id = requestAnimationFrame(f);
    return () => cancelAnimationFrame(id);
  }, [joue, mol]);
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
      {panneau(1, 'Le diagramme de Perrin-Jablonski', <Diagramme mol={mol} lt={lt} P={P} sel={sel} onSel={setSel} vif={{ pos, joue }}/>)}
      {panneau(2, 'L’échantillon', <Echantillon mol={mol} lt={lt} P={P}/>)}
      {panneau(3, 'Les émissions au cours du temps', <Courbes mol={mol} lt={lt} onLt={regler} invite={invite && !joue}/>)}
    </div>
    <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>Faites glisser l’instant t sur le graphique (une graduation = 1 000 fois plus de temps) ; la courbe compte les photons émis à chaque instant, c’est-à-dire les grains qui tombent. Chaque grain noir du diagramme est une molécule excitée par le flash (60 sont représentées, au repos dans S₀ avant le flash) : l’instant de son retour est tiré au hasard, l’animation ralentit quand des grains changent de niveau, et l’on voit les grains s’écouler le long des flèches : vers le bas de S₁, puis vers S₀ (en vert, fluorescence) ou vers T₁ (en orange) d’où ils retombent plus tard (en rouge, phosphorescence). Touchez un processus du diagramme pour sa définition.</div>
    </>}
  </div>);
}
