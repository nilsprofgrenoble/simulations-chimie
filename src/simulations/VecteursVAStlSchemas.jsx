// Schémas propres à la version TSTL de la simulation « vitesse et accélération » (264) : le mouvement circulaire uniforme (qualitatif).
// Ils réutilisent les éléments de dessin de vecteursVASchemas.jsx (flèches, noms de vecteurs surmontés d'une flèche) sans les modifier.
import { C, Fl, VT, L } from './vecteursVASchemas';
const stl = { width: '100%', height: 'auto', display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 8 };
const Tx = ({ x, y, children, c = C.encre, s = 18, w = 400, a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;

// Un mobile parcourt un cercle de centre O à vitesse de valeur constante : vecteurs vitesse tangents (bleu), vecteurs accélération dirigés vers le centre (orange, tirets, après la réponse)
export function SceneCirculaire({ montrerA = false, maxWidth = 440 }) {
  const cx = 200, cy = 128, R = 84, pts = [0, 1, 2, 3, 4, 5, 6, 7].map(k => { const a = k * Math.PI / 4 - Math.PI / 2; return { k, a, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }; });
  return (
    <svg viewBox="0 0 400 260" role="img" style={{ ...stl, maxWidth, border: `1px solid ${C.clair}` }}
      aria-label={`Mouvement circulaire uniforme : un point M décrit un cercle de centre O avec une vitesse de valeur constante. Huit positions sont représentées, avec le vecteur vitesse tangent au cercle, de même longueur à chaque position${montrerA ? ', et le vecteur accélération dirigé vers le centre O du cercle' : ''}.`}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.clair} strokeWidth="2.5" strokeDasharray="6 5"/>
      <circle cx={cx} cy={cy} r="4.5" fill={C.encre}/><Tx x={cx + 9} y={cy + 6} w={700}>O</Tx>
      {pts.map(p => {
        const ux = -Math.sin(p.a), uy = Math.cos(p.a);                                   // tangente au cercle
        return (
          <g key={p.k}>
            <Fl x1={p.x} y1={p.y} x2={p.x + 40 * ux} y2={p.y + 40 * uy} c={C.bleu} w={3}/>
            {montrerA && <Fl x1={p.x} y1={p.y} x2={p.x - 30 * Math.cos(p.a)} y2={p.y - 30 * Math.sin(p.a)} c={C.orange} w={3.4} dash="7 3.5"/>}
            <circle cx={p.x} cy={p.y} r="5" fill={C.encre} stroke="#fff" strokeWidth="1"/>
          </g>);
      })}
      <VT x={pts[1].x + 4} y={pts[1].y - 28} t="v" c={C.bleu} halo/>
      {montrerA && <VT x={pts[3].x - 38} y={pts[3].y + 44} t="a" c={C.orange} halo/>}
      <Tx x="200" y="250" s={16} c={C.gris} a="middle">Huit positions, flèches de même longueur</Tx>
    </svg>);
}

// Carte « À retenir » : mouvement circulaire uniforme
export function SvgCirculaireCarte() {
  const cx = 110, cy = 100, R = 62, ang = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
  return (
    <svg viewBox="0 0 400 206" role="img" style={{ ...stl, maxWidth: 420 }}
      aria-label="Mouvement circulaire uniforme : le vecteur vitesse, tangent au cercle, change de direction à chaque instant ; le vecteur accélération n'est pas nul, il est perpendiculaire au vecteur vitesse et dirigé vers le centre du cercle.">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.clair} strokeWidth="2.5" strokeDasharray="6 5"/><circle cx={cx} cy={cy} r="4" fill={C.encre}/>
      {ang.map((a, k) => { const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
        return <g key={k}><Fl x1={x} y1={y} x2={x - 34 * Math.sin(a)} y2={y + 34 * Math.cos(a)} c={C.bleu} w={3}/><Fl x1={x} y1={y} x2={x - 26 * Math.cos(a)} y2={y - 26 * Math.sin(a)} c={C.orange} w={3.2} dash="7 3.5"/><circle cx={x} cy={y} r="4.5" fill={C.encre}/></g>; })}
      <L x={232} y={50} segs={[{ t: 'v', c: C.bleu }, 'tangent,']} c={C.bleu}/><Tx x="232" y="74" w="700" c={C.bleu}>valeur constante</Tx>
      <L x={232} y={112} segs={[{ t: 'a', c: C.orange }, '≠ 0 :']} c={C.orange}/><Tx x="232" y="136" w="700" c={C.orange}>vers le centre</Tx>
      <L x={232} y={172} segs={[{ t: 'a', c: C.orange }, '⟂', { t: 'v', c: C.bleu }]}/>
    </svg>);
}
