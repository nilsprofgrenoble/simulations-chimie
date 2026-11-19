// Schémas des cartes « À retenir » de la simulation 32 (bouilloire et conductivité thermique). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const TE = ({ x, y, parts, a = 'start', c = ENCRE, w = 400 }) => (
  <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>
    {parts.map((p, i) => p[0] === '_'
      ? <tspan key={i} fontSize="9.5" dy="3">{p.slice(1)}</tspan>
      : <tspan key={i} dy={i && parts[i - 1][0] === '_' ? -3 : 0}>{p}</tspan>)}
  </text>);
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const Fleche = ({ x1, y1, x2, y2, c = GRIS, w = 2.6 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  return (<g><line x1={x1} y1={y1} x2={x2 - ux * 7} y2={y2 - uy * 7} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - ux * 10 - uy * 5},${y2 - uy * 10 + ux * 5} ${x2 - ux * 10 + uy * 5},${y2 - uy * 10 - ux * 5}`} fill={c}/></g>);
};
const BR = '#fed7aa';

export const FDeuxDT = () => (
  <Svg h={194} aria="Deux écarts de température à ne pas confondre : la petite baisse de température de l'eau sert à calculer l'énergie Q, le grand écart entre l'eau et l'air sert pour la paroi">
    <T x={150} y={16} a="middle" w={800}>Deux écarts, deux usages</T>
    <T x={14} y={44} w={800} c={ORANGE}>baisse de la température de l’eau</T>
    <rect x="14" y="52" width="12" height="16" fill={ORANGE}/><T x={14} y={90} w={800}>petite : sert à calculer Q</T>
    <T x={14} y={118} w={800} c={BLEU}>écart entre l’eau et l’air</T>
    <rect x="14" y="126" width="270" height="16" fill={BLEU}/><T x={14} y={164} w={800}>grand : sert pour la paroi (φ, λ)</T>
    <T x={150} y={182} a="middle" c={ROUGE} w={800}>ne pas les confondre</T>
  </Svg>);

export const FEnergiePuissance = () => (
  <Svg h={176} aria="De l'énergie perdue en joules à la puissance en watts : l'énergie perdue divisée par la durée donne la puissance ; exemple : 20 000 joules en 100 secondes font 200 watts">
    <TE x={150} y={16} a="middle" w={800} parts={['φ = |Q| ÷ Δt']}/>
    <rect x="8" y="30" width="76" height="46" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.8"/><T x={46} y={50} a="middle" w={800}>|Q|</T><T x={46} y={68} a="middle" c={GRIS}>20 000 J</T>
    <T x={96} y={58} a="middle" w={800} c={ORANGE}>÷</T>
    <rect x="108" y="30" width="76" height="46" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.8"/><T x={146} y={50} a="middle" w={800}>Δt</T><T x={146} y={68} a="middle" c={GRIS}>100 s</T>
    <T x={196} y={58} a="middle" w={800} c={ORANGE}>=</T>
    <rect x="208" y="30" width="76" height="46" rx="6" fill="#ffedd5" stroke={ORANGE} strokeWidth="2"/><T x={246} y={50} a="middle" w={800} c={ORANGE}>φ</T><T x={246} y={68} a="middle" c={ORANGE} w={800}>200 W</T>
    <TE x={150} y={108} a="middle" w={800} parts={['|Q| = m × C × |ΔT|']}/><T x={150} y={126} a="middle" c={GRIS}>en joules (pas en kJ)</T>
    <T x={150} y={148} a="middle" c={GRIS}>Δt en secondes ; φ en W = J·s⁻¹</T>
    <T x={150} y={170} a="middle" c={VERT} w={800}>φ = énergie perdue par seconde</T>
  </Svg>);

export const FSurface = () => (
  <Svg h={182} aria="Paroi latérale d'un cylindre : une fois déroulée, c'est un rectangle de longueur la circonférence c et de largeur la hauteur h, donc la surface est c fois h ; exemple 30 centimètres par 10 centimètres, soit 0,030 mètre carré">
    <T x={150} y={16} a="middle" w={800}>Cylindre déroulé = rectangle</T>
    <ellipse cx="58" cy="50" rx="34" ry="9" fill={BR} stroke={ENCRE} strokeWidth="2"/><path d="M24,50 L24,104 A34,9 0 0 0 92,104 L92,50" fill={BR} stroke={ENCRE} strokeWidth="2"/><ellipse cx="58" cy="50" rx="34" ry="9" fill="#ffedd5" stroke={ENCRE} strokeWidth="2"/>
    <Fleche x1={100} y1={78} x2={122} y2={78} c={GRIS} w={2.4}/>
    <rect x="144" y="52" width="140" height="52" fill={BR} stroke={ENCRE} strokeWidth="2"/>
    <T x={214} y={44} a="middle" w={800} c={ORANGE}>c</T><T x={136} y={82} a="end" w={800} c={ORANGE}>h</T>
    <T x={214} y={82} a="middle" c={GRIS}>S</T>
    <T x={150} y={134} a="middle" w={800}>S = c × h</T>
    <T x={150} y={154} a="middle" c={GRIS}>c = π × D : le π est déjà dans c</T>
    <T x={150} y={174} a="middle" c={GRIS}>ex. 0,30 m × 0,10 m = 0,030 m²</T>
  </Svg>);

export const FFourier = () => (
  <Svg h={206} aria="Conduction à travers une paroi d'épaisseur e et de surface S entre l'eau chaude et l'air plus froid : la puissance est la conductivité fois la surface fois l'écart de température moyen, divisé par l'épaisseur">
    <rect x="30" y="30" width="90" height="62" rx="4" fill="#fecaca" stroke={ROUGE} strokeWidth="2"/><T x={75} y={56} a="middle" w={800}>eau</T><TE x={75} y={76} a="middle" c={ROUGE} w={800} parts={['θ', '_moy']}/>
    <rect x="120" y="22" width="36" height="78" fill="#cbd5e1" stroke={ENCRE} strokeWidth="2"/><T x={138} y={15} a="middle" c={GRIS}>paroi</T>
    <rect x="156" y="30" width="90" height="62" rx="4" fill="#bfdbfe" stroke={BLEU} strokeWidth="2"/><T x={201} y={56} a="middle" w={800}>air</T><TE x={201} y={76} a="middle" c={BLEU} w={800} parts={['T', '_ext']}/>
    <Lg x1={120} y1={110} x2={156} y2={110} c={ORANGE} w={2}/><Lg x1={120} y1={105} x2={120} y2={115} c={ORANGE} w={2}/><Lg x1={156} y1={105} x2={156} y2={115} c={ORANGE} w={2}/><T x={138} y={128} a="middle" c={ORANGE} w={800}>e</T>
    <Fleche x1={40} y1={116} x2={100} y2={116} c={ORANGE} w={3}/><T x={70} y={132} a="middle" c={ORANGE} w={800}>φ</T>
    <TE x={150} y={156} a="middle" w={800} parts={['φ = λ × S × ΔT', '_m', ' ÷ e']}/>
    <TE x={150} y={176} a="middle" c={GRIS} parts={['λ = φ × e ÷ (S × ΔT', '_m', ')']}/>
    <T x={150} y={194} a="middle" c={ROUGE} w={800}>e en mètres !</T>
  </Svg>);

export const FMethode = () => {
  const L = [['Masse d’eau', ['m = m', '_plein', ' − m', '_vide']], ['Énergie perdue', ['|Q| = m × C × |ΔT|']], ['Puissance', ['φ = |Q| ÷ Δt']], ['Surface et écart', ['S = c × h ; ΔT', '_m', ' = θ', '_moy', ' − T', '_ext']], ['Conductivité', ['λ = φ × e ÷ (S × ΔT', '_m', ')']]];
  return (
    <Svg h={236} aria="Méthode en cinq étapes : masse d'eau, énergie perdue, puissance, surface et écart de température, conductivité thermique">
      {L.map(([a, b], i) => <g key={a}>
        <rect x="10" y={6 + i * 44} width="280" height="38" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
        <circle cx="30" cy={25 + i * 44} r="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/><T x={30} y={30 + i * 44} a="middle" c={ORANGE} w={800}>{i + 1}</T>
        <T x={48} y={23 + i * 44} w={800}>{a}</T><TE x={48} y={38 + i * 44} c={GRIS} parts={b}/></g>)}
    </Svg>);
};

export const FEcartTP = () => (
  <Svg h={176} aria="Pourquoi la conductivité mesurée en TP diffère de la vraie : les films d'eau et d'air font trouver une conductivité trop petite, les pertes par le couvercle et le fond la font trouver trop grande, et les erreurs se compensent en partie">
    <rect x="10" y="6" width="280" height="62" rx="6" fill="#f1f5f9" stroke={ORANGE} strokeWidth="1.8"/>
    <T x={22} y={26} w={800}>Films d’eau et d’air</T><T x={22} y={44} c={GRIS}>l’ABS ne voit qu’une part de ΔT</T><T x={22} y={62} c={ORANGE} w={800}>λ mesurée trop petite</T>
    <rect x="10" y="76" width="280" height="62" rx="6" fill="#f1f5f9" stroke={BLEU} strokeWidth="1.8"/>
    <T x={22} y={96} w={800}>Couvercle et fond</T><T x={22} y={114} c={GRIS}>une part de φ ne passe pas par la paroi</T><T x={22} y={132} c={BLEU} w={800}>λ mesurée trop grande</T>
    <T x={150} y={164} a="middle" c={VERT} w={800}>erreurs de sens opposés : elles se compensent</T>
  </Svg>);
