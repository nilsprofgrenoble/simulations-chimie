// Schémas des cartes « À retenir » de la simulation 42 (diagramme binaire isobare). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#2563eb', ROUGE = '#dc2626', ORANGE = '#c2410c', VERT = '#15803d', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const I = ({ b, i }) => <>{b}<tspan fontSize="9.5" dy="3">{i}</tspan><tspan dy="-3">{' '}</tspan></>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const Lg = ({ x1, y1, x2, y2, c = ENCRE, w = 2, d }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={d}/>;
const courbes = (x0, x1, y0, h, f, g) => {
  const b = [], r = []; for (let k = 0; k <= 20; k++) { const t = k / 20, x = x0 + t * (x1 - x0); b.push(`${x},${y0 + h * f(t)}`); r.push(`${x},${y0 + h * g(t)}`); }
  return [b.join(' '), r.join(' ')];
};
const fb = t => Math.pow(t, 0.76), fr = t => 1 - Math.pow(1 - t, 0.76);

export const FPurMel = () => (
  <Svg h={180} aria="Analyse thermique : pour un corps pur, la température reste constante pendant toute l'ébullition, c'est un palier ; pour un mélange, la température augmente pendant que le liquide bout, de la première bulle à la dernière goutte">
    {[0, 1].map(k => <g key={k}><Lg x1={30 + k * 150} y1={118} x2={140 + k * 150} y2={118} c={GRIS} w={1.5}/><Lg x1={30 + k * 150} y1={118} x2={30 + k * 150} y2={26} c={GRIS} w={1.5}/>
      <T x={36 + k * 150} y={26} c={GRIS}>T</T><T x={140 + k * 150} y={134} a="end" c={GRIS}>temps</T></g>)}
    <polyline points="30,108 50,84 64,60 112,60 126,36 140,30" fill="none" stroke={GRIS} strokeWidth="3" strokeLinejoin="round" strokeDasharray="1 0"/>
    <polyline points="180,108 200,86 214,76 262,44 276,34 290,30" fill="none" stroke="#7b2d8e" strokeWidth="3" strokeLinejoin="round"/>
    <T x={88} y={52} a="middle" c={VERT} w={800}>palier</T><T x={250} y={90} a="middle" c="#7b2d8e" w={800}>pente</T>
    <T x={80} y={154} a="middle" w={700}>corps pur</T><T x={230} y={154} a="middle" w={700}>mélange</T>
    <T x={150} y={172} a="middle" c={GRIS}>température constante ou non ?</T>
  </Svg>);

export const FDiagramme = () => {
  const [b, r] = courbes(44, 276, 30, 96, fb, fr);
  return (
    <Svg h={222} aria="Diagramme binaire isobare : en abscisse la fraction molaire du composé le plus volatil, en ordonnée la température ; la courbe de rosée rouge est au-dessus de la courbe d'ébullition bleue ; trois domaines : liquide en bas, liquide et vapeur entre les courbes, vapeur en haut">
      <Lg x1={44} y1={140} x2={286} y2={140} c={GRIS} w={1.6}/><Lg x1={44} y1={140} x2={44} y2={14} c={GRIS} w={1.6}/>
      <T x={50} y={20} c={GRIS}>T</T><T x={286} y={158} a="end" c={GRIS}>x (composé volatil)</T>
      <polyline points={b} fill="none" stroke={BLEU} strokeWidth="3"/><polyline points={r} fill="none" stroke={ROUGE} strokeWidth="3"/>
      <T x={92} y={116} a="middle" c={BLEU} w={800}>liquide</T><T x={226} y={52} a="middle" c={ROUGE} w={800}>vapeur</T>
      <Lg x1={14} y1={176} x2={34} y2={176} c={BLEU} w={3}/><T x={40} y={180} c={BLEU} w={700}>ébullition : 1ère bulle</T>
      <Lg x1={14} y1={192} x2={34} y2={192} c={ROUGE} w={3}/><T x={40} y={196} c={ROUGE} w={700}>rosée : dernière goutte</T>
      <T x={14} y={216} c={GRIS} w={700}>entre les deux : liquide + vapeur</T>
    </Svg>);
};

export const FHorizontale = () => {
  const [b, r] = courbes(44, 276, 30, 96, fb, fr);
  const y = 82;
  const xb = t0 => 44 + 232 * t0;
  return (
    <Svg h={192} aria="Lecture dans le fuseau : à une température donnée, on lit à l'horizontale ; le liquide se lit sur la courbe d'ébullition, la vapeur sur la courbe de rosée ; la vapeur est plus riche en composé volatil que le liquide ; la fraction de vapeur vaut z moins x L, divisé par y V moins x L">
      <Lg x1={44} y1={140} x2={286} y2={140} c={GRIS} w={1.6}/><Lg x1={44} y1={140} x2={44} y2={14} c={GRIS} w={1.6}/>
      <polyline points={b} fill="none" stroke={BLEU} strokeWidth="2.6"/><polyline points={r} fill="none" stroke={ROUGE} strokeWidth="2.6"/>
      <Lg x1={44} y1={y} x2={276} y2={y} c={GRIS} w={1.4} d="5 4"/><T x={40} y={y + 4} a="end" c={GRIS}>T</T>
      {[[xb(0.44), BLEU, 'xL'], [xb(0.54), ORANGE, 'z'], [xb(0.64), ROUGE, 'yV']].map(([px, c, t]) => <g key={t}><Lg x1={px} y1={y} x2={px} y2={140} c={c} w={1.4} d="3 3"/><circle cx={px} cy={y} r="4.5" fill={c}/>
        <T x={px} y={158} a="middle" c={c} w={800}>{t === 'xL' ? <I b="x" i="L"/> : t === 'yV' ? <I b="y" i="V"/> : 'z'}</T></g>)}
      <T x={150} y={182} a="middle" c={VERT} w={700}>vapeur plus riche en volatil que le liquide</T>
    </Svg>);
};

