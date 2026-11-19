// Schémas des cartes « À retenir » de la simulation 107 (énergies cinétique, potentielle et mécanique). viewBox de 300, texte de 12,5.
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
const Bille = ({ x, y, c = '#fde68a' }) => <circle cx={x} cy={y} r="7" fill={c} stroke={ENCRE} strokeWidth="2"/>;

export const FDef = () => (
  <Svg h={178} aria="Bille sur une cuvette : en haut, l'énergie potentielle est maximale et l'énergie cinétique nulle ; au point bas, l'énergie cinétique est maximale et l'énergie potentielle nulle ; l'énergie mécanique est la somme des deux">
    <TE x={150} y={16} a="middle" w={800} parts={['E', '_m', ' = E', '_c', ' + E', '_pp']}/>
    <path d="M20,40 Q150,200 280,40" fill="none" stroke={ENCRE} strokeWidth="3"/>
    <Bille x={42} y={58}/><Bille x={150} y={110}/>
    <Fleche x1={162} y1={110} x2={206} y2={110} c={VERT} w={2.6}/><T x={214} y={106} c={VERT} w={800}>v</T><Fleche x1={212} y1={95} x2={224} y2={95} c={VERT} w={2}/>
    <TE x={10} y={148} c={VERT} w={800} parts={['en haut : E', '_pp', ' max, E', '_c', ' = 0']}/>
    <TE x={10} y={168} c={BLEU} w={800} parts={['en bas : E', '_c', ' max, E', '_pp', ' = 0']}/>
  </Svg>);

export const FConserv = () => (
  <Svg h={176} aria="Trois positions de la bille sans frottement : à chaque fois, la barre verte de l'énergie potentielle et la barre bleue de l'énergie cinétique forment la même hauteur totale, l'énergie mécanique">
    <TE x={150} y={18} a="middle" w={800} parts={['Sans frottement : E', '_m', ' se conserve']}/>
    <TE x={150} y={36} a="middle" c={GRIS} parts={['E', '_pp', ' devient E', '_c', ', sans perte']}/>
    <Lg x1={14} y1={132} x2={286} y2={132} c={GRIS} w={1.6}/><Lg x1={14} y1={52} x2={286} y2={52} c={ENCRE} w={1.6} d="4 4"/>
    {[[40, 80, 0], [135, 40, 40], [230, 0, 80]].map(([x, ep, ec], i) => <g key={i}>
      <rect x={x} y={132 - ep - ec} width="32" height={ep} fill={VERT} opacity="0.85"/><rect x={x} y={132 - ec} width="32" height={ec} fill={BLEU} opacity="0.85"/></g>)}
    <T x={56} y={150} a="middle" w={800}>haut</T><T x={151} y={150} a="middle" w={800}>milieu</T><T x={246} y={150} a="middle" w={800}>bas</T>
    <TE x={40} y={170} c={VERT} w={800} parts={['E', '_pp', ' en vert']}/><TE x={200} y={170} c={BLEU} w={800} parts={['E', '_c', ' en bleu']}/>
  </Svg>);

export const FPerte = () => (
  <Svg h={178} aria="Avec frottement, l'énergie mécanique diminue régulièrement quand la distance parcourue s augmente : le travail du frottement est négatif et l'énergie perdue devient de l'énergie thermique">
    <TE x={150} y={18} a="middle" w={800} parts={['Avec frottement : E', '_m', ' diminue']}/>
    <Lg x1={36} y1={124} x2={284} y2={124} c={GRIS} w={2}/><Lg x1={36} y1={124} x2={36} y2={40} c={GRIS} w={2}/>
    <Lg x1={36} y1={56} x2={280} y2={56} c="#94a3b8" w={1.6} d="4 4"/><Lg x1={36} y1={56} x2={270} y2={100} c={ORANGE} w={3.6}/>
    <TE x={44} y={50} c={GRIS} parts={['E', '_m', ' au départ']}/><TE x={120} y={118} c={ORANGE} w={800} parts={['E', '_m', ' diminue']}/>
    <T x={284} y={142} a="end" c={GRIS}>s : distance parcourue</T>
    <TE x={150} y={166} a="middle" w={800} parts={['ΔE', '_m', ' = − f × s  (négatif)']}/>
  </Svg>);

export const FBilan = () => (
  <Svg h={164} aria="Deux situations : sans frottement la bille remonte à la même hauteur ; avec frottement elle s'arrête plus bas">
    <TE x={150} y={16} a="middle" w={800} parts={['E', '_m', ' conservée ou E', '_m', ' diminue']}/>
    <path d="M10,50 Q75,170 140,50" fill="none" stroke={ENCRE} strokeWidth="3"/><path d="M160,50 Q225,170 290,50" fill="none" stroke={ENCRE} strokeWidth="3"/>
    <Lg x1={6} y1={50} x2={146} y2={50} c={BLEU} w={1.6} d="4 3"/><Lg x1={156} y1={50} x2={296} y2={50} c={BLEU} w={1.6} d="4 3"/>
    <Bille x={136} y={50} c="#bbf7d0"/><Bille x={278} y={68} c="#fed7aa"/>
    <T x={75} y={136} a="middle" c={VERT} w={800}>sans frottement :</T><T x={75} y={154} a="middle" c={VERT} w={800}>même hauteur</T>
    <T x={225} y={136} a="middle" c={ORANGE} w={800}>avec frottement :</T><T x={225} y={154} a="middle" c={ORANGE} w={800}>moins haut</T>
  </Svg>);
