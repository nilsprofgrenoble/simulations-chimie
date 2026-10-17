/* eslint-disable react-refresh/only-export-components -- txtVec est une fonction utilitaire liée au composant Vec */
// Figure de l'exercice REA « Vecteurs » : deux vecteurs tracés depuis le même point O sur une grille (1 carreau = 1 unité).
import { Fragment } from 'react';
const ORANGE_V = '#b45a1f', ARDOISE = '#334155';
// Deux vecteurs tracés depuis le même point O, sur une grille (1 carreau = 1 unité)
export function FigureVecteurs({ a, b, nomA, nomB, unite }) {
  const C = 26, W = 10, H = 10, ox = 5 * C, oy = 5 * C;
  const P = (x, y) => [ox + x * C, oy - y * C];
  const fl = (v, col, nom, dec) => {
    const [x2, y2] = P(v[0], v[1]), lx = x2 + (v[0] >= 0 ? 8 : -22) + dec, ly = y2 + (v[1] >= 0 ? -8 : 16), ang = Math.atan2(y2 - oy, x2 - ox), L = 9, q = t => `${x2 - L * Math.cos(ang + t)},${y2 - L * Math.sin(ang + t)}`;
    return <g>
      <line x1={ox} y1={oy} x2={x2} y2={y2} stroke={col} strokeWidth="3"/>
      <polyline points={`${q(0.45)} ${x2},${y2} ${q(-0.45)}`} fill="none" stroke={col} strokeWidth="3" strokeLinecap="round"/>
      <text x={lx} y={ly} fontSize="15" fontWeight="700" fill={col}>{nom[0]}<tspan dy="4" fontSize="11">{nom.slice(1).replace('₁', '1').replace('₂', '2')}</tspan></text>
      <path d={`M${lx} ${ly - 14} h10 m-3 -3 l3 3 l-3 3`} fill="none" stroke={col} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </g>;
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

// Vecteur noté « à la française » : lettre surmontée d'une flèche, indice éventuel (<Vec n="F" i="1"/> → F⃗₁)
export const Vec = ({ n, i }) => (
  <span role="img" aria-label={`vecteur ${n}${i ? ' ' + i : ''}`} style={{ whiteSpace: 'nowrap' }}>
    <span style={{ position: 'relative', display: 'inline-block' }}>{n}
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: '-0.62em', textAlign: 'center', fontSize: '0.9em', lineHeight: 1, fontWeight: 400 }}>→</span>
    </span>{i ? <sub>{i}</sub> : null}
  </span>);
// Remplace les repères ⟦F|1⟧ (ou ⟦Δv⟧) d'un texte par des vecteurs notés avec une flèche
export function txtVec(t) {
  if (typeof t !== 'string' || !t.includes('⟦')) return t;
  return t.split(/(⟦[^⟧]*⟧)/).map((m, k) => {
    const r = /^⟦([^|⟧]*)\|?([^⟧]*)⟧$/.exec(m);
    return r ? <Vec key={k} n={r[1]} i={r[2]}/> : <Fragment key={k}>{m}</Fragment>;
  });
}
