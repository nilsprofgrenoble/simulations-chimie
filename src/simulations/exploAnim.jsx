/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef, useCallback } from "react";
import { KIT, styleBouton, stylePetitBouton, styleBoite } from "../commun";
import { NB } from "./Distillation";

// ====================================================
//  Briques communes des explorations ANIMÉES (Flipper 263, Looping 262, chutes, lancers…).
//  Une exploration = une scène SVG propre à la simulation + ces briques :
//    useLecture : lecture / pause / ralenti / curseur de temps (les images sont calculées d'avance par le modèle),
//    BarresEnergie (panneau dans la scène) ou BarresHtml (téléphone), GrapheTemps (tracé en direct), BarreLecture, Chips.
// ====================================================
export const COL = { Ec: '#0369a1', Epp: '#c2410c', Em: '#6d28d9', v: '#15803d', ink: '#0f172a', gris: '#475569', rouge: '#dc2626' };
export const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
export const J = v => Math.abs(v) >= 1e4 ? `${nbf(v / 1000, Math.abs(v) < 1e5 ? 1 : 0)}${NB}kJ` : `${nbf(v, Math.abs(v) < 0.1 ? 3 : Math.abs(v) < 100 ? 2 : 0)}${NB}J`;
export const FPS = 120;

export const Seg = ({ label, valeur, options, onChange }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{label}</div>
    <div role="group" aria-label={label} style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {options.map(([v, l]) => <button key={String(v)} type="button" onClick={() => onChange(v)} aria-pressed={valeur === v} style={{ ...stylePetitBouton(valeur === v, '#0369a1'), minHeight: 38 }}>{l}</button>)}
    </div>
  </div>);

export function useEtroit(ref, seuil = 600) {
  const [etroit, setEtroit] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => setEtroit(el.clientWidth < seuil)); ro.observe(el); setEtroit(el.clientWidth < seuil);
    return () => ro.disconnect();
  }, [ref, seuil]);
  return etroit;
}

// Lecture d'une trajectoire d'avance calculée : t en secondes, tFin = durée totale.
export function useLecture(tFin, auto = true) {
  const [t, setT] = useState(0), [joue, setJoue] = useState(false), [vit, setVit] = useState(1), [touche, setTouche] = useState(false);
  const raf = useRef(0);
  const fin = tFin > 0 && t >= tFin - 1e-9;
  useEffect(() => {
    if (!joue) return undefined;
    let dernier = performance.now();
    const pas = now => {
      const dt = Math.min((now - dernier) / 1000, 0.05); dernier = now;
      let fini = false;
      setT(x => { const y = x + dt * vit; if (y >= tFin) { fini = true; return tFin; } return y; });
      if (fini) setJoue(false); else raf.current = requestAnimationFrame(pas);
    };
    raf.current = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf.current);
  }, [joue, vit, tFin]);
  useEffect(() => {
    if (!auto) return undefined;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setTimeout(() => { setT(0); setJoue(true); }, 700);
    return () => clearTimeout(id);
  }, [auto]);
  const demarrer = useCallback(() => { setT(0); setJoue(true); setTouche(true); }, []);
  const reset = useCallback(() => { setJoue(false); setT(0); }, []);
  return { t, setT, joue, setJoue, vit, setVit, fin, demarrer, reset, touche, setTouche };
}
export const imageA = (frames, t) => frames[Math.max(0, Math.min(frames.length - 1, Math.round(t * FPS)))];

// Coordonnées SVG d'un événement souris / doigt
export function coordSvg(svg, ev) { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const m = pt.matrixTransform(svg.getScreenCTM().inverse()); return { X: m.x, Y: m.y }; }

export const StyleAnim = () => (
  <style>{`
    .xa-svg { width: 100%; max-width: 920px; display: block; margin: 0 auto; border-radius: 14px; touch-action: manipulation; user-select: none; -webkit-user-select: none; box-shadow: 0 1px 2px rgba(15,23,42,.08), 0 8px 24px rgba(3,105,161,.10); }
    .xa-poignee { cursor: grab; touch-action: none; outline: none; } .xa-poignee:active { cursor: grabbing; }
    .xa-poignee:focus-visible .xa-anneau { stroke: #0f172a; stroke-width: 3; }
    .xa-ctrl { display: grid; gap: 12px; grid-template-columns: minmax(0, 1fr); margin-top: 10px; }
    .xa-chips { display: grid; gap: 8px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 10px; }
    @media (min-width: 700px) { .xa-ctrl.lect { grid-template-columns: auto minmax(0, 1fr) auto; align-items: end; } .xa-chips { grid-template-columns: repeat(var(--n, 6), minmax(0, 1fr)); } }
    @media (prefers-reduced-motion: no-preference) {
      .xa-pulse { animation: xa-p 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      @keyframes xa-p { 0%, 100% { transform: scale(1); opacity: .9; } 50% { transform: scale(1.35); opacity: .35; } }
      .xa-tire { animation: xa-t 1.1s ease-in-out infinite; } @keyframes xa-t { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
    }
  `}</style>);

