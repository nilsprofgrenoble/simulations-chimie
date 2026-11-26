// Schémas de la simulation 263 (flipper) : scène, graphique de la vitesse, cartes « À retenir ».
// Règles : police ≥ 14 dans un viewBox de 400 de large, tout le texte dans le viewBox, aucune valeur de réponse dans la scène (lettres h et α seulement).
const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', violet: '#6d28d9', ambre: '#b45309', sol: '#e7e5e4' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const halo = { stroke: 'white', strokeWidth: 4, paintOrder: 'stroke' };
const Fond = ({ children, h = 220, label }) => <svg viewBox={`0 0 400 ${h}`} style={base} role="img" aria-label={label}>{children}</svg>;
const Txt = ({ x, y, t, c = COL.encre, size = 15, w = 700, anchor = 'middle' }) => <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={w} fill={c} {...halo}>{t}</text>;
const fr = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');

// ═════════ Scène : lanceur à ressort et rampe inclinée ═════════
// h : hauteur du haut de la rampe (m), deg : angle, pL : position de la bille le long de la rampe (0 = pied, 1 = haut)
export function SceneFlipper({ h = 0.8, deg = 30, pL = 0, lanceur = true }) {
  const Y = 196, X0 = 84, a = deg * Math.PI / 180, run = h / Math.tan(a);
  const s = Math.min(160 / h, (300 - X0) / run), hp = h * s, xr = X0 + run * s, x = X0 + pL * run * s, y = Y - pL * hp;
  const nx = -Math.sin(a) * 9, ny = -Math.cos(a) * 9;
  const zig = []; for (let i = 0; i <= 8; i++) zig.push(`${18 + i * 7},${Y - 10 + (i % 2 ? -7 : 7) * (i === 0 || i === 8 ? 0 : 1)}`);
  return (
    <Fond h={226} label="Schéma : un lanceur à ressort éjecte une bille au pied d'une rampe inclinée d'un angle alpha ; le haut de la rampe est à la hauteur h au-dessus du sol.">
      <rect x="10" y={Y} width="380" height="20" fill={COL.sol}/><line x1="10" y1={Y} x2="390" y2={Y} stroke={COL.gris} strokeWidth="3"/>
      {lanceur && <g><rect x="10" y={Y - 26} width="8" height="26" fill={COL.gris}/><polyline points={zig.join(' ')} fill="none" stroke={COL.orange} strokeWidth="3" strokeLinejoin="round"/><rect x="74" y={Y - 20} width="4" height="20" rx="1" fill={COL.gris}/></g>}
      <polygon points={`${X0},${Y} ${xr},${Y} ${xr},${Y - hp}`} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5"/>
      <line x1={X0} y1={Y} x2={xr} y2={Y - hp} stroke={COL.gris} strokeWidth="4" strokeLinecap="round"/>
      <line x1={xr + 14} y1={Y - hp} x2={xr + 14} y2={Y} stroke={COL.violet} strokeWidth="2"/><line x1={xr + 8} y1={Y - hp} x2={xr + 20} y2={Y - hp} stroke={COL.violet} strokeWidth="2"/><line x1={xr + 8} y1={Y} x2={xr + 20} y2={Y} stroke={COL.violet} strokeWidth="2"/>
      <Txt x={Math.min(xr + 32, 385)} y={Y - hp / 2 + 5} t="h" c={COL.violet} size={17} w={800}/>
      <line x1={X0 - 4} y1={Y - hp} x2={xr + 14} y2={Y - hp} stroke={COL.violet} strokeWidth="1.5" strokeDasharray="5 4"/>
      <path d={`M ${X0 + 40} ${Y} A 40 40 0 0 0 ${X0 + 40 * Math.cos(a)} ${Y - 40 * Math.sin(a)}`} fill="none" stroke={COL.orange} strokeWidth="2.5"/>
      <Txt x={X0 + 58} y={Y - 8} t="α" c={COL.orange} size={17} w={800}/>
      <circle cx={x + nx} cy={y + ny} r="8" fill="#fde68a" stroke={COL.ambre} strokeWidth="3"/>
    </Fond>);
}

