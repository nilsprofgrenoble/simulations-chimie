// Flèche des schémas de la simulation 159 : tige à bouts arrondis et pointe dessinée à la main, de taille fixe (indépendante de l'épaisseur du trait).
export function Fleche({ x1, y1, x2, y2, c = '#64748b', w = 2.4, t = 8 }) {
  const a = Math.atan2(y2 - y1, x2 - x1), bx = x2 - Math.cos(a) * t * 0.85, by = y2 - Math.sin(a) * t * 0.85;
  const nx = -Math.sin(a) * t * 0.5, ny = Math.cos(a) * t * 0.5;
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w} strokeLinecap="round" />
      <path d={`M${x2} ${y2} L${bx + nx} ${by + ny} L${bx - nx} ${by - ny} Z`} fill={c} stroke={c} strokeWidth="1.4" strokeLinejoin="round" />
    </g>);
}