export const DefsAnim = () => (
  <defs>
    <linearGradient id="xa-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bae6fd"/><stop offset="0.7" stopColor="#f0f9ff"/><stop offset="1" stopColor="#ffffff"/></linearGradient>
    <linearGradient id="xa-sol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d6d3d1"/><stop offset="1" stopColor="#a8a29e"/></linearGradient>
    <linearGradient id="xa-acier" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e2e8f0"/><stop offset="1" stopColor="#94a3b8"/></linearGradient>
    <radialGradient id="xa-bille" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#ffffff"/><stop offset="0.35" stopColor="#fde68a"/><stop offset="1" stopColor="#d97706"/></radialGradient>
    <filter id="xa-ombre" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.28"/></filter>
    <marker id="xa-pointe" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#15803d"/></marker>
  </defs>);

// Panneau de barres Ec / Epp / Em dans la scène (grand écran). E0 = énergie de référence (pointillés sur Em).
export function BarresEnergie({ q, E0, Emax, x = 14, y = 6, titre = 'Énergies (J)' }) {
  const hb = 108, hh = v => Math.max(Math.min(v, Emax), 0) / Emax * hb;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="190" height="180" rx="14" fill="white" opacity="0.92" stroke="#cbd5e1"/>
      <text x="95" y="22" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.ink}>{titre}</text>
      {[['Ec', q.Ec, COL.Ec], ['Epp', q.Epp, COL.Epp], ['Em', q.Em, COL.Em]].map(([n, v, c], i) => {
        const xb = 22 + i * 56, h = hh(v);
        return (<g key={n}>
          <rect x={xb} y={40} width="34" height={hb} rx="5" fill="#f1f5f9"/>
          <rect x={xb} y={40 + hb - h} width="34" height={h} rx="5" fill={c}/>
          {n === 'Em' && <rect x={xb - 2} y={40 + hb - hh(E0)} width="38" height={hh(E0)} rx="6" fill="none" stroke={c} strokeWidth="1.5" strokeDasharray="4 3"/>}
          <text x={xb + 17} y={40 + hb - h - 6} textAnchor="middle" fontSize="14" fontWeight="700" fill={c} stroke="#fff" strokeWidth="3" paintOrder="stroke">{Math.abs(v) >= 1e4 ? `${nbf(v / 1000, v < 1e5 ? 1 : 0)}k` : nbf(v, Math.abs(v) < 0.1 ? 3 : Math.abs(v) < 100 ? 2 : 0)}</text>
          <text x={xb + 17} y="172" textAnchor="middle" fontSize="17" fontWeight="700" fill={c}>{n}</text>
        </g>);
      })}
    </g>);
}
export function BarresHtml({ q, E0, Emax }) {
  return (
    <div style={{ ...styleBoite, marginTop: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Énergies</div>
      {[['Ec', q.Ec, COL.Ec], ['Epp', q.Epp, COL.Epp], ['Em', q.Em, COL.Em]].map(([n, v, c]) => (
        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ width: 34, fontWeight: 700, color: c, fontSize: 15 }}>{n}</span>
          <span style={{ flex: 1, height: 16, borderRadius: 8, background: '#f1f5f9', overflow: 'hidden', position: 'relative' }}>
            <span style={{ display: 'block', height: '100%', width: `${Math.max(Math.min(v / Emax, 1), 0) * 100}%`, background: c, borderRadius: 8 }}/>
            {n === 'Em' && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(E0 / Emax, 1) * 100}%`, border: `1.5px dashed ${c}`, borderRadius: 8, boxSizing: 'border-box' }}/>}
          </span>
          <span style={{ width: 72, textAlign: 'right', fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 700, color: c }}>{J(v)}</span>
        </div>))}
    </div>);
}

// Graphique des énergies en fonction du temps, tracé en direct jusqu'à l'instant t.
export function GrapheTemps({ frames, tFin, t, Emax, etroit, cles = [['Ec', COL.Ec], ['Epp', COL.Epp], ['Em', COL.Em]], titre = 'Les énergies au cours du temps' }) {
  const F = etroit ? 1.35 : 1, T = Math.max(tFin, 0.01), fin2 = Math.min(Math.round(t * FPS), frames.length - 1), xc = 56 + 628 * Math.min(t / T, 1);
  return (
    <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{titre}</div>
      <svg viewBox="0 0 700 210" style={{ width: '100%', display: 'block' }} role="img" aria-label="Graphique : énergie cinétique, potentielle et mécanique en fonction du temps ; il se trace pendant le mouvement.">
        <rect x="56" y="30" width="628" height="138" rx="6" fill="#fafcff" stroke="#e2e8f0"/>
        {[0.5, 1].map(g => <line key={g} x1="56" x2="684" y1={168 - g * 132} y2={168 - g * 132} stroke="#e2e8f0"/>)}
        {cles.map(([n, c]) => {
          const pts = []; for (let i = 0; i <= fin2; i += 3) { const f = frames[i]; pts.push(`${(56 + 628 * f.t / T).toFixed(1)},${(168 - Math.min(Math.max(f[n], 0) / Emax, 1) * 132).toFixed(1)}`); }
          return <polyline key={n} points={pts.join(' ')} fill="none" stroke={c} strokeWidth={n === 'Em' ? 3.5 : 3} strokeLinejoin="round" strokeDasharray={n === 'Em' ? '9 5' : undefined}/>;
        })}
        <line x1={xc} x2={xc} y1="30" y2="168" stroke="#94a3b8" strokeWidth="1.5"/>
        <text x="370" y="204" textAnchor="middle" fontSize={15 * F} fill="#475569">temps (s) · durée : {nbf(tFin, 1)} s</text>
        <text x="50" y="40" textAnchor="end" fontSize={15 * F} fill="#475569">{Emax >= 1000 ? `${nbf(Emax / 1000, Emax >= 1e5 ? 0 : 1)} kJ` : `${nbf(Emax, Emax < 10 ? 1 : 0)} J`}</text><text x="50" y="172" textAnchor="end" fontSize={15 * F} fill="#475569">0</text>
        {cles.map(([n, c], i) => <g key={n}><line x1={470 + i * 75} x2={492 + i * 75} y1="14" y2="14" stroke={c} strokeWidth="4"/><text x={497 + i * 75} y="19" fontSize={15 * F} fontWeight="700" fill={c}>{n}</text></g>)}
      </svg>
    </div>);
}

// Commandes de lecture : bouton principal, curseur d'instant, vitesse de lecture.
export function BarreLecture({ L, tFin, libelle = '▶ Tirer', desactive = false }) {
  return (
    <div className="xa-ctrl lect" style={{ maxWidth: 920, margin: '10px auto 0' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {L.joue
          ? <button type="button" onClick={() => L.setJoue(false)} style={styleBouton(true, '#475569')}>⏸ Pause</button>
          : <button type="button" onClick={L.demarrer} disabled={desactive} style={styleBouton(true, '#0369a1')}>{L.fin ? '↻ Rejouer' : libelle}</button>}
      </div>
      <label style={{ display: 'block', minWidth: 0 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Instant : {nbf(L.t, 2)} s</span>
        <input type="range" min={0} max={Math.max(tFin, 0.01)} step={1 / 60} value={Math.min(L.t, tFin)} aria-label="Instant du mouvement"
          onChange={ev => { L.setJoue(false); L.setT(Number(ev.target.value)); L.setTouche(true); }} style={{ width: '100%', minHeight: 32 }}/>
      </label>
      <Seg label="Vitesse de lecture" valeur={L.vit} onChange={L.setVit} options={[[1, '×1'], [0.5, '×½'], [0.25, '×¼']]}/>
    </div>);
}

export function Chips({ items }) {
  return (
    <div className="xa-chips" style={{ maxWidth: 920, margin: '10px auto 0', '--n': items.length }}>
      {items.map(([n, v, c]) => (
        <div key={n} style={{ ...styleBoite, padding: '6px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>{n}</div>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15, fontWeight: 700, color: c || KIT.txt }}>{v}</div>
        </div>))}
    </div>);
}
