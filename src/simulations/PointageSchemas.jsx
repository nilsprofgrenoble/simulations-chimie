// Schémas des cartes « À retenir » de la simulation 108 (pointage d'un film). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
// parts : suite de morceaux de texte ; un morceau commençant par « _ » est mis en indice
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

export const FEchelle = () => (
  <Svg h={164} aria="Un étalon de 0,30 mètre mesure 150 pixels sur l'image : l'échelle vaut 0,0020 mètre par pixel ; pour passer des pixels aux mètres, on multiplie par l'échelle">
    <T x={150} y={18} a="middle" w={800}>Du pixel au mètre</T>
    <Lg x1={30} y1={66} x2={270} y2={66} c={ORANGE} w={5}/><Lg x1={30} y1={54} x2={30} y2={78} c={ORANGE} w={3}/><Lg x1={270} y1={54} x2={270} y2={78} c={ORANGE} w={3}/>
    <T x={150} y={46} a="middle" c={ORANGE} w={800}>étalon : 150 px = 0,30 m</T>
    <T x={150} y={108} a="middle" w={800}>échelle = 0,30 m ÷ 150 px</T><T x={150} y={128} a="middle" w={800} c={BLEU}>= 0,0020 m par pixel</T>
    <T x={150} y={154} a="middle" c={GRIS}>mètres = pixels × échelle</T>
  </Svg>);

export const FVitesse = () => (
  <Svg h={170} aria="Trois positions successives M(i−1), M(i) et M(i+1) de la bille sur sa trajectoire ; la vitesse en M(i) est la distance M(i−1)M(i+1) divisée par deux fois la durée tau entre deux images">
    <path d="M30,120 Q150,20 270,120" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4"/>
    <Lg x1={90} y1={82.5} x2={210} y2={82.5} c={BLEU} w={3}/>
    {[[90, 82.5], [150, 70], [210, 82.5]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r="7" fill={k === 1 ? ORANGE : '#fde68a'} stroke={ENCRE} strokeWidth="2"/>)}
    <Fleche x1={160} y1={70} x2={206} y2={70} c={ORANGE} w={2.6}/>
    <T x={150} y={48} a="middle" c={ORANGE} w={800}>M(i)</T>
    <T x={90} y={106} a="middle" w={800}>M(i−1)</T><T x={210} y={106} a="middle" w={800}>M(i+1)</T>
    <T x={150} y={132} a="middle" c={GRIS}>deux intervalles : durée 2τ</T>
    <T x={150} y={158} a="middle" w={800} c={BLEU}>v ≈ M(i−1)M(i+1) ÷ 2τ</T>
    <T x={226} y={62} c={ORANGE} w={800}>v</T><Fleche x1={224} y1={51} x2={236} y2={51} c={ORANGE} w={2}/>
  </Svg>);

export const FEnergies = () => (
  <Svg h={168} aria="Deux comparaisons : si la vitesse double, l'énergie cinétique est multipliée par quatre ; si l'altitude double, l'énergie potentielle de pesanteur est multipliée par deux">
    <TE x={80} y={18} a="middle" c={BLEU} w={800} parts={['E', '_c', ' = ½ m v²']}/><TE x={220} y={18} a="middle" c={VERT} w={800} parts={['E', '_pp', ' = m g y']}/>
    <Lg x1={150} y1={30} x2={150} y2={140} c="#cbd5e1" w={1.5}/>
    <rect x="36" y="102" width="34" height="16" fill={BLEU} opacity="0.85"/><rect x="86" y="54" width="34" height="64" fill={BLEU} opacity="0.85"/>
    <rect x="176" y="94" width="34" height="24" fill={VERT} opacity="0.85"/><rect x="226" y="70" width="34" height="48" fill={VERT} opacity="0.85"/>
    <Lg x1={24} y1={118} x2={130} y2={118} c={GRIS} w={1.6}/><Lg x1={164} y1={118} x2={274} y2={118} c={GRIS} w={1.6}/>
    <T x={53} y={136} a="middle" w={800}>v</T><T x={103} y={136} a="middle" w={800}>2v</T><T x={193} y={136} a="middle" w={800}>y</T><T x={243} y={136} a="middle" w={800}>2y</T>
    <TE x={80} y={160} a="middle" c={BLEU} w={800} parts={['E', '_c', ' × 4']}/><TE x={220} y={160} a="middle" c={VERT} w={800} parts={['E', '_pp', ' × 2']}/>
  </Svg>);

