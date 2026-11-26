// Schémas de la simulation 262 (looping) : scène, graphique de la vitesse, cartes « À retenir ».
// Règles : police ≥ 14 dans un viewBox de 400 de large, tout le texte dans le viewBox, aucune valeur de réponse dans la scène (lettres H et R seulement).
const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', violet: '#6d28d9', ambre: '#b45309', sol: '#e7e5e4' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const halo = { stroke: 'white', strokeWidth: 4, paintOrder: 'stroke' };
const Fond = ({ children, h = 220, label }) => <svg viewBox={`0 0 400 ${h}`} style={base} role="img" aria-label={label}>{children}</svg>;
const Txt = ({ x, y, t, c = COL.encre, size = 15, w = 700, anchor = 'middle' }) => <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={w} fill={c} {...halo}>{t}</text>;
const fr = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');

// ═════════ Scène : pente d'accès puis looping circulaire ═════════
// p : avancée du wagon de 0 (départ en haut de la pente) à 1 (sortie du looping) ; la première moitié du parcours est la pente, la seconde le tour du cercle
export function SceneLooping({ H = 10, R = 3, p = 0, rails = true, repereTop = false }) {
  const Y = 200, s = Math.min(16, 170 / Math.max(H, 2 * R + 1)), cx = 290, r = R * s, hp = H * s, xb = cx - r - 10, xTop = xb - hp;
  const ramp = { x0: Math.max(30, xTop), y0: Y - hp };
  // position du wagon
  let wx, wy;
  if (p <= 0.5) { const q = p / 0.5; if (q < 0.8) { const w = q / 0.8; wx = ramp.x0 + (xb - ramp.x0) * w; wy = ramp.y0 + (Y - ramp.y0) * w; } else { wx = xb + (cx - xb) * (q - 0.8) / 0.2; wy = Y; } }
  else { const a = (p - 0.5) / 0.5 * 2 * Math.PI; wx = cx + r * Math.sin(a); wy = Y - r * (1 - Math.cos(a)); }
  return (
    <Fond h={226} label="Schéma : un wagon est lâché sans vitesse du haut d'une pente de hauteur H ; il descend puis entre dans un looping circulaire de rayon R, dont le sommet est à la hauteur 2R au-dessus du sol.">
      <rect x="10" y={Y} width="380" height="20" fill={COL.sol}/><line x1="10" y1={Y} x2="390" y2={Y} stroke={COL.gris} strokeWidth="3"/>
      {rails && <g fill="none" stroke={COL.gris} strokeWidth="3.5" strokeLinecap="round">
        <line x1={ramp.x0} y1={ramp.y0} x2={xb} y2={Y}/><line x1={xb} y1={Y} x2={cx} y2={Y}/>
        <circle cx={cx} cy={Y - r} r={r} stroke="#94a3b8" strokeWidth="3.5"/>
        <line x1={cx} y1={Y} x2={Math.min(390, cx + 90)} y2={Y}/></g>}
      <g><line x1={ramp.x0 - 14} y1={ramp.y0} x2={ramp.x0 - 14} y2={Y} stroke={COL.violet} strokeWidth="2"/><line x1={ramp.x0 - 20} y1={ramp.y0} x2={ramp.x0 - 8} y2={ramp.y0} stroke={COL.violet} strokeWidth="2"/><line x1={ramp.x0 - 20} y1={Y} x2={ramp.x0 - 8} y2={Y} stroke={COL.violet} strokeWidth="2"/></g>
      <Txt x={Math.max(11, ramp.x0 - 28)} y={(ramp.y0 + Y) / 2 + 5} t="H" c={COL.violet} size={17} w={800} anchor="middle"/>
      <line x1={cx} y1={Y - r} x2={cx + r} y2={Y - r} stroke={COL.orange} strokeWidth="2.5" strokeDasharray="4 3"/><Txt x={cx + r / 2} y={Y - r - 6} t="R" c={COL.orange} size={16} w={800}/>
      {repereTop && <g><line x1={cx - r - 12} y1={Y - 2 * r} x2={cx + r + 12} y2={Y - 2 * r} stroke={COL.violet} strokeWidth="2" strokeDasharray="5 3"/><Txt x={cx} y={Y - 2 * r - 22} t="sommet" c={COL.violet} size={14} w={700}/></g>}
      <g><circle cx={wx} cy={wy - 8} r="8" fill="#fde68a" stroke={COL.ambre} strokeWidth="3"/></g>
      <Txt x={ramp.x0 + 6} y={Y + 17} t={`départ au repos`} c={COL.gris} size={14} w={600} anchor="start"/>
    </Fond>);
}

