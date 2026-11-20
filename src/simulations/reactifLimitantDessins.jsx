// Dessins de la simulation « Réactif limitant » (2GT, sim 180) : jetons (rond, pain, jambon, sandwich) et bécher.
// Les jetons comptent des quantités : 1 jeton = 1 « tranche » (analogie) ou une quantité de matière fixe (légende sous la scène).

export const PAIN = '#e4b072', PAIN_BORD = '#8a5a1f', JAMBON = '#f4a3b5', JAMBON_BORD = '#a63d57';

// Un jeton centré en (cx, cy). frac : partie remplie (0 à 1, pour une quantité qui n'est pas entière). fantome : « place vide » en pointillés (réactif consommé).
export function Jeton({ cx, cy, forme = 'rond', couleur = '#2563eb', frac = 1, fantome = false, e = 1, cid = 'j' }) {
  const L = 22 * e, x0 = cx - L / 2, y0 = cy - L / 2;
  const contour = fantome || frac < 1;
  const corps = (() => {
    if (forme === 'pain') return <rect x={cx - 10 * e} y={cy - 9 * e} width={20 * e} height={18 * e} rx={6 * e} fill={PAIN} stroke={PAIN_BORD} strokeWidth="1.4"/>;
    if (forme === 'jambon') return <ellipse cx={cx} cy={cy} rx={11 * e} ry={8 * e} fill={JAMBON} stroke={JAMBON_BORD} strokeWidth="1.4"/>;
    if (forme === 'sandwich') return (
      <g stroke={PAIN_BORD} strokeWidth="1.2">
        <rect x={cx - 10 * e} y={cy - 10 * e} width={20 * e} height={7.5 * e} rx={3.5 * e} fill={PAIN}/>
        <rect x={cx - 11 * e} y={cy - 2.5 * e} width={22 * e} height={4.5 * e} rx={2 * e} fill={JAMBON} stroke={JAMBON_BORD}/>
        <rect x={cx - 10 * e} y={cy + 2.5 * e} width={20 * e} height={7.5 * e} rx={3.5 * e} fill={PAIN}/>
      </g>);
    return <circle cx={cx} cy={cy} r={9.5 * e} fill={couleur} stroke="#fff" strokeWidth="1"/>;
  })();
  const place = forme === 'rond'
    ? <circle cx={cx} cy={cy} r={9.5 * e} fill="none" stroke={forme === 'rond' ? couleur : '#64748b'} strokeWidth="1.4" strokeDasharray="3 2.2" opacity="0.7"/>
    : <rect x={x0 + 1} y={y0 + 2} width={L - 2} height={L - 4} rx={6 * e} fill="none" stroke="#64748b" strokeWidth="1.4" strokeDasharray="3 2.2" opacity="0.7"/>;
  if (fantome) return place;
  if (frac >= 1) return corps;
  const id = `${cid}-clip`;
  return (
    <g>
      {contour && place}
      <clipPath id={id}><rect x={x0} y={y0} width={L * Math.max(0, frac)} height={L}/></clipPath>
      <g clipPath={`url(#${id})`}>{corps}</g>
    </g>);
}

// Bécher d'acide sur du calcaire. etat : 'debut' (solide et bulles) | 'fin-solide' (plus de bulles, du solide reste) | 'fin-sans' (plus de bulles, plus de solide)
export function Becher({ x, y, etat }) {
  const paroi = `M${x} ${y} V${y + 92} Q${x} ${y + 100} ${x + 8} ${y + 100} H${x + 82} Q${x + 90} ${y + 100} ${x + 90} ${y + 92} V${y}`;
  const liquide = `M${x + 1.5} ${y + 26} H${x + 88.5} V${y + 91.5} Q${x + 88.5} ${y + 98.5} ${x + 81.5} ${y + 98.5} H${x + 8.5} Q${x + 1.5} ${y + 98.5} ${x + 1.5} ${y + 91.5} Z`;
  const gros = [[14, 92, 24, 80, 36, 84, 40, 92], [44, 92, 52, 82, 66, 86, 68, 92], [72, 92, 76, 84, 84, 88, 84, 92]];
  const petits = [[22, 92, 28, 85, 38, 88, 40, 92], [56, 92, 61, 86, 70, 89, 71, 92]];
  const morceaux = etat === 'debut' ? gros : etat === 'fin-solide' ? petits : [];
  return (
    <g>
      <path d={liquide} fill="#cfe5f7"/>
      {morceaux.map((p, k) => <polygon key={k} points={p.map((v, i) => v + (i % 2 === 0 ? x : y)).join(' ')} fill="#f8fafc" stroke="#64748b" strokeWidth="1.5"/>)}
      {etat === 'debut' && [[22, 62, 3.6], [44, 46, 3], [62, 66, 4], [34, 40, 2.6], [70, 46, 3.2], [52, 60, 2.4]].map(([a, b, r], k) => <circle key={k} cx={x + a} cy={y + b} r={r} fill="#fff" stroke="#3b82f6" strokeWidth="1.4"/>)}
      <path d={paroi} fill="none" stroke="#475569" strokeWidth="2.6" strokeLinecap="round"/>
    </g>);
}
