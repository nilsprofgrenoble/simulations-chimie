// Schémas des cartes « À retenir » de la simulation 76 (RMN du carbone 13, HSQC et COSY). viewBox de 300, texte de 12,5.
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
const SPOT = '#ea580c';

export const FDomaines = () => {
  const B = [[0, 76, '#e0f2fe', ['C=O']], [76, 76, '#fef3c7', ['C=C,', 'aromatique']], [152, 64, '#dcfce7', ['C–O,', 'C–N']], [216, 64, '#f1f5f9', ['alkyle']]];
  return (
    <Svg h={168} aria="Axe du déplacement chimique du carbone 13 de 220 à 0 ppm en quatre domaines : de 160 à 220 les carbonyles C=O, de 100 à 160 les carbones C=C et aromatiques, de 50 à 100 les carbones sp3 liés à O ou N, de 0 à 50 les carbones alkyles">
      <T x={150} y={16} a="middle" w={800}>δC (ppm) : quatre domaines</T>
      {B.map(([x, w, f, t], i) => <g key={i}><rect x={10 + x} y="30" width={w} height="54" fill={f} stroke={GRIS} strokeWidth="1.6"/>
        {t.map((l, k) => <T key={k} x={10 + x + w / 2} y={t.length === 1 ? 62 : 52 + k * 16} a="middle" w={800}>{l}</T>)}</g>)}
      {[[10, '220'], [86, '160'], [162, '100'], [226, '50'], [290, '0']].map(([x, l]) => <g key={l}><Lg x1={x} y1={84} x2={x} y2={92} c={GRIS} w={1.6}/><T x={x} y={108} a={x === 10 ? 'start' : x === 290 ? 'end' : 'middle'} c={GRIS} w={800}>{l}</T></g>)}
      <T x={150} y={136} a="middle" c={ORANGE} w={800}>plus déblindé : δC plus grand</T>
      <T x={150} y={156} a="middle" c={GRIS}>carbone lié à O, N ou doublé à O</T>
    </Svg>);
};

export const FSpectre13C = () => {
  const P = [[209, 24], [37, 62], [29, 78], [7, 68]];
  const X = d => 286 - d * 272 / 220;
  return (
    <Svg h={200} aria="Spectre du carbone 13 découplé de la butanone : un singulet par type de carbone, de 0 à 220 ppm ; le signal du carbone C=O, sans hydrogène, est beaucoup plus petit que les autres, donc la hauteur ne compte pas les carbones">
      <T x={150} y={16} a="middle" w={800}>¹³C découplé : des singulets</T>
      <Lg x1={14} y1={120} x2={290} y2={120} c={GRIS} w={1.8}/>
      {P.map(([d, h]) => <Lg key={d} x1={X(d)} y1={120} x2={X(d)} y2={120 - h} c={BLEU} w={3.4}/>)}
      <T x={14} y={86} c={ORANGE} w={800}>C=O : sans H, petit</T>
      <T x={226} y={44} a="end" c={BLEU} w={800}>autres C : grands</T>
      {[[14, '220', 'start'], [150, '110', 'middle'], [290, '0', 'end']].map(([x, l, a]) => <T key={l} x={x} y={138} a={a} c={GRIS} w={800}>{l}</T>)}
      <T x={150} y={156} a="middle" c={GRIS}>δC (ppm), de 0 à 220</T>
      <T x={150} y={176} a="middle" w={800}>un singulet par type de carbone</T>
      <T x={150} y={192} a="middle" c={GRIS}>la hauteur ne compte pas les carbones</T>
    </Svg>);
};

export const FSymetrie = () => {
  const cx = 110, cy = 96, r = 34;
  const V = [-90, -30, 30, 90, 150, 210].map(a => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)]);
  return (
    <Svg h={208} aria="Le para-xylène a huit carbones mais seulement trois signaux en carbone 13 : les deux carbones qui portent un méthyle sont équivalents, les quatre carbones CH du cycle aussi, et les deux méthyles aussi">
      <T x={150} y={16} a="middle" w={800}>Symétrie : 8 carbones, 3 signaux</T>
      <polygon points={V.map(v => v.join(',')).join(' ')} fill="none" stroke={ENCRE} strokeWidth="2.4"/>
      {V.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="8" fill={i % 3 === 0 ? BLEU : ORANGE} stroke={ENCRE} strokeWidth="1.6"/>)}
      <Lg x1={cx} y1={cy - r - 8} x2={cx} y2={cy - r - 22} c={ENCRE} w={2}/><Lg x1={cx} y1={cy + r + 8} x2={cx} y2={cy + r + 22} c={ENCRE} w={2}/>
      <TE x={cx} y={cy - r - 28} a="middle" c={VERT} w={800} parts={['CH', '_3']}/><TE x={cx} y={cy + r + 40} a="middle" c={VERT} w={800} parts={['CH', '_3']}/>
      <circle cx="196" cy="62" r="6" fill={BLEU} stroke={ENCRE} strokeWidth="1.4"/><T x={208} y={66}>2 C liés</T><T x={208} y={80}>au méthyle</T>
      <circle cx="196" cy="108" r="6" fill={ORANGE} stroke={ENCRE} strokeWidth="1.4"/><T x={208} y={112}>4 C–H</T><T x={208} y={126} c={GRIS}>équivalents</T>
      <circle cx="196" cy="150" r="6" fill={VERT} stroke={ENCRE} strokeWidth="1.4"/><T x={208} y={154}>2 CH₃</T>
      <T x={150} y={198} a="middle" c={GRIS} w={800}>équivalents : un seul signal</T>
    </Svg>);
};

