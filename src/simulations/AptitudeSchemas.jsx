// Schémas des cartes « À retenir » de la simulation 16 (essais d'aptitude, z-scores). viewBox de 300, texte de 12,5.
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
const bell = (z) => Math.exp(-z * z / 2);
const X = (z) => 150 + z * 36, Y = (z) => 130 - 90 * bell(z);
const aire = (a, b, c, o) => {
  const pts = []; for (let z = a; z <= b + 1e-9; z += 0.1) pts.push(`${X(z).toFixed(1)},${Y(z).toFixed(1)}`);
  return <polygon points={`${X(a)},130 ${pts.join(' ')} ${X(b)},130`} fill={c} opacity={o}/>;
};

export const FZ = () => (
  <Svg h={178} aria="Le z-score compte combien d'écarts-types séparent le résultat d'un laboratoire de la moyenne : avec une moyenne de 10, un écart-type de 2 et un résultat de 14, l'écart de 4 vaut deux écarts-types, donc z égale plus 2">
    <TE x={150} y={16} a="middle" w={800} parts={['z = (x − x̄) ÷ s']}/>
    <Lg x1={20} y1={96} x2={284} y2={96} c={GRIS} w={2}/>
    <Lg x1={90} y1={86} x2={90} y2={106} c={BLEU} w={3}/><Lg x1={150} y1={90} x2={150} y2={102} c={GRIS} w={1.6}/><Lg x1={210} y1={90} x2={210} y2={102} c={GRIS} w={1.6}/>
    <circle cx="210" cy="96" r="7" fill={ORANGE} stroke={ENCRE} strokeWidth="2"/>
    <Lg x1={92} y1={66} x2={148} y2={66} c={GRIS} w={2}/><Lg x1={152} y1={66} x2={208} y2={66} c={GRIS} w={2}/>
    <T x={120} y={58} a="middle" c={GRIS} w={800}>s</T><T x={180} y={58} a="middle" c={GRIS} w={800}>s</T>
    <T x={90} y={126} a="middle" c={BLEU} w={800}>x̄ = 10</T><T x={210} y={126} a="middle" c={ORANGE} w={800}>x = 14</T>
    <T x={150} y={150} a="middle">x − x̄ = 4 = 2 × s (s = 2)</T>
    <T x={150} y={172} a="middle" c={ORANGE} w={800}>z = +2 : deux écarts-types</T>
  </Svg>);

export const FNormale = () => (
  <Svg h={198} aria="Loi normale centrée réduite : environ 95 pour cent des laboratoires compétents ont une valeur absolue de z inférieure ou égale à 2, et 99,7 pour cent inférieure ou égale à 3">
    <T x={150} y={16} a="middle" w={800}>D’où viennent les seuils 2 et 3</T>
    {aire(-3, -2, ORANGE, 0.7)}{aire(2, 3, ORANGE, 0.7)}{aire(-2, 2, VERT, 0.55)}
    <Lg x1={14} y1={130} x2={286} y2={130} c={GRIS} w={1.8}/>
    <path d={Array.from({ length: 73 }, (_, i) => { const z = -3.6 + i * 0.1; return `${i ? 'L' : 'M'}${X(z).toFixed(1)},${Y(z).toFixed(1)}`; }).join(' ')} fill="none" stroke={ENCRE} strokeWidth="2.4"/>
    {[-3, -2, 0, 2, 3].map(z => <T key={z} x={X(z)} y={148} a="middle" c={GRIS} w={800}>{z === 0 ? '0' : (z < 0 ? '−' : '') + Math.abs(z)}</T>)}
    <T x={150} y={78} a="middle" c="#ffffff" w={800}>95 %</T>
    <T x={150} y={172} a="middle" c={VERT} w={800}>|z| ≤ 2 : environ 95 % des laboratoires</T>
    <T x={150} y={192} a="middle" c={ORANGE} w={800}>|z| ≤ 3 : environ 99,7 %</T>
  </Svg>);

export const FMasque = () => (
  <Svg h={190} aria="Un laboratoire aberrant se masque lui-même : il entre dans le calcul de la moyenne qu'il tire vers lui, et dans celui de l'écart-type qu'il gonfle, donc son propre z-score est trop petit">
    <T x={150} y={16} a="middle" w={800}>Un aberrant se masque</T>
    <Lg x1={14} y1={90} x2={286} y2={90} c={GRIS} w={1.8}/>
    {[56, 64, 70, 78, 84, 92, 98, 106, 112].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 80 : 90} r="5.5" fill={BLEU} stroke={ENCRE} strokeWidth="1.6"/>)}
    <circle cx="250" cy="90" r="7.5" fill={ROUGE} stroke={ENCRE} strokeWidth="2"/><T x={250} y={66} a="middle" c={ROUGE} w={800}>labo 10</T>
    <Lg x1={85} y1={104} x2={85} y2={120} c={GRIS} w={2.4} d="3 3"/><T x={80} y={136} a="end" c={GRIS} w={800}>x̄ sans lui</T>
    <Lg x1={110} y1={104} x2={110} y2={120} c={ORANGE} w={2.8}/><T x={116} y={136} c={ORANGE} w={800}>x̄ avec lui</T>
    <T x={150} y={162} a="middle" w={800}>il tire x̄ et gonfle s</T>
    <T x={150} y={182} a="middle" c={GRIS}>son z est trop petit : remède, l’exclure</T>
  </Svg>);