// ═════════ Graphique : vitesse en fonction de la position dans le looping ═════════
export function GrapheLooping({ pr, vmin, u = null }) {
  const vmax = Math.max(...pr.pts.map(q => q.v), vmin) * 1.12, X0 = 50, X1 = 386, Y0 = 14, Y1 = 150, n = pr.pts.length - 1;
  const X = i => X0 + (X1 - X0) * i / n, Y = v => Y1 - (Y1 - Y0) * v / vmax;
  const pts = pr.pts.map((q, i) => `${X(i).toFixed(1)},${Y(q.v).toFixed(1)}`).join(' ');
  const k = u == null ? null : Math.round(u * n), q = k == null ? null : pr.pts[k];
  return (
    <svg viewBox="0 0 400 200" style={base} role="img" aria-label="Graphique : vitesse du wagon en fonction de sa position autour du looping, de 0 degré au point le plus bas à 180 degrés au sommet, avec la vitesse minimale admise au sommet en pointillés.">
      <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke="#94a3b8" strokeWidth="1.5"/><line x1={X0} y1={Y0 - 4} x2={X0} y2={Y1 + 2} stroke="#94a3b8" strokeWidth="1.5"/>
      <text x="8" y="12" fontSize="13.5" fontWeight="700" fill={COL.gris}>m/s</text><text x={X0 - 5} y={Y1 + 5} textAnchor="end" fontSize="13.5" fill={COL.gris}>0</text>
      <text x={X0 - 5} y={Y(vmin) + 5} textAnchor="end" fontSize="13.5" fill={COL.vert}>{fr(vmin, 1)}</text>
      <line x1={X0} y1={Y(vmin)} x2={X1} y2={Y(vmin)} stroke={COL.vert} strokeWidth="2.5" strokeDasharray="6 4"/>
      <text x={X0} y="172" textAnchor="middle" fontSize="13.5" fill={COL.gris}>bas</text><text x={X(n / 2)} y="172" textAnchor="middle" fontSize="13.5" fill={COL.gris}>sommet</text><text x={X1} y="172" textAnchor="end" fontSize="13.5" fill={COL.gris}>bas</text>
      <text x={(X0 + X1) / 2} y="192" textAnchor="middle" fontSize="13.5" fontWeight="600" fill={COL.gris}>position dans le looping (un tour)</text>
      <polyline points={pts} fill="none" stroke={COL.bleu} strokeWidth="3.5"/>
      {q && <circle cx={X(k)} cy={Y(q.v)} r="5.5" fill={COL.bleu} stroke="white" strokeWidth="2"/>}
      <text x={X1 - 2} y={Y(vmin) + 17} textAnchor="end" fontSize="14" fontWeight="700" fill={COL.vert}>v min</text>
    </svg>);
}

// ═════════ Cartes « À retenir » ═════════
export function SvgVitesseZ() {
  return (
    <Fond h={212} label="Schéma : sans frottement, l'énergie mécanique est conservée. À l'altitude z, la vitesse vaut la racine de 2 g fois H moins z. Plus l'altitude est grande, plus la vitesse est petite, et la masse n'intervient pas. Exemple : H = 8 m, z = 4 m donne v = 8,9 mètres par seconde.">
      <rect x="20" y="12" width="360" height="40" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/><Txt x={200} y={38} t="Em = m g H (conservée)" c={COL.violet} size={16} w={800}/>
      <rect x="20" y="64" width="360" height="40" rx="10" fill="#f0f9ff" stroke={COL.bleu} strokeWidth="2.5"/><Txt x={200} y={90} t="m g H = m g z + ½ m v²" c={COL.bleu} size={16} w={800}/>
      <rect x="60" y="116" width="280" height="40" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2.5"/><Txt x={200} y={142} t="v = √(2 g (H − z))" c={COL.vert} size={17} w={800}/>
      <Txt x={200} y={184} t="ex. : H = 8 m, z = 4 m → v ≈ 8,9 m/s" c={COL.encre} size={14.5}/><Txt x={200} y={204} t="la masse ne compte pas" c={COL.gris} size={14} w={600}/>
    </Fond>);
}
export function SvgContact() {
  return (
    <Fond h={214} label="Schéma : condition de contact admise au sommet du looping : la vitesse doit être au moins égale à la racine de g R. Avec la conservation de l'énergie mécanique, la hauteur minimale de départ vaut 2,5 R. Exemple : R = 2 m donne H minimale = 5 m.">
      <rect x="20" y="12" width="360" height="40" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2.5"/><Txt x={200} y={38} t="contact au sommet : v ≥ √(g R)  (admis)" c={COL.vert} size={15.5} w={800}/>
      <rect x="20" y="64" width="360" height="40" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/><Txt x={200} y={90} t="m g H = m g (2R) + ½ m g R" c={COL.violet} size={16} w={800}/>
      <rect x="60" y="116" width="280" height="40" rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="2.5"/><Txt x={200} y={142} t="H minimale = 2,5 R" c={COL.orange} size={17} w={800}/>
      <Txt x={200} y={182} t="ex. : R = 2 m → H minimale = 5 m" c={COL.encre} size={14.5}/><Txt x={200} y={202} t="plus bas, le wagon décroche" c={COL.gris} size={14} w={600}/>
    </Fond>);
}
export function SvgFrottLoop() {
  return (
    <Fond h={206} label="Schéma : avec frottement, une partie de l'énergie mécanique est dissipée avant le sommet, l'énergie cinétique au sommet est plus petite qu'avec la seule conservation, donc il faut partir de plus haut pour passer le looping.">
      <rect x="20" y="12" width="360" height="40" rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="2.5"/><Txt x={200} y={38} t="ΔEm = W(f) < 0 : Em diminue" c={COL.orange} size={16} w={800}/>
      <rect x="20" y="64" width="360" height="44" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/><Txt x={200} y={84} t="Ec au sommet plus petite" c={COL.violet} size={15.5} w={800}/><Txt x={200} y={102} t="qu’avec la seule conservation" c={COL.gris} size={14} w={600}/>
      <rect x="60" y="120" width="280" height="40" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2.5"/><Txt x={200} y={146} t="il faut partir plus haut" c={COL.vert} size={17} w={800}/>
      <Txt x={200} y={186} t="la vitesse minimale √(g R) ne change pas" c={COL.encre} size={14.5}/>
    </Fond>);
}