export const FHSQC = () => (
  <Svg h={198} aria="Carte HSQC de l'éthanol : une tache à 3,6 ppm en proton et 58 ppm en carbone pour le CH2, une tache à 1,2 ppm et 18 ppm pour le CH3 ; chaque tache relie un carbone aux hydrogènes qu'il porte directement">
    <T x={150} y={16} a="middle" w={800}>HSQC : un carbone et ses H</T>
    <rect x="56" y="30" width="200" height="104" fill="#f8fafc" stroke={GRIS} strokeWidth="1.8"/>
    <Lg x1={86} y1={52} x2={86} y2={134} c={SPOT} w={1.4} d="3 3"/><Lg x1={56} y1={52} x2={86} y2={52} c={SPOT} w={1.4} d="3 3"/>
    <Lg x1={206} y1={110} x2={206} y2={134} c={SPOT} w={1.4} d="3 3"/><Lg x1={56} y1={110} x2={206} y2={110} c={SPOT} w={1.4} d="3 3"/>
    <circle cx="86" cy="52" r="7" fill={SPOT} stroke={ENCRE} strokeWidth="1.6"/><circle cx="206" cy="110" r="7" fill={SPOT} stroke={ENCRE} strokeWidth="1.6"/>
    <TE x={98} y={46} c={ORANGE} w={800} parts={['CH', '_2']}/><TE x={186} y={100} c={ORANGE} w={800} parts={['CH', '_3']}/>
    <T x={86} y={150} a="middle" c={GRIS} w={800}>3,6</T><T x={206} y={150} a="middle" c={GRIS} w={800}>1,2</T>
    <T x={50} y={56} a="end" c={GRIS} w={800}>58</T><T x={50} y={114} a="end" c={GRIS} w={800}>18</T>
    <T x={156} y={150} a="middle" c={GRIS}>δH</T><T x={20} y={84} a="middle" c={GRIS}>δC</T>
    <T x={150} y={174} a="middle">tache = carbone et H directement liés</T>
    <T x={150} y={192} a="middle" c={GRIS}>carbone sans H : pas de tache</T>
  </Svg>);

export const FCOSY = () => (
  <Svg h={236} aria="Carte COSY de l'éthanol : la diagonale reproduit le spectre du proton, deux taches hors diagonale symétriques à 3,7 et 1,2 ppm montrent que les hydrogènes du CH2 et du CH3 sont couplés, donc portés par des carbones voisins">
    <T x={150} y={16} a="middle" w={800}>COSY : des H voisins</T>
    <rect x="50" y="28" width="190" height="122" fill="#f8fafc" stroke={GRIS} strokeWidth="1.8"/>
    <Lg x1={50} y1={28} x2={240} y2={150} c="#94a3b8" w={1.4} d="4 3"/>
    <rect x="64" y="40" width="112" height="76" fill="none" stroke={SPOT} strokeWidth="1.4" strokeDasharray="3 3"/>
    <circle cx="64" cy="40" r="6" fill={GRIS} stroke={ENCRE} strokeWidth="1.4"/><circle cx="176" cy="116" r="6" fill={GRIS} stroke={ENCRE} strokeWidth="1.4"/>
    <circle cx="176" cy="40" r="7" fill={SPOT} stroke={ENCRE} strokeWidth="1.6"/><circle cx="64" cy="116" r="7" fill={SPOT} stroke={ENCRE} strokeWidth="1.6"/>
    <T x={64} y={164} a="middle" c={GRIS} w={800}>3,7</T><T x={176} y={164} a="middle" c={GRIS} w={800}>1,2</T>
    <T x={44} y={44} a="end" c={GRIS} w={800}>3,7</T><T x={44} y={120} a="end" c={GRIS} w={800}>1,2</T>
    <T x={150} y={188} a="middle" c={GRIS}>diagonale : le spectre ¹H</T>
    <T x={150} y={206} a="middle" c={ORANGE} w={800}>hors diagonale : H couplés</T>
    <T x={150} y={224} a="middle" c={GRIS}>carte symétrique : compter une fois</T>
  </Svg>);

export const FDemarche = () => {
  const L = [['Formule brute', ['nombre de signaux ¹³C']], ['Domaines de δC', ['type de chaque carbone']], ['HSQC', ['chaque carbone et ses H']], ['COSY', ['enchaîner les groupes voisins']], ['Spectre ¹H', ['vérifier : intégration, multiplicité']]];
  return (
    <Svg h={232} aria="Démarche complète en cinq étapes : formule brute et nombre de signaux carbone 13, domaines de déplacement chimique, HSQC, COSY, puis vérification avec le spectre du proton">
      {L.map(([a, b], i) => <g key={a}>
        <rect x="10" y={6 + i * 44} width="280" height="38" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
        <circle cx="30" cy={25 + i * 44} r="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/><T x={30} y={30 + i * 44} a="middle" c={ORANGE} w={800}>{i + 1}</T>
        <T x={48} y={23 + i * 44} w={800}>{a}</T><TE x={48} y={38 + i * 44} c={GRIS} parts={b}/></g>)}
    </Svg>);
};
