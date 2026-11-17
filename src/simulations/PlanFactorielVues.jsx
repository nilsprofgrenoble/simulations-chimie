import { useRef } from "react";
import { segmentsIso2 } from "./planFactorielModele";

// ====================================================
//  Vues du plan factoriel : cube 2³, barres d'effets, graphique d'interaction, isoréponses
//  (texte ≥ 13 dans des viewBox de 440 de large)
// ====================================================
const nf = (v, d = 0) => Number(v).toFixed(d).replace(/^-(0(\.0*)?)$/, '$1').replace('.', ',').replace('-', '−');
const COUL = ['#b45309', '#0f766e', '#7c3aed', '#be185d', '#0369a1'];

// ---------- cube : 8 essais d'un plan 2³ ----------
export function CubeVue({ X, y, dec = 0, facteurs, surligne = null, noms = true, axes = true }) {
  const P = (x1, x2, x3) => [210 + 82 * x1 + 46 * x3, 140 - 62 * x2 - 30 * x3];
  const sommets = X.map((r, i) => ({ i, r, p: P(...r) }));
  const aretes = [];
  X.forEach((a, i) => X.forEach((b, j) => { if (i < j && a.filter((v, k) => v !== b[k]).length === 1) aretes.push([P(...a), P(...b)]); }));
  const couleurSommet = r => (surligne ? (r[surligne.f] === surligne.niveau ? COUL[surligne.f] : '#cbd5e1') : '#ffffff');
  const lib = (f, n) => { const v = n < 0 ? f.bas : f.haut; return typeof v === 'number' ? `${nf(v, 1 * (v % 1 !== 0))}${f.unite ? ' ' + f.unite : ''}` : v; };
  return (
    <><svg viewBox="10 -4 380 306" role="img" aria-label={`Cube des huit essais du plan 2³ : chaque sommet est un essai, avec sa réponse mesurée${surligne ? ` ; sommets surlignés : ${facteurs[surligne.f].nom} au niveau ${surligne.niveau > 0 ? 'haut' : 'bas'}` : ''}`} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto' }}>
      {aretes.map(([a, b], k) => <line key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#64748b" strokeWidth="2"/>)}
      {sommets.map(({ i, r, p }) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="21" fill={couleurSommet(r)} fillOpacity={surligne && r[surligne.f] === surligne.niveau ? 0.28 : 1} stroke="#0f172a" strokeWidth="2"/>
          <text x={p[0]} y={p[1] + 5} textAnchor="middle" fontSize="15.5" fontWeight="800" fill="#0f172a">{y ? nf(y[i], dec) : i + 1}</text>
          {y && <text x={p[0]} y={p[1] - 26} textAnchor="middle" fontSize="15.3" fill="#475569" stroke="#f8fafc" strokeWidth="3.5" paintOrder="stroke">n°{i + 1}</text>}
        </g>))}
      {axes && facteurs.length === 3 && (() => {
        const etiq = (f, k) => `${f.id} : ${lib(f, -1)} → ${lib(f, 1)}`;
        const defs = facteurs.map((f, k) => <marker key={k} id={`cubeFl${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill={COUL[k]}/></marker>);
        const fl = (k, x1, y1, x2, y2) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COUL[k]} strokeWidth="3" markerEnd={`url(#cubeFl${k})`}/>;
        return (<g>
          <defs>{defs}</defs>
          {fl(0, 82, 270, 246, 270)}
          <text x="74" y="275" textAnchor="end" fontSize="14" fontWeight="800" fill={COUL[0]}>−1</text>
          <text x="256" y="275" textAnchor="start" fontSize="14" fontWeight="800" fill={COUL[0]}>+1</text>
          <text x="164" y="292" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={COUL[0]}>{etiq(facteurs[0])}</text>
          {fl(1, 34, 232, 34, 108)}
          <text x="34" y="249" textAnchor="middle" fontSize="14" fontWeight="800" fill={COUL[1]}>−1</text>
          <text x="34" y="98" textAnchor="middle" fontSize="14" fontWeight="800" fill={COUL[1]}>+1</text>
          <text transform="translate(21 170) rotate(-90)" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={COUL[1]}>{etiq(facteurs[1])}</text>
          {fl(2, 278, 256, 368, 197)}
          <text transform="translate(338 247) rotate(-33)" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={COUL[2]}>{etiq(facteurs[2])}</text>
        </g>);
      })()}
    </svg>
      {noms && <div style={{ fontSize: 13.5, lineHeight: 1.5, marginTop: 4 }}>{facteurs.map((f, k) => <div key={f.id} style={{ fontWeight: 700, color: COUL[k] }}>{f.id} = {f.court || f.nom} : {lib(f, -1)} (−1), {lib(f, 1)} (+1)</div>)}</div>}</>);
}

// ---------- barres d'effets (coefficients du modèle), éventuellement triées (diagramme de Pareto) ----------
export function EffetsVue({ items, seuil = null, ic = null, titre, dec = 2, surlignes = [] }) {
  const L = items.length, H = 56 + 30 * L, max = Math.max(...items.map(i => Math.abs(i.v)), seuil || 0, ic || 0, 1e-9), X0 = 225, K = 100 / max;
  return (
    <svg viewBox={`0 0 400 ${H}`} role="img" aria-label={`Coefficients du modèle : ${items.map(i => `${i.nom} ${nf(i.v, dec)}`).join(', ')}`} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto' }}>
      <text x="8" y="20" fontSize="15.3" fill="#334155">{titre || 'coefficients du modèle (unité de la réponse)'}</text>
      <line x1={X0} y1="32" x2={X0} y2={H - 14} stroke="#334155" strokeWidth="2"/>
      {seuil != null && <>
        {[-1, 1].map(s => <line key={s} x1={X0 + s * seuil * K} y1="32" x2={X0 + s * seuil * K} y2={H - 14} stroke="#dc2626" strokeWidth="1.8" strokeDasharray="6 4"/>)}
        <text x={X0 + seuil * K + 4} y={H - 2} fontSize="15.3" fill="#dc2626" fontWeight="700">seuil</text></>}
      {items.map((it, k) => {
        const y = 44 + 30 * k, w = Math.abs(it.v) * K, x = it.v >= 0 ? X0 : X0 - w, sig = seuil == null ? true : Math.abs(it.v) > seuil, vive = !surlignes.length || surlignes.includes(it.nom);
        return (
          <g key={it.nom} opacity={vive ? 1 : 0.35}>
            <text x="8" y={y + 14} fontSize="16.5" fontWeight="700" fill="#0f172a">{it.nom}</text>
            <rect x={x} y={y} width={Math.max(w, 1.5)} height="20" fill={sig ? (it.v >= 0 ? '#0369a1' : '#b45309') : '#94a3b8'} rx="2"/>
            {ic != null && <line x1={X0 + it.v * K - ic * K} y1={y + 10} x2={X0 + it.v * K + ic * K} y2={y + 10} stroke="#0f172a" strokeWidth="2.2"/>}
            <text x={it.v >= 0 ? Math.max(x + w, X0) + (ic != null ? ic * K : 0) + 6 : x - 6 - (ic != null ? ic * K : 0)} y={y + 15} textAnchor={it.v >= 0 ? 'start' : 'end'} fontSize="15.3" fontWeight="700" fill="#0f172a">{nf(it.v, dec)}</text>
          </g>);
      })}
    </svg>);
}

// ---------- graphique d'interaction : moyennes de la réponse selon i, une droite par niveau de j ----------
export function InterVue({ X, y, i, j, facteurs, dec = 0, unite = '' }) {
  const m = (a, b) => { const v = X.map((r, k) => (r[i] === a && r[j] === b ? y[k] : null)).filter(v => v != null); return v.reduce((s, t) => s + t, 0) / v.length; };
  const vals = [m(-1, -1), m(-1, 1), m(1, -1), m(1, 1)], lo = Math.min(...vals), hi = Math.max(...vals), marge = (hi - lo) * 0.18 || 1;
  const Y = v => 230 - 180 * (v - (lo - marge)) / (hi - lo + 2 * marge), Xp = a => 110 + (a + 1) * 100;
  return (
    <svg viewBox="0 0 440 300" role="img" aria-label={`Graphique d'interaction entre ${facteurs[i].nom} et ${facteurs[j].nom} : réponse moyenne selon ${facteurs[i].nom}, une droite par niveau de ${facteurs[j].nom}`} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto' }}>
      <text x="8" y="20" fontSize="15.3" fill="#334155">réponse moyenne ({unite || 'unité de la réponse'})</text>
      <line x1="60" y1="240" x2="360" y2="240" stroke="#334155" strokeWidth="2"/><line x1="60" y1="36" x2="60" y2="240" stroke="#334155" strokeWidth="2"/>
      {[-1, 1].map(b => { const c = b < 0 ? '#0369a1' : '#b45309'; return (
        <g key={b}>
          <line x1={Xp(-1)} y1={Y(m(-1, b))} x2={Xp(1)} y2={Y(m(1, b))} stroke={c} strokeWidth="3"/>
          {[-1, 1].map(a => <g key={a}><circle cx={Xp(a)} cy={Y(m(a, b))} r="6" fill={c} stroke="#fff" strokeWidth="1.5"/><text x={Xp(a) + (a < 0 ? -10 : 10)} y={Y(m(a, b)) + (b < 0 ? 18 : -10)} textAnchor={a < 0 ? 'end' : 'start'} fontSize="15.3" fontWeight="700" fill={c}>{nf(m(a, b), dec)}</text></g>)}
        </g>); })}
      <text x={Xp(-1)} y="262" textAnchor="middle" fontSize="15.9" fill="#0f172a">{facteurs[i].id} = −1</text>
      <text x={Xp(1)} y="262" textAnchor="middle" fontSize="15.9" fill="#0f172a">{facteurs[i].id} = +1</text>
      <rect x="86" y="276" width="14" height="4" fill="#0369a1"/><text x="106" y="282" fontSize="15.3" fill="#0369a1" fontWeight="700">{facteurs[j].id} = −1</text>
      <rect x="226" y="276" width="14" height="4" fill="#b45309"/><text x="246" y="282" fontSize="15.3" fill="#b45309" fontWeight="700">{facteurs[j].id} = +1</text>
    </svg>);
}

// ---------- isoréponses d'un modèle dans le plan de deux facteurs ----------
export function IsoVue({ f, niveaux, point, onPoint, i, j, facteurs, dec = 0, bornes = null }) {
  const ref = useRef(null), drag = useRef(false);
  const W = { ox: 70, oy: 335, c: 300 }, XY = (a, b) => [W.ox + (a + 1) / 2 * W.c, W.oy - (b + 1) / 2 * W.c];
  const lire = e => { const r = ref.current.getBoundingClientRect(), k = 440 / r.width; const a = ((e.clientX - r.left) * k - W.ox) / W.c * 2 - 1, b = (W.oy - (e.clientY - r.top) * k) / W.c * 2 - 1; onPoint([Math.max(-1, Math.min(1, a)), Math.max(-1, Math.min(1, b))]); };
  const lib = (fa, n) => { const v = n < 0 ? fa.bas : fa.haut; return typeof v === 'number' ? nf(v, v % 1 ? 1 : 0) : v; };
  const traits = niveaux.flatMap(nv => segmentsIso2(f, nv, 36).map(s => ({ nv, s })));
  const etiq = niveaux.map(nv => { const sg = segmentsIso2(f, nv, 36); if (!sg.length) return null; const s = sg[Math.floor(sg.length / 2)][0]; return { nv, p: XY(...s) }; }).filter(Boolean);
  return (
    <svg ref={ref} viewBox="0 0 440 392" role="img" aria-label={`Isoréponses dans le plan ${facteurs[i].nom} – ${facteurs[j].nom}, les autres facteurs étant fixés`} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', touchAction: 'none', cursor: onPoint ? 'crosshair' : 'default' }}
      onPointerDown={onPoint ? e => { drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); lire(e); } : undefined} onPointerMove={onPoint ? e => { if (drag.current) lire(e); } : undefined} onPointerUp={() => { drag.current = false; }}>
      <rect x={W.ox} y={W.oy - W.c} width={W.c} height={W.c} fill="#f8fafc" stroke="#334155" strokeWidth="2"/>
      <line x1={W.ox + W.c / 2} y1={W.oy - W.c} x2={W.ox + W.c / 2} y2={W.oy} stroke="#e2e8f0"/><line x1={W.ox} y1={W.oy - W.c / 2} x2={W.ox + W.c} y2={W.oy - W.c / 2} stroke="#e2e8f0"/>
      {bornes && <rect x={XY(bornes.x0, 0)[0]} y={XY(0, bornes.y1)[1]} width={(bornes.x1 - bornes.x0) / 2 * W.c} height={(bornes.y1 - bornes.y0) / 2 * W.c} fill="#16a34a" fillOpacity="0.22" stroke="#16a34a"/>}
      {traits.map(({ s }, k) => { const [a, b] = s.map(p => XY(...p)); return <line key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#1d4ed8" strokeWidth="2.2" strokeLinecap="round"/>; })}
      {etiq.map(e => <text key={e.nv} x={e.p[0]} y={e.p[1] - 4} textAnchor="middle" fontSize="15.3" fontWeight="800" fill="#1d4ed8" stroke="#fff" strokeWidth="3.5" paintOrder="stroke">{nf(e.nv, dec)}</text>)}
      {[-1, 1].map(a => <text key={'x' + a} x={XY(a, -1)[0]} y={W.oy + 20} textAnchor="middle" fontSize="15.9" fill="#0f172a">{lib(facteurs[i], a)}</text>)}
      {[-1, 1].map(b => <text key={'y' + b} x={W.ox - 8} y={XY(-1, b)[1] + 5} textAnchor="end" fontSize="15.9" fill="#0f172a">{lib(facteurs[j], b)}</text>)}
      <text x={W.ox + W.c / 2} y={W.oy + 42} textAnchor="middle" fontSize="16.5" fontWeight="800" fill={COUL[i]}>{facteurs[i].nom}{facteurs[i].unite ? ` (${facteurs[i].unite})` : ''}</text>
      <text x="10" y="22" fontSize="16.5" fontWeight="800" fill={COUL[j]}>{facteurs[j].nom}{facteurs[j].unite ? ` (${facteurs[j].unite})` : ''}</text>
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b]) => <circle key={a + ',' + b} cx={XY(a, b)[0]} cy={XY(a, b)[1]} r="5" fill="#0f172a"/>)}
      {point && <g><circle cx={XY(...point)[0]} cy={XY(...point)[1]} r="9" fill="#f59e0b" stroke="#fff" strokeWidth="2.5"/><circle cx={XY(...point)[0]} cy={XY(...point)[1]} r="9" fill="none" stroke="#92400e" strokeWidth="1.5"/></g>}
    </svg>);
}
