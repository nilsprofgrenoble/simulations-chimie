import * as M from "./lentilleMinceModele";

// Schémas de la lentille mince (1G) : cartes « À retenir » de la simulation 114 et schémas d'énoncés d'exercices.
// Les positions viennent du même modèle que la simulation (lentilleMinceModele.js) : le schéma ne peut pas contredire le calcul.
// image = false : on ne dessine ni les rayons, ni l'image (énoncé d'exercice : la réponse n'est jamais dessinée avant la correction).
const fleche = (x, y, ang, c, t = 7) => <polygon points={`0,0 ${-2 * t},${-t * 0.8} ${-2 * t},${t * 0.8}`} fill={c} transform={`translate(${x},${y}) rotate(${ang})`}/>;
export const COUL = { obj: '#0f172a', img: '#15803d', r1: '#0072b2', r2: '#d55e00', r3: '#7c3aed', foyer: '#0369a1', lent: '#0369a1' };

export function Schema({ d, f, k = 11, x0 = 135, y0 = 75, hObj = 3, rayons = [1, 2, 3], ecran = false, cotes = false, hauteurs = false, label, large = 300, haut = 150, foyers = true, extra = null, image = true }) {
  const im = M.image(d, f), h = hObj, yB = h, voir = image !== false;      // image = false : on ne dessine ni rayons, ni image (schéma d'énoncé)
  const X = x => x0 + k * x, Y = y => y0 - k * y;
  const y3 = (yB * f) / (f - d), cols = { 1: COUL.r1, 2: COUL.r2, 3: COUL.r3 };
  const xFin = ecran && im.nature === 'reelle' ? im.OAp : (large - x0) / k - 1;
  const pts = {
    1: { L: yB, dir: [f, -yB] }, 2: { L: 0, dir: [d, -yB] }, 3: { L: y3, dir: [1, 0] },
  };
  return (
    <svg viewBox={`0 0 ${large} ${haut}`} role="img" aria-label={label} style={{ width: '100%', maxWidth: 360, height: 'auto', display: 'block', margin: '6px auto' }}>
      <line x1="6" y1={y0} x2={large - 6} y2={y0} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="6 3"/>
      <line x1={X(0)} y1={y0 - 62} x2={X(0)} y2={y0 + 62} stroke={COUL.lent} strokeWidth="3"/>
      <polygon points={`${X(0)},${y0 - 66} ${X(0) - 5},${y0 - 55} ${X(0) + 5},${y0 - 55}`} fill={COUL.lent}/><polygon points={`${X(0)},${y0 + 66} ${X(0) - 5},${y0 + 55} ${X(0) + 5},${y0 + 55}`} fill={COUL.lent}/>
      {voir && rayons.map(n => { const r = pts[n]; if (!isFinite(r.L)) return null; const yFin = r.L + (r.dir[1] / r.dir[0]) * xFin;
        return (<g key={n}><polyline points={`${X(-d)},${Y(yB)} ${X(0)},${Y(r.L)} ${X(xFin)},${Y(yFin)}`} fill="none" stroke={cols[n]} strokeWidth="1.9" strokeLinejoin="round"/>
          {im.nature === 'virtuelle' && <line x1={X(0)} y1={Y(r.L)} x2={X(im.OAp)} y2={Y(im.hImg)} stroke={cols[n]} strokeWidth="1.5" strokeDasharray="4 3"/>}</g>); })}
      {voir && ecran && im.nature === 'reelle' && <rect x={X(im.OAp) + 1} y={y0 - 50} width="5" height="100" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.3"/>}
      <line x1={X(-d)} y1={y0} x2={X(-d)} y2={Y(yB) + 4} stroke={COUL.obj} strokeWidth="3"/><polygon points={`${X(-d)},${Y(yB) - 2} ${X(-d) - 4},${Y(yB) + 7} ${X(-d) + 4},${Y(yB) + 7}`} fill={COUL.obj}/>
      {voir && <line x1={X(im.OAp)} y1={y0} x2={X(im.OAp)} y2={Y(im.hImg)} stroke={COUL.img} strokeWidth="3" strokeDasharray={im.nature === 'virtuelle' ? '5 3' : undefined}/>}
      {voir && <polygon points={im.hImg > 0 ? `${X(im.OAp)},${Y(im.hImg) - 2} ${X(im.OAp) - 4},${Y(im.hImg) + 7} ${X(im.OAp) + 4},${Y(im.hImg) + 7}` : `${X(im.OAp)},${Y(im.hImg) + 2} ${X(im.OAp) - 4},${Y(im.hImg) - 7} ${X(im.OAp) + 4},${Y(im.hImg) - 7}`} fill={COUL.img}/>}
      {foyers && <g fontSize="11" fontWeight="700" fill={COUL.foyer}><circle cx={X(f)} cy={y0} r="3" fill={COUL.foyer}/><text x={X(f)} y={y0 + 14} textAnchor="middle">F′</text>
        <circle cx={X(-f)} cy={y0} r="3" fill="#fff" stroke={COUL.foyer} strokeWidth="1.6"/><text x={X(-f)} y={y0 + 14} textAnchor="middle">F</text></g>}
      <g fontSize="11" fontWeight="700"><text x={X(0) - 5} y={y0 + 14} textAnchor="end" fill="#0f172a">O</text>
        <text x={X(-d) - 5} y={Y(yB) + 2} textAnchor="end" fill={COUL.obj}>B</text><text x={X(-d) - 5} y={y0 + 12} textAnchor="end" fill={COUL.obj}>A</text>
        {voir && <><text x={X(im.OAp) + 6} y={Y(im.hImg) + (im.hImg > 0 ? 3 : 8)} fill={COUL.img}>B′</text><text x={X(im.OAp) + 6} y={y0 + (im.hImg > 0 ? 12 : -4)} fill={COUL.img}>A′</text></>}</g>
      {voir && cotes && <g fontSize="10.5" fontWeight="700" fill="#334155">
        <line x1={X(-d)} y1={y0 + 40} x2={X(0)} y2={y0 + 40} stroke="#334155" strokeWidth="1.3"/>{fleche(X(0), y0 + 40, 0, '#334155', 4)}<text x={(X(-d) + X(0)) / 2} y={y0 + 54} textAnchor="middle">OA &lt; 0</text>
        <line x1={X(0)} y1={y0 + 40} x2={X(im.OAp)} y2={y0 + 40} stroke="#15803d" strokeWidth="1.3"/>{fleche(X(im.OAp), y0 + 40, 0, '#15803d', 4)}<text x={(X(0) + X(im.OAp)) / 2} y={y0 + 54} textAnchor="middle" fill="#15803d">OA′ &gt; 0</text>
        <text x={large - 8} y="14" textAnchor="end">sens de la lumière : sens positif →</text></g>}
      {voir && hauteurs && <g fontSize="10.5" fontWeight="700">
        <line x1={X(-d) - 22} y1={y0} x2={X(-d) - 22} y2={Y(yB)} stroke={COUL.obj} strokeWidth="1.2"/><text x={X(-d) - 26} y={(y0 + Y(yB)) / 2 + 3} textAnchor="end" fill={COUL.obj}>AB</text>
        <line x1={X(im.OAp) + 22} y1={y0} x2={X(im.OAp) + 22} y2={Y(im.hImg)} stroke={COUL.img} strokeWidth="1.2"/><text x={X(im.OAp) + 26} y={(y0 + Y(im.hImg)) / 2 + 3} fill={COUL.img}>A′B′</text></g>}
      {extra}
    </svg>);
}

