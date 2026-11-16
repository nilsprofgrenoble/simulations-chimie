import { useMemo, useRef } from "react";
import { COMPOSANTS, versXY, versFractions, segmentsIso } from "./planMelangeModele";

// ====================================================
//  Diagramme ternaire du plan de mélange (disposition du tableau du TP) :
//  A (candelilla) en haut, B (huile de ricin) en bas à gauche, C (cire d'abeille) en bas à droite.
//  Les proportions x = [a, b, c] sont des fractions massiques de somme 1.
// ====================================================

const G = { W: 440, H: 420, ox: 56, oy: 352, cote: 320 };
const H3 = Math.sqrt(3) / 2;
const xy = x => { const p = versXY(x); return [G.ox + G.cote * p.px, G.oy - G.cote * p.py]; };
const pts = l => l.map(x => xy(x).map(v => v.toFixed(1)).join(',')).join(' ');
const nf = (v, d = 0) => Number(v).toFixed(d).replace('.', ',');
const [CA, CB, CC] = COMPOSANTS.map(c => c.coul);

// Cellules triangulaires (pour la carte de couleurs et la zone du cahier des charges)
// f(z) : réponse en fonction des pseudo-composants z (somme 1). dom : domaine d'étude { L, s } (identité si absent).
const reel = (z, dom) => (dom ? z.map((zi, i) => dom.L[i] + dom.s * zi) : z);
function cellules(f, n, dom, garde) {
  const out = [], P = (i, j) => [i / n, j / n, 1 - i / n - j / n], mil = (a, b, c) => a.map((v, k) => (v + b[k] + c[k]) / 3);
  const ajoute = (a, b, c) => { const m = mil(a, b, c); if (!garde || garde(reel(m, dom))) out.push({ t: [a, b, c].map(z => reel(z, dom)), v: f(m) }); };
  for (let i = 0; i < n; i++) for (let j = 0; i + j < n; j++) {
    const a = P(i, j), b = P(i + 1, j), c = P(i, j + 1);
    ajoute(a, b, c);
    if (i + j < n - 1) ajoute(b, P(i + 1, j + 1), c);
  }
  return out;
}

