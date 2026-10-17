// Figure de l'exercice REA « Vecteurs » : deux vecteurs tracés depuis le même point O sur une grille (1 carreau = 1 unité).
const ORANGE_V = '#b45a1f', ARDOISE = '#334155';
// Deux vecteurs tracés depuis le même point O, sur une grille (1 carreau = 1 unité)
export function FigureVecteurs({ a, b, nomA, nomB, unite }) {
  const C = 26, W = 10, H = 10, ox = 5 * C, oy = 5 * C;
  const P = (x, y) => [ox + x * C, oy - y * C];
  const fl = (v, col, nom, dec) => {
    const [x2, y2] = P(v[0], v[1]), ang = Math.atan2(y2 - oy, x2 - ox), L = 9, q = t => `${x2 - L * Math.cos(ang + t)},${y2 - L * Math.sin(ang + t)}`;
    return <g>
      <line x1={ox} y1={oy} x2={x2} y2={y2} stroke={col} strokeWidth="3"/>
      <polyline points={`${q(0.45)} ${x2},${y2} ${q(-0.45)}`} fill="none" stroke={col} strokeWidth="3" strokeLinecap="round"/>
      <text x={x2 + (v[0] >= 0 ? 6 : -6) + dec} y={y2 + (v[1] >= 0 ? -6 : 14)} fontSize="15" fontWeight="700" textAnchor={v[0] >= 0 ? 'start' : 'end'} fill={col}>{nom}</text></g>;
  };
  return (
    <figure style={{ margin: '8px 0', maxWidth: 300 }}>
      <svg viewBox={`0 0 ${W * C} ${H * C}`} role="img" aria-label={`Deux vecteurs ${nomA} et ${nomB} tracés depuis le même point O`} style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8 }}>
        {Array.from({ length: W + 1 }, (_, i) => <line key={'v' + i} x1={i * C} y1="0" x2={i * C} y2={H * C} stroke="#e2e8f0"/>)}
        {Array.from({ length: H + 1 }, (_, i) => <line key={'h' + i} x1="0" y1={i * C} x2={W * C} y2={i * C} stroke="#e2e8f0"/>)}
        {fl(a, ORANGE_V, nomA, 0)}{fl(b, ARDOISE, nomB, 0)}
        <circle cx={ox} cy={oy} r="4" fill="#0f172a"/><text x={ox - 8} y={oy + 16} fontSize="13" fill="#0f172a">O</text>
      </svg>
      <figcaption style={{ fontSize: 12.5, color: '#475569' }}>1 carreau = 1 {unite}. Les deux vecteurs partent du même point O.</figcaption>
    </figure>);
}