export const FBorne = () => {
  const D = [[3, 1.15], [5, 1.79], [10, 2.85], [15, 3.61]];
  return (
    <Svg h={210} aria="Valeur maximale possible de la valeur absolue de z quand la moyenne et l'écart-type incluent le laboratoire évalué : 1,15 pour 3 laboratoires, 1,79 pour 5, 2,85 pour 10 et 3,61 pour 15 ; avec 10 laboratoires ou moins, le seuil 3 est inatteignable">
      <T x={150} y={14} a="middle" w={800}>|z| maximal possible</T>
      <Lg x1={14} y1={144} x2={250} y2={144} c={GRIS} w={1.8}/>
      <Lg x1={14} y1={54} x2={250} y2={54} c={ROUGE} w={1.6} d="4 3"/><T x={256} y={58} c={ROUGE} w={800}>3</T>
      <Lg x1={14} y1={84} x2={250} y2={84} c={ORANGE} w={1.6} d="4 3"/><T x={256} y={88} c={ORANGE} w={800}>2</T>
      {D.map(([p, v], i) => <g key={p}><rect x={26 + i * 56} y={144 - 30 * v} width="40" height={30 * v} fill={v < 3 ? BLEU : VERT}/>
        <T x={46 + i * 56} y={144 - 30 * v + 17} a="middle" c="#ffffff" w={800}>{String(v).replace('.', ',')}</T><T x={46 + i * 56} y={162} a="middle" c={GRIS} w={800}>{'p = ' + p}</T></g>)}
      <TE x={150} y={184} a="middle" w={800} parts={['|z| ≤ (p − 1) ÷ √p']}/>
      <T x={150} y={202} a="middle" c={GRIS}>p ≤ 10 : le seuil 3 est inatteignable</T>
    </Svg>);
};

export const FIso = () => (
  <Svg h={190} aria="Deux façons de calculer z : avec la formule du référentiel, la moyenne et l'écart-type des participants se déplacent selon les résultats ; avec la norme ISO 13528, la valeur assignée et l'écart-type d'aptitude sont fixés à l'avance et ne bougent pas">
    <rect x="8" y="8" width="138" height="96" rx="8" fill="#f1f5f9" stroke={ORANGE} strokeWidth="2"/>
    <rect x="154" y="8" width="138" height="96" rx="8" fill="#f1f5f9" stroke={VERT} strokeWidth="2"/>
    <T x={77} y={30} a="middle" w={800}>Référentiel</T><T x={77} y={52} a="middle" c={GRIS}>x̄ et s calculés</T><T x={77} y={70} a="middle" c={GRIS}>sur les participants</T><T x={77} y={92} a="middle" c={ORANGE} w={800}>ils bougent</T>
    <T x={223} y={30} a="middle" w={800}>ISO 13528</T><TE x={223} y={52} a="middle" c={GRIS} parts={['x', '_pt', ' et σ', '_pt', ' fixés']}/><T x={223} y={70} a="middle" c={GRIS}>à l’avance</T><T x={223} y={92} a="middle" c={VERT} w={800}>ils ne bougent pas</T>
    <TE x={150} y={134} a="middle" w={800} parts={['z = (x − x', '_pt', ') ÷ σ', '_pt']}/>
    <T x={150} y={156} a="middle" c={GRIS}>un aberrant ne peut pas les modifier</T>
    <T x={150} y={178} a="middle" c={GRIS}>z &lt; 0 : le laboratoire sous-estime</T>
  </Svg>);

export const FBilanApt = () => {
  const L = [['Le z-score', ['z = (x − x̄) ÷ s, sans unité']], ['Les seuils', ['|z| ≤ 2 ; 2 à 3 ; ≥ 3']], ['Une hypothèse', ['loi normale, à vérifier (Henry)']], ['Un aberrant', ['il se masque : l’exclure']], ['La norme ISO', ['x', '_pt', ' et σ', '_pt', ' fixés à l’avance']]];
  return (
    <Svg h={232} aria="Bilan : le z-score est un écart en nombre d'écarts-types, trois verdicts selon les seuils 2 et 3, une hypothèse de loi normale à vérifier avec la droite de Henry, un laboratoire aberrant qui se masque, et la norme ISO 13528 avec des valeurs fixées à l'avance">
      {L.map(([a, b], i) => <g key={a}>
        <rect x="10" y={6 + i * 44} width="280" height="38" rx="6" fill="#f1f5f9" stroke={GRIS} strokeWidth="1.6"/>
        <circle cx="30" cy={25 + i * 44} r="10" fill="#fff" stroke={ORANGE} strokeWidth="2"/><T x={30} y={30 + i * 44} a="middle" c={ORANGE} w={800}>{i + 1}</T>
        <T x={48} y={23 + i * 44} w={800}>{a}</T><TE x={48} y={38 + i * 44} c={GRIS} parts={b}/></g>)}
    </Svg>);
};
