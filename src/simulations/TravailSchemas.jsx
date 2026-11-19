// Schémas des cartes « À retenir » de la simulation 106 (travail d'une force). viewBox de 300, texte de 12,5.
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
// lettre-vecteur : lettre et flèche au-dessus
const TV = ({ x, y, children, c = ENCRE, s = 12.5, w = 700 }) => {
  const l = s * 0.6, yy = y - s * 0.92;
  return <g><text x={x} y={y} fontSize={s} fontWeight={w} fill={c}>{children}</text>
    <line x1={x} y1={yy} x2={x + l} y2={yy} stroke={c} strokeWidth="1.5"/><polyline points={`${x + l - 3.2},${yy - 2.6} ${x + l},${yy} ${x + l - 3.2},${yy + 2.6}`} fill="none" stroke={c} strokeWidth="1.5"/></g>;
};
// ligne mêlant texte, lettres-vecteurs {v} et indices {s}
const TL = ({ x, y, segs, c = ENCRE, w = 700, s = 12.5 }) => { let cur = x;
  return <g>{segs.map((g, i) => { const px = cur;
    if (typeof g === 'string') { cur += g.length * s * 0.56; return <text key={i} x={px} y={y} fontSize={s} fontWeight={w} fill={c} xmlSpace="preserve" style={{ whiteSpace: 'pre' }}>{g}</text>; }
    if (g.s) { cur += g.s.length * s * 0.5; return <text key={i} x={px} y={y + 3} fontSize="10.5" fontWeight={w} fill={c}>{g.s}</text>; }
    cur += s * 0.68; return <TV key={i} x={px} y={y} s={s} w={w} c={g.c || c}>{g.v}</TV>; })}</g>; };
// W(vecteur) : travail d'une force, mise en page à largeur fixe (33 px)
const WV = ({ x, y, v, c = ENCRE, w = 700 }) => <g><text x={x} y={y} fontSize="12.5" fontWeight={w} fill={c}>W(</text><TV x={x + 17} y={y} c={c} w={w}>{v}</TV><text x={x + 27} y={y} fontSize="12.5" fontWeight={w} fill={c}>)</text></g>;
const Chariot = ({ x, y, w = 46 }) => <rect x={x} y={y} width={w} height="22" rx="3" fill="#fde68a" stroke={ENCRE} strokeWidth="2"/>;

export const SEc = () => (
  <Svg h={158} aria="Deux chariots : le premier roule à la vitesse v, le second à la vitesse 2v ; la barre d'énergie cinétique du second est quatre fois plus longue">
    <TE x={150} y={18} a="middle" w={800} parts={['v × 2  ⇒  E', '_c', ' × 4']}/>
    <Lg x1={10} y1={96} x2={290} y2={96} c={GRIS} w={2}/>
    <Chariot x={14} y={70}/><Chariot x={166} y={70}/>
    <Fleche x1={18} y1={56} x2={52} y2={56} c={VERT}/><TV x={60} y={60} c={VERT}>v</TV>
    <Fleche x1={170} y1={56} x2={232} y2={56} c={VERT}/><T x={240} y={60} c={VERT} w={800}>2</T><TV x={250} y={60} c={VERT}>v</TV>
    <rect x="14" y="110" width="20" height="16" fill={BLEU}/><TE x={42} y={123} c={BLEU} w={800} parts={['E', '_c']}/>
    <rect x="166" y="110" width="80" height="16" fill={BLEU} opacity="0.85"/><TE x={254} y={123} c={BLEU} w={800} parts={['4 E', '_c']}/>
    <T x={150} y={150} a="middle" c={GRIS}>l’énergie dépend du carré de la vitesse</T>
  </Svg>);

export const SMoteur = () => (
  <Svg h={156} aria="Un chariot est poussé par une force dans le sens du déplacement de A vers B : le travail est positif et l'énergie cinétique augmente">
    <TV x={42} y={18}>F</TV><T x={54} y={18} w={700}>dans le sens du mouvement</T>
    <Lg x1={10} y1={102} x2={290} y2={102} c={GRIS} w={2}/>
    <Chariot x={12} y={76}/><Chariot x={226} y={76}/>
    <Fleche x1={16} y1={66} x2={56} y2={66} c={ROUGE}/><TV x={62} y={70} c={ROUGE}>F</TV>
    <Fleche x1={230} y1={66} x2={270} y2={66} c={ROUGE}/>
    <Fleche x1={16} y1={50} x2={38} y2={50} c={VERT}/><TV x={44} y={54} c={VERT}>v</TV>
    <Fleche x1={230} y1={50} x2={286} y2={50} c={VERT}/>
    <T x={35} y={122} a="middle" w={800}>A</T><T x={249} y={122} a="middle" w={800}>B</T>
    <Fleche x1={80} y1={118} x2={210} y2={118} c={GRIS} w={2}/>
    <TE x={150} y={148} a="middle" c={VERT} w={800} parts={['W > 0  ⇒  E', '_c', ' augmente']}/>
  </Svg>);

