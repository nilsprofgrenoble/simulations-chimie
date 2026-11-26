// Schémas de la simulation 260 (distance de freinage) : scène du véhicule, graphique des énergies et cartes « À retenir ».
// Règles : police ≥ 14 dans un viewBox de 400 de large, tout le texte dans le viewBox, aucune valeur de réponse dans la scène du parcours.
const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', violet: '#6d28d9', ciel: '#dbeafe', route: '#e7e5e4' };
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

// ═════════ Scène : le véhicule sur sa route (freinage vers la droite) ═════════
// u : avancée du véhicule (0 = début du freinage, 1 = arrêt) ; p : pente de la route (sin α, > 0 : montée) ; v : 0..1, longueur de la flèche de vitesse ; cote : texte de la distance parcourue ; force : tracer la force de freinage
export function SceneFreinage({ u = 0, p = 0, v = 1, cote = null, force = true, poids = false }) {
  const ang = Math.max(-16, Math.min(16, p * 160)), X0 = 70, X1 = 330, cx = X0 + (X1 - X0) * u, Y = 140;
  return (
    <Fond h={216} label={`Schéma : un véhicule freine sur une route${p > 0 ? ' qui monte' : p < 0 ? ' qui descend' : ' horizontale'}, de gauche à droite. La force de freinage est opposée au déplacement${poids ? ' ; le poids est vertical vers le bas' : ''}.`}>
      <g transform={`rotate(${-ang} 200 ${Y})`}>
        <rect x="20" y={Y} width="360" height="26" fill={COL.route}/><line x1="20" y1={Y} x2="380" y2={Y} stroke={COL.gris} strokeWidth="3"/>
        <line x1={X0} y1={Y + 2} x2={X0} y2={Y + 20} stroke={COL.gris} strokeWidth="3"/>
        {cote && u > 0.02 && <g><line x1={X0} y1={Y + 34} x2={cx} y2={Y + 34} stroke={COL.gris} strokeWidth="2"/><line x1={cx} y1={Y + 28} x2={cx} y2={Y + 40} stroke={COL.gris} strokeWidth="2"/><line x1={X0} y1={Y + 28} x2={X0} y2={Y + 40} stroke={COL.gris} strokeWidth="2"/></g>}
        <g transform={`translate(${cx},${Y})`}>
          <rect x="-26" y="-34" width="52" height="22" rx="6" fill={COL.ciel} stroke={COL.bleu} strokeWidth="3"/><rect x="-10" y="-46" width="26" height="14" rx="4" fill={COL.ciel} stroke={COL.bleu} strokeWidth="3"/>
          <circle cx="-14" cy="-8" r="7" fill="white" stroke={COL.encre} strokeWidth="3"/><circle cx="14" cy="-8" r="7" fill="white" stroke={COL.encre} strokeWidth="3"/>
          {force && <g><Fleche x1={-30} y1={-23} x2={-66} y2={-23} c={COL.orange} w={3.5}/></g>}
          {v > 0.02 && <Fleche x1={30} y1={-23} x2={30 + 44 * v} y2={-23} c={COL.vert} w={3.5}/>}
        </g>
      </g>
      {force && <Txt x={cx - 64} y={Y - 56} t="F" c={COL.orange} size={16}/>}
      {v > 0.02 && <Txt x={cx + 36 + 44 * v} y={Y - 56} t="v" c={COL.vert} size={16} anchor="end"/>}
      {poids && <g><Fleche x1={cx} y1={34} x2={cx} y2={72} c={COL.rouge} w={3.5}/><Txt x={cx + 10} y={64} t="P" c={COL.rouge} size={15} anchor="start"/></g>}
      <Txt x={X0} y={206} t="début du freinage" c={COL.gris} size={14} w={600} anchor="start"/>
      {cote && u > 0.02 && <Txt x={(X0 + cx) / 2 + 40} y={30} t={cote} c={COL.gris} size={15}/>}
    </Fond>);
}

