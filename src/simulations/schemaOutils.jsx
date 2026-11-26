// Aides de dessin SVG partagées par les schémas des simulations 300 et 301.
export const K = { txt: '#0f172a', gris: '#64748b', clair: '#cbd5e1', el: '#7c3aed', vib: '#b45309', rot: '#0f766e', rouge: '#b91c1c', vert: '#15803d', bleu: '#1d4ed8' };
export const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 12} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? K.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit" stroke={o.halo ? '#fff' : 'none'} strokeWidth={o.halo ? 3 : 0} paintOrder="stroke">{s}</text>;
export const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
export const flecheV = (x, y1, y2, col, w, op = 1, id) => (<g key={id} opacity={op}><line x1={x} y1={y1} x2={x} y2={y2 + (y2 < y1 ? 6 : -6)} stroke={col} strokeWidth={w}/><polygon points={y2 < y1 ? `${x - 5},${y2 + 9} ${x + 5},${y2 + 9} ${x},${y2}` : `${x - 5},${y2 - 9} ${x + 5},${y2 - 9} ${x},${y2}`} fill={col}/></g>);
export const svgStyle = { display: 'block', maxWidth: 480, margin: '0 auto' };
