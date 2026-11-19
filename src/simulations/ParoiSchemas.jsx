// Schémas des cartes « À retenir » de la simulation 31 (paroi multicouche). viewBox de 300, texte de 12,5.
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

const RB = '#e08e6b', LB = '#fcd34d', PL = '#d6d3d1';

export const FResistance = () => (
  <Svg h={218} aria="Résistance thermique d'une couche : une paroi deux fois plus épaisse a une résistance double, une paroi de surface double a une résistance moitié, un matériau de conductivité plus petite a une résistance plus grande">
    <TE x={150} y={18} a="middle" w={800} parts={['R', '_th', ' = e ÷ (λ × S)']}/>
    {[0, 1, 2].map(i => <rect key={i} x="8" y={30 + i * 56} width="284" height="50" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.4"/>)}
    <rect x="22" y="40" width="14" height="30" fill={RB} stroke={ENCRE} strokeWidth="1.6"/><Fleche x1={46} y1={55} x2={66} y2={55} c={GRIS} w={2}/><rect x="74" y="40" width="30" height="30" fill={RB} stroke={ENCRE} strokeWidth="1.6"/>
    <T x={122} y={52} w={800} c={ORANGE}>e × 2</T><TE x={122} y={69} c={GRIS} parts={['R', '_th', ' × 2']}/>
    <rect x="22" y="104" width="22" height="22" fill={RB} stroke={ENCRE} strokeWidth="1.6"/><Fleche x1={52} y1={115} x2={70} y2={115} c={GRIS} w={2}/><rect x="76" y="96" width="38" height="38" fill={RB} stroke={ENCRE} strokeWidth="1.6"/>
    <T x={128} y={108} w={800} c={ORANGE}>S × 2</T><TE x={128} y={125} c={GRIS} parts={['R', '_th', ' ÷ 2']}/>
    <rect x="22" y="152" width="26" height="34" fill={RB} stroke={ENCRE} strokeWidth="1.6"/><Fleche x1={58} y1={169} x2={78} y2={169} c={GRIS} w={2}/><rect x="86" y="152" width="26" height="34" fill={LB} stroke={ENCRE} strokeWidth="1.6"/>
    <T x={126} y={164} w={800} c={ORANGE}>λ plus petit</T><TE x={126} y={181} c={GRIS} parts={['R', '_th', ' plus grande']}/>
    <T x={150} y={210} a="middle" c={VERT} w={800}>bien isoler : λ petit, e grand</T>
  </Svg>);

export const FPuissance = () => (
  <Svg h={200} aria="Un mur de résistance thermique 0,50 kelvin par watt entre une pièce à 18 degrés et l'extérieur à 3 degrés : une flèche orange va du chaud vers le froid et la puissance est l'écart de température divisé par la résistance, soit 30 watts">
    <TE x={150} y={18} a="middle" w={800} parts={['R', '_th', ' grande : P petite']}/>
    <rect x="8" y="30" width="76" height="62" rx="4" fill="#fecaca" stroke={ROUGE} strokeWidth="2"/><T x={46} y={56} a="middle" w={800}>intérieur</T><T x={46} y={76} a="middle" c={ROUGE} w={800}>18 °C</T>
    <rect x="112" y="30" width="76" height="62" fill={RB} stroke={ENCRE} strokeWidth="2"/><TE x={150} y={66} a="middle" w={800} parts={['R', '_th', ' = 0,50']}/>
    <rect x="216" y="30" width="76" height="62" rx="4" fill="#bfdbfe" stroke={BLEU} strokeWidth="2"/><T x={254} y={56} a="middle" w={800}>extérieur</T><T x={254} y={76} a="middle" c={BLEU} w={800}>3 °C</T>
    <Fleche x1={24} y1={120} x2={276} y2={120} c={ORANGE} w={3.4}/><T x={150} y={112} a="middle" c={ORANGE} w={800}>P : du chaud vers le froid</T>
    <TE x={150} y={146} a="middle" w={800} parts={['P = ΔT ÷ R', '_th']}/>
    <T x={150} y={166} a="middle">P = (18 − 3) ÷ 0,50 = 30 W</T>
    <T x={150} y={188} a="middle" c={GRIS}>écart de température ÷ résistance</T>
  </Svg>);

export const FSerie = () => (
  <Svg h={168} aria="Trois couches traversées l'une après l'autre par la même puissance, de résistances 0,5, 1,0 et 0,3 kelvin par watt : la résistance globale est leur somme, 1,8 kelvin par watt">
    <TE x={150} y={16} a="middle" w={800} parts={['R', '_th,global', ' = R₁ + R₂ + R₃']}/>
    <T x={150} y={36} a="middle" c={ORANGE} w={800}>la même P traverse tout</T>
    <Fleche x1={14} y1={48} x2={286} y2={48} c={ORANGE} w={3}/>
    <rect x="42" y="58" width="60" height="50" fill={PL} stroke={ENCRE} strokeWidth="2"/><rect x="102" y="58" width="120" height="50" fill={LB} stroke={ENCRE} strokeWidth="2"/><rect x="222" y="58" width="36" height="50" fill={RB} stroke={ENCRE} strokeWidth="2"/>
    <T x={72} y={88} a="middle" w={800}>0,5</T><T x={162} y={88} a="middle" w={800}>1,0</T><T x={240} y={88} a="middle" w={800}>0,3</T>
    <Lg x1={42} y1={118} x2={258} y2={118} c={GRIS} w={1.8}/><Lg x1={42} y1={113} x2={42} y2={123} c={GRIS} w={1.8}/><Lg x1={258} y1={113} x2={258} y2={123} c={GRIS} w={1.8}/>
    <T x={150} y={140} a="middle" w={800}>0,5 + 1,0 + 0,3 = 1,8 K·W⁻¹</T>
    <T x={150} y={160} a="middle" c={GRIS}>couches de plus : R plus grande</T>
  </Svg>);

export const FChute = () => (
  <Svg h={162} aria="Chute de température dans trois couches de résistances 1,0, 3,0 et 1,0 traversées par 4 watts : 4, 12 et 4 degrés, soit 20 degrés au total ; la couche la plus résistante prend la plus grande part">
    <TE x={150} y={16} a="middle" w={800} parts={['ΔT', '_i', ' = R', '_i', ' × P']}/>
    <T x={150} y={34} a="middle" c={ORANGE} w={800}>P = 4 W dans chaque couche</T>
    <rect x="15" y="46" width="54" height="36" fill={PL} stroke={ENCRE} strokeWidth="2"/><rect x="69" y="46" width="162" height="36" fill={LB} stroke={ENCRE} strokeWidth="2"/><rect x="231" y="46" width="54" height="36" fill={RB} stroke={ENCRE} strokeWidth="2"/>
    <T x={42} y={69} a="middle" w={800}>4 °C</T><T x={150} y={69} a="middle" w={800}>12 °C</T><T x={258} y={69} a="middle" w={800}>4 °C</T>
    <T x={42} y={102} a="middle" c={GRIS}>R = 1,0</T><T x={150} y={102} a="middle" c={GRIS}>R = 3,0</T><T x={258} y={102} a="middle" c={GRIS}>R = 1,0</T>
    <T x={150} y={130} a="middle" w={800}>4 + 12 + 4 = 20 °C au total</T>
    <T x={150} y={152} a="middle" c={VERT} w={800}>le plus résistant prend le plus</T>
  </Svg>);

export const FOrdre = () => (
  <Svg h={186} aria="Deux murs avec les mêmes deux couches de résistances 1 et 3, dans un ordre puis dans l'autre : la puissance est 5 watts dans les deux cas, mais la température à l'interface vaut 15 degrés dans le premier cas et 5 degrés dans le second">
    <T x={150} y={16} a="middle" w={800}>Même P, autre ordre</T>
    <T x={150} y={34} a="middle" c={GRIS}>R en K·W⁻¹ ; P = 5 W dans les deux cas</T>
    <T x={40} y={54} a="middle" c={ROUGE} w={800}>20</T><T x={80} y={54} a="middle" c={ORANGE} w={800}>15</T><T x={200} y={54} a="middle" c={BLEU} w={800}>0</T>
    <rect x="40" y="60" width="40" height="30" fill={PL} stroke={ENCRE} strokeWidth="2"/><rect x="80" y="60" width="120" height="30" fill={LB} stroke={ENCRE} strokeWidth="2"/>
    <T x={60} y={80} a="middle" w={800}>1</T><T x={140} y={80} a="middle" w={800}>3</T><T x={214} y={80} w={800} c={GRIS}>°C</T>
    <T x={40} y={118} a="middle" c={ROUGE} w={800}>20</T><T x={160} y={118} a="middle" c={ORANGE} w={800}>5</T><T x={200} y={118} a="middle" c={BLEU} w={800}>0</T>
    <rect x="40" y="124" width="120" height="30" fill={LB} stroke={ENCRE} strokeWidth="2"/><rect x="160" y="124" width="40" height="30" fill={PL} stroke={ENCRE} strokeWidth="2"/>
    <T x={100} y={144} a="middle" w={800}>3</T><T x={180} y={144} a="middle" w={800}>1</T><T x={214} y={144} w={800} c={GRIS}>°C</T>
    <T x={150} y={176} a="middle" c={VERT} w={800}>seul l’interface change de T</T>
  </Svg>);

export const FBilanParoi = () => {
  const L = [['Matériau', ['λ petit : bon isolant']], ['Une couche', ['R', '_th', ' = e ÷ (λ × S)']], ['Plusieurs couches', ['R', '_th,global', ' = R₁ + R₂ + …']], ['Puissance', ['P = ΔT ÷ R', '_th,global']], ['Chute de température', ['ΔT', '_i', ' = R', '_i', ' × P']]];
  return (
    <Svg h={232} aria="Bilan : la conductivité dit si le matériau isole, la résistance d'une couche est l'épaisseur divisée par la conductivité et la surface, les résistances des couches en série s'ajoutent, la puissance est l'écart de température divisé par la résistance globale, et la chute de température dans une couche est sa résistance fois la puissance">
      {L.map(([a, b], i) => <g key={a}>
        <rect x="10" y={6 + i * 44} width="280" height="38" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
        <circle cx="30" cy={25 + i * 44} r="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/><T x={30} y={30 + i * 44} a="middle" c={ORANGE} w={800}>{i + 1}</T>
        <T x={48} y={23 + i * 44} w={800}>{a}</T><TE x={48} y={38 + i * 44} c={GRIS} parts={b}/></g>)}
    </Svg>);
};