export default function Ternaire({ point, onPoint, guides = false, dom = null, domaine = null, region = null, plan = null, fref = false, isos = null, carte = null, zone = null, titre, clair = false }) {
  const ref = useRef(null), glisse = useRef(false);
  const interactif = !!onPoint;
  const celCarte = useMemo(() => (carte ? cellules(carte.f, 30, dom) : null), [carte, dom]);
  const celZone = useMemo(() => (zone ? cellules(zone.f, 36, dom, zone.garde).filter(c => c.v >= zone.lo && c.v <= zone.hi) : null), [zone, dom]);
  const lignesIso = useMemo(() => (isos || []).flatMap(iso => iso.niveaux.map(nv => ({ iso, nv, segs: segmentsIso(iso.f, nv, 48).map(sg => sg.map(z => reel(z, dom))) }))), [isos, dom]);

  const lire = e => {
    const r = ref.current.getBoundingClientRect(), k = G.W / r.width;
    const X = (e.clientX - r.left) * k, Y = (e.clientY - r.top) * k;
    let x = versFractions((X - G.ox) / G.cote, (G.oy - Y) / G.cote);
    x = x.map(v => Math.max(0, v)); const s = x.reduce((a, b) => a + b, 0) || 1; x = x.map(v => v / s);
    onPoint(x);
  };
  const ticks = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const gl = (p, q, fort) => { const [x1, y1] = xy(p), [x2, y2] = xy(q); return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={fort ? '#94a3b8' : '#d5dfeb'} strokeWidth={fort ? 1.2 : 0.8}/>; };

  const sommets = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const cMax = carte ? Math.max(...celCarte.map(c => c.v)) : 0, cMin = carte ? Math.min(...celCarte.map(c => c.v)) : 0;
  const couleurCarte = v => { const t = cMax > cMin ? (v - cMin) / (cMax - cMin) : 0; return `rgb(${Math.round(236 - 150 * t)},${Math.round(244 - 110 * t)},${Math.round(255 - 40 * t)})`; };

  return (
    <svg ref={ref} viewBox={`0 0 ${G.W} ${G.H}`} width="100%" role="img" style={{ display: 'block', maxWidth: 520, margin: '0 auto', background: '#fff', border: '1.5px solid #d5dfeb', borderRadius: 12, touchAction: interactif ? 'none' : 'auto', cursor: interactif ? 'crosshair' : 'default' }}
      aria-label={titre || "Diagramme ternaire : candelilla en haut, huile de ricin en bas à gauche, cire d'abeille en bas à droite"}
      onPointerDown={interactif ? e => { glisse.current = true; e.currentTarget.setPointerCapture(e.pointerId); lire(e); } : undefined}
      onPointerMove={interactif ? e => { if (glisse.current) lire(e); } : undefined}
      onPointerUp={interactif ? () => { glisse.current = false; } : undefined}>
      <polygon points={pts(sommets)} fill="#fbfdff"/>
      {celCarte && celCarte.map((c, i) => <polygon key={i} points={pts(c.t)} fill={couleurCarte(c.v)} stroke={couleurCarte(c.v)} strokeWidth="0.6"/>)}
      {ticks.map(k => <g key={k}>{gl([k / 10, 1 - k / 10, 0], [k / 10, 0, 1 - k / 10], k === 5)}{gl([1 - k / 10, 0, k / 10], [0, 1 - k / 10, k / 10], k === 5)}{gl([1 - k / 10, k / 10, 0], [0, k / 10, 1 - k / 10], k === 5)}</g>)}
      {celZone && celZone.map((c, i) => <polygon key={i} points={pts(c.t)} fill="#16a34a" fillOpacity="0.30" stroke="#16a34a" strokeOpacity="0.30" strokeWidth="0.6"/>)}
      {region && <polygon points={pts(region)} fill="#2563eb" fillOpacity="0.10" stroke="#2563eb" strokeWidth="2.2" strokeDasharray="7 4"/>}
      {domaine && <polygon points={pts(domaine)} fill="#f59e0b" fillOpacity={clair ? 0.04 : 0.10} stroke="#b45309" strokeWidth="2.2" strokeDasharray="7 4"/>}
      <polygon points={pts(sommets)} fill="none" stroke="#334155" strokeWidth="2.2"/>
      {/* graduations : A sur le côté gauche, C sur le côté droit, B sur la base */}
      {ticks.map(k => {
        const a = xy([k / 10, 1 - k / 10, 0]), c = xy([1 - k / 10, 0, k / 10]), b = xy([0, k / 10, 1 - k / 10]);
        return (<g key={k} fontSize="14" fontWeight="700">
          <line x1={a[0]} y1={a[1]} x2={a[0] - 7} y2={a[1]} stroke={CA} strokeWidth="2"/><text x={a[0] - 10} y={a[1] + 4.5} textAnchor="end" fill={CA}>{k * 10}</text>
          <line x1={c[0]} y1={c[1]} x2={c[0] + 7} y2={c[1]} stroke={CC} strokeWidth="2"/><text x={c[0] + 10} y={c[1] + 4.5} textAnchor="start" fill={CC}>{k * 10}</text>
          <line x1={b[0]} y1={b[1]} x2={b[0]} y2={b[1] + 7} stroke={CB} strokeWidth="2"/><text x={b[0]} y={b[1] + 21} textAnchor="middle" fill={CB}>{k * 10}</text>
        </g>);
      })}
      {/* noms des trois constituants */}
      <text x={xy([1, 0, 0])[0]} y={xy([1, 0, 0])[1] - 24} textAnchor="middle" fontSize="15" fontWeight="800" fill={CA}>Cire de candelilla</text>
      <text x={xy([1, 0, 0])[0]} y={xy([1, 0, 0])[1] - 8} textAnchor="middle" fontSize="13" fill={CA}>100 % au sommet</text>
      <text x={G.ox} y={G.oy + 47} textAnchor="start" fontSize="15" fontWeight="800" fill={CB}>Huile de ricin</text>
      <text x={G.ox + G.cote} y={G.oy + 47} textAnchor="end" fontSize="15" fontWeight="800" fill={CC}>Cire d’abeille</text>
      <text x="8" y="18" fontSize="13" fill="#334155">proportions en % de la masse des trois corps gras</text>
      {/* courbes isoréponses */}
      {lignesIso.map(({ iso, nv, segs }, k) => segs.length > 0 && (
        <g key={k}>
          {segs.map(([a, b], i) => { const p = xy(a), q = xy(b); return <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={iso.coul || '#1d4ed8'} strokeWidth="2.2" strokeLinecap="round"/>; })}
          {(() => { const obst = [...(plan || []).map(e => xy(e.x)), ...(fref ? [xy(fref)] : [])]; let s = segs[Math.floor(segs.length / 2)], best = -1; segs.forEach(sg => { const q = xy(sg[0]), d = Math.min(99, ...obst.map(o => Math.hypot(o[0] - q[0], o[1] - q[1] + 5))); if (d > best + 1e-9) { best = d; s = sg; } }); const p = xy(s[0]); return <text x={p[0]} y={p[1] - 5} textAnchor="middle" fontSize="13" fontWeight="800" fill={iso.coul || '#1d4ed8'} stroke="white" strokeWidth="3.5" paintOrder="stroke">{nf(nv * (iso.echelle || 1), iso.dec || 0)}</text>; })()}
        </g>
      ))}
      {/* lignes de lecture du point */}
      {guides && point && (() => {
        const [a, b, c] = point, p = xy(point), l = [xy([a, 1 - a, 0]), xy([1 - c, 0, c]), xy([0, b, 1 - b])], cols = [CA, CC, CB];
        return l.map((q, i) => <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={cols[i]} strokeWidth="1.8" strokeDasharray="4 3"/>);
      })()}
      {/* essais du plan */}
      {plan && plan.map(e => { const p = xy(e.x); return (
        <g key={e.n}><circle cx={p[0]} cy={p[1]} r="10.5" fill="white" stroke="#0f172a" strokeWidth="2"/><text x={p[0]} y={p[1] + 4.5} textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">{e.n}</text></g>); })}
      {fref && (() => { const p = xy(fref); return (<g><path d={`M${p[0]},${p[1] - 11} L${p[0] + 11},${p[1]} L${p[0]},${p[1] + 11} L${p[0] - 11},${p[1]} Z`} fill="#dc2626" stroke="white" strokeWidth="2"/>
        <text x={p[0] + 14} y={p[1] - 8} fontSize="13.5" fontWeight="800" fill="#b91c1c" stroke="white" strokeWidth="3.5" paintOrder="stroke">Fref</text></g>); })()}
      {point && (() => { const p = xy(point); return (<g><circle cx={p[0]} cy={p[1]} r="9" fill="#f59e0b" stroke="#fff" strokeWidth="2.5"/><circle cx={p[0]} cy={p[1]} r="9" fill="none" stroke="#92400e" strokeWidth="1.5"/>
        {interactif && <circle cx={p[0]} cy={p[1]} r="16" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3"/>}</g>); })()}
    </svg>
  );
}