export const SAngle = () => (
  <Svg h={164} aria="Trois cas : force dans le sens du déplacement, perpendiculaire, ou opposée ; le travail est positif, nul ou négatif">
    {[[0, 0, VERT, 'θ = 0°', 'W > 0', 'moteur'], [100, 90, GRIS, 'θ = 90°', 'W = 0', 'nul'], [200, 180, ROUGE, 'θ = 180°', 'W < 0', 'résistant']].map(([x0, th, c, a, w, n]) => {
      const r = th * Math.PI / 180, fx = 34 * Math.cos(r), fy = -34 * Math.sin(r), cx = x0 + 50;
      return <g key={n}>
        <T x={cx} y={20} a="middle" c={c} w={800}>{a}</T>
        <Lg x1={x0 + 8} y1={104} x2={x0 + 92} y2={104} c={GRIS} w={2}/><Chariot x={x0 + 26} y={80} w={48}/>
        <Fleche x1={cx} y1={74} x2={cx + fx} y2={74 + fy} c={c}/>
        <TV x={th === 90 ? cx + 8 : cx + fx / 2 - 3} y={th === 90 ? 52 : 62} c={c}>F</TV>
        <Fleche x1={x0 + 26} y1={118} x2={x0 + 74} y2={118} c={BLEU} w={2}/>
        <T x={cx} y={142} a="middle" c={c} w={800}>{w}</T><T x={cx} y={158} a="middle" c={c}>{n}</T></g>; })}
  </Svg>);

export const SPoids = () => (
  <Svg h={182} aria="Deux trajets différents entre E et F, l'un droit, l'autre courbe : le travail du poids est le même car la différence d'altitude est la même">
    <Lg x1={20} y1={36} x2={290} y2={36} c="#94a3b8" w={1.6} d="4 4"/><Lg x1={20} y1={112} x2={290} y2={112} c="#94a3b8" w={1.6} d="4 4"/>
    <path d="M40,36 C40,104 120,118 240,112" fill="none" stroke={ROUGE} strokeWidth="3"/><Lg x1={40} y1={36} x2={240} y2={112} c={BLEU} w={3}/>
    <circle cx="40" cy="36" r="7" fill={ORANGE}/><circle cx="240" cy="112" r="7" fill={ORANGE}/>
    <T x={26} y={28} a="end" c={ORANGE} w={800}>E</T><T x={240} y={134} a="middle" c={ORANGE} w={800}>F</T>
    <Fleche x1={272} y1={36} x2={272} y2={112} c={ENCRE} w={2}/><TE x={264} y={80} a="end" parts={['z', '_E', ' − z', '_F']}/>
    <WV x={14} y={156} v="P"/><T x={52} y={156} w={700}>identique pour les deux trajets</T>
    <TE x={14} y={172} c={GRIS} parts={['seul compte : z', '_E', ' − z', '_F']}/>
  </Svg>);

export const STheoreme = () => (
  <Svg h={170} aria="Bilan : l'énergie cinétique finale est égale à l'énergie cinétique initiale plus la somme des travaux des forces, le travail du frottement étant négatif">
    <TE x={8} y={18} w={700} parts={['ΔE', '_c', ' = ΣW =']}/>
    <WV x={78} y={18} v="P"/><T x={114} y={18} w={700}>+</T><WV x={128} y={18} v="R"/><T x={164} y={18} w={700}>+</T><WV x={178} y={18} v="f"/>
    <WV x={8} y={38} v="R" c={GRIS} w={400}/><T x={44} y={38} c={GRIS}>= 0 car</T><TV x={90} y={38} c={GRIS} w={400}>R</TV><T x={102} y={38} c={GRIS}>⟂ déplacement</T>
    <Lg x1={10} y1={110} x2={290} y2={110} c={GRIS} w={1.6}/>
    <rect x="12" y="84" width="40" height="26" fill={BLEU} opacity="0.85"/><T x={62} y={104} w={800}>+</T>
    <rect x="80" y="50" width="40" height="60" fill={VERT} opacity="0.85"/><T x={130} y={104} w={800}>+</T>
    <rect x="148" y="110" width="40" height="22" fill={ROUGE} opacity="0.85"/><T x={198} y={104} w={800}>=</T>
    <rect x="228" y="44" width="40" height="66" fill={BLEU} opacity="0.85"/>
    <TE x={32} y={154} a="middle" c={BLEU} w={800} parts={['E', '_c', '(E)']}/><WV x={84} y={154} v="P" c={VERT}/>
    <WV x={152} y={154} v="f" c={ROUGE}/><TE x={248} y={154} a="middle" c={BLEU} w={800} parts={['E', '_c', '(F)']}/>
  </Svg>);

export const SFrott = () => (
  <Svg h={162} aria="Frottement : la force est opposée au déplacement, son travail est négatif et vaut moins f fois la longueur parcourue">
    <WV x={14} y={18} v="f"/><T x={52} y={18} w={700}>= − f × L</T><T x={14} y={36} c={GRIS}>f constante, trajet rectiligne</T>
    <Lg x1={10} y1={100} x2={290} y2={100} c={GRIS} w={2}/><Chariot x={120} y={74} w={60}/>
    <Fleche x1={188} y1={60} x2={252} y2={60} c={VERT}/><T x={190} y={52} c={VERT} w={800}>mouvement</T>
    <Fleche x1={114} y1={84} x2={60} y2={84} c={ORANGE}/><TV x={34} y={88} c={ORANGE}>f</TV>
    <T x={14} y={130} c={ORANGE} w={800}>Idée fausse : « il ne travaille pas »</T>
    <T x={14} y={150} c={VERT} w={800}>Vrai : il retire de l’énergie cinétique</T>
  </Svg>);