// ═════════ Graphique : Ec et travaux en fonction de la distance parcourue ═════════
export function GrapheFreinage({ pr, u = null }) {
  const Ec0 = pr.pts[0].Ec / 1000, WP0 = pr.pts.at(-1).WP / 1000, avecP = Math.abs(WP0) > 1e-6, d = pr.d;
  const hi = Ec0 * 1.12, lo = -Ec0 * 1.12 - Math.max(0, -WP0) * 0, X0 = 56, X1 = 386, Y0 = 14, Y1 = 150;
  const X = x => X0 + (X1 - X0) * x / d, Y = e => Y0 + (Y1 - Y0) * (hi - e) / (hi - lo), poly = f => pr.pts.map(q => `${X(q.x).toFixed(1)},${Y(f(q) / 1000).toFixed(1)}`).join(' ');
  const k = u == null ? null : Math.round(u * (pr.pts.length - 1)), q = k == null ? null : pr.pts[k];
  return (
    <svg viewBox="0 0 400 200" style={base} role="img" aria-label="Graphique : énergie cinétique du véhicule et travaux de la force de freinage et du poids en fonction de la distance parcourue pendant le freinage.">
      <line x1={X0} y1={Y(0)} x2={X1} y2={Y(0)} stroke="#94a3b8" strokeWidth="1.5"/><line x1={X0} y1={Y0 - 4} x2={X0} y2={Y1 + 2} stroke="#94a3b8" strokeWidth="1.5"/>
      <text x={X0 - 5} y={Y(Ec0) + 5} textAnchor="end" fontSize="13.5" fill={COL.gris}>{fr(Ec0, Ec0 < 10 ? 1 : 0)}</text><text x={X0 - 5} y={Y(0) + 5} textAnchor="end" fontSize="13.5" fill={COL.gris}>0</text><text x={X0 - 5} y={Y(-Ec0) + 5} textAnchor="end" fontSize="13.5" fill={COL.gris}>{('−' + fr(Ec0, Ec0 < 10 ? 1 : 0))}</text>
      <text x="8" y="12" fontSize="13.5" fontWeight="700" fill={COL.gris}>kJ</text>
      <text x={X0} y="172" textAnchor="middle" fontSize="13.5" fill={COL.gris}>0</text><text x={X1} y="172" textAnchor="end" fontSize="13.5" fill={COL.gris}>{fr(d, d < 10 ? 1 : 0)} m</text><text x={(X0 + X1) / 2} y="192" textAnchor="middle" fontSize="13.5" fontWeight="600" fill={COL.gris}>distance parcourue depuis le début du freinage</text>
      <polyline points={poly(z => z.Ec)} fill="none" stroke={COL.bleu} strokeWidth="3.5"/>
      <polyline points={poly(z => z.WF)} fill="none" stroke={COL.orange} strokeWidth="3.5"/>
      {avecP && <polyline points={poly(z => z.WP)} fill="none" stroke={COL.vert} strokeWidth="3.5"/>}
      {q && <g><circle cx={X(q.x)} cy={Y(q.Ec / 1000)} r="5.5" fill={COL.bleu} stroke="white" strokeWidth="2"/><circle cx={X(q.x)} cy={Y(q.WF / 1000)} r="5.5" fill={COL.orange} stroke="white" strokeWidth="2"/>{avecP && <circle cx={X(q.x)} cy={Y(q.WP / 1000)} r="5.5" fill={COL.vert} stroke="white" strokeWidth="2"/>}</g>}
      <text x={X0 + 8} y={Y1 - 6} fontSize="14" fontWeight="700" fill={COL.bleu}>Ec</text><text x={X0 + 40} y={Y1 - 6} fontSize="14" fontWeight="700" fill={COL.orange}>W(F)</text>{avecP && <text x={X0 + 92} y={Y1 - 6} fontSize="14" fontWeight="700" fill={COL.vert}>W(P)</text>}
    </svg>);
}

