// Fiole jaugée partagée par les sims 61 et 62 (solutions)
// ---------- la fiole jaugée ----------
// niveau : 0 (vide) → 1 (trait de jauge) ; alpha : intensité de la teinte ; pts : nombre de points (particules dissoutes) ; solide : fraction de solide au fond
const CORPS = (cx) => `M ${cx - 13} 140 C ${cx - 92} 158 ${cx - 98} 250 ${cx - 72} 272 L ${cx + 72} 272 C ${cx + 98} 250 ${cx + 92} 158 ${cx + 13} 140 Z`;
export function Fiole({ cx = 150, niveau, couleur, alpha, pts, solide, bouchon, volume, id = 'f' }) {
  const ys = 272 - niveau * (272 - 74), col = couleur || '#94a3b8';
  const points = Array.from({ length: pts }, (_, k) => { const a = (k * 137.5) % 360, r = 0.2 + ((k * 61) % 80) / 100; return [cx + Math.cos(a) * 62 * r, 0.5 * (ys + 262) + Math.sin(a * 1.7) * Math.max(4, (262 - ys) / 2 - 8) * r]; });
  return (
    <g>
      <defs><clipPath id={`cl${id}`}><path d={CORPS(cx)}/><rect x={cx - 13} y="30" width="26" height="112"/></clipPath></defs>
      <g clipPath={`url(#cl${id})`}>
        {niveau > 0 && <rect x={cx - 100} y={ys} width="200" height="280" fill={couleur || '#bfdbfe'} opacity={couleur ? Math.max(0.12, alpha) : 0.28}/>}
        {points.map(([x, y], k) => <circle key={k} cx={x} cy={y} r="2.6" fill={col} opacity="0.95"/>)}
        {solide > 0 && <path d={`M ${cx - 46} 270 Q ${cx - 20} ${270 - 26 * solide} ${cx} ${270 - 30 * solide} Q ${cx + 22} ${270 - 26 * solide} ${cx + 46} 270 Z`} fill={col} stroke="#0f172a" strokeWidth="1"/>}
      </g>
      <path d={CORPS(cx)} fill="none" stroke="#0f172a" strokeWidth="3"/>
      <path d={`M ${cx - 13} 140 L ${cx - 13} 30 M ${cx + 13} 140 L ${cx + 13} 30`} stroke="#0f172a" strokeWidth="3" fill="none"/>
      <line x1={cx - 20} y1="74" x2={cx + 20} y2="74" stroke="#b91c1c" strokeWidth="3"/>
      <text x={cx + 26} y="78" fontSize="12" fontWeight="700" fill="#b91c1c">trait de jauge</text>
      {bouchon && <g><rect x={cx - 16} y="14" width="32" height="18" rx="3" fill="#475569" stroke="#0f172a" strokeWidth="2"/></g>}
      <text x={cx} y="294" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a">Fiole jaugée de {volume} mL</text>
    </g>);
}

