// Figure d'une formule topologique pour les banques d'exercices (fichier .js sans JSX : les banques sont aussi lues par des tests node).
// Même dessin que topoSchemas.jsx (bonds simples ou doubles, groupe –OH écrit, sommets = carbones), viewBox ajusté à la molécule.
import { createElement as h } from 'react';
import { disposition, lire } from './topoModele.js';

export function figureTopo(smi, { L = 36, opts = {}, aria } = {}) {
  const g = lire(smi), pts = disposition(g, opts), M = 22;
  const xs = pts.map(p => p.x * L), ys = pts.map(p => -p.y * L);
  const x0 = Math.min(...xs) - M, y0 = Math.min(...ys) - M, w = Math.max(...xs) + M - x0, ht = Math.max(...ys) + M - y0;
  const P = pts.map(p => ({ x: p.x * L - x0, y: -p.y * L - y0 }));
  const el = [];
  g.bo.forEach(([a, b, o], k) => {
    let p = { ...P[a] }, q = { ...P[b] };
    const d = Math.hypot(q.x - p.x, q.y - p.y), u = { x: (q.x - p.x) / d, y: (q.y - p.y) / d };
    if (g.at[a] === 'O') p = { x: p.x + u.x * 14, y: p.y + u.y * 14 };
    if (g.at[b] === 'O') q = { x: q.x - u.x * 14, y: q.y - u.y * 14 };
    (o === 2 ? [-3.8, 3.8] : [0]).forEach(s => el.push(h('line', { key: `${k}_${s}`, x1: p.x - u.y * s, y1: p.y + u.x * s, x2: q.x - u.y * s, y2: q.y + u.x * s, stroke: '#0f172a', strokeWidth: 2.6, strokeLinecap: 'round' })));
  });
  g.at.forEach((e, i) => {
    if (e !== 'O') return;
    const l = g.bo.find(([a, b]) => a === i || b === i), j = l[0] === i ? l[1] : l[0];
    el.push(h('text', { key: `o${i}`, x: P[i].x, y: P[i].y + 6, textAnchor: 'middle', fontSize: 18, fontWeight: 700, fill: '#0f172a' }, P[j].x > P[i].x + 1 ? 'HO' : 'OH'));
  });
  return h('svg', { viewBox: `0 0 ${w} ${ht}`, width: '100%', style: { maxWidth: Math.min(420, Math.max(140, w * 1.5)), display: 'block', margin: '8px auto' }, role: 'img', 'aria-label': aria || 'Formule topologique de la molécule étudiée' }, el);
}
