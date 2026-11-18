// Tableur-grapheur du titrage pH-métrique : tableau V, pH, dérivée ; courbe pH = f(V) ; courbe dérivée ; curseur et zoom pour lire V_éq avec précision.
// Même esprit que le Grapheur du site (échelles rondes, réticule), sans importer tout l'outil : les données du titrage sont fournies.
import { useState, useMemo } from 'react';
import { echelle } from './grapheurModele';

const fr = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '—');
const FOND = '#0f2430', TRAIT = '#6b8794', TEXTE = '#9fc3d1';

export default function TableurTitrage({ pts, titre = 'Titrage du Synthalen K', ordonnee = 'pH', repererMax = true }) {
  const lignes = useMemo(() => pts.map((p, i) => i === 0 ? { v: p[0], y: p[1] } : { v: p[0], y: p[1], vm: (p[0] + pts[i - 1][0]) / 2, d: (p[1] - pts[i - 1][1]) / (p[0] - pts[i - 1][0]) }), [pts]);
  const der = lignes.filter(l => l.d !== undefined);
  const vMaxData = Math.max(...pts.map(p => p[0]));
  const [onglet, setOnglet] = useState('courbe'), [curseur, setCurseur] = useState(0), [zoom, setZoom] = useState(null), [copie, setCopie] = useState(false);
  const serie = onglet === 'derivee' ? der.map((l, k) => ({ x: l.vm, y: l.d, k })) : lignes.map((l, k) => ({ x: l.v, y: l.y, k }));
  const [xa, xb] = zoom || [0, vMaxData];
  const visibles = serie.filter(s => s.x >= xa - 1e-9 && s.x <= xb + 1e-9);
  const trouve = visibles.findIndex(s => s.k === curseur), idx = trouve >= 0 ? trouve : 0, sel = visibles[idx] || serie[0];
  const ys = visibles.map(s => s.y), ech = echelle(Math.min(...ys, onglet === 'derivee' ? 0 : Infinity), Math.max(...ys), 5, onglet === 'derivee'), ex = echelle(xa, xb, 6, false);
  const W = 360, H = 230, gx0 = 44, gx1 = 346, gy0 = 14, gy1 = 190;
  const X = x => gx0 + (x - ex.min) / (ex.max - ex.min) * (gx1 - gx0), Y = v => gy1 - (v - ech.min) / (ech.max - ech.min) * (gy1 - gy0);
  const choisirProche = ev => { const r = ev.currentTarget.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width * W; let m = 0, dm = 1e9; visibles.forEach((s, i) => { const dd = Math.abs(X(s.x) - px); if (dd < dm) { dm = dd; m = i; } }); setCurseur(visibles[m].k); };
  const aller = d => setCurseur(visibles[Math.max(0, Math.min(visibles.length - 1, idx + d))].k);
  const maximum = () => { let m = 0; der.forEach((l, i) => { if (l.d > der[m].d) m = i; }); setOnglet('derivee'); setZoom(null); setCurseur(m); };
  const zoomer = () => { if (!sel) return; const l = Math.max(0.5, (xb - xa) / 4); setZoom([Math.max(0, sel.x - l), Math.min(vMaxData, sel.x + l)]); };
  const copier = () => { const txt = ['V (mL)\t' + ordonnee + '\tV moyen (mL)\td' + ordonnee + '/dV', ...lignes.map(l => [fr(l.v, 2), fr(l.y, 2), l.vm !== undefined ? fr(l.vm, 3) : '', l.d !== undefined ? fr(l.d, 2) : ''].join('\t'))].join('\n'); try { navigator.clipboard.writeText(txt); setCopie(true); setTimeout(() => setCopie(false), 1800); } catch { /* presse-papiers indisponible */ } };
  const bt = actif => ({ font: 'inherit', fontSize: 13.5, padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${actif ? '#5eead4' : '#2a4654'}`, background: actif ? '#134e4a' : 'transparent', color: '#e2f0f5', cursor: 'pointer', minHeight: 36 });
  const grad = onglet === 'derivee' ? 'dérivée' : ordonnee;
  return (<figure data-tableur style={{ margin: '14px 0', background: FOND, color: '#e2f0f5', borderRadius: 12, padding: '8px 10px 12px' }}>
    <figcaption style={{ fontSize: 12, letterSpacing: 1, color: TEXTE, fontFamily: 'ui-monospace,monospace', marginBottom: 6 }}>{titre.toUpperCase()}</figcaption>
    <div role="tablist" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      {[['courbe', `Courbe ${ordonnee} = f(V)`], ['derivee', `Dérivée d${ordonnee}/dV`], ['tableau', 'Tableau']].map(([id, l]) => <button key={id} type="button" role="tab" aria-selected={onglet === id} data-onglet={id} style={bt(onglet === id)} onClick={() => { setOnglet(id); setCurseur(0); setZoom(null); }}>{l}</button>)}
    </div>
    {onglet !== 'tableau' && <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${titre} : ${grad} en fonction du volume de soude versé`} onClick={choisirProche} style={{ width: '100%', maxWidth: 640, display: 'block', margin: '0 auto', cursor: 'crosshair', touchAction: 'manipulation' }}>
        {ech.graduations.map(g => <g key={'y' + g}><line x1={gx0} y1={Y(g)} x2={gx1} y2={Y(g)} stroke="#1c3a48" /><line x1={gx0 - 3} y1={Y(g)} x2={gx0} y2={Y(g)} stroke={TRAIT} /><text x={gx0 - 6} y={Y(g) + 3.5} fontSize="10" textAnchor="end" fill={TEXTE}>{fr(g, ech.pas < 1 ? 1 : 0)}</text></g>)}
        {ex.graduations.map(g => <g key={'x' + g}><line x1={X(g)} y1={gy0} x2={X(g)} y2={gy1} stroke="#1c3a48" /><line x1={X(g)} y1={gy1} x2={X(g)} y2={gy1 + 3} stroke={TRAIT} /><text x={X(g)} y={gy1 + 14} fontSize="10" textAnchor="middle" fill={TEXTE}>{fr(g, ex.pas < 1 ? 1 : 0)}</text></g>)}
        <line x1={gx0} y1={gy1} x2={gx1} y2={gy1} stroke={TRAIT} /><line x1={gx0} y1={gy0} x2={gx0} y2={gy1} stroke={TRAIT} />
        {visibles.length > 1 && onglet === 'courbe' && <polyline points={visibles.map(s => `${X(s.x)},${Y(s.y)}`).join(' ')} fill="none" stroke="#5eead4" strokeWidth="1.3" />}
        {visibles.map((s, i) => <circle key={i} cx={X(s.x)} cy={Y(s.y)} r={i === idx ? 4.5 : 2.8} fill={i === idx ? '#fb923c' : onglet === 'derivee' ? '#93c5fd' : '#fde68a'} />)}
        {sel && <g><line x1={X(sel.x)} y1={gy0} x2={X(sel.x)} y2={gy1} stroke="#fb923c" strokeDasharray="3 3" /><line x1={gx0} y1={Y(sel.y)} x2={gx1} y2={Y(sel.y)} stroke="#fb923c" strokeDasharray="3 3" opacity=".6" /></g>}
        <text x={(gx0 + gx1) / 2} y={H - 3} fontSize="11" textAnchor="middle" fill={TEXTE}>volume de soude versé V (mL)</text>
        <text x="4" y="10" fontSize="11" fill={TEXTE}>{onglet === 'derivee' ? `d${ordonnee}/dV (par mL)` : ordonnee}</text>
      </svg>
      {sel && <div data-lecture role="status" style={{ background: '#0b1b22', border: '1px solid #2a4654', borderRadius: 8, padding: '6px 10px', margin: '8px 0', fontFamily: 'ui-monospace,monospace', fontSize: 14.5, color: '#7ef0d4' }}>
        {onglet === 'derivee' ? <>V moyen = {fr(sel.x, 3)} mL · d{ordonnee}/dV = {fr(sel.y, 2)}</> : <>V = {fr(sel.x, 2)} mL · {ordonnee} = {fr(sel.y, 2)}</>}</div>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" style={bt(false)} aria-label="Point précédent" onClick={() => aller(-1)}>◀</button>
        <input type="range" min={0} max={Math.max(0, visibles.length - 1)} step={1} value={idx} aria-label="Déplacer le curseur sur les points" onChange={ev => setCurseur(visibles[parseInt(ev.target.value, 10)].k)} style={{ flex: 1, minWidth: 120 }} />
        <button type="button" style={bt(false)} aria-label="Point suivant" onClick={() => aller(1)}>▶</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button type="button" data-zoom style={bt(false)} onClick={zoomer}>🔍 Zoomer autour du curseur</button>
        {zoom && <button type="button" style={bt(false)} onClick={() => setZoom(null)}>Tout voir</button>}
        {repererMax && onglet === 'derivee' && <button type="button" data-max style={bt(false)} onClick={maximum}>Aller au maximum (comme MAX dans un tableur)</button>}
      </div>
      <div style={{ fontSize: 12.5, color: TEXTE, marginTop: 6 }}>Clique sur la courbe ou déplace le curseur : la lecture s'affiche au-dessus. Plus tu zoomes, plus la lecture est précise.</div>
    </>}
    {onglet === 'tableau' && <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid #2a4654', borderRadius: 8 }}>
      <table data-tableau style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13.5, fontFamily: 'ui-monospace,monospace' }}>
        <thead><tr style={{ position: 'sticky', top: 0, background: '#16384a' }}>{['V (mL)', ordonnee, 'V moyen (mL)', `d${ordonnee}/dV`].map(c => <th key={c} style={{ padding: '5px 8px', textAlign: 'right', color: TEXTE, fontWeight: 600 }}>{c}</th>)}</tr></thead>
        <tbody>{lignes.map((l, k) => <tr key={k} style={{ borderTop: '1px solid #1c3a48' }}>
          <td style={{ padding: '3px 8px', textAlign: 'right' }}>{fr(l.v, 2)}</td><td style={{ padding: '3px 8px', textAlign: 'right' }}>{fr(l.y, 2)}</td><td style={{ padding: '3px 8px', textAlign: 'right', color: '#93c5fd' }}>{l.vm !== undefined ? fr(l.vm, 3) : ''}</td><td style={{ padding: '3px 8px', textAlign: 'right', color: '#93c5fd' }}>{l.d !== undefined ? fr(l.d, 2) : ''}</td></tr>)}</tbody></table></div>}
    {onglet === 'tableau' && <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}><button type="button" style={bt(false)} onClick={copier}>📋 Copier le tableau (pour un tableur)</button>{copie && <span style={{ fontSize: 13, color: '#7ef0d4' }}>Copié.</span>}<span style={{ fontSize: 12.5, color: TEXTE }}>La dérivée est calculée entre deux points successifs et placée au volume moyen.</span></div>}
  </figure>);
}
