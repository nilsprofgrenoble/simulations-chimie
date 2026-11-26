// Schémas de la simulation 261 (chute d'une hauteur h sur une rampe) : scène, graphique des énergies, cartes « À retenir ».
// Règles : police ≥ 14 dans un viewBox de 400 de large, tout le texte dans le viewBox, aucune valeur de réponse dans la scène du parcours (lettres h et L seulement).
const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', violet: '#6d28d9', ciel: '#dbeafe', sol: '#e7e5e4', ambre: '#b45309' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const halo = { stroke: 'white', strokeWidth: 4, paintOrder: 'stroke' };
const Fond = ({ children, h = 220, label }) => <svg viewBox={`0 0 400 ${h}`} style={base} role="img" aria-label={label}>{children}</svg>;
const Txt = ({ x, y, t, c = COL.encre, size = 15, w = 700, anchor = 'middle' }) => <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={w} fill={c} {...halo}>{t}</text>;
const Fleche = ({ x1, y1, x2, y2, c = COL.bleu, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9 + w * 0.8, d = 0.5;
  const p = [[x2, y2], [x2 - L * Math.cos(a - d), y2 - L * Math.sin(a - d)], [x2 - L * Math.cos(a + d), y2 - L * Math.sin(a + d)]].map(z => z.join(',')).join(' ');
  return <g><line x1={x1} y1={y1} x2={x2 - (L - 2) * Math.cos(a)} y2={y2 - (L - 2) * Math.sin(a)} stroke={c} strokeWidth={w}/><polygon points={p} fill={c}/></g>;
};
const fr = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');

// ═════════ Scène : l'objet sur sa rampe (départ en haut à gauche, arrivée en bas à droite) ═════════
// u : avancée le long de la rampe (0 = départ, 1 = arrivée) ; h, L : proportions de la rampe ; v : 0..1 longueur de la flèche de vitesse ; frott : flèche du frottement ; cotes : lettres h et L
export function SceneRampe({ u = 0, h = 5, L = 10, v = 0, frott = false, cotes = true, cote = null }) {
  const ratio = Math.min(0.92, Math.max(0.2, h / L));
  const hv = Math.min(120, 40 + 160 * ratio), run = Math.min(270, hv / Math.tan(Math.asin(ratio))), X0 = 56, Y0 = 188 - hv, X1 = X0 + run, Y1 = 188;
  const ang = Math.atan2(Y1 - Y0, X1 - X0), deg = ang * 180 / Math.PI, px = X0 + (X1 - X0) * u, py = Y0 + (Y1 - Y0) * u;
  return (
    <Fond h={220} label={`Schéma : un objet est lâché sans vitesse du haut d'une rampe de hauteur h et de longueur L${frott ? ' ; le frottement de la rampe s’oppose à son mouvement' : ''}. Il glisse vers le bas.`}>
      <rect x="20" y={Y1} width="360" height="22" fill={COL.sol}/><line x1="20" y1={Y1} x2="380" y2={Y1} stroke={COL.gris} strokeWidth="3"/>
      <polygon points={`${X0},${Y0} ${X1},${Y1} ${X0},${Y1}`} fill="#f1f5f9" stroke={COL.gris} strokeWidth="3" strokeLinejoin="round"/>
      {cotes && <g>
        <line x1={X0 - 14} y1={Y0} x2={X0 - 14} y2={Y1} stroke={COL.violet} strokeWidth="2"/><line x1={X0 - 20} y1={Y0} x2={X0 - 8} y2={Y0} stroke={COL.violet} strokeWidth="2"/><line x1={X0 - 20} y1={Y1} x2={X0 - 8} y2={Y1} stroke={COL.violet} strokeWidth="2"/>
        <Txt x={X0 - 28} y={(Y0 + Y1) / 2 + 5} t="h" c={COL.violet} size={17} w={800}/>
        <Txt x={(X0 + X1) / 2 - 12} y={(Y0 + Y1) / 2 + 30} t="L" c={COL.gris} size={17} w={800}/></g>}
      <g transform={`translate(${px},${py}) rotate(${deg})`}>
        <rect x="-16" y="-26" width="32" height="26" rx="4" fill="#fde68a" stroke={COL.ambre} strokeWidth="3"/>
        {v > 0.02 && <Fleche x1={20} y1={-13} x2={20 + 46 * v} y2={-13} c={COL.vert} w={3.5}/>}
        {frott && <Fleche x1={-20} y1={-13} x2={-58} y2={-13} c={COL.orange} w={3.5}/>}
      </g>
      {cote && <Txt x={(X0 + X1) / 2 + 60} y={30} t={cote} c={COL.gris} size={15}/>}
      <Txt x={X0 + 6} y={Y1 + 20} t="départ au repos" c={COL.gris} size={14} w={600} anchor="start"/>
    </Fond>);
}

// ═════════ Graphique : Epp, Ec et Em en fonction de la distance parcourue sur la rampe ═════════
export function GrapheRampe({ pr, u = null }) {
  const Em0 = pr.pts[0].Em, hi = Em0 * 1.1, X0 = 56, X1 = 386, Y0 = 14, Y1 = 150, L = pr.pts.at(-1).s;
  const X = s => X0 + (X1 - X0) * s / L, Y = e => Y1 - (Y1 - Y0) * e / hi, poly = f => pr.pts.map(q => `${X(q.s).toFixed(1)},${Y(f(q)).toFixed(1)}`).join(' ');
  const k = u == null ? null : Math.round(u * (pr.pts.length - 1)), q = k == null ? null : pr.pts[k];
  return (
    <svg viewBox="0 0 400 200" style={base} role="img" aria-label="Graphique : énergie potentielle, énergie cinétique et énergie mécanique d'un objet qui glisse le long d'une rampe, en fonction de la distance parcourue.">
      <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke="#94a3b8" strokeWidth="1.5"/><line x1={X0} y1={Y0 - 4} x2={X0} y2={Y1 + 2} stroke="#94a3b8" strokeWidth="1.5"/>
      <text x={X0 - 5} y={Y(Em0) + 5} textAnchor="end" fontSize="13.5" fill={COL.gris}>{fr(Em0, Em0 < 10 ? 1 : 0)}</text><text x={X0 - 5} y={Y1 + 5} textAnchor="end" fontSize="13.5" fill={COL.gris}>0</text>
      <text x="8" y="12" fontSize="13.5" fontWeight="700" fill={COL.gris}>J</text>
      <text x={X0} y="172" textAnchor="middle" fontSize="13.5" fill={COL.gris}>0</text><text x={X1} y="172" textAnchor="end" fontSize="13.5" fill={COL.gris}>{fr(L, 0)} m</text><text x={(X0 + X1) / 2} y="192" textAnchor="middle" fontSize="13.5" fontWeight="600" fill={COL.gris}>distance parcourue sur la rampe</text>
      <polyline points={poly(z => z.Epp)} fill="none" stroke={COL.ambre} strokeWidth="3.5"/>
      <polyline points={poly(z => z.Ec)} fill="none" stroke={COL.bleu} strokeWidth="3.5"/>
      <polyline points={poly(z => z.Em)} fill="none" stroke={COL.violet} strokeWidth="3.5" strokeDasharray="7 4"/>
      {q && <g><circle cx={X(q.s)} cy={Y(q.Epp)} r="5.5" fill={COL.ambre} stroke="white" strokeWidth="2"/><circle cx={X(q.s)} cy={Y(q.Ec)} r="5.5" fill={COL.bleu} stroke="white" strokeWidth="2"/><circle cx={X(q.s)} cy={Y(q.Em)} r="5.5" fill={COL.violet} stroke="white" strokeWidth="2"/></g>}
      <text x="150" y="172" fontSize="14" fontWeight="700" fill={COL.ambre}>Epp</text><text x="195" y="172" fontSize="14" fontWeight="700" fill={COL.bleu}>Ec</text><text x="230" y="172" fontSize="14" fontWeight="700" fill={COL.violet}>Em</text>
    </svg>);
}

// ═════════ Cartes « À retenir » ═════════
export function SvgConserv() {
  return (
    <Fond h={214} label="Schéma : sans frottement, l'énergie mécanique est conservée. L'énergie potentielle du départ m g h devient l'énergie cinétique d'arrivée un demi m v au carré, donc v vaut la racine de 2 g h. Exemple : h = 5,0 m donne v = 9,9 mètres par seconde.">
      <rect x="20" y="12" width="165" height="52" rx="10" fill="#fffbeb" stroke={COL.ambre} strokeWidth="2.5"/><Txt x={102} y={34} t="départ (repos)" c={COL.gris} size={14} w={600}/><Txt x={102} y={55} t="Epp = m g h" c={COL.ambre} size={16} w={800}/>
      <Txt x={200} y={44} t="→" c={COL.gris} size={20}/>
      <rect x="215" y="12" width="165" height="52" rx="10" fill="#f0f9ff" stroke={COL.bleu} strokeWidth="2.5"/><Txt x={297} y={34} t="arrivée (z = 0)" c={COL.gris} size={14} w={600}/><Txt x={297} y={55} t="Ec = ½ m v²" c={COL.bleu} size={16} w={800}/>
      <rect x="20" y="78" width="360" height="40" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/><Txt x={200} y={104} t="Em conservée : m g h = ½ m v²" c={COL.violet} size={16} w={800}/>
      <rect x="60" y="130" width="280" height="38" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2.5"/><Txt x={200} y={155} t="v = √(2 g h)" c={COL.vert} size={17} w={800}/>
      <Txt x={200} y={196} t="ex. : h = 4,0 m → v ≈ 8,9 m/s" c={COL.encre} size={14.5}/>
    </Fond>);
}
export function SvgIndep() {
  const L = [['masse × 2', 'v inchangée', 'm se simplifie', COL.bleu], ['rampe longue', 'v inchangée', 'seul h compte', COL.violet], ['hauteur × 4', 'v × 2', 'v ∝ √h', COL.rouge]];
  return (
    <Fond h={206} label="Schéma : sans frottement, la vitesse d'arrivée ne dépend ni de la masse ni de la longueur ou de la forme de la rampe, mais seulement de la hauteur : si la hauteur est multipliée par 4, la vitesse est multipliée par 2.">
      {L.map(([a, b, c, col], i) => <g key={a}><rect x="14" y={12 + 58 * i} width="372" height="50" rx="10" fill="white" stroke={col} strokeWidth="2.5"/>
        <Txt x={84} y={43 + 58 * i} t={a} c={COL.encre} size={14.5}/><Txt x={150} y={43 + 58 * i} t="→" c={COL.gris} size={18}/><Txt x={214} y={43 + 58 * i} t={b} c={col} size={16} w={800}/><Txt x={330} y={43 + 58 * i} t={c} c={COL.gris} size={13.5} w={600}/></g>)}
    </Fond>);
}
export function SvgFrott() {
  return (
    <Fond h={214} label="Schéma : avec frottement, la variation d'énergie mécanique est égale au travail du frottement, qui est négatif : delta Em égale moins f fois L. L'énergie dissipée vaut m g h moins un demi m v au carré, et la force moyenne vaut cette énergie divisée par L, la longueur parcourue.">
      <rect x="20" y="12" width="360" height="40" rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="2.5"/><Txt x={200} y={38} t="ΔEm = W(f) = − f × L  (< 0)" c={COL.orange} size={16} w={800}/>
      <rect x="20" y="64" width="360" height="52" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/><Txt x={200} y={86} t="énergie dissipée" c={COL.gris} size={14} w={600}/><Txt x={200} y={107} t="= m g h − ½ m v²" c={COL.violet} size={16} w={800}/>
      <rect x="60" y="128" width="280" height="38" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2.5"/><Txt x={200} y={153} t="f = énergie dissipée ÷ L" c={COL.vert} size={16} w={800}/>
      <Txt x={200} y={192} t="L est la longueur parcourue, pas la hauteur" c={COL.encre} size={14.5}/>
    </Fond>);
}