// ═════════ Graphique : énergies pendant la montée ═════════
export function GrapheFlipper({ pr, u = null }) {
  const X0 = 52, X1 = 386, Y0 = 14, Y1 = 150, n = pr.pts.length - 1, Emax = Math.max(...pr.pts.map(q => Math.max(q.Em, q.Ec, q.Epp)), 1e-9) * 1.1, smax = pr.pts[n].s || 1;
  const X = s => X0 + (X1 - X0) * s / smax, Y = e => Y1 - (Y1 - Y0) * e / Emax;
  const line = k => pr.pts.map(q => `${X(q.s).toFixed(1)},${Y(q[k]).toFixed(1)}`).join(' ');
  const k = u == null ? null : Math.round(u * n), q = k == null ? null : pr.pts[k];
  return (
    <svg viewBox="0 0 400 206" style={base} role="img" aria-label="Graphique : énergie cinétique, énergie potentielle et énergie mécanique de la bille en fonction de la distance parcourue sur la rampe.">
      <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke="#94a3b8" strokeWidth="1.5"/><line x1={X0} y1={Y0 - 4} x2={X0} y2={Y1 + 2} stroke="#94a3b8" strokeWidth="1.5"/>
      <text x="8" y="12" fontSize="13.5" fontWeight="700" fill={COL.gris}>J</text><text x={X0 - 5} y={Y1 + 5} textAnchor="end" fontSize="13.5" fill={COL.gris}>0</text>
      <text x={X0} y="172" textAnchor="middle" fontSize="13.5" fill={COL.gris}>0</text><text x={X1} y="172" textAnchor="end" fontSize="13.5" fill={COL.gris}>{fr(smax, 2)} m</text>
      <text x={(X0 + X1) / 2} y="196" textAnchor="middle" fontSize="13.5" fontWeight="600" fill={COL.gris}>distance parcourue sur la rampe</text>
      <polyline points={line('Em')} fill="none" stroke={COL.violet} strokeWidth="3.5"/><polyline points={line('Ec')} fill="none" stroke={COL.bleu} strokeWidth="3.5"/><polyline points={line('Epp')} fill="none" stroke={COL.orange} strokeWidth="3.5"/>
      <g fontSize="13.5" fontWeight="700"><text x={X1 - 2} y={Y(pr.pts[n].Em) - 6} textAnchor="end" fill={COL.violet}>Em</text><text x={X(smax * 0.72)} y={Y(pr.pts[Math.round(n * 0.72)].Ec) - 7} textAnchor="middle" fill={COL.bleu}>Ec</text><text x={X(smax * 0.72)} y={Y(pr.pts[Math.round(n * 0.72)].Epp) + 18} textAnchor="middle" fill={COL.orange}>Epp</text></g>
      {q && <g><line x1={X(q.s)} y1={Y0} x2={X(q.s)} y2={Y1} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 3"/><circle cx={X(q.s)} cy={Y(q.Ec)} r="5" fill={COL.bleu} stroke="white" strokeWidth="2"/><circle cx={X(q.s)} cy={Y(q.Epp)} r="5" fill={COL.orange} stroke="white" strokeWidth="2"/></g>}
    </svg>);
}

// ═════════ Cartes « À retenir » ═════════
export function SvgConversion() {
  return (
    <Fond h={212} label="Schéma : sans frottement, l'énergie cinétique à l'éjection devient de l'énergie potentielle en haut : un demi m v0 au carré égale m g h, donc h vaut v0 au carré divisé par 2 g, sans la masse ni l'angle. Exemple : v0 = 2,0 m/s donne h = 0,20 m.">
      <rect x="20" y="12" width="360" height="40" rx="10" fill="#f0f9ff" stroke={COL.bleu} strokeWidth="2.5"/><Txt x={200} y={38} t="en bas : Em = Ec = ½ m v0²" c={COL.bleu} size={16} w={800}/>
      <rect x="20" y="64" width="360" height="40" rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="2.5"/><Txt x={200} y={90} t="en haut : Em = Epp = m g h" c={COL.orange} size={16} w={800}/>
      <rect x="60" y="116" width="280" height="40" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2.5"/><Txt x={200} y={142} t="h = v0² ÷ (2 g)" c={COL.vert} size={17} w={800}/>
      <Txt x={200} y={184} t="ex. : v0 = 2,0 m/s → h = 0,20 m" c={COL.encre} size={14.5}/><Txt x={200} y={204} t="ni la masse ni l’angle n’interviennent" c={COL.gris} size={14} w={600}/>
    </Fond>);
}
export function SvgVminFlip() {
  return (
    <Fond h={214} label="Schéma : pour atteindre le haut d'une rampe de hauteur h, la vitesse d'éjection doit être au moins égale à la racine de 2 g h. Plus lente, la bille s'arrête avant le haut et redescend. Exemple : h = 0,50 m donne 3,1 mètres par seconde.">
      <rect x="20" y="12" width="360" height="40" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/><Txt x={200} y={38} t="½ m v0² = m g h" c={COL.violet} size={16.5} w={800}/>
      <rect x="60" y="64" width="280" height="40" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2.5"/><Txt x={200} y={90} t="v0 minimale = √(2 g h)" c={COL.vert} size={17} w={800}/>
      <rect x="20" y="116" width="360" height="40" rx="10" fill="#fef2f2" stroke={COL.rouge} strokeWidth="2.5"/><Txt x={200} y={142} t="v0 plus petite : elle redescend" c={COL.rouge} size={16} w={800}/>
      <Txt x={200} y={184} t="ex. : h = 0,50 m → v0 minimale ≈ 3,1 m/s" c={COL.encre} size={14.5}/><Txt x={200} y={204} t="plus vite : elle arrive en haut avec de la vitesse" c={COL.gris} size={14} w={600}/>
    </Fond>);
}
export function SvgFrottFlip() {
  return (
    <Fond h={214} label="Schéma : avec un frottement constant f sur la rampe de longueur L, l'énergie dissipée vaut f fois L. Il faut un demi m v0 au carré égal à m g h plus f L. Une rampe douce est plus longue, donc dissipe davantage.">
      <rect x="20" y="12" width="360" height="40" rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="2.5"/><Txt x={200} y={38} t="énergie dissipée = f × L" c={COL.orange} size={16.5} w={800}/>
      <rect x="20" y="64" width="360" height="40" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/><Txt x={200} y={90} t="½ m v0² = m g h + f L" c={COL.violet} size={16.5} w={800}/>
      <rect x="40" y="116" width="320" height="40" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2.5"/><Txt x={200} y={142} t="L = h ÷ sin α : rampe douce = L grande" c={COL.vert} size={15.5} w={800}/>
      <Txt x={200} y={184} t="même h : plus d’énergie perdue sur la rampe douce" c={COL.encre} size={14.5}/><Txt x={200} y={204} t="v0 minimale plus grande" c={COL.gris} size={14} w={600}/>
    </Fond>);
}