// ═════════ Cartes « À retenir » ═════════
export function SvgTheoreme() {
  return (
    <Fond h={218} label="Schéma : pour un véhicule qui freine jusqu'à l'arrêt, le théorème de l'énergie cinétique donne 0 moins un demi m v au carré égale moins F fois d, donc d vaut un demi m v au carré divisé par F. Exemple : 1,0 tonne à 10 mètres par seconde freinée par 5,0 kilonewtons s'arrête en 10 mètres.">
      <rect x="20" y="12" width="360" height="40" rx="10" fill="#f0f9ff" stroke={COL.bleu} strokeWidth="2.5"/><Txt x={200} y={38} t="ΔEc = somme des travaux" c={COL.bleu} size={16} w={800}/>
      <rect x="20" y="62" width="360" height="62" rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="2.5"/>
      <Txt x={200} y={88} t="0 − ½ m v² = − F × d" c={COL.orange} size={16} w={800}/><Txt x={200} y={112} t="(seule la force de freinage travaille)" c={COL.gris} size={14} w={600}/>
      <rect x="60" y="134" width="280" height="38" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/><Txt x={200} y={159} t="d = ½ m v² ÷ F" c={COL.violet} size={17} w={800}/>
      <Txt x={200} y={196} t="ex. : 1,0 t à 10 m/s, F = 5,0 kN → d = 10 m" c={COL.encre} size={14.5}/>
    </Fond>);
}
export function SvgProportion() {
  const L = [['vitesse × 2', 'd × 4', 'carré de v', COL.rouge], ['masse × 2', 'd × 2', 'proportionnel à m', COL.bleu], ['force ÷ 2', 'd × 2', 'inverse de F', COL.orange]];
  return (
    <Fond h={206} label="Schéma : la distance d'arrêt est proportionnelle au carré de la vitesse, proportionnelle à la masse et inversement proportionnelle à la force de freinage. Vitesse doublée : distance multipliée par 4 ; masse doublée : par 2 ; force divisée par 2 : par 2.">
      {L.map(([a, b, c, col], i) => <g key={a}><rect x="14" y={12 + 58 * i} width="372" height="50" rx="10" fill="white" stroke={col} strokeWidth="2.5"/>
        <Txt x={84} y={43 + 58 * i} t={a} c={COL.encre} size={15.5}/><Txt x={160} y={43 + 58 * i} t="→" c={COL.gris} size={18}/><Txt x={196} y={43 + 58 * i} t={b} c={col} size={17} w={800}/><Txt x={304} y={43 + 58 * i} t={c} c={COL.gris} size={13.5} w={600}/></g>)}
    </Fond>);
}
export function SvgPente() {
  return (
    <Fond h={214} label="Schéma : en montée le poids s'ajoute au freinage et la distance d'arrêt diminue ; en descente le poids s'oppose au freinage et la distance augmente. La distance vaut un demi m v au carré divisé par F plus m g sinus alpha, avec sinus alpha positif en montée et négatif en descente.">
      <rect x="20" y="12" width="360" height="40" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/><Txt x={200} y={38} t="d = ½ m v² ÷ (F + m g sin α)" c={COL.violet} size={16} w={800}/>
      <rect x="20" y="64" width="174" height="92" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2.5"/><Txt x={107} y={90} t="montée" c={COL.vert} size={16} w={800}/><Txt x={107} y={114} t="sin α > 0" c={COL.gris} size={14} w={600}/><Txt x={107} y={138} t="le poids freine : d ↓" c={COL.encre} size={14.5}/>
      <rect x="206" y="64" width="174" height="92" rx="10" fill="#fef2f2" stroke={COL.rouge} strokeWidth="2.5"/><Txt x={293} y={90} t="descente" c={COL.rouge} size={16} w={800}/><Txt x={293} y={114} t="sin α < 0" c={COL.gris} size={14} w={600}/><Txt x={293} y={138} t="le poids pousse : d ↑" c={COL.encre} size={14.5}/>
      <Txt x={200} y={186} t="le poids a un travail, plus seulement F" c={COL.encre} size={14.5}/><Txt x={200} y={206} t="W(P) = − m g sin α × d" c={COL.gris} size={14} w={600}/>
    </Fond>);
}
