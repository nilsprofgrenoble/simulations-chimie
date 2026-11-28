// Formule sur une ligne dans un schéma SVG, avec de vraies fractions (barre de fraction) à la place du signe « ÷ ».
// parts : suite de textes et de fractions, ex. ['A = ', { h: 'Us', b: 'Ue' }, ' = 0,50'].
// x, y : point d'ancrage (a = 'middle' | 'start' | 'end') sur la ligne de base du texte courant ; s : taille de la police.
const LARG = 0.56; // largeur moyenne d'un caractère, en fraction de la taille
const largeur = (t, s, w) => String(t).length * s * LARG * (w >= 700 ? 1.06 : 1);

export function FormuleSvg({ x, y, s = 15, w = 400, c = '#0f172a', a = 'middle', parts, fontFamily }) {
  const sf = s * 0.86;
  const mesure = p => (typeof p === 'string' ? largeur(p, s, w) : Math.max(largeur(p.h, sf, w), largeur(p.b, sf, w)) + 8);
  const total = parts.reduce((t, p) => t + mesure(p), 0);
  let cur = a === 'middle' ? x - total / 2 : a === 'end' ? x - total : x;
  const out = [];
  parts.forEach((p, i) => {
    const l = mesure(p);
    if (typeof p === 'string') {
      out.push(<text key={i} x={cur} y={y} fontSize={s} fontWeight={w} fill={c} fontFamily={fontFamily} xmlSpace="preserve" style={{ whiteSpace: 'pre' }}>{p}</text>);
    } else {
      const ya = y - s * 0.3; // hauteur de l'axe des fractions
      out.push(
        <g key={i} fill={c} fontWeight={w} fontFamily={fontFamily}>
          <text x={cur + l / 2} y={ya - sf * 0.22} textAnchor="middle" fontSize={sf}>{p.h}</text>
          <line x1={cur + 2} y1={ya} x2={cur + l - 2} y2={ya} stroke={c} strokeWidth={Math.max(1.2, s * 0.09)} />
          <text x={cur + l / 2} y={ya + sf * 0.95} textAnchor="middle" fontSize={sf}>{p.b}</text>
        </g>);
    }
    cur += l;
  });
  return <g data-formule="1">{out}</g>;
}