export const FBilanP = () => (
  <Svg h={166} aria="Trois barres au même instant : énergie potentielle de pesanteur, énergie cinétique, et leur somme l'énergie mécanique, avec une barre d'incertitude">
    <TE x={150} y={18} a="middle" w={800} parts={['E', '_m', ' = E', '_c', ' + E', '_pp']}/><TE x={150} y={36} a="middle" c={GRIS} parts={['u(E', '_m', ') = 7 % de E', '_m']}/>
    <rect x="30" y="78" width="50" height="52" fill={VERT} opacity="0.85"/><rect x="120" y="112" width="50" height="18" fill={BLEU} opacity="0.85"/><rect x="210" y="60" width="50" height="70" fill="#475569" opacity="0.85"/>
    <Lg x1={235} y1={48} x2={235} y2={72} c={ENCRE} w={2.6}/><Lg x1={228} y1={48} x2={242} y2={48} c={ENCRE} w={2.6}/><Lg x1={228} y1={72} x2={242} y2={72} c={ENCRE} w={2.6}/>
    <Lg x1={16} y1={130} x2={284} y2={130} c={GRIS} w={1.6}/>
    <TE x={55} y={150} a="middle" c={VERT} w={800} parts={['E', '_pp']}/><TE x={145} y={150} a="middle" c={BLEU} w={800} parts={['E', '_c']}/><TE x={235} y={150} a="middle" w={800} parts={['E', '_m', ' ± u']}/>
  </Svg>);

export const FCompat = () => (
  <Svg h={178} aria="Deux cas : à gauche, deux mesures d'énergie mécanique dont les barres d'incertitude se recouvrent, elles sont compatibles ; à droite, les barres sont séparées, elles sont incompatibles">
    <T x={72} y={18} a="middle" c={VERT} w={800}>compatibles</T><T x={226} y={18} a="middle" c={ROUGE} w={800}>incompatibles</T>
    <Lg x1={150} y1={28} x2={150} y2={120} c="#cbd5e1" w={1.5}/>
    {[[46, 74, VERT], [100, 86, VERT], [190, 62, ROUGE], [262, 112, ROUGE]].map(([x, y, c]) => <g key={x}><Lg x1={x} y1={y - 22} x2={x} y2={y + 22} c={c} w={3.4}/><circle cx={x} cy={y} r="5" fill={c}/></g>)}
    <Lg x1={30} y1={64} x2={116} y2={64} c={VERT} w={1.4} d="3 3"/>
    <Lg x1={172} y1={84} x2={280} y2={84} c={ROUGE} w={1.4} d="3 3"/>
    <TE x={46} y={146} a="middle" w={800} parts={['E', '_m', '(1)']}/><TE x={100} y={146} a="middle" w={800} parts={['E', '_m', '(2)']}/><TE x={190} y={146} a="middle" w={800} parts={['E', '_m', '(1)']}/><TE x={262} y={146} a="middle" w={800} parts={['E', '_m', '(2)']}/>
    <T x={150} y={170} a="middle" c={GRIS}>écart ≤ √(u₁² + u₂²) ⇒ compatibles</T>
  </Svg>);

export const FChaine = () => {
  const lignes = [['Pointer', ['positions en pixels']], ['Échelle', ['pixels × échelle = mètres']], ['Vitesse', ['v ≈ M(i−1)M(i+1) ÷ 2τ']], ['Énergies', ['E', '_c', ' = ½ m v² ; E', '_pp', ' = m g y']], ['Incertitude', ['comparer l’écart à u']]];
  return (
    <Svg h={236} aria="Chaîne de la méthode : pointer, convertir avec l'échelle, calculer la vitesse, calculer les énergies, comparer l'écart à l'incertitude">
      {lignes.map(([a, b], i) => <g key={a}>
        <rect x="10" y={6 + i * 44} width="280" height="38" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
        <circle cx="30" cy={25 + i * 44} r="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/><T x={30} y={30 + i * 44} a="middle" c={ORANGE} w={800}>{i + 1}</T>
        <T x={48} y={23 + i * 44} w={800}>{a}</T><TE x={48} y={38 + i * 44} c={GRIS} parts={b}/></g>)}
    </Svg>);
};
