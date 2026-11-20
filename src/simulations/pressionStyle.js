// Constantes graphiques partagées par les scènes et les cartes de la simulation 162 (couleurs, style des SVG, pseudo-aléa déterministe).
export const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', clair: '#e2e8f0', encre: '#0f172a', eau: '#dbeafe', acier: '#475569', txt2: '#334155' };
export const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb' };
export const alea = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };   // pseudo-aléa déterministe