export const FMassiqueDB = () => (
  <Svg h={174} aria="Fraction molaire et fraction massique : pour une vapeur avec 0,50 mole d'éthanol et 0,50 mole d'eau, il y a 23 grammes d'éthanol et 9 grammes d'eau ; la fraction massique de l'éthanol vaut 23 sur 32, environ 0,72, plus grande que la fraction molaire car l'éthanol est plus lourd que l'eau">
    <T x={150} y={14} a="middle" c={GRIS}>exemple : y = 0,50</T>
    <T x={12} y={42} w={700}>en moles</T><rect x="96" y="26" width="95" height="24" fill="#1d4ed8" fillOpacity="0.85"/><rect x="191" y="26" width="95" height="24" fill="#93c5fd"/>
    <T x={143} y={43} a="middle" c="#fff" w={700}>0,50 éthanol</T><T x={238} y={43} a="middle" c={ENCRE} w={700}>0,50 eau</T>
    <T x={12} y={92} w={700}>en masse</T><rect x="96" y="76" width="136" height="24" fill="#1d4ed8" fillOpacity="0.85"/><rect x="232" y="76" width="54" height="24" fill="#93c5fd"/>
    <T x={164} y={93} a="middle" c="#fff" w={700}>23 g</T><T x={259} y={93} a="middle" c={ENCRE} w={700}>9 g</T>
    <T x={150} y={128} a="middle" c={ORANGE} w={800}>w = 23 ÷ 32 ≈ 0,72</T>
    <T x={150} y={150} a="middle" c={GRIS}>éthanol (46 g/mol) plus lourd que l’eau</T><T x={150} y={165} a="middle" c={GRIS}>(18 g/mol) : w &gt; y</T>
  </Svg>);

export const FAzeo = () => {
  const mini = (x0, base0, sens, kind) => { const pts = []; for (let k = 0; k <= 24; k++) { const t = k / 24, u = (t - 0.5) * 2, g = 44 * u * u * (1 - u * u), base = base0 + sens * 40 * u * u; pts.push(`${x0 + t * 110},${base + kind * g}`); } return pts.join(' '); };
  return (
    <Svg h={196} aria="Azéotrope : la courbe d'ébullition bleue et la courbe de rosée rouge se touchent ; à minimum de température pour eau et éthanol, il bout plus bas que les deux corps purs ; à maximum de température pour chloroforme et acétone, il bout plus haut ; à la composition de l'azéotrope, la vapeur a la même composition que le liquide et la température reste constante comme pour un corps pur">
      <T x={75} y={16} a="middle" c={BLEU} w={800}>à minimum</T><T x={225} y={16} a="middle" c={ORANGE} w={800}>à maximum</T>
      <Lg x1={18} y1={100} x2={132} y2={100} c={GRIS} w={1.4}/><Lg x1={168} y1={100} x2={282} y2={100} c={GRIS} w={1.4}/>
      <polyline points={mini(20, 74, -1, 1)} fill="none" stroke={BLEU} strokeWidth="2.8"/><polyline points={mini(20, 74, -1, -1)} fill="none" stroke={ROUGE} strokeWidth="2.8"/>
      <polyline points={mini(170, 34, 1, 1)} fill="none" stroke={BLEU} strokeWidth="2.8"/><polyline points={mini(170, 34, 1, -1)} fill="none" stroke={ROUGE} strokeWidth="2.8"/>
      <circle cx={75} cy={74} r="4.5" fill={ORANGE}/><circle cx={225} cy={34} r="4.5" fill={ORANGE}/>
      <T x={75} y={120} a="middle" c={GRIS}>eau – éthanol</T><T x={225} y={120} a="middle" c={GRIS}>chloroforme – acétone</T>
      <T x={75} y={137} a="middle" c={GRIS}>T plus basse</T><T x={225} y={137} a="middle" c={GRIS}>T plus haute</T>
      <T x={150} y={166} a="middle" c={VERT} w={700}>y = x : même composition, T constante</T>
      <T x={150} y={186} a="middle" c={GRIS}>comme un corps pur : pas de séparation</T>
    </Svg>);
};

export const FBilanDB = () => (
  <Svg h={180} aria="Bilan : repérer les courbes et les trois domaines, placer le point z et T, lire à l'horizontale dans le fuseau, convertir si besoin la fraction molaire en fraction massique">
    {[['repérer courbes et domaines', BLEU], ['placer le point (z ; T)', BLEU], ['lire à l’horizontale dans le fuseau', ORANGE], ['convertir : molaire → massique', VERT]].map(([t, c], i) => (
      <g key={i}><circle cx="16" cy={20 + i * 32} r="11" fill={c}/><T x={16} y={24.5 + i * 32} a="middle" c="#fff" w={800}>{i + 1}</T><T x={36} y={25 + i * 32} w={600}>{t}</T>
        {i < 3 && <Lg x1={16} y1={32 + i * 32} x2={16} y2={40 + i * 32} c={GRIS}/>}</g>))}
    <T x={150} y={156} a="middle" c={GRIS}>fuseau : <I b="x" i="L"/> sur l’ébullition, <I b="y" i="V"/> sur la rosée</T>
    <T x={150} y={174} a="middle" c={GRIS}>la vapeur est plus riche en volatil</T>
  </Svg>);
